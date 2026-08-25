/* Payroll — weekly hours × hourly rate per person: what's owed, what's been
   paid out, and the full per-day detail behind every week. Lives as the
   Payroll tab of Approvals & Expenses on desktop and its own menu entry on
   mobile; one responsive card layout serves both.
   Data: time_entries (submitted/approved/synced/paid) + profiles.hourly_rate
   (fallback: Rippling pay_rate) + payroll_payments (paid-week snapshots). */

const PR_COUNTED = ['submitted', 'approved', 'synced', 'paid'];
const prMoney = (n) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const prMonday = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const prAddDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const prWeekLabel = (mon) => {
  const a = new Date(mon + 'T12:00:00'), b = new Date(prAddDays(mon, 6) + 'T12:00:00');
  const f = (x) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${f(a)} – ${f(b)}`;
};
const prDayLabel = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function PayrollScreen() {
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 760;
  const me = window.__shieldUser || {};
  const canEdit = ['Admin', 'Staff', 'Manager'].includes(me.role);
  const [raw, setRaw] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [week, setWeek] = React.useState(() => prMonday(new Date()));
  const [open, setOpen] = React.useState({});                 // techId -> expanded

  const load = React.useCallback(() => {
    const t = window.__shieldTime;
    if (!t || !t.payrollData) { setLoading(false); return; }
    t.payrollData().then(r => { setLoading(false); if (r.ok) setRaw(r.data); });
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const { rows, tiles, outstanding } = React.useMemo(() => {
    if (!raw) return { rows: [], tiles: null, outstanding: [] };
    const rateOf = new Map();
    (raw.workers || []).forEach(w => { if (w.profile_id && w.pay_rate != null) rateOf.set(w.profile_id, Number(w.pay_rate)); });
    (raw.profiles || []).forEach(p => { if (p.hourly_rate != null) rateOf.set(p.id, Number(p.hourly_rate)); });
    const nameOf = new Map((raw.profiles || []).map(p => [p.id, p.name || p.email || 'Team member']));
    const payKey = (tid, wk) => tid + '|' + wk;
    const paid = new Map((raw.payments || []).map(p => [payKey(p.tech_id, p.week_start), p]));

    // techId -> weekStart -> [entries]
    const byTechWeek = new Map();
    (raw.entries || []).forEach(e => {
      if (!PR_COUNTED.includes(e.status)) return;
      const wk = prMonday(new Date(e.work_date + 'T12:00:00'));
      const k = payKey(e.tech_id, wk);
      if (!byTechWeek.has(k)) byTechWeek.set(k, { techId: e.tech_id, week: wk, entries: [] });
      byTechWeek.get(k).entries.push(e);
    });

    const build = (g) => {
      const hours = g.entries.reduce((s, e) => s + Number(e.hours || 0), 0);
      const pending = g.entries.filter(e => e.status === 'submitted').reduce((s, e) => s + Number(e.hours || 0), 0);
      const rate = rateOf.has(g.techId) ? rateOf.get(g.techId) : null;
      const pay = paid.get(payKey(g.techId, g.week)) || null;
      const owed = rate != null ? hours * rate : null;
      const days = {};
      g.entries.forEach(e => { (days[e.work_date] = days[e.work_date] || []).push(e); });
      return {
        techId: g.techId, week: g.week, name: nameOf.get(g.techId) || 'Team member',
        hours: +hours.toFixed(2), pending: +pending.toFixed(2), rate, owed, pay,
        days: Object.entries(days).sort((a, b) => a[0] < b[0] ? -1 : 1),
      };
    };

    const rows = [...byTechWeek.values()].filter(g => g.week === week).map(build)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Outstanding = every unpaid week with approved hours (any week in range).
    const outstanding = [...byTechWeek.values()].map(build)
      .filter(r => !r.pay && r.hours > 0 && r.week !== week)
      .sort((a, b) => a.week < b.week ? -1 : 1);

    const owedWk = rows.reduce((s, r) => s + (r.owed || 0), 0);
    const paidWk = rows.reduce((s, r) => s + (r.pay ? Number(r.pay.amount) : 0), 0);
    const outDue = outstanding.reduce((s, r) => s + (r.owed || 0), 0) + rows.filter(r => !r.pay).reduce((s, r) => s + (r.owed || 0), 0);
    const tiles = {
      hours: rows.reduce((s, r) => s + r.hours, 0),
      owed: owedWk, paid: paidWk, outstanding: outDue,
    };
    return { rows, tiles, outstanding };
  }, [raw, week]);

  const editRate = (r) => {
    if (!canEdit) return;
    const v = window.prompt(`Hourly rate for ${r.name} ($/hr):`, r.rate != null ? String(r.rate) : '');
    if (v == null) return;
    const rate = parseFloat(v);
    if (!(rate >= 0)) { shieldToast('Enter a valid rate', 'warn'); return; }
    window.__shieldTime.setHourlyRate(r.techId, rate).then(res => {
      if (res.ok) { shieldToast(`${r.name}: ${prMoney(rate)}/hr saved`, 'ok'); load(); }
      else shieldToast('Could not save rate: ' + res.error, 'warn');
    });
  };

  const togglePaid = (r) => {
    if (!canEdit) return;
    const t = window.__shieldTime;
    if (r.pay) {
      if (!window.confirm(`Un-mark ${r.name}'s week of ${prWeekLabel(r.week)} as paid?`)) return;
      t.unmarkWeekPaid(r.techId, r.week, prAddDays(r.week, 6)).then(res => {
        if (res.ok) { shieldToast('Payment removed', 'ok'); load(); }
        else shieldToast('Could not remove: ' + res.error, 'warn');
      });
      return;
    }
    if (r.rate == null) { shieldToast('Set a rate first — the payout amount needs one', 'warn'); return; }
    if (r.pending > 0 && !window.confirm(`${r.name} still has ${r.pending}h pending approval this week. Mark paid anyway?`)) return;
    const amount = r.hours * r.rate;
    if (!window.confirm(`Mark ${r.name} PAID for ${prWeekLabel(r.week)}: ${r.hours}h × ${prMoney(r.rate)}/hr = ${prMoney(amount)}?`)) return;
    t.markWeekPaid({ techId: r.techId, weekStart: r.week, weekEnd: prAddDays(r.week, 6), hours: r.hours, rate: r.rate, amount }).then(res => {
      if (res.ok) { shieldToast(`Paid — ${r.name} · ${prMoney(amount)}`, 'ok'); load(); }
      else shieldToast('Could not mark paid: ' + res.error, 'warn');
    });
  };

  const stStyle = { flex: 1, minWidth: 120, padding: '12px 14px', borderRadius: 10 };
  const btn = (bg, bd, fg) => ({ padding: '6px 12px', borderRadius: 7, border: `1px solid ${bd}`, background: bg, color: fg, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' });

  const statusChip = (e) => {
    const c = { submitted: 'var(--status-warn)', approved: 'var(--status-ok)', synced: 'var(--status-ok)', paid: 'var(--brand)' }[e.status] || 'var(--text-low)';
    return <span style={{ fontSize: 9, fontWeight: 700, color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '1px 6px', textTransform: 'uppercase' }}>{e.status}</span>;
  };

  const renderRow = (r, showWeek) => {
    const key = r.techId + r.week;
    const expanded = !!open[key];
    return (
      <div key={key} className="glass" style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setOpen(o => ({ ...o, [key]: !expanded }))}
            style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 13, cursor: 'pointer', padding: 2, width: 22 }}>{expanded ? '▾' : '▸'}</button>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)' }}>{r.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>
              {showWeek ? prWeekLabel(r.week) + ' · ' : ''}{r.hours}h{r.pending > 0 ? ` (${r.pending}h pending approval)` : ''}
            </div>
          </div>
          <button onClick={() => editRate(r)} title={canEdit ? 'Edit hourly rate' : ''}
            style={{ ...btn('rgba(63,169,245,0.06)', 'var(--border-subtle)', r.rate != null ? 'var(--text-mid)' : 'var(--status-warn)'), cursor: canEdit ? 'pointer' : 'default' }}>
            {r.rate != null ? `${prMoney(r.rate)}/hr` : 'Set rate'}
          </button>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: r.owed != null ? 'var(--text-high)' : 'var(--text-low)', minWidth: 86, textAlign: 'right' }}>
            {r.owed != null ? prMoney(r.owed) : '—'}
          </div>
          {r.pay ? (
            <button onClick={() => togglePaid(r)} title={canEdit ? 'Click to un-mark paid' : ''}
              style={btn('rgba(52,211,153,0.1)', 'rgba(52,211,153,0.4)', 'var(--status-ok)')}>
              ✓ Paid {new Date(r.pay.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          ) : canEdit ? (
            <button onClick={() => togglePaid(r)} style={btn('rgba(63,169,245,0.1)', 'var(--border-strong)', 'var(--brand)')}>Mark paid</button>
          ) : (
            <span style={{ fontSize: 10.5, color: 'var(--status-warn)', fontWeight: 700 }}>UNPAID</span>
          )}
        </div>
        {expanded && (
          <div style={{ marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            {r.days.map(([date, entries]) => (
              <div key={date} style={{ padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-high)', minWidth: 108 }}>{prDayLabel(date)}</div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>
                    {entries.reduce((s, e) => s + Number(e.hours || 0), 0).toFixed(2)}h
                  </div>
                  {r.rate != null && <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)' }}>
                    {prMoney(entries.reduce((s, e) => s + Number(e.hours || 0), 0) * r.rate)}
                  </div>}
                </div>
                {entries.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0 0 12px' }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-mid)', minWidth: 42 }}>{Number(e.hours).toFixed(2)}h</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-mid)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.job_ref || 'No job'}{e.notes ? ` — ${e.notes}` : ''}
                    </span>
                    {statusChip(e)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Summary tiles */}
      {tiles && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            ['THIS WEEK HOURS', tiles.hours.toFixed(1) + 'h', 'var(--text-high)'],
            ['OWED THIS WEEK', prMoney(tiles.owed), 'var(--brand)'],
            ['PAID OUT (WK)', prMoney(tiles.paid), 'var(--status-ok)'],
            ['OUTSTANDING (ALL)', prMoney(tiles.outstanding), tiles.outstanding > 0 ? 'var(--status-warn)' : 'var(--text-low)'],
          ].map(([l, v, c]) => (
            <div key={l} className="glass" style={stStyle}>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-low)' }}>{l}</div>
              <div className="mono" style={{ fontSize: isNarrow ? 15 : 18, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Week navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => setWeek(w => prAddDays(w, -7))} style={btn('rgba(10,14,20,0.6)', 'var(--border-subtle)', 'var(--text-mid)')}>‹ Prev</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>
          Week of {prWeekLabel(week)}{week === prMonday(new Date()) ? ' · current' : ''}
        </div>
        <button onClick={() => setWeek(w => prAddDays(w, 7))} style={btn('rgba(10,14,20,0.6)', 'var(--border-subtle)', 'var(--text-mid)')}>Next ›</button>
      </div>

      {loading && <div className="glass" style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-low)' }}>Loading payroll…</div>}
      {!loading && rows.length === 0 && (
        <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💵</div>
          <div style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 4 }}>No hours logged this week</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>Submitted and approved time entries roll up here per person, with rate × hours.</div>
        </div>
      )}
      {rows.map(r => renderRow(r, false))}

      {/* Prior unpaid weeks */}
      {outstanding.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="label-sm" style={{ marginBottom: 8, color: 'var(--status-warn)' }}>OUTSTANDING — UNPAID PRIOR WEEKS</div>
          {outstanding.map(r => renderRow(r, true))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PayrollScreen });

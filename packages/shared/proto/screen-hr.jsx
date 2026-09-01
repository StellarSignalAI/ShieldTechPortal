/* HR Center — Rippling-backed HR / payroll / labor-cost / hiring / business
   intelligence. Six tabs: People, Payroll Center, Hiring, Insights, Audit,
   Setup. All Rippling traffic and every approval decision happen server-side
   in the `hr` edge function (window.__shieldHR); this UI never sees a token.
   Every displayed dollar comes from window.__shieldLaborCalc or a stored
   snapshot with provenance — nothing here invents a number. */

const hrMoney = (n) => n == null ? '—' : '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hrDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const hrWhen = (iso) => iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
const hrBtn = (bg, bd, fg) => ({ padding: '6px 12px', borderRadius: 7, border: `1px solid ${bd}`, background: bg, color: fg, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' });
const hrBtnPrimary = () => hrBtn('rgba(63,169,245,0.1)', 'var(--border-strong)', 'var(--brand)');
const hrBtnQuiet = () => hrBtn('rgba(10,14,20,0.6)', 'var(--border-subtle)', 'var(--text-mid)');
const hrInput = { padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'rgba(10,14,20,0.6)', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)' };
const hrIsAdmin = () => (window.__shieldUser || {}).role === 'Admin';

function HRSevChip({ sev }) {
  const c = { critical: 'var(--status-crit, #f87171)', warn: 'var(--status-warn)', info: 'var(--text-low)' }[sev] || 'var(--text-low)';
  return <span style={{ fontSize: 9, fontWeight: 700, color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '1px 6px', textTransform: 'uppercase' }}>{sev}</span>;
}

function HREmpty({ icon, title, sub }) {
  return (
    <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>{sub}</div>
    </div>
  );
}

/* ── People — Rippling worker roster + linkage ─────────────────────────── */
function HRPeopleScreen() {
  const hr = window.__shieldHR;
  const [rows, setRows] = React.useState(null);
  const [profiles, setProfiles] = React.useState([]);
  const [syncing, setSyncing] = React.useState(false);
  const [open, setOpen] = React.useState({});

  const load = React.useCallback(() => {
    hr.workers().then(r => setRows(r.data || []));
    window.__shieldSupabase?.from?.('profiles')?.select?.('id,name,email,role')
      ?.then?.(r => setProfiles(r.data || []));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const syncNow = () => {
    setSyncing(true);
    hr.syncWorkers().then(r => {
      setSyncing(false);
      if (r.ok) { shieldToast(`Rippling sync: ${r.data.upserted} workers updated, ${r.data.linked} linked${r.data.conflicts ? `, ${r.data.conflicts} conflicts` : ''}`, 'ok'); load(); }
      else shieldToast(r.error || 'Sync failed', 'warn');
    });
  };

  const link = (w) => {
    if (!hrIsAdmin()) return;
    const options = profiles.map((p, i) => `${i + 1}. ${p.name || p.email} (${p.role})`).join('\n');
    const v = window.prompt(`Link Rippling worker "${w.name || w.email}" to which portal profile?\n\n${options}\n\nEnter a number (blank to unlink):`);
    if (v == null) return;
    const idx = parseInt(v, 10) - 1;
    const profileId = v.trim() === '' ? null : (profiles[idx] ? profiles[idx].id : undefined);
    if (profileId === undefined) { shieldToast('Not a valid choice', 'warn'); return; }
    hr.linkWorker(w.rippling_worker_id, profileId).then(r => {
      if (r.ok) { shieldToast(profileId ? 'Linked' : 'Unlinked', 'ok'); load(); }
      else shieldToast(r.error || 'Failed', 'warn');
    });
  };

  const nameOf = new Map(profiles.map(p => [p.id, p.name || p.email]));
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, fontSize: 11.5, color: 'var(--text-low)' }}>
          {rows ? `${rows.length} Rippling worker${rows.length === 1 ? '' : 's'} · ${rows.filter(w => w.profile_id).length} linked to portal profiles` : 'Loading…'}
        </div>
        <button onClick={syncNow} disabled={syncing} style={hrBtnPrimary()}>{syncing ? 'Syncing…' : '⟳ Sync from Rippling'}</button>
      </div>
      {rows && rows.length === 0 && (
        <HREmpty icon="👥" title="No Rippling workers synced yet"
          sub="Configure the Rippling API token (Setup tab), then Sync from Rippling to pull the roster." />
      )}
      {(rows || []).map(w => {
        const expanded = !!open[w.rippling_worker_id];
        return (
          <div key={w.rippling_worker_id} className="glass" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setOpen(o => ({ ...o, [w.rippling_worker_id]: !expanded }))}
                style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 13, cursor: 'pointer', padding: 2, width: 22 }}>{expanded ? '▾' : '▸'}</button>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)' }}>{w.name || w.email || w.rippling_worker_id}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>
                  {[w.title, w.department, w.employment_type].filter(Boolean).join(' · ') || 'No role details from Rippling'}
                </div>
              </div>
              {w.status && <span style={{ fontSize: 9.5, fontWeight: 700, color: w.status === 'ACTIVE' ? 'var(--status-ok)' : 'var(--status-warn)' }}>{w.status}</span>}
              <button onClick={() => link(w)} style={{ ...hrBtnQuiet(), color: w.profile_id ? 'var(--status-ok)' : 'var(--status-warn)', cursor: hrIsAdmin() ? 'pointer' : 'default' }}
                title={hrIsAdmin() ? 'Change portal link' : ''}>
                {w.profile_id ? `↔ ${nameOf.get(w.profile_id) || 'Linked'}${w.match_method === 'manual' ? ' (manual)' : ''}` : 'Not linked'}
              </button>
            </div>
            {expanded && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {[['Email', w.email || '—'], ['Pay rate', w.pay_rate != null ? `${hrMoney(w.pay_rate)}/hr (${w.pay_currency || 'USD'})` : 'Not shared'],
                  ['Start date', hrDate(w.start_date)], ['End date', hrDate(w.end_date)],
                  ['Last synced', hrWhen(w.last_synced)], ['Rippling ID', w.rippling_worker_id]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)' }}>{l.toUpperCase()}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2, overflowWrap: 'anywhere' }}>{v}</div>
                  </div>
                ))}
                {w.sync_error && <div style={{ gridColumn: '1 / -1', fontSize: 10.5, color: 'var(--status-warn)' }}>⚠ {w.sync_error}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Payroll Center — prep, exceptions, history, trends ─────────────────── */
function HRPayrollCenterScreen() {
  const hr = window.__shieldHR;
  const monday = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const [start, setStart] = React.useState(() => monday(new Date()));
  const [end, setEnd] = React.useState(() => addDays(monday(new Date()), 6));
  const [snaps, setSnaps] = React.useState([]);
  const [exs, setExs] = React.useState(null);
  const [busy, setBusy] = React.useState('');
  const [view, setView] = React.useState(null); // snapshot being inspected

  const load = React.useCallback(() => {
    hr.snapshots().then(r => setSnaps(r.data || []));
    hr.exceptions('open').then(r => setExs(r.data || []));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const prepare = () => {
    setBusy('prep');
    hr.preparePayroll(start, end).then(r => {
      setBusy('');
      if (r.ok) { shieldToast('Payroll snapshot prepared', 'ok'); setView(r.data); load(); }
      else shieldToast(r.error || 'Failed', 'warn');
    });
  };
  const runEx = () => {
    setBusy('ex');
    hr.runExceptions().then(r => {
      setBusy('');
      if (r.ok) { shieldToast(`Exception scan: ${r.data.found} found`, 'ok'); load(); }
      else shieldToast(r.error || 'Failed', 'warn');
    });
  };
  const setEx = (id, status) => hr.setExceptionStatus(id, status).then(r => {
    if (r.ok) load(); else shieldToast(r.error || 'Failed', 'warn');
  });

  const prior = view ? snaps.find(s => s.id !== view.id && s.period_end < view.period_start) : null;
  const cmp = (field) => {
    if (!view || !prior) return null;
    const a = Number(view.totals?.[field]) || 0, b = Number(prior.totals?.[field]) || 0;
    if (!b) return null;
    const pct = ((a - b) / b) * 100;
    return <span style={{ fontSize: 10, color: Math.abs(pct) > 25 ? 'var(--status-warn)' : 'var(--text-low)' }}> {pct >= 0 ? '+' : ''}{pct.toFixed(0)}% vs prior</span>;
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Prep controls */}
      <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>PREPARE A PAY PERIOD</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={hrInput} />
          <span style={{ color: 'var(--text-low)', fontSize: 12 }}>→</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={hrInput} />
          <button onClick={prepare} disabled={busy === 'prep'} style={hrBtnPrimary()}>{busy === 'prep' ? 'Calculating…' : 'Prepare snapshot'}</button>
          <button onClick={runEx} disabled={busy === 'ex'} style={hrBtnQuiet()}>{busy === 'ex' ? 'Scanning…' : 'Run exception scan'}</button>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 8 }}>
          Snapshots compute hours, weekly-OT split, gross and fully-loaded cost from time entries × rates × your burden
          config. Submitting/finalizing the actual pay run happens in Rippling — this system prepares, validates and
          records the approval; it never submits payroll on its own.
        </div>
      </div>

      {/* Exceptions */}
      <div className="label-sm" style={{ margin: '4px 0 8px' }}>OPEN EXCEPTIONS {exs ? `(${exs.length})` : ''}</div>
      {exs && exs.length === 0 && <div className="glass" style={{ padding: 14, fontSize: 11.5, color: 'var(--status-ok)', marginBottom: 12 }}>✓ No open payroll exceptions</div>}
      {(exs || []).map(x => (
        <div key={x.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <HRSevChip sev={x.severity} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{x.rule.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>
              {x.week_start ? `Week of ${hrDate(x.week_start)} · ` : ''}{Object.entries(x.details || {}).filter(([k]) => k !== 'entry_ids').map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ') || '—'}
            </div>
          </div>
          <button onClick={() => setEx(x.id, 'acknowledged')} style={hrBtnQuiet()}>Ack</button>
          <button onClick={() => setEx(x.id, 'resolved')} style={hrBtn('rgba(52,211,153,0.1)', 'rgba(52,211,153,0.4)', 'var(--status-ok)')}>Resolve</button>
        </div>
      ))}

      {/* Snapshot history */}
      <div className="label-sm" style={{ margin: '16px 0 8px' }}>SNAPSHOTS</div>
      {snaps.length === 0 && <HREmpty icon="🧾" title="No payroll snapshots yet" sub="Prepare a pay period above to build the first one." />}
      {snaps.map(s => (
        <div key={s.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', cursor: 'pointer' }}
          onClick={() => setView(view && view.id === s.id ? null : s)}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{hrDate(s.period_start)} – {hrDate(s.period_end)}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{s.totals?.workers || 0} workers · {s.totals?.hours || 0}h ({s.totals?.overtime || 0}h OT) · prepared {hrWhen(s.created_at)}</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: s.totals?.completeness === 'complete' ? 'var(--status-ok)' : 'var(--status-warn)' }}>
            {(s.totals?.completeness || 'partial').toUpperCase()}
          </span>
          <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{hrMoney(s.totals?.loaded ?? s.totals?.gross)}</div>
        </div>
      ))}

      {/* Snapshot detail + comparison */}
      {view && (
        <div className="glass" style={{ padding: 14, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
            {[['HOURS', view.totals?.hours, 'hours'], ['OT HOURS', view.totals?.overtime, 'overtime'],
              ['GROSS', hrMoney(view.totals?.gross), 'gross'], ['LOADED', hrMoney(view.totals?.loaded), 'loaded']].map(([l, v, f]) => (
              <div key={l}>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-low)' }}>{l}</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>{v ?? '—'}{cmp(f)}</div>
              </div>
            ))}
          </div>
          {Number(view.totals?.missing_rates) > 0 && (
            <div style={{ fontSize: 11, color: 'var(--status-warn)', marginBottom: 8 }}>
              ⚠ {view.totals.missing_rates} worker(s) have no pay rate — their cost is not included, so the total is incomplete (not estimated).
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead><tr style={{ color: 'var(--text-low)', textAlign: 'left' }}>
                {['Worker', 'Hours', 'OT', 'Rate', 'Gross', 'Loaded', ''].map(h => <th key={h} style={{ padding: '4px 8px', fontWeight: 600, fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(view.per_worker || []).map(w => (
                  <tr key={w.tech_id} style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-mid)' }}>
                    <td style={{ padding: '5px 8px', color: 'var(--text-high)' }}>{w.name || w.tech_id}</td>
                    <td className="mono" style={{ padding: '5px 8px' }}>{w.hours}</td>
                    <td className="mono" style={{ padding: '5px 8px' }}>{w.ot_hours || 0}</td>
                    <td className="mono" style={{ padding: '5px 8px' }}>{w.rate != null ? hrMoney(w.rate) : '—'}</td>
                    <td className="mono" style={{ padding: '5px 8px' }}>{hrMoney(w.gross)}</td>
                    <td className="mono" style={{ padding: '5px 8px' }}>{hrMoney(w.loaded)}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--status-warn)', fontSize: 10 }}>{(w.flags || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Hiring — proposals + the human-approval pipeline ───────────────────── */
function HRHiringScreen() {
  const hr = window.__shieldHR;
  const [acts, setActs] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', title: '', employment_type: 'FULL_TIME', rate: '', start_date: '', notes: '' });
  const [busy, setBusy] = React.useState('');
  const load = React.useCallback(() => { hr.actions().then(r => setActs(r.data || [])); }, []);
  React.useEffect(() => { load(); }, [load]);

  const propose = () => {
    if (!form.name.trim() || !form.title.trim()) { shieldToast('Name and title are required', 'warn'); return; }
    const rate = form.rate ? parseFloat(form.rate) : null;
    if (form.rate && !(rate >= 0)) { shieldToast('Rate must be a number', 'warn'); return; }
    setBusy('hire');
    hr.proposeAction({
      kind: 'hire_draft',
      summary: `Hire ${form.name.trim()} — ${form.title.trim()}${rate != null ? ` @ ${hrMoney(rate)}/hr` : ''}`,
      payload: { ...form, rate, name: form.name.trim(), title: form.title.trim() },
    }).then(r => {
      setBusy('');
      if (r.ok) { shieldToast('Hire proposal created — awaiting Admin approval', 'ok'); setForm({ name: '', title: '', employment_type: 'FULL_TIME', rate: '', start_date: '', notes: '' }); load(); }
      else shieldToast(r.error || 'Failed', 'warn');
    });
  };

  const move = (id, verb) => {
    const fn = { approve: hr.approveAction, reject: hr.rejectAction, execute: hr.executeAction }[verb];
    setBusy(id + verb);
    fn(id).then(r => {
      setBusy('');
      if (r.ok) {
        if (verb === 'execute' && r.data?.result?.handoff) {
          shieldToast('Package validated — final step happens in Rippling', 'ok');
        } else shieldToast(`Action ${verb}d`, 'ok');
        load();
      } else shieldToast(r.error || 'Failed', 'warn');
    });
  };

  const stColor = { awaiting_approval: 'var(--status-warn)', approved: 'var(--brand)', executing: 'var(--brand)', completed: 'var(--status-ok)', failed: 'var(--status-crit, #f87171)', rejected: 'var(--text-low)', expired: 'var(--text-low)', draft: 'var(--text-low)' };
  const F = (k, props) => <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={{ ...hrInput, flex: 1, minWidth: 130 }} {...props} />;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="glass" style={{ padding: 14, marginBottom: 14 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>PROPOSE A NEW HIRE</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {F('name', { placeholder: 'Full name' })}
          {F('title', { placeholder: 'Job title' })}
          <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} style={{ ...hrInput }}>
            {['FULL_TIME', 'PART_TIME', 'CONTRACTOR'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          {F('rate', { placeholder: 'Hourly rate ($)', type: 'number' })}
          {F('start_date', { type: 'date' })}
        </div>
        {F('notes', { placeholder: 'Notes for the approver (team, why, budget line)…' })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={propose} disabled={busy === 'hire'} style={hrBtnPrimary()}>{busy === 'hire' ? 'Creating…' : 'Submit for approval'}</button>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', flex: 1, minWidth: 220 }}>
            Approval and execution are Admin-only and recorded in the audit log. Executing a hire produces the validated
            package and hands off to Rippling — <b>final onboarding action required in Rippling</b>.
          </div>
        </div>
      </div>

      <div className="label-sm" style={{ marginBottom: 8 }}>ACTION PIPELINE</div>
      {acts && acts.length === 0 && <HREmpty icon="🪪" title="No proposed actions" sub="Hires, compensation changes and payroll runs proposed here (or by the AI advisor) wait for human approval before anything happens." />}
      {(acts || []).map(a => (
        <div key={a.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{a.summary}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>
                {a.kind.replace(/_/g, ' ')} · via {a.created_via} · {hrWhen(a.created_at)}{a.approved_at ? ` · approved ${hrWhen(a.approved_at)}` : ''}
              </div>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: stColor[a.status] || 'var(--text-low)', border: `1px solid ${stColor[a.status] || 'var(--text-low)'}`, borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase' }}>
              {a.status.replace(/_/g, ' ')}
            </span>
            {hrIsAdmin() && a.status === 'awaiting_approval' && (<>
              <button onClick={() => move(a.id, 'approve')} disabled={!!busy} style={hrBtn('rgba(52,211,153,0.1)', 'rgba(52,211,153,0.4)', 'var(--status-ok)')}>Approve</button>
              <button onClick={() => move(a.id, 'reject')} disabled={!!busy} style={hrBtnQuiet()}>Reject</button>
            </>)}
            {hrIsAdmin() && a.status === 'approved' && (
              <button onClick={() => move(a.id, 'execute')} disabled={!!busy} style={hrBtnPrimary()}>Execute</button>
            )}
          </div>
          {a.status === 'completed' && a.result?.handoff && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--status-warn)' }}>
              ⚠ {a.result.note} <a href={a.result.deep_link} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>Open Rippling →</a>
            </div>
          )}
          {a.error && <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--status-crit, #f87171)' }}>{a.error}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Insights — business health, forecast, scenarios, advisor ───────────── */
function HRInsightsScreen() {
  const hr = window.__shieldHR;
  const calc = window.__shieldLaborCalc;
  const [briefData, setBriefData] = React.useState(null);
  const [recos, setRecos] = React.useState([]);
  const [cfg, setCfg] = React.useState([]);
  const [busy, setBusy] = React.useState('');
  const [fc, setFc] = React.useState({ backlogHours: '', techs: '', hoursPerTechWeek: '40', utilization: '0.8' });
  const [fcOut, setFcOut] = React.useState(null);
  const [ho, setHo] = React.useState({ extraWeeklyHours: '', avgRate: '', newHireRate: '', weeks: '26', hireFixedCostPerPeriod: '0' });
  const [hoOut, setHoOut] = React.useState(null);
  const [chat, setChat] = React.useState([]);
  const [q, setQ] = React.useState('');

  const load = React.useCallback(() => {
    hr.businessBrief().then(r => { if (r.ok) setBriefData(r.data); });
    hr.recommendations().then(r => setRecos(r.data || []));
    hr.laborConfig().then(r => { if (r.ok) setCfg(r.data.components || []); });
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const refreshMetrics = () => {
    setBusy('m');
    hr.runMetrics().then(r => {
      setBusy('');
      if (r.ok) { shieldToast(`Metrics refreshed (${r.data.snapshots} snapshots)`, 'ok'); load(); }
      else shieldToast(r.error || 'Failed', 'warn');
    });
  };

  const runForecast = () => {
    const out = calc.staffingForecast({ backlogHours: parseFloat(fc.backlogHours), techs: parseFloat(fc.techs), hoursPerTechWeek: parseFloat(fc.hoursPerTechWeek), utilization: parseFloat(fc.utilization) });
    setFcOut(out); hr.saveForecast(out.inputs, out);
  };
  const runHireOt = () => {
    const out = calc.hireVsOvertime({ extraWeeklyHours: parseFloat(ho.extraWeeklyHours), avgRate: parseFloat(ho.avgRate) || null, newHireRate: parseFloat(ho.newHireRate) || null, weeks: parseFloat(ho.weeks), components: cfg, hireFixedCostPerPeriod: parseFloat(ho.hireFixedCostPerPeriod) });
    if (!out) { shieldToast('Both rates are required — the comparison never guesses one', 'warn'); return; }
    setHoOut(out); hr.saveScenario('hire_vs_ot', out.inputs, out);
  };

  const ask = () => {
    const text = q.trim();
    if (!text) return;
    setQ('');
    const history = [...chat, { role: 'user', content: text }];
    setChat([...history, { role: 'assistant', content: '…' }]);
    // Grounded: the model only ever sees real queried metrics, and is told to
    // refuse arithmetic — all figures come from the brief/calculators.
    const context = 'You are the ShieldTech business advisor. Answer ONLY from the grounded data below. ' +
      'Never invent or extrapolate financial values; if a number is not present, say the data is not available. ' +
      'Each metric includes its source and calculation timestamp — cite them.\n\nGROUNDED DATA:\n' +
      JSON.stringify({ brief: briefData, recommendations: recos.slice(0, 10), latest_forecast: fcOut, latest_hire_vs_ot: hoOut }, null, 1).slice(0, 14000);
    window.__shieldAI.shieldAIChat('hr-advisor', history.map(m => ({ role: m.role, content: m.content })), context)
      .then(r => setChat([...history, { role: 'assistant', content: r.text }]));
  };

  const metricLabel = { labor_cost_week: 'Loaded labor cost (this week)', invoiced_month: 'Invoiced (this month)', ar_open: 'Open A/R' };
  const metrics = briefData?.metrics || {};

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Business health */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div className="label-sm" style={{ flex: 1 }}>BUSINESS HEALTH</div>
        <button onClick={refreshMetrics} disabled={busy === 'm'} style={hrBtnQuiet()}>{busy === 'm' ? 'Computing…' : '⟳ Refresh metrics'}</button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.keys(metrics).length === 0 && (
          <div className="glass" style={{ padding: 14, fontSize: 11.5, color: 'var(--text-low)', flex: 1 }}>
            No metric snapshots yet — hit “Refresh metrics”. Labor cost comes from time entries × rates × burden config;
            revenue and A/R come from the QuickBooks sync when it has data.
          </div>
        )}
        {Object.entries(metrics).map(([k, m]) => (
          <div key={k} className="glass" style={{ flex: 1, minWidth: 190, padding: '12px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)' }}>{(metricLabel[k] || k).toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-high)', marginTop: 4 }}>{hrMoney(m.value)}</div>
            <div style={{ fontSize: 9, color: m.meta?.completeness === 'complete' ? 'var(--text-low)' : 'var(--status-warn)', marginTop: 3 }}>
              {m.meta?.source} · {m.meta?.completeness} · {hrWhen(m.meta?.calculated_at)}
            </div>
          </div>
        ))}
      </div>
      {briefData && (
        <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginBottom: 14 }}>
          {briefData.open_exceptions.total} open payroll exception(s) ({briefData.open_exceptions.critical} critical) ·
          {' '}{briefData.awaiting_approval.length} action(s) awaiting approval
        </div>
      )}

      {/* Recommendations (deterministic engine) */}
      {recos.length > 0 && (<>
        <div className="label-sm" style={{ margin: '4px 0 8px' }}>RECOMMENDATIONS</div>
        {recos.map(r => (
          <div key={r.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <HRSevChip sev={r.severity} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{r.title}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{r.body}</div>
            </div>
            <button onClick={() => hr.setRecommendationStatus(r.id, 'dismissed').then(load)} style={hrBtnQuiet()}>Dismiss</button>
          </div>
        ))}
      </>)}

      {/* Staffing forecast */}
      <div className="glass" style={{ padding: 14, marginTop: 10, marginBottom: 12 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>STAFFING FORECAST</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['backlogHours', 'Backlog hours'], ['techs', 'Techs'], ['hoursPerTechWeek', 'Hrs/tech/wk'], ['utilization', 'Utilization (0–1)']].map(([k, l]) => (
            <input key={k} type="number" placeholder={l} value={fc[k]} onChange={e => setFc(f => ({ ...f, [k]: e.target.value }))} style={{ ...hrInput, width: 130 }} />
          ))}
          <button onClick={runForecast} style={hrBtnPrimary()}>Forecast</button>
        </div>
        {fcOut && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-mid)' }}>
            Weekly capacity <b className="mono">{fcOut.weeklyCapacity}h</b> ({fcOut.inputs.techs} techs × {fcOut.inputs.hoursPerTechWeek}h × {fcOut.inputs.utilization} utilization)
            {fcOut.weeksToClear != null ? <> → backlog of {fcOut.inputs.backlogHours}h clears in <b className="mono">{fcOut.weeksToClear} weeks</b>.</> : ' — no capacity with zero techs.'}
            {fcOut.techsForFourWeeks != null && <> Clearing it in 4 weeks needs <b className="mono">{fcOut.techsForFourWeeks} techs</b>.</>}
          </div>
        )}
      </div>

      {/* Hire vs overtime */}
      <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>HIRE VS. OVERTIME</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['extraWeeklyHours', 'Extra hrs/wk'], ['avgRate', 'Current avg $/hr'], ['newHireRate', 'New-hire $/hr'], ['weeks', 'Weeks'], ['hireFixedCostPerPeriod', 'One-time hire cost $']].map(([k, l]) => (
            <input key={k} type="number" placeholder={l} value={ho[k]} onChange={e => setHo(f => ({ ...f, [k]: e.target.value }))} style={{ ...hrInput, width: 130 }} />
          ))}
          <button onClick={runHireOt} style={hrBtnPrimary()}>Compare</button>
        </div>
        {hoOut && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-mid)' }}>
            Covering {hoOut.inputs.extraWeeklyHours}h/wk with OT: <b className="mono">{hrMoney(hoOut.overtime.weekly)}/wk</b> ({hoOut.inputs.extraWeeklyHours}h × {hrMoney(hoOut.inputs.avgRate)} × {hoOut.inputs.otMultiplier}, loaded) → <b className="mono">{hrMoney(hoOut.overtime.total)}</b> over {hoOut.inputs.weeks} weeks.
            {' '}A hire at {hrMoney(hoOut.inputs.newHireRate)}/hr: <b className="mono">{hrMoney(hoOut.hire.weekly)}/wk</b> + {hrMoney(hoOut.inputs.hireFixedCostPerPeriod)} one-time → <b className="mono">{hrMoney(hoOut.hire.total)}</b>.
            {' '}<b style={{ color: hoOut.savingsWithHire > 0 ? 'var(--status-ok)' : 'var(--status-warn)' }}>
              {hoOut.savingsWithHire > 0 ? `Hiring saves ${hrMoney(hoOut.savingsWithHire)}` : `Overtime is cheaper by ${hrMoney(-hoOut.savingsWithHire)}`}
            </b>{hoOut.breakEvenWeeks > 0 && <> (break-even ≈ week {hoOut.breakEvenWeeks})</>}.
          </div>
        )}
      </div>

      {/* Grounded advisor */}
      <div className="glass" style={{ padding: 14 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>AI BUSINESS ADVISOR</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginBottom: 8 }}>
          Answers only from the grounded metrics above (each carries its source and timestamp). It interprets — the
          numbers come from the calculators and snapshots, never from the model. It cannot approve or execute anything.
        </div>
        {chat.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, fontSize: 12, color: m.role === 'user' ? 'var(--brand)' : 'var(--text-mid)', whiteSpace: 'pre-wrap' }}>
            <b style={{ fontSize: 10, textTransform: 'uppercase' }}>{m.role === 'user' ? 'You' : 'Advisor'}</b><br />{m.content}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="e.g. Where is labor cost trending vs what we invoiced?" style={{ ...hrInput, flex: 1 }} />
          <button onClick={ask} style={hrBtnPrimary()}>Ask</button>
        </div>
      </div>
    </div>
  );
}

/* ── Audit — the immutable event log ────────────────────────────────────── */
function HRAuditScreen() {
  const hr = window.__shieldHR;
  const [rows, setRows] = React.useState(null);
  const [filter, setFilter] = React.useState('');
  React.useEffect(() => { hr.auditLog({ action: filter || undefined }).then(r => setRows(r.data || [])); }, [filter]);
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['', 'rippling.', 'payroll.', 'action.', 'integration.', 'business.'].map(f => (
          <button key={f || 'all'} onClick={() => setFilter(f)}
            style={{ ...hrBtnQuiet(), ...(filter === f ? { color: 'var(--brand)', borderColor: 'var(--border-strong)' } : {}) }}>
            {f ? f.replace('.', '') : 'all'}
          </button>
        ))}
      </div>
      {rows && rows.length === 0 && <HREmpty icon="📜" title="No audit events yet" sub="Every sync, flag change, approval, execution and exception run lands here — immutably." />}
      {(rows || []).map(e => (
        <div key={e.id} className="glass" style={{ padding: '8px 14px', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', minWidth: 118 }}>{hrWhen(e.created_at)}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand)' }}>{e.action}</span>
          <span style={{ fontSize: 11, color: 'var(--text-mid)', flex: 1, minWidth: 150 }}>
            {e.actor_name || 'system'}{e.actor_role ? ` (${e.actor_role})` : ''}{e.subject_type ? ` → ${e.subject_type}` : ''}
          </span>
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {JSON.stringify(e.details)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Setup — connection, flags, burden config ───────────────────────────── */
function HRSetupScreen() {
  const hr = window.__shieldHR;
  const [st, setSt] = React.useState(null);
  const [cfg, setCfg] = React.useState(null);
  const load = React.useCallback(() => {
    hr.hrStatus().then(r => { if (r.ok) setSt(r.data); else setSt({ error: r.error }); });
    hr.laborConfig().then(r => { if (r.ok) setCfg(r.data.components || []); });
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const flags = st?.connection?.config || {};
  const flagRows = [
    ['enabled', 'Rippling integration', 'Master switch for sync + HR features'],
    ['writes_enabled', 'Write actions', 'Allow approved actions to execute (rate changes, timecard edits, hand-offs)'],
    ['hiring_enabled', 'Hiring flow', 'Allow approved hire packages to be executed'],
    ['payroll_write_enabled', 'Payroll writes', 'Allow approved payroll-run packages to be executed'],
    ['ai_recommendations_enabled', 'AI recommendations', 'Generate deterministic recommendations for the Insights tab'],
  ];
  const toggle = (k) => {
    if (!hrIsAdmin()) { shieldToast('Admin only', 'warn'); return; }
    hr.setFlags({ [k]: !flags[k] }).then(r => { if (r.ok) load(); else shieldToast(r.error || 'Failed', 'warn'); });
  };

  const addComponent = () => {
    const key = window.prompt('Component key (e.g. payroll_taxes, workers_comp, benefits):');
    if (!key) return;
    const type = window.prompt('Type — percent (of gross), per_hour, or per_period:', 'percent');
    if (!['percent', 'per_hour', 'per_period'].includes(type)) { shieldToast('Type must be percent, per_hour or per_period', 'warn'); return; }
    const value = parseFloat(window.prompt(type === 'percent' ? 'Percent value (e.g. 9.5):' : 'Dollar value:', ''));
    if (!(value >= 0)) { shieldToast('Enter a valid number', 'warn'); return; }
    const next = [...(cfg || []), { key: key.trim(), label: key.trim().replace(/_/g, ' '), type, value, enabled: true }];
    hr.saveLaborConfig(next).then(r => { if (r.ok) { setCfg(next); shieldToast('Saved', 'ok'); } else shieldToast(r.error, 'warn'); });
  };
  const dropComponent = (key) => {
    const next = (cfg || []).filter(c => c.key !== key);
    hr.saveLaborConfig(next).then(r => { if (r.ok) { setCfg(next); shieldToast('Removed', 'ok'); } else shieldToast(r.error, 'warn'); });
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>RIPPLING CONNECTION</div>
        {!st && <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>Checking…</div>}
        {st?.error && <div style={{ fontSize: 11.5, color: 'var(--status-warn)' }}>{st.error}</div>}
        {st && !st.error && (<>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-mid)' }}>
            <span>Token: <b style={{ color: st.configured ? 'var(--status-ok)' : 'var(--status-warn)' }}>{st.configured ? 'configured (server-side)' : 'not configured'}</b></span>
            <span>Status: <b style={{ color: st.connection?.status === 'connected' ? 'var(--status-ok)' : 'var(--text-low)' }}>{st.connection?.status || 'unknown'}</b></span>
            {st.connection?.last_ok_at && <span>Last OK: {hrWhen(st.connection.last_ok_at)}</span>}
          </div>
          {st.connection?.last_error && <div style={{ fontSize: 10.5, color: 'var(--status-warn)', marginTop: 6 }}>{st.connection.last_error}</div>}
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 8 }}>
            The API token lives only in Supabase secrets (<span className="mono">RIPPLING_API_TOKEN</span>, plus optional{' '}
            <span className="mono">RIPPLING_API_VERSION</span>) and is never stored in the database, sent to the browser,
            or displayed anywhere — this screen only ever shows whether it exists. Setup steps: docs/rippling-setup-checklist.md.
          </div>
        </>)}
      </div>

      <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>FEATURE FLAGS {hrIsAdmin() ? '' : '(Admin can change)'}</div>
        {flagRows.map(([k, label, sub]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{label}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{sub}</div>
            </div>
            <button onClick={() => toggle(k)} style={hrBtn(flags[k] ? 'rgba(52,211,153,0.1)' : 'rgba(10,14,20,0.6)', flags[k] ? 'rgba(52,211,153,0.4)' : 'var(--border-subtle)', flags[k] ? 'var(--status-ok)' : 'var(--text-low)')}>
              {flags[k] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8 }}>Every write flag ships OFF by default; nothing executes without a flag and a recorded human approval.</div>
      </div>

      <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div className="label-sm" style={{ flex: 1 }}>LOADED-LABOR BURDEN COMPONENTS</div>
          {hrIsAdmin() && <button onClick={addComponent} style={hrBtnQuiet()}>+ Add</button>}
        </div>
        {(cfg || []).length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>
          None configured — loaded cost currently equals gross pay. Add your real payroll-tax / workers-comp / benefits
          components (percent of gross, $ per hour, or $ per period). Nothing is hardcoded.
        </div>}
        {(cfg || []).map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{c.label || c.key}</div>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>
              {c.type === 'percent' ? `${c.value}% of gross` : c.type === 'per_hour' ? `${hrMoney(c.value)}/hr` : `${hrMoney(c.value)}/period`}
            </span>
            {hrIsAdmin() && <button onClick={() => dropComponent(c.key)} style={hrBtnQuiet()}>✕</button>}
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: 14 }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>RECENT SYNC RUNS</div>
        {(st?.recent_runs || []).length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>No sync runs yet.</div>}
        {(st?.recent_runs || []).map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '5px 0', fontSize: 11.5, color: 'var(--text-mid)', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{hrWhen(r.started_at)}</span>
            <span style={{ fontWeight: 600 }}>{r.kind}</span>
            <span style={{ color: r.status === 'ok' ? 'var(--status-ok)' : r.status === 'error' ? 'var(--status-warn)' : 'var(--text-low)' }}>{r.status}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.stats ? JSON.stringify(r.stats) : ''}</span>
            {r.error && <span style={{ fontSize: 10, color: 'var(--status-warn)' }}>{r.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── The hub ────────────────────────────────────────────────────────────── */
function HRHubScreen() {
  return <HubTabs initial={{ 'hr-payroll': 'paycenter', 'hr-hiring': 'hiring', 'hr-insights': 'insights', 'hr-audit': 'audit', 'hr-setup': 'setup' }[window.__hubScreenId] || 'people'} tabs={[
    { id: 'people', label: 'People', C: HRPeopleScreen },
    { id: 'paycenter', label: 'Payroll Center', C: HRPayrollCenterScreen },
    { id: 'hiring', label: 'Hiring & Actions', C: HRHiringScreen },
    { id: 'insights', label: 'Insights', C: HRInsightsScreen },
    { id: 'audit', label: 'Audit', C: HRAuditScreen },
    { id: 'setup', label: 'Setup', C: HRSetupScreen },
  ]} />;
}

Object.assign(window, { HRHubScreen, HRPeopleScreen, HRPayrollCenterScreen, HRHiringScreen, HRInsightsScreen, HRAuditScreen, HRSetupScreen });

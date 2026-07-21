/* Customer Portal — Flagship features II
   Budget Planner, Multi-Site Command, Drill Mode, Approvals Inbox, Claim Packs */
const { useState, useEffect } = React;

/* ── 6. Refresh Budget Planner ── */
function CustBudgetPlannerView() {
  const [financed, setFinanced] = useState(false);
  const years = [];
  const max = years.length ? Math.max(...years.map(y => y.cost)) : 1;
  const total = years.reduce((s, y) => s + y.cost, 0);
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatCard label="3-YEAR REFRESH TOTAL" value={`$${total.toLocaleString()}`} mono={false} delay={0} />
        <StatCard label="DEVICES AGING OUT" value={String(years.reduce((s, y) => s + y.items.length, 0))} delay={80} />
        <StatCard label="LARGEST SINGLE YEAR" value={years.length ? `$${max.toLocaleString()}` : '—'} mono={false} delay={160} />
      </div>
      <GlassPanel style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)' }}>Planned replacements by year</span>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(63,169,245,0.06)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
            {[['Pay per year', false], ['Finance monthly', true]].map(([label, v]) => (
              <button key={label} onClick={() => setFinanced(v)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', background: financed === v ? 'rgba(63,169,245,0.18)' : 'transparent', color: financed === v ? 'var(--brand)' : 'var(--text-low)' }}>{label}</button>
            ))}
          </div>
        </div>
        {years.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', textAlign: 'center', padding: '30px 0' }}>No refresh plan yet — device ages and end-of-life dates build this forecast automatically.</div>}
        {years.length > 0 && <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', height: 150, padding: '0 10px' }}>
          {years.map(yr => (
            <div key={yr.y} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 6, height: '100%' }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{`$${yr.cost.toLocaleString()}`}</span>
              <div style={{ width: '70%', height: `${financed ? 30 : (yr.cost / max) * 100}%`, minHeight: 8, borderRadius: '6px 6px 0 0', background: financed ? 'linear-gradient(180deg, rgba(52,211,153,0.5), rgba(52,211,153,0.15))' : 'linear-gradient(180deg, rgba(63,169,245,0.55), rgba(63,169,245,0.15))', border: '1px solid var(--border-strong)', borderBottom: 'none', transition: 'height 0.5s ease' }}></div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{yr.y}</span>
            </div>
          ))}
        </div>}
        {financed && years.length > 0 && <div style={{ fontSize: 10, color: 'var(--status-ok)', textAlign: 'center', marginTop: 8 }}>Financing levels the spend — 0% for plan customers</div>}
      </GlassPanel>
      <GlassPanel style={{ padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>What's aging out & why</div>
        {years.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', textAlign: 'center', padding: '14px 0' }}>Nothing aging out yet.</div>}
        {years.map(yr => yr.items.map(item => (
          <div key={item} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)', width: 40 }}>{yr.y}</span>
            <span style={{ fontSize: 12, color: 'var(--text-high)', flex: 1 }}>{item}</span>
          </div>
        )))}
        <button onClick={() => showToast('Plan sent — your account manager will walk you through it', 'ok')} style={{ marginTop: 12, padding: '8px 18px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Email me this plan</button>
      </GlassPanel>
    </div>
  );
}

/* ── 7. Multi-Site Command View ── */
function CustSitesView() {
  const sites = [];
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatCard label="LOCATIONS" value={sites.length} delay={0} />
        <StatCard label="TOTAL DEVICES" value={sites.reduce((s, x) => s + x.devices, 0)} delay={80} />
        <StatCard label="OPEN INCIDENTS" value={sites.reduce((s, x) => s + x.incidents, 0)} delay={160} />
        <StatCard label="PORTFOLIO SCORE" value="—" mono={false} delay={240} />
      </div>
      {sites.length === 0 && <GlassPanel style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No sites yet — locations covered by your ShieldTech service appear here with per-site scores.</GlassPanel>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {sites.map(s => (
          <GlassPanel key={s.name} style={{ padding: 18, border: s.status === 'attention' ? '1px solid rgba(251,191,36,0.3)' : '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="display" style={{ fontSize: 26, fontWeight: 300, color: s.score >= 85 ? 'var(--status-ok)' : s.score >= 75 ? 'var(--brand)' : 'var(--status-warn)' }}>{s.grade}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{s.devices} devices · {s.incidents} open incident{s.incidents === 1 ? '' : 's'}</div>
              </div>
              {s.status === 'attention' && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.1)', borderRadius: 8, padding: '3px 8px', letterSpacing: '0.06em' }}>NEEDS ATTENTION</span>}
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 3, background: s.score >= 85 ? 'var(--status-ok)' : s.score >= 75 ? 'var(--brand)' : 'var(--status-warn)' }}></div>
            </div>
            <button onClick={() => showToast(`Switched to ${s.name}`, 'ok')} style={{ width: '100%', padding: '7px 0', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open site →</button>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

/* ── 8. Drill Mode ── */
function CustDrillView() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const timeline = [
    { t: 'T+0:00', e: 'Drill alarm triggered', who: 'System' },
    { t: 'T+…', e: 'Monitoring center acknowledges', who: 'ShieldTech NOC' },
    { t: 'T+…', e: 'Call placed to primary contact', who: 'NOC' },
    { t: 'T+…', e: 'Contact confirms drill with passcode', who: 'You' },
    { t: 'T+…', e: 'All-clear logged · system re-armed', who: 'NOC' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <GlassPanel style={{ padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Run a drill</div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 14 }}>Test your alarm response without dispatching police. We trigger a simulated alarm, run the real call tree, and time every step.</div>
        <button onClick={() => showToast('Drills run against your live monitoring account once it is connected', 'warn')}
          style={{ width: '100%', padding: '11px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Start drill now
        </button>
        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-low)', lineHeight: 1.6 }}>
          No drills run yet · recommended quarterly
        </div>
      </GlassPanel>
      <GlassPanel style={{ padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>What a drill records</div>
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, background: 'rgba(63,169,245,0.12)' }}></div>
          {timeline.map((row, i) => (
            <div key={i} style={{ position: 'relative', padding: '8px 0' }}>
              <span style={{ position: 'absolute', left: -19, top: 13, width: 10, height: 10, borderRadius: '50%', background: 'rgba(63,169,245,0.2)' }}></span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', width: 52, flexShrink: 0 }}>{row.t}</span>
                <span style={{ fontSize: 12, color: 'var(--text-high)', flex: 1 }}>{row.e}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{row.who}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── 9. Approvals Inbox ── */
function CustApprovalsInboxView() {
  const [items, setItems] = useState([]);
  const act = (id, approve) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, status: approve ? 'approved' : 'declined' } : x));
    showToast(approve ? 'Approved — e-signature recorded' : 'Declined — your account manager will follow up', approve ? 'ok' : 'warn');
  };
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>Everything waiting on your signature, in one place. Approvals are e-signed and land in the audit trail instantly.</div>
      {items.length === 0 && <GlassPanel style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>Nothing waiting on you — quotes, change orders and punch sign-offs land here.</GlassPanel>}
      {items.map(item => (
        <GlassPanel key={item.id} style={{ padding: 18, marginBottom: 12, opacity: item.status === 'pending' ? 1 : 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand)', background: 'rgba(63,169,245,0.1)', borderRadius: 8, padding: '3px 9px' }}>{item.kind.toUpperCase()}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{item.id}</span>
            {item.amount > 0 && <span className="mono" style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>${item.amount.toLocaleString()}</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', marginBottom: 3 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 12 }}>{item.detail}</div>
          {item.status === 'pending' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => act(item.id, true)} style={{ padding: '8px 22px', background: 'linear-gradient(135deg, var(--status-ok), #1f9e6e)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve & sign</button>
              <button onClick={() => act(item.id, false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Decline</button>
              <button onClick={() => showToast('Question sent to your account manager', 'ok')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ask a question</button>
            </div>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: item.status === 'approved' ? 'var(--status-ok)' : 'var(--status-warn)' }}>{item.status === 'approved' ? '✓ Approved — signed electronically' : 'Declined'}</span>
          )}
        </GlassPanel>
      ))}
    </div>
  );
}

/* ── 10. Insurance Claim Pack Generator ── */
function CustClaimPackView() {
  const [building, setBuilding] = useState(null);
  const [ready, setReady] = useState([]);
  const incidents = [];
  const build = (id) => {
    setBuilding(id);
    setTimeout(() => { setBuilding(null); setReady(r => [...r, id]); showToast('Claim pack ready — PDF + evidence ZIP', 'ok'); }, 2200);
  };
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>After an incident, ShieldTech AI compiles everything your insurer asks for — timeline, footage stills, device logs, service records — into one ready-to-send bundle.</div>
      {incidents.length === 0 && <GlassPanel style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No incidents on record — that's a good thing. Claim packs generate here when one occurs.</GlassPanel>}
      {incidents.map(inc => (
        <GlassPanel key={inc.id} style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="warning-tri" size={18} color="var(--status-warn)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{inc.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{inc.date} · <span className="mono">{inc.id}</span> · {inc.evidence}</div>
            </div>
            {ready.includes(inc.id) ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => showToast('Downloading claim pack…', 'ok')} style={{ padding: '7px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 7, color: 'var(--status-ok)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↓ Download pack</button>
                <button onClick={() => showToast('Sent to your insurance contact', 'ok')} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Email insurer</button>
              </div>
            ) : building === inc.id ? (
              <span style={{ fontSize: 11, color: 'var(--brand)' }}>Compiling evidence…</span>
            ) : (
              <button onClick={() => build(inc.id)} style={{ padding: '7px 16px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Generate claim pack</button>
            )}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

Object.assign(window, { CustBudgetPlannerView, CustSitesView, CustDrillView, CustApprovalsInboxView, CustClaimPackView });

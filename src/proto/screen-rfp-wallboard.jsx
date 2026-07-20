/* Screen — RFP / Bid Workspace + NOC Wallboard */

/* ── RFP Workspace ── */
function RFPScreen() {
  const [open, setOpen] = React.useState('rfp-1');
  const rfps = [
    { id: 'rfp-1', agency: 'SF Unified School District', title: 'District-wide Camera Modernization — 12 campuses', due: 'Jun 26', value: 480000, fit: 82, status: 'reviewing',
      summary: ['1,400 cameras across 12 sites, phased over 18 months', 'Mandatory NDAA-compliant hardware (no Hikvision/Dahua)', 'Prevailing wage + 10% retainage', 'Requires C-7 license, $2M bond, 3 K-12 references'],
      checklist: [{ item: 'C-7 License', ok: true }, { item: '$2M performance bond', ok: true }, { item: '3 K-12 references', ok: false, note: 'have 1 (Redwood College pending)' }, { item: 'NDAA-compliant line card', ok: true }, { item: 'Prevailing wage payroll setup', ok: true }] },
    { id: 'rfp-2', agency: 'Port of San Francisco', title: 'Perimeter Intrusion Detection — Piers 80–96', due: 'Jul 8', value: 310000, fit: 64, status: 'new',
      summary: ['Radar + thermal perimeter, marine environment', 'TWIC clearance required for all field staff', '24/7 monitoring SLA with 15-min response'],
      checklist: [{ item: 'TWIC-cleared techs', ok: false, note: '0 of 5 cleared — 6-week lead time' }, { item: 'Thermal/radar experience', ok: true }, { item: '24/7 monitoring center', ok: true }] },
    { id: 'rfp-3', agency: 'City of Oakland', title: 'Access Control Refresh — 6 municipal buildings', due: 'Jul 15', value: 195000, fit: 91, status: 'go',
      summary: ['620 doors, OSDP migration from legacy Wiegand', 'Union site — coordination with city IBEW', 'Strong incumbent displacement opportunity (NPS issues public record)'],
      checklist: [{ item: 'OSDP migration experience', ok: true }, { item: 'Municipal references', ok: true, note: 'City Hall Phase 1 + 2' }, { item: 'Union coordination history', ok: true }] },
  ];
  const statusC = { new: 'var(--brand)', reviewing: 'var(--status-warn)', go: 'var(--status-ok)', 'no-go': 'var(--text-low)' };

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { l: 'OPEN RFPS TRACKED', v: rfps.length }, { l: 'TOTAL VALUE', v: `$${(rfps.reduce((s, r) => s + r.value, 0) / 1000).toFixed(0)}k`, c: 'var(--status-ok)' }, { l: 'RECOMMENDED GO', v: rfps.filter(r => r.fit > 75).length, c: 'var(--brand)' },
        ].map(s => (
          <div key={s.l} className="glass" style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, color: s.c || 'var(--text-high)' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {rfps.map(r => {
        const isOpen = open === r.id;
        const fitC = r.fit > 75 ? 'var(--status-ok)' : r.fit > 55 ? 'var(--status-warn)' : 'var(--status-critical)';
        return (
          <div key={r.id} className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div onClick={() => setOpen(isOpen ? null : r.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
              <div style={{ textAlign: 'center', width: 52, flexShrink: 0 }}>
                <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: fitC }}>{r.fit}</div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)' }}>FIT</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{r.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{r.agency} · due {r.due} · est ${(r.value / 1000).toFixed(0)}k</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: statusC[r.status], background: `color-mix(in srgb, ${statusC[r.status]} 12%, transparent)`, border: `1px solid ${statusC[r.status]}40`, borderRadius: 9, padding: '3px 10px' }}>{r.status}</span>
              <span style={{ color: 'var(--text-low)', fontSize: 12, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
            </div>
            {isOpen && (
              <div style={{ padding: '0 18px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>Hermes Summary</div>
                  {r.summary.map(s => <div key={s} style={{ fontSize: 11, color: 'var(--text-mid)', padding: '3px 0', lineHeight: 1.5 }}>· {s}</div>)}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>Compliance Checklist</div>
                  {r.checklist.map(c => (
                    <div key={c.item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                      <span style={{ fontSize: 11, color: c.ok ? 'var(--status-ok)' : 'var(--status-critical)', width: 14 }}>{c.ok ? '✓' : '✗'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{c.item}</span>
                      {c.note && <span style={{ fontSize: 9, color: 'var(--text-low)' }}>— {c.note}</span>}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => showToast(`${r.agency} marked GO — bid workspace created`, 'ok')} style={{ padding: '6px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 7, color: 'var(--status-ok)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Go — start bid</button>
                    <button onClick={() => showToast('Marked no-go with reason logged', 'warn')} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>No-go</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Sources: SAM.gov, CA eProcure, BayBids — scanned nightly for security/low-voltage scopes within 50 mi</div>
    </div>
  );
}

/* ── NOC Wallboard — full-screen TV mode, auto-rotating panels ── */
function WallboardScreen() {
  const [panel, setPanel] = React.useState(0);
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    const rotate = setInterval(() => setPanel(p => (p + 1) % 3), 9000);
    return () => { clearInterval(clock); clearInterval(rotate); };
  }, []);

  const techs = [
    { id: 'MR', name: 'Mike Reyes', status: 'on-site', where: 'Acme Dental', c: '#34D399' },
    { id: 'JL', name: 'Jessica Liu', status: 'on-site', where: 'Metro Bank', c: '#34D399' },
    { id: 'KW', name: 'Kevin White', status: 'driving', where: '→ Golden Gate Logistics', c: '#3FA9F5' },
    { id: 'TG', name: 'Tony Garcia', status: 'driving', where: '→ Riverside Medical', c: '#3FA9F5' },
    { id: 'DP', name: 'Diana Patel', status: 'idle', where: 'Shop', c: '#FBBF24' },
  ];
  const ticker = [
    '08:12 — TK-1042 P1 opened · Riverside Medical NVR offline',
    '09:48 — Jessica on-site at Metro Bank (geofence)',
    '10:12 — Issue photo flagged: water staining @ Metro Bank',
    '11:40 — WO-2846 completed · Acme Dental · customer signed',
    '13:05 — Parts restock auto-requested: Door Strike 12V',
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: '#05070c', display: 'flex', flexDirection: 'column', padding: '28px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <ShieldLogo size={34} />
        <span className="display" style={{ fontSize: 20, fontWeight: 300, letterSpacing: '0.12em', color: 'var(--text-high)' }}>SHIELDTECH NOC</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-ok)', animation: 'pulse-online 2.5s ease-in-out infinite' }}></span>
          <span style={{ fontSize: 11, color: 'var(--status-ok)', letterSpacing: '0.1em' }}>ALL SYSTEMS NOMINAL</span>
        </span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 30, fontWeight: 300, color: 'var(--text-high)' }}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        <button onClick={() => navTo('dashboard')} style={{ padding: '6px 16px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Exit ✕</button>
      </div>

      {/* Rotating panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', marginTop: 26 }}>
        {panel === 0 && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, alignContent: 'center' }}>
            {[
              { l: 'OPEN INCIDENTS', v: '2', c: 'var(--status-critical)', sub: '1 × P1 · 1 × P2' },
              { l: 'SLA AT RISK', v: '1', c: 'var(--status-warn)', sub: 'TK-1038 · 1.2h left' },
              { l: 'TECHS ON SITE', v: '2/5', c: 'var(--status-ok)', sub: '2 driving · 1 shop' },
              { l: 'TODAY REVENUE', v: '$18.4k', c: 'var(--status-ok)', sub: '4 jobs in flight' },
            ].map(s => (
              <div key={s.l} className="glass" style={{ padding: '36px 30px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-low)', marginBottom: 14 }}>{s.l}</div>
                <div className="mono" style={{ fontSize: 64, fontWeight: 600, color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 14 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
        {panel === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-low)' }}>FIELD CREW</div>
            {techs.map(t => (
              <div key={t.id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 26px' }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: `${t.c}22`, border: `2px solid ${t.c}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: t.c }}>{t.id}</span>
                <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-high)', width: 220 }}>{t.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.c, width: 130 }}>{t.status}</span>
                <span style={{ fontSize: 16, color: 'var(--text-mid)' }}>{t.where}</span>
              </div>
            ))}
          </div>
        )}
        {panel === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-low)' }}>LIVE EVENT FEED</div>
            {ticker.map((t, i) => (
              <div key={i} className="glass mono" style={{ padding: '16px 24px', fontSize: 17, color: i === 0 ? 'var(--text-high)' : 'var(--text-mid)', borderLeft: i === 0 ? '3px solid var(--brand)' : '3px solid transparent' }}>{t}</div>
            ))}
          </div>
        )}
      </div>

      {/* Panel dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, paddingTop: 18 }}>
        {[0, 1, 2].map(i => (
          <button key={i} onClick={() => setPanel(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', background: panel === i ? 'var(--brand)' : 'rgba(63,169,245,0.2)', transition: 'background 0.2s' }}></button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { RFPScreen, WallboardScreen });

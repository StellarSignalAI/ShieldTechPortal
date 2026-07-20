/* Revenue Tools — Margin X-Ray + Recurring-Revenue Builder */

/* ── Margin X-Ray: quoted vs actual, scope-creep flags, pricebook fixes ── */
function MarginXRayScreen() {
  const [fixed, setFixed] = React.useState([]);
  const jobs = [
    { id: 'WO-2846', customer: 'Acme Dental',        type: 'Repair',  quoted: 850,   actCost: 510,   estHrs: 2.0, actHrs: 2.5, creep: null },
    { id: 'WO-2841', customer: 'Harbor View Condos', type: 'PM',      quoted: 1200,  actCost: 760,   estHrs: 3.0, actHrs: 2.8, creep: null },
    { id: 'WO-2838', customer: 'Westfield Mall',     type: 'Install', quoted: 8400,  actCost: 6900,  estHrs: 14,  actHrs: 19,  creep: 'Conduit reroute not in scope (+5h unbilled)' },
    { id: 'WO-2837', customer: 'Metro Bank Corp',    type: 'Install', quoted: 4200,  actCost: 3650,  estHrs: 8,   actHrs: 11,  creep: 'Door hardware swap added on-site (+3h unbilled)' },
    { id: 'WO-2833', customer: 'Pacific Rim Hotels', type: 'Install', quoted: 12600, actCost: 8100,  estHrs: 22,  actHrs: 21,  creep: null },
  ];
  const withMargin = jobs.map(j => ({ ...j, margin: Math.round((1 - j.actCost / j.quoted) * 100), quotedMargin: 35 }));
  const avg = Math.round(withMargin.reduce((s, j) => s + j.margin, 0) / withMargin.length);
  const leak = withMargin.filter(j => j.creep).reduce((s, j) => s + (j.actHrs - j.estHrs) * 145, 0);

  const fixes = [
    { id: 'f1', title: 'Install labor underquoted', detail: 'Last 8 installs ran 22% over estimated hours. Raise install labor units from 1.5h → 1.8h per device.', impact: '+$3.1k/mo' },
    { id: 'f2', title: 'Door hardware swap — new line item', detail: '3 jobs absorbed unbilled hardware swaps. Add a standard $240 change-order item.', impact: '+$720/mo' },
    { id: 'f3', title: 'PM visits overquoted', detail: 'PM visits consistently finish 10% under — competitive room to sharpen quotes.', impact: 'win-rate' },
  ];

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'AVG REALIZED MARGIN', v: `${avg}%`, c: avg >= 30 ? 'var(--status-ok)' : 'var(--status-warn)' },
          { l: 'TARGET', v: '35%', c: 'var(--text-high)' },
          { l: 'SCOPE-CREEP LEAK (MO)', v: `$${leak.toLocaleString()}`, c: 'var(--status-critical)' },
          { l: 'JOBS ANALYZED', v: withMargin.length, c: 'var(--text-high)' },
        ].map(s => (
          <div key={s.l} className="glass" style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Quoted vs Actual — recent closed jobs</div>
        {withMargin.map(j => {
          const mC = j.margin >= 30 ? 'var(--status-ok)' : j.margin >= 20 ? 'var(--status-warn)' : 'var(--status-critical)';
          return (
            <div key={j.id} style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(5,7,10,0.4)', border: `1px solid ${j.creep ? 'rgba(251,191,36,0.25)' : 'var(--border-subtle)'}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--brand)', width: 64 }}>{j.id}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', flex: 1 }}>{j.customer} <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>· {j.type}</span></span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>${j.quoted.toLocaleString()} quoted</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{j.actHrs}h vs {j.estHrs}h est</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: mC, width: 48, textAlign: 'right' }}>{j.margin}%</span>
              </div>
              {/* margin bar vs target */}
              <div style={{ position: 'relative', height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.07)', marginTop: 8 }}>
                <div style={{ width: `${Math.min(j.margin, 60) / 60 * 100}%`, height: '100%', borderRadius: 3, background: mC }}></div>
                <div style={{ position: 'absolute', left: `${35 / 60 * 100}%`, top: -3, bottom: -3, width: 2, background: 'rgba(255,255,255,0.35)' }} title="35% target"></div>
              </div>
              {j.creep && <div style={{ fontSize: 10, color: 'var(--status-warn)', marginTop: 6 }}>⚠ Scope creep: {j.creep}</div>}
            </div>
          );
        })}
      </div>

      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Suggested Price Book Fixes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {fixes.map(f => (
            <div key={f.id} style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{f.title}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--status-ok)' }}>{f.impact}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.5, flex: 1 }}>{f.detail}</div>
              {fixed.includes(f.id)
                ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-ok)' }}>✓ Applied to Price Book</span>
                : <button onClick={() => { setFixed(x => [...x, f.id]); showToast('Price Book updated', 'ok'); }} style={{ alignSelf: 'flex-start', padding: '5px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Apply fix</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Recurring-Revenue Builder: convert T&M customers to monitoring plans ── */
function RRBuilderScreen() {
  const [mrr] = useShieldStore(mrrStore);
  const [pitched, setPitched] = React.useState([]);
  const currentMRR = mrr.filter(m => m.status === 'active').reduce((s, m) => s + m.mrr, 0);

  const candidates = [
    { name: 'Marina District Dental', tmSpend: 4800,  incidents: 3, visits: 5, plan: 'Standard Monitoring', proposedMrr: 980,  hook: '3 after-hours incidents this year — each took 4+ hrs to resolve without monitoring' },
    { name: 'Sutter Health — Annex',  tmSpend: 11200, incidents: 5, visits: 8, plan: 'Pro Monitoring',      proposedMrr: 2400, hook: 'HIPAA exposure: no audit trail on access events between visits' },
    { name: 'Redwood College',        tmSpend: 7400,  incidents: 2, visits: 6, plan: 'Pro + Response SLA',  proposedMrr: 1800, hook: 'Campus expansion doubles device count next semester' },
    { name: 'Embarcadero Partners',   tmSpend: 3100,  incidents: 1, visits: 3, plan: 'Standard Monitoring', proposedMrr: 850,  hook: 'Tenant turnover = recurring reader reprogramming anyway' },
  ];
  const uplift = candidates.reduce((s, c) => s + c.proposedMrr, 0);

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { l: 'CURRENT MRR', v: `$${currentMRR.toLocaleString()}`, c: 'var(--text-high)' },
          { l: 'CONVERSION PIPELINE', v: `+$${uplift.toLocaleString()}/mo`, c: 'var(--status-ok)' },
          { l: 'ANNUALIZED UPLIFT', v: `+$${(uplift * 12 / 1000).toFixed(0)}k`, c: 'var(--status-ok)' },
        ].map(s => (
          <div key={s.l} className="glass" style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>T&M Customers Who Should Be On Plans</div>
        <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 12 }}>Ranked by conversion likelihood — each pitch is generated from the customer's own incident history</div>
        {candidates.map(c => (
          <div key={c.name} style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>${c.tmSpend.toLocaleString()} T&M last 12mo · {c.incidents} incidents · {c.visits} truck rolls</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-ok)' }}>${c.proposedMrr}/mo</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{c.plan}</div>
              </div>
              {pitched.includes(c.name)
                ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-ok)', width: 110, textAlign: 'center' }}>✓ Pitch sent</span>
                : <button onClick={() => { setPitched(x => [...x, c.name]); showToast(`Pitch generated for ${c.name} — in your outbox`, 'ok'); }} style={{ padding: '7px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', width: 110 }}>Generate pitch</button>}
            </div>
            <div style={{ marginTop: 8, padding: '7px 11px', borderRadius: 7, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-mid)' }}>
              <span style={{ color: 'var(--brand)', fontWeight: 600 }}>ShieldTech AI angle:</span> {c.hook}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MarginXRayScreen, RRBuilderScreen });

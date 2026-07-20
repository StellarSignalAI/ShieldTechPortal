/* Screen 2 — Enhanced Owner Dashboard (store-driven; blank-canvas aware) */

function DashboardScreen() {
  const [tickets] = useShieldStore(ticketStore);
  const [jobs] = useShieldStore(jobStore);
  const [incidents] = useShieldStore(incidentStore);
  const [mrr] = useShieldStore(mrrStore);
  const flat = Array(14).fill(0);

  const openTickets = tickets.filter(t => t.status !== 'resolved').length;
  const slaTracked = tickets.filter(t => t.sla);
  const slaBreached = slaTracked.filter(t => t.sla.remaining <= 0).length;
  const slaOnTime = slaTracked.length - slaBreached;
  const slaPct = slaTracked.length ? Math.round((slaOnTime / slaTracked.length) * 100) : 0;
  const alerts = [
    ...incidents.filter(i => i.status === 'active').map(i => ({ severity: i.severity === 'P1' ? 'critical' : 'warning', message: i.title || i.summary || i.id, time: i.time || '', sla: i.sla || null })),
    ...tickets.filter(t => t.status !== 'resolved' && t.priority === 'critical').map(t => ({ severity: 'critical', message: `${t.customer} — ${t.subject}`, time: '', sla: null })),
  ];
  const renewals = mrr.filter(r => r.renewal).slice(0, 4);

  const Empty = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '26px 12px', fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="REVENUE TODAY" value={0} suffix="USD" trend="" sparkData={flat} delay={0} />
        <StatCard label="OPEN TICKETS" value={openTickets} trend="" sparkData={flat} delay={80} />
        <StatCard label="TECHS ACTIVE" value={0} suffix="/ 0" trend="" sparkData={flat} delay={160} />
        <StatCard label="JOBS TODAY" value={jobs.length} trend="" sparkData={flat} delay={240} />
      </div>

      {/* Revenue Goal + SLA + Weather Row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="glass" style={{ padding: '16px 20px', flex: 1, animation: 'fade-up 0.5s ease 0.25s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="label-sm">MONTHLY REVENUE GOAL</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>Not set</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--brand), var(--brand-hover))' }} />
              </div>
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>$0 <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>/ —</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Set a goal in Finance to start tracking</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '16px 20px', width: 200, animation: 'fade-up 0.5s ease 0.3s both' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>SLA COMPLIANCE</div>
          <HealthRing value={slaPct} size={70} strokeWidth={5} color={slaTracked.length ? 'var(--status-ok)' : 'var(--text-low)'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--status-ok)' }}>{slaOnTime}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>On Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--status-critical)' }}>{slaBreached}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>Breached</div>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '16px 20px', width: 180, animation: 'fade-up 0.5s ease 0.35s both' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>FIELD CONDITIONS</div>
          <div style={{ fontSize: 12, color: 'var(--text-low)', lineHeight: 1.5 }}>Weather feed not connected</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 6, opacity: 0.7 }}>Configure in Settings → Integrations</div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.3s both' }}>
          <SectionHeader title="Monthly Performance" icon="reports" />
          <Empty>Performance metrics appear once invoices, tickets, and jobs exist.</Empty>
        </GlassPanel>

        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.4s both' }}>
          <SectionHeader title="Live Alerts" icon="bolt" count={alerts.length} />
          {alerts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 6).map((a, i) => <AlertRow key={i} severity={a.severity} message={a.message} time={a.time} sla={a.sla} />)}
            </div>
          ) : <Empty>All clear — no active alerts.</Empty>}
        </GlassPanel>
      </div>

      {/* Bottom row: AI + Leaderboard + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 1fr', gap: 12 }}>
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.5s both' }}>
          <SectionHeader title="ShieldTech AI Insights" icon="⟡" />
          <Empty>ShieldTech AI will surface insights here as your data grows.</Empty>
        </GlassPanel>

        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.55s both' }}>
          <SectionHeader title="Top Technicians" icon="star" />
          <Empty>No technicians yet — invite your team in Admin → Users.</Empty>
        </GlassPanel>

        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.6s both', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px' }}>
            <SectionHeader title="Fleet Status Map" icon="map-pin" />
          </div>
          <div style={{ height: 220, position: 'relative', background: 'linear-gradient(180deg, rgba(5,7,10,0.3), rgba(10,14,20,0.8))' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              <defs><pattern id="mapG" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(63,169,245,0.3)" strokeWidth="0.3"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#mapG)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-low)' }}>No customer sites yet</div>
          </div>
        </GlassPanel>
      </div>

      {/* Live Activity Feed + Contract Renewals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.7s both' }}>
          <SectionHeader title="Live Activity Feed" icon="◉" />
          <Empty>Activity from your team and systems will stream here.</Empty>
        </GlassPanel>

        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.75s both' }}>
          <SectionHeader title="Upcoming Renewals" icon="clipboard" count={renewals.length} />
          {renewals.length ? renewals.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < renewals.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{r.customer}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.plan || 'RMR'} · ${'{'}r.mrr{'}'}/mo</div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>{r.renewal}</div>
            </div>
          )) : <Empty>No contracts yet — renewals will appear here.</Empty>}
          <button onClick={() => window.__shieldNav && window.__shieldNav('contracts')} style={{
            width: '100%', marginTop: 10, padding: '6px', fontSize: 11,
            background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>View All Contracts →</button>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function BarChart({ data }) {
  const max = Math.max(...data.map(d => Math.max(d.value, d.prev)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
            <div style={{ width: 10, height: `${(d.prev/max)*100}%`, background: 'rgba(63,169,245,0.15)', borderRadius: '2px 2px 0 0' }} />
            <div style={{ width: 10, height: `${(d.value/max)*100}%`, background: 'var(--brand)', borderRadius: '2px 2px 0 0', boxShadow: '0 0 8px -2px rgba(63,169,245,0.3)' }} />
          </div>
          <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricRow({ label, value, target, status }) {
  return (
    <div>
      <div className="label-sm" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-high)' }}>{value}</span>
        <span style={{ fontSize: 10, color: status === 'ok' ? 'var(--status-ok)' : 'var(--status-warn)', background: status === 'ok' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', padding: '1px 6px', borderRadius: 4 }}>target: {target}</span>
      </div>
    </div>
  );
}

function AlertRow({ severity, message, time, sla }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)',
      background: severity === 'critical' ? 'rgba(244,63,94,0.04)' : severity === 'warning' ? 'rgba(251,191,36,0.03)' : 'rgba(63,169,245,0.03)',
      border: `1px solid ${severity === 'critical' ? 'rgba(244,63,94,0.12)' : severity === 'warning' ? 'rgba(251,191,36,0.08)' : 'var(--border-subtle)'}`
    }}>
      <StatusDot status={severity} size={8} />
      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{message}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>{time}</span>
        {sla && <span className="mono" style={{ fontSize: 9, color: severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warn)' }}>{sla}</span>}
      </div>
    </div>
  );
}

function InsightCard({ priority, text, action, model, cost }) {
  const colors = { high: 'var(--status-critical)', medium: 'var(--status-warn)', low: 'var(--brand)' };
  return (
    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${colors[priority]}` }}>
      <p style={{ fontSize: 12, color: 'var(--text-high)', lineHeight: 1.5, marginBottom: 8 }}>{text}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => {
          const map = { 'View forecast': 'forecast', 'Draft follow-ups': 'approvals', 'Schedule service call': 'dispatch' };
          const dest = map[action];
          if (dest && window.__shieldNav) { window.__shieldNav(dest); }
          else shieldToast(action);
        }} style={{ background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '3px 10px', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{action}</button>
        <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{model} · {cost}</span>
      </div>
    </div>
  );
}

function MapMarker({ x, y, label, status }) {
  const colors = { online: 'var(--status-ok)', warning: 'var(--status-warn)', critical: 'var(--status-critical)' };
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid', borderColor: colors[status], background: 'rgba(10,14,20,0.8)', boxShadow: `0 0 10px ${colors[status]}40`, animation: status === 'critical' ? 'pulse-critical 2s ease-in-out infinite' : 'none' }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors[status], margin: '2px auto' }} />
      </div>
      <span style={{ fontSize: 8, color: 'var(--text-mid)', whiteSpace: 'nowrap', background: 'rgba(10,14,20,0.8)', padding: '1px 4px', borderRadius: 3 }}>{label}</span>
    </div>
  );
}

Object.assign(window, { DashboardScreen, BarChart, MetricRow, AlertRow, InsightCard, MapMarker });

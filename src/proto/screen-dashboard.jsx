/* Screen 2 — Enhanced Owner Dashboard */

function DashboardScreen() {
  const sparkRev = [42,45,38,52,48,55,60,58,63,67,62,71,68,74];
  const sparkTickets = [12,15,11,18,14,10,8,12,9,7,11,8,6,9];
  const sparkTechs = [6,7,8,7,9,8,10,9,11,10,12,11,10,12];
  const sparkJobs = [8,7,10,9,11,12,10,14,13,11,15,12,14,16];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="REVENUE TODAY" value={18420} suffix="USD" trend="+12.4%" trendDir="up" sparkData={sparkRev} delay={0} />
        <StatCard label="OPEN TICKETS" value={14} trend="-3" trendDir="down" sparkData={sparkTickets} delay={80} />
        <StatCard label="TECHS ACTIVE" value={12} suffix="/ 15" trend="" sparkData={sparkTechs} delay={160} />
        <StatCard label="JOBS TODAY" value={16} trend="+2" trendDir="up" sparkData={sparkJobs} delay={240} />
      </div>

      {/* Revenue Goal + SLA + Weather Row */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Revenue Goal */}
        <div className="glass" style={{ padding: '16px 20px', flex: 1, animation: 'fade-up 0.5s ease 0.25s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="label-sm">MONTHLY REVENUE GOAL</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)' }}>On Track</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--brand), var(--brand-hover))', boxShadow: '0 0 12px rgba(63,169,245,0.3)' }} />
              </div>
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>$284K <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>/ $395K</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-low)' }}>72% · 18 days remaining</span>
            <span style={{ fontSize: 10, color: 'var(--status-ok)' }}>Projected: $408K</span>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="glass" style={{ padding: '16px 20px', width: 200, animation: 'fade-up 0.5s ease 0.3s both' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>SLA COMPLIANCE</div>
          <HealthRing value={96} size={70} strokeWidth={5} color="var(--status-ok)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--status-ok)' }}>48</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>On Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--status-critical)' }}>2</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>Breached</div>
            </div>
          </div>
        </div>

        {/* Weather */}
        <div className="glass" style={{ padding: '16px 20px', width: 180, animation: 'fade-up 0.5s ease 0.35s both' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>FIELD CONDITIONS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>☀️</span>
            <div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>72°F</div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Clear · San Francisco</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--status-ok)', marginTop: 6 }}>✓ Good conditions for outdoor installs</div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Monthly Performance */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.3s both' }}>
          <SectionHeader title="Monthly Performance" icon="reports" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 8 }}>Revenue vs Last Month</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>$284,600</span>
                <span style={{ fontSize: 12, color: 'var(--status-ok)' }}>↑ 8.2%</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 2 }}>vs $263,100 prior</div>
              <div style={{ marginTop: 12 }}>
                <BarChart data={[
                  { label: 'Jan', value: 220, prev: 195 }, { label: 'Feb', value: 245, prev: 218 },
                  { label: 'Mar', value: 238, prev: 240 }, { label: 'Apr', value: 265, prev: 252 },
                  { label: 'May', value: 284, prev: 263 }
                ]} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MetricRow label="Gross Margin" value="28.4%" target="25%" status="ok" />
              <MetricRow label="Win Rate" value="62%" target="55%" status="ok" />
              <MetricRow label="AR Aging (>30d)" value="$42,800" target="<$30K" status="warn" />
              <MetricRow label="Avg Ticket Close" value="4.2h" target="<6h" status="ok" />
              <MetricRow label="First-Time Fix" value="87%" target="85%" status="ok" />
              <MetricRow label="NPS Score" value="74" target="70" status="ok" />
            </div>
          </div>
        </GlassPanel>

        {/* Live Alerts */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.4s both' }}>
          <SectionHeader title="Live Alerts" icon="bolt" count={5} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AlertRow severity="critical" message="Acme Dental — NVR offline for 6h 23m" time="6h ago" sla="SLA: 1h 37m left" />
            <AlertRow severity="critical" message="Metro Bank Site B — 3 cameras unreachable" time="2h ago" sla="SLA: 4h left" />
            <AlertRow severity="warning" message="Overdue invoice: Riverside Medical — $14,250 (38 days)" time="8d overdue" />
            <AlertRow severity="warning" message="Proposal #Q-2847 awaiting approval — $67,500" time="3d pending" />
            <AlertRow severity="info" message="Firmware update: Axis P3265-V (12 devices)" time="Today" />
          </div>
          {/* Unified timeline teaser */}
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>⟡</span>
            <span style={{ fontSize: 11, color: 'var(--brand)' }}>Hermes: 2 alerts are likely related — both on the same PoE switch</span>
          </div>
        </GlassPanel>
      </div>

      {/* Bottom row: AI + Leaderboard + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 1fr', gap: 12 }}>
        {/* AI Insights */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.5s both' }}>
          <SectionHeader title="Hermes AI Insights" icon="⟡" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InsightCard priority="high"
              text="Acme Dental NVR has gone offline 4 times in 14 days. Recommend proactive site visit — the PoE switch may be failing."
              action="Schedule service call" model="claude-3.5-sonnet" cost="$0.003" />
            <InsightCard priority="medium"
              text="3 proposals over $50K pending >48h. Win rate drops 22% after 72h without follow-up."
              action="Draft follow-ups" model="gpt-4o" cost="$0.008" />
            <InsightCard priority="low"
              text="RMR grew 6.2% MoM. At this rate, you'll hit $180K MRR by Q3 — ahead of target."
              action="View forecast" model="claude-3-haiku" cost="$0.001" />
          </div>
        </GlassPanel>

        {/* Tech Leaderboard */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.55s both' }}>
          <SectionHeader title="Top Technicians" icon="star" />
          {[
            { name: 'Jessica Liu', score: 98, jobs: 47, rating: '4.9', initials: 'JL' },
            { name: 'Mike Reyes', score: 94, jobs: 42, rating: '4.8', initials: 'MR' },
            { name: 'Tony Garcia', score: 91, jobs: 38, rating: '4.7', initials: 'TG' },
            { name: 'Kevin White', score: 88, jobs: 35, rating: '4.6', initials: 'KW' },
            { name: 'Diana Patel', score: 85, jobs: 31, rating: '4.8', initials: 'DP' },
          ].map((tech, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
              borderBottom: i < 4 ? '1px solid rgba(63,169,245,0.04)' : 'none'
            }}>
              <span className="mono" style={{
                width: 18, height: 18, borderRadius: '50%', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i === 0 ? 'rgba(251,191,36,0.15)' : 'rgba(63,169,245,0.06)',
                color: i === 0 ? 'var(--status-warn)' : 'var(--text-low)'
              }}>{i + 1}</span>
              <div style={{
                width: 24, height: 24, borderRadius: 6, fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(63,169,245,0.1)', color: 'var(--brand)',
                fontFamily: 'var(--font-mono)'
              }}>{tech.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{tech.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{tech.jobs} jobs · ★{tech.rating}</div>
              </div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>{tech.score}</div>
            </div>
          ))}
        </GlassPanel>

        {/* Fleet Map */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.6s both', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px' }}>
            <SectionHeader title="Fleet Status Map" icon="map-pin" />
          </div>
          <div style={{ height: 220, position: 'relative', background: 'linear-gradient(180deg, rgba(5,7,10,0.3), rgba(10,14,20,0.8))' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              <defs><pattern id="mapG" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(63,169,245,0.3)" strokeWidth="0.3"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#mapG)" />
              <line x1="10%" y1="30%" x2="90%" y2="35%" stroke="rgba(63,169,245,0.08)" strokeWidth="2"/>
              <line x1="30%" y1="10%" x2="35%" y2="90%" stroke="rgba(63,169,245,0.06)" strokeWidth="2"/>
              <line x1="60%" y1="15%" x2="65%" y2="85%" stroke="rgba(63,169,245,0.06)" strokeWidth="1.5"/>
            </svg>
            <MapMarker x="22%" y="28%" label="Acme Dental" status="critical" />
            <MapMarker x="45%" y="42%" label="Metro Bank A" status="online" />
            <MapMarker x="62%" y="25%" label="Metro Bank B" status="warning" />
            <MapMarker x="35%" y="65%" label="Riverside Med" status="online" />
            <MapMarker x="75%" y="55%" label="City Hall" status="online" />
            <MapMarker x="52%" y="72%" label="Harbor View" status="online" />
          </div>
        </GlassPanel>
      </div>

      {/* Live Activity Feed + Contract Renewals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Live Activity Feed */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.7s both' }}>
          <SectionHeader title="Live Activity Feed" icon="◉" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 180, overflow: 'auto' }}>
            {[
              { time: '2:14 PM', user: 'Mike Reyes', action: 'Completed job J-4201 at Acme Dental', type: 'ok' },
              { time: '2:01 PM', user: 'System', action: 'Invoice INV-2865 sent to Marina District Dental', type: 'info' },
              { time: '1:45 PM', user: 'Jessica Liu', action: 'Started on-site at Metro Bank B', type: 'info' },
              { time: '1:30 PM', user: 'Hermes', action: 'Auto-triaged ticket TKT-2845 → High priority, assigned Mike', type: 'info' },
              { time: '1:12 PM', user: 'Sarah Chen', action: 'New lead: Pinnacle Financial Group ($128,500)', type: 'ok' },
              { time: '12:50 PM', user: 'System', action: 'Payment received: City Hall — $22,100', type: 'ok' },
              { time: '12:30 PM', user: 'Diana Patel', action: 'Submitted timesheet — 32.5h (pending approval)', type: 'info' },
            ].map((ev, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, padding: '7px 0',
                borderBottom: '1px solid rgba(63,169,245,0.04)',
                animation: `fade-up 0.3s ease ${i * 50}ms both`
              }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 56, flexShrink: 0 }}>{ev.time}</span>
                <StatusDot status={ev.type === 'ok' ? 'online' : 'info'} size={5} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-high)', fontWeight: 500 }}>{ev.user}</span> {ev.action}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Contract Renewals + Upcoming */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.75s both' }}>
          <SectionHeader title="Upcoming Renewals" icon="clipboard" count={4} />
          {[
            { customer: 'Riverside Medical', type: 'RMR', value: '$2,800/mo', expires: 'Jun 28', status: 'ok', days: 23 },
            { customer: 'City Hall', type: 'RMR', value: '$4,200/mo', expires: 'Jul 15', status: 'ok', days: 40 },
            { customer: 'Harbor View Condos', type: 'Warranty', value: '—', expires: 'Jul 2', status: 'warn', days: 27 },
            { customer: 'Westfield Mall', type: 'RMR', value: '$6,100/mo', expires: 'Aug 1', status: 'ok', days: 57 },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < 3 ? '1px solid rgba(63,169,245,0.04)' : 'none'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{r.customer}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.type} · {r.value}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 11, color: r.days < 30 ? 'var(--status-warn)' : 'var(--text-mid)' }}>{r.expires}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.days}d</div>
              </div>
            </div>
          ))}
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

/* Screen 3 — Customer Portal Dashboard */

function CustomerScreen() {
  const devices = [
    { name: 'Axis P3265-V', type: 'Camera', location: 'Main Entrance', status: 'online', lastSeen: 'Now', logo: '◉' },
    { name: 'Axis P3265-V', type: 'Camera', location: 'Parking Lot A', status: 'online', lastSeen: 'Now', logo: '◉' },
    { name: 'Axis M3075-V', type: 'Camera', location: 'Server Room', status: 'online', lastSeen: 'Now', logo: '◉' },
    { name: 'Hikvision DS-2CD2143', type: 'Camera', location: 'Rear Exit', status: 'offline', lastSeen: '2h ago', logo: '◉' },
    { name: 'HID iCLASS SE', type: 'Access Control', location: 'Front Door', status: 'online', lastSeen: 'Now', logo: '⊠' },
    { name: 'HID iCLASS SE', type: 'Access Control', location: 'Suite 200', status: 'online', lastSeen: 'Now', logo: '⊠' },
    { name: 'DSC PowerSeries Neo', type: 'Alarm Panel', location: 'Main Panel', status: 'online', lastSeen: 'Now', logo: '🛡' },
    { name: 'Hanwha XNR-6410', type: 'NVR', location: 'IT Closet', status: 'online', lastSeen: 'Now', logo: '⊟' },
  ];

  const events = [
    { time: 'Today 2:14 PM', event: 'Camera restored — Rear Exit is back online', type: 'ok' },
    { time: 'Today 12:01 PM', event: 'Camera went offline — Rear Exit', type: 'warn' },
    { time: 'Yesterday 9:30 AM', event: 'Scheduled maintenance completed — all systems tested', type: 'info' },
    { time: 'Jun 2 4:15 PM', event: 'Access granted after-hours — Front Door (authorized)', type: 'info' },
    { time: 'Jun 1 8:00 AM', event: 'Monthly health report generated — Score: 94', type: 'ok' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28, animation: 'fade-up 0.5s ease both' }}>
        <h1 className="display" style={{ fontSize: 26, fontWeight: 200, letterSpacing: '-0.01em', color: 'var(--text-high)' }}>
          Welcome back, <span style={{ fontWeight: 400 }}>{(window.__shieldUser && window.__shieldUser.name) || 'Acme Dental Group'}</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>Your security systems at a glance · Site A — 1247 Market Street</p>
      </div>

      {/* Top section: Health Ring + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 20 }}>
        {/* Health Ring */}
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 28, animation: 'fade-up 0.5s ease 0.1s both' }}>
          <div className="label-sm" style={{ marginBottom: 16 }}>SITE HEALTH SCORE</div>
          <HealthRing value={94} size={160} strokeWidth={12} label="out of 100" />
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            {[
              { label: 'Uptime', val: '99.2%', color: 'var(--status-ok)' },
              { label: 'Performance', val: '96%', color: 'var(--brand)' },
              { label: 'Security', val: '98%', color: 'var(--status-ok)' },
              { label: 'Maintenance', val: '82%', color: 'var(--status-warn)' }
            ].map((m, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{m.label}</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* KPI + Device Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="DEVICES ONLINE" value="23 / 24" mono={false} delay={100} />
            <StatCard label="30-DAY UPTIME" value="99.2%" mono={false} delay={180} />
            <StatCard label="OPEN TICKETS" value={1} delay={260} />
            <StatCard label="NEXT SERVICE" value="Jun 28" mono={false} delay={340} />
          </div>

          {/* AI Proactive Cards */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="glass" style={{
              flex: 1, padding: 16,
              borderLeft: '3px solid var(--status-warn)',
              animation: 'fade-up 0.5s ease 0.4s both'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⟡</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Recommendation</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5, marginBottom: 10 }}>
                The rear exit camera has gone offline 3 times this week. We recommend a technician inspection to check the connection.
              </p>
              <button onClick={() => shieldToast('Service request submitted — a coordinator will reach out shortly', 'ok')} style={{
                background: 'var(--brand)', border: 'none', borderRadius: 6,
                padding: '6px 16px', color: '#fff', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>Request Service</button>
            </div>
            <div className="glass" style={{
              flex: 1, padding: 16,
              borderLeft: '3px solid var(--brand)',
              animation: 'fade-up 0.5s ease 0.45s both'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⟡</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insight</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5, marginBottom: 10 }}>
                Your access control system firmware is due for an update. Newer firmware includes enhanced encryption protocols.
              </p>
              <button onClick={() => shieldToast('Opening firmware update details…', 'info')} style={{
                background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)',
                borderRadius: 6, padding: '6px 16px', color: 'var(--brand)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>Learn More</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Devices + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        {/* Device Grid */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.5s both' }}>
          <SectionHeader title="Device Status" count={`${devices.filter(d => d.status==='online').length}/${devices.length}`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {devices.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(63,169,245,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <span style={{ fontSize: 18, opacity: 0.7 }}>{d.logo}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{d.location}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <StatusDot status={d.status} size={7} pulse />
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{d.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Recent Events */}
        <GlassPanel style={{ animation: 'fade-up 0.5s ease 0.55s both' }}>
          <SectionHeader title="Recent Activity" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {events.map((ev, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 0',
                borderBottom: i < events.length - 1 ? '1px solid rgba(63,169,245,0.05)' : 'none'
              }}>
                <div style={{ width: 20, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                  <StatusDot status={ev.type === 'ok' ? 'online' : ev.type === 'warn' ? 'warning' : 'info'} size={7} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.4 }}>{ev.event}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerScreen });

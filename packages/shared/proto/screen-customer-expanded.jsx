/* Expanded Customer Portal — Tickets, Remote Sessions, AI Chat */

function CustomerExpandedScreen() {
  const [view, setView] = React.useState('dashboard');
  const [selectedTicket, setSelectedTicket] = React.useState(null);

  const views = {
    dashboard: CustomerDashboardView,
    'new-ticket': NewTicketView,
    tickets: TicketListView,
    'remote-session': RemoteSessionView,
    'ai-chat': CustomerAIChatView,
  };

  const ViewComponent = views[view] || CustomerDashboardView;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '◉' },
          { id: 'new-ticket', label: 'Submit a Ticket', icon: '＋' },
          { id: 'tickets', label: 'My Tickets', icon: '☰', count: 3 },
          { id: 'remote-session', label: 'Remote Sessions', icon: '⊙' },
          { id: 'ai-chat', label: 'Ask AI', icon: '⟡' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            padding: '8px 16px', borderRadius: 8,
            background: view === tab.id ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.03)',
            border: `1px solid ${view === tab.id ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
            color: view === tab.id ? 'var(--brand)' : 'var(--text-mid)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
          }}>
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
            {tab.count && (
              <span className="mono" style={{
                fontSize: 10, background: 'rgba(63,169,245,0.15)', padding: '1px 6px',
                borderRadius: 100, color: 'var(--brand)'
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <ViewComponent
        onNavigate={setView}
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
      />
    </div>
  );
}

/* ── Dashboard View (same as before but with quick actions) ── */
function CustomerDashboardView({ onNavigate }) {
  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 24, animation: 'fade-up 0.5s ease both' }}>
        <h1 className="display" style={{ fontSize: 26, fontWeight: 200, color: 'var(--text-high)' }}>
          Welcome back, <span style={{ fontWeight: 400 }}>{(window.__shieldUser && window.__shieldUser.name) || 'Acme Dental Group'}</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>Site A — 1247 Market Street</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'A camera is offline', icon: '◉', action: () => onNavigate('new-ticket') },
          { label: 'I need footage', icon: '▶', action: () => onNavigate('new-ticket') },
          { label: 'Add access user', icon: '⊠', action: () => onNavigate('new-ticket') },
          { label: 'Schedule service', icon: '⚙', action: () => onNavigate('new-ticket') },
          { label: 'Ask AI assistant', icon: '⟡', action: () => onNavigate('ai-chat') },
        ].map((qa, i) => (
          <button key={i} onClick={qa.action} className="glass" style={{
            padding: '14px 18px', cursor: 'pointer', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
            color: 'var(--text-high)', fontFamily: 'var(--font-body)',
            transition: 'all 0.15s', background: 'var(--glass-bg)',
            borderRadius: 'var(--radius-md)', minWidth: 180
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <span style={{ fontSize: 20 }}>{qa.icon}</span>
            {qa.label}
          </button>
        ))}
      </div>

      {/* Health + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, marginBottom: 20 }}>
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 28 }}>
          <div className="label-sm" style={{ marginBottom: 16 }}>SITE HEALTH</div>
          <HealthRing value={94} size={140} strokeWidth={10} label="out of 100" />
        </GlassPanel>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="DEVICES ONLINE" value="23 / 24" mono={false} delay={100} />
          <StatCard label="30-DAY UPTIME" value="99.2%" mono={false} delay={180} />
          <StatCard label="OPEN TICKETS" value={1} delay={260} />
          <StatCard label="NEXT SERVICE" value="Jun 28" mono={false} delay={340} />
        </div>
      </div>

      {/* AI Cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        <GlassPanel style={{ flex: 1, borderLeft: '3px solid var(--status-warn)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span>⟡</span>
            <span className="label-sm" style={{ color: 'var(--brand)' }}>AI RECOMMENDATION</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5, marginBottom: 10 }}>
            The rear exit camera has gone offline 3 times this week. We recommend a technician inspection.
          </p>
          <button onClick={() => onNavigate('new-ticket')} style={{
            background: 'var(--brand)', border: 'none', borderRadius: 6,
            padding: '6px 16px', color: '#fff', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>Request Service</button>
        </GlassPanel>
        <GlassPanel style={{ flex: 1, borderLeft: '3px solid var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span>⟡</span>
            <span className="label-sm" style={{ color: 'var(--brand)' }}>INSIGHT</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5, marginBottom: 10 }}>
            Your access control firmware is due for update. Enhanced encryption protocols available.
          </p>
          <button onClick={() => shieldToast('Opening plan details…')} style={{
            background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)',
            borderRadius: 6, padding: '6px 16px', color: 'var(--brand)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>Learn More</button>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ── New Ticket Form ── */
function NewTicketView({ onNavigate }) {
  const [category, setCategory] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [submitted, setSubmitted] = React.useState(false);

  const quickPicks = [
    { label: 'A camera is offline', cat: 'camera', pri: 'high', icon: '◉' },
    { label: 'I need footage retrieved', cat: 'camera', pri: 'medium', icon: '▶' },
    { label: 'Add a user to access control', cat: 'access', pri: 'low', icon: '⊠' },
    { label: 'Schedule a service visit', cat: 'other', pri: 'medium', icon: '⚙' },
    { label: 'Alarm system issue', cat: 'alarm', pri: 'high', icon: '🛡' },
    { label: 'Billing question', cat: 'billing', pri: 'low', icon: '▭' },
  ];

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fade-up 0.5s ease both' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(52,211,153,0.1)', border: '2px solid var(--status-ok)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, boxShadow: '0 0 24px rgba(52,211,153,0.15)'
        }}>✓</div>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 300, marginBottom: 8 }}>Ticket Submitted</h2>
        <p className="mono" style={{ fontSize: 16, color: 'var(--brand)', marginBottom: 8 }}>TKT-2847</p>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 4 }}>
          Estimated response time: <strong style={{ color: 'var(--text-high)' }}>
            {priority === 'urgent' ? '15 minutes' : priority === 'high' ? '1 hour' : '4 hours'}
          </strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-low)', marginBottom: 24 }}>
          Our team has been notified and will respond shortly.
        </p>
        <button onClick={() => onNavigate('tickets')} style={{
          background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)',
          borderRadius: 8, padding: '10px 24px', color: 'var(--brand)',
          fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>View My Tickets</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, animation: 'fade-up 0.4s ease both' }}>
      <h2 className="display" style={{ fontSize: 20, fontWeight: 300, marginBottom: 20 }}>Submit a Support Ticket</h2>

      {/* Quick picks */}
      <div style={{ marginBottom: 24 }}>
        <div className="label-sm" style={{ marginBottom: 10 }}>QUICK SELECT</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {quickPicks.map((qp, i) => (
            <button key={i} onClick={() => { setCategory(qp.cat); setPriority(qp.pri); }} className="glass" style={{
              padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
              border: `1px solid ${category === qp.cat ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
              background: category === qp.cat ? 'rgba(63,169,245,0.08)' : 'var(--glass-bg)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: 'var(--text-high)', fontFamily: 'var(--font-body)',
              borderRadius: 'var(--radius-sm)', transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: 18 }}>{qp.icon}</span> {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <GlassPanel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Subject" placeholder="Brief description of the issue" />
          <FormField label="Description" placeholder="Please provide details about what you're experiencing…" textarea />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormSelect label="Category" value={category} onChange={setCategory}
              options={[
                { value: '', label: 'Select…' },
                { value: 'camera', label: 'Camera / CCTV' },
                { value: 'access', label: 'Access Control' },
                { value: 'alarm', label: 'Alarm System' },
                { value: 'network', label: 'Network' },
                { value: 'billing', label: 'Billing' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <FormSelect label="Priority" value={priority} onChange={setPriority}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>
          <FormSelect label="Site" value="site-a" onChange={() => {}}
            options={[{ value: 'site-a', label: 'Site A — 1247 Market Street' }]}
          />
          <FormSelect label="Affected Device (optional)" value="" onChange={() => {}}
            options={[
              { value: '', label: 'Select device…' },
              { value: 'd1', label: 'Hikvision DS-2CD2143 — Rear Exit' },
              { value: 'd2', label: 'Axis P3265-V — Main Entrance' },
              { value: 'd3', label: 'HID iCLASS SE — Front Door' },
            ]}
          />

          {/* File upload */}
          <div>
            <div className="label-sm" style={{ marginBottom: 6 }}>ATTACHMENTS</div>
            <div style={{
              padding: 24, borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-subtle)', textAlign: 'center',
              cursor: 'pointer', transition: 'border-color 0.2s'
            }}>
              <span style={{ fontSize: 24, opacity: 0.4 }}>⧉</span>
              <p style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 6 }}>
                Drag & drop photos, screenshots, or videos here
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>PNG, JPG, MP4 up to 25MB</p>
            </div>
          </div>

          <button onClick={() => setSubmitted(true)} style={{
            padding: '12px', background: 'var(--brand)', border: 'none',
            borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            boxShadow: '0 0 20px -4px rgba(63,169,245,0.4)'
          }}>Submit Ticket</button>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── Ticket List ── */
function TicketListView({ onNavigate, selectedTicket, setSelectedTicket }) {
  const tickets = [
    { id: 'TKT-2845', subject: 'Rear exit camera intermittent', cat: 'Camera', priority: 'high', status: 'in-progress', created: 'Jun 3, 2026', updated: '2h ago', assignee: 'Mike Reyes' },
    { id: 'TKT-2839', subject: 'Add badge for new employee — Sarah Kim', cat: 'Access Control', priority: 'low', status: 'waiting', created: 'Jun 1, 2026', updated: '1d ago', assignee: 'Jessica Liu' },
    { id: 'TKT-2831', subject: 'Monthly maintenance completed', cat: 'Maintenance', priority: 'low', status: 'resolved', created: 'May 28, 2026', updated: '5d ago', assignee: 'Tony Garcia' },
  ];

  const statusMap = {
    'open': { color: 'var(--brand)', label: 'Open' },
    'in-progress': { color: 'var(--status-warn)', label: 'In Progress' },
    'waiting': { color: '#c084fc', label: 'Waiting on You' },
    'resolved': { color: 'var(--status-ok)', label: 'Resolved' },
    'closed': { color: 'var(--text-low)', label: 'Closed' },
  };

  const sel = selectedTicket !== null ? tickets[selectedTicket] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 400px' : '1fr', gap: 16 }}>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <SectionHeader title="My Tickets" count={tickets.length} />
          <button onClick={() => onNavigate('new-ticket')} style={{
            background: 'var(--brand)', border: 'none', borderRadius: 6,
            padding: '6px 14px', color: '#fff', fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)'
          }}>+ New Ticket</button>
        </div>
        {tickets.map((t, i) => {
          const st = statusMap[t.status];
          return (
            <div key={i} onClick={() => setSelectedTicket(i)} style={{
              padding: '14px 20px', borderBottom: '1px solid rgba(63,169,245,0.04)',
              cursor: 'pointer', background: selectedTicket === i ? 'rgba(63,169,245,0.06)' : 'transparent',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => { if (selectedTicket !== i) e.currentTarget.style.background = 'rgba(63,169,245,0.03)'; }}
            onMouseLeave={e => { if (selectedTicket !== i) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{t.id}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 4,
                  background: `${st.color}15`, color: st.color,
                  letterSpacing: '0.04em'
                }}>{st.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{t.updated}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', marginBottom: 4 }}>{t.subject}</div>
              <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{t.cat} · {t.priority} priority · {t.assignee}</div>
            </div>
          );
        })}
      </GlassPanel>

      {/* Ticket Detail with messages */}
      {sel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassPanel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 14, color: 'var(--brand)' }}>{sel.id}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 4,
                background: `${statusMap[sel.status].color}15`, color: statusMap[sel.status].color
              }}>{statusMap[sel.status].label}</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{sel.subject}</h3>
            {/* Status timeline */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {['open','in-progress','waiting','resolved','closed'].map((s, i) => {
                const idx = ['open','in-progress','waiting','resolved','closed'].indexOf(sel.status);
                const done = i <= idx;
                return (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? statusMap[s].color : 'rgba(63,169,245,0.08)' }} />
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
              Created {sel.created} · Assigned to {sel.assignee}
            </div>
          </GlassPanel>

          {/* Messages */}
          <GlassPanel style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SectionHeader title="Messages" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              <MessageBubble from="ShieldTech" time="Jun 3, 2:30 PM"
                text="Hi Jennifer, we've identified the issue with your rear exit camera. Our diagnostics show intermittent PoE loss. We've scheduled technician Mike Reyes to inspect the cable run." />
              <MessageBubble from="You" time="Jun 3, 3:15 PM" isUser
                text="Thanks for the quick response. The camera seems to be working again now but it keeps dropping out." />
              <MessageBubble from="ShieldTech" time="Jun 4, 9:00 AM"
                text="That's consistent with a loose connector. Mike will be on-site Thursday between 10 AM–12 PM. We'll re-terminate the cable and test for 24h." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Type a message…" style={{
                flex: 1, padding: '8px 12px', background: 'rgba(5,7,10,0.5)',
                border: '1px solid var(--border-subtle)', borderRadius: 6,
                color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
              }} />
              <button onClick={() => shieldToast('Message sent', 'ok')} style={{
                background: 'var(--brand)', border: 'none', borderRadius: 6,
                padding: '8px 14px', color: '#fff', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-body)'
              }}>Send</button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

/* ── Remote Session View ── */
function RemoteSessionView() {
  const [requesting, setRequesting] = React.useState(false);
  const sessions = [
    { id: 'RS-0042', date: 'May 28, 2026', tech: 'Kevin White', duration: '45 min', summary: 'NVR firmware update + camera repositioning via PTZ', status: 'completed' },
    { id: 'RS-0038', date: 'Apr 12, 2026', tech: 'Mike Reyes', duration: '20 min', summary: 'Access control user provisioning — 3 new badges', status: 'completed' },
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Remote Support Sessions</h2>
        <button onClick={() => setRequesting(true)} style={{
          background: 'var(--brand)', border: 'none', borderRadius: 8,
          padding: '8px 18px', color: '#fff', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          boxShadow: '0 0 16px -4px rgba(63,169,245,0.3)'
        }}>Request Remote Session</button>
      </div>

      {/* Request form */}
      {requesting && (
        <GlassPanel style={{ marginBottom: 20, borderLeft: '3px solid var(--brand)', animation: 'fade-up 0.3s ease both' }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Request Remote Access</h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14, lineHeight: 1.5 }}>
            A technician will request to remotely access your system. You'll approve the session, which is time-limited and fully logged.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="Reason" placeholder="What do you need help with?" />
            <FormSelect label="Device / System (optional)" value="" onChange={() => {}}
              options={[
                { value: '', label: 'Select…' },
                { value: 'nvr', label: 'Hanwha XNR-6410 NVR' },
                { value: 'panel', label: 'DSC PowerSeries Neo Panel' },
                { value: 'ac', label: 'HID Access Control System' },
              ]}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setRequesting(false)} style={{
                padding: '8px 18px', background: 'var(--brand)', border: 'none',
                borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>Submit Request</button>
              <button onClick={() => setRequesting(false)} style={{
                padding: '8px 18px', background: 'transparent',
                border: '1px solid var(--border-subtle)', borderRadius: 6,
                color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-body)'
              }}>Cancel</button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Pending approval card */}
      <GlassPanel style={{ marginBottom: 16, borderLeft: '3px solid var(--status-warn)', animation: 'fade-up 0.4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <StatusBadge status="pending" label="Pending Your Approval" />
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginLeft: 'auto' }}>Just now</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 6 }}>
          <strong>Mike Reyes</strong> is requesting remote access to your <strong>NVR system</strong> to update firmware.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-low)', marginBottom: 12 }}>Session will auto-expire after 2 hours. All actions are logged.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => shieldToast('Remote session approved — access granted for 2 hours', 'ok')} style={{
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
            color: 'var(--status-ok)', padding: '7px 18px', borderRadius: 6,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>✓ Approve Session</button>
          <button onClick={() => shieldToast('Remote session denied', 'warn')} style={{
            background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
            color: 'var(--status-critical)', padding: '7px 14px', borderRadius: 6,
            fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>Deny</button>
        </div>
      </GlassPanel>

      {/* Session history */}
      <GlassPanel>
        <SectionHeader title="Session History" />
        {sessions.map((s, i) => (
          <div key={i} style={{
            padding: '12px 0', borderBottom: i < sessions.length - 1 ? '1px solid rgba(63,169,245,0.05)' : 'none',
            display: 'flex', gap: 12
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{s.id}</span>
                <StatusBadge status="online" label="Completed" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 2 }}>{s.summary}</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{s.tech} · {s.duration} · {s.date}</div>
            </div>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

/* ── Customer AI Chat ── */
function CustomerAIChatView() {
  return (
    <div style={{ maxWidth: 700 }}>
      <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: 'var(--glow-brand-sm)'
          }}>⟡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>ShieldTech Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Ask anything about your security systems</div>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 300 }}>
          <MessageBubble from="AI" time=""
            text="Hi! I'm your ShieldTech assistant. I can help you check system status, view footage schedules, start support tickets, or answer questions about your security setup. What can I help with?" />
          <MessageBubble from="You" time="" isUser
            text="Is everything online right now?" />
          <MessageBubble from="AI" time=""
            text="Almost! 23 of your 24 devices are online. The Hikvision camera at the rear exit has been intermittent — your team already has a ticket open (TKT-2845) and a technician visit is scheduled for Thursday." />
          <MessageBubble from="You" time="" isUser
            text="When is my next scheduled maintenance?" />
          <MessageBubble from="AI" time=""
            text="Your next scheduled maintenance visit is June 28, 2026. It will cover quarterly camera cleaning, NVR health check, and access control firmware updates." />
        </div>

        {/* Suggested actions */}
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Check system status', 'View upcoming service', 'Start a ticket', 'How do I view footage?'].map((s, i) => (
            <button key={i} onClick={() => shieldToast(s)} style={{
              padding: '5px 12px', borderRadius: 100,
              background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
              color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{s}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <input placeholder="Ask anything…" style={{
            flex: 1, padding: '10px 14px', background: 'rgba(5,7,10,0.5)',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
          }} />
          <button onClick={() => shieldToast('Message sent to ShieldTech AI', 'ok')} style={{
            background: 'var(--brand)', border: 'none', borderRadius: 8,
            padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 500
          }}>Send</button>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── Helpers ── */
function MessageBubble({ from, time, text, isUser }) {
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%', padding: '10px 14px',
        borderRadius: isUser ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
        background: isUser ? 'rgba(63,169,245,0.12)' : 'rgba(10,14,20,0.6)',
        border: `1px solid ${isUser ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        fontSize: 13, color: 'var(--text-high)', lineHeight: 1.55
      }}>
        {text}
        {time && <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>{time}</div>}
      </div>
    </div>
  );
}

function FormField({ label, placeholder, textarea, value, onChange }) {
  const style = {
    width: '100%', padding: textarea ? '10px 14px' : '9px 14px',
    background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
    resize: textarea ? 'vertical' : 'none'
  };
  return (
    <div>
      <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
      {textarea ? (
        <textarea placeholder={placeholder} rows={4} style={style} />
      ) : (
        <input placeholder={placeholder} style={style} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '9px 14px',
        background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
        fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
        appearance: 'none', cursor: 'pointer'
      }}>
        {options.map((o, i) => <option key={i} value={o.value} style={{ background: 'var(--card)' }}>{o.label}</option>)}
      </select>
    </div>
  );
}

Object.assign(window, {
  CustomerExpandedScreen, CustomerDashboardView, NewTicketView,
  TicketListView, RemoteSessionView, CustomerAIChatView,
  MessageBubble, FormSelect
});

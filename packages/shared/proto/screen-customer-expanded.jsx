/* Expanded Customer Portal — Tickets, Remote Sessions, AI Concierge.
   REAL data only: tickets live in the RLS-scoped support_tickets table via
   window.__shieldTickets (customers see their own; office roles see all).
   No fixture customers, no fabricated stats — empty states are honest. */

/* Load the caller-visible tickets (RLS decides scope). */
function useSupportTickets() {
  const [state, setState] = React.useState({ loading: true, error: null, tickets: [] });
  const refresh = React.useCallback(() => {
    const t = window.__shieldTickets;
    if (!t) { setState({ loading: false, error: 'Backend not configured', tickets: [] }); return; }
    t.list().then(r => {
      setState({ loading: false, error: r.ok ? null : r.error, tickets: r.data || [] });
    }).catch(e => setState({ loading: false, error: String(e), tickets: [] }));
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  return [state, refresh];
}

const TKT_STATUS = {
  'open':        { color: 'var(--brand)', label: 'Open' },
  'in-progress': { color: 'var(--status-warn)', label: 'In Progress' },
  'waiting':     { color: '#c084fc', label: 'Waiting on You' },
  'resolved':    { color: 'var(--status-ok)', label: 'Resolved' },
  'closed':      { color: 'var(--text-low)', label: 'Closed' },
};

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
          { id: 'tickets', label: 'Tickets', icon: '☰' },
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

/* ── Dashboard View — real ticket stats + quick actions, nothing invented ── */
function CustomerDashboardView({ onNavigate }) {
  const [{ loading, tickets }] = useSupportTickets();
  const me = window.__shieldUser || {};
  const open = tickets.filter(t => t.status === 'open' || t.status === 'in-progress');
  const waiting = tickets.filter(t => t.status === 'waiting');
  const recent = tickets.slice(0, 4);
  // Shell nav ids differ between the customer app ('ai') and this screen's
  // own sub-nav ('ai-chat'); prefer whichever the host handles.
  const goAI = () => onNavigate(typeof onNavigate === 'function' ? 'ai-chat' : 'ai-chat');

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 24, animation: 'fade-up 0.5s ease both' }}>
        <h1 className="display" style={{ fontSize: 26, fontWeight: 200, color: 'var(--text-high)' }}>
          Welcome back{me.name ? <span style={{ fontWeight: 400 }}>, {me.name}</span> : ''}
        </h1>
        {me.company && <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>{me.company}</p>}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'A camera is offline', icon: '◉', action: () => onNavigate('new-ticket') },
          { label: 'I need footage', icon: '▶', action: () => onNavigate('new-ticket') },
          { label: 'Add access user', icon: '⊠', action: () => onNavigate('new-ticket') },
          { label: 'Schedule service', icon: '⚙', action: () => onNavigate('new-ticket') },
          { label: 'Ask AI assistant', icon: '⟡', action: goAI },
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

      {/* Real ticket stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard label="OPEN TICKETS" value={loading ? '…' : open.length} delay={100} />
        <StatCard label="WAITING ON YOU" value={loading ? '…' : waiting.length} delay={180} />
        <StatCard label="RESOLVED" value={loading ? '…' : tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length} delay={260} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Recent tickets */}
        <GlassPanel>
          <SectionHeader title="Recent Tickets" />
          {loading && <div style={{ padding: 18, fontSize: 12, color: 'var(--text-low)' }}>Loading…</div>}
          {!loading && recent.length === 0 && (
            <div style={{ padding: 18, fontSize: 12, color: 'var(--text-low)' }}>
              No tickets yet. If anything needs attention — a camera, a door, footage, billing — submit a ticket and our team will jump on it.
            </div>
          )}
          {recent.map(t => {
            const st = TKT_STATUS[t.status] || TKT_STATUS.open;
            return (
              <div key={t.id} onClick={() => onNavigate('tickets')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', cursor: 'pointer' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{t.ref}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</span>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: `${st.color}15`, color: st.color }}>{st.label}</span>
              </div>
            );
          })}
        </GlassPanel>

        {/* Support contact — real numbers, no invented SLAs */}
        <GlassPanel>
          <SectionHeader title="Reach Us" />
          <div style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 2 }}>
            <div>📞 <span className="mono" style={{ color: 'var(--brand)' }}>484-800-1220</span></div>
            <div>✉️ <span style={{ color: 'var(--brand)' }}>customer@shieldtechsolutions.com</span></div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 10, lineHeight: 1.6 }}>
            Tickets are the fastest way to get help — they go straight to our office queue and you can track every reply here.
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ── New Ticket Form — writes a real support_tickets row ── */
function NewTicketView({ onNavigate }) {
  const [subject, setSubject] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [busy, setBusy] = React.useState(false);
  const [created, setCreated] = React.useState(null);

  const quickPicks = [
    { label: 'A camera is offline', cat: 'camera', pri: 'high', icon: '◉' },
    { label: 'I need footage retrieved', cat: 'camera', pri: 'medium', icon: '▶' },
    { label: 'Add a user to access control', cat: 'access', pri: 'low', icon: '⊠' },
    { label: 'Schedule a service visit', cat: 'other', pri: 'medium', icon: '⚙' },
    { label: 'Alarm system issue', cat: 'alarm', pri: 'high', icon: '🛡' },
    { label: 'Billing question', cat: 'billing', pri: 'low', icon: '▭' },
  ];

  const submit = async () => {
    if (!subject.trim()) { shieldToast('Add a short subject first', 'warn'); return; }
    const t = window.__shieldTickets;
    if (!t) { shieldToast('Support backend not configured', 'warn'); return; }
    setBusy(true);
    const r = await t.create({ subject, description, category, priority });
    setBusy(false);
    if (!r.ok) { shieldToast(`Could not submit: ${r.error}`, 'warn'); return; }
    setCreated(r.data);
  };

  if (created) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fade-up 0.5s ease both' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(52,211,153,0.1)', border: '2px solid var(--status-ok)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, boxShadow: '0 0 24px rgba(52,211,153,0.15)'
        }}>✓</div>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 300, marginBottom: 8 }}>Ticket Submitted</h2>
        <p className="mono" style={{ fontSize: 16, color: 'var(--brand)', marginBottom: 8 }}>{created.ref}</p>
        <p style={{ fontSize: 13, color: 'var(--text-low)', marginBottom: 24 }}>
          Our team has been notified by email and will respond as soon as possible. You can track replies on the Tickets tab.
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
            <button key={i} onClick={() => { setCategory(qp.cat); setPriority(qp.pri); if (!subject) setSubject(qp.label); }} className="glass" style={{
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
          <FormField label="Subject" placeholder="Brief description of the issue" value={subject} onChange={e => setSubject(e.target.value)} />
          <FormField label="Description" placeholder="Please provide details about what you're experiencing…" textarea value={description} onChange={e => setDescription(e.target.value)} />
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

          <button onClick={submit} disabled={busy} style={{
            padding: '12px', background: 'var(--brand)', border: 'none',
            borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 14,
            fontWeight: 600, cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
            opacity: busy ? 0.6 : 1,
            boxShadow: '0 0 20px -4px rgba(63,169,245,0.4)'
          }}>{busy ? 'Submitting…' : 'Submit Ticket'}</button>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── Ticket List — real rows + real message thread ── */
function TicketListView({ onNavigate, selectedTicket, setSelectedTicket }) {
  const [{ loading, error, tickets }, refresh] = useSupportTickets();
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const sel = tickets.find(t => t.id === selectedTicket) || null;

  const send = async () => {
    if (!sel || !draft.trim() || sending) return;
    setSending(true);
    const r = await window.__shieldTickets.addMessage(sel.id, draft);
    setSending(false);
    if (!r.ok) { shieldToast(`Could not send: ${r.error}`, 'warn'); return; }
    setDraft('');
    refresh();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 400px' : '1fr', gap: 16 }}>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <SectionHeader title="Tickets" count={tickets.length} />
          <button onClick={() => onNavigate('new-ticket')} style={{
            background: 'var(--brand)', border: 'none', borderRadius: 6,
            padding: '6px 14px', color: '#fff', fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)'
          }}>+ New Ticket</button>
        </div>
        {loading && <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>Loading tickets…</div>}
        {!loading && error && <div style={{ padding: 26, textAlign: 'center', color: 'var(--status-warn)', fontSize: 12 }}>Couldn't load tickets: {error}</div>}
        {!loading && !error && tickets.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>
            No tickets yet — anything you submit shows up here with our replies.
          </div>
        )}
        {tickets.map(t => {
          const st = TKT_STATUS[t.status] || TKT_STATUS.open;
          const isSel = selectedTicket === t.id;
          return (
            <div key={t.id} onClick={() => setSelectedTicket(t.id)} style={{
              padding: '14px 20px', borderBottom: '1px solid rgba(63,169,245,0.04)',
              cursor: 'pointer', background: isSel ? 'rgba(63,169,245,0.06)' : 'transparent',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(63,169,245,0.03)'; }}
            onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{t.ref}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 4,
                  background: `${st.color}15`, color: st.color,
                  letterSpacing: '0.04em'
                }}>{st.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{new Date(t.updated_at || t.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', marginBottom: 4 }}>{t.subject}</div>
              <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{[t.category, `${t.priority} priority`, t.company].filter(Boolean).join(' · ')}</div>
            </div>
          );
        })}
      </GlassPanel>

      {/* Ticket Detail with the real message thread */}
      {sel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassPanel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 14, color: 'var(--brand)' }}>{sel.ref}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 4,
                background: `${(TKT_STATUS[sel.status] || TKT_STATUS.open).color}15`, color: (TKT_STATUS[sel.status] || TKT_STATUS.open).color
              }}>{(TKT_STATUS[sel.status] || TKT_STATUS.open).label}</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{sel.subject}</h3>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {['open','in-progress','waiting','resolved','closed'].map((s, i) => {
                const idx = ['open','in-progress','waiting','resolved','closed'].indexOf(sel.status);
                const done = i <= idx;
                return (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? (TKT_STATUS[s] || {}).color : 'rgba(63,169,245,0.08)' }} />
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
              Created {new Date(sel.created_at).toLocaleDateString()}{sel.company ? ` · ${sel.company}` : ''}
            </div>
          </GlassPanel>

          {/* Messages */}
          <GlassPanel style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SectionHeader title="Messages" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12, maxHeight: 340, overflowY: 'auto' }}>
              {(sel.thread || []).length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '8px 0' }}>No messages yet — add one below.</div>}
              {(sel.thread || []).map((m, i) => (
                <MessageBubble key={i}
                  from={m.from === 'shieldtech' ? 'ShieldTech' : (m.by || 'You')}
                  time={m.at ? new Date(m.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                  isUser={m.from !== 'shieldtech'}
                  text={m.text} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Type a message…" value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                style={{
                  flex: 1, padding: '8px 12px', background: 'rgba(5,7,10,0.5)',
                  border: '1px solid var(--border-subtle)', borderRadius: 6,
                  color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
                }} />
              <button onClick={send} disabled={sending || !draft.trim()} style={{
                background: 'var(--brand)', border: 'none', borderRadius: 6,
                padding: '8px 14px', color: '#fff', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-body)', opacity: sending || !draft.trim() ? 0.5 : 1
              }}>{sending ? '…' : 'Send'}</button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

/* ── Remote Session View — requests are real tickets; no invented sessions ── */
function RemoteSessionView() {
  const [requesting, setRequesting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [system, setSystem] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [{ loading, tickets }, refresh] = useSupportTickets();
  const remoteTickets = tickets.filter(t => t.category === 'remote-access');

  const submit = async () => {
    if (!reason.trim()) { shieldToast('Tell us what you need help with', 'warn'); return; }
    const t = window.__shieldTickets;
    if (!t) { shieldToast('Support backend not configured', 'warn'); return; }
    setBusy(true);
    const r = await t.create({
      subject: `Remote session request${system ? ` — ${system}` : ''}`,
      description: reason,
      category: 'remote-access', priority: 'high',
    });
    setBusy(false);
    if (!r.ok) { shieldToast(`Could not submit: ${r.error}`, 'warn'); return; }
    shieldToast(`Request ${r.data.ref} sent — our team will coordinate the session with you`, 'ok');
    setRequesting(false); setReason(''); setSystem('');
    refresh();
  };

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
            This opens a high-priority ticket with our team. A technician will contact you to arrange and authorize the session — remote access only ever happens with your approval.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="Reason" placeholder="What do you need help with?" value={reason} onChange={e => setReason(e.target.value)} />
            <FormField label="Device / System (optional)" placeholder="e.g. NVR, alarm panel, access control" value={system} onChange={e => setSystem(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submit} disabled={busy} style={{
                padding: '8px 18px', background: 'var(--brand)', border: 'none',
                borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: busy ? 0.6 : 1
              }}>{busy ? 'Sending…' : 'Submit Request'}</button>
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

      {/* Request history — real remote-access tickets */}
      <GlassPanel>
        <SectionHeader title="Requests & Sessions" />
        {loading && <div style={{ padding: 14, fontSize: 12, color: 'var(--text-low)' }}>Loading…</div>}
        {!loading && remoteTickets.length === 0 && (
          <div style={{ padding: 14, fontSize: 12, color: 'var(--text-low)' }}>
            No remote sessions yet. When you request one, it shows up here and our team coordinates a time with you.
          </div>
        )}
        {remoteTickets.map(t => {
          const st = TKT_STATUS[t.status] || TKT_STATUS.open;
          return (
            <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{t.ref}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: `${st.color}15`, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 2 }}>{t.subject}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{new Date(t.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </GlassPanel>
    </div>
  );
}

/* ── Customer AI Chat — the REAL concierge (no canned transcripts) ── */
function CustomerAIChatView() {
  const Concierge = window.CustConciergeView;
  if (Concierge) return <Concierge />;
  return (
    <GlassPanel style={{ maxWidth: 700, padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
      The AI assistant isn't available right now — submit a ticket and a human will help instead.
    </GlassPanel>
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
        <textarea placeholder={placeholder} rows={4} style={style} value={value} onChange={onChange} />
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
  MessageBubble, FormSelect, useSupportTickets, TKT_STATUS
});

/* Screen — Help Desk (v2: fully interactive) */

function HelpdeskScreen() {
  const [tickets, setTickets] = useShieldStore(ticketStore);
  const [activeTab, setActiveTab] = React.useState('open');
  const [selectedId, setSelectedId] = React.useState(tickets[0]?.id);
  const [replyText, setReplyText] = React.useState('');
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());

  // Tick clock for SLA countdowns
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const techs = [
    { id: 'MR', name: 'Mike Reyes' }, { id: 'JL', name: 'Jessica Liu' },
    { id: 'KW', name: 'Kevin White' }, { id: 'DP', name: 'Diana Patel' }, { id: 'TG', name: 'Tony Garcia' }
  ];

  const priorityColors = { critical: '#F43F5E', high: '#FBBF24', medium: '#3FA9F5', low: 'var(--text-low)' };
  const statusColors = { open: 'var(--status-critical)', 'in-progress': 'var(--status-warn)', resolved: 'var(--status-ok)' };

  const filtered = tickets.filter(t =>
    activeTab === 'all' ? true :
    activeTab === 'open' ? t.status !== 'resolved' :
    t.status === activeTab
  );

  const tk = tickets.find(t => t.id === selectedId) || tickets[0];

  // SLA remaining in hours (live)
  const getSLARemaining = (t) => {
    const ageH = (now - t.created) / 3600000;
    return Math.max(0, t.sla.total - ageH).toFixed(1);
  };
  const getSLAPct = (t) => {
    const rem = parseFloat(getSLARemaining(t));
    return (rem / t.sla.total) * 100;
  };

  const sendReply = () => {
    if (!replyText.trim() || !tk) return;
    const msg = { from: 'John Mitchell', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), msg: replyText.trim(), system: false };
    setTickets(prev => prev.map(t => t.id === tk.id ? { ...t, thread: [...t.thread, msg] } : t));
    setReplyText('');
    showToast('Reply sent', 'ok');
  };

  const changeStatus = (id, status) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const msg = { from: 'System', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), msg: `Ticket status changed to ${status}.`, system: true };
      return { ...t, status, thread: [...t.thread, msg] };
    }));
    showToast(`Ticket ${status}`, status === 'resolved' ? 'ok' : 'info');
  };

  const assignTech = (id, techId) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const tech = techs.find(x => x.id === techId);
      const msg = { from: 'System', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), msg: `Ticket assigned to ${tech?.name || techId}.`, system: true };
      return { ...t, assignee: techId, status: t.status === 'open' ? 'in-progress' : t.status, thread: [...t.thread, msg] };
    }));
    showToast('Assigned', 'ok');
  };

  const escalateToIncident = (t) => {
    const newInc = {
      id: genId('INC'),
      severity: t.priority === 'critical' ? 'P1' : 'P2',
      status: 'active',
      customer: t.customer,
      type: 'Escalated from Help Desk',
      assignee: techs.find(x => x.id === t.assignee)?.name || 'Unassigned',
      openedAt: Date.now(),
      title: t.subject,
      playbook: [
        { step: 'Acknowledge and assess severity', done: false },
        { step: 'Notify relevant stakeholders', done: false },
        { step: 'Begin remediation', done: false },
        { step: 'Resolve and document', done: false },
      ],
      relatedTicket: t.id
    };
    incidentStore.set(prev => [...prev, newInc]);
    changeStatus(t.id, 'in-progress');
    showToast(`Escalated to ${newInc.id}`, 'warn');
    navTo('incidents');
  };

  const stats = [
    { label: 'OPEN', val: tickets.filter(t => t.status === 'open').length, color: 'var(--status-critical)' },
    { label: 'IN PROGRESS', val: tickets.filter(t => t.status === 'in-progress').length, color: 'var(--status-warn)' },
    { label: 'RESOLVED', val: tickets.filter(t => t.status === 'resolved').length, color: 'var(--status-ok)' },
    { label: 'SLA AT RISK', val: tickets.filter(t => parseFloat(getSLARemaining(t)) < 2 && t.status !== 'resolved').length, color: '#FBBF24' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', gap: 12, overflow: 'hidden' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {stats.map(s => (
          <div key={s.label} className="glass" style={{ padding: '12px 20px', flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
        <button onClick={() => setShowNewModal(true)} style={{ padding: '0 20px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ New Ticket</button>
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Left: ticket list */}
        <div className="glass" style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 4px' }}>
            {['open','in-progress','resolved','all'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '10px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                color: activeTab === tab ? 'var(--brand)' : 'var(--text-low)',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--brand)' : 'transparent'}`, transition: 'all 0.15s'
              }}>{tab === 'in-progress' ? 'Active' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(t => {
              const slaPct = getSLAPct(t);
              const slaRem = getSLARemaining(t);
              const slaRisk = parseFloat(slaRem) < 2 && t.status !== 'resolved';
              return (
                <div key={t.id} onClick={() => setSelectedId(t.id)} style={{
                  padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                  background: selectedId === t.id ? 'rgba(63,169,245,0.06)' : 'transparent',
                  borderLeft: `3px solid ${selectedId === t.id ? priorityColors[t.priority] : 'transparent'}`, transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityColors[t.priority], flexShrink: 0, boxShadow: t.priority === 'critical' ? `0 0 6px ${priorityColors[t.priority]}` : 'none' }} />
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.id}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: statusColors[t.status], background: `${statusColors[t.status]}15`, padding: '1px 7px', borderRadius: 100 }}>{t.status}</span>
                    {slaRisk && <span style={{ fontSize: 9, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.12)', padding: '1px 5px', borderRadius: 4 }}>⚠ SLA</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', marginBottom: 3, lineHeight: 1.3 }}>{t.subject}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: t.status !== 'resolved' ? 5 : 0 }}>{t.customer} · {t.assignee || 'Unassigned'}</div>
                  {t.status !== 'resolved' && (
                    <div style={{ height: 3, background: 'rgba(63,169,245,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${slaPct}%`, height: '100%', borderRadius: 2, background: slaPct > 50 ? 'var(--status-ok)' : slaPct > 20 ? 'var(--status-warn)' : 'var(--status-critical)', transition: 'width 0.4s ease' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: ticket detail */}
        {tk && (
          <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: priorityColors[tk.priority], boxShadow: `0 0 8px ${priorityColors[tk.priority]}` }} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{tk.id}</span>
                <span style={{ fontSize: 11, color: statusColors[tk.status], background: `${statusColors[tk.status]}15`, padding: '2px 10px', borderRadius: 100, fontWeight: 600 }}>{tk.status}</span>

                {/* Assign dropdown */}
                <select value={tk.assignee || ''} onChange={e => assignTech(tk.id, e.target.value)}
                  style={{ background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
                  <option value="">Unassigned</option>
                  {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                {/* SLA */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>SLA</span>
                  <div style={{ width: 80, height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${getSLAPct(tk)}%`, height: '100%', borderRadius: 3, background: getSLAPct(tk) > 50 ? 'var(--status-ok)' : getSLAPct(tk) > 20 ? 'var(--status-warn)' : 'var(--status-critical)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: parseFloat(getSLARemaining(tk)) < 1 ? 'var(--status-critical)' : parseFloat(getSLARemaining(tk)) < 2 ? 'var(--status-warn)' : 'var(--status-ok)', fontWeight: 600 }}>
                    {tk.status === 'resolved' ? '✓ Met' : `${getSLARemaining(tk)}h`}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', marginBottom: 4 }}>{tk.subject}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{tk.customer} · {tk.contact}</span>
                {tk.relatedAsset && <span style={{ fontSize: 10, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', padding: '2px 8px', borderRadius: 4 }}>▢ {tk.relatedAsset}</span>}
                {tk.tags.map(tag => <span key={tag} style={{ fontSize: 9, color: 'var(--text-low)', background: 'rgba(63,169,245,0.06)', padding: '1px 6px', borderRadius: 4 }}>#{tag}</span>)}
              </div>
            </div>

            {/* Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tk.thread.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, opacity: msg.system ? 0.5 : 1 }}>
                  {!msg.system && <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(63,169,245,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--brand)', flexShrink: 0, border: '1px solid var(--border-strong)' }}>{msg.from.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>}
                  {msg.system && <div style={{ width: 30, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 6 }}><div style={{ width: 1, height: '100%', background: 'var(--border-subtle)' }} /></div>}
                  <div style={{ flex: 1 }}>
                    {!msg.system && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{msg.from}</span><span style={{ fontSize: 10, color: 'var(--text-low)' }}>{msg.time}</span></div>}
                    <div style={{ fontSize: msg.system ? 10 : 13, color: msg.system ? 'var(--text-low)' : 'var(--text-mid)', lineHeight: 1.55, fontStyle: msg.system ? 'italic' : 'normal', background: msg.system ? 'transparent' : 'rgba(63,169,245,0.03)', border: msg.system ? 'none' : '1px solid var(--border-subtle)', borderRadius: msg.system ? 0 : 8, padding: msg.system ? 0 : '8px 12px' }}>{msg.msg}</div>
                  </div>
                </div>
              ))}

              {tk.aiSuggestion && (
                <div style={{ background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(63,169,245,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'var(--brand)', fontWeight: 700 }}>AI</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>Hermes Suggested Resolution</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.55, margin: 0 }}>{tk.aiSuggestion}</p>
                  <button onClick={() => setReplyText(tk.aiSuggestion)} style={{ marginTop: 8, fontSize: 11, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Use as Reply</button>
                </div>
              )}
            </div>

            {/* Reply + actions */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
                placeholder="Type a reply… (⌘Enter to send)"
                style={{ width: '100%', height: 68, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 12, padding: '10px 12px', resize: 'none', fontFamily: 'var(--font-body)', outline: 'none', lineHeight: 1.5 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={sendReply} disabled={!replyText.trim()} style={{ flex: 1, padding: '7px 0', background: replyText.trim() ? 'rgba(63,169,245,0.1)' : 'rgba(63,169,245,0.04)', border: '1px solid var(--border-strong)', borderRadius: 6, color: replyText.trim() ? 'var(--brand)' : 'var(--text-low)', fontSize: 11, fontWeight: 600, cursor: replyText.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>Send Reply</button>
                {tk.status !== 'resolved' && <button onClick={() => changeStatus(tk.id, 'resolved')} style={{ padding: '7px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Resolve ✓</button>}
                {tk.status === 'open' && <button onClick={() => changeStatus(tk.id, 'in-progress')} style={{ padding: '7px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 6, color: 'var(--status-warn)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Start</button>}
                {tk.status !== 'resolved' && tk.priority !== 'low' && <button onClick={() => escalateToIncident(tk)} style={{ padding: '7px 14px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Escalate →</button>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewModal && <NewTicketModal techs={techs} onClose={() => setShowNewModal(false)} onCreate={(t) => { setTickets(prev => [t, ...prev]); setSelectedId(t.id); setShowNewModal(false); showToast(`${t.id} created`, 'ok'); }} />}
    </div>
  );
}

function NewTicketModal({ techs, onClose, onCreate }) {
  const [form, setForm] = React.useState({ customer: '', contact: '', subject: '', priority: 'medium', assignee: '', tags: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!form.customer || !form.subject) return;
    onCreate({
      id: 'TK-' + (1050 + Math.floor(Math.random() * 100)),
      priority: form.priority, status: 'open',
      customer: form.customer, contact: form.contact,
      subject: form.subject, created: Date.now(),
      sla: { total: form.priority === 'critical' ? 4 : form.priority === 'high' ? 8 : 24, remaining: form.priority === 'critical' ? 4 : form.priority === 'high' ? 8 : 24 },
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      assignee: form.assignee || null, thread: [{ from: 'System', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), msg: 'Ticket created.', system: true }],
      relatedAsset: '', aiSuggestion: null
    });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, backdropFilter: 'blur(4px)' }} />
      <div className="glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto', width: 480, height: 'fit-content', zIndex: 901, padding: 24, animation: 'fade-up 0.2s ease both', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>New Support Ticket</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        {[
          { label: 'Customer *', key: 'customer', ph: 'e.g. Riverside Medical' },
          { label: 'Contact Name', key: 'contact', ph: 'e.g. Karen Mills' },
          { label: 'Subject *', key: 'subject', ph: 'Describe the issue briefly' },
          { label: 'Tags', key: 'tags', ph: 'hardware, nvr, alarm (comma-separated)' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{f.label}</div>
            <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph}
              style={{ width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>Priority</div>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} style={{ width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>Assign To</div>
            <select value={form.assignee} onChange={e => set('assignee', e.target.value)} style={{ width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              <option value="">Unassigned</option>
              {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={submit} disabled={!form.customer || !form.subject} style={{ flex: 2, padding: '9px 0', background: form.customer && form.subject ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.04)', border: `1px solid ${form.customer && form.subject ? 'var(--border-strong)' : 'var(--border-subtle)'}`, borderRadius: 7, color: form.customer && form.subject ? 'var(--brand)' : 'var(--text-low)', fontSize: 12, fontWeight: 600, cursor: form.customer && form.subject ? 'pointer' : 'default', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>Create Ticket</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { HelpdeskScreen });

/* Screen — Incident Response (v2: live timer, escalation, post-mortem) */

function IncidentScreen() {
  const [incidents, setIncidents] = useShieldStore(incidentStore);
  const [selectedId, setSelectedId] = React.useState(incidents[0]?.id);
  const [activeTab, setActiveTab] = React.useState('timeline');
  const [now, setNow] = React.useState(Date.now());
  const [showPostMortem, setShowPostMortem] = React.useState(false);
  const [newEventText, setNewEventText] = React.useState('');

  // Live clock — updates every second for active incidents
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const inc = incidents.find(i => i.id === selectedId) || incidents[0];

  const severityStyle = {
    P1: { color: 'var(--status-critical)', bg: 'rgba(244,63,94,0.15)', label: 'Critical' },
    P2: { color: 'var(--status-warn)',     bg: 'rgba(251,191,36,0.12)', label: 'High' },
    P3: { color: 'var(--brand)',           bg: 'rgba(63,169,245,0.12)', label: 'Medium' },
    P4: { color: 'var(--text-low)',        bg: 'rgba(92,111,134,0.15)', label: 'Low' },
  };

  const timelineColors = {
    alert: 'var(--status-critical)', ai: 'var(--brand)', tech: 'var(--status-ok)',
    mgmt: '#c084fc', customer: 'var(--status-warn)', user: 'var(--text-mid)'
  };

  const getDuration = (inc) => fmtDuration(now - inc.openedAt);
  const isAutoEscalate = (inc) => inc.severity === 'P1' && inc.status === 'active' && (now - inc.openedAt) > 3600000;

  const resolveIncident = (id) => {
    setIncidents(prev => prev.map(i => {
      if (i.id !== id) return i;
      const entry = { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), actor: 'John Mitchell', msg: `Incident resolved. Duration: ${fmtDuration(now - i.openedAt)}.`, type: 'mgmt' };
      return { ...i, status: 'resolved', timeline: [...(i.timeline || []), entry] };
    }));
    showToast('Incident resolved', 'ok');
  };

  const toggleStep = (incId, stepIdx) => {
    setIncidents(prev => prev.map(i => {
      if (i.id !== incId) return i;
      const playbook = i.playbook.map((s, si) => si === stepIdx ? { ...s, done: !s.done } : s);
      return { ...i, playbook };
    }));
  };

  const addTimelineEntry = () => {
    if (!newEventText.trim() || !inc) return;
    const entry = {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actor: 'John Mitchell', msg: newEventText.trim(), type: 'user'
    };
    setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, timeline: [...(i.timeline || []), entry] } : i));
    setNewEventText('');
  };

  const changeSeverity = (id, sev) => {
    setIncidents(prev => prev.map(i => {
      if (i.id !== id) return i;
      const entry = { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), actor: 'System', msg: `Severity changed to ${sev}.`, type: 'alert' };
      return { ...i, severity: sev, timeline: [...(i.timeline || []), entry] };
    }));
    showToast(`Severity → ${sev}`, 'info');
  };

  const declareNew = () => {
    const id = genId('INC');
    const newInc = {
      id, severity: 'P3', status: 'active',
      customer: 'Unknown', type: 'Manual Declaration',
      assignee: 'Unassigned', openedAt: Date.now(),
      title: 'New Incident — ' + id,
      playbook: [
        { step: 'Assess scope and severity', done: false },
        { step: 'Notify stakeholders', done: false },
        { step: 'Begin remediation', done: false },
        { step: 'Resolve and document', done: false },
      ],
      timeline: [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), actor: 'System', msg: 'Incident declared.', type: 'alert' }],
      relatedTicket: null
    };
    setIncidents(prev => [newInc, ...prev]);
    setSelectedId(id);
    showToast(`${id} declared`, 'warn');
  };

  const ss = inc ? severityStyle[inc.severity] : severityStyle.P3;
  const completedSteps = inc ? inc.playbook.filter(s => s.done).length : 0;

  // Auto-escalation alert
  const autoEscAlert = inc && isAutoEscalate(inc);

  return (
    <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Left: list */}
      <div className="glass" style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Incidents</span>
          <button onClick={declareNew} style={{ fontSize: 11, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Declare</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {incidents.map(i => {
            const s = severityStyle[i.severity];
            const dur = fmtDuration(now - i.openedAt);
            const escalate = isAutoEscalate(i);
            return (
              <div key={i.id} onClick={() => setSelectedId(i.id)} style={{
                padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                background: selectedId === i.id ? 'rgba(63,169,245,0.06)' : 'transparent',
                borderLeft: `3px solid ${selectedId === i.id ? s.color : 'transparent'}`, transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ padding: '2px 7px', background: s.bg, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: i.status === 'active' ? `0 0 5px ${s.color}` : 'none' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{i.severity}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{i.id}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: i.status === 'resolved' ? 'var(--status-ok)' : 'var(--status-warn)', background: i.status === 'resolved' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', padding: '1px 6px', borderRadius: 100 }}>{i.status}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.3, marginBottom: 3 }}>{i.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{i.customer}</span>
                  <span className="mono" style={{ fontSize: 10, color: i.status === 'active' ? s.color : 'var(--text-low)' }}>{dur}</span>
                </div>
                {escalate && <div style={{ marginTop: 5, fontSize: 9, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>⚠ Auto-escalation threshold exceeded</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: detail */}
      {inc && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Auto-escalation alert */}
          {autoEscAlert && (
            <div style={{ padding: '10px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, animation: 'fade-up 0.2s ease' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-critical)', boxShadow: '0 0 8px var(--status-critical)', animation: 'pulse-critical 1s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--status-critical)', fontWeight: 600 }}>P1 Incident exceeds 1-hour threshold — escalation to on-call manager required</span>
              <button onClick={() => shieldToast('Paging on-call manager…', 'warn')} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Page Manager</button>
            </div>
          )}

          {/* Header */}
          <div className="glass" style={{ padding: '14px 20px', flexShrink: 0, borderLeft: `4px solid ${ss.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ padding: '3px 10px', background: ss.bg, borderRadius: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ss.color, boxShadow: inc.status === 'active' ? `0 0 8px ${ss.color}` : 'none' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: ss.color }}>{inc.severity} · {ss.label}</span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{inc.id}</span>

              {/* Live duration */}
              <span className="mono" style={{ fontSize: 12, color: inc.status === 'active' ? ss.color : 'var(--text-low)', fontWeight: 600, background: `${ss.color}10`, padding: '2px 8px', borderRadius: 5 }}>⏱ {getDuration(inc)}</span>

              {/* Severity selector */}
              <select value={inc.severity} onChange={e => changeSeverity(inc.id, e.target.value)}
                style={{ background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
                {['P1','P2','P3','P4'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {inc.status === 'active' && <button onClick={() => resolveIncident(inc.id)} style={{ fontSize: 11, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>✓ Resolve</button>}
                {inc.status === 'resolved' && <button onClick={() => setShowPostMortem(true)} style={{ fontSize: 11, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Post-Mortem</button>}
                {inc.relatedTicket && <button onClick={() => navTo('helpdesk')} style={{ fontSize: 11, color: 'var(--text-mid)', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← {inc.relatedTicket}</button>}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)', marginBottom: 4 }}>{inc.title}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[{l:'Customer',v:inc.customer},{l:'Type',v:inc.type},{l:'Assignee',v:inc.assignee}].map(f => (
                <div key={f.l}><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 1 }}>{f.l}</div><div style={{ fontSize: 11, color: 'var(--text-high)' }}>{f.v}</div></div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {['timeline', 'playbook'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '7px 18px', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: activeTab === t ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.04)',
                color: activeTab === t ? 'var(--brand)' : 'var(--text-low)',
                border: `1px solid ${activeTab === t ? 'var(--border-strong)' : 'var(--border-subtle)'}`, transition: 'all 0.15s'
              }}>{t === 'playbook' ? `Playbook (${completedSteps}/${inc.playbook.length})` : 'Timeline'}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {activeTab === 'timeline' && (
              <div className="glass" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(inc.timeline || []).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: timelineColors[e.type] || 'var(--text-low)', boxShadow: `0 0 5px ${timelineColors[e.type] || 'var(--text-low)'}`, zIndex: 1 }} />
                      {i < (inc.timeline || []).length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: 3 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <span className="mono" style={{ fontSize: 11, color: timelineColors[e.type] || 'var(--text-low)', fontWeight: 600 }}>{e.time}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)' }}>{e.actor}</span>
                        <span style={{ fontSize: 9, color: timelineColors[e.type] || 'var(--text-low)', background: `${timelineColors[e.type] || 'rgba(63,169,245,0.1)'}20`, padding: '1px 6px', borderRadius: 4, textTransform: 'capitalize' }}>{e.type}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.55, margin: 0 }}>{e.msg}</p>
                    </div>
                  </div>
                ))}
                {inc.status === 'active' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <input value={newEventText} onChange={e => setNewEventText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTimelineEntry()}
                      placeholder="Add timeline entry… (Enter to submit)"
                      style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '7px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
                    <button onClick={addTimelineEntry} style={{ padding: '7px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'playbook' && (
              <div className="glass" style={{ padding: 16 }}>
                <div style={{ height: 4, background: 'rgba(63,169,245,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ width: `${(completedSteps / inc.playbook.length) * 100}%`, height: '100%', background: completedSteps === inc.playbook.length ? 'var(--status-ok)' : 'var(--brand)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>
                {inc.playbook.map((step, i) => (
                  <div key={i} onClick={() => toggleStep(inc.id, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${step.done ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: step.done ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
                      {step.done && <span style={{ fontSize: 10, color: 'var(--status-ok)', fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: step.done ? 'var(--text-low)' : 'var(--text-high)', textDecoration: step.done ? 'line-through' : 'none', transition: 'all 0.15s' }}>Step {i + 1}: {step.step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Mortem Modal */}
      {showPostMortem && inc && (
        <>
          <div onClick={() => setShowPostMortem(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, backdropFilter: 'blur(4px)' }} />
          <div className="glass" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 560, maxHeight: '80vh', zIndex: 901, padding: 24, overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>Post-Mortem Report — {inc.id}</span>
              <button onClick={() => setShowPostMortem(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            {[
              { label: 'Incident Summary', content: inc.title },
              { label: 'Customer Affected', content: inc.customer },
              { label: 'Duration', content: fmtDuration(now - inc.openedAt) },
              { label: 'Severity', content: `${inc.severity} — ${ss.label}` },
              { label: 'Resolution Steps', content: inc.playbook.filter(s => s.done).map((s, i) => `${i + 1}. ${s.step}`).join('\n') || 'No steps completed' },
              { label: 'Timeline Summary', content: (inc.timeline || []).map(e => `${e.time} [${e.actor}] ${e.msg}`).join('\n') },
              { label: 'Root Cause (draft)', content: 'To be completed by assignee.' },
              { label: 'Action Items', content: 'To be completed by assignee.' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)', marginBottom: 5 }}>{s.label}</div>
                <textarea defaultValue={s.content} style={{ width: '100%', minHeight: 60, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            ))}
            <button onClick={() => { setShowPostMortem(false); showToast('Post-mortem saved', 'ok'); }} style={{ width: '100%', padding: '10px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Post-Mortem</button>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { IncidentScreen });

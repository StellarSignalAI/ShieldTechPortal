/* Screen 5 — ShieldTech AI ⌘K Assistant */

function ShieldAIScreen() {
  const [typing, setTyping] = React.useState(true);
  const [draftOpen, setDraftOpen] = React.useState(false);
  const [input, setInput] = React.useState('');

  const send = () => {
    if (!input.trim()) return;
    shieldToast('ShieldTech AI is thinking…');
    setInput('');
  };

  React.useEffect(() => {
    const t = setTimeout(() => setTyping(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 100px)' }}>
      {/* Background content (dimmed dashboard) — click to dismiss */}
      <div onClick={() => { if (window.__shieldNav) window.__shieldNav('dashboard'); }} style={{ flex: 1, opacity: 0.3, filter: 'blur(2px)', cursor: 'pointer', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label="REVENUE TODAY" value={18420} suffix="USD" delay={0} />
          <StatCard label="OPEN TICKETS" value={14} delay={0} />
          <StatCard label="TECHS ACTIVE" value={12} delay={0} />
        </div>
        <GlassPanel>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)' }}>
            Dashboard content beneath the ShieldTech AI overlay
          </div>
        </GlassPanel>
      </div>

      {/* ShieldTech AI Panel — sliding in from right */}
      <div style={{
        width: 440, flexShrink: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        borderLeft: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px -20px rgba(0,0,0,0.5), 0 0 40px -10px rgba(63,169,245,0.1)',
        animation: 'hermes-slide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: 'var(--glow-brand-sm)'
          }}>⟡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>ShieldTech AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>AI Assistant · Online</div>
          </div>
          <span className="mono" style={{
            fontSize: 10, color: 'var(--text-low)', background: 'rgba(63,169,245,0.06)',
            padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)'
          }}>⌘K</span>
        </div>

        {/* Context bar */}
        <div style={{
          padding: '8px 20px', background: 'rgba(63,169,245,0.03)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <StatusDot status="info" size={5} />
          <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>No customer context selected</span>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Empty conversation state */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 220 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⟡</div>
            <div style={{ fontSize: 13, color: 'var(--text-high)', fontWeight: 500 }}>Ask ShieldTech AI anything</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-low)', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>Grounded answers about your customers, tickets, jobs, and bids — once your data and AI key are configured.</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{window.__shieldAIModel || 'model not configured'}</div>
          </div>

          {/* Skill chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 34 }}>
            {['Summarize site health', 'Score this lead', 'Check warranty status', 'Draft follow-up'].map((chip, i) => (
              <button key={i} style={{
                padding: '5px 12px', borderRadius: 100,
                background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
                color: 'var(--brand)', fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(63,169,245,0.12)'; e.target.style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(63,169,245,0.06)'; e.target.style.borderColor = 'var(--border-subtle)'; }}
              onClick={() => shieldToast(`ShieldTech AI: working on “${chip}”…`)}
              >{chip}</button>
            ))}
          </div>

          
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 8
        }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Ask ShieldTech AI anything…" style={{
            flex: 1, padding: '10px 14px',
            background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-high)', fontSize: 13,
            fontFamily: 'var(--font-body)', outline: 'none'
          }} />
          <button onClick={send} style={{
            background: 'var(--brand)', border: 'none', borderRadius: 8,
            padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 500,
            boxShadow: '0 0 12px -4px rgba(63,169,245,0.3)'
          }}>Send</button>
        </div>
      </div>

      <style>{`
        @keyframes hermes-slide {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { ShieldAIScreen });

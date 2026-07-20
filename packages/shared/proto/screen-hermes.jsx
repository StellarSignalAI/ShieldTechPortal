/* Screen 5 — Hermes ⌘K Assistant */

function HermesScreen() {
  const [typing, setTyping] = React.useState(true);
  const [draftOpen, setDraftOpen] = React.useState(true);
  const [input, setInput] = React.useState('');

  const send = () => {
    if (!input.trim()) return;
    shieldToast('Hermes is thinking…');
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
            Dashboard content beneath the Hermes overlay
          </div>
        </GlassPanel>
      </div>

      {/* Hermes Panel — sliding in from right */}
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
            <div style={{ fontSize: 14, fontWeight: 500 }}>Hermes</div>
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
          <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Viewing: Acme Dental — Site A</span>
          <span style={{ fontSize: 11, color: 'var(--text-low)', marginLeft: 'auto' }}>8 devices · 1 alert</span>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* User message */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: '12px 12px 4px 12px',
              background: 'rgba(63,169,245,0.12)', border: '1px solid var(--border-strong)',
              fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5
            }}>
              What's going on with Acme Dental's rear camera? Draft an email to let them know we're looking into it.
            </div>
          </div>

          {/* Hermes response */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, marginTop: 2
            }}>⟡</div>
            <div style={{ flex: 1 }}>
              <div style={{
                padding: '14px 16px', borderRadius: '4px 12px 12px 12px',
                background: 'rgba(10,14,20,0.6)', border: '1px solid var(--border-subtle)',
                fontSize: 13, color: 'var(--text-high)', lineHeight: 1.6
              }}>
                <p style={{ marginBottom: 10 }}>
                  The <strong>Hikvision DS-2CD2143</strong> at the rear exit has been intermittently offline. Here's what I found:
                </p>
                <ul style={{ paddingLeft: 16, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><span className="mono" style={{ fontSize: 12 }}>3 disconnections</span> in the past 7 days</li>
                  <li>Average downtime per incident: <span className="mono" style={{ fontSize: 12 }}>47 minutes</span></li>
                  <li>PoE draw was <span className="mono" style={{ fontSize: 12 }}>0W</span> during outages — suggests physical link loss</li>
                  <li>Other devices on the same switch remained online</li>
                </ul>
                <p style={{ marginBottom: 10 }}>
                  <strong>Assessment:</strong> Likely a failing ethernet cable or a loose RJ45 connector at the camera. I recommend dispatching a technician to re-terminate the cable run.
                </p>
                <p>I've drafted an email below for your review.</p>

                {typing && (
                  <div style={{
                    marginTop: 10, height: 4, borderRadius: 2,
                    background: 'linear-gradient(90deg, transparent, var(--brand), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite'
                  }} />
                )}
              </div>

              {/* Model footer */}
              <div className="mono" style={{
                fontSize: 10, color: 'var(--text-low)', marginTop: 6,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span>claude-3.5-sonnet</span>
                <span>·</span>
                <span>1,247 tokens</span>
                <span>·</span>
                <span>$0.004</span>
              </div>
            </div>
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
              onClick={() => shieldToast(`Hermes: working on “${chip}”…`)}
              >{chip}</button>
            ))}
          </div>

          {/* Approval Card */}
          {draftOpen && (
          <div style={{
            marginLeft: 34, padding: 16, borderRadius: 'var(--radius-md)',
            background: 'rgba(63,169,245,0.04)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 0 20px -8px rgba(63,169,245,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(251,191,36,0.12)', color: 'var(--status-warn)',
                padding: '2px 8px', borderRadius: 4
              }}>DRAFT — NOT SENT</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>Email to Acme Dental</span>
            </div>
            <div style={{
              background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
              borderRadius: 6, padding: 14, fontSize: 12, color: 'var(--text-mid)',
              lineHeight: 1.7, marginBottom: 14, fontFamily: 'var(--font-body)'
            }}>
              <div style={{ marginBottom: 6, color: 'var(--text-low)' }}>
                <strong style={{ color: 'var(--text-mid)' }}>To:</strong> jfoster@acmedental.com
              </div>
              <div style={{ marginBottom: 10, color: 'var(--text-low)' }}>
                <strong style={{ color: 'var(--text-mid)' }}>Subject:</strong> Re: Rear Exit Camera — Service Update
              </div>
              Hi Jennifer,<br /><br />
              We've detected intermittent connectivity on your rear exit camera (Hikvision DS-2CD2143) over the past week. Our diagnostics indicate a likely cable issue at the camera termination point.<br /><br />
              We'd like to schedule a technician visit to inspect and resolve this. Would Thursday or Friday work for your team?<br /><br />
              Best regards,<br />
              ShieldTech Service Team
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setDraftOpen(false); shieldToast('Email approved & sent to Acme Dental', 'ok'); }} style={{
                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                color: 'var(--status-ok)', padding: '7px 20px', borderRadius: 6,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>✓ Approve & Send</button>
              <button onClick={() => shieldModal({ kind: 'editor', title: 'Edit Draft — Email to Acme Dental', subtitle: 'To: jfoster@acmedental.com', submitLabel: 'Approve & Send', successMsg: 'Email approved & sent to Acme Dental', value: 'Hi Jennifer,\n\nWe have detected intermittent connectivity on your rear exit camera (Hikvision DS-2CD2143) over the past week. Our diagnostics indicate a likely cable issue at the camera termination point.\n\nWe would like to schedule a technician visit to inspect and resolve this. Would Thursday or Friday work for your team?\n\nBest regards,\nShieldTech Service Team', onSubmit: () => setDraftOpen(false) })} style={{
                background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
                color: 'var(--brand)', padding: '7px 16px', borderRadius: 6,
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>Edit</button>
              <button onClick={() => { setDraftOpen(false); shieldToast('Draft discarded', 'warn'); }} style={{
                background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
                color: 'var(--status-critical)', padding: '7px 16px', borderRadius: 6,
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>Reject</button>
            </div>
          </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 8
        }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Ask Hermes anything…" style={{
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

Object.assign(window, { HermesScreen });

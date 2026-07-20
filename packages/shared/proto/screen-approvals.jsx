/* Screen 10 — Approvals Center */

function ApprovalsScreen() {
  const ALL_APPROVALS = [];

  const [approvals, setApprovals] = React.useState(ALL_APPROVALS);
  const resolve = (a, action) => {
    setApprovals(prev => prev.filter(x => x.id !== a.id));
    if (action === 'approve') shieldToast(`Approved: ${a.title}`, 'ok');
    else shieldToast(`Rejected: ${a.title}`, 'warn');
  };

  const tagColors = {
    pricing: { bg: 'rgba(251,191,36,0.12)', color: 'var(--status-warn)', border: 'rgba(251,191,36,0.25)' },
    comms: { bg: 'rgba(63,169,245,0.12)', color: 'var(--brand)', border: 'rgba(63,169,245,0.25)' },
    contract: { bg: 'rgba(192,132,252,0.12)', color: '#c084fc', border: 'rgba(192,132,252,0.25)' },
    alarm: { bg: 'rgba(244,63,94,0.12)', color: 'var(--status-critical)', border: 'rgba(244,63,94,0.25)' },
    refund: { bg: 'rgba(52,211,153,0.12)', color: 'var(--status-ok)', border: 'rgba(52,211,153,0.25)' },
  };

  const riskIcons = { low: '○', medium: '◐', high: '●' };
  const riskColors = { low: 'var(--text-low)', medium: 'var(--status-warn)', high: 'var(--status-critical)' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-high)', letterSpacing: '-0.01em' }}>
            Approvals Center
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
            Review AI-drafted actions before they go live. ShieldTech AI drafts; you commit.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 100,
            background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)' }}>{approvals.length}</span>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>pending</span>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(tagColors).map(([tag, tc]) => {
          const count = approvals.filter(a => a.tag === tag).length;
          if (count === 0) return null;
          return (
            <div key={tag} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 100,
              background: tc.bg, border: `1px solid ${tc.border}`
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: tc.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tag}</span>
              <span className="mono" style={{ fontSize: 11, color: tc.color }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {approvals.length === 0 && (
        <div className="glass" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)', marginBottom: 6 }}>All caught up</div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>No pending approvals. ShieldTech AI will queue new drafts here as they come in.</div>
        </div>
      )}

      {/* Approval Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {approvals.map((a, i) => {
          const tc = tagColors[a.tag];
          return (
            <div key={a.id} className="glass" style={{
              padding: 0, overflow: 'hidden',
              animation: `fade-up 0.4s ease ${i * 60}ms both`,
              borderLeft: `3px solid ${tc.color}`
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid rgba(63,169,245,0.05)'
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: 4,
                  border: `1px solid ${tc.border}`
                }}>{a.tag}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', flex: 1 }}>{a.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: riskColors[a.risk] }}>{riskIcons[a.risk]}</span>
                  <span style={{ fontSize: 10, color: riskColors[a.risk], textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{a.risk} risk</span>
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.time}</span>
              </div>

              {/* Body */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 6 }}>
                  Affects: <span style={{ color: 'var(--text-mid)' }}>{a.who}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.55, marginBottom: a.content ? 12 : 14 }}>
                  {a.summary}
                </p>

                {/* Draft content (if present) */}
                {a.content && (
                  <div style={{
                    background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
                    borderRadius: 6, padding: 14, fontSize: 12, color: 'var(--text-mid)',
                    lineHeight: 1.7, marginBottom: 14, whiteSpace: 'pre-line',
                    fontFamily: 'var(--font-body)'
                  }}>
                    {a.content}
                  </div>
                )}

                {/* Footer: actions + model info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => resolve(a, 'approve')} style={{
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                      color: 'var(--status-ok)', padding: '7px 18px', borderRadius: 6,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>✓ Approve</button>
                    <button onClick={() => resolve(a, 'reject')} style={{
                      background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
                      color: 'var(--status-critical)', padding: '7px 14px', borderRadius: 6,
                      fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>✕ Reject</button>
                    {a.content && (
                      <button onClick={() => shieldModal({ kind: 'editor', title: 'Edit Draft — ' + a.title, subtitle: 'Affects: ' + a.who, submitLabel: 'Approve & Send', successMsg: 'Approved & sent: ' + a.title, value: a.content, onSubmit: () => resolve(a, 'approve') })} style={{
                        background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
                        color: 'var(--brand)', padding: '7px 14px', borderRadius: 6,
                        fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
                      }}>Edit</button>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>
                    {a.model} · {a.tokens} tok · {a.cost}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ApprovalsScreen });

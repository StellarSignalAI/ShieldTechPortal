/* Tech App — Field Tools II: Offline Sync Queue, Upsell Spotter, Lone-Worker Safety, Cert Skill Tree, Toolbox Talk */

/* ── 6. Offline Sync Queue ── */
function TechSyncView() {
  const [online, setOnline] = React.useState(true);
  const [items, setItems] = React.useState([]);
  const kindIcon = { photo: 'cameras', form: 'clipboard', time: 'timesheets' };
  const pending = items.filter(i => i.state !== 'synced').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Sync Queue</div>
      {/* Connection banner */}
      <div className="glass" style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${online ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: online ? 'var(--status-ok)' : 'var(--status-warn)', animation: online ? 'pulse-online 3s infinite' : 'none' }}></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: online ? 'var(--status-ok)' : 'var(--status-warn)' }}>{online ? 'Connected' : 'No signal — offline mode'}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{online ? 'All field data synced' : `${pending} items captured offline · everything keeps working`}</div>
        </div>
      </div>
      {/* Queue */}
      {items.length === 0
        ? <div className="glass" style={{ padding: 22, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)' }}>Queue empty — offline captures appear here until they sync.</div>
        : <div className="glass" style={{ padding: 4, borderRadius: 'var(--radius-md)' }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.05)', opacity: item.state === 'synced' ? 0.55 : 1, transition: 'opacity 0.3s' }}>
            <Icon name={kindIcon[item.kind]} size={16} color={item.state === 'synced' ? 'var(--status-ok)' : 'var(--text-mid)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{item.label}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{item.size}</div>
            </div>
            {item.state === 'queued' && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: '2px 8px' }}>QUEUED</span>}
            {item.state === 'syncing' && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand)', background: 'rgba(63,169,245,0.1)', borderRadius: 8, padding: '2px 8px' }}>SYNCING…</span>}
            {item.state === 'synced' && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--status-ok)' }}>✓ SYNCED</span>}
          </div>
        ))}
      </div>}
      <div style={{ fontSize: 9, color: 'var(--text-low)', lineHeight: 1.5 }}>Photos, forms, time entries, and signatures queue locally when you lose signal. Nothing is ever lost — the queue retries automatically and resolves conflicts office-side.</div>
    </div>
  );
}

/* ── 7. On-Site Upsell Spotter ── */
function TechUpsellView() {
  const [sent, setSent] = React.useState([]);
  const opps = [];
  const send = (o) => {
    setSent(s => [...s, o.id]);
    showToast(`Sent to office — quote draft created for ${o.title.toLowerCase()}`, 'ok');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Upsell Spotter</div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--status-ok)' }}>${opps.reduce((s, o) => s + o.value, 0).toLocaleString()} spotted</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)' }}>ShieldTech AI watches your photos, scans, and voice notes for revenue the office would never see. One tap → quote opportunity in the CRM.</div>
      {opps.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)' }}>No opportunities spotted yet — they surface as you document sites.</div>}
      {opps.map(o => {
        const isSent = sent.includes(o.id);
        return (
          <div key={o.id} className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)', opacity: isSent ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{o.title}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-ok)' }}>~${o.value.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 8 }}>{o.evidence}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', borderRadius: 8, padding: '2px 8px' }}>{o.src.toUpperCase()}</span>
              <span style={{ fontSize: 9, color: o.conf === 'High' ? 'var(--status-ok)' : 'var(--text-low)' }}>{o.conf} confidence</span>
              <button disabled={isSent} onClick={() => send(o)} style={{ marginLeft: 'auto', padding: '6px 13px', background: isSent ? 'transparent' : 'rgba(63,169,245,0.1)', border: `1px solid ${isSent ? 'var(--border-subtle)' : 'var(--border-strong)'}`, borderRadius: 7, color: isSent ? 'var(--text-low)' : 'var(--brand)', fontSize: 10, fontWeight: 700, cursor: isSent ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>{isSent ? '✓ Sent to office' : 'Send to office →'}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 8. Lone-Worker Safety ── */
function TechSafetyView() {
  const CHECK_INTERVAL = 45 * 60; // 45 min in s
  const [left, setLeft] = React.useState(CHECK_INTERVAL);
  const [escalated, setEscalated] = React.useState(false);
  React.useEffect(() => {
    const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor(left / 60), secs = left % 60;
  const pct = left / CHECK_INTERVAL;
  const urgent = left < 5 * 60;
  const R = 54, C = 2 * Math.PI * R;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Lone-Worker Safety</div>
      <div className="glass" style={{ padding: 22, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
          <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(63,169,245,0.1)" strokeWidth="7" />
            <circle cx="65" cy="65" r={R} fill="none" stroke={urgent ? 'var(--status-critical)' : 'var(--status-ok)'} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: urgent ? 'var(--status-critical)' : 'var(--text-high)' }}>{mins}:{String(secs).padStart(2, '0')}</span>
            <span style={{ fontSize: 8, letterSpacing: '0.1em', color: 'var(--text-low)' }}>NEXT CHECK-IN</span>
          </div>
        </div>
        <button onClick={() => { setLeft(CHECK_INTERVAL); setEscalated(false); showToast('Check-in logged — dispatch sees you’re OK', 'ok'); }}
          style={{ marginTop: 16, padding: '12px 42px', background: 'linear-gradient(135deg, var(--status-ok), #1f9e6e)', border: 'none', borderRadius: 24, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 6px 20px rgba(52,211,153,0.3)' }}>I'm OK ✓</button>
        <div style={{ marginTop: 10, fontSize: 9, color: 'var(--text-low)' }}>Timer auto-sets when a lone-work geofence is entered</div>
      </div>
      {/* Escalation ladder */}
      <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>If a check-in is missed</div>
        {[
          ['+0 min', 'Push + loud tone on this phone'],
          ['+3 min', 'SMS to you and dispatch'],
          ['+6 min', 'Dispatch calls; nearest tech pinged'],
          ['+10 min', 'Emergency contact + site supervisor notified'],
        ].map(([t, txt], i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', alignItems: 'baseline' }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: i < 2 ? 'var(--status-warn)' : 'var(--status-critical)', width: 50, flexShrink: 0 }}>{t}</span>
            <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{txt}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setEscalated(true); showToast('🚨 Man-down alert sent — dispatch + nearest tech notified', 'warn'); }}
        style={{ padding: '13px 0', background: escalated ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: 10, color: 'var(--status-critical)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        {escalated ? '🚨 ALERT ACTIVE — dispatch responding' : 'Emergency — alert dispatch now'}
      </button>
    </div>
  );
}

/* ── 9. Cert Skill Tree ── */
function TechSkillTreeView() {
  const badges = [];
  const tierC = { gold: '#FBBF24', silver: '#94A3B8', bronze: '#d97706', locked: 'rgba(148,163,184,0.3)' };
  const leaderboard = [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Skill Tree</div>
      {/* Level */}
      <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff' }}>
            <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>1</span>
            <span style={{ fontSize: 6, letterSpacing: '0.08em' }}>LEVEL</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Field Tech</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>0 XP</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
              <div style={{ width: '0%', height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--brand-pressed), var(--brand))' }}></div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3 }}>Earn XP from documented installs, certs & toolbox talks</div>
          </div>
        </div>
      </div>
      {/* Badges */}
      {badges.length === 0 && <div className="glass" style={{ padding: 22, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)' }}>No badges yet — certifications tracked in the portal appear here.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {badges.map(b => (
          <div key={b.name} className="glass" style={{ padding: '12px 12px', borderRadius: 'var(--radius-md)', opacity: b.earned ? 1 : 0.65, border: `1px solid ${b.earned ? tierC[b.tier] + '40' : 'var(--border-subtle)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: b.earned ? `${tierC[b.tier]}20` : 'rgba(148,163,184,0.08)', border: `2px solid ${tierC[b.tier]}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{b.earned ? '★' : '🔒'}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: b.earned ? 'var(--text-high)' : 'var(--text-low)', lineHeight: 1.2 }}>{b.name}</span>
            </div>
            <div style={{ fontSize: 9, color: b.earned ? tierC[b.tier] : 'var(--text-low)' }}>{b.earned ? `${b.tier.toUpperCase()} · +${b.xp} XP` : b.req}</div>
          </div>
        ))}
      </div>
      {/* Leaderboard */}
      {leaderboard.length > 0 && <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>Team</div>
        {leaderboard.map((p, i) => (
          <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6, background: p.me ? 'rgba(63,169,245,0.08)' : 'transparent' }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#FBBF24' : 'var(--text-low)', width: 18 }}>{i + 1}</span>
            <span style={{ fontSize: 12, color: p.me ? 'var(--brand)' : 'var(--text-mid)', fontWeight: p.me ? 600 : 400 }}>{p.n}{p.me ? ' (you)' : ''}</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-mid)' }}>{p.xp.toLocaleString()}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

/* ── 10. Toolbox Talk ── */
function TechToolboxView() {
  const briefing = null; // generated per-route once the AI service is configured
  const history = [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Toolbox Talk</div>
      {!briefing && (
        <div className="glass" style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)', lineHeight: 1.6 }}>
          No briefing today.<br />Daily safety talks are generated from your route once jobs are scheduled.
        </div>
      )}
      {/* History */}
      {history.length > 0 && <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>This week</div>
        {history.map(([d, t, s]) => (
          <div key={d} style={{ display: 'flex', gap: 10, padding: '6px 0', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 30 }}>{d}</span>
            <span style={{ fontSize: 11, color: 'var(--text-mid)', flex: 1 }}>{t}</span>
            <span style={{ fontSize: 10, color: 'var(--status-ok)' }}>{s}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

Object.assign(window, { TechSyncView, TechUpsellView, TechSafetyView, TechSkillTreeView, TechToolboxView });

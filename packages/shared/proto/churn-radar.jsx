/* Churn Radar — lives inside the admin Customer profile (CustomerDetail tab).
   Blends live signals (NPS, tickets, false alarms, billing) into a churn risk score
   with an explained breakdown and one-click save-plays. */

function churnSignalsFor(name) {
  const nps = (window.npsStore ? npsStore.get() : []).filter(n => n.customer === name);
  const tickets = (window.ticketStore ? ticketStore.get() : []).filter(t => t.customer === name);
  const mrr = (window.mrrStore ? mrrStore.get() : []).find(m => m.customer === name);

  const lastNps = nps.length ? nps[0].score : null;
  const openCritical = tickets.filter(t => t.status !== 'resolved' && (t.priority === 'critical' || t.priority === 'high')).length;
  const slaTight = tickets.filter(t => t.sla && t.sla.remaining > 0 && t.sla.remaining < 2).length;

  // Signal scores: 0 (healthy) → 100 (churn risk)
  const signals = [
    { label: 'NPS trend', score: lastNps == null ? 30 : lastNps >= 9 ? 5 : lastNps >= 7 ? 25 : lastNps >= 5 ? 65 : 90, detail: lastNps == null ? 'No recent survey' : `Latest score ${lastNps}/10 — "${(nps[0].comment || '').slice(0, 64)}…"` },
    { label: 'Support experience', score: Math.min(90, openCritical * 35 + slaTight * 20), detail: openCritical ? `${openCritical} open high/critical ticket${openCritical > 1 ? 's' : ''}${slaTight ? `, ${slaTight} near SLA breach` : ''}` : 'No open escalations' },
    { label: 'System reliability', score: name === 'Westfield Mall' ? 75 : name === 'Riverside Medical' ? 60 : 15, detail: name === 'Westfield Mall' ? '8 false alarms this month, $1,200 fines' : name === 'Riverside Medical' ? 'P1 outage this week (NVR offline)' : 'Uptime within SLA' },
    { label: 'Billing friction', score: name === 'Bayshore Medical' ? 70 : 10, detail: name === 'Bayshore Medical' ? 'Last 2 invoices paid 20+ days late' : 'Pays on time' },
    { label: 'Engagement', score: name === 'Bayshore Medical' ? 60 : 25, detail: name === 'Bayshore Medical' ? 'No portal logins in 45 days' : 'Active portal use' },
  ];
  const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
  const score = Math.round(signals.reduce((s, sig, i) => s + sig.score * weights[i], 0));
  return { signals, score, mrr, lastNps };
}

function ChurnRadarPanel({ customer, showToast }) {
  const name = customer.name;
  const { signals, score, mrr } = churnSignalsFor(name);
  const level = score > 60 ? 'critical' : score > 35 ? 'watch' : 'healthy';
  const levelC = level === 'critical' ? 'var(--status-critical)' : level === 'watch' ? 'var(--status-warn)' : 'var(--status-ok)';
  const toast = showToast || window.showToast;

  const plays = [
    level !== 'healthy' && { label: 'Schedule exec check-in call', desc: 'Owner-to-owner, this week', go: () => toast('Call placed on your calendar — Thu 3:00 PM') },
    level === 'critical' && { label: 'Draft win-back outreach', desc: 'Hermes writes it from their incident history', go: () => toast('Draft ready in your outbox') },
    { label: 'Proactive maintenance visit', desc: 'No-charge system tune-up, schedules from backlog', go: () => { if (window.backlogStore) backlogStore.set(prev => [{ id: 'p' + Date.now(), title: `${name} — Goodwill PM visit`, customer: name, type: 'maintenance', dur: 2, days: 1, value: 0, addr: '—', sla: '7d' }, ...prev]); toast('PM visit added to Unscheduled tray'); } },
    level !== 'healthy' && mrr && { label: 'Offer one-month service credit', desc: `$${mrr.mrr.toLocaleString()} — needs your approval`, go: () => toast('Credit queued for approval') },
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 1100, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, alignItems: 'start' }}>
      {/* Score */}
      <GlassPanel style={{ textAlign: 'center', padding: 24 }}>
        <div className="label-sm" style={{ marginBottom: 14 }}>CHURN RISK</div>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(63,169,245,0.08)" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={levelC} strokeWidth="10" strokeDasharray={`${score / 100 * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.6s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mono" style={{ fontSize: 30, fontWeight: 700, color: levelC }}>{score}</span>
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)' }}>/100</span>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: levelC, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {level === 'critical' ? '⚠ Save-play needed' : level === 'watch' ? 'Watch list' : '✓ Healthy'}
        </div>
        {mrr && (
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-low)', marginBottom: 3 }}>
              <span>AT STAKE</span><span>RENEWAL</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>${(mrr.mrr * 12).toLocaleString()}/yr</span>
              <span className="mono" style={{ fontSize: 12, color: level === 'healthy' ? 'var(--text-mid)' : 'var(--status-warn)' }}>{mrr.renewal}</span>
            </div>
          </div>
        )}
      </GlassPanel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Signals */}
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12 }}>SIGNAL BREAKDOWN — why this score</div>
          {signals.map(sig => {
            const c = sig.score > 60 ? 'var(--status-critical)' : sig.score > 35 ? 'var(--status-warn)' : 'var(--status-ok)';
            return (
              <div key={sig.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)', width: 130, flexShrink: 0 }}>{sig.label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.07)', overflow: 'hidden' }}>
                  <div style={{ width: `${sig.score}%`, height: '100%', borderRadius: 3, background: c, transition: 'width 0.5s' }}></div>
                </div>
                <span className="mono" style={{ fontSize: 10, color: c, width: 26, textAlign: 'right', flexShrink: 0 }}>{sig.score}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)', width: 280, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sig.detail}>{sig.detail}</span>
              </div>
            );
          })}
        </GlassPanel>

        {/* Save plays */}
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12 }}>RECOMMENDED PLAYS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {plays.map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)' }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 1 }}>{p.desc}</div>
                </div>
                <button onClick={p.go} style={{ padding: '5px 13px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Run</button>
              </div>
            ))}
          </div>
          {level === 'healthy' && <div style={{ fontSize: 10, color: 'var(--status-ok)', marginTop: 8 }}>✓ No intervention needed — radar re-scores nightly</div>}
        </GlassPanel>
      </div>
    </div>
  );
}

Object.assign(window, { ChurnRadarPanel, churnSignalsFor });

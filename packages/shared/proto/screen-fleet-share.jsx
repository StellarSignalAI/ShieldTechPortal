/* Vendored from updated design prototype (new-generation screens). */

// ── tech-app.jsx ──
/* Technician App — in-portal field companion (phone-frame surface).
   Wired to the real shared stores: today's jobs (jobStore), work-order
   timers (workOrderStore), parts requests (partsReqStore), live location
   sharing (fleet), photo checklists. Back button returns to the portal.
   NOTE: must load BEFORE app-registry (index.html orders this early). */

function TechAppScreen({ onBack }) {
  const TECH = (() => { const u = window.__shieldUser; return u ? { id: u.initials || u.id, name: u.name, role: u.role } : { id: 'ME', name: 'This device', role: 'Technician' }; })();
  const [jobs] = useShieldStore(jobStore);
  const [wos, setWos] = useShieldStore(workOrderStore);
  const [parts] = useShieldStore(partsReqStore);
  const [clockedIn, setClockedIn] = React.useState(true);
  const [sharing, setSharing] = React.useState('idle');

  const myJobs = jobs.filter(j => j.techs.includes(TECH.id) && j.day <= 2).sort((a, b) => a.day - b.day || a.start - b.start);
  const myWos = wos.filter(w => w.techId === TECH.id);
  const myParts = parts.filter(p => p.tech === TECH.id);
  const activeWo = myWos.find(w => w.timerRunning);

  const toggleTimer = (wo) => {
    setWos(prev => prev.map(w => w.id === wo.id
      ? { ...w, timerRunning: !w.timerRunning, status: !w.timerRunning ? 'in-progress' : w.status }
      : { ...w, timerRunning: false }));
    showToast(wo.timerRunning ? `Timer stopped on ${wo.id}` : `Clocked onto ${wo.id} — timer running`);
  };

  const typeColor = { install: 'var(--brand)', repair: 'var(--status-critical)', maintenance: 'var(--status-ok)', survey: '#c084fc', meeting: 'var(--text-low)' };
  const fmtH = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}${hh >= 12 ? 'p' : 'a'}`; };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 12px', overflow: 'auto' }}>
      <div style={{ width: 390, maxWidth: '100%', borderRadius: 24, border: '1px solid var(--border-strong)', background: 'rgba(10,14,20,0.85)', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>

        {/* App header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, background: 'rgba(10,14,20,0.95)', zIndex: 5 }}>
          <button onClick={onBack} style={{ padding: '6px 12px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Portal</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>ShieldTech Tech App</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{TECH.name} · {TECH.role}</div>
          </div>
          <button onClick={() => { setClockedIn(!clockedIn); showToast(clockedIn ? 'Clocked out — see you tomorrow' : 'Clocked in — have a good shift'); }}
            style={{ padding: '6px 12px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', background: clockedIn ? 'rgba(52,211,153,0.12)' : 'rgba(92,111,134,0.15)', border: `1px solid ${clockedIn ? 'rgba(52,211,153,0.4)' : 'var(--border-subtle)'}`, color: clockedIn ? 'var(--status-ok)' : 'var(--text-low)' }}>
            {clockedIn ? '● ON SHIFT' : 'CLOCK IN'}
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Location sharing */}
          <div className="glass" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="dispatch" size={16} color={sharing === 'live' ? 'var(--status-ok)' : 'var(--text-mid)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)' }}>Live location</div>
              <div style={{ fontSize: 9, color: sharing === 'denied' ? 'var(--status-warn)' : 'var(--text-low)' }}>
                {sharing === 'live' ? 'Streaming to dispatch while app is open' : sharing === 'denied' ? 'Permission denied — enable in Settings → Location' : sharing === 'requesting' ? 'Requesting permission…' : 'Off — dispatch sees your last fix only'}
              </div>
            </div>
            <button onClick={() => { if (sharing === 'live') { stopFleetSharing(); setSharing('idle'); } else startFleetSharing(TECH.id, setSharing); }}
              style={{ padding: '6px 12px', borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: sharing === 'live' ? 'rgba(52,211,153,0.12)' : 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', color: sharing === 'live' ? 'var(--status-ok)' : '#fff' }}>
              {sharing === 'live' ? 'Sharing ✓' : 'Share'}
            </button>
          </div>

          {/* Today's jobs */}
          <div>
            <div className="label-sm" style={{ marginBottom: 6 }}>MY JOBS — TODAY & TOMORROW</div>
            {myJobs.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', padding: '10px 0' }}>Nothing scheduled — check the dispatch queue.</div>}
            {myJobs.map(j => (
              <div key={j.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8, borderLeft: `3px solid ${typeColor[j.type] || 'var(--brand)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{j.title}</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{j.day === 1 ? 'Today' : 'Tomorrow'} · {fmtH(j.start)}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-mid)', marginTop: 2 }}>{j.customer} · {j.dur}h{j.wo ? ` · ${j.wo}` : ''}</div>
                {j.wo && (
                  <button onClick={() => { woFocusStore.set(j.wo); navTo('workorder'); }} style={{ marginTop: 8, padding: '5px 12px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open work order →</button>
                )}
              </div>
            ))}
          </div>

          {/* Work order timers */}
          <div>
            <div className="label-sm" style={{ marginBottom: 6 }}>MY WORK ORDERS</div>
            {myWos.map(w => (
              <div key={w.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)' }}>{w.id} — {w.customer}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{w.type} · {w.status}{w.timerSeconds ? ` · ${fmtSeconds(w.timerSeconds)} logged` : ''}</div>
                </div>
                {w.status !== 'completed' && (
                  <button onClick={() => toggleTimer(w)} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', background: w.timerRunning ? 'rgba(244,63,94,0.1)' : 'rgba(52,211,153,0.12)', border: `1px solid ${w.timerRunning ? 'rgba(244,63,94,0.3)' : 'rgba(52,211,153,0.3)'}`, color: w.timerRunning ? 'var(--status-critical)' : 'var(--status-ok)' }}>
                    {w.timerRunning ? '■ Stop' : '▶ Start'}
                  </button>
                )}
                {w.status === 'completed' && <span style={{ fontSize: 9, color: 'var(--status-ok)' }}>✓ Done</span>}
              </div>
            ))}
            {activeWo && <div style={{ fontSize: 9, color: 'var(--status-ok)' }}>● Timer running on {activeWo.id} — syncs live to the portal's Work Orders screen.</div>}
          </div>

          {/* Parts requests */}
          <div>
            <div className="label-sm" style={{ marginBottom: 6 }}>MY PARTS REQUESTS</div>
            {myParts.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)' }}>None open.</div>}
            {myParts.map(p => (
              <div key={p.id} className="glass" style={{ padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{p.id}</span>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', color: p.status === 'delivered' ? 'var(--status-ok)' : 'var(--status-warn)' }}>{p.status}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-mid)', marginTop: 3 }}>{p.parts.map(x => `${x.qty}× ${x.name}`).join(', ')}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{p.job}</div>
              </div>
            ))}
            <button onClick={() => navTo('parts-req')} style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Request parts (opens requisition)</button>
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Site photos', 'cameras', 'photos'],
              ['Punch lists', 'approvals', 'punchlist'],
              ['Team chat', 'chat', 'chat'],
              ['Knowledge base', 'note', 'knowledge'],
            ].map(([label, icon, target]) => (
              <button key={target} onClick={() => navTo(target)} className="glass" style={{ padding: '12px 10px', border: '1px solid var(--border-subtle)', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(63,169,245,0.03)' }}>
                <Icon name={icon} size={14} color="var(--brand)" />
                <span style={{ fontSize: 11, color: 'var(--text-high)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TechAppScreen });


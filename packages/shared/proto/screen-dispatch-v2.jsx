/* Dispatch V2 — Real Map, Right-Click Context Menu, Geofencing, Schedule Board */

function DispatchScreen() {
  const [view, setView] = React.useState('map');
  const [selectedTech, setSelectedTech] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [geofenceAlert, setGeofenceAlert] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [notifyOnSite, setNotifyOnSite] = React.useState({});
  const [notifyLeave, setNotifyLeave] = React.useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* Blank canvas: dispatch shows the SAME live technicians as the Fleet map.
     Techs appear the moment they sign in and their app shares GPS — no seed data. */
  const [fleet] = useShieldStore(fleetStore);
  const techs = React.useMemo(() => deriveDispatchTechs(fleet.techs), [fleet]);

  /* Unassigned queue = the same backlog the Calendar's "Unscheduled" tray uses */
  const [dispatchBacklog] = useShieldStore(backlogStore);
  const backlogTypeLabels = { install: 'Install', repair: 'Repair', maintenance: 'PM', survey: 'Survey' };
  const jobs = dispatchBacklog.map(p => ({
    id: p.id.toUpperCase(), customer: p.customer,
    type: backlogTypeLabels[p.type] || 'Service',
    priority: p.type === 'repair' ? 'critical' : p.value > 8000 ? 'high' : 'normal',
    sla: p.sla || '1d', assigned: null, addr: p.addr || '—',
  }));

  /* Blank canvas: driving-safety events stream in from the telematics seam
     (phone GPS / Samsara / Geotab) — none fabricated. */
  const drivingEvents = [];

  // Geofence arrival alert — fires when an armed tech is being watched
  React.useEffect(() => {
    const armed = techs.find(t => notifyOnSite[t.id]);
    if (!armed || armed.job === '—') return;
    const t = setTimeout(() => {
      setGeofenceAlert({ tech: armed, type: 'arrived', site: armed.job, time: 'Just now' });
    }, 3000);
    return () => clearTimeout(t);
  }, [notifyOnSite, techs]);

  const handleContextMenu = (e, tech) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, tech });
  };

  const closeContext = () => setContextMenu(null);

  const statusColors = {
    'on-site': 'var(--status-ok)', driving: 'var(--brand)', idle: 'var(--status-warn)', 'clocked-out': 'var(--text-low)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden' }} onClick={closeContext}>
      {/* Dispatch Toolbar */}
      <div style={{ display: 'flex', gap: 6, padding: '0 0 10px', flexShrink: 0, justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', maxWidth: '100%', paddingBottom: 2 }}>
          {[{id:'map',label:'Live Map'},{id:'schedule',label:'Schedule Board'},{id:'queue',label:'Dispatch Queue'},{id:'driving',label:'Driving Safety'},{id:'owner',label:'Where Are My Techs?'}].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: view===t.id?600:400,
              background: view===t.id?'rgba(63,169,245,0.12)':'transparent',
              border: `1px solid ${view===t.id?'var(--brand)':'var(--border-subtle)'}`,
              color: view===t.id?'var(--brand)':'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-low)' }}>
            GPS: live phone positions
          </div>
          <button onClick={() => showToast('ShieldTech AI optimizing routes...')} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⟡</span> Optimize Routes
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'map' && <DispatchMapView techs={techs} selectedTech={selectedTech} setSelectedTech={setSelectedTech} handleContextMenu={handleContextMenu} statusColors={statusColors} setDrawerOpen={setDrawerOpen} showToast={showToast} notifyOnSite={notifyOnSite} notifyLeave={notifyLeave} />}
        {view === 'schedule' && <DispatchScheduleBoard techs={techs} showToast={showToast} />}
        {view === 'queue' && <DispatchQueue jobs={jobs} techs={techs} showToast={showToast} />}
        {view === 'driving' && <DispatchDriving events={drivingEvents} techs={techs} />}
        {view === 'owner' && <DispatchOwnerView techs={techs} statusColors={statusColors} notifyOnSite={notifyOnSite} setNotifyOnSite={setNotifyOnSite} notifyLeave={notifyLeave} setNotifyLeave={setNotifyLeave} showToast={showToast} />}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <DispatchContextMenu
          x={contextMenu.x} y={contextMenu.y} tech={contextMenu.tech}
          onClose={closeContext}
          notifyOnSite={notifyOnSite} setNotifyOnSite={setNotifyOnSite}
          notifyLeave={notifyLeave} setNotifyLeave={setNotifyLeave}
          showToast={showToast} setDrawerOpen={setDrawerOpen}
          setSelectedTech={setSelectedTech}
        />
      )}

      {/* Geofence Alert */}
      {geofenceAlert && (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, width: 360, animation: 'fade-up 0.3s ease both' }}>
          <GlassPanel style={{ borderLeft: '3px solid var(--status-ok)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StatusDot status="online" size={10} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-ok)' }}>Tech Arrived On-Site</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{geofenceAlert.tech.name} arrived at {geofenceAlert.site}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>{geofenceAlert.time} · Geofence triggered</div>
                </div>
              </div>
              <button onClick={() => setGeofenceAlert(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Tech Detail Drawer */}
      {drawerOpen && (
        <DispatchTechDrawer tech={drawerOpen} onClose={() => setDrawerOpen(null)} showToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Live Map View ──
   Full-bleed real street map (Leaflet + CARTO dark, shared with Fleet) with a
   floating roster overlay that scrolls independently. No fixed 2-column grid, so
   it never squishes on a phone. Tap a tech to select; tap "⋯" for actions
   (right-click still works on desktop). */
function DispatchMapView({ techs, selectedTech, setSelectedTech, handleContextMenu, statusColors, setDrawerOpen, showToast, notifyOnSite, notifyLeave }) {
  const active = techs.filter(t => t.status !== 'clocked-out');
  const openActions = (e, tech) => { e.preventDefault(); e.stopPropagation(); handleContextMenu(e, tech); };
  // Collapsible roster so the map is fully visible — especially on mobile where
  // the panel would otherwise cover most of the screen. Opening a tech's detail
  // is what surfaces their projects + options.
  const [rosterOpen, setRosterOpen] = React.useState(true);
  return (
    <div className="glass" style={{ position: 'relative', height: '100%', minHeight: 340, overflow: 'hidden', borderRadius: 12 }}>
      {/* Real map fills the whole surface; roster + legend float on top */}
      <FleetStreetMap techs={Object.fromEntries(techs.filter(t => t.lat != null).map(t => [t.id, t]))} />

      {/* Legend — top-left */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{status:'on-site',label:'On-Site',color:'var(--status-ok)'},{status:'driving',label:'Driving',color:'var(--brand)'},{status:'idle',label:'Idle',color:'var(--status-warn)'}].map(s => (
          <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 4, background: 'rgba(5,7,10,0.8)', border: '1px solid var(--border-subtle)' }}>
            <StatusDot status={s.status==='on-site'?'online':s.status==='driving'?'info':'warning'} size={6} />
            <span style={{ fontSize: 9, color: 'var(--text-mid)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Collapsed pill — tap to reveal the roster (keeps the map unobstructed) */}
      {!rosterOpen && (
        <button onClick={() => setRosterOpen(true)} className="glass" style={{ position: 'absolute', top: 12, right: 12, zIndex: 500, pointerEvents: 'auto', padding: '8px 13px', borderRadius: 10, background: 'rgba(4,10,16,0.86)', border: '1px solid var(--border-strong)', color: 'var(--text-high)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <StatusDot status="info" size={7} /> Technicians <span className="mono" style={{ color: 'var(--brand)' }}>{active.length}</span> ▾
        </button>
      )}

      {/* Roster overlay — top-right, collapsible, independently scrolling */}
      {rosterOpen && (
      <div style={{ position: 'absolute', top: 12, right: 12, bottom: 12, zIndex: 500, width: 'min(300px, 82vw)', display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        <div className="glass" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'rgba(4,10,16,0.86)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '9px 13px 8px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span className="label-sm">Active Technicians</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{active.length}</span>
              <button onClick={() => setRosterOpen(false)} title="Hide panel" style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
            </span>
          </div>
          <div style={{ overflowY: 'auto', padding: 8, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {techs.length === 0 && (
              <div style={{ padding: '16px 6px', fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>
                No technicians on the map yet. Techs appear here the moment they sign in and their app shares location.
              </div>
            )}
            {techs.map(tech => (
              <div key={tech.id}
                onClick={() => { setSelectedTech(tech.id); setDrawerOpen(tech); }}
                onContextMenu={(e) => handleContextMenu(e, tech)}
                style={{
                  padding: 10, borderRadius: 8, cursor: 'pointer',
                  background: selectedTech === tech.id ? 'rgba(63,169,245,0.1)' : 'var(--glass-bg)',
                  border: `1px solid ${selectedTech === tech.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: `${statusColors[tech.status]}15`,
                    border: `1px solid ${statusColors[tech.status]}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: statusColors[tech.status], flexShrink: 0
                  }}>{tech.id}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tech.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{tech.role}</div>
                  </div>
                  <button onClick={(e) => openActions(e, tech)} title="Actions" style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 15, cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>⋯</button>
                </div>
                {tech.job !== '—' && (
                  <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tech.job}</div>
                )}
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-low)', flexWrap: 'wrap' }}>
                  {tech.eta !== '—' && <span>ETA: {tech.eta}</span>}
                  <span>Hours: {tech.hours}</span>
                  {tech.speed > 0 && <span className="mono">{tech.speed} mph</span>}
                  <StatusBadge status={tech.status==='on-site'?'online':tech.status==='driving'?'info':tech.status==='idle'?'warning':'offline'} label={tech.status} />
                </div>
                {(notifyOnSite[tech.id] || notifyLeave[tech.id]) && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {notifyOnSite[tech.id] && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.08)', color: 'var(--status-ok)', border: '1px solid rgba(52,211,153,0.15)' }}>⊙ Notify on arrival</span>}
                    {notifyLeave[tech.id] && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(251,191,36,0.08)', color: 'var(--status-warn)', border: '1px solid rgba(251,191,36,0.15)' }}>⊙ Notify on departure</span>}
                  </div>
                )}
              </div>
            ))}

            {/* Quick Actions */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => showToast(active.length ? 'Broadcast sent to all techs' : 'No techs online to broadcast')} style={{ width: '100%', padding: '8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Broadcast All Techs</button>
              <button onClick={() => showToast('Geofence report generated')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Today's Geofence Report</button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

/* ── Right-Click Context Menu ── */
function DispatchContextMenu({ x, y, tech, onClose, notifyOnSite, setNotifyOnSite, notifyLeave, setNotifyLeave, showToast, setDrawerOpen, setSelectedTech }) {
  const items = [
    { label: `Notify when on-site`, icon: '⊙', toggle: true, active: notifyOnSite[tech.id], action: () => { setNotifyOnSite(p => ({...p, [tech.id]: !p[tech.id]})); showToast(notifyOnSite[tech.id] ? 'On-site notification disabled' : `Will notify when ${tech.name} arrives on-site`); }},
    { label: `Notify when they leave`, icon: '⊘', toggle: true, active: notifyLeave[tech.id], action: () => { setNotifyLeave(p => ({...p, [tech.id]: !p[tech.id]})); showToast(notifyLeave[tech.id] ? 'Departure notification disabled' : `Will notify when ${tech.name} leaves site`); }},
    { divider: true },
    { label: 'View route (today)', icon: '⤳', action: () => { showToast(`Route history for ${tech.name} loaded`); onClose(); }},
    { label: 'Route history playback', icon: '▶', action: () => { showToast('Playback mode — drag timeline to scrub'); onClose(); }},
    { label: `View ETA`, icon: '◔', action: () => { showToast(`${tech.name}: ETA ${tech.eta}`); onClose(); }},
    { divider: true },
    { label: `Call ${tech.name.split(' ')[0]}`, icon: '✆', action: () => { showToast(`Calling ${tech.phone}...`); onClose(); }},
    { label: 'Send message', icon: '✉', action: () => { showToast('Message composer opened'); onClose(); }},
    { divider: true },
    { label: 'Assign job', icon: '◎', action: () => { showToast('Job assignment panel opened'); onClose(); }},
    { label: 'View timesheet / hours', icon: '◔', action: () => { setDrawerOpen(tech); onClose(); }},
    { label: 'View driving behavior', icon: '⚠', action: () => { showToast(`Safety score: ${tech.id === 'TG' ? '72 — needs review' : '94 — good'}`); onClose(); }},
    { divider: true },
    { label: 'Edit geofence radius', icon: '◉', action: () => { showToast('Geofence editor: drag to resize (default 150ft)'); onClose(); }},
    { label: 'Center on map', icon: '⊕', action: () => { setSelectedTech(tech.id); onClose(); }},
  ];

  // Adjust menu position to stay in viewport
  const menuStyle = {
    position: 'fixed', left: x, top: y, zIndex: 9999,
    minWidth: 240, padding: '6px 0', borderRadius: 8,
    background: 'var(--modal)', border: '1px solid var(--border-strong)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)', animation: 'fade-up 0.12s ease both'
  };

  return (
    <div style={menuStyle} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(63,169,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--brand)' }}>{tech.id}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{tech.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{tech.status} · {tech.job}</div>
        </div>
      </div>
      {items.map((item, i) => {
        if (item.divider) return <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 8px' }} />;
        return (
          <button key={i} onClick={item.action} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 14px', background: 'none', border: 'none',
            color: 'var(--text-high)', fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'background 0.1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <span style={{ width: 16, textAlign: 'center', fontSize: 12, opacity: 0.6 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.toggle && (
              <div style={{
                width: 28, height: 14, borderRadius: 7,
                background: item.active ? 'var(--status-ok)' : 'rgba(92,111,134,0.3)',
                position: 'relative', transition: 'background 0.2s'
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2, left: item.active ? 16 : 2,
                  transition: 'left 0.2s'
                }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Schedule Board V2 — Drag/Drop, Add/Delete, Editable ── */
function DispatchScheduleBoard({ techs, showToast }) {
  const hours = ['7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM'];
  const activeTechs = techs.filter(t => t.status !== 'clocked-out');

  /* Blank canvas: the board starts empty — jobs are added here or arrive from
     the Calendar's unscheduled tray. Click a slot / "+ Add Job" to schedule. */
  const [schedule, setSchedule] = React.useState({});

  const [dragging, setDragging] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [ctxMenu, setCtxMenu] = React.useState(null);
  const [addModal, setAddModal] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(null);
  const boardRef = React.useRef(null);

  const typeColors = { install: 'var(--brand)', service: 'rgba(63,169,245,0.6)', pm: 'var(--status-ok)', internal: 'rgba(192,132,252,0.5)', open: 'rgba(92,111,134,0.2)', emergency: 'var(--status-critical)' };

  /* ── Drag Handlers ── */
  const onBlockMouseDown = (e, techId, blockIdx) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const block = schedule[techId][blockIdx];
    setDragging({ techId, blockIdx, block, startX: e.clientX, startY: e.clientY, origStart: block.start });
    setSelected({ techId, blockIdx });
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      if (!boardRef.current) return;
      const rows = boardRef.current.querySelectorAll('[data-tech-row]');
      let targetTech = dragging.techId;
      rows.forEach(row => {
        const r = row.getBoundingClientRect();
        if (e.clientY >= r.top && e.clientY < r.bottom) targetTech = row.dataset.techRow;
      });
      const timeArea = boardRef.current.querySelector('[data-time-area]');
      if (timeArea) {
        const r = timeArea.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        const newStart = Math.round(pct * hours.length * 2) / 2;
        const clampedStart = Math.max(0, Math.min(hours.length - dragging.block.dur, newStart));
        setDragOver({ techId: targetTech, start: clampedStart });
      }
    };
    const onUp = () => {
      if (dragOver) {
        setSchedule(prev => {
          const next = {};
          for (const tid in prev) next[tid] = prev[tid].filter(b => b.id !== dragging.block.id);
          if (!next[dragOver.techId]) next[dragOver.techId] = [];
          next[dragOver.techId].push({ ...dragging.block, start: dragOver.start });
          return next;
        });
        if (dragOver.techId !== dragging.techId) {
          const fromName = techs.find(t => t.id === dragging.techId)?.name || dragging.techId;
          const toName = techs.find(t => t.id === dragOver.techId)?.name || dragOver.techId;
          showToast(`Moved "${dragging.block.job}" from ${fromName} → ${toName}`);
        }
      }
      setDragging(null);
      setDragOver(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, dragOver]);

  const deleteBlock = (techId, blockId) => {
    const block = schedule[techId]?.find(b => b.id === blockId);
    setSchedule(prev => ({ ...prev, [techId]: prev[techId].filter(b => b.id !== blockId) }));
    showToast(`Deleted "${block?.job || 'job'}"`);
    setCtxMenu(null);
    setSelected(null);
  };

  const addBlock = (techId, job, start, dur, type, priority, customer) => {
    const id = 'b' + Date.now();
    setSchedule(prev => ({ ...prev, [techId]: [...(prev[techId] || []), { id, start, dur, job, type, priority, customer }] }));
    showToast(`Added "${job}" to ${techs.find(t => t.id === techId)?.name || techId}`);
    setAddModal(null);
  };

  const onBlockContext = (e, techId, blockIdx) => {
    e.preventDefault();
    e.stopPropagation();
    const block = schedule[techId][blockIdx];
    setCtxMenu({ x: e.clientX, y: e.clientY, techId, block });
    setSelected({ techId, blockIdx });
  };

  const onRowClick = (e, techId) => {
    if (!boardRef.current) return;
    // Only trigger if clicking empty space (not a block)
    if (e.target.closest('[data-block]')) return;
    const timeArea = e.currentTarget.querySelector('[data-time-area]');
    if (!timeArea) return;
    const r = timeArea.getBoundingClientRect();
    const pct = (e.clientX - r.left) / r.width;
    const startSlot = Math.max(0, Math.min(hours.length - 1, Math.round(pct * hours.length)));
    setAddModal({ techId, start: startSlot });
  };

  const onRowDoubleClick = (e, techId) => {
    if (!boardRef.current) return;
    const timeArea = boardRef.current.querySelector('[data-time-area]');
    if (!timeArea) return;
    const r = timeArea.getBoundingClientRect();
    const pct = (e.clientX - r.left) / r.width;
    const startSlot = Math.max(0, Math.round(pct * hours.length));
    setAddModal({ techId, start: startSlot });
  };

  const [schedView, setSchedView] = React.useState('day'); // day | week
  const weekDays = ['Mon','Tue','Wed','Thu','Fri'];

  return (
    <div style={{ height: '100%', overflow: 'auto' }} onClick={() => { setCtxMenu(null); setSelected(null); }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title={`Schedule Board — ${schedView === 'day' ? 'Today' : 'This Week'}`} icon="◎" />
        <div style={{ display: 'flex', gap: 6 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            {[{id:'day',l:'Day'},{id:'week',l:'Week'}].map(v => (
              <button key={v.id} onClick={() => setSchedView(v.id)} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 500, background: schedView===v.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: schedView===v.id?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v.l}</button>
            ))}
          </div>
          <button onClick={() => shieldToast('Showing previous day')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Prev</button>
          <button onClick={() => shieldToast('Jumped to today')} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Today</button>
          <button onClick={() => shieldToast('Showing next day')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Next →</button>
          <button onClick={() => setAddModal({ techId: activeTechs[0]?.id || 'MR', start: 4 })} style={{ padding: '4px 12px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Job</button>
        </div>
      </div>

      <div style={{ padding: '4px 10px 6px 150px', fontSize: 9, color: 'var(--text-low)', fontStyle: 'italic' }}>
        {schedView === 'day' ? 'Click empty slot to add · Drag blocks to reassign · Right-click for options' : 'Click any cell to add a job · Right-click for options'}
      </div>
      {activeTechs.length === 0 && (
        <GlassPanel style={{ padding: 18, marginBottom: 8 }}><div style={{ fontSize: 12, color: 'var(--text-low)' }}>No technicians on shift yet — the board fills in as techs sign in. Use “+ Add Job” to schedule work ahead of time.</div></GlassPanel>
      )}

      <GlassPanel style={{ padding: 0 }} ref={boardRef}>
        {schedView === 'day' ? (
        <>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 140, padding: '8px 12px', borderRight: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)' }}>TECHNICIAN</div>
          <div style={{ flex: 1, display: 'flex' }} data-time-area>
            {hours.map(h => (
              <div key={h} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 9, color: 'var(--text-low)', borderRight: '1px solid rgba(63,169,245,0.04)' }}>{h}</div>
            ))}
          </div>
        </div>

        {activeTechs.map(tech => {
          const blocks = schedule[tech.id] || [];
          const isDropTarget = dragging && dragOver?.techId === tech.id;
          return (
            <div key={tech.id} data-tech-row={tech.id}
              onDoubleClick={(e) => onRowDoubleClick(e, tech.id)}
              onClick={(e) => onRowClick(e, tech.id)}
              style={{ display: 'flex', borderBottom: '1px solid rgba(63,169,245,0.04)', minHeight: 52, alignItems: 'center', background: isDropTarget ? 'rgba(63,169,245,0.04)' : 'transparent', transition: 'background 0.15s' }}>
              <div style={{ width: 140, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(63,169,245,0.08)', border: '1px solid rgba(63,169,245,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--brand)' }}>{tech.id}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)' }}>{tech.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{blocks.length} jobs</div>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative', height: 42, padding: '0 2px' }} data-time-area>
                {hours.map((_, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${(i/hours.length)*100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(63,169,245,0.04)' }} />
                ))}

                {blocks.map((block, i) => {
                  const isSel = selected?.techId === tech.id && selected?.blockIdx === i;
                  const isDrag = dragging?.block.id === block.id;
                  return (
                    <div key={block.id} data-block
                      onMouseDown={(e) => onBlockMouseDown(e, tech.id, i)}
                      onContextMenu={(e) => onBlockContext(e, tech.id, i)}
                      onClick={(e) => { e.stopPropagation(); setSelected({ techId: tech.id, blockIdx: i }); setDetailModal({ techId: tech.id, block }); }}
                      style={{
                        position: 'absolute',
                        left: `${(block.start / hours.length) * 100}%`,
                        width: `${(block.dur / hours.length) * 100}%`,
                        top: 4, bottom: 4,
                        background: typeColors[block.type] || 'var(--brand)',
                        borderRadius: 5, padding: '3px 8px',
                        fontSize: 9, color: '#fff', fontWeight: 500, overflow: 'hidden',
                        whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        cursor: isDrag ? 'grabbing' : 'grab',
                        border: isSel ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                        opacity: isDrag ? 0.4 : 1,
                        boxShadow: isSel ? '0 0 12px rgba(63,169,245,0.4)' : 'none',
                        zIndex: isSel ? 5 : 1,
                        transition: isDrag ? 'none' : 'opacity 0.15s',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                      {block.priority === 'high' && <span style={{ fontSize: 8 }}>▲</span>}
                      {block.job}
                    </div>
                  );
                })}

                {/* Ghost block preview during drag */}
                {dragging && dragOver?.techId === tech.id && (
                  <div style={{
                    position: 'absolute',
                    left: `${(dragOver.start / hours.length) * 100}%`,
                    width: `${(dragging.block.dur / hours.length) * 100}%`,
                    top: 4, bottom: 4,
                    background: typeColors[dragging.block.type] || 'var(--brand)',
                    borderRadius: 5, opacity: 0.5,
                    border: '2px dashed rgba(255,255,255,0.5)',
                    pointerEvents: 'none', zIndex: 4,
                    display: 'flex', alignItems: 'center', padding: '0 8px',
                    fontSize: 9, color: '#fff', fontWeight: 500
                  }}>{dragging.block.job}</div>
                )}

                {/* Now line */}
                <div style={{ position: 'absolute', left: '52%', top: 0, bottom: 0, width: 2, background: 'var(--status-critical)', borderRadius: 1, zIndex: 6, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: -3, left: -2, width: 6, height: 6, borderRadius: '50%', background: 'var(--status-critical)' }} />
                </div>
              </div>
            </div>
          );
        })}
        </>
        ) : (
        /* ── WEEK VIEW ── */
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 140, padding: '8px 12px', borderRight: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)' }}>TECHNICIAN</div>
            {weekDays.map(d => (
              <div key={d} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', borderRight: '1px solid rgba(63,169,245,0.04)' }}>
                {d} <span className="mono" style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-low)', opacity: 0.6 }}>{['Jun 2','Jun 3','Jun 4','Jun 5','Jun 6'][weekDays.indexOf(d)]}</span>
              </div>
            ))}
          </div>
          {activeTechs.map(tech => {
            const blocks = schedule[tech.id] || [];
            // Distribute blocks across week days for demo
            const weekBlocks = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };
            blocks.forEach((b, i) => { const day = weekDays[i % 5]; weekBlocks[day].push(b); });
            return (
              <div key={tech.id} style={{ display: 'flex', borderBottom: '1px solid rgba(63,169,245,0.04)', minHeight: 56 }}>
                <div style={{ width: 140, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(63,169,245,0.08)', border: '1px solid rgba(63,169,245,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--brand)' }}>{tech.id}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)' }}>{tech.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{blocks.length} jobs</div>
                  </div>
                </div>
                {weekDays.map(day => (
                  <div key={day} onClick={() => setAddModal({ techId: tech.id, start: 3 })} style={{ flex: 1, padding: '4px 4px', borderRight: '1px solid rgba(63,169,245,0.04)', display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer', minHeight: 48 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {weekBlocks[day].map((b, bi) => (
                      <div key={bi}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, techId: tech.id, block: b }); }}
                        onClick={(e) => { e.stopPropagation(); setDetailModal({ techId: tech.id, block: b }); }}
                        style={{
                          padding: '3px 6px', borderRadius: 4, fontSize: 9, fontWeight: 500,
                          background: typeColors[b.type] || 'var(--brand)',
                          color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                        }} title={b.job}>
                        {b.job.length > 18 ? b.job.substring(0, 18) + '…' : b.job}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </>
        )}
      </GlassPanel>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, padding: '4px 8px' }}>
        {[{t:'install',l:'Install'},{t:'service',l:'Service'},{t:'pm',l:'PM'},{t:'internal',l:'Internal'},{t:'emergency',l:'Emergency'}].map(i => (
          <div key={i.t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: typeColors[i.t] }} />
            <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{i.l}</span>
          </div>
        ))}
      </div>

      {/* ShieldTech AI suggestion */}
      {(() => {
        const idle = activeTechs.find(t => t.status === 'idle');
        return (
          <GlassPanel style={{ marginTop: 8, borderLeft: '3px solid var(--brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>⟡</span>
              <span style={{ fontSize: 12, color: 'var(--brand)', flex: 1, minWidth: 180 }}>
                {idle
                  ? `ShieldTech AI: ${idle.name.split(' ')[0]} is idle — assign the next SLA-critical job to balance the board.`
                  : 'ShieldTech AI watches the board for SLA risk and open capacity — suggestions appear here once techs and jobs are scheduled.'}
              </span>
              {idle && (
                <button onClick={() => setAddModal({ techId: idle.id, start: 4 })} style={{ padding: '5px 12px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Assign job</button>
              )}
            </div>
          </GlassPanel>
        );
      })()}

      {/* Context Menu */}
      {ctxMenu && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 9999, minWidth: 200, padding: '6px 0', borderRadius: 8, background: 'var(--modal)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', animation: 'fade-up 0.12s ease both' }}>
          <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{ctxMenu.block.job}</div>
          {[
            { label: 'View Details', action: () => { setDetailModal({ techId: ctxMenu.techId, block: ctxMenu.block }); setCtxMenu(null); }},
            { label: 'Extend 1 hour', action: () => { setSchedule(prev => { const next = {...prev}; next[ctxMenu.techId] = next[ctxMenu.techId].map(b => b.id === ctxMenu.block.id ? {...b, dur: b.dur+1} : b); return next; }); showToast('Extended by 1 hour'); setCtxMenu(null); }},
            { label: 'Shorten 1 hour', action: () => { setSchedule(prev => { const next = {...prev}; next[ctxMenu.techId] = next[ctxMenu.techId].map(b => b.id === ctxMenu.block.id ? {...b, dur: Math.max(0.5, b.dur-1)} : b); return next; }); showToast('Shortened by 1 hour'); setCtxMenu(null); }},
            { label: 'Duplicate', action: () => { const b = ctxMenu.block; addBlock(ctxMenu.techId, b.job + ' (copy)', b.start + b.dur, b.dur, b.type, b.priority, b.customer); setCtxMenu(null); }},
            { label: 'Reassign to...', action: () => { setAddModal({ techId: ctxMenu.techId, start: ctxMenu.block.start, prefill: ctxMenu.block }); setCtxMenu(null); }},
          ].map((item, i) => (
            <button key={i} onClick={item.action} style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(63,169,245,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>{item.label}</button>
          ))}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '3px 8px' }} />
          <button onClick={() => deleteBlock(ctxMenu.techId, ctxMenu.block.id)} style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: 'var(--status-critical)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(244,63,94,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}>Delete Job</button>
        </div>
      )}

      {/* Add Job Modal */}
      {addModal && <ScheduleAddModal techs={activeTechs} hours={hours} initial={addModal} onAdd={addBlock} onClose={() => setAddModal(null)} />}

      {/* Detail Modal */}
      {detailModal && (
        <div onClick={() => setDetailModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 400, padding: 24, animation: 'fade-up 0.15s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>{detailModal.block.job}</span>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Customer</div><div style={{ fontSize: 13 }}>{detailModal.block.customer}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Type</div><div style={{ fontSize: 13, textTransform: 'capitalize' }}>{detailModal.block.type}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Time</div><div className="mono" style={{ fontSize: 13 }}>{hours[Math.floor(detailModal.block.start)] || '—'} — {hours[Math.floor(detailModal.block.start + detailModal.block.dur)] || '—'}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Duration</div><div className="mono" style={{ fontSize: 13 }}>{detailModal.block.dur}h</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Assigned To</div><div style={{ fontSize: 13 }}>{techs.find(t => t.id === detailModal.techId)?.name || detailModal.techId}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Priority</div><StatusBadge status={detailModal.block.priority === 'high' ? 'warning' : 'info'} label={detailModal.block.priority} /></div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { deleteBlock(detailModal.techId, detailModal.block.id); setDetailModal(null); }} style={{ padding: '7px 14px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete</button>
              <button onClick={() => setDetailModal(null)} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Add Job to Schedule Modal ── */
function ScheduleAddModal({ techs, hours, initial, onAdd, onClose }) {
  const [techId, setTechId] = React.useState(initial.techId);
  const [job, setJob] = React.useState(initial.prefill?.job || '');
  const [start, setStart] = React.useState(initial.start);
  const [dur, setDur] = React.useState(initial.prefill?.dur || 2);
  const [type, setType] = React.useState(initial.prefill?.type || 'install');
  const [priority, setPriority] = React.useState(initial.prefill?.priority || 'normal');
  const [customer, setCustomer] = React.useState(initial.prefill?.customer || '');
  const inputStyle = { width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 440, padding: 24, animation: 'fade-up 0.15s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>Add Job to Schedule</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><div className="label-sm" style={{ marginBottom: 4 }}>Job / Description</div><input value={job} onChange={e => setJob(e.target.value)} placeholder="Metro Bank — Camera Install" style={inputStyle} /></div>
          <div><div className="label-sm" style={{ marginBottom: 4 }}>Customer</div><input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name" style={inputStyle} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><div className="label-sm" style={{ marginBottom: 4 }}>Technician</div>
              <select value={techId} onChange={e => setTechId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}><div className="label-sm" style={{ marginBottom: 4 }}>Type</div>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['install','service','pm','internal','emergency'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><div className="label-sm" style={{ marginBottom: 4 }}>Start Hour</div>
              <select value={start} onChange={e => setStart(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {hours.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}><div className="label-sm" style={{ marginBottom: 4 }}>Duration (hrs)</div>
              <select value={dur} onChange={e => setDur(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {[0.5,1,1.5,2,2.5,3,4,5,6,8].map(d => <option key={d} value={d}>{d}h</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}><div className="label-sm" style={{ marginBottom: 4 }}>Priority</div>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['low','normal','high'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { if (job) onAdd(techId, job, start, dur, type, priority, customer); }} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add to Schedule</button>
        </div>
      </div>
    </div>
  );
}

/* ── Dispatch Queue ── */
function DispatchQueue({ jobs, techs, showToast }) {
  const [queueCtx, setQueueCtx] = React.useState(null);
  const availTechs = techs.filter(t => t.status === 'idle' || t.status === 'driving');

  return (
    <div style={{ maxWidth: 1200 }}>
      <SectionHeader title="Dispatch Queue — Unassigned Jobs" icon="◎" count={jobs.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {jobs.map(job => (
          <GlassPanel key={job.id} style={{
            borderLeft: `3px solid ${job.priority === 'critical' ? 'var(--status-critical)' : job.priority === 'high' ? 'var(--status-warn)' : 'var(--text-low)'}`,
            cursor: 'pointer'
          }}
          onContextMenu={(e) => { e.preventDefault(); setQueueCtx({ x: e.clientX, y: e.clientY, job }); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{job.id}</span>
                  <StatusBadge status={job.priority === 'critical' ? 'critical' : job.priority === 'high' ? 'warning' : 'info'} label={job.priority} />
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{job.type}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{job.customer}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{job.addr}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: job.priority === 'critical' ? 'var(--status-critical)' : 'var(--status-warn)' }}>{job.sla}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>SLA Remaining</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 14 }}>
                <select onChange={(e) => { if (e.target.value) showToast(`${e.target.value} assigned to ${job.id}`); }} style={{ padding: '5px 8px', background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  <option value="">Quick Assign...</option>
                  {availTechs.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.status})</option>
                  ))}
                </select>
                <button onClick={() => showToast(`Customer notified about ${job.id}`)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Notify Customer</button>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Right-click menu on job */}
      {queueCtx && (
        <div onClick={() => setQueueCtx(null)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', left: queueCtx.x, top: queueCtx.y, zIndex: 9999, minWidth: 200, padding: '6px 0', borderRadius: 8, background: 'var(--modal)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', animation: 'fade-up 0.12s ease both' }}>
            <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-low)' }}>{queueCtx.job.id} — {queueCtx.job.customer}</div>
            {['Assign to nearest tech','Reschedule','Set priority → Critical','Notify customer ETA','View on map','Cancel job'].map((label, i) => (
              <button key={i} onClick={() => { showToast(`${label} — ${queueCtx.job.id}`); setQueueCtx(null); }} style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: i===5?'var(--status-critical)':'var(--text-high)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Driving Safety Dashboard ── */
function DispatchDriving({ events, techs }) {
  const speeding = events.filter(e => /speed/i.test(e.event)).length;
  const brakes = events.filter(e => /brake/i.test(e.event)).length;
  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <StatCard label="FLEET SAFETY SCORE" value="—" delay={0} />
        <StatCard label="EVENTS TODAY" value={events.length} delay={80} />
        <StatCard label="SPEEDING EVENTS" value={speeding} delay={160} />
        <StatCard label="HARD BRAKES" value={brakes} delay={240} />
      </div>
      <GlassPanel style={{ marginBottom: 14, borderLeft: '3px solid var(--status-warn)', padding: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 4 }}>Telematics source: phone GPS · Samsara / Verizon Connect / Geotab / Azuga integration ready</div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Live driving behavior streams from the connected fleet-telematics provider. Events appear here as they occur.</div>
      </GlassPanel>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <SectionHeader title="Driving Events" icon="warning-tri" />
        </div>
        {events.length === 0 && (
          <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--text-low)' }}>No driving events recorded. Connect a telematics provider or keep the tech app open to stream phone-GPS behavior.</div>
        )}
        {events.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(63,169,245,0.04)', background: e.severity==='severe'?'rgba(244,63,94,0.02)':'transparent' }}>
            <StatusDot status={e.severity==='severe'?'critical':e.severity==='moderate'?'warning':'info'} size={7} />
            <span style={{ fontSize: 12, fontWeight: 500, width: 100 }}>{techs.find(t=>t.id===e.tech)?.name || e.tech}</span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-mid)' }}>{e.event}</span>
            <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{e.location}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 64 }}>{e.time}</span>
            <StatusBadge status={e.severity==='severe'?'critical':e.severity==='moderate'?'warning':'info'} label={e.severity} />
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

/* ── Owner "Where Are My Techs?" View ── */
function DispatchOwnerView({ techs, statusColors, notifyOnSite, setNotifyOnSite, notifyLeave, setNotifyLeave, showToast }) {
  return (
    <div style={{ maxWidth: 1200 }}>
      <SectionHeader title="Where Are My Techs?" icon="◎" />
      {techs.length === 0 && (
        <GlassPanel style={{ padding: 20 }}><div style={{ fontSize: 12, color: 'var(--text-low)' }}>No technicians on shift. Once a tech signs in and shares location, their live status, ETA, hours and geofence controls appear here.</div></GlassPanel>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {techs.map(tech => (
          <GlassPanel key={tech.id} style={{ borderLeft: `3px solid ${statusColors[tech.status]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${statusColors[tech.status]}15`,
                border: `1.5px solid ${statusColors[tech.status]}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: statusColors[tech.status]
              }}>{tech.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{tech.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{tech.role}</div>
              </div>
              <StatusBadge status={tech.status==='on-site'?'online':tech.status==='driving'?'info':tech.status==='idle'?'warning':'offline'} label={tech.status} />
            </div>
            {tech.job !== '—' && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 500 }}>{tech.job}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{tech.jobAddr}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>ETA</div><div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{tech.eta}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>HOURS</div><div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{tech.hours}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>SPEED</div><div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{tech.speed > 0 ? `${tech.speed} mph` : '—'}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => { setNotifyOnSite(p => ({...p, [tech.id]: !p[tech.id]})); showToast(notifyOnSite[tech.id] ? 'Disabled' : `Notify when ${tech.name.split(' ')[0]} arrives`); }} style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: notifyOnSite[tech.id] ? 'rgba(52,211,153,0.1)' : 'transparent',
                border: `1px solid ${notifyOnSite[tech.id] ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`,
                color: notifyOnSite[tech.id] ? 'var(--status-ok)' : 'var(--text-low)'
              }}>⊙ {notifyOnSite[tech.id] ? 'Watching arrival' : 'Notify on arrival'}</button>
              <button onClick={() => { setNotifyLeave(p => ({...p, [tech.id]: !p[tech.id]})); showToast(notifyLeave[tech.id] ? 'Disabled' : `Notify when ${tech.name.split(' ')[0]} leaves`); }} style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: notifyLeave[tech.id] ? 'rgba(251,191,36,0.1)' : 'transparent',
                border: `1px solid ${notifyLeave[tech.id] ? 'rgba(251,191,36,0.3)' : 'var(--border-subtle)'}`,
                color: notifyLeave[tech.id] ? 'var(--status-warn)' : 'var(--text-low)'
              }}>⊘ {notifyLeave[tech.id] ? 'Watching departure' : 'Notify on departure'}</button>
              <button onClick={() => showToast(`Calling ${tech.phone}...`)} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }}>✆ Call</button>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

/* ── Tech Detail Drawer ── */
function DispatchTechDrawer({ tech, onClose, showToast }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', padding: 24, overflow: 'auto', animation: 'fade-up 0.2s ease both' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{tech.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{tech.role} · {tech.phone}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <GlassPanel style={{ padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-low)' }}>STATUS</div>
            <StatusBadge status={tech.status==='on-site'?'online':tech.status==='driving'?'info':'warning'} label={tech.status} />
          </GlassPanel>
          <GlassPanel style={{ padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-low)' }}>HOURS TODAY</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{tech.hours}</div>
          </GlassPanel>
        </div>
        <div className="label-sm" style={{ marginBottom: 8 }}>PROJECTS & WORK ORDERS</div>
        {(() => {
          // The tech's real assignments from the shared work-order store — match on
          // id or name so it works whether the WO stored a profile id or a name.
          const all = (window.workOrderStore && window.workOrderStore.get()) || [];
          const mine = all.filter(w => {
            const a = String(w.assignedTo || w.tech || w.assignedToName || '').toLowerCase();
            return a && (a === String(tech.id).toLowerCase() || a === String(tech.name).toLowerCase());
          });
          const openWO = (w) => {
            try { window.woFocusStore && window.woFocusStore.set(w.id); } catch {}
            if (window.navTo) window.navTo('workorder');
            onClose();
          };
          if (!mine.length) {
            return (
              <GlassPanel style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{tech.job !== '—' ? tech.job : 'No work orders assigned'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{tech.jobAddr !== '—' ? tech.jobAddr : 'Assign one from the Dispatch Queue or a project.'}</div>
              </GlassPanel>
            );
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {mine.map(w => (
                <button key={w.id} onClick={() => openWO(w)} style={{ textAlign: 'left', padding: 11, borderRadius: 8, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{w.title || w.customer || w.id}</span>
                    <span style={{ fontSize: 10, color: 'var(--brand)' }}>{w.status || 'scheduled'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{[w.customer, w.site || w.address].filter(Boolean).join(' · ') || '—'}</div>
                  <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 4 }}>Open work order →</div>
                </button>
              ))}
            </div>
          );
        })()}
        <div className="label-sm" style={{ marginBottom: 8 }}>ACTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => showToast('Calling...')} style={{ width: '100%', padding: '8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✆ Call {tech.name.split(' ')[0]}</button>
          <button onClick={async () => {
            // Open the real conversation with this tech. Resolve their profile id
            // (the thread key) from their name, then jump to Messages.
            const sb = window.__shieldSupabase;
            let pid = null;
            if (sb && tech.name) { try { const { data } = await sb.from('profiles').select('id').eq('name', tech.name).maybeSingle(); pid = data && data.id; } catch {} }
            if (!pid) { showToast('Open Messages to reach this tech', 'info'); if (window.navTo) window.navTo('messages'); return; }
            window.__shieldMsgFocus = pid;
            onClose();
            if (window.navTo) window.navTo('messages');
          }} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✉ Send Message</button>
          <button onClick={() => showToast('Route displayed')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⤳ View Today's Route</button>
          <button onClick={() => showToast('Timesheet opened')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◔ Full Timesheet</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DispatchScreen, DispatchMapView, DispatchContextMenu, DispatchScheduleBoard, DispatchQueue, DispatchDriving, DispatchOwnerView, DispatchTechDrawer });

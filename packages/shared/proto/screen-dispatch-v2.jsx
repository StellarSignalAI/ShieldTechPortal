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

  const techs = [
    { id: 'MR', name: 'Mike Reyes', role: 'Lead Tech', status: 'on-site', job: 'Metro Bank — Camera Install', jobAddr: '1450 Market St', eta: '—', hours: '6h 12m', x: 38, y: 32, heading: 135, speed: 0, phone: '(215) 555-0142' },
    { id: 'JL', name: 'Jessica Liu', role: 'Tech II', status: 'driving', job: 'Acme Dental — NVR Swap', jobAddr: '820 Walnut St', eta: '12 min', hours: '4h 45m', x: 52, y: 48, heading: 45, speed: 34, phone: '(215) 555-0198' },
    { id: 'KW', name: 'Kevin White', role: 'Tech II', status: 'on-site', job: 'City Hall — Access Panel', jobAddr: '1401 JFK Blvd', eta: '—', hours: '7h 02m', x: 44, y: 58, heading: 0, speed: 0, phone: '(215) 555-0167' },
    { id: 'TG', name: 'Tony Garcia', role: 'Tech I', status: 'driving', job: 'Harbor View — Camera Add', jobAddr: '200 S Columbus Blvd', eta: '8 min', hours: '3h 30m', x: 62, y: 28, heading: 270, speed: 28, phone: '(215) 555-0203' },
    { id: 'DP', name: 'Diana Patel', role: 'Tech II', status: 'idle', job: 'Unassigned', jobAddr: '—', eta: '—', hours: '5h 18m', x: 30, y: 65, heading: 90, speed: 0, phone: '(215) 555-0189' },
    { id: 'RJ', name: 'Ray Johnson', role: 'Lead Tech', status: 'clocked-out', job: '—', jobAddr: '—', eta: '—', hours: '0h', x: 15, y: 80, heading: 0, speed: 0, phone: '(215) 555-0221' },
  ];

  /* Unassigned queue = the same backlog the Calendar's "Unscheduled" tray uses */
  const [dispatchBacklog] = useShieldStore(backlogStore);
  const backlogTypeLabels = { install: 'Install', repair: 'Repair', maintenance: 'PM', survey: 'Survey' };
  const jobs = dispatchBacklog.map(p => ({
    id: p.id.toUpperCase(), customer: p.customer,
    type: backlogTypeLabels[p.type] || 'Service',
    priority: p.type === 'repair' ? 'critical' : p.value > 8000 ? 'high' : 'normal',
    sla: p.sla || '1d', assigned: null, addr: p.addr || '—',
  }));

  const drivingEvents = [
    { tech: 'JL', event: 'Hard brake', time: '2:14 PM', severity: 'moderate', location: 'I-76 W @ 30th St' },
    { tech: 'TG', event: 'Speeding (42 in 25)', time: '1:50 PM', severity: 'severe', location: 'Broad St @ Vine' },
    { tech: 'JL', event: 'Rapid acceleration', time: '12:30 PM', severity: 'minor', location: 'Walnut @ 15th' },
  ];

  // Simulate geofence arrival alert
  React.useEffect(() => {
    if (notifyOnSite['MR']) {
      const t = setTimeout(() => {
        setGeofenceAlert({ tech: techs[0], type: 'arrived', site: 'Metro Bank — Camera Install', time: 'Just now' });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [notifyOnSite]);

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
      <div style={{ display: 'flex', gap: 6, padding: '0 0 10px', flexShrink: 0, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
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
            GPS: Phone + Samsara seam ready
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

/* ── Live Map View ── */
function DispatchMapView({ techs, selectedTech, setSelectedTech, handleContextMenu, statusColors, setDrawerOpen, showToast, notifyOnSite, notifyLeave }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, height: '100%' }}>
      {/* Map Canvas */}
      <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#0a0e14', border: '1px solid var(--border-subtle)' }}>
        {/* Dark map background with grid */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(63,169,245,0.03) 0%, transparent 70%)' }}>
          {/* Grid lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {Array.from({length: 20}).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={`${i*5}%`} y1="0" x2={`${i*5}%`} y2="100%" stroke="rgba(63,169,245,0.04)" strokeWidth="0.5" />
                <line x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="rgba(63,169,245,0.04)" strokeWidth="0.5" />
              </React.Fragment>
            ))}
            {/* Mock streets */}
            <line x1="10%" y1="30%" x2="90%" y2="30%" stroke="rgba(63,169,245,0.08)" strokeWidth="2" />
            <line x1="10%" y1="55%" x2="85%" y2="55%" stroke="rgba(63,169,245,0.08)" strokeWidth="2" />
            <line x1="10%" y1="75%" x2="70%" y2="75%" stroke="rgba(63,169,245,0.06)" strokeWidth="1.5" />
            <line x1="25%" y1="10%" x2="25%" y2="90%" stroke="rgba(63,169,245,0.08)" strokeWidth="2" />
            <line x1="50%" y1="15%" x2="50%" y2="85%" stroke="rgba(63,169,245,0.08)" strokeWidth="2" />
            <line x1="70%" y1="10%" x2="70%" y2="90%" stroke="rgba(63,169,245,0.06)" strokeWidth="1.5" />
            {/* Diagonal */}
            <line x1="15%" y1="20%" x2="60%" y2="80%" stroke="rgba(63,169,245,0.05)" strokeWidth="1.5" />
          </svg>

          {/* Job site markers */}
          {techs.filter(t => t.status !== 'clocked-out' && t.jobAddr !== '—').map(t => (
            <div key={`site-${t.id}`} style={{ position: 'absolute', left: `${t.x - 1}%`, top: `${t.y - 1}%`, width: 32, height: 32, zIndex: 1 }}>
              {/* Geofence radius ring */}
              {(notifyOnSite[t.id] || notifyLeave[t.id]) && (
                <div style={{
                  position: 'absolute', left: -18, top: -18,
                  width: 68, height: 68, borderRadius: '50%',
                  border: '1.5px dashed rgba(63,169,245,0.3)',
                  background: 'rgba(63,169,245,0.03)',
                  animation: 'pulse-online 3s ease-in-out infinite'
                }} />
              )}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'rgba(63,169,245,0.3)', border: '1px solid rgba(63,169,245,0.5)',
                position: 'absolute', left: 12, top: 12
              }} />
            </div>
          ))}

          {/* Tech markers */}
          {techs.filter(t => t.status !== 'clocked-out').map(tech => (
            <div key={tech.id}
              onClick={() => setSelectedTech(tech.id === selectedTech ? null : tech.id)}
              onContextMenu={(e) => handleContextMenu(e, tech)}
              style={{
                position: 'absolute', left: `${tech.x}%`, top: `${tech.y}%`,
                transform: 'translate(-50%, -50%)', zIndex: 10, cursor: 'pointer',
                transition: 'all 0.5s ease'
              }}
            >
              {/* Pulse ring for on-site */}
              {tech.status === 'on-site' && (
                <div style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: 48, height: 48, borderRadius: '50%',
                  border: '1px solid rgba(52,211,153,0.3)',
                  animation: 'pulse-online 2s ease-in-out infinite'
                }} />
              )}
              {/* Heading arrow for driving */}
              {tech.status === 'driving' && (
                <div style={{
                  position: 'absolute', left: '50%', top: -8, transform: `translateX(-50%) rotate(${tech.heading}deg)`,
                  width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                  borderBottom: '8px solid var(--brand)', transformOrigin: 'center 22px'
                }} />
              )}
              {/* Glass marker */}
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: selectedTech === tech.id ? 'rgba(63,169,245,0.2)' : 'var(--glass-bg)',
                border: `1.5px solid ${statusColors[tech.status]}`,
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: selectedTech === tech.id ? `0 0 16px ${statusColors[tech.status]}` : `0 0 8px rgba(0,0,0,0.4)`,
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColors[tech.status] }}>{tech.id}</span>
              </div>
              {/* Label */}
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center'
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-high)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{tech.name.split(' ')[0]}</div>
                {tech.status === 'driving' && <div className="mono" style={{ fontSize: 8, color: 'var(--brand)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>ETA {tech.eta}</div>}
              </div>
            </div>
          ))}

          {/* Map labels */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '4px 10px', borderRadius: 4, background: 'rgba(5,7,10,0.8)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-low)' }}>
            Philadelphia Metro · {techs.filter(t=>t.status!=='clocked-out').length} active · Right-click marker for actions
          </div>
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[{status:'on-site',label:'On-Site',color:'var(--status-ok)'},{status:'driving',label:'Driving',color:'var(--brand)'},{status:'idle',label:'Idle',color:'var(--status-warn)'}].map(s => (
              <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 4, background: 'rgba(5,7,10,0.8)', border: '1px solid var(--border-subtle)' }}>
                <StatusDot status={s.status==='on-site'?'online':s.status==='driving'?'info':'warning'} size={6} />
                <span style={{ fontSize: 9, color: 'var(--text-mid)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel — Active Techs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        <div className="label-sm" style={{ marginBottom: 2 }}>ACTIVE TECHNICIANS</div>
        {techs.map(tech => (
          <div key={tech.id}
            onClick={() => { setSelectedTech(tech.id); }}
            onContextMenu={(e) => handleContextMenu(e, tech)}
            style={{
              padding: 12, borderRadius: 8, cursor: 'pointer',
              background: selectedTech === tech.id ? 'rgba(63,169,245,0.06)' : 'var(--glass-bg)',
              border: `1px solid ${selectedTech === tech.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
              transition: 'all 0.15s'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: `${statusColors[tech.status]}15`,
                border: `1px solid ${statusColors[tech.status]}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: statusColors[tech.status]
              }}>{tech.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{tech.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{tech.role}</div>
              </div>
              <StatusBadge status={tech.status==='on-site'?'online':tech.status==='driving'?'info':tech.status==='idle'?'warning':'offline'} label={tech.status} />
            </div>
            {tech.job !== '—' && (
              <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 4 }}>{tech.job}</div>
            )}
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-low)' }}>
              {tech.eta !== '—' && <span>ETA: {tech.eta}</span>}
              <span>Hours: {tech.hours}</span>
              {tech.speed > 0 && <span className="mono">{tech.speed} mph</span>}
            </div>
            {(notifyOnSite[tech.id] || notifyLeave[tech.id]) && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                {notifyOnSite[tech.id] && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.08)', color: 'var(--status-ok)', border: '1px solid rgba(52,211,153,0.15)' }}>⊙ Notify on arrival</span>}
                {notifyLeave[tech.id] && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(251,191,36,0.08)', color: 'var(--status-warn)', border: '1px solid rgba(251,191,36,0.15)' }}>⊙ Notify on departure</span>}
              </div>
            )}
          </div>
        ))}

        {/* Quick Actions */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          <button onClick={() => showToast('Broadcast sent to all techs')} style={{ width: '100%', padding: '7px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Broadcast All Techs</button>
          <button onClick={() => showToast('Geofence report generated')} style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Today's Geofence Report</button>
        </div>
      </div>
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

  const [schedule, setSchedule] = React.useState({
    'MR': [{ id: 'b1', start: 1, dur: 4, job: 'Metro Bank — Camera Install', type: 'install', priority: 'high', customer: 'Metro Bank Corp' }, { id: 'b2', start: 6, dur: 2, job: 'Acme Dental — Follow-up', type: 'service', priority: 'normal', customer: 'Acme Dental' }],
    'JL': [{ id: 'b3', start: 0, dur: 3, job: 'Riverside Medical — PM', type: 'pm', priority: 'normal', customer: 'Riverside Medical' }, { id: 'b4', start: 4, dur: 3, job: 'Acme Dental — NVR Swap', type: 'install', priority: 'high', customer: 'Acme Dental' }],
    'KW': [{ id: 'b5', start: 0, dur: 5, job: 'City Hall — Access Panel', type: 'install', priority: 'normal', customer: 'City Hall' }, { id: 'b6', start: 6, dur: 3, job: 'Open', type: 'open', priority: 'low', customer: '—' }],
    'TG': [{ id: 'b7', start: 2, dur: 2, job: 'Harbor View — Camera Add', type: 'install', priority: 'normal', customer: 'Harbor View' }, { id: 'b8', start: 5, dur: 3, job: 'Westfield Mall — PM', type: 'pm', priority: 'normal', customer: 'Westfield Mall' }],
    'DP': [{ id: 'b9', start: 0, dur: 2, job: 'Training', type: 'internal', priority: 'low', customer: '—' }],
  });

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
      <GlassPanel style={{ marginTop: 8, borderLeft: '3px solid var(--brand)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⟡</span>
          <span style={{ fontSize: 12, color: 'var(--brand)', flex: 1 }}>ShieldTech AI: Diana Patel is open after 9 AM. Bayshore Medical (J-402) has a critical SLA at 45m — assign her? Travel: 18 min.</span>
          <button onClick={() => { addBlock('DP', 'Bayshore Medical — Emergency Service', 3, 3, 'emergency', 'high', 'Bayshore Medical'); }} style={{ padding: '5px 12px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Assign</button>
          <button onClick={() => showToast('Dismissed')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Dismiss</button>
        </div>
      </GlassPanel>

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
  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="FLEET SAFETY SCORE" value="88" suffix="/100" delay={0} />
        <StatCard label="EVENTS TODAY" value={events.length} delay={80} />
        <StatCard label="SPEEDING EVENTS" value="1" delay={160} />
        <StatCard label="HARD BRAKES" value="1" delay={240} />
      </div>
      <GlassPanel style={{ marginBottom: 14, borderLeft: '3px solid var(--status-warn)', padding: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 4 }}>Telematics source: Phone GPS (mock) · Samsara / Verizon Connect / Geotab / Azuga integration ready</div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Live driving behavior uses a fleet-telematics provider. Design works on mock + phone GPS now with a seam to live data.</div>
      </GlassPanel>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <SectionHeader title="Driving Events" icon="warning-tri" />
        </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))', gap: 12 }}>
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
        <div className="label-sm" style={{ marginBottom: 8 }}>TODAY'S JOBS</div>
        <GlassPanel style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{tech.job}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{tech.jobAddr}</div>
        </GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>ACTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => showToast('Calling...')} style={{ width: '100%', padding: '8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✆ Call {tech.name.split(' ')[0]}</button>
          <button onClick={() => showToast('Message sent')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✉ Send Message</button>
          <button onClick={() => showToast('Route displayed')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⤳ View Today's Route</button>
          <button onClick={() => showToast('Timesheet opened')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◔ Full Timesheet</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DispatchScreen, DispatchMapView, DispatchContextMenu, DispatchScheduleBoard, DispatchQueue, DispatchDriving, DispatchOwnerView, DispatchTechDrawer });

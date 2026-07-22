/* Vendored from updated design prototype (new-generation screens). */

// ── fleet-tracking.jsx ──
/* Fleet GPS — live tech location, fleet map with trails, stale-location compliance.
   Web-maximum tracking: positions stream via browser geolocation while a tech
   surface is open. Background tracking after the phone locks, or preventing a
   user from revoking location permission, is OS-enforced and requires the
   native app (always-on location entitlement) or MDM-managed devices — the
   FleetTransport seam below is where the native/Supabase feed plugs in.

   NOTE: must load BEFORE app-registry (index.html orders this script early). */

/* Philadelphia bounding box → percent map coords */
const FLEET_BOUNDS = { latMin: 39.90, latMax: 40.00, lngMin: -75.22, lngMax: -75.12 };
function fleetProject(lat, lng) {
  const x = ((lng - FLEET_BOUNDS.lngMin) / (FLEET_BOUNDS.lngMax - FLEET_BOUNDS.lngMin)) * 100;
  const y = (1 - (lat - FLEET_BOUNDS.latMin) / (FLEET_BOUNDS.latMax - FLEET_BOUNDS.latMin)) * 100;
  return { x: Math.min(97, Math.max(3, x)), y: Math.min(95, Math.max(5, y)) };
}

const FLEET_STALE_MS = 5 * 60 * 1000;   // on-duty location older than this = stale
const FLEET_TRAIL_MAX = 30;             // last-seen trail length per tech

/* Seeded fleet — TG is deliberately stale to exercise the compliance lane */
function fleetSeed() {
  const now = Date.now();
  const mk = (x, y, ageMs, onDuty, status, job) => ({
    x, y, onDuty, status, job, sharing: false, source: 'seed',
    updatedAt: now - ageMs,
    trail: Array.from({ length: 8 }, (_, i) => ({
      x: x + Math.sin(i * 1.7) * (8 - i) * 0.9, y: y + Math.cos(i * 1.3) * (8 - i) * 0.7,
      t: now - ageMs - (8 - i) * 240000,
    })),
  });
  void mk; // blank canvas: techs join the map when they sign in and share location
  return { techs: {}, ackAlerts: {} };
}
const fleetStore = createShieldStore('fleet', fleetSeed());

/* ── Transport seam ──
   publish() is the single write path for positions. Default transport writes the
   shared store (localStorage cross-tab sync keeps every open surface live).
   A Supabase transport drops in here unchanged for real multi-device streaming:

     const supabaseTransport = {
       async publish(techId, pos) {
         await supabase.from('tech_locations').upsert({ tech_id: techId, ...pos });
       },
       subscribe(onRow) {
         return supabase.channel('fleet')
           .on('postgres_changes', { event: '*', table: 'tech_locations' }, onRow)
           .subscribe();
       },
     };
*/
const FleetTransport = {
  publish(techId, { lat, lng, accuracy, source }) {
    const { x, y } = fleetProject(lat, lng);
    fleetStore.set(prev => {
      let t = prev.techs[techId];
      if (!t) {
        const u = window.__shieldUser;
        t = { name: (u && u.name) || techId, role: (u && u.role) || 'Technician', x: 50, y: 50, onDuty: true, status: 'on-site', job: '—', sharing: true, source: 'geolocation', updatedAt: Date.now(), trail: [] };
      }
      const now = Date.now();
      const trail = [...(t.trail || []), { x, y, lat, lng, t: now }].slice(-FLEET_TRAIL_MAX);
      return { ...prev, techs: { ...prev.techs, [techId]: { ...t, x, y, lat, lng, accuracy, updatedAt: now, trail, sharing: true, source: source || 'geolocation' } } };
    });
  },
};

/* ── Tech-side geolocation streaming ──
   Runs while the surface is open; stops on permission revoke or page close —
   that boundary is the OS's, not ours (see header note). */
let __fleetWatchId = null;
function startFleetSharing(techId, onStatus) {
  if (!navigator.geolocation) { onStatus?.('unsupported'); return; }
  onStatus?.('requesting');
  stopFleetSharing();
  __fleetWatchId = navigator.geolocation.watchPosition(
    pos => {
      onStatus?.('live');
      FleetTransport.publish(techId, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: 'geolocation' });
    },
    err => onStatus?.(err.code === 1 ? 'denied' : 'error'),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );
}
function stopFleetSharing() {
  if (__fleetWatchId != null) { navigator.geolocation?.clearWatch(__fleetWatchId); __fleetWatchId = null; }
  fleetStore.set(prev => prev); // nudge subscribers
}

/* Demo drive: simulates a tech app streaming positions (for surfaces without GPS) */
let __fleetSimTimer = null;
function startFleetSim(techId) {
  clearInterval(__fleetSimTimer);
  let step = 0;
  __fleetSimTimer = setInterval(() => {
    step += 1;
    const base = fleetStore.get().techs[techId];
    if (!base || step > 40) { clearInterval(__fleetSimTimer); return; }
    const lat = FLEET_BOUNDS.latMin + (1 - base.y / 100) * (FLEET_BOUNDS.latMax - FLEET_BOUNDS.latMin) + (Math.sin(step / 3) * 0.0016);
    const lng = FLEET_BOUNDS.lngMin + (base.x / 100) * (FLEET_BOUNDS.lngMax - FLEET_BOUNDS.lngMin) + 0.0012;
    FleetTransport.publish(techId, { lat, lng, accuracy: 12, source: 'sim' });
  }, 2500);
}

function fleetAge(updatedAt, now) {
  const s = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}
function fleetIsStale(t, now) { return t.onDuty && now - t.updatedAt > FLEET_STALE_MS; }

/* ── Fleet Map Screen ── */
/* Real dark street map (Leaflet + CARTO dark). Renders when the browser can —
   the schematic canvas below remains the fallback and the site-plan layer. */
function FleetStreetMap({ techs }) {
  const elRef = React.useRef(null);
  const apiRef = React.useRef(null);
  const hasGeo = Object.values(techs || {}).some(t => t.lat != null);
  React.useEffect(() => {
    if (!elRef.current || !window.__shieldLiveMap || apiRef.current) return;
    try { apiRef.current = window.__shieldLiveMap.mount(elRef.current); apiRef.current.fit(techs); } catch {}
    return () => { try { apiRef.current && apiRef.current.destroy(); } catch {} apiRef.current = null; };
  }, []);
  React.useEffect(() => { try { apiRef.current && apiRef.current.update(techs); } catch {} }, [techs]);
  return (
    <div style={{ position: 'relative', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <div ref={elRef} style={{ position: 'absolute', inset: 0, background: '#0b1420' }} />
      {!hasGeo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, pointerEvents: 'none' }}>
          <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(4,10,16,0.85)', border: '1px solid var(--border-strong)', fontSize: 12, color: 'var(--text-mid)' }}>
            No live positions yet — techs appear here the moment their app shares GPS
          </div>
        </div>
      )}
    </div>
  );
}

function FleetMapScreen() {
  const [fleet, setFleet] = useShieldStore(fleetStore);
  const [now, setNow] = React.useState(Date.now());
  const [sel, setSel] = React.useState(null);
  const [shareState, setShareState] = React.useState('idle');
  const alerted = React.useRef({});

  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);

  const techIds = Object.keys(fleet.techs);
  const staleIds = techIds.filter(id => fleetIsStale(fleet.techs[id], now));

  /* Alert the moment an on-duty tech goes stale (once per stale episode) */
  React.useEffect(() => {
    staleIds.forEach(id => {
      const key = id + ':' + fleet.techs[id].updatedAt;
      if (!alerted.current[key] && fleet.ackAlerts?.[id] !== fleet.techs[id].updatedAt) {
        alerted.current[key] = true;
        showToast(`⚠ ${fleet.techs[id].name} — location stale (${fleetAge(fleet.techs[id].updatedAt, now)}) while on duty`, 'warn');
      }
    });
  }, [staleIds.join(','), now]);

  const ackStale = (id) => setFleet(prev => ({ ...prev, ackAlerts: { ...prev.ackAlerts, [id]: prev.techs[id].updatedAt } }));

  const statusColor = (t) => fleetIsStale(t, now) ? 'var(--status-warn)'
    : !t.onDuty ? 'var(--text-low)'
    : t.status === 'driving' ? 'var(--brand)' : 'var(--status-ok)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 'min(78vh, 640px)' }} data-screen-label="Fleet Map">
      {/* Compliance banner */}
      {staleIds.filter(id => fleet.ackAlerts?.[id] !== fleet.techs[id].updatedAt).length > 0 && (
        <div className="glass" style={{ padding: '9px 14px', borderLeft: '3px solid var(--status-warn)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
          <Icon name="anomaly" size={15} color="var(--status-warn)" />
          <span style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 600 }}>Location compliance</span>
          {staleIds.map(id => (
            <span key={id} style={{ fontSize: 11, color: 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {fleet.techs[id].name} — stale <b style={{ color: 'var(--status-warn)' }}>{fleetAge(fleet.techs[id].updatedAt, now)}</b>
              <button onClick={() => ackStale(id)} style={{ padding: '2px 8px', fontSize: 10, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ack</button>
            </span>
          ))}
        </div>
      )}

      {/* Full-bleed dispatcher map with a floating roster overlay */}
      <div className="glass" style={{ position: 'relative', flex: 1, minHeight: 380, overflow: 'hidden', borderRadius: 14 }}>
        <FleetStreetMap techs={fleet.techs} />

        {/* Stat strip — top-left */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 'calc(100% - 24px)' }}>
          {[['On duty', techIds.filter(id => fleet.techs[id].onDuty).length, 'var(--status-ok)'],
            ['Driving', techIds.filter(id => fleet.techs[id].status === 'driving').length, 'var(--brand)'],
            ['Stale', staleIds.length, staleIds.length ? 'var(--status-warn)' : 'var(--text-low)']].map(([l, v, c]) => (
            <div key={l} className="glass" style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(4,10,16,0.72)' }}>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Roster overlay — top-right, collapsible; scrolls independently */}
        <div style={{ position: 'absolute', top: 12, right: 12, bottom: 12, zIndex: 500, width: 'min(280px, 78vw)', display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          <div className="glass" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'rgba(4,10,16,0.82)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 13px 8px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Fleet roster</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{techIds.length}</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '4px 0', minHeight: 0 }}>
              {techIds.length === 0 && <div style={{ padding: '18px 13px', fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>No techs sharing location yet. Technicians appear here automatically when their app is open (location permission is requested once at sign-in).</div>}
              {techIds.map(id => {
                const t = fleet.techs[id]; const stale = fleetIsStale(t, now);
                return (
                  <button key={id} onClick={() => setSel(sel === id ? null : id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 13px', background: sel === id ? 'rgba(63,169,245,0.1)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(t), flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                      <span style={{ display: 'block', fontSize: 9, color: 'var(--text-low)' }}>{t.onDuty ? (t.job || t.status) : 'clocked out'}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 9, color: stale ? 'var(--status-warn)' : 'var(--text-mid)', flexShrink: 0 }}>{stale ? '⚠ ' : ''}{fleetAge(t.updatedAt, now)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { fleetStore, FleetTransport, startFleetSharing, stopFleetSharing, startFleetSim, FleetMapScreen, fleetIsStale, fleetAge, FLEET_STALE_MS });


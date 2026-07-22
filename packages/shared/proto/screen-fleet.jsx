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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Compliance banner */}
      {staleIds.filter(id => fleet.ackAlerts?.[id] !== fleet.techs[id].updatedAt).length > 0 && (
        <div className="glass" style={{ padding: '10px 16px', borderLeft: '3px solid var(--status-warn)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Icon name="anomaly" size={16} color="var(--status-warn)" />
          <div style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 600 }}>Location compliance</div>
          {staleIds.map(id => (
            <span key={id} style={{ fontSize: 11, color: 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {fleet.techs[id].name} — no location for <b style={{ color: 'var(--status-warn)' }}>{fleetAge(fleet.techs[id].updatedAt, now)}</b> while on duty
              <button onClick={() => ackStale(id)} style={{ padding: '2px 8px', fontSize: 10, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Acknowledge</button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
        {/* Map — real dark street map with live tech pins & trails */}
        <div className="glass" style={{ position: 'relative', height: 520, overflow: 'hidden', borderRadius: 12 }}>
          <FleetStreetMap techs={fleet.techs} />
        </div>
        <div style={{ display: 'none' }} className="glass-schematic-retired">
        <div className="glass" style={{ position: 'relative', height: 520, overflow: 'hidden', borderRadius: 12, background: 'linear-gradient(160deg, #0b1420, #0d1826 60%, #0b1322)' }}>
          {/* dark tile grid */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="rgba(63,169,245,0.05)" strokeWidth="1" />
                <line x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="rgba(63,169,245,0.05)" strokeWidth="1" />
              </React.Fragment>
            ))}
            {/* streets flavor */}
            <line x1="0" y1="40%" x2="100%" y2="34%" stroke="rgba(63,169,245,0.12)" strokeWidth="3" />
            <line x1="30%" y1="0" x2="36%" y2="100%" stroke="rgba(63,169,245,0.10)" strokeWidth="2.5" />
            <line x1="0" y1="68%" x2="100%" y2="74%" stroke="rgba(63,169,245,0.08)" strokeWidth="2" />
          </svg>
          {/* last-seen trails — percent-units viewBox */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {techIds.map(id => {
              const t = fleet.techs[id];
              if (!t.trail || t.trail.length < 2 || !t.onDuty) return null;
              const pts = [...t.trail.map(p => `${p.x},${p.y}`), `${t.x},${t.y}`].join(' ');
              return <polyline key={id} points={pts} fill="none" stroke={statusColor(t)} strokeWidth="0.35" strokeDasharray="1.2 1" opacity="0.5" />;
            })}
          </svg>
          {/* markers */}
          {techIds.map(id => {
            const t = fleet.techs[id];
            const stale = fleetIsStale(t, now);
            return (
              <div key={id} onClick={() => setSel(sel === id ? null : id)}
                style={{ position: 'absolute', left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer', textAlign: 'center', zIndex: sel === id ? 5 : 2 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(10,18,30,0.9)', border: `2px solid ${statusColor(t)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: statusColor(t), boxShadow: sel === id ? `0 0 0 5px rgba(63,169,245,0.15)` : 'none', opacity: t.onDuty ? 1 : 0.5, animation: stale ? 'fleetPulse 1.6s ease-in-out infinite' : 'none' }}>
                  {id}
                </div>
                <div style={{ fontSize: 8, color: stale ? 'var(--status-warn)' : 'var(--text-low)', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {stale ? `⚠ ${fleetAge(t.updatedAt, now)}` : fleetAge(t.updatedAt, now)}
                </div>
                {sel === id && (
                  <div className="glass" style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', width: 190, padding: 10, textAlign: 'left', zIndex: 9 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-mid)', margin: '2px 0' }}>{t.role} · {t.status}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.job}</div>
                    <div style={{ fontSize: 10, color: stale ? 'var(--status-warn)' : 'var(--status-ok)', marginTop: 4 }}>
                      {t.sharing ? '● streaming live' : stale ? '⚠ stale' : '● last fix'} · {fleetAge(t.updatedAt, now)}{t.accuracy ? ` · ±${Math.round(t.accuracy)}m` : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <style>{'@keyframes fleetPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.4);} 50% { box-shadow: 0 0 0 8px rgba(251,191,36,0);} }'}</style>
          <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 9, color: 'var(--text-low)' }}>Philadelphia · dark tiles · trails = last {FLEET_TRAIL_MAX} fixes</div>
        </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>On-duty compliance</div>
            {techIds.map(id => {
              const t = fleet.techs[id];
              const stale = fleetIsStale(t, now);
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(t), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)' }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{t.onDuty ? t.status : 'clocked out'}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: stale ? 'var(--status-warn)' : 'var(--text-mid)' }}>{stale ? '⚠ ' : ''}{fleetAge(t.updatedAt, now)}</span>
                </div>
              );
            })}
          </div>

          <div className="glass" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>Tech-side sharing (demo)</div>
            <div style={{ fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 8 }}>
              Streams this device's real GPS into the fleet as <b>{(window.__shieldUser && window.__shieldUser.name) || 'this device'}</b> — the same code path the tech app runs while open.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => startFleetSharing('JL', setShareState)} style={{ flex: 1, padding: '8px 0', background: shareState === 'live' ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 7, color: shareState === 'live' ? 'var(--status-ok)' : '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {shareState === 'live' ? '● Streaming' : shareState === 'requesting' ? 'Requesting…' : 'Share my location'}
              </button>
              <button onClick={() => { stopFleetSharing(); setShareState('idle'); }} style={{ padding: '8px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Stop</button>
            </div>
            {shareState === 'denied' && (
              <div style={{ fontSize: 10, color: 'var(--status-warn)', marginTop: 8, lineHeight: 1.5 }}>
                Location permission denied. Re-enable in Settings → Safari → Location, then tap Share again — the browser remembers the denial.
              </div>
            )}
            {(shareState === 'unsupported' || shareState === 'error') && (
              <button onClick={() => startFleetSim('JL')} style={{ width: '100%', marginTop: 8, padding: '7px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>No GPS here — run simulated drive</button>
            )}
          </div>

          <div className="glass" style={{ padding: 14, borderLeft: '3px solid var(--border-strong)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 6 }}>Hard limit — read this</div>
            <div style={{ fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.6 }}>
              Web tracking runs only while the tech app is open, and a tech can always revoke location permission — iOS/Android enforce both at the OS level.
              Truly un-disableable background GPS needs the <b>native scanner app</b> extended with always-on location, or <b>MDM-managed devices</b>.
              The stale-location flag above is the web-maximum compliance control: you know the moment coverage drops.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { fleetStore, FleetTransport, startFleetSharing, stopFleetSharing, startFleetSim, FleetMapScreen, fleetIsStale, fleetAge, FLEET_STALE_MS });


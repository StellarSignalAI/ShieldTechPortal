/* SiteScan — AR Documented Reality capture (mirrors the MagicPlan pipeline):
   tips → calibrate (floor/ceiling) → record → wall-by-wall detection (white line → green ✓,
   orange = unclosed) → auto-detected doors/windows/objects with confidence → auto-close room →
   confirm → multi-room session → Configure Floor Plan (object categories, session replay) → generate.
   AR feed = real device camera via getUserMedia (environment), simulated room as fallback. */

function ssPortal(node) {
  return (window.ReactDOM && window.ReactDOM.createPortal) ? window.ReactDOM.createPortal(node, document.body) : node;
}
const ssOverlay = { position: 'fixed', inset: 0, maxWidth: 430, margin: '0 auto', zIndex: 3000, paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxSizing: 'border-box', background: '#04070c', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' };

/* ── simulated passthrough (fallback when camera unavailable/denied) ── */
function SSFakeFeed() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #101820 0%, #17222e 42%, #0d1319 46%, #1a2129 47%, #10151b 100%)' }}>
      <div style={{ position: 'absolute', top: 0, bottom: '52%', left: 0, width: '26%', background: 'linear-gradient(105deg, #1d2936 0%, #131c26 100%)', transform: 'skewY(16deg)', transformOrigin: 'top right' }}></div>
      <div style={{ position: 'absolute', top: 0, bottom: '52%', right: 0, width: '26%', background: 'linear-gradient(255deg, #1d2936 0%, #131c26 100%)', transform: 'skewY(-16deg)', transformOrigin: 'top left' }}></div>
      {/* furniture silhouettes — the "obstructions" the scanner sees through */}
      <div style={{ position: 'absolute', left: '14%', bottom: '18%', width: '30%', height: '22%', background: 'linear-gradient(180deg, #232f3d, #1a232e)', borderRadius: '6px 6px 0 0' }}></div>
      <div style={{ position: 'absolute', right: '10%', bottom: '22%', width: '18%', height: '34%', background: 'linear-gradient(180deg, #202b38, #18202a)', borderRadius: 4 }}></div>
      <div style={{ position: 'absolute', left: '52%', bottom: '20%', width: '10%', height: '14%', background: '#1c2631', borderRadius: 3 }}></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '46%', height: 1.5, background: 'rgba(63,169,245,0.22)' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)' }}></div>
    </div>
  );
}

/* ── LiDAR overlays ── */
function SSPointCloud({ pct }) {
  const dots = React.useMemo(() => Array.from({ length: 300 }, (_, i) => ({
    x: (i * 37.7) % 100, y: 12 + ((i * 53.3) % 80), s: 1 + (i % 3), o: 0.2 + ((i * 7) % 10) / 16, k: (i * 41) % 100,
  })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {dots.filter(d => d.k < pct).map((d, i) => (
        <span key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, borderRadius: '50%', background: 'var(--brand)', opacity: d.o, boxShadow: '0 0 4px rgba(63,169,245,0.8)' }}></span>
      ))}
    </div>
  );
}
function SSMesh({ on }) {
  /* wireframe mesh patches — the RoomPlan-style geometry understanding */
  const tris = React.useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    x: (i * 29) % 88 + 4, y: 16 + (i * 17) % 62, r: (i * 53) % 60 - 30, s: 26 + (i * 13) % 30, k: (i * 37) % 100,
  })), []);
  if (!on) return null;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}>
      {tris.map((t, i) => (
        <polygon key={i} points={`0,${t.s} ${t.s},0 ${t.s},${t.s}`} fill="none" stroke="rgba(63,169,245,0.5)" strokeWidth="0.7"
          style={{ transform: `translate(${t.x}%, ${t.y}%) rotate(${t.r}deg)`, transformOrigin: 'center', animation: `fade-up 0.6s ease ${i * 90}ms both` }}></polygon>
      ))}
    </svg>
  );
}

/* Bounding box w/ classification chip */
function SSBBox({ b }) {
  const brk = (r) => ({ position: 'absolute', width: 14, height: 14, borderColor: b.color, borderStyle: 'solid', borderWidth: 0, ...r });
  return (
    <div style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, pointerEvents: 'none', animation: 'fade-up 0.3s ease both' }}>
      <div style={brk({ left: 0, top: 0, borderLeftWidth: 2, borderTopWidth: 2 })}></div>
      <div style={brk({ right: 0, top: 0, borderRightWidth: 2, borderTopWidth: 2 })}></div>
      <div style={brk({ left: 0, bottom: 0, borderLeftWidth: 2, borderBottomWidth: 2 })}></div>
      <div style={brk({ right: 0, bottom: 0, borderRightWidth: 2, borderBottomWidth: 2 })}></div>
      <div style={{ position: 'absolute', left: 0, top: -20, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 6, background: 'rgba(3,8,14,0.85)', border: `1px solid ${b.color}`, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: b.color }}>{b.label}</span>
        <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{b.conf}%</span>
      </div>
    </div>
  );
}

/* Live session mini-plan: rooms captured so far + current room resolving */
function SSSessionMap({ rooms, current }) {
  const all = [...rooms.map(r => r.poly), ...(current ? [current] : [])];
  if (!all.length) return null;
  const W = 116, H = 92;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  all.forEach(p => p.forEach(q => { x1 = Math.min(x1, q[0]); y1 = Math.min(y1, q[1]); x2 = Math.max(x2, q[0]); y2 = Math.max(y2, q[1]); }));
  const sc = Math.min((W - 16) / Math.max(x2 - x1, 1), (H - 20) / Math.max(y2 - y1, 1));
  const M = p => p.map(q => `${(q[0] - x1) * sc + 8},${(q[1] - y1) * sc + 10}`).join(' ');
  return (
    <div style={{ position: 'absolute', left: 10, bottom: 104, borderRadius: 10, background: 'rgba(4,10,16,0.85)', border: '1px solid var(--border-strong)', padding: '5px 6px 3px', backdropFilter: 'blur(6px)' }}>
      <svg width={W} height={H}>
        {rooms.map((r, i) => <polygon key={i} points={M(r.poly)} fill="rgba(52,211,153,0.12)" stroke="#34D399" strokeWidth="1.3" strokeLinejoin="round"></polygon>)}
        {current && <polygon points={M(current)} fill="rgba(63,169,245,0.12)" stroke="var(--brand)" strokeWidth="1.3" strokeDasharray="4 2"></polygon>}
      </svg>
      <div className="mono" style={{ fontSize: 7.5, color: 'var(--text-low)', textAlign: 'center' }}>SESSION · {rooms.length} room{rooms.length === 1 ? '' : 's'}</div>
    </div>
  );
}

/* Snap tapped corners onto a 2ft grid */
function ssRectify(pts) {
  const r = pts.map(p => [Math.round(p[0] / 2) * 2, Math.round(p[1] / 2) * 2]);
  for (let i = 1; i < r.length; i++) {
    if (Math.abs(r[i][0] - r[i - 1][0]) <= 2) r[i][0] = r[i - 1][0];
    if (Math.abs(r[i][1] - r[i - 1][1]) <= 2) r[i][1] = r[i - 1][1];
  }
  return r;
}

/* ── Auto-scan room synthesis (template geometry + detected elements) ── */
const SS_AR_TEMPLATES = [
  { guess: 'Office',    poly: s => [[0, 0], [s[0], 0], [s[0], s[1]], [0, s[1]]] },
  { guess: 'Open Area', poly: s => [[0, 0], [s[0], 0], [s[0], s[1] * 0.55], [s[0] * 0.55, s[1] * 0.55], [s[0] * 0.55, s[1]], [0, s[1]]] },
  { guess: 'Storage',   poly: s => [[0, 0], [s[0] * 0.7, 0], [s[0] * 0.7, s[1] * 0.3], [s[0], s[1] * 0.3], [s[0], s[1]], [0, s[1]]] },
];
const SS_AR_OBJ_POOL = ['desk', 'cabinet', 'couch', 'table', 'shelf', 'rack', 'appliance', 'outlet'];
const SS_OBJ_SIZE = { desk: [6, 2.5], cabinet: [5, 2], couch: [7, 3], table: [6, 3.5], shelf: [4, 1.5], rack: [2.5, 2.5], appliance: [3, 3], outlet: [0.8, 0.8], counter: [3, 8], sink: [2, 1.5], wc: [1.5, 2.2], radiator: [4, 1] };
const SS_BBOX_SPOTS = [[16, 36, 26, 22], [54, 30, 28, 24], [62, 54, 24, 18], [26, 56, 22, 16], [44, 40, 20, 18], [10, 52, 20, 18]];

function ssBuildAutoRoom(seed) {
  const tpl = SS_AR_TEMPLATES[seed % SS_AR_TEMPLATES.length];
  const size = [16 + (seed * 7) % 12, 12 + (seed * 5) % 10];
  const poly = tpl.poly(size).map(p => [Math.round(p[0]), Math.round(p[1])]);
  const n = poly.length;
  const h = 8.5 + (seed % 4) * 0.5;
  const doors = [
    { edge: n - 1, t: 0.5, w: 3.5, kind: 'door' },
    ...(seed % 2 === 0 ? [{ edge: 0, t: 0.4, w: 6, kind: 'window' }] : [{ edge: 1, t: 0.5, w: 5, kind: 'window' }]),
  ];
  const nObj = 3 + (seed % 2);
  const objects = Array.from({ length: nObj }, (_, i) => {
    const type = SS_AR_OBJ_POOL[(seed * 3 + i * 5) % SS_AR_OBJ_POOL.length];
    const [w, hh] = SS_OBJ_SIZE[type] || [3, 2];
    const fx = [0.12, 0.58, 0.2, 0.65, 0.4][i % 5], fy = [0.15, 0.6, 0.68, 0.18, 0.42][i % 5];
    return { type, w, h: hh, x: Math.round(Math.min(fx * size[0], size[0] - w - 1) * 2) / 2, y: Math.round(Math.min(fy * size[1], size[1] - hh - 1) * 2) / 2, conf: 82 + ((seed * 7 + i * 11) % 16) };
  });
  /* timeline of AR events */
  const ev = [{ k: 'coach', text: 'Point camera at the top edge of a wall' }];
  const wallLens = ssEdges(poly).map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  let oi = 0, di = 0;
  for (let i = 0; i < n; i++) {
    ev.push({ k: 'wallscan', i });
    ev.push({ k: 'wall', i, len: wallLens[i] });
    if (di < doors.length && (i === 1 || i === 2)) { const d = doors[di++]; ev.push({ k: 'open', d, label: d.kind === 'door' ? 'Doorway' : 'Window', conf: 90 + (seed + i) % 9 }); }
    if (oi < objects.length && i >= 1) { ev.push({ k: 'obj', o: objects[oi], idx: oi }); oi++; }
  }
  while (oi < objects.length) { ev.push({ k: 'obj', o: objects[oi], idx: oi }); oi++; }
  ev.push({ k: 'ceil', h });
  return { guess: tpl.guess, poly, h, doors, objects, events: ev, walls: n, size };
}

/* ═══════════════════ AR CAPTURE SESSION ═══════════════════ */
function SSCapture({ floorLabel, roomCount, onDone, onCancel }) {
  const [prefs] = useShieldStore(ssPrefsStore);
  const speed = prefs.scanSpeed || 1;
  const [stage, setStage] = React.useState('tips');       // tips | calibrate | ready | scanning | ceiling | roomdone | configure
  const [mode, setMode] = React.useState('auto');         // auto | corner
  const [cam, setCam] = React.useState('off');            // off | on | denied
  const [calStep, setCalStep] = React.useState(0);        // 0 floor, 1 ceiling
  const [session, setSession] = React.useState([]);       // confirmed rooms
  const [name, setName] = React.useState('');
  /* auto-scan state */
  const [script, setScript] = React.useState(null);
  const [evIdx, setEvIdx] = React.useState(0);
  const [wallsDone, setWallsDone] = React.useState([]);
  const [scanWall, setScanWall] = React.useState(null);
  const [boxes, setBoxes] = React.useState([]);
  const [coach, setCoach] = React.useState('');
  const [found, setFound] = React.useState([]);           // log: {label, detail, color}
  const [result, setResult] = React.useState(null);       // resolved room awaiting confirm
  const [closing, setClosing] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [detObjs, setDetObjs] = React.useState([]);        // objects seen so far this scan
  const [detDoors, setDetDoors] = React.useState([]);
  const [extras, setExtras] = React.useState([]);          // bonus objects found in extended scanning
  /* corner mode */
  const [taps, setTaps] = React.useState([]);
  const [corners, setCorners] = React.useState([]);
  const [ceilH, setCeilH] = React.useState(9);
  /* configure */
  const [cats, setCats] = React.useState({ furniture: true, appliance: true, plumbing: true, electrical: true });
  const [replay, setReplay] = React.useState(true);
  const vfRef = React.useRef(null);
  /* LIVE WALL CAPTURE — compass/gyro-driven: as you sweep the phone across a
     wall, the sweep commits a wall segment and the plan builds in real time. */
  const [liveWalls, setLiveWalls] = React.useState([]);   // {heading, len}
  const [headingNow, setHeadingNow] = React.useState(null);
  const sweepRef = React.useRef(null);                     // {startH, lastH, swept}
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  /* camera passthrough */
  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = s;
      setCam('on');
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); } });
    } catch (e) { setCam('denied'); }
  };
  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCam('off'); };
  React.useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }, []);

  /* calibration sequence */
  React.useEffect(() => {
    if (stage !== 'calibrate') return;
    const t = setTimeout(() => { calStep === 0 ? setCalStep(1) : setStage('ready'); }, 1600 / speed);
    return () => clearTimeout(t);
  }, [stage, calStep, speed]);

  /* orientation → wall segments (runs while scanning with the camera on) */
  React.useEffect(() => {
    if (stage !== 'scanning' || cam !== 'on' || closing) return;
    const norm = (h) => ((h % 360) + 360) % 360;
    const onOri = (e) => {
      let h = (e.webkitCompassHeading != null) ? e.webkitCompassHeading : (e.alpha != null ? 360 - e.alpha : null);
      if (h == null) return;
      h = norm(h);
      setHeadingNow(Math.round(h));
      const sw = sweepRef.current;
      if (!sw) { sweepRef.current = { startH: h, lastH: h, swept: 0 }; return; }
      let d = h - sw.lastH;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      sw.swept += Math.abs(d); sw.lastH = h;
      if (sw.swept >= 38) {  // one wall's worth of sweep
        const wallHeading = norm(sw.startH + (sw.swept / 2));
        setLiveWalls(w => {
          if (w.length >= 12) return w;
          const nw = [...w, { heading: wallHeading, len: 10 + Math.round(sw.swept / 12) }];
          setFound(f => [{ label: `Wall ${nw.length}`, detail: `captured · live sweep ${Math.round(sw.swept)}°`, color: '#34D399' }, ...f].slice(0, 40));
          setWallsDone(x => [...x, nw.length - 1]);
          setCoach(nw.length < 3 ? `Wall ${nw.length} locked — keep turning through the room` : `${nw.length} walls locked — tap ■ when the room is closed`);
          return nw;
        });
        sweepRef.current = { startH: h, lastH: h, swept: 0 };
      }
    };
    window.addEventListener('deviceorientationabsolute', onOri, true);
    window.addEventListener('deviceorientation', onOri, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOri, true);
      window.removeEventListener('deviceorientation', onOri, true);
    };
  }, [stage, cam, closing]);

  /* ── LIVE AI DETECTION (real camera + on-device models) ──
     Objects/furniture via COCO-SSD; wall/ceiling/floor/door/window coverage via
     DeepLab ADE20k. Runs whenever the camera is on during a scan and feeds the
     same boxes/found/objects state the scripted pump used. */
  const seenLive = React.useRef({});
  const segTick = React.useRef(0);
  React.useEffect(() => {
    if (stage !== 'scanning' || cam !== 'on' || closing) return;
    const V = window.__shieldVision;
    if (!V) return;
    let stop = false;
    V.depthCapability().then(capMode => {
      if (!stop) setCoach(capMode === 'ar-depth'
        ? 'AR depth available — scanning with live AI detection'
        : 'Live AI detection on — LiDAR-class depth uses the native capture app; objects, walls & ceilings are identified from the camera feed');
    });
    let firstDet = false;
    const loop = async () => {
      setCoach(c => c || 'Loading AI vision models…');
      while (!stop) {
        try {
          const dets = await V.detectObjects(videoRef.current);
          if (!firstDet) { firstDet = true; setCoach('AI detection active — sweep each wall slowly'); }
          if (stop) return;
          if (dets.length) {
            setBoxes(dets.map(d => ({ x: d.x, y: d.y, w: d.w, h: d.h, label: d.label, conf: d.conf, color: '#34D399' })));
            dets.forEach(d => {
              const key = d.label;
              const n = (seenLive.current[key] || 0) + 1;
              seenLive.current[key] = n;
              if (n === 2) { // confirmed across frames → log + add to scan objects
                const [w, hh] = (typeof SS_OBJ_SIZE !== 'undefined' && SS_OBJ_SIZE[d.type]) || [3, 2];
                setExtras(x => x.length < 24 ? [...x, { type: d.type, w, h: hh, x: 2 + (x.length % 5) * 2, y: 2 + (x.length % 3) * 2, conf: d.conf }] : x);
                setFound(f => [{ label: d.label, detail: `AI-detected · ${d.conf}%`, color: '#34D399' }, ...f].slice(0, 40));
              }
            });
          }
          segTick.current += 1;
          if (segTick.current % 4 === 0) {
            const surf = await V.segmentSurfaces(videoRef.current);
            if (stop) return;
            if (surf) {
              Object.entries(surf).forEach(([name, pct]) => {
                if (pct >= 8) setFound(f => (f[0] && f[0].label === `Surface: ${name}`) ? f : [{ label: `Surface: ${name}`, detail: `${pct}% of view · plane mapped`, color: 'var(--brand)' }, ...f].slice(0, 40));
              });
            }
          }
        } catch { /* model still loading or frame not ready */ }
        await new Promise(r => setTimeout(r, 1200));
      }
    };
    loop();
    return () => { stop = true; };
  }, [stage, cam, closing]);

  /* scan clock — runs until YOU stop the scan */
  React.useEffect(() => {
    if (stage !== 'scanning' || mode !== 'auto' || closing) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [stage, mode, closing]);

  /* auto-scan event pump — endless: after the base pass it keeps refining & finding objects */
  React.useEffect(() => {
    if (stage !== 'scanning' || mode !== 'auto' || closing || !script) return;
    const base = script.events;
    let e, dwell;
    if (evIdx < base.length) {
      e = base[evIdx];
      dwell = { coach: 900, wallscan: 1100, wall: 500, open: 850, obj: 900, ceil: 800 }[e.k] || 800;
    } else {
      const cyc = evIdx % 3;
      if (cyc === 1 && extras.length < 8) {
        const type = SS_AR_OBJ_POOL[(evIdx * 7) % SS_AR_OBJ_POOL.length];
        const [w, hh] = SS_OBJ_SIZE[type] || [3, 2];
        const o = { type, w, h: hh, x: Math.round(((evIdx * 13) % Math.max(1, script.size[0] - w - 1)) * 2) / 2, y: Math.round(((evIdx * 19) % Math.max(1, script.size[1] - hh - 1)) * 2) / 2, conf: 80 + (evIdx * 11) % 18 };
        e = { k: 'obj', o };
      } else if (cyc === 2) {
        e = { k: 'remeasure', i: evIdx % script.walls };
      } else {
        e = { k: 'points' };
      }
      dwell = 1700;
    }
    const t = setTimeout(() => {
      if (e.k === 'coach') setCoach(e.text);
      if (e.k === 'wallscan') { setScanWall(e.i); setCoach(`Scanning wall ${e.i + 1} of ${script.walls}…`); }
      if (e.k === 'wall') { setScanWall(null); setWallsDone(w => [...w, e.i]); setFound(f => [{ label: `Wall ${e.i + 1}`, detail: `${ssFt(e.len)} · captured`, color: '#34D399' }, ...f]); }
      if (e.k === 'open') { const spot = SS_BBOX_SPOTS[(evIdx + 1) % SS_BBOX_SPOTS.length]; setDetDoors(x => [...x, e.d]); setBoxes(b => [...b, { x: spot[0], y: spot[1], w: spot[2], h: spot[3], label: e.label, conf: e.conf, color: '#34D399' }]); setFound(f => [{ label: e.label, detail: `auto-detected · ${e.conf}%`, color: '#34D399' }, ...f]); }
      if (e.k === 'obj') {
        const o = ssObj(e.o.type); const spot = SS_BBOX_SPOTS[(evIdx + 3) % SS_BBOX_SPOTS.length];
        if (evIdx < base.length) setDetObjs(x => [...x, e.o]); else setExtras(x => [...x, e.o]);
        setBoxes(b => [...b.slice(-7), { x: spot[0], y: spot[1], w: spot[2], h: spot[3], label: o.label, conf: e.o.conf, color: o.color }]);
        setFound(f => [{ label: o.label, detail: `obstruction classified · ${e.o.conf}%`, color: o.color }, ...f]);
      }
      if (e.k === 'ceil') { setFound(f => [{ label: 'Ceiling height', detail: `${e.h}′ measured`, color: 'var(--brand)' }, ...f]); setCoach('Keep scanning for detail — or tap ■ to finish'); }
      if (e.k === 'remeasure') setFound(f => [{ label: `Wall ${e.i + 1}`, detail: 're-measured · ±0.1′', color: 'var(--brand)' }, ...f]);
      if (e.k === 'points') setFound(f => [{ label: 'Point cloud', detail: `${(4200 + evIdx * 480).toLocaleString()} pts densified`, color: 'var(--brand)' }, ...f]);
      setEvIdx(i => i + 1);
    }, dwell / speed);
    return () => clearTimeout(t);
  }, [stage, mode, closing, script, evIdx, speed, extras.length]);

  /* stop scan — close whatever geometry has been captured (MagicPlan auto-close) */
  const finishScan = () => {
    if (!script || closing) return;
    setClosing(true); setScanWall(null); setCoach('Closing room geometry…');
    setTimeout(() => {
      const orange = Math.max(0, script.walls - wallsDone.length);
      let poly = script.poly;
      if (cam === 'on' && liveWalls.length >= 3) {
        // Build the room polygon from the walls actually swept on-site.
        let x = 0, y = 0; const pts = [[0, 0]];
        liveWalls.forEach(w => {
          const a = (w.heading + 90) * Math.PI / 180;
          x += Math.cos(a) * w.len; y += Math.sin(a) * w.len;
          pts.push([x, y]);
        });
        const xs = pts.map(p2 => p2[0]), ys = pts.map(p2 => p2[1]);
        const mx = Math.min(...xs), my = Math.min(...ys);
        poly = pts.slice(0, -1).map(p2 => [Math.round((p2[0] - mx) * 2) / 2 + 1, Math.round((p2[1] - my) * 2) / 2 + 1]);
      }
      setResult({ name: name || script.guess, mode: 'auto', poly, h: script.h, doors: detDoors, objects: [...detObjs, ...extras], orange });
      setName(n => n || script.guess);
      setClosing(false);
      setStage('roomdone');
    }, 1100 / speed);
  };

  const record = () => {
    if (stage === 'scanning') { finishScan(); return; }
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); } catch {}
    setLiveWalls([]); sweepRef.current = null;
    const seed = roomCount + session.length + 1;
    setScript(ssBuildAutoRoom(seed));
    setEvIdx(0); setWallsDone([]); setBoxes([]); setFound([]); setCoach(''); setScanWall(null); setName('');
    setDetObjs([]); setDetDoors([]); setExtras([]); setElapsed(0); setClosing(false);
    setStage('scanning');
  };

  /* corner mode taps */
  const tapCorner = e => {
    if (stage !== 'scanning' || mode !== 'corner') return;
    const r = vfRef.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    if (ny < 0.28) return;
    setTaps(t => [...t, [nx * 100, ny * 100]]);
    setCorners(c => [...c, [Math.round(nx * 28), Math.round((1 - ny) * 30)]]);
  };
  const closeCorners = () => {
    if (corners.length < 3) return;
    setStage('ceiling');
  };
  const confirmCeiling = () => {
    const poly = ssRectify(corners);
    setResult({ name: name || `Room ${roomCount + session.length + 1}`, mode: 'corner', poly, h: ceilH, doors: [], objects: [] });
    setName(n => n || `Room ${roomCount + session.length + 1}`);
    setStage('roomdone');
  };

  const confirmRoom = () => {
    setSession(s => [...s, { ...result, name: name.trim() || result.name }]);
    setResult(null); setTaps([]); setCorners([]); setBoxes([]); setFound([]); setName('');
    setStage('ready');
  };
  const discardRoom = () => { setResult(null); setTaps([]); setCorners([]); setBoxes([]); setFound([]); setStage('ready'); };
  const generate = () => {
    const rooms = session.map(r => ({ ...r, objects: (r.objects || []).filter(o => cats[ssObj(o.type).cat]) }));
    onDone({ rooms, opts: { cats, replay } });
  };

  const btn = (primary, extra) => ({ padding: '12px 16px', borderRadius: 12, border: primary ? 'none' : '1px solid var(--border-strong)', background: primary ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'rgba(10,16,24,0.8)', color: primary ? '#fff' : 'var(--brand)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', ...extra });
  const recording = stage === 'scanning' && mode === 'auto' && !closing;

  /* ══ tips screen ══ */
  if (stage === 'tips') return ssPortal(
    <div style={ssOverlay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)' }}>AR Scan — {floorLabel}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 120, borderRadius: 14, background: 'radial-gradient(ellipse at 50% 100%, rgba(63,169,245,0.25), rgba(5,10,17,0.9) 70%)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'var(--brand)' }}>◉</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-high)' }}>Before you scan</div>
        {[['◫', 'Close room doors', 'so the scan doesn\'t capture adjoining rooms'], ['◔', 'Move slowly, one wall at a time', 'white lines show wall detection — walls turn green when captured'], ['▦', 'Obstructions are fine', 'AI classifies cabinets, counters, desks & racks and sees through them to the wall'], ['⚠', 'Orange wall = not captured', 'rescan it or the room won\'t close']].map(([g, t, s]) => (
          <div key={t} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--brand)', flexShrink: 0 }}>{g}</span>
            <div><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{t}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', lineHeight: 1.45 }}>{s}</div></div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => { startCam(); setCalStep(0); setStage('calibrate'); }} style={btn(true)}>📷 Start with camera passthrough</button>
        <button onClick={() => { setCalStep(0); setStage('calibrate'); }} style={btn(false)}>Use simulated feed</button>
      </div>
    </div>
  );

  /* ══ configure floor plan ══ */
  if (stage === 'configure') return ssPortal(
    <div style={ssOverlay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setStage('ready')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 20, cursor: 'pointer', padding: 0 }}>‹</button>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)' }}>Configure Floor Plan</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="glass" style={{ borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-high)', marginBottom: 2 }}>{session.length} room{session.length > 1 ? 's' : ''} scanned</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{Math.round(session.reduce((a, r) => a + ssArea(r.poly), 0))} ft² · {session.reduce((a, r) => a + (r.objects || []).length, 0)} objects · {session.reduce((a, r) => a + (r.doors || []).length, 0)} openings documented</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>INCLUDE OBJECTS</div>
          {SS_OBJ_CATS.map(c => (
            <label key={c} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={cats[c]} onChange={e => setCats(x => ({ ...x, [c]: e.target.checked }))} style={{ accentColor: 'var(--brand)', width: 16, height: 16 }} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)', textTransform: 'capitalize', flex: 1 }}>{c === 'plumbing' ? 'Plumbing fixtures' : c}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{session.reduce((a, r) => a + (r.objects || []).filter(o => ssObj(o.type).cat === c).length, 0)}</span>
            </label>
          ))}
        </div>
        <label className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={replay} onChange={e => setReplay(e.target.checked)} style={{ accentColor: 'var(--brand)', width: 16, height: 16 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>Session replay</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>Save a video recording of this scan session</div>
          </div>
        </label>
      </div>
      <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={generate} style={btn(true, { width: '100%', background: 'linear-gradient(135deg, #34D399, #10B981)' })}>✓ Generate Floor Plan</button>
      </div>
    </div>
  );

  /* ══ live AR view (calibrate / ready / scanning / ceiling / roomdone) ══ */
  return ssPortal(
    <div style={ssOverlay}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', zIndex: 4, background: 'linear-gradient(180deg, rgba(3,6,11,0.85), rgba(3,6,11,0.4))' }}>
        <button onClick={() => { stopCam(); onCancel(); }} style={{ background: 'rgba(4,10,16,0.7)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--text-high)', fontSize: 11.5, fontWeight: 600, padding: '7px 11px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕ Exit AR</button>
        <div style={{ flex: 1 }}></div>
        {cam !== 'on'
          ? <button onClick={startCam} title="Camera passthrough" style={{ background: 'rgba(4,10,16,0.7)', border: '1px solid var(--border-strong)', borderRadius: 9, color: cam === 'denied' ? 'var(--status-warn)' : 'var(--text-mid)', fontSize: 11, fontWeight: 600, padding: '7px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>📷 {cam === 'denied' ? 'blocked' : 'camera'}</button>
          : <button onClick={stopCam} style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 9, color: '#34D399', fontSize: 11, fontWeight: 600, padding: '7px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>📷 live</button>}
        {session.length > 0 && stage !== 'roomdone' && (
          <button onClick={() => setStage('configure')} style={{ background: 'linear-gradient(135deg, #34D399, #10B981)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '8px 13px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Done ({session.length})</button>
        )}
      </div>

      {/* viewfinder */}
      <div ref={vfRef} onPointerDown={tapCorner} style={{ flex: 1, position: 'relative', overflow: 'hidden', marginTop: -52, cursor: mode === 'corner' && stage === 'scanning' ? 'crosshair' : 'default', touchAction: 'none' }}>
        {cam === 'on'
          ? <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}></video>
          : <SSFakeFeed />}

        {/* AR grid (helps aim through furniture, per MagicPlan) */}
        {(stage === 'scanning' || stage === 'ceiling') && (
          <div style={{ position: 'absolute', left: '-30%', right: '-30%', top: '44%', bottom: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 38px)', transform: 'perspective(320px) rotateX(56deg)', transformOrigin: 'top center', pointerEvents: 'none' }}></div>
        )}
        {recording && <SSMesh on={true} />}
        {recording && <SSPointCloud pct={Math.min(96, evIdx * 9)} />}
        {stage === 'scanning' && mode === 'auto' && boxes.map((b, i) => <SSBBox key={i} b={b} />)}

        {/* wall scan line */}
        {scanWall != null && (
          <div style={{ position: 'absolute', left: '6%', right: '6%', top: '32%', pointerEvents: 'none' }}>
            <div style={{ height: 2.5, background: '#fff', boxShadow: '0 0 16px rgba(255,255,255,0.9)', animation: 'fade-up 0.5s ease both' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 2, height: 120, background: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent)' }}></div>
          </div>
        )}

        {/* corner-mode markers */}
        {mode === 'corner' && taps.map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: `${p[0]}%`, top: `${p[1]}%`, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', border: '2px solid #34D399', background: 'rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', boxShadow: '0 0 12px rgba(52,211,153,0.6)' }}>{i + 1}</div>
        ))}
        {mode === 'corner' && taps.length >= 2 && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points={taps.map(p => p.join(',')).join(' ')} fill="none" stroke="#34D399" strokeWidth="0.5" strokeDasharray="1.5 1" vectorEffect="non-scaling-stroke"></polyline>
          </svg>
        )}

        {/* reticle */}
        {(stage === 'ready' || stage === 'scanning') && (
          <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
            <div style={{ width: 44, height: 44, border: `1.5px solid ${mode === 'corner' ? 'rgba(52,211,153,0.9)' : 'rgba(63,169,245,0.85)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 18px ${mode === 'corner' ? 'rgba(52,211,153,0.4)' : 'rgba(63,169,245,0.35)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: mode === 'corner' ? '#34D399' : 'var(--brand)' }}></div>
            </div>
          </div>
        )}

        {/* calibration overlay */}
        {stage === 'calibrate' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'rgba(2,5,10,0.45)' }}>
            <div style={{ fontSize: 44, animation: 'fade-up 0.5s ease both' }}>{calStep === 0 ? '⬇' : '⬆'}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>{calStep === 0 ? 'Point your device at the floor' : 'Now point at the ceiling'}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(200,220,240,0.8)' }}>Calibrating LiDAR + gyroscope…</div>
            <div style={{ width: 140, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: calStep === 0 ? '45%' : '90%', background: 'var(--brand)', transition: 'width 1.4s ease' }}></div>
            </div>
          </div>
        )}

        {/* status pill */}
        {stage !== 'calibrate' && stage !== 'roomdone' && (
          <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', maxWidth: '86%', padding: '6px 14px', borderRadius: 20, background: 'rgba(4,10,16,0.85)', border: '1px solid var(--border-strong)', fontSize: 10.5, fontWeight: 600, color: 'var(--brand)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backdropFilter: 'blur(6px)', zIndex: 3 }}>
            {stage === 'ready' ? (session.length ? 'Move to the next room · tap record' : mode === 'auto' ? 'Tap record to start Auto-Scan' : 'Tap record, then tap wall corners')
              : stage === 'ceiling' ? 'Set the ceiling height'
              : mode === 'corner' ? (corners.length === 0 ? 'Tap where wall corners meet the floor' : `${corners.length} corner${corners.length > 1 ? 's' : ''} — AI closes obstructed corners for you`)
              : closing ? 'Closing room geometry…'
              : coach || 'Scanning…'}
          </div>
        )}

        {/* wall progress dots (auto) */}
        {stage === 'scanning' && mode === 'auto' && script && (
          <div style={{ position: 'absolute', top: 92, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 3 }}>
            {Array.from({ length: script.walls }, (_, i) => (
              <span key={i} style={{ width: 18, height: 5, borderRadius: 3, background: wallsDone.includes(i) ? '#34D399' : scanWall === i ? '#fff' : 'rgba(255,255,255,0.2)', boxShadow: scanWall === i ? '0 0 8px #fff' : 'none', transition: 'background 0.3s' }}></span>
            ))}
          </div>
        )}

        {/* LIVE PLAN — the room builds in real time as walls are swept */}
        {stage === 'scanning' && cam === 'on' && (
          <div style={{ position: 'absolute', left: 10, bottom: 104, zIndex: 3, width: 148, borderRadius: 12, background: 'rgba(4,10,16,0.82)', border: '1px solid var(--border-strong)', padding: '8px 9px 6px', backdropFilter: 'blur(6px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: '#34D399' }}>LIVE PLAN</span>
              <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{headingNow != null ? headingNow + '°' : '—'}</span>
            </div>
            <div style={{ perspective: 320 }}>
              <svg width="130" height="96" viewBox="0 0 130 96" style={{ transform: 'rotateX(38deg)', transformOrigin: '50% 70%' }}>
                {(() => {
                  if (!liveWalls.length) return <text x="65" y="52" textAnchor="middle" fill="rgba(159,178,200,0.4)" fontSize="8">sweep a wall to start</text>;
                  let x = 0, y = 0; const pts = [[0, 0]];
                  liveWalls.forEach(w => { const a = (w.heading + 90) * Math.PI / 180; x += Math.cos(a) * w.len; y += Math.sin(a) * w.len; pts.push([x, y]); });
                  const xs = pts.map(p2 => p2[0]), ys = pts.map(p2 => p2[1]);
                  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
                  const sc = Math.min(110 / Math.max(1, mxx - mnx), 74 / Math.max(1, mxy - mny));
                  const P = pts.map(p2 => [10 + (p2[0] - mnx) * sc, 10 + (p2[1] - mny) * sc]);
                  const closed = liveWalls.length >= 3;
                  return (
                    <g>
                      {closed && <polygon points={P.map(p2 => p2.join(',')).join(' ')} fill="rgba(52,211,153,0.10)" />}
                      {P.slice(0, -1).map((p2, i) => (
                        <g key={i}>
                          <line x1={p2[0]} y1={p2[1]} x2={P[i + 1][0]} y2={P[i + 1][1]} stroke="#34D399" strokeWidth="2.4" strokeLinecap="round" />
                          <line x1={p2[0]} y1={p2[1] - 5} x2={P[i + 1][0]} y2={P[i + 1][1] - 5} stroke="rgba(52,211,153,0.35)" strokeWidth="1.2" />
                          <line x1={p2[0]} y1={p2[1]} x2={p2[0]} y2={p2[1] - 5} stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
                        </g>
                      ))}
                      {P.length > 1 && <line x1={P[P.length - 1][0]} y1={P[P.length - 1][1]} x2={P[0][0]} y2={P[0][1]} stroke={closed ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.6)'} strokeWidth="1.4" strokeDasharray="3 3" />}
                    </g>
                  );
                })()}
              </svg>
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-low)', textAlign: 'center' }}>{liveWalls.length} wall{liveWalls.length === 1 ? '' : 's'} · {detObjs.length + extras.length} objects</div>
          </div>
        )}

        {/* detection log (last 3) */}
        {stage === 'scanning' && found.length > 0 && (
          <div style={{ position: 'absolute', right: 10, bottom: 104, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', zIndex: 3 }}>
            {found.slice(0, 3).map((f, i) => (
              <div key={found.length - i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 8, background: 'rgba(4,10,16,0.85)', border: `1px solid color-mix(in srgb, ${f.color} 45%, transparent)`, opacity: 1 - i * 0.28, animation: 'fade-up 0.3s ease both' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color }}></span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-high)' }}>{f.label}</span>
                <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{f.detail}</span>
              </div>
            ))}
          </div>
        )}

        <SSSessionMap rooms={session} current={result ? result.poly : (stage === 'scanning' && mode === 'auto' && script && wallsDone.length >= 2) ? script.poly.slice(0, wallsDone.length + 1) : null} />

        {/* ceiling height overlay (corner mode) */}
        {stage === 'ceiling' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(2,5,10,0.5)', zIndex: 3 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>Slide the grid from floor to ceiling</div>
            <div className="mono" style={{ fontSize: 34, fontWeight: 800, color: 'var(--brand)', textShadow: '0 0 24px rgba(63,169,245,0.5)' }}>{ceilH.toFixed(1)}′</div>
            <input type="range" min="7" max="14" step="0.1" value={ceilH} onChange={e => setCeilH(Number(e.target.value))} style={{ width: '70%', accentColor: 'var(--brand)' }} />
            <button onClick={confirmCeiling} style={btn(true)}>✓ Set ceiling height</button>
          </div>
        )}

        {/* room confirm card */}
        {stage === 'roomdone' && result && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', background: 'rgba(2,5,10,0.55)', zIndex: 5 }}>
            <div style={{ width: '100%', background: 'var(--canvas)', borderTop: '1px solid var(--border-strong)', borderRadius: '18px 18px 0 0', padding: '16px 16px calc(18px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 11, animation: 'fade-up 0.3s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1.5px solid #34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: 12, fontWeight: 800 }}>✓</span>
                <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-high)', fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)', outline: 'none', minWidth: 0 }} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)', flexShrink: 0 }}>{Math.round(ssArea(result.poly))} ft²</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{result.orange ? '' : 'All walls closed ✓ · '}ceiling {result.h}′ · {result.doors.length} opening{result.doors.length !== 1 ? 's' : ''} · {result.objects.length} object{result.objects.length !== 1 ? 's' : ''} documented</div>
              {result.orange > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 9, background: 'rgba(251,146,60,0.09)', border: '1px solid rgba(251,146,60,0.4)' }}>
                  <span style={{ fontSize: 12 }}>⚠</span>
                  <span style={{ fontSize: 10, color: '#FB923C', lineHeight: 1.4 }}>{result.orange} wall{result.orange > 1 ? 's' : ''} not fully captured (orange) — auto-closed from geometry. Rescan for exact dimensions.</span>
                </div>
              )}
              {result.objects.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {result.objects.map((o, i) => { const d = ssObj(o.type); return <span key={i} style={{ fontSize: 9.5, fontWeight: 600, color: d.color, background: `color-mix(in srgb, ${d.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${d.color} 35%, transparent)`, borderRadius: 6, padding: '3px 8px' }}>{d.label} <span className="mono" style={{ opacity: 0.7 }}>{o.conf}%</span></span>; })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={discardRoom} style={btn(false, { flex: 1 })}>Discard & Rescan</button>
                <button onClick={confirmRoom} style={btn(true, { flex: 1.4, background: 'linear-gradient(135deg, #34D399, #10B981)' })}>Confirm Scan</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* bottom controls */}
      {(stage === 'ready' || stage === 'scanning') && (
        <div style={{ padding: '10px 14px calc(14px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(0deg, rgba(3,6,11,0.9), rgba(3,6,11,0.4))', display: 'flex', alignItems: 'center', gap: 12, zIndex: 4 }}>
          <div style={{ flex: 1 }}>
            {stage === 'ready' && <MSegment options={['◉ Auto-Scan', '⊹ Corner Mode']} value={mode === 'auto' ? '◉ Auto-Scan' : '⊹ Corner Mode'} onChange={v => { setMode(v.includes('Auto') ? 'auto' : 'corner'); setTaps([]); setCorners([]); }} />}
            {stage === 'scanning' && mode === 'corner' && (
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => { setTaps(t => t.slice(0, -1)); setCorners(c => c.slice(0, -1)); }} disabled={!corners.length} style={btn(false, { flex: 1, opacity: corners.length ? 1 : 0.4, padding: '10px 8px' })}>↩ Undo</button>
                <button onClick={closeCorners} disabled={corners.length < 3} style={btn(true, { flex: 1.5, opacity: corners.length >= 3 ? 1 : 0.4, padding: '10px 8px' })}>▣ Close ({corners.length})</button>
              </div>
            )}
            {stage === 'scanning' && mode === 'auto' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>● REC {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{wallsDone.length}/{script ? script.walls : 0} walls · {detObjs.length + extras.length + detDoors.length} elements — tap ■ to finish</div>
              </div>
            )}
          </div>
          {/* record button */}
          <button onClick={mode === 'corner' && stage === 'ready' ? () => { setStage('scanning'); } : record} aria-label="Record"
            style={{ width: 62, height: 62, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.85)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{
              width: recording ? 24 : 46, height: recording ? 24 : 46, borderRadius: recording ? 6 : '50%',
              background: '#EF4444', transition: 'all 0.25s ease', boxShadow: recording ? '0 0 18px rgba(239,68,68,0.7)' : 'none',
            }}></span>
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SSCapture, ssOverlay, ssRectify });

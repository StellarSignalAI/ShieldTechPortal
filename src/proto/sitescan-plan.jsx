/* SiteScan — 2D blueprint editor.
   Pan/zoom SVG floor plan: drag corners & devices, add doors/windows on walls,
   place devices (palette → price book SKU), draw cable runs w/ live footage,
   drop photo pins. Theme: dark blueprint / light paper (Tweaks). */

const SS_THEMES = {
  dark:  { bg: '#07101c', grid: 'rgba(63,169,245,0.07)', gridBold: 'rgba(63,169,245,0.13)', wall: '#9fd4fb', wallW: 2.5, roomFill: 'rgba(63,169,245,0.06)', roomSel: 'rgba(63,169,245,0.14)', dim: '#5b87a8', label: '#cfe7fa', sub: '#6f93ad', cable: '#FBBF24', photo: '#34D399' },
  paper: { bg: '#eef2ee', grid: 'rgba(30,64,120,0.08)', gridBold: 'rgba(30,64,120,0.16)', wall: '#1e3a5f', wallW: 2.5, roomFill: 'rgba(30,64,120,0.05)', roomSel: 'rgba(30,64,120,0.12)', dim: '#4a6a8a', label: '#122a44', sub: '#4a6a8a', cable: '#b45309', photo: '#0f766e' },
};

/* ── Shared plan renderer (editor + report preview) ── */
function SSPlanLayers({ floor, th, icons, sel, S = 8 }) {
  const rooms = floor.rooms || [], doors = floor.doors || [], devices = floor.devices || [], cables = floor.cables || [], photos = floor.photos || [], objects = floor.objects || [];
  const roomBy = id => rooms.find(r => r.id === id);
  return (
    <g>
      {/* rooms */}
      {rooms.map(r => {
        const c = ssCentroid(r.poly);
        const isSel = sel && sel.kind === 'room' && sel.id === r.id;
        return (
          <g key={r.id}>
            <polygon points={r.poly.map(p => `${p[0] * S},${p[1] * S}`).join(' ')} fill={isSel ? th.roomSel : th.roomFill} stroke={th.wall} strokeWidth={th.wallW} strokeLinejoin="miter"></polygon>
            <text x={c[0] * S} y={c[1] * S - 5} textAnchor="middle" fill={th.label} fontSize="10" fontWeight="700" fontFamily="var(--font-body)">{r.name}</text>
            <text x={c[0] * S} y={c[1] * S + 7} textAnchor="middle" fill={th.sub} fontSize="7.5" fontFamily="var(--font-mono, monospace)">{Math.round(ssArea(r.poly))} ft²</text>
            {/* wall dimensions */}
            {ssEdges(r.poly).map(([a, b], i) => {
              const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
              if (len < 5) return null;
              const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
              const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len; /* outward-ish normal */
              return <text key={i} x={(mx + nx * 1.6) * S} y={(my + ny * 1.6) * S + 2} textAnchor="middle" fill={th.dim} fontSize="6.5" fontFamily="var(--font-mono, monospace)">{ssFt(len)}</text>;
            })}
          </g>
        );
      })}
      {/* doors & windows */}
      {doors.map(d => {
        const r = roomBy(d.room); if (!r) return null;
        const [a, b] = ssEdges(r.poly)[d.edge % r.poly.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
        const m = ssPtOnEdge(r.poly, d.edge % r.poly.length, d.t);
        const h = d.w / 2;
        const p1 = [m[0] - ux * h, m[1] - uy * h], p2 = [m[0] + ux * h, m[1] + uy * h];
        const isSel = sel && sel.kind === 'door' && sel.id === d.id;
        return (
          <g key={d.id} opacity={isSel ? 1 : 0.95}>
            {/* wall gap */}
            <line x1={p1[0] * S} y1={p1[1] * S} x2={p2[0] * S} y2={p2[1] * S} stroke={th.bg} strokeWidth={th.wallW + 2}></line>
            {d.kind === 'door' ? (
              <g>
                <line x1={p1[0] * S} y1={p1[1] * S} x2={(p1[0] - uy * d.w) * S} y2={(p1[1] + ux * d.w) * S} stroke={isSel ? '#34D399' : th.wall} strokeWidth="1.4"></line>
                <path d={`M ${p2[0] * S} ${p2[1] * S} A ${d.w * S} ${d.w * S} 0 0 1 ${(p1[0] - uy * d.w) * S} ${(p1[1] + ux * d.w) * S}`} fill="none" stroke={isSel ? '#34D399' : th.dim} strokeWidth="0.9" strokeDasharray="2.5 2"></path>
              </g>
            ) : (
              <g stroke={isSel ? '#34D399' : th.wall} strokeWidth="1.2">
                <line x1={p1[0] * S} y1={(p1[1]) * S} x2={p2[0] * S} y2={p2[1] * S} transform={`translate(${-uy * 2},${ux * 2})`}></line>
                <line x1={p1[0] * S} y1={(p1[1]) * S} x2={p2[0] * S} y2={p2[1] * S} transform={`translate(${uy * 2},${-ux * 2})`}></line>
              </g>
            )}
          </g>
        );
      })}
      {/* documented objects (auto-detected obstructions) */}
      {objects.map(o => {
        const d = ssObj(o.type);
        const isSel = sel && sel.kind === 'object' && sel.id === o.id;
        return (
          <g key={o.id} opacity={isSel ? 1 : 0.8}>
            <rect x={o.x * S} y={o.y * S} width={o.w * S} height={o.h * S} rx={2.5} fill={`color-mix(in srgb, ${d.color} 10%, transparent)`} stroke={d.color} strokeWidth={isSel ? 1.6 : 1} strokeDasharray="3 2"></rect>
            {o.w * S > 24 && <text x={(o.x + o.w / 2) * S} y={(o.y + o.h / 2) * S + 2.5} textAnchor="middle" fill={d.color} fontSize="6" fontWeight="600" fontFamily="var(--font-body)">{d.label}</text>}
          </g>
        );
      })}
      {/* cables */}
      {cables.map(c => {
        const ft = Math.round(ssPolyLen(c.pts) * 1.15);
        const last = c.pts[c.pts.length - 1];
        const isSel = sel && sel.kind === 'cable' && sel.id === c.id;
        return (
          <g key={c.id}>
            <polyline points={c.pts.map(p => `${p[0] * S},${p[1] * S}`).join(' ')} fill="none" stroke={th.cable} strokeWidth={isSel ? 2.2 : 1.4} strokeDasharray="5 3" strokeLinejoin="round" opacity="0.85"></polyline>
            <text x={last[0] * S + 4} y={last[1] * S - 4} fill={th.cable} fontSize="6.5" fontFamily="var(--font-mono, monospace)">{ft}ft</text>
          </g>
        );
      })}
      {/* photo pins */}
      {photos.map(p => {
        const isSel = sel && sel.kind === 'photo' && sel.id === p.id;
        return (
          <g key={p.id} transform={`translate(${p.x * S},${p.y * S})`}>
            <circle r={isSel ? 8 : 6.5} fill={th.photo} opacity="0.18"></circle>
            <circle r="4.5" fill={th.bg} stroke={th.photo} strokeWidth="1.4"></circle>
            <path d="M-2.2,-0.8 h1l0.7,-1h1l0.7,1h1 v3 h-4.4z M0,1 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0" fill={th.photo} transform="scale(1.1)"></path>
          </g>
        );
      })}
      {/* devices */}
      {devices.map(v => {
        const d = ssDev(v.type);
        const isSel = sel && sel.kind === 'device' && sel.id === v.id;
        return (
          <g key={v.id} transform={`translate(${v.x * S},${v.y * S})`}>
            {isSel && <circle r="12" fill="none" stroke={d.color} strokeWidth="1" strokeDasharray="3 2"></circle>}
            <circle r="8" fill={th.bg} stroke={d.color} strokeWidth="1.6"></circle>
            {icons === 'glyph'
              ? <path d={d.glyph} fill="none" stroke={d.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" transform="translate(-6,-6) scale(0.5)"></path>
              : <text y="3" textAnchor="middle" fill={d.color} fontSize="7.5" fontWeight="800" fontFamily="var(--font-body)">{d.letter}</text>}
            <text y="15" textAnchor="middle" fill={th.sub} fontSize="5.5" fontFamily="var(--font-mono, monospace)">{v.label}</text>
          </g>
        );
      })}
    </g>
  );
}

/* Static thumbnail (report / cards) */
function SSPlanThumb({ floor, theme = 'dark', icons = 'glyph', height = 150 }) {
  const th = SS_THEMES[theme] || SS_THEMES.dark;
  const b = ssBounds(floor.rooms || []);
  const S = 8, pad = 24;
  const vb = [`${b.x1 * S - pad}`, `${b.y1 * S - pad}`, `${(b.x2 - b.x1) * S + pad * 2}`, `${(b.y2 - b.y1) * S + pad * 2}`].join(' ');
  return (
    <svg viewBox={vb} style={{ width: '100%', height, display: 'block', background: th.bg, borderRadius: 10 }} preserveAspectRatio="xMidYMid meet">
      <SSPlanLayers floor={floor} th={th} icons={icons} S={S}></SSPlanLayers>
    </svg>
  );
}

/* ── Interactive editor ── */
const SS_TOOLS = [
  { id: 'select', icon: '⇱', label: 'Select' },
  { id: 'door',   icon: '◫', label: 'Door' },
  { id: 'window', icon: '▤', label: 'Window' },
  { id: 'device', icon: '◎', label: 'Device' },
  { id: 'cable',  icon: '∿', label: 'Cable' },
  { id: 'photo',  icon: '⧇', label: 'Photo' },
];

function SSPlanEditor({ floor, onChange, onCaptureRoom }) {
  const [prefs] = useShieldStore(ssPrefsStore);
  const th = SS_THEMES[prefs.theme] || SS_THEMES.dark;
  const S = 8;
  const [tool, setTool] = React.useState('select');
  const [devType, setDevType] = React.useState('dome');
  const [palette, setPalette] = React.useState(false);
  const [sel, setSel] = React.useState(null);
  const [cableDraft, setCableDraft] = React.useState(null);
  const [view, setView] = React.useState(() => { const b = ssBounds(floor.rooms || []); return { x: b.x1 * S - 30, y: b.y1 * S - 30, zoom: 1 }; });
  const [big, setBig] = React.useState(false);
  const svgRef = React.useRef(null);
  const drag = React.useRef(null);

  const up = patch => onChange({ ...floor, ...patch });

  const toPlan = e => {
    const r = svgRef.current.getBoundingClientRect();
    const w = (view.zoom || 1);
    return [((e.clientX - r.left) / w + view.x) / S, ((e.clientY - r.top) / w + view.y) / S];
  };

  /* hit-testing */
  const hit = pt => {
    for (const r of floor.rooms) for (let i = 0; i < r.poly.length; i++)
      if (Math.hypot(r.poly[i][0] - pt[0], r.poly[i][1] - pt[1]) < 1.6 / view.zoom) return { kind: 'corner', room: r.id, idx: i };
    for (const v of (floor.devices || [])) if (Math.hypot(v.x - pt[0], v.y - pt[1]) < 1.8 / view.zoom) return { kind: 'device', id: v.id };
    for (const p of (floor.photos || [])) if (Math.hypot(p.x - pt[0], p.y - pt[1]) < 1.6 / view.zoom) return { kind: 'photo', id: p.id };
    for (const o of (floor.objects || [])) if (pt[0] >= o.x && pt[0] <= o.x + o.w && pt[1] >= o.y && pt[1] <= o.y + o.h) return { kind: 'object', id: o.id };
    for (const d of (floor.doors || [])) { const r = floor.rooms.find(x => x.id === d.room); if (!r) continue; const m = ssPtOnEdge(r.poly, d.edge % r.poly.length, d.t); if (Math.hypot(m[0] - pt[0], m[1] - pt[1]) < 2 / view.zoom) return { kind: 'door', id: d.id }; }
    for (const c of (floor.cables || [])) for (const p of c.pts) if (Math.hypot(p[0] - pt[0], p[1] - pt[1]) < 1.4 / view.zoom) return { kind: 'cable', id: c.id };
    for (const r of floor.rooms) { /* inside test via bbox (rooms are near-convex here) */
      const xs = r.poly.map(p => p[0]), ys = r.poly.map(p => p[1]);
      if (pt[0] > Math.min(...xs) && pt[0] < Math.max(...xs) && pt[1] > Math.min(...ys) && pt[1] < Math.max(...ys)) return { kind: 'room', id: r.id };
    }
    return null;
  };

  const nearestWall = pt => {
    let best = null;
    floor.rooms.forEach(r => ssEdges(r.poly).forEach(([a, b], i) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
      let t = ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / L2; t = Math.max(0.1, Math.min(0.9, t));
      const px = a[0] + dx * t, py = a[1] + dy * t;
      const d = Math.hypot(px - pt[0], py - pt[1]);
      if (!best || d < best.d) best = { d, room: r.id, edge: i, t };
    }));
    return best && best.d < 3 ? best : null;
  };

  const down = e => {
    e.preventDefault();
    const pt = toPlan(e);
    if (tool === 'select') {
      const h = hit(pt);
      if (h && h.kind === 'corner') { drag.current = { type: 'corner', room: h.room, idx: h.idx }; setSel({ kind: 'room', id: h.room }); return; }
      if (h && (h.kind === 'device' || h.kind === 'photo' || h.kind === 'object')) { drag.current = { type: h.kind, id: h.id }; setSel(h); return; }
      if (h) { setSel(h); drag.current = { type: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }; return; }
      setSel(null);
      drag.current = { type: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    } else if (tool === 'door' || tool === 'window') {
      const w = nearestWall(pt);
      if (!w) { showToast('Tap on a wall', 'warn'); return; }
      const d = { id: ssId('d'), room: w.room, edge: w.edge, t: w.t, w: tool === 'door' ? 3 : 5, kind: tool, label: tool === 'door' ? 'Door' : 'Window' };
      up({ doors: [...(floor.doors || []), d] }); setSel({ kind: 'door', id: d.id });
    } else if (tool === 'device') {
      const d = ssDev(devType);
      const n = (floor.devices || []).filter(v => v.type === devType).length + 1;
      const v = { id: ssId('v'), type: devType, x: Math.round(pt[0] * 2) / 2, y: Math.round(pt[1] * 2) / 2, z: devType === 'dome' || devType === 'motion' ? 9 : 4.5, label: `${d.letter}${d.letter.length > 1 ? '' : 'EV'}-${String(n).padStart(2, '0')}`.replace('DEV', d.sku.slice(0, 3)) };
      v.label = `${d.label.split(' ')[0].slice(0, 3).toUpperCase()}-${String(n).padStart(2, '0')}`;
      up({ devices: [...(floor.devices || []), v] }); setSel({ kind: 'device', id: v.id });
    } else if (tool === 'cable') {
      const p = [Math.round(pt[0] * 2) / 2, Math.round(pt[1] * 2) / 2];
      setCableDraft(c => c ? [...c, p] : [p]);
    } else if (tool === 'photo') {
      const p = { id: ssId('p'), x: pt[0], y: pt[1], label: `Site photo ${(floor.photos || []).length + 1}`, hue: Math.floor(Math.random() * 360) };
      up({ photos: [...(floor.photos || []), p] }); setSel({ kind: 'photo', id: p.id });
    }
  };
  const move = e => {
    const d = drag.current; if (!d) return;
    if (d.type === 'pan') { setView(v => ({ ...v, x: d.ox - (e.clientX - d.sx) / v.zoom, y: d.oy - (e.clientY - d.sy) / v.zoom })); return; }
    const pt = toPlan(e);
    if (d.type === 'corner') up({ rooms: floor.rooms.map(r => r.id !== d.room ? r : { ...r, poly: r.poly.map((p, i) => i === d.idx ? [Math.round(pt[0] * 2) / 2, Math.round(pt[1] * 2) / 2] : p) }) });
    if (d.type === 'device') up({ devices: floor.devices.map(v => v.id !== d.id ? v : { ...v, x: Math.round(pt[0] * 2) / 2, y: Math.round(pt[1] * 2) / 2 }) });
    if (d.type === 'photo') up({ photos: floor.photos.map(p => p.id !== d.id ? p : { ...p, x: pt[0], y: pt[1] }) });
    if (d.type === 'object') up({ objects: floor.objects.map(o => o.id !== d.id ? o : { ...o, x: Math.round((pt[0] - o.w / 2) * 2) / 2, y: Math.round((pt[1] - o.h / 2) * 2) / 2 }) });
  };
  const end = () => { drag.current = null; };

  const endCable = () => {
    if (cableDraft && cableDraft.length >= 2) up({ cables: [...(floor.cables || []), { id: ssId('c'), pts: cableDraft, type: 'cat6a' }] });
    setCableDraft(null);
  };
  const delSel = () => {
    if (!sel) return;
    if (sel.kind === 'device') up({ devices: floor.devices.filter(v => v.id !== sel.id) });
    if (sel.kind === 'door') up({ doors: floor.doors.filter(d => d.id !== sel.id) });
    if (sel.kind === 'photo') up({ photos: floor.photos.filter(p => p.id !== sel.id) });
    if (sel.kind === 'object') up({ objects: floor.objects.filter(o => o.id !== sel.id) });
    if (sel.kind === 'cable') up({ cables: floor.cables.filter(c => c.id !== sel.id) });
    if (sel.kind === 'room') up({
      rooms: floor.rooms.filter(r => r.id !== sel.id),
      doors: (floor.doors || []).filter(d => d.room !== sel.id),
    });
    setSel(null);
  };

  const selInfo = () => {
    if (!sel) return null;
    if (sel.kind === 'device') { const v = (floor.devices || []).find(x => x.id === sel.id); if (!v) return null; const d = ssDev(v.type); return { title: `${v.label} — ${d.label}`, sub: `${d.sku} · $${d.unit} · ${d.hrs}h install · mount ${v.z}′ AFF`, color: d.color }; }
    if (sel.kind === 'room') { const r = floor.rooms.find(x => x.id === sel.id); if (!r) return null; return { title: r.name, sub: `${Math.round(ssArea(r.poly))} ft² · ${ssFt(ssPerim(r.poly))} perimeter · ${r.mode === 'lidar' ? 'LiDAR scan' : 'corner-tap'} capture`, color: 'var(--brand)' }; }
    if (sel.kind === 'door') { const d = (floor.doors || []).find(x => x.id === sel.id); if (!d) return null; return { title: d.kind === 'door' ? 'Door' : 'Window', sub: `${d.w}′ wide · ${d.label || ''}`, color: '#34D399' }; }
    if (sel.kind === 'photo') { const p = (floor.photos || []).find(x => x.id === sel.id); if (!p) return null; return { title: p.label, sub: 'Photo pin · geotagged to plan', color: SS_THEMES.dark.photo }; }
    if (sel.kind === 'object') { const o = (floor.objects || []).find(x => x.id === sel.id); if (!o) return null; const d = ssObj(o.type); return { title: `${d.label} — documented object`, sub: `${o.w}′ × ${o.h}′ · AR-classified at ${o.conf || 90}% · ${d.cat}`, color: d.color }; }
    if (sel.kind === 'cable') { const c = (floor.cables || []).find(x => x.id === sel.id); if (!c) return null; return { title: 'Cable run — CAT6A', sub: `${Math.round(ssPolyLen(c.pts) * 1.15)} ft incl. service loop`, color: th.cable }; }
    return null;
  };
  const info = selInfo();

  const zoomBy = f => setView(v => ({ ...v, zoom: Math.max(0.35, Math.min(3, v.zoom * f)) }));

  const canvas = (h) => (
    <div style={{ position: 'relative', borderRadius: big ? 0 : 12, overflow: 'hidden', border: big ? 'none' : '1px solid var(--border-subtle)', height: h, background: th.bg, touchAction: 'none' }}>
      <svg ref={svgRef} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
        style={{ width: '100%', height: '100%', display: 'block', cursor: tool === 'select' ? 'grab' : 'crosshair' }}>
        <g transform={`scale(${view.zoom}) translate(${-view.x},${-view.y})`}>
          {/* grid */}
          <g>{Array.from({ length: 60 }, (_, i) => <line key={'gx' + i} x1={(i - 10) * 5 * S} y1={-400} x2={(i - 10) * 5 * S} y2={1200} stroke={i % 2 ? th.grid : th.gridBold} strokeWidth={0.6 / view.zoom}></line>)}
            {Array.from({ length: 50 }, (_, i) => <line key={'gy' + i} x1={-400} y1={(i - 10) * 5 * S} x2={1600} y2={(i - 10) * 5 * S} stroke={i % 2 ? th.grid : th.gridBold} strokeWidth={0.6 / view.zoom}></line>)}</g>
          <SSPlanLayers floor={floor} th={th} icons={prefs.icons} sel={sel} S={S}></SSPlanLayers>
          {/* corner handles in select mode */}
          {tool === 'select' && floor.rooms.map(r => r.poly.map((p, i) => (
            <circle key={r.id + i} cx={p[0] * S} cy={p[1] * S} r={3.2 / view.zoom} fill={th.bg} stroke={th.wall} strokeWidth={1.2 / view.zoom}></circle>
          )))}
          {/* cable draft */}
          {cableDraft && <polyline points={cableDraft.map(p => `${p[0] * S},${p[1] * S}`).join(' ')} fill="none" stroke={th.cable} strokeWidth="1.6" strokeDasharray="4 3"></polyline>}
          {cableDraft && cableDraft.map((p, i) => <circle key={i} cx={p[0] * S} cy={p[1] * S} r="2.4" fill={th.cable}></circle>)}
        </g>
      </svg>
      {/* zoom + expand */}
      <div style={{ position: 'absolute', right: 8, top: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[['＋', () => zoomBy(1.25)], ['－', () => zoomBy(0.8)], [big ? '⤡' : '⤢', () => setBig(b => !b)]].map(([g, fn], i) => (
          <button key={i} onClick={fn} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(6,12,18,0.75)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>{g}</button>
        ))}
      </div>
      {/* scale chip */}
      <div className="mono" style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 8.5, color: prefs.theme === 'paper' ? '#4a6a8a' : 'var(--text-low)', background: prefs.theme === 'paper' ? 'rgba(255,255,255,0.7)' : 'rgba(6,12,18,0.7)', padding: '3px 8px', borderRadius: 6 }}>1 sq = 5 ft · {(floor.rooms || []).length} rooms</div>
      {cableDraft && (
        <button onClick={endCable} style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', padding: '8px 16px', borderRadius: 10, border: 'none', background: th.cable, color: '#1a1204', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          ✓ End run · {cableDraft.length > 1 ? Math.round(ssPolyLen(cableDraft) * 1.15) + ' ft' : 'tap path points'}
        </button>
      )}
    </div>
  );

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: big ? '100%' : 'auto' }}>
      {/* toolbar */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {SS_TOOLS.map(t => (
          <button key={t.id} onClick={() => { setTool(t.id); if (t.id === 'device') setPalette(true); if (t.id !== 'cable') setCableDraft(null); }}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 9, border: '1px solid', borderColor: tool === t.id ? 'var(--border-strong)' : 'var(--border-subtle)', background: tool === t.id ? 'rgba(63,169,245,0.14)' : 'rgba(63,169,245,0.03)', color: tool === t.id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <span style={{ fontSize: 12 }}>{t.icon}</span>{t.label}
            {t.id === 'device' && tool === 'device' && <span style={{ color: ssDev(devType).color }}>· {ssDev(devType).label.split(' ')[0]}</span>}
          </button>
        ))}
      </div>
      {canvas(big ? undefined : 380)}
      {/* selection bar */}
      {info && (
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, borderLeft: `3px solid ${info.color}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.title}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{info.sub}</div>
          </div>
          {sel.kind === 'room' && onCaptureRoom && <button onClick={() => onCaptureRoom()} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>↻ Rescan</button>}
          <button onClick={delSel} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.07)', color: '#F43F5E', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Delete</button>
        </div>
      )}
      {/* device palette sheet */}
      {palette && tool === 'device' && (
        <MSheet title="Device palette — symbols map to Price Book SKUs" onClose={() => setPalette(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {SS_DEVICES.map(d => (
              <button key={d.type} onClick={() => { setDevType(d.type); setPalette(false); showToast(`Tap the plan to place ${d.label}`, 'ok'); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px 10px', borderRadius: 11, border: '1px solid', borderColor: devType === d.type ? d.color : 'var(--border-subtle)', background: devType === d.type ? `color-mix(in srgb, ${d.color} 10%, transparent)` : 'rgba(63,169,245,0.03)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24"><path d={d.glyph} fill="none" stroke={d.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.15, textAlign: 'center' }}>{d.label}</span>
                <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{d.sku} · ${d.unit}</span>
              </button>
            ))}
          </div>
        </MSheet>
      )}
    </div>
  );

  if (big) return (
    <div style={{ ...ssOverlay, padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>{floor.label} — blueprint</span>
        <button onClick={() => setBig(false)} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10, gap: 8, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
          {SS_TOOLS.map(t => (
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id === 'device') setPalette(true); }} style={{ flexShrink: 0, padding: '7px 11px', borderRadius: 9, border: '1px solid', borderColor: tool === t.id ? 'var(--border-strong)' : 'var(--border-subtle)', background: tool === t.id ? 'rgba(63,169,245,0.14)' : 'transparent', color: tool === t.id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{canvas('100%')}</div>
        {info && <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11 }}><span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{info.title}</span><button onClick={delSel} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.07)', color: '#F43F5E', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Delete</button></div>}
        {palette && tool === 'device' && (
          <MSheet title="Device palette" onClose={() => setPalette(false)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {SS_DEVICES.map(d => (
                <button key={d.type} onClick={() => { setDevType(d.type); setPalette(false); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px 10px', borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.03)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24"><path d={d.glyph} fill="none" stroke={d.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-high)' }}>{d.label}</span>
                </button>
              ))}
            </div>
          </MSheet>
        )}
      </div>
    </div>
  );
  return body;
}

Object.assign(window, { SS_THEMES, SSPlanLayers, SSPlanThumb, SSPlanEditor });

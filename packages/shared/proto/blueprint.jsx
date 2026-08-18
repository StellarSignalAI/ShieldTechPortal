/* Blueprint / Plan Room — Bluebeam-style plan review shared by the Tech App
   and the Portal. A project carries drawings ({id, name, url}); PDFs import as
   per-sheet images. Anyone internal opens a sheet full-screen and gets:
     • zoom/pan (wheel, pinch, pan tool)
     • markup: pen, highlighter, wire runs, rectangles, ellipses, revision
       clouds, arrows, text, callouts, device icons — with select/move/edit,
       color + stroke width, eraser, undo, install check-offs
     • measurement: scale calibration, lengths, areas, counts — live labels
     • collaboration: numbered comment pins with open/resolved threads, a live
       per-sheet session chat, and presence (Supabase Realtime)
     • flattened PNG export of the sheet + markup
   Markup vectors live in the synced drawingAnnoStore; pins + chat live in the
   plan_threads / plan_messages tables. Coordinates are normalized to a
   1000-wide space so everything scales with the drawing on any screen. */

const BP_COLORS = ['#3FA9F5', '#F43F5E', '#34D399', '#FBBF24', '#FFFFFF'];
const BP_ICONS = [
  ['cam', '📷', 'Camera'], ['ap', '📡', 'AP / antenna'], ['door', '🚪', 'Door / reader'],
  ['panel', '🔔', 'Panel'], ['drop', '⌖', 'Cable drop'], ['power', '⚡', 'Power'],
];
const BP_WIDTHS = [[1, 3], [2, 5], [3, 9]];          // [key, strokePx]
const bpSW = (o) => (BP_WIDTHS.find(w => w[0] === (o.sw || 2)) || BP_WIDTHS[1])[1];

/* Mode tools always visible; draw/measure tools live in category rows. */
const BP_MODES = [
  ['pan', '🖐', 'Pan / zoom — drag to move, wheel or pinch to zoom'],
  ['select', '⬚', 'Select — tap markup to move, recolor, edit, delete'],
  ['pin', '💬', 'Comment pin — tap the plan to start a thread there'],
  ['check', '✓', 'Check off — tap markup to mark installed'],
  ['erase', '⌫', 'Eraser — tap markup to remove it'],
];
const BP_DRAW = [
  ['pen', '✏️', 'Pen'], ['hl', '🖍', 'Highlighter'], ['wire', '➰', 'Wire path — tap points, then Done'],
  ['rect', '▭', 'Rectangle'], ['ellipse', '◯', 'Ellipse'], ['cloud', '☁️', 'Revision cloud'],
  ['arrow', '➔', 'Arrow'], ['text', '🅣', 'Text note'], ['callout', '🗨', 'Callout — drag from target to note'],
  ['icon', '📍', 'Place device icon'],
];
const BP_MEASURE = [
  ['calibrate', '⚖', 'Calibrate — click two points of a known distance'],
  ['mlen', '📏', 'Measure length — tap points, then Done'],
  ['marea', '⬛', 'Measure area — tap corners, then Done'],
  ['count', '🔢', 'Count — tap each device; totals per color'],
];

function bpResolveSrc(raw) {
  const [src, setSrc] = React.useState(raw && !String(raw).includes('/object/public/') ? raw : null);
  React.useEffect(() => {
    let alive = true;
    if (!raw) { setSrc(null); return; }
    (window.__shieldFileUrl ? window.__shieldFileUrl(raw) : Promise.resolve(raw))
      .then(u => { if (alive) setSrc(u); });
    return () => { alive = false; };
  }, [raw]);
  return src;
}

/* ── geometry helpers (viewBox units) ─────────────────────────────── */
const bpDist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const bpPathLen = (pts) => pts.reduce((s, p, i) => i ? s + bpDist(pts[i - 1], p) : 0, 0);
const bpPolyArea = (pts) => Math.abs(pts.reduce((s, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return s + (p[0] * q[1] - q[0] * p[1]);
}, 0)) / 2;
const bpCentroid = (pts) => pts.reduce((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length], [0, 0]);
const bpNormRect = (o) => ({ x: Math.min(o.x, o.x + o.w), y: Math.min(o.y, o.y + o.h), w: Math.abs(o.w), h: Math.abs(o.h) });
const bpFmtFt = (ft) => {
  if (!isFinite(ft)) return '—';
  if (ft >= 100) return Math.round(ft).toLocaleString() + " ft";
  const whole = Math.floor(ft), inches = Math.round((ft - whole) * 12);
  return inches ? `${whole}'-${inches}"` : `${whole}'`;
};

/* Revision-cloud path: scalloped arcs along the rectangle perimeter. */
function bpCloudPath(o) {
  const r = bpNormRect(o);
  if (r.w < 8 || r.h < 8) return '';
  const arc = Math.max(14, Math.min(30, Math.min(r.w, r.h) / 4));
  const pts = [];
  const push = (x, y) => pts.push([x, y]);
  const nx = Math.max(1, Math.round(r.w / arc)), ny = Math.max(1, Math.round(r.h / arc));
  for (let i = 0; i < nx; i++) push(r.x + (i * r.w) / nx, r.y);
  for (let i = 0; i < ny; i++) push(r.x + r.w, r.y + (i * r.h) / ny);
  for (let i = 0; i < nx; i++) push(r.x + r.w - (i * r.w) / nx, r.y + r.h);
  for (let i = 0; i < ny; i++) push(r.x, r.y + r.h - (i * r.h) / ny);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length];
    const prev = pts[i - 1];
    const rr = Math.max(6, bpDist(prev, p) / 1.7);
    d += ` A ${rr} ${rr} 0 0 1 ${p[0]} ${p[1]}`;
  }
  return d + ' Z';
}

const bpMeasureLabel = (units, scale) =>
  scale && scale.unitsPerFt ? bpFmtFt(units / scale.unitsPerFt) : Math.round(units) + 'u';
const bpAreaLabel = (units2, scale) =>
  scale && scale.unitsPerFt ? Math.round(units2 / (scale.unitsPerFt * scale.unitsPerFt)).toLocaleString() + ' SF' : Math.round(units2) + 'u²';

function BpLabel({ x, y, text, color, size = 20 }) {
  const w = Math.max(40, String(text).length * (size * 0.58)) + 14;
  return (
    <g pointerEvents="none">
      <rect x={x - w / 2} y={y - size} width={w} height={size + 10} rx={5} fill="rgba(5,10,16,0.88)" stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + 4} fill={color} fontSize={size} fontWeight="700" textAnchor="middle" fontFamily="sans-serif">{text}</text>
    </g>
  );
}

/* Render one annotation object as SVG. Done objects fade + get a green check. */
function BpObject({ o, scale, selected }) {
  const done = o.done;
  const op = done ? 0.3 : 1;
  const sw = bpSW(o);
  const anchor = o.pts ? o.pts[0] : [o.x, o.y];
  const r = (o.type === 'rect' || o.type === 'ellipse' || o.type === 'cloud') ? bpNormRect(o) : null;
  return (
    <g opacity={op}>
      {o.type === 'pen' && <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
      {o.type === 'hl' && <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />}
      {o.type === 'wire' && (
        <g>
          <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={sw} strokeDasharray="14 8" strokeLinecap="round" strokeLinejoin="round" />
          {o.pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={sw + 2} fill={o.color} />)}
        </g>
      )}
      {o.type === 'rect' && r && <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={o.color} strokeWidth={sw} rx={2} />}
      {o.type === 'ellipse' && r && <ellipse cx={r.x + r.w / 2} cy={r.y + r.h / 2} rx={r.w / 2} ry={r.h / 2} fill="none" stroke={o.color} strokeWidth={sw} />}
      {o.type === 'cloud' && r && <path d={bpCloudPath(o)} fill="none" stroke={o.color} strokeWidth={sw} strokeLinejoin="round" />}
      {o.type === 'arrow' && o.pts && o.pts.length === 2 && (() => {
        const [a, b] = o.pts;
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const hl = 16 + sw * 2;
        const h1 = [b[0] - hl * Math.cos(ang - 0.42), b[1] - hl * Math.sin(ang - 0.42)];
        const h2 = [b[0] - hl * Math.cos(ang + 0.42), b[1] - hl * Math.sin(ang + 0.42)];
        return (
          <g>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={o.color} strokeWidth={sw} strokeLinecap="round" />
            <polygon points={`${b[0]},${b[1]} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]}`} fill={o.color} />
          </g>
        );
      })()}
      {o.type === 'callout' && o.pts && o.pts.length === 2 && (() => {
        const [tip, box] = o.pts;
        const label = o.label || 'note';
        const w = Math.max(70, label.length * 12) + 16;
        return (
          <g>
            <line x1={tip[0]} y1={tip[1]} x2={box[0]} y2={box[1]} stroke={o.color} strokeWidth={2.5} />
            <circle cx={tip[0]} cy={tip[1]} r={5} fill={o.color} />
            <rect x={box[0] - w / 2} y={box[1] - 20} width={w} height={34} rx={6} fill="rgba(5,10,16,0.88)" stroke={o.color} strokeWidth={1.6} />
            <text x={box[0]} y={box[1] + 3} fill={o.color} fontSize={20} fontWeight="600" textAnchor="middle" fontFamily="sans-serif">{label}</text>
          </g>
        );
      })()}
      {o.type === 'text' && (
        <g>
          <rect x={o.x - 6} y={o.y - 26} width={Math.max(60, (o.label || '').length * 13) + 12} height={36} rx={6} fill="rgba(5,10,16,0.85)" stroke={o.color} strokeWidth={1.5} />
          <text x={o.x} y={o.y} fill={o.color} fontSize={24} fontFamily="sans-serif" fontWeight="600">{o.label}</text>
        </g>
      )}
      {o.type === 'icon' && (
        <g>
          <circle cx={o.x} cy={o.y} r={26} fill="rgba(5,10,16,0.85)" stroke={o.color} strokeWidth={2.5} />
          <text x={o.x} y={o.y + 11} fill={o.color} fontSize={30} textAnchor="middle">{o.glyph}</text>
        </g>
      )}
      {o.type === 'count' && (
        <g>
          <circle cx={o.x} cy={o.y} r={16} fill={o.color} stroke="#0a0e14" strokeWidth={2} />
          <text x={o.x} y={o.y + 7} fill="#0a0e14" fontSize={19} fontWeight="800" textAnchor="middle" fontFamily="sans-serif">{o.n || ''}</text>
        </g>
      )}
      {o.type === 'mlen' && (
        <g>
          <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={3} strokeDasharray="4 5" strokeLinecap="round" />
          {o.pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={4.5} fill={o.color} />)}
          <BpLabel x={o.pts[o.pts.length - 1][0]} y={o.pts[o.pts.length - 1][1] - 18} text={bpMeasureLabel(bpPathLen(o.pts), scale)} color={o.color} />
        </g>
      )}
      {o.type === 'marea' && o.pts.length >= 3 && (() => {
        const c = bpCentroid(o.pts);
        return (
          <g>
            <polygon points={o.pts.map(p => p.join(',')).join(' ')} fill={o.color + '22'} stroke={o.color} strokeWidth={3} strokeDasharray="4 5" />
            <BpLabel x={c[0]} y={c[1]} text={bpAreaLabel(bpPolyArea(o.pts), scale)} color={o.color} />
          </g>
        );
      })()}
      {selected && (() => {
        const b = bpBounds(o);
        return <rect x={b.x - 10} y={b.y - 10} width={b.w + 20} height={b.h + 20} fill="none" stroke="#FBBF24" strokeWidth={2.5} strokeDasharray="8 6" pointerEvents="none" />;
      })()}
      {done && (
        <g>
          <circle cx={anchor[0]} cy={anchor[1]} r={17} fill="#34D399" opacity={0.95} />
          <text x={anchor[0]} y={anchor[1] + 8} fill="#04120b" fontSize={24} fontWeight="700" textAnchor="middle">✓</text>
        </g>
      )}
    </g>
  );
}

/* Numbered comment pin (open = amber, resolved = green). */
function BpPin({ t, active, onPick }) {
  const c = t.status === 'resolved' ? '#34D399' : '#FBBF24';
  return (
    <g onMouseDown={e => { e.stopPropagation(); onPick(t); }} onTouchStart={e => { e.stopPropagation(); onPick(t); }} style={{ cursor: 'pointer' }}>
      {active && <circle cx={t.x} cy={t.y} r={30} fill="none" stroke={c} strokeWidth={3} opacity={0.7}><animate attributeName="r" values="26;34;26" dur="1.6s" repeatCount="indefinite" /></circle>}
      <path d={`M ${t.x} ${t.y} l -16 -26 a 20 20 0 1 1 32 0 z`} fill={c} stroke="#0a0e14" strokeWidth={2.5} />
      <circle cx={t.x} cy={t.y - 30} r={13.5} fill="#0a0e14" opacity={0.25} />
      <text x={t.x} y={t.y - 23} fill="#0a0e14" fontSize={20} fontWeight="800" textAnchor="middle" fontFamily="sans-serif">{t.num}</text>
    </g>
  );
}

/* Bounding box + hit-testing across every object type. */
function bpBounds(o) {
  if (o.pts) {
    const xs = o.pts.map(p => p[0]), ys = o.pts.map(p => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if (o.w != null) return bpNormRect(o);
  return { x: (o.x || 0) - 26, y: (o.y || 0) - 26, w: 52, h: 52 };
}
function bpHit(o, x, y) {
  const near = (px, py, r) => (px - x) ** 2 + (py - y) ** 2 < r * r;
  if (o.pts) {
    return o.pts.some(p => near(p[0], p[1], 34)) ||
      o.pts.some((p, i) => i > 0 && segNear(o.pts[i - 1], p));
  }
  if (o.w != null) {
    const r = bpNormRect(o);
    const m = 22;
    const inside = x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
    if (o.type === 'marea') return inside;
    const insideFar = x > r.x + m && x < r.x + r.w - m && y > r.y + m && y < r.y + r.h - m;
    return inside && !insideFar;                      // border band for shapes
  }
  return near(o.x, o.y, 40);
  function segNear(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len2));
    return near(a[0] + t * dx, a[1] + t * dy, 26);
  }
}
function bpShift(o, dx, dy) {
  if (o.pts) return { ...o, pts: o.pts.map(p => [p[0] + dx, p[1] + dy]) };
  return { ...o, x: o.x + dx, y: o.y + dy };
}

const bpAgo = (ts) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return Math.round(s / 60) + 'm';
  if (s < 86400) return Math.round(s / 3600) + 'h';
  return Math.round(s / 86400) + 'd';
};

/* One chat bubble row (session chat and pin threads share it). */
function BpMsg({ m, mine }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{ fontSize: 9, color: 'var(--text-low)', margin: '0 4px 2px' }}>{mine ? '' : (m.sender_name || 'Teammate') + ' · '}{bpAgo(m.created_at)}</div>
      <div style={{ maxWidth: '85%', padding: '7px 11px', borderRadius: 11, fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: mine ? 'rgba(63,169,245,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${mine ? 'rgba(63,169,245,0.35)' : 'var(--border-subtle)'}`, color: 'var(--text-high)' }}>{m.body}</div>
    </div>
  );
}

function BpComposer({ placeholder, onSend, autoFocus }) {
  const [v, setV] = React.useState('');
  const go = () => { const b = v.trim(); if (!b) return; setV(''); onSend(b); };
  return (
    <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
      <input value={v} autoFocus={autoFocus} onChange={e => setV(e.target.value)} placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') go(); }}
        style={{ flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'rgba(10,14,20,0.9)', color: 'var(--text-high)', fontSize: 12.5, fontFamily: 'var(--font-body)', outline: 'none' }} />
      <button onClick={go} style={{ padding: '0 14px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>➤</button>
    </div>
  );
}

function BlueprintEditor({ drawing, readOnly = false, showAnnotations = true, projectRef = null, onClose }) {
  const [annoMap, setAnnoMap] = useShieldStore(drawingAnnoStore);
  const anno = (annoMap && annoMap[drawing.id]) || { objects: [] };
  const objects = anno.objects || [];
  const scale = anno.scale || null;                        // {unitsPerFt}
  const [tool, setTool] = React.useState('pan');
  const [cat, setCat] = React.useState('draw');            // toolbar category: draw | measure
  const [color, setColor] = React.useState(BP_COLORS[0]);
  const [width, setWidth] = React.useState(2);
  const [glyph, setGlyph] = React.useState('📷');
  const [draft, setDraft] = React.useState(null);          // in-progress object
  const [sel, setSel] = React.useState(null);              // selected object id
  const dragSel = React.useRef(null);                      // {id, lx, ly} moving selection
  const calib = React.useRef(null);                        // first calibration point
  const [ratio, setRatio] = React.useState(0.75);          // image h/w
  const svgRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const src = bpResolveSrc(drawing.url || drawing.dataUrl);
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;

  /* ── zoom / pan ─────────────────────────────────────────────── */
  const [view, setView] = React.useState({ scale: 1, tx: 0, ty: 0 });
  const gest = React.useRef(null);
  const zoomBy = (f) => setView(v => {
    const ns = Math.min(10, Math.max(1, v.scale * f));
    return ns === 1 ? { scale: 1, tx: 0, ty: 0 } : { ...v, scale: ns };
  });
  const onWheel = (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 0.87); };
  const canvasDown = (e) => {
    if (e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      gest.current = { mode: 'pinch', d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: view.scale };
      setDraft(null);
      return;
    }
    if (tool !== 'pan' && e.button !== 1) return;
    const p = e.touches ? e.touches[0] : e;
    gest.current = { mode: 'pan', x: p.clientX, y: p.clientY, tx: view.tx, ty: view.ty };
  };
  const canvasMove = (e) => {
    const g = gest.current;
    if (!g) return;
    if (g.mode === 'pinch' && e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setView(v => { const ns = Math.min(10, Math.max(1, g.scale * (d / g.d))); return ns === 1 ? { scale: 1, tx: 0, ty: 0 } : { ...v, scale: ns }; });
      return;
    }
    const p = e.touches ? e.touches[0] : e;
    setView(v => ({ ...v, tx: g.tx + (p.clientX - g.x), ty: g.ty + (p.clientY - g.y) }));
  };
  const canvasUp = () => { gest.current = null; };

  /* ── Plan Room session: pins + chat + presence ─────────────────── */
  const collab = window.__shieldPlanCollab;
  const [threads, setThreads] = React.useState([]);
  const [msgs, setMsgs] = React.useState([]);
  const [people, setPeople] = React.useState([]);
  const [panel, setPanel] = React.useState(null);           // null | 'chat' | 'pins' | 'newpin' | {threadId}
  const [pendingPin, setPendingPin] = React.useState(null);
  const [unread, setUnread] = React.useState(0);
  const panelRef = React.useRef(panel);
  panelRef.current = panel;
  const scrollRef = React.useRef(null);
  const meId = ((window.__shieldUser || {}).id) || null;

  React.useEffect(() => {
    if (!collab) return;
    let alive = true;
    collab.load(drawing.id).then(({ threads, messages }) => { if (alive) { setThreads(threads); setMsgs(messages); } });
    const offDb = collab.subscribe(drawing.id, ({ type, row }) => {
      if (type === 'message') {
        setMsgs(m => m.some(x => x.id === row.id) ? m : [...m, row]);
        if (row.sender_id !== meId && panelRef.current === null) setUnread(u => u + 1);
      } else if (type === 'thread' && row && row.id) {
        setThreads(ts => ts.some(t => t.id === row.id) ? ts.map(t => t.id === row.id ? row : t) : [...ts, row]);
      }
    });
    const offLive = collab.join(drawing.id, setPeople);
    return () => { alive = false; offDb(); offLive(); };
  }, [drawing.id]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, panel]);

  const openThread = (t) => { setPendingPin(null); setPanel({ threadId: t.id }); };
  const sessionMsgs = msgs.filter(m => !m.thread_id);
  const threadMsgs = (id) => msgs.filter(m => m.thread_id === id);
  const openCount = threads.filter(t => t.status === 'open').length;

  const dropPin = async (body) => {
    const num = threads.reduce((m, t) => Math.max(m, t.num || 0), 0) + 1;
    const r = await collab.createThread({ drawingId: drawing.id, projectRef, num, x: pendingPin.x, y: pendingPin.y, body });
    setPendingPin(null);
    if (r.ok) { setThreads(ts => ts.some(t => t.id === r.data.id) ? ts : [...ts, r.data]); setPanel({ threadId: r.data.id }); }
    else if (window.shieldToast) window.shieldToast('Could not save the pin — ' + (r.error || 'offline'), 'warn');
  };

  /* ── markup state ──────────────────────────────────────────────── */
  const save = (objs, extra) => {
    const me = (window.__shieldUser || {}).name || 'Tech';
    setAnnoMap(prev => {
      const cur = (prev && prev[drawing.id]) || {};
      return { ...(prev || {}), [drawing.id]: { ...cur, objects: objs, ...(extra || {}), updatedAt: Date.now(), by: me } };
    });
  };
  const commit = (obj) => save([...objects, { id: genId('bp'), color, sw: width, ...obj }]);
  const patchObj = (id, patch) => save(objects.map(o => o.id === id ? { ...o, ...patch } : o));
  const selObj = sel ? objects.find(o => o.id === sel) : null;

  const toVB = (ev) => {
    const r = svgRef.current.getBoundingClientRect();
    const t = ev.touches && ev.touches.length ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0]) || ev;
    const cx = t.clientX - r.left, cy = t.clientY - r.top;
    return [Math.round((cx / r.width) * 1000), Math.round((cy / r.height) * 1000 * ratio)];
  };

  const askCalibrate = () => {
    if (window.shieldToast) window.shieldToast('No scale set — use ⚖ Calibrate first for real dimensions', 'info');
  };

  const down = (ev) => {
    if (tool === 'pan' || (ev.touches && ev.touches.length > 1)) return;
    if (readOnly && !['check', 'pin', 'select'].includes(tool)) return;
    const [x, y] = toVB(ev);
    const hitObj = () => [...objects].reverse().find(o => bpHit(o, x, y));

    if (tool === 'pin') { if (collab) { setPendingPin({ x, y }); setPanel('newpin'); } return; }
    if (tool === 'select') {
      const hit = hitObj();
      if (hit) { setSel(hit.id); dragSel.current = { id: hit.id, lx: x, ly: y, moved: false }; }
      else setSel(null);
      return;
    }
    if (tool === 'check') {
      const hit = hitObj();
      if (hit) save(objects.map(o => o.id === hit.id ? { ...o, done: !o.done, doneBy: (window.__shieldUser || {}).name, doneAt: Date.now() } : o));
      return;
    }
    if (tool === 'erase') {
      const hit = hitObj();
      if (hit) save(objects.filter(o => o.id !== hit.id));
      return;
    }
    if (tool === 'calibrate') {
      if (!calib.current) { calib.current = [x, y]; if (window.shieldToast) window.shieldToast('Now click the second point', 'info'); }
      else {
        const units = bpDist(calib.current, [x, y]);
        calib.current = null;
        const ft = parseFloat(window.prompt('Real distance between the two points, in feet:') || '');
        if (ft > 0 && units > 2) {
          save(objects, { scale: { unitsPerFt: units / ft, setBy: (window.__shieldUser || {}).name, setAt: Date.now() } });
          if (window.shieldToast) window.shieldToast(`Scale set — 1 ft = ${(units / ft).toFixed(1)} units. Measurements are live.`, 'ok');
        }
      }
      return;
    }
    if (tool === 'pen' || tool === 'hl') { setDraft({ type: tool, pts: [[x, y]] }); return; }
    if (tool === 'wire' || tool === 'mlen' || tool === 'marea') {
      if ((tool === 'mlen' || tool === 'marea') && !scale) askCalibrate();
      setDraft(d => d && d.type === tool ? { ...d, pts: [...d.pts, [x, y]] } : { type: tool, pts: [[x, y]] });
      return;
    }
    if (tool === 'rect' || tool === 'ellipse' || tool === 'cloud') { setDraft({ type: tool, x, y, w: 0, h: 0 }); return; }
    if (tool === 'arrow' || tool === 'callout') { setDraft({ type: tool, pts: [[x, y], [x, y]] }); return; }
    if (tool === 'icon') { commit({ type: 'icon', x, y, glyph }); return; }
    if (tool === 'count') {
      const n = objects.filter(o => o.type === 'count' && o.color === color).length + 1;
      commit({ type: 'count', x, y, n });
      return;
    }
    if (tool === 'text') {
      const label = window.prompt('Note text:');
      if (label && label.trim()) commit({ type: 'text', x, y, label: label.trim().slice(0, 60) });
    }
  };
  const move = (ev) => {
    if (ev.touches && ev.touches.length > 1) return;
    if (dragSel.current) {
      const [x, y] = toVB(ev);
      const d = dragSel.current;
      const dx = x - d.lx, dy = y - d.ly;
      if (dx || dy) {
        d.moved = true;
        d.lx = x; d.ly = y;
        save(objects.map(o => o.id === d.id ? bpShift(o, dx, dy) : o));
      }
      return;
    }
    if (!draft) return;
    const [x, y] = toVB(ev);
    if (draft.type === 'pen' || draft.type === 'hl') setDraft(d => ({ ...d, pts: [...d.pts, [x, y]] }));
    else if (draft.type === 'rect' || draft.type === 'ellipse' || draft.type === 'cloud') setDraft(d => ({ ...d, w: x - d.x, h: y - d.y }));
    else if (draft.type === 'arrow' || draft.type === 'callout') setDraft(d => ({ ...d, pts: [d.pts[0], [x, y]] }));
  };
  const up = () => {
    if (dragSel.current) { dragSel.current = null; return; }
    if (!draft) return;
    if (draft.type === 'pen' || draft.type === 'hl') { if (draft.pts.length > 1) commit(draft); setDraft(null); }
    else if (draft.type === 'rect' || draft.type === 'ellipse' || draft.type === 'cloud') {
      if (Math.abs(draft.w) > 8 && Math.abs(draft.h) > 8) commit(draft);
      setDraft(null);
    } else if (draft.type === 'arrow') {
      if (bpDist(draft.pts[0], draft.pts[1]) > 12) commit(draft);
      setDraft(null);
    } else if (draft.type === 'callout') {
      if (bpDist(draft.pts[0], draft.pts[1]) > 12) {
        const label = window.prompt('Callout text:');
        if (label && label.trim()) commit({ ...draft, label: label.trim().slice(0, 40) });
      }
      setDraft(null);
    }
    /* wire/mlen/marea accumulate points until Finish */
  };
  const finishPath = () => {
    if (draft && draft.pts && draft.pts.length > (draft.type === 'marea' ? 2 : 1)) commit(draft);
    setDraft(null);
  };
  const undo = () => { if (objects.length) { setSel(null); save(objects.slice(0, -1)); } };

  /* Flattened PNG export — base image + markup burned in. */
  const exportPng = async () => {
    try {
      const img = imgRef.current;
      if (!img || !img.naturalWidth) throw new Error('Sheet not loaded yet');
      const W = img.naturalWidth, H = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const svgEl = svgRef.current.cloneNode(true);
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgEl.setAttribute('width', W); svgEl.setAttribute('height', H);
      const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      await new Promise((res, rej) => {
        const s = new Image();
        s.onload = () => { ctx.drawImage(s, 0, 0, W, H); res(); };
        s.onerror = rej;
        s.src = url;
      });
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = (drawing.name || 'sheet').replace(/\.[a-z]+$/i, '') + ' — marked.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      if (window.shieldToast) window.shieldToast('Flattened sheet exported', 'ok');
    } catch (e) {
      if (window.shieldToast) window.shieldToast('Export failed: ' + (e.message || 'image blocked'), 'warn');
    }
  };

  const doneCount = objects.filter(o => o.done).length;
  const countTotals = BP_COLORS.map(c => [c, objects.filter(o => o.type === 'count' && o.color === c).length]).filter(x => x[1] > 0);
  const btn = (on) => ({ width: 40, height: 40, borderRadius: 9, border: `1px solid ${on ? 'var(--brand)' : 'var(--border-subtle)'}`, background: on ? 'rgba(63,169,245,0.16)' : 'rgba(10,14,20,0.9)', color: on ? 'var(--brand)' : 'var(--text-mid)', fontSize: 17, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' });

  const activeThread = panel && panel.threadId ? threads.find(t => t.id === panel.threadId) : null;
  const panelOpen = panel !== null;
  const pathDraft = draft && (draft.type === 'wire' || draft.type === 'mlen' || draft.type === 'marea');

  const renderPanel = () => (
    <div style={isNarrow
      ? { position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', zIndex: 30, display: 'flex', flexDirection: 'column', background: 'rgba(7,10,16,0.98)', borderTop: '1px solid var(--border-strong)', borderRadius: '14px 14px 0 0', boxShadow: '0 -12px 40px rgba(0,0,0,0.5)' }
      : { width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', background: 'rgba(7,10,16,0.98)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {activeThread || panel === 'newpin' ? (
          <>
            <button onClick={() => { setPendingPin(null); setPanel('pins'); }} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '2px 4px' }}>‹ Pins</button>
            {activeThread ? (
              <>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: activeThread.status === 'resolved' ? '#34D399' : '#FBBF24', color: '#0a0e14', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{activeThread.num}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeThread.created_name || 'Pin'} · {activeThread.status === 'resolved' ? 'resolved' : 'open'}
                </div>
                <button onClick={async () => { const ns = activeThread.status === 'resolved' ? 'open' : 'resolved'; const r = await collab.setStatus(activeThread.id, ns); if (r.ok) setThreads(ts => ts.map(t => t.id === activeThread.id ? { ...t, status: ns } : t)); }}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border-strong)', background: activeThread.status === 'resolved' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.12)', color: activeThread.status === 'resolved' ? '#FBBF24' : '#34D399', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {activeThread.status === 'resolved' ? 'Reopen' : '✓ Resolve'}
                </button>
              </>
            ) : <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#FBBF24' }}>New pin — describe the issue</div>}
          </>
        ) : (
          <>
            {[['chat', `Chat${sessionMsgs.length ? ` (${sessionMsgs.length})` : ''}`], ['pins', `Pins${threads.length ? ` (${openCount}/${threads.length})` : ''}`]].map(([id, label]) => (
              <button key={id} onClick={() => setPanel(id)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid ' + (panel === id ? 'var(--brand)' : 'transparent'), background: panel === id ? 'rgba(63,169,245,0.12)' : 'transparent', color: panel === id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{label}</button>
            ))}
          </>
        )}
        <button onClick={() => { setPendingPin(null); setPanel(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>✕</button>
      </div>

      {people.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, overflowX: 'auto' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>In session:</span>
          {people.map(p => <span key={p.id} style={{ fontSize: 10.5, color: 'var(--text-mid)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{p.name}</span>)}
        </div>
      )}

      {panel === 'newpin' ? (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', lineHeight: 1.6 }}>
            Pin placed. Type the first comment to anchor the thread — or ✕ to cancel.
          </div>
          <BpComposer placeholder="What's the issue here?" autoFocus onSend={dropPin} />
        </>
      ) : activeThread ? (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {threadMsgs(activeThread.id).length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center', marginTop: 20 }}>No comments yet.</div>}
            {threadMsgs(activeThread.id).map(m => <BpMsg key={m.id} m={m} mine={m.sender_id === meId} />)}
          </div>
          <BpComposer placeholder={`Reply on pin ${activeThread.num}…`} onSend={b => collab.send(drawing.id, activeThread.id, b)} />
        </>
      ) : panel === 'pins' ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {threads.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center', marginTop: 28, padding: '0 20px', lineHeight: 1.6 }}>No pins yet. Pick the 💬 tool and tap the plan to start a located thread.</div>}
          {[...threads].sort((a, b) => (a.status === b.status ? a.num - b.num : a.status === 'open' ? -1 : 1)).map(t => {
            const tm = threadMsgs(t.id);
            const last = tm[tm.length - 1];
            return (
              <div key={t.id} onClick={() => openThread(t)} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.06)', cursor: 'pointer' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: t.status === 'resolved' ? '#34D399' : '#FBBF24', color: '#0a0e14', fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{t.num}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {last ? last.body : (t.title || 'Pin ' + t.num)}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-low)', marginTop: 2 }}>
                    {t.status === 'resolved' ? '✓ resolved' : (t.created_name || '')} · {tm.length} comment{tm.length === 1 ? '' : 's'} · {bpAgo(last ? last.created_at : t.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessionMsgs.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center', marginTop: 28, padding: '0 16px', lineHeight: 1.6 }}>Session chat for this sheet — everyone who has it open sees messages instantly.</div>}
            {sessionMsgs.map(m => <BpMsg key={m.id} m={m} mine={m.sender_id === meId} />)}
          </div>
          <BpComposer placeholder="Message the session…" onSend={b => collab.send(drawing.id, null, b)} />
        </>
      )}
    </div>
  );

  return (
    <div data-no-ptr style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#04070c', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>← Done</button>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drawing.name || 'Drawing'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>
            {objects.length} markup{objects.length === 1 ? '' : 's'} · {doneCount} checked
            {scale ? ` · ⚖ 1'=${scale.unitsPerFt.toFixed(1)}u` : ''}
            {openCount ? ` · ${openCount} open pin${openCount === 1 ? '' : 's'}` : ''}
            {people.length > 1 ? ` · 🟢 ${people.length} in session` : ''}
          </div>
        </div>
        <button title="Zoom in" onClick={() => zoomBy(1.25)} style={{ ...btn(false), width: 34, height: 34, fontSize: 15 }}>＋</button>
        <button title="Zoom out" onClick={() => zoomBy(0.8)} style={{ ...btn(false), width: 34, height: 34, fontSize: 15 }}>－</button>
        <button onClick={() => setView({ scale: 1, tx: 0, ty: 0 })} style={{ ...btn(false), width: 'auto', height: 34, padding: '0 10px', fontSize: 11 }}>Fit</button>
        <button title="Export flattened PNG" onClick={exportPng} style={{ ...btn(false), width: 'auto', height: 34, padding: '0 10px', fontSize: 12 }}>⤓</button>
        {collab && (
          <button onClick={() => { setUnread(0); setPanel(panelOpen ? null : 'chat'); }} style={{ ...btn(panelOpen), width: 'auto', height: 34, padding: '0 12px', fontSize: 12, position: 'relative' }}>
            💬 Chat
            {unread > 0 && !panelOpen && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 999, background: '#F43F5E', color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread}</span>}
          </button>
        )}
        {!readOnly && <button onClick={undo} disabled={!objects.length} style={{ ...btn(false), width: 'auto', height: 34, padding: '0 12px', fontSize: 12, opacity: objects.length ? 1 : 0.4 }}>↩</button>}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <div
            onWheel={onWheel}
            onMouseDown={canvasDown} onMouseMove={canvasMove} onMouseUp={canvasUp} onMouseLeave={canvasUp}
            onTouchStart={canvasDown} onTouchMove={canvasMove} onTouchEnd={canvasUp}
            style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: tool === 'pan' ? (gest.current ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: view.scale === 1 ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 8 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 1100, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: 'center top' }}>
                {src
                  ? <img ref={imgRef} src={src} crossOrigin="anonymous" alt={drawing.name || 'blueprint'} onLoad={e => setRatio(e.target.naturalHeight / Math.max(1, e.target.naturalWidth))} style={{ width: '100%', display: 'block', borderRadius: 6, background: '#fff' }} />
                  : <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>Loading drawing…</div>}
                {showAnnotations && (
                  <svg ref={svgRef} viewBox={`0 0 1000 ${Math.round(1000 * ratio)}`}
                    onMouseDown={down} onMouseMove={move} onMouseUp={up}
                    onTouchStart={down} onTouchMove={move} onTouchEnd={up}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'pan' ? 'inherit' : tool === 'pin' ? 'copy' : tool === 'select' ? 'pointer' : 'crosshair', pointerEvents: tool === 'pan' ? 'none' : 'auto' }}>
                    {objects.map(o => <BpObject key={o.id} o={o} scale={scale} selected={sel === o.id && tool === 'select'} />)}
                    {draft && <BpObject o={{ ...draft, color, sw: width, id: '_draft' }} scale={scale} />}
                    {threads.map(t => <BpPin key={t.id} t={t} active={activeThread && activeThread.id === t.id} onPick={openThread} />)}
                    {pendingPin && <BpPin t={{ ...pendingPin, num: threads.reduce((m, t) => Math.max(m, t.num || 0), 0) + 1, status: 'open' }} active onPick={() => {}} />}
                  </svg>
                )}
                {showAnnotations && tool === 'pan' && threads.length > 0 && (
                  <svg viewBox={`0 0 1000 ${Math.round(1000 * ratio)}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {threads.map(t => <g key={t.id} style={{ pointerEvents: 'auto' }}><BpPin t={t} active={activeThread && activeThread.id === t.id} onPick={openThread} /></g>)}
                  </svg>
                )}
              </div>
            </div>

            {/* Path-in-progress finish bar (wire, length, area) */}
            {pathDraft && (
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
                <button onClick={finishPath} style={{ pointerEvents: 'auto', padding: '9px 20px', borderRadius: 20, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  ✓ Finish {draft.type === 'wire' ? 'wire' : draft.type === 'mlen' ? 'measurement' : 'area'} ({draft.pts.length} pts{draft.type !== 'wire' && draft.pts.length > 1 ? ` · ${draft.type === 'marea' && draft.pts.length > 2 ? bpAreaLabel(bpPolyArea(draft.pts), scale) : bpMeasureLabel(bpPathLen(draft.pts), scale)}` : ''})
                </button>
                <button onClick={() => setDraft(null)} style={{ pointerEvents: 'auto', padding: '9px 16px', borderRadius: 20, border: '1px solid var(--border-strong)', background: 'rgba(10,14,20,0.9)', color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              </div>
            )}

            {/* Selection action bar */}
            {selObj && tool === 'select' && (
              <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 12, background: 'rgba(8,11,18,0.95)', border: '1px solid var(--border-strong)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-low)', marginRight: 2 }}>{selObj.type}</span>
                {BP_COLORS.map(c => (
                  <button key={c} onClick={() => patchObj(selObj.id, { color: c })} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: selObj.color === c ? '2.5px solid #fff' : '1px solid var(--border-subtle)', cursor: 'pointer', padding: 0 }} />
                ))}
                {(selObj.label != null) && (
                  <button onClick={() => { const v = window.prompt('Edit text:', selObj.label); if (v != null && v.trim()) patchObj(selObj.id, { label: v.trim().slice(0, 60) }); }}
                    style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit text</button>
                )}
                <button onClick={() => { save(objects.filter(o => o.id !== selObj.id)); setSel(null); }}
                  style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(244,63,94,0.5)', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete</button>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer', padding: '0 2px' }}>✕</button>
              </div>
            )}

            {/* Count totals chip */}
            {countTotals.length > 0 && (
              <div style={{ position: 'absolute', bottom: 16, right: 12, display: 'flex', gap: 6, padding: '6px 10px', borderRadius: 10, background: 'rgba(8,11,18,0.92)', border: '1px solid var(--border-subtle)', pointerEvents: 'none' }}>
                {countTotals.map(([c, n]) => (
                  <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />{n}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Toolbars */}
          {!readOnly ? (
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'rgba(6,9,14,0.98)', padding: '8px 10px calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {/* Modes + category switch */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center' }}>
                {BP_MODES.map(([id, g, tip]) => (
                  <button key={id} title={tip} onClick={() => { setTool(id); setDraft(null); if (id !== 'select') setSel(null); }} style={btn(tool === id)}>{g}</button>
                ))}
                <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 2px', flexShrink: 0, alignSelf: 'stretch' }} />
                {[['draw', 'Draw'], ['measure', 'Measure']].map(([id, label]) => (
                  <button key={id} onClick={() => setCat(id)} style={{ ...btn(cat === id), width: 'auto', padding: '0 13px', fontSize: 11.5, fontWeight: 700 }}>{label}</button>
                ))}
              </div>
              {/* Category tools + colors + widths */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center' }}>
                {(cat === 'draw' ? BP_DRAW : BP_MEASURE).map(([id, g, tip]) => (
                  <button key={id} title={tip} onClick={() => { setTool(id); setDraft(null); setSel(null); calib.current = null; }} style={btn(tool === id)}>{g}</button>
                ))}
                <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 2px', flexShrink: 0, alignSelf: 'stretch' }} />
                {BP_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ ...btn(color === c), background: c, border: color === c ? '3px solid #fff' : '1px solid var(--border-subtle)' }} />
                ))}
                <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 2px', flexShrink: 0, alignSelf: 'stretch' }} />
                {BP_WIDTHS.map(([k, px]) => (
                  <button key={k} title={`Stroke ${px}px`} onClick={() => setWidth(k)} style={{ ...btn(width === k), display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 18, height: px, borderRadius: 99, background: width === k ? 'var(--brand)' : 'var(--text-mid)' }} />
                  </button>
                ))}
              </div>
              {tool === 'icon' && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {BP_ICONS.map(([id, g, label]) => (
                    <button key={id} title={label} onClick={() => setGlyph(g)} style={{ ...btn(glyph === g), width: 'auto', padding: '0 10px', fontSize: 15 }}>{g} <span style={{ fontSize: 9 }}>{label}</span></button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center' }}>
                {tool === 'pan' ? 'Drag to pan · wheel / pinch to zoom · tap a pin to open its thread' :
                 tool === 'select' ? 'Tap markup to select — drag to move, recolor, edit text, delete' :
                 tool === 'pin' ? 'Tap the plan where the comment belongs — a numbered pin starts the thread' :
                 tool === 'check' ? 'Tap any markup to check it off as installed (tap again to undo)' :
                 tool === 'erase' ? 'Tap markup to remove it' :
                 tool === 'calibrate' ? (calib.current ? 'Click the SECOND point of the known distance' : 'Click the FIRST point of a known distance (a door, a grid bay…)') :
                 tool === 'mlen' ? 'Tap along the run, then Finish — live length' + (scale ? '' : ' (calibrate first for feet)') :
                 tool === 'marea' ? 'Tap the corners, then Finish — square footage' + (scale ? '' : ' (calibrate first)') :
                 tool === 'count' ? 'Tap each device to count it — totals bottom-right, one color per type' :
                 tool === 'wire' ? 'Tap each turn of the wire run, then Finish' :
                 tool === 'text' ? 'Tap where the note goes' :
                 tool === 'callout' ? 'Press on the target, drag to where the note should sit, release' :
                 tool === 'icon' ? 'Pick a device below, then tap its location' :
                 ['rect', 'ellipse', 'cloud'].includes(tool) ? 'Press and drag to draw' + (tool === 'cloud' ? ' the revision cloud' : '') :
                 tool === 'arrow' ? 'Press at the tail, drag to the head, release' : 'Draw directly on the plan'}
              </div>
            </div>
          ) : (
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'rgba(6,9,14,0.98)', padding: '8px 10px calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Clean sheet — original drawing, no markup</span>
            </div>
          )}
        </div>

        {panelOpen && collab && renderPanel()}
      </div>
    </div>
  );
}

/* ── shared attach helper — image OR multi-page PDF onto a project ── */
async function planAttachFile(projectNumber, file, onStatus) {
  const st = window.__shieldStorage;
  if (!file || !projectNumber) return;
  if (!st) { shieldToast('Storage not configured', 'warn'); return; }
  const status = (s) => { try { onStatus && onStatus(s); } catch {} };
  const addSheet = (name, r) => updateProject(projectNumber, prev => ({
    drawings: [...(prev.drawings || []), { id: genId('dwg'), name, url: r.url, path: r.path, bucket: r.bucket }],
  }));
  try {
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '')) {
      const pdf = window.__shieldPlanPdf;
      if (!pdf) { shieldToast('PDF import module not loaded', 'warn'); return; }
      status('Rendering PDF…');
      const res = await pdf.importPdf(file, (done, total) => status(`Rendering sheet ${done}/${total}…`));
      if (!res.ok) { shieldToast('PDF import failed: ' + res.error, 'warn'); return; }
      for (let i = 0; i < res.pages.length; i++) {
        const p = res.pages[i];
        status(`Uploading sheet ${i + 1}/${res.pages.length}…`);
        const r = await st.uploadFile(p.blob, { name: p.name + '.jpg', mime: 'image/jpeg', folder: 'blueprints', entity: 'project', entityId: projectNumber, shared: true });
        if (r && r.ok) addSheet(p.name, r);
      }
      shieldToast(`${res.pages.length} sheet${res.pages.length === 1 ? '' : 's'} added${res.truncated ? ` (first ${res.pages.length} of ${res.numPages} pages)` : ''}`, 'ok');
    } else {
      status('Uploading…');
      const r = await st.uploadFile(file, { folder: 'blueprints', entity: 'project', entityId: projectNumber, shared: true });
      if (!r || !r.ok) { shieldToast('Upload failed: ' + ((r && r.error) || 'unknown'), 'warn'); return; }
      addSheet(file.name, r);
      shieldToast(`${file.name} attached`, 'ok');
    }
  } finally { status(null); }
}

/* Compact drawing row list — shared by tech job detail + portal project. */
function BlueprintRows({ drawings, onOpen, extra }) {
  const [annoMap] = useShieldStore(drawingAnnoStore);
  const [pinMap, setPinMap] = React.useState({});
  React.useEffect(() => {
    const ids = (drawings || []).map(d => d.id);
    if (ids.length && window.__shieldPlanCollab) window.__shieldPlanCollab.counts(ids).then(setPinMap);
  }, [(drawings || []).map(d => d.id).join(',')]);
  return (drawings || []).map(d => {
    const a = (annoMap && annoMap[d.id]) || { objects: [] };
    const done = (a.objects || []).filter(o => o.done).length;
    const pins = pinMap[d.id];
    return (
      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
        <span style={{ fontSize: 17 }}>📐</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name || 'Drawing'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>
            {(a.objects || []).length} markups · {done} checked off{a.by ? ` · ${a.by}` : ''}
            {pins && pins.total > 0 && <span style={{ color: pins.open ? '#FBBF24' : '#34D399' }}> · 💬 {pins.open ? `${pins.open} open` : 'all resolved'}</span>}
          </div>
        </div>
        <button onClick={() => onOpen(d)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Open</button>
        {extra ? extra(d) : null}
      </div>
    );
  });
}

/* ── Plan Room screen — the portal's home for every sheet across projects ── */
function PlanRoomScreen() {
  const [projects] = useShieldStore(projectStore);
  const [pinMap, setPinMap] = React.useState({});
  const [viewer, setViewer] = React.useState(null);        // {drawing, projectRef, markup}
  const [uploadTo, setUploadTo] = React.useState(null);
  const [busy, setBusy] = React.useState(null);            // status text while attaching
  const fileRef = React.useRef(null);

  const withDrawings = (projects || []).filter(p => (p.drawings || []).length > 0);
  const allIds = withDrawings.flatMap(p => p.drawings.map(d => d.id));

  React.useEffect(() => {
    if (allIds.length && window.__shieldPlanCollab) window.__shieldPlanCollab.counts(allIds).then(setPinMap);
  }, [allIds.join(',')]);

  const totalOpen = Object.values(pinMap).reduce((s, c) => s + (c.open || 0), 0);
  const pick = (num) => { setUploadTo(num); fileRef.current && fileRef.current.click(); };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <div style={{ font: '700 20px/1.2 var(--font-display)', color: 'var(--text-high)' }}>Plan Room</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>
          {allIds.length} sheet{allIds.length === 1 ? '' : 's'} across {withDrawings.length} project{withDrawings.length === 1 ? '' : 's'}
          {totalOpen > 0 && <span style={{ color: '#FBBF24' }}> · {totalOpen} open pin{totalOpen === 1 ? '' : 's'}</span>}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginBottom: 18, lineHeight: 1.5 }}>
        Live plan review — upload plan sets (PDF or image; PDFs split into sheets), zoom/pan, mark up with clouds/arrows/shapes, measure lengths and areas to scale, drop numbered comment pins, and chat live with everyone in the sheet. Techs see the same session in the field app.
      </div>
      {busy && <div className="glass" style={{ padding: '10px 16px', marginBottom: 12, fontSize: 12, color: 'var(--brand)' }}>⏳ {busy}</div>}

      {withDrawings.length === 0 && (
        <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>📐</div>
          <div style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 6 }}>No plans uploaded yet</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-low)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
            Attach a plan set to any project below — a multi-page PDF becomes one sheet per page, each with its own markup, pins, and chat.
          </div>
        </div>
      )}

      {withDrawings.map(p => (
        <div key={p.number} className="glass" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.number}{p.customer ? ` · ${p.customer}` : ''}</div>
            </div>
            <button onClick={() => pick(p.number)} disabled={!!busy}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              + Add sheets
            </button>
          </div>
          <BlueprintRows drawings={p.drawings} onOpen={d => setViewer({ drawing: d, projectRef: p.number, markup: true })} extra={d => (
            <button onClick={() => setViewer({ drawing: d, projectRef: p.number, markup: false })}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Original</button>
          )} />
        </div>
      ))}

      {(projects || []).filter(p => !(p.drawings || []).length).length > 0 && (
        <div className="glass" style={{ padding: 16 }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>PROJECTS WITHOUT PLANS</div>
          {(projects || []).filter(p => !(p.drawings || []).length).map(p => (
            <div key={p.number} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--text-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name} <span style={{ color: 'var(--text-low)', fontSize: 10 }}>{p.number}</span></div>
              <button onClick={() => pick(p.number)} disabled={!!busy}
                style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--brand)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Upload plans</button>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) planAttachFile(uploadTo, f, setBusy); }} />

      {viewer && <BlueprintEditor drawing={viewer.drawing} projectRef={viewer.projectRef} readOnly={!viewer.markup} showAnnotations={viewer.markup} onClose={() => setViewer(null)} />}
    </div>
  );
}

Object.assign(window, { BlueprintEditor, BlueprintRows, PlanRoomScreen, planAttachFile, BP_ICONS });

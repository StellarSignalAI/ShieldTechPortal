/* Blueprint / drawing markup — shared by the Tech App and the Portal.
   A project carries drawings ({id, name, url}); techs open the digital
   drawing full-screen and mark it up: pen, highlighter, wire paths, device
   icons, text notes — and CHECK ITEMS OFF as they install. Annotations are
   vector objects in the shared drawingAnnoStore (synced), stored separately
   from the image, so the office always sees BOTH the original and the tech's
   live markup. Coordinates are normalized to a 1000-wide space so markup
   scales with the drawing on any screen. */

const BP_COLORS = ['#3FA9F5', '#F43F5E', '#34D399', '#FBBF24', '#FFFFFF'];
const BP_ICONS = [
  ['cam', '📷', 'Camera'], ['ap', '📡', 'AP / antenna'], ['door', '🚪', 'Door / reader'],
  ['panel', '🔔', 'Panel'], ['drop', '⌖', 'Cable drop'], ['power', '⚡', 'Power'],
];
const BP_TOOLS = [
  ['check', '✓', 'Check off — tap markup to mark installed'],
  ['pen', '✏️', 'Pen'], ['hl', '🖍', 'Highlighter'], ['wire', '➰', 'Wire path — tap points, then Done'],
  ['text', '🅣', 'Text note'], ['icon', '📍', 'Place device icon'], ['erase', '⌫', 'Eraser — tap markup to remove'],
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

/* Render one annotation object as SVG. Done objects fade + get a green check. */
function BpObject({ o, dim }) {
  const done = o.done;
  const op = done ? 0.3 : 1;
  const anchor = o.pts ? o.pts[0] : [o.x, o.y];
  return (
    <g opacity={op}>
      {o.type === 'pen' && <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
      {o.type === 'hl' && <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />}
      {o.type === 'wire' && (
        <g>
          <polyline points={o.pts.map(p => p.join(',')).join(' ')} fill="none" stroke={o.color} strokeWidth={5} strokeDasharray="14 8" strokeLinecap="round" strokeLinejoin="round" />
          {o.pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={7} fill={o.color} />)}
        </g>
      )}
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
      {done && (
        <g>
          <circle cx={anchor[0]} cy={anchor[1]} r={17} fill="#34D399" opacity={0.95} />
          <text x={anchor[0]} y={anchor[1] + 8} fill="#04120b" fontSize={24} fontWeight="700" textAnchor="middle">✓</text>
        </g>
      )}
    </g>
  );
}

/* Distance from a point to an object, in viewBox units (hit-testing). */
function bpHit(o, x, y) {
  const near = (px, py, r) => (px - x) ** 2 + (py - y) ** 2 < r * r;
  if (o.pts) return o.pts.some(p => near(p[0], p[1], 34)) ||
    o.pts.some((p, i) => i > 0 && segNear(o.pts[i - 1], p));
  return near(o.x, o.y, 40);
  function segNear(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len2));
    return near(a[0] + t * dx, a[1] + t * dy, 26);
  }
}

function BlueprintEditor({ drawing, readOnly = false, showAnnotations = true, onClose }) {
  const [annoMap, setAnnoMap] = useShieldStore(drawingAnnoStore);
  const anno = (annoMap && annoMap[drawing.id]) || { objects: [] };
  const objects = anno.objects || [];
  const [tool, setTool] = React.useState(readOnly ? 'check' : 'pen');
  const [color, setColor] = React.useState(BP_COLORS[0]);
  const [glyph, setGlyph] = React.useState('📷');
  const [draft, setDraft] = React.useState(null);          // in-progress pen/hl stroke or wire pts
  const [ratio, setRatio] = React.useState(0.75);          // image h/w
  const svgRef = React.useRef(null);
  const src = bpResolveSrc(drawing.url || drawing.dataUrl);

  const save = (objs) => {
    const me = (window.__shieldUser || {}).name || 'Tech';
    setAnnoMap(prev => ({ ...(prev || {}), [drawing.id]: { objects: objs, updatedAt: Date.now(), by: me } }));
  };
  const commit = (obj) => save([...objects, { id: genId('bp'), color, ...obj }]);

  const toVB = (ev) => {
    const r = svgRef.current.getBoundingClientRect();
    const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
    return [Math.round((cx / r.width) * 1000), Math.round((cy / r.height) * 1000 * ratio)];
  };

  const down = (ev) => {
    if (readOnly && tool !== 'check') return;
    const [x, y] = toVB(ev);
    if (tool === 'pen' || tool === 'hl') setDraft({ type: tool, pts: [[x, y]] });
    else if (tool === 'wire') setDraft(d => d && d.type === 'wire' ? { ...d, pts: [...d.pts, [x, y]] } : { type: 'wire', pts: [[x, y]] });
    else if (tool === 'icon') commit({ type: 'icon', x, y, glyph });
    else if (tool === 'text') {
      const label = window.prompt('Note text:');
      if (label && label.trim()) commit({ type: 'text', x, y, label: label.trim().slice(0, 60) });
    } else if (tool === 'erase') {
      const hit = [...objects].reverse().find(o => bpHit(o, x, y));
      if (hit) save(objects.filter(o => o.id !== hit.id));
    } else if (tool === 'check') {
      const hit = [...objects].reverse().find(o => bpHit(o, x, y));
      if (hit) { save(objects.map(o => o.id === hit.id ? { ...o, done: !o.done, doneBy: (window.__shieldUser || {}).name, doneAt: Date.now() } : o)); }
    }
  };
  const move = (ev) => {
    if (!draft || draft.type === 'wire') return;
    const [x, y] = toVB(ev);
    setDraft(d => ({ ...d, pts: [...d.pts, [x, y]] }));
  };
  const up = () => {
    if (draft && draft.type !== 'wire') {
      if (draft.pts.length > 1) commit(draft);
      setDraft(null);
    }
  };
  const finishWire = () => { if (draft && draft.type === 'wire' && draft.pts.length > 1) commit(draft); setDraft(null); };
  const undo = () => { if (objects.length) save(objects.slice(0, -1)); };

  const doneCount = objects.filter(o => o.done).length;
  const btn = (on) => ({ width: 40, height: 40, borderRadius: 9, border: `1px solid ${on ? 'var(--brand)' : 'var(--border-subtle)'}`, background: on ? 'rgba(63,169,245,0.16)' : 'rgba(10,14,20,0.9)', color: on ? 'var(--brand)' : 'var(--text-mid)', fontSize: 17, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#04070c', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>← Done</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drawing.name || 'Drawing'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{objects.length} markup{objects.length === 1 ? '' : 's'} · {doneCount} checked off{anno.by ? ` · last by ${anno.by}` : ''}</div>
        </div>
        {!readOnly && <button onClick={undo} disabled={!objects.length} style={{ ...btn(false), width: 'auto', padding: '0 12px', fontSize: 12, opacity: objects.length ? 1 : 0.4 }}>↩ Undo</button>}
      </div>

      {/* Drawing + markup */}
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 8 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 1100 }}>
          {src
            ? <img src={src} alt={drawing.name || 'blueprint'} onLoad={e => setRatio(e.target.naturalHeight / Math.max(1, e.target.naturalWidth))} style={{ width: '100%', display: 'block', borderRadius: 6, background: '#fff' }} />
            : <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>Loading drawing…</div>}
          {showAnnotations && (
            <svg ref={svgRef} viewBox={`0 0 1000 ${Math.round(1000 * ratio)}`}
              onMouseDown={down} onMouseMove={move} onMouseUp={up}
              onTouchStart={down} onTouchMove={move} onTouchEnd={up}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: readOnly && tool === 'check' ? 'auto' : 'none', cursor: readOnly ? 'default' : 'crosshair' }}>
              {objects.map(o => <BpObject key={o.id} o={o} />)}
              {draft && <BpObject o={{ ...draft, color, id: '_draft' }} />}
            </svg>
          )}
        </div>
      </div>

      {/* Wire finish bar */}
      {draft && draft.type === 'wire' && (
        <div style={{ position: 'absolute', bottom: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
          <button onClick={finishWire} style={{ pointerEvents: 'auto', padding: '9px 20px', borderRadius: 20, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Finish wire ({draft.pts.length} pts)</button>
          <button onClick={() => setDraft(null)} style={{ pointerEvents: 'auto', padding: '9px 16px', borderRadius: 20, border: '1px solid var(--border-strong)', background: 'rgba(10,14,20,0.9)', color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
        </div>
      )}

      {/* Toolbars */}
      {!readOnly && (
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'rgba(6,9,14,0.98)', padding: '8px 10px calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {BP_TOOLS.map(([id, g, tip]) => (
              <button key={id} title={tip} onClick={() => { setTool(id); if (id !== 'wire') setDraft(null); }} style={btn(tool === id)}>{g}</button>
            ))}
            <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 2px', flexShrink: 0 }} />
            {BP_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ ...btn(color === c), background: c, border: color === c ? '3px solid #fff' : '1px solid var(--border-subtle)' }} />
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
            {tool === 'check' ? 'Tap any markup to check it off as installed (tap again to undo)' :
             tool === 'wire' ? 'Tap each turn of the wire run, then Finish' :
             tool === 'erase' ? 'Tap markup to remove it' :
             tool === 'text' ? 'Tap where the note goes' :
             tool === 'icon' ? 'Pick a device below, then tap its location' : 'Draw directly on the plan'}
          </div>
        </div>
      )}
    </div>
  );
}

/* Compact drawing row list — shared by tech job detail + portal project. */
function BlueprintRows({ drawings, onOpen, extra }) {
  const [annoMap] = useShieldStore(drawingAnnoStore);
  return (drawings || []).map(d => {
    const a = (annoMap && annoMap[d.id]) || { objects: [] };
    const done = (a.objects || []).filter(o => o.done).length;
    return (
      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
        <span style={{ fontSize: 17 }}>📐</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name || 'Drawing'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{(a.objects || []).length} markups · {done} checked off{a.by ? ` · ${a.by}` : ''}</div>
        </div>
        <button onClick={() => onOpen(d)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Open</button>
        {extra ? extra(d) : null}
      </div>
    );
  });
}

Object.assign(window, { BlueprintEditor, BlueprintRows, BP_ICONS });

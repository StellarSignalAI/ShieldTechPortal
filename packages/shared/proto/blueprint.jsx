/* Blueprint / drawing markup + Plan Room collaboration — shared by the Tech
   App and the Portal. A project carries drawings ({id, name, url}); anyone
   internal opens the sheet full-screen: pen, highlighter, wire paths, device
   icons, text notes, check-offs — plus the Bluebeam-Studio-style layer:
   zoom/pan, numbered comment PINS with open/resolved threads, a live per-sheet
   session CHAT, and presence (who's in the session right now).
   Markup vectors live in the synced drawingAnnoStore; pins + chat live in the
   plan_threads / plan_messages tables (realtime). Coordinates are normalized
   to a 1000-wide space so everything scales with the drawing on any screen. */

const BP_COLORS = ['#3FA9F5', '#F43F5E', '#34D399', '#FBBF24', '#FFFFFF'];
const BP_ICONS = [
  ['cam', '📷', 'Camera'], ['ap', '📡', 'AP / antenna'], ['door', '🚪', 'Door / reader'],
  ['panel', '🔔', 'Panel'], ['drop', '⌖', 'Cable drop'], ['power', '⚡', 'Power'],
];
const BP_TOOLS = [
  ['pan', '🖐', 'Pan / zoom — drag to move, wheel or pinch to zoom'],
  ['pin', '💬', 'Comment pin — tap the plan to start a thread there'],
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
  const [tool, setTool] = React.useState('pan');
  const [color, setColor] = React.useState(BP_COLORS[0]);
  const [glyph, setGlyph] = React.useState('📷');
  const [draft, setDraft] = React.useState(null);          // in-progress pen/hl stroke or wire pts
  const [ratio, setRatio] = React.useState(0.75);          // image h/w
  const svgRef = React.useRef(null);
  const src = bpResolveSrc(drawing.url || drawing.dataUrl);
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;

  /* ── zoom / pan ─────────────────────────────────────────────── */
  const [view, setView] = React.useState({ scale: 1, tx: 0, ty: 0 });
  const gest = React.useRef(null);                          // {mode:'pan'|'pinch', ...}
  const zoomBy = (f) => setView(v => {
    const ns = Math.min(8, Math.max(1, v.scale * f));
    return ns === 1 ? { scale: 1, tx: 0, ty: 0 } : { ...v, scale: ns };
  });
  const onWheel = (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 0.87); };
  const panStart = (x, y) => { gest.current = { mode: 'pan', x, y, tx: view.tx, ty: view.ty }; };
  const panMove = (x, y) => {
    const g = gest.current;
    if (g && g.mode === 'pan') setView(v => ({ ...v, tx: g.tx + (x - g.x), ty: g.ty + (y - g.y) }));
  };
  const canvasDown = (e) => {
    if (e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      gest.current = { mode: 'pinch', d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: view.scale };
      setDraft(null);
      return;
    }
    if (tool !== 'pan' && !(e.button === 1)) return;
    const p = e.touches ? e.touches[0] : e;
    panStart(p.clientX, p.clientY);
  };
  const canvasMove = (e) => {
    const g = gest.current;
    if (!g) return;
    if (g.mode === 'pinch' && e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setView(v => { const ns = Math.min(8, Math.max(1, g.scale * (d / g.d))); return ns === 1 ? { scale: 1, tx: 0, ty: 0 } : { ...v, scale: ns }; });
      return;
    }
    const p = e.touches ? e.touches[0] : e;
    panMove(p.clientX, p.clientY);
  };
  const canvasUp = () => { gest.current = null; };

  /* ── Plan Room session: pins + chat + presence ─────────────────── */
  const collab = window.__shieldPlanCollab;
  const [threads, setThreads] = React.useState([]);
  const [msgs, setMsgs] = React.useState([]);
  const [people, setPeople] = React.useState([]);
  const [panel, setPanel] = React.useState(null);           // null | 'chat' | 'pins' | {threadId}
  const [pendingPin, setPendingPin] = React.useState(null); // {x,y} awaiting first message
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

  React.useEffect(() => {                                   // keep chat pinned to the newest message
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

  /* ── markup handlers (existing tools) ──────────────────────────── */
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
    if (tool === 'pan' || (ev.touches && ev.touches.length > 1)) return;
    if (readOnly && tool !== 'check' && tool !== 'pin') return;
    const [x, y] = toVB(ev);
    if (tool === 'pin') { if (collab) { setPendingPin({ x, y }); setPanel('newpin'); } return; }
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
    if (ev.touches && ev.touches.length > 1) return;
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

  const activeThread = panel && panel.threadId ? threads.find(t => t.id === panel.threadId) : null;
  const panelOpen = panel !== null;

  /* ── side panel / bottom sheet content ─────────────────────────── */
  const renderPanel = () => (
    <div style={isNarrow
      ? { position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', zIndex: 30, display: 'flex', flexDirection: 'column', background: 'rgba(7,10,16,0.98)', borderTop: '1px solid var(--border-strong)', borderRadius: '14px 14px 0 0', boxShadow: '0 -12px 40px rgba(0,0,0,0.5)' }
      : { width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', background: 'rgba(7,10,16,0.98)' }}>
      {/* panel header: tabs or thread title */}
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

      {/* live roster strip */}
      {people.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, overflowX: 'auto' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>In session:</span>
          {people.map(p => <span key={p.id} style={{ fontSize: 10.5, color: 'var(--text-mid)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{p.name}</span>)}
        </div>
      )}

      {/* body */}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>← Done</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drawing.name || 'Drawing'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>
            {objects.length} markup{objects.length === 1 ? '' : 's'} · {doneCount} checked{openCount ? ` · ${openCount} open pin${openCount === 1 ? '' : 's'}` : ''}{people.length > 1 ? ` · 🟢 ${people.length} in session` : ''}
          </div>
        </div>
        <button onClick={() => zoomBy(1.25)} style={{ ...btn(false), width: 34, height: 34, fontSize: 15 }}>＋</button>
        <button onClick={() => zoomBy(0.8)} style={{ ...btn(false), width: 34, height: 34, fontSize: 15 }}>－</button>
        <button onClick={() => setView({ scale: 1, tx: 0, ty: 0 })} style={{ ...btn(false), width: 'auto', height: 34, padding: '0 10px', fontSize: 11 }}>Fit</button>
        {collab && (
          <button onClick={() => { setUnread(0); setPanel(panelOpen ? null : 'chat'); }} style={{ ...btn(panelOpen), width: 'auto', height: 34, padding: '0 12px', fontSize: 12, position: 'relative' }}>
            💬 Chat
            {unread > 0 && !panelOpen && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 999, background: '#F43F5E', color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread}</span>}
          </button>
        )}
        {!readOnly && <button onClick={undo} disabled={!objects.length} style={{ ...btn(false), width: 'auto', height: 34, padding: '0 12px', fontSize: 12, opacity: objects.length ? 1 : 0.4 }}>↩</button>}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {/* Canvas column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <div
            onWheel={onWheel}
            onMouseDown={canvasDown} onMouseMove={canvasMove} onMouseUp={canvasUp} onMouseLeave={canvasUp}
            onTouchStart={canvasDown} onTouchMove={canvasMove} onTouchEnd={canvasUp}
            style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: tool === 'pan' ? (gest.current ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: view.scale === 1 ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 8 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 1100, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: 'center top' }}>
                {src
                  ? <img src={src} alt={drawing.name || 'blueprint'} onLoad={e => setRatio(e.target.naturalHeight / Math.max(1, e.target.naturalWidth))} style={{ width: '100%', display: 'block', borderRadius: 6, background: '#fff' }} />
                  : <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>Loading drawing…</div>}
                {showAnnotations && (
                  <svg ref={svgRef} viewBox={`0 0 1000 ${Math.round(1000 * ratio)}`}
                    onMouseDown={down} onMouseMove={move} onMouseUp={up}
                    onTouchStart={down} onTouchMove={move} onTouchEnd={up}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'pan' ? 'inherit' : tool === 'pin' ? 'copy' : 'crosshair', pointerEvents: tool === 'pan' ? 'none' : 'auto' }}>
                    {objects.map(o => <BpObject key={o.id} o={o} />)}
                    {draft && <BpObject o={{ ...draft, color, id: '_draft' }} />}
                    {threads.map(t => <BpPin key={t.id} t={t} active={activeThread && activeThread.id === t.id} onPick={openThread} />)}
                    {pendingPin && <BpPin t={{ ...pendingPin, num: threads.reduce((m, t) => Math.max(m, t.num || 0), 0) + 1, status: 'open' }} active onPick={() => {}} />}
                  </svg>
                )}
                {/* pins must stay clickable while panning */}
                {showAnnotations && tool === 'pan' && threads.length > 0 && (
                  <svg viewBox={`0 0 1000 ${Math.round(1000 * ratio)}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {threads.map(t => <g key={t.id} style={{ pointerEvents: 'auto' }}><BpPin t={t} active={activeThread && activeThread.id === t.id} onPick={openThread} /></g>)}
                  </svg>
                )}
              </div>
            </div>

            {/* Wire finish bar */}
            {draft && draft.type === 'wire' && (
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
                <button onClick={finishWire} style={{ pointerEvents: 'auto', padding: '9px 20px', borderRadius: 20, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Finish wire ({draft.pts.length} pts)</button>
                <button onClick={() => setDraft(null)} style={{ pointerEvents: 'auto', padding: '9px 16px', borderRadius: 20, border: '1px solid var(--border-strong)', background: 'rgba(10,14,20,0.9)', color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Toolbars */}
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'rgba(6,9,14,0.98)', padding: '8px 10px calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {BP_TOOLS.filter(([id]) => !readOnly || id === 'pan' || id === 'pin' || id === 'check').map(([id, g, tip]) => (
                <button key={id} title={tip} onClick={() => { setTool(id); if (id !== 'wire') setDraft(null); }} style={btn(tool === id)}>{g}</button>
              ))}
              {!readOnly && <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 2px', flexShrink: 0 }} />}
              {!readOnly && BP_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ ...btn(color === c), background: c, border: color === c ? '3px solid #fff' : '1px solid var(--border-subtle)' }} />
              ))}
            </div>
            {tool === 'icon' && !readOnly && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {BP_ICONS.map(([id, g, label]) => (
                  <button key={id} title={label} onClick={() => setGlyph(g)} style={{ ...btn(glyph === g), width: 'auto', padding: '0 10px', fontSize: 15 }}>{g} <span style={{ fontSize: 9 }}>{label}</span></button>
                ))}
              </div>
            )}
            <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center' }}>
              {tool === 'pan' ? 'Drag to pan · wheel / pinch to zoom · tap a pin to open its thread' :
               tool === 'pin' ? 'Tap the plan where the comment belongs — a numbered pin starts the thread' :
               tool === 'check' ? 'Tap any markup to check it off as installed (tap again to undo)' :
               tool === 'wire' ? 'Tap each turn of the wire run, then Finish' :
               tool === 'erase' ? 'Tap markup to remove it' :
               tool === 'text' ? 'Tap where the note goes' :
               tool === 'icon' ? 'Pick a device below, then tap its location' : 'Draw directly on the plan'}
            </div>
          </div>
        </div>

        {/* Collab panel (desktop side rail / mobile bottom sheet) */}
        {panelOpen && collab && renderPanel()}
      </div>
    </div>
  );
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

Object.assign(window, { BlueprintEditor, BlueprintRows, BP_ICONS });

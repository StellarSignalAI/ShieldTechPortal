/* Design Studio Views — D-Tools-class additions:
   · InterconnectCanvas — drag-to-connect signal/cable diagram (the centerpiece)
   · RackElevationView  — stack rack-mount gear into a 42U rack
   · PhotoQuoteCanvas   — image quoting: drop devices onto a customer site photo
   All operate on the SAME placedDevices array so the BOM stays unified across tabs. */

/* Auto cable type from the two endpoints' categories */
function ngCableFor(a, b) {
  const cats = [a, b];
  if (cats.includes('Power')) return { type: '18/2 Power', color: '#f59e0b' };
  if (cats.includes('Cabling')) return { type: 'Cat6A', color: 'var(--brand)' };
  if (cats.includes('Access')) return { type: 'OSDP / Composite', color: '#c084fc' };
  if (cats.includes('Intrusion')) return { type: '22/4 Shielded', color: 'var(--status-warn)' };
  if (cats.includes('Network') || cats.includes('NVR') || cats.includes('Cameras')) return { type: 'Cat6A', color: 'var(--brand)' };
  return { type: 'Cat6A', color: 'var(--brand)' };
}

/* ── Shared: add a catalog device into the design from any Studio tab ── */
function studioAddDevice(setPlacedDevices, placedDevices, device, showToast) {
  const tag = `${device.cat.substring(0, 3).toUpperCase()}-${String(placedDevices.length + 1).padStart(2, '0')}`;
  setPlacedDevices(prev => [...prev, { x: 120 + Math.random() * 280, y: 80 + Math.random() * 180, device, tag }]);
  showToast && showToast(`${device.name} added to design`);
}

function StudioDevicePicker({ deviceCatalog, brands, onPick, onClose, filter, title }) {
  const [q, setQ] = React.useState('');
  const list = (deviceCatalog || []).filter(d => (filter ? filter(d) : true) && (q ? (d.name + d.brand + d.subcat).toLowerCase().includes(q.toLowerCase()) : true));
  const brandName = (id) => (brands || []).find(b => b.id === id)?.name || id;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 460, maxHeight: '78vh', display: 'flex', flexDirection: 'column', padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title || 'Add Device'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search the catalog…" style={{ width: '100%', padding: '8px 10px', marginBottom: 10, background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)' }} />
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {list.map(d => (
            <button key={d.id} onClick={() => onPick(d)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(63,169,245,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {typeof Icon !== 'undefined' && <Icon name={(window.__studioSubcatIcons && window.__studioSubcatIcons[d.subcat]) || 'cam-dome'} size={15} color="var(--brand)" />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{d.name}</span>
                <span style={{ display: 'block', fontSize: 9, color: 'var(--text-low)' }}>{brandName(d.brand)} · {d.subcat}</span>
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>${(d.msrp || 0).toLocaleString()}</span>
            </button>
          ))}
          {list.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: 20 }}>No matching devices.</div>}
        </div>
      </div>
    </div>
  );
}

function studioBtn(primary) {
  return { padding: '4px 11px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', border: primary ? 'none' : '1px solid var(--border-strong)', background: primary ? 'var(--brand)' : 'rgba(63,169,245,0.08)', color: primary ? '#fff' : 'var(--brand)' };
}

/* ════════════════ INTERCONNECT — drag to connect ════════════════ */
function InterconnectCanvas({ placedDevices, connections, setConnections, brands, catColors, showToast, setPlacedDevices, deviceCatalog, onExportToProposal }) {
  const wrapRef = React.useRef(null);
  const NODE_W = 158, NODE_H = 52;
  const [picker, setPicker] = React.useState(false);

  /* tier (column) by category — edge devices → switch → recorders/power */
  const tierOf = (cat) => {
    if (['Cameras', 'Access', 'Intrusion', 'Fire'].includes(cat)) return 0;
    if (['Network', 'Cabling'].includes(cat)) return 1;
    return 2; // NVR, Power
  };

  /* auto-layout positions, persisted so dragging sticks */
  const [pos, setPos] = React.useState(() => {
    const cols = { 0: [], 1: [], 2: [] };
    placedDevices.forEach((pd, i) => cols[tierOf(pd.device.cat)].push(i));
    const p = {};
    Object.entries(cols).forEach(([tier, idxs]) => {
      idxs.forEach((idx, row) => { p[idx] = { x: 40 + tier * 230, y: 30 + row * 74 }; });
    });
    return p;
  });

  /* keep pos in sync when devices added/removed */
  React.useEffect(() => {
    setPos(prev => {
      const next = { ...prev };
      const cols = { 0: [], 1: [], 2: [] };
      placedDevices.forEach((pd, i) => { if (!(i in next)) cols[tierOf(pd.device.cat)].push(i); });
      Object.entries(cols).forEach(([tier, idxs]) => {
        idxs.forEach((idx) => {
          const rows = Object.keys(next).length;
          next[idx] = { x: 40 + Number(tier) * 230, y: 30 + (idx % 6) * 74 };
        });
      });
      return next;
    });
  }, [placedDevices.length]);

  const [drag, setDrag] = React.useState(null);     // {type:'node'|'link', idx, dx, dy}
  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });
  const [hoverNode, setHoverNode] = React.useState(null);
  const [selEdge, setSelEdge] = React.useState(null);

  const localXY = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left + wrapRef.current.scrollLeft, y: e.clientY - r.top + wrapRef.current.scrollTop };
  };

  const onMove = (e) => {
    if (!drag) return;
    const { x, y } = localXY(e);
    setMouse({ x, y });
    if (drag.type === 'node') {
      setPos(prev => ({ ...prev, [drag.idx]: { x: x - drag.dx, y: y - drag.dy } }));
    }
  };
  const onUp = (e) => {
    if (drag && drag.type === 'link') {
      if (hoverNode != null && hoverNode !== drag.idx) {
        const exists = connections.some(c => (c.from === drag.idx && c.to === hoverNode) || (c.from === hoverNode && c.to === drag.idx));
        if (!exists) {
          const cab = ngCableFor(placedDevices[drag.idx].device.cat, placedDevices[hoverNode].device.cat);
          setConnections(prev => [...prev, { id: 'c' + Date.now(), from: drag.idx, to: hoverNode, cable: cab.type, color: cab.color, length: 50 }]);
          showToast && showToast(`Connected ${placedDevices[drag.idx].tag} → ${placedDevices[hoverNode].tag}`);
        }
      }
    }
    setDrag(null);
  };

  const portR = (idx) => { const p = pos[idx] || { x: 0, y: 0 }; return { x: p.x + NODE_W, y: p.y + NODE_H / 2 }; };
  const portL = (idx) => { const p = pos[idx] || { x: 0, y: 0 }; return { x: p.x, y: p.y + NODE_H / 2 }; };
  const bezier = (a, b) => `M${a.x},${a.y} C${a.x + 60},${a.y} ${b.x - 60},${b.y} ${b.x},${b.y}`;

  const totalFt = connections.reduce((s, c) => s + (c.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Interconnect Diagram</span>
        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Drag the <span style={{ color: 'var(--brand)' }}>●</span> handle on a device onto another to wire them</span>
        <div style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{connections.length} links · {totalFt} ft cable</span>
        <button onClick={() => setPicker(true)} style={studioBtn(false)}>+ Add Device</button>
        <button onClick={() => { setConnections([]); showToast && showToast('Connections cleared'); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear</button>
        <button onClick={() => onExportToProposal ? onExportToProposal() : (showToast && showToast('Diagram added to proposal'))} style={studioBtn(true)}>↗ Export to Proposal</button>
      </div>
      {picker && <StudioDevicePicker deviceCatalog={deviceCatalog} brands={brands} title="Add Device to Diagram" onClose={() => setPicker(false)} onPick={(d) => { studioAddDevice(setPlacedDevices, placedDevices, d, showToast); setPicker(false); }} />}

      <div ref={wrapRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setDrag(null)}
        style={{ flex: 1, position: 'relative', overflow: 'auto', background: 'rgba(5,7,10,0.6)', cursor: drag?.type === 'node' ? 'grabbing' : 'default' }}>
        <div style={{ position: 'relative', width: 760, height: Math.max(480, (Math.max(...Object.values(pos).map(p => p.y), 0) + 120)) }}>
          {/* tier labels */}
          {['Edge Devices', 'Network', 'Recorders / Power'].map((l, t) => (
            <div key={l} style={{ position: 'absolute', left: 40 + t * 230, top: 4, fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
          ))}

          {/* edges */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <pattern id="icGrid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0 L0 0 0 38" fill="none" stroke="rgba(63,169,245,0.04)" strokeWidth="0.5" /></pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#icGrid)" />
            {connections.map(c => {
              if (!pos[c.from] || !pos[c.to]) return null;
              const a = portR(c.from), b = portL(c.to);
              const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
              const isSel = selEdge === c.id;
              return (
                <g key={c.id} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={() => setSelEdge(isSel ? null : c.id)}>
                  <path d={bezier(a, b)} fill="none" stroke={c.color} strokeWidth={isSel ? 3 : 1.8} opacity={isSel ? 1 : 0.7} />
                  <rect x={mid.x - 32} y={mid.y - 9} width="64" height="16" rx="3" fill="rgba(10,14,20,0.92)" stroke={c.color} strokeWidth="0.5" opacity="0.95" />
                  <text x={mid.x} y={mid.y + 2} textAnchor="middle" fill={c.color} fontSize="8" fontFamily="var(--font-mono)">{c.cable}</text>
                </g>
              );
            })}
            {/* pending link */}
            {drag?.type === 'link' && pos[drag.idx] && (
              <path d={bezier(portR(drag.idx), mouse)} fill="none" stroke="var(--brand)" strokeWidth="2" strokeDasharray="5 4" opacity="0.8" />
            )}
          </svg>

          {/* selected edge editor */}
          {selEdge && (() => {
            const c = connections.find(x => x.id === selEdge); if (!c || !pos[c.from] || !pos[c.to]) return null;
            const a = portR(c.from), b = portL(c.to); const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            return (
              <div style={{ position: 'absolute', left: mid.x - 70, top: mid.y + 12, zIndex: 20, width: 140, padding: 8, background: 'rgba(10,14,20,0.96)', border: '1px solid var(--border-strong)', borderRadius: 8, backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 4 }}>{placedDevices[c.from].tag} → {placedDevices[c.to].tag}</div>
                <select value={c.cable} onChange={e => setConnections(prev => prev.map(x => x.id === c.id ? { ...x, cable: e.target.value } : x))} style={{ width: '100%', padding: '3px 4px', marginBottom: 4, background: 'rgba(5,7,10,0.6)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 9, fontFamily: 'var(--font-body)' }}>
                  {['Cat6A', 'Cat6', 'OSDP / Composite', '18/2 Power', '22/4 Shielded', 'Fiber OM4', 'Siamese RG59'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <input type="number" value={c.length} onChange={e => setConnections(prev => prev.map(x => x.id === c.id ? { ...x, length: parseInt(e.target.value) || 0 } : x))} style={{ width: 50, padding: '2px 4px', background: 'rgba(5,7,10,0.6)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 9, fontFamily: 'var(--font-mono)' }} />
                  <span style={{ fontSize: 9, color: 'var(--text-low)' }}>ft run</span>
                </div>
                <button onClick={() => { setConnections(prev => prev.filter(x => x.id !== c.id)); setSelEdge(null); }} style={{ width: '100%', padding: '3px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 4, color: 'var(--status-critical)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete link</button>
              </div>
            );
          })()}

          {/* nodes */}
          {placedDevices.map((pd, idx) => {
            const p = pos[idx]; if (!p) return null;
            const color = catColors[pd.device.cat] || 'var(--brand)';
            const isHover = hoverNode === idx;
            const linkTarget = drag?.type === 'link' && drag.idx !== idx;
            return (
              <div key={idx}
                onMouseEnter={() => setHoverNode(idx)} onMouseLeave={() => setHoverNode(null)}
                onPointerDown={(e) => { const { x, y } = localXY(e); setDrag({ type: 'node', idx, dx: x - p.x, dy: y - p.y }); }}
                style={{ position: 'absolute', left: p.x, top: p.y, width: NODE_W, height: NODE_H, borderRadius: 9, background: 'rgba(10,14,20,0.95)', border: `1.5px solid ${linkTarget && isHover ? 'var(--brand)' : color}`, boxShadow: (linkTarget && isHover) ? '0 0 14px var(--brand)' : `0 0 6px ${color}40`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', cursor: 'grab', userSelect: 'none', touchAction: 'none', zIndex: drag?.idx === idx ? 10 : 2 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}1f`, border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {typeof Icon !== 'undefined' && <Icon name={(window.__studioSubcatIcons && window.__studioSubcatIcons[pd.device.subcat]) || 'cam-dome'} size={14} color={color} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 9, color, fontWeight: 600 }}>{pd.tag}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pd.device.name}</div>
                </div>
                {/* left in-port */}
                <div style={{ position: 'absolute', left: -6, top: NODE_H / 2 - 6, width: 12, height: 12, borderRadius: '50%', background: 'rgba(10,14,20,0.95)', border: `2px solid ${color}`, opacity: 0.6 }} />
                {/* right out-port (drag handle) */}
                <div onPointerDown={(e) => { e.stopPropagation(); const { x, y } = localXY(e); setMouse({ x, y }); setDrag({ type: 'link', idx }); }}
                  title="Drag to connect"
                  style={{ position: 'absolute', right: -7, top: NODE_H / 2 - 7, width: 14, height: 14, borderRadius: '50%', background: color, border: '2px solid rgba(10,14,20,0.95)', cursor: 'crosshair', boxShadow: `0 0 6px ${color}` }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Realistic rack-mount equipment faceplate ── */
function RackFaceplate({ device, color, hpx, dragging }) {
  const cat = device.cat, sub = device.subcat || '';
  const kind = sub === 'Switch' ? 'switch' : cat === 'NVR' ? 'nvr' : sub === 'UPS' ? 'ups' : cat === 'Power' ? 'psu' : sub === 'Patch Panel' ? 'patch' : sub === 'Access Point' ? 'ap' : 'generic';
  const screw = { width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #4a5568, #1a2230)', flexShrink: 0 };
  const faceBg = 'linear-gradient(180deg, #161d28 0%, #0c1019 100%)';
  const small = hpx < 30;

  let panel = null;
  if (kind === 'switch') {
    panel = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gridAutoFlow: 'column', gap: 1.5 }}>
          {Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 1, background: [3, 7, 8, 14, 19].includes(i) ? '#34d399' : '#0a0e14', border: '0.5px solid #2a3340', boxShadow: [3, 7, 8, 14, 19].includes(i) ? '0 0 3px #34d399' : 'none' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>{[0, 1].map(i => <span key={i} style={{ width: 8, height: 9, borderRadius: 1, background: '#0a0e14', border: '1px solid #2a3340' }} />)}</div>
      </div>
    );
  } else if (kind === 'nvr') {
    panel = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ width: 22, height: hpx > 44 ? 16 : 10, borderRadius: 2, background: 'linear-gradient(135deg,#0a2a33,#06151a)', border: '1px solid #1a3a44', boxShadow: 'inset 0 0 4px #0891b2' }} />
        <div style={{ display: 'flex', gap: 2 }}>{Array.from({ length: 4 }).map((_, i) => <span key={i} style={{ width: 7, height: hpx > 44 ? 22 : 12, borderRadius: 1, background: 'linear-gradient(180deg,#1a2230,#0c1019)', border: '1px solid #2a3340', position: 'relative' }}><span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: i < 3 ? '#34d399' : '#1a2230', boxShadow: i < 3 ? '0 0 3px #34d399' : 'none' }} /></span>)}</div>
      </div>
    );
  } else if (kind === 'ups') {
    panel = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ width: 26, height: hpx > 44 ? 18 : 11, borderRadius: 2, background: 'linear-gradient(135deg,#0a2233,#06121a)', border: '1px solid #1a3344', boxShadow: 'inset 0 0 4px #3FA9F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="mono" style={{ fontSize: 6, color: '#5bc0ff' }}>100%</span></span>
        <div style={{ display: 'flex', gap: 1.5 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ width: 4, height: 10, borderRadius: 1, background: i < 4 ? '#34d399' : '#1a2230', boxShadow: i < 4 ? '0 0 2px #34d399' : 'none' }} />)}</div>
        <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>{[0, 1].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#0a0e14', border: '1.5px solid #2a3340' }} />)}</div>
      </div>
    );
  } else if (kind === 'psu') {
    panel = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        <div style={{ display: 'flex', gap: 3 }}>{Array.from({ length: 4 }).map((_, i) => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i < 3 ? '#34d399' : '#f59e0b', boxShadow: `0 0 3px ${i < 3 ? '#34d399' : '#f59e0b'}` }} />)}</div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>{Array.from({ length: 6 }).map((_, i) => <span key={i} style={{ width: 5, height: 8, borderRadius: 1, background: '#0a0e14', border: '1px solid #2a3340' }} />)}</div>
      </div>
    );
  } else if (kind === 'patch') {
    panel = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 1, flex: 1 }}>
        {Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ height: 8, borderRadius: 1, background: '#0a0e14', border: '0.5px solid #2a3340' }} />)}
      </div>
    );
  } else {
    panel = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 3px #34d399' }} />
        <div style={{ display: 'flex', gap: 2, flex: 1, opacity: 0.4 }}>{Array.from({ length: 8 }).map((_, i) => <span key={i} style={{ flex: 1, height: 6, background: 'repeating-linear-gradient(90deg,#2a3340 0 1px,transparent 1px 3px)' }} />)}</div>
      </div>
    );
  }

  return (
    <div style={{ height: hpx, background: faceBg, border: `1px solid ${dragging ? color : '#2a3340'}`, borderLeft: `3px solid ${color}`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', boxShadow: dragging ? `0 6px 20px rgba(0,0,0,0.6), 0 0 0 1px ${color}` : 'inset 0 1px 0 rgba(255,255,255,0.04)', cursor: 'grab', userSelect: 'none' }}>
      <span style={screw} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
        {!small && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{device.name}</span>
            <span className="mono" style={{ fontSize: 7, color, marginLeft: 'auto', flexShrink: 0 }}>⠿</span>
          </div>
        )}
        {panel}
      </div>
      <span style={screw} />
    </div>
  );
}

/* ════════════════ RACK ELEVATION ════════════════ */
function RackElevationView({ placedDevices, catColors, showToast, setPlacedDevices, deviceCatalog, brands, onExportToProposal }) {
  const RACK_U = 42, UPX = 22;
  const uHeight = (d) => {
    if (d.cat === 'NVR') return d.subcat.includes('64') ? 3 : 2;
    if (d.cat === 'Network') return 1;
    if (d.cat === 'Power') return d.subcat === 'UPS' ? 2 : 1;
    if (d.subcat === 'Patch Panel') return 2;
    return 1;
  };
  const isRackGear = (pd) => ['NVR', 'Network', 'Power'].includes(pd.device.cat) || pd.device.subcat === 'Patch Panel';
  const [picker, setPicker] = React.useState(false);

  /* order = array of placedDevices indices (rack-mountable) in display order */
  const rackIdxs = placedDevices.map((pd, i) => isRackGear(pd) ? i : -1).filter(i => i >= 0);
  const [order, setOrder] = React.useState(rackIdxs);
  React.useEffect(() => {
    setOrder(prev => {
      const present = prev.filter(i => rackIdxs.includes(i));
      const added = rackIdxs.filter(i => !present.includes(i));
      return [...present, ...added];
    });
  }, [placedDevices.length]);

  const stackRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [dragPos, setDragPos] = React.useState(null);

  const heights = order.map(i => uHeight(placedDevices[i].device));
  const tops = []; let acc = 0; heights.forEach(h => { tops.push(acc); acc += h; });
  const usedU = acc;

  const onUnitDown = (e, posInOrder) => {
    if (e.target.closest('[data-rack-remove]')) return;
    e.preventDefault();
    dragRef.current = { pos: posInOrder };
    setDragPos(posInOrder);
  };
  const onStackMove = (e) => {
    if (!dragRef.current || !stackRef.current) return;
    const rect = stackRef.current.getBoundingClientRect();
    const yU = (e.clientY - rect.top) / UPX;
    // find target slot index by cumulative U
    let target = order.length - 1;
    for (let k = 0; k < tops.length; k++) { if (yU < tops[k] + heights[k] / 2) { target = k; break; } }
    const from = dragRef.current.pos;
    if (target !== from && target >= 0 && target < order.length) {
      setOrder(prev => { const next = [...prev]; const [m] = next.splice(from, 1); next.splice(target, 0, m); return next; });
      dragRef.current.pos = target; setDragPos(target);
    }
  };
  const onStackUp = () => { dragRef.current = null; setDragPos(null); };
  const removeUnit = (idx) => { setPlacedDevices(prev => prev.filter((_, i) => i !== idx)); showToast && showToast('Removed from rack'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Rack Elevation</span>
        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{usedU}U of {RACK_U}U · click-hold a unit to reorder</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setPicker(true)} style={studioBtn(false)}>+ Add Device</button>
        <button onClick={() => showToast && showToast('Rack elevation exported to PDF')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>PDF</button>
        <button onClick={() => onExportToProposal ? onExportToProposal() : (showToast && showToast('Rack added to proposal'))} style={studioBtn(true)}>↗ Export to Proposal</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: 'rgba(5,7,10,0.6)', padding: 20, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
          {/* U numbers */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 24 }}>
            {Array.from({ length: RACK_U }, (_, i) => RACK_U - i).map(n => <div key={n} className="mono" style={{ height: UPX, fontSize: 7, color: 'var(--text-low)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>{n}</div>)}
          </div>
          {/* rack frame */}
          <div style={{ position: 'relative', width: 300, background: '#0a0e14', border: '3px solid #1a2230', borderRadius: 6, height: RACK_U * UPX }}
            ref={stackRef} onPointerMove={onStackMove} onPointerUp={onStackUp} onPointerLeave={onStackUp}>
            {/* empty slot lines */}
            {Array.from({ length: RACK_U }).map((_, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * UPX, height: UPX, borderBottom: '1px solid rgba(63,169,245,0.04)' }} />)}
            {/* mounted units */}
            {order.map((idx, pos) => {
              const pd = placedDevices[idx]; if (!pd) return null;
              const h = heights[pos]; const color = catColors[pd.device.cat] || 'var(--brand)';
              const isDrag = dragPos === pos;
              return (
                <div key={idx} data-rack-node onPointerDown={(e) => onUnitDown(e, pos)}
                  style={{ touchAction: 'none', position: 'absolute', left: 4, right: 4, top: tops[pos] * UPX + 1, height: h * UPX - 2, zIndex: isDrag ? 10 : 2, transition: isDrag ? 'none' : 'top 0.12s ease' }}>
                  <div style={{ position: 'relative', height: '100%' }}>
                    <RackFaceplate device={pd.device} color={color} hpx={h * UPX - 2} dragging={isDrag} />
                    <span className="mono" style={{ position: 'absolute', top: 2, right: 18, fontSize: 7, color: 'var(--text-low)' }}>{pd.tag} · {h}U</span>
                    <button data-rack-remove onClick={() => removeUnit(idx)} title="Remove" style={{ position: 'absolute', top: 1, right: 1, width: 13, height: 13, borderRadius: 3, background: 'rgba(244,63,94,0.12)', border: 'none', color: 'var(--status-critical)', fontSize: 8, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                  </div>
                </div>
              );
            })}
            {order.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 10, color: 'var(--text-low)', padding: 20 }}>No rack gear yet — “+ Add Device” to mount an NVR, switch, UPS or patch panel.</div>}
          </div>
          {/* side info */}
          <div style={{ marginLeft: 20, fontSize: 10, color: 'var(--text-low)', width: 160 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-mid)', marginBottom: 8 }}>Mounted ({order.length})</div>
            {order.map((idx, pos) => { const pd = placedDevices[idx]; if (!pd) return null; const color = catColors[pd.device.cat] || 'var(--brand)';
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-mid)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pd.device.name}</span>
                  <span className="mono" style={{ color: 'var(--text-low)' }}>{heights[pos]}U</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {picker && <StudioDevicePicker deviceCatalog={deviceCatalog} brands={brands} title="Add Rack-Mount Device" filter={(d) => ['NVR', 'Network', 'Power'].includes(d.cat) || d.subcat === 'Patch Panel'} onClose={() => setPicker(false)} onPick={(d) => { studioAddDevice(setPlacedDevices, placedDevices, d, showToast); setPicker(false); }} />}
    </div>
  );
}

/* ════════════════ PHOTO / IMAGE QUOTING ════════════════ */
function PhotoQuoteCanvas({ placedDevices, setPlacedDevices, dragPlaceDevice, setDragPlaceDevice, catColors, showToast, onExportToProposal }) {
  const [photo, setPhoto] = React.useState(null);
  const [pins, setPins] = React.useState([]); // {x%, y%, deviceIdx-or-device, tag}
  const fileRef = React.useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhoto(URL.createObjectURL(f)); showToast && showToast('Site photo loaded — drag devices onto it');
    const store = window.__shieldStorage;
    if (store && store.uploadFile) {
      store.uploadFile(f, { folder: 'quote-photos', entity: 'quote_photo', name: f.name })
        .then(res => { if (res && res.url && !res.local) setPhoto(res.url); }).catch(() => {});
    }
  };

  const drop = (e) => {
    e.preventDefault();
    if (!dragPlaceDevice || !photo) return;
    const r = e.currentTarget.getBoundingClientRect();
    const xp = ((e.clientX - r.left) / r.width) * 100;
    const yp = ((e.clientY - r.top) / r.height) * 100;
    const tag = `${dragPlaceDevice.cat.substring(0, 3).toUpperCase()}-${String(placedDevices.length + 1).padStart(2, '0')}`;
    setPlacedDevices(prev => [...prev, { x: 100, y: 100, device: dragPlaceDevice, tag }]);
    setPins(prev => [...prev, { x: xp, y: yp, device: dragPlaceDevice, tag }]);
    showToast && showToast(`${dragPlaceDevice.name} placed on photo → added to BOM`);
    setDragPlaceDevice(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Image Quoting</span>
        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Drop catalog devices onto a real site photo — each lands in the BOM</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => fileRef.current?.click()} style={{ padding: '4px 12px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 5, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◉ {photo ? 'Replace Photo' : 'Upload Site Photo'}</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        <button onClick={() => onExportToProposal ? onExportToProposal() : (showToast && showToast('Photo markups added to proposal'))} style={studioBtn(true)}>↗ Export to Proposal</button>
      </div>
      <div onDragOver={e => e.preventDefault()} onDrop={drop} onClick={(e) => { if (dragPlaceDevice && photo) drop(e); }}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: photo ? '#000' : 'rgba(5,7,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!photo ? (
          <div style={{ textAlign: 'center', color: 'var(--text-low)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 14, border: '2px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>◉</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>Upload a photo of the wall, room, or rack</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Then drag cameras, readers and sensors from the catalog onto it</div>
            <button onClick={() => fileRef.current?.click()} style={{ marginTop: 14, padding: '8px 18px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Choose Photo</button>
          </div>
        ) : (
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <img src={photo} alt="site" style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }} />
            {pins.map((pin, i) => {
              const color = catColors[pin.device.cat] || 'var(--brand)';
              return (
                <div key={i} style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-50%)', zIndex: 3 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(10,14,20,0.9)', border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {typeof Icon !== 'undefined' && <Icon name={(window.__studioSubcatIcons && window.__studioSubcatIcons[pin.device.subcat]) || 'cam-dome'} size={15} color={color} />}
                  </div>
                  <div className="mono" style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#fff', background: 'rgba(10,14,20,0.85)', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>{pin.tag}</div>
                  <button onClick={() => setPins(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--status-critical)', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                </div>
              );
            })}
            {dragPlaceDevice && <div style={{ position: 'absolute', inset: 0, border: '3px dashed var(--brand)', background: 'rgba(63,169,245,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><span style={{ color: 'var(--brand)', fontSize: 14, fontWeight: 600, background: 'rgba(10,14,20,0.8)', padding: '6px 14px', borderRadius: 6 }}>Drop {dragPlaceDevice.name}</span></div>}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { InterconnectCanvas, RackElevationView, PhotoQuoteCanvas, ngCableFor, RackFaceplate, StudioDevicePicker, studioAddDevice });

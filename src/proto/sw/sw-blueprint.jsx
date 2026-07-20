// ============================================================
// Leads engine — Blueprint viewer (Bluebeam-style)
// Full-bleed plan with zoom/pan, wipe slider between the
// as-issued sheet and the HERMES markup, per-trade layer
// toggles, and click-a-device → BOM line + spec + price.
// ============================================================

const BR_TRADE_COLOR = { 'CCTV': '#5FC0FF', 'Access': '#6EE7B7', 'Access (PACS)': '#6EE7B7', 'Intrusion': '#FCD34D', 'Cabling': '#A78BFA', 'Fiber': '#A78BFA', 'Network': '#7DD3FC', 'Intercom': '#FDBA74', 'Paging': '#FDBA74', 'Nurse call': '#F9A8D4', 'Fire': '#F87171', 'Div 28': '#94A3B8', 'Div 27': '#94A3B8' };

/* Combined single-plan model: rooms + every trade's devices */
function brPlan(opp) {
  const h = brHash(opp.id);
  const rooms = [];
  let x = 6;
  const widths = [26, 18, 22, 14, 20];
  for (let i = 0; i < 4; i++) { const w = widths[(h + i) % widths.length]; rooms.push({ x, y: 8, w, h: 30 }); x += w + 2; }
  x = 6;
  for (let i = 0; i < 3; i++) { const w = widths[(h + i + 2) % widths.length] + 6; rooms.push({ x, y: 46, w, h: 28 }); x += w + 2; }
  const rows = brSpecRows(opp).filter(r => r.unit !== 'ls');
  const devices = [];
  rows.forEach((r, ri) => {
    const show = Math.min(r.drawingQty, 8);
    for (let i = 0; i < show; i++) {
      const rm = rooms[(h + ri * 5 + i * 7) % rooms.length];
      devices.push({
        id: r.id + '-d' + i, rowId: r.id, trade: r.trade, item: r.item, csi: r.csi, sheet: r.sheet,
        tag: (BR_DEVICE_TAG[r.trade] || 'X') + '-' + String(devices.filter(d => d.trade === r.trade).length + 1).padStart(2, '0'),
        x: rm.x + 3 + ((h >>> ((ri + i) % 8)) + i * 13 + ri * 17) % (rm.w - 6),
        y: rm.y + 4 + ((h >>> ((ri + i + 3) % 8)) + i * 11 + ri * 7) % (rm.h - 8),
      });
    }
  });
  return { rooms, devices };
}

function BrPlanSVG({ opp, plan, marked, layers, selected, onSelect }) {
  const FT = (u) => { const ft = Math.round(u * 2); return ft + "'-0\""; };
  const gridX = [10, 30, 50, 70, 90];
  const gridY = [12, 32, 52, 72];
  return (
    <svg viewBox="0 0 100 80" style={{ display: 'block', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <rect x="1" y="1" width="98" height="78" fill="#0B111E" stroke="rgba(125,211,252,0.35)" strokeWidth="0.4" />
      {/* ── structural column grid with bubbles ── */}
      {gridX.map((gx, i) => (
        <g key={'gx' + gx}>
          <line x1={gx} y1="7" x2={gx} y2="76" stroke="rgba(125,211,252,0.12)" strokeWidth="0.18" strokeDasharray="1.6 0.9" />
          <circle cx={gx} cy="5.4" r="1.7" fill="#0B111E" stroke="rgba(125,211,252,0.55)" strokeWidth="0.25" />
          <text x={gx} y="6.1" fontSize="1.9" fill="rgba(125,211,252,0.8)" textAnchor="middle" fontFamily="var(--font-mono)">{String.fromCharCode(65 + i)}</text>
        </g>
      ))}
      {gridY.map((gy, i) => (
        <g key={'gy' + gy}>
          <line x1="4" y1={gy} x2="97" y2={gy} stroke="rgba(125,211,252,0.10)" strokeWidth="0.18" strokeDasharray="1.6 0.9" />
          <circle cx="3" cy={gy} r="1.7" fill="#0B111E" stroke="rgba(125,211,252,0.55)" strokeWidth="0.25" />
          <text x="3" y={gy + 0.7} fontSize="1.9" fill="rgba(125,211,252,0.8)" textAnchor="middle" fontFamily="var(--font-mono)">{i + 1}</text>
        </g>
      ))}
      {/* ── overall dimension string ── */}
      <g stroke="rgba(125,211,252,0.5)" strokeWidth="0.2">
        <line x1="6" y1="77.6" x2="96" y2="77.6" />
        <line x1="6" y1="76.8" x2="6" y2="78.4" /><line x1="96" y1="76.8" x2="96" y2="78.4" />
        <line x1="5.4" y1="78.2" x2="6.6" y2="77" /><line x1="95.4" y1="78.2" x2="96.6" y2="77" />
      </g>
      <rect x="46" y="76.4" width="10" height="2.4" fill="#0B111E" />
      <text x="51" y="78.2" fontSize="1.9" fill="rgba(125,211,252,0.85)" textAnchor="middle" fontFamily="var(--font-mono)">{FT(90)}</text>
      {/* rooms — double-line walls, room tags with area */}
      {plan.rooms.map((r, i) => (
        <g key={i}>
          <rect x={r.x - 0.45} y={r.y - 0.45} width={r.w + 0.9} height={r.h + 0.9} fill="none" stroke="rgba(125,211,252,0.55)" strokeWidth="0.28" />
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(63,169,245,0.02)" stroke="rgba(125,211,252,0.45)" strokeWidth="0.3" />
          <text x={r.x + 1.5} y={r.y + 3} fontSize="1.8" fill="rgba(125,211,252,0.65)" fontFamily="var(--font-mono)">{100 + i * 2}</text>
          <text x={r.x + 1.5} y={r.y + 5.4} fontSize="1.3" fill="rgba(125,211,252,0.4)" fontFamily="var(--font-mono)">{Math.round(r.w * 2) * Math.round(r.h * 2)} SF</text>
          {/* room dimension */}
          <text x={r.x + r.w / 2} y={r.y + r.h - 1.2} fontSize="1.3" fill="rgba(125,211,252,0.38)" textAnchor="middle" fontFamily="var(--font-mono)">{FT(r.w)} × {FT(r.h)}</text>
          <line x1={r.x + r.w / 2 - 2} y1={r.y + r.h} x2={r.x + r.w / 2 + 2} y2={r.y + r.h} stroke="#0B111E" strokeWidth="0.55" />
          <path d={`M ${r.x + r.w / 2 - 2} ${r.y + r.h} A 4 4 0 0 1 ${r.x + r.w / 2 + 2} ${r.y + r.h - 4}`} fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="0.22" />
        </g>
      ))}
      <text x="50" y="43" fontSize="1.9" fill="rgba(125,211,252,0.4)" textAnchor="middle" fontFamily="var(--font-mono)" letterSpacing="1">CORRIDOR C-1 · {FT(92)} CLR</text>
      {/* ── survey benchmark + north arrow + scale bar ── */}
      <g transform="translate(93.5 10.5)">
        <circle r="2.1" fill="none" stroke="rgba(125,211,252,0.5)" strokeWidth="0.25" />
        <path d="M 0 -1.5 L 0.8 1.1 L 0 0.5 L -0.8 1.1 Z" fill="#5FC0FF" />
        <text y="-2.9" fontSize="1.7" fill="rgba(125,211,252,0.7)" textAnchor="middle" fontFamily="var(--font-mono)">N</text>
      </g>
      <g transform="translate(88 16.5)">
        <path d="M 0 0 L 1.4 0 L 0 1.4 Z" fill="#FCD34D" />
        <circle cx="0.35" cy="0.35" r="0.28" fill="#0B111E" />
        <text x="2.2" y="1" fontSize="1.3" fill="rgba(251,191,36,0.75)" fontFamily="var(--font-mono)">BM-1 EL 100.00'</text>
      </g>
      <g transform="translate(63 74.2)">
        {[0, 1, 2, 3].map(i => <rect key={i} x={i * 4} width="4" height="1.1" fill={i % 2 ? 'rgba(125,211,252,0.75)' : 'rgba(125,211,252,0.18)'} stroke="rgba(125,211,252,0.6)" strokeWidth="0.12" />)}
        <text x="0" y="2.9" fontSize="1.3" fill="rgba(125,211,252,0.6)" fontFamily="var(--font-mono)">0</text>
        <text x="16" y="2.9" fontSize="1.3" fill="rgba(125,211,252,0.6)" textAnchor="end" fontFamily="var(--font-mono)">32'</text>
        <text x="8" y="-0.6" fontSize="1.2" fill="rgba(125,211,252,0.5)" textAnchor="middle" fontFamily="var(--font-mono)">SCALE 1/8" = 1'-0"</text>
      </g>
      {/* devices */}
      {marked && plan.devices.filter(d => layers[d.trade] !== false).map(d => {
        const c = BR_TRADE_COLOR[d.trade] || '#7DD3FC';
        const sel = selected && selected.id === d.id;
        return (
          <g key={d.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(d); }} style={{ cursor: 'pointer' }}>
            {sel && <circle cx={d.x} cy={d.y} r="2.6" fill="none" stroke="#FCD34D" strokeWidth="0.4"><animate attributeName="r" values="2.2;2.9;2.2" dur="1.6s" repeatCount="indefinite" /></circle>}
            <circle cx={d.x} cy={d.y} r="1.7" fill="rgba(11,17,30,0.85)" stroke="none" />
            <circle cx={d.x} cy={d.y} r="1.1" fill="none" stroke={c} strokeWidth="0.35" />
            <circle cx={d.x} cy={d.y} r="0.35" fill={c} />
          </g>
        );
      })}
      {/* symbol legend (marked set) */}
      {marked && (
        <g transform="translate(78 60)">
          <rect x="-1.5" y="-2.6" width="21" height={4 + opp.trades.filter(t => layers[t] !== false && (BR_ITEM_TPL[t] || []).some(x => x[1] !== 'ls')).length * 3} fill="rgba(8,13,24,0.92)" stroke="rgba(125,211,252,0.4)" strokeWidth="0.22" />
          <text fontSize="1.5" fill="rgba(125,211,252,0.7)" fontFamily="var(--font-mono)" letterSpacing="0.3">DEVICE LEGEND</text>
          {opp.trades.filter(t => layers[t] !== false && (BR_ITEM_TPL[t] || []).some(x => x[1] !== 'ls')).map((t, i) => {
            const c = BR_TRADE_COLOR[t] || '#7DD3FC';
            return (
              <g key={t} transform={`translate(0 ${2.2 + i * 3})`}>
                <circle cx="1" cy="-0.5" r="0.9" fill="none" stroke={c} strokeWidth="0.3" /><circle cx="1" cy="-0.5" r="0.3" fill={c} />
                <text x="3" fontSize="1.5" fill={c} fontFamily="var(--font-mono)">{(BR_DEVICE_TAG[t] || 'X')} — {t.toUpperCase().slice(0, 12)}</text>
              </g>
            );
          })}
        </g>
      )}
      {marked && selected && layers[selected.trade] !== false && (
        <g pointerEvents="none">
          <line x1={selected.x + 1.4} y1={selected.y - 1.4} x2={selected.x + 5} y2={selected.y - 4} stroke="#FCD34D" strokeWidth="0.25" />
          <rect x={selected.x + 5} y={selected.y - 6.4} width="9.5" height="3.2" rx="0.5" fill="rgba(251,191,36,0.14)" stroke="#FCD34D" strokeWidth="0.25" />
          <text x={selected.x + 9.75} y={selected.y - 4.1} fontSize="1.8" fill="#FCD34D" textAnchor="middle" fontFamily="var(--font-mono)">{selected.tag}</text>
        </g>
      )}
      {marked ? (
        <g transform="translate(5 71.2)">
          <rect width="38" height="3.8" rx="0.5" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.55)" strokeWidth="0.25" />
          <text x="19" y="2.6" fontSize="1.6" fill="#FCD34D" textAnchor="middle" fontFamily="var(--font-mono)" letterSpacing="0.3">HERMES MARKUP · DIMS FIELD-VERIFIED · SURVEY GRADE</text>
        </g>
      ) : (
        <g transform="translate(5 71.2)">
          <text y="2.6" fontSize="1.6" fill="rgba(125,211,252,0.5)" fontFamily="var(--font-mono)" letterSpacing="0.3">AS ISSUED — NO MARKUP · SCALE 1/8" = 1'-0"</text>
        </g>
      )}
    </svg>
  );
}

function BrBlueprint({ opp, state, update, onClose }) {
  const isMobile = useIsMobile(1100);
  const plan = React.useMemo(() => brPlan(opp), [opp.id]);
  const bom = brBOM(opp, state);
  const rows = brSpecRows(opp);
  const [wipe, setWipe] = React.useState(62);          // % of width showing MARKED
  const [layers, setLayers] = React.useState({});
  const [sel, setSel] = React.useState(null);
  const [specOpen, setSpecOpen] = React.useState(!isMobile);
  const [view, setView] = React.useState({ scale: 1, tx: 0, ty: 0 });
  const drag = React.useRef(null);
  const specRef = React.useRef(null);
  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const zoom = (dir, cx = 0.5, cy = 0.5) => setView(v => {
    const ns = Math.min(4, Math.max(1, v.scale * (dir > 0 ? 1.18 : 0.85)));
    return ns === 1 ? { scale: 1, tx: 0, ty: 0 } : { ...v, scale: ns };
  });
  const onWheel = (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); };
  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty }; };
  const onMove = (e) => { if (!drag.current) return; setView(v => ({ ...v, tx: drag.current.tx + (e.clientX - drag.current.x), ty: drag.current.ty + (e.clientY - drag.current.y) })); };
  const onUp = () => { drag.current = null; };

  const selRow = sel ? rows.find(r => r.id === sel.rowId) : null;
  const selBom = sel ? bom.filter(l => l.rowId === sel.rowId) : [];
  const selQty = selRow ? brQty(selRow, state) : 0;
  const unitPrice = selRow ? (selRow.cost + selRow.hrs * BR_LABOR_RATE) * (1 + (brEstimate(opp, state).marginPct) / 100) : 0;

  const pick = (d) => {
    setSel(d);
    // scroll spec rail to the matching row (no scrollIntoView)
    setTimeout(() => {
      const cont = specRef.current;
      const el = cont && cont.querySelector('[data-spec="' + d.rowId + '"]');
      if (cont && el) cont.scrollTop = Math.max(0, el.offsetTop - cont.offsetTop - 30);
    }, 30);
  };

  return (
    <div className="sw-fade" style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', background: '#070B14' }} data-screen-label={'Blueprint — ' + opp.title}>
      {/* toolbar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(8,11,18,0.9)', flexWrap: 'wrap' }}>
        <Btn kind="secondary" size="sm" icon="back" onClick={onClose}>Bid Room</Btn>
        <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>{opp.title}</span>
        <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-low)' }}>COMBINED PLAN · {plan.devices.length} devices shown</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {opp.trades.filter(t => (BR_ITEM_TPL[t] || []).some(x => x[1] !== 'ls')).map(t => {
            const on = layers[t] !== false;
            const c = BR_TRADE_COLOR[t] || '#7DD3FC';
            return (
              <button key={t} onClick={() => setLayers(p => ({ ...p, [t]: !on }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, cursor: 'pointer', background: on ? `color-mix(in srgb, ${c} 12%, transparent)` : 'rgba(63,169,245,0.03)', border: `1px solid ${on ? c : 'var(--border-subtle)'}`, font: '600 11px/1 var(--font-body)', color: on ? c : 'var(--text-low)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? c : 'var(--text-low)' }} />{t}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn kind="ghost" size="sm" onClick={() => zoom(1)}>＋</Btn>
          <Btn kind="ghost" size="sm" onClick={() => zoom(-1)}>－</Btn>
          <Btn kind="ghost" size="sm" onClick={() => setView({ scale: 1, tx: 0, ty: 0 })}>Fit</Btn>
          <Btn kind={specOpen ? 'secondary' : 'ghost'} size="sm" icon="doc" onClick={() => setSpecOpen(v => !v)}>Spec</Btn>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* plan canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: drag.current ? 'grabbing' : 'grab' }}
          onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          <div style={{ position: 'absolute', inset: 0, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: 'center' }}>
            {/* unmarked base */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <BrPlanSVG opp={opp} plan={plan} marked={false} layers={layers} />
            </div>
            {/* marked layer, clipped by wipe */}
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
              <div style={{ position: 'absolute', inset: 0, background: '#070B14' }}>
                <BrPlanSVG opp={opp} plan={plan} marked layers={layers} selected={sel} onSelect={pick} />
              </div>
            </div>
            {/* wipe line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: wipe + '%', width: 2, background: '#FCD34D', boxShadow: '0 0 12px rgba(251,191,36,0.6)', pointerEvents: 'none' }} />
          </div>
          {/* wipe slider */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 18, width: 'min(420px, 70%)', padding: '10px 16px', borderRadius: 999, background: 'rgba(8,11,18,0.88)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(10px)' }}>
            <span style={{ font: '600 9.5px/1 var(--font-mono)', color: '#FCD34D', letterSpacing: '0.08em' }}>MARKED</span>
            <input type="range" min="0" max="100" value={wipe} onChange={e => setWipe(Number(e.target.value))} onPointerDown={e => e.stopPropagation()} style={{ flex: 1, accentColor: '#FCD34D' }} />
            <span style={{ font: '600 9.5px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.08em' }}>AS ISSUED</span>
          </div>
          {/* device detail popover */}
          {sel && selRow && (
            <div className="sw-up" style={{ position: 'absolute', top: 16, right: 16, width: 300, borderRadius: 'var(--radius-lg)', background: 'rgba(10,15,26,0.96)', border: '1px solid var(--border-strong)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.5)', font: '700 11px/1 var(--font-mono)', color: '#FCD34D' }}>{sel.tag}</span>
                <span style={{ flex: 1, font: '600 12px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{sel.trade}</span>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Icon name="x" size={13} color="var(--text-low)" /></button>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ font: '500 12.5px/1.45 var(--font-body)', color: 'var(--text-high)' }}>{selRow.item}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Spec §', selRow.csi], ['Sheet', selRow.sheet], ['Qty (bid)', selQty + ' ' + selRow.unit], ['Sell / unit', fmt(unitPrice)]].map(([l, v]) => (
                    <div key={l} style={{ padding: '7px 9px', borderRadius: 8, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ font: '600 8.5px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.1em' }}>{l.toUpperCase()}</div>
                      <div style={{ font: '600 12px/1.2 var(--font-mono)', color: 'var(--text-high)', marginTop: 4 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ font: '600 9px/1 var(--font-mono)', color: 'var(--brand)', letterSpacing: '0.1em', marginBottom: 6 }}>BOM LINES</div>
                  {selBom.map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', font: '500 11px/1.4 var(--font-mono)' }}>
                      <span style={{ color: 'var(--brand)' }}>{l.part}</span>
                      <span style={{ color: 'var(--text-mid)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.desc}</span>
                      <span style={{ color: 'var(--text-high)' }}>{fmt(l.ext)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* spec rail — RFP text synced to selection */}
        {specOpen && !isMobile && (
          <div ref={specRef} className="sw-scroll" style={{ width: 330, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', background: '#0B1220', overflowY: 'auto', position: 'relative' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: '#0B1220', zIndex: 2 }}>
              <Eyebrow color="var(--brand)">{brRFP(opp).number} · §1.4 schedules</Eyebrow>
              <div style={{ font: '400 11px/1.5 var(--font-body)', color: 'var(--text-low)', marginTop: 5 }}>Click any device on the plan — the governing spec line lights up here.</div>
            </div>
            {rows.map(r => {
              const hot = sel && sel.rowId === r.id;
              return (
                <div key={r.id} data-spec={r.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)', background: hot ? 'rgba(251,191,36,0.08)' : 'transparent', borderLeft: hot ? '2px solid #FCD34D' : '2px solid transparent' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ font: '600 10.5px/1 var(--font-mono)', color: 'var(--brand)' }}>§{r.csi}</span>
                    <span style={{ font: '600 10px/1 var(--font-mono)', color: 'var(--text-low)' }}>{r.sheet}</span>
                  </div>
                  <div style={{ font: '400 12px/1.55 var(--font-body)', color: hot ? 'var(--text-high)' : 'var(--text-mid)', marginTop: 4 }}>
                    Provide <strong style={{ color: r.drawingQty !== r.rfpQty ? 'var(--status-warn)' : 'var(--text-high)' }}>{r.rfpQty} {r.unit}</strong> — {r.item.toLowerCase()}, installed and tested per manufacturer instructions.
                    {r.drawingQty !== r.rfpQty && <span style={{ color: 'var(--status-warn)' }}> Drawing shows {r.drawingQty}.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BrBlueprint, BrPlanSVG, brPlan, BR_TRADE_COLOR });

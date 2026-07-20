// ============================================================
// ShieldTech Secret Weapon — Bid Room documents
// RFP viewer, drawing sheet renderer (schematic plan + device
// schedule), and the side-by-side Compare view with AI-flagged
// conflicts the user resolves or turns into RFIs.
// ============================================================

/* ─────────── RFP viewer — paper-style document ─────────── */
function BrRfpDoc({ opp, highlightRow, compact }) {
  const rfp = brRFP(opp);
  return (
    <div style={{ background: '#0E1524', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: compact ? '14px 18px' : '20px 26px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ font: '600 10px/1 var(--font-mono)', color: 'var(--brand)', letterSpacing: '0.12em', marginBottom: 6 }}>{rfp.number} · ISSUED {rfp.issued.toUpperCase()}</div>
            <div style={{ font: `700 ${compact ? 15 : 18}px/1.25 var(--font-display)`, color: 'var(--text-high)' }}>REQUEST FOR PROPOSAL — {rfp.title}</div>
            <div style={{ font: '500 12px/1.4 var(--font-body)', color: 'var(--text-mid)', marginTop: 4 }}>{rfp.buyer}</div>
          </div>
          <SyncChip state="connected" label="Synced from source" />
        </div>
      </div>
      <div className="sw-scroll" style={{ maxHeight: compact ? 420 : 560, padding: compact ? '4px 18px 18px' : '6px 26px 26px' }}>
        {rfp.sections.map(sec => (
          <div key={sec.id} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--brand)' }}>{sec.ref}</span>
              <span style={{ font: '700 13.5px/1.3 var(--font-display)', color: 'var(--text-high)', letterSpacing: '0.02em' }}>{sec.title}</span>
            </div>
            {sec.paras.map((p, i) => (
              <p key={i} style={{ font: '400 12.5px/1.65 var(--font-body)', color: 'var(--text-mid)', margin: '0 0 10px' }}>{p}</p>
            ))}
            {sec.specRows && <BrSpecTable rows={sec.specRows} col="rfpQty" highlightRow={highlightRow} caption="Schedule of Quantities (governs for bidding)" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Shared spec / schedule table */
function BrSpecTable({ rows, col, highlightRow, caption, flagged }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', margin: '4px 0 10px' }}>
      {caption && <div style={{ padding: '7px 12px', background: 'rgba(63,169,245,0.05)', borderBottom: '1px solid var(--border-subtle)', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase' }}>{caption}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(63,169,245,0.03)' }}>
            {['Ref', 'Item', 'Qty', 'Unit'].map(h => <th key={h} style={{ textAlign: h === 'Qty' ? 'right' : 'left', padding: '6px 12px', font: '600 10px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const hot = highlightRow === r.id;
            const isFlag = flagged && flagged.has(r.id);
            return (
              <tr key={r.id} id={'spec-' + r.id} style={{ background: hot ? 'rgba(251,191,36,0.10)' : 'transparent', outline: hot ? '1px solid rgba(251,191,36,0.5)' : 'none' }}>
                <td style={{ padding: '7px 12px', font: '500 11px/1.3 var(--font-mono)', color: 'var(--text-low)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{r.csi}</td>
                <td style={{ padding: '7px 12px', font: '400 12px/1.4 var(--font-body)', color: 'var(--text-high)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {r.item}
                  {isFlag && <Icon name="alert" size={12} color="var(--status-warn)" style={{ marginLeft: 6, verticalAlign: -2 }} />}
                </td>
                <td style={{ padding: '7px 12px', font: '600 12px/1.3 var(--font-mono)', color: isFlag ? 'var(--status-warn)' : 'var(--text-high)', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r[col]}</td>
                <td style={{ padding: '7px 12px', font: '500 11px/1.3 var(--font-mono)', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{r.unit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────── Drawing sheet — schematic plan + title block ─────────── */
function BrDrawingSheet({ opp, sheet, highlightRow, marked = true }) {
  const h = brHash(opp.id + sheet.id);
  // deterministic room layout
  const rooms = [];
  let x = 6;
  const widths = [26, 18, 22, 14, 20];
  for (let i = 0; i < 4; i++) { const w = widths[(h + i) % widths.length]; rooms.push({ x, y: 8, w, h: 34 }); x += w + 2; }
  x = 6;
  for (let i = 0; i < 3; i++) { const w = widths[(h + i + 2) % widths.length] + 6; rooms.push({ x, y: 50, w, h: 30 }); x += w + 2; }
  const symFor = BR_TRADE_SYMBOL[sheet.trade] || 'net';
  // device positions inside rooms
  const devices = [];
  const totalShown = Math.min(sheet.rows.reduce((a, r) => a + Math.min(r.drawingQty, 8), 0), 26);
  for (let i = 0; i < totalShown; i++) {
    const rm = rooms[(h + i * 7) % rooms.length];
    devices.push({ x: rm.x + 3 + ((h >>> (i % 8)) + i * 13) % (rm.w - 6), y: rm.y + 4 + ((h >>> ((i + 3) % 8)) + i * 11) % (rm.h - 8) });
  }
  const hotRow = sheet.rows.find(r => r.id === highlightRow);
  return (
    <div style={{ background: '#0B111E', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <svg viewBox="0 0 100 92" style={{ display: 'block', width: '100%' }}>
        {/* sheet border */}
        <rect x="1.2" y="1.2" width="97.6" height="89.6" fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="0.5" />
        <rect x="2.6" y="2.6" width="94.8" height="86.8" fill="none" stroke="rgba(125,211,252,0.18)" strokeWidth="0.25" />
        {/* grid ticks */}
        {[20, 40, 60, 80].map(gx => <text key={gx} x={gx} y="5.4" fontSize="2.2" fill="rgba(125,211,252,0.5)" textAnchor="middle" fontFamily="var(--font-mono)">{String.fromCharCode(64 + gx / 20)}</text>)}
        {/* rooms */}
        {rooms.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(63,169,245,0.025)" stroke="rgba(125,211,252,0.45)" strokeWidth="0.35" />
            <text x={r.x + 1.6} y={r.y + 3.2} fontSize="1.9" fill="rgba(125,211,252,0.55)" fontFamily="var(--font-mono)">{100 + i * 2}</text>
            {/* door notch */}
            <line x1={r.x + r.w / 2 - 2} y1={r.y + r.h} x2={r.x + r.w / 2 + 2} y2={r.y + r.h} stroke="#0B111E" strokeWidth="0.6" />
            <path d={`M ${r.x + r.w / 2 - 2} ${r.y + r.h} A 4 4 0 0 1 ${r.x + r.w / 2 + 2} ${r.y + r.h - 4}`} fill="none" stroke="rgba(125,211,252,0.3)" strokeWidth="0.25" />
          </g>
        ))}
        {/* corridor label */}
        <text x="50" y="46.4" fontSize="2" fill="rgba(125,211,252,0.4)" textAnchor="middle" fontFamily="var(--font-mono)" letterSpacing="1">CORRIDOR</text>
        {/* devices — only on the AI-marked set */}
        {marked && devices.map((d, i) => (
          <g key={i}>
            {symFor === 'cam' && <><circle cx={d.x} cy={d.y} r="1.15" fill="none" stroke="#5FC0FF" strokeWidth="0.35" /><line x1={d.x} y1={d.y} x2={d.x + 1.7} y2={d.y - 1.2} stroke="#5FC0FF" strokeWidth="0.35" /></>}
            {symFor === 'door' && <rect x={d.x - 1} y={d.y - 1} width="2" height="2" fill="none" stroke="#6EE7B7" strokeWidth="0.35" transform={`rotate(45 ${d.x} ${d.y})`} />}
            {symFor === 'zone' && <path d={`M ${d.x} ${d.y - 1.3} L ${d.x + 1.2} ${d.y + 0.9} L ${d.x - 1.2} ${d.y + 0.9} Z`} fill="none" stroke="#FCD34D" strokeWidth="0.35" />}
            {symFor === 'drop' && <><circle cx={d.x} cy={d.y} r="0.5" fill="#A78BFA" /><line x1={d.x} y1={d.y} x2={d.x} y2={d.y - 1.6} stroke="#A78BFA" strokeWidth="0.3" /></>}
            {symFor === 'net' && <rect x={d.x - 1} y={d.y - 0.7} width="2" height="1.4" fill="none" stroke="#7DD3FC" strokeWidth="0.35" />}
            {symFor === 'spk' && <path d={`M ${d.x - 1} ${d.y} L ${d.x} ${d.y} L ${d.x + 1} ${d.y - 1} L ${d.x + 1} ${d.y + 1} L ${d.x} ${d.y} Z`} fill="none" stroke="#FDBA74" strokeWidth="0.3" />}
          </g>
        ))}
        {/* AI callout tags on the first few devices */}
        {marked && devices.slice(0, 6).map((d, i) => (
          <g key={'tag' + i}>
            <line x1={d.x + 1.2} y1={d.y - 1.2} x2={d.x + 4.2} y2={d.y - 3.4} stroke="rgba(251,191,36,0.55)" strokeWidth="0.22" />
            <rect x={d.x + 4.2} y={d.y - 5.4} width="7.4" height="2.9" rx="0.5" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.6)" strokeWidth="0.22" />
            <text x={d.x + 7.9} y={d.y - 3.3} fontSize="1.7" fill="#FCD34D" textAnchor="middle" fontFamily="var(--font-mono)">{(BR_DEVICE_TAG[sheet.trade] || 'X') + '-' + String(i + 1).padStart(2, '0')}</text>
          </g>
        ))}
        {/* markup stamp */}
        {marked && (
          <g transform="translate(6 6)">
            <rect width="26" height="4.6" rx="0.6" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.55)" strokeWidth="0.28" />
            <text x="13" y="3.1" fontSize="1.8" fill="#FCD34D" textAnchor="middle" fontFamily="var(--font-mono)" letterSpacing="0.5">SHIELDTECH AI MARKUP v2</text>
          </g>
        )}
        {/* title block */}
        <g>
          <rect x="2.6" y="82" width="94.8" height="7.4" fill="rgba(63,169,245,0.04)" stroke="rgba(125,211,252,0.35)" strokeWidth="0.3" />
          <line x1="26" y1="82" x2="26" y2="89.4" stroke="rgba(125,211,252,0.25)" strokeWidth="0.25" />
          <line x1="72" y1="82" x2="72" y2="89.4" stroke="rgba(125,211,252,0.25)" strokeWidth="0.25" />
          <text x="4" y="85" fontSize="1.9" fill="rgba(125,211,252,0.7)" fontFamily="var(--font-mono)">SHIELDTECH SECURITY LLC</text>
          <text x="4" y="87.8" fontSize="1.6" fill="rgba(125,211,252,0.45)" fontFamily="var(--font-mono)">BID SET — NOT FOR CONSTRUCTION</text>
          <text x="28" y="85" fontSize="1.9" fill="rgba(226,238,255,0.85)" fontFamily="var(--font-mono)">{sheet.title.toUpperCase()}</text>
          <text x="28" y="87.8" fontSize="1.6" fill="rgba(125,211,252,0.45)" fontFamily="var(--font-mono)">{opp.buyer.toUpperCase().slice(0, 42)}</text>
          <text x="84" y="85.6" fontSize="3.4" fill="#5FC0FF" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold">{sheet.id}</text>
          <text x="84" y="88.2" fontSize="1.5" fill="rgba(125,211,252,0.45)" textAnchor="middle" fontFamily="var(--font-mono)">SCALE 1/8" = 1'-0"</text>
        </g>
      </svg>
      {/* device schedule under the plan — only on the marked set */}
      {marked ? (
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ padding: '7px 12px', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase', background: 'rgba(63,169,245,0.04)' }}>Device schedule — sheet {sheet.id}</div>
        {sheet.rows.map(r => {
          const mismatch = r.drawingQty !== r.rfpQty;
          const hot = highlightRow === r.id;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderTop: '1px solid var(--border-subtle)', background: hot ? 'rgba(251,191,36,0.10)' : 'transparent' }}>
              <span style={{ flex: 1, font: '400 12px/1.4 var(--font-body)', color: 'var(--text-high)', minWidth: 0 }}>{r.item}</span>
              <span style={{ font: `600 12px/1 var(--font-mono)`, color: mismatch ? 'var(--status-warn)' : 'var(--text-high)' }}>{r.drawingQty} {r.unit}</span>
              {mismatch && <Icon name="alert" size={13} color="var(--status-warn)" />}
            </div>
          );
        })}
        {hotRow && hotRow.drawingQty !== hotRow.rfpQty && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', font: '500 11.5px/1.5 var(--font-body)', color: 'var(--status-warn)' }}>
            Schedule shows {hotRow.drawingQty} — RFP §{hotRow.csi} calls for {hotRow.rfpQty}.
          </div>
        )}
      </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '9px 12px', font: '400 11.5px/1.5 var(--font-body)', color: 'var(--text-low)' }}>
          Sheet as issued by the buyer — no ShieldTech markup. Flip to Marked to see SHIELDTECH AI device placement and callouts.
        </div>
      )}
    </div>
  );
}

/* ─────────── Drawings browser (sheet tabs) ─────────── */
function BrDrawings({ opp, highlightRow, activeSheet, onSheet, marked = true }) {
  const sheets = brSheets(opp);
  const cur = sheets.find(s => s.id === activeSheet) || sheets.find(s => s.rows.some(r => r.id === highlightRow)) || sheets[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sheets.map(s => (
          <button key={s.id} onClick={() => onSheet && onSheet(s.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            background: s.id === cur.id ? 'rgba(63,169,245,0.14)' : 'rgba(63,169,245,0.04)',
            border: '1px solid ' + (s.id === cur.id ? 'var(--border-strong)' : 'var(--border-subtle)'),
            color: s.id === cur.id ? 'var(--brand)' : 'var(--text-mid)', font: '600 11.5px/1 var(--font-mono)',
          }}>{s.id}<span style={{ font: '500 10.5px/1 var(--font-body)', color: 'var(--text-low)' }}>{s.trade}</span></button>
        ))}
      </div>
      <BrDrawingSheet opp={opp} sheet={cur} highlightRow={highlightRow} marked={marked} />
    </div>
  );
}

/* ─────────── Compare view — RFP vs drawings + conflict queue ─────────── */
function BrCompare({ opp, state, update }) {
  const isMobile = useIsMobile(1060);
  const aiFlags = brFlags(opp);
  const rows = brSpecRows(opp);
  const flaggedRowIds = new Set(aiFlags.map(f => f.rowId));
  const allFlags = [...aiFlags, ...(state.userFlags || [])];
  const [activeFlag, setActiveFlag] = React.useState(allFlags.find(f => !state.flagState[f.id] || state.flagState[f.id].status === 'open') ? (allFlags.find(f => !state.flagState[f.id] || state.flagState[f.id].status === 'open')).id : (allFlags[0] && allFlags[0].id));
  const [sheet, setSheet] = React.useState(null);
  const [noteRow, setNoteRow] = React.useState('');
  const [noteText, setNoteText] = React.useState('');
  const cur = allFlags.find(f => f.id === activeFlag) || null;
  const hotRow = cur ? cur.rowId : null;

  const setFlag = (id, status, resolution) => update(prev => ({ ...prev, flagState: { ...prev.flagState, [id]: { status, resolution } } }));
  const resolve = (flag, use) => {
    const row = rows.find(r => r.id === flag.rowId);
    update(prev => ({
      ...prev,
      flagState: { ...prev.flagState, [flag.id]: { status: 'resolved', resolution: use } },
      qty: row ? { ...prev.qty, [row.id]: use === 'drawing' ? row.drawingQty : row.rfpQty } : prev.qty,
    }));
    swToast(row ? `Carrying ${use === 'drawing' ? row.drawingQty : row.rfpQty} ${row.unit} in the estimate` : 'Resolved', 'ok');
    advance(flag.id);
  };
  const toRfi = (flag) => {
    const row = rows.find(r => r.id === flag.rowId);
    update(prev => ({
      ...prev,
      flagState: { ...prev.flagState, [flag.id]: { status: 'rfi' } },
      rfis: [...prev.rfis, { id: 'rfi-' + flag.id, q: row ? `§${row.csi} schedules ${row.rfpQty} ${row.unit} of "${row.item}" but sheet ${row.sheet} shows ${row.drawingQty}. Please confirm the governing quantity.` : flag.note, source: 'Document conflict' }],
    }));
    swToast('Added to the RFI queue', 'info');
    advance(flag.id);
  };
  const advance = (doneId) => {
    const next = allFlags.find(f => f.id !== doneId && (!state.flagState[f.id] || state.flagState[f.id].status === 'open'));
    if (next) setActiveFlag(next.id);
  };
  const addUserFlag = () => {
    if (!noteText.trim()) return;
    const id = 'ufl-' + Date.now();
    update(prev => ({ ...prev, userFlags: [...(prev.userFlags || []), { id, rowId: noteRow || null, note: noteText.trim() }] }));
    setNoteText(''); setNoteRow('');
    swToast('Flag added — resolve it before the phase clears', 'info');
  };

  const openCount = allFlags.filter(f => !state.flagState[f.id] || state.flagState[f.id].status === 'open').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {window.BrKeyReqs && <BrKeyReqs opp={opp} />}
      {/* Conflict queue */}
      <Card style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkles" size={15} color="var(--brand)" />
            <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>Conflicts between RFP and drawings</span>
          </div>
          <Pill tone={openCount ? 'Warm' : 'Done'} label={openCount ? `${openCount} open` : 'All resolved'} small dot />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allFlags.map(f => {
            const st = state.flagState[f.id];
            const status = st ? st.status : 'open';
            const active = f.id === activeFlag;
            return (
              <div key={f.id} onClick={() => setActiveFlag(f.id)} className="sw-clickrow" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid ' + (active ? 'rgba(251,191,36,0.45)' : 'var(--border-subtle)'), background: active ? 'rgba(251,191,36,0.05)' : 'rgba(63,169,245,0.02)' }}>
                <Icon name={status === 'open' ? 'alert' : status === 'rfi' ? 'message' : 'checkCircle'} size={15} color={status === 'open' ? 'var(--status-warn)' : status === 'rfi' ? 'var(--brand)' : 'var(--status-ok)'} style={{ marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 12.5px/1.5 var(--font-body)', color: status === 'open' ? 'var(--text-high)' : 'var(--text-mid)' }}>{f.note}</div>
                  {status !== 'open' && <div style={{ font: '500 11px/1.4 var(--font-mono)', color: status === 'rfi' ? 'var(--brand)' : 'var(--status-ok)', marginTop: 3 }}>{status === 'rfi' ? 'Sent to RFI queue' : `Resolved — carrying the ${st.resolution === 'drawing' ? 'drawing' : 'RFP'} quantity`}</div>}
                </div>
                {status === 'open' && f.rowId && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Btn kind="secondary" size="sm" onClick={(e) => { e.stopPropagation(); resolve(f, 'rfp'); }}>Use RFP qty</Btn>
                    <Btn kind="secondary" size="sm" onClick={(e) => { e.stopPropagation(); resolve(f, 'drawing'); }}>Use drawing qty</Btn>
                    <Btn kind="ghost" size="sm" icon="message" onClick={(e) => { e.stopPropagation(); toRfi(f); }}>RFI</Btn>
                  </div>
                )}
                {status === 'open' && !f.rowId && (
                  <Btn kind="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setFlag(f.id, 'resolved', 'note'); advance(f.id); }}>Resolve</Btn>
                )}
              </div>
            );
          })}
          {!allFlags.length && <div style={{ font: '400 13px/1.5 var(--font-body)', color: 'var(--text-low)', padding: 6 }}>No conflicts detected between the RFP schedules and the drawing sets.</div>}
        </div>
        {/* add your own flag */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={noteRow} onChange={e => setNoteRow(e.target.value)} style={{ background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', font: '500 12px/1 var(--font-body)', padding: '8px 10px', maxWidth: 220 }}>
            <option value="">General note</option>
            {rows.map(r => <option key={r.id} value={r.id}>{r.item.slice(0, 40)}</option>)}
          </select>
          <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUserFlag()} placeholder="Flag something the AI missed…" style={{ flex: 1, minWidth: 200, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', font: '400 12.5px/1 var(--font-body)', padding: '9px 12px' }} />
          <Btn kind="secondary" size="sm" icon="flag" onClick={addUserFlag}>Flag</Btn>
        </div>
      </Card>

      {/* Side-by-side docs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Eyebrow>RFP — governing text</Eyebrow>
            {!state.docsReviewed.rfp
              ? <Btn kind="secondary" size="sm" icon="check" onClick={() => update(p => ({ ...p, docsReviewed: { ...p.docsReviewed, rfp: true } }))}>Mark RFP reviewed</Btn>
              : <Pill tone="Done" label="Reviewed" small dot />}
          </div>
          <BrRfpDoc opp={opp} highlightRow={hotRow} compact />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Eyebrow>Drawings — bid set</Eyebrow>
            {!state.docsReviewed.drawings
              ? <Btn kind="secondary" size="sm" icon="check" onClick={() => update(p => ({ ...p, docsReviewed: { ...p.docsReviewed, drawings: true } }))}>Mark drawings reviewed</Btn>
              : <Pill tone="Done" label="Reviewed" small dot />}
          </div>
          <BrDrawings opp={opp} highlightRow={hotRow} activeSheet={sheet} onSheet={setSheet} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BrRfpDoc, BrSpecTable, BrDrawingSheet, BrDrawings, BrCompare });

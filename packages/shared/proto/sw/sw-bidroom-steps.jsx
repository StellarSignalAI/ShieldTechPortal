// ============================================================
// ShieldTech — Leads engine step screens (V3)
// Scope (AI-generated + marked/unmarked drawings) · BOM verify ·
// 3-tier Pricing · customer-facing Proposal · Submit.
// (Qualify lives in sw-bidroom-v2.jsx.)
// ============================================================

function BrCheckRow({ done, label, sub, onToggle, cta }) {
  return (
    <div onClick={onToggle} className={onToggle ? 'sw-clickrow' : ''} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 13px', borderRadius: 10, border: '1px solid ' + (done ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'), background: done ? 'rgba(52,211,153,0.05)' : 'rgba(63,169,245,0.02)', cursor: onToggle ? 'pointer' : 'default' }}>
      <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--status-ok)' : 'transparent', border: done ? 'none' : '1.5px solid var(--border-strong)' }}>
        {done && <Icon name="check" size={12} color="#03121F" />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 13px/1.35 var(--font-body)', color: 'var(--text-high)' }}>{label}</div>
        {sub && <div style={{ font: '400 12px/1.5 var(--font-body)', color: 'var(--text-mid)', marginTop: 3 }}>{sub}</div>}
      </div>
      {cta}
    </div>
  );
}

/* ─────────── 2 · Scope — AI pre-generated ─────────── */
function BrStepScope({ opp, state, update }) {
  const isMobile = useIsMobile(1060);
  const counts = brDeviceCounts(opp, state);
  const totalDevices = counts.reduce((a, c) => a + c.devices, 0);
  const aiFlags = brFlags(opp);
  const allFlags = [...aiFlags, ...(state.userFlags || [])];
  const ambs = brAmbiguities(opp);
  const rows = brSpecRows(opp);
  const [docTab, setDocTab] = React.useState('marked');   // 'marked' | 'clean' | 'rfp'
  const [sheet, setSheet] = React.useState(null);

  const resolve = (flag, use) => {
    const row = rows.find(r => r.id === flag.rowId);
    update(prev => ({
      ...prev,
      flagState: { ...prev.flagState, [flag.id]: { status: 'resolved', resolution: use } },
      qty: row ? { ...prev.qty, [row.id]: use === 'drawing' ? row.drawingQty : row.rfpQty } : prev.qty,
    }));
    swToast(row ? `Carrying ${use === 'drawing' ? row.drawingQty : row.rfpQty} ${row.unit} through BOM and pricing` : 'Resolved', 'ok');
  };
  const toRfi = (flag) => {
    const row = rows.find(r => r.id === flag.rowId);
    update(prev => ({
      ...prev,
      flagState: { ...prev.flagState, [flag.id]: { status: 'rfi' } },
      rfis: [...prev.rfis, { id: 'rfi-' + flag.id, q: row ? `§${row.csi} schedules ${row.rfpQty} ${row.unit} of "${row.item}" but sheet ${row.sheet} shows ${row.drawingQty}. Please confirm the governing quantity.` : flag.note, source: 'Document conflict' }],
    }));
    swToast('Added to the RFI queue', 'info');
  };
  const setAmb = (id, val, note) => {
    update(p => {
      const next = { ...p, scope: { ...p.scope, [id]: val } };
      if (val === 'clarify' && !p.rfis.some(r => r.id === 'rfi-sc-' + id)) {
        next.rfis = [...p.rfis, { id: 'rfi-sc-' + id, q: note || 'Please clarify scope responsibility for this item.', source: 'Scope review' }];
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {window.BrKeyReqs && <BrKeyReqs opp={opp} />}

      {/* Device counts — the numbers */}
      <Card style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Icon name="sparkles" size={15} color="var(--brand)" />
          <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>Device takeoff — counted from the drawings</span>
          <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-low)' }}>— generated before you opened this lead</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`, gap: 10 }}>
          <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)' }}>
            <div style={{ font: '700 24px/1 var(--font-display)', color: 'var(--brand)' }}>{totalDevices}</div>
            <div style={{ font: '600 9.5px/1.3 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>Total devices</div>
          </div>
          {counts.map(c => (
            <div key={c.trade} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ font: '700 24px/1 var(--font-display)', color: 'var(--text-high)' }}>{c.devices}</div>
              <div style={{ font: '600 9.5px/1.3 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>{c.trade}</div>
              <div style={{ font: '500 9.5px/1 var(--font-mono)', color: 'var(--text-mid)', marginTop: 3 }}>sheet {c.sheet}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI scope of work per trade */}
      <Card style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="doc" size={15} color="var(--brand)" />
          <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>Scope of work — written by HERMES, approved by you</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opp.trades.map(trade => {
            const ok = (state.scopeApproved || {})[trade];
            return (
              <div key={trade} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 10, border: '1px solid ' + (ok ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'), background: ok ? 'rgba(52,211,153,0.04)' : 'rgba(63,169,245,0.02)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ font: '700 12px/1 var(--font-mono)', color: 'var(--brand)', letterSpacing: '0.06em', marginBottom: 6 }}>{trade.toUpperCase()}</div>
                  <div style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'var(--text-mid)' }}>{brScopeText(opp, trade, state)}</div>
                </div>
                <Btn kind={ok ? 'success' : 'secondary'} size="sm" icon="check"
                  onClick={() => update(p => ({ ...p, scopeApproved: { ...(p.scopeApproved || {}), [trade]: !ok } }))}>
                  {ok ? 'Approved' : 'Approve scope'}
                </Btn>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Drawings: marked vs clean vs RFP */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['marked', 'Marked drawings', 'sparkles'], ['clean', 'Unmarked (as issued)', 'doc'], ['rfp', 'RFP text', 'list']].map(([id, l, ic]) => (
              <button key={id} onClick={() => setDocTab(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: docTab === id ? 'rgba(63,169,245,0.14)' : 'rgba(63,169,245,0.04)', border: '1px solid ' + (docTab === id ? 'var(--border-strong)' : 'var(--border-subtle)'), color: docTab === id ? 'var(--brand)' : 'var(--text-mid)', font: '600 12px/1 var(--font-body)' }}>
                <Icon name={ic} size={13} color={docTab === id ? 'var(--brand)' : 'var(--text-low)'} />{l}
              </button>
            ))}
          </div>
          {!state.docsReviewed.drawings
            ? <Btn kind="secondary" size="sm" icon="check" onClick={() => update(p => ({ ...p, docsReviewed: { ...p.docsReviewed, drawings: true } }))}>Mark markups reviewed</Btn>
            : <Pill tone="Done" label="Markups reviewed" small dot />}
        </div>
        {docTab === 'rfp'
          ? <BrRfpDoc opp={opp} compact />
          : <BrDrawings opp={opp} marked={docTab === 'marked'} activeSheet={sheet} onSheet={setSheet} />}
        {docTab === 'marked' && <div style={{ font: '400 11.5px/1.5 var(--font-body)', color: 'var(--text-low)', marginTop: 7 }}>Device symbols and callouts placed by HERMES from the RFP schedules — flip to Unmarked to see the sheet exactly as the buyer issued it.</div>}
      </div>

      {/* Conflicts */}
      {allFlags.length > 0 && (
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert" size={15} color="var(--status-warn)" />
              <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>Conflicts the AI caught</span>
            </div>
            <Pill tone={allFlags.some(f => !state.flagState[f.id] || state.flagState[f.id].status === 'open') ? 'Warm' : 'Done'} label={`${allFlags.filter(f => state.flagState[f.id] && state.flagState[f.id].status !== 'open').length}/${allFlags.length} resolved`} small dot />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allFlags.map(f => {
              const st = state.flagState[f.id];
              const status = st ? st.status : 'open';
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.02)', flexWrap: 'wrap' }}>
                  <Icon name={status === 'open' ? 'alert' : status === 'rfi' ? 'message' : 'checkCircle'} size={15} color={status === 'open' ? 'var(--status-warn)' : status === 'rfi' ? 'var(--brand)' : 'var(--status-ok)'} style={{ marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ font: '500 12.5px/1.5 var(--font-body)', color: status === 'open' ? 'var(--text-high)' : 'var(--text-mid)' }}>{f.note}</div>
                    {status !== 'open' && <div style={{ font: '500 11px/1.4 var(--font-mono)', color: status === 'rfi' ? 'var(--brand)' : 'var(--status-ok)', marginTop: 3 }}>{status === 'rfi' ? 'Sent to RFI queue' : `Resolved — carrying the ${st.resolution === 'drawing' ? 'drawing' : 'RFP'} quantity`}</div>}
                  </div>
                  {status === 'open' && f.rowId && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <Btn kind="secondary" size="sm" onClick={() => resolve(f, 'rfp')}>Use RFP qty</Btn>
                      <Btn kind="secondary" size="sm" onClick={() => resolve(f, 'drawing')}>Use drawing qty</Btn>
                      <Btn kind="ghost" size="sm" icon="message" onClick={() => toRfi(f)}>RFI</Btn>
                    </div>
                  )}
                  {status === 'open' && !f.rowId && (
                    <Btn kind="secondary" size="sm" onClick={() => update(p => ({ ...p, flagState: { ...p.flagState, [f.id]: { status: 'resolved', resolution: 'note' } } }))}>Resolve</Btn>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Open items needing a human call */}
      <Card style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="user" size={15} color="var(--brand)" />
          <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>Needs your call — in, out, or ask</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ambs.map(a => {
            const val = state.scope[a.id];
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.02)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ font: '600 12.5px/1.4 var(--font-body)', color: 'var(--text-high)' }}>{a.item}</div>
                  <div style={{ font: '400 12px/1.5 var(--font-body)', color: 'var(--text-mid)', marginTop: 3 }}>{a.note}</div>
                  <div style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--brand)', marginTop: 5 }}>AI suggests: {a.suggest.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {[['include', 'In', 'var(--status-ok)'], ['exclude', 'Out', 'var(--status-critical)'], ['clarify', 'RFI', 'var(--brand)']].map(([v, l, c]) => (
                    <button key={v} onClick={() => setAmb(a.id, v, a.note)} style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', font: '600 11.5px/1 var(--font-body)', background: val === v ? `color-mix(in srgb, ${c} 16%, transparent)` : 'rgba(63,169,245,0.04)', border: '1px solid ' + (val === v ? `color-mix(in srgb, ${c} 45%, transparent)` : 'var(--border-subtle)'), color: val === v ? c : 'var(--text-mid)' }}>{l}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {state.rfis.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)' }}>
            <Eyebrow color="var(--brand)">RFI queue — {state.rfis.length} for the buyer portal</Eyebrow>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, font: '400 12px/1.6 var(--font-body)', color: 'var(--text-mid)' }}>
              {state.rfis.map((r, i) => <li key={r.id}>RFI-{String(i + 1).padStart(2, '0')} — {r.q}</li>)}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─────────── 3 · BOM verify ─────────── */
function BrStepBom({ opp, state, update }) {
  const lines = brBOM(opp, state);
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const grouped = {};
  lines.forEach(l => { (grouped[l.trade] = grouped[l.trade] || []).push(l); });
  const done = lines.filter(l => (state.bom || {})[l.id]).length;
  const total = lines.reduce((a, l) => a + l.ext, 0);
  const verify = (id) => update(p => ({ ...p, bom: { ...(p.bom || {}), [id]: !(p.bom || {})[id] } }));
  const verifyTrade = (trade) => update(p => {
    const next = { ...(p.bom || {}) };
    grouped[trade].forEach(l => next[l.id] = true);
    return { ...p, bom: next };
  });
  const setQty = (l, val) => update(p => ({ ...p, qty: { ...p.qty, [l.rowId]: Math.max(0, Math.round(Number(val) || 0)) }, estimateLocked: false }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Icon name="sparkles" size={16} color="var(--brand)" />
        <div style={{ flex: 1, minWidth: 220, font: '400 12.5px/1.55 var(--font-body)', color: 'var(--text-mid)' }}>
          <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>HERMES built this BOM from the approved scope</span> — {lines.length} lines across {Object.keys(grouped).length} trades. Verify every line; edit a quantity and it flows through pricing and the proposal.
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: '700 17px/1 var(--font-display)', color: 'var(--text-high)' }}>{fmt(total)}</div>
            <div style={{ font: '500 9.5px/1 var(--font-body)', color: 'var(--text-low)', letterSpacing: '0.1em', marginTop: 4 }}>MATERIAL TOTAL</div>
          </div>
          <ProgressRing value={Math.round((done / Math.max(lines.length, 1)) * 100)} size={44} stroke={5} label={`${done}/${lines.length}`} color={done === lines.length ? 'var(--status-ok)' : 'var(--brand)'} />
        </div>
      </Card>
      {Object.entries(grouped).map(([trade, list]) => {
        const tDone = list.every(l => (state.bom || {})[l.id]);
        return (
          <Card key={trade} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eyebrow color="var(--brand)">{trade}</Eyebrow>
              <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-low)' }}>{(BR_BOM_META[trade] || BR_BOM_META['_generic']).mfr}</span>
              <span style={{ marginLeft: 'auto', font: '600 11.5px/1 var(--font-mono)', color: 'var(--text-high)' }}>{fmt(list.reduce((a, l) => a + l.ext, 0))}</span>
              <Btn kind={tDone ? 'success' : 'secondary'} size="sm" icon="check" onClick={() => verifyTrade(trade)}>{tDone ? 'Verified' : 'Verify all'}</Btn>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['✓', 'Part #', 'Description', 'Qty', 'Unit cost', 'Ext'].map((hd, i) => <th key={hd} style={{ textAlign: i >= 3 ? 'right' : 'left', padding: '7px 14px', font: '600 10px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-subtle)', width: i === 0 ? 34 : undefined }}>{hd === '✓' ? '' : hd.toUpperCase()}</th>)}</tr>
              </thead>
              <tbody>
                {list.map(l => {
                  const ok = (state.bom || {})[l.id];
                  return (
                    <tr key={l.id} style={{ background: ok ? 'rgba(52,211,153,0.03)' : 'transparent' }}>
                      <td style={{ padding: '7px 8px 7px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <button onClick={() => verify(l.id)} style={{ width: 18, height: 18, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? 'var(--status-ok)' : 'transparent', border: ok ? 'none' : '1.5px solid var(--border-strong)' }}>{ok && <Icon name="check" size={11} color="#03121F" />}</button>
                      </td>
                      <td style={{ padding: '7px 14px', font: '600 11.5px/1.3 var(--font-mono)', color: 'var(--brand)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{l.part}</td>
                      <td style={{ padding: '7px 14px', font: '400 12px/1.4 var(--font-body)', color: 'var(--text-high)', borderBottom: '1px solid var(--border-subtle)' }}>{l.desc}</td>
                      <td style={{ padding: '7px 14px', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>
                        {l.kind === 'device'
                          ? <input type="number" value={l.qty} onChange={e => setQty(l, e.target.value)} style={{ width: 58, textAlign: 'right', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', font: '600 12px/1 var(--font-mono)', padding: '5px 7px' }} />
                          : <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-mid)' }}>{l.qty}</span>}
                      </td>
                      <td style={{ padding: '7px 14px', textAlign: 'right', font: '500 12px/1 var(--font-mono)', color: 'var(--text-mid)', borderBottom: '1px solid var(--border-subtle)' }}>{fmt(l.unitCost)}</td>
                      <td style={{ padding: '7px 14px', textAlign: 'right', font: '600 12px/1 var(--font-mono)', color: 'var(--text-high)', borderBottom: '1px solid var(--border-subtle)' }}>{fmt(l.ext)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────── 4 · Pricing — internal numbers + 3 tiers ─────────── */
function BrStepPricing({ opp, state, update }) {
  const est = brEstimate(opp, state);
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const intel = window.brIntel ? brIntel(opp) : null;
  const rec = intel ? (intel.incumbent || intel.bidders > 6 ? 'low' : intel.bidders <= 4 && !intel.incumbent ? 'aggressive' : 'medium') : 'medium';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Internal numbers */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="lock" size={14} color="var(--status-warn)" />
          <Eyebrow color="var(--status-warn)">Internal numbers — never leaves this screen</Eyebrow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[['Material (BOM)', est.material], ['Labor · ' + Math.round(est.laborHrs) + ' hrs', est.labor], ['Equipment & lifts', est.equip], ['PM & engineering', est.pm], ['Total cost', est.subtotal]].map(([l, n], i, arr) => (
            <div key={l} style={{ padding: '12px 14px', borderRadius: 10, background: i === arr.length - 1 ? 'rgba(63,169,245,0.08)' : 'rgba(63,169,245,0.03)', border: '1px solid ' + (i === arr.length - 1 ? 'var(--border-strong)' : 'var(--border-subtle)') }}>
              <div style={{ font: '700 17px/1 var(--font-display)', color: i === arr.length - 1 ? 'var(--brand)' : 'var(--text-high)' }}>{fmt(n)}</div>
              <div style={{ font: '600 9.5px/1.3 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tiers */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ font: '700 13.5px/1 var(--font-display)', color: 'var(--text-high)' }}>Pick your number</span>
          {intel && <span style={{ font: '500 11.5px/1.4 var(--font-body)', color: 'var(--text-low)' }}>— ~{intel.bidders} likely bidders{intel.incumbent ? ', incumbent in the field' : ', no incumbent'} → HERMES recommends <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{BR_TIERS.find(t => t.id === rec).label}</span></span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {BR_TIERS.map(t => {
            const price = est.subtotal * (1 + t.margin / 100);
            const on = state.tier === t.id;
            const isRec = t.id === rec;
            return (
              <div key={t.id} onClick={() => { update({ tier: t.id, estimateLocked: false }); swToast(`${t.label} tier selected — ${fmt(price)}`, 'info'); }} className="sw-clickrow"
                style={{ position: 'relative', padding: '18px 16px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: on ? 'rgba(63,169,245,0.09)' : 'var(--card, rgba(63,169,245,0.02))', border: on ? '1.5px solid var(--brand)' : '1px solid var(--border-subtle)' }}>
                {isRec && <span style={{ position: 'absolute', top: -9, left: 14, padding: '3px 9px', borderRadius: 999, background: 'var(--brand)', color: '#03121F', font: '700 9px/1 var(--font-mono)', letterSpacing: '0.1em' }}>AI PICK</span>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ font: '700 13px/1 var(--font-display)', color: on ? 'var(--brand)' : 'var(--text-high)', letterSpacing: '0.04em' }}>{t.label.toUpperCase()}</span>
                  <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.06em' }}>{t.tag.toUpperCase()}</span>
                </div>
                <div style={{ font: '700 26px/1 var(--font-display)', color: 'var(--text-high)', margin: '14px 0 4px' }}>{fmt(price)}</div>
                <div style={{ font: '500 11px/1.4 var(--font-mono)', color: 'var(--text-mid)' }}>{t.margin}% margin · {fmt(price - est.subtotal)} gross</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.1)', overflow: 'hidden' }}><div style={{ width: t.winP + '%', height: '100%', borderRadius: 3, background: t.winP >= 50 ? 'var(--status-ok)' : t.winP >= 35 ? 'var(--status-warn)' : 'var(--status-critical)' }} /></div>
                  <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--text-mid)' }}>~{t.winP}% win</span>
                </div>
                <div style={{ font: '400 11.5px/1.55 var(--font-body)', color: 'var(--text-low)' }}>{t.note}</div>
                {on && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, font: '600 11px/1 var(--font-mono)', color: 'var(--brand)' }}><Icon name="checkCircle" size={13} color="var(--brand)" />SELECTED</div>}
              </div>
            );
          })}
        </div>
      </div>

      <Btn kind={state.estimateLocked ? 'success' : 'primary'} icon={state.estimateLocked ? 'checkCircle' : 'lock'} full size="lg" disabled={!state.tier}
        onClick={() => { update({ estimateLocked: !state.estimateLocked }); swToast(state.estimateLocked ? 'Number unlocked' : 'Locked at ' + fmt(est.total) + ' — flows into the proposal', state.estimateLocked ? 'info' : 'ok'); }}>
        {!state.tier ? 'Select a tier to lock the number' : state.estimateLocked ? `Locked at ${fmt(est.total)} — tap to unlock` : `Lock ${BR_TIERS.find(t => t.id === state.tier).label} tier at ${fmt(est.total)}`}
      </Btn>
    </div>
  );
}

/* ─────────── 5 · Proposal — customer-facing doc ─────────── */
function BrProposalDoc({ opp, state }) {
  const est = brEstimate(opp, state);
  const counts = brDeviceCounts(opp, state);
  const excluded = brAmbiguities(opp).filter(a => state.scope[a.id] === 'exclude');
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const S = { h: { font: '700 13px/1.3 var(--font-display)', color: '#10233B', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '22px 0 8px', borderBottom: '2px solid #10233B', paddingBottom: 5 }, p: { font: '400 12.5px/1.65 Georgia, serif', color: '#2A3648', margin: '0 0 10px' } };
  return (
    <div style={{ background: '#F7F5F0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 18px 44px -18px rgba(0,0,0,0.6)' }}>
      <div style={{ padding: '26px 32px 20px', background: '#10233B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ font: '800 19px/1 var(--font-display)', color: '#FFFFFF', letterSpacing: '0.06em' }}>SHIELDTECH SECURITY</div>
            <div style={{ font: '500 10px/1 var(--font-mono)', color: '#7FB3E0', letterSpacing: '0.16em', marginTop: 6 }}>SYSTEMS INTEGRATION · LIC #NJ-34-8812</div>
          </div>
          <div style={{ textAlign: 'right', font: '500 10.5px/1.6 var(--font-mono)', color: '#9DBEDC' }}>PROPOSAL {brRFP(opp).number.replace('RFP', 'STP')}<br />July 5, 2026 · Valid 60 days</div>
        </div>
      </div>
      <div style={{ padding: '22px 32px 30px' }}>
        <p style={S.p}><strong>{opp.buyer}</strong><br />Re: {opp.title} — Proposal for {opp.trades.join(', ')} Systems</p>
        <p style={S.p}>ShieldTech Security is pleased to submit this proposal for the complete, code-compliant installation of the security systems specified in {brRFP(opp).number}. Our approach was engineered directly from your bid documents — every device below is counted from the issued drawings and cross-checked against the specification schedules.</p>
        <div style={S.h}>Scope of Work</div>
        {opp.trades.map(trade => (
          <p key={trade} style={S.p}><strong>{trade}.</strong> {brScopeText(opp, trade, state)}</p>
        ))}
        <div style={S.h}>System Summary</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 8px' }}>
          <thead><tr>{['System', 'Devices', 'Drawing ref'].map(h => <th key={h} style={{ textAlign: h === 'Devices' ? 'right' : 'left', padding: '6px 10px', font: '700 10px/1 var(--font-mono)', color: '#5A6B82', letterSpacing: '0.08em', borderBottom: '1.5px solid #10233B' }}>{h.toUpperCase()}</th>)}</tr></thead>
          <tbody>
            {counts.map(c => (
              <tr key={c.trade}>
                <td style={{ padding: '7px 10px', font: '400 12px/1.4 Georgia, serif', color: '#2A3648', borderBottom: '1px solid #D8D2C4' }}>{c.trade}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', font: '600 12px/1 var(--font-mono)', color: '#10233B', borderBottom: '1px solid #D8D2C4' }}>{c.devices || '—'}</td>
                <td style={{ padding: '7px 10px', font: '500 11px/1 var(--font-mono)', color: '#5A6B82', borderBottom: '1px solid #D8D2C4' }}>{c.sheet}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={S.h}>Investment</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 16px', background: '#10233B', borderRadius: 8, margin: '4px 0 10px' }}>
          <span style={{ font: '600 12px/1 var(--font-body)', color: '#9DBEDC', letterSpacing: '0.06em' }}>TOTAL — FURNISHED, INSTALLED & COMMISSIONED</span>
          <span style={{ font: '800 22px/1 var(--font-display)', color: '#FFFFFF' }}>{fmt(est.total)}</span>
        </div>
        <p style={{ ...S.p, fontSize: 11.5 }}>Includes all equipment, installation labor, programming, testing, commissioning, owner training, one (1) year parts-and-labor warranty, and closeout documentation. Applicable bonds per §2.1 included.</p>
        {(excluded.length > 0 || state.rfis.length > 0) && <>
          <div style={S.h}>Clarifications & Exclusions</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {excluded.map(r => <li key={r.id} style={{ ...S.p, marginBottom: 4 }}>Excluded: {r.item}</li>)}
            {state.rfis.map((r, i) => <li key={r.id} style={{ ...S.p, marginBottom: 4 }}>Subject to clarification RFI-{String(i + 1).padStart(2, '0')} pending with the Owner</li>)}
          </ul>
        </>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 26, paddingTop: 14, borderTop: '1px solid #D8D2C4', flexWrap: 'wrap' }}>
          <div style={{ font: '400 11.5px/1.6 Georgia, serif', color: '#2A3648' }}>Daniel Graham<br /><span style={{ color: '#5A6B82', fontSize: 10.5 }}>Principal · ShieldTech Security LLC</span></div>
          <div style={{ font: '400 11.5px/1.6 Georgia, serif', color: '#2A3648', textAlign: 'right' }}>Accepted by: ______________________<br /><span style={{ color: '#5A6B82', fontSize: 10.5 }}>{opp.buyer} · Date</span></div>
        </div>
      </div>
    </div>
  );
}

function BrStepProposal({ opp, state, update }) {
  const isMobile = useIsMobile(1100);
  const checks = brChecklist(opp);
  const excluded = brAmbiguities(opp).filter(a => state.scope[a.id] === 'exclude');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <Eyebrow>Package checklist — from RFP §2.1</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {checks.map(c => (
              <BrCheckRow key={c.id} done={!!state.proposal[c.id]} label={c.label} sub={c.hint}
                onToggle={() => update(p => ({ ...p, proposal: { ...p.proposal, [c.id]: !p.proposal[c.id] } }))} />
            ))}
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <Eyebrow color="var(--brand)">Exceptions form — auto-built</Eyebrow>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, font: '400 12px/1.6 var(--font-body)', color: 'var(--text-mid)' }}>
            {excluded.map(r => <li key={r.id}>Excluded: {r.item}</li>)}
            {state.rfis.map((r, i) => <li key={r.id}>Clarification RFI-{String(i + 1).padStart(2, '0')} pending</li>)}
            {!excluded.length && !state.rfis.length && <li>No exceptions — bidding the scope as documented.</li>}
          </ul>
        </Card>
        <Btn kind={state.coverLetter ? 'success' : 'primary'} icon="check" size="lg" full disabled={!state.estimateLocked}
          onClick={() => { update({ coverLetter: state.coverLetter ? null : 'approved' }); swToast(state.coverLetter ? 'Approval withdrawn' : 'Customer proposal approved', state.coverLetter ? 'info' : 'ok'); }}>
          {!state.estimateLocked ? 'Lock pricing first' : state.coverLetter ? 'Proposal approved — tap to reopen' : 'Approve customer proposal'}
        </Btn>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name="doc" size={14} color="var(--brand)" />
          <Eyebrow color="var(--brand)">Exactly what the buyer receives</Eyebrow>
          {state.coverLetter && <Pill tone="Done" label="Approved" small dot />}
        </div>
        <BrProposalDoc opp={opp} state={state} />
      </div>
    </div>
  );
}

/* ─────────── 6 · Submit ─────────── */
function BrStepSubmit({ opp, state, update }) {
  const phases = brPhaseParts(opp, state);
  const est = brEstimate(opp, state);
  const due = new Date(opp.dueAt);
  const now = new Date(window.SW.TODAY + 'T08:00:00Z');
  const hoursLeft = Math.max(0, Math.round((due - now) / 3600000));
  const gatesOk = phases.slice(0, 5).every(p => p.done);
  const method = /portal|eVA|eMMA|PennBid|BidNet|SAM/i.test(opp.source) ? 'Electronic — buyer portal upload' : 'Sealed — email PDF + originals by courier';
  if (state.submitted) {
    return (
      <EmptyState icon="checkCircle" title="Bid submitted" accent="var(--status-ok)"
        body={`${opp.title} went in at $${Math.round(est.total).toLocaleString()} on ${new Date(state.submitted.at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Follow-up task added: confirm receipt with ${opp.poc.name}.`}>
        <Btn kind="secondary" icon="refresh" onClick={() => update({ submitted: null })}>Reopen (undo)</Btn>
      </EmptyState>
    );
  }
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Eyebrow>Final compliance gate</Eyebrow>
          <span style={{ font: '600 12px/1 var(--font-mono)', color: hoursLeft < 48 ? 'var(--status-critical)' : 'var(--status-warn)' }}>{hoursLeft < 96 ? hoursLeft + ' hrs to deadline' : swDueLabel(opp.dueAt)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {phases.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: p.done ? 'rgba(52,211,153,0.05)' : 'rgba(251,191,36,0.05)', border: '1px solid ' + (p.done ? 'rgba(52,211,153,0.28)' : 'rgba(251,191,36,0.3)') }}>
              <Icon name={p.done ? 'checkCircle' : 'alert'} size={15} color={p.done ? 'var(--status-ok)' : 'var(--status-warn)'} />
              <span style={{ flex: 1, font: '600 12.5px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{p.label}</span>
              <span style={{ font: '500 11px/1.3 var(--font-mono)', color: p.done ? 'var(--status-ok)' : 'var(--status-warn)', textAlign: 'right' }}>{p.done ? 'Complete' : p.parts.filter(x => !x.done).map(x => x.label).join(' · ')}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ padding: 16 }}>
        <FieldRow label="Bid price" icon="dollar"><span style={{ font: '700 16px/1 var(--font-display)', color: 'var(--brand)' }}>${Math.round(est.total).toLocaleString()}{state.tier ? ' · ' + BR_TIERS.find(t => t.id === state.tier).label + ' tier' : ''}</span></FieldRow>
        <FieldRow label="Method" icon="send">{method}</FieldRow>
        <FieldRow label="Deadline" icon="clock">{due.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })} · {due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} local</FieldRow>
        <FieldRow label="Receipt" icon="phone">Confirm with {opp.poc.name}{opp.poc.phone ? ' · ' + opp.poc.phone : ''}</FieldRow>
      </Card>
      <Btn kind="primary" size="lg" icon="send" full disabled={!gatesOk}
        onClick={() => { update({ submitted: { at: new Date().toISOString(), method } }); swToast('Bid submitted — receipt follow-up queued', 'ok'); }}>
        {gatesOk ? 'Submit bid' : 'Clear the gates above to submit'}
      </Btn>
    </div>
  );
}

Object.assign(window, { BrCheckRow, BrStepScope, BrStepBom, BrStepPricing, BrProposalDoc, BrStepProposal, BrStepSubmit });

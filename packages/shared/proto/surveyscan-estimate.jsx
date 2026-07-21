/* Survey Scan — on-site Estimate tab: quantities from geometry, price list from
   the Product Library, cost rules, scope of work builder, T&M, statuses & exports. */

function SV2Estimate({ project, update, onNav }) {
  const [sub, setSub] = React.useState('Quote');
  const e = svEstimate(project);
  const est = project.estimate || {};
  const setEst = patch => update({ ...project, estimate: { ...est, ...patch } });
  const money = n => '$' + Math.round(n).toLocaleString();

  const cycleStatus = () => {
    const next = SV_EST_STATUSES[(SV_EST_STATUSES.indexOf(e.status) + 1) % SV_EST_STATUSES.length];
    setEst({ status: next });
    showToast(`Estimate marked ${next}`, 'ok');
  };

  const rule = (label, key, unit, min, max, step) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px' }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-mid)', width: 76, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={est[key] ?? (key === 'markup' ? 32 : key === 'tax' ? 8.25 : 0)}
        onChange={ev => setEst({ [key]: Number(ev.target.value) })} style={{ flex: 1, accentColor: 'var(--brand)' }} />
      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand)', width: 56, textAlign: 'right' }}>{key === 'discount' ? money(est[key] || 0) : (est[key] ?? (key === 'markup' ? 32 : 8.25)) + unit}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <MSegment options={['Quote', 'Quantities', 'Scope']} value={sub} onChange={setSub} />

      {sub === 'Quote' && <>
        {/* status + total header */}
        <div className="glass" style={{ padding: '13px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--text-low)' }}>ESTIMATE TOTAL</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-high)' }}>{money(e.total)}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>Price list: ShieldTech Product Library · {SS_RATE}/hr labor</div>
          </div>
          <button onClick={cycleStatus} style={{ padding: '8px 14px', borderRadius: 18, border: `1px solid ${svStatusColor(e.status)}55`, background: svStatusColor(e.status) + '18', color: svStatusColor(e.status), fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{e.status} ↻</button>
        </div>

        <MSection title="Hardware & labor — auto from plan">
          {e.bom.map(b => (
            <div key={b.sku} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand)', width: 22, flexShrink: 0 }}>{b.qty}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1, minWidth: 0 }}>{b.desc}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-high)', flexShrink: 0 }}>{money(b.qty * b.unit)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', padding: '6px 2px', fontSize: 11 }}>
            <span style={{ color: 'var(--text-mid)', flex: 1 }}>Labor — {e.laborHrs.toFixed(1)}h from device install times</span>
            <span className="mono" style={{ color: 'var(--text-high)' }}>{money(e.labor)}</span>
          </div>
        </MSection>

        <MSection title="Extras & T&M">
          {e.extras.map(x => (
            <div key={x.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: '#c084fc', width: 30, flexShrink: 0 }}>{x.qty}×</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1 }}>{x.desc}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-high)' }}>{money(x.qty * x.unit)}</span>
            </div>
          ))}
          {(est.tm || []).map(x => (
            <div key={x.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: '#FBBF24', width: 30, flexShrink: 0 }}>{x.hrs}h</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1 }}>{x.desc}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-high)' }}>{money(x.hrs * (x.rate || SS_RATE))}</span>
            </div>
          ))}
          <button onClick={() => setEst({ extras: [...e.extras, { id: ssId('x'), desc: 'Custom line item', qty: 1, unit: 250 }] })} style={{ width: '100%', marginTop: 4, padding: '9px 0', borderRadius: 9, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>＋ Line item from Product Library</button>
        </MSection>

        <MSection title="Cost rules">
          <div className="glass" style={{ padding: '6px 12px', borderRadius: 11 }}>
            {rule('Markup', 'markup', '%', 0, 60, 1)}
            {rule('Tax', 'tax', '%', 0, 12, 0.25)}
            {rule('Discount', 'discount', '', 0, 5000, 50)}
          </div>
        </MSection>

        <div className="glass" style={{ padding: '12px 14px', borderRadius: 12 }}>
          {[['Hardware + labor + extras', e.base], ['Markup', e.markup], ['Discount', -e.discount], ['Tax', e.tax]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', fontSize: 11, padding: '3px 0', color: 'var(--text-mid)' }}>
              <span style={{ flex: 1 }}>{k}</span><span className="mono">{v < 0 ? '−' + money(-v) : money(v)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: 'var(--text-high)', borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 4 }}>
            <span style={{ flex: 1 }}>Total</span><span className="mono" style={{ color: 'var(--brand)' }}>{money(e.total)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          {[['⎙ PDF', 'Estimate PDF exported with logo & terms'], ['⤓ XLS', 'Estimate exported as spreadsheet'], ['→ Customer', 'Estimate sent — status set to “sent”']].map(([lbl, msg], i) => (
            <button key={lbl} onClick={() => { showToast(msg, 'ok'); if (i === 2) setEst({ status: 'sent' }); }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: i === 2 ? 'none' : '1px solid var(--border-subtle)', background: i === 2 ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'rgba(63,169,245,0.06)', color: i === 2 ? '#fff' : 'var(--brand)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{lbl}</button>
          ))}
        </div>
      </>}

      {sub === 'Quantities' && <>
        <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', padding: '0 8px' }}>Takeoff quantities computed from captured geometry — no tape measure math.</div>
        {svRoomQty(project).map(r => (
          <div key={r.floor + r.name} className="glass" style={{ padding: '11px 13px', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{r.name}</span>
              <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{r.floor}</span>
            </div>
            <div style={{ display: 'flex', marginTop: 7 }}>
              {[['Floor', r.area + ' ft²'], ['Perimeter', r.perim + ' ft'], ['Walls', r.wall + ' ft²'], ['Ceiling', r.ceil + ' ft²']].map(([k, v]) => (
                <div key={k} style={{ flex: 1, textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand)' }}>{v}</div>
                  <div style={{ fontSize: 7.5, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>}

      {sub === 'Scope' && <>
        <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', padding: '0 8px' }}>Scope of work per room — exports into the proposal & work order.</div>
        {(est.scope || []).map((s, si) => (
          <div key={s.room} className="glass" style={{ padding: '12px 14px', borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)', marginBottom: 6 }}>{s.room}</div>
            {s.tasks.map((tk, ti) => (
              <div key={ti} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--brand)', fontSize: 10, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{tk}</span>
              </div>
            ))}
            <button onClick={() => {
              const scope = (est.scope || []).map((x, i) => i === si ? { ...x, tasks: [...x.tasks, 'New scope task — tap to edit'] } : x);
              setEst({ scope });
            }} style={{ marginTop: 6, padding: '6px 11px', borderRadius: 8, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>＋ Task</button>
          </div>
        ))}
        {(project.aiNotes || []).length > 0 && (
          <MSection title="ShieldTech AI voice notes">
            {(project.aiNotes || []).map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 8, padding: '6px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
                <span style={{ fontSize: 9, color: '#c084fc', fontWeight: 700, flexShrink: 0 }}>{n.room}</span>
                <span style={{ fontSize: 11, color: 'var(--text-mid)', fontStyle: 'italic' }}>“{n.text}”</span>
              </div>
            ))}
          </MSection>
        )}
        <button onClick={() => { showToast('Scope package exported — proposal draft created', 'ok'); onNav && onNav('proposals'); }} style={{ padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #c084fc, #8b5cf6)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Build proposal from scope →</button>
      </>}
    </div>
  );
}

Object.assign(window, { SV2Estimate });

/* Screen — Purchase Orders (v2: live submit/receive workflow) */

function PurchaseOrdersScreen() {
  const [pos, setPos] = useShieldStore(poStore);
  const [selected, setSelected] = React.useState(0);
  const [tab, setTab] = React.useState('all');
  const [showNewPO, setShowNewPO] = React.useState(false);

  const statusMap = {
    draft:    { color: 'var(--text-low)',       bg: 'rgba(92,111,134,0.15)',  label: 'Draft' },
    sent:     { color: 'var(--brand)',           bg: 'rgba(63,169,245,0.12)', label: 'Sent' },
    partial:  { color: 'var(--status-warn)',     bg: 'rgba(251,191,36,0.12)', label: 'Partial' },
    received: { color: 'var(--status-ok)',       bg: 'rgba(52,211,153,0.12)', label: 'Received' },
    cancelled:{ color: 'var(--status-critical)', bg: 'rgba(244,63,94,0.1)',   label: 'Cancelled' },
  };

  const filtered = pos.filter(p => tab === 'all' || p.status === tab);
  const po = pos[selected];
  const sm = po ? statusMap[po.status] : statusMap.draft;

  const submitPO = (id) => {
    setPos(prev => prev.map(p => p.id === id ? { ...p, status: 'sent' } : p));
    showToast('PO submitted to vendor', 'ok');
  };

  const receiveLine = (poId, itemIdx) => {
    setPos(prev => prev.map(p => {
      if (p.id !== poId) return p;
      const items = p.items.map((item, i) => i === itemIdx ? { ...item, received: item.qty } : item);
      const allReceived = items.every(item => item.received >= item.qty);
      const anyReceived = items.some(item => item.received > 0);
      const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : p.status;
      return { ...p, items, status: newStatus };
    }));
    showToast('Line item received', 'ok');
  };

  const receiveAll = (id) => {
    setPos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const items = p.items.map(item => ({ ...item, received: item.qty }));
      return { ...p, items, status: 'received' };
    }));
    showToast('All items received', 'ok');
  };

  const cancelPO = (id) => {
    setPos(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
    showToast('PO cancelled', 'warn');
  };

  const receivedTotal = po ? po.items.reduce((s,i) => s + i.received * i.unit, 0) : 0;
  const receivedPct   = po && po.total > 0 ? (receivedTotal / po.total) * 100 : 0;

  const totalSpend   = pos.filter(p => p.status==='received').reduce((s,p) => s+p.total, 0);
  const pendingSpend = pos.filter(p => ['sent','partial'].includes(p.status)).reduce((s,p) => s+p.total, 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 76px)', gap:12, overflow:'hidden' }}>
      {/* Stats */}
      <div style={{ display:'flex', gap:10, flexShrink:0 }}>
        {[
          {label:'TOTAL POs',val:pos.length,color:'var(--brand)'},
          {label:'RECEIVED',val:pos.filter(p=>p.status==='received').length,color:'var(--status-ok)'},
          {label:'IN-FLIGHT SPEND',val:'$'+pendingSpend.toLocaleString(),color:'var(--status-warn)'},
          {label:'MTD RECEIVED',val:'$'+totalSpend.toLocaleString(),color:'var(--status-ok)'},
        ].map(s => (
          <div key={s.label} className="glass" style={{ flex:1, padding:'12px 20px', display:'flex', alignItems:'center', gap:12 }}>
            <span className="mono" style={{ fontSize:24, fontWeight:600, color:s.color }}>{s.val}</span>
            <span style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', lineHeight:1.4 }}>{s.label}</span>
          </div>
        ))}
        <button onClick={() => setShowNewPO(true)} style={{ padding:'0 20px', background:'rgba(63,169,245,0.08)', border:'1px solid var(--border-strong)', borderRadius:10, color:'var(--brand)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap' }}>+ New PO</button>
      </div>

      <div style={{ flex:1, display:'flex', gap:12, minHeight:0 }}>
        {/* List */}
        <div className="glass" style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', padding:0 }}>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border-subtle)', padding:'0 4px' }}>
            {['all','draft','sent','partial','received'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'9px 2px', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', color:tab===t?'var(--brand)':'var(--text-low)', borderBottom:'2px solid '+(tab===t?'var(--brand)':'transparent'), transition:'all 0.15s' }}>{t}</button>
            ))}
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.map((p,i) => {
              const si = pos.indexOf(p);
              const s = statusMap[p.status];
              const recPct = p.total > 0 ? (p.items.reduce((sum,item) => sum+item.received*item.unit,0)/p.total)*100 : 0;
              return (
                <div key={p.id} onClick={() => setSelected(si)} style={{ padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid var(--border-subtle)', background:selected===si?'rgba(63,169,245,0.06)':'transparent', borderLeft:'3px solid '+(selected===si?s.color:'transparent'), transition:'all 0.15s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span className="mono" style={{ fontSize:11, color:'var(--brand)', fontWeight:600 }}>{p.id}</span>
                    <span style={{ fontSize:9, color:s.color, background:s.bg, padding:'1px 7px', borderRadius:100, fontWeight:600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--text-high)', marginBottom:3 }}>{p.vendor}</div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:10, color:'var(--text-low)' }}>{p.date}</span>
                    <span className="mono" style={{ fontSize:11, color:'var(--text-high)', fontWeight:600 }}>${p.total.toLocaleString()}</span>
                  </div>
                  {(p.status==='partial') && (
                    <div style={{ marginTop:5, height:3, background:'rgba(63,169,245,0.08)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:recPct+'%', height:'100%', background:'var(--status-warn)', borderRadius:2, transition:'width 0.4s ease' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        {po && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minHeight:0, overflow:'hidden' }}>
            <div className="glass" style={{ padding:'14px 20px', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span className="mono" style={{ fontSize:14, fontWeight:600, color:'var(--brand)' }}>{po.id}</span>
                <span style={{ fontSize:11, color:sm.color, background:sm.bg, padding:'2px 10px', borderRadius:100, fontWeight:600 }}>{sm.label}</span>

                {po.status === 'draft' && (
                  <button onClick={() => submitPO(po.id)} style={{ padding:'5px 14px', background:'rgba(63,169,245,0.1)', border:'1px solid var(--border-strong)', borderRadius:6, color:'var(--brand)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Submit PO to Vendor</button>
                )}
                {(po.status === 'sent' || po.status === 'partial') && (
                  <>
                    <button onClick={() => receiveAll(po.id)} style={{ padding:'5px 14px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:6, color:'var(--status-ok)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Receive All</button>
                    <button onClick={() => cancelPO(po.id)} style={{ padding:'5px 14px', background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.15)', borderRadius:6, color:'var(--status-critical)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel PO</button>
                  </>
                )}
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <button onClick={() => shieldModal({ kind: 'doc', title: 'Purchase Order', docTitle: `Purchase Order ${po.id}`, meta: `${po.vendor || 'Vendor'} · ${po.date || ''}`, downloadLabel: 'Download PDF', downloadMsg: `PO ${po.id} downloaded`, paragraphs: [
                    'ShieldTech Security — Purchase Order. Please reference the PO number on all shipping documents and invoices.',
                    { k: 'Vendor', v: po.vendor || '—' },
                    { k: 'Status', v: po.status },
                    { k: 'Total', v: po.total != null ? ('$' + Number(po.total).toLocaleString()) : '—' }
                  ] })} style={{ fontSize:11, color:'var(--text-mid)', background:'rgba(63,169,245,0.04)', border:'1px solid var(--border-subtle)', borderRadius:6, padding:'4px 12px', cursor:'pointer', fontFamily:'var(--font-body)' }}>Print PO</button>
                </div>
              </div>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {[{l:'Vendor',v:po.vendor},{l:'Date',v:po.date}].map(f => (
                  <div key={f.l}><div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:2 }}>{f.l}</div><div style={{ fontSize:12, color:'var(--text-high)' }}>{f.v}</div></div>
                ))}
              </div>
            </div>

            {/* Items table */}
            <div className="glass" style={{ flex:1, padding:16, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Item','SKU','Ordered','Received','Unit $','Total','Status',''].map((h,i) => (
                      <th key={h+i} style={{ textAlign:i>1?'center':'left', padding:'8px 10px', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', borderBottom:'1px solid var(--border-subtle)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item,i) => {
                    const recVal = Math.min(item.received, item.qty);
                    const done = recVal >= item.qty;
                    const sc = done || po.status==='received' ? 'var(--status-ok)' : recVal > 0 ? 'var(--status-warn)' : 'var(--text-low)';
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid rgba(63,169,245,0.05)' }}>
                        <td style={{ padding:'10px', fontSize:13, color:'var(--text-high)' }}>{item.desc}</td>
                        <td style={{ padding:'10px', fontSize:11, color:'var(--text-low)', fontFamily:'var(--font-mono)' }}>{item.sku}</td>
                        <td style={{ padding:'10px', textAlign:'center', fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-high)' }}>{item.qty}</td>
                        <td style={{ padding:'10px', textAlign:'center', fontSize:12, fontFamily:'var(--font-mono)', color:sc, fontWeight:600 }}>{po.status==='received'?item.qty:recVal}</td>
                        <td style={{ padding:'10px', textAlign:'center', fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-mid)' }}>${item.unit}</td>
                        <td style={{ padding:'10px', textAlign:'center', fontSize:12, fontFamily:'var(--font-mono)', color:'var(--status-ok)', fontWeight:600 }}>${(item.qty*item.unit).toLocaleString()}</td>
                        <td style={{ padding:'10px', textAlign:'center' }}>
                          <span style={{ fontSize:9, fontWeight:600, color:sc, background:sc+'18', padding:'2px 8px', borderRadius:100 }}>
                            {po.status==='received'||done ? 'Received' : recVal>0 ? recVal+'/'+item.qty : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding:'10px' }}>
                          {(po.status==='sent'||po.status==='partial') && !done && (
                            <button onClick={() => receiveLine(po.id, i)} style={{ fontSize:10, color:'var(--status-ok)', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:5, padding:'3px 8px', cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap' }}>Mark Rcvd</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(po.status==='partial'||po.status==='sent') && (
                <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(63,169,245,0.04)', border:'1px solid var(--border-subtle)', borderRadius:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:'var(--text-low)' }}>Receiving Progress</span>
                    <span className="mono" style={{ fontSize:11, color:'var(--status-warn)', fontWeight:600 }}>${receivedTotal.toLocaleString()} of ${po.total.toLocaleString()}</span>
                  </div>
                  <div style={{ height:6, background:'rgba(63,169,245,0.08)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:receivedPct+'%', height:'100%', background:receivedPct===100?'var(--status-ok)':'var(--status-warn)', borderRadius:3, transition:'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-low)', marginTop:4 }}>{Math.round(receivedPct)}% received</div>
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16, paddingTop:12, borderTop:'1px solid var(--border-subtle)' }}>
                <span className="mono" style={{ fontSize:20, fontWeight:700, color:'var(--status-ok)' }}>${po.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New PO Modal */}
      {showNewPO && (
        <>
          <div onClick={() => setShowNewPO(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900, backdropFilter:'blur(4px)' }} />
          <div className="glass" style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, zIndex:901, padding:24, animation:'fade-up 0.2s ease', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <span style={{ fontSize:15, fontWeight:600, color:'var(--text-high)' }}>New Purchase Order</span>
              <button onClick={() => setShowNewPO(false)} style={{ background:'none', border:'none', color:'var(--text-low)', cursor:'pointer', fontSize:20 }}>x</button>
            </div>
            {[{l:'Vendor Name',ph:'e.g. Axis Communications'},{l:'Related Job/Project',ph:'e.g. Metro Bank Install'}].map(f => (
              <div key={f.l} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>{f.l}</div>
                <input placeholder={f.ph} style={{ width:'100%', background:'rgba(63,169,245,0.04)', border:'1px solid var(--border-subtle)', borderRadius:7, padding:'8px 12px', color:'var(--text-high)', fontSize:12, fontFamily:'var(--font-body)', outline:'none' }} />
              </div>
            ))}
            <div style={{ padding:'12px 14px', background:'rgba(63,169,245,0.04)', border:'1px solid var(--border-subtle)', borderRadius:8, fontSize:11, color:'var(--text-low)', marginBottom:20 }}>Add line items after creation in the PO detail view.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowNewPO(false)} style={{ flex:1, padding:'9px 0', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:7, color:'var(--text-low)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { const id = genId('PO'); setPos(prev => [...prev, {id, vendor:'New Vendor', status:'draft', date:'Jun 10, 2026', total:0, items:[]}]); setSelected(pos.length); setShowNewPO(false); showToast(id+' created as draft','ok'); }} style={{ flex:2, padding:'9px 0', background:'rgba(63,169,245,0.12)', border:'1px solid var(--border-strong)', borderRadius:7, color:'var(--brand)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Create Draft PO</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { PurchaseOrdersScreen });

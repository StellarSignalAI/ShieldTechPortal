/* Screen — Quote to Cash (v2: live stage advancing, deal creation) */

function QuoteToCashScreen() {
  const [deals, setDeals] = useShieldStore(qtcStore);
  const [selectedId, setSelectedId] = React.useState(null);
  const [showNewDeal, setShowNewDeal] = React.useState(false);

  const stages = [
    { id: 'quote',     label: 'Quote Sent',    color: 'var(--text-low)' },
    { id: 'approved',  label: 'Approved',      color: 'var(--brand)' },
    { id: 'po',        label: 'PO Issued',     color: '#c084fc' },
    { id: 'scheduled', label: 'Scheduled',     color: 'var(--status-warn)' },
    { id: 'installed', label: 'Installed',     color: 'var(--brand)' },
    { id: 'invoiced',  label: 'Invoiced',      color: 'var(--status-warn)' },
    { id: 'paid',      label: 'Paid',          color: 'var(--status-ok)' },
  ];

  const stageOrder = stages.map(s => s.id);
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s]));

  const riskColor = { low: 'var(--status-ok)', medium: 'var(--status-warn)', high: 'var(--status-critical)' };

  const advanceDeal = (id) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== id) return d;
      const idx = stageOrder.indexOf(d.stage);
      if (idx === stageOrder.length - 1) return d;
      const next = stageOrder[idx + 1];
      showToast(d.name + ' → ' + stageMap[next].label, 'ok');
      return { ...d, stage: next };
    }));
  };

  const selectedDeal = deals.find(d => d.id === selectedId);

  const dealsPerStage = stages.reduce((acc, s) => {
    acc[s.id] = deals.filter(d => d.stage === s.id);
    return acc;
  }, {});

  const totalPipeline = deals.reduce((s,d) => s+d.value, 0);
  const totalPaid     = deals.filter(d => d.stage==='paid').reduce((s,d) => s+d.value, 0);
  const inFlight      = deals.filter(d => !['paid','quote'].includes(d.stage)).reduce((s,d) => s+d.value, 0);

  const waterfallData = stages.map(s => ({
    stage: s.label, color: s.color,
    value: dealsPerStage[s.id].reduce((sum,d) => sum+d.value, 0),
    count: dealsPerStage[s.id].length
  }));
  const maxW = Math.max(...waterfallData.map(d => d.value), 1);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 76px)', gap:12, overflow:'hidden' }}>
      {/* KPIs */}
      <div style={{ display:'flex', gap:10, flexShrink:0 }}>
        {[
          {label:'TOTAL PIPELINE',val:'$'+(totalPipeline/1000).toFixed(0)+'K',color:'var(--brand)'},
          {label:'IN FLIGHT',val:'$'+(inFlight/1000).toFixed(0)+'K',color:'var(--status-warn)'},
          {label:'COLLECTED MTD',val:'$'+(totalPaid/1000).toFixed(0)+'K',color:'var(--status-ok)'},
          {label:'WIN RATE',val:'68%',color:'var(--status-ok)'},
          {label:'AVG DAYS TO CLOSE',val:'31d',color:'var(--text-mid)'},
        ].map(k => (
          <div key={k.label} className="glass" style={{ flex:1, padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>{k.label}</div>
            <div className="mono" style={{ fontSize:22, fontWeight:700, color:k.color }}>{k.val}</div>
          </div>
        ))}
        <button onClick={() => setShowNewDeal(true)} style={{ padding:'0 18px', background:'rgba(63,169,245,0.08)', border:'1px solid var(--border-strong)', borderRadius:10, color:'var(--brand)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap' }}>+ New Deal</button>
      </div>

      {/* Waterfall */}
      <div className="glass" style={{ padding:'12px 16px', flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:10 }}>Pipeline by Stage</div>
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:56 }}>
          {waterfallData.map((d,i) => {
            const h = Math.max(4,(d.value/maxW)*48);
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                {d.value > 0 && <span className="mono" style={{ fontSize:8, color:d.color }}>${d.value>=1000?(d.value/1000).toFixed(0)+'K':d.value}</span>}
                <div style={{ width:'100%', height:h, borderRadius:'3px 3px 0 0', background:d.color+'22', border:'1px solid '+d.color+'50', borderBottom:'none', transition:'height 0.5s ease' }} />
                {d.count > 0 && <div style={{ width:16, height:16, borderRadius:'50%', background:d.color+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:d.color, fontWeight:700 }}>{d.count}</div>}
                <span style={{ fontSize:8, color:'var(--text-low)', textAlign:'center', lineHeight:1.2 }}>{d.stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban swimlane */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', minHeight:0 }}>
        <div style={{ display:'flex', gap:8, height:'100%', minWidth:'max-content', paddingBottom:8 }}>
          {stages.map(s => {
            const stageDeals = dealsPerStage[s.id];
            const stageTotal = stageDeals.reduce((sum,d) => sum+d.value, 0);
            return (
              <div key={s.id} style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="glass" style={{ padding:'8px 12px', borderTop:'2px solid '+s.color }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:s.color }} />
                    <span style={{ fontSize:11, fontWeight:600, color:'var(--text-high)' }}>{s.label}</span>
                    <span style={{ marginLeft:'auto', fontSize:10, color:s.color, background:s.color+'18', padding:'1px 6px', borderRadius:100 }}>{stageDeals.length}</span>
                  </div>
                  {stageTotal > 0 && <div className="mono" style={{ fontSize:11, color:s.color, paddingLeft:13 }}>${stageTotal.toLocaleString()}</div>}
                </div>
                <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                  {stageDeals.map(deal => (
                    <div key={deal.id} onClick={() => setSelectedId(selectedId===deal.id?null:deal.id)} style={{ padding:'10px 12px', background:'var(--glass-bg)', backdropFilter:'blur(10px)', border:'1px solid '+(selectedId===deal.id?s.color:'var(--border-subtle)'), borderRadius:8, cursor:'pointer', transition:'all 0.15s', boxShadow:selectedId===deal.id?'0 0 12px '+s.color+'25':'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'var(--text-high)', lineHeight:1.2, flex:1, marginRight:4 }}>{deal.name}</span>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:riskColor[deal.risk], flexShrink:0, marginTop:2 }} />
                      </div>
                      <div className="mono" style={{ fontSize:13, fontWeight:600, color:s.color, marginBottom:4 }}>${deal.value.toLocaleString()}</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:9, color:'var(--text-low)' }}>{deal.contact}</span>
                        <span style={{ fontSize:9, color:deal.age>30?'var(--status-warn)':'var(--text-low)' }}>{deal.age}d</span>
                      </div>
                      {deal.stage !== 'paid' && (
                        <button onClick={e => { e.stopPropagation(); advanceDeal(deal.id); }} style={{ marginTop:8, width:'100%', padding:'4px 0', fontSize:10, fontWeight:600, color:s.color, background:s.color+'12', border:'1px solid '+s.color+'35', borderRadius:5, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                          Advance → {stages[stages.findIndex(x=>x.id===deal.stage)+1]?.label || 'Done'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected deal panel */}
      {selectedDeal && (
        <div className="glass" style={{ position:'fixed', bottom:24, right:24, width:280, padding:16, zIndex:200, animation:'fade-up 0.15s ease both', boxShadow:'0 12px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-high)' }}>{selectedDeal.name}</span>
            <button onClick={() => setSelectedId(null)} style={{ background:'none', border:'none', color:'var(--text-low)', cursor:'pointer', fontSize:16 }}>x</button>
          </div>
          <div className="mono" style={{ fontSize:20, fontWeight:700, color:stageMap[selectedDeal.stage]?.color||'var(--brand)', marginBottom:10 }}>${selectedDeal.value.toLocaleString()}</div>
          {[{l:'Contact',v:selectedDeal.contact},{l:'Stage',v:stageMap[selectedDeal.stage]?.label},{l:'Age',v:selectedDeal.age+'d in pipeline'},{l:'Risk',v:selectedDeal.risk.charAt(0).toUpperCase()+selectedDeal.risk.slice(1)}].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:10, color:'var(--text-low)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{r.l}</span>
              <span style={{ fontSize:11, color:r.l==='Risk'?riskColor[selectedDeal.risk]:'var(--text-high)' }}>{r.v}</span>
            </div>
          ))}
          {selectedDeal.stage !== 'paid' && (
            <button onClick={() => { advanceDeal(selectedDeal.id); setSelectedId(null); }} style={{ marginTop:8, width:'100%', padding:'8px 0', fontSize:11, fontWeight:600, color:'var(--status-ok)', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              Advance to {stages[stages.findIndex(x=>x.id===selectedDeal.stage)+1]?.label} →
            </button>
          )}
        </div>
      )}

      {/* New Deal Modal */}
      {showNewDeal && <NewDealModal stages={stages} onClose={() => setShowNewDeal(false)} onCreate={deal => { setDeals(prev => [...prev, deal]); setShowNewDeal(false); showToast('Deal created: '+deal.name, 'ok'); }} />}
    </div>
  );
}

function NewDealModal({ stages, onClose, onCreate }) {
  const customers = ['Metro Bank Corp','Riverside Medical','City Hall','Acme Dental','Pacific Rim Hotels','Westfield Mall','Embarcadero Partners','Pinnacle Financial','Bayshore Medical','Redwood College'];
  const [form, setForm] = React.useState({ name: '', value: '', contact: '', stage: 'quote', risk: 'low' });
  const set = (k,v) => setForm(p => ({...p,[k]:v}));
  const submit = () => {
    if (!form.name) return;
    onCreate({ id: genId('D'), name: form.name, value: parseFloat(form.value)||0, contact: form.contact, stage: form.stage, risk: form.risk, age: 0 });
  };
  const inp = { width:'100%', background:'rgba(63,169,245,0.04)', border:'1px solid var(--border-subtle)', borderRadius:7, padding:'8px 12px', color:'var(--text-high)', fontSize:12, fontFamily:'var(--font-body)', outline:'none' };
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900, backdropFilter:'blur(4px)' }} />
      <div className="glass" style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:420, zIndex:901, padding:24, animation:'fade-up 0.2s ease', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <span style={{ fontSize:15, fontWeight:600, color:'var(--text-high)' }}>New Deal</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-low)', cursor:'pointer', fontSize:20 }}>x</button>
        </div>
        {[{l:'Customer / Deal Name *',k:'name',ph:'e.g. Westfield Mall Phase 2'},{l:'Contact Name',k:'contact',ph:'e.g. Patricia Ng'},{l:'Deal Value ($)',k:'value',ph:'e.g. 48000'}].map(f => (
          <div key={f.k} style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>{f.l}</div>
            <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={inp} />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>Stage</div>
            <select value={form.stage} onChange={e => set('stage', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>Risk</div>
            <select value={form.risk} onChange={e => set('risk', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {['low','medium','high'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px 0', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:7, color:'var(--text-low)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
          <button onClick={submit} disabled={!form.name} style={{ flex:2, padding:'9px 0', background:form.name?'rgba(63,169,245,0.12)':'rgba(63,169,245,0.04)', border:'1px solid '+(form.name?'var(--border-strong)':'var(--border-subtle)'), borderRadius:7, color:form.name?'var(--brand)':'var(--text-low)', fontSize:12, fontWeight:600, cursor:form.name?'pointer':'default', fontFamily:'var(--font-body)', transition:'all 0.15s' }}>Create Deal</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { QuoteToCashScreen });

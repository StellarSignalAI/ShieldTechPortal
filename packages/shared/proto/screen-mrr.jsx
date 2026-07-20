/* Screen — MRR Tracker (v2: churn simulation toggle) */

function MRRScreen() {
  const [contracts, setContracts] = useShieldStore(mrrStore);
  const [hoveredMonth, setHoveredMonth] = React.useState(null);
  const [showChurnSim, setShowChurnSim] = React.useState(false);

  const toggleChurn = (customer) => {
    setContracts(prev => prev.map(c => c.customer === customer ? { ...c, churned: !c.churned, status: !c.churned ? 'cancelled' : 'active' } : c));
    const c = contracts.find(x => x.customer === customer);
    showToast((c.churned ? 'Restored: ' : 'Simulated churn: ') + customer, c.churned ? 'ok' : 'warn');
  };

  const activeContracts = contracts.filter(c => !c.churned);
  const currentMRR = activeContracts.reduce((s,c) => s + c.mrr, 0);
  const totalMRR = contracts.reduce((s,c) => s + c.mrr, 0);
  const arr = currentMRR * 12;
  const churnedMRR = contracts.filter(c => c.churned).reduce((s,c) => s + c.mrr, 0);

  const riskColor = { low: 'var(--status-ok)', medium: 'var(--status-warn)', high: 'var(--status-critical)' };
  const statusColor = { active: 'var(--status-ok)', 'at-risk': 'var(--status-critical)', pending: 'var(--brand)', cancelled: 'var(--text-low)' };

  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const mrrHistory = [48200, 51200, 56300, 59400, 62100, currentMRR];
  const maxMRR = Math.max(...mrrHistory, 1);

  const planBreakdown = [
    { plan: 'Enterprise', mrr: activeContracts.filter(c=>c.plan.includes('Enterprise')).reduce((s,c)=>s+c.mrr,0), color: 'var(--brand)' },
    { plan: 'Pro',        mrr: activeContracts.filter(c=>c.plan.includes('Pro')).reduce((s,c)=>s+c.mrr,0),        color: '#c084fc' },
    { plan: 'Standard',   mrr: activeContracts.filter(c=>c.plan.includes('Standard')).reduce((s,c)=>s+c.mrr,0),  color: 'var(--status-warn)' },
    { plan: 'Gov',        mrr: activeContracts.filter(c=>c.plan.includes('Government')).reduce((s,c)=>s+c.mrr,0),color: 'var(--status-ok)' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, height:'calc(100vh - 76px)', overflow:'auto' }}>
      {/* KPIs */}
      <div style={{ display:'flex', gap:10, flexShrink:0 }}>
        {[
          {label:'MRR',val:'$'+(currentMRR/1000).toFixed(1)+'K',sub:churnedMRR>0?'-$'+(churnedMRR/1000).toFixed(1)+'K simulated churn':'+$'+(( currentMRR-48200)/1000).toFixed(1)+'K YTD',color:'var(--brand)',alert:churnedMRR>0},
          {label:'ARR',val:'$'+(arr/1000).toFixed(0)+'K',sub:(((currentMRR-48200)/48200)*100).toFixed(1)+'% YTD growth',color:'var(--status-ok)',alert:false},
          {label:'NET REVENUE RETENTION',val:((currentMRR/62100)*100).toFixed(1)+'%',sub:'vs last month',color:currentMRR>=62100?'var(--status-ok)':'var(--status-critical)',alert:false},
          {label:'ACTIVE CONTRACTS',val:activeContracts.length,sub:contracts.filter(c=>c.churned).length+' churned (simulated)',color:'var(--text-high)',alert:contracts.some(c=>c.churned)},
        ].map(k => (
          <div key={k.label} className="glass" style={{ flex:1, padding:'14px 16px', borderTop:k.alert?'2px solid var(--status-warn)':'none' }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>{k.label}</div>
            <div className="mono" style={{ fontSize:22, fontWeight:700, color:k.color, marginBottom:2 }}>{k.val}</div>
            <div style={{ fontSize:10, color:k.alert?'var(--status-warn)':'var(--text-low)' }}>{k.sub}</div>
          </div>
        ))}
        <button onClick={() => setShowChurnSim(!showChurnSim)} style={{ padding:'0 16px', background:showChurnSim?'rgba(244,63,94,0.08)':'rgba(63,169,245,0.08)', border:'1px solid '+(showChurnSim?'rgba(244,63,94,0.3)':'var(--border-strong)'), borderRadius:10, color:showChurnSim?'var(--status-critical)':'var(--brand)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap' }}>
          {showChurnSim?'Hide':'Churn Sim'}
        </button>
      </div>

      {/* Churn simulation banner */}
      {contracts.some(c=>c.churned) && (
        <div style={{ padding:'10px 16px', background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.25)', borderRadius:8, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--status-critical)', flexShrink:0 }} />
          <span style={{ fontSize:12, color:'var(--status-critical)', fontWeight:600 }}>Churn Simulation Active</span>
          <span style={{ fontSize:12, color:'var(--text-mid)' }}>Simulated MRR loss: <strong style={{color:'var(--status-critical)'}}>-${churnedMRR.toLocaleString()}/mo</strong> · ARR impact: <strong style={{color:'var(--status-critical)'}}>-${(churnedMRR*12).toLocaleString()}</strong></span>
          <button onClick={() => setContracts(prev => prev.map(c => ({...c,churned:false,status:c.status==='cancelled'?'active':c.status})))} style={{ marginLeft:'auto', fontSize:11, color:'var(--status-ok)', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font-body)' }}>Reset All</button>
        </div>
      )}

      <div style={{ display:'flex', gap:12, flex:1, minHeight:0 }}>
        {/* Left: chart + table */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minHeight:0 }}>
          {/* MRR chart */}
          <div className="glass" style={{ padding:16, flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:12, fontWeight:500, color:'var(--text-high)' }}>MRR — 6 Month Trend</span>
              {churnedMRR > 0 && <span style={{ fontSize:11, color:'var(--status-critical)' }}>Simulated: ${(currentMRR/1000).toFixed(1)}K vs actual ${(totalMRR/1000).toFixed(1)}K</span>}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
              {mrrHistory.map((v,i) => {
                const h = (v/maxMRR)*72;
                const isLast = i===mrrHistory.length-1;
                const isHov = hoveredMonth===i;
                return (
                  <div key={i} onMouseEnter={() => setHoveredMonth(i)} onMouseLeave={() => setHoveredMonth(null)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'default', position:'relative' }}>
                    {isHov && (
                      <div style={{ position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)', background:'var(--modal)', border:'1px solid var(--border-strong)', borderRadius:6, padding:'4px 8px', fontSize:10, color:'var(--text-high)', whiteSpace:'nowrap', zIndex:10, pointerEvents:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
                        {months[i]}: ${v.toLocaleString()}
                      </div>
                    )}
                    {isLast && <span className="mono" style={{ fontSize:9, color:churnedMRR>0?'var(--status-critical)':'var(--brand)', fontWeight:700 }}>${(v/1000).toFixed(1)}K</span>}
                    <div style={{ width:'100%', height:h, borderRadius:'3px 3px 0 0', background:isLast?(churnedMRR>0?'rgba(244,63,94,0.4)':'var(--brand)'):'rgba(63,169,245,0.3)', transition:'all 0.5s ease', boxShadow:isLast&&!churnedMRR?'0 0 10px rgba(63,169,245,0.3)':'none' }} />
                    <span style={{ fontSize:9, color:'var(--text-low)' }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contracts table */}
          <div className="glass" style={{ flex:1, padding:16, overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:500, color:'var(--text-high)' }}>Contracts {showChurnSim && <span style={{ fontSize:10, color:'var(--status-warn)', marginLeft:8 }}>Click to simulate churn</span>}</span>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Customer','Plan','MRR','Renewal','Risk','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', borderBottom:'1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.sort((a,b) => b.mrr - a.mrr).map((c,i) => (
                  <tr key={i}
                    onClick={() => showChurnSim && toggleChurn(c.customer)}
                    style={{ borderBottom:'1px solid rgba(63,169,245,0.05)', opacity:c.churned?0.5:1, cursor:showChurnSim?'pointer':'default', transition:'opacity 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(63,169,245,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
                    <td style={{ padding:'9px 10px', fontSize:12, color:c.churned?'var(--text-low)':'var(--text-high)', fontWeight:500, textDecoration:c.churned?'line-through':'none' }}>{c.customer}</td>
                    <td style={{ padding:'9px 10px', fontSize:11, color:'var(--text-mid)' }}>{c.plan}</td>
                    <td style={{ padding:'9px 10px', fontSize:12, fontFamily:'var(--font-mono)', color:c.churned?'var(--status-critical)':'var(--status-ok)', fontWeight:600 }}>{c.churned?'-':''}${c.mrr.toLocaleString()}</td>
                    <td style={{ padding:'9px 10px', fontSize:11, color:'var(--text-mid)' }}>{c.renewal}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:riskColor[c.risk] }} />
                        <span style={{ fontSize:10, color:riskColor[c.risk], textTransform:'capitalize' }}>{c.risk}</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      <span style={{ fontSize:9, fontWeight:600, color:statusColor[c.status]||'var(--text-low)', background:(statusColor[c.status]||'var(--text-low)')+'18', padding:'2px 8px', borderRadius:100, textTransform:'capitalize' }}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: plan mix + risk */}
        <div style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
          <div className="glass" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-low)', marginBottom:12 }}>MRR by Plan</div>
            {planBreakdown.map(p => (
              <div key={p.plan} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'var(--text-mid)' }}>{p.plan}</span>
                  <span className="mono" style={{ fontSize:11, color:p.color, fontWeight:600 }}>${p.mrr.toLocaleString()}</span>
                </div>
                <div style={{ height:5, background:'rgba(63,169,245,0.08)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:currentMRR>0?(p.mrr/currentMRR)*100+'%':'0%', height:'100%', background:p.color, borderRadius:3, transition:'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="glass" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-low)', marginBottom:12 }}>Churn Risk MRR</div>
            {['low','medium','high'].map(risk => {
              const riskMRR = activeContracts.filter(c=>c.risk===risk).reduce((s,c)=>s+c.mrr,0);
              return (
                <div key={risk} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:riskColor[risk] }} />
                    <span style={{ fontSize:11, color:'var(--text-mid)', textTransform:'capitalize' }}>{risk}</span>
                  </div>
                  <span className="mono" style={{ fontSize:12, color:riskColor[risk], fontWeight:600 }}>${riskMRR.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MRRScreen });

/* Screen — Parts Requisition (v2: uses shared store, live stage advancing) */

function PartsReqScreen() {
  const [cards, setCards] = useShieldStore(partsReqStore);
  const [selected, setSelected] = React.useState(null);

  const stages = [
    { id: 'requested', label: 'Requested',  color: 'var(--brand)',           action: 'Approve',           next: 'approved' },
    { id: 'approved',  label: 'Approved',   color: '#c084fc',                action: 'Start Picking',     next: 'picking' },
    { id: 'picking',   label: 'Picking',    color: 'var(--status-warn)',     action: 'Mark Shipped',      next: 'shipped' },
    { id: 'shipped',   label: 'Shipped',    color: 'var(--brand)',           action: 'Confirm Delivery',  next: 'delivered' },
    { id: 'delivered', label: 'Delivered',  color: 'var(--status-ok)',       action: null,                next: null },
  ];

  const urgencyColor = { urgent: 'var(--status-critical)', normal: 'var(--status-warn)', low: 'var(--text-low)' };

  const advance = (id) => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      const stage = stages.find(s => s.id === c.status);
      if (!stage?.next) return c;
      showToast(c.id + ' → ' + stage.next, stage.next === 'delivered' ? 'ok' : 'info');
      return { ...c, status: stage.next };
    }));
  };

  const truckStock = [
    { tech: 'MR', name: 'Mike Reyes',  truck: 'V-12', stock: 94 },
    { tech: 'JL', name: 'Jessica Liu', truck: 'V-08', stock: 78 },
    { tech: 'KW', name: 'Kevin White', truck: 'V-15', stock: 85 },
    { tech: 'DP', name: 'Diana Patel', truck: 'V-03', stock: 62 },
    { tech: 'TG', name: 'Tony Garcia', truck: 'V-21', stock: 91 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 76px)', gap:12, overflow:'hidden' }}>
      {/* Stage stats */}
      <div style={{ display:'flex', gap:10, flexShrink:0 }}>
        {stages.map(s => {
          const count = cards.filter(c => c.status === s.id).length;
          const urgent = cards.filter(c => c.status === s.id && c.urgency === 'urgent').length;
          return (
            <div key={s.id} className="glass" style={{ flex:1, padding:'12px 16px', borderTop:'2px solid '+s.color }}>
              <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>{s.label}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span className="mono" style={{ fontSize:24, fontWeight:600, color:s.color }}>{count}</span>
                {urgent > 0 && <span style={{ fontSize:9, color:'var(--status-critical)', background:'rgba(244,63,94,0.12)', padding:'1px 6px', borderRadius:100 }}>{urgent} urgent</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex:1, display:'flex', gap:12, minHeight:0, overflow:'hidden' }}>
        {/* Kanban board */}
        <div style={{ flex:1, display:'flex', gap:8, overflowX:'auto', overflowY:'hidden' }}>
          {stages.map(s => {
            const stageCards = cards.filter(c => c.status === s.id);
            return (
              <div key={s.id} style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ padding:'8px 10px', borderRadius:8, background:s.color+'10', border:'1px solid '+s.color+'30', display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:s.color, boxShadow:'0 0 6px '+s.color }} />
                  <span style={{ fontSize:11, fontWeight:600, color:s.color }}>{s.label}</span>
                  <span className="mono" style={{ marginLeft:'auto', fontSize:11, color:s.color, opacity:0.7 }}>{stageCards.length}</span>
                </div>
                <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                  {stageCards.map(card => {
                    const isSelected = selected?.id === card.id;
                    return (
                      <div key={card.id} onClick={() => setSelected(isSelected ? null : card)} style={{ padding:'10px 12px', background:'var(--glass-bg)', backdropFilter:'blur(10px)', border:'1px solid '+(isSelected?s.color:'var(--border-subtle)'), borderRadius:8, cursor:'pointer', transition:'all 0.15s', borderLeft:'3px solid '+urgencyColor[card.urgency], boxShadow:isSelected?'0 0 12px '+s.color+'25':'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                          <span className="mono" style={{ fontSize:10, color:'var(--text-low)' }}>{card.id}</span>
                          <span style={{ fontSize:8, color:urgencyColor[card.urgency], background:urgencyColor[card.urgency]+'15', padding:'1px 6px', borderRadius:100, fontWeight:600, textTransform:'uppercase' }}>{card.urgency}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(63,169,245,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'var(--brand)', flexShrink:0 }}>{card.tech}</div>
                          <span style={{ fontSize:11, color:'var(--text-high)', fontWeight:500 }}>{card.techName.split(' ')[0]}</span>
                        </div>
                        <div style={{ fontSize:10, color:'var(--text-low)', marginBottom:5, lineHeight:1.3 }}>{card.job}</div>
                        <div style={{ fontSize:10, color:'var(--text-mid)' }}>{card.parts.length} part{card.parts.length>1?'s':''}: {card.parts.map(p=>p.name.split(' ').slice(0,2).join(' ')).join(', ')}</div>
                        {s.action && (
                          <button onClick={e => { e.stopPropagation(); advance(card.id); }} style={{ marginTop:8, width:'100%', padding:'5px 0', fontSize:10, fontWeight:600, color:s.color, background:s.color+'12', border:'1px solid '+s.color+'40', borderRadius:5, cursor:'pointer', fontFamily:'var(--font-body)' }}>{s.action} →</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Truck stock sidebar */}
        <div style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)' }}>Truck Stock</div>
          {truckStock.map(t => (
            <div key={t.tech} className="glass" style={{ padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(63,169,245,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'var(--brand)', flexShrink:0 }}>{t.tech}</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--text-high)' }}>{t.name.split(' ')[0]}</div>
                  <div style={{ fontSize:9, color:'var(--text-low)' }}>{t.truck}</div>
                </div>
                <span className="mono" style={{ marginLeft:'auto', fontSize:12, color:t.stock>=80?'var(--status-ok)':t.stock>=60?'var(--status-warn)':'var(--status-critical)', fontWeight:600 }}>{t.stock}%</span>
              </div>
              <div style={{ height:4, background:'rgba(63,169,245,0.08)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:t.stock+'%', height:'100%', background:t.stock>=80?'var(--status-ok)':t.stock>=60?'var(--status-warn)':'var(--status-critical)', borderRadius:2, transition:'width 0.4s ease' }} />
              </div>
            </div>
          ))}

          {selected && (
            <div className="glass" style={{ padding:12, animation:'fade-up 0.15s ease both' }}>
              <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:8 }}>Req Detail</div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-high)', marginBottom:4 }}>{selected.id}</div>
              {selected.parts.map((p,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-mid)', marginBottom:3 }}>
                  <span>{p.name}</span><span className="mono" style={{ color:'var(--brand)' }}>x{p.qty}</span>
                </div>
              ))}
              {selected.notes && <div style={{ marginTop:8, fontSize:10, color:'var(--status-warn)', borderTop:'1px solid var(--border-subtle)', paddingTop:6 }}>{selected.notes}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PartsReqScreen });

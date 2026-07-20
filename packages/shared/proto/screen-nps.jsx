/* Screen — NPS & Customer Feedback (v2: live follow-up, reply drafting) */

function NPSScreen() {
  const [responses, setResponses] = useShieldStore(npsStore);
  const [filter, setFilter] = React.useState('all');
  const [selected, setSelected] = React.useState(null);
  const [replyText, setReplyText] = React.useState('');

  const categoryStyle = {
    promoter:  { color: 'var(--status-ok)',      bg: 'rgba(52,211,153,0.12)',  label: 'Promoter' },
    passive:   { color: 'var(--status-warn)',     bg: 'rgba(251,191,36,0.12)', label: 'Passive' },
    detractor: { color: 'var(--status-critical)', bg: 'rgba(244,63,94,0.1)',   label: 'Detractor' },
  };

  const promoters  = responses.filter(r => r.category === 'promoter').length;
  const detractors = responses.filter(r => r.category === 'detractor').length;
  const nps = Math.round(((promoters - detractors) / responses.length) * 100);
  const avgScore = (responses.reduce((s,r) => s + r.score, 0) / responses.length).toFixed(1);
  const needsFollowUp = responses.filter(r => r.category === 'detractor' && !r.followedUp).length;

  const filtered = responses.filter(r => filter === 'all' || r.category === filter);

  const markFollowedUp = (id) => {
    setResponses(prev => prev.map(r => r.id === id ? { ...r, followedUp: true } : r));
    showToast('Marked as followed up', 'ok');
  };

  const sendReply = (id) => {
    if (!replyText.trim()) return;
    setResponses(prev => prev.map(r => r.id === id ? { ...r, followedUp: true, reply: replyText.trim() } : r));
    setReplyText('');
    setSelected(null);
    showToast('Reply sent to customer', 'ok');
  };

  const createTicket = (r) => {
    const newTicket = {
      id: genId('TK'),
      priority: 'high', status: 'open',
      customer: r.customer, contact: r.contact,
      subject: 'NPS Detractor Follow-up: ' + r.score + '/10',
      created: Date.now(),
      sla: { total: 8, remaining: 8 },
      tags: ['nps', 'detractor'],
      assignee: null,
      thread: [
        { from: 'System', time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), msg: 'Ticket created from NPS detractor response.', system: true },
        { from: r.contact, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), msg: r.comment, system: false }
      ],
      relatedAsset: '', aiSuggestion: null
    };
    ticketStore.set(prev => [newTicket, ...prev]);
    markFollowedUp(r.id);
    showToast(newTicket.id + ' created', 'ok');
    navTo('helpdesk');
  };

  const distribution = Array.from({length:11},(_,i) => ({ score: i, count: responses.filter(r => r.score === i).length }));
  const monthlyNPS = [42,48,55,51,58,nps];
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', gap: 12, overflow: 'hidden' }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <div className="glass" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, minWidth: 180 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 2 }}>NPS SCORE</div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: nps >= 50 ? 'var(--status-ok)' : nps >= 30 ? 'var(--status-warn)' : 'var(--status-critical)', lineHeight: 1 }}>{nps}</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', lineHeight: 1.6 }}>
            <div style={{color:'var(--status-ok)'}}>{promoters} promoters</div>
            <div>{responses.filter(r=>r.category==='passive').length} passives</div>
            <div style={{color:'var(--status-critical)'}}>{detractors} detractors</div>
          </div>
        </div>
        {[{label:'AVG SCORE',val:avgScore,color:'var(--brand)'},{label:'RESPONSES',val:responses.length,color:'var(--text-high)'},{label:'NEEDS FOLLOW-UP',val:needsFollowUp,color:needsFollowUp>0?'var(--status-critical)':'var(--status-ok)'}].map(k => (
          <div key={k.label} className="glass" style={{ flex:1, padding:'14px 18px' }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:4 }}>{k.label}</div>
            <div className="mono" style={{ fontSize:28, fontWeight:700, color:k.color }}>{k.val}</div>
          </div>
        ))}
        {/* Distribution */}
        <div className="glass" style={{ flex:2, padding:'12px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:8 }}>Score Distribution</div>
          <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:40 }}>
            {distribution.map(d => {
              const h = d.count > 0 ? Math.max(6,(d.count/Math.max(...distribution.map(x=>x.count)))*36) : 2;
              const col = d.score >= 9 ? 'var(--status-ok)' : d.score >= 7 ? 'var(--status-warn)' : 'var(--status-critical)';
              return (
                <div key={d.score} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  {d.count > 0 && <span style={{ fontSize:8, color:col }}>{d.count}</span>}
                  <div style={{ width:'100%', height:h, background:h > 2 ? col : 'rgba(63,169,245,0.08)', borderRadius:'2px 2px 0 0', opacity:h>2?0.85:0.3 }} />
                  <span style={{ fontSize:8, color:'var(--text-low)' }}>{d.score}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* NPS Trend */}
        <div className="glass" style={{ flex:2, padding:'12px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-low)', marginBottom:8 }}>NPS Trend</div>
          <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:40 }}>
            {monthlyNPS.map((v,i) => {
              const h = Math.max(4,(v/80)*32);
              const isLast = i === monthlyNPS.length-1;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  {isLast && <span className="mono" style={{ fontSize:8, color:'var(--brand)', fontWeight:700 }}>{v}</span>}
                  <div style={{ width:'100%', height:h, background:isLast?'var(--brand)':'rgba(63,169,245,0.3)', borderRadius:'2px 2px 0 0' }} />
                  <span style={{ fontSize:8, color:'var(--text-low)' }}>{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter + alert */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', gap:2, background:'rgba(63,169,245,0.06)', borderRadius:8, padding:3, border:'1px solid var(--border-subtle)' }}>
          {['all','promoter','passive','detractor'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'4px 14px', borderRadius:6, fontSize:11, fontFamily:'var(--font-body)', border:'none', cursor:'pointer', background:filter===f?'rgba(63,169,245,0.18)':'transparent', color:filter===f?'var(--brand)':'var(--text-low)', fontWeight:filter===f?600:400, transition:'all 0.15s', textTransform:'capitalize' }}>
              {f}{f!=='all'?' ('+responses.filter(r=>r.category===f).length+')':''}
            </button>
          ))}
        </div>
        {needsFollowUp > 0 && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:8, padding:'5px 14px' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--status-critical)' }} />
            <span style={{ fontSize:11, color:'var(--status-critical)', fontWeight:600 }}>{needsFollowUp} detractor{needsFollowUp>1?'s':''} need follow-up</span>
          </div>
        )}
      </div>

      {/* Response list */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.sort((a,b) => a.score - b.score).map(r => {
          const cs = categoryStyle[r.category];
          const isSelected = selected === r.id;
          const sel = responses.find(x => x.id === r.id);
          return (
            <div key={r.id} className="glass" onClick={() => setSelected(isSelected ? null : r.id)} style={{ padding:'14px 18px', cursor:'pointer', border:'1px solid '+(isSelected?cs.color:'var(--border-subtle)'), borderLeft:'4px solid '+cs.color, transition:'all 0.15s' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:cs.bg, border:'2px solid '+cs.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span className="mono" style={{ fontSize:18, fontWeight:700, color:cs.color }}>{r.score}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text-high)' }}>{r.customer}</span>
                    <span style={{ fontSize:11, color:'var(--text-low)' }}>{r.contact}</span>
                    <span style={{ fontSize:9, fontWeight:600, color:cs.color, background:cs.bg, padding:'1px 7px', borderRadius:100 }}>{cs.label}</span>
                    <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-low)' }}>{r.date}</span>
                    {sel.followedUp && <span style={{ fontSize:9, color:'var(--status-ok)', background:'rgba(52,211,153,0.1)', padding:'1px 6px', borderRadius:100 }}>check Followed up</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--brand)', marginBottom:5, opacity:0.7 }}>{r.job}</div>
                  <p style={{ fontSize:13, color:'var(--text-mid)', lineHeight:1.55, margin:0 }}>{isSelected ? r.comment : r.comment.length > 140 ? r.comment.slice(0,140)+'...' : r.comment}</p>
                  {sel.reply && <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:6, fontSize:11, color:'var(--status-ok)' }}>Reply sent: {sel.reply}</div>}

                  {isSelected && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop:10 }}>
                      {r.category === 'detractor' && !sel.followedUp && (
                        <>
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Draft a reply to this customer..." style={{ width:'100%', height:64, background:'rgba(63,169,245,0.04)', border:'1px solid var(--border-subtle)', borderRadius:7, padding:'8px 12px', color:'var(--text-high)', fontSize:12, fontFamily:'var(--font-body)', outline:'none', resize:'none', lineHeight:1.5, marginBottom:8 }} />
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => sendReply(r.id)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, color:'var(--status-ok)', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)' }}>Send Reply</button>
                            <button onClick={() => markFollowedUp(r.id)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, color:'var(--brand)', background:'rgba(63,169,245,0.08)', border:'1px solid var(--border-strong)', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)' }}>Mark Followed Up</button>
                            <button onClick={() => createTicket(r)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, color:'var(--status-warn)', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)' }}>Create Ticket</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { NPSScreen });

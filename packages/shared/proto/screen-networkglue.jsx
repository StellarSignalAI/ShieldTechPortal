/* ShieldTech — Network Glue layer (IT Glue / Network Glue-class)
   Five capabilities, shared across the desktop tech app AND ShieldTech Mobile:
     1. Network Discovery   — lightweight collector auto-discovers every device
     2. Port Map / Diagram  — auto-documented switch-port mapping
     3. Microsoft Docs      — M365 / Entra ID / Active Directory users & groups
     4. BitLocker Keys      — recovery keys, auto-linked to their device
     5. Password Rotation   — scheduled / on-demand / bulk rotation engine
   Data lives on window.* so the purpose-built mobile views render the same records. */

/* ════════════════ SHARED DATA MODEL ════════════════ */
const NG_CLASS = {
  managed:   { label: 'Managed',   color: 'var(--status-ok)',   glyph: '●' },
  unmanaged: { label: 'Unmanaged', color: 'var(--status-warn)', glyph: '○' },
  virtual:   { label: 'Virtual',   color: '#a78bfa',            glyph: '◇' },
  hyperv:    { label: 'Hyper-V',   color: '#60a5fa',            glyph: '▢' },
  vmware:    { label: 'VMware',    color: '#818cf8',            glyph: '▣' },
};

/* Discovered devices (collector inbox) */
const NG_DISCOVERED = [];

/* Switch port maps — keyed by switch */
const NG_SWITCHES = [];
/* Per-switch port assignments. Anything not listed = empty. */
const NG_PORTMAP = {};
const NG_PORT_TYPE = {
  uplink:{c:'#a78bfa',l:'Uplink'}, trunk:{c:'#a78bfa',l:'Trunk'}, camera:{c:'var(--status-ok)',l:'Camera'},
  access:{c:'var(--status-warn)',l:'Access'}, ap:{c:'#60a5fa',l:'AP'}, device:{c:'var(--brand)',l:'Device'},
  host:{c:'#818cf8',l:'Host/VM'}, rogue:{c:'var(--status-critical)',l:'Rogue'},
};

/* Microsoft identity — users */
const NG_MS_USERS = [];
/* Microsoft identity — groups */
const NG_MS_GROUPS = [];
const NG_MS_SYNC = [];

/* BitLocker recovery keys */
const NG_BITLOCKER = [];

/* Password rotation engine */
const NG_ROTATION = [];
const NG_ROT_STATUS = {
  scheduled:{c:'var(--status-ok)',l:'Scheduled'}, due:{c:'var(--status-warn)',l:'Due soon'},
  overdue:{c:'var(--status-critical)',l:'Overdue'}, manual:{c:'var(--text-low)',l:'On demand'},
};

/* small helper */
function NgClassBadge({ cls }) {
  const c = NG_CLASS[cls] || NG_CLASS.unmanaged;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:4, background:`${c.color}1a`, color:c.color, whiteSpace:'nowrap' }}><span style={{ fontSize:8 }}>{c.glyph}</span>{c.label}</span>;
}

/* ════════════════ 1 · NETWORK DISCOVERY ════════════════ */
function NetworkDiscoveryView({ showToast }) {
  const [filter, setFilter] = React.useState('all');
  const [scanning, setScanning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [states, setStates] = React.useState(() => Object.fromEntries(NG_DISCOVERED.map(d => [d.id, d.state])));

  const runScan = () => {
    if (scanning) return;
    setScanning(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setScanning(false); showToast && showToast('Discovery complete — 12 devices, 4 new'); return 100; }
        return p + 4;
      });
    }, 60);
  };
  const setState = (id, s) => { setStates(prev => ({ ...prev, [id]: s })); };

  const counts = {
    total: NG_DISCOVERED.length,
    managed: NG_DISCOVERED.filter(d => d.cls === 'managed').length,
    unmanaged: NG_DISCOVERED.filter(d => d.cls === 'unmanaged').length,
    virtual: NG_DISCOVERED.filter(d => ['virtual','hyperv','vmware'].includes(d.cls)).length,
    new: Object.values(states).filter(s => s === 'new').length,
  };
  const rows = NG_DISCOVERED.filter(d => filter === 'all' ? true : filter === 'virtual' ? ['virtual','hyperv','vmware'].includes(d.cls) : filter === 'new' ? states[d.id] === 'new' : d.cls === filter);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Collector status */}
      <GlassPanel>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'rgba(63,169,245,0.1)', border:'1px solid var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⟲</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-high)' }}>ShieldTech Collector <span style={{ fontSize:10, color:'var(--text-low)', fontWeight:400 }}>v4.2.1</span></div>
              <div style={{ fontSize:10, color:'var(--text-low)' }}>Metro Bank · Main Office · lightweight agent</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.18)' }}>
            <StatusDot status="online" size={7} pulse />
            <span style={{ fontSize:11, color:'var(--status-ok)', fontWeight:600 }}>Collector online</span>
          </div>
          <div style={{ fontSize:10, color:'var(--text-low)' }}>Last scan <span className="mono" style={{ color:'var(--text-mid)' }}>2 min ago</span> · auto every 15 min</div>
          <div style={{ flex:1 }} />
          <button onClick={runScan} disabled={scanning} style={{ padding:'8px 18px', background: scanning ? 'rgba(63,169,245,0.1)' : 'var(--brand)', border:'none', borderRadius:7, color: scanning ? 'var(--brand)' : '#fff', fontSize:12, fontWeight:600, cursor: scanning ? 'default' : 'pointer', fontFamily:'var(--font-body)' }}>{scanning ? 'Scanning…' : '⟲ Run Discovery'}</button>
        </div>
        {scanning && (
          <div style={{ marginTop:12 }}>
            <div style={{ height:4, borderRadius:2, background:'rgba(63,169,245,0.1)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'var(--brand)', borderRadius:2, transition:'width 0.06s linear', boxShadow:'0 0 10px var(--brand)' }} />
            </div>
            <div className="mono" style={{ fontSize:10, color:'var(--text-low)', marginTop:5 }}>Probing 192.168.1.0/24 · ARP · SNMP · mDNS · {progress}% — {Math.round(progress/100*254)} hosts swept</div>
          </div>
        )}
      </GlassPanel>

      {/* Summary */}
      <div style={{ display:'flex', gap:10 }}>
        {[['DISCOVERED',counts.total,'var(--text-high)'],['MANAGED',counts.managed,'var(--status-ok)'],['UNMANAGED',counts.unmanaged,'var(--status-warn)'],['VIRTUAL / VM',counts.virtual,'#a78bfa'],['NEW — UNDOCUMENTED',counts.new,'var(--brand)']].map(([l,v,c]) => (
          <GlassPanel key={l} style={{ flex:1, padding:'12px 14px' }}>
            <div className="mono" style={{ fontSize:22, fontWeight:600, color:c, lineHeight:1.1 }}>{v}</div>
            <div style={{ fontSize:9, color:'var(--text-low)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{l}</div>
          </GlassPanel>
        ))}
      </div>

      {/* Inbox */}
      <GlassPanel style={{ padding:0 }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, fontWeight:600 }}>Discovered Devices</span>
          <div style={{ flex:1 }} />
          {[['all','All'],['new','New'],['managed','Managed'],['unmanaged','Unmanaged'],['virtual','Virtual / VM']].map(([id,l]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding:'4px 10px', borderRadius:5, fontSize:10, background: filter===id?'rgba(63,169,245,0.12)':'transparent', border:`1px solid ${filter===id?'var(--brand)':'var(--border-subtle)'}`, color: filter===id?'var(--brand)':'var(--text-low)', cursor:'pointer', fontFamily:'var(--font-body)' }}>{l}</button>
          ))}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Hostname','IP Address','MAC','Vendor','Type','Classification','Switch Port','Status',''].map((h,i)=>(
            <th key={i} style={{ textAlign:'left', padding:'8px 12px', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-low)', borderBottom:'1px solid var(--border-subtle)', whiteSpace:'nowrap' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{rows.map(d => {
            const st = states[d.id];
            const rogue = d.cls === 'unmanaged';
            return (
              <tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'} style={{ background: rogue && st==='new' ? 'rgba(251,191,36,0.03)' : 'transparent' }}>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize:12, fontWeight:500, color: rogue ? 'var(--status-warn)' : 'var(--text-high)' }}>{d.name}</span>
                </td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-mid)' }}>{d.ip}</td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-low)' }}>{d.mac}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-mid)' }}>{d.vendor}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-mid)' }}>{d.type}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}><NgClassBadge cls={d.cls} /></td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--brand)' }}>{d.port}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>
                  {st==='documented' ? <span style={{ fontSize:10, color:'var(--status-ok)' }}>✓ Documented</span>
                    : st==='ignored' ? <span style={{ fontSize:10, color:'var(--text-low)' }}>Ignored</span>
                    : <span style={{ fontSize:10, padding:'2px 7px', borderRadius:3, background:'rgba(63,169,245,0.1)', color:'var(--brand)', fontWeight:600 }}>NEW</span>}
                </td>
                <td style={{ padding:'8px 10px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>
                  {st==='new' ? (
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setState(d.id,'documented'); showToast && showToast(`${d.name} → created as Configuration`); }} style={{ padding:'3px 9px', background:'rgba(63,169,245,0.08)', border:'1px solid var(--border-strong)', borderRadius:4, color:'var(--brand)', fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap' }}>Accept</button>
                      <button onClick={() => { setState(d.id,'ignored'); showToast && showToast(`${d.name} ignored`); }} style={{ padding:'3px 9px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:4, color:'var(--text-low)', fontSize:10, cursor:'pointer', fontFamily:'var(--font-body)' }}>Ignore</button>
                    </div>
                  ) : (
                    <button onClick={() => showToast && showToast(`Opening ${d.name}`)} style={{ padding:'3px 9px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:4, color:'var(--text-low)', fontSize:10, cursor:'pointer', fontFamily:'var(--font-body)' }}>Open</button>
                  )}
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </GlassPanel>
      <div style={{ fontSize:10, color:'var(--text-low)', textAlign:'center' }}>Auto-discovers managed, unmanaged, virtual, Hyper-V and VMware devices — accepted devices flow into Configurations.</div>
    </div>
  );
}

/* ════════════════ 2 · PORT MAP / AUTO-DIAGRAM ════════════════ */
function PortMapView({ showToast }) {
  const [sw, setSw] = React.useState('sw01');
  const [sel, setSel] = React.useState(null);
  const cur = NG_SWITCHES.find(s => s.id === sw) || NG_SWITCHES[0];
  if (!cur) return (
    <div className="glass" style={{ padding: '40px 24px', textAlign: 'center', borderRadius: 12 }}>
      <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.5 }}>⊡</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)' }}>No switches discovered yet</div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 5 }}>Port maps auto-document once a network collector is connected from the desktop Monitoring Console.</div>
    </div>
  );
  const map = NG_PORTMAP[cur.id] || {};
  const ports = Array.from({ length: cur.ports }, (_, i) => i + 1);
  const half = cur.ports / 2;
  const used = Object.keys(map).length;
  const poePct = (cur.poeUsed / cur.poeTotal) * 100;

  const Port = ({ n }) => {
    const a = map[n];
    const t = a ? NG_PORT_TYPE[a.t] : null;
    const isSel = sel === n;
    return (
      <div onClick={() => a && setSel(isSel ? null : n)} title={a ? `${a.d} · ${a.spd}` : `Port ${n} — empty`} style={{
        position:'relative', height:34, borderRadius:5, cursor: a ? 'pointer' : 'default',
        background: a ? `${t.c}1f` : 'rgba(255,255,255,0.02)',
        border:`1.5px solid ${isSel ? t.c : a ? `${t.c}66` : 'var(--border-subtle)'}`,
        boxShadow: isSel ? `0 0 12px ${t.c}` : 'none',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', transition:'all 0.12s'
      }}>
        <span className="mono" style={{ fontSize:9, fontWeight:600, color: a ? t.c : 'var(--text-low)', lineHeight:1 }}>{n}</span>
        {a && a.poe > 0 && <span style={{ position:'absolute', top:2, right:3, fontSize:7, color:'var(--status-warn)' }}>⚡</span>}
        {a && <span style={{ width:4, height:4, borderRadius:'50%', background:t.c, marginTop:2 }} />}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Switch selector */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {NG_SWITCHES.map(s => (
          <button key={s.id} onClick={() => { setSw(s.id); setSel(null); }} style={{ padding:'8px 14px', borderRadius:8, background: sw===s.id?'rgba(63,169,245,0.12)':'var(--glass-bg)', border:`1px solid ${sw===s.id?'var(--brand)':'var(--border-subtle)'}`, cursor:'pointer', fontFamily:'var(--font-body)', textAlign:'left' }}>
            <div style={{ fontSize:12, fontWeight:600, color: sw===s.id?'var(--brand)':'var(--text-high)' }}>{s.name}</div>
            <div className="mono" style={{ fontSize:9, color:'var(--text-low)' }}>{s.model} · {s.ip}</div>
          </button>
        ))}
      </div>

      {/* Switch faceplate */}
      <GlassPanel>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>{cur.name}</div>
            <div style={{ fontSize:10, color:'var(--text-low)' }}>{used} of {cur.ports} ports active · auto-documented {' '}<span style={{ color:'var(--status-ok)' }}>✓ live</span></div>
          </div>
          <div style={{ minWidth:180 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text-low)', marginBottom:3 }}><span>PoE BUDGET</span><span className="mono">{cur.poeUsed}W / {cur.poeTotal}W</span></div>
            <div style={{ height:5, borderRadius:3, background:'rgba(63,169,245,0.1)', overflow:'hidden' }}><div style={{ width:`${poePct}%`, height:'100%', borderRadius:3, background: poePct>85?'var(--status-warn)':'var(--brand)' }} /></div>
          </div>
        </div>
        {/* two rows like a real switch */}
        <div style={{ background:'#0a0e14', border:'1px solid var(--border-subtle)', borderRadius:8, padding:12, overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${half}, minmax(26px,1fr))`, gap:5, marginBottom:5 }}>
            {ports.slice(0, half).map(n => <Port key={n} n={n} />)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${half}, minmax(26px,1fr))`, gap:5 }}>
            {ports.slice(half).map(n => <Port key={n} n={n} />)}
          </div>
        </div>
        {/* legend */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:12 }}>
          {Object.entries(NG_PORT_TYPE).map(([k,v]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9, height:9, borderRadius:3, background:`${v.c}33`, border:`1px solid ${v.c}` }} /><span style={{ fontSize:10, color:'var(--text-low)' }}>{v.l}</span></div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ fontSize:10, color:'var(--status-warn)' }}>⚡</span><span style={{ fontSize:10, color:'var(--text-low)' }}>PoE</span></div>
        </div>
      </GlassPanel>

      {/* Selected port detail */}
      {sel && map[sel] && (() => { const a = map[sel]; const t = NG_PORT_TYPE[a.t]; return (
        <GlassPanel style={{ borderLeft:`3px solid ${t.c}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{cur.name} · Port {sel}</span>
            <button onClick={() => setSel(null)} style={{ background:'none', border:'none', color:'var(--text-low)', fontSize:16, cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap:10 }}>
            {[['Connected device',a.d],['Link type',t.l],['Speed',a.spd],['VLAN',a.vlan],['PoE draw', a.poe!=null ? (a.poe>0?`${a.poe} W`:'none') : '—']].map(([k,v]) => (
              <div key={k} style={{ background:'rgba(63,169,245,0.03)', border:'1px solid var(--border-subtle)', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:8, color:'var(--text-low)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{k}</div>
                <div className="mono" style={{ fontSize:12, color:'var(--text-mid)' }}>{v}</div>
              </div>
            ))}
          </div>
          {a.t==='rogue' && <div style={{ marginTop:10, padding:'8px 12px', borderRadius:6, background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.2)', fontSize:11, color:'var(--status-critical)' }}>⚠ Unmanaged device on this port — review in Discovery before it reaches production VLANs.</div>}
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            <button onClick={() => showToast && showToast(`Opening ${a.d} configuration`)} style={{ padding:'5px 12px', background:'rgba(63,169,245,0.06)', border:'1px solid var(--border-subtle)', borderRadius:5, color:'var(--brand)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-body)' }}>⚙ Open Configuration</button>
            <button onClick={() => showToast && showToast(`Port ${sel} bounced`)} style={{ padding:'5px 12px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:5, color:'var(--text-low)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-body)' }}>Bounce Port</button>
          </div>
        </GlassPanel>
      ); })()}
      <div style={{ fontSize:10, color:'var(--text-low)', textAlign:'center' }}>Port-to-device mapping is auto-documented from the collector — connections, speeds, VLANs and PoE refresh every scan.</div>
    </div>
  );
}

/* ════════════════ 3 · MICROSOFT DOCUMENTATION ════════════════ */
function MicrosoftDocsView({ showToast }) {
  const [tab, setTab] = React.useState('users');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* connectors */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {NG_MS_SYNC.map(s => (
          <GlassPanel key={s.id} style={{ flex:1, minWidth:200, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:7, background:'rgba(63,169,245,0.08)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--brand)' }}>⊞</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:9, color:'var(--text-low)' }}>{s.sub}</div>
              </div>
              <StatusDot status="online" size={7} pulse />
            </div>
            <div style={{ fontSize:9, color:'var(--text-low)', marginTop:6 }}>Synced {s.last}</div>
          </GlassPanel>
        ))}
      </div>

      <div style={{ display:'flex', gap:4 }}>
        {[['users','Users'],['groups','Groups & Access']].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'5px 14px', borderRadius:6, fontSize:11, fontWeight: tab===id?600:400, background: tab===id?'rgba(63,169,245,0.12)':'transparent', border:`1px solid ${tab===id?'var(--brand)':'var(--border-subtle)'}`, color: tab===id?'var(--brand)':'var(--text-mid)', cursor:'pointer', fontFamily:'var(--font-body)' }}>{l}</button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={() => showToast && showToast('Re-syncing Microsoft directory…')} style={{ padding:'5px 12px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:6, color:'var(--text-low)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-body)' }}>⟲ Sync now</button>
      </div>

      {tab==='users' && (
        <GlassPanel style={{ padding:0 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['User','UPN / Email','Dept','Role','MFA','License','Groups','Last sign-in','Status'].map((h,i)=>(
              <th key={i} style={{ textAlign:'left', padding:'8px 12px', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-low)', borderBottom:'1px solid var(--border-subtle)', whiteSpace:'nowrap' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{NG_MS_USERS.map(u => (
              <tr key={u.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:12, fontWeight:500 }}>{u.name}</td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-mid)' }}>{u.upn}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-low)' }}>{u.dept}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-mid)' }}>{u.role}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>{u.mfa ? <span style={{ fontSize:10, color:'var(--status-ok)' }}>✓ On</span> : <span style={{ fontSize:10, color:'var(--status-critical)' }}>✕ Off</span>}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-low)' }}>{u.lic}</td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--brand)' }}>{u.groups}</td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-low)' }}>{u.signin}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={u.status==='enabled'?'online':'critical'} label={u.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}

      {tab==='groups' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:10 }}>
          {NG_MS_GROUPS.map(g => (
            <GlassPanel key={g.id}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{g.name}</span>
                <span style={{ fontSize:9, padding:'2px 8px', borderRadius:4, background:'rgba(63,169,245,0.08)', color:'var(--brand)', fontWeight:600 }}>{g.type}</span>
              </div>
              <div style={{ display:'flex', gap:14, marginBottom:8 }}>
                <div><span className="mono" style={{ fontSize:16, fontWeight:600, color:'var(--text-high)' }}>{g.members}</span><span style={{ fontSize:9, color:'var(--text-low)', marginLeft:4 }}>members</span></div>
                <div style={{ fontSize:10, color:'var(--text-low)', alignSelf:'center' }}>via {g.source}</div>
              </div>
              <div style={{ fontSize:9, color:'var(--text-low)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Access to</div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {g.resources.map((r,i) => <div key={i} className="mono" style={{ fontSize:10, color:'var(--text-mid)', padding:'3px 8px', borderRadius:4, background:'rgba(63,169,245,0.03)' }}>{r}</div>)}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
      <div style={{ fontSize:10, color:'var(--text-low)', textAlign:'center' }}>Users, groups, membership and permissions auto-enriched from Microsoft 365, Entra ID and Active Directory.</div>
    </div>
  );
}

/* ════════════════ 4 · BITLOCKER RECOVERY KEYS ════════════════ */
function BitLockerView({ showToast }) {
  const [revealed, setRevealed] = React.useState({});
  const reveal = (id) => { setRevealed(p => ({ ...p, [id]: !p[id] })); if (!revealed[id]) showToast && showToast('Key revealed — access audit-logged'); };
  const esc = NG_BITLOCKER.filter(b => b.status==='escrowed').length;
  const miss = NG_BITLOCKER.filter(b => b.status!=='escrowed').length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:10 }}>
        {[['ESCROWED KEYS',esc,'var(--status-ok)'],['PENDING / MISSING',miss, miss?'var(--status-warn)':'var(--text-low)'],['AUTO-LINKED','100%','var(--brand)']].map(([l,v,c]) => (
          <GlassPanel key={l} style={{ flex:1, padding:'12px 14px' }}>
            <div className="mono" style={{ fontSize:22, fontWeight:600, color:c, lineHeight:1.1 }}>{v}</div>
            <div style={{ fontSize:9, color:'var(--text-low)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{l}</div>
          </GlassPanel>
        ))}
      </div>
      <GlassPanel style={{ padding:0 }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:600, flex:1 }}>BitLocker Recovery Keys</span>
          <button onClick={() => showToast && showToast('Re-escrowing keys from Entra ID…')} style={{ padding:'4px 12px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:5, color:'var(--text-low)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-body)' }}>⟲ Re-escrow</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Device','Volume','Key ID','Recovery Key','Linked Config','Escrow','Rotated',''].map((h,i)=>(
            <th key={i} style={{ textAlign:'left', padding:'8px 12px', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-low)', borderBottom:'1px solid var(--border-subtle)', whiteSpace:'nowrap' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{NG_BITLOCKER.map(b => (
            <tr key={b.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:12, fontWeight:500 }}>{b.device}</td>
              <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-mid)' }}>{b.vol}</td>
              <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:9, color:'var(--text-low)' }}>{b.keyId.slice(0,13)}…</td>
              <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>
                {b.status==='escrowed' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span className="mono" style={{ fontSize:10, color: revealed[b.id]?'var(--text-high)':'var(--text-low)', letterSpacing: revealed[b.id]?'0':'0.1em', maxWidth:230, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{revealed[b.id] ? b.key : '•••••• •••••• •••••• ••••••'}</span>
                    <button onClick={() => reveal(b.id)} style={{ padding:'2px 6px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:3, color:'var(--text-low)', fontSize:9, cursor:'pointer', fontFamily:'var(--font-body)' }}>{revealed[b.id]?'Hide':'Reveal'}</button>
                    {revealed[b.id] && <button onClick={() => { navigator.clipboard?.writeText?.(b.key); showToast && showToast('Recovery key copied — clears in 30s'); }} style={{ padding:'2px 6px', background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:3, color:'var(--text-low)', fontSize:9, cursor:'pointer', fontFamily:'var(--font-body)' }}>Copy</button>}
                  </div>
                ) : <span style={{ fontSize:10, color:'var(--status-warn)' }}>⚠ Not yet escrowed</span>}
              </td>
              <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color: b.linked!=='—'?'var(--brand)':'var(--text-low)' }}>{b.linked}</td>
              <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-low)' }}>{b.escrow}</td>
              <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-low)' }}>{b.rotated}</td>
              <td style={{ padding:'8px 10px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>
                <button onClick={() => showToast && showToast(`Rotating BitLocker key for ${b.device}…`)} style={{ padding:'3px 9px', background:'rgba(63,169,245,0.06)', border:'1px solid var(--border-subtle)', borderRadius:4, color:'var(--brand)', fontSize:10, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap' }}>Rotate</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
      <div style={{ fontSize:10, color:'var(--text-low)', textAlign:'center' }}>Recovery keys are documented and auto-linked to their device for secure 24/7 retrieval and troubleshooting.</div>
    </div>
  );
}

/* ════════════════ 5 · PASSWORD ROTATION ════════════════ */
function PasswordRotationPanel({ showToast }) {
  const [sel, setSel] = React.useState({});
  const toggle = (id) => setSel(p => ({ ...p, [id]: !p[id] }));
  const selCount = Object.values(sel).filter(Boolean).length;
  const due = NG_ROTATION.filter(r => r.status==='due' || r.status==='overdue').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:10 }}>
        {[['AUTO-ROTATED', NG_ROTATION.filter(r=>r.status==='scheduled').length,'var(--status-ok)'],['DUE / OVERDUE', due, due?'var(--status-warn)':'var(--text-low)'],['ON DEMAND', NG_ROTATION.filter(r=>r.status==='manual').length,'var(--text-mid)'],['HOURS SAVED / YR','160','var(--brand)']].map(([l,v,c]) => (
          <GlassPanel key={l} style={{ flex:1, padding:'12px 14px' }}>
            <div className="mono" style={{ fontSize:22, fontWeight:600, color:c, lineHeight:1.1 }}>{v}</div>
            <div style={{ fontSize:9, color:'var(--text-low)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{l}</div>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel style={{ padding:0 }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, fontWeight:600 }}>Rotation Schedule</span>
          <div style={{ flex:1 }} />
          {selCount > 0 && <button onClick={() => { showToast && showToast(`Rotating ${selCount} credentials in bulk…`); setSel({}); }} style={{ padding:'5px 12px', background:'rgba(63,169,245,0.08)', border:'1px solid var(--border-strong)', borderRadius:6, color:'var(--brand)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Rotate {selCount} selected</button>}
          <button onClick={() => showToast && showToast(`Rotating all ${due} due credentials…`)} style={{ padding:'5px 14px', background:'var(--brand)', border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Rotate All Due</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['','Credential','Type','Schedule','Last rotated','Next','Status',''].map((h,i)=>(
            <th key={i} style={{ textAlign:'left', padding:'8px 12px', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-low)', borderBottom:'1px solid var(--border-subtle)', whiteSpace:'nowrap' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{NG_ROTATION.map(r => {
            const s = NG_ROT_STATUS[r.status] || NG_ROT_STATUS.manual;
            return (
              <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', width:28 }}>
                  <div onClick={() => toggle(r.id)} style={{ width:15, height:15, borderRadius:3, border:`1.5px solid ${sel[r.id]?'var(--brand)':'var(--border-subtle)'}`, background: sel[r.id]?'var(--brand)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>{sel[r.id] && <span style={{ fontSize:9, color:'#fff' }}>✓</span>}</div>
                </td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:12, fontWeight:500 }}>{r.name}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10 }}><span style={{ padding:'2px 8px', borderRadius:4, background:'rgba(63,169,245,0.06)', color:'var(--text-mid)' }}>{r.type}</span></td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color:'var(--text-mid)' }}>{r.schedule}</td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:10, color:'var(--text-low)' }}>{r.last}</td>
                <td className="mono" style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)', fontSize:11, color: r.status==='overdue'?'var(--status-critical)':r.status==='due'?'var(--status-warn)':'var(--text-mid)' }}>{r.next}</td>
                <td style={{ padding:'8px 12px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}><span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, color:s.c }}><span style={{ width:6, height:6, borderRadius:'50%', background:s.c }} />{s.l}</span></td>
                <td style={{ padding:'8px 10px', borderBottom:'1px solid rgba(63,169,245,0.04)' }}>
                  <button onClick={() => showToast && showToast(`Rotating ${r.name}…`)} style={{ padding:'3px 10px', background:'rgba(63,169,245,0.06)', border:'1px solid var(--border-subtle)', borderRadius:4, color:'var(--brand)', fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Rotate now</button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </GlassPanel>
      <div style={{ fontSize:10, color:'var(--text-low)', textAlign:'center' }}>Automate AD, Entra ID, M365 and device password rotation — on a schedule, on demand, or in bulk.</div>
    </div>
  );
}

Object.assign(window, {
  NG_CLASS, NG_DISCOVERED, NG_SWITCHES, NG_PORTMAP, NG_PORT_TYPE,
  NG_MS_USERS, NG_MS_GROUPS, NG_MS_SYNC, NG_BITLOCKER, NG_ROTATION, NG_ROT_STATUS,
  NgClassBadge, NetworkDiscoveryView, PortMapView, MicrosoftDocsView, BitLockerView, PasswordRotationPanel,
});

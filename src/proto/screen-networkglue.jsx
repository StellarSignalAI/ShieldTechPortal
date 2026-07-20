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
const NG_DISCOVERED = [
  { id: 'd1',  name: 'cam-lobby-01',    ip: '192.168.1.101', mac: 'AC:CC:8E:F0:12:34', vendor: 'Axis',       type: 'IP Camera',      cls: 'managed',   port: 'SW-01 · P3',  seen: '2m ago',  state: 'new' },
  { id: 'd2',  name: 'nvr-main',        ip: '192.168.1.100', mac: '00:09:18:A0:12:34', vendor: 'Hanwha',     type: 'NVR',            cls: 'managed',   port: 'SW-01 · P1',  seen: '2m ago',  state: 'documented' },
  { id: 'd3',  name: 'UNKNOWN-5F2A',    ip: '192.168.1.148', mac: 'B8:27:EB:5F:2A:1C', vendor: 'Raspberry Pi', type: 'Unknown',      cls: 'unmanaged', port: 'SW-01 · P14', seen: '2m ago',  state: 'new' },
  { id: 'd4',  name: 'sw-idf-01',       ip: '192.168.1.2',   mac: '00:1A:2B:3C:4D:5E', vendor: 'Cisco',      type: 'Switch',         cls: 'managed',   port: 'Core · P24',  seen: '2m ago',  state: 'documented' },
  { id: 'd5',  name: 'WIN-DC01',        ip: '192.168.1.10',  mac: '00:15:5D:01:0A:01', vendor: 'Microsoft',  type: 'Domain Ctrl',    cls: 'hyperv',    port: 'SW-01 · P2',  seen: '2m ago',  state: 'new' },
  { id: 'd6',  name: 'ESXi-HOST-01',    ip: '192.168.1.20',  mac: '00:50:56:9A:33:7B', vendor: 'VMware',     type: 'Hypervisor',     cls: 'vmware',    port: 'Core · P22',  seen: '2m ago',  state: 'documented' },
  { id: 'd7',  name: 'VM-FILES',        ip: '192.168.1.21',  mac: '00:50:56:9A:33:8C', vendor: 'VMware',     type: 'File Server',    cls: 'virtual',   port: 'virtual',     seen: '2m ago',  state: 'new' },
  { id: 'd8',  name: 'acr-frontdoor',   ip: '192.168.1.110', mac: '00:06:8E:21:44:09', vendor: 'HID',        type: 'Access Reader',  cls: 'managed',   port: 'SW-02 · P5',  seen: '2m ago',  state: 'documented' },
  { id: 'd9',  name: 'UNKNOWN-9931',    ip: '192.168.1.201', mac: '3C:5A:B4:99:31:7E', vendor: 'Espressif',  type: 'IoT (unidentified)', cls: 'unmanaged', port: 'SW-02 · P19', seen: '2m ago', state: 'new' },
  { id: 'd10', name: 'ap-floor1',       ip: '192.168.1.5',   mac: 'FC:EC:DA:00:11:22', vendor: 'Ubiquiti',   type: 'Access Point',   cls: 'managed',   port: 'SW-01 · P8',  seen: '2m ago',  state: 'documented' },
  { id: 'd11', name: 'VM-BACKUP',       ip: '192.168.1.22',  mac: '00:50:56:9A:33:9D', vendor: 'VMware',     type: 'Backup Appliance', cls: 'virtual', port: 'virtual',     seen: '2m ago',  state: 'new' },
  { id: 'd12', name: 'alarm-panel-01',  ip: '192.168.1.120', mac: '00:1B:44:11:3A:B7', vendor: 'DSC',        type: 'Alarm Panel',    cls: 'managed',   port: 'SW-02 · P7',  seen: '2m ago',  state: 'documented' },
];

/* Switch port maps — keyed by switch */
const NG_SWITCHES = [
  { id: 'core', name: 'Core Switch', model: 'USW-Pro-48-PoE', ports: 48, poeUsed: 185, poeTotal: 400, ip: '10.1.1.2' },
  { id: 'sw01', name: 'SW-01 (IDF Floor 1)', model: 'USW-24-PoE', ports: 24, poeUsed: 142, poeTotal: 250, ip: '10.1.4.2' },
  { id: 'sw02', name: 'SW-02 (Floor 2)', model: 'USW-24-PoE', ports: 24, poeUsed: 98, poeTotal: 250, ip: '10.1.5.2' },
];
/* Per-switch port assignments. Anything not listed = empty. */
const NG_PORTMAP = {
  core: { 1:{d:'USG-Pro-4',t:'uplink',spd:'10G',vlan:'all'}, 22:{d:'ESXi-HOST-01',t:'host',spd:'10G',vlan:'Servers',poe:0}, 24:{d:'SW-01',t:'trunk',spd:'1G',vlan:'all'}, 23:{d:'SW-02',t:'trunk',spd:'1G',vlan:'all'}, 12:{d:'App Server',t:'host',spd:'1G',vlan:'Servers'}, 13:{d:'NVR-01',t:'device',spd:'1G',vlan:'Security',poe:0} },
  sw01: { 1:{d:'nvr-main',t:'device',spd:'1G',vlan:'Security',poe:0}, 2:{d:'WIN-DC01',t:'host',spd:'1G',vlan:'Servers'}, 3:{d:'cam-lobby-01',t:'camera',spd:'100M',vlan:'Security',poe:12.4}, 4:{d:'cam-parking-n',t:'camera',spd:'100M',vlan:'Security',poe:12.4}, 8:{d:'ap-floor1',t:'ap',spd:'1G',vlan:'all',poe:9.2}, 14:{d:'UNKNOWN-5F2A',t:'rogue',spd:'100M',vlan:'Default',poe:3.1}, 24:{d:'Core',t:'uplink',spd:'1G',vlan:'all'} },
  sw02: { 5:{d:'acr-frontdoor',t:'access',spd:'100M',vlan:'Security',poe:3.8}, 7:{d:'alarm-panel-01',t:'device',spd:'100M',vlan:'Security',poe:2.4}, 8:{d:'ACR-02',t:'access',spd:'100M',vlan:'Security',poe:3.8}, 19:{d:'UNKNOWN-9931',t:'rogue',spd:'100M',vlan:'IoT',poe:1.8}, 24:{d:'Core',t:'uplink',spd:'1G',vlan:'all'} },
};
const NG_PORT_TYPE = {
  uplink:{c:'#a78bfa',l:'Uplink'}, trunk:{c:'#a78bfa',l:'Trunk'}, camera:{c:'var(--status-ok)',l:'Camera'},
  access:{c:'var(--status-warn)',l:'Access'}, ap:{c:'#60a5fa',l:'AP'}, device:{c:'var(--brand)',l:'Device'},
  host:{c:'#818cf8',l:'Host/VM'}, rogue:{c:'var(--status-critical)',l:'Rogue'},
};

/* Microsoft identity — users */
const NG_MS_USERS = [
  { id:'u1', name:'Linda Park',   upn:'lpark@metrobank.com',  dept:'Security',  role:'Security Manager', mfa:true,  lic:'M365 E3', groups:6, signin:'2h ago',  status:'enabled' },
  { id:'u2', name:'James Cole',   upn:'jcole@metrobank.com',  dept:'IT',        role:'IT Admin',         mfa:true,  lic:'M365 E5', groups:11,signin:'18m ago', status:'enabled' },
  { id:'u3', name:'Rachel Diaz',  upn:'rdiaz@metrobank.com',  dept:'Operations',role:'Ops Lead',         mfa:false, lic:'M365 E3', groups:4, signin:'1d ago',  status:'enabled' },
  { id:'u4', name:'Tom Becker',   upn:'tbecker@metrobank.com',dept:'Finance',   role:'Controller',       mfa:true,  lic:'M365 E3', groups:5, signin:'4h ago',  status:'enabled' },
  { id:'u5', name:'svc-backup',   upn:'svc-backup@metrobank.com',dept:'Service',role:'Service Account',  mfa:false, lic:'—',       groups:2, signin:'3m ago',  status:'enabled' },
  { id:'u6', name:'Greg Olsen',   upn:'golsen@metrobank.com', dept:'Sales',     role:'Account Exec',     mfa:false, lic:'M365 F3', groups:3, signin:'45d ago', status:'disabled' },
];
/* Microsoft identity — groups */
const NG_MS_GROUPS = [
  { id:'g1', name:'Security Team',     type:'M365',         members:8,  source:'Entra ID',         resources:['SharePoint: Security', 'Teams: SOC', 'Mailbox: alerts@'] },
  { id:'g2', name:'Domain Admins',     type:'Security',     members:3,  source:'Active Directory',  resources:['Full directory control', 'GPO management'] },
  { id:'g3', name:'All Staff',         type:'Distribution', members:142,source:'Entra ID',         resources:['Company broadcast'] },
  { id:'g4', name:'Finance',           type:'Security',     members:6,  source:'Active Directory',  resources:['\\\\fileserver\\finance', 'QuickBooks share'] },
  { id:'g5', name:'BitLocker-Escrow',  type:'Security',     members:24, source:'Entra ID',         resources:['Device recovery keys'] },
];
const NG_MS_SYNC = [
  { id:'m365',  label:'Microsoft 365',    sub:'14 licenses · 142 users', status:'synced',  last:'4 min ago' },
  { id:'entra', label:'Entra ID',         sub:'Tenant: metrobank.onmicrosoft.com', status:'synced', last:'4 min ago' },
  { id:'ad',    label:'Active Directory', sub:'DC: WIN-DC01 · metrobank.local', status:'synced', last:'12 min ago' },
];

/* BitLocker recovery keys */
const NG_BITLOCKER = [
  { id:'b1', device:'WIN-DC01',        vol:'OS (C:)',   keyId:'A1B2C3D4-5E6F-7890-ABCD-EF1234567890', key:'481923-007264-558102-339471-118260-907553-224418-660031', linked:'WIN-DC01 (Hyper-V)',     escrow:'Entra ID',        rotated:'Feb 12, 2026', status:'escrowed' },
  { id:'b2', device:'NVR-WORKSTATION', vol:'OS (C:)',   keyId:'B2C3D4E5-6F70-8901-BCDE-F12345678901', key:'220471-883106-447290-118365-660042-229517-883104-447291', linked:'NVR Admin Station',      escrow:'Active Directory',rotated:'Jan 30, 2026', status:'escrowed' },
  { id:'b3', device:'ESXi-MGMT-VM',    vol:'Data (D:)', keyId:'C3D4E5F6-7081-9012-CDEF-123456789012', key:'907553-224418-660031-481923-007264-558102-339471-118260', linked:'ESXi-HOST-01 (VMware)',  escrow:'Entra ID',        rotated:'Mar 04, 2026', status:'escrowed' },
  { id:'b4', device:'RECEPTION-PC',    vol:'OS (C:)',   keyId:'D4E5F6G7-8192-0123-DEF0-234567890123', key:'118365-660042-229517-883104-447291-220471-883106-447290', linked:'—',                     escrow:'pending',         rotated:'—',            status:'missing' },
];

/* Password rotation engine */
const NG_ROTATION = [
  { id:'r1', name:'WIN-DC01 — Administrator', type:'Active Directory', schedule:'30 days', last:'Feb 12, 2026', next:'in 4 days',  status:'scheduled' },
  { id:'r2', name:'svc-backup',               type:'Entra ID',         schedule:'30 days', last:'Mar 01, 2026', next:'in 19 days', status:'scheduled' },
  { id:'r3', name:'NVR Admin',                type:'Device',           schedule:'90 days', last:'Feb 04, 2026', next:'in 2 days',  status:'due' },
  { id:'r4', name:'Access Panel — installer', type:'Device',           schedule:'90 days', last:'Dec 20, 2025', next:'overdue 3d', status:'overdue' },
  { id:'r5', name:'M365 — break-glass admin', type:'Microsoft 365',    schedule:'On demand',last:'May 30, 2026', next:'manual',     status:'manual' },
  { id:'r6', name:'Monitoring Portal',        type:'Device',           schedule:'60 days', last:'Apr 18, 2026', next:'in 31 days', status:'scheduled' },
];
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
  const cur = NG_SWITCHES.find(s => s.id === sw);
  const map = NG_PORTMAP[sw] || {};
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

/* ShieldTech Mobile — Monitoring Console (Topology · Cameras · Alerts)
   Touch-native parity with the desktop Monitoring Console. The desktop view is a
   240px-sidebar + fixed-coordinate SVG canvas that can't reflow to a phone, so this
   is a purpose-built mobile console over the same network model:
   • Topology  — expandable network tree (ISP → gateway → switches → devices), tap for detail
   • Cameras   — live-style camera grid, tap for detail
   • Alerts    — critical alert feed */

const MM_CUSTOMERS = [
  { id: 'metro-bank', name: 'Metro Bank Corp', sites: 3, devices: 42, status: 'healthy' },
  { id: 'acme-dental', name: 'Acme Dental', sites: 1, devices: 18, status: 'warning' },
  { id: 'city-hall', name: 'City Hall', sites: 2, devices: 36, status: 'healthy' },
  { id: 'riverside-med', name: 'Riverside Medical', sites: 1, devices: 24, status: 'critical' },
  { id: 'pacific-rim', name: 'Pacific Rim Hotels', sites: 5, devices: 128, status: 'healthy' },
  { id: 'harbor-view', name: 'Harbor View Condos', sites: 1, devices: 14, status: 'healthy' },
  { id: 'westfield', name: 'Westfield Mall', sites: 1, devices: 52, status: 'warning' },
];

const MM_TYPE_COLOR = {
  ISP: '#5c6f86', Gateway: 'var(--brand)', Switch: 'var(--brand)', 'Access Point': '#a78bfa',
  Camera: 'var(--status-ok)', Access: 'var(--status-warn)', Alarm: 'var(--status-critical)',
  NVR: '#60a5fa', Server: '#818cf8',
};

const MM_NODES = [
  { id: 'isp', parent: null, glyph: '☁', label: 'Comcast Business', sub: 'WAN1 · 1 Gbps', type: 'ISP', status: 'online' },
  { id: 'gw', parent: 'isp', glyph: '🛡', label: 'USG-Pro-4', sub: '10.1.1.1', type: 'Gateway', status: 'online', model: 'Ubiquiti USG-Pro-4', mac: 'fc:ec:da:12:34:56', uptime: '42d 6h', cpu: 12, mem: 34, throughput: '245 Mbps' },
  { id: 'core', parent: 'gw', glyph: '⊞', label: 'Core Switch', sub: 'USW-Pro-48 · 10.1.1.2', type: 'Switch', status: 'online', model: 'USW-Pro-48-PoE', ports: 48, poeUsed: 185, poeTotal: 400, uptime: '42d 6h' },
  { id: 'sw-f1', parent: 'core', glyph: '⊞', label: 'Floor 1 PoE', sub: 'USW-24 · 10.1.4.2', type: 'Switch', status: 'online', model: 'USW-24-PoE', ports: 24, poeUsed: 142, poeTotal: 250 },
  { id: 'ap-f1', parent: 'sw-f1', glyph: '⊚', label: 'AP-Floor1', sub: 'U6-Pro · 8 clients', type: 'Access Point', status: 'online', model: 'U6-Pro', clients: 8, channel: '36 / 80MHz' },
  { id: 'cam1', parent: 'sw-f1', glyph: '◉', label: 'CAM-01 Main Entry', sub: 'Axis P3265-V', type: 'Camera', status: 'online', vendor: 'Axis', vlan: 'Security', poe: 12.4 },
  { id: 'cam2', parent: 'sw-f1', glyph: '◉', label: 'CAM-02 Lobby', sub: 'Verkada CD52', type: 'Camera', status: 'online', vendor: 'Verkada', vlan: 'Security', poe: 25.5 },
  { id: 'cam3', parent: 'sw-f1', glyph: '◉', label: 'CAM-03 Parking', sub: 'Axis P3265-V', type: 'Camera', status: 'online', vendor: 'Axis', vlan: 'Security', poe: 12.4 },
  { id: 'cam4', parent: 'sw-f1', glyph: '◉', label: 'CAM-04 Rear Exit', sub: 'Hikvision DS-2CD', type: 'Camera', status: 'offline', vendor: 'Hikvision', vlan: 'Security', poe: 12 },
  { id: 'sw-f2', parent: 'core', glyph: '⊞', label: 'Floor 2 PoE', sub: 'USW-24 · 10.1.5.2', type: 'Switch', status: 'online', model: 'USW-24-PoE', ports: 24, poeUsed: 98, poeTotal: 250 },
  { id: 'ap-f2', parent: 'sw-f2', glyph: '⊚', label: 'AP-Floor2', sub: 'U6-LR · 12 clients', type: 'Access Point', status: 'online', model: 'U6-LR', clients: 12, channel: '149 / 80MHz' },
  { id: 'acr1', parent: 'sw-f2', glyph: '⊠', label: 'ACR-01 Main Door', sub: 'HID iCLASS SE', type: 'Access', status: 'online', vendor: 'HID', poe: 3.8 },
  { id: 'acr2', parent: 'sw-f2', glyph: '⊠', label: 'ACR-02 Server Rm', sub: 'HID iCLASS SE', type: 'Access', status: 'online', vendor: 'HID', poe: 3.8 },
  { id: 'panel', parent: 'sw-f2', glyph: '⚠', label: 'Alarm Panel', sub: 'DSC PowerSeries', type: 'Alarm', status: 'online', vendor: 'DSC' },
  { id: 'sw-srv', parent: 'core', glyph: '⊞', label: 'Server Room', sub: 'USW-16 · 10.1.1.3', type: 'Switch', status: 'online', model: 'USW-16', ports: 16 },
  { id: 'nvr', parent: 'sw-srv', glyph: '⊟', label: 'NVR-01', sub: 'Axis S3008', type: 'NVR', status: 'online', storage: '6TB / 8TB' },
  { id: 'server', parent: 'sw-srv', glyph: '▢', label: 'App Server', sub: 'Dell R740', type: 'Server', status: 'online' },
];

const MM_CAMERAS = [
  { id: 'c1', name: 'Main Entrance', model: 'Axis P3265-V', status: 'online', fps: 30, bitrate: '4.2', storage: '14d', resolution: '4MP', recording: true },
  { id: 'c2', name: 'Parking Lot A', model: 'Axis P3265-V', status: 'online', fps: 30, bitrate: '5.1', storage: '14d', resolution: '4MP', recording: true },
  { id: 'c3', name: 'Server Room', model: 'Axis M3075-V', status: 'online', fps: 15, bitrate: '2.8', storage: '30d', resolution: '2MP', recording: true },
  { id: 'c4', name: 'Rear Exit', model: 'Hikvision DS-2CD2143', status: 'offline', fps: 0, bitrate: '0', storage: '14d', resolution: '4MP', recording: false },
  { id: 'c5', name: 'Lobby', model: 'Verkada CD52', status: 'online', fps: 30, bitrate: '3.9', storage: '30d', resolution: '5MP', recording: true },
  { id: 'c6', name: 'Hallway B', model: 'Axis P3265-V', status: 'online', fps: 25, bitrate: '3.5', storage: '14d', resolution: '4MP', recording: true },
  { id: 'c7', name: 'Loading Dock', model: 'Axis Q6135-LE', status: 'online', fps: 30, bitrate: '6.2', storage: '14d', resolution: '2MP', recording: true },
  { id: 'c8', name: 'Stairwell', model: 'Axis M3075-V', status: 'warning', fps: 15, bitrate: '1.2', storage: '30d', resolution: '2MP', recording: true },
];

const MM_ALERTS = [
  { id: 1, sev: 'critical', title: 'CAM-04 Rear Exit — signal lost', sub: 'Floor 1 · offline 6m ago · PoE port down', device: 'cam4' },
  { id: 2, sev: 'warning', title: 'Stairwell camera — low bitrate', sub: '1.2 Mbps · possible cabling fault', device: null },
  { id: 3, sev: 'warning', title: 'Core Switch PoE budget 78%', sub: '185W / 400W · nearing capacity', device: 'core' },
  { id: 4, sev: 'info', title: 'Firmware available — 3 Axis cameras', sub: 'v11.9.x · schedule maintenance window', device: null },
];

const mmDot = (status) => status === 'online' ? 'var(--status-ok)' : status === 'offline' ? 'var(--status-critical)' : 'var(--status-warn)';
const mmSevColor = (s) => s === 'critical' ? 'var(--status-critical)' : s === 'warning' ? 'var(--status-warn)' : 'var(--brand)';

/* ── Node detail sheet ── */
function MMNodeDetail({ node, onClose, onNav }) {
  const c = MM_TYPE_COLOR[node.type] || 'var(--brand)';
  const specs = [
    ['Type', node.type], ['Status', node.status], ['Model', node.model], ['IP', node.sub && node.sub.match(/10\.[\d.]+/) ? node.sub.match(/10\.[\d.]+/)[0] : null],
    ['MAC', node.mac], ['Uptime', node.uptime], ['Throughput', node.throughput], ['Ports', node.ports],
    ['Clients', node.clients], ['Channel', node.channel], ['Storage', node.storage], ['Vendor', node.vendor],
    ['VLAN', node.vlan], ['PoE draw', node.poe ? `${node.poe} W` : null],
  ].filter(([, v]) => v != null);
  return (
    <MSheet title={node.label} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 11, background: `${c}1c`, border: `1px solid ${c}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{node.glyph}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{node.model || node.type}</div>
            <MBadge color={mmDot(node.status)}>{node.status}</MBadge>
          </div>
        </div>
        {(node.cpu != null || node.poeUsed != null) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {node.cpu != null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-low)', marginBottom: 3 }}><span>CPU {node.cpu}%</span><span>MEM {node.mem}%</span></div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <div style={{ flex: 1 }}><MBar pct={node.cpu} /></div>
                  <div style={{ flex: 1 }}><MBar pct={node.mem} color="#a78bfa" /></div>
                </div>
              </div>
            )}
            {node.poeUsed != null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-low)', marginBottom: 3 }}><span>PoE budget</span><span>{node.poeUsed}W / {node.poeTotal}W</span></div>
                <MBar pct={(node.poeUsed / node.poeTotal) * 100} color={node.poeUsed / node.poeTotal > 0.85 ? 'var(--status-warn)' : 'var(--brand)'} />
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {specs.map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-mid)', textTransform: k === 'Status' ? 'capitalize' : 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { onClose(); onNav && onNav('assets'); }} style={{ flex: 2, padding: '12px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚙ Open in Assets</button>
          <button onClick={() => showToast('Ping: 2ms', 'ok')} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ping</button>
          <button onClick={() => showToast(`Restarting ${node.label}…`, 'warn')} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Restart</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Topology tree ── */
function MMTopology({ onOpen }) {
  const [collapsed, setCollapsed] = React.useState({});
  const childrenOf = (id) => MM_NODES.filter(n => n.parent === id);
  const toggle = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const Row = ({ node, depth }) => {
    const kids = childrenOf(node.id);
    const c = MM_TYPE_COLOR[node.type] || 'var(--brand)';
    const isCollapsed = collapsed[node.id];
    return (
      <React.Fragment>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: depth * 16 }}>
          {/* connector */}
          {depth > 0 && <span style={{ width: 10, height: 1, background: 'var(--border-strong)', flexShrink: 0, marginLeft: -4 }}></span>}
          <div onClick={() => onOpen(node)} className="glass" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 10, cursor: 'pointer', borderLeft: `3px solid ${node.status === 'offline' ? 'var(--status-critical)' : c}` }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: `${c}18`, border: `1px solid ${c}40`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{node.glyph}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</div>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.sub}</div>
            </div>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: mmDot(node.status), boxShadow: node.status === 'online' ? '0 0 6px var(--status-ok)' : 'none', flexShrink: 0 }}></span>
          </div>
          {kids.length > 0 && (
            <button onClick={() => toggle(node.id)} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-body)', transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>▼</button>
          )}
        </div>
        {!isCollapsed && kids.map(k => <Row key={k.id} node={k} depth={depth + 1} />)}
      </React.Fragment>
    );
  };

  const roots = MM_NODES.filter(n => n.parent === null);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{roots.map(r => <Row key={r.id} node={r} depth={0} />)}</div>;
}

/* ── Camera grid ── */
function MMCameras({ onOpen }) {
  const online = MM_CAMERAS.filter(c => c.status === 'online').length;
  const offline = MM_CAMERAS.filter(c => c.status === 'offline').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>◉ {MM_CAMERAS.length} Cameras</span>
        <MBadge color="var(--status-ok)">{online} online</MBadge>
        {offline > 0 && <MBadge color="var(--status-critical)">{offline} offline</MBadge>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {MM_CAMERAS.map(cam => (
          <div key={cam.id} onClick={() => onOpen(cam)} className="glass" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', borderColor: cam.status === 'offline' ? 'rgba(244,63,94,0.3)' : 'var(--border-subtle)' }}>
            <div style={{ height: 88, background: cam.status === 'offline' ? 'rgba(244,63,94,0.05)' : 'linear-gradient(135deg, rgba(10,14,20,0.9), rgba(17,23,33,0.8))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {cam.status === 'offline' ? (
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: 20, opacity: 0.3 }}>◉</span><div style={{ fontSize: 9, color: 'var(--status-critical)', marginTop: 2, fontWeight: 600 }}>SIGNAL LOST</div></div>
              ) : (
                <>
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(63,169,245,0.025) 2px, rgba(63,169,245,0.025) 4px)' }}></div>
                  <span style={{ fontSize: 26, opacity: 0.12 }}>◉</span>
                  {cam.recording && (
                    <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-critical)' }}></span>
                      <span className="mono" style={{ fontSize: 7, color: 'var(--status-critical)', fontWeight: 700 }}>REC</span>
                    </div>
                  )}
                  <span className="mono" style={{ position: 'absolute', bottom: 5, right: 7, fontSize: 7, color: 'var(--text-low)' }}>{cam.fps}fps · {cam.bitrate}Mbps</span>
                  {cam.status === 'warning' && <span style={{ position: 'absolute', top: 6, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--status-warn)' }}></span>}
                </>
              )}
            </div>
            <div style={{ padding: '7px 9px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cam.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cam.model} · {cam.resolution}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Camera detail sheet ── */
function MMCameraDetail({ cam, onClose }) {
  const specs = [['Status', cam.status], ['Model', cam.model], ['Resolution', cam.resolution], ['Frame rate', `${cam.fps} fps`], ['Bitrate', `${cam.bitrate} Mbps`], ['Retention', cam.storage], ['Recording', cam.recording ? 'Active' : 'Stopped']];
  return (
    <MSheet title={cam.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ height: 150, borderRadius: 12, background: cam.status === 'offline' ? 'rgba(244,63,94,0.05)' : 'linear-gradient(135deg, rgba(10,14,20,0.9), rgba(17,23,33,0.8))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {cam.status === 'offline'
            ? <div style={{ textAlign: 'center' }}><span style={{ fontSize: 28, opacity: 0.3 }}>◉</span><div style={{ fontSize: 11, color: 'var(--status-critical)', marginTop: 4, fontWeight: 600 }}>SIGNAL LOST</div></div>
            : <><div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(63,169,245,0.025) 2px, rgba(63,169,245,0.025) 4px)' }}></div><span style={{ fontSize: 40, opacity: 0.12 }}>◉</span>{cam.recording && <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-critical)' }}></span><span className="mono" style={{ fontSize: 9, color: 'var(--status-critical)', fontWeight: 700 }}>REC</span></div>}</>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {specs.map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-mid)', textTransform: 'capitalize' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => showToast('Opening live view…', 'ok')} style={{ flex: 2, padding: '12px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>▶ Live view</button>
          <button onClick={() => showToast('Opening playback…')} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Playback</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Alerts ── */
function MMAlerts({ onOpenNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {MM_ALERTS.map(a => {
        const c = mmSevColor(a.sev);
        const node = a.device ? MM_NODES.find(n => n.id === a.device) : null;
        return (
          <div key={a.id} onClick={() => node && onOpenNode(node)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${c}`, cursor: node ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <MBadge color={c}>{a.sev}</MBadge>
              {node && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--brand)' }}>View device ›</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{a.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{a.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile Network Discovery (collector inbox) ── */
function MMDiscovery({ onNav }) {
  const [filter, setFilter] = React.useState('all');
  const [scanning, setScanning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [states, setStates] = React.useState(() => Object.fromEntries((window.NG_DISCOVERED || []).map(d => [d.id, d.state])));
  const data = window.NG_DISCOVERED || [];
  const CLS = window.NG_CLASS || {};

  const runScan = () => {
    if (scanning) return;
    setScanning(true); setProgress(0);
    const iv = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(iv); setScanning(false); if (window.showToast) showToast('Discovery complete — 4 new', 'ok'); return 100; } return p + 5; }), 70);
  };
  const setState = (id, s) => setStates(prev => ({ ...prev, [id]: s }));
  const counts = {
    total: data.length,
    managed: data.filter(d => d.cls === 'managed').length,
    virtual: data.filter(d => ['virtual','hyperv','vmware'].includes(d.cls)).length,
    new: Object.values(states).filter(s => s === 'new').length,
  };
  const rows = data.filter(d => filter === 'all' ? true : filter === 'virtual' ? ['virtual','hyperv','vmware'].includes(d.cls) : filter === 'new' ? states[d.id] === 'new' : d.cls === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Collector */}
      <div className="glass" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⟲</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>ShieldTech Collector</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Online · last scan 2 min ago</div>
          </div>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-ok)', boxShadow: '0 0 7px var(--status-ok)', flexShrink: 0 }} />
        </div>
        <button onClick={runScan} disabled={scanning} style={{ marginTop: 10, width: '100%', padding: '11px 0', background: scanning ? 'rgba(63,169,245,0.1)' : 'var(--brand)', border: 'none', borderRadius: 10, color: scanning ? 'var(--brand)' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{scanning ? `Scanning… ${progress}%` : '⟲ Run Discovery'}</button>
        {scanning && <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.1)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', borderRadius: 2, boxShadow: '0 0 8px var(--brand)' }} /></div>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
        {[['ALL', counts.total, 'var(--text-high)'], ['MGD', counts.managed, 'var(--status-ok)'], ['VM', counts.virtual, '#a78bfa'], ['NEW', counts.new, 'var(--brand)']].map(([l, v, c]) => (
          <div key={l} className="glass" style={{ padding: '10px 8px', borderRadius: 11, textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 2, letterSpacing: '0.04em' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {[['all', 'All'], ['new', 'New'], ['managed', 'Managed'], ['unmanaged', 'Unmanaged'], ['virtual', 'Virtual']].map(([id, l]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 8, fontSize: 11, background: filter === id ? 'rgba(63,169,245,0.14)' : 'transparent', border: `1px solid ${filter === id ? 'var(--brand)' : 'var(--border-subtle)'}`, color: filter === id ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{l}</button>
        ))}
      </div>

      {/* Cards */}
      {rows.map(d => {
        const c = CLS[d.cls] || {};
        const st = states[d.id];
        const rogue = d.cls === 'unmanaged';
        return (
          <div key={d.id} className="glass" style={{ padding: '11px 13px', borderRadius: 12, borderLeft: `3px solid ${rogue ? 'var(--status-warn)' : c.color || 'var(--brand)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: rogue ? 'var(--status-warn)' : 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{d.ip} · {d.vendor}</div>
              </div>
              <MBadge color={c.color || 'var(--brand)'}>{c.label || d.cls}</MBadge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className="mono" style={{ fontSize: 9, color: 'var(--brand)', flex: 1 }}>{d.type} · {d.port}</span>
              {st === 'new' ? (
                <>
                  <button onClick={() => { setState(d.id, 'documented'); if (window.showToast) showToast(`${d.name} → Configuration`, 'ok'); }} style={{ padding: '6px 13px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Accept</button>
                  <button onClick={() => setState(d.id, 'ignored')} style={{ padding: '6px 11px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ignore</button>
                </>
              ) : st === 'documented' ? <span style={{ fontSize: 10, color: 'var(--status-ok)' }}>✓ Documented</span> : <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Ignored</span>}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Auto-discovers managed, unmanaged & virtual devices — same collector as the desktop app.</div>
    </div>
  );
}

/* ── Mobile Port Map ── */
function MMPortMap() {
  const SW = window.NG_SWITCHES || [];
  const MAP = window.NG_PORTMAP || {};
  const PT = window.NG_PORT_TYPE || {};
  const [sw, setSw] = React.useState(SW[1] ? SW[1].id : (SW[0] && SW[0].id));
  const [sel, setSel] = React.useState(null);
  const cur = SW.find(s => s.id === sw) || SW[0];
  if (!cur) return null;
  const map = MAP[sw] || {};
  const ports = Array.from({ length: cur.ports }, (_, i) => i + 1);
  const poePct = (cur.poeUsed / cur.poeTotal) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {SW.map(s => (
          <button key={s.id} onClick={() => { setSw(s.id); setSel(null); }} style={{ flexShrink: 0, padding: '8px 13px', borderRadius: 9, background: sw === s.id ? 'rgba(63,169,245,0.14)' : 'var(--glass-bg)', border: `1px solid ${sw === s.id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: sw === s.id ? 'var(--brand)' : 'var(--text-high)' }}>{s.name.split(' (')[0]}</div>
            <div className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{s.ports}-port</div>
          </button>
        ))}
      </div>

      <div className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 4 }}><span>PoE BUDGET</span><span className="mono">{cur.poeUsed}W / {cur.poeTotal}W</span></div>
        <MBar pct={poePct} color={poePct > 85 ? 'var(--status-warn)' : 'var(--brand)'} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 5, marginTop: 12 }}>
          {ports.map(n => {
            const a = map[n]; const t = a ? PT[a.t] : null; const isSel = sel === n;
            return (
              <div key={n} onClick={() => a && setSel(isSel ? null : n)} style={{ position: 'relative', height: 30, borderRadius: 5, cursor: a ? 'pointer' : 'default', background: a ? `${t.c}22` : 'rgba(255,255,255,0.02)', border: `1.5px solid ${isSel ? t.c : a ? `${t.c}66` : 'var(--border-subtle)'}`, boxShadow: isSel ? `0 0 10px ${t.c}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mono" style={{ fontSize: 9, fontWeight: 600, color: a ? t.c : 'var(--text-low)' }}>{n}</span>
                {a && a.poe > 0 && <span style={{ position: 'absolute', top: 1, right: 2, fontSize: 6, color: 'var(--status-warn)' }}>⚡</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {Object.entries(PT).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: `${v.c}33`, border: `1px solid ${v.c}` }} /><span style={{ fontSize: 9, color: 'var(--text-low)' }}>{v.l}</span></div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Auto-documented switch-port mapping — tap a port for device, speed, VLAN & PoE.</div>

      {sel && map[sel] && (() => { const a = map[sel]; const t = PT[a.t]; return (
        <MSheet title={`${cur.name.split(' (')[0]} · Port ${sel}`} onClose={() => setSel(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {[['Device', a.d], ['Type', t.l], ['Speed', a.spd], ['VLAN', a.vlan], ['PoE', a.poe != null ? (a.poe > 0 ? `${a.poe} W` : 'none') : '—']].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
                  <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-mid)' }}>{v}</div>
                </div>
              ))}
            </div>
            {a.t === 'rogue' && <div style={{ padding: '9px 12px', borderRadius: 9, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 11, color: 'var(--status-critical)' }}>⚠ Unmanaged device on this port — review in Discovery.</div>}
          </div>
        </MSheet>
      ); })()}
    </div>
  );
}

/* ── Console shell ── */
function MobileMonitoring({ onNav }) {
  const [custId, setCustId] = React.useState('metro-bank');
  const [tab, setTab] = React.useState('Map');
  const [custPick, setCustPick] = React.useState(false);
  const [node, setNode] = React.useState(null);
  const [cam, setCam] = React.useState(null);
  const cust = MM_CUSTOMERS.find(c => c.id === custId);
  const online = MM_NODES.filter(n => n.status === 'online').length;
  const offline = MM_NODES.filter(n => n.status === 'offline').length;
  const sColor = cust.status === 'healthy' ? 'var(--status-ok)' : cust.status === 'warning' ? 'var(--status-warn)' : 'var(--status-critical)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Customer selector */}
      <button onClick={() => setCustPick(true)} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: sColor, flexShrink: 0, boxShadow: `0 0 7px ${sColor}` }}></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{cust.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{cust.sites} site{cust.sites !== 1 ? 's' : ''} · {cust.devices} devices</div>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>▼</span>
      </button>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[['ONLINE', online, 'var(--status-ok)'], ['OFFLINE', offline, offline ? 'var(--status-critical)' : 'var(--text-low)'], ['CAMERAS', MM_CAMERAS.length, 'var(--brand)']].map(([l, v, c]) => (
          <div key={l} className="glass" style={{ padding: '12px 14px', borderRadius: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--text-low)', marginBottom: 3 }}>{l}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: c, lineHeight: 1.1 }}>{v}</div>
          </div>
        ))}
      </div>

      <MSegment options={['Map', 'Discover', 'Ports', 'Cameras', 'Alerts']} value={tab} onChange={setTab} />

      {tab === 'Map' && <MMTopology onOpen={setNode} />}
      {tab === 'Discover' && <MMDiscovery onNav={onNav} />}
      {tab === 'Ports' && <MMPortMap />}
      {tab === 'Cameras' && <MMCameras onOpen={setCam} />}
      {tab === 'Alerts' && <MMAlerts onOpenNode={(n) => { setTab('Map'); setNode(n); }} />}

      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Same live network model as the desktop Monitoring Console.</div>

      {custPick && (
        <MSheet title="Select Customer" onClose={() => setCustPick(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {MM_CUSTOMERS.map(c => {
              const cc = c.status === 'healthy' ? 'var(--status-ok)' : c.status === 'warning' ? 'var(--status-warn)' : 'var(--status-critical)';
              return (
                <button key={c.id} onClick={() => { setCustId(c.id); setCustPick(false); }} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', border: c.id === custId ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cc, flexShrink: 0 }}></span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{c.devices} dev</span>
                </button>
              );
            })}
          </div>
        </MSheet>
      )}
      {node && <MMNodeDetail node={node} onClose={() => setNode(null)} onNav={onNav} />}
      {cam && <MMCameraDetail cam={cam} onClose={() => setCam(null)} />}
    </div>
  );
}

Object.assign(window, { MobileMonitoring });

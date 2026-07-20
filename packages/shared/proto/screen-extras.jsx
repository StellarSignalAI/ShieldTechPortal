/* Additional Screens — Tools, Analytics, Operations Intelligence */

/* ── Network Topology View ── */
function NetworkTopologyView() {
  const nodes = [
    { id: 'isp', label: 'ISP Uplink', type: 'cloud', x: 380, y: 30 },
    { id: 'fw', label: 'Firewall', type: 'firewall', x: 380, y: 100, ip: '10.1.1.1' },
    { id: 'core', label: 'Core Switch', type: 'switch', x: 380, y: 180, ip: '10.1.1.2', model: 'USW-Pro-48' },
    { id: 'sw1', label: 'Floor 1 PoE', type: 'switch', x: 180, y: 270, ip: '10.1.4.2', model: 'USW-24-PoE', poe: { used: 185, total: 250 } },
    { id: 'sw2', label: 'Floor 2 PoE', type: 'switch', x: 380, y: 270, ip: '10.1.5.2', model: 'USW-24-PoE', poe: { used: 142, total: 250 } },
    { id: 'sw3', label: 'Server Room', type: 'switch', x: 580, y: 270, ip: '10.1.1.3', model: 'USW-16' },
    { id: 'nvr', label: 'NVR', type: 'nvr', x: 580, y: 360, ip: '10.1.4.10', model: 'XNR-6410' },
    { id: 'cam1', label: 'CAM-01', type: 'camera', x: 100, y: 360, status: 'online' },
    { id: 'cam2', label: 'CAM-02', type: 'camera', x: 180, y: 360, status: 'online' },
    { id: 'cam3', label: 'CAM-03', type: 'camera', x: 260, y: 360, status: 'offline' },
    { id: 'acr1', label: 'ACR-01', type: 'access', x: 340, y: 360, status: 'online' },
    { id: 'acr2', label: 'ACR-02', type: 'access', x: 420, y: 360, status: 'online' },
    { id: 'panel', label: 'Alarm Panel', type: 'alarm', x: 500, y: 360, status: 'online' },
  ];

  const links = [
    { from: 'isp', to: 'fw' }, { from: 'fw', to: 'core' },
    { from: 'core', to: 'sw1' }, { from: 'core', to: 'sw2' }, { from: 'core', to: 'sw3' },
    { from: 'sw1', to: 'cam1' }, { from: 'sw1', to: 'cam2' }, { from: 'sw1', to: 'cam3' },
    { from: 'sw2', to: 'acr1' }, { from: 'sw2', to: 'acr2' }, { from: 'sw2', to: 'panel' },
    { from: 'sw3', to: 'nvr' },
  ];

  const typeIcons = { cloud: '☁', firewall: '🛡', switch: '⊞', nvr: '⊟', camera: '◉', access: '⊠', alarm: '⚠' };
  const statusColor = (n) => n.status === 'offline' ? 'var(--status-critical)' : n.status === 'online' ? 'var(--status-ok)' : 'var(--brand)';

  return (
    <div>
      <SectionHeader title="Network Topology" icon="topology" actionLabel="Refresh" />
      <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
        <svg width="100%" height="420" viewBox="0 0 760 420" style={{ display: 'block' }}>
          <defs>
            <pattern id="topoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(63,169,245,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="760" height="420" fill="url(#topoGrid)" />
          {/* Links */}
          {links.map((l, i) => {
            const from = nodes.find(n => n.id === l.from);
            const to = nodes.find(n => n.id === l.to);
            const isDown = to.status === 'offline';
            return <line key={i} x1={from.x} y1={from.y + 16} x2={to.x} y2={to.y - 16} stroke={isDown ? 'var(--status-critical)' : 'rgba(63,169,245,0.2)'} strokeWidth={isDown ? 1.5 : 1} strokeDasharray={isDown ? '4 3' : 'none'} />;
          })}
          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={i} transform={`translate(${n.x}, ${n.y})`} style={{ cursor: 'pointer' }}>
              <rect x="-28" y="-14" width="56" height="28" rx="6" fill="rgba(10,14,20,0.8)" stroke={statusColor(n)} strokeWidth="1" />
              <text y="1" textAnchor="middle" fill={statusColor(n)} fontSize="14" dominantBaseline="central">{typeIcons[n.type]}</text>
              <text y="24" textAnchor="middle" fill="var(--text-mid)" fontSize="8" fontFamily="var(--font-mono)">{n.label}</text>
              {n.ip && <text y="33" textAnchor="middle" fill="var(--text-low)" fontSize="7" fontFamily="var(--font-mono)">{n.ip}</text>}
              {n.poe && (
                <g transform="translate(-20, -26)">
                  <rect width="40" height="6" rx="2" fill="rgba(63,169,245,0.08)" />
                  <rect width={40 * (n.poe.used / n.poe.total)} height="6" rx="2" fill={n.poe.used/n.poe.total > 0.85 ? 'var(--status-warn)' : 'var(--brand)'} />
                  <text x="44" y="5" fill="var(--text-low)" fontSize="6" fontFamily="var(--font-mono)">{n.poe.used}W/{n.poe.total}W</text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </GlassPanel>
    </div>
  );
}

/* ── Camera Health Grid (Verkada-style) ── */
function CameraGridView() {
  const cameras = [
    { name: 'Main Entrance', model: 'Axis P3265-V', status: 'online', fps: 30, bitrate: '4.2 Mbps', storage: '14d', lastMotion: '2m ago' },
    { name: 'Parking Lot A', model: 'Axis P3265-V', status: 'online', fps: 30, bitrate: '5.1 Mbps', storage: '14d', lastMotion: '45s ago' },
    { name: 'Server Room', model: 'Axis M3075-V', status: 'online', fps: 15, bitrate: '2.8 Mbps', storage: '30d', lastMotion: '1h ago' },
    { name: 'Rear Exit', model: 'Hikvision DS-2CD2143', status: 'offline', fps: 0, bitrate: '0', storage: '14d', lastMotion: '2h ago' },
    { name: 'Lobby', model: 'Verkada CD52', status: 'online', fps: 30, bitrate: '3.9 Mbps', storage: '30d', lastMotion: '10s ago' },
    { name: 'Hallway B', model: 'Axis P3265-V', status: 'online', fps: 25, bitrate: '3.5 Mbps', storage: '14d', lastMotion: '5m ago' },
    { name: 'Loading Dock', model: 'Axis Q6135-LE', status: 'online', fps: 30, bitrate: '6.2 Mbps', storage: '14d', lastMotion: '1m ago' },
    { name: 'Stairwell', model: 'Axis M3075-V', status: 'warning', fps: 15, bitrate: '1.2 Mbps', storage: '30d', lastMotion: '3h ago' },
  ];

  return (
    <div>
      <SectionHeader title="Camera Health Grid" icon="cameras" count={cameras.length} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {cameras.map((cam, i) => (
          <div key={i} className="glass" style={{
            padding: 0, overflow: 'hidden', cursor: 'pointer',
            borderColor: cam.status === 'offline' ? 'rgba(244,63,94,0.3)' : 'var(--border-subtle)',
            transition: 'border-color 0.2s'
          }}>
            {/* Simulated camera feed */}
            <div style={{
              height: 100, background: cam.status === 'offline' ? 'rgba(244,63,94,0.05)' :
                'linear-gradient(135deg, rgba(10,14,20,0.9), rgba(17,23,33,0.8))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden'
            }}>
              {cam.status === 'offline' ? (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 24, opacity: 0.3 }}>◉</span>
                  <div style={{ fontSize: 10, color: 'var(--status-critical)', marginTop: 4 }}>SIGNAL LOST</div>
                </div>
              ) : (
                <>
                  {/* Scan lines effect */}
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(63,169,245,0.02) 2px, rgba(63,169,245,0.02) 4px)', pointerEvents: 'none' }} />
                  <span style={{ fontSize: 28, opacity: 0.15 }}>◉</span>
                  {/* REC indicator */}
                  <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-critical)', animation: 'pulse-critical 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: 8, color: 'var(--status-critical)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>REC</span>
                  </div>
                  {/* Timestamp */}
                  <div style={{ position: 'absolute', bottom: 6, right: 8 }}>
                    <span className="mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>14:22:08</span>
                  </div>
                </>
              )}
              {/* Status dot */}
              <div style={{ position: 'absolute', top: 6, right: 8 }}>
                <StatusDot status={cam.status} size={6} pulse />
              </div>
            </div>
            {/* Info */}
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', marginBottom: 2 }}>{cam.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 6 }}>{cam.model}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{cam.fps}fps</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{cam.bitrate}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{cam.storage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Job Costing Analysis ── */
function JobCostingView() {
  const jobs = [
    { id: 'J-4180', customer: 'Metro Bank Corp', type: 'Install', estRevenue: 67500, actRevenue: 67500, estCost: 42800, actCost: 44200, estHours: 120, actHours: 134, status: 'complete', margin: 34.5 },
    { id: 'J-4175', customer: 'Riverside Medical', type: 'Install', estRevenue: 28400, actRevenue: 28400, estCost: 18200, actCost: 17800, estHours: 48, actHours: 42, status: 'complete', margin: 37.3 },
    { id: 'J-4168', customer: 'City Hall', type: 'Upgrade', estRevenue: 45000, actRevenue: 45000, estCost: 31500, actCost: 36200, estHours: 80, actHours: 96, status: 'complete', margin: 19.6 },
    { id: 'J-4190', customer: 'Westfield Mall', type: 'PM', estRevenue: 8400, actRevenue: 8400, estCost: 3600, actCost: 3200, estHours: 24, actHours: 20, status: 'complete', margin: 61.9 },
    { id: 'J-4195', customer: 'Harbor View', type: 'Install', estRevenue: 24800, actRevenue: 24800, estCost: 16200, actCost: 18100, estHours: 36, actHours: 44, status: 'in-progress', margin: 27.0 },
  ];

  const avgMargin = (jobs.reduce((s, j) => s + j.margin, 0) / jobs.length).toFixed(1);
  const overBudget = jobs.filter(j => j.actCost > j.estCost).length;

  return (
    <div>
      <SectionHeader title="Job Costing Analysis" icon="reports" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="glass" style={{ flex: 1, padding: 16, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)' }}>{avgMargin}%</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Avg Gross Margin</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: 16, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: overBudget > 1 ? 'var(--status-warn)' : 'var(--status-ok)' }}>{overBudget}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Over Budget</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: 16, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-high)' }}>$174K</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Total Revenue (30d)</div>
        </div>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Job','Customer','Type','Est Cost','Act Cost','Variance','Est Hours','Act Hours','Margin'].map((h, i) => (
                <th key={i} style={{ textAlign: i > 2 ? 'right' : 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((j, i) => {
              const variance = j.actCost - j.estCost;
              return (
                <tr key={i} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{j.id}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{j.customer}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{j.type}</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>${j.estCost.toLocaleString()}</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: j.actCost > j.estCost ? 'var(--status-critical)' : 'var(--text-high)' }}>${j.actCost.toLocaleString()}</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: variance > 0 ? 'var(--status-critical)' : 'var(--status-ok)' }}>{variance > 0 ? '+' : ''}{variance >= 0 ? '$' : '-$'}{Math.abs(variance).toLocaleString()}</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: 'var(--text-mid)' }}>{j.estHours}h</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: j.actHours > j.estHours ? 'var(--status-warn)' : 'var(--text-high)' }}>{j.actHours}h</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 600, color: j.margin >= 25 ? 'var(--status-ok)' : j.margin >= 15 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{j.margin}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── PoE Budget Calculator V2 — Interactive with switch brands, camera picker, export to Design Studio ── */
function PoECalculatorView() {
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  // Switch database by brand
  const switchDB = [
    { brand: 'Ubiquiti', model: 'USW-Lite-8-PoE', ports: 8, budget: 52, price: 109 },
    { brand: 'Ubiquiti', model: 'USW-Lite-16-PoE', ports: 16, budget: 45, price: 179 },
    { brand: 'Ubiquiti', model: 'USW-24-PoE', ports: 24, budget: 95, price: 399 },
    { brand: 'Ubiquiti', model: 'USW-Pro-24-PoE', ports: 24, budget: 400, price: 699 },
    { brand: 'Ubiquiti', model: 'USW-Pro-48-PoE', ports: 48, budget: 600, price: 1099 },
    { brand: 'Ubiquiti', model: 'USW-Enterprise-48-PoE', ports: 48, budget: 720, price: 1499 },
    { brand: 'Cisco', model: 'CBS250-8PP', ports: 8, budget: 45, price: 189 },
    { brand: 'Cisco', model: 'CBS250-24P', ports: 24, budget: 195, price: 549 },
    { brand: 'Cisco', model: 'CBS350-24FP', ports: 24, budget: 370, price: 899 },
    { brand: 'Cisco', model: 'CBS350-48FP', ports: 48, budget: 740, price: 1599 },
    { brand: 'Cisco', model: 'C9200L-24P', ports: 24, budget: 370, price: 2899 },
    { brand: 'Aruba', model: 'Instant On 1830-8G-PoE', ports: 8, budget: 65, price: 149 },
    { brand: 'Aruba', model: 'Instant On 1930-24G-PoE', ports: 24, budget: 195, price: 499 },
    { brand: 'Aruba', model: 'CX 6100 24G PoE', ports: 24, budget: 370, price: 1299 },
    { brand: 'TP-Link', model: 'TL-SG1008P', ports: 8, budget: 64, price: 59 },
    { brand: 'TP-Link', model: 'TL-SG2210MP', ports: 10, budget: 150, price: 189 },
    { brand: 'TP-Link', model: 'TL-SG3428MP', ports: 24, budget: 384, price: 349 },
    { brand: 'Netgear', model: 'GS108PP', ports: 8, budget: 123, price: 129 },
    { brand: 'Netgear', model: 'GS324TP', ports: 24, budget: 190, price: 279 },
    { brand: 'Netgear', model: 'MS324TXUP', ports: 24, budget: 720, price: 1199 },
  ];

  // Camera/device database
  const deviceDB = [
    { cat: 'Cameras', items: [
      { name: 'Axis P3265-V', watts: 12.4, cls: 'PoE+', vendor: 'Axis' },
      { name: 'Axis P3268-LV', watts: 25.5, cls: 'PoE++', vendor: 'Axis' },
      { name: 'Axis Q6135-LE PTZ', watts: 60, cls: 'PoE++', vendor: 'Axis' },
      { name: 'Axis M3075-V', watts: 4.5, cls: 'PoE', vendor: 'Axis' },
      { name: 'Axis Q1656', watts: 12.9, cls: 'PoE+', vendor: 'Axis' },
      { name: 'Verkada CD52', watts: 25.5, cls: 'PoE++', vendor: 'Verkada' },
      { name: 'Verkada CD62', watts: 25.5, cls: 'PoE++', vendor: 'Verkada' },
      { name: 'Verkada CB52-TE', watts: 12.95, cls: 'PoE+', vendor: 'Verkada' },
      { name: 'Hikvision DS-2CD2143', watts: 12, cls: 'PoE', vendor: 'Hikvision' },
      { name: 'Hikvision DS-2CD2T87G2', watts: 12.5, cls: 'PoE+', vendor: 'Hikvision' },
      { name: 'Hikvision DS-2DE4425IW PTZ', watts: 60, cls: 'Hi-PoE', vendor: 'Hikvision' },
      { name: 'Dahua IPC-HDBW5442R', watts: 12, cls: 'PoE', vendor: 'Dahua' },
      { name: 'Hanwha XNV-8080R', watts: 12.5, cls: 'PoE+', vendor: 'Hanwha' },
    ]},
    { cat: 'Access Control', items: [
      { name: 'HID iCLASS SE', watts: 3.8, cls: 'PoE', vendor: 'HID' },
      { name: 'HID Signo 40', watts: 5.2, cls: 'PoE', vendor: 'HID' },
      { name: 'Mercury LP1502', watts: 6.5, cls: 'PoE', vendor: 'Mercury' },
      { name: 'Verkada AD31', watts: 12.95, cls: 'PoE+', vendor: 'Verkada' },
    ]},
    { cat: 'Access Points', items: [
      { name: 'Ubiquiti U6-Pro', watts: 13.5, cls: 'PoE+', vendor: 'Ubiquiti' },
      { name: 'Ubiquiti U6-Enterprise', watts: 25.5, cls: 'PoE++', vendor: 'Ubiquiti' },
      { name: 'Ubiquiti U6-LR', watts: 13, cls: 'PoE+', vendor: 'Ubiquiti' },
      { name: 'Aruba AP-535', watts: 25.5, cls: 'PoE++', vendor: 'Aruba' },
      { name: 'Cisco C9120AXI', watts: 25.5, cls: 'PoE++', vendor: 'Cisco' },
    ]},
    { cat: 'Other', items: [
      { name: 'VoIP Phone (Generic)', watts: 6.5, cls: 'PoE', vendor: 'Generic' },
      { name: 'IoT Sensor', watts: 3, cls: 'PoE', vendor: 'Generic' },
      { name: 'IP Intercom', watts: 12, cls: 'PoE+', vendor: 'Generic' },
    ]},
  ];

  const brands = [...new Set(switchDB.map(s => s.brand))];
  const [selectedBrand, setSelectedBrand] = React.useState('Ubiquiti');
  const [selectedSwitch, setSelectedSwitch] = React.useState(switchDB[3]); // USW-Pro-24-PoE
  const [devices, setDevices] = React.useState([
    { device: deviceDB[0].items[0], qty: 4 },
    { device: deviceDB[1].items[0], qty: 2 },
    { device: deviceDB[2].items[0], qty: 3 },
  ]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addCat, setAddCat] = React.useState('Cameras');

  const totalWatts = devices.reduce((s, d) => s + d.device.watts * d.qty, 0);
  const totalPorts = devices.reduce((s, d) => s + d.qty, 0);
  const headroom = selectedSwitch ? Math.max(0, ((1 - totalWatts / selectedSwitch.budget) * 100)).toFixed(0) : 0;
  const portHeadroom = selectedSwitch ? selectedSwitch.ports - totalPorts : 0;

  const brandSwitches = switchDB.filter(s => s.brand === selectedBrand);

  // Auto-recommend switch
  const recommended = switchDB
    .filter(s => s.brand === selectedBrand && s.budget >= totalWatts * 1.2 && s.ports >= totalPorts)
    .sort((a, b) => a.price - b.price)[0];

  const updateQty = (idx, delta) => {
    setDevices(prev => prev.map((d, i) => i === idx ? { ...d, qty: Math.max(1, d.qty + delta) } : d));
  };
  const removeDevice = (idx) => setDevices(prev => prev.filter((_, i) => i !== idx));
  const addDevice = (item) => {
    const existing = devices.findIndex(d => d.device.name === item.name);
    if (existing >= 0) {
      setDevices(prev => prev.map((d, i) => i === existing ? { ...d, qty: d.qty + 1 } : d));
    } else {
      setDevices(prev => [...prev, { device: item, qty: 1 }]);
    }
    setAddOpen(false);
  };

  const inputStyle = { padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionHeader title="PoE Budget Calculator" icon="bolt" />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => showToast('Design exported to Design Studio')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>↗ Export to Design Studio</button>
          <button onClick={() => showToast('PDF generated')} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export PDF</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
        {/* Left — Device table */}
        <div>
          {/* Switch selector */}
          <GlassPanel style={{ marginBottom: 12 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>SELECT SWITCH</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {brands.map(b => (
                <button key={b} onClick={() => { setSelectedBrand(b); const first = switchDB.find(s => s.brand === b); if (first) setSelectedSwitch(first); }} style={{
                  padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: selectedBrand === b ? 600 : 400,
                  background: selectedBrand === b ? 'rgba(63,169,245,0.12)' : 'transparent',
                  border: `1px solid ${selectedBrand === b ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  color: selectedBrand === b ? 'var(--brand)' : 'var(--text-mid)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}>{b}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {brandSwitches.map(sw => (
                <button key={sw.model} onClick={() => setSelectedSwitch(sw)} style={{
                  padding: '8px 12px', borderRadius: 6, textAlign: 'left',
                  background: selectedSwitch?.model === sw.model ? 'rgba(63,169,245,0.08)' : 'transparent',
                  border: `1px solid ${selectedSwitch?.model === sw.model ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', minWidth: 140
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: selectedSwitch?.model === sw.model ? 'var(--brand)' : 'var(--text-high)' }}>{sw.model}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{sw.ports}p</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{sw.budget}W</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--status-ok)' }}>${sw.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </GlassPanel>

          {/* Device table */}
          <GlassPanel style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Devices</span>
              <button onClick={() => setAddOpen(true)} style={{ padding: '3px 12px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Device</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Device','Vendor','Qty','Per-Port','Class','Subtotal',''].map((h, i) => (
                    <th key={i} style={{ textAlign: i > 1 ? 'right' : 'left', padding: '8px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => (
                  <tr key={i} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{d.device.name}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{d.device.vendor}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => updateQty(i, -1)} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, width: 20, textAlign: 'center' }}>{d.qty}</span>
                        <button onClick={() => updateQty(i, 1)} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>{d.device.watts}W</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, textAlign: 'right', color: 'var(--text-low)' }}>{d.device.cls}</td>
                    <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 600, color: 'var(--brand)' }}>{(d.device.watts * d.qty).toFixed(1)}W</td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}>
                      <button onClick={() => removeDevice(i)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--status-critical)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-low)'}>✕</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(63,169,245,0.02)' }}>
                  <td colSpan="2" style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, borderTop: '1px solid var(--border-subtle)' }}>Total</td>
                  <td className="mono" style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right', borderTop: '1px solid var(--border-subtle)' }}>{totalPorts} ports</td>
                  <td colSpan="2" style={{ borderTop: '1px solid var(--border-subtle)' }}></td>
                  <td className="mono" style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, textAlign: 'right', borderTop: '1px solid var(--border-subtle)', color: 'var(--brand)' }}>{totalWatts.toFixed(1)}W</td>
                  <td style={{ borderTop: '1px solid var(--border-subtle)' }}></td>
                </tr>
              </tbody>
            </table>
          </GlassPanel>
        </div>

        {/* Right — Budget visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Switch info */}
          {selectedSwitch && (
            <GlassPanel style={{ borderLeft: '3px solid var(--brand)' }}>
              <div className="label-sm" style={{ marginBottom: 6 }}>SELECTED SWITCH</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{selectedSwitch.model}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{selectedSwitch.brand} · {selectedSwitch.ports} ports · {selectedSwitch.budget}W</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--status-ok)', marginTop: 4 }}>${selectedSwitch.price}</div>
            </GlassPanel>
          )}

          {/* PoE Budget ring */}
          <GlassPanel style={{ textAlign: 'center' }}>
            <div className="label-sm" style={{ marginBottom: 10 }}>POE BUDGET</div>
            <HealthRing value={parseInt(headroom)} size={110} strokeWidth={8}
              color={parseInt(headroom) > 30 ? 'var(--status-ok)' : parseInt(headroom) > 15 ? 'var(--status-warn)' : 'var(--status-critical)'}
              label="headroom" />
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{totalWatts.toFixed(0)}W</div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>Used</div></div>
              <div><div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--status-ok)' }}>{selectedSwitch ? (selectedSwitch.budget - totalWatts).toFixed(0) : 0}W</div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>Available</div></div>
            </div>
          </GlassPanel>

          {/* Port utilization */}
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 6 }}>PORT UTILIZATION</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{totalPorts} / {selectedSwitch?.ports || 0}</span>
              <span style={{ fontSize: 10, color: portHeadroom >= 0 ? 'var(--status-ok)' : 'var(--status-critical)' }}>{portHeadroom >= 0 ? `${portHeadroom} available` : `${Math.abs(portHeadroom)} over!`}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, selectedSwitch ? (totalPorts / selectedSwitch.ports) * 100 : 0)}%`, height: '100%', borderRadius: 3, background: portHeadroom >= 0 ? 'var(--brand)' : 'var(--status-critical)', transition: 'width 0.3s' }} />
            </div>
          </GlassPanel>

          {/* Warnings */}
          {totalWatts > (selectedSwitch?.budget || 0) && (
            <GlassPanel style={{ borderLeft: '3px solid var(--status-critical)', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-critical)', marginBottom: 3 }}>⚠ Over Budget!</div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Total load ({totalWatts.toFixed(0)}W) exceeds switch budget ({selectedSwitch?.budget}W). Upgrade switch or reduce devices.</div>
            </GlassPanel>
          )}
          {portHeadroom < 0 && (
            <GlassPanel style={{ borderLeft: '3px solid var(--status-critical)', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-critical)', marginBottom: 3 }}>⚠ Not Enough Ports</div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Need {totalPorts} ports but switch only has {selectedSwitch?.ports}. Need a larger switch or add a second.</div>
            </GlassPanel>
          )}

          {/* Recommendation */}
          {recommended && recommended.model !== selectedSwitch?.model && (
            <GlassPanel style={{ borderLeft: '3px solid var(--status-ok)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-ok)', marginBottom: 3 }}>✦ Recommended</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{recommended.model} — {recommended.ports}p · {recommended.budget}W · ${recommended.price}</div>
              <button onClick={() => setSelectedSwitch(recommended)} style={{ marginTop: 6, padding: '4px 10px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Use This Switch</button>
            </GlassPanel>
          )}

          {/* Export */}
          <button onClick={() => showToast('PoE design added to Design Studio project')} style={{ width: '100%', padding: '10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ↗ Send to Design Studio
          </button>
        </div>
      </div>

      {/* Add Device Modal */}
      {addOpen && (
        <div onClick={() => setAddOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '70vh', overflow: 'auto', padding: 0, animation: 'fade-up 0.15s ease both' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>Add Device</span>
              <button onClick={() => setAddOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
              {deviceDB.map(cat => (
                <button key={cat.cat} onClick={() => setAddCat(cat.cat)} style={{
                  flex: 1, padding: '8px', fontSize: 11, fontWeight: addCat === cat.cat ? 600 : 400,
                  background: addCat === cat.cat ? 'rgba(63,169,245,0.08)' : 'transparent',
                  border: 'none', borderBottom: addCat === cat.cat ? '2px solid var(--brand)' : '2px solid transparent',
                  color: addCat === cat.cat ? 'var(--brand)' : 'var(--text-mid)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}>{cat.cat}</button>
              ))}
            </div>
            {/* Device list */}
            <div style={{ padding: '8px 0' }}>
              {(deviceDB.find(c => c.cat === addCat)?.items || []).map((item, i) => (
                <button key={i} onClick={() => addDevice(item)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 18px',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  textAlign: 'left', transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{item.vendor}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>{item.watts}W</span>
                  <span style={{ fontSize: 10, color: 'var(--text-low)', width: 40, textAlign: 'right' }}>{item.cls}</span>
                  <span style={{ color: 'var(--brand)', fontSize: 16, marginLeft: 4 }}>+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Certification Tracker ── */
function CertificationsView() {
  const certs = [
    { tech: 'Mike Reyes', initials: 'MR', certs: [
      { name: 'NICET Level II — Fire Alarm', exp: 'Aug 2026', status: 'ok', days: 86 },
      { name: 'CA Alarm Installer License', exp: 'Dec 2026', status: 'ok', days: 210 },
      { name: 'Axis Certified Professional', exp: 'Jul 2026', status: 'warn', days: 26 },
    ]},
    { tech: 'Jessica Liu', initials: 'JL', certs: [
      { name: 'NICET Level III — Fire Alarm', exp: 'Nov 2026', status: 'ok', days: 149 },
      { name: 'HID Certified Installer', exp: 'Jun 2026', status: 'critical', days: 12 },
      { name: 'Verkada Certified Partner', exp: 'Sep 2026', status: 'ok', days: 88 },
    ]},
    { tech: 'Tony Garcia', initials: 'TG', certs: [
      { name: 'NICET Level II — Fire Alarm', exp: 'Mar 2027', status: 'ok', days: 280 },
      { name: 'DSC Certified Programmer', exp: 'Oct 2026', status: 'ok', days: 118 },
    ]},
  ];

  const expiringSoon = certs.flatMap(t => t.certs.filter(c => c.days < 30).map(c => ({ ...c, tech: t.tech })));

  const statusLabel = { ok: 'Valid', warn: 'Expiring soon', critical: 'Expiring now' };
  const openCert = (cert, tech) => shieldModal({
    kind: 'detail', title: cert.name, subtitle: `${tech} · expires ${cert.exp}`,
    badge: { status: cert.status === 'ok' ? 'online' : cert.status === 'warn' ? 'warning' : 'critical', label: statusLabel[cert.status] },
    headline: cert.days < 30 ? `Expires in ${cert.days} days — begin renewal now to avoid a compliance lapse.` : `Valid for ${cert.days} more days.`,
    sections: [
      { label: 'Certification', rows: [
        { k: 'Holder', v: tech, mono: false }, { k: 'Expires', v: cert.exp, mono: false },
        { k: 'Days Remaining', v: cert.days + 'd', color: cert.days < 30 ? 'var(--status-critical)' : cert.days < 60 ? 'var(--status-warn)' : 'var(--status-ok)' },
        { k: 'Status', v: statusLabel[cert.status], mono: false },
      ]},
    ],
    actions: [
      { label: 'Set Reminder', onClick: () => shieldToast('Reminder set for ' + cert.name, 'ok'), close: true },
      { label: 'Start Renewal', primary: true, successMsg: 'Renewal started for ' + cert.name, onClick: () => {} },
    ],
  });

  return (
    <div>
      <SectionHeader title="Employee Certifications" icon="certs" />
      {expiringSoon.length > 0 && (
        <div className="glass" style={{ padding: '10px 16px', marginBottom: 16, borderLeft: '3px solid var(--status-critical)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="critical" size={6} />
          <span style={{ fontSize: 13, color: 'var(--text-high)' }}>
            <strong>{expiringSoon.length} certification{expiringSoon.length > 1 ? 's' : ''}</strong> expiring within 30 days
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {certs.map((t, i) => (
          <GlassPanel key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.initials}</div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{t.tech}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginLeft: 'auto' }}>{t.certs.length} active</span>
            </div>
            {t.certs.map((c, j) => (
              <div key={j} onClick={() => openCert(c, t.tech)} className="st-clickrow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', margin: '0 -8px', borderRadius: 6, borderBottom: j < t.certs.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none' }}>
                <StatusDot status={c.status === 'ok' ? 'online' : c.status === 'warn' ? 'warning' : 'critical'} size={6} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{c.name}</span>
                <span className="mono" style={{ fontSize: 11, color: c.days < 30 ? 'var(--status-critical)' : c.days < 60 ? 'var(--status-warn)' : 'var(--text-low)' }}>
                  {c.exp} ({c.days}d)
                </span>
              </div>
            ))}
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

/* ── Audit Trail ── */
function AuditTrailView() {
  const [roleFilter, setRoleFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const logs = [
    { time: '14:22:08', user: 'Mike Reyes', role: 'Tech', action: 'Completed job J-4201', target: 'Acme Dental', severity: 'info', ip: '10.1.4.55' },
    { time: '14:18:32', user: 'ShieldTech AI', role: 'System', action: 'Auto-triaged ticket TKT-2847 → High Priority', target: 'System', severity: 'info', ip: '—' },
    { time: '14:15:01', user: 'John Mitchell', role: 'Admin', action: 'Approved email draft → Acme Dental', target: 'Approvals', severity: 'ok', ip: '192.168.1.10' },
    { time: '14:10:44', user: 'System', role: 'System', action: 'Remote session RS-0043 expired (2h limit)', target: 'Acme Dental', severity: 'warn', ip: '—' },
    { time: '13:58:12', user: 'Sarah Chen', role: 'Sales', action: 'Created proposal Q-2851 — $215,000', target: 'Pacific Rim Hotels', severity: 'info', ip: '192.168.1.22' },
    { time: '13:45:00', user: 'System', role: 'System', action: 'Alarm test mode activated — auto-restore 15:45', target: 'Riverside Medical', severity: 'warn', ip: '—' },
    { time: '13:30:22', user: 'Diana Patel', role: 'Tech', action: 'Clocked in — GPS: 37.7749°N, 122.4194°W', target: 'Timesheet', severity: 'info', ip: '—' },
    { time: '13:22:08', user: 'Jennifer Foster', role: 'Customer', action: 'Submitted ticket TKT-2847', target: 'Acme Dental', severity: 'info', ip: '98.42.x.x' },
  ];

  const filtered = logs.filter(l => {
    if (roleFilter !== 'All' && l.role !== roleFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(`${l.user} ${l.action} ${l.target}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const exportLog = () => shieldToast(`Exported ${filtered.length} audit entries to CSV`, 'ok');

  return (
    <div>
      <SectionHeader title="Audit Trail" icon="eye" actionLabel="Export" action={exportLog} />
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search audit log…" style={{ flex: 1, padding: '6px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
          {['All','Admin','Tech','Customer','System'].map(f => (
            <button key={f} onClick={() => setRoleFilter(f)} style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, background: f === roleFilter ? 'rgba(63,169,245,0.1)' : 'transparent', border: '1px solid var(--border-subtle)', color: f === roleFilter ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f}</button>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Time','User','Role','Action','Target','IP'].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr key={i} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{l.time}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{l.user}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={l.role === 'Admin' ? 'info' : l.role === 'Tech' ? 'online' : l.role === 'Customer' ? 'warm' : 'offline'} label={l.role} /></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-high)' }}>{l.action}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{l.target}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: 'var(--text-mid)' }}>No audit entries match your filter.</div>
        )}
      </GlassPanel>
    </div>
  );
}

Object.assign(window, {
  NetworkTopologyView, CameraGridView, JobCostingView,
  PoECalculatorView, CertificationsView, AuditTrailView
});

/* ShieldTech — Unified Monitoring Console (Ubiquiti/Auvik-class)
   Customer-first: select a customer → see full network topology, cameras, floor plan, anomalies, critical alerts
   Replaces: CameraGridView, NetworkTopologyView, FloorPlanView, AnomalyView, WarRoomView */

function MonitoringConsole() {
  const [selectedCustomer, setSelectedCustomer] = React.useState('metro-bank');
  const [activeTab, setActiveTab] = React.useState('topology');
  const [custDropdown, setCustDropdown] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const customers = [
    { id: 'metro-bank', name: 'Metro Bank Corp', sites: 3, devices: 42, status: 'healthy' },
    { id: 'acme-dental', name: 'Acme Dental', sites: 1, devices: 18, status: 'warning' },
    { id: 'city-hall', name: 'City Hall', sites: 2, devices: 36, status: 'healthy' },
    { id: 'riverside-med', name: 'Riverside Medical', sites: 1, devices: 24, status: 'critical' },
    { id: 'pacific-rim', name: 'Pacific Rim Hotels', sites: 5, devices: 128, status: 'healthy' },
    { id: 'harbor-view', name: 'Harbor View Condos', sites: 1, devices: 14, status: 'healthy' },
    { id: 'westfield', name: 'Westfield Mall', sites: 1, devices: 52, status: 'warning' },
  ];

  const tabs = [
    { id: 'topology', label: 'Network Map', icon: '⊚' },
    { id: 'discovery', label: 'Discovery', icon: '⊙' },
    { id: 'portmap', label: 'Port Map', icon: '⊡' },
    { id: 'cameras', label: 'Camera Grid', icon: '◫' },
    { id: 'floorplan', label: 'Floor Plan', icon: '⊟' },
    { id: 'anomaly', label: 'Anomaly Detection', icon: '◈' },
    { id: 'alerts', label: 'Critical Alerts', icon: '⚠' },
  ];

  const cust = customers.find(c => c.id === selectedCustomer);
  const statusColor = cust?.status === 'healthy' ? 'var(--status-ok)' : cust?.status === 'warning' ? 'var(--status-warn)' : 'var(--status-critical)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Top bar — Customer selector + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, flexShrink: 0, borderBottom: '1px solid var(--border-subtle)', marginBottom: 10 }}>
        {/* Customer selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setCustDropdown(!custDropdown)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: 'var(--glass-bg)', border: '1px solid var(--border-strong)',
            borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', minWidth: 220
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1, textAlign: 'left' }}>{cust?.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{cust?.devices} devices</span>
            <span style={{ fontSize: 8, color: 'var(--text-low)', marginLeft: 4 }}>▼</span>
          </button>
          {custDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 300, background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 8, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '6px 0', maxHeight: 300, overflow: 'auto' }}>
              <div style={{ padding: '4px 12px 8px' }}>
                <input placeholder="Search customers..." autoFocus style={{ width: '100%', padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
              </div>
              {customers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c.id); setCustDropdown(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 14px',
                  background: c.id === selectedCustomer ? 'rgba(63,169,245,0.08)' : 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
                  borderLeft: c.id === selectedCustomer ? '2px solid var(--brand)' : '2px solid transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = c.id === selectedCustomer ? 'rgba(63,169,245,0.08)' : 'none'}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'healthy' ? 'var(--status-ok)' : c.status === 'warning' ? 'var(--status-warn)' : 'var(--status-critical)' }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{c.sites} sites · {c.devices} dev</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
              borderRadius: '6px 6px 0 0', fontSize: 11, fontWeight: activeTab === tab.id ? 600 : 400,
              background: activeTab === tab.id ? 'rgba(63,169,245,0.1)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: 12 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-ok)' }}>{cust?.devices - 2}</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)' }}>Online</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-critical)' }}>2</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)' }}>Offline</div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }} onClick={() => setCustDropdown(false)}>
        {activeTab === 'topology' && <TopologyView customer={selectedCustomer} showToast={showToast} />}
        {activeTab === 'discovery' && <div style={{ height: '100%', overflow: 'auto', paddingRight: 4 }}><NetworkDiscoveryView showToast={showToast} /></div>}
        {activeTab === 'portmap' && <div style={{ height: '100%', overflow: 'auto', paddingRight: 4 }}><PortMapView showToast={showToast} /></div>}
        {activeTab === 'cameras' && <MonitorCameraGrid customer={selectedCustomer} showToast={showToast} />}
        {activeTab === 'floorplan' && <MonitorFloorPlan customer={selectedCustomer} showToast={showToast} />}
        {activeTab === 'anomaly' && <MonitorAnomaly customer={selectedCustomer} showToast={showToast} />}
        {activeTab === 'alerts' && <MonitorAlerts customer={selectedCustomer} showToast={showToast} />}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TOPOLOGY VIEW — Ubiquiti/Auvik-style network map
   ══════════════════════════════════════════════════════════════ */
function TopologyView({ customer, showToast }) {
  const [viewMode, setViewMode] = React.useState('topology'); // topology | infrastructure
  const [showTraffic, setShowTraffic] = React.useState(false);
  const [showClients, setShowClients] = React.useState(true);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [filters, setFilters] = React.useState({ status: [], vendors: [], vlans: [], deviceType: [] });
  const [collapsedSections, setCollapsedSections] = React.useState({});
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  const toggleSection = (s) => setCollapsedSections(prev => ({ ...prev, [s]: !prev[s] }));
  const toggleFilter = (cat, val) => {
    setFilters(prev => {
      const arr = prev[cat] || [];
      return { ...prev, [cat]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  };

  // Network topology data for selected customer
  const topoData = {
    nodes: [
      { id: 'isp', label: 'Comcast Business', sublabel: 'WAN1 Active', type: 'isp', status: 'online', x: 500, y: 40, icon: '☁' },
      { id: 'gw', label: 'USG-Pro-4', sublabel: '10.1.1.1', type: 'gateway', status: 'online', x: 500, y: 130, icon: '🛡', model: 'Ubiquiti USG-Pro-4', mac: 'fc:ec:da:12:34:56', uptime: '42d 6h', cpu: 12, mem: 34, throughput: '245 Mbps' },
      { id: 'sw-core', label: 'Core Switch', sublabel: '10.1.1.2 · USW-Pro-48', type: 'switch', status: 'online', x: 500, y: 230, icon: '⊞', model: 'USW-Pro-48-PoE', mac: 'fc:ec:da:23:45:67', ports: 48, poeUsed: 185, poeTotal: 400, uptime: '42d 6h' },
      // Floor 1
      { id: 'sw-f1', label: 'Floor 1 PoE', sublabel: '10.1.4.2 · USW-24', type: 'switch', status: 'online', x: 250, y: 330, icon: '⊞', model: 'USW-24-PoE', ports: 24, poeUsed: 142, poeTotal: 250 },
      { id: 'ap-f1', label: 'AP-Floor1', sublabel: '10.1.4.10', type: 'ap', status: 'online', x: 120, y: 330, icon: '⊚', model: 'U6-Pro', clients: 8, channel: '36/80MHz' },
      // Floor 2
      { id: 'sw-f2', label: 'Floor 2 PoE', sublabel: '10.1.5.2 · USW-24', type: 'switch', status: 'online', x: 500, y: 330, icon: '⊞', model: 'USW-24-PoE', ports: 24, poeUsed: 98, poeTotal: 250 },
      { id: 'ap-f2', label: 'AP-Floor2', sublabel: '10.1.5.10', type: 'ap', status: 'online', x: 630, y: 330, icon: '⊚', model: 'U6-LR', clients: 12, channel: '149/80MHz' },
      // Server Room
      { id: 'sw-srv', label: 'Server Room', sublabel: '10.1.1.3 · USW-16', type: 'switch', status: 'online', x: 750, y: 330, icon: '⊞', model: 'USW-16', ports: 16 },
      { id: 'nvr', label: 'NVR-01', sublabel: '10.1.4.50', type: 'nvr', status: 'online', x: 820, y: 420, icon: '⊟', model: 'Axis S3008', storage: '6TB / 8TB' },
      { id: 'server', label: 'App Server', sublabel: '10.1.1.10', type: 'server', status: 'online', x: 700, y: 420, icon: '▢', model: 'Dell R740' },
      // Cameras (Floor 1)
      { id: 'cam1', label: 'CAM-01 Main Entry', sublabel: 'Axis P3265-V', type: 'camera', status: 'online', x: 140, y: 430, icon: '◉', vendor: 'Axis', vlan: 'Security', poe: 12.4 },
      { id: 'cam2', label: 'CAM-02 Lobby', sublabel: 'Verkada CD52', type: 'camera', status: 'online', x: 220, y: 430, icon: '◉', vendor: 'Verkada', vlan: 'Security', poe: 25.5 },
      { id: 'cam3', label: 'CAM-03 Parking', sublabel: 'Axis P3265-V', type: 'camera', status: 'online', x: 300, y: 430, icon: '◉', vendor: 'Axis', vlan: 'Security', poe: 12.4 },
      { id: 'cam4', label: 'CAM-04 Rear Exit', sublabel: 'Hikvision DS-2CD', type: 'camera', status: 'offline', x: 380, y: 430, icon: '◉', vendor: 'Hikvision', vlan: 'Security', poe: 12 },
      // Access Control (Floor 2)
      { id: 'acr1', label: 'ACR-01 Main Door', sublabel: 'HID iCLASS SE', type: 'access', status: 'online', x: 460, y: 430, icon: '⊠', vendor: 'HID', vlan: 'Security', poe: 3.8 },
      { id: 'acr2', label: 'ACR-02 Server Rm', sublabel: 'HID iCLASS SE', type: 'access', status: 'online', x: 540, y: 430, icon: '⊠', vendor: 'HID', vlan: 'Security', poe: 3.8 },
      // Alarm
      { id: 'panel', label: 'Alarm Panel', sublabel: 'DSC PowerSeries', type: 'alarm', status: 'online', x: 620, y: 430, icon: '⚠', vendor: 'DSC', vlan: 'Security' },
      // WiFi Clients
      { id: 'client1', label: 'iPhone (Sarah)', sublabel: '-52 dBm', type: 'wifi-client', status: 'online', x: 60, y: 430, icon: '▯', vendor: 'Apple', band: '5 GHz', signal: -52 },
      { id: 'client2', label: 'MacBook (John)', sublabel: '-38 dBm', type: 'wifi-client', status: 'online', x: 60, y: 470, icon: '▢', vendor: 'Apple', band: '6 GHz', signal: -38 },
      { id: 'client3', label: 'iPad (Reception)', sublabel: '-61 dBm', type: 'wifi-client', status: 'online', x: 700, y: 470, icon: '▯', vendor: 'Apple', band: '5 GHz', signal: -61 },
    ],
    links: [
      { from: 'isp', to: 'gw', speed: '1 Gbps' },
      { from: 'gw', to: 'sw-core', speed: '10 Gbps' },
      { from: 'sw-core', to: 'sw-f1', speed: '1 Gbps' },
      { from: 'sw-core', to: 'sw-f2', speed: '1 Gbps' },
      { from: 'sw-core', to: 'sw-srv', speed: '10 Gbps' },
      { from: 'sw-f1', to: 'ap-f1', speed: '1 Gbps' },
      { from: 'sw-f2', to: 'ap-f2', speed: '1 Gbps' },
      { from: 'sw-f1', to: 'cam1' }, { from: 'sw-f1', to: 'cam2' }, { from: 'sw-f1', to: 'cam3' }, { from: 'sw-f1', to: 'cam4' },
      { from: 'sw-f2', to: 'acr1' }, { from: 'sw-f2', to: 'acr2' }, { from: 'sw-f2', to: 'panel' },
      { from: 'sw-srv', to: 'nvr' }, { from: 'sw-srv', to: 'server' },
      { from: 'ap-f1', to: 'client1', wireless: true }, { from: 'ap-f1', to: 'client2', wireless: true },
      { from: 'ap-f2', to: 'client3', wireless: true },
    ]
  };

  const vendors = [...new Set(topoData.nodes.filter(n => n.vendor).map(n => n.vendor))];
  const deviceTypes = [...new Set(topoData.nodes.map(n => n.type))];
  const onlineCount = topoData.nodes.filter(n => n.status === 'online').length;
  const offlineCount = topoData.nodes.filter(n => n.status === 'offline').length;

  const isVisible = (node) => {
    if (!showClients && node.type === 'wifi-client') return false;
    // Infrastructure backbone always visible (needed for connection lines)
    const isBackbone = ['isp', 'gateway', 'switch', 'server'].includes(node.type);
    if (filters.status.length && !filters.status.includes(node.status) && !isBackbone) return false;
    if (filters.vendors.length && node.vendor && !filters.vendors.includes(node.vendor) && !isBackbone) return false;
    if (filters.deviceType.length && !filters.deviceType.includes(node.type) && !isBackbone) return false;
    return true;
  };

  const visibleNodes = topoData.nodes.filter(isVisible);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  // Links only shown if BOTH endpoints are visible
  const visibleLinks = topoData.links.filter(link => visibleIds.has(link.from) && visibleIds.has(link.to));

  const typeColors = {
    isp: '#5c6f86', gateway: 'var(--brand)', switch: 'var(--brand)', ap: '#a78bfa',
    camera: 'var(--status-ok)', access: 'var(--status-warn)', alarm: 'var(--status-critical)',
    nvr: '#60a5fa', server: '#818cf8', 'wifi-client': '#94a3b8'
  };

  const nodeSize = (type) => {
    if (type === 'isp' || type === 'gateway') return 44;
    if (type === 'switch') return 40;
    if (type === 'wifi-client') return 28;
    return 32;
  };

  const signalColor = (dbm) => {
    if (!dbm) return 'var(--text-low)';
    if (dbm > -50) return 'var(--status-ok)';
    if (dbm > -65) return 'var(--status-warn)';
    return 'var(--status-critical)';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0, height: '100%', overflow: 'hidden' }}>
      {/* ── Filter Sidebar ── */}
      <div style={{ borderRight: '1px solid var(--border-subtle)', overflow: 'auto', padding: '10px 0', background: 'var(--card)' }}>
        {/* View toggle */}
        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-subtle)', margin: '0 12px 10px' }}>
          {[{id:'topology',l:'Topology'},{id:'infrastructure',l:'Infrastructure'}].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ flex: 1, padding: '5px', fontSize: 10, fontWeight: 500, background: viewMode===v.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: viewMode===v.id?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v.l}</button>
          ))}
        </div>

        {/* Show Internet Traffic */}
        <div style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-high)' }}>Show Internet Traffic</span>
          <ToggleSwitch value={showTraffic} onChange={setShowTraffic} />
        </div>

        {/* Device Status */}
        <FilterSection title="Device Status" collapsed={collapsedSections.status} onToggle={() => toggleSection('status')}>
          <FilterCheckbox label={`Online (${onlineCount})`} checked={filters.status.includes('online')} onChange={() => toggleFilter('status', 'online')} color="var(--status-ok)" />
          <FilterCheckbox label={`Offline (${offlineCount})`} checked={filters.status.includes('offline')} onChange={() => toggleFilter('status', 'offline')} color="var(--status-critical)" />
        </FilterSection>

        {/* Client Devices */}
        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Client Devices</span>
          <ToggleSwitch value={showClients} onChange={setShowClients} />
        </div>
        {showClients && (
          <div style={{ padding: '6px 14px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
            {['Wired (5)', '2.4 GHz WiFi (2)', '5 GHz WiFi (4)', '6 GHz WiFi (3)'].map((l, i) => (
              <FilterCheckbox key={i} label={l} checked={false} onChange={() => showToast(`Filter: ${l}`)} />
            ))}
          </div>
        )}

        {/* VLANs */}
        <FilterSection title="VLANs" collapsed={collapsedSections.vlans} onToggle={() => toggleSection('vlans')}>
          {['Default (14)', 'Security (12)', 'Guest (3)', 'IoT (6)'].map((l, i) => (
            <FilterCheckbox key={i} label={l} checked={false} onChange={() => showToast(`VLAN filter: ${l}`)} />
          ))}
        </FilterSection>

        {/* WiFi Broadcasts */}
        <FilterSection title="WiFi Broadcasts" collapsed={collapsedSections.wifi} onToggle={() => toggleSection('wifi')}>
          <FilterCheckbox label="MetroBank-Corp (9)" checked={false} onChange={() => showToast('Filter: MetroBank-Corp')} />
          <FilterCheckbox label="MetroBank-Guest (4)" checked={false} onChange={() => showToast('Filter: MetroBank-Guest')} />
        </FilterSection>

        {/* Vendors */}
        <FilterSection title="Vendors" collapsed={collapsedSections.vendors} onToggle={() => toggleSection('vendors')}>
          {vendors.map(v => {
            const count = topoData.nodes.filter(n => n.vendor === v).length;
            return <FilterCheckbox key={v} label={`${v} (${count})`} checked={filters.vendors.includes(v)} onChange={() => toggleFilter('vendors', v)} />;
          })}
        </FilterSection>

        {/* Device Type */}
        <FilterSection title="Device Type" collapsed={collapsedSections.deviceType} onToggle={() => toggleSection('deviceType')}>
          {[
            { type: 'camera', label: 'Cameras' }, { type: 'access', label: 'Access Control' },
            { type: 'alarm', label: 'Alarm Panels' }, { type: 'switch', label: 'Switches' },
            { type: 'ap', label: 'Access Points' }, { type: 'nvr', label: 'NVR/Storage' },
          ].map(dt => {
            const count = topoData.nodes.filter(n => n.type === dt.type).length;
            return <FilterCheckbox key={dt.type} label={`${dt.label} (${count})`} checked={filters.deviceType.includes(dt.type)} onChange={() => toggleFilter('deviceType', dt.type)} />;
          })}
        </FilterSection>

        {/* Clear */}
        <div style={{ padding: '10px 14px' }}>
          <button onClick={() => setFilters({ status: [], vendors: [], vlans: [], deviceType: [] })} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>Clear Filters</button>
        </div>
      </div>

      {/* ── Topology Canvas or Infrastructure Table ── */}
      {viewMode === 'topology' ? (
      <div style={{ position: 'relative', overflow: 'hidden', background: '#0a0e14' }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(63,169,245,0.03) 0%, transparent 70%)' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <pattern id="topoGridV2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(63,169,245,0.04)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topoGridV2)" />
          </svg>
        </div>

        {/* SVG layer for links */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}>
          {visibleLinks.map((link, i) => {
            const from = topoData.nodes.find(n => n.id === link.from);
            const to = topoData.nodes.find(n => n.id === link.to);
            if (!from || !to) return null;
            const isDown = to.status === 'offline' || from.status === 'offline';
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y + nodeSize(from.type)/2}
                  x2={to.x} y2={to.y - nodeSize(to.type)/2}
                  stroke={isDown ? 'var(--status-critical)' : link.wireless ? 'rgba(167,139,250,0.25)' : 'rgba(63,169,245,0.2)'}
                  strokeWidth={link.speed === '10 Gbps' ? 2 : 1.2}
                  strokeDasharray={link.wireless ? '4 3' : isDown ? '4 3' : 'none'}
                />
                {/* Junction dot */}
                <circle cx={to.x} cy={to.y - nodeSize(to.type)/2 - 2} r={3}
                  fill={isDown ? 'var(--status-critical)' : 'var(--brand)'} opacity={0.6} />
                {/* Traffic animation */}
                {showTraffic && !isDown && !link.wireless && (
                  <circle r={2} fill="var(--brand)" opacity={0.8}>
                    <animateMotion dur={`${1 + Math.random() * 2}s`} repeatCount="indefinite"
                      path={`M${from.x},${from.y + nodeSize(from.type)/2} L${to.x},${to.y - nodeSize(to.type)/2}`} />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'top left' }}>
          {visibleNodes.map(node => {
            const size = nodeSize(node.type);
            const isSelected = selectedNode === node.id;
            return (
              <div key={node.id}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                style={{
                  position: 'absolute', left: node.x - size/2, top: node.y - size/2,
                  width: size, height: size, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                {/* Glow ring for selected */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: size > 36 ? 14 : 10,
                    border: `2px solid ${typeColors[node.type] || 'var(--brand)'}`,
                    boxShadow: `0 0 16px ${typeColors[node.type] || 'var(--brand)'}`,
                    animation: 'pulse-online 2s ease-in-out infinite'
                  }} />
                )}
                {/* Node body */}
                <div style={{
                  width: '100%', height: '100%', borderRadius: size > 36 ? 12 : 8,
                  background: isSelected ? 'rgba(63,169,245,0.15)' : 'rgba(10,14,20,0.85)',
                  border: `1.5px solid ${node.status === 'offline' ? 'var(--status-critical)' : (typeColors[node.type] || 'var(--border-subtle)')}`,
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: size > 36 ? 18 : size > 30 ? 14 : 12,
                  boxShadow: isSelected ? `0 0 20px rgba(63,169,245,0.3)` : '0 2px 8px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}>
                  {node.icon}
                  {/* Status indicator */}
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%',
                    background: node.status === 'online' ? 'var(--status-ok)' : node.status === 'offline' ? 'var(--status-critical)' : 'var(--status-warn)',
                    border: '2px solid #0a0e14'
                  }} />
                </div>
                {/* Label */}
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 3, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-high)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{node.label}</div>
                  {node.sublabel && <div className="mono" style={{ fontSize: 7, color: node.signal ? signalColor(node.signal) : 'var(--text-low)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{node.sublabel}</div>}
                </div>
                {/* PoE bar for switches */}
                {node.poeUsed !== undefined && (
                  <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', width: 40 }}>
                    <div style={{ height: 3, borderRadius: 1.5, background: 'rgba(63,169,245,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(node.poeUsed/node.poeTotal)*100}%`, borderRadius: 1.5, background: node.poeUsed/node.poeTotal > 0.85 ? 'var(--status-warn)' : 'var(--brand)' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <button onClick={() => { setZoom(1); setPan({x:0,y:0}); }} style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⊙</button>
        </div>

        {/* Network selector bar at bottom */}
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
          {['Main Network', 'Security VLAN', 'Guest Network'].map((net, i) => (
            <button key={i} onClick={() => showToast(`Showing ${net}`)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 11,
              background: i === 0 ? 'rgba(63,169,245,0.12)' : 'var(--card)',
              border: `1px solid ${i === 0 ? 'var(--brand)' : 'var(--border-subtle)'}`,
              color: i === 0 ? 'var(--brand)' : 'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{i === 0 && '⊕ '}{net}</button>
          ))}
        </div>

        {/* Selected node detail panel */}
        {selectedNode && <TopologyNodeDetail node={topoData.nodes.find(n => n.id === selectedNode)} onClose={() => setSelectedNode(null)} showToast={showToast} />}
      </div>
      ) : (
      /* ── Infrastructure View ── */
      <div style={{ overflow: 'auto', padding: '10px 0' }}>
        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '0 12px' }}>
          {[
            { label: 'Total Devices', value: topoData.nodes.length, color: 'var(--text-high)' },
            { label: 'Online', value: onlineCount, color: 'var(--status-ok)' },
            { label: 'Offline', value: offlineCount, color: 'var(--status-critical)' },
            { label: 'Total PoE', value: `${topoData.nodes.reduce((s,n) => s + (n.poe || 0), 0).toFixed(0)}W`, color: 'var(--brand)' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Device table */}
        <div style={{ padding: '0 12px' }}>
          <GlassPanel style={{ padding: 0 }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>All Devices</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => showToast('Firmware check started')} style={{ padding: '3px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Check Firmware</button>
                <button onClick={() => showToast('Exported to CSV')} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export</button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Status','Device','Model','Type','IP/MAC','PoE','Uptime','Firmware',''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleNodes.filter(n => n.type !== 'wifi-client').map(node => {
                  const firmwares = { gateway: '7.0.25', switch: '6.6.61', ap: '6.6.55', camera: '11.8.62', nvr: '10.12.114', access: '2.4.1', alarm: '4.87', server: '—', isp: '—' };
                  const uptimes = { gateway: '42d 6h', switch: '42d 6h', ap: '38d 2h', camera: '14d 8h', nvr: '42d 6h', access: '42d 6h', alarm: '30d', server: '42d 6h', isp: '—' };
                  return (
                    <tr key={node.id} style={{ transition: 'background 0.15s', cursor: 'pointer' }}
                      onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                        <StatusDot status={node.status === 'online' ? 'online' : 'critical'} size={7} pulse={node.status==='online'} />
                      </td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{node.label}</div>
                      </td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{node.model || '—'}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.06)', color: 'var(--text-mid)', textTransform: 'capitalize' }}>{node.type}</span>
                      </td>
                      <td className="mono" style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>
                        {node.sublabel?.includes('10.') ? node.sublabel.split(' · ')[0] : '—'}
                        {node.mac && <div style={{ fontSize: 8, color: 'var(--text-low)', opacity: 0.6 }}>{node.mac}</div>}
                      </td>
                      <td className="mono" style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: node.poe ? 'var(--brand)' : 'var(--text-low)' }}>{node.poe ? `${node.poe}W` : node.poeUsed ? `${node.poeUsed}/${node.poeTotal}W` : '—'}</td>
                      <td className="mono" style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{uptimes[node.type] || '—'}</td>
                      <td className="mono" style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{firmwares[node.type] || '—'}</td>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button onClick={(e) => { e.stopPropagation(); showToast(`Opening ${node.label} configuration in Asset Management`); }} style={{ padding: '2px 6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--brand)', fontSize: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>⚙ Config</button>
                          <button onClick={(e) => { e.stopPropagation(); showToast(`Restarting ${node.label}...`); }} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-low)', fontSize: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↻</button>
                          <button onClick={(e) => { e.stopPropagation(); showToast('Ping sent'); }} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-low)', fontSize: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⊙</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassPanel>
        </div>
      </div>
      )}
    </div>
  );
}

/* ── Node Detail Panel ── */
function TopologyNodeDetail({ node, onClose, showToast }) {
  if (!node) return null;
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, width: 280, zIndex: 20, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', animation: 'fade-up 0.15s ease both' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{node.icon}</span> {node.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{node.model || node.type} · {node.sublabel}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ padding: '10px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Status</div><StatusBadge status={node.status === 'online' ? 'online' : 'critical'} label={node.status} /></div>
          {node.mac && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>MAC</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.mac}</div></div>}
          {node.uptime && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Uptime</div><div className="mono" style={{ fontSize: 10, color: 'var(--status-ok)' }}>{node.uptime}</div></div>}
          {node.throughput && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Throughput</div><div className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{node.throughput}</div></div>}
          {node.ports && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Ports</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.ports}</div></div>}
          {node.clients && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Clients</div><div className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{node.clients}</div></div>}
          {node.channel && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Channel</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.channel}</div></div>}
          {node.storage && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Storage</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.storage}</div></div>}
          {node.poe && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>PoE Draw</div><div className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{node.poe}W</div></div>}
          {node.signal && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Signal</div><div className="mono" style={{ fontSize: 10, color: node.signal > -50 ? 'var(--status-ok)' : node.signal > -65 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{node.signal} dBm</div></div>}
        </div>
        {node.cpu !== undefined && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 3 }}>
              <span>CPU {node.cpu}%</span><span>MEM {node.mem}%</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${node.cpu}%`, height: '100%', borderRadius: 2, background: 'var(--brand)' }} />
              </div>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${node.mem}%`, height: '100%', borderRadius: 2, background: '#a78bfa' }} />
              </div>
            </div>
          </div>
        )}
        {node.poeUsed !== undefined && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 3 }}>
              <span>PoE Budget</span><span>{node.poeUsed}W / {node.poeTotal}W</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${(node.poeUsed/node.poeTotal)*100}%`, height: '100%', borderRadius: 2, background: node.poeUsed/node.poeTotal > 0.85 ? 'var(--status-warn)' : 'var(--brand)' }} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => showToast('Opening device...')} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open Device</button>
          <button onClick={() => { if (window.__shieldNav) window.__shieldNav('assets'); else showToast('Opening configuration in Asset Management...'); }} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚙ Open Configuration</button>
          <button onClick={() => showToast('Restarting...')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Restart</button>
          <button onClick={() => showToast('Ping sent')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ping</button>
        </div>
      </div>
    </div>
  );
}

/* ── Filter UI Components ── */
function FilterSection({ title, children, collapsed, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--text-low)', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>
      {!collapsed && <div style={{ padding: '0 14px 10px' }}>{children}</div>}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, color }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer', fontSize: 12, color: 'var(--text-mid)' }}>
      <div onClick={onChange} style={{
        width: 16, height: 16, borderRadius: 3,
        border: `1.5px solid ${checked ? 'var(--brand)' : 'var(--border-subtle)'}`,
        background: checked ? 'var(--brand)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
      }}>
        {checked && <span style={{ fontSize: 10, color: '#fff', lineHeight: 1 }}>✓</span>}
      </div>
      {color && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
      <span>{label}</span>
    </label>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
      background: value ? 'var(--brand)' : 'rgba(92,111,134,0.3)',
      position: 'relative', transition: 'background 0.2s'
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: value ? 18 : 2,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CAMERA GRID (enhanced, customer-scoped)
   ══════════════════════════════════════════════════════════════ */
function MonitorCameraGrid({ customer, showToast }) {
  const [gridSize, setGridSize] = React.useState(4); // columns
  const [selectedCam, setSelectedCam] = React.useState(null);

  const cameras = [
    { id: 'c1', name: 'Main Entrance', model: 'Axis P3265-V', status: 'online', fps: 30, bitrate: '4.2', storage: '14d', resolution: '4MP', recording: true },
    { id: 'c2', name: 'Parking Lot A', model: 'Axis P3265-V', status: 'online', fps: 30, bitrate: '5.1', storage: '14d', resolution: '4MP', recording: true },
    { id: 'c3', name: 'Server Room', model: 'Axis M3075-V', status: 'online', fps: 15, bitrate: '2.8', storage: '30d', resolution: '2MP', recording: true },
    { id: 'c4', name: 'Rear Exit', model: 'Hikvision DS-2CD2143', status: 'offline', fps: 0, bitrate: '0', storage: '14d', resolution: '4MP', recording: false },
    { id: 'c5', name: 'Lobby', model: 'Verkada CD52', status: 'online', fps: 30, bitrate: '3.9', storage: '30d', resolution: '5MP', recording: true },
    { id: 'c6', name: 'Hallway B', model: 'Axis P3265-V', status: 'online', fps: 25, bitrate: '3.5', storage: '14d', resolution: '4MP', recording: true },
    { id: 'c7', name: 'Loading Dock', model: 'Axis Q6135-LE', status: 'online', fps: 30, bitrate: '6.2', storage: '14d', resolution: '2MP', recording: true },
    { id: 'c8', name: 'Stairwell', model: 'Axis M3075-V', status: 'warning', fps: 15, bitrate: '1.2', storage: '30d', resolution: '2MP', recording: true },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>◉ {cameras.length} Cameras</span>
          <StatusBadge status="online" label={`${cameras.filter(c=>c.status==='online').length} online`} />
          {cameras.filter(c=>c.status==='offline').length > 0 && <StatusBadge status="critical" label={`${cameras.filter(c=>c.status==='offline').length} offline`} />}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[2,3,4,6].map(g => (
            <button key={g} onClick={() => setGridSize(g)} style={{
              width: 26, height: 26, borderRadius: 4, fontSize: 10,
              background: gridSize === g ? 'rgba(63,169,245,0.12)' : 'transparent',
              border: `1px solid ${gridSize === g ? 'var(--brand)' : 'var(--border-subtle)'}`,
              color: gridSize === g ? 'var(--brand)' : 'var(--text-low)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{g}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 8 }}>
        {cameras.map(cam => (
          <div key={cam.id} onClick={() => setSelectedCam(cam)} className="glass" style={{
            padding: 0, overflow: 'hidden', cursor: 'pointer',
            borderColor: cam.status === 'offline' ? 'rgba(244,63,94,0.3)' : selectedCam?.id === cam.id ? 'var(--brand)' : 'var(--border-subtle)',
            transition: 'border-color 0.2s'
          }}>
            <div style={{
              height: gridSize <= 3 ? 120 : 90,
              background: cam.status === 'offline' ? 'rgba(244,63,94,0.05)' : 'linear-gradient(135deg, rgba(10,14,20,0.9), rgba(17,23,33,0.8))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
            }}>
              {cam.status === 'offline' ? (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>◉</span>
                  <div style={{ fontSize: 10, color: 'var(--status-critical)', marginTop: 2 }}>SIGNAL LOST</div>
                </div>
              ) : (
                <>
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(63,169,245,0.02) 2px, rgba(63,169,245,0.02) 4px)', pointerEvents: 'none' }} />
                  <span style={{ fontSize: 24, opacity: 0.12 }}>◉</span>
                  {cam.recording && (
                    <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-critical)', animation: 'pulse-critical 2s ease-in-out infinite' }} />
                      <span className="mono" style={{ fontSize: 7, color: 'var(--status-critical)', fontWeight: 700 }}>REC</span>
                    </div>
                  )}
                  <div className="mono" style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>14:22:08</div>
                </>
              )}
              <div style={{ position: 'absolute', top: 5, right: 6 }}>
                <StatusDot status={cam.status} size={6} pulse />
              </div>
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)', marginBottom: 1 }}>{cam.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3 }}>{cam.model}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{cam.fps}fps</span>
                <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{cam.bitrate} Mbps</span>
                <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{cam.storage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FLOOR PLAN
   ══════════════════════════════════════════════════════════════ */
function MonitorFloorPlan({ customer, showToast }) {
  const [floor, setFloor] = React.useState(1);
  const [showLayer, setShowLayer] = React.useState({ cameras: true, access: true, sensors: true, aps: true });

  const devices = [
    // Floor 1
    { id: 'd1', type: 'camera', label: 'CAM-01', x: 15, y: 25, floor: 1, status: 'online' },
    { id: 'd2', type: 'camera', label: 'CAM-02', x: 50, y: 20, floor: 1, status: 'online' },
    { id: 'd3', type: 'camera', label: 'CAM-03', x: 85, y: 40, floor: 1, status: 'online' },
    { id: 'd4', type: 'camera', label: 'CAM-04', x: 70, y: 75, floor: 1, status: 'offline' },
    { id: 'd5', type: 'access', label: 'ACR-01', x: 30, y: 50, floor: 1, status: 'online' },
    { id: 'd6', type: 'access', label: 'ACR-02', x: 60, y: 55, floor: 1, status: 'online' },
    { id: 'd7', type: 'ap', label: 'AP-F1', x: 45, y: 40, floor: 1, status: 'online', coverage: 30 },
    { id: 'd8', type: 'sensor', label: 'Motion-01', x: 25, y: 70, floor: 1, status: 'online' },
    // Floor 2
    { id: 'd9', type: 'camera', label: 'CAM-05', x: 20, y: 30, floor: 2, status: 'online' },
    { id: 'd10', type: 'camera', label: 'CAM-06', x: 75, y: 35, floor: 2, status: 'online' },
    { id: 'd11', type: 'access', label: 'ACR-03', x: 50, y: 50, floor: 2, status: 'online' },
    { id: 'd12', type: 'ap', label: 'AP-F2', x: 50, y: 45, floor: 2, status: 'online', coverage: 35 },
  ];

  const floorDevices = devices.filter(d => d.floor === floor);
  const typeIcons = { camera: '◉', access: '⊠', ap: '⊚', sensor: '◉' };
  const typeColors = { camera: 'var(--status-ok)', access: 'var(--status-warn)', ap: '#a78bfa', sensor: 'var(--brand)' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2].map(f => (
            <button key={f} onClick={() => setFloor(f)} style={{
              padding: '4px 14px', borderRadius: 5, fontSize: 11, fontWeight: floor === f ? 600 : 400,
              background: floor === f ? 'rgba(63,169,245,0.12)' : 'transparent',
              border: `1px solid ${floor === f ? 'var(--brand)' : 'var(--border-subtle)'}`,
              color: floor === f ? 'var(--brand)' : 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>Floor {f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{id:'cameras',l:'Cameras',icon:'◉'},{id:'access',l:'Access',icon:'⊠'},{id:'aps',l:'APs',icon:'⊚'},{id:'sensors',l:'Sensors',icon:'◉'}].map(layer => (
            <button key={layer.id} onClick={() => setShowLayer(prev => ({...prev, [layer.id]: !prev[layer.id]}))} style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 10,
              background: showLayer[layer.id] ? 'rgba(63,169,245,0.08)' : 'transparent',
              border: `1px solid ${showLayer[layer.id] ? 'var(--brand)' : 'var(--border-subtle)'}`,
              color: showLayer[layer.id] ? 'var(--brand)' : 'var(--text-low)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 3
            }}>{layer.icon} {layer.l}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#0a0e14' }}>
        {/* Floor plan grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <pattern id="fpGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(63,169,245,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fpGrid)" />
          {/* Floor outline */}
          <rect x="8%" y="8%" width="84%" height="84%" rx="8" fill="none" stroke="rgba(63,169,245,0.12)" strokeWidth="1" />
          {/* Room dividers */}
          <line x1="35%" y1="8%" x2="35%" y2="55%" stroke="rgba(63,169,245,0.08)" strokeWidth="1" />
          <line x1="65%" y1="8%" x2="65%" y2="92%" stroke="rgba(63,169,245,0.08)" strokeWidth="1" />
          <line x1="8%" y1="55%" x2="65%" y2="55%" stroke="rgba(63,169,245,0.08)" strokeWidth="1" />
          {/* Room labels */}
          <text x="20%" y="30%" textAnchor="middle" fill="rgba(63,169,245,0.08)" fontSize="12" fontFamily="var(--font-body)">Lobby</text>
          <text x="50%" y="30%" textAnchor="middle" fill="rgba(63,169,245,0.08)" fontSize="12" fontFamily="var(--font-body)">Main Office</text>
          <text x="78%" y="30%" textAnchor="middle" fill="rgba(63,169,245,0.08)" fontSize="12" fontFamily="var(--font-body)">Server Rm</text>
          <text x="20%" y="75%" textAnchor="middle" fill="rgba(63,169,245,0.08)" fontSize="12" fontFamily="var(--font-body)">Break Room</text>
          <text x="50%" y="75%" textAnchor="middle" fill="rgba(63,169,245,0.08)" fontSize="12" fontFamily="var(--font-body)">Hallway</text>
        </svg>

        {/* Device markers */}
        {floorDevices.map(dev => {
          const visible = (dev.type === 'camera' && showLayer.cameras) || (dev.type === 'access' && showLayer.access) || (dev.type === 'ap' && showLayer.aps) || (dev.type === 'sensor' && showLayer.sensors);
          if (!visible) return null;
          return (
            <div key={dev.id} onClick={() => showToast(`${dev.label} — ${dev.status}`)} style={{
              position: 'absolute', left: `${dev.x}%`, top: `${dev.y}%`, transform: 'translate(-50%, -50%)',
              cursor: 'pointer', zIndex: 5
            }}>
              {/* AP coverage circle */}
              {dev.type === 'ap' && dev.coverage && (
                <div style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: dev.coverage * 4, height: dev.coverage * 4, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
                  border: '1px dashed rgba(167,139,250,0.15)', pointerEvents: 'none'
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: dev.status === 'offline' ? 'rgba(244,63,94,0.15)' : 'rgba(10,14,20,0.8)',
                border: `1.5px solid ${dev.status === 'offline' ? 'var(--status-critical)' : typeColors[dev.type]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, boxShadow: `0 0 8px ${dev.status === 'offline' ? 'rgba(244,63,94,0.3)' : 'rgba(0,0,0,0.4)'}`
              }}>
                {typeIcons[dev.type]}
              </div>
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 2, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 8, fontWeight: 500, color: 'var(--text-mid)', textShadow: '0 1px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>{dev.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ANOMALY DETECTION
   ══════════════════════════════════════════════════════════════ */
function MonitorAnomaly({ customer, showToast }) {
  const anomalies = [
    { id: 'a1', type: 'bandwidth', severity: 'high', device: 'CAM-03 Parking', detail: 'Bandwidth spike: 12.4 Mbps → 38.2 Mbps (3.1x normal)', time: '2:14 PM', status: 'active', score: 92 },
    { id: 'a2', type: 'auth', severity: 'critical', device: 'ACR-01 Main Door', detail: '14 failed badge attempts in 3 minutes (normal: 0-1)', time: '1:50 PM', status: 'active', score: 97 },
    { id: 'a3', type: 'latency', severity: 'medium', device: 'AP-Floor2', detail: 'Latency increased: 4ms → 28ms average', time: '12:30 PM', status: 'investigating', score: 68 },
    { id: 'a4', type: 'offline', severity: 'high', device: 'CAM-04 Rear Exit', detail: 'Device offline for 2h 14m — last ping failed', time: '12:08 PM', status: 'active', score: 85 },
    { id: 'a5', type: 'temperature', severity: 'medium', device: 'NVR-01', detail: 'Temperature: 72°C (threshold: 70°C)', time: '11:45 AM', status: 'resolved', score: 55 },
    { id: 'a6', type: 'port-scan', severity: 'critical', device: 'Core Switch', detail: 'Port scan detected from 10.1.5.42 — 1,200 ports in 30s', time: '10:22 AM', status: 'resolved', score: 98 },
  ];

  const severityColors = { critical: 'var(--status-critical)', high: 'var(--status-warn)', medium: 'var(--brand)', low: 'var(--text-low)' };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="ACTIVE ANOMALIES" value={anomalies.filter(a=>a.status==='active').length} delay={0} />
        <StatCard label="CRITICAL" value={anomalies.filter(a=>a.severity==='critical').length} delay={80} />
        <StatCard label="AVG SCORE" value="82" suffix="/100" delay={160} />
        <StatCard label="RESOLVED TODAY" value={anomalies.filter(a=>a.status==='resolved').length} delay={240} />
      </div>

      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Anomaly Feed</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Segmented options={['All','Active','Critical']} defaultValue="All"
              btnStyle={{ padding: '3px 8px', borderRadius: 4, fontSize: 10 }}
              activeStyle={{ background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
              idleStyle={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }} />
          </div>
        </div>
        {anomalies.map(a => (
          <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(63,169,245,0.04)', background: a.status === 'active' && a.severity === 'critical' ? 'rgba(244,63,94,0.02)' : 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = a.status === 'active' && a.severity === 'critical' ? 'rgba(244,63,94,0.02)' : 'transparent'}>
            <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: severityColors[a.severity] }}>{a.score}</div>
              <div style={{ fontSize: 7, color: 'var(--text-low)', textTransform: 'uppercase' }}>score</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <StatusBadge status={a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'warning' : 'info'} label={a.severity} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{a.device}</span>
                <StatusBadge status={a.status === 'active' ? 'critical' : a.status === 'investigating' ? 'warning' : 'online'} label={a.status} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.4 }}>{a.detail}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.time}</div>
              {a.status === 'active' && (
                <button onClick={(e) => { e.stopPropagation(); showToast(`Investigating ${a.device}`); }} style={{ marginTop: 4, padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Investigate</button>
              )}
            </div>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CRITICAL ALERTS (replaces War Room)
   ══════════════════════════════════════════════════════════════ */
function MonitorAlerts({ customer, showToast }) {
  const [alertFilter, setAlertFilter] = React.useState('all');

  const alerts = [
    { id: 'al1', severity: 'critical', title: 'Camera Offline — Rear Exit', detail: 'CAM-04 (Hikvision DS-2CD2143) has been offline for 2h 14m. Last known IP: 10.1.4.14. Possible cable fault or PoE issue.', time: '12:08 PM', ack: false, type: 'device' },
    { id: 'al2', severity: 'critical', title: 'Port Scan Detected', detail: 'Security threat: 1,200 port scan attempts from 10.1.5.42 in 30 seconds. Source device: Unknown. Firewall rule auto-created to block.', time: '10:22 AM', ack: true, type: 'security' },
    { id: 'al3', severity: 'high', title: 'NVR Storage Warning', detail: 'NVR-01 storage at 78% capacity (6.2TB / 8TB). At current write rate, storage full in ~12 days. Consider archiving or expanding.', time: '9:00 AM', ack: false, type: 'storage' },
    { id: 'al4', severity: 'high', title: 'PoE Budget Warning', detail: 'Floor 1 PoE switch at 92% budget (230W / 250W). Adding devices may cause brownout. Recommend upgrading to USW-Pro-48-PoE.', time: '8:45 AM', ack: false, type: 'power' },
    { id: 'al5', severity: 'medium', title: 'Access Control Tamper', detail: 'ACR-02 Server Room reported tamper alert. Physical inspection recommended. No unauthorized entry detected.', time: '8:30 AM', ack: true, type: 'security' },
    { id: 'al6', severity: 'low', title: 'Firmware Update Available', detail: 'Axis P3265-V firmware 11.8.64 available for 3 cameras. Release notes: stability improvements, CVE patches.', time: '7:00 AM', ack: false, type: 'maintenance' },
  ];

  const filtered = alertFilter === 'all' ? alerts : alerts.filter(a => a.severity === alertFilter);
  const severityColors = { critical: 'var(--status-critical)', high: 'var(--status-warn)', medium: 'var(--brand)', low: 'var(--text-low)' };
  const typeIcons = { device: '◉', security: '🛡', storage: '⊟', power: '⚡', maintenance: '⚙' };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div className="glass" style={{ flex: 1, padding: 14, textAlign: 'center', borderLeft: '3px solid var(--status-critical)' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--status-critical)' }}>{alerts.filter(a=>a.severity==='critical').length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Critical</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: 14, textAlign: 'center', borderLeft: '3px solid var(--status-warn)' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--status-warn)' }}>{alerts.filter(a=>a.severity==='high').length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>High</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: 14, textAlign: 'center', borderLeft: '3px solid var(--brand)' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)' }}>{alerts.filter(a=>!a.ack).length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Unacknowledged</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: 14, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--status-ok)' }}>{alerts.filter(a=>a.ack).length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Acknowledged</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {['all','critical','high','medium','low'].map(f => (
          <button key={f} onClick={() => setAlertFilter(f)} style={{
            padding: '4px 12px', borderRadius: 5, fontSize: 10, textTransform: 'capitalize',
            background: alertFilter === f ? 'rgba(63,169,245,0.1)' : 'transparent',
            border: `1px solid ${alertFilter === f ? 'var(--brand)' : 'var(--border-subtle)'}`,
            color: alertFilter === f ? 'var(--brand)' : 'var(--text-low)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(alert => (
          <GlassPanel key={alert.id} style={{ borderLeft: `3px solid ${severityColors[alert.severity]}`, padding: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{typeIcons[alert.type]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <StatusBadge status={alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'warning' : 'info'} label={alert.severity} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{alert.title}</span>
                  {alert.ack && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.08)', color: 'var(--status-ok)', border: '1px solid rgba(52,211,153,0.15)' }}>ACK</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 6 }}>{alert.detail}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!alert.ack && <button onClick={() => showToast(`Acknowledged: ${alert.title}`)} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Acknowledge</button>}
                  <button onClick={() => showToast('Creating ticket...')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Ticket</button>
                  <button onClick={() => showToast('Assigning tech...')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Assign Tech</button>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)', flexShrink: 0 }}>{alert.time}</div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  MonitoringConsole, TopologyView, TopologyNodeDetail,
  FilterSection, FilterCheckbox, ToggleSwitch,
  MonitorCameraGrid, MonitorFloorPlan, MonitorAnomaly, MonitorAlerts
});

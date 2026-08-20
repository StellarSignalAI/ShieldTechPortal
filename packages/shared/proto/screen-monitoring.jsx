/* ShieldTech — Unified Monitoring Console (Ubiquiti/Auvik-class)
   Customer-first: select a customer → see their documented devices, cameras,
   alerts derived from real asset status. Every view is driven by assetStore —
   nothing on this screen is fabricated. Views without a data source yet say so. */

function MonitoringConsole() {
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('topology');
  const [custDropdown, setCustDropdown] = React.useState(false);
  const [custSearch, setCustSearch] = React.useState('');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  /* REAL customers + their documented device counts (assetStore). */
  const [allCusts] = useShieldStore(customerStore);
  const [allAssets] = useShieldStore(assetStore);
  const customers = (allCusts || []).map(c => {
    const devices = (allAssets || []).filter(a => a.customer === c.name);
    const flagged = devices.some(a => a.status && a.status !== 'online');
    return { id: c.id || c.name, name: c.name, sites: [...new Set(devices.map(a => a.site).filter(Boolean))].length || 1, devices: devices.length, status: flagged ? 'warning' : 'healthy' };
  }).filter(c => !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()));

  const tabs = [
    { id: 'topology', label: 'Network Map', icon: '⊚' },
    { id: 'discovery', label: 'Discovery', icon: '⊙' },
    { id: 'portmap', label: 'Port Map', icon: '⊡' },
    { id: 'cameras', label: 'Camera Grid', icon: '◫' },
    { id: 'floorplan', label: 'Floor Plan', icon: '⊟' },
    { id: 'anomaly', label: 'Anomaly Detection', icon: '◈' },
    { id: 'alerts', label: 'Critical Alerts', icon: '⚠' },
  ];

  const cust = customers.find(c => c.id === selectedCustomer) || customers[0] || null;
  const custAssets = cust ? (allAssets || []).filter(a => a.customer === cust.name) : [];
  const onlineCount = custAssets.filter(a => !a.status || a.status === 'online').length;
  const offlineCount = custAssets.length - onlineCount;
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
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1, textAlign: 'left' }}>{cust ? cust.name : 'No customers yet'}</span>
            <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{cust ? `${cust.devices} devices` : ''}</span>
            <span style={{ fontSize: 8, color: 'var(--text-low)', marginLeft: 4 }}>▼</span>
          </button>
          {custDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 300, background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 8, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '6px 0', maxHeight: 300, overflow: 'auto' }}>
              <div style={{ padding: '4px 12px 8px' }}>
                <input value={custSearch} onChange={e => setCustSearch(e.target.value)} placeholder="Search customers..." autoFocus style={{ width: '100%', padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
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
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: 12 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick stats — computed from the customer's documented assets */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-ok)' }}>{onlineCount}</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)' }}>Online</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: offlineCount > 0 ? 'var(--status-critical)' : 'var(--text-low)' }}>{offlineCount}</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)' }}>Flagged</div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }} onClick={() => setCustDropdown(false)}>
        {activeTab === 'topology' && <TopologyView customer={cust ? cust.name : null} assets={custAssets} showToast={showToast} />}
        {activeTab === 'discovery' && <div style={{ height: '100%', overflow: 'auto', paddingRight: 4 }}><NetworkDiscoveryView showToast={showToast} /></div>}
        {activeTab === 'portmap' && <div style={{ height: '100%', overflow: 'auto', paddingRight: 4 }}><PortMapView showToast={showToast} /></div>}
        {activeTab === 'cameras' && <MonitorCameraGrid customer={cust ? cust.name : null} assets={custAssets} showToast={showToast} />}
        {activeTab === 'floorplan' && <MonitorFloorPlan customer={cust ? cust.name : null} showToast={showToast} />}
        {activeTab === 'anomaly' && <MonitorAnomaly customer={cust ? cust.name : null} showToast={showToast} />}
        {activeTab === 'alerts' && <MonitorAlerts customer={cust ? cust.name : null} assets={custAssets} showToast={showToast} />}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Shared honest empty state for monitoring views
   ══════════════════════════════════════════════════════════════ */
function MonitorEmpty({ title, body, cta }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 10 }}>⊚</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: cta ? 14 : 0 }}>{body}</div>
        {cta && (
          <button onClick={() => { if (window.__shieldNav) window.__shieldNav('assets'); }} style={{ padding: '6px 16px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{cta}</button>
        )}
      </div>
    </div>
  );
}

/* Map documented asset types onto monitoring node categories */
function monitorNodeType(t) {
  const s = String(t || '').toLowerCase();
  if (s.includes('cam')) return 'camera';
  if (s.includes('nvr') || s.includes('record') || s.includes('storage')) return 'nvr';
  if (s.includes('switch')) return 'switch';
  if (s.includes('router') || s.includes('gateway') || s.includes('firewall')) return 'gateway';
  if (s.includes('access point') || s === 'ap' || s.includes('wifi') || s.includes('wireless')) return 'ap';
  if (s.includes('access') || s.includes('reader') || s.includes('door')) return 'access';
  if (s.includes('alarm') || s.includes('panel') || s.includes('intrusion')) return 'alarm';
  if (s.includes('server')) return 'server';
  return 'device';
}
const MONITOR_TYPE_ICONS = { gateway: '🛡', switch: '⊞', ap: '⊚', camera: '◉', access: '⊠', alarm: '⚠', nvr: '⊟', server: '▢', device: '▢' };
const MONITOR_TYPE_COLORS = {
  gateway: 'var(--brand)', switch: 'var(--brand)', ap: '#a78bfa',
  camera: 'var(--status-ok)', access: 'var(--status-warn)', alarm: 'var(--status-critical)',
  nvr: '#60a5fa', server: '#818cf8', device: '#94a3b8'
};

/* ══════════════════════════════════════════════════════════════
   TOPOLOGY VIEW — driven by the customer's documented assets.
   Physical link data isn't captured yet, so devices render as a
   grouped map (by site) without invented cabling.
   ══════════════════════════════════════════════════════════════ */
function TopologyView({ customer, assets, showToast }) {
  const [viewMode, setViewMode] = React.useState('topology'); // topology | infrastructure
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [filters, setFilters] = React.useState({ status: [], vendors: [], deviceType: [] });
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

  /* Real nodes from the asset registry — laid out in a grid per site. */
  const nodes = React.useMemo(() => {
    const list = (assets || []).map(a => ({
      id: a.id || a.name,
      label: a.name || a.model || 'Device',
      sublabel: a.ip || a.model || '',
      type: monitorNodeType(a.type),
      status: !a.status || a.status === 'online' ? 'online' : a.status === 'warning' ? 'warning' : 'offline',
      vendor: a.mfg || null, model: a.model || null, ip: a.ip || null, serial: a.serial || null,
      site: a.site || '', room: a.room || '', uptime: a.uptime,
      icon: MONITOR_TYPE_ICONS[monitorNodeType(a.type)] || '▢',
    }));
    // grid layout grouped by site
    const bySite = {};
    list.forEach(n => { (bySite[n.site || '—'] = bySite[n.site || '—'] || []).push(n); });
    let y = 90;
    Object.keys(bySite).forEach(site => {
      const row = bySite[site];
      row.forEach((n, i) => {
        n.x = 120 + (i % 8) * 105;
        n.y = y + Math.floor(i / 8) * 100;
        n.siteLabel = site;
      });
      y += 100 * Math.ceil(row.length / 8) + 60;
    });
    return list;
  }, [assets]);

  const vendors = [...new Set(nodes.filter(n => n.vendor).map(n => n.vendor))];
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;
  const sites = [...new Set(nodes.map(n => n.site || '—'))];

  const isVisible = (node) => {
    if (filters.status.length && !filters.status.includes(node.status)) return false;
    if (filters.vendors.length && (!node.vendor || !filters.vendors.includes(node.vendor))) return false;
    if (filters.deviceType.length && !filters.deviceType.includes(node.type)) return false;
    return true;
  };
  const visibleNodes = nodes.filter(isVisible);

  const nodeSize = (type) => {
    if (type === 'gateway') return 44;
    if (type === 'switch') return 40;
    return 32;
  };

  const exportCsv = () => {
    if (!nodes.length) { showToast('Nothing to export — no devices recorded for this customer'); return; }
    const cols = ['name', 'type', 'vendor', 'model', 'ip', 'serial', 'site', 'room', 'status'];
    const csv = [cols.join(','), ...nodes.map(n => [n.label, n.type, n.vendor || '', n.model || '', n.ip || '', n.serial || '', n.site, n.room, n.status].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'monitoring-devices.csv'; a.click();
    showToast('Device list exported to CSV', 'ok');
  };

  if (!nodes.length) {
    return <MonitorEmpty title="No monitored devices recorded for this customer yet"
      body={`Devices documented in Asset Management appear here${customer ? ` for ${customer}` : ''}. Live network discovery isn't connected yet.`}
      cta="Open Asset Management" />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0, height: '100%', overflow: 'hidden' }}>
      {/* ── Filter Sidebar ── */}
      <div style={{ borderRight: '1px solid var(--border-subtle)', overflow: 'auto', padding: '10px 0', background: 'var(--card)' }}>
        {/* View toggle */}
        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-subtle)', margin: '0 12px 10px' }}>
          {[{id:'topology',l:'Map'},{id:'infrastructure',l:'Infrastructure'}].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ flex: 1, padding: '5px', fontSize: 10, fontWeight: 500, background: viewMode===v.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: viewMode===v.id?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v.l}</button>
          ))}
        </div>

        {/* Device Status */}
        <FilterSection title="Device Status" collapsed={collapsedSections.status} onToggle={() => toggleSection('status')}>
          <FilterCheckbox label={`Online (${onlineCount})`} checked={filters.status.includes('online')} onChange={() => toggleFilter('status', 'online')} color="var(--status-ok)" />
          <FilterCheckbox label={`Warning (${nodes.filter(n => n.status === 'warning').length})`} checked={filters.status.includes('warning')} onChange={() => toggleFilter('status', 'warning')} color="var(--status-warn)" />
          <FilterCheckbox label={`Offline (${offlineCount})`} checked={filters.status.includes('offline')} onChange={() => toggleFilter('status', 'offline')} color="var(--status-critical)" />
        </FilterSection>

        {/* Vendors — from documented manufacturer field */}
        {vendors.length > 0 && (
          <FilterSection title="Vendors" collapsed={collapsedSections.vendors} onToggle={() => toggleSection('vendors')}>
            {vendors.map(v => {
              const count = nodes.filter(n => n.vendor === v).length;
              return <FilterCheckbox key={v} label={`${v} (${count})`} checked={filters.vendors.includes(v)} onChange={() => toggleFilter('vendors', v)} />;
            })}
          </FilterSection>
        )}

        {/* Device Type — from documented asset types */}
        <FilterSection title="Device Type" collapsed={collapsedSections.deviceType} onToggle={() => toggleSection('deviceType')}>
          {[...new Set(nodes.map(n => n.type))].map(dt => {
            const count = nodes.filter(n => n.type === dt).length;
            return <FilterCheckbox key={dt} label={`${dt.charAt(0).toUpperCase() + dt.slice(1)} (${count})`} checked={filters.deviceType.includes(dt)} onChange={() => toggleFilter('deviceType', dt)} />;
          })}
        </FilterSection>

        {/* Clear */}
        <div style={{ padding: '10px 14px' }}>
          <button onClick={() => setFilters({ status: [], vendors: [], deviceType: [] })} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>Clear Filters</button>
        </div>

        <div style={{ padding: '8px 14px', fontSize: 10, color: 'var(--text-low)', lineHeight: 1.5 }}>
          Physical link/topology data isn't captured yet — devices are grouped by site from the asset registry.
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

        {/* Nodes layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'top left', overflow: 'auto' }}>
          {/* Site group labels */}
          {sites.map(site => {
            const first = visibleNodes.find(n => (n.site || '—') === site);
            if (!first) return null;
            return <div key={site} style={{ position: 'absolute', left: 60, top: first.y - 52, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{site}</div>;
          })}
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
                {isSelected && (
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: size > 36 ? 14 : 10,
                    border: `2px solid ${MONITOR_TYPE_COLORS[node.type] || 'var(--brand)'}`,
                    boxShadow: `0 0 16px ${MONITOR_TYPE_COLORS[node.type] || 'var(--brand)'}`,
                    animation: 'pulse-online 2s ease-in-out infinite'
                  }} />
                )}
                <div style={{
                  width: '100%', height: '100%', borderRadius: size > 36 ? 12 : 8,
                  background: isSelected ? 'rgba(63,169,245,0.15)' : 'rgba(10,14,20,0.85)',
                  border: `1.5px solid ${node.status === 'offline' ? 'var(--status-critical)' : (MONITOR_TYPE_COLORS[node.type] || 'var(--border-subtle)')}`,
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: size > 36 ? 18 : size > 30 ? 14 : 12,
                  boxShadow: isSelected ? `0 0 20px rgba(63,169,245,0.3)` : '0 2px 8px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}>
                  {node.icon}
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%',
                    background: node.status === 'online' ? 'var(--status-ok)' : node.status === 'offline' ? 'var(--status-critical)' : 'var(--status-warn)',
                    border: '2px solid #0a0e14'
                  }} />
                </div>
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 3, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-high)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{node.label}</div>
                  {node.sublabel && <div className="mono" style={{ fontSize: 7, color: 'var(--text-low)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{node.sublabel}</div>}
                </div>
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

        {/* Selected node detail panel */}
        {selectedNode && <TopologyNodeDetail node={nodes.find(n => n.id === selectedNode)} onClose={() => setSelectedNode(null)} showToast={showToast} />}
      </div>
      ) : (
      /* ── Infrastructure View ── */
      <div style={{ overflow: 'auto', padding: '10px 0' }}>
        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '0 12px' }}>
          {[
            { label: 'Total Devices', value: nodes.length, color: 'var(--text-high)' },
            { label: 'Online', value: onlineCount, color: 'var(--status-ok)' },
            { label: 'Offline', value: offlineCount, color: offlineCount ? 'var(--status-critical)' : 'var(--text-low)' },
            { label: 'Sites', value: sites.length, color: 'var(--brand)' },
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
              <button onClick={exportCsv} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export CSV</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Status','Device','Model','Type','IP','Site','Uptime',''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleNodes.map(node => (
                  <tr key={node.id} style={{ transition: 'background 0.15s', cursor: 'pointer' }}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <StatusDot status={node.status === 'online' ? 'online' : node.status === 'warning' ? 'warning' : 'critical'} size={7} pulse={node.status==='online'} />
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{node.label}</div>
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{node.model || '—'}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.06)', color: 'var(--text-mid)', textTransform: 'capitalize' }}>{node.type}</span>
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{node.ip || '—'}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{node.site || '—'}{node.room ? ` · ${node.room}` : ''}</td>
                    <td className="mono" style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{node.uptime != null ? `${node.uptime}%` : '—'}</td>
                    <td style={{ padding: '7px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <button onClick={(e) => { e.stopPropagation(); if (window.__shieldNav) window.__shieldNav('assets'); }} style={{ padding: '2px 6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--brand)', fontSize: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>⚙ Open in Assets</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </div>
      </div>
      )}
    </div>
  );
}

/* ── Node Detail Panel — shows only documented fields ── */
function TopologyNodeDetail({ node, onClose, showToast }) {
  if (!node) return null;
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, width: 280, zIndex: 20, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', animation: 'fade-up 0.15s ease both' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{node.icon}</span> {node.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{node.model || node.type}{node.sublabel ? ` · ${node.sublabel}` : ''}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ padding: '10px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Status</div><StatusBadge status={node.status === 'online' ? 'online' : node.status === 'warning' ? 'warning' : 'critical'} label={node.status} /></div>
          {node.vendor && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Vendor</div><div style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.vendor}</div></div>}
          {node.ip && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>IP</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.ip}</div></div>}
          {node.serial && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Serial</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.serial}</div></div>}
          {node.site && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Site</div><div style={{ fontSize: 10, color: 'var(--text-mid)' }}>{node.site}{node.room ? ` · ${node.room}` : ''}</div></div>}
          {node.uptime != null && <div><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Uptime</div><div className="mono" style={{ fontSize: 10, color: 'var(--status-ok)' }}>{node.uptime}%</div></div>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => { if (window.__shieldNav) window.__shieldNav('assets'); }} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚙ Open in Asset Management</button>
          <button onClick={() => showToast("Remote restart isn't wired up yet — no device connection")} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Restart</button>
          <button onClick={() => showToast("Ping isn't wired up yet — no device connection")} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ping</button>
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
   CAMERA GRID — cameras documented for this customer (assetStore).
   Live video/stream stats need an NVR/VMS connection, which isn't
   wired yet, so tiles show documented facts only.
   ══════════════════════════════════════════════════════════════ */
function MonitorCameraGrid({ customer, assets, showToast }) {
  const [gridSize, setGridSize] = React.useState(4); // columns
  const [selectedCam, setSelectedCam] = React.useState(null);

  const cameras = (assets || [])
    .filter(a => monitorNodeType(a.type) === 'camera')
    .map(a => ({
      id: a.id || a.name, name: a.name || 'Camera', model: a.model || a.mfg || '',
      status: !a.status || a.status === 'online' ? 'online' : a.status === 'warning' ? 'warning' : 'offline',
      site: a.site || '', ip: a.ip || '',
    }));

  if (!cameras.length) {
    return <MonitorEmpty title="No cameras recorded for this customer yet"
      body={`Cameras documented in Asset Management appear here${customer ? ` for ${customer}` : ''}. Live feeds need an NVR/VMS connection, which isn't set up yet.`}
      cta="Open Asset Management" />;
  }

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
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 20, opacity: 0.25 }}>◉</span>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 4 }}>Live feed not connected</div>
              </div>
              <div style={{ position: 'absolute', top: 5, right: 6 }}>
                <StatusDot status={cam.status} size={6} pulse />
              </div>
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)', marginBottom: 1 }}>{cam.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3 }}>{cam.model || '—'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {cam.ip && <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{cam.ip}</span>}
                {cam.site && <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{cam.site}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FLOOR PLAN — needs an uploaded plan + device placements, which
   aren't captured for customers yet. Honest empty state.
   ══════════════════════════════════════════════════════════════ */
function MonitorFloorPlan({ customer, showToast }) {
  return <MonitorEmpty title="No floor plan on file for this customer yet"
    body={`Upload a floor plan and place documented devices to see them here${customer ? ` for ${customer}` : ''}. Device placement isn't captured in the asset registry yet.`}
    cta="Open Asset Management" />;
}

/* ══════════════════════════════════════════════════════════════
   ANOMALY DETECTION — needs a live monitoring/telemetry feed,
   which isn't connected yet. No fabricated incidents.
   ══════════════════════════════════════════════════════════════ */
function MonitorAnomaly({ customer, showToast }) {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="ACTIVE ANOMALIES" value="—" delay={0} />
        <StatCard label="CRITICAL" value="—" delay={80} />
        <StatCard label="AVG SCORE" value="—" delay={160} />
        <StatCard label="RESOLVED TODAY" value="—" delay={240} />
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Anomaly Feed</span>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 26, opacity: 0.3, marginBottom: 8 }}>◈</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginBottom: 4 }}>Anomaly detection isn't connected yet</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.6 }}>Detecting bandwidth spikes, failed-auth bursts and device anomalies needs a live telemetry feed from the customer's network. Nothing is monitored{customer ? ` for ${customer}` : ''} yet.</div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CRITICAL ALERTS — derived from real asset status for this
   customer. Acknowledge is a real local state change.
   ══════════════════════════════════════════════════════════════ */
function MonitorAlerts({ customer, assets, showToast }) {
  const [alertFilter, setAlertFilter] = React.useState('all');
  const [acked, setAcked] = React.useState(() => new Set());

  /* Real alerts: any documented device not reporting 'online'. */
  const alerts = (assets || [])
    .filter(a => a.status && a.status !== 'online')
    .map(a => ({
      id: a.id || a.name,
      severity: a.status === 'warning' ? 'high' : 'critical',
      title: `${a.status === 'warning' ? 'Device Warning' : 'Device Offline'} — ${a.name || a.model || 'Device'}`,
      detail: [a.model && `Model: ${a.model}`, a.ip && `IP: ${a.ip}`, a.site && `Site: ${a.site}${a.room ? ` · ${a.room}` : ''}`, `Status flagged as "${a.status}" in the asset registry.`].filter(Boolean).join(' '),
      type: monitorNodeType(a.type) === 'camera' ? 'device' : 'device',
    }));

  const filtered = alertFilter === 'all' ? alerts : alerts.filter(a => a.severity === alertFilter);
  const severityColors = { critical: 'var(--status-critical)', high: 'var(--status-warn)', medium: 'var(--brand)', low: 'var(--text-low)' };

  if (!(assets || []).length) {
    return <MonitorEmpty title="No monitored devices recorded for this customer yet"
      body="Alerts derive from the status of devices documented in Asset Management — there are none on file for this customer."
      cta="Open Asset Management" />;
  }

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
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)' }}>{alerts.filter(a=>!acked.has(a.id)).length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Unacknowledged</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: 14, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--status-ok)' }}>{alerts.filter(a=>acked.has(a.id)).length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Acknowledged</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {['all','critical','high'].map(f => (
          <button key={f} onClick={() => setAlertFilter(f)} style={{
            padding: '4px 12px', borderRadius: 5, fontSize: 10, textTransform: 'capitalize',
            background: alertFilter === f ? 'rgba(63,169,245,0.1)' : 'transparent',
            border: `1px solid ${alertFilter === f ? 'var(--brand)' : 'var(--border-subtle)'}`,
            color: alertFilter === f ? 'var(--brand)' : 'var(--text-low)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassPanel style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: 24, color: 'var(--status-ok)', marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>No active alerts</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 4 }}>Every device documented{customer ? ` for ${customer}` : ''} is reporting a healthy status.</div>
        </GlassPanel>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(alert => (
          <GlassPanel key={alert.id} style={{ borderLeft: `3px solid ${severityColors[alert.severity]}`, padding: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>◉</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <StatusBadge status={alert.severity === 'critical' ? 'critical' : 'warning'} label={alert.severity} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{alert.title}</span>
                  {acked.has(alert.id) && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.08)', color: 'var(--status-ok)', border: '1px solid rgba(52,211,153,0.15)' }}>ACK</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 6 }}>{alert.detail}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!acked.has(alert.id) && <button onClick={() => { setAcked(prev => new Set([...prev, alert.id])); showToast(`Acknowledged: ${alert.title}`); }} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Acknowledge</button>}
                  <button onClick={() => showToast("Ticket creation from alerts isn't wired up yet — open Helpdesk to create one")} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Ticket</button>
                  <button onClick={() => showToast("Tech assignment from alerts isn't wired up yet — use Dispatch")} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Assign Tech</button>
                </div>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  MonitoringConsole, TopologyView, TopologyNodeDetail,
  FilterSection, FilterCheckbox, ToggleSwitch, MonitorEmpty,
  MonitorCameraGrid, MonitorFloorPlan, MonitorAnomaly, MonitorAlerts
});

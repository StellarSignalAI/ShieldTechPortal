/* Design Studio V2 — D-Tools Killer: Drawing Builder, Brand Catalog, Customer Select, BOM */

function StudioScreen({ onExportToProposal }) {
  const [customer, setCustomer] = React.useState('Metro Bank Corp');
  const [projectName, setProjectName] = React.useState('Lobby Camera Expansion');
  const [activeTab, setActiveTab] = React.useState('plan');
  const [connections, setConnections] = React.useState([
  { id: 'c1', from: 0, to: 7, cable: 'Cat6A', color: 'var(--brand)', length: 60 },
  { id: 'c2', from: 1, to: 7, cable: 'Cat6A', color: 'var(--brand)', length: 45 },
  { id: 'c3', from: 7, to: 8, cable: 'Cat6A', color: 'var(--brand)', length: 10 }]
  );
  const [activeTool, setActiveTool] = React.useState('select');
  const [activeDiscipline, setActiveDiscipline] = React.useState('Cameras');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [brandFilter, setBrandFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [pricingMode, setPricingMode] = React.useState('itemized');
  const [selectedDevice, setSelectedDevice] = React.useState(null);
  const [deviceDetailOpen, setDeviceDetailOpen] = React.useState(null);
  const [drawingBuilderOpen, setDrawingBuilderOpen] = React.useState(false);
  const [savedDrawings, setSavedDrawings] = React.useState([
  { id: 'd1', name: 'Metro Bank — 1st Floor', date: 'Jun 3, 2026', customer: 'Metro Bank Corp' },
  { id: 'd2', name: 'City Hall — Main Lobby', date: 'May 28, 2026', customer: 'City Hall' }]
  );
  const [ssInbox] = useShieldStore(studioInboxStore);
  const allDrawings = [...ssInbox.map((b) => ({ id: b.id, name: b.name, date: b.date, customer: b.customer, sitescan: true })), ...savedDrawings];
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => {setToast(m);setTimeout(() => setToast(null), 3000);};
  const exportToProposal = () => {
    showToast('Design + BOM pushed to Proposal Builder → opening proposal…');
    if (onExportToProposal) { onExportToProposal(); return; }
    if (window.__shieldNav) setTimeout(() => window.__shieldNav('proposals'), 700);
  };

  /* ── Brand / Device Catalog ── */
  const brands = [
  { id: 'axis', name: 'Axis Communications', logo: 'brand-axis', country: 'Sweden', categories: ['Cameras', 'NVR', 'Encoders', 'Analytics'] },
  { id: 'hanwha', name: 'Hanwha Vision', logo: 'brand-hanwha', country: 'South Korea', categories: ['Cameras', 'NVR', 'Analytics'] },
  { id: 'verkada', name: 'Verkada', logo: 'brand-verkada', country: 'USA', categories: ['Cameras', 'Access', 'Sensors'] },
  { id: 'hid', name: 'HID Global', logo: 'brand-hid', country: 'USA', categories: ['Access', 'Credentials', 'Readers'] },
  { id: 'mercury', name: 'Mercury Security', logo: 'brand-mercury', country: 'USA', categories: ['Access', 'Controllers'] },
  { id: 'dsc', name: 'DSC (Johnson Controls)', logo: 'brand-dsc', country: 'Canada', categories: ['Intrusion', 'Panels', 'Sensors'] },
  { id: 'honeywell', name: 'Honeywell', logo: 'brand-honeywell', country: 'USA', categories: ['Intrusion', 'Fire', 'Access'] },
  { id: 'bosch', name: 'Bosch Security', logo: 'brand-bosch', country: 'Germany', categories: ['Cameras', 'Intrusion', 'Fire', 'PA'] },
  { id: 'notifier', name: 'Notifier (Honeywell)', logo: 'brand-notifier', country: 'USA', categories: ['Fire', 'Panels', 'Devices'] },
  { id: 'ubiquiti', name: 'Ubiquiti', logo: 'brand-ubiquiti', country: 'USA', categories: ['Network', 'Switches', 'AP'] },
  { id: 'luxul', name: 'Luxul', logo: 'brand-luxul', country: 'USA', categories: ['Network', 'Switches'] },
  { id: 'apc', name: 'APC (Schneider)', logo: 'brand-apc', country: 'USA', categories: ['Power', 'UPS', 'PDU'] },
  { id: 'altronix', name: 'Altronix', logo: 'brand-altronix', country: 'USA', categories: ['Power', 'Supplies'] },
  { id: 'commscope', name: 'CommScope', logo: '▦', country: 'USA', categories: ['Cabling', 'Patch Panels'] },
  { id: 'leviton', name: 'Leviton', logo: '▤', country: 'USA', categories: ['Cabling', 'Connectors'] }];


  const deviceCatalog = [
  /* Cameras */
  { id: 'AX-P3265V', name: 'Axis P3265-V', brand: 'axis', cat: 'Cameras', subcat: 'Dome', mp: '2MP', features: 'Lightfinder 2.0, WDR, IR 20m', msrp: 890, cost: 620, margin: 30, poe: 12.5, sku: 'CAM-AX-P3265V', inStock: 12, disc: 'Cameras' },
  { id: 'AX-P3268LV', name: 'Axis P3268-LV', brand: 'axis', cat: 'Cameras', subcat: 'Dome', mp: '4K/8MP', features: 'Lightfinder 2.0, WDR, IR 30m, DLPU', msrp: 1240, cost: 870, margin: 30, poe: 12.5, sku: 'CAM-AX-P3268', inStock: 8, disc: 'Cameras' },
  { id: 'AX-Q6135LE', name: 'Axis Q6135-LE', brand: 'axis', cat: 'Cameras', subcat: 'PTZ', mp: '2MP', features: '32x zoom, IR 200m, Autotracking 2', msrp: 4800, cost: 3400, margin: 29, poe: 60, sku: 'CAM-AX-Q6135', inStock: 2, disc: 'Cameras' },
  { id: 'AX-M3116LVE', name: 'Axis M3116-LVE', brand: 'axis', cat: 'Cameras', subcat: 'Mini Dome', mp: '4MP', features: 'Compact, IR 20m, WDR', msrp: 420, cost: 295, margin: 30, poe: 7, sku: 'CAM-AX-M3116', inStock: 20, disc: 'Cameras' },
  { id: 'HW-QNO8080R', name: 'Hanwha QNO-8080R', brand: 'hanwha', cat: 'Cameras', subcat: 'Bullet', mp: '5MP', features: 'IR 30m, WDR 120dB, IP67', msrp: 680, cost: 480, margin: 29, poe: 10, sku: 'CAM-HW-QNO8080', inStock: 6, disc: 'Cameras' },
  { id: 'HW-XND8080RV', name: 'Hanwha XND-8080RV', brand: 'hanwha', cat: 'Cameras', subcat: 'Dome', mp: '5MP', features: 'IR 30m, WDR 150dB, Vari-focal', msrp: 780, cost: 550, margin: 29, poe: 12.5, sku: 'CAM-HW-XND8080', inStock: 10, disc: 'Cameras' },
  { id: 'VK-CD52', name: 'Verkada CD52', brand: 'verkada', cat: 'Cameras', subcat: 'Dome', mp: '5MP', features: 'Cloud-managed, AI Analytics, 30d edge storage', msrp: 1100, cost: 880, margin: 20, poe: 12.5, sku: 'CAM-VK-CD52', inStock: 0, disc: 'Cameras' },
  { id: 'VK-CB62', name: 'Verkada CB62', brand: 'verkada', cat: 'Cameras', subcat: 'Bullet', mp: '4K/8MP', features: 'Cloud, AI, 365d storage option', msrp: 1600, cost: 1280, margin: 20, poe: 25, sku: 'CAM-VK-CB62', inStock: 3, disc: 'Cameras' },
  { id: 'BS-NDE8504', name: 'Bosch Flexidome 8000i', brand: 'bosch', cat: 'Cameras', subcat: 'Dome', mp: '4K/8MP', features: 'Starlight, IVA, IR 30m', msrp: 1450, cost: 1020, margin: 30, poe: 25, sku: 'CAM-BS-8000i', inStock: 4, disc: 'Cameras' },
  /* NVR */
  { id: 'AX-S3008', name: 'Axis S3008', brand: 'axis', cat: 'NVR', subcat: '8ch Recorder', mp: '—', features: '8 PoE ports, 4TB included', msrp: 2200, cost: 1540, margin: 30, poe: 0, sku: 'NVR-AX-S3008', inStock: 3, disc: 'Network' },
  { id: 'HW-XNR6410', name: 'Hanwha XNR-6410', brand: 'hanwha', cat: 'NVR', subcat: '32ch Recorder', mp: '—', features: '16 PoE, 4-bay RAID, Wisenet WAVE', msrp: 2800, cost: 1960, margin: 30, poe: 0, sku: 'NVR-HW-6410', inStock: 4, disc: 'Network' },
  { id: 'HW-XNR6420', name: 'Hanwha XNR-6420', brand: 'hanwha', cat: 'NVR', subcat: '64ch Recorder', mp: '—', features: '16 PoE, 8-bay, WAVE VMS', msrp: 4200, cost: 2940, margin: 30, poe: 0, sku: 'NVR-HW-6420', inStock: 2, disc: 'Network' },
  /* Access Control */
  { id: 'HID-SERK40', name: 'HID iCLASS SE RK40', brand: 'hid', cat: 'Access', subcat: 'Reader', mp: '—', features: 'Multi-tech, OSDP, Bluetooth BLE', msrp: 485, cost: 340, margin: 30, poe: 0, sku: 'ACR-HID-RK40', inStock: 18, disc: 'Access' },
  { id: 'HID-SIG40', name: 'HID Signo Reader 40', brand: 'hid', cat: 'Access', subcat: 'Reader', mp: '—', features: 'Mobile, OSDP, BLE, NFC', msrp: 620, cost: 435, margin: 30, poe: 0, sku: 'ACR-HID-SIG40', inStock: 6, disc: 'Access' },
  { id: 'MRC-LP4502', name: 'Mercury LP4502', brand: 'mercury', cat: 'Access', subcat: 'Panel', mp: '—', features: '2-door controller, PoE, OSDP', msrp: 1850, cost: 1300, margin: 30, poe: 12.5, sku: 'ACP-MRC-4502', inStock: 3, disc: 'Access' },
  { id: 'MRC-EP4502', name: 'Mercury EP4502', brand: 'mercury', cat: 'Access', subcat: 'Panel', mp: '—', features: '4-door controller, OSDP, Web', msrp: 2400, cost: 1680, margin: 30, poe: 12.5, sku: 'ACP-MRC-4502', inStock: 2, disc: 'Access' },
  /* Intrusion */
  { id: 'DSC-HS2064', name: 'DSC PowerSeries Neo HS2064', brand: 'dsc', cat: 'Intrusion', subcat: 'Panel', mp: '—', features: '64-zone, IP/Cell, PowerG wireless', msrp: 680, cost: 480, margin: 29, poe: 0, sku: 'IDS-DSC-NEO64', inStock: 5, disc: 'Intrusion' },
  { id: 'DSC-PG9914', name: 'DSC PG9914 PIR', brand: 'dsc', cat: 'Intrusion', subcat: 'Motion Sensor', mp: '—', features: 'PowerG wireless, pet immune, 12m', msrp: 95, cost: 67, margin: 30, poe: 0, sku: 'IDS-DSC-PIR', inStock: 30, disc: 'Intrusion' },
  { id: 'HW-5800PIR', name: 'Honeywell 5800PIR-RES', brand: 'honeywell', cat: 'Intrusion', subcat: 'Motion Sensor', mp: '—', features: 'Wireless, 35ft, pet immune', msrp: 85, cost: 60, margin: 29, poe: 0, sku: 'IDS-HW-5800PIR', inStock: 25, disc: 'Intrusion' },
  /* Network */
  { id: 'UB-USW24P', name: 'Ubiquiti USW-Pro-24-PoE', brand: 'ubiquiti', cat: 'Network', subcat: 'Switch', mp: '—', features: '24-port, PoE+ 400W, L3, 10G SFP+', msrp: 699, cost: 580, margin: 17, poe: 0, sku: 'NET-UB-USW24', inStock: 5, disc: 'Network' },
  { id: 'UB-UAPAC', name: 'Ubiquiti UniFi AP AC Pro', brand: 'ubiquiti', cat: 'Network', subcat: 'Access Point', mp: '—', features: '3x3 MIMO, PoE, 1300Mbps', msrp: 180, cost: 145, margin: 19, poe: 12, sku: 'NET-UB-UAPAC', inStock: 10, disc: 'Network' },
  /* Power */
  { id: 'APC-SMT1500', name: 'APC Smart-UPS 1500VA', brand: 'apc', cat: 'Power', subcat: 'UPS', mp: '—', features: '1000W, LCD, rack/tower, AVR', msrp: 740, cost: 540, margin: 27, poe: 0, sku: 'PWR-APC-1500', inStock: 7, disc: 'Network' },
  { id: 'ALT-AL400UL', name: 'Altronix AL400ULACM', brand: 'altronix', cat: 'Power', subcat: 'Power Supply', mp: '—', features: '12/24VDC, 4 outputs, fire alarm', msrp: 280, cost: 195, margin: 30, poe: 0, sku: 'PWR-ALT-400', inStock: 8, disc: 'Network' },
  /* Cabling */
  { id: 'CS-C6A1K', name: 'CommScope Cat6A Plenum 1000ft', brand: 'commscope', cat: 'Cabling', subcat: 'Cable', mp: '—', features: '10G, 23AWG, plenum rated, blue', msrp: 420, cost: 310, margin: 26, poe: 0, sku: 'CBL-CS-C6A', inStock: 24, disc: 'Cabling' },
  { id: 'CS-C61K', name: 'CommScope Cat6 Plenum 1000ft', brand: 'commscope', cat: 'Cabling', subcat: 'Cable', mp: '—', features: '1G, 23AWG, plenum, blue', msrp: 280, cost: 200, margin: 29, poe: 0, sku: 'CBL-CS-C6', inStock: 30, disc: 'Cabling' },
  { id: 'LV-PP48', name: 'Leviton 48-port Patch Panel', brand: 'leviton', cat: 'Cabling', subcat: 'Patch Panel', mp: '—', features: 'Cat6A, 2U, angled', msrp: 180, cost: 130, margin: 28, poe: 0, sku: 'CBL-LV-PP48', inStock: 6, disc: 'Cabling' }];


  /* ── Placed Devices on Canvas ── */
  const [placedDevices, setPlacedDevices] = React.useState([
  { x: 120, y: 80, device: deviceCatalog[0], tag: 'CAM-01' },
  { x: 340, y: 80, device: deviceCatalog[0], tag: 'CAM-02' },
  { x: 520, y: 180, device: deviceCatalog[4], tag: 'CAM-03' },
  { x: 120, y: 280, device: deviceCatalog[2], tag: 'CAM-04' },
  { x: 60, y: 180, device: deviceCatalog[12], tag: 'ACR-01' },
  { x: 340, y: 280, device: deviceCatalog[12], tag: 'ACR-02' },
  { x: 520, y: 80, device: deviceCatalog[18], tag: 'PIR-01' },
  { x: 280, y: 180, device: deviceCatalog[10], tag: 'NVR-01' },
  { x: 200, y: 180, device: deviceCatalog[20], tag: 'SW-01' }]
  );

  const [dragPlaceDevice, setDragPlaceDevice] = React.useState(null);

  /* Collapsible catalog + canvas zoom/pan */
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const panRef = React.useRef(null);
  const zoomBy = (d) => setZoom((z) => Math.min(2.5, Math.max(0.4, +(z + d).toFixed(2))));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const onCanvasWheel = (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.1 : -0.1); };
  const onPanDown = (e) => {
    if (activeTool !== 'select') return;
    if (e.target.closest('[data-device-node]')) return; // let device clicks through
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
  };
  const onPanMove = (e) => {
    if (!panRef.current) return;
    panRef.current.moved = true;
    setPan({ x: panRef.current.ox + (e.clientX - panRef.current.sx), y: panRef.current.oy + (e.clientY - panRef.current.sy) });
  };
  const onPanUp = () => { panRef.current = null; };
  // Touch: pointer-event wrappers add finger pan + two-finger pinch zoom.
  const ptrsRef = React.useRef(new Map());
  const pinchRef = React.useRef(null);
  const onPtrDown = (e) => {
    ptrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrsRef.current.size === 2) {
      const [a, b] = [...ptrsRef.current.values()];
      pinchRef.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
      panRef.current = null;
    } else onPanDown(e);
  };
  const onPtrMove = (e) => {
    if (ptrsRef.current.has(e.pointerId)) ptrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrsRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...ptrsRef.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && pinchRef.current.d > 0) setZoom(Math.min(2.5, Math.max(0.4, +(pinchRef.current.z * d / pinchRef.current.d).toFixed(2))));
      return;
    }
    onPanMove(e);
  };
  const onPtrUp = (e) => {
    ptrsRef.current.delete(e.pointerId);
    if (ptrsRef.current.size < 2) pinchRef.current = null;
    if (ptrsRef.current.size === 0) onPanUp();
  };

  const customers = ['Metro Bank Corp', 'Acme Dental', 'City Hall', 'Riverside Medical', 'Pacific Rim Hotels', 'Westfield Mall', 'Harbor View Condos'];
  const categories = [...new Set(deviceCatalog.map((d) => d.cat))];
  const brandNames = [...new Set(deviceCatalog.map((d) => d.brand))];

  /* Filter catalog */
  const filteredCatalog = deviceCatalog.filter((d) => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && !d.brand.toLowerCase().includes(searchQuery.toLowerCase()) && !d.subcat.toLowerCase().includes(searchQuery.toLowerCase()) && !d.features.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (brandFilter !== 'all' && d.brand !== brandFilter) return false;
    if (categoryFilter !== 'all' && d.cat !== categoryFilter) return false;
    return true;
  });

  /* BOM from placed devices */
  const bomMap = {};
  placedDevices.forEach((pd) => {
    if (bomMap[pd.device.id]) bomMap[pd.device.id].qty++;else
    bomMap[pd.device.id] = { device: pd.device, qty: 1 };
  });
  const bomList = Object.values(bomMap);
  const matTotal = bomList.reduce((s, b) => s + b.device.msrp * b.qty, 0);
  const costTotal = bomList.reduce((s, b) => s + b.device.cost * b.qty, 0);
  const laborEstimate = placedDevices.length * 125 * 1.5; // 1.5h avg install per device
  const cableFt = connections.reduce((s, c) => s + (c.length || 0), 0);
  const cableCost = Math.round(cableFt * 0.85); // installed $/ft
  const grandTotal = matTotal + laborEstimate + cableCost;
  const avgMargin = matTotal > 0 ? ((matTotal - costTotal) / matTotal * 100).toFixed(1) : 0;

  const removeDevice = (idx) => {setPlacedDevices((prev) => prev.filter((_, i) => i !== idx));showToast('Device removed from canvas');};

  const catIcons = { 'Cameras': 'cam-dome', 'NVR': 'nvr-box', 'Access': 'reader', 'Intrusion': 'alarm-panel', 'Network': 'switch-ports', 'Power': 'ups', 'Cabling': 'cable', 'Fire': 'fire-panel' };
  const subcatIcons = { 'Dome': 'cam-dome', 'Bullet': 'cam-bullet', 'PTZ': 'cam-ptz', 'Mini Dome': 'cam-mini', 'Turret': 'cam-turret', 'Fisheye': 'cam-fisheye', 'Reader': 'reader', 'Controller': 'controller', 'Switch': 'switch-ports', 'Access Point': 'ap-ceiling', 'UPS': 'ups', 'Power Supply': 'poe', 'Motion Sensor': 'motion-sensor', 'Panel': 'alarm-panel', 'Door Lock': 'door-strike', '8ch Recorder': 'nvr-box', '32ch Recorder': 'nvr-box', '64ch Recorder': 'nvr-box' };

  const catColors = { 'Cameras': 'var(--brand)', 'NVR': 'var(--status-ok)', 'Access': '#c084fc', 'Intrusion': 'var(--status-warn)', 'Network': 'var(--status-ok)', 'Power': '#f59e0b', 'Cabling': 'var(--text-low)', 'Fire': 'var(--status-critical)' };
  window.__studioSubcatIcons = subcatIcons;
  const studioTabs = [{ id: 'plan', l: 'Plan View' }, { id: 'interconnect', l: 'Interconnect' }, { id: 'rack', l: 'Rack Elevation' }, { id: 'photo', l: 'Image Quote' }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${leftCollapsed ? '0px' : '260px'} 1fr 320px`, gap: 0, height: 'calc(100vh - 100px)', overflow: 'hidden', transition: 'grid-template-columns 0.25s ease' }}>

      {/* ─── LEFT: Device Catalog + Brand Browser ─── */}
      <div style={{ background: 'var(--card)', borderRight: leftCollapsed ? 'none' : '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: leftCollapsed ? 0 : 1, transition: 'opacity 0.15s ease', pointerEvents: leftCollapsed ? 'none' : 'auto' }}>
        {/* Customer + Project Header */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <select value={customer} onChange={(e) => setCustomer(e.target.value)} style={{ flex: 1, padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              {customers.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setLeftCollapsed(true)} title="Hide catalog" style={{ flexShrink: 0, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>«</button>
          </div>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ width: '100%', padding: '4px 8px', background: 'transparent', border: '1px solid transparent', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, fontFamily: 'var(--font-body)', outline: 'none' }}
          onFocus={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'} />
        </div>

        {/* Search + Filters */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search brands, devices, models..." style={{ width: '100%', padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} style={{ flex: 1, padding: '3px 4px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 9, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ flex: 1, padding: '3px 4px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 9, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Device List */}
        <div style={{ flex: 1, overflow: 'auto' }} data-comment-anchor="fcca112e76-div-165-9">
          <div style={{ padding: '6px 12px', fontSize: 9, color: 'var(--text-low)' }}>{filteredCatalog.length} devices · Drag to canvas or click for details</div>
          {filteredCatalog.map((device, i) => {
            const brandInfo = brands.find((b) => b.id === device.brand);
            return (
              <div key={device.id}
              draggable
              onDragStart={() => setDragPlaceDevice(device)}
              onDragEnd={() => setDragPlaceDevice(null)}
              onClick={(e) => {
                if (e.nativeEvent && e.nativeEvent.__stArmMark) { setDragPlaceDevice(device); showToast(`${device.name} armed — tap the canvas to place`); return; }
                setDeviceDetailOpen(device);
              }}
              onPointerUp={(e) => { if (e.pointerType === 'touch' && dragPlaceDevice !== device) e.nativeEvent.__stArmMark = true; }}
              style={{
                padding: '8px 12px', cursor: 'grab', borderBottom: '1px solid rgba(63,169,245,0.03)',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: `${catColors[device.cat] || 'var(--brand)'}15`, border: `1px solid ${catColors[device.cat] || 'var(--brand)'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={subcatIcons[device.subcat] || catIcons[device.cat] || 'cam-dome'} size={14} color={catColors[device.cat] || 'var(--brand)'} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{device.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{brandInfo?.name} · {device.subcat}{device.mp !== '—' ? ` · ${device.mp}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--brand)' }}>${device.msrp}</div>
                    <div className="mono" style={{ fontSize: 8, color: device.inStock > 0 ? 'var(--status-ok)' : 'var(--status-critical)' }}>{device.inStock > 0 ? `${device.inStock} avail` : 'Out'}</div>
                  </div>
                </div>
                {device.features && <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{device.features}</div>}
              </div>);

          })}
        </div>

        {/* Bottom: ShieldTech AI + Draw */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setDrawingBuilderOpen(true)} style={{ width: '100%', padding: '7px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✏ Open Drawing Builder</button>
          <button onClick={() => showToast('ShieldTech AI analyzing floor plan...')} style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>⟡</span> ShieldTech AI: Auto-Design Layout
          </button>
        </div>
      </div>

      {/* ─── CENTER: Tabbed design surface ─── */}
      <div style={{ background: 'rgba(5,7,10,0.6)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Design surface tab bar */}
        <div style={{ display: 'flex', gap: 2, padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {studioTabs.map((t) =>
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '5px 14px', fontSize: 11, fontWeight: activeTab === t.id ? 600 : 400, borderRadius: 6, background: activeTab === t.id ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${activeTab === t.id ? 'var(--brand)' : 'transparent'}`, color: activeTab === t.id ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.l}</button>
          )}
        </div>

        {activeTab === 'interconnect' && <InterconnectCanvas placedDevices={placedDevices} connections={connections} setConnections={setConnections} brands={brands} catColors={catColors} showToast={showToast} setPlacedDevices={setPlacedDevices} deviceCatalog={deviceCatalog} onExportToProposal={exportToProposal} />}
        {activeTab === 'rack' && <RackElevationView placedDevices={placedDevices} catColors={catColors} showToast={showToast} setPlacedDevices={setPlacedDevices} deviceCatalog={deviceCatalog} brands={brands} onExportToProposal={exportToProposal} />}
        {activeTab === 'photo' && <PhotoQuoteCanvas placedDevices={placedDevices} setPlacedDevices={setPlacedDevices} dragPlaceDevice={dragPlaceDevice} setDragPlaceDevice={setDragPlaceDevice} catColors={catColors} showToast={showToast} onExportToProposal={exportToProposal} />}

      {activeTab === 'plan' &&
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'none', cursor: panRef.current ? 'grabbing' : (activeTool === 'select' ? 'grab' : 'default') }}
        onPointerDown={onPtrDown}
        onPointerMove={onPtrMove}
        onPointerUp={onPtrUp}
        onPointerCancel={onPtrUp}
        onPointerLeave={onPtrUp}
        onWheel={onCanvasWheel}
        onClick={(e) => {
          // Tap-to-place: a device armed from the catalog lands where you tap.
          if (!dragPlaceDevice || e.target.closest('[data-device-node]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left - pan.x) / zoom - 40;
          const y = (e.clientY - rect.top - pan.y) / zoom - 40;
          const tag = `${dragPlaceDevice.cat.substring(0, 3).toUpperCase()}-${String(placedDevices.length + 1).padStart(2, '0')}`;
          setPlacedDevices((prev) => [...prev, { x, y, device: dragPlaceDevice, tag }]);
          showToast(`Placed ${dragPlaceDevice.name}`);
          setDragPlaceDevice(null);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (!dragPlaceDevice) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left - pan.x) / zoom - 40;
          const y = (e.clientY - rect.top - pan.y) / zoom - 40;
          const tag = `${dragPlaceDevice.cat.substring(0, 3).toUpperCase()}-${String(placedDevices.length + 1).padStart(2, '0')}`;
          setPlacedDevices((prev) => [...prev, { x, y, device: dragPlaceDevice, tag }]);
          showToast(`Placed ${dragPlaceDevice.name}`);
          setDragPlaceDevice(null);
        }}>

        {/* Canvas Toolbar */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[{ id: 'select', l: 'Select' }, { id: 'wall', l: 'Wall' }, { id: 'line', l: 'Cable Run' }, { id: 'text', l: 'Text' }, { id: 'measure', l: 'Measure' }].map((t) =>
              <button key={t.id} onClick={() => setActiveTool(t.id)} style={{
                padding: '4px 10px', fontSize: 10, borderRadius: 4,
                background: activeTool === t.id ? 'rgba(63,169,245,0.15)' : 'rgba(10,14,20,0.7)',
                border: `1px solid ${activeTool === t.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
                color: activeTool === t.id ? 'var(--brand)' : 'var(--text-low)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(8px)'
              }}>{t.l}</button>
              )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => {/* upload */showToast('Upload floor plan image...');}} style={{ padding: '4px 10px', background: 'rgba(10,14,20,0.7)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(8px)' }}>◉ Upload Plan</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(10,14,20,0.7)', border: '1px solid var(--border-subtle)', borderRadius: 4, backdropFilter: 'blur(8px)' }}>
              <button onClick={() => zoomBy(-0.1)} title="Zoom out" style={{ padding: '3px 9px', background: 'transparent', border: 'none', color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>−</button>
              <button onClick={resetView} title="Reset view" className="mono" style={{ padding: '3px 4px', minWidth: 38, background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{Math.round(zoom * 100)}%</button>
              <button onClick={() => zoomBy(0.1)} title="Zoom in" style={{ padding: '3px 9px', background: 'transparent', border: 'none', color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+</button>
            </div>
          </div>
        </div>

        {/* Reopen catalog (shown when collapsed) */}
        {leftCollapsed &&
          <button onClick={() => setLeftCollapsed(false)} title="Show catalog" style={{ position: 'absolute', top: 10, left: 10, zIndex: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: 'rgba(10,14,20,0.85)', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(8px)' }}>» Catalog</button>
        }

        {/* Floor Plan SVG Canvas */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="studioGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(63,169,245,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#studioGrid)" />

          {/* Zoom + pan wrapper */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Walls */}
          <g transform="translate(40, 40)" stroke="rgba(159,178,200,0.3)" strokeWidth="2" fill="none">
            <rect x="0" y="0" width="560" height="320" rx="2" />
            <line x1="200" y1="0" x2="200" y2="120" />
            <line x1="200" y1="160" x2="200" y2="320" />
            <line x1="400" y1="0" x2="400" y2="320" />
            <line x1="0" y1="160" x2="200" y2="160" />
            <line x1="400" y1="160" x2="560" y2="160" />
            <text x="90" y="80" fill="rgba(159,178,200,0.15)" fontSize="12" fontFamily="var(--font-body)" textAnchor="middle">Reception</text>
            <text x="90" y="240" fill="rgba(159,178,200,0.15)" fontSize="12" fontFamily="var(--font-body)" textAnchor="middle">Office A</text>
            <text x="300" y="160" fill="rgba(159,178,200,0.15)" fontSize="12" fontFamily="var(--font-body)" textAnchor="middle">Server Room</text>
            <text x="480" y="80" fill="rgba(159,178,200,0.15)" fontSize="12" fontFamily="var(--font-body)" textAnchor="middle">Office B</text>
            <text x="480" y="240" fill="rgba(159,178,200,0.15)" fontSize="12" fontFamily="var(--font-body)" textAnchor="middle">Storage</text>
          </g>

          {/* Cable runs */}
          <g transform="translate(40, 40)" stroke="rgba(63,169,245,0.12)" strokeWidth="1" strokeDasharray="4 3" fill="none">
            {placedDevices.filter((d) => d.device.cat === 'NVR' || d.device.cat === 'Network').length > 0 && placedDevices.filter((d) => d.device.cat === 'Cameras' || d.device.cat === 'Access').map((pd, i) => {
                const hub = placedDevices.find((d) => d.device.cat === 'NVR' || d.device.cat === 'Network');
                return hub ? <line key={i} x1={hub.x} y1={hub.y} x2={pd.x} y2={pd.y} /> : null;
              })}
          </g>

          {/* Camera FOV cones + Placed devices */}
          <g transform="translate(40, 40)">
            {placedDevices.map((pd, i) => {
                const color = catColors[pd.device.cat] || 'var(--brand)';
                const isSel = selectedDevice === i;
                // FOV data per subcat — angle in degrees, range in px
                const fovMap = {
                  'Dome': { angle: 110, range: 60 },
                  'Mini Dome': { angle: 100, range: 50 },
                  'Turret': { angle: 100, range: 55 },
                  'Bullet': { angle: 80, range: 80 },
                  'PTZ': { angle: 60, range: 120 },
                  'Fisheye': { angle: 360, range: 50 }
                };
                const fov = pd.device.cat === 'Cameras' ? fovMap[pd.device.subcat] || { angle: 90, range: 60 } : null;
                const rotation = pd.rotation || 0;

                // Build FOV cone path
                let fovPath = null;
                if (fov && fov.angle < 360) {
                  const halfAngle = fov.angle / 2 * Math.PI / 180;
                  const r = fov.range;
                  const startAngle = -Math.PI / 2 - halfAngle + rotation * Math.PI / 180;
                  const endAngle = -Math.PI / 2 + halfAngle + rotation * Math.PI / 180;
                  const x1 = Math.cos(startAngle) * r;
                  const y1 = Math.sin(startAngle) * r;
                  const x2 = Math.cos(endAngle) * r;
                  const y2 = Math.sin(endAngle) * r;
                  const largeArc = fov.angle > 180 ? 1 : 0;
                  fovPath = `M0,0 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
                }

                // Get the right icon name for this device
                const iconName = subcatIcons[pd.device.subcat] || catIcons[pd.device.cat] || 'cam-dome';
                const iconPaths = typeof Icon !== 'undefined' ? null : null; // We'll use foreignObject

                return (
                  <g key={i} data-device-node transform={`translate(${pd.x}, ${pd.y})`} style={{ cursor: 'pointer' }}
                  onClick={(e) => {e.stopPropagation();setSelectedDevice(isSel ? null : i);}}>

                  {/* FOV cone for cameras */}
                  {fov && fov.angle < 360 && fovPath &&
                    <path d={fovPath}
                    fill={isSel ? 'rgba(63,169,245,0.08)' : 'rgba(63,169,245,0.04)'}
                    stroke={isSel ? 'rgba(63,169,245,0.25)' : 'rgba(63,169,245,0.1)'}
                    strokeWidth="0.5"
                    style={{ transition: 'fill 0.2s' }} />
                    }
                  {/* Fisheye 360° circle */}
                  {fov && fov.angle >= 360 &&
                    <circle r={fov.range}
                    fill={isSel ? 'rgba(63,169,245,0.06)' : 'rgba(63,169,245,0.03)'}
                    stroke={isSel ? 'rgba(63,169,245,0.2)' : 'rgba(63,169,245,0.08)'}
                    strokeWidth="0.5" />
                    }

                  {/* Selection ring */}
                  {isSel && <circle r="20" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.5">
                    <animate attributeName="r" from="16" to="22" dur="1.5s" repeatCount="indefinite" />
                  </circle>}

                  {/* Device icon background */}
                  <rect x="-13" y="-13" width="26" height="26" rx="6"
                    fill="rgba(10,14,20,0.9)" stroke={color} strokeWidth={isSel ? 2 : 1.2}
                    style={{ filter: `drop-shadow(0 0 ${isSel ? 8 : 4}px ${color})` }} />

                  {/* SVG icon via foreignObject */}
                  <foreignObject x="-8" y="-8" width="16" height="16">
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {typeof Icon !== 'undefined' && <Icon name={iconName} size={14} color={color} />}
                    </div>
                  </foreignObject>

                  {/* Label */}
                  <text y="22" textAnchor="middle" fill="var(--text-mid)" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.05em">{pd.tag}</text>
                  {/* Name on hover/select */}
                  {isSel && <text y="-20" textAnchor="middle" fill={color} fontSize="8" fontFamily="var(--font-body)" fontWeight="500">{pd.device.name}</text>}
                </g>);

              })}
          </g>
          </g>
        </svg>

        {/* Selection info panel */}
        {selectedDevice !== null && placedDevices[selectedDevice] && (() => {
            const pd = placedDevices[selectedDevice];
            const isCamera = pd.device.cat === 'Cameras';
            return (
              <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 5, padding: '10px 14px', borderRadius: 8, background: 'rgba(10,14,20,0.9)', border: '1px solid var(--border-strong)', backdropFilter: 'blur(8px)', maxWidth: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name={subcatIcons[pd.device.subcat] || catIcons[pd.device.cat] || 'cam-dome'} size={16} color={catColors[pd.device.cat] || 'var(--brand)'} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{pd.device.name}</span>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{pd.tag}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 6 }}>{brands.find((b) => b.id === pd.device.brand)?.name} · {pd.device.subcat}{pd.device.mp !== '—' ? ` · ${pd.device.mp}` : ''}</div>

            {/* FOV controls for cameras */}
            {isCamera &&
                <div style={{ marginBottom: 8, padding: '6px 0', borderTop: '1px solid rgba(63,169,245,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 4 }}>
                  <span>Rotation</span>
                  <span className="mono">{pd.rotation || 0}°</span>
                </div>
                <input type="range" min={0} max={359} value={pd.rotation || 0}
                  onChange={(e) => setPlacedDevices((prev) => prev.map((d, idx) => idx === selectedDevice ? { ...d, rotation: parseInt(e.target.value) } : d))}
                  style={{ width: '100%', height: 4 }} />
              </div>
                }

            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setDeviceDetailOpen(pd.device)} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Details</button>
              <button onClick={() => {const newRot = ((pd.rotation || 0) + 45) % 360;setPlacedDevices((prev) => prev.map((d, idx) => idx === selectedDevice ? { ...d, rotation: newRot } : d));}} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Rotate 45°</button>
              <button onClick={() => removeDevice(selectedDevice)} style={{ padding: '3px 8px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 3, color: 'var(--status-critical)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Remove</button>
            </div>
          </div>);
          })()}

        {/* Drop zone indicator */}
        {dragPlaceDevice &&
          <div style={{ position: 'absolute', inset: 0, border: '3px dashed var(--brand)', borderRadius: 8, background: 'rgba(63,169,245,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 3 }}>
            <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 500 }}>Drop {dragPlaceDevice.name} here</span>
          </div>
          }
      </div>
        }
      </div>

      {/* ─── RIGHT: BOM + Quote Panel ─── */}
      <div style={{ background: 'var(--card)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Bill of Materials</div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            {['itemized', 'by-system', 'lump-sum'].map((m) =>
            <button key={m} onClick={() => setPricingMode(m)} style={{ flex: 1, padding: '4px', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', background: pricingMode === m ? 'rgba(63,169,245,0.12)' : 'transparent', border: 'none', color: pricingMode === m ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{m.replace('-', ' ')}</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="label-sm" style={{ padding: '10px 14px 4px' }}>EQUIPMENT ({bomList.length} types, {placedDevices.length} devices)</div>
          {bomList.map((item, i) =>
          <div key={i} style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-high)', fontWeight: 400 }}>{item.device.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{brands.find((b) => b.id === item.device.brand)?.name} · {item.device.sku}</div>
              </div>
              <span className="mono" style={{ width: 22, textAlign: 'center', color: 'var(--text-mid)', fontSize: 10 }}>{item.qty}</span>
              <span className="mono" style={{ width: 55, textAlign: 'right', color: 'var(--text-low)', fontSize: 10 }}>${item.device.msrp}</span>
              <span className="mono" style={{ width: 65, textAlign: 'right', color: 'var(--text-high)', fontSize: 11, fontWeight: 500 }}>${(item.device.msrp * item.qty).toLocaleString()}</span>
            </div>
          )}

          <div className="label-sm" style={{ padding: '14px 14px 4px' }}>LABOR (estimated)</div>
          <div style={{ padding: '7px 14px', display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <span style={{ color: 'var(--text-mid)' }}>Install + Commission ({placedDevices.length} devices × 1.5h avg)</span>
            <span className="mono" style={{ fontWeight: 500 }}>${laborEstimate.toLocaleString()}</span>
          </div>
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px solid var(--border-strong)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: 'var(--text-mid)' }}>Equipment</span>
            <span className="mono" style={{ fontWeight: 500 }}>${matTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: 'var(--text-mid)' }}>Labor</span>
            <span className="mono" style={{ fontWeight: 500 }}>${laborEstimate.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: 'var(--text-mid)' }}>Cable <span style={{ fontSize: 9, color: 'var(--text-low)' }}>({cableFt} ft · interconnect)</span></span>
            <span className="mono" style={{ fontWeight: 500 }}>${cableCost.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
            <span style={{ color: 'var(--text-low)' }}>Avg Margin</span>
            <span className="mono" style={{ fontSize: 11, color: parseFloat(avgMargin) >= 25 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{avgMargin}%</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>${grandTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => exportToProposal()} style={{ flex: 1, padding: '8px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↗ Export to Proposal</button>
            <button onClick={() => showToast('BOM exported to PDF')} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>PDF</button>
          </div>
        </div>
      </div>

      {/* ─── Device Detail Modal ─── */}
      {deviceDetailOpen && <DeviceDetailModal device={deviceDetailOpen} brands={brands} onClose={() => setDeviceDetailOpen(null)} onPlace={() => {
        const tag = `${deviceDetailOpen.cat.substring(0, 3).toUpperCase()}-${String(placedDevices.length + 1).padStart(2, '0')}`;
        setPlacedDevices((prev) => [...prev, { x: 100 + Math.random() * 300, y: 80 + Math.random() * 200, device: deviceDetailOpen, tag }]);
        showToast(`${deviceDetailOpen.name} placed on canvas`);
        setDeviceDetailOpen(null);
      }} showToast={showToast} />}

      {/* ─── Drawing Builder Modal ─── */}
      {drawingBuilderOpen && <DrawingBuilderModal savedDrawings={allDrawings} setSavedDrawings={setSavedDrawings} customer={customer} onClose={() => setDrawingBuilderOpen(false)} showToast={showToast} />}

      {/* SiteScan imports chip */}
      {ssInbox.length > 0 &&
      <div onClick={() => setDrawingBuilderOpen(true)} style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 800, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: 'var(--card)', border: '1px solid rgba(192,132,252,0.45)', cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}>
          <span style={{ fontSize: 13, color: '#c084fc' }}>◉</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-high)', fontWeight: 500 }}>{ssInbox.length} SiteScan blueprint{ssInbox.length > 1 ? 's' : ''} imported</span>
          <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 600 }}>Open →</span>
        </div>}

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>);

}

/* ── Device Detail Modal ── */
function DeviceDetailModal({ device, brands, onClose, onPlace, showToast }) {
  const brand = brands.find((b) => b.id === device.brand);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>{device.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{brand?.name} · {device.subcat} · {device.sku}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {device.mp !== '—' && <div className="glass" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-low)' }}>Resolution</div><div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{device.mp}</div></div>}
          <div className="glass" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-low)' }}>MSRP</div><div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>${device.msrp}</div></div>
          <div className="glass" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-low)' }}>Cost</div><div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>${device.cost}</div></div>
          <div className="glass" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-low)' }}>Margin</div><div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-ok)' }}>{device.margin}%</div></div>
          {device.poe > 0 && <div className="glass" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-low)' }}>PoE Draw</div><div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{device.poe}W</div></div>}
          <div className="glass" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-low)' }}>In Stock</div><div className="mono" style={{ fontSize: 14, fontWeight: 600, color: device.inStock > 0 ? 'var(--status-ok)' : 'var(--status-critical)' }}>{device.inStock}</div></div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 14 }}>
          <div className="label-sm" style={{ marginBottom: 6 }}>FEATURES</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6 }}>{device.features}</div>
        </div>

        {/* Comparable products suggestion */}
        <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--brand)', marginBottom: 4 }}><span>⟡</span> ShieldTech AI: Similar products</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Consider the {device.brand === 'axis' ? 'Hanwha' : 'Axis'} equivalent for {device.margin < 25 ? 'better margins' : 'price comparison'}.</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPlace} style={{ flex: 1, padding: '8px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Place on Canvas</button>
          <button onClick={() => {showToast('Added to cart');onClose();}} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add to Cart</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Close</button>
        </div>
      </div>
    </div>);

}

/* ── Drawing Builder Modal ── */
function DrawingBuilderModal({ savedDrawings, setSavedDrawings, customer, onClose, showToast }) {
  const [drawTool, setDrawTool] = React.useState('wall');
  const [drawName, setDrawName] = React.useState('');
  const [lines, setLines] = React.useState([
  { x1: 50, y1: 50, x2: 450, y2: 50 },
  { x1: 450, y1: 50, x2: 450, y2: 300 },
  { x1: 450, y1: 300, x2: 50, y2: 300 },
  { x1: 50, y1: 300, x2: 50, y2: 50 },
  { x1: 200, y1: 50, x2: 200, y2: 200 },
  { x1: 200, y1: 200, x2: 350, y2: 200 }]
  );
  const [texts, setTexts] = React.useState([
  { x: 125, y: 130, text: 'Room A' },
  { x: 320, y: 130, text: 'Room B' },
  { x: 250, y: 260, text: 'Hallway' }]
  );
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawStart, setDrawStart] = React.useState(null);
  const [addingText, setAddingText] = React.useState(null);
  const canvasRef = React.useRef(null);

  const snap = (v) => Math.round(v / 20) * 20;

  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);

    if (drawTool === 'wall' || drawTool === 'line') {
      setIsDrawing(true);
      setDrawStart({ x, y });
    }
    if (drawTool === 'text') {
      setAddingText({ x, y });
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (!isDrawing || !drawStart) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);
    if (Math.abs(x - drawStart.x) > 10 || Math.abs(y - drawStart.y) > 10) {
      setLines((prev) => [...prev, { x1: drawStart.x, y1: drawStart.y, x2: x, y2: y }]);
    }
    setIsDrawing(false);
    setDrawStart(null);
  };

  const addText = (text) => {
    if (text && addingText) {
      setTexts((prev) => [...prev, { x: addingText.x, y: addingText.y, text }]);
    }
    setAddingText(null);
  };

  const saveDrawing = () => {
    const name = drawName || `${customer} — Drawing ${savedDrawings.length + 1}`;
    const id = 'd' + Date.now();
    setSavedDrawings((prev) => [...prev, { id, name, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), customer }]);
    showToast(`"${name}" saved to Design Studio`);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '80vw', maxWidth: 900, height: '75vh', background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fade-up 0.2s ease both' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>Drawing Builder</span>
            <input value={drawName} onChange={(e) => setDrawName(e.target.value)} placeholder="Drawing name..." style={{ padding: '4px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 200 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={saveDrawing} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Drawing</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {[{ id: 'select', l: '⊕ Select' }, { id: 'wall', l: '▬ Wall' }, { id: 'line', l: '— Line' }, { id: 'rect', l: '□ Room' }, { id: 'text', l: 'T Text' }, { id: 'door', l: '◫ Door' }, { id: 'erase', l: '✕ Erase' }].map((t) =>
          <button key={t.id} onClick={() => setDrawTool(t.id)} style={{
            padding: '5px 12px', borderRadius: 5, fontSize: 11,
            background: drawTool === t.id ? 'rgba(63,169,245,0.12)' : 'transparent',
            border: `1px solid ${drawTool === t.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
            color: drawTool === t.id ? 'var(--brand)' : 'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{t.l}</button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => {setLines([]);setTexts([]);}} style={{ padding: '5px 10px', borderRadius: 5, fontSize: 10, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--status-critical)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear All</button>
            <button onClick={() => setLines((prev) => prev.slice(0, -1))} style={{ padding: '5px 10px', borderRadius: 5, fontSize: 10, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Undo</button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, background: 'rgba(5,7,10,0.6)', position: 'relative', overflow: 'hidden' }}>
          <svg ref={canvasRef} width="100%" height="100%" style={{ touchAction: 'none', cursor: drawTool === 'wall' || drawTool === 'line' ? 'crosshair' : drawTool === 'text' ? 'text' : 'default' }}
          onPointerDown={handleCanvasMouseDown}
          onPointerUp={handleCanvasMouseUp}>
            <defs>
              <pattern id="drawGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(63,169,245,0.06)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#drawGrid)" />

            {/* Drawn walls/lines */}
            {lines.map((l, i) =>
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={drawTool === 'erase' ? 'rgba(244,63,94,0.5)' : 'rgba(159,178,200,0.4)'}
            strokeWidth={drawTool === 'line' ? 1 : 2.5}
            style={{ cursor: drawTool === 'erase' ? 'pointer' : 'default' }}
            onClick={() => {if (drawTool === 'erase') setLines((prev) => prev.filter((_, j) => j !== i));}} />
            )}

            {/* Text labels */}
            {texts.map((t, i) =>
            <text key={i} x={t.x} y={t.y} fill="rgba(159,178,200,0.3)" fontSize="13" fontFamily="var(--font-body)" textAnchor="middle"
            style={{ cursor: drawTool === 'erase' ? 'pointer' : 'default' }}
            onClick={() => {if (drawTool === 'erase') setTexts((prev) => prev.filter((_, j) => j !== i));}}>{t.text}</text>
            )}
          </svg>

          {/* Text input overlay */}
          {addingText &&
          <div style={{ position: 'absolute', left: addingText.x, top: addingText.y, zIndex: 10 }}>
              <input autoFocus placeholder="Label..." onKeyDown={(e) => {if (e.key === 'Enter') addText(e.target.value);if (e.key === 'Escape') setAddingText(null);}} onBlur={(e) => addText(e.target.value)} style={{ padding: '3px 8px', background: 'rgba(10,14,20,0.9)', border: '1px solid var(--brand)', borderRadius: 4, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 120 }} />
            </div>
          }

          {/* Saved Drawings sidebar */}
          <div style={{ position: 'absolute', top: 10, right: 10, width: 180, maxHeight: '60%', overflow: 'auto', padding: '8px 10px', background: 'rgba(10,14,20,0.9)', border: '1px solid var(--border-subtle)', borderRadius: 8, backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 6 }}>Saved Drawings</div>
            {savedDrawings.map((d) =>
            <div key={d.id} style={{ padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-high)', fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{d.customer} · {d.date}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}

/* ── Symbol Icon ── */
function SymbolIcon({ type, size = 14, asSvg, x, y, color = 'var(--brand)' }) {
  const icons = {
    'Dome Cam': '◉', 'Bullet Cam': '▸', 'PTZ Cam': '◎', 'Fisheye': '◯', 'LPR Cam': '▣',
    'Card Reader': '◈', 'Keypad': '⊞', 'Door Strike': '⊟', 'Mag Lock': '⊠', 'Controller': '⊡',
    'Motion PIR': '◇', 'Glass Break': '△', 'Door Contact': '▯', 'Siren': '◊', 'Pull Station': '⊕',
    'Smoke Det.': '○', 'Heat Det.': '◑', 'Horn/Strobe': '◐', 'Panel': '□',
    'Display': '▢', 'Speaker': '◖', 'Amplifier': '▧', 'Microphone': '▥', 'Control Pad': '▤',
    'Switch': '⊞', 'AP': '◉', 'UPS': '⊟', 'Patch Panel': '▦', 'NVR': '▣'
  };
  const char = icons[type] || '●';
  if (asSvg) return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size} fontFamily="var(--font-body)">{char}</text>;
  return <span style={{ fontSize: size, color, lineHeight: 1 }}>{char}</span>;
}

Object.assign(window, { StudioScreen, SymbolIcon, DeviceDetailModal, DrawingBuilderModal });
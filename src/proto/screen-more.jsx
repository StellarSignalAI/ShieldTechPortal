/* New Screens — Project Management, Inventory, Reporting, Proposal Builder, Onboarding */

/* ── Project Management (Kanban + Timeline) ── */
function ProjectsScreen() {
  const columns = [
    { id: 'planning', label: 'Planning', color: 'var(--text-low)' },
    { id: 'in-progress', label: 'In Progress', color: 'var(--brand)' },
    { id: 'review', label: 'Review', color: '#c084fc' },
    { id: 'complete', label: 'Complete', color: 'var(--status-ok)' },
  ];
  const projects = [
    { id: 'PRJ-101', name: 'Pacific Rim Hotels — Full Upgrade', customer: 'Pacific Rim Hotels', value: '$215,000', stage: 'in-progress', progress: 35, pm: 'John Mitchell', techs: ['JL','KW'], start: 'May 15', end: 'Aug 30', milestones: [{ label: 'Site survey', done: true }, { label: 'Equipment ordered', done: true }, { label: 'Property 1 install', done: false }, { label: 'Property 2 install', done: false }, { label: 'Property 3 install', done: false }, { label: 'Final commissioning', done: false }] },
    { id: 'PRJ-098', name: 'City Hall — Access Control Upgrade', customer: 'City Hall', value: '$45,000', stage: 'in-progress', progress: 72, pm: 'Sarah Chen', techs: ['KW'], start: 'Apr 20', end: 'Jun 20', milestones: [{ label: 'Demo old system', done: true }, { label: 'Run new cables', done: true }, { label: 'Install readers', done: true }, { label: 'Program controllers', done: false }, { label: 'Testing & handoff', done: false }] },
    { id: 'PRJ-104', name: 'Westfield Mall — Camera Expansion', customer: 'Westfield Mall', value: '$31,800', stage: 'planning', progress: 10, pm: 'John Mitchell', techs: ['MR','TG'], start: 'Jun 15', end: 'Jul 30', milestones: [{ label: 'Design approval', done: true }, { label: 'Equipment PO', done: false }, { label: 'Installation', done: false }, { label: 'Commissioning', done: false }] },
    { id: 'PRJ-095', name: 'Riverside Medical — Fire Panel', customer: 'Riverside Medical', value: '$28,400', stage: 'review', progress: 90, pm: 'Sarah Chen', techs: ['TG'], start: 'Apr 1', end: 'Jun 10', milestones: [{ label: 'Panel swap', done: true }, { label: 'Zone programming', done: true }, { label: 'UL inspection', done: false }, { label: 'Certificate filed', done: false }] },
    { id: 'PRJ-092', name: 'Marina District Dental — 8-Camera', customer: 'Marina Dental', value: '$24,800', stage: 'complete', progress: 100, pm: 'John Mitchell', techs: ['MR'], start: 'May 1', end: 'Jun 2', milestones: [{ label: 'Install', done: true }, { label: 'Configure', done: true }, { label: 'Customer sign-off', done: true }] },
    { id: 'PRJ-105', name: 'Golden Gate Logistics — Perimeter', customer: 'Golden Gate', value: '$52,000', stage: 'planning', progress: 5, pm: 'Sarah Chen', techs: [], start: 'Jul 1', end: 'Aug 15', milestones: [{ label: 'Site survey', done: false }, { label: 'Design', done: false }, { label: 'Install', done: false }] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 100px)' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {[
          { label: 'Active Projects', value: '4', color: 'var(--brand)' },
          { label: 'Total Value', value: '$396K', color: 'var(--text-high)' },
          { label: 'On Schedule', value: '3', color: 'var(--status-ok)' },
          { label: 'At Risk', value: '1', color: 'var(--status-warn)' },
          { label: 'Avg Margin', value: '31%', color: 'var(--status-ok)' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '10px 14px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'auto' }}>
        {columns.map(col => {
          const colProjects = projects.filter(p => p.stage === col.id);
          return (
            <div key={col.id} style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{colProjects.length}</span>
              </div>
              {colProjects.map(p => (
                <div key={p.id} className="glass" style={{ padding: 14, cursor: 'pointer' }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--brand)', marginBottom: 4 }}>{p.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8 }}>{p.customer}</div>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(63,169,245,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${p.progress}%`, height: '100%', background: col.color, borderRadius: 2 }} />
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.progress}%</span>
                  </div>
                  {/* Milestones mini */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                    {p.milestones.map((m, mi) => (
                      <div key={mi} style={{ width: 8, height: 8, borderRadius: 2, background: m.done ? 'var(--status-ok)' : 'rgba(63,169,245,0.08)', border: m.done ? 'none' : '1px solid var(--border-subtle)' }} title={m.label} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.value}</span>
                    <div style={{ display: 'flex', gap: -4 }}>
                      {p.techs.map((t, ti) => (
                        <div key={ti} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', border: '1px solid var(--card)', marginLeft: ti > 0 ? -4 : 0 }}>{t}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 6 }}>{p.start} → {p.end}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Inventory Management V2 — D-Tools Killer ── */
function InventoryScreen() {
  const [tab, setTab] = React.useState('warehouse');
  const [search, setSearch] = React.useState('');
  const [brandFilter, setBrandFilter] = React.useState('all');
  const [catFilter, setCatFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('name');
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [newItemModal, setNewItemModal] = React.useState(false);
  const [transferModal, setTransferModal] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const brands = [
    { id: 'axis', name: 'Axis Communications' },
    { id: 'hanwha', name: 'Hanwha Vision' },
    { id: 'verkada', name: 'Verkada' },
    { id: 'hid', name: 'HID Global' },
    { id: 'mercury', name: 'Mercury Security' },
    { id: 'dsc', name: 'DSC (Johnson Controls)' },
    { id: 'honeywell', name: 'Honeywell' },
    { id: 'bosch', name: 'Bosch Security' },
    { id: 'ubiquiti', name: 'Ubiquiti' },
    { id: 'apc', name: 'APC (Schneider)' },
    { id: 'altronix', name: 'Altronix' },
    { id: 'commscope', name: 'CommScope' },
    { id: 'leviton', name: 'Leviton' },
  ];

  const [warehouse, setWarehouse] = React.useState([
    { sku: 'CAM-AX-P3265V', name: 'Axis P3265-V Dome Camera', brand: 'axis', cat: 'Camera', subcat: 'Dome', inStock: 12, committed: 4, available: 8, reorder: 5, cost: 620, msrp: 890, location: 'Shelf A-3', lastOrdered: 'May 15, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: 'Primary dome camera — high volume' },
    { sku: 'CAM-AX-P3268', name: 'Axis P3268-LV 4K Camera', brand: 'axis', cat: 'Camera', subcat: 'Dome', inStock: 8, committed: 2, available: 6, reorder: 4, cost: 870, msrp: 1240, location: 'Shelf A-4', lastOrdered: 'May 20, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: '4K upgrade path' },
    { sku: 'CAM-AX-Q6135', name: 'Axis Q6135-LE PTZ Camera', brand: 'axis', cat: 'Camera', subcat: 'PTZ', inStock: 2, committed: 1, available: 1, reorder: 1, cost: 3400, msrp: 4800, location: 'Shelf A-5', lastOrdered: 'Apr 10, 2026', vendor: 'ADI Global', leadTime: '7-10 days', notes: 'High-value, order per project' },
    { sku: 'CAM-HW-QNO8080', name: 'Hanwha QNO-8080R Bullet', brand: 'hanwha', cat: 'Camera', subcat: 'Bullet', inStock: 6, committed: 0, available: 6, reorder: 3, cost: 480, msrp: 680, location: 'Shelf A-6', lastOrdered: 'May 22, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: '' },
    { sku: 'CAM-VK-CD52', name: 'Verkada CD52 Indoor', brand: 'verkada', cat: 'Camera', subcat: 'Dome', inStock: 0, committed: 2, available: -2, reorder: 4, cost: 880, msrp: 1100, location: '—', lastOrdered: 'Jun 1, 2026', vendor: 'Verkada Direct', leadTime: '5-7 days', notes: 'Cloud-managed, need license' },
    { sku: 'NVR-HW-6410', name: 'Hanwha XNR-6410 32ch NVR', brand: 'hanwha', cat: 'NVR', subcat: 'Recorder', inStock: 4, committed: 1, available: 3, reorder: 2, cost: 1960, msrp: 2800, location: 'Shelf B-1', lastOrdered: 'May 18, 2026', vendor: 'ADI Global', leadTime: '5-7 days', notes: '' },
    { sku: 'NVR-HW-6420', name: 'Hanwha XNR-6420 64ch NVR', brand: 'hanwha', cat: 'NVR', subcat: 'Recorder', inStock: 2, committed: 0, available: 2, reorder: 1, cost: 2940, msrp: 4200, location: 'Shelf B-2', lastOrdered: 'Apr 5, 2026', vendor: 'ADI Global', leadTime: '7-10 days', notes: '' },
    { sku: 'ACR-HID-RK40', name: 'HID iCLASS SE RK40 Reader', brand: 'hid', cat: 'Access', subcat: 'Reader', inStock: 18, committed: 6, available: 12, reorder: 8, cost: 340, msrp: 485, location: 'Shelf C-2', lastOrdered: 'May 25, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: 'Standard reader — always stock' },
    { sku: 'ACR-HID-SIG40', name: 'HID Signo Reader 40', brand: 'hid', cat: 'Access', subcat: 'Reader', inStock: 6, committed: 2, available: 4, reorder: 3, cost: 435, msrp: 620, location: 'Shelf C-3', lastOrdered: 'May 10, 2026', vendor: 'ADI Global', leadTime: '5-7 days', notes: 'Mobile-ready upgrade' },
    { sku: 'ACP-MRC-4502', name: 'Mercury LP4502 Panel', brand: 'mercury', cat: 'Access', subcat: 'Controller', inStock: 3, committed: 1, available: 2, reorder: 2, cost: 1300, msrp: 1850, location: 'Shelf C-5', lastOrdered: 'Apr 22, 2026', vendor: 'ADI Global', leadTime: '5-7 days', notes: '' },
    { sku: 'IDS-DSC-NEO64', name: 'DSC PowerSeries Neo HS2064', brand: 'dsc', cat: 'Intrusion', subcat: 'Panel', inStock: 5, committed: 0, available: 5, reorder: 2, cost: 480, msrp: 680, location: 'Shelf C-4', lastOrdered: 'May 1, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: '' },
    { sku: 'IDS-DSC-PIR', name: 'DSC PG9914 PIR Motion', brand: 'dsc', cat: 'Intrusion', subcat: 'Motion Sensor', inStock: 30, committed: 5, available: 25, reorder: 10, cost: 67, msrp: 95, location: 'Shelf C-6', lastOrdered: 'May 28, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: 'PowerG wireless' },
    { sku: 'NET-UB-USW24', name: 'Ubiquiti USW-Pro-24-PoE', brand: 'ubiquiti', cat: 'Network', subcat: 'Switch', inStock: 5, committed: 2, available: 3, reorder: 2, cost: 580, msrp: 699, location: 'Shelf D-1', lastOrdered: 'May 20, 2026', vendor: 'Ubiquiti Direct', leadTime: '3-5 days', notes: '' },
    { sku: 'NET-UB-UAP', name: 'Ubiquiti UniFi AP AC Pro', brand: 'ubiquiti', cat: 'Network', subcat: 'Access Point', inStock: 10, committed: 0, available: 10, reorder: 5, cost: 145, msrp: 180, location: 'Shelf D-3', lastOrdered: 'May 15, 2026', vendor: 'Ubiquiti Direct', leadTime: '3-5 days', notes: '' },
    { sku: 'PWR-APC-1500', name: 'APC Smart-UPS 1500VA', brand: 'apc', cat: 'Power', subcat: 'UPS', inStock: 7, committed: 1, available: 6, reorder: 3, cost: 540, msrp: 740, location: 'Shelf D-5', lastOrdered: 'Apr 30, 2026', vendor: 'Anixter', leadTime: '5-7 days', notes: '' },
    { sku: 'PWR-ALT-400', name: 'Altronix AL400ULACM', brand: 'altronix', cat: 'Power', subcat: 'Power Supply', inStock: 8, committed: 0, available: 8, reorder: 4, cost: 195, msrp: 280, location: 'Shelf D-6', lastOrdered: 'May 5, 2026', vendor: 'ADI Global', leadTime: '3-5 days', notes: '' },
    { sku: 'CBL-CS-C6A', name: 'CommScope Cat6A Plenum 1000ft', brand: 'commscope', cat: 'Cabling', subcat: 'Cable', inStock: 24, committed: 3, available: 21, reorder: 10, cost: 310, msrp: 420, location: 'Rack E', lastOrdered: 'May 25, 2026', vendor: 'Anixter', leadTime: '2-3 days', notes: 'High volume — keep stocked' },
    { sku: 'CBL-CS-C6', name: 'CommScope Cat6 Plenum 1000ft', brand: 'commscope', cat: 'Cabling', subcat: 'Cable', inStock: 30, committed: 5, available: 25, reorder: 10, cost: 200, msrp: 280, location: 'Rack E', lastOrdered: 'May 28, 2026', vendor: 'Anixter', leadTime: '2-3 days', notes: '' },
    { sku: 'CBL-LV-PP48', name: 'Leviton 48-port Cat6A Patch Panel', brand: 'leviton', cat: 'Cabling', subcat: 'Patch Panel', inStock: 6, committed: 0, available: 6, reorder: 3, cost: 130, msrp: 180, location: 'Shelf E-2', lastOrdered: 'May 10, 2026', vendor: 'Anixter', leadTime: '3-5 days', notes: '' },
  ]);

  const trucks = [
    { id: 'V-12', tech: 'Mike Reyes', items: [
      { sku: 'CAM-AX-P3265V', name: 'Axis P3265-V', qty: 4 },
      { sku: 'ACR-HID-RK40', name: 'HID iCLASS SE RK40', qty: 2 },
      { sku: 'CBL-CS-C6A', name: 'Cat6A Cable', qty: 1 },
      { sku: 'NET-UB-USW24', name: 'Ubiquiti Switch', qty: 1 },
    ], value: 8420, capacity: 94 },
    { id: 'V-08', tech: 'Jessica Liu', items: [
      { sku: 'CAM-HW-QNO8080', name: 'Hanwha QNO-8080R', qty: 3 },
      { sku: 'NVR-HW-6410', name: 'Hanwha NVR', qty: 1 },
      { sku: 'CBL-CS-C6', name: 'Cat6 Cable', qty: 2 },
    ], value: 6850, capacity: 78 },
    { id: 'V-15', tech: 'Kevin White', items: [
      { sku: 'ACR-HID-SIG40', name: 'HID Signo 40', qty: 4 },
      { sku: 'ACP-MRC-4502', name: 'Mercury LP4502', qty: 1 },
      { sku: 'IDS-DSC-NEO64', name: 'DSC Neo Panel', qty: 1 },
    ], value: 7200, capacity: 85 },
    { id: 'V-03', tech: 'Diana Patel', items: [
      { sku: 'IDS-DSC-PIR', name: 'DSC PIR Motion', qty: 8 },
      { sku: 'PWR-ALT-400', name: 'Altronix PS', qty: 2 },
    ], value: 4100, capacity: 62 },
    { id: 'V-21', tech: 'Tony Garcia', items: [
      { sku: 'CAM-AX-P3268', name: 'Axis P3268-LV', qty: 3 },
      { sku: 'NET-UB-UAP', name: 'UniFi AP', qty: 4 },
      { sku: 'PWR-APC-1500', name: 'APC UPS', qty: 1 },
    ], value: 7800, capacity: 91 },
  ];

  const categories = [...new Set(warehouse.map(i => i.cat))];
  const totalValue = warehouse.reduce((s, i) => s + i.msrp * i.inStock, 0);
  const totalCost = warehouse.reduce((s, i) => s + i.cost * i.inStock, 0);
  const lowStock = warehouse.filter(i => i.available <= i.reorder);
  const outOfStock = warehouse.filter(i => i.available <= 0);

  const filtered = warehouse.filter(item => {
    if (search) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q) && !item.brand.toLowerCase().includes(q) && !item.subcat.toLowerCase().includes(q) && !item.cat.toLowerCase().includes(q) && !(brands.find(b=>b.id===item.brand)?.name||'').toLowerCase().includes(q)) return false;
    }
    if (brandFilter !== 'all' && item.brand !== brandFilter) return false;
    if (catFilter !== 'all' && item.cat !== catFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'stock') return a.available - b.available;
    if (sortBy === 'value') return (b.msrp * b.inStock) - (a.msrp * a.inStock);
    if (sortBy === 'brand') return a.brand.localeCompare(b.brand);
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'TOTAL VALUE (MSRP)', value: `$${(totalValue/1000).toFixed(0)}K`, color: 'var(--text-high)' },
          { label: 'TOTAL COST', value: `$${(totalCost/1000).toFixed(0)}K`, color: 'var(--brand)' },
          { label: 'SKUs TRACKED', value: warehouse.length, color: 'var(--brand)' },
          { label: 'LOW STOCK', value: lowStock.length, color: lowStock.length > 3 ? 'var(--status-critical)' : 'var(--status-warn)' },
          { label: 'OUT OF STOCK', value: outOfStock.length, color: outOfStock.length > 0 ? 'var(--status-critical)' : 'var(--status-ok)' },
          { label: 'TRUCKS', value: trucks.length, color: 'var(--status-ok)' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '10px 14px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar + Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{id:'warehouse',l:'Warehouse'},{id:'trucks',l:'Truck Stock'},{id:'orders',l:'Purchase Orders'},{id:'transfers',l:'Transfers'},{id:'audit',l:'Audit Log'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: tab===t.id?600:400,
              background: tab===t.id?'rgba(63,169,245,0.12)':'transparent',
              border: `1px solid ${tab===t.id?'var(--brand)':'var(--border-subtle)'}`,
              color: tab===t.id?'var(--brand)':'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{t.l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setNewItemModal(true)} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Item</button>
          <button onClick={() => showToast('PO created')} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create PO</button>
          <button onClick={() => showToast('Inventory exported')} style={{ padding: '5px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export</button>
        </div>
      </div>

      {tab === 'warehouse' && (
        <>
          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands, devices, SKUs, models, categories..." style={{ flex: 2, padding: '7px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ padding: '7px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '7px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
              <option value="name">Sort: Name</option>
              <option value="stock">Sort: Stock (low first)</option>
              <option value="value">Sort: Value (high first)</option>
              <option value="brand">Sort: Brand</option>
            </select>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{filtered.length} items · Click any row for details</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
            {/* Main Table */}
            <GlassPanel style={{ padding: 0 }}>
              <div style={{ overflow: 'auto', maxHeight: 420 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['SKU','Item','Brand','Cat','In Stock','Committed','Available','Reorder','Cost','MSRP','Location'].map((h, i) => (
                        <th key={i} style={{ textAlign: i >= 4 ? 'right' : 'left', padding: '7px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'var(--card)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => {
                      const brandName = brands.find(b => b.id === item.brand)?.name || item.brand;
                      const isSel = selectedItem?.sku === item.sku;
                      return (
                        <tr key={i} onClick={() => setSelectedItem(isSel ? null : item)} style={{ cursor: 'pointer', background: isSel ? 'rgba(63,169,245,0.06)' : 'transparent', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='rgba(63,169,245,0.03)'; }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent'; }}>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 9, color: 'var(--brand)' }}>{item.sku}</td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, fontWeight: 500 }}>{item.name}</td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-mid)' }}>{brandName}</td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{item.cat}</td>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right' }}>{item.inStock}</td>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>{item.committed}</td>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', fontWeight: 600, color: item.available <= 0 ? 'var(--status-critical)' : item.available <= item.reorder ? 'var(--status-warn)' : 'var(--text-high)' }}>{item.available}</td>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, textAlign: 'right', color: 'var(--text-low)' }}>{item.reorder}</td>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, textAlign: 'right', color: 'var(--text-low)' }}>${item.cost}</td>
                          <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, textAlign: 'right', fontWeight: 500 }}>${item.msrp}</td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 9, color: 'var(--text-low)' }}>{item.location}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassPanel>

            {/* Right Panel — Detail or Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedItem ? (
                <GlassPanel style={{ borderLeft: '3px solid var(--brand)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedItem.name}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{selectedItem.sku}</div>
                    </div>
                    <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { l: 'Brand', v: brands.find(b=>b.id===selectedItem.brand)?.name },
                      { l: 'Category', v: `${selectedItem.cat} — ${selectedItem.subcat}` },
                      { l: 'In Stock', v: selectedItem.inStock },
                      { l: 'Available', v: selectedItem.available, c: selectedItem.available <= 0 ? 'var(--status-critical)' : selectedItem.available <= selectedItem.reorder ? 'var(--status-warn)' : 'var(--status-ok)' },
                      { l: 'Cost', v: `$${selectedItem.cost}` },
                      { l: 'MSRP', v: `$${selectedItem.msrp}` },
                      { l: 'Margin', v: `${((1 - selectedItem.cost/selectedItem.msrp)*100).toFixed(0)}%`, c: 'var(--status-ok)' },
                      { l: 'Location', v: selectedItem.location },
                      { l: 'Vendor', v: selectedItem.vendor },
                      { l: 'Lead Time', v: selectedItem.leadTime },
                      { l: 'Last Ordered', v: selectedItem.lastOrdered },
                      { l: 'Reorder Point', v: selectedItem.reorder },
                    ].map((f, i) => (
                      <div key={i}><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{f.l}</div><div className="mono" style={{ fontSize: 12, fontWeight: 500, color: f.c || 'var(--text-high)' }}>{f.v}</div></div>
                    ))}
                  </div>
                  {selectedItem.notes && <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 10, padding: '6px 8px', background: 'rgba(63,169,245,0.03)', borderRadius: 4 }}>{selectedItem.notes}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button onClick={() => showToast(`PO created for ${selectedItem.name}`)} style={{ width: '100%', padding: '6px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reorder Now</button>
                    <button onClick={() => setTransferModal(selectedItem)} style={{ width: '100%', padding: '6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Transfer to Truck</button>
                    <button onClick={() => showToast('Price history loaded')} style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Price History</button>
                    <button onClick={() => showToast('Spec sheet downloaded')} style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Download Spec Sheet</button>
                  </div>
                </GlassPanel>
              ) : (
                <>
                  {/* Reorder Alerts */}
                  <GlassPanel style={{ borderLeft: '3px solid var(--status-warn)' }}>
                    <SectionHeader title="Reorder Alerts" icon="warning-tri" count={lowStock.length} />
                    {lowStock.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                        <StatusDot status={item.available <= 0 ? 'critical' : 'warning'} size={5} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 500 }}>{item.name}</div>
                          <div className="mono" style={{ fontSize: 9, color: item.available <= 0 ? 'var(--status-critical)' : 'var(--status-warn)' }}>
                            {item.available <= 0 ? 'OUT OF STOCK' : `${item.available} left (reorder at ${item.reorder})`}
                          </div>
                        </div>
                        <button onClick={() => showToast(`PO created for ${item.name}`)} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Order</button>
                      </div>
                    ))}
                  </GlassPanel>

                  {/* AI suggestion */}
                  <GlassPanel style={{ borderLeft: '3px solid var(--brand)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span>⟡</span><span style={{ fontSize: 11, fontWeight: 500, color: 'var(--brand)' }}>Hermes Inventory AI</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                      Verkada CD52 is out of stock with 2 committed. Auto-PO recommended. Axis P3265-V usage is 3.2/week — consider increasing reorder from 5 to 8.
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <button onClick={() => showToast('Auto-PO created for Verkada CD52')} style={{ padding: '4px 10px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Auto-Order</button>
                      <button onClick={() => showToast('Reorder point updated')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Update Reorders</button>
                    </div>
                  </GlassPanel>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Truck Stock Tab */}
      {tab === 'trucks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {trucks.map((truck, i) => (
            <GlassPanel key={i} style={{ borderLeft: '3px solid var(--brand)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{truck.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{truck.tech}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{truck.items.reduce((s,i) => s+i.qty, 0)} items · ${truck.value.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: 50, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', marginBottom: 2 }}>
                    <div style={{ width: `${truck.capacity}%`, height: '100%', borderRadius: 2, background: truck.capacity > 80 ? 'var(--status-ok)' : truck.capacity > 60 ? 'var(--status-warn)' : 'var(--status-critical)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{truck.capacity}% stocked</span>
                </div>
              </div>
              {truck.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-mid)' }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="mono" style={{ color: 'var(--text-low)', fontSize: 10 }}>{item.sku}</span>
                    <span className="mono" style={{ fontWeight: 500, width: 20, textAlign: 'right' }}>{item.qty}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button onClick={() => showToast(`Restocking ${truck.tech}'s truck`)} style={{ flex: 1, padding: '5px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Restock</button>
                <button onClick={() => showToast('Audit started')} style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Audit</button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {tab === 'orders' && (
        <GlassPanel style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <SectionHeader title="Purchase Orders" icon="clipboard" />
            <button onClick={() => showToast('New PO created')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New PO</button>
          </div>
          {[
            { id: 'PO-1024', vendor: 'ADI Global', items: 8, total: '$12,420', status: 'Ordered', date: 'Jun 5', eta: 'Jun 10' },
            { id: 'PO-1023', vendor: 'Verkada Direct', items: 4, total: '$4,400', status: 'In Transit', date: 'Jun 2', eta: 'Jun 8' },
            { id: 'PO-1022', vendor: 'Ubiquiti Direct', items: 6, total: '$3,240', status: 'Received', date: 'May 28', eta: '—' },
            { id: 'PO-1021', vendor: 'Anixter', items: 12, total: '$8,800', status: 'Received', date: 'May 22', eta: '—' },
            { id: 'PO-1020', vendor: 'ADI Global', items: 15, total: '$18,600', status: 'Received', date: 'May 15', eta: '—' },
          ].map((po, i) => (
            <div key={i} onClick={() => showToast(`Viewing PO ${po.id}`)} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(63,169,245,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, width: 80 }}>{po.id}</span>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{po.vendor}</span>
              <span style={{ fontSize: 11, color: 'var(--text-low)', width: 60 }}>{po.items} items</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, width: 80, textAlign: 'right' }}>{po.total}</span>
              <StatusBadge status={po.status==='Received'?'online':po.status==='In Transit'?'info':'warning'} label={po.status} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 60, textAlign: 'right' }}>{po.date}</span>
              {po.eta !== '—' && <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 70, textAlign: 'right' }}>ETA: {po.eta}</span>}
            </div>
          ))}
        </GlassPanel>
      )}

      {/* Transfers Tab */}
      {tab === 'transfers' && (
        <GlassPanel style={{ padding: 16 }}>
          <SectionHeader title="Recent Transfers" icon="⇄" />
          {[
            { from: 'Warehouse', to: 'V-12 (Mike Reyes)', items: 'Axis P3265-V ×4, HID RK40 ×2', date: 'Jun 5', status: 'Complete' },
            { from: 'V-08 (Jessica Liu)', to: 'Warehouse', items: 'Hanwha QNO-8080R ×1 (return)', date: 'Jun 4', status: 'Complete' },
            { from: 'Warehouse', to: 'V-15 (Kevin White)', items: 'Mercury LP4502 ×1, DSC Neo ×1', date: 'Jun 3', status: 'Complete' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{t.from} → {t.to}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.items}</div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.date}</span>
              <StatusBadge status="online" label={t.status} />
            </div>
          ))}
        </GlassPanel>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <GlassPanel style={{ padding: 16 }}>
          <SectionHeader title="Inventory Audit Log" icon="◔" />
          {[
            { action: 'Stock received', detail: 'PO-1023: Verkada CD52 ×4 added to warehouse', user: 'System', time: '2:14 PM' },
            { action: 'Transfer out', detail: 'Axis P3265-V ×4 → V-12 (Mike Reyes)', user: 'Admin', time: '10:30 AM' },
            { action: 'Adjustment', detail: 'DSC PIR count corrected: 32 → 30 (damaged)', user: 'Tony Garcia', time: '9:15 AM' },
            { action: 'PO created', detail: 'PO-1024: ADI Global — 8 items, $12,420', user: 'Admin', time: 'Yesterday' },
            { action: 'Reorder alert', detail: 'Verkada CD52 dropped below reorder point (0 avail)', user: 'System', time: 'Yesterday' },
          ].map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <StatusDot status={log.action.includes('alert') ? 'warning' : log.action.includes('Adjustment') ? 'info' : 'online'} size={5} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{log.action}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{log.detail}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{log.user}</span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{log.time}</span>
            </div>
          ))}
        </GlassPanel>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <div onClick={() => setTransferModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 400, padding: 24, animation: 'fade-up 0.15s ease both' }}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>Transfer: {transferModal.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><div className="label-sm" style={{ marginBottom: 4 }}>Destination</div>
                <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.id} — {t.tech}</option>)}
                </select>
              </div>
              <div><div className="label-sm" style={{ marginBottom: 4 }}>Quantity (available: {transferModal.available})</div>
                <input type="number" defaultValue={1} min={1} max={transferModal.available} style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setTransferModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { showToast(`Transferred ${transferModal.name}`); setTransferModal(null); }} style={{ padding: '8px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Reporting / BI Dashboard ── */
function ReportsScreen() {
  const [period, setPeriod] = React.useState('This Month');
  const KPIS_BY_PERIOD = {
    'This Month': [
      { label: 'Revenue (MTD)', value: '$284,600', trend: '+8.2%', up: true },
      { label: 'Gross Profit', value: '$80,700', trend: '+11.4%', up: true },
      { label: 'Jobs Completed', value: '47', trend: '+5', up: true },
      { label: 'Avg Ticket', value: '$6,055', trend: '-2.1%', up: false },
      { label: 'First-Time Fix', value: '87%', trend: '+3%', up: true },
      { label: 'Customer NPS', value: '74', trend: '+2', up: true },
    ],
    'Last Month': [
      { label: 'Revenue', value: '$262,900', trend: '+4.1%', up: true },
      { label: 'Gross Profit', value: '$72,400', trend: '+6.8%', up: true },
      { label: 'Jobs Completed', value: '42', trend: '+2', up: true },
      { label: 'Avg Ticket', value: '$6,259', trend: '+1.4%', up: true },
      { label: 'First-Time Fix', value: '84%', trend: '-1%', up: false },
      { label: 'Customer NPS', value: '72', trend: '+1', up: true },
    ],
    'This Quarter': [
      { label: 'Revenue (QTD)', value: '$812,300', trend: '+9.6%', up: true },
      { label: 'Gross Profit', value: '$231,500', trend: '+12.1%', up: true },
      { label: 'Jobs Completed', value: '138', trend: '+18', up: true },
      { label: 'Avg Ticket', value: '$5,886', trend: '-3.0%', up: false },
      { label: 'First-Time Fix', value: '86%', trend: '+2%', up: true },
      { label: 'Customer NPS', value: '73', trend: '+3', up: true },
    ],
    'YTD': [
      { label: 'Revenue (YTD)', value: '$1.25M', trend: '+14.2%', up: true },
      { label: 'Gross Profit', value: '$354,800', trend: '+15.7%', up: true },
      { label: 'Jobs Completed', value: '274', trend: '+41', up: true },
      { label: 'Avg Ticket', value: '$4,562', trend: '+2.2%', up: true },
      { label: 'First-Time Fix', value: '85%', trend: '+4%', up: true },
      { label: 'Customer NPS', value: '71', trend: '+6', up: true },
    ],
  };
  const kpis = KPIS_BY_PERIOD[period];

  const openLeadSource = (l) => shieldModal({
    kind: 'detail', title: l.source, subtitle: `${period} · ${l.won}/${l.leads} won · ${l.revenue} revenue`,
    badge: { status: parseInt(l.cac.replace(/\D/g,'')) < 200 ? 'online' : 'warning', label: 'CAC ' + l.cac },
    sections: [
      { label: 'Funnel', rows: [
        { k: 'Leads', v: l.leads }, { k: 'Won', v: l.won, color: 'var(--status-ok)' },
        { k: 'Win Rate', v: Math.round((l.won / l.leads) * 100) + '%' }, { k: 'Revenue', v: l.revenue },
        { k: 'Cost / Acquisition', v: l.cac, color: parseInt(l.cac.replace(/\D/g,'')) < 200 ? 'var(--status-ok)' : 'var(--status-warn)' },
      ]},
      { label: 'Conversion', meters: [{ label: 'Lead → Won', value: Math.round((l.won / l.leads) * 100), max: 100 }] },
    ],
    actions: [
      { label: 'Export', onClick: () => shieldToast('Exported ' + l.source + ' breakdown', 'ok'), close: true },
      { label: 'View Leads', primary: true, successMsg: 'Opening ' + l.leads + ' leads from ' + l.source, onClick: () => {} },
    ],
  });

  const revByCategory = [
    { cat: 'Installations', value: 142000, pct: 50 },
    { cat: 'Service / Repair', value: 62000, pct: 22 },
    { cat: 'Recurring (RMR)', value: 51000, pct: 18 },
    { cat: 'Maintenance', value: 29600, pct: 10 },
  ];

  const leadSources = [
    { source: 'Referral', leads: 18, won: 12, revenue: '$186K', cac: '$42' },
    { source: 'Website', leads: 24, won: 8, revenue: '$94K', cac: '$128' },
    { source: 'LinkedIn', leads: 9, won: 3, revenue: '$67K', cac: '$310' },
    { source: 'Trade Show', leads: 6, won: 1, revenue: '$38K', cac: '$820' },
    { source: 'Cold Call', leads: 15, won: 4, revenue: '$52K', cac: '$185' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Business Intelligence</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['This Month','Last Month','This Quarter','YTD'].map((p, i) => (
            <button key={i} onClick={() => setPeriod(p)} style={{ padding: '5px 12px', fontSize: 11, borderRadius: 6, background: period === p ? 'rgba(63,169,245,0.1)' : 'transparent', border: '1px solid var(--border-subtle)', color: period === p ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 10 }}>
        {kpis.map((k, i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '12px 14px', animation: `fade-up 0.4s ease ${i * 60}ms both` }}>
            <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{k.value}</div>
            <span style={{ fontSize: 11, color: k.up ? 'var(--status-ok)' : 'var(--status-critical)' }}>{k.up ? '↑' : '↓'} {k.trend}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Revenue by Category */}
        <GlassPanel>
          <SectionHeader title="Revenue by Category" icon="reports" />
          {revByCategory.map((r, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{r.cat}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>${(r.value / 1000).toFixed(0)}K <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>({r.pct}%)</span></span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', borderRadius: 3, background: i === 0 ? 'var(--brand)' : i === 1 ? 'var(--status-warn)' : i === 2 ? 'var(--status-ok)' : '#c084fc' }} />
              </div>
            </div>
          ))}
        </GlassPanel>

        {/* Lead Source ROI */}
        <GlassPanel>
          <SectionHeader title="Lead Source ROI" icon="flag" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Source','Leads','Won','Revenue','CAC'].map((h, i) => (
                  <th key={i} style={{ textAlign: i > 0 ? 'right' : 'left', padding: '6px 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leadSources.map((l, i) => (
                <tr key={i} onClick={() => openLeadSource(l)} className="st-clickrow">
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{l.source}</td>
                  <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>{l.leads}</td>
                  <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: 'var(--status-ok)' }}>{l.won}</td>
                  <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 500 }}>{l.revenue}</td>
                  <td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: parseInt(l.cac.replace(/\D/g,'')) < 200 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{l.cac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      </div>

      {/* Hermes AI insight */}
      <GlassPanel style={{ borderLeft: '3px solid var(--brand)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>⟡</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Hermes Business Insight</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.55 }}>
          Referrals generate <strong>3.4x more revenue per dollar spent</strong> than trade shows ($186K at $42 CAC vs $38K at $820 CAC). Consider reallocating 40% of the trade show budget to a structured referral incentive program. Estimated additional revenue: $62K/quarter.
        </p>
      </GlassPanel>
    </div>
  );
}

Object.assign(window, { ProjectsScreen, InventoryScreen, ReportsScreen });

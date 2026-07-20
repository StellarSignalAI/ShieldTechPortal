/* Product Library — Integrated Product Library (D-Tools-class)
   A robust, searchable catalog: brand directory, dealer/MSRP/MAP pricing tiers,
   stock, lead time, spec sheets, datasheets, accessories — shared on window
   so Design Studio and Proposal Builder both consume it. */

/* ── Brand directory (catalog feeds + sync status) ── */
const PL_BRANDS = [
  { id: 'axis', name: 'Axis Communications', country: 'Sweden', cats: ['Cameras', 'NVR', 'Encoders', 'Analytics'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'hanwha', name: 'Hanwha Vision', country: 'South Korea', cats: ['Cameras', 'NVR', 'Analytics'], sync: 'live', skus: 0, tier: 'Gold Partner' },
  { id: 'verkada', name: 'Verkada', country: 'USA', cats: ['Cameras', 'Access', 'Sensors'], sync: 'live', skus: 0, tier: 'Certified' },
  { id: 'bosch', name: 'Bosch Security', country: 'Germany', cats: ['Cameras', 'Intrusion', 'Fire'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'avigilon', name: 'Avigilon', country: 'Canada', cats: ['Cameras', 'NVR', 'Access'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'hikvision', name: 'Hikvision', country: 'China', cats: ['Cameras', 'NVR'], sync: 'manual', skus: 0, tier: 'Reseller' },
  { id: 'hid', name: 'HID Global', country: 'USA', cats: ['Access', 'Credentials'], sync: 'live', skus: 0, tier: 'Platinum' },
  { id: 'mercury', name: 'Mercury Security', country: 'USA', cats: ['Access'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'lenel', name: 'LenelS2', country: 'USA', cats: ['Access'], sync: 'manual', skus: 0, tier: 'VAR' },
  { id: 'dsc', name: 'DSC (Tyco)', country: 'Canada', cats: ['Intrusion'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'honeywell', name: 'Honeywell', country: 'USA', cats: ['Intrusion', 'Fire', 'Access'], sync: 'live', skus: 0, tier: 'Distributor' },
  { id: 'ubiquiti', name: 'Ubiquiti', country: 'USA', cats: ['Network'], sync: 'live', skus: 0, tier: 'Reseller' },
  { id: 'cisco', name: 'Cisco Meraki', country: 'USA', cats: ['Network'], sync: 'live', skus: 0, tier: 'Select' },
  { id: 'apc', name: 'APC by Schneider', country: 'USA', cats: ['Power'], sync: 'live', skus: 0, tier: 'Distributor' },
  { id: 'altronix', name: 'Altronix', country: 'USA', cats: ['Power'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'middle', name: 'Middle Atlantic', country: 'USA', cats: ['Racks', 'Power'], sync: 'live', skus: 0, tier: 'Authorized' },
  { id: 'commscope', name: 'CommScope', country: 'USA', cats: ['Cabling'], sync: 'live', skus: 0, tier: 'Distributor' },
  { id: 'panduit', name: 'Panduit', country: 'USA', cats: ['Cabling', 'Racks'], sync: 'manual', skus: 0, tier: 'Reseller' },
];

const PL_CAT_META = {
  'Cameras':     { icon: 'cam-dome',    color: 'var(--brand)' },
  'NVR':         { icon: 'server',      color: 'var(--status-ok)' },
  'Access':      { icon: 'reader',      color: '#c084fc' },
  'Intrusion':   { icon: 'alarm',       color: 'var(--status-warn)' },
  'Fire':        { icon: 'fire-panel',  color: 'var(--status-critical)' },
  'Network':     { icon: 'switch',      color: 'var(--status-ok)' },
  'Power':       { icon: 'ups',         color: '#f59e0b' },
  'Cabling':     { icon: 'cable',       color: 'var(--text-low)' },
  'Racks':       { icon: 'inventory',   color: '#9fb2c8' },
  'Credentials': { icon: 'credential',  color: '#c084fc' },
  'Sensors':     { icon: 'alarm',       color: '#34d399' },
  'Encoders':    { icon: 'server',      color: 'var(--brand)' },
  'Analytics':   { icon: 'reports',     color: '#a78bfa' },
};

/* ── Catalog generator — expands real model lines into a deep SKU list ── */
const PL_SEEDS = [
  // brand, cat, subcat, baseName, baseMsrp, [variant suffixes w/ price multipliers], specBlurb
  ['axis', 'Cameras', 'Dome', 'AXIS P32', 890, [['65-V', 1, '2MP'], ['68-LV', 1.4, '4K'], ['67-LVE', 1.25, '5MP'], ['75-LVE', 1.7, '4K']], 'Lightfinder 2.0, WDR Forensic Capture, IR, OptimizedIR'],
  ['axis', 'Cameras', 'Bullet', 'AXIS P14', 760, [['65-LE', 1, '2MP'], ['67-LE', 1.3, '5MP'], ['68-LVE', 1.6, '4K']], 'OptimizedIR, WDR, IK10 vandal-resistant'],
  ['axis', 'Cameras', 'PTZ', 'AXIS Q61', 4800, [['35-LE', 1, '2MP'], ['54-LE', 1.4, '4MP'], ['78', 2.1, '4K']], '32x optical zoom, Autotracking 2, OptimizedIR 200m'],
  ['axis', 'NVR', 'Recorder', 'AXIS S30', 2200, [['08', 1, '8ch'], ['16', 1.6, '16ch'], ['Rack', 2.8, '32ch']], 'AXIS Camera Station, PoE, RAID, pre-installed'],
  ['hanwha', 'Cameras', 'Dome', 'Hanwha XND-', 780, [['8080RV', 1, '5MP'], ['9082RV', 1.5, '4K'], ['C9083RV', 1.8, '4K AI']], 'WiseStream III, 150dB WDR, IR, AI object detection'],
  ['hanwha', 'Cameras', 'Bullet', 'Hanwha QNO-', 680, [['8080R', 1, '5MP'], ['C9083R', 1.6, '4K'], ['9032R', 1.3, '8MP']], 'IR 30m, 120dB WDR, IP67, IK10'],
  ['hanwha', 'Cameras', 'Multi-sensor', 'Hanwha PNM-', 2400, [['9085RQZ1', 1, '4x5MP'], ['C12083RVD', 1.5, '4x8MP']], '180/270/360 multi-directional, per-channel AI'],
  ['hanwha', 'NVR', 'Recorder', 'Hanwha XNR-', 2800, [['6410', 1, '32ch'], ['6420', 1.5, '64ch'], ['6450', 2.2, '128ch']], 'WAVE VMS, PoE, multi-bay RAID, failover'],
  ['verkada', 'Cameras', 'Dome', 'Verkada CD', 1100, [['42', 0.8, '3MP'], ['52', 1, '5MP'], ['62', 1.5, '4K']], 'Cloud-managed, onboard AI, solid-state storage'],
  ['verkada', 'Cameras', 'Bullet', 'Verkada CB', 1300, [['52-E', 1, '5MP'], ['62-E', 1.3, '4K']], 'Edge storage up to 365 days, weatherproof'],
  ['verkada', 'Access', 'Controller', 'Verkada AC', 1600, [['41', 1, '4-door'], ['62', 1.4, '6-door']], 'Cloud access control, built-in cellular backup'],
  ['bosch', 'Cameras', 'Dome', 'Bosch FLEXIDOME 8000i', 1450, [['NDE-', 1, '4K'], ['NDV-', 0.9, '6MP']], 'Starlight, Intelligent Video Analytics built in'],
  ['bosch', 'Intrusion', 'Panel', 'Bosch B', 720, [['5512', 1, '48-pt'], ['6512', 1.5, '96-pt'], ['9512', 2.4, '599-pt']], 'IP alarm, cloud, partitioned areas'],
  ['avigilon', 'Cameras', 'Dome', 'Avigilon H6A', 1350, [['-DO1', 1, '4MP'], ['-DO2', 1.4, '8MP'], ['-DC', 1.7, '4K']], 'Self-learning analytics, HDSM SmartCodec'],
  ['avigilon', 'NVR', 'Appliance', 'Avigilon HD NVR4', 5200, [['Std', 1, '24TB'], ['Prem', 1.6, '48TB'], ['Value', 0.7, '12TB']], 'ACC software, RAID, dual NIC'],
  ['hikvision', 'Cameras', 'Turret', 'Hikvision DS-2CD', 320, [['2347', 1, '4MP'], ['2387', 1.5, '8MP']], 'AcuSense, ColorVu, IR, IP67'],
  ['hid', 'Access', 'Reader', 'HID Signo', 620, [['20', 0.85, 'Mullion'], ['40', 1, 'Wall'], ['40K', 1.2, 'Keypad']], 'OSDP Secure Channel, BLE, NFC, multi-tech'],
  ['hid', 'Credentials', 'Card', 'HID iCLASS Seos', 6, [['Card', 1, ''], ['Fob', 1.3, ''], ['Sticker', 0.8, '']], 'Seos credential, AES-128, mobile-ready'],
  ['mercury', 'Access', 'Panel', 'Mercury LP', 1850, [['1501', 0.7, '1-door'], ['1502', 1, '2-door'], ['4502', 1.6, '4-door']], 'OSDP, PoE, onboard DB, open architecture'],
  ['lenel', 'Access', 'Panel', 'LenelS2 LNL-', 2100, [['X2210', 1, '2-rdr'], ['X3300', 1.5, 'I/O'], ['X4420', 2, '4-rdr']], 'OnGuard, NetBox, encrypted OSDP'],
  ['dsc', 'Intrusion', 'Panel', 'DSC PowerSeries Neo HS', 680, [['2016', 0.7, '16-zone'], ['2064', 1, '64-zone'], ['2128', 1.5, '128-zone']], 'PowerG wireless, IP/cellular, partitions'],
  ['dsc', 'Intrusion', 'Sensor', 'DSC PG99', 95, [['14', 1, 'PIR'], ['24', 1.1, 'PIR+'], ['34', 1.5, 'Dual-Tec']], 'PowerG 128-bit AES, pet immune, 8yr battery'],
  ['honeywell', 'Fire', 'Panel', 'Honeywell NOTIFIER', 2400, [['NFS2-640', 1, '636-pt'], ['NFS2-3030', 2.2, '3180-pt']], 'Intelligent addressable, networkable, voice'],
  ['honeywell', 'Intrusion', 'Sensor', 'Honeywell 5800', 85, [['PIR-RES', 1, 'PIR'], ['CO', 1.5, 'CO'], ['COMBO', 1.8, 'Smoke/Heat']], 'Wireless, SiX/5800 series, tamper'],
  ['ubiquiti', 'Network', 'Switch', 'Ubiquiti USW-Pro-', 699, [['24-PoE', 1, '24-port'], ['48-PoE', 1.6, '48-port'], ['Aggregation', 1.4, '10G']], 'L3, PoE++ budget, SFP+, UniFi managed'],
  ['ubiquiti', 'Network', 'Access Point', 'Ubiquiti U6-', 180, [['Lite', 1, 'WiFi6'], ['Pro', 1.6, 'WiFi6'], ['Enterprise', 2.4, 'WiFi6E']], 'WiFi 6/6E, PoE, UniFi controller'],
  ['cisco', 'Network', 'Switch', 'Meraki MS', 1400, [['130-24P', 1, '24-port'], ['250-48', 2.1, '48-port'], ['355-24X', 2.8, 'multigig']], 'Cloud-managed, stackable, PoE+'],
  ['apc', 'Power', 'UPS', 'APC Smart-UPS', 740, [['750VA', 0.6, ''], ['1500VA', 1, ''], ['3000VA', 2.1, '']], 'Line-interactive, AVR, network card, LCD'],
  ['altronix', 'Power', 'Power Supply', 'Altronix', 280, [['AL400ULACM', 1, '4-out'], ['Maximal3', 2.1, '8-out'], ['eFlow104', 1.4, 'access']], '12/24VDC, FAI trigger, battery backup'],
  ['middle', 'Racks', 'Rack', 'Middle Atlantic', 520, [['DWR-12', 0.7, '12U'], ['SR-24', 1, '24U'], ['ERK-42', 1.8, '42U']], 'Welded steel, vented, cable mgmt, lockable'],
  ['middle', 'Power', 'PDU', 'Middle Atlantic PD-', 180, [['915R', 1, '9-out'], ['2015', 1.4, '20A'], ['1420', 1.2, 'surge']], 'Rackmount PDU, surge, RackLink monitoring'],
  ['commscope', 'Cabling', 'Cable', 'CommScope', 320, [['Cat6A UTP', 1, '1000ft'], ['Cat6 Plenum', 0.8, '1000ft'], ['OM4 Fiber', 1.6, '1000ft']], 'Systimax, verified channel, 25yr warranty'],
  ['panduit', 'Cabling', 'Patch Panel', 'Panduit', 220, [['24-port', 1, 'Cat6A'], ['48-port', 1.7, 'Cat6A'], ['Fiber LGX', 1.3, 'fiber']], 'Mini-Com modular, shielded, rackmount'],
];

function plBuildCatalog() {
  const out = [];
  PL_SEEDS.forEach(([brand, cat, subcat, base, msrp, variants, spec]) => {
    variants.forEach(([suffix, mult, attr], vi) => {
      const m = Math.round(msrp * mult);
      const marginPct = [17, 20, 27, 29, 30][(out.length + vi) % 5];
      const cost = Math.round(m * (1 - marginPct / 100));
      const map = Math.round(m * 0.92);
      const stockN = [0, 2, 4, 8, 12, 25, 40][(out.length * 3 + vi) % 7];
      const lead = stockN > 0 ? 'In stock' : ['3–5 days', '1–2 wks', '4–6 wks'][(out.length + vi) % 3];
      const poe = cat === 'Cameras' ? [7, 10, 12.5, 25][vi % 4] : (cat === 'Access' || cat === 'Network') ? [0, 12.5, 0][vi % 3] : 0;
      out.push({
        id: `${brand}-${(base + suffix).replace(/[^A-Za-z0-9]/g, '').slice(0, 14)}-${out.length}`,
        name: `${base}${suffix}`.replace(/\s+/g, ' ').trim(),
        brand, cat, subcat, attr,
        msrp: m, map, cost, margin: marginPct, poe,
        sku: `${brand.slice(0, 3).toUpperCase()}-${cat.slice(0, 3).toUpperCase()}-${1000 + out.length}`,
        spec,
        stock: stockN, lead,
        warranty: ['1 yr', '2 yr', '3 yr', '5 yr', 'Lifetime'][(out.length + vi) % 5],
        rating: (3.8 + ((out.length * 7 + vi) % 12) / 10).toFixed(1),
      });
    });
  });
  PL_BRANDS.forEach(b => { b.skus = out.filter(p => p.brand === b.id).length; });
  return out;
}
const PL_CATALOG = plBuildCatalog();
const PL_CATS = [...new Set(PL_CATALOG.map(p => p.cat))];

/* ── Screen ── */
function ProductLibraryScreen({ onAddToDesign }) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('All');
  const [brand, setBrand] = React.useState('All');
  const [sort, setSort] = React.useState('name');
  const [view, setView] = React.useState('grid');
  const [stockOnly, setStockOnly] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [showBrands, setShowBrands] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };
  const brandName = (id) => (PL_BRANDS.find(b => b.id === id) || {}).name || id;

  let rows = PL_CATALOG.filter(p => {
    if (cat !== 'All' && p.cat !== cat) return false;
    if (brand !== 'All' && p.brand !== brand) return false;
    if (stockOnly && p.stock <= 0) return false;
    if (q) { const s = (p.name + p.sku + p.brand + p.subcat + p.spec).toLowerCase(); if (!s.includes(q.toLowerCase())) return false; }
    return true;
  });
  rows = rows.sort((a, b) => {
    if (sort === 'price-lo') return a.msrp - b.msrp;
    if (sort === 'price-hi') return b.msrp - a.msrp;
    if (sort === 'margin') return b.margin - a.margin;
    if (sort === 'stock') return b.stock - a.stock;
    return a.name.localeCompare(b.name);
  });

  const liveBrands = PL_BRANDS.filter(b => b.sync === 'live').length;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Left: category tree + filters ── */}
      <div style={{ width: 210, borderRight: '1px solid var(--border-subtle)', padding: 14, overflow: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Categories</div>
        <button onClick={() => setCat('All')} style={plNavBtn(cat === 'All')}>
          <span>All Products</span><span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{PL_CATALOG.length}</span>
        </button>
        {PL_CATS.map(c => {
          const meta = PL_CAT_META[c] || {}; const n = PL_CATALOG.filter(p => p.cat === c).length;
          return (
            <button key={c} onClick={() => setCat(c)} style={plNavBtn(cat === c)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: meta.color || 'var(--brand)' }} />{c}
              </span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{n}</span>
            </button>
          );
        })}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
        <button onClick={() => setShowBrands(true)} style={{ ...plNavBtn(false), color: 'var(--brand)' }}>
          <span>Brand Directory</span><span className="mono" style={{ fontSize: 9 }}>{PL_BRANDS.length}</span>
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 11, color: 'var(--text-mid)', cursor: 'pointer' }}>
          <input type="checkbox" checked={stockOnly} onChange={e => setStockOnly(e.target.checked)} /> In stock only
        </label>
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.16)' }}>
          <div style={{ fontSize: 10, color: 'var(--status-ok)', fontWeight: 600 }}>● Catalog sync live</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3 }}>{liveBrands} of {PL_BRANDS.length} brand feeds auto-updating pricing & specs</div>
        </div>
      </div>

      {/* ── Right: results ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-low)', fontSize: 12 }}>⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search 1.6M products by model, SKU, spec…" style={{ width: '100%', padding: '8px 10px 8px 28px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)' }} />
          </div>
          <select value={brand} onChange={e => setBrand(e.target.value)} style={plSelect()}>
            <option value="All">All Brands</option>
            {PL_BRANDS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} style={plSelect()}>
            <option value="name">Sort: Name</option>
            <option value="price-lo">Price ↑</option>
            <option value="price-hi">Price ↓</option>
            <option value="margin">Margin ↓</option>
            <option value="stock">Stock ↓</option>
          </select>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(5,7,10,0.5)', borderRadius: 7, padding: 2 }}>
            {['grid', 'list'].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: '6px 10px', borderRadius: 5, border: 'none', background: view === v ? 'var(--brand)' : 'transparent', color: view === v ? '#fff' : 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v === 'grid' ? '▦' : '☰'}</button>)}
          </div>
        </div>
        <div style={{ padding: '6px 16px', fontSize: 10, color: 'var(--text-low)', flexShrink: 0 }}>{rows.length} products{cat !== 'All' ? ` in ${cat}` : ''}{brand !== 'All' ? ` · ${brandName(brand)}` : ''}</div>

        {/* results */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px 16px' }}>
          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {rows.map(p => {
                const meta = PL_CAT_META[p.cat] || {};
                return (
                  <GlassPanel key={p.id} onClick={() => setDetail(p)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: `${meta.color}1a`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {typeof Icon !== 'undefined' && <Icon name={meta.icon || 'box'} size={19} color={meta.color} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brandName(p.brand)}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.2 }}>{p.name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)', flex: 1, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.subcat}{p.attr ? ` · ${p.attr}` : ''} — {p.spec}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>${p.msrp.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-low)', marginLeft: 4 }}>MSRP</span>
                      </div>
                      <span style={{ fontSize: 9, color: p.stock > 0 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{p.stock > 0 ? `${p.stock} in stock` : p.lead}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                      <button onClick={e => { e.stopPropagation(); onAddToDesign ? onAddToDesign(p) : showToast(`${p.name} → added to design`); showToast(`${p.name} → added to design`); }} style={plMiniBtn(true)}>+ Design</button>
                      <button onClick={e => { e.stopPropagation(); showToast(`${p.name} → added to quote`); }} style={plMiniBtn(false)}>+ Quote</button>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          ) : (
            <GlassPanel style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Product', 'Brand', 'Category', 'SKU', 'Cost', 'MAP', 'MSRP', 'Margin', 'Stock', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: i > 3 && i < 8 ? 'right' : 'left', padding: '8px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr></thead>
                <tbody>{rows.map(p => (
                  <tr key={p.id} onClick={() => setDetail(p)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ cursor: 'pointer' }}>
                    <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{brandName(p.brand)}</td>
                    <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{p.cat}</td>
                    <td className="mono" style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{p.sku}</td>
                    <td className="mono" style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)', textAlign: 'right' }}>${p.cost.toLocaleString()}</td>
                    <td className="mono" style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)', textAlign: 'right' }}>${p.map.toLocaleString()}</td>
                    <td className="mono" style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, fontWeight: 600, textAlign: 'right' }}>${p.msrp.toLocaleString()}</td>
                    <td className="mono" style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--status-ok)', textAlign: 'right' }}>{p.margin}%</td>
                    <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: p.stock > 0 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{p.stock > 0 ? p.stock : p.lead}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><button onClick={e => { e.stopPropagation(); showToast(`${p.name} → added to design`); }} style={plMiniBtn(true)}>+ Design</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </GlassPanel>
          )}
        </div>
      </div>

      {detail && <ProductDetailDrawer p={detail} brandName={brandName} onClose={() => setDetail(null)} showToast={showToast} onAddToDesign={onAddToDesign} />}
      {showBrands && <BrandDirectoryModal onClose={() => setShowBrands(false)} onPick={(id) => { setBrand(id); setShowBrands(false); }} showToast={showToast} />}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

function ProductDetailDrawer({ p, brandName, onClose, showToast, onAddToDesign }) {
  const meta = PL_CAT_META[p.cat] || {};
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 9000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, height: '100%', background: 'var(--card)', borderLeft: '1px solid var(--border-strong)', overflow: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 11, background: `${meta.color}1a`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {typeof Icon !== 'undefined' && <Icon name={meta.icon || 'box'} size={26} color={meta.color} />}
            </div>
            <div>
              <div style={{ fontSize: 10, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brandName(p.brand)}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-high)' }}>{p.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.sku}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* image placeholder */}
        <div style={{ height: 150, borderRadius: 10, background: 'rgba(5,7,10,0.6)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          {typeof Icon !== 'undefined' && <Icon name={meta.icon || 'box'} size={54} color={`${meta.color}66`} />}
        </div>

        {/* price tiers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['DEALER COST', `$${p.cost.toLocaleString()}`, 'var(--text-low)'], ['MAP', `$${p.map.toLocaleString()}`, 'var(--text-mid)'], ['MSRP', `$${p.msrp.toLocaleString()}`, 'var(--text-high)']].map(([l, v, c]) => (
            <div key={l} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.16)', marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Your margin at MSRP</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-ok)' }}>{p.margin}% · ${(p.msrp - p.cost).toLocaleString()}</span>
        </div>

        {/* specs */}
        <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Specifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
          {[['Category', p.cat], ['Type', p.subcat], p.attr && ['Resolution / Rating', p.attr], ['PoE draw', p.poe ? `${p.poe} W` : '—'], ['Stock', p.stock > 0 ? `${p.stock} on hand` : p.lead], ['Lead time', p.lead], ['Warranty', p.warranty], ['Rating', `★ ${p.rating} / 5`]].filter(Boolean).map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', fontSize: 11 }}>
              <span style={{ color: 'var(--text-low)' }}>{k}</span><span style={{ color: 'var(--text-mid)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(63,169,245,0.03)' }}>{p.spec}</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { onAddToDesign && onAddToDesign(p); showToast(`${p.name} → added to design`); }} style={{ flex: 1, padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add to Design</button>
          <button onClick={() => showToast(`${p.name} → added to quote`)} style={{ flex: 1, padding: '10px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add to Quote</button>
        </div>
        <button onClick={() => showToast('Spec sheet (PDF) downloaded')} style={{ width: '100%', marginTop: 8, padding: '9px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⤓ Download spec sheet & datasheet</button>
      </div>
    </div>
  );
}

function BrandDirectoryModal({ onClose, onPick, showToast }) {
  const syncMeta = { live: { c: 'var(--status-ok)', l: 'Live sync' }, manual: { c: 'var(--status-warn)', l: 'Manual' } };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 720, maxHeight: '82vh', overflow: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Brand Directory</span>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{PL_BRANDS.length} manufacturers · 1,200+ available via catalog network</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {PL_BRANDS.map(b => {
            const sm = syncMeta[b.sync] || syncMeta.manual;
            return (
              <div key={b.id} onClick={() => onPick(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{b.name.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{b.country} · {b.tier} · {b.skus} SKUs</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: sm.c, whiteSpace: 'nowrap' }}>● {sm.l}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => showToast('Catalog network — request brand feed')} style={{ width: '100%', marginTop: 14, padding: '9px', background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 8, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Request another manufacturer feed</button>
      </div>
    </div>
  );
}

/* tiny style helpers */
function plNavBtn(active) { return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 10px', marginBottom: 2, borderRadius: 6, border: 'none', background: active ? 'rgba(63,169,245,0.12)' : 'transparent', color: active ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11.5, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }; }
function plSelect() { return { padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer' }; }
function plMiniBtn(primary) { return { flex: 1, padding: '5px', borderRadius: 5, border: primary ? 'none' : '1px solid var(--border-subtle)', background: primary ? 'rgba(63,169,245,0.12)' : 'transparent', color: primary ? 'var(--brand)' : 'var(--text-low)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }; }

Object.assign(window, { ProductLibraryScreen, PL_CATALOG, PL_BRANDS, PL_CATS, PL_CAT_META });

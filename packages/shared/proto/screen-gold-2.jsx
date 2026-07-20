/* Gold Features Part 2 — Service Reports, Vendor Price Book, ROI Calc, Team Chat, Status Page */

/* ── Auto Service Report Generator ── */
function ServiceReportScreen() {
  const [generating, setGenerating] = React.useState(false);

  const reports = [
    { id: 'SR-4201', job: 'J-4201', customer: 'Acme Dental Group', tech: 'Mike Reyes', date: 'Jun 5, 2026', type: 'Repair', status: 'draft', summary: 'NVR cable re-termination at rear exit camera. Replaced Cat6A run from IDF to camera location. Tested 24h — stable.', photos: 4, duration: '1h 45m', aiGenerated: true },
    { id: 'SR-4198', job: 'J-4198', customer: 'Metro Bank Corp', date: 'Jun 3, 2026', tech: 'Jessica Liu', type: 'PM', status: 'sent', summary: 'Quarterly preventive maintenance. Cleaned 16 camera domes, verified NVR health, updated 4 firmware versions, tested all access readers.', photos: 8, duration: '4h 30m', aiGenerated: true },
    { id: 'SR-4195', job: 'J-4195', customer: 'Harbor View Condos', date: 'Jun 1, 2026', tech: 'Mike Reyes', type: 'Install', status: 'approved', summary: '4-camera addition to existing system. Mounted cameras at pool area, gym entrance, mail room, and elevator lobby. Extended NVR storage to 8TB.', photos: 12, duration: '6h', aiGenerated: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Service Reports</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setGenerating(true); shieldToast('Generating service report from latest job…'); setTimeout(() => { setGenerating(false); shieldToast('Service report ready', 'ok'); }, 1400); }} style={{ padding: '6px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⟡</span> Auto-Generate from Job
          </button>
        </div>
      </div>

      {/* How it works */}
      <GlassPanel style={{ borderLeft: '3px solid var(--brand)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>⟡</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>AI-Powered Report Generation</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 10 }}>
          ShieldTech AI automatically generates professional service reports from technician check-ins, time entries, photos, and job notes. Each report includes work summary, equipment used, test results, before/after photos, and recommendations — ready for customer delivery.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { step: '1', label: 'Tech completes job', desc: 'Checklist, photos, notes' },
            { step: '2', label: 'ShieldTech AI drafts report', desc: 'Professional PDF in 30s' },
            { step: '3', label: 'Review & approve', desc: 'Edit or send as-is' },
            { step: '4', label: 'Auto-deliver', desc: 'Email to customer' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{s.step}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Reports */}
      {reports.map((r, i) => (
        <GlassPanel key={i} style={{ animation: `fade-up 0.3s ease ${i * 60}ms both` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{r.id}</span>
                <StatusBadge status={r.status === 'draft' ? 'pending' : r.status === 'sent' ? 'info' : 'online'} label={r.status} />
                {r.aiGenerated && <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', fontWeight: 600, textTransform: 'uppercase' }}>AI Generated</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{r.customer} — {r.type}</div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 8 }}>{r.summary}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-low)' }}>
                <span>{r.tech}</span><span>·</span><span>{r.date}</span><span>·</span>
                <span>{r.duration}</span><span>·</span><span>◉ {r.photos} photos</span>
                <span>·</span><span className="mono">{r.job}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button onClick={() => shieldModal({ kind: 'doc', title: 'Service Report Preview', docTitle: `Service Report \u2014 ${r.customer || r.title || 'Customer'}`, meta: `ShieldTech Security \u00b7 ${r.date || 'Generated today'}`, downloadLabel: 'Download PDF', downloadMsg: 'Service report downloaded', paragraphs: [
                `Summary of work performed${r.customer ? ' for ' + r.customer : ''}. Technician completed all scheduled tasks; systems verified operational on departure.`,
                { k: 'Status', v: r.status === 'draft' ? 'Draft \u2014 pending review' : 'Final' },
                { k: 'Site visit', v: r.date || 'Today' },
                'Photos, checklist results, and the customer signature are attached in the full PDF.'
              ] })} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview PDF</button>
              {r.status === 'draft' && (
                <button onClick={() => shieldToast(`Report sent to ${r.customer || 'customer'}`, 'ok')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send to Customer</button>
              )}
            </div>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

/* ── Vendor Price Book ── */
function VendorPriceBookScreen() {
  const products = [
    { name: 'Axis P3265-V', cat: 'Camera', vendors: [
      { vendor: 'ADI', price: 842, stock: 'In Stock', ship: '1-2 days', preferred: true },
      { vendor: 'Anixter', price: 878, stock: 'In Stock', ship: '2-3 days', preferred: false },
      { vendor: 'Tri-Ed', price: 910, stock: '3 left', ship: '1 day', preferred: false },
    ]},
    { name: 'Hanwha XNR-6410', cat: 'NVR', vendors: [
      { vendor: 'ADI', price: 2680, stock: 'In Stock', ship: '2-3 days', preferred: true },
      { vendor: 'Anixter', price: 2750, stock: 'Backorder', ship: '2-3 weeks', preferred: false },
      { vendor: 'ScanSource', price: 2620, stock: 'In Stock', ship: '3-5 days', preferred: false },
    ]},
    { name: 'HID iCLASS SE RK40', cat: 'Access', vendors: [
      { vendor: 'ADI', price: 312, stock: 'In Stock', ship: '1-2 days', preferred: true },
      { vendor: 'Tri-Ed', price: 328, stock: 'In Stock', ship: '1 day', preferred: false },
      { vendor: 'Anixter', price: 340, stock: 'In Stock', ship: '2-3 days', preferred: false },
    ]},
    { name: 'Ubiquiti USW-Pro-24-PoE', cat: 'Network', vendors: [
      { vendor: 'Streakwave', price: 599, stock: 'In Stock', ship: '2-3 days', preferred: false },
      { vendor: 'ADI', price: 699, stock: 'In Stock', ship: '1-2 days', preferred: true },
      { vendor: 'Amazon Biz', price: 649, stock: 'In Stock', ship: '1 day (Prime)', preferred: false },
    ]},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Vendor Price Book</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search products…" style={{ padding: '6px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 200 }} />
          <button onClick={() => shieldModal({ kind: 'form', title: 'Add Product', subtitle: 'Add an item to the vendor price book', submitLabel: 'Add Product', successMsg: 'Product added to price book', fields: [
            { key: 'name', label: 'Product Name', placeholder: 'Axis P3265-V', required: true, full: true },
            { key: 'cat', label: 'Category', type: 'select', options: ['Camera','NVR','Access','Cable','Alarm','Other'] },
            { key: 'vendor', label: 'Preferred Vendor', type: 'select', options: ['ADI','Anixter','Tri-Ed','ScanSource'] },
            { key: 'price', label: 'List Price ($)', type: 'number', placeholder: '842', required: true }
          ] })} style={{ padding: '6px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Product</button>
        </div>
      </div>

      {products.map((prod, pi) => (
        <GlassPanel key={pi} style={{ padding: 0 }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{prod.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-low)', background: 'rgba(63,169,245,0.06)', padding: '2px 8px', borderRadius: 4 }}>{prod.cat}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-low)' }}>Best: <span className="mono" style={{ color: 'var(--status-ok)', fontWeight: 600 }}>${Math.min(...prod.vendors.map(v => v.price)).toLocaleString()}</span></span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Vendor','Unit Price','vs Best','Stock','Ship Time',''].map((h, i) => (
                <th key={i} style={{ textAlign: i === 1 || i === 2 ? 'right' : 'left', padding: '8px 14px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {prod.vendors.sort((a,b) => a.price - b.price).map((v, vi) => {
                const best = Math.min(...prod.vendors.map(v => v.price));
                const diff = v.price - best;
                return (
                  <tr key={vi}>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13 }}>
                      {v.vendor} {v.preferred && <span style={{ fontSize: 8, color: 'var(--status-ok)', fontWeight: 600, marginLeft: 4 }}>★ PREFERRED</span>}
                    </td>
                    <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: vi === 0 ? 600 : 400, textAlign: 'right', color: vi === 0 ? 'var(--status-ok)' : 'var(--text-high)' }}>${v.price.toLocaleString()}</td>
                    <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: diff === 0 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{diff === 0 ? 'BEST' : `+$${diff}`}</td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: v.stock === 'Backorder' ? 'var(--status-critical)' : v.stock.includes('left') ? 'var(--status-warn)' : 'var(--text-mid)' }}>{v.stock}</td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{v.ship}</td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <button onClick={() => shieldModal({ kind: 'form', title: `Order — ${p.name}`, subtitle: `From ${v.vendor} · $${v.price} each · ${v.ship}`, submitLabel: 'Place Order', successMsg: `PO created with ${v.vendor}`, fields: [
                        { key: 'qty', label: 'Quantity', type: 'number', value: '1', required: true },
                        { key: 'job', label: 'Assign to Job', placeholder: 'WO-2847 (optional)' },
                        { key: 'notes', label: 'Notes for vendor', type: 'textarea', placeholder: 'Delivery instructions…' }
                      ] })} style={{ padding: '3px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Order</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassPanel>
      ))}
    </div>
  );
}

/* ── ROI Calculator ── */
function ROICalculatorScreen() {
  const [employees, setEmployees] = React.useState(50);
  const [sqft, setSqft] = React.useState(25000);
  const [industry, setIndustry] = React.useState('medical');

  const industryData = {
    medical: { shrinkRate: 2.8, avgLoss: 184000, insuranceDiscount: 15, liabilityReduction: 40 },
    retail: { shrinkRate: 1.4, avgLoss: 95000, insuranceDiscount: 20, liabilityReduction: 35 },
    office: { shrinkRate: 0.8, avgLoss: 42000, insuranceDiscount: 10, liabilityReduction: 25 },
    warehouse: { shrinkRate: 3.2, avgLoss: 220000, insuranceDiscount: 18, liabilityReduction: 45 },
  };

  const data = industryData[industry];
  const systemCost = Math.round(sqft * 0.8 + employees * 200);
  const annualSavings = Math.round(data.avgLoss * 0.65 + (systemCost * 12 * data.insuranceDiscount / 100));
  const roi = Math.round((annualSavings / systemCost) * 100);
  const payback = (systemCost / (annualSavings / 12)).toFixed(1);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 200 }}>Security ROI Calculator</h2>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>Show customers the cost of NOT having security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Inputs */}
        <GlassPanel>
          <SectionHeader title="Business Profile" icon="assets" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>INDUSTRY</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{id:'medical',label:'Medical'},{id:'retail',label:'Retail'},{id:'office',label:'Office'},{id:'warehouse',label:'Warehouse'}].map(ind => (
                  <button key={ind.id} onClick={() => setIndustry(ind.id)} style={{
                    flex: 1, padding: '8px', borderRadius: 6, fontSize: 12,
                    background: industry === ind.id ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.03)',
                    border: `1px solid ${industry === ind.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
                    color: industry === ind.id ? 'var(--brand)' : 'var(--text-mid)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>{ind.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>EMPLOYEES: <span className="mono" style={{ color: 'var(--text-high)' }}>{employees}</span></div>
              <input type="range" min="5" max="500" value={employees} onChange={e => setEmployees(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand)' }} />
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>SQUARE FOOTAGE: <span className="mono" style={{ color: 'var(--text-high)' }}>{sqft.toLocaleString()}</span></div>
              <input type="range" min="1000" max="200000" step="1000" value={sqft} onChange={e => setSqft(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand)' }} />
            </div>
          </div>

          {/* Risk profile */}
          <div style={{ marginTop: 16, padding: '12px', borderRadius: 8, background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.12)' }}>
            <div className="label-sm" style={{ marginBottom: 6, color: 'var(--status-critical)' }}>WITHOUT SECURITY</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Est. annual loss exposure</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-critical)' }}>${data.avgLoss.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Industry shrinkage rate</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: 'var(--status-warn)' }}>{data.shrinkRate}%</span>
            </div>
          </div>
        </GlassPanel>

        {/* Results */}
        <GlassPanel style={{ borderTop: '2px solid var(--status-ok)' }}>
          <SectionHeader title="ROI Analysis" icon="reports" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(52,211,153,0.04)', borderRadius: 8 }}>
              <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--status-ok)' }}>{roi}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase' }}>Annual ROI</div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(63,169,245,0.04)', borderRadius: 8 }}>
              <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)' }}>{payback}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase' }}>Months to Payback</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Estimated system investment</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>${systemCost.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Loss prevention savings (65%)</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--status-ok)' }}>${Math.round(data.avgLoss * 0.65).toLocaleString()}/yr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Insurance discount ({data.insuranceDiscount}%)</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--status-ok)' }}>${Math.round(systemCost * 12 * data.insuranceDiscount / 100).toLocaleString()}/yr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Liability reduction</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--status-ok)' }}>{data.liabilityReduction}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Total Annual Savings</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--status-ok)' }}>${annualSavings.toLocaleString()}</span>
            </div>
          </div>

          <button onClick={() => shieldModal({ kind: 'doc', title: 'ROI Report Preview', docTitle: 'Security Investment ROI Analysis', meta: 'ShieldTech Security · Customer-Facing Estimate', downloadLabel: 'Download PDF', downloadMsg: 'ROI PDF downloaded', paragraphs: [
            'This analysis projects the return on investment for the proposed security system upgrade based on the inputs provided.',
            { k: 'Facility size', v: sqft.toLocaleString() + ' sq ft' },
            { k: 'Employees covered', v: String(employees) },
            'Projected savings come from reduced shrinkage, lower insurance premiums, and avoided incident costs. A typical commercial deployment reaches payback within 14–20 months.',
            'Full figures, assumptions, and a line-item breakdown are included in the downloadable report.'
          ] })} style={{
            width: '100%', padding: '10px', marginTop: 12,
            background: 'var(--brand)', border: 'none', borderRadius: 6,
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            boxShadow: '0 0 16px -4px rgba(63,169,245,0.3)'
          }}>Generate Customer-Facing PDF</button>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ── Internal Team Chat V2 — Google Chat Style ── */
function TeamChatScreen() {
  const [activeChannel, setActiveChannel] = React.useState('field-ops');
  const [activeDM, setActiveDM] = React.useState(null);
  const [inputText, setInputText] = React.useState('');
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [gifOpen, setGifOpen] = React.useState(false);
  const [createChatOpen, setCreateChatOpen] = React.useState(false);
  const [sidebarSection, setSidebarSection] = React.useState('channels');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const msgEndRef = React.useRef(null);

  const [channels, setChannels] = React.useState([
    { id: 'general', name: 'general', desc: 'Company-wide announcements', unread: 0, members: 12, pinned: true },
    { id: 'field-ops', name: 'field-ops', desc: 'Field operations coordination', unread: 3, members: 8, pinned: true },
    { id: 'sales', name: 'sales', desc: 'Sales team discussions', unread: 1, members: 5, pinned: false },
    { id: 'urgent', name: 'urgent', desc: 'Critical alerts and escalations', unread: 0, members: 12, pinned: true },
    { id: 'projects', name: 'projects', desc: 'Active project discussions', unread: 0, members: 7, pinned: false },
    { id: 'random', name: 'random', desc: 'Off-topic, water cooler', unread: 0, members: 12, pinned: false },
  ]);

  const dmContacts = [
    { id: 'dm-mike', name: 'Mike Reyes', initials: 'MR', status: 'online', role: 'Lead Tech', lastMsg: 'On my way to Metro Bank' },
    { id: 'dm-jessica', name: 'Jessica Liu', initials: 'JL', status: 'online', role: 'Tech II', lastMsg: 'NVR swap is done' },
    { id: 'dm-sarah', name: 'Sarah Chen', initials: 'SC', status: 'online', role: 'Sales Manager', lastMsg: 'Pacific Rim approved!' },
    { id: 'dm-kevin', name: 'Kevin White', initials: 'KW', status: 'busy', role: 'Tech II', lastMsg: 'Access panel update...' },
    { id: 'dm-tony', name: 'Tony Garcia', initials: 'TG', status: 'offline', role: 'Tech I', lastMsg: 'See you tomorrow' },
    { id: 'dm-diana', name: 'Diana Patel', initials: 'DP', status: 'online', role: 'Tech II', lastMsg: 'Training finished' },
  ];

  const [chatMessages, setChatMessages] = React.useState({
    'field-ops': [
      { id: 'm1', user: 'Mike Reyes', initials: 'MR', time: '2:14 PM', text: 'NVR cable re-termination done at Acme Dental. Camera back online and stable. Heading to Metro Bank now.', type: 'message', reactions: [{ emoji: '👍', users: ['JM', 'JL'] }] },
      { id: 'm2', user: 'John Mitchell', initials: 'JM', time: '2:16 PM', text: 'Nice work Mike. Let me know if you need anything for the Metro Bank PM.', type: 'message', reactions: [] },
      { id: 'm3', user: 'AI Assistant', initials: '⟡', time: '2:18 PM', text: 'Auto-update: Acme Dental rear exit camera has been online for 4 minutes. Monitoring for stability over next 24h.', type: 'system', reactions: [] },
      { id: 'm4', user: 'Jessica Liu', initials: 'JL', time: '2:22 PM', text: 'Finished Metro Bank camera install. All 4 cameras configured and recording. Customer signed off. Photos uploaded to J-4202.', type: 'message', reactions: [{ emoji: '🎉', users: ['SC', 'JM'] }, { emoji: '💪', users: ['MR'] }] },
      { id: 'm5', user: 'Sarah Chen', initials: 'SC', time: '2:30 PM', text: 'Heads up team — Pacific Rim Hotels just approved the proposal. $215K deal! Kickoff meeting next Tuesday.', type: 'message', reactions: [{ emoji: '🎉', users: ['JM', 'MR', 'KW', 'JL'] }, { emoji: '⚠', users: ['MR', 'TG'] }] },
      { id: 'm6', user: 'Kevin White', initials: 'KW', time: '2:35 PM', text: 'Great news Sarah! I can take point on the install if we start at Property 1.', type: 'message', reactions: [] },
      { id: 'm7', user: 'John Mitchell', initials: 'JM', time: '2:38 PM', text: "Amazing work everyone. Sarah, set up the kickoff meeting. I'll pull the project plan together.", type: 'message', reactions: [{ emoji: '✅', users: ['SC'] }] },
    ],
    'general': [
      { id: 'g1', user: 'John Mitchell', initials: 'JM', time: '9:00 AM', text: 'Good morning team! Reminder — all-hands at 3 PM today. Agenda: Q2 review, new tool rollout, and Pacific Rim kickoff.', type: 'message', reactions: [{ emoji: '👍', users: ['MR', 'JL', 'SC'] }] },
      { id: 'g2', user: 'Sarah Chen', initials: 'SC', time: '9:15 AM', text: "I'll present the Q2 sales numbers. Spoiler: we crushed it.", type: 'message', reactions: [{ emoji: '⚠', users: ['JM'] }] },
    ],
    'sales': [
      { id: 's1', user: 'Sarah Chen', initials: 'SC', time: '11:00 AM', text: 'Pinnacle Financial site survey is scheduled for Thursday. Mike, can you join?', type: 'message', reactions: [] },
    ],
  });

  const currentId = activeDM || activeChannel;
  const currentMessages = chatMessages[currentId] || [];
  const currentChannelInfo = activeDM ? dmContacts.find(d => d.id === activeDM) : channels.find(c => c.id === activeChannel);
  const channelLabel = activeDM ? currentChannelInfo?.name : `#${currentChannelInfo?.name}`;

  const emojis = ['👍','👎','❤️','⚠','🎉','😂','😮','🤔','💪','✅','👀','🙏','💯','✦','🚀','😎','👏','◎','✦','⚡'];
  const gifs = [
    { label: 'Nice work', url: '▶ nice-work.gif' },
    { label: 'Celebration', url: '▶ celebration.gif' },
    { label: 'Thumbs up', url: '▶ thumbs-up.gif' },
    { label: 'Mind blown', url: '▶ mind-blown.gif' },
    { label: 'High five', url: '▶ high-five.gif' },
    { label: 'Mic drop', url: '▶ mic-drop.gif' },
  ];

  React.useEffect(() => { msgEndRef.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [currentMessages.length]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = { id: 'm' + Date.now(), user: 'John Mitchell', initials: 'JM', time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), text: inputText, type: 'message', reactions: [] };
    setChatMessages(prev => ({ ...prev, [currentId]: [...(prev[currentId] || []), newMsg] }));
    setInputText('');
    setEmojiOpen(false);
    setGifOpen(false);
  };

  const addReaction = (msgId, emoji) => {
    setChatMessages(prev => {
      const msgs = [...(prev[currentId] || [])];
      const idx = msgs.findIndex(m => m.id === msgId);
      if (idx === -1) return prev;
      const msg = { ...msgs[idx], reactions: [...msgs[idx].reactions] };
      const existing = msg.reactions.findIndex(r => r.emoji === emoji);
      if (existing >= 0) {
        if (msg.reactions[existing].users.includes('JM')) {
          msg.reactions[existing] = { ...msg.reactions[existing], users: msg.reactions[existing].users.filter(u => u !== 'JM') };
          if (msg.reactions[existing].users.length === 0) msg.reactions.splice(existing, 1);
        } else {
          msg.reactions[existing] = { ...msg.reactions[existing], users: [...msg.reactions[existing].users, 'JM'] };
        }
      } else {
        msg.reactions.push({ emoji, users: ['JM'] });
      }
      msgs[idx] = msg;
      return { ...prev, [currentId]: msgs };
    });
  };

  const sendGif = (gif) => {
    const newMsg = { id: 'm' + Date.now(), user: 'John Mitchell', initials: 'JM', time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), text: `[GIF: ${gif.label}] ${gif.url}`, type: 'message', reactions: [] };
    setChatMessages(prev => ({ ...prev, [currentId]: [...(prev[currentId] || []), newMsg] }));
    setGifOpen(false);
  };

  const insertEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
    setEmojiOpen(false);
  };

  /* New chat compose mode — replaces modal */
  const [composing, setComposing] = React.useState(false);
  const [composeRecipients, setComposeRecipients] = React.useState([]);
  const [composeSearch, setComposeSearch] = React.useState('');
  const [composeMessages, setComposeMessages] = React.useState([]);

  const allContacts = [
    { id: 'MR', name: 'Mike Reyes', role: 'Lead Tech', status: 'online' },
    { id: 'JL', name: 'Jessica Liu', role: 'Tech II', status: 'online' },
    { id: 'SC', name: 'Sarah Chen', role: 'Sales Manager', status: 'online' },
    { id: 'KW', name: 'Kevin White', role: 'Tech II', status: 'busy' },
    { id: 'TG', name: 'Tony Garcia', role: 'Tech I', status: 'offline' },
    { id: 'DP', name: 'Diana Patel', role: 'Tech II', status: 'online' },
    { id: 'RJ', name: 'Ray Johnson', role: 'Lead Tech', status: 'offline' },
  ];

  const filteredContacts = allContacts.filter(c =>
    !composeRecipients.find(r => r.id === c.id) &&
    (composeSearch === '' || c.name.toLowerCase().includes(composeSearch.toLowerCase()))
  );

  const startCompose = () => {
    setComposing(true);
    setComposeRecipients([]);
    setComposeSearch('');
    setComposeMessages([]);
    setActiveDM(null);
  };

  const addRecipient = (contact) => {
    setComposeRecipients(prev => [...prev, contact]);
    setComposeSearch('');
  };

  const removeRecipient = (id) => {
    setComposeRecipients(prev => prev.filter(r => r.id !== id));
  };

  const sendComposeMessage = () => {
    if (!inputText.trim() || composeRecipients.length === 0) return;
    const newMsg = { id: 'm' + Date.now(), user: 'John Mitchell', initials: 'JM', time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), text: inputText, type: 'message', reactions: [] };
    setComposeMessages(prev => [...prev, newMsg]);

    // If first message, create the conversation
    if (composeMessages.length === 0) {
      if (composeRecipients.length === 1) {
        // DM
        const dm = composeRecipients[0];
        const dmId = `dm-${dm.name.toLowerCase().split(' ')[0]}`;
        setChatMessages(prev => ({ ...prev, [dmId]: [newMsg] }));
        showToast(`Chat started with ${dm.name}`);
      } else {
        // Group chat — auto-create channel
        const groupName = composeRecipients.map(r => r.name.split(' ')[0]).join(', ');
        const groupId = 'group-' + Date.now();
        setChannels(prev => [...prev, { id: groupId, name: groupName, desc: 'Group conversation', unread: 0, members: composeRecipients.length + 1, pinned: false }]);
        setChatMessages(prev => ({ ...prev, [groupId]: [newMsg] }));
        showToast(`Group chat created: ${groupName}`);
      }
    }

    setInputText('');
  };

  const [hoveredMsg, setHoveredMsg] = React.useState(null);
  const [reactionPicker, setReactionPicker] = React.useState(null);
  const inputStyle = { width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* ─── SIDEBAR ─── */}
      <div style={{ background: 'var(--card)', borderRight: '1px solid var(--border-subtle)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Search + New Chat */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input placeholder="Search chats..." style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
            <button onClick={() => startCompose()} title="New chat" style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--brand)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            {['channels', 'dms'].map(s => (
              <button key={s} onClick={() => setSidebarSection(s)} style={{ flex: 1, padding: '4px', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', background: sidebarSection === s ? 'rgba(63,169,245,0.12)' : 'transparent', border: 'none', color: sidebarSection === s ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{s === 'channels' ? 'Channels' : 'Direct'}</button>
            ))}
          </div>
        </div>

        {/* Channels list */}
        {sidebarSection === 'channels' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
            {channels.filter(c => c.pinned).length > 0 && (
              <div className="label-sm" style={{ padding: '6px 14px 4px' }}>PINNED</div>
            )}
            {channels.filter(c => c.pinned).map(ch => (
              <ChatChannelItem key={ch.id} channel={ch} isActive={!activeDM && activeChannel === ch.id} onClick={() => { setActiveChannel(ch.id); setActiveDM(null); }} />
            ))}
            <div className="label-sm" style={{ padding: '10px 14px 4px' }}>ALL CHANNELS</div>
            {channels.filter(c => !c.pinned).map(ch => (
              <ChatChannelItem key={ch.id} channel={ch} isActive={!activeDM && activeChannel === ch.id} onClick={() => { setActiveChannel(ch.id); setActiveDM(null); }} />
            ))}

          </div>
        )}

        {/* DMs list */}
        {sidebarSection === 'dms' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
            {dmContacts.map(dm => (
              <button key={dm.id} onClick={() => { setActiveDM(dm.id); }} style={{
                width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                background: activeDM === dm.id ? 'rgba(63,169,245,0.08)' : 'transparent',
                border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', borderLeft: activeDM === dm.id ? '2px solid var(--brand)' : '2px solid transparent'
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, rgba(63,169,245,0.15), rgba(63,169,245,0.05))', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--brand)' }}>{dm.initials}</div>
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: dm.status === 'online' ? 'var(--status-ok)' : dm.status === 'busy' ? 'var(--status-warn)' : 'var(--text-low)', border: '2px solid var(--card)' }} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: activeDM === dm.id ? 'var(--brand)' : 'var(--text-high)' }}>{dm.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dm.lastMsg}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── CHAT AREA ─── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ─── COMPOSE MODE ─── */}
        {composing ? (
        <>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-low)', flexShrink: 0 }}>To:</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                {composeRecipients.map(r => (
                  <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: 'rgba(63,169,245,0.1)', border: '1px solid rgba(63,169,245,0.2)', fontSize: 11, color: 'var(--brand)' }}>
                    {r.name}
                    <span onClick={() => removeRecipient(r.id)} style={{ cursor: 'pointer', fontSize: 10, color: 'var(--text-low)' }}>✕</span>
                  </span>
                ))}
                <input value={composeSearch} onChange={e => setComposeSearch(e.target.value)} placeholder={composeRecipients.length === 0 ? 'Add people...' : 'Add more...'} autoFocus style={{ flex: 1, minWidth: 100, padding: '4px 0', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
              </div>
              <button onClick={() => setComposing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
            {/* Contact suggestions */}
            {composeSearch && filteredContacts.length > 0 && (
              <div style={{ background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '4px 0', marginTop: 4, maxHeight: 160, overflow: 'auto' }}>
                {filteredContacts.map(c => (
                  <button key={c.id} onClick={() => addRecipient(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--brand)' }}>{c.id}</div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{c.role} · {c.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Show all contacts when no search and no recipients */}
            {!composeSearch && composeRecipients.length === 0 && (
              <div style={{ marginTop: 4, maxHeight: 200, overflow: 'auto' }}>
                <div className="label-sm" style={{ padding: '4px 0', marginBottom: 4 }}>CONTACTS</div>
                {allContacts.map(c => (
                  <button key={c.id} onClick={() => addRecipient(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', borderRadius: 4 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, rgba(63,169,245,0.15), rgba(63,169,245,0.05))', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--brand)' }}>{c.id}</div>
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: c.status === 'online' ? 'var(--status-ok)' : c.status === 'busy' ? 'var(--status-warn)' : 'var(--text-low)', border: '2px solid var(--card)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{c.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Group name + icon when 2+ recipients */}
            {composeRecipients.length >= 2 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, padding: '8px 0', borderTop: '1px solid rgba(63,169,245,0.06)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['✉','🛡','◉','⚙','▤','⚡'].map((ic, i) => (
                    <button key={i} onClick={() => showToast(`Icon: ${ic}`)} style={{ width: 28, height: 28, borderRadius: 6, background: i === 0 ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${i === 0 ? 'var(--brand)' : 'var(--border-subtle)'}`, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
                  ))}
                </div>
                <input placeholder="Group name (optional)" style={{ flex: 1, padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }} />
              </div>
            )}
          </div>
          {/* Compose messages area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {composeRecipients.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', gap: 8 }}>
                <Icon name="chat" size={32} color="var(--text-low)" />
                <span style={{ fontSize: 14 }}>Start a new conversation</span>
                <span style={{ fontSize: 11 }}>Add people above to begin</span>
              </div>
            )}
            {composeRecipients.length > 0 && composeMessages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', gap: 8 }}>
                <div style={{ display: 'flex', gap: -4 }}>
                  {composeRecipients.slice(0, 3).map((r, i) => (
                    <div key={r.id} style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(63,169,245,0.15), rgba(63,169,245,0.05))', border: '2px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)', marginLeft: i > 0 ? -8 : 0 }}>{r.id}</div>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{composeRecipients.map(r => r.name.split(' ')[0]).join(', ')}</span>
                <span style={{ fontSize: 11 }}>Send a message to start the conversation</span>
              </div>
            )}
            {composeMessages.map((msg, i) => (
              <div key={msg.id} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, rgba(63,169,245,0.15), rgba(63,169,245,0.05))', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>{msg.initials}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{msg.user}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{msg.time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, margin: 0 }}>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Compose input */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={inputText} onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComposeMessage(); } }}
                placeholder={composeRecipients.length > 0 ? `Message ${composeRecipients.map(r=>r.name.split(' ')[0]).join(', ')}…` : 'Add recipients first…'}
                disabled={composeRecipients.length === 0}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', opacity: composeRecipients.length > 0 ? 1 : 0.4 }} />
              <button onClick={sendComposeMessage} disabled={!inputText.trim() || composeRecipients.length === 0} style={{ padding: '10px 20px', background: inputText.trim() && composeRecipients.length > 0 ? 'var(--brand)' : 'rgba(63,169,245,0.15)', border: 'none', borderRadius: 8, color: inputText.trim() ? '#fff' : 'var(--text-low)', fontSize: 13, cursor: inputText.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Send</button>
            </div>
          </div>
        </>
        ) : (
        <>
        {/* ─── NORMAL CHAT VIEW ─── */}
        {/* Header */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!activeDM && <span style={{ fontSize: 14, color: 'var(--text-low)' }}>#</span>}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{activeDM ? currentChannelInfo?.name : currentChannelInfo?.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-low)' }}>· {activeDM ? currentChannelInfo?.role : `${currentChannelInfo?.members} members`}{!activeDM ? ` · ${currentChannelInfo?.desc}` : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => showToast('Search in chat')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⊙</button>
            <button onClick={() => showToast('Pinned messages')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⌖</button>
            <button onClick={() => showToast('Channel settings')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚙</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {currentMessages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', gap: 8 }}>
              <span style={{ fontSize: 32 }}>✉</span>
              <span style={{ fontSize: 14 }}>No messages yet in {channelLabel}</span>
              <span style={{ fontSize: 11 }}>Be the first to say something!</span>
            </div>
          )}
          {currentMessages.map((msg, i) => {
            const prevMsg = currentMessages[i - 1];
            const sameUser = prevMsg && prevMsg.user === msg.user && prevMsg.type === msg.type;
            return (
              <div key={msg.id}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => { setHoveredMsg(null); setReactionPicker(null); }}
                style={{ display: 'flex', gap: 10, padding: sameUser ? '1px 0 1px 42px' : '8px 0 1px 0', position: 'relative', borderRadius: 6, marginTop: sameUser ? 0 : 4 }}
              >
                {!sameUser && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: msg.type === 'system' ? 'rgba(63,169,245,0.1)' : 'linear-gradient(135deg, rgba(63,169,245,0.15), rgba(63,169,245,0.05))',
                    border: msg.type === 'system' ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: msg.type === 'system' ? 14 : 11, fontWeight: 700,
                    color: 'var(--brand)', fontFamily: 'var(--font-mono)'
                  }}>{msg.initials}</div>
                )}
                <div style={{ flex: 1 }}>
                  {!sameUser && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: msg.type === 'system' ? 'var(--brand)' : 'var(--text-high)' }}>{msg.user}</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{msg.time}</span>
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: msg.text.startsWith('[GIF:') ? 'var(--brand)' : 'var(--text-mid)', lineHeight: 1.5, margin: 0, fontStyle: msg.text.startsWith('[GIF:') ? 'italic' : 'normal' }}>{msg.text}</p>

                  {/* Reactions */}
                  {msg.reactions.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {msg.reactions.map((r, ri) => (
                        <button key={ri} onClick={() => addReaction(msg.id, r.emoji)} style={{
                          padding: '1px 6px', borderRadius: 10, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)',
                          background: r.users.includes('JM') ? 'rgba(63,169,245,0.12)' : 'rgba(92,111,134,0.08)',
                          border: `1px solid ${r.users.includes('JM') ? 'var(--brand)' : 'var(--border-subtle)'}`,
                          display: 'flex', alignItems: 'center', gap: 3,
                          color: 'var(--text-mid)'
                        }}>
                          <span>{r.emoji}</span>
                          <span className="mono" style={{ fontSize: 9 }}>{r.users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover actions */}
                {hoveredMsg === msg.id && (
                  <div style={{ position: 'absolute', top: sameUser ? -8 : 0, right: 0, display: 'flex', gap: 2, padding: '2px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 5 }}>
                    {['😀', '👍', '❤️'].map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)} style={{ width: 26, height: 26, borderRadius: 4, background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>{e}</button>
                    ))}
                    <button onClick={() => setReactionPicker(reactionPicker === msg.id ? null : msg.id)} style={{ width: 26, height: 26, borderRadius: 4, background: reactionPicker === msg.id ? 'rgba(63,169,245,0.08)' : 'none', border: 'none', fontSize: 10, cursor: 'pointer', color: 'var(--text-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</button>
                    <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 1px' }} />
                    <button onClick={() => showToast('Thread opened')} style={{ width: 26, height: 26, borderRadius: 4, background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✉</button>
                    <button onClick={() => showToast('More options')} style={{ width: 26, height: 26, borderRadius: 4, background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋯</button>
                  </div>
                )}

                {/* Full emoji picker */}
                {reactionPicker === msg.id && (
                  <div style={{ position: 'absolute', top: 30, right: 0, padding: 8, borderRadius: 8, background: 'var(--modal)', border: '1px solid var(--border-strong)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 2, width: 200 }}>
                    {emojis.map(e => (
                      <button key={e} onClick={() => { addReaction(msg.id, e); setReactionPicker(null); }} style={{ width: 30, height: 30, borderRadius: 4, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(63,169,245,0.08)'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'none'}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        {/* ─── INPUT BAR ─── */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', position: 'relative' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
            <button onClick={() => showToast('Attach file')} title="Attach" style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}>⧉</button>
            <button onClick={() => { setEmojiOpen(!emojiOpen); setGifOpen(false); }} title="Emoji" style={{ padding: '4px 8px', background: emojiOpen ? 'rgba(63,169,245,0.08)' : 'none', border: `1px solid ${emojiOpen ? 'var(--brand)' : 'var(--border-subtle)'}`, borderRadius: 4, color: emojiOpen ? 'var(--brand)' : 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}>😀</button>
            <button onClick={() => { setGifOpen(!gifOpen); setEmojiOpen(false); }} title="GIF" style={{ padding: '4px 8px', background: gifOpen ? 'rgba(63,169,245,0.08)' : 'none', border: `1px solid ${gifOpen ? 'var(--brand)' : 'var(--border-subtle)'}`, borderRadius: 4, color: gifOpen ? 'var(--brand)' : 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>GIF</button>
            <button onClick={() => showToast('Format text')} title="Format" style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>B</button>
            <button onClick={() => showToast('Insert link')} title="Link" style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer' }}>⌁</button>
            <button onClick={() => showToast('Mention someone')} title="Mention" style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>@</button>
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${channelLabel}…`}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={!inputText.trim()} style={{ padding: '10px 20px', background: inputText.trim() ? 'var(--brand)' : 'rgba(63,169,245,0.15)', border: 'none', borderRadius: 8, color: inputText.trim() ? '#fff' : 'var(--text-low)', fontSize: 13, cursor: inputText.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'all 0.15s' }}>Send</button>
          </div>

          {/* Emoji picker popover */}
          {emojiOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 60, marginBottom: 6, padding: 10, borderRadius: 10, background: 'var(--modal)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 10, width: 240 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-low)', marginBottom: 6 }}>Emoji</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)} style={{ width: 32, height: 32, borderRadius: 4, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(63,169,245,0.08)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'none'}>{e}</button>
                ))}
              </div>
            </div>
          )}

          {/* GIF picker popover */}
          {gifOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 100, marginBottom: 6, padding: 12, borderRadius: 10, background: 'var(--modal)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 10, width: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-low)', marginBottom: 8 }}>GIFs</div>
              <input placeholder="Search GIFs..." style={{ ...inputStyle, marginBottom: 8, fontSize: 11 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {gifs.map((g, i) => (
                  <button key={i} onClick={() => sendGif(g)} style={{ padding: '12px 8px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--text-mid)', fontSize: 11, transition: 'all 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'rgba(63,169,245,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'rgba(63,169,245,0.04)'; }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{g.url.split(' ')[0]}</div>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
      )}
      </div>

      {/* ─── COMPOSE MODE OVERLAY ─── */}
      {createChatOpen && <CreateChatModal onClose={() => setCreateChatOpen(false)} onCreate={(name, desc) => {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        setChannels(prev => [...prev, { id, name: id, desc, unread: 0, members: 1, pinned: false }]);
        setChatMessages(prev => ({ ...prev, [id]: [] }));
        setActiveChannel(id);
        setActiveDM(null);
        showToast(`#${id} created`);
        setCreateChatOpen(false);
      }} showToast={showToast} />}

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Channel List Item ── */
function ChatChannelItem({ channel, isActive, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8,
      background: isActive ? 'rgba(63,169,245,0.08)' : 'transparent',
      border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left',
      fontFamily: 'var(--font-body)',
      borderLeft: isActive ? '2px solid var(--brand)' : '2px solid transparent'
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-low)' }}>#</span>
      <span style={{ fontSize: 12, flex: 1, fontWeight: channel.unread > 0 ? 600 : 400, color: isActive ? 'var(--brand)' : channel.unread > 0 ? 'var(--text-high)' : 'var(--text-mid)' }}>{channel.name}</span>
      {channel.unread > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--brand)', color: '#fff', padding: '1px 5px', borderRadius: 100, minWidth: 16, textAlign: 'center' }}>{channel.unread}</span>}
    </button>
  );
}

/* ── Create Chat Modal ── */
function CreateChatModal({ onClose, onCreate, showToast }) {
  const [chatType, setChatType] = React.useState('channel');
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const inputStyle = { width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 440, padding: 24, animation: 'fade-up 0.15s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>New Conversation</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[{ id: 'channel', l: '# Channel' }, { id: 'dm', l: '◯ Direct Message' }, { id: 'group', l: '◯ Group Chat' }].map(t => (
            <button key={t.id} onClick={() => setChatType(t.id)} style={{
              flex: 1, padding: '8px', borderRadius: 6, fontSize: 11,
              background: chatType === t.id ? 'rgba(63,169,245,0.1)' : 'transparent',
              border: `1px solid ${chatType === t.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
              color: chatType === t.id ? 'var(--brand)' : 'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatType === 'channel' && (
            <>
              <div><div className="label-sm" style={{ marginBottom: 4 }}>Channel Name</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. project-metro-bank" style={inputStyle} />
              </div>
              <div><div className="label-sm" style={{ marginBottom: 4 }}>Description</div>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this channel about?" style={inputStyle} />
              </div>
            </>
          )}
          {(chatType === 'dm' || chatType === 'group') && (
            <div><div className="label-sm" style={{ marginBottom: 4 }}>Add People</div>
              <input placeholder="Search by name..." style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { if (name.trim()) onCreate(name, desc); else { showToast('Enter a name'); } }} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create</button>
        </div>
      </div>
    </div>
  );
}

/* ── Customer-Facing Status Page ── */
function StatusPageScreen() {
  const customers = [
    { name: 'Acme Dental Group', sites: [
      { name: 'Site A — 1247 Market St', status: 'operational', uptime: 99.7, devices: 24, online: 23, lastIncident: '5d ago' },
    ]},
    { name: 'Metro Bank Corp', sites: [
      { name: 'Site A — 500 Montgomery St', status: 'operational', uptime: 99.9, devices: 18, online: 18, lastIncident: '14d ago' },
      { name: 'Site B — 200 Pine St', status: 'degraded', uptime: 94.1, devices: 12, online: 9, lastIncident: 'Now' },
    ]},
    { name: 'Riverside Medical', sites: [
      { name: 'Main Campus', status: 'operational', uptime: 99.8, devices: 32, online: 32, lastIncident: '21d ago' },
    ]},
    { name: 'Westfield Mall', sites: [
      { name: 'Main Property', status: 'operational', uptime: 99.7, devices: 48, online: 48, lastIncident: '8d ago' },
    ]},
  ];

  const statusColors = { operational: 'var(--status-ok)', degraded: 'var(--status-warn)', outage: 'var(--status-critical)', maintenance: 'var(--brand)' };

  const openSite = (site, cust) => shieldModal({
    kind: 'detail', title: site.name, subtitle: cust + ' · ' + site.status,
    meter: { value: site.uptime, label: 'uptime' },
    badge: { status: site.status === 'operational' ? 'online' : site.status === 'degraded' ? 'warning' : 'critical', label: site.status },
    headline: site.status === 'degraded' ? `${site.devices - site.online} device(s) offline — incident in progress.` : 'All devices reporting normally.',
    sections: [
      { label: 'Site Health', rows: [
        { k: '30-day Uptime', v: site.uptime + '%', color: site.uptime >= 99 ? 'var(--status-ok)' : 'var(--status-warn)' },
        { k: 'Devices Online', v: site.online + ' / ' + site.devices }, { k: 'Devices Offline', v: site.devices - site.online, color: site.online < site.devices ? 'var(--status-critical)' : 'var(--text-high)' },
        { k: 'Last Incident', v: site.lastIncident, mono: false }, { k: 'Status', v: site.status, mono: false },
      ]},
    ],
    actions: [
      { label: 'View Devices', onClick: () => shieldToast('Opening device list for ' + site.name, 'info'), close: true },
      ...(site.status === 'degraded' ? [{ label: 'Open Incident', danger: true, successMsg: 'Incident opened for ' + site.name, onClick: () => {} }] : [{ label: 'Run Health Check', primary: true, successMsg: 'Health check passed for ' + site.name, onClick: () => {} }]),
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>System Status Pages</h2>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>Customer-facing status dashboards — each customer gets a unique URL</p>
        </div>
        <button onClick={() => shieldModal({ kind: 'form', title: 'Create Status Page', subtitle: 'Publish a live status dashboard for a customer', submitLabel: 'Create Page', successMsg: 'Status page published', fields: [
          { key: 'customer', label: 'Customer', placeholder: 'Acme Dental Group', required: true, full: true },
          { key: 'slug', label: 'URL Slug', placeholder: 'acme-dental' },
          { key: 'visibility', label: 'Visibility', type: 'select', options: ['Private link','Public','Password protected'] }
        ] })} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Create Status Page</button>
      </div>

      {/* Overall system status */}
      <GlassPanel style={{ borderTop: '2px solid var(--status-ok)', textAlign: 'center', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <StatusDot status="online" size={8} pulse />
          <span style={{ fontSize: 18, fontWeight: 300, color: 'var(--status-ok)', fontFamily: 'var(--font-display)' }}>All Systems Operational</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-low)' }}>134 of 134 devices online across all monitored sites · Last checked 12s ago</div>
      </GlassPanel>

      {/* Per-customer status */}
      {customers.map((cust, ci) => (
        <GlassPanel key={ci} style={{ padding: 0 }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{cust.name}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', background: 'rgba(63,169,245,0.06)', padding: '2px 8px', borderRadius: 4 }}>status.shieldtech.com/{cust.name.toLowerCase().replace(/\s+/g,'-')}</span>
              <button onClick={() => shieldModal({ kind: 'doc', title: 'Status Page Preview', docTitle: `${cust.name} — System Status`, meta: `status.shieldtech.com/${cust.name.toLowerCase().replace(/\s+/g,'-')}`, downloadLabel: 'Open Live Page', downloadMsg: 'Opening live status page', paragraphs: [
                'All monitored systems are operational. This public page lets the customer see real-time uptime without contacting support.',
                { k: 'Overall status', v: 'Operational' },
                { k: 'Sites monitored', v: String((cust.sites && cust.sites.length) || 1) },
                { k: '30-day uptime', v: '99.7%' }
              ] })} style={{ padding: '3px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
            </div>
          </div>
          {cust.sites.map((site, si) => (
            <div key={si} onClick={() => openSite(site, cust.name)} className="st-clickrow" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: si < cust.sites.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none' }}>
              <StatusDot status={site.status === 'operational' ? 'online' : site.status === 'degraded' ? 'warning' : 'critical'} size={8} pulse={site.status === 'degraded'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-high)' }}>{site.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{site.online}/{site.devices} devices · Last incident: {site.lastIncident}</div>
              </div>
              <span style={{ fontSize: 12, color: statusColors[site.status], fontWeight: 500, textTransform: 'capitalize' }}>{site.status}</span>
              <span className="mono" style={{ fontSize: 12, color: site.uptime >= 99 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{site.uptime}%</span>
            </div>
          ))}
        </GlassPanel>
      ))}
    </div>
  );
}

Object.assign(window, { ServiceReportScreen, VendorPriceBookScreen, ROICalculatorScreen, TeamChatScreen, StatusPageScreen });

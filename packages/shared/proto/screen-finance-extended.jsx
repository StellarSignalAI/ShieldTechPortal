/* Finance Extended — Products & Services, Credits, Bank Feed, Reports Center, Settings */

/* ── Products & Services Catalog ── */
function FinanceProducts({ setModal, showToast }) {
  const [catFilter, setCatFilter] = React.useState('All');
  const items = [
    { sku: 'CAM-P3265', name: 'Axis P3265-V Dome Camera', type: 'Inventory', cat: 'Cameras', price: 890, cost: 520, qty: 24, income: '4000 · Revenue', cogs: '5000 · COGS', taxable: true },
    { sku: 'NVR-XNR64', name: 'Hanwha XNR-6410 16ch NVR', type: 'Inventory', cat: 'Recording', price: 2800, cost: 1650, qty: 6, income: '4000 · Revenue', cogs: '5000 · COGS', taxable: true },
    { sku: 'RDR-HID40', name: 'HID iCLASS SE RK40 Reader', type: 'Inventory', cat: 'Access Control', price: 340, cost: 180, qty: 42, income: '4000 · Revenue', cogs: '5000 · COGS', taxable: true },
    { sku: 'CAB-CAT6A', name: 'Cat6A Plenum Cable (1000ft)', type: 'Inventory', cat: 'Cable & Supply', price: 420, cost: 248, qty: 18, income: '4000 · Revenue', cogs: '5000 · COGS', taxable: true },
    { sku: 'SVC-INST', name: 'Installation Labor (per hour)', type: 'Service', cat: 'Labor', price: 125, cost: 0, qty: null, income: '4100 · Service Revenue', cogs: '', taxable: false },
    { sku: 'SVC-PM', name: 'Preventive Maintenance Visit', type: 'Service', cat: 'Service', price: 450, cost: 0, qty: null, income: '4100 · Service Revenue', cogs: '', taxable: false },
    { sku: 'SVC-PROG', name: 'System Programming (per hour)', type: 'Service', cat: 'Labor', price: 150, cost: 0, qty: null, income: '4100 · Service Revenue', cogs: '', taxable: false },
    { sku: 'MON-STD', name: 'Standard Monitoring (monthly)', type: 'Service', cat: 'RMR', price: 45, cost: 12, qty: null, income: '4200 · RMR Revenue', cogs: '5100 · Monitoring COGS', taxable: false },
    { sku: 'MON-ENT', name: 'Enterprise Monitoring (monthly)', type: 'Service', cat: 'RMR', price: 125, cost: 28, qty: null, income: '4200 · RMR Revenue', cogs: '5100 · Monitoring COGS', taxable: false },
    { sku: 'BDL-8CAM', name: '8-Camera System Bundle', type: 'Bundle', cat: 'Bundles', price: 12400, cost: 7200, qty: null, income: '4000 · Revenue', cogs: '5000 · COGS', taxable: true },
  ];
  const cats = ['All', ...new Set(items.map(i => i.cat))];
  const filtered = catFilter === 'All' ? items : items.filter(i => i.cat === catFilter);

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <SectionHeader title="Products & Services" icon="⊞" count={items.length} />
          <div style={{ display: 'flex', gap: 3, marginLeft: 12 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, background: catFilter===c?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${catFilter===c?'var(--brand)':'var(--border-subtle)'}`, color: catFilter===c?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => showToast('Import started')} style={{ padding: '5px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Import CSV</button>
          <button onClick={() => setModal({ type: 'new-product' })} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Item</button>
        </div>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['SKU','Name','Type','Category','Price','Cost','Margin','Stock','Income Acct','Taxable'].map((h,i) => (
            <th key={i} style={{ textAlign: [4,5,6,7].includes(i)?'right':'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{filtered.map((p,i) => {
            const margin = p.cost > 0 ? Math.round((1 - p.cost / p.price) * 100) : null;
            return (
              <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{p.sku}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: p.type==='Service'?'rgba(63,169,245,0.08)':p.type==='Inventory'?'rgba(52,211,153,0.08)':'rgba(192,132,252,0.08)', color: p.type==='Service'?'var(--brand)':p.type==='Inventory'?'var(--status-ok)':'#c084fc', fontWeight: 600 }}>{p.type}</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{p.cat}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500, textAlign: 'right' }}>${p.price.toLocaleString()}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>{p.cost > 0 ? `$${p.cost.toLocaleString()}` : '—'}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: margin && margin >= 35 ? 'var(--status-ok)' : margin ? 'var(--status-warn)' : 'var(--text-low)' }}>{margin ? `${margin}%` : '—'}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: p.qty !== null && p.qty < 10 ? 'var(--status-critical)' : 'var(--text-mid)' }}>{p.qty !== null ? p.qty : '∞'}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{p.income}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: p.taxable ? 'var(--text-mid)' : 'var(--text-low)' }}>{p.taxable ? 'Yes' : '—'}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Sales Receipts + Credits ── */
function FinanceCredits({ showToast }) {
  const [creditTab, setCreditTab] = React.useState('receipts');
  const receipts = [
    { num: 'SR-101', customer: 'Walk-in — John Doe', amount: 450, date: 'Jun 5', method: 'Visa •••• 4242', items: 'PM visit' },
    { num: 'SR-100', customer: 'Walk-in — Site visit', amount: 125, date: 'Jun 4', method: 'Cash', items: 'Consultation (1h)' },
  ];
  const credits = [
    { num: 'CM-201', customer: 'Riverside Medical', amount: 1200, date: 'Jun 3', reason: 'Fire panel test waived — warranty', applied: true, invoice: 'INV-2853' },
    { num: 'CM-200', customer: 'Acme Dental Group', amount: 500, date: 'May 28', reason: 'Goodwill discount — overdue issue', applied: false, invoice: '' },
  ];
  const retainers = [
    { customer: 'Pacific Rim Hotels', balance: 48000, type: 'Deposit', date: 'Jun 3', from: 'PROP-298 acceptance deposit' },
    { customer: 'Metro Bank Corp', balance: 12000, type: 'Retainer', date: 'May 15', from: 'Annual service retainer' },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{id:'receipts',label:'Sales Receipts'},{id:'credits',label:'Credit Memos'},{id:'retainers',label:'Retainers & Deposits'},{id:'refunds',label:'Refund Receipts'}].map(t => (
          <button key={t.id} onClick={() => setCreditTab(t.id)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, background: creditTab===t.id?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${creditTab===t.id?'var(--brand)':'var(--border-subtle)'}`, color: creditTab===t.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => showToast('New receipt created')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New</button>
      </div>

      {creditTab === 'receipts' && (
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#','Customer','Items','Amount','Date','Method'].map((h,i) => (
              <th key={i} style={{ textAlign: i===3?'right':'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{receipts.map((r,i) => (
              <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{r.num}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{r.customer}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{r.items}</td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${r.amount.toLocaleString()}</td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{r.date}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{r.method}</td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}

      {creditTab === 'credits' && (
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#','Customer','Amount','Reason','Date','Applied To',''].map((h,i) => (
              <th key={i} style={{ textAlign: i===2?'right':'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{credits.map((c,i) => (
              <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{c.num}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{c.customer}</td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'var(--status-critical)' }}>−${c.amount.toLocaleString()}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{c.reason}</td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{c.date}</td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: c.applied?'var(--status-ok)':'var(--text-low)' }}>{c.applied ? c.invoice : 'Unapplied'}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  {!c.applied && <button onClick={() => showToast('Apply credit to invoice...')} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Apply</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}

      {creditTab === 'retainers' && (
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Customer','Type','Balance Held','Source','Date','Actions'].map((h,i) => (
              <th key={i} style={{ textAlign: i===2?'right':'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{retainers.map((r,i) => (
              <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{r.customer}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={r.type==='Deposit'?'info':'warning'} label={r.type} /></td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 14, fontWeight: 600, textAlign: 'right', color: 'var(--brand)' }}>${r.balance.toLocaleString()}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{r.from}</td>
                <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{r.date}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', display: 'flex', gap: 4 }}>
                  <button onClick={() => showToast('Apply to invoice...')} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Apply to Invoice</button>
                  <button onClick={() => showToast('Refund processed')} style={{ padding: '3px 8px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 4, color: 'var(--status-critical)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Refund</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}

      {creditTab === 'refunds' && (
        <GlassPanel style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>No refund receipts this period</div>
          <button onClick={() => showToast('New refund receipt')} style={{ marginTop: 12, padding: '6px 16px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Create Refund Receipt</button>
        </GlassPanel>
      )}
    </div>
  );
}

/* ── Bank Feed ── */
function FinanceBankFeed({ showToast }) {
  const [feedTab, setFeedTab] = React.useState('review');
  const [matched, setMatched] = React.useState({});
  const txns = [
    { id: 1, date: 'Jun 5', desc: 'ACH DEPOSIT — CITY HALL MAIN', amount: 22100, type: 'deposit', suggestion: { match: 'INV-2854', confidence: 98 } },
    { id: 2, date: 'Jun 5', desc: 'STRIPE TRANSFER 062026', amount: 8400, type: 'deposit', suggestion: { match: 'Stripe payout', confidence: 95 } },
    { id: 3, date: 'Jun 4', desc: 'ADI GLOBAL DIST #442918', amount: -2480, type: 'check', suggestion: { match: 'BILL-420', confidence: 92 } },
    { id: 4, date: 'Jun 4', desc: 'SHELL OIL 0042518 PHILA PA', amount: -127.50, type: 'check', suggestion: { match: 'EXP-201 (Mike Reyes fuel)', confidence: 88 } },
    { id: 5, date: 'Jun 3', desc: 'PAYROLL — GUSTO ACH', amount: -24680, type: 'check', suggestion: { match: 'Payroll', confidence: 99 } },
    { id: 6, date: 'Jun 3', desc: 'AMAZON MKTPLACE PMTS', amount: -248.00, type: 'check', suggestion: { match: null, confidence: 0 } },
    { id: 7, date: 'Jun 2', desc: 'DEPOSIT', amount: 31800, type: 'deposit', suggestion: { match: 'INV-2860 (Westfield Mall)', confidence: 90 } },
  ];
  const rules = [
    { payee: 'SHELL OIL', cat: '6100 · Vehicle Expenses', class: 'Field Ops' },
    { payee: 'ADI GLOBAL', cat: '1300 · Inventory / 2000 · AP', class: 'Equipment' },
    { payee: 'GUSTO', cat: '6000 · Payroll', class: 'Admin' },
    { payee: 'AMAZON', cat: '6300 · Office & Admin', class: 'Admin' },
  ];

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{id:'review',label:'Review & Match'},{id:'rules',label:'Bank Rules'},{id:'history',label:'Reconciliation History'}].map(t => (
          <button key={t.id} onClick={() => setFeedTab(t.id)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, background: feedTab===t.id?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${feedTab===t.id?'var(--brand)':'var(--border-subtle)'}`, color: feedTab===t.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => showToast('Bank feed refreshed')} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⟲ Refresh Feed</button>
      </div>

      {feedTab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            <StatCard label="TO REVIEW" value={txns.filter(t => !matched[t.id]).length} delay={0} />
            <StatCard label="MATCHED" value={Object.keys(matched).length} delay={80} />
            <StatCard label="AUTO-MATCHED" value={txns.filter(t => t.suggestion.confidence >= 90).length} delay={160} />
          </div>
          {txns.filter(t => !matched[t.id]).map(tx => (
            <GlassPanel key={tx.id} style={{ padding: 14, borderLeft: `3px solid ${tx.type==='deposit'?'var(--status-ok)':'var(--text-low)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{tx.date}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{tx.desc}</span>
                  </div>
                  {tx.suggestion.match && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
                      <span>⟡</span>
                      <span style={{ fontSize: 11, color: 'var(--brand)' }}>Match: {tx.suggestion.match}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{tx.suggestion.confidence}% confidence</span>
                    </div>
                  )}
                  {!tx.suggestion.match && (
                    <div style={{ fontSize: 11, color: 'var(--status-warn)' }}>⚠ No match found — categorize manually</div>
                  )}
                </div>
                <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: tx.amount > 0 ? 'var(--status-ok)' : 'var(--text-high)' }}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {tx.suggestion.match && (
                    <button onClick={() => { setMatched(p => ({...p, [tx.id]: true})); showToast(`Matched: ${tx.suggestion.match}`); }} style={{ padding: '5px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 5, color: 'var(--status-ok)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Match</button>
                  )}
                  <button onClick={() => showToast('Categorize manually')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add</button>
                  <button onClick={() => { setMatched(p => ({...p, [tx.id]: true})); showToast('Excluded'); }} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Exclude</button>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {feedTab === 'rules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionHeader title="Bank Rules" icon="⊡" count={rules.length} />
            <button onClick={() => showToast('New bank rule')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Rule</button>
          </div>
          <GlassPanel style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Payee Contains','Category','Class','Actions'].map((h,i) => (
                <th key={i} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}</tr></thead>
              <tbody>{rules.map((r,i) => (
                <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{r.payee}</td>
                  <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{r.cat}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{r.class}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', display: 'flex', gap: 4 }}>
                    <button onClick={() => showToast('Rule edited')} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit</button>
                    <button onClick={() => showToast('Rule deleted')} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 4, color: 'var(--status-critical)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </GlassPanel>
        </div>
      )}

      {feedTab === 'history' && (
        <GlassPanel style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}><SectionHeader title="Reconciliation History" icon="◎" /></div>
          {[
            { period: 'May 2026', acct: 'Business Checking', stmt: 513440, book: 513440, diff: 0, status: 'Reconciled' },
            { period: 'Apr 2026', acct: 'Business Checking', stmt: 475340, book: 475340, diff: 0, status: 'Reconciled' },
            { period: 'Mar 2026', acct: 'Business Checking', stmt: 448200, book: 448200, diff: 0, status: 'Reconciled' },
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <StatusDot status="online" size={6} />
              <span style={{ fontSize: 12, fontWeight: 500, width: 80 }}>{r.period}</span>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{r.acct}</span>
              <span className="mono" style={{ fontSize: 12, width: 100, textAlign: 'right' }}>Stmt: ${r.stmt.toLocaleString()}</span>
              <span className="mono" style={{ fontSize: 12, width: 100, textAlign: 'right' }}>Book: ${r.book.toLocaleString()}</span>
              <StatusBadge status="online" label={r.status} />
              <button onClick={() => showToast('Discrepancy report')} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Report</button>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}

/* ── Reports Center ── */
function FinanceReportsCenter({ showToast }) {
  const [search, setSearch] = React.useState('');
  const [selectedReport, setSelectedReport] = React.useState(null);
  const reportGroups = [
    { cat: 'Profit & Loss', reports: ['Profit & Loss', 'P&L by Class', 'P&L by Job', 'P&L by Month', 'P&L Comparison'] },
    { cat: 'Balance Sheet', reports: ['Balance Sheet Summary', 'Balance Sheet Detail', 'Statement of Cash Flows'] },
    { cat: 'Receivables', reports: ['A/R Aging Summary', 'A/R Aging Detail', 'Open Invoices', 'Collections Report', 'Customer Balance Summary'] },
    { cat: 'Payables', reports: ['A/P Aging Summary', 'A/P Aging Detail', 'Vendor Balance Summary', 'Expenses by Vendor'] },
    { cat: 'Sales', reports: ['Sales by Customer', 'Sales by Product/Service', 'Sales by Rep', 'Estimates vs Actuals'] },
    { cat: 'Taxes & Compliance', reports: ['Sales Tax Liability', '1099 Detail Report', 'Transaction Detail by Account'] },
    { cat: 'Accounting', reports: ['Trial Balance', 'General Ledger', 'Journal Entries', 'Budget vs Actual'] },
    { cat: 'Saved Reports', reports: ['Overdue AR — Weekly', 'Monthly Profitability', 'Cash Flow Forecast'] },
  ];

  const allReports = reportGroups.flatMap(g => g.reports.map(r => ({ name: r, cat: g.cat })));
  const filtered = search ? allReports.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) : null;

  if (selectedReport) {
    return (
      <div style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '3px 10px', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
            <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>{selectedReport}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <Segmented options={['Cash','Accrual']} defaultValue="Accrual"
                btnStyle={{ padding: '4px 10px', borderRadius: 4, fontSize: 10 }}
                activeStyle={{ background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
                idleStyle={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }} />
            </div>
            <button onClick={() => showToast('Report memorized')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>★ Save</button>
            <button onClick={() => showToast('Email scheduled')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✉ Schedule</button>
            <button onClick={() => showToast('Exported PDF')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>PDF</button>
            <button onClick={() => showToast('Exported CSV')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>CSV</button>
            <button onClick={() => showToast('Exported Excel')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Excel</button>
          </div>
        </div>
        <GlassPanel>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div className="display" style={{ fontSize: 14, fontWeight: 300 }}>ShieldTech Solutions</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{selectedReport}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>June 1–6, 2026 · Accrual Basis</div>
          </div>
          {/* Sample report data */}
          {selectedReport.includes('Aging') ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Customer','Current','1-30','31-60','60+','Total'].map((h,i) => (
                <th key={i} style={{ textAlign: i>0?'right':'left', padding: '8px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {[{c:'Metro Bank Corp',v:[67500,0,0,0]},{c:'Pacific Rim Hotels',v:[48000,0,0,0]},{c:'Marina District Dental',v:[24800,0,0,0]},{c:'Embarcadero Partners',v:[18900,0,0,0]},{c:'Acme Dental Group',v:[0,0,14250,0]},{c:'Harbor View Condos',v:[0,0,5200,0]}].map((r,i) => (
                  <tr key={i}><td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{r.c}</td>{r.v.map((v,j) => <td key={j} className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: j>=2&&v>0?'var(--status-critical)':'var(--text-mid)' }}>{v>0?`$${v.toLocaleString()}`:''}</td>)}<td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500, textAlign: 'right' }}>${r.v.reduce((s,x)=>s+x,0).toLocaleString()}</td></tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border-strong)' }}><td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 12 }}>Total</td><td className="mono" style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>$159,200</td><td className="mono" style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>$0</td><td className="mono" style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: 'var(--status-critical)' }}>$19,450</td><td className="mono" style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>$0</td><td className="mono" style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>$178,650</td></tr>
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-mid)', fontSize: 13 }}>Report renders with full drill-down to transactions. Click any row to see transaction detail.</div>
          )}
        </GlassPanel>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeader title="Reports Center" icon="reports" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ padding: '5px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 200 }} />
          <button onClick={() => showToast('Hermes: What report do you need?')} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⟡</span> AI Report
          </button>
        </div>
      </div>

      {filtered ? (
        <GlassPanel style={{ padding: 0 }}>
          {filtered.map((r, i) => (
            <button key={i} onClick={() => setSelectedReport(r.name)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', color: 'var(--text-high)', fontSize: 12 }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <span style={{ flex: 1 }}>{r.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.cat}</span>
              <span style={{ color: 'var(--text-low)', fontSize: 10 }}>›</span>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No reports match your search</div>}
        </GlassPanel>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {reportGroups.map((g, gi) => (
            <GlassPanel key={gi} style={{ borderLeft: gi === reportGroups.length - 1 ? '3px solid var(--brand)' : undefined }}>
              <div className="label-sm" style={{ marginBottom: 10, color: gi === reportGroups.length - 1 ? 'var(--brand)' : 'var(--text-low)' }}>{g.cat}</div>
              {g.reports.map((r, ri) => (
                <button key={ri} onClick={() => setSelectedReport(r)} style={{ display: 'block', width: '100%', padding: '6px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', color: 'var(--text-mid)', fontSize: 12 }}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--brand)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-mid)'}>{r}</button>
              ))}
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Accounting Settings ── */
function FinanceSettings({ showToast }) {
  return (
    <div style={{ maxWidth: 700 }}>
      <SectionHeader title="Accounting Settings" icon="settings" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12, color: 'var(--brand)' }}>COMPANY</div>
          {[{l:'Fiscal Year Start',v:'January'},{l:'Accounting Method',v:'Accrual'},{l:'Account Numbering',v:'Enabled'},{l:'Currency',v:'USD'}].map((s,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{s.l}</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{s.v}</span>
            </div>
          ))}
        </GlassPanel>

        <GlassPanel style={{ borderLeft: '3px solid var(--status-warn)' }}>
          <div className="label-sm" style={{ marginBottom: 12, color: 'var(--status-warn)' }}>CLOSE THE BOOKS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Lock Date</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>May 31, 2026</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 10 }}>Transactions before this date are locked. Password required to edit.</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => showToast('Lock date updated')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Update Lock Date</button>
            <button onClick={() => showToast('Year-end close checklist opened')} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Year-End Close Checklist</button>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12, color: 'var(--brand)' }}>SALES TAX</div>
          {[{j:'Pennsylvania',r:'6.00%',a:true},{j:'New Jersey',r:'6.625%',a:true},{j:'New York State',r:'4.00%',a:true},{j:'NYC',r:'4.50%',a:true}].map((t,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ flex: 1, fontSize: 12 }}>{t.j}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, marginRight: 12 }}>{t.r}</span>
              <StatusBadge status="online" label="Active" />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => showToast('Tax liability report')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Tax Liability Report</button>
            <button onClick={() => showToast('Record tax payment')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Record Tax Payment</button>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12, color: 'var(--brand)' }}>1099 TRACKING</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 10 }}>4 vendors flagged for 1099. YTD payments tracked automatically from bills.</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => showToast('1099 detail report')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>1099 Detail Report</button>
            <button onClick={() => showToast('1099 e-file workflow')} style={{ padding: '5px 12px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Prep & E-File</button>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12, color: 'var(--brand)' }}>TRACKING DIMENSIONS</div>
          {[{d:'Classes',ex:'CCTV, Access Control, Alarm, Fire, AV, RMR',on:true},{d:'Locations',ex:'Main Office, Warehouse, Field',on:true},{d:'Tags',ex:'Government, Healthcare, Retail, Commercial',on:true}].map((t,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.d}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{t.ex}</div>
              </div>
              <div style={{ width: 28, height: 14, borderRadius: 7, background: t.on?'var(--status-ok)':'rgba(92,111,134,0.3)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: t.on?16:2, transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </GlassPanel>
      </div>
    </div>
  );
}

Object.assign(window, { FinanceProducts, FinanceCredits, FinanceBankFeed, FinanceReportsCenter, FinanceSettings });

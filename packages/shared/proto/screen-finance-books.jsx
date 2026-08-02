/* Finance Books — COA, GL, Statements, Reconciliation, Estimates, AP, Expenses + Modals/Drawers */


/* ── AP / Bills / Vendors ── */
function FinanceAP({ setDrawer, setModal, showToast }) {
  const [apTab, setApTab] = React.useState('bills');
  const DEMO_BILLS = [
    { num: 'BILL-420', vendor: 'ADI Global Distribution', amount: 8420, status: 'due', due: 'Jun 10, 2026', cat: 'Equipment', is1099: false },
    { num: 'BILL-418', vendor: 'Consolidated Electric', amount: 2480, status: 'paid', due: 'Jun 1, 2026', cat: 'Cable & Supply', is1099: false },
    { num: 'BILL-416', vendor: 'SafeNet Monitoring', amount: 1200, status: 'due', due: 'Jun 15, 2026', cat: 'Monitoring', is1099: true },
    { num: 'BILL-414', vendor: 'Mike\'s Electric (sub)', amount: 3200, status: 'overdue', due: 'May 25, 2026', cat: 'Subcontractor', is1099: true },
    { num: 'BILL-412', vendor: 'Verizon Business', amount: 680, status: 'due', due: 'Jun 20, 2026', cat: 'Telecom', is1099: false },
    { num: 'BILL-410', vendor: 'State Farm Insurance', amount: 4200, status: 'paid', due: 'May 15, 2026', cat: 'Insurance', is1099: false },
  ];
  const DEMO_VENDORS = [
    { name: 'ADI Global Distribution', balance: 8420, terms: 'Net 30', is1099: false, cat: 'Distributor', ytdSpend: 42800 },
    { name: 'Consolidated Electric', balance: 0, terms: 'Net 15', is1099: false, cat: 'Supply', ytdSpend: 18400 },
    { name: 'SafeNet Monitoring', balance: 1200, terms: 'Net 30', is1099: true, cat: 'Service', ytdSpend: 7200 },
    { name: 'Mike\'s Electric', balance: 3200, terms: 'Due on receipt', is1099: true, cat: 'Subcontractor', ytdSpend: 14600 },
    { name: 'Verizon Business', balance: 680, terms: 'Net 30', is1099: false, cat: 'Telecom', ytdSpend: 4080 },
  ];
  const pos = [
    { num: 'PO-1042', vendor: 'ADI Global', items: '12× Axis P3265-V, 2× XNR-6410', total: 16280, status: 'ordered', date: 'Jun 3' },
    { num: 'PO-1040', vendor: 'ADI Global', items: '20× HID iCLASS SE RK40', total: 6240, status: 'received', date: 'May 28' },
    { num: 'PO-1038', vendor: 'Consolidated', items: '8× Cat6A 1000ft', total: 2480, status: 'received', date: 'May 22' },
  ];

  // Live QuickBooks bills + vendors when synced; demo sets are the fallback.
  const fmtD = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const [bills, setBills] = React.useState(DEMO_BILLS);
  const [vendors, setVendors] = React.useState(DEMO_VENDORS);
  React.useEffect(() => {
    const q = window.__shieldQBO; if (!q) return;
    q.bills(500).then(r => { if (r && r.ok && r.data && r.data.length) setBills(r.data.map(b => ({
      num: b.doc_number || ('BILL-' + b.qbo_id), vendor: b.vendor_name || 'Vendor', amount: Number(b.total) || 0,
      status: b.status === 'open' ? 'due' : (b.status || 'due'), due: fmtD(b.due_date), cat: 'Bill', is1099: false,
    }))); });
    q.vendors(1000).then(r => { if (r && r.ok && r.data && r.data.length) setVendors(r.data.map(v => ({
      name: v.display_name || v.company_name || 'Vendor', balance: Number(v.balance) || 0, terms: '—',
      is1099: false, cat: '—', ytdSpend: 0,
    }))); });
  }, []);

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['bills','vendors','purchase-orders'].map(t => (
          <button key={t} onClick={() => setApTab(t)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, background: apTab===t?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${apTab===t?'var(--brand)':'var(--border-subtle)'}`, color: apTab===t?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{t.replace('-',' ')}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setModal({ type: apTab==='bills'?'new-bill':apTab==='vendors'?'new-vendor':'new-po' })} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New {apTab==='bills'?'Bill':apTab==='vendors'?'Vendor':'PO'}</button>
      </div>

      {apTab === 'bills' && (
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Bill #','Vendor','Category','Amount','Status','Due','1099','Actions'].map((h,i) => (
              <th key={i} style={{ textAlign: i===3?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{bills.map((b,i) => (
              <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{b.num}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{b.vendor}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{b.cat}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${b.amount.toLocaleString()}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={b.status==='paid'?'paid':b.status==='overdue'?'overdue':'pending'} /></td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: b.status==='overdue'?'var(--status-critical)':'var(--text-mid)' }}>{b.due}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: b.is1099?'var(--status-warn)':'var(--text-low)' }}>{b.is1099?'Yes':'—'}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  {b.status !== 'paid' && <button onClick={()=>showToast(`${b.num} marked as paid`)} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Pay</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}

      {apTab === 'vendors' && (
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Vendor','Category','Terms','Balance Due','YTD Spend','1099'].map((h,i) => (
              <th key={i} style={{ textAlign: i>=3?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{vendors.map((v,i) => (
              <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500 }}>{v.name}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{v.cat}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{v.terms}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right', color: v.balance>0?'var(--status-warn)':'var(--text-low)' }}>{v.balance>0?`$${v.balance.toLocaleString()}`:'—'}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>${v.ytdSpend.toLocaleString()}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: v.is1099?'var(--status-warn)':'var(--text-low)' }}>{v.is1099?'1099':'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}

      {apTab === 'purchase-orders' && (
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['PO #','Vendor','Items','Total','Status','Date','Actions'].map((h,i) => (
              <th key={i} style={{ textAlign: i===3?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{pos.map((p,i) => (
              <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{p.num}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{p.vendor}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.items}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${p.total.toLocaleString()}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={p.status==='received'?'online':'info'} label={p.status} /></td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{p.date}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  {p.status==='ordered' && <button onClick={()=>showToast('Marked as received → inventory updated')} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Receive</button>}
                  {p.status==='received' && <button onClick={()=>showToast('Converted to Bill')} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Bill</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}

/* ── Expenses with AI Receipt OCR ── */
function FinanceExpenses({ setModal, showToast }) {
  const [ocrDemo, setOcrDemo] = React.useState(false);
  const DEMO_EXPENSES = [
    { id: 'EXP-201', employee: 'Mike Reyes', date: 'Jun 5', vendor: 'Shell Gas Station', amount: 127.50, cat: 'Vehicle / Fuel', status: 'pending', receipt: true },
    { id: 'EXP-200', employee: 'Jessica Liu', date: 'Jun 4', vendor: 'Home Depot', amount: 342.80, cat: 'Materials', status: 'approved', receipt: true },
    { id: 'EXP-199', employee: 'Kevin White', date: 'Jun 3', vendor: 'Lowes', amount: 89.40, cat: 'Materials', status: 'approved', receipt: true },
    { id: 'EXP-198', employee: 'Tony Garcia', date: 'Jun 2', vendor: 'Costco Gas', amount: 94.20, cat: 'Vehicle / Fuel', status: 'approved', receipt: true },
    { id: 'EXP-197', employee: 'Diana Patel', date: 'Jun 1', vendor: 'Amazon Business', amount: 248.00, cat: 'Tools', status: 'pending', receipt: false },
  ];
  // Live QuickBooks expenses (Purchase txns) when synced; demo set is the fallback.
  const [expenses, setExpenses] = React.useState(DEMO_EXPENSES);
  React.useEffect(() => {
    const q = window.__shieldQBO; if (!q) return;
    q.purchases(500).then(r => { if (r && r.ok && r.data && r.data.length) setExpenses(r.data.map(p => ({
      id: 'EXP-' + p.qbo_id,
      employee: p.entity_name || '—',
      date: p.txn_date ? new Date(p.txn_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
      vendor: p.entity_name || p.account_name || '—',
      amount: Number(p.total) || 0,
      cat: p.account_name || (p.payment_type ? p.payment_type + ' expense' : 'Expense'),
      status: 'approved', receipt: false,
    }))); });
  }, []);

  return (
    <div style={{ maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SectionHeader title="Expenses" icon="◈" count={expenses.length} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setOcrDemo(true)} style={{ padding: '6px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>⟡</span> Upload Receipt (AI OCR)
          </button>
          <button onClick={() => setModal({ type: 'new-expense' })} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Expense</button>
        </div>
      </div>

      {/* OCR Demo */}
      {ocrDemo && (
        <GlassPanel style={{ borderLeft: '3px solid var(--brand)', animation: 'fade-up 0.3s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>⟡</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>ShieldTech AI Receipt OCR</span>
            <button onClick={() => setOcrDemo(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 160, height: 120, borderRadius: 8, border: '2px dashed var(--border-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(63,169,245,0.03)' }} onClick={() => { setOcrDemo(false); showToast('Receipt scanned — expense auto-filled'); }}>
              <span style={{ fontSize: 24, opacity: 0.5 }}>◉</span>
              <span style={{ fontSize: 11, color: 'var(--brand)' }}>Drop receipt here</span>
              <span style={{ fontSize: 9, color: 'var(--text-low)' }}>or click to browse</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 8 }}>
                Upload a receipt photo or PDF. ShieldTech AI will extract vendor, amount, date, and category automatically. Review and approve the expense in one click.
              </p>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-low)' }}>
                <span>✓ Auto vendor match</span>
                <span>✓ Amount extraction</span>
                <span>✓ Category suggestion</span>
                <span>✓ Duplicate detection</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      )}

      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['ID','Employee','Date','Vendor','Category','Amount','Receipt','Status',''].map((h,i) => (
            <th key={i} style={{ textAlign: i===5?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{expenses.map((e,i) => (
            <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{e.id}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{e.employee}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{e.date}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{e.vendor}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{e.cat}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${e.amount.toLocaleString()}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: e.receipt?'var(--status-ok)':'var(--status-warn)' }}>{e.receipt?'✓ Attached':'Missing'}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={e.status==='approved'?'online':'pending'} label={e.status} /></td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                {e.status === 'pending' && <button onClick={()=>showToast(`${e.id} approved`)} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Approve</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Chart of Accounts ── */
function FinanceCOA({ setModal, showToast }) {
  const DEMO_ACCOUNTS = [
    { num: '1000', name: 'Business Checking', type: 'Asset', sub: 'Bank', balance: 482600, active: true },
    { num: '1100', name: 'Savings / Reserve', type: 'Asset', sub: 'Bank', balance: 125000, active: true },
    { num: '1200', name: 'Accounts Receivable', type: 'Asset', sub: 'Current Asset', balance: 175950, active: true },
    { num: '1300', name: 'Inventory', type: 'Asset', sub: 'Current Asset', balance: 48200, active: true },
    { num: '1500', name: 'Vehicles', type: 'Asset', sub: 'Fixed Asset', balance: 186000, active: true },
    { num: '1510', name: 'Equipment', type: 'Asset', sub: 'Fixed Asset', balance: 42000, active: true },
    { num: '2000', name: 'Accounts Payable', type: 'Liability', sub: 'Current', balance: -36220, active: true },
    { num: '2100', name: 'Credit Card', type: 'Liability', sub: 'Current', balance: -8400, active: true },
    { num: '2500', name: 'Vehicle Loans', type: 'Liability', sub: 'Long-term', balance: -124000, active: true },
    { num: '3000', name: 'Owner\'s Equity', type: 'Equity', sub: '', balance: -580000, active: true },
    { num: '3100', name: 'Retained Earnings', type: 'Equity', sub: '', balance: -220000, active: true },
    { num: '4000', name: 'Installation Revenue', type: 'Income', sub: 'Revenue', balance: -842000, active: true },
    { num: '4100', name: 'Service Revenue', type: 'Income', sub: 'Revenue', balance: -186000, active: true },
    { num: '4200', name: 'Recurring Revenue (RMR)', type: 'Income', sub: 'Revenue', balance: -171200, active: true },
    { num: '5000', name: 'Cost of Goods Sold', type: 'Expense', sub: 'COGS', balance: 428000, active: true },
    { num: '6000', name: 'Payroll Expenses', type: 'Expense', sub: 'Operating', balance: 312000, active: true },
    { num: '6100', name: 'Vehicle Expenses', type: 'Expense', sub: 'Operating', balance: 24800, active: true },
    { num: '6200', name: 'Insurance', type: 'Expense', sub: 'Operating', balance: 18400, active: true },
    { num: '6300', name: 'Office & Admin', type: 'Expense', sub: 'Operating', balance: 8600, active: true },
  ];
  // Live Chart of Accounts from QuickBooks when synced; demo set is the fallback.
  const clsMap = { Asset: 'Asset', Liability: 'Liability', Equity: 'Equity', Revenue: 'Income', Expense: 'Expense' };
  const mapAcct = (a) => ({
    num: a.acct_num || '—',
    name: a.name || 'Account',
    type: clsMap[a.classification] || (a.account_type || '').replace(/.*(Asset|Liability|Equity|Income|Expense).*/i, '$1') || 'Asset',
    sub: a.account_subtype || a.account_type || '',
    balance: Number(a.current_balance) || 0,
    active: a.active !== false,
  });
  const [accounts, setAccounts] = React.useState(DEMO_ACCOUNTS);
  React.useEffect(() => {
    const q = window.__shieldQBO; if (!q) return;
    q.accounts(500).then(r => { if (r && r.ok && r.data && r.data.length) setAccounts(r.data.map(mapAcct)); });
  }, []);
  const typeColors = { Asset: 'var(--brand)', Liability: 'var(--status-warn)', Equity: '#c084fc', Income: 'var(--status-ok)', Expense: 'var(--status-critical)' };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeader title="Chart of Accounts" icon="⊡" count={accounts.length} />
        <button onClick={() => setModal({ type: 'new-account' })} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Account</button>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#','Account Name','Type','Sub-type','Balance'].map((h,i) => (
            <th key={i} style={{ textAlign: i===4?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{accounts.map((a,i) => (
            <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{a.num}</td>
              <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500 }}>{a.name}</td>
              <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${typeColors[a.type]}12`, color: typeColors[a.type], fontWeight: 600, textTransform: 'uppercase' }}>{a.type}</span>
              </td>
              <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{a.sub || '—'}</td>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right', color: a.balance<0?'var(--status-ok)':'var(--text-high)' }}>{a.balance<0?`($${Math.abs(a.balance).toLocaleString()})`:`$${a.balance.toLocaleString()}`}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── General Ledger ── */
function FinanceGL() {
  const entries = [
    { date: 'Jun 5', ref: 'JE-1042', desc: 'Payment received — City Hall', debit: '1000 Checking', credit: '1200 AR', amount: 22100, auto: true },
    { date: 'Jun 5', ref: 'JE-1041', desc: 'Invoice #2865 — Marina Dental', debit: '1200 AR', credit: '4000 Revenue', amount: 24800, auto: true },
    { date: 'Jun 4', ref: 'JE-1040', desc: 'Bill payment — ADI Global', debit: '2000 AP', credit: '1000 Checking', amount: 2480, auto: true },
    { date: 'Jun 4', ref: 'JE-1039', desc: 'Stripe payout', debit: '1000 Checking', credit: '1150 Stripe', amount: 8400, auto: true },
    { date: 'Jun 3', ref: 'JE-1038', desc: 'Fuel expense — Mike Reyes', debit: '6100 Vehicle', credit: '2100 Credit Card', amount: 127.50, auto: true },
    { date: 'Jun 3', ref: 'JE-1037', desc: 'RMR Invoice — Westfield Mall', debit: '1200 AR', credit: '4200 RMR Revenue', amount: 5200, auto: true },
    { date: 'Jun 2', ref: 'JE-1036', desc: 'Payroll — 8 employees', debit: '6000 Payroll', credit: '1000 Checking', amount: 24680, auto: false },
    { date: 'Jun 1', ref: 'JE-1035', desc: 'Insurance premium', debit: '6200 Insurance', credit: '1000 Checking', amount: 4200, auto: false },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeader title="General Ledger" icon="⊞" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Filter by account..." style={{ padding: '5px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 180 }} />
          <button onClick={() => shieldToast('New journal entry — opening editor', 'info')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Journal Entry</button>
        </div>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Date','Ref','Description','Debit Account','Credit Account','Amount','Source'].map((h,i) => (
            <th key={i} style={{ textAlign: i===5?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{entries.map((e,i) => (
            <tr key={i} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{e.date}</td>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{e.ref}</td>
              <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{e.desc}</td>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{e.debit}</td>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{e.credit}</td>
              <td className="mono" style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${e.amount.toLocaleString()}</td>
              <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: e.auto?'var(--brand)':'var(--text-low)' }}>{e.auto?'Auto-posted':'Manual'}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Financial Statements ── */
function FinanceStatements() {
  const [stmt, setStmt] = React.useState('pl');
  const [period, setPeriod] = React.useState('mtd');

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{id:'pl',label:'P&L'},{id:'bs',label:'Balance Sheet'},{id:'cf',label:'Cash Flow'},{id:'tb',label:'Trial Balance'}].map(s => (
            <button key={s.id} onClick={()=>setStmt(s.id)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, background: stmt===s.id?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${stmt===s.id?'var(--brand)':'var(--border-subtle)'}`, color: stmt===s.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{s.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['mtd','qtd','ytd'].map(p => (
            <button key={p} onClick={()=>setPeriod(p)} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, background: period===p?'rgba(63,169,245,0.1)':'transparent', border: '1px solid var(--border-subtle)', color: period===p?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>{p}</button>
          ))}
          <button onClick={() => shieldToast('Exporting statement as PDF…')} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export PDF</button>
        </div>
      </div>

      <GlassPanel>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 300 }}>ShieldTech Solutions</div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{stmt==='pl'?'Profit & Loss':stmt==='bs'?'Balance Sheet':stmt==='cf'?'Statement of Cash Flows':'Trial Balance'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{period==='mtd'?'June 1–5, 2026':period==='qtd'?'Apr 1 – Jun 5, 2026':'Jan 1 – Jun 5, 2026'}</div>
        </div>

        {stmt === 'pl' && <PLStatement period={period} />}
        {stmt === 'bs' && <BSStatement />}
        {stmt === 'cf' && <CFStatement />}
        {stmt === 'tb' && <TBStatement />}
      </GlassPanel>
    </div>
  );
}

function PLStatement({ period }) {
  const mult = period==='mtd'?1:period==='qtd'?3:5;
  const rows = [
    { label: 'Revenue', indent: 0, bold: true },
    { label: 'Installation Revenue', indent: 1, value: 142000*mult },
    { label: 'Service Revenue', indent: 1, value: 62000*mult },
    { label: 'Recurring Revenue (RMR)', indent: 1, value: 51000*mult },
    { label: 'Maintenance Revenue', indent: 1, value: 29600*mult },
    { label: 'Total Revenue', indent: 0, bold: true, value: 284600*mult, border: true },
    { label: 'Cost of Goods Sold', indent: 0, bold: true },
    { label: 'Equipment & materials', indent: 1, value: -98400*mult },
    { label: 'Subcontractor labor', indent: 1, value: -28200*mult },
    { label: 'Monitoring costs', indent: 1, value: -16200*mult },
    { label: 'Total COGS', indent: 0, bold: true, value: -142800*mult, border: true },
    { label: 'Gross Profit', indent: 0, bold: true, value: 141800*mult, border: true, highlight: true },
    { label: 'Operating Expenses', indent: 0, bold: true },
    { label: 'Payroll & benefits', indent: 1, value: -38400*mult },
    { label: 'Vehicle expenses', indent: 1, value: -4200*mult },
    { label: 'Insurance', indent: 1, value: -3800*mult },
    { label: 'Rent & utilities', indent: 1, value: -6200*mult },
    { label: 'Software & subscriptions', indent: 1, value: -2800*mult },
    { label: 'Marketing', indent: 1, value: -3400*mult },
    { label: 'Other operating', indent: 1, value: -2300*mult },
    { label: 'Total Operating', indent: 0, bold: true, value: -61100*mult, border: true },
    { label: 'Net Income', indent: 0, bold: true, value: 80700*mult, border: true, highlight: true },
  ];
  return (
    <div>{rows.map((r,i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: `${r.bold?'7px':'4px'} 0`, paddingLeft: r.indent*20, borderTop: r.border?'1px solid var(--border-subtle)':'none', borderBottom: r.highlight?'2px solid var(--border-strong)':'none' }}>
        <span style={{ fontSize: 12, color: r.highlight?'var(--text-high)':'var(--text-mid)', fontWeight: r.bold?600:400 }}>{r.label}</span>
        {r.value !== undefined && <span className="mono" style={{ fontSize: 12, fontWeight: r.bold?600:400, color: r.value<0?'var(--text-mid)':r.highlight?'var(--status-ok)':'var(--text-high)' }}>{r.value<0?`(${Math.abs(r.value).toLocaleString()})`:r.value.toLocaleString()}</span>}
      </div>
    ))}</div>
  );
}

function BSStatement() {
  const sections = [
    { title: 'ASSETS', items: [{ label: 'Checking', value: 482600 },{ label: 'Savings', value: 125000 },{ label: 'Accounts Receivable', value: 175950 },{ label: 'Inventory', value: 48200 },{ label: 'Vehicles (net)', value: 142000 },{ label: 'Equipment (net)', value: 38000 }], total: 1011750 },
    { title: 'LIABILITIES', items: [{ label: 'Accounts Payable', value: 36220 },{ label: 'Credit Card', value: 8400 },{ label: 'Vehicle Loans', value: 124000 },{ label: 'Sales Tax Payable', value: 4200 }], total: 172820 },
    { title: 'EQUITY', items: [{ label: 'Owner\'s Equity', value: 580000 },{ label: 'Retained Earnings', value: 178230 },{ label: 'Current Year Earnings', value: 80700 }], total: 838930 },
  ];
  return (
    <div>{sections.map((s,si) => (
      <div key={si} style={{ marginBottom: 16 }}>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>{s.title}</div>
        {s.items.map((item,i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 16px' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.label}</span>
            <span className="mono" style={{ fontSize: 12 }}>${item.value.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Total {s.title.charAt(0)+s.title.slice(1).toLowerCase()}</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>${s.total.toLocaleString()}</span>
        </div>
      </div>
    ))}</div>
  );
}
function CFStatement() {
  const sections = [
    { title: 'OPERATING ACTIVITIES', items: [{ label: 'Net Income', value: 80700 },{ label: 'Depreciation', value: 4200 },{ label: 'Change in AR', value: -18400 },{ label: 'Change in AP', value: 6200 },{ label: 'Change in Inventory', value: -3800 }], total: 68900 },
    { title: 'INVESTING ACTIVITIES', items: [{ label: 'Equipment purchases', value: -8400 }], total: -8400 },
    { title: 'FINANCING ACTIVITIES', items: [{ label: 'Loan payments', value: -12400 },{ label: 'Owner draws', value: -10000 }], total: -22400 },
  ];
  return (
    <div>{sections.map((s,si) => (
      <div key={si} style={{ marginBottom: 16 }}>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>{s.title}</div>
        {s.items.map((item,i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 16px' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.label}</span>
            <span className="mono" style={{ fontSize: 12, color: item.value<0?'var(--status-critical)':'var(--text-high)' }}>{item.value<0?`(${Math.abs(item.value).toLocaleString()})`:`$${item.value.toLocaleString()}`}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Net {s.title.split(' ')[0]}</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: s.total<0?'var(--status-critical)':'var(--status-ok)' }}>{s.total<0?`(${Math.abs(s.total).toLocaleString()})`:`$${s.total.toLocaleString()}`}</span>
        </div>
      </div>
    ))}
    <div style={{ borderTop: '2px solid var(--border-strong)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Net Change in Cash</span>
      <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-ok)' }}>$38,100</span>
    </div></div>
  );
}
function TBStatement() {
  const accts = [
    { num: '1000', name: 'Checking', debit: 482600, credit: 0 },
    { num: '1200', name: 'Accounts Receivable', debit: 175950, credit: 0 },
    { num: '2000', name: 'Accounts Payable', debit: 0, credit: 36220 },
    { num: '3000', name: 'Owner\'s Equity', debit: 0, credit: 580000 },
    { num: '4000', name: 'Installation Revenue', debit: 0, credit: 842000 },
    { num: '4200', name: 'RMR Revenue', debit: 0, credit: 171200 },
    { num: '5000', name: 'COGS', debit: 428000, credit: 0 },
    { num: '6000', name: 'Payroll', debit: 312000, credit: 0 },
  ];
  const totalD = accts.reduce((s,a)=>s+a.debit,0), totalC = accts.reduce((s,a)=>s+a.credit,0);
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Account','Name','Debit','Credit'].map((h,i) => (
          <th key={i} style={{ textAlign: i>=2?'right':'left', padding: '8px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
        ))}</tr></thead>
        <tbody>
          {accts.map((a,i) => (
            <tr key={i}><td className="mono" style={{ padding: '6px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{a.num}</td><td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{a.name}</td><td className="mono" style={{ padding: '6px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>{a.debit?`$${a.debit.toLocaleString()}`:''}</td><td className="mono" style={{ padding: '6px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>{a.credit?`$${a.credit.toLocaleString()}`:''}</td></tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--border-strong)' }}><td colSpan="2" style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Totals</td><td className="mono" style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>${totalD.toLocaleString()}</td><td className="mono" style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>${totalC.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 4, background: totalD===totalC?'rgba(52,211,153,0.06)':'rgba(244,63,94,0.06)', textAlign: 'center', fontSize: 11, color: totalD===totalC?'var(--status-ok)':'var(--status-critical)', fontWeight: 600 }}>
        {totalD===totalC?'✓ Trial balance is in balance':'✗ Trial balance is out of balance'}
      </div>
    </div>
  );
}

/* ── Bank Reconciliation ── */
function FinanceReconcile({ showToast }) {
  const [cleared, setCleared] = React.useState({});
  const txns = [
    { id: 1, date: 'Jun 5', desc: 'Deposit — City Hall payment', amount: 22100, type: 'deposit' },
    { id: 2, date: 'Jun 4', desc: 'Stripe payout', amount: 8400, type: 'deposit' },
    { id: 3, date: 'Jun 4', desc: 'ADI Global — equipment', amount: -2480, type: 'check' },
    { id: 4, date: 'Jun 3', desc: 'Payroll — 8 employees', amount: -24680, type: 'check' },
    { id: 5, date: 'Jun 2', desc: 'Deposit — Westfield Mall', amount: 31800, type: 'deposit' },
    { id: 6, date: 'Jun 1', desc: 'Insurance premium', amount: -4200, type: 'check' },
  ];
  const stmtBalance = 513440;
  const clearedTotal = txns.filter(t => cleared[t.id]).reduce((s,t) => s + t.amount, 0);
  const diff = stmtBalance - (482600 + clearedTotal);

  return (
    <div style={{ maxWidth: 1000 }}>
      <SectionHeader title="Bank Reconciliation" icon="◎" />
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <GlassPanel style={{ flex: 1, textAlign: 'center' }}>
          <div className="label-sm" style={{ marginBottom: 4 }}>STATEMENT BALANCE</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>${stmtBalance.toLocaleString()}</div>
        </GlassPanel>
        <GlassPanel style={{ flex: 1, textAlign: 'center' }}>
          <div className="label-sm" style={{ marginBottom: 4 }}>BOOK BALANCE</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>$482,600</div>
        </GlassPanel>
        <GlassPanel style={{ flex: 1, textAlign: 'center' }}>
          <div className="label-sm" style={{ marginBottom: 4 }}>DIFFERENCE</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: Math.abs(diff)<1?'var(--status-ok)':'var(--status-critical)' }}>${Math.abs(diff).toLocaleString()}</div>
        </GlassPanel>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-mid)' }}>
          Check items that have cleared the bank
        </div>
        {txns.map(t => (
          <div key={t.id} onClick={() => setCleared(prev => ({...prev, [t.id]: !prev[t.id]}))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer', background: cleared[t.id]?'rgba(52,211,153,0.03)':'transparent' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, border: cleared[t.id]?'none':'1.5px solid var(--border-strong)', background: cleared[t.id]?'var(--status-ok)':'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>{cleared[t.id]?'✓':''}</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)', width: 48 }}>{t.date}</span>
            <span style={{ flex: 1, fontSize: 12 }}>{t.desc}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: t.amount<0?'var(--status-critical)':'var(--status-ok)' }}>{t.amount<0?`−$${Math.abs(t.amount).toLocaleString()}`:`+$${t.amount.toLocaleString()}`}</span>
          </div>
        ))}
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => showToast('Progress saved — finish later')} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Finish Later</button>
          <button onClick={() => showToast('Reconciliation complete ✓')} style={{ padding: '7px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reconcile</button>
        </div>
      </GlassPanel>
    </div>
  );
}


/* FinanceEstimates / FinanceModal / FinanceDrawer + the stale InvoiceBuilderModal
   chain were deleted — they silently dropped documents. The live equivalents are
   NIFinanceEstimates / NIFinanceModal / NIFinanceDrawer in screen-invoice-builder.jsx. */
Object.assign(window, { FinanceAP, FinanceExpenses, FinanceCOA, FinanceGL, FinanceStatements, FinanceReconcile, PLStatement, BSStatement, CFStatement, TBStatement });

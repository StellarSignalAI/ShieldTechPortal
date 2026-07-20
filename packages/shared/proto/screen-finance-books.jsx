/* Finance Books — COA, GL, Statements, Reconciliation, Estimates, AP, Expenses + Modals/Drawers */

/* ── Estimates ── */
function FinanceEstimates({ setModal, showToast }) {
  const estimates = [
    { num: 'EST-301', customer: 'Pinnacle Financial Group', amount: 128500, status: 'sent', date: 'Jun 4, 2026', expires: 'Jul 4, 2026' },
    { num: 'EST-298', customer: 'Bayshore Medical Center', amount: 94200, status: 'draft', date: 'Jun 2, 2026', expires: '—' },
    { num: 'EST-295', customer: 'Golden Gate Logistics', amount: 52000, status: 'sent', date: 'May 28, 2026', expires: 'Jun 28, 2026' },
    { num: 'EST-290', customer: 'Marina District Dental', amount: 24800, status: 'accepted', date: 'May 20, 2026', expires: '—' },
    { num: 'EST-288', customer: 'Redwood Community College', amount: 38000, status: 'expired', date: 'Apr 15, 2026', expires: 'May 15, 2026' },
  ];
  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeader title="Estimates" icon="◇" count={estimates.length} />
        <button onClick={() => setModal({ type: 'new-estimate' })} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Estimate</button>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Estimate','Customer','Amount','Status','Date','Expires','Actions'].map((h,i) => (
            <th key={i} style={{ textAlign: i===2?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{estimates.map((e,i) => (
            <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{e.num}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{e.customer}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${e.amount.toLocaleString()}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={e.status==='accepted'?'online':e.status==='sent'?'info':e.status==='draft'?'draft':'critical'} label={e.status} /></td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{e.date}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{e.expires}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', display: 'flex', gap: 4 }}>
                {e.status === 'accepted' && <button onClick={()=>showToast('Converted to Invoice INV-2870')} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Invoice</button>}
                {e.status === 'accepted' && <button onClick={()=>showToast('Converted to Proposal')} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Proposal</button>}
                {e.status === 'draft' && <button onClick={()=>showToast('Estimate sent')} style={{ padding: '3px 8px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── AP / Bills / Vendors ── */
function FinanceAP({ setDrawer, setModal, showToast }) {
  const [apTab, setApTab] = React.useState('bills');
  const bills = [
    { num: 'BILL-420', vendor: 'ADI Global Distribution', amount: 8420, status: 'due', due: 'Jun 10, 2026', cat: 'Equipment', is1099: false },
    { num: 'BILL-418', vendor: 'Consolidated Electric', amount: 2480, status: 'paid', due: 'Jun 1, 2026', cat: 'Cable & Supply', is1099: false },
    { num: 'BILL-416', vendor: 'SafeNet Monitoring', amount: 1200, status: 'due', due: 'Jun 15, 2026', cat: 'Monitoring', is1099: true },
    { num: 'BILL-414', vendor: 'Mike\'s Electric (sub)', amount: 3200, status: 'overdue', due: 'May 25, 2026', cat: 'Subcontractor', is1099: true },
    { num: 'BILL-412', vendor: 'Verizon Business', amount: 680, status: 'due', due: 'Jun 20, 2026', cat: 'Telecom', is1099: false },
    { num: 'BILL-410', vendor: 'State Farm Insurance', amount: 4200, status: 'paid', due: 'May 15, 2026', cat: 'Insurance', is1099: false },
  ];
  const vendors = [
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
  const expenses = [
    { id: 'EXP-201', employee: 'Mike Reyes', date: 'Jun 5', vendor: 'Shell Gas Station', amount: 127.50, cat: 'Vehicle / Fuel', status: 'pending', receipt: true },
    { id: 'EXP-200', employee: 'Jessica Liu', date: 'Jun 4', vendor: 'Home Depot', amount: 342.80, cat: 'Materials', status: 'approved', receipt: true },
    { id: 'EXP-199', employee: 'Kevin White', date: 'Jun 3', vendor: 'Lowes', amount: 89.40, cat: 'Materials', status: 'approved', receipt: true },
    { id: 'EXP-198', employee: 'Tony Garcia', date: 'Jun 2', vendor: 'Costco Gas', amount: 94.20, cat: 'Vehicle / Fuel', status: 'approved', receipt: true },
    { id: 'EXP-197', employee: 'Diana Patel', date: 'Jun 1', vendor: 'Amazon Business', amount: 248.00, cat: 'Tools', status: 'pending', receipt: false },
  ];

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
  const accounts = [
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

/* ── Finance Modal (Router) ── */
function FinanceModal({ modal, setModal, showToast }) {
  if (modal.type === 'new-invoice' || modal.type === 'new-estimate') {
    return <InvoiceBuilderModal modal={modal} setModal={setModal} showToast={showToast} />;
  }
  /* Fallback for other modal types */
  const titles = { 'new-bill': 'New Bill', 'new-vendor': 'New Vendor', 'new-po': 'New Purchase Order', 'new-expense': 'New Expense', 'new-account': 'New Account' };
  return (
    <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '80vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.25s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>{titles[modal.type] || 'New Item'}</span>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        {modal.type === 'new-account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="Account Number" placeholder="e.g. 6400" />
            <FormField label="Account Name" placeholder="e.g. Marketing Expenses" />
            <FormField label="Type" placeholder="Select type..." />
            <FormField label="Sub-type" placeholder="e.g. Operating" />
          </div>
        )}
        {(modal.type === 'new-bill' || modal.type === 'new-expense' || modal.type === 'new-vendor' || modal.type === 'new-po') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label={modal.type==='new-vendor'?'Vendor Name':'Vendor'} placeholder={modal.type==='new-vendor'?'e.g. ADI Global':'Select vendor...'} />
            {modal.type !== 'new-vendor' && <FormField label="Amount" placeholder="$0.00" />}
            {modal.type === 'new-vendor' && <><FormField label="Terms" placeholder="Net 30" /><FormField label="Category" placeholder="Distributor" /></>}
            {modal.type !== 'new-vendor' && <FormField label="Category" placeholder="Select category..." />}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={() => setModal(null)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { setModal(null); showToast('Created successfully'); }} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create</button>
        </div>
      </div>
    </div>
  );
}

/* ── Full Invoice Builder Modal ── */
function InvoiceBuilderModal({ modal, setModal, showToast }) {
  const isEstimate = modal.type === 'new-estimate';
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [itemPickerOpen, setItemPickerOpen] = React.useState(null);
  const [customer, setCustomer] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [terms, setTerms] = React.useState('net-30');
  const [dueDate, setDueDate] = React.useState('');
  const [quoteRef, setQuoteRef] = React.useState('');
  const [projectName, setProjectName] = React.useState('');
  const [poNumber, setPoNumber] = React.useState('');
  const [invoiceNum, setInvoiceNum] = React.useState(isEstimate ? 'EST-1001' : 'INV-2870');
  const [memo, setMemo] = React.useState('');

  /* Settings state */
  const [depositEnabled, setDepositEnabled] = React.useState(false);
  const [depositPct, setDepositPct] = React.useState(50);
  const [incrementalEnabled, setIncrementalEnabled] = React.useState(false);
  const [milestones, setMilestones] = React.useState([
    { name: 'Deposit', pct: 50 }, { name: 'Rough-in Complete', pct: 25 }, { name: 'Final Sign-off', pct: 25 }
  ]);
  const [lateReminders, setLateReminders] = React.useState([
    { days: 1, enabled: true, message: 'Friendly reminder: Invoice {num} was due yesterday.' },
    { days: 7, enabled: true, message: 'Your invoice {num} is now 7 days overdue. Please remit payment at your earliest convenience.' },
    { days: 14, enabled: true, message: 'Second notice: Invoice {num} is 14 days past due. A late fee may be applied.' },
    { days: 30, enabled: false, message: 'Final notice: Invoice {num} is 30 days past due. Please contact us immediately.' },
  ]);
  const [showCustomFields, setShowCustomFields] = React.useState(false);
  const [customFields, setCustomFields] = React.useState([]);
  const [taxRate, setTaxRate] = React.useState(7.25);
  const [discountPct, setDiscountPct] = React.useState(0);
  const [attachPdf, setAttachPdf] = React.useState(true);
  const [includePayLink, setIncludePayLink] = React.useState(true);

  /* Line items */
  const [lines, setLines] = React.useState([
    { desc: '', qty: 1, rate: 0, type: 'product', fromInventory: false }
  ]);
  const addLine = () => setLines(prev => [...prev, { desc: '', qty: 1, rate: 0, type: 'product', fromInventory: false }]);
  const removeLine = (idx) => setLines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const updateLine = (idx, field, val) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));

  /* Send state */
  const [sendEmails, setSendEmails] = React.useState([]);
  const [sendPhone, setSendPhone] = React.useState('');
  const [sendMethod, setSendMethod] = React.useState('email');
  const [emailMode, setEmailMode] = React.useState('ai');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailBody, setEmailBody] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');

  const subtotal = lines.reduce((s, l) => s + (l.qty * l.rate), 0);
  const discount = subtotal * (discountPct / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;
  const depositAmt = depositEnabled ? total * (depositPct / 100) : 0;

  /* Customer list for selector */
  const customers = [
    { name: 'Acme Dental Group', email: 'billing@acmedental.com', phone: '(215) 555-0142' },
    { name: 'Metro Bank Corp', email: 'ap@metrobank.com', phone: '(215) 555-0198' },
    { name: 'City Hall — Main', email: 'finance@cityhall.gov', phone: '(215) 555-0167' },
    { name: 'Riverside Medical', email: 'accounts@riversidemedical.com', phone: '(215) 555-0203' },
    { name: 'Pacific Rim Hotels', email: 'procurement@pacificrim.com', phone: '(215) 555-0189' },
    { name: 'Westfield Mall', email: 'security@westfieldmall.com', phone: '(215) 555-0221' },
    { name: 'Harbor View Condos', email: 'hoa@harborview.com', phone: '(215) 555-0234' },
  ];

  /* Inventory items */
  const inventory = [
    { name: 'Axis P3265-V Dome Camera', sku: 'CAM-AX-P3265V', rate: 890, type: 'product', stock: 12 },
    { name: 'Axis P3268-LV 4K Camera', sku: 'CAM-AX-P3268', rate: 1240, type: 'product', stock: 8 },
    { name: 'Hanwha XNR-6410 NVR (32ch)', sku: 'NVR-HW-6410', rate: 2800, type: 'product', stock: 4 },
    { name: 'Hanwha XNR-6420 NVR (64ch)', sku: 'NVR-HW-6420', rate: 4200, type: 'product', stock: 2 },
    { name: 'HID iCLASS SE Reader', sku: 'ACR-HID-SE', rate: 340, type: 'product', stock: 18 },
    { name: 'HID Signo Reader 40', sku: 'ACR-HID-SIG40', rate: 520, type: 'product', stock: 6 },
    { name: 'Mercury LP4502 Panel', sku: 'ACP-MRC-4502', rate: 1850, type: 'product', stock: 3 },
    { name: 'Cat6A Plenum Cable (1000ft)', sku: 'CBL-C6A-1K', rate: 420, type: 'product', stock: 24 },
    { name: 'Cat6 Plenum Cable (1000ft)', sku: 'CBL-C6-1K', rate: 280, type: 'product', stock: 30 },
    { name: 'Network Switch 24-port PoE+', sku: 'NET-SW-24P', rate: 680, type: 'product', stock: 5 },
    { name: 'UPS 1500VA Rack Mount', sku: 'PWR-UPS-1500', rate: 540, type: 'product', stock: 7 },
    { name: 'Installation Labor (per hour)', sku: 'SVC-LABOR-HR', rate: 125, type: 'service' },
    { name: 'Project Management (per hour)', sku: 'SVC-PM-HR', rate: 150, type: 'service' },
    { name: 'Programming & Commissioning', sku: 'SVC-PROG', rate: 185, type: 'service' },
    { name: 'Site Survey', sku: 'SVC-SURVEY', rate: 450, type: 'service' },
    { name: 'Emergency Service Call', sku: 'SVC-EMERG', rate: 350, type: 'service' },
    { name: 'Quarterly PM Visit', sku: 'SVC-PM-QTR', rate: 1200, type: 'service' },
    { name: 'Annual Maintenance Agreement', sku: 'SVC-AMA', rate: 4800, type: 'service' },
  ];

  /* Auto-set due date when terms change */
  React.useEffect(() => {
    const today = new Date();
    const daysMap = { 'due-receipt': 0, 'due-immediately': 0, 'net-10': 10, 'net-15': 15, 'net-30': 30, 'net-45': 45, 'net-60': 60, 'net-90': 90, '2-10-net-30': 30, 'custom': 0 };
    const days = daysMap[terms] || 30;
    const due = new Date(today.getTime() + days * 86400000);
    if (terms !== 'custom') setDueDate(due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, [terms]);

  /* Auto-populate emails when customer selected */
  const handleCustomerSelect = (name) => {
    setCustomer(name);
    const c = customers.find(c => c.name === name);
    if (c) {
      setCustomerEmail(c.email);
      setSendEmails([c.email]);
      setSendPhone(c.phone);
      setEmailSubject(`Invoice ${invoiceNum} from ShieldTech Solutions`);
      setEmailBody(`Hi ${name.split(' ')[0]},\n\nPlease find attached invoice ${invoiceNum} for $${total.toLocaleString()}.\n\nPayment is due ${dueDate}. You can pay securely online using the link below.\n\nThank you for your business.\n\nBest regards,\nShieldTech Solutions`);
    }
  };

  const selectInvItem = (lineIdx, item) => {
    updateLine(lineIdx, 'desc', item.name);
    updateLine(lineIdx, 'rate', item.rate);
    updateLine(lineIdx, 'type', item.type);
    updateLine(lineIdx, 'fromInventory', item.type === 'product');
    setItemPickerOpen(null);
  };

  const fmtMoney = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inputStyle = { width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const labelStyle = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 4 };
  const btnSecondary = { padding: '7px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' };
  const btnPrimary = { padding: '7px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };

  return (
    <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 780, maxHeight: '92vh', overflow: 'auto', padding: 0, animation: 'fade-up 0.2s ease both' }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'var(--modal)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="display" style={{ fontSize: 17, fontWeight: 500 }}>{isEstimate ? 'New Estimate' : 'New Invoice'}</span>
            <input value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} style={{ width: 100, padding: '3px 8px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setSettingsOpen(!settingsOpen)} title="Invoice Settings" style={{ width: 32, height: 32, borderRadius: 6, background: settingsOpen ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${settingsOpen ? 'var(--brand)' : 'var(--border-subtle)'}`, color: settingsOpen ? 'var(--brand)' : 'var(--text-low)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙</button>
            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          {/* ─── MAIN FORM ─── */}
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Customer + Quote + Project */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 2 }}>
                <div style={labelStyle}>Customer</div>
                <select value={customer} onChange={e => handleCustomerSelect(e.target.value)} style={selectStyle}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Quote / Ref #</div>
                <input value={quoteRef} onChange={e => setQuoteRef(e.target.value)} placeholder="QT-1001 or ref" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Project Name</div>
                <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Metro Bank Camera Expansion" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>PO Number</div>
                <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Customer PO (optional)" style={inputStyle} />
              </div>
            </div>

            {/* Terms + Due Date */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Payment Terms</div>
                <select value={terms} onChange={e => setTerms(e.target.value)} style={selectStyle}>
                  <option value="due-immediately">Due Immediately</option>
                  <option value="due-receipt">Due on Receipt</option>
                  <option value="net-10">Net 10</option>
                  <option value="net-15">Net 15</option>
                  <option value="net-30">Net 30</option>
                  <option value="net-45">Net 45</option>
                  <option value="net-60">Net 60</option>
                  <option value="net-90">Net 90</option>
                  <option value="2-10-net-30">2/10 Net 30 (2% early pay)</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Due Date</div>
                <input value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="Auto-calculated" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Invoice Date</div>
                <input defaultValue={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} style={inputStyle} />
              </div>
            </div>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {customFields.map((f, i) => (
                  <div key={i} style={{ flex: '1 1 200px' }}>
                    <div style={labelStyle}>{f.name}</div>
                    <input placeholder={`Enter ${f.name.toLowerCase()}...`} style={inputStyle} />
                  </div>
                ))}
              </div>
            )}

            {/* ─── LINE ITEMS ─── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={labelStyle}>LINE ITEMS</div>
              </div>
              {/* Column headers */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 4, padding: '0 4px' }}>
                <span style={{ flex: 3, fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 600 }}>Description</span>
                <span style={{ width: 140, fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 600 }}>Product / Service</span>
                <span style={{ width: 55, fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 600 }}>Qty</span>
                <span style={{ width: 80, fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 600 }}>Rate</span>
                <span style={{ width: 80, fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Amount</span>
                <span style={{ width: 24 }}></span>
              </div>

              {lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', position: 'relative' }}>
                  <input value={line.desc} onChange={e => updateLine(i, 'desc', e.target.value)} placeholder="Description..." style={{ ...inputStyle, flex: 3 }} />
                  {/* Inventory / Service picker */}
                  <div style={{ width: 140, position: 'relative' }}>
                    <button onClick={() => setItemPickerOpen(itemPickerOpen === i ? null : i)} style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', color: line.fromInventory ? 'var(--brand)' : line.type === 'service' ? 'var(--status-ok)' : 'var(--text-low)', fontSize: 10, padding: '7px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{line.fromInventory ? '⊞ Inventory' : line.type === 'service' ? '⚙ Service' : '⊕ Pick item'}</span>
                      <span style={{ fontSize: 8 }}>▾</span>
                    </button>
                    {itemPickerOpen === i && (
                      <InvItemPicker inventory={inventory} onSelect={(item) => selectInvItem(i, item)} onClose={() => setItemPickerOpen(null)} onNewProduct={(t) => { updateLine(i, 'type', t); updateLine(i, 'fromInventory', t === 'product'); setItemPickerOpen(null); showToast(t === 'product' ? 'New product — will be saved to inventory' : 'Service item — will not save to inventory'); }} />
                    )}
                  </div>
                  <input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: 55, textAlign: 'center' }} />
                  <input type="number" value={line.rate || ''} onChange={e => updateLine(i, 'rate', parseFloat(e.target.value) || 0)} placeholder="0.00" style={{ ...inputStyle, width: 80, fontFamily: 'var(--font-mono)' }} />
                  <div className="mono" style={{ width: 80, textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{fmtMoney(line.qty * line.rate)}</div>
                  <button onClick={() => removeLine(i)} style={{ width: 24, height: 24, borderRadius: 4, background: 'none', border: '1px solid transparent', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--status-critical)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-low)'; e.currentTarget.style.borderColor = 'transparent'; }}>✕</button>
                </div>
              ))}
              <button onClick={addLine} style={{ padding: '5px 12px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 2 }}>+ Add Line Item</button>
            </div>

            {/* ─── TOTALS ─── */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-mid)' }}>Subtotal</span>
                  <span className="mono" style={{ fontWeight: 500 }}>{fmtMoney(subtotal)}</span>
                </div>
                {discountPct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: 'var(--status-ok)' }}>Discount ({discountPct}%)</span>
                    <span className="mono" style={{ color: 'var(--status-ok)' }}>−{fmtMoney(discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-mid)' }}>Tax</span>
                    <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} style={{ width: 45, padding: '2px 4px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-high)', fontSize: 10, fontFamily: 'var(--font-mono)', outline: 'none', textAlign: 'center' }} /><span style={{ fontSize: 10, color: 'var(--text-low)' }}>%</span>
                  </div>
                  <span className="mono" style={{ fontWeight: 500 }}>{fmtMoney(tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', fontSize: 14, borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)' }}>{fmtMoney(total)}</span>
                </div>
                {depositEnabled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: 'var(--status-warn)' }}>Deposit due ({depositPct}%)</span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--status-warn)' }}>{fmtMoney(depositAmt)}</span>
                  </div>
                )}
                {incrementalEnabled && (
                  <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Payment Schedule</div>
                    {milestones.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
                        <span style={{ color: 'var(--text-mid)' }}>{m.name} ({m.pct}%)</span>
                        <span className="mono" style={{ color: 'var(--text-high)' }}>{fmtMoney(total * m.pct / 100)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Memo */}
            <div>
              <div style={labelStyle}>Notes / Memo</div>
              <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="Visible to customer on the invoice..." rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            {/* Discount row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Discount %</div>
                <input type="number" value={discountPct || ''} onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ flex: 2 }}></div>
            </div>

            {/* ─── FOOTER ACTIONS ─── */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <button onClick={() => setModal(null)} style={btnSecondary}>Cancel</button>
              <button onClick={() => { setModal(null); showToast(`${isEstimate ? 'Estimate' : 'Invoice'} saved as draft`); }} style={{ ...btnSecondary, color: 'var(--brand)', borderColor: 'var(--brand)' }}>Save Draft</button>
              <button onClick={() => setSendOpen(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>↗</span> Send {isEstimate ? 'Estimate' : 'Invoice'}
              </button>
            </div>
          </div>

          {/* ─── SETTINGS PANEL (Slide-in) ─── */}
          {settingsOpen && (
            <div style={{ width: 300, borderLeft: '1px solid var(--border-subtle)', padding: '16px 18px', overflow: 'auto', maxHeight: '85vh', background: 'rgba(5,7,10,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Invoice Settings</span>
                <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 14, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Deposit */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                  <InvToggle active={depositEnabled} onToggle={() => setDepositEnabled(!depositEnabled)} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Require Deposit</span>
                </label>
                {depositEnabled && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 40, marginTop: 4 }}>
                    <input type="number" value={depositPct} onChange={e => setDepositPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} style={{ ...inputStyle, width: 60, textAlign: 'center' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-low)' }}>% of total = {fmtMoney(total * depositPct / 100)}</span>
                  </div>
                )}
              </div>

              {/* Incremental / Milestone Payments */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                  <InvToggle active={incrementalEnabled} onToggle={() => setIncrementalEnabled(!incrementalEnabled)} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Milestone Payments</span>
                </label>
                {incrementalEnabled && (
                  <div style={{ marginLeft: 40 }}>
                    {milestones.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                        <input value={m.name} onChange={e => { const next = [...milestones]; next[i].name = e.target.value; setMilestones(next); }} style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
                        <input type="number" value={m.pct} onChange={e => { const next = [...milestones]; next[i].pct = parseInt(e.target.value) || 0; setMilestones(next); }} style={{ ...inputStyle, width: 45, textAlign: 'center', fontSize: 11 }} />
                        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>%</span>
                        <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 10 }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <button onClick={() => setMilestones(prev => [...prev, { name: 'Milestone', pct: 0 }])} style={{ padding: '3px 8px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add</button>
                      <span className="mono" style={{ fontSize: 10, color: milestones.reduce((s,m) => s+m.pct, 0) === 100 ? 'var(--status-ok)' : 'var(--status-critical)' }}>
                        {milestones.reduce((s,m) => s+m.pct, 0)}% / 100%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0 12px' }} />

              {/* Late Reminders */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Late Payment Reminders</div>
                {lateReminders.map((r, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}>
                      <InvToggle active={r.enabled} onToggle={() => { const next = [...lateReminders]; next[i].enabled = !next[i].enabled; setLateReminders(next); }} />
                      <span style={{ fontSize: 11, color: r.enabled ? 'var(--text-high)' : 'var(--text-low)' }}>
                        {r.days === 1 ? '1 day after due' : `${r.days} days after due`}
                      </span>
                    </label>
                    {r.enabled && (
                      <textarea value={r.message} onChange={e => { const next = [...lateReminders]; next[i].message = e.target.value; setLateReminders(next); }} rows={2} style={{ ...inputStyle, marginLeft: 40, width: 'calc(100% - 40px)', fontSize: 10, lineHeight: 1.4, resize: 'vertical' }} />
                    )}
                  </div>
                ))}
                <button onClick={() => setLateReminders(prev => [...prev, { days: prev.length > 0 ? prev[prev.length-1].days + 7 : 7, enabled: true, message: 'Invoice {num} is past due. Please remit payment.' }])} style={{ padding: '3px 8px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', marginLeft: 40 }}>+ Add Reminder</button>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0 12px' }} />

              {/* Custom Fields */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Custom Fields</div>
                {customFields.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <input value={f.name} onChange={e => { const next = [...customFields]; next[i].name = e.target.value; setCustomFields(next); }} placeholder="Field name" style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
                    <button onClick={() => setCustomFields(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 10 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setCustomFields(prev => [...prev, { name: '' }])} style={{ padding: '3px 8px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Custom Field</button>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0 12px' }} />

              {/* Misc settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <InvToggle active={attachPdf} onToggle={() => setAttachPdf(!attachPdf)} />
                  <span style={{ fontSize: 11 }}>Attach PDF to email</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <InvToggle active={includePayLink} onToggle={() => setIncludePayLink(!includePayLink)} />
                  <span style={{ fontSize: 11 }}>Include Stripe pay link</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ─── SEND MODAL ─── */}
        {sendOpen && <InvoiceSendModal
          invoiceNum={invoiceNum} customer={customer} total={total} dueDate={dueDate}
          sendEmails={sendEmails} setSendEmails={setSendEmails}
          sendPhone={sendPhone} setSendPhone={setSendPhone}
          sendMethod={sendMethod} setSendMethod={setSendMethod}
          emailMode={emailMode} setEmailMode={setEmailMode}
          emailSubject={emailSubject} setEmailSubject={setEmailSubject}
          emailBody={emailBody} setEmailBody={setEmailBody}
          newEmail={newEmail} setNewEmail={setNewEmail}
          customerEmail={customerEmail} attachPdf={attachPdf} includePayLink={includePayLink}
          onClose={() => setSendOpen(false)}
          onSend={() => { setSendOpen(false); setModal(null); showToast(`${isEstimate ? 'Estimate' : 'Invoice'} ${invoiceNum} sent to ${customer}`); }}
          showToast={showToast}
        />}
      </div>
    </div>
  );
}

/* ── Inventory / Service Item Picker ── */
function InvItemPicker({ inventory, onSelect, onClose, onNewProduct }) {
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const filtered = inventory.filter(item => {
    if (tab === 'products' && item.type !== 'product') return false;
    if (tab === 'services' && item.type !== 'service') return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 340, maxHeight: 320, background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden', animation: 'fade-up 0.12s ease both' }}>
      {/* Search + tabs */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." style={{ width: '100%', padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', marginBottom: 6 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['all','products','services'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 9, background: tab===t?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${tab===t?'var(--brand)':'transparent'}`, color: tab===t?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>
      {/* Items */}
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {filtered.map((item, i) => (
          <button key={i} onClick={() => onSelect(item)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', borderBottom: '1px solid rgba(63,169,245,0.03)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <span style={{ fontSize: 12 }}>{item.type === 'product' ? '⊞' : '⚙'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-high)' }}>{item.name}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{item.sku}{item.stock != null ? ` · ${item.stock} in stock` : ''}</div>
            </div>
            <span className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--brand)' }}>${item.rate}</span>
          </button>
        ))}
        {filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'var(--text-low)' }}>No items found</div>}
      </div>
      {/* New product/service */}
      <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 4 }}>
        <button onClick={() => onNewProduct('product')} style={{ flex: 1, padding: '5px', borderRadius: 4, fontSize: 10, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Product</button>
        <button onClick={() => onNewProduct('service')} style={{ flex: 1, padding: '5px', borderRadius: 4, fontSize: 10, background: 'rgba(52,211,153,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--status-ok)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Service</button>
      </div>
    </div>
  );
}

/* ── Invoice Send Modal (Email/SMS) ── */
function InvoiceSendModal({ invoiceNum, customer, total, dueDate, sendEmails, setSendEmails, sendPhone, setSendPhone, sendMethod, setSendMethod, emailMode, setEmailMode, emailSubject, setEmailSubject, emailBody, setEmailBody, newEmail, setNewEmail, customerEmail, attachPdf, includePayLink, onClose, onSend, showToast }) {

  const fmtMoney = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inputStyle = { width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };

  const aiEmail = `Hi ${customer ? customer.split(' ')[0] : 'there'},\n\nThank you for choosing ShieldTech Solutions. Please find invoice ${invoiceNum} for ${fmtMoney(total)}, due ${dueDate}.\n\n${includePayLink ? 'Pay securely online: [Stripe Payment Link]\n\n' : ''}If you have any questions about this invoice, please don\'t hesitate to reach out.\n\nBest regards,\nShieldTech Solutions\n(215) 555-0100`;

  const generateAI = () => {
    setEmailBody(aiEmail);
    setEmailSubject(`Invoice ${invoiceNum} from ShieldTech Solutions — ${fmtMoney(total)}`);
    showToast('AI email generated');
  };

  const addEmail = () => {
    if (newEmail && !sendEmails.includes(newEmail)) {
      setSendEmails(prev => [...prev, newEmail]);
      setNewEmail('');
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 560, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.15s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span className="display" style={{ fontSize: 16, fontWeight: 500 }}>Send {invoiceNum}</span>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{customer} · {fmtMoney(total)} · Due {dueDate}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Send method toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 3, borderRadius: 8, background: 'rgba(5,7,10,0.3)', border: '1px solid var(--border-subtle)' }}>
          {[{id:'email',label:'✉ Email'},{id:'sms',label:'▯ SMS/Text'},{id:'both',label:'✉+▯ Both'}].map(m => (
            <button key={m.id} onClick={() => setSendMethod(m.id)} style={{ flex: 1, padding: '7px', borderRadius: 6, fontSize: 11, fontWeight: sendMethod===m.id?600:400, background: sendMethod===m.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: sendMethod===m.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{m.label}</button>
          ))}
        </div>

        {/* Email section */}
        {(sendMethod === 'email' || sendMethod === 'both') && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6 }}>RECIPIENTS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {sendEmails.map((email, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-high)' }}>
                  {email}
                  <button onClick={() => setSendEmails(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', padding: 0, marginLeft: 2 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addEmail(); }} placeholder="Add email address..." style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addEmail} style={{ padding: '7px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Add</button>
            </div>

            {/* Email mode toggle */}
            <div style={{ display: 'flex', gap: 4, marginTop: 12, marginBottom: 8 }}>
              {[{id:'ai',label:'⟡ AI Generate'},{id:'manual',label:'✎ Write Manually'}].map(m => (
                <button key={m.id} onClick={() => { setEmailMode(m.id); if (m.id === 'ai') generateAI(); }} style={{ padding: '5px 12px', borderRadius: 5, fontSize: 11, background: emailMode===m.id?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${emailMode===m.id?'var(--brand)':'var(--border-subtle)'}`, color: emailMode===m.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{m.label}</button>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 4 }}>SUBJECT</div>
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Invoice subject line..." style={{ ...inputStyle, marginBottom: 8 }} />

            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 4 }}>EMAIL BODY</div>
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={8} style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical', minHeight: 120 }} />

            {emailMode === 'ai' && (
              <button onClick={generateAI} style={{ marginTop: 6, padding: '4px 10px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⟡</span> Regenerate with ShieldTech AI
              </button>
            )}

            {/* Attachments indicator */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 11, color: 'var(--text-low)' }}>
              {attachPdf && <span>⧉ Invoice PDF attached</span>}
              {includePayLink && <span>⌁ Stripe pay link included</span>}
            </div>
          </div>
        )}

        {/* SMS section */}
        {(sendMethod === 'sms' || sendMethod === 'both') && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6 }}>PHONE NUMBER</div>
            <input value={sendPhone} onChange={e => setSendPhone(e.target.value)} placeholder="(215) 555-0142" style={inputStyle} />
            <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 6, background: 'rgba(5,7,10,0.3)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 4 }}>SMS PREVIEW</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                ShieldTech: Invoice {invoiceNum} for {fmtMoney(total)} is ready. Due {dueDate}. Pay online: [link]
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={onSend} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
            ↗ Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toggle Switch Helper ── */
function InvToggle({ active, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: 32, height: 16, borderRadius: 8, background: active ? 'var(--brand)' : 'rgba(92,111,134,0.3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: active ? 18 : 2, transition: 'left 0.2s' }} />
    </div>
  );
}

function FormField({ label, placeholder, style }) {
  return (
    <div style={style}>
      {label && <div className="label-sm" style={{ marginBottom: 4 }}>{label}</div>}
      <input placeholder={placeholder} style={{ width: '100%', padding: '7px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
    </div>
  );
}

function FinanceDrawer({ drawer, setDrawer, showToast }) { return null; }

Object.assign(window, { FinanceEstimates, FinanceAP, FinanceExpenses, FinanceCOA, FinanceGL, FinanceStatements, FinanceReconcile, PLStatement, BSStatement, CFStatement, TBStatement, FinanceModal, FinanceDrawer });

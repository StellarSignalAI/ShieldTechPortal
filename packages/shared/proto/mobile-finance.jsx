/* ShieldTech Mobile — Native Finance Suite
   Full-featured mobile finance: Overview · Invoices · Recurring · Estimates · Bills (AP) · Expenses · Reports
   Mirrors the desktop QuickBooks-replacement feature set in a touch-native layout. */

const FIN_INVOICES = [];
const FIN_RECURRING = [];
const FIN_ESTIMATES = [];
const FIN_BILLS = [];
const FIN_EXPENSES = [];
const FIN_STATUS = { paid:'var(--status-ok)', pending:'var(--status-warn)', overdue:'var(--status-critical)', draft:'var(--text-low)', sent:'var(--brand)', accepted:'var(--status-ok)', declined:'var(--status-critical)', active:'var(--status-ok)', past_due:'var(--status-critical)', due:'var(--status-warn)', scheduled:'var(--brand)', approved:'var(--status-ok)', reimbursed:'var(--brand)' };

const FinEmpty = ({ children }) => <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{children}</div>;

function FinKpis({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
      {items.map(([l, v, sub, c]) => (
        <div key={l} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 3 }}>{l}</div>
          <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: c || 'var(--text-high)', lineHeight: 1.1 }}>{v}</div>
          {sub && <div style={{ fontSize: 9.5, color: 'var(--status-ok)', marginTop: 2 }}>{sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Overview ── */
function FinOverview({ go }) {
  const ar = [['Current', 0, 'var(--status-ok)'], ['1–30', 0, 'var(--status-warn)'], ['31–60', 0, 'var(--status-critical)'], ['60+', 0, '#c084fc']];
  const arTotal = ar.reduce((s, b) => s + b[1], 0);
  const lines = [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FinKpis items={[['CASH POSITION', '$0', null, 'var(--status-ok)'], ['REVENUE MTD', '$0', null, null], ['GROSS MARGIN', '—', 'target 25%', null], ['MRR', '$0', null, 'var(--brand)']]} />
      <MSection title="Accounts Receivable" action="Invoices" onAction={() => go('Invoices')}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
          {ar.map(([l, v, c]) => (
            <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mid)' }}>${(v / 1000).toFixed(1)}K</span>
              <div style={{ width: '100%', height: Math.max((v / (arTotal || 1)) * 70, 10), background: `${c}28`, border: `1px solid ${c}55`, borderRadius: '3px 3px 0 0' }}></div>
              <span style={{ fontSize: 8, color: 'var(--text-low)' }}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Total Outstanding</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${arTotal.toLocaleString()}</span>
        </div>
      </MSection>
      <MSection title="90-day cash forecast">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          {[['30D', '—'], ['60D', '—'], ['90D', '—']].map(([k, v]) => (
            <div key={k} className="glass" style={{ padding: '11px 8px', borderRadius: 10, textAlign: 'center' }}><div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-ok)' }}>{v}</div><div style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 2 }}>{k}</div></div>
          ))}
        </div>
        <div className="glass" style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, display: 'flex', gap: 9, alignItems: 'center' }}>
          <Icon name="hermes" size={14} color="var(--brand)" />
          <span style={{ fontSize: 11, color: 'var(--text-mid)', flex: 1 }}>ShieldTech AI insights appear here once invoices and payments are recorded.</span>
        </div>
      </MSection>
      <MSection title="Profitability by service line">
        {lines.map(([l, rev, m]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{l}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)', width: 48, textAlign: 'right' }}>${(rev / 1000).toFixed(0)}K</span>
            <div style={{ width: 50 }}><MBar pct={m / 70 * 100} color={m >= 30 ? 'var(--status-ok)' : m >= 20 ? 'var(--status-warn)' : 'var(--status-critical)'} /></div>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600, width: 38, textAlign: 'right', color: m >= 30 ? 'var(--status-ok)' : m >= 20 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{m}%</span>
          </div>
        ))}
        {lines.length === 0 && <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--text-low)', textAlign: 'center' }}>No revenue data yet.</div>}
      </MSection>
    </div>
  );
}

/* ── Invoices ── */
function FinInvoices() {
  const [filter, setFilter] = React.useState('All');
  const [openNum, setOpenNum] = React.useState(null);
  const list = filter === 'All' ? FIN_INVOICES : FIN_INVOICES.filter(i => i.status === filter.toLowerCase());
  const outstanding = FIN_INVOICES.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + i.amount, 0);
  const overdue = FIN_INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['OUTSTANDING', `$${(outstanding / 1000).toFixed(1)}K`, null, 'var(--status-warn)'], ['OVERDUE', `$${(overdue / 1000).toFixed(1)}K`, null, 'var(--status-critical)']]} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, overflowX: 'auto' }}><MSegment options={['All', 'Paid', 'Pending', 'Overdue', 'Draft']} value={filter} onChange={setFilter} /></div>
        <button onClick={() => showToast('New invoice — draft created', 'ok')} style={{ padding: '0 14px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>+</button>
      </div>
      {list.map(inv => (
        <div key={inv.num} onClick={() => setOpenNum(inv.num)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${FIN_STATUS[inv.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{inv.num}</span>
            <MBadge color={FIN_STATUS[inv.status]}>{inv.status}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>${inv.amount.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{inv.customer}</div>
          <div style={{ fontSize: 10, color: inv.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)' }}>{inv.status === 'overdue' ? `${inv.days}d overdue` : `due ${inv.due}`} · {inv.terms}</div>
        </div>
      ))}
      {list.length === 0 && <FinEmpty>No invoices yet.</FinEmpty>}
      {openNum && <FinInvoiceDetail num={openNum} onClose={() => setOpenNum(null)} />}
    </div>
  );
}
function FinInvoiceDetail({ num, onClose }) {
  const inv = FIN_INVOICES.find(i => i.num === num);
  if (!inv) return null;
  return (
    <MSheet title={inv.num} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div><div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-high)' }}>${inv.amount.toLocaleString()}</div><div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{inv.customer}</div></div>
          <MBadge color={FIN_STATUS[inv.status]}>{inv.status}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Due', inv.due], ['Terms', inv.terms], ['PO', inv.po || '—'], ['Lines', inv.lines.length]].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '7px 10px' }}><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{k}</div><div className="mono" style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{v}</div></div>
          ))}
        </div>
        <MSection title="Line items">
          {inv.lines.map((li, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{li.desc}</span>
              {li.qty > 1 && <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{li.qty}×${li.rate}</span>}
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>${(li.qty * li.rate).toLocaleString()}</span>
            </div>
          ))}
        </MSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {inv.status === 'draft' && <button onClick={() => { showToast('Finalized & sent', 'ok'); onClose(); }} style={finBtnPrimary}>Finalize & Send</button>}
          {inv.status === 'pending' && <>
            <button onClick={() => showToast('Stripe payment link created', 'ok')} style={finBtnSecondary}>⊛ Create Stripe Link</button>
            <button onClick={() => { showToast('Payment recorded', 'ok'); onClose(); }} style={finBtnSuccess}>Record Payment</button>
          </>}
          {inv.status === 'overdue' && <>
            <button onClick={() => showToast('AI reminder drafted → Approvals', 'ok')} style={finBtnSecondary}>⟡ AI Draft Reminder</button>
            <button onClick={() => showToast('Payment link sent', 'ok')} style={finBtnPrimary}>Send Payment Link</button>
          </>}
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={() => showToast('PDF downloaded', 'ok')} style={finBtnGhost}>PDF</button>
            <button onClick={() => showToast('Duplicated', 'ok')} style={finBtnGhost}>Duplicate</button>
            {inv.status !== 'paid' && <button onClick={() => { showToast('Voided', 'warn'); onClose(); }} style={{ ...finBtnGhost, color: 'var(--status-critical)' }}>Void</button>}
          </div>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Recurring ── */
function FinRecurring() {
  const mrr = FIN_RECURRING.reduce((s, r) => s + r.amount, 0);
  const autopay = FIN_RECURRING.length ? Math.round(FIN_RECURRING.filter(r => r.stripe).length / FIN_RECURRING.length * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['TOTAL MRR', `$${(mrr / 1000).toFixed(1)}K`, null, 'var(--brand)'], ['AUTOPAY RATE', `${autopay}%`, null, 'var(--status-ok)']]} />
      <button onClick={() => showToast('New subscription', 'ok')} style={{ padding: '11px 0', background: 'rgba(63,169,245,0.06)', border: '1px dashed var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Subscription</button>
      {FIN_RECURRING.map(r => (
        <div key={r.customer} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${r.status === 'active' ? 'var(--status-ok)' : 'var(--status-critical)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{r.customer}</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${r.amount.toLocaleString()}/mo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: r.stripe ? 'var(--brand)' : 'var(--text-low)' }}>{r.stripe ? '⊛ ' : ''}{r.method}</span>
            <span style={{ fontSize: 10, color: 'var(--text-low)' }}>· next {r.next}</span>
            {r.status === 'past_due'
              ? <span style={{ marginLeft: 'auto' }}><MBadge color="var(--status-critical)">past due</MBadge></span>
              : <button onClick={() => showToast(r.stripe ? 'Stripe subscription managed' : 'Enroll in AutoPay?', 'ok')} style={{ marginLeft: 'auto', padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{r.stripe ? 'Manage' : 'Enroll AutoPay'}</button>}
          </div>
        </div>
      ))}
      {FIN_RECURRING.length === 0 && <FinEmpty>No subscriptions yet.</FinEmpty>}
    </div>
  );
}

/* ── Estimates ── */
function FinEstimates() {
  const [filter, setFilter] = React.useState('All');
  const list = filter === 'All' ? FIN_ESTIMATES : FIN_ESTIMATES.filter(e => e.status === filter.toLowerCase());
  const outstanding = FIN_ESTIMATES.filter(e => e.status === 'sent').reduce((s, e) => s + e.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['OUT FOR SIGNATURE', `$${(outstanding / 1000).toFixed(0)}K`, null, 'var(--brand)'], ['WIN RATE', '—', null, 'var(--status-ok)']]} />
      <MSegment options={['All', 'Draft', 'Sent', 'Accepted', 'Declined']} value={filter} onChange={setFilter} />
      {list.map(e => (
        <div key={e.num} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${FIN_STATUS[e.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{e.num}</span>
            <MBadge color={FIN_STATUS[e.status]}>{e.status}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${(e.amount / 1000).toFixed(0)}K</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{e.customer}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-low)', flex: 1 }}>created {e.created} · expires {e.expires}</span>
            {e.status === 'accepted' && <button onClick={() => showToast(`Converted ${e.num} → invoice`, 'ok')} style={{ padding: '4px 10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 7, color: 'var(--status-ok)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Invoice</button>}
            {e.status === 'sent' && <button onClick={() => showToast('Reminder sent', 'ok')} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Remind</button>}
          </div>
        </div>
      ))}
      {list.length === 0 && <FinEmpty>No estimates yet.</FinEmpty>}
    </div>
  );
}

/* ── Bills / AP ── */
function FinBills() {
  const due = FIN_BILLS.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0);
  const overdue = FIN_BILLS.filter(b => b.status === 'overdue').reduce((s, b) => s + b.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['TOTAL DUE', `$${(due / 1000).toFixed(1)}K`, null, 'var(--status-warn)'], ['OVERDUE', `$${(overdue / 1000).toFixed(1)}K`, null, overdue ? 'var(--status-critical)' : 'var(--text-low)']]} />
      {FIN_BILLS.map(b => (
        <div key={b.num} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${FIN_STATUS[b.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{b.num}</span>
            <MBadge>{b.category}</MBadge>
            <MBadge color={FIN_STATUS[b.status]}>{b.status}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${b.amount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', flex: 1 }}>{b.vendor}</span>
            <span style={{ fontSize: 10, color: b.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)' }}>due {b.due}</span>
            {b.status !== 'paid' && <button onClick={() => showToast(`${b.num} scheduled for payment`, 'ok')} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Pay</button>}
          </div>
        </div>
      ))}
      {FIN_BILLS.length === 0 && <FinEmpty>No bills yet.</FinEmpty>}
    </div>
  );
}

/* ── Expenses ── */
function FinExpenses() {
  const [items, setItems] = React.useState(FIN_EXPENSES);
  const pending = items.filter(e => e.status === 'pending').length;
  const total = items.reduce((s, e) => s + e.amount, 0);
  const approve = (id) => { setItems(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e)); showToast('Expense approved', 'ok'); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['PENDING', pending, null, pending ? 'var(--status-warn)' : 'var(--status-ok)'], ['MTD TOTAL', `$${total.toFixed(0)}`, null, 'var(--text-high)']]} />
      {items.map(e => (
        <div key={e.id} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${FIN_STATUS[e.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MBadge>{e.category}</MBadge>
            <MBadge color={FIN_STATUS[e.status]}>{e.status}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${e.amount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{e.desc}</div><div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{e.who} · {e.date}</div></div>
            {e.status === 'pending' && <button onClick={() => approve(e.id)} style={{ padding: '6px 12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, color: 'var(--status-ok)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>}
          </div>
        </div>
      ))}
      {items.length === 0 && <FinEmpty>No expenses yet.</FinEmpty>}
    </div>
  );
}

/* ── Reports center ── */
function FinReports() {
  const reports = [['Profit & Loss', 'Income statement · MTD/YTD'], ['Balance Sheet', 'Assets, liabilities, equity'], ['Cash Flow', 'Operating, investing, financing'], ['A/R Aging', 'Outstanding by bucket'], ['A/P Aging', 'Bills due by bucket'], ['Sales Tax', 'Liability by jurisdiction'], ['Sales by Customer', 'Revenue ranked'], ['Expense by Category', 'Spend breakdown']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['NET INCOME MTD', '$0', null, 'var(--status-ok)'], ['GROSS PROFIT', '$0', null, null]]} />
      <MSection title="P&L Summary (MTD)">
        {[['Revenue', '$0', false], ['Cost of Goods', '$0', false], ['Gross Profit', '$0', true], ['Operating Expenses', '$0', false], ['Net Income', '$0', true]].map(([l, v, bold]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: bold ? '1px solid var(--border-subtle)' : '1px solid rgba(63,169,245,0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: bold ? 600 : 400, color: l === 'Net Income' ? 'var(--status-ok)' : 'var(--text-high)' }}>{l}</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: l === 'Net Income' ? 'var(--status-ok)' : 'var(--text-high)' }}>{v}</span>
          </div>
        ))}
      </MSection>
      <MSection title="Run a report">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {reports.map(([t, d]) => (
            <button key={t} onClick={() => showToast(`${t} generated`, 'ok')} className="glass" style={{ padding: '11px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{t}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{d}</div>
            </button>
          ))}
        </div>
      </MSection>
    </div>
  );
}

/* ── Finance suite shell ── */
function MFinance({ onNav }) {
  const [tab, setTab] = React.useState('Overview');
  const tabs = ['Overview', 'AI Queue', 'Invoices', 'Recurring', 'Estimates', 'Bills', 'Expenses', 'Sales Tax', 'Lending', 'Reports', 'More'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, margin: '0 -2px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: tab === t ? 600 : 500, background: tab === t ? 'rgba(63,169,245,0.14)' : 'transparent', border: `1px solid ${tab === t ? 'var(--brand)' : 'var(--border-subtle)'}`, color: tab === t ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <FinOverview go={setTab} />}
      {tab === 'AI Queue' && <MFinAIQueue />}
      {tab === 'Invoices' && <FinInvoices />}
      {tab === 'Recurring' && <FinRecurring />}
      {tab === 'Estimates' && <FinEstimates />}
      {tab === 'Bills' && <FinBills />}
      {tab === 'Expenses' && <FinExpenses />}
      {tab === 'Sales Tax' && <MFinSalesTax />}
      {tab === 'Lending' && <MFinLending />}
      {tab === 'Reports' && <FinReports />}
      {tab === 'More' && <MFinMore onNav={onNav} />}
      <button onClick={() => onNav('finance-full')} style={{ padding: '11px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open full ledger suite — COA, GL, reconcile, bank feed, QBO map ›</button>
    </div>
  );
}

const finBtnPrimary = { width: '100%', padding: '11px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };
const finBtnSecondary = { width: '100%', padding: '11px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };
const finBtnSuccess = { width: '100%', padding: '11px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, color: 'var(--status-ok)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' };
const finBtnGhost = { flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' };

Object.assign(window, { MFinance });

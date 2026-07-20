/* QBO Handoff — Finance additions: Sales Tax, Lending, merged-feature wrappers */

/* ── Sub-tab pill row (shared) ── */
function QboSubTabs({ tabs, val, set }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => set(t.id)} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: val === t.id ? 600 : 400,
          background: val === t.id ? 'rgba(63,169,245,0.12)' : 'transparent',
          border: `1px solid ${val === t.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
          color: val === t.id ? 'var(--brand)' : 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0
        }}>{t.label}{t.count != null && <span style={{ marginLeft: 6, fontSize: 9.5, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{t.count}</span>}</button>
      ))}
    </div>
  );
}

function QboTable({ cols, rows, onRow }) {
  return (
    <GlassPanel style={{ padding: 0 }}>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {cols.map((h, i) => (
              <th key={i} style={{ textAlign: i >= cols.length - 2 ? 'right' : 'left', padding: '9px 14px', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-mid)', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onClick={() => onRow && onRow(r, i)} className="st-rowcard" style={{ cursor: onRow ? 'pointer' : 'default' }}>
                {r.cells.map((c, j) => (
                  <td key={j} style={{ padding: '9px 14px', fontSize: 11.5, borderBottom: '1px solid var(--border-subtle)', textAlign: j >= r.cells.length - 2 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

const qboMoney = (n) => '$' + n.toLocaleString();
function QboStatus({ s }) {
  const map = {
    filed: ['var(--status-ok)', 'Filed'], due: ['var(--status-warn)', 'Due soon'], overdue: ['var(--status-critical)', 'Overdue'], upcoming: ['var(--text-mid)', 'Upcoming'],
    active: ['var(--status-ok)', 'Active'], review: ['var(--status-warn)', 'In review'], offer: ['var(--brand)', 'Offer'], closed: ['var(--text-mid)', 'Closed'], declined: ['var(--status-critical)', 'Declined'],
    approaching: ['var(--status-warn)', 'Approaching'], collecting: ['var(--status-ok)', 'Collecting'], monitor: ['var(--text-mid)', 'Monitoring'],
    open: ['var(--status-warn)', 'Open'], billed: ['var(--status-ok)', 'Billed'], draft: ['var(--text-mid)', 'Draft'],
    pending: ['var(--status-warn)', 'Pending'], approved: ['var(--status-ok)', 'Approved'], sent: ['var(--brand)', 'Sent'], dismissed: ['var(--text-mid)', 'Dismissed'],
    cleared: ['var(--status-ok)', 'Cleared'], printed: ['var(--text-mid)', 'Printed'], void: ['var(--status-critical)', 'Void'],
  };
  const [c, label] = map[s] || ['var(--text-mid)', s];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: c, fontWeight: 600 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: c }}></span>{label}</span>;
}

/* ════ Sales Tax ════ */
function FinanceSalesTax({ showToast }) {
  const [sub, setSub] = React.useState('overview');
  const returns = [
    { period: 'Q2 2026 · CA CDTFA', due: 'Jul 31, 2026', taxable: 284600, tax: 24191, status: 'due' },
    { period: 'Q2 2026 · NV Dept. of Taxation', due: 'Jul 31, 2026', taxable: 41200, tax: 2822, status: 'due' },
    { period: 'Q1 2026 · CA CDTFA', due: 'Apr 30, 2026', taxable: 251900, tax: 21411, status: 'filed' },
    { period: 'Q1 2026 · NV Dept. of Taxation', due: 'Apr 30, 2026', taxable: 33750, tax: 2311, status: 'filed' },
    { period: 'Q4 2025 · CA CDTFA', due: 'Jan 31, 2026', taxable: 246300, tax: 20936, status: 'filed' },
  ];
  const categories = [
    { cat: 'Security equipment (hardware)', code: 'TPP-STD', treatment: 'Taxable — standard rate', items: 214 },
    { cat: 'Installation labor', code: 'SVC-INSTALL', treatment: 'Exempt in CA (separately stated)', items: 48 },
    { cat: 'Monitoring subscriptions', code: 'SVC-MONITOR', treatment: 'Exempt — service', items: 36 },
    { cat: 'Service plan contracts', code: 'SVC-PLAN', treatment: 'Partially taxable (parts portion)', items: 22 },
    { cat: 'Shipping & handling', code: 'SHIP', treatment: 'Taxable when goods taxable', items: '—' },
  ];
  const nexus = [
    { state: 'California', sales: 1240000, threshold: 500000, txns: '—', status: 'collecting' },
    { state: 'Nevada', sales: 152000, threshold: 100000, txns: '—', status: 'collecting' },
    { state: 'Arizona', sales: 84200, threshold: 100000, txns: '—', status: 'approaching' },
    { state: 'Oregon', sales: 12800, threshold: 'No sales tax', txns: '—', status: 'monitor' },
    { state: 'Washington', sales: 9400, threshold: 100000, txns: '—', status: 'monitor' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'returns', label: 'Returns', count: returns.filter(r => r.status === 'due').length }, { id: 'categories', label: 'Categories' }, { id: 'nexus', label: 'Economic Nexus' }, { id: 'settings', label: 'Tax Settings' }]} val={sub} set={setSub} />

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="TAX COLLECTED · QTD" value="$27,013" delay={0} />
            <StatCard label="NEXT FILING DUE" value="Jul 31" mono={false} delay={60} />
            <StatCard label="JURISDICTIONS" value={4} delay={120} />
            <StatCard label="EXCEPTIONS TO REVIEW" value={3} delay={180} />
          </div>
          <GlassPanel>
            <SectionHeader title="Liability by Jurisdiction · Q2 2026" icon="flag" />
            {[
              { j: 'California — state 6.0%', amt: 17076 }, { j: 'CA district (SF Bay Area avg 2.63%)', amt: 7115 },
              { j: 'Nevada — combined 8.375%', amt: 2822 }, { j: 'Use tax accrual', amt: 486 },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ flex: 1, fontSize: 12 }}>{r.j}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{qboMoney(r.amt)}</span>
              </div>
            ))}
          </GlassPanel>
          <GlassPanel style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
            <SectionHeader title="Exceptions" icon="warn" />
            {[
              { d: 'INV-2087 — installation labor line marked taxable (CA exempt when separately stated)', link: { screen: 'finance', params: { financeTab: 'invoices' }, label: 'INV-2087' } },
              { d: 'Sales receipt SR-114 missing tax category on 2 line items', link: { screen: 'finance', params: { financeTab: 'credits' }, label: 'SR-114' } },
              { d: 'Arizona at 84% of economic nexus threshold — registration lead time is 3–4 weeks', link: null },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', fontSize: 11.5, color: 'var(--text-mid)' }}>
                <span style={{ color: 'var(--status-warn)' }}>◆</span><span style={{ flex: 1 }}>{r.d}</span>
                {r.link && <LinkChip screen={r.link.screen} params={r.link.params} label={r.link.label} />}
              </div>
            ))}
          </GlassPanel>
        </div>
      )}

      {sub === 'returns' && (
        <QboTable cols={['Filing period', 'Due', 'Taxable sales', 'Tax due', 'Status']}
          rows={returns.map((r) => ({ cells: [r.period, r.due, qboMoney(r.taxable), qboMoney(r.tax), <QboStatus s={r.status} />] }))}
          onRow={(row, i) => {
            const r = returns[i];
            shieldModal({ kind: 'detail', title: r.period, subtitle: 'Sales tax return',
              sections: [{ label: 'Return summary', rows: [
                { k: 'Gross sales', v: qboMoney(Math.round(r.taxable * 1.31)) }, { k: 'Non-taxable (labor/services)', v: qboMoney(Math.round(r.taxable * 0.31)) },
                { k: 'Taxable sales', v: qboMoney(r.taxable) }, { k: 'Tax due', v: qboMoney(r.tax) }, { k: 'Due date', v: r.due, mono: false }] }],
              actions: r.status === 'filed'
                ? [{ label: 'Download filed copy', primary: true, successMsg: 'PDF exported', onClick: () => {}, close: true }]
                : [{ label: 'Export worksheet', onClick: () => shieldToast('Worksheet exported to CSV', 'info'), close: true },
                   { label: 'Prepare return', primary: true, successMsg: 'Return prepared — review before filing', onClick: () => {}, close: true }] });
          }} />
      )}

      {sub === 'categories' && (
        <QboTable cols={['Category', 'Code', 'Tax treatment', 'Linked items', '']}
          rows={categories.map((c) => ({ cells: [c.cat, <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{c.code}</span>, c.treatment, c.items, <LinkChip screen="finance" params={{ financeTab: 'products' }} label="Products" />] }))} />
      )}

      {sub === 'nexus' && (
        <QboTable cols={['State', 'Trailing 12-mo sales', 'Threshold', 'Progress', 'Status']}
          rows={nexus.map((n) => ({ cells: [n.state, qboMoney(n.sales), typeof n.threshold === 'number' ? qboMoney(n.threshold) : n.threshold,
            typeof n.threshold === 'number'
              ? <div style={{ width: 90, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', display: 'inline-block' }}><div style={{ width: `${Math.min(100, Math.round(n.sales / n.threshold * 100))}%`, height: '100%', borderRadius: 3, background: n.sales / n.threshold > 0.8 ? 'var(--status-warn)' : 'var(--brand)' }}></div></div>
              : '—',
            <QboStatus s={n.status} />] }))} />
      )}

      {sub === 'settings' && (
        <GlassPanel style={{ maxWidth: 640 }}>
          <SectionHeader title="Sales Tax Settings" icon="settings" />
          {[
            { k: 'Tax agency (home state)', v: 'California CDTFA · Account SR-KH-102-445' },
            { k: 'Filing frequency', v: 'Quarterly (prepayments not required)' },
            { k: 'Default product category', v: 'TPP-STD — taxable hardware' },
            { k: 'Labor treatment', v: 'Exempt when separately stated on invoice' },
            { k: 'Automatic rate lookup', v: 'On — by ship-to address (QBO AutoTax)' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{r.k}</span>
              <span style={{ fontSize: 11.5, textAlign: 'right' }}>{r.v}</span>
            </div>
          ))}
          <button onClick={() => shieldModal({ kind: 'confirm', title: 'Edit tax settings?', message: 'Changing agency or treatment affects every open invoice and unfiled return. Changes are logged to the audit trail.', confirmLabel: 'Continue', onConfirm: () => showToast('Tax settings unlocked for editing') })} style={{ marginTop: 12, padding: '6px 16px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Edit settings</button>
        </GlassPanel>
      )}
    </div>
  );
}

/* ════ Lending / Capital ════ */
function FinanceLending({ showToast }) {
  const [sub, setSub] = React.useState('accounts');
  const accounts = [
    { name: 'Term loan — vehicle fleet', lender: 'QBO Capital', limit: 120000, balance: 68400, rate: '7.9% APR', payment: '$2,840/mo · next Jul 15', status: 'active' },
    { name: 'Line of credit — working capital', lender: 'ShieldTech Bank LOC', limit: 150000, balance: 32000, rate: 'Prime + 1.5%', payment: 'Interest-only · $214 accrued', status: 'active' },
    { name: 'Business credit card — ops', lender: 'Chase Ink ····4471', limit: 50000, balance: 12385, rate: '19.9% APR', payment: 'Autopay in full · Jul 12', status: 'active' },
  ];
  const applications = [
    { name: 'Equipment financing — thermal camera stock', amount: 85000, submitted: 'Jun 22, 2026', status: 'review', note: 'Underwriting — docs complete' },
    { name: 'Term loan refi quote', amount: 68400, submitted: 'Jun 30, 2026', status: 'offer', note: 'Offer: 6.4% APR, 48 mo — expires Jul 20' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'accounts', label: 'Credit Accounts', count: accounts.length }, { id: 'applications', label: 'Applications & Offers', count: applications.length }]} val={sub} set={setSub} />

      {sub === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="TOTAL CREDIT AVAILABLE" value="$207,215" delay={0} />
            <StatCard label="TOTAL DRAWN" value="$112,785" delay={60} />
            <StatCard label="NEXT PAYMENT" value="Jul 12" mono={false} delay={120} />
            <StatCard label="BLENDED RATE" value="9.1%" delay={180} />
          </div>
          <QboTable cols={['Account', 'Lender', 'Limit', 'Balance', 'Rate', 'Payment', 'Status']}
            rows={accounts.map((a) => ({ cells: [a.name, a.lender, qboMoney(a.limit), qboMoney(a.balance), a.rate, a.payment, <QboStatus s={a.status} />] }))}
            onRow={(row, i) => {
              const a = accounts[i];
              shieldModal({ kind: 'detail', title: a.name, subtitle: a.lender,
                sections: [
                  { label: 'Account', rows: [{ k: 'Credit limit', v: qboMoney(a.limit) }, { k: 'Balance', v: qboMoney(a.balance) }, { k: 'Rate', v: a.rate, mono: false }, { k: 'Payment', v: a.payment, mono: false }] },
                  { label: 'Utilization', meters: [{ label: 'Drawn', value: a.balance, max: a.limit }] },
                ],
                actions: [
                  { label: 'View in Bank Feed', onClick: () => qboGo('finance', { financeTab: 'bankfeed' }), close: true },
                  { label: 'Make a payment', primary: true, successMsg: 'Payment scheduled — posting to GL on settle', onClick: () => {}, close: true },
                ] });
            }} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Payments and draws post to the ledger via the Bank Feed — offers below are never posted until accepted.</div>
        </div>
      )}

      {sub === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <QboTable cols={['Application', 'Amount', 'Submitted', 'Status', 'Note']}
            rows={applications.map((a) => ({ cells: [a.name, qboMoney(a.amount), a.submitted, <QboStatus s={a.status} />, a.note] }))}
            onRow={(row, i) => {
              const a = applications[i];
              shieldModal({ kind: 'detail', title: a.name, subtitle: `Submitted ${a.submitted}`,
                sections: [{ label: 'Application', rows: [{ k: 'Amount', v: qboMoney(a.amount) }, { k: 'Status', v: a.note, mono: false, full: true }] }],
                actions: a.status === 'offer'
                  ? [{ label: 'Decline offer', onClick: () => shieldToast('Offer declined', 'info'), close: true }, { label: 'Accept offer…', primary: true, onClick: () => shieldModal({ kind: 'confirm', title: 'Accept refi offer?', message: 'Accepting creates a new liability account in the Chart of Accounts and schedules payoff of the existing term loan. This action is review-gated and logged.', confirmLabel: 'Accept & create accounts', onConfirm: () => showToast('Offer accepted — new liability account created') }), close: true }]
                  : [{ label: 'Upload documents', primary: true, successMsg: 'Document request opened', onClick: () => {}, close: true }] });
            }} />
          <button onClick={() => shieldModal({ kind: 'confirm', title: 'Apply for capital?', message: 'We will share your revenue and A/R history from the Finance Suite with the lender. Nothing is shared until you confirm.', confirmLabel: 'Start application', onConfirm: () => showToast('Capital application started') })} style={{ alignSelf: 'flex-start', padding: '7px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ Apply for capital</button>
        </div>
      )}
    </div>
  );
}

/* ════ Invoices Plus — delayed charges + AI reminder queue ════ */
function FinanceInvoicesPlus(props) {
  const [sub, setSub] = React.useState('invoices');
  const [reminders, setReminders] = React.useState([
    { inv: 'INV-2054', customer: 'Bayview Medical Plaza', overdue: 18, amount: 14250, tone: 'Firm', draft: 'Hi Angela — invoice INV-2054 ($14,250) is now 18 days past due. Could you confirm payment timing this week? A payment link is included below.', cites: ['INV-2054 due Jun 17', 'Last payment: May 2 ($9,800)', 'Terms: Net 30'], status: 'pending' },
    { inv: 'INV-2061', customer: 'Harbor Logistics', overdue: 9, amount: 6800, tone: 'Friendly', draft: 'Hi Marcus — friendly nudge that INV-2061 ($6,800) came due last week. Happy to resend the payment link if useful.', cites: ['INV-2061 due Jun 26', 'NPS 9 — strong relationship', 'Autopay not enrolled'], status: 'pending' },
    { inv: 'INV-2049', customer: 'Sunrise Charter Schools', overdue: 31, amount: 22100, tone: 'Escalation', draft: 'Hello — INV-2049 ($22,100) is 31+ days past due. Per contract, monitoring services may pause at 45 days. Please advise on payment status.', cites: ['INV-2049 due Jun 4', 'Contract §7.2 suspension clause', '2 prior reminders sent'], status: 'pending' },
  ]);
  const delayed = [
    { ref: 'DC-118', customer: 'Pinnacle Financial Group', desc: 'After-hours service call — badge reader', amount: 640, date: 'Jul 1', status: 'open' },
    { ref: 'DC-117', customer: 'Harbor Logistics', desc: 'Camera relocation (2) — dock 4', amount: 1180, date: 'Jun 28', status: 'open' },
    { ref: 'DC-115', customer: 'Bayview Medical Plaza', desc: 'Extra cable run — suite 210', amount: 420, date: 'Jun 24', status: 'billed' },
  ];
  const act = (i, status, msg) => { setReminders((rs) => rs.map((r, j) => j === i ? { ...r, status } : r)); props.showToast(msg); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'invoices', label: 'Invoices' }, { id: 'delayed', label: 'Delayed Charges', count: delayed.filter(d => d.status === 'open').length }, { id: 'reminders', label: 'AI Reminders', count: reminders.filter(r => r.status === 'pending').length }]} val={sub} set={setSub} />
      {sub === 'invoices' && <FinanceInvoices {...props} />}
      {sub === 'delayed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Billable work captured in the field, waiting to be pulled onto the next invoice. Nothing here posts to the ledger until invoiced.</div>
          <QboTable cols={['Ref', 'Customer', 'Description', 'Captured', 'Amount', 'Status']}
            rows={delayed.map((d) => ({ cells: [<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{d.ref}</span>, d.customer, d.desc, d.date, qboMoney(d.amount), <QboStatus s={d.status} />] }))}
            onRow={(row, i) => {
              const d = delayed[i];
              if (d.status !== 'open') { props.showToast(d.ref + ' already billed on INV-2066'); return; }
              shieldModal({ kind: 'confirm', title: `Convert ${d.ref} to invoice line?`, message: `Adds "${d.desc}" (${qboMoney(d.amount)}) to a new draft invoice for ${d.customer}.`, confirmLabel: 'Create draft invoice', onConfirm: () => { props.showToast('Draft invoice created with ' + d.ref); setSub('invoices'); } });
            }} />
        </div>
      )}
      {sub === 'reminders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.05)', fontSize: 11.5, color: 'var(--text-mid)' }}>
            <span style={{ color: 'var(--brand)' }}>⟡</span> Drafted by the Finance Co-pilot from A/R aging. Nothing sends without your approval — every draft cites its source rows.
            <LinkChip screen="finance" params={{ financeTab: 'copilot' }} label="Co-pilot" />
          </div>
          {reminders.map((r, i) => (
            <GlassPanel key={r.inv} style={{ opacity: r.status === 'dismissed' ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--brand)' }}>{r.inv}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.customer}</span>
                <span style={{ fontSize: 10.5, color: 'var(--status-warn)' }}>{r.overdue} days overdue · {qboMoney(r.amount)}</span>
                <span style={{ marginLeft: 'auto' }}><QboStatus s={r.status} /></span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.18)', border: '1px solid var(--border-subtle)', marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 5 }}>Draft · tone: {r.tone}</span>
                {r.draft}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: r.status === 'pending' ? 10 : 0 }}>
                {r.cites.map((c, j) => (
                  <span key={j} style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 12, border: '1px dashed var(--border-subtle)', color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>⌕ {c}</span>
                ))}
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => act(i, 'sent', 'Reminder sent to ' + r.customer)} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Approve & send</button>
                  <button onClick={() => props.showToast('Editing draft for ' + r.inv)} style={{ padding: '5px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Edit draft</button>
                  <button onClick={() => act(i, 'dismissed', 'Draft dismissed')} style={{ padding: '5px 14px', background: 'transparent', border: 'none', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Dismiss</button>
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════ Expenses Plus — checks, mileage, card payments ════ */
function FinanceExpensesPlus(props) {
  const [sub, setSub] = React.useState('expenses');
  const checks = [
    { num: '#4102', payee: 'ADI Global Distribution', account: '1000 Checking', memo: 'Bill BILL-2231', amount: 8420, date: 'Jul 2', status: 'cleared' },
    { num: '#4101', payee: 'City of San Rafael — permits', account: '1000 Checking', memo: 'Fire alarm permit — Sunrise Charter', amount: 640, date: 'Jun 30', status: 'cleared' },
    { num: '#4100', payee: 'Golden Gate Fleet Service', account: '1000 Checking', memo: 'V-08 brake service', amount: 1120, date: 'Jun 27', status: 'printed' },
  ];
  const mileage = [
    { tech: 'Mike Reyes', vehicle: 'V-12', period: 'Jun 22–28', miles: 284, job: 'Bayview Medical (3 visits)', deduction: 198.8 },
    { tech: 'Jessica Liu', vehicle: 'V-08', period: 'Jun 22–28', miles: 312, job: 'Harbor Logistics rollout', deduction: 218.4 },
    { tech: 'Tony Garcia', vehicle: 'V-21', period: 'Jun 22–28', miles: 146, job: 'Service calls (5)', deduction: 102.2 },
    { tech: 'Diana Patel', vehicle: 'V-03', period: 'Jun 22–28', miles: 201, job: 'Sunrise Charter punch list', deduction: 140.7 },
  ];
  const cardPays = [
    { card: 'Chase Ink ····4471', amount: 12385, date: 'Jul 12 (scheduled)', from: '1000 Checking', status: 'pending' },
    { card: 'Chase Ink ····4471', amount: 9840, date: 'Jun 12', from: '1000 Checking', status: 'cleared' },
    { card: 'Home Depot Pro ····2210', amount: 1260, date: 'Jun 8', from: '1000 Checking', status: 'cleared' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'expenses', label: 'Expenses' }, { id: 'checks', label: 'Checks' }, { id: 'mileage', label: 'Mileage' }, { id: 'cards', label: 'Card Payments' }]} val={sub} set={setSub} />
      {sub === 'expenses' && <FinanceExpenses {...props} />}
      {sub === 'checks' && (
        <QboTable cols={['Check', 'Payee', 'Account', 'Memo', 'Date', 'Amount', 'Status']}
          rows={checks.map((c) => ({ cells: [<span style={{ fontFamily: 'var(--font-mono)' }}>{c.num}</span>, c.payee, c.account, c.memo, c.date, qboMoney(c.amount), <QboStatus s={c.status} />] }))}
          onRow={(r, i) => props.showToast('Check ' + checks[i].num + ' — PDF opened')} />
      )}
      {sub === 'mileage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="MILES · LAST WEEK" value={mileage.reduce((s, m) => s + m.miles, 0).toLocaleString()} delay={0} />
            <StatCard label="DEDUCTION @ $0.70/MI" value={'$' + mileage.reduce((s, m) => s + m.deduction, 0).toFixed(2)} delay={60} />
            <StatCard label="UNREVIEWED TRIPS" value={4} delay={120} />
          </div>
          <QboTable cols={['Technician', 'Vehicle', 'Period', 'Miles', 'Job attribution', 'Deduction']}
            rows={mileage.map((m) => ({ cells: [m.tech, <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{m.vehicle}</span>, m.period, m.miles, m.job, '$' + m.deduction.toFixed(2)] }))}
            onRow={(r, i) => shieldModal({ kind: 'confirm', title: `Approve mileage — ${mileage[i].tech}?`, message: `${mileage[i].miles} miles → $${mileage[i].deduction.toFixed(2)} expense, job-costed to ${mileage[i].job}.`, confirmLabel: 'Approve as expense', onConfirm: () => props.showToast('Mileage approved & job-costed') })} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Approved mileage posts as an expense subtype and flows into <LinkChip screen="costing" label="Job Costing" />.</div>
        </div>
      )}
      {sub === 'cards' && (
        <QboTable cols={['Card', 'Paid from', 'Date', 'Amount', 'Status']}
          rows={cardPays.map((c) => ({ cells: [c.card, c.from, c.date, qboMoney(c.amount), <QboStatus s={c.status} />] }))}
          onRow={() => shieldToast('Payment detail opened', 'info')} />
      )}
    </div>
  );
}

/* ════ AP Plus — 1099 contractors ════ */
function FinanceAPPlus(props) {
  const [sub, setSub] = React.useState('ap');
  const contractors = [
    { name: 'Volt Bros Electrical LLC', ein: '**-***8841', w9: 'On file', ytd: 48200, box: 'NEC-1', efile: 'Ready', linked: true },
    { name: 'SafeWire Security Consulting', ein: '**-***2210', w9: 'On file', ytd: 22400, box: 'NEC-1', efile: 'Ready', linked: true },
    { name: 'Ramirez Concrete Coring', ein: '**-***5567', w9: 'Missing', ytd: 9600, box: 'NEC-1', efile: 'Blocked — W-9', linked: true },
    { name: 'Bay Area Lift Rentals', ein: '**-***9083', w9: 'On file', ytd: 380, box: 'Below $600', efile: 'Not required', linked: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'ap', label: 'Bills & Vendors' }, { id: '1099', label: '1099 Contractors', count: 1 }]} val={sub} set={setSub} />
      {sub === 'ap' && <FinanceAP {...props} />}
      {sub === '1099' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="1099 VENDORS · 2026" value={3} delay={0} />
            <StatCard label="YTD REPORTABLE" value="$80,200" delay={60} />
            <StatCard label="W-9 MISSING" value={1} delay={120} />
            <StatCard label="E-FILE WINDOW OPENS" value="Jan 2027" mono={false} delay={180} />
          </div>
          <QboTable cols={['Contractor', 'TIN', 'W-9', 'YTD payments', 'Form box', 'E-file status', '']}
            rows={contractors.map((c) => ({ cells: [c.name, <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{c.ein}</span>,
              <span style={{ color: c.w9 === 'Missing' ? 'var(--status-critical)' : 'var(--status-ok)', fontSize: 11, fontWeight: 600 }}>{c.w9}</span>,
              qboMoney(c.ytd), c.box, c.efile,
              <LinkChip screen="employees" params={{ teamTab: 'contractors' }} label="Team record" />] }))}
            onRow={(r, i) => {
              const c = contractors[i];
              if (c.w9 === 'Missing') shieldModal({ kind: 'confirm', title: 'Request W-9?', message: `Sends a secure W-9 request to ${c.name}. 1099 e-file stays blocked until received.`, confirmLabel: 'Send request', onConfirm: () => props.showToast('W-9 request sent') });
              else props.showToast(c.name + ' — payment history opened');
            }} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Contractor identities are shared with <LinkChip screen="employees" params={{ teamTab: 'contractors' }} label="Team / Contractors" /> and <LinkChip screen="subcontractors" label="Sub-Contractors" /> — one record, no duplicates.</div>
        </div>
      )}
    </div>
  );
}

/* ════ Customer Statements (Money In) ════ */
function FinanceCustStatements({ showToast }) {
  const stmts = [
    { customer: 'Bayview Medical Plaza', open: 14250, overdue: 14250, last: 'Jun 1 · emailed', status: 'overdue' },
    { customer: 'Sunrise Charter Schools', open: 22100, overdue: 22100, last: 'Jun 1 · emailed', status: 'overdue' },
    { customer: 'Harbor Logistics', open: 6800, overdue: 6800, last: 'never', status: 'due' },
    { customer: 'Pinnacle Financial Group', open: 128500, overdue: 0, last: 'Jun 1 · emailed', status: 'upcoming' },
    { customer: 'City Hall', open: 0, overdue: 0, last: 'Jun 1 · emailed', status: 'filed' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginRight: 'auto' }}>Customer balance statements — branding inherited from <LinkChip screen="finance" params={{ financeTab: 'branding' }} label="Branding" />. Delivery history is audit-logged.</div>
        <button onClick={() => shieldModal({ kind: 'confirm', title: 'Generate statements?', message: 'Generates balance-forward statements for all customers with open balances (4) for the period Jun 1 – Jul 5. Review before sending.', confirmLabel: 'Generate 4 statements', onConfirm: () => showToast('4 statements generated — review & send') })} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Generate statements…</button>
      </div>
      <QboTable cols={['Customer', 'Open balance', 'Overdue', 'Last statement', 'Status']}
        rows={stmts.map((s) => ({ cells: [s.customer, qboMoney(s.open), s.overdue ? <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>{qboMoney(s.overdue)}</span> : '—', s.last, <QboStatus s={s.status} />] }))}
        onRow={(r, i) => {
          const s = stmts[i];
          shieldModal({ kind: 'detail', title: s.customer, subtitle: 'Statement preview · Jun 1 – Jul 5, 2026',
            sections: [{ label: 'Balance', rows: [{ k: 'Open balance', v: qboMoney(s.open) }, { k: 'Overdue', v: qboMoney(s.overdue) }, { k: 'Last delivery', v: s.last, mono: false }] }],
            actions: [
              { label: 'Download PDF', onClick: () => showToast('Statement PDF downloaded'), close: true },
              { label: 'Email statement', primary: true, successMsg: 'Statement emailed — delivery logged', onClick: () => {}, close: true },
            ] });
        }} />
    </div>
  );
}

Object.assign(window, { QboSubTabs, QboTable, QboStatus, qboMoney, FinanceSalesTax, FinanceLending, FinanceInvoicesPlus, FinanceExpensesPlus, FinanceAPPlus, FinanceCustStatements });

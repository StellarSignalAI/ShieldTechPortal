/* Finance Suite — the QuickBooks Online shell, page for page.
   Left rail (Create · Bookmarks · Home · Feed · Reports · All apps · pinned
   Accounting / Expenses / Sales · Customise), the ALL APPS tree with every
   QuickBooks page, the global "Navigate or search for transactions, contacts,
   reports, and more" bar, and one page template (title · green New ▾ button ·
   money bar · filters · table · row actions · pagination). Pages QuickBooks
   has that ShieldTech lacked are built here (Receipts, Rules, My accountant,
   Suppliers, Sales overview, Sales transactions, Customers, Customer Hub,
   Management reports, transaction search); the rest re-host the existing
   Finance components inside the same chrome. Every number is ShieldTech's
   own data; every create goes through the shared "+ New" engine. Tokens only. */

const QBO_APPS = [
  { id: 'accounting', label: 'Accounting', color: 'var(--brand)', pages: [['bank-transactions', 'Bank transactions'], ['integration-transactions', 'Integration transactions'], ['receipts', 'Receipts'], ['reconcile', 'Reconcile'], ['rules', 'Rules'], ['accounts', 'Chart of accounts'], ['recurring', 'Recurring transactions'], ['accountant', 'My accountant']] },
  { id: 'expenses', label: 'Expenses & Bills', color: 'var(--disc-cabling, #27E39A)', pages: [['expenses', 'Expense transactions'], ['vendors', 'Suppliers'], ['ap', 'Bills']] },
  { id: 'sales', label: 'Sales & Get Paid', color: 'var(--disc-access, #19E3EC)', pages: [['sales-overview', 'Overview'], ['sales-transactions', 'Sales transactions'], ['invoices', 'Invoices'], ['products', 'Products & services']] },
  { id: 'customers', label: 'Customer Hub', color: 'var(--disc-alarm, #9B5CFF)', pages: [['customer-hub', 'Overview'], ['leads', 'Leads'], ['customers', 'Customers'], ['estimates', 'Estimates'], ['reviews', 'Reviews']] },
  { id: 'team', label: 'Team', color: 'var(--status-warn)', pages: [['employees', 'Employees'], ['timesheets', 'Timesheets'], ['payroll', 'Payroll']] },
  { id: 'tax', label: 'Tax', color: 'var(--disc-fire, #FF3B5C)', pages: [['sales-tax', 'Overview']] },
  { id: 'marketing', label: 'Marketing', color: 'var(--text-low)', pages: [['marketing', 'Overview']] },
];
const QBO_REPORTS = [['reports-center', 'Standard reports'], ['custom-reports', 'Custom reports'], ['management-reports', 'Management reports'], ['cash-flow-overview', 'Cash flow overview'], ['cash-flow-planner', 'Cash flow planner']];
const QBO_EXTRA = { overview: 'Home', feed: 'Feed', search: 'Search', settings: 'Account and settings', branding: 'Custom form styles', 'qbo-map': 'QuickBooks connection', ledger: 'General ledger', 'statements-fin': 'Financial statements', statements: 'Customer statements', credits: 'Sales receipts & credits', stripe: 'Payments & links', lending: 'Lending', copilot: 'AI Co-pilot', bankfeed: 'Bank transactions' };
const QBO_PAGE_APP = {};
QBO_APPS.forEach(a => a.pages.forEach(([id]) => { QBO_PAGE_APP[id] = a.id; }));
QBO_REPORTS.forEach(([id]) => { QBO_PAGE_APP[id] = 'reports'; });
const qbTitle = (id) => { for (const a of QBO_APPS) { const p = a.pages.find(x => x[0] === id); if (p) return p[1]; } const r = QBO_REPORTS.find(x => x[0] === id); return r ? r[1] : (QBO_EXTRA[id] || id); };
const qbMoney = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qbDate = (d) => d ? new Date(String(d).length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : '—';
const QB_GREEN = 'var(--status-ok)';

/* ── primitives ── */
function QbBtn({ children, onClick, primary, caret, small, style }) {
  return (
    <span style={{ display: 'inline-flex', borderRadius: 4, overflow: 'hidden', border: primary ? 'none' : '1px solid var(--border-strong)', ...(style || {}) }}>
      <button onClick={onClick} style={{ padding: small ? '5px 10px' : '7px 14px', background: primary ? QB_GREEN : 'var(--card)', color: primary ? '#06140c' : 'var(--text-high)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{children}</button>
      {caret && <button onClick={caret} style={{ padding: '0 9px', background: primary ? QB_GREEN : 'var(--card)', color: primary ? '#06140c' : 'var(--text-high)', border: 'none', borderLeft: `1px solid ${primary ? 'rgba(0,0,0,0.2)' : 'var(--border-strong)'}`, cursor: 'pointer', fontSize: 10 }}>▾</button>}
    </span>
  );
}
function QbSelect({ label, value, onChange, options, width }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {label && <span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{label}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: width || 150, padding: '6px 8px', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 4, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)' }}>
        {options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function QbSearch({ value, onChange, placeholder, width }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search'} style={{ width: width || 220, padding: '6px 10px', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 4, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />;
}
/* QuickBooks' money bar: "Unpaid last 365 days" style groups of colored segments */
function QboMoneyBar({ groups }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${groups.length}, 1fr)`, gap: 18, padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
      {groups.map(g => { const total = g.segments.reduce((s, x) => s + (x.value || 0), 0); return (
        <div key={g.label}>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}><span className="mono" style={{ fontWeight: 600, color: 'var(--text-high)' }}>{qbMoney(total)}</span> {g.label} <span style={{ color: 'var(--text-low)' }}>{g.sub}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${g.segments.length}, 1fr)`, gap: 10, marginTop: 8 }}>
            {g.segments.map(s => <div key={s.label}><div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{qbMoney(s.value)}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{s.label}</div></div>)}
          </div>
          <div style={{ display: 'flex', height: 12, borderRadius: 3, overflow: 'hidden', background: 'var(--border-subtle)', marginTop: 8, gap: 2 }}>
            {g.segments.map(s => <div key={s.label} title={`${s.label}: ${qbMoney(s.value)}`} style={{ width: total > 0 ? `${(s.value || 0) / total * 100}%` : `${100 / g.segments.length}%`, background: s.color, opacity: total > 0 && !s.value ? 0.25 : 1 }} />)}
          </div>
        </div>
      ); })}
    </div>
  );
}
/* QuickBooks' list table: checkbox column, sortable headers, action column with primary link ▾, footer total, pagination */
function QboList({ cols, rows, empty, total, pageSize = 25, onRow }) {
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState(null);
  const sorted = React.useMemo(() => { if (!sort) return rows; const i = sort.i; return [...rows].sort((a, b) => { const x = a.sortv ? a.sortv[i] : a.cells[i], y = b.sortv ? b.sortv[i] : b.cells[i]; const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? '')); return sort.dir === 'asc' ? r : -r; }); }, [rows, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)); const cur = Math.min(page, pages);
  const slice = sorted.slice((cur - 1) * pageSize, cur * pageSize);
  const [checked, setChecked] = React.useState({});
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--modal)' }}>
            <th style={{ width: 34, padding: '9px 12px', borderBottom: '1px solid var(--border-subtle)' }}><input type="checkbox" onChange={e => setChecked(e.target.checked ? Object.fromEntries(slice.map((_, i) => [i, true])) : {})} /></th>
            {cols.map((c, i) => { const col = typeof c === 'string' ? { label: c } : c; return <th key={i} onClick={() => col.sortable !== false && setSort(s => ({ i, dir: s && s.i === i && s.dir === 'asc' ? 'desc' : 'asc' }))} style={{ textAlign: col.align || 'left', padding: '9px 12px', fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-mid)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', cursor: col.sortable === false ? 'default' : 'pointer', fontFamily: 'var(--font-mono)' }}>{col.label}{sort && sort.i === i ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>; })}
          </tr></thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={r.key || i} onClick={() => onRow && onRow(r)} style={{ cursor: onRow ? 'pointer' : 'default', background: checked[i] ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent' }} onMouseEnter={e => { if (!checked[i]) e.currentTarget.style.background = 'color-mix(in srgb, var(--brand) 4%, transparent)'; }} onMouseLeave={e => { if (!checked[i]) e.currentTarget.style.background = 'transparent'; }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={!!checked[i]} onChange={e => setChecked(c => ({ ...c, [i]: e.target.checked }))} /></td>
                {r.cells.map((c, j) => { const col = typeof cols[j] === 'string' ? {} : cols[j]; return <td key={j} className={col.mono ? 'mono' : ''} style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', textAlign: col.align || 'left', whiteSpace: 'nowrap', color: 'var(--text-high)' }}>{c}</td>; })}
              </tr>
            ))}
            {slice.length === 0 && <tr><td colSpan={cols.length + 1} style={{ padding: '36px 12px', textAlign: 'center' }}><div style={{ fontSize: 22, color: 'var(--text-low)' }}>⌕</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{empty || 'No results found'}</div><div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>Remove some filters or try a different search</div></td></tr>}
          </tbody>
          {total && <tfoot><tr style={{ background: 'var(--modal)' }}><td style={{ padding: '8px 12px' }} /><td colSpan={cols.length - total.length} style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 700 }}>Total</td>{total.map((t, i) => <td key={i} className="mono" style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{t}</td>)}</tr></tfoot>}
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '8px 14px', fontSize: 11, color: 'var(--text-low)', borderTop: '1px solid var(--border-subtle)' }}>
        <span>{sorted.length ? `${(cur - 1) * pageSize + 1} - ${Math.min(cur * pageSize, sorted.length)} of ${sorted.length} items` : '0 - 0 of 0 items'}</span>
        <button disabled={cur <= 1} onClick={() => setPage(p => p - 1)} style={{ background: 'none', border: 'none', color: cur <= 1 ? 'var(--text-low)' : 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11 }}>‹ Previous</button>
        <span>Page <input className="mono" value={cur} onChange={e => setPage(Math.max(1, Math.min(pages, Number(e.target.value) || 1)))} style={{ width: 28, textAlign: 'center', padding: 2, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 3, color: 'var(--text-high)', fontSize: 11 }} /> of {pages}</span>
        <button disabled={cur >= pages} onClick={() => setPage(p => p + 1)} style={{ background: 'none', border: 'none', color: cur >= pages ? 'var(--text-low)' : 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11 }}>Next ›</button>
      </div>
    </div>
  );
}
function QbAction({ label, onClick, more }) {
  return <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><button onClick={onClick} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>{label}</button>{more && <button onClick={more} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}>▾</button>}</span>;
}
function QbTabs({ tabs, value, onChange }) {
  return <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 4, overflow: 'hidden' }}>{tabs.map(t => { const [id, l] = Array.isArray(t) ? t : [t, t]; const on = value === id; return <button key={id} onClick={() => onChange(id)} style={{ padding: '6px 16px', background: on ? 'var(--modal)' : 'var(--card)', color: on ? 'var(--text-high)' : 'var(--text-mid)', border: 'none', borderRight: '1px solid var(--border-strong)', fontSize: 12, fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>; })}</div>;
}
/* page template */
function QboPage({ title, crumbs, actions, children, wide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: wide ? 'none' : 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>{crumbs && <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 2 }}>{crumbs.join(' / ')}</div>}<div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>
      </div>
      {children}
    </div>
  );
}
const qbNew = (kind, prefill) => window.openQboNew ? window.openQboNew(kind, prefill) : shieldToast('The + New forms are not loaded', 'warn');
const qbIsoToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const qbWithin = (d, days) => d && (Date.now() - new Date(String(d).length === 10 ? d + 'T00:00:00' : d).getTime()) <= days * 86400000;

/* ══════════════ new pages ══════════════ */
function QboInvoicesPage(props) {
  const inv = useMergedInvoices();
  const open = inv.filter(i => i.status === 'pending' || i.status === 'overdue');
  const overdue = open.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const notDue = open.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const paid30 = inv.filter(i => i.status === 'paid' && qbWithin((i._raw || {}).paidAt ? new Date(i._raw.paidAt).toISOString() : (i._raw || {}).txn_date, 30));
  const deposited = paid30.filter(i => (i._raw || {}).deposited).reduce((s, i) => s + i.amount, 0);
  return (
    <QboPage title="Invoices" actions={<React.Fragment><QbBtn onClick={() => props.showToast('Batch actions apply to checked rows')}>Batch actions ▾</QbBtn><QbBtn primary onClick={() => qbNew('invoice')} caret={() => qbNew('menu')}>Create invoice</QbBtn></React.Fragment>}>
      <QboMoneyBar groups={[{ label: 'Unpaid', sub: 'Last 365 days', segments: [{ label: 'Overdue', value: overdue, color: 'var(--status-warn)' }, { label: 'Not due yet', value: notDue, color: 'var(--text-low)' }] }, { label: 'Paid', sub: 'Last 30 days', segments: [{ label: 'Not deposited', value: paid30.reduce((s, i) => s + i.amount, 0) - deposited, color: 'color-mix(in srgb, var(--status-ok) 55%, transparent)' }, { label: 'Deposited', value: deposited, color: 'var(--status-ok)' }] }]} />
      <FinanceInvoicesPlus {...props} />
    </QboPage>
  );
}
function QboSalesOverview({ onNav }) {
  const inv = useMergedInvoices();
  const est = useMergedEstimates();
  const today = new Date(); const mk = today.toISOString().slice(0, 7);
  const lastMk = new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().slice(0, 7);
  const monthRows = inv.filter(i => i.status !== 'draft' && i.status !== 'void' && String((i._raw || {}).txn_date || '').startsWith(mk));
  const lastRows = inv.filter(i => i.status !== 'draft' && i.status !== 'void' && String((i._raw || {}).txn_date || '').startsWith(lastMk));
  const thisM = monthRows.reduce((s, i) => s + i.amount, 0), lastM = lastRows.reduce((s, i) => s + i.amount, 0);
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daily = Array.from({ length: days }, (_, d) => monthRows.filter(i => Number(String((i._raw || {}).txn_date || '').slice(8, 10)) === d + 1).reduce((s, i) => s + i.amount, 0));
  const quick = [['Customer', () => qbNew('customer')], ['Product or service', () => qbNew('item')], ['Estimate', () => qbNew('estimate')], ['Invoice', () => qbNew('invoice')], ['Recurring invoice', () => onNav('recurring')], ['Receive payment', () => qbNew('payment')], ['Sales receipt', () => onNav('credits')], ['Bank deposit', () => onNav('bank-transactions')], ['Create statement', () => onNav('statements')]];
  const open = inv.filter(i => i.status === 'pending' || i.status === 'overdue');
  return (
    <QboPage title="Sales & Get Paid overview" wide>
      <QboMoneyBar groups={[{ label: 'Sales pipeline', sub: 'as of today', segments: [{ label: `${est.filter(e => e.status === 'sent').length} estimates`, value: est.filter(e => e.status === 'sent').reduce((s, e) => s + e.amount, 0), color: 'var(--disc-access, #19E3EC)' }, { label: 'Unbilled income', value: 0, color: 'var(--disc-alarm, #9B5CFF)' }, { label: `${open.filter(i => i.status === 'overdue').length} overdue invoices`, value: open.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0), color: 'var(--status-warn)' }, { label: `${open.length} open invoices or credit`, value: open.reduce((s, i) => s + i.amount, 0), color: 'color-mix(in srgb, var(--status-ok) 55%, transparent)' }, { label: 'recently paid', value: inv.filter(i => i.status === 'paid' && qbWithin((i._raw || {}).txn_date, 30)).reduce((s, i) => s + i.amount, 0), color: 'var(--status-ok)' }] }]} />
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '16px 18px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quick actions <span style={{ fontSize: 11, color: 'var(--text-low)', fontWeight: 400 }}>ⓘ</span></div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 10 }}>Money in</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10, background: 'var(--modal)', padding: 14, borderRadius: 6 }}>
          {quick.map(([l, fn]) => <button key={l} onClick={fn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-high)', fontSize: 11 }}><span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border-strong)', display: 'grid', placeItems: 'center', position: 'relative' }}><span style={{ fontSize: 16, color: 'var(--text-mid)' }}>▤</span><span style={{ position: 'absolute', right: -2, bottom: -2, width: 16, height: 16, borderRadius: '50%', background: QB_GREEN, color: '#06140c', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>+</span></span>{l}</button>)}
        </div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontSize: 14, fontWeight: 700 }}>Income over time <span style={{ fontSize: 11, color: 'var(--text-low)', fontWeight: 400 }}>ⓘ</span></div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>Duration: This month · Compare to previous month {lastM ? <span className="mono" style={{ color: thisM >= lastM ? 'var(--status-ok)' : 'var(--status-critical)' }}>{thisM >= lastM ? '↑' : '↓'} {qbMoney(Math.abs(thisM - lastM))}</span> : null}</div></div>
        <div className="mono" style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 2px' }}>{qbMoney(thisM)} <span style={{ fontSize: 11, color: 'var(--text-low)', fontWeight: 400 }}>This month</span></div>
        {window.QgArea && <QgArea values={daily} labels={[1, 6, 11, 16, 21, 26, days].map(d => `${today.toLocaleDateString('en-US', { month: 'short' })} ${d}`)} color={QB_GREEN} height={140} />}
      </div>
    </QboPage>
  );
}
function QboSalesTransactions({ showToast }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [pays, setPays] = React.useState([]);
  React.useEffect(() => { const q = window.__shieldQBO; if (q && q.payments) q.payments(500).then(r => setPays(r && r.ok ? r.data : [])); }, []);
  const [type, setType] = React.useState('All transactions'); const [date, setDate] = React.useState('365'); const [cust, setCust] = React.useState(''); const [status, setStatus] = React.useState('All statuses');
  const rows = [
    ...inv.map(i => ({ date: (i._raw || {}).txn_date || '', type: 'Invoice', no: i.num, customer: i.customer, memo: (i.lines || [])[0] ? i.lines[0].desc : '', amount: i.amount, status: i.status === 'overdue' ? `Overdue ${i.days} days` : i.status === 'pending' ? `Due ${i.due}` : i.status === 'paid' ? 'Paid' : i.status, st: i.status, obj: i, kind: 'invoice' })),
    ...est.map(e => ({ date: (e._raw || {}).txn_date || e.date || '', type: 'Estimate', no: e.num, customer: e.customer, memo: (e.lines || [])[0] ? e.lines[0].desc : '', amount: e.amount, status: e.status === 'sent' ? 'Pending' : e.status, st: e.status, obj: e, kind: 'estimate' })),
    ...pays.map(p => ({ date: p.txn_date || '', type: 'Payment', no: p.doc_number || p.qbo_id, customer: p.customer_name || '', memo: p.memo || p.method || '', amount: Number(p.total) || 0, status: 'Closed', st: 'paid', obj: p, kind: 'payment' })),
  ].filter(r => (type === 'All transactions' || r.type === type) && (!cust || r.customer.toLowerCase().includes(cust.toLowerCase())) && (date === 'all' || qbWithin(r.date, Number(date))) && (status === 'All statuses' || r.st === status.toLowerCase()))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const act = (r) => r.kind === 'invoice' && r.st !== 'paid' ? <QbAction label="Receive payment" onClick={() => qbNew('payment', { invoice: r.obj })} more={() => qbNew('menu')} /> : r.kind === 'estimate' ? <QbAction label="Create invoice" onClick={() => qbNew('invoice')} more={() => qbNew('menu')} /> : <QbAction label="View" onClick={() => showToast('Open the Invoices page to edit')} />;
  return (
    <QboPage title="Sales transactions" actions={<React.Fragment><QbBtn onClick={() => showToast('Batch actions apply to checked rows')}>Batch actions ▾</QbBtn><QbBtn primary onClick={() => qbNew('menu')} caret={() => qbNew('menu')}>New transaction</QbBtn></React.Fragment>} wide>
      <QboMoneyBar groups={[{ label: '', sub: '', segments: [{ label: `${est.length} estimates`, value: est.reduce((s, e) => s + e.amount, 0), color: 'var(--disc-access, #19E3EC)' }, { label: 'Unbilled income', value: 0, color: 'var(--disc-alarm, #9B5CFF)' }, { label: `${inv.filter(i => i.status === 'overdue').length} overdue invoices`, value: inv.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0), color: 'var(--status-warn)' }, { label: `${inv.filter(i => i.status === 'pending' || i.status === 'overdue').length} open invoices or credit`, value: inv.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0), color: 'color-mix(in srgb, var(--status-ok) 55%, transparent)' }, { label: 'recently paid', value: inv.filter(i => i.status === 'paid' && qbWithin((i._raw || {}).txn_date, 30)).reduce((s, i) => s + i.amount, 0), color: 'var(--status-ok)' }] }]} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <QbSelect label="Type" value={type} onChange={setType} options={['All transactions', 'Invoice', 'Estimate', 'Payment']} />
        <QbSelect label="Date" value={date} onChange={setDate} options={[['90', 'Last 3 months'], ['365', 'Last 12 months'], ['all', 'All dates']]} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>Customer</span><QbSearch value={cust} onChange={setCust} placeholder="Search" width={180} /></label>
        <QbSelect label="Status" value={status} onChange={setStatus} options={['All statuses', 'Paid', 'Pending', 'Overdue', 'Sent', 'Accepted', 'Draft']} />
      </div>
      <QboList cols={['Date', 'Type', 'No.', 'Customer', 'Memo', { label: 'Amount', align: 'right', mono: true }, 'Status', { label: 'Action', sortable: false, align: 'right' }]} rows={rows.map(r => ({ key: r.type + r.no, cells: [qbDate(r.date), r.type, r.no, r.customer, <span style={{ color: 'var(--text-low)' }}>{r.memo}</span>, qbMoney(r.amount), <span style={{ color: r.st === 'overdue' ? 'var(--status-critical)' : r.st === 'paid' ? 'var(--status-ok)' : 'var(--text-mid)' }}>{r.status}</span>, act(r)], sortv: [r.date, r.type, r.no, r.customer, r.memo, r.amount, r.status, ''] }))} total={[qbMoney(total), '', '']} empty="No sales transactions" />
    </QboPage>
  );
}
function QboCustomers({ onNav, showToast }) {
  const [custs] = useShieldStore(customerStore);
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [q, setQ] = React.useState('');
  const bal = (name) => inv.filter(i => i.customer === name && (i.status === 'pending' || i.status === 'overdue')).reduce((s, i) => s + i.amount, 0);
  const names = [...new Set([...(custs || []).map(c => c.name), ...inv.map(i => i.customer)].filter(Boolean))].sort();
  const rows = names.filter(n => !q || n.toLowerCase().includes(q.toLowerCase())).map(n => { const c = (custs || []).find(x => x.name === n) || {}; const b = bal(n); return { key: n, cells: [<span style={{ color: 'var(--brand)', fontWeight: 600 }}>{n}</span>, c.company || c.category || '', <span className="mono">{c.phone || ''}</span>, c.email || c.contact || '', 'USD', qbMoney(b), b > 0 ? <QbAction label="Receive payment" onClick={() => { const oldest = inv.filter(i => i.customer === n && i.status !== 'paid').sort((a, b2) => b2.days - a.days)[0]; qbNew('payment', { invoice: oldest }); }} more={() => qbNew('menu')} /> : <QbAction label="Create invoice" onClick={() => qbNew('invoice')} more={() => qbNew('menu')} />], sortv: [n, c.company || '', c.phone || '', c.email || '', 'USD', b, ''], name: n }; });
  const open = inv.filter(i => i.status === 'pending' || i.status === 'overdue');
  return (
    <QboPage title="Customers" actions={<QbBtn primary onClick={() => qbNew('customer')} caret={() => qbNew('menu')}>New customer</QbBtn>}>
      <QboMoneyBar groups={[{ label: '', sub: '', segments: [{ label: `${est.filter(e => e.status === 'sent').length} estimates`, value: est.filter(e => e.status === 'sent').reduce((s, e) => s + e.amount, 0), color: 'var(--disc-access, #19E3EC)' }, { label: 'Unbilled income', value: 0, color: 'var(--disc-alarm, #9B5CFF)' }, { label: `${open.filter(i => i.status === 'overdue').length} overdue invoices`, value: open.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0), color: 'var(--status-warn)' }, { label: `${open.length} open invoices and credits`, value: open.reduce((s, i) => s + i.amount, 0), color: 'color-mix(in srgb, var(--status-ok) 55%, transparent)' }, { label: 'recently paid', value: inv.filter(i => i.status === 'paid' && qbWithin((i._raw || {}).txn_date, 30)).reduce((s, i) => s + i.amount, 0), color: 'var(--status-ok)' }] }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><QbSearch value={q} onChange={setQ} placeholder="Search" /><span style={{ fontSize: 11, color: 'var(--text-low)' }}>{names.length} customers · open the full customer hub for sites, assets and contacts</span></div>
      <QboList cols={['Name', 'Company name', 'Phone', 'Email', 'Currency', { label: 'Open balance', align: 'right', mono: true }, { label: 'Action', sortable: false, align: 'right' }]} rows={rows} onRow={(r) => { if (window.__shieldNav) { window.__qboParams = { customer: r.name }; qboGo('customers-list', { customer: r.name }); } }} empty="No customers yet" />
    </QboPage>
  );
}
function QboCustomerHub({ onNav }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [projects] = useShieldStore(projectStore); const [nps] = useShieldStore(npsStore); const [approvals] = useShieldStore(approvalStore); const [wos] = useShieldStore(workOrderStore);
  const openEst = est.filter(e => e.status === 'sent'); const unpaid = inv.filter(i => i.status === 'pending' || i.status === 'overdue');
  const inProg = (projects || []).filter(p => !['completed', 'closed', 'cancelled', 'draft'].includes(String(p.status || '').toLowerCase()));
  const requests = (wos || []).filter(w => w.status === 'requested');
  const tasks = (approvals || []).filter(a => a.status === 'pending');
  const card = (title, right, body, foot, onFoot) => <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mid)', fontWeight: 600 }}>{title}</span><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{right}</span></div><div style={{ flex: 1 }}>{body}</div>{foot && <button onClick={onFoot} style={{ alignSelf: 'flex-start', marginTop: 10, background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{foot}</button>}</div>;
  const funnel = [['Open leads', '—', () => qboGo('crm'), 'var(--disc-access, #19E3EC)'], ['Open estimates', openEst.length, () => onNav('estimates'), 'var(--brand)'], ['In progress projects', inProg.length, () => qboGo('projects'), 'var(--disc-cabling, #27E39A)'], ['Unpaid invoices', unpaid.length, () => onNav('invoices'), 'var(--status-warn)'], ['Reviews', (nps || []).length, () => onNav('reviews'), 'var(--disc-alarm, #9B5CFF)']];
  const miniTable = (cols, rows) => <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}><thead><tr>{cols.map((c, i) => <th key={c} style={{ textAlign: i ? 'right' : 'left', padding: '4px 0', fontSize: 9.5, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid var(--border-subtle)' }}>{c}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? 'mono' : ''} style={{ padding: '6px 0', textAlign: j ? 'right' : 'left', borderBottom: '1px solid var(--border-subtle)', color: j === 0 ? 'var(--brand)' : 'var(--text-high)' }}>{c}</td>)}</tr>)}</tbody></table>;
  return (
    <QboPage title="Customer Hub overview" wide>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Customers at a glance</div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mid)', fontWeight: 600 }}>Customers funnel</span><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>As of today</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>{funnel.map(([l, v, fn, c]) => <button key={l} onClick={fn} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 4, border: '1px solid var(--border-subtle)', borderTop: `3px solid ${c}`, background: 'var(--modal)', color: 'var(--text-high)', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span><div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{l}</div><div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{v}</div></span><span style={{ color: 'var(--text-low)' }}>›</span></button>)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {card('Open estimates', 'As of today', <React.Fragment><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Potential cash leads</div><div className="mono" style={{ fontSize: 20, fontWeight: 600, margin: '2px 0 8px' }}>{qbMoney(openEst.reduce((s, e) => s + e.amount, 0))}</div>{miniTable(['Client', 'Date', 'Amount'], openEst.slice(0, 5).map(e => [e.customer, qbDate((e._raw || {}).txn_date || e.date), qbMoney(e.amount)]))}</React.Fragment>, 'View estimates', () => onNav('estimates'))}
        {card('Tasks', `${tasks.length} open tasks ▾`, tasks.length ? miniTable(['Task', 'Due date', 'Actions'], tasks.slice(0, 6).map(t => [t.title, '—', t.kind])) : <div style={{ textAlign: 'center', padding: '24px 0' }}><div style={{ fontSize: 18, color: 'var(--status-ok)' }}>✓</div><div style={{ fontSize: 13, fontWeight: 700 }}>You're caught up!</div><div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>You don't have any tasks to do. Check back soon to stay on top of things.</div></div>, 'Show all', () => qboGo('approvals'))}
        {card('Work requests', '', <React.Fragment><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{requests.length}</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 8 }}>These customers requested to work with you again.</div>{miniTable(['Customer name', 'Timeframe'], requests.slice(0, 5).map(w => [`${w.customer} · ${w.id}`, w.scheduled || '—']))}</React.Fragment>, 'Manage survey settings', () => qboGo('workorder'))}
        {card('Referrals', '', <React.Fragment><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>0</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Opportunities for new business referred by your existing customers.</div></React.Fragment>, 'Manage survey settings', () => onNav('reviews'))}
        {card('Reviews & testimonials', '', <React.Fragment><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{(nps || []).length}</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>NPS responses and testimonials collected after jobs.</div></React.Fragment>, 'View reviews', () => onNav('reviews'))}
        {card('Overdue invoices', 'As of today', <React.Fragment><div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--status-critical)' }}>{qbMoney(unpaid.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0))}</div>{miniTable(['Customer', 'Days', 'Amount'], unpaid.filter(i => i.status === 'overdue').sort((a, b) => b.days - a.days).slice(0, 5).map(i => [i.customer, `${i.days}d`, qbMoney(i.amount)]))}</React.Fragment>, 'Send reminders', () => onNav('invoices'))}
      </div>
    </QboPage>
  );
}
function QboVendors({ onNav }) {
  const [vendors, setVendors] = React.useState([]); const [bills, setBills] = React.useState([]);
  const load = React.useCallback(() => { const q = window.__shieldQBO; if (!q) return; q.vendors(1000).then(r => setVendors(r && r.ok ? r.data : [])); q.bills(1000).then(r => setBills(r && r.ok ? r.data : [])); }, []);
  React.useEffect(() => { load(); window.addEventListener('qbo:changed', load); return () => window.removeEventListener('qbo:changed', load); }, [load]);
  const [q, setQ] = React.useState('');
  const openB = bills.filter(b => Number(b.balance) > 0); const today = qbIsoToday();
  const overdue = openB.filter(b => b.due_date && b.due_date < today).reduce((s, b) => s + Number(b.balance), 0);
  const paid30 = bills.filter(b => !(Number(b.balance) > 0) && qbWithin(b.txn_date, 30)).reduce((s, b) => s + (Number(b.total) || 0), 0);
  const names = [...new Set([...vendors.map(v => v.display_name || v.name), ...bills.map(b => b.vendor_name)].filter(Boolean))].sort();
  const rows = names.filter(n => !q || n.toLowerCase().includes(q.toLowerCase())).map(n => { const v = vendors.find(x => (x.display_name || x.name) === n) || {}; const b = openB.filter(x => x.vendor_name === n).reduce((s, x) => s + Number(x.balance), 0); return { key: n, cells: [<span style={{ color: 'var(--brand)', fontWeight: 600 }}>{n}</span>, v.company_name || '', <span className="mono">{v.phone || ''}</span>, v.email || '', 'USD', qbMoney(b), b > 0 ? <QbAction label="Make payment" onClick={() => qbNew('billpayment', { bill: openB.find(x => x.vendor_name === n) })} more={() => qbNew('menu')} /> : <QbAction label="Create bill" onClick={() => qbNew('bill', { vendor: n })} more={() => qbNew('menu')} />], sortv: [n, v.company_name || '', v.phone || '', v.email || '', 'USD', b, ''] }; });
  return (
    <QboPage title="Suppliers" actions={<QbBtn primary onClick={() => qbNew('vendor')} caret={() => qbNew('menu')}>New supplier</QbBtn>}>
      <QboMoneyBar groups={[{ label: 'Unpaid', sub: 'Last 365 days', segments: [{ label: `${openB.filter(b => b.due_date && b.due_date < today).length} overdue`, value: overdue, color: 'var(--status-warn)' }, { label: `${openB.length} open bills`, value: openB.reduce((s, b) => s + Number(b.balance), 0) - overdue, color: 'var(--text-low)' }] }, { label: 'Paid', sub: '', segments: [{ label: `${bills.filter(b => !(Number(b.balance) > 0) && qbWithin(b.txn_date, 30)).length} paid last 30 days`, value: paid30, color: 'var(--status-ok)' }] }]} />
      <QbSearch value={q} onChange={setQ} placeholder="Search" />
      <QboList cols={['Supplier', 'Company name', 'Phone', 'Email', 'Currency', { label: 'Open balance', align: 'right', mono: true }, { label: 'Action', sortable: false, align: 'right' }]} rows={rows} empty={window.__shieldQBO ? 'No suppliers yet — enter a bill or connect QuickBooks' : 'Backend not configured'} />
    </QboPage>
  );
}
function QboBillsPage(props) {
  const [tab, setTab] = React.useState('unpaid');
  const [bills, setBills] = React.useState([]);
  const load = React.useCallback(() => { const q = window.__shieldQBO; if (q) q.bills(1000).then(r => setBills(r && r.ok ? r.data : [])); }, []);
  React.useEffect(() => { load(); window.addEventListener('qbo:changed', load); return () => window.removeEventListener('qbo:changed', load); }, [load]);
  const today = qbIsoToday();
  const list = bills.filter(b => tab === 'paid' ? !(Number(b.balance) > 0) : tab === 'unpaid' ? Number(b.balance) > 0 : b.status === 'review');
  const rows = list.map(b => ({ key: b.qbo_id, cells: [<span style={{ color: 'var(--brand)', fontWeight: 600 }}>{b.vendor_name || 'Vendor'}</span>, <span style={{ color: b.due_date && b.due_date < today && Number(b.balance) > 0 ? 'var(--status-critical)' : 'var(--text-high)' }}>{qbDate(b.due_date)}</span>, qbMoney(b.total), qbMoney(b.balance), Number(b.balance) > 0 ? (b.due_date && b.due_date < today ? 'Overdue' : 'Open') : 'Paid', Number(b.balance) > 0 ? <QbAction label="Mark as paid" onClick={() => qbNew('billpayment', { bill: b })} more={() => qbNew('menu')} /> : <QbAction label="View" onClick={() => props.showToast('Bill detail opens in Bills & AP')} />], sortv: [b.vendor_name || '', b.due_date || '', Number(b.total) || 0, Number(b.balance) || 0, '', ''] }));
  return (
    <QboPage title="Bills" actions={<React.Fragment><QbBtn onClick={() => qbNew('billpayment', { bill: list.find(b => Number(b.balance) > 0) })} caret={() => qbNew('menu')}>Pay bills</QbBtn><QbBtn primary onClick={() => qbNew('bill')} caret={() => qbNew('menu')}>Add bill</QbBtn></React.Fragment>} wide>
      <QbTabs tabs={[['review', 'For review'], ['unpaid', 'Unpaid'], ['paid', 'Paid']]} value={tab} onChange={setTab} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}><QbSelect label="Supplier" value="All" onChange={() => {}} options={['All']} /><QbSelect label="Bill date" value="This year" onChange={() => {}} options={['This year', 'Last 12 months', 'All']} /></div>
      <QboList cols={['Supplier', 'Due date', { label: 'Bill amount', align: 'right', mono: true }, { label: 'Open balance', align: 'right', mono: true }, 'Status', { label: 'Action', sortable: false, align: 'right' }]} rows={rows} total={[qbMoney(list.reduce((s, b) => s + (Number(b.total) || 0), 0)), qbMoney(list.reduce((s, b) => s + (Number(b.balance) || 0), 0)), '', '']} empty="No results found" />
      <details><summary style={{ fontSize: 12, color: 'var(--brand)', cursor: 'pointer' }}>Bills & AP workspace (aging, vendor detail, drawers)</summary><div style={{ marginTop: 12 }}><FinanceAPPlus {...props} /></div></details>
    </QboPage>
  );
}
function QboReceipts({ showToast }) {
  const [tab, setTab] = React.useState('inbox');
  const [rows, setRows] = React.useState([]); const fileRef = React.useRef(null);
  const load = React.useCallback(() => { const r = window.__shieldReceipts; if (r) r.list().then(x => setRows(x && x.ok ? x.data : [])); }, []);
  React.useEffect(() => { load(); window.addEventListener('qbo:changed', load); return () => window.removeEventListener('qbo:changed', load); }, [load]);
  const upload = async (e) => { const files = [...(e.target.files || [])]; e.target.value = ''; const r = window.__shieldReceipts; if (!r) { showToast('Receipts backend not configured'); return; } for (const f of files) { const x = await r.snap(f, {}); if (!x.ok) showToast('Upload failed: ' + (x.error || 'unknown')); } showToast(`${files.length} receipt${files.length === 1 ? '' : 's'} uploaded`); load(); };
  const list = rows.filter(r => tab === 'inbox' ? r.status === 'inbox' : r.status !== 'inbox');
  const review = (r) => { qbNew('purchase', { vendor: r.vendor || '', amount: r.amount || '', memo: r.note || '', receipt_id: r.id, category: r.expense_category || '' }); };
  const tile = (icon, title, sub, fn, disabled) => <button onClick={fn} disabled={disabled} style={{ padding: '18px 12px', borderRadius: 6, border: '1px dashed var(--border-strong)', background: 'var(--card)', color: 'var(--text-high)', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: disabled ? 0.55 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}><span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--modal)', display: 'grid', placeItems: 'center', fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{sub}</span></button>;
  return (
    <QboPage title="Receipts" actions={<QbBtn onClick={() => showToast('Export runs from the Reports center')}>Export</QbBtn>} wide>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple onChange={upload} style={{ display: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {tile('☁', 'Upload from computer', 'Select files or drag and drop', () => fileRef.current && fileRef.current.click())}
        {tile('▣', 'Snap from the tech app', 'Technicians snap receipts in the field — they land here', () => showToast('Receipts tab in the technician app'), false)}
        {tile('✉', 'Forward from email', 'Set up receipt forwarding', () => showToast('Forward receipts to the inbox address set in Portal Settings → Email'), false)}
      </div>
      <QbTabs tabs={[['inbox', 'For review'], ['reviewed', 'Reviewed']]} value={tab} onChange={setTab} />
      <div style={{ display: 'flex', gap: 8 }}><QbBtn onClick={() => showToast('Batch actions apply to checked rows')}>Batch actions ▾</QbBtn><QbBtn onClick={() => showToast('Filter by uploader, date and amount')}>Filter</QbBtn></div>
      <QboList cols={['Receipt', 'Created by', 'Date', 'Description', 'Payment account', { label: 'Amount / tax', align: 'right', mono: true }, 'Category', { label: 'Action', sortable: false, align: 'right' }]} rows={list.map(r => ({ key: r.id, cells: [<span style={{ fontSize: 16 }}>▤</span>, r.uploader_name || '', qbDate(r.created_at), r.vendor || r.note || 'Receipt', r.job_ref || '—', r.amount != null ? qbMoney(r.amount) : '—', r.expense_category || <span style={{ color: 'var(--text-low)' }}>Uncategorised</span>, r.status === 'inbox' ? <QbAction label="Review" onClick={() => review(r)} more={() => window.__shieldReceipts.dismiss(r.id).then(load)} /> : <span style={{ fontSize: 11, color: 'var(--text-low)', textTransform: 'capitalize' }}>{r.status}</span>], sortv: ['', r.uploader_name || '', r.created_at || '', r.vendor || '', r.job_ref || '', Number(r.amount) || 0, r.expense_category || '', ''] }))} empty={tab === 'inbox' ? 'Add a new receipt to get started' : 'Nothing reviewed yet'} />
      {tab === 'inbox' && !list.length && <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-low)' }}>We'll pull out the info so you can review it and add it to your books.</div>}
    </QboPage>
  );
}
const bankRuleStore = createShieldStore('bankrules', []);
function QboRules({ showToast }) {
  const [rules, setRules] = useShieldStore(bankRuleStore);
  const [tab, setTab] = React.useState('bank'); const [q, setQ] = React.useState('');
  const add = () => shieldModal({ kind: 'editor', title: 'New rule', subtitle: 'When a bank description contains this text, set the category', submitLabel: 'Save rule', value: 'Rule name: Fuel\nDescription contains: SHELL, WAWA, SUNOCO\nTransaction type: Expense\nSet category to: Vehicle · Fuel\nApplied to: All accounts\nAuto-add: on', onSave: (text) => { const get = (k) => (String(text).match(new RegExp(k + '\\s*:\\s*(.*)', 'i')) || [])[1] || ''; setRules(prev => [{ id: genId('rule'), name: get('Rule name') || 'Rule', contains: get('Description contains'), type: get('Transaction type') || 'Expense', category: get('Set category to'), applied: get('Applied to') || 'All accounts', auto: /on|yes|true/i.test(get('Auto-add')), active: true, priority: (prev || []).length + 1 }, ...(prev || [])]); return { ok: true }; }, successMsg: 'Rule saved' });
  const list = (rules || []).filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.contains || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <QboPage title="Rules" actions={<React.Fragment><button onClick={() => showToast('Rules apply to bank feed transactions as they arrive')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Learn more</button><QbBtn primary onClick={add} caret={add}>New rule</QbBtn></React.Fragment>} wide>
      <QbTabs tabs={[['bank', 'Bank rules'], ['integration', 'Integration rules']]} value={tab} onChange={setTab} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><QbSearch value={q} onChange={setQ} placeholder="Search by name or conditions" width={260} /></div>
      <QboList cols={['Priority', 'Rule name', 'Applied to', 'Conditions', 'Settings', 'Auto-add', 'Status', { label: 'Actions', sortable: false, align: 'right' }]} rows={(tab === 'bank' ? list : []).map(r => ({ key: r.id, cells: [<span className="mono">{r.priority}</span>, r.name, <span className="mono" style={{ fontSize: 10, background: 'var(--modal)', padding: '2px 6px', borderRadius: 3 }}>{String(r.applied).toUpperCase()}</span>, `Description contains "${r.contains}"`, `Set Category to "${r.category}", Transaction type ${r.type}`, r.auto ? '✓' : '', r.active ? 'Active' : 'Inactive', <QbAction label="Edit" onClick={() => setRules(prev => (prev || []).map(x => x.id === r.id ? { ...x, active: !x.active } : x))} more={() => setRules(prev => (prev || []).filter(x => x.id !== r.id))} />] }))} empty={tab === 'bank' ? 'No rules yet — rules categorise bank transactions automatically' : 'Integration rules apply to Stripe and other connected apps'} />
    </QboPage>
  );
}
function QboAccountant({ showToast }) {
  const [email, setEmail] = React.useState(''); const [sent, setSent] = React.useState([]);
  const invite = () => { if (!email.includes('@')) { showToast('Enter your accountant’s email'); return; } queueEmail({ to: email, customer: 'Accountant', subject: 'ShieldTech Solutions invited you as accountant', body: `You've been invited to access ShieldTech Solutions' books in the ShieldTech portal.\n\nSign in with this email address to accept.`, kind: 'invite' }); setSent(s => [...s, { email, at: Date.now() }]); setEmail(''); showToast(`Invitation emailed to ${email}`); };
  return (
    <QboPage title="My accountant">
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '18px 20px', maxWidth: 720 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Invite your accountant</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-mid)', margin: '4px 0 12px', lineHeight: 1.5 }}>Your accountant gets a sign-in with the Accountant role: full Finance Suite access, read-only everywhere else. They can run reports, reconcile, and review the QuickBooks connection.</div>
        <div style={{ display: 'flex', gap: 8 }}><input value={email} onChange={e => setEmail(e.target.value)} placeholder="accountant@firm.com" style={{ flex: 1, padding: '8px 10px', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 4, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)' }} /><QbBtn primary onClick={invite}>Invite</QbBtn></div>
        {sent.map((s, i) => <div key={i} style={{ marginTop: 10, fontSize: 12, color: 'var(--status-ok)' }}>✓ Invitation sent to {s.email}</div>)}
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '18px 20px', maxWidth: 720 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Requests for more information</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 4, lineHeight: 1.5 }}>Uncategorised transactions and receipts your accountant flags show up in Approvals for the office to answer. Secure requests require sign-in.</div>
        <button onClick={() => qboGo('approvals')} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>Open Approvals →</button>
      </div>
    </QboPage>
  );
}
function QboManagementReports({ onNav }) {
  const [period, setPeriod] = React.useState('year');
  const reports = [['Company Overview', 'Profit & loss, balance sheet, AR aging and cash flow in one pack', 'statements-fin'], ['Sales Performance', 'Sales by customer and by product/service', 'reports-center'], ['Expenses Performance', 'Expenses by vendor and by category', 'expenses']];
  return (
    <QboPage title="Management reports" actions={<QbBtn primary onClick={() => onNav('reports-center')}>+ Management report</QbBtn>} wide>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 16px', fontSize: 12, color: 'var(--text-mid)' }}><b style={{ color: 'var(--text-high)' }}>How to use the Reports Center</b><br />The Reports Center helps you gain rich insights into your business' performance. Management reports bundle several standard reports with a cover page and notes.</div>
      <QboList cols={['Name', 'Created by', 'Last modified', 'Report period', { label: 'Action', sortable: false, align: 'right' }]} rows={reports.map(([n, d, go]) => ({ key: n, cells: [<span>{n} <span className="mono" style={{ fontSize: 9, background: 'var(--brand)', color: '#fff', padding: '1px 5px', borderRadius: 2, marginLeft: 6 }}>SHIELDTECH REPORT</span><div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{d}</div></span>, 'ShieldTech', '—', <select value={period} onChange={e => setPeriod(e.target.value)} onClick={e => e.stopPropagation()} style={{ padding: '4px 6px', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11 }}><option value="year">This year</option><option value="quarter">This quarter</option><option value="month">This month</option></select>, <QbAction label="Preview" onClick={() => onNav(go)} more={() => onNav(go)} />] }))} />
    </QboPage>
  );
}
function QboCustomReports({ onNav, showToast }) {
  return (
    <QboPage title="Custom reports" actions={<QbBtn primary onClick={() => onNav('reports-center')}>Create new report</QbBtn>}>
      <QboList cols={['Name', 'Created by', 'Date range', 'Email', { label: 'Action', sortable: false, align: 'right' }]} rows={[]} empty="No custom reports saved yet" />
      <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Customise any standard report (columns, filters, date range) and save it here. Scheduled email delivery runs through the ShieldTech email backend.</div>
    </QboPage>
  );
}
function QboTransactionSearch({ query, onNav }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [bills, setBills] = React.useState([]); const [purchases, setPurchases] = React.useState([]); const [pays, setPays] = React.useState([]);
  React.useEffect(() => { const q = window.__shieldQBO; if (!q) return; q.bills(500).then(r => setBills(r && r.ok ? r.data : [])); q.purchases(500).then(r => setPurchases(r && r.ok ? r.data : [])); q.payments(500).then(r => setPays(r && r.ok ? r.data : [])); }, []);
  const [f, setF] = React.useState({ type: 'All', ref: '', contact: '', amount: '' });
  const all = [
    ...inv.map(i => ({ date: (i._raw || {}).txn_date, type: 'Invoice', ref: i.num, contact: i.customer, due: (i._raw || {}).due_date || i.due, balance: i.status === 'paid' ? 0 : i.amount, amount: i.amount, memo: ((i.lines || [])[0] || {}).desc || '' })),
    ...est.map(e => ({ date: (e._raw || {}).txn_date || e.date, type: 'Estimate', ref: e.num, contact: e.customer, due: e.expires, balance: 0, amount: e.amount, memo: ((e.lines || [])[0] || {}).desc || '' })),
    ...bills.map(b => ({ date: b.txn_date, type: 'Bill', ref: b.doc_number || b.qbo_id, contact: b.vendor_name, due: b.due_date, balance: Number(b.balance) || 0, amount: Number(b.total) || 0, memo: b.memo || '' })),
    ...purchases.map(p => ({ date: p.txn_date, type: 'Expense', ref: p.doc_number || p.qbo_id, contact: p.vendor_name || p.payee || '', due: '', balance: 0, amount: Number(p.total) || 0, memo: p.memo || '' })),
    ...pays.map(p => ({ date: p.txn_date, type: 'Payment', ref: p.doc_number || p.qbo_id, contact: p.customer_name || '', due: '', balance: 0, amount: Number(p.total) || 0, memo: p.memo || '' })),
  ];
  const ql = String(query || '').toLowerCase();
  const rows = all.filter(r => (!ql || [r.ref, r.contact, r.memo, r.amount].some(x => String(x || '').toLowerCase().includes(ql))) && (f.type === 'All' || r.type === f.type) && (!f.ref || String(r.ref).toLowerCase().includes(f.ref.toLowerCase())) && (!f.contact || String(r.contact).toLowerCase().includes(f.contact.toLowerCase())) && (!f.amount || Math.abs(r.amount - Number(f.amount)) < 0.005)).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return (
    <QboPage title="Advanced transactions search" actions={<button onClick={() => onNav('sales-transactions')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Go to all transactions</button>} wide>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <QbSelect label="Transaction type" value={f.type} onChange={v => setF(p => ({ ...p, type: v }))} options={['All', 'Invoice', 'Estimate', 'Bill', 'Expense', 'Payment']} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>Reference number</span><QbSearch value={f.ref} onChange={v => setF(p => ({ ...p, ref: v }))} placeholder="Type…" width={140} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>Contact</span><QbSearch value={f.contact} onChange={v => setF(p => ({ ...p, contact: v }))} placeholder="Select…" width={160} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>Amount</span><QbSearch value={f.amount} onChange={v => setF(p => ({ ...p, amount: v }))} placeholder="0.00" width={110} /></label>
      </div>
      <QboList cols={['Date', 'Type', 'Ref no.', 'Contact', 'Due date', { label: 'Balance', align: 'right', mono: true }, { label: 'Amount', align: 'right', mono: true }, 'Memo/description']} rows={rows.map((r, i) => ({ key: r.type + r.ref + i, cells: [qbDate(r.date), r.type, r.ref, <span style={{ color: 'var(--brand)' }}>{r.contact}</span>, qbDate(r.due), qbMoney(r.balance), qbMoney(r.amount), <span style={{ color: 'var(--text-low)', whiteSpace: 'normal' }}>{r.memo}</span>], sortv: [r.date || '', r.type, r.ref, r.contact, r.due || '', r.balance, r.amount, r.memo] }))} empty={`No results found for "${query}"`} />
    </QboPage>
  );
}
function QboFeed({ onNav }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [approvals] = useShieldStore(approvalStore); const [wos] = useShieldStore(workOrderStore);
  const items = [
    ...inv.filter(i => i.status === 'overdue').sort((a, b) => b.days - a.days).slice(0, 8).map(i => ({ t: `${i.customer} is ${i.days} days overdue on ${i.num}`, s: qbMoney(i.amount), go: () => onNav('invoices'), c: 'var(--status-critical)' })),
    ...est.filter(e => e.status === 'sent').slice(0, 5).map(e => ({ t: `Estimate ${e.num} for ${e.customer} is waiting on a reply`, s: qbMoney(e.amount), go: () => onNav('estimates'), c: 'var(--brand)' })),
    ...(approvals || []).filter(a => a.status === 'pending').slice(0, 8).map(a => ({ t: a.title, s: `${a.kind}${a.amt ? ' · ' + a.amt : ''}`, go: () => qboGo('approvals'), c: 'var(--status-warn)' })),
    ...(wos || []).filter(w => w.status === 'requested').slice(0, 5).map(w => ({ t: `${w.requestedBy || 'A technician'} requested a job for ${w.customer}`, s: w.scope, go: () => qboGo('workorder'), c: 'var(--disc-cabling, #27E39A)' })),
  ];
  return (
    <QboPage title="Feed">
      {items.length === 0 && <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>All clear. No alerts right now.</div>}
      {items.map((it, i) => <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${it.c}`, borderRadius: 6, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{it.t}</div><div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>{it.s}</div></div><QbBtn small onClick={it.go}>Open</QbBtn></div>)}
    </QboPage>
  );
}
function QboEmbed({ title, actions, children }) { return <QboPage title={title} actions={actions} wide>{children}</QboPage>; }
function QboLink({ title, screen, note }) { return <QboPage title={title}><div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 28, textAlign: 'center' }}><div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 12 }}>{note}</div><QbBtn primary onClick={() => qboGo(screen)}>Open {title}</QbBtn></div></QboPage>; }

/* ══════════════ the shell ══════════════ */
function QboFinanceScreen() {
  const initial = (window.__qboParams && window.__qboParams.financeTab) || 'overview';
  const [page, setPage] = React.useState(initial);
  const [open, setOpen] = React.useState(() => { try { return JSON.parse(localStorage.getItem('st2:qbo-tree') || 'null') || { accounting: true, expenses: true, sales: true, customers: true }; } catch { return { accounting: true, sales: true }; } });
  const unified = !!window.__navUnified;
  const [treeOn, setTreeOn] = React.useState(!unified);
  const [q, setQ] = React.useState(''); const [query, setQuery] = React.useState('');
  const [drawer, setDrawer] = React.useState(null); const [modal, setModal] = React.useState(null);
  const [selectedInv, setSelectedInv] = React.useState(null); const [invFilter, setInvFilter] = React.useState('All');
  const [toast, setToast] = React.useState(null);
  const [demoState, setDemoState] = React.useState(window.__qboDemoState || 'live');
  const [bookmarks, setBookmarks] = React.useState(() => { try { return JSON.parse(localStorage.getItem('st2:qbo-bookmarks') || '[]'); } catch { return []; } });
  const [bmOpen, setBmOpen] = React.useState(false);
  React.useEffect(() => { const h = (e) => setDemoState(e.detail || 'live'); window.addEventListener('qbo-demo-state', h); return () => window.removeEventListener('qbo-demo-state', h); }, []);
  React.useEffect(() => { const h = (e) => { if (e.detail.screen === 'finance' && e.detail.params.financeTab) setPage(e.detail.params.financeTab); }; window.addEventListener('qbo-nav', h); return () => window.removeEventListener('qbo-nav', h); }, []);
  /* Sidebar ↔ page: the unified sidebar is the only menu. */
  React.useEffect(() => { const h = (e) => { if (e.detail.screen === 'finance' && e.detail.source !== 'screen' && e.detail.sub && e.detail.sub !== page) setPage(e.detail.sub); }; window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, [page]);
  React.useEffect(() => { if (window.navSubSet && (!window.__navSub || window.__navSub.screen !== 'finance' || window.__navSub.sub !== page)) window.navSubSet('finance', page, 'screen'); }, [page]);
  React.useEffect(() => { window.__financeSetModal = (m) => { setPage(m && m.type === 'new-estimate' ? 'estimates' : 'invoices'); setModal(m); }; return () => { if (window.__financeSetModal) delete window.__financeSetModal; }; }, []);
  React.useEffect(() => { try { localStorage.setItem('st2:qbo-tree', JSON.stringify(open)); } catch { /* noop */ } }, [open]);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const go = (id) => { setPage(id); if (QBO_PAGE_APP[id] && QBO_PAGE_APP[id] !== 'reports') setOpen(o => ({ ...o, [QBO_PAGE_APP[id]]: true })); };
  const bm = () => { setBookmarks(b => { const n = b.includes(page) ? b.filter(x => x !== page) : [...b, page]; try { localStorage.setItem('st2:qbo-bookmarks', JSON.stringify(n)); } catch { /* noop */ } return n; }); };
  const plus = { drawer, setDrawer, modal, setModal, selectedInv, setSelectedInv, invFilter, setInvFilter, showToast };
  const app = QBO_PAGE_APP[page];

  const content = (() => {
    switch (page) {
      case 'overview': return window.QboGlance ? <QboGlance onNav={go} /> : <FinanceOverview onNav={go} />;
      case 'feed': return <QboFeed onNav={go} />;
      case 'search': return <QboTransactionSearch query={query} onNav={go} />;
      case 'bank-transactions': case 'bankfeed': return <QboEmbed title="Bank transactions" actions={<React.Fragment><QbBtn onClick={() => showToast('Refreshing the bank feed')}>⟳ Update</QbBtn><QbBtn onClick={() => showToast('Requests go to your accountant')} caret={() => {}}>Requests</QbBtn><QbBtn primary onClick={() => showToast('Link a bank via the feed settings below')} caret={() => {}}>Link account</QbBtn></React.Fragment>}><FinanceBankFeedPlus showToast={showToast} /></QboEmbed>;
      case 'integration-transactions': case 'stripe': return <QboEmbed title="Integration transactions"><FinanceStripe /></QboEmbed>;
      case 'receipts': return <QboReceipts showToast={showToast} />;
      case 'reconcile': return <QboEmbed title="Reconcile" actions={<React.Fragment><QbBtn onClick={() => go('statements-fin')}>Summary</QbBtn><QbBtn onClick={() => go('accounts')}>History by account</QbBtn></React.Fragment>}><FinanceReconcile showToast={showToast} /></QboEmbed>;
      case 'rules': return <QboRules showToast={showToast} />;
      case 'accounts': return <QboEmbed title="Chart of accounts" actions={<React.Fragment><QbBtn onClick={() => go('reports-center')}>Run report</QbBtn><QbBtn primary onClick={() => setModal({ type: 'new-account' })} caret={() => {}}>New account</QbBtn></React.Fragment>}><FinanceCOA setModal={setModal} showToast={showToast} /></QboEmbed>;
      case 'recurring': return <QboEmbed title="Recurring transactions" actions={<QbBtn primary onClick={() => go('invoices')} caret={() => {}}>New</QbBtn>}><FinanceRecurring showToast={showToast} /></QboEmbed>;
      case 'accountant': return <QboAccountant showToast={showToast} />;
      case 'ledger': return <QboEmbed title="General ledger"><FinanceGL /></QboEmbed>;
      case 'expenses': return <QboEmbed title="Expenses" actions={<React.Fragment><QbBtn onClick={() => go('ap')}>Pay bills</QbBtn><QbBtn primary onClick={() => qbNew('purchase')} caret={() => qbNew('menu')}>New transaction</QbBtn></React.Fragment>}><FinanceExpensesPlus setModal={setModal} showToast={showToast} /></QboEmbed>;
      case 'vendors': return <QboVendors onNav={go} />;
      case 'ap': return <QboBillsPage setDrawer={setDrawer} setModal={setModal} showToast={showToast} />;
      case 'lending': return <QboEmbed title="Lending"><FinanceLending showToast={showToast} /></QboEmbed>;
      case 'sales-overview': return <QboSalesOverview onNav={go} />;
      case 'sales-transactions': return <QboSalesTransactions showToast={showToast} />;
      case 'invoices': return <QboInvoicesPage {...plus} />;
      case 'products': return <QboEmbed title="Products & services" actions={<React.Fragment><QbBtn onClick={() => qbNew('seed-services')} caret={() => {}}>More</QbBtn><QbBtn primary onClick={() => qbNew('item')} caret={() => qbNew('menu')}>New product/service</QbBtn></React.Fragment>}><FinanceProducts setModal={setModal} showToast={showToast} /></QboEmbed>;
      case 'credits': return <QboEmbed title="Sales receipts & credits"><FinanceCredits showToast={showToast} /></QboEmbed>;
      case 'statements': return <QboEmbed title="Customer statements"><FinanceCustStatements showToast={showToast} /></QboEmbed>;
      case 'customer-hub': return <QboCustomerHub onNav={go} />;
      case 'leads': return window.BidBoardScreen ? <QboEmbed title="Leads" actions={<QbBtn primary onClick={() => qboGo('crm')} caret={() => {}}>Add lead</QbBtn>}><BidBoardScreen /></QboEmbed> : <QboLink title="Leads" screen="crm" note="Leads live on the Bid Board." />;
      case 'customers': return <QboCustomers onNav={go} showToast={showToast} />;
      case 'estimates': return <QboEmbed title="Estimates" actions={<QbBtn primary onClick={() => qbNew('estimate')} caret={() => qbNew('menu')}>Create estimate</QbBtn>}><NIFinanceEstimates setModal={setModal} showToast={showToast} /></QboEmbed>;
      case 'reviews': return window.NPSScreen ? <QboEmbed title="Reviews"><NPSScreen /></QboEmbed> : <QboLink title="Reviews" screen="nps" note="Reviews and NPS responses." />;
      case 'employees': return window.TeamScreenPlus ? <QboEmbed title="Employees" actions={<QbBtn primary onClick={() => qboGo('users')} caret={() => {}}>Add employee</QbBtn>}><TeamScreenPlus /></QboEmbed> : <QboLink title="Employees" screen="employees" note="Team & skills." />;
      case 'timesheets': return <QboLink title="Timesheets" screen="timesheets" note="Technician hours, approvals and the Rippling sync live in Timesheets." />;
      case 'payroll': return window.PayrollScreen ? <QboEmbed title="Payroll"><PayrollScreen /></QboEmbed> : <QboLink title="Payroll" screen="payroll" note="Weekly hours × rate, owed and paid." />;
      case 'sales-tax': return <QboEmbed title="Sales tax overview" actions={<React.Fragment><QbBtn onClick={() => go('settings')} caret={() => {}}>Edit sales tax</QbBtn><QbBtn onClick={() => showToast('Add a tax rate in Settings → Sales')}>Add tax</QbBtn></React.Fragment>}><FinanceSalesTax showToast={showToast} /></QboEmbed>;
      case 'marketing': return window.MarketingScreen ? <QboEmbed title="Marketing"><MarketingScreen /></QboEmbed> : <QboLink title="Marketing" screen="outbox" note="Campaigns and the email outbox." />;
      case 'reports-center': return <QboEmbed title="Standard reports"><FinanceReportsPlus showToast={showToast} /></QboEmbed>;
      case 'custom-reports': return <QboCustomReports onNav={go} showToast={showToast} />;
      case 'management-reports': return <QboManagementReports onNav={go} />;
      case 'cash-flow-overview': case 'statements-fin': return <QboEmbed title={page === 'statements-fin' ? 'Financial statements' : 'Cash flow overview'}><FinanceStatements /></QboEmbed>;
      case 'cash-flow-planner': case 'copilot': return <QboEmbed title={page === 'copilot' ? 'AI Co-pilot' : 'Cash flow planner'}><FinanceCopilot /></QboEmbed>;
      case 'settings': return <QboEmbed title="Account and settings"><FinanceSettings showToast={showToast} /></QboEmbed>;
      case 'branding': return <QboEmbed title="Custom form styles"><BrandingStudio showToast={showToast} /></QboEmbed>;
      case 'qbo-map': return <QboEmbed title="QuickBooks connection"><FinanceQboMap /></QboEmbed>;
      default: return <QboGlance onNav={go} />;
    }
  })();

  const rail = [['create', '⊕', 'Create', () => qbNew('menu')], ['bookmarks', '☆', 'Bookmarks', () => setBmOpen(o => !o)], ['overview', '⌂', 'Home', () => go('overview')], ['feed', '✦', 'Feed', () => go('feed')], ['reports', '📈', 'Reports', () => go('reports-center')], ['apps', '⠿', 'All apps', () => setTreeOn(t => !t)]];
  const railBtn = (id, icon, label, fn, on) => <button key={id} onClick={fn} title={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', background: on ? 'color-mix(in srgb, var(--brand) 12%, transparent)' : 'none', border: 'none', borderRadius: 6, color: on ? 'var(--brand)' : 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)', width: 52 }}><span style={{ fontSize: 15 }}>{icon}</span><span style={{ fontSize: 8.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span></button>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden', margin: '-8px -8px 0' }}>
      {/* top bar: company + global search + icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--card)', flexShrink: 0 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>ShieldTech Security{unified && <span style={{ color: 'var(--text-low)', fontWeight: 500 }}> · {qbTitle(page)}</span>}</span>
        {unified && <span style={{ display: 'flex', gap: 4 }}>{[['overview', 'Home'], ['feed', 'Feed'], ['reports-center', 'Reports']].map(([id, l]) => <button key={id} onClick={() => go(id)} style={{ padding: '4px 10px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: page === id ? 'var(--brand-tint-12)' : 'transparent', color: page === id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>)}<button onClick={bm} title="Bookmark" style={{ padding: '4px 8px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'transparent', color: bookmarks.includes(page) ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{bookmarks.includes(page) ? '★' : '☆'}</button></span>}
        <form onSubmit={e => { e.preventDefault(); setQuery(q); go('search'); }} style={{ flex: 1, maxWidth: 560, margin: '0 auto' }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="⌕  Navigate or search for transactions, contacts, reports, and more" style={{ width: '100%', padding: '7px 12px', borderRadius: 20, border: '1px solid var(--border-strong)', background: 'var(--modal)', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} /></form>
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {window.QboNewButton && <QboNewButton />}
          <button onClick={() => showToast(window.__shieldQBO ? 'Syncing with QuickBooks…' : 'Backend not configured') || (window.__shieldQBO && window.__shieldQBO.syncNow('pull').then(r => showToast(r && r.ok ? 'QuickBooks synced' : ((r && r.error) || 'Sync unavailable — connect QuickBooks first'))))} title="Sync now" style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', fontSize: 14 }}>⟳</button>
          <button onClick={() => go('feed')} title="Notifications" style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', fontSize: 14 }}>🔔</button>
          <button onClick={() => go('settings')} title="Settings" style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', fontSize: 14 }}>⚙</button>
          {window.QboSyncBadge && <QboSyncBadge state={demoState === 'stale' ? 'stale' : demoState === 'error' ? 'error' : 'synced'} />}
        </span>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* left rail (hidden when the portal sidebar carries the Finance tree) */}
        {!unified && <div style={{ width: 60, borderRight: '1px solid var(--border-subtle)', background: 'var(--card)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', gap: 2, flexShrink: 0, position: 'relative' }}>
          {rail.map(([id, icon, label, fn]) => railBtn(id, icon, label, fn, id === page || (id === 'reports' && app === 'reports') || (id === 'apps' && treeOn)))}
          <div className="mono" style={{ fontSize: 7.5, letterSpacing: '0.12em', color: 'var(--text-low)', margin: '10px 0 4px' }}>PINNED</div>
          {QBO_APPS.slice(0, 3).map(a => railBtn(a.id, <span style={{ width: 20, height: 20, borderRadius: '50%', background: a.color, display: 'inline-block' }} />, a.label.split(' ')[0], () => go(a.pages[0][0]), app === a.id))}
          <div style={{ flex: 1 }} />
          {railBtn('customise', '⇅', 'Customise', () => go('branding'), page === 'branding')}
          {bmOpen && <div style={{ position: 'absolute', left: 64, top: 50, zIndex: 50, width: 260, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Bookmarks</div>{bookmarks.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginBottom: 8 }}>Add a bookmark to get started.</div>}{bookmarks.map(b => <button key={b} onClick={() => { go(b); setBmOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 12, padding: '4px 0', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>☆ {qbTitle(b)}</button>)}<button onClick={bm} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>{bookmarks.includes(page) ? '− Remove this page' : '+ Bookmark current page'}</button></div>}
        </div>}
        {/* ALL APPS tree */}
        {treeOn && (
          <div style={{ width: 196, borderRight: '1px solid var(--border-subtle)', background: 'var(--card)', overflowY: 'auto', padding: '10px 8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 8px' }}><span className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-low)' }}>{app === 'reports' ? 'REPORTS & ANALYTICS' : 'ALL APPS'}</span><button onClick={() => setTreeOn(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 12 }}>≡</button></div>
            {app === 'reports' ? QBO_REPORTS.map(([id, l], i) => <React.Fragment key={id}>{i === 3 && <div style={{ fontSize: 11.5, fontWeight: 600, padding: '8px 8px 2px', color: 'var(--text-mid)' }}>Financial planning</div>}<button onClick={() => go(id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: i >= 3 ? '6px 8px 6px 20px' : '6px 8px', borderRadius: 4, background: page === id ? 'var(--modal)' : 'none', border: 'none', color: page === id ? 'var(--text-high)' : 'var(--text-mid)', fontSize: 11.5, fontWeight: page === id ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button></React.Fragment>) : QBO_APPS.map(a => (
              <div key={a.id} style={{ marginBottom: 2 }}>
                <button onClick={() => setOpen(o => ({ ...o, [a.id]: !o[a.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}><span style={{ width: 16, height: 16, borderRadius: '50%', background: a.color, flexShrink: 0 }} /><span style={{ flex: 1 }}>{a.label}</span><span style={{ fontSize: 9, color: 'var(--text-low)' }}>{open[a.id] ? '⌃' : '⌄'}</span></button>
                {open[a.id] && a.pages.map(([id, l]) => <button key={id} onClick={() => go(id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px 5px 32px', borderRadius: 4, background: page === id ? 'var(--modal)' : 'none', border: 'none', color: page === id ? 'var(--text-high)' : 'var(--text-mid)', fontSize: 11.5, fontWeight: page === id ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>)}
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 8, paddingTop: 8 }}>{[['ledger', 'General ledger'], ['credits', 'Sales receipts & credits'], ['statements', 'Customer statements'], ['lending', 'Lending'], ['copilot', 'AI Co-pilot'], ['qbo-map', 'QuickBooks connection']].map(([id, l]) => <button key={id} onClick={() => go(id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 4, background: page === id ? 'var(--modal)' : 'none', border: 'none', color: page === id ? 'var(--text-high)' : 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>)}</div>
          </div>
        )}
        {/* content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 30px', minWidth: 0 }}>
          <StateGate state={demoState} label={qbTitle(page)}>{content}</StateGate>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '9px 18px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--text-high)', fontSize: 12.5, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: 'var(--status-ok)' }}>✓</span>{toast}<button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-body)' }}>Close</button></div>}
      {modal && <NIFinanceModal modal={modal} setModal={setModal} showToast={showToast} />}
      {drawer && <NIFinanceDrawer drawer={drawer} setDrawer={setDrawer} showToast={showToast} />}
    </div>
  );
}

Object.assign(window, { QboFinanceScreen, QboPage, QboList, QboMoneyBar, QbBtn, QbTabs, QBO_APPS, bankRuleStore });

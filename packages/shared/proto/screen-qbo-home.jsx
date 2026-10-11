/* Finance Suite — home, laid out the way QuickBooks Online lays out its home:
   app pills across the top (Accounting · Expenses & Pay Bills · Sales & Get
   Paid · Customers · Team · Tax · Reports), a Business feed, Create actions,
   then "Business at a glance" widgets — Profit & Loss, Expenses, Smart
   suggestions, Bank accounts, Cash flow, Sales, Accounts receivable — followed
   by the Sales & Get Paid quick-actions grid (Money in) and the Customer Hub
   funnel. Every number comes from ShieldTech's own rows (merged portal +
   QuickBooks invoices, QBO bills/purchases mirror, approved expenses, MRR,
   projects, estimates, receipts inbox); every action goes through the shared
   "+ New" engine (openQboNew) or a Finance tab. Tokens only. */

const qgMoney = (n, short) => { n = Number(n) || 0; if (short && Math.abs(n) >= 1000) return (n < 0 ? '-' : '') + '$' + (Math.abs(n) / 1000).toFixed(Math.abs(n) >= 100000 ? 0 : 1) + 'K'; return (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 }); };
const qgMonthKey = (d) => d.slice(0, 7);
const qgNow = () => new Date();
const qgPeriods = { month: 'This month', quarter: 'This quarter', year: 'This year', last: 'Last month' };
function qgRange(p) {
  const n = qgNow(), y = n.getFullYear(), m = n.getMonth();
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (p === 'month') return [iso(new Date(y, m, 1)), iso(new Date(y, m + 1, 0))];
  if (p === 'last') return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
  if (p === 'quarter') { const q = Math.floor(m / 3) * 3; return [iso(new Date(y, q, 1)), iso(new Date(y, q + 3, 0))]; }
  return [iso(new Date(y, 0, 1)), iso(new Date(y, 11, 31))];
}
const qgIn = (d, [a, b]) => d && d >= a && d <= b;
const qgPaidDate = (i) => { const r = i._raw || {}; return r.paidAt ? new Date(r.paidAt).toISOString().slice(0, 10) : (r.paid_date || r.txn_date || null); };
const qgInvDate = (i) => { const r = i._raw || {}; return r.txn_date || r.date || null; };

/* ── tiny charts (SVG, tokens) ── */
function QgDonut({ parts, size = 120, thick = 16, center }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  const r = (size - thick) / 2, C = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={thick} />
        {total > 0 && parts.map((p, i) => { const len = Math.max(0, p.value) / total * C; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={thick} strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`} strokeDashoffset={-off} strokeLinecap="butt" />; off += len; return el; })}
      </svg>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{center}</div>}
    </div>
  );
}
function QgBars({ series, labels, height = 110, colors }) {
  /* series: [[v…], [v…]] drawn side by side per label */
  const max = Math.max(1, ...series.flat());
  const n = labels.length;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 4, alignItems: 'end', height }}>
        {labels.map((l, i) => (
          <div key={l + i} style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%' }}>
            {series.map((s, k) => <div key={k} title={`${l}: ${qgMoney(s[i])}`} style={{ flex: 1, height: `${Math.max(2, (s[i] || 0) / max * 100)}%`, background: colors[k], borderRadius: '3px 3px 0 0', opacity: s[i] ? 1 : 0.25 }} />)}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 4, marginTop: 6 }}>{labels.map((l, i) => <div key={l + i} className="mono" style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{l}</div>)}</div>
    </div>
  );
}
function QgArea({ values, labels, height = 120, color = 'var(--brand)' }) {
  const w = 600, h = height, pad = 6;
  const max = Math.max(1, ...values.map(v => Math.abs(v)));
  const min = Math.min(0, ...values);
  const span = (max - min) || 1;
  const x = (i) => pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const zero = y(0);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1={pad} x2={w - pad} y1={zero} y2={zero} stroke="var(--border-strong)" strokeWidth="1" />
        <polygon points={`${x(0)},${zero} ${pts} ${x(values.length - 1)},${zero}`} fill={color} opacity="0.14" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>{labels.map((l, i) => <span key={l + i} className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{l}</span>)}</div>
    </div>
  );
}
function QgWidget({ title, sub, right, children, footer, onFooter, style }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', minHeight: 230, ...(style || {}) }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div><div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)', fontWeight: 600 }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>}</div>
        {right}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      {footer && <button onClick={onFooter} style={{ alignSelf: 'flex-start', marginTop: 10, background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{footer}</button>}
    </div>
  );
}
function QgSelect({ value, onChange, options }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, padding: '3px 6px', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>{options.map(([v, l]) => <option key={v} value={v} style={{ background: 'var(--card)' }}>{l}</option>)}</select>;
}
const qgNav = (screen) => { if (typeof qboGo === 'function') qboGo(screen); else if (window.__shieldNav) window.__shieldNav(screen); };
const qgNew = (kind, prefill) => { if (window.openQboNew) window.openQboNew(kind, prefill); else shieldToast('The + New forms are not loaded', 'warn'); };

/* ── data ── */
function useQgData() {
  const invoices = useMergedInvoices();
  const estimates = useMergedEstimates();
  const [bills, setBills] = React.useState([]);
  const [purchases, setPurchases] = React.useState([]);
  const [receiptsInbox, setReceiptsInbox] = React.useState(0);
  const [qbo, setQbo] = React.useState({ checked: false, connected: false, last: null });
  const [expenses] = useShieldStore(techExpenseStore);
  const [projects] = useShieldStore(projectStore);
  const [mrr] = useShieldStore(mrrStore);
  const [nps] = useShieldStore(npsStore);
  const load = React.useCallback(() => {
    const q = window.__shieldQBO; if (!q) return;
    q.bills(1000).then(r => setBills(r && r.ok ? r.data : []));
    q.purchases(1000).then(r => setPurchases(r && r.ok ? r.data : []));
    q.syncState && q.syncState().then(r => setQbo(s => ({ ...s, last: (r && r.ok && r.data && (r.data.last_sync || r.data.lastSync || r.data.updated_at)) || null })));
    q.qboStatus && q.qboStatus().then(r => setQbo(s => ({ ...s, checked: true, connected: !!(r && r.connected) })));
    const rc = window.__shieldReceipts; if (rc) rc.list('inbox').then(r => setReceiptsInbox(r && r.ok ? r.data.length : 0));
  }, []);
  React.useEffect(() => { load(); window.addEventListener('qbo:changed', load); return () => window.removeEventListener('qbo:changed', load); }, [load]);
  return { invoices, estimates, bills, purchases, receiptsInbox, qbo, expenses: expenses || [], projects: projects || [], mrr: mrr || [], nps: nps || [] };
}

/* ══════════════ Home ══════════════ */
function QboGlance({ onNav }) {
  const D = useQgData();
  const [plPeriod, setPlPeriod] = React.useState('year');
  const [exPeriod, setExPeriod] = React.useState('year');
  const [salesPeriod, setSalesPeriod] = React.useState('year');
  const [cfMonths, setCfMonths] = React.useState('12');
  const today = new Date(); const todayIso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const first = ((window.__shieldUser || {}).name || '').split(' ')[0];
  const hour = today.getHours(); const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* P&L */
  const plR = qgRange(plPeriod);
  const income = D.invoices.filter(i => i.status === 'paid' && qgIn(qgPaidDate(i), plR)).reduce((s, i) => s + i.amount, 0);
  const invoiced = D.invoices.filter(i => i.status !== 'draft' && i.status !== 'void' && qgIn(qgInvDate(i), plR)).reduce((s, i) => s + i.amount, 0);
  const spend = (range) => D.purchases.filter(p => qgIn(p.txn_date, range)).reduce((s, p) => s + (Number(p.total) || 0), 0)
    + D.bills.filter(b => qgIn(b.txn_date, range)).reduce((s, b) => s + (Number(b.total) || 0), 0)
    + D.expenses.filter(e => e.status === 'approved' && !e.qbo_id && qgIn(e.date, range)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const plSpend = spend(plR);
  const net = income - plSpend;
  const pendingExp = D.expenses.filter(e => e.status === 'pending').length;
  const toReview = D.receiptsInbox + pendingExp;

  /* Expenses by category */
  const exR = qgRange(exPeriod);
  const cats = new Map();
  D.purchases.filter(p => qgIn(p.txn_date, exR)).forEach(p => { const k = p.category || p.account_name || p.memo || 'Uncategorized'; cats.set(k, (cats.get(k) || 0) + (Number(p.total) || 0)); });
  D.bills.filter(b => qgIn(b.txn_date, exR)).forEach(b => { const k = 'Bills · ' + (b.vendor_name || 'Vendors'); cats.set(k, (cats.get(k) || 0) + (Number(b.total) || 0)); });
  D.expenses.filter(e => e.status === 'approved' && !e.qbo_id && qgIn(e.date, exR)).forEach(e => { const k = e.category || 'Field'; cats.set(k, (cats.get(k) || 0) + (Number(e.amount) || 0)); });
  const catColors = ['var(--brand)', 'var(--disc-access, #19E3EC)', 'var(--disc-alarm, var(--disc-alarm))', 'var(--status-warn)', 'var(--disc-cabling, #27E39A)', 'var(--text-low)'];
  const catList = [...cats.entries()].sort((a, b) => b[1] - a[1]);
  const top = catList.slice(0, 5); const rest = catList.slice(5).reduce((s, c) => s + c[1], 0);
  const exParts = [...top.map(([k, v], i) => ({ label: k, value: v, color: catColors[i] })), ...(rest > 0 ? [{ label: 'Other', value: rest, color: catColors[5] }] : [])];
  const exTotal = exParts.reduce((s, p) => s + p.value, 0);

  /* Cash flow — money in (paid invoices) vs money out (bills + purchases + approved expenses) per month */
  const months = Number(cfMonths);
  const mkeys = Array.from({ length: months }, (_, i) => { const d = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1); return d.toISOString().slice(0, 7); });
  const inBy = {}, outBy = {};
  D.invoices.forEach(i => { if (i.status !== 'paid') return; const k = qgMonthKey(qgPaidDate(i) || ''); if (k) inBy[k] = (inBy[k] || 0) + i.amount; });
  D.purchases.forEach(p => { const k = qgMonthKey(p.txn_date || ''); if (k) outBy[k] = (outBy[k] || 0) + (Number(p.total) || 0); });
  D.bills.forEach(b => { const k = qgMonthKey(b.txn_date || ''); if (k) outBy[k] = (outBy[k] || 0) + (Number(b.total) || 0); });
  D.expenses.forEach(e => { if (e.status !== 'approved' || e.qbo_id) return; const k = qgMonthKey(e.date || ''); if (k) outBy[k] = (outBy[k] || 0) + (Number(e.amount) || 0); });
  const netSeries = mkeys.map(k => (inBy[k] || 0) - (outBy[k] || 0));
  const mLabel = (k) => new Date(k + '-15').toLocaleDateString('en-US', { month: 'short' }) + (k.endsWith('-01') ? ` '${k.slice(2, 4)}` : '');
  const cfLabels = mkeys.filter((_, i) => months <= 6 || i % 2 === 0).map(mLabel);

  /* Sales */
  const sR = qgRange(salesPeriod);
  const salesRows = D.invoices.filter(i => i.status !== 'draft' && i.status !== 'void' && qgIn(qgInvDate(i), sR));
  const salesTotal = salesRows.reduce((s, i) => s + i.amount, 0);
  const sKeys = (() => { const [a, b] = sR; const out = []; let d = new Date(a + 'T12:00:00'); const end = new Date(b + 'T12:00:00'); while (d <= end) { out.push(d.toISOString().slice(0, 7)); d = new Date(d.getFullYear(), d.getMonth() + 1, 15); } return out; })();
  const sSeries = sKeys.map(k => salesRows.filter(i => qgMonthKey(qgInvDate(i) || '') === k).reduce((s, i) => s + i.amount, 0));

  /* AR aging */
  const open = D.invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const bucket = (lo, hi) => open.filter(i => { const d = Number(i.days) || 0; return d >= lo && (hi == null || d <= hi); }).reduce((s, i) => s + i.amount, 0);
  const arParts = [{ label: 'Current', value: bucket(0, 0), color: 'var(--status-ok)' }, { label: '1 – 30', value: bucket(1, 30), color: 'var(--status-warn)' }, { label: '31 – 60', value: bucket(31, 60), color: 'var(--status-critical)' }, { label: '61 – 90', value: bucket(61, 90), color: 'var(--disc-alarm, var(--disc-alarm))' }, { label: '91 and over', value: bucket(91, null), color: 'var(--disc-fire, #FF3B5C)' }];
  const arTotal = arParts.reduce((s, p) => s + p.value, 0);
  const overdue = open.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  /* bills due */
  const billsOpen = D.bills.filter(b => Number(b.balance) > 0);
  const week = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const billsWeek = billsOpen.filter(b => b.due_date && b.due_date <= week).reduce((s, b) => s + Number(b.balance), 0);

  /* customer hub */
  const leadsN = (() => { const s = window.bidStore || window.crmStore || window.leadStore || window.opportunityStore; try { const rows = s && s.get ? s.get() : null; return Array.isArray(rows) ? rows.filter(r => !/won|lost|closed|archived/i.test(String(r.status || r.stage || ''))).length : null; } catch { return null; } })();
  const openEst = D.estimates.filter(e => e.status === 'sent');
  const inProg = D.projects.filter(p => !['completed', 'closed', 'cancelled', 'draft'].includes(String(p.status || '').toLowerCase()));
  const mrrTotal = D.mrr.filter(x => !x.churned && x.status === 'active').reduce((s, x) => s + (Number(x.mrr) || 0), 0);

  /* feed */
  const feed = [];
  if (!D.qbo.connected) feed.push({ t: 'Connect QuickBooks', s: 'Every form already posts through the write engine; set the four QBO secrets and bills, payments and expenses book themselves.', cta: 'How to connect', go: () => onNav('qbo-map') });
  else feed.push({ t: 'QuickBooks connected', s: D.qbo.last ? `Last sync ${new Date(D.qbo.last).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Nightly sync on', cta: 'Sync now', go: () => window.__shieldQBO && window.__shieldQBO.syncNow('pull').then(() => shieldToast('QuickBooks synced', 'ok')) });
  if (overdue > 0) feed.push({ t: `${qgMoney(overdue)} overdue`, s: `${open.filter(i => i.status === 'overdue').length} invoices past due across ${new Set(open.filter(i => i.status === 'overdue').map(i => i.customer)).size} customers.`, cta: 'Collect', go: () => onNav('invoices') });
  if (toReview > 0) feed.push({ t: `${toReview} to review`, s: `${D.receiptsInbox} receipts in the inbox and ${pendingExp} field expenses waiting for approval.`, cta: 'Review', go: () => qgNav('approvals') });
  if (billsWeek > 0) feed.push({ t: `${qgMoney(billsWeek)} due this week`, s: `${billsOpen.filter(b => b.due_date && b.due_date <= week).length} bills come due in the next 7 days.`, cta: 'Pay bills', go: () => onNav('ap') });
  if (openEst.length) feed.push({ t: `${openEst.length} quotes waiting`, s: `${qgMoney(openEst.reduce((s, e) => s + e.amount, 0))} of proposals sent and not yet answered.`, cta: 'Follow up', go: () => onNav('estimates') });

  const pill = (l, fn, color) => <button key={l} onClick={fn} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 8px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 10px color-mix(in srgb, ${color} 60%, transparent)` }} />{l}</button>;
  const chip = (l, fn) => <button key={l} onClick={fn} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-high)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{l}</button>;
  const legend = (parts, total) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>{parts.map(p => <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} /><span style={{ color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.label}</span><span className="mono" style={{ color: 'var(--text-high)' }}>{qgMoney(p.value, true)}</span>{total > 0 && <span className="mono" style={{ color: 'var(--text-low)', width: 32, textAlign: 'right' }}>{Math.round(p.value / total * 100)}%</span>}</div>)}</div>;
  const big = (v, sub, color) => <div><div className="mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: color || 'var(--text-high)' }}>{v}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>}</div>;
  const bar = (label, v, max, color, right) => <div style={{ marginTop: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}><span style={{ color: 'var(--text-mid)' }}><span className="mono" style={{ color: 'var(--text-high)', fontWeight: 600, marginRight: 8 }}>{qgMoney(v)}</span>{label}</span>{right}</div><div style={{ height: 8, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden' }}><div style={{ width: `${max > 0 ? Math.min(100, v / max * 100) : 0}%`, height: '100%', background: color, borderRadius: 4 }} /></div></div>;

  const quick = [['Customer', 'customer'], ['Product or service', 'item'], ['Estimate', 'estimate'], ['Invoice', 'invoice'], ['Recurring invoice', () => onNav('recurring')], ['Receive payment', 'payment'], ['Sales receipt', () => onNav('credits')], ['Bank deposit', () => onNav('bankfeed')], ['Create statement', () => onNav('statements')]];
  const funnel = [['Open leads', leadsN == null ? '—' : leadsN, () => qgNav('crm'), 'var(--disc-access, #19E3EC)'], ['Open estimates', openEst.length, () => onNav('estimates'), 'var(--brand)'], ['In progress projects', inProg.length, () => qgNav('projects'), 'var(--disc-cabling, #27E39A)'], ['Unpaid invoices', open.length, () => onNav('invoices'), 'var(--status-warn)'], ['Reviews', D.nps.length, () => qgNav('nps'), 'var(--disc-alarm, var(--disc-alarm))']];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, paddingBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{greet}{first ? `, ${first}` : ''}</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {pill('Accounting', () => onNav('accounts'), 'var(--brand)')}
          {pill('Expenses & Pay Bills', () => onNav('ap'), 'var(--disc-cabling, #27E39A)')}
          {pill('Sales & Get Paid', () => onNav('invoices'), 'var(--disc-access, #19E3EC)')}
          {pill('Customers', () => qgNav('customers-list'), 'var(--disc-alarm, var(--disc-alarm))')}
          {pill('Team', () => qgNav('employees'), 'var(--status-warn)')}
          {pill('Tax', () => onNav('sales-tax'), 'var(--disc-fire, #FF3B5C)')}
          {pill('Reports', () => onNav('reports-center'), 'var(--text-low)')}
        </div>
      </div>

      {/* Business feed */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Business feed</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {feed.slice(0, 4).map(f => <div key={f.t} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--brand)', borderRadius: 12, padding: '12px 14px' }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{f.t}</div><div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4, lineHeight: 1.45 }}>{f.s}</div><button onClick={f.go} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{f.cta} →</button></div>)}
        </div>
      </div>

      {/* Create actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, marginRight: 4 }}>Create actions</span>
        {chip('Create invoice', () => qgNew('invoice'))}{chip('Record expense', () => qgNew('purchase'))}{chip('Receive payment', () => qgNew('payment'))}{chip('Create estimate', () => qgNew('estimate'))}{chip('Enter bill', () => qgNew('bill'))}{chip('Add time entry', () => qgNew('time'))}
        <button onClick={() => window.openQboNew ? window.openQboNew('menu') : null} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Show all</button>
      </div>

      {/* Business at a glance */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Business at a glance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <QgWidget title="Profit & loss" sub={`Net ${net >= 0 ? 'profit' : 'loss'} for ${qgPeriods[plPeriod].toLowerCase()}`} right={<QgSelect value={plPeriod} onChange={setPlPeriod} options={Object.entries(qgPeriods)} />} footer="See profit and loss report" onFooter={() => onNav('statements-fin')}>
            {big(qgMoney(net), `${qgMoney(income)} collected · ${qgMoney(invoiced)} invoiced`, net >= 0 ? 'var(--status-ok)' : 'var(--status-critical)')}
            {bar('Income', income, Math.max(income, plSpend), 'var(--status-ok)', toReview > 0 ? <button onClick={() => qgNav('approvals')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{toReview} to review</button> : null)}
            {bar('Expenses', plSpend, Math.max(income, plSpend), 'var(--brand)')}
          </QgWidget>
          <QgWidget title="Expenses" sub={`Spending for ${qgPeriods[exPeriod].toLowerCase()}`} right={<QgSelect value={exPeriod} onChange={setExPeriod} options={Object.entries(qgPeriods)} />} footer={toReview ? `Categorise ${toReview} transactions` : 'See all expenses'} onFooter={() => onNav('expenses')}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <QgDonut parts={exParts} center={<div><div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{qgMoney(exTotal, true)}</div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>spent</div></div>} />
              <div style={{ flex: 1, minWidth: 0 }}>{exParts.length ? legend(exParts, exTotal) : <div style={{ fontSize: 12, color: 'var(--text-low)' }}>No expenses recorded for this period. Record one with "Record expense" or snap receipts from the tech app.</div>}</div>
            </div>
          </QgWidget>
          <QgWidget title="Smart suggestions" sub="What ShieldTech would do next" style={{ borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[overdue > 0 ? [`Collect ${qgMoney(overdue, true)} overdue`, () => onNav('invoices')] : null, mrrTotal > 0 ? [`${qgMoney(mrrTotal)} MRR — review contracts`, () => qgNav('mrr')] : ['Set up recurring revenue', () => qgNav('mrr')], openEst.length ? [`Chase ${openEst.length} open quotes`, () => onNav('estimates')] : null, !D.qbo.connected ? ['Connect QuickBooks for bank + P&L', () => onNav('qbo-map')] : ['Reconcile this month', () => onNav('reconcile')], ['Add standard LV services', () => qgNew('seed-services')]].filter(Boolean).map(([l, fn]) => <button key={l} onClick={fn} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-high)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✦ {l}</button>)}
            </div>
          </QgWidget>
          <QgWidget title="Bank accounts" sub="As of today" footer="Go to bank feed" onFooter={() => onNav('bankfeed')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}><span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--modal)', display: 'grid', placeItems: 'center', fontSize: 13 }}>🏦</span><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Operating account</div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>No bank feed connected</div></div><div className="mono" style={{ color: 'var(--text-low)' }}>—</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}><span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--modal)', display: 'grid', placeItems: 'center', fontSize: 13 }}>⚡</span><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Stripe payouts</div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>Pay links settle here</div></div><button onClick={() => onNav('stripe')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View</button></div>
              <div style={{ fontSize: 11.5, color: 'var(--text-low)', lineHeight: 1.45 }}>Balances appear once the bank feed is linked; cash flow below uses invoices, bills and expenses in the meantime.</div>
            </div>
          </QgWidget>
          <QgWidget title="Cash flow" sub="Money in minus money out, by month" right={<QgSelect value={cfMonths} onChange={setCfMonths} options={[['6', '6 months'], ['12', '12 months'], ['24', '24 months']]} />} footer="View cash flow" onFooter={() => onNav('statements-fin')} style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', marginBottom: 6 }}>{big(qgMoney(netSeries.reduce((s, v) => s + v, 0)), `net over ${months} months`)}<div style={{ fontSize: 11.5, color: 'var(--text-low)' }}><span style={{ color: 'var(--status-ok)' }}>■</span> in {qgMoney(mkeys.reduce((s, k) => s + (inBy[k] || 0), 0), true)} · <span style={{ color: 'var(--brand)' }}>■</span> out {qgMoney(mkeys.reduce((s, k) => s + (outBy[k] || 0), 0), true)}</div></div>
            <QgArea values={netSeries} labels={cfLabels} color={netSeries.reduce((s, v) => s + v, 0) >= 0 ? 'var(--status-ok)' : 'var(--status-critical)'} />
          </QgWidget>
          <QgWidget title="Sales" sub={`Total invoiced ${qgPeriods[salesPeriod].toLowerCase()}`} right={<QgSelect value={salesPeriod} onChange={setSalesPeriod} options={Object.entries(qgPeriods)} />} footer="See sales transactions" onFooter={() => onNav('invoices')}>
            {big(qgMoney(salesTotal), `${salesRows.length} invoices`)}
            <div style={{ marginTop: 10 }}><QgBars series={[sSeries]} labels={sKeys.map(k => new Date(k + '-15').toLocaleDateString('en-US', { month: 'short' }))} colors={['var(--disc-access, #19E3EC)']} height={80} /></div>
          </QgWidget>
          <QgWidget title="Accounts receivable" sub="As of today" footer="Collect — open the Money dial on mobile, or Invoices here" onFooter={() => onNav('invoices')}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <QgDonut parts={arParts} center={<div><div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{qgMoney(arTotal, true)}</div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>total</div></div>} />
              <div style={{ flex: 1, minWidth: 0 }}>{legend(arParts, arTotal)}</div>
            </div>
          </QgWidget>
        </div>
      </div>

      {/* Sales & Get Paid — quick actions */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}><div><div style={{ fontSize: 14, fontWeight: 700 }}>Quick actions</div><div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginTop: 2 }}>Money in</div></div><button onClick={() => onNav('invoices')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Sales & Get Paid overview →</button></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {quick.map(([l, k]) => <button key={l} onClick={() => typeof k === 'function' ? k() : qgNew(k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 6px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--modal)', color: 'var(--text-high)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center' }}><span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border-strong)', display: 'grid', placeItems: 'center', color: 'var(--brand)', fontSize: 16, fontWeight: 800 }}>+</span>{l}</button>)}
        </div>
      </div>

      {/* Customer Hub — funnel */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Customers at a glance</div><span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>Customer funnel · as of today</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {funnel.map(([l, v, fn, color]) => <button key={l} onClick={fn} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', borderTop: `3px solid ${color}`, background: 'var(--card)', color: 'var(--text-high)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}><div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{l}</div><div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span className="mono" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</span><span style={{ color: 'var(--text-low)' }}>›</span></div></button>)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { QboGlance, QgDonut, QgBars, QgArea });

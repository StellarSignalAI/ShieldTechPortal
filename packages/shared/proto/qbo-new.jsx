/* QuickBooks "+ New" — the one entry point for creating money records, shared
   by the desktop Finance Suite, the mobile Money tab and any screen that needs
   it (window.openQboNew). Mirrors QuickBooks' own + New catalog: Customers
   (invoice, receive payment, estimate, customer), Vendors (expense, bill, pay
   bill, vendor), Other (product/service, time entry).

   Every form writes locally first (the shared stores every screen renders),
   then posts the real transaction to QuickBooks through window.__shieldQBO
   (qbo-sync "push"). When the Intuit credentials aren't set yet, the record
   is kept here and the toast says exactly that — nothing is faked.

   Desktop renders a centered modal; phones get the MSheet bottom sheet. */

const QBO_NEW_CATALOG = [
  { g: 'Customers', items: [
    { id: 'invoice', label: 'Invoice', hint: 'Bill a customer', glyph: '⊞' },
    { id: 'payment', label: 'Receive payment', hint: 'Apply a payment to an open invoice', glyph: '✓' },
    { id: 'estimate', label: 'Estimate', hint: 'Quote a job', glyph: '◇' },
    { id: 'customer', label: 'Customer', hint: 'Add a customer', glyph: '◉' },
  ] },
  { g: 'Vendors', items: [
    { id: 'purchase', label: 'Expense', hint: 'Money already spent', glyph: '◈' },
    { id: 'bill', label: 'Bill', hint: 'Money owed, pay later', glyph: '▤' },
    { id: 'billpayment', label: 'Pay bill', hint: 'Pay an open bill', glyph: '→' },
    { id: 'vendor', label: 'Vendor', hint: 'Add a supplier or sub', glyph: '⬡' },
  ] },
  { g: 'Other', items: [
    { id: 'item', label: 'Product / service', hint: 'Add to your catalog', glyph: '⊕' },
    { id: 'seed-services', label: 'Standard LV services', hint: 'Add the low-voltage service catalog', glyph: '☰' },
    { id: 'time', label: 'Time entry', hint: 'Log hours → timesheets', glyph: '◷' },
  ] },
];

/* The reusable low-voltage service catalog. Prices are suggested defaults
   (ShieldTech's current QuickBooks rates where they exist); every row is
   reviewed and editable before anything is created, and existing items with
   the same name are reused, never duplicated. */
const QBO_SERVICE_CATALOG = [
  ['Service Call — Diagnostic (first hour)', 185, 'On-site diagnostic, first hour, any system'],
  ['Labor — Technician (per hour)', 235.33, 'Low-voltage technician labor, billed hourly'],
  ['Labor — Two-Technician Crew (per hour)', 350, 'Two-technician crew, billed hourly'],
  ['After-Hours / Emergency Service (per hour)', 295, 'Nights, weekends and holidays'],
  ['Trip Charge', 75, 'Dispatch / trip charge per visit'],
  ['Travel Time (per hour)', 75, 'Travel to and from site'],
  ['CCTV — Camera Install (per camera)', 275, 'Mount, cable, terminate, focus and configure one camera'],
  ['CCTV — NVR / Recorder Install & Configure', 450, 'Recorder install, storage setup, retention and remote view'],
  ['CCTV — Programming & Remote View Setup', 225, 'Analytics, schedules, notifications, mobile app'],
  ['Access Control — Door Install (per door)', 650, 'Reader, lock power, REX, door contact, wiring and test'],
  ['Access Control — Controller / Panel Install', 900, 'Controller install, enclosure, power, network'],
  ['Access Control — Reader & Credential Programming', 175, 'Credentials, schedules, access groups'],
  ['Intrusion Alarm — System Install', 3245.77, 'Panel, keypad, perimeter and interior devices, programming, training'],
  ['Intrusion Alarm — Zone Test / Inspection', 225, 'Walk test all zones, comm path verify'],
  ['Fire Alarm — Device Install (per device)', 185, 'Detector, pull station, horn/strobe or module'],
  ['Fire Alarm — Annual Inspection & Test', 495, 'Annual inspection, functional test, report'],
  ['Structured Cabling — Cat6 Drop (certified)', 185, 'Pull, terminate both ends, label, certify'],
  ['Structured Cabling — Fiber Termination (per strand)', 65, 'Terminate and test one strand'],
  ['Structured Cabling — Rack / Patch Panel Build', 650, 'Rack, patch panels, cable management, labeling'],
  ['Network — WAP Install (per AP)', 345, 'Run network cable from headend and mount access point'],
  ['Network — Switch / Router Install & Config', 350, 'Install, VLANs, PoE budget, uplinks'],
  ['Intercom / Video Entry Install', 1756, 'Door station, head-end, cabling, configuration'],
  ['AV — Speaker / Display Install', 550, 'Mount, cable, terminate, tune'],
  ['Prewire — Rough-in (per drop)', 95, 'New construction rough-in, box and staple'],
  ['Monitoring — Central Station (monthly)', 45, 'UL central station monitoring'],
  ['Monitoring — Video / Cloud Storage (monthly)', 25, 'Per-camera cloud retention'],
  ['Preventive Maintenance Visit', 450, 'Scheduled system check, cleaning, firmware'],
  ['Lift Rental (pass-through)', 0, 'Lift / boom rental billed at cost'],
  ['Per Diem & Lodging', 2800, 'Out-of-area crew per diem and lodging'],
  ['Project Mobilization Deposit', 0, 'Deposit toward a project contract'],
  ['Permit / Inspection Fee (pass-through)', 0, 'Municipal permits and inspections at cost'],
  ['Materials (pass-through)', 0, 'Equipment and materials at cost plus markup'],
];

const qboToast = (m, t) => (window.shieldToast || window.showToast || (() => {}))(m, t);
const qboIsMobile = () => !!(window.MSheet && window.innerWidth < 760);
const qboMoneyFmt = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qboTodayIso = () => new Date().toISOString().slice(0, 10);
/* All the expense stores are the same persisted key ('mexpenses'); write to
   every instance that's loaded so each surface re-renders. */
const qboExpenseStores = () => [window.dExpenseStore, window.mExpenseStore, window.techExpenseStore].filter(Boolean);

/* ── overlay host (imperative) ── */
let qboOverlaySet = null;
let qboOverlayRoot = null;
function QboOverlayHost() {
  const [st, set] = React.useState(null);
  React.useEffect(() => { qboOverlaySet = set; return () => { qboOverlaySet = null; }; }, []);
  if (!st) return null;
  const close = () => set(null);
  if (st.kind === 'menu') return <QboSurface title="New" onClose={close}><QboNewMenu onPick={(id) => set({ kind: id, prefill: {}, opts: st.opts })} /></QboSurface>;
  return <QboFormRouter kind={st.kind} prefill={st.prefill || {}} opts={st.opts || {}} onClose={close} />;
}
/* window.openQboNew('menu') | openQboNew('payment', { invoice }) | openQboNew('billpayment', { bill }) … */
function openQboNew(kind = 'menu', prefill = {}, opts = {}) {
  if (!qboOverlayRoot) {
    const el = document.createElement('div');
    el.id = 'qbo-new-host';
    document.body.appendChild(el);
    qboOverlayRoot = ReactDOM.createRoot(el);
    qboOverlayRoot.render(<QboOverlayHost />);
  }
  const go = () => { if (qboOverlaySet) qboOverlaySet({ kind, prefill, opts }); else setTimeout(go, 16); };
  go();
}

/* ── surface: modal on desktop, bottom sheet on phones ── */
function QboSurface({ title, onClose, children, width = 520 }) {
  if (qboIsMobile()) return <MSheet title={title} onClose={onClose}>{children}</MSheet>;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width, maxWidth: 'calc(100vw - 32px)', maxHeight: '86vh', overflow: 'auto', padding: 22, borderRadius: 14, animation: 'fade-up 0.22s ease both', background: 'var(--modal, var(--card))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="display" style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── the catalog menu ── */
function QboNewMenu({ onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {QBO_NEW_CATALOG.map(g => (
        <div key={g.g}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-low)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{g.g}</div>
          <div style={{ display: 'grid', gridTemplateColumns: qboIsMobile() ? '1fr' : '1fr 1fr', gap: 6 }}>
            {g.items.map(it => (
              <button key={it.id} onClick={() => onPick(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-high)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(99,102,241,0.12)', color: 'var(--brand)', fontSize: 14, flexShrink: 0 }}>{it.glyph}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{it.label}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-low)' }}>{it.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── field primitives (compact, tabular, keyboard-friendly) ── */
const qboInp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(5,7,10,0.45)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' };
const qboLbl = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };
function QField({ label, children, span }) { return <div style={span ? { gridColumn: '1 / -1' } : undefined}><span style={qboLbl}>{label}</span>{children}</div>; }
function QSeg({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(99,102,241,0.06)', borderRadius: 9, padding: 3, border: '1px solid var(--border-subtle)' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ flex: 1, padding: '8px 6px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', background: value === o ? 'rgba(99,102,241,0.18)' : 'transparent', color: value === o ? 'var(--brand)' : 'var(--text-low)' }}>{o}</button>
      ))}
    </div>
  );
}
function QActions({ onCancel, onSubmit, label, busy, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
      <button onClick={onSubmit} disabled={busy || disabled} style={{ flex: 2, padding: '12px 0', background: 'var(--brand)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy || disabled ? 'not-allowed' : 'pointer', opacity: busy || disabled ? 0.55 : 1, fontFamily: 'var(--font-body)' }}>{busy ? 'Posting…' : label}</button>
    </div>
  );
}
function QNote({ children }) { return <div style={{ fontSize: 10.5, color: 'var(--text-low)', lineHeight: 1.5 }}>{children}</div>; }

/* Load a QBO landing list once (vendors, accounts, bills…). */
function useQboList(name, arg) {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const q = window.__shieldQBO; if (!q || !q[name]) return;
    q[name](arg).then(r => { if (alive && r && r.ok) setRows(r.data || []); });
    return () => { alive = false; };
  }, [name]);
  return rows;
}

/* Post to QuickBooks and translate the outcome into one honest toast. */
async function qboPost(entity, payload, label) {
  const q = window.__shieldQBO;
  if (!q || !q.push) { qboToast(`${label} saved here — backend not configured`, 'warn'); return { ok: false, local: true }; }
  const r = await q.push(entity, payload);
  if (r && r.ok) {
    if (r.data && r.data.skipped) qboToast(`${label}: QuickBooks shows this already paid — nothing posted`, 'warn');
    else qboToast(`${label} — recorded in QuickBooks`, 'ok');
    try { window.dispatchEvent(new CustomEvent('qbo:changed', { detail: { entity, data: r.data } })); } catch { /* noop */ }
  } else if (q.notConnected && q.notConnected(r)) {
    qboToast(`${label} saved here — QuickBooks isn't connected yet (set the Intuit keys on qbo-sync)`, 'warn');
  } else {
    qboToast(`QuickBooks: ${(r && r.error) || 'unknown error'}`, 'warn');
  }
  return r;
}

/* Book an approved field expense in QuickBooks once (idempotent per row).
   Used by the desktop approvals screen, the mobile expenses screen and the
   receipt-inbox conversions — one path, no duplicates. */
async function qboPostExpense(row, { silent } = {}) {
  const q = window.__shieldQBO;
  if (!q || !q.recordExpense || !row || row.qbo_id || !(Number(row.amount) > 0)) return null;
  const r = await q.recordExpense({
    vendor: row.vendor || undefined, amount: Number(row.amount), date: row.date || qboTodayIso(),
    paymentType: row.paymentType || 'Cash', category: row.category || undefined,
    memo: [row.desc, row.by ? `— ${row.by}` : '', row.job_ref ? `(${row.job_ref})` : ''].filter(Boolean).join(' '),
    reference: row.receipt_id ? String(row.receipt_id).slice(0, 21) : undefined,
  });
  if (r && r.ok && r.data && r.data.Id) {
    qboExpenseStores().forEach(s => s.set(prev => (prev || []).map(e => e.id === row.id ? { ...e, qbo_id: String(r.data.Id) } : e)));
    if (!silent) qboToast('Expense recorded in QuickBooks', 'ok');
    try { window.dispatchEvent(new CustomEvent('qbo:changed', { detail: { entity: 'purchase' } })); } catch { /* noop */ }
  } else if (!silent) {
    qboToast(q.notConnected && q.notConnected(r) ? 'Approved here — QuickBooks isn\'t connected yet' : `QuickBooks: ${(r && r.error) || 'unknown error'}`, 'warn');
  }
  return r;
}

/* ── router ── */
function QboFormRouter({ kind, prefill, opts, onClose }) {
  const nav = (id) => { onClose(); if (window.__shieldNav) window.__shieldNav(id); };
  switch (kind) {
    case 'payment': return <QboSurface title="Receive payment" onClose={onClose}><QboPaymentForm prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'purchase': return <QboSurface title="Expense" onClose={onClose}><QboExpenseForm prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'bill': return <QboSurface title="Bill" onClose={onClose}><QboBillForm prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'billpayment': return <QboSurface title="Pay bill" onClose={onClose}><QboBillPaymentForm prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'vendor': return <QboSurface title="New vendor" onClose={onClose}><QboPartyForm entity="vendor" prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'customer': return <QboSurface title="New customer" onClose={onClose}><QboPartyForm entity="customer" prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'item': return <QboSurface title="Product / service" onClose={onClose}><QboItemForm prefill={prefill} onClose={onClose} /></QboSurface>;
    case 'seed-services': return <QboSurface title="Standard low-voltage services" onClose={onClose} width={640}><QboSeedServices onClose={onClose} /></QboSurface>;
    case 'invoice':
    case 'estimate': {
      // Invoices/estimates already have full builders — route to them, no duplicate forms.
      if (qboIsMobile() && kind === 'invoice' && window.MNewInvoiceSheet) return <MNewInvoiceSheet onClose={onClose} />;
      onClose();
      if (window.__financeSetModal) { window.__financeSetModal({ type: kind === 'invoice' ? 'new-invoice' : 'new-estimate' }); return null; }
      if (window.qboGo) window.qboGo('finance', { financeTab: kind === 'invoice' ? 'invoices' : 'estimates' });
      else if (window.__shieldNav) window.__shieldNav(kind === 'invoice' ? 'invoices' : 'estimates');
      return null;
    }
    case 'time': nav('timesheets'); return null;
    default: onClose(); return null;
  }
}

/* ── Receive payment ── */
function QboPaymentForm({ prefill, onClose }) {
  const merged = typeof useMergedInvoices === 'function' ? useMergedInvoices() : [];
  const openInv = merged.filter(i => i.status === 'pending' || i.status === 'overdue' || i.status === 'open');
  const [inv, setInv] = React.useState(prefill.invoice || null);
  const [q, setQ] = React.useState('');
  const raw = (inv && inv._raw) || {};
  const balance = raw.balance != null && Number(raw.balance) > 0 ? Number(raw.balance) : (inv ? Number(inv.amount) || 0 : 0);
  const [f, setF] = React.useState({ amount: prefill.amount != null ? String(prefill.amount) : '', date: qboTodayIso(), method: 'Check', reference: '', memo: '' });
  React.useEffect(() => { if (inv && !f.amount) setF(p => ({ ...p, amount: String(balance || '') })); }, [inv]);
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const matches = q.trim() ? openInv.filter(i => `${i.num} ${i.customer} ${i.amount}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : openInv.slice(0, 6);
  const amount = Number(f.amount) || 0;
  const full = inv && amount >= balance - 0.005;
  const submit = async () => {
    if (!inv) { qboToast('Pick the invoice being paid', 'warn'); return; }
    if (!(amount > 0)) { qboToast('Enter the amount received', 'warn'); return; }
    setBusy(true);
    // Local first: full payments close the invoice everywhere; partials keep it open.
    if (full) {
      if (typeof saveDocEdit === 'function') saveDocEdit('invoice', { num: inv.num, customer: inv.customer, status: 'paid', lines: inv.lines, total: inv.amount, balance: 0, paidAt: Date.now(), paidVia: f.method.toLowerCase() });
      else if (window.invoiceStore) window.invoiceStore.set(l => (l || []).map(d => ((d.doc_number || d.num) === inv.num) ? { ...d, status: 'paid', balance: 0, paidAt: Date.now() } : d));
      if (window.__shieldPay && window.__shieldPay.recordPaid) window.__shieldPay.recordPaid(inv.num).catch(() => {});
    }
    await qboPost('payment', {
      invoiceQboId: raw.qbo_id && !String(raw.qbo_id).startsWith('local') ? raw.qbo_id : undefined,
      docNumber: inv.num, amount, date: f.date, method: f.method, reference: f.reference || undefined, memo: f.memo || undefined,
    }, `${qboMoneyFmt(amount)} from ${inv.customer}`);
    setBusy(false); onClose();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {inv ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-strong)' }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{inv.num}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>open {qboMoneyFmt(balance)}</span>
          {!prefill.invoice && <button onClick={() => setInv(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>✕</button>}
        </div>
      ) : (
        <QField label="Invoice">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search open invoices — number, customer…" style={qboInp} autoFocus />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {matches.map(i => (
              <button key={i.num} onClick={() => setInv(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-high)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{i.num}</span>
                <span style={{ flex: 1, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.customer}</span>
                <span className="mono" style={{ fontSize: 12 }}>{qboMoneyFmt((i._raw && i._raw.balance) || i.amount)}</span>
              </button>
            ))}
            {matches.length === 0 && <QNote>No open invoices match.</QNote>}
          </div>
        </QField>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QField label="Amount received"><input type="number" inputMode="decimal" value={f.amount} onChange={set('amount')} placeholder="0.00" style={{ ...qboInp, fontFamily: 'var(--font-mono)' }} /></QField>
        <QField label="Payment date"><input type="date" value={f.date} onChange={set('date')} style={qboInp} /></QField>
        <QField label="Method" span><QSeg options={['Check', 'Cash', 'Credit Card', 'ACH', 'Stripe']} value={f.method} onChange={v => setF(p => ({ ...p, method: v }))} /></QField>
        <QField label="Reference / check #"><input value={f.reference} onChange={set('reference')} placeholder="optional" style={qboInp} /></QField>
        <QField label="Memo"><input value={f.memo} onChange={set('memo')} placeholder="optional" style={qboInp} /></QField>
      </div>
      {inv && <QNote>{full ? `Closes ${inv.num} in full.` : amount > 0 ? `Partial payment — ${qboMoneyFmt(balance - amount)} stays open on ${inv.num}.` : ''} Posts a Payment linked to the invoice in QuickBooks (Undeposited Funds unless a deposit account is set there).</QNote>}
      <QActions onCancel={onClose} onSubmit={submit} label="Record payment" busy={busy} disabled={!inv} />
    </div>
  );
}

/* ── Expense (money already spent) ── */
function QboExpenseForm({ prefill, onClose }) {
  const vendors = useQboList('vendors', 1000);
  const accounts = useQboList('accounts', 500);
  const expenseAccts = accounts.filter(a => /Expense|Cost of Goods/i.test(a.account_type || ''));
  const [f, setF] = React.useState({ vendor: prefill.vendor || '', amount: prefill.amount != null ? String(prefill.amount) : '', date: prefill.date || qboTodayIso(), paymentType: 'Credit Card', paidFrom: '', category: prefill.category || '', memo: prefill.memo || '', reference: '' });
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const ptype = f.paymentType === 'Credit Card' ? 'CreditCard' : f.paymentType;
  const fromAccts = accounts.filter(a => (ptype === 'CreditCard' ? /Credit Card/i : /^Bank$/i).test(a.account_type || ''));
  const amount = Number(f.amount) || 0;
  const submit = async () => {
    if (!(amount > 0)) { qboToast('Enter the amount', 'warn'); return; }
    setBusy(true);
    const row = { id: 'exp-' + Date.now().toString(36), desc: f.memo || f.vendor || 'Expense', vendor: f.vendor || null, amount, category: f.category || 'Other', by: ((window.__shieldUser || {}).name) || 'Office', date: f.date, status: 'approved', paymentType: ptype };
    qboExpenseStores().forEach(s => s.set(prev => [row, ...(prev || [])]));
    const r = await qboPost('purchase', { vendor: f.vendor || undefined, amount, date: f.date, paymentType: ptype, paidFrom: f.paidFrom || undefined, category: f.category || undefined, memo: f.memo || undefined, reference: f.reference || undefined }, `${qboMoneyFmt(amount)} expense`);
    if (r && r.ok && r.data && r.data.Id) qboExpenseStores().forEach(s => s.set(prev => (prev || []).map(e => e.id === row.id ? { ...e, qbo_id: String(r.data.Id) } : e)));
    setBusy(false); onClose();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QField label="Payee / vendor" span>
          <input list="qbo-vendors" value={f.vendor} onChange={set('vendor')} placeholder="Home Depot, ADI…" style={qboInp} autoFocus />
          <datalist id="qbo-vendors">{vendors.map(v => <option key={v.qbo_id} value={v.display_name || v.company_name} />)}</datalist>
        </QField>
        <QField label="Amount"><input type="number" inputMode="decimal" value={f.amount} onChange={set('amount')} placeholder="0.00" style={{ ...qboInp, fontFamily: 'var(--font-mono)' }} /></QField>
        <QField label="Date"><input type="date" value={f.date} onChange={set('date')} style={qboInp} /></QField>
        <QField label="Paid with" span><QSeg options={['Credit Card', 'Check', 'Cash']} value={f.paymentType} onChange={v => setF(p => ({ ...p, paymentType: v, paidFrom: '' }))} /></QField>
        <QField label={ptype === 'CreditCard' ? 'Card account' : 'Bank account'}>
          <input list="qbo-from" value={f.paidFrom} onChange={set('paidFrom')} placeholder={fromAccts[0] ? fromAccts[0].name : 'default'} style={qboInp} />
          <datalist id="qbo-from">{fromAccts.map(a => <option key={a.qbo_id} value={a.name} />)}</datalist>
        </QField>
        <QField label="Category">
          <input list="qbo-expense-cats" value={f.category} onChange={set('category')} placeholder="Materials, Fuel, Tools…" style={qboInp} />
          <datalist id="qbo-expense-cats">{(expenseAccts.length ? expenseAccts.map(a => a.name) : ['Materials', 'Fuel', 'Tools', 'Meals', 'Subcontractors', 'Vehicle', 'Office']).map(n => <option key={n} value={n} />)}</datalist>
        </QField>
        <QField label="Memo / what for" span><input value={f.memo} onChange={set('memo')} placeholder="Conduit + fittings — Riverside Plaza" style={qboInp} /></QField>
        <QField label="Reference #"><input value={f.reference} onChange={set('reference')} placeholder="optional" style={qboInp} /></QField>
      </div>
      <QNote>Posts a Purchase in QuickBooks against the category account; the card/bank defaults to your first account of that type when left blank.</QNote>
      <QActions onCancel={onClose} onSubmit={submit} label="Record expense" busy={busy} />
    </div>
  );
}

/* ── Bill (money owed, pay later) ── */
function QboBillForm({ prefill, onClose }) {
  const vendors = useQboList('vendors', 1000);
  const accounts = useQboList('accounts', 500);
  const expenseAccts = accounts.filter(a => /Expense|Cost of Goods/i.test(a.account_type || ''));
  const due30 = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
  const [f, setF] = React.useState({ vendor: prefill.vendor || '', amount: prefill.amount != null ? String(prefill.amount) : '', date: qboTodayIso(), dueDate: due30(), docNumber: '', category: '', memo: '' });
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const amount = Number(f.amount) || 0;
  const submit = async () => {
    if (!f.vendor.trim()) { qboToast('Enter the vendor', 'warn'); return; }
    if (!(amount > 0)) { qboToast('Enter the amount', 'warn'); return; }
    setBusy(true);
    await qboPost('bill', { vendor: f.vendor.trim(), amount, date: f.date, dueDate: f.dueDate, docNumber: f.docNumber || undefined, category: f.category || undefined, memo: f.memo || undefined }, `Bill ${qboMoneyFmt(amount)} · ${f.vendor.trim()}`);
    setBusy(false); onClose();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QField label="Vendor" span>
          <input list="qbo-vendors2" value={f.vendor} onChange={set('vendor')} placeholder="ADI Global, Anixter…" style={qboInp} autoFocus />
          <datalist id="qbo-vendors2">{vendors.map(v => <option key={v.qbo_id} value={v.display_name || v.company_name} />)}</datalist>
        </QField>
        <QField label="Amount"><input type="number" inputMode="decimal" value={f.amount} onChange={set('amount')} placeholder="0.00" style={{ ...qboInp, fontFamily: 'var(--font-mono)' }} /></QField>
        <QField label="Bill #"><input value={f.docNumber} onChange={set('docNumber')} placeholder="vendor invoice no." style={qboInp} /></QField>
        <QField label="Bill date"><input type="date" value={f.date} onChange={set('date')} style={qboInp} /></QField>
        <QField label="Due date"><input type="date" value={f.dueDate} onChange={set('dueDate')} style={qboInp} /></QField>
        <QField label="Category" span>
          <input list="qbo-bill-cats" value={f.category} onChange={set('category')} placeholder="Equipment, Cable & Supply, Subcontractors…" style={qboInp} />
          <datalist id="qbo-bill-cats">{expenseAccts.map(a => <option key={a.qbo_id} value={a.name} />)}</datalist>
        </QField>
        <QField label="Memo" span><input value={f.memo} onChange={set('memo')} placeholder="optional" style={qboInp} /></QField>
      </div>
      <QNote>Creates the Bill in QuickBooks (accounts payable). Pay it later from Bills → Pay.</QNote>
      <QActions onCancel={onClose} onSubmit={submit} label="Enter bill" busy={busy} />
    </div>
  );
}

/* ── Pay bill ── */
function QboBillPaymentForm({ prefill, onClose }) {
  const bills = useQboList('bills', 500);
  const accounts = useQboList('accounts', 500);
  const openBills = bills.filter(b => Number(b.balance) > 0);
  const [bill, setBill] = React.useState(prefill.bill || null);
  const balance = bill ? (Number(bill.balance) > 0 ? Number(bill.balance) : Number(bill.total) || 0) : 0;
  const [f, setF] = React.useState({ amount: '', date: qboTodayIso(), payType: 'Check', paidFrom: '', memo: '' });
  React.useEffect(() => { if (bill) setF(p => ({ ...p, amount: String(balance || '') })); }, [bill]);
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const fromAccts = accounts.filter(a => (f.payType === 'Credit Card' ? /Credit Card/i : /^Bank$/i).test(a.account_type || ''));
  const amount = Number(f.amount) || 0;
  const submit = async () => {
    if (!bill) { qboToast('Pick the bill', 'warn'); return; }
    if (!bill.qbo_id || String(bill.qbo_id).startsWith('local')) { qboToast('This bill isn\'t in QuickBooks yet — sync first', 'warn'); return; }
    if (!(amount > 0)) { qboToast('Enter the amount', 'warn'); return; }
    setBusy(true);
    await qboPost('billpayment', { billQboId: bill.qbo_id, amount, date: f.date, payType: f.payType === 'Credit Card' ? 'CreditCard' : 'Check', paidFrom: f.paidFrom || undefined, memo: f.memo || undefined }, `${qboMoneyFmt(amount)} to ${bill.vendor_name || bill.vendor || 'vendor'}`);
    setBusy(false); onClose();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {bill ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-strong)' }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{bill.doc_number || bill.num || ('BILL-' + bill.qbo_id)}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.vendor_name || bill.vendor}</span>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>open {qboMoneyFmt(balance)}</span>
          {!prefill.bill && <button onClick={() => setBill(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>✕</button>}
        </div>
      ) : (
        <QField label="Open bills">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {openBills.slice(0, 8).map(b => (
              <button key={b.qbo_id} onClick={() => setBill(b)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-high)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{b.doc_number || ('BILL-' + b.qbo_id)}</span>
                <span style={{ flex: 1, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.vendor_name}</span>
                <span className="mono" style={{ fontSize: 12 }}>{qboMoneyFmt(b.balance)}</span>
              </button>
            ))}
            {openBills.length === 0 && <QNote>No open bills in QuickBooks. Enter one with + New → Bill.</QNote>}
          </div>
        </QField>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QField label="Amount"><input type="number" inputMode="decimal" value={f.amount} onChange={set('amount')} placeholder="0.00" style={{ ...qboInp, fontFamily: 'var(--font-mono)' }} /></QField>
        <QField label="Payment date"><input type="date" value={f.date} onChange={set('date')} style={qboInp} /></QField>
        <QField label="Pay with" span><QSeg options={['Check', 'Credit Card']} value={f.payType} onChange={v => setF(p => ({ ...p, payType: v, paidFrom: '' }))} /></QField>
        <QField label={f.payType === 'Credit Card' ? 'Card account' : 'Bank account'} span>
          <input list="qbo-payfrom" value={f.paidFrom} onChange={set('paidFrom')} placeholder={fromAccts[0] ? fromAccts[0].name : 'default'} style={qboInp} />
          <datalist id="qbo-payfrom">{fromAccts.map(a => <option key={a.qbo_id} value={a.name} />)}</datalist>
        </QField>
        <QField label="Memo" span><input value={f.memo} onChange={set('memo')} placeholder="optional" style={qboInp} /></QField>
      </div>
      <QActions onCancel={onClose} onSubmit={submit} label="Pay bill" busy={busy} disabled={!bill} />
    </div>
  );
}

/* ── Vendor / Customer ── */
function QboPartyForm({ entity, prefill, onClose }) {
  const [f, setF] = React.useState({ name: prefill.name || '', company: '', email: prefill.email || '', phone: prefill.phone || '' });
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    if (!f.name.trim()) { qboToast('Enter a name', 'warn'); return; }
    setBusy(true);
    if (entity === 'customer' && typeof openNewCustomer !== 'function' && window.customerStore) { /* customers directory merges QBO rows after sync */ }
    await qboPost(entity, { name: f.name.trim(), company: f.company || undefined, email: f.email || undefined, phone: f.phone || undefined }, `${entity === 'vendor' ? 'Vendor' : 'Customer'} ${f.name.trim()}`);
    setBusy(false); onClose();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QField label="Display name" span><input value={f.name} onChange={set('name')} placeholder={entity === 'vendor' ? 'ADI Global Distribution' : 'Riverside Plaza LLC'} style={qboInp} autoFocus /></QField>
        <QField label="Company" span><input value={f.company} onChange={set('company')} placeholder="optional" style={qboInp} /></QField>
        <QField label="Email"><input type="email" value={f.email} onChange={set('email')} placeholder="optional" style={qboInp} /></QField>
        <QField label="Phone"><input value={f.phone} onChange={set('phone')} placeholder="optional" style={qboInp} /></QField>
      </div>
      <QNote>Reuses the QuickBooks record if one already has this display name.</QNote>
      <QActions onCancel={onClose} onSubmit={submit} label={entity === 'vendor' ? 'Add vendor' : 'Add customer'} busy={busy} />
    </div>
  );
}

/* ── Product / service ── */
function QboItemForm({ prefill, onClose }) {
  const accounts = useQboList('accounts', 500);
  const incomeAccts = accounts.filter(a => /Income/i.test(a.account_type || ''));
  const [f, setF] = React.useState({ name: prefill.name || '', type: 'Service', price: prefill.price != null ? String(prefill.price) : '', description: prefill.description || '', taxable: false, incomeAccount: '' });
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    if (!f.name.trim()) { qboToast('Enter the item name', 'warn'); return; }
    setBusy(true);
    await qboPost('item', { name: f.name.trim(), type: f.type === 'Service' ? 'Service' : 'NonInventory', price: f.price === '' ? undefined : Number(f.price), description: f.description || undefined, taxable: f.taxable, incomeAccount: f.incomeAccount || undefined }, `${f.name.trim()}`);
    setBusy(false); onClose();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QField label="Name" span><input value={f.name} onChange={set('name')} placeholder="CCTV — Camera Install (per camera)" style={qboInp} autoFocus /></QField>
        <QField label="Type" span><QSeg options={['Service', 'Non-inventory']} value={f.type} onChange={v => setF(p => ({ ...p, type: v }))} /></QField>
        <QField label="Sales price"><input type="number" inputMode="decimal" value={f.price} onChange={set('price')} placeholder="0.00" style={{ ...qboInp, fontFamily: 'var(--font-mono)' }} /></QField>
        <QField label="Taxable"><QSeg options={['No', 'Yes']} value={f.taxable ? 'Yes' : 'No'} onChange={v => setF(p => ({ ...p, taxable: v === 'Yes' }))} /></QField>
        <QField label="Income account" span>
          <input list="qbo-income" value={f.incomeAccount} onChange={set('incomeAccount')} placeholder={incomeAccts[0] ? incomeAccts[0].name : 'default income account'} style={qboInp} />
          <datalist id="qbo-income">{incomeAccts.map(a => <option key={a.qbo_id} value={a.name} />)}</datalist>
        </QField>
        <QField label="Description (shows on invoices)" span><textarea value={f.description} onChange={set('description')} rows={3} placeholder="Scope the customer sees" style={{ ...qboInp, resize: 'vertical' }} /></QField>
      </div>
      <QActions onCancel={onClose} onSubmit={submit} label="Add item" busy={busy} />
    </div>
  );
}

/* ── Standard low-voltage services (review → create) ── */
function QboSeedServices({ onClose }) {
  const existing = useQboList('items', 1000);
  const have = new Set(existing.map(i => String(i.name || '').trim().toLowerCase()));
  const [rows, setRows] = React.useState(() => QBO_SERVICE_CATALOG.map(([name, price, description]) => ({ name, price: String(price), description, on: true })));
  const [progress, setProgress] = React.useState(null); // {done, total, created, reused, failed}
  const todo = rows.filter(r => r.on && !have.has(r.name.toLowerCase()));
  const run = async () => {
    const q = window.__shieldQBO; if (!q || !q.createItem) { qboToast('Backend not configured', 'warn'); return; }
    const p = { done: 0, total: todo.length, created: 0, failed: 0, error: null };
    setProgress({ ...p });
    for (const r of todo) {
      const res = await q.createItem({ name: r.name, type: 'Service', price: r.price === '' ? undefined : Number(r.price), description: r.description });
      if (res && res.ok) p.created++;
      else { p.failed++; p.error = (res && res.error) || 'unknown'; if (q.notConnected && q.notConnected(res)) { setProgress({ ...p, done: p.done + 1, stopped: 'not-connected' }); break; } }
      p.done++; setProgress({ ...p });
    }
    try { window.dispatchEvent(new CustomEvent('qbo:changed', { detail: { entity: 'item' } })); } catch { /* noop */ }
  };
  const upd = (i, k, v) => setRows(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));
  if (progress) {
    const pct = progress.total ? Math.round(progress.done / progress.total * 100) : 100;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', background: 'var(--brand)', transition: 'width .2s' }} /></div>
        <div style={{ fontSize: 13 }}>{progress.done} of {progress.total} · <span style={{ color: 'var(--status-ok)' }}>{progress.created} created</span>{progress.failed ? <span style={{ color: 'var(--status-critical)' }}> · {progress.failed} failed</span> : ''}</div>
        {progress.stopped === 'not-connected' && <QNote>QuickBooks isn't connected yet — set the Intuit keys on qbo-sync, then run this again. Nothing was created.</QNote>}
        {progress.error && progress.stopped !== 'not-connected' && <QNote>Last error: {progress.error}</QNote>}
        {(progress.done >= progress.total || progress.stopped) && <QActions onCancel={onClose} onSubmit={onClose} label="Done" />}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <QNote>{have.size ? `${rows.filter(r => have.has(r.name.toLowerCase())).length} of these already exist in QuickBooks and are skipped. ` : ''}Untick anything you don't offer and set your prices — creating is one click, and names already in QuickBooks are reused.</QNote>
      <div style={{ maxHeight: '52vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((r, i) => { const dup = have.has(r.name.toLowerCase()); return (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 92px', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 8, background: r.on && !dup ? 'rgba(255,255,255,0.02)' : 'transparent', opacity: dup ? 0.45 : 1 }}>
            <input type="checkbox" checked={r.on && !dup} disabled={dup} onChange={e => upd(i, 'on', e.target.checked)} />
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}{dup ? ' · exists' : ''}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div></div>
            <input type="number" inputMode="decimal" value={r.price} disabled={dup} onChange={e => upd(i, 'price', e.target.value)} style={{ ...qboInp, padding: '6px 8px', fontSize: 12.5, fontFamily: 'var(--font-mono)', textAlign: 'right' }} />
          </div>
        ); })}
      </div>
      <QActions onCancel={onClose} onSubmit={run} label={`Create ${todo.length} service${todo.length === 1 ? '' : 's'} in QuickBooks`} disabled={todo.length === 0} />
    </div>
  );
}

/* Header button used by desktop Finance + mobile Money — one look everywhere. */
function QboNewButton({ compact }) {
  return (
    <button onClick={() => openQboNew('menu')} style={{ padding: compact ? '7px 12px' : '4px 12px', fontSize: compact ? 12 : 11, fontWeight: 700, borderRadius: compact ? 9 : 6, background: 'var(--brand)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ New</button>
  );
}

Object.assign(window, { QBO_NEW_CATALOG, QBO_SERVICE_CATALOG, openQboNew, qboPost, qboPostExpense, qboExpenseStores, QboNewMenu, QboNewButton, QboSurface, QboPaymentForm, QboExpenseForm, QboBillForm, QboBillPaymentForm, QboPartyForm, QboItemForm, QboSeedServices });

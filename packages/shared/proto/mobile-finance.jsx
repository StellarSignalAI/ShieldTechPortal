/* ShieldTech Mobile — Native Finance Suite
   Full-featured mobile finance: Overview · Invoices · Recurring · Estimates · Bills (AP) · Expenses · Reports
   Mirrors the desktop QuickBooks-replacement feature set in a touch-native layout. */

const FIN_RECURRING = [];
const FIN_BILLS = [];
const FIN_EXPENSES = [];
const FIN_STATUS = { paid:'var(--status-ok)', pending:'var(--status-warn)', overdue:'var(--status-critical)', draft:'var(--text-low)', sent:'var(--brand)', accepted:'var(--status-ok)', declined:'var(--status-critical)', active:'var(--status-ok)', past_due:'var(--status-critical)', due:'var(--status-warn)', scheduled:'var(--brand)', approved:'var(--status-ok)', reimbursed:'var(--brand)' };

const FinEmpty = ({ children }) => <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{children}</div>;

/* Patch an invoice by display row: portal rows are patched in place (both key
   shapes); QuickBooks mirror rows get a portal override row with the same doc
   number, which wins in the merge — same behavior as desktop saveDocEdit. */
function mUpdateInv(inv, patch) {
  const num = typeof inv === 'string' ? inv : inv.num;
  const exists = (invoiceStore.get() || []).some(r => (r.num || r.doc_number) === num);
  if (exists) { invoiceStore.set(prev => (prev || []).map(r => (r.num || r.doc_number) === num ? { ...r, ...patch } : r)); return; }
  const v = typeof inv === 'object' ? inv : { num, customer: 'Customer', amount: 0, lines: [] };
  invoiceStore.set(prev => [{
    qbo_id: 'local-edit-' + Date.now().toString(36), source: 'portal',
    doc_number: num, num, customer_name: v.customer, customer: v.customer,
    total: v.amount, amount: v.amount, lines: v.lines || [],
    due: v.due, terms: v.terms, status: v.status,
    txn_date: new Date().toISOString().slice(0, 10),
    ...patch,
  }, ...(prev || [])]);
}

/* Email the customer a REAL pay link via the invoice-pay backend (public
   page + Stripe checkout when connected); falls back to the outbox queue. */
async function mSendPayLink(inv, { finalize } = {}) {
  const email = window.prompt(`Email invoice ${inv.num} ($${inv.amount.toLocaleString()}) to:`, (inv._raw && inv._raw.customer_email) || '');
  if (email === null) return;
  if (finalize) {
    mUpdateInv(inv, { status: 'pending', sentAt: Date.now() });
    /* Hybrid QBO push (no-op until connected). */
    try {
      if (window.__shieldQBO && window.__shieldQBO.pushDoc && inv.source !== 'quickbooks') {
        window.__shieldQBO.pushDoc('invoice', inv._raw || inv).then(r => {
          if (r && r.ok) showToast(`${inv.num} recorded in QuickBooks`, 'ok');
        }).catch(() => {});
      }
    } catch { /* connect-later */ }
  }
  if (window.__shieldPay && email.includes('@')) {
    const r = await window.__shieldPay.createLink(inv, email.trim());
    if (r && r.ok) {
      mUpdateInv(inv, { payLink: r.link, payLinkSentAt: Date.now() });
      showToast(r.emailed
        ? `${inv.num} emailed with a live pay link${r.stripe ? ' (Stripe)' : ''}`
        : `Pay link created — email not sent (${r.emailError || 'no address'})`, 'ok');
      return;
    }
    showToast(`Pay backend unavailable — queued branded email instead`, 'warn');
  }
  const mail = buildInvoiceEmail(inv);
  if (email.includes('@')) mail.to = email.trim();
  mUpdateInv(inv, { payLink: mail.payLink, payLinkSentAt: Date.now() });
  queueEmail(mail);
}

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
  /* AR aging from the live merged invoice rows (portal + QuickBooks). */
  const invoices = useMergedInvoices();
  const open = invoices.filter(i => i.status !== 'paid' && i.status !== 'draft' && i.status !== 'void');
  const bucket = (lo, hi) => open.filter(i => { const d = Number(i.days) || 0; return d >= lo && (hi == null || d <= hi); }).reduce((s, i) => s + i.amount, 0);
  const ar = [['Current', bucket(0, 0), 'var(--status-ok)'], ['1–30', bucket(1, 30), 'var(--status-warn)'], ['31–60', bucket(31, 60), 'var(--status-critical)'], ['60+', bucket(61, null), '#c084fc']];
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

/* ── Invoices ──
   ONE shared source (useMergedInvoices in shared-state): portal-created rows
   merged with QuickBooks — the same rows every desktop screen shows. */
function FinInvoices() {
  const [filter, setFilter] = React.useState('All');
  const [openNum, setOpenNum] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const rows = useMergedInvoices();
  /* Apply completed payments (Stripe webhook / manual record) on mount. */
  React.useEffect(() => { if (window.__shieldPay) window.__shieldPay.applyPayments(); }, []);
  const list = filter === 'All' ? rows : rows.filter(i => i.status === filter.toLowerCase());
  const outstanding = rows.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + i.amount, 0);
  const overdue = rows.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['OUTSTANDING', `$${(outstanding / 1000).toFixed(1)}K`, null, 'var(--status-warn)'], ['OVERDUE', `$${(overdue / 1000).toFixed(1)}K`, null, 'var(--status-critical)']]} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, overflowX: 'auto' }}><MSegment options={['All', 'Paid', 'Pending', 'Overdue', 'Draft']} value={filter} onChange={setFilter} /></div>
        <button onClick={() => setCreating(true)} style={{ padding: '0 14px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>+</button>
      </div>
      {list.map(inv => (
        <div key={inv.num} onClick={() => setOpenNum(inv.num)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${FIN_STATUS[inv.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{inv.num}</span>
            <MBadge color={FIN_STATUS[inv.status]}>{inv.status}</MBadge>
            {inv.project_id && <MBadge color="var(--brand)">{inv.project_id}</MBadge>}
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>${inv.amount.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{inv.customer}</div>
          <div style={{ fontSize: 10, color: inv.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)' }}>{inv.status === 'overdue' ? `${inv.days}d overdue` : `due ${inv.due}`} · {inv.terms}</div>
        </div>
      ))}
      {list.length === 0 && <FinEmpty>No invoices yet — create one with +, or connect QuickBooks.</FinEmpty>}
      {openNum && !editing && <FinInvoiceDetail inv={rows.find(i => i.num === openNum)} onClose={() => setOpenNum(null)}
        onEdit={() => setEditing(rows.find(i => i.num === openNum))} />}
      {editing && <MDocEditor kind="invoice" doc={editing} onClose={() => { setEditing(null); setOpenNum(null); }} />}
      {creating && <MNewInvoiceSheet onClose={() => setCreating(false)} />}
    </div>
  );
}

/* Create an invoice from the mobile Money tab — persists to the shared store
   (same rows the desktop Finance suite and customer tabs render). */
function MNewInvoiceSheet({ onClose }) {
  const [f, setF] = React.useState({ customer: '', desc: '', amount: '', due: '' });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };
  const ok = f.customer.trim() && Number(f.amount) > 0;
  const save = () => {
    if (!ok) return;
    const amt = Number(f.amount) || 0;
    const rec = addInvoice({
      customer_name: f.customer.trim(), total: amt, due_date: f.due || null, status: 'open',
      lines: f.desc ? [{ desc: f.desc, qty: 1, rate: amt }] : null,
    });
    showToast(`Invoice ${rec.doc_number} created`, 'ok');
    onClose();
  };
  return (
    <MSheet title="New Invoice" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><span style={lbl}>Customer</span><input value={f.customer} onChange={set('customer')} placeholder="Customer name" style={inp} /></div>
        <div><span style={lbl}>Description</span><input value={f.desc} onChange={set('desc')} placeholder="Work / line item" style={inp} /></div>
        <div><span style={lbl}>Amount ($)</span><input type="number" value={f.amount} onChange={set('amount')} placeholder="0.00" style={inp} /></div>
        <div><span style={lbl}>Due date</span><input type="date" value={f.due} onChange={set('due')} style={inp} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} disabled={!ok} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.5, fontFamily: 'var(--font-body)' }}>Create Invoice</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Full document editor — invoices & estimates, touch-native ──
   Edits customer, dates, status and every line item; totals recompute live.
   Saves through saveDocEdit, so edits persist and override the QuickBooks
   mirror row on every screen (desktop included). */
function MDocEditor({ kind, doc, onClose }) {
  const isInv = kind === 'invoice';
  const raw = doc._raw || {};
  const STATUS_OPTS = isInv
    ? [['draft', 'Draft'], ['open', 'Pending'], ['paid', 'Paid'], ['overdue', 'Overdue']]
    : [['draft', 'Draft'], ['pending', 'Sent'], ['accepted', 'Accepted'], ['rejected', 'Declined']];
  const backMap = isInv ? { pending: 'open' } : { sent: 'pending', declined: 'rejected', expired: 'rejected' };
  const isoDate = (v) => (v && /^\d{4}-\d{2}-\d{2}/.test(String(v))) ? String(v).slice(0, 10) : '';
  const [f, setF] = React.useState(() => ({
    customer: doc.customer || '',
    date: isoDate(raw.txn_date),
    due: isoDate(raw.due_date),
    expires: isoDate(raw.expiration_date),
    status: backMap[doc.status] || (STATUS_OPTS.some(([v]) => v === doc.status) ? doc.status : STATUS_OPTS[1][0]),
    lines: (doc.lines && doc.lines.length)
      ? doc.lines.map(l => ({ desc: l.desc || '', qty: Number(l.qty) || 1, rate: Number(l.rate) || 0 }))
      : [{ desc: '', qty: 1, rate: Number(doc.amount) || 0 }],
  }));
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const setLine = (i, k, v) => setF(p => ({ ...p, lines: p.lines.map((l, ix) => ix === i ? { ...l, [k]: v } : l) }));
  const total = f.lines.reduce((s, l) => s + (Number(l.qty) || 1) * (Number(l.rate) || 0), 0);
  const inp = { width: '100%', padding: '12px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };
  const lineInp = (w) => ({ ...inp, padding: '9px 10px', fontSize: 13, width: w, borderRadius: 9 });
  const save = () => {
    if (!f.customer.trim()) { showToast('Enter a customer name', 'warn'); return; }
    saveDocEdit(kind, { num: doc.num, customer: f.customer.trim(), date: f.date, due: f.due, expires: f.expires, status: f.status, lines: f.lines, total });
    showToast(`${doc.num} saved`, 'ok');
    onClose(true);
  };
  return (
    <MSheet title={`Edit ${doc.num}`} onClose={() => onClose(false)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><span style={lbl}>Customer</span><input value={f.customer} onChange={set('customer')} style={inp} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><span style={lbl}>{isInv ? 'Invoice date' : 'Created'}</span><input type="date" value={f.date} onChange={set('date')} style={inp} /></div>
          <div><span style={lbl}>{isInv ? 'Due date' : 'Expires'}</span><input type="date" value={isInv ? f.due : f.expires} onChange={set(isInv ? 'due' : 'expires')} style={inp} /></div>
        </div>
        <div>
          <span style={lbl}>Status</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_OPTS.map(([v, label]) => (
              <button key={v} onClick={() => setF(p => ({ ...p, status: v }))} style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: f.status === v ? 'rgba(63,169,245,0.16)' : 'transparent', border: `1px solid ${f.status === v ? 'var(--brand)' : 'var(--border-subtle)'}`, color: f.status === v ? 'var(--brand)' : 'var(--text-low)' }}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <span style={lbl}>Line items</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {f.lines.map((l, i) => (
              <div key={i} className="glass" style={{ padding: '10px 10px', borderRadius: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <input value={l.desc} onChange={e => setLine(i, 'desc', e.target.value)} placeholder="Description" style={{ ...lineInp('100%') }} />
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <input type="number" inputMode="decimal" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)} placeholder="Qty" style={lineInp(64)} />
                  <span style={{ color: 'var(--text-low)', fontSize: 12 }}>×</span>
                  <input type="number" inputMode="decimal" value={l.rate} onChange={e => setLine(i, 'rate', e.target.value)} placeholder="Rate" style={{ ...lineInp(0), flex: 1 }} />
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)', whiteSpace: 'nowrap' }}>${((Number(l.qty) || 1) * (Number(l.rate) || 0)).toLocaleString()}</span>
                  {f.lines.length > 1 && <button onClick={() => setF(p => ({ ...p, lines: p.lines.filter((_, ix) => ix !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--status-critical)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>✕</button>}
                </div>
              </div>
            ))}
            <button onClick={() => setF(p => ({ ...p, lines: [...p.lines, { desc: '', qty: 1, rate: 0 }] }))} style={{ padding: '10px 0', borderRadius: 10, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add line item</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 11 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)' }}>TOTAL</span>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high)' }}>${total.toLocaleString()}</span>
        </div>
        {doc.source === 'quickbooks' && <div style={{ fontSize: 10, color: 'var(--text-low)', lineHeight: 1.5 }}>This is a QuickBooks record — your edit saves a portal version that takes precedence on every screen. QuickBooks itself is untouched until write-back sync.</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onClose(false)} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save changes</button>
        </div>
      </div>
    </MSheet>
  );
}

function FinInvoiceDetail({ inv, onClose, onEdit }) {
  const [projects] = useShieldStore(projectStore);
  if (!inv) return null;
  return (
    <MSheet title={inv.num} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div><div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-high)' }}>${inv.amount.toLocaleString()}</div><div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{inv.customer}</div></div>
          <MBadge color={FIN_STATUS[inv.status]}>{inv.status}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Due', inv.due], ['Terms', inv.terms], ['Source', inv.source || 'portal'], ['Lines', (inv.lines || []).length]].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '7px 10px' }}><div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{k}</div><div className="mono" style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{v}</div></div>
          ))}
        </div>
        {/* Project attachment — invoices ↔ projects, both directions (parity with desktop) */}
        {inv.project_id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '9px 12px' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', letterSpacing: '0.06em' }}>PROJECT</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{inv.project_id}</span>
            <span style={{ fontSize: 11, color: 'var(--text-low)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{((projects || []).find(p => p.number === inv.project_id) || {}).name || ''}</span>
          </div>
        ) : (projects || []).length > 0 && (
          <select defaultValue="" onChange={e => {
            const num = e.target.value; if (!num) return;
            attachInvoiceToProject(num, inv.num);
            showToast(`${inv.num} attached to ${num}`, 'ok');
            onClose();
          }} style={{ width: '100%', padding: '10px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-mid)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            <option value="">Attach to a project…</option>
            {(projects || []).map(p => <option key={p.number} value={p.number}>{p.number} — {p.name}</option>)}
          </select>
        )}
        <MSection title="Line items">
          {(inv.lines || []).map((li, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{li.desc}</span>
              {li.qty > 1 && <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{li.qty}×${li.rate}</span>}
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>${(li.qty * li.rate).toLocaleString()}</span>
            </div>
          ))}
        </MSection>
        {/* REAL actions — same store writes as the desktop Invoices tab */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {inv.status === 'draft' && <button onClick={() => { mSendPayLink(inv, { finalize: true }); onClose(); }} style={finBtnPrimary}>Finalize & Send</button>}
          {inv.status === 'pending' && <>
            <button onClick={() => mSendPayLink(inv)} style={finBtnSecondary}>⊛ {inv._raw && inv._raw.payLink ? 'Pay Link Active ✓ — resend' : 'Create & Email Pay Link'}</button>
            <button onClick={() => { mUpdateInv(inv, { status: 'paid', balance: 0, days: 0, paidAt: Date.now() }); if (window.__shieldPay) window.__shieldPay.recordPaid(inv.num); showToast(`Payment recorded — ${inv.num} marked paid`, 'ok'); onClose(); }} style={finBtnSuccess}>Record Payment</button>
          </>}
          {inv.status === 'overdue' && <>
            <button onClick={() => { approvalStore.set(prev => [{ id: (prev || []).reduce((m, a) => Math.max(m, a.id), 0) + 1, kind: 'AR REMINDER', title: `${inv.customer} — ${inv.num} reminder (${inv.days}d overdue)`, amt: `$${inv.amount.toLocaleString()}`, sub: 'AI-drafted · review before sending', status: 'pending' }, ...(prev || [])]); showToast(`Reminder drafted for ${inv.num} → Approvals`, 'ok'); }} style={finBtnSecondary}>⟡ AI Draft Reminder</button>
            <button onClick={() => mSendPayLink(inv)} style={finBtnPrimary}>Send Payment Link</button>
          </>}
          <div style={{ display: 'flex', gap: 7 }}>
            {onEdit && <button onClick={onEdit} style={{ ...finBtnGhost, color: 'var(--brand)', borderColor: 'var(--border-strong)' }}>✎ Edit</button>}
            <button onClick={() => { if (window.__shieldPdf) window.__shieldPdf.exportDoc({ kind: 'invoice', number: inv.num, date: inv.due, customer: inv.customer, meta: [{ k: 'Terms', v: inv.terms || '' }], lineItems: inv.lines || [], total: inv.amount }); else showToast('PDF export unavailable'); }} style={finBtnGhost}>PDF</button>
            <button onClick={() => { const num = window.nextDocNumber('invoice'); invoiceStore.set(prev => [{ ...(inv._raw || inv), num, doc_number: num, qbo_id: 'local-' + Date.now().toString(36), status: 'draft', due: '—', days: 0, payLink: null, payLinkSentAt: null, paidAt: null }, ...(prev || [])]); showToast(`Duplicated as ${num} (draft)`, 'ok'); onClose(); }} style={finBtnGhost}>Duplicate</button>
            {inv.status !== 'paid' && <button onClick={() => { mUpdateInv(inv, { status: 'void', days: 0 }); showToast(`${inv.num} voided`, 'warn'); onClose(); }} style={{ ...finBtnGhost, color: 'var(--status-critical)' }}>Void</button>}
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

/* ── Estimates ──
   Live rows (portal + QuickBooks merged) with the full acceptance → project
   workflow on touch: accept manually, or email the customer an acceptance
   link; either path creates a project with the quote attached (parity with
   the desktop Estimates tab). */
function FinEstimates({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [editing, setEditing] = React.useState(null);
  const merged = useMergedEstimates();
  const [projects] = useShieldStore(projectStore);
  const [acceptances, setAcceptances] = React.useState([]);

  const refreshAcceptances = React.useCallback(() => {
    const api = window.__shieldAcceptance;
    if (!api) return;
    api.list().then(r => { if (r && r.ok) setAcceptances(r.data); });
  }, []);
  React.useEffect(() => {
    // Apply customer email-acceptances that landed since last visit, then load
    // acceptance state for the "awaiting customer" badges.
    Promise.resolve(typeof applyEstimateAcceptances === 'function' ? applyEstimateAcceptances() : null)
      .then(() => refreshAcceptances());
  }, [refreshAcceptances]);

  const rows = React.useMemo(() => merged.map(m => {
    const proj = (projects || []).find(p => (p.estimateRefs || []).includes(m.num)) || null;
    const acc = acceptances.find(a => a.estimate_ref === m.num) || null;
    const accepted = m.status === 'accepted' || !!proj || (acc && acc.status === 'accepted');
    return {
      ...m,
      display: accepted ? 'accepted' : (m.status === 'expired' ? 'declined' : (m.status === 'draft' ? 'draft' : 'sent')),
      project: proj,
      awaiting: !accepted && acc && acc.status === 'pending',
    };
  }), [merged, projects, acceptances]);

  const doAccept = (row) => {
    const proj = acceptEstimateToProject(row._raw, 'manual');
    showToast(`${row.num} accepted — project ${proj.number} created with the quote attached`, 'ok');
  };
  const doEmailAccept = async (row) => {
    const email = window.prompt(`Send acceptance request for ${row.num} ($${row.amount.toLocaleString()}) to which customer email?`, '');
    if (!email || !email.includes('@')) { if (email !== null) showToast('Enter a valid email address', 'warn'); return; }
    const api = window.__shieldAcceptance;
    if (!api) { showToast('Acceptance backend not configured', 'warn'); return; }
    const r = await api.send({
      estimateRef: row.num, estimateQboId: row.qboId,
      customerName: row.customer, customerEmail: email.trim(), amount: row.amount,
    });
    if (r && r.ok) {
      showToast(r.data.emailed
        ? `Acceptance email for ${row.num} sent to ${email.trim()}`
        : `Acceptance link created (email not sent: ${r.data.emailError})`, 'ok');
      refreshAcceptances();
    } else showToast(`Could not create acceptance request: ${(r && r.error) || 'unknown error'}`, 'error');
  };

  const list = filter === 'All' ? rows : rows.filter(e => e.display === filter.toLowerCase());
  const outstanding = rows.filter(e => e.display === 'sent').reduce((s, e) => s + e.amount, 0);
  const wonCount = rows.filter(e => e.display === 'accepted').length;
  const actBtn = (bg, border, color) => ({ padding: '7px 12px', background: bg, border, borderRadius: 8, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FinKpis items={[['AWAITING ACCEPT', `$${(outstanding / 1000).toFixed(0)}K`, null, 'var(--brand)'], ['ACCEPTED', wonCount, `of ${rows.length} estimates`, 'var(--status-ok)']]} />
      <MSegment options={['All', 'Draft', 'Sent', 'Accepted', 'Declined']} value={filter} onChange={setFilter} />
      {list.map(e => (
        <div key={e.num} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${FIN_STATUS[e.display]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{e.num}</span>
            <MBadge color={FIN_STATUS[e.display]}>{e.display}</MBadge>
            {e.awaiting && <span style={{ fontSize: 9, color: 'var(--status-warn)' }}>✉ awaiting customer</span>}
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${e.amount.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{e.customer}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 8 }}>created {e.date} · expires {e.expires}</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={() => setEditing(e)} style={actBtn('rgba(63,169,245,0.06)', '1px solid var(--border-subtle)', 'var(--brand)')}>✎ Edit</button>
            {e.display !== 'accepted' && <>
              <button onClick={() => doAccept(e)} style={actBtn('rgba(52,211,153,0.08)', '1px solid rgba(52,211,153,0.25)', 'var(--status-ok)')}>✓ Accept → Project</button>
              <button onClick={() => doEmailAccept(e)} style={actBtn('rgba(63,169,245,0.06)', '1px solid var(--border-subtle)', 'var(--brand)')}>✉ Email accept link</button>
            </>}
            {e.display === 'accepted' && (e.project
              ? <button onClick={() => onNav && onNav('projects')} style={actBtn('rgba(63,169,245,0.06)', '1px solid var(--border-subtle)', 'var(--brand)')}>→ {e.project.number}{e.project.name ? ` · ${e.project.name.slice(0, 24)}` : ''}</button>
              : <button onClick={() => doAccept(e)} style={actBtn('rgba(52,211,153,0.08)', '1px solid rgba(52,211,153,0.25)', 'var(--status-ok)')}>→ Create Project</button>)}
          </div>
        </div>
      ))}
      {list.length === 0 && <FinEmpty>No estimates yet.</FinEmpty>}
      {editing && <MDocEditor kind="estimate" doc={editing} onClose={() => setEditing(null)} />}
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
  const tabs = ['Overview', 'AI Queue', 'Invoices', 'Recurring', 'Proposals', 'Bills', 'Expenses', 'Sales Tax', 'Lending', 'Reports', 'More'];
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
      {tab === 'Proposals' && <FinEstimates onNav={onNav} />}
      {tab === 'Bills' && <FinBills />}
      {tab === 'Expenses' && <FinExpenses />}
      {tab === 'Sales Tax' && <MFinSalesTax />}
      {tab === 'Lending' && <MFinLending />}
      {tab === 'Reports' && <FinReports />}
      {tab === 'More' && <MFinMore onNav={onNav} />}
    </div>
  );
}

const finBtnPrimary = { width: '100%', padding: '11px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };
const finBtnSecondary = { width: '100%', padding: '11px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };
const finBtnSuccess = { width: '100%', padding: '11px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, color: 'var(--status-ok)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' };
const finBtnGhost = { flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' };

Object.assign(window, { MFinance, MDocEditor });

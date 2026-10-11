/* Customer portal — money and service, the way a customer expects from a
   modern service company: see what you owe, pay it from your phone, approve a
   quote with a signature, book a visit. Everything is scoped to the signed-in
   company and every decision reaches the office as a real record (shared
   stores + a support ticket), never a local-only flip.

   Company resolution: profiles carry no company column, so the company is
   worked out from the account email against the customer registry (customer
   email, billing email, or a contact on the customer card) and published on
   window.__shieldUser.company so tickets, photos and the OS views all agree. */

const cpMoney = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cpDate = (d) => { if (!d) return '—'; const t = typeof d === 'number' ? d : Date.parse(String(d).length === 10 ? d + 'T00:00:00' : d); return isNaN(t) ? String(d) : new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); };
const cpIso = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const cpBtn = (kind = 'primary', small) => ({ fontFamily: 'var(--font-body)', padding: small ? '7px 12px' : '10px 16px', borderRadius: 8, fontSize: small ? 12 : 13.5, fontWeight: 600, cursor: 'pointer', border: '1px solid transparent', background: kind === 'primary' ? 'var(--brand)' : kind === 'soft' ? 'var(--brand-tint-12)' : kind === 'danger' ? 'var(--critical-tint-12)' : 'transparent', color: kind === 'primary' ? '#fff' : kind === 'soft' ? 'var(--brand)' : kind === 'danger' ? 'var(--status-critical)' : 'var(--text-high)', borderColor: kind === 'ghost' ? 'var(--border-strong)' : 'transparent', whiteSpace: 'nowrap' });
const cpCardStyle = { background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 10 };
const cpLower = (s) => String(s || '').trim().toLowerCase();

/* Resolve the signed-in customer's company from the registry. */
function cpResolveCompany(custs, contacts) {
  const u = window.__shieldUser || {};
  if (u.company) return u.company;
  const email = cpLower(u.email);
  if (!email) return '';
  const byEmail = (custs || []).find(c => [c.email, c.billingEmail, c.contactEmail].map(cpLower).includes(email));
  if (byEmail) return byEmail.name;
  const m = contacts || {};
  for (const id of Object.keys(m)) {
    if ((m[id] || []).some(p => cpLower(p.email) === email)) { const c = (custs || []).find(x => String(x.id) === String(id)); if (c) return c.name; }
  }
  const domain = email.split('@')[1];
  if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'me.com', 'aol.com'].includes(domain)) {
    const byDomain = (custs || []).find(c => cpLower(c.website).includes(domain) || cpLower(c.email).endsWith('@' + domain));
    if (byDomain) return byDomain.name;
  }
  return '';
}
function useCuCompany() {
  const [custs] = useShieldStore(customerStore);
  const [contacts] = useShieldStore(contactsStore);
  /* auth.js republishes window.__shieldUser on every session change (and
     replaces the object), so re-resolve whenever it fires. */
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => { const fn = () => setTick(t => t + 1); window.addEventListener('shield:auth', fn); return () => window.removeEventListener('shield:auth', fn); }, []);
  const company = React.useMemo(() => cpResolveCompany(custs, contacts), [custs, contacts, tick]);
  React.useEffect(() => { if (company && window.__shieldUser && window.__shieldUser.company !== company) { window.__shieldUser.company = company; try { window.dispatchEvent(new CustomEvent('shield:company', { detail: { company } })); } catch {} } }, [company]);
  return company;
}
const cpSameCo = (a, b) => cpLower(a) === cpLower(b);

function CpTile({ label, value, sub, tone, onClick }) {
  return <div onClick={onClick} style={{ ...cpCardStyle, flex: '1 1 0', minWidth: 140, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default' }}><div style={{ fontSize: 11.5, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color: tone === 'ok' ? 'var(--status-ok)' : tone === 'warn' ? 'var(--status-warn)' : tone === 'crit' ? 'var(--status-critical)' : 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>{sub && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>}</div>;
}
function CpStatus({ s }) {
  const map = { paid: ['Paid', 'var(--status-ok)', 'var(--ok-tint-12)'], overdue: ['Overdue', 'var(--status-critical)', 'var(--critical-tint-12)'], pending: ['Due', 'var(--status-warn)', 'var(--warn-tint-12)'], draft: ['Draft', 'var(--text-low)', 'var(--border-subtle)'], void: ['Void', 'var(--text-low)', 'var(--border-subtle)'], sent: ['Awaiting your approval', 'var(--status-warn)', 'var(--warn-tint-12)'], accepted: ['Approved', 'var(--status-ok)', 'var(--ok-tint-12)'], expired: ['Declined / expired', 'var(--text-low)', 'var(--border-subtle)'], requested: ['Requested', 'var(--status-warn)', 'var(--warn-tint-12)'], scheduled: ['Scheduled', 'var(--brand)', 'var(--brand-tint-12)'], open: ['Scheduled', 'var(--brand)', 'var(--brand-tint-12)'], completed: ['Completed', 'var(--status-ok)', 'var(--ok-tint-12)'], 'in-progress': ['In progress', 'var(--brand)', 'var(--brand-tint-12)'] };
  const [l, c, bg] = map[s] || [s, 'var(--text-mid)', 'var(--border-subtle)'];
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: c, background: bg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{l}</span>;
}
function CpSheet({ title, sub, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--modal)', borderRadius: '16px 16px 0 0', color: 'var(--text-high)' }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 10 }}><div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>{sub && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>}</div><button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕</button></div>
        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>{children}</div>
        {footer && <div style={{ padding: '10px 18px calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}
function CpLines({ lines, total }) {
  const rows = (lines || []).map(l => ({ desc: l.desc || l.Description || 'Item', qty: Number(l.qty) || 1, rate: Number(l.rate) || 0 }));
  const sum = rows.reduce((s, l) => s + l.qty * l.rate, 0);
  return (
    <div style={{ ...cpCardStyle, overflow: 'hidden' }}>
      {!rows.length && <div style={{ padding: 14, fontSize: 12, color: 'var(--text-mid)' }}>Line items are on the document itself.</div>}
      {rows.map((l, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '9px 14px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', fontSize: 13 }}><span><span style={{ display: 'block' }}>{l.desc}</span>{l.qty > 1 && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{l.qty} × {cpMoney(l.rate)}</span>}</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{cpMoney(l.qty * l.rate)}</span></div>)}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: 14, fontWeight: 700, background: 'var(--canvas)' }}><span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{cpMoney(total != null ? total : sum)}</span></div>
    </div>
  );
}
async function cpTicket(subject, description, category = 'billing', priority = 'medium') {
  const t = window.__shieldTickets;
  if (!t) return { ok: false, error: 'Support backend not configured', local: true };
  try { const r = await t.create({ subject, description, category, priority }); return r; } catch (e) { return { ok: false, error: String(e) }; }
}
function cpApproval(kind, title, detail, amount, ref) {
  const u = window.__shieldUser || {};
  try { approvalStore.set(list => [{ id: genId('APR'), kind, title, detail, amount: Number(amount) || 0, ref: ref || '', customer: u.company || '', by: u.name || u.email || 'Customer', status: 'pending', source: 'customer', createdAt: Date.now() }, ...(list || [])]); } catch {}
}
function cpExport(kind, d) {
  const pdf = window.__shieldPdf;
  if (!pdf || !pdf.exportDoc) { shieldToast('Printing is not available here — use the pay page link', 'warn'); return; }
  pdf.exportDoc({ kind, number: d.num, date: d.date || d.due || cpIso(), customer: d.customer, to: [d.customer], meta: [{ k: kind === 'invoice' ? 'Due' : 'Expires', v: cpDate(d.due || d.expires) }, { k: 'Status', v: d.status }], lineItems: d.lines || [], total: d.amount });
}

/* ── Invoices ── */
function useCuInvoices(company) {
  const merged = useMergedInvoices();
  const [links, setLinks] = React.useState({ loading: true, rows: [] });
  const refresh = React.useCallback(() => {
    const sb = window.__shieldSupabase;
    if (!sb) { setLinks({ loading: false, rows: [] }); return; }
    sb.from('invoice_links').select('id, invoice_ref, customer_name, amount, due_date, status, paid_at, token, lines, created_at').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setLinks({ loading: false, rows: data || [] })).catch(() => setLinks({ loading: false, rows: [] }));
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  const rows = React.useMemo(() => {
    const out = new Map();
    (links.rows || []).forEach(r => out.set(r.invoice_ref, { num: r.invoice_ref, customer: r.customer_name || company, amount: Number(r.amount) || 0, status: r.status === 'paid' ? 'paid' : (r.due_date && r.due_date < cpIso() ? 'overdue' : 'pending'), due: r.due_date, paidAt: r.paid_at, token: r.token, lines: Array.isArray(r.lines) ? r.lines : [], source: 'link' }));
    (merged || []).filter(m => company && cpSameCo(m.customer, company)).forEach(m => { const cur = out.get(m.num); if (cur) { if (!cur.lines.length) cur.lines = m.lines || []; if (m.status === 'paid') cur.status = 'paid'; cur.due = cur.due || (m._raw && m._raw.due_date) || null; return; } out.set(m.num, { num: m.num, customer: m.customer, amount: m.amount, status: m.status, due: (m._raw && m._raw.due_date) || m.due, token: null, lines: m.lines || [], source: m.source }); });
    return [...out.values()].filter(r => r.status !== 'draft' && r.status !== 'void').sort((a, b) => (a.status === 'paid') - (b.status === 'paid') || String(a.due || '').localeCompare(String(b.due || '')));
  }, [links.rows, merged, company]);
  return [rows, links.loading, refresh];
}
function cpPayUrl(inv) { const base = (window.__shieldSupabaseUrl || '').replace(/\/+$/, ''); return inv.token && base ? `${base}/functions/v1/invoice-pay?token=${inv.token}` : null; }

function CuInvoicesView({ company }) {
  const [rows, loading, refresh] = useCuInvoices(company);
  const [sel, setSel] = React.useState(null);
  const [f, setF] = React.useState('open');
  const open = rows.filter(r => r.status !== 'paid');
  const outstanding = open.reduce((s, r) => s + r.amount, 0);
  const overdue = open.filter(r => r.status === 'overdue');
  const yr = new Date().getFullYear();
  const paidYtd = rows.filter(r => r.status === 'paid' && (!r.paidAt || new Date(r.paidAt).getFullYear() === yr)).reduce((s, r) => s + r.amount, 0);
  const nextDue = open.map(r => r.due).filter(Boolean).sort()[0];
  const list = f === 'open' ? open : f === 'paid' ? rows.filter(r => r.status === 'paid') : rows;
  const requestLink = async (inv) => { cpApproval('PAY LINK REQUEST', `Pay link for ${inv.num}`, `${company} asked to pay ${inv.num} online from the customer portal.`, inv.amount, inv.num); const r = await cpTicket(`Pay online · ${inv.num}`, `${company} wants to pay invoice ${inv.num} (${cpMoney(inv.amount)}) online. Please send a secure pay link.`, 'billing', 'medium'); shieldToast(r.ok ? `Request ${r.data.ref} sent — a secure pay link will arrive by email` : 'Request logged for the office', 'ok'); };
  const question = async (inv) => shieldModal({ kind: 'form', title: `Question about ${inv.num}`, submitLabel: 'Send', fields: [{ key: 'q', label: 'Your question', required: true, full: true }], onSubmit: async (v) => { const r = await cpTicket(`Question about ${inv.num}`, v.q, 'billing', 'medium'); shieldToast(r.ok ? `Sent — ticket ${r.data.ref}` : 'Logged for the office', 'ok'); } });
  const payLabel = (inv) => inv.status === 'paid' ? 'View' : cpPayUrl(inv) ? `Pay ${cpMoney(inv.amount)}` : 'Pay online';
  const pay = (inv) => { const u = cpPayUrl(inv); if (u) window.open(u, '_blank', 'noopener'); else requestLink(inv); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <CpTile label="Balance due" value={cpMoney(outstanding)} tone={overdue.length ? 'crit' : outstanding ? 'warn' : 'ok'} sub={overdue.length ? `${overdue.length} overdue` : open.length ? `${open.length} open` : 'nothing due'} />
        <CpTile label="Next due" value={nextDue ? cpDate(nextDue) : '—'} sub={nextDue ? open.find(r => r.due === nextDue).num : ''} />
        <CpTile label={`Paid ${yr}`} value={cpMoney(paidYtd)} tone="ok" />
        <CpTile label="Autopay" value="Off" sub="ask us to set up ACH autopay" onClick={async () => { const r = await cpTicket('Set up autopay', `${company} wants ACH / card autopay for recurring invoices.`, 'billing', 'low'); shieldToast(r.ok ? `Request ${r.data.ref} sent` : 'Logged for the office', 'ok'); }} />
      </div>
      {outstanding > 0 && <div style={{ ...cpCardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderColor: 'var(--brand)' }}><div style={{ flex: 1, minWidth: 200 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{cpMoney(outstanding)} open across {open.length} invoice{open.length === 1 ? '' : 's'}</div><div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>Pay by card or bank from your phone. Each invoice has its own secure pay page.</div></div><button onClick={() => pay(open[0])} style={cpBtn('primary')}>{payLabel(open[0])}</button></div>}
      <div style={{ display: 'flex', gap: 6 }}>{[['open', 'Open', open.length], ['paid', 'Paid', rows.length - open.length], ['all', 'All', rows.length]].map(([id, l, n]) => <button key={id} onClick={() => setF(id)} style={{ fontFamily: 'var(--font-body)', padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: f === id ? 'var(--brand)' : 'var(--card)', color: f === id ? '#fff' : 'var(--text-mid)', border: `1px solid ${f === id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer' }}>{l} {n}</button>)}</div>
      <div style={{ ...cpCardStyle, overflow: 'hidden' }}>
        {loading && !rows.length && <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)' }}>Loading invoices…</div>}
        {!loading && !list.length && <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)' }}>{f === 'open' ? 'Nothing due. Invoices we send you appear here with secure online payment.' : 'No invoices here yet.'}</div>}
        {list.map((inv, i) => (
          <div key={inv.num} onClick={() => setSel(inv)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '12px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
            <div style={{ minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand)' }}>{inv.num}</span><CpStatus s={inv.status} /></div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 3 }}>{inv.status === 'paid' ? `Paid ${cpDate(inv.paidAt)}` : inv.due ? `Due ${cpDate(inv.due)}` : 'Due on receipt'}{inv.lines && inv.lines.length ? ` · ${inv.lines.length} line${inv.lines.length === 1 ? '' : 's'}` : ''}</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{cpMoney(inv.amount)}</span><button onClick={(e) => { e.stopPropagation(); if (inv.status === 'paid') setSel(inv); else pay(inv); }} style={cpBtn(inv.status === 'paid' ? 'ghost' : 'primary', true)}>{payLabel(inv)}</button></div>
          </div>))}
      </div>
      {sel && (
        <CpSheet title={sel.num} sub={`${sel.customer} · ${sel.status === 'paid' ? `paid ${cpDate(sel.paidAt)}` : sel.due ? `due ${cpDate(sel.due)}` : 'due on receipt'}`} onClose={() => setSel(null)} footer={<React.Fragment>
          {sel.status !== 'paid' && <button onClick={() => pay(sel)} style={{ ...cpBtn('primary'), flex: 1 }}>{payLabel(sel)}</button>}
          <button onClick={() => cpExport('invoice', sel)} style={cpBtn('ghost')}>Download PDF</button>
          <button onClick={() => question(sel)} style={cpBtn('ghost')}>Ask a question</button>
        </React.Fragment>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><CpStatus s={sel.status} /><span style={{ fontSize: 24, fontWeight: 700, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{cpMoney(sel.amount)}</span></div>
          <CpLines lines={sel.lines} total={sel.amount} />
          {sel.status !== 'paid' && !cpPayUrl(sel) && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 12, lineHeight: 1.6 }}>This invoice does not have an online pay page yet. "Pay online" asks ShieldTech for a secure link; it arrives by email within the business day. You can also remit by check or ACH per your terms.</div>}
          {sel.status === 'paid' && <div style={{ fontSize: 12, color: 'var(--status-ok)', marginTop: 12 }}>✓ Payment received. Thank you.</div>}
        </CpSheet>)}
    </div>
  );
}

/* ── Quotes (approve with a signature, decline, ask) ── */
function CuQuotesView({ company, onBook }) {
  const merged = useMergedEstimates();
  const [, setEst] = useShieldStore(estimateStore);
  const [sel, setSel] = React.useState(null);
  const [f, setF] = React.useState('open');
  const rows = React.useMemo(() => (merged || []).filter(m => company && cpSameCo(m.customer, company) && m.status !== 'draft').map(m => ({ ...m, title: (m._raw && (m._raw.title || m._raw.name)) || '', intro: m._raw && m._raw.intro, memo: m._raw && (m._raw.memo || m._raw.notes), deposit: m._raw && m._raw.deposit, signatureUrl: m._raw && m._raw.signatureUrl, decidedAt: m._raw && (m._raw.acceptedAt || m._raw.declinedAt) })), [merged, company]);
  const open = rows.filter(r => r.status === 'sent');
  const list = f === 'open' ? open : f === 'decided' ? rows.filter(r => r.status !== 'sent') : rows;
  const patch = (num, p) => setEst(list => (list || []).map(e => (e.doc_number || e.num) === num ? { ...e, ...p } : e));
  const u = window.__shieldUser || {};
  const approve = (q) => shieldModal({ kind: 'signature', title: `Approve ${q.num}`, subtitle: `${cpMoney(q.amount)} · ${q.title || company}`, signPrompt: 'Sign to approve this quote. Your signature authorises ShieldTech to schedule the work.', submitLabel: 'Approve & sign', successMsg: 'Approved — we will schedule it and confirm', onSave: async (dataUrl) => {
    let url = null;
    try { if (dataUrl && window.__shieldStorage) { const r = await window.__shieldStorage.uploadDataUrl(dataUrl, { folder: 'signatures', entity: 'estimate', entityId: q.num, name: `signature-${q.num}.png`, shared: true }); url = r && r.url; } } catch {}
    try { if (typeof acceptEstimateToProject === 'function' && q._raw && q.source !== 'quickbooks') acceptEstimateToProject(q._raw, 'customer-portal'); } catch {}
    patch(q.num, { status: 'accepted', acceptedAt: Date.now(), acceptedBy: u.name || u.email || 'Customer', signatureUrl: url || dataUrl || null });
    cpApproval('QUOTE APPROVED', `${q.num} approved by ${u.name || 'customer'}`, `${company} approved ${q.num} (${cpMoney(q.amount)}) in the customer portal with a signature.`, q.amount, q.num);
    const r = await cpTicket(`APPROVED: ${q.num}`, `${u.name || 'Customer'} at ${company} approved quote ${q.num} for ${cpMoney(q.amount)} with a signature. Please schedule.`, 'billing', 'high');
    if (r.ok) shieldToast(`Approval ${r.data.ref} sent to ShieldTech`, 'ok');
    setSel(null);
    return { ok: true };
  } });
  const decline = (q) => shieldModal({ kind: 'form', title: `Decline ${q.num}`, submitLabel: 'Decline', fields: [{ key: 'why', label: 'Anything we should know? (optional)', full: true }], onSubmit: async (v) => { patch(q.num, { status: 'rejected', declinedAt: Date.now(), declineReason: v.why || '' }); cpApproval('QUOTE DECLINED', `${q.num} declined`, v.why || 'No reason given.', q.amount, q.num); const r = await cpTicket(`DECLINED: ${q.num}`, `${company} declined quote ${q.num}.${v.why ? ` Reason: ${v.why}` : ''}`, 'billing', 'medium'); shieldToast(r.ok ? `Sent — your account manager will follow up` : 'Logged for the office', 'ok'); setSel(null); } });
  const ask = (q) => shieldModal({ kind: 'form', title: `Question about ${q.num}`, submitLabel: 'Send', fields: [{ key: 'q', label: 'Your question', required: true, full: true }], onSubmit: async (v) => { const r = await cpTicket(`Question about ${q.num}`, v.q, 'billing', 'medium'); shieldToast(r.ok ? `Sent — ticket ${r.data.ref}` : 'Logged for the office', 'ok'); } });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <CpTile label="Awaiting your approval" value={open.length} tone={open.length ? 'warn' : undefined} sub={open.length ? cpMoney(open.reduce((s, r) => s + r.amount, 0)) : 'nothing waiting'} />
        <CpTile label="Approved" value={rows.filter(r => r.status === 'accepted').length} tone="ok" />
        <CpTile label="Need something quoted?" value="Request" sub="site walk or a quick estimate" onClick={onBook} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{[['open', 'Open', open.length], ['decided', 'Decided', rows.length - open.length], ['all', 'All', rows.length]].map(([id, l, n]) => <button key={id} onClick={() => setF(id)} style={{ fontFamily: 'var(--font-body)', padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: f === id ? 'var(--brand)' : 'var(--card)', color: f === id ? '#fff' : 'var(--text-mid)', border: `1px solid ${f === id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer' }}>{l} {n}</button>)}</div>
      <div style={{ ...cpCardStyle, overflow: 'hidden' }}>
        {!list.length && <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)' }}>{f === 'open' ? 'No quotes waiting on you. New quotes from ShieldTech land here for one-tap approval.' : 'Nothing here yet.'}</div>}
        {list.map((q, i) => (
          <div key={q.num} onClick={() => setSel(q)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '12px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
            <div style={{ minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand)' }}>{q.num}</span><CpStatus s={q.status} /></div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title || (q.lines && q.lines[0] && q.lines[0].desc) || 'Quote'}</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{q.date ? `Sent ${cpDate(q.date)}` : ''}{q.expires ? ` · expires ${cpDate(q.expires)}` : ''}</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{cpMoney(q.amount)}</span>{q.status === 'sent' && <button onClick={(e) => { e.stopPropagation(); approve(q); }} style={cpBtn('primary', true)}>Approve</button>}</div>
          </div>))}
      </div>
      {sel && (
        <CpSheet title={sel.num} sub={sel.title || `Quote from ShieldTech · ${sel.date ? cpDate(sel.date) : ''}`} onClose={() => setSel(null)} footer={<React.Fragment>
          {sel.status === 'sent' && <button onClick={() => approve(sel)} style={{ ...cpBtn('primary'), flex: 1 }}>Approve & sign</button>}
          {sel.status === 'sent' && <button onClick={() => decline(sel)} style={cpBtn('ghost')}>Decline</button>}
          <button onClick={() => ask(sel)} style={cpBtn('ghost')}>Ask a question</button>
          <button onClick={() => cpExport('estimate', sel)} style={cpBtn('ghost')}>PDF</button>
        </React.Fragment>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><CpStatus s={sel.status} /><span style={{ fontSize: 24, fontWeight: 700, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{cpMoney(sel.amount)}</span></div>
          {sel.intro && <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 12 }}>{sel.intro}</div>}
          <CpLines lines={sel.lines} total={sel.amount} />
          {sel.deposit > 0 && <div style={{ fontSize: 12.5, marginTop: 10 }}>Deposit on approval: <strong>{cpMoney(sel.deposit)}</strong></div>}
          {sel.memo && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 10, lineHeight: 1.6 }}>{sel.memo}</div>}
          {sel.status === 'accepted' && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--status-ok)' }}>✓ Approved{sel.decidedAt ? ` ${cpDate(sel.decidedAt)}` : ''}. ShieldTech is scheduling the work.{sel.signatureUrl && <img src={sel.signatureUrl} alt="signature" style={{ display: 'block', maxWidth: 220, marginTop: 8, background: '#fff', borderRadius: 6, padding: 4 }} />}</div>}
          {sel.status === 'expired' && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-mid)' }}>Declined{sel.decidedAt ? ` ${cpDate(sel.decidedAt)}` : ''}. Ask a question if you would like a revised quote.</div>}
        </CpSheet>)}
    </div>
  );
}

/* ── Book a visit (service request → work order request + ticket) ── */
const CP_TYPES = [['Repair', 'Something is broken or offline'], ['Maintenance', 'Routine service, cleaning, testing'], ['Install', 'Add cameras, doors, Wi-Fi, alarm'], ['Survey', 'Site walk for a quote']];
const CP_WINDOWS = ['Morning (8–12)', 'Afternoon (12–5)', 'Any time', 'After hours'];
function CuRequestView({ company, onDone }) {
  const [assets] = useShieldStore(assetStore);
  const [wos, setWos] = useShieldStore(workOrderStore);
  const sites = React.useMemo(() => [...new Set((assets || []).filter(a => cpSameCo(a.customer, company)).map(a => a.site || 'Main site'))], [assets, company]);
  const [f, setF] = React.useState({ type: 'Repair', site: '', date: cpIso(new Date(Date.now() + 86400000)), win: 'Any time', scope: '', contact: (window.__shieldUser || {}).name || '', phone: '' });
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const mine = (wos || []).filter(w => cpSameCo(w.customer, company)).slice(0, 12);
  const submit = async () => {
    if (!f.scope.trim()) { shieldToast('Tell us what you need', 'warn'); return; }
    setBusy(true);
    const u = window.__shieldUser || {};
    const id = 'WO-' + ((wos || []).reduce((m, w) => { const n = parseInt(String(w.id || '').replace(/\D/g, ''), 10); return isNaN(n) ? m : Math.max(m, n); }, 2843) + 1);
    const rec = { id, customer: company, site: f.site || sites[0] || '', type: f.type, scope: f.scope.trim(), status: 'requested', requestedBy: u.name || u.email || 'Customer', requestedVia: 'customer-portal', contact: f.contact, phone: f.phone, window: f.win, scheduled: f.date, tech: 'Unassigned', techId: '—', assignedTo: null, materials: [], checklist: [], checkedItems: {}, createdAt: Date.now(), notes: `Requested from the customer portal by ${u.name || 'the customer'} · preferred ${f.date} ${f.win}` };
    setWos(prev => [rec, ...(prev || [])]);
    const r = await cpTicket(`Service request · ${f.type} · ${company}`, `${f.scope.trim()}\n\nSite: ${rec.site || '—'}\nPreferred: ${f.date} · ${f.win}\nContact: ${f.contact}${f.phone ? ` · ${f.phone}` : ''}\nWork order request: ${id}`, f.type === 'Repair' ? 'other' : 'other', f.type === 'Repair' ? 'high' : 'medium');
    setBusy(false);
    setDone({ id, ref: r.ok ? r.data.ref : null });
  };
  const inp = { fontFamily: 'var(--font-body)', width: '100%', padding: '10px 12px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13.5, outline: 'none' };
  const lbl = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6, display: 'block' };
  if (done) return (
    <div style={{ ...cpCardStyle, padding: 28, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-tint-12)', color: 'var(--status-ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>✓</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}>Visit requested</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.6 }}>Work order <span className="mono">{done.id}</span> is in ShieldTech's dispatch queue{done.ref ? ` and ticket ${done.ref} is open` : ''}. We confirm a time by email, and you can follow it under Tickets.</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}><button onClick={() => setDone(null)} style={cpBtn('ghost')}>Book another</button><button onClick={() => onDone && onDone('tickets')} style={cpBtn('primary')}>Go to Tickets</button></div>
    </div>);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 14 }} className="cp-two-col">
      <div style={{ ...cpCardStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><div style={{ fontSize: 17, fontWeight: 700 }}>Book a visit</div><div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 2 }}>Tell us what you need and when works. A technician is dispatched and you get a confirmation.</div></div>
        <div><span style={lbl}>What kind of visit?</span><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>{CP_TYPES.map(([t, d]) => <button key={t} onClick={() => set('type', t)} style={{ fontFamily: 'var(--font-body)', textAlign: 'left', padding: '10px 12px', borderRadius: 8, background: f.type === t ? 'var(--brand-tint-12)' : 'var(--canvas)', border: `1px solid ${f.type === t ? 'var(--brand)' : 'var(--border-subtle)'}`, color: 'var(--text-high)', cursor: 'pointer' }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{t}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{d}</span></button>)}</div></div>
        <div><span style={lbl}>Site</span>{sites.length ? <select value={f.site || sites[0]} onChange={e => set('site', e.target.value)} style={inp}>{sites.map(s => <option key={s}>{s}</option>)}</select> : <input value={f.site} onChange={e => set('site', e.target.value)} placeholder="Address or site name" style={inp} />}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><div><span style={lbl}>Preferred day</span><input type="date" value={f.date} min={cpIso()} onChange={e => set('date', e.target.value)} style={inp} /></div><div><span style={lbl}>Window</span><select value={f.win} onChange={e => set('win', e.target.value)} style={inp}>{CP_WINDOWS.map(w => <option key={w}>{w}</option>)}</select></div></div>
        <div><span style={lbl}>What do you need?</span><textarea value={f.scope} onChange={e => set('scope', e.target.value)} rows={4} placeholder={f.type === 'Repair' ? 'e.g. Camera at the rear dock is offline since Tuesday' : f.type === 'Install' ? 'e.g. Add two cameras covering the new parking area' : 'Describe the work'} style={{ ...inp, resize: 'vertical' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><div><span style={lbl}>On-site contact</span><input value={f.contact} onChange={e => set('contact', e.target.value)} style={inp} /></div><div><span style={lbl}>Phone</span><input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 555-0100" style={inp} /></div></div>
        <button onClick={submit} disabled={busy} style={{ ...cpBtn('primary'), padding: 12, fontSize: 14, opacity: busy ? 0.6 : 1 }}>{busy ? 'Sending…' : 'Request visit'}</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cpCardStyle, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13.5, fontWeight: 600 }}>Your visits</div>
          {!mine.length && <div style={{ padding: 16, fontSize: 12, color: 'var(--text-mid)' }}>No visits on file yet.</div>}
          {mine.map((w, i) => <div key={w.id} style={{ padding: '10px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{w.id}</span><CpStatus s={w.status} /><span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-mid)' }}>{cpDate(w.scheduled)}</span></div><div style={{ fontSize: 12.5, marginTop: 3 }}>{w.type}{w.site ? ` · ${w.site}` : ''}{w.tech && w.tech !== 'Unassigned' ? ` · ${w.tech}` : ''}</div>{w.scope && <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.scope}</div>}</div>)}
        </div>
        <div style={{ ...cpCardStyle, padding: 14, fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6 }}>Emergencies: call the ShieldTech line on your service card. A camera offline or an alarm fault is a <strong>Repair</strong> and goes to the front of the queue.</div>
      </div>
    </div>
  );
}

/* ── Home strip: money + approvals + next visit at the top of the dashboard ── */
function CuHomeStrip({ company, go }) {
  const [rows] = useCuInvoices(company);
  const quotes = useMergedEstimates();
  const [wos] = useShieldStore(workOrderStore);
  const open = rows.filter(r => r.status !== 'paid');
  const due = open.reduce((s, r) => s + r.amount, 0);
  const waiting = (quotes || []).filter(q => cpSameCo(q.customer, company) && q.status === 'sent');
  const next = (wos || []).filter(w => cpSameCo(w.customer, company) && !['completed', 'closed', 'cancelled'].includes(w.status)).sort((a, b) => String(a.scheduled).localeCompare(String(b.scheduled)))[0];
  if (!company) return null;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      <CpTile label="Balance due" value={cpMoney(due)} tone={open.some(r => r.status === 'overdue') ? 'crit' : due ? 'warn' : 'ok'} sub={due ? 'tap to pay' : 'all paid up'} onClick={() => go('invoices')} />
      <CpTile label="Quotes to approve" value={waiting.length} tone={waiting.length ? 'warn' : undefined} sub={waiting.length ? cpMoney(waiting.reduce((s, q) => s + q.amount, 0)) : 'none waiting'} onClick={() => go('quotes')} />
      <CpTile label="Next visit" value={next ? cpDate(next.scheduled) : '—'} sub={next ? `${next.type} · ${next.status === 'requested' ? 'awaiting confirmation' : next.tech && next.tech !== 'Unassigned' ? next.tech : 'scheduled'}` : 'book a visit'} onClick={() => go('request')} />
    </div>
  );
}

Object.assign(window, { CuInvoicesView, CuQuotesView, CuRequestView, CuHomeStrip, useCuCompany, useCuInvoices, cpResolveCompany, cpTicket, cpApproval, CpTile, CpStatus, CpSheet, CpLines, cpMoney, cpDate });

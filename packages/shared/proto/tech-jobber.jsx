/* Technician App — the rest of the field-service feature set.
   Speed-dial create (Request · Task · Expense · Invoice · Quote · Job ·
   Client), New client, the quote and invoice builders (client, overview, line
   items from the product catalog, discount, tax, deposit, client message,
   contract, Review and send), quote / invoice / request detail pages with
   their one-line actions (Approve & schedule, Resend, Collect signature,
   Collect payment, Convert to quote / job), Business health, and the
   "Recently active" search. Documents are the same rows the portal's Finance
   Suite shows (invoiceStore / estimateStore via buildDoc); customers go to
   customerStore; jobs to workOrderStore; tasks to punchStore. Sending uses the
   shared email outbox (queueEmail) and the QuickBooks push when connected.
   Tokens only. */

const tjMoney = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tjIso = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const tjFmt = (iso) => iso ? new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const tjMe = () => window.__shieldUser || {};
/* Email through the shared outbox when the invoicing module is loaded (mobile
   portal), else straight through the email backend. Never throws. */
function tjMail({ to, customer, subject, body, kind }) {
  if (typeof queueEmail === 'function') { queueEmail({ to, customer, subject, body, kind }); return true; }
  if (window.__shieldEmail && window.__shieldEmail.send) { window.__shieldEmail.send({ to, subject, html: String(body || '').replace(/\n/g, '<br/>') }).then(r => { if (!r || !r.ok) shieldToast('Email failed: ' + ((r && r.error) || 'unknown'), 'warn'); }); return true; }
  return false;
}
function tjDocMail(d, kind, total, extra) {
  const b = (window.brandStore && window.brandStore.get && window.brandStore.get()) || { company: 'ShieldTech Security', phone: '', email: '' };
  return { customer: d.customer, subject: `Your ${kind} from ${b.company} — ${tjMoney(total)}`, body: `Hi ${d.customer},\n\n${extra ? extra + '\n\n' : ''}Please find your ${kind} ${d.num} attached. Total: ${tjMoney(total)}${d.due ? `, due ${d.due}` : ''}.${d.payLink ? `\n\nView and pay online: ${d.payLink}` : ''}\n\nThank you,\n${b.company}${b.phone ? '\n' + b.phone : ''}${b.email ? ' · ' + b.email : ''}`, kind };
}
const TJ_DISCLAIMER ='Thank you for your business. Please contact us with any questions regarding this document. Pricing is valid for 30 days; work is scheduled on acceptance.';
const tjStatus = (kind, d) => {
  const s = d.status;
  if (kind === 'estimate') return s === 'accepted' ? ['Approved', 'var(--status-ok)'] : s === 'expired' || s === 'declined' ? ['Declined', 'var(--status-critical)'] : s === 'draft' ? ['Draft', 'var(--text-low)'] : ['Awaiting response', 'var(--status-warn)'];
  return s === 'paid' ? ['Paid', 'var(--status-ok)'] : s === 'overdue' ? [`Overdue · ${d.days}d`, 'var(--status-critical)'] : s === 'draft' ? ['Draft', 'var(--text-low)'] : s === 'void' ? ['Void', 'var(--text-low)'] : ['Awaiting payment', 'var(--status-warn)'];
};

/* ── speed dial (Jobber's +) ── */
function TfSpeedDial({ onClose, onPick }) {
  const items = [['request', 'Request', '⇩'], ['task', 'Task', '☑'], ['expense', 'Expense', '▤'], ['invoice', 'Invoice', '$'], ['quote', 'Quote', '◎'], ['job', 'Job', '⚒'], ['client', 'Client', '◉']];
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 4500, background: 'color-mix(in srgb, var(--canvas) 82%, transparent)', backdropFilter: 'blur(6px)' }}>
      <div style={{ position: 'absolute', right: 'max(16px, calc(50% - 199px))', bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        {items.map(([id, l, ic], i) => <button key={id} onClick={(e) => { e.stopPropagation(); onPick(id); }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', animation: `fade-up 0.18s ease ${(items.length - i) * 25}ms both` }}><span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>{l}</span><span style={{ width: i === items.length - 1 ? 56 : 44, height: i === items.length - 1 ? 56 : 44, borderRadius: '50%', background: i === items.length - 1 ? 'var(--brand)' : 'var(--card)', border: '1px solid var(--border-strong)', color: i === items.length - 1 ? '#fff' : 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>{ic}</span></button>)}
      </div>
    </div>, document.body);
}

/* ── New client ── */
function TjClientSheet({ onClose, onCreated, prefillName }) {
  const [f, setF] = React.useState({ first: prefillName || '', last: '', company: '', phone: '', phoneLabel: 'Main', texts: true, email: '', emailLabel: 'Main', source: '', address: '' });
  const save = () => {
    const name = f.company.trim() || `${f.first} ${f.last}`.trim();
    if (!name) { shieldToast('A name or company is required', 'warn'); return; }
    const rec = typeof buildCustomer === 'function' ? buildCustomer({ name, contact: `${f.first} ${f.last}`.trim(), phone: f.phone.trim(), email: f.email.trim(), address: f.address.trim(), site: f.address.trim(), category: 'Customer', source: 'tech', leadSource: f.source, sms: f.texts }) : { id: genId('cust'), name, contact: `${f.first} ${f.last}`.trim(), phone: f.phone.trim(), email: f.email.trim(), address: f.address.trim(), site: f.address.trim(), source: 'tech', createdAt: Date.now() };
    if (!rec.createdAt) rec.createdAt = Date.now();
    customerStore.set(list => [rec, ...(list || [])]);
    shieldToast(`${name} added — synced to the office`, 'ok'); onClose(); if (onCreated) onCreated(rec);
  };
  return (
    <TmSheet title="New client" onClose={onClose} tall>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><TmField label="First name"><input value={f.first} onChange={e => setF(p => ({ ...p, first: e.target.value }))} style={tmInput} /></TmField><TmField label="Last name"><input value={f.last} onChange={e => setF(p => ({ ...p, last: e.target.value }))} style={tmInput} /></TmField></div>
      <TmField label="Company name"><input value={f.company} onChange={e => setF(p => ({ ...p, company: e.target.value }))} placeholder="Optional" style={tmInput} /></TmField>
      <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TmField label="Phone number"><input type="tel" value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} style={tmInput} /></TmField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}><TmChips options={['Main', 'Work', 'Mobile']} value={f.phoneLabel} onChange={v => setF(p => ({ ...p, phoneLabel: v }))} /><label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>Receives texts<input type="checkbox" checked={f.texts} onChange={e => setF(p => ({ ...p, texts: e.target.checked }))} /></label></div>
      </div>
      <TmField label="Email address"><input type="email" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} style={tmInput} /></TmField>
      <TmField label="Lead source"><TmChips options={['Referral', 'Google', 'Repeat', 'Walk-up', 'Other']} value={f.source} onChange={v => setF(p => ({ ...p, source: v }))} /></TmField>
      <TmField label="Property address"><input value={f.address} onChange={e => setF(p => ({ ...p, address: e.target.value }))} placeholder="Street, city, state" style={tmInput} /></TmField>
      <TmPrimary label="Save" onClick={save} />
    </TmSheet>
  );
}

/* ── Task (punch item) ── */
function TjTaskSheet({ onClose }) {
  const day = window.useTechDay ? window.useTechDay() : { jobs: [] };
  const [f, setF] = React.useState({ title: '', job: '', due: tjIso() });
  const save = () => {
    if (!f.title.trim()) { shieldToast('What needs doing?', 'warn'); return; }
    const j = day.jobs.find(x => (x.woId || x.id) === f.job);
    punchStore.set(prev => [{ id: 'PL-' + Date.now().toString(36).toUpperCase().slice(-5), title: f.title.trim(), desc: f.title.trim(), wo: j ? (j.woId || null) : null, customer: j ? j.customer : '', site: j ? j.site : '', tech: ((tjMe().name || '').split(' ').map(w => w[0]).join('').toUpperCase()), status: 'open', due: f.due, createdAt: Date.now(), createdBy: tjMe().name || 'Tech' }, ...(prev || [])]);
    shieldToast('Task added to your punch list', 'ok'); onClose();
  };
  return (
    <TmSheet title="New task" onClose={onClose}>
      <TmField label="Task"><input autoFocus value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Label the patch panel, bring the 20ft ladder…" style={tmInput} /></TmField>
      <TmField label="Job"><select value={f.job} onChange={e => setF(p => ({ ...p, job: e.target.value }))} style={tmInput}><option value="">No job</option>{day.jobs.map(j => <option key={j.id} value={j.woId || j.id}>{j.customer}</option>)}</select></TmField>
      <TmField label="Due"><input type="date" value={f.due} onChange={e => setF(p => ({ ...p, due: e.target.value }))} style={tmInput} /></TmField>
      <TmPrimary label="Save task" onClick={save} />
    </TmSheet>
  );
}

/* ── product / service catalog for line items ── */
function useTjCatalog() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => { const q = window.__shieldQBO; if (q && q.items) q.items(500).then(r => { if (r && r.ok) setItems((r.data || []).map(i => ({ name: i.name, desc: i.description || '', rate: Number(i.unit_price || i.price || 0) || 0 }))); }); }, []);
  return items.length ? items : [{ name: 'Service call', desc: 'Diagnostic visit, first hour', rate: 145 }, { name: 'Installation labor (hr)', desc: 'Technician labor', rate: 125 }, { name: 'Camera install', desc: 'Mount, terminate, configure one camera', rate: 285 }, { name: 'Access door install', desc: 'Reader, strike, wiring, programming', rate: 650 }, { name: 'Cat6 drop', desc: 'Run, terminate, test one drop', rate: 185 }];
}

/* ── the builder (quote + invoice) ── */
function TjDocBuilder({ kind, ctx, setTab, setCtx }) {
  const isQuote = kind === 'estimate';
  const [custs] = useShieldStore(customerStore);
  const catalog = useTjCatalog();
  const pre = (ctx && ctx.prefill) || {};
  const [f, setF] = React.useState({ customer: pre.customer || '', address: pre.address || '', title: pre.title || '', salesperson: tjMe().name || '', intro: isQuote ? 'Thanks for the opportunity — here is what we recommend.' : '', lines: pre.lines && pre.lines.length ? pre.lines : [], discount: 0, tax: 0, deposit: 0, message: isQuote ? 'Thank you for doing business with us!' : 'Thank you for trusting us!', contract: TJ_DISCLAIMER, due: tjIso(new Date(Date.now() + 30 * 86400000)), wo: pre.wo || null });
  const [picker, setPicker] = React.useState(false); const [clientSheet, setClientSheet] = React.useState(false); const [review, setReview] = React.useState(false);
  const cust = (custs || []).find(c => c.name === f.customer) || null;
  const sub = f.lines.reduce((s, l) => s + (Number(l.qty) || 1) * (Number(l.rate) || 0), 0);
  const disc = sub * (Number(f.discount) || 0) / 100; const tax = (sub - disc) * (Number(f.tax) || 0) / 100; const total = sub - disc + tax;
  const setLine = (i, patch) => setF(p => ({ ...p, lines: p.lines.map((l, k) => k === i ? { ...l, ...patch } : l) }));
  const addLine = (it) => { setF(p => ({ ...p, lines: [...p.lines, { desc: it ? it.name : '', detail: it ? it.desc : '', qty: 1, rate: it ? it.rate : 0, optional: false }] })); setPicker(false); };
  const persist = (status) => {
    if (!f.customer.trim()) { shieldToast('Pick a client first', 'warn'); return null; }
    if (!f.lines.length) { shieldToast('Add at least one line item', 'warn'); return null; }
    const lines = f.lines.filter(l => !l.optional).map(l => ({ desc: [l.desc, l.detail].filter(Boolean).join(' — '), qty: Number(l.qty) || 1, rate: Number(l.rate) || 0 }));
    if (disc > 0) lines.push({ desc: `Discount (${f.discount}%)`, qty: 1, rate: -disc });
    if (tax > 0) lines.push({ desc: `Tax (${f.tax}%)`, qty: 1, rate: tax });
    const form = { customer_name: f.customer, customer_email: cust ? cust.email : '', lines, total, status, txn_date: tjIso(), due_date: isQuote ? undefined : f.due, expiration_date: isQuote ? tjIso(new Date(Date.now() + 30 * 86400000)) : null, memo: f.message, title: f.title, deposit: f.deposit, wo: f.wo, createdBy: tjMe().name || 'Tech', source: 'tech' };
    const d = isQuote ? addEstimate(form) : addInvoice(form);
    /* buildDoc keeps the accounting shape; carry the field-service extras on the same row */
    const extras = { title: f.title, intro: f.intro, memo: f.message, contract: f.contract, deposit: Number(f.deposit) || 0, wo: f.wo, createdBy: tjMe().name || 'Tech', createdIn: 'tech', sentAt: status === 'draft' ? null : Date.now() };
    (isQuote ? estimateStore : invoiceStore).set(list => (list || []).map(r => r.qbo_id === d.qbo_id ? { ...r, ...extras } : r));
    Object.assign(d, extras);
    if (status !== 'draft' && window.__shieldQBO && window.__shieldQBO.pushDoc) window.__shieldQBO.pushDoc(isQuote ? 'estimate' : 'invoice', d).then(r => { if (r && r.ok) shieldToast(`${d.doc_number} recorded in QuickBooks`, 'ok'); }).catch(() => {});
    return d;
  };
  const send = () => {
    const d = persist(isQuote ? 'pending' : 'open'); if (!d) return;
    const to = cust && cust.email; const label = isQuote ? 'quote' : 'invoice';
    const mail = tjDocMail({ num: d.doc_number, customer: f.customer, due: isQuote ? 'on acceptance' : tjFmt(f.due) }, label, total, [f.intro, f.message].filter(Boolean).join('\n\n'));
    if (to && tjMail({ ...mail, to })) shieldToast(`${d.doc_number} sent to ${to}`, 'ok');
    else shieldToast(`${d.doc_number} saved — ${to ? 'email backend not configured' : 'no email on file'}, the office can send it`, 'info');
    setCtx({ kind, num: d.doc_number }); setTab('doc-view');
  };
  const saveDraft = () => { const d = persist('draft'); if (!d) return; shieldToast(`${d.doc_number} saved as draft`, 'ok'); setCtx({ kind, num: d.doc_number }); setTab('doc-view'); };
  const section = (title, body, plus) => <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: body ? 8 : 0 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>{plus && <button onClick={plus} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>+</button>}</div>{body}</div>;
  const money = (l, v, strong, color) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: strong ? 16 : 14, fontWeight: strong ? 800 : 500, background: strong ? 'var(--card)' : 'transparent', margin: strong ? '0 -16px' : 0, paddingLeft: strong ? 16 : 0, paddingRight: strong ? 16 : 0 }}><span>{l}</span><span className="mono" style={{ color: color || 'var(--text-high)' }}>{v}</span></div>;
  if (review) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)', paddingBottom: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><button onClick={() => setReview(false)} style={{ background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 20, cursor: 'pointer' }}>×</button><span style={{ fontSize: 20, fontWeight: 800 }}>Review {isQuote ? 'quote' : 'invoice'}</span></div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>ShieldTech Security</div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{isQuote ? 'Quote' : 'Invoice'} · draft</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{f.customer}</div><div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{f.address || (cust && (cust.address || cust.site)) || ''}{cust && cust.phone ? ` · ${cust.phone}` : ''}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mid)', marginTop: 10 }}><span>{isQuote ? 'Sent on' : 'Issued'}</span><span>{isQuote ? 'Not sent yet' : tjFmt(tjIso())}</span></div>
        {f.intro && <div style={{ marginTop: 14 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{isQuote ? 'Quote introduction' : 'Message'}</div><div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>{f.intro}</div></div>}
        {f.lines.map((l, i) => <div key={i} style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{l.optional ? '☐ ' : ''}{l.desc}</div>{l.detail && <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{l.detail}</div>}<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 11, color: 'var(--text-low)', marginTop: 6 }}><span>QTY.</span><span style={{ textAlign: 'center' }}>UNIT PRICE</span><span style={{ textAlign: 'right' }}>TOTAL</span></div><div className="mono" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 13 }}><span>{l.qty}</span><span style={{ textAlign: 'center' }}>{tjMoney(l.rate)}</span><span style={{ textAlign: 'right' }}>{tjMoney((Number(l.qty) || 1) * (Number(l.rate) || 0))}</span></div></div>)}
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)' }}>{money('Subtotal', tjMoney(sub))}{disc > 0 && money(`Discount (${f.discount}%)`, '-' + tjMoney(disc), false, 'var(--status-ok)')}{money('Tax', tjMoney(tax), false, 'var(--status-ok)')}{money('Total', tjMoney(total), true)}{isQuote && Number(f.deposit) > 0 && money('Required deposit', tjMoney(f.deposit), false, 'var(--status-ok)')}</div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-mid)', whiteSpace: 'pre-wrap' }}>{f.message}</div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-low)', whiteSpace: 'pre-wrap' }}>{f.contract}</div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', padding: '10px 16px', background: 'var(--canvas)', borderTop: '1px solid var(--border-subtle)', maxWidth: 430, margin: '0 auto', zIndex: 20 }}><TmPrimary label={cust && cust.email ? `✉ Send by email` : 'Save & notify office'} onClick={send} /></div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--text-high)', paddingBottom: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 20, cursor: 'pointer' }}>×</button><span style={{ fontSize: 20, fontWeight: 800 }}>New {isQuote ? 'quote' : 'invoice'}</span></div><button onClick={() => setTab('ai')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 16, cursor: 'pointer' }}>✦</button></div>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8 }}>{isQuote ? 'Service for' : 'Billed to'}</div>
      {f.customer ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setF(p => ({ ...p, customer: '' }))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}><span>◉ {f.customer}</span><span style={{ color: 'var(--brand)' }}>→</span></button>
          <div style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-mid)' }}>⌂ {f.address || (cust && (cust.address || cust.site)) || 'No property address'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select onChange={e => { const c = (custs || []).find(x => x.name === e.target.value); if (c) setF(p => ({ ...p, customer: c.name, address: c.address || c.site || '' })); }} value="" style={{ ...tmInput, color: 'var(--brand)', fontWeight: 700 }}><option value="">⌕ Select existing client</option>{(custs || []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}</select>
          <button onClick={() => setClientSheet(true)} style={{ padding: '12px', borderRadius: 14, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-mid)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New client</button>
        </div>
      )}
      {section('Overview', <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><TmField label="Job title"><input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="4-camera install, front lot" style={tmInput} /></TmField><TmField label="Salesperson"><input value={f.salesperson} onChange={e => setF(p => ({ ...p, salesperson: e.target.value }))} style={tmInput} /></TmField></div>)}
      {isQuote && section('Introduction', <textarea rows={2} value={f.intro} onChange={e => setF(p => ({ ...p, intro: e.target.value }))} style={{ ...tmInput, resize: 'vertical' }} />)}
      {section('Product / Service', <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 14, fontWeight: 700 }}>Line items</span><button onClick={() => setPicker(true)} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>+</button></div>
        {f.lines.map((l, i) => <div key={i} style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input value={l.desc} onChange={e => setLine(i, { desc: e.target.value })} placeholder="Item" style={{ ...tmInput, fontWeight: 700, padding: '8px 10px' }} /><button onClick={() => setF(p => ({ ...p, lines: p.lines.filter((_, k) => k !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>×</button></div>
          <input value={l.detail || ''} onChange={e => setLine(i, { detail: e.target.value })} placeholder="Description" style={{ ...tmInput, fontSize: 13, padding: '8px 10px', marginTop: 6 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 8, alignItems: 'center', marginTop: 6 }}><input type="number" inputMode="decimal" value={l.qty} onChange={e => setLine(i, { qty: e.target.value })} className="mono" style={{ ...tmInput, padding: '8px 10px' }} /><input type="number" inputMode="decimal" value={l.rate} onChange={e => setLine(i, { rate: e.target.value })} className="mono" style={{ ...tmInput, padding: '8px 10px' }} /><span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{tjMoney((Number(l.qty) || 1) * (Number(l.rate) || 0))}</span></div>
          {isQuote && <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-mid)', marginTop: 6 }}><input type="checkbox" checked={!!l.optional} onChange={e => setLine(i, { optional: e.target.checked })} /> Optional — client can add it when approving</label>}
        </div>)}
        {!f.lines.length && <button onClick={() => setPicker(true)} style={{ padding: '14px', borderRadius: 14, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add line item</button>}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 4 }}>
          {money('Subtotal', tjMoney(sub))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}><span style={{ fontSize: 14, fontWeight: 500 }}>Discount</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="number" inputMode="decimal" value={f.discount} onChange={e => setF(p => ({ ...p, discount: e.target.value }))} className="mono" style={{ ...tmInput, width: 70, padding: '6px 8px', textAlign: 'right' }} /><span style={{ fontSize: 13, color: 'var(--text-low)' }}>%</span><span className="mono" style={{ color: 'var(--status-ok)', minWidth: 70, textAlign: 'right' }}>-{tjMoney(disc)}</span></span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}><span style={{ fontSize: 14, fontWeight: 500 }}>Tax</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="number" inputMode="decimal" value={f.tax} onChange={e => setF(p => ({ ...p, tax: e.target.value }))} className="mono" style={{ ...tmInput, width: 70, padding: '6px 8px', textAlign: 'right' }} /><span style={{ fontSize: 13, color: 'var(--text-low)' }}>%</span><span className="mono" style={{ color: 'var(--status-ok)', minWidth: 70, textAlign: 'right' }}>{tjMoney(tax)}</span></span></div>
          {money('Total', tjMoney(total), true)}
          {isQuote && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}><span style={{ fontSize: 14, fontWeight: 500 }}>Required deposit</span><input type="number" inputMode="decimal" value={f.deposit} onChange={e => setF(p => ({ ...p, deposit: e.target.value }))} className="mono" style={{ ...tmInput, width: 110, padding: '6px 8px', textAlign: 'right', color: 'var(--status-ok)' }} /></div>}
          {!isQuote && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}><span style={{ fontSize: 14, fontWeight: 500 }}>Due</span><input type="date" value={f.due} onChange={e => setF(p => ({ ...p, due: e.target.value }))} style={{ ...tmInput, width: 160, padding: '6px 8px' }} /></div>}
        </div>
      </div>)}
      {section('Images', <button onClick={() => setTab('photos')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>Attach site photos from Photos ›</button>, () => setTab('photos'))}
      {section('Client message', <textarea rows={2} value={f.message} onChange={e => setF(p => ({ ...p, message: e.target.value }))} style={{ ...tmInput, resize: 'vertical' }} />)}
      {section('Contract / Disclaimer', <textarea rows={3} value={f.contract} onChange={e => setF(p => ({ ...p, contract: e.target.value }))} style={{ ...tmInput, resize: 'vertical', fontSize: 12.5 }} />)}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', padding: '10px 16px', background: 'var(--canvas)', borderTop: '1px solid var(--border-subtle)', maxWidth: 430, margin: '0 auto', zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6 }}><TmPrimary label="Review and Send" onClick={() => { if (!f.customer) { shieldToast('Pick a client first', 'warn'); return; } if (!f.lines.length) { shieldToast('Add a line item', 'warn'); return; } setReview(true); }} /><button onClick={saveDraft} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 6 }}>Save</button></div>
      {picker && <TmSheet title="Add line item" onClose={() => setPicker(false)}>{catalog.map(it => <button key={it.name} onClick={() => addLine(it)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}><span><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{it.name}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)' }}>{it.desc}</span></span><span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{tjMoney(it.rate)}</span></button>)}<button onClick={() => addLine(null)} style={{ padding: '12px', borderRadius: 14, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Custom line item</button></TmSheet>}
      {clientSheet && <TjClientSheet onClose={() => setClientSheet(false)} onCreated={(c) => setF(p => ({ ...p, customer: c.name, address: c.address || c.site || '' }))} />}
    </div>
  );
}

/* ── document detail ── */
function TjDocView({ ctx, setTab, setCtx }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const kind = (ctx && ctx.kind) || 'invoice'; const isQuote = kind === 'estimate';
  const d = (isQuote ? est : inv).find(x => x.num === (ctx && ctx.num)) || null;
  const [custs] = useShieldStore(customerStore);
  const [tab, setTab2] = React.useState('doc'); const [more, setMore] = React.useState(false);
  const [notes, setNotes] = useShieldStore(woNotesStore); const [note, setNote] = React.useState('');
  if (!d) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Home</button><div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Document not found.</div></div>;
  const cust = (custs || []).find(c => c.name === d.customer) || {}; const raw = d._raw || {};
  const [stLabel, stColor] = tjStatus(kind, d);
  const store = isQuote ? estimateStore : invoiceStore;
  const patch = (p) => store.set(list => (list || []).map(r => (r.doc_number || r.num) === d.num ? { ...r, ...p } : r));
  const resend = () => { const mail = tjDocMail({ num: d.num, customer: d.customer, due: isQuote ? 'on acceptance' : d.due, payLink: raw.payLink }, isQuote ? 'quote' : 'invoice', d.amount, raw.memo); if (cust.email) { if (tjMail({ ...mail, to: cust.email })) shieldToast(`${d.num} resent to ${cust.email}`, 'ok'); else shieldToast('Email backend not configured — the office can send it', 'warn'); patch({ sentAt: Date.now(), status: isQuote ? 'pending' : (raw.status === 'draft' ? 'open' : raw.status) }); } else shieldToast('No email on file for this client', 'warn'); };
  const approveSchedule = () => { patch({ status: 'accepted', acceptedAt: Date.now() }); const id = 'WO-' + Date.now().toString(36).toUpperCase().slice(-5); workOrderStore.set(prev => [{ id, customer: d.customer, site: cust.address || cust.site || '', type: 'Install', scope: raw.title || (d.lines[0] || {}).desc || 'Approved quote', status: 'open', techId: ((tjMe().name || '').split(' ').map(w => w[0]).join('').toUpperCase()), assignedTo: tjMe().id || null, scheduled: tjIso(new Date(Date.now() + 86400000)), amount: d.amount, estimate_ref: d.num, createdAt: Date.now(), notes: `From quote ${d.num}` }, ...(prev || [])]); shieldToast(`${d.num} approved — ${id} scheduled for tomorrow`, 'ok'); };
  const collectSig = () => shieldModal({ kind: 'signature', title: 'Collect signature', subtitle: `${d.num} · ${tjMoney(d.amount)}`, signPrompt: 'Have the client sign to approve this quote.', submitLabel: 'Confirm', successMsg: 'Signature saved as a note', onSave: async (dataUrl) => { let url = null; if (dataUrl && window.__shieldStorage) { const r = await window.__shieldStorage.uploadDataUrl(dataUrl, { folder: 'signatures', entity: kind, entityId: d.num, name: `signature-${d.num}.png`, shared: true }); url = r && r.url; } patch({ signatureUrl: url, signedAt: Date.now(), ...(isQuote ? { status: 'accepted' } : {}) }); return { ok: true }; } });
  const collectPayment = () => shieldModal({ kind: 'confirm', title: 'Collect payment', message: `Record ${tjMoney(raw.balance != null ? raw.balance : d.amount)} received on ${d.num}? The office will match it in QuickBooks.`, confirmLabel: 'Payment received', onConfirm: () => { patch({ status: 'paid', balance: 0, paidAt: Date.now(), paidBy: tjMe().name || 'Tech' }); if (window.__shieldPay && window.__shieldPay.recordPaid) window.__shieldPay.recordPaid(d.num).catch(() => {}); shieldToast('Payment recorded', 'ok'); } });
  const convertToInvoice = () => { setCtx({ kind: 'invoice', prefill: { customer: d.customer, address: cust.address || cust.site || '', title: raw.title || '', lines: d.lines.filter(l => !/^(Discount|Tax)/.test(l.desc)).map(l => ({ desc: l.desc.split(' — ')[0], detail: l.desc.split(' — ').slice(1).join(' — '), qty: l.qty, rate: l.rate })) } }); setTab('new-invoice'); };
  const moreItems = isQuote ? [['Collect signature', collectSig], ['Convert to invoice', convertToInvoice], ['Mark declined', () => patch({ status: 'rejected' })], ['Archive', () => { patch({ archived: true }); setTab('quotes'); }]] : [['Collect signature', collectSig], ['Send pay link (office)', () => { approvalStore.set(prev => [{ id: (prev || []).reduce((m, a) => Math.max(m, a.id), 0) + 1, kind: 'PAY LINK', title: `${d.customer} — ${d.num} pay link`, amt: tjMoney(d.amount), sub: 'Requested from the field', status: 'pending' }, ...(prev || [])]); shieldToast('Asked the office for a pay link', 'ok'); }], ['Void', () => shieldModal({ kind: 'confirm', title: `Void ${d.num}?`, confirmLabel: 'Void', onConfirm: () => { patch({ status: 'void' }); setTab('invoices'); } })]];
  const lines = d.lines.filter(l => !/^(Discount|Tax)/.test(l.desc)); const extra = d.lines.filter(l => /^(Discount|Tax)/.test(l.desc));
  const sub = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const money = (l, v, strong, color) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: strong ? 16 : 14, fontWeight: strong ? 800 : 500, borderTop: strong ? '1px solid var(--border-subtle)' : 'none' }}><span>{l}</span><span className="mono" style={{ color: color || 'var(--text-high)' }}>{v}</span></div>;
  const noteKey = 'doc:' + d.num; const list = ((notes || {})[noteKey] || []);
  const primary = isQuote
    ? (d.status === 'accepted' ? ['Schedule job', approveSchedule] : ['Approve & Schedule', approveSchedule])
    : (d.status === 'paid' ? ['Resend receipt', resend] : d.status === 'draft' ? ['Send', resend] : ['Collect Payment', collectPayment]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-high)', paddingBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><button onClick={() => setTab(isQuote ? 'quotes' : 'invoices')} style={{ background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 20, cursor: 'pointer', padding: 0 }}>‹</button><span style={{ display: 'flex', gap: 6 }}>{cust.phone && <button onClick={() => { try { navigator.clipboard.writeText(cust.phone); } catch { /* noop */ } shieldToast(`${cust.phone} copied`, 'ok'); }} style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', cursor: 'pointer', fontSize: 15 }}>✆</button>}<button onClick={() => setTab('ai')} style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--brand)', cursor: 'pointer', fontSize: 15 }}>✦</button></span></div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-mid)' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: stColor }} />{stLabel}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{isQuote ? 'Quote' : 'Invoice'} {d.num.replace(/^\D+/, '#')} for {d.customer} for {tjMoney(d.amount)}</div>
      {raw.title && <div style={{ fontSize: 15, color: 'var(--text-mid)', fontWeight: 600 }}>{raw.title}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{[[isQuote ? 'Created' : 'Issued', tjFmt(raw.txn_date)], [isQuote ? 'Sent' : 'Due', isQuote ? (raw.sentAt ? tjFmt(new Date(raw.sentAt).toISOString()) : 'Not sent yet') : (d.due || tjFmt(raw.due_date))]].map(([k, v]) => <div key={k}><div style={{ fontSize: 12, color: 'var(--text-low)', fontWeight: 600 }}>{k}</div><div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div></div>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
        <TmPrimary label={primary[0]} onClick={primary[1]} color={isQuote ? 'var(--status-ok)' : 'var(--brand)'} />
        <button onClick={resend} style={{ border: 'none', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff', background: 'var(--status-ok)', fontFamily: 'var(--font-body)' }}>Resend</button>
        <button onClick={() => setMore(true)} style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>···</button>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginTop: 4 }}>{[['doc', isQuote ? 'Quote' : 'Invoice'], ['notes', 'Notes']].map(([id, l]) => <button key={id} onClick={() => setTab2(id)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? stColor : 'transparent'}`, marginBottom: -1, color: tab === id ? 'var(--text-high)' : 'var(--text-low)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>)}</div>
      {tab === 'doc' ? (
        <div>
          {isQuote && <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Introduction</div><div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>{raw.intro || raw.memo || 'Thanks for the opportunity.'}</div></div>}
          <div style={{ padding: '14px 0' }}><div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Product / Service</div><div style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 4px' }}>Line items</div>
            {lines.map((l, i) => <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}><div style={{ fontSize: 14.5, fontWeight: 700 }}>{l.desc.split(' — ')[0]}</div>{l.desc.includes(' — ') && <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{l.desc.split(' — ').slice(1).join(' — ')}</div>}<div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}><span>{l.qty} × {tjMoney(l.rate)}</span><span>{tjMoney(l.qty * l.rate)}</span></div></div>)}
            {money('Subtotal', tjMoney(sub))}{extra.map((l, i) => money(l.desc, tjMoney(l.qty * l.rate), false, 'var(--status-ok)'))}{money('Total', tjMoney(d.amount), true)}
            {!isQuote && <React.Fragment>{money('Payments', tjMoney(d.amount - (raw.balance != null ? Number(raw.balance) : (d.status === 'paid' ? 0 : d.amount))))}{money('Invoice balance', tjMoney(raw.balance != null ? Number(raw.balance) : (d.status === 'paid' ? 0 : d.amount)), true)}</React.Fragment>}
            {isQuote && Number(raw.deposit) > 0 && money('Required deposit', tjMoney(raw.deposit), false, 'var(--status-ok)')}
          </div>
          {raw.memo && <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Client message</div><div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>{raw.memo}</div></div>}
          <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Contract / Disclaimer</div><div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>{raw.contract || TJ_DISCLAIMER}</div></div>
          {raw.signatureUrl && <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Signature</div><img src={raw.signatureUrl} alt="signature" style={{ maxWidth: 220, background: '#fff', borderRadius: 8, marginTop: 8 }} /></div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Customer asked about adding a 5th camera…" style={{ ...tmInput, resize: 'vertical' }} />
          <TmPrimary label="Add note" disabled={!note.trim()} onClick={() => { setNotes(prev => ({ ...(prev || {}), [noteKey]: [{ id: genId('note'), text: note.trim(), by: tjMe().name || 'Tech', at: Date.now() }, ...list] })); setNote(''); }} />
          {list.map(n => <div key={n.id} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.text}</div><div className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 6 }}>{n.by} · {new Date(n.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div></div>)}
        </div>
      )}
      {more && <TmSheet title={d.num} onClose={() => setMore(false)}>{moreItems.map(([l, fn]) => <button key={l} onClick={() => { setMore(false); fn(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: /Void|declined|Archive/.test(l) ? 'var(--status-critical)' : 'var(--text-high)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{l}</button>)}</TmSheet>}
    </div>
  );
}

/* ── document lists ── */
function TjDocList({ kind, setTab, setCtx }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const isQuote = kind === 'estimate'; const rows = (isQuote ? est : inv).filter(d => !(d._raw || {}).archived);
  const [filter, setFilter] = React.useState('All');
  const opts = isQuote ? ['All', 'Awaiting response', 'Approved', 'Draft'] : ['All', 'Awaiting payment', 'Overdue', 'Paid', 'Draft'];
  const list = rows.filter(d => { const [l] = tjStatus(kind, d); return filter === 'All' || l.startsWith(filter); });
  const open = rows.filter(d => (isQuote ? d.status === 'sent' : (d.status === 'pending' || d.status === 'overdue'))).reduce((s, d) => s + d.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 2px' }}><div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{isQuote ? 'Quotes' : 'Invoices'}</div><div className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>{tjMoney(open)} {isQuote ? 'awaiting' : 'unpaid'}</div></div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>{opts.map(o => <button key={o} onClick={() => setFilter(o)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', background: filter === o ? 'var(--brand)' : 'var(--card)', color: filter === o ? '#fff' : 'var(--text-mid)', border: `1px solid ${filter === o ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{o}</button>)}</div>
      {list.length === 0 && <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12.5, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>No {isQuote ? 'quotes' : 'invoices'} here yet.</div>}
      {list.map(d => { const [l, c] = tjStatus(kind, d); return <button key={d.num} onClick={() => { setCtx({ kind, num: d.num }); setTab('doc-view'); }} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', width: '100%', padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}><span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.customer}</span><span className="mono" style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{d.num} · {tjFmt((d._raw || {}).txn_date)}{(d._raw || {}).title ? ` · ${(d._raw || {}).title}` : ''}</span></span><span style={{ textAlign: 'right' }}><span className="mono" style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{tjMoney(d.amount)}</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: c, marginTop: 2 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: c }} />{l}</span></span></button>; })}
      <button onClick={() => { setCtx({ kind, prefill: {} }); setTab(isQuote ? 'new-quote' : 'new-invoice'); }} style={{ padding: '13px', borderRadius: 14, border: '1px dashed var(--brand)', background: 'transparent', color: 'var(--brand)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New {isQuote ? 'quote' : 'invoice'}</button>
    </div>
  );
}

/* ── request detail (a work order with status 'requested') ── */
function TjRequestView({ ctx, setTab, setCtx }) {
  const [wos] = useShieldStore(workOrderStore);
  const w = (wos || []).find(x => x.id === (ctx && ctx.id)) || null;
  const [custs] = useShieldStore(customerStore);
  const [more, setMore] = React.useState(false);
  if (!w) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Home</button><div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Request not found.</div></div>;
  const cust = (custs || []).find(c => c.name === w.customer) || {};
  const patch = (p) => workOrderStore.set(list => (list || []).map(x => x.id === w.id ? { ...x, ...p } : x));
  const confirm = () => { if (cust.email) { const ok = tjMail({ to: cust.email, customer: w.customer, subject: `ShieldTech — your assessment is booked for ${tjFmt(w.scheduled)}`, body: `Hi ${cust.contact || w.customer},\n\nWe've scheduled an on-site assessment for ${tjFmt(w.scheduled)} at ${w.site || 'your location'}.\n\nScope: ${w.scope}\n\nReply to this email with any questions.\n\nShieldTech Security`, kind: 'booking' }); patch({ confirmedAt: Date.now() }); shieldToast(ok ? `Booking confirmation sent to ${cust.email}` : 'Email backend not configured — the office can confirm', ok ? 'ok' : 'warn'); } else shieldToast('No email on file — ask the office to confirm', 'warn'); };
  const items = [['Complete assessment', () => { patch({ assessed: true }); shieldToast('Assessment marked complete', 'ok'); }], ['Convert to quote', () => { setCtx({ kind: 'estimate', prefill: { customer: w.customer, address: w.site, title: w.scope, wo: w.id } }); setTab('new-quote'); }], ['Convert to job', () => { patch({ status: 'open' }); shieldToast(`${w.id} is now a scheduled job`, 'ok'); setTab('schedule'); }], ['Archive', () => { patch({ status: 'archived' }); setTab('today'); }], ['Delete', () => shieldModal({ kind: 'confirm', title: `Delete ${w.id}?`, confirmLabel: 'Delete', onConfirm: () => { workOrderStore.set(list => (list || []).filter(x => x.id !== w.id)); setTab('today'); } })]];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 20, cursor: 'pointer', padding: 0 }}>‹</button><button onClick={() => setTab('ai')} style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--brand)', cursor: 'pointer', fontSize: 15 }}>✦</button></div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-mid)' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: w.assessed ? 'var(--status-ok)' : 'var(--brand)' }} />{w.assessed ? 'Assessment completed' : 'Upcoming'}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Request for {w.customer}</div>
      <div style={{ fontSize: 15, color: 'var(--text-mid)', fontWeight: 600 }}>{w.scope}</div>
      <div style={{ fontSize: 14 }}>{w.site || 'No address on file'}</div>
      {w.site && <button onClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(w.site), '_blank')} style={{ padding: '12px', borderRadius: 14, border: '1px solid var(--border-strong)', background: 'var(--card)', color: 'var(--text-high)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⌖ Directions</button>}
      <div><div style={{ fontSize: 12, color: 'var(--text-low)', fontWeight: 600 }}>Assessment schedule</div><div style={{ fontSize: 15, fontWeight: 600 }}>{tjFmt(w.scheduled)}</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}><TmPrimary label={w.confirmedAt ? 'Resend booking confirmation' : 'Send Booking Confirmation'} color="var(--status-ok)" onClick={confirm} /><button onClick={() => setMore(true)} style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>···</button></div>
      <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Instructions</div><div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>{w.notes || 'Prepare tools for an assessment visit.'}</div></div>
      <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Request form</div><div style={{ fontSize: 12.5, color: 'var(--text-low)', marginTop: 8 }}>Service details</div><div style={{ fontSize: 14 }}>{w.scope}</div><div style={{ fontSize: 12.5, color: 'var(--text-low)', marginTop: 8 }}>Requested by</div><div style={{ fontSize: 14 }}>{w.requestedBy || 'Office'}</div></div>
      {more && <TmSheet title={w.id} onClose={() => setMore(false)}>{items.map(([l, fn]) => <button key={l} onClick={() => { setMore(false); fn(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: /Delete|Archive/.test(l) ? 'var(--status-critical)' : 'var(--text-high)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{l}</button>)}</TmSheet>}
    </div>
  );
}

/* ── Business health ── */
function TjBusinessHealth({ setTab }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [custs] = useShieldStore(customerStore); const [wos] = useShieldStore(workOrderStore);
  const now = Date.now(), d30 = now - 30 * 86400000, d60 = now - 60 * 86400000;
  const ts = (x) => x ? new Date(String(x).length === 10 ? x + 'T12:00:00' : x).getTime() : 0;
  const within = (t, a, b) => t >= a && t < b;
  const pct = (cur, prev) => prev === 0 ? (cur ? 100 : 0) : Math.round((cur - prev) / prev * 100);
  const delta = (cur, prev) => { const p = pct(cur, prev); return <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'var(--card)', color: p > 0 ? 'var(--status-ok)' : p < 0 ? 'var(--status-critical)' : 'var(--text-low)' }}>{p > 0 ? '↑' : p < 0 ? '↓' : ''} {Math.abs(p)}%</span>; };
  const newLeads = (wos || []).filter(w => w.status === 'requested' && within(w.createdAt || 0, d30, now)).length, prevLeads = (wos || []).filter(w => w.status === 'requested' && within(w.createdAt || 0, d60, d30)).length;
  const newClients = (custs || []).filter(c => within(c.createdAt || ts(c.created_at) || 0, d30, now)).length, prevClients = (custs || []).filter(c => within(c.createdAt || ts(c.created_at) || 0, d60, d30)).length;
  const sent = est.filter(e => within(ts((e._raw || {}).txn_date), d30, now)), prevSent = est.filter(e => within(ts((e._raw || {}).txn_date), d60, d30));
  const conv = sent.filter(e => e.status === 'accepted'), prevConv = prevSent.filter(e => e.status === 'accepted');
  const mon = tmMonday(); const wk0 = mon.getTime(), wk1 = wk0 + 7 * 86400000;
  const weekJobs = (wos || []).filter(w => w.scheduled && within(ts(w.scheduled), wk0, wk1)), prevWeek = (wos || []).filter(w => w.scheduled && within(ts(w.scheduled), wk0 - 7 * 86400000, wk0));
  const jobValue = (l) => l.reduce((s, w) => s + (Number(w.amount) || 0), 0);
  const issued = inv.filter(i => within(ts((i._raw || {}).txn_date), d30, now)), prevIssued = inv.filter(i => within(ts((i._raw || {}).txn_date), d60, d30));
  const paid = issued.filter(i => i.status === 'paid'), overdue = inv.filter(i => i.status === 'overdue');
  const sum = (l) => l.reduce((s, i) => s + i.amount, 0);
  const row = (l, v, extra, d) => <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}><span style={{ fontSize: 14, color: 'var(--text-mid)' }}>{l}</span><span style={{ textAlign: 'right' }}>{extra && <span className="mono" style={{ fontSize: 12, color: 'var(--text-low)', marginRight: 8 }}>{extra}</span>}<span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{v}</span></span>{d}</div>;
  const group = (t, s, body) => <div><div style={{ fontSize: 17, fontWeight: 800, margin: '14px 2px 0' }}>{t}</div><div style={{ fontSize: 12, color: 'var(--text-low)', margin: '0 2px 4px' }}>{s}</div>{body}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 20, cursor: 'pointer', padding: 0 }}>‹</button><span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Business health</span></div><button onClick={() => setTab('ai')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 16, cursor: 'pointer' }}>✦</button></div>
      {group('Clients', 'Past 30 days', <React.Fragment>{row('New leads', newLeads, null, delta(newLeads, prevLeads))}{row('New clients', newClients, null, delta(newClients, prevClients))}</React.Fragment>)}
      {group('Quotes', 'Past 30 days', <React.Fragment>{row('Conversion rate', `${sent.length ? Math.round(conv.length / sent.length * 100) : 0}%`, null, delta(sent.length ? conv.length / sent.length : 0, prevSent.length ? prevConv.length / prevSent.length : 0))}{row('Sent', sent.length, tjMoney(sum(sent)), delta(sent.length, prevSent.length))}{row('Converted', conv.length, tjMoney(sum(conv)), delta(conv.length, prevConv.length))}</React.Fragment>)}
      {group('Jobs', `This week (${tmMonday().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(wk1 - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`, <React.Fragment>{row('Job value', tjMoney(jobValue(weekJobs)), null, delta(jobValue(weekJobs), jobValue(prevWeek)))}{row('Visits scheduled', weekJobs.length, null, delta(weekJobs.length, prevWeek.length))}</React.Fragment>)}
      {group('Invoices', 'Past 30 days', <React.Fragment>{row('Issued', issued.length, tjMoney(sum(issued)), delta(issued.length, prevIssued.length))}{row('Paid', paid.length, tjMoney(sum(paid)), delta(paid.length, prevIssued.filter(i => i.status === 'paid').length))}{row('Overdue', overdue.length, tjMoney(sum(overdue)), delta(0, 0))}</React.Fragment>)}
    </div>
  );
}

/* ── search: recently active + chips ── */
function TjRecent({ setTab, setSelectedJob, setCtx }) {
  const inv = useMergedInvoices(); const est = useMergedEstimates();
  const [wos] = useShieldStore(workOrderStore); const [custs] = useShieldStore(customerStore);
  const me = tdMe();
  const ts = (x) => x ? new Date(String(x).length === 10 ? x + 'T12:00:00' : x).getTime() : 0;
  const items = [
    ...(wos || []).map(w => ({ t: w.status === 'requested' ? ts(w.createdAt) || ts(w.scheduled) : ts(w.scheduled), icon: w.status === 'requested' ? '⇩' : '⚒', title: w.customer, sub: `${w.site ? w.site + ' · ' : ''}${w.scope || w.type || ''}`, tag: w.status === 'requested' ? 'Request' : w.fieldStatus === 'complete' ? 'Done' : (w.scheduled === tjIso() ? 'Today' : ''), color: w.status === 'requested' ? 'var(--status-warn)' : 'var(--brand)', go: () => { if (w.status === 'requested') { setCtx({ id: w.id }); setTab('request'); } else { setSelectedJob({ ...tdJobFromWo(w, me), s: (w.start != null ? w.start : 8) * 60, e: ((w.start != null ? w.start : 8) + (w.dur || 1.5)) * 60, anytime: w.start == null }); setTab('job-detail'); } } })),
    ...est.map(e => ({ t: ts((e._raw || {}).txn_date), icon: '◎', title: e.customer, sub: `${tjMoney(e.amount)} · ${(e._raw || {}).title || e.num}`, tag: tjStatus('estimate', e)[0], color: tjStatus('estimate', e)[1], go: () => { setCtx({ kind: 'estimate', num: e.num }); setTab('doc-view'); } })),
    ...inv.map(i => ({ t: ts((i._raw || {}).txn_date), icon: '$', title: i.customer, sub: `${tjMoney(i.amount)} · ${i.num}`, tag: tjStatus('invoice', i)[0], color: tjStatus('invoice', i)[1], go: () => { setCtx({ kind: 'invoice', num: i.num }); setTab('doc-view'); } })),
    ...(custs || []).map(c => ({ t: c.createdAt || ts(c.created_at) || 0, icon: '◉', title: c.name, sub: c.address || c.site || c.phone || '', tag: c.leadSource ? 'Lead' : '', color: 'var(--text-low)', go: () => setTab('search') })),
  ].sort((a, b) => b.t - a.t).slice(0, 12);
  const chips = [['Requests', () => setTab('today')], ['Quotes', () => setTab('quotes')], ['Jobs', () => setTab('jobs')], ['Invoices', () => setTab('invoices')], ['Clients', () => setTab('search')], ['Health', () => setTab('health')]];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>{chips.map(([l, fn]) => <button key={l} onClick={fn} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', background: 'var(--card)', color: 'var(--text-high)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>)}</div>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '4px 2px 0' }}>Recently active</div>
      {items.map((it, i) => <button key={i} onClick={it.go} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', width: '100%', padding: '10px 4px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}><span style={{ color: 'var(--text-mid)', fontSize: 15 }}>{it.icon}</span><span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.t ? new Date(it.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' | ' : ''}{it.sub}</span></span>{it.tag && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>{it.tag}<span style={{ width: 8, height: 8, borderRadius: 2, background: it.color }} /></span>}</button>)}
      {!items.length && <div style={{ fontSize: 12.5, color: 'var(--text-low)', textAlign: 'center', padding: 14 }}>Nothing yet — requests, quotes, jobs and invoices show up here as they happen.</div>}
    </div>
  );
}

Object.assign(window, { TfSpeedDial, TjClientSheet, TjTaskSheet, TjDocBuilder, TjDocView, TjDocList, TjRequestView, TjBusinessHealth, TjRecent, tjStatus });

/* Invoicing/outbox stores + email helpers — vendored from updated design prototype (seeds emptied). */
const invoiceStore = createShieldStore('invoices', []);
function nextInvoiceNum() {
  const n = invoiceStore.get().reduce((m, i) => Math.max(m, parseInt(String(i.num).replace(/\D/g, ''), 10) || 0), 2800);
  return 'INV-' + (n + 1);
}

/* ── Brand Kit Store ── (persisted branding — pay page + email templates read this) */
const brandStore = createShieldStore('brand', {
  company: 'ShieldTech Solutions LLC', tagline: 'Security · Monitoring · Service',
  address: '1234 Security Way, Philadelphia, PA 19103', phone: '(215) 555-0100',
  email: 'billing@shieldtechsolutions.com', license: 'PA HIC #PA123456',
  logoInitials: 'ST',
});

/* ── Pay-page focus (invoice num to display) ── */
const payFocusStore = createShieldStore('payfocus', null);

/* ── Outbox Store ── (every "send" produces a real merged email record here.
   Actual delivery needs an email backend — queued records are the honest state.) */
const outboxStore = createShieldStore('outbox', []);
function queueEmail({ to, customer, subject, body, invoice, payLink, kind }) {
  const rec = { id: genId('EM'), to, customer, subject, body, invoice: invoice || null, payLink: payLink || null, kind: kind || 'invoice', at: Date.now(), status: 'queued' };
  outboxStore.set(prev => [rec, ...prev]);
  return rec;
}
/* Merge an invoice into the branded email template ({customer}/{amount}/{due_date}/{link}) */
function buildInvoiceEmail(inv, kindLabel) {
  const b = brandStore.get();
  const link = `pay.shieldtech.com/${inv.num.toLowerCase()}`;
  const kind = kindLabel || 'invoice';
  return {
    to: `billing@${(inv.customer || 'customer').toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
    customer: inv.customer,
    subject: `Your ${kind} from ${b.company} — $${inv.amount.toLocaleString()}`,
    body: `Hi ${inv.customer},\n\nPlease find your ${kind} ${inv.num} attached. Total: $${inv.amount.toLocaleString()}, due ${inv.due}.\n\nView and pay online: ${link}\n\nThank you,\n${b.company}\n${b.phone} · ${b.email}\n${b.license}`,
    invoice: inv.num,
    payLink: link,
    kind,
  };
}

/* ── Toast helper ── */
function showToast(msg, type = 'info') {
  window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg, type } }));
}

/* ── Cross-nav helper ── */
function navTo(screen) { window.__shieldNav?.(screen); }

/* ── ID generator ── */
function genId(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
}

/* ── Format duration ── */
function fmtDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

Object.assign(window, { invoiceStore, nextInvoiceNum, brandStore, payFocusStore, outboxStore, queueEmail, buildInvoiceEmail });

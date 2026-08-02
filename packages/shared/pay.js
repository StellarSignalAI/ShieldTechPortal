/* Payments client — window.__shieldPay.
   Bridges the portal UI to the invoice-pay edge function + invoice_links:
     status()                → {stripe, resend} connection lights
     createLink(inv, email)  → tokenized public pay page (+ Stripe checkout
                               when connected) and emails the customer
     list()                  → all payment-link records (staff RLS)
     pendingApply()          → paid-but-not-applied records (poll target)
     markApplied(id)         → portal marked its local invoice paid
     recordPaid(ref)         → office recorded a manual payment
     applyPayments()         → poll + mark local invoices paid (safe anywhere)
   Degrades gracefully (ok:false) when Supabase isn't configured. */
import { supabase, supabaseConfigured } from './supabase.js';

const FN = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invoice-pay`;

async function call(body) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  try {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(FN(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}

const status = () => call({ action: 'status' });
const pendingApply = () => call({ action: 'pending-apply' });
const markApplied = (id) => call({ action: 'mark-applied', id });
const recordPaid = (ref) => call({ action: 'record-paid', ref });

/* inv: a mapInvoiceRow-shaped row ({num, customer, amount, lines, due, _raw}) */
function createLink(inv, email) {
  const rawDue = (inv._raw && inv._raw.due_date) || null;
  return call({
    action: 'create',
    invoice: {
      ref: inv.num, customer: inv.customer, email: email || null,
      amount: inv.amount, lines: inv.lines || [],
      due: rawDue || null,
    },
  });
}

async function list() {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  const { data, error } = await supabase
    .from('invoice_links').select('*').order('created_at', { ascending: false });
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

/* Pull completed payments (Stripe webhook or manual record) and mark the
   matching local invoice paid. Safe to call on any screen mount. */
async function applyPayments() {
  const r = await pendingApply().catch(() => null);
  if (!r || !r.ok || !r.data.length) return { applied: 0 };
  let applied = 0;
  for (const rec of r.data) {
    const store = window.invoiceStore;
    if (store) {
      store.set(prev => (prev || []).map(i => (i.num || i.doc_number) === rec.invoice_ref
        ? { ...i, status: 'paid', balance: 0, days: 0, paidAt: Date.parse(rec.paid_at) || Date.now(), paidVia: rec.paid_via || 'stripe' } : i));
    }
    await markApplied(rec.id).catch(() => {});
    applied++;
    if (window.showToast) window.showToast(`Payment received — ${rec.invoice_ref} ($${Number(rec.amount || 0).toLocaleString()}) marked paid`, 'ok');
  }
  return { applied };
}

window.__shieldPay = { status, createLink, list, pendingApply, markApplied, recordPaid, applyPayments };
window.__shieldSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

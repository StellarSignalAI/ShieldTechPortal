/* Shared QuickBooks layer — reads the qbo_* landing tables and triggers the
   qbo-sync edge function. Exposed as window.__shieldQBO for the vendored proto
   Finance screens. Every call degrades gracefully when Supabase is
   unconfigured or the tables are empty (returns { ok:false } / empty arrays),
   so the Finance suite falls back to its existing demo rendering untouched. */
import { supabase, supabaseConfigured } from './supabase.js';

const notConfigured = { ok: false, error: 'Backend not configured' };

async function fnHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

async function readAll(table, opts = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  let q = supabase.from(table).select('*');
  if (opts.order) q = q.order(opts.order.col, { ascending: !!opts.order.asc });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

export const customers = (limit = 1000) =>
  readAll('qbo_customers', { order: { col: 'display_name', asc: true }, limit });

export const items = (limit = 1000) =>
  readAll('qbo_items', { order: { col: 'name', asc: true }, limit });

export const invoices = ({ status, limit = 500 } = {}) =>
  (async () => {
    if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
    let q = supabase.from('qbo_invoices').select('*').order('txn_date', { ascending: false }).limit(limit);
    if (status && status !== 'All') q = q.eq('status', String(status).toLowerCase());
    const { data, error } = await q;
    return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
  })();

export const estimates = (limit = 500) =>
  readAll('qbo_estimates', { order: { col: 'txn_date', asc: false }, limit });

export const employees = (limit = 500) =>
  readAll('qbo_employees', { order: { col: 'name', asc: true }, limit });

export const payslips = (limit = 500) =>
  readAll('qbo_payslips', { order: { col: 'pay_date', asc: false }, limit });

export const vendors = (limit = 1000) =>
  readAll('qbo_vendors', { order: { col: 'display_name', asc: true }, limit });

export const bills = (limit = 500) =>
  readAll('qbo_bills', { order: { col: 'txn_date', asc: false }, limit });

export const purchases = (limit = 500) =>
  readAll('qbo_purchases', { order: { col: 'txn_date', asc: false }, limit });

export const payments = (limit = 500) =>
  readAll('qbo_payments', { order: { col: 'txn_date', asc: false }, limit });

export const accounts = (limit = 500) =>
  readAll('qbo_accounts', { order: { col: 'acct_num', asc: true }, limit });

/* Latest snapshot of a financial report (profit_loss | balance_sheet |
   ar_aging | ap_aging | sales_by_customer | sales_by_product). */
export async function report(reportType) {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase
    .from('qbo_report_snapshots').select('*')
    .eq('report_type', reportType)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export async function syncState() {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase
    .from('qbo_sync_state').select('*').eq('id', 1).maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

/* Trigger a fresh pull from QuickBooks now (Admin/Staff). Returns the sync
   summary. Requires the qbo-sync edge function + Intuit credentials to be
   configured server-side; otherwise reports that cleanly. */
export async function syncNow(direction = 'pull') {
  if (!supabaseConfigured) return notConfigured;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qbo-sync`, {
      method: 'POST',
      headers: await fnHeaders(),
      body: JSON.stringify({ direction }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/* Whether any real QBO data has landed yet — lets screens choose live vs demo. */
export async function hasData() {
  if (!supabaseConfigured) return false;
  const { count } = await supabase
    .from('qbo_invoices').select('qbo_id', { count: 'exact', head: true });
  if (count && count > 0) return true;
  const { count: c2 } = await supabase
    .from('qbo_customers').select('qbo_id', { count: 'exact', head: true });
  return !!(c2 && c2 > 0);
}

window.__shieldQBO = {
  customers, items, invoices, estimates, employees, payslips,
  vendors, bills, purchases, payments, accounts,
  report, syncState, syncNow, hasData,
};

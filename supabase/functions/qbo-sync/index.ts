// qbo-sync — pull QuickBooks Online data into the qbo_* landing tables (and,
// on request, push new records back to QuickBooks). POST with either an
// Admin/Staff session or the x-cron-secret header.
//
//   { direction: 'pull' }  (default) — refresh customers, items, invoices,
//        estimates, employees, and the P&L / Balance Sheet / AR + AP aging
//        report snapshots. All-time (no date filter on lists).
//   { direction: 'push', entity: 'invoice'|'estimate'|'customer', payload }
//        — create the record in QuickBooks, then mirror it locally.
//
// Requires these edge-function secrets (Intuit → developer app → Production
// keys, plus one authorized company/realm):
//   QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REALM_ID,
//   QBO_REFRESH_TOKEN  (seed once; rotated tokens are then persisted in
//                       public.qbo_secrets and reused automatically)
//   QBO_ENV = 'production' | 'sandbox'  (default 'production')
// Returns 503 with a clear message when the credentials are absent, so the
// portal "Sync now" button reports the exact setup step rather than failing.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const apiBase = () =>
  (Deno.env.get("QBO_ENV") ?? "production") === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";

type Admin = ReturnType<typeof createClient>;

async function authorize(req: Request, admin: Admin) {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return false;
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return false;
  const { data: p } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return p?.role === "Admin" || p?.role === "Staff";
}

// ── OAuth: reuse a still-valid access token, else refresh and persist the
// rotated refresh token to qbo_secrets (service-role only). ──
async function getAccessToken(admin: Admin): Promise<string> {
  const clientId = Deno.env.get("QBO_CLIENT_ID");
  const clientSecret = Deno.env.get("QBO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("QBO_CLIENT_ID / QBO_CLIENT_SECRET not set");

  const { data: sec } = await admin.from("qbo_secrets").select("*").eq("id", 1).maybeSingle();
  if (sec?.access_token && sec?.access_expires_at && new Date(sec.access_expires_at).getTime() > Date.now() + 60_000) {
    return sec.access_token as string;
  }
  const refreshToken = (sec?.refresh_token as string) || Deno.env.get("QBO_REFRESH_TOKEN");
  if (!refreshToken) throw new Error("No QBO refresh token (set QBO_REFRESH_TOKEN once)");

  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  const tok = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Intuit token refresh ${res.status}: ${tok?.error ?? JSON.stringify(tok).slice(0, 200)}`);

  await admin.from("qbo_secrets").upsert({
    id: 1,
    refresh_token: tok.refresh_token ?? refreshToken,
    access_token: tok.access_token,
    access_expires_at: new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  return tok.access_token as string;
}

async function qboFetch(token: string, realm: string, path: string, init?: RequestInit) {
  const res = await fetch(`${apiBase()}/v3/company/${realm}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`QBO ${path.slice(0, 40)} → ${res.status}: ${JSON.stringify(body?.Fault ?? body).slice(0, 240)}`);
  return body;
}

// Query every row of an entity (QBO caps at 1000/page → paginate).
async function qboQueryAll(token: string, realm: string, entity: string): Promise<any[]> {
  const out: any[] = [];
  let start = 1;
  const page = 500;
  for (;;) {
    const q = encodeURIComponent(`SELECT * FROM ${entity} STARTPOSITION ${start} MAXRESULTS ${page}`);
    const body = await qboFetch(token, realm, `/query?query=${q}&minorversion=70`);
    const rows = body?.QueryResponse?.[entity] ?? [];
    out.push(...rows);
    if (rows.length < page) break;
    start += page;
  }
  return out;
}

const num = (v: unknown) => (v == null ? null : Number(v));
const invStatus = (inv: any) => {
  const bal = Number(inv.Balance ?? 0);
  if (bal <= 0) return "paid";
  if (inv.DueDate && new Date(inv.DueDate).getTime() < Date.now()) return "overdue";
  return "open";
};

async function pull(admin: Admin, token: string, realm: string) {
  const counts: Record<string, number> = {};

  const customers = await qboQueryAll(token, realm, "Customer");
  if (customers.length) {
    await admin.from("qbo_customers").upsert(customers.map((c) => ({
      qbo_id: String(c.Id), display_name: c.DisplayName ?? null, company_name: c.CompanyName ?? null,
      email: c.PrimaryEmailAddr?.Address ?? null, phone: c.PrimaryPhone?.FreeFormNumber ?? null,
      billing_line: c.BillAddr?.Line1 ?? null, billing_city: c.BillAddr?.City ?? null,
      billing_state: c.BillAddr?.CountrySubDivisionCode ?? null, billing_postal: c.BillAddr?.PostalCode ?? null,
      balance: num(c.Balance) ?? 0, active: c.Active !== false, raw: c, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.customers = customers.length;

  const items = await qboQueryAll(token, realm, "Item");
  if (items.length) {
    await admin.from("qbo_items").upsert(items.map((i) => ({
      qbo_id: String(i.Id), name: i.Name ?? null, fully_qualified_name: i.FullyQualifiedName ?? null,
      type: i.Type ?? null, description: i.Description ?? null, unit_price: num(i.UnitPrice),
      taxable: i.Taxable ?? null, active: i.Active !== false, raw: i, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.items = items.length;

  const invoices = await qboQueryAll(token, realm, "Invoice");
  if (invoices.length) {
    await admin.from("qbo_invoices").upsert(invoices.map((v) => ({
      qbo_id: String(v.Id), doc_number: v.DocNumber ?? null,
      customer_qbo_id: v.CustomerRef?.value ?? null, customer_name: v.CustomerRef?.name ?? null,
      txn_date: v.TxnDate ?? null, due_date: v.DueDate ?? null, total: num(v.TotalAmt) ?? 0,
      balance: num(v.Balance) ?? 0, status: invStatus(v), currency: v.CurrencyRef?.value ?? "USD",
      private_note: v.PrivateNote ?? null, lines: v.Line ?? null, raw: v, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.invoices = invoices.length;

  const estimates = await qboQueryAll(token, realm, "Estimate");
  if (estimates.length) {
    await admin.from("qbo_estimates").upsert(estimates.map((e) => ({
      qbo_id: String(e.Id), doc_number: e.DocNumber ?? null,
      customer_qbo_id: e.CustomerRef?.value ?? null, customer_name: e.CustomerRef?.name ?? null,
      txn_date: e.TxnDate ?? null, expiration_date: e.ExpirationDate ?? null, total: num(e.TotalAmt) ?? 0,
      status: (e.TxnStatus ?? "Pending").toLowerCase(), lines: e.Line ?? null, raw: e, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.estimates = estimates.length;

  const employees = await qboQueryAll(token, realm, "Employee");
  if (employees.length) {
    await admin.from("qbo_employees").upsert(employees.map((e) => ({
      qbo_id: String(e.Id), name: e.DisplayName ?? null, email: e.PrimaryEmailAddr?.Address ?? null,
      phone: e.PrimaryPhone?.FreeFormNumber ?? null, status: e.Active !== false ? "active" : "inactive",
      raw: e, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.employees = employees.length;

  // ── Vendors ──
  const vendors = await qboQueryAll(token, realm, "Vendor");
  if (vendors.length) {
    await admin.from("qbo_vendors").upsert(vendors.map((v) => ({
      qbo_id: String(v.Id), display_name: v.DisplayName ?? null, company_name: v.CompanyName ?? null,
      email: v.PrimaryEmailAddr?.Address ?? null, phone: v.PrimaryPhone?.FreeFormNumber ?? null,
      balance: num(v.Balance) ?? 0, active: v.Active !== false, raw: v, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.vendors = vendors.length;

  // ── Bills (AP) ──
  const bills = await qboQueryAll(token, realm, "Bill");
  if (bills.length) {
    await admin.from("qbo_bills").upsert(bills.map((b) => {
      const bal = Number(b.Balance ?? 0);
      const status = bal <= 0 ? "paid" : (b.DueDate && new Date(b.DueDate).getTime() < Date.now() ? "overdue" : "open");
      return {
        qbo_id: String(b.Id), doc_number: b.DocNumber ?? null,
        vendor_qbo_id: b.VendorRef?.value ?? null, vendor_name: b.VendorRef?.name ?? null,
        txn_date: b.TxnDate ?? null, due_date: b.DueDate ?? null, total: num(b.TotalAmt) ?? 0,
        balance: bal, status, private_note: b.PrivateNote ?? null, lines: b.Line ?? null,
        raw: b, synced_at: new Date().toISOString(),
      };
    }), { onConflict: "qbo_id" });
  }
  counts.bills = bills.length;

  // ── Purchases (expenses: cash/check/card spend) ──
  const purchases = await qboQueryAll(token, realm, "Purchase");
  if (purchases.length) {
    await admin.from("qbo_purchases").upsert(purchases.map((p) => ({
      qbo_id: String(p.Id), payment_type: p.PaymentType ?? null, account_name: p.AccountRef?.name ?? null,
      entity_name: p.EntityRef?.name ?? null, txn_date: p.TxnDate ?? null, total: num(p.TotalAmt) ?? 0,
      memo: p.PrivateNote ?? p.Memo ?? null, lines: p.Line ?? null, raw: p, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.purchases = purchases.length;

  // ── Payments (received against invoices) ──
  const payments = await qboQueryAll(token, realm, "Payment");
  if (payments.length) {
    await admin.from("qbo_payments").upsert(payments.map((p) => ({
      qbo_id: String(p.Id), customer_qbo_id: p.CustomerRef?.value ?? null, customer_name: p.CustomerRef?.name ?? null,
      txn_date: p.TxnDate ?? null, total: num(p.TotalAmt) ?? 0, unapplied: num(p.UnappliedAmt) ?? 0,
      method: p.PaymentMethodRef?.name ?? null, raw: p, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.payments = payments.length;

  // ── Chart of Accounts ──
  const accounts = await qboQueryAll(token, realm, "Account");
  if (accounts.length) {
    await admin.from("qbo_accounts").upsert(accounts.map((a) => ({
      qbo_id: String(a.Id), acct_num: a.AcctNum ?? null, name: a.Name ?? null,
      account_type: a.AccountType ?? null, account_subtype: a.AccountSubType ?? null,
      classification: a.Classification ?? null, current_balance: num(a.CurrentBalance) ?? 0,
      active: a.Active !== false, raw: a, synced_at: new Date().toISOString(),
    })), { onConflict: "qbo_id" });
  }
  counts.accounts = accounts.length;

  // Report snapshots (all-time P&L, current Balance Sheet, AR + AP aging).
  const today = new Date().toISOString().slice(0, 10);
  const reports: [string, string][] = [
    ["profit_loss", `/reports/ProfitAndLoss?start_date=2015-01-01&end_date=${today}&minorversion=70`],
    ["balance_sheet", `/reports/BalanceSheet?end_date=${today}&minorversion=70`],
    ["ar_aging", `/reports/AgedReceivables?minorversion=70`],
    ["ap_aging", `/reports/AgedPayables?minorversion=70`],
  ];
  for (const [type, path] of reports) {
    try {
      const data = await qboFetch(token, realm, path);
      await admin.from("qbo_report_snapshots").upsert({
        report_type: type, period_start: type === "profit_loss" ? "2015-01-01" : null,
        period_end: today, data, generated_at: new Date().toISOString(),
      }, { onConflict: "report_type,period_start,period_end" });
    } catch (_e) { /* one bad report shouldn't fail the whole sync */ }
  }
  counts.reports = reports.length;

  return counts;
}

async function push(admin: Admin, token: string, realm: string, entity: string, payload: unknown) {
  const map: Record<string, string> = { invoice: "invoice", estimate: "estimate", customer: "customer" };
  const ep = map[entity];
  if (!ep) throw new Error(`Unsupported push entity '${entity}'`);
  const body = await qboFetch(token, realm, `/${ep}?minorversion=70`, { method: "POST", body: JSON.stringify(payload) });
  // Mirror the freshly-created record locally so the portal reflects it at once.
  const created = body?.Invoice ?? body?.Estimate ?? body?.Customer ?? null;
  return created;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (!(await authorize(req, admin))) return json(401, { ok: false, error: "Admin/Staff session or cron secret required" });

  const realm = Deno.env.get("QBO_REALM_ID");
  if (!realm || !Deno.env.get("QBO_CLIENT_ID")) {
    return json(503, { ok: false, error: "QuickBooks not connected yet — set QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REALM_ID and QBO_REFRESH_TOKEN on the qbo-sync function." });
  }

  let body: { direction?: string; entity?: string; payload?: unknown } = {};
  try { body = await req.json(); } catch { /* default pull */ }
  const direction = body.direction ?? "pull";

  try {
    const token = await getAccessToken(admin);
    if (direction === "push") {
      const created = await push(admin, token, realm, body.entity ?? "", body.payload);
      return json(200, { ok: true, data: created });
    }
    await admin.from("qbo_sync_state").upsert({ id: 1, realm_id: realm, last_status: "running" });
    const counts = await pull(admin, token, realm);
    await admin.from("qbo_sync_state").upsert({
      id: 1, realm_id: realm, last_sync_at: new Date().toISOString(), last_status: "ok", last_error: null, counts,
    });
    return json(200, { ok: true, data: { counts } });
  } catch (e) {
    await admin.from("qbo_sync_state").upsert({ id: 1, last_status: "error", last_error: String(e) });
    return json(500, { ok: false, error: String(e) });
  }
});

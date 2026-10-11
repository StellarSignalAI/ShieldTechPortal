// qbo-sync — pull QuickBooks Online data into the qbo_* landing tables and
// push transactions back to QuickBooks (the "+ New" engine). POST with either
// an Admin/Staff session or the x-cron-secret header.
//
//   { direction: 'pull' }  (default) — refresh customers, items, invoices,
//        estimates, employees, vendors, bills, purchases, payments, accounts
//        and the P&L / Balance Sheet / AR + AP aging report snapshots.
//   { direction: 'push', entity, payload } — create a record in QuickBooks from
//        a portal-shaped payload (names, not Intuit ids), then mirror it into
//        the landing tables so every screen reflects it at once. Entities:
//          customer    { name, company?, email?, phone? }
//          vendor      { name, company?, email?, phone? }
//          item        { name, type?='Service'|'NonInventory', price?, description?, taxable?, incomeAccount? }
//          invoice | estimate  (same dual-shape doc as push-doc)
//          payment     { invoiceQboId? | docNumber?, amount, date?, method?, memo?, depositTo? }
//                      — "Receive payment" against an open invoice; skipped
//                        (not duplicated) when the invoice is already paid.
//          purchase    { vendor?, amount | lines[], date?, paymentType?='Cash'|'Check'|'CreditCard',
//                        category?, paidFrom?, memo?, reference? }   — "Expense"
//          bill        { vendor, amount | lines[], date?, dueDate?, docNumber?, category?, memo? }
//          billpayment { billQboId, amount?, date?, payType?='Check'|'CreditCard', paidFrom?, memo? }
//   { direction: 'push-doc', doc }  — hybrid push: a portal doc row → QBO
//        Invoice/Estimate (find-or-create customer + service item).
//   { action: 'status' }  — connection light; never 503s.
//
// Requires these edge-function secrets (Intuit → developer app → Production
// keys, plus one authorized company/realm):
//   QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REALM_ID,
//   QBO_REFRESH_TOKEN  (seed once; rotated tokens are then persisted in
//                       public.qbo_secrets and reused automatically)
//   QBO_ENV = 'production' | 'sandbox'  (default 'production')
// Returns 503 with a clear message when the credentials are absent, so the
// portal reports the exact setup step rather than failing.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const MV = "minorversion=70";
const apiBase = () =>
  (Deno.env.get("QBO_ENV") ?? "production") === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";

type Admin = ReturnType<typeof createClient>;
type Ctx = { admin: Admin; token: string; realm: string };
// deno-lint-ignore no-explicit-any
type Any = any;

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
const get = (c: Ctx, path: string) => qboFetch(c.token, c.realm, path);
const post = (c: Ctx, path: string, body: unknown) =>
  qboFetch(c.token, c.realm, path, { method: "POST", body: JSON.stringify(body) });
const esc = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
async function query(c: Ctx, sql: string): Promise<Any> {
  const body = await get(c, `/query?query=${encodeURIComponent(sql)}&${MV}`);
  return body?.QueryResponse ?? {};
}

// Query every row of an entity (QBO caps at 1000/page → paginate).
async function qboQueryAll(c: Ctx, entity: string): Promise<Any[]> {
  const out: Any[] = [];
  let start = 1;
  const page = 500;
  for (;;) {
    const qr = await query(c, `SELECT * FROM ${entity} STARTPOSITION ${start} MAXRESULTS ${page}`);
    const rows = qr?.[entity] ?? [];
    out.push(...rows);
    if (rows.length < page) break;
    start += page;
  }
  return out;
}

const num = (v: unknown) => (v == null ? null : Number(v));
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const isoDate = (v: unknown) => (v && /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : today());
const openStatus = (bal: number, due?: string | null) =>
  bal <= 0 ? "paid" : (due && new Date(due).getTime() < Date.now() ? "overdue" : "open");
const invStatus = (inv: Any) => openStatus(Number(inv.Balance ?? 0), inv.DueDate);

// ── Landing-table row mappers (shared by pull + every push mirror) ──
const mapCustomer = (c: Any) => ({
  qbo_id: String(c.Id), display_name: c.DisplayName ?? null, company_name: c.CompanyName ?? null,
  email: c.PrimaryEmailAddr?.Address ?? null, phone: c.PrimaryPhone?.FreeFormNumber ?? null,
  billing_line: c.BillAddr?.Line1 ?? null, billing_city: c.BillAddr?.City ?? null,
  billing_state: c.BillAddr?.CountrySubDivisionCode ?? null, billing_postal: c.BillAddr?.PostalCode ?? null,
  balance: num(c.Balance) ?? 0, active: c.Active !== false, raw: c, synced_at: now(),
});
const mapItem = (i: Any) => ({
  qbo_id: String(i.Id), name: i.Name ?? null, fully_qualified_name: i.FullyQualifiedName ?? null,
  type: i.Type ?? null, description: i.Description ?? null, unit_price: num(i.UnitPrice),
  taxable: i.Taxable ?? null, active: i.Active !== false, raw: i, synced_at: now(),
});
const mapInvoice = (v: Any) => ({
  qbo_id: String(v.Id), doc_number: v.DocNumber ?? null,
  customer_qbo_id: v.CustomerRef?.value ?? null, customer_name: v.CustomerRef?.name ?? null,
  txn_date: v.TxnDate ?? null, due_date: v.DueDate ?? null, total: num(v.TotalAmt) ?? 0,
  balance: num(v.Balance) ?? 0, status: invStatus(v), currency: v.CurrencyRef?.value ?? "USD",
  private_note: v.PrivateNote ?? null, lines: v.Line ?? null, raw: v, synced_at: now(),
});
const mapEstimate = (e: Any) => ({
  qbo_id: String(e.Id), doc_number: e.DocNumber ?? null,
  customer_qbo_id: e.CustomerRef?.value ?? null, customer_name: e.CustomerRef?.name ?? null,
  txn_date: e.TxnDate ?? null, expiration_date: e.ExpirationDate ?? null, total: num(e.TotalAmt) ?? 0,
  status: (e.TxnStatus ?? "Pending").toLowerCase(), lines: e.Line ?? null, raw: e, synced_at: now(),
});
const mapEmployee = (e: Any) => ({
  qbo_id: String(e.Id), name: e.DisplayName ?? null, email: e.PrimaryEmailAddr?.Address ?? null,
  phone: e.PrimaryPhone?.FreeFormNumber ?? null, status: e.Active !== false ? "active" : "inactive",
  raw: e, synced_at: now(),
});
const mapVendor = (v: Any) => ({
  qbo_id: String(v.Id), display_name: v.DisplayName ?? null, company_name: v.CompanyName ?? null,
  email: v.PrimaryEmailAddr?.Address ?? null, phone: v.PrimaryPhone?.FreeFormNumber ?? null,
  balance: num(v.Balance) ?? 0, active: v.Active !== false, raw: v, synced_at: now(),
});
const mapBill = (b: Any) => {
  const bal = Number(b.Balance ?? 0);
  return {
    qbo_id: String(b.Id), doc_number: b.DocNumber ?? null,
    vendor_qbo_id: b.VendorRef?.value ?? null, vendor_name: b.VendorRef?.name ?? null,
    txn_date: b.TxnDate ?? null, due_date: b.DueDate ?? null, total: num(b.TotalAmt) ?? 0,
    balance: bal, status: openStatus(bal, b.DueDate), private_note: b.PrivateNote ?? null, lines: b.Line ?? null,
    raw: b, synced_at: now(),
  };
};
const mapPurchase = (p: Any) => ({
  qbo_id: String(p.Id), payment_type: p.PaymentType ?? null, account_name: p.AccountRef?.name ?? null,
  entity_name: p.EntityRef?.name ?? null, txn_date: p.TxnDate ?? null, total: num(p.TotalAmt) ?? 0,
  memo: p.PrivateNote ?? p.Memo ?? null, lines: p.Line ?? null, raw: p, synced_at: now(),
});
const mapPayment = (p: Any) => ({
  qbo_id: String(p.Id), customer_qbo_id: p.CustomerRef?.value ?? null, customer_name: p.CustomerRef?.name ?? null,
  txn_date: p.TxnDate ?? null, total: num(p.TotalAmt) ?? 0, unapplied: num(p.UnappliedAmt) ?? 0,
  method: p.PaymentMethodRef?.name ?? null, raw: p, synced_at: now(),
});
const mapAccount = (a: Any) => ({
  qbo_id: String(a.Id), acct_num: a.AcctNum ?? null, name: a.Name ?? null,
  account_type: a.AccountType ?? null, account_subtype: a.AccountSubType ?? null,
  classification: a.Classification ?? null, current_balance: num(a.CurrentBalance) ?? 0,
  active: a.Active !== false, raw: a, synced_at: now(),
});

const upsert = (c: Ctx, table: string, rows: Any[]) =>
  rows.length ? c.admin.from(table).upsert(rows, { onConflict: "qbo_id" }) : Promise.resolve();

async function pull(c: Ctx) {
  const counts: Record<string, number> = {};
  const land = async (entity: string, table: string, map: (x: Any) => Any) => {
    const rows = await qboQueryAll(c, entity);
    await upsert(c, table, rows.map(map));
    counts[table.replace("qbo_", "")] = rows.length;
  };
  await land("Customer", "qbo_customers", mapCustomer);
  await land("Item", "qbo_items", mapItem);
  await land("Invoice", "qbo_invoices", mapInvoice);
  await land("Estimate", "qbo_estimates", mapEstimate);
  await land("Employee", "qbo_employees", mapEmployee);
  await land("Vendor", "qbo_vendors", mapVendor);
  await land("Bill", "qbo_bills", mapBill);
  await land("Purchase", "qbo_purchases", mapPurchase);
  await land("Payment", "qbo_payments", mapPayment);
  await land("Account", "qbo_accounts", mapAccount);

  // Report snapshots (all-time P&L, current Balance Sheet, AR + AP aging).
  const day = today();
  const reports: [string, string][] = [
    ["profit_loss", `/reports/ProfitAndLoss?start_date=2015-01-01&end_date=${day}&${MV}`],
    ["balance_sheet", `/reports/BalanceSheet?end_date=${day}&${MV}`],
    ["ar_aging", `/reports/AgedReceivables?${MV}`],
    ["ap_aging", `/reports/AgedPayables?${MV}`],
  ];
  for (const [type, path] of reports) {
    try {
      const data = await get(c, path);
      await c.admin.from("qbo_report_snapshots").upsert({
        report_type: type, period_start: type === "profit_loss" ? "2015-01-01" : null,
        period_end: day, data, generated_at: now(),
      }, { onConflict: "report_type,period_start,period_end" });
    } catch (_e) { /* one bad report shouldn't fail the whole sync */ }
  }
  counts.reports = reports.length;
  return counts;
}

/* ══════════════ Reference resolution (find-or-create by name) ══════════════ */

async function ensureCustomer(c: Ctx, name: string, extra: Any = {}) {
  const qr = await query(c, `SELECT * FROM Customer WHERE DisplayName = '${esc(name)}'`);
  let cust = qr?.Customer?.[0];
  if (!cust) {
    const body = await post(c, `/customer?${MV}`, {
      DisplayName: name,
      ...(extra.company ? { CompanyName: extra.company } : {}),
      ...(extra.email ? { PrimaryEmailAddr: { Address: extra.email } } : {}),
      ...(extra.phone ? { PrimaryPhone: { FreeFormNumber: extra.phone } } : {}),
    });
    cust = body?.Customer;
  }
  if (!cust?.Id) throw new Error("Could not resolve QBO customer");
  await upsert(c, "qbo_customers", [mapCustomer(cust)]);
  return cust;
}

async function ensureVendor(c: Ctx, name: string, extra: Any = {}) {
  const qr = await query(c, `SELECT * FROM Vendor WHERE DisplayName = '${esc(name)}'`);
  let v = qr?.Vendor?.[0];
  if (!v) {
    const body = await post(c, `/vendor?${MV}`, {
      DisplayName: name,
      ...(extra.company ? { CompanyName: extra.company } : {}),
      ...(extra.email ? { PrimaryEmailAddr: { Address: extra.email } } : {}),
      ...(extra.phone ? { PrimaryPhone: { FreeFormNumber: extra.phone } } : {}),
    });
    v = body?.Vendor;
  }
  if (!v?.Id) throw new Error("Could not resolve QBO vendor");
  await upsert(c, "qbo_vendors", [mapVendor(v)]);
  return v;
}

/* Account lookup: exact name first, then first account of the type. Accounts
   are the one thing never created implicitly — a wrong category is worse than
   a clear error. */
async function findAccount(c: Ctx, opts: { name?: string; type?: string; types?: string[] }) {
  if (opts.name) {
    const qr = await query(c, `SELECT * FROM Account WHERE Name = '${esc(opts.name)}' AND Active = true`);
    if (qr?.Account?.[0]) return qr.Account[0];
    // "6200 · Vehicle" / "Vehicle" — tolerate a leading account number.
    const bare = opts.name.replace(/^\s*\d+\s*[·\-:]\s*/, "").trim();
    if (bare && bare !== opts.name) {
      const q2 = await query(c, `SELECT * FROM Account WHERE Name = '${esc(bare)}' AND Active = true`);
      if (q2?.Account?.[0]) return q2.Account[0];
    }
    // Portal categories are words ("Fuel", "Materials"); match the account
    // that contains the word within the allowed types before falling back.
    if (bare) {
      const typeFilter = (opts.types ?? (opts.type ? [opts.type] : [])).map((t) => `AccountType = '${esc(t)}'`).join(" OR ");
      const q3 = await query(c, `SELECT * FROM Account WHERE Name LIKE '%${esc(bare)}%' AND Active = true${typeFilter ? ` AND (${typeFilter})` : ""} MAXRESULTS 1`);
      if (q3?.Account?.[0]) return q3.Account[0];
    }
  }
  const types = opts.types ?? (opts.type ? [opts.type] : []);
  for (const t of types) {
    const qr = await query(c, `SELECT * FROM Account WHERE AccountType = '${esc(t)}' AND Active = true MAXRESULTS 1`);
    if (qr?.Account?.[0]) return qr.Account[0];
  }
  return null;
}
async function requireAccount(c: Ctx, opts: { name?: string; type?: string; types?: string[] }, what: string) {
  const a = await findAccount(c, opts);
  if (!a?.Id) throw new Error(`No ${what} account found in QuickBooks${opts.name ? ` (looked for "${opts.name}")` : ""}`);
  return a;
}

async function ensureItem(c: Ctx, name: string, extra: Any = {}) {
  const qr = await query(c, `SELECT * FROM Item WHERE Name = '${esc(name)}'`);
  let item = qr?.Item?.[0];
  if (!item) {
    const income = await requireAccount(c, { name: extra.incomeAccount, type: "Income" }, "income");
    const type = extra.type === "NonInventory" ? "NonInventory" : "Service";
    const body = await post(c, `/item?${MV}`, {
      Name: name.slice(0, 100), Type: type,
      IncomeAccountRef: { value: income.Id },
      ...(extra.description ? { Description: String(extra.description).slice(0, 4000) } : {}),
      ...(extra.price != null && extra.price !== "" ? { UnitPrice: Number(extra.price) || 0 } : {}),
      ...(extra.taxable != null ? { Taxable: !!extra.taxable } : {}),
    });
    item = body?.Item;
  }
  if (!item?.Id) throw new Error("Could not resolve QBO item");
  await upsert(c, "qbo_items", [mapItem(item)]);
  return item;
}

async function findPaymentMethod(c: Ctx, name?: string) {
  if (!name) return null;
  const qr = await query(c, `SELECT * FROM PaymentMethod WHERE Name = '${esc(name)}'`);
  return qr?.PaymentMethod?.[0] ?? null;
}

async function refreshInvoice(c: Ctx, id: string) {
  const body = await get(c, `/invoice/${id}?${MV}`);
  if (body?.Invoice) await upsert(c, "qbo_invoices", [mapInvoice(body.Invoice)]);
  return body?.Invoice ?? null;
}
async function refreshBill(c: Ctx, id: string) {
  const body = await get(c, `/bill/${id}?${MV}`);
  if (body?.Bill) await upsert(c, "qbo_bills", [mapBill(body.Bill)]);
  return body?.Bill ?? null;
}

/* Expense-style lines (Purchase / Bill): either explicit lines or one line
   for the total, each categorised to an Expense account. */
async function expenseLines(c: Ctx, p: Any) {
  const fallback = await requireAccount(c, { name: p.category, types: ["Expense", "Cost of Goods Sold", "Other Expense"] }, "expense");
  const src: Any[] = Array.isArray(p.lines) && p.lines.length ? p.lines : [{ desc: p.memo ?? p.description ?? "", amount: Number(p.amount) || 0 }];
  const out: Any[] = [];
  for (const l of src) {
    const amt = Number(l.amount ?? (Number(l.qty) || 1) * (Number(l.rate) || 0)) || 0;
    if (!(amt > 0)) continue;
    const acct = l.category && l.category !== p.category
      ? await requireAccount(c, { name: l.category, types: ["Expense", "Cost of Goods Sold", "Other Expense"] }, "expense")
      : fallback;
    out.push({
      Amount: amt, DetailType: "AccountBasedExpenseLineDetail",
      ...(l.desc ? { Description: String(l.desc).slice(0, 4000) } : {}),
      AccountBasedExpenseLineDetail: { AccountRef: { value: acct.Id } },
    });
  }
  if (!out.length) throw new Error("Amount must be greater than zero");
  return out;
}

/* ══════════════ Hybrid push: portal doc row → Invoice/Estimate ══════════════ */
async function pushDoc(c: Ctx, d: Record<string, unknown>) {
  const kind = d.kind === "estimate" || d.kind === "proposal" ? "estimate" : "invoice";
  const name = String(d.customer_name ?? d.customer ?? "Customer");
  const cust = await ensureCustomer(c, name, { email: d.customer_email });
  // A generic service item to hang free-text lines on.
  const item = await ensureItem(c, "ShieldTech Services");

  const lines = (Array.isArray(d.lines) ? d.lines as Array<Record<string, unknown>> : [])
    .filter((l) => (l.desc || Number(l.rate)))
    .map((l) => ({
      Amount: (Number(l.qty) || 1) * (Number(l.rate) || 0),
      Description: String(l.desc ?? ""),
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: { ItemRef: { value: item.Id }, Qty: Number(l.qty) || 1, UnitPrice: Number(l.rate) || 0 },
    }));
  if (!lines.length) {
    lines.push({
      Amount: Number(d.total ?? d.amount) || 0, Description: "Services per attached proposal",
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: { ItemRef: { value: item.Id }, Qty: 1, UnitPrice: Number(d.total ?? d.amount) || 0 },
    });
  }

  const payload: Record<string, unknown> = {
    CustomerRef: { value: cust.Id },
    ...(d.doc_number || d.num ? { DocNumber: String(d.doc_number ?? d.num).slice(0, 21) } : {}),
    ...(d.txn_date ? { TxnDate: d.txn_date } : {}),
    ...(kind === "invoice" && d.due_date ? { DueDate: d.due_date } : {}),
    ...(kind === "estimate" && d.expiration_date ? { ExpirationDate: d.expiration_date } : {}),
    Line: lines,
  };
  const body = await post(c, `/${kind}?${MV}`, payload);
  const created = body?.Invoice ?? body?.Estimate ?? null;
  if (created) {
    if (kind === "invoice") await upsert(c, "qbo_invoices", [mapInvoice(created)]);
    else await upsert(c, "qbo_estimates", [mapEstimate(created)]);
  }
  return created;
}

/* ══════════════ The "+ New" engine ══════════════ */
async function push(c: Ctx, entity: string, p: Any) {
  p = p ?? {};
  switch (entity) {
    case "customer": {
      if (!p.name) throw new Error("Customer name required");
      return await ensureCustomer(c, String(p.name), p);
    }
    case "vendor": {
      if (!p.name) throw new Error("Vendor name required");
      return await ensureVendor(c, String(p.name), p);
    }
    case "item": {
      if (!p.name) throw new Error("Item name required");
      return await ensureItem(c, String(p.name), p);
    }
    case "invoice":
    case "estimate":
      return await pushDoc(c, { ...p, kind: entity });

    case "payment": {
      // Resolve the invoice by Intuit id or by doc number.
      let inv: Any = null;
      if (p.invoiceQboId && !String(p.invoiceQboId).startsWith("local")) {
        inv = (await get(c, `/invoice/${esc(p.invoiceQboId)}?${MV}`))?.Invoice ?? null;
      }
      if (!inv && p.docNumber) {
        const qr = await query(c, `SELECT * FROM Invoice WHERE DocNumber = '${esc(p.docNumber)}'`);
        inv = qr?.Invoice?.[0] ?? null;
      }
      if (!inv?.Id) throw new Error(`Invoice ${p.docNumber ?? p.invoiceQboId ?? ""} not found in QuickBooks`);
      const balance = Number(inv.Balance ?? 0);
      if (balance <= 0) return { skipped: true, reason: "already paid", invoice: mapInvoice(inv) };
      const amount = Math.min(Number(p.amount) || balance, balance);
      if (!(amount > 0)) throw new Error("Payment amount must be greater than zero");
      const method = await findPaymentMethod(c, p.method);
      const deposit = p.depositTo ? await findAccount(c, { name: p.depositTo, types: ["Bank"] }) : null;
      const body = await post(c, `/payment?${MV}`, {
        CustomerRef: { value: inv.CustomerRef?.value },
        TotalAmt: amount, TxnDate: isoDate(p.date),
        ...(method ? { PaymentMethodRef: { value: method.Id } } : {}),
        ...(deposit ? { DepositToAccountRef: { value: deposit.Id } } : {}),
        ...(p.memo ? { PrivateNote: String(p.memo).slice(0, 4000) } : {}),
        ...(p.reference ? { PaymentRefNum: String(p.reference).slice(0, 21) } : {}),
        Line: [{ Amount: amount, LinkedTxn: [{ TxnId: inv.Id, TxnType: "Invoice" }] }],
      });
      const created = body?.Payment ?? null;
      if (created) await upsert(c, "qbo_payments", [mapPayment(created)]);
      const refreshed = await refreshInvoice(c, inv.Id);
      return { payment: created, invoice: refreshed ? mapInvoice(refreshed) : null };
    }

    case "purchase": {
      const paymentType = ["Cash", "Check", "CreditCard"].includes(p.paymentType) ? p.paymentType : "Cash";
      const paidFrom = await requireAccount(
        c,
        { name: p.paidFrom, types: paymentType === "CreditCard" ? ["Credit Card"] : ["Bank"] },
        paymentType === "CreditCard" ? "credit card" : "bank",
      );
      const vendor = p.vendor ? await ensureVendor(c, String(p.vendor)) : null;
      const body = await post(c, `/purchase?${MV}`, {
        PaymentType: paymentType, AccountRef: { value: paidFrom.Id }, TxnDate: isoDate(p.date),
        ...(vendor ? { EntityRef: { value: vendor.Id, type: "Vendor" } } : {}),
        ...(p.memo ? { PrivateNote: String(p.memo).slice(0, 4000) } : {}),
        ...(p.reference ? { DocNumber: String(p.reference).slice(0, 21) } : {}),
        Line: await expenseLines(c, p),
      });
      const created = body?.Purchase ?? null;
      if (created) await upsert(c, "qbo_purchases", [mapPurchase(created)]);
      return created;
    }

    case "bill": {
      if (!p.vendor) throw new Error("Vendor required");
      const vendor = await ensureVendor(c, String(p.vendor));
      const body = await post(c, `/bill?${MV}`, {
        VendorRef: { value: vendor.Id }, TxnDate: isoDate(p.date),
        ...(p.dueDate ? { DueDate: isoDate(p.dueDate) } : {}),
        ...(p.docNumber ? { DocNumber: String(p.docNumber).slice(0, 21) } : {}),
        ...(p.memo ? { PrivateNote: String(p.memo).slice(0, 4000) } : {}),
        Line: await expenseLines(c, p),
      });
      const created = body?.Bill ?? null;
      if (created) await upsert(c, "qbo_bills", [mapBill(created)]);
      return created;
    }

    case "billpayment": {
      if (!p.billQboId) throw new Error("billQboId required");
      const bill = (await get(c, `/bill/${esc(p.billQboId)}?${MV}`))?.Bill;
      if (!bill?.Id) throw new Error("Bill not found in QuickBooks");
      const balance = Number(bill.Balance ?? 0);
      if (balance <= 0) return { skipped: true, reason: "already paid", bill: mapBill(bill) };
      const amount = Math.min(Number(p.amount) || balance, balance);
      const payType = p.payType === "CreditCard" ? "CreditCard" : "Check";
      const acct = await requireAccount(
        c,
        { name: p.paidFrom, types: payType === "CreditCard" ? ["Credit Card"] : ["Bank"] },
        payType === "CreditCard" ? "credit card" : "bank",
      );
      const body = await post(c, `/billpayment?${MV}`, {
        VendorRef: { value: bill.VendorRef?.value }, PayType: payType, TotalAmt: amount, TxnDate: isoDate(p.date),
        ...(payType === "CreditCard"
          ? { CreditCardPayment: { CCAccountRef: { value: acct.Id } } }
          : { CheckPayment: { BankAccountRef: { value: acct.Id } } }),
        ...(p.memo ? { PrivateNote: String(p.memo).slice(0, 4000) } : {}),
        Line: [{ Amount: amount, LinkedTxn: [{ TxnId: bill.Id, TxnType: "Bill" }] }],
      });
      const created = body?.BillPayment ?? null;
      const refreshed = await refreshBill(c, bill.Id);
      return { billPayment: created, bill: refreshed ? mapBill(refreshed) : null };
    }

    default:
      throw new Error(`Unsupported push entity '${entity}'`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (!(await authorize(req, admin))) return json(401, { ok: false, error: "Admin/Staff session or cron secret required" });

  const realm = Deno.env.get("QBO_REALM_ID");
  const connected = !!(realm && Deno.env.get("QBO_CLIENT_ID"));

  let body: { direction?: string; action?: string; entity?: string; payload?: unknown; doc?: Record<string, unknown> } = {};
  try { body = await req.json(); } catch { /* default pull */ }

  // Connection light for the portal — never 503s.
  if (body.action === "status") {
    const { data: state } = await admin.from("qbo_sync_state").select("last_sync_at, last_status, last_error").eq("id", 1).maybeSingle();
    return json(200, { ok: true, connected, state: state ?? null });
  }

  if (!connected) {
    return json(503, { ok: false, connected: false, error: "QuickBooks not connected yet — set QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REALM_ID and QBO_REFRESH_TOKEN on the qbo-sync function." });
  }

  const direction = body.direction ?? "pull";

  try {
    const token = await getAccessToken(admin);
    const c: Ctx = { admin, token, realm: realm! };
    if (direction === "push-doc") {
      const created = await pushDoc(c, body.doc ?? {});
      return json(200, { ok: true, data: created });
    }
    if (direction === "push") {
      const created = await push(c, body.entity ?? "", body.payload);
      return json(200, { ok: true, data: created });
    }
    await admin.from("qbo_sync_state").upsert({ id: 1, realm_id: realm, last_status: "running" });
    const counts = await pull(c);
    await admin.from("qbo_sync_state").upsert({
      id: 1, realm_id: realm, last_sync_at: now(), last_status: "ok", last_error: null, counts,
    });
    return json(200, { ok: true, data: { counts } });
  } catch (e) {
    if (direction === "pull") await admin.from("qbo_sync_state").upsert({ id: 1, last_status: "error", last_error: String(e) });
    return json(500, { ok: false, error: String(e) });
  }
});

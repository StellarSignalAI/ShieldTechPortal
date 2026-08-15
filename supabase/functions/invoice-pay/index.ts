// invoice-pay — real payment collection, Stripe-ready (connect-later).
//
// POST (Admin/Staff session):
//   {action:'create', invoice:{ref, customer, email, amount, lines, due}}
//     → upserts a tokenized invoice_links row, creates a Stripe Payment Link
//       when STRIPE_SECRET_KEY is set, emails the customer the pay-page link
//       (Resend). Returns {ok, link, stripe, emailed}.
//   {action:'status'}         → {ok, stripe, resend} connection lights
//   {action:'pending-apply'}  → paid-but-not-applied rows (portal marks its
//                               local invoice paid, then calls mark-applied)
//   {action:'mark-applied', id}
//   {action:'record-paid', ref} → office recorded a manual payment; the public
//                               page flips to "paid" too
// POST (cron, x-cron-secret): {mode:'reminders'} → nudge overdue unpaid links
//   (3-day gap, max 4 reminders), returns {sent}.
// GET ?token=... (public, READ-ONLY — safe against email-scanner prefetch):
//   branded invoice page with line items; "Pay now" goes to Stripe checkout
//   when connected, otherwise shows remit-by-check/ACH instructions.
import { createClient } from "npm:@supabase/supabase-js@2";
import { EMAIL_BRAND, esc, invoiceEmail, invoiceReminderEmail, money } from "../_shared/email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const BRAND = {
  company: EMAIL_BRAND.company,
  tagline: EMAIL_BRAND.tagline,
  phone: EMAIL_BRAND.phone,
  email: EMAIL_BRAND.support,
};

function payPage(rec: Record<string, unknown>): Response {
  const paid = rec.status === "paid";
  const lines = Array.isArray(rec.lines) ? rec.lines as Array<Record<string, unknown>> : [];
  const lineRows = lines.map((l) =>
    `<tr><td>${esc(l.desc ?? "")}</td><td class="r">${Number(l.qty) > 1 ? `${Number(l.qty)} × ${money(l.rate)}` : ""}</td><td class="r b">${money((Number(l.qty) || 1) * (Number(l.rate) || 0))}</td></tr>`
  ).join("");
  // Only ever link out to Stripe-hosted checkout — a poisoned stripe_url must
  // not become a lookalike-checkout or javascript: vector on our origin.
  const stripeUrl = typeof rec.stripe_url === "string"
    && /^https:\/\/[a-z0-9.-]*stripe\.com\//i.test(rec.stripe_url) ? rec.stripe_url : null;
  const due = rec.due_date ? new Date(String(rec.due_date) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  const payBlock = paid
    ? `<div class="paidbox"><div class="dot ok">✓</div><h2>Payment received</h2><p>${esc(rec.invoice_ref)} · ${money(rec.amount)}${rec.paid_at ? ` · ${new Date(String(rec.paid_at)).toLocaleDateString()}` : ""}</p><p class="thanks">Thank you for your business.</p></div>`
    : stripeUrl
      ? `<a class="paybtn" href="${esc(stripeUrl)}">Pay ${money(rec.amount)} securely</a><p class="secure">🔒 Secure card / bank payment via Stripe</p>`
      : `<div class="remit"><h3>How to pay</h3><p>Please remit ${money(rec.amount)} by check to ${BRAND.company}, or reply to your invoice email to arrange ACH.</p><p>Questions? ${BRAND.email} · ${BRAND.phone}</p></div>`;
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${esc(rec.invoice_ref)} — ${BRAND.company}</title>
<style>
body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0e14;color:#e6edf3;display:flex;justify-content:center;min-height:100vh}
.wrap{width:100%;max-width:540px;padding:28px 16px}
.head{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.logo{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#3fa9f5,#1c7ed6);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:15px}
.co{font-size:15px;font-weight:700}.tag{font-size:10px;color:#5b6b7f}
.card{padding:22px;border-radius:14px;background:#111722;border:1px solid #1f2a3a;margin-bottom:14px}
.ref{font-family:ui-monospace,monospace;color:#3fa9f5;font-size:13px}
.status{float:right;font-size:10px;text-transform:uppercase;font-weight:700;color:${paid ? "#34d399" : "#fbbf24"}}
.billed{font-size:13px;color:#9fb0c3;margin:6px 0 14px}.billed b{color:#e6edf3}
table{width:100%;border-collapse:collapse;font-size:13px}
td{padding:7px 0;border-bottom:1px solid #17202e;color:#9fb0c3}.r{text-align:right;white-space:nowrap}.b{color:#e6edf3;font-weight:600}
.total{display:flex;justify-content:space-between;padding-top:14px;font-size:15px;font-weight:700}
.total .amt{font-family:ui-monospace,monospace;font-size:22px;color:#3fa9f5}
.paybtn{display:block;text-align:center;padding:15px 0;border-radius:11px;background:linear-gradient(135deg,#3fa9f5,#1c7ed6);color:#fff;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 0 24px -6px rgba(63,169,245,0.5)}
.secure{text-align:center;font-size:11px;color:#5b6b7f;margin-top:10px}
.remit{padding:18px;border-radius:12px;background:#111722;border:1px solid #1f2a3a}.remit h3{margin:0 0 8px;font-size:14px}.remit p{font-size:13px;line-height:1.6;color:#9fb0c3;margin:0 0 6px}
.paidbox{text-align:center;padding:26px;border-radius:14px;background:#111722;border:1px solid #1f2a3a}
.dot{width:48px;height:48px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:22px}
.ok{background:rgba(52,211,153,0.12);color:#34d399;border:2px solid #34d399}
.paidbox h2{font-size:16px;margin:0 0 6px}.paidbox p{font-size:12px;color:#9fb0c3;margin:2px 0}.thanks{margin-top:8px}
.foot{text-align:center;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#5b6b7f;margin-top:20px}
</style></head><body><div class="wrap">
<div class="head"><div class="logo">ST</div><div><div class="co">${BRAND.company}</div><div class="tag">${BRAND.tagline}</div></div></div>
<div class="card">
<span class="status">${paid ? "PAID" : "DUE"}</span>
<span class="ref">${esc(rec.invoice_ref)}</span>
<div class="billed">Billed to <b>${esc(rec.customer_name ?? "Customer")}</b>${due ? ` · due ${due}` : ""}</div>
${lineRows ? `<table>${lineRows}</table>` : ""}
<div class="total"><span>Total due</span><span class="amt">${money(rec.amount)}</span></div>
</div>
${payBlock}
<div class="foot">${BRAND.company} · ${BRAND.phone} · ${BRAND.email}</div>
</div></body></html>`,
    { status: 200, headers: { ...cors, "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function stripeCreateLink(key: string, rec: { ref: string; customer: string; amount: number }) {
  const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
  const call = async (path: string, body: string) => {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message ?? `stripe ${path} failed`);
    return j;
  };
  const price = await call("prices", form({
    currency: "usd",
    unit_amount: String(Math.round(rec.amount * 100)),
    "product_data[name]": `Invoice ${rec.ref} — ${rec.customer}`,
  }));
  const link = await call("payment_links", form({
    "line_items[0][price]": price.id,
    "line_items[0][quantity]": "1",
    "metadata[invoice_ref]": rec.ref,
    "after_completion[type]": "hosted_confirmation",
    "after_completion[hosted_confirmation][custom_message]":
      `Thank you! Payment for invoice ${rec.ref} has been received by ${BRAND.company}.`,
  }));
  return { url: link.url as string, id: link.id as string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ── Public GET: render the pay page (read-only) ──
  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!token) return json(400, { ok: false, error: "missing token" });
    const { data: rec } = await admin.from("invoice_links").select("*").eq("token", token).maybeSingle();
    if (!rec) return json(404, { ok: false, error: "invalid link" });
    return payPage(rec);
  }

  if (req.method !== "POST") return json(405, { ok: false, error: "POST or GET only" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/invoice-pay`;

  // ── Cron: payment reminders for overdue unpaid links ──
  if (body.mode === "reminders") {
    const secret = Deno.env.get("CRON_SECRET");
    if (!secret || req.headers.get("x-cron-secret") !== secret) return json(401, { ok: false, error: "bad cron secret" });
    if (!resendKey) return json(200, { ok: true, sent: 0, note: "resend not configured" });
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();
    const { data: rows } = await admin.from("invoice_links").select("*")
      .eq("status", "sent").lt("due_date", today).lt("reminder_count", 4)
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${cutoff}`)
      .not("customer_email", "is", null).limit(25);
    let sent = 0;
    for (const rec of rows ?? []) {
      const days = Math.max(1, Math.round((Date.now() - new Date(rec.due_date + "T00:00:00").getTime()) / 86400000));
      const mail = invoiceReminderEmail({
        ref: String(rec.invoice_ref), amount: Number(rec.amount) || 0,
        dueDate: String(rec.due_date), daysPast: days, link: `${base}?token=${rec.token}`,
      });
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech Security <no-reply@shieldtechsolutions.com>",
          to: [rec.customer_email],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      if (res.ok) {
        sent++;
        await admin.from("invoice_links").update({
          reminder_count: (rec.reminder_count ?? 0) + 1, last_reminder_at: new Date().toISOString(),
        }).eq("id", rec.id);
      }
    }
    return json(200, { ok: true, sent });
  }

  // ── Staff auth for everything else ──
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "sign in required" });
  const { data: userData } = await admin.auth.getUser(jwt);
  if (!userData?.user) return json(401, { ok: false, error: "sign in required" });
  const { data: prof } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (!(prof?.role === "Admin" || prof?.role === "Staff")) return json(403, { ok: false, error: "Admin/Staff only" });

  if (body.action === "status") {
    return json(200, { ok: true, stripe: !!stripeKey, resend: !!resendKey });
  }

  if (body.action === "pending-apply") {
    const { data } = await admin.from("invoice_links").select("id, invoice_ref, amount, paid_at, paid_via")
      .eq("status", "paid").is("applied_at", null);
    return json(200, { ok: true, data: data ?? [] });
  }

  if (body.action === "mark-applied") {
    await admin.from("invoice_links").update({ applied_at: new Date().toISOString() }).eq("id", body.id);
    return json(200, { ok: true });
  }

  if (body.action === "record-paid") {
    const { error } = await admin.from("invoice_links").update({
      status: "paid", paid_at: new Date().toISOString(), paid_via: "manual", applied_at: new Date().toISOString(),
    }).eq("invoice_ref", body.ref);
    return error ? json(500, { ok: false, error: error.message }) : json(200, { ok: true });
  }

  if (body.action === "create") {
    const inv = (body.invoice ?? {}) as Record<string, unknown>;
    const ref = String(inv.ref ?? "").trim();
    if (!ref) return json(400, { ok: false, error: "invoice.ref required" });
    const amount = Number(inv.amount) || 0;
    const customer = String(inv.customer ?? "Customer");
    const email = String(inv.email ?? "").trim() || null;

    // Reuse the existing row/token for this invoice, or mint a new one.
    const { data: existing } = await admin.from("invoice_links").select("*").eq("invoice_ref", ref).maybeSingle();
    const token = existing?.token ?? (crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""));

    let stripeUrl = existing?.stripe_url ?? null;
    let stripeId = existing?.stripe_session_id ?? null;
    let stripeError: string | null = null;
    if (stripeKey && (!stripeUrl || Number(existing?.amount) !== amount) && amount > 0) {
      try {
        const s = await stripeCreateLink(stripeKey, { ref, customer, amount });
        stripeUrl = s.url; stripeId = s.id;
      } catch (e) { stripeError = String((e as Error).message ?? e); }
    }

    const row = {
      token, invoice_ref: ref, customer_name: customer, customer_email: email,
      amount, lines: inv.lines ?? null, due_date: (inv.due as string) || null,
      stripe_url: stripeUrl, stripe_session_id: stripeId,
      sent_by: userData.user.id,
    };
    const { error: upErr } = existing
      ? await admin.from("invoice_links").update(row).eq("id", existing.id)
      : await admin.from("invoice_links").insert(row);
    if (upErr) return json(500, { ok: false, error: upErr.message });

    const link = `${base}?token=${token}`;
    let emailed = false, emailError: string | null = null;
    if (email && resendKey) {
      const lines = Array.isArray(inv.lines) ? inv.lines as Array<Record<string, unknown>> : [];
      const mail = invoiceEmail({
        ref, customer, amount, due: (inv.due as string) || null, lines, link,
      });
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech Security <no-reply@shieldtechsolutions.com>",
          to: [email],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      emailed = res.ok;
      if (!res.ok) emailError = `resend ${res.status}`;
    }

    return json(200, { ok: true, link, stripe: !!stripeUrl, stripeError, emailed, emailError });
  }

  return json(400, { ok: false, error: "unknown action" });
});

// estimate-accept — customer-facing proposal acceptance.
//
// POST (Admin/Staff session): {estimateRef, customerName, customerEmail,
//   amount?, estimateQboId?} → creates a tokenized acceptance record and emails
//   the customer a review link (Resend). Returns {ok, link}.
// GET ?token=... (public, READ-ONLY): renders the proposal review page with
//   Accept / Decline buttons. Nothing mutates on GET, so email-scanner
//   prefetch can never auto-accept.
// POST {token, action} (public, from the review page's form): records the
//   customer's decision, mirrors accepted status onto qbo_estimates for QBO
//   rows, renders the confirmation page. The portal polls estimate_acceptances
//   and turns accepted rows into projects.
import { createClient } from "npm:@supabase/supabase-js@2";
import { esc, proposalEmail } from "../_shared/email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const CSS = `body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0e14;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{max-width:460px;width:100%;margin:24px;padding:34px;border-radius:14px;background:#111722;border:1px solid #1f2a3a;text-align:center}
.dot{width:52px;height:52px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;font-size:24px}
.ok{background:rgba(52,211,153,0.12);color:#34d399}.bad{background:rgba(244,63,94,0.12);color:#f43f5e}.info{background:rgba(63,169,245,0.12);color:#3fa9f5}
h1{font-size:19px;font-weight:600;margin:0 0 10px}p{font-size:14px;line-height:1.6;color:#9fb0c3;margin:0}
.amt{font-family:ui-monospace,monospace;font-size:26px;font-weight:700;color:#3fa9f5;margin:12px 0}
.btns{display:flex;gap:10px;justify-content:center;margin-top:22px}
button{border:none;border-radius:9px;padding:13px 26px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.accept{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff}
.decline{background:transparent;border:1px solid #2a3648;color:#9fb0c3}
.brand{margin-top:22px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5b6b7f}`;

const page = (title: string, message: string, kind: "ok" | "bad" | "info", extra = "") =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — ShieldTech Security</title><style>${CSS}</style></head>
<body><div class="card"><div class="dot ${kind}">${kind === "ok" ? "✓" : kind === "bad" ? "✕" : "◇"}</div><h1>${title}</h1><p>${message}</p>${extra}
<div class="brand">ShieldTech Security · Low Voltage. Zero Punch List.</div></div></body></html>`,
    { status: 200, headers: { ...cors, "Content-Type": "text/html; charset=utf-8" } },
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ── Public GET: READ-ONLY review page (prefetch-safe) ──
  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!token) return page("Invalid link", "This proposal link is missing its token.", "bad");

    const { data: rec } = await admin.from("estimate_acceptances").select("*").eq("token", token).maybeSingle();
    if (!rec) return page("Link not found", "This proposal link is invalid or has been removed.", "bad");

    if (rec.status !== "pending") {
      const already = rec.status === "accepted" ? "accepted" : "declined";
      return page(
        `Proposal already ${already}`,
        `Proposal ${esc(rec.estimate_ref)} was ${already} on ${new Date(rec.responded_at).toLocaleDateString()}. No further action is needed.`,
        rec.status === "accepted" ? "ok" : "bad",
      );
    }

    const self = `${Deno.env.get("SUPABASE_URL")}/functions/v1/estimate-accept`;
    return page(
      `Proposal ${esc(rec.estimate_ref)}`,
      `Prepared for ${esc(rec.customer_name ?? "you")} by ShieldTech Security. Review the details from your email, then confirm your decision below. Accepting starts your project — our team follows up to schedule kickoff.`,
      "info",
      `${rec.amount ? `<div class="amt">$${Number(rec.amount).toLocaleString()}</div>` : ""}
<div class="btns">
<form method="POST" action="${self}"><input type="hidden" name="token" value="${esc(rec.token)}"/><input type="hidden" name="action" value="accept"/><button class="accept" type="submit">Accept Proposal</button></form>
<form method="POST" action="${self}"><input type="hidden" name="token" value="${esc(rec.token)}"/><input type="hidden" name="action" value="decline"/><button class="decline" type="submit">Decline</button></form>
</div>`,
    );
  }

  if (req.method !== "POST") return json(405, { ok: false, error: "POST or GET only" });

  // Parse JSON or the review page's form submission.
  let body: Record<string, string | number | undefined> = {};
  const ctype = req.headers.get("content-type") ?? "";
  try {
    if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
      const form = await req.formData();
      body = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    } else {
      body = await req.json();
    }
  } catch { return json(400, { ok: false, error: "Invalid body" }); }

  // ── Public POST: the customer confirmed on the review page ──
  if (body.token) {
    const action = body.action === "decline" ? "declined" : "accepted";
    const { data: rec } = await admin.from("estimate_acceptances").select("*").eq("token", String(body.token)).maybeSingle();
    if (!rec) return page("Link not found", "This proposal link is invalid or has been removed.", "bad");
    if (rec.status !== "pending") {
      const already = rec.status === "accepted" ? "accepted" : "declined";
      return page(`Proposal already ${already}`, `Proposal ${esc(rec.estimate_ref)} was ${already} on ${new Date(rec.responded_at).toLocaleDateString()}.`, rec.status === "accepted" ? "ok" : "bad");
    }
    await admin.from("estimate_acceptances").update({
      status: action, accepted_via: "email", responded_at: new Date().toISOString(),
    }).eq("id", rec.id);
    if (rec.estimate_qbo_id && action === "accepted") {
      await admin.from("qbo_estimates").update({ status: "accepted" }).eq("qbo_id", rec.estimate_qbo_id);
    }
    return action === "accepted"
      ? page("Proposal accepted", `Thank you! Proposal ${esc(rec.estimate_ref)}${rec.amount ? ` ($${Number(rec.amount).toLocaleString()})` : ""} has been accepted. Our team will reach out shortly to schedule the project kickoff.`, "ok")
      : page("Proposal declined", `Proposal ${esc(rec.estimate_ref)} has been marked declined. If this was a mistake or you'd like to discuss changes, just reply to the original email.`, "bad");
  }

  // ── Staff POST: create the acceptance record + email the customer ──
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "sign in required" });
  const { data: userData } = await admin.auth.getUser(jwt);
  if (!userData?.user) return json(401, { ok: false, error: "sign in required" });
  const { data: prof } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (!(prof?.role === "Admin" || prof?.role === "Staff")) return json(403, { ok: false, error: "Admin/Staff only" });

  const estimateRef = String(body.estimateRef ?? "").trim();
  const customerEmail = String(body.customerEmail ?? "").trim();
  if (!estimateRef || !customerEmail) {
    return json(400, { ok: false, error: "estimateRef and customerEmail required" });
  }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const { error: insErr } = await admin.from("estimate_acceptances").insert({
    token,
    estimate_ref: estimateRef,
    estimate_qbo_id: body.estimateQboId ?? null,
    customer_name: body.customerName ?? null,
    customer_email: customerEmail,
    amount: body.amount ?? null,
    sent_by: userData.user.id,
  });
  if (insErr) return json(500, { ok: false, error: insErr.message });

  const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/estimate-accept`;
  const reviewLink = `${base}?token=${token}`;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  let emailed = false, emailError: string | null = null;
  if (resendKey) {
    const mail = proposalEmail({
      ref: estimateRef,
      customer: body.customerName ? String(body.customerName) : null,
      amount: body.amount ? Number(body.amount) : null,
      link: reviewLink,
    });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech Security <no-reply@shieldtechsolutions.com>",
        to: [customerEmail],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    const out = await res.json();
    if (res.ok) emailed = true; else emailError = out?.message ?? `Resend ${res.status}`;
  } else {
    emailError = "RESEND_API_KEY not configured — share the accept link manually";
  }

  return json(200, { ok: true, data: { token, acceptLink: reviewLink, declineLink: reviewLink, emailed, emailError } });
});

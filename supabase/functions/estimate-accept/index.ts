// estimate-accept — customer-facing estimate acceptance.
//
// POST (Admin/Staff session): {estimateRef, customerName, customerEmail,
//   amount?, estimateQboId?} → creates a tokenized acceptance record and emails
//   the customer Accept/Decline links (Resend). Returns {ok, link}.
// GET ?token=...&action=accept|decline (public, from the email): records the
//   customer's response, mirrors accepted status onto qbo_estimates when the
//   estimate is a QBO row, and renders a small branded confirmation page. The
//   portal polls estimate_acceptances and turns accepted rows into projects.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const page = (title: string, message: string, ok: boolean) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — ShieldTech Solutions</title>
<style>body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0e14;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{max-width:440px;margin:24px;padding:36px;border-radius:14px;background:#111722;border:1px solid #1f2a3a;text-align:center}
.dot{width:52px;height:52px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;font-size:24px;background:${ok ? "rgba(52,211,153,0.12)" : "rgba(244,63,94,0.12)"};color:${ok ? "#34d399" : "#f43f5e"}}
h1{font-size:19px;font-weight:600;margin:0 0 10px}p{font-size:14px;line-height:1.6;color:#9fb0c3;margin:0}
.brand{margin-top:22px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5b6b7f}</style></head>
<body><div class="card"><div class="dot">${ok ? "✓" : "✕"}</div><h1>${title}</h1><p>${message}</p>
<div class="brand">ShieldTech Solutions · Security · Monitoring · Service</div></div></body></html>`,
    { status: 200, headers: { ...cors, "Content-Type": "text/html; charset=utf-8" } },
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ── Public GET: the customer clicked an emailed link ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const action = url.searchParams.get("action") === "decline" ? "declined" : "accepted";
    if (!token) return page("Invalid link", "This acceptance link is missing its token.", false);

    const { data: rec } = await admin.from("estimate_acceptances").select("*").eq("token", token).maybeSingle();
    if (!rec) return page("Link not found", "This acceptance link is invalid or has been removed.", false);

    if (rec.status !== "pending") {
      const already = rec.status === "accepted" ? "accepted" : "declined";
      return page(
        `Estimate already ${already}`,
        `Estimate ${rec.estimate_ref} was ${already} on ${new Date(rec.responded_at).toLocaleDateString()}. No further action is needed.`,
        rec.status === "accepted",
      );
    }

    await admin.from("estimate_acceptances").update({
      status: action, accepted_via: "email", responded_at: new Date().toISOString(),
    }).eq("id", rec.id);
    if (rec.estimate_qbo_id && action === "accepted") {
      await admin.from("qbo_estimates").update({ status: "accepted" }).eq("qbo_id", rec.estimate_qbo_id);
    }

    return action === "accepted"
      ? page("Estimate accepted", `Thank you! Estimate ${rec.estimate_ref}${rec.amount ? ` ($${Number(rec.amount).toLocaleString()})` : ""} has been accepted. Our team will reach out shortly to schedule the project kickoff.`, true)
      : page("Estimate declined", `Estimate ${rec.estimate_ref} has been marked declined. If this was a mistake or you'd like to discuss changes, just reply to the original email.`, false);
  }

  if (req.method !== "POST") return json(405, { ok: false, error: "POST or GET only" });

  // ── Staff POST: create the acceptance record + email the customer ──
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "sign in required" });
  const { data: userData } = await admin.auth.getUser(jwt);
  if (!userData?.user) return json(401, { ok: false, error: "sign in required" });
  const { data: prof } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (!(prof?.role === "Admin" || prof?.role === "Staff")) return json(403, { ok: false, error: "Admin/Staff only" });

  let body: { estimateRef?: string; estimateQboId?: string; customerName?: string; customerEmail?: string; amount?: number };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  if (!body.estimateRef?.trim() || !body.customerEmail?.trim()) {
    return json(400, { ok: false, error: "estimateRef and customerEmail required" });
  }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const { error: insErr } = await admin.from("estimate_acceptances").insert({
    token,
    estimate_ref: body.estimateRef.trim(),
    estimate_qbo_id: body.estimateQboId ?? null,
    customer_name: body.customerName ?? null,
    customer_email: body.customerEmail.trim(),
    amount: body.amount ?? null,
    sent_by: userData.user.id,
  });
  if (insErr) return json(500, { ok: false, error: insErr.message });

  const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/estimate-accept`;
  const acceptLink = `${base}?token=${token}&action=accept`;
  const declineLink = `${base}?token=${token}&action=decline`;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  let emailed = false, emailError: string | null = null;
  if (resendKey) {
    const amountLine = body.amount ? `<p style="font-size:22px;font-weight:600;margin:6px 0 18px">$${Number(body.amount).toLocaleString()}</p>` : "";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech <no-reply@shieldtechsolutions.com>",
        to: [body.customerEmail.trim()],
        subject: `Estimate ${body.estimateRef} from ShieldTech Solutions — approval requested`,
        html: `<div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
<h2 style="font-size:18px;margin:0 0 4px">Estimate ${body.estimateRef}</h2>
<p style="color:#556;font-size:14px;margin:0 0 14px">Prepared for ${body.customerName ?? "you"} by ShieldTech Solutions</p>
${amountLine}
<p style="font-size:14px;color:#334;line-height:1.6">Please review your estimate and let us know how you'd like to proceed. Accepting starts your project — our team will follow up to schedule kickoff.</p>
<div style="margin:26px 0">
<a href="${acceptLink}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600">Accept Estimate</a>
<a href="${declineLink}" style="color:#9aa3af;text-decoration:none;padding:12px 18px;font-size:13px">Decline</a>
</div>
<p style="font-size:12px;color:#99a">ShieldTech Solutions LLC · Security · Monitoring · Service<br/>Questions? Just reply to this email.</p>
</div>`,
      }),
    });
    const out = await res.json();
    if (res.ok) emailed = true; else emailError = out?.message ?? `Resend ${res.status}`;
  } else {
    emailError = "RESEND_API_KEY not configured — share the accept link manually";
  }

  return json(200, { ok: true, data: { token, acceptLink, declineLink, emailed, emailError } });
});

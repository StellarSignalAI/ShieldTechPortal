// send-email — actually delivers platform email (invoices, estimates, notices)
// via Resend. POST {to, subject, html?, text?} with a signed-in session or
// x-cron-secret. 503 until RESEND_API_KEY is configured.
//
// Text-only sends are wrapped in the unified ShieldTech email design system
// (_shared/email.ts) so ad-hoc messages (e.g. Sales-app follow-ups) carry the
// same identity as every other automated email. Callers that pass html are
// trusted to have built it from the same system.
import { createClient } from "npm:@supabase/supabase-js@2";
import { jobAssignedEmail, notificationEmail, timesheetRejectedEmail, timesheetSubmittedEmail } from "../_shared/email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return json(503, { ok: false, error: "RESEND_API_KEY not configured" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const cron = Deno.env.get("CRON_SECRET");
  const isCron = Boolean(cron && req.headers.get("x-cron-secret") === cron);
  let callerRole: string | null = null;
  if (!isCron) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (jwt) {
      const { data } = await admin.auth.getUser(jwt);
      if (data?.user) {
        const { data: prof } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        callerRole = prof?.role ?? null;
      }
    }
  }
  if (!isCron && !callerRole) return json(401, { ok: false, error: "sign in required" });

  let body: {
    to?: string | string[]; subject?: string; html?: string; text?: string;
    template?: string; data?: Record<string, unknown>;
  };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }

  // ── Authorization matrix ──
  // Cron + office roles (Admin/Staff/Manager): any send.
  // Everyone else (Technician/Sales/Client): ONLY the timesheet-submitted
  // office alert, and the recipients are forced server-side — a field login
  // must never become an open relay from the company's no-reply address.
  const officeSender = isCron || ["Admin", "Staff", "Manager"].includes(callerRole ?? "");
  if (!officeSender) {
    if (body.template !== "timesheet-submitted") {
      return json(403, { ok: false, error: "This account can only send timesheet notifications" });
    }
    body.to = (Deno.env.get("TIME_ALERT_EMAILS") ?? "daniel@shieldtechsolutions.com,aaron@shieldtechsolutions.com")
      .split(",").map((s) => s.trim()).filter(Boolean);
    body.html = undefined; body.text = undefined; body.subject = undefined;
  }

  // Named design-system templates render server-side so clients never build
  // raw HTML. Subject comes from the template unless the caller overrides it.
  let html = body.html;
  let text = body.text;
  let subject = body.subject;
  if (body.template === "job-assigned") {
    const d = (body.data ?? {}) as Record<string, string>;
    if (!d.title) return json(400, { ok: false, error: "data.title required for job-assigned" });
    const mail = jobAssignedEmail({
      name: d.name, title: String(d.title), customer: d.customer, site: d.site,
      date: d.date, endDate: d.endDate, startTime: d.startTime,
      hours: d.hours, notes: d.notes, jobRef: d.jobRef,
    });
    html = mail.html; text = mail.text; subject = subject || mail.subject;
  } else if (body.template === "timesheet-rejected") {
    const d = (body.data ?? {}) as Record<string, string>;
    const mail = timesheetRejectedEmail({
      name: d.name, workDate: d.workDate, hours: d.hours, jobRef: d.jobRef, note: d.note,
    });
    html = mail.html; text = mail.text; subject = subject || mail.subject;
  } else if (body.template === "timesheet-submitted") {
    const d = (body.data ?? {}) as Record<string, string>;
    const mail = timesheetSubmittedEmail({
      techName: d.techName, workDate: d.workDate, hours: d.hours,
      jobRef: d.jobRef, notes: d.notes, count: d.count ? Number(d.count) : null,
    });
    html = mail.html; text = mail.text; subject = subject || mail.subject;
  } else if (body.template) {
    return json(400, { ok: false, error: `Unknown template: ${body.template}` });
  }
  const to = (Array.isArray(body.to) ? body.to : [body.to]).filter(Boolean) as string[];
  if (!to.length || !subject || !(html || text)) return json(400, { ok: false, error: "to, subject, html|text required" });

  // Wrap bare text in the ShieldTech master template (keeps the raw text as
  // the plain-text fallback). html callers pass through unchanged.
  if (!html && text) {
    const wrapped = notificationEmail({ subject: subject!, message: text, label: "Message" });
    html = wrapped.html;
    text = wrapped.text;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech Security <no-reply@shieldtechsolutions.com>",
      to, subject,
      html: html ?? undefined, text: text ?? undefined,
    }),
  });
  const out = await res.json();
  if (!res.ok) return json(502, { ok: false, error: out?.message ?? `Resend ${res.status}` });
  return json(200, { ok: true, data: { id: out.id } });
});

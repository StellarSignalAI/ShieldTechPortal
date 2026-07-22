// send-email — actually delivers platform email (invoices, estimates, notices)
// via Resend. POST {to, subject, html?, text?} with a signed-in session or
// x-cron-secret. 503 until RESEND_API_KEY is configured.
import { createClient } from "npm:@supabase/supabase-js@2";

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
  let authed = Boolean(cron && req.headers.get("x-cron-secret") === cron);
  if (!authed) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (jwt) { const { data } = await admin.auth.getUser(jwt); authed = Boolean(data?.user); }
  }
  if (!authed) return json(401, { ok: false, error: "sign in required" });

  let body: { to?: string; subject?: string; html?: string; text?: string };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  if (!body.to || !body.subject || !(body.html || body.text)) return json(400, { ok: false, error: "to, subject, html|text required" });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech <no-reply@shieldtechsolutions.com>",
      to: [body.to], subject: body.subject,
      html: body.html ?? undefined, text: body.text ?? undefined,
    }),
  });
  const out = await res.json();
  if (!res.ok) return json(502, { ok: false, error: out?.message ?? `Resend ${res.status}` });
  return json(200, { ok: true, data: { id: out.id } });
});

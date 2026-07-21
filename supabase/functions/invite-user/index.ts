// invite-user — Admin-only Edge Function.
// Creates an auth user with a generated temporary password, writes the profile
// (role + per-app rights + must_change_password), and emails the credentials
// via Resend when RESEND_API_KEY is configured. Response shape: {ok, data|error}.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function tempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `ST-${out.slice(0, 5)}-${out.slice(5, 10)}-${out.slice(10, 14)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // ── Caller must be a signed-in Admin ──
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "Missing bearer token" });
  const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !caller?.user) return json(401, { ok: false, error: "Invalid session" });
  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
  if (callerProfile?.role !== "Admin") {
    return json(403, { ok: false, error: "Admin role required" });
  }

  // ── Payload ──
  let body: { email?: string; name?: string; role?: string; app_rights?: Record<string, boolean> };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  const email = (body.email ?? "").trim().toLowerCase();
  const role = body.role ?? "Client";
  const appRights = body.app_rights ?? { portal: false, tech: false, customer: true };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { ok: false, error: "Valid email required" });
  if (!["Admin", "Staff", "Technician", "Client"].includes(role)) {
    return json(400, { ok: false, error: "Unknown role" });
  }

  // ── Create the auth user with a temp password ──
  const password = tempPassword();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: body.name ?? "" },
  });
  if (createErr) return json(409, { ok: false, error: createErr.message });

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: created.user.id,
    email,
    name: body.name ?? "",
    role,
    app_rights: appRights,
    must_change_password: true,
    invited_by: caller.user.id,
  }, { onConflict: "email" });
  if (profileErr) return json(500, { ok: false, error: profileErr.message });

  // ── Email the credentials (Resend), best-effort ──
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const portalUrl = Deno.env.get("PORTAL_URL") ?? "https://portal.shieldtechsolutions.com";
  let emailed = false;
  if (resendKey) {
    const apps = Object.entries(appRights).filter(([, v]) => v).map(([k]) => k).join(", ") || "none";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech <no-reply@shieldtechsolutions.com>",
        to: [email],
        subject: "Your ShieldTech account",
        html: `<p>You've been invited to the ShieldTech platform.</p>
<p><strong>Username:</strong> ${email}<br/>
<strong>Temporary password:</strong> ${password}<br/>
<strong>Applications:</strong> ${apps}</p>
<p>Sign in at <a href="${portalUrl}">${portalUrl}</a>. You'll be asked to set a new password on first login.</p>`,
      }),
    });
    emailed = res.ok;
  }

  return json(200, {
    ok: true,
    data: {
      id: created.user.id,
      email,
      role,
      app_rights: appRights,
      emailed,
      // Returned so the admin can hand credentials over manually when SMTP
      // isn't configured yet; shown once in the UI, never stored client-side.
      temp_password: emailed ? undefined : password,
    },
  });
});

// manage-user — Admin-only user management: reset password (also used for
// "resend invite"), and remove a user. Role/app-rights edits are done directly
// from the client via RLS (admins can update profiles); this function covers the
// actions that need the service role. Response shape: {ok, data|error}.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ── Caller must be a signed-in Admin ──
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "Missing bearer token" });
  const { data: caller } = await admin.auth.getUser(jwt);
  if (!caller?.user) return json(401, { ok: false, error: "Invalid session" });
  const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
  if (callerProfile?.role !== "Admin") return json(403, { ok: false, error: "Admin role required" });

  let body: { action?: string; userId?: string };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  const action = body.action;
  const userId = body.userId;
  if (!userId) return json(400, { ok: false, error: "userId required" });

  const { data: target } = await admin.from("profiles").select("id, email, name, app_rights").eq("id", userId).maybeSingle();
  if (!target) return json(404, { ok: false, error: "User not found" });

  // ── Remove ──
  if (action === "remove") {
    if (target.id === caller.user.id) return json(400, { ok: false, error: "You can't remove your own account" });
    await admin.auth.admin.deleteUser(target.id).catch(() => {});
    await admin.from("profiles").delete().eq("id", target.id);
    return json(200, { ok: true, data: { removed: true, email: target.email } });
  }

  // ── Reset password / Resend invite (same effect: new temp password) ──
  if (action === "reset" || action === "resend") {
    const password = tempPassword();
    const { error: upErr } = await admin.auth.admin.updateUserById(target.id, { password });
    if (upErr) return json(500, { ok: false, error: upErr.message });
    await admin.from("profiles").update({ must_change_password: true }).eq("id", target.id);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const portalUrl = Deno.env.get("PORTAL_URL") ?? "https://portal.shieldtechsolutions.com";
    let emailed = false;
    if (resendKey) {
      const subject = action === "resend" ? "Your ShieldTech invitation" : "Your ShieldTech password was reset";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech <no-reply@shieldtechsolutions.com>",
          to: [target.email],
          subject,
          html: `<p>${action === "resend" ? "Here are your ShieldTech sign-in details." : "Your ShieldTech password has been reset by an administrator."}</p>
<p><strong>Username:</strong> ${target.email}<br/>
<strong>Temporary password:</strong> ${password}</p>
<p>Sign in at <a href="${portalUrl}">${portalUrl}</a>. You'll be asked to set a new password on first login.</p>`,
        }),
      });
      emailed = res.ok;
    }
    return json(200, { ok: true, data: { email: target.email, emailed, temp_password: emailed ? undefined : password } });
  }

  return json(400, { ok: false, error: "Unknown action" });
});

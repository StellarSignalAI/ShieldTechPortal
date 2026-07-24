// passkey — WebAuthn registration + authentication ceremonies.
// Actions:
//   reg-options   (JWT)  → registration options (stores challenge)
//   reg-verify    (JWT)  → verify attestation, store credential
//   auth-options  {email}→ authentication options (stores challenge)
//   auth-verify   {email, response} → verify assertion, mint a Supabase session
//                                     (returns {token_hash} → client verifyOtp)
// RP ID is the registrable domain so one passkey works across portal./tech./
// customer. subdomains. Response shape: {ok, data|error}.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server@13";

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "shieldtechsolutions.com";
const RP_NAME = "ShieldTech";
const ORIGINS = (Deno.env.get("WEBAUTHN_ORIGINS") ??
  "https://portal.shieldtechsolutions.com,https://tech.shieldtechsolutions.com,https://customer.shieldtechsolutions.com")
  .split(",").map((s) => s.trim());

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const b64uToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const bytesToB64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  let body: { action?: string; email?: string; response?: unknown; label?: string; challengeId?: string };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  const action = body.action;

  // Resolve the signed-in user for registration actions.
  async function requireUser() {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt) return null;
    const { data } = await admin.auth.getUser(jwt);
    return data?.user ?? null;
  }

  try {
    // ── Registration: options ──
    if (action === "reg-options") {
      const user = await requireUser();
      if (!user) return json(401, { ok: false, error: "Sign in first" });
      const { data: existing } = await admin.from("webauthn_credentials").select("credential_id, transports").eq("user_id", user.id);
      const opts = await generateRegistrationOptions({
        rpName: RP_NAME, rpID: RP_ID,
        userID: b64uToBytes(bytesToB64u(new TextEncoder().encode(user.id))),
        userName: user.email ?? user.id,
        attestationType: "none",
        excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id, transports: c.transports ?? undefined })),
        // Discoverable credential so the user can sign in later WITHOUT typing an
        // email — the device offers the passkey and we identify the account from
        // the credential itself.
        authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "preferred" },
      });
      await admin.from("webauthn_challenges").insert({ user_id: user.id, kind: "register", challenge: opts.challenge });
      return json(200, { ok: true, data: opts });
    }

    // ── Registration: verify ──
    if (action === "reg-verify") {
      const user = await requireUser();
      if (!user) return json(401, { ok: false, error: "Sign in first" });
      const { data: ch } = await admin.from("webauthn_challenges")
        .select("id, challenge").eq("user_id", user.id).eq("kind", "register").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!ch) return json(400, { ok: false, error: "No pending challenge" });
      const verification = await verifyRegistrationResponse({
        response: body.response as never,
        expectedChallenge: ch.challenge,
        expectedOrigin: ORIGINS,
        expectedRPID: RP_ID,
      });
      await admin.from("webauthn_challenges").delete().eq("id", ch.id);
      if (!verification.verified || !verification.registrationInfo) return json(400, { ok: false, error: "Registration not verified" });
      const cred = verification.registrationInfo.credential;
      await admin.from("webauthn_credentials").insert({
        user_id: user.id,
        credential_id: cred.id,
        public_key: bytesToB64u(cred.publicKey),
        counter: cred.counter ?? 0,
        transports: cred.transports ?? [],
        device_label: body.label ?? "Passkey",
      });
      return json(200, { ok: true, data: { registered: true } });
    }

    // ── Authentication: options ──
    // Email is OPTIONAL. With no email we return an empty allowCredentials list,
    // which lets the device offer whatever discoverable passkey it holds for this
    // site (true usernameless / one-tap sign-in). We return a challengeId the
    // client echoes back on verify so we can match the ceremony without an email.
    if (action === "auth-options") {
      const email = (body.email ?? "").trim().toLowerCase();
      let profileId: string | null = null;
      let creds: Array<{ credential_id: string; transports: string[] | null }> = [];
      if (email) {
        const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
        profileId = profile?.id ?? null;
        if (profileId) creds = (await admin.from("webauthn_credentials").select("credential_id, transports").eq("user_id", profileId)).data ?? [];
      }
      const opts = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: creds.map((c) => ({ id: c.credential_id, transports: c.transports ?? undefined })),
        userVerification: "preferred",
      });
      const { data: chRow } = await admin.from("webauthn_challenges")
        .insert({ user_id: profileId, email: email || null, kind: "authenticate", challenge: opts.challenge })
        .select("id").maybeSingle();
      return json(200, { ok: true, data: { ...opts, challengeId: chRow?.id ?? null } });
    }

    // ── Authentication: verify → mint session ──
    // Identifies the account from the passkey itself (no email needed).
    if (action === "auth-verify") {
      const resp = body.response as { id?: string };
      const challengeId = body.challengeId;
      const email = (body.email ?? "").trim().toLowerCase();
      if (!resp?.id) return json(400, { ok: false, error: "Missing passkey response" });

      // Match the pending challenge: by id (usernameless) or by email (legacy).
      let ch: { id: string; challenge: string } | null = null;
      if (challengeId) {
        ch = (await admin.from("webauthn_challenges").select("id, challenge").eq("id", challengeId).maybeSingle()).data ?? null;
      } else if (email) {
        ch = (await admin.from("webauthn_challenges").select("id, challenge").eq("email", email).eq("kind", "authenticate").order("created_at", { ascending: false }).limit(1).maybeSingle()).data ?? null;
      }
      if (!ch) return json(400, { ok: false, error: "No pending passkey challenge — try again" });

      const { data: cred } = await admin.from("webauthn_credentials").select("*").eq("credential_id", resp.id).maybeSingle();
      if (!cred) { await admin.from("webauthn_challenges").delete().eq("id", ch.id); return json(400, { ok: false, error: "This passkey isn't registered — add one from Settings after signing in." }); }

      const verification = await verifyAuthenticationResponse({
        response: body.response as never,
        expectedChallenge: ch.challenge,
        expectedOrigin: ORIGINS,
        expectedRPID: RP_ID,
        credential: { id: cred.credential_id, publicKey: b64uToBytes(cred.public_key), counter: Number(cred.counter) },
      });
      await admin.from("webauthn_challenges").delete().eq("id", ch.id);
      if (!verification.verified) return json(400, { ok: false, error: "Passkey not verified" });
      await admin.from("webauthn_credentials")
        .update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
        .eq("id", cred.id);

      // Resolve the account email from the credential's owner, then mint a session.
      let userEmail = email;
      const { data: prof } = await admin.from("profiles").select("email").eq("id", cred.user_id).maybeSingle();
      if (prof?.email) userEmail = prof.email;
      else { const { data: u } = await admin.auth.admin.getUserById(cred.user_id); userEmail = u?.user?.email ?? userEmail; }
      if (!userEmail) return json(500, { ok: false, error: "Could not resolve account for this passkey" });

      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: userEmail });
      if (linkErr || !link?.properties?.hashed_token) return json(500, { ok: false, error: linkErr?.message ?? "Could not create session" });
      return json(200, { ok: true, data: { token_hash: link.properties.hashed_token, email: userEmail } });
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (e) {
    return json(500, { ok: false, error: String((e as Error)?.message ?? e) });
  }
});

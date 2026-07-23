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
  let body: { action?: string; email?: string; response?: unknown; label?: string };
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
        authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
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
    if (action === "auth-options") {
      const email = (body.email ?? "").trim().toLowerCase();
      if (!email) return json(400, { ok: false, error: "Email required" });
      const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
      const creds = profile ? (await admin.from("webauthn_credentials").select("credential_id, transports").eq("user_id", profile.id)).data ?? [] : [];
      const opts = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: creds.map((c) => ({ id: c.credential_id, transports: c.transports ?? undefined })),
        userVerification: "preferred",
      });
      await admin.from("webauthn_challenges").insert({ user_id: profile?.id ?? null, email, kind: "authenticate", challenge: opts.challenge });
      return json(200, { ok: true, data: opts });
    }

    // ── Authentication: verify → mint session ──
    if (action === "auth-verify") {
      const email = (body.email ?? "").trim().toLowerCase();
      const resp = body.response as { id?: string };
      if (!email || !resp?.id) return json(400, { ok: false, error: "Missing email or response" });
      const { data: ch } = await admin.from("webauthn_challenges")
        .select("id, challenge").eq("email", email).eq("kind", "authenticate").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!ch) return json(400, { ok: false, error: "No pending challenge" });
      const { data: cred } = await admin.from("webauthn_credentials").select("*").eq("credential_id", resp.id).maybeSingle();
      if (!cred) { await admin.from("webauthn_challenges").delete().eq("id", ch.id); return json(400, { ok: false, error: "Unknown passkey" }); }
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
      // Mint a session: generate a magiclink token the client exchanges via verifyOtp.
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkErr || !link?.properties?.hashed_token) return json(500, { ok: false, error: linkErr?.message ?? "Could not create session" });
      return json(200, { ok: true, data: { token_hash: link.properties.hashed_token, email } });
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (e) {
    return json(500, { ok: false, error: String((e as Error)?.message ?? e) });
  }
});

/* Passkey (WebAuthn) client — talks to the `passkey` edge function.
   window.__shieldPasskey:
     supported()                 → boolean (browser can do WebAuthn)
     createPasskey(label?)       → { ok } | { ok:false, error }  (signed-in user)
     signInWithPasskey(email)    → { ok } | { ok:false, error }  (mints a session) */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase, supabaseConfigured } from './supabase.js';

export function supported() {
  return typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    !!(navigator.credentials && navigator.credentials.create);
}

async function call(action, payload) {
  const { data, error } = await supabase.functions.invoke('passkey', { body: { action, ...payload } });
  if (error) throw new Error(error.message || 'Passkey request failed');
  if (!data || !data.ok) throw new Error((data && data.error) || 'Passkey request failed');
  return data.data;
}

/* Register a new passkey for the currently signed-in user. */
export async function createPasskey(label) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  if (!supported()) return { ok: false, error: 'This device/browser does not support passkeys' };
  try {
    const options = await call('reg-options', {});
    const attResp = await startRegistration({ optionsJSON: options });
    await call('reg-verify', { response: attResp, label: label || 'Passkey' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.name === 'NotAllowedError' ? 'Passkey setup cancelled' : String(e.message || e) };
  }
}

/* Sign in with a passkey. Usernameless: no email required — the device offers
   its discoverable passkey for this site and the account is resolved from the
   credential. On success a Supabase session is established. */
export async function signInWithPasskey(email) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  if (!supported()) return { ok: false, error: 'This device/browser does not support passkeys' };
  try {
    const em = (email || '').trim();
    const options = await call('auth-options', em ? { email: em } : {});
    const { challengeId } = options;
    // startAuthentication triggers the OS passkey picker (Face ID / Touch ID).
    const authResp = await startAuthentication({ optionsJSON: options });
    const { token_hash } = await call('auth-verify', { challengeId, email: em || undefined, response: authResp });
    const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash });
    if (error) return { ok: false, error: error.message };
    try { window.dispatchEvent(new CustomEvent('shield:auth', { detail: { authed: true } })); } catch {}
    return { ok: true };
  } catch (e) {
    if (e && e.name === 'NotAllowedError') return { ok: false, error: 'Passkey sign-in cancelled or no passkey on this device' };
    const msg = String((e && e.message) || e);
    // A non-2xx from the function usually means the passkey backend isn't set up.
    if (/non-2xx|Passkey request failed/i.test(msg)) return { ok: false, error: "No passkey available yet — sign in with your email/password, then add a passkey in the account menu." };
    return { ok: false, error: msg };
  }
}

window.__shieldPasskey = { supported, createPasskey, signInWithPasskey };

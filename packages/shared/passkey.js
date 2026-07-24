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

/* Sign in with a passkey. On success a Supabase session is established. */
export async function signInWithPasskey(email) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  if (!supported()) return { ok: false, error: 'This device/browser does not support passkeys' };
  if (!email || !email.trim()) return { ok: false, error: 'Enter your email first' };
  try {
    const options = await call('auth-options', { email: email.trim() });
    if (!options.allowCredentials || options.allowCredentials.length === 0) {
      return { ok: false, error: 'No passkey found for this email — sign in another way, then add one in Settings.' };
    }
    const authResp = await startAuthentication({ optionsJSON: options });
    const { token_hash } = await call('auth-verify', { email: email.trim(), response: authResp });
    const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash });
    if (error) return { ok: false, error: error.message };
    try { window.dispatchEvent(new CustomEvent('shield:auth', { detail: { authed: true } })); } catch {}
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.name === 'NotAllowedError' ? 'Passkey sign-in cancelled' : String(e.message || e) };
  }
}

window.__shieldPasskey = { supported, createPasskey, signInWithPasskey };

/* Real email delivery client — window.__shieldEmail.send({to, subject, html|text}).
   Uses the send-email Edge Function (Resend); returns {ok, error?}. Gracefully
   reports not-configured so the Outbox can show honest status. */
import { supabase, supabaseConfigured } from './supabase.js';

export async function sendEmail({ to, subject, html, text }) {
  if (!supabaseConfigured) return { ok: false, error: 'Email backend not configured yet' };
  try {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
      body: JSON.stringify({ to, subject, html, text }),
    });
    return await res.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}
window.__shieldEmail = { send: sendEmail };

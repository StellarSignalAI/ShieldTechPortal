/* Shared ShieldTech AI client. All AI features in every app go through the
   single `ai` Edge Function (OpenAI-backed, server-side key). */
import { supabase, supabaseConfigured } from './supabase.js';

let status = { configured: false, model: null, checked: false };

export async function aiStatus(force) {
  if (status.checked && !force) return status;
  if (!supabaseConfigured) { status = { configured: false, model: null, checked: true }; return status; }
  try {
    const { data } = await supabase.functions.invoke('ai', { body: { action: 'status' } });
    status = { configured: Boolean(data && data.ok && data.data.configured), model: (data && data.data && data.data.model) || null, checked: true };
  } catch {
    status = { configured: false, model: null, checked: true };
  }
  window.__shieldAIModel = status.configured ? status.model : null;
  try { window.dispatchEvent(new CustomEvent('shield:ai-status', { detail: { ...status } })); } catch {}
  return status;
}

/* Re-check once the user signs in (the status endpoint is public, but a fresh
   check after auth keeps __shieldAIModel and any listening screens in sync). */
try {
  window.addEventListener('shield:auth', (e) => { if (e && e.detail && e.detail.authed) aiStatus(true); });
} catch {}

/* askShieldAI(feature, messages, context?) → { text, model } | throws Error */
export async function askShieldAI(feature, messages, context) {
  if (!supabaseConfigured) {
    throw new Error('ShieldTech AI is not configured yet — connect Supabase and set OPENAI_API_KEY (see OUTSTANDING-APIS.md).');
  }
  const { data, error } = await supabase.functions.invoke('ai', {
    body: { feature, messages, context },
  });
  if (error) throw new Error(error.message || 'AI request failed');
  if (!data || !data.ok) throw new Error((data && data.error) || 'AI request failed');
  return data.data;
}

/* Convenience for prototype screens: resolves to reply text, or a friendly
   configuration message instead of throwing. */
export async function shieldAIChat(feature, messages, context) {
  try {
    const { text } = await askShieldAI(feature, messages, context);
    return { text, live: true };
  } catch (e) {
    return { text: e.message, live: false };
  }
}

window.__shieldAI = { askShieldAI, shieldAIChat, aiStatus };
aiStatus();

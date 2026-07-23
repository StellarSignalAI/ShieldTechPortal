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

/* askShieldAI(feature, messages, context?, attachments?) → { text, model } | throws
   attachments: [{ name, mime, dataUrl }] — images the model sees (vision) and
   text files whose contents are inlined into the prompt. */
export async function askShieldAI(feature, messages, context, attachments) {
  if (!supabaseConfigured) {
    throw new Error('ShieldTech AI is not configured yet — connect Supabase and set OPENAI_API_KEY (see OUTSTANDING-APIS.md).');
  }
  const { data, error } = await supabase.functions.invoke('ai', {
    body: { feature, messages, context, attachments: attachments && attachments.length ? attachments : undefined },
  });
  if (error) throw new Error(error.message || 'AI request failed');
  if (!data || !data.ok) throw new Error((data && data.error) || 'AI request failed');
  return data.data;
}

/* Convenience for prototype screens: resolves to reply text, or a friendly
   configuration message instead of throwing. */
export async function shieldAIChat(feature, messages, context, attachments) {
  try {
    const { text } = await askShieldAI(feature, messages, context, attachments);
    return { text, live: true };
  } catch (e) {
    return { text: e.message, live: false };
  }
}

/* Read a FileList/array of File objects into attachment payloads. Images become
   data URLs (sent to the vision model); text-like files are inlined as text.
   Caps each file at ~4MB so requests stay reasonable. */
export async function readAttachments(files) {
  const out = [];
  for (const f of Array.from(files || [])) {
    if (f.size > 4 * 1024 * 1024) { out.push({ name: f.name, mime: f.type, error: 'too large (max 4MB)' }); continue; }
    const isImage = /^image\//.test(f.type);
    const isText = /^text\/|json|csv|xml|javascript|typescript/.test(f.type) || /\.(txt|md|csv|json|log|ya?ml)$/i.test(f.name);
    try {
      if (isImage) {
        const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
        out.push({ name: f.name, mime: f.type, dataUrl });
      } else if (isText) {
        const text = await f.text();
        out.push({ name: f.name, mime: f.type || 'text/plain', text: text.slice(0, 20000) });
      } else {
        out.push({ name: f.name, mime: f.type, note: 'unsupported type — only images and text files can be read by AI' });
      }
    } catch (e) {
      out.push({ name: f.name, mime: f.type, error: String(e && e.message ? e.message : e) });
    }
  }
  return out;
}

window.__shieldAI = { askShieldAI, shieldAIChat, aiStatus, readAttachments };
aiStatus();

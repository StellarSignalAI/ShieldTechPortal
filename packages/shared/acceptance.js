/* Estimate-acceptance client — window.__shieldAcceptance.
   Bridges the portal UI to the estimate-accept edge function and the
   estimate_acceptances table:
     send(est)          → email the customer an Accept/Decline link
     list()             → all acceptance records (newest first)
     pendingApply()     → accepted-but-not-yet-applied records (poll target)
     markApplied(id, projectNumber) → record that a project was created
   Degrades gracefully (ok:false) when Supabase isn't configured. */
import { supabase, supabaseConfigured } from './supabase.js';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

async function send({ estimateRef, estimateQboId, customerName, customerEmail, amount }) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-accept`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ estimateRef, estimateQboId, customerName, customerEmail, amount }),
    });
    return await res.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function list() {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  const { data, error } = await supabase
    .from('estimate_acceptances').select('*').order('sent_at', { ascending: false });
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

async function pendingApply() {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  const { data, error } = await supabase
    .from('estimate_acceptances').select('*')
    .eq('status', 'accepted').eq('applied', false);
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

async function markApplied(id, projectNumber) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured' };
  const { error } = await supabase
    .from('estimate_acceptances')
    .update({ applied: true, applied_project: projectNumber || null })
    .eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

window.__shieldAcceptance = { send, list, pendingApply, markApplied };

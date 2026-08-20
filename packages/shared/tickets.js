/* Support tickets client — window.__shieldTickets.
   Real, RLS-scoped customer tickets (support_tickets table): customers create
   and read their own; the office (Admin/Staff) works the full queue.
     create({subject, description, category, priority}) → {ok, data} + office
                    email alert (send-email 'support-ticket', recipients forced
                    server-side)
     list()         → caller-visible tickets, newest first (RLS decides scope)
     addMessage(id, text, fromOffice?) → appends to the jsonb thread (+ alert
                    when the customer replies)
     setStatus(id, status)             → staff-only by RLS
   Degrades gracefully (ok:false) when Supabase isn't configured. */
import { supabase, supabaseConfigured } from './supabase.js';

const notConfigured = { ok: false, error: 'Backend not configured', data: [] };

async function me() {
  const { data } = await supabase.auth.getSession();
  return (data && data.session && data.session.user) || null;
}

function genRef() {
  return 'TKT-' + Date.now().toString(36).toUpperCase().slice(2) +
    Math.random().toString(36).slice(2, 4).toUpperCase();
}

function officeAlert(data) {
  try {
    // No `to`: the server defaults office alerts to the TIME_ALERT_EMAILS list.
    supabase.functions.invoke('send-email', {
      body: { template: 'support-ticket', data },
    }).then((r) => {
      if (r && r.error) console.warn('[tickets] office alert email failed:', r.error.message || r.error);
    }).catch((e) => console.warn('[tickets] office alert email failed:', e));
  } catch (e) { console.warn('[tickets] office alert email failed:', e); }
}

async function create({ subject, description, category, priority }) {
  if (!supabaseConfigured) return notConfigured;
  const user = await me();
  if (!user) return { ok: false, error: 'Sign in to submit a ticket' };
  const u = window.__shieldUser || {};
  const rec = {
    ref: genRef(),
    created_by: user.id,
    company: u.company || null,
    contact_name: u.name || null,
    contact_email: user.email || null,
    subject: (subject || '').trim(),
    description: (description || '').trim() || null,
    category: category || null,
    priority: priority || 'medium',
    thread: description ? [{ from: 'customer', by: u.name || user.email, text: description.trim(), at: Date.now() }] : [],
  };
  if (!rec.subject) return { ok: false, error: 'Subject is required' };
  const { data, error } = await supabase.from('support_tickets').insert(rec).select().single();
  if (error) return { ok: false, error: error.message };
  officeAlert({
    ref: data.ref, company: rec.company || '', contactName: rec.contact_name || '',
    ticketSubject: rec.subject, description: rec.description || '',
    category: rec.category || '', priority: rec.priority, reply: 'false',
  });
  return { ok: true, data };
}

async function list() {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase.from('support_tickets')
    .select('*').order('created_at', { ascending: false }).limit(200);
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

async function addMessage(id, text, fromOffice = false) {
  if (!supabaseConfigured) return notConfigured;
  const user = await me();
  if (!user || !(text || '').trim()) return { ok: false, error: 'Nothing to send' };
  const u = window.__shieldUser || {};
  const { data: t, error: readErr } = await supabase.from('support_tickets')
    .select('id, ref, company, contact_name, thread, status').eq('id', id).maybeSingle();
  if (readErr || !t) return { ok: false, error: (readErr && readErr.message) || 'Ticket not found' };
  const msg = { from: fromOffice ? 'shieldtech' : 'customer', by: u.name || user.email, text: text.trim(), at: Date.now() };
  const patch = { thread: [...(t.thread || []), msg] };
  // A customer reply pulls a waiting ticket back into the office queue.
  if (!fromOffice && t.status === 'waiting') patch.status = 'open';
  const { data, error } = await supabase.from('support_tickets').update(patch).eq('id', id).select().single();
  if (error) return { ok: false, error: error.message };
  if (!fromOffice) {
    officeAlert({
      ref: t.ref, company: t.company || '', contactName: t.contact_name || '',
      ticketSubject: '', description: msg.text, category: '', priority: '', reply: 'true',
    });
  }
  return { ok: true, data };
}

async function setStatus(id, status) {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase.from('support_tickets')
    .update({ status }).eq('id', id).select().single();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

window.__shieldTickets = { create, list, addMessage, setStatus };

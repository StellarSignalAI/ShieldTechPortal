/* Plan Room collaboration client — pins, chat, presence on a blueprint sheet.
   Bluebeam-Studio-style: everyone with the sheet open shares one live session.

   window.__shieldPlanCollab:
     load(drawingId)                  → { threads:[…], messages:[…] } one round trip
     createThread({drawingId, projectRef, num, x, y, title?, body?})
                                      → pin + optional first reply, returns thread
     setStatus(threadId, status)      → 'open' | 'resolved'
     send(drawingId, threadId, body)  → chat message (threadId null = session chat)
     subscribe(drawingId, cb)         → realtime; cb({type:'thread'|'message', row})
     join(drawingId, cb)              → presence; cb([{id,name}...]) on roster change;
                                        returns leave()
     counts(drawingIds)               → { [drawingId]: {open, total} } for row badges */
import { supabase, supabaseConfigured } from './supabase.js';

const me = () => (window.__shieldUser || null);
const genId = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function load(drawingId) {
  if (!supabaseConfigured || !drawingId) return { threads: [], messages: [] };
  const [t, m] = await Promise.all([
    supabase.from('plan_threads').select('*').eq('drawing_id', drawingId).order('created_at'),
    supabase.from('plan_messages').select('*').eq('drawing_id', drawingId).order('created_at').limit(1000),
  ]);
  return { threads: t.data || [], messages: m.data || [] };
}

async function createThread({ drawingId, projectRef, num, x, y, title, body }) {
  const u = me();
  if (!supabaseConfigured || !u || !drawingId) return { ok: false, error: 'offline' };
  const row = {
    id: genId('th'), drawing_id: drawingId, project_ref: projectRef || null,
    num, x: Math.round(x), y: Math.round(y), title: (title || '').trim() || null,
    created_by: u.id, created_name: u.name || u.email,
  };
  const { data, error } = await supabase.from('plan_threads').insert(row).select().maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (body && body.trim()) await send(drawingId, row.id, body);
  return { ok: true, data: data || row };
}

async function setStatus(threadId, status) {
  const u = me();
  if (!supabaseConfigured || !u || !threadId) return { ok: false };
  const patch = status === 'resolved'
    ? { status, resolved_by: u.name || u.email, resolved_at: new Date().toISOString() }
    : { status: 'open', resolved_by: null, resolved_at: null };
  const { error } = await supabase.from('plan_threads').update(patch).eq('id', threadId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function send(drawingId, threadId, body) {
  const u = me();
  if (!supabaseConfigured || !u || !drawingId || !body || !body.trim()) return { ok: false, error: 'missing' };
  const { data, error } = await supabase.from('plan_messages').insert({
    drawing_id: drawingId, thread_id: threadId || null,
    sender_id: u.id, sender_name: u.name || u.email, sender_role: u.role || 'Staff',
    body: body.trim(),
  }).select().maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

/* One realtime channel per open sheet; INSERTs and thread UPDATEs stream in. */
function subscribe(drawingId, cb) {
  if (!supabaseConfigured || !drawingId) return () => {};
  const ch = supabase.channel('plan-db-' + drawingId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'plan_messages', filter: `drawing_id=eq.${drawingId}` },
      (p) => { try { cb({ type: 'message', row: p.new }); } catch {} })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_threads', filter: `drawing_id=eq.${drawingId}` },
      (p) => { try { cb({ type: 'thread', row: p.new }); } catch {} })
    .subscribe();
  return () => { try { supabase.removeChannel(ch); } catch {} };
}

/* Presence — who has this sheet open right now. */
function join(drawingId, cb) {
  const u = me();
  if (!supabaseConfigured || !drawingId || !u) return () => {};
  const ch = supabase.channel('plan-live-' + drawingId, { config: { presence: { key: u.id } } });
  const roster = () => {
    const state = ch.presenceState();
    const people = Object.entries(state).map(([id, metas]) => ({ id, name: (metas[0] || {}).name || 'Teammate' }));
    try { cb(people); } catch {}
  };
  ch.on('presence', { event: 'sync' }, roster)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') ch.track({ name: u.name || u.email, at: Date.now() });
    });
  return () => { try { supabase.removeChannel(ch); } catch {} };
}

async function counts(drawingIds) {
  if (!supabaseConfigured || !drawingIds || !drawingIds.length) return {};
  const { data } = await supabase.from('plan_threads')
    .select('drawing_id, status').in('drawing_id', drawingIds);
  const out = {};
  (data || []).forEach(t => {
    const c = out[t.drawing_id] || (out[t.drawing_id] = { open: 0, total: 0 });
    c.total++; if (t.status === 'open') c.open++;
  });
  return out;
}

window.__shieldPlanCollab = { load, createThread, setStatus, send, subscribe, join, counts };

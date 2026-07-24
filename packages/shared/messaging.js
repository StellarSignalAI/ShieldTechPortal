/* Field ⇄ office messaging. One thread per technician (keyed by the tech's
   profile id). The tech app talks to "dispatch"; any Admin/Staff/Manager in the
   portal sees every thread and can reply. Realtime so both ends update live.

   window.__shieldChat:
     myThreadId()                     → the signed-in tech's own thread id
     send(threadId, body, meta?)      → insert a message (sender = me)
     list(threadId)                   → messages in a thread, oldest→newest
     threads()                        → [{threadId, name, last, lastAt, unread}] (dispatch inbox)
     markRead(threadId)               → mark the other side's messages read
     subscribe(cb)                    → realtime; cb(message) on any new message
     unreadTotal()                    → count of unread across visible threads */
import { supabase, supabaseConfigured } from './supabase.js';

const me = () => (window.__shieldUser || null);

function myThreadId() { const u = me(); return u ? u.id : null; }

async function send(threadId, body, meta = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'offline' };
  const u = me();
  if (!u || !threadId || !body || !body.trim()) return { ok: false, error: 'missing' };
  const { data, error } = await supabase.from('messages').insert({
    thread_id: threadId,
    sender_id: u.id,
    sender_name: u.name || u.email,
    sender_role: u.role || 'Technician',
    body: body.trim(),
    work_order_id: meta.workOrderId || null,
  }).select().maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

async function list(threadId) {
  if (!supabaseConfigured || !threadId) return [];
  const { data } = await supabase.from('messages')
    .select('*').eq('thread_id', threadId).order('created_at', { ascending: true }).limit(500);
  return data || [];
}

// Dispatch inbox — one row per technician thread, newest activity first.
async function threads() {
  if (!supabaseConfigured) return [];
  const { data } = await supabase.from('messages')
    .select('thread_id, sender_id, sender_name, body, created_at, read_at')
    .order('created_at', { ascending: false }).limit(1000);
  if (!data) return [];
  const uid = (me() || {}).id;
  const byThread = new Map();
  for (const m of data) {
    let t = byThread.get(m.thread_id);
    if (!t) { t = { threadId: m.thread_id, name: null, last: m.body, lastAt: m.created_at, unread: 0 }; byThread.set(m.thread_id, t); }
    // Unread = messages from the other person not yet read.
    if (!m.read_at && m.sender_id !== uid) t.unread++;
    // Name the thread after the technician (thread owner), falling back to any
    // sender name seen on the thread.
    if (m.sender_id === m.thread_id && !t.name) t.name = m.sender_name;
    if (!t.name) t.name = m.sender_name;
  }
  // Resolve technician display names from profiles for threads with no tech-sent msg.
  const ids = [...byThread.keys()];
  if (ids.length) {
    const { data: profs } = await supabase.from('profiles').select('id,name,email').in('id', ids);
    (profs || []).forEach(p => { const t = byThread.get(p.id); if (t) t.name = p.name || p.email || t.name; });
  }
  return [...byThread.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

async function markRead(threadId) {
  if (!supabaseConfigured || !threadId) return;
  const uid = (me() || {}).id;
  await supabase.from('messages').update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId).is('read_at', null).neq('sender_id', uid);
}

async function unreadTotal() {
  if (!supabaseConfigured) return 0;
  const uid = (me() || {}).id;
  const { count } = await supabase.from('messages')
    .select('id', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', uid);
  return count || 0;
}

let channel = null;
const subscribers = new Set();
function subscribe(cb) {
  subscribers.add(cb);
  if (!channel && supabaseConfigured) {
    channel = supabase.channel('messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => { subscribers.forEach(fn => { try { fn(payload.new); } catch {} }); })
      .subscribe();
  }
  return () => { subscribers.delete(cb); };
}

window.__shieldChat = { myThreadId, send, list, threads, markRead, unreadTotal, subscribe };

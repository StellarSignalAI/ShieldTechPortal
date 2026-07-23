/* Shared time & labor layer — technician hours, portal approval, Rippling sync.
   Exposed as window.__shieldTime for vendored proto modules.
   Every call degrades gracefully when Supabase is unconfigured. */
import { supabase, supabaseConfigured } from './supabase.js';

const notConfigured = { ok: false, error: 'Backend not configured' };

async function fnHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

/* Technician: list my entries (newest first) */
export async function myEntries(limit = 50) {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .order('work_date', { ascending: false })
    .limit(limit);
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

/* Technician: log hours. status 'draft' keeps it editable/deletable on the
   phone; 'submitted' sends it straight to the portal approval queue. Pass
   { draft: true } to save without submitting (accumulate the week, submit later). */
export async function submitHours({ workDate, startAt, endAt, breakMinutes = 0, hours, jobRef, notes, draft = false }) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { ok: false, error: 'Sign in to submit hours' };
  const computed = hours != null ? Number(hours)
    : startAt && endAt ? Math.max(0, (new Date(endAt) - new Date(startAt)) / 3600000 - breakMinutes / 60) : 0;
  const { data, error } = await supabase.from('time_entries').insert({
    tech_id: u.user.id,
    work_date: workDate,
    start_at: startAt || null,
    end_at: endAt || null,
    break_minutes: breakMinutes,
    hours: Math.round(computed * 100) / 100,
    job_ref: jobRef || null,
    notes: notes || null,
    status: draft ? 'draft' : 'submitted',
  }).select().maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

/* Technician: delete one of my own entries (blocked by RLS once approved/paid). */
export async function deleteEntry(id) {
  if (!supabaseConfigured) return notConfigured;
  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* Technician: submit every draft entry in [weekStart, weekEnd] (YYYY-MM-DD)
   to the approval queue at once. Returns how many were submitted. */
export async function submitWeek(weekStart, weekEnd) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { ok: false, error: 'Sign in to submit hours' };
  const { data, error } = await supabase.from('time_entries')
    .update({ status: 'submitted' })
    .eq('tech_id', u.user.id)
    .eq('status', 'draft')
    .gte('work_date', weekStart)
    .lte('work_date', weekEnd)
    .select();
  return error ? { ok: false, error: error.message } : { ok: true, count: (data || []).length };
}

/* Portal (Admin/Staff): approval queue + full ledger */
export async function pendingEntries() {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase
    .from('time_entries')
    .select('*, tech:profiles!time_entries_tech_id_fkey(id,name,email,role)')
    .eq('status', 'submitted')
    .order('work_date', { ascending: true });
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export async function laborLedger(limit = 200) {
  if (!supabaseConfigured) return notConfigured;
  const [entriesRes, workersRes] = await Promise.all([
    supabase.from('time_entries')
      .select('*, tech:profiles!time_entries_tech_id_fkey(id,name,email,role)')
      .order('work_date', { ascending: false }).limit(limit),
    supabase.from('rippling_workers').select('*'),
  ]);
  if (entriesRes.error) return { ok: false, error: entriesRes.error.message };
  return { ok: true, data: { entries: entriesRes.data, workers: workersRes.data || [] } };
}

export async function setEntryStatus(id, status, rejectionReason) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  const patch = { status };
  if (status === 'approved') { patch.approved_by = u?.user?.id || null; patch.approved_at = new Date().toISOString(); }
  if (status === 'rejected') patch.rejection_reason = rejectionReason || null;
  const { data, error } = await supabase.from('time_entries').update(patch).eq('id', id).select().maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

/* Fire the two-way Rippling sync (approve flow calls this after approving) */
export async function ripplingSync(direction = 'both') {
  if (!supabaseConfigured) return notConfigured;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rippling-sync`, {
      method: 'POST',
      headers: await fnHeaders(),
      body: JSON.stringify({ direction }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

window.__shieldTime = { myEntries, submitHours, deleteEntry, submitWeek, pendingEntries, laborLedger, setEntryStatus, ripplingSync };

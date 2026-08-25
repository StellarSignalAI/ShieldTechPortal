/* Shared time & labor layer — technician hours, portal approval, Rippling sync.
   Exposed as window.__shieldTime for vendored proto modules.
   Every call degrades gracefully when Supabase is unconfigured. */
import { supabase, supabaseConfigured } from './supabase.js';

const notConfigured = { ok: false, error: 'Backend not configured' };

/* Office recipients alerted whenever a technician submits hours for approval. */
const TIME_ALERT_TO = ['daniel@shieldtechsolutions.com', 'aaron@shieldtechsolutions.com'];

/* Fire-and-forget office alert (send-email 'timesheet-submitted'). Never
   blocks or fails the submission itself. */
function notifyTimeSubmitted(user, { workDate, hours, jobRef, notes, count }) {
  try {
    const techName = (user?.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user?.email || '';
    supabase.functions.invoke('send-email', {
      body: {
        to: TIME_ALERT_TO,
        template: 'timesheet-submitted',
        data: {
          techName,
          workDate: workDate || '',
          hours: hours != null ? String(hours) : '',
          jobRef: jobRef || '',
          notes: notes || '',
          count: count != null ? String(count) : '',
        },
      },
    }).catch(() => {});
  } catch { /* alert is best-effort */ }
}

async function fnHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

/* Technician: list my entries (newest first). Date-bound to the last 60 days
   with a limit high enough that 14-day views can't silently truncate. */
export async function myEntries(limit = 500) {
  if (!supabaseConfigured) return notConfigured;
  const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  let q = supabase
    .from('time_entries')
    .select('*')
    .gte('work_date', since)
    .order('work_date', { ascending: false })
    .limit(limit);
  // Explicit tech filter when identity is known; RLS remains the backstop.
  const uid = window.__shieldUser?.id;
  if (uid) q = q.eq('tech_id', uid);
  const { data, error } = await q;
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
  if (error) return { ok: false, error: error.message };
  if (!draft) notifyTimeSubmitted(u.user, { workDate, hours: data?.hours, jobRef, notes });
  return { ok: true, data };
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
  if (error) return { ok: false, error: error.message };
  const rows = data || [];
  if (rows.length) {
    const latest = rows.map(r => r.work_date).sort().pop();
    const total = Math.round(rows.reduce((s, r) => s + (Number(r.hours) || 0), 0) * 100) / 100;
    notifyTimeSubmitted(u.user, { workDate: latest, hours: total, count: rows.length });
  }
  return { ok: true, count: rows.length };
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

/* ── Payroll: weekly hours × rate → owed / paid ─────────────────────────────
   Rate precedence: profiles.hourly_rate (set on the Payroll screen), falling
   back to Rippling's mirrored pay_rate. Marking a week paid snapshots the
   hours/rate/amount into payroll_payments and stamps the week's approved
   entries status='paid'. */
export async function payrollData(sinceISO) {
  if (!supabaseConfigured) return notConfigured;
  const since = sinceISO || (() => { const d = new Date(); d.setDate(d.getDate() - 70); return d.toISOString().slice(0, 10); })();
  const [entriesRes, profilesRes, workersRes, paymentsRes] = await Promise.all([
    supabase.from('time_entries')
      .select('id,tech_id,work_date,hours,job_ref,notes,status')
      .gte('work_date', since).order('work_date', { ascending: true }).limit(3000),
    supabase.from('profiles').select('id,name,email,role,hourly_rate'),
    supabase.from('rippling_workers').select('profile_id,pay_rate'),
    supabase.from('payroll_payments').select('*').gte('week_start', since),
  ]);
  if (entriesRes.error) return { ok: false, error: entriesRes.error.message };
  return {
    ok: true,
    data: {
      entries: entriesRes.data || [],
      profiles: profilesRes.data || [],
      workers: workersRes.data || [],
      payments: paymentsRes.data || [],
    },
  };
}

export async function setHourlyRate(techId, rate) {
  if (!supabaseConfigured) return notConfigured;
  const { error } = await supabase.from('profiles')
    .update({ hourly_rate: rate == null ? null : Number(rate) }).eq('id', techId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function markWeekPaid({ techId, weekStart, weekEnd, hours, rate, amount, note }) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('payroll_payments').upsert({
    tech_id: techId, week_start: weekStart,
    hours: Number(hours) || 0, rate: rate == null ? null : Number(rate),
    amount: Number(amount) || 0, note: note || null,
    paid_by: u?.user?.id || null, paid_at: new Date().toISOString(),
  }, { onConflict: 'tech_id,week_start' });
  if (error) return { ok: false, error: error.message };
  // Approved hours in the paid week advance to 'paid' (best-effort).
  await supabase.from('time_entries').update({ status: 'paid' })
    .eq('tech_id', techId).gte('work_date', weekStart).lte('work_date', weekEnd)
    .in('status', ['approved', 'synced']);
  return { ok: true };
}

export async function unmarkWeekPaid(techId, weekStart, weekEnd) {
  if (!supabaseConfigured) return notConfigured;
  const { error } = await supabase.from('payroll_payments').delete()
    .eq('tech_id', techId).eq('week_start', weekStart);
  if (error) return { ok: false, error: error.message };
  await supabase.from('time_entries').update({ status: 'approved' })
    .eq('tech_id', techId).gte('work_date', weekStart).lte('work_date', weekEnd)
    .eq('status', 'paid');
  return { ok: true };
}

window.__shieldTime = { myEntries, submitHours, deleteEntry, submitWeek, pendingEntries, laborLedger, setEntryStatus, ripplingSync, payrollData, setHourlyRate, markWeekPaid, unmarkWeekPaid };

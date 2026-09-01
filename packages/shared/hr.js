/* Shared HR / Rippling / BI layer — talks to the `hr` edge function (all
   Rippling traffic and approvals are server-side; no Rippling token ever
   reaches the browser) and reads the HR/BI tables under RLS.
   Exposed as window.__shieldHR for the vendored proto screens. */
import { supabase, supabaseConfigured } from './supabase.js';
import './labor-calc.js';

const notConfigured = { ok: false, error: 'Backend not configured' };

async function fnHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

/* Every server-side operation goes through the hr function's action API. */
export async function hrAction(action, params = {}) {
  if (!supabaseConfigured) return notConfigured;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hr`, {
      method: 'POST', headers: await fnHeaders(),
      body: JSON.stringify({ action, ...params }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export const hrStatus = () => hrAction('status');
export const setFlags = (flags) => hrAction('set_flags', { flags });
export const syncWorkers = (email) => hrAction('sync_workers', email ? { email } : {});
export const linkWorker = (workerId, profileId) => hrAction('link_worker', { workerId, profileId });
export const runExceptions = (weeks) => hrAction('exceptions_run', weeks ? { weeks } : {});
export const preparePayroll = (periodStart, periodEnd) => hrAction('payroll_prepare', { periodStart, periodEnd });
export const approveAction = (id) => hrAction('action_approve', { id });
export const rejectAction = (id) => hrAction('action_reject', { id });
export const executeAction = (id) => hrAction('action_execute', { id });
export const runMetrics = () => hrAction('metrics_run');
export const businessBrief = () => hrAction('brief');

/* ── Direct table reads (RLS: office roles) ──────────────────────────────── */
async function readTable(table, shape) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  let q = supabase.from(table).select(shape?.select || '*');
  for (const [col, val] of Object.entries(shape?.eq || {})) q = q.eq(col, val);
  if (shape?.order) q = q.order(shape.order.col, { ascending: !!shape.order.asc });
  q = q.limit(shape?.limit || 200);
  const { data, error } = await q;
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

export const workers = () => readTable('rippling_workers', { order: { col: 'name', asc: true }, limit: 500 });
export const syncRuns = (limit = 20) => readTable('integration_sync_runs', { order: { col: 'started_at' }, limit });
export const exceptions = (status = 'open') =>
  readTable('payroll_exceptions', { eq: status === 'all' ? {} : { status }, order: { col: 'created_at' }, limit: 300 });
export const snapshots = (limit = 30) => readTable('payroll_snapshots', { order: { col: 'period_start' }, limit });
export const actions = (limit = 100) => readTable('proposed_actions', { order: { col: 'created_at' }, limit });
export const recommendations = () => readTable('business_recommendations', { eq: { status: 'new' }, order: { col: 'created_at' }, limit: 50 });
export const metricHistory = (metric, limit = 26) =>
  readTable('financial_metric_snapshots', { eq: metric ? { metric } : {}, order: { col: 'created_at' }, limit });

export async function auditLog({ action, actor, limit = 200 } = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  let q = supabase.from('audit_events').select('*').order('created_at', { ascending: false }).limit(limit);
  if (action) q = q.ilike('action', `${action}%`);
  if (actor) q = q.eq('actor', actor);
  const { data, error } = await q;
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

export async function setExceptionStatus(id, status) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  const patch = { status };
  if (status === 'resolved') { patch.resolved_by = u?.user?.id || null; patch.resolved_at = new Date().toISOString(); }
  const { error } = await supabase.from('payroll_exceptions').update(patch).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* Propose an action for human approval. AI/UI alike can only create rows in
   awaiting_approval — approval and execution live server-side in the hr fn. */
export async function proposeAction({ kind, summary, payload, via = 'ui', expiresDays = 7 }) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { ok: false, error: 'Sign in required' };
  const { data, error } = await supabase.from('proposed_actions').insert({
    kind, summary, payload: payload || {},
    status: 'awaiting_approval', created_by: u.user.id, created_via: via,
    expires_at: new Date(Date.now() + expiresDays * 86400000).toISOString(),
  }).select().maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export const laborConfig = async () => {
  if (!supabaseConfigured) return notConfigured;
  const { data, error } = await supabase.from('labor_cost_config').select('*').eq('id', 1).maybeSingle();
  return error ? { ok: false, error: error.message } : { ok: true, data: data || { id: 1, components: [] } };
};

export async function saveLaborConfig(components) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('labor_cost_config').upsert({
    id: 1, components: components || [], updated_by: u?.user?.id || null, updated_at: new Date().toISOString(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function saveForecast(params, result) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('staffing_forecasts').insert({ params, result, created_by: u?.user?.id || null });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function saveScenario(kind, inputs, outputs) {
  if (!supabaseConfigured) return notConfigured;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('scenario_runs').insert({ kind, inputs, outputs, created_by: u?.user?.id || null });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setRecommendationStatus(id, status) {
  if (!supabaseConfigured) return notConfigured;
  const { error } = await supabase.from('business_recommendations').update({ status }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

window.__shieldHR = {
  hrAction, hrStatus, setFlags, syncWorkers, linkWorker, runExceptions, preparePayroll,
  approveAction, rejectAction, executeAction, runMetrics, businessBrief,
  workers, syncRuns, exceptions, snapshots, actions, recommendations, metricHistory,
  auditLog, setExceptionStatus, proposeAction,
  laborConfig, saveLaborConfig, saveForecast, saveScenario, setRecommendationStatus,
};

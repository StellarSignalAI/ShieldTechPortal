/* UniFi controller client — window.__shieldUniFi.
   Bridges ShieldTech OS to the unifi-proxy edge function and the unifi_*
   tables it fills:
     status()                      → {controllers (no keys), devices}
     save(controller) / remove(id) → manage a customer site controller
     test(id) / sync(id)           → reach the controller / pull devices now
     devices({customer, site})     → live device rows (staff RLS)
     events({customer, since})     → door openings, unlocks, offline/online
     unlock(id, doorId, actor)     → Access remote unlock (logged server-side)
     snapshot(id, cameraId)        → Protect snapshot as a data URL
   Every call degrades to {ok:false} when Supabase isn't configured, so the
   console keeps rendering from the asset registry. */
import { supabase, supabaseConfigured } from './supabase.js';

const notConfigured = { ok: false, error: 'Backend not configured' };
const FN = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-proxy`;

async function call(body) {
  if (!supabaseConfigured) return notConfigured;
  try {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(FN(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}

const status = () => call({ action: 'status' });
const save = (controller) => call({ action: 'save', controller });
const remove = (id) => call({ action: 'remove', id });
const test = (id) => call({ action: 'test', id });
const sync = (id) => call(id ? { action: 'sync', id } : { action: 'sync-all' });
const unlock = (id, doorId, actor) => call({ action: 'unlock', id, door_id: doorId, actor });
const snapshot = (id, cameraId, hq) => call({ action: 'snapshot', id, camera_id: cameraId, hq: !!hq });

async function devices({ customer, site } = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  let q = supabase.from('unifi_devices').select('*').order('kind').order('name').limit(2000);
  if (customer) q = q.eq('customer', customer);
  if (site) q = q.eq('site', site);
  const { data, error } = await q;
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}
async function events({ customer, since, limit = 300 } = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  let q = supabase.from('unifi_events').select('*').order('at', { ascending: false }).limit(limit);
  if (customer) q = q.eq('customer', customer);
  if (since) q = q.gte('at', new Date(since).toISOString());
  const { data, error } = await q;
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}
async function controllers() {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  const { data, error } = await supabase.from('unifi_controllers_public').select('*').order('customer').order('site');
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

window.__shieldUniFi = { status, save, remove, test, sync, unlock, snapshot, devices, events, controllers, configured: supabaseConfigured };

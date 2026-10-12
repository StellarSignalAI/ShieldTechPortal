/* Live technician location — the real cross-device feed.

   The tech app streams GPS (screen-fleet.jsx → FleetTransport.publish). That
   call lands here and is written to the `tech_locations` table: ONE row per
   technician, rewritten in place on every fix and refreshed by a heartbeat so
   "updated_at" only goes stale when the phone really stopped reporting.

   Every portal / tech surface that shows the fleet (Dispatch, Fleet map, work
   orders, the mobile home) subscribes to that table over realtime, pulls the
   full roster on load and whenever the app comes back to the front, and polls
   as a safety net — so dispatch sees where every tech is, constantly, on any
   device. With no Supabase config this module is a no-op (positions stay on
   the device via the local fleet store).

   window.__shieldFleetLive = { publish(pos), offDuty(), refresh() } */
import { supabase, supabaseConfigured } from './supabase.js';

const TABLE = 'tech_locations';
const MIN_PUSH_MS = 4000;      // at most one write every 4s while moving
const HEARTBEAT_MS = 45000;    // re-send the last fix so the row never looks stale while live
const POLL_MS = 60000;         // belt-and-braces refetch for subscribers

let lastPush = 0, lastPos = null, lastUser = null;
let heartbeat = null, poll = null, channel = null, subscribed = false;

const me = () => window.__shieldUser || null;

function rowFor(pos, extra = {}) {
  const u = me() || lastUser;
  return {
    tech_id: u.id,
    tech_key: u.initials || u.id,
    name: u.name || u.email || null,
    role: u.role || 'Technician',
    lat: pos.lat, lng: pos.lng,
    accuracy: pos.accuracy == null ? null : pos.accuracy,
    heading: pos.heading == null || Number.isNaN(pos.heading) ? null : pos.heading,
    speed: pos.speed == null || Number.isNaN(pos.speed) ? null : pos.speed,
    on_duty: true,
    status: pos.status || 'on-site',
    source: pos.source || 'geolocation',
    updated_at: new Date().toISOString(),
    ...extra,
  };
}

async function write(row) {
  try { await supabase.from(TABLE).upsert(row, { onConflict: 'tech_id' }); } catch { /* offline — next fix retries */ }
}

function armHeartbeat() {
  clearInterval(heartbeat);
  heartbeat = setInterval(() => { if (lastPos && (me() || lastUser)) write(rowFor(lastPos)); }, HEARTBEAT_MS);
}

/* Called by FleetTransport on every GPS fix from this device. */
function publish(pos, { force = false } = {}) {
  if (!supabaseConfigured) return;
  const u = me(); if (!u || !u.id) return;
  lastUser = u; lastPos = pos;
  const now = Date.now();
  if (!force && now - lastPush < MIN_PUSH_MS) return;
  lastPush = now;
  write(rowFor(pos));
  armHeartbeat();
}

/* Sign-out / explicit stop: keep the last position but mark the tech off duty. */
function offDuty() {
  clearInterval(heartbeat); heartbeat = null;
  if (!supabaseConfigured || !lastPos || !(me() || lastUser)) return;
  write(rowFor(lastPos, { on_duty: false }));
}

/* ── Subscriber side (portal + tech) ── */
function apply(row) {
  if (!row || row.lat == null || row.lng == null) return;
  if (typeof window.fleetApplyRemote === 'function') window.fleetApplyRemote(row);
}
function remove(row) {
  if (row && typeof window.fleetRemoveRemote === 'function') window.fleetRemoveRemote(row);
}

async function refresh() {
  if (!supabaseConfigured) return;
  try {
    const { data } = await supabase.from(TABLE).select('*');
    if (Array.isArray(data)) data.forEach(apply);
  } catch { /* offline */ }
}

function subscribe() {
  if (subscribed || !supabaseConfigured) return;
  subscribed = true;
  refresh();
  try {
    channel = supabase.channel('tech_locations_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        if (payload.eventType === 'DELETE') remove(payload.old);
        else apply(payload.new);
      })
      .subscribe();
  } catch { /* realtime unavailable — the poll below still keeps it live */ }
  clearInterval(poll);
  poll = setInterval(() => { if (document.visibilityState !== 'hidden') refresh(); }, POLL_MS);
  const back = () => { if (document.visibilityState !== 'hidden') refresh(); };
  window.addEventListener('focus', back);
  document.addEventListener('visibilitychange', back);
  window.addEventListener('pageshow', back);
}

if (supabaseConfigured) {
  window.addEventListener('shield:auth', (e) => {
    const u = me();
    if (u && u.id) { lastUser = u; subscribe(); }
    else if (e && e.detail && e.detail.authed === false) offDuty();
  });
  supabase.auth.getSession().then(({ data }) => { if (data.session && me()) subscribe(); }).catch(() => {});
}

window.__shieldFleetLive = { publish, offDuty, refresh };

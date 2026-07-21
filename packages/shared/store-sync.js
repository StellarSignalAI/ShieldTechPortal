/* Cross-device store sync — desktop ⇄ mobile ⇄ tech see the same platform data.
   Mirrors every ShieldTech store (window.__shieldStores) into the Supabase
   `app_state` table: business data is company-wide shared; personal preference
   stores are per-user. localStorage stays the offline/unconfigured fallback —
   with no Supabase config this module is a no-op. Last write wins. */
import { supabase, supabaseConfigured } from './supabase.js';

const PERSONAL_KEYS = new Set(['mobiletabs', 'ssprefs', 'svprefs', 'wofocus']);

const muted = new Set();          // keys currently applying a remote value
const dirty = new Map();          // key -> debounce timer
const lastSeen = new Map();       // key -> updated_at we already applied
let uid = null;
let started = false;

const rowId = (key) => (PERSONAL_KEYS.has(key) ? `${key}:${uid}` : key);

function applyRow(row) {
  const stores = window.__shieldStores || {};
  const store = stores[row.key];
  if (!store) return;
  if (PERSONAL_KEYS.has(row.key) && row.owner !== uid) return;
  if (lastSeen.get(row.key) === row.updated_at) return;
  lastSeen.set(row.key, row.updated_at);
  const current = JSON.stringify(store.get());
  const incoming = JSON.stringify(row.value);
  if (current === incoming) return;
  muted.add(row.key);
  try { store.applyRemote(row.value); } finally { muted.delete(row.key); }
}

async function pullAll() {
  if (!uid) return;
  const { data, error } = await supabase.from('app_state').select('id, key, owner, value, updated_at');
  if (error || !Array.isArray(data)) return;
  data.forEach(applyRow);
}

function push(key) {
  const stores = window.__shieldStores || {};
  const store = stores[key];
  if (!store || !uid) return;
  const now = new Date().toISOString();
  lastSeen.set(key, now);
  supabase.from('app_state').upsert({
    id: rowId(key),
    key,
    owner: PERSONAL_KEYS.has(key) ? uid : null,
    value: store.get(),
    updated_at: now,
  }).then(() => {}, () => {});
}

function watchStores() {
  const stores = window.__shieldStores || {};
  Object.entries(stores).forEach(([key, store]) => {
    if (store.__syncWatched) return;
    store.__syncWatched = true;
    store.subscribe(() => {
      if (muted.has(key) || !uid) return;
      clearTimeout(dirty.get(key));
      dirty.set(key, setTimeout(() => push(key), 800));
    });
  });
}

function startRealtime() {
  try {
    supabase
      .channel('app_state_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload) => {
        if (payload.new && payload.new.key) applyRow(payload.new);
      })
      .subscribe();
  } catch { /* realtime unavailable — focus refetch still covers sync */ }
}

async function begin() {
  if (started) return;
  started = true;
  watchStores();
  await pullAll();
  watchStores(); // stores registered after first pass
  startRealtime();
  const refetch = () => { if (document.visibilityState !== 'hidden') pullAll(); };
  window.addEventListener('focus', refetch);
  document.addEventListener('visibilitychange', refetch);
}

if (supabaseConfigured) {
  window.addEventListener('shield:auth', (e) => {
    const u = window.__shieldUser;
    if (u && u.id) { uid = u.id; begin(); }
  });
  // Session may already be live before this module attaches its listener.
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) { uid = data.session.user.id; begin(); }
  });
}

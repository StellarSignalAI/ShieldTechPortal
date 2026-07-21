/* Shared auth layer for all ShieldTech apps.
   Wraps the Supabase client: session tracking, Google OAuth, email/password,
   forced password change, reset flow, and the per-app rights gate.
   When Supabase isn't configured the platform stays open (dev mode). */
import { supabase, supabaseConfigured } from './supabase.js';

const listeners = new Set();
const state = {
  configured: supabaseConfigured,
  loading: supabaseConfigured,
  session: null,
  profile: null,
  recovery: false, // true when the tab was opened from a password-recovery link
};

function initialsOf(nameOrEmail) {
  const src = (nameOrEmail || '').trim();
  if (!src) return '·';
  const words = src.replace(/@.*$/, '').split(/[\s._-]+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '·';
}

function publish() {
  const p = state.profile;
  const u = state.session && state.session.user;
  window.__shieldUser = u ? {
    id: u.id,
    email: u.email,
    name: (p && p.name) || (u.user_metadata && u.user_metadata.full_name) || u.email,
    role: (p && p.role) || 'Staff',
    initials: initialsOf((p && p.name) || (u.user_metadata && u.user_metadata.full_name) || u.email),
    appRights: (p && p.app_rights) || {},
    mustChangePassword: Boolean(p && p.must_change_password),
  } : null;
  listeners.forEach(fn => { try { fn(state); } catch {} });
}

async function loadProfile() {
  if (!supabase || !state.session) { state.profile = null; return; }
  const { data } = await supabase
    .from('profiles')
    .select('id,email,name,role,app_rights,must_change_password')
    .eq('id', state.session.user.id)
    .maybeSingle();
  state.profile = data || null;
}

export function onAuthChange(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function authState() { return state; }

export async function signInWithPassword(email, password) {
  if (!supabase) return { error: { message: 'Backend not configured' } };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Backend not configured' } };
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function changePassword(newPassword) {
  if (!supabase) return { error: { message: 'Backend not configured' } };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error };
  if (state.session) {
    await supabase.from('profiles')
      .update({ must_change_password: false })
      .eq('id', state.session.user.id);
    await loadProfile();
    state.recovery = false;
    publish();
  }
  return { error: null };
}

export async function requestPasswordReset(email) {
  if (!supabase) return { error: { message: 'Backend not configured' } };
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
}

/* Rights check for the current app id ('portal' | 'tech' | 'customer'). */
export function hasAppRight(appId) {
  const p = state.profile;
  if (!p) return false;
  if (p.role === 'Admin') return true;
  return Boolean(p.app_rights && p.app_rights[appId]);
}

if (supabase) {
  supabase.auth.getSession().then(async ({ data }) => {
    state.session = data.session || null;
    await loadProfile();
    state.loading = false;
    publish();
  });
  supabase.auth.onAuthStateChange(async (event, session) => {
    state.session = session || null;
    if (event === 'PASSWORD_RECOVERY') state.recovery = true;
    await loadProfile();
    state.loading = false;
    publish();
  });
} else {
  publish();
}

window.__shieldAuth = {
  onAuthChange, authState, signInWithPassword, signInWithGoogle, signOut,
  changePassword, requestPasswordReset, hasAppRight,
};

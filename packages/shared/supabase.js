/* Shared Supabase client for all ShieldTech apps.
   Reads config from Vite env; when unconfigured, exports null so screens can
   show a clear "backend not configured" state instead of crashing. */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url, anonKey) : null;

window.__shieldSupabase = supabase;
window.__shieldSupabaseConfigured = supabaseConfigured;

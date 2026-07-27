/* Auto-Bid client — window.__shieldBids.
   Bridges the portal to the bid-builder edge function and the bids table:
     list()                    → bids joined with their opportunities
     build(opportunityId)      → (re)build one bid
     buildPending(limit)       → build bids for all leads that have none
     proposal(bidId, tier)     → generate the full proposal for a tier
     markSent(bidId, to)       → record that the proposal was emailed
   Degrades gracefully (ok:false) when Supabase isn't configured. */
import { supabase, supabaseConfigured } from './supabase.js';

async function call(body) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  try {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bid-builder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function list() {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, buyer, state, due_at, source_url, solicitation_id, trades, status, created_at, bids(*)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return { ok: false, error: error.message, data: [] };
  return { ok: true, data: (data || []).map(o => ({ ...o, bid: (o.bids && o.bids[0]) || null })) };
}

const build = (opportunityId) => call({ opportunityId });
const buildPending = (limit = 10) => call({ mode: 'pending', limit });
const proposal = (bidId, tier) => call({ action: 'proposal', bidId, tier });

async function markSent(bidId, to) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured' };
  const { error } = await supabase.from('bids')
    .update({ sent_at: new Date().toISOString(), sent_to: to || null }).eq('id', bidId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

window.__shieldBids = { list, build, buildPending, proposal, markSent };

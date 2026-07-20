// ============================================================
// ShieldTech Secret Weapon — Shared data model (design-time)
// All shapes mirror fixtures/* and lib/contracts/*. This is
// design-time sample data only; the real app reads documented
// API routes (see CLAUDE_INTEGRATION_NOTES.md).
// ============================================================

const SW_TODAY = '2026-06-22';

/* ─────────── Users — per-user daily on-track manager ─────────── */
const SW_USERS = [];

/* ─────────── Opportunities / Bids ───────────
   Shared across Bids, Pipeline, Today details, and AI context. */
const SW_OPPS = [];

/* ─────────── Tasks — per user, the daily deck ───────────
   type: Call | Email | Bid | Source Check | Site Walk | Follow-up */
const SW_TASKS = [];

/* Top money actions per user (Today header) */
const SW_MONEY_ACTIONS = {};

/* ─────────── Pipeline rows ─────────── */
const SW_PIPELINE = [];
const SW_STAGES = ['Hot', 'Warm', 'Nurture', 'Dead'];

/* ─────────── Approvals (AI drafts await human sign-off) ─────────── */
const SW_APPROVALS = [];

/* ─────────── Diagnostics / health (admin only) ─────────── */
const SW_HEALTH = [];

/* ─────────── AI skills (from lib/hermes/skill-base.ts) ─────────── */
const SW_SHIELDAI_SKILLS = [];

/* ─────────── Industries — autonomous BD consultant coverage ───────────
   Where ShieldTech can win across every vertical, who buys, where bids live. */
const SW_INDUSTRIES = [
  { id: 'k12', name: 'K-12 Education', icon: 'building', trades: ['CCTV', 'Access', 'Intrusion', 'Div 28'], buyer: 'District facilities + procurement; school safety grants', sources: ['State eVA/eMMA/PennBid', 'County school portals', 'SAM.gov'], fit: 'Annual security refreshes, bond-funded upgrades, SRO/visitor mgmt mandates.' },
  { id: 'highered', name: 'Higher Education', icon: 'building', trades: ['Access', 'CCTV', 'Network', 'Div 27'], buyer: 'Campus public safety + capital projects office', sources: ['University bid portals', 'State procurement', 'GC bid lists'], fit: 'Campus-wide access standardization, dorm + lab security, fiber backbone.' },
  { id: 'healthcare', name: 'Healthcare / Hospitals', icon: 'health', trades: ['Access', 'CCTV', 'Intercom', 'Nurse call / Div 28'], buyer: 'Facilities director + security operations', sources: ['Health-system vendor portals', 'GPO bid lists', 'GC packages'], fit: 'Infant protection, controlled-med access, ED surveillance, wander mgmt.' },
  { id: 'datacenter', name: 'Data Centers / Colo', icon: 'topology', trades: ['Access', 'CCTV', 'Intrusion', 'Fiber'], buyer: 'Critical-facilities security + construction PM', sources: ['Hyperscale GC lists', 'Colo vendor onboarding', 'Direct RFQ'], fit: 'Mantrap access, perimeter, cage cameras — recurring multi-site build-outs.' },
  { id: 'govmuni', name: 'Government / Municipal', icon: 'compliance', trades: ['CCTV', 'Access', 'Cabling', 'Paging'], buyer: 'County/city procurement + facilities', sources: ['BidNet Direct', 'County/city portals', 'State procurement'], fit: 'Courthouse, admin, public-works security; recurring service contracts.' },
  { id: 'federal', name: 'Federal / Defense', icon: 'lock', trades: ['Access (PACS)', 'CCTV', 'Intrusion', 'Div 28'], buyer: 'GSA, agency facility security, prime integrators', sources: ['SAM.gov', 'GSA eBuy', 'Prime sub-lists'], fit: 'FICAM/PACS, controlled-area surveillance — sub to cleared primes.' },
  { id: 'transit', name: 'Transportation / Transit / Airport', icon: 'route', trades: ['CCTV', 'Access', 'Fiber', 'Paging'], buyer: 'Port authority, transit agency capital programs', sources: ['Agency procurement', 'DBE/sub programs', 'GC bid lists'], fit: 'Terminal/platform surveillance, fiber, mass-notification — DBE-friendly subs.' },
  { id: 'utilities', name: 'Utilities / Energy', icon: 'bolt', trades: ['Intrusion', 'CCTV', 'Access', 'Fiber'], buyer: 'Physical security + substation engineering', sources: ['Utility vendor registration', 'NERC CIP programs', 'EPC bid lists'], fit: 'NERC-CIP substation perimeter, control-room access — compliance-driven.' },
  { id: 'multifamily', name: 'Multifamily / Residential', icon: 'building', trades: ['Access', 'Intercom', 'CCTV', 'Cabling'], buyer: 'Property mgmt + developer construction', sources: ['Developer GC lists', 'Property mgmt RFPs', 'Direct'], fit: 'Amenity/entry access, video intercom, package-room cameras at scale.' },
  { id: 'commercial', name: 'Commercial Office / REIT', icon: 'building', trades: ['Access', 'CCTV', 'Network', 'Div 27'], buyer: 'Building engineering + tenant fit-out GCs', sources: ['GC bid lists', 'Property mgmt', 'Tenant improvement RFQs'], fit: 'Lobby access, turnstiles, tenant fit-outs — repeatable per-floor work.' },
  { id: 'retail', name: 'Retail / Grocery', icon: 'cart', trades: ['CCTV', 'Intrusion', 'Access', 'Network'], buyer: 'Loss prevention + facilities/construction', sources: ['Chain vendor programs', 'Construction GC lists', 'Direct'], fit: 'LP camera analytics, EAS, back-of-house access — multi-store rollouts.' },
  { id: 'warehouse', name: 'Warehouse / Logistics / 3PL', icon: 'inventory', trades: ['CCTV', 'Access', 'Cabling', 'Network'], buyer: 'Facility ops + distribution construction PM', sources: ['3PL vendor onboarding', 'Industrial GC lists', 'Direct'], fit: 'Dock/yard cameras, gate access, WiFi/cabling — high-square-footage jobs.' },
  { id: 'hospitality', name: 'Hospitality / Hotels', icon: 'building', trades: ['Access', 'CCTV', 'Network', 'Paging'], buyer: 'Property + brand construction standards', sources: ['Brand vendor lists', 'Renovation GCs', 'Direct'], fit: 'Guest-door access, surveillance, network — brand-standard refresh cycles.' },
  { id: 'worship', name: 'Houses of Worship / Nonprofit', icon: 'shield', trades: ['CCTV', 'Access', 'Intrusion', 'Paging'], buyer: 'Facility committee + security grant administrators', sources: ['Nonprofit Security Grant (NSGP)', 'State homeland security', 'Direct'], fit: 'Grant-funded cameras, access, mass-notify — strong margin, recurring.' },
  { id: 'financial', name: 'Financial / Banking', icon: 'dollar', trades: ['Intrusion', 'Access', 'CCTV', 'Network'], buyer: 'Corporate security + branch facilities', sources: ['Bank/CU vendor programs', 'Construction GCs', 'Direct'], fit: 'Branch alarm/UL, vault access, ATM cameras — compliance + service revenue.' },
  { id: 'manufacturing', name: 'Manufacturing / Industrial', icon: 'settings', trades: ['Access', 'CCTV', 'Intrusion', 'Fiber'], buyer: 'Plant security + facilities engineering', sources: ['Industrial GC lists', 'Direct RFQ', 'Vendor registration'], fit: 'Plant perimeter, shipping access, line cameras — recurring expansions.' },
  { id: 'seniorliving', name: 'Senior Living / CCRC', icon: 'health', trades: ['Access', 'CCTV', 'Nurse call', 'Intercom'], buyer: 'Facilities + life-safety director', sources: ['Operator vendor lists', 'Senior-housing GCs', 'Direct'], fit: 'Wander mgmt, secure memory-care access, nurse call — sticky service base.' },
  { id: 'cannabis', name: 'Cannabis', icon: 'compliance', trades: ['CCTV', 'Access', 'Intrusion', 'Network'], buyer: 'Compliance officer + multi-site operators', sources: ['State license requirements', 'Operator direct', 'MSO programs'], fit: 'State-mandated surveillance retention + access logging — every license needs it.' },
  { id: 'venue', name: 'Sports / Entertainment / Venues', icon: 'cameras', trades: ['CCTV', 'Access', 'Paging', 'Network'], buyer: 'Venue ops + event security', sources: ['Authority bid portals', 'GC lists', 'Direct'], fit: 'Crowd surveillance, credentialed access, PA/mass-notify — event-driven upgrades.' },
  { id: 'cultural', name: 'Museums / Libraries / Cultural', icon: 'knowledge', trades: ['Intrusion', 'CCTV', 'Access', 'Cabling'], buyer: 'Facilities + collections security', sources: ['Municipal/state grants', 'GC lists', 'Direct'], fit: 'Gallery intrusion, asset protection, public-space cameras — grant-funded.' },
];

/* Tag the seed opportunities with their industry. */
const SW_OPP_INDUSTRY = {};
SW_OPPS.forEach(o => { o.industry = SW_OPP_INDUSTRY[o.id] || 'commercial'; });

/* More opportunities, spread across industries (consultant-generated). */
const SW_MORE_OPPS = [];
SW_OPPS.push(...SW_MORE_OPPS);

/* ─────────── Deck extras — money-machine card types ───────────
   Cards AI injects into the daily deck beyond the call/bid tasks:
   fresh bids found overnight, A/R to collect, RMR to attach, renewals to lock. */
const SW_DECK_EXTRAS = {};

/* Compact money: 42000 → $42k, 1480000 → $1.5M */
function swK(n) {
  if (n == null) return '$0';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'k';
  return '$' + n;
}

/* Assemble the ordered daily deck for a user:
   [briefing, ...action+money cards ranked by urgency then dollars, recap].
   Task cards inherit the dollar value of their related opportunity (first
   card to touch an opp carries it, so the deck total isn't double-counted). */
function swDeckForUser(uid, mode = 'balanced') {
  const tasks = SW_TASKS.filter(t => swGetOwner('task', t.id, t.owner) === uid);
  const seen = {};
  const taskCards = tasks.map(t => {
    const opp = t.relatedOpp ? SW_OPPS.find(o => o.id === t.relatedOpp) : null;
    let value = 0;
    if (opp && !seen[opp.id]) { value = opp.value; seen[opp.id] = true; }
    return { kind: 'task', id: t.id, value, oppValue: opp ? opp.value : 0, priority: t.priority, task: t };
  });
  const extras = (SW_DECK_EXTRAS[uid] || []).map(e => ({ ...e }));
  const mid = [...taskCards, ...extras];
  const urg = p => (p === 'Urgent' ? 0 : p === 'High' ? 1 : 2);
  const due = c => c.kind === 'task' ? new Date(c.task.dueAt).getTime() : Number.MAX_SAFE_INTEGER - (c.value || 0);
  if (mode === 'money') mid.sort((a, b) => (b.value || 0) - (a.value || 0) || urg(a.priority) - urg(b.priority));
  else if (mode === 'time') mid.sort((a, b) => due(a) - due(b));
  else mid.sort((a, b) => urg(a.priority) - urg(b.priority) || (b.value || 0) - (a.value || 0));
  return [{ kind: 'briefing', id: 'briefing' }, ...mid, { kind: 'recap', id: 'recap' }];
}

/* Completed-card ids for a user (shared by Today deck + Tasks checkmarks) */
function swDoneSet(uid) {
  try { return new Set(JSON.parse(localStorage.getItem('sw:today-complete:' + uid) || '[]')); } catch { return new Set(); }
}

/* ─────────── Assignment store ───────────
   Reassign any task, pipeline account, or opportunity to a teammate.
   Overrides the seed `owner`, persists locally, and fires `sw:assign`
   so every surface (Today, Bids, Tasks, Pipeline) updates at once.
   `kind` is 'task' | 'pipeline' | 'opp'; null userId means Unassigned. */
function swAllAssign() {
  try { return JSON.parse(localStorage.getItem('sw:assignments') || '{}'); } catch { return {}; }
}
function swGetOwner(kind, id, fallback) {
  const a = swAllAssign(); const k = kind + ':' + id;
  return (k in a) ? a[k] : fallback;
}
function swSetOwner(kind, id, userId) {
  const a = swAllAssign();
  a[kind + ':' + id] = (userId == null ? null : userId);
  try { localStorage.setItem('sw:assignments', JSON.stringify(a)); } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sw:assign'));
}

window.SW = {
  TODAY: SW_TODAY, USERS: SW_USERS, OPPS: SW_OPPS, TASKS: SW_TASKS, INDUSTRIES: SW_INDUSTRIES,
  DECK_EXTRAS: SW_DECK_EXTRAS, deckForUser: swDeckForUser, swK, doneSet: swDoneSet,
  getOwner: swGetOwner, setOwner: swSetOwner, userById: (id) => SW_USERS.find(u => u.id === id) || null,
  MAPS_KEY: null, /* set to a Google Maps browser key to swap the fallback territory map for live Maps */
  industryById: (id) => SW_INDUSTRIES.find(i => i.id === id) || null,
  oppsByIndustry: (id) => SW_OPPS.filter(o => o.industry === id),
  MONEY_ACTIONS: SW_MONEY_ACTIONS, PIPELINE: SW_PIPELINE, STAGES: SW_STAGES,
  APPROVALS: SW_APPROVALS, HEALTH: SW_HEALTH, SHIELDAI_SKILLS: SW_SHIELDAI_SKILLS,
  oppById: (id) => SW_OPPS.find(o => o.id === id) || null,
  tasksForUser: (uid) => SW_TASKS.filter(t => swGetOwner('task', t.id, t.owner) === uid),
};

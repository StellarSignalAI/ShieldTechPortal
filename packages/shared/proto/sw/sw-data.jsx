// ============================================================
// ShieldTech Secret Weapon — Shared data model (design-time)
// All shapes mirror fixtures/* and lib/contracts/*. This is
// design-time sample data only; the real app reads documented
// API routes (see CLAUDE_INTEGRATION_NOTES.md).
// ============================================================

const SW_TODAY = '2026-06-22';

/* ─────────── Users — per-user daily on-track manager ─────────── */
const SW_USERS = [
  { id: 'daniel', name: 'Daniel Graham', initials: 'DG', role: 'Owner · Business Dev', territory: 'PA · NJ · NY', accent: 'var(--brand)', callGoal: 12 },
  { id: 'marcus', name: 'Marcus Reyes', initials: 'MR', role: 'Estimator', territory: 'VA · MD', accent: 'var(--status-ok)', callGoal: 8 },
  { id: 'tina', name: 'Tina Alvarez', initials: 'TA', role: 'Inside Sales', territory: 'NJ · NY', accent: '#A855F7', callGoal: 15 },
];

/* ─────────── Opportunities / Bids ───────────
   Shared across Bids, Pipeline, Today details, and AI context. */
const SW_OPPS = [
  {
    id: 'opp-fairfax-ac', title: 'Access Control & CCTV Upgrade', buyer: 'Fairfax County Public Schools',
    source: 'PennBid / FCPS eVA', sourceUrl: 'https://eva.virginia.gov/...', sourceRisk: 'Verified',
    state: 'VA', territory: 'VA', region: { x: 38, y: 72 }, lat: 38.8462, lng: -77.3064, trades: ['Access', 'CCTV', 'Div 28'],
    fit: 91, status: 'Hot', value: 480000, owner: 'daniel',
    dueAt: '2026-06-26T16:00:00Z', siteWalk: '2026-06-24T14:00:00Z',
    docs: { rfp: 'synced', drawings: 'synced', specs: 'pending', addenda: 'portal' },
    poc: { name: 'R. Whitfield', title: 'Procurement Officer', phone: '(703) 555-0142',
      why: 'Owns the security division bid and controls addenda release — the one person who can confirm the mandatory site-walk count.', route: 'Direct line, ext 4' },
    nextAction: 'Confirm mandatory site-walk attendance before Wed 2 PM.',
  },
  {
    id: 'opp-newark-fiber', title: 'Structured Cabling + Fiber Backbone', buyer: 'City of Newark — Facilities',
    source: 'BidNet Direct', sourceUrl: 'https://bidnetdirect.com/...', sourceRisk: 'Needs check',
    state: 'NJ', territory: 'NJ', region: { x: 64, y: 40 }, lat: 40.7357, lng: -74.1724, trades: ['Cabling', 'Fiber', 'Div 27'],
    fit: 78, status: 'Warm', value: 215000, owner: 'daniel',
    dueAt: '2026-07-02T17:00:00Z', siteWalk: null,
    docs: { rfp: 'synced', drawings: 'pending', specs: 'metadata', addenda: 'none' },
    poc: { name: 'Facilities Desk', title: 'Procurement (route to PM)', phone: '(973) 555-0190',
      why: 'Procurement desk is a gatekeeper — ask for the named project manager who can clarify the fiber count and conduit ownership.', route: 'Main line, ask for PM' },
    nextAction: 'Pull drawings from portal and verify fiber pair count.',
  },
  {
    id: 'opp-wachter', title: 'Low-Voltage Subcontractor — Multi-Site Rollout', buyer: 'Wachter (National Integrator)',
    source: 'Partner / Vendor list', sourceUrl: 'https://wachter.com/vendors', sourceRisk: 'Verified',
    state: 'PA', territory: 'PA', region: { x: 50, y: 44 }, lat: 39.9526, lng: -75.1652, trades: ['Access', 'CCTV', 'Cabling'],
    fit: 86, status: 'Hot', value: 320000, owner: 'daniel',
    dueAt: '2026-06-24T20:00:00Z', siteWalk: null,
    docs: { rfp: 'n/a', drawings: 'n/a', specs: 'n/a', addenda: 'none' },
    poc: { name: 'Mike (Onboarding)', title: 'Vendor / Subcontractor Onboarding', phone: '(610) 555-1200',
      why: 'Mike controls the approved-subcontractor list for PA/NJ/NY. Getting on it unlocks every Wachter site in the region, not just this one.', route: 'Direct, ext 220' },
    nextAction: 'Send capability statement + W9/COI packet, follow up Tuesday.',
  },
  {
    id: 'opp-montco-fire', title: 'Fire Alarm Support & Intrusion', buyer: 'Montgomery County (PA)',
    source: 'County procurement portal', sourceUrl: 'https://montcopa.org/bids', sourceRisk: 'Verified',
    state: 'PA', territory: 'PA', region: { x: 53, y: 47 }, lat: 40.1215, lng: -75.3399, trades: ['Fire', 'Intrusion', 'Div 28'],
    fit: 72, status: 'Warm', value: 96000, owner: 'marcus',
    dueAt: '2026-07-09T15:00:00Z', siteWalk: '2026-06-30T10:00:00Z',
    docs: { rfp: 'synced', drawings: 'synced', specs: 'synced', addenda: 'synced' },
    poc: { name: 'D. Okafor', title: 'Facilities Project Manager', phone: '(610) 555-0177',
      why: 'PM signs off on the fire-alarm scope and knows whether the incumbent is rebidding — that decides if this is worth the estimate hours.', route: 'Cell preferred' },
    nextAction: 'Estimate panel replacement count after the site walk.',
  },
  {
    id: 'opp-suffolk-intercom', title: 'Intercom & Paging — Campus Wide', buyer: 'Suffolk County (NY)',
    source: 'SAM.gov mirror', sourceUrl: 'https://sam.gov/...', sourceRisk: 'Unverified',
    state: 'NY', territory: 'NY', region: { x: 74, y: 34 }, lat: 40.7891, lng: -73.1350, trades: ['Intercom', 'Paging', 'Div 27'],
    fit: 64, status: 'Nurture', value: 140000, owner: 'tina',
    dueAt: '2026-07-18T16:00:00Z', siteWalk: null,
    docs: { rfp: 'metadata', drawings: 'none', specs: 'none', addenda: 'none' },
    poc: { name: 'Unconfirmed', title: 'Procurement (unverified)', phone: null,
      why: 'Source is a SAM.gov mirror, not the county portal. Verify the real buyer + due date before spending estimate time.', route: 'Needs source verification' },
    nextAction: 'Verify official source URL before treating as a real bid.',
  },
  {
    id: 'opp-balt-network', title: 'Network Infrastructure Refresh', buyer: 'Baltimore City Schools',
    source: 'Maryland eMMA', sourceUrl: 'https://emma.maryland.gov/...', sourceRisk: 'Verified',
    state: 'MD', territory: 'MD', region: { x: 48, y: 60 }, lat: 39.2904, lng: -76.6122, trades: ['Network', 'Cabling', 'Div 27'],
    fit: 81, status: 'Warm', value: 268000, owner: 'marcus',
    dueAt: '2026-07-05T14:00:00Z', siteWalk: '2026-06-27T09:00:00Z',
    docs: { rfp: 'synced', drawings: 'synced', specs: 'pending', addenda: 'portal' },
    poc: { name: 'L. Bryant', title: 'IT Procurement Lead', phone: '(410) 555-0163',
      why: 'IT lead, not facilities, owns this one. She can tell you whether the switch spec is locked or still open to alternates.', route: 'Email then call' },
    nextAction: 'Attend site walk Fri 9 AM, confirm switch make/model latitude.',
  },
];

/* ─────────── Tasks — per user, the daily deck ───────────
   type: Call | Email | Bid | Source Check | Site Walk | Follow-up */
const SW_TASKS = [
  // Daniel
  { id: 't-d1', owner: 'daniel', type: 'Call', title: 'Call Wachter vendor onboarding', company: 'Wachter', priority: 'Urgent', status: 'Pending', period: 'morning', dueAt: '2026-06-22T14:00:00Z', relatedOpp: 'opp-wachter',
    goal: 'Clarify subcontractor approval route and W9/COI packet requirements.',
    script: 'Hi Mike, this is Daniel with ShieldTech Security. You handle onboarding low-voltage and security subs for PA, NJ, and NY — can you walk me through getting on the approved list?',
    contactTitle: 'Vendor / Subcontractor Onboarding', contactRoute: '(610) 555-1200 ext 220',
    phone: { display: '(610) 555-1200', telHref: 'tel:+16105551200', isValid: true },
    notes: 'Ask for W9, COI, capability statement, and service-area requirements.', sync: 'Google Disconnected' },
  { id: 't-d2', owner: 'daniel', type: 'Source Check', title: 'Verify Fairfax site-walk requirement', company: 'Fairfax County Schools', priority: 'Urgent', status: 'Pending', period: 'morning', dueAt: '2026-06-22T15:00:00Z', relatedOpp: 'opp-fairfax-ac',
    goal: 'Confirm whether the Wed 2 PM site walk is mandatory before the bid clock runs out.',
    script: 'Hi, calling on the access control and CCTV upgrade solicitation — is the scheduled site walk mandatory for bid eligibility?',
    contactTitle: 'Procurement Officer', contactRoute: '(703) 555-0142 ext 4',
    phone: { display: '(703) 555-0142', telHref: 'tel:+17035550142', isValid: true },
    notes: 'If mandatory, block calendar and assign attendance today.', sync: 'Google Disconnected' },
  { id: 't-d3', owner: 'daniel', type: 'Email', title: 'Send capability statement to Wachter', company: 'Wachter', priority: 'High', status: 'Pending', period: 'midday', dueAt: '2026-06-22T17:00:00Z', relatedOpp: 'opp-wachter',
    goal: 'Get the ShieldTech packet in front of onboarding while the call is fresh.',
    script: null,
    contactTitle: 'Vendor / Subcontractor Onboarding', contactRoute: 'mike@wachter.com',
    phone: { display: null, telHref: null, isValid: false },
    notes: 'Needs approval — draft is in the approvals inbox.', sync: 'Google Disconnected' },
  { id: 't-d4', owner: 'daniel', type: 'Call', title: 'Public buyer estimating route', company: 'Nurture Public Buyer', priority: 'Medium', status: 'Pending', period: 'midday', dueAt: '2026-06-22T18:00:00Z', relatedOpp: null,
    goal: 'Find the right procurement or facilities contact route.',
    script: 'Who handles CCTV, access control, and low-voltage bid opportunities for the district?',
    contactTitle: 'Facilities / Procurement', contactRoute: 'Main office — ask for estimating',
    phone: { display: 'Main office ask for estimating', telHref: null, isValid: false },
    notes: 'No direct number yet — get a name and extension.', sync: 'Google Disconnected' },
  { id: 't-d5', owner: 'daniel', type: 'Follow-up', title: 'Newark fiber — pull drawings', company: 'City of Newark', priority: 'Medium', status: 'Pending', period: 'afternoon', dueAt: '2026-06-22T20:00:00Z', relatedOpp: 'opp-newark-fiber',
    goal: 'Download drawings from the portal and verify fiber pair count before estimating.',
    script: null,
    contactTitle: 'Procurement (route to PM)', contactRoute: '(973) 555-0190',
    phone: { display: '(973) 555-0190', telHref: 'tel:+19735550190', isValid: true },
    notes: 'Drawings are portal-only — manual pull required.', sync: 'Google Disconnected' },
  { id: 't-d6', owner: 'daniel', type: 'Bid', title: 'Build Fairfax bid package draft', company: 'Fairfax County Schools', priority: 'High', status: 'Pending', period: 'afternoon', dueAt: '2026-06-22T21:00:00Z', relatedOpp: 'opp-fairfax-ac',
    goal: 'Assemble a source-traced bid draft from verified scope and synced documents.',
    script: null,
    contactTitle: 'Internal', contactRoute: 'Bid workspace',
    phone: { display: null, telHref: null, isValid: false },
    notes: 'Specs still pending sync — flag the gap, do not invent pricing.', sync: 'Google Disconnected' },
  // Marcus
  { id: 't-m1', owner: 'marcus', type: 'Site Walk', title: 'Baltimore schools site walk prep', company: 'Baltimore City Schools', priority: 'High', status: 'Pending', period: 'morning', dueAt: '2026-06-22T13:00:00Z', relatedOpp: 'opp-balt-network',
    goal: 'Prep questions for Friday 9 AM walk — switch latitude and conduit ownership.',
    script: null, contactTitle: 'IT Procurement Lead', contactRoute: '(410) 555-0163',
    phone: { display: '(410) 555-0163', telHref: 'tel:+14105550163', isValid: true },
    notes: 'Confirm whether alternates are allowed on the switch spec.', sync: 'Google Disconnected' },
  { id: 't-m2', owner: 'marcus', type: 'Call', title: 'Montgomery County fire PM', company: 'Montgomery County PA', priority: 'Medium', status: 'Pending', period: 'midday', dueAt: '2026-06-22T16:00:00Z', relatedOpp: 'opp-montco-fire',
    goal: 'Find out if the incumbent is rebidding before committing estimate hours.',
    script: 'Hi D., calling on the fire alarm support and intrusion solicitation — is the current vendor expected to rebid?',
    contactTitle: 'Facilities Project Manager', contactRoute: '(610) 555-0177',
    phone: { display: '(610) 555-0177', telHref: 'tel:+16105550177', isValid: true },
    notes: 'Cell preferred. Keep it under two minutes.', sync: 'Google Disconnected' },
  { id: 't-m3', owner: 'marcus', type: 'Bid', title: 'Estimate Montco panel count', company: 'Montgomery County PA', priority: 'Medium', status: 'Pending', period: 'afternoon', dueAt: '2026-06-22T20:00:00Z', relatedOpp: 'opp-montco-fire',
    goal: 'Count panel replacements after the site walk and rough the labor.',
    script: null, contactTitle: 'Internal', contactRoute: 'Bid workspace',
    phone: { display: null, telHref: null, isValid: false },
    notes: 'Hold until the 6/30 walk — do not estimate blind.', sync: 'Google Disconnected' },
  // Tina
  { id: 't-t1', owner: 'tina', type: 'Source Check', title: 'Verify Suffolk County source', company: 'Suffolk County NY', priority: 'High', status: 'Pending', period: 'morning', dueAt: '2026-06-22T14:30:00Z', relatedOpp: 'opp-suffolk-intercom',
    goal: 'Confirm the real county portal URL — current source is a SAM.gov mirror.',
    script: null, contactTitle: 'Procurement (unverified)', contactRoute: 'Needs verification',
    phone: { display: null, telHref: null, isValid: false },
    notes: 'Do not create a bid card until the official source is confirmed.', sync: 'Google Disconnected' },
  { id: 't-t2', owner: 'tina', type: 'Call', title: 'Warm NJ electrical contractor', company: 'Regional Electrical Contractor', priority: 'Medium', status: 'Pending', period: 'midday', dueAt: '2026-06-22T17:00:00Z', relatedOpp: null,
    goal: 'Move a warm GC estimator toward a next step.',
    script: 'Hi, this is Tina with ShieldTech Security — we handle the low-voltage and security scope on your projects. Any upcoming bids we should be on?',
    contactTitle: 'Estimator', contactRoute: 'Main office — ask for estimating',
    phone: { display: 'Main office ask for estimating', telHref: null, isValid: false },
    notes: 'Broken-record lead — third attempt, vary the time of day.', sync: 'Google Disconnected' },
  { id: 't-t3', owner: 'tina', type: 'Follow-up', title: 'Nurture list — quarterly touch', company: '6 nurture accounts', priority: 'Low', status: 'Pending', period: 'afternoon', dueAt: '2026-06-22T20:00:00Z', relatedOpp: null,
    goal: 'Keep nurture accounts warm with a short check-in.',
    script: null, contactTitle: 'Various', contactRoute: 'Nurture list',
    phone: { display: null, telHref: null, isValid: false },
    notes: 'Batch task — log each touch in pipeline.', sync: 'Google Disconnected' },
];

/* Top money actions per user (Today header) */
const SW_MONEY_ACTIONS = {
  daniel: ['Lock the Wachter approved-sub list — unlocks the whole region.', 'Confirm Fairfax site walk before the bid clock runs out.', 'Get Newark drawings pulled so the estimate can start.'],
  marcus: ['Find out if Montco incumbent is rebidding before estimating.', 'Prep Baltimore walk questions — switch alternates matter most.'],
  tina: ['Verify Suffolk source before it eats estimate hours.', 'Third call on the NJ electrical contractor — change the time.'],
};

/* ─────────── Pipeline rows ─────────── */
const SW_PIPELINE = [
  { id: 'pl-wachter', company: 'Wachter', category: 'National Integrator', territory: 'PA', contact: 'Mike', contactTitle: 'Vendor Onboarding', route: '(610) 555-1200', stage: 'Hot', score: 86, owner: 'daniel', nextAction: 'Send capability statement, follow up Tue.', nextFollowUpAt: '2026-06-24T14:00:00Z', lastResult: 'Asked for Email', docs: 2, sourceVerified: true, brokenRecord: false, relatedOpp: 'opp-wachter' },
  { id: 'pl-fairfax', company: 'Fairfax County Schools', category: 'Public — K12', territory: 'VA', contact: 'R. Whitfield', contactTitle: 'Procurement Officer', route: '(703) 555-0142', stage: 'Hot', score: 91, owner: 'daniel', nextAction: 'Confirm mandatory site walk.', nextFollowUpAt: '2026-06-24T14:00:00Z', lastResult: 'Connected', docs: 4, sourceVerified: true, brokenRecord: false, relatedOpp: 'opp-fairfax-ac' },
  { id: 'pl-balt', company: 'Baltimore City Schools', category: 'Public — K12', territory: 'MD', contact: 'L. Bryant', contactTitle: 'IT Procurement', route: '(410) 555-0163', stage: 'Warm', score: 81, owner: 'marcus', nextAction: 'Attend site walk Fri 9 AM.', nextFollowUpAt: '2026-06-27T09:00:00Z', lastResult: 'Emailed', docs: 4, sourceVerified: true, brokenRecord: false, relatedOpp: 'opp-balt-network' },
  { id: 'pl-newark', company: 'City of Newark', category: 'Public — Municipal', territory: 'NJ', contact: null, contactTitle: 'Procurement → PM', route: '(973) 555-0190', stage: 'Warm', score: 78, owner: 'daniel', nextAction: 'Pull drawings, verify fiber count.', nextFollowUpAt: '2026-06-23T15:00:00Z', lastResult: 'No Answer', docs: 1, sourceVerified: false, brokenRecord: true, relatedOpp: 'opp-newark-fiber' },
  { id: 'pl-montco', company: 'Montgomery County', category: 'Public — County', territory: 'PA', contact: 'D. Okafor', contactTitle: 'Facilities PM', route: '(610) 555-0177', stage: 'Warm', score: 72, owner: 'marcus', nextAction: 'Estimate after 6/30 walk.', nextFollowUpAt: '2026-06-30T10:00:00Z', lastResult: 'Left Voicemail', docs: 4, sourceVerified: true, brokenRecord: false, relatedOpp: 'opp-montco-fire' },
  { id: 'pl-elec', company: 'Regional Electrical Contractor', category: 'Electrical Contractor', territory: 'NJ', contact: null, contactTitle: 'Estimator', route: 'Main office', stage: 'Warm', score: 64, owner: 'tina', nextAction: 'Third call — change the time.', nextFollowUpAt: '2026-06-23T11:00:00Z', lastResult: 'No Answer', docs: 0, sourceVerified: true, brokenRecord: true, relatedOpp: null },
  { id: 'pl-suffolk', company: 'Suffolk County', category: 'Public — County', territory: 'NY', contact: null, contactTitle: 'Procurement', route: 'Unverified', stage: 'Nurture', score: 44, owner: 'tina', nextAction: 'Verify official source first.', nextFollowUpAt: null, lastResult: '—', docs: 0, sourceVerified: false, brokenRecord: false, relatedOpp: 'opp-suffolk-intercom' },
];
const SW_STAGES = ['Hot', 'Warm', 'Nurture', 'Dead'];

/* ─────────── Approvals (AI drafts await human sign-off) ─────────── */
const SW_APPROVALS = [
  { id: 'ap-1', type: 'Email draft', title: 'ShieldTech capability statement → Wachter', risk: 'Low', status: 'Needs Approval', relatedTask: 't-d3',
    preview: 'Hi Mike,\n\nThanks for speaking with me today. Attached is ShieldTech Security LLC’s capability summary covering CCTV, access control, and structured cabling across PA, NJ, and NY.\n\nBest,\nDaniel' },
  { id: 'ap-2', type: 'Closeout note', title: 'Fairfax site-walk confirmation note', risk: 'Low', status: 'Needs Approval', relatedTask: 't-d2',
    preview: 'Confirmed site walk is mandatory (Wed 2 PM). Assigned attendance. Bid eligibility now depends on attendance + addenda acknowledgement.' },
];

/* ─────────── Diagnostics / health (admin only) ─────────── */
const SW_HEALTH = [
  { key: 'app', label: 'App', status: 'ok', note: 'Running' },
  { key: 'supabase', label: 'Supabase', status: 'ok', note: 'Connected' },
  { key: 'openrouter', label: 'OpenRouter (AI)', status: 'ok', note: 'Configured' },
  { key: 'googleOAuth', label: 'Google OAuth', status: 'ok', note: 'Configured' },
  { key: 'googleTasks', label: 'Google Tasks', status: 'warn', note: 'Disconnected — connect in Settings' },
  { key: 'googleCalendar', label: 'Google Calendar', status: 'warn', note: 'Disconnected — connect in Settings' },
  { key: 'maps', label: 'Google Maps', status: 'warn', note: 'No browser key — fallback territory map active' },
  { key: 'hermes', label: 'AI Agent', status: 'ok', note: 'Skills loaded' },
];

/* ─────────── AI skills (from lib/hermes/skill-base.ts) ─────────── */
const SW_HERMES_SKILLS = [
  { id: 'territory', title: 'Territory bid discovery', summary: 'Search VA, MD, NJ, PA, NY + national/federal sources for ShieldTech trades.' },
  { id: 'verify', title: 'Official source verification', summary: 'A bid is actionable only when source, buyer, due date, docs, and addenda are traceable.' },
  { id: 'docs', title: 'Document readiness', summary: 'Track whether RFPs, drawings, specs, and addenda are synced or still portal/manual pulls.' },
  { id: 'poc', title: 'Point-of-contact reasoning', summary: 'Who to call, why that person, and the alternate route when procurement is not enough.' },
  { id: 'script', title: 'Call script coaching', summary: 'Short, direct scripts for onboarding, public buyers, GCs, integrators, and plan rooms.' },
  { id: 'mission', title: 'Mission task guidance', summary: 'Guide each Today card: questions, outcome capture, follow-up, next task.' },
  { id: 'memory', title: 'Pipeline CRM memory', summary: 'Turn saved notes into durable memory for stage moves, scoring, and next actions.' },
  { id: 'truth', title: 'Google sync truthfulness', summary: 'Never claim Tasks, Calendar, Drive, or Maps succeeded unless the backend says so.' },
];

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
const SW_OPP_INDUSTRY = {
  'opp-fairfax-ac': 'k12', 'opp-newark-fiber': 'govmuni', 'opp-wachter': 'datacenter',
  'opp-montco-fire': 'govmuni', 'opp-suffolk-intercom': 'govmuni', 'opp-balt-network': 'k12',
};
SW_OPPS.forEach(o => { o.industry = SW_OPP_INDUSTRY[o.id] || 'commercial'; });

/* More opportunities, spread across industries (consultant-generated). */
const SW_MORE_OPPS = [
  { id: 'opp-inova', industry: 'healthcare', title: 'Hospital CCTV & Access Refresh', buyer: 'Inova Health System', source: 'Health-system vendor portal', sourceUrl: 'https://inova.org/vendors', sourceRisk: 'Verified', state: 'VA', territory: 'VA', region: { x: 40, y: 74 }, trades: ['CCTV', 'Access', 'Div 28'], fit: 88, status: 'Hot', value: 540000, owner: 'marcus', dueAt: '2026-06-29T16:00:00Z', siteWalk: '2026-06-25T11:00:00Z', docs: { rfp: 'synced', drawings: 'pending', specs: 'pending', addenda: 'portal' }, poc: { name: 'K. Mensah', title: 'Director, Security Technology', phone: '(703) 555-0210', why: 'Owns the technology standard across all campuses — winning the standard means every site follows.', route: 'Email then call' }, nextAction: 'Confirm camera standard + ED priority areas at the site walk.' },
  { id: 'opp-ashburn-dc', industry: 'datacenter', title: 'Colo Cage CCTV & Mantrap Access', buyer: 'Ashburn Colo (via GC)', source: 'Hyperscale GC bid list', sourceUrl: 'https://example-gc.com/bids', sourceRisk: 'Verified', state: 'VA', territory: 'VA', region: { x: 36, y: 70 }, trades: ['Access', 'CCTV', 'Fiber'], fit: 84, status: 'Warm', value: 410000, owner: 'daniel', dueAt: '2026-07-03T17:00:00Z', siteWalk: null, docs: { rfp: 'synced', drawings: 'synced', specs: 'synced', addenda: 'none' }, poc: { name: 'J. Pratt', title: 'GC Project Manager', phone: '(571) 555-0188', why: 'The GC controls which low-voltage sub gets the cage scope across phases — get on this build, get the next three.', route: 'Direct cell' }, nextAction: 'Submit cage + mantrap pricing; flag fiber pathway count.' },
  { id: 'opp-rutgers', industry: 'highered', title: 'Campus Access Control Standardization', buyer: 'Rutgers University', source: 'University bid portal', sourceUrl: 'https://procurement.rutgers.edu', sourceRisk: 'Needs check', state: 'NJ', territory: 'NJ', region: { x: 64, y: 48 }, trades: ['Access', 'CCTV', 'Network'], fit: 79, status: 'Warm', value: 690000, owner: 'tina', dueAt: '2026-07-14T15:00:00Z', siteWalk: '2026-07-08T13:00:00Z', docs: { rfp: 'synced', drawings: 'pending', specs: 'metadata', addenda: 'none' }, poc: { name: 'Public Safety Office', title: 'Capital Projects (route to PM)', phone: '(848) 555-0125', why: 'Standardization RFPs lock a vendor in for years — verify the incumbent platform before bidding.', route: 'Main line, ask for capital projects' }, nextAction: 'Verify which access platform the standard requires.' },
  { id: 'opp-gsa-pacs', industry: 'federal', title: 'Federal Facility PACS + Surveillance', buyer: 'GSA (sub to prime)', source: 'SAM.gov', sourceUrl: 'https://sam.gov/opp', sourceRisk: 'Unverified', state: 'DC', territory: 'Nat', region: { x: 43, y: 64 }, trades: ['Access (PACS)', 'CCTV', 'Intrusion'], fit: 70, status: 'Nurture', value: 260000, owner: 'daniel', dueAt: '2026-07-22T17:00:00Z', siteWalk: null, docs: { rfp: 'metadata', drawings: 'none', specs: 'none', addenda: 'none' }, poc: { name: 'Prime integrators', title: 'Sub opportunity (cleared prime)', phone: null, why: 'Direct federal is hard; the play is subbing to a cleared prime that needs local low-voltage labor.', route: 'Identify primes on the bid' }, nextAction: 'Find the primes bidding and pitch as their low-voltage sub.' },
  { id: 'opp-panynj', industry: 'transit', title: 'Terminal Surveillance & Mass-Notify', buyer: 'Port Authority NY/NJ', source: 'Agency procurement', sourceUrl: 'https://panynj.gov/bids', sourceRisk: 'Verified', state: 'NJ', territory: 'NJ', region: { x: 68, y: 45 }, trades: ['CCTV', 'Paging', 'Fiber'], fit: 76, status: 'Warm', value: 880000, owner: 'tina', dueAt: '2026-07-30T16:00:00Z', siteWalk: '2026-07-10T09:00:00Z', docs: { rfp: 'synced', drawings: 'pending', specs: 'pending', addenda: 'portal' }, poc: { name: 'DBE Program Office', title: 'Sub / DBE participation', phone: '(212) 555-0144', why: 'Agency jobs carry DBE goals — ShieldTech as a sub helps the prime hit them and wins the camera scope.', route: 'DBE office, then prime' }, nextAction: 'Register for DBE participation and reach the bidding primes.' },
  { id: 'opp-pseg', industry: 'utilities', title: 'Substation Perimeter Security (NERC-CIP)', buyer: 'PSE&G', source: 'Utility vendor registration', sourceUrl: 'https://pseg.com/suppliers', sourceRisk: 'Verified', state: 'NJ', territory: 'NJ', region: { x: 62, y: 50 }, trades: ['Intrusion', 'CCTV', 'Access'], fit: 82, status: 'Warm', value: 320000, owner: 'marcus', dueAt: '2026-07-17T15:00:00Z', siteWalk: null, docs: { rfp: 'synced', drawings: 'synced', specs: 'pending', addenda: 'none' }, poc: { name: 'P. Ortiz', title: 'Physical Security Engineering', phone: '(973) 555-0166', why: 'CIP compliance is non-negotiable and recurring — one approved substation design repeats across the fleet.', route: 'Email (NDA likely)' }, nextAction: 'Complete supplier registration; confirm CIP design package.' },
  { id: 'opp-multifam', industry: 'multifamily', title: 'Apartment Community Access + Video Intercom', buyer: 'Keystone Residential (developer)', source: 'Developer GC list', sourceUrl: 'https://example-dev.com', sourceRisk: 'Verified', state: 'PA', territory: 'PA', region: { x: 52, y: 49 }, trades: ['Access', 'Intercom', 'CCTV'], fit: 80, status: 'Hot', value: 175000, owner: 'daniel', dueAt: '2026-06-27T20:00:00Z', siteWalk: null, docs: { rfp: 'synced', drawings: 'synced', specs: 'synced', addenda: 'none' }, poc: { name: 'S. Delgado', title: 'Construction Manager', phone: '(215) 555-0173', why: 'Developers build multiple communities a year on the same spec — land one, become their standard.', route: 'Direct cell' }, nextAction: 'Price entry access + video intercom; ask about next two communities.' },
  { id: 'opp-grocery', industry: 'retail', title: 'Grocery Chain LP Camera Rollout', buyer: 'Regional Grocery Group', source: 'Chain vendor program', sourceUrl: 'https://example-grocer.com/vendors', sourceRisk: 'Needs check', state: 'PA', territory: 'PA', region: { x: 47, y: 45 }, trades: ['CCTV', 'Intrusion', 'Network'], fit: 74, status: 'Warm', value: 230000, owner: 'tina', dueAt: '2026-07-11T17:00:00Z', siteWalk: null, docs: { rfp: 'metadata', drawings: 'none', specs: 'none', addenda: 'none' }, poc: { name: 'Loss Prevention', title: 'LP Director', phone: '(610) 555-0151', why: 'LP buys analytics camera refreshes store-by-store — one approved design scales to the whole banner.', route: 'LP department' }, nextAction: 'Confirm store count + analytics requirement; verify the vendor program.' },
  { id: 'opp-3pl', industry: 'warehouse', title: 'Distribution Center Gate Access + Cameras', buyer: 'Atlantic 3PL', source: 'Industrial GC list', sourceUrl: 'https://example-3pl.com', sourceRisk: 'Verified', state: 'MD', territory: 'MD', region: { x: 50, y: 62 }, trades: ['Access', 'CCTV', 'Cabling'], fit: 78, status: 'Warm', value: 195000, owner: 'marcus', dueAt: '2026-07-08T16:00:00Z', siteWalk: '2026-07-01T10:00:00Z', docs: { rfp: 'synced', drawings: 'pending', specs: 'synced', addenda: 'none' }, poc: { name: 'R. Caldwell', title: 'Facilities Operations', phone: '(410) 555-0199', why: '3PLs add DCs constantly — gate + dock cameras on one site sets the template for the network.', route: 'Direct line' }, nextAction: 'Walk the yard; price gate access + dock cameras.' },
  { id: 'opp-hotel', industry: 'hospitality', title: 'Hotel Door Access & Surveillance Refresh', buyer: 'Harbor Hotel Group', source: 'Brand renovation GC', sourceUrl: 'https://example-hotel.com', sourceRisk: 'Needs check', state: 'NY', territory: 'NY', region: { x: 76, y: 36 }, trades: ['Access', 'CCTV', 'Network'], fit: 71, status: 'Nurture', value: 160000, owner: 'tina', dueAt: '2026-07-25T17:00:00Z', siteWalk: null, docs: { rfp: 'metadata', drawings: 'none', specs: 'none', addenda: 'none' }, poc: { name: 'Renovation GC', title: 'PM (brand standard)', phone: null, why: 'Brand-standard refreshes hit many properties on a cycle — the GC is the gatekeeper to all of them.', route: 'Identify the renovation GC' }, nextAction: 'Find the renovation GC and confirm brand security spec.' },
  { id: 'opp-nsgp', industry: 'worship', title: 'NSGP Grant — Cameras & Access', buyer: 'Beth Shalom Congregation', source: 'Nonprofit Security Grant (NSGP)', sourceUrl: 'https://fema.gov/nsgp', sourceRisk: 'Verified', state: 'NJ', territory: 'NJ', region: { x: 65, y: 52 }, trades: ['CCTV', 'Access', 'Intrusion'], fit: 86, status: 'Hot', value: 150000, owner: 'daniel', dueAt: '2026-06-30T20:00:00Z', siteWalk: null, docs: { rfp: 'synced', drawings: 'synced', specs: 'synced', addenda: 'none' }, poc: { name: 'Security Committee', title: 'Facility / Grant lead', phone: '(856) 555-0117', why: 'Grant is awarded and funded — fast, clean install with strong margin and great referrals to other congregations.', route: 'Committee chair' }, nextAction: 'Confirm grant scope; schedule install — funds are committed.' },
  { id: 'opp-creditunion', industry: 'financial', title: 'Branch Network Alarm + Access', buyer: 'Keystone Credit Union', source: 'CU vendor program', sourceUrl: 'https://example-cu.org/vendors', sourceRisk: 'Verified', state: 'PA', territory: 'PA', region: { x: 49, y: 43 }, trades: ['Intrusion', 'Access', 'CCTV'], fit: 77, status: 'Warm', value: 210000, owner: 'marcus', dueAt: '2026-07-12T16:00:00Z', siteWalk: null, docs: { rfp: 'synced', drawings: 'pending', specs: 'pending', addenda: 'portal' }, poc: { name: 'D. Frye', title: 'Corporate Security', phone: '(717) 555-0182', why: 'Branches need UL alarm + access on a standard — plus recurring monitoring/service revenue after install.', route: 'Corporate security' }, nextAction: 'Confirm UL alarm requirement + branch count; pitch service plan.' },
  { id: 'opp-cannabis', industry: 'cannabis', title: 'Dispensary Compliance Surveillance (multi-site)', buyer: 'Garden State Cannabis Co.', source: 'State license requirement', sourceUrl: 'https://nj.gov/cannabis', sourceRisk: 'Verified', state: 'NJ', territory: 'NJ', region: { x: 66, y: 54 }, trades: ['CCTV', 'Access', 'Intrusion'], fit: 83, status: 'Hot', value: 240000, owner: 'tina', dueAt: '2026-06-28T18:00:00Z', siteWalk: null, docs: { rfp: 'synced', drawings: 'metadata', specs: 'synced', addenda: 'none' }, poc: { name: 'M. Rivera', title: 'Compliance Officer', phone: '(609) 555-0138', why: 'Every license REQUIRES compliant retention + access logging — recurring across each new dispensary they open.', route: 'Compliance direct' }, nextAction: 'Confirm state retention spec; price first two dispensaries.' },
  { id: 'opp-seniorliving', industry: 'seniorliving', title: 'CCRC Wander Mgmt + CCTV', buyer: 'Chesapeake Senior Living', source: 'Operator vendor list', sourceUrl: 'https://example-ccrc.com', sourceRisk: 'Needs check', state: 'MD', territory: 'MD', region: { x: 46, y: 58 }, trades: ['Access', 'CCTV', 'Nurse call'], fit: 75, status: 'Warm', value: 185000, owner: 'marcus', dueAt: '2026-07-16T16:00:00Z', siteWalk: '2026-07-02T11:00:00Z', docs: { rfp: 'synced', drawings: 'pending', specs: 'pending', addenda: 'none' }, poc: { name: 'A. Whitman', title: 'Life Safety Director', phone: '(410) 555-0128', why: 'Memory-care wander mgmt is life-safety critical and sticky — leads to a long service relationship.', route: 'Email then call' }, nextAction: 'Walk memory-care wing; confirm wander + access scope.' },
];
SW_OPPS.push(...SW_MORE_OPPS);

/* ─────────── Deck extras — money-machine card types ───────────
   Cards AI injects into the daily deck beyond the call/bid tasks:
   fresh bids found overnight, A/R to collect, RMR to attach, renewals to lock. */
const SW_DECK_EXTRAS = {
  daniel: [
    { kind: 'bid', id: 'fb-norristown', value: 390000, priority: 'High', title: 'Norristown Area SD — Access Control Refresh', buyer: 'Norristown Area School District',
      source: 'PennBid', sourceRisk: 'Verified', trades: ['Access', 'CCTV', 'Div 28'], fit: 88, dueIn: '9 days', walk: 'Mandatory walk Jun 30',
      why: 'Found overnight. Matches the 3 K-12 access jobs you’ve won — bond-funded refresh, verified PennBid source.' },
    { kind: 'money', id: 'ar-metro', value: 42000, priority: 'High', title: 'Metro Bank — branch CCTV retrofit', buyer: 'Metro Bank · Accounts Payable',
      daysOverdue: 38, invoice: 'INV-2231', phone: '(215) 555-0190',
      why: 'Invoice 38 days out. One call to AP usually moves it — this is cash you’ve already earned.' },
    { kind: 'rmr', id: 'rmr-pennvalley', value: 10200, monthly: 850, priority: 'Medium', title: 'Penn Valley Office — Managed Monitoring', buyer: 'Penn Valley Office Park',
      closing: 'Install closes Thursday', plan: '24/7 Managed Monitoring + Maintenance',
      why: 'Attach at close while the relationship is hot. $850/mo = $10.2k/yr recurring on top of the install.' },
    { kind: 'renewal', id: 'rn-cheltenham', value: 18000, monthly: 1500, priority: 'Medium', title: 'Cheltenham Twp — service contract', buyer: 'Cheltenham Township',
      expiresIn: 54, phone: '(215) 555-0177',
      why: 'Renews in 54 days. Reach out now to lock it before a competitor quotes — recurring revenue you already own.' },
    { kind: 'reactivate', id: 'react-cheltenham-hs', value: 120000, priority: 'Medium', title: 'Cheltenham HS — camera system aging out', buyer: 'Cheltenham School District',
      installed: 'Installed 2018 · 7-yr-old NVRs', phone: '(215) 555-0144',
      why: 'Your installed base is your warmest pipeline. Their 2018 recorders are end-of-life — call before a competitor pitches the refresh.' },
    { kind: 'referral', id: 'ref-pennvalley', value: 60000, priority: 'Low', title: 'Penn Valley Office — ask for a referral', buyer: 'Penn Valley Office Park',
      closed: 'Install wrapped last week', contact: 'Property manager',
      why: 'The happiest moment is right after a clean install. One intro to their sister property is the cheapest pipeline you’ll ever add.' },
  ],
  marcus: [
    { kind: 'bid', id: 'fb-howard', value: 240000, priority: 'High', title: 'Howard County — Network Refresh', buyer: 'Howard County Government',
      source: 'Maryland eMMA', sourceRisk: 'Verified', trades: ['Network', 'Cabling', 'Div 27'], fit: 80, dueIn: '12 days', walk: null,
      why: 'Found overnight. Strong MD network fit on a verified eMMA source — clean documents already posted.' },
    { kind: 'rmr', id: 'rmr-inova', value: 14400, monthly: 1200, priority: 'Medium', title: 'Inova clinic — Service Plan', buyer: 'Inova clinic (post-install)',
      closing: 'Install closes this week', plan: 'Maintenance + Health Monitoring',
      why: 'Attach service after the camera install — $1.2k/mo recurring and first call on every future add.' },
    { kind: 'reactivate', id: 'react-inova-clinic', value: 90000, priority: 'Medium', title: 'Inova clinic — access panels end-of-life', buyer: 'Inova (existing site)',
      installed: 'Installed 2017 · panels EOL', phone: '(703) 555-0210',
      why: 'Existing customer with aging access panels — the warmest call on your list and an easy expansion.' },
  ],
  tina: [
    { kind: 'renewal', id: 'rn-grocery', value: 9600, monthly: 800, priority: 'Medium', title: 'Regional Grocery — monitoring contract', buyer: 'Regional Grocery Group',
      expiresIn: 41, phone: '(610) 555-0151',
      why: 'Monitoring renews in 41 days. Lock it before the next budget cycle reopens it to competitors.' },
    { kind: 'money', id: 'ar-hotel', value: 8800, priority: 'Medium', title: 'Harbor Hotel — intercom service invoice', buyer: 'Harbor Hotel Group · AP',
      daysOverdue: 21, invoice: 'INV-1187', phone: null,
      why: '21 days out. A quick AP nudge keeps it from aging into a problem.' },
    { kind: 'referral', id: 'ref-grocery', value: 40000, priority: 'Low', title: 'Regional Grocery — ask for a store referral', buyer: 'Regional Grocery Group',
      closed: 'Phase 1 stores live', contact: 'LP Director',
      why: 'They liked phase 1 — ask which sister banner is next and for an intro to its facilities lead.' },
  ],
};

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
  APPROVALS: SW_APPROVALS, HEALTH: SW_HEALTH, HERMES_SKILLS: SW_HERMES_SKILLS,
  oppById: (id) => SW_OPPS.find(o => o.id === id) || null,
  tasksForUser: (uid) => SW_TASKS.filter(t => swGetOwner('task', t.id, t.owner) === uid),
};

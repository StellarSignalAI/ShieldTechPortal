/* ShieldTech — Shared State System
   Observable stores with localStorage persistence.
   Each store is globally accessible via window.
   Use useShieldStore(store) hook in any component. */

/* ── One-time cleanup of legacy seeded storage (st_* and sw:*) ── */
(() => {
  try {
    if (localStorage.getItem('st2:cleaned')) return;
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('st_') || k.startsWith('sw:')) localStorage.removeItem(k);
    });
    localStorage.setItem('st2:cleaned', '1');
  } catch {}
})();

/* ── Core Store Factory ── */
function createShieldStore(key, initial) {
  let state;
  try { state = JSON.parse(localStorage.getItem('st2_' + key)) ?? initial; }
  catch { state = initial; }
  const listeners = new Set();
  const notify = () => {
    listeners.forEach(fn => fn(state));
    window.dispatchEvent(new CustomEvent('shield:store:' + key, { detail: state }));
  };
  const store = {
    key,
    get: () => state,
    set(updater) {
      state = typeof updater === 'function' ? updater(state) : updater;
      try { localStorage.setItem('st2_' + key, JSON.stringify(state)); } catch {}
      notify();
    },
    reset() { this.set(initial); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  /* ── Cross-tab / cross-app live sync ──
     When ANY other open tab or app (mobile ↔ portal ↔ technician) writes this
     same key to localStorage, the browser fires a 'storage' event here (it never
     fires in the tab that made the change, so there's no echo loop). We adopt the
     new value and notify subscribers, so every open ShieldTech surface stays live. */
  window.addEventListener('storage', (e) => {
    if (e.key !== 'st2_' + key || e.newValue == null) return;
    try {
      state = JSON.parse(e.newValue);
      notify();
    } catch {}
  });
  /* ── Cross-DEVICE sync hook ──
     The Supabase sync layer (packages/shared/store-sync.js) discovers stores
     through this registry and applies remote values via applyRemote (persists
     + notifies without echoing a push back to the backend). */
  store.applyRemote = (v) => {
    state = v;
    try { localStorage.setItem('st2_' + key, JSON.stringify(v)); } catch {}
    notify();
  };
  window.__shieldStores = window.__shieldStores || {};
  window.__shieldStores[key] = store;
  return store;
}

/* ── React Hook ── */
function useShieldStore(store) {
  const [val, setVal] = React.useState(() => store.get());
  React.useEffect(() => store.subscribe(setVal), [store]);
  return [val, store.set.bind(store)];
}

/* ── Ticket Store ── */
const ticketStore = createShieldStore('tickets', []);

/* ── Work Order Store ── */
const workOrderStore = createShieldStore('workorders', []);

/* Default required-shot + checklist templates by work type (blank-canvas: a new
   WO carries its own scope/checklist/photoSlots — no shared seed). */
// Keys mirror PHOTO_CHECKLISTS so the tech app's required-shot list lines up.
const WO_TEMPLATES = {
  Install:     { checklist: ['Confirm site contact', 'Review scope', 'Run cable / rough-in', 'Mount devices', 'Terminate & configure', 'Test system', 'Customer walkthrough', 'Collect signature'] },
  Repair:      { checklist: ['Confirm reported issue', 'Diagnose', 'Repair / replace', 'Verify operation', 'Customer walkthrough', 'Collect signature'] },
  Maintenance: { checklist: ['Confirm scope', 'Inspect devices', 'Service / clean', 'Test & verify', 'Customer walkthrough', 'Collect signature'] },
  Survey:      { checklist: ['Meet site contact', 'Tour all areas', 'Document devices / doors', 'Photograph site', 'Submit report'] },
};

/* Build a complete work-order record from a portal create form. Assigns it to a
   tech (assignedTo = profile id; tech/techId for display) so it appears in that
   technician's app. */
function buildWorkOrder(form) {
  const existing = workOrderStore.get();
  const n = existing.reduce((m, w) => { const num = parseInt(String(w.id || '').replace(/\D/g, ''), 10); return isNaN(num) ? m : Math.max(m, num); }, 2843) + 1;
  const type = form.type || 'Install';
  const tpl = WO_TEMPLATES[type] || WO_TEMPLATES.Install;
  return {
    id: 'WO-' + n,
    customer: (form.customer || 'New Customer').trim(),
    site: form.site || '',
    type,
    tech: form.techName || 'Unassigned',
    techId: form.techInitials || '—',
    assignedTo: form.assignedTo || null,   // profile id the tech app filters on
    scheduled: form.scheduled || new Date().toISOString().slice(0, 10),
    status: 'scheduled',
    scope: form.scope || '',
    notes: form.notes || '',
    materials: [],
    checklist: Array.isArray(form.checklist) && form.checklist.length ? form.checklist : tpl.checklist,
    photoSlots: (typeof PHOTO_CHECKLISTS !== 'undefined' && PHOTO_CHECKLISTS[type]) || [],
    checkedItems: {}, timerSeconds: 0, timerRunning: false, signatureSigned: false,
    createdAt: Date.now(),
  };
}

/* ── Incident Store ── */
const incidentStore = createShieldStore('incidents', []);

/* ── Calendar Jobs Store ── */
/* Schema: techs = array of tech ids ([] = unassigned); day..endDay = inclusive day span (1-7) */
const jobStore = createShieldStore('jobs2', []);

/* Migrate persisted jobs → attach work-order links if missing */
(() => {
  const links = { 1: 'WO-2847', 3: 'WO-2846', 5: 'WO-2844', 6: 'WO-2845' };
  const cur = jobStore.get();
  if (Array.isArray(cur) && cur.some(j => links[j.id] && !j.wo)) {
    jobStore.set(prev => prev.map(j => links[j.id] && !j.wo ? { ...j, wo: links[j.id] } : j));
  }
})();

/* ── Customer Store ──
   Canonical org records — shared LIVE across desktop portal, mobile app & technician app.
   Adding/editing a customer on ANY surface writes here and syncs everywhere. */
const customerStore = createShieldStore('customers', []);

/* ── Sub-Customer Store (service locations / billing entities under a parent) ── */
const subCustomerStore = createShieldStore('subcustomers', []);

/* Build a complete customer record from a partial form payload (shared by desktop + mobile). */
function buildCustomer(form) {
  const existing = customerStore.get();
  const nextId = existing.reduce((m, c) => Math.max(m, c.id), 1000) + 1;
  const acctNum = 'CUST-' + (existing.reduce((m, c) => {
    const n = parseInt(String(c.acctNum || '').replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 1000) + 1);
  const name = (form.name || 'New Customer').trim();
  const logo = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'NC';
  const tags = typeof form.tags === 'string'
    ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
    : (form.tags || []);
  return {
    id: nextId, name, dba: form.dba || '', type: form.type || 'Commercial',
    industry: form.industry || '', status: 'active', acctNum,
    sites: Number(form.sites) || 0, assets: 0, contacts: 0,
    owner: form.owner || 'Unassigned', balance: Number(form.balance) || 0,
    mrr: Number(form.mrr) || 0, health: form.health != null && form.health !== '' ? Number(form.health) : 0,
    logo, tags, parent: null,
    address: form.address || '', billing: form.billing || '', phone: form.phone || '',
    website: form.website || '', taxId: form.taxId || '', terms: form.terms || 'Net 30',
    taxExempt: !!form.taxExempt, notes: form.notes || '',
    createdAt: Date.now(), source: form.source || 'portal',
  };
}

/* ── Mobile Bottom-Tab Config Store ──
   The user-editable bottom tab bar. `maxTabs` is the allocated cap (incl. the locked
   'All' tab pinned to the last slot). `tabs` are the editable slots (cap − 1 of them). */
const M_ALL_TAB = { id: 'm-more', icon: 'grid-2', label: 'All', locked: true };
const mobileTabsStore = createShieldStore('mobiletabs', {
  maxTabs: 6,
  tabs: [
    { id: 'custom-dashboard', icon: 'dashboard', label: 'Home' },
    { id: 'calendar',         icon: 'calendar',  label: 'Schedule' },
    { id: 'dispatch',         icon: 'dispatch',  label: 'Field' },
    { id: 'finance',          icon: 'finance',   label: 'Money' },
  ],
});
/* Migrate the original 5-slot default up to 6 so there's an open slot to fill. */
(() => {
  const c = mobileTabsStore.get();
  const legacy = ['custom-dashboard', 'calendar', 'dispatch', 'finance'];
  if (c && c.maxTabs === 5 && Array.isArray(c.tabs) && c.tabs.length === 4 && c.tabs.every((t, i) => t.id === legacy[i])) {
    mobileTabsStore.set({ ...c, maxTabs: 6 });
  }
})();

/* ── Approvals Store (expenses / timesheets / POs — approve & deny persist + sync) ── */
const approvalStore = createShieldStore('approvals', []);

/* ── Unscheduled Backlog Store (shared by Calendar + Dispatch queue) ── */
const backlogStore = createShieldStore('backlog', []);

/* ── Work-order deep-link (set before navTo('workorder') to open a specific WO) ── */
const woFocusStore = createShieldStore('wofocus', null);

/* ── Truck Inventory Store (per-tech van stock; auto-restock automation) ── */
const truckStore = createShieldStore('truck', {});

/* ── Per-user preferences (remembered per user, synced across devices) ──
   Everything a single user configures for themselves — appearance, presence,
   notification prefs, and any future personal toggles. store-sync.js keys this
   to the signed-in user (userprefs:<uid>), so each person keeps their own. */
const userPrefsStore = createShieldStore('userprefs', {
  theme: 'dark', status: 'online',
  notify: { email: true, push: true, desktop: false },
});
/* Apply the remembered appearance to the document as soon as it's known and on
   every change, so a user's theme choice survives reloads and follows them to
   any device. */
(() => {
  const applyTheme = (t) => {
    try {
      const mode = t === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : (t || 'dark');
      document.documentElement.setAttribute('data-theme', mode);
    } catch {}
  };
  applyTheme((userPrefsStore.get() || {}).theme);
  userPrefsStore.subscribe((v) => applyTheme((v || {}).theme));
})();

/* ── NPS Store ── */
const npsStore = createShieldStore('nps', []);

/* ── Purchase Order Store ── */
const poStore = createShieldStore('pos', []);

/* ── Skills Store ── */
const skillsStore = createShieldStore('skills', {});

/* ── QTC (Quote to Cash) Store ── */
const qtcStore = createShieldStore('qtc', []);

/* ── MRR Store ── */
const mrrStore = createShieldStore('mrr', []);

/* ── Parts Req Store ── */
const partsReqStore = createShieldStore('partsreq', []);

/* ── Proposal Store ── (real, editable, persistent → syncs to desktop)
   Each proposal owns a `blocks` array — the builder edits these and the value
   is derived live from the pricing block. */
function defaultProposalBlocks(customer, title) {
  return [
    { id: 'cover', type: 'cover', content: { heading: customer || 'New Client', subtitle: title || 'Security System Proposal', date: 'Jun 2026' } },
    { id: 'intro', type: 'intro', content: { text: 'Thank you for the opportunity to partner with you on your security needs. ShieldTech Solutions brings 15+ years of experience protecting businesses like yours.' } },
    { id: 'scope', type: 'scope', content: { items: ['Site survey and system design', 'Equipment procurement and staging', 'Professional installation and cabling', 'System programming and commissioning', 'Customer training and handoff', '30-day post-install support'] } },
    { id: 'pricing', type: 'pricing', content: { items: [
      { desc: 'Axis P3265-V Dome Camera', qty: 8, rate: 890 },
      { desc: 'Hanwha XNR-6410 16ch NVR', qty: 1, rate: 2800 },
      { desc: 'HID iCLASS SE Reader', qty: 4, rate: 340 },
      { desc: 'Cat6A Cabling & Conduit', qty: 1, rate: 4200 },
      { desc: 'Installation Labor (80h)', qty: 80, rate: 125 },
      { desc: 'Project Management', qty: 1, rate: 3500 },
    ] } },
    { id: 'terms', type: 'terms', content: { text: 'Standard terms: 50% deposit upon acceptance, 40% at rough-in completion, 10% at final commissioning. All equipment carries manufacturer warranty. Proposal valid for 30 days.' } },
    { id: 'signature', type: 'signature', content: {} },
  ];
}
function proposalValue(blocks) {
  const p = (blocks || []).find(b => b.type === 'pricing');
  if (!p) return 0;
  return (p.content.items || []).reduce((s, li) => s + (Number(li.qty) || 0) * (Number(li.rate) || 0), 0);
}
const proposalStore = createShieldStore('proposals', []);

/* ── Site Survey Report Store ── (real, editable, persistent → syncs) */
const SURVEY_BOM_SEED = [
  { sku:'P3245-V',  desc:'Axis P3245-V Indoor Dome',        qty:8,  unit:285,  hrs:1.5 },
  { sku:'P1468-LE', desc:'Axis P1468-LE Outdoor Bullet 4K', qty:4,  unit:412,  hrs:2.0 },
  { sku:'Q6135-LE', desc:'Axis Q6135-LE PTZ',               qty:2,  unit:890,  hrs:2.5 },
  { sku:'RP40',     desc:'HID RP40 Multiclass Reader',      qty:4,  unit:165,  hrs:1.5 },
  { sku:'HID-CTRL', desc:'HID Controller (4-door)',         qty:1,  unit:320,  hrs:3.0 },
  { sku:'XNR-6410', desc:'Hanwha XNR-6410 NVR 64ch',        qty:1,  unit:1850, hrs:4.0 },
  { sku:'POE24',    desc:'PoE++ Switch 24-port',            qty:1,  unit:480,  hrs:2.0 },
  { sku:'CAT6A-1K', desc:'CAT6A Plenum 1000ft',             qty:3,  unit:280,  hrs:0 },
];
const surveyStore = createShieldStore('surveys', []);
const SURVEY_RATE = 145;

/* ── Design Studio inbox — blueprints pushed from SiteScan (mobile) surface in Studio ── */
const studioInboxStore = createShieldStore('studioInbox', []);
function surveyTotals(s) {
  const hardware = (s.bom || []).reduce((a, b) => a + b.qty * b.unit, 0);
  const laborHrs = (s.bom || []).reduce((a, b) => a + b.qty * b.hrs, 0);
  const labor = Math.round(laborHrs * SURVEY_RATE);
  const cost = hardware + labor;
  const price = Math.round(cost / (1 - (s.margin || 35) / 100) / 50) * 50;
  return { hardware, laborHrs, labor, cost, price };
}

/* ── Photo Checklist Templates (required shots per job type) ── */
const PHOTO_CHECKLISTS = {
  Install:     ['Site — before', 'Cable runs', 'Head-end / panel', 'Device mounts', 'Final — wide shot'],
  Repair:      ['Issue found', 'Repair complete'],
  Maintenance: ['Before service', 'After service'],
  Survey:      ['Site overview', 'Mounting locations'],
};

/* ── Site Photo Store ──
   look: {h: hue, p: pattern (ceiling|rack|wall|exterior|panel), s: seed}
   pair: id shared by a before/after pair · slot: required-checklist slot name */
const photoStore = createShieldStore('photos', []);
const assetStore = createShieldStore('assets', []);

/* ── Punch List Store ──
   pin: {x,y} percent coords on the site floor plan */
const punchStore = createShieldStore('punch', []);

/* ── Punch list shared constants ── */
const PUNCH_STATUS = {
  open:     { c: '#FBBF24', label: 'Open' },
  done:     { c: '#34D399', label: 'Done' },
  verified: { c: '#3FA9F5', label: 'Verified' },
};
const PUNCH_TECHS = { MR: { name: 'Mike Reyes', color: '#3FA9F5' }, JL: { name: 'Jessica Liu', color: '#34D399' }, KW: { name: 'Kevin White', color: '#FBBF24' }, DP: { name: 'Diana Patel', color: '#c084fc' }, TG: { name: 'Tony Garcia', color: '#F43F5E' } };

/* ── Toast helper ── */
function showToast(msg, type = 'info') {
  window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg, type } }));
}

/* ── Cross-nav helper ── */
function navTo(screen) { window.__shieldNav?.(screen); }

/* ── ID generator ── */
function genId(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
}

/* ── Format duration ── */
function fmtDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

Object.assign(window, {
  createShieldStore, useShieldStore,
  ticketStore, workOrderStore, incidentStore, jobStore,
  npsStore, poStore, skillsStore, qtcStore, mrrStore, partsReqStore,
  photoStore, assetStore, PHOTO_CHECKLISTS, punchStore, PUNCH_STATUS, PUNCH_TECHS,
  backlogStore, woFocusStore, truckStore, userPrefsStore,
  customerStore, subCustomerStore, buildCustomer,
  mobileTabsStore, M_ALL_TAB, approvalStore,
  proposalStore, defaultProposalBlocks, proposalValue,
  surveyStore, surveyTotals, SURVEY_RATE, SURVEY_BOM_SEED, studioInboxStore,
  showToast, navTo, genId, fmtDuration, fmtSeconds
});

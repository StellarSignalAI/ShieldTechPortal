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
  // One store per key: a second create (e.g. 'invoices' in shared-invoicing)
  // returns the registered instance so every screen shares live state.
  if (window.__shieldStores && window.__shieldStores[key]) return window.__shieldStores[key];
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

/* ── Customer Contacts Store ──
   People at each customer, keyed by customer id: { [customerId]: Contact[] }.
   Each contact carries a `receives` map controlling which documents route to
   them — invoices, estimates, proposals. Shared across all surfaces. */
const contactsStore = createShieldStore('customercontacts', {});
function customerContacts(customerId) {
  const m = contactsStore.get() || {};
  return m[String(customerId)] || [];
}
function setCustomerContacts(customerId, list) {
  contactsStore.set(m => ({ ...(m || {}), [String(customerId)]: list }));
}

/* ── Per-customer records (sites, assets, passwords, documents, networks) ──
   One store keyed by `${customerId}:${kind}` → Record[]. Shared across surfaces
   like the other business data. */
const customerDataStore = createShieldStore('customerdata', {});
function custRecords(customerId, kind) {
  const m = customerDataStore.get() || {};
  return m[`${customerId}:${kind}`] || [];
}
function setCustRecords(customerId, kind, list) {
  customerDataStore.set(m => ({ ...(m || {}), [`${customerId}:${kind}`]: list }));
}

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

/* ── Projects, Invoices, Estimates ──
   Portal-created records, persisted + synced across desktop/mobile. Invoices &
   estimates share the QuickBooks row shape so they MERGE cleanly with the
   qbo_* data everywhere they're shown (Finance suite, customer tabs, mobile).
   That's what makes creation reflect "both ways". */
const projectStore = createShieldStore('projects', []);
const invoiceStore = createShieldStore('invoices', []);
const estimateStore = createShieldStore('estimates', []);

/* ── ONE document-number sequence per kind ──
   Scans BOTH row shapes (doc_number and num) so every writer — the builder,
   progress billing, duplicates, quick-adds — draws from the same sequence.
   Proposals and estimates are the same document (PROP- numbering going
   forward; legacy EST- rows count toward the sequence). */
function nextDocNumber(kind) {
  const isInv = kind === 'invoice';
  const store = isInv ? invoiceStore : estimateStore;
  const seed = isInv ? 2800 : 1000;
  const seq = (store.get() || []).reduce((m, d) =>
    Math.max(m, parseInt(String(d.doc_number || d.num || '').replace(/\D/g, ''), 10) || 0), seed) + 1;
  return (isInv ? 'INV-' : 'PROP-') + seq;
}

function buildProject(form) {
  const list = projectStore.get();
  const seq = list.reduce((m, p) => Math.max(m, parseInt(String(p.number || '').replace(/\D/g, ''), 10) || 0), 1000) + 1;
  return {
    id: 'prj-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    number: 'PRJ-' + seq, name: (form.name || 'New Project').trim(),
    customer: form.customer || '', type: form.type || 'Install',
    status: form.status || 'planning', siteAddr: form.siteAddr || '',
    contact: form.contact || '', phone: form.phone || '', email: form.email || '',
    estimatedValue: Number(form.estimatedValue) || 0, timeline: form.timeline || '',
    priority: form.priority || 'normal', notes: form.notes || '',
    createdAt: Date.now(), source: form.source || 'portal',
    /* Estimate → project → progress-billing workflow */
    estimateRefs: form.estimateRefs || [],   // attached quote doc numbers (EST-…)
    invoiceRefs: form.invoiceRefs || [],     // attached invoice doc numbers (INV-…)
    contractTotal: Number(form.contractTotal) || Number(form.estimatedValue) || 0,
    billing: form.billing || [],             // [{pct, amount, ref, at}] progress invoices cut
  };
}
function addProject(form) { const rec = buildProject(form); projectStore.set(l => [rec, ...l]); return rec; }

/* ── Estimate → Project → Progress-billing workflow ──
   An accepted estimate (manual click or customer email acceptance) becomes a
   project with the quote attached; the project then converts incremental % of
   the contract into invoices. Invoices/estimates attach both directions. */

function updateProject(number, patch) {
  projectStore.set(list => list.map(p => p.number === number
    ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p));
}

/* Normalize an estimate row (portal store shape or qbo_* shape) for workflow use. */
function estWorkflowView(e) {
  return {
    ref: e.doc_number || e.num || ('EST-' + (e.qbo_id || '?')),
    qboId: e.qbo_id && !String(e.qbo_id).startsWith('local-') ? e.qbo_id : null,
    customer: e.customer_name || e.customer || 'Customer',
    total: Number(e.total ?? e.amount) || 0,
    status: e.status || 'pending',
    /* Carried into the project on acceptance so scheduling has something to work with. */
    lines: Array.isArray(e.lines) ? e.lines : [],
    email: e.customer_email || e.email || '',
    phone: e.phone || '',
    siteAddr: e.siteAddr || e.site_addr || '',
    contact: e.contact || '',
  };
}

/* Find the project (if any) that a given estimate ref is attached to. */
function projectForEstimate(ref) {
  return (projectStore.get() || []).find(p => (p.estimateRefs || []).includes(ref)) || null;
}

/* Accept an estimate → create (or return) its project with the quote attached.
   via: 'manual' | 'email'. Marks the portal-store estimate row accepted. */
function acceptEstimateToProject(est, via) {
  const v = estWorkflowView(est);
  estimateStore.set(list => (list || []).map(e =>
    (e.doc_number || e.num) === v.ref ? { ...e, status: 'accepted' } : e));
  /* Hybrid QBO: an accepted portal proposal becomes the permanent QuickBooks
     record (no-op until QuickBooks is connected; QBO-mirror rows skip this). */
  try {
    if (window.__shieldQBO && window.__shieldQBO.pushDoc && !v.qboId) {
      window.__shieldQBO.pushDoc('estimate', est).then(r => {
        if (r && r.ok) showToast(`${v.ref} recorded in QuickBooks`, 'ok');
      }).catch(() => {});
    }
  } catch { /* connect-later */ }
  const existing = projectForEstimate(v.ref);
  if (existing) return existing;
  const scope = (v.lines || []).map(li => `${li.qty > 1 ? li.qty + '× ' : ''}${li.desc}`).filter(Boolean).join('; ');
  return addProject({
    name: `${v.customer} — ${v.ref}`,
    customer: v.customer,
    status: 'planning',
    estimatedValue: v.total,
    contractTotal: v.total,
    estimateRefs: [v.ref],
    email: v.email, phone: v.phone, contact: v.contact, siteAddr: v.siteAddr,
    source: 'estimate-' + (via || 'manual'),
    notes: `Created from accepted proposal ${v.ref} (${via || 'manual'} acceptance).` + (scope ? `\nScope: ${scope}` : ''),
  });
}

/* Attach a quote to a project (project ↔ estimate, either direction). */
function attachEstimateToProject(projectNumber, est) {
  const v = estWorkflowView(est);
  updateProject(projectNumber, p => ({
    estimateRefs: (p.estimateRefs || []).includes(v.ref) ? p.estimateRefs : [...(p.estimateRefs || []), v.ref],
    contractTotal: (Number(p.contractTotal) || 0) > 0 ? p.contractTotal : v.total,
    estimatedValue: (Number(p.estimatedValue) || 0) > 0 ? p.estimatedValue : v.total,
  }));
}

/* Attach an invoice to a project (invoice ↔ project, either direction). */
function attachInvoiceToProject(projectNumber, invRef) {
  updateProject(projectNumber, p => ({
    invoiceRefs: (p.invoiceRefs || []).includes(invRef) ? p.invoiceRefs : [...(p.invoiceRefs || []), invRef],
  }));
  const stores = [window.invoiceStore, invoiceStore].filter(Boolean);
  const seen = new Set();
  for (const s of stores) {
    if (seen.has(s)) continue; seen.add(s);
    s.set(list => (list || []).map(i =>
      (i.doc_number || i.num) === invRef ? { ...i, project_id: projectNumber } : i));
  }
}

/* Cumulative % of the contract already converted to invoices. */
function projectBilledPct(p) {
  return (p.billing || []).reduce((s, b) => s + (Number(b.pct) || 0), 0);
}

/* Convert an incremental % of the project's contract into an invoice.
   Writes through window.invoiceStore (the instance the Finance suite renders)
   with a dual-shape row so it shows in both the Invoices tab and QBO merges. */
function createProgressInvoice(projectNumber, pct) {
  const p = (projectStore.get() || []).find(x => x.number === projectNumber);
  if (!p) return { ok: false, error: 'Project not found' };
  const base = Number(p.contractTotal) || Number(p.estimatedValue) || 0;
  if (!(base > 0)) return { ok: false, error: 'Project has no contract total — attach an estimate first' };
  const pctNum = Math.round(Number(pct) * 100) / 100;
  if (!(pctNum > 0)) return { ok: false, error: 'Enter a % greater than zero' };
  const already = projectBilledPct(p);
  const amount = Math.round(base * pctNum) / 100;
  const store = window.invoiceStore || invoiceStore;
  const num = nextDocNumber('invoice');
  const refList = (p.estimateRefs || []).join(', ') || p.number;
  const dueDate = new Date(Date.now() + 30 * 86400000);
  const line = {
    desc: `Progress billing — ${pctNum}% of contract ${refList} (${p.name})`,
    qty: 1, rate: amount,
  };
  const row = {
    /* qbo_* shape (merges + reports) */
    qbo_id: 'local-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    doc_number: num, customer_qbo_id: null, customer_name: p.customer || 'Customer',
    txn_date: new Date().toISOString().slice(0, 10),
    due_date: dueDate.toISOString().slice(0, 10),
    total: amount, balance: amount, source: 'portal',
    /* legacy Invoices-tab shape */
    num, customer: p.customer || 'Customer', amount,
    status: 'pending', days: 0, terms: 'Net 30',
    due: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    lines: [line],
    project_id: p.number,
    progressPct: pctNum,
  };
  store.set(list => [row, ...(list || [])]);
  updateProject(p.number, prev => ({
    billing: [...(prev.billing || []), { pct: pctNum, amount, ref: num, at: Date.now() }],
    invoiceRefs: [...(prev.invoiceRefs || []), num],
  }));
  return { ok: true, invoice: row, amount, cumulativePct: already + pctNum };
}

/* Pull customer email acceptances from the backend and apply them: mark the
   estimate accepted, create the project (quote attached), mark the record
   applied. Safe to call on any screen mount; no-ops offline. */
async function applyEstimateAcceptances() {
  const api = window.__shieldAcceptance;
  if (!api) return { applied: 0 };
  const r = await api.pendingApply().catch(() => null);
  if (!r || !r.ok || !r.data.length) return { applied: 0 };
  let applied = 0;
  for (const rec of r.data) {
    const proj = acceptEstimateToProject({
      doc_number: rec.estimate_ref, qbo_id: rec.estimate_qbo_id || undefined,
      customer_name: rec.customer_name, total: Number(rec.amount) || 0, status: 'accepted',
    }, 'email');
    await api.markApplied(rec.id, proj.number).catch(() => {});
    applied++;
    showToast(`Estimate ${rec.estimate_ref} accepted by customer — project ${proj.number} created`, 'ok');
  }
  return { applied };
}

/* Portal invoice/proposal row. Written in the DUAL shape — qbo_* keys
   (doc_number/customer_name/total) so QuickBooks merges are clean, PLUS the
   legacy keys (num/customer/amount/due) so every older screen reads it too.
   Numbering always comes from nextDocNumber unless the caller passes an
   explicit doc_number that is not already taken. */
function buildDoc(kind, form) {
  const isEst = kind === 'estimate' || kind === 'proposal';
  const store = isEst ? estimateStore : invoiceStore;
  const taken = new Set((store.get() || []).map(d => d.doc_number || d.num).filter(Boolean));
  const num = (form.doc_number && !taken.has(form.doc_number)) ? form.doc_number : nextDocNumber(isEst ? 'estimate' : 'invoice');
  const lines = (form.lines || []).map(li => ({
    desc: li.desc ?? li.Description ?? '', qty: Number(li.qty ?? li.Qty ?? 1) || 1, rate: Number(li.rate ?? li.UnitPrice ?? 0) || 0,
  }));
  const total = Number(form.total) || lines.reduce((s, li) => s + li.qty * li.rate, 0);
  const customer = form.customer_name || form.customer || 'Customer';
  /* due_date may arrive ISO (2026-08-30) or display-formatted (Aug 30, 2026) */
  const dueIsIso = form.due_date && /^\d{4}-\d{2}-\d{2}/.test(String(form.due_date));
  const dueIso = dueIsIso ? String(form.due_date).slice(0, 10)
    : (form.due_date && !isNaN(new Date(form.due_date)) ? new Date(form.due_date).toISOString().slice(0, 10) : null);
  return {
    /* qbo_* shape (merges + reports) */
    qbo_id: 'local-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    doc_number: num,
    customer_qbo_id: form.customer_qbo_id || null, customer_name: customer,
    txn_date: form.txn_date || new Date().toISOString().slice(0, 10),
    due_date: dueIso, expiration_date: form.expiration_date || null,
    total, balance: isEst ? undefined : (form.balance != null ? Number(form.balance) : total),
    status: form.status || (isEst ? 'pending' : 'open'),
    lines, project_id: form.project_id || null, source: 'portal',
    /* legacy shape (older list/detail screens) */
    num, customer, amount: total,
    due: dueIso ? fmtDocDate(dueIso) : (form.due || form.due_date || '—'),
    days: 0, terms: form.terms || 'Net 30',
    /* contact carried for the send + accept pipeline */
    customer_email: form.customer_email || null,
  };
}
function addInvoice(form) { const d = buildDoc('invoice', form); invoiceStore.set(l => [d, ...l]); return d; }
function addEstimate(form) { const d = buildDoc('estimate', form); estimateStore.set(l => [d, ...l]); return d; }

/* Sequential proposal ids — scans BOTH the block-based proposal records and
   the doc store so ids never collide (replaces the old random PROP- ids). */
function nextProposalId() {
  const nums = [
    ...(estimateStore.get() || []).map(d => d.doc_number || d.num),
    ...(proposalStore.get() || []).map(p => p.id),
  ];
  const seq = nums.reduce((m, x) => Math.max(m, parseInt(String(x || '').replace(/\D/g, ''), 10) || 0), 1000) + 1;
  return 'PROP-' + seq;
}

/* Bridge: a block-based proposal (builder record) ⇄ the money-doc pipeline.
   Creates or refreshes the matching doc row (same PROP- number) so sending a
   proposal makes it acceptable → project → invoice like any other quote. */
function proposalToDoc(p) {
  const pricing = (p.blocks || []).find(b => b.type === 'pricing');
  const lines = pricing ? ((pricing.content && pricing.content.items) || []).map(li => ({
    desc: li.desc || '', qty: Number(li.qty) || 1, rate: Number(li.rate) || 0,
  })) : [];
  const total = proposalValue(p.blocks);
  const match = (d) => (d.doc_number || d.num) === p.id;
  if ((estimateStore.get() || []).some(match)) {
    estimateStore.set(l => (l || []).map(d => match(d) ? {
      ...d, lines, total, amount: total,
      customer_name: p.customer || d.customer_name, customer: p.customer || d.customer,
      title: p.title || d.title || null,
    } : d));
    return (estimateStore.get() || []).find(match);
  }
  const d = buildDoc('proposal', { doc_number: p.id, customer_name: p.customer, lines, total, status: 'pending' });
  d.title = p.title || null;
  estimateStore.set(l => [d, ...(l || [])]);
  return d;
}

/* Auto-Bid approval → money pipeline. An approved bid becomes a proposal doc
   (idempotent on the bid id) so it flows through accept → project → invoice
   like every other proposal instead of dead-ending at the email. */
function bidToPipeline({ bidId, customer, title, total, lines }) {
  const existing = (estimateStore.get() || []).find(d => d.bid_ref === bidId);
  if (existing) return existing;
  const d = buildDoc('proposal', {
    customer_name: customer || 'Customer', total: Number(total) || 0,
    lines: lines && lines.length ? lines : [{ desc: title || 'Per attached proposal', qty: 1, rate: Number(total) || 0 }],
    status: 'pending',
  });
  d.bid_ref = bidId; d.title = title || null;
  estimateStore.set(l => [d, ...(l || [])]);
  return d;
}

/* Edit any invoice/estimate by doc number. Portal-store rows are patched in
   place; QuickBooks mirror rows get a portal override row with the same doc
   number — the merge dedupes local-first, so the edited version wins on every
   screen. Both store row shapes (num/customer/amount and doc_number/
   customer_name/total) are patched so older rows stay consistent. */
function saveDocEdit(kind, form) {
  const store = kind === 'estimate' ? estimateStore : invoiceStore;
  const num = form.num;
  if (!num) return false;
  const lines = (form.lines || []).filter(l => (l.desc || '').trim() || Number(l.rate));
  const total = lines.length
    ? lines.reduce((s, l) => s + (Number(l.qty) || 1) * (Number(l.rate) || 0), 0)
    : (Number(form.total) || 0);
  const patch = {
    customer_name: form.customer, customer: form.customer,
    ...(form.date ? { txn_date: form.date } : {}),
    ...(kind === 'invoice' && form.due ? { due_date: form.due, due: undefined } : {}),
    ...(kind === 'estimate' && form.expires ? { expiration_date: form.expires, expires: undefined } : {}),
    status: form.status, lines, total, amount: total,
    ...(kind === 'invoice' ? { balance: form.status === 'paid' ? 0 : total } : {}),
  };
  const exists = (store.get() || []).some(r => (r.num || r.doc_number) === num);
  if (exists) store.set(prev => (prev || []).map(r => (r.num || r.doc_number) === num ? { ...r, ...patch } : r));
  else store.set(prev => [{
    qbo_id: 'local-edit-' + Date.now().toString(36), doc_number: num, source: 'portal',
    txn_date: form.date || new Date().toISOString().slice(0, 10), ...patch,
  }, ...(prev || [])]);
  return true;
}
/* Portal-created rows to merge ahead of the QBO rows (newest first). */
function localInvoiceRows() { return invoiceStore.get() || []; }
function localEstimateRows() { return estimateStore.get() || []; }

/* ── ONE source of truth for invoice/estimate rows ──
   Every screen that lists invoices or estimates (Finance suite, the direct
   Invoices/Estimates screens, customer tabs, projects) reads these hooks:
   portal-created rows (synced store) merged with the QuickBooks landing
   tables, normalized to one display shape and deduped by doc number. */

const fmtDocDate = (d) => d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function qboLinesToDisplay(lines) {
  if (!Array.isArray(lines)) return [];
  return lines
    .filter(l => l && (l.desc || l.DetailType === 'SalesItemLineDetail' || l.SalesItemLineDetail))
    .map(l => l.desc !== undefined
      ? { desc: l.desc, qty: Number(l.qty) || 1, rate: Number(l.rate) || 0 }
      : {
          desc: l.Description || (l.SalesItemLineDetail && l.SalesItemLineDetail.ItemRef && l.SalesItemLineDetail.ItemRef.name) || 'Item',
          qty: (l.SalesItemLineDetail && Number(l.SalesItemLineDetail.Qty)) || 1,
          rate: (l.SalesItemLineDetail && Number(l.SalesItemLineDetail.UnitPrice)) || Number(l.Amount) || 0,
        });
}

function mapInvoiceRow(r) {
  const statusMap = { open: 'pending', paid: 'paid', overdue: 'overdue', draft: 'draft', void: 'void', pending: 'pending' };
  const dueRaw = r.due || null;
  return {
    num: r.num || r.doc_number || ('INV-' + (r.qbo_id || '?')),
    customer: r.customer || r.customer_name || 'Customer',
    amount: r.amount != null ? Number(r.amount) : (Number(r.total) || 0),
    status: statusMap[r.status] || r.status || 'pending',
    due: dueRaw || fmtDocDate(r.due_date),
    days: Number(r.days) || ((r.status === 'overdue' && r.due_date) ? Math.max(0, Math.round((Date.now() - new Date(r.due_date).getTime()) / 86400000)) : 0),
    terms: r.terms || '—', po: r.po || '',
    lines: qboLinesToDisplay(r.lines),
    project_id: r.project_id || null,
    source: r.source || (r.qbo_id && !String(r.qbo_id).startsWith('local-') ? 'quickbooks' : 'portal'),
    _raw: r,
  };
}

function mapEstimateRow(r) {
  const statusMap = { pending: 'sent', accepted: 'accepted', closed: 'accepted', rejected: 'expired', draft: 'draft', sent: 'sent', expired: 'expired' };
  return {
    num: r.num || r.doc_number || ('EST-' + (r.qbo_id || '?')),
    customer: r.customer || r.customer_name || 'Customer',
    amount: r.amount != null ? Number(r.amount) : (Number(r.total) || 0),
    status: statusMap[r.status] || 'sent',
    date: r.date || fmtDocDate(r.txn_date),
    expires: r.expires || fmtDocDate(r.expiration_date),
    lines: qboLinesToDisplay(r.lines),
    qboId: r.qbo_id && !String(r.qbo_id).startsWith('local-') ? r.qbo_id : null,
    source: r.source || (r.qbo_id && !String(r.qbo_id).startsWith('local-') ? 'quickbooks' : 'portal'),
    _raw: r,
  };
}

function useMergedDocs(store, fetchQbo, mapRow) {
  const [local] = useShieldStore(store);
  const [qbo, setQbo] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const q = window.__shieldQBO; if (!q) return;
    fetchQbo(q).then(r => { if (alive) setQbo(r && r.ok && r.data ? r.data : []); });
    return () => { alive = false; };
  }, []);
  return React.useMemo(() => {
    const out = []; const seen = new Set();
    for (const r of [...(local || []), ...qbo]) {
      const m = mapRow(r);
      if (seen.has(m.num)) continue;
      seen.add(m.num); out.push(m);
    }
    return out;
  }, [local, qbo]);
}

function useMergedInvoices() {
  return useMergedDocs(invoiceStore, (q) => q.invoices({ limit: 500 }), mapInvoiceRow);
}
function useMergedEstimates() {
  return useMergedDocs(estimateStore, (q) => q.estimates(500), mapEstimateRow);
}

/* Shared empty-state row so blank tables explain themselves the same way everywhere. */
function DocsEmptyRow({ colSpan, kind }) {
  return (
    <tr><td colSpan={colSpan} style={{ padding: '24px 14px', fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>
      No {kind} yet — create one here, or connect QuickBooks (qbo-sync) and they'll all appear after the first sync.
    </td></tr>
  );
}

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
  contactsStore, customerContacts, setCustomerContacts,
  customerDataStore, custRecords, setCustRecords,
  projectStore, invoiceStore, estimateStore,
  buildProject, addProject, buildDoc, addInvoice, addEstimate, saveDocEdit,
  nextDocNumber, bidToPipeline, nextProposalId, proposalToDoc,
  localInvoiceRows, localEstimateRows,
  mapInvoiceRow, mapEstimateRow, useMergedInvoices, useMergedEstimates, DocsEmptyRow,
  updateProject, estWorkflowView, projectForEstimate, acceptEstimateToProject,
  attachEstimateToProject, attachInvoiceToProject, projectBilledPct,
  createProgressInvoice, applyEstimateAcceptances,
  mobileTabsStore, M_ALL_TAB, approvalStore,
  proposalStore, defaultProposalBlocks, proposalValue,
  surveyStore, surveyTotals, SURVEY_RATE, SURVEY_BOM_SEED, studioInboxStore,
  showToast, navTo, genId, fmtDuration, fmtSeconds
});

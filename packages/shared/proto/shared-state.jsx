/* ShieldTech — Shared State System
   Observable stores with localStorage persistence.
   Each store is globally accessible via window.
   Use useShieldStore(store) hook in any component. */

/* ── Core Store Factory ── */
function createShieldStore(key, initial) {
  let state;
  try { state = JSON.parse(localStorage.getItem('st_' + key)) ?? initial; }
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
      try { localStorage.setItem('st_' + key, JSON.stringify(state)); } catch {}
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
    if (e.key !== 'st_' + key || e.newValue == null) return;
    try {
      state = JSON.parse(e.newValue);
      notify();
    } catch {}
  });
  return store;
}

/* ── React Hook ── */
function useShieldStore(store) {
  const [val, setVal] = React.useState(() => store.get());
  React.useEffect(() => store.subscribe(setVal), [store]);
  return [val, store.set.bind(store)];
}

/* ── Ticket Store ── */
const ticketStore = createShieldStore('tickets', [
  { id: 'TK-1042', priority: 'critical', status: 'open',        customer: 'Riverside Medical',  contact: 'Karen Mills',   subject: 'NVR offline — no recording since 6am',             created: Date.now() - 7200000,  sla: { total: 4, remaining: 1.8 }, tags: ['hardware','nvr'],          assignee: 'MR', thread: [{ from:'Karen Mills', time:'8:12 AM', msg:'NVR offline since 6am. ICU cameras not recording. HIPAA concern.', system:false },{ from:'System', time:'8:13 AM', msg:'Ticket TK-1042 created. SLA: 4h.', system:true },{ from:'Mike Reyes', time:'8:45 AM', msg:'Running remote diagnostics — UPS failure likely. On-site by 10am.', system:false }], relatedAsset:'NVR-RM-04 · Hikvision DS-9616NI', aiSuggestion:'UPS failure pattern detected. Recommend: (1) Check UPS on-site, (2) Switch to backup circuit B2, (3) Verify all 16 channels recording.' },
  { id: 'TK-1041', priority: 'high',     status: 'open',        customer: 'Metro Bank Corp',    contact: 'James Yee',     subject: 'Door 3 access card reader not responding',          created: Date.now() - 14400000, sla: { total: 8, remaining: 4 },   tags: ['access-control','hardware'], assignee: 'JL', thread: [{ from:'James Yee', time:'6:30 AM', msg:'Card reader at Vault Door 3 stopped working.', system:false },{ from:'System', time:'6:31 AM', msg:'Ticket TK-1041 created.', system:true }], relatedAsset:'ACR-MB-03 · HID RP40', aiSuggestion:'HID RP40 firmware v2.1.4 known hang on cold-boot. Power-cycle at controller, then push firmware 2.1.6.' },
  { id: 'TK-1040', priority: 'medium',   status: 'in-progress', customer: 'Acme Dental',        contact: 'Dr. Sam Torres', subject: 'Camera 4 shows grainy image after cleaning',        created: Date.now() - 86400000, sla: { total: 24, remaining: 18 },  tags: ['camera','image'],          assignee: 'KW', thread: [{ from:'Dr. Sam Torres', time:'Yesterday 2pm', msg:'Camera 4 blurry after staff cleaned dome.', system:false },{ from:'Kevin White', time:'Yesterday 3pm', msg:'Sounds like moisture in dome. Can you send a photo?', system:false }], relatedAsset:'CAM-AD-04 · Axis P3245', aiSuggestion:'Dome moisture — schedule preventive inspection of all outdoor cameras at this site.' },
  { id: 'TK-1039', priority: 'low',      status: 'resolved',    customer: 'Harbor View Condos', contact: 'Frank Lewis',   subject: 'Add 2 new user codes to panel',                    created: Date.now() - 172800000,sla: { total: 48, remaining: 0 },  tags: ['programming','alarm'],     assignee: 'DP', thread: [{ from:'Frank Lewis', time:'2 days ago', msg:'Need codes 45 and 46 for new residents.', system:false },{ from:'Diana Patel', time:'2 days ago', msg:'Done! Codes 45 and 46 added and tested.', system:false }], relatedAsset:'ALM-HV-01 · DSC PowerSeries', aiSuggestion:null },
  { id: 'TK-1038', priority: 'high',     status: 'open',        customer: 'Westfield Mall',     contact: 'Patricia Ng',  subject: 'False alarm triggered 3× last night',              created: Date.now() - 21600000, sla: { total: 8, remaining: 1.2 }, tags: ['alarm','false-alarm'],     assignee: null, thread: [{ from:'Patricia Ng', time:'7:00 AM', msg:'3 false alarm dispatches between 2am–4am. Police fined us.', system:false },{ from:'System', time:'7:01 AM', msg:'Ticket TK-1038 created. Unassigned.', system:true }], relatedAsset:'ALM-WF-01 · Bosch B9512G', aiSuggestion:'False alarm pattern 2am–4am. HVAC Zone 7 likely. Recommend: remote bypass Zone 7 tonight, on-site recalibration tomorrow AM.' },
]);

/* ── Work Order Store ── */
const workOrderStore = createShieldStore('workorders', [
  { id:'WO-2847', status:'in-progress', type:'Install',  customer:'Metro Bank Corp',    site:'425 Market St',        techId:'JL', tech:'Jessica Liu',  scheduled:'Jun 10 · 8:00 AM', timerRunning:false, timerSeconds:9000, checkedItems:{}, signatureSigned:false },
  { id:'WO-2846', status:'completed',   type:'Repair',   customer:'Acme Dental',        site:'222 Sutter St',        techId:'MR', tech:'Mike Reyes',    scheduled:'Jun 10 · 10:00 AM',timerRunning:false, timerSeconds:6300, checkedItems:{}, signatureSigned:true },
  { id:'WO-2845', status:'scheduled',   type:'Install',  customer:'Riverside Medical',  site:'3388 Geary Blvd',      techId:'TG', tech:'Tony Garcia',   scheduled:'Jun 11 · 8:00 AM', timerRunning:false, timerSeconds:0,    checkedItems:{}, signatureSigned:false },
  { id:'WO-2844', status:'scheduled',   type:'Survey',   customer:'Pinnacle Financial', site:'101 California St',    techId:'TG', tech:'Tony Garcia',   scheduled:'Jun 11 · 11:00 AM',timerRunning:false, timerSeconds:0,    checkedItems:{}, signatureSigned:false },
]);

/* ── Incident Store ── */
const incidentStore = createShieldStore('incidents', [
  { id:'INC-0041', severity:'P1', status:'active',   customer:'Riverside Medical',  type:'Hardware Failure', assignee:'Mike Reyes', openedAt: Date.now() - 12000000, title:'Camera System Offline — Riverside Medical ICU',   playbook:[{step:'Acknowledge and notify on-call tech',done:true},{step:'Remote diagnostics',done:true},{step:'Notify customer with ETA',done:true},{step:'Dispatch tech with replacement UPS',done:true},{step:'On-site: restore NVR power',done:false},{step:'Verify all cameras recording',done:false},{step:'Document root cause',done:false},{step:'Submit HIPAA incident report',done:false}], relatedTicket:'TK-1042' },
  { id:'INC-0040', severity:'P2', status:'active',   customer:'Westfield Mall',     type:'False Alarm',      assignee:'Diana Patel',openedAt: Date.now() - 9900000,  title:'False Alarm ×3 — Westfield Mall',                 playbook:[{step:'Pull alarm event log',done:true},{step:'Identify triggering zone',done:true},{step:'Remote bypass Zone 7',done:true},{step:'Notify customer & police liaison',done:false},{step:'Schedule on-site recalibration',done:false},{step:'Issue incident report',done:false}], relatedTicket:'TK-1038' },
  { id:'INC-0039', severity:'P3', status:'resolved', customer:'Metro Bank Corp',    type:'Access Control',   assignee:'Jessica Liu',openedAt: Date.now() - 25200000, title:'Door Reader Offline — Metro Bank Vault',           playbook:[{step:'Remote access reader controller',done:true},{step:'Power-cycle reader',done:true},{step:'Push firmware v2.1.6',done:true},{step:'Test access with 3 cards',done:true},{step:'Document resolution',done:true}], relatedTicket:'TK-1041' },
]);

/* ── Calendar Jobs Store ── */
/* Schema: techs = array of tech ids ([] = unassigned); day..endDay = inclusive day span (1-7) */
const jobStore = createShieldStore('jobs2', [
  { id:1,  title:'Metro Bank — Camera Install',      techs:['JL'],      type:'install',     day:1, endDay:1, start:8,  dur:4,   customer:'Metro Bank Corp',       value:4200, wo:'WO-2847' },
  { id:2,  title:'City Hall — Access Control',       techs:['KW'],      type:'install',     day:1, endDay:1, start:8,  dur:5,   customer:'City Hall',             value:6800 },
  { id:3,  title:'Acme Dental — NVR Repair',         techs:['MR'],      type:'repair',      day:1, endDay:1, start:10, dur:2.5, customer:'Acme Dental',           value:850, wo:'WO-2846'  },
  { id:4,  title:'Harbor View — PM Visit',           techs:['DP'],      type:'maintenance', day:2, endDay:2, start:9,  dur:3,   customer:'Harbor View Condos',    value:1200 },
  { id:5,  title:'Pinnacle Financial — Survey',      techs:['TG'],      type:'survey',      day:2, endDay:2, start:11, dur:2,   customer:'Pinnacle Financial',    value:0, wo:'WO-2844'    },
  { id:6,  title:'Riverside Med — Fire Panel',       techs:['TG','KW'], type:'install',     day:2, endDay:2, start:7,  dur:6,   customer:'Riverside Medical',     value:9400, wo:'WO-2845' },
  { id:7,  title:'Westfield — Alarm Survey',         techs:['MR'],      type:'survey',      day:3, endDay:3, start:9,  dur:1.5, customer:'Westfield Mall',        value:0    },
  { id:8,  title:'Pacific Rim Hotels — Install',     techs:['JL'],      type:'install',     day:3, endDay:4, start:8,  dur:8,   customer:'Pacific Rim Hotels',    value:12600},
  { id:9,  title:'Golden Gate — Perimeter Cams',     techs:['KW'],      type:'install',     day:3, endDay:3, start:13, dur:3,   customer:'Golden Gate Logistics', value:3100 },
  { id:10, title:'Team Meeting — Q2 Review',         techs:['MR'],      type:'meeting',     day:4, endDay:4, start:9,  dur:1,   customer:'Internal',             value:0    },
  { id:11, title:'Embarcadero — Access Control',     techs:['DP'],      type:'install',     day:4, endDay:4, start:10, dur:4,   customer:'Embarcadero Partners',  value:5600 },
  { id:12, title:'Marina Dental — Walkthrough',      techs:['MR'],      type:'maintenance', day:5, endDay:5, start:8,  dur:2,   customer:'Marina District Dental',value:400  },
  { id:13, title:'Bayshore Med — Assessment',        techs:['KW'],      type:'survey',      day:5, endDay:5, start:10, dur:3,   customer:'Bayshore Medical',      value:0    },
  { id:14, title:'Sutter Health — Cabling Rough-In', techs:[],          type:'install',     day:5, endDay:5, start:9,  dur:6,   customer:'Sutter Health',         value:7800 },
]);

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
const customerStore = createShieldStore('customers', [
  { id: 1, name: 'Metro Bank Corp', dba: '', type: 'Commercial', industry: 'Banking', status: 'active', acctNum: 'CUST-1001', sites: 3, assets: 48, contacts: 6, owner: 'John Mitchell', balance: 67500, mrr: 4800, health: 92, logo: 'MB', tags: ['Enterprise','Banking'], parent: null,
    address: '1450 Market St, Philadelphia, PA 19102', billing: '1450 Market St, Philadelphia, PA 19102', phone: '(215) 555-0200', website: 'metrobankcorp.com', taxId: '23-4567890', terms: 'Net 30', taxExempt: false, notes: '' },
  { id: 2, name: 'City Hall — Main', dba: 'City of Philadelphia', type: 'Government', industry: 'Municipal', status: 'active', acctNum: 'CUST-1002', sites: 5, assets: 86, contacts: 8, owner: 'Sarah Chen', balance: 0, mrr: 3200, health: 88, logo: 'CH', tags: ['Government','Multi-site'], parent: null,
    address: '1401 JFK Blvd, Philadelphia, PA 19107', billing: '1401 JFK Blvd, Room 204', phone: '(215) 555-0300', website: 'phila.gov', taxId: 'Tax Exempt', terms: 'Net 30', taxExempt: true, notes: '' },
  { id: 3, name: 'Pacific Rim Hotels', dba: '', type: 'Hospitality', industry: 'Hotels', status: 'active', acctNum: 'CUST-1003', sites: 3, assets: 0, contacts: 4, owner: 'John Mitchell', balance: 48000, mrr: 0, health: 0, logo: 'PR', tags: ['Enterprise','New'], parent: null,
    address: '1234 Chestnut St, Philadelphia, PA 19107', billing: 'Attn: AP Dept', phone: '(215) 555-0400', website: 'pacificrimhotels.com', taxId: '34-5678901', terms: 'Net 30', taxExempt: false, notes: '' },
  { id: 4, name: 'Westfield Mall', dba: 'Westfield Corp', type: 'Commercial', industry: 'Retail', status: 'active', acctNum: 'CUST-1004', sites: 1, assets: 34, contacts: 3, owner: 'Sarah Chen', balance: 0, mrr: 5200, health: 96, logo: 'WM', tags: ['Enterprise','Retail'], parent: null,
    address: '4000 Mall Blvd, King of Prussia, PA 19406', billing: '4000 Mall Blvd', phone: '(610) 555-0500', website: 'westfield.com', taxId: '45-6789012', terms: 'Net 30', taxExempt: false, notes: '' },
  { id: 5, name: 'Acme Dental Group', dba: '', type: 'Healthcare', industry: 'Dental', status: 'active', acctNum: 'CUST-1005', sites: 2, assets: 12, contacts: 2, owner: 'John Mitchell', balance: 14250, mrr: 2400, health: 64, logo: 'AD', tags: ['Healthcare','Overdue'], parent: null,
    address: '820 Walnut St, Philadelphia, PA 19107', billing: '820 Walnut St', phone: '(215) 555-0600', website: 'acmedental.com', taxId: '56-7890123', terms: 'Net 30', taxExempt: false, notes: '' },
  { id: 6, name: 'Riverside Medical', dba: 'Riverside Health System', type: 'Healthcare', industry: 'Medical', status: 'active', acctNum: 'CUST-1006', sites: 1, assets: 32, contacts: 5, owner: 'Sarah Chen', balance: 0, mrr: 2800, health: 91, logo: 'RM', tags: ['Healthcare','HIPAA'], parent: null,
    address: '500 Vine St, Philadelphia, PA 19106', billing: 'Attn: Facilities', phone: '(215) 555-0700', website: 'riversidemedical.org', taxId: '67-8901234', terms: 'Net 15', taxExempt: false, notes: '' },
  { id: 7, name: 'Harbor View Condos', dba: 'Harbor View HOA', type: 'Residential', industry: 'HOA', status: 'active', acctNum: 'CUST-1007', sites: 1, assets: 8, contacts: 2, owner: 'John Mitchell', balance: 5200, mrr: 1800, health: 72, logo: 'HV', tags: ['Residential','Overdue'], parent: null,
    address: '200 S Columbus Blvd, Philadelphia, PA 19106', billing: '200 S Columbus Blvd', phone: '(215) 555-0800', website: '', taxId: '78-9012345', terms: 'Net 15', taxExempt: false, notes: '' },
  { id: 8, name: 'Marina District Dental', dba: '', type: 'Healthcare', industry: 'Dental', status: 'active', acctNum: 'CUST-1008', sites: 1, assets: 8, contacts: 2, owner: 'John Mitchell', balance: 24800, mrr: 0, health: 0, logo: 'MD', tags: ['Healthcare','New'], parent: null,
    address: '456 Marina Blvd, Suite 200', billing: '456 Marina Blvd', phone: '(415) 555-0900', website: '', taxId: '89-0123456', terms: 'Net 30', taxExempt: false, notes: '' },
]);

/* ── Sub-Customer Store (service locations / billing entities under a parent) ── */
const subCustomerStore = createShieldStore('subcustomers', [
  { id: 101, parentId: 2, name: 'City Hall — Annex Building', role: 'service_location', status: 'active' },
  { id: 102, parentId: 2, name: 'City Hall — Finance Dept', role: 'billing_entity', status: 'active' },
  { id: 103, parentId: 2, name: 'City Hall — Parks & Rec', role: 'estimate_recipient', status: 'active' },
  { id: 104, parentId: 3, name: 'Pacific Rim — Property 1 (Center City)', role: 'service_location', status: 'active' },
  { id: 105, parentId: 3, name: 'Pacific Rim — Property 2 (Airport)', role: 'service_location', status: 'active' },
  { id: 106, parentId: 3, name: 'Pacific Rim — Corporate AP', role: 'billing_entity', status: 'active' },
]);

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
const approvalStore = createShieldStore('approvals', [
  { id: 1, kind: 'EXPENSE',        title: 'Mike Reyes — parts run, Home Depot', amt: '$214.80', sub: 'WO-2846 · receipt attached', status: 'pending' },
  { id: 2, kind: 'TIMESHEET',      title: 'Jessica Liu — week of Jun 1',        amt: '41.5h',   sub: '1.5h overtime flagged',     status: 'pending' },
  { id: 3, kind: 'PURCHASE ORDER', title: 'PO-2214 — Hikvision 4K bullets ×6',  amt: '$2,742',  sub: 'Restock · below min level', status: 'pending' },
  { id: 4, kind: 'EXPENSE',        title: 'Tony Garcia — mileage, 84 mi',       amt: '$56.28',  sub: 'Harbor View round trips',   status: 'pending' },
]);

/* ── Unscheduled Backlog Store (shared by Calendar + Dispatch queue) ── */
const backlogStore = createShieldStore('backlog', [
  { id:'p1', title:'Westfield Mall — Camera Refresh',  customer:'Westfield Mall',     type:'install',     dur:6,   days:2, value:18400, addr:'865 Market St',    sla:'3d' },
  { id:'p2', title:'Acme Dental — Panel Swap',         customer:'Acme Dental',        type:'repair',      dur:2,   days:1, value:2300,  addr:'222 Sutter St',    sla:'45m left' },
  { id:'p3', title:'Harbor View — Site Survey',        customer:'Harbor View Condos', type:'survey',      dur:1.5, days:1, value:0,     addr:'140 Beach St',     sla:'1d' },
  { id:'p4', title:'City Hall — Badge Reader x4',      customer:'City Hall',          type:'install',     dur:4,   days:1, value:9200,  addr:'1 Goodlett Pl',    sla:'2h 14m left' },
  { id:'p5', title:'Pacific Rim — NVR Maintenance',    customer:'Pacific Rim Hotels', type:'maintenance', dur:3,   days:1, value:1800,  addr:'1234 Chestnut St', sla:'1d' },
]);

/* ── Work-order deep-link (set before navTo('workorder') to open a specific WO) ── */
const woFocusStore = createShieldStore('wofocus', null);

/* ── Truck Inventory Store (per-tech van stock; auto-restock automation) ── */
const truckStore = createShieldStore('truck', {
  MR: [
    { name:'Axis P3245-V Dome',  sku:'P3245-V',  qty:2, min:1 },
    { name:'HID RP40 Reader',    sku:'RP40',     qty:1, min:1 },
    { name:'CAT6A Patch 25ft',   sku:'C6A-25',   qty:8, min:4 },
    { name:'PoE Injector 30W',   sku:'POE-INJ',  qty:3, min:2 },
    { name:'Door Strike 12V',    sku:'DS-12V',   qty:0, min:1 },
    { name:'RG59 Crimp Kit',     sku:'CRIMP-59', qty:1, min:1 },
  ],
});

/* ── NPS Store ── */
const npsStore = createShieldStore('nps', [
  { id:1, customer:'Marina District Dental', contact:'Dr. Amy Foster',   score:10, category:'promoter',  job:'WO-2835', date:'Jun 9',  comment:'Incredibly professional. Mike arrived early, explained everything clearly. Will definitely recommend.', followedUp:false },
  { id:2, customer:'City Hall',              contact:'Sandra Kim',        score:9,  category:'promoter',  job:'WO-2829', date:'Jun 8',  comment:'Great work on access control. On budget and on time.', followedUp:true  },
  { id:3, customer:'Westfield Mall',         contact:'Patricia Ng',       score:6,  category:'passive',   job:'TK-1038', date:'Jun 8',  comment:'False alarms are a serious problem. We received police fines. Root cause not yet resolved.', followedUp:false },
  { id:4, customer:'Acme Dental',            contact:'Dr. Sam Torres',    score:8,  category:'promoter',  job:'WO-2840', date:'Jun 7',  comment:'Quick response to NVR issue. Would have been a 10 but took 2 visits to fully resolve.', followedUp:false },
  { id:5, customer:'Bayshore Medical',       contact:'Dr. Michael Torres',score:4,  category:'detractor', job:'TK-1039', date:'Jun 6',  comment:'Tech arrived 45 minutes late with no call. Assessment was generic and did not address our HIPAA requirements.', followedUp:false },
  { id:6, customer:'Pacific Rim Hotels',     contact:'Lisa Wang',         score:9,  category:'promoter',  job:'WO-2833', date:'Jun 5',  comment:'Phenomenal job on the pilot installation. Moving forward with all 3 hotels.', followedUp:true  },
  { id:7, customer:'Riverside Medical',      contact:'Karen Mills',       score:5,  category:'detractor', job:'TK-1042', date:'Jun 10', comment:'Critical system failure in a medical facility. We expect a proactive monitoring plan going forward.', followedUp:false },
]);

/* ── Purchase Order Store ── */
const poStore = createShieldStore('pos', [
  { id:'PO-0284', vendor:'Axis Communications',       status:'received', date:'Jun 3', total:8420,  items:[{desc:'Axis P3245-V',sku:'P3245-V',qty:20,unit:285,received:20},{desc:'Axis Q6135-LE PTZ',sku:'Q6135-LE',qty:4,unit:890,received:4}] },
  { id:'PO-0285', vendor:'HID Global',                status:'partial',  date:'Jun 5', total:5760,  items:[{desc:'HID RP40 Reader',sku:'RP40',qty:24,unit:165,received:16},{desc:'HID iCLASS Credentials',sku:'ICLS-50',qty:4,unit:210,received:4},{desc:'HID Controller',sku:'HID-CTRL',qty:4,unit:320,received:2}] },
  { id:'PO-0286', vendor:'Anixter / Wesco',           status:'sent',     date:'Jun 7', total:3240,  items:[{desc:'CAT6A Plenum 1000ft',sku:'CAT6A-1K',qty:6,unit:280,received:0},{desc:'PoE++ Switch 24P',sku:'POE24',qty:3,unit:480,received:0}] },
  { id:'PO-0287', vendor:'Bosch Security Systems',    status:'draft',    date:'Jun 9', total:12800, items:[{desc:'Bosch B9512G Panel',sku:'B9512G',qty:4,unit:1200,received:0},{desc:'DS151i Motion Detector',sku:'DS151I',qty:40,unit:68,received:0}] },
]);

/* ── Skills Store ── */
const skillsStore = createShieldStore('skills', {
  MR:{ 'axis-cert':3,'hik-cert':3,'ip-config':3,'nvr-setup':3,'hid-cert':2,'lenel-cert':1,'door-hardware':3,'nicet-ii':2,'bosch-cert':2,'dsc-cert':3,'fire-panel':2,'network-config':2,'poe-install':3,'fiber-splice':1,'c7-license':3,'hipaa-aware':2,'low-voltage':3 },
  JL:{ 'axis-cert':3,'hik-cert':2,'ip-config':3,'nvr-setup':3,'hid-cert':3,'lenel-cert':2,'door-hardware':2,'nicet-ii':0,'bosch-cert':1,'dsc-cert':2,'fire-panel':0,'network-config':3,'poe-install':3,'fiber-splice':2,'c7-license':3,'hipaa-aware':3,'low-voltage':3 },
  KW:{ 'axis-cert':2,'hik-cert':2,'ip-config':2,'nvr-setup':2,'hid-cert':2,'lenel-cert':0,'door-hardware':2,'nicet-ii':1,'bosch-cert':1,'dsc-cert':1,'fire-panel':1,'network-config':2,'poe-install':2,'fiber-splice':0,'c7-license':2,'hipaa-aware':1,'low-voltage':2 },
  DP:{ 'axis-cert':2,'hik-cert':1,'ip-config':2,'nvr-setup':2,'hid-cert':3,'lenel-cert':0,'door-hardware':3,'nicet-ii':0,'bosch-cert':2,'dsc-cert':2,'fire-panel':1,'network-config':1,'poe-install':2,'fiber-splice':0,'c7-license':3,'hipaa-aware':2,'low-voltage':3 },
  TG:{ 'axis-cert':3,'hik-cert':3,'ip-config':3,'nvr-setup':3,'hid-cert':2,'lenel-cert':3,'door-hardware':2,'nicet-ii':3,'bosch-cert':3,'dsc-cert':3,'fire-panel':3,'network-config':2,'poe-install':3,'fiber-splice':3,'c7-license':3,'hipaa-aware':2,'low-voltage':3 },
  AL:{ 'axis-cert':1,'hik-cert':1,'ip-config':1,'nvr-setup':1,'hid-cert':1,'lenel-cert':0,'door-hardware':1,'nicet-ii':0,'bosch-cert':0,'dsc-cert':1,'fire-panel':0,'network-config':1,'poe-install':1,'fiber-splice':0,'c7-license':1,'hipaa-aware':1,'low-voltage':1 },
});

/* ── QTC (Quote to Cash) Store ── */
const qtcStore = createShieldStore('qtc', [
  { id:'D-001', name:'Pacific Rim Hotels',    value:215000, stage:'scheduled', age:18, contact:'Lisa Wang',     risk:'low' },
  { id:'D-002', name:'Pinnacle Financial',    value:128500, stage:'approved',  age:12, contact:'Sarah Chen',    risk:'low' },
  { id:'D-003', name:'Bayshore Medical',      value:94200,  stage:'invoiced',  age:31, contact:'Dr. Torres',    risk:'medium' },
  { id:'D-004', name:'Riverside Medical',     value:88400,  stage:'paid',      age:45, contact:'Karen Mills',   risk:'low' },
  { id:'D-005', name:'Metro Bank Corp',       value:62000,  stage:'installed', age:22, contact:'James Yee',     risk:'low' },
  { id:'D-006', name:'City Hall Phase 2',     value:54000,  stage:'po',        age:9,  contact:'Mayor Office',  risk:'medium' },
  { id:'D-007', name:'Westfield Mall',        value:48000,  stage:'quote',     age:5,  contact:'Patricia Ng',   risk:'high' },
  { id:'D-008', name:'Golden Gate Logistics', value:38500,  stage:'paid',      age:60, contact:'James Park',    risk:'low' },
  { id:'D-009', name:'Embarcadero Partners',  value:67500,  stage:'invoiced',  age:14, contact:'Ryan McCarthy', risk:'low' },
  { id:'D-010', name:'Harbor View Condos',    value:24800,  stage:'paid',      age:35, contact:'Frank Lewis',   risk:'low' },
  { id:'D-011', name:'Acme Dental',           value:18400,  stage:'approved',  age:3,  contact:'Dr. Reyes',     risk:'low' },
  { id:'D-012', name:'Redwood College',       value:38000,  stage:'quote',     age:21, contact:'Tom Bradley',   risk:'high' },
]);

/* ── MRR Store ── */
const mrrStore = createShieldStore('mrr', [
  { customer:'Pacific Rim Hotels',    plan:'Enterprise Monitoring', mrr:8400,  status:'active',  renewal:'Dec 2027', risk:'low',    churned:false },
  { customer:'Metro Bank Corp',        plan:'Pro Monitoring',        mrr:4200,  status:'active',  renewal:'Mar 2027', risk:'low',    churned:false },
  { customer:'Riverside Medical',      plan:'Enterprise Monitoring', mrr:5800,  status:'active',  renewal:'Sep 2026', risk:'medium', churned:false },
  { customer:'Westfield Mall',         plan:'Pro + Response SLA',    mrr:3600,  status:'active',  renewal:'Nov 2026', risk:'medium', churned:false },
  { customer:'City Hall',              plan:'Government Tier',       mrr:6200,  status:'active',  renewal:'Jun 2028', risk:'low',    churned:false },
  { customer:'Harbor View Condos',     plan:'Standard Monitoring',   mrr:1400,  status:'active',  renewal:'Oct 2026', risk:'low',    churned:false },
  { customer:'Acme Dental',            plan:'Standard Monitoring',   mrr:980,   status:'active',  renewal:'Feb 2027', risk:'low',    churned:false },
  { customer:'Embarcadero Partners',   plan:'Pro Monitoring',        mrr:2800,  status:'active',  renewal:'Aug 2027', risk:'low',    churned:false },
  { customer:'Bayshore Medical',       plan:'Standard Monitoring',   mrr:1600,  status:'at-risk', renewal:'Jul 2026', risk:'high',   churned:false },
  { customer:'Golden Gate Logistics',  plan:'Standard Monitoring',   mrr:1200,  status:'active',  renewal:'Apr 2027', risk:'low',    churned:false },
  { customer:'Pinnacle Financial',     plan:'Enterprise (new)',      mrr:6800,  status:'pending', renewal:'Jun 2029', risk:'low',    churned:false },
]);

/* ── Parts Req Store ── */
const partsReqStore = createShieldStore('partsreq', [
  { id:'REQ-088', tech:'MR', techName:'Mike Reyes',   status:'requested', urgency:'urgent', job:'TK-1042 · Riverside Medical', parts:[{name:'APC UPS 1500VA',sku:'SMT1500',qty:1},{name:'SATA Cable',sku:'SATA-PWR',qty:2}], submitted:'2h ago', notes:'NVR offline — patient safety concern' },
  { id:'REQ-087', tech:'JL', techName:'Jessica Liu',  status:'approved',  urgency:'normal', job:'WO-2847 · Metro Bank',        parts:[{name:'Axis P3245-V',sku:'P3245-V',qty:2},{name:'Mount Kit',sku:'MK-DOME',qty:2}],    submitted:'4h ago', notes:'' },
  { id:'REQ-086', tech:'DP', techName:'Diana Patel',  status:'picking',   urgency:'normal', job:'WO-2841 · City Hall',         parts:[{name:'HID RP40 Reader',sku:'RP40',qty:4}],                                          submitted:'6h ago', notes:'' },
  { id:'REQ-085', tech:'KW', techName:'Kevin White',  status:'shipped',   urgency:'normal', job:'WO-2839 · Pacific Rim',       parts:[{name:'PoE++ Switch 8-Port',sku:'POE8',qty:1}],                                      submitted:'8h ago', notes:'' },
  { id:'REQ-084', tech:'TG', techName:'Tony Garcia',  status:'delivered', urgency:'low',    job:'WO-2835 · Harbor View',       parts:[{name:'Door Strike 12V',sku:'DS-12V',qty:3}],                                        submitted:'1d ago', notes:'' },
]);

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
const proposalStore = createShieldStore('proposals', [
  { id:'PROP-301', customer:'Pinnacle Financial Group', title:'3-Floor Office Security System', status:'sent', created:'Jun 4', viewed:true, viewTime:'4m 22s', blocks: defaultProposalBlocks('Pinnacle Financial Group', '3-Floor Office Security System') },
  { id:'PROP-298', customer:'Pacific Rim Hotels', title:'Multi-Property Security Upgrade', status:'accepted', created:'May 30', viewed:true, viewTime:'12m 08s', blocks: defaultProposalBlocks('Pacific Rim Hotels', 'Multi-Property Security Upgrade') },
  { id:'PROP-295', customer:'Bayshore Medical Center', title:'HIPAA Compliance Security Upgrade', status:'draft', created:'Jun 2', viewed:false, viewTime:'—', blocks: defaultProposalBlocks('Bayshore Medical Center', 'HIPAA Compliance Security Upgrade') },
  { id:'PROP-290', customer:'Golden Gate Logistics', title:'Warehouse Perimeter Security', status:'sent', created:'May 28', viewed:true, viewTime:'2m 15s', blocks: defaultProposalBlocks('Golden Gate Logistics', 'Warehouse Perimeter Security') },
  { id:'PROP-288', customer:'Redwood Community College', title:'Campus Safety System', status:'declined', created:'Apr 15', viewed:true, viewTime:'0m 45s', blocks: defaultProposalBlocks('Redwood Community College', 'Campus Safety System') },
]);

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
const surveyStore = createShieldStore('surveys', [
  { id:'SR-1042', customer:'Redwood College', site:'Main Campus — Bldg A', date:'Jun 5', status:'draft', margin:35, notes:'Open-plan office + warehouse bays. Plenum cabling required.',
    detected:[
      { kind:'Perimeter doors', count:6, note:'4 need access readers, 2 alarm-only', conf:96 },
      { kind:'Camera positions', count:14, note:'8 indoor dome · 4 outdoor bullet · 2 PTZ', conf:91 },
      { kind:'Head-end location', count:1, note:'IT closet, rack space available', conf:88 },
      { kind:'Cable runs', count:21, note:'~2,400 ft CAT6A, plenum required', conf:82 },
    ],
    bom: SURVEY_BOM_SEED.map(b => ({ ...b }) ) },
]);
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
const photoStore = createShieldStore('photos', [
  { id:'PH-101', wo:'WO-2847', customer:'Metro Bank Corp', site:'425 Market St', tech:'JL', techName:'Jessica Liu', phase:'before',   slot:'Site — before',    label:'Vault corridor — existing wiring',        day:'Today',     time:'8:24 AM',  look:{h:215,p:'ceiling',s:11}, pair:'mb-1', annotations:[] },
  { id:'PH-102', wo:'WO-2847', customer:'Metro Bank Corp', site:'425 Market St', tech:'JL', techName:'Jessica Liu', phase:'progress', slot:'Cable runs',       label:'CAT6A runs above tray',                   day:'Today',     time:'9:48 AM',  look:{h:200,p:'ceiling',s:23}, pair:null,  annotations:[] },
  { id:'PH-103', wo:'WO-2847', customer:'Metro Bank Corp', site:'425 Market St', tech:'JL', techName:'Jessica Liu', phase:'progress', slot:'Head-end / panel', label:'Head-end rack — switch installed',        day:'Today',     time:'11:05 AM', look:{h:190,p:'rack',s:37},    pair:null,  annotations:[] },
  { id:'PH-104', wo:'WO-2847', customer:'Metro Bank Corp', site:'425 Market St', tech:'JL', techName:'Jessica Liu', phase:'progress', slot:'Device mounts',    label:'Dome mounted — lobby NE corner',          day:'Today',     time:'1:32 PM',  look:{h:210,p:'wall',s:41},    pair:null,  annotations:[] },
  { id:'PH-105', wo:'WO-2847', customer:'Metro Bank Corp', site:'425 Market St', tech:'JL', techName:'Jessica Liu', phase:'issue',    slot:null,               label:'Water staining above cable tray',         day:'Today',     time:'10:12 AM', look:{h:30,p:'ceiling',s:53},  pair:null,  annotations:[{x:58,y:34,label:'Staining — flag to GC before close-up'}] },
  { id:'PH-106', wo:'WO-2846', customer:'Acme Dental',     site:'222 Sutter St', tech:'MR', techName:'Mike Reyes',  phase:'before',   slot:'Issue found',      label:'NVR — failed power supply',               day:'Yesterday', time:'10:20 AM', look:{h:260,p:'rack',s:7},     pair:'ad-1', annotations:[{x:48,y:52,label:'Bulged capacitors'}] },
  { id:'PH-107', wo:'WO-2846', customer:'Acme Dental',     site:'222 Sutter St', tech:'MR', techName:'Mike Reyes',  phase:'after',    slot:'Repair complete',  label:'NVR — new PSU, all 16 channels up',       day:'Yesterday', time:'11:40 AM', look:{h:150,p:'rack',s:19},    pair:'ad-1', annotations:[] },
  { id:'PH-108', wo:'WO-2840', customer:'Acme Dental',     site:'222 Sutter St', tech:'MR', techName:'Mike Reyes',  phase:'before',   slot:'Before service',   label:'Operatory dome — lens haze',              day:'Jun 9',     time:'2:15 PM',  look:{h:220,p:'wall',s:29},    pair:'ad-2', annotations:[] },
  { id:'PH-109', wo:'WO-2840', customer:'Acme Dental',     site:'222 Sutter St', tech:'MR', techName:'Mike Reyes',  phase:'after',    slot:'After service',    label:'Operatory dome — cleaned & refocused',    day:'Jun 9',     time:'2:50 PM',  look:{h:205,p:'wall',s:31},    pair:'ad-2', annotations:[] },
  { id:'PH-110', wo:'WO-2845', customer:'Riverside Medical', site:'3388 Geary Blvd', tech:'TG', techName:'Tony Garcia', phase:'before', slot:'Site — before',  label:'ICU corridor — mount locations marked',   day:'Today',     time:'8:05 AM',  look:{h:185,p:'ceiling',s:61}, pair:null,  annotations:[] },
  { id:'PH-111', wo:'WO-2838', customer:'Westfield Mall',  site:'865 Market St', tech:'KW', techName:'Kevin White',  phase:'before',   slot:null,               label:'Parking structure — legacy analog cam',   day:'Jun 10',    time:'9:30 AM',  look:{h:35,p:'exterior',s:43}, pair:'wf-1', annotations:[] },
  { id:'PH-112', wo:'WO-2838', customer:'Westfield Mall',  site:'865 Market St', tech:'KW', techName:'Kevin White',  phase:'after',    slot:null,               label:'Parking structure — new 4K bullet',       day:'Jun 10',    time:'1:15 PM',  look:{h:215,p:'exterior',s:47},pair:'wf-1', annotations:[] },
  { id:'PH-113', wo:'WO-2841', customer:'Harbor View Condos', site:'140 Beach St', tech:'DP', techName:'Diana Patel', phase:'before',  slot:'Before service',   label:'Alarm panel — pre-service',               day:'Jun 10',    time:'10:00 AM', look:{h:280,p:'panel',s:13},   pair:'hv-1', annotations:[] },
  { id:'PH-114', wo:'WO-2841', customer:'Harbor View Condos', site:'140 Beach St', tech:'DP', techName:'Diana Patel', phase:'after',   slot:'After service',    label:'Alarm panel — serviced, all zones tested', day:'Jun 10',   time:'11:25 AM', look:{h:160,p:'panel',s:17},   pair:'hv-1', annotations:[] },
  { id:'PH-115', wo:'WO-2839', customer:'Golden Gate Logistics', site:'Pier 80',  tech:'KW', techName:'Kevin White',  phase:'progress', slot:null,               label:'Perimeter pole — conduit run',            day:'Yesterday', time:'3:40 PM',  look:{h:200,p:'exterior',s:71},pair:null,  annotations:[] },
  { id:'PH-116', wo:'WO-2837', customer:'Metro Bank Corp', site:'425 Market St', tech:'JL', techName:'Jessica Liu',  phase:'progress', slot:null,               label:'Badge reader — door 3 rewire',            day:'Jun 9',     time:'4:05 PM',  look:{h:240,p:'wall',s:73},    pair:null,  annotations:[] },
]);

/* ── Punch List Store ──
   pin: {x,y} percent coords on the site floor plan */
const punchStore = createShieldStore('punch', [
  { id:'PL-01', customer:'Metro Bank Corp', site:'425 Market St', title:'Camera 4 — adjust angle toward teller line', detail:'Current FOV clips the service counter', pin:{x:22,y:30}, status:'open',     assignee:'JL', due:'Jun 13', photoId:'PH-104', priority:'high' },
  { id:'PL-02', customer:'Metro Bank Corp', site:'425 Market St', title:'Label head-end patch panel',               detail:'Ports 12–24 unlabeled after install',  pin:{x:78,y:22}, status:'open',     assignee:'JL', due:'Jun 13', photoId:'PH-103', priority:'medium' },
  { id:'PL-03', customer:'Metro Bank Corp', site:'425 Market St', title:'Water staining above tray — GC to repair', detail:'Flagged during install; verify after GC fix', pin:{x:55,y:38}, status:'open', assignee:'MR', due:'Jun 16', photoId:'PH-105', priority:'high' },
  { id:'PL-04', customer:'Metro Bank Corp', site:'425 Market St', title:'Door 3 reader — torque mounting screws',   detail:'',                                       pin:{x:88,y:64}, status:'done',     assignee:'JL', due:'Jun 12', photoId:null,     priority:'medium' },
  { id:'PL-05', customer:'Metro Bank Corp', site:'425 Market St', title:'Vault dome — remove protective film',      detail:'',                                       pin:{x:38,y:72}, status:'verified', assignee:'DP', due:'Jun 11', photoId:null,     priority:'low' },
  { id:'PL-06', customer:'Metro Bank Corp', site:'425 Market St', title:'Lobby — patch & paint conduit penetration', detail:'Customer to sign off after paint',      pin:{x:18,y:62}, status:'done',     assignee:'MR', due:'Jun 12', photoId:null,     priority:'medium' },
]);

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
  photoStore, PHOTO_CHECKLISTS, punchStore, PUNCH_STATUS, PUNCH_TECHS,
  backlogStore, woFocusStore, truckStore,
  customerStore, subCustomerStore, buildCustomer,
  mobileTabsStore, M_ALL_TAB, approvalStore,
  proposalStore, defaultProposalBlocks, proposalValue,
  surveyStore, surveyTotals, SURVEY_RATE, SURVEY_BOM_SEED, studioInboxStore,
  showToast, navTo, genId, fmtDuration, fmtSeconds
});

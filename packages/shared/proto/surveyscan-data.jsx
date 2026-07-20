/* Survey Scan — data layer extensions (magicplan-parity, security-integrator flavored).
   Adds: prefs, signal readings, issues, coverage zones, media kinds, checklists/SOPs,
   on-site estimate, sync feed, laser meter — seeded onto the existing siteScanStore. */

/* ── Survey Scan preferences (bound to Tweaks) ── */
const surveyPrefsStore = createShieldStore('svprefs', { hubLayout: 'workflow', reportStyle: 'blueprint', aiCapture: true, laser: null });

/* ── Signal reading kinds (magicplan's instrument readings → RF/network site readings) ── */
const SV_READINGS = [
  { kind: 'wifi', label: 'Wi-Fi RSSI',   unit: 'dBm',  color: '#3FA9F5', good: v => v >= -65 },
  { kind: 'lte',  label: 'LTE signal',   unit: 'dBm',  color: '#c084fc', good: v => v >= -95 },
  { kind: 'link', label: 'Drop test',    unit: 'Mbps', color: '#34D399', good: v => v >= 900 },
  { kind: 'poe',  label: 'PoE budget',   unit: 'W',    color: '#FBBF24', good: v => v >= 15 },
];
const svReading = k => SV_READINGS.find(r => r.kind === k) || SV_READINGS[0];

const SV_SEV = { high: { label: 'Blocker', c: '#F43F5E' }, med: { label: 'Attention', c: '#FBBF24' }, low: { label: 'Note', c: '#3FA9F5' } };

/* ── Coverage zone types (magicplan "affected areas" → device coverage w/ auto quantities) ── */
const SV_ZONES = [
  { type: 'camera', label: 'Camera FOV',      c: '#3FA9F5' },
  { type: 'motion', label: 'Motion coverage', c: '#FBBF24' },
  { type: 'reader', label: 'Access zone',     c: '#34D399' },
  { type: 'gap',    label: 'Coverage gap',    c: '#F43F5E' },
];
const svZone = t => SV_ZONES.find(z => z.type === t) || SV_ZONES[0];

/* ── Form / checklist / SOP templates ── */
const SV_TEMPLATES = [
  { id: 'tpl-door',  name: 'Door hardware schedule', kind: 'Form',      items: ['Door type & handing', 'Frame material', 'Existing strike / lock', 'Power at door?', 'ADA operator present', 'Request-to-exit device'] },
  { id: 'tpl-head',  name: 'Head-end room audit',    kind: 'Checklist', items: ['Rack space ≥ 8U free', 'Dedicated circuit available', 'UPS present & tested', 'Patch panel labeled', 'HVAC / ventilation OK', 'Conduit path to riser'] },
  { id: 'tpl-net',   name: 'Network readiness SOP',  kind: 'SOP',       items: ['Identify IDF/MDF locations', 'Run drop test at each device point', 'Record switch model & free ports', 'Confirm VLAN for security devices', 'Verify PoE budget headroom'] },
  { id: 'tpl-pre',   name: 'Pre-install walkthrough', kind: 'Checklist', items: ['Ceiling type per room noted', 'Lift required? (>14ft)', 'Firewall / plenum penetrations flagged', 'Customer escort arranged', 'Photo every device location'] },
];

/* ── Per-room quantity takeoff (auto quantities from captured geometry) ── */
function svRoomQty(project) {
  const rows = [];
  project.floors.forEach(f => f.rooms.forEach(r => {
    const area = ssArea(r.poly), per = ssPerim(r.poly), h = r.h || 9;
    rows.push({ floor: f.label, name: r.name, area: Math.round(area), perim: Math.round(per), wall: Math.round(per * h), ceil: Math.round(area) });
  }));
  return rows;
}

/* Estimate math: BOM + extras + cost rules */
function svEstimate(project) {
  const est = project.estimate || {};
  const t = ssTotals(project);
  const extras = est.extras || [];
  const extrasTotal = extras.reduce((a, e) => a + (e.qty || 1) * (e.unit || 0), 0);
  const tm = (est.tm || []).reduce((a, e) => a + (e.hrs || 0) * (e.rate || SS_RATE), 0);
  const base = t.hardware + t.labor + extrasTotal + tm;
  const markup = base * ((est.markup ?? 32) / 100);
  const discount = est.discount || 0;
  const taxable = base + markup - discount;
  const tax = taxable * ((est.tax ?? 8.25) / 100);
  return { ...t, extras, extrasTotal, tm, base, markup, discount, tax, total: Math.round(taxable + tax), status: est.status || 'draft' };
}
const SV_EST_STATUSES = ['draft', 'sent', 'approved', 'rejected'];
const svStatusColor = s => ({ draft: '#94A3B8', sent: '#3FA9F5', approved: '#34D399', rejected: '#F43F5E' }[s] || '#94A3B8');

/* ── One-time seed: enrich the demo project with Survey Scan fields ── */
(() => {
  const list = siteScanStore.get();
  if (!Array.isArray(list)) return;
  const p = list.find(x => x.id === 'SS-1201');
  if (!p || p.svSeeded) return;
  const f1 = p.floors[0];
  f1.readings = f1.readings || [
    { id: 'rd1', x: 14, y: 10, kind: 'wifi', val: -58, label: 'Lobby center' },
    { id: 'rd2', x: 38, y: 18, kind: 'link', val: 941, label: 'IT closet drop' },
    { id: 'rd3', x: 58, y: 7,  kind: 'wifi', val: -74, label: 'Manager office — weak' },
    { id: 'rd4', x: 40, y: 20, kind: 'poe',  val: 128, label: 'Head-end switch headroom' },
    { id: 'rd5', x: 6,  y: 19, kind: 'lte',  val: -88, label: 'Cell backup check' },
  ];
  f1.issues = f1.issues || [
    { id: 'is1', x: 60, y: 3,  sev: 'high', room: 'Manager Office', title: 'Wi-Fi dead spot at proposed camera', note: 'RSSI -74 dBm — needs hardwire or AP add' },
    { id: 'is2', x: 31, y: 15, sev: 'med',  room: 'IT Closet',      title: 'No spare breaker in panel',          note: 'Electrician needed for dedicated circuit' },
    { id: 'is3', x: 4,  y: 3,  sev: 'low',  room: 'Lobby',          title: 'Decorative ceiling — confirm mount', note: 'Customer wants recessed dome, verify plenum' },
  ];
  f1.zones = f1.zones || [
    { id: 'z1', type: 'camera', label: 'CAM-01 FOV',  poly: [[15, 11], [4, 0], [26, 0]] },
    { id: 'z2', type: 'camera', label: 'CAM-02 FOV',  poly: [[41, 7], [32, 0], [50, 0]] },
    { id: 'z3', type: 'motion', label: 'PIR-01 range', poly: [[2, 2], [16, 2], [16, 14], [2, 14]] },
    { id: 'z4', type: 'gap',    label: 'Uncovered — teller rear', poly: [[44, 8], [52, 8], [52, 14], [44, 14]] },
  ];
  (f1.photos || []).forEach(ph => { ph.kind = ph.kind || 'photo'; });
  f1.photos = [...(f1.photos || []),
    { id: 'p3', x: 8,  y: 11, kind: '360',   label: 'Lobby — 360° panorama',      hue: 200 },
    { id: 'p4', x: 36, y: 19, kind: '360',   label: 'IT closet — 360° panorama',  hue: 260 },
    { id: 'p5', x: 55, y: 6,  kind: 'video', label: 'Ceiling path walkthrough',   hue: 30, dur: '0:42' },
  ];
  p.checklists = p.checklists || [
    { id: 'cl1', tpl: 'tpl-head', name: 'Head-end room audit', kind: 'Checklist', room: 'IT Closet', items: [
      { t: 'Rack space ≥ 8U free', done: true }, { t: 'Dedicated circuit available', done: false },
      { t: 'UPS present & tested', done: true }, { t: 'Patch panel labeled', done: true },
      { t: 'HVAC / ventilation OK', done: true }, { t: 'Conduit path to riser', done: false }] },
  ];
  p.estimate = p.estimate || { status: 'draft', markup: 32, tax: 8.25, discount: 0,
    extras: [{ id: 'x1', desc: 'Scissor lift rental — 2 days', qty: 1, unit: 380 }, { id: 'x2', desc: 'EMT conduit + fittings (lobby run)', qty: 120, unit: 2.1 }],
    tm: [{ id: 'tm1', desc: 'Network closet cleanup (T&M)', hrs: 3, rate: 145 }],
    scope: [
      { room: 'Lobby', tasks: ['Install 2× dome cameras at marked positions', 'Replace entry keypad with HS2LCD', 'Run 3× CAT6A home runs to IT closet'] },
      { room: 'IT Closet', tasks: ['Mount NVR + 2-door controller in rack', 'Terminate & label all runs', 'Commission PoE switch — verify budget'] },
      { room: 'Manager Office', tasks: ['Install access reader at door', 'Resolve Wi-Fi dead spot (hardwire)'] },
    ] };
  p.sync = p.sync || [
    { t: 'Floor plan + 4 rooms synced to Survey Cloud', time: '9:41 AM', who: 'Mike Reyes', dir: 'up' },
    { t: 'Office added note on CAM-02 placement',       time: '9:52 AM', who: 'Sarah Chen', dir: 'down' },
    { t: '5 photos · 2 panoramas uploaded',             time: '10:04 AM', who: 'Mike Reyes', dir: 'up' },
    { t: 'Estimate draft opened for office review',     time: '10:12 AM', who: 'Sarah Chen', dir: 'down' },
  ];
  p.aiNotes = p.aiNotes || [];
  p.svSeeded = true;
  siteScanStore.set([...list]);
})();

/* ── Default the bottom tab bar to include Survey Scan (one-time migration) ── */
(() => {
  const c = mobileTabsStore.get();
  if (!c || !Array.isArray(c.tabs)) return;
  if (c.tabs.some(t => t.id === 'sitescan')) return;
  if (c.tabs.length >= c.maxTabs - 1) return; /* user filled their slots — don't override */
  mobileTabsStore.set({ ...c, tabs: [...c.tabs, { id: 'sitescan', icon: 'floorplan', label: 'Survey' }] });
})();

Object.assign(window, { surveyPrefsStore, SV_READINGS, svReading, SV_SEV, SV_ZONES, svZone, SV_TEMPLATES, svRoomQty, svEstimate, SV_EST_STATUSES, svStatusColor });

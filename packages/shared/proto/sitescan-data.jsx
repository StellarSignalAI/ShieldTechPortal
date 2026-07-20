/* ShieldTech Mobile — SiteScan: MagicPlan-style survey generator.
   Data model, device palette (generic symbol → price book SKU), geometry helpers, stores. */

/* ── Preferences (bound to the Tweaks panel) ── */
const ssPrefsStore = createShieldStore('ssprefs', { theme: 'dark', icons: 'glyph', scanSpeed: 1, vrSpeed: 1, vrFov: 70 });

/* ── Device palette: generic plan symbols mapped to Price Book SKUs ── */
const SS_DEVICES = [
  { type: 'dome',    label: 'Dome Camera',    glyph: 'M12 4a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8Zm0 4a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4Z', letter: 'D', color: '#3FA9F5', sku: 'P3245-V',   desc: 'Axis P3245-V Indoor Dome',        unit: 285,  hrs: 1.5 },
  { type: 'bullet',  label: 'Bullet Camera',  glyph: 'M4 10h12l4 2-4 2H4a2 2 0 0 1 0-4Zm2 6v3M14 16v3', letter: 'B', color: '#38BDF8', sku: 'P1468-LE',  desc: 'Axis P1468-LE Outdoor Bullet 4K', unit: 412,  hrs: 2 },
  { type: 'ptz',     label: 'PTZ Camera',     glyph: 'M12 3a6 6 0 0 1 6 6c0 4-6 12-6 12S6 13 6 9a6 6 0 0 1 6-6Zm0 3.5A2.5 2.5 0 1 0 12 11a2.5 2.5 0 0 0 0-5Z', letter: 'P', color: '#818CF8', sku: 'Q6135-LE',  desc: 'Axis Q6135-LE PTZ 32x',           unit: 2890, hrs: 2.5 },
  { type: 'reader',  label: 'Access Reader',  glyph: 'M7 3h10v18H7zM9 6h6M9 9h6M12 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', letter: 'R', color: '#34D399', sku: 'RP40',      desc: 'HID RP40 Multi-Tech Reader',      unit: 165,  hrs: 1 },
  { type: 'contact', label: 'Door Contact',   glyph: 'M5 4h6v16H5zM13 8h6v8h-6z', letter: 'C', color: '#4ADE80', sku: 'DC-101',    desc: 'Recessed Door Contact',           unit: 28,   hrs: 0.5 },
  { type: 'motion',  label: 'Motion Sensor',  glyph: 'M12 4 4 20h16L12 4Zm0 5 4.5 9h-9L12 9Z', letter: 'M', color: '#FBBF24', sku: 'LC-104',    desc: 'DSC LC-104 PIR Motion',           unit: 46,   hrs: 0.75 },
  { type: 'keypad',  label: 'Alarm Keypad',   glyph: 'M5 4h14v16H5zM8 8h2v2H8zM11 8h2v2h-2zM14 8h2v2h-2zM8 12h2v2H8zM11 12h2v2h-2zM14 12h2v2h-2z', letter: 'K', color: '#F59E0B', sku: 'HS2LCD',    desc: 'DSC HS2LCD Keypad',               unit: 118,  hrs: 0.75 },
  { type: 'panel',   label: 'Control Panel',  glyph: 'M4 5h16v14H4zM7 9h10M7 12h10M7 15h6', letter: 'CP', color: '#F43F5E', sku: 'LP4502',    desc: 'Mercury LP4502 2-Door Controller',unit: 1300, hrs: 3 },
  { type: 'nvr',     label: 'NVR / Recorder', glyph: 'M3 8h18v8H3zM6 12h.01M9 12h.01M15 11h3v2h-3z', letter: 'N', color: '#c084fc', sku: 'XNR-6410',  desc: 'Hanwha XNR-6410 32ch NVR',        unit: 1960, hrs: 2 },
];
const ssDev = t => SS_DEVICES.find(d => d.type === t) || SS_DEVICES[0];

/* ── Documented-reality object library (RoomPlan-style auto-detected obstructions) ── */
const SS_OBJECTS = [
  { type: 'counter',   label: 'Counter',        cat: 'furniture',  color: '#94A3B8', zh: 3 },
  { type: 'cabinet',   label: 'Cabinet',        cat: 'furniture',  color: '#94A3B8', zh: 3 },
  { type: 'desk',      label: 'Desk',           cat: 'furniture',  color: '#94A3B8', zh: 2.5 },
  { type: 'table',     label: 'Table',          cat: 'furniture',  color: '#94A3B8', zh: 2.5 },
  { type: 'couch',     label: 'Couch',          cat: 'furniture',  color: '#94A3B8', zh: 2.2 },
  { type: 'shelf',     label: 'Shelving',       cat: 'furniture',  color: '#94A3B8', zh: 6 },
  { type: 'rack',      label: 'Equipment rack', cat: 'appliance',  color: '#c084fc', zh: 6 },
  { type: 'appliance', label: 'Appliance',      cat: 'appliance',  color: '#c084fc', zh: 4 },
  { type: 'sink',      label: 'Sink',           cat: 'plumbing',   color: '#38BDF8', zh: 2.8 },
  { type: 'wc',        label: 'Toilet',         cat: 'plumbing',   color: '#38BDF8', zh: 1.5 },
  { type: 'outlet',    label: 'Outlet',         cat: 'electrical', color: '#FBBF24', zh: 1.2 },
  { type: 'radiator',  label: 'Radiator',       cat: 'appliance',  color: '#c084fc', zh: 2 },
];
const ssObj = t => SS_OBJECTS.find(o => o.type === t) || SS_OBJECTS[0];
const SS_OBJ_CATS = ['furniture', 'appliance', 'plumbing', 'electrical'];
const SS_CABLE_PER_FT = 0.28;   /* CAT6A plenum $/ft */
const SS_RATE = typeof SURVEY_RATE !== 'undefined' ? SURVEY_RATE : 145;

/* ── Geometry helpers (plan units = feet) ── */
const ssArea = poly => Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const ssPerim = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
const ssCentroid = poly => [poly.reduce((a, p) => a + p[0], 0) / poly.length, poly.reduce((a, p) => a + p[1], 0) / poly.length];
const ssEdges = poly => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
const ssPtOnEdge = (poly, edge, t) => { const [a, b] = ssEdges(poly)[edge]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
const ssPolyLen = pts => pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
const ssBounds = rooms => {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  rooms.forEach(r => r.poly.forEach(p => { x1 = Math.min(x1, p[0]); y1 = Math.min(y1, p[1]); x2 = Math.max(x2, p[0]); y2 = Math.max(y2, p[1]); }));
  return rooms.length ? { x1, y1, x2, y2 } : { x1: 0, y1: 0, x2: 40, y2: 30 };
};
const ssFt = n => `${Math.round(n * 10) / 10}′`;
const ssId = pfx => pfx + '-' + Math.random().toString(36).slice(2, 7);

/* Cable footage incl. 15% service loop + riser */
const ssCableFt = floor => Math.round((floor.cables || []).reduce((a, c) => a + ssPolyLen(c.pts), 0) * 1.15);

/* ── Derive a BOM from placed devices + cable runs across all floors ── */
function ssBom(project) {
  const counts = {};
  let cableFt = 0;
  project.floors.forEach(f => {
    (f.devices || []).forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    cableFt += ssCableFt(f);
  });
  const bom = Object.entries(counts).map(([type, qty]) => { const d = ssDev(type); return { sku: d.sku, desc: d.desc, qty, unit: d.unit, hrs: d.hrs }; });
  if (cableFt > 0) bom.push({ sku: 'CAT6A-1K', desc: `CAT6A Plenum (${cableFt} ft runs)`, qty: Math.max(1, Math.ceil(cableFt / 1000)), unit: 280, hrs: Math.round(cableFt / 100) / 4 });
  return bom;
}
function ssTotals(project) {
  const bom = ssBom(project);
  const hardware = bom.reduce((a, b) => a + b.qty * b.unit, 0);
  const laborHrs = bom.reduce((a, b) => a + b.qty * b.hrs, 0);
  const labor = Math.round(laborHrs * SS_RATE);
  const rooms = project.floors.reduce((a, f) => a + f.rooms.length, 0);
  const area = Math.round(project.floors.reduce((a, f) => a + f.rooms.reduce((s, r) => s + ssArea(r.poly), 0), 0));
  const devices = project.floors.reduce((a, f) => a + (f.devices || []).length, 0);
  const cableFt = project.floors.reduce((a, f) => a + ssCableFt(f), 0);
  return { bom, hardware, laborHrs, labor, cost: hardware + labor, rooms, area, devices, cableFt };
}

/* Offset for the next captured room: right of everything with a 4ft gap */
function ssNextOffset(floor) {
  if (!floor.rooms.length) return [0, 0];
  const b = ssBounds(floor.rooms);
  return [b.x2 + 4, b.y1];
}

/* ── SiteScan project store (persistent, syncs like every Shield store) ── */
const siteScanStore = createShieldStore('sitescans', [{
  id: 'SS-1201', customer: 'Metro Bank Corp', site: '425 Market St', created: 'Jul 2', status: 'in-progress', pushed: [], projectLink: null,
  floors: [
    { id: 'F1', label: 'Ground Floor',
      rooms: [
        { id: 'r1', name: 'Lobby',          mode: 'auto',   h: 10.5, poly: [[0, 0], [30, 0], [30, 22], [0, 22]] },
        { id: 'r2', name: 'Teller Line',    mode: 'corner', h: 10.5, poly: [[30, 0], [52, 0], [52, 14], [30, 14]] },
        { id: 'r3', name: 'IT Closet',      mode: 'corner', h: 9,    poly: [[30, 14], [42, 14], [42, 22], [30, 22]] },
        { id: 'r4', name: 'Manager Office', mode: 'auto',   h: 9,    poly: [[52, 0], [66, 0], [66, 14], [52, 14]] },
      ],
      doors: [
        { id: 'd1', room: 'r1', edge: 2, t: 0.5,  w: 6, kind: 'door',   label: 'Main entrance' },
        { id: 'd2', room: 'r1', edge: 1, t: 0.3,  w: 4, kind: 'door',   label: 'Lobby → Teller' },
        { id: 'd3', room: 'r3', edge: 3, t: 0.5,  w: 3, kind: 'door',   label: 'IT closet' },
        { id: 'd4', room: 'r4', edge: 3, t: 0.5,  w: 3, kind: 'door',   label: 'Office' },
        { id: 'd5', room: 'r1', edge: 0, t: 0.35, w: 8, kind: 'window', label: 'Storefront glazing' },
        { id: 'd6', room: 'r4', edge: 0, t: 0.5,  w: 5, kind: 'window', label: 'Office window' },
      ],
      devices: [
        { id: 'v1', type: 'dome',   x: 15, y: 11, z: 9,   label: 'CAM-01' },
        { id: 'v2', type: 'dome',   x: 41, y: 7,  z: 9,   label: 'CAM-02' },
        { id: 'v3', type: 'bullet', x: 15, y: 21, z: 10,  label: 'CAM-03' },
        { id: 'v4', type: 'reader', x: 55, y: 13.6, z: 4.5, label: 'ACR-01' },
        { id: 'v5', type: 'motion', x: 2,  y: 2,  z: 8,   label: 'PIR-01' },
        { id: 'v6', type: 'panel',  x: 32, y: 20, z: 5,   label: 'CP-01' },
        { id: 'v7', type: 'nvr',    x: 39, y: 20, z: 4,   label: 'NVR-01' },
        { id: 'v8', type: 'keypad', x: 12, y: 21.4, z: 4.5, label: 'KP-01' },
      ],
      cables: [
        { id: 'c1', pts: [[15, 11], [15, 16], [33, 16], [36, 20]], type: 'cat6a' },
        { id: 'c2', pts: [[41, 7], [41, 13], [39, 16], [38, 20]], type: 'cat6a' },
        { id: 'c3', pts: [[15, 21], [16, 17], [33, 17], [36, 20.4]], type: 'cat6a' },
      ],
      photos: [
        { id: 'p1', x: 15, y: 20, label: 'Entrance — existing keypad', hue: 210 },
        { id: 'p2', x: 37, y: 19, label: 'IT closet rack — 12U free', hue: 150 },
      ],
      objects: [
        { id: 'o1', type: 'counter',  x: 31, y: 2,  w: 3,   h: 10,  conf: 94 },
        { id: 'o2', type: 'desk',     x: 55, y: 3,  w: 6,   h: 2.5, conf: 91 },
        { id: 'o3', type: 'couch',    x: 3,  y: 15, w: 7,   h: 3,   conf: 88 },
        { id: 'o4', type: 'rack',     x: 38, y: 19, w: 2.5, h: 2.5, conf: 96 },
        { id: 'o5', type: 'cabinet',  x: 43, y: 1,  w: 6,   h: 2,   conf: 85 },
        { id: 'o6', type: 'outlet',   x: 29.4, y: 8, w: 0.8, h: 0.8, conf: 97 },
      ],
    },
    { id: 'F2', label: 'Second Floor',
      rooms: [{ id: 'r5', name: 'Open Office', mode: 'auto', h: 9, poly: [[0, 0], [36, 0], [36, 24], [0, 24]] }],
      doors: [{ id: 'd7', room: 'r5', edge: 3, t: 0.2, w: 4, kind: 'door', label: 'Stairwell' }],
      devices: [{ id: 'v9', type: 'dome', x: 12, y: 12, z: 9, label: 'CAM-04' }, { id: 'v10', type: 'dome', x: 27, y: 12, z: 9, label: 'CAM-05' }],
      cables: [], photos: [],
      objects: [{ id: 'o7', type: 'desk', x: 4, y: 4, w: 6, h: 2.5, conf: 90 }, { id: 'o8', type: 'desk', x: 4, y: 10, w: 6, h: 2.5, conf: 89 }, { id: 'o9', type: 'table', x: 24, y: 16, w: 8, h: 4, conf: 86 }],
    },
  ],
}]);

/* Blueprint push inbox → surfaces in Design Studio (shared-state exports studioInboxStore) */

Object.assign(window, { ssPrefsStore, SS_DEVICES, ssDev, SS_OBJECTS, ssObj, SS_OBJ_CATS, SS_CABLE_PER_FT, SS_RATE, ssArea, ssPerim, ssCentroid, ssEdges, ssPtOnEdge, ssPolyLen, ssBounds, ssFt, ssId, ssCableFt, ssBom, ssTotals, ssNextOffset, siteScanStore });

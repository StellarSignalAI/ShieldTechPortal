/* LiDAR scan import — turns an Apple RoomPlan capture (JSON exported by the
   ShieldTech Scanner iOS app in apps/scanner-ios/, or AirDropped from it) into
   a full Survey Scan project: real walls, ceiling height, doors, windows and
   furniture with true measured dimensions. window.__shieldLidar.importScan(). */

const M2FT = 3.28084;
const CAT_MAP = {
  storage: 'cabinet', refrigerator: 'cabinet', oven: 'cabinet', dishwasher: 'cabinet',
  table: 'counter', sink: 'counter', washerDryer: 'cabinet', toilet: 'cabinet',
  bathtub: 'counter', bed: 'couch', sofa: 'couch', chair: 'desk', stairs: 'cabinet',
  television: 'display', fireplace: 'cabinet',
};

function ft(n) { return Math.round(n * M2FT * 2) / 2; }

/* RoomPlan CapturedRoom JSON → SiteScan project record */
export function convertRoomPlan(cap, { customer = 'Imported scan', site = 'LiDAR capture', name = 'Scanned Room' } = {}) {
  const walls = cap.walls || [];
  const objects = cap.objects || [];
  const doors = cap.doors || [];
  const windows = cap.windows || [];

  // Room footprint from wall extents (RoomPlan transforms: position at columns[3])
  const posOf = (w) => {
    const t = w.transform;
    if (Array.isArray(t) && t.length === 16) return { x: t[12], z: t[14] };
    if (t && t.columns) return { x: t.columns[3][0], z: t.columns[3][2] };
    return { x: 0, z: 0 };
  };
  const dims = (w) => Array.isArray(w.dimensions) ? { w: w.dimensions[0], h: w.dimensions[1] } : (w.dimensions || { w: 3, h: 2.4 });

  const xs = walls.map(w => posOf(w).x), zs = walls.map(w => posOf(w).z);
  const spanX = walls.length ? Math.max(...xs) - Math.min(...xs) + Math.max(...walls.map(w => dims(w).w)) / 2 : 4;
  const spanZ = walls.length ? Math.max(...zs) - Math.min(...zs) + Math.max(...walls.map(w => dims(w).w)) / 2 : 3;
  const W = Math.max(6, ft(spanX)), D = Math.max(6, ft(spanZ));
  const H = walls.length ? Math.max(...walls.map(w => ft(dims(w).h))) : 8;
  const minX = xs.length ? Math.min(...xs) : 0, minZ = zs.length ? Math.min(...zs) : 0;

  const rid = 'r' + Date.now();
  const room = { id: rid, name, mode: 'lidar', h: H, poly: [[1, 1], [1 + W, 1], [1 + W, 1 + D], [1, 1 + D]] };

  const toLocal = (o) => {
    const p = posOf(o);
    return { x: Math.max(1, 1 + ft(p.x - minX)), y: Math.max(1, 1 + ft(p.z - minZ)) };
  };
  const objRecords = objects.map(o => {
    const d = dims(o);
    const { x, y } = toLocal(o);
    const cat = (o.category || '').replace(/^RoomPlan\./, '');
    return { id: 'o' + Math.random().toString(36).slice(2, 8), type: CAT_MAP[cat] || 'cabinet', w: Math.max(1, ft(d.w)), h: Math.max(1, ft(Array.isArray(o.dimensions) ? o.dimensions[2] : 1)), x, y, conf: Math.round((o.confidence ?? 0.9) * 100), label: cat || 'object' };
  });
  const openings = [
    ...doors.map(d => ({ ...toLocal(d), w: ft(dims(d).w) || 3, kind: 'door', room: rid, label: 'Doorway' })),
    ...windows.map(w => ({ ...toLocal(w), w: ft(dims(w).w) || 3, kind: 'window', room: rid, label: 'Window' })),
  ].map(d => ({ ...d, id: 'd' + Math.random().toString(36).slice(2, 8) }));

  return {
    id: 'SS-' + (Math.floor(Math.random() * 800) + 2100),
    customer, site,
    created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: 'in-progress', pushed: [], projectLink: null, source: 'lidar',
    floors: [{ id: 'F1', label: 'Scanned Floor', rooms: [room], doors: openings, devices: [], cables: [], photos: [], objects: objRecords }],
  };
}

export function importScan(jsonText, meta) {
  let cap;
  try { cap = JSON.parse(jsonText); } catch { return { ok: false, error: 'Not a valid scan file' }; }
  const store = window.__shieldStores && window.__shieldStores.sitescans;
  if (!store) return { ok: false, error: 'Survey store not loaded' };
  const customer = (meta && meta.customer) || cap.customer || 'Imported scan';
  const site = (meta && meta.site) || cap.site || 'LiDAR capture';

  // Multi-room envelope from the ShieldTech Scanner app: one project, many rooms.
  if (Array.isArray(cap.rooms) && cap.rooms.length) {
    const rooms = [], doors = [], objects = [];
    cap.rooms.forEach((r, i) => {
      const cr = r.capturedRoom || r;
      if (!cr.walls && !cr.objects) return;
      const proj = convertRoomPlan(cr, { customer, site, name: r.name || `Room ${i + 1}` });
      const f = proj.floors[0];
      f.rooms.forEach((rm, k) => { if (i > 0) { rm.poly = rm.poly.map(p2 => [p2[0] + i * 2, p2[1]]); } rooms.push(rm); });
      (f.doors || []).forEach(d => doors.push(d));
      (f.objects || []).forEach(o => objects.push(o));
    });
    if (!rooms.length) return { ok: false, error: 'No rooms with geometry in this scan' };
    const project = {
      id: 'SS-' + (Math.floor(Math.random() * 800) + 2100),
      customer, site, created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'in-progress', pushed: [], projectLink: null, source: 'lidar',
      floors: [{ id: 'F1', label: 'Scanned Floor', rooms, doors, devices: [], cables: [], photos: [], objects }],
    };
    store.set(list => [project, ...list]);
    return { ok: true, data: project, rooms: rooms.length };
  }

  // Single-room: bare CapturedRoom or {capturedRoom} wrapper.
  const room = cap.capturedRoom || cap;
  if (!room.walls && !room.objects) return { ok: false, error: 'No walls or objects in this scan — expected a RoomPlan export' };
  const project = convertRoomPlan(room, { ...(meta || {}), customer, site });
  store.set(list => [project, ...list]);
  return { ok: true, data: project };
}

window.__shieldLidar = { importScan, convertRoomPlan };

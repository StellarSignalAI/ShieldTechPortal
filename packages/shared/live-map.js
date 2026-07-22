/* Real street map (dark mode) for Fleet & dispatch — Leaflet + free CARTO dark
   tiles, no API key. window.__shieldLiveMap.mount(el) returns an updater. */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; OpenStreetMap &copy; CARTO';

export function mountLiveMap(el, { center = [39.95, -75.16], zoom = 12 } = {}) {
  const map = L.map(el, { zoomControl: false, attributionControl: true });
  map.setView(center, zoom);
  L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19, subdomains: 'abcd' }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const markers = {};
  const trails = {};

  function update(techs) {
    const pts = [];
    Object.entries(techs || {}).forEach(([id, t]) => {
      if (t.lat == null || t.lng == null) return;
      pts.push([t.lat, t.lng]);
      const stale = Date.now() - (t.updatedAt || 0) > 5 * 60 * 1000;
      const color = !t.onDuty ? '#5c6f86' : stale ? '#FBBF24' : '#34D399';
      const html = `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:30px;height:30px;border-radius:50%;background:rgba(4,10,16,0.9);border:2px solid ${color};box-shadow:0 0 12px ${color}66;display:flex;align-items:center;justify-content:center;font:700 10px/1 system-ui;color:#fff">${id.slice(0, 2)}</div>
        <div style="padding:1px 6px;border-radius:6px;background:rgba(4,10,16,0.85);font:600 8px/1.4 system-ui;color:${color};white-space:nowrap">${(t.name || id).split(' ')[0]} · ${t.status || ''}</div></div>`;
      if (!markers[id]) {
        markers[id] = L.marker([t.lat, t.lng], { icon: L.divIcon({ html, className: '', iconSize: [60, 44], iconAnchor: [30, 22] }) }).addTo(map);
      } else {
        markers[id].setLatLng([t.lat, t.lng]);
        markers[id].setIcon(L.divIcon({ html, className: '', iconSize: [60, 44], iconAnchor: [30, 22] }));
      }
      const tr = (t.trail || []).filter(p => p.lat != null).map(p => [p.lat, p.lng]);
      if (tr.length > 1) {
        if (trails[id]) trails[id].setLatLngs(tr);
        else trails[id] = L.polyline(tr, { color, weight: 2, opacity: 0.45, dashArray: '4 5' }).addTo(map);
      }
    });
    return pts;
  }

  return {
    update,
    fit(techs) { const pts = update(techs); if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 15 }); },
    destroy() { map.remove(); },
    map,
  };
}

window.__shieldLiveMap = { mount: mountLiveMap };

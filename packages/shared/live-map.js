/* Real street map for Fleet, dispatch, the tech app's day map and every
   location card — Leaflet with key-free tiles.

   Tiles: OpenStreetMap's standard tiles (no API key, full zoom). The old CARTO
   basemap started requiring an API key and stamps "Missing API Key" on every
   tile served without one, which is what the tech app was showing. In the dark
   theme the tiles are darkened with a CSS filter so the map matches the app;
   the light theme shows them as-is. If a tile host fails (blocked network,
   outage) the layer falls back to Esri's World Street Map, also key-free.

   window.__shieldLiveMap.mount(el, { center, zoom }) returns an updater. */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILES_FALLBACK = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ATTR_FALLBACK = 'Tiles &copy; Esri';

/* Dark-theme tile treatment + map chrome, injected once. */
(function injectMapStyles() {
  if (typeof document === 'undefined' || document.getElementById('st-live-map-css')) return;
  const s = document.createElement('style');
  s.id = 'st-live-map-css';
  s.textContent = `
    .leaflet-container { background: var(--canvas, #0b1420); font-family: var(--font-body, system-ui); }
    html:not([data-theme="light"]) .leaflet-layer.st-tiles { filter: invert(1) hue-rotate(195deg) brightness(0.86) contrast(0.9) saturate(0.6); }
    html:not([data-theme="light"]) .leaflet-container .leaflet-control-attribution { background: rgba(10,14,20,0.75); color: #8ea0b5; }
    html:not([data-theme="light"]) .leaflet-container .leaflet-control-attribution a { color: #9cc7f0; }
    .leaflet-control-attribution { font-size: 9px; }
  `;
  document.head.appendChild(s);
})();

function tileLayer() {
  const layer = L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19, className: 'st-tiles', crossOrigin: true });
  let errors = 0, swapped = false;
  layer.on('tileerror', () => {
    errors += 1;
    if (!swapped && errors >= 3) {
      swapped = true;
      layer.options.maxZoom = 18;
      layer.setUrl(TILES_FALLBACK);
      try { layer._map && layer._map.attributionControl && layer._map.attributionControl.removeAttribution(ATTR).addAttribution(ATTR_FALLBACK); } catch { /* noop */ }
    }
  });
  layer.on('load', () => { errors = 0; });
  return layer;
}

export function mountLiveMap(el, { center = [39.95, -75.16], zoom = 12 } = {}) {
  const map = L.map(el, { zoomControl: false, attributionControl: true });
  map.setView(center, zoom);
  tileLayer().addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const markers = {};
  const trails = {};

  function update(techs) {
    const pts = [];
    Object.entries(techs || {}).forEach(([id, t]) => {
      if (t.lat == null || t.lng == null) return;
      pts.push([t.lat, t.lng]);
      const stale = Date.now() - (t.updatedAt || 0) > 5 * 60 * 1000;
      const color = !t.onDuty ? '#5c6f86' : stale ? '#FFB020' : '#27E39A';
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

/* `L` is exposed so vendored screens can drop their own pins on a mounted map. */
window.__shieldLiveMap = { mount: mountLiveMap, L, tiles: TILES };

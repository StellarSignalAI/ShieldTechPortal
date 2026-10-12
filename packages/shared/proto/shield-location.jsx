/* Location + directions — shared by the portal (desktop + phone), tech,
   customer and sales apps.

   shieldDirections({ address, lat, lng, label }) opens the directions sheet:
   Apple Maps (iPhone / iPad / Mac), Google Maps (everywhere), the phone's
   default maps app on Android (geo: intent), Waze, and Copy address — every
   option a real link the OS hands to the installed app, so it works on both
   Android and iPhone from the browser and from the installed app.

   <ShieldLocationCard> is the "where is this job" block for a project / work
   order / job: a pinned map (Leaflet + CARTO tiles where the app bundles the
   live map, Google Static Maps when VITE_GOOGLE_MAPS_KEY is set, otherwise a
   plain address block), the address, and Directions / Copy. Addresses without
   a pin are geocoded once (OpenStreetMap Nominatim via window.__shieldGeocode)
   and the pin is saved back through onPin. */

const slFont = { fontFamily: 'var(--font-body)' };
function slPlatform() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const mac = !iOS && /Macintosh/.test(ua);
  const android = /Android/.test(ua);
  return { iOS, mac, android, mobile: iOS || android };
}
function slDest(o) {
  const addr = String((o && o.address) || '').trim();
  const lat = Number(o && o.lat), lng = Number(o && o.lng);
  const hasPt = o && o.lat != null && o.lng != null && !isNaN(lat) && !isNaN(lng);
  return { addr, hasPt, lat, lng, q: encodeURIComponent(addr || (hasPt ? `${lat},${lng}` : '')), ll: hasPt ? `${lat},${lng}` : '' };
}
function slLinks(o) {
  const d = slDest(o);
  return {
    apple: `https://maps.apple.com/?daddr=${d.q}${d.ll ? '&ll=' + d.ll : ''}&dirflg=d`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${d.addr ? d.q : d.ll}&travelmode=driving`,
    geo: `geo:${d.ll || '0,0'}?q=${d.q}`,
    waze: `https://waze.com/ul?${d.ll ? 'll=' + d.ll : 'q=' + d.q}&navigate=yes`,
    view: d.hasPt ? `https://www.google.com/maps/search/?api=1&query=${d.ll}` : `https://www.google.com/maps/search/?api=1&query=${d.q}`,
  };
}
function slOpen(url) {
  const p = slPlatform();
  /* Phones: a same-window navigation is what hands a universal link / geo:
     intent to the installed app (window.open gets blocked or stays in-browser
     inside installed web apps). Desktops open a tab. */
  if (p.mobile || url.startsWith('geo:')) { window.location.href = url; return; }
  window.open(url, '_blank', 'noopener');
}
async function slCopy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try { const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(t); t.focus(); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; }
    catch { return false; }
  }
}
function shieldDirections(o) {
  const d = slDest(o);
  if (!d.addr && !d.hasPt) { if (window.shieldToast) shieldToast('No address on file for this location', 'warn'); return; }
  window.dispatchEvent(new CustomEvent('shield:directions', { detail: { ...o } }));
}

function ShieldDirectionsHost() {
  const [o, setO] = React.useState(null);
  React.useEffect(() => { const h = (e) => setO(e.detail || null); window.addEventListener('shield:directions', h); return () => window.removeEventListener('shield:directions', h); }, []);
  React.useEffect(() => { if (!o) return; const k = (e) => { if (e.key === 'Escape') setO(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [o]);
  if (!o) return null;
  const d = slDest(o), links = slLinks(o), p = slPlatform();
  const close = () => setO(null);
  const go = (url) => { close(); slOpen(url); };
  const copy = async () => { const ok = await slCopy(d.addr || d.ll); if (window.shieldToast) shieldToast(ok ? 'Address copied' : 'Could not copy — long-press the address instead', ok ? 'ok' : 'warn'); if (ok) close(); };
  const row = (label, sub, fn, primary) => (
    <button key={label} onClick={fn} style={{ ...slFont, display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${primary ? 'var(--brand)' : 'var(--border-subtle)'}`, background: primary ? 'var(--brand)' : 'var(--card)', color: primary ? '#fff' : 'var(--text-high)', cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14.5, fontWeight: 700 }}>{label}</span>{sub && <span style={{ display: 'block', fontSize: 11.5, opacity: 0.8, marginTop: 1 }}>{sub}</span>}</span>
      <span style={{ fontSize: 16, opacity: 0.7 }}>›</span>
    </button>
  );
  const options = [];
  if (p.iOS || p.mac) options.push(row('Apple Maps', 'Turn-by-turn in the Maps app', () => go(links.apple), true));
  options.push(row('Google Maps', p.iOS || p.mac ? 'Opens the Google Maps app if installed' : 'Turn-by-turn in Google Maps', () => go(links.google), !(p.iOS || p.mac)));
  if (p.android) options.push(row('Default maps app', 'Let the phone pick (Maps, Waze, HERE…)', () => go(links.geo)));
  options.push(row('Waze', 'Live traffic routing', () => go(links.waze)));
  options.push(row('Copy address', d.addr || d.ll, copy));
  if (!p.mobile) options.push(row('View on map', 'Open the location without routing', () => go(links.view)));
  const sheet = (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: p.mobile ? 'flex-end' : 'center', justifyContent: 'center', padding: p.mobile ? 0 : 16 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" style={{ width: p.mobile ? '100%' : 420, maxWidth: p.mobile ? 430 : '100%', maxHeight: '86vh', overflow: 'auto', background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderBottom: p.mobile ? 'none' : undefined, borderRadius: p.mobile ? '18px 18px 0 0' : 12, boxShadow: '0 -16px 50px rgba(0,0,0,0.6)', padding: '14px 16px calc(16px + env(safe-area-inset-bottom, 0px))', animation: 'fade-up 0.2s ease both' }}>
        {p.mobile && <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.3)', margin: '0 auto 12px' }} />}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Directions</div>
            {o.label && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', marginTop: 4 }}>{o.label}</div>}
            <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 2, lineHeight: 1.45 }}>{d.addr || d.ll}</div>
          </div>
          <button onClick={close} style={{ ...slFont, background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{options}</div>
      </div>
    </div>
  );
  return (window.ReactDOM && window.ReactDOM.createPortal) ? window.ReactDOM.createPortal(sheet, document.body) : sheet;
}
(function mountShieldDirectionsHost() {
  if (typeof document === 'undefined' || !window.ReactDOM || !window.ReactDOM.createRoot) return;
  const go = () => { if (document.getElementById('shield-directions-host')) return; const el = document.createElement('div'); el.id = 'shield-directions-host'; document.body.appendChild(el); window.ReactDOM.createRoot(el).render(<ShieldDirectionsHost />); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

/* ── Pinned map + address + Directions / Copy ── */
function ShieldLocationCard({ address, lat, lng, label, sub, onPin, height = 160, style, flat }) {
  const d = slDest({ address, lat, lng });
  const elRef = React.useRef(null);
  const apiRef = React.useRef(null);
  const [pinning, setPinning] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const live = !!(window.__shieldLiveMap && window.__shieldLiveMap.mount);
  const gkey = window.__shieldMapsKey || '';

  // Leaflet pin where the live map is bundled (portal, tech).
  React.useEffect(() => {
    if (!live || !d.hasPt || !elRef.current) return;
    try {
      const api = window.__shieldLiveMap.mount(elRef.current, { center: [d.lat, d.lng], zoom: 15 });
      const L = window.__shieldLiveMap.L;
      L.marker([d.lat, d.lng], { icon: L.divIcon({ html: '<div style="width:16px;height:16px;border-radius:50%;background:#3FA9F5;border:3px solid #fff;box-shadow:0 0 0 5px rgba(63,169,245,0.35),0 4px 12px rgba(0,0,0,0.5)"></div>', className: '', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(api.map);
      apiRef.current = api;
      setTimeout(() => { try { api.map.invalidateSize(); } catch { /* noop */ } }, 60);
    } catch { /* leaflet not ready */ }
    return () => { try { apiRef.current && apiRef.current.destroy(); } catch { /* noop */ } apiRef.current = null; };
  }, [live, d.hasPt, d.lat, d.lng]);

  // Geocode once when we have an address but no pin, and hand the pin back.
  React.useEffect(() => {
    if (d.hasPt || !d.addr || !onPin || !window.__shieldGeocode || pinning || failed) return;
    setPinning(true);
    Promise.resolve(window.__shieldGeocode(d.addr)).then(pt => { setPinning(false); if (pt) onPin({ lat: pt[0], lng: pt[1], address: d.addr }); else setFailed(true); }).catch(() => { setPinning(false); setFailed(true); });
  }, [d.addr, d.hasPt]);

  const btn = (l, fn, primary) => <button onClick={fn} style={{ ...slFont, padding: '7px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${primary ? 'var(--brand)' : 'var(--border-strong)'}`, background: primary ? 'var(--brand)' : 'transparent', color: primary ? '#fff' : 'var(--text-high)', whiteSpace: 'nowrap' }}>{l}</button>;
  const staticUrl = !live && gkey && (d.hasPt || d.addr) ? `https://maps.googleapis.com/maps/api/staticmap?center=${d.hasPt ? d.ll : d.q}&zoom=15&size=640x320&scale=2&maptype=roadmap&markers=color:0x3FA9F5%7C${d.hasPt ? d.ll : d.q}&key=${encodeURIComponent(gkey)}` : null;
  const mapBody = live && d.hasPt
    ? <div ref={elRef} style={{ position: 'absolute', inset: 0, background: '#0b1420' }} />
    : staticUrl
      ? <img src={staticUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-low)', background: 'var(--canvas)' }}>{!d.addr && !d.hasPt ? 'No address on file' : pinning ? 'Pinning on the map…' : failed ? 'Could not pin this address — check it' : live ? 'Pin pending' : 'Open in Maps for the pin'}</div>;
  return (
    <div style={{ background: 'var(--card)', border: flat ? 'none' : '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', ...style }}>
      <div onClick={() => (d.addr || d.hasPt) && shieldDirections({ address: d.addr, lat: d.hasPt ? d.lat : undefined, lng: d.hasPt ? d.lng : undefined, label })} style={{ position: 'relative', height, cursor: d.addr || d.hasPt ? 'pointer' : 'default' }}>{mapBody}</div>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          {label && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)' }}>{label}</div>}
          <div style={{ fontSize: 12.5, color: d.addr ? 'var(--text-high)' : 'var(--text-low)', lineHeight: 1.4 }}>{d.addr || (d.hasPt ? d.ll : 'No address on file')}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>}
        </div>
        {(d.addr || d.hasPt) && <div style={{ display: 'flex', gap: 6 }}>
          {btn('Directions', () => shieldDirections({ address: d.addr, lat: d.hasPt ? d.lat : undefined, lng: d.hasPt ? d.lng : undefined, label }), true)}
          {btn('Copy', async () => { const ok = await slCopy(d.addr || d.ll); if (window.shieldToast) shieldToast(ok ? 'Address copied' : 'Could not copy', ok ? 'ok' : 'warn'); })}
        </div>}
      </div>
    </div>
  );
}

Object.assign(window, { shieldDirections, ShieldLocationCard, ShieldDirectionsHost, slLinks, slCopy });

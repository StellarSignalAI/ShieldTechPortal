/* BlueShield Studio — the exact standalone CAD/markup app (single-file build
   at /blueshield/app.html, served verbatim) embedded as a portal screen. All
   drawing/takeoff/markup logic lives inside the app itself; it signs into the
   same Supabase project (bs_* tables, ShieldTech accounts only). */
function PlanRoomScreen() {
  // Fill the shell's content area edge to edge. Desktop <main> pads 24px;
  // the mobile shell pads 14px and sizes with 100dvh — adapt so the iframe
  // fits the phone viewport with no horizontal or double scroll.
  const narrow = window.innerWidth < 900;
  const wrap = narrow
    ? { margin: -14, height: 'calc(100dvh - 160px)', overflow: 'hidden', display: 'flex' }
    : { margin: -24, height: 'calc(100% + 48px)', minHeight: 'calc(100vh - 120px)', display: 'flex' };
  return (
    <div style={wrap}>
      <iframe
        src="/blueshield/app.html"
        title="BlueShield Studio"
        allow="clipboard-read; clipboard-write; fullscreen"
        style={{ flex: 1, width: '100%', border: 'none', background: '#0b1220' }}
      />
    </div>
  );
}

Object.assign(window, { PlanRoomScreen });

/* BlueShield Studio — the exact standalone CAD/markup app (single-file build
   at /blueshield/app.html, served verbatim) embedded as a portal screen. All
   drawing/takeoff/markup logic lives inside the app itself; it signs into the
   same Supabase project (bs_* tables, ShieldTech accounts only). */
function PlanRoomScreen() {
  // Fill the shell's content area edge to edge (the <main> pads 24px).
  return (
    <div style={{ margin: -24, height: 'calc(100% + 48px)', minHeight: 'calc(100vh - 120px)', display: 'flex' }}>
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

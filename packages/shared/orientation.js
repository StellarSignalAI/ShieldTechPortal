/* Portrait-only phones. Three layers, best available wins:
   1. the web app manifests declare "orientation": "portrait" (installed app);
   2. screen.orientation.lock('portrait') where the platform allows it
      (Android, fullscreen / standalone);
   3. viewport-lock.css rotates the page back upright on platforms that ignore
      both (iOS Safari + iOS home-screen apps). This module tells the CSS which
      way the phone was turned via <html data-rot="ccw|cw">. */
(function () {
  const isPhone = () => Math.min(window.screen.width, window.screen.height) <= 520 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) <= 520);
  const angle = () => {
    if (typeof window.orientation === 'number') return window.orientation;          // iOS: 0, 90, -90, 180
    if (window.screen && window.screen.orientation) return window.screen.orientation.angle; // 0, 90, 180, 270
    return 0;
  };
  const apply = () => {
    const a = angle();
    const rot = a === 90 ? 'ccw' : (a === -90 || a === 270) ? 'cw' : '';
    if (rot && isPhone()) document.documentElement.setAttribute('data-rot', rot);
    else document.documentElement.removeAttribute('data-rot');
  };
  apply();
  window.addEventListener('orientationchange', () => { apply(); setTimeout(apply, 250); });
  window.addEventListener('resize', apply);
  if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) window.screen.orientation.addEventListener('change', apply);
  const lock = () => {
    try {
      if (!isPhone() || !window.screen || !window.screen.orientation || !window.screen.orientation.lock) return;
      const p = window.screen.orientation.lock('portrait');
      if (p && p.catch) p.catch(() => { /* not allowed outside fullscreen / standalone — the CSS fallback covers it */ });
    } catch { /* unsupported */ }
  };
  lock();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') lock(); });
  window.addEventListener('pointerdown', lock, { once: true });

  /* ── Viewport readout (shown under "build …" in the avatar menus) ──
     One line that says exactly how iOS sized this app, so a phone screenshot
     is never a guess: page viewport, physical screen, top/bottom safe-area
     insets, and whether it runs as a home-screen app or in the browser. An
     installed app whose viewport height is screen minus ~60 AND whose top
     inset is > 0 is the iOS 26 translucent-status-bar install (see
     viewport-lock.css): remove it from the home screen and add it again. */
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top, 0px);padding-bottom:env(safe-area-inset-bottom, 0px);visibility:hidden;pointer-events:none;z-index:-1';
  const insets = () => {
    try {
      if (!probe.isConnected) document.documentElement.appendChild(probe);
      const cs = getComputedStyle(probe);
      return { top: Math.round(parseFloat(cs.paddingTop) || 0), bottom: Math.round(parseFloat(cs.paddingBottom) || 0) };
    } catch { return { top: 0, bottom: 0 }; }
  };
  const standalone = () => { try { return navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch { return false; } };
  /* Every viewport number iOS exposes, so one screenshot of the avatar menu
     tells exactly how the web view was sized: layout viewport (innerHeight),
     visual viewport, document client height, 100lvh / 100dvh / 100svh probes,
     the physical screen, the safe-area insets, the OS version and whether
     this is a home-screen app or the browser. */
  const unitProbe = (unit) => {
    try {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;top:0;left:0;width:0;height:100${unit};visibility:hidden;pointer-events:none;z-index:-1`;
      document.documentElement.appendChild(d);
      const h = Math.round(d.getBoundingClientRect().height); d.remove(); return h;
    } catch { return 0; }
  };
  const osVersion = () => { const m = /OS (\d+)[_.](\d+)/.exec(navigator.userAgent || ''); return m ? `iOS ${m[1]}.${m[2]}` : (/Android (\d+)/.exec(navigator.userAgent || '') || [])[0] || ''; };
  window.__shieldViewportInfo = () => {
    const i = insets();
    const vv = window.visualViewport ? Math.round(window.visualViewport.height) : 0;
    return [
      `vp ${window.innerWidth}×${window.innerHeight}`,
      `visual ${vv}`,
      `doc ${document.documentElement.clientHeight}`,
      `lvh ${unitProbe('lvh')} · dvh ${unitProbe('dvh')} · svh ${unitProbe('svh')}`,
      `screen ${window.screen.width}×${window.screen.height}`,
      `inset ${i.top}/${i.bottom}`,
      osVersion(),
      standalone() ? 'home-screen app' : 'browser',
    ].filter(Boolean).join(' · ');
  };

  /* iOS home-screen apps can leave the layout viewport shrunk after the
     on-screen keyboard closes (a dead band appears under the tab bar for the
     rest of the session). Nudging a reflow right after focus leaves an input
     restores the full-height viewport. */
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      try {
        window.scrollTo(0, 0);
        const b = document.body; b.style.minHeight = '100.01%';
        requestAnimationFrame(() => { b.style.minHeight = ''; });
      } catch { /* noop */ }
    }, 80);
  });
})();

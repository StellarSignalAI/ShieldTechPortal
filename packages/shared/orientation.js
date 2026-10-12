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

  /* ── Short layout viewport (iOS 26 home-screen apps) ──
     Measures how far the layout viewport stops above the real screen bottom
     and hands it to viewport-lock.css as --st-vgap-js (see the comment there).
     Only ever non-zero for a standalone, portrait, phone-sized page that sits
     under the status bar (top safe-area inset > 0 — the translucent mode the
     bug lives in); an opaque status bar legitimately makes innerHeight shorter
     than the screen, so that case reports 0. Capped at 120px; skipped while a
     field has focus so a keyboard-shrunk viewport never counts as the gap. */
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top, 0px);visibility:hidden;pointer-events:none;z-index:-1';
  const topInset = () => { try { if (!probe.isConnected) document.documentElement.appendChild(probe); return probe.getBoundingClientRect().height || 0; } catch { return 0; } };
  const standalone = () => { try { return navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch { return false; } };
  const typing = () => { const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); };
  let lastGap = -1;
  const measureGap = () => {
    if (typing()) return; // keyboard up: keep the last value, never re-measure a shrunk viewport
    let gap = 0;
    try {
      const portrait = window.innerHeight >= window.innerWidth;
      if (standalone() && portrait && isPhone() && topInset() > 0) {
        const screenH = Math.max(window.screen.height || 0, window.screen.width || 0);
        gap = Math.round(screenH - window.innerHeight);
        if (!(gap > 0 && gap <= 120)) gap = 0;
      }
    } catch { gap = 0; }
    if (gap !== lastGap) { lastGap = gap; document.documentElement.style.setProperty('--st-vgap-js', gap + 'px'); }
  };
  measureGap();
  window.addEventListener('resize', measureGap);
  window.addEventListener('orientationchange', () => { measureGap(); setTimeout(measureGap, 300); });
  window.addEventListener('pageshow', measureGap);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') measureGap(); });
  window.__shieldViewportGap = measureGap;

  /* iOS home-screen apps can also leave the layout viewport shrunk after the
     on-screen keyboard closes (a dead band appears under the tab bar for the
     rest of the session). Nudging a reflow right after focus leaves an input
     restores the full-height viewport, then the gap is re-measured. */
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      try {
        window.scrollTo(0, 0);
        const b = document.body; b.style.minHeight = '100.01%';
        requestAnimationFrame(() => { b.style.minHeight = ''; measureGap(); });
      } catch { /* noop */ }
    }, 80);
  });
})();

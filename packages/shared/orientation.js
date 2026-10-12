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

/* ShieldTech Portal — production entry.
   Boot-time device detection picks the surface: the desktop portal shell, or
   the merged mobile app when a touch device is detected on the same domain.
   Overrides: ?desktop=1 forces desktop, ?mobile=1 forces mobile (both persist
   for the session). The choice re-evaluates on orientation/resize. */

import '@shared/globals.js';
import '@shared/supabase.js';
import '@shared/auth.js';
import '@shared/passkey.js';
import '@shared/ai.js';
import '@shared/time.js';
import '@shared/camera.js';
import '@shared/vision.js';
import '@shared/webxr-scan.js';
import '@shared/lidar-import.js';
import '@shared/live-map.js';
import '@shared/email.js';
import '@shared/pdf.js';

/* Fonts (self-hosted; same families/weights the design's Google Fonts import used) */
import '@fontsource/montserrat/200.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/ibm-plex-sans/300.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

import '@shared/styles/styles.css';
import '@shared/styles/widget-studio.css';

/* Gate fade-up entrance animations on a real paint (see base/global.css). */
requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    document.documentElement.classList.add('anim-ready');
  });
});

/* Sibling app URLs (sidebar links, mobile directory). Configure per env;
   dev defaults point at the workspace's tech/customer dev servers. */
const DEV = import.meta.env.DEV;
window.__shieldAppUrls = {
  portal: import.meta.env.VITE_PORTAL_APP_URL || (DEV ? 'http://localhost:4170' : 'https://portal.shieldtechsolutions.com'),
  tech: import.meta.env.VITE_TECH_APP_URL || (DEV ? 'http://localhost:4171' : 'https://tech.shieldtechsolutions.com'),
  customer: import.meta.env.VITE_CUSTOMER_APP_URL || (DEV ? 'http://localhost:4172' : 'https://customer.shieldtechsolutions.com'),
};

/* ── Device detection ── */
const SURFACE_KEY = 'st2:surface-override';
(function readOverride() {
  const q = new URLSearchParams(window.location.search);
  if (q.get('desktop') === '1') sessionStorage.setItem(SURFACE_KEY, 'desktop');
  else if (q.get('mobile') === '1') sessionStorage.setItem(SURFACE_KEY, 'mobile');
})();

function detectMobile() {
  const override = sessionStorage.getItem(SURFACE_KEY);
  if (override === 'desktop') return false;
  if (override === 'mobile') return true;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth <= 820;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return (coarse && narrow) || (ua && narrow);
}

const isMobile = detectMobile();
document.documentElement.dataset.surface = isMobile ? 'mobile' : 'desktop';

/* Re-evaluate on resize/orientation: reload only when the classification
   actually flips (an explicit override never flips). */
let reevalTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(reevalTimer);
  reevalTimer = setTimeout(() => {
    if (detectMobile() !== isMobile) window.location.reload();
  }, 350);
});

if (isMobile) {
  import('./mobile.jsx');
} else {
  import('./desktop.jsx');
}

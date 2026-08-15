/* ShieldTech Sales App — entry.
   CRM extension wired live into the portal's shared stores. Access is gated
   by profiles.app_rights.sales, administered from the portal's Users screen. */
import '@shared/globals.js';

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
import '@shared/styles/mobile.css';
import '@shared/styles/viewport-lock.css';
import '@shared/supabase.js';
import '@shared/auth.js';
import '@shared/passkey.js';
import '@shared/ai.js';
import '@shared/qbo.js';
import '@shared/acceptance.js';
import '@shared/bids.js';
import '@shared/email.js';
import '@shared/pdf.js';
import '@shared/proto-manifest-sales.js';
import '@shared/store-sync.js';

const React = window.React;
const ReactDOM = window.ReactDOM;

requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    document.documentElement.classList.add('anim-ready');
  });
});

const DEV = import.meta.env.DEV;
window.__shieldAppUrls = {
  portal: import.meta.env.VITE_PORTAL_APP_URL || (DEV ? 'http://localhost:4170' : 'https://portal.shieldtechsolutions.com'),
};

const ShieldAuthGate = window.ShieldAuthGate;
const EB = window.AppErrorBoundary || React.Fragment;
ReactDOM.createRoot(document.getElementById('root')).render(
  <ShieldAuthGate appId="sales"><EB><window.SalesApp /></EB></ShieldAuthGate>
);

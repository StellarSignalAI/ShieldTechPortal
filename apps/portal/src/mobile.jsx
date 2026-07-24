/* ShieldTech Portal — mobile surface (ported from "ShieldTech Mobile.html").
   Loaded by main.jsx when a mobile device is detected on the portal domain. */
import '@shared/styles/mobile.css';
import '@shared/styles/viewport-lock.css';
import '@shared/proto-manifest-mobile.js';
import '@shared/store-sync.js';

const React = window.React;
const ReactDOM = window.ReactDOM;

const MobilePortalApp = window.MobilePortalApp;
const ShieldAuthGate = window.ShieldAuthGate;
const EB = window.AppErrorBoundary || React.Fragment;
ReactDOM.createRoot(document.getElementById('root')).render(
  <ShieldAuthGate appId="portal"><EB><MobilePortalApp /></EB></ShieldAuthGate>
);

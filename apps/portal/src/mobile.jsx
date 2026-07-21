/* ShieldTech Portal — mobile surface (ported from "ShieldTech Mobile.html").
   Loaded by main.jsx when a mobile device is detected on the portal domain. */
import '@shared/styles/mobile.css';
import '@shared/proto-manifest-mobile.js';

const React = window.React;
const ReactDOM = window.ReactDOM;

const MobilePortalApp = window.MobilePortalApp;
ReactDOM.createRoot(document.getElementById('root')).render(<MobilePortalApp />);

// The vendored prototype modules (src/proto/**) were written for a Babel-in-browser
// environment where React/ReactDOM are UMD globals. Expose them before any
// prototype module evaluates.
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactDOMFull from 'react-dom';

window.React = React;
// The prototype only uses ReactDOM.createRoot (react-dom/client) plus the
// classic namespace occasionally — merge both.
window.ReactDOM = Object.assign({}, ReactDOMFull, ReactDOM);

try { window.__shieldBuild = typeof __SHIELD_BUILD__ !== 'undefined' ? __SHIELD_BUILD__ : 'dev'; } catch { window.__shieldBuild = 'dev'; }

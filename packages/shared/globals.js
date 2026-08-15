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

/* ── Pull-to-refresh (mobile, all apps) ──
   The shells lock the body (position:fixed) so the native browser gesture
   never fires. This restores it: drag down from the top of any scrollable
   area and release past the threshold → the app reloads (network-first SW
   serves the latest build + fresh data). Touch devices only. */
(function pullToRefresh() {
  if (typeof window === 'undefined' || !('ontouchstart' in window)) return;
  const THRESHOLD = 72;
  let startY = null, pulling = false, dist = 0, indicator = null;

  function scrolledAncestor(el) {
    // Any scrollable ancestor that's not at the top blocks the gesture.
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.scrollTop > 0) return true;
    }
    return false;
  }
  function ui() {
    if (indicator) return indicator;
    indicator = document.createElement('div');
    indicator.style.cssText = 'position:fixed;left:50%;top:0;z-index:99999;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:rgba(13,20,32,0.95);border:1px solid rgba(63,169,245,0.5);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,0.5);transition:none;pointer-events:none;';
    indicator.innerHTML = '<div style="width:16px;height:16px;border-radius:50%;border:2px solid rgba(63,169,245,0.25);border-top-color:#3FA9F5"></div>';
    document.body.appendChild(indicator);
    return indicator;
  }
  function setPull(px) {
    const el = ui();
    const capped = Math.min(px, 130);
    el.style.transform = `translateY(${capped - 46}px) rotate(${capped * 2.2}deg)`;
    el.style.opacity = String(Math.min(1, capped / THRESHOLD));
  }
  function reset() {
    if (indicator) { indicator.remove(); indicator = null; }
    startY = null; pulling = false; dist = 0;
  }

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return reset();
    const t = e.touches[0];
    // Ignore drags that start on interactive drag surfaces — sliders, canvases,
    // SVGs (blueprint markup!), text fields, and anything inside an open modal
    // or an element marked data-no-ptr. A downward pen stroke must never
    // reload the app and destroy unsaved state.
    if (e.target.closest && e.target.closest('input, textarea, select, canvas, video, svg, [data-no-ptr], [role="dialog"]')) return;
    const zTrap = e.target.closest && e.target.closest('div[style*="position: fixed"], div[style*="position:fixed"]');
    if (zTrap && zTrap !== document.body && /(^|\D)9\d{3}/.test(zTrap.style.zIndex || '')) return; // full-screen overlays (modals, editors)
    if (scrolledAncestor(e.target)) return;
    startY = t.clientY; dist = 0; pulling = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (startY == null || e.touches.length !== 1) return;
    dist = e.touches[0].clientY - startY;
    if (dist > 12 && !scrolledAncestor(e.target)) {
      pulling = true;
      setPull(dist);
    } else if (pulling && dist <= 0) {
      reset();
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (pulling && dist >= THRESHOLD) {
      const el = ui();
      el.style.transform = 'translateY(26px)';
      el.firstChild.style.animation = 'spin 0.7s linear infinite';
      setTimeout(() => window.location.reload(), 150);
    } else {
      reset();
    }
  }, { passive: true });
  window.addEventListener('touchcancel', reset, { passive: true });
})();

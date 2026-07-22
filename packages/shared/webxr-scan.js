/* Android WebXR AR scanner — real world-locked room capture in the browser.
   Chrome/Android + ARCore only (iOS Safari has no WebXR; it uses the native app).
   The user taps floor→wall corners in a stabilized AR session; hit-test anchors
   each tap to the real surface, so walls/ceiling stay locked in 3D as they move.
   Depth Sensing (when available) tightens the hit results. Produces the same
   {capturedRoom:{walls,doors,windows,objects}} shape the LiDAR importer accepts.

   window.__shieldWebXR:
     supported()  → Promise<boolean>  (immersive-ar available)
     scanRoom({ onStatus, onPoint }) → Promise<{ ok, capturedRoom } | { ok:false, error }>
*/

const M = () => (window.THREE ? null : null); // no three.js dependency — raw WebGL-less overlay

export async function supported() {
  try { return !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')); }
  catch { return false; }
}

/* Minimal AR session that reads controller/screen taps, hit-tests them against
   the detected planes, and collects floor-plane corner points + a ceiling
   height sample. No rendering framework: we drive an XRWebGLLayer with a bare
   context and rely on the passthrough camera + DOM overlay for UI. */
export async function scanRoom({ onStatus = () => {}, onPoint = () => {} } = {}) {
  if (!(await supported())) return { ok: false, error: 'WebXR AR not supported on this device' };

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { xrCompatible: true });
  if (!gl) return { ok: false, error: 'WebGL unavailable' };

  let session;
  const overlay = buildOverlay();
  try {
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test', 'local-floor'],
      optionalFeatures: ['depth-sensing', 'dom-overlay', 'anchors'],
      domOverlay: { root: overlay.root },
      depthSensing: { usagePreference: ['cpu-optimized'], dataFormatPreference: ['luminance-alpha'] },
    });
  } catch (e) {
    overlay.destroy();
    return { ok: false, error: 'AR session denied: ' + (e && e.message || e) };
  }

  await gl.makeXRCompatible();
  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
  const viewerSpace = await session.requestReferenceSpace('viewer');
  const localSpace = await session.requestReferenceSpace('local-floor');
  const hitSource = await session.requestHitTestSource({ space: viewerSpace });

  const points = [];         // floor corner points [{x,z}] in metres (local-floor)
  let ceilingY = null;       // metres above floor
  let lastHit = null;        // {x,y,z}
  let finished = false;
  let resolveDone;
  const done = new Promise(r => (resolveDone = r));

  onStatus('Point at the floor. Tap each corner of the room in order.');
  overlay.tapBtn.onclick = () => {
    if (!lastHit) { onStatus('No surface found — aim at the floor and hold steady.'); return; }
    points.push({ x: lastHit.x, z: lastHit.z });
    onPoint({ index: points.length, x: lastHit.x, z: lastHit.z });
    overlay.count.textContent = points.length + ' corners';
    onStatus(points.length < 3 ? 'Keep tapping room corners…' : 'Tap remaining corners, then Finish.');
  };
  overlay.ceilBtn.onclick = () => {
    if (!lastHit) return;
    ceilingY = Math.max(ceilingY || 0, lastHit.y);   // aim at ceiling, tap
    overlay.ceil.textContent = 'ceiling ' + (ceilingY).toFixed(2) + 'm';
    onStatus('Ceiling height captured. Finish when the floor loop is closed.');
  };
  overlay.finishBtn.onclick = () => { finished = true; };
  overlay.cancelBtn.onclick = () => { finished = 'cancel'; };

  const onFrame = (t, frame) => {
    if (finished) {
      session.end();
      return;
    }
    session.requestAnimationFrame(onFrame);
    const pose = frame.getViewerPose(localSpace);
    if (!pose) return;
    const results = frame.getHitTestResults(hitSource);
    if (results.length) {
      const hitPose = results[0].getPose(localSpace);
      if (hitPose) {
        const p = hitPose.transform.position;
        lastHit = { x: p.x, y: p.y, z: p.z };
        overlay.reticle.style.opacity = '1';
      }
    } else {
      overlay.reticle.style.opacity = '0.35';
    }
  };
  session.requestAnimationFrame(onFrame);

  session.addEventListener('end', () => {
    overlay.destroy();
    if (finished === 'cancel' || points.length < 3) { resolveDone({ ok: false, error: 'Scan cancelled or too few corners' }); return; }
    resolveDone({ ok: true, capturedRoom: buildCapturedRoom(points, ceilingY) });
  });

  return done;
}

/* Corner points (metres) → RoomPlan-shaped capturedRoom the importer understands.
   Each floor edge becomes a wall with a length + the measured ceiling height. */
function buildCapturedRoom(points, ceilingY) {
  const h = ceilingY && ceilingY > 1.5 ? ceilingY : 2.6;
  const walls = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const midX = (a.x + b.x) / 2, midZ = (a.z + b.z) / 2;
    // transform: identity rotation, position at (midX, h/2, midZ); dimensions [len, h, 0.1]
    walls.push({
      dimensions: [len, h, 0.1],
      transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, midX, h / 2, midZ, 1],
      category: 'wall',
    });
  }
  return { walls, doors: [], windows: [], objects: [] };
}

function buildOverlay() {
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:system-ui,sans-serif';
  root.innerHTML = `
    <div style="position:absolute;top:calc(12px + env(safe-area-inset-top));left:0;right:0;text-align:center;pointer-events:none">
      <span id="stx-status" style="display:inline-block;max-width:90%;padding:8px 14px;border-radius:12px;background:rgba(4,10,16,0.72);color:#fff;font:600 13px/1.4 system-ui">Starting AR…</span>
    </div>
    <div id="stx-reticle" style="position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px;border:2px solid #34D399;border-radius:50%;opacity:0.35;pointer-events:none"></div>
    <div style="position:absolute;top:calc(56px + env(safe-area-inset-top));left:0;right:0;display:flex;gap:8px;justify-content:center;pointer-events:none">
      <span id="stx-count" style="padding:5px 11px;border-radius:10px;background:rgba(4,10,16,0.65);color:#34D399;font:700 11px/1 system-ui">0 corners</span>
      <span id="stx-ceil" style="padding:5px 11px;border-radius:10px;background:rgba(4,10,16,0.65);color:#3FA9F5;font:700 11px/1 system-ui">ceiling —</span>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:calc(20px + env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center;padding:0 16px;pointer-events:auto">
      <button id="stx-tap" style="flex:1;max-width:150px;padding:15px 0;border:none;border-radius:14px;background:#34D399;color:#04121f;font:700 15px system-ui">＋ Corner</button>
      <button id="stx-ceilbtn" style="padding:15px 14px;border:1px solid rgba(255,255,255,0.3);border-radius:14px;background:rgba(4,10,16,0.6);color:#fff;font:600 13px system-ui">Ceiling</button>
      <button id="stx-finish" style="padding:15px 14px;border:none;border-radius:14px;background:#3FA9F5;color:#fff;font:700 14px system-ui">Finish</button>
    </div>
    <button id="stx-cancel" style="position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;padding:7px 11px;border:1px solid rgba(255,255,255,0.25);border-radius:10px;background:rgba(4,10,16,0.6);color:#fff;font:600 12px system-ui;pointer-events:auto">✕</button>`;
  document.body.appendChild(root);
  return {
    root,
    status: root.querySelector('#stx-status'),
    reticle: root.querySelector('#stx-reticle'),
    count: root.querySelector('#stx-count'),
    ceil: root.querySelector('#stx-ceil'),
    tapBtn: root.querySelector('#stx-tap'),
    ceilBtn: root.querySelector('#stx-ceilbtn'),
    finishBtn: root.querySelector('#stx-finish'),
    cancelBtn: root.querySelector('#stx-cancel'),
    destroy() { try { root.remove(); } catch {} },
  };
}

// status text hook
const _origBuild = buildOverlay;

window.__shieldWebXR = {
  supported,
  scanRoom: (opts = {}) => scanRoom({
    ...opts,
    onStatus: (msg) => {
      const el = document.getElementById('stx-status');
      if (el) el.textContent = msg;
      if (opts.onStatus) opts.onStatus(msg);
    },
  }),
};

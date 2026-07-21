/* SiteScan — VR walkthrough. CSS-3D first-person view of the captured floor plan.
   Modes: Walk (drag to look, joystick to move) · Stereo (headset split-screen) · Pano (360° per room).
   Devices render in-world; you can place new ones from inside VR. */

const SSV = 40; /* px per ft in VR space */
const SS_WALL_H = 9; /* ft */

/* Build wall + floor + device nodes for a floor (static per floor) */
function SSVRWorld({ floor, theme }) {
  const dark = theme !== 'paper';
  const wallBg = dark ? 'linear-gradient(180deg, rgba(23,37,52,0.96), rgba(13,22,33,0.98))' : 'linear-gradient(180deg, #dfe7ee, #c9d4de)';
  const wallEdge = dark ? 'rgba(63,169,245,0.55)' : 'rgba(30,58,95,0.6)';
  const b = ssBounds(floor.rooms || []);
  const doorsFor = (roomId, edge) => (floor.doors || []).filter(d => d.room === roomId && d.edge === edge);
  return (
    <React.Fragment>
      {/* floor plane */}
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: (b.x2 - b.x1 + 40) * SSV, height: (b.y2 - b.y1 + 40) * SSV,
        transform: `translate3d(${(b.x1 - 20) * SSV}px, 0px, ${(b.y1 - 20) * SSV}px) rotateX(90deg)`,
        transformOrigin: '0 0',
        background: dark
          ? 'repeating-linear-gradient(0deg, rgba(63,169,245,0.12) 0 2px, transparent 2px 80px), repeating-linear-gradient(90deg, rgba(63,169,245,0.10) 0 2px, transparent 2px 80px), #060d16'
          : 'repeating-linear-gradient(0deg, rgba(30,58,95,0.15) 0 2px, transparent 2px 80px), repeating-linear-gradient(90deg, rgba(30,58,95,0.12) 0 2px, transparent 2px 80px), #e8ece9',
        backfaceVisibility: 'visible',
      }}></div>

      {/* walls */}
      {(floor.rooms || []).map(r => {
        const WH = r.h || SS_WALL_H;
        return ssEdges(r.poly).map(([a, c], i) => {
        const L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 0.5) return null;
        const phi = Math.atan2(c[1] - a[1], c[0] - a[0]);
        return (
          <div key={r.id + '-' + i} style={{
            position: 'absolute', left: 0, top: 0, width: L * SSV, height: WH * SSV,
            transform: `translate3d(${a[0] * SSV}px, ${-WH * SSV}px, ${a[1] * SSV}px) rotateY(${-phi}rad)`,
            transformOrigin: '0 0', background: wallBg,
            borderTop: `2px solid ${wallEdge}`, borderBottom: `2px solid ${wallEdge}`,
            boxShadow: dark ? 'inset 0 -40px 60px rgba(0,0,0,0.35)' : 'inset 0 -30px 50px rgba(0,0,0,0.08)',
            backfaceVisibility: 'visible', opacity: 0.96,
          }}>
            {/* room name stencil */}
            {i === 0 && <div style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%) scaleX(-1)', fontSize: 26, fontWeight: 800, letterSpacing: '0.2em', color: dark ? 'rgba(63,169,245,0.25)' : 'rgba(30,58,95,0.25)', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{r.name.toUpperCase()}</div>}
            {/* door / window openings */}
            {doorsFor(r.id, i).map(d => {
              const left = Math.max(0, (d.t * L - d.w / 2)) * SSV, w = d.w * SSV;
              return d.kind === 'door' ? (
                <div key={d.id} style={{ position: 'absolute', left, bottom: 0, width: w, height: 7.2 * SSV, background: dark ? 'linear-gradient(180deg, rgba(4,8,13,0.92), rgba(8,14,22,0.98))' : 'linear-gradient(180deg,#aebdc9,#94a6b5)', border: `2px solid ${wallEdge}`, borderBottom: 'none' }}>
                  <div style={{ position: 'absolute', right: 10, top: '48%', width: 14, height: 5, borderRadius: 3, background: wallEdge }}></div>
                </div>
              ) : (
                <div key={d.id} style={{ position: 'absolute', left, top: '28%', width: w, height: '38%', background: dark ? 'linear-gradient(160deg, rgba(90,160,220,0.30), rgba(40,80,130,0.35))' : 'linear-gradient(160deg, rgba(160,200,240,0.8), rgba(110,150,200,0.7))', border: `2px solid ${wallEdge}`, boxShadow: dark ? '0 0 26px rgba(63,169,245,0.25)' : 'none' }}></div>
              );
            })}
          </div>
        );
      }); })}

      {/* documented objects — volumetric footprints */}
      {(floor.objects || []).map(o => {
        const d = ssObj(o.type);
        const oh = d.zh || 2.5;
        const face = { position: 'absolute', left: 0, top: 0, background: `color-mix(in srgb, ${d.color} 16%, rgba(10,16,24,0.75))`, border: `1.5px solid color-mix(in srgb, ${d.color} 60%, transparent)`, backfaceVisibility: 'visible' };
        return (
          <div key={o.id} style={{ position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d' }}>
            {/* top face */}
            <div style={{ ...face, width: o.w * SSV, height: o.h * SSV, transform: `translate3d(${o.x * SSV}px, ${-oh * SSV}px, ${o.y * SSV}px) rotateX(90deg)`, transformOrigin: '0 0' }}></div>
            {/* front + back faces */}
            <div style={{ ...face, width: o.w * SSV, height: oh * SSV, transform: `translate3d(${o.x * SSV}px, ${-oh * SSV}px, ${(o.y + o.h) * SSV}px)` }}></div>
            <div style={{ ...face, width: o.w * SSV, height: oh * SSV, transform: `translate3d(${o.x * SSV}px, ${-oh * SSV}px, ${o.y * SSV}px)` }}></div>
            {/* label */}
            <div className="mono" style={{ position: 'absolute', left: (o.x + o.w / 2) * SSV - 44, top: -(oh + 1.2) * SSV, width: 88, textAlign: 'center', fontSize: 10, color: d.color, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{d.label}</div>
          </div>
        );
      })}

      {/* devices — crossed glowing planes, orientation-independent */}
      {(floor.devices || []).map(v => {
        const d = ssDev(v.type);
        return (
          <div key={v.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${v.x * SSV}px, ${-(v.z || 5) * SSV}px, ${v.y * SSV}px)`, transformStyle: 'preserve-3d' }}>
            {[0, 90].map(rot => (
              <div key={rot} style={{ position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${d.color}`, background: `color-mix(in srgb, ${d.color} 22%, transparent)`, boxShadow: `0 0 20px ${d.color}`, transform: `rotateY(${rot}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'visible' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-body)' }}>{d.letter}</span>
              </div>
            ))}
            <div className="mono" style={{ position: 'absolute', left: -40, top: -46, width: 80, textAlign: 'center', fontSize: 9, color: d.color, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{v.label}</div>
          </div>
        );
      })}
    </React.Fragment>
  );
}

/* Mini-map with live camera dot */
function SSVRMap({ floor, cam }) {
  const b = ssBounds(floor.rooms || []);
  const W = 92, H = 74;
  const sc = Math.min((W - 12) / Math.max(b.x2 - b.x1, 1), (H - 12) / Math.max(b.y2 - b.y1, 1));
  const mx = p => (p[0] - b.x1) * sc + 6, my = p => (p[1] - b.y1) * sc + 6;
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      {(floor.rooms || []).map(r => <polygon key={r.id} points={r.poly.map(p => `${mx(p)},${my(p)}`).join(' ')} fill="rgba(63,169,245,0.10)" stroke="rgba(63,169,245,0.6)" strokeWidth="1"></polygon>)}
      <g transform={`translate(${mx([cam.x, cam.z])},${my([cam.x, cam.z])}) rotate(${cam.yaw * 180 / Math.PI})`}>
        <path d="M0,-7 L4,3 L0,1 L-4,3 Z" fill="#34D399"></path>
      </g>
    </svg>
  );
}

function SSVR({ project, floorIdx, onFloorIdx, onPlaceDevice, onClose }) {
  const [prefs] = useShieldStore(ssPrefsStore);
  const floor = project.floors[floorIdx] || project.floors[0];
  const [mode, setMode] = React.useState('walk'); // walk | stereo | pano
  const [panoRoom, setPanoRoom] = React.useState(0);
  const [panoX, setPanoX] = React.useState(0);
  const [palette, setPalette] = React.useState(false);
  const [, force] = React.useReducer(x => x + 1, 0);

  const start = ssCentroid((floor.rooms[0] || { poly: [[10, 10]] }).poly);
  const cam = React.useRef({ x: start[0], z: start[1], yaw: 0, pitch: 0 });
  const joy = React.useRef({ x: 0, y: 0 });
  const eyes = React.useRef([]);
  const look = React.useRef(null);

  const fov = prefs.vrFov || 70;
  const persp = Math.round(215 / Math.tan((fov * Math.PI / 180) / 2));
  const speed = 7 * (prefs.vrSpeed || 1); /* ft/s */

  /* movement + render loop (direct DOM writes — no re-render per frame) */
  React.useEffect(() => {
    if (mode === 'pano') return;
    let raf, last = performance.now(), tick = 0;
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const c = cam.current, j = joy.current;
      if (j.x || j.y) {
        c.x += (Math.sin(c.yaw) * -j.y + Math.cos(c.yaw) * j.x) * speed * dt;
        c.z += (-Math.cos(c.yaw) * -j.y + Math.sin(c.yaw) * j.x) * speed * dt;
      }
      eyes.current.forEach((el, i) => {
        if (!el) return;
        const off = mode === 'stereo' ? (i === 0 ? -0.12 : 0.12) : 0;
        const ex = c.x + Math.cos(c.yaw) * off, ez = c.z + Math.sin(c.yaw) * off;
        el.style.transform = `rotateX(${-c.pitch}rad) rotateY(${c.yaw}rad) translate3d(${-ex * SSV}px, ${5.5 * SSV}px, ${-ez * SSV}px)`;
      });
      if ((tick++ & 7) === 0) force(); /* mini-map @ ~8fps */
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, speed, floorIdx]);

  /* look drag */
  const lookDown = e => { if (e.target.closest('[data-ss-joy]')) return; look.current = { x: e.clientX, y: e.clientY }; };
  const lookMove = e => {
    const l = look.current; if (!l) return;
    cam.current.yaw += (e.clientX - l.x) * 0.005;
    cam.current.pitch = Math.max(-0.6, Math.min(0.6, cam.current.pitch + (e.clientY - l.y) * 0.003));
    look.current = { x: e.clientX, y: e.clientY };
  };
  const lookUp = () => { look.current = null; };

  /* joystick */
  const joyRef = React.useRef(null);
  const joyDown = e => { e.stopPropagation(); joyMove(e, true); };
  const joyMove = (e, forceOn) => {
    if (!forceOn && !joyRef.current?.dataset.on) return;
    joyRef.current.dataset.on = '1';
    const r = joyRef.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy) || 1, cap = Math.min(1, m);
    joy.current = { x: dx / m * cap, y: dy / m * cap };
  };
  const joyUp = () => { if (joyRef.current) delete joyRef.current.dataset.on; joy.current = { x: 0, y: 0 }; };

  const placeAhead = type => {
    const c = cam.current;
    const px = Math.round((c.x + Math.sin(c.yaw) * 6) * 2) / 2, py = Math.round((c.z - Math.cos(c.yaw) * 6) * 2) / 2;
    onPlaceDevice(type, px, py);
    setPalette(false);
  };

  const dark = prefs.theme !== 'paper';
  const skyBg = dark ? 'radial-gradient(ellipse at 50% 30%, #0c1826 0%, #04080d 75%)' : 'linear-gradient(180deg, #cfdce8 0%, #aebdc9 100%)';

  const viewport = (i, wPct) => (
    <div key={i} style={{ position: 'relative', width: wPct, height: '100%', overflow: 'hidden', perspective: persp, perspectiveOrigin: '50% 50%', background: skyBg, borderRadius: mode === 'stereo' ? 18 : 0 }}>
      <div ref={el => eyes.current[i] = el} style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
        <SSVRWorld floor={floor} theme={prefs.theme}></SSVRWorld>
      </div>
      {/* crosshair */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 18, height: 18, pointerEvents: 'none', opacity: 0.8 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.5, background: 'rgba(63,169,245,0.9)', transform: 'translateX(-50%)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: 'rgba(63,169,245,0.9)', transform: 'translateY(-50%)' }}></div>
      </div>
    </div>
  );

  /* ── 360° pano (simulated photosphere per room) ── */
  const pano = () => {
    const rooms = floor.rooms || [];
    const room = rooms[panoRoom % rooms.length] || rooms[0];
    const hue = 205 + (panoRoom * 40) % 60;
    const devicesHere = (floor.devices || []).filter(v => {
      const xs = room.poly.map(p => p[0]), ys = room.poly.map(p => p[1]);
      return v.x >= Math.min(...xs) && v.x <= Math.max(...xs) && v.y >= Math.min(...ys) && v.y <= Math.max(...ys);
    });
    const W3 = 3000;
    const px = ((panoX % W3) + W3) % W3;
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}
        onPointerDown={e => { look.current = { x: e.clientX }; }}
        onPointerMove={e => { if (look.current) { setPanoX(p => p - (e.clientX - look.current.x) * 1.4); look.current = { x: e.clientX }; } }}
        onPointerUp={lookUp} onPointerLeave={lookUp}>
        {/* wrapped pano strip ×2 for seamless scroll */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: -px, width: W3 * 2, display: 'flex' }}>
          {[0, 1].map(k => (
            <div key={k} style={{ width: W3, height: '100%', flexShrink: 0, background: `linear-gradient(180deg, hsl(${hue},30%,${dark ? 8 : 78}%) 0%, hsl(${hue},34%,${dark ? 14 : 66}%) 40%, hsl(${hue},20%,${dark ? 6 : 50}%) 62%, hsl(${hue},15%,${dark ? 10 : 58}%) 100%), repeating-linear-gradient(90deg, rgba(63,169,245,0.05) 0 2px, transparent 2px 240px)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '58%', left: 0, right: 0, height: 2, background: 'rgba(63,169,245,0.3)' }}></div>
              {/* fake architectural features around the sphere */}
              {[8, 26, 47, 63, 82].map((l, fi) => (
                <div key={fi} style={{ position: 'absolute', left: `${l}%`, top: '30%', bottom: '38%', width: fi % 2 ? 90 : 46, background: fi % 2 ? `linear-gradient(160deg, rgba(90,160,220,${dark ? 0.16 : 0.5}), rgba(40,80,130,${dark ? 0.2 : 0.4}))` : `rgba(63,169,245,${dark ? 0.08 : 0.25})`, border: '2px solid rgba(63,169,245,0.35)' }}></div>
              ))}
              {devicesHere.map((v, di) => {
                const d = ssDev(v.type);
                return (
                  <div key={v.id} style={{ position: 'absolute', left: `${12 + (di * 23) % 76}%`, top: `${26 + (di * 13) % 20}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', border: `2.5px solid ${d.color}`, background: `color-mix(in srgb, ${d.color} 25%, transparent)`, boxShadow: `0 0 22px ${d.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{d.letter}</div>
                    <span className="mono" style={{ fontSize: 9, color: d.color, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{v.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', padding: '6px 16px', borderRadius: 20, background: 'rgba(4,10,16,0.8)', border: '1px solid var(--border-strong)', fontSize: 11, fontWeight: 700, color: 'var(--text-high)', whiteSpace: 'nowrap' }}>360° · {room ? room.name : '—'} <span className="mono" style={{ color: 'var(--text-low)', fontWeight: 400 }}>drag to look around</span></div>
        <div style={{ position: 'absolute', bottom: 86, left: 0, right: 0, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', padding: '0 14px' }}>
          {rooms.map((r, i) => (
            <button key={r.id} onClick={() => { setPanoRoom(i); setPanoX(0); }} style={{ padding: '6px 12px', borderRadius: 16, border: '1px solid', borderColor: i === panoRoom ? 'var(--border-strong)' : 'var(--border-subtle)', background: i === panoRoom ? 'rgba(63,169,245,0.18)' : 'rgba(4,10,16,0.6)', color: i === panoRoom ? 'var(--brand)' : 'var(--text-mid)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{r.name}</button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...ssOverlay, background: '#02050a' }} onPointerDown={mode !== 'pano' ? lookDown : undefined} onPointerMove={mode !== 'pano' ? lookMove : undefined} onPointerUp={lookUp} onPointerLeave={lookUp}>
      {/* viewports */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: mode === 'stereo' ? 6 : 0, padding: mode === 'stereo' ? '46px 8px 150px' : 0, touchAction: 'none' }}>
        {mode === 'pano' ? pano() : mode === 'stereo' ? [viewport(0, '50%'), viewport(1, '50%')] : viewport(0, '100%')}
      </div>
      {mode === 'stereo' && <div style={{ position: 'absolute', top: 46, bottom: 150, left: '50%', width: 2, background: 'rgba(63,169,245,0.25)', transform: 'translateX(-1px)', pointerEvents: 'none' }}></div>}

      {/* top chrome */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'linear-gradient(180deg, rgba(2,5,10,0.85), transparent)', zIndex: 3 }}>
        <button onClick={onClose} style={{ background: 'rgba(4,10,16,0.7)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--text-high)', fontSize: 12, fontWeight: 600, padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕ Exit AR</button>
        <div style={{ flex: 1 }}></div>
        {project.floors.length > 1 && (
          <select value={floorIdx} onChange={e => onFloorIdx(Number(e.target.value))} style={{ background: 'rgba(4,10,16,0.7)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 11, fontWeight: 600, padding: '7px 8px', fontFamily: 'var(--font-body)' }}>
            {project.floors.map((f, i) => <option key={f.id} value={i}>{f.label}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
          {[['walk', 'Walk'], ['stereo', 'Headset'], ['pano', '360°']].map(([id, lb]) => (
            <button key={id} onClick={() => setMode(id)} style={{ padding: '7px 11px', border: 'none', background: mode === id ? 'rgba(63,169,245,0.25)' : 'rgba(4,10,16,0.7)', color: mode === id ? '#fff' : 'var(--text-mid)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{lb}</button>
          ))}
        </div>
      </div>

      {/* mini-map */}
      {mode !== 'pano' && (
        <div style={{ position: 'absolute', right: 10, top: 52, borderRadius: 10, background: 'rgba(4,10,16,0.8)', border: '1px solid var(--border-strong)', padding: 6, zIndex: 3 }}>
          <SSVRMap floor={floor} cam={cam.current}></SSVRMap>
        </div>
      )}

      {/* bottom controls */}
      {mode !== 'pano' && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'flex-end', gap: 10, zIndex: 3, background: 'linear-gradient(0deg, rgba(2,5,10,0.8), transparent)' }}>
          {/* joystick */}
          <div data-ss-joy ref={joyRef} onPointerDown={joyDown} onPointerMove={e => joyMove(e)} onPointerUp={joyUp} onPointerLeave={joyUp}
            style={{ width: 96, height: 96, borderRadius: '50%', border: '1.5px solid rgba(63,169,245,0.45)', background: 'radial-gradient(circle, rgba(63,169,245,0.12) 0%, rgba(63,169,245,0.03) 70%)', position: 'relative', flexShrink: 0, touchAction: 'none' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(63,169,245,0.35)', border: '1.5px solid var(--brand)', boxShadow: '0 0 14px rgba(63,169,245,0.4)' }}></div>
            <span style={{ position: 'absolute', left: '50%', bottom: -16, transform: 'translateX(-50%)', fontSize: 8, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>MOVE</span>
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: 'rgba(160,190,215,0.65)', paddingBottom: 8 }}>drag view to look · joystick to walk</div>
          <button onClick={() => setPalette(p => !p)} style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0, boxShadow: '0 4px 18px rgba(63,169,245,0.35)' }}>＋ Device</button>
        </div>
      )}

      {/* in-VR device palette */}
      {palette && mode !== 'pano' && (
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 128, borderRadius: 14, background: 'rgba(4,10,16,0.92)', border: '1px solid var(--border-strong)', padding: 10, zIndex: 4, backdropFilter: 'blur(8px)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>PLACE 6 FT AHEAD OF YOU</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {SS_DEVICES.map(d => (
              <button key={d.type} onClick={() => placeAhead(d.type)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '9px 10px', borderRadius: 10, border: `1px solid color-mix(in srgb, ${d.color} 40%, transparent)`, background: `color-mix(in srgb, ${d.color} 8%, transparent)`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d={d.glyph} fill="none" stroke={d.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <span style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap' }}>{d.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SSVR, SSVRWorld });

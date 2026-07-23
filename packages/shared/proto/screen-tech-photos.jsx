/* Tech App — Site Photos: capture viewfinder, photo roll, required-shot checklist.
   Adds photos to the shared photoStore. */

const techCamStore = createShieldStore('techcam', { wo: null, slot: null });

const CAM_PATTERNS = ['ceiling', 'rack', 'wall', 'exterior', 'panel'];
function randomLook() {
  return { h: Math.floor(Math.random() * 300), p: CAM_PATTERNS[Math.floor(Math.random() * CAM_PATTERNS.length)], s: Math.floor(Math.random() * 9000) + 1 };
}
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
const techMe = () => (window.__shieldUser || {});

/* ── Photo Roll + Checklist ── */
function TechPhotosView({ setTab }) {
  const [photos] = useShieldStore(photoStore);
  const [wos] = useShieldStore(workOrderStore);
  const [cam, setCam] = useShieldStore(techCamStore);
  const [lightbox, setLightbox] = React.useState(null);

  // Photos no longer require a dispatched job. When the tech has no work order
  // (or explicitly picks "Unassigned"), they can still shoot; the photo lands in
  // an Unassigned bucket and can be attached to a job afterwards.
  const activeWo = cam.wo === '__unassigned' ? null : (wos.find(w => w.id === cam.wo) || wos[0] || null);
  const comp = activeWo ? photoCompliance(activeWo, photos) : null;
  const woPhotos = activeWo ? photos.filter(p => p.wo === activeWo.id) : [];
  const unassignedPhotos = photos.filter(p => p.tech === techMe().initials && !p.wo);
  const otherPhotos = photos.filter(p => p.tech === techMe().initials && p.wo && (!activeWo || p.wo !== activeWo.id));

  const shootSlot = (slot) => { setCam({ ...cam, wo: activeWo.id, slot }); setTab('capture'); };
  const assignPhoto = (photoId, woId) => {
    const w = wos.find(x => x.id === woId);
    if (!w) return;
    photoStore.set(prev => prev.map(p => p.id === photoId ? { ...p, wo: w.id, customer: w.customer, site: w.site, label: p.label && !p.label.startsWith('Field photo') ? p.label : `Field photo — ${w.customer}` } : p));
    showToast(`Photo attached to ${w.id} · ${w.customer}`, 'ok');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Site Photos</div>
        <button onClick={() => { setCam({ ...cam, slot: null }); setTab('capture'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 14px rgba(63,169,245,0.3)' }}>
          <Icon name="cameras" size={14} color="#fff" /> Camera
        </button>
      </div>

      {/* Job selector — includes an Unassigned bucket so photos can be shot with no job */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        <button onClick={() => setCam({ ...cam, wo: '__unassigned' })} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', background: !activeWo ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.03)', border: `1px solid ${!activeWo ? 'var(--border-strong)' : 'var(--border-subtle)'}`, color: !activeWo ? 'var(--brand)' : 'var(--text-mid)', textAlign: 'left' }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 600 }}>Unassigned</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{unassignedPhotos.length} photo{unassignedPhotos.length === 1 ? '' : 's'}</div>
        </button>
        {wos.map(w => {
          const on = activeWo && w.id === activeWo.id;
          return (
            <button key={w.id} onClick={() => setCam({ ...cam, wo: w.id })} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', background: on ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.03)', border: `1px solid ${on ? 'var(--border-strong)' : 'var(--border-subtle)'}`, color: on ? 'var(--brand)' : 'var(--text-mid)', textAlign: 'left' }}>
              <div className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{w.id}</div>
              <div style={{ fontSize: 9, color: on ? 'var(--text-mid)' : 'var(--text-low)' }}>{w.customer}</div>
            </button>
          );
        })}
      </div>

      {/* Unassigned bucket — shoot now, attach to a job later */}
      {!activeWo && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>Unassigned — {unassignedPhotos.length} photo{unassignedPhotos.length === 1 ? '' : 's'}</div>
          {unassignedPhotos.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic' }}>Tap Camera to shoot without a job — you can attach photos to a job afterwards.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unassignedPhotos.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)' }}>
                <MockPhoto photo={p} stamp={false} onClick={() => setLightbox(p.id)} style={{ width: 46, height: 36, borderRadius: 5, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{p.time} · {p.day}</div>
                </div>
                {wos.length > 0 ? (
                  <select defaultValue="" onChange={e => { if (e.target.value) assignPhoto(p.id, e.target.value); }} style={{ flexShrink: 0, maxWidth: 130, padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontFamily: 'var(--font-body)' }}>
                    <option value="">Attach to job…</option>
                    {wos.map(w => <option key={w.id} value={w.id}>{w.id} · {w.customer}</option>)}
                  </select>
                ) : <span style={{ fontSize: 9, color: 'var(--text-low)' }}>No jobs yet</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required shots */}
      {activeWo && (
      <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)' }}>Required Shots — {activeWo.type}</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: comp.pct === 100 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{comp.done.length}/{comp.required.length}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ width: `${comp.pct}%`, height: '100%', borderRadius: 3, background: comp.pct === 100 ? 'var(--status-ok)' : 'var(--status-warn)', transition: 'width 0.3s' }}></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comp.required.map(slot => {
            const done = comp.done.includes(slot);
            const shot = woPhotos.find(p => p.slot === slot);
            return (
              <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: done ? 'rgba(52,211,153,0.05)' : 'rgba(5,7,10,0.4)', border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}` }}>
                {done && shot
                  ? <MockPhoto photo={shot} stamp={false} onClick={() => setLightbox(shot.id)} style={{ width: 38, height: 30, borderRadius: 5, cursor: 'pointer', flexShrink: 0 }} />
                  : <div style={{ width: 38, height: 30, borderRadius: 5, border: '1px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="cameras" size={13} color="var(--text-low)" /></div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: done ? 'var(--status-ok)' : 'var(--text-high)' }}>{done ? '✓ ' : ''}{slot}</div>
                  {shot && <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{shot.time} · {shot.day}</div>}
                </div>
                {!done && (
                  <button onClick={() => shootSlot(slot)} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Shoot</button>
                )}
              </div>
            );
          })}
        </div>
        {comp.missing.length > 0
          ? <div style={{ fontSize: 10, color: 'var(--status-warn)', marginTop: 8 }}>⚠ Job can't be closed until all required shots are in</div>
          : <div style={{ fontSize: 10, color: 'var(--status-ok)', marginTop: 8 }}>✓ Documentation complete — job can be closed</div>}
      </div>
      )}

      {/* This job's roll */}
      {activeWo && (
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>{activeWo.customer} — {woPhotos.length} photos</div>
        {woPhotos.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic' }}>No photos yet — open the camera to start documenting</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {woPhotos.map(p => <PhotoCard key={p.id} photo={p} hideMeta onClick={() => setLightbox(p.id)} />)}
        </div>
      </div>
      )}

      {/* Other recent */}
      {otherPhotos.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>My recent — other jobs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {otherPhotos.slice(0, 6).map(p => <PhotoCard key={p.id} photo={p} hideMeta onClick={() => setLightbox(p.id)} />)}
          </div>
        </div>
      )}

      {lightbox && <PhotoLightbox photoId={lightbox} onClose={() => setLightbox(null)} canAnnotate />}
    </div>
  );
}

/* ── Capture (mock viewfinder) ── */
function TechCaptureView({ setTab }) {
  const [wos] = useShieldStore(workOrderStore);
  const [photos] = useShieldStore(photoStore);
  const [cam, setCam] = useShieldStore(techCamStore);
  const [scene, setScene] = React.useState(randomLook);
  const [phase, setPhase] = React.useState('progress');
  const [flash, setFlash] = React.useState(false);
  const [lastShot, setLastShot] = React.useState(null);
  const videoRef = React.useRef(null);
  const [live, setLive] = React.useState(false);
  const [camErr, setCamErr] = React.useState('');
  const [facing, setFacing] = React.useState('environment');
  const enableCam = React.useCallback(async () => {
    const cam = window.__shieldCamera;
    if (!cam) { setCamErr('Camera not supported in this browser'); return; }
    if (!videoRef.current) return;
    setCamErr('');
    const r = await cam.startStream(videoRef.current, facing);
    setLive(!!r.ok);
    if (!r.ok) setCamErr(r.error || 'Could not start camera');
  }, [facing]);
  React.useEffect(() => {
    // Auto-attempt on open. If it fails (iOS gesture requirement, denied
    // permission, or an in-app browser that blocks the camera), the viewfinder
    // shows a "Tap to start camera" button that retries on a real user gesture
    // and surfaces the exact reason.
    enableCam();
    const v = videoRef.current;
    return () => { const cam = window.__shieldCamera; if (cam && v) cam.stopStream(v); };
  }, [enableCam]);

  // Capture works with or without a job. Unassigned shots (cam.wo === '__unassigned'
  // or no jobs at all) save with wo: null and can be attached to a job later.
  const activeWo = cam.wo === '__unassigned' ? null : (wos.find(w => w.id === cam.wo) || wos[0] || null);
  const comp = activeWo ? photoCompliance(activeWo, photos) : null;
  const slot = activeWo && cam.slot && comp.missing.includes(cam.slot) ? cam.slot : null;

  const capture = async () => {
    const cam = window.__shieldCamera;
    // Real capture only — never fabricate a photo. If the camera isn't live,
    // tell the tech to grant access instead of silently saving a mock image.
    if (!live || !cam || !videoRef.current) {
      showToast('Camera not available — allow camera access in your browser, then try again', 'warn');
      return;
    }
    const frame = cam.captureFrame(videoRef.current);
    if (!frame) { showToast('Capture failed — hold steady and try again', 'warn'); return; }
    const id = genId('PH');
    const me = techMe();
    const shot = await cam.savePhoto(frame, { id, wo: activeWo ? activeWo.id : 'unassigned' });
    const photo = {
      id, wo: activeWo ? activeWo.id : null, customer: activeWo ? activeWo.customer : 'Unassigned', site: activeWo ? activeWo.site : '—',
      tech: me.initials || '—', techName: me.name || 'Technician',
      phase: slot ? (slot.toLowerCase().includes('before') || slot === 'Issue found' || slot === 'Site — before' ? 'before' : slot.toLowerCase().includes('after') || slot.toLowerCase().includes('complete') || slot.toLowerCase().includes('final') ? 'after' : 'progress') : phase,
      slot, label: slot || (activeWo ? `Field photo — ${activeWo.customer}` : `Field photo — Unassigned`),
      day: 'Today', time: nowTime(), look: null, pair: null, annotations: [],
      url: (shot && shot.url) || null, dataUrl: (shot && shot.dataUrl) || null,
    };
    photoStore.set(prev => [photo, ...prev]);
    setFlash(true); setTimeout(() => setFlash(false), 180);
    setLastShot(photo);
    setScene(randomLook());
    const after = activeWo ? photoCompliance(activeWo, [photo, ...photos]) : null;
    showToast(slot && after ? `✓ ${slot} captured (${after.done.length}/${after.required.length})` : activeWo ? 'Photo saved to job' : 'Photo saved — attach it to a job from the roll', 'ok');
    if (slot && after) {
      const nextSlot = after.missing[0] || null;
      setCam({ ...cam, slot: nextSlot });
      if (!nextSlot) showToast('All required shots complete', 'ok');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '-16px', height: 'calc(100% + 32px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 0' }}>
        <button onClick={() => setTab('photos')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>← Roll</button>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{activeWo ? activeWo.id : 'UNASSIGNED'}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{activeWo ? `${activeWo.customer} · ${activeWo.site}` : 'attach to a job later'}</div>
        </div>
      </div>

      {/* Slot banner */}
      {slot ? (
        <div style={{ margin: '0 16px', padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-warn)' }}>Required shot: {slot}</span>
          <button onClick={() => setCam({ ...cam, slot: null })} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>skip</button>
        </div>
      ) : activeWo && comp.missing.length > 0 && (
        <div style={{ margin: '0 16px', display: 'flex', gap: 5, overflowX: 'auto' }}>
          {comp.missing.map(s => (
            <button key={s} onClick={() => setCam({ ...cam, slot: s })} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 10, background: 'rgba(63,169,245,0.05)', border: '1px dashed var(--border-strong)', color: 'var(--text-mid)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>○ {s}</button>
          ))}
        </div>
      )}

      {/* Viewfinder */}
      <div style={{ position: 'relative', flex: 1, minHeight: 320, margin: '0 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-strong)', background: '#05070a' }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: live ? 'block' : 'none' }} />
        {!live && (
          <button onClick={enableCam} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#05070a', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 20 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--brand)' }}>◉</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>Tap to start camera</div>
            {camErr && <div style={{ fontSize: 11, color: 'var(--status-warn)', maxWidth: 250, textAlign: 'center', lineHeight: 1.4 }}>{camErr}</div>}
            <div style={{ fontSize: 10, color: 'var(--text-low)', maxWidth: 260, textAlign: 'center', lineHeight: 1.4 }}>If nothing happens, open <span className="mono">tech.shieldtechsolutions.com</span> directly in Safari or Chrome — in-app browsers block the camera.</div>
          </button>
        )}
        {/* rule-of-thirds grid */}
        {[33.3, 66.6].map(p => <div key={'v' + p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(255,255,255,0.12)' }}></div>)}
        {[33.3, 66.6].map(p => <div key={'h' + p} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: 'rgba(255,255,255,0.12)' }}></div>)}
        {/* corner brackets */}
        {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
          <div key={v + h} style={{ position: 'absolute', [v]: 10, [h]: 10, width: 18, height: 18, [`border${v[0].toUpperCase() + v.slice(1)}`]: '2px solid rgba(255,255,255,0.5)', [`border${h[0].toUpperCase() + h.slice(1)}`]: '2px solid rgba(255,255,255,0.5)' }}></div>
        ))}
        {/* auto-tag overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{nowTime()} · GPS ✓ {activeWo ? activeWo.site : 'unassigned'}</span>
          <span className="mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>auto-tagged → {activeWo ? `${activeWo.id} · ${activeWo.customer}` : 'attach to a job later'}</span>
        </div>
        {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.85, animation: 'fade-up 0.18s ease both' }}></div>}
        {/* last shot thumb */}
        {lastShot && (
          <MockPhoto photo={lastShot} stamp={false} onClick={() => setTab('photos')} style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 52, height: 40, borderRadius: 6, border: '2px solid rgba(255,255,255,0.7)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
        )}
      </div>

      {/* Phase + shutter */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!slot && (
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
            {Object.entries(PHOTO_PHASES).map(([k, conf]) => (
              <button key={k} onClick={() => setPhase(k)} style={{ padding: '5px 13px', borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: phase === k ? `${conf.c}1c` : 'transparent', border: `1px solid ${phase === k ? conf.c + '60' : 'var(--border-subtle)'}`, color: phase === k ? conf.c : 'var(--text-low)' }}>{conf.label}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <button onClick={() => { if (live) setFacing(f => f === 'environment' ? 'user' : 'environment'); else enableCam(); }} title={live ? 'Flip camera' : 'Start camera'} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 15, cursor: 'pointer' }}>↻</button>
          <button onClick={capture} style={{ width: 66, height: 66, borderRadius: '50%', background: 'transparent', border: '3px solid #fff', padding: 4, cursor: 'pointer', display: 'flex' }}>
            <div style={{ flex: 1, borderRadius: '50%', background: '#fff', transition: 'transform 0.1s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}></div>
          </button>
          <button onClick={() => setTab('photos')} title="Done" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--status-ok)', fontSize: 14, cursor: 'pointer' }}>✓</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-low)' }}>Offline-safe — photos queue and sync automatically</div>
      </div>
    </div>
  );
}

Object.assign(window, { TechPhotosView, TechCaptureView });

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

  const activeWo = wos.find(w => w.id === cam.wo) || wos[0];
  if (!activeWo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Site Photos</div>
        <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No work orders assigned — photo documentation starts when a job is dispatched to you.</div>
      </div>
    );
  }
  const comp = photoCompliance(activeWo, photos);
  const woPhotos = photos.filter(p => p.wo === activeWo.id);
  const otherPhotos = photos.filter(p => p.tech === techMe().initials && p.wo !== activeWo.id);

  const shootSlot = (slot) => { setCam({ ...cam, wo: activeWo.id, slot }); setTab('capture'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Site Photos</div>
        <button onClick={() => { setCam({ ...cam, slot: null }); setTab('capture'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 14px rgba(63,169,245,0.3)' }}>
          <Icon name="cameras" size={14} color="#fff" /> Camera
        </button>
      </div>

      {/* Job selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {wos.map(w => {
          const on = w.id === activeWo.id;
          return (
            <button key={w.id} onClick={() => setCam({ ...cam, wo: w.id })} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', background: on ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.03)', border: `1px solid ${on ? 'var(--border-strong)' : 'var(--border-subtle)'}`, color: on ? 'var(--brand)' : 'var(--text-mid)', textAlign: 'left' }}>
              <div className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{w.id}</div>
              <div style={{ fontSize: 9, color: on ? 'var(--text-mid)' : 'var(--text-low)' }}>{w.customer}</div>
            </button>
          );
        })}
      </div>

      {/* Required shots */}
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

      {/* This job's roll */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>{activeWo.customer} — {woPhotos.length} photos</div>
        {woPhotos.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic' }}>No photos yet — open the camera to start documenting</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {woPhotos.map(p => <PhotoCard key={p.id} photo={p} hideMeta onClick={() => setLightbox(p.id)} />)}
        </div>
      </div>

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
  const [facing, setFacing] = React.useState('environment');
  React.useEffect(() => {
    let mounted = true;
    const cam = window.__shieldCamera;
    if (cam && videoRef.current) {
      cam.startStream(videoRef.current, facing).then(r => { if (mounted) setLive(!!r.ok); });
    }
    return () => { mounted = false; if (cam && videoRef.current) cam.stopStream(videoRef.current); };
  }, [facing]);

  const activeWo = wos.find(w => w.id === cam.wo) || wos[0];
  if (!activeWo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setTab('photos')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Roll</button>
        <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No work order to attach photos to yet.</div>
      </div>
    );
  }
  const comp = photoCompliance(activeWo, photos);
  const slot = cam.slot && comp.missing.includes(cam.slot) ? cam.slot : null;

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
    const shot = await cam.savePhoto(frame, { id, wo: activeWo.id });
    const photo = {
      id, wo: activeWo.id, customer: activeWo.customer, site: activeWo.site,
      tech: me.initials || '—', techName: me.name || 'Technician',
      phase: slot ? (slot.toLowerCase().includes('before') || slot === 'Issue found' || slot === 'Site — before' ? 'before' : slot.toLowerCase().includes('after') || slot.toLowerCase().includes('complete') || slot.toLowerCase().includes('final') ? 'after' : 'progress') : phase,
      slot, label: slot || `Field photo — ${activeWo.customer}`,
      day: 'Today', time: nowTime(), look: null, pair: null, annotations: [],
      url: (shot && shot.url) || null, dataUrl: (shot && shot.dataUrl) || null,
    };
    photoStore.set(prev => [photo, ...prev]);
    setFlash(true); setTimeout(() => setFlash(false), 180);
    setLastShot(photo);
    setScene(randomLook());
    const after = photoCompliance(activeWo, [photo, ...photos]);
    showToast(slot ? `✓ ${slot} captured (${after.done.length}/${after.required.length})` : 'Photo saved to job', 'ok');
    if (slot) {
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
          <div className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{activeWo.id}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{activeWo.customer} · {activeWo.site}</div>
        </div>
      </div>

      {/* Slot banner */}
      {slot ? (
        <div style={{ margin: '0 16px', padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-warn)' }}>Required shot: {slot}</span>
          <button onClick={() => setCam({ ...cam, slot: null })} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>skip</button>
        </div>
      ) : comp.missing.length > 0 && (
        <div style={{ margin: '0 16px', display: 'flex', gap: 5, overflowX: 'auto' }}>
          {comp.missing.map(s => (
            <button key={s} onClick={() => setCam({ ...cam, slot: s })} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 10, background: 'rgba(63,169,245,0.05)', border: '1px dashed var(--border-strong)', color: 'var(--text-mid)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>○ {s}</button>
          ))}
        </div>
      )}

      {/* Viewfinder */}
      <div style={{ position: 'relative', flex: 1, minHeight: 320, margin: '0 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
        <div style={{ position: 'absolute', inset: 0, background: photoBg(scene), transition: 'background 0.3s' }}></div>
        <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: live ? 'block' : 'none' }} />
        {!live && <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 9, background: 'rgba(0,0,0,0.55)', font: '600 9px/1.4 var(--font-body)', color: 'rgba(255,255,255,0.75)' }}>camera off — allow access for live capture</div>}
        {/* rule-of-thirds grid */}
        {[33.3, 66.6].map(p => <div key={'v' + p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(255,255,255,0.12)' }}></div>)}
        {[33.3, 66.6].map(p => <div key={'h' + p} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: 'rgba(255,255,255,0.12)' }}></div>)}
        {/* corner brackets */}
        {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
          <div key={v + h} style={{ position: 'absolute', [v]: 10, [h]: 10, width: 18, height: 18, [`border${v[0].toUpperCase() + v.slice(1)}`]: '2px solid rgba(255,255,255,0.5)', [`border${h[0].toUpperCase() + h.slice(1)}`]: '2px solid rgba(255,255,255,0.5)' }}></div>
        ))}
        {/* auto-tag overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{nowTime()} · GPS ✓ {activeWo.site}</span>
          <span className="mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>auto-tagged → {activeWo.id} · {activeWo.customer}</span>
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
          <button onClick={() => { if (live) setFacing(f => f === 'environment' ? 'user' : 'environment'); else setScene(randomLook()); }} title="Flip camera" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 15, cursor: 'pointer' }}>↻</button>
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

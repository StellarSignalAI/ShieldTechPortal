/* Site Photos — shared components (mock photo renderer, cards, lightbox, before/after slider)
   Used by ShieldTech Portal, Technician App, and Customer Portal. */

const PHOTO_PHASES = {
  before:   { c: '#94A3B8', label: 'Before' },
  progress: { c: '#3FA9F5', label: 'Progress' },
  after:    { c: '#34D399', label: 'After' },
  issue:    { c: '#F43F5E', label: 'Issue' },
};

/* Deterministic layered-gradient "photo" — abstract site-photo texture, no real imagery */
function photoBg(look) {
  const { h = 210, p = 'wall', s = 1 } = look || {};
  let x = s * 7919 + 11;
  const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  const base = `linear-gradient(${Math.round(120 + rnd() * 100)}deg, hsl(${h},22%,${Math.round(14 + rnd() * 6)}%) 0%, hsl(${(h + 25) % 360},28%,${Math.round(6 + rnd() * 4)}%) 100%)`;
  const layers = [];
  if (p === 'ceiling') {
    layers.push(`repeating-linear-gradient(${Math.round(rnd() * 8 - 4)}deg, rgba(255,255,255,0.035) 0 2px, transparent 2px ${18 + Math.round(rnd() * 14)}px)`);
    layers.push(`radial-gradient(ellipse 120% 60% at ${Math.round(30 + rnd() * 40)}% -10%, rgba(255,255,255,0.10), transparent 60%)`);
  } else if (p === 'rack') {
    layers.push(`repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0 3px, transparent 3px ${10 + Math.round(rnd() * 6)}px)`);
    layers.push(`linear-gradient(90deg, rgba(0,0,0,0.55) 0 12%, transparent 12% 88%, rgba(0,0,0,0.55) 88%)`);
    layers.push(`radial-gradient(circle at ${Math.round(70 + rnd() * 15)}% ${Math.round(20 + rnd() * 20)}%, rgba(52,211,153,0.8) 1.5px, transparent 3px)`);
    layers.push(`radial-gradient(circle at ${Math.round(70 + rnd() * 15)}% ${Math.round(45 + rnd() * 20)}%, rgba(251,191,36,0.8) 1.5px, transparent 3px)`);
  } else if (p === 'wall') {
    layers.push(`linear-gradient(${Math.round(rnd() * 30 + 60)}deg, transparent 55%, rgba(0,0,0,0.35))`);
    layers.push(`radial-gradient(ellipse 80% 100% at ${Math.round(20 + rnd() * 60)}% 0%, rgba(255,255,255,0.07), transparent 55%)`);
  } else if (p === 'exterior') {
    layers.push(`linear-gradient(180deg, hsl(${h},30%,${Math.round(24 + rnd() * 8)}%) 0%, transparent 45%)`);
    layers.push(`linear-gradient(0deg, rgba(0,0,0,0.5) 0 18%, transparent 40%)`);
    layers.push(`repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 2px, transparent 2px ${30 + Math.round(rnd() * 30)}px)`);
  } else if (p === 'panel') {
    layers.push(`linear-gradient(0deg, transparent 20%, rgba(255,255,255,0.05) 50%, transparent 80%)`);
    layers.push(`repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 8px)`);
    layers.push(`radial-gradient(circle at ${Math.round(25 + rnd() * 10)}% ${Math.round(30 + rnd() * 10)}%, rgba(244,63,94,0.7) 1.5px, transparent 3px)`);
  }
  layers.push('radial-gradient(ellipse 140% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)');
  return [...layers, base].join(', ');
}

/* The "photo" itself. children = annotation markers etc. */
function MockPhoto({ photo, stamp = true, style, children, onClick }) {
  const src = photo.url || photo.dataUrl;
  return (
    <div onClick={onClick} style={{ position: 'relative', overflow: 'hidden', background: src ? '#000' : photoBg(photo.look), ...style }}>
      {src && <img src={src} alt={photo.label || 'site photo'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      {children}
      {stamp && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 8px 5px', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
          <span className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.03em' }}>{photo.time} · {photo.day}</span>
          <span className="mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)' }}>{photo.wo}</span>
        </div>
      )}
    </div>
  );
}

/* Numbered annotation marker */
function PhotoMarker({ x, y, n, active }) {
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? '#fff' : '#F43F5E'}`, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>{n}</div>
  );
}

/* Grid thumbnail card */
function PhotoCard({ photo, onClick, hideMeta }) {
  const ph = PHOTO_PHASES[photo.phase] || PHOTO_PHASES.progress;
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }} title={photo.label}>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', transition: 'box-shadow 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 1.5px ${ph.c}`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <MockPhoto photo={photo} style={{ aspectRatio: '4 / 3' }}>
          {photo.annotations.map((a, i) => <PhotoMarker key={i} x={a.x} y={a.y} n={i + 1} />)}
        </MockPhoto>
        <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: '2px 8px 2px 5px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ph.c, display: 'inline-block' }}></span>
          <span style={{ fontSize: 8, fontWeight: 700, color: ph.c, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ph.label}</span>
        </div>
        {photo.slot && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: '2px 7px' }}>
            <span style={{ fontSize: 8, color: 'var(--status-ok)' }}>✓ {photo.slot}</span>
          </div>
        )}
      </div>
      {!hideMeta && (
        <div style={{ padding: '5px 2px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.label}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{photo.customer} · {photo.techName}</div>
        </div>
      )}
    </div>
  );
}

/* Fullscreen lightbox with meta + annotations. canAnnotate → click photo to add markers, edit labels, delete. */
function PhotoLightbox({ photoId, onClose, canAnnotate }) {
  const [photos] = useShieldStore(photoStore);
  const photo = photos.find(p => p.id === photoId);
  const [annotating, setAnnotating] = React.useState(false);
  React.useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  if (!photo) return null;
  const ph = PHOTO_PHASES[photo.phase] || PHOTO_PHASES.progress;

  const addMarker = (e) => {
    if (!annotating) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    photoStore.set(prev => prev.map(p => p.id === photo.id ? { ...p, annotations: [...p.annotations, { x, y, label: 'New note' }] } : p));
  };
  const setMarkerLabel = (i, label) => photoStore.set(prev => prev.map(p => p.id === photo.id ? { ...p, annotations: p.annotations.map((a, ai) => ai === i ? { ...a, label } : a) } : p));
  const removeMarker = (i) => photoStore.set(prev => prev.map(p => p.id === photo.id ? { ...p, annotations: p.annotations.filter((_, ai) => ai !== i) } : p));
  const deletePhoto = () => { photoStore.set(prev => prev.filter(p => p.id !== photo.id)); showToast('Photo deleted', 'warn'); onClose(); };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 950, backdropFilter: 'blur(6px)' }}></div>
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 951, display: 'flex', gap: 0, maxWidth: 'min(1040px, 94vw)', width: '94vw', maxHeight: '88vh', background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        {/* Photo */}
        <div style={{ flex: 2.2, minWidth: 0, position: 'relative', background: '#000' }}>
          <MockPhoto photo={photo} onClick={addMarker} style={{ width: '100%', height: '100%', minHeight: 380, cursor: annotating ? 'crosshair' : 'default' }}>
            {photo.annotations.map((a, i) => <PhotoMarker key={i} x={a.x} y={a.y} n={i + 1} />)}
          </MockPhoto>
          {annotating && (
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: 14, padding: '4px 14px', fontSize: 10, fontWeight: 600, color: '#F43F5E' }}>Tap the photo to drop a marker</div>
          )}
        </div>
        {/* Meta sidebar */}
        <div style={{ flex: 1, minWidth: 250, maxWidth: 300, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: ph.c, display: 'inline-block' }}></span>
              <span style={{ fontSize: 10, fontWeight: 700, color: ph.c, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ph.label}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.35 }}>{photo.label}</div>
          {[
            ['Customer', photo.customer], ['Site', photo.site], ['Work Order', photo.wo],
            ['Technician', photo.techName], ['Captured', `${photo.time} · ${photo.day}`],
            photo.slot ? ['Checklist slot', photo.slot] : null,
          ].filter(Boolean).map(([k, v]) => (
            <div key={k}><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 2 }}>{k}</div><div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{v}</div></div>
          ))}
          {/* Annotations */}
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Annotations
              {canAnnotate && (
                <button onClick={() => setAnnotating(a => !a)} style={{ background: annotating ? 'rgba(244,63,94,0.15)' : 'rgba(63,169,245,0.06)', border: `1px solid ${annotating ? 'rgba(244,63,94,0.4)' : 'var(--border-subtle)'}`, borderRadius: 5, padding: '2px 8px', fontSize: 9, fontWeight: 600, color: annotating ? '#F43F5E' : 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'none', letterSpacing: 0 }}>{annotating ? 'Done' : '+ Annotate'}</button>
              )}
            </div>
            {photo.annotations.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-low)', fontStyle: 'italic' }}>No markers on this photo</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {photo.annotations.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #F43F5E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#F43F5E', flexShrink: 0 }}>{i + 1}</span>
                  {canAnnotate
                    ? <input value={a.label} onChange={e => setMarkerLabel(i, e.target.value)} style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '4px 8px', color: 'var(--text-high)', fontSize: 10, fontFamily: 'var(--font-body)', outline: 'none', minWidth: 0 }} />
                    : <span style={{ fontSize: 10, color: 'var(--text-mid)' }}>{a.label}</span>}
                  {canAnnotate && <button onClick={() => removeMarker(i)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 12, padding: 0 }}>×</button>}
                </div>
              ))}
            </div>
          </div>
          {/* Actions */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
            <button onClick={() => showToast('Shared to customer portal', 'ok')} style={{ padding: '7px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Share to customer</button>
            <button onClick={() => showToast('Added to service report', 'ok')} style={{ padding: '7px 0', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add to report</button>
            {canAnnotate && <button onClick={deletePhoto} style={{ padding: '7px 0', background: 'transparent', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete photo</button>}
          </div>
        </div>
      </div>
    </>
  );
}

/* Draggable before/after comparison slider */
function BeforeAfterSlider({ before, after, height = 230, caption }) {
  const [pos, setPos] = React.useState(50);
  const ref = React.useRef(null);
  const startDrag = (e) => {
    e.preventDefault();
    const move = (ev) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      setPos(Math.max(4, Math.min(96, ((cx - r.left) / r.width) * 100)));
    };
    const up = () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move); window.addEventListener('touchend', up);
  };
  return (
    <div>
      <div ref={ref} style={{ position: 'relative', height, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-subtle)', userSelect: 'none' }}>
        <MockPhoto photo={before} stamp={false} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${pos}%)` }}>
          <MockPhoto photo={after} stamp={false} style={{ position: 'absolute', inset: 0 }} />
        </div>
        {/* Divider */}
        <div onMouseDown={startDrag} onTouchStart={startDrag} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 28, marginLeft: -14, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.6)' }}></div>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#111', fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 2 }}>⇔</div>
        </div>
        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 8px' }}>BEFORE</span>
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: '#34D399', background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 8px' }}>AFTER</span>
      </div>
      {caption && <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-mid)' }}>{caption}</div>}
    </div>
  );
}

/* Group photos into complete before/after pairs */
function completePairs(photos) {
  const byPair = {};
  photos.forEach(p => { if (p.pair) (byPair[p.pair] = byPair[p.pair] || []).push(p); });
  return Object.entries(byPair)
    .map(([id, list]) => ({ id, before: list.find(p => p.phase === 'before'), after: list.find(p => p.phase === 'after') }))
    .filter(p => p.before && p.after);
}

/* Checklist progress for one work order */
function photoCompliance(wo, photos) {
  const required = PHOTO_CHECKLISTS[wo.type] || [];
  const woPhotos = photos.filter(p => p.wo === wo.id);
  const done = required.filter(slot => woPhotos.some(p => p.slot === slot));
  return { required, done, missing: required.filter(s => !done.includes(s)), pct: required.length ? Math.round((done.length / required.length) * 100) : 100 };
}

/* Toast host for apps without their own (Tech App, Customer Portal) */
function ShieldToastHost() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const handler = (e) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev.slice(-3), { id, msg: e.detail.msg, type: e.detail.type || 'info' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    window.addEventListener('shield:toast', handler);
    return () => window.removeEventListener('shield:toast', handler);
  }, []);
  const colors = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', info: 'var(--brand)', error: 'var(--status-critical)' };
  return (
    <div style={{ position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(92vw, 360px)' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: 'var(--modal, #0d1420)', border: '1px solid ' + (colors[t.type] || 'var(--border-strong)'), borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-high)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[t.type], flexShrink: 0 }}></div>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PHOTO_PHASES, photoBg, MockPhoto, PhotoMarker, PhotoCard, PhotoLightbox, BeforeAfterSlider, completePairs, photoCompliance, ShieldToastHost });

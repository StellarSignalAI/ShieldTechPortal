/* Tech App — My Punch List: items assigned to the signed-in tech, check off + photo proof. */

function TechPunchView({ setTab }) {
  const [items] = useShieldStore(punchStore);
  const [photos] = useShieldStore(photoStore);
  const [lightbox, setLightbox] = React.useState(null);
  const meId = (window.__shieldUser && window.__shieldUser.initials) || null;
  const mine = items.filter(i => i.assignee === meId);
  const open = mine.filter(i => i.status === 'open');

  const markDone = (it) => {
    punchStore.set(prev => prev.map(p => p.id === it.id ? { ...p, status: 'done' } : p));
    showToast(`${it.id} marked done — office will verify`, 'ok');
  };
  const reopen = (it) => {
    punchStore.set(prev => prev.map(p => p.id === it.id ? { ...p, status: 'open' } : p));
    showToast(`${it.id} reopened`, 'warn');
  };
  const attachLatest = (it) => {
    const latest = photos.find(p => p.tech === meId);
    if (!latest) { showToast('No photos in your roll yet', 'warn'); return; }
    punchStore.set(prev => prev.map(p => p.id === it.id ? { ...p, photoId: latest.id } : p));
    showToast('Latest photo attached as proof', 'ok');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>My Punch List</div>
        <span className="mono" style={{ fontSize: 11, color: open.length ? 'var(--status-warn)' : 'var(--status-ok)' }}>{open.length} open</span>
      </div>
      {mine.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)' }}>Nothing assigned to you 🎉</div>}
      {mine.map(it => {
        const st = PUNCH_STATUS[it.status] || { c: '#FBBF24', label: it.status };
        const photo = it.photoId ? photos.find(p => p.id === it.photoId) : null;
        const isOpen = it.status === 'open';
        return (
          <div key={it.id} className="glass" style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'flex', gap: 12 }}>
            <button onClick={() => isOpen ? markDone(it) : reopen(it)} title={isOpen ? 'Mark done' : 'Reopen'}
              style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${st.c}`, background: isOpen ? 'transparent' : st.c, color: isOpen ? st.c : '#0a0e14', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              {isOpen ? '' : '✓'}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: isOpen ? 'var(--text-high)' : 'var(--text-low)', textDecoration: isOpen ? 'none' : 'line-through', lineHeight: 1.35 }}>{it.title}</div>
              {it.detail && <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{it.detail}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 9, color: 'var(--brand)' }}>{it.id}</span>
                <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{it.customer}</span>
                <span className="mono" style={{ fontSize: 9, color: it.priority === 'high' ? 'var(--status-critical)' : 'var(--text-low)' }}>due {it.due}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: st.c, background: `${st.c}14`, borderRadius: 6, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{st.label}</span>
              </div>
              {isOpen && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => setTab('capture')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    <Icon name="cameras" size={11} color="var(--brand)" /> Shoot proof
                  </button>
                  <button onClick={() => attachLatest(it)} style={{ padding: '5px 11px', background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Attach latest</button>
                </div>
              )}
            </div>
            {photo && <MockPhoto photo={photo} stamp={false} onClick={() => setLightbox(photo.id)} style={{ width: 56, height: 44, borderRadius: 6, cursor: 'zoom-in', flexShrink: 0, border: '1px solid var(--border-subtle)' }} />}
          </div>
        );
      })}
      {lightbox && <PhotoLightbox photoId={lightbox} onClose={() => setLightbox(null)} canAnnotate />}
    </div>
  );
}

Object.assign(window, { TechPunchView });

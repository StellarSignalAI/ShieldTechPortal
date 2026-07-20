/* Screen — Punch List (admin): Fieldwire-style floor-plan pins + snag list.
   Pins live on a schematic site plan; tasks sync with the techs' app via punchStore.
   (PUNCH_STATUS / PUNCH_TECHS come from shared-state.jsx) */

/* Schematic floor plan — rooms as positioned blocks */
function PunchFloorPlan({ items, selected, onSelect, addMode, onAddAt }) {
  const rooms = [
    { label: 'LOBBY', x: 4, y: 46, w: 30, h: 50 },
    { label: 'TELLER LINE', x: 4, y: 14, w: 38, h: 28 },
    { label: 'VAULT', x: 28, y: 58, w: 22, h: 38, accent: true },
    { label: 'OFFICES', x: 46, y: 14, w: 24, h: 40 },
    { label: 'SERVER / HEAD-END', x: 72, y: 8, w: 24, h: 28, accent: true },
    { label: 'CORRIDOR', x: 52, y: 58, w: 26, h: 20 },
    { label: 'ENTRANCE 3', x: 80, y: 50, w: 16, h: 46 },
  ];
  const handleClick = (e) => {
    if (!addMode) return;
    const r = e.currentTarget.getBoundingClientRect();
    onAddAt({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) });
  };
  return (
    <div onClick={handleClick} style={{ position: 'relative', aspectRatio: '4 / 3', background: 'rgba(5,7,10,0.5)', borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden', cursor: addMode ? 'crosshair' : 'default' }}>
      {/* grid paper */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(63,169,245,0.03) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(63,169,245,0.03) 0 1px, transparent 1px 24px)' }}></div>
      {rooms.map(r => (
        <div key={r.label} style={{ position: 'absolute', left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`, border: `1px solid ${r.accent ? 'rgba(63,169,245,0.3)' : 'rgba(148,163,184,0.18)'}`, background: r.accent ? 'rgba(63,169,245,0.04)' : 'rgba(148,163,184,0.02)', borderRadius: 2 }}>
          <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 8, letterSpacing: '0.08em', color: r.accent ? 'rgba(63,169,245,0.6)' : 'var(--text-low)', fontWeight: 600 }}>{r.label}</span>
        </div>
      ))}
      {/* pins */}
      {items.map((it, i) => {
        const st = PUNCH_STATUS[it.status];
        const sel = selected === it.id;
        return (
          <button key={it.id} onClick={(e) => { e.stopPropagation(); onSelect(sel ? null : it.id); }}
            title={it.title}
            style={{ position: 'absolute', left: `${it.pin.x}%`, top: `${it.pin.y}%`, transform: 'translate(-50%,-50%)', width: sel ? 28 : 22, height: sel ? 28 : 22, borderRadius: '50%', border: `2px solid ${st.c}`, background: sel ? st.c : 'rgba(0,0,0,0.6)', color: sel ? '#0a0e14' : st.c, fontSize: sel ? 11 : 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: sel ? `0 0 14px ${st.c}` : '0 2px 8px rgba(0,0,0,0.5)', transition: 'all 0.15s', zIndex: sel ? 10 : 5, fontFamily: 'var(--font-body)' }}>
            {i + 1}
          </button>
        );
      })}
      {addMode && (
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 12, padding: '3px 12px', fontSize: 10, fontWeight: 600, color: 'var(--status-warn)', pointerEvents: 'none' }}>Click the plan to drop a pin</div>
      )}
    </div>
  );
}

function PunchListScreen() {
  const [items] = useShieldStore(punchStore);
  const [photos] = useShieldStore(photoStore);
  const [selected, setSelected] = React.useState(null);
  const [addMode, setAddMode] = React.useState(false);
  const [draft, setDraft] = React.useState(null); // {x,y} pending pin
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftTech, setDraftTech] = React.useState('MR');
  const [lightbox, setLightbox] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const cycle = (it) => {
    const order = ['open', 'done', 'verified'];
    const next = order[(order.indexOf(it.status) + 1) % order.length];
    punchStore.set(prev => prev.map(p => p.id === it.id ? { ...p, status: next } : p));
    showToast(`${it.id} → ${PUNCH_STATUS[next].label}`, next === 'open' ? 'warn' : 'ok');
  };
  const createItem = () => {
    if (!draftTitle || !draft) return;
    const id = 'PL-' + String(items.length + 1).padStart(2, '0');
    punchStore.set(prev => [...prev, { id, customer: 'Metro Bank Corp', site: '425 Market St', title: draftTitle, detail: '', pin: draft, status: 'open', assignee: draftTech, due: 'Jun 16', photoId: null, priority: 'medium' }]);
    setDraft(null); setDraftTitle(''); setAddMode(false); setSelected(id);
    showToast(`${id} created — assigned to ${PUNCH_TECHS[draftTech].name}`, 'ok');
  };
  const removeItem = (id) => { punchStore.set(prev => prev.filter(p => p.id !== id)); if (selected === id) setSelected(null); showToast(`${id} removed`, 'warn'); };

  const shown = statusFilter === 'all' ? items : items.filter(i => i.status === statusFilter);
  const counts = { open: items.filter(i => i.status === 'open').length, done: items.filter(i => i.status === 'done').length, verified: items.filter(i => i.status === 'verified').length };
  const pct = items.length ? Math.round(((counts.done + counts.verified) / items.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)' }}>Metro Bank Corp — Install Walkthrough</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>425 Market St · WO-2847 · punch created Jun 11</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: pct === 100 ? 'var(--status-ok)' : 'var(--text-high)' }}>{pct}%</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)', letterSpacing: '0.08em' }}>BURNED DOWN</div>
          </div>
          <div style={{ width: 120, height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--status-ok)' : 'var(--brand)', borderRadius: 3, transition: 'width 0.3s' }}></div>
          </div>
          <button onClick={() => { setAddMode(a => !a); setDraft(null); }} style={{ padding: '7px 14px', background: addMode ? 'rgba(251,191,36,0.12)' : 'rgba(63,169,245,0.08)', border: `1px solid ${addMode ? 'rgba(251,191,36,0.4)' : 'var(--border-strong)'}`, borderRadius: 8, color: addMode ? 'var(--status-warn)' : 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{addMode ? 'Cancel pin' : '+ Add pin'}</button>
          <button onClick={() => showToast('Punch list sent for customer sign-off', 'ok')} disabled={counts.open > 0} style={{ padding: '7px 14px', background: counts.open === 0 ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.05)', border: `1px solid ${counts.open === 0 ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`, borderRadius: 8, color: counts.open === 0 ? 'var(--status-ok)' : 'var(--text-low)', fontSize: 11, fontWeight: 600, cursor: counts.open === 0 ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }} title={counts.open > 0 ? `${counts.open} items still open` : 'Send to customer'}>Customer sign-off →</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* Floor plan */}
        <div className="glass" style={{ padding: 14 }}>
          <PunchFloorPlan items={items} selected={selected} onSelect={setSelected} addMode={addMode} onAddAt={setDraft} />
          {/* Draft form */}
          {draft && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input autoFocus value={draftTitle} onChange={e => setDraftTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createItem(); }} placeholder="What needs fixing at this pin?"
                style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-strong)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
              <select value={draftTech} onChange={e => setDraftTech(e.target.value)} style={{ background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 10px', color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
                {Object.entries(PUNCH_TECHS).map(([id, t]) => <option key={id} value={id}>{t.name}</option>)}
              </select>
              <button onClick={createItem} disabled={!draftTitle} style={{ padding: '8px 16px', background: draftTitle ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.04)', border: '1px solid var(--border-strong)', borderRadius: 7, color: draftTitle ? 'var(--brand)' : 'var(--text-low)', fontSize: 11, fontWeight: 600, cursor: draftTitle ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>Create</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {Object.entries(PUNCH_STATUS).map(([k, s]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-low)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${s.c}`, display: 'inline-block' }}></span>{s.label} ({counts[k]})
              </span>
            ))}
          </div>
        </div>

        {/* Task list */}
        <div className="glass" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
            {['all', 'open', 'done', 'verified'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: '4px 11px', borderRadius: 11, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize', background: statusFilter === f ? 'rgba(63,169,245,0.15)' : 'transparent', border: `1px solid ${statusFilter === f ? 'var(--border-strong)' : 'var(--border-subtle)'}`, color: statusFilter === f ? 'var(--brand)' : 'var(--text-low)' }}>{f}</button>
            ))}
          </div>
          {shown.map((it) => {
            const st = PUNCH_STATUS[it.status];
            const tech = PUNCH_TECHS[it.assignee];
            const num = items.indexOf(it) + 1;
            const sel = selected === it.id;
            const photo = it.photoId ? photos.find(p => p.id === it.photoId) : null;
            return (
              <div key={it.id} onClick={() => setSelected(sel ? null : it.id)}
                style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: sel ? 'rgba(63,169,245,0.06)' : 'rgba(5,7,10,0.4)', border: `1px solid ${sel ? 'var(--border-strong)' : 'var(--border-subtle)'}`, transition: 'all 0.12s' }}>
                <button onClick={(e) => { e.stopPropagation(); cycle(it); }} title={`Status: ${st.label} — click to advance`}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${st.c}`, background: it.status !== 'open' ? st.c : 'transparent', color: it.status !== 'open' ? '#0a0e14' : st.c, fontSize: 9, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
                  {it.status === 'open' ? num : '✓'}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: it.status === 'open' ? 'var(--text-high)' : 'var(--text-low)', textDecoration: it.status === 'open' ? 'none' : 'line-through', lineHeight: 1.3 }}>{it.title}</div>
                  {it.detail && <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 1 }}>{it.detail}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: tech.color }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: `${tech.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 700 }}>{it.assignee}</span>
                      {tech.name.split(' ')[0]}
                    </span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>due {it.due}</span>
                    {it.priority === 'high' && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.1)', borderRadius: 6, padding: '1px 6px' }}>HIGH</span>}
                    <button onClick={(e) => { e.stopPropagation(); removeItem(it.id); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 11, padding: 0, opacity: 0.6 }}>×</button>
                  </div>
                </div>
                {photo && (
                  <MockPhoto photo={photo} stamp={false} onClick={(e) => { e.stopPropagation(); setLightbox(photo.id); }} style={{ width: 52, height: 40, borderRadius: 6, cursor: 'zoom-in', flexShrink: 0, border: '1px solid var(--border-subtle)' }} />
                )}
              </div>
            );
          })}
          {shown.length === 0 && <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-low)' }}>No {statusFilter} items</div>}
        </div>
      </div>

      {lightbox && <PhotoLightbox photoId={lightbox} onClose={() => setLightbox(null)} canAnnotate />}
    </div>
  );
}

Object.assign(window, { PunchListScreen });

/* Survey Scan — Docs tab: media (photos/video/360) pinned to plan, issues,
   signal readings, coverage zones with auto quantities. */

/* Mini plan with typed pins */
function SVPinMap({ floor, pins, height = 150 }) {
  const b = ssBounds(floor.rooms);
  const pad = 3, W = b.x2 - b.x1 + pad * 2, H = b.y2 - b.y1 + pad * 2;
  return (
    <div className="glass" style={{ borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <SSPlanThumb floor={floor} height={height} />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {pins.map(p => (
          <g key={p.id} transform={`translate(${p.x - b.x1 + pad},${p.y - b.y1 + pad})`}>
            {p.poly
              ? <polygon points={p.poly.map(q => `${q[0] - b.x1 + pad - (p.x - b.x1 + pad)},${q[1] - b.y1 + pad - (p.y - b.y1 + pad)}`).join(' ')} fill={p.c + '2e'} stroke={p.c} strokeWidth="0.35" strokeDasharray="1 0.7" />
              : <>
                  <circle r="1.7" fill={p.c + '33'} stroke={p.c} strokeWidth="0.35" />
                  <text y="0.8" textAnchor="middle" fontSize="2" fill={p.c} fontWeight="700">{p.glyph}</text>
                </>}
          </g>
        ))}
      </svg>
    </div>
  );
}

const svMediaGlyph = { photo: '⧇', video: '▶', '360': '◍' };

function SV2Docs({ project, floor, updateFloor }) {
  const [sub, setSub] = React.useState('Media');
  const [viewer, setViewer] = React.useState(null);
  const [addIssue, setAddIssue] = React.useState(false);
  const [addReading, setAddReading] = React.useState(false);

  const media = floor.photos || [], issues = floor.issues || [], readings = floor.readings || [], zones = floor.zones || [];
  const pins =
    sub === 'Media'    ? media.map(m => ({ id: m.id, x: m.x, y: m.y, c: m.kind === '360' ? '#c084fc' : m.kind === 'video' ? '#FBBF24' : '#3FA9F5', glyph: svMediaGlyph[m.kind || 'photo'] })) :
    sub === 'Issues'   ? issues.map(i => ({ id: i.id, x: i.x, y: i.y, c: SV_SEV[i.sev].c, glyph: '!' })) :
    sub === 'Readings' ? readings.map(r => ({ id: r.id, x: r.x, y: r.y, c: svReading(r.kind).color, glyph: '·' })) :
    zones.map(z => ({ id: z.id, x: ssCentroid(z.poly)[0], y: ssCentroid(z.poly)[1], poly: z.poly, c: svZone(z.type).c }));

  const card = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <MSegment options={['Media', 'Issues', 'Readings', 'Coverage']} value={sub} onChange={setSub} />
      <SVPinMap floor={floor} pins={pins} />

      {sub === 'Media' && <>
        <div style={{ display: 'flex', gap: 7 }}>
          {[['⧇ Photo', 'photo'], ['▶ Video', 'video'], ['◍ 360°', '360']].map(([lbl, kind]) => (
            <button key={kind} onClick={() => {
              const [cx, cy] = ssCentroid(floor.rooms[0] ? floor.rooms[0].poly : [[5, 5]]);
              updateFloor({ ...floor, photos: [...media, { id: ssId('p'), x: cx + Math.random() * 4, y: cy + Math.random() * 3, kind, label: `${kind === '360' ? '360° panorama' : kind === 'video' ? 'Video clip' : 'Photo'} — ${floor.rooms[0] ? floor.rooms[0].name : floor.label}`, hue: Math.floor(Math.random() * 360), dur: kind === 'video' ? '0:31' : undefined }] });
              showToast(`${kind === '360' ? '360° capture' : kind} pinned to plan`, 'ok');
            }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.06)', color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{lbl}</button>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center', marginTop: -3 }}>Pairs with Ricoh Theta / Insta360 for one-tap panoramas pinned where you stand.</div>
        {media.map(m => (
          <div key={m.id} className="glass" onClick={() => setViewer(m)} style={{ ...card, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 34, borderRadius: 8, flexShrink: 0, background: `linear-gradient(150deg, hsl(${m.hue},30%,40%), hsl(${m.hue},35%,22%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{svMediaGlyph[m.kind || 'photo']}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{m.label}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{(m.kind || 'photo') === '360' ? '360° panorama · tap to walk it' : m.kind === 'video' ? `video · ${m.dur || '0:30'}` : 'photo · markup available'} · pinned on plan</div>
            </div>
            <MBadge color={m.kind === '360' ? '#c084fc' : m.kind === 'video' ? '#FBBF24' : 'var(--brand)'}>{m.kind || 'photo'}</MBadge>
          </div>
        ))}
      </>}

      {sub === 'Issues' && <>
        <button onClick={() => setAddIssue(true)} style={{ padding: '11px 0', borderRadius: 10, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>＋ Flag an issue on this floor</button>
        {issues.map(i => (
          <div key={i.id} className="glass" style={{ padding: '11px 13px', borderRadius: 11, borderLeft: `3px solid ${SV_SEV[i.sev].c}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{i.title}</span>
              <MBadge color={SV_SEV[i.sev].c}>{SV_SEV[i.sev].label}</MBadge>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 3 }}>{i.room} · {i.note}</div>
          </div>
        ))}
      </>}

      {sub === 'Readings' && <>
        <button onClick={() => setAddReading(true)} style={{ padding: '11px 0', borderRadius: 10, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>＋ Take a reading at my position</button>
        {readings.map(r => {
          const k = svReading(r.kind), ok = k.good(r.val);
          return (
            <div key={r.id} className="glass" style={card}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: k.color + '18', border: `1px solid ${k.color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: k.color }}>≋</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{r.label}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{k.label} · mapped on plan</div>
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: ok ? 'var(--status-ok)' : 'var(--status-warn)' }}>{r.val} <span style={{ fontSize: 9, fontWeight: 400 }}>{k.unit}</span></span>
            </div>
          );
        })}
      </>}

      {sub === 'Coverage' && <>
        {zones.map(z => {
          const zt = svZone(z.type), area = Math.round(ssArea(z.poly));
          return (
            <div key={z.id} className="glass" style={card}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: zt.c + '18', border: `1px solid ${zt.c}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: zt.c }}>◱</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{z.label}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{zt.label} · quantities auto-computed from plan</div>
              </div>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: zt.c }}>{area} ft²</span>
            </div>
          );
        })}
        {(() => {
          const tot = floor.rooms.reduce((a, r) => a + ssArea(r.poly), 0);
          const cov = zones.filter(z => z.type !== 'gap').reduce((a, z) => a + ssArea(z.poly), 0);
          const pct = tot ? Math.min(100, Math.round((cov / tot) * 100)) : 0;
          return (
            <div className="glass" style={{ padding: '12px 14px', borderRadius: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-mid)', fontWeight: 600 }}>Floor coverage — {floor.label}</span>
                <span className="mono" style={{ color: pct > 60 ? 'var(--status-ok)' : 'var(--status-warn)', fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.1)' }}>
                <div style={{ width: pct + '%', height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--brand), var(--status-ok))' }}></div>
              </div>
            </div>
          );
        })()}
      </>}

      {viewer && <SVMediaViewer media={viewer} onClose={() => setViewer(null)} />}
      {addIssue && <SVAddIssue floor={floor} updateFloor={updateFloor} onClose={() => setAddIssue(false)} />}
      {addReading && <SVAddReading floor={floor} updateFloor={updateFloor} onClose={() => setAddReading(false)} />}
    </div>
  );
}

/* Full-screen media viewer — 360 gets a draggable pan */
function SVMediaViewer({ media, onClose }) {
  const [pan, setPan] = React.useState(0);
  const drag = React.useRef(null);
  const is360 = media.kind === '360';
  return (
    <div style={{ ...ssOverlay }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>{media.label}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>
      <div
        onPointerDown={e => { drag.current = { x: e.clientX, p: pan }; }}
        onPointerMove={e => { if (drag.current) setPan(drag.current.p + (e.clientX - drag.current.x) * 0.6); }}
        onPointerUp={() => { drag.current = null; }}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', touchAction: 'none', cursor: is360 ? 'grab' : 'default',
          background: `linear-gradient(160deg, hsl(${media.hue},28%,30%), hsl(${media.hue},32%,12%))` }}>
        {is360 && <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, hsla(${media.hue},40%,60%,0.12) 0 2px, transparent 2px 90px), repeating-linear-gradient(0deg, hsla(${media.hue},40%,60%,0.08) 0 2px, transparent 2px 70px)`, backgroundPositionX: pan + 'px', transition: drag.current ? 'none' : 'background-position-x 0.15s' }}></div>}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.75)' }}>
          <span style={{ fontSize: 40 }}>{svMediaGlyph[media.kind || 'photo']}</span>
          <span style={{ fontSize: 11 }}>{is360 ? 'Drag to look around — placeholder panorama' : media.kind === 'video' ? `Tap to play · ${media.dur || '0:30'}` : 'Photo placeholder — markup tools below'}</span>
        </div>
        {is360 && <div className="mono" style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{Math.round(((pan % 360) + 360) % 360)}° heading</div>}
      </div>
      {!is360 && media.kind !== 'video' && (
        <div style={{ display: 'flex', gap: 7, padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
          {['✎ Draw', '→ Arrow', '▢ Box', 'T Text'].map(t => (
            <button key={t} onClick={() => showToast('Markup added to photo', 'ok')} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.06)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SVAddIssue({ floor, updateFloor, onClose }) {
  const [title, setTitle] = React.useState('');
  const [sev, setSev] = React.useState('med');
  const [room, setRoom] = React.useState(floor.rooms[0] ? floor.rooms[0].name : '');
  const inp = { width: '100%', padding: '10px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
  return (
    <MSheet title="Flag an issue" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's wrong here?" style={inp} />
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(SV_SEV).map(([k, v]) => (
            <button key={k} onClick={() => setSev(k)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid', borderColor: sev === k ? v.c : 'var(--border-subtle)', background: sev === k ? v.c + '1c' : 'transparent', color: sev === k ? v.c : 'var(--text-mid)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v.label}</button>
          ))}
        </div>
        <select value={room} onChange={e => setRoom(e.target.value)} style={inp}>
          {floor.rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <button onClick={() => {
          if (!title.trim()) { showToast('Describe the issue first', 'warn'); return; }
          const rm = floor.rooms.find(r => r.name === room) || floor.rooms[0];
          const [cx, cy] = rm ? ssCentroid(rm.poly) : [5, 5];
          updateFloor({ ...floor, issues: [...(floor.issues || []), { id: ssId('is'), x: cx, y: cy, sev, room, title: title.trim(), note: 'Flagged on-site' }] });
          showToast('Issue pinned to ' + room, 'ok'); onClose();
        }} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Pin issue to plan</button>
      </div>
    </MSheet>
  );
}

function SVAddReading({ floor, updateFloor, onClose }) {
  const [kind, setKind] = React.useState('wifi');
  const k = svReading(kind);
  const val = kind === 'wifi' ? -(55 + Math.floor(Math.random() * 25)) : kind === 'lte' ? -(80 + Math.floor(Math.random() * 25)) : kind === 'link' ? 850 + Math.floor(Math.random() * 120) : 90 + Math.floor(Math.random() * 60);
  return (
    <MSheet title="Take a signal reading" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {SV_READINGS.map(r => (
            <button key={r.kind} onClick={() => setKind(r.kind)} style={{ padding: '11px 0', borderRadius: 10, border: '1px solid', borderColor: kind === r.kind ? r.color : 'var(--border-subtle)', background: kind === r.kind ? r.color + '18' : 'transparent', color: kind === r.kind ? r.color : 'var(--text-mid)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{r.label}</button>
          ))}
        </div>
        <div className="glass" style={{ padding: '16px 14px', borderRadius: 12, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: k.color }}>{val} <span style={{ fontSize: 12, fontWeight: 400 }}>{k.unit}</span></div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)', marginTop: 3 }}>Live from device radio · Bluetooth meters (Tramex-style) pair in Tools</div>
        </div>
        <button onClick={() => {
          const rm = floor.rooms[0]; const [cx, cy] = rm ? ssCentroid(rm.poly) : [5, 5];
          updateFloor({ ...floor, readings: [...(floor.readings || []), { id: ssId('rd'), x: cx + Math.random() * 5, y: cy + Math.random() * 4, kind, val, label: `${k.label} — field reading` }] });
          showToast('Reading mapped on plan', 'ok'); onClose();
        }} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save at my position</button>
      </div>
    </MSheet>
  );
}

Object.assign(window, { SVPinMap, SV2Docs, SVMediaViewer, SVAddIssue, SVAddReading, svMediaGlyph });

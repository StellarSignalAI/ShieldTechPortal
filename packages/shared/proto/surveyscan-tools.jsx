/* Survey Scan — tools: forms/checklists/SOPs tab, laser meter pairing,
   field↔office sync sheet, 3D & elevation view sheet. */

/* ── Forms / Checklists / SOP tab ── */
function SV2Forms({ project, update }) {
  const [pick, setPick] = React.useState(false);
  const lists = project.checklists || [];
  const toggle = (clId, idx) => update({ ...project, checklists: lists.map(c => c.id === clId ? { ...c, items: c.items.map((it, i) => i === idx ? { ...it, done: !it.done } : it) } : c) });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={() => setPick(true)} style={{ padding: '12px 0', borderRadius: 11, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>＋ Apply a template to this survey</button>
      {lists.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 11.5, borderRadius: 12, lineHeight: 1.5 }}>Standardize your walkthroughs — apply a form, checklist or SOP template and fill it room by room.</div>}
      {lists.map(cl => {
        const done = cl.items.filter(i => i.done).length;
        return (
          <div key={cl.id} className="glass" style={{ borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)' }}>{cl.name}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{cl.kind}{cl.room ? ` · ${cl.room}` : ''} · {done}/{cl.items.length} complete</div>
              </div>
              <MBadge color={done === cl.items.length ? 'var(--status-ok)' : 'var(--status-warn)'}>{done === cl.items.length ? 'complete' : 'in progress'}</MBadge>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.1)', margin: '9px 0 10px' }}>
              <div style={{ width: (done / cl.items.length) * 100 + '%', height: '100%', borderRadius: 2, background: 'var(--status-ok)', transition: 'width 0.25s' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {cl.items.map((it, i) => (
                <button key={i} onClick={() => toggle(cl.id, i)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 2px', background: 'none', border: 'none', borderBottom: '1px solid rgba(63,169,245,0.05)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, border: '1.5px solid', borderColor: it.done ? 'var(--status-ok)' : 'var(--border-strong)', background: it.done ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--status-ok)' }}>{it.done ? '✓' : ''}</span>
                  <span style={{ fontSize: 11.5, color: it.done ? 'var(--text-low)' : 'var(--text-mid)', textDecoration: it.done ? 'line-through' : 'none' }}>{it.t}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {pick && (
        <MSheet title="Template library" onClose={() => setPick(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {SV_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => {
                update({ ...project, checklists: [...lists, { id: ssId('cl'), tpl: t.id, name: t.name, kind: t.kind, items: t.items.map(x => ({ t: x, done: false })) }] });
                showToast(`"${t.name}" applied`, 'ok'); setPick(false);
              }} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'rgba(63,169,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--brand)' }}>{t.kind === 'SOP' ? '¶' : t.kind === 'Form' ? '≡' : '☑'}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-low)' }}>{t.kind} · {t.items.length} items · reusable across surveys</span>
                </span>
                <span style={{ color: 'var(--text-low)' }}>›</span>
              </button>
            ))}
            <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center', padding: '4px 10px' }}>Templates are managed in Survey Cloud and shared with the whole team.</div>
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* ── Laser meter pairing sheet ── */
function SVLaser({ onClose }) {
  const [prefs] = useShieldStore(surveyPrefsStore);
  const [scanning, setScanning] = React.useState(false);
  const [found, setFound] = React.useState([]);
  const scan = () => {
    setScanning(true); setFound([]);
    setTimeout(() => setFound([{ id: 'DISTO-D2-4471', name: 'Leica DISTO D2', batt: 84 }, { id: 'GLM50C-0912', name: 'Bosch GLM 50 C', batt: 61 }]), 1600);
    setTimeout(() => setScanning(false), 1700);
  };
  return (
    <MSheet title="Laser distance meter" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {prefs.laser ? (
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 12, border: '1px solid rgba(52,211,153,0.35)' }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--status-ok)' }}>✓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{prefs.laser.name}</div>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{prefs.laser.id} · battery {prefs.laser.batt}% · measurements flow into corner mode</div>
            </div>
            <button onClick={() => { surveyPrefsStore.set(s => ({ ...s, laser: null })); showToast('Meter disconnected'); }} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-mid)', fontSize: 10.5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Forget</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>Pair a Bluetooth laser meter — trigger a measurement on the meter and the value lands on the wall you're sketching. Works with Leica DISTO and Bosch GLM.</div>
            <button onClick={scan} style={{ padding: '12px 0', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{scanning ? '◌ Scanning for meters…' : '⌖ Scan for meters'}</button>
            {found.map(m => (
              <button key={m.id} onClick={() => { surveyPrefsStore.set(s => ({ ...s, laser: m })); showToast(m.name + ' paired ✓', 'ok'); }} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <span style={{ fontSize: 14, color: 'var(--brand)' }}>⌖</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{m.name}</span>
                  <span className="mono" style={{ display: 'block', fontSize: 9.5, color: 'var(--text-low)' }}>{m.id} · battery {m.batt}%</span>
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--brand)', fontWeight: 600 }}>Pair ›</span>
              </button>
            ))}
          </>
        )}
      </div>
    </MSheet>
  );
}

/* ── Field ↔ office sync sheet ── */
function SVSync({ project, onClose }) {
  const feed = project.sync || [];
  return (
    <MSheet title="Survey Cloud sync" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--status-ok)', boxShadow: '0 0 8px var(--status-ok)' }}></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>Live — synced</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>Office sees every room, pin & reading in real time. Offline capture queues and syncs when you're back on signal.</div>
          </div>
        </div>
        {feed.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <span style={{ fontSize: 11, color: e.dir === 'up' ? 'var(--brand)' : '#c084fc', flexShrink: 0 }}>{e.dir === 'up' ? '↑' : '↓'}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1 }}>{e.t}</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)', flexShrink: 0 }}>{e.who.split(' ')[0]} · {e.time}</span>
          </div>
        ))}
        <button onClick={() => { showToast('Share link copied — office & customer can view read-only', 'ok'); }} style={{ padding: '12px 0', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⧉ Copy shareable project link</button>
      </div>
    </MSheet>
  );
}

/* ── 2D / 3D / Elevation views sheet (isometric extrusion from captured polys) ── */
function SVViews({ floor, onClose }) {
  const [mode, setMode] = React.useState('3D');
  const b = ssBounds(floor.rooms);
  const iso = ([x, y], z = 0) => [(x - y) * 0.72, (x + y) * 0.38 - z * 2.1];
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  floor.rooms.forEach(r => r.poly.forEach(p => { [0, r.h || 9].forEach(z => { const [ix, iy] = iso(p, z); minX = Math.min(minX, ix); minY = Math.min(minY, iy); maxX = Math.max(maxX, ix); maxY = Math.max(maxY, iy); }); }));
  const pad = 4;
  return (
    <MSheet title="Plan views" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MSegment options={['2D', '3D', 'Elevation']} value={mode} onChange={setMode} />
        {mode === '2D' && <SSPlanThumb floor={floor} height={230} />}
        {mode === '3D' && (
          <div className="glass" style={{ borderRadius: 12, padding: 10 }}>
            <svg viewBox={`${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`} style={{ width: '100%', height: 230 }}>
              {[...floor.rooms].sort((a, b2) => ssCentroid(a.poly)[0] + ssCentroid(a.poly)[1] - ssCentroid(b2.poly)[0] - ssCentroid(b2.poly)[1]).map(r => {
                const h = r.h || 9;
                const top = r.poly.map(p => iso(p, h));
                const base = r.poly.map(p => iso(p, 0));
                return (
                  <g key={r.id}>
                    {ssEdges(r.poly).map(([p, q], i) => (
                      <polygon key={i} points={[iso(p, 0), iso(q, 0), iso(q, h), iso(p, h)].map(v => v.join(',')).join(' ')} fill="rgba(63,169,245,0.10)" stroke="rgba(63,169,245,0.55)" strokeWidth="0.3" />
                    ))}
                    <polygon points={top.map(v => v.join(',')).join(' ')} fill="rgba(63,169,245,0.05)" stroke="rgba(63,169,245,0.8)" strokeWidth="0.35" />
                    <polygon points={base.map(v => v.join(',')).join(' ')} fill="none" stroke="rgba(63,169,245,0.3)" strokeWidth="0.25" strokeDasharray="1 0.8" />
                    <text transform={`translate(${iso(ssCentroid(r.poly), h)[0]},${iso(ssCentroid(r.poly), h)[1] - 1.5})`} textAnchor="middle" fontSize="2.4" fill="var(--text-mid)" fontFamily="var(--font-body)">{r.name}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Live 3D model from your scan — wall heights from capture. Exports as OBJ / USDZ.</div>
          </div>
        )}
        {mode === 'Elevation' && (
          <div className="glass" style={{ borderRadius: 12, padding: 12 }}>
            {floor.rooms.map(r => {
              const per = ssPerim(r.poly), h = r.h || 9;
              return (
                <div key={r.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 3 }}>{r.name} — unrolled walls</div>
                  <svg viewBox={`0 0 ${per} ${h + 2}`} style={{ width: '100%', height: 52 }} preserveAspectRatio="none">
                    <rect x="0" y="1" width={per} height={h} fill="rgba(63,169,245,0.06)" stroke="rgba(63,169,245,0.5)" strokeWidth="0.25" />
                    {(floor.doors || []).filter(d => d.room === r.id).map((d, i) => {
                      const off = (per / ((floor.doors || []).filter(x => x.room === r.id).length + 1)) * (i + 1);
                      return d.kind === 'door'
                        ? <rect key={d.id} x={off} y={h - 6} width={d.w} height="6.2" fill="rgba(52,211,153,0.18)" stroke="var(--status-ok)" strokeWidth="0.22" />
                        : <rect key={d.id} x={off} y={3} width={d.w} height="4" fill="rgba(251,191,36,0.16)" stroke="var(--status-warn)" strokeWidth="0.22" />;
                    })}
                    <text x="0.7" y={h - 0.6} fontSize="1.8" fill="var(--text-low)" fontFamily="var(--font-mono, monospace)">{h}′ × {Math.round(per)}′ = {Math.round(per * h)} ft² wall</text>
                  </svg>
                </div>
              );
            })}
            <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Wall areas feed conduit, paint-back & patch quantities in the estimate.</div>
          </div>
        )}
      </div>
    </MSheet>
  );
}

Object.assign(window, { SV2Forms, SVLaser, SVSync, SVViews });

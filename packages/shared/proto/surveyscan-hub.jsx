/* Survey Scan — hub (2 layout variations) + project shell tying together:
   capture, plan, docs, forms, estimate, AR, export, AI capture, laser, sync, views. */

function MSurveyScan({ onNav }) {
  const [projects] = useShieldStore(siteScanStore);
  const [prefs] = useShieldStore(surveyPrefsStore);
  const [openId, setOpenId] = React.useState(null);
  const [wizard, setWizard] = React.useState(false);
  if (openId) {
    const p = projects.find(x => x.id === openId);
    if (p) return <SV2Project project={p} onClose={() => setOpenId(null)} onNav={onNav} />;
  }
  const totRooms = projects.reduce((a, p) => a + p.floors.reduce((s, f) => s + f.rooms.length, 0), 0);
  const totDev = projects.reduce((a, p) => a + ssTotals(p).devices, 0);
  const totIssues = projects.reduce((a, p) => a + p.floors.reduce((s, f) => s + (f.issues || []).length, 0), 0);

  const newBtn = (
    <button onClick={() => setWizard(true)} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◉ New Survey Scan</button>
  );

  /* Layout B: capability grid + compact project rows */
  if (prefs.hubLayout === 'grid') {
    const feats = [
      ['◉', 'Capture', 'LiDAR · corner · laser'], ['⊞', 'Plan', '2D · 3D · elevation'],
      ['⧇', 'Document', 'Photos · 360° · issues'], ['≋', 'Readings', 'Wi-Fi · LTE · PoE'],
      ['☑', 'Forms', 'Checklists & SOPs'], ['Σ', 'Estimate', 'Quote on-site'],
      ['✦', 'ShieldTech AI', 'Walk-and-talk'], ['⇅', 'Sync', 'Field ↔ office'],
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {newBtn}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {feats.map(([g, t, s], i) => (
            <div key={t} className="glass" style={{ padding: '11px 12px', borderRadius: 11, animation: `fade-up 0.3s ease ${i * 40}ms both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--brand)' }}>{g}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)' }}>{t}</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>
        <MSection title="Surveys">
          {projects.map(p => {
            const t = ssTotals(p);
            return <MRow key={p.id} title={p.customer} sub={`${p.site} · ${t.rooms} rooms · ${t.area.toLocaleString()} ft² · ${t.devices} devices`} right={p.status} accent={p.status === 'complete' ? 'var(--status-ok)' : 'var(--status-warn)'} onClick={() => setOpenId(p.id)} />;
          })}
        </MSection>
        {wizard && <SSWizard onClose={() => setWizard(false)} onCreate={id => { setWizard(false); setOpenId(id); }} />}
      </div>
    );
  }

  /* Layout A (default): workflow — KPI strip + rich plan cards */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['SURVEYS', projects.length, 'var(--brand)'], ['ROOMS', totRooms, 'var(--brand)'], ['DEVICES', totDev, 'var(--status-ok)'], ['ISSUES', totIssues, totIssues ? 'var(--status-warn)' : 'var(--status-ok)']]} />
      {newBtn}
      {projects.map(p => {
        const t = ssTotals(p);
        const est = svEstimate(p);
        const issues = p.floors.reduce((a, f) => a + (f.issues || []).length, 0);
        const media = p.floors.reduce((a, f) => a + (f.photos || []).length, 0);
        return (
          <div key={p.id} onClick={() => setOpenId(p.id)} className="glass" style={{ borderRadius: 12, cursor: 'pointer', overflow: 'hidden' }}>
            <SSPlanThumb floor={p.floors[0]} height={110} />
            <div style={{ padding: '10px 13px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.id}</span>
                <MBadge color={p.status === 'complete' ? 'var(--status-ok)' : 'var(--status-warn)'}>{p.status}</MBadge>
                <MBadge color={svStatusColor(est.status)}>est {est.status}</MBadge>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{p.created}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)', marginTop: 3 }}>{p.customer}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.site} · {p.floors.length} floor{p.floors.length > 1 ? 's' : ''} · {t.rooms} rooms · {t.area.toLocaleString()} ft²</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 7, fontSize: 9.5 }}>
                <span style={{ color: 'var(--brand)' }}>⧇ {media} media</span>
                <span style={{ color: issues ? 'var(--status-warn)' : 'var(--text-low)' }}>⚑ {issues} issues</span>
                <span style={{ color: 'var(--status-ok)', marginLeft: 'auto' }} className="mono">${(est.total / 1000).toFixed(1)}K est</span>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center', padding: '2px 12px' }}>Scan → document → estimate → report, all on-site. Everything syncs live to Survey Cloud for office review.</div>
      {wizard && <SSWizard onClose={() => setWizard(false)} onCreate={id => { setWizard(false); setOpenId(id); }} />}
    </div>
  );
}

/* ── Project shell ── */
function SV2Project({ project, onClose, onNav }) {
  const [prefs] = useShieldStore(surveyPrefsStore);
  const [tab, setTab] = React.useState(project.floors.some(f => f.rooms.length) ? 'Plan' : 'Capture');
  const [floorIdx, setFloorIdx] = React.useState(0);
  const [capture, setCapture] = React.useState(false);
  const [vr, setVr] = React.useState(false);
  const [ai, setAi] = React.useState(false);
  const [laser, setLaser] = React.useState(false);
  const [sync, setSync] = React.useState(false);
  const [views, setViews] = React.useState(false);
  const floor = project.floors[floorIdx] || project.floors[0];
  const t = ssTotals(project);

  const update = next => siteScanStore.set(list => list.map(p => p.id === (typeof next === 'function' ? project.id : next.id) ? (typeof next === 'function' ? next(p) : next) : p));
  const updateFloor = nf => update({ ...project, floors: project.floors.map((f, i) => i === floorIdx ? nf : f) });

  const addRoom = ({ rooms }) => {
    let nf = { ...floor, objects: floor.objects || [] };
    rooms.forEach(r => {
      const [ox, oy] = ssNextOffset(nf);
      const rid = ssId('r');
      nf = {
        ...nf,
        rooms: [...nf.rooms, { id: rid, name: r.name, mode: r.mode, h: r.h, poly: r.poly.map(p => [p[0] + ox, p[1] + oy]) }],
        doors: [...(nf.doors || []), ...(r.doors || []).map(d => ({ ...d, id: ssId('d'), room: rid, label: d.kind === 'door' ? 'Doorway' : 'Window' }))],
        objects: [...(nf.objects || []), ...(r.objects || []).map(o => ({ ...o, id: ssId('o'), x: o.x + ox, y: o.y + oy }))],
      };
    });
    updateFloor(nf);
    setCapture(false);
    showToast(`${rooms.length} room${rooms.length > 1 ? 's' : ''} added to the plan`, 'ok');
  };
  const addFloor = () => {
    const n = project.floors.length + 1;
    update({ ...project, floors: [...project.floors, { id: 'F' + n, label: `Floor ${n}`, rooms: [], doors: [], devices: [], cables: [], photos: [] }] });
    setFloorIdx(project.floors.length);
    showToast(`Floor ${n} added`, 'ok');
  };
  const placeFromVR = (type, x, y) => {
    const d = ssDev(type);
    const n = (floor.devices || []).filter(v => v.type === type).length + 1;
    updateFloor({ ...floor, devices: [...(floor.devices || []), { id: ssId('v'), type, x, y, z: type === 'dome' || type === 'motion' ? 9 : 4.5, label: `${d.label.split(' ')[0].slice(0, 3).toUpperCase()}-${String(n).padStart(2, '0')}` }] });
    showToast(`${d.label} placed in ${floor.label}`, 'ok');
  };

  const floorChips = (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      {project.floors.map((f, i) => (
        <button key={f.id} onClick={() => setFloorIdx(i)} style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 16, border: '1px solid', borderColor: i === floorIdx ? 'var(--border-strong)' : 'var(--border-subtle)', background: i === floorIdx ? 'rgba(63,169,245,0.14)' : 'transparent', color: i === floorIdx ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          {f.label} <span className="mono" style={{ fontSize: 9, opacity: 0.7 }}>· {f.rooms.length}</span>
        </button>
      ))}
      <button onClick={addFloor} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 16, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-low)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>＋ Floor</button>
    </div>
  );

  const TABS = ['Capture', 'Plan', 'Docs', 'Forms', 'Estimate', 'AR', 'Export'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.customer}</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{project.site} · <span className="mono">{project.id}</span> · {t.area.toLocaleString()} ft²</div>
        </div>
        <button onClick={() => setLaser(true)} title="Laser meter" style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border-subtle)', background: prefs.laser ? 'rgba(52,211,153,0.12)' : 'rgba(63,169,245,0.06)', color: prefs.laser ? 'var(--status-ok)' : 'var(--text-mid)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>⌖</button>
        <button onClick={() => setSync(true)} title="Survey Cloud sync" style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.06)', cursor: 'pointer', flexShrink: 0, position: 'relative', color: 'var(--text-mid)', fontSize: 12 }}>
          ⇅<span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--status-ok)' }}></span>
        </button>
      </div>

      {/* ShieldTech AI capture — hero */}
      {prefs.aiCapture && (
        <button onClick={() => setAi(true)} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 12, border: '1px solid rgba(192,132,252,0.35)', background: 'linear-gradient(120deg, rgba(192,132,252,0.10), rgba(63,169,245,0.06))', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(192,132,252,0.14)', border: '1px solid rgba(192,132,252,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#c084fc' }}>✦</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)' }}>Walk & talk with ShieldTech AI</span>
            <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-low)' }}>Speak as you scan — issues, scope & notes file themselves</span>
          </span>
          <span style={{ color: '#c084fc', fontSize: 14 }}>›</span>
        </button>
      )}

      {/* tab chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 9, border: '1px solid', borderColor: tab === tb ? 'var(--border-strong)' : 'var(--border-subtle)', background: tab === tb ? 'rgba(63,169,245,0.14)' : 'transparent', color: tab === tb ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{tb}</button>
        ))}
      </div>

      {tab === 'Capture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {floorChips}
          <button onClick={() => setCapture(true)} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◉ Scan — {floor.label}</button>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center', marginTop: -4 }}>LiDAR auto-scan · corner mode for furnished rooms · laser-assisted manual sketch{prefs.laser ? ` · ${prefs.laser.name} connected` : ''}</div>
          {floor.rooms.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 11.5, borderRadius: 12, lineHeight: 1.5 }}>No rooms on this floor yet.<br />Walls, doors, windows & obstructions land on the plan as you move.</div>}
          {floor.rooms.map(r => (
            <div key={r.id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--brand)', flexShrink: 0 }}>{r.mode === 'corner' ? '⊹' : '◉'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{r.name}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{Math.round(ssArea(r.poly))} ft² · {ssFt(ssPerim(r.poly))} walls · {r.h || 9}′ ceiling · {r.mode === 'corner' ? 'corner mode' : 'LiDAR auto-scan'}</div>
              </div>
              <MBadge color="var(--status-ok)">captured</MBadge>
            </div>
          ))}
          <div className="glass" style={{ display: 'flex', gap: 0, borderRadius: 12, padding: '10px 0' }}>
            {[['Devices', (floor.devices || []).length], ['Objects', (floor.objects || []).length], ['Media', (floor.photos || []).length], ['Issues', (floor.issues || []).length], ['Readings', (floor.readings || []).length]].map(([k, v]) => (
              <div key={k} style={{ flex: 1, textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{v}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>{floorChips}</div>
            <button onClick={() => setViews(true)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.06)', color: 'var(--brand)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>2D/3D ▾</button>
          </div>
          {floor.rooms.length === 0
            ? <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 11.5, borderRadius: 12 }}>Capture a room first — the blueprint builds itself as you scan.</div>
            : <SSPlanEditor key={project.id + floor.id} floor={floor} onChange={updateFloor} onCaptureRoom={() => setCapture(true)} />}
        </div>
      )}

      {tab === 'Docs' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{floorChips}<SV2Docs project={project} floor={floor} updateFloor={updateFloor} /></div>}
      {tab === 'Forms' && <SV2Forms project={project} update={update} />}
      {tab === 'Estimate' && <SV2Estimate project={project} update={update} onNav={onNav} />}

      {tab === 'AR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {floorChips}
          <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ height: 130, background: 'radial-gradient(ellipse at 50% 80%, rgba(63,169,245,0.22) 0%, rgba(6,12,20,0.9) 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1].map(i => <div key={i} style={{ width: 74, height: 52, borderRadius: 12, border: '2px solid rgba(63,169,245,0.6)', background: 'linear-gradient(160deg, rgba(63,169,245,0.15), rgba(10,20,32,0.8))', boxShadow: '0 0 24px rgba(63,169,245,0.25)' }}></div>)}
              </div>
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>Walk the site in AR</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-low)', lineHeight: 1.5, margin: '4px 0 12px' }}>First-person walkthrough of {floor.label} built from your scan. Place and check devices from inside; 360° panoramas open where they're pinned.</div>
              <button onClick={() => setVr(true)} disabled={!floor.rooms.length} style={{ width: '100%', padding: '13px 0', background: floor.rooms.length ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'rgba(63,169,245,0.1)', border: 'none', borderRadius: 12, color: floor.rooms.length ? '#fff' : 'var(--text-low)', fontSize: 13.5, fontWeight: 700, cursor: floor.rooms.length ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>⬡ Enter AR walkthrough</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Export' && <SSExport project={project} onNav={onNav} update={update} />}

      {capture && <SSCapture floorLabel={floor.label} roomCount={floor.rooms.length} onDone={addRoom} onCancel={() => setCapture(false)} />}
      {vr && <SSVR project={project} floorIdx={floorIdx} onFloorIdx={setFloorIdx} onPlaceDevice={placeFromVR} onClose={() => setVr(false)} />}
      {ai && <SVAICapture project={project} update={update} floor={floor} updateFloor={updateFloor} onClose={() => setAi(false)} />}
      {laser && <SVLaser onClose={() => setLaser(false)} />}
      {sync && <SVSync project={project} onClose={() => setSync(false)} />}
      {views && <SVViews floor={floor} onClose={() => setViews(false)} />}
    </div>
  );
}

Object.assign(window, { MSurveyScan, SV2Project });

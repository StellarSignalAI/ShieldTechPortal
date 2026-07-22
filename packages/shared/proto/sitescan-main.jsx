/* SiteScan — main screen: project list, capture-to-blueprint workflow shell.
   Tabs: Rooms (capture) · Plan (2D editor) · VR (walkthrough) · Export (Studio / Project / PDF / Estimator). */

function MSiteScan({ onNav }) {
  const [projects] = useShieldStore(siteScanStore);
  const [openId, setOpenId] = React.useState(null);
  const [wizard, setWizard] = React.useState(false);
  if (openId) {
    const p = projects.find(x => x.id === openId);
    if (p) return <SSProject project={p} onClose={() => setOpenId(null)} onNav={onNav} />;
  }
  const totRooms = projects.reduce((a, p) => a + p.floors.reduce((s, f) => s + f.rooms.length, 0), 0);
  const totDev = projects.reduce((a, p) => a + ssTotals(p).devices, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['SCANS', projects.length, 'var(--brand)'], ['ROOMS', totRooms, 'var(--brand)'], ['DEVICES', totDev, 'var(--status-ok)']]} />
      <button onClick={() => setWizard(true)} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◉ New SiteScan</button>
      {projects.map(p => {
        const t = ssTotals(p);
        return (
          <div key={p.id} onClick={() => setOpenId(p.id)} className="glass" style={{ borderRadius: 12, cursor: 'pointer', overflow: 'hidden' }}>
            <SSPlanThumb floor={p.floors[0]} height={110} />
            <div style={{ padding: '10px 13px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.id}</span>
                <MBadge color={p.status === 'complete' ? 'var(--status-ok)' : 'var(--status-warn)'}>{p.status}</MBadge>
                {p.pushed && p.pushed.length > 0 && <MBadge color="#c084fc">→ studio</MBadge>}
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{p.created}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)', marginTop: 3 }}>{p.customer}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.site} · {p.floors.length} floor{p.floors.length > 1 ? 's' : ''} · {t.rooms} rooms · {t.area.toLocaleString()} ft² · {t.devices} devices · {t.cableFt} ft cable</div>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center', padding: '2px 12px' }}>Scan rooms with corner-tap or LiDAR, place devices on the blueprint, walk it in AR — then push to Design Studio or straight to an estimate.</div>
      {wizard && <SSWizard onClose={() => setWizard(false)} onCreate={id => { setWizard(false); setOpenId(id); }} />}
    </div>
  );
}

/* ── New scan wizard ── */
function SSWizard({ onClose, onCreate }) {
  const [custs] = useShieldStore(customerStore);
  const [customer, setCustomer] = React.useState('');
  const [site, setSite] = React.useState('');
  const [floorLabel, setFloorLabel] = React.useState('Ground Floor');
  const inp = { width: '100%', padding: '10px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };
  const create = () => {
    if (!customer.trim()) { showToast('Add a customer first', 'warn'); return; }
    const id = 'SS-' + (Math.floor(Math.random() * 800) + 1300);
    siteScanStore.set(list => [{
      id, customer: customer.trim(), site: site.trim() || 'Main site', created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'in-progress', pushed: [], projectLink: null,
      floors: [{ id: 'F1', label: floorLabel || 'Ground Floor', rooms: [], doors: [], devices: [], cables: [], photos: [] }],
    }, ...list]);
    onCreate(id);
  };
  return (
    <MSheet title="New SiteScan" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label><span style={lbl}>Prospect / Customer *</span>
          <CustomerSelect value={customer} onChange={(v) => setCustomer(v)} style={inp} placeholder="Select or add customer…" />
        </label>
        <label><span style={lbl}>Site / Building</span><input value={site} onChange={e => setSite(e.target.value)} placeholder="e.g. Main Campus — Bldg A" style={inp} /></label>
        <label><span style={lbl}>First floor name</span><input value={floorLabel} onChange={e => setFloorLabel(e.target.value)} style={inp} /></label>
        <button onClick={create} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Start scanning →</button>
      </div>
    </MSheet>
  );
}

/* ── Project shell ── */
function SSProject({ project, onClose, onNav }) {
  const [tab, setTab] = React.useState(project.floors.some(f => f.rooms.length) ? 'plan' : 'rooms');
  const [floorIdx, setFloorIdx] = React.useState(0);
  const [capture, setCapture] = React.useState(false);
  const [vr, setVr] = React.useState(false);
  const floor = project.floors[floorIdx] || project.floors[0];
  const t = ssTotals(project);

  const update = next => siteScanStore.set(list => list.map(p => p.id === next.id ? next : p));
  const updateFloor = nf => update({ ...project, floors: project.floors.map((f, i) => i === floorIdx ? nf : f) });

  const addRoom = ({ rooms, opts }) => {
    let nf = { ...floor, objects: floor.objects || [] };
    let totObj = 0;
    rooms.forEach(r => {
      const [ox, oy] = ssNextOffset(nf);
      const rid = ssId('r');
      nf = {
        ...nf,
        rooms: [...nf.rooms, { id: rid, name: r.name, mode: r.mode, h: r.h, poly: r.poly.map(p => [p[0] + ox, p[1] + oy]) }],
        doors: [...(nf.doors || []), ...(r.doors || []).map(d => ({ ...d, id: ssId('d'), room: rid, label: d.kind === 'door' ? 'Doorway' : 'Window' }))],
        objects: [...(nf.objects || []), ...(r.objects || []).map(o => ({ ...o, id: ssId('o'), x: o.x + ox, y: o.y + oy }))],
      };
      totObj += (r.objects || []).length;
    });
    updateFloor(nf);
    setCapture(false);
    showToast(`${rooms.length} room${rooms.length > 1 ? 's' : ''} added · ${totObj} objects documented`, 'ok');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.customer}</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{project.site} · <span className="mono">{project.id}</span></div>
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--status-ok)', flexShrink: 0 }}>{t.area.toLocaleString()} ft²</span>
      </div>

      <MSegment options={['Rooms', 'Plan', 'AR', 'Export']} value={{ rooms: 'Rooms', plan: 'Plan', vr: 'AR', export: 'Export' }[tab]} onChange={v => setTab(v === 'AR' ? 'vr' : v.toLowerCase())} />

      {tab === 'rooms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {floorChips}
          <button onClick={() => setCapture(true)} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◉ AR scan — {floor.label}</button>
          {floor.rooms.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 11.5, borderRadius: 12, lineHeight: 1.5 }}>No rooms on this floor yet.<br />Auto-Scan detects walls, openings & obstructions as you move; Corner Mode lets you tap corners through furniture.</div>}
          {floor.rooms.map(r => (
            <div key={r.id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--brand)', flexShrink: 0 }}>{r.mode === 'corner' ? '⊹' : '◉'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{r.name}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{Math.round(ssArea(r.poly))} ft² · {ssFt(ssPerim(r.poly))} walls · {r.h || 9}′ ceiling · {r.mode === 'corner' ? 'corner mode' : 'AR auto-scan'}</div>
              </div>
              <MBadge color="var(--status-ok)">captured</MBadge>
            </div>
          ))}
          <div className="glass" style={{ display: 'flex', gap: 0, borderRadius: 12, padding: '10px 0' }}>
            {[['Devices', (floor.devices || []).length], ['Objects', (floor.objects || []).length], ['Doors', (floor.doors || []).filter(d => d.kind === 'door').length], ['Cable', ssCableFt(floor) + 'ft'], ['Photos', (floor.photos || []).length]].map(([k, v]) => (
              <div key={k} style={{ flex: 1, textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{v}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {floorChips}
          {floor.rooms.length === 0
            ? <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 11.5, borderRadius: 12 }}>Capture a room first — the blueprint builds itself as you scan.</div>
            : <SSPlanEditor key={project.id + floor.id} floor={floor} onChange={updateFloor} onCaptureRoom={() => setCapture(true)} />}
        </div>
      )}

      {tab === 'vr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {floorChips}
          <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ height: 130, background: 'radial-gradient(ellipse at 50% 80%, rgba(63,169,245,0.22) 0%, rgba(6,12,20,0.9) 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1].map(i => <div key={i} style={{ width: 74, height: 52, borderRadius: 12, border: '2px solid rgba(63,169,245,0.6)', background: 'linear-gradient(160deg, rgba(63,169,245,0.15), rgba(10,20,32,0.8))', boxShadow: '0 0 24px rgba(63,169,245,0.25)' }}></div>)}
              </div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 3, height: 40, background: 'rgba(63,169,245,0.4)', borderRadius: 2 }}></div>
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>Walk the site in AR</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-low)', lineHeight: 1.5, margin: '4px 0 12px' }}>First-person AR walkthrough of {floor.label} built from your scan. Switch to Headset mode for stereo split-screen, or 360° for room panoramas. Place and check devices from inside the walkthrough.</div>
              <button onClick={() => setVr(true)} disabled={!floor.rooms.length} style={{ width: '100%', padding: '13px 0', background: floor.rooms.length ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'rgba(63,169,245,0.1)', border: 'none', borderRadius: 12, color: floor.rooms.length ? '#fff' : 'var(--text-low)', fontSize: 13.5, fontWeight: 700, cursor: floor.rooms.length ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>⬡ Enter AR walkthrough</button>
            </div>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center' }}>{t.devices} devices across {project.floors.length} floor{project.floors.length > 1 ? 's' : ''} will render in-world</div>
        </div>
      )}

      {tab === 'export' && <SSExport project={project} onNav={onNav} update={update} />}

      {capture && <SSCapture floorLabel={floor.label} roomCount={floor.rooms.length} onDone={addRoom} onCancel={() => setCapture(false)} />}
      {vr && <SSVR project={project} floorIdx={floorIdx} onFloorIdx={setFloorIdx} onPlaceDevice={placeFromVR} onClose={() => setVr(false)} />}
    </div>
  );
}

Object.assign(window, { MSiteScan, SSWizard, SSProject });

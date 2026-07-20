/* Sales Engineering Tools — Site Survey, Cable Calc, Bandwidth Calc, Labor Estimator, Competitive Compare, RMR Calc */
/* Each tool has an AI Estimate button (⟡ ShieldTech AI) */

/* ══════════════════════════════════════════════════════════════
   SITE SURVEY TOOL
   ══════════════════════════════════════════════════════════════ */
function SiteSurveyTool() {
  const [customer, setCustomer] = React.useState('Metro Bank Corp');
  const [rooms, setRooms] = React.useState([
    { id: 1, name: 'Main Lobby', cameras: 2, accessPts: 1, readers: 1, ceilingH: 10, mountType: 'Ceiling', conduit: true, existingEquip: 'None', notes: 'Open floor plan, high foot traffic', photos: 1 },
    { id: 2, name: 'Server Room', cameras: 1, accessPts: 0, readers: 1, ceilingH: 9, mountType: 'Wall', conduit: true, existingEquip: 'Old NVR (Dahua)', notes: 'Climate controlled, raised floor', photos: 2 },
    { id: 3, name: 'Parking Lot', cameras: 3, accessPts: 0, readers: 0, ceilingH: 0, mountType: 'Pole', conduit: false, existingEquip: 'None', notes: 'Outdoor, need vandal-proof housings', photos: 0 },
  ]);
  const [addRoom, setAddRoom] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const totals = { cameras: rooms.reduce((s,r) => s+r.cameras, 0), accessPts: rooms.reduce((s,r) => s+r.accessPts, 0), readers: rooms.reduce((s,r) => s+r.readers, 0) };

  const removeRoom = (id) => setRooms(prev => prev.filter(r => r.id !== id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Site Survey</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Room-by-room walkthrough → auto-generate scope of work</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <ShieldAIEstimateBtn label="AI: Complete Survey" onClick={() => showToast('⟡ ShieldTech AI analyzing floor plan and suggesting camera placement, cable runs, and mounting types...')} />
          <button onClick={() => showToast('Scope of work generated from survey')} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Generate Scope of Work</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{l:'Rooms',v:rooms.length},{l:'Cameras',v:totals.cameras},{l:'Access Points',v:totals.accessPts},{l:'Readers',v:totals.readers},{l:'Photos',v:rooms.reduce((s,r)=>s+r.photos,0)}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)' }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Room cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rooms.map(room => (
          <GlassPanel key={room.id} style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{room.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Ceiling: {room.ceilingH}ft · Mount: {room.mountType} · {room.conduit ? 'Conduit' : 'Surface run'}</div>
              </div>
              <button onClick={() => removeRoom(room.id)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
              {[{l:'Cameras',v:room.cameras},{l:'APs',v:room.accessPts},{l:'Readers',v:room.readers},{l:'Existing',v:room.existingEquip},{l:'Photos',v:room.photos}].map((f,i) => (
                <div key={i}>
                  <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{f.l}</div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{f.v}</div>
                </div>
              ))}
            </div>
            {room.notes && <div style={{ fontSize: 11, color: 'var(--text-mid)', fontStyle: 'italic', padding: '6px 0', borderTop: '1px solid rgba(63,169,245,0.04)' }}>▤ {room.notes}</div>}
          </GlassPanel>
        ))}
        <button onClick={() => { setRooms(prev => [...prev, { id: Date.now(), name: `Room ${rooms.length+1}`, cameras: 0, accessPts: 0, readers: 0, ceilingH: 9, mountType: 'Ceiling', conduit: true, existingEquip: 'None', notes: '', photos: 0 }]); }} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Room</button>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CABLE CALCULATOR
   ══════════════════════════════════════════════════════════════ */
function CableCalculator() {
  const [runs, setRuns] = React.useState([
    { id: 1, from: 'IDF Closet', to: 'Main Entrance CAM', type: 'Cat6', distance: 120, qty: 1 },
    { id: 2, from: 'IDF Closet', to: 'Parking Lot CAMs', type: 'Cat6', distance: 250, qty: 3 },
    { id: 3, from: 'IDF Closet', to: 'Server Room', type: 'Cat6a', distance: 45, qty: 2 },
    { id: 4, from: 'IDF Closet', to: 'Lobby AP', type: 'Cat6', distance: 80, qty: 1 },
    { id: 5, from: 'MDF', to: 'IDF Closet', type: 'Fiber SM', distance: 400, qty: 2 },
  ]);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const [wastePercent, setWastePercent] = React.useState(15);

  const cableTypes = { 'Cat5e': 0.12, 'Cat6': 0.18, 'Cat6a': 0.35, 'Fiber SM': 0.85, 'Fiber MM': 0.65, 'Coax RG59': 0.15 };

  const totalFeet = runs.reduce((s, r) => s + r.distance * r.qty, 0);
  const withWaste = Math.ceil(totalFeet * (1 + wastePercent / 100));
  const totalCost = runs.reduce((s, r) => s + r.distance * r.qty * (cableTypes[r.type] || 0.18), 0) * (1 + wastePercent / 100);

  const removeRun = (id) => setRuns(prev => prev.filter(r => r.id !== id));
  const updateRun = (id, field, val) => setRuns(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));

  const inputStyle = { padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Cable Calculator</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Cable runs, quantities, conduit, and cost estimates</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <ShieldAIEstimateBtn label="AI: Estimate Runs" onClick={() => showToast('⟡ ShieldTech AI estimating cable runs from floor plan and device placement...')} />
          <button onClick={() => showToast('BOM exported')} style={{ padding: '6px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export BOM</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{l:'Total Runs',v:runs.reduce((s,r)=>s+r.qty,0)},{l:'Total Cable',v:`${withWaste.toLocaleString()} ft`},{l:'Waste Factor',v:`${wastePercent}%`},{l:'Est. Cost',v:`$${totalCost.toFixed(0)}`}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: i===3?'var(--status-ok)':'var(--brand)' }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['From','To','Type','Distance (ft)','Qty','Subtotal','Cost',''].map((h,i) => (
              <th key={i} style={{ textAlign: i>2?'right':'left', padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {runs.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><input value={r.from} onChange={e => updateRun(r.id,'from',e.target.value)} style={{...inputStyle, width: 100}} /></td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><input value={r.to} onChange={e => updateRun(r.id,'to',e.target.value)} style={{...inputStyle, width: 120}} /></td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <select value={r.type} onChange={e => updateRun(r.id,'type',e.target.value)} style={{...inputStyle, width: 90}}>
                    {Object.keys(cableTypes).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}><input type="number" value={r.distance} onChange={e => updateRun(r.id,'distance',parseInt(e.target.value)||0)} style={{...inputStyle, width: 60, textAlign: 'right'}} /></td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}><input type="number" value={r.qty} onChange={e => updateRun(r.id,'qty',parseInt(e.target.value)||1)} style={{...inputStyle, width: 40, textAlign: 'right'}} /></td>
                <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 11 }}>{(r.distance*r.qty).toLocaleString()} ft</td>
                <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 11, color: 'var(--status-ok)' }}>${(r.distance*r.qty*(cableTypes[r.type]||0.18)).toFixed(0)}</td>
                <td style={{ padding: '6px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><button onClick={() => removeRun(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer' }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 10px' }}>
          <button onClick={() => setRuns(prev => [...prev, { id: Date.now(), from: '', to: '', type: 'Cat6', distance: 0, qty: 1 }])} style={{ padding: '6px 12px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Run</button>
        </div>
      </GlassPanel>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BANDWIDTH & STORAGE CALCULATOR
   ══════════════════════════════════════════════════════════════ */
function BandwidthCalculator() {
  const [cameras, setCameras] = React.useState([
    { id: 1, name: 'Axis P3265-V', resolution: '4MP', fps: 30, codec: 'H.265', qty: 4 },
    { id: 2, name: 'Axis Q6135-LE PTZ', resolution: '2MP', fps: 30, codec: 'H.265', qty: 1 },
    { id: 3, name: 'Verkada CD52', resolution: '5MP', fps: 30, codec: 'H.265', qty: 2 },
  ]);
  const [retentionDays, setRetentionDays] = React.useState(30);
  const [motionPct, setMotionPct] = React.useState(50);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const bitrateMap = { '1MP': { 'H.264': 2, 'H.265': 1.2 }, '2MP': { 'H.264': 4, 'H.265': 2.5 }, '4MP': { 'H.264': 8, 'H.265': 4.5 }, '5MP': { 'H.264': 10, 'H.265': 5.5 }, '8MP': { 'H.264': 16, 'H.265': 9 } };

  const getBitrate = (cam) => {
    const base = bitrateMap[cam.resolution]?.[cam.codec] || 4;
    return base * (cam.fps / 30);
  };

  const totalBandwidth = cameras.reduce((s, c) => s + getBitrate(c) * c.qty, 0);
  const dailyGB = (totalBandwidth * 3600 * 24 * (motionPct / 100)) / 8 / 1000;
  const totalStorageTB = (dailyGB * retentionDays / 1000).toFixed(1);
  const inputStyle = { padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Bandwidth & Storage Calculator</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Camera bandwidth, NVR storage, and network requirements</div>
        </div>
        <ShieldAIEstimateBtn label="AI: Optimize Settings" onClick={() => showToast('⟡ ShieldTech AI recommending optimal resolution/FPS/codec per camera based on use case...')} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{l:'Total Bandwidth',v:`${totalBandwidth.toFixed(1)} Mbps`},{l:'Daily Storage',v:`${dailyGB.toFixed(0)} GB`},{l:`${retentionDays}-Day Storage`,v:`${totalStorageTB} TB`},{l:'Cameras',v:cameras.reduce((s,c)=>s+c.qty,0)}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: i===2?'var(--status-ok)':'var(--brand)' }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12 }}>
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Camera','Resolution','FPS','Codec','Qty','Bitrate',''].map((h,i) => (
                <th key={i} style={{ textAlign: i>3?'right':'left', padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {cameras.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    <select value={c.resolution} onChange={e => setCameras(prev => prev.map(x => x.id===c.id?{...x,resolution:e.target.value}:x))} style={{...inputStyle, width: 60}}>
                      {['1MP','2MP','4MP','5MP','8MP'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    <select value={c.fps} onChange={e => setCameras(prev => prev.map(x => x.id===c.id?{...x,fps:parseInt(e.target.value)}:x))} style={{...inputStyle, width: 50}}>
                      {[10,15,20,25,30].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    <select value={c.codec} onChange={e => setCameras(prev => prev.map(x => x.id===c.id?{...x,codec:e.target.value}:x))} style={{...inputStyle, width: 60}}>
                      {['H.264','H.265'].map(co => <option key={co}>{co}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}>
                    <input type="number" value={c.qty} onChange={e => setCameras(prev => prev.map(x => x.id===c.id?{...x,qty:parseInt(e.target.value)||1}:x))} style={{...inputStyle, width: 40, textAlign: 'right'}} />
                  </td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 11, color: 'var(--brand)' }}>{(getBitrate(c)*c.qty).toFixed(1)} Mbps</td>
                  <td style={{ padding: '6px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><button onClick={() => setCameras(prev => prev.filter(x => x.id!==c.id))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '8px 10px' }}>
            <button onClick={() => setCameras(prev => [...prev, { id: Date.now(), name: 'New Camera', resolution: '4MP', fps: 30, codec: 'H.265', qty: 1 }])} style={{ padding: '6px 12px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Camera</button>
          </div>
        </GlassPanel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 6 }}>RETENTION</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[14,30,60,90].map(d => (
                <button key={d} onClick={() => setRetentionDays(d)} style={{ flex: 1, padding: '6px', borderRadius: 4, fontSize: 11, background: retentionDays===d?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${retentionDays===d?'var(--brand)':'var(--border-subtle)'}`, color: retentionDays===d?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{d}d</button>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 6 }}>MOTION ACTIVITY</div>
            <input type="range" min={10} max={100} value={motionPct} onChange={e => setMotionPct(parseInt(e.target.value))} style={{ width: '100%' }} />
            <div className="mono" style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-mid)' }}>{motionPct}% recording time</div>
          </GlassPanel>
          <GlassPanel style={{ borderLeft: '3px solid var(--status-ok)' }}>
            <div className="label-sm" style={{ marginBottom: 4 }}>RECOMMENDED NVR</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{parseFloat(totalStorageTB) < 4 ? 'Axis S3008 (8TB)' : parseFloat(totalStorageTB) < 10 ? 'Axis S3016 (16TB)' : 'Axis S3048 (48TB)'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Supports {cameras.reduce((s,c)=>s+c.qty,0)} cameras at current settings</div>
          </GlassPanel>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LABOR ESTIMATOR
   ══════════════════════════════════════════════════════════════ */
function LaborEstimator() {
  const [buildingType, setBuildingType] = React.useState('retrofit');
  const [ceilingAccess, setCeilingAccess] = React.useState('drop');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const [items, setItems] = React.useState([
    { id: 1, type: 'Camera — Fixed Dome', qty: 6, hoursEach: 2.5 },
    { id: 2, type: 'Camera — PTZ', qty: 1, hoursEach: 4 },
    { id: 3, type: 'Card Reader', qty: 4, hoursEach: 1.5 },
    { id: 4, type: 'Door Strike / Maglock', qty: 4, hoursEach: 2 },
    { id: 5, type: 'NVR Setup & Config', qty: 1, hoursEach: 4 },
    { id: 6, type: 'Cable Run (per 100ft)', qty: 12, hoursEach: 1 },
    { id: 7, type: 'Switch / Patch Panel', qty: 1, hoursEach: 2 },
  ]);

  const buildingMultiplier = buildingType === 'new' ? 0.8 : buildingType === 'retrofit' ? 1.0 : 1.3;
  const ceilingMultiplier = ceilingAccess === 'drop' ? 1.0 : ceilingAccess === 'hard' ? 1.4 : 0.9;
  const laborRate = 85;

  const rawHours = items.reduce((s, i) => s + i.qty * i.hoursEach, 0);
  const adjustedHours = Math.ceil(rawHours * buildingMultiplier * ceilingMultiplier);
  const crewDays = (adjustedHours / 8 / 2).toFixed(1); // 2-person crew
  const totalCost = adjustedHours * laborRate;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Labor Estimator</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Device counts → install hours, crew days, labor cost</div>
        </div>
        <ShieldAIEstimateBtn label="AI: Estimate Labor" onClick={() => showToast('⟡ ShieldTech AI analyzing project scope and generating labor estimate based on similar past jobs...')} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{l:'Raw Hours',v:rawHours.toFixed(0)+'h'},{l:'Adjusted Hours',v:adjustedHours+'h'},{l:'Crew Days (2-man)',v:crewDays+'d'},{l:'Labor Cost',v:'$'+totalCost.toLocaleString()}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: i===3?'var(--status-ok)':'var(--brand)' }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12 }}>
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Task/Device','Qty','Hours Each','Subtotal',''].map((h,i) => (
                <th key={i} style={{ textAlign: i>0?'right':'left', padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{item.type}</td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 12 }}>{item.qty}</td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 12 }}>{item.hoursEach}h</td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 12, color: 'var(--brand)' }}>{(item.qty * item.hoursEach).toFixed(1)}h</td>
                  <td style={{ padding: '6px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><button onClick={() => setItems(prev => prev.filter(x => x.id!==item.id))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 6 }}>BUILDING TYPE</div>
            {[{id:'new',l:'New Construction',m:'0.8x'},{id:'retrofit',l:'Retrofit',m:'1.0x'},{id:'historic',l:'Historic/Difficult',m:'1.3x'}].map(b => (
              <button key={b.id} onClick={() => setBuildingType(b.id)} style={{ display: 'block', width: '100%', padding: '5px 8px', marginBottom: 3, borderRadius: 4, fontSize: 11, textAlign: 'left', background: buildingType===b.id?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${buildingType===b.id?'var(--brand)':'var(--border-subtle)'}`, color: buildingType===b.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{b.l} <span className="mono" style={{ float: 'right', fontSize: 9, color: 'var(--text-low)' }}>{b.m}</span></button>
            ))}
          </GlassPanel>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 6 }}>CEILING ACCESS</div>
            {[{id:'drop',l:'Drop Ceiling',m:'1.0x'},{id:'hard',l:'Hard/Concrete',m:'1.4x'},{id:'open',l:'Open/Exposed',m:'0.9x'}].map(c => (
              <button key={c.id} onClick={() => setCeilingAccess(c.id)} style={{ display: 'block', width: '100%', padding: '5px 8px', marginBottom: 3, borderRadius: 4, fontSize: 11, textAlign: 'left', background: ceilingAccess===c.id?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${ceilingAccess===c.id?'var(--brand)':'var(--border-subtle)'}`, color: ceilingAccess===c.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c.l} <span className="mono" style={{ float: 'right', fontSize: 9, color: 'var(--text-low)' }}>{c.m}</span></button>
            ))}
          </GlassPanel>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 4 }}>LABOR RATE</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)' }}>${laborRate}/hr</div>
          </GlassPanel>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPETITIVE COMPARISON BUILDER
   ══════════════════════════════════════════════════════════════ */
function CompetitiveComparison() {
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const [competitor, setCompetitor] = React.useState('ADT Commercial');

  const competitors = ['ADT Commercial', 'Securitas', 'Johnson Controls', 'Stanley Security', 'Alarm.com', 'Verkada (Direct)', 'Local Competitor'];

  const features = [
    { feature: 'Custom System Design', us: true, them: false, advantage: 'Tailored to your exact needs' },
    { feature: 'On-Site Service Team', us: true, them: true, advantage: null },
    { feature: '24/7 Monitoring', us: true, them: true, advantage: null },
    { feature: 'Open Architecture', us: true, them: false, advantage: 'No vendor lock-in' },
    { feature: 'AI-Powered Analytics', us: true, them: false, advantage: 'ShieldTech AI anomaly detection' },
    { feature: 'Single Pane of Glass', us: true, them: false, advantage: 'Unified portal for all systems' },
    { feature: 'Remote System Access', us: true, them: true, advantage: null },
    { feature: 'Customer Portal', us: true, them: false, advantage: 'Self-service portal for customers' },
    { feature: 'Same-Day Emergency Service', us: true, them: false, advantage: 'Local team, fast response' },
    { feature: 'Transparent Pricing', us: true, them: false, advantage: 'No hidden fees or markups' },
    { feature: 'Multi-Brand Support', us: true, them: false, advantage: 'Axis, Verkada, HID, DSC, etc.' },
    { feature: 'Cloud + On-Prem Options', us: true, them: false, advantage: 'Hybrid flexibility' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Competitive Comparison</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Side-by-side feature matrix vs competitors</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <ShieldAIEstimateBtn label="AI: Research Competitor" onClick={() => showToast(`⟡ ShieldTech AI researching ${competitor} pricing, features, and weaknesses...`)} />
          <button onClick={() => showToast('Comparison exported to proposal')} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add to Proposal</button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="label-sm" style={{ marginBottom: 6 }}>COMPARE AGAINST</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {competitors.map(c => (
            <button key={c} onClick={() => setCompetitor(c)} style={{ padding: '4px 12px', borderRadius: 5, fontSize: 11, background: competitor===c?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${competitor===c?'var(--brand)':'var(--border-subtle)'}`, color: competitor===c?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c}</button>
          ))}
        </div>
      </div>

      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>Feature</th>
            <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-subtle)', width: 100 }}>ShieldTech</th>
            <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', width: 100 }}>{competitor}</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>Our Advantage</th>
          </tr></thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={i} style={{ background: f.us && !f.them ? 'rgba(52,211,153,0.02)' : 'transparent' }}>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{f.feature}</td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'center', fontSize: 14, color: f.us ? 'var(--status-ok)' : 'var(--status-critical)' }}>{f.us ? '✓' : '✕'}</td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'center', fontSize: 14, color: f.them ? 'var(--status-ok)' : 'var(--status-critical)' }}>{f.them ? '✓' : '✕'}</td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: f.advantage ? 'var(--status-ok)' : 'var(--text-low)' }}>{f.advantage || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   RMR / RECURRING REVENUE CALCULATOR
   ══════════════════════════════════════════════════════════════ */
function RMRCalculator() {
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const [services, setServices] = React.useState([
    { id: 1, name: 'Alarm Monitoring (Central Station)', monthly: 45, qty: 1 },
    { id: 2, name: 'Cloud Video Storage (per camera)', monthly: 12, qty: 6 },
    { id: 3, name: 'Access Control Cloud License', monthly: 8, qty: 4 },
    { id: 4, name: 'Managed Network Monitoring', monthly: 150, qty: 1 },
    { id: 5, name: 'Preventive Maintenance Plan', monthly: 200, qty: 1 },
  ]);
  const [contractYears, setContractYears] = React.useState(3);
  const [upfront, setUpfront] = React.useState(45000);

  const monthlyRMR = services.reduce((s, sv) => s + sv.monthly * sv.qty, 0);
  const annualRMR = monthlyRMR * 12;
  const contractValue = annualRMR * contractYears;
  const totalTCV = upfront + contractValue;
  const rmrMultiple = (contractValue / upfront).toFixed(1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>RMR / Recurring Revenue Calculator</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Model recurring revenue, TCO, and contract value</div>
        </div>
        <ShieldAIEstimateBtn label="AI: Optimize RMR Mix" onClick={() => showToast('⟡ ShieldTech AI analyzing customer profile and recommending optimal service mix for maximum RMR...')} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{l:'Monthly RMR',v:'$'+monthlyRMR.toLocaleString()},{l:'Annual RMR',v:'$'+annualRMR.toLocaleString()},{l:`${contractYears}yr Contract`,v:'$'+contractValue.toLocaleString()},{l:'Total TCV',v:'$'+totalTCV.toLocaleString()},{l:'RMR Multiple',v:rmrMultiple+'x'}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: i===4?'var(--status-ok)':'var(--brand)' }}>{s.v}</div>
            <div style={{ fontSize: 8, color: 'var(--text-low)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12 }}>
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Service','Monthly','Qty','Subtotal',''].map((h,i) => (
                <th key={i} style={{ textAlign: i>0?'right':'left', padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {services.map(sv => (
                <tr key={sv.id}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{sv.name}</td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 11 }}>${sv.monthly}</td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 11 }}>{sv.qty}</td>
                  <td className="mono" style={{ padding: '6px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right', fontSize: 11, color: 'var(--brand)' }}>${(sv.monthly*sv.qty).toLocaleString()}/mo</td>
                  <td style={{ padding: '6px 6px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><button onClick={() => setServices(prev => prev.filter(x => x.id!==sv.id))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '8px 10px' }}>
            <button onClick={() => setServices(prev => [...prev, { id: Date.now(), name: 'New Service', monthly: 0, qty: 1 }])} style={{ padding: '6px 12px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Service</button>
          </div>
        </GlassPanel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 6 }}>CONTRACT TERM</div>
            {[1,2,3,5].map(y => (
              <button key={y} onClick={() => setContractYears(y)} style={{ display: 'block', width: '100%', padding: '5px 8px', marginBottom: 3, borderRadius: 4, fontSize: 11, textAlign: 'left', background: contractYears===y?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${contractYears===y?'var(--brand)':'var(--border-subtle)'}`, color: contractYears===y?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{y} Year{y>1?'s':''}</button>
            ))}
          </GlassPanel>
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 4 }}>UPFRONT PROJECT VALUE</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)' }}>${upfront.toLocaleString()}</div>
          </GlassPanel>
          <GlassPanel style={{ borderLeft: '3px solid var(--status-ok)' }}>
            <div className="label-sm" style={{ marginBottom: 4 }}>CUSTOMER TCO ({contractYears}yr)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)' }}><span>Upfront</span><span className="mono">${upfront.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)' }}><span>RMR ({contractYears}yr)</span><span className="mono">${contractValue.toLocaleString()}</span></div>
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--status-ok)' }}><span>Total</span><span className="mono">${totalTCV.toLocaleString()}</span></div>
            </div>
          </GlassPanel>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Shared: ShieldTech AI Estimate Button ── */
function ShieldAIEstimateBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', background: 'rgba(63,169,245,0.06)',
      border: '1px solid var(--border-strong)', borderRadius: 6,
      color: 'var(--brand)', fontSize: 11, cursor: 'pointer',
      fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4
    }}>
      <span>⟡</span> {label}
    </button>
  );
}

Object.assign(window, {
  SiteSurveyTool, CableCalculator, BandwidthCalculator,
  LaborEstimator, CompetitiveComparison, RMRCalculator, ShieldAIEstimateBtn
});

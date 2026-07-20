/* Project Wizard — Multi-step guided flow for creating a new project
   Links together: Setup → Site Survey → Design Studio → Estimate → Proposal → Job */

function ProjectWizard({ customer, onClose, onComplete, showToast }) {
  const [step, setStep] = React.useState(0);
  const [project, setProject] = React.useState({
    name: '', type: 'Install', siteAddr: '', contact: '', phone: '', email: '',
    estimatedValue: '', timeline: '30 days', priority: 'normal', notes: '',
    // Survey
    rooms: [],
    // Design
    devices: [],
    // Estimate
    laborHours: 0, laborRate: 85, materialsCost: 0, rmrMonthly: 0,
  });

  const updateProject = (field, val) => setProject(prev => ({ ...prev, [field]: val }));

  const steps = [
    { id: 'setup', label: 'Project Setup', icon: 'projects' },
    { id: 'survey', label: 'Site Survey', icon: 'search' },
    { id: 'design', label: 'System Design', icon: 'cam-dome' },
    { id: 'estimate', label: 'Estimate', icon: 'dollar' },
    { id: 'review', label: 'Review & Create', icon: 'check' },
  ];

  const inputStyle = { width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
  const labelStyle = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' };

  const canNext = () => {
    if (step === 0) return project.name.trim() && project.type;
    return true;
  };

  const handleCreate = () => {
    if (showToast) showToast(`Project "${project.name}" created — navigating to Dispatch`);
    if (onComplete) onComplete(project);
    if (onClose) onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 720, maxHeight: '85vh', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', animation: 'fade-up 0.2s ease both', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>New Project</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{customer || 'Select customer'} · Step {step + 1} of {steps.length}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', padding: '12px 24px', gap: 4, borderBottom: '1px solid var(--border-subtle)' }}>
          {steps.map((s, i) => (
            <div key={s.id} onClick={() => { if (i <= step) setStep(i); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: 6, cursor: i <= step ? 'pointer' : 'default',
              background: i === step ? 'rgba(63,169,245,0.1)' : i < step ? 'rgba(52,211,153,0.06)' : 'transparent',
              border: `1px solid ${i === step ? 'var(--brand)' : i < step ? 'rgba(52,211,153,0.15)' : 'var(--border-subtle)'}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < step ? 'rgba(52,211,153,0.1)' : i === step ? 'rgba(63,169,245,0.1)' : 'transparent',
                flexShrink: 0
              }}>
                {i < step ? <Icon name="check" size={12} color="var(--status-ok)" /> : <Icon name={s.icon} size={12} color={i === step ? 'var(--brand)' : 'var(--text-low)'} />}
              </div>
              <span style={{ fontSize: 10, fontWeight: i === step ? 600 : 400, color: i === step ? 'var(--brand)' : i < step ? 'var(--status-ok)' : 'var(--text-low)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {/* ── Step 0: Project Setup ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Project Name</label>
                  <input value={project.name} onChange={e => updateProject('name', e.target.value)} placeholder="e.g. Lobby Camera Expansion" style={inputStyle} autoFocus />
                </div>
                <div>
                  <label style={labelStyle}>Project Type</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['Install','Upgrade','PM','Service','Inspection'].map(t => (
                      <button key={t} onClick={() => updateProject('type', t)} style={{
                        flex: 1, padding: '7px 4px', borderRadius: 5, fontSize: 11,
                        background: project.type === t ? 'rgba(63,169,245,0.12)' : 'transparent',
                        border: `1px solid ${project.type === t ? 'var(--brand)' : 'var(--border-subtle)'}`,
                        color: project.type === t ? 'var(--brand)' : 'var(--text-mid)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)'
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['low','normal','high','urgent'].map(p => (
                      <button key={p} onClick={() => updateProject('priority', p)} style={{
                        flex: 1, padding: '7px 4px', borderRadius: 5, fontSize: 11, textTransform: 'capitalize',
                        background: project.priority === p ? 'rgba(63,169,245,0.12)' : 'transparent',
                        border: `1px solid ${project.priority === p ? (p === 'urgent' ? 'var(--status-critical)' : 'var(--brand)') : 'var(--border-subtle)'}`,
                        color: project.priority === p ? (p === 'urgent' ? 'var(--status-critical)' : 'var(--brand)') : 'var(--text-mid)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)'
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Site Address</label>
                  <input value={project.siteAddr} onChange={e => updateProject('siteAddr', e.target.value)} placeholder="123 Main St, Philadelphia, PA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Site Contact</label>
                  <input value={project.contact} onChange={e => updateProject('contact', e.target.value)} placeholder="John Smith" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={project.phone} onChange={e => updateProject('phone', e.target.value)} placeholder="(215) 555-0100" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={project.email} onChange={e => updateProject('email', e.target.value)} placeholder="contact@customer.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Timeline</label>
                  <select value={project.timeline} onChange={e => updateProject('timeline', e.target.value)} style={inputStyle}>
                    {['7 days','14 days','30 days','60 days','90 days','6 months'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={project.notes} onChange={e => updateProject('notes', e.target.value)} placeholder="Project scope notes, special requirements..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Site Survey ── */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Room-by-Room Survey</div>
                <button onClick={() => updateProject('rooms', [...project.rooms, { id: Date.now(), name: `Room ${project.rooms.length + 1}`, cameras: 0, readers: 0, aps: 0, sensors: 0, notes: '' }])} style={{ padding: '4px 12px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Room</button>
              </div>
              {project.rooms.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)' }}>
                  <Icon name="search" size={28} color="var(--text-low)" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No rooms added yet</div>
                  <div style={{ fontSize: 11 }}>Add rooms to document your site survey, or skip to design</div>
                </div>
              )}
              {project.rooms.map((room, i) => (
                <div key={room.id} className="glass" style={{ padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={room.name} onChange={e => { const rooms = [...project.rooms]; rooms[i] = { ...rooms[i], name: e.target.value }; updateProject('rooms', rooms); }} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => updateProject('rooms', project.rooms.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[{f:'cameras',l:'Cameras',icon:'cam-dome'},{f:'readers',l:'Readers',icon:'reader'},{f:'aps',l:'Access Pts',icon:'ap-ceiling'},{f:'sensors',l:'Sensors',icon:'motion-sensor'}].map(field => (
                      <div key={field.f} style={{ textAlign: 'center' }}>
                        <Icon name={field.icon} size={16} color="var(--brand)" style={{ marginBottom: 4 }} />
                        <div style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>{field.l}</div>
                        <input type="number" value={room[field.f]} onChange={e => { const rooms = [...project.rooms]; rooms[i] = { ...rooms[i], [field.f]: parseInt(e.target.value) || 0 }; updateProject('rooms', rooms); }} style={{ ...inputStyle, width: '100%', textAlign: 'center', padding: '4px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--brand)' }}>
                  <Icon name="hermes" size={14} color="var(--brand)" />
                  <span style={{ fontWeight: 500 }}>Hermes: Auto-populate from floor plan</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>Upload a floor plan and Hermes will suggest camera placement, access points, and sensor locations based on the layout.</div>
              </div>
            </div>
          )}

          {/* ── Step 2: System Design ── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>System Design — Bill of Materials</div>
                <button onClick={() => updateProject('devices', [...project.devices, { id: Date.now(), name: '', qty: 1, unitCost: 0, category: 'Cameras' }])} style={{ padding: '4px 12px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Device</button>
              </div>

              {/* Auto-populate from survey */}
              {project.rooms.length > 0 && project.devices.length === 0 && (
                <button onClick={() => {
                  const autoDevices = [];
                  const totalCams = project.rooms.reduce((s, r) => s + r.cameras, 0);
                  const totalReaders = project.rooms.reduce((s, r) => s + r.readers, 0);
                  const totalAps = project.rooms.reduce((s, r) => s + r.aps, 0);
                  if (totalCams > 0) autoDevices.push({ id: Date.now(), name: 'Axis P3265-V (Dome)', qty: totalCams, unitCost: 890, category: 'Cameras' });
                  if (totalReaders > 0) autoDevices.push({ id: Date.now()+1, name: 'HID iCLASS SE RK40', qty: totalReaders, unitCost: 485, category: 'Access' });
                  if (totalAps > 0) autoDevices.push({ id: Date.now()+2, name: 'Ubiquiti U6-Pro', qty: totalAps, unitCost: 180, category: 'Network' });
                  if (totalCams > 0) autoDevices.push({ id: Date.now()+3, name: 'Axis S3008 NVR', qty: 1, unitCost: 2200, category: 'NVR' });
                  autoDevices.push({ id: Date.now()+4, name: 'USW-Pro-24-PoE Switch', qty: 1, unitCost: 699, category: 'Network' });
                  updateProject('devices', autoDevices);
                  if (showToast) showToast('BOM auto-populated from survey');
                }} style={{ width: '100%', padding: 12, marginBottom: 12, background: 'rgba(63,169,245,0.04)', border: '1px dashed var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="hermes" size={14} color="var(--brand)" /> Auto-populate BOM from Site Survey ({project.rooms.reduce((s,r) => s+r.cameras,0)} cameras, {project.rooms.reduce((s,r) => s+r.readers,0)} readers)
                </button>
              )}

              {project.devices.length === 0 && project.rooms.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)' }}>
                  <Icon name="inventory" size={28} color="var(--text-low)" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No devices added</div>
                  <div style={{ fontSize: 11 }}>Add equipment manually, or go back to Site Survey first</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {project.devices.map((dev, i) => (
                  <div key={dev.id} className="glass" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name={catIcons[dev.category] || 'cam-dome'} size={18} color={catColors[dev.category] || 'var(--brand)'} />
                    <input value={dev.name} onChange={e => { const d = [...project.devices]; d[i] = { ...d[i], name: e.target.value }; updateProject('devices', d); }} placeholder="Device name" style={{ ...inputStyle, flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Qty</span>
                      <input type="number" value={dev.qty} onChange={e => { const d = [...project.devices]; d[i] = { ...d[i], qty: parseInt(e.target.value) || 1 }; updateProject('devices', d); }} style={{ ...inputStyle, width: 50, textAlign: 'center' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-low)' }}>$</span>
                      <input type="number" value={dev.unitCost} onChange={e => { const d = [...project.devices]; d[i] = { ...d[i], unitCost: parseFloat(e.target.value) || 0 }; updateProject('devices', d); }} style={{ ...inputStyle, width: 70, textAlign: 'right' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', width: 70, textAlign: 'right' }}>${(dev.qty * dev.unitCost).toLocaleString()}</span>
                    <button onClick={() => updateProject('devices', project.devices.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>

              {project.devices.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Equipment Total</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>${project.devices.reduce((s, d) => s + d.qty * d.unitCost, 0).toLocaleString()}</span>
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-low)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="info" size={12} color="var(--text-low)" />
                Tip: Open the full Design Studio to place devices on a floor plan with FOV cones and auto-generate this BOM.
              </div>
            </div>
          )}

          {/* ── Step 3: Estimate ── */}
          {step === 3 && (() => {
            const materialsCost = project.devices.reduce((s, d) => s + d.qty * d.unitCost, 0);
            const estLaborHours = project.devices.reduce((s, d) => s + d.qty * 2.5, 0);
            const laborCost = estLaborHours * project.laborRate;
            const annualRmr = project.rmrMonthly * 12;
            const subtotal = materialsCost + laborCost;
            const margin = subtotal * 0.2;
            const total = subtotal + margin;
            return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Project Estimate</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <GlassPanel style={{ padding: 14 }}>
                  <div className="label-sm" style={{ marginBottom: 8 }}>EQUIPMENT</div>
                  {project.devices.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, color: 'var(--text-mid)' }}>
                      <span>{d.name} × {d.qty}</span>
                      <span className="mono">${(d.qty * d.unitCost).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                    <span>Materials</span>
                    <span className="mono" style={{ color: 'var(--brand)' }}>${materialsCost.toLocaleString()}</span>
                  </div>
                </GlassPanel>

                <GlassPanel style={{ padding: 14 }}>
                  <div className="label-sm" style={{ marginBottom: 8 }}>LABOR</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)', marginBottom: 4 }}>
                    <span>Estimated hours</span>
                    <span className="mono">{estLaborHours.toFixed(0)}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)', marginBottom: 4 }}>
                    <span>Rate</span>
                    <span className="mono">${project.laborRate}/hr</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)', marginBottom: 4 }}>
                    <span>Crew days (2-man)</span>
                    <span className="mono">{(estLaborHours / 16).toFixed(1)}d</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                    <span>Labor</span>
                    <span className="mono" style={{ color: 'var(--brand)' }}>${laborCost.toLocaleString()}</span>
                  </div>
                </GlassPanel>
              </div>

              <GlassPanel style={{ padding: 14, marginBottom: 12 }}>
                <div className="label-sm" style={{ marginBottom: 8 }}>RECURRING (RMR)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Monthly RMR:</span>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>$</span>
                  <input type="number" value={project.rmrMonthly} onChange={e => updateProject('rmrMonthly', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: 80, textAlign: 'right', padding: '4px 8px' }} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>/mo · ${annualRmr.toLocaleString()}/yr</span>
                </div>
              </GlassPanel>

              {/* Grand total */}
              <GlassPanel style={{ borderLeft: '3px solid var(--brand)', padding: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)' }}><span>Materials</span><span className="mono">${materialsCost.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)' }}><span>Labor</span><span className="mono">${laborCost.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)' }}><span>Margin (20%)</span><span className="mono">${margin.toLocaleString()}</span></div>
                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600 }}><span>Project Total</span><span className="mono" style={{ color: 'var(--brand)' }}>${total.toLocaleString()}</span></div>
                  {project.rmrMonthly > 0 && <div style={{ fontSize: 10, color: 'var(--status-ok)', textAlign: 'right' }}>+ ${project.rmrMonthly.toLocaleString()}/mo RMR</div>}
                </div>
              </GlassPanel>

              <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="hermes" size={14} color="var(--brand)" />
                <span style={{ fontSize: 11, color: 'var(--brand)' }}>Hermes: Compare this estimate against 3 similar past projects — margins look healthy at 20%.</span>
              </div>
            </div>
            );
          })()}

          {/* ── Step 4: Review & Create ── */}
          {step === 4 && (() => {
            const materialsCost = project.devices.reduce((s, d) => s + d.qty * d.unitCost, 0);
            const laborCost = project.devices.reduce((s, d) => s + d.qty * 2.5, 0) * project.laborRate;
            const total = (materialsCost + laborCost) * 1.2;
            return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Review & Create</div>
              <GlassPanel style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Project</span><div style={{ fontSize: 14, fontWeight: 500 }}>{project.name || '—'}</div></div>
                  <div><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Customer</span><div style={{ fontSize: 14, fontWeight: 500 }}>{customer}</div></div>
                  <div><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Type</span><div style={{ fontSize: 13 }}>{project.type}</div></div>
                  <div><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Priority</span><div style={{ fontSize: 13, textTransform: 'capitalize' }}>{project.priority}</div></div>
                  <div><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Timeline</span><div style={{ fontSize: 13 }}>{project.timeline}</div></div>
                  <div><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Estimated Value</span><div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)' }}>${total.toLocaleString()}</div></div>
                  {project.siteAddr && <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Site</span><div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{project.siteAddr}</div></div>}
                </div>
              </GlassPanel>

              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>What happens next:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: 'proposals', label: 'Proposal auto-generated', desc: 'BOM and estimate populate a new proposal for customer approval' },
                  { icon: 'dispatch', label: 'Job created in Dispatch', desc: 'Scope and timeline assigned, ready for tech scheduling' },
                  { icon: 'inventory', label: 'Purchase orders staged', desc: 'Equipment POs drafted from the BOM, pending approval' },
                  { icon: 'finance', label: 'Invoice drafted', desc: 'Invoice pre-built from estimate, sent on project completion' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(63,169,245,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <Icon name={item.icon} size={16} color="var(--brand)" />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{item.desc}</div>
                    </div>
                    <Icon name="check" size={14} color="var(--status-ok)" style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{step > 0 ? 'Back' : 'Cancel'}</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {step < steps.length - 1 && step > 0 && (
              <button onClick={() => setStep(step + 1)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Skip</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()} style={{ padding: '8px 24px', background: canNext() ? 'var(--brand)' : 'rgba(63,169,245,0.15)', border: 'none', borderRadius: 6, color: canNext() ? '#fff' : 'var(--text-low)', fontSize: 12, fontWeight: 600, cursor: canNext() ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>Next →</button>
            ) : (
              <button onClick={handleCreate} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="check" size={14} color="#fff" /> Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Icon/color lookups (shared with studio) */
const catIcons = { 'Cameras': 'cam-dome', 'NVR': 'nvr-box', 'Access': 'reader', 'Intrusion': 'alarm-panel', 'Network': 'switch-ports', 'Power': 'ups', 'Cabling': 'cable', 'Fire': 'fire-panel' };
const catColors = { 'Cameras': 'var(--brand)', 'NVR': 'var(--status-ok)', 'Access': '#c084fc', 'Intrusion': 'var(--status-warn)', 'Network': 'var(--status-ok)', 'Power': '#f59e0b', 'Cabling': 'var(--text-low)', 'Fire': 'var(--status-critical)' };

Object.assign(window, { ProjectWizard, catIcons, catColors });

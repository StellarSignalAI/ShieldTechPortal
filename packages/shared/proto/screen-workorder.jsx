/* Screen — Work Orders (v2) */

function WorkOrderScreen() {
  const [workOrders, setWorkOrders] = useShieldStore(workOrderStore);
  const [activeWO, setActiveWO] = React.useState(0);
  const [showNew, setShowNew] = React.useState(false);

  /* Deep-link: calendar & other screens set woFocusStore before navigating here */
  React.useEffect(() => {
    const target = woFocusStore.get();
    if (target) {
      const idx = workOrderStore.get().findIndex(w => w.id === target);
      if (idx >= 0) setActiveWO(idx);
      woFocusStore.set(null);
    }
  }, []);
  const [tab, setTab] = React.useState('details');
  const [signatureSigned, setSignatureSigned] = React.useState(false);
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [lastPos, setLastPos] = React.useState(null);
  const [photoUrls, setPhotoUrls] = React.useState({});

  // Live timer
  React.useEffect(() => {
    const t = setInterval(() => {
      setWorkOrders(prev => prev.map(w => w.timerRunning ? { ...w, timerSeconds: w.timerSeconds + 1 } : w));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const wo = workOrders[activeWO];
  if (!wo) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: 'calc(100vh - 120px)', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)' }}>No work orders yet</div>
      <div style={{ fontSize: 12, color: 'var(--text-low)', maxWidth: 340 }}>Create a work order, assign it to a technician, and it appears in their app with the required-shot checklist.</div>
      <button onClick={() => setShowNew(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Work Order</button>
      {showNew && <NewWorkOrderModal onClose={() => setShowNew(false)} onCreate={(w) => { workOrderStore.set(prev => [w, ...prev]); setActiveWO(0); setShowNew(false); showToast(`${w.id} created — assigned to ${w.tech}`, 'ok'); }} />}
    </div>
  );

  const statusColor = { scheduled: 'var(--brand)', 'in-progress': 'var(--status-warn)', completed: 'var(--status-ok)' };
  const updateWO = (id, patch) => setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  const toggleTimer = () => { updateWO(wo.id, { timerRunning: !wo.timerRunning }); showToast(wo.timerRunning ? 'Timer paused' : 'Timer running', 'info'); };

  const advanceStatus = () => {
    const next = wo.status === 'scheduled' ? 'in-progress' : 'completed';
    updateWO(wo.id, { status: next, timerRunning: next === 'in-progress' });
    showToast(next === 'completed' ? 'WO completed' : 'Job started', next === 'completed' ? 'ok' : 'info');
  };

  const toggleCheck = (i) => {
    const key = wo.id + '-' + i;
    updateWO(wo.id, { checkedItems: { ...wo.checkedItems, [key]: !wo.checkedItems[key] } });
  };

  // Blank canvas: a WO carries its own scope/checklist/materials — created in the
  // portal, no shared seed.
  const data = {
    scope: wo.scope || '',
    notes: wo.notes || '',
    materials: wo.materials || [],
    checklist: wo.checklist || [],
    photoSlots: wo.photoSlots || [],
  };
  const matCost = data.materials.reduce((s, m) => s + m.used * m.unitCost, 0);
  const laborRate = 125;
  const laborCost = ((wo.timerSeconds || 0) / 3600) * laborRate;
  const total = matCost + laborCost;
  const checkedCount = data.checklist.filter((_, i) => wo.checkedItems && wo.checkedItems[wo.id + '-' + i]).length;

  const startDraw = (e) => {
    const r = canvasRef.current && canvasRef.current.getBoundingClientRect();
    if (!r) return;
    setIsDrawing(true);
    setLastPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(x, y);
    ctx.strokeStyle = '#3FA9F5'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.stroke();
    setLastPos({ x, y });
    setSignatureSigned(true);
  };
  const clearSig = () => {
    if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, 500, 150);
    setSignatureSigned(false);
  };

  const handlePhotoUpload = (e, slot) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const key = wo.id + '-' + slot;
    // Show immediately, then persist to Supabase Storage and swap in the durable URL.
    setPhotoUrls(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    showToast('Uploading photo…');
    const store = window.__shieldStorage;
    if (store && store.uploadFile) {
      store.uploadFile(file, { folder: 'work-orders', entity: 'work_order', entityId: wo.id, name: file.name })
        .then(res => {
          if (res && res.url) setPhotoUrls(prev => ({ ...prev, [key]: res.url }));
          showToast(res && res.local ? 'Photo added' : 'Photo saved', 'ok');
        })
        .catch(() => showToast('Photo added', 'ok'));
    } else {
      showToast('Photo added', 'ok');
    }
  };

  const statusIdx = ['scheduled','in-progress','completed'].indexOf(wo.status);

  const sBtn = { fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', border: 'none', borderRadius: 6, padding: '5px 12px' };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>

      {/* WO list sidebar */}
      <div className="glass" style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Work Orders</span>
          <button onClick={() => setShowNew(true)} style={{ ...sBtn, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', padding: '3px 9px', fontSize: 11 }}>+ New WO</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {workOrders.map((w, i) => (
            <div key={w.id} onClick={() => { setActiveWO(i); setSignatureSigned(w.signatureSigned || false); }} style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', background: activeWO === i ? 'rgba(63,169,245,0.06)' : 'transparent', borderLeft: '3px solid ' + (activeWO === i ? statusColor[w.status] : 'transparent'), transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{w.id}</span>
                <span style={{ fontSize: 9, color: statusColor[w.status], background: statusColor[w.status] + '18', padding: '1px 6px', borderRadius: 100, fontWeight: 600 }}>{w.status}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', marginBottom: 2 }}>{w.customer}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{w.type} · {w.techId}</span>
                {w.timerRunning && <span className="mono" style={{ fontSize: 9, color: 'var(--status-warn)' }}>⏱ {fmtSeconds(w.timerSeconds || 0)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main WO detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 12 }}>

        {/* Header */}
        <div className="glass" style={{ padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 13, color: 'var(--text-low)' }}>{wo.id}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[wo.status], background: statusColor[wo.status] + '18', padding: '2px 10px', borderRadius: 100 }}>{wo.status}</span>

            {wo.status !== 'completed' && (
              <button onClick={advanceStatus} style={{ ...sBtn, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                {wo.status === 'scheduled' ? 'Start Job ▶' : 'Complete ✓'}
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '5px 12px' }}>
              <span className="mono" style={{ fontSize: 14, color: wo.timerRunning ? 'var(--status-warn)' : 'var(--text-mid)', fontWeight: 600, minWidth: 64 }}>{fmtSeconds(wo.timerSeconds || 0)}</span>
              <button onClick={toggleTimer} style={{ ...sBtn, padding: '3px 8px', fontSize: 10, color: wo.timerRunning ? 'var(--status-critical)' : 'var(--status-ok)', background: wo.timerRunning ? 'rgba(244,63,94,0.08)' : 'rgba(52,211,153,0.08)', border: '1px solid ' + (wo.timerRunning ? 'rgba(244,63,94,0.2)' : 'rgba(52,211,153,0.2)') }}>
                {wo.timerRunning ? '⏸ Pause' : '▶ Start'}
              </button>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => navTo('helpdesk')} style={{ ...sBtn, color: 'var(--text-mid)', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)' }}>Ticket</button>
              <button onClick={() => { showToast('Sent to ' + wo.customer, 'ok'); }} style={{ ...sBtn, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)' }}>Send to Customer</button>
            </div>
          </div>

          {/* Status progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
            {['Scheduled','In Progress','Completed'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i <= statusIdx ? statusColor[wo.status] : 'rgba(63,169,245,0.15)', border: i === statusIdx ? '2px solid ' + statusColor[wo.status] : 'none', boxShadow: i === statusIdx ? '0 0 6px ' + statusColor[wo.status] : 'none', flexShrink: 0, transition: 'all 0.3s' }} />
                <div style={{ flex: 1, height: 2, background: i < statusIdx ? statusColor[wo.status] : 'rgba(63,169,245,0.1)', transition: 'all 0.3s' }} />
                {i === 2 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusIdx === 2 ? 'var(--status-ok)' : 'rgba(63,169,245,0.15)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[{l:'Customer',v:wo.customer},{l:'Site',v:wo.site},{l:'Tech',v:wo.tech + ' (' + wo.techId + ')'},{l:'Scheduled',v:wo.scheduled}].map(f => (
              <div key={f.l}><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 1 }}>{f.l}</div><div style={{ fontSize: 12, color: 'var(--text-high)' }}>{f.v}</div></div>
            ))}
            <div><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 1 }}>Total Cost</div><div className="mono" style={{ fontSize: 13, color: 'var(--status-ok)', fontWeight: 600 }}>${total.toFixed(0)}</div></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {['details','materials','checklist','photos','signature'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 500, borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-body)', background: tab === t ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.04)', color: tab === t ? 'var(--brand)' : 'var(--text-low)', border: '1px solid ' + (tab === t ? 'var(--border-strong)' : 'var(--border-subtle)'), transition: 'all 0.15s' }}>
              {t === 'checklist' ? 'Checklist (' + checkedCount + '/' + data.checklist.length + ')' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {tab === 'details' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="glass" style={{ flex: 1, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>Scope of Work</div>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>{data.scope}</p>
                {data.notes && <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 6, fontSize: 11, color: 'var(--status-warn)' }}>Note: {data.notes}</div>}
              </div>
              <div className="glass" style={{ width: 200, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Cost Summary</div>
                {[{l:'Materials',v:'$' + matCost.toFixed(0)},{l:'Labor (' + ((wo.timerSeconds||0)/3600).toFixed(1) + 'h)',v:'$' + laborCost.toFixed(0)}].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.l}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-high)' }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Total</span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-ok)' }}>${total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'materials' && (
            <div className="glass" style={{ padding: 16 }}>
              {data.materials.length === 0
                ? <div style={{ fontSize: 13, color: 'var(--text-low)', textAlign: 'center', padding: 24 }}>No materials for this WO</div>
                : <DataTable
                    columns={[
                      {key:'part',label:'Part Name'},
                      {key:'qty',label:'Ordered',align:'center',mono:true},
                      {key:'used',label:'Used',align:'center',mono:true},
                      {key:'unitCost',label:'Unit $',align:'right',mono:true,render:v=>'$'+v},
                      {key:'used',label:'Total',align:'right',mono:true,render:(v,r)=>React.createElement('span',{style:{color:'var(--status-ok)',fontWeight:600}},'$'+(v*r.unitCost).toFixed(0))}
                    ]}
                    rows={data.materials}
                  />
              }
            </div>
          )}

          {tab === 'checklist' && (
            <div className="glass" style={{ padding: 16 }}>
              <div style={{ height: 4, background: 'rgba(63,169,245,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ width: (checkedCount/data.checklist.length*100) + '%', height: '100%', background: checkedCount === data.checklist.length ? 'var(--status-ok)' : 'var(--brand)', borderRadius: 2, transition: 'width 0.3s ease' }} />
              </div>
              {data.checklist.map((item, i) => {
                const checked = wo.checkedItems && wo.checkedItems[wo.id + '-' + i];
                return (
                  <div key={i} onClick={() => toggleCheck(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid ' + (checked ? 'var(--status-ok)' : 'var(--border-strong)'), background: checked ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {checked && <span style={{ fontSize: 10, color: 'var(--status-ok)', fontWeight: 700 }}>check</span>}
                    </div>
                    <span style={{ fontSize: 13, color: checked ? 'var(--text-low)' : 'var(--text-high)', textDecoration: checked ? 'line-through' : 'none' }}>{item}</span>
                  </div>
                );
              })}
              {checkedCount === data.checklist.length && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--status-ok)', fontWeight: 600 }}>All steps complete</span>
                  <button onClick={() => setTab('signature')} style={{ fontSize: 11, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Go to Signature</button>
                </div>
              )}
            </div>
          )}

          {tab === 'photos' && (
            <div className="glass" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {data.photoSlots.map((slot, i) => {
                  const key = wo.id + '-' + i;
                  const src = photoUrls[key];
                  return (
                    <label key={i} style={{ cursor: 'pointer' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, i)} />
                      <div style={{ aspectRatio: '4/3', background: src ? 'transparent' : 'rgba(63,169,245,0.04)', border: '1px dashed ' + (src ? 'var(--status-ok)' : 'var(--border-strong)'), borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'all 0.15s' }}>
                        {src
                          ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={slot} />
                          : (<>
                              <div style={{ fontSize: 24, opacity: 0.3, marginBottom: 6 }}>photo</div>
                              <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', padding: '0 8px' }}>{slot}</div>
                              <div style={{ fontSize: 9, color: 'var(--brand)', marginTop: 4 }}>Click to upload</div>
                            </>)
                        }
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'signature' && (
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>Customer Acceptance</div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 14 }}>By signing below, you confirm that the work in {wo.id} has been completed to your satisfaction.</p>
              <div style={{ background: 'rgba(63,169,245,0.03)', border: '2px dashed var(--border-strong)', borderRadius: 10, overflow: 'hidden', position: 'relative', cursor: 'crosshair' }}>
                <canvas ref={canvasRef} width={500} height={150} style={{ display: 'block', width: '100%', height: 150 }} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)} />
                {!signatureSigned && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-low)', opacity: 0.5 }}>Sign here with your cursor...</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={clearSig} style={{ padding: '7px 16px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear</button>
                <button onClick={() => { if (signatureSigned) { updateWO(wo.id, { status: 'completed', timerRunning: false, signatureSigned: true }); showToast('Work order signed and closed', 'ok'); } }} style={{ flex: 1, padding: '7px 0', background: signatureSigned ? 'rgba(52,211,153,0.12)' : 'rgba(63,169,245,0.04)', border: '1px solid ' + (signatureSigned ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'), borderRadius: 6, color: signatureSigned ? 'var(--status-ok)' : 'var(--text-low)', fontSize: 11, fontWeight: 600, cursor: signatureSigned ? 'pointer' : 'default', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                  {signatureSigned ? 'Submit & Close Work Order' : 'Sign above to submit'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      {showNew && <NewWorkOrderModal onClose={() => setShowNew(false)} onCreate={(w) => { workOrderStore.set(prev => [w, ...prev]); setActiveWO(0); setShowNew(false); showToast(`${w.id} created — assigned to ${w.tech}`, 'ok'); }} />}
    </div>
  );
}

/* Portal: create a work order and assign it to a technician. The roster loads
   from Supabase profiles (Tech/Staff) when configured, else the fleet roster. */
function NewWorkOrderModal({ onClose, onCreate }) {
  const [customers] = useShieldStore(customerStore);
  const [roster, setRoster] = React.useState([]);
  const [f, setF] = React.useState({ customer: '', site: '', type: 'Install', assignedTo: '', scheduled: new Date().toISOString().slice(0, 10), scope: '', notes: '' });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const sb = window.__shieldSupabase;
      if (sb) {
        const { data } = await sb.from('profiles').select('id,name,email,role').in('role', ['Tech', 'Technician', 'Staff', 'Admin']);
        if (alive && Array.isArray(data) && data.length) {
          setRoster(data.map(p => ({ id: p.id, name: p.name || p.email || 'Technician', role: p.role, initials: (p.name || p.email || 'T').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') })));
          return;
        }
      }
      // Fallback: fleet roster (techs who've shared location this session)
      const fleet = (typeof fleetStore !== 'undefined' && fleetStore.get && fleetStore.get().techs) || {};
      setRoster(Object.entries(fleet).map(([id, t]) => ({ id, name: t.name || id, role: t.role || 'Technician', initials: (t.name || id).split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') })));
    })();
    return () => { alive = false; };
  }, []);

  const submit = () => {
    if (!f.customer.trim()) { showToast('Enter a customer', 'warn'); return; }
    const tech = roster.find(r => r.id === f.assignedTo);
    onCreate(buildWorkOrder({
      customer: f.customer, site: f.site, type: f.type, scheduled: f.scheduled, scope: f.scope, notes: f.notes,
      assignedTo: tech ? tech.id : null, techName: tech ? tech.name : 'Unassigned', techInitials: tech ? tech.initials : '—',
    }));
  };

  const fld = { width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>New Work Order</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={lbl}>Customer</div>
            <input list="wo-cust-list" value={f.customer} onChange={e => set('customer', e.target.value)} placeholder="Customer name" style={fld} />
            <datalist id="wo-cust-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
          </div>
          <div><div style={lbl}>Site / Address</div><input value={f.site} onChange={e => set('site', e.target.value)} placeholder="Service location" style={fld} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={lbl}>Type</div>
              <select value={f.type} onChange={e => set('type', e.target.value)} style={fld}>
                {['Install', 'Repair', 'Maintenance', 'Survey'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><div style={lbl}>Scheduled</div><input type="date" value={f.scheduled} onChange={e => set('scheduled', e.target.value)} style={fld} /></div>
          </div>
          <div>
            <div style={lbl}>Assign to technician</div>
            <select value={f.assignedTo} onChange={e => set('assignedTo', e.target.value)} style={fld}>
              <option value="">— Unassigned —</option>
              {roster.map(r => <option key={r.id} value={r.id}>{r.name}{r.role ? ` · ${r.role}` : ''}</option>)}
            </select>
            {roster.length === 0 && <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3 }}>No team members loaded — invite techs in Team, or leave unassigned for now.</div>}
          </div>
          <div><div style={lbl}>Scope of work</div><textarea value={f.scope} onChange={e => set('scope', e.target.value)} rows={3} placeholder="What needs to be done…" style={{ ...fld, resize: 'vertical' }} /></div>
          <div><div style={lbl}>Notes (optional)</div><input value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Access, escorts, gotchas…" style={fld} /></div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={submit} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create & Assign</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WorkOrderScreen, NewWorkOrderModal });

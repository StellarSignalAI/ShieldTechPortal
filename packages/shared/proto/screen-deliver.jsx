/* DELIVER — Work Orders, Projects, Calendar & Copilot, Dispatch & Fleet on the
   UniFi-pattern layout under the one unified sidebar.

   Work Orders: every WO is a priced job (value = quoted price; cost = materials
   + timed labor; margin shown live). UniFi table + properties drawer with the
   working tabs (details, materials, checklist, photos, signature), a real
   "new work order" form, accept-and-schedule for customer requests, invoice
   hand-off. Site photos and punch lists ride along as tabs.

   Projects: board + list, drawer (existing ProjectDetailDrawer: billing,
   drawings, quotes, invoices, photos). Site addresses are geocoded on save
   (OpenStreetMap Nominatim, cached in st2_geo) so dispatch and the tech app can
   pin the site.

   Calendar & Copilot and Dispatch & Fleet keep their engines (drag-and-drop
   scheduling, Leaflet map) inside the unified frame; the sidebar drives their
   tabs. */

const dvFont = { fontFamily: 'var(--font-body)' };
const DV_WO_STATUS = { requested: { l: 'Requested', c: 'var(--status-warn)' }, open: { l: 'Open', c: 'var(--brand)' }, scheduled: { l: 'Scheduled', c: 'var(--brand)' }, 'in-progress': { l: 'In progress', c: 'var(--accent-2)' }, completed: { l: 'Completed', c: 'var(--status-ok)' } };
const DV_LABOR_RATE = 125;
const dvMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();
const dvDate = (iso) => { if (!iso) return '—'; const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? String(iso) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

/* ── Geocoding (shared by Projects, Work Orders, the tech app and dispatch) ── */
const DV_GEO_KEY = 'st2_geo';
let dvGeoQueue = Promise.resolve();
function dvGeoCache() { try { return JSON.parse(localStorage.getItem(DV_GEO_KEY) || '{}'); } catch { return {}; } }
function dvGeocode(addr) {
  const a = String(addr || '').trim();
  if (a.length < 6) return Promise.resolve(null);
  const cache = dvGeoCache(); if (cache[a] !== undefined) return Promise.resolve(cache[a]);
  const run = () => fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(a), { headers: { Accept: 'application/json' } })
    .then(r => r.ok ? r.json() : []).then(rows => { const hit = rows && rows[0]; const pt = hit ? [Number(hit.lat), Number(hit.lon)] : null; try { const c = dvGeoCache(); c[a] = pt; localStorage.setItem(DV_GEO_KEY, JSON.stringify(c)); } catch { /* quota */ } return pt; }).catch(() => null);
  const p = dvGeoQueue.then(() => new Promise(res => setTimeout(res, 1100))).then(run);
  dvGeoQueue = p.catch(() => null);
  return p;
}
window.__shieldGeocode = dvGeocode;
/* Geocode a project's site address and stamp lat/lng on the record. */
function dvGeocodeProject(number, addr) {
  return dvGeocode(addr).then(pt => { if (pt) updateProject(number, { lat: pt[0], lng: pt[1], geocodedAddr: addr, geocodedAt: Date.now() }); return pt; });
}
function dvGeocodeWorkOrder(id, addr) {
  return dvGeocode(addr).then(pt => { if (pt) workOrderStore.set(prev => (prev || []).map(w => w.id === id ? { ...w, lat: pt[0], lng: pt[1], geocodedAddr: addr } : w)); return pt; });
}

function DvFrame({ label, title, sub, right, tiles, tabs, tab, onTab, chips, children, drawer, isMobile }) {
  return (
    <div data-screen-label={label} style={{ display: 'flex', height: 'var(--uf-h, calc(100vh - 76px))', margin: 'var(--uf-m, -4px 0 0)', overflow: 'hidden', borderRadius: 'var(--uf-r, 8px)', border: 'var(--uf-b, 1px solid var(--border-subtle))', background: 'var(--canvas)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{sub}</div>}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{right}</div>
          </div>
          {tiles && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>{tiles}</div>}
          {tabs && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><UcTabs tabs={tabs} value={tab} onChange={onTab} />{chips && <div style={{ marginBottom: 14 }}>{chips}</div>}</div>}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 16px' }}>{children}</div>
      </div>
      {drawer && !isMobile && drawer}
      {drawer && isMobile && <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'var(--card)', display: 'flex' }}>{drawer}</div>}
    </div>
  );
}
function useDvSub(screen, subs, fallback, hubMap) {
  const subInit = window.__navSub && window.__navSub.screen === screen ? window.__navSub.sub : null;
  const hubInit = hubMap ? hubMap[window.__hubScreenId || ''] : null;
  const [tab, setTab] = React.useState(subs.some(s => s.id === subInit) ? subInit : (hubInit || fallback));
  React.useEffect(() => { const h = (e) => { if (e.detail.screen === screen && e.detail.source !== 'screen' && e.detail.sub && subs.some(s => s.id === e.detail.sub)) setTab(e.detail.sub); }; window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, []);
  React.useEffect(() => { if (window.navSubSet && (!window.__navSub || window.__navSub.screen !== screen || window.__navSub.sub !== tab)) window.navSubSet(screen, tab, 'screen'); }, [tab]);
  return [tab, setTab];
}
const dvInp = { ...dvFont, width: '100%', boxSizing: 'border-box', padding: '7px 9px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none' };

/* ═══════════════════ WORK ORDERS ═══════════════════ */
const DV_WO_SUBS = [{ id: 'all', label: 'Work orders' }, { id: 'requested', label: 'Requests' }, { id: 'photos', label: 'Site photos' }, { id: 'punch', label: 'Punch lists' }];
function dvWoCost(wo) {
  const mat = (wo.materials || []).reduce((s, m) => s + (Number(m.used != null ? m.used : m.qty) || 0) * (Number(m.unitCost) || 0), 0);
  const labor = ((wo.timerSeconds || 0) / 3600) * DV_LABOR_RATE;
  return { mat, labor, total: mat + labor };
}
function dvWoValue(wo) { return Number(wo.value || wo.amount || wo.total || wo.price || 0) || 0; }

function DvWoDrawer({ wo, onClose, roster, isMobile }) {
  const [tab, setTab] = React.useState('details');
  const [photos] = useShieldStore(photoStore);
  const [sig, setSig] = React.useState(!!wo.signatureSigned);
  const [mat, setMat] = React.useState({ part: '', qty: '1', unitCost: '' });
  const [item, setItem] = React.useState('');
  const [photoUrls, setPhotoUrls] = React.useState({});
  const canvasRef = React.useRef(null); const drawing = React.useRef(false); const last = React.useRef(null);
  React.useEffect(() => { setTab('details'); setSig(!!wo.signatureSigned); }, [wo.id]);
  const patch = (f) => workOrderStore.set(prev => (prev || []).map(w => w.id === wo.id ? { ...w, ...(typeof f === 'function' ? f(w) : f) } : w));
  const st = DV_WO_STATUS[wo.status] || DV_WO_STATUS.open;
  const cost = dvWoCost(wo); const value = dvWoValue(wo); const margin = value ? Math.round((value - cost.total) / value * 100) : null;
  const checklist = wo.checklist || []; const checked = checklist.filter((_, i) => wo.checkedItems && wo.checkedItems[wo.id + '-' + i]).length;
  const woPhotos = (photos || []).filter(p => p.wo === wo.id);
  const slots = wo.photoSlots || [];

  const advance = () => {
    if (wo.status === 'requested' || wo.status === 'open') { schedule(); return; }
    const next = wo.status === 'scheduled' ? 'in-progress' : 'completed';
    patch({ status: next, timerRunning: next === 'in-progress' });
    shieldToast(next === 'completed' ? `${wo.id} completed` : `${wo.id} started — timer running`, 'ok');
  };
  const schedule = () => shieldModal({
    kind: 'form', title: `Schedule ${wo.id}`, subtitle: `${wo.customer} · ${wo.type}`, submitLabel: 'Schedule', successMsg: 'Scheduled — it is on the technician’s app',
    fields: [
      { key: 'tech', label: 'Technician', type: 'select', options: ['Unassigned', ...roster.map(r => r.name)] },
      { key: 'date', label: 'Date', type: 'date', required: true, value: wo.scheduled && /^\d{4}-\d{2}-\d{2}$/.test(wo.scheduled) ? wo.scheduled : new Date().toISOString().slice(0, 10) },
      { key: 'win', label: 'Arrival window', type: 'select', options: ['Morning (8–12)', 'Afternoon (12–4)', 'All day'] },
    ],
    onSubmit: (v) => { const t = roster.find(r => r.name === v.tech); patch({ status: 'scheduled', scheduled: v.date, window: v.win, tech: t ? t.name : 'Unassigned', techId: t ? t.initials : '—', assignedTo: t ? t.id : null, acceptedAt: Date.now() }); if (t && typeof notifyWorkOrderAssigned === 'function') notifyWorkOrderAssigned({ ...wo, assignedTo: t.id, tech: t.name }); },
  });
  const setValue = () => shieldModal({ kind: 'form', title: 'Quoted value', subtitle: 'What the customer is being charged for this work order', submitLabel: 'Save', successMsg: 'Value saved', fields: [{ key: 'value', label: 'Value ($)', type: 'number', required: true, value: value ? String(value) : '' }], onSubmit: (v) => patch({ value: Number(v.value) || 0, amount: Number(v.value) || 0 }) });
  const invoice = () => { window.__dvInvoice && window.__dvInvoice({ type: 'new-invoice', customer: wo.customer, projectName: `${wo.id} · ${wo.type}${wo.site ? ' · ' + wo.site : ''}`, woId: wo.id, amount: value || cost.total }); };
  const addMaterial = () => { if (!mat.part.trim()) return; const q = Number(mat.qty) || 1; patch(w => ({ materials: [...(w.materials || []), { part: mat.part.trim(), qty: q, used: q, unitCost: Number(mat.unitCost) || 0 }] })); setMat({ part: '', qty: '1', unitCost: '' }); };
  const addItem = () => { if (!item.trim()) return; patch(w => ({ checklist: [...(w.checklist || []), item.trim()] })); setItem(''); };
  const toggle = (i) => patch(w => ({ checkedItems: { ...(w.checkedItems || {}), [w.id + '-' + i]: !(w.checkedItems || {})[w.id + '-' + i] } }));
  const upload = (e, slot) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const key = wo.id + '-' + slot; setPhotoUrls(p => ({ ...p, [key]: URL.createObjectURL(file) }));
    const store = window.__shieldStorage;
    if (store && store.uploadFile) store.uploadFile(file, { folder: 'work-orders', entity: 'work_order', entityId: wo.id, name: file.name }).then(res => { if (res && res.url) setPhotoUrls(p => ({ ...p, [key]: res.url })); shieldToast('Photo saved', 'ok'); }).catch(() => shieldToast('Photo added', 'ok'));
    else shieldToast('Photo added', 'ok');
  };
  const pt = (e) => { const c = canvasRef.current; const r = c.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) }; };
  const sigStart = (e) => { e.preventDefault(); drawing.current = true; last.current = pt(e); };
  const sigMove = (e) => { if (!drawing.current) return; const p = pt(e); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#3FA9F5'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke(); last.current = p; setSig(true); };
  const sigClear = () => { const c = canvasRef.current; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); setSig(false); };
  const remove = () => shieldModal({ kind: 'confirm', danger: true, title: `Delete ${wo.id}?`, message: 'Removed from the office and the technician app.', confirmLabel: 'Delete', successMsg: 'Deleted', onConfirm: () => { workOrderStore.set(prev => (prev || []).filter(w => w.id !== wo.id)); onClose(); } });

  const tabs = [{ id: 'details', label: 'Details' }, { id: 'materials', label: 'Materials', count: (wo.materials || []).length || undefined }, { id: 'checklist', label: `Checklist`, count: checklist.length ? `${checked}/${checklist.length}` : undefined }, { id: 'photos', label: 'Photos', count: woPhotos.length || undefined }, { id: 'signature', label: 'Sign-off' }];
  return (
    <UcDrawer title={`${wo.id} · ${wo.customer}`} sub={`${wo.type}${wo.site ? ' · ' + wo.site : ''}`} onClose={onClose} width={isMobile ? '100%' : 460}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: st.c }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: st.c }} />{st.l}</span>
        {wo.status !== 'completed' && <UcBtn small onClick={advance}>{wo.status === 'requested' || wo.status === 'open' ? 'Accept & schedule' : wo.status === 'scheduled' ? 'Start job' : 'Complete'}</UcBtn>}
        {wo.status !== 'completed' && wo.status !== 'requested' && <UcBtn small kind="ghost" onClick={schedule}>Reschedule</UcBtn>}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: wo.timerRunning ? 'var(--status-warn)' : 'var(--text-mid)', fontVariantNumeric: 'tabular-nums' }}>{fmtSeconds(wo.timerSeconds || 0)}<UcBtn small kind={wo.timerRunning ? 'danger' : 'soft'} onClick={() => patch({ timerRunning: !wo.timerRunning })}>{wo.timerRunning ? 'Pause' : 'Start timer'}</UcBtn></span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcTile label="Quoted value" value={value ? dvMoney(value) : '—'} sub={value ? 'what the customer pays' : 'set a value to track margin'} />
        <UcTile label="Cost so far" value={dvMoney(cost.total)} sub={`${dvMoney(cost.mat)} materials · ${dvMoney(cost.labor)} labor`} />
        <UcTile label="Margin" value={margin == null ? '—' : margin + '%'} sub={margin == null ? 'needs a value' : dvMoney(value - cost.total) + ' gross'} tone={margin == null ? undefined : margin < 20 ? 'warn' : 'ok'} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcBtn small kind="soft" onClick={setValue}>{value ? 'Edit value' : 'Set value'}</UcBtn>
        <UcBtn small kind="soft" onClick={invoice}>Invoice</UcBtn>
        {wo.site && <UcBtn small kind="ghost" onClick={() => shieldDirections({ address: wo.site, lat: wo.lat, lng: wo.lng, label: wo.customer })}>Directions</UcBtn>}
        <UcBtn small kind="ghost" onClick={() => { if (window.__shieldNav) window.__shieldNav('helpdesk'); }}>Ticket</UcBtn>
        <UcBtn small kind="danger" onClick={remove}>Delete</UcBtn>
      </div>
      <UcTabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'details' && (
        <div>
          {window.ShieldLocationCard && <ShieldLocationCard address={wo.site} lat={wo.lat} lng={wo.lng} label={wo.customer} sub={wo.scheduled ? `${wo.tech && wo.tech !== 'Unassigned' ? wo.tech + ' · ' : ''}${dvDate(wo.scheduled)}${wo.window ? ' · ' + wo.window : ''}` : (wo.tech && wo.tech !== 'Unassigned' ? wo.tech : 'Not scheduled yet')} height={150} style={{ marginBottom: 12 }} onPin={(pt) => patch({ lat: pt.lat, lng: pt.lng, geocodedAddr: pt.address })} />}
          <UcCard title="Job" pad={12} style={{ marginBottom: 12 }}>
            <UcProp k="Customer" v={wo.customer} />
            <UcProp k="Site" v={wo.site || '—'} />
            <UcProp k="Type" v={wo.type} />
            <UcProp k="Technician" v={wo.tech && wo.tech !== 'Unassigned' ? `${wo.tech}${wo.techId && wo.techId !== '—' ? ` (${wo.techId})` : ''}` : 'Unassigned'} />
            <UcProp k="Scheduled" v={wo.scheduled ? `${dvDate(wo.scheduled)}${wo.window ? ' · ' + wo.window : ''}` : '—'} />
            {wo.requestedVia && <UcProp k="Requested via" v={`${wo.requestedVia}${wo.requestedBy ? ' · ' + wo.requestedBy : ''}`} />}
            {wo.oppId && <UcProp k="From bid" v={wo.oppId} />}
            <UcProp k="Geocoded" v={wo.lat ? `${wo.lat.toFixed(4)}, ${wo.lng.toFixed(4)}` : (wo.site ? 'pending' : '—')} />
          </UcCard>
          <UcCard title="Scope of work" pad={12} style={{ marginBottom: 12 }}>
            <textarea value={wo.scope || ''} onChange={e => patch({ scope: e.target.value })} placeholder="What needs to be done…" style={{ ...dvInp, minHeight: 80, resize: 'vertical' }} />
            <div style={{ marginTop: 8 }}><input value={wo.notes || ''} onChange={e => patch({ notes: e.target.value })} placeholder="Notes: access, escorts, gotchas…" style={dvInp} /></div>
          </UcCard>
        </div>
      )}
      {tab === 'materials' && (
        <UcCard pad={0}>
          <UcTable cols={[{ k: 'part', l: 'Part' }, { k: 'qty', l: 'Qty', right: true, render: r => r.used != null ? r.used : r.qty }, { k: 'unitCost', l: 'Unit', right: true, render: r => dvMoney(r.unitCost) }, { k: 'total', l: 'Total', right: true, render: r => dvMoney((Number(r.used != null ? r.used : r.qty) || 0) * (Number(r.unitCost) || 0)) }, { k: 'x', l: '', w: 30, render: r => <button onClick={(e) => { e.stopPropagation(); patch(w => ({ materials: (w.materials || []).filter(m => m !== r && m.part !== r.part) })); }} style={{ ...dvFont, background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>✕</button> }]} rows={(wo.materials || []).map((m, i) => ({ ...m, id: i }))} empty={<div style={{ padding: 16, fontSize: 12, color: 'var(--text-mid)' }}>No materials on this work order yet.</div>} />
          <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <input value={mat.part} onChange={e => setMat({ ...mat, part: e.target.value })} placeholder="Part / description" style={{ ...dvInp, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') addMaterial(); }} />
            <input value={mat.qty} onChange={e => setMat({ ...mat, qty: e.target.value })} inputMode="numeric" placeholder="Qty" style={{ ...dvInp, width: 56 }} />
            <input value={mat.unitCost} onChange={e => setMat({ ...mat, unitCost: e.target.value })} inputMode="decimal" placeholder="Unit $" style={{ ...dvInp, width: 76 }} />
            <UcBtn small onClick={addMaterial}>Add</UcBtn>
          </div>
        </UcCard>
      )}
      {tab === 'checklist' && (
        <UcCard pad={12}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden', marginBottom: 12 }}><div style={{ width: checklist.length ? (checked / checklist.length * 100) + '%' : 0, height: '100%', background: checked === checklist.length && checklist.length ? 'var(--status-ok)' : 'var(--brand)' }} /></div>
          {checklist.map((c, i) => { const on = wo.checkedItems && wo.checkedItems[wo.id + '-' + i]; return (
            <div key={i} onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${on ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: on ? 'var(--ok-tint-12)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-ok)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{on ? '✓' : ''}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: on ? 'var(--text-low)' : 'var(--text-high)', textDecoration: on ? 'line-through' : 'none' }}>{c}</span>
              <button onClick={(e) => { e.stopPropagation(); patch(w => ({ checklist: (w.checklist || []).filter((_, j) => j !== i) })); }} style={{ ...dvFont, background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>✕</button>
            </div>); })}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}><input value={item} onChange={e => setItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addItem(); }} placeholder="Add a step" style={{ ...dvInp, flex: 1 }} /><UcBtn small onClick={addItem}>Add</UcBtn></div>
          {checklist.length > 0 && checked === checklist.length && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--ok-tint-12)', fontSize: 12, color: 'var(--status-ok)', fontWeight: 600 }}>All steps complete<UcBtn small kind="ghost" style={{ marginLeft: 'auto' }} onClick={() => setTab('signature')}>Go to sign-off</UcBtn></div>}
        </UcCard>
      )}
      {tab === 'photos' && (
        <div>
          {slots.length > 0 && <UcCard title="Required shots" pad={12} style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {slots.map((slot, i) => { const key = wo.id + '-' + i; const src = photoUrls[key] || (woPhotos.find(p => p.slot === slot) || {}).url; return (
                <label key={i} style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e, i)} />
                  <div style={{ aspectRatio: '4/3', borderRadius: 6, border: `1px dashed ${src ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'center', padding: 6 }}>
                    {src ? <img src={src} alt={slot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{slot}<br /><span style={{ color: 'var(--brand)', fontSize: 10.5 }}>Upload</span></span>}
                  </div>
                </label>); })}
            </div>
          </UcCard>}
          <UcCard title={`Field photos (${woPhotos.length})`} pad={12}>
            {!woPhotos.length && <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Shots the technician takes on this job land here from the app camera.</div>}
            {woPhotos.length > 0 && window.MockPhoto && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8 }}>{woPhotos.map(ph => <MockPhoto key={ph.id} photo={ph} stamp={false} style={{ aspectRatio: '4/3', borderRadius: 6, border: '1px solid var(--border-subtle)' }} />)}</div>}
          </UcCard>
        </div>
      )}
      {tab === 'signature' && (
        <UcCard title="Customer acceptance" pad={12}>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 10 }}>By signing, the customer confirms the work in {wo.id} is complete to their satisfaction.</div>
          <div style={{ position: 'relative', border: '2px dashed var(--border-strong)', borderRadius: 8, background: 'var(--canvas)', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={520} height={160} style={{ display: 'block', width: '100%', height: 160, touchAction: 'none' }} onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={() => { drawing.current = false; }} onMouseLeave={() => { drawing.current = false; }} onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={() => { drawing.current = false; }} />
            {!sig && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', fontSize: 12, color: 'var(--text-low)' }}>Sign here</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <UcBtn small kind="ghost" onClick={sigClear}>Clear</UcBtn>
            <UcBtn small disabled={!sig} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { patch({ status: 'completed', timerRunning: false, signatureSigned: true, signedAt: Date.now() }); shieldToast(`${wo.id} signed and closed`, 'ok'); }}>{wo.signatureSigned ? 'Signed ✓' : 'Submit & close work order'}</UcBtn>
          </div>
        </UcCard>
      )}
    </UcDrawer>
  );
}

function DeliverWorkOrdersScreen() {
  const [wos, setWos] = useShieldStore(workOrderStore);
  const isMobile = useIsMobile(820);
  const [tab, setTab] = useDvSub('workorder', DV_WO_SUBS, 'all', { photos: 'photos', punchlist: 'punch' });
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [selId, setSelId] = React.useState(() => { const t = woFocusStore.get(); if (t) woFocusStore.set(null); return t || null; });
  const [invModal, setInvModal] = React.useState(null);
  const techs = useTechs();
  const roster = techs.map(t => ({ id: t.uid || t.id, name: t.name, initials: t.id }));
  window.__dvInvoice = (m) => setInvModal(m);
  React.useEffect(() => { const t = setInterval(() => { if ((workOrderStore.get() || []).some(w => w.timerRunning)) workOrderStore.set(prev => prev.map(w => w.timerRunning ? { ...w, timerSeconds: (w.timerSeconds || 0) + 1 } : w)); }, 1000); return () => clearInterval(t); }, []);

  const list = (wos || []);
  const rows = list.filter(w => (tab !== 'requested' || w.status === 'requested' || w.status === 'open') && (status === 'all' || w.status === status) && docSearchMatch(q, w.id, w.customer, w.site, w.type, w.tech, w.scope, w.status));
  const sel = selId ? list.find(w => w.id === selId) : null;
  const by = (s) => list.filter(w => w.status === s);
  const weekAgo = Date.now() - 7 * 864e5;
  const openValue = list.filter(w => w.status !== 'completed').reduce((s, w) => s + dvWoValue(w), 0);

  const newWo = () => {
    const names = shieldCustomerNames();
    shieldModal({
      kind: 'form', title: 'New work order', subtitle: 'Appears on the technician’s app the moment it is assigned', submitLabel: 'Create', successMsg: 'Work order created',
      fields: [
        { key: 'customerSel', label: 'Customer', type: 'select', options: [...names, 'Other / new customer'] },
        { key: 'customerOther', label: 'New customer name', placeholder: 'If not in the list' },
        { key: 'site', label: 'Site address', full: true, placeholder: 'Street, City, State' },
        { key: 'type', label: 'Type', type: 'select', options: Object.keys(typeof WO_TEMPLATES !== 'undefined' ? WO_TEMPLATES : { Install: 1, Repair: 1, Maintenance: 1, Survey: 1 }) },
        { key: 'value', label: 'Quoted value ($)', type: 'number', placeholder: '0' },
        { key: 'tech', label: 'Technician', type: 'select', options: ['Unassigned', ...roster.map(r => r.name)] },
        { key: 'scheduled', label: 'Scheduled', type: 'date', value: new Date().toISOString().slice(0, 10) },
        { key: 'scope', label: 'Scope of work', type: 'textarea', placeholder: 'What needs to be done…' },
        { key: 'notes', label: 'Notes', full: true, placeholder: 'Access, escorts, gotchas…' },
      ],
      onSubmit: (v) => {
        const customer = (v.customerSel && v.customerSel !== 'Other / new customer' ? v.customerSel : v.customerOther || '').trim() || 'New Customer';
        const t = roster.find(r => r.name === v.tech);
        const w = buildWorkOrder({ customer, site: v.site, type: v.type, scheduled: v.scheduled, scope: v.scope, notes: v.notes, assignedTo: t ? t.id : null, techName: t ? t.name : 'Unassigned', techInitials: t ? t.initials : '—' });
        w.value = Number(v.value) || 0; w.amount = w.value;
        setWos(prev => [w, ...(prev || [])]); setSelId(w.id);
        if (t && typeof notifyWorkOrderAssigned === 'function') notifyWorkOrderAssigned(w);
        if (v.site) dvGeocodeWorkOrder(w.id, v.site);
      },
    });
  };

  const cols = [
    { k: 'id', l: 'WO', w: 90, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.id}</span> },
    { k: 'customer', l: 'Customer', render: r => <span><span style={{ fontWeight: 600 }}>{r.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.site || r.scope || '—'}</span></span> },
    { k: 'type', l: 'Type', dim: true },
    { k: 'tech', l: 'Technician', render: r => r.tech && r.tech !== 'Unassigned' ? r.tech : <span style={{ color: 'var(--status-warn)' }}>Unassigned</span> },
    { k: 'scheduled', l: 'Scheduled', render: r => dvDate(r.scheduled) },
    { k: 'status', l: 'Status', render: r => { const s = DV_WO_STATUS[r.status] || DV_WO_STATUS.open; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />{s.l}{r.timerRunning ? ' · ⏱' : ''}</span>; } },
    { k: 'value', l: 'Value', right: true, render: r => dvWoValue(r) ? dvMoney(dvWoValue(r)) : <span style={{ color: 'var(--text-low)' }}>—</span> },
  ];
  const chips = tab === 'all' ? <UcChips options={[{ id: 'all', l: 'All', n: list.length }, { id: 'requested', l: 'Requested', n: by('requested').length }, { id: 'scheduled', l: 'Scheduled', n: by('scheduled').length }, { id: 'in-progress', l: 'In progress', n: by('in-progress').length }, { id: 'completed', l: 'Completed', n: by('completed').length }]} value={status} onChange={setStatus} /> : null;
  const body = tab === 'photos' ? (window.SitePhotosScreen ? <SitePhotosScreen /> : null)
    : tab === 'punch' ? (window.PunchListScreen ? <PunchListScreen /> : null)
    : <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} selectedId={selId} onRow={r => setSelId(r.id)} empty={<UcEmpty title={tab === 'requested' ? 'No open requests' : q || status !== 'all' ? 'No work orders match' : 'No work orders yet'} body={tab === 'requested' ? 'Customer-portal and bid-board requests land here for you to accept and schedule.' : 'Create a work order, price it, assign a technician, and it appears in their app with the checklist and required shots.'} cta={tab === 'requested' ? undefined : '+ New work order'} onCta={newWo} />} /></div></UcCard>;

  return (
    <DvFrame label="Work Orders" title="Work Orders" sub={`${list.filter(w => w.status !== 'completed').length} open · ${dvMoney(openValue)} in open work`} isMobile={isMobile}
      right={<>{(tab === 'all' || tab === 'requested') && <UcSearch value={q} onChange={setQ} placeholder="Search work orders" />}<UcBtn onClick={newWo}>+ New work order</UcBtn></>}
      tiles={<>
        <UcTile label="Requested" value={by('requested').length + by('open').length} sub="awaiting acceptance" tone={by('requested').length ? 'warn' : undefined} />
        <UcTile label="Scheduled" value={by('scheduled').length} sub="on the calendar" />
        <UcTile label="In progress" value={by('in-progress').length} sub={list.filter(w => w.timerRunning).length + ' timers running'} />
        <UcTile label="Completed (7d)" value={list.filter(w => w.status === 'completed' && (w.signedAt || w.createdAt || 0) > weekAgo).length} sub="signed off" tone="ok" />
        <UcTile label="Open value" value={dvMoney(openValue)} sub="quoted, not yet completed" />
      </>}
      tabs={DV_WO_SUBS.map(s => ({ ...s, count: s.id === 'requested' && (by('requested').length + by('open').length) ? by('requested').length + by('open').length : undefined }))} tab={tab} onTab={setTab} chips={chips}
      drawer={sel && (tab === 'all' || tab === 'requested') ? <DvWoDrawer wo={sel} onClose={() => setSelId(null)} roster={roster} isMobile={isMobile} /> : null}>
      {body}
      {invModal && window.NIFinanceModal && <NIFinanceModal modal={invModal} setModal={setInvModal} showToast={(m) => shieldToast(m, 'ok')} />}
    </DvFrame>
  );
}

/* ═══════════════════ PROJECTS ═══════════════════ */
const DV_PRJ_SUBS = [{ id: 'board', label: 'Board' }, { id: 'list', label: 'List' }];
const DV_PRJ_COLS = [{ id: 'planning', label: 'Planning', c: 'var(--text-low)' }, { id: 'in-progress', label: 'In progress', c: 'var(--brand)' }, { id: 'review', label: 'Review', c: 'var(--accent-2)' }, { id: 'complete', label: 'Complete', c: 'var(--status-ok)' }];
function DeliverProjectsScreen() {
  const [projects] = useShieldStore(projectStore);
  const isMobile = useIsMobile(820);
  const [tab, setTab] = useDvSub('projects', DV_PRJ_SUBS, 'board');
  const [q, setQ] = React.useState('');
  const [stage, setStage] = React.useState('all');
  const [wizard, setWizard] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [invModal, setInvModal] = React.useState(null);
  React.useEffect(() => { if (typeof applyEstimateAcceptances === 'function') applyEstimateAcceptances(); }, []);
  /* Geocode any project that has a site address but no pin yet (one at a time, cached). */
  React.useEffect(() => { const todo = (projects || []).filter(p => p.siteAddr && !p.lat && p.geocodedAddr !== p.siteAddr); if (todo.length) dvGeocodeProject(todo[0].number, todo[0].siteAddr).then(pt => { if (!pt) updateProject(todo[0].number, { geocodedAddr: todo[0].siteAddr }); }); }, [(projects || []).map(p => p.number + ':' + (p.siteAddr || '') + ':' + (p.lat || '')).join('|')]);

  const list = (projects || []).map(p => ({ ...p, id: p.number, stageId: DV_PRJ_COLS.some(c => c.id === p.status) ? p.status : 'planning', contract: Number(p.contractTotal) || Number(p.estimatedValue) || 0, billed: typeof projectBilledPct === 'function' ? projectBilledPct(p) : 0 }));
  const rows = list.filter(p => (stage === 'all' || p.stageId === stage) && docSearchMatch(q, p.number, p.name, p.customer, p.siteAddr, p.type, p.status));
  const byStage = (s) => list.filter(p => p.stageId === s);
  const contractTotal = list.reduce((s, p) => s + p.contract, 0);
  const billedTotal = list.reduce((s, p) => s + (p.billing || []).reduce((a, b) => a + (Number(b.amount) || 0), 0), 0);

  const card = (p) => (
    <div key={p.number} onClick={() => setDetail(p.number)} className="st-clickrow" style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>{p.number}</span><span style={{ fontSize: 11, color: 'var(--text-low)' }}>{p.type}</span></div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3 }}>{p.name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{p.customer || '—'}{p.siteAddr ? ` · ${p.siteAddr}` : ''}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden' }}><span style={{ display: 'block', width: Math.min(100, p.billed) + '%', height: '100%', background: p.billed >= 100 ? 'var(--status-ok)' : 'var(--brand)' }} /></span><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{p.billed}% billed</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)' }}>{p.contract ? dvMoney(p.contract) : '—'}</span><span style={{ fontSize: 10.5, color: p.lat ? 'var(--status-ok)' : 'var(--text-low)' }}>{p.lat ? '● pinned' : p.siteAddr ? '○ geocoding' : 'no site'}</span></div>
    </div>
  );
  const cols = [
    { k: 'number', l: 'Project', w: 100, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.number}</span> },
    { k: 'name', l: 'Name', render: r => <span><span style={{ fontWeight: 600 }}>{r.name}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.customer || '—'}</span></span> },
    { k: 'type', l: 'Type', dim: true },
    { k: 'stageId', l: 'Status', render: r => { const c = DV_PRJ_COLS.find(x => x.id === r.stageId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c.c }} />{c.label}</span>; } },
    { k: 'contract', l: 'Contract', right: true, render: r => r.contract ? dvMoney(r.contract) : '—' },
    { k: 'billed', l: 'Billed', right: true, render: r => r.billed + '%' },
    { k: 'siteAddr', l: 'Site', dim: true, render: r => r.siteAddr ? <span>{r.siteAddr} <span style={{ color: r.lat ? 'var(--status-ok)' : 'var(--text-low)' }}>{r.lat ? '●' : '○'}</span></span> : '—' },
  ];
  const body = tab === 'list'
    ? <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} onRow={r => setDetail(r.number)} empty={<UcEmpty title="No projects yet" body="Accepted proposals become projects automatically; you can also start one here." cta="+ New project" onCta={() => setWizard(true)} />} /></div></UcCard>
    : list.length ? <div style={{ display: 'flex', gap: 10, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 6 }}>
        {DV_PRJ_COLS.map(c => (
          <div key={c.id} style={{ width: isMobile ? 240 : 270, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 8px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c.c }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{c.label}</span><span style={{ fontSize: 10.5, color: 'var(--text-low)', marginLeft: 'auto' }}>{byStage(c.id).length} · {dvMoney(byStage(c.id).reduce((s, p) => s + p.contract, 0))}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 70, padding: 6, borderRadius: 8, background: 'var(--brand-tint-05)', border: '1px dashed var(--border-subtle)' }}>
              {byStage(c.id).filter(p => rows.includes(p)).map(card)}
              {!byStage(c.id).length && <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center', padding: '14px 6px' }}>Nothing in {c.label.toLowerCase()}</div>}
            </div>
          </div>))}
      </div>
    : <UcEmpty title="No projects yet" body="Accepted proposals become projects automatically with the quote attached; you can also start one here." cta="+ New project" onCta={() => setWizard(true)} />;

  return (
    <DvFrame label="Projects" title="Projects" sub={`${byStage('in-progress').length} active · ${dvMoney(contractTotal)} under contract · ${dvMoney(billedTotal)} billed`} isMobile={isMobile}
      right={<><UcSearch value={q} onChange={setQ} placeholder="Search projects" /><UcBtn kind="ghost" onClick={() => window.__shieldNav && window.__shieldNav('calendar')}>Schedule</UcBtn><UcBtn onClick={() => setWizard(true)}>+ New project</UcBtn></>}
      tiles={<>
        <UcTile label="Active" value={byStage('in-progress').length} sub="in progress" />
        <UcTile label="Planning" value={byStage('planning').length} sub="not started" />
        <UcTile label="In review" value={byStage('review').length} sub="punch / closeout" />
        <UcTile label="Complete" value={byStage('complete').length} sub="closed" tone={byStage('complete').length ? 'ok' : undefined} />
        <UcTile label="Billed" value={contractTotal ? Math.round(billedTotal / contractTotal * 100) + '%' : '—'} sub={`${dvMoney(billedTotal)} of ${dvMoney(contractTotal)}`} />
      </>}
      tabs={DV_PRJ_SUBS} tab={tab} onTab={setTab}
      chips={<UcChips options={[{ id: 'all', l: 'All', n: list.length }, ...DV_PRJ_COLS.map(c => ({ id: c.id, l: c.label, n: byStage(c.id).length }))]} value={stage} onChange={setStage} />}>
      {body}
      {wizard && window.ProjectWizard && <ProjectWizard onClose={() => setWizard(false)} showToast={(m) => shieldToast(m, 'info')} onComplete={(pr) => { setWizard(false); shieldToast(`Project ${pr.number} created`, 'ok'); if (pr.siteAddr) dvGeocodeProject(pr.number, pr.siteAddr).then(pt => shieldToast(pt ? `${pr.number} site pinned on the map` : `Could not geocode “${pr.siteAddr}” — check the address`, pt ? 'ok' : 'warn')); setDetail(pr.number); }} />}
      {detail && window.ProjectDetailDrawer && <ProjectDetailDrawer number={detail} onClose={() => setDetail(null)} onNewInvoice={(p) => setInvModal({ type: 'new-invoice', customer: p.customer, projectName: p.name, projectId: p.number })} />}
      {invModal && window.NIFinanceModal && <NIFinanceModal modal={invModal} setModal={setInvModal} showToast={(m) => shieldToast(m, 'ok')} />}
    </DvFrame>
  );
}

/* ═══════════════════ CALENDAR & COPILOT ═══════════════════ */
const DV_CAL_SUBS = [{ id: 'calendar', label: 'Calendar' }, { id: 'copilot', label: 'Scheduling Copilot' }];
function DvCopilot() {
  const [jobs, setJobs] = useShieldStore(jobStore);
  const [skills] = useShieldStore(skillsStore);
  const roster = useTechs();
  const meta = React.useMemo(() => Object.fromEntries(roster.map(t => [t.id, t])), [roster]);
  const [stage, setStage] = React.useState('idle');
  const [proposals, setProposals] = React.useState([]);
  const [applied, setApplied] = React.useState([]);
  const util = {}; Object.keys(meta).forEach(t => util[t] = 0);
  jobs.forEach(j => (j.techs || []).forEach(t => { if (util[t] !== undefined) util[t] += j.dur * jobSpanDays(j); }));
  const maxHrs = 40;
  const fmtJobDate = (j) => dateOfISO(jobStartISO(j)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const issues = [];
  jobs.filter(j => !j.techs || !j.techs.length).forEach(j => issues.push({ sev: 'critical', type: 'unassigned', label: `${j.title} (${fmtJobDate(j)}) has no technician` }));
  Object.entries(util).forEach(([t, h]) => { if (h / maxHrs > 0.9) issues.push({ sev: 'warn', type: 'overload', label: `${meta[t].name} is at ${Math.round(h / maxHrs * 100)}% — burnout risk` }); });
  jobs.forEach((a, ai) => jobs.forEach((b, bi) => { if (ai < bi && (a.techs || []).some(t => (b.techs || []).includes(t)) && jobStartISO(a) <= jobEndISO(b) && jobStartISO(b) <= jobEndISO(a) && a.start < b.start + b.dur && b.start < a.start + a.dur) issues.push({ sev: 'critical', type: 'conflict', label: `${a.title} overlaps ${b.title}` }); }));
  const build = () => {
    const out = []; if (!roster.length) return out;
    jobs.filter(j => !j.techs || !j.techs.length).forEach(j => {
      const ranked = Object.keys(meta).map(t => ({ t, load: util[t], skill: (skills[t] || {})['low-voltage'] || 0, cert: (skills[t] || {})['c7-license'] || 0 })).sort((a, b) => (a.load - b.load) || (b.skill - a.skill));
      const best = ranked[0];
      const conflict = jobs.some(x => x.id !== j.id && (x.techs || []).includes(best.t) && jobStartISO(x) <= jobEndISO(j) && jobStartISO(j) <= jobEndISO(x) && x.start < j.start + j.dur && j.start < x.start + x.dur);
      out.push({ id: 'pr-' + j.id, title: j.title, from: null, to: best.t, reasons: [`Lightest load (${best.load}h this week)`, ...(best.skill ? [`Low-voltage L${best.skill}${best.cert ? ' · C-7 licensed' : ''}`] : best.cert ? ['C-7 licensed'] : []), conflict ? 'Has another job in this window — double-check' : 'No schedule conflicts in this window'], apply: () => { setJobs(prev => prev.map(x => x.id === j.id ? { ...x, techs: [best.t], techIds: [(meta[best.t] || {}).uid].filter(Boolean) } : x)); notifyJobAssigned(j, [best.t]); } });
    });
    const sorted = Object.entries(util).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 1) { const [hiT, hiH] = sorted[0], [loT, loH] = sorted[sorted.length - 1]; if (hiH - loH > 8) { const mv = jobs.find(j => (j.techs || []).length === 1 && j.techs[0] === hiT && j.type !== 'meeting' && j.dur <= 4); if (mv) out.push({ id: 'bal-' + mv.id, title: mv.title, from: hiT, to: loT, reasons: [`Levels ${meta[hiT].name} ${Math.round(hiH / maxHrs * 100)}% → ${Math.round((hiH - mv.dur) / maxHrs * 100)}%`, `${meta[loT].name} has the ${fmtJobDate(mv)} window free`], apply: () => { setJobs(prev => prev.map(x => x.id === mv.id ? { ...x, techs: [loT], techIds: [(meta[loT] || {}).uid].filter(Boolean) } : x)); notifyJobAssigned(mv, [loT]); } }); } }
    return out;
  };
  const solve = () => { setStage('solving'); setApplied([]); setTimeout(() => { setProposals(build()); setStage('proposed'); }, 900); };
  const applyOne = (p) => { p.apply(); setApplied(a => [...a, p.id]); shieldToast(`${p.title.split('—')[0].trim()} → ${meta[p.to].name}`, 'ok'); };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <UcCard title={issues.length ? `${issues.length} live issue${issues.length > 1 ? 's' : ''}` : 'Schedule is healthy'} action={<UcBtn small onClick={solve} disabled={stage === 'solving'}>{stage === 'solving' ? 'Solving…' : 'Optimize my week'}</UcBtn>} pad={12}>
          {!issues.length && <div style={{ fontSize: 12.5, color: 'var(--status-ok)' }}>Everyone assigned, no conflicts, workload balanced.</div>}
          {issues.map((i, k) => <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: i.sev === 'critical' ? 'var(--status-critical)' : 'var(--status-warn)', flexShrink: 0 }} /><span style={{ flex: 1, color: 'var(--text-high)' }}>{i.label}</span><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{i.type}</span></div>)}
        </UcCard>
        <UcCard title="Crew utilization" pad={12}>
          {!roster.length && <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>No technicians yet — invite users in Team.</div>}
          {roster.map(t => { const pct = Math.round(util[t.id] / maxHrs * 100); return (
            <div key={t.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--text-high)' }}>{t.name}</span><span style={{ color: pct > 90 ? 'var(--status-critical)' : pct > 70 ? 'var(--status-warn)' : 'var(--text-mid)', fontVariantNumeric: 'tabular-nums' }}>{util[t.id]}h · {pct}%</span></div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}><div style={{ width: Math.min(pct, 100) + '%', height: '100%', background: pct > 90 ? 'var(--status-critical)' : pct > 70 ? 'var(--status-warn)' : 'var(--brand)' }} /></div>
            </div>); })}
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Target band 60–85%. Bars update as you apply proposals.</div>
        </UcCard>
      </div>
      <UcCard title="Proposed moves" action={stage === 'proposed' && proposals.some(p => !applied.includes(p.id)) ? <UcBtn small kind="soft" onClick={() => { proposals.filter(p => !applied.includes(p.id)).forEach(p => p.apply()); setApplied(proposals.map(p => p.id)); shieldToast('All proposals applied', 'ok'); }}>Apply all</UcBtn> : null} pad={12}>
        {stage === 'idle' && <div style={{ fontSize: 12.5, color: 'var(--text-mid)', padding: '20px 0', textAlign: 'center' }}>Hit <b>Optimize my week</b> and ShieldTech AI proposes assignments with its reasoning.</div>}
        {stage === 'solving' && <div style={{ fontSize: 12, color: 'var(--text-mid)', padding: '20px 0', textAlign: 'center' }}>Checking skills, certs, drive time and workload…</div>}
        {stage === 'proposed' && !proposals.length && <div style={{ fontSize: 12.5, color: 'var(--status-ok)', padding: '20px 0', textAlign: 'center' }}>Nothing to fix — the schedule is already optimal.</div>}
        {stage === 'proposed' && proposals.map(p => { const done = applied.includes(p.id); return (
          <div key={p.id} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${done ? 'var(--status-ok)' : 'var(--border-subtle)'}`, background: done ? 'var(--ok-tint-12)' : 'var(--canvas)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{p.title}</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{p.from ? meta[p.from].name : 'Unassigned'} → <b style={{ color: 'var(--text-high)' }}>{meta[p.to].name}</b></div></div>
              {done ? <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--status-ok)' }}>Applied</span> : <UcBtn small onClick={() => applyOne(p)}>Apply</UcBtn>}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>{p.reasons.map(r => <span key={r} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)' }}>{r}</span>)}</div>
          </div>); })}
      </UcCard>
    </div>
  );
}
function DeliverCalendarScreen() {
  const [tab, setTab] = useDvSub('calendar', DV_CAL_SUBS, 'calendar', { copilot: 'copilot' });
  const isMobile = useIsMobile(820);
  // Phones get the touch calendar (agenda / week / month, tap-to-create) inside the same frame.
  const calendar = isMobile && window.MobileCalendar ? <div style={{ padding: '10px 0 0' }}><MobileCalendar onNav={(id) => window.__shieldNav && window.__shieldNav(id)} /></div> : (window.CalendarScreen ? <CalendarScreen /> : null);
  return (
    <div data-screen-label="Calendar & Copilot" style={{ display: 'flex', flexDirection: 'column', height: 'var(--uf-h, calc(100vh - 76px))', margin: 'var(--uf-m, -4px 0 0)', overflow: 'hidden', borderRadius: 'var(--uf-r, 8px)', border: 'var(--uf-b, 1px solid var(--border-subtle))', background: 'var(--canvas)' }}>
      <div style={{ padding: '10px 16px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Calendar & Copilot</div></div>
        <div style={{ marginLeft: 12 }}><UcTabs tabs={DV_CAL_SUBS} value={tab} onChange={setTab} /></div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: tab === 'copilot' || isMobile ? 'auto' : 'hidden', padding: '0 16px 12px', '--cal-h': '100%' }}>
        {tab === 'copilot' ? <DvCopilot /> : calendar}
      </div>
    </div>
  );
}

/* ═══════════════════ DISPATCH & FLEET ═══════════════════ */
const DV_DSP_SUBS = [{ id: 'map', label: 'Live map' }, { id: 'schedule', label: 'Schedule board' }, { id: 'queue', label: 'Dispatch queue' }, { id: 'owner', label: 'Where are my techs' }, { id: 'driving', label: 'Driving safety' }, { id: 'fleet', label: 'Fleet' }];
/* Dispatch queue — every unassigned job in one list: work orders without a
   technician plus the calendar's unscheduled backlog. Assign from here. */
function DvQueue() {
  const [wos] = useShieldStore(workOrderStore);
  const [backlog] = useShieldStore(backlogStore);
  const techs = useTechs();
  const roster = techs.map(t => ({ id: t.uid || t.id, name: t.name, initials: t.id }));
  const rows = [
    ...(wos || []).filter(w => w.status !== 'completed' && (!w.tech || w.tech === 'Unassigned')).map(w => ({ id: w.id, kind: 'Work order', customer: w.customer, what: `${w.type}${w.scope ? ' · ' + w.scope : ''}`, addr: w.site || '—', when: w.scheduled ? dvDate(w.scheduled) : '—', priority: w.status === 'requested' ? 'requested' : w.type === 'Repair' ? 'high' : 'normal', value: dvWoValue(w), _wo: w })),
    ...(backlog || []).map(b => ({ id: String(b.id).toUpperCase(), kind: 'Unscheduled', customer: b.customer, what: `${b.title || b.type || 'Job'} · ${b.dur || 0}h`, addr: b.addr || '—', when: 'not scheduled', priority: b.type === 'repair' ? 'high' : 'normal', value: Number(b.value) || 0 })),
  ];
  const assign = (r) => shieldModal({
    kind: 'form', title: `Assign ${r.id}`, subtitle: `${r.customer} · ${r.what}`, submitLabel: 'Assign', successMsg: 'Assigned — it is on the technician’s app',
    fields: [{ key: 'tech', label: 'Technician', type: 'select', options: roster.map(t => t.name) }, { key: 'date', label: 'Date', type: 'date', value: (r._wo && /^\d{4}-\d{2}-\d{2}$/.test(r._wo.scheduled || '') ? r._wo.scheduled : new Date().toISOString().slice(0, 10)) }],
    onSubmit: (v) => { const t = roster.find(x => x.name === v.tech); if (!t || !r._wo) return; workOrderStore.set(prev => (prev || []).map(w => w.id === r.id ? { ...w, tech: t.name, techId: t.initials, assignedTo: t.id, scheduled: v.date, status: w.status === 'requested' || w.status === 'open' ? 'scheduled' : w.status, acceptedAt: w.acceptedAt || Date.now() } : w)); if (typeof notifyWorkOrderAssigned === 'function') notifyWorkOrderAssigned({ ...r._wo, assignedTo: t.id, tech: t.name }); },
  });
  const cols = [
    { k: 'id', l: 'Ref', w: 90, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.id}</span> },
    { k: 'customer', l: 'Customer', render: r => <span><span style={{ fontWeight: 600 }}>{r.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.what}</span></span> },
    { k: 'kind', l: 'Kind', dim: true },
    { k: 'priority', l: 'Priority', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: r.priority === 'high' ? 'var(--status-critical)' : r.priority === 'requested' ? 'var(--status-warn)' : 'var(--text-low)' }} />{r.priority}</span> },
    { k: 'addr', l: 'Site', dim: true },
    { k: 'when', l: 'When', dim: true },
    { k: 'value', l: 'Value', right: true, render: r => r.value ? dvMoney(r.value) : '—' },
    { k: 'act', l: '', render: r => <span style={{ display: 'inline-flex', gap: 6 }} onClick={e => e.stopPropagation()}>{r._wo ? <UcBtn small onClick={() => assign(r)} disabled={!roster.length}>Assign</UcBtn> : <UcBtn small kind="soft" onClick={() => window.__shieldNav && window.__shieldNav('calendar')}>Schedule</UcBtn>}{r._wo && <UcBtn small kind="ghost" onClick={() => { woFocusStore.set(r.id); window.__shieldNav && window.__shieldNav('workorder'); }}>Open</UcBtn>}</span> },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcTile label="Unassigned" value={rows.length} sub="work orders + unscheduled jobs" tone={rows.length ? 'warn' : undefined} />
        <UcTile label="Requested" value={rows.filter(r => r.priority === 'requested').length} sub="customer / bid-board requests" />
        <UcTile label="Value waiting" value={dvMoney(rows.reduce((s, r) => s + r.value, 0))} sub="quoted but not dispatched" />
        <UcTile label="Technicians" value={roster.length} sub={roster.length ? 'available to assign' : 'invite users in Team'} />
      </div>
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} empty={<UcEmpty title="Queue is clear" body="Every work order has a technician and nothing is waiting in the calendar's unscheduled tray." />} /></div></UcCard>
    </div>
  );
}
function DeliverDispatchScreen() {
  const [tab, setTab] = useDvSub('dispatch', DV_DSP_SUBS, 'map', { fleet: 'fleet' });
  const [fleet] = useShieldStore(fleetStore);
  const techs = Object.values((fleet && fleet.techs) || {});
  const onDuty = techs.filter(t => t.onDuty).length;
  return (
    <div data-screen-label="Dispatch & Fleet" style={{ display: 'flex', flexDirection: 'column', height: 'var(--uf-h, calc(100vh - 76px))', margin: 'var(--uf-m, -4px 0 0)', overflow: 'hidden', borderRadius: 'var(--uf-r, 8px)', border: 'var(--uf-b, 1px solid var(--border-subtle))', background: 'var(--canvas)' }}>
      <div style={{ padding: '10px 16px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Dispatch & Fleet</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{onDuty} on duty · {techs.length} sharing location · live phone GPS</div></div>
        <div style={{ marginLeft: 12 }}><UcTabs tabs={DV_DSP_SUBS} value={tab} onChange={setTab} /></div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: tab === 'map' || tab === 'fleet' ? 'hidden' : 'auto', padding: '0 16px 12px' }}>
        {tab === 'fleet' ? (window.FleetMapScreen ? <div style={{ height: '100%' }}><FleetMapScreen /></div> : null) : tab === 'queue' ? <DvQueue /> : (window.DispatchScreen ? <DispatchScreen view={tab} embedded /> : null)}
      </div>
    </div>
  );
}

Object.assign(window, { DeliverWorkOrdersScreen, DeliverProjectsScreen, DeliverCalendarScreen, DeliverDispatchScreen, DvCopilot, DvWoDrawer, dvGeocode, dvGeocodeProject, dvGeocodeWorkOrder });

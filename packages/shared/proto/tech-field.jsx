/* Technician App — field-service shell.
   The structure every field crew already knows from the leading workforce
   apps: Home (greeting, live map of today's sites, visits summary, the next
   visit, this week) · Schedule (Day / List / Map with a week strip — Day is
   ShieldTech's Dial) · Timesheet (the Clock) · Search · More (every ShieldTech
   tool). The job page follows the same convention: status, "WO for Customer",
   address with directions, start time, one primary action plus "…", and tabs
   Job / Flow / Notes / Money — where Flow is ShieldTech's one-step-at-a-time
   execution (checklist, tests, photos, signature, timer).

   Data: the same synced stores dispatch writes (workOrderStore, jobStore,
   customerStore, photoStore, assetStore, woCheckStore), useMergedInvoices for
   money, __shieldTime for hours, __shieldChat for dispatch messages,
   __shieldLiveMap (Leaflet) for the map. Site pins are geocoded once from the
   site address via OpenStreetMap Nominatim and cached on the device. Tokens
   only. */

/* ── helpers ── */
const tfIso = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const tfMoney = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const tfFirst = () => ((window.__shieldUser || {}).name || '').split(' ')[0] || 'there';
const tfGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const tfJobValue = (j) => { const w = j._wo || {}, c = j._cal || {}; return Number(w.amount || w.total || w.value || w.price || c.value || c.amount || 0) || 0; };
const tfFmtMin = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${mm < 10 ? '0' : ''}${mm} ${m < 720 ? 'AM' : 'PM'}`; };
const tfAddDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return tfIso(d); };
const tfDayLabel = (iso, opts) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', opts || { weekday: 'long', month: 'long', day: 'numeric' });
const woNotesStore = createShieldStore('wonotes', {});

/* Geocode site addresses (OpenStreetMap Nominatim, 1 req/s, cached forever on the device). */
const TF_GEO_KEY = 'st2:geo';
let tfGeoQueue = Promise.resolve();
function tfGeoCache() { try { return JSON.parse(localStorage.getItem(TF_GEO_KEY) || '{}'); } catch { return {}; } }
function tfGeocode(addr) {
  if (!addr || addr.length < 6) return Promise.resolve(null);
  const cache = tfGeoCache(); if (cache[addr] !== undefined) return Promise.resolve(cache[addr]);
  const run = () => fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(addr), { headers: { Accept: 'application/json' } })
    .then(r => r.ok ? r.json() : []).then(rows => { const hit = rows && rows[0]; const pt = hit ? [Number(hit.lat), Number(hit.lon)] : null; try { const c = tfGeoCache(); c[addr] = pt; localStorage.setItem(TF_GEO_KEY, JSON.stringify(c)); } catch { /* quota */ } return pt; }).catch(() => null);
  const p = tfGeoQueue.then(() => new Promise(res => setTimeout(res, 1100))).then(run);
  tfGeoQueue = p.catch(() => null);
  return p;
}
function useTfPins(jobs) {
  const [pins, setPins] = React.useState({});
  const key = jobs.map(j => j.site || '').join('|');
  React.useEffect(() => {
    let alive = true;
    const sites = [...new Set(jobs.map(j => j.site).filter(Boolean))];
    // A work order / calendar job the office already pinned carries lat/lng — use it
    // straight away instead of waiting on a geocode round-trip.
    const known = {};
    jobs.forEach(j => { const src = j._wo || j._cal || {}; if (j.site && src.lat != null && src.lng != null) known[j.site] = [Number(src.lat), Number(src.lng)]; });
    if (Object.keys(known).length) setPins(p => ({ ...p, ...known }));
    sites.forEach(s => { if (known[s]) return; const c = tfGeoCache(); if (c[s]) { setPins(p => ({ ...p, [s]: c[s] })); return; } tfGeocode(s).then(pt => { if (alive && pt) setPins(p => ({ ...p, [s]: pt })); }); });
    return () => { alive = false; };
  }, [key]);
  return pins;
}

/* ── the map (Leaflet via __shieldLiveMap) ── */
function TfMap({ jobs, height = 220, focusId, onPick, style }) {
  const elRef = React.useRef(null), apiRef = React.useRef(null), layerRef = React.useRef(null), meRef = React.useRef(null);
  const pins = useTfPins(jobs);
  const [gps, setGps] = React.useState(null);
  React.useEffect(() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => setGps([p.coords.latitude, p.coords.longitude]), () => {}, { timeout: 5000, maximumAge: 120000 }); }, []);
  React.useEffect(() => {
    const lm = window.__shieldLiveMap; if (!elRef.current || !lm || apiRef.current) return;
    try { apiRef.current = lm.mount(elRef.current, { center: gps || [39.95, -75.16], zoom: 11 }); } catch { /* no map */ }
    return () => { try { apiRef.current && apiRef.current.destroy(); } catch { /* noop */ } apiRef.current = null; };
  }, []);
  React.useEffect(() => {
    const api = apiRef.current, L = window.__shieldLiveMap && window.__shieldLiveMap.L; if (!api || !L) return;
    if (layerRef.current) { layerRef.current.remove(); }
    const group = L.layerGroup().addTo(api.map); layerRef.current = group;
    const pts = [];
    jobs.forEach((j, i) => {
      const pt = pins[j.site]; if (!pt) return; pts.push(pt);
      const c = techDiscColor(techDiscipline(j)); const on = j.id === focusId;
      const html = `<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="width:${on ? 34 : 28}px;height:${on ? 34 : 28}px;border-radius:50%;background:${j.done ? 'rgba(var(--card-rgb),0.9)' : c};border:2px solid ${c};box-shadow:0 0 ${on ? 18 : 10}px ${c}99;display:flex;align-items:center;justify-content:center;font:800 11px/1 system-ui;color:#fff">${j.done ? '✓' : i + 1}</div><div style="padding:1px 6px;border-radius:6px;background:rgba(var(--card-rgb),0.9);font:600 9px/1.4 system-ui;color:#fff;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">${(j.customer || '').replace(/</g, '')}</div></div>`;
      const m = L.marker(pt, { icon: L.divIcon({ html, className: '', iconSize: [120, 50], iconAnchor: [60, 17] }) }).addTo(group);
      if (onPick) m.on('click', () => onPick(j));
    });
    if (gps) { const html = '<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--brand,#3B8BFF);box-shadow:0 0 12px rgba(var(--brand-rgb),0.8)"></div>'; L.marker(gps, { icon: L.divIcon({ html, className: '', iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(group); pts.push(gps); }
    if (pts.length) { try { api.map.fitBounds(L.latLngBounds(pts).pad(0.35), { maxZoom: 14, animate: false }); } catch { /* noop */ } }
    else if (gps) api.map.setView(gps, 12);
  }, [jobs, pins, gps, focusId]);
  const located = jobs.filter(j => pins[j.site]).length;
  return (
    <div className="tf-map" style={{ position: 'relative', height, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--card)', ...(style || {}) }}>
      <style>{'.tf-map .leaflet-control-zoom{display:none}.tf-map .leaflet-control-attribution{font-size:8px;opacity:.7}'}</style>
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      {!window.__shieldLiveMap && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-low)', fontSize: 12 }}>Map unavailable</div>}
      {jobs.length > 0 && located < jobs.length && <div className="mono" style={{ position: 'absolute', top: 8, left: 10, fontSize: 9.5, color: 'var(--text-mid)', background: 'rgba(var(--card-rgb),0.85)', padding: '3px 7px', borderRadius: 6, zIndex: 400 }}>{located}/{jobs.length} sites placed{located < jobs.length ? ' · locating…' : ''}</div>}
    </div>
  );
}

/* ── shared pieces ── */
function TfCard({ children, accent, onClick, style }) {
  return <div onClick={onClick} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '14px 16px', position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', ...(style || {}) }}>{accent && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />}{children}</div>;
}
function TfSectionTitle({ title, action, onAction }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 2px 8px' }}><span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</span>{action && <button onClick={onAction} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>{action} ›</button>}</div>;
}
function TfStatusPill({ job }) {
  const d = techDiscipline(job), c = techDiscColor(d);
  const lab = job.done ? 'Completed' : job.field === 'in-progress' ? 'In progress' : job.field === 'on-site' ? 'On site' : job.field === 'en-route' ? 'En route' : job.field === 'paused' ? 'Paused' : 'Upcoming';
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{TD_DISC[d].label} · {lab}</span>;
}
function TfJobRow({ j, onOpen, showDate }) {
  const d = techDiscipline(j), c = techDiscColor(d);
  const running = (tdTimerRead() || {}).job === (j.woId || j.id) && (tdTimerRead() || {}).start;
  return (
    <button onClick={() => onOpen(j)} style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)', opacity: j.done ? 0.6 : 1 }}>
      <span style={{ width: 4, height: 44, borderRadius: 2, background: c }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: j.done ? 'line-through' : 'none' }}>{j.customer}</span>
        <span className="mono" style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{showDate && j.date ? tfDayLabel(j.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' : ''}{j.anytime ? 'Anytime' : `${tfFmtMin(j.s)} – ${tfFmtMin(j.e)}`}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{[j.site, j.desc].filter(Boolean).join(' · ')}</span>
      </span>
      <span style={{ textAlign: 'right' }}>{running ? <span className="mono" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>{tdDur(tdTimerElapsed() / 60000)}</span> : <span style={{ color: 'var(--text-low)' }}>›</span>}</span>
    </button>
  );
}

/* ── quick-create sheet (the "+") ── */
function TfQuickSheet({ onClose, setTab, onRequest }) {
  const items = [
    ['Request a job', 'Ask dispatch to schedule new work', () => { onClose(); onRequest(); }],
    ['Snap a receipt', 'Tag it to the job on the clock', () => { onClose(); if (window.openTechReceipt) window.openTechReceipt({}); setTab('expenses'); }],
    ['Log time', 'Start the clock or add hours', () => { onClose(); setTab('time'); }],
    ['Take a photo', 'Before / during / after', () => { onClose(); setTab('capture'); }],
    ['Message dispatch', 'Chat with the office', () => { onClose(); setTab('messages'); }],
  ];
  return (
    <TmSheet title="Create" onClose={onClose}>
      {items.map(([t, s, fn]) => <button key={t} onClick={fn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}><span style={{ fontSize: 15, fontWeight: 700 }}>{t}</span><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{s}</span></button>)}
    </TmSheet>
  );
}
function TfRequestSheet({ onClose, kind }) {
  const isJob = kind === 'job';
  const [custs] = useShieldStore(customerStore);
  const [f, setF] = React.useState({ customer: '', site: '', type: 'Install', scope: '', date: tfIso() });
  const me = window.__shieldUser || {};
  const submit = () => {
    if (!f.customer.trim() || !f.scope.trim()) { shieldToast('Customer and what needs doing are required', 'warn'); return; }
    const id = 'WO-' + Date.now().toString(36).toUpperCase().slice(-5);
    const c = (custs || []).find(x => x.name === f.customer.trim());
    workOrderStore.set(prev => [{ id, customer: f.customer.trim(), site: f.site.trim() || (c && (c.address || c.site)) || '', type: f.type, scope: f.scope.trim(), status: isJob ? 'open' : 'requested', requestedBy: me.name || 'Tech', techId: (me.name || '').split(' ').map(w => w[0]).join('').toUpperCase(), assignedTo: me.id || null, scheduled: f.date, createdAt: Date.now(), notes: isJob ? `Created in the field by ${me.name || 'a technician'}` : `Requested from the field by ${me.name || 'a technician'}` }, ...(prev || [])]);
    shieldToast(isJob ? `${id} scheduled for ${f.date}` : `${id} requested — dispatch will schedule it`, 'ok'); onClose();
  };
  return (
    <TmSheet title={isJob ? 'New job' : 'Request a job'} onClose={onClose}>
      <TmField label="Customer"><input list="tf-custs" value={f.customer} onChange={e => setF(p => ({ ...p, customer: e.target.value }))} placeholder="Who is it for?" style={tmInput} /><datalist id="tf-custs">{(custs || []).map(c => <option key={c.id || c.name} value={c.name} />)}</datalist></TmField>
      <TmField label="Site address"><input value={f.site} onChange={e => setF(p => ({ ...p, site: e.target.value }))} placeholder="Street, city" style={tmInput} /></TmField>
      <TmField label="Type"><TmChips options={['Install', 'Repair', 'Maintenance', 'Survey']} value={f.type} onChange={v => setF(p => ({ ...p, type: v }))} /></TmField>
      <TmField label="What needs doing"><textarea rows={3} value={f.scope} onChange={e => setF(p => ({ ...p, scope: e.target.value }))} placeholder="Add 2 cameras to the loading dock, run Cat6 from the IDF" style={{ ...tmInput, resize: 'vertical' }} /></TmField>
      <TmField label="Preferred date"><input type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} style={tmInput} /></TmField>
      <TmPrimary label={isJob ? 'Save job' : 'Send request to dispatch'} onClick={submit} />
    </TmSheet>
  );
}
/* open a job row: requested work orders go to the request page, everything else to the job page */
function tfOpenJob(j, setTab, setSelectedJob, setCtx) {
  if (j._wo && j._wo.status === 'requested' && setCtx && window.TjRequestView) { setCtx({ id: j._wo.id }); setTab('request'); return; }
  setSelectedJob(j); setTab('job-detail');
}

/* ══════════════ Home ══════════════ */
function TechHomeView({ setTab, setSelectedJob, setCtx }) {
  const { jobs, upcoming, crewView } = useTechDay();
  const segs = React.useMemo(() => jobs.map(j => ({ ...j, disc: techDiscipline(j) })), [jobs]);
  const { t: timer, running } = useTechTimer();
  const [sheet, setSheet] = React.useState(null);
  const [unread, setUnread] = React.useState(0);
  React.useEffect(() => { const c = window.__shieldChat; if (!c || !c.unreadTotal) return; const go = () => c.unreadTotal().then(n => setUnread(Number(n) || 0)).catch(() => {}); go(); const iv = setInterval(go, 60000); return () => clearInterval(iv); }, []);
  const { rows: timeRows } = useMyTime();
  const nowMin = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  const done = segs.filter(s => s.done).length;
  const worth = segs.reduce((s, j) => s + tfJobValue(j), 0);
  const active = segs.find(s => s.field === 'in-progress' || s.field === 'on-site' || s.field === 'en-route' || s.field === 'paused');
  const next = active || segs.find(s => !s.done && s.e >= nowMin) || segs.find(s => !s.done) || null;
  const open = (j) => tfOpenJob(j, setTab, setSelectedJob, setCtx);
  const pick = (id) => {
    setSheet(null);
    if (id === 'request') setSheet('request');
    else if (id === 'job') setSheet('job');
    else if (id === 'task') setSheet('task');
    else if (id === 'client') setSheet('client');
    else if (id === 'expense') { if (window.openTechReceipt) window.openTechReceipt({}); setTab('expenses'); }
    else if (id === 'invoice' || id === 'quote') { if (setCtx) setCtx({ kind: id === 'quote' ? 'estimate' : 'invoice', prefill: {} }); setTab(id === 'quote' ? 'new-quote' : 'new-invoice'); }
  };
  /* this week */
  const mon = tmMonday(); const weekKeys = Array.from({ length: 7 }, (_, i) => tfIso(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
  const weekJobs = segs.length + upcoming.filter(d => weekKeys.includes(d.iso)).reduce((s, d) => s + d.rows.length, 0);
  const weekHours = timeRows.filter(r => weekKeys.includes(r.work_date)).reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const c = next ? techDiscColor(next.disc) : 'var(--brand)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)', paddingBottom: 70 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTab('messages')} title="Messages" style={{ position: 'relative', width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', cursor: 'pointer', fontSize: 15 }}>◷{unread > 0 && <span className="mono" style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--status-critical)', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 4px' }}>{unread}</span>}</button>
          <button onClick={() => setTab('ai')} title="ShieldTech AI" style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--brand)', cursor: 'pointer', fontSize: 15 }}>✦</button>
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, padding: '0 2px' }}>{tfGreeting()}, {tfFirst()}</div>

      {/* map + summary */}
      <div style={{ position: 'relative' }}>
        <TfMap jobs={segs} height={230} focusId={next && next.id} onPick={open} />
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 400, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(var(--card-rgb),0.88)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '9px 12px', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>{segs.length} {segs.length === 1 ? 'visit' : 'visits'}{worth > 0 ? ` worth ${tfMoney(worth)}` : ''}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{done} of {segs.length} complete{crewView ? ' · crew view' : ''}</div>
          </div>
          <button onClick={() => setTab('schedule')} style={{ pointerEvents: 'auto', background: 'rgba(var(--card-rgb),0.88)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View all ›</button>
        </div>
      </div>

      {/* the next visit */}
      {next ? (
        <TfCard accent={c} onClick={() => open(next)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.customer}</div>
            {running && timer && (timer.job === (next.woId || next.id) || timer.project === next.customer) ? <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>{tmClock(tdTimerElapsed())}</span> : <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{next.anytime ? 'Anytime' : `${tfFmtMin(next.s)} – ${tfFmtMin(next.e)}`}</span>}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 4 }}>{next.site || 'No address on file'}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.desc}</span>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: c, background: 'var(--modal)', border: '1px solid var(--border-subtle)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', marginLeft: 8 }}>{(next.woId || '').toUpperCase() || TD_DISC[next.disc].label.toUpperCase()}</span>
          </div>
          <div style={{ marginTop: 12 }}><TmPrimary label={tdPrimary(next).label} color={c} onClick={(e) => { e.stopPropagation(); const p = tdPrimary(next); if (p.next === 'en-route') { tdSetField(next, 'en-route'); shieldToast(`En route · ${next.customer}`, 'ok'); return; } if (p.next === 'on-site') { tdSetField(next, 'on-site'); tdTimerStart(next); } if (p.next === 'in-progress') { tdSetField(next, 'in-progress'); tdTimerStart(next); } open(next); }} /></div>
        </TfCard>
      ) : (
        <TfCard style={{ textAlign: 'center', padding: '22px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>No visits scheduled today</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 4 }}>Dispatched work shows up here the moment the office assigns it.</div>
          <button onClick={() => setSheet('request')} style={{ marginTop: 12, width: '100%', padding: '13px', borderRadius: 14, border: '1px dashed var(--brand)', background: 'transparent', color: 'var(--brand)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Request a job</button>
        </TfCard>
      )}

      {/* the rest of today */}
      {segs.filter(s => !next || s.id !== next.id).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <TfSectionTitle title="Later today" action="Schedule" onAction={() => setTab('schedule')} />
          {segs.filter(s => !next || s.id !== next.id).map(j => <TfJobRow key={j.id} j={j} onOpen={open} />)}
        </div>
      )}

      {/* this week */}
      <div>
        <TfSectionTitle title="This week" action="Timesheet" onAction={() => setTab('time')} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[[String(weekJobs), 'visits'], [tmHours(weekHours), 'logged'], [String(upcoming.length), 'days ahead']].map(([v, k]) => <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '11px 8px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 3 }}>{k}</div></div>)}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)', margin: '8px 2px 0' }}>{tfDayLabel(weekKeys[0], { month: 'short', day: 'numeric' })} – {tfDayLabel(weekKeys[6], { month: 'short', day: 'numeric' })}</div>
      </div>

      {/* FAB */}
      <button onClick={() => setSheet('quick')} title="Create" style={{ position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', right: 'max(16px, calc(50% - 199px))', width: 56, height: 56, borderRadius: '50%', zIndex: 500, background: 'var(--brand)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 28, fontWeight: 300, lineHeight: 1, boxShadow: '0 10px 28px color-mix(in srgb, var(--brand) 45%, transparent)' }}>+</button>
      {sheet === 'quick' && (window.TfSpeedDial ? <TfSpeedDial onClose={() => setSheet(null)} onPick={pick} /> : <TfQuickSheet onClose={() => setSheet(null)} setTab={setTab} onRequest={() => setSheet('request')} />)}
      {sheet === 'request' && <TfRequestSheet onClose={() => setSheet(null)} />}
      {sheet === 'job' && <TfRequestSheet kind="job" onClose={() => setSheet(null)} />}
      {sheet === 'task' && window.TjTaskSheet && <TjTaskSheet onClose={() => setSheet(null)} />}
      {sheet === 'client' && window.TjClientSheet && <TjClientSheet onClose={() => setSheet(null)} />}
    </div>
  );
}

/* ══════════════ Schedule ══════════════ */
function TechScheduleView({ setTab, setSelectedJob, setCtx }) {
  const { jobs, upcoming } = useTechDay();
  const [mode, setMode] = React.useState('Day');
  const today = tfIso();
  const [sel, setSel] = React.useState(today);
  const [weekStart, setWeekStart] = React.useState(() => tfIso(tmMonday()));
  const open = (j) => tfOpenJob(j, setTab, setSelectedJob, setCtx);
  const dayJobs = (iso) => iso === today ? jobs : ((upcoming.find(d => d.iso === iso) || {}).rows || []);
  const weekKeys = Array.from({ length: 7 }, (_, i) => tfAddDays(weekStart, i));
  const list = [{ iso: today, rows: jobs }, ...upcoming].filter(d => d.rows.length);
  const selJobs = dayJobs(sel);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{new Date(sel + 'T12:00:00').toLocaleDateString('en-US', { month: 'long' })}<span style={{ color: 'var(--text-low)', fontWeight: 600, fontSize: 15, marginLeft: 8 }}>{new Date(sel + 'T12:00:00').getFullYear()}</span></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setSel(today); setWeekStart(tfIso(tmMonday())); }} className="mono" style={{ padding: '7px 11px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>TODAY</button>
          <button onClick={() => setTab('route')} title="My route" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', cursor: 'pointer', fontSize: 15 }}>⌖</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, background: 'var(--card)', borderRadius: 12, padding: 3, border: '1px solid var(--border-subtle)' }}>
        {['Day', 'List', 'Map'].map(m => <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', background: mode === m ? 'var(--modal)' : 'transparent', color: mode === m ? 'var(--text-high)' : 'var(--text-low)', boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,0.3)' : 'none' }}>{m}</button>)}
      </div>
      {/* week strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(7, 1fr) 28px', alignItems: 'center', gap: 2 }}>
        <button onClick={() => setWeekStart(tfAddDays(weekStart, -7))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 16 }}>‹</button>
        {weekKeys.map(k => { const d = new Date(k + 'T12:00:00'); const on = k === sel, isT = k === today, n = dayJobs(k).length; return (
          <button key={k} onClick={() => setSel(k)} style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-low)', fontWeight: 600 }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
            <span className="mono" style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, background: on ? 'var(--brand)' : 'transparent', color: on ? '#fff' : isT ? 'var(--brand)' : 'var(--text-high)', border: isT && !on ? '1px solid var(--brand)' : '1px solid transparent' }}>{d.getDate()}</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: n ? (on ? 'var(--text-high)' : 'var(--brand)') : 'transparent' }} />
          </button>
        ); })}
        <button onClick={() => setWeekStart(tfAddDays(weekStart, 7))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 16 }}>›</button>
      </div>

      {mode === 'Day' && (sel === today ? (
        window.TechDialHome ? <TechDialHome setTab={setTab} setSelectedJob={setSelectedJob} /> : null
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '4px 2px' }}>{tfDayLabel(sel)} · {selJobs.length} {selJobs.length === 1 ? 'visit' : 'visits'}</div>
          {selJobs.length === 0 && <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12.5, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>Nothing scheduled{sel < today ? ' that day' : ' yet'}.</div>}
          {selJobs.map(j => <TfJobRow key={j.id} j={j} onOpen={open} />)}
        </div>
      ))}
      {mode === 'List' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.length === 0 && <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12.5, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>Nothing scheduled in the next two weeks.</div>}
          {list.map(d => (
            <div key={d.iso} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 0' }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: d.iso === today ? 'var(--brand)' : 'var(--text-mid)' }}>{d.iso === today ? 'Today' : tfDayLabel(d.iso, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} /><span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{d.rows.length}</span></div>
              {d.rows.map(j => <TfJobRow key={j.id} j={j} onOpen={open} />)}
            </div>
          ))}
        </div>
      )}
      {mode === 'Map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TfMap jobs={selJobs} height={360} onPick={open} />
          {selJobs.map(j => <TfJobRow key={j.id} j={j} onOpen={open} />)}
        </div>
      )}
    </div>
  );
}

/* ══════════════ Search ══════════════ */
function TechSearchView({ setTab, setSelectedJob, setCtx }) {
  const [q, setQ] = React.useState('');
  const [wos] = useShieldStore(workOrderStore);
  const [cal] = useShieldStore(jobStore);
  const [custs] = useShieldStore(customerStore);
  const [assets] = useShieldStore(assetStore);
  const invoices = useMergedInvoices();
  const me = tdMe();
  const norm = (s) => String(s || '').toLowerCase();
  const hit = (...xs) => xs.some(x => norm(x).includes(norm(q)));
  const res = React.useMemo(() => {
    if (q.trim().length < 2) return null;
    const jobs = [
      ...(wos || []).filter(w => hit(w.id, w.customer, w.site, w.scope, w.type, w.notes)).map(w => ({ ...tdJobFromWo(w, me), date: w.scheduled })),
      ...(cal || []).filter(j => hit(j.customer, j.title, j.addr, j.site, j.scope)).map(j => ({ ...tdJobFromCal(j, me), date: j.date || j.start_date })),
    ].slice(0, 12).map(j => ({ ...j, s: j.startMin != null ? j.startMin : 8 * 60, e: (j.startMin != null ? j.startMin : 8 * 60) + (j.durMin || 90), anytime: j.startMin == null }));
    const customers = (custs || []).filter(c => hit(c.name, c.contact, c.phone, c.email, c.address, c.site)).slice(0, 8);
    const assetsHit = (assets || []).filter(a => hit(a.name, a.model, a.serial, a.ip, a.customer, a.site, a.location)).slice(0, 8);
    const inv = invoices.filter(i => hit(i.num, i.customer, i.amount)).slice(0, 6);
    return { jobs, customers, assets: assetsHit, inv };
  }, [q, wos, cal, custs, assets, invoices]);
  const open = (j) => { setSelectedJob(j); setTab('job-detail'); };
  const row = (title, sub, right, fn) => <button onClick={fn} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', width: '100%', padding: '11px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', cursor: fn ? 'pointer' : 'default', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}><span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>{sub && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{sub}</span>}</span><span className="mono" style={{ fontSize: 12, color: 'var(--text-mid)' }}>{right}</span></button>;
  const group = (title, items) => items.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '6px 2px 2px' }}>{title} · {items.length}</div>{items}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', padding: '0 2px' }}>Search</div>
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Jobs, customers, sites, devices, invoices…" style={{ ...tmInput, fontSize: 16, padding: '14px 16px', borderRadius: 16 }} />
      {!res && (window.TjRecent ? <TjRecent setTab={setTab} setSelectedJob={setSelectedJob} setCtx={setCtx} /> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{[['All jobs', 'jobs'], ['Photos', 'photos'], ['Assets', 'assets'], ['Receipts', 'expenses'], ['Punch list', 'punch'], ['My truck', 'truck']].map(([l, id]) => <button key={id} onClick={() => setTab(id)} style={{ padding: '14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{l} ›</button>)}</div>)}
      {res && !res.jobs.length && !res.customers.length && !res.assets.length && !res.inv.length && <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12.5, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>Nothing matches "{q}".</div>}
      {res && group('Jobs', res.jobs.map(j => row(`${j.woId ? j.woId + ' · ' : ''}${j.customer}`, [j.site, j.desc].filter(Boolean).join(' · '), j.date ? tfDayLabel(j.date, { month: 'short', day: 'numeric' }) : '', () => open(j))))}
      {res && group('Customers', res.customers.map(c => row(c.name, [c.contact, c.phone, c.address || c.site].filter(Boolean).join(' · '), '', () => { if (c.phone) { try { navigator.clipboard.writeText(c.phone); } catch { /* noop */ } shieldToast(`${c.phone} copied`, 'ok'); } })))}
      {res && group('Devices', res.assets.map(a => row(a.name || a.model || 'Device', [a.customer, a.site || a.location, a.ip, a.serial].filter(Boolean).join(' · '), a.status || '', () => setTab('assets'))))}
      {res && group('Invoices', res.inv.map(i => row(`${i.num} · ${i.customer}`, `${i.status}${i.days > 0 ? ` · ${i.days}d overdue` : ''}`, tfMoney(i.amount), null)))}
    </div>
  );
}

/* ══════════════ More ══════════════ */
function TechMoreView({ setTab }) {
  /* Work only — the things a technician does on a job. */
  const groups = [
    ['Work', [['jobs', 'All jobs', 'Full job list and history'], ['route', 'My route', 'Today’s stops with directions'], ['photos', 'Site photos', 'Capture and job documentation'], ['punch', 'Punch list', 'Assigned fix-it items'], ['devices', 'Devices', 'Site devices — status, IPs, adopt'], ['assets', 'Assets & vault', 'Configs, passwords, docs, networks'], ['parts', 'Parts request', 'Request parts from the warehouse'], ['truck', 'My truck', 'Van stock and restock'], ['vehicle', 'Vehicle inspection', 'Daily pre-trip checklist'], ['time', 'Timesheet', 'Clock, drafts, submit the week'], ['messages', 'Message dispatch', 'Chat with the office']]],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text-high)' }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', padding: '0 2px' }}>More</div>
      {groups.map(([g, items]) => (
        <div key={g}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0 2px 8px' }}>{g}</div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
            {items.map(([id, l, d], i) => <button key={id} onClick={() => setTab(id)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', background: 'none', border: 'none', borderTop: i ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}><span><span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{l}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)', marginTop: 1 }}>{d}</span></span><span style={{ color: 'var(--text-low)' }}>›</span></button>)}
          </div>
        </div>
      ))}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
        <button onClick={() => window.__shieldAuth && window.__shieldAuth.signOut()} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--status-critical)', fontSize: 14.5, fontWeight: 600 }}>Logout</button>
      </div>
    </div>
  );
}

/* ══════════════ Job page ══════════════ */
function TechJobView({ job: raw, setTab }) {
  if (!raw) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Home</button><div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Pick a job from Home or Schedule.</div></div>;
  const [wos] = useShieldStore(workOrderStore);
  const [cal] = useShieldStore(jobStore);
  const me = tdMe();
  const job = React.useMemo(() => {
    if (raw._wo) { const w = (wos || []).find(x => x.id === raw._wo.id); return w ? { ...raw, ...tdJobFromWo(w, me), s: raw.s, e: raw.e, anytime: raw.anytime } : raw; }
    if (raw._cal) { const j = (cal || []).find(x => x.id === raw._cal.id); return j ? { ...raw, ...tdJobFromCal(j, me), s: raw.s, e: raw.e, anytime: raw.anytime } : raw; }
    return raw;
  }, [raw, wos, cal]);
  const disc = techDiscipline(job), c = techDiscColor(disc);
  const woId = job.woId || (/^WO-/.test(String(job.id)) ? job.id : null);
  const key = String(woId || job.id);
  const [tab, setTab2] = React.useState(job.field === 'in-progress' || job.field === 'on-site' || job.field === 'paused' ? 'Flow' : 'Job');
  const [more, setMore] = React.useState(false);
  const { running } = useTechTimer();
  const [custs] = useShieldStore(customerStore);
  const custRec = (custs || []).find(x => x.name && x.name === job.customer) || null;
  const contact = (job._cal && job._cal.contact) || (job._wo && job._wo.contact) || (custRec && custRec.contact) || '';
  const phone = (job._cal && job._cal.phone) || (job._wo && job._wo.phone) || (custRec && custRec.phone) || '';
  const access = (job._cal && job._cal.accessNotes) || (job._wo && job._wo.accessNotes) || '';
  const [projList] = useShieldStore(projectStore);
  const projectId = (job._cal && job._cal.projectId) || (job._wo && job._wo.projectId) || null;
  const project = projectId ? (projList || []).find(p => p.number === projectId) || null : null;
  const scope = job.scope || (project && typeof projectScope === 'function' ? projectScope(project) : '');
  const bom = (job._wo && Array.isArray(job._wo.materials) ? job._wo.materials : []).map(m => ({ name: m.name, qty: Number(m.qty) || 0, used: Number(m.used) || 0 }));
  const team = (job._cal && (job._cal.techs || [])) || (job._wo && job._wo.techId ? [job._wo.techId] : []);
  const [allPhotos] = useShieldStore(photoStore);
  const jobPhotos = (allPhotos || []).filter(p => (woId && p.wo === woId) || (projectId && p.projectId === projectId));
  const [cam, setCam] = useShieldStore(window.techCamStore || createShieldStore('techcam', { wo: null, slot: null }));
  const openCamera = (phase) => { setCam({ ...cam, wo: woId || '__unassigned', slot: null, phase: phase || null, project: projectId || cam.project || null }); setTab('capture'); };
  const value = tfJobValue(job);
  const dateLine = job._wo && job._wo.scheduled ? tfDayLabel(job._wo.scheduled, { weekday: 'short', month: 'short', day: 'numeric' }) : (job._cal && (job._cal.date || job._cal.start_date) ? tfDayLabel(job._cal.date || job._cal.start_date, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today');
  const p = tdPrimary(job);
  const act = () => { if (p.next === 'en-route') { tdSetField(job, 'en-route'); shieldToast(`En route · ${job.customer}`, 'ok'); return; } if (p.next === 'on-site') { tdSetField(job, 'on-site'); tdTimerStart(job); } if (p.next === 'in-progress') { tdSetField(job, 'in-progress'); tdTimerStart(job); } setTab2('Flow'); };
  const moreItems = [
    job.field === 'paused' ? ['Resume', () => tdSetField(job, 'in-progress')] : (job.field === 'in-progress' ? ['Pause', () => { tdSetField(job, 'paused'); shieldToast('Paused — dispatch can see it', 'info'); }] : null),
    ['Put alarm on test', () => shieldModal({ kind: 'confirm', title: 'Put alarm on test', message: 'Place this site’s alarm on test? The central station is notified and signals are ignored until you take it off test. Auto-restores after 2 hours.', confirmLabel: 'Put on test', successMsg: 'Alarm on test — central station notified' })],
    ['Navigate', () => tdNavigate(job)],
    phone ? [`Call ${contact || 'site'}`, () => { try { navigator.clipboard.writeText(phone); } catch { /* noop */ } shieldToast(`${phone} copied`, 'ok'); }] : null,
    ['Take a photo', () => openCamera('progress')],
    ['Snap a receipt', () => { if (window.openTechReceipt) window.openTechReceipt({ jobRef: woId || job.id, label: job.customer }); setTab('expenses'); }],
    ['Message dispatch', () => setTab('messages')],
    ['Ask ShieldTech AI', () => setTab('ai')],
  ].filter(Boolean);
  const panel = (title, body, right) => <div style={{ padding: '14px 2px', borderTop: '1px solid var(--border-subtle)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>{right}</div>{body}</div>;
  const ghostBtn = (label, fn) => <button onClick={fn} style={{ background: 'var(--card)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '10px 12px', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{label}</button>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 20, cursor: 'pointer', padding: '0 4px 0 0' }}>‹</button>
        <span style={{ display: 'flex', gap: 6 }}>
          {phone && <button onClick={() => { try { navigator.clipboard.writeText(phone); } catch { /* noop */ } shieldToast(`${phone} copied`, 'ok'); }} title="Call" style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', cursor: 'pointer', fontSize: 15 }}>✆</button>}
          <button onClick={() => setTab('ai')} title="ShieldTech AI" style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--brand)', cursor: 'pointer', fontSize: 15 }}>✦</button>
        </span>
      </div>
      <TfStatusPill job={job} />
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{woId || 'Job'} for {job.customer}{value > 0 ? ` for ${tfMoney(value)}` : ''}</div>
      <div style={{ fontSize: 15, color: 'var(--text-mid)', fontWeight: 600 }}>{job.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{job.site || <span style={{ color: 'var(--text-low)' }}>No address on file</span>}</div>
        {job.site && <button onClick={() => tdNavigate(job)} title="Directions" style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--card)', color: c, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>⌖</button>}
      </div>
      <div><div style={{ fontSize: 12, color: 'var(--text-low)', fontWeight: 600 }}>Start</div><div style={{ fontSize: 15, fontWeight: 600 }}>{dateLine}{job.anytime ? ' · anytime' : ` · ${tfFmtMin(job.s)} – ${tfFmtMin(job.e)}`}{running && (job.field === 'in-progress' || job.field === 'on-site') ? <span className="mono" style={{ color: 'var(--brand)', marginLeft: 8 }}>{tdDur(tdTimerElapsed() / 60000)} on site</span> : null}</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <button onClick={job.done ? () => setTab2('Flow') : act} style={{ border: 'none', borderRadius: 14, padding: '14px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: job.done ? 'var(--text-high)' : '#fff', background: job.done ? 'var(--modal)' : c, boxShadow: job.done ? 'none' : `0 8px 24px ${c}55`, fontFamily: 'var(--font-body)' }}>{p.label}</button>
        <button onClick={() => setMore(true)} style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 18px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>···</button>
      </div>
      {/* tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginTop: 4 }}>
        {['Job', 'Flow', 'Notes', 'Money'].map(t => <button key={t} onClick={() => setTab2(t)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? c : 'transparent'}`, marginBottom: -1, color: tab === t ? 'var(--text-high)' : 'var(--text-low)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t}</button>)}
      </div>

      {tab === 'Job' && (
        <div>
          {panel('Instructions', <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', color: job.details ? 'var(--text-high)' : 'var(--text-low)' }}>{job.details || 'No instructions from dispatch on this job.'}</div>)}
          {(contact || phone || access) && panel('Site access', <React.Fragment>{(contact || phone) && <div style={{ fontSize: 14 }}>{contact}{contact && phone ? ' · ' : ''}<span className="mono">{phone}</span></div>}{access && <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.5 }}>{access}</div>}</React.Fragment>)}
          {panel('Scope of work', <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', color: scope ? 'var(--text-high)' : 'var(--text-low)' }}>{scope || 'No written scope — confirm with the site contact before starting.'}</div>, project && <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{project.number}</span>)}
          {panel('Line items', bom.length ? bom.map((b, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none', fontSize: 14 }}><span>{b.name}</span><span className="mono" style={{ color: 'var(--text-mid)' }}>{b.used}/{b.qty}</span></div>) : <div style={{ fontSize: 13, color: 'var(--text-low)' }}>No equipment listed. Add parts from My truck as you use them.</div>, bom.length ? ghostBtn('My truck', () => setTab('truck')) : null)}
          {project && (project.drawings || []).length > 0 && window.BlueprintRows && panel('Blueprints', <BlueprintRows drawings={project.drawings} onOpen={(d) => shieldToast(d.name || 'Open from the Flow tab', 'info')} />)}
          {panel('Photos', jobPhotos.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>{jobPhotos.slice(0, 8).map((ph, i) => window.MockPhoto ? <MockPhoto key={ph.id || i} photo={ph} stamp={false} onClick={() => setTab('photos')} style={{ aspectRatio: '1', borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer' }} /> : null)}</div> : <div style={{ fontSize: 13, color: 'var(--text-low)' }}>No photos yet — the office expects before and after shots.</div>, ghostBtn('◉ Camera', () => openCamera('progress')))}
          {panel('Team', <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(team.length ? team : [me.initials || 'ME']).map((t, i) => <span key={i} className="mono" style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--border-subtle)' }}>{t}</span>)}</div>)}
        </div>
      )}
      {tab === 'Flow' && window.JobFlowView && <div style={{ paddingTop: 6 }}><JobFlowView job={job} setTab={setTab} embedded /></div>}
      {tab === 'Notes' && <TfNotes jobKey={key} job={job} />}
      {tab === 'Money' && <TfMoney job={job} woId={woId} projectId={projectId} />}

      {more && (
        <TmSheet title={job.customer} onClose={() => setMore(false)}>
          {moreItems.map(([l, fn]) => <button key={l} onClick={() => { setMore(false); fn(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--card)', color: 'var(--text-high)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{l}</button>)}
        </TmSheet>
      )}
    </div>
  );
}

function TfNotes({ jobKey, job }) {
  const [all, setAll] = useShieldStore(woNotesStore);
  const notes = ((all || {})[jobKey] || []);
  const [text, setText] = React.useState('');
  const me = window.__shieldUser || {};
  const add = () => { if (!text.trim()) return; setAll(prev => ({ ...(prev || {}), [jobKey]: [{ id: genId('note'), text: text.trim(), by: me.name || 'Tech', at: Date.now() }, ...(((prev || {})[jobKey]) || [])] })); setText(''); shieldToast('Note saved — the office can see it', 'ok'); };
  const dispatchNotes = (job._wo && job._wo.notes) || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
      <textarea rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Found the old NVR unplugged; customer asked about a 5th camera on the loading dock…" style={{ ...tmInput, resize: 'vertical' }} />
      <TmPrimary label="Add note" disabled={!text.trim()} onClick={add} />
      {dispatchNotes && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border-subtle)' }}><div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 6 }}>From dispatch</div><div style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{dispatchNotes}</div></div>}
      {notes.map(n => <div key={n.id} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}><div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.text}</div><div className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 6 }}>{n.by} · {new Date(n.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div></div>)}
      {!notes.length && !dispatchNotes && <div style={{ fontSize: 12.5, color: 'var(--text-low)', textAlign: 'center', padding: 10 }}>No notes on this job yet.</div>}
    </div>
  );
}

function TfMoney({ job, woId, projectId }) {
  const invoices = useMergedInvoices();
  const estimates = useMergedEstimates();
  const mine = invoices.filter(i => (projectId && i.project_id === projectId) || i.customer === job.customer);
  const est = estimates.filter(e => e.customer === job.customer).slice(0, 4);
  const open = mine.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const [approvals, setApprovals] = useShieldStore(approvalStore);
  const asked = (approvals || []).some(a => a.kind === 'INVOICE REQUEST' && a.title.includes(String(woId || job.customer)) && a.status === 'pending');
  const ask = () => { setApprovals(prev => [{ id: (prev || []).reduce((m, a) => Math.max(m, a.id), 0) + 1, kind: 'INVOICE REQUEST', title: `${woId || job.customer} — invoice the completed work`, amt: '', sub: `Requested from the field by ${(window.__shieldUser || {}).name || 'a technician'}`, status: 'pending' }, ...(prev || [])]); shieldToast('Sent to the office → Approvals', 'ok'); };
  const money = (n) => tfMoney(n);
  const statusColor = (s) => s === 'paid' ? 'var(--status-ok)' : s === 'overdue' ? 'var(--status-critical)' : s === 'pending' || s === 'sent' ? 'var(--status-warn)' : 'var(--text-low)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[[money(tfJobValue(job)), 'job value'], [String(mine.length), 'invoices'], [money(open), 'unpaid']].map(([v, k]) => <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '11px 8px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 3 }}>{k}</div></div>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, margin: '6px 2px 0' }}>Invoices</div>
      {mine.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-low)', padding: '4px 2px' }}>No invoices on this job yet.</div>}
      {mine.slice(0, 6).map(i => <div key={i.num} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '11px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}><span><span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{i.num}</span><span style={{ display: 'block', fontSize: 11.5, color: statusColor(i.status), marginTop: 2, fontWeight: 600, textTransform: 'capitalize' }}>{i.status}{i.days > 0 ? ` · ${i.days}d overdue` : ''}</span></span><span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{money(i.amount)}</span></div>)}
      {est.length > 0 && <React.Fragment><div style={{ fontSize: 15, fontWeight: 700, margin: '6px 2px 0' }}>Quotes</div>{est.map(e => <div key={e.num} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '11px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}><span><span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{e.num}</span><span style={{ display: 'block', fontSize: 11.5, color: statusColor(e.status), marginTop: 2, fontWeight: 600, textTransform: 'capitalize' }}>{e.status}</span></span><span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{money(e.amount)}</span></div>)}</React.Fragment>}
      <div style={{ fontSize: 15, fontWeight: 700, margin: '6px 2px 0' }}>Payments</div>
      <div style={{ fontSize: 13, color: 'var(--text-low)', padding: '0 2px' }}>{mine.some(i => i.status === 'paid') ? `${mine.filter(i => i.status === 'paid').length} paid` : 'No payments recorded yet.'}</div>
      {job.done && !asked && <TmPrimary label="Ask the office to invoice this job" onClick={ask} />}
      {asked && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--status-ok)', fontWeight: 600 }}>Invoice requested — the office has it in Approvals ✓</div>}
      {!job.done && <div style={{ fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>Invoicing opens once the job is signed off.</div>}
    </div>
  );
}

Object.assign(window, { TechHomeView, TechScheduleView, TechSearchView, TechMoreView, TechJobView, TfMap, TfRequestSheet, tfOpenJob, woNotesStore, tfGeocode });

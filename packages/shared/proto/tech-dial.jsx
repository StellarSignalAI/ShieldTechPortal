/* Technician App — the Dial.
   The home screen is one instrument: a ticked bezel that holds the working
   day (6 AM → 8 PM) with every dispatched job as a block on the track. A fixed
   needle at 12 o'clock; the tech turns the day under it, and the job under the
   needle is the one card below, with one action. It clicks from job to job.
   Nothing moves unless the tech moves it.

   Data: the same rows the portal's Dispatch/Calendar write (workOrderStore +
   jobStore), filtered to this tech; status, checklist ticks, photos and the
   signature all persist to the same shared stores the office watches.

   Execution (JobFlowView): Arrive → Verify → Install → Test → Sign-off, one
   step on screen at a time, the timer running from "on site" to completion.

   Colors come from the design tokens (--disc-*, --brand, --text-*), so the
   color pass is a token change, not a rewrite. */

/* ── geometry: 6:00 → 20:00 across a 300° gauge, 0° = needle at top ── */
const TD_WIN = { s: 6 * 60, e: 20 * 60 };
const TD_SPAN = 300, TD_START = -150;
const tdClampMin = (m) => Math.max(TD_WIN.s, Math.min(TD_WIN.e, m));
const tdAng = (min) => TD_START + (tdClampMin(min) - TD_WIN.s) / (TD_WIN.e - TD_WIN.s) * TD_SPAN;
const tdRad = (d) => d * Math.PI / 180;
const tdNowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const tdFmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${mm < 10 ? '0' : ''}${mm}`; };
const tdAp = (m) => (m < 720 ? 'am' : 'pm');
const tdDur = (mins) => { mins = Math.max(0, Math.round(mins)); const h = Math.floor(mins / 60), m = mins % 60; return (h ? `${h}h ` : '') + `${m < 10 && h ? '0' : ''}${m}m`; };
const tdVar = (name, fb) => { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch { return fb; } };
const tdReduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/* ── service discipline from what the job says it is ── */
const TD_DISC = {
  fire:    { label: 'Fire',               token: '--disc-fire',    fb: '#FF3B5C' },
  alarm:   { label: 'Alarm',              token: '--disc-alarm',   fb: '#9B5CFF' },
  access:  { label: 'Access Control',     token: '--disc-access',  fb: '#19E3EC' },
  cctv:    { label: 'CCTV',               token: '--disc-cctv',    fb: '#1E80F0' },
  cabling: { label: 'Structured Cabling', token: '--disc-cabling', fb: '#27E39A' },
  general: { label: 'Service',            token: '--brand',        fb: '#6366F1' },
};
function techDiscipline(job) {
  const t = [job.desc, job.scope, job._wo && job._wo.type, job._wo && job._wo.scope, job._cal && job._cal.type, job._cal && job._cal.title].filter(Boolean).join(' ').toLowerCase();
  if (/\bfire\b|smoke|sprinkler|pull station|horn/.test(t)) return 'fire';
  if (/alarm|intrusion|ajax|burg|keypad|\bzone/.test(t)) return 'alarm';
  if (/access|door|reader|strike|intercom|brivo|verkada|maglock|credential/.test(t)) return 'access';
  if (/cctv|camera|cams?\b|nvr|ptz|video|surveil|recorder/.test(t)) return 'cctv';
  if (/cable|cat ?6|cat ?5|fiber|\bdrops?\b|rack|patch|wap|network|switch|structured/.test(t)) return 'cabling';
  return 'general';
}
const techDiscColor = (d) => tdVar(TD_DISC[d].token, TD_DISC[d].fb);

/* ── one normalized day for this technician ── */
function tdMe() {
  const me = window.__shieldUser || {};
  return { id: me.id, initials: (me.name || '').split(' ').map(w => w[0]).join('').toUpperCase(), name: me.name || '' };
}
function tdIsMineWo(w, me) { return (me.id && w.assignedTo === me.id) || (me.initials && w.techId === me.initials); }
function tdIsMineCal(j, me) { return (me.id && (j.techIds || []).includes(me.id)) || (me.initials && (j.techs || []).includes(me.initials)); }

function tdJobFromWo(w, me) {
  const field = w.fieldStatus || (w.status === 'done' || w.status === 'completed' ? 'complete' : w.status === 'active' ? 'in-progress' : null);
  return { id: w.id, woId: w.id, kind: 'wo', customer: w.customer, desc: w.scope || w.type || 'Work order', scope: w.scope || '', site: w.site || '', details: w.notes || '',
    field, done: field === 'complete', mine: tdIsMineWo(w, me), startMin: w.start != null ? Math.round(Number(w.start) * 60) : null, durMin: w.dur != null ? Math.round(Number(w.dur) * 60) : 90, _wo: w, _cal: null };
}
function tdJobFromCal(j, me) {
  const field = j.fieldStatus || null;
  return { id: 'cal-' + j.id, woId: j.wo || null, kind: 'cal', customer: j.customer || j.title || 'Scheduled job', desc: j.title || j.type || '', scope: j.scope || '', site: j.addr || j.site || '', details: j.details || '',
    field, done: field === 'complete', mine: tdIsMineCal(j, me), startMin: Math.round((Number(j.start) || 8) * 60), durMin: Math.round((Number(j.dur) || 1.5) * 60), _wo: null, _cal: j };
}
/* Untimed work orders are packed into the first free slot from 8:00 so they
   still occupy the day; the card says "anytime" so nobody mistakes it for a
   dispatch time. */
function tdLayout(jobs) {
  const timed = jobs.filter(j => j.startMin != null).map(j => ({ ...j, s: tdClampMin(j.startMin), e: tdClampMin(j.startMin + j.durMin), anytime: false }));
  const out = [...timed];
  let cursor = 8 * 60;
  jobs.filter(j => j.startMin == null).forEach(j => {
    const len = j.durMin || 90;
    for (let guard = 0; guard < 40; guard++) {
      const hit = out.find(o => cursor < o.e && cursor + len > o.s);
      if (!hit) break; cursor = hit.e + 15;
    }
    const s = tdClampMin(cursor), e = tdClampMin(cursor + len);
    out.push({ ...j, s, e: Math.max(e, s + 20), anytime: true });
    cursor = e + 15;
  });
  return out.sort((a, b) => a.s - b.s);
}
function useTechDay() {
  const [wos] = useShieldStore(workOrderStore);
  const [cal] = useShieldStore(jobStore);
  const me = tdMe();
  const todayIso = new Date().toISOString().slice(0, 10);
  return React.useMemo(() => {
    const all = [
      ...(wos || []).filter(w => w.scheduled === todayIso || w.status === 'active' || w.fieldStatus && w.fieldStatus !== 'complete' && w.scheduled <= todayIso).map(w => tdJobFromWo(w, me)),
      ...(cal || []).filter(j => jobOnISO(j, todayIso)).map(j => tdJobFromCal(j, me)),
    ];
    const mine = all.filter(j => j.mine);
    const jobs = tdLayout(mine.length ? mine : all);
    const upcoming = [];
    for (let d = 1; d <= 14; d++) {
      const iso = addDaysISO(todayIso, d);
      const rows = [
        ...(wos || []).filter(w => w.scheduled === iso).map(w => tdJobFromWo(w, me)),
        ...(cal || []).filter(j => jobOnISO(j, iso)).map(j => tdJobFromCal(j, me)),
      ];
      const m = rows.filter(j => j.mine);
      const show = (mine.length || m.length) ? m : rows;
      if (show.length) upcoming.push({ iso, rows: tdLayout(show) });
    }
    return { jobs, upcoming, crewView: !mine.length && all.length > 0 };
  }, [wos, cal, todayIso]);
}

/* ── persistence: status, timer ── */
function tdSetField(job, s) {
  if (job._wo) workOrderStore.set(list => (list || []).map(w => w.id === job._wo.id
    ? { ...w, fieldStatus: s, status: s === 'complete' ? 'done' : (w.status === 'done' ? 'done' : 'active'), ...(s === 'complete' ? { completedAt: Date.now() } : {}) } : w));
  if (job._cal) jobStore.set(list => (list || []).map(j => j.id === job._cal.id ? { ...j, fieldStatus: s } : j));
}
const TD_TIMER_KEY = 'st2:timer';
function tdTimerRead() { try { return JSON.parse(localStorage.getItem(TD_TIMER_KEY) || 'null'); } catch { return null; } }
const tdTimerPing = () => { try { window.dispatchEvent(new Event('st2:timer')); } catch { /* noop */ } };
/* Shared with the Clock (tech-money.jsx): {start, project, task, job, startedAt}
   while running, {pausedElapsed, …} while paused. */
function tdTimerStart(job) {
  const cur = tdTimerRead();
  if (cur && cur.start) return cur;
  const paused = (cur && cur.pausedElapsed) || 0;
  const t = { start: Date.now() - paused * 1000, project: job.customer, task: (cur && cur.task) || 'Installation', job: job.woId || job.id, startedAt: (cur && cur.startedAt) || Date.now() };
  try { localStorage.setItem(TD_TIMER_KEY, JSON.stringify(t)); } catch { /* quota */ }
  tdTimerPing();
  return t;
}
function tdTimerStop() { const t = tdTimerRead(); try { localStorage.removeItem(TD_TIMER_KEY); } catch { /* noop */ } tdTimerPing(); return t ? (t.start ? Math.max(0, Date.now() - t.start) : (t.pausedElapsed || 0) * 1000) : 0; }
function tdTimerElapsed() { const t = tdTimerRead(); return t ? (t.start ? Math.max(0, Date.now() - t.start) : (t.pausedElapsed || 0) * 1000) : 0; }

/* ── the next right step for a job ── */
const TD_FIELD_LABEL = { 'en-route': 'En route', 'on-site': 'On site', 'in-progress': 'In progress', paused: 'Paused', complete: 'Completed' };
function tdPrimary(job) {
  switch (job.field) {
    case null: case undefined: case 'scheduled': return { label: 'Start — en route', next: 'en-route', open: false };
    case 'en-route': return { label: "I'm on site", next: 'on-site', open: true };
    case 'on-site': return { label: 'Begin work', next: 'in-progress', open: true };
    case 'in-progress': return { label: 'Continue job', next: null, open: true };
    case 'paused': return { label: 'Resume', next: 'in-progress', open: true };
    case 'complete': return { label: 'Job summary', next: null, open: true, done: true };
    default: return { label: 'Open job', next: null, open: true };
  }
}
function tdNavigate(job) {
  const dest = job.site || job.customer || '';
  if (!dest) { shieldToast('No site address on this job — ask dispatch', 'warn'); return; }
  window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest), '_blank');
}

/* ══════════════ The Dial ══════════════ */
function TechDial({ segs, nowMin, focusId, onFocus }) {
  const wrapRef = React.useRef(null), cvRef = React.useRef(null);
  const rot = React.useRef(null);
  const drag = React.useRef({ on: false, a0: 0, r0: 0, moved: 0, last: [] });
  const anim = React.useRef(null);
  const focusRef = React.useRef(focusId);
  focusRef.current = focusId;
  const reduce = tdReduce();
  const detents = React.useCallback(() => [...segs.map(s => -tdAng(s.s)), -tdAng(nowMin)], [segs, nowMin]);
  const focusAt = React.useCallback((r) => {
    const a = -r;
    const hit = segs.find(s => a >= tdAng(s.s) && a <= tdAng(s.e));
    if (hit) return hit;
    if (!segs.length) return null;
    return segs.reduce((b, s) => Math.abs(tdAng(s.s) - a) < Math.abs(tdAng(b.s) - a) ? s : b);
  }, [segs]);

  const draw = React.useCallback(() => {
    const cv = cvRef.current, wrap = wrapRef.current; if (!cv || !wrap) return;
    const w = wrap.clientWidth; if (w < 120) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = w / 2, r = rot.current || 0;
    const ink = tdVar('--text-high', '#FAFAFB');
    ctx.clearRect(0, 0, w, w); ctx.save(); ctx.translate(R, R);
    ctx.beginPath(); ctx.arc(0, 0, R - 66, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.rotate(tdRad(r));
    const pt = (a, rad) => [rad * Math.sin(tdRad(a)), -rad * Math.cos(tdRad(a))];
    for (let m = TD_WIN.s; m <= TD_WIN.e; m += 15) {
      const major = m % 60 === 0, a = tdAng(m), p0 = pt(a, R - 5), p1 = pt(a, R - 5 - (major ? 12 : 6));
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
      ctx.strokeStyle = major ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = major ? 1.6 : 1; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.font = `500 10.5px ${tdVar('--font-mono', 'ui-monospace, monospace')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [[360, '6a'], [540, '9a'], [720, '12p'], [900, '3p'], [1080, '6p']].forEach(([m, t]) => {
      const p = pt(tdAng(m), R - 52); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-tdRad(r)); ctx.fillStyle = 'rgba(250,250,251,0.4)'; ctx.fillText(t, 0, 0); ctx.restore();
    });
    const TR = R - 32;
    segs.forEach(s => {
      const f = s.id === focusRef.current, c = techDiscColor(s.disc);
      ctx.beginPath(); ctx.arc(0, 0, TR, tdRad(tdAng(s.s) - 90), tdRad(tdAng(s.e) - 90)); ctx.lineCap = 'round'; ctx.lineWidth = f ? 10 : 8;
      ctx.strokeStyle = c; ctx.globalAlpha = s.done ? (f ? 0.75 : 0.28) : (f ? 1 : 0.42); ctx.shadowColor = c; ctx.shadowBlur = f ? 16 : 0; ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      if (s.done) { const q = pt((tdAng(s.s) + tdAng(s.e)) / 2, TR); ctx.beginPath(); ctx.arc(q[0], q[1], 2.2, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); }
      if (s.field === 'in-progress' || s.field === 'on-site') { const q = pt(tdAng(s.s), R - 18); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0; }
    });
    const n = pt(tdAng(nowMin), TR);
    ctx.beginPath(); ctx.arc(n[0], n[1], 4.5, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.shadowColor = ink; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(n[0], n[1], 7.5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(250,250,251,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }, [segs, nowMin]);

  const fromDial = React.useRef(null); // focus changes the dial itself made — never re-animate those
  const setRot = React.useCallback((v) => {
    rot.current = v; draw();
    const f = focusAt(v);
    if (f && f.id !== focusRef.current) { focusRef.current = f.id; fromDial.current = f.id; try { if (navigator.vibrate) navigator.vibrate(6); } catch { /* noop */ } onFocus(f.id); }
  }, [draw, focusAt, onFocus]);
  const animateTo = React.useCallback((target, ms = 420) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    if (reduce) { setRot(target); return; }
    const from = rot.current || 0, t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); setRot(from + (target - from) * e); if (k < 1) anim.current = requestAnimationFrame(step); else anim.current = null; };
    anim.current = requestAnimationFrame(step);
  }, [reduce, setRot]);
  const snap = React.useCallback((from) => { const d = detents(); if (!d.length) return; let best = d[0]; d.forEach(v => { if (Math.abs(v - from) < Math.abs(best - from)) best = v; }); animateTo(best); }, [detents, animateTo]);

  /* First mount / day change: dial in the focused job (or now). */
  React.useEffect(() => {
    const target = segs.find(s => s.id === focusId);
    const r = target ? -tdAng(target.s) : -tdAng(nowMin);
    if (rot.current == null) { rot.current = r; draw(); }
    else if (target && fromDial.current !== focusId && Math.abs((rot.current || 0) - r) > 0.5 && !drag.current.on) { /* focus set from the list below — dial to it */ animateTo(r); }
    fromDial.current = null;
  }, [focusId, segs.length]);
  React.useEffect(() => { draw(); const ro = new ResizeObserver(draw); if (wrapRef.current) ro.observe(wrapRef.current); return () => ro.disconnect(); }, [draw]);

  const angleOf = (e) => { const r = wrapRef.current.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  const distOf = (e) => { const r = wrapRef.current.getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); };
  const onDown = (e) => { if (e.target.closest('button')) return; if (anim.current) { cancelAnimationFrame(anim.current); anim.current = null; } drag.current = { on: true, a0: angleOf(e), r0: rot.current || 0, moved: 0, last: [[angleOf(e), performance.now()]] }; wrapRef.current.setPointerCapture(e.pointerId); };
  const onMove = (e) => { const d = drag.current; if (!d.on) return; const a = angleOf(e), delta = ((a - d.a0 + 540) % 360) - 180; d.moved = Math.max(d.moved, Math.abs(delta)); const raw = d.r0 + delta, lim = TD_SPAN / 2; setRot(raw > lim ? lim + (raw - lim) * 0.28 : raw < -lim ? -lim + (raw + lim) * 0.28 : raw); d.last.push([a, performance.now()]); if (d.last.length > 4) d.last.shift(); };
  const onUp = (e) => {
    const d = drag.current; if (!d.on) return; d.on = false;
    if (d.moved < 3) {
      const R = wrapRef.current.clientWidth / 2, dd = distOf(e);
      if (dd > R - 50 && dd <= R) {
        const ta = ((angleOf(e) + 90) - (rot.current || 0) + 540) % 360 - 180;
        const hit = segs.find(s => ta >= tdAng(s.s) - 3 && ta <= tdAng(s.e) + 3);
        if (hit) { animateTo(-tdAng(hit.s)); return; }
      }
      snap(rot.current || 0); return;
    }
    let v = 0; if (d.last.length > 1) { const p = d.last[0], q = d.last[d.last.length - 1], dt = q[1] - p[1]; if (dt > 0) v = (((q[0] - p[0] + 540) % 360) - 180) / dt; }
    snap(Math.max(-TD_SPAN / 2, Math.min(TD_SPAN / 2, (rot.current || 0) + v * 140)));
  };
  const wheelT = React.useRef(null);
  const onWheel = (e) => { e.preventDefault(); setRot(Math.max(-TD_SPAN / 2, Math.min(TD_SPAN / 2, (rot.current || 0) + e.deltaY * 0.08))); clearTimeout(wheelT.current); wheelT.current = setTimeout(() => snap(rot.current || 0), 140); };

  const f = segs.find(s => s.id === focusId) || null;
  const c = f ? techDiscColor(f.disc) : tdVar('--text-low', '#656365');
  return (
    <div ref={wrapRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
      style={{ position: 'relative', width: 'min(100%, 320px)', aspectRatio: '1', margin: '0 auto', touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {/* needle */}
      <div style={{ position: 'absolute', left: '50%', top: 2, width: 2.5, height: 26, borderRadius: 2, background: 'var(--text-high)', transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 3 }}>
        <div style={{ position: 'absolute', left: '50%', top: -1, transform: 'translateX(-50%)', border: '5px solid transparent', borderTop: '7px solid var(--text-high)', borderBottom: 0 }} />
      </div>
      {/* readout */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none', width: '60%', zIndex: 2 }}>
        {f ? (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: c, marginBottom: 6, fontWeight: 500 }}>{TD_DISC[f.disc].label}</div>
            <div className="mono" style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{f.anytime ? '—' : tdFmt(f.s)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6, fontWeight: 500 }}>{f.anytime ? 'anytime today' : `${tdAp(f.s)} – ${tdFmt(f.e)} ${tdAp(f.e)}`}</div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 6 }}>Today</div>
            <div className="mono" style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-high)' }}>{tdFmt(nowMin)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>no jobs on the dial</div>
          </React.Fragment>
        )}
      </div>
      <button onClick={() => animateTo(-tdAng(nowMin))} className="mono" style={{ position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%)', zIndex: 3, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--text-mid)', fontSize: 11, letterSpacing: '0.08em', padding: '6px 12px', borderRadius: 999, cursor: 'pointer' }}>NOW</button>
    </div>
  );
}

/* ══════════════ Home: dial + one card + one action ══════════════ */
function TechDialHome({ setTab, setSelectedJob }) {
  const { jobs, upcoming, crewView } = useTechDay();
  const [nowMin, setNowMin] = React.useState(tdNowMin);
  React.useEffect(() => { const iv = setInterval(() => setNowMin(tdNowMin()), 30000); return () => clearInterval(iv); }, []);
  const segs = React.useMemo(() => jobs.map(j => ({ ...j, disc: techDiscipline(j) })), [jobs]);
  const defaultFocus = React.useMemo(() => {
    const active = segs.find(s => s.field === 'in-progress' || s.field === 'on-site' || s.field === 'en-route' || s.field === 'paused');
    if (active) return active.id;
    const next = segs.find(s => !s.done && s.e >= nowMin);
    return (next || segs[0] || {}).id || null;
  }, [segs.length]);
  const [focusId, setFocusId] = React.useState(defaultFocus);
  React.useEffect(() => { if (!segs.find(s => s.id === focusId)) setFocusId(defaultFocus); }, [segs, defaultFocus]);
  const job = segs.find(s => s.id === focusId) || null;
  const c = job ? techDiscColor(job.disc) : 'var(--brand)';
  const done = segs.filter(s => s.done).length, onSite = segs.filter(s => s.field === 'in-progress' || s.field === 'on-site').length;
  const open = (j) => { setSelectedJob(j); setTab('job-detail'); };
  const act = () => {
    if (!job) return;
    const p = tdPrimary(job);
    if (p.next === 'en-route') { tdSetField(job, 'en-route'); shieldToast(`En route · ${job.customer}`, 'ok'); return; }
    if (p.next === 'on-site') { tdSetField(job, 'on-site'); tdTimerStart(job); }
    if (p.next === 'in-progress') { tdSetField(job, 'in-progress'); tdTimerStart(job); }
    open(job);
  };
  let eyebrow = '';
  if (job) {
    if (job.done) eyebrow = `Completed`;
    else if (job.field === 'in-progress' || job.field === 'on-site') eyebrow = `${TD_FIELD_LABEL[job.field]} · ${tdDur(tdTimerElapsed() / 60000)}`;
    else if (job.field === 'en-route' || job.field === 'paused') eyebrow = TD_FIELD_LABEL[job.field];
    else if (!job.anytime && job.s > nowMin) eyebrow = `Up next · in ${tdDur(job.s - nowMin)}`;
    else if (!job.anytime && job.e < nowMin) eyebrow = 'Earlier today';
    else eyebrow = 'Scheduled';
  }
  const fmtDay = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const chip = (txt, color) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: color || 'var(--text-mid)', background: 'var(--card)', border: '1px solid var(--border-subtle)', padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{txt}</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 2px 0' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}<span style={{ color: 'var(--text-low)', fontWeight: 600, fontSize: 16, marginLeft: 8 }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>{done} / {segs.length} done{onSite ? ' · on site' : ''}</div>
      </div>
      {crewView && <div style={{ fontSize: 11, color: 'var(--text-low)', padding: '0 2px' }}>Nothing is assigned to you today — showing the crew's day.</div>}

      <TechDial segs={segs} nowMin={nowMin} focusId={focusId} onFocus={setFocusId} />

      {/* the one card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c, boxShadow: `0 0 12px ${c}` }} />
        {job ? (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8 }}><span style={{ color: c, fontWeight: 600 }}>{eyebrow}</span>{job.woId ? ` · ${job.woId}` : ''}</div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{job.customer}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 4, fontWeight: 500 }}>{[job.site, job.desc].filter(Boolean).join(' · ')}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {chip(<React.Fragment>{TD_DISC[job.disc].label}<span style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} /></React.Fragment>, c)}
              {chip(job.anytime ? 'Anytime today' : `${tdFmt(job.s)} – ${tdFmt(job.e)} ${tdAp(job.e)}`)}
              {job.field && chip(TD_FIELD_LABEL[job.field])}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginTop: 14 }}>
              <button onClick={act} style={{ border: 'none', borderRadius: 14, padding: '14px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: job.done ? 'var(--text-high)' : '#fff', background: job.done ? 'var(--modal)' : c, boxShadow: job.done ? 'none' : `0 8px 24px ${c}55`, fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{tdPrimary(job).label}</button>
              <button onClick={() => open(job)} style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Details</button>
              <button onClick={() => tdNavigate(job)} title="Navigate" style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 14px', fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⌖</button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8 }}>Today</div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>No jobs on the dial</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>Dispatched work appears here the moment the office assigns it.</div>
          </React.Fragment>
        )}
      </div>

      {/* the rest of the day, compact */}
      {segs.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {segs.map(s => { const sc = techDiscColor(s.disc), on = s.id === focusId; return (
            <button key={s.id} onClick={() => setFocusId(s.id)} style={{ display: 'grid', gridTemplateColumns: '58px 1fr auto', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${on ? 'var(--border-strong)' : 'var(--border-subtle)'}`, background: on ? 'var(--card)' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)', opacity: s.done ? 0.55 : 1 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-mid)', fontVariantNumeric: 'tabular-nums' }}>{s.anytime ? 'any' : tdFmt(s.s)}</span>
              <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: s.done ? 'line-through' : 'none' }}>{s.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</span></span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: on ? `0 0 8px ${sc}` : 'none' }} />
            </button>
          ); })}
        </div>
      )}

      {/* ahead */}
      {upcoming.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '6px 2px 8px' }}>Ahead · next 14 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(day => (
              <div key={day.iso}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>{fmtDay(day.iso)}</span><span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} /><span className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{day.rows.length}</span></div>
                {day.rows.map(j => { const d = techDiscipline(j), dc = techDiscColor(d); return (
                  <button key={j.id} onClick={() => open({ ...j, disc: d })} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', marginBottom: 4, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dc, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.desc}</span></span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{j.anytime ? '' : tdFmt(j.s) + tdAp(j.s)}</span>
                  </button>
                ); })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════ Execution: one step at a time ══════════════ */
const TD_STEPS = {
  Install:     ['Arrive', 'Verify', 'Install', 'Test', 'Sign-off'],
  Repair:      ['Arrive', 'Diagnose', 'Repair', 'Test', 'Sign-off'],
  Maintenance: ['Arrive', 'Inspect', 'Service', 'Test', 'Sign-off'],
  Survey:      ['Arrive', 'Walk', 'Document', 'Review', 'Submit'],
};
const TD_TESTS = {
  Install:     ['All devices powered and online', 'Recording / signals verified', 'Remote access confirmed', 'Customer walkthrough done'],
  Repair:      ['Reported issue no longer reproduces', 'System verified end to end', 'Customer walkthrough done'],
  Maintenance: ['All devices verified after service', 'Firmware / settings confirmed', 'Customer walkthrough done'],
  Survey:      ['Every area photographed', 'Device counts and locations recorded', 'Customer questions captured'],
};
function JobFlowView({ job: raw, setTab }) {
  if (!raw) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Back to Today</button>
      <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Turn the dial to a job to open it.</div>
    </div>
  );
  /* Live row (status, signature) from the stores so this view never goes stale. */
  const [wos] = useShieldStore(workOrderStore);
  const [cal] = useShieldStore(jobStore);
  const me = tdMe();
  const job = React.useMemo(() => {
    if (raw._wo) { const w = (wos || []).find(x => x.id === raw._wo.id); return w ? { ...raw, ...tdJobFromWo(w, me), s: raw.s, e: raw.e, anytime: raw.anytime } : raw; }
    if (raw._cal) { const j = (cal || []).find(x => x.id === raw._cal.id); return j ? { ...raw, ...tdJobFromCal(j, me), s: raw.s, e: raw.e, anytime: raw.anytime } : raw; }
    return raw;
  }, [raw, wos, cal]);
  const disc = raw.disc || techDiscipline(job), c = techDiscColor(disc);
  const type = (job._wo && job._wo.type) || (job._cal && job._cal.type) || 'Install';
  const steps = TD_STEPS[type] || TD_STEPS.Install;
  const tests = TD_TESTS[type] || TD_TESTS.Install;
  const woId = job.woId || (/^WO-/.test(String(job.id)) ? job.id : null);
  const checkKey = String(woId || job.id);

  /* checklist + test ticks live in the synced woCheckStore (office sees them) */
  const [woCheck, setWoCheck] = useShieldStore(woCheckStore);
  const ticks = (woCheck || {})[checkKey] || {};
  const tpl = window.WO_TEMPLATES || {};
  const labels = (job._wo && Array.isArray(job._wo.checklist) && job._wo.checklist.length) ? job._wo.checklist
    : ((tpl[type] || tpl.Install || {}).checklist || ['Confirm scope', 'Install', 'Test system', 'Customer walkthrough', 'Collect signature']);
  const tick = (label) => setWoCheck(prev => { const cur = (prev || {})[checkKey] || {}; return { ...(prev || {}), [checkKey]: { ...cur, [label]: !cur[label] } }; });
  const doneN = labels.filter(l => ticks[l]).length, testN = tests.filter(t => ticks['test:' + t]).length;

  /* photos */
  const [allPhotos] = useShieldStore(photoStore);
  const [cam, setCam] = useShieldStore(window.techCamStore || createShieldStore('techcam', { wo: null, slot: null }));
  const projectId = (job._cal && job._cal.projectId) || null;
  const jobPhotos = (allPhotos || []).filter(p => (woId && p.wo === woId) || (projectId && p.projectId === projectId));
  const openCamera = (phase) => { setCam({ ...cam, wo: woId || '__unassigned', slot: null, phase: phase || null, project: projectId || cam.project || null }); setTab('capture'); };

  /* site data */
  const [custs] = useShieldStore(customerStore);
  const custRec = (custs || []).find(x => x.name && x.name === job.customer) || null;
  const contact = (job._cal && job._cal.contact) || (job._wo && job._wo.contact) || (custRec && custRec.contact) || '';
  const phone = (job._cal && job._cal.phone) || (job._wo && job._wo.phone) || (custRec && custRec.phone) || '';
  const access = (job._cal && job._cal.accessNotes) || (job._wo && job._wo.accessNotes) || '';
  const [projList] = useShieldStore(projectStore);
  const project = projectId ? (projList || []).find(p => p.number === projectId) || null : null;
  const scope = job.scope || (project && typeof projectScope === 'function' ? projectScope(project) : '');
  const bom = (job._wo && Array.isArray(job._wo.materials) ? job._wo.materials : []).map(m => ({ name: m.name, qty: Number(m.qty) || 0, used: Number(m.used) || 0 }));
  const drawings = (project && project.drawings) || [];
  const [openDrawing, setOpenDrawing] = React.useState(null);

  /* which step is current, from what's actually persisted */
  const derived = job.done ? 4 : job.field === 'in-progress' || job.field === 'paused' ? (doneN >= labels.length && labels.length ? (testN >= tests.length ? 4 : 3) : 2) : job.field === 'on-site' ? 1 : 0;
  const [step, setStep] = React.useState(derived);
  React.useEffect(() => { setStep(s => Math.max(s, derived)); }, [derived]);
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { const iv = setInterval(force, 30000); return () => clearInterval(iv); }, []);
  const elapsed = tdTimerElapsed();
  const [finished, setFinished] = React.useState(null); // {ms}

  const arrive = () => { tdSetField(job, 'on-site'); tdTimerStart(job); setStep(1); shieldToast(`On site · ${job.customer}`, 'ok'); };
  const begin = () => { tdSetField(job, 'in-progress'); tdTimerStart(job); setStep(2); };
  const pause = () => { tdSetField(job, 'paused'); shieldToast('Paused — dispatch can see it', 'info'); };
  const toTest = () => { if (doneN < labels.length) { shieldModal({ kind: 'confirm', title: 'Checklist not finished', message: `${labels.length - doneN} step${labels.length - doneN === 1 ? '' : 's'} unchecked. Move to testing anyway?`, confirmLabel: 'Continue', onConfirm: () => setStep(3) }); return; } setStep(3); };
  const toSign = () => { if (testN < tests.length) { shieldModal({ kind: 'confirm', title: 'Tests incomplete', message: `${tests.length - testN} test${tests.length - testN === 1 ? '' : 's'} unchecked. Go to sign-off anyway?`, confirmLabel: 'Continue', onConfirm: () => setStep(4) }); return; } setStep(4); };
  const complete = () => shieldModal({ kind: 'signature', title: 'Customer sign-off', subtitle: `${woId || job.id} — ${job.customer}`, signPrompt: 'Have the customer sign to confirm the work is complete and acceptable.', submitLabel: 'Save & complete job', successMsg: 'Job complete — signature saved',
    onSave: async (dataUrl) => {
      if (dataUrl && window.__shieldStorage) {
        const r = await window.__shieldStorage.uploadDataUrl(dataUrl, { folder: 'signatures', entity: 'work_order', entityId: String(woId || job.id), name: `signature-${woId || job.id}.png`, shared: true });
        if (!r || !r.ok) return { ok: false, error: (r && r.error) || 'Signature upload failed — check your connection and try again' };
        if (r.url && job._wo) workOrderStore.set(list => (list || []).map(w => w.id === job._wo.id ? { ...w, signatureUrl: r.url, signedAt: Date.now() } : w));
        if (r.url && job._cal) jobStore.set(list => (list || []).map(j => j.id === job._cal.id ? { ...j, signatureUrl: r.url, signedAt: Date.now() } : j));
      }
      tdSetField(job, 'complete');
      const ms = tdTimerStop();
      setFinished({ ms }); setStep(4);
      return { ok: true };
    } });
  const logHours = async () => {
    const t = window.__shieldTime; if (!t || !finished) { shieldToast('Time backend not configured', 'warn'); return; }
    const hours = Math.round((finished.ms / 3600000) * 100) / 100;
    if (!(hours > 0)) { shieldToast('No time recorded on this job', 'warn'); return; }
    const r = await t.submitHours({ workDate: new Date().toISOString().slice(0, 10), hours, jobRef: woId || job.customer, notes: `${job.customer} — ${job.desc}` });
    if (r && r.ok) { shieldToast(`${hours}h submitted for approval`, 'ok'); setFinished(f => ({ ...f, logged: true })); }
    else shieldToast((r && r.error) || 'Could not submit hours', 'warn');
  };

  /* ── primitives ── */
  const panel = (title, body, right) => (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '13px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}><span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{title}</span>{right}</div>
      {body}
    </div>
  );
  const primary = (label, fn, disabled) => <button onClick={fn} disabled={disabled} style={{ width: '100%', border: 'none', borderRadius: 14, padding: '15px 16px', fontWeight: 700, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer', color: '#fff', background: c, opacity: disabled ? 0.5 : 1, boxShadow: `0 8px 24px ${c}55`, fontFamily: 'var(--font-body)' }}>{label}</button>;
  const ghost = (label, fn, color) => <button onClick={fn} style={{ flex: 1, background: 'var(--modal)', color: color || 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{label}</button>;
  const checkRow = (label, on, fn) => (
    <button key={label} onClick={fn} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', alignItems: 'center', gap: 12, width: '100%', padding: '12px 2px', background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${on ? c : 'var(--border-strong)'}`, background: on ? c : 'transparent', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>{on ? '✓' : ''}</span>
      <span style={{ fontSize: 14.5, fontWeight: on ? 500 : 600, color: on ? 'var(--text-low)' : 'var(--text-high)', textDecoration: on ? 'line-through' : 'none' }}>{label}</span>
    </button>
  );
  const photoStrip = (phases) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phases.length}, 1fr)`, gap: 8 }}>
      {phases.map(([label, phase]) => { const shot = jobPhotos.find(p => p.phase === phase); return shot && window.MockPhoto ? (
        <MockPhoto key={phase} photo={shot} stamp={false} onClick={() => openCamera(phase)} style={{ aspectRatio: '1', borderRadius: 10, border: '1px solid var(--border-strong)', cursor: 'pointer' }}>
          <span style={{ position: 'absolute', left: 5, bottom: 5, fontSize: 8, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase' }}>{label}</span>
        </MockPhoto>
      ) : (
        <button key={phase} onClick={() => openCamera(phase)} style={{ aspectRatio: '1', borderRadius: 10, border: '1px dashed var(--border-strong)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: 'var(--text-low)', fontFamily: 'var(--font-body)' }}><span style={{ fontSize: 18, opacity: 0.5 }}>◉</span><span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span></button>
      ); })}
    </div>
  );

  /* ── step bodies ── */
  const body = (() => {
    if (finished || (job.done && step === 4)) {
      const ms = finished ? finished.ms : 0;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '22px 10px 10px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px', display: 'grid', placeItems: 'center', background: c, color: '#fff', fontSize: 28, fontWeight: 800, boxShadow: `0 0 32px ${c}66` }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Job complete</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>{job.customer}{job._wo && job._wo.signedAt ? ' · signed' : ''}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[[ms ? tdDur(ms / 60000) : '—', 'on site'], [`${doneN}/${labels.length}`, 'steps'], [String(jobPhotos.length), 'photos']].map(([v, k]) => (
              <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 3 }}>{k}</div></div>
            ))}
          </div>
          {finished && ms > 0 && !finished.logged && primary(`Log ${tdDur(ms / 60000)} to timesheet`, logHours)}
          {finished && finished.logged && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--status-ok)', fontWeight: 600 }}>Hours submitted for approval ✓</div>}
          <div style={{ display: 'flex', gap: 8 }}>{ghost('Back to Today', () => setTab('today'))}{ghost('Photos', () => setTab('photos'))}</div>
        </div>
      );
    }
    switch (step) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {panel('Site', <React.Fragment>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{job.site || 'No address on file'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{job.anytime ? 'Anytime today' : `${tdFmt(job.s)} ${tdAp(job.s)} – ${tdFmt(job.e)} ${tdAp(job.e)}`}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>{ghost('⌖ Navigate', () => tdNavigate(job), c)}{phone ? ghost(`Call ${contact || 'site'}`, () => { try { navigator.clipboard.writeText(phone); } catch { /* noop */ } shieldToast(`${phone} copied`, 'ok'); }) : null}</div>
          </React.Fragment>)}
          {(contact || phone || access) && panel('Site access', <React.Fragment>
            {(contact || phone) && <div style={{ fontSize: 13.5 }}>{contact}{contact && phone ? ' · ' : ''}<span className="mono">{phone}</span></div>}
            {access && <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.5 }}>{access}</div>}
          </React.Fragment>)}
          {job.details && panel('From dispatch', <div style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{job.details}</div>)}
          <button onClick={() => shieldModal({ kind: 'confirm', title: 'Put alarm on test', message: 'Place this site’s alarm on test? The central station is notified and signals are ignored until you take it off test. Auto-restores after 2 hours.', confirmLabel: 'Put on test', successMsg: 'Alarm on test — central station notified' })} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '11px', color: 'var(--text-mid)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>🛡 Put alarm on test</button>
          {primary("I'm on site", arrive)}
          {job.field !== 'en-route' && !job.field && <button onClick={() => { tdSetField(job, 'en-route'); shieldToast('En route — dispatch notified', 'ok'); }} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 4 }}>Mark en route first</button>}
        </div>
      );
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scope ? panel('Scope of work', <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{scope}</div>, project && <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{project.number}</span>) : panel('Scope of work', <div style={{ fontSize: 13, color: 'var(--text-low)' }}>No written scope on this job — confirm with the site contact before starting.</div>)}
          {bom.length > 0 && panel('Equipment', bom.map((b, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none', fontSize: 13.5 }}><span>{b.name}</span><span className="mono" style={{ color: 'var(--text-mid)' }}>{b.used}/{b.qty}</span></div>))}
          {drawings.length > 0 && window.BlueprintRows && panel('Blueprints', <BlueprintRows drawings={drawings} onOpen={setOpenDrawing} />)}
          {panel('Before photo', photoStrip([['Site — before', 'before']]))}
          {primary(`Scope confirmed — ${steps[2].toLowerCase()}`, begin)}
        </div>
      );
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {panel(`${steps[2]} checklist`, <div>{labels.map(l => checkRow(l, !!ticks[l], () => tick(l)))}</div>, <span className="mono" style={{ fontSize: 11, color: doneN === labels.length ? 'var(--status-ok)' : 'var(--text-mid)' }}>{doneN}/{labels.length}</span>)}
          {panel('Photos', photoStrip([['Before', 'before'], ['During', 'progress'], ['Issue', 'issue']]), jobPhotos.length ? <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{jobPhotos.length}</span> : null)}
          {drawings.length > 0 && window.BlueprintRows && panel('Blueprints', <BlueprintRows drawings={drawings} onOpen={setOpenDrawing} />)}
          {primary(doneN === labels.length ? `Done — ${steps[3].toLowerCase()}` : `${steps[3]} (${labels.length - doneN} left)`, toTest)}
          <div style={{ display: 'flex', gap: 8 }}>{job.field === 'paused' ? ghost('Resume', () => tdSetField(job, 'in-progress'), c) : ghost('Pause', pause)}{ghost('◉ Camera', () => openCamera('progress'))}{window.openTechReceipt ? ghost('▢ Receipt', () => { window.openTechReceipt({ jobRef: woId || job.id, label: job.customer }); setTab('expenses'); }) : null}</div>
        </div>
      );
      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {panel('Verify', <div>{tests.map(t => checkRow(t, !!ticks['test:' + t], () => tick('test:' + t)))}</div>, <span className="mono" style={{ fontSize: 11, color: testN === tests.length ? 'var(--status-ok)' : 'var(--text-mid)' }}>{testN}/{tests.length}</span>)}
          {panel('After photo', photoStrip([['Final — wide', 'after']]))}
          {primary(testN === tests.length ? `All pass — ${steps[4].toLowerCase()}` : `${steps[4]} (${tests.length - testN} unchecked)`, toSign)}
        </div>
      );
      default: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[[tdDur(elapsed / 60000), 'on site'], [`${doneN}/${labels.length}`, 'steps'], [`${testN}/${tests.length}`, 'tests']].map(([v, k]) => (
              <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 3 }}>{k}</div></div>
            ))}
          </div>
          {panel('Photos on this job', jobPhotos.length ? photoStrip([['Before', 'before'], ['During', 'progress'], ['After', 'after']]) : <div style={{ fontSize: 13, color: 'var(--text-low)' }}>No photos yet — the office expects before and after shots.</div>)}
          {primary('✍ Customer signature — complete job', complete)}
          <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center' }}>Signature uploads with the job; the timer stops and your hours can go straight to the timesheet.</div>
        </div>
      );
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Today</button>
      {/* header + segmented progress */}
      <div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: c, fontWeight: 600 }}>{TD_DISC[disc].label}{woId ? ` · ${woId}` : ''}{job.field ? ` · ${TD_FIELD_LABEL[job.field]}` : ''}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.1 }}>{job.customer}</div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 3 }}>{job.desc}{(job.field === 'in-progress' || job.field === 'on-site') && elapsed > 0 ? ` · ${tdDur(elapsed / 60000)} on site` : ''}</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4, marginTop: 12 }}>
          {steps.map((s, i) => { const on = i === step && !finished, past = i < step || finished || job.done; return (
            <button key={s} onClick={() => i <= derived && setStep(i)} style={{ background: 'none', border: 'none', padding: 0, cursor: i <= derived ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>
              <div style={{ height: 4, borderRadius: 2, background: past || on ? c : 'var(--border-strong)', opacity: on ? 1 : past ? 0.6 : 1, boxShadow: on ? `0 0 8px ${c}` : 'none' }} />
              <div style={{ fontSize: 10, fontWeight: on ? 700 : 500, color: on ? 'var(--text-high)' : 'var(--text-low)', marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</div>
            </button>
          ); })}
        </div>
      </div>
      {body}
      {openDrawing && window.BlueprintEditor && <BlueprintEditor drawing={openDrawing} onClose={() => setOpenDrawing(null)} />}
    </div>
  );
}

Object.assign(window, { TD_DISC, TD_STEPS, TD_TESTS, techDiscipline, techDiscColor, useTechDay, tdSetField, tdPrimary, tdTimerStart, tdTimerStop, tdTimerElapsed, TechDial, TechDialHome, JobFlowView });

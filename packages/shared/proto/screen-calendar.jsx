/* Screen — Calendar (v4: multi-tech jobs, unassigned state, multi-day spans)
   - Jobs: techs[] (empty = unassigned), day..endDay span, start/dur per day
   - Drag tech → job/bar: ADD tech to crew. Drag tech → empty slot: new job.
   - Drag project from tray → schedules UNASSIGNED, opens panel to pick techs.
   - Week blocks: drag = move · top/bottom edge = adjust times · left/right edge = stretch across days
   - Month bars: booking-style spans with start/end day handles (CalMonthView in calendar-month.jsx)
   - Click job → panel with tech toggle chips · double-click → work order · Esc cancels drags */

const CAL_TECHS = [
  { id: 'MR', name: 'Mike Reyes',   color: '#3FA9F5' },
  { id: 'JL', name: 'Jessica Liu',  color: '#34D399' },
  { id: 'KW', name: 'Kevin White',  color: '#FBBF24' },
  { id: 'DP', name: 'Diana Patel',  color: '#c084fc' },
  { id: 'TG', name: 'Tony Garcia',  color: '#F43F5E' },
];

const CAL_TYPES = {
  install:     { bg: 'rgba(63,169,245,0.18)',  border: '#3FA9F5',  label: 'Install' },
  maintenance: { bg: 'rgba(251,191,36,0.18)',  border: '#FBBF24',  label: 'Maintenance' },
  repair:      { bg: 'rgba(244,63,94,0.18)',   border: '#F43F5E',  label: 'Repair' },
  survey:      { bg: 'rgba(192,132,252,0.18)', border: '#c084fc',  label: 'Survey' },
  meeting:     { bg: 'rgba(52,211,153,0.15)',  border: '#34D399',  label: 'Meeting' },
};
const CAL_UNASSIGNED = { bg: 'rgba(148,163,184,0.10)', border: '#94A3B8' };

/* Backlog now lives in backlogStore (shared-state.jsx) — shared with the Dispatch queue */

const HOUR_PX = 56;
const DAY_START = 6, DAY_END = 19;
const calSnap = h => Math.round(h * 2) / 2;
const calClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const calFmtH = h => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;
const calSpanOf = j => (j.endDay || j.day) - j.day + 1;

function CalendarScreen() {
  const [jobs, setJobs] = useShieldStore(jobStore);
  const [backlog, setBacklog] = useShieldStore(backlogStore);
  const [view, setView] = React.useState('week');
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [techFilter, setTechFilter] = React.useState('all');
  const [colorMode, setColorMode] = React.useState('type');
  const [selectedId, setSelectedId] = React.useState(null);
  const [hoverJob, setHoverJob] = React.useState(null);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [newJobSlot, setNewJobSlot] = React.useState(null);
  const [drag, setDrag] = React.useState(null);

  const scrollRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const trayRef = React.useRef(null);
  const targetRef = React.useRef(null);
  const didDragRef = React.useRef(false);

  const techs = CAL_TECHS, typeColors = CAL_TYPES;
  const selectedJob = jobs.find(j => j.id === selectedId) || null;

  const getJobColor = (job) => {
    if (!job.techs || job.techs.length === 0) return CAL_UNASSIGNED;
    if (colorMode === 'tech') {
      const t = techs.find(t => t.id === job.techs[0]);
      return t ? { bg: `${t.color}22`, border: t.color } : typeColors[job.type] || typeColors.install;
    }
    return typeColors[job.type] || typeColors.install;
  };

  const baseMonday = new Date(2026, 5, 8 + weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(baseMonday); d.setDate(d.getDate() + i); return d; });
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START);
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const isToday = (d) => { const t = new Date(2026,5,10); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth(); };
  const formatDay = (d) => `${monthNames[d.getMonth()].slice(0,3)} ${d.getDate()}`;

  const filteredJobs = techFilter === 'all' ? jobs
    : techFilter === 'none' ? jobs.filter(j => !j.techs || j.techs.length === 0)
    : jobs.filter(j => j.techs && j.techs.includes(techFilter));

  // ── Overlap helpers (span + crew aware) ──
  const daysOverlap = (a, b) => a.day <= (b.endDay || b.day) && b.day <= (a.endDay || a.day);
  const timesOverlap = (a, b) => a.start < b.start + b.dur && b.start < a.start + a.dur;
  const sharesTech = (a, b) => (a.techs || []).some(t => (b.techs || []).includes(t));
  const conflicts = [];
  filteredJobs.forEach((a, ai) => filteredJobs.forEach((b, bi) => {
    if (ai < bi && sharesTech(a, b) && daysOverlap(a, b) && timesOverlap(a, b)) conflicts.push(a.id, b.id);
  }));
  const wouldConflict = (techIds, day, endDay, start, dur, ignoreId) =>
    techIds.length > 0 && jobs.some(j => j.id !== ignoreId
      && (j.techs || []).some(t => techIds.includes(t))
      && day <= (j.endDay || j.day) && j.day <= endDay
      && start < j.start + j.dur && j.start < start + j.dur);

  const utilization = techs.map(t => {
    const bill = jobs.filter(j => (j.techs || []).includes(t.id) && j.type !== 'meeting').reduce((s, j) => s + j.dur * calSpanOf(j), 0);
    return { ...t, billableHours: bill, pct: Math.round((bill / 40) * 100) };
  });
  const unassignedCount = jobs.filter(j => !j.techs || j.techs.length === 0).length;
  const weekRevenue = filteredJobs.filter(j => j.value && j.type !== 'meeting').reduce((s, j) => s + (j.value || 0), 0);

  // ── Drop-target resolution ──
  const computeTarget = (ev) => {
    if (trayRef.current) {
      const r = trayRef.current.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) return { area: 'tray' };
    }
    if (view === 'month') {
      const els = document.elementsFromPoint(ev.clientX, ev.clientY);
      let overBarId = null;
      for (const el of els) {
        if (overBarId === null && el.getAttribute && el.getAttribute('data-cal-bar')) overBarId = parseFloat(el.getAttribute('data-cal-bar'));
        if (el.getAttribute && el.getAttribute('data-cal-day')) return { area: 'month', day: parseInt(el.getAttribute('data-cal-day')), overBarId };
      }
      return null;
    }
    if (!scrollRef.current || !contentRef.current) return null;
    const vr = scrollRef.current.getBoundingClientRect();
    if (ev.clientX < vr.left + 52 || ev.clientX > vr.right || ev.clientY < vr.top || ev.clientY > vr.bottom) return null;
    const cr = contentRef.current.getBoundingClientRect();
    const colW = (cr.width - 52) / 7;
    const day = calClamp(Math.floor((ev.clientX - cr.left - 52) / colW) + 1, 1, 7);
    const hourRaw = calClamp(DAY_START + (ev.clientY - cr.top) / HOUR_PX, DAY_START, DAY_END);
    const overJob = filteredJobs.find(j => j.day <= day && day <= (j.endDay || j.day) && hourRaw >= j.start && hourRaw < j.start + j.dur) || null;
    return { area: 'grid', day, hourRaw, overJob };
  };

  // ── Drag engine (4px threshold, Esc cancels) ──
  const beginDrag = (e, spec) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    let active = false, cancelled = false;
    const cursorFor = k => k === 'resize-top' || k === 'resize-bottom' ? 'ns-resize' : k === 'span-left' || k === 'span-right' ? 'ew-resize' : 'grabbing';
    const move = (ev) => {
      if (!active) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
        active = true; didDragRef.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = cursorFor(spec.kind);
      }
      const target = computeTarget(ev);
      targetRef.current = target;
      setDrag({ ...spec, pos: { x: ev.clientX, y: ev.clientY }, target });
    };
    const finish = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('keydown', key);
      document.body.style.userSelect = ''; document.body.style.cursor = '';
      setDrag(null);
      setTimeout(() => { didDragRef.current = false; }, 0);
    };
    const up = () => { if (active && !cancelled) handleDrop(spec, targetRef.current); finish(); };
    const key = (ev) => { if (ev.key === 'Escape') { cancelled = true; finish(); } };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', key);
  };

  // ── Week-grid ghost ──
  const ghostFor = (d) => {
    if (!d || !d.target || d.target.area !== 'grid') return null;
    const t = d.target, j = d.job;
    if (d.kind === 'job') {
      const span = calSpanOf(j);
      const day = calClamp(t.day - (d.dayOffset || 0), 1, 8 - span);
      const start = calClamp(calSnap(t.hourRaw - d.grabOffset), DAY_START, DAY_END - j.dur);
      return { day, endDay: day + span - 1, start, dur: j.dur, techs: j.techs, ignoreId: j.id };
    }
    if (d.kind === 'resize-top') {
      const end = j.start + j.dur;
      const start = calClamp(calSnap(t.hourRaw), DAY_START, end - 0.5);
      return { day: j.day, endDay: j.endDay || j.day, start, dur: end - start, techs: j.techs, ignoreId: j.id };
    }
    if (d.kind === 'resize-bottom') {
      const dur = calClamp(calSnap(t.hourRaw) - j.start, 0.5, DAY_END - j.start);
      return { day: j.day, endDay: j.endDay || j.day, start: j.start, dur, techs: j.techs, ignoreId: j.id };
    }
    if (d.kind === 'span-left') {
      const a = calClamp(t.day, 1, j.endDay || j.day);
      return { day: a, endDay: j.endDay || j.day, start: j.start, dur: j.dur, techs: j.techs, ignoreId: j.id };
    }
    if (d.kind === 'span-right') {
      const b = calClamp(t.day, j.day, 7);
      return { day: j.day, endDay: b, start: j.start, dur: j.dur, techs: j.techs, ignoreId: j.id };
    }
    if (d.kind === 'project') {
      const days = d.project.days || 1;
      const day = calClamp(t.day, 1, 8 - days);
      const start = calClamp(calSnap(t.hourRaw), DAY_START, DAY_END - d.project.dur);
      return { day, endDay: day + days - 1, start, dur: d.project.dur, techs: [] };
    }
    if (d.kind === 'create') {
      const a = d.anchorHour, b = calSnap(t.hourRaw);
      return { day: d.day, endDay: d.day, start: Math.min(a, b), dur: Math.max(0.5, Math.abs(b - a)), techs: [] };
    }
    if (d.kind === 'tech' && !t.overJob) {
      const start = calClamp(calSnap(t.hourRaw), DAY_START, DAY_END - 1);
      return { day: t.day, endDay: t.day, start, dur: 1, techs: [d.tech.id], outline: true };
    }
    return null;
  };
  const ghost = ghostFor(drag);
  const ghostConflict = ghost && ghost.techs && ghost.techs.length > 0 ? wouldConflict(ghost.techs, ghost.day, ghost.endDay, ghost.start, ghost.dur, ghost.ignoreId) : false;

  // ── Month ghost (day-range highlight) ──
  const monthGhost = (() => {
    if (!drag || !drag.target || drag.target.area !== 'month') return null;
    const t = drag.target, j = drag.job;
    if (drag.kind === 'job') { const span = calSpanOf(j); const a = calClamp(t.day - (drag.dayOffset || 0), 1, 8 - span); return { a, b: a + span - 1 }; }
    if (drag.kind === 'span-left') return { a: calClamp(t.day, 1, j.endDay || j.day), b: j.endDay || j.day };
    if (drag.kind === 'span-right') return { a: j.day, b: calClamp(t.day, j.day, 7) };
    if (drag.kind === 'project') { const days = drag.project.days || 1; const a = calClamp(t.day, 1, 8 - days); return { a, b: a + days - 1 }; }
    if (drag.kind === 'tech' && !t.overBarId) return { a: t.day, b: t.day };
    return null;
  })();

  // ── Drop handlers ──
  const handleDrop = (spec, target) => {
    if (!target) return;
    const k = spec.kind, j = spec.job;

    if (k === 'job') {
      if (target.area === 'tray') {
        setJobs(prev => prev.filter(x => x.id !== j.id));
        setBacklog(prev => [{ id: 'p' + j.id, title: j.title, customer: j.customer, type: j.type, dur: j.dur, days: calSpanOf(j), value: j.value || 0 }, ...prev]);
        setSelectedId(null);
        showToast('Job moved to Unscheduled', 'ok');
      } else if (target.area === 'grid' || target.area === 'month') {
        const span = calSpanOf(j);
        const day = calClamp(target.day - (spec.dayOffset || 0), 1, 8 - span);
        const start = target.area === 'grid' ? calClamp(calSnap(target.hourRaw - spec.grabOffset), DAY_START, DAY_END - j.dur) : j.start;
        setJobs(prev => prev.map(x => x.id === j.id ? { ...x, day, endDay: day + span - 1, start } : x));
        showToast(`Moved to ${dayLabels[day-1]}${span > 1 ? '–' + dayLabels[day+span-2] : ''} ${calFmtH(start)}`, 'ok');
      }
    }
    if (k === 'resize-top' && target.area === 'grid') {
      const end = j.start + j.dur;
      const start = calClamp(calSnap(target.hourRaw), DAY_START, end - 0.5);
      setJobs(prev => prev.map(x => x.id === j.id ? { ...x, start, dur: end - start } : x));
    }
    if (k === 'resize-bottom' && target.area === 'grid') {
      const dur = calClamp(calSnap(target.hourRaw) - j.start, 0.5, DAY_END - j.start);
      setJobs(prev => prev.map(x => x.id === j.id ? { ...x, dur } : x));
    }
    if (k === 'span-left' && (target.area === 'grid' || target.area === 'month')) {
      const a = calClamp(target.day, 1, j.endDay || j.day);
      setJobs(prev => prev.map(x => x.id === j.id ? { ...x, day: a, endDay: x.endDay || x.day } : x));
      showToast(`${dayLabels[a-1]} → ${dayLabels[(j.endDay||j.day)-1]}`, 'ok');
    }
    if (k === 'span-right' && (target.area === 'grid' || target.area === 'month')) {
      const b = calClamp(target.day, j.day, 7);
      setJobs(prev => prev.map(x => x.id === j.id ? { ...x, endDay: b } : x));
      showToast(`${dayLabels[j.day-1]} → ${dayLabels[b-1]} (${b - j.day + 1} day${b - j.day ? 's' : ''})`, 'ok');
    }
    if (k === 'tech') {
      const overId = target.area === 'grid' ? (target.overJob && target.overJob.id) : target.overBarId;
      if (overId != null) {
        const job = jobs.find(x => x.id === overId);
        if (job && (job.techs || []).includes(spec.tech.id)) { showToast(`${spec.tech.name.split(' ')[0]} is already on this job`, 'warn'); return; }
        setJobs(prev => prev.map(x => x.id === overId ? { ...x, techs: [...(x.techs || []), spec.tech.id] } : x));
        showToast(`${spec.tech.name.split(' ')[0]} added to ${job ? job.title.split('—')[0].trim() : 'job'}`, 'ok');
      } else if (target.area === 'grid') {
        setNewJobSlot({ day: target.day, start: calClamp(calSnap(target.hourRaw), DAY_START, DAY_END - 1), techs: [spec.tech.id] });
        setShowNewModal(true);
      } else if (target.area === 'month') {
        setNewJobSlot({ day: target.day, start: 9, techs: [spec.tech.id] });
        setShowNewModal(true);
      }
    }
    if (k === 'project' && (target.area === 'grid' || target.area === 'month')) {
      const p = spec.project, days = p.days || 1;
      const day = calClamp(target.day, 1, 8 - days);
      const start = target.area === 'grid' ? calClamp(calSnap(target.hourRaw), DAY_START, DAY_END - p.dur) : 9;
      const newJob = { id: Date.now(), title: p.title, customer: p.customer, techs: [], type: p.type, day, endDay: day + days - 1, start, dur: p.dur, value: p.value };
      setJobs(prev => [...prev, newJob]);
      setBacklog(prev => prev.filter(b => b.id !== p.id));
      setSelectedId(newJob.id);
      showToast('Scheduled — pick technicians in the panel →', 'warn');
    }
    if (k === 'create' && target.area === 'grid') {
      const a = spec.anchorHour, b = calSnap(target.hourRaw);
      setNewJobSlot({ day: spec.day, start: Math.min(a, b), dur: Math.max(0.5, Math.abs(b - a)) });
      setShowNewModal(true);
    }
  };

  const toggleJobTech = (jobId, techId) => {
    setJobs(prev => prev.map(x => x.id === jobId ? { ...x, techs: (x.techs || []).includes(techId) ? x.techs.filter(t => t !== techId) : [...(x.techs || []), techId] } : x));
  };
  const autoAssign = (jobId) => {
    const lightest = utilization.reduce((a, b) => (b.billableHours < a.billableHours ? b : a));
    setJobs(prev => prev.map(x => x.id === jobId ? { ...x, techs: [lightest.id] } : x));
    showToast(`Assigned ${lightest.name} (lightest load)`, 'ok');
  };

  const handleSlotClick = (day, hour) => {
    if (didDragRef.current) return;
    setNewJobSlot({ day, start: hour });
    setShowNewModal(true);
  };

  const dragKind = drag ? drag.kind : null;

  /* Deep-link into the matching work order */
  const openWorkOrder = (job) => { if (job && job.wo) woFocusStore.set(job.wo); navTo('workorder'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', gap: 12, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={calNavBtn}>‹</button>
        <button onClick={() => setWeekOffset(0)} style={{ ...calNavBtn, fontSize: 11, padding: '5px 12px', minWidth: 60 }}>Today</button>
        <button onClick={() => setWeekOffset(w => w + 1)} style={calNavBtn}>›</button>
        <span className="display" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)', marginLeft: 4 }}>
          {view === 'week' ? `${formatDay(weekDays[0])} — ${formatDay(weekDays[6])}, ${weekDays[0].getFullYear()}` : 'June 2026'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'rgba(63,169,245,0.06)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
          {['week','month'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '4px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', fontWeight: 500, background: view === v ? 'rgba(63,169,245,0.18)' : 'transparent', color: view === v ? 'var(--brand)' : 'var(--text-low)', transition: 'all 0.15s' }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(63,169,245,0.06)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
          {['type','tech'].map(m => (
            <button key={m} onClick={() => setColorMode(m)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', background: colorMode === m ? 'rgba(63,169,245,0.18)' : 'transparent', color: colorMode === m ? 'var(--brand)' : 'var(--text-low)', transition: 'all 0.15s' }}>By {m.charAt(0).toUpperCase()+m.slice(1)}</button>
          ))}
        </div>
        <button onClick={() => { setNewJobSlot(null); setShowNewModal(true); }} style={{ padding: '6px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Job</button>
        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-low)' }}>WEEK REVENUE</span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--status-ok)', fontWeight: 600 }}>${weekRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <div className="glass" style={{ width: 196, flexShrink: 0, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 2 }}>Technicians</div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setTechFilter('all')} style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: '1px solid', borderColor: techFilter === 'all' ? 'var(--border-strong)' : 'var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', background: techFilter === 'all' ? 'rgba(63,169,245,0.1)' : 'transparent', color: techFilter === 'all' ? 'var(--brand)' : 'var(--text-low)', fontSize: 10, fontWeight: 600 }}>ALL</button>
            <button onClick={() => setTechFilter(techFilter === 'none' ? 'all' : 'none')} style={{ flex: 2, padding: '4px 0', borderRadius: 6, border: '1px dashed', borderColor: techFilter === 'none' ? '#94A3B8' : 'var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', background: techFilter === 'none' ? 'rgba(148,163,184,0.12)' : 'transparent', color: techFilter === 'none' ? '#94A3B8' : 'var(--text-low)', fontSize: 10, fontWeight: 600 }}>◌ UNASSIGNED{unassignedCount ? ` (${unassignedCount})` : ''}</button>
          </div>
          {utilization.map(t => (
            <div key={t.id} style={{ opacity: dragKind === 'tech' && drag.tech.id !== t.id ? 0.4 : 1, transition: 'opacity 0.15s' }}>
              <button
                onMouseDown={e => beginDrag(e, { kind: 'tech', tech: t })}
                onClick={() => { if (!didDragRef.current) setTechFilter(techFilter === t.id ? 'all' : t.id); }}
                title="Click to filter · Drag onto a job to add to crew, onto the grid to schedule"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'grab', fontFamily: 'var(--font-body)', width: '100%', background: techFilter === t.id ? `${t.color}18` : 'transparent', color: techFilter === t.id ? t.color : 'var(--text-mid)', fontSize: 12, textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${t.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: t.color, fontWeight: 700, flexShrink: 0, border: `1px solid ${t.color}40` }}>{t.id}</span>
                <span style={{ fontSize: 11 }}>{t.name.split(' ')[0]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)', letterSpacing: '0.05em' }}>⠿</span>
              </button>
              <div style={{ padding: '2px 8px 4px 37px' }}>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(t.pct, 100)}%`, height: '100%', background: t.pct > 90 ? 'var(--status-critical)' : t.pct > 70 ? 'var(--status-warn)' : t.color, borderRadius: 2 }}></div>
                </div>
                <span style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 1, display: 'block' }}>{t.billableHours}h · {t.pct}%</span>
              </div>
            </div>
          ))}

          {/* Unscheduled tray */}
          <div ref={trayRef} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, padding: 6, margin: '-6px', borderRadius: 8, border: dragKind === 'job' ? '1px dashed var(--border-strong)' : '1px dashed transparent', background: dragKind === 'job' && drag.target && drag.target.area === 'tray' ? 'rgba(63,169,245,0.08)' : dragKind === 'job' ? 'rgba(63,169,245,0.03)' : 'transparent', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Unscheduled
              <span className="mono" style={{ fontSize: 9, background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', borderRadius: 8, padding: '1px 6px' }}>{backlog.length}</span>
            </div>
            {dragKind === 'job' && <div style={{ fontSize: 10, color: 'var(--brand)', padding: '2px 2px' }}>Drop here to unschedule</div>}
            {backlog.map(p => {
              const tc = typeColors[p.type] || typeColors.install;
              const isDragging = dragKind === 'project' && drag.project.id === p.id;
              return (
                <div key={p.id}
                  onMouseDown={e => beginDrag(e, { kind: 'project', project: p })}
                  title="Drag onto the calendar to schedule (lands unassigned — pick techs after)"
                  style={{ padding: '7px 9px', borderRadius: 7, border: `1px solid ${tc.border}30`, borderLeft: `2px solid ${tc.border}`, background: 'rgba(5,7,10,0.4)', cursor: 'grab', opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.15s' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3, marginBottom: 3 }}>{p.title}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 9, color: tc.border }}>{p.dur}h{(p.days || 1) > 1 ? ` × ${p.days}d` : ''}</span>
                    {p.value > 0 && <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>${(p.value/1000).toFixed(1)}k</span>}
                    <span style={{ fontSize: 9, color: 'var(--text-low)', marginLeft: 'auto' }}>⠿</span>
                  </div>
                </div>
              );
            })}
            {backlog.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-low)', fontStyle: 'italic', padding: '4px 2px' }}>All projects scheduled</div>}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 9, color: 'var(--text-low)', lineHeight: 1.5, borderTop: '1px solid var(--border-subtle)' }}>
            Drag techs onto jobs to build crews. Drag block edges: top/bottom = time, sides = days. Esc cancels.
          </div>
        </div>

        {/* Calendar area */}
        {view === 'week' ? (
          <div className="glass" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div></div>
              {weekDays.map((d, i) => {
                const dayJobs = filteredJobs.filter(j => j.day <= i + 1 && i + 1 <= (j.endDay || j.day));
                const hasConflict = dayJobs.some(j => conflicts.includes(j.id));
                const isDropDay = ghost && ghost.day <= i + 1 && i + 1 <= ghost.endDay;
                return (
                  <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', background: isDropDay ? 'rgba(63,169,245,0.1)' : isToday(d) ? 'rgba(63,169,245,0.06)' : 'transparent', transition: 'background 0.1s' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{dayLabels[i]}</div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: isToday(d) ? 600 : 400, color: isToday(d) ? 'var(--brand)' : 'var(--text-high)', lineHeight: 1.2 }}>{d.getDate()}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 3, minHeight: 6 }}>
                      {dayJobs.slice(0, 4).map((j, ji) => <div key={ji} style={{ width: 5, height: 5, borderRadius: '50%', background: getJobColor(j).border, opacity: 0.8 }}></div>)}
                      {hasConflict && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-warn)', boxShadow: '0 0 4px var(--status-warn)' }}></div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <div ref={contentRef} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', position: 'relative' }}>
                {hours.map(h => (
                  <React.Fragment key={h}>
                    <div style={{ padding: '0 8px', height: HOUR_PX, display: 'flex', alignItems: 'flex-start', paddingTop: 6, flexShrink: 0, borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{h < 10 ? `0${h}` : h}:00</span>
                    </div>
                    {weekDays.map((_, di) => (
                      <div key={di}
                        onMouseDown={e => beginDrag(e, { kind: 'create', day: di + 1, anchorHour: h })}
                        onClick={() => handleSlotClick(di + 1, h)}
                        style={{ height: HOUR_PX, borderLeft: '1px solid var(--border-subtle)', borderBottom: '1px solid rgba(63,169,245,0.04)', position: 'relative', background: isToday(weekDays[di]) ? 'rgba(63,169,245,0.02)' : 'transparent', cursor: drag ? 'inherit' : 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (!drag) e.currentTarget.style.background = 'rgba(63,169,245,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isToday(weekDays[di]) ? 'rgba(63,169,245,0.02)' : 'transparent'; }}></div>
                    ))}
                  </React.Fragment>
                ))}

                {/* Job blocks (span across day columns) */}
                {filteredJobs.map(job => {
                  const tc = getJobColor(job);
                  const span = calSpanOf(job);
                  const unassigned = !job.techs || job.techs.length === 0;
                  const top = (job.start - DAY_START) * HOUR_PX;
                  const height = job.dur * HOUR_PX - 4;
                  const isConflict = conflicts.includes(job.id);
                  const left = `calc(52px + (100% - 52px) * ${(job.day - 1) / 7} + 2px)`;
                  const width = `calc((100% - 52px) * ${span / 7} - 4px)`;
                  const crew = (job.techs || []).map(id => techs.find(t => t.id === id)).filter(Boolean);
                  const isMoving = drag && ['job','resize-top','resize-bottom','span-left','span-right'].includes(drag.kind) && drag.job.id === job.id;
                  const isTechHover = dragKind === 'tech' && drag.target && drag.target.area === 'grid' && drag.target.overJob && drag.target.overJob.id === job.id;
                  const showAfford = hoverJob === job.id || selectedId === job.id;
                  return (
                    <div key={job.id}
                      onMouseEnter={() => setHoverJob(job.id)}
                      onMouseLeave={() => setHoverJob(h => h === job.id ? null : h)}
                      onMouseDown={e => {
                        e.stopPropagation();
                        const r = e.currentTarget.getBoundingClientRect();
                        const dayOffset = Math.floor((e.clientX - r.left) / (r.width / span));
                        beginDrag(e, { kind: 'job', job, dayOffset, grabOffset: (DAY_START + (e.clientY - contentRef.current.getBoundingClientRect().top) / HOUR_PX) - job.start });
                      }}
                      onClick={e => { e.stopPropagation(); if (!didDragRef.current) setSelectedId(selectedId === job.id ? null : job.id); }}
                      onDoubleClick={e => { e.stopPropagation(); openWorkOrder(job); }}
                      title="Drag to move · top/bottom edge: change times · side edges: stretch across days · double-click: work order"
                      style={{ position: 'absolute', top, left, width, height, background: tc.bg, border: `1px ${unassigned ? 'dashed' : 'solid'} ${isTechHover ? drag.tech.color : tc.border}`, borderRadius: 6, padding: '5px 7px', cursor: 'grab', overflow: 'hidden', opacity: isMoving ? 0.35 : 1, boxShadow: isTechHover ? `0 0 0 2px ${drag.tech.color}` : isConflict ? '0 0 0 2px var(--status-warn)' : selectedId === job.id ? `0 0 0 2px ${tc.border}` : 'none', transition: 'box-shadow 0.1s, opacity 0.15s', zIndex: selectedId === job.id ? 10 : 2 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: tc.border, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                      {height > 40 && <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 1 }}>{calFmtH(job.start)} – {calFmtH(job.start + job.dur)}{span > 1 ? ` · ${span} days` : ''}</div>}
                      {unassigned && height > 54 && <div style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>◌ Unassigned — click to add techs</div>}
                      {isTechHover && <div style={{ fontSize: 9, fontWeight: 700, color: drag.tech.color, marginTop: 1 }}>+ {drag.tech.name.split(' ')[0]} joins crew</div>}
                      {height > 52 && crew.length > 0 && !isTechHover && (
                        <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex' }}>
                          {crew.slice(0, 3).map((t, ti) => (
                            <span key={t.id} style={{ width: 16, height: 16, borderRadius: '50%', background: `${t.color}30`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: t.color, fontWeight: 700, border: `1px solid ${t.color}60`, marginLeft: ti > 0 ? -5 : 0 }}>{t.id}</span>
                          ))}
                          {crew.length > 3 && <span style={{ fontSize: 8, color: 'var(--text-low)', marginLeft: 2, alignSelf: 'center' }}>+{crew.length - 3}</span>}
                        </div>
                      )}

                      {/* Resize edges: top/bottom = time, left/right = day span */}
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'resize-top', job }); }} onClick={e => e.stopPropagation()}
                        style={{ position: 'absolute', left: 8, right: 8, top: 0, height: 6, cursor: 'ns-resize' }}></div>
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'resize-bottom', job }); }} onClick={e => e.stopPropagation()}
                        style={{ position: 'absolute', left: 8, right: 8, bottom: 0, height: 7, cursor: 'ns-resize' }}></div>
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'span-left', job }); }} onClick={e => e.stopPropagation()}
                        title="Drag to change start day"
                        style={{ position: 'absolute', left: 0, top: 6, bottom: 7, width: 7, cursor: 'ew-resize' }}></div>
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'span-right', job }); }} onClick={e => e.stopPropagation()}
                        title="Drag to extend across days"
                        style={{ position: 'absolute', right: 0, top: 6, bottom: 7, width: 7, cursor: 'ew-resize' }}></div>

                      {/* Hover affordances */}
                      {showAfford && height > 30 && (
                        <>
                          <div style={{ position: 'absolute', top: 1, left: '50%', transform: 'translateX(-50%)', width: 16, height: 3, borderRadius: 2, background: `${tc.border}70`, pointerEvents: 'none' }}></div>
                          <div style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 16, height: 3, borderRadius: 2, background: `${tc.border}70`, pointerEvents: 'none' }}></div>
                          <div style={{ position: 'absolute', left: 1, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: 2, background: `${tc.border}70`, pointerEvents: 'none' }}></div>
                          <div style={{ position: 'absolute', right: 1, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: 2, background: `${tc.border}70`, pointerEvents: 'none' }}></div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Snapped ghost preview */}
                {ghost && (
                  <div style={{ position: 'absolute', top: (ghost.start - DAY_START) * HOUR_PX, left: `calc(52px + (100% - 52px) * ${(ghost.day - 1) / 7} + 2px)`, width: `calc((100% - 52px) * ${(ghost.endDay - ghost.day + 1) / 7} - 4px)`, height: ghost.dur * HOUR_PX - 4, border: `1.5px dashed ${ghostConflict ? 'var(--status-warn)' : 'var(--brand)'}`, borderRadius: 6, background: ghost.outline ? 'transparent' : ghostConflict ? 'rgba(251,191,36,0.08)' : 'rgba(63,169,245,0.08)', zIndex: 50, pointerEvents: 'none', padding: '4px 6px' }}>
                    <div className="mono" style={{ fontSize: 9, fontWeight: 600, color: ghostConflict ? 'var(--status-warn)' : 'var(--brand)' }}>
                      {calFmtH(ghost.start)} – {calFmtH(ghost.start + ghost.dur)}{ghost.endDay > ghost.day ? ` · ${dayLabels[ghost.day-1]}–${dayLabels[ghost.endDay-1]}` : ''}{ghostConflict ? ' · ⚠ conflict' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <CalMonthView jobs={filteredJobs} techs={techs} drag={drag} monthGhost={monthGhost} conflicts={conflicts} selectedId={selectedId}
            getJobColor={getJobColor} spanOf={calSpanOf} calFmtH={calFmtH} beginDrag={beginDrag}
            onSelectJob={j => setSelectedId(selectedId === j.id ? null : j.id)}
            onCellClick={day => { setNewJobSlot({ day, start: 9 }); setShowNewModal(true); }}
            didDrag={() => didDragRef.current} />
        )}

        {/* Job detail panel */}
        {selectedJob && (
          <div className="glass" style={{ width: 248, flexShrink: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', animation: 'fade-up 0.15s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: getJobColor(selectedJob).border, marginBottom: 4 }}>{typeColors[selectedJob.type]?.label}{calSpanOf(selectedJob) > 1 ? ` · ${calSpanOf(selectedJob)}-day` : ''}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.3 }}>{selectedJob.title}</div>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>

            {/* Technician picker */}
            <div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 6 }}>Technicians</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {techs.map(t => {
                  const on = (selectedJob.techs || []).includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleJobTech(selectedJob.id, t.id)}
                      title={on ? `Remove ${t.name}` : `Add ${t.name}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px 4px 4px', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, transition: 'all 0.12s', background: on ? `${t.color}1c` : 'rgba(63,169,245,0.04)', border: `1px solid ${on ? t.color + '70' : 'var(--border-subtle)'}`, color: on ? t.color : 'var(--text-low)' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: `${t.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: t.color }}>{t.id}</span>
                      {t.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
              {(!selectedJob.techs || selectedJob.techs.length === 0) && (
                <div style={{ marginTop: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--status-warn)', fontWeight: 600, marginBottom: 5 }}>◌ Unassigned — pick techs above, or:</div>
                  <button onClick={() => autoAssign(selectedJob.id)} style={{ width: '100%', padding: '5px 0', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 5, color: 'var(--status-warn)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Auto-assign lightest load</button>
                </div>
              )}
            </div>

            {[
              { label: 'Customer', val: selectedJob.customer },
              { label: 'Schedule', val: `${dayLabels[selectedJob.day-1]}${calSpanOf(selectedJob) > 1 ? ` – ${dayLabels[(selectedJob.endDay||selectedJob.day)-1]}` : ''} · ${calFmtH(selectedJob.start)} – ${calFmtH(selectedJob.start + selectedJob.dur)}` },
              { label: 'Total Hours', val: `${selectedJob.dur * calSpanOf(selectedJob)}h${calSpanOf(selectedJob) > 1 ? ` (${selectedJob.dur}h × ${calSpanOf(selectedJob)} days)` : ''}` },
              { label: 'Value', val: selectedJob.value ? `$${selectedJob.value.toLocaleString()}` : '—' },
            ].map(r => (
              <div key={r.label}><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 2 }}>{r.label}</div><div style={{ fontSize: 12, color: 'var(--text-high)' }}>{r.val}</div></div>
            ))}
            {conflicts.includes(selectedJob.id) && (
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: 'var(--status-warn)', fontWeight: 600 }}>⚠ Scheduling Conflict</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>A crew member is double-booked at this time.</div>
              </div>
            )}
            <div style={{ fontSize: 9, color: 'var(--text-low)', lineHeight: 1.5 }}>Drag the block to move it. Side edges stretch it across days; in month view use the round end handles.</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button onClick={() => openWorkOrder(selectedJob)} style={{ flex: 1, padding: '7px 0', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Work Order →</button>
            </div>
          </div>
        )}
      </div>

      {/* Floating cursor ghost for tech / project drags */}
      {drag && drag.pos && (dragKind === 'tech' || dragKind === 'project') && (
        <div style={{ position: 'fixed', left: drag.pos.x + 14, top: drag.pos.y + 10, zIndex: 2000, pointerEvents: 'none' }}>
          {dragKind === 'tech' ? (
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px 5px 6px', borderRadius: 20, border: `1px solid ${drag.tech.color}60`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${drag.tech.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: drag.tech.color, fontWeight: 700, border: `1px solid ${drag.tech.color}40` }}>{drag.tech.id}</span>
              <span style={{ fontSize: 11, color: 'var(--text-high)', fontWeight: 500 }}>{drag.tech.name.split(' ')[0]}</span>
              <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{drag.target && (drag.target.overJob || drag.target.overBarId != null) ? '+ join crew' : '→ schedule'}</span>
            </div>
          ) : (
            <div className="glass" style={{ padding: '7px 11px', borderRadius: 8, border: `1px solid ${(typeColors[drag.project.type] || typeColors.install).border}50`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxWidth: 220 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3 }}>{drag.project.title}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{drag.project.dur}h{(drag.project.days || 1) > 1 ? ` × ${drag.project.days}d` : ''} · lands unassigned</div>
            </div>
          )}
        </div>
      )}

      {showNewModal && <NewJobModal techs={techs} typeColors={typeColors} initialSlot={newJobSlot} calFmtH={calFmtH} onClose={() => setShowNewModal(false)} onCreate={(job) => { setJobs(prev => [...prev, job]); setShowNewModal(false); setSelectedId(job.id); showToast(job.techs.length ? 'Job scheduled' : 'Job scheduled — unassigned', job.techs.length ? 'ok' : 'warn'); }} />}
    </div>
  );
}

const calNavBtn = { background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 16, cursor: 'pointer', padding: '4px 10px', fontFamily: 'var(--font-body)', lineHeight: 1, transition: 'all 0.15s' };

Object.assign(window, { CalendarScreen });

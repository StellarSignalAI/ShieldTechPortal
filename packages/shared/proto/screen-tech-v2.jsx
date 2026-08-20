/* Technician App v2 — Clockify-style Time, Expenses, Vehicle Inspection, Parts */

/* ── Enhanced Time View (Clockify-style) ── */
function TimeViewV2() {
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [billable, setBillable] = React.useState(true);
  const [activeProject, setActiveProject] = React.useState('General');
  const [activeTask, setActiveTask] = React.useState('Installation');
  /* The clock is anchored to a WALL-CLOCK start persisted in localStorage —
     switching tabs, backgrounding the browser, or a reload can no longer
     reset or undercount a day's labor. */
  const startRef = React.useRef(null);
  const persistTimer = (patch = {}) => {
    try {
      localStorage.setItem('st2:timer', JSON.stringify({
        start: startRef.current, project: activeProject, task: activeTask, ...patch,
      }));
    } catch { /* quota */ }
  };
  const clearTimer = () => { startRef.current = null; try { localStorage.removeItem('st2:timer'); } catch {} };
  const [liveEntries, setLiveEntries] = React.useState([]);
  const [gps, setGps] = React.useState('\u2014');
  const [loadError, setLoadError] = React.useState(null);
  const refreshEntries = React.useCallback(() => {
    const t = window.__shieldTime;
    if (!t) return;
    t.myEntries()
      .then(r => { if (r.ok) { setLiveEntries(r.data || []); setLoadError(null); } else setLoadError(r.error || 'load failed'); })
      .catch(e => setLoadError(String(e)));
  }, []);
  React.useEffect(() => { refreshEntries(); }, [refreshEntries]);
  React.useEffect(() => {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos => setGps(`${pos.coords.latitude.toFixed(4)}\u00b0, ${pos.coords.longitude.toFixed(4)}\u00b0`),
      () => {}, { timeout: 4000 });
  }, []);
  const [viewMode, setViewMode] = React.useState('today'); // today | week | pay-period
  const [stopNote, setStopNote] = React.useState(null);   // null = closed; string = note being typed on timer stop
  const [manualEntryOpen, setManualEntryOpen] = React.useState(false);
  const [manualEntry, setManualEntry] = React.useState({ project: 'General', task: 'Installation', date: new Date().toISOString().slice(0, 10), startTime: '08:00', endTime: '12:00', billable: true, notes: '' });
  const [activeTag, setActiveTag] = React.useState('on-site');
  // Global toast host (centered above the tab bar) — the old local toast
  // rendered under the bottom nav and clipped off-screen.
  const showToast = (m) => window.showToast(m, /^⚠/.test(String(m)) ? 'warn' : 'info');

  /* Restore a timer that survived a tab switch / reload. */
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('st2:timer') || 'null');
      if (saved && saved.start) {
        startRef.current = saved.start;
        if (saved.project) setActiveProject(saved.project);
        if (saved.task) setActiveTask(saved.task);
        setElapsed(Math.max(0, Math.floor((Date.now() - saved.start) / 1000)));
        setRunning(true);
      } else if (saved && saved.pausedElapsed) {
        setElapsed(saved.pausedElapsed);
      }
    } catch { /* corrupt state — start fresh */ }
  }, []);

  React.useEffect(() => {
    if (!running) return;
    if (!startRef.current) { startRef.current = Date.now() - elapsed * 1000; persistTimer(); }
    // Wall-clock derived — background interval throttling can't undercount.
    const t = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - startRef.current) / 1000))), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  // Blank canvas: today's entries come straight from Supabase (my draft/logged
  // hours for today), never seed data.
  const todayKey = new Date().toISOString().slice(0, 10);
  const fmtClock = (iso) => iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
  const todayEntries = liveEntries
    .filter(e => e.work_date === todayKey || e.status === 'rejected')   // rejected stays visible until fixed
    .map(e => ({
      id: e.id,
      workDate: e.work_date,
      project: e.job_ref || 'General',
      task: e.notes || '—',
      start: fmtClock(e.start_at),
      end: fmtClock(e.end_at),
      dur: Math.round(Number(e.hours) * 3600),
      billable: e.job_ref !== 'Travel',
      type: e.job_ref === 'Travel' ? 'drive' : 'work',
      status: e.status,
      rejection: e.rejection_reason || null,
      tags: [e.status],
    }));
  const delEntry = (id) => {
    if (!id || !window.__shieldTime) return;
    if (!window.confirm('Delete this time entry? This cannot be undone.')) return;
    window.__shieldTime.deleteEntry(id).then(r => { showToast(r.ok ? 'Entry deleted' : (r.error || 'Could not delete')); refreshEntries(); });
  };

  const monday = (() => { const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return d; })();
  const dayLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  // Mon–Sun to match submitWeek's range — weekend hours count in the total.
  const weekData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayEntries = liveEntries.filter(e => e.work_date === key);
    const work = dayEntries.filter(e => e.job_ref !== 'Travel').reduce((s2, e) => s2 + Number(e.hours), 0);
    const drive = dayEntries.filter(e => e.job_ref === 'Travel').reduce((s2, e) => s2 + Number(e.hours), 0);
    const break_ = dayEntries.reduce((s2, e) => s2 + (e.break_minutes || 0), 0) / 60;
    return { day, date: dayLabel(d), work: +work.toFixed(1), drive: +drive.toFixed(1), break_: +break_.toFixed(1), total: +(work + drive).toFixed(1) };
  });
  const weekLabel = `Week of ${dayLabel(monday)} \u2014 ${dayLabel(new Date(monday.getTime() + 6 * 86400000))}`;

  /* Real, pickable work: open projects and work orders from the shared stores —
     mine first, but ALL open work stays selectable so an assignment to any user
     never makes a job impossible to log time against. job_ref stores the
     project/WO number so payroll and job costing can tie hours back. */
  const [twProjects] = useShieldStore(projectStore);
  const [twWos] = useShieldStore(workOrderStore);
  const twMe = window.__shieldUser || {};
  const twInit = (twMe.name || '').split(' ').map(w => w[0]).join('').toUpperCase();
  const woMine = w => (twMe.id && w.assignedTo === twMe.id) || (twInit && w.techId === twInit) ? 0 : 1;
  const openWos = (twWos || [])
    .filter(w => !['done', 'completed', 'closed', 'cancelled'].includes(String(w.status || '')))
    .sort((a, b) => woMine(a) - woMine(b));
  const openProjects = (twProjects || []).filter(p => !['completed', 'closed', 'cancelled'].includes(String(p.status || '')));
  const projectGroups = [
    { label: 'Categories', opts: ['General', 'Travel', 'Admin', 'Training'].map(c => ({ ref: c, label: c })) },
    ...(openProjects.length ? [{ label: 'Projects', opts: openProjects.map(p => ({ ref: p.number, label: `${p.number} — ${p.name}` })) }] : []),
    ...(openWos.length ? [{ label: 'Work Orders', opts: openWos.map(w => ({ ref: w.id, label: `${w.id} — ${w.customer}${woMine(w) === 0 ? ' (mine)' : ''}` })) }] : []),
  ];
  const tasks = {
    default: ['Installation','Repair','Maintenance','Survey','Programming','Testing','Documentation']
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Active Timer — Big Display */}
      <GlassPanel style={{
        textAlign: 'center', padding: '20px 16px',
        borderTop: running ? '2px solid var(--brand)' : '2px solid var(--text-low)',
        boxShadow: running ? '0 -4px 20px -8px rgba(63,169,245,0.2)' : 'none'
      }}>
        {/* Timer display */}
        <div className="mono" style={{
          fontSize: 40, fontWeight: 200, letterSpacing: '-0.02em',
          color: running ? 'var(--brand)' : 'var(--text-mid)',
          marginBottom: 8
        }}>{fmt(running ? elapsed : 0)}</div>

        {/* Project / Task selector — selects size to the ROW, never to their
            widest option (long WO/PRJ labels), so the card fits every phone. */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, width: '100%' }}>
          <select value={activeProject} onChange={e => setActiveProject(e.target.value)} style={{
            flex: '1.4 1 0', minWidth: 0, width: '100%', textOverflow: 'ellipsis',
            padding: '5px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none'
          }}>
            {projectGroups.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.opts.map(o => <option key={o.ref} value={o.ref} style={{ background: 'var(--card)' }}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
          <select value={activeTask} onChange={e => setActiveTask(e.target.value)} style={{
            flex: '1 1 0', minWidth: 0, width: '100%', textOverflow: 'ellipsis',
            padding: '5px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none'
          }}>
            {(tasks[activeProject] || tasks.default).map(t => <option key={t} value={t} style={{ background: 'var(--card)' }}>{t}</option>)}
          </select>
        </div>

        {/* Billable toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-mid)', cursor: 'pointer' }}>
            <input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} style={{ accentColor: 'var(--brand)' }} /> Billable
          </label>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['on-site','travel','admin'].map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)} style={{
                padding: '2px 8px', borderRadius: 100, fontSize: 9,
                background: tag === activeTag ? 'rgba(63,169,245,0.1)' : 'transparent',
                border: '1px solid var(--border-subtle)',
                color: tag === activeTag ? 'var(--brand)' : 'var(--text-low)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'uppercase'
              }}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Control buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button onClick={() => {
            if (running) {
              // Pause: freeze elapsed, remember it in case the app closes.
              setRunning(false);
              startRef.current = null;
              try { localStorage.setItem('st2:timer', JSON.stringify({ pausedElapsed: elapsed })); } catch {}
            } else {
              startRef.current = Date.now() - elapsed * 1000;
              persistTimer();
              setRunning(true);
            }
          }} style={{
            width: 56, height: 56, borderRadius: '50%',
            background: running ? 'rgba(244,63,94,0.12)' : 'rgba(52,211,153,0.12)',
            border: `2px solid ${running ? 'var(--status-critical)' : 'var(--status-ok)'}`,
            color: running ? 'var(--status-critical)' : 'var(--status-ok)',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: running ? '0 0 16px -4px rgba(244,63,94,0.2)' : '0 0 16px -4px rgba(52,211,153,0.2)'
          }}>{running ? '⏸' : '▶'}</button>
          {running && (
            <button onClick={() => {
              // Pause and require a work note before the entry saves.
              setRunning(false);
              if (elapsed / 3600 > 0.01) setStopNote('');
              else { setElapsed(0); clearTimer(); showToast('Timer under a minute — entry not saved'); }
            }} style={{
              width: 44, height: 44, borderRadius: '50%', alignSelf: 'center',
              background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-mid)', fontSize: 14, cursor: 'pointer'
            }}>⏹</button>
          )}
          <button onClick={() => setManualEntryOpen(true)} style={{
            width: 44, height: 44, borderRadius: '50%', alignSelf: 'center',
            background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)', fontWeight: 600
          }} title="Manual time entry">+</button>
        </div>

        {/* GPS */}
        <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <StatusDot status={gps === '—' ? 'offline' : 'online'} size={4} pulse={gps !== '—'} />
          GPS: {gps}
        </div>
      </GlassPanel>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        {[{id:'today',label:'Today'},{id:'week',label:'Week'},{id:'pay-period',label:'Pay Period'}].map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)} style={{
            flex: 1, padding: '6px', fontSize: 11, fontWeight: 500,
            background: viewMode === v.id ? 'rgba(63,169,245,0.12)' : 'transparent',
            border: 'none', color: viewMode === v.id ? 'var(--brand)' : 'var(--text-low)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{v.label}</button>
        ))}
      </div>

      {/* Today's entries */}
      {viewMode === 'today' && (
        <div>
          <div className="label-sm" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>TODAY'S ENTRIES</span>
            {/* Old-date rejected entries stay visible for fixing but never count in today's total. */}
            <span>{(todayEntries.filter(e => e.workDate === todayKey).reduce((s, e) => s + e.dur, 0) / 3600).toFixed(1)}h total</span>
          </div>
          {loadError && (
            <div style={{ padding: '10px 14px', marginBottom: 8, borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 11, color: 'var(--status-warn)' }}>
              ⚠ Couldn't load your entries ({loadError}) — <span onClick={refreshEntries} style={{ textDecoration: 'underline', cursor: 'pointer' }}>retry</span>
            </div>
          )}
          {!loadError && todayEntries.length === 0 && (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 8 }}>
              No time logged today yet. Start the timer or add a manual entry with ＋.
            </div>
          )}
          {todayEntries.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0',
              borderBottom: '1px solid rgba(63,169,245,0.05)',
              opacity: e.active ? 1 : 0.8
            }}>
              <div style={{
                width: 4, height: 32, borderRadius: 2,
                background: e.type === 'work' ? 'var(--brand)' : 'var(--status-warn)',
                boxShadow: e.active ? '0 0 6px var(--brand)' : 'none'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: e.active ? 600 : 400, color: 'var(--text-high)' }}>{e.project}</span>
                  {e.active && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--brand)', background: 'rgba(63,169,245,0.1)', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase' }}>LIVE</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{e.task}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                  {e.tags.map(t => (
                    <span key={t} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: t === 'rejected' ? 'rgba(244,63,94,0.12)' : 'rgba(63,169,245,0.06)', color: t === 'rejected' ? 'var(--status-critical)' : 'var(--text-low)', textTransform: 'uppercase' }}>{t}</span>
                  ))}
                </div>
                {e.status === 'rejected' && e.rejection && (
                  <div style={{ marginTop: 4, padding: '5px 8px', borderRadius: 5, background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 10.5, color: 'var(--status-critical)', lineHeight: 1.4 }}>
                    Office: {e.rejection} — delete this entry and resubmit corrected time.
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: e.active ? 'var(--brand)' : 'var(--text-mid)' }}>
                  {e.active ? fmt(e.dur) : `${Math.floor(e.dur/3600)}h ${Math.floor((e.dur%3600)/60)}m`}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.start} — {e.end}</div>
              </div>
              {e.billable && <span style={{ fontSize: 9, color: 'var(--status-ok)', fontWeight: 700 }}>$</span>}
              {e.id && e.status !== 'approved' && e.status !== 'paid' && (
                <button onClick={() => delEntry(e.id)} title="Delete entry" style={{
                  background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer',
                  fontSize: 14, padding: '2px 4px', lineHeight: 1
                }}>🗑</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Weekly Timesheet Grid */}
      {viewMode === 'week' && (
        <GlassPanel style={{ padding: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{weekLabel}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{weekData.reduce((s, d) => s + d.total, 0).toFixed(1)}h</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Day','Work','Drive','Break','Total'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekData.map((d, i) => (
                <tr key={i} style={{ background: i === 3 ? 'rgba(63,169,245,0.04)' : 'transparent' }}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{d.day}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{d.date}</div>
                  </td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: 'var(--brand)' }}>{d.work || '—'}</td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: 'var(--status-warn)' }}>{d.drive || '—'}</td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: 'var(--text-low)' }}>{d.break_ || '—'}</td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{d.total || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 12 }}>Total</td>
                <td className="mono" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: 12, color: 'var(--brand)' }}>{weekData.reduce((s,d) => s + d.work, 0).toFixed(1)}</td>
                <td className="mono" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: 12, color: 'var(--status-warn)' }}>{weekData.reduce((s,d) => s + d.drive, 0).toFixed(1)}</td>
                <td className="mono" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: 12, color: 'var(--text-low)' }}>{weekData.reduce((s,d) => s + d.break_, 0).toFixed(1)}</td>
                <td className="mono" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{weekData.reduce((s,d) => s + d.total, 0).toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
            <button onClick={() => {
              const t = window.__shieldTime;
              const weekStartKey = monday.toISOString().slice(0, 10);
              const weekEndKey = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10);
              if (!t) { shieldToast('Backend not configured', 'info'); return; }
              t.submitWeek(weekStartKey, weekEndKey).then(r => {
                if (!r.ok) { shieldToast(r.error || 'Could not submit timesheet', 'critical'); return; }
                shieldToast(r.count > 0 ? `Timesheet submitted for approval \u2014 ${r.count} ${r.count === 1 ? 'entry' : 'entries'}` : 'No draft entries to submit this week', r.count > 0 ? 'ok' : 'info');
                refreshEntries();
              });
            }} style={{ width: '100%', padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Submit Timesheet for Approval</button>
          </div>
        </GlassPanel>
      )}

      {/* Pay Period */}
      {viewMode === 'pay-period' && (() => {
        const ppEnd = new Date(); const ppStart = new Date(ppEnd.getTime() - 13 * 86400000);
        const ppDays = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(ppStart.getTime() + i * 86400000);
          const key = d.toISOString().slice(0, 10);
          return liveEntries.filter(e => e.work_date === key).reduce((s2, e) => s2 + Number(e.hours), 0);
        });
        const ppWork = liveEntries.filter(e => { const d = e.work_date; return d >= ppStart.toISOString().slice(0,10) && d <= ppEnd.toISOString().slice(0,10) && e.job_ref !== 'Travel'; }).reduce((s2, e) => s2 + Number(e.hours), 0);
        const ppDrive = liveEntries.filter(e => { const d = e.work_date; return d >= ppStart.toISOString().slice(0,10) && d <= ppEnd.toISOString().slice(0,10) && e.job_ref === 'Travel'; }).reduce((s2, e) => s2 + Number(e.hours), 0);
        const ppLabel = `${ppStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2014 ${ppEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        return (
        <GlassPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Pay Period: {ppLabel}</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Trailing 14 days</div>
            </div>
            <StatusBadge status="pending" label="In Progress" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(63,169,245,0.03)', borderRadius: 6 }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>{ppWork.toFixed(1)}h</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Billable</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(63,169,245,0.03)', borderRadius: 6 }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--status-warn)' }}>{ppDrive.toFixed(1)}h</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Drive</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(63,169,245,0.03)', borderRadius: 6 }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-high)' }}>{(ppWork + ppDrive).toFixed(1)}h</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Total</div>
            </div>
          </div>
          {/* Day-by-day mini bars */}
          <div style={{ display: 'flex', gap: 3, height: 60, alignItems: 'flex-end' }}>
            {ppDays.map((h, i) => (
              <div key={i} style={{
                flex: 1, height: h > 0 ? `${(h/10)*100}%` : 2,
                background: h > 8 ? 'var(--status-warn)' : h > 0 ? 'var(--brand)' : 'rgba(63,169,245,0.05)',
                borderRadius: '2px 2px 0 0', opacity: h > 0 ? 0.7 : 0.3,
                minHeight: 2
              }} title={h > 0 ? `${h}h` : 'Off'} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 8, color: 'var(--text-low)' }}>{ppStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span style={{ fontSize: 8, color: 'var(--text-low)' }}>{ppEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⟡</span>
              <span style={{ fontSize: 11, color: 'var(--brand)' }}>ShieldTech AI insights appear here as time entries accumulate.</span>
            </div>
          </div>
        </GlassPanel>
      ); })()}

      {/* Timer-stop note — required before the entry saves */}
      {stopNote !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 380, maxWidth: '94vw', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fade-up 0.15s ease both' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>What did you work on?</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>{fmt(elapsed)} on {activeProject} · {activeTask} — a note is required before this entry saves.</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <textarea autoFocus value={stopNote} onChange={e => setStopNote(e.target.value)} placeholder="e.g. Mounted 4 domes in the lobby, terminated + tested runs 3–6" rows={3}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: `1px solid ${stopNote.trim() ? 'var(--border-subtle)' : 'rgba(251,191,36,0.4)'}`, borderRadius: 6, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setStopNote(null); startRef.current = Date.now() - elapsed * 1000; persistTimer(); setRunning(true); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Keep Timing</button>
              <button onClick={() => {
                if (!stopNote.trim()) { showToast('⚠ Add a note describing the work before submitting'); return; }
                if (!window.__shieldTime) { showToast('Backend not configured'); return; }
                const hrs = elapsed / 3600;
                const note = stopNote.trim();
                const meta = [activeTag !== 'on-site' ? activeTag : null, billable ? null : 'non-billable'].filter(Boolean);
                // The clock only resets AFTER the entry saves — a failed write
                // (offline, RLS, expired session) keeps the hours on screen.
                window.__shieldTime.submitHours({ workDate: new Date().toISOString().slice(0, 10), hours: hrs, jobRef: activeProject, notes: `${activeTask} — ${note}${meta.length ? ` [${meta.join(', ')}]` : ''}`, draft: true })
                  .then(r => {
                    if (r.ok) {
                      setStopNote(null); setElapsed(0); clearTimer();
                      showToast(`Logged ${hrs.toFixed(2)}h — saved as draft`);
                      refreshEntries();
                    } else {
                      showToast(`⚠ Could not save (${r.error || 'unknown'}) — your time is still here, try again`);
                    }
                  });
              }} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Time Entry Modal */}
      {manualEntryOpen && (
        <div onClick={() => setManualEntryOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 380, maxWidth: '94vw', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fade-up 0.15s ease both' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Manual Time Entry</span>
              <button onClick={() => setManualEntryOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Project</div>
                <select value={manualEntry.project} onChange={e => setManualEntry(prev => ({...prev, project: e.target.value}))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>
                  {projectGroups.map(g => (
                    <optgroup key={g.label} label={g.label}>
                      {g.opts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Task</div>
                <select value={manualEntry.task} onChange={e => setManualEntry(prev => ({...prev, task: e.target.value}))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>
                  {(tasks[manualEntry.project] || tasks.default).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                <input type="date" value={manualEntry.date} onChange={e => setManualEntry(prev => ({...prev, date: e.target.value}))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Start Time</div>
                  <input type="time" value={manualEntry.startTime} onChange={e => setManualEntry(prev => ({...prev, startTime: e.target.value}))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>End Time</div>
                  <input type="time" value={manualEntry.endTime} onChange={e => setManualEntry(prev => ({...prev, endTime: e.target.value}))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
                </div>
              </div>
              {/* Duration preview */}
              {manualEntry.startTime && manualEntry.endTime && (() => {
                const [sh, sm] = manualEntry.startTime.split(':').map(Number);
                const [eh, em] = manualEntry.endTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                const hrs = Math.floor(mins / 60);
                const rm = mins % 60;
                return mins > 0 ? (
                  <div style={{ padding: '6px 10px', borderRadius: 5, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{hrs}h {rm}m</span>
                    <span style={{ fontSize: 10, color: 'var(--text-low)', marginLeft: 6 }}>duration</span>
                  </div>
                ) : null;
              })()}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-mid)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={manualEntry.billable} onChange={e => setManualEntry(prev => ({...prev, billable: e.target.checked}))} style={{ accentColor: 'var(--brand)' }} /> Billable
                </label>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Notes <span style={{ color: 'var(--status-warn)' }}>*</span> <span style={{ textTransform: 'none', fontWeight: 400 }}>(required)</span></div>
                <textarea value={manualEntry.notes} onChange={e => setManualEntry(prev => ({...prev, notes: e.target.value}))} placeholder="What did you work on? Required before saving." rows={2} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: `1px solid ${manualEntry.notes.trim() ? 'var(--border-subtle)' : 'rgba(251,191,36,0.4)'}`, borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setManualEntryOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => {
                const t = window.__shieldTime;
                if (!t) { showToast('Backend not configured'); return; }
                if (!manualEntry.notes.trim()) { showToast('⚠ Add a note describing the work before saving this entry'); return; }
                const [msh, msm] = manualEntry.startTime.split(':').map(Number);
                const [meh, mem] = manualEntry.endTime.split(':').map(Number);
                if ((meh * 60 + mem) - (msh * 60 + msm) <= 0) { showToast('⚠ End time must be after start — for overnight shifts enter two entries'); return; }
                const startAt = `${manualEntry.date}T${manualEntry.startTime}:00`;
                const endAt = `${manualEntry.date}T${manualEntry.endTime}:00`;
                t.submitHours({ workDate: manualEntry.date, startAt, endAt, jobRef: manualEntry.project, notes: `${manualEntry.task} — ${manualEntry.notes.trim()}${manualEntry.billable ? '' : ' [non-billable]'}`, draft: true })
                  .then(r => { showToast(r.ok ? `Saved: ${manualEntry.project} — ${manualEntry.task}` : (r.error || 'Could not save entry')); if (r.ok) { setManualEntryOpen(false); refreshEntries(); } });
              }} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Expense Submission — REAL: quick-snap receipts + shared expense store ── */
/* techExpenseStore now lives in shared-state.jsx (the office approves from it) */

function ExpenseView() {
  const [showForm, setShowForm] = React.useState(false);
  const [f, setF] = React.useState({ desc: '', amount: '', category: 'Materials' });
  const [allRows] = useShieldStore(techExpenseStore);
  const [myReceipts, setMyReceipts] = React.useState([]);
  const [snapBusy, setSnapBusy] = React.useState(false);
  const snapRef = React.useRef(null);
  const meName = ((window.__shieldUser || {}).name || '').toLowerCase();

  const refreshReceipts = React.useCallback(() => {
    if (!window.__shieldReceipts) return;
    window.__shieldReceipts.list().then(r => { if (r.ok) setMyReceipts(r.data); });
  }, []);
  React.useEffect(() => { refreshReceipts(); }, [refreshReceipts]);

  /* My expenses from the shared store (approved/rejected by the office).
     When identity is unknown, show only unattributed rows — never the whole crew's. */
  const expenses = (allRows || []).filter(e => meName ? (e.by || '').toLowerCase() === meName : !e.by);

  const [snapCat, setSnapCat] = React.useState('Materials');
  const snap = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!window.__shieldReceipts) { shieldToast('Receipts backend not configured', 'warn'); return; }
    setSnapBusy(true);
    const r = await window.__shieldReceipts.snap(file, { category: snapCat });
    setSnapBusy(false);
    if (r.ok) { shieldToast(`Receipt sent to the office as ${snapCat}`, 'ok'); refreshReceipts(); }
    else shieldToast('Upload failed: ' + (r.error || 'unknown'), 'warn');
  };

  const submit = () => {
    if (!f.desc.trim() || !(Number(f.amount) > 0)) { shieldToast('Add a description and amount', 'warn'); return; }
    techExpenseStore.set(prev => [{
      id: genId('exp'), desc: f.desc.trim(), amount: Number(f.amount), category: f.category,
      by: (window.__shieldUser || {}).name || 'Tech', date: new Date().toISOString().slice(0, 10), status: 'pending',
    }, ...(prev || [])]);
    setF({ desc: '', amount: '', category: 'Materials' }); setShowForm(false);
    shieldToast('Expense submitted for approval', 'ok');
  };

  const statusColors = { pending: 'var(--status-warn)', approved: 'var(--status-ok)', rejected: 'var(--status-critical)', inbox: 'var(--status-warn)', converted: 'var(--status-ok)', dismissed: 'var(--text-low)' };
  /* Snapped receipts with amounts count too — converted ones already live in
     the expense store, so skip them to avoid double counting. */
  const receiptRows = (myReceipts || []).filter(r => r.amount != null && r.status !== 'converted' && r.status !== 'dismissed');
  const receiptSum = receiptRows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const monthTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0) + receiptSum;
  const pendingTotal = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount || 0), 0)
    + receiptRows.filter(r => r.status === 'inbox').reduce((s, r) => s + Number(r.amount || 0), 0);
  const approvedTotal = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="glass" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-high)' }}>${monthTotal.toFixed(2)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Recorded</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-warn)' }}>${pendingTotal.toFixed(2)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Pending</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-ok)' }}>${approvedTotal.toFixed(2)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Approved</div>
        </div>
      </div>

      {/* Quick-snap — pick the category, then shoot */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Materials', 'Fuel', 'Tools', 'Meals', 'Other'].map(c => (
          <button key={c} onClick={() => setSnapCat(c)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, background: snapCat === c ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${snapCat === c ? 'var(--brand)' : 'var(--border-subtle)'}`, color: snapCat === c ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c}</button>
        ))}
      </div>
      <input ref={snapRef} type="file" accept="image/*" capture="environment" onChange={snap} style={{ display: 'none' }} />
      <button disabled={snapBusy} onClick={() => snapRef.current && snapRef.current.click()} style={{
        padding: '14px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none',
        borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
        opacity: snapBusy ? 0.5 : 1, boxShadow: '0 0 18px -6px rgba(63,169,245,0.5)'
      }}>{snapBusy ? 'Uploading…' : `📷 Snap a ${snapCat.toLowerCase()} receipt`}</button>
      <button onClick={() => setShowForm(s => !s)} style={{ padding: '9px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        {showForm ? 'Cancel' : '+ Manual expense (no receipt)'}
      </button>

      {/* Manual form */}
      {showForm && (
        <GlassPanel style={{ borderLeft: '3px solid var(--brand)', animation: 'fade-up 0.3s ease both' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>AMOUNT</div>
              <input type="number" inputMode="decimal" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 16, fontFamily: 'var(--font-mono)', outline: 'none' }} />
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>DESCRIPTION</div>
              <input value={f.desc} onChange={e => setF(p => ({ ...p, desc: e.target.value }))} placeholder="What was this for?" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Materials','Fuel','Tools','Meals','Other'].map(c => (
                <button key={c} onClick={() => setF(p => ({ ...p, category: c }))} style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, background: f.category === c ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${f.category === c ? 'var(--brand)' : 'var(--border-subtle)'}`, color: f.category === c ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c}</button>
              ))}
            </div>
            <button onClick={submit} style={{ padding: '11px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Submit Expense</button>
          </div>
        </GlassPanel>
      )}

      {/* My snapped receipts */}
      {myReceipts.length > 0 && (
        <div>
          <div className="label-sm" style={{ marginBottom: 8 }}>MY RECEIPTS</div>
          {myReceipts.slice(0, 12).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <div style={{ width: 4, height: 26, borderRadius: 2, background: statusColors[r.status] || 'var(--text-low)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-high)' }}>{r.vendor || r.note || 'Receipt'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{new Date(r.created_at).toLocaleDateString()}{r.expense_category ? ` · ${r.expense_category}` : ''} · {r.status === 'inbox' ? 'waiting for the office' : r.status}</div>
              </div>
              {r.amount != null && <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-high)' }}>${Number(r.amount).toFixed(2)}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Expense list (shared store — office approvals show live) */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>RECENT EXPENSES</div>
        {expenses.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '10px 0' }}>Nothing yet — snap a receipt or add a manual expense.</div>}
        {expenses.slice(0, 20).map((e, i) => (
          <div key={e.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: statusColors[e.status] }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{e.desc}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.date}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>·</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.category}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>·</span>
                <span style={{ fontSize: 10, color: statusColors[e.status] }}>{e.status}</span>
              </div>
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>${Number(e.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vehicle Inspection — nothing pre-ticked, submissions persist ── */
const vehicleInspStore = createShieldStore('vinspect', []);
function VehicleInspectionView() {
  const [issueText, setIssueText] = React.useState('');
  const [checks, setChecks] = React.useState([
    { cat: 'Exterior', items: [
      { label: 'Body damage — none', done: false },
      { label: 'Tires — adequate tread', done: false },
      { label: 'Lights — all working', done: false },
      { label: 'Ladder rack — secure', done: false },
    ]},
    { cat: 'Interior', items: [
      { label: 'Mirrors adjusted', done: false },
      { label: 'Seat belt functional', done: false },
      { label: 'Dash warning lights — none', done: false },
      { label: 'Fire extinguisher present', done: false },
    ]},
    { cat: 'Truck Stock', items: [
      { label: 'Tool bag — complete', done: false },
      { label: 'Drill / impact driver', done: false },
      { label: 'Cable tester', done: false },
      { label: 'Laptop + charger', done: false },
      { label: 'PPE — hard hat, safety vest', done: false },
    ]},
  ]);
  const [inspections, setInspections] = useShieldStore(vehicleInspStore);
  const me = window.__shieldUser || {};
  const todayIso = new Date().toISOString().slice(0, 10);
  const submittedToday = (inspections || []).some(r => r.tech === (me.initials || me.name) && r.date === todayIso);

  const totalItems = checks.reduce((s, c) => s + c.items.length, 0);
  const doneItems = checks.reduce((s, c) => s + c.items.filter(i => i.done).length, 0);

  const submitInspection = () => {
    if (doneItems !== totalItems) return;
    setInspections(list => [{
      id: genId('INSP'), tech: me.initials || me.name || 'Tech', techName: me.name || 'Technician',
      date: todayIso, at: Date.now(), items: totalItems,
      // Full checklist state persists — not just counts — so the record shows
      // exactly what was verified.
      checklist: checks.map(c => ({ cat: c.cat, items: c.items.map(i => ({ label: i.label, done: i.done })) })),
      failed: checks.flatMap(c => c.items.filter(i => !i.done).map(i => i.label)),
    }, ...(list || [])]);
    shieldToast('Inspection recorded', 'ok');
  };
  const submitIssue = () => {
    if (!issueText.trim()) { shieldToast('Describe the issue first', 'warn'); return; }
    const chat = window.__shieldChat;
    if (chat && chat.myThreadId()) {
      chat.send(chat.myThreadId(), `🚐 VEHICLE ISSUE: ${issueText.trim()}`)
        .then(r => shieldToast(r.ok ? 'Issue sent to dispatch — check Messages for replies' : `Could not send: ${r.error}`, r.ok ? 'warn' : 'warn'));
    } else {
      shieldToast('Messaging not available — call dispatch', 'warn');
    }
    setIssueText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Daily Vehicle Inspection</div>
          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · Pre-trip{submittedToday ? ' · ✓ submitted today' : ''}</div>
        </div>
        <HealthRing value={Math.round(doneItems/totalItems*100)} size={50} strokeWidth={4} label="" />
      </div>

      {checks.map((cat, ci) => (
        <GlassPanel key={ci}>
          <div className="label-sm" style={{ marginBottom: 8 }}>{cat.cat.toUpperCase()}</div>
          {cat.items.map((item, ii) => (
            <label key={ii} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: ii < cat.items.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none', cursor: 'pointer'
            }}>
              <div onClick={() => {
                const copy = [...checks];
                copy[ci] = { ...copy[ci], items: copy[ci].items.map((it, idx) => idx === ii ? { ...it, done: !it.done } : it) };
                setChecks(copy);
              }} style={{
                width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                border: item.done ? 'none' : '1.5px solid var(--border-strong)',
                background: item.done ? 'var(--status-ok)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#fff', cursor: 'pointer', transition: 'all 0.15s'
              }}>{item.done ? '✓' : ''}</div>
              <span style={{ fontSize: 13, color: item.done ? 'var(--text-low)' : 'var(--text-high)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
            </label>
          ))}
        </GlassPanel>
      ))}

      {/* Report issue */}
      <GlassPanel style={{ borderLeft: '3px solid var(--status-warn)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Report an Issue</div>
        <textarea value={issueText} onChange={e => setIssueText(e.target.value)} placeholder="Describe the issue (flat tire, missing tool, vehicle damage)…" rows={3} style={{ width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={submitIssue} style={{ flex: 1, padding: '8px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, color: 'var(--status-warn)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send Issue to Dispatch</button>
        </div>
      </GlassPanel>

      <button onClick={submitInspection} style={{
        padding: '12px', background: doneItems === totalItems ? 'var(--status-ok)' : 'var(--brand)',
        border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: doneItems === totalItems ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)',
        opacity: doneItems === totalItems ? 1 : 0.5
      }}>
        {doneItems === totalItems ? '✓ Submit Completed Inspection' : `Complete ${totalItems - doneItems} remaining items`}
      </button>
    </div>
  );
}

/* ── Parts Request — the REAL shared queue (truck auto-restocks land here) ── */
function PartsRequestView() {
  const [allReqs] = useShieldStore(partsReqStore);
  const me = window.__shieldUser || {};
  const meId = me.initials || 'ME';
  const requests = (allReqs || [])
    .filter(r => !r.tech || r.tech === meId)
    .map(r => ({
      id: r.id, status: r.status || 'requested',
      item: (r.parts || []).map(p => `${p.qty > 1 ? p.qty + '× ' : ''}${p.name}`).join(', ') || r.item || 'Parts',
      qty: (r.parts || []).reduce((s, p) => s + (Number(p.qty) || 1), 0) || r.qty || 1,
      urgency: r.urgency || 'standard', job: r.job || '—', tracking: r.tracking,
    }));

  const newRequest = () => shieldModal({
    kind: 'form', title: 'New Parts Request', submitLabel: 'Send Request',
    successMsg: 'Request sent to the office', fields: [
      { key: 'item', label: 'Part / Material', placeholder: 'e.g. Axis P3265-V Dome Camera', required: true, full: true },
      { key: 'qty', label: 'Quantity', placeholder: '1' },
      { key: 'urgency', label: 'Urgency', type: 'select', options: ['standard', 'rush', 'urgent'] },
      { key: 'job', label: 'Job / WO (optional)', placeholder: 'e.g. WO-2871' },
    ],
    onSubmit: (v) => {
      partsReqStore.set(prev => [{
        id: genId('REQ'), tech: meId, techName: me.name || 'Technician', status: 'requested',
        urgency: v.urgency || 'standard', job: v.job || '',
        parts: [{ name: v.item, sku: '', qty: Number(v.qty) || 1 }],
        submitted: 'just now', notes: 'Requested from the tech app',
      }, ...(prev || [])]);
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Parts Requests</div>
        <button onClick={newRequest} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Request</button>
      </div>

      {requests.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>No parts requests yet — truck auto-restocks and anything you request show up here.</div>}
      {requests.map((r, i) => (
        <GlassPanel key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{r.id}</span>
            <StatusBadge status={r.status === 'approved' ? 'info' : r.status === 'shipped' ? 'warning' : 'online'} label={r.status} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{r.item}</div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-low)' }}>
            <span>Qty: {r.qty}</span>
            <span>·</span>
            <span>{r.urgency}</span>
            <span>·</span>
            <span className="mono">{r.job}</span>
          </div>
          {r.tracking && (
            <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 4, background: 'rgba(63,169,245,0.04)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="package" size={12} color="var(--text-low)" />
              <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{r.tracking}</span>
            </div>
          )}
        </GlassPanel>
      ))}
    </div>
  );
}

/* ── Tech Assets View V2 (Mobile IT Glue — matches portal) ──
   REAL data: the same shared stores the portal Assets screen writes
   (assetStore / assetPwStore / assetDocStore / assetNetStore). No more
   fabricated devices, IPs, or — worst of all — fake device passwords. */
function TechAssetsView() {
  const [search, setSearch] = React.useState('');
  const [selectedAsset, setSelectedAsset] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('configs');
  const [filter, setFilter] = React.useState('all');
  const [revealed, setRevealed] = React.useState({});
  const [selectedCustomer, setSelectedCustomer] = React.useState('');
  const showToast = (m) => window.showToast(m, 'info');
  const docFileRef = React.useRef(null);

  const [allConfigs] = useShieldStore(assetStore);
  const [allPasswords, setAllPasswords] = useShieldStore(assetPwStore);
  const [allDocs, setAllDocs] = useShieldStore(assetDocStore);
  const [allNets, setAllNets] = useShieldStore(assetNetStore);

  const customers = [...new Set([
    ...(allConfigs || []).map(c => c.customer),
    ...(allPasswords || []).map(p => p.customer),
    ...(allDocs || []).map(d => d.customer),
    ...(allNets || []).map(n => n.customer),
  ].filter(Boolean))];
  const byCust = (rows) => (rows || []).filter(r => !selectedCustomer || r.customer === selectedCustomer);
  const configs = byCust(allConfigs);
  const passwords = byCust(allPasswords);
  const documents = byCust(allDocs);
  const networks = byCust(allNets);

  const addConfig = () => shieldModal({
    kind: 'form', title: 'New Configuration', submitLabel: 'Save & Sync',
    successMsg: 'Configuration saved — synced to the portal', fields: [
      { key: 'name', label: 'Device Name', placeholder: 'e.g. CAM-04 (Loading Dock)', required: true, full: true },
      { key: 'type', label: 'Type', type: 'select', options: ['IP Camera','NVR','Network Switch','Access Reader','Alarm Panel','Access Point','Other'] },
      { key: 'customer', label: 'Customer', placeholder: selectedCustomer || 'Customer name', required: !selectedCustomer },
      { key: 'mfg', label: 'Manufacturer', placeholder: 'e.g. Axis' },
      { key: 'model', label: 'Model', placeholder: 'e.g. P3265-V' },
      { key: 'serial', label: 'Serial', placeholder: 'Serial number' },
      { key: 'ip', label: 'IP Address', placeholder: 'e.g. 192.168.1.104' },
      { key: 'site', label: 'Site / Room', placeholder: 'e.g. Main Office / Lobby' },
      { key: 'notes', label: 'Notes', placeholder: 'Mount, cable, port…', full: true },
    ],
    onSubmit: (v) => {
      assetStore.set(list => [{
        id: genId('CFG'), status: 'online',
        customer: v.customer || selectedCustomer || '—',
        name: v.name, type: v.type || 'Other', mfg: v.mfg || '', model: v.model || '',
        serial: v.serial || '', ip: v.ip || '', mac: '', site: v.site || '', room: '',
        firmware: '', fwUpdate: false, mount: '', cable: '', switchPort: '', notes: v.notes || '',
      }, ...(list || [])]);
    },
  });
  const addPassword = () => shieldModal({
    kind: 'form', title: 'Add Password', submitLabel: 'Save & Sync',
    successMsg: 'Credential saved to the shared vault', fields: [
      { key: 'label', label: 'Label', placeholder: 'e.g. NVR Admin', required: true, full: true },
      { key: 'device', label: 'Device / System', placeholder: 'e.g. NVR-01' },
      { key: 'customer', label: 'Customer', placeholder: selectedCustomer || 'Customer name', required: !selectedCustomer },
      { key: 'username', label: 'Username', placeholder: 'admin' },
      { key: 'password', label: 'Password', placeholder: 'Enter password', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['Device','Customer','Remote','Service'] },
    ],
    onSubmit: (v) => {
      setAllPasswords(list => [{
        id: genId('PW'), customer: v.customer || selectedCustomer || '—',
        label: v.label, device: v.device || '', username: v.username || '',
        password: v.password, type: v.type || 'Device',
      }, ...(list || [])]);
    },
  });
  const addNetwork = () => shieldModal({
    kind: 'form', title: 'Add Network', submitLabel: 'Save & Sync',
    successMsg: 'Network documented — synced to the portal', fields: [
      { key: 'name', label: 'Network Name', placeholder: 'e.g. Security VLAN 20', required: true, full: true },
      { key: 'customer', label: 'Customer', placeholder: selectedCustomer || 'Customer name', required: !selectedCustomer },
      { key: 'subnet', label: 'Subnet', placeholder: 'e.g. 192.168.2.0/24' },
      { key: 'gw', label: 'Gateway', placeholder: 'e.g. 192.168.2.1' },
      { key: 'vlan', label: 'VLAN ID', placeholder: 'e.g. 20' },
      { key: 'type', label: 'Type', type: 'select', options: ['Wired','Wireless','VPN','VLAN'] },
    ],
    onSubmit: (v) => {
      setAllNets(list => [{
        id: genId('NET'), customer: v.customer || selectedCustomer || '—',
        name: v.name, subnet: v.subnet || '', gw: v.gw || '', vlan: v.vlan || '',
        devices: 0, type: v.type || 'Wired', notes: '',
      }, ...(list || [])]);
    },
  });
  const uploadDoc = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const st = window.__shieldStorage;
    if (!st) { showToast('Storage not configured'); return; }
    const r = await st.uploadFile(file, { folder: 'asset-docs', entity: 'asset-doc', entityId: selectedCustomer || 'general', shared: true });
    if (!r || !r.ok) { window.showToast('Upload failed: ' + ((r && r.error) || 'unknown'), 'warn'); return; }
    setAllDocs(list => [{
      id: genId('DOC'), customer: selectedCustomer || '—', name: file.name,
      type: 'Document', size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), url: r.url,
    }, ...(list || [])]);
    window.showToast('Document uploaded — synced to the portal', 'ok');
  };

  const typeIcons = { 'IP Camera': 'cam-dome', 'NVR': 'nvr-box', 'Access Reader': 'reader', 'Network Switch': 'switch-ports', 'Alarm Panel': 'alarm-panel', 'Access Point': 'ap-ceiling' };
  const typeColors = { 'IP Camera': 'var(--brand)', 'NVR': 'var(--status-ok)', 'Access Reader': '#c084fc', 'Network Switch': 'var(--status-ok)', 'Alarm Panel': 'var(--status-warn)', 'Access Point': '#a78bfa' };
  const types = ['all', ...new Set(configs.map(a => a.type))];
  const filtered = configs.filter(a => { if (filter !== 'all' && a.type !== filter) return false; if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.ip.includes(search)) return false; return true; });
  const tabs = [{id:'configs',l:'Configs',c:configs.length},{id:'passwords',l:'Passwords',c:passwords.length},{id:'docs',l:'Docs',c:documents.length},{id:'networks',l:'Networks',c:networks.length},{id:'topology',l:'Topology',c:''}];

  if (selectedAsset) { const a = selectedAsset; return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={() => setSelectedAsset(null)} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="chevron-right" size={12} color="var(--brand)" style={{ transform: 'rotate(180deg)' }} /> Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: (typeColors[a.type]||'var(--brand)')+'15', border: '1px solid '+(typeColors[a.type]||'var(--brand)')+'30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={typeIcons[a.type]||'cam-dome'} size={20} color={typeColors[a.type]||'var(--brand)'} /></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 500 }}>{a.name}</div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>{a.mfg} {a.model} · {a.room}</div></div>
        <StatusDot status={a.status==='online'?'online':'warning'} size={10} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {a.ip && <button onClick={() => window.open('http://' + a.ip, '_blank')} className="glass" style={{ flex: 1, padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="link" size={12} color="var(--brand)" /> Web UI</button>}
        {a.ip && <button onClick={() => { navigator.clipboard?.writeText?.(a.ip); showToast('IP copied'); }} className="glass" style={{ flex: 1, padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="topology" size={12} color="var(--text-mid)" /> Copy IP</button>}
      </div>
      <GlassPanel style={{ padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="info" size={12} color="var(--text-low)" /><span className="label-sm">IDENTITY</span></div>
        {[{l:'ID',v:a.id},{l:'Type',v:a.type},{l:'Mfg',v:a.mfg},{l:'Model',v:a.model},{l:'Serial',v:a.serial},{l:'MAC',v:a.mac||'—'}].map((f,i) => (<div key={i} onClick={() => {if(f.v!=='—'){navigator.clipboard?.writeText?.(f.v);showToast('Copied');}}} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: f.v!=='—'?'pointer':'default' }}><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{f.l}</span><span className="mono" style={{ fontSize: 12, color: 'var(--text-mid)' }}>{f.v}</span></div>))}
      </GlassPanel>
      {a.ip && <GlassPanel style={{ padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="topology" size={12} color="var(--text-low)" /><span className="label-sm">NETWORK</span></div>
        {[{l:'IP',v:a.ip},{l:'Firmware',v:a.firmware}].map((f,i) => (<div key={i} onClick={() => {navigator.clipboard?.writeText?.(f.v);showToast('Copied');}} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer' }}><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{f.l}</span><span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{f.v}</span></div>))}
        {a.fwUpdate && <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 11, color: 'var(--status-warn)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="warning-tri" size={12} color="var(--status-warn)" /> Firmware update available</div>}
      </GlassPanel>}
      <GlassPanel style={{ padding: 12, borderLeft: '3px solid var(--status-warn)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="access-control" size={12} color="var(--status-warn)" /><span className="label-sm" style={{ color: 'var(--status-warn)' }}>CREDENTIALS</span></div>
        {passwords.filter(p => {
          // Only credentials with a real device match — an empty device string
          // must never match every asset and leak the whole vault.
          const dev = String(p.device || '').trim();
          if (!dev) return false;
          const tok = dev.split(' ')[0];
          return dev === a.name || (tok && a.name.includes(tok)) || (a.mfg && dev.includes(a.mfg));
        }).map((p,i) => (<div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{p.label}</span><span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.username}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="mono" style={{ fontSize: 12, flex: 1, color: revealed[p.id]?'var(--text-high)':'var(--text-low)', letterSpacing: revealed[p.id]?0:'0.1em' }}>{revealed[p.id]?p.password:'••••••••'}</span>
            <button onClick={() => setRevealed(r => ({...r,[p.id]:!r[p.id]}))} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{revealed[p.id]?'Hide':'Show'}</button>
            <button onClick={() => {navigator.clipboard?.writeText?.(p.password);showToast('Copied');}} style={{ padding: '2px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Copy</button></div></div>))}
      </GlassPanel>
      <GlassPanel style={{ padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="wrench" size={12} color="var(--text-low)" /><span className="label-sm">INSTALLATION</span></div>
        {[{l:'Mount',v:a.mount},{l:'Cable',v:a.cable},{l:'Switch/Port',v:a.switchPort||'—'},{l:'Location',v:a.site+' / '+a.room}].map((f,i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{f.l}</span><span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{f.v}</span></div>))}
      </GlassPanel>
      {a.notes && <GlassPanel style={{ padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Icon name="note" size={12} color="var(--text-low)" /><span className="label-sm">NOTES</span></div><p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, margin: 0 }}>{a.notes}</p></GlassPanel>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => shieldModal({ kind: 'editor', title: `Add note — ${a.name}`, placeholder: 'Note for this device…', submitLabel: 'Save Note', successMsg: 'Note saved — synced to the portal', onSubmit: (txt) => {
          if (!txt || !txt.trim()) return;
          assetStore.set(list => (list || []).map(x => x.id === a.id ? { ...x, notes: (x.notes ? x.notes + '\n' : '') + txt.trim() } : x));
          setSelectedAsset(prev => prev ? { ...prev, notes: (prev.notes ? prev.notes + '\n' : '') + txt.trim() } : prev);
        } })} style={{ flex: 1, padding: '10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="note" size={12} color="var(--brand)" /> Add Note</button>
        <button onClick={() => {
          assetStore.set(list => (list || []).map(x => x.id === a.id ? { ...x, status: 'flagged' } : x));
          setSelectedAsset(prev => prev ? { ...prev, status: 'flagged' } : prev);
          window.showToast('Flagged for the office — visible on the portal Assets screen', 'warn');
        }} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--status-warn)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="flag" size={12} color="var(--status-warn)" /> Flag Issue</button>
      </div>
    </div>); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', fontWeight: 500 }}>
        <option value="">All customers</option>
        {customers.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input ref={docFileRef} type="file" style={{ display: 'none' }} onChange={uploadDoc} />
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: activeTab===t.id?600:400, background: activeTab===t.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: activeTab===t.id?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>{t.l}<span className="mono" style={{ fontSize: 9, opacity: 0.6 }}>{t.c}</span></button>))}
      </div>
      {activeTab === 'configs' && (<>
        <div style={{ display: 'flex', gap: 6 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, IP, serial..." style={{ flex: 1, padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={addConfig} style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--brand)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
      </div>
      
        <div style={{ display: 'flex', gap: 4, overflow: 'auto', paddingBottom: 2 }}>
          {types.map(t => (<button key={t} onClick={() => setFilter(t)} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 10, whiteSpace: 'nowrap', background: filter===t?'rgba(63,169,245,0.12)':'transparent', border: '1px solid '+(filter===t?'var(--brand)':'var(--border-subtle)'), color: filter===t?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t==='all'?'All':t}</button>))}
        </div>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>No configurations documented yet — add devices with ＋ and they sync to the portal Assets screen.</div>}
        {filtered.map(a => (<button key={a.id} onClick={() => setSelectedAsset(a)} className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer', borderRadius: 10, textAlign: 'left', fontFamily: 'var(--font-body)', width: '100%' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: (typeColors[a.type]||'var(--brand)')+'15', border: '1px solid '+(typeColors[a.type]||'var(--brand)')+'30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={typeIcons[a.type]||'cam-dome'} size={18} color={typeColors[a.type]||'var(--brand)'} /></div>
          <div style={{ flex: 1, overflow: 'hidden' }}><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{a.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.mfg} {a.model}</div>{a.ip && <div className="mono" style={{ fontSize: 10, color: 'var(--brand)', marginTop: 1 }}>{a.ip}</div>}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}><StatusDot status={a.status==='online'?'online':'warning'} size={7} />{a.fwUpdate && <Icon name="warning-tri" size={10} color="var(--status-warn)" />}</div>
        </button>))}
      </>)}
      {activeTab === 'passwords' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={addPassword} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="add" size={14} color="var(--brand)" /> Add Password</button>
        {passwords.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>Vault is empty — credentials you add sync to the portal vault.</div>}
        {passwords.map(p => (<GlassPanel key={p.id} style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><div><div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.device} · {p.type}</div></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 60 }}>{p.username}</span>
            <span className="mono" style={{ fontSize: 12, flex: 1, color: revealed[p.id]?'var(--text-high)':'var(--text-low)', letterSpacing: revealed[p.id]?0:'0.1em' }}>{revealed[p.id]?p.password:'••••••••'}</span>
            <button onClick={() => setRevealed(r => ({...r,[p.id]:!r[p.id]}))} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{revealed[p.id]?'Hide':'Show'}</button>
            <button onClick={() => {navigator.clipboard?.writeText?.(p.password);showToast('Copied');}} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Copy</button>
          </div></GlassPanel>))}
      </div>)}
      {activeTab === 'docs' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => docFileRef.current && docFileRef.current.click()} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="add" size={14} color="var(--brand)" /> Upload Document</button>
        {documents.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>No documents yet.</div>}
        {documents.map((d,i) => (<button key={i} onClick={() => { if (!d.url) { showToast('No file attached'); return; } (window.__shieldFileUrl ? window.__shieldFileUrl(d.url) : Promise.resolve(d.url)).then(u => window.open(u, '_blank')); }} className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer', borderRadius: 10, textAlign: 'left', fontFamily: 'var(--font-body)', width: '100%' }}>
          <Icon name="proposals" size={18} color="var(--brand)" />
          <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{d.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{d.type} · {d.size} · {d.date}</div></div>
          <Icon name="chevron-right" size={12} color="var(--text-low)" />
        </button>))}
      </div>)}
      {activeTab === 'topology' && (<MobileTopologyView configs={configs} networks={networks} showToast={showToast} />)}
      {activeTab === 'networks' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={addNetwork} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="add" size={14} color="var(--brand)" /> Add Network</button>
        {networks.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>No networks documented yet.</div>}
        {networks.map((n,i) => (<GlassPanel key={i} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon name="topology" size={16} color="var(--brand)" /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{n.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{n.type} · {n.devices} devices</div></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[{l:'Subnet',v:n.subnet},{l:'Gateway',v:n.gw}].map((f,j) => (<div key={j} onClick={() => {navigator.clipboard?.writeText?.(f.v);showToast('Copied');}} style={{ cursor: 'pointer' }}><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>{f.l}</div><div className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{f.v}</div></div>))}
          </div></GlassPanel>))}
      </div>)}
    </div>
  );
}


/* ── Mobile Topology — honest view built from the documented assets ──
   Rows come from the same shared stores the portal Assets screen writes
   (assetStore / assetNetStore). No fabricated devices, IPs, or actions. */
function MobileTopologyView({ configs = [], networks = [], showToast }) {
  const typeIcons = { 'IP Camera': 'cam-dome', 'NVR': 'nvr-box', 'Access Reader': 'reader', 'Network Switch': 'switch-ports', 'Alarm Panel': 'alarm-panel', 'Access Point': 'ap-ceiling' };
  const typeColors = { 'IP Camera': 'var(--brand)', 'NVR': 'var(--status-ok)', 'Access Reader': '#c084fc', 'Network Switch': 'var(--status-ok)', 'Alarm Panel': 'var(--status-warn)', 'Access Point': '#a78bfa' };
  const netDevices = (configs || []).filter(d => d.ip);
  const onlineCount = netDevices.filter(d => d.status === 'online').length;

  if (!networks.length && !netDevices.length) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 10, lineHeight: 1.6 }}>
        No network data recorded for this site yet.<br />
        Networks and devices documented under the Networks and Configs tabs appear here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Summary strip — counts from the real documented records */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[{l:'Networks',v:networks.length,c:'var(--brand)'},{l:'Devices',v:netDevices.length,c:'var(--brand)'},{l:'Online',v:onlineCount,c:'var(--status-ok)'}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '5px 6px', textAlign: 'center', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 7, color: 'var(--text-low)', textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {networks.map((n,i) => (
        <GlassPanel key={n.id || i} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="topology" size={16} color="var(--brand)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{n.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{n.type}{n.vlan ? ` · VLAN ${n.vlan}` : ''}{n.customer ? ` · ${n.customer}` : ''}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[{l:'Subnet',v:n.subnet},{l:'Gateway',v:n.gw}].filter(f => f.v).map((f,j) => (
              <div key={j} onClick={() => {navigator.clipboard?.writeText?.(f.v);showToast('Copied');}} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>{f.l}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{f.v}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ))}

      {netDevices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="label-sm" style={{ margin: '4px 0 2px' }}>DEVICES ON THE NETWORK</div>
          {netDevices.map(d => {
            const color = typeColors[d.type] || 'var(--brand)';
            return (
              <div key={d.id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: color+'15', border: '1px solid '+color+'30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={typeIcons[d.type]||'topology'} size={16} color={color} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{d.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', display: 'flex', gap: 6 }}>
                    <span>{[d.mfg, d.model].filter(Boolean).join(' ') || d.type}</span>
                    <span className="mono" style={{ color: 'var(--brand)' }}>{d.ip}</span>
                  </div>
                </div>
                <button onClick={() => {navigator.clipboard?.writeText?.(d.ip);showToast('IP copied');}} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Copy IP</button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 9, color: 'var(--text-low)' }}>Built from documented configs and networks — live ping/status isn't wired up yet.</div>
    </div>
  );
}


Object.assign(window, { TimeViewV2, ExpenseView, VehicleInspectionView, PartsRequestView, TechAssetsView, MobileTopologyView });

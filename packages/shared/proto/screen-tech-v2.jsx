/* Technician App v2 — Clockify-style Time, Expenses, Vehicle Inspection, Parts */

/* ── Enhanced Time View (Clockify-style) ── */
function TimeViewV2() {
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [activeProject, setActiveProject] = React.useState('General');
  const [activeTask, setActiveTask] = React.useState('Installation');
  const [liveEntries, setLiveEntries] = React.useState([]);
  const [gps, setGps] = React.useState('\u2014');
  const refreshEntries = React.useCallback(() => {
    const t = window.__shieldTime;
    if (t) t.myEntries().then(r => { if (r.ok) setLiveEntries(r.data || []); });
  }, []);
  React.useEffect(() => { refreshEntries(); }, [refreshEntries]);
  React.useEffect(() => {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos => setGps(`${pos.coords.latitude.toFixed(4)}\u00b0, ${pos.coords.longitude.toFixed(4)}\u00b0`),
      () => {}, { timeout: 4000 });
  }, []);
  const [viewMode, setViewMode] = React.useState('today'); // today | week | pay-period
  const [manualEntryOpen, setManualEntryOpen] = React.useState(false);
  const [manualEntry, setManualEntry] = React.useState({ project: 'General', task: 'Installation', date: new Date().toISOString().slice(0, 10), startTime: '08:00', endTime: '12:00', billable: true, notes: '' });
  const [toast, setToast] = React.useState(null);
  const [activeTag, setActiveTag] = React.useState('on-site');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const todayEntries = [
    { project: 'Acme Dental', task: 'NVR Cable Re-termination', start: '8:00 AM', end: '9:45 AM', dur: 6300, billable: true, type: 'work', tags: ['repair','on-site'] },
    { project: 'Travel', task: 'Acme → Metro Bank', start: '9:45 AM', end: '10:15 AM', dur: 1800, billable: false, type: 'drive', tags: ['travel'] },
    { project: 'Metro Bank', task: 'Camera Cleaning', start: '10:30 AM', end: '—', dur: elapsed, billable: true, type: 'work', tags: ['pm','on-site'], active: true },
  ];

  const monday = (() => { const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return d; })();
  const dayLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekData = ['Mon','Tue','Wed','Thu','Fri'].map((day, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayEntries = liveEntries.filter(e => e.work_date === key);
    const work = dayEntries.filter(e => e.job_ref !== 'Travel').reduce((s2, e) => s2 + Number(e.hours), 0);
    const drive = dayEntries.filter(e => e.job_ref === 'Travel').reduce((s2, e) => s2 + Number(e.hours), 0);
    const break_ = dayEntries.reduce((s2, e) => s2 + (e.break_minutes || 0), 0) / 60;
    return { day, date: dayLabel(d), work: +work.toFixed(1), drive: +drive.toFixed(1), break_: +break_.toFixed(1), total: +(work + drive).toFixed(1) };
  });
  const weekLabel = `Week of ${dayLabel(monday)} \u2014 ${dayLabel(new Date(monday.getTime() + 4 * 86400000))}`;

  const projects = ['General','Travel','Admin','Training'];
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

        {/* Project / Task selector */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
          <select value={activeProject} onChange={e => setActiveProject(e.target.value)} style={{
            padding: '5px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none'
          }}>
            {projects.map(p => <option key={p} value={p} style={{ background: 'var(--card)' }}>{p}</option>)}
          </select>
          <select value={activeTask} onChange={e => setActiveTask(e.target.value)} style={{
            padding: '5px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none'
          }}>
            {(tasks[activeProject] || tasks.default).map(t => <option key={t} value={t} style={{ background: 'var(--card)' }}>{t}</option>)}
          </select>
        </div>

        {/* Billable toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-mid)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} /> Billable
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
          <button onClick={() => setRunning(!running)} style={{
            width: 56, height: 56, borderRadius: '50%',
            background: running ? 'rgba(244,63,94,0.12)' : 'rgba(52,211,153,0.12)',
            border: `2px solid ${running ? 'var(--status-critical)' : 'var(--status-ok)'}`,
            color: running ? 'var(--status-critical)' : 'var(--status-ok)',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: running ? '0 0 16px -4px rgba(244,63,94,0.2)' : '0 0 16px -4px rgba(52,211,153,0.2)'
          }}>{running ? '⏸' : '▶'}</button>
          {running && (
            <button onClick={() => {
              const hrs = elapsed / 3600;
              setRunning(false); setElapsed(0);
              if (hrs > 0.01 && window.__shieldTime) {
                window.__shieldTime.submitHours({ workDate: new Date().toISOString().slice(0, 10), hours: hrs, jobRef: activeProject, notes: activeTask })
                  .then(r => { showToast(r.ok ? `Logged ${hrs.toFixed(2)}h \u2014 sent for approval` : (r.error || 'Could not save entry')); refreshEntries(); });
              }
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
          <StatusDot status="online" size={4} pulse />
          GPS: 37.7749° N, 122.4194° W
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
            <span>{(todayEntries.reduce((s, e) => s + e.dur, 0) / 3600).toFixed(1)}h total</span>
          </div>
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
                    <span key={t} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(63,169,245,0.06)', color: 'var(--text-low)', textTransform: 'uppercase' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: e.active ? 'var(--brand)' : 'var(--text-mid)' }}>
                  {e.active ? fmt(e.dur) : `${Math.floor(e.dur/3600)}h ${Math.floor((e.dur%3600)/60)}m`}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.start} — {e.end}</div>
              </div>
              {e.billable && <span style={{ fontSize: 9, color: 'var(--status-ok)', fontWeight: 700 }}>$</span>}
            </div>
          ))}
        </div>
      )}

      {/* Weekly Timesheet Grid */}
      {viewMode === 'week' && (
        <GlassPanel style={{ padding: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Week of Jun 2 — Jun 6</span>
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
              const n = weekData.reduce((s2, d) => s2 + d.total, 0);
              shieldToast(n > 0 ? `Timesheet submitted for approval \u2014 ${n.toFixed(1)}h this week` : 'No hours logged this week yet', n > 0 ? 'ok' : 'info');
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
              <div style={{ fontSize: 13, fontWeight: 500 }}>Pay Period: May 26 — Jun 8</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Bi-weekly · 10 working days</div>
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

      {/* Manual Time Entry Modal */}
      {manualEntryOpen && (
        <div onClick={() => setManualEntryOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 380, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fade-up 0.15s ease both' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Manual Time Entry</span>
              <button onClick={() => setManualEntryOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Project</div>
                <select value={manualEntry.project} onChange={e => setManualEntry(prev => ({...prev, project: e.target.value}))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>
                  {projects.map(p => <option key={p} value={p}>{p}</option>)}
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
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Notes (optional)</div>
                <textarea value={manualEntry.notes} onChange={e => setManualEntry(prev => ({...prev, notes: e.target.value}))} placeholder="What did you work on?" rows={2} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setManualEntryOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { showToast(`Time entry added: ${manualEntry.project} — ${manualEntry.task}`); setManualEntryOpen(false); }} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Expense Submission ── */
function ExpenseView() {
  const [showForm, setShowForm] = React.useState(false);
  const [expenseType, setExpenseType] = React.useState('receipt');

  const expenses = [
    { id: 'EXP-042', date: 'Jun 5', type: 'Materials', desc: 'Cat6A patch cables (10-pack)', amount: 48.50, status: 'pending', job: 'J-4202', receipt: true },
    { id: 'EXP-041', date: 'Jun 4', type: 'Mileage', desc: '42.6 mi — 3 site visits', amount: 29.82, status: 'approved', job: '—', receipt: false, miles: 42.6, rate: 0.70 },
    { id: 'EXP-040', date: 'Jun 3', type: 'Meals', desc: 'Lunch — on-site Metro Bank', amount: 18.50, status: 'approved', job: 'J-4198', receipt: true },
    { id: 'EXP-039', date: 'Jun 2', type: 'Materials', desc: 'Conduit adapters + J-box', amount: 34.20, status: 'approved', job: 'J-4195', receipt: true },
    { id: 'EXP-038', date: 'Jun 1', type: 'Parking', desc: 'Downtown garage — City Hall', amount: 22.00, status: 'rejected', job: 'J-4192', receipt: true, rejectReason: 'Use company parking pass instead' },
    { id: 'EXP-037', date: 'May 30', type: 'Tools', desc: 'RJ45 crimp tool replacement', amount: 89.99, status: 'approved', job: '—', receipt: true },
  ];

  const statusColors = { pending: 'var(--status-warn)', approved: 'var(--status-ok)', rejected: 'var(--status-critical)' };
  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="glass" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-high)' }}>${monthTotal.toFixed(2)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>This Month</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-warn)' }}>${pendingTotal.toFixed(2)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Pending</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-ok)' }}>${(monthTotal - pendingTotal - 22).toFixed(2)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Approved</div>
        </div>
      </div>

      {/* Quick submit buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: 'Receipt', iconName: 'receipt', type: 'receipt' },
          { label: 'Mileage', iconName: 'mileage', type: 'mileage' },
          { label: 'Per Diem', iconName: 'perdiem', type: 'perdiem' },
          { label: 'Parts', iconName: 'parts', type: 'parts' },
        ].map(btn => (
          <button key={btn.type} onClick={() => { setExpenseType(btn.type); setShowForm(true); }} style={{
            flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, background: 'rgba(63,169,245,0.04)',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            color: 'var(--text-high)', fontSize: 11, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.15s'
          }}>
            <Icon name={btn.iconName} size={18} color="var(--brand)" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Expense Form */}
      {showForm && (
        <GlassPanel style={{ borderLeft: '3px solid var(--brand)', animation: 'fade-up 0.3s ease both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>New Expense — {expenseType === 'receipt' ? 'Receipt' : expenseType === 'mileage' ? 'Mileage' : expenseType === 'perdiem' ? 'Per Diem' : 'Parts'}</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expenseType === 'mileage' ? (
              <>
                <div>
                  <div className="label-sm" style={{ marginBottom: 4 }}>MILES DRIVEN</div>
                  <input type="number" placeholder="0.0" defaultValue="42.6" style={{ width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(63,169,245,0.04)', borderRadius: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Rate: <span className="mono">$0.70/mi</span> · Estimated: <span className="mono" style={{ color: 'var(--brand)' }}>$29.82</span></span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="label-sm" style={{ marginBottom: 4 }}>AMOUNT</div>
                  <input type="number" placeholder="$0.00" style={{ width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
              </>
            )}
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>DESCRIPTION</div>
              <input placeholder="What was this for?" style={{ width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>JOB (OPTIONAL)</div>
              <select style={{ width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>
                <option style={{ background: 'var(--card)' }}>— Select job —</option>
                <option style={{ background: 'var(--card)' }}>J-4202 · Metro Bank PM</option>
                <option style={{ background: 'var(--card)' }}>J-4203 · Harbor View Install</option>
              </select>
            </div>
            {expenseType !== 'mileage' && (
              <div style={{ padding: 20, borderRadius: 8, border: '1px dashed var(--border-subtle)', textAlign: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 24, opacity: 0.3 }}>◉</span>
                <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 4 }}>Tap to capture receipt photo</div>
              </div>
            )}
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>Submit Expense</button>
          </div>
        </GlassPanel>
      )}

      {/* Expense List */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>RECENT EXPENSES</div>
        {expenses.map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0',
            borderBottom: '1px solid rgba(63,169,245,0.05)'
          }}>
            <div style={{
              width: 4, height: 28, borderRadius: 2,
              background: statusColors[e.status]
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{e.desc}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.date}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>·</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.type}</span>
                {e.job !== '—' && <><span style={{ fontSize: 10, color: 'var(--text-low)' }}>·</span><span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{e.job}</span></>}
              </div>
              {e.rejectReason && <div style={{ fontSize: 10, color: 'var(--status-critical)', marginTop: 2 }}>Rejected: {e.rejectReason}</div>}
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>${e.amount.toFixed(2)}</span>
            {e.receipt && <Icon name="receipt" size={12} color="var(--text-low)" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vehicle Inspection ── */
function VehicleInspectionView() {
  const [checks, setChecks] = React.useState([
    { cat: 'Exterior', items: [
      { label: 'Body damage — none', done: true },
      { label: 'Tires — adequate tread', done: true },
      { label: 'Lights — all working', done: false },
      { label: 'Ladder rack — secure', done: false },
    ]},
    { cat: 'Interior', items: [
      { label: 'Mirrors adjusted', done: true },
      { label: 'Seat belt functional', done: true },
      { label: 'Dash warning lights — none', done: false },
      { label: 'Fire extinguisher present', done: false },
    ]},
    { cat: 'Truck Stock', items: [
      { label: 'Tool bag — complete', done: true },
      { label: 'Drill / impact driver', done: true },
      { label: 'Cable tester', done: false },
      { label: 'Laptop + charger', done: false },
      { label: 'PPE — hard hat, safety vest', done: false },
    ]},
  ]);

  const totalItems = checks.reduce((s, c) => s + c.items.length, 0);
  const doneItems = checks.reduce((s, c) => s + c.items.filter(i => i.done).length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Daily Vehicle Inspection</div>
          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Vehicle V-12 · Jun 5, 2026 · Pre-trip</div>
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
        <textarea placeholder="Describe the issue (flat tire, missing tool, vehicle damage)…" rows={3} style={{ width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => shieldToast('Camera opened — attach a photo')} style={{ padding: '8px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>◉ Photo</button>
          <button onClick={() => shieldToast('Issue report submitted to dispatch', 'warn')} style={{ flex: 1, padding: '8px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, color: 'var(--status-warn)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Submit Issue Report</button>
        </div>
      </GlassPanel>

      <button onClick={() => doneItems === totalItems && shieldToast('Inspection submitted', 'ok')} style={{
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

/* ── Parts Request ── */
function PartsRequestView() {
  const requests = [
    { id: 'PR-108', item: 'Axis P3265-V Dome Camera', qty: 2, urgency: 'standard', status: 'approved', date: 'Jun 4', job: 'J-4203' },
    { id: 'PR-107', item: 'Cat6A Patch Cables (25-pack)', qty: 1, urgency: 'rush', status: 'shipped', date: 'Jun 3', job: 'J-4202', tracking: 'UPS 1Z999AA10' },
    { id: 'PR-106', item: 'Conduit fittings assorted', qty: 1, urgency: 'standard', status: 'delivered', date: 'Jun 1', job: 'J-4195' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Parts Requests</div>
        <button onClick={() => shieldToast('New parts request — opening form', 'info')} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Request</button>
      </div>

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

/* ── Tech Assets View V2 (Mobile IT Glue — matches portal) ── */
function TechAssetsView() {
  const [search, setSearch] = React.useState('');
  const [selectedAsset, setSelectedAsset] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('configs');
  const [filter, setFilter] = React.useState('all');
  const [revealed, setRevealed] = React.useState({});
  const [toast, setToast] = React.useState(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState('Metro Bank');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const [addConfigOpen, setAddConfigOpen] = React.useState(false);
  const [addPasswordOpen, setAddPasswordOpen] = React.useState(false);
  const [addDocOpen, setAddDocOpen] = React.useState(false);
  const [addNetworkOpen, setAddNetworkOpen] = React.useState(false);

  const customers = ['Metro Bank', 'Acme Dental', 'City Hall', 'Harbor View'];

  const configs = [
    { id: 'CFG-001', name: 'CAM-01 (Lobby)', type: 'IP Camera', mfg: 'Axis', model: 'P3265-V', ip: '192.168.1.101', mac: 'AC:CC:8E:F0:12:34', serial: 'ACCC8EF01234', status: 'online', site: 'Main Office', room: 'Lobby', firmware: '11.8.64', fwUpdate: true, mount: '10ft ceiling', cable: 'Cat6A', switchPort: 'SW-01 Port 3', notes: 'Covers main entrance + ATM area' },
    { id: 'CFG-002', name: 'CAM-02 (Parking N)', type: 'IP Camera', mfg: 'Axis', model: 'P3265-V', ip: '192.168.1.102', mac: 'AC:CC:8E:F0:12:35', serial: 'ACCC8EF01235', status: 'online', site: 'Main Office', room: 'Parking N', firmware: '11.8.64', fwUpdate: false, mount: '15ft pole', cable: 'Cat6A', switchPort: 'SW-01 Port 4', notes: '' },
    { id: 'CFG-003', name: 'NVR-01', type: 'NVR', mfg: 'Hanwha', model: 'XNR-6410', ip: '192.168.1.100', mac: '00:09:18:A0:12:34', serial: 'HWV2605001234', status: 'online', site: 'Main Office', room: 'Server Room', firmware: '2.01.04', fwUpdate: true, mount: 'Rack U4', cable: 'Cat6A', switchPort: 'SW-01 Port 1', notes: '8TB RAID5, 30-day retention' },
    { id: 'CFG-004', name: 'RDR-01 (Front Door)', type: 'Access Reader', mfg: 'HID', model: 'iCLASS SE RK40', ip: '', mac: '', serial: 'HID8820001234', status: 'online', site: 'Main Office', room: 'Main Entrance', firmware: 'R3.4', fwUpdate: false, mount: '48in AFF', cable: '18/4 + 22/6', switchPort: '', notes: 'Wiegand to VertX V1000' },
    { id: 'CFG-005', name: 'SW-01 (IDF)', type: 'Network Switch', mfg: 'Cisco', model: 'CBS350-24P', ip: '192.168.1.2', mac: '00:1A:2B:3C:4D:5E', serial: 'FCW12345678', status: 'online', site: 'Main Office', room: 'Server Room', firmware: '3.2.0.84', fwUpdate: false, mount: 'Rack U10', cable: 'Cat6A', switchPort: 'Core Port 24', notes: '24-port PoE+, 370W budget' },
    { id: 'CFG-006', name: 'Panel-01 (Alarm)', type: 'Alarm Panel', mfg: 'DSC', model: 'PowerSeries Neo', ip: '', mac: '', serial: 'DSC7801234567', status: 'online', site: 'Main Office', room: 'Utility Room', firmware: '1.40', fwUpdate: false, mount: 'Wall 60in', cable: '22/4 + 18/4', switchPort: '', notes: '52 zones. CS acct: MB-20250' },
    { id: 'CFG-007', name: 'AP-01 (Lobby)', type: 'Access Point', mfg: 'Ubiquiti', model: 'U6-Pro', ip: '192.168.1.50', mac: 'FC:EC:DA:12:56:78', serial: 'FECDA1256789', status: 'online', site: 'Main Office', room: 'Lobby', firmware: '6.6.55', fwUpdate: false, mount: 'Ceiling', cable: 'Cat6A', switchPort: 'SW-01 Port 20', notes: '5 GHz, 12 clients' },
  ];

  const passwords = [
    { id: 'PW-001', label: 'NVR Admin', device: 'NVR-01', username: 'admin', password: 'Nvr@Metr0!2025', type: 'Device' },
    { id: 'PW-002', label: 'Camera Admin', device: 'All Axis', username: 'admin', password: 'X#k9$mP2!qR7', type: 'Device' },
    { id: 'PW-003', label: 'Switch Admin', device: 'SW-01', username: 'admin', password: 'C!sc0-Sw#2025', type: 'Device' },
    { id: 'PW-004', label: 'Alarm Installer', device: 'Panel-01', username: 'installer', password: '5555', type: 'Device' },
    { id: 'PW-005', label: 'Alarm Master', device: 'Panel-01', username: 'customer', password: '1234', type: 'Customer' },
    { id: 'PW-006', label: 'WiFi Admin', device: 'AP-01', username: 'admin', password: 'Ub!qu1t1_2025', type: 'Device' },
    { id: 'PW-007', label: 'VPN Access', device: 'Firewall', username: 'shieldtech', password: 'Vpn$ecure!2025', type: 'Remote' },
  ];

  const documents = [
    { name: 'Floor Plan (PDF)', type: 'Floor Plan', size: '2.4 MB', date: 'May 15' },
    { name: 'Camera Placement Drawing', type: 'Design', size: '1.8 MB', date: 'May 20' },
    { name: 'Alarm Zone List', type: 'Programming', size: '45 KB', date: 'Apr 3' },
    { name: 'Access Control Door Schedule', type: 'Programming', size: '62 KB', date: 'Apr 3' },
    { name: 'As-Built Network Diagram', type: 'Network', size: '890 KB', date: 'Mar 15' },
    { name: 'Service Agreement', type: 'Contract', size: '120 KB', date: 'Jan 10' },
  ];

  const networks = [
    { name: 'Security VLAN 10', subnet: '192.168.1.0/24', gw: '192.168.1.1', devices: 12, type: 'Wired' },
    { name: 'Guest WiFi', subnet: '10.10.10.0/24', gw: '10.10.10.1', devices: 0, type: 'Wireless' },
    { name: 'Corp Network', subnet: '172.16.0.0/16', gw: '172.16.0.1', devices: 45, type: 'Wired' },
  ];

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
        {a.ip && <button onClick={() => showToast('Opening web UI...')} className="glass" style={{ flex: 1, padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="link" size={12} color="var(--brand)" /> Web UI</button>}
        <button onClick={() => showToast('Ping: 2ms')} className="glass" style={{ flex: 1, padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="topology" size={12} color="var(--text-mid)" /> Ping</button>
        <button onClick={() => showToast('Photo captured')} className="glass" style={{ flex: 1, padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="photo" size={12} color="var(--text-mid)" /> Photo</button>
      </div>
      <GlassPanel style={{ padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="info" size={12} color="var(--text-low)" /><span className="label-sm">IDENTITY</span></div>
        {[{l:'ID',v:a.id},{l:'Type',v:a.type},{l:'Mfg',v:a.mfg},{l:'Model',v:a.model},{l:'Serial',v:a.serial},{l:'MAC',v:a.mac||'—'}].map((f,i) => (<div key={i} onClick={() => {if(f.v!=='—'){navigator.clipboard?.writeText?.(f.v);showToast('Copied');}}} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: f.v!=='—'?'pointer':'default' }}><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{f.l}</span><span className="mono" style={{ fontSize: 12, color: 'var(--text-mid)' }}>{f.v}</span></div>))}
      </GlassPanel>
      {a.ip && <GlassPanel style={{ padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="topology" size={12} color="var(--text-low)" /><span className="label-sm">NETWORK</span></div>
        {[{l:'IP',v:a.ip},{l:'Firmware',v:a.firmware}].map((f,i) => (<div key={i} onClick={() => {navigator.clipboard?.writeText?.(f.v);showToast('Copied');}} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer' }}><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{f.l}</span><span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{f.v}</span></div>))}
        {a.fwUpdate && <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 11, color: 'var(--status-warn)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="warning-tri" size={12} color="var(--status-warn)" /> Firmware update available</div>}
      </GlassPanel>}
      <GlassPanel style={{ padding: 12, borderLeft: '3px solid var(--status-warn)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="access-control" size={12} color="var(--status-warn)" /><span className="label-sm" style={{ color: 'var(--status-warn)' }}>CREDENTIALS</span></div>
        {passwords.filter(p => a.name.includes(p.device.split(' ')[0]) || (p.device.includes('Axis') && a.mfg==='Axis') || p.device === a.name).map((p,i) => (<div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
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
        <button onClick={() => showToast('Note added')} style={{ flex: 1, padding: '10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="note" size={12} color="var(--brand)" /> Add Note</button>
        <button onClick={() => showToast('Flagged')} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--status-warn)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="flag" size={12} color="var(--status-warn)" /> Flag Issue</button>
      </div>
      {/* ── Add Config Modal ── */}
      {addConfigOpen && (<div onClick={() => setAddConfigOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, maxHeight: '85vh', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '16px 16px 0 0', overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>New Configuration</span>
            <button onClick={() => setAddConfigOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="topology" size={12} color="var(--brand)" /> Syncs to ShieldTech Portal in real-time</div>
            {[{l:'Device Name',p:'e.g. CAM-04 (Loading Dock)'},{l:'Type',p:'IP Camera / NVR / Switch / Reader / Panel / AP'},{l:'Manufacturer',p:'e.g. Axis, Hanwha, HID'},{l:'Model',p:'e.g. P3265-V'},{l:'Serial Number',p:'Scan barcode or enter manually'},{l:'IP Address',p:'e.g. 192.168.1.104'},{l:'MAC Address',p:'e.g. AC:CC:8E:xx:xx:xx'},{l:'Site / Room',p:'e.g. Main Office / Loading Dock'},{l:'Mount Type',p:'Ceiling / Wall / Pole'},{l:'Cable Type',p:'Cat6A / Cat6 / Fiber'},{l:'Switch Port',p:'e.g. SW-01 Port 8'},{l:'Notes',p:'Any additional details'}].map((f,i) => (
              <div key={i}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 3 }}>{f.l}</div>
              {f.l === 'Type' ? <select style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>{['IP Camera','NVR','Network Switch','Access Reader','Alarm Panel','Access Point','Other'].map(t => <option key={t}>{t}</option>)}</select>
              : f.l === 'Notes' ? <textarea placeholder={f.p} rows={2} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              : <input placeholder={f.p} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />}</div>
            ))}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 20 }}>
              <button onClick={() => setAddConfigOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { showToast('Configuration saved & synced to portal'); setAddConfigOpen(false); }} style={{ flex: 1, padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save & Sync</button>
            </div>
          </div>
        </div>
      </div>)}

      {/* ── Add Password Modal ── */}
      {addPasswordOpen && (<div onClick={() => setAddPasswordOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '16px 16px 0 0', overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Add Password</span>
            <button onClick={() => setAddPasswordOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="access-control" size={12} color="var(--brand)" /> Encrypted & synced to portal vault</div>
            {[{l:'Label',p:'e.g. NVR Admin'},{l:'Device / System',p:'e.g. NVR-01'},{l:'Username',p:'admin'},{l:'Password',p:'Enter password'},{l:'Type',p:'select'}].map((f,i) => (
              <div key={i}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 3 }}>{f.l}</div>
              {f.l === 'Type' ? <select style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>{['Device','Customer','Remote','Service'].map(t => <option key={t}>{t}</option>)}</select>
              : f.l === 'Password' ? <div style={{ display: 'flex', gap: 6 }}><input type="password" placeholder={f.p} style={{ flex: 1, padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} /><button onClick={() => showToast('Password generated')} style={{ padding: '8px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Generate</button></div>
              : <input placeholder={f.p} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />}</div>
            ))}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 20 }}>
              <button onClick={() => setAddPasswordOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { showToast('Password saved & synced to vault'); setAddPasswordOpen(false); }} style={{ flex: 1, padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save & Sync</button>
            </div>
          </div>
        </div>
      </div>)}

      {/* ── Upload Doc Modal ── */}
      {addDocOpen && (<div onClick={() => setAddDocOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '16px 16px 0 0', overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Upload Document</span>
            <button onClick={() => setAddDocOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="proposals" size={12} color="var(--brand)" /> Uploads sync to portal document library</div>
            <div style={{ padding: 28, border: '2px dashed var(--border-subtle)', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }} onClick={() => showToast('File picker opened')}>
              <Icon name="export" size={24} color="var(--text-low)" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Tap to choose file or take photo</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>PDF, JPG, PNG, DWG up to 25MB</div>
            </div>
            {[{l:'Document Name',p:'e.g. As-Built Drawing'},{l:'Type',p:'select'}].map((f,i) => (
              <div key={i}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 3 }}>{f.l}</div>
              {f.l === 'Type' ? <select style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>{['Floor Plan','Design','Programming','Network','Photo','Contract','Other'].map(t => <option key={t}>{t}</option>)}</select>
              : <input placeholder={f.p} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />}</div>
            ))}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 20 }}>
              <button onClick={() => setAddDocOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { showToast('Document uploaded & synced'); setAddDocOpen(false); }} style={{ flex: 1, padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Upload & Sync</button>
            </div>
          </div>
        </div>
      </div>)}

      {/* ── Add Network Modal ── */}
      {addNetworkOpen && (<div onClick={() => setAddNetworkOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '16px 16px 0 0', overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Add Network</span>
            <button onClick={() => setAddNetworkOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="topology" size={12} color="var(--brand)" /> Syncs to portal network documentation</div>
            {[{l:'Network Name',p:'e.g. Security VLAN 20'},{l:'Subnet',p:'e.g. 192.168.2.0/24'},{l:'Gateway',p:'e.g. 192.168.2.1'},{l:'DNS',p:'e.g. 8.8.8.8'},{l:'VLAN ID',p:'e.g. 20'},{l:'Type',p:'select'},{l:'Notes',p:'DHCP range, purpose, etc.'}].map((f,i) => (
              <div key={i}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 3 }}>{f.l}</div>
              {f.l === 'Type' ? <select style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}>{['Wired','Wireless','VPN','VLAN'].map(t => <option key={t}>{t}</option>)}</select>
              : f.l === 'Notes' ? <textarea placeholder={f.p} rows={2} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              : <input placeholder={f.p} style={{ width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />}</div>
            ))}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 20 }}>
              <button onClick={() => setAddNetworkOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => { showToast('Network saved & synced to portal'); setAddNetworkOpen(false); }} style={{ flex: 1, padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save & Sync</button>
            </div>
          </div>
        </div>
      </div>)}

            {toast && <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '8px 20px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 12, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)' }}>{toast}</div>}
    </div>); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', fontWeight: 500 }}>
        {customers.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: activeTab===t.id?600:400, background: activeTab===t.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: activeTab===t.id?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>{t.l}<span className="mono" style={{ fontSize: 9, opacity: 0.6 }}>{t.c}</span></button>))}
      </div>
      {activeTab === 'configs' && (<>
        <div style={{ display: 'flex', gap: 6 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, IP, serial..." style={{ flex: 1, padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => setAddConfigOpen(true)} style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--brand)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
      </div>
      
        <div style={{ display: 'flex', gap: 4, overflow: 'auto', paddingBottom: 2 }}>
          {types.map(t => (<button key={t} onClick={() => setFilter(t)} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 10, whiteSpace: 'nowrap', background: filter===t?'rgba(63,169,245,0.12)':'transparent', border: '1px solid '+(filter===t?'var(--brand)':'var(--border-subtle)'), color: filter===t?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t==='all'?'All':t}</button>))}
        </div>
        {filtered.map(a => (<button key={a.id} onClick={() => setSelectedAsset(a)} className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer', borderRadius: 10, textAlign: 'left', fontFamily: 'var(--font-body)', width: '100%' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: (typeColors[a.type]||'var(--brand)')+'15', border: '1px solid '+(typeColors[a.type]||'var(--brand)')+'30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={typeIcons[a.type]||'cam-dome'} size={18} color={typeColors[a.type]||'var(--brand)'} /></div>
          <div style={{ flex: 1, overflow: 'hidden' }}><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{a.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.mfg} {a.model}</div>{a.ip && <div className="mono" style={{ fontSize: 10, color: 'var(--brand)', marginTop: 1 }}>{a.ip}</div>}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}><StatusDot status={a.status==='online'?'online':'warning'} size={7} />{a.fwUpdate && <Icon name="warning-tri" size={10} color="var(--status-warn)" />}</div>
        </button>))}
      </>)}
      {activeTab === 'passwords' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => setAddPasswordOpen(true)} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="add" size={14} color="var(--brand)" /> Add Password</button>
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
        <button onClick={() => setAddDocOpen(true)} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="add" size={14} color="var(--brand)" /> Upload Document</button>
        {documents.map((d,i) => (<button key={i} onClick={() => showToast('Opening '+d.name)} className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer', borderRadius: 10, textAlign: 'left', fontFamily: 'var(--font-body)', width: '100%' }}>
          <Icon name="proposals" size={18} color="var(--brand)" />
          <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{d.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{d.type} · {d.size} · {d.date}</div></div>
          <Icon name="chevron-right" size={12} color="var(--text-low)" />
        </button>))}
      </div>)}
      {activeTab === 'topology' && (<MobileTopologyView showToast={showToast} />)}
      {activeTab === 'networks' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => setAddNetworkOpen(true)} style={{ padding: '10px', border: '2px dashed var(--border-subtle)', borderRadius: 8, background: 'transparent', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="add" size={14} color="var(--brand)" /> Add Network</button>
        {networks.map((n,i) => (<GlassPanel key={i} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon name="topology" size={16} color="var(--brand)" /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{n.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{n.type} · {n.devices} devices</div></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[{l:'Subnet',v:n.subnet},{l:'Gateway',v:n.gw}].map((f,j) => (<div key={j} onClick={() => {navigator.clipboard?.writeText?.(f.v);showToast('Copied');}} style={{ cursor: 'pointer' }}><div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>{f.l}</div><div className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{f.v}</div></div>))}
          </div></GlassPanel>))}
      </div>)}
      {toast && <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '8px 20px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 12, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)' }}>{toast}</div>}
    </div>
  );
}


/* ── Mobile Topology V2 — Matches Portal's Monitoring Console ── */
function MobileTopologyView({ showToast }) {
  const [viewMode, setViewMode] = React.useState('topology'); // topology | infra
  const [expandedNodes, setExpandedNodes] = React.useState({ isp: true, gw: true, sw1: true, ap1: true });
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [trafficAnim, setTrafficAnim] = React.useState(true);
  const [filterType, setFilterType] = React.useState('all');

  const toggleExpand = (id) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));

  const nodes = [
    { id: 'isp', label: 'Comcast Business', sub: '500/50 Mbps · 24.16.88.x', type: 'isp', status: 'online', parent: null, ip: '24.16.88.102', model: 'Business Gateway', mfg: 'Comcast', firmware: '—', poe: 0, mac: '' },
    { id: 'gw', label: 'USG-Pro-4', sub: '192.168.1.1 · Gateway', type: 'gateway', status: 'online', parent: 'isp', ip: '192.168.1.1', model: 'USG-Pro-4', mfg: 'Ubiquiti', firmware: '7.0.25', cpu: 12, mem: 34, poe: 0, mac: 'F0:9F:C2:12:34:56', uptime: '42d 6h' },
    { id: 'sw1', label: 'CBS350-24P (IDF)', sub: '192.168.1.2 · 186/370W PoE', type: 'switch', status: 'online', parent: 'gw', ip: '192.168.1.2', model: 'CBS350-24P', mfg: 'Cisco', firmware: '3.2.0.84', poeUsed: 186, poeTotal: 370, poe: 0, mac: '00:1A:2B:3C:4D:5E', uptime: '42d 6h' },
    { id: 'cam1', label: 'CAM-01 Lobby', sub: '192.168.1.101 · Axis P3265-V', type: 'camera', status: 'online', parent: 'sw1', ip: '192.168.1.101', model: 'P3265-V', mfg: 'Axis', firmware: '11.8.64', poe: 12.5, fwUpdate: true, mac: 'AC:CC:8E:F0:12:34', port: 'Port 3', uptime: '14d 8h' },
    { id: 'cam2', label: 'CAM-02 Parking', sub: '192.168.1.102 · Axis P3265-V', type: 'camera', status: 'online', parent: 'sw1', ip: '192.168.1.102', model: 'P3265-V', mfg: 'Axis', firmware: '11.8.64', poe: 12.5, mac: 'AC:CC:8E:F0:12:35', port: 'Port 4', uptime: '14d 8h' },
    { id: 'cam3', label: 'CAM-03 Back Door', sub: '192.168.1.103 · Axis Q6135-LE', type: 'camera', status: 'offline', parent: 'sw1', ip: '192.168.1.103', model: 'Q6135-LE', mfg: 'Axis', firmware: '11.6.12', poe: 25, mac: 'AC:CC:8E:F0:12:36', port: 'Port 5', uptime: '—' },
    { id: 'nvr1', label: 'NVR-01', sub: '192.168.1.100 · Hanwha XNR-6410', type: 'nvr', status: 'online', parent: 'sw1', ip: '192.168.1.100', model: 'XNR-6410', mfg: 'Hanwha', firmware: '2.01.04', fwUpdate: true, poe: 0, mac: '00:09:18:A0:12:34', port: 'Port 1', uptime: '42d 6h' },
    { id: 'rdr1', label: 'RDR-01 Front', sub: 'HID iCLASS SE RK40', type: 'reader', status: 'online', parent: 'sw1', ip: '', model: 'iCLASS SE RK40', mfg: 'HID', firmware: 'R3.4', poe: 3, mac: '', port: '18/4 Wiegand', uptime: '42d' },
    { id: 'ap1', label: 'AP-01 Lobby', sub: '192.168.1.50 · U6-Pro', type: 'ap', status: 'online', parent: 'sw1', ip: '192.168.1.50', model: 'U6-Pro', mfg: 'Ubiquiti', firmware: '6.6.55', poe: 13, mac: 'FC:EC:DA:12:56:78', port: 'Port 20', uptime: '38d 2h', clients: 12 },
    { id: 'panel1', label: 'Panel-01 Alarm', sub: 'DSC PowerSeries Neo · 52 zones', type: 'alarm', status: 'online', parent: 'sw1', ip: '', model: 'PowerSeries Neo', mfg: 'DSC', firmware: '1.40', poe: 0, mac: '', port: '22/4 + 18/4', uptime: '30d' },
    { id: 'wc1', label: 'iPhone (Martinez)', sub: '-42 dBm · 5GHz', type: 'wifi', status: 'online', parent: 'ap1', ip: '192.168.1.201', model: 'iPhone 15', mfg: 'Apple', firmware: '—', poe: 0, mac: 'A4:83:E7:xx:xx:01' },
    { id: 'wc2', label: 'iPad (Teller 2)', sub: '-55 dBm · 5GHz', type: 'wifi', status: 'online', parent: 'ap1', ip: '192.168.1.202', model: 'iPad Air', mfg: 'Apple', firmware: '—', poe: 0, mac: 'A4:83:E7:xx:xx:02' },
    { id: 'wc3', label: 'Samsung (Guard)', sub: '-68 dBm · 2.4GHz', type: 'wifi', status: 'online', parent: 'ap1', ip: '192.168.1.203', model: 'Galaxy S24', mfg: 'Samsung', firmware: '—', poe: 0, mac: '4C:DD:31:xx:xx:03' },
  ];

  const nodeMap = {}; nodes.forEach(n => { nodeMap[n.id] = n; });
  const getChildren = (id) => nodes.filter(n => n.parent === id);

  const iconMap = { isp: 'topology', gateway: 'server', switch: 'switch-ports', camera: 'cam-dome', nvr: 'nvr-box', reader: 'reader', ap: 'ap-ceiling', alarm: 'alarm-panel', wifi: 'wifi' };
  const colorMap = { isp: 'var(--text-mid)', gateway: '#34d399', switch: '#34d399', camera: 'var(--brand)', nvr: '#34d399', reader: '#c084fc', ap: '#a78bfa', alarm: '#fbbf24', wifi: 'rgba(63,169,245,0.5)' };

  const deviceTypes = ['all','camera','nvr','reader','ap','alarm','switch','gateway','wifi'];
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;
  const totalPoe = nodes.reduce((s,n) => s + (n.poe||0), 0);

  const visibleNodes = filterType === 'all' ? nodes : nodes.filter(n => n.type === filterType || n.id === 'isp' || n.id === 'gw' || n.id === 'sw1');

  /* ── Topology Map View (SVG) ── */
  function renderTopologyMap() {
    const positions = {
      isp: {x:180,y:28}, gw: {x:180,y:88}, sw1: {x:180,y:168},
      cam1: {x:40,y:258}, cam2: {x:100,y:258}, cam3: {x:160,y:258},
      nvr1: {x:220,y:258}, rdr1: {x:280,y:258}, ap1: {x:340,y:258}, panel1: {x:100,y:338},
      wc1: {x:280,y:338}, wc2: {x:340,y:338}, wc3: {x:400,y:338},
    };
    const connections = nodes.filter(n => n.parent).map(n => ({ from: n.parent, to: n.id }));

    return (
      <div style={{ position: 'relative', background: '#080c12', borderRadius: 8, overflow: 'auto', border: '1px solid var(--border-subtle)' }}>
        <svg width="440" height="380" viewBox="0 0 440 380" style={{ display: 'block' }}>
          <defs>
            <filter id="glow-m"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {/* Grid */}
          {Array.from({length:22}).map((_,i) => (<React.Fragment key={'g'+i}><line x1={i*20} y1="0" x2={i*20} y2="380" stroke="rgba(63,169,245,0.03)" strokeWidth="0.5" /><line x1="0" y1={i*20} x2="440" y2={i*20} stroke="rgba(63,169,245,0.03)" strokeWidth="0.5" /></React.Fragment>))}

          {/* Connections */}
          {connections.map((c,i) => {
            const from = positions[c.from]; const to = positions[c.to];
            if (!from || !to) return null;
            const isDown = nodeMap[c.to]?.status === 'offline';
            const isWifi = nodeMap[c.to]?.type === 'wifi';
            return (<g key={'c'+i}>
              <line x1={from.x} y1={from.y+16} x2={to.x} y2={to.y-16} stroke={isDown?'var(--status-critical)':isWifi?'rgba(63,169,245,0.08)':'rgba(63,169,245,0.12)'} strokeWidth={isWifi?0.5:1} strokeDasharray={isWifi?'3 3':isDown?'4 2':'none'} />
              {trafficAnim && !isDown && !isWifi && (<circle r="2" fill="var(--brand)" opacity="0.6"><animateMotion dur={1.5+Math.random()}s repeatCount="indefinite" path={'M'+from.x+','+(from.y+16)+' L'+to.x+','+(to.y-16)} /></circle>)}
            </g>);
          })}

          {/* Nodes */}
          {visibleNodes.map(n => {
            const pos = positions[n.id]; if (!pos) return null;
            const color = colorMap[n.type]||'var(--brand)';
            const icon = iconMap[n.type]||'topology';
            const isSel = selectedNode === n.id;
            const isWifi = n.type === 'wifi';
            const sz = isWifi ? 10 : 16;
            return (
              <g key={n.id} transform={'translate('+pos.x+','+pos.y+')'} onClick={() => setSelectedNode(isSel?null:n.id)} style={{cursor:'pointer'}}>
                {isSel && <rect x={-(sz+6)} y={-(sz+6)} width={(sz+6)*2} height={(sz+6)*2} rx={isWifi?'50%':8} fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.5"><animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" /></rect>}
                {n.status==='online' && !isWifi && (<circle r={sz+8} fill="none" stroke={color} strokeWidth="0.5" opacity="0.15"><animate attributeName="r" values={(sz+6)+';'+(sz+12)} dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.15;0" dur="3s" repeatCount="indefinite" /></circle>)}
                {isWifi ? (
                  <><circle r={sz} fill="rgba(63,169,245,0.05)" stroke="rgba(63,169,245,0.2)" strokeWidth="0.5" /><circle r="2" fill={color} /></>
                ) : (
                  <rect x={-sz} y={-sz} width={sz*2} height={sz*2} rx="7" fill="rgba(10,14,20,0.92)" stroke={n.status==='offline'?'var(--status-critical)':color} strokeWidth={isSel?2:1.2} filter={isSel?'url(#glow-m)':'none'} />
                )}
                {!isWifi && <foreignObject x="-8" y="-8" width="16" height="16"><div xmlns="http://www.w3.org/1999/xhtml" style={{width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{typeof Icon!=='undefined' && <Icon name={icon} size={14} color={n.status==='offline'?'var(--status-critical)':color} />}</div></foreignObject>}
                <text y={isWifi?18:sz+10} textAnchor="middle" fill={n.status==='offline'?'var(--status-critical)':'var(--text-mid)'} fontSize="7" fontFamily="var(--font-mono)">{n.label.length>14?n.label.substring(0,14)+'…':n.label}</text>
                {n.poe>0 && <text y={sz+18} textAnchor="middle" fill="var(--brand)" fontSize="6" fontFamily="var(--font-mono)">{n.poe}W</text>}
                {/* Status dot */}
                {!isWifi && <circle cx={sz-2} cy={-(sz-2)} r="3" fill={n.status==='online'?'var(--status-ok)':'var(--status-critical)'} stroke="rgba(10,14,20,0.9)" strokeWidth="1.5" />}
                {/* PoE bar for switch */}
                {n.poeUsed && (<><rect x="-20" y={sz+2} width="40" height="3" rx="1.5" fill="rgba(63,169,245,0.08)" /><rect x="-20" y={sz+2} width={40*(n.poeUsed/n.poeTotal)} height="3" rx="1.5" fill="var(--brand)" /></>)}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  /* ── Infrastructure Table View ── */
  function renderInfraTable() {
    const devs = visibleNodes.filter(n => n.type !== 'wifi');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {devs.map(n => {
          const color = colorMap[n.type]||'var(--brand)';
          const isSel = selectedNode === n.id;
          return (
            <button key={n.id} onClick={() => setSelectedNode(isSel?null:n.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: isSel?'rgba(63,169,245,0.06)':'var(--glass-bg)',
              border: '1px solid '+(isSel?'var(--brand)':'var(--border-subtle)'),
              borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)',
              textAlign: 'left', width: '100%', transition: 'all 0.15s'
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: color+'15', border: '1px solid '+color+'30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={iconMap[n.type]||'topology'} size={16} color={color} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: n.status==='offline'?'var(--status-critical)':'var(--text-high)' }}>{n.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', display: 'flex', gap: 6 }}>
                  <span>{n.mfg} {n.model}</span>
                  {n.ip && <span className="mono" style={{ color: 'var(--brand)' }}>{n.ip}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <StatusDot status={n.status==='online'?'online':'critical'} size={6} />
                {n.poe>0 && <span className="mono" style={{ fontSize: 8, color: 'var(--brand)' }}>{n.poe}W</span>}
                {n.fwUpdate && <Icon name="warning-tri" size={9} color="var(--status-warn)" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[{l:'Devices',v:nodes.filter(n=>n.type!=='wifi').length,c:'var(--brand)'},{l:'Online',v:onlineCount,c:'var(--status-ok)'},{l:'Offline',v:offlineCount,c:'var(--status-critical)'},{l:'PoE',v:totalPoe.toFixed(0)+'W',c:'var(--brand)'}].map((s,i) => (
          <div key={i} className="glass" style={{ flex: 1, padding: '5px 6px', textAlign: 'center', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 7, color: 'var(--text-low)', textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {[{id:'topology',l:'Map'},{id:'infra',l:'List'}].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ flex: 1, padding: '6px', fontSize: 10, fontWeight: viewMode===v.id?600:400, background: viewMode===v.id?'rgba(63,169,245,0.12)':'transparent', border: 'none', color: viewMode===v.id?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v.l}</button>
          ))}
        </div>
        <button onClick={() => setTrafficAnim(!trafficAnim)} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 9, background: trafficAnim?'rgba(63,169,245,0.12)':'transparent', border: '1px solid '+(trafficAnim?'var(--brand)':'var(--border-subtle)'), color: trafficAnim?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{trafficAnim?'Traffic On':'Traffic Off'}</button>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 3, overflow: 'auto', paddingBottom: 2 }}>
        {deviceTypes.map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{ padding: '3px 8px', borderRadius: 100, fontSize: 9, whiteSpace: 'nowrap', background: filterType===t?'rgba(63,169,245,0.12)':'transparent', border: '1px solid '+(filterType===t?'var(--brand)':'var(--border-subtle)'), color: filterType===t?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{t==='all'?'All':t}</button>
        ))}
      </div>

      {/* Views */}
      {viewMode === 'topology' && renderTopologyMap()}
      {viewMode === 'infra' && renderInfraTable()}

      {/* Selected Node Detail Panel */}
      {selectedNode && nodeMap[selectedNode] && (() => {
        const n = nodeMap[selectedNode];
        const color = colorMap[n.type]||'var(--brand)';
        return (
          <GlassPanel style={{ padding: 12, borderLeft: '3px solid '+color, animation: 'fade-up 0.15s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: color+'15', border: '1px solid '+color+'30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={iconMap[n.type]||'topology'} size={18} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: n.status==='offline'?'var(--status-critical)':'var(--text-high)' }}>{n.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{n.mfg} {n.model}</div>
              </div>
              <StatusDot status={n.status==='online'?'online':'critical'} size={8} pulse={n.status==='online'} />
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
              {n.ip && <div onClick={() => {navigator.clipboard?.writeText?.(n.ip);showToast('IP copied');}} style={{cursor:'pointer'}}><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>IP</div><div className="mono" style={{fontSize:11,color:'var(--brand)'}}>{n.ip}</div></div>}
              {n.mac && <div onClick={() => {navigator.clipboard?.writeText?.(n.mac);showToast('MAC copied');}} style={{cursor:'pointer'}}><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>MAC</div><div className="mono" style={{fontSize:10,color:'var(--text-mid)'}}>{n.mac}</div></div>}
              {n.firmware && n.firmware!=='—' && <div><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>Firmware</div><div className="mono" style={{fontSize:11,color:'var(--text-mid)'}}>{n.firmware}{n.fwUpdate?' ⚠':''}</div></div>}
              {n.uptime && <div><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>Uptime</div><div className="mono" style={{fontSize:11,color:'var(--text-mid)'}}>{n.uptime}</div></div>}
              {n.port && <div><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>Port</div><div className="mono" style={{fontSize:11,color:'var(--text-mid)'}}>{n.port}</div></div>}
              {n.poe>0 && <div><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>PoE Draw</div><div className="mono" style={{fontSize:11,color:'var(--brand)'}}>{n.poe}W</div></div>}
              {n.clients && <div><div style={{fontSize:8,color:'var(--text-low)',textTransform:'uppercase'}}>Clients</div><div className="mono" style={{fontSize:11,color:'var(--brand)'}}>{n.clients}</div></div>}
            </div>

            {/* PoE budget for switch */}
            {n.poeUsed && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 3 }}><span>PoE Budget</span><span className="mono">{n.poeUsed}/{n.poeTotal}W ({Math.round(n.poeUsed/n.poeTotal*100)}%)</span></div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}><div style={{ width: (n.poeUsed/n.poeTotal*100)+'%', height: '100%', borderRadius: 3, background: n.poeUsed/n.poeTotal>0.8?'var(--status-warn)':'var(--brand)', transition: 'width 0.3s' }} /></div>
              </div>
            )}

            {/* CPU/MEM for gateway */}
            {n.cpu !== undefined && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[{l:'CPU',v:n.cpu},{l:'MEM',v:n.mem}].map((g,i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 2 }}><span>{g.l}</span><span className="mono">{g.v}%</span></div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)' }}><div style={{ width: g.v+'%', height: '100%', borderRadius: 2, background: g.v>70?'var(--status-warn)':'var(--brand)' }} /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4 }}>
              {n.ip && <button onClick={() => showToast('Opening '+n.label+'...')} style={{ flex: 1, padding: '7px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Icon name="link" size={10} color="var(--brand)" /> Open</button>}
              <button onClick={() => showToast('Ping: 2ms')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Icon name="topology" size={10} color="var(--text-mid)" /> Ping</button>
              <button onClick={() => showToast('Restarting...')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Icon name="bolt" size={10} color="var(--text-mid)" /> Restart</button>
            </div>

            {/* Child devices */}
            {getChildren(n.id).length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px solid rgba(63,169,245,0.06)', paddingTop: 6 }}>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 4 }}>CONNECTED ({getChildren(n.id).length})</div>
                {getChildren(n.id).map(child => (
                  <button key={child.id} onClick={() => setSelectedNode(child.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', borderBottom: '1px solid rgba(63,169,245,0.03)' }}>
                    <Icon name={iconMap[child.type]||'topology'} size={12} color={colorMap[child.type]||'var(--brand)'} />
                    <span style={{ fontSize: 11, color: child.status==='offline'?'var(--status-critical)':'var(--text-mid)', flex: 1 }}>{child.label}</span>
                    <StatusDot status={child.status==='online'?'online':'critical'} size={5} />
                  </button>
                ))}
              </div>
            )}
          </GlassPanel>
        );
      })()}
    </div>
  );
}


Object.assign(window, { TimeViewV2, ExpenseView, VehicleInspectionView, PartsRequestView, TechAssetsView, MobileTopologyView });

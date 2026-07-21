/* ShieldTech Mobile — Calendar (Week · Month · Agenda)
   Touch-native parity with the desktop scheduler. Reads & writes jobStore, so
   anything built here shows on the desktop calendar instantly (and vice-versa).
   Build = create (tap a slot), reschedule (open editor → day/time/duration),
   assign a crew (multi-tech), change type/value, multi-day spans, delete. */

const MC_TECHS = [
  { id: 'MR', name: 'Mike Reyes', color: '#3FA9F5' },
  { id: 'JL', name: 'Jessica Liu', color: '#34D399' },
  { id: 'KW', name: 'Kevin White', color: '#FBBF24' },
  { id: 'DP', name: 'Diana Patel', color: '#c084fc' },
  { id: 'TG', name: 'Tony Garcia', color: '#F43F5E' },
];
const MC_TYPES = {
  install:     { c: '#3FA9F5', label: 'Install' },
  maintenance: { c: '#FBBF24', label: 'Maintenance' },
  repair:      { c: '#F43F5E', label: 'Repair' },
  survey:      { c: '#c084fc', label: 'Survey' },
  meeting:     { c: '#34D399', label: 'Meeting' },
};
const MC_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MC_DATES = [8, 9, 10, 11, 12, 13, 14];      // the data week: Jun 8–14, 2026 (today = Wed 10)
const MC_TODAY = 3;
const MC_H0 = 7, MC_H1 = 19, MC_HPX = 46, MC_COLW = 92;
const mcSpan = j => (j.endDay || j.day) - j.day + 1;
const mcFmt = h => `${(Math.floor(h) % 12) || 12}:${h % 1 ? '30' : '00'} ${h >= 12 ? 'PM' : 'AM'}`;
const mcFmtShort = h => `${(Math.floor(h) % 12) || 12}:${h % 1 ? '30' : '00'}`;
const mcColor = j => (!j.techs || j.techs.length === 0) ? '#94A3B8' : (MC_TYPES[j.type] || MC_TYPES.install).c;

/* ── Job Editor (create + edit) → jobStore ── */
function MJobEditor({ job, slot, onClose }) {
  const [allCusts] = useShieldStore(customerStore);
  const [f, setF] = React.useState(() => {
    const base = job || {};
    return {
      title: base.title || '', customer: base.customer || '', type: base.type || 'install',
      day: String(base.day || (slot && slot.day) || MC_TODAY),
      endDay: String(base.endDay || base.day || (slot && slot.day) || MC_TODAY),
      start: String(base.start != null ? base.start : (slot && slot.start != null ? slot.start : 9)),
      dur: String(base.dur != null ? base.dur : 2),
      value: base.value ? String(base.value) : '',
      techs: base.techs ? [...base.techs] : [],
    };
  });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const toggleTech = (id) => setF(p => ({ ...p, techs: p.techs.includes(id) ? p.techs.filter(t => t !== id) : [...p.techs, id] }));
  const hourOpts = []; for (let h = MC_H0; h <= MC_H1; h++) { hourOpts.push({ value: String(h), label: mcFmt(h) }); hourOpts.push({ value: String(h + 0.5), label: mcFmt(h + 0.5) }); }

  const save = () => {
    if (!f.title.trim()) { showToast('Job title is required', 'warn'); return; }
    const day = Number(f.day);
    const endDay = Math.max(day, Number(f.endDay));
    const rec = {
      title: f.title.trim(), customer: f.customer || '—', type: f.type,
      day, endDay, start: Number(f.start), dur: Number(f.dur) || 1,
      value: Number(f.value) || 0, techs: f.techs,
    };
    if (job) {
      jobStore.set(list => list.map(x => x.id === job.id ? { ...x, ...rec } : x));
      showToast('Job updated — synced to portal', 'ok');
    } else {
      jobStore.set(list => [...list, { ...rec, id: list.reduce((m, j) => Math.max(m, j.id), 0) + 1 }]);
      showToast('Job scheduled — synced to portal', 'ok');
    }
    onClose();
  };
  const del = () => { jobStore.set(list => list.filter(x => x.id !== job.id)); showToast('Job deleted', 'warn'); onClose(); };

  return (
    <MSheet title={job ? 'Edit Job' : 'New Job'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <MWField label="Job Title *" value={f.title} onChange={set('title')} placeholder="e.g. Metro Bank — Camera Install" />
        <MWSelect label="Customer" value={f.customer} onChange={set('customer')} options={[{ value: '', label: 'Select customer…' }, ...allCusts.map(c => ({ value: c.name, label: c.name }))]} />

        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6, display: 'block' }}>Type</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {Object.entries(MC_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setF(p => ({ ...p, type: k }))} style={{ padding: '6px 11px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: f.type === k ? `${v.c}22` : 'transparent', border: `1px solid ${f.type === k ? v.c : 'var(--border-subtle)'}`, color: f.type === k ? v.c : 'var(--text-low)' }}>{v.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWSelect label="Start day" value={f.day} onChange={e => setF(p => ({ ...p, day: e.target.value, endDay: String(Math.max(Number(e.target.value), Number(p.endDay))) }))} options={MC_DAYS.map((d, i) => ({ value: String(i + 1), label: `${d} ${MC_DATES[i]}` }))} /></div>
          <div style={{ flex: 1 }}><MWSelect label="End day" value={f.endDay} onChange={set('endDay')} options={MC_DAYS.map((d, i) => ({ value: String(i + 1), label: `${d} ${MC_DATES[i]}` })).filter(o => Number(o.value) >= Number(f.day))} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1.4 }}><MWSelect label="Start time" value={f.start} onChange={set('start')} options={hourOpts} /></div>
          <div style={{ flex: 1 }}><MWField label="Hours/day" type="number" value={f.dur} onChange={set('dur')} placeholder="2" /></div>
        </div>

        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6, display: 'block' }}>Crew {f.techs.length === 0 && <span style={{ color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>· unassigned</span>}</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {MC_TECHS.map(t => {
              const on = f.techs.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggleTech(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 5px', borderRadius: 16, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, background: on ? `${t.color}1c` : 'rgba(63,169,245,0.04)', border: `1px solid ${on ? t.color + '70' : 'var(--border-subtle)'}`, color: on ? t.color : 'var(--text-low)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${t.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: t.color }}>{t.id}</span>
                  {t.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        <MWField label="Job Value ($)" type="number" value={f.value} onChange={set('value')} placeholder="0" />

        <div style={{ display: 'flex', gap: 9, marginTop: 2 }}>
          {job
            ? <button onClick={del} style={{ flex: 1, padding: '13px 0', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 11, color: 'var(--status-critical)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete</button>
            : <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>}
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{job ? 'Save Changes' : 'Schedule Job'}</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Week grid (scrollable time grid, tap to create / edit) ── */
function MCWeek({ jobs, onCreate, onOpen }) {
  const hours = []; for (let h = MC_H0; h < MC_H1; h++) hours.push(h);
  const gridCols = `44px repeat(7, ${MC_COLW}px)`;
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: 44 + 7 * MC_COLW }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,14,20,0.6)' }}>
            <div></div>
            {MC_DAYS.map((d, i) => (
              <div key={d} style={{ padding: '7px 0', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', background: i + 1 === MC_TODAY ? 'rgba(63,169,245,0.07)' : 'transparent' }}>
                <div style={{ fontSize: 9, color: 'var(--text-low)', letterSpacing: '0.06em' }}>{d.toUpperCase()}</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: i + 1 === MC_TODAY ? 700 : 400, color: i + 1 === MC_TODAY ? 'var(--brand)' : 'var(--text-high)' }}>{MC_DATES[i]}</div>
              </div>
            ))}
          </div>
          {/* Body */}
          <div style={{ position: 'relative' }}>
            {hours.map(h => (
              <div key={h} style={{ display: 'grid', gridTemplateColumns: gridCols, height: MC_HPX }}>
                <div style={{ paddingTop: 4, paddingRight: 6, textAlign: 'right', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span className="mono" style={{ fontSize: 8.5, color: 'var(--text-low)' }}>{h <= 12 ? h : h - 12}{h < 12 ? 'a' : 'p'}</span>
                </div>
                {MC_DAYS.map((_, di) => (
                  <div key={di} onClick={() => onCreate({ day: di + 1, start: h })} style={{ borderLeft: '1px solid var(--border-subtle)', borderBottom: '1px solid rgba(63,169,245,0.04)', background: di + 1 === MC_TODAY ? 'rgba(63,169,245,0.02)' : 'transparent', cursor: 'pointer' }}></div>
                ))}
              </div>
            ))}
            {/* Job blocks */}
            {jobs.map(j => {
              const span = mcSpan(j);
              const top = (j.start - MC_H0) * MC_HPX;
              const height = Math.max(j.dur * MC_HPX - 3, 22);
              const left = 44 + (j.day - 1) * MC_COLW + 1;
              const width = span * MC_COLW - 3;
              const c = mcColor(j);
              const unassigned = !j.techs || j.techs.length === 0;
              return (
                <div key={j.id} onClick={(e) => { e.stopPropagation(); onOpen(j); }} style={{ position: 'absolute', top, left, width, height, background: `${c}22`, border: `1px ${unassigned ? 'dashed' : 'solid'} ${c}`, borderRadius: 6, padding: '3px 5px', overflow: 'hidden', cursor: 'pointer', zIndex: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: c, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                  {height > 34 && <div style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 1 }}>{mcFmtShort(j.start)}–{mcFmtShort(j.start + j.dur)}</div>}
                  {height > 50 && (j.techs || []).length > 0 && (
                    <div style={{ display: 'flex', marginTop: 2 }}>
                      {(j.techs || []).slice(0, 3).map((id, ti) => { const t = MC_TECHS.find(x => x.id === id); return <span key={id} style={{ width: 14, height: 14, borderRadius: '50%', background: `${t ? t.color : c}30`, border: `1px solid ${t ? t.color : c}60`, marginLeft: ti ? -4 : 0, fontSize: 6.5, fontWeight: 700, color: t ? t.color : c, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{id}</span>; })}
                    </div>
                  )}
                  {height > 50 && unassigned && <div style={{ fontSize: 8, color: '#94A3B8', marginTop: 2 }}>◌ unassigned</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center', padding: '8px 6px', borderTop: '1px solid var(--border-subtle)' }}>Tap any empty slot to schedule · tap a job to edit, reschedule or assign a crew</div>
    </div>
  );
}

/* ── Month grid ── */
function MCMonth({ jobs, onPickDay, onCreate }) {
  const startDow = (new Date(2026, 5, 1).getDay() + 6) % 7;     // Mon-based weekday of Jun 1
  const daysInMonth = 30;
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const jobsForDate = (d) => { const di = d - 7; return (di >= 1 && di <= 7) ? jobs.filter(j => j.day <= di && di <= (j.endDay || j.day)) : []; };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {MC_DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-low)', letterSpacing: '0.05em' }}>{d[0]}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i}></div>;
          const dayJobs = jobsForDate(d);
          const di = d - 7;
          const isToday = di === MC_TODAY;
          return (
            <button key={i} onClick={() => dayJobs.length ? onPickDay(di) : (di >= 1 && di <= 7 ? onCreate({ day: di, start: 9 }) : null)}
              style={{ aspectRatio: '1', borderRadius: 9, border: `1px solid ${isToday ? 'var(--brand)' : 'var(--border-subtle)'}`, background: isToday ? 'rgba(63,169,245,0.08)' : dayJobs.length ? 'var(--glass-bg)' : 'transparent', cursor: (di >= 1 && di <= 7) ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: 'var(--font-body)', padding: 0 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--brand)' : 'var(--text-mid)' }}>{d}</span>
              <div style={{ display: 'flex', gap: 2, minHeight: 5 }}>
                {dayJobs.slice(0, 4).map((j, k) => <span key={k} style={{ width: 4, height: 4, borderRadius: '50%', background: mcColor(j) }}></span>)}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Tap a day with jobs to see its agenda · tap an empty day to schedule</div>
    </div>
  );
}

/* ── Agenda (single day) ── */
function MCAgenda({ jobs, day, setDay, onCreate, onOpen }) {
  const dayJobs = jobs.filter(j => j.day <= day && day <= (j.endDay || j.day)).sort((a, b) => a.start - b.start);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {MC_DAYS.map((d, i) => {
          const n = jobs.filter(j => j.day <= i + 1 && i + 1 <= (j.endDay || j.day)).length;
          const on = day === i + 1, today = i + 1 === MC_TODAY;
          return (
            <button key={d} onClick={() => setDay(i + 1)} style={{ padding: '8px 0 6px', borderRadius: 9, border: '1px solid', borderColor: on ? 'var(--border-strong)' : 'var(--border-subtle)', background: on ? 'rgba(63,169,245,0.12)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: 8, letterSpacing: '0.06em', color: on ? 'var(--brand)' : 'var(--text-low)' }}>{d.toUpperCase()}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: today ? 700 : 400, color: today ? 'var(--brand)' : on ? 'var(--text-high)' : 'var(--text-mid)' }}>{MC_DATES[i]}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: n ? 'var(--brand)' : 'transparent' }}></span>
            </button>
          );
        })}
      </div>
      {dayJobs.length === 0 && <div className="glass" style={{ padding: 28, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Nothing scheduled — tap “+ New” to add a job</div>}
      {dayJobs.map(j => {
        const c = mcColor(j), span = mcSpan(j), unassigned = !j.techs || j.techs.length === 0;
        return (
          <div key={j.id} onClick={() => onOpen(j)} className="glass" style={{ padding: '12px 14px', borderRadius: 12, borderLeft: `3px solid ${c}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>{mcFmtShort(j.start)}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {(j.techs || []).slice(0, 3).map((id, ti) => { const t = MC_TECHS.find(x => x.id === id); return <span key={id} style={{ width: 20, height: 20, borderRadius: '50%', background: `${t ? t.color : c}28`, border: `1px solid ${t ? t.color : c}60`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: t ? t.color : c, marginLeft: ti ? -6 : 0 }}>{id}</span>; })}
                {unassigned && <span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8' }}>◌ unassigned</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{mcFmtShort(j.start)} – {mcFmtShort(j.start + j.dur)}{span > 1 ? ` · ${span} days` : ''}</span>
              <span style={{ fontSize: 10, color: c }}>{(MC_TYPES[j.type] || MC_TYPES.install).label}</span>
              {j.value > 0 && <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', marginLeft: 'auto' }}>${(j.value / 1000).toFixed(1)}k</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Calendar shell ── */
function MobileCalendar({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const [view, setView] = React.useState('week');
  const [day, setDay] = React.useState(MC_TODAY);
  const [editor, setEditor] = React.useState(null); // {job} | {slot}
  const weekRevenue = jobs.filter(j => j.value && j.type !== 'meeting').reduce((s, j) => s + (j.value || 0), 0);
  const openJob = (job) => setEditor({ job });
  const create = (slot) => setEditor({ slot });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="display" style={{ fontSize: 15, color: 'var(--text-high)' }}>Jun 8 — 14</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)' }}>${weekRevenue.toLocaleString()} wk</span>
          <button onClick={() => create({ day, start: 9 })} style={{ padding: '6px 13px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New</button>
        </div>
      </div>

      <MSegment options={['Week', 'Month', 'Agenda']} value={view.charAt(0).toUpperCase() + view.slice(1)} onChange={v => setView(v.toLowerCase())} />

      {view === 'week' && <MCWeek jobs={jobs} onCreate={create} onOpen={openJob} />}
      {view === 'month' && <MCMonth jobs={jobs} onPickDay={(d) => { setDay(d); setView('agenda'); }} onCreate={create} />}
      {view === 'agenda' && <MCAgenda jobs={jobs} day={day} setDay={setDay} onCreate={create} onOpen={openJob} />}

      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Everything you build here syncs to the desktop calendar automatically.</div>

      {editor && <MJobEditor job={editor.job} slot={editor.slot} onClose={() => setEditor(null)} />}
    </div>
  );
}

Object.assign(window, { MobileCalendar, MJobEditor });

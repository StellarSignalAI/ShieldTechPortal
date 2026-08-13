/* ShieldTech Mobile — Calendar (Week · Month · Agenda)
   Touch-native parity with the desktop scheduler. Reads & writes jobStore, so
   anything built here shows on the desktop calendar instantly (and vice-versa).
   Jobs live on REAL dates (date/endDate ISO) — schedule days, months or years
   out and navigate ‹ › freely. Crews come from the real user roster
   (useTechs → Supabase profiles), not a hardcoded list. */

const MC_TYPES = {
  install:     { c: '#3FA9F5', label: 'Install' },
  maintenance: { c: '#FBBF24', label: 'Maintenance' },
  repair:      { c: '#F43F5E', label: 'Repair' },
  survey:      { c: '#c084fc', label: 'Survey' },
  meeting:     { c: '#34D399', label: 'Meeting' },
};
const MC_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MC_H0 = 7, MC_H1 = 19, MC_HPX = 46, MC_COLW = 92;
const mcFmt = h => `${(Math.floor(h) % 12) || 12}:${h % 1 ? '30' : '00'} ${h >= 12 ? 'PM' : 'AM'}`;
const mcFmtShort = h => `${(Math.floor(h) % 12) || 12}:${h % 1 ? '30' : '00'}`;
const mcColor = j => (!j.techs || j.techs.length === 0) ? '#94A3B8' : (MC_TYPES[j.type] || MC_TYPES.install).c;
const mcTechOf = (roster, id) => roster.find(x => x.id === id) || null;

/* ── Job Editor (create + edit) → jobStore ── */
function MJobEditor({ job, slot, onClose }) {
  const [allCusts] = useShieldStore(customerStore);
  const roster = useTechs();
  const [f, setF] = React.useState(() => {
    const base = job || {};
    const startISO = base.id ? jobStartISO(base) : ((slot && slot.date) || todayISO());
    const endISO = base.id ? jobEndISO(base) : ((slot && slot.date) || todayISO());
    return {
      title: base.title || '', customer: base.customer || '', type: base.type || 'install',
      date: startISO, endDate: endISO,
      start: String(base.start != null ? base.start : (slot && slot.start != null ? slot.start : 9)),
      dur: String(base.dur != null ? base.dur : 2),
      value: base.value ? String(base.value) : '',
      techs: base.techs ? [...base.techs] : [],
    };
  });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const toggleTech = (id) => setF(p => ({ ...p, techs: p.techs.includes(id) ? p.techs.filter(t => t !== id) : [...p.techs, id] }));
  const hourOpts = []; for (let h = MC_H0; h <= MC_H1; h++) { hourOpts.push({ value: String(h), label: mcFmt(h) }); hourOpts.push({ value: String(h + 0.5), label: mcFmt(h + 0.5) }); }
  const inp = { width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', colorScheme: 'dark' };
  const lbl = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6, display: 'block' };

  const save = () => {
    if (!f.title.trim()) { showToast('Job title is required', 'warn'); return; }
    if (!f.date) { showToast('Pick a start date', 'warn'); return; }
    const endDate = (f.endDate && f.endDate >= f.date) ? f.endDate : f.date;
    const rec = normalizeJobDates({
      title: f.title.trim(), customer: f.customer || '—', type: f.type,
      date: f.date, endDate,
      start: Number(f.start), dur: Number(f.dur) || 1,
      value: Number(f.value) || 0, techs: f.techs,
      techIds: f.techs.map(id => (mcTechOf(roster, id) || {}).uid).filter(Boolean),
    });
    if (job) {
      jobStore.set(list => list.map(x => x.id === job.id ? { ...x, ...rec } : x));
      showToast('Job updated — synced to portal', 'ok');
      const added = f.techs.filter(id => !(job.techs || []).includes(id));
      if (added.length) notifyJobAssigned({ ...job, ...rec }, added);
    } else {
      const id = jobStore.get().reduce((m, j) => Math.max(m, j.id), 0) + 1;
      jobStore.set(list => [...list, { ...rec, id }]);
      showToast(`Job scheduled for ${dateOfISO(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 'ok');
      if (f.techs.length) notifyJobAssigned({ ...rec, id }, f.techs);
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
          <span style={lbl}>Type</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {Object.entries(MC_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setF(p => ({ ...p, type: k }))} style={{ padding: '6px 11px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: f.type === k ? `${v.c}22` : 'transparent', border: `1px solid ${f.type === k ? v.c : 'var(--border-subtle)'}`, color: f.type === k ? v.c : 'var(--text-low)' }}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* Real dates — schedule as far out as the job needs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <span style={lbl}>Start date</span>
            <input type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value, endDate: p.endDate < e.target.value ? e.target.value : p.endDate }))} style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={lbl}>End date</span>
            <input type="date" value={f.endDate} min={f.date} onChange={set('endDate')} style={inp} />
          </div>
        </div>
        {f.endDate > f.date && <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: -6 }}>{diffDaysISO(f.date, f.endDate) + 1}-day job</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1.4 }}><MWSelect label="Start time" value={f.start} onChange={set('start')} options={hourOpts} /></div>
          <div style={{ flex: 1 }}><MWField label="Hours/day" type="number" value={f.dur} onChange={set('dur')} placeholder="2" /></div>
        </div>

        <div>
          <span style={lbl}>Crew {f.techs.length === 0 && <span style={{ color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>· unassigned</span>}</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {roster.map(t => {
              const on = f.techs.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggleTech(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 5px', borderRadius: 16, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, background: on ? `${t.color}1c` : 'rgba(63,169,245,0.04)', border: `1px solid ${on ? t.color + '70' : 'var(--border-subtle)'}`, color: on ? t.color : 'var(--text-low)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${t.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: t.color }}>{t.id}</span>
                  {(t.name || '').split(' ')[0]}{t.role && t.role !== 'Technician' ? <span style={{ fontSize: 8, opacity: 0.7 }}>· {t.role}</span> : null}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 5 }}>Crew comes from your real users — add technicians in Admin → Users &amp; Invites.</div>
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

/* Overlap of a job with a 7-day window; null when outside. */
function mcWeekPos(j, wk0ISO, wk6ISO) {
  const s = jobStartISO(j), e = jobEndISO(j);
  if (e < wk0ISO || s > wk6ISO) return null;
  const a = s < wk0ISO ? wk0ISO : s;
  const b = e > wk6ISO ? wk6ISO : e;
  return { col: diffDaysISO(wk0ISO, a) + 1, span: diffDaysISO(a, b) + 1, clippedL: s < wk0ISO, clippedR: e > wk6ISO };
}

/* ── Week grid (scrollable time grid, tap to create / edit) ── */
function MCWeek({ jobs, week, roster, onCreate, onOpen }) {
  const wk0 = isoOfDate(week[0]), wk6 = isoOfDate(week[6]);
  const tISO = todayISO();
  const hours = []; for (let h = MC_H0; h < MC_H1; h++) hours.push(h);
  const gridCols = `44px repeat(7, ${MC_COLW}px)`;
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: 44 + 7 * MC_COLW }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,14,20,0.6)' }}>
            <div></div>
            {week.map((d, i) => {
              const isT = isoOfDate(d) === tISO;
              return (
                <div key={i} style={{ padding: '7px 0', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', background: isT ? 'rgba(63,169,245,0.07)' : 'transparent' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', letterSpacing: '0.06em' }}>{MC_DAYS[i].toUpperCase()}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: isT ? 700 : 400, color: isT ? 'var(--brand)' : 'var(--text-high)' }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          {/* Body */}
          <div style={{ position: 'relative' }}>
            {hours.map(h => (
              <div key={h} style={{ display: 'grid', gridTemplateColumns: gridCols, height: MC_HPX }}>
                <div style={{ paddingTop: 4, paddingRight: 6, textAlign: 'right', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span className="mono" style={{ fontSize: 8.5, color: 'var(--text-low)' }}>{h <= 12 ? h : h - 12}{h < 12 ? 'a' : 'p'}</span>
                </div>
                {week.map((d, di) => (
                  <div key={di} onClick={() => onCreate({ date: isoOfDate(d), start: h })} style={{ borderLeft: '1px solid var(--border-subtle)', borderBottom: '1px solid rgba(63,169,245,0.04)', background: isoOfDate(d) === tISO ? 'rgba(63,169,245,0.02)' : 'transparent', cursor: 'pointer' }}></div>
                ))}
              </div>
            ))}
            {/* Job blocks */}
            {jobs.map(j => {
              const pos = mcWeekPos(j, wk0, wk6);
              if (!pos) return null;
              const top = (j.start - MC_H0) * MC_HPX;
              const height = Math.max(j.dur * MC_HPX - 3, 22);
              const left = 44 + (pos.col - 1) * MC_COLW + 1;
              const width = pos.span * MC_COLW - 3;
              const c = mcColor(j);
              const unassigned = !j.techs || j.techs.length === 0;
              return (
                <div key={j.id} onClick={(e) => { e.stopPropagation(); onOpen(j); }} style={{ position: 'absolute', top, left, width, height, background: `${c}22`, border: `1px ${unassigned ? 'dashed' : 'solid'} ${c}`, borderRadius: 6, padding: '3px 5px', overflow: 'hidden', cursor: 'pointer', zIndex: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: c, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pos.clippedL ? '… ' : ''}{j.title}</div>
                  {height > 34 && <div style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 1 }}>{mcFmtShort(j.start)}–{mcFmtShort(j.start + j.dur)}{jobSpanDays(j) > 1 ? ` · ${jobSpanDays(j)}d` : ''}</div>}
                  {height > 50 && (j.techs || []).length > 0 && (
                    <div style={{ display: 'flex', marginTop: 2 }}>
                      {(j.techs || []).slice(0, 3).map((id, ti) => { const t = mcTechOf(roster, id); return <span key={id} style={{ width: 14, height: 14, borderRadius: '50%', background: `${t ? t.color : c}30`, border: `1px solid ${t ? t.color : c}60`, marginLeft: ti ? -4 : 0, fontSize: 6.5, fontWeight: 700, color: t ? t.color : c, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{id}</span>; })}
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

/* ── Month grid (any month, any year) ── */
function MCMonth({ jobs, anchor, onPickDay, onCreate }) {
  const y = anchor.getFullYear(), mo = anchor.getMonth();
  const startDow = (new Date(y, mo, 1).getDay() + 6) % 7;        // Mon-based weekday of the 1st
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const tISO = todayISO();
  const isoFor = (d) => isoOfDate(new Date(y, mo, d));
  const jobsForDate = (d) => { const iso = isoFor(d); return jobs.filter(j => jobOnISO(j, iso)); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {MC_DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-low)', letterSpacing: '0.05em' }}>{d[0]}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i}></div>;
          const dayJobs = jobsForDate(d);
          const iso = isoFor(d);
          const isToday = iso === tISO;
          return (
            <button key={i} onClick={() => dayJobs.length ? onPickDay(iso) : onCreate({ date: iso, start: 9 })}
              style={{ aspectRatio: '1', borderRadius: 9, border: `1px solid ${isToday ? 'var(--brand)' : 'var(--border-subtle)'}`, background: isToday ? 'rgba(63,169,245,0.08)' : dayJobs.length ? 'var(--glass-bg)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: 'var(--font-body)', padding: 0 }}>
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

/* ── Agenda (single real date, with a 7-day strip around it) ── */
function MCAgenda({ jobs, roster, dateISO, setDateISO, onCreate, onOpen }) {
  const mon = mondayOf(dateOfISO(dateISO));
  const strip = Array.from({ length: 7 }, (_, i) => addDaysISO(isoOfDate(mon), i));
  const tISO = todayISO();
  const dayJobs = jobs.filter(j => jobOnISO(j, dateISO)).sort((a, b) => a.start - b.start);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {strip.map((iso, i) => {
          const n = jobs.filter(j => jobOnISO(j, iso)).length;
          const on = dateISO === iso, today = iso === tISO;
          return (
            <button key={iso} onClick={() => setDateISO(iso)} style={{ padding: '8px 0 6px', borderRadius: 9, border: '1px solid', borderColor: on ? 'var(--border-strong)' : 'var(--border-subtle)', background: on ? 'rgba(63,169,245,0.12)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: 8, letterSpacing: '0.06em', color: on ? 'var(--brand)' : 'var(--text-low)' }}>{MC_DAYS[i].toUpperCase()}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: today ? 700 : 400, color: today ? 'var(--brand)' : on ? 'var(--text-high)' : 'var(--text-mid)' }}>{dateOfISO(iso).getDate()}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: n ? 'var(--brand)' : 'transparent' }}></span>
            </button>
          );
        })}
      </div>
      {dayJobs.length === 0 && <div className="glass" style={{ padding: 28, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Nothing scheduled — tap “+ New” to add a job</div>}
      {dayJobs.map(j => {
        const c = mcColor(j), span = jobSpanDays(j), unassigned = !j.techs || j.techs.length === 0;
        return (
          <div key={j.id} onClick={() => onOpen(j)} className="glass" style={{ padding: '12px 14px', borderRadius: 12, borderLeft: `3px solid ${c}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>{mcFmtShort(j.start)}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {(j.techs || []).slice(0, 3).map((id, ti) => { const t = mcTechOf(roster, id); return <span key={id} style={{ width: 20, height: 20, borderRadius: '50%', background: `${t ? t.color : c}28`, border: `1px solid ${t ? t.color : c}60`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: t ? t.color : c, marginLeft: ti ? -6 : 0 }}>{id}</span>; })}
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
  const roster = useTechs();
  const [view, setView] = React.useState('week');
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [agendaISO, setAgendaISO] = React.useState(todayISO());
  const [editor, setEditor] = React.useState(null); // {job} | {slot}

  const now = new Date();
  const mon = mondayOf(now); mon.setDate(mon.getDate() + weekOffset * 7);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const monthAnchor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const wk0 = isoOfDate(week[0]), wk6 = isoOfDate(week[6]);
  const weekRevenue = jobs.filter(j => j.value && j.type !== 'meeting' && mcWeekPos(j, wk0, wk6)).reduce((s, j) => s + (j.value || 0), 0);
  const openJob = (job) => setEditor({ job });
  const create = (slot) => setEditor({ slot });

  const headline = view === 'month'
    ? monthAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : view === 'agenda'
      ? dateOfISO(agendaISO).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : `${week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${week[6].toLocaleDateString('en-US', week[6].getMonth() === week[0].getMonth() ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}${week[0].getFullYear() !== now.getFullYear() ? `, ${week[0].getFullYear()}` : ''}`;

  const navBack = () => view === 'month' ? setMonthOffset(o => o - 1) : view === 'agenda' ? setAgendaISO(d => addDaysISO(d, -1)) : setWeekOffset(o => o - 1);
  const navFwd = () => view === 'month' ? setMonthOffset(o => o + 1) : view === 'agenda' ? setAgendaISO(d => addDaysISO(d, 1)) : setWeekOffset(o => o + 1);
  const navToday = () => { setWeekOffset(0); setMonthOffset(0); setAgendaISO(todayISO()); };
  const navBtn = { padding: '5px 11px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', lineHeight: 1 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <button onClick={navBack} style={navBtn}>‹</button>
        <button onClick={navToday} style={{ ...navBtn, fontSize: 10, fontWeight: 600 }}>Today</button>
        <button onClick={navFwd} style={navBtn}>›</button>
        <span className="display" style={{ fontSize: 14, color: 'var(--text-high)', flex: 1, textAlign: 'center' }}>{headline}</span>
        <button onClick={() => create({ date: view === 'agenda' ? agendaISO : (view === 'month' && monthOffset !== 0 ? isoOfDate(monthAnchor) : todayISO()), start: 9 })} style={{ padding: '6px 13px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}><MSegment options={['Week', 'Month', 'Agenda']} value={view.charAt(0).toUpperCase() + view.slice(1)} onChange={v => setView(v.toLowerCase())} /></div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)', flexShrink: 0 }}>${weekRevenue.toLocaleString()} wk</span>
      </div>

      {view === 'week' && <MCWeek jobs={jobs} week={week} roster={roster} onCreate={create} onOpen={openJob} />}
      {view === 'month' && <MCMonth jobs={jobs} anchor={monthAnchor} onPickDay={(iso) => { setAgendaISO(iso); setView('agenda'); }} onCreate={create} />}
      {view === 'agenda' && <MCAgenda jobs={jobs} roster={roster} dateISO={agendaISO} setDateISO={setAgendaISO} onCreate={create} onOpen={openJob} />}

      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Schedule as far out as you need — everything here syncs to the desktop calendar automatically.</div>

      {editor && <MJobEditor job={editor.job} slot={editor.slot} onClose={() => setEditor(null)} />}
    </div>
  );
}

Object.assign(window, { MobileCalendar, MJobEditor });

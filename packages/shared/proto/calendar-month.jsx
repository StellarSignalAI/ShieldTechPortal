/* Calendar — Month view (booking-style span bars) + New Job modal.
   All data passed via props from CalendarScreen (screen-calendar.jsx). */

function CalMonthView({ jobs, techs, drag, monthGhost, conflicts, selectedId, getJobColor, spanOf, calFmtH, beginDrag, onSelectJob, onCellClick, didDrag }) {
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const [hoverBar, setHoverBar] = React.useState(null);

  // Greedy lane assignment (jobs repeat weekly, so lanes are computed once)
  const lanes = React.useMemo(() => {
    const sorted = [...jobs].sort((a, b) => a.day - b.day || spanOf(b) - spanOf(a));
    const laneEnds = []; // last occupied endDay per lane
    const map = {};
    sorted.forEach(j => {
      const end = j.endDay || j.day;
      let lane = laneEnds.findIndex(e => e < j.day);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(end); }
      else laneEnds[lane] = end;
      map[j.id] = lane;
    });
    return { map, count: laneEnds.length };
  }, [jobs, spanOf]);

  const LANE_H = 24, HEADER_H = 34;
  const rowMinH = Math.max(96, HEADER_H + Math.min(lanes.count, 7) * LANE_H + 10);

  // June 2026 grid
  const monthWeeks = React.useMemo(() => {
    const first = new Date(2026, 5, 1);
    const startMon = new Date(first);
    startMon.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 5 }, (_, w) => Array.from({ length: 7 }, (_, d) => {
      const date = new Date(startMon);
      date.setDate(startMon.getDate() + w * 7 + d);
      return { date, dayNum: d + 1, monthDay: date.getDate(), isCurrentMonth: date.getMonth() === 5 };
    }));
  }, []);
  const isToday = (d) => d.getDate() === 10 && d.getMonth() === 5;

  const ghostIn = (dayNum) => monthGhost && dayNum >= monthGhost.a && dayNum <= monthGhost.b;

  return (
    <div className="glass" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {dayLabels.map(d => (
          <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderLeft: '1px solid var(--border-subtle)' }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {monthWeeks.map((week, wi) => (
          <div key={wi} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)', minHeight: rowMinH }}>
            {/* Day cells (drop targets) */}
            {week.map((cell, di) => {
              const isT = isToday(cell.date);
              const isGhost = cell.isCurrentMonth && ghostIn(cell.dayNum);
              return (
                <div key={di} data-cal-day={cell.isCurrentMonth ? cell.dayNum : undefined}
                  onClick={() => { if (!didDrag() && cell.isCurrentMonth) onCellClick(cell.dayNum); }}
                  style={{ borderLeft: '1px solid var(--border-subtle)', padding: '6px 8px', background: isGhost ? 'rgba(63,169,245,0.08)' : isT ? 'rgba(63,169,245,0.04)' : 'transparent', opacity: cell.isCurrentMonth ? 1 : 0.3, cursor: 'pointer', transition: 'background 0.1s', outline: isGhost ? '1.5px dashed var(--brand)' : 'none', outlineOffset: -2 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: isT ? 700 : 400, color: isT ? 'var(--brand)' : 'var(--text-mid)', width: 22, height: 22, borderRadius: '50%', background: isT ? 'rgba(63,169,245,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cell.monthDay}</div>
                </div>
              );
            })}

            {/* Booking-style job bars */}
            {jobs.map(j => {
              const lane = lanes.map[j.id];
              if (lane === undefined || lane >= 7) return null;
              const span = spanOf(j);
              const tc = getJobColor(j);
              const unassigned = !j.techs || j.techs.length === 0;
              const isMoving = drag && ['job','span-left','span-right'].includes(drag.kind) && drag.job.id === j.id;
              const isSel = selectedId === j.id;
              const showHandles = hoverBar === j.id || isSel;
              const isTechHover = drag && drag.kind === 'tech' && drag.target && drag.target.area === 'month' && drag.target.day >= j.day && drag.target.day <= (j.endDay || j.day) && drag.target.overBarId === j.id;
              return (
                <div key={j.id}
                  data-cal-bar={j.id}
                  onMouseEnter={() => setHoverBar(j.id)}
                  onMouseLeave={() => setHoverBar(h => h === j.id ? null : h)}
                  onMouseDown={e => {
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    const dayOffset = Math.floor((e.clientX - r.left) / (r.width / span));
                    beginDrag(e, { kind: 'job', job: j, dayOffset, grabOffset: 0 });
                  }}
                  onClick={e => { e.stopPropagation(); if (!didDrag()) onSelectJob(j); }}
                  title={`${j.title} · ${calFmtH(j.start)}–${calFmtH(j.start + j.dur)}${span > 1 ? ` · ${span} days` : ''} — drag to move, drag end handles to change dates`}
                  style={{ position: 'absolute', top: HEADER_H + lane * LANE_H, left: `calc(${(j.day - 1) / 7 * 100}% + 4px)`, width: `calc(${span / 7 * 100}% - 8px)`, height: LANE_H - 5,
                    background: tc.bg, border: `1px ${unassigned ? 'dashed' : 'solid'} ${isTechHover ? drag.tech.color : tc.border}`, borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 5, padding: '0 9px', cursor: 'grab', overflow: 'visible',
                    opacity: isMoving ? 0.35 : 1, zIndex: isSel || showHandles ? 6 : 3,
                    boxShadow: isTechHover ? `0 0 0 2px ${drag.tech.color}` : isSel ? `0 0 0 2px ${tc.border}` : conflicts.includes(j.id) ? '0 0 0 1.5px var(--status-warn)' : 'none',
                    transition: 'box-shadow 0.1s, opacity 0.15s' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: tc.border, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, lineHeight: 1 }}>
                    {unassigned ? '◌ ' : ''}{j.title.split('—')[0].trim()}
                  </span>
                  {span > 1 && <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)', flexShrink: 0 }}>{span}d</span>}

                  {/* Booking handles: start day / end day */}
                  {showHandles && (
                    <>
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'span-left', job: j }); }} onClick={e => e.stopPropagation()}
                        title="Drag to change start day"
                        style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface, #0B1117)', border: `2px solid ${tc.border}`, cursor: 'ew-resize', zIndex: 7 }}></div>
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'span-right', job: j }); }} onClick={e => e.stopPropagation()}
                        title="Drag to change end day"
                        style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface, #0B1117)', border: `2px solid ${tc.border}`, cursor: 'ew-resize', zIndex: 7 }}></div>
                    </>
                  )}
                </div>
              );
            })}
            {lanes.count > 7 && <div style={{ position: 'absolute', bottom: 2, right: 8, fontSize: 9, color: 'var(--text-low)' }}>+{lanes.count - 7} more</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── New Job Modal (multi-tech chips) ── */
function NewJobModal({ techs, typeColors, initialSlot, onClose, onCreate, calFmtH }) {
  const customers = ['Metro Bank Corp','Riverside Medical','City Hall','Acme Dental','Harbor View Condos','Pacific Rim Hotels','Westfield Mall','Embarcadero Partners','Golden Gate Logistics','Sutter Health','Internal'];
  const [form, setForm] = React.useState({
    title: '', customer: customers[0], techs: initialSlot?.techs || (initialSlot?.tech ? [initialSlot.tech] : []),
    type: 'install', day: initialSlot?.day || 1, days: 1, start: initialSlot?.start ?? 9, dur: initialSlot?.dur || 2, value: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTech = (id) => setForm(p => ({ ...p, techs: p.techs.includes(id) ? p.techs.filter(t => t !== id) : [...p.techs, id] }));
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const submit = () => {
    if (!form.title) return;
    const day = parseInt(form.day);
    const endDay = Math.min(7, day + parseInt(form.days) - 1);
    onCreate({ id: Date.now(), title: form.title, customer: form.customer, techs: form.techs, type: form.type, day, endDay, start: parseFloat(form.start), dur: parseFloat(form.dur), value: parseFloat(form.value) || 0 });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, backdropFilter: 'blur(4px)' }}></div>
      <div className="glass" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 480, zIndex: 901, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>Schedule New Job</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={calLabelStyle}>Job Title *</div>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. City Hall — Access Control Install" style={calInputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 2 }}>
            <div style={calLabelStyle}>Customer</div>
            <select value={form.customer} onChange={e => set('customer', e.target.value)} style={calSelStyle}>
              {customers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Type</div>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={calSelStyle}>
              {Object.keys(typeColors).map(t => <option key={t} value={t}>{typeColors[t].label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={calLabelStyle}>Technicians {form.techs.length === 0 && <span style={{ color: 'var(--status-warn)', textTransform: 'none', letterSpacing: 0 }}>— none selected (job will be unassigned)</span>}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {techs.map(t => {
              const on = form.techs.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggleTech(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 5px', borderRadius: 16, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, transition: 'all 0.12s', background: on ? `${t.color}1c` : 'rgba(63,169,245,0.04)', border: `1px solid ${on ? t.color + '70' : 'var(--border-subtle)'}`, color: on ? t.color : 'var(--text-low)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${t.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: t.color }}>{t.id}</span>
                  {t.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Start Day</div>
            <select value={form.day} onChange={e => set('day', e.target.value)} style={calSelStyle}>
              {days.map((d, i) => <option key={i} value={i+1}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Length (days)</div>
            <select value={form.days} onChange={e => set('days', e.target.value)} style={calSelStyle}>
              {[1,2,3,4,5].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Start Time</div>
            <select value={form.start} onChange={e => set('start', e.target.value)} style={calSelStyle}>
              {Array.from({length:26},(_,i)=>6+i*0.5).map(h => <option key={h} value={h}>{calFmtH(h)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Hours / day</div>
            <select value={form.dur} onChange={e => set('dur', e.target.value)} style={calSelStyle}>
              {[0.5,1,1.5,2,2.5,3,3.5,4,5,6,7,8].map(d => <option key={d} value={d}>{d}h</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Value ($)</div>
            <input value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" style={calInputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={submit} disabled={!form.title} style={{ flex: 2, padding: '9px 0', background: form.title ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.04)', border: `1px solid ${form.title ? 'var(--border-strong)' : 'var(--border-subtle)'}`, borderRadius: 7, color: form.title ? 'var(--brand)' : 'var(--text-low)', fontSize: 12, fontWeight: 600, cursor: form.title ? 'pointer' : 'default', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>Schedule Job</button>
        </div>
      </div>
    </>
  );
}

const calLabelStyle = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 5 };
const calInputStyle = { width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
const calSelStyle = { width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 10px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' };

Object.assign(window, { CalMonthView, NewJobModal });

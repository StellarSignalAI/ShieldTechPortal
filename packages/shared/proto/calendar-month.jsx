/* Calendar — Month view (booking-style span bars, ANY month/year) + New Job
   modal. Jobs carry real ISO dates; bars are positioned per week row from
   date/endDate, so multi-week and multi-month spans render correctly.
   All data passed via props from CalendarScreen (screen-calendar.jsx). */

function CalMonthView({ jobs, techs, anchor, drag, monthGhost, conflicts, selectedId, getJobColor, calFmtH, beginDrag, onSelectJob, onCellClick, didDrag }) {
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const [hoverBar, setHoverBar] = React.useState(null);

  // Month grid: 6 Monday-anchored week rows covering the anchor month.
  const monthWeeks = React.useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const startMon = new Date(first);
    startMon.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => {
      const date = new Date(startMon);
      date.setDate(startMon.getDate() + w * 7 + d);
      return { date, iso: isoOfDate(date), monthDay: date.getDate(), isCurrentMonth: date.getMonth() === anchor.getMonth() };
    }));
  }, [anchor]);
  const tISO = todayISO();

  const LANE_H = 24, HEADER_H = 34;

  // Per-row job segments + greedy lane assignment.
  const rows = React.useMemo(() => monthWeeks.map(week => {
    const w0 = week[0].iso, w6 = week[6].iso;
    const segs = jobs
      .map(j => {
        const s = jobStartISO(j), e = jobEndISO(j);
        if (e < w0 || s > w6) return null;
        const a = s < w0 ? w0 : s, b = e > w6 ? w6 : e;
        return { j, col: diffDaysISO(w0, a) + 1, span: diffDaysISO(a, b) + 1, clippedL: s < w0, clippedR: e > w6, renderStartISO: a };
      })
      .filter(Boolean)
      .sort((x, y) => x.col - y.col || y.span - x.span);
    const laneEnds = [];
    segs.forEach(seg => {
      let lane = laneEnds.findIndex(end => end < seg.col);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(seg.col + seg.span - 1); }
      else laneEnds[lane] = seg.col + seg.span - 1;
      seg.lane = lane;
    });
    return { week, segs, laneCount: laneEnds.length };
  }), [monthWeeks, jobs]);

  const ghostIn = (iso) => monthGhost && iso >= monthGhost.a && iso <= monthGhost.b;

  return (
    <div className="glass" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {dayLabels.map(d => (
          <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderLeft: '1px solid var(--border-subtle)' }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.map(({ week, segs, laneCount }, wi) => {
          const rowMinH = Math.max(96, HEADER_H + Math.min(laneCount, 7) * LANE_H + 10);
          return (
            <div key={wi} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)', minHeight: rowMinH }}>
              {/* Day cells (drop targets carry their ISO date) */}
              {week.map((cell, di) => {
                const isT = cell.iso === tISO;
                const isGhost = ghostIn(cell.iso);
                return (
                  <div key={di} data-cal-day={cell.iso}
                    onClick={() => { if (!didDrag()) onCellClick(cell.iso); }}
                    style={{ borderLeft: '1px solid var(--border-subtle)', padding: '6px 8px', background: isGhost ? 'rgba(63,169,245,0.08)' : isT ? 'rgba(63,169,245,0.04)' : 'transparent', opacity: cell.isCurrentMonth ? 1 : 0.35, cursor: 'pointer', transition: 'background 0.1s', outline: isGhost ? '1.5px dashed var(--brand)' : 'none', outlineOffset: -2 }}>
                    <div className="mono" style={{ fontSize: 12, fontWeight: isT ? 700 : 400, color: isT ? 'var(--brand)' : 'var(--text-mid)', width: 22, height: 22, borderRadius: '50%', background: isT ? 'rgba(63,169,245,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cell.monthDay}</div>
                  </div>
                );
              })}

              {/* Booking-style job bars (segments of real date spans) */}
              {segs.map(seg => {
                const { j, col, span, lane, clippedL, clippedR, renderStartISO } = seg;
                if (lane >= 7) return null;
                const tc = getJobColor(j);
                const unassigned = !j.techs || j.techs.length === 0;
                const totalSpan = jobSpanDays(j);
                const isMoving = drag && ['job','span-left','span-right'].includes(drag.kind) && drag.job.id === j.id;
                const isSel = selectedId === j.id;
                const showHandles = hoverBar === j.id || isSel;
                const isTechHover = drag && drag.kind === 'tech' && drag.target && drag.target.area === 'month' && drag.target.overBarId === j.id;
                return (
                  <div key={`${j.id}-${wi}`}
                    data-cal-bar={j.id}
                    onMouseEnter={() => setHoverBar(j.id)}
                    onMouseLeave={() => setHoverBar(h => h === j.id ? null : h)}
                    onMouseDown={e => {
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      const intoSeg = Math.floor((e.clientX - r.left) / (r.width / span));
                      const dayOffset = diffDaysISO(jobStartISO(j), renderStartISO) + intoSeg;
                      beginDrag(e, { kind: 'job', job: j, dayOffset, grabOffset: 0 });
                    }}
                    onClick={e => { e.stopPropagation(); if (!didDrag()) onSelectJob(j); }}
                    title={`${j.title} · ${calFmtH(j.start)}–${calFmtH(j.start + j.dur)}${totalSpan > 1 ? ` · ${totalSpan} days` : ''} — drag to move, drag end handles to change dates`}
                    style={{ position: 'absolute', top: HEADER_H + lane * LANE_H, left: `calc(${(col - 1) / 7 * 100}% + 4px)`, width: `calc(${span / 7 * 100}% - 8px)`, height: LANE_H - 5,
                      background: tc.bg, border: `1px ${unassigned ? 'dashed' : 'solid'} ${isTechHover ? drag.tech.color : tc.border}`,
                      borderRadius: 10, borderTopLeftRadius: clippedL ? 2 : 10, borderBottomLeftRadius: clippedL ? 2 : 10, borderTopRightRadius: clippedR ? 2 : 10, borderBottomRightRadius: clippedR ? 2 : 10,
                      display: 'flex', alignItems: 'center', gap: 5, padding: '0 9px', cursor: 'grab', overflow: 'visible',
                      opacity: isMoving ? 0.35 : 1, zIndex: isSel || showHandles ? 6 : 3,
                      boxShadow: isTechHover ? `0 0 0 2px ${drag.tech.color}` : isSel ? `0 0 0 2px ${tc.border}` : conflicts.includes(j.id) ? '0 0 0 1.5px var(--status-warn)' : 'none',
                      transition: 'box-shadow 0.1s, opacity 0.15s' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: tc.border, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, lineHeight: 1 }}>
                      {clippedL ? '… ' : ''}{unassigned ? '◌ ' : ''}{j.title.split('—')[0].trim()}{clippedR ? ' …' : ''}
                    </span>
                    {totalSpan > 1 && !clippedR && <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)', flexShrink: 0 }}>{totalSpan}d</span>}

                    {/* Booking handles: real start / end of the whole job */}
                    {showHandles && !clippedL && (
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'span-left', job: j }); }} onClick={e => e.stopPropagation()}
                        title="Drag to change start date"
                        style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface, #0B1117)', border: `2px solid ${tc.border}`, cursor: 'ew-resize', zIndex: 7 }}></div>
                    )}
                    {showHandles && !clippedR && (
                      <div onMouseDown={e => { e.stopPropagation(); beginDrag(e, { kind: 'span-right', job: j }); }} onClick={e => e.stopPropagation()}
                        title="Drag to change end date"
                        style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface, #0B1117)', border: `2px solid ${tc.border}`, cursor: 'ew-resize', zIndex: 7 }}></div>
                    )}
                  </div>
                );
              })}
              {laneCount > 7 && <div style={{ position: 'absolute', bottom: 2, right: 8, fontSize: 9, color: 'var(--text-low)' }}>+{laneCount - 7} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── New Job Modal (real date + real technicians) ── */
function NewJobModal({ techs, typeColors, initialSlot, onClose, onCreate, calFmtH }) {
  const customers = [...new Set([...(typeof shieldCustomerNames === 'function' ? shieldCustomerNames() : []), 'Internal'])];
  const [form, setForm] = React.useState({
    title: '', customer: customers[0] || '', techs: initialSlot?.techs || (initialSlot?.tech ? [initialSlot.tech] : []),
    type: 'install', date: initialSlot?.date || todayISO(), days: 1, start: initialSlot?.start ?? 9, dur: initialSlot?.dur || 2, value: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTech = (id) => setForm(p => ({ ...p, techs: p.techs.includes(id) ? p.techs.filter(t => t !== id) : [...p.techs, id] }));

  const submit = () => {
    if (!form.title || !form.date) return;
    const days = parseInt(form.days) || 1;
    onCreate(normalizeJobDates({
      id: Date.now(), title: form.title, customer: form.customer, techs: form.techs,
      techIds: form.techs.map(id => (techs.find(t => t.id === id) || {}).uid).filter(Boolean),
      type: form.type, date: form.date, endDate: addDaysISO(form.date, days - 1),
      start: parseFloat(form.start), dur: parseFloat(form.dur), value: parseFloat(form.value) || 0,
    }));
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
              {customers.length === 0 && <option value="">—</option>}
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
                  {(t.name || '').split(' ')[0]}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 5 }}>These are your real users — add technicians in Admin → Users &amp; Invites.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1.4 }}>
            <div style={calLabelStyle}>Start Date</div>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ ...calInputStyle, colorScheme: 'dark' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={calLabelStyle}>Length (days)</div>
            <select value={form.days} onChange={e => set('days', e.target.value)} style={calSelStyle}>
              {[1,2,3,4,5,6,7,10,14,21,30].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>
        {parseInt(form.days) > 1 && form.date && (
          <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: -6, marginBottom: 12 }}>
            {dateOfISO(form.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {dateOfISO(addDaysISO(form.date, (parseInt(form.days) || 1) - 1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
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
          <button onClick={submit} disabled={!form.title || !form.date} style={{ flex: 2, padding: '9px 0', background: form.title && form.date ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.04)', border: `1px solid ${form.title && form.date ? 'var(--border-strong)' : 'var(--border-subtle)'}`, borderRadius: 7, color: form.title && form.date ? 'var(--brand)' : 'var(--text-low)', fontSize: 12, fontWeight: 600, cursor: form.title && form.date ? 'pointer' : 'default', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>Schedule Job</button>
        </div>
      </div>
    </>
  );
}

const calLabelStyle = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 5 };
const calInputStyle = { width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
const calSelStyle = { width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '8px 10px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' };

Object.assign(window, { CalMonthView, NewJobModal });

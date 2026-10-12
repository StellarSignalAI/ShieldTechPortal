/* Technician Field App — Mobile Components */

/* ── Today View ── */
function TodayView({ setTab, setSelectedJob }) {
  /* REAL feed: dispatched work orders + calendar jobs from the shared synced
     stores (the same rows the portal's Dispatch/Calendar write). Filters to
     this tech when identity matches; otherwise shows the whole crew's day so
     the screen is never silently empty. */
  const [wos] = useShieldStore(workOrderStore);
  const [calJobs] = useShieldStore(jobStore);
  const me = window.__shieldUser || {};
  const myInitials = (me.name || '').split(' ').map(w => w[0]).join('').toUpperCase();
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayIdx = ((new Date().getDay() + 6) % 7) + 1;
  const fmtTime = (h) => { const hr = Math.floor(h || 8); const m = Math.round(((h || 8) - hr) * 60); const ap = hr >= 12 ? 'PM' : 'AM'; const h12 = ((hr + 11) % 12) + 1; return `${h12}:${String(m).padStart(2, '0')} ${ap}`; };

  const mapWo = (w, time) => ({ id: w.id, sort: 0, time, customer: w.customer, desc: w.scope || w.type || 'Work order',
    site: w.site || '', details: w.notes || '', status: (w.status === 'done' || w.status === 'completed') ? 'completed' : w.status === 'active' ? 'active' : 'upcoming',
    mine: (me.id && w.assignedTo === me.id) || (myInitials && w.techId === myInitials), _wo: w });
  const mapCal = (j) => ({ id: 'cal-' + j.id, sort: j.start || 8, time: fmtTime(j.start), customer: j.customer || j.title || 'Scheduled job', desc: j.title || j.type || '',
    site: j.addr || j.site || '', details: j.details || '', scope: j.scope || '', status: 'upcoming',
    mine: (me.id && (j.techIds || []).includes(me.id)) || (myInitials && (j.techs || []).includes(myInitials)), _cal: j });

  const woToday = (wos || []).filter(w => w.scheduled === todayIso || w.status === 'active')
    .map(w => mapWo(w, w.status === 'active' ? 'Now' : 'Today'));
  const calToday = (calJobs || []).filter(j => jobOnISO(j, todayIso)).map(mapCal);
  const all = [...woToday, ...calToday].sort((a, b) => a.sort - b.sort);
  const mineOnly = all.filter(j => j.mine);
  const jobs = mineOnly.length ? mineOnly : all;

  /* Upcoming days — the tech sees scheduled days ahead of time, right on the
     home screen. Each row opens the full job overview. */
  const upcomingDays = [];
  for (let d = 1; d <= 14; d++) {
    const iso = addDaysISO(todayIso, d);
    const dayRows = [
      ...(wos || []).filter(w => w.scheduled === iso).map(w => mapWo(w, 'Scheduled')),
      ...(calJobs || []).filter(j => jobOnISO(j, iso)).map(mapCal),
    ].sort((a, b) => a.sort - b.sort);
    const dayMine = dayRows.filter(j => j.mine);
    const show = (mineOnly.length || dayMine.length) ? dayMine : dayRows;
    if (show.length) upcomingDays.push({ iso, rows: show });
  }
  const fmtDay = (iso) => { const dt = new Date(iso + 'T12:00:00'); return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };

  // ── ShieldTech dark design language (local palette, self-contained) ──
  const F = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, monospace";
  const CARD = 'var(--card)', BORDER = 'rgba(255,255,255,0.08)';
  const FG = '#FAFAFB', FG2 = '#A1A0A6', FG3 = '#656365';
  const ACC = 'var(--brand)', ACC_LT = '#A2A3ED', OK = '#4ED99A';
  const statusColors = { completed: OK, active: ACC, upcoming: FG3 };
  const lbl = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FG3, marginBottom: 11 };

  const done = jobs.filter(j => j.status === 'completed').length;
  const total = jobs.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const hoursTot = jobs.reduce((s, j) => s + (Number(j._cal && j._cal.dur) || 0), 0);
  const sites = new Set(jobs.map(j => j.customer)).size;
  const RC = 2 * Math.PI * 26; // progress-ring circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F, color: FG }}>
      {/* Hero — today's progress (ring) */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 20, color: '#fff',
        background: 'linear-gradient(135deg, var(--brand) 0%, #8B7BFF 100%)',
        boxShadow: '0 18px 40px -20px rgba(var(--brand-rgb),0.6)', animation: 'fade-up 0.4s ease both'
      }}>
        <div style={{ position: 'absolute', right: -42, top: -42, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85 }}>Today's progress</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{done}<span style={{ fontSize: 16, opacity: 0.8 }}> / {total} job{total === 1 ? '' : 's'}</span></div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{total ? `${total - done} remaining · on schedule` : 'Nothing scheduled today'}</div>
          </div>
          <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r="26" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="8" />
              <circle cx="36" cy="36" r="26" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeDasharray={RC} strokeDashoffset={RC * (1 - pct / 100)} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 15 }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, position: 'relative' }}>
          {[['Hours', hoursTot > 0 ? hoursTot + 'h' : '—'], ['Sites', String(sites)], ['Jobs left', String(total - done)]].map(([k, v], i) => (
            <div key={i} style={{ flex: 1, background: 'rgba(0,0,0,0.14)', borderRadius: 12, padding: '8px 10px' }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>{k}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's schedule */}
      <div>
        <div style={lbl}>Today's schedule</div>
        {jobs.length === 0 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 26, textAlign: 'center', color: FG3, fontSize: 12 }}>
            No jobs assigned today — dispatched work appears here.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map((job, i) => (
            <div key={i} onClick={() => { setSelectedJob(job); setTab('job-detail'); }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', animation: `fade-up 0.4s ease ${(i + 2) * 70}ms both` }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flex: 'none',
                border: `2px solid ${statusColors[job.status]}`, background: job.status === 'completed' ? OK : 'transparent',
                boxShadow: job.status === 'active' ? `0 0 8px ${ACC}` : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: FG3 }}>{job.time}</span>
                  {job.status === 'active' && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 100, background: 'rgba(var(--brand-rgb),0.16)', color: ACC_LT, letterSpacing: '0.04em' }}>Current</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{job.customer}</div>
                <div style={{ fontSize: 12, color: FG2, marginTop: 1 }}>{job.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  {job.site && <span style={{ fontSize: 11, color: FG3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>⌖ {job.site}</span>}
                  {job.status === 'upcoming' && (
                    <button onClick={e => {
                      e.stopPropagation();
                      const dest = job.site || job.customer || '';
                      if (!dest) { showToast('No site address on this job — ask dispatch', 'warn'); return; }
                      shieldDirections({ address: dest });
                    }} style={{ marginLeft: 'auto', padding: '4px 11px', background: 'rgba(var(--brand-rgb),0.12)', border: '1px solid rgba(var(--brand-rgb),0.3)', borderRadius: 100, color: ACC_LT, fontSize: 10, cursor: 'pointer', fontFamily: F, flex: 'none' }}>Navigate →</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming days — scheduled work ahead of time, tap any job for the overview */}
      <div>
        <div style={lbl}>Upcoming · next 14 days</div>
        {upcomingDays.length === 0 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, textAlign: 'center', color: FG3, fontSize: 12 }}>
            Nothing scheduled ahead yet — future jobs from the office appear here.
          </div>
        )}
        {upcomingDays.map(day => (
          <div key={day.iso} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: ACC_LT }}>{fmtDay(day.iso)}</span>
              <span style={{ flex: 1, height: 1, background: BORDER }}></span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: FG3 }}>{day.rows.length} job{day.rows.length === 1 ? '' : 's'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {day.rows.map((job, i) => (
                <div key={i} onClick={() => { setSelectedJob(job); setTab('job-detail'); }}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '11px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{job.customer}</div>
                    <div style={{ fontSize: 11, color: FG2, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.desc}</div>
                    {(job.site || job.details) && (
                      <div style={{ fontSize: 10, color: FG3, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.site ? `⌖ ${job.site}` : ''}{job.site && job.details ? ' · ' : ''}{job.details}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: FG3 }}>{job.time}</div>
                    <div style={{ fontSize: 12, color: ACC_LT, marginTop: 4 }}>Overview →</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* This week — live counts from the shared calendar store */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 16 }}>
        <div style={lbl}>This week</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => {
            const dayN = i + 1;
            const dayISO = addDaysISO(isoOfDate(mondayOf(new Date())), i);
            const count = (calJobs || []).filter(j => jobOnISO(j, dayISO) && (!mineOnly.length || (me.id && (j.techIds || []).includes(me.id)) || (myInitials && (j.techs || []).includes(myInitials)))).length;
            const isNow = dayN === todayIdx;
            return (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12,
                background: isNow ? 'rgba(var(--brand-rgb),0.12)' : 'transparent',
                border: isNow ? '1px solid rgba(var(--brand-rgb),0.4)' : '1px solid transparent'
              }}>
                <div style={{ fontSize: 10, color: FG3 }}>{d}</div>
                <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: isNow ? ACC_LT : FG, marginTop: 3 }}>{count}</div>
                <div style={{ fontSize: 9, color: FG3, marginTop: 1 }}>jobs</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Job Detail View ── */
function JobDetailView({ job, setTab }) {
  /* Job status PERSISTS to the shared stores — dispatch/portal see progress
     live instead of a phone-local useState that vanished on tab switch. */
  const persisted = (job && ((job._wo && job._wo.fieldStatus) || (job._cal && job._cal.fieldStatus))) || 'en-route';
  const [status, setStatusLocal] = React.useState(persisted);
  const setStatus = (s) => {
    setStatusLocal(s);
    if (job && job._wo) workOrderStore.set(list => (list || []).map(w => w.id === job._wo.id
      ? { ...w, fieldStatus: s, status: s === 'complete' ? 'done' : (w.status === 'done' ? 'done' : 'active') } : w));
    if (job && job._cal) jobStore.set(list => (list || []).map(j => j.id === job._cal.id ? { ...j, fieldStatus: s } : j));
  };
  /* Real photos: shots for this job from the shared photoStore; each tile
     opens the live camera (capture tab) pre-targeted at this work order.
     createShieldStore is singleton-per-key, so 'techcam' is the same store
     the capture screen reads. */
  const [allPhotos] = useShieldStore(photoStore);
  const [cam, setCam] = useShieldStore(createShieldStore('techcam', { wo: null, slot: null }));
  const woId = job ? ((job._wo && job._wo.id) || (job._cal && job._cal.wo) || (/^WO-/.test(String(job.id)) ? job.id : null)) : null;
  const jobProjectId = (job && job._cal && job._cal.projectId) || null;
  const jobPhotos = (allPhotos || []).filter(p => (woId && p.wo === woId) || (jobProjectId && p.projectId === jobProjectId));
  // The camera opens pre-tagged: work order AND project (if the job came from
  // one), so shots land on the project for the office automatically.
  const openCamera = () => { setCam({ ...cam, wo: woId || '__unassigned', slot: null, project: jobProjectId || cam.project || null }); setTab('capture'); };
  const PHASE_TILES = [['Before', 'before'], ['During', 'progress'], ['After', 'after'], ['Issue', 'issue']];
  /* Checklist ticks persist per job in the synced woCheckStore — they survive
     navigation and the office sees progress. The WO's own checklist wins when
     it carries one; otherwise the generic install list. */
  const [woCheck, setWoCheck] = useShieldStore(woCheckStore);
  const checkKey = job ? String(woId || job.id) : '';
  const checkLabels = (job && job._wo && Array.isArray(job._wo.checklist) && job._wo.checklist.length)
    ? job._wo.checklist
    : ['Verify scope with customer', 'Check existing cable runs', 'Mount / position devices',
       'Terminate & label cables', 'Configure on network', 'Test all devices',
       'Clean up & photograph', 'Customer sign-off'];
  const ticks = (woCheck || {})[checkKey] || {};
  const checklist = checkLabels.map(label => ({ label, done: !!ticks[label] }));
  const toggleCheck = (label) => setWoCheck(prev => {
    const cur = (prev || {})[checkKey] || {};
    return { ...(prev || {}), [checkKey]: { ...cur, [label]: !cur[label] } };
  });

  const statusSteps = ['en-route','on-site','in-progress','paused','complete'];

  /* Equipment lines from the WO's real materials (name/qty/used) when it has
     them — never placeholder rows. */
  const bom = (job && job.bom)
    || (job && job._wo && Array.isArray(job._wo.materials) && job._wo.materials.length
        ? job._wo.materials.map(m => ({ name: m.name, qty: Number(m.qty) || 0, installed: Number(m.used) || 0 }))
        : []);

  /* Site contact/access from whatever the job actually carries, falling back
     to the customer record's contact info. */
  const [custListJd] = useShieldStore(customerStore);
  const custRec = job ? (custListJd || []).find(c => c.name && c.name === job.customer) || null : null;
  const siteContact = (job && (job.contact || (job._cal && job._cal.contact) || (job._wo && job._wo.contact))) || (custRec && custRec.contact) || '';
  const sitePhone = (job && (job.phone || (job._cal && job._cal.phone) || (job._wo && job._wo.phone))) || (custRec && custRec.phone) || '';
  const accessNotes = (job && (job.accessNotes || (job._cal && job._cal.accessNotes) || (job._wo && job._wo.accessNotes))) || '';

  /* Project link: scheduled jobs built from a project carry projectId + scope.
     The project's blueprints open in the markup editor right from here. */
  const [projList] = useShieldStore(projectStore);
  const project = (job && job._cal && job._cal.projectId)
    ? (projList || []).find(p => p.number === job._cal.projectId) || null : null;
  const scope = (job && ((job._cal && job._cal.scope) || (job._wo && job._wo.scope))) || (project ? projectScope(project) : '');
  const drawings = (project && project.drawings) || [];
  const [openDrawing, setOpenDrawing] = React.useState(null);

  if (!job) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Back to Today</button>
        <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Select a job from Today to see its details.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Back + header */}
      <button onClick={() => setTab('today')} style={{
        background: 'none', border: 'none', color: 'var(--brand)',
        fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
        padding: 0, textAlign: 'left'
      }}>← Back to Today</button>

      <GlassPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{job.id}</span>
          <StatusBadge status="info" label={status.replace('-', ' ')} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{job.customer}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 4 }}>{job.desc}</p>
        <p style={{ fontSize: 11, color: 'var(--text-low)' }}>
          ⌖ {job.site || 'No address on file'} · {job._cal && job._cal.date ? `${new Date(job._cal.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ` : ''}{job.time}
        </p>
        {job.site && (
          <button onClick={() => shieldDirections({ address: job.site })}
            style={{ marginTop: 8, padding: '6px 14px', background: 'rgba(var(--brand-rgb),0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Navigate →</button>
        )}

        {/* Status workflow */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {statusSteps.map((s, i) => {
            const idx = statusSteps.indexOf(status);
            return (
              <button key={i} onClick={() => setStatus(s)} style={{
                flex: 1, padding: '6px 0', fontSize: 9, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: i <= idx ? 'rgba(var(--brand-rgb),0.12)' : 'rgba(var(--brand-rgb),0.03)',
                border: i === idx ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                color: i <= idx ? 'var(--brand)' : 'var(--text-low)'
              }}>{s.replace('-',' ')}</button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Job details — access instructions, parking, contacts from dispatch */}
      {(() => {
        const details = (job._cal && job._cal.details) || (job._wo && job._wo.notes) || job.details || '';
        return details ? (
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 8 }}>JOB DETAILS</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-high)', whiteSpace: 'pre-wrap' }}>{details}</div>
          </GlassPanel>
        ) : null;
      })()}

      {/* Scope of work — carried from the accepted proposal via the project */}
      {scope && (
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 8 }}>SCOPE OF WORK{project ? <span style={{ color: 'var(--text-low)', marginLeft: 6 }}>· {project.number}</span> : null}</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-high)', whiteSpace: 'pre-wrap' }}>{scope}</div>
        </GlassPanel>
      )}

      {/* Blueprints — open the digital drawing, mark it up, knock items off */}
      {drawings.length > 0 && (
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 8 }}>BLUEPRINTS &amp; DRAWINGS</div>
          <BlueprintRows drawings={drawings} onOpen={setOpenDrawing} />
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8 }}>Tap a drawing to open it — draw wire paths, drop device icons, highlight, add notes, and check items off as you install. The office sees your markup live.</div>
        </GlassPanel>
      )}
      {openDrawing && <BlueprintEditor drawing={openDrawing} onClose={() => setOpenDrawing(null)} />}

      {/* Contact + access — hidden entirely when the job carries no data */}
      {(siteContact || sitePhone || accessNotes) && (
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>SITE ACCESS</div>
        {(siteContact || sitePhone) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: accessNotes ? 10 : 0 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Contact</div>
            <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{siteContact || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Phone</div>
            <span className="mono" style={{ fontSize: 13, color: 'var(--brand)' }}>{sitePhone || '—'}</span>
          </div>
        </div>
        )}
        {accessNotes && (
        <div style={{ fontSize: 12, color: 'var(--text-mid)', padding: '8px 10px', background: 'rgba(var(--brand-rgb),0.03)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
          {accessNotes}
        </div>
        )}
      </GlassPanel>
      )}

      {/* Equipment BOM — hidden when the job has no equipment lines */}
      {bom.length > 0 && (
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>EQUIPMENT</div>
        {bom.map((b, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: i < bom.length - 1 ? '1px solid rgba(var(--brand-rgb),0.04)' : 'none'
          }}>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{b.name}</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{b.installed}/{b.qty}</span>
            <MiniBar value={b.installed} max={b.qty} width={50} />
          </div>
        ))}
      </GlassPanel>
      )}

      {/* Checklist */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 10 }}>INSTALL CHECKLIST</div>
        {checklist.map((c, i) => (
          <label key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: '1px solid rgba(var(--brand-rgb),0.04)', cursor: 'pointer'
          }}>
            <div onClick={() => toggleCheck(c.label)} style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              border: c.done ? 'none' : '1.5px solid var(--border-strong)',
              background: c.done ? 'var(--brand)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff', cursor: 'pointer'
            }}>{c.done ? '✓' : ''}</div>
            <span style={{
              fontSize: 13, color: c.done ? 'var(--text-low)' : 'var(--text-high)',
              textDecoration: c.done ? 'line-through' : 'none'
            }}>{c.label}</span>
          </label>
        ))}
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 8 }}>
          {checklist.filter(c => c.done).length} / {checklist.length} complete
        </div>
      </GlassPanel>

      {/* Photo capture — tiles open the live camera aimed at this job; filled
          tiles show the newest shot of that phase from the shared photo roll. */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>PHOTOS</span>
          {jobPhotos.length > 0 && <span style={{ color: 'var(--text-low)' }}>{jobPhotos.length} on this job</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {PHASE_TILES.map(([label, phase]) => {
            const shot = jobPhotos.find(p => p.phase === phase);
            return shot ? (
              <MockPhoto key={label} photo={shot} stamp={false} onClick={openCamera}
                style={{ aspectRatio: '1', borderRadius: 8, border: '1px solid var(--border-strong)', cursor: 'pointer' }}>
                <span style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 8, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase' }}>{label}</span>
              </MockPhoto>
            ) : (
              <div key={label} onClick={openCamera} style={{
                aspectRatio: '1', borderRadius: 8,
                border: '1px dashed var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', gap: 4
              }}>
                <span style={{ fontSize: 20, opacity: 0.3 }}>◉</span>
                <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{label}</span>
              </div>
            );
          })}
        </div>
        <button onClick={openCamera} style={{
          width: '100%', marginTop: 10, padding: '10px', background: 'rgba(var(--brand-rgb),0.08)',
          border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--brand)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>◉ Add Photo</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span>⟡</span>
          <span style={{ fontSize: 11, color: 'var(--brand)' }}>ShieldTech AI Photo QA: {PHASE_TILES.filter(([, ph]) => jobPhotos.some(p => p.phase === ph)).length}/4 captured</span>
        </div>
      </GlassPanel>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => shieldModal({ kind: 'confirm', title: 'Put Alarm on Test', message: 'Place this site’s alarm system on test mode? The central monitoring station will be notified and signals will be ignored until you take it off test. Auto-restore after 2 hours.', confirmLabel: 'Put on Test', successMsg: 'Alarm placed on test — central station notified' })} style={{
          padding: '12px', background: 'rgba(var(--brand-rgb),0.08)',
          border: '1px solid var(--border-strong)', borderRadius: 8,
          color: 'var(--brand)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>🛡 Put Alarm on Test</button>
        <button onClick={() => shieldModal({ kind: 'signature', title: 'Capture Signature', subtitle: `Job ${job.id} — ${job.customer}`, signPrompt: 'Have the customer sign below to confirm the work is complete and acceptable.', submitLabel: 'Save & Complete Job', successMsg: 'Job completed — signature saved', onSave: async (dataUrl) => {
          /* The ink is REAL: upload it, attach the URL to the job/WO, and only
             then mark the job complete. A failed upload rejects — the modal
             stays open with the ink instead of silently discarding it. */
          if (dataUrl && window.__shieldStorage) {
            const r = await window.__shieldStorage.uploadDataUrl(dataUrl, {
              folder: 'signatures', entity: 'work_order', entityId: String(woId || job.id),
              name: `signature-${woId || job.id}.png`, shared: true,
            });
            if (!r || !r.ok) return { ok: false, error: (r && r.error) || 'Signature upload failed — check your connection and try again' };
            const url = r.url;
            if (url && job._wo) workOrderStore.set(list => (list || []).map(w => w.id === job._wo.id ? { ...w, signatureUrl: url, signedAt: Date.now() } : w));
            if (url && job._cal) jobStore.set(list => (list || []).map(j => j.id === job._cal.id ? { ...j, signatureUrl: url, signedAt: Date.now() } : j));
          }
          setStatus('complete');
          if (setTab) setTab('today');
          return { ok: true };
        } })} style={{
          padding: '12px', background: 'var(--brand)', border: 'none', borderRadius: 8,
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 0 16px -4px rgba(var(--brand-rgb),0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>✍ Capture Signature & Complete</button>
      </div>
    </div>
  );
}

/* ── Resources View ── */
function ResourcesView() {
  const folders = [];

  const recent = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Recent */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>RECENT</div>
        {recent.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '6px 0' }}>Nothing opened yet.</div>}
        {recent.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
            borderBottom: '1px solid rgba(var(--brand-rgb),0.04)', cursor: 'pointer'
          }}>
            <span style={{ fontSize: 14 }}>{r.type === 'article' ? '▤' : r.type === 'diagram' ? '△' : '▤'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{r.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.type} · {r.time}</div>
            </div>
            <span style={{ color: 'var(--text-low)', fontSize: 11 }}>★</span>
          </div>
        ))}
      </div>

      {/* Folders */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>FOLDERS</div>
        {folders.length === 0 && <div className="glass" style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 10 }}>No resources yet — guides, diagrams and SOPs uploaded from the portal appear here.</div>}
        {folders.map((f, i) => (
          <div key={i} className="glass" style={{
            padding: '12px 14px', marginBottom: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)'
          }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{f.name}</div>
              {f.children && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{f.children.join(' · ')}</div>}
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.count}</span>
            <span style={{ color: 'var(--text-low)' }}>›</span>
          </div>
        ))}
      </div>

      {/* Offline indicator */}
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: 'rgba(var(--brand-rgb),0.03)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <StatusDot status="online" size={6} />
        <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Offline caching keeps resources available in the field</span>
      </div>
    </div>
  );
}

Object.assign(window, { TodayView, JobDetailView, ResourcesView });

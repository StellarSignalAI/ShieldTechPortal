/* ShieldTech Widgets — Operations group
   Open Tickets · Device Monitoring · Work Orders · Today's Schedule · Fleet Map · Approvals */

const PRIO = { critical: '#F43F5E', high: '#FBBF24', medium: '#3FA9F5', low: '#5C6F86' };
const TECH_COLORS = { MR: '#3FA9F5', JL: '#34D399', KW: '#FBBF24', DP: '#c084fc', TG: '#F43F5E' };
const fmtH = h => `${((h + 11) % 12) + 1}${h < 12 ? 'AM' : 'PM'}`;

/* ─────────── Open Tickets / SLA ─────────── */
function WTickets({ size }) {
  const [tickets] = useShieldStore(ticketStore);
  const open = tickets.filter(t => t.status !== 'resolved');
  const byP = p => open.filter(t => t.priority === p).length;
  const buckets = ['critical', 'high', 'medium', 'low'];
  const atRisk = [...open].sort((a, b) => (a.sla?.remaining ?? 99) - (b.sla?.remaining ?? 99));
  const crit = byP('critical');
  return (
    <WCard size={size} accent={crit ? '#F43F5E' : '#3FA9F5'} title="Open Tickets" glyph="chat"
      sub={size !== 'small' ? `${open.length} active · SLA live` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={open.length} sub={null} color={crit ? '#F43F5E' : 'var(--text-high)'} />
          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-mid)' }}>
            <span style={{ color: PRIO.critical, fontWeight: 600 }}>{crit} critical</span> · {byP('high')} high
          </div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent="#3FA9F5" anchor={size === 'medium'} cells={buckets.map(p => ({ top: p[0].toUpperCase() + p.slice(1, 4), color: PRIO[p], bot: byP(p) }))} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {atRisk.slice(0, 4).map((t, i) => (
            <WRow key={t.id} last={i === 3} label={t.customer} glyph="clock" glyphColor={PRIO[t.priority]}
              a={t.sla ? `${t.sla.remaining}h` : '—'} b={t.id.replace('TK-', '#')} accent="#3FA9F5" />
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Device Monitoring & Incidents ─────────── */
function WMonitoring({ size }) {
  const [incidents] = useShieldStore(incidentStore);
  const active = incidents.filter(i => i.status === 'active');
  const health = 98 - active.length * 2;
  const sev = s => active.filter(i => i.severity === s).length;
  const accent = active.some(i => i.severity === 'P1') ? '#F43F5E' : active.length ? '#FBBF24' : '#34D399';
  return (
    <WCard size={size} accent={accent} title="Monitoring" glyph="topology"
      sub={size !== 'small' ? `${active.length} active incident${active.length !== 1 ? 's' : ''}` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
          <WRing pct={health} value={health + '%'} color={accent} size={70} />
          <div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: accent }}>{active.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>incidents</div>
          </div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'center' }}>
          <WRing pct={health} value={health + '%'} label="uptime" color={accent} size={78} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {active.slice(0, 3).map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0' }}>
                <WPill color={i.severity === 'P1' ? '#F43F5E' : i.severity === 'P2' ? '#FBBF24' : '#3FA9F5'}>{i.severity}</WPill>
                <span style={{ fontSize: 11.5, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.customer}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
          <WRing pct={health} value={health + '%'} label="uptime" color={accent} size={92} stroke={9} />
          <div style={{ flex: 1 }}>
            <WStrip accent={accent} cells={[
              { top: 'P1', color: '#F43F5E', bot: sev('P1') },
              { top: 'P2', color: '#FBBF24', bot: sev('P2') },
              { top: 'P3', color: '#3FA9F5', bot: sev('P3') },
              { top: 'OK', color: '#34D399', bot: 142 },
            ]} />
          </div>
        </div>
        <WDivide />
        <div>
          {active.slice(0, 3).map((i, idx) => {
            const done = i.playbook.filter(p => p.done).length;
            return <WRow key={i.id} last={idx === Math.min(active.length, 3) - 1} label={i.title.split('—')[0]}
              glyph="warroom" glyphColor={i.severity === 'P1' ? '#F43F5E' : '#FBBF24'}
              a={`${done}/${i.playbook.length}`} b={i.severity} accent={accent} />;
          })}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Work Orders In Progress ─────────── */
function WWorkOrders({ size }) {
  const [wos] = useShieldStore(workOrderStore);
  const inProg = wos.filter(w => w.status === 'in-progress');
  const sched = wos.filter(w => w.status === 'scheduled').length;
  const done = wos.filter(w => w.status === 'completed').length;
  return (
    <WCard size={size} accent="#34D399" title="Work Orders" glyph="clipboard"
      sub={size !== 'small' ? 'live field status' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={inProg.length} sub={null} />
          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-mid)' }}>in progress · <span style={{ color: 'var(--text-low)' }}>{sched} scheduled</span></div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent="#34D399" anchor={size === 'medium'} cells={[
          { top: 'Active', color: '#34D399', bot: inProg.length },
          { top: 'Sched', color: '#3FA9F5', bot: sched },
          { top: 'Done', color: '#5C6F86', bot: done },
          { top: 'Total', color: '#c084fc', bot: wos.length },
        ]} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {wos.slice(0, 4).map((w, i) => (
            <WRow key={w.id} last={i === 3} label={`${w.customer}`} glyph="dispatch"
              glyphColor={TECH_COLORS[w.techId] || '#34D399'}
              a={w.tech.split(' ')[0]} b={w.status === 'in-progress' ? fmtSeconds(w.timerSeconds) : w.status.slice(0, 4)} accent="#34D399" />
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Today's Schedule & Dispatch ─────────── */
function WSchedule({ size }) {
  const [jobs] = useShieldStore(jobStore);
  const today = jobs.filter(j => j.day <= 3 && 3 <= (j.endDay || j.day)).sort((a, b) => a.start - b.start);
  const next = today.find(j => j.start >= 9) || today[0];
  const revenue = today.reduce((s, j) => s + (j.value || 0), 0);
  return (
    <WCard size={size} accent="#c084fc" title="Today" glyph="calendar"
      sub={size !== 'small' ? `${today.length} jobs · $${(revenue / 1000).toFixed(1)}k` : null}>
      {size === 'small' && next && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-high)' }}>{fmtH(Math.floor(next.start))}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 4, lineHeight: 1.25, overflow: 'hidden' }}>{next.title}</div>
          <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-low)' }}>{today.length} jobs today</div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent="#c084fc" anchor={size === 'medium'} cells={today.slice(0, 6).map(j => ({
          top: fmtH(Math.floor(j.start)),
          color: { install: '#3FA9F5', repair: '#F43F5E', survey: '#c084fc', maintenance: '#FBBF24', meeting: '#34D399' }[j.type] || '#3FA9F5',
          bot: (j.techs && j.techs[0]) || '—',
        }))} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {today.slice(0, 4).map((j, i) => (
            <WRow key={j.id} last={i === Math.min(today.length, 4) - 1} label={j.title.split('—')[1] || j.title}
              glyph="dispatch" glyphColor={TECH_COLORS[(j.techs || [])[0]] || '#c084fc'}
              a={fmtH(Math.floor(j.start))} b={j.value ? `$${(j.value / 1000).toFixed(0)}k` : '—'} accent="#c084fc" />
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Fleet Map / Tech Locations ─────────── */
function MiniMap({ h, pins }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: h, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(160deg,#0b1622,#0a1018)', border: '1px solid rgba(63,169,245,0.15)' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(6)].map((_, i) => <line key={'h' + i} x1="0" y1={`${i * 18 + 8}%`} x2="100%" y2={`${i * 18 + 8}%`} stroke="rgba(63,169,245,0.08)" strokeWidth="1" />)}
        {[...Array(7)].map((_, i) => <line key={'v' + i} x1={`${i * 15 + 6}%`} y1="0" x2={`${i * 15 + 6}%`} y2="100%" stroke="rgba(63,169,245,0.08)" strokeWidth="1" />)}
        <path d="M5,40 Q40,38 55,60 T95,55" fill="none" stroke="rgba(63,169,245,0.18)" strokeWidth="2" />
        <path d="M20,5 L25,95" fill="none" stroke="rgba(63,169,245,0.12)" strokeWidth="2" />
      </svg>
      {pins.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: p.color, border: '2px solid rgba(5,7,10,0.9)', boxShadow: `0 0 8px ${p.color}` }} />
          {p.label && <div style={{ position: 'absolute', top: 13, left: '50%', transform: 'translateX(-50%)', fontSize: 8, fontWeight: 700, color: p.color, whiteSpace: 'nowrap' }}>{p.label}</div>}
        </div>
      ))}
    </div>
  );
}
function WFleet({ size }) {
  const techs = [
    { id: 'MR', x: 28, y: 32, status: 'On site', cust: 'Riverside Medical' },
    { id: 'JL', x: 64, y: 55, status: 'En route', cust: 'Metro Bank' },
    { id: 'KW', x: 44, y: 70, status: 'On site', cust: 'City Hall' },
    { id: 'TG', x: 80, y: 28, status: 'En route', cust: 'Pinnacle Fin.' },
    { id: 'DP', x: 18, y: 60, status: 'Available', cust: '—' },
  ];
  const pins = techs.map(t => ({ x: t.x, y: t.y, color: TECH_COLORS[t.id], label: size === 'small' ? null : t.id }));
  const onSite = techs.filter(t => t.status === 'On site').length;
  return (
    <WCard size={size} accent="#3FA9F5" title="Fleet" glyph="dispatch"
      sub={size !== 'small' ? `${techs.length} techs · ${onSite} on site` : null} flush={size === 'small'}>
      {size === 'small' && (
        <div style={{ position: 'relative', height: '100%' }}>
          <MiniMap h="100%" pins={pins} />
          <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 11, color: 'var(--text-high)', fontWeight: 600, textShadow: '0 1px 4px #000' }}>{onSite} on site · {techs.length - onSite} moving</div>
        </div>
      )}
      {size === 'medium' && <div style={{ marginTop: 6, height: '100%' }}><MiniMap h="100%" pins={pins} /></div>}
      {size === 'large' && <>
        <div style={{ marginTop: 6 }}><MiniMap h={150} pins={pins} /></div>
        <div style={{ marginTop: 8 }}>
          {techs.slice(0, 4).map((t, i) => (
            <WRow key={t.id} last={i === 3} label={t.cust} glyph="employees" glyphColor={TECH_COLORS[t.id]}
              a={t.id} b={t.status} accent="#3FA9F5" />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Approvals Pending ─────────── */
function WApprovals({ size }) {
  const [approvals] = useShieldStore(approvalStore);
  const pending = approvals.filter(a => a.status === 'pending');
  const kinds = ['EXPENSE', 'TIMESHEET', 'PURCHASE ORDER'];
  const byK = k => pending.filter(a => a.kind === k).length;
  return (
    <WCard size={size} accent="#FBBF24" title="Approvals" glyph="check"
      sub={size !== 'small' ? 'awaiting your sign-off' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={pending.length} color="#FBBF24" />
          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-mid)' }}>pending review</div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent="#FBBF24" anchor={size === 'medium'} cells={[
          { top: 'Exp', color: '#3FA9F5', bot: byK('EXPENSE') },
          { top: 'Time', color: '#34D399', bot: byK('TIMESHEET') },
          { top: 'PO', color: '#c084fc', bot: byK('PURCHASE ORDER') },
        ]} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {pending.slice(0, 4).map((a, i) => (
            <WRow key={a.id} last={i === Math.min(pending.length, 4) - 1} label={a.title.split('—')[0]}
              glyph="receipt" glyphColor="#FBBF24" a={a.amt} b={a.kind.slice(0, 3)} accent="#FBBF24" />
          ))}
        </div>
      )}
    </WCard>
  );
}

registerWidget('tickets',    { label: 'Open Tickets / SLA',     cat: 'Operations', accent: '#F43F5E', glyph: 'chat',      sizes: ['small', 'medium', 'large'], render: s => <WTickets size={s} /> });
registerWidget('monitoring', { label: 'Device Monitoring',      cat: 'Operations', accent: '#34D399', glyph: 'topology',  sizes: ['small', 'medium', 'large'], render: s => <WMonitoring size={s} /> });
registerWidget('workorders', { label: 'Work Orders',            cat: 'Operations', accent: '#34D399', glyph: 'clipboard', sizes: ['small', 'medium', 'large'], render: s => <WWorkOrders size={s} /> });
registerWidget('schedule',   { label: "Today's Schedule",       cat: 'Operations', accent: '#c084fc', glyph: 'calendar',  sizes: ['small', 'medium', 'large'], render: s => <WSchedule size={s} /> });
registerWidget('fleet',      { label: 'Fleet Map / Locations',  cat: 'Operations', accent: '#3FA9F5', glyph: 'dispatch',  sizes: ['small', 'medium', 'large'], render: s => <WFleet size={s} /> });
registerWidget('approvals',  { label: 'Approvals Pending',      cat: 'Operations', accent: '#FBBF24', glyph: 'check',     sizes: ['small', 'medium', 'large'], render: s => <WApprovals size={s} /> });

Object.assign(window, { WTickets, WMonitoring, WWorkOrders, WSchedule, WFleet, WApprovals, MiniMap, TECH_COLORS, PRIO });

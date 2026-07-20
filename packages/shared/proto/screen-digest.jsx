/* Screen — Daily Digest (admin): auto-compiled end-of-day rollup from live stores.
   Photos, punch burn-down, work orders, revenue, tomorrow's risk — zero manual entry. */

function DailyDigestScreen() {
  const [photos] = useShieldStore(photoStore);
  const [punch] = useShieldStore(punchStore);
  const [wos] = useShieldStore(workOrderStore);
  const [jobs] = useShieldStore(jobStore);

  const TODAY = 4, TOMORROW = 5; // Thu / Fri of the demo week
  const todayPhotos = photos.filter(p => p.day === 'Today');
  const todayJobs = jobs.filter(j => j.day <= TODAY && TODAY <= (j.endDay || j.day));
  const tomorrowJobs = jobs.filter(j => j.day <= TOMORROW && TOMORROW <= (j.endDay || j.day));
  const issues = todayPhotos.filter(p => p.phase === 'issue');
  const punchClosed = punch.filter(p => p.status !== 'open');
  const punchOpen = punch.filter(p => p.status === 'open');
  const revenueToday = todayJobs.reduce((s, j) => s + (j.value || 0), 0);
  const hoursToday = todayJobs.reduce((s, j) => s + j.dur, 0);

  const customers = [...new Set(todayPhotos.map(p => p.customer))];
  const techNames = { MR: 'Mike', JL: 'Jessica', KW: 'Kevin', DP: 'Diana', TG: 'Tony' };

  return (
    <div style={{ maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="glass" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div className="display" style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-high)' }}>Daily Digest — Thursday, June 12</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>Auto-compiled by ShieldTech AI from field activity · refreshes live, sends at 6:00 PM</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => showToast('Digest emailed to jmitchell@shieldtech.com', 'ok')} style={digestBtn('var(--brand)', 'rgba(63,169,245,0.08)', 'var(--border-strong)')}>Email now</button>
          <button onClick={() => showToast('Posted to #field-ops', 'ok')} style={digestBtn('var(--text-mid)', 'rgba(63,169,245,0.03)', 'var(--border-subtle)')}>Send to Slack</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'JOBS WORKED', value: todayJobs.length, c: 'var(--text-high)' },
          { label: 'FIELD HOURS', value: `${hoursToday}h`, c: 'var(--text-high)' },
          { label: 'PHOTOS CAPTURED', value: todayPhotos.length, c: 'var(--brand)' },
          { label: 'PUNCH CLOSED', value: `${punchClosed.length}/${punch.length}`, c: 'var(--status-ok)' },
          { label: 'REVENUE IN FLIGHT', value: `$${(revenueToday / 1000).toFixed(1)}k`, c: 'var(--status-ok)' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: s.c }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Flagged issues */}
      {issues.length > 0 && (
        <div className="glass" style={{ padding: 16, border: '1px solid rgba(244,63,94,0.25)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--status-critical)', marginBottom: 10 }}>⚑ Flagged in the field today</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {issues.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px 8px 8px', borderRadius: 8, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <MockPhoto photo={p} stamp={false} style={{ width: 56, height: 42, borderRadius: 6 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)' }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{p.customer} · {p.techName} · {p.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-site rollup */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Site Activity</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {customers.map(c => {
            const cPhotos = todayPhotos.filter(p => p.customer === c);
            const cPunchOpen = punchOpen.filter(p => p.customer === c).length;
            const cTechs = [...new Set(cPhotos.map(p => p.tech))].map(t => techNames[t] || t).join(', ');
            const cJob = todayJobs.find(j => j.customer === c);
            return (
              <div key={c} className="glass" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{c}</span>
                  {cJob && <span className="mono" style={{ fontSize: 9, color: 'var(--status-ok)' }}>${(cJob.value || 0).toLocaleString()}</span>}
                </div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 9 }}>
                  {cPhotos.slice(0, 4).map(p => <MockPhoto key={p.id} photo={p} stamp={false} style={{ flex: 1, height: 52, borderRadius: 6, border: '1px solid var(--border-subtle)' }} />)}
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-low)', flexWrap: 'wrap' }}>
                  <span>{cPhotos.length} photos</span>
                  <span>· crew: {cTechs || '—'}</span>
                  {cPunchOpen > 0 && <span style={{ color: 'var(--status-warn)' }}>· {cPunchOpen} punch open</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tomorrow preview */}
      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Tomorrow — Friday, June 13</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tomorrowJobs.map(j => {
            const unassigned = !j.techs || j.techs.length === 0;
            return (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 7, background: 'rgba(5,7,10,0.4)', border: `1px solid ${unassigned ? 'rgba(251,191,36,0.3)' : 'var(--border-subtle)'}` }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 76, flexShrink: 0 }}>{`${Math.floor(j.start)}:${j.start % 1 ? '30' : '00'} · ${j.dur}h`}</span>
                <span style={{ fontSize: 12, color: 'var(--text-high)', flex: 1 }}>{j.title}</span>
                {unassigned
                  ? <button onClick={() => navTo('calendar')} style={{ padding: '3px 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 5, color: 'var(--status-warn)', fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚠ UNASSIGNED — fix in calendar</button>
                  : <span style={{ fontSize: 10, color: 'var(--text-mid)' }}>{(j.techs || []).map(t => techNames[t] || t).join(' + ')}</span>}
              </div>
            );
          })}
          {tomorrowJobs.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic' }}>Nothing scheduled yet</div>}
        </div>
      </div>
    </div>
  );
}

const digestBtn = (color, bg, border) => ({ padding: '7px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' });

Object.assign(window, { DailyDigestScreen });

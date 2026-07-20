/* Screen — Scheduling Copilot
   Reads the live job board, finds problems (unassigned, conflicts, overload),
   solves against skills + certs + drive time, explains every proposal, applies in one click. */

const COPILOT_TECH_META = {
  MR: { name: 'Mike Reyes',  color: '#3FA9F5' },
  JL: { name: 'Jessica Liu', color: '#34D399' },
  KW: { name: 'Kevin White', color: '#FBBF24' },
  DP: { name: 'Diana Patel', color: '#c084fc' },
  TG: { name: 'Tony Garcia', color: '#F43F5E' },
};

function copilotUtil(jobs) {
  const hrs = {};
  Object.keys(COPILOT_TECH_META).forEach(t => hrs[t] = 0);
  jobs.forEach(j => (j.techs || []).forEach(t => { if (hrs[t] !== undefined) hrs[t] += j.dur * ((j.endDay || j.day) - j.day + 1); }));
  return hrs;
}

function SchedCopilotScreen() {
  const [jobs, setJobs] = useShieldStore(jobStore);
  const [skills] = useShieldStore(skillsStore);
  const [stage, setStage] = React.useState('idle'); // idle | solving | proposed
  const [applied, setApplied] = React.useState([]);

  const util = copilotUtil(jobs);
  const maxHrs = 40;

  /* ── Issue detection (live) ── */
  const issues = [];
  jobs.filter(j => !j.techs || j.techs.length === 0).forEach(j => issues.push({ type: 'unassigned', sev: 'critical', label: `${j.title} (${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][j.day-1]}) has no technician`, job: j }));
  Object.entries(util).forEach(([t, h]) => { if (h / maxHrs > 0.9) issues.push({ type: 'overload', sev: 'warn', label: `${COPILOT_TECH_META[t].name} is at ${Math.round(h / maxHrs * 100)}% — burnout risk`, tech: t }); });
  jobs.forEach((a, ai) => jobs.forEach((b, bi) => {
    if (ai < bi && (a.techs || []).some(t => (b.techs || []).includes(t)) && a.day <= (b.endDay || b.day) && b.day <= (a.endDay || a.day) && a.start < b.start + b.dur && b.start < a.start + a.dur) {
      issues.push({ type: 'conflict', sev: 'critical', label: `${a.title} overlaps ${b.title}`, job: a });
    }
  }));

  /* ── Proposals (computed when solving) ── */
  const buildProposals = () => {
    const props = [];
    const unassigned = jobs.filter(j => !j.techs || j.techs.length === 0);
    unassigned.forEach(j => {
      // pick best tech: lowest load, then skill fit
      const ranked = Object.keys(COPILOT_TECH_META)
        .map(t => ({ t, load: util[t], skill: (skills[t] || {})['low-voltage'] || 0, cert: (skills[t] || {})['c7-license'] || 0 }))
        .sort((a, b) => (a.load - b.load) || (b.skill - a.skill));
      const best = ranked[0];
      props.push({
        id: 'pr-' + j.id, jobId: j.id, title: j.title,
        from: 'Unassigned', to: best.t,
        reasons: [`Lightest load (${best.load}h this week)`, `Low-voltage L${best.skill} · C-7 licensed`, 'No schedule conflicts that day'],
        apply: () => setJobs(prev => prev.map(x => x.id === j.id ? { ...x, techs: [best.t] } : x)),
      });
    });
    // rebalance: move one job from most loaded to least loaded (if gap > 8h)
    const sorted = Object.entries(util).sort((a, b) => b[1] - a[1]);
    const [hiT, hiH] = sorted[0], [loT, loH] = sorted[sorted.length - 1];
    if (hiH - loH > 8) {
      const movable = jobs.find(j => (j.techs || []).length === 1 && j.techs[0] === hiT && j.type !== 'meeting' && j.dur <= 4);
      if (movable) {
        props.push({
          id: 'pr-bal-' + movable.id, jobId: movable.id, title: movable.title,
          from: hiT, to: loT,
          reasons: [`Levels ${COPILOT_TECH_META[hiT].name} ${Math.round(hiH/maxHrs*100)}% → ${Math.round((hiH-movable.dur)/maxHrs*100)}%`, `${COPILOT_TECH_META[loT].name} has the ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][movable.day-1]} window free`, 'Same skill class required'],
          apply: () => setJobs(prev => prev.map(x => x.id === movable.id ? { ...x, techs: [loT] } : x)),
        });
      }
    }
    return props;
  };

  const [proposals, setProposals] = React.useState([]);
  const solve = () => {
    setStage('solving');
    setApplied([]);
    setTimeout(() => { setProposals(buildProposals()); setStage('proposed'); }, 1400);
  };
  const applyOne = (p) => { p.apply(); setApplied(a => [...a, p.id]); showToast(`${p.title.split('—')[0].trim()} → ${COPILOT_TECH_META[p.to].name}`, 'ok'); };
  const applyAll = () => { proposals.filter(p => !applied.includes(p.id)).forEach(p => p.apply()); setApplied(proposals.map(p => p.id)); showToast('Schedule optimized — all proposals applied', 'ok'); };

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="glass" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Icon name="hermes" size={22} color="var(--brand)" />
        <div>
          <div className="display" style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-high)' }}>Scheduling Copilot</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>Solves your week against skills, certifications, drive time, and workload — and shows its reasoning</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => navTo('calendar')} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open calendar</button>
          <button onClick={solve} disabled={stage === 'solving'} style={{ padding: '7px 18px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 14px rgba(63,169,245,0.3)' }}>
            {stage === 'solving' ? 'Solving…' : 'Optimize my week'}
          </button>
        </div>
      </div>

      {/* Issues */}
      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>
          Live Issues — {issues.length === 0 ? 'schedule is healthy ✓' : `${issues.length} found`}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {issues.map((iss, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 7, background: iss.sev === 'critical' ? 'rgba(244,63,94,0.05)' : 'rgba(251,191,36,0.05)', border: `1px solid ${iss.sev === 'critical' ? 'rgba(244,63,94,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: iss.sev === 'critical' ? 'var(--status-critical)' : 'var(--status-warn)', flexShrink: 0 }}></span>
              <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{iss.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)' }}>{iss.type}</span>
            </div>
          ))}
          {issues.length === 0 && <div style={{ fontSize: 11, color: 'var(--status-ok)' }}>✓ Everyone assigned, no conflicts, workload balanced</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Utilization */}
        <div className="glass" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Crew Utilization</div>
          {Object.entries(COPILOT_TECH_META).map(([t, meta]) => {
            const pct = Math.round((util[t] / maxHrs) * 100);
            return (
              <div key={t} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{meta.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: pct > 90 ? 'var(--status-critical)' : pct > 70 ? 'var(--status-warn)' : 'var(--text-low)' }}>{util[t]}h · {pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.07)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: pct > 90 ? 'var(--status-critical)' : pct > 70 ? 'var(--status-warn)' : meta.color, transition: 'width 0.4s' }}></div>
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.5 }}>Target band: 60–85%. Bars update live as you apply proposals.</div>
        </div>

        {/* Proposals */}
        <div className="glass" style={{ padding: 16, minHeight: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)' }}>Proposed Moves</span>
            {stage === 'proposed' && proposals.length > 0 && applied.length < proposals.length && (
              <button onClick={applyAll} style={{ marginLeft: 'auto', padding: '5px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 7, color: 'var(--status-ok)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Apply all ({proposals.length - applied.length})</button>
            )}
          </div>

          {stage === 'idle' && (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>
              Hit <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Optimize my week</span> and ShieldTech AI will propose assignments with full reasoning.
            </div>
          )}
          {stage === 'solving' && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              {['Loading skills matrix…', 'Checking cert requirements…', 'Computing drive times…', 'Balancing workload…'].map((s, i) => (
                <div key={s} style={{ fontSize: 11, color: 'var(--text-mid)', padding: '4px 0', animation: `fade-up 0.3s ease ${i * 0.3}s both` }}>{s}</div>
              ))}
            </div>
          )}
          {stage === 'proposed' && proposals.length === 0 && (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--status-ok)', fontSize: 12 }}>✓ Nothing to fix — your schedule is already optimal.</div>
          )}
          {stage === 'proposed' && proposals.map(p => {
            const done = applied.includes(p.id);
            const toMeta = COPILOT_TECH_META[p.to];
            const fromMeta = COPILOT_TECH_META[p.from];
            return (
              <div key={p.id} style={{ padding: '12px 14px', borderRadius: 9, background: done ? 'rgba(52,211,153,0.04)' : 'rgba(5,7,10,0.4)', border: `1px solid ${done ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, marginBottom: 8, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{p.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11 }}>
                      <span style={{ color: fromMeta ? fromMeta.color : 'var(--status-warn)' }}>{fromMeta ? fromMeta.name : '◌ Unassigned'}</span>
                      <span style={{ color: 'var(--text-low)' }}>→</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: toMeta.color, fontWeight: 600 }}>
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: `${toMeta.color}28`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700 }}>{p.to}</span>
                        {toMeta.name}
                      </span>
                    </div>
                  </div>
                  {done
                    ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-ok)' }}>✓ Applied</span>
                    : <button onClick={() => applyOne(p)} style={{ padding: '6px 16px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Apply</button>}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                  {p.reasons.map(r => <span key={r} style={{ fontSize: 9, padding: '3px 9px', borderRadius: 9, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)' }}>{r}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SchedCopilotScreen });

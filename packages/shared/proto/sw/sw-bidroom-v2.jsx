// ============================================================
// Bid Room / Bid Board — V2 upgrades
// Loaded AFTER sw-bidboard.jsx. Overrides BrStepQualify and
// BidBoardWorkspace on window; adds intel, key-requirement
// extraction, weighted go/no-go scorecard, next-action queue,
// agent run ticker, and deadline heat.
// ============================================================

/* ─────────── Intel + extraction data ─────────── */
function brIntel(opp) {
  const h = brHash(opp.id);
  const planHolders = 5 + (h % 9);
  const bidders = Math.max(3, Math.round(planHolders * 0.6));
  const incumbent = h % 3 === 0;
  const b = opp.buyer.toLowerCase();
  const seg = /school|charter|district|college/.test(b) ? ['K-12 / education', 38]
    : /water|utility|transit|authority/.test(b) ? ['Utilities & authorities', 24]
    : /county|court|city|township|borough/.test(b) ? ['County & municipal', 31]
    : /health|medstar|clinic|hospital/.test(b) ? ['Healthcare', 22]
    : ['Commercial / other', 28];
  return { planHolders, bidders, incumbent, segment: seg[0], winRate: seg[1] };
}

function brKeyReqs(opp) {
  const h = brHash(opp.id);
  const ld = 500 + (h % 15) * 100;
  const reqs = [
    { id: 'bond', sev: 'high', label: 'Bid security 10%', src: '§2.1', detail: 'Bond premium runs ~1% of bid price — carry it as a line in the estimate, not out of margin.' },
    { id: 'ld', sev: 'high', label: `Liquidated damages $${ld.toLocaleString()}/day`, src: '§1.6', detail: 'Applies past substantial completion. Confirm lead times on head-end gear before committing to schedule.' },
    { id: 'ins', sev: 'med', label: 'COI — Owner additional insured, $2M aggregate', src: '§2.1', detail: 'Standard for your carrier; request the endorsement early, it takes 3–5 days.' },
  ];
  if (/school|county|city|water|authority|court|township/.test(opp.buyer.toLowerCase())) {
    reqs.splice(1, 0, { id: 'wage', sev: 'high', label: 'Prevailing wage applies', src: '§1.8', detail: `Blended $${BR_LABOR_RATE}/hr in the estimate — verify against the current ${opp.state} rate schedule before locking.` });
  }
  if (['NJ', 'NY', 'MD'].includes(opp.state)) {
    reqs.push({ id: 'mbe', sev: 'med', label: `MBE/WBE participation goal ${10 + (h % 16)}%`, src: '§2.3', detail: 'Good-faith documentation required with the bid — line up certified sub or supplier participation now.' });
  }
  return reqs;
}

/* Weighted go/no-go scorecard */
const BR_SCORECARD = [
  { id: 'fit', label: 'Trade & territory fit', w: 25, hint: 'Does this match work you have crews and references for?' },
  { id: 'capacity', label: 'Crew capacity in the window', w: 20, hint: 'Can you staff it without starving an awarded job?' },
  { id: 'competition', label: 'Competitive field', w: 20, hint: '5 = few bidders / no incumbent · 1 = crowded with an incumbent' },
  { id: 'margin', label: 'Margin potential', w: 20, hint: 'Room to hit target margin at a winning number?' },
  { id: 'strategic', label: 'Strategic value', w: 15, hint: 'Repeat buyer, new territory, or reference-grade logo?' },
];
function brScore(state) {
  const sc = state.scorecard || {};
  const scored = BR_SCORECARD.filter(c => sc[c.id]);
  if (scored.length < BR_SCORECARD.length) return { complete: false, n: scored.length };
  const total = Math.round(BR_SCORECARD.reduce((a, c) => a + (sc[c.id] / 5) * c.w, 0));
  return { complete: true, n: scored.length, total, rec: total >= 72 ? 'go' : total >= 55 ? 'judgment' : 'nogo' };
}

/* Next action across the whole workflow */
function brNextAction(opp, s) {
  const cur = brCurrentPhase(opp, s);
  if (cur === 'nogo') return { phase: 'Parked', action: 'Marked no-go' };
  if (cur === 'won') return { phase: 'Won', action: 'Convert to project — hand off to operations' };
  if (cur === 'lost') return { phase: 'Lost', action: 'Loss logged — SHIELDTECH AI adjusted the model' };
  if (cur === 'submitted') return { phase: 'Sent Out', action: 'Confirm receipt with ' + opp.poc.name };
  const p = brPhaseParts(opp, s).find(x => x.id === cur);
  if (!p) return { phase: 'Review', action: 'Open the review deck' };
  const part = p.parts.find(x => !x.done);
  return { phase: p.label, action: part ? part.label : 'Advance to next phase' };
}
function brHoursLeft(opp) {
  return Math.round((new Date(opp.dueAt) - new Date(window.SW.TODAY + 'T08:00:00Z')) / 3600000);
}

/* Overnight agent run */
const BR_AGENT_RUN = {
  at: '4:12 AM', portals: ['SAM.gov', 'PennBid', 'eMMA', 'eVA', 'BidNet', 'Empire State BS'],
  screened: 1247, matched: BR_LEADS.length,
  rejected: [['outside territory', 61], ['wrong trades', 38], ['too large / bonded out of range', 12], ['expired or awarded', 9]],
};

/* ─────────── Qualify V2 — verification + intel + scorecard ─────────── */
function BrStepQualify({ opp, state, update }) {
  const risk = { Verified: 'var(--status-ok)', 'Needs check': 'var(--status-warn)', Unverified: 'var(--status-critical)' }[opp.sourceRisk];
  const v = state.verified;
  const set = (k) => update(p => ({ ...p, verified: { ...p.verified, [k]: !p.verified[k] } }));
  const allV = v.source && v.buyer && v.due;
  const intel = brIntel(opp);
  const score = brScore(state);
  const setCrit = (id, n) => update(p => ({ ...p, scorecard: { ...(p.scorecard || {}), [id]: n } }));
  const recColor = score.complete ? (score.rec === 'go' ? 'var(--status-ok)' : score.rec === 'judgment' ? 'var(--status-warn)' : 'var(--status-critical)') : 'var(--text-low)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <Eyebrow>Source of truth</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 4px' }}>
            <Icon name={opp.sourceRisk === 'Verified' ? 'checkCircle' : 'alert'} size={18} color={risk} />
            <div>
              <div style={{ font: '600 13.5px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{opp.source}</div>
              <div style={{ font: '500 11.5px/1.3 var(--font-mono)', color: risk }}>{opp.sourceRisk}</div>
            </div>
          </div>
          <div style={{ font: '400 12.5px/1.55 var(--font-body)', color: 'var(--text-mid)', margin: '8px 0 14px' }}>
            {opp.sourceRisk === 'Verified' ? 'Listing traces to the official buyer portal. Confirm the remaining items and this bid is real.' : 'Listing found on an aggregator — open the official portal and match solicitation number, buyer, and due date before spending hours.'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BrCheckRow done={v.source} onToggle={() => set('source')} label="Official source verified" sub="Solicitation number matches the buyer's own portal." />
            <BrCheckRow done={v.buyer} onToggle={() => set('buyer')} label="Buyer & contact confirmed" sub={`${opp.poc.name} — ${opp.poc.title}${opp.poc.phone ? ' · ' + opp.poc.phone : ''}`} />
            <BrCheckRow done={v.due} onToggle={() => set('due')} label="Due date & site walk confirmed" sub={`Due ${swDueLabel(opp.dueAt)}${opp.siteWalk ? ' · Walk ' + swDueLabel(opp.siteWalk) : ' · No walk scheduled'}`} />
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <Eyebrow>Competition intel</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '12px 0' }}>
            {[[intel.planHolders, 'plan holders'], ['~' + intel.bidders, 'likely bidders'], [intel.winRate + '%', 'your win rate']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 10, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ font: '700 18px/1 var(--font-display)', color: 'var(--text-high)' }}>{n}</div>
                <div style={{ font: '500 9.5px/1.3 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 5 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ font: '400 12px/1.6 var(--font-body)', color: 'var(--text-mid)' }}>
            <span style={{ color: intel.incumbent ? 'var(--status-warn)' : 'var(--status-ok)', fontWeight: 600 }}>{intel.incumbent ? 'Incumbent on the plan-holders list. ' : 'No incumbent integrator on record. '}</span>
            Win rate shown is yours across <span style={{ color: 'var(--text-high)' }}>{intel.segment}</span> bids, last 24 months.
          </div>
          <div style={{ font: '400 12px/1.55 var(--font-body)', color: 'var(--text-mid)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Why {opp.poc.name}: </span>{opp.poc.why}
          </div>
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Eyebrow>Go / no-go scorecard</Eyebrow>
            <ProgressRing value={score.complete ? score.total : Math.round((score.n / BR_SCORECARD.length) * 30)} size={46} stroke={5} label={score.complete ? score.total : `${score.n}/5`} color={recColor} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {BR_SCORECARD.map(c => (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ font: '600 12.5px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{c.label}</span>
                  <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-low)' }}>×{c.w}</span>
                </div>
                <div style={{ font: '400 11px/1.45 var(--font-body)', color: 'var(--text-low)', margin: '2px 0 6px' }}>{c.hint}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const on = (state.scorecard || {})[c.id] === n;
                    return <button key={n} onClick={() => setCrit(c.id, n)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, cursor: 'pointer', font: '600 12px/1 var(--font-mono)', background: on ? 'rgba(63,169,245,0.16)' : 'rgba(63,169,245,0.04)', border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border-subtle)'), color: on ? 'var(--brand)' : 'var(--text-mid)' }}>{n}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
          {score.complete && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: `color-mix(in srgb, ${recColor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${recColor} 35%, transparent)`, font: '500 12px/1.55 var(--font-body)', color: 'var(--text-high)' }}>
              {score.rec === 'go' ? `Scores ${score.total}/100 — strong pursuit. Fit and field both favor you.` : score.rec === 'judgment' ? `Scores ${score.total}/100 — judgment call. Winnable, but something is dragging; check capacity and the field before committing hours.` : `Scores ${score.total}/100 — the math says pass. Park it and let the agent keep watching this buyer.`}
            </div>
          )}
        </Card>
        <Card style={{ padding: 16 }}>
          <Eyebrow>Decision</Eyebrow>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Btn kind={state.decision === 'go' ? 'success' : 'secondary'} icon="check" full disabled={!allV}
              onClick={() => { update({ decision: 'go' }); swToast('Marked GO — moving to documents', 'ok'); }}>
              {state.decision === 'go' ? 'GO — pursuing' : 'Go'}
            </Btn>
            <Btn kind={state.decision === 'nogo' ? 'danger' : 'secondary'} icon="x" full
              onClick={() => { update({ decision: 'nogo' }); swToast('Marked no-go — bid parked on the board', 'info'); }}>
              {state.decision === 'nogo' ? 'No-go — parked' : 'No-go'}
            </Btn>
          </div>
          {!allV && <div style={{ font: '500 11.5px/1.5 var(--font-body)', color: 'var(--text-low)', marginTop: 9 }}>Verify all three source items before a GO. No-go is always available.</div>}
        </Card>
      </div>
    </div>
  );
}

/* ─────────── Key requirements card (Documents phase) ─────────── */
function BrKeyReqs({ opp }) {
  const [open, setOpen] = React.useState(null);
  const reqs = brKeyReqs(opp);
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="sparkles" size={15} color="var(--brand)" />
        <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>What matters in this RFP</span>
        <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-low)' }}>— commercial terms extracted from the full text</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {reqs.map(r => {
          const c = r.sev === 'high' ? 'var(--status-warn)' : 'var(--brand)';
          const on = open === r.id;
          return (
            <button key={r.id} onClick={() => setOpen(on ? null : r.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, cursor: 'pointer', background: on ? `color-mix(in srgb, ${c} 14%, transparent)` : 'rgba(63,169,245,0.04)', border: `1px solid color-mix(in srgb, ${c} ${on ? 55 : 30}%, transparent)`, font: '600 12px/1 var(--font-body)', color: on ? c : 'var(--text-high)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{r.label}
              <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-low)' }}>{r.src}</span>
            </button>
          );
        })}
      </div>
      {open && <div className="sw-up" style={{ marginTop: 10, padding: '10px 13px', borderRadius: 10, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', font: '400 12.5px/1.6 var(--font-body)', color: 'var(--text-mid)' }}>{reqs.find(r => r.id === open).detail}</div>}
    </Card>
  );
}

/* ─────────── Bid Board V2 ─────────── */
function BbHeat({ opp }) {
  const hrs = brHoursLeft(opp);
  if (hrs > 168) return <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-mid)' }}>due {swDueLabel(opp.dueAt)}</span>;
  const c = hrs < 72 ? 'var(--status-critical)' : 'var(--status-warn)';
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--font-mono)', color: c }}><Icon name="clock" size={12} color={c} />{hrs < 48 ? hrs + 'h left' : Math.round(hrs / 24) + 'd left'}</span>;
}

/* Gear menu on every bid card — manual phase control */
function BbGearIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke={color} strokeWidth="1.3" />
      <path d="M13.3 8c0-.4.5-.8.4-1.2-.1-.4-.8-.5-1-.9-.2-.4.2-1-.1-1.3-.3-.3-.9.1-1.3-.1-.4-.2-.5-.9-.9-1-.4-.1-.8.4-1.2.4-.4 0-.8-.5-1.2-.4-.4.1-.5.8-.9 1-.4.2-1-.2-1.3.1-.3.3.1.9-.1 1.3-.2.4-.9.5-1 .9-.1.4.4.8.4 1.2 0 .4-.5.8-.4 1.2.1.4.8.5 1 .9.2.4-.2 1 .1 1.3.3.3.9-.1 1.3.1.4.2.5.9.9 1 .4.1.8-.4 1.2-.4.4 0 .8.5 1.2.4.4-.1.5-.8.9-1 .4-.2 1 .2 1.3-.1.3-.3-.1-.9.1-1.3.2-.4.9-.5 1-.9.1-.4-.4-.8-.4-1.2Z" stroke={color} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

function BbCardMenu({ opp, s }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', h, true);
    return () => document.removeEventListener('pointerdown', h, true);
  }, [open]);
  const cur = brCurrentPhase(opp, s);
  const save = (patch, msg, type = 'info') => { brSave(opp.id, { ...brLoad(opp.id), ...patch }); if (msg) swToast(msg, type); setOpen(false); };
  const Item = ({ icon, label, onClick, color = 'var(--text-high)', divider }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderTop: divider ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', font: '500 12px/1.2 var(--font-body)', color, textAlign: 'left' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.07)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      <Icon name={icon} size={13} color={color === 'var(--text-high)' ? 'var(--text-low)' : color} />{label}
    </button>
  );
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)} title="Bid options" style={{ width: 26, height: 26, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? 'rgba(63,169,245,0.14)' : 'rgba(63,169,245,0.05)', border: '1px solid ' + (open ? 'var(--border-strong)' : 'var(--border-subtle)'), color: open ? 'var(--brand)' : 'var(--text-low)' }}>
        <BbGearIcon size={13} />
      </button>
      {open && (
        <div className="sw-up" style={{ position: 'absolute', top: 30, right: 0, zIndex: 60, width: 216, borderRadius: 12, background: 'rgba(10,15,26,0.98)', border: '1px solid var(--border-strong)', boxShadow: '0 18px 44px -12px rgba(0,0,0,0.8)', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
          <div style={{ padding: '8px 12px 6px', font: '600 9px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.12em' }}>MOVE TO PHASE</div>
          {BR_PHASES.map(p => (
            <Item key={p.id} icon={p.icon} label={p.label + (cur === p.id ? ' · current' : '')}
              color={cur === p.id ? 'var(--brand)' : 'var(--text-high)'}
              onClick={() => save({ phaseOverride: p.id, decision: s.decision === 'nogo' ? null : s.decision, submitted: null, award: null }, opp.title + ' moved to ' + p.label)} />
          ))}
          {s.phaseOverride && <Item icon="refresh" label="Auto — follow progress" divider onClick={() => save({ phaseOverride: null }, 'Back to automatic placement')} />}
          <Item icon="send" label="Mark sent out" color="var(--brand)" divider
            onClick={() => save({ submitted: { at: new Date().toISOString(), method: 'manual' }, award: null }, opp.title + ' marked sent out', 'ok')} />
          {s.submitted && !s.award && <>
            <Item icon="checkCircle" label="Mark won" color="var(--status-ok)" onClick={() => save({ award: { result: 'won', reason: 'best value' } }, 'WON — ' + opp.title, 'ok')} />
            <Item icon="x" label="Mark lost" color="var(--status-critical)" onClick={() => save({ award: { result: 'lost', reason: 'beaten on price' } }, 'Loss logged — SHIELDTECH AI adjusts the model')} />
          </>}
          {s.decision !== 'nogo'
            ? <Item icon="flag" label="Park as no-go" divider onClick={() => save({ decision: 'nogo' }, opp.title + ' parked')} />
            : <Item icon="play" label="Reopen bid" divider onClick={() => save({ decision: null }, opp.title + ' reopened')} />}
        </div>
      )}
    </div>
  );
}

function BbBidCard({ opp, onOpen }) {
  const s = brLoad(opp.id);
  const pct = Math.round(brProgress(opp, s) * 100);
  const cur = brCurrentPhase(opp, s);
  const nogo = cur === 'nogo';
  const untouched = !nogo && cur !== 'submitted' && pct === 0;
  const hot = !nogo && cur !== 'submitted' && brHoursLeft(opp) < 72;
  const owner = window.SW.userById(window.SW.getOwner('opp', opp.id, opp.owner));
  return (
    <Card hover onClick={() => onOpen(opp.id)} style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 9, opacity: nogo ? 0.55 : 1, border: hot ? '1px solid rgba(248,113,113,0.4)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '600 13px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{opp.title}</div>
          <div style={{ font: '500 11px/1.4 var(--font-body)', color: 'var(--text-mid)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.buyer}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {owner && <Avatar user={owner} size={22} />}
          <BbCardMenu opp={opp} s={s} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--text-high)' }}>{swK(opp.value)}</span>
        {nogo ? <Pill tone="Dead" label="No-go" small /> : cur === 'won' ? <Pill tone="Done" label="Won" small dot /> : cur === 'lost' ? <Pill tone="Dead" label="Lost" small /> : cur === 'submitted' ? <Pill tone="Done" label="Sent out" small dot /> : <BbHeat opp={opp} />}
      </div>
      {!nogo && cur !== 'submitted' && cur !== 'won' && cur !== 'lost' && (
        <div style={{ font: '400 11px/1.45 var(--font-body)', color: untouched ? 'var(--brand)' : 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{untouched ? '● Built by SHIELDTECH AI — ready for review' : 'Next: ' + brNextAction(opp, s).action}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.12)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 2, background: nogo || cur === 'lost' ? 'var(--text-low)' : cur === 'submitted' || cur === 'won' ? 'var(--status-ok)' : 'linear-gradient(90deg, var(--brand), var(--status-ok))' }} />
        </div>
        <span style={{ font: '600 10.5px/1 var(--font-mono)', color: 'var(--text-low)' }}>{pct}%</span>
      </div>
    </Card>
  );
}

function BbLeadCard({ lead, onAccept, onDismiss }) {
  const h = brHash(lead.id);
  const bars = [['Trades', Math.min(100, lead.fit + 8)], ['Territory', 92 + (h % 9)], ['Buyer history', Math.max(35, lead.fit - 12 - (h % 10))]];
  return (
    <Card className="sw-hoverlift" style={{ padding: 14, width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(63,169,245,0.22)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', color: 'var(--brand)' }}><Icon name="sparkles" size={12} color="var(--brand)" />FOUND OVERNIGHT</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '600 11px/1 var(--font-mono)', color: lead.fit >= 80 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{lead.fit} fit</span>
          <button onClick={onAccept} title="Add to Qualify" style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand)', border: 'none', boxShadow: '0 4px 14px -4px rgba(63,169,245,0.7)' }}>
            <Icon name="plus" size={15} color="#03121F" />
          </button>
        </div>
      </div>
      <div>
        <div style={{ font: '700 14px/1.3 var(--font-display)', color: 'var(--text-high)' }}>{lead.title}</div>
        <div style={{ font: '500 11.5px/1.4 var(--font-body)', color: 'var(--text-mid)', marginTop: 3 }}>{lead.buyer} · {lead.state}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {bars.map(([l, n]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 84, font: '500 10px/1 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.1)', overflow: 'hidden' }}><div style={{ width: n + '%', height: '100%', borderRadius: 2, background: n >= 75 ? 'var(--status-ok)' : 'var(--status-warn)' }} /></div>
            <span style={{ font: '600 10px/1 var(--font-mono)', color: 'var(--text-mid)', width: 24, textAlign: 'right' }}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{ font: '400 12px/1.55 var(--font-body)', color: 'var(--text-mid)', flex: 1 }}>{lead.why}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: '500 11.5px/1 var(--font-mono)', color: 'var(--text-mid)' }}>
        <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{swK(lead.value)}</span>
        <BbHeat opp={lead} />
        <span style={{ color: lead.sourceRisk === 'Verified' ? 'var(--status-ok)' : 'var(--status-warn)' }}>{lead.sourceRisk}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', font: '600 11px/1 var(--font-body)', color: 'var(--text-low)', padding: '4px 6px' }}>Pass</button>
      </div>
    </Card>
  );
}

/* Board headline numbers — the first thing you see */
function BbNumbers({ opps }) {
  const live = opps.map(o => ({ o, s: brLoad(o.id) })).filter(({ o, s }) => brCurrentPhase(o, s) !== 'nogo');
  const pipeline = live.reduce((a, { o, s }) => a + brEstimate(o, s).total, 0);
  const weighted = live.reduce((a, { o, s }) => a + brEstimate(o, s).total * (o.fit / 100), 0);
  const withTier = live.filter(({ s }) => s.tier);
  const avgMargin = withTier.length ? Math.round(withTier.reduce((a, { s }) => a + BR_TIERS.find(t => t.id === s.tier).margin, 0) / withTier.length) : 18;
  const devices = live.reduce((a, { o, s }) => a + brDeviceCounts(o, s).reduce((x, c) => x + c.devices, 0), 0);
  const fmtM = (n) => n >= 1000000 ? '$' + (n / 1000000).toFixed(2) + 'M' : '$' + Math.round(n / 1000) + 'K';
  const items = [
    [fmtM(pipeline), 'Total pipeline', 'every live number, priced'],
    [fmtM(weighted), 'Fit-weighted', 'pipeline × win likelihood'],
    [avgMargin + '%', 'Avg margin', withTier.length ? withTier.length + ' bids tiered' : 'book default'],
    [devices.toLocaleString(), 'Devices scoped', 'counted off the drawings'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
      {items.map(([v, l, sub]) => (
        <GlassCard key={l} style={{ padding: '14px 16px' }}>
          <div style={{ font: '700 22px/1 var(--font-display)', color: 'var(--brand)' }}>{v}</div>
          <div style={{ font: '600 10px/1.3 var(--font-body)', color: 'var(--text-high)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>{l}</div>
          <div style={{ font: '500 10.5px/1.3 var(--font-mono)', color: 'var(--text-low)', marginTop: 3 }}>{sub}</div>
        </GlassCard>
      ))}
    </div>
  );
}

function BidBoardWorkspace({ onOpenOpp }) {
  brUseAll(); swUseAssign();
  const isMobile = useIsMobile();
  const leadSt = brLeadState();
  const freshLeads = BR_LEADS.filter(l => !leadSt[l.id]);
  const opps = window.SW.OPPS;

  const cols = [
    ...BR_PHASES.map(p => ({ id: p.id, label: p.label, icon: p.icon })),
    { id: 'submitted', label: 'Sent Out', icon: 'send' },
    { id: 'won', label: 'Won', icon: 'checkCircle' },
    { id: 'lost', label: 'Lost', icon: 'x' },
  ];
  const byCol = {}; cols.forEach(c => byCol[c.id] = []);
  opps.forEach(o => { const cur = brCurrentPhase(o, brLoad(o.id)); byCol[cur === 'nogo' ? 'qualify' : cur].push(o); });
  cols.forEach(c => byCol[c.id].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)));

  const inFlight = opps.filter(o => { const c = brCurrentPhase(o, brLoad(o.id)); return c !== 'nogo' && c !== 'submitted' && c !== 'won' && c !== 'lost'; });
  const submitted = byCol.submitted;
  const queue = inFlight.map(o => ({ o, s: brLoad(o.id), hrs: brHoursLeft(o) })).sort((a, b) => a.hrs - b.hrs).slice(0, 4);
  const dueSoon = inFlight.filter(o => brHoursLeft(o) <= 168);

  const stats = [
    { label: 'In flight', value: inFlight.length, sub: swK(inFlight.reduce((a, o) => a + o.value, 0)) + ' on the board' },
    { label: 'Due this week', value: dueSoon.length, sub: dueSoon.length ? swK(dueSoon.reduce((a, o) => a + o.value, 0)) + ' at risk' : 'clear runway', warn: dueSoon.length > 2 },
    { label: 'Sent out', value: submitted.length, sub: swK(submitted.reduce((a, o) => a + o.value, 0)) + ' pending award' },
    { label: 'Won', value: byCol.won.length, sub: byCol.won.length ? swK(byCol.won.reduce((a, o) => a + o.value, 0)) + ' to operations' : 'awaiting awards' },
    { label: 'Fresh leads', value: freshLeads.length, sub: 'from the overnight run' },
  ];

  return (
    <div style={{ maxWidth: 1460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }} data-screen-label="Bid Board">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <Eyebrow color="var(--brand)">AI lead engine · scope, BOM & proposal pre-built</Eyebrow>
          <div style={{ font: `700 ${isMobile ? 20 : 24}px/1.2 var(--font-display)`, color: 'var(--text-high)', marginTop: 5 }}>Leads</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {stats.map(st => (
            <Card key={st.label} style={{ padding: '10px 16px', minWidth: 118 }}>
              <div style={{ font: '700 19px/1 var(--font-display)', color: st.warn ? 'var(--status-warn)' : 'var(--text-high)' }}>{st.value}</div>
              <div style={{ font: '600 10px/1.3 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{st.label}</div>
              <div style={{ font: '500 10.5px/1.3 var(--font-mono)', color: 'var(--text-mid)', marginTop: 2 }}>{st.sub}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Headline numbers */}
      <BbNumbers opps={opps} />

      {/* Agent run ticker */}
      <GlassCard style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)', flexShrink: 0 }}><Icon name="sparkles" size={14} color="var(--brand)" /></span>
        <div style={{ flex: 1, minWidth: 260, font: '400 12.5px/1.55 var(--font-body)', color: 'var(--text-mid)' }}>
          <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>SHIELDTECH AI ran at {BR_AGENT_RUN.at}</span> — screened <span style={{ color: 'var(--text-high)' }}>{BR_AGENT_RUN.screened.toLocaleString()} solicitations</span> across {BR_AGENT_RUN.portals.length} portals · <span style={{ color: 'var(--status-ok)', fontWeight: 600 }}>{freshLeads.length} matched</span> your win profile · top rejections: {BR_AGENT_RUN.rejected.slice(0, 2).map(([r, n]) => `${r} (${n})`).join(', ')}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {BR_AGENT_RUN.portals.map(p => <span key={p} style={{ padding: '4px 9px', borderRadius: 999, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', font: '500 10px/1 var(--font-mono)', color: 'var(--text-low)' }}>{p}</span>)}
        </div>
      </GlassCard>

      {/* Needs you now */}
      {queue.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="alert" size={15} color="var(--status-warn)" />
            <span style={{ font: '700 13.5px/1 var(--font-display)', color: 'var(--text-high)' }}>Needs you now</span>
            <span style={{ font: '500 11.5px/1 var(--font-body)', color: 'var(--text-low)' }}>— next action on every live bid, closest deadline first</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {queue.map(({ o, s, hrs }) => {
              const na = brNextAction(o, s);
              const c = hrs < 72 ? 'var(--status-critical)' : hrs < 168 ? 'var(--status-warn)' : 'var(--brand)';
              return (
                <Card key={o.id} hover onClick={() => onOpenOpp(o.id)} style={{ padding: 13, display: 'flex', gap: 11, alignItems: 'flex-start', borderLeft: `2px solid ${c}` }}>
                  <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 44 }}>
                    <div style={{ font: '700 16px/1 var(--font-display)', color: c }}>{hrs < 48 ? hrs + 'h' : Math.round(hrs / 24) + 'd'}</div>
                    <div style={{ font: '500 8.5px/1 var(--font-body)', color: 'var(--text-low)', letterSpacing: '0.1em', marginTop: 4 }}>LEFT</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '600 12.5px/1.3 var(--font-body)', color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</div>
                    <div style={{ font: '400 11.5px/1.45 var(--font-body)', color: 'var(--text-mid)', marginTop: 3 }}>{na.action}</div>
                    <div style={{ font: '600 10px/1 var(--font-mono)', color: 'var(--brand)', marginTop: 5, letterSpacing: '0.06em' }}>{na.phase.toUpperCase()} PHASE →</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* AI lead feed */}
      {freshLeads.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="sparkles" size={15} color="var(--brand)" />
            <span style={{ font: '700 13.5px/1 var(--font-display)', color: 'var(--text-high)' }}>New leads from the overnight run</span>
            <span style={{ font: '500 11.5px/1 var(--font-body)', color: 'var(--text-low)' }}>— accept to start the guided bid, pass to teach the agent</span>
          </div>
          <div className="sw-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {freshLeads.map(l => (
              <BbLeadCard key={l.id} lead={l}
                onAccept={() => { brSetLead(l.id, 'accepted'); swToast(l.buyer + ' added to Qualify', 'ok'); }}
                onDismiss={() => { brSetLead(l.id, 'dismissed'); swToast('Passed — the agent will deprioritize this pattern', 'info'); }} />
            ))}
          </div>
        </div>
      )}

      {/* Phase columns */}
      <div className="sw-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 8 }}>
        {cols.map(c => (
          <div key={c.id} style={{ width: 268, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px 10px' }}>
              <Icon name={c.icon} size={14} color={c.id === 'won' ? 'var(--status-ok)' : c.id === 'lost' ? 'var(--text-low)' : c.id === 'submitted' ? 'var(--status-ok)' : 'var(--brand)'} />
              <span style={{ font: '600 12px/1 var(--font-body)', color: 'var(--text-high)', letterSpacing: '0.03em' }}>{c.label}</span>
              <span style={{ font: '600 10.5px/1 var(--font-mono)', color: 'var(--text-low)', marginLeft: 'auto' }}>{byCol[c.id].length} · {swK(byCol[c.id].reduce((a, o) => a + o.value, 0))}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60, padding: 6, borderRadius: 'var(--radius-lg)', background: 'rgba(63,169,245,0.025)', border: '1px dashed var(--border-subtle)' }}>
              {byCol[c.id].map(o => <BbBidCard key={o.id} opp={o} onOpen={onOpenOpp} />)}
              {!byCol[c.id].length && <div style={{ font: '400 11.5px/1.5 var(--font-body)', color: 'var(--text-low)', textAlign: 'center', padding: '18px 8px' }}>Nothing in {c.label.toLowerCase()}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  brIntel, brKeyReqs, BR_SCORECARD, brScore, brNextAction, brHoursLeft, BR_AGENT_RUN,
  BrStepQualify, BrKeyReqs, BbHeat, BbBidCard, BbLeadCard, BbNumbers, BbCardMenu, BbGearIcon, BidBoardWorkspace,
});

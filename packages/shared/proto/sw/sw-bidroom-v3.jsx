// ============================================================
// Leads engine — Bid Room V3 shell (co-pilot)
// HERMES built the whole bid; you review. Review deck is home;
// Blueprint / Site model / War games / Numbers / Proposal /
// Submit are inspection surfaces. Confidence meter live in the
// header. Overrides window.BidRoom.
// ============================================================

const BR_MODES = [
  { id: 'review', label: 'Review', icon: 'sparkles' },
  { id: 'blueprint', label: 'Blueprint', icon: 'grid' },
  { id: 'model', label: 'Site model', icon: 'building' },
  { id: 'wargames', label: 'War games', icon: 'target' },
  { id: 'numbers', label: 'Numbers', icon: 'dollar' },
  { id: 'proposal', label: 'Proposal', icon: 'doc' },
  { id: 'submit', label: 'Submit', icon: 'send' },
];

function BrConfidence({ opp, state }) {
  const pct = Math.round(brProgress(opp, state) * 100);
  const color = pct >= 85 ? 'var(--status-ok)' : pct >= 45 ? 'var(--brand)' : 'var(--status-warn)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <ProgressRing value={pct} size={40} stroke={4.5} label={pct} color={color} />
      <div>
        <div style={{ font: '600 9px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.12em' }}>BID CONFIDENCE</div>
        <div style={{ font: '600 11px/1.2 var(--font-body)', color, marginTop: 3 }}>{pct >= 85 ? 'Ready to submit' : pct >= 45 ? 'In review' : 'Needs your eyes'}</div>
      </div>
    </div>
  );
}

/* Submit + post-submit ops (award, follow-ups, project handoff) */
function BrSubmitV3({ opp, state, update }) {
  const est = brEstimate(opp, state);
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  if (state.submitted) {
    const followups = [
      { t: 'Today', txt: `Confirm receipt with ${opp.poc.name}${opp.poc.phone ? ' · ' + opp.poc.phone : ''}`, done: true },
      { t: '+3 days', txt: 'Check the portal for addenda or bid-opening results', done: false },
      { t: '+10 days', txt: 'Nudge the buyer on award timeline (HERMES drafts the email)', done: false },
      { t: 'On award', txt: 'Won → convert to project · Lost → capture the number that beat you', done: false },
    ];
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 18, textAlign: 'center' }}>
          <Icon name="checkCircle" size={34} color="var(--status-ok)" />
          <div style={{ font: '700 19px/1.3 var(--font-display)', color: 'var(--text-high)', marginTop: 10 }}>Submitted at {fmt(est.total)}</div>
          <div style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'var(--text-mid)', marginTop: 6 }}>{opp.title} · {opp.buyer}. HERMES now owns the follow-up sequence.</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <Eyebrow color="var(--brand)">Follow-up sequence — automated</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {followups.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ width: 58, flexShrink: 0, font: '600 10.5px/1.6 var(--font-mono)', color: f.done ? 'var(--status-ok)' : 'var(--text-low)' }}>{f.t}</span>
                <Icon name={f.done ? 'checkCircle' : 'clock'} size={14} color={f.done ? 'var(--status-ok)' : 'var(--text-low)'} style={{ marginTop: 2 }} />
                <span style={{ font: '400 12.5px/1.5 var(--font-body)', color: f.done ? 'var(--text-mid)' : 'var(--text-high)' }}>{f.txt}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <Eyebrow>Award result — teaches HERMES</Eyebrow>
          {state.award ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name={state.award.result === 'won' ? 'checkCircle' : 'x'} size={16} color={state.award.result === 'won' ? 'var(--status-ok)' : 'var(--status-critical)'} />
                <span style={{ font: '600 13px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{state.award.result === 'won' ? 'Won' : 'Lost'} — {state.award.reason}</span>
              </div>
              {state.award.result === 'won' ? (
                <Btn kind="primary" icon="arrowR" full style={{ marginTop: 12 }} onClick={() => swToast('Handed off to Operations — project shell created with the BOM, drawings, and schedule', 'ok')}>Convert to project</Btn>
              ) : (
                <div style={{ font: '400 12px/1.6 var(--font-body)', color: 'var(--text-mid)', marginTop: 10 }}>Logged. HERMES adjusts its {opp.trades[0].toLowerCase()} pricing model and this buyer's profile.</div>
              )}
              <Btn kind="ghost" size="sm" style={{ marginTop: 10 }} onClick={() => update({ award: null })}>Undo</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <Btn kind="success" icon="check" style={{ flex: 1, minWidth: 140 }} onClick={() => { update({ award: { result: 'won', reason: 'best value' } }); swToast('WON — HERMES sharpens the model around this profile', 'ok'); }}>We won</Btn>
              <Btn kind="secondary" icon="x" style={{ flex: 1, minWidth: 140 }} onClick={() => { update({ award: { result: 'lost', reason: 'beaten on price' } }); swToast('Logged — HERMES will bid this buyer leaner next time', 'info'); }}>Lost on price</Btn>
              <Btn kind="ghost" style={{ flex: 1, minWidth: 120 }} onClick={() => { update({ award: { result: 'lost', reason: 'scope/references' } }); }}>Lost — other</Btn>
            </div>
          )}
        </Card>
        <Btn kind="ghost" icon="refresh" onClick={() => update({ submitted: null, award: null })}>Reopen bid (undo submit)</Btn>
      </div>
    );
  }
  return <BrStepSubmit opp={opp} state={state} update={update} />;
}

function BidRoom({ oppId, onClose }) {
  const opp = window.SW.oppById(oppId);
  const [state, update] = useBidState(oppId);
  const isMobile = useIsMobile(1100);
  const [mode, setMode] = React.useState('review');
  const [showReplay, setShowReplay] = React.useState(() => !localStorage.getItem('sw:replayseen:' + oppId));
  const [showBlueprint, setShowBlueprint] = React.useState(false);
  React.useEffect(() => { setMode('review'); }, [oppId]);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !showBlueprint && !showReplay) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showBlueprint, showReplay]);
  if (!opp) return null;

  const est = brEstimate(opp, state);
  const decisions = brDecisions(opp, state);
  const doneN = decisions.filter(d => d.done).length;
  const nogo = state.decision === 'nogo';
  const dismissReplay = () => { setShowReplay(false); try { localStorage.setItem('sw:replayseen:' + oppId, '1'); } catch {} };

  const body =
    mode === 'review' ? <BrReviewDeck opp={opp} state={state} update={update} onMode={setMode} onBlueprint={() => setShowBlueprint(true)} /> :
    mode === 'model' ? <BrIsoView opp={opp} state={state} /> :
    mode === 'wargames' ? <BrWarGames opp={opp} state={state} update={update} /> :
    mode === 'numbers' ? <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}><BrStepBom opp={opp} state={state} update={update} /><BrStepPricing opp={opp} state={state} update={update} /></div> :
    mode === 'proposal' ? <BrStepProposal opp={opp} state={state} update={update} /> :
    <BrSubmitV3 opp={opp} state={state} update={update} />;

  return (
    <div className="sw-fade" style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 80% -10%, rgba(63,169,245,0.09), transparent 45%), var(--canvas)' }} data-screen-label={'Bid Room — ' + opp.title}>
      {/* Header */}
      <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '10px 14px' : '11px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(8,11,18,0.88)', backdropFilter: 'blur(14px)' }}>
        <Btn kind="secondary" size="sm" icon="back" onClick={onClose}>{isMobile ? '' : 'Leads'}</Btn>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ font: `700 ${isMobile ? 14 : 16}px/1.2 var(--font-display)`, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</span>
            {nogo ? <Pill tone="Dead" label="No-go" small dot /> : state.submitted ? <Pill tone="Done" label="Submitted" small dot /> : <Pill tone={opp.status} label={doneN + '/' + decisions.length + ' approved'} small dot />}
          </div>
          {!isMobile && <div style={{ font: '500 11px/1.3 var(--font-body)', color: 'var(--text-mid)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.buyer} · due {swDueLabel(opp.dueAt)} · built by HERMES overnight</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18, flexShrink: 0 }}>
          {!isMobile && <BrConfidence opp={opp} state={state} />}
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '700 15px/1 var(--font-display)', color: 'var(--brand)' }}>{'$' + Math.round(est.total).toLocaleString()}</div>
              <div style={{ font: '500 9px/1 var(--font-body)', color: 'var(--text-low)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{state.tier ? state.tier + (state.estimateLocked ? ' · locked' : ' · working') : 'AI medium tier'}</div>
            </div>
          )}
          <Btn kind="ghost" size="sm" icon="play" onClick={() => setShowReplay(true)}>{isMobile ? '' : 'Replay'}</Btn>
        </div>
      </header>

      {/* Mode tabs */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: isMobile ? '8px 12px' : '9px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(8,11,18,0.7)', overflowX: 'auto' }}>
        {BR_MODES.map(m => {
          const active = mode === m.id;
          const badge = m.id === 'review' && decisions.length - doneN > 0 ? decisions.length - doneN : null;
          return (
            <button key={m.id} onClick={() => m.id === 'blueprint' ? setShowBlueprint(true) : setMode(m.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0, background: active ? 'rgba(63,169,245,0.13)' : 'transparent', border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent'), color: active ? 'var(--brand)' : 'var(--text-mid)', font: '600 12px/1 var(--font-body)' }}>
              <Icon name={m.icon} size={13} color={active ? 'var(--brand)' : 'var(--text-low)'} />{m.label}
              {badge && <span style={{ minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand)', color: '#03121F', font: '700 10px/1 var(--font-mono)' }}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {nogo && (
        <div style={{ padding: '9px 20px', background: 'rgba(148,163,184,0.06)', borderBottom: '1px solid var(--border-subtle)', font: '500 12px/1.4 var(--font-body)', color: 'var(--text-mid)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="flag" size={14} color="var(--text-low)" />Parked as no-go — HERMES keeps watching this buyer.
          <Btn kind="ghost" size="sm" onClick={() => update({ decision: null })}>Reopen</Btn>
        </div>
      )}

      {/* Body */}
      <div className="sw-scroll" style={{ flex: 1 }}>
        <div style={{ padding: isMobile ? 14 : '22px 24px', maxWidth: 1360, margin: '0 auto' }}>
          <div key={mode} className="sw-up">{body}</div>
        </div>
      </div>

      {showBlueprint && <BrBlueprint opp={opp} state={state} update={update} onClose={() => setShowBlueprint(false)} />}
      {showReplay && <BrAgentReplay opp={opp} onClose={dismissReplay} />}
    </div>
  );
}

Object.assign(window, { BidRoom, BrSubmitV3, BrConfidence, BR_MODES });

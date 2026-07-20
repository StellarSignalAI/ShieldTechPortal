// ============================================================
// ShieldTech Secret Weapon — Bid Room shell
// Full-screen guided workflow: phase stepper + progress bar,
// AI guide rail, step content, prev / complete-phase / next.
// ============================================================

function BrStepper({ opp, state, step, onStep, isMobile }) {
  const phases = brPhaseParts(opp, state);
  const pct = Math.round(brProgress(opp, state) * 100);
  return (
    <div style={{ padding: isMobile ? '10px 14px' : '12px 22px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(8,11,18,0.7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6, overflowX: 'auto', paddingBottom: 2 }}>
        {phases.map((p, i) => {
          const active = p.id === step;
          const color = p.done ? 'var(--status-ok)' : active ? 'var(--brand)' : 'var(--text-low)';
          return (
            <React.Fragment key={p.id}>
              {i > 0 && <div style={{ flex: 1, minWidth: 10, height: 2, borderRadius: 2, background: phases[i - 1].done ? 'rgba(52,211,153,0.5)' : 'rgba(63,169,245,0.14)' }} />}
              <button onClick={() => onStep(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '6px 8px' : '7px 12px', borderRadius: 999, cursor: 'pointer', flexShrink: 0, background: active ? 'rgba(63,169,245,0.12)' : 'transparent', border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent') }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: p.done ? 'var(--status-ok)' : active ? 'rgba(63,169,245,0.16)' : 'rgba(63,169,245,0.06)', border: p.done ? 'none' : `1px solid ${active ? 'var(--brand)' : 'var(--border-subtle)'}` }}>
                  {p.done ? <Icon name="check" size={11} color="#03121F" /> : <span style={{ font: '700 10px/1 var(--font-mono)', color }}>{i + 1}</span>}
                </span>
                {(!isMobile || active) && <span style={{ font: `600 12px/1 var(--font-body)`, color: active ? 'var(--brand)' : p.done ? 'var(--text-mid)' : 'var(--text-low)', whiteSpace: 'nowrap' }}>{p.label}</span>}
              </button>
            </React.Fragment>
          );
        })}
        <div style={{ flexShrink: 0, marginLeft: 12, display: 'flex', alignItems: 'center', gap: 9, minWidth: 130 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.12)', overflow: 'hidden', minWidth: 70 }}>
            <div style={{ width: pct + '%', height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--brand), var(--status-ok))', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ font: '600 11.5px/1 var(--font-mono)', color: 'var(--text-mid)' }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

/* AI guide rail — what to do on this phase, with live gate checklist */
function BrGuide({ opp, state, step }) {
  const phase = brPhaseParts(opp, state).find(p => p.id === step);
  const hints = {
    qualify: `Source risk is "${opp.sourceRisk}". ${opp.sourceRisk === 'Verified' ? 'I traced the listing to the buyer portal — verify the contact and clock, score the five criteria, and call it.' : 'Open the official portal side-by-side and match the solicitation number before anything else.'} The scorecard weights competition and capacity — the two things gut-feel gets wrong.`,
    scope: 'I already wrote the scope, counted every device off the drawings, and marked the sheets. Compare Marked vs Unmarked, approve each trade, and settle the conflicts — every resolution flows into the BOM.',
    bom: 'The BOM is built line-by-line from your approved scope. Verify parts and quantities here — a qty edit ripples through pricing and the customer proposal automatically.',
    pricing: 'Your internal cost stack is above; it never leaves this screen. Pick Low, Medium, or Aggressive based on the field — I flagged my recommendation from the bidder intel.',
    proposal: 'This is the exact document the buyer receives — scope, device counts, and your locked number. Unlisted exceptions are deemed waived (§2.1), so check the package list off completely.',
    submit: 'This is the last gate. Nothing goes out with an open item — and confirm receipt by phone; portals lose uploads more often than anyone admits.',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <GlassCard style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)' }}><Icon name="sparkles" size={13} color="var(--brand)" /></span>
          <div>
            <div style={{ font: '700 12px/1 var(--font-display)', color: 'var(--text-high)', letterSpacing: '0.04em' }}>SHIELDTECH AI</div>
            <div style={{ font: '500 9px/1 var(--font-body)', color: 'var(--brand)', letterSpacing: '0.12em', marginTop: 2 }}>PHASE {BR_PHASES.findIndex(p => p.id === step) + 1} GUIDE</div>
          </div>
        </div>
        <div style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'var(--text-mid)' }}>{phase.blurb}</div>
        <div style={{ font: '400 12px/1.6 var(--font-body)', color: 'var(--text-high)', marginTop: 9, padding: '9px 11px', borderRadius: 9, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)' }}>{hints[step]}</div>
      </GlassCard>
      <Card style={{ padding: 14 }}>
        <Eyebrow>Phase gate</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
          {phase.parts.map(pt => (
            <div key={pt.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={pt.done ? 'checkCircle' : 'clock'} size={14} color={pt.done ? 'var(--status-ok)' : 'var(--text-low)'} />
              <span style={{ font: '500 12px/1.4 var(--font-body)', color: pt.done ? 'var(--text-mid)' : 'var(--text-high)' }}>{pt.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BidRoom({ oppId, onClose }) {
  const opp = window.SW.oppById(oppId);
  const [state, update] = useBidState(oppId);
  const isMobile = useIsMobile(1100);
  const [step, setStep] = React.useState(() => {
    const saved = localStorage.getItem('sw:bidroom-step:' + oppId);
    return saved && BR_PHASES.some(p => p.id === saved) ? saved : brCurrentPhase(opp || { }, brLoad(oppId));
  });
  React.useEffect(() => {
    const saved = localStorage.getItem('sw:bidroom-step:' + oppId);
    if (saved && BR_PHASES.some(p => p.id === saved)) { setStep(saved); return; }
    const cur = brCurrentPhase(opp, brLoad(oppId));
    setStep(cur === 'nogo' ? 'qualify' : cur === 'submitted' ? 'submit' : cur);
  }, [oppId]);
  React.useEffect(() => { try { localStorage.setItem('sw:bidroom-step:' + oppId, step); } catch {} }, [step, oppId]);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!opp) return null;

  const phases = brPhaseParts(opp, state);
  const idx = BR_PHASES.findIndex(p => p.id === step);
  const phase = phases[idx];
  const est = brEstimate(opp, state);
  const nogo = state.decision === 'nogo';

  const stepEl =
    step === 'qualify' ? <BrStepQualify opp={opp} state={state} update={update} /> :
    step === 'scope' ? <BrStepScope opp={opp} state={state} update={update} /> :
    step === 'bom' ? <BrStepBom opp={opp} state={state} update={update} /> :
    step === 'pricing' ? <BrStepPricing opp={opp} state={state} update={update} /> :
    step === 'proposal' ? <BrStepProposal opp={opp} state={state} update={update} /> :
    <BrStepSubmit opp={opp} state={state} update={update} />;

  return (
    <div className="sw-fade" style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 80% -10%, rgba(63,169,245,0.09), transparent 45%), var(--canvas)' }} data-screen-label={'Bid Room — ' + opp.title}>
      {/* Header */}
      <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '10px 14px' : '12px 22px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(8,11,18,0.85)', backdropFilter: 'blur(14px)' }}>
        <Btn kind="secondary" size="sm" icon="back" onClick={onClose}>{isMobile ? 'Bids' : 'All bids'}</Btn>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ font: `700 ${isMobile ? 14 : 16}px/1.2 var(--font-display)`, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</span>
            {nogo ? <Pill tone="Dead" label="No-go" small dot /> : state.submitted ? <Pill tone="Done" label="Submitted" small dot /> : <Pill tone={opp.status} label={opp.status} small dot />}
          </div>
          {!isMobile && <div style={{ font: '500 11.5px/1.3 var(--font-body)', color: 'var(--text-mid)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.buyer} · {opp.state} · due {swDueLabel(opp.dueAt)}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '700 15px/1 var(--font-display)', color: 'var(--brand)' }}>{'$' + Math.round(est.total).toLocaleString()}</div>
              <div style={{ font: '500 9.5px/1 var(--font-body)', color: 'var(--text-low)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{state.estimateLocked ? (state.tier || 'locked') + ' tier · locked' : state.tier ? state.tier + ' tier · working' : 'Working estimate'}</div>
            </div>
          )}
          <AssignMenu kind="opp" id={opp.id} defaultOwner={opp.owner} size={26} />
        </div>
      </header>

      <BrStepper opp={opp} state={state} step={step} onStep={setStep} isMobile={isMobile} />

      {nogo && step !== 'qualify' && (
        <div style={{ padding: '9px 22px', background: 'rgba(148,163,184,0.06)', borderBottom: '1px solid var(--border-subtle)', font: '500 12px/1.4 var(--font-body)', color: 'var(--text-mid)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="flag" size={14} color="var(--text-low)" />This bid is marked no-go — reopen the decision in Qualify to keep working it.
        </div>
      )}

      {/* Body */}
      <div className="sw-scroll" style={{ flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 280px', gap: 16, padding: isMobile ? 14 : 22, maxWidth: 1460, margin: '0 auto', alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <Eyebrow color="var(--brand)">Phase {idx + 1} of {BR_PHASES.length}</Eyebrow>
              <div style={{ font: `700 ${isMobile ? 19 : 23}px/1.2 var(--font-display)`, color: 'var(--text-high)', marginTop: 5 }}>{phase.label}</div>
            </div>
            <div key={step} className="sw-up">{stepEl}</div>
          </div>
          {!isMobile && <BrGuide opp={opp} state={state} step={step} />}
        </div>
      </div>

      {/* Footer nav */}
      <footer style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '10px 14px' : '12px 22px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(8,11,18,0.9)', backdropFilter: 'blur(14px)' }}>
        <Btn kind="ghost" icon="chevL" disabled={idx === 0} onClick={() => setStep(BR_PHASES[idx - 1].id)}>Previous</Btn>
        <div style={{ flex: 1, textAlign: 'center', font: '500 12px/1.4 var(--font-body)', color: phase.done ? 'var(--status-ok)' : 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {phase.done ? 'Phase complete' : phase.parts.filter(p => !p.done).map(p => p.label).join('  ·  ')}
        </div>
        {idx < BR_PHASES.length - 1 ? (
          <Btn kind={phase.done ? 'primary' : 'secondary'} iconR="chevR" onClick={() => setStep(BR_PHASES[idx + 1].id)}>
            {phase.done ? `Next: ${BR_PHASES[idx + 1].label}` : `Skip to ${BR_PHASES[idx + 1].label}`}
          </Btn>
        ) : <div style={{ width: 96 }} />}
      </footer>
    </div>
  );
}

Object.assign(window, { BidRoom, BrStepper, BrGuide });

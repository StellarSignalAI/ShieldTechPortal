// ============================================================
// Leads engine — Review deck
// The guided co-pilot flow: SHIELDTECH AI already made every decision;
// you swipe through them one at a time — approve, veto, or edit.
// Approvals write the same state the phase model reads.
// ============================================================

/* Build the ordered decision queue for a bid */
function brDecisions(opp, s) {
  const intel = window.brIntel ? brIntel(opp) : null;
  const counts = brDeviceCounts(opp, s);
  const flags = brFlags(opp);
  const ambs = brAmbiguities(opp);
  const bom = brBOM(opp, s);
  const est = brEstimate(opp, { ...s, tier: null, marginPct: 0 });
  const comps = brCompetitors(opp);
  const rec = intel ? (intel.incumbent || intel.bidders > 6 ? 'low' : intel.bidders <= 4 && !intel.incumbent ? 'aggressive' : 'medium') : 'medium';
  const recTier = BR_TIERS.find(t => t.id === rec);
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const D = [];

  D.push({
    id: 'd-qualify', phase: 'Qualify', icon: 'target', title: 'Pursue this bid',
    ai: `Verified the listing against ${opp.source}, confirmed ${opp.poc.name} (${opp.poc.title}) and the ${swDueLabel(opp.dueAt)} deadline. Fit ${opp.fit}/100${intel ? ` · ~${intel.bidders} likely bidders · ${intel.incumbent ? 'incumbent in the field' : 'no incumbent'} · your ${intel.segment} win rate is ${intel.winRate}%` : ''}.`,
    done: !!s.decision,
    approve: (u) => u(p => ({ ...p, verified: { source: true, buyer: true, due: true }, scorecard: { fit: 4, capacity: 4, competition: intel && intel.incumbent ? 2 : 4, margin: 4, strategic: 3 }, decision: 'go' })),
    vetoLabel: 'No-go — park it',
    veto: (u) => u({ decision: 'nogo' }),
  });

  opp.trades.forEach(trade => {
    const c = counts.find(x => x.trade === trade);
    D.push({
      id: 'd-scope-' + trade, phase: 'Scope', icon: 'doc', title: `${trade} scope — ${c && c.devices ? c.devices + ' devices' : 'systems work'}`,
      ai: brScopeText(opp, trade, s),
      done: !!(s.scopeApproved || {})[trade],
      approve: (u) => u(p => ({ ...p, scopeApproved: { ...(p.scopeApproved || {}), [trade]: true } })),
      vetoLabel: 'Needs rework — flag it',
      veto: (u) => { u(p => ({ ...p, rfis: [...p.rfis, { id: 'rfi-scope-' + trade + '-' + Date.now(), q: `Internal: rework the ${trade} scope narrative before it reaches the proposal.`, source: 'Scope veto' }] })); },
    });
  });

  D.push({
    id: 'd-drawings', phase: 'Scope', icon: 'grid', title: 'Drawing markups',
    ai: `All ${opp.trades.length} sheets marked with device symbols and callout tags. Open the Blueprint to wipe between the as-issued sheet and my markup, or spot-check the site model.`,
    done: s.docsReviewed.drawings, openBlueprint: true,
    approve: (u) => u(p => ({ ...p, docsReviewed: { ...p.docsReviewed, drawings: true } })),
    vetoLabel: 'Markups wrong — recount',
    veto: (u) => { swToast('Recount queued — SHIELDTECH AI will re-run the takeoff tonight', 'info'); },
  });

  flags.forEach(f => {
    const row = brSpecRows(opp).find(r => r.id === f.rowId);
    const recQty = Math.max(row.rfpQty, row.drawingQty); // §1.4: greater governs
    const recSide = recQty === row.rfpQty ? 'rfp' : 'drawing';
    D.push({
      id: 'd-flag-' + f.id, phase: 'Conflicts', icon: 'alert', title: `Quantity conflict — ${row.item}`,
      ai: `${f.note} RFP §1.4 says the greater quantity governs unless clarified in writing — I recommend carrying ${recQty} ${row.unit}.`,
      done: !!(s.flagState[f.id] && s.flagState[f.id].status !== 'open'),
      compare: { rfp: row.rfpQty, drawing: row.drawingQty, unit: row.unit },
      approve: (u) => u(p => ({ ...p, flagState: { ...p.flagState, [f.id]: { status: 'resolved', resolution: recSide } }, qty: { ...p.qty, [row.id]: recQty } })),
      approveLabel: `Carry ${recQty} ${row.unit}`,
      alts: [
        { label: `Use ${Math.min(row.rfpQty, row.drawingQty)} instead`, act: (u) => u(p => ({ ...p, flagState: { ...p.flagState, [f.id]: { status: 'resolved', resolution: recSide === 'rfp' ? 'drawing' : 'rfp' } }, qty: { ...p.qty, [row.id]: Math.min(row.rfpQty, row.drawingQty) } })) },
        { label: 'Send an RFI', act: (u) => u(p => ({ ...p, flagState: { ...p.flagState, [f.id]: { status: 'rfi' } }, rfis: [...p.rfis, { id: 'rfi-' + f.id, q: `§${row.csi} schedules ${row.rfpQty} ${row.unit} of "${row.item}" but sheet ${row.sheet} shows ${row.drawingQty}. Please confirm the governing quantity.`, source: 'Document conflict' }] })) },
      ],
    });
  });

  ambs.forEach(a => {
    D.push({
      id: 'd-amb-' + a.id, phase: 'Conflicts', icon: 'flag', title: a.item,
      ai: `${a.note} My call: ${a.suggest === 'include' ? 'include it — cheap and scored.' : a.suggest === 'exclude' ? 'exclude it and note it.' : 'send an RFI — in writing beats a change-order fight.'}`,
      done: !!s.scope[a.id],
      approve: (u) => u(p => {
        const next = { ...p, scope: { ...p.scope, [a.id]: a.suggest } };
        if (a.suggest === 'clarify' && !p.rfis.some(r => r.id === 'rfi-sc-' + a.id)) next.rfis = [...p.rfis, { id: 'rfi-sc-' + a.id, q: a.note, source: 'Scope review' }];
        return next;
      }),
      approveLabel: 'Take the AI call — ' + a.suggest.toUpperCase(),
      alts: ['include', 'exclude', 'clarify'].filter(v => v !== a.suggest).map(v => ({
        label: v === 'include' ? 'Include it' : v === 'exclude' ? 'Exclude it' : 'Send an RFI',
        act: (u) => u(p => {
          const next = { ...p, scope: { ...p.scope, [a.id]: v } };
          if (v === 'clarify' && !p.rfis.some(r => r.id === 'rfi-sc-' + a.id)) next.rfis = [...p.rfis, { id: 'rfi-sc-' + a.id, q: a.note, source: 'Scope review' }];
          return next;
        }),
      })),
    });
  });

  const bomTrades = [...new Set(bom.map(l => l.trade))];
  bomTrades.forEach(trade => {
    const lines = bom.filter(l => l.trade === trade);
    const total = lines.reduce((a, l) => a + l.ext, 0);
    D.push({
      id: 'd-bom-' + trade, phase: 'BOM', icon: 'list', title: `${trade} BOM — ${lines.length} lines · ${fmt(total)}`,
      ai: `Built from the approved scope: ${(BR_BOM_META[trade] || BR_BOM_META['_generic']).mfr} hardware plus kits and licensing. Quantities carry your conflict resolutions.`,
      bomLines: lines.slice(0, 4), bomMore: Math.max(0, lines.length - 4),
      done: lines.every(l => (s.bom || {})[l.id]),
      approve: (u) => u(p => { const nb = { ...(p.bom || {}) }; lines.forEach(l => nb[l.id] = true); return { ...p, bom: nb }; }),
      approveLabel: 'Verify all ' + lines.length + ' lines',
      vetoLabel: 'Edit in the full BOM table',
      vetoMode: 'numbers',
    });
  });

  D.push({
    id: 'd-tier', phase: 'Pricing', icon: 'dollar', title: `Price it ${recTier.label} — ${fmt(est.subtotal * (1 + recTier.margin / 100))}`,
    ai: `Cost stack is ${fmt(est.subtotal)} (${fmt(est.material)} material, ${Math.round(est.laborHrs)} labor hrs). With ${comps.length} modeled competitors${intel && intel.incumbent ? ' including an incumbent' : ''}, ${recTier.label} at ${recTier.margin}% margin gives the best expected value. Run the war games to stress it.`,
    done: !!s.tier && s.estimateLocked, openWargames: true,
    approve: (u) => { u({ tier: rec, estimateLocked: true }); },
    approveLabel: `Lock ${recTier.label} at ${fmt(est.subtotal * (1 + recTier.margin / 100))}`,
    alts: BR_TIERS.filter(t => t.id !== rec).map(t => ({ label: `${t.label} — ${fmt(est.subtotal * (1 + t.margin / 100))}`, act: (u) => u({ tier: t.id, estimateLocked: true }) })),
  });

  D.push({
    id: 'd-estimator', phase: 'Pricing', icon: 'users', title: 'Estimator sign-off — Tina',
    ai: `Send the locked number to Tina for the second set of eyes on quantities and labor. She sees the BOM, the internal stack, and your tier — not a blank spreadsheet.`,
    done: s.estimator === 'ok',
    approve: (u) => { u({ estimator: 'ok' }); swToast('Sent to Tina — signed off: quantities and labor check out', 'ok'); },
    approveLabel: 'Send to Tina for check',
    vetoLabel: 'Skip the check (solo)',
    veto: (u) => { u({ estimator: 'ok' }); },
  });

  D.push({
    id: 'd-proposal', phase: 'Proposal', icon: 'send', title: 'Customer proposal — ready to sign off',
    ai: `Assembled on your letterhead: scope narratives, the device summary table, your locked number, exclusions, and the §2.1 package items. Open the Proposal tab to read it exactly as ${opp.buyer} will.`,
    done: !!s.coverLetter, openProposal: true,
    approve: (u) => u(p => {
      const checks = {}; brChecklist(opp).forEach(c => checks[c.id] = true);
      return { ...p, coverLetter: 'approved', proposal: checks };
    }),
    approveLabel: 'Approve the package',
    vetoLabel: 'Hold — review the doc first',
    vetoMode: 'proposal',
  });

  return D;
}

function BrReviewDeck({ opp, state, update, onMode, onBlueprint }) {
  const decisions = brDecisions(opp, state);
  const doneN = decisions.filter(d => d.done).length;
  const pending = decisions.filter(d => !d.done);
  const [idx, setIdx] = React.useState(0);
  const cur = pending[Math.min(idx, Math.max(pending.length - 1, 0))];
  const [showAlts, setShowAlts] = React.useState(false);
  React.useEffect(() => { setShowAlts(false); }, [cur && cur.id]);
  React.useEffect(() => { if (idx >= pending.length) setIdx(Math.max(0, pending.length - 1)); }, [pending.length]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (!cur) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight') { doApprove(); }
      if (e.key === 'v' || e.key === 'V') setShowAlts(v => !v);
      if (e.key === 's' || e.key === 'S') setIdx(i => Math.min(i + 1, pending.length - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const doApprove = () => {
    if (!cur) return;
    cur.approve(update);
    update(p => ({ ...p, decisions: { ...(p.decisions || {}), [cur.id]: 'approved' } }));
    swToast('Approved — ' + cur.title, 'ok');
  };
  const doVeto = () => {
    if (!cur) return;
    if (cur.vetoMode) { onMode(cur.vetoMode); return; }
    if (cur.veto) cur.veto(update);
    update(p => ({ ...p, decisions: { ...(p.decisions || {}), [cur.id]: 'vetoed' } }));
  };

  if (!cur) {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)' }}>
          <Icon name="checkCircle" size={30} color="var(--status-ok)" />
        </div>
        <div style={{ font: '700 20px/1.3 var(--font-display)', color: 'var(--text-high)' }}>Every decision reviewed</div>
        <div style={{ font: '400 13px/1.6 var(--font-body)', color: 'var(--text-mid)', margin: '10px 0 20px' }}>
          {doneN} of {decisions.length} approved. The bid is assembled — final gate is on the Submit tab.
        </div>
        <Btn kind="primary" size="lg" icon="send" onClick={() => onMode('submit')}>Go to Submit</Btn>
      </div>
    );
  }

  const fmt = (n) => Math.round(n).toLocaleString();
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* queue meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ font: '600 11.5px/1 var(--font-mono)', color: 'var(--text-mid)' }}>DECISION {doneN + 1} OF {decisions.length}</span>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.1)', overflow: 'hidden' }}>
          <div style={{ width: (doneN / decisions.length) * 100 + '%', height: '100%', background: 'linear-gradient(90deg, var(--brand), var(--status-ok))', transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--text-low)' }}>A approve · V options · S skip</span>
      </div>

      {/* the card */}
      <div key={cur.id} className="sw-up" style={{ borderRadius: 'var(--radius-lg)', background: 'linear-gradient(180deg, rgba(63,169,245,0.06), rgba(63,169,245,0.015))', border: '1px solid var(--border-strong)', overflow: 'hidden', boxShadow: '0 24px 60px -24px rgba(0,0,0,0.7)' }}>
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', flexShrink: 0 }}>
            <Icon name={cur.icon} size={16} color="var(--brand)" />
          </span>
          <div>
            <div style={{ font: '600 9.5px/1 var(--font-mono)', color: 'var(--brand)', letterSpacing: '0.14em' }}>{cur.phase.toUpperCase()}</div>
            <div style={{ font: '700 17px/1.25 var(--font-display)', color: 'var(--text-high)', marginTop: 4 }}>{cur.title}</div>
          </div>
        </div>
        <div style={{ padding: '14px 20px 6px' }}>
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(8,12,20,0.6)', border: '1px solid var(--border-subtle)' }}>
            <Icon name="sparkles" size={14} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ font: '400 13px/1.65 var(--font-body)', color: 'var(--text-mid)' }}>{cur.ai}</div>
          </div>
          {cur.compare && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              {[['RFP schedule', cur.compare.rfp], ['Drawing count', cur.compare.drawing]].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ font: '700 24px/1 var(--font-display)', color: v === Math.max(cur.compare.rfp, cur.compare.drawing) ? 'var(--status-warn)' : 'var(--text-high)' }}>{v}</div>
                  <div style={{ font: '600 9.5px/1.3 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5 }}>{l} · {cur.compare.unit}</div>
                </div>
              ))}
            </div>
          )}
          {cur.bomLines && (
            <div style={{ marginTop: 12, borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              {cur.bomLines.map(l => (
                <div key={l.id} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', font: '500 11.5px/1.4 var(--font-mono)', alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--brand)', flexShrink: 0 }}>{l.part}</span>
                  <span style={{ color: 'var(--text-mid)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: '400 12px/1.4 var(--font-body)' }}>{l.desc}</span>
                  <span style={{ color: 'var(--text-low)' }}>{l.qty}×</span>
                  <span style={{ color: 'var(--text-high)' }}>${fmt(l.ext)}</span>
                </div>
              ))}
              {cur.bomMore > 0 && <div style={{ padding: '7px 12px', font: '500 11px/1 var(--font-mono)', color: 'var(--text-low)' }}>+ {cur.bomMore} more lines — veto to open the full table</div>}
            </div>
          )}
          {(cur.openBlueprint || cur.openWargames || cur.openProposal) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {cur.openBlueprint && <Btn kind="secondary" size="sm" icon="grid" onClick={onBlueprint}>Open Blueprint</Btn>}
              {cur.openBlueprint && <Btn kind="ghost" size="sm" icon="building" onClick={() => onMode('model')}>Site model</Btn>}
              {cur.openWargames && <Btn kind="secondary" size="sm" icon="target" onClick={() => onMode('wargames')}>Run war games</Btn>}
              {cur.openProposal && <Btn kind="secondary" size="sm" icon="doc" onClick={() => onMode('proposal')}>Read the proposal</Btn>}
            </div>
          )}
        </div>
        {/* actions */}
        <div style={{ padding: '14px 20px 18px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn kind="primary" size="lg" icon="check" style={{ flex: 2, minWidth: 200 }} onClick={doApprove}>{cur.approveLabel || 'Approve'}</Btn>
          {(cur.alts && cur.alts.length > 0)
            ? <Btn kind="secondary" size="lg" style={{ flex: 1, minWidth: 130 }} onClick={() => setShowAlts(v => !v)}>{showAlts ? 'Hide options' : 'Other options'}</Btn>
            : <Btn kind="secondary" size="lg" style={{ flex: 1, minWidth: 130 }} onClick={doVeto}>{cur.vetoLabel || 'Veto'}</Btn>}
          {pending.length > 1 && <Btn kind="ghost" size="lg" onClick={() => setIdx(i => (i + 1) % pending.length)}>Skip</Btn>}
        </div>
        {showAlts && cur.alts && (
          <div className="sw-up" style={{ padding: '0 20px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cur.alts.map((alt, i) => (
              <Btn key={i} kind="secondary" size="sm" onClick={() => { alt.act(update); update(p => ({ ...p, decisions: { ...(p.decisions || {}), [cur.id]: 'vetoed' } })); swToast(alt.label, 'info'); }}>{alt.label}</Btn>
            ))}
          </div>
        )}
      </div>

      {/* up next */}
      {pending.length > 1 && (
        <div>
          <Eyebrow>Up next</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {pending.slice(1, 4).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.02)', opacity: 0.75 }}>
                <Icon name={d.icon} size={13} color="var(--text-low)" />
                <span style={{ font: '500 12px/1.3 var(--font-body)', color: 'var(--text-mid)' }}>{d.title}</span>
                <span style={{ marginLeft: 'auto', font: '500 9.5px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.08em' }}>{d.phase.toUpperCase()}</span>
              </div>
            ))}
            {pending.length > 4 && <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-low)', padding: '2px 12px' }}>+ {pending.length - 4} more decisions</div>}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { brDecisions, BrReviewDeck });

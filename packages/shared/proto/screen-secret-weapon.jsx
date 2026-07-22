/* Secret Weapon — the AI bid-winning suite, one workspace.
   Same live lead feed as the portal Bid Board (BR_LEADS ← Supabase
   opportunities via the ingest/sweep/email/SAM.gov lanes), plus the deep
   tools: Bid Room, War Games, Review Deck, Agent Replay. */

function SecretWeaponScreen() {
  const [tab, setTab] = React.useState('board');
  const [oppId, setOppId] = React.useState(null);
  brUseAll();
  const opps = (window.SW && window.SW.OPPS) || [];
  const activeOpp = opps.find(o => o.id === oppId) || opps[0] || null;
  const [bidState, setBidState] = React.useState(() => activeOpp ? brLoad(activeOpp.id) : null);
  React.useEffect(() => { if (activeOpp) setBidState(brLoad(activeOpp.id)); }, [activeOpp && activeOpp.id]);
  const update = (patch) => {
    if (!activeOpp) return;
    const next = { ...brLoad(activeOpp.id), ...patch };
    brSave(activeOpp.id, next);
    setBidState(next);
  };

  const tabs = [
    { id: 'board', l: 'Bid Board' },
    { id: 'wargames', l: 'War Games' },
    { id: 'review', l: 'Review Deck' },
    { id: 'replay', l: 'Agent Replay' },
  ];

  const needOpp = (
    <div className="glass" style={{ padding: '42px 24px', textAlign: 'center', borderRadius: 12 }}>
      <div style={{ fontSize: 26, marginBottom: 10, opacity: 0.5 }}>⟡</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)', marginBottom: 6 }}>No live bids yet</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-mid)', maxWidth: 420, margin: '0 auto' }}>
        Accept a lead on the Bid Board first — the AI lead lanes (SAM.gov poller, portal sweeps, email ingest)
        feed this same board. Once a bid is in flight, War Games, Review and Replay light up here.
      </div>
    </div>
  );

  return (
    <div data-screen-label="Secret Weapon">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: '0.12em', color: 'var(--brand)' }}>⟡ SECRET WEAPON</span>
        <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '5px 14px', fontSize: 11, fontWeight: tab === t.id ? 600 : 400, borderRadius: 6, background: tab === t.id ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${tab === t.id ? 'var(--brand)' : 'transparent'}`, color: tab === t.id ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.l}</button>
          ))}
        </div>
        {activeOpp && tab !== 'board' && (
          <select value={activeOpp.id} onChange={e => setOppId(e.target.value)} style={{ padding: '4px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', maxWidth: 260 }}>
            {opps.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        )}
      </div>

      {tab === 'board' && (
        <>
          <BidBoardWorkspace onOpenOpp={setOppId} />
          {oppId && tab === 'board' && <BidRoom oppId={oppId} onClose={() => setOppId(null)} />}
        </>
      )}
      {tab === 'wargames' && (activeOpp && bidState ? <BrWarGames opp={activeOpp} state={bidState} update={update} /> : needOpp)}
      {tab === 'review' && (activeOpp && bidState ? <BrReviewDeck opp={activeOpp} state={bidState} update={update} onMode={() => {}} onBlueprint={() => {}} /> : needOpp)}
      {tab === 'replay' && (activeOpp ? <BrAgentReplay opp={activeOpp} onClose={() => setTab('board')} /> : needOpp)}
      <BidToastHost />
    </div>
  );
}

Object.assign(window, { SecretWeaponScreen });

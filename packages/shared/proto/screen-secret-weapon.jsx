/* Secret Weapon — the AI bid-winning suite, one workspace.
   Same live lead feed as the portal Bid Board (BR_LEADS ← Supabase
   opportunities via the ingest/sweep/email/SAM.gov lanes), plus the deep
   tools: Bid Room, War Games, Review Deck, Agent Replay. */

/* A real scraped lead is sparse compared to the seed opportunities the Bid Room
   was built around, so a deep sub-view can throw. This boundary guarantees a
   click never blanks the screen: on any error it shows a clean lead detail with
   the verified link back to the live posting. */
class LeadRoomBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch() { /* swallow — fallback below is the UX */ }
  componentDidUpdate(prev) { if (prev.oppId !== this.props.oppId && this.state.crashed) this.setState({ crashed: false }); }
  render() {
    if (!this.state.crashed) return this.props.children;
    const o = this.props.opp || {};
    const url = o.sourceUrl && /^https?:\/\//i.test(o.sourceUrl) ? o.sourceUrl : null;
    const row = (k, v) => v ? <div style={{ display: 'flex', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--text-low)', minWidth: 90 }}>{k}</span><span style={{ color: 'var(--text-high)' }}>{v}</span></div> : null;
    return (
      <div className="glass" style={{ padding: 22, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-high)' }}>{o.title || 'Lead'}</div>
          <button onClick={this.props.onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {row('Buyer', o.buyer)}
          {row('State', o.state)}
          {row('Value', o.value ? (window.swK ? window.swK(o.value) : '$' + o.value) : null)}
          {row('Due', o.dueAt)}
          {row('Why', o.why)}
        </div>
        {url
          ? <a href={url} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start', padding: '9px 18px', background: 'var(--brand)', color: '#04121F', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Open verified opportunity ↗</a>
          : <div style={{ fontSize: 12, color: 'var(--text-low)' }}>No source link on this record yet.</div>}
        <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>The full guided Bid Room is optimized for richly-specced solicitations; this lead is shown in summary while its details fill in.</div>
      </div>
    );
  }
}

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
          {oppId && tab === 'board' && (
            <LeadRoomBoundary oppId={oppId} opp={opps.find(o => o.id === oppId)} onClose={() => setOppId(null)}>
              <BidRoom oppId={oppId} onClose={() => setOppId(null)} />
            </LeadRoomBoundary>
          )}
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

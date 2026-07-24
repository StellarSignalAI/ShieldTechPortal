// ============================================================
// ShieldTech Secret Weapon — Bid Board (replaces Pipeline CRM)
// AI lead feed on top; below it every bid placed by its
// current phase with a live progress bar. Click → Bid Room.
// ============================================================

function BbLeadCard({ lead, onAccept, onDismiss }) {
  return (
    <Card className="sw-hoverlift" style={{ padding: 14, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(63,169,245,0.22)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', color: 'var(--brand)' }}><Icon name="sparkles" size={12} color="var(--brand)" />FOUND OVERNIGHT</span>
        <span style={{ font: '600 11px/1 var(--font-mono)', color: lead.fit >= 80 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{lead.fit} fit</span>
      </div>
      <div>
        <div style={{ font: '700 14px/1.3 var(--font-display)', color: 'var(--text-high)' }}>{lead.title}</div>
        <div style={{ font: '500 11.5px/1.4 var(--font-body)', color: 'var(--text-mid)', marginTop: 3 }}>{lead.buyer} · {lead.state}</div>
      </div>
      <div style={{ font: '400 12px/1.55 var(--font-body)', color: 'var(--text-mid)', flex: 1 }}>{lead.why}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: '500 11.5px/1 var(--font-mono)', color: 'var(--text-mid)' }}>
        <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{swK(lead.value)}</span>
        <span>due {swDueLabel(lead.dueAt)}</span>
        {lead.sourceUrl
          ? <a href={lead.sourceUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--status-ok)', textDecoration: 'underline', fontWeight: 600 }}>Verified ↗</a>
          : <span style={{ color: 'var(--text-low)' }}>Link pending</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn kind="primary" size="sm" icon="plus" full onClick={onAccept}>Add to board</Btn>
        <Btn kind="ghost" size="sm" onClick={onDismiss}>Pass</Btn>
      </div>
    </Card>
  );
}

function BbBidCard({ opp, onOpen }) {
  const s = brLoad(opp.id);
  const pct = Math.round(brProgress(opp, s) * 100);
  const cur = brCurrentPhase(opp, s);
  const nogo = cur === 'nogo';
  const owner = window.SW.userById(window.SW.getOwner('opp', opp.id, opp.owner));
  return (
    <Card hover onClick={() => onOpen(opp.id)} style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 9, opacity: nogo ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '600 13px/1.3 var(--font-body)', color: 'var(--text-high)' }}>{opp.title}</div>
          <div style={{ font: '500 11px/1.4 var(--font-body)', color: 'var(--text-mid)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.buyer}</div>
        </div>
        {owner && <Avatar user={owner} size={22} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: '500 11px/1 var(--font-mono)', color: 'var(--text-mid)' }}>
        <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{swK(opp.value)}</span>
        {nogo ? <Pill tone="Dead" label="No-go" small /> : cur === 'submitted' ? <Pill tone="Done" label="Submitted" small dot /> : <span>due {swDueLabel(opp.dueAt)}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.12)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 2, background: nogo ? 'var(--text-low)' : cur === 'submitted' ? 'var(--status-ok)' : 'linear-gradient(90deg, var(--brand), var(--status-ok))' }} />
        </div>
        <span style={{ font: '600 10.5px/1 var(--font-mono)', color: 'var(--text-low)' }}>{pct}%</span>
      </div>
    </Card>
  );
}

function BidBoardWorkspace({ onOpenOpp }) {
  brUseAll(); swUseAssign();
  const isMobile = useIsMobile();
  const leadSt = brLeadState();
  const freshLeads = BR_LEADS.filter(l => !leadSt[l.id]);
  const opps = window.SW.OPPS;

  const cols = [...BR_PHASES.map(p => ({ id: p.id, label: p.label, icon: p.icon })), { id: 'submitted', label: 'Submitted', icon: 'checkCircle' }];
  const byCol = {};
  cols.forEach(c => byCol[c.id] = []);
  opps.forEach(o => {
    const cur = brCurrentPhase(o, brLoad(o.id));
    byCol[cur === 'nogo' ? 'qualify' : cur].push(o);
  });
  cols.forEach(c => byCol[c.id].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)));

  const inFlight = opps.filter(o => { const c = brCurrentPhase(o, brLoad(o.id)); return c !== 'nogo' && c !== 'submitted'; });
  const submitted = byCol.submitted;
  const weekOut = new Date(window.SW.TODAY + 'T00:00:00Z'); weekOut.setUTCDate(weekOut.getUTCDate() + 7);
  const dueSoon = inFlight.filter(o => new Date(o.dueAt) <= weekOut);

  const stats = [
    { label: 'In flight', value: inFlight.length, sub: swK(inFlight.reduce((a, o) => a + o.value, 0)) + ' on the board' },
    { label: 'Due this week', value: dueSoon.length, sub: dueSoon.length ? swK(dueSoon.reduce((a, o) => a + o.value, 0)) + ' at risk' : 'clear runway', warn: dueSoon.length > 2 },
    { label: 'Submitted', value: submitted.length, sub: swK(submitted.reduce((a, o) => a + o.value, 0)) + ' pending award' },
    { label: 'Fresh leads', value: freshLeads.length, sub: 'found by the agent overnight' },
  ];

  return (
    <div style={{ maxWidth: 1460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }} data-screen-label="Bid Board">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <Eyebrow color="var(--brand)">Lead engine · replaces the pipeline</Eyebrow>
          <div style={{ font: `700 ${isMobile ? 20 : 24}px/1.2 var(--font-display)`, color: 'var(--text-high)', marginTop: 5 }}>Bid Board</div>
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

      {/* AI lead feed */}
      {freshLeads.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="sparkles" size={15} color="var(--brand)" />
            <span style={{ font: '700 13.5px/1 var(--font-display)', color: 'var(--text-high)' }}>New leads from the AI agent</span>
            <span style={{ font: '500 11.5px/1 var(--font-body)', color: 'var(--text-low)' }}>— accept to start the guided bid, pass to teach it your taste</span>
          </div>
          <div className="sw-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {freshLeads.map(l => (
              <BbLeadCard key={l.id} lead={l}
                onAccept={() => { brSetLead(l.id, 'accepted'); swToast(l.buyer + ' added — opening the Bid Room', 'ok'); setTimeout(() => onOpenOpp(l.id), 250); }}
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
              <Icon name={c.icon} size={14} color={c.id === 'submitted' ? 'var(--status-ok)' : 'var(--brand)'} />
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

Object.assign(window, { BidBoardWorkspace, BbBidCard, BbLeadCard });

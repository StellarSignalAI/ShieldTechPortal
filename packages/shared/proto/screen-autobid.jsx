/* Auto-Bid — AI-built bids for every scraped lead.
   Each lead gets a machine-built bid (scope read from the source posting +
   SAM.gov description, priced against the pricebook). The board shows three
   pricing tiers per bid with the source URL for cross-referencing; picking a
   tier generates the full branded proposal, which opens instantly and can be
   emailed (popup composer), downloaded, or shared from right here. */

function AutoBidScreen() {
  const [rows, setRows] = React.useState(null);       // null = loading
  const [busy, setBusy] = React.useState({});         // oppId -> 'build'|'proposal'
  const [openId, setOpenId] = React.useState(null);   // expanded lead
  const [viewer, setViewer] = React.useState(null);   // {bid, opp} proposal modal
  const [sweeping, setSweeping] = React.useState(false);

  const refresh = React.useCallback(() => {
    const api = window.__shieldBids; if (!api) return;
    api.list().then(r => setRows(r && r.ok ? r.data : []));
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);

  const setBusyFor = (id, v) => setBusy(prev => ({ ...prev, [id]: v || undefined }));

  const buildOne = async (opp) => {
    setBusyFor(opp.id, 'build');
    const r = await window.__shieldBids.build(opp.id);
    setBusyFor(opp.id, null);
    if (r && r.ok) { showToast(`Bid built for “${opp.title.slice(0, 40)}…”`, 'ok'); refresh(); }
    else showToast(`Bid build failed: ${(r && r.error) || 'unknown'}`, 'error');
  };

  const buildAll = async () => {
    setSweeping(true);
    showToast('Building bids for all new leads — this can take a few minutes…', 'info');
    const r = await window.__shieldBids.buildPending(15);
    setSweeping(false);
    if (r && r.ok) { showToast(`${r.data.built} bids built`, 'ok'); refresh(); }
    else showToast(`Build sweep failed: ${(r && r.error) || 'unknown'}`, 'error');
  };

  const pickTier = async (opp, bid, tier) => {
    setBusyFor(opp.id, 'proposal');
    const r = await window.__shieldBids.proposal(bid.id, tier);
    setBusyFor(opp.id, null);
    if (r && r.ok) {
      refresh();
      setViewer({ opp, bid: { ...bid, selected_tier: tier, proposal_html: r.data.proposalHtml } });
    } else showToast(`Proposal generation failed: ${(r && r.error) || 'unknown'}`, 'error');
  };

  const confColor = { high: 'var(--status-ok)', medium: 'var(--status-warn)', low: 'var(--status-critical)' };
  const fmt$ = (n) => '$' + Number(n || 0).toLocaleString();
  const withBids = rows ? rows.filter(r => r.bid && r.bid.status !== 'pending') : [];
  const ready = withBids.filter(r => r.bid.status === 'ready' || r.bid.status === 'proposal');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1250 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Auto-Bid</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>
            AI reads each posting, prices the work, and drafts the bid. Pick a tier → full proposal, instantly.
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{ready.length} bids ready · nightly auto-build 4:26 AM ET</span>
        <button onClick={buildAll} disabled={sweeping} style={{ padding: '7px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: sweeping ? 0.6 : 1 }}>
          {sweeping ? 'Building…' : '⟡ Build all new leads'}
        </button>
      </div>

      {rows === null && <div className="glass" style={{ padding: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-mid)' }}>Loading leads…</div>}
      {rows !== null && rows.length === 0 && <div className="glass" style={{ padding: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-mid)' }}>No leads yet — the scrapers land them nightly.</div>}

      {(rows || []).map(opp => {
        const bid = opp.bid;
        const b = busy[opp.id];
        const open = openId === opp.id;
        const status = bid ? bid.status : 'none';
        return (
          <div key={opp.id} className="glass" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }} onClick={() => setOpenId(open ? null : opp.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opp.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>
                  {opp.buyer} {opp.state ? `· ${opp.state}` : ''} {opp.due_at ? `· due ${new Date(opp.due_at).toLocaleDateString()}` : ''}
                </div>
              </div>
              {bid && bid.scope && (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: confColor[bid.scope.confidence] || 'var(--text-low)' }}>
                  {bid.scope.confidence} confidence
                </span>
              )}
              {status === 'none' || status === 'error' ? (
                <button onClick={(e) => { e.stopPropagation(); buildOne(opp); }} disabled={!!b} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {b === 'build' ? 'Building…' : status === 'error' ? 'Retry build' : 'Build bid'}
                </button>
              ) : status === 'building' ? (
                <span style={{ fontSize: 11, color: 'var(--status-warn)' }}>building…</span>
              ) : (
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)' }}>
                  {bid.tiers ? `${fmt$(bid.tiers.low.price)} – ${fmt$(bid.tiers.aggressive.price)}` : ''}
                </span>
              )}
              {opp.source_url && (
                <a href={opp.source_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                  style={{ fontSize: 11, color: 'var(--text-mid)', textDecoration: 'none', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                  Source ↗
                </a>
              )}
              <span style={{ color: 'var(--text-low)', fontSize: 13 }}>{open ? '▾' : '▸'}</span>
            </div>

            {open && bid && (status === 'ready' || status === 'proposal') && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-high)', marginBottom: 10, lineHeight: 1.5 }}>{bid.scope?.summary}</div>

                {/* 3 pricing tiers — auto-fit so they stack on a phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                  {['low', 'medium', 'aggressive'].map(k => {
                    const t = bid.tiers?.[k]; if (!t) return null;
                    const selected = bid.selected_tier === k && status === 'proposal';
                    return (
                      <div key={k} className="glass" style={{ padding: 14, border: selected ? '1px solid var(--status-ok)' : k === 'medium' ? '1px solid var(--brand)' : '1px solid var(--border-subtle)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: k === 'low' ? 'var(--status-warn)' : k === 'medium' ? 'var(--brand)' : '#c084fc' }}>
                          {k}{k === 'medium' ? ' · recommended' : ''}{selected ? ' · selected ✓' : ''}
                        </div>
                        <div className="mono" style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 2px' }}>{fmt$(t.price)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 8 }}>{t.marginPct}% margin · cost {fmt$(bid.cost_total)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-mid)', minHeight: 42, lineHeight: 1.45 }}>{t.pitch}</div>
                        <button onClick={() => pickTier(opp, bid, k)} disabled={!!b} style={{ width: '100%', marginTop: 10, padding: '8px', background: selected ? 'rgba(52,211,153,0.12)' : 'var(--brand)', border: 'none', borderRadius: 6, color: selected ? 'var(--status-ok)' : '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          {b === 'proposal' ? 'Generating…' : selected ? 'View proposal' : 'Select → generate proposal'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Grounding: what was read, what's assumed, what's missing */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 11 }}>
                  <div>
                    <div className="label-sm" style={{ marginBottom: 4 }}>LINE ITEMS ({(bid.line_items || []).length}) · {bid.labor_hours}h labor</div>
                    {(bid.line_items || []).slice(0, 8).map((l, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                        <span style={{ color: 'var(--text-mid)' }}>{l.qty}× {l.desc}</span>
                        <span className="mono" style={{ color: 'var(--text-low)' }}>{fmt$((l.qty || 0) * (l.unitCost || 0))}</span>
                      </div>
                    ))}
                    {(bid.line_items || []).length > 8 && <div style={{ color: 'var(--text-low)', paddingTop: 3 }}>+{bid.line_items.length - 8} more…</div>}
                  </div>
                  <div>
                    {(bid.scope?.assumptions || []).length > 0 && <>
                      <div className="label-sm" style={{ marginBottom: 4 }}>ASSUMPTIONS</div>
                      {(bid.scope.assumptions).slice(0, 4).map((a, i) => <div key={i} style={{ color: 'var(--text-mid)', padding: '2px 0' }}>• {a}</div>)}
                    </>}
                    {(bid.scope?.missingInfo || []).length > 0 && <>
                      <div className="label-sm" style={{ margin: '8px 0 4px', color: 'var(--status-warn)' }}>⚠ VERIFY AT SOURCE</div>
                      {(bid.scope.missingInfo).slice(0, 4).map((m, i) => <div key={i} style={{ color: 'var(--status-warn)', padding: '2px 0' }}>• {m}</div>)}
                    </>}
                    <div style={{ marginTop: 8, color: 'var(--text-low)' }}>
                      Read: {(bid.docs_read || []).filter(d => d.fetched).length}/{(bid.docs_read || []).length} sources
                      {opp.source_url && <> · <a href={opp.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>cross-reference ↗</a></>}
                    </div>
                  </div>
                </div>

                {status === 'proposal' && bid.proposal_html && (
                  <button onClick={() => setViewer({ opp, bid })} style={{ marginTop: 12, padding: '7px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Open generated proposal ({(bid.selected_tier || '').toUpperCase()} tier) →
                  </button>
                )}
              </div>
            )}
            {open && bid && status === 'error' && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--status-critical)' }}>Build error: {bid.error}</div>
            )}
          </div>
        );
      })}

      {viewer && <ProposalViewer opp={viewer.opp} bid={viewer.bid} onClose={() => { setViewer(null); refresh(); }} />}
    </div>
  );
}

/* Proposal modal — live preview + Email (popup composer) / Download / Share. */
function ProposalViewer({ opp, bid, onClose }) {
  const [emailOpen, setEmailOpen] = React.useState(false);
  const [to, setTo] = React.useState('');
  const [subject, setSubject] = React.useState(`Proposal — ${opp.title} — ShieldTech Solutions`);
  const [note, setNote] = React.useState(`Hello,\n\nPlease find our proposal for "${opp.title}" below. We're ready to schedule a walkthrough or answer any questions.\n\nBest regards,\nShieldTech Solutions\n(215) 555-0100`);
  const [sending, setSending] = React.useState(false);
  const html = bid.proposal_html || '';

  const download = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ShieldTech-Proposal-${(opp.solicitation_id || opp.id).toString().slice(0, 24)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Proposal downloaded — open it and print to PDF for a paper copy', 'ok');
  };

  const share = async () => {
    try {
      if (navigator.share) {
        const file = new File([html], 'ShieldTech-Proposal.html', { type: 'text/html' });
        await navigator.share({ title: subject, files: [file] });
      } else {
        await navigator.clipboard.writeText(html);
        showToast('Proposal HTML copied to clipboard', 'ok');
      }
    } catch { /* user cancelled */ }
  };

  const send = async () => {
    if (!to.includes('@')) { showToast('Enter a valid email address', 'warn'); return; }
    setSending(true);
    const noteHtml = note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
    const r = await window.__shieldEmail.send({
      to: to.trim(), subject,
      html: `<p style="font-family:sans-serif;font-size:14px">${noteHtml}</p><hr/>${html.replace(/^[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, '')}`,
    });
    setSending(false);
    if (r && r.ok) {
      window.__shieldBids.markSent(bid.id, to.trim());
      showToast(`Proposal emailed to ${to.trim()}`, 'ok');
      setEmailOpen(false);
    } else showToast(`Email failed: ${(r && r.error) || 'unknown'} — use Download instead`, 'error');
  };

  const btn = { padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };
  const inputStyle = { width: '100%', padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass" style={{ width: 'min(940px, 96vw)', height: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Proposal — {opp.title}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>{(bid.selected_tier || '').toUpperCase()} tier {bid.sent_at ? `· sent to ${bid.sent_to}` : ''}</div>
          </div>
          <button onClick={() => setEmailOpen(true)} style={{ ...btn, background: 'var(--brand)', border: 'none', color: '#fff' }}>✉ Email</button>
          <button onClick={download} style={{ ...btn, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', color: 'var(--brand)' }}>⭳ Download</button>
          <button onClick={share} style={{ ...btn, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)' }}>⇪ Share</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <iframe title="proposal" srcDoc={html} style={{ flex: 1, border: 'none', background: '#fff' }} />

        {emailOpen && (
          <div onClick={() => setEmailOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 'min(460px, 92vw)', padding: 22, borderRadius: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Send proposal</div>
              <div className="label-sm" style={{ marginBottom: 4 }}>TO</div>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="buyer@agency.gov" style={{ ...inputStyle, marginBottom: 10 }} autoFocus />
              <div className="label-sm" style={{ marginBottom: 4 }}>SUBJECT</div>
              <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
              <div className="label-sm" style={{ marginBottom: 4 }}>MESSAGE (proposal attached below it)</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setEmailOpen(false)} style={{ ...btn, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)' }}>Cancel</button>
                <button onClick={send} disabled={sending} style={{ ...btn, background: 'var(--brand)', border: 'none', color: '#fff', opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending…' : 'Send proposal'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AutoBidScreen, ProposalViewer });

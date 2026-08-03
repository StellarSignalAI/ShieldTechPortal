/* ShieldTech Desktop — Operations Cockpit (PREVIEW / sample page)
   A working taste of the bespoke desktop: one command-center home where the
   work comes to you. Three live columns (Today · Money in motion · Win work)
   on REAL data, a command bar that does things, and slide-in peek panels so
   you never lose your place. Marked as a preview — delete by removing this
   file, its manifest import, and the 'cockpit' nav/screen entries. */

const CKP_$ = (n) => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const CKP_CONF = { high: 'var(--status-ok)', medium: 'var(--status-warn)', low: 'var(--status-critical)' };

function CkpCard({ children, accent, onClick, style }) {
  return (
    <div onClick={onClick} className="glass" style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 9, cursor: onClick ? 'pointer' : 'default', borderLeft: accent ? `3px solid ${accent}` : undefined, transition: 'transform 0.1s', ...style }}
      onMouseDown={e => { if (onClick) e.currentTarget.style.transform = 'scale(0.995)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}>
      {children}
    </div>
  );
}
const CkpColTitle = ({ icon, label, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-mid)', textTransform: 'uppercase' }}>{label}</span>
    {count != null && <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: color || 'var(--brand)' }}>{count}</span>}
  </div>
);
const CkpEmpty = ({ children }) => <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 11.5, color: 'var(--text-low)', border: '1px dashed var(--border-subtle)', borderRadius: 11 }}>{children}</div>;
const ckpBtn = (variant) => ({
  padding: '7px 13px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  border: variant === 'primary' ? 'none' : `1px solid ${variant === 'ok' ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`,
  background: variant === 'primary' ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : variant === 'ok' ? 'rgba(52,211,153,0.09)' : 'transparent',
  color: variant === 'primary' ? '#fff' : variant === 'ok' ? 'var(--status-ok)' : 'var(--text-mid)',
});

/* Slide-in peek panel — inspect and act without leaving the cockpit */
function CkpPeek({ peek, onClose, onAction }) {
  if (!peek) return null;
  const d = peek.doc;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 3000, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 92vw)', zIndex: 3001, background: 'var(--modal, #0d1420)', borderLeft: '1px solid var(--border-strong)', boxShadow: '-18px 0 50px rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', animation: 'fade-up 0.18s ease both' }}>
        <div style={{ padding: '16px 20px 13px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase' }}>{peek.kind}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>{d.num}</div>
          </div>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high)' }}>{CKP_$(d.amount)}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 20, cursor: 'pointer', padding: '0 0 0 6px' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
            {[['Customer', d.customer], ['Status', d.status], [peek.kind === 'invoice' ? 'Due' : 'Expires', d.due || d.expires || '—'], ['Source', d.source || 'portal']].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 11px' }}>
                <div style={{ fontSize: 8.5, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-high)', fontWeight: 500 }}>{String(v)}</div>
              </div>
            ))}
          </div>
          {(d.lines || []).length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-low)', marginBottom: 7 }}>LINE ITEMS</div>
            {d.lines.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.06)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{l.desc}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{l.qty}×{CKP_$(l.rate)}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{CKP_$((Number(l.qty) || 1) * (Number(l.rate) || 0))}</span>
              </div>
            ))}
          </>}
          <div style={{ marginTop: 14, fontSize: 10.5, color: 'var(--text-low)', lineHeight: 1.5 }}>In the full bespoke desktop this panel is the complete editor — line items, dates, status, payment links — layered over whatever you were doing. Close it and you're exactly where you left off.</div>
        </div>
        <div style={{ padding: '13px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 9 }}>
          {peek.kind === 'invoice' && d.status !== 'paid' && (
            <button onClick={() => onAction('paid', peek)} style={{ ...ckpBtn('ok'), flex: 1, padding: '11px 0' }}>✓ Mark paid</button>
          )}
          {peek.kind === 'estimate' && d.status !== 'accepted' && (
            <button onClick={() => onAction('accept', peek)} style={{ ...ckpBtn('ok'), flex: 1, padding: '11px 0' }}>✓ Accept → Project</button>
          )}
          <button onClick={() => { window.location.hash = peek.kind === 'invoice' ? '#/invoices' : '#/estimates'; }} style={{ ...ckpBtn('primary'), flex: 1, padding: '11px 0' }}>Open full editor →</button>
        </div>
      </div>
    </>
  );
}

function CockpitPreviewScreen() {
  const [jobs] = useShieldStore(jobStore);
  const [incidents] = useShieldStore(incidentStore);
  const invoices = useMergedInvoices();
  const estimates = useMergedEstimates();
  const [bids, setBids] = React.useState(null);
  const [peek, setPeek] = React.useState(null);
  const [cmd, setCmd] = React.useState('');
  const [busy, setBusy] = React.useState({});
  const refreshBids = React.useCallback(() => {
    const api = window.__shieldBids; if (!api) return setBids([]);
    api.list().then(r => setBids(r && r.ok ? r.data.filter(o => o.bid && o.bid.status === 'proposal' && !o.bid.sent_at) : []));
  }, []);
  React.useEffect(() => { refreshBids(); }, [refreshBids]);

  const todayJobs = (jobs || []).filter(j => jobOnISO(j, todayISO())).sort((a, b) => a.start - b.start);
  const openInc = (incidents || []).filter(i => i.status !== 'resolved');
  const hotInvoices = invoices.filter(i => i.status === 'overdue' || i.status === 'pending').sort((a, b) => (b.status === 'overdue') - (a.status === 'overdue')).slice(0, 8);
  const waitingEst = estimates.filter(e => !/accepted|expired|declined/.test(e.status)).slice(0, 6);

  const peekAction = (act, p) => {
    if (act === 'paid') { saveDocEdit('invoice', { num: p.doc.num, customer: p.doc.customer, status: 'paid', lines: p.doc.lines, total: p.doc.amount }); showToast(`${p.doc.num} marked paid`, 'ok'); }
    if (act === 'accept') { const proj = acceptEstimateToProject(p.doc._raw, 'manual'); showToast(`${p.doc.num} accepted — project ${proj.number} created`, 'ok'); }
    setPeek(null);
  };

  const approveEmail = async (o) => {
    const email = window.prompt(`Email the ${o.title} proposal to:`, '');
    if (!email || !email.includes('@')) { if (email !== null) showToast('Enter a valid email', 'warn'); return; }
    setBusy(b => ({ ...b, [o.id]: true }));
    const html = o.bid.proposal_html || '';
    const r = await window.__shieldEmail.send({ to: email.trim(), subject: `Proposal — ${o.title} — ShieldTech Solutions`, html });
    setBusy(b => ({ ...b, [o.id]: false }));
    if (r && r.ok) { await window.__shieldBids.markSent(o.bid.id, email.trim()); window.__shieldBids.toPipeline(o, o.bid); showToast(`Proposal emailed to ${email.trim()}`, 'ok'); refreshBids(); }
    else showToast(`Email failed: ${(r && r.error) || 'unknown'}`, 'error');
  };
  const approveDownload = (o) => {
    const blob = new Blob([o.bid.proposal_html || ''], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ShieldTech-Proposal-${String(o.solicitation_id || o.id).slice(0, 24)}.html`; a.click(); URL.revokeObjectURL(a.href);
    window.__shieldBids.toPipeline(o, o.bid);
    showToast('Proposal downloaded — added to the pipeline', 'ok');
  };

  const runCmd = () => {
    const q = cmd.trim();
    if (!q) return;
    const inv = q.match(/^invoice\s+(.+?)\s+\$?([\d,.]+)$/i);
    if (inv) {
      const rec = addInvoice({ customer_name: inv[1].trim(), total: Number(inv[2].replace(/,/g, '')) || 0, status: 'open' });
      showToast(`Invoice ${rec.doc_number} created for ${inv[1].trim()}`, 'ok'); setCmd(''); return;
    }
    const target = (window.NAV_ITEMS || []).find(i => i.label.toLowerCase().includes(q.toLowerCase().replace(/^go\s+/, '')));
    if (target) { window.location.hash = '#/' + target.id; setCmd(''); return; }
    showToast('Try: “invoice Acme 2500” · “go projects” · any screen name', 'info');
  };

  return (
    <div style={{ padding: '22px 28px 40px', maxWidth: 1560, margin: '0 auto' }}>
      {/* Preview banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, border: '1px dashed rgba(192,132,252,0.5)', background: 'rgba(192,132,252,0.06)', marginBottom: 18 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#c084fc', border: '1px solid rgba(192,132,252,0.5)', borderRadius: 5, padding: '2px 7px' }}>PREVIEW</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>A sample of the bespoke desktop — one command center on your live data. Tell Claude “make this my desktop” or “delete the preview”.</span>
      </div>

      {/* Header: greeting + command bar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 300, color: 'var(--text-high)', lineHeight: 1.15 }}>Operations Cockpit</div>
        </div>
        <div style={{ flex: 1, minWidth: 320, maxWidth: 640 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => e.key === 'Enter' && runCmd()}
              placeholder='Type a command — “invoice Acme 2500” · “go projects” · “auto-bid”'
              style={{ flex: 1, padding: '13px 17px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.05)', color: 'var(--text-high)', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none' }} />
            <button onClick={runCmd} style={{ ...ckpBtn('primary'), padding: '0 20px', fontSize: 13 }}>⏎</button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 5 }}>In the full build this is ⌘K from anywhere — it creates, finds, and navigates.</div>
        </div>
      </div>

      {/* Three live working columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, alignItems: 'start' }}>

        {/* TODAY */}
        <div className="glass" style={{ padding: '16px 16px 10px', borderRadius: 16 }}>
          <CkpColTitle icon="🗓" label="Today" count={todayJobs.length + openInc.length} />
          {openInc.slice(0, 3).map(i => (
            <CkpCard key={i.id} accent="var(--status-critical)" onClick={() => { window.location.hash = '#/incidents'; }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>⚠ {i.title || i.site}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{i.sev || i.priority || 'incident'} · open</div>
            </CkpCard>
          ))}
          {todayJobs.map(j => (
            <CkpCard key={j.id} accent={(window.M_TECH_COLORS || {})[(j.techs || [])[0]] || '#94A3B8'} onClick={() => { window.location.hash = '#/calendar'; }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{window.mFmtH ? window.mFmtH(j.start) : j.start}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                <span style={{ fontSize: 10, color: (j.techs || []).length ? 'var(--text-low)' : 'var(--status-warn)' }}>{(j.techs || []).join(', ') || '◌ unassigned'}</span>
              </div>
            </CkpCard>
          ))}
          {todayJobs.length === 0 && openInc.length === 0 && <CkpEmpty>Clear runway — nothing scheduled and no open incidents today.</CkpEmpty>}
          <div style={{ padding: '6px 2px 8px' }}>
            <button onClick={() => { window.location.hash = '#/dispatch'; }} style={{ ...ckpBtn(), width: '100%', padding: '9px 0' }}>Dispatch & live fleet map →</button>
          </div>
        </div>

        {/* MONEY IN MOTION */}
        <div className="glass" style={{ padding: '16px 16px 10px', borderRadius: 16 }}>
          <CkpColTitle icon="💵" label="Money in motion" count={CKP_$(hotInvoices.reduce((s, i) => s + i.amount, 0) + waitingEst.reduce((s, e) => s + e.amount, 0))} color="var(--status-warn)" />
          {hotInvoices.map(i => (
            <CkpCard key={i.num} accent={i.status === 'overdue' ? 'var(--status-critical)' : 'var(--status-warn)'} onClick={() => setPeek({ kind: 'invoice', doc: i })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.num} · {i.customer}</div>
                  <div style={{ fontSize: 10, color: i.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)' }}>{i.status === 'overdue' ? `${i.days}d overdue` : `due ${i.due}`}</div>
                </div>
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)' }}>{CKP_$(i.amount)}</span>
              </div>
            </CkpCard>
          ))}
          {waitingEst.map(e => (
            <CkpCard key={e.num} accent="var(--brand)" onClick={() => setPeek({ kind: 'estimate', doc: e })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.num} · {e.customer}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)' }}>estimate · {e.status} — awaiting decision</div>
                </div>
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)' }}>{CKP_$(e.amount)}</span>
              </div>
            </CkpCard>
          ))}
          {hotInvoices.length === 0 && waitingEst.length === 0 && <CkpEmpty>Nothing stuck — no overdue invoices and no estimates waiting on customers.</CkpEmpty>}
          <div style={{ padding: '6px 2px 8px', fontSize: 10, color: 'var(--text-low)', textAlign: 'center' }}>Click any card — it peeks in from the right, actions included.</div>
        </div>

        {/* WIN WORK */}
        <div className="glass" style={{ padding: '16px 16px 10px', borderRadius: 16 }}>
          <CkpColTitle icon="⟡" label="Win work — bids to approve" count={bids ? bids.length : '…'} color="var(--status-ok)" />
          {bids === null && <CkpEmpty>Loading the Auto-Bid queue…</CkpEmpty>}
          {(bids || []).slice(0, 6).map(o => {
            const t = (o.bid.tiers || {})[o.bid.selected_tier || 'medium'] || {};
            return (
              <CkpCard key={o.id} accent="var(--status-ok)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  {o.bid.scope && <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', color: CKP_CONF[o.bid.scope.confidence] }}>{o.bid.scope.confidence}</span>}
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{CKP_$(t.price)}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3 }}>{o.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', margin: '2px 0 9px' }}>{o.buyer}{o.due_at ? ` · due ${new Date(o.due_at).toLocaleDateString()}` : ''}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button disabled={busy[o.id]} onClick={() => approveEmail(o)} style={{ ...ckpBtn('primary'), flex: 1.3, padding: '8px 0' }}>{busy[o.id] ? 'Sending…' : '✉ Approve & Email'}</button>
                  <button onClick={() => approveDownload(o)} style={{ ...ckpBtn(), flex: 1, padding: '8px 0' }}>⭳ Download</button>
                </div>
              </CkpCard>
            );
          })}
          {bids !== null && bids.length === 0 && <CkpEmpty>Queue clear — new bids build themselves nightly and land here for approval.</CkpEmpty>}
          <div style={{ padding: '6px 2px 8px' }}>
            <button onClick={() => { window.location.hash = '#/autobid'; }} style={{ ...ckpBtn(), width: '100%', padding: '9px 0' }}>Full Auto-Bid board →</button>
          </div>
        </div>
      </div>

      <CkpPeek peek={peek} onClose={() => setPeek(null)} onAction={peekAction} />
    </div>
  );
}

Object.assign(window, { CockpitPreviewScreen });

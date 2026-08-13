/* ShieldTech Sales — CRM extension app (sales.shieldtechsolutions.com).
   Wires DIRECTLY into the same live stores as the portal (customers,
   proposals, estimates+QBO, Auto-Bid opportunities, projects) — nothing is
   copied or synced. Salesforce-core toolset: pipeline kanban with stages &
   weighted forecast, leads, activities/tasks, quoting with real accept
   links, dashboards, and AI-drafted outreach.

   Access is administered from the portal: Users & Invites → role "Sales" /
   app checkbox "Sales" (profiles.app_rights.sales). */

/* ── Sales stores (synced like everything else) ── */
const salesDealStore = createShieldStore('sdeals', []);     // manual deals
const salesActStore = createShieldStore('sacts', []);       // activities & tasks
const salesStageStore = createShieldStore('sstages', {});   // stage overrides for derived pipeline items

const SALES_STAGES = [
  ['lead', 'Lead', '#94A3B8', 0.10],
  ['qualified', 'Qualified', '#3FA9F5', 0.35],
  ['proposal', 'Proposal Sent', '#FBBF24', 0.60],
  ['won', 'Won', '#34D399', 1],
  ['lost', 'Lost', '#F43F5E', 0],
];
const SALES_STAGE = Object.fromEntries(SALES_STAGES.map(([id, label, c, p]) => [id, { label, c, p }]));
const salesFmt$ = (n) => n >= 1000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K` : `$${Math.round(n || 0).toLocaleString()}`;
const salesMe = () => (window.__shieldUser && (window.__shieldUser.name || window.__shieldUser.email)) || 'Me';

/* ── Unified pipeline: EVERY bid in the business, one list ──
   Sources: manual deals, block-built proposals, portal+QuickBooks quotes,
   Auto-Bid opportunities. Derived items get their default stage from the
   underlying status; dragging to another stage stores an override. */
function useSalesPipeline() {
  const [deals] = useShieldStore(salesDealStore);
  const [props] = useShieldStore(proposalStore);
  const [projects] = useShieldStore(projectStore);
  const [overrides] = useShieldStore(salesStageStore);
  const merged = useMergedEstimates();
  const [opps, setOpps] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    if (window.__shieldBids) window.__shieldBids.list().then(r => { if (alive && r && r.ok) setOpps(r.data || []); });
    return () => { alive = false; };
  }, []);

  const items = React.useMemo(() => {
    const ov = overrides || {};
    const out = [];
    const projFor = (ref) => (projects || []).find(p => (p.estimateRefs || []).includes(ref)) || null;

    (deals || []).forEach(d => out.push({
      key: 'deal-' + d.id, kind: 'Deal', ref: d.title, title: d.title, customer: d.customer || '—',
      value: Number(d.value) || 0, owner: d.owner || '—', createdAt: d.createdAt || 0,
      stage: d.stage || 'lead', _deal: d,
    }));

    const docNums = new Set(merged.map(m => m.num));
    (props || []).forEach(p => {
      if (docNums.has(p.id)) return;   // sent proposals become doc rows — avoid double counting
      const stage = p.status === 'accepted' ? 'won' : p.status === 'declined' ? 'lost' : p.status === 'sent' ? 'proposal' : 'qualified';
      out.push({
        key: 'prop-' + p.id, kind: 'Proposal', ref: p.id, title: p.title || p.id, customer: p.customer || '—',
        value: (typeof proposalValue === 'function' ? proposalValue(p.blocks) : 0) || 0,
        owner: p.owner || '—', createdAt: p.sentAt || 0, stage, _prop: p,
      });
    });

    const bidRefs = new Set(merged.map(m => (m._raw || {}).bid_ref).filter(Boolean));
    merged.forEach(m => {
      const proj = projFor(m.num);
      const stage = (m.status === 'accepted' || proj) ? 'won' : m.status === 'expired' ? 'lost' : m.status === 'draft' ? 'qualified' : 'proposal';
      out.push({
        key: 'q-' + m.num, kind: m.source === 'quickbooks' ? 'QuickBooks Quote' : 'Quote', ref: m.num,
        title: (m._raw && m._raw.title) || `${m.num} — ${m.customer}`, customer: m.customer,
        value: m.amount || 0, owner: (m._raw && m._raw.owner) || '—', createdAt: 0,
        stage, project: proj, _doc: m,
      });
    });

    (opps || []).forEach(o => {
      if (o.bid && bidRefs.has(o.bid.id)) return;   // approved into the money pipeline — quote row covers it
      const tiers = (o.bid && o.bid.tiers) || {};
      const tier = tiers[(o.bid && o.bid.selected_tier) || 'medium'] || {};
      out.push({
        key: 'opp-' + o.id, kind: 'Auto-Bid', ref: o.solicitation_id || o.id, title: o.title || 'Opportunity',
        customer: o.buyer || '—', value: Number(tier.price) || 0, owner: '—',
        createdAt: o.created_at ? new Date(o.created_at).getTime() : 0,
        stage: o.bid ? (o.bid.sent_at ? 'proposal' : 'qualified') : 'lead',
        due: o.due_at, _opp: o,
      });
    });

    return out.map(it => ov[it.key] && !it._deal ? { ...it, stage: ov[it.key] } : it);
  }, [deals, props, merged, opps, projects, overrides]);

  return items;
}

function setPipelineStage(item, stage) {
  if (item._deal) salesDealStore.set(list => (list || []).map(d => d.id === item._deal.id ? { ...d, stage } : d));
  else salesStageStore.set(m => ({ ...(m || {}), [item.key]: stage }));
  if (stage === 'won') showToast(`${item.title} marked WON 🎉`, 'ok');
}

/* ── Activities ── */
function addActivity(rec) {
  salesActStore.set(list => [{
    id: 'a' + Date.now().toString(36), createdAt: Date.now(), status: 'open', by: salesMe(),
    ...rec,
  }, ...(list || [])]);
}

/* ── AI follow-up drafts (ShieldTech AI) ── */
async function salesDraftEmail(item, intent) {
  const ai = window.__shieldAI;
  if (!ai || !ai.askShieldAI) return { ok: false, error: 'AI not configured' };
  try {
    const r = await ai.askShieldAI('sales-assist', [{
      role: 'user',
      content: `Write a short, professional ${intent} email for a security-integration deal.\nDeal: ${item.title}\nCustomer: ${item.customer}\nValue: $${(item.value || 0).toLocaleString()}\nStage: ${SALES_STAGE[item.stage].label}\nCompany: ShieldTech Solutions (security systems — cameras, access control, monitoring).\nReturn ONLY the email body, no subject line, no placeholders like [Name] left unexplained.`,
    }]);
    return r && r.text ? { ok: true, text: r.text } : { ok: false, error: (r && r.error) || 'no response' };
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function salesSendEmail(to, subject, text) {
  const sb = window.__shieldSupabase;
  if (!sb) return { ok: false, error: 'Backend not configured' };
  try {
    const { data, error } = await invokeEdgeFn(sb, 'send-email', { to, subject, text });
    if (error || !data || !data.ok) return { ok: false, error: (data && data.error) || (error && error.message) || 'send failed' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/* ══════════════ PIPELINE (kanban) ══════════════ */
function SalesPipelineView({ openItem }) {
  const items = useSalesPipeline();
  const [query, setQuery] = React.useState('');
  const [newDeal, setNewDeal] = React.useState(false);
  const shown = items.filter(i => docSearchMatch(query, i.ref, i.title, i.customer, i.value, i.kind, SALES_STAGE[i.stage].label));
  const openItems = shown.filter(i => i.stage !== 'won' && i.stage !== 'lost');
  const pipeValue = openItems.reduce((s, i) => s + i.value, 0);
  const forecast = openItems.reduce((s, i) => s + i.value * SALES_STAGE[i.stage].p, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <MStat label="PIPELINE" value={salesFmt$(pipeValue)} sub={`${openItems.length} open`} accent="var(--brand)" />
        <MStat label="FORECAST" value={salesFmt$(forecast)} sub="probability-weighted" accent="var(--status-ok)" delay={60} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕ Search every bid — name, customer, amount…"
          style={{ flex: 1, padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => setNewDeal(true)} style={{ padding: '0 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>+ Deal</button>
      </div>

      {/* Kanban — horizontal scroll on any screen size */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', flex: 1, WebkitOverflowScrolling: 'touch', paddingBottom: 6 }}>
        {SALES_STAGES.map(([id, label, c]) => {
          const col = shown.filter(i => i.stage === id);
          const colVal = col.reduce((s, i) => s + i.value, 0);
          return (
            <div key={id} style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ padding: '8px 11px', borderRadius: 9, background: `${c}0e`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c }}>{label}</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{col.length} · {salesFmt$(colVal)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto' }}>
                {col.map(i => (
                  <div key={i.key} onClick={() => openItem(i)} className="glass" style={{ padding: '10px 12px', borderRadius: 11, borderLeft: `3px solid ${c}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: c }}>{i.kind}</span>
                      {i.project && <span style={{ fontSize: 8.5, color: 'var(--status-ok)' }}>→ {i.project.number}</span>}
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--text-high)' }}>{i.value ? salesFmt$(i.value) : '—'}</span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{i.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{i.customer}{i.due ? ` · due ${new Date(i.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</div>
                  </div>
                ))}
                {col.length === 0 && <div style={{ padding: '14px 10px', fontSize: 10.5, color: 'var(--text-low)', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>Nothing here</div>}
              </div>
            </div>
          );
        })}
      </div>
      {newDeal && <SalesNewDealSheet onClose={() => setNewDeal(false)} />}
    </div>
  );
}

function SalesNewDealSheet({ onClose, presetCustomer }) {
  const [allCusts] = useShieldStore(customerStore);
  const [f, setF] = React.useState({ title: '', customer: presetCustomer || '', value: '', stage: 'lead', notes: '' });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };
  const save = () => {
    if (!f.title.trim()) { showToast('Deal name is required', 'warn'); return; }
    salesDealStore.set(list => [{
      id: Date.now(), title: f.title.trim(), customer: f.customer || '—', value: Number(f.value) || 0,
      stage: f.stage, notes: f.notes, owner: salesMe(), createdAt: Date.now(),
    }, ...(list || [])]);
    showToast(`Deal "${f.title.trim()}" added to the pipeline`, 'ok');
    onClose();
  };
  return (
    <MSheet title="New Deal" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div><span style={lbl}>Deal name *</span><input value={f.title} onChange={set('title')} placeholder="e.g. Harbor View — 16-camera upgrade" style={inp} /></div>
        <div><span style={lbl}>Customer / prospect</span>
          <input list="sales-cust-list" value={f.customer} onChange={set('customer')} placeholder="Type or pick…" style={inp} />
          <datalist id="sales-cust-list">{(allCusts || []).map(c => <option key={c.id} value={c.name} />)}</datalist>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><span style={lbl}>Est. value ($)</span><input type="number" value={f.value} onChange={set('value')} placeholder="0" style={inp} /></div>
          <div style={{ flex: 1 }}><span style={lbl}>Stage</span>
            <select value={f.stage} onChange={set('stage')} style={{ ...inp, cursor: 'pointer' }}>
              {SALES_STAGES.filter(([id]) => id !== 'won' && id !== 'lost').map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>
        <div><span style={lbl}>Notes</span><textarea value={f.notes} onChange={set('notes')} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add Deal</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Deal detail sheet: stage, actions, AI, activity log ── */
function SalesDealSheet({ item, onClose }) {
  const [acts] = useShieldStore(salesActStore);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const [logOpen, setLogOpen] = React.useState(false);
  const linked = (acts || []).filter(a => a.dealKey === item.key);
  const st = SALES_STAGE[item.stage];

  const emailAcceptLink = async () => {
    const email = window.prompt(`Send the accept link for ${item.ref} ($${(item.value || 0).toLocaleString()}) to:`, '');
    if (!email || !email.includes('@')) { if (email !== null) showToast('Enter a valid email', 'warn'); return; }
    const api = window.__shieldAcceptance;
    if (!api) { showToast('Acceptance backend not configured', 'warn'); return; }
    const doc = item._doc;
    const r = await api.send({ estimateRef: doc.num, estimateQboId: doc.qboId, customerName: doc.customer, customerEmail: email.trim(), amount: doc.amount });
    if (r && r.ok) {
      showToast(r.data.emailed ? `Accept link for ${item.ref} emailed to ${email.trim()}` : `Link created (email not sent: ${r.data.emailError})`, 'ok');
      setPipelineStage(item, 'proposal');
      addActivity({ type: 'email', note: `Sent accept link for ${item.ref} to ${email.trim()}`, dealKey: item.key, customer: item.customer, status: 'done' });
    } else showToast(`Could not send: ${(r && r.error) || 'unknown'}`, 'error');
  };

  const winToProject = () => {
    if (item._doc && item._doc._raw && typeof acceptEstimateToProject === 'function') {
      const proj = acceptEstimateToProject(item._doc._raw, 'manual');
      showToast(`${item.ref} WON — project ${proj.number} created with the quote attached`, 'ok');
    }
    setPipelineStage(item, 'won');
    addActivity({ type: 'note', note: `${item.title} marked won`, dealKey: item.key, customer: item.customer, status: 'done' });
    onClose();
  };

  const aiDraft = async (intent) => {
    setAiBusy(true);
    const r = await salesDraftEmail(item, intent);
    setAiBusy(false);
    if (r.ok) setDraft({ intent, text: r.text });
    else showToast(`AI unavailable: ${r.error}`, 'warn');
  };
  const sendDraft = async () => {
    const to = window.prompt('Send this email to:', '');
    if (!to || !to.includes('@')) { if (to !== null) showToast('Enter a valid email', 'warn'); return; }
    const r = await salesSendEmail(to.trim(), `${item.title} — ShieldTech Solutions`, draft.text);
    if (r.ok) {
      showToast(`Email sent to ${to.trim()}`, 'ok');
      addActivity({ type: 'email', note: `Emailed ${to.trim()}: ${draft.intent}`, dealKey: item.key, customer: item.customer, status: 'done' });
      setDraft(null);
    } else showToast(`Send failed: ${r.error}`, 'error');
  };

  const act = (bg, border, color) => ({ padding: '10px 12px', background: bg, border, borderRadius: 10, color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center' });

  return (
    <MSheet title={item.title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: st.c, background: `${st.c}14`, border: `1px solid ${st.c}40`, padding: '3px 9px', borderRadius: 100 }}>{item.kind}</span>
          <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.customer}</span>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 17, fontWeight: 700, color: 'var(--text-high)' }}>{item.value ? salesFmt$(item.value) : '—'}</span>
        </div>

        {/* Stage stepper */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 6, display: 'block' }}>Stage · {Math.round(SALES_STAGE[item.stage].p * 100)}% win probability</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {SALES_STAGES.map(([id, label, c]) => (
              <button key={id} onClick={() => { if (id === 'won') { winToProject(); } else { setPipelineStage(item, id); onClose(); } }}
                style={{ padding: '7px 11px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: item.stage === id ? `${c}20` : 'transparent', border: `1px solid ${item.stage === id ? c : 'var(--border-subtle)'}`, color: item.stage === id ? c : 'var(--text-low)' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {item._doc && item.stage !== 'won' && <button onClick={emailAcceptLink} style={act('rgba(63,169,245,0.08)', '1px solid var(--border-strong)', 'var(--brand)')}>✉ Email accept link</button>}
          {item.stage !== 'won' && <button onClick={winToProject} style={act('rgba(52,211,153,0.08)', '1px solid rgba(52,211,153,0.3)', 'var(--status-ok)')}>✓ Won{item._doc ? ' → Project' : ''}</button>}
          <button onClick={() => setLogOpen(true)} style={act('rgba(63,169,245,0.05)', '1px solid var(--border-subtle)', 'var(--text-mid)')}>+ Log activity / task</button>
          <button disabled={aiBusy} onClick={() => aiDraft('follow-up')} style={act('rgba(192,132,252,0.08)', '1px solid rgba(192,132,252,0.3)', '#c084fc')}>{aiBusy ? 'Drafting…' : '⟡ AI follow-up email'}</button>
        </div>

        {/* AI draft */}
        {draft && (
          <div className="glass" style={{ padding: 13, borderRadius: 12, borderLeft: '3px solid #c084fc' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI draft — {draft.intent}</div>
            <textarea value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} rows={7}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 12.5, lineHeight: 1.5, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(draft.text); showToast('Copied', 'ok'); }} style={act('transparent', '1px solid var(--border-subtle)', 'var(--text-mid)')}>Copy</button>
              <button onClick={sendDraft} style={{ ...act('linear-gradient(135deg, var(--brand), var(--brand-pressed))', 'none', '#fff'), flex: 1 }}>Send email →</button>
            </div>
          </div>
        )}

        {/* Activity log */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 6, display: 'block' }}>Activity ({linked.length})</span>
          {linked.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)' }}>No activity yet — log a call, meeting, or task above.</div>}
          {linked.slice(0, 8).map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)', width: 44, flexShrink: 0 }}>{a.type}</span>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{a.note}</span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          ))}
        </div>
      </div>
      {logOpen && <SalesNewActivitySheet preset={{ dealKey: item.key, customer: item.customer }} onClose={() => setLogOpen(false)} />}
    </MSheet>
  );
}

/* ══════════════ LEADS ══════════════ */
function SalesLeadsView({ openDealFor }) {
  const [custs] = useShieldStore(customerStore);
  const [query, setQuery] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const rows = (custs || []).filter(c => docSearchMatch(query, c.name, c.industry, c.phone, c.email, c.owner, c.leadStatus || c.status));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕ Search leads & customers…"
          style={{ flex: 1, padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => setAdding(true)} style={{ padding: '0 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>+ Lead</button>
      </div>
      {rows.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{query ? `Nothing matches “${query}”.` : 'No leads yet — tap + Lead to add your first prospect.'}</div>}
      {rows.map(c => (
        <div key={c.id} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{c.logo || (c.name || '?').slice(0, 2).toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{[c.industry, c.phone, c.email].filter(Boolean).join(' · ') || '—'}</div>
            </div>
            {c.leadStatus === 'lead' && <span style={{ fontSize: 8.5, fontWeight: 700, color: '#FBBF24', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 100, padding: '2px 8px' }}>LEAD</span>}
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
            <button onClick={() => openDealFor(c.name)} style={{ flex: 1, padding: '8px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Deal</button>
            {c.phone && <a href={`tel:${c.phone}`} onClick={() => addActivity({ type: 'call', note: `Called ${c.name}`, customer: c.name, status: 'done' })} style={{ flex: 1, padding: '8px 0', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 9, color: 'var(--status-ok)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', textDecoration: 'none' }}>📞 Call</a>}
            <button onClick={() => addActivity({ type: 'task', note: `Follow up with ${c.name}`, customer: c.name, due: addDaysISO(todayISO(), 2) }) || showToast('Follow-up task added for 2 days out', 'ok')} style={{ flex: 1, padding: '8px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-mid)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⏰ Follow up</button>
          </div>
        </div>
      ))}
      {adding && <SalesNewLeadSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function SalesNewLeadSheet({ onClose }) {
  const [f, setF] = React.useState({ name: '', industry: '', phone: '', email: '', notes: '' });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };
  const save = () => {
    if (!f.name.trim()) { showToast('Company / name required', 'warn'); return; }
    const rec = { ...buildCustomer({ name: f.name, industry: f.industry, phone: f.phone, notes: f.notes, owner: salesMe(), source: 'sales-app' }), email: f.email || '', leadStatus: 'lead' };
    customerStore.set(list => [rec, ...(list || [])]);
    showToast(`Lead "${rec.name}" added — visible in the portal too`, 'ok');
    onClose();
  };
  return (
    <MSheet title="New Lead" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div><span style={lbl}>Company / name *</span><input value={f.name} onChange={set('name')} placeholder="e.g. Lakeside Storage" style={inp} /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><span style={lbl}>Industry</span><input value={f.industry} onChange={set('industry')} placeholder="Retail, Medical…" style={inp} /></div>
          <div style={{ flex: 1 }}><span style={lbl}>Phone</span><input value={f.phone} onChange={set('phone')} placeholder="(555) 555-0123" style={inp} /></div>
        </div>
        <div><span style={lbl}>Email</span><input value={f.email} onChange={set('email')} placeholder="contact@company.com" style={inp} /></div>
        <div><span style={lbl}>Notes</span><textarea value={f.notes} onChange={set('notes')} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add Lead</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ══════════════ TASKS & ACTIVITIES ══════════════ */
function SalesNewActivitySheet({ preset, onClose }) {
  const [f, setF] = React.useState({ type: 'task', note: '', due: '', customer: (preset && preset.customer) || '' });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', colorScheme: 'dark' };
  const lbl = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };
  const save = () => {
    if (!f.note.trim()) { showToast('Describe the activity', 'warn'); return; }
    addActivity({ type: f.type, note: f.note.trim(), due: f.due || null, customer: f.customer, dealKey: preset && preset.dealKey, status: f.type === 'task' ? 'open' : 'done' });
    showToast(f.type === 'task' ? 'Task added' : 'Activity logged', 'ok');
    onClose();
  };
  return (
    <MSheet title="Log Activity / Task" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <span style={lbl}>Type</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['task', '⏰ Task'], ['call', '📞 Call'], ['meeting', '🤝 Meeting'], ['email', '✉ Email'], ['note', '📝 Note']].map(([id, l]) => (
              <button key={id} onClick={() => setF(p => ({ ...p, type: id }))} style={{ flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: f.type === id ? 'rgba(63,169,245,0.14)' : 'transparent', border: `1px solid ${f.type === id ? 'var(--brand)' : 'var(--border-subtle)'}`, color: f.type === id ? 'var(--brand)' : 'var(--text-low)' }}>{l}</button>
            ))}
          </div>
        </div>
        <div><span style={lbl}>What happened / what to do *</span><input value={f.note} onChange={set('note')} placeholder="e.g. Demo scheduled — bring camera samples" style={inp} /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><span style={lbl}>Customer</span><input value={f.customer} onChange={set('customer')} style={inp} /></div>
          {f.type === 'task' && <div style={{ flex: 1 }}><span style={lbl}>Due date</span><input type="date" value={f.due} onChange={set('due')} style={inp} /></div>}
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
        </div>
      </div>
    </MSheet>
  );
}

function SalesTasksView() {
  const [acts] = useShieldStore(salesActStore);
  const [adding, setAdding] = React.useState(false);
  const [filter, setFilter] = React.useState('Open');
  const tIso = todayISO();
  const rows = (acts || []).filter(a => filter === 'All' ? true : filter === 'Open' ? a.status === 'open' : a.status === 'done');
  const overdue = (acts || []).filter(a => a.status === 'open' && a.due && a.due < tIso).length;
  const toggle = (a) => salesActStore.set(list => (list || []).map(x => x.id === a.id ? { ...x, status: x.status === 'open' ? 'done' : 'open' } : x));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <MStat label="OPEN TASKS" value={String((acts || []).filter(a => a.status === 'open').length)} accent="var(--brand)" />
        <MStat label="OVERDUE" value={String(overdue)} accent={overdue ? 'var(--status-critical)' : 'var(--status-ok)'} delay={60} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}><MSegment options={['Open', 'Done', 'All']} value={filter} onChange={setFilter} /></div>
        <button onClick={() => setAdding(true)} style={{ padding: '0 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>+ New</button>
      </div>
      {rows.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No {filter.toLowerCase()} activities.</div>}
      {rows.map(a => {
        const late = a.status === 'open' && a.due && a.due < tIso;
        return (
          <div key={a.id} className="glass" style={{ padding: '11px 13px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${late ? 'var(--status-critical)' : a.status === 'done' ? 'var(--status-ok)' : 'var(--brand)'}` }}>
            <button onClick={() => toggle(a)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, border: a.status === 'done' ? 'none' : '1.5px solid var(--border-strong)', background: a.status === 'done' ? 'var(--status-ok)' : 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.status === 'done' ? '✓' : ''}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)', textDecoration: a.status === 'done' ? 'line-through' : 'none', opacity: a.status === 'done' ? 0.6 : 1 }}>{a.note}</div>
              <div style={{ fontSize: 10, color: late ? 'var(--status-critical)' : 'var(--text-low)' }}>
                {a.type}{a.customer ? ` · ${a.customer}` : ''}{a.due ? ` · due ${dateOfISO(a.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${late ? ' — OVERDUE' : ''}` : ''} · {a.by}
              </div>
            </div>
          </div>
        );
      })}
      {adding && <SalesNewActivitySheet onClose={() => setAdding(false)} />}
    </div>
  );
}

/* ══════════════ QUOTES ══════════════ */
function SalesQuotesView({ openItem }) {
  const items = useSalesPipeline();
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const quotes = items.filter(i => (i._doc || i._prop) && docSearchMatch(query, i.ref, i.title, i.customer, i.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕ Search quotes & proposals…"
          style={{ flex: 1, padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => setCreating(true)} style={{ padding: '0 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>+ Quote</button>
      </div>
      {quotes.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No quotes yet — tap + Quote to build and send one.</div>}
      {quotes.map(i => {
        const st = SALES_STAGE[i.stage];
        return (
          <div key={i.key} onClick={() => openItem(i)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${st.c}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{i.ref}</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: st.c }}>{st.label}</span>
              {i.project && <span style={{ fontSize: 9, color: 'var(--status-ok)' }}>→ {i.project.number}</span>}
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{salesFmt$(i.value)}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginTop: 2 }}>{i.customer}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{i.title}</div>
          </div>
        );
      })}
      {creating && <SalesNewQuoteSheet onClose={() => setCreating(false)} />}
    </div>
  );
}

function SalesNewQuoteSheet({ onClose }) {
  const [allCusts] = useShieldStore(customerStore);
  const [f, setF] = React.useState({ customer: '', email: '', title: '', lines: [{ desc: '', qty: 1, rate: 0 }], send: true });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const setLine = (i, k, v) => setF(p => ({ ...p, lines: p.lines.map((l, ix) => ix === i ? { ...l, [k]: v } : l) }));
  const total = f.lines.reduce((s, l) => s + (Number(l.qty) || 1) * (Number(l.rate) || 0), 0);
  const inp = { width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };
  const save = async () => {
    if (!f.customer.trim()) { showToast('Customer is required', 'warn'); return; }
    if (!total) { showToast('Add at least one line with a price', 'warn'); return; }
    const doc = addEstimate({
      customer_name: f.customer.trim(), total,
      lines: f.lines.filter(l => l.desc || l.rate).map(l => ({ desc: l.desc, qty: Number(l.qty) || 1, rate: Number(l.rate) || 0 })),
      customer_email: f.email || null, status: 'pending',
    });
    if (doc && f.title) estimateStore.set(list => (list || []).map(d => d.qbo_id === doc.qbo_id ? { ...d, title: f.title, owner: salesMe() } : d));
    let sentMsg = '';
    if (f.send && f.email && f.email.includes('@') && window.__shieldAcceptance) {
      const r = await window.__shieldAcceptance.send({ estimateRef: doc.doc_number, estimateQboId: null, customerName: f.customer.trim(), customerEmail: f.email.trim(), amount: total });
      sentMsg = r && r.ok && r.data.emailed ? ` and emailed to ${f.email.trim()} with a live accept link` : '';
    }
    addActivity({ type: 'email', note: `Quote ${doc.doc_number} created for ${f.customer.trim()} ($${total.toLocaleString()})${sentMsg}`, customer: f.customer.trim(), status: 'done' });
    showToast(`Quote ${doc.doc_number} created${sentMsg}`, 'ok');
    onClose();
  };
  return (
    <MSheet title="New Quote" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div><span style={lbl}>Customer *</span>
          <input list="sales-quote-cust" value={f.customer} onChange={set('customer')} placeholder="Type or pick…" style={inp} />
          <datalist id="sales-quote-cust">{(allCusts || []).map(c => <option key={c.id} value={c.name} />)}</datalist>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1.4 }}><span style={lbl}>Customer email</span><input value={f.email} onChange={set('email')} placeholder="For the accept link" style={inp} /></div>
          <div style={{ flex: 1 }}><span style={lbl}>Job title</span><input value={f.title} onChange={set('title')} placeholder="Optional" style={inp} /></div>
        </div>
        <div>
          <span style={lbl}>Line items</span>
          {f.lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={l.desc} onChange={e => setLine(i, 'desc', e.target.value)} placeholder="Description" style={{ ...inp, flex: 2.4, padding: '9px 11px', fontSize: 13 }} />
              <input type="number" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)} style={{ ...inp, width: 52, padding: '9px 8px', fontSize: 13, textAlign: 'center' }} />
              <input type="number" value={l.rate || ''} onChange={e => setLine(i, 'rate', e.target.value)} placeholder="$" style={{ ...inp, width: 84, padding: '9px 10px', fontSize: 13 }} />
              <button onClick={() => setF(p => ({ ...p, lines: p.lines.length > 1 ? p.lines.filter((_, ix) => ix !== i) : p.lines }))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 13, cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <button onClick={() => setF(p => ({ ...p, lines: [...p.lines, { desc: '', qty: 1, rate: 0 }] }))} style={{ padding: '6px 12px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Line</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-mid)', cursor: 'pointer' }}>
            <input type="checkbox" checked={f.send} onChange={e => setF(p => ({ ...p, send: e.target.checked }))} /> Email accept link now
          </label>
          <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand)' }}>${total.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Quote</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ══════════════ STATS / DASHBOARD ══════════════ */
function SalesStatsView() {
  const items = useSalesPipeline();
  const [acts] = useShieldStore(salesActStore);
  const open = items.filter(i => i.stage !== 'won' && i.stage !== 'lost');
  const won = items.filter(i => i.stage === 'won');
  const lost = items.filter(i => i.stage === 'lost');
  const decided = won.length + lost.length;
  const winRate = decided ? Math.round(won.length / decided * 100) : null;
  const forecast = open.reduce((s, i) => s + i.value * SALES_STAGE[i.stage].p, 0);
  const wonValue = won.reduce((s, i) => s + i.value, 0);
  const byOwner = {};
  (acts || []).forEach(a => { byOwner[a.by || '—'] = (byOwner[a.by || '—'] || 0) + 1; });
  const leaders = Object.entries(byOwner).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCol = Math.max(1, ...SALES_STAGES.map(([id]) => items.filter(i => i.stage === id).reduce((s, i) => s + i.value, 0)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="OPEN PIPELINE" value={salesFmt$(open.reduce((s, i) => s + i.value, 0))} sub={`${open.length} deals`} accent="var(--brand)" />
        <MStat label="FORECAST" value={salesFmt$(forecast)} sub="probability-weighted" accent="var(--status-ok)" delay={60} />
        <MStat label="WON" value={salesFmt$(wonValue)} sub={`${won.length} deal${won.length === 1 ? '' : 's'}`} accent="var(--status-ok)" delay={120} />
        <MStat label="WIN RATE" value={winRate == null ? '—' : winRate + '%'} sub={decided ? `${won.length} of ${decided} decided` : 'no decided deals yet'} delay={180} />
      </div>
      <MSection title="Pipeline by stage">
        {SALES_STAGES.map(([id, label, c]) => {
          const col = items.filter(i => i.stage === id);
          const v = col.reduce((s, i) => s + i.value, 0);
          return (
            <div key={id} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: c, fontWeight: 600 }}>{label}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{col.length} · {salesFmt$(v)}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(63,169,245,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(v / maxCol * 100)}%`, height: '100%', background: c, borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
            </div>
          );
        })}
      </MSection>
      <MSection title="Activity leaderboard">
        {leaders.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', padding: '6px 2px' }}>Log calls, meetings, and tasks — the leaderboard builds itself.</div>}
        {leaders.map(([who, n], i) => (
          <div key={who} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#FBBF24' : 'var(--text-low)', width: 18 }}>#{i + 1}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-high)', flex: 1 }}>{who}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{n} activit{n === 1 ? 'y' : 'ies'}</span>
          </div>
        ))}
      </MSection>
      <div style={{ fontSize: 9.5, color: 'var(--text-low)', textAlign: 'center' }}>Live from the same data as the portal — every proposal, quote, and Auto-Bid in the business.</div>
    </div>
  );
}

/* ══════════════ APP SHELL (responsive: bottom tabs ↔ side rail) ══════════════ */
const SALES_TABS = [
  { id: 'pipeline', icon: 'quote-cash', label: 'Pipeline' },
  { id: 'leads', icon: 'customers', label: 'Leads' },
  { id: 'quotes', icon: 'proposals', label: 'Quotes' },
  { id: 'tasks', icon: 'approvals', label: 'Tasks' },
  { id: 'stats', icon: 'reports', label: 'Stats' },
];

function SalesAvatarMenu() {
  const [open, setOpen] = React.useState(false);
  const [prefs, setPrefs] = useShieldStore(userPrefsStore);
  const u = window.__shieldUser;
  const theme = (prefs && prefs.theme) || 'dark';
  const item = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' };
  const seg = (active) => ({ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', background: active ? 'rgba(63,169,245,0.14)' : 'transparent', border: `1px solid ${active ? 'var(--brand)' : 'var(--border-subtle)'}`, color: active ? 'var(--brand)' : 'var(--text-low)' });
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{(u && u.initials) || '·'}</button>
      {open && ReactDOM.createPortal((
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483646 }} />
          <div style={{ position: 'fixed', top: 46, right: 8, zIndex: 2147483647, width: 'min(240px, 88vw)', background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderRadius: 12, boxShadow: '0 16px 44px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{(u && u.name) || 'Sales'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{(u && u.role) || 'Sales'} · {(u && u.email) || ''}</div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 14px 6px' }}>Appearance</div>
            <div style={{ display: 'flex', gap: 5, padding: '0 14px 8px' }}>
              {[['dark', 'Dark'], ['light', 'Light'], ['system', 'System']].map(([id, l]) => (
                <button key={id} onClick={() => setPrefs(p => ({ ...(p || {}), theme: id }))} style={seg(theme === id)}>{l}</button>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '5px 12px' }} />
            <button style={{ ...item, color: 'var(--status-critical)' }} onClick={() => { setOpen(false); if (window.__shieldAuth) window.__shieldAuth.signOut(); }}>← Sign out</button>
          </div>
        </React.Fragment>
      ), document.body)}
    </div>
  );
}

function SalesApp() {
  const [tab, setTab] = React.useState('pipeline');
  const [openedItem, setOpenedItem] = React.useState(null);
  const [dealFor, setDealFor] = React.useState(null);
  const [wide, setWide] = React.useState(() => window.innerWidth >= 960);
  React.useEffect(() => {
    const onR = () => setWide(window.innerWidth >= 960);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const views = {
    pipeline: <SalesPipelineView openItem={setOpenedItem} />,
    leads: <SalesLeadsView openDealFor={(name) => setDealFor(name)} />,
    quotes: <SalesQuotesView openItem={setOpenedItem} />,
    tasks: <SalesTasksView />,
    stats: <SalesStatsView />,
  };

  const header = (
    <header style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="uploads/ShieldTech Emblem Transparent MK1 .png" alt="ShieldTech" style={{ height: 22 }} />
        <span className="display" style={{ fontSize: 12, fontWeight: 300, letterSpacing: '0.08em', color: 'var(--text-high)' }}>SHIELDTECH</span>
        <span style={{ fontSize: 10, color: 'var(--brand)', marginLeft: 4, fontWeight: 700 }}>SALES</span>
      </div>
      <SalesAvatarMenu />
    </header>
  );

  return (
    <div className="m-app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
      {header}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {wide && (
          <nav style={{ width: 176, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(10,14,20,0.5)' }}>
            {SALES_TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', background: tab === t.id ? 'rgba(63,169,245,0.12)' : 'transparent', color: tab === t.id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, textAlign: 'left' }}>
                <Icon name={t.icon} size={17} color={tab === t.id ? 'var(--brand)' : 'var(--text-low)'} />
                {t.label}
              </button>
            ))}
            <div style={{ marginTop: 'auto', fontSize: 9, color: 'var(--text-low)', padding: '0 12px', lineHeight: 1.5 }}>Wired live into the ShieldTech portal — same customers, proposals, and bids.</div>
          </nav>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{views[tab]}</div>
      </div>
      {!wide && (
        <nav style={{ display: 'flex', borderTop: '1px solid var(--border-subtle)', background: 'rgba(10,14,20,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {SALES_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: tab === t.id ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', position: 'relative' }}>
              {tab === t.id && <div style={{ position: 'absolute', top: -1, left: '30%', right: '30%', height: 2, background: 'var(--brand)', borderRadius: '0 0 2px 2px', boxShadow: '0 0 8px var(--brand)' }} />}
              <Icon name={t.icon} size={18} color={tab === t.id ? 'var(--brand)' : 'var(--text-low)'} />
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
      {openedItem && <SalesDealSheet item={openedItem} onClose={() => setOpenedItem(null)} />}
      {dealFor != null && <SalesNewDealSheet presetCustomer={dealFor} onClose={() => setDealFor(null)} />}
      <ShieldToastHost />
    </div>
  );
}

Object.assign(window, {
  SalesApp, salesDealStore, salesActStore, salesStageStore, useSalesPipeline,
  SalesPipelineView, SalesLeadsView, SalesQuotesView, SalesTasksView, SalesStatsView,
});

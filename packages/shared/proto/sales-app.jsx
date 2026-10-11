/* ShieldTech Sales — CRM app (sales.shieldtechsolutions.com) on the
   UniFi-pattern console: a sidebar on desktop, a tab bar on the phone, and the
   same unified frames (tiles · tabs · table / board · properties drawer) the
   portal uses. It wires DIRECTLY into the portal's live stores — customers,
   proposals, quotes (+QuickBooks), Bid Board opportunities, Auto-Bid, projects
   — nothing is copied or synced.

   Toolset (Salesforce-core): pipeline board + list with weighted forecast,
   leads & customers, quotes & proposals with real accept links, activities &
   tasks, a dashboard with the "needs attention" queue, AI-drafted outreach.

   Access is administered from the portal: Users & Invites → role "Sales" /
   app checkbox "Sales" (profiles.app_rights.sales). */

/* ── Sales stores (synced like everything else) ── */
const salesDealStore = createShieldStore('sdeals', []);     // manual deals
const salesActStore = createShieldStore('sacts', []);       // activities & tasks
const salesStageStore = createShieldStore('sstages', {});   // stage overrides for derived pipeline items
const salesOppStore = createShieldStore('opps', []);        // Bid Board opportunities (same key as the portal)

const SALES_STAGES = [
  ['lead', 'Lead', 'var(--text-mid)', 0.10],
  ['qualified', 'Qualified', 'var(--brand)', 0.35],
  ['proposal', 'Proposal sent', 'var(--status-warn)', 0.60],
  ['won', 'Won', 'var(--status-ok)', 1],
  ['lost', 'Lost', 'var(--status-critical)', 0],
];
const SALES_STAGE = Object.fromEntries(SALES_STAGES.map(([id, label, c, p]) => [id, { id, label, c, p }]));
const SALES_KIND_COLOR = { Deal: 'var(--brand)', Proposal: 'var(--accent-2)', Quote: 'var(--accent-2)', 'QuickBooks quote': 'var(--accent-2)', 'Bid Board': 'var(--disc-access)', 'Auto-Bid': 'var(--disc-av)' };
const salesFont = { fontFamily: 'var(--font-body)' };
const salesFmt$ = (n) => ucMoneyK(n);
const salesMe = () => (window.__shieldUser && (window.__shieldUser.name || window.__shieldUser.email)) || 'Me';
const salesTint = (c, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const salesPortalUrl = (hash) => `${(window.__shieldAppUrls && window.__shieldAppUrls.portal) || ''}/?desktop=1#/${hash}`;

/* ── Unified pipeline: EVERY bid in the business, one list ──
   Sources: manual deals, Bid Board opportunities, block-built proposals,
   portal+QuickBooks quotes, Auto-Bid opportunities. Derived items get their
   default stage from the underlying status; moving one to another stage
   stores an override. */
function useSalesPipeline() {
  const [deals] = useShieldStore(salesDealStore);
  const [props] = useShieldStore(proposalStore);
  const [projects] = useShieldStore(projectStore);
  const [overrides] = useShieldStore(salesStageStore);
  const [localOpps] = useShieldStore(salesOppStore);
  const [acts] = useShieldStore(salesActStore);
  const merged = useMergedEstimates();
  const [opps, setOpps] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    if (window.__shieldBids) window.__shieldBids.list().then(r => { if (alive && r && r.ok) setOpps(r.data || []); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const items = React.useMemo(() => {
    const ov = overrides || {};
    const out = [];
    const projFor = (ref) => (projects || []).find(p => (p.estimateRefs || []).includes(ref)) || null;

    (deals || []).forEach(d => out.push({
      key: 'deal-' + d.id, kind: 'Deal', ref: 'DEAL-' + String(d.id).slice(-5), title: d.title, customer: d.customer || '—',
      value: Number(d.value) || 0, owner: d.owner || '—', createdAt: d.createdAt || 0, notes: d.notes,
      stage: d.stage || 'lead', _deal: d,
    }));

    const docNums = new Set(merged.map(m => m.num));
    const propIds = new Set();
    (props || []).forEach(p => {
      if (docNums.has(p.id)) return;   // sent proposals become doc rows — avoid double counting
      propIds.add(p.id);
      const stage = p.status === 'accepted' ? 'won' : p.status === 'declined' ? 'lost' : p.status === 'sent' ? 'proposal' : 'qualified';
      out.push({
        key: 'prop-' + p.id, kind: 'Proposal', ref: p.id, title: p.title || p.id, customer: p.customer || '—',
        value: (typeof proposalValue === 'function' ? proposalValue(p.blocks) : 0) || 0,
        owner: p.owner || '—', createdAt: p.sentAt || p.createdAt || 0, stage, _prop: p,
      });
    });

    const bidRefs = new Set(merged.map(m => (m._raw || {}).bid_ref).filter(Boolean));
    merged.forEach(m => {
      const proj = projFor(m.num);
      const stage = (m.status === 'accepted' || proj) ? 'won' : m.status === 'expired' || m.status === 'declined' ? 'lost' : m.status === 'draft' ? 'qualified' : 'proposal';
      out.push({
        key: 'q-' + m.num, kind: m.source === 'quickbooks' ? 'QuickBooks quote' : 'Quote', ref: m.num,
        title: (m._raw && m._raw.title) || `${m.num} — ${m.customer}`, customer: m.customer,
        value: m.amount || 0, owner: (m._raw && m._raw.owner) || '—', createdAt: (m._raw && (m._raw.createdAt || Date.parse(m._raw.txn_date || ''))) || 0,
        stage, project: proj, _doc: m,
      });
    });

    const localIds = new Set();
    (localOpps || []).forEach(o => {
      localIds.add(o.id);
      if (o.proposalId && propIds.has(o.proposalId)) return;   // its proposal row carries the bid now
      out.push({
        key: 'opp-' + o.id, kind: 'Bid Board', ref: o.id, title: o.title || 'Opportunity', customer: o.buyer || '—',
        value: Number(o.value) || 0, owner: o.owner || '—', createdAt: o.createdAt || 0, due: o.dueAt, notes: o.notes,
        stage: o.proposalId ? 'proposal' : 'qualified', _opp: o,
      });
    });

    (opps || []).forEach(o => {
      if (localIds.has(o.id)) return;
      if (o.bid && bidRefs.has(o.bid.id)) return;   // approved into the money pipeline — quote row covers it
      const tiers = (o.bid && o.bid.tiers) || {};
      const tier = tiers[(o.bid && o.bid.selected_tier) || 'medium'] || {};
      out.push({
        key: 'ab-' + o.id, kind: 'Auto-Bid', ref: o.solicitation_id || o.id, title: o.title || 'Opportunity',
        customer: o.buyer || '—', value: Number(tier.price) || 0, owner: '—',
        createdAt: o.created_at ? new Date(o.created_at).getTime() : 0,
        stage: o.bid ? (o.bid.sent_at ? 'proposal' : 'qualified') : 'lead',
        due: o.due_at, _autobid: o,
      });
    });

    const touch = {};
    (acts || []).forEach(a => { if (a.dealKey) touch[a.dealKey] = Math.max(touch[a.dealKey] || 0, a.createdAt || 0); });

    return out.map(it => {
      const last = Math.max(it.createdAt || 0, touch[it.key] || 0) || 0;
      const base = { ...it, id: it.key, lastTouch: last, staleDays: last ? ucAgoDays(last) : null };
      if (it._deal) return base;
      /* A sent proposal's row key changes 'prop-<id>' → 'q-<num>' (same ref),
         so honor the override under either key — manual stages must survive
         the transition. A derived terminal stage (won/lost from the real
         accepted/declined status) always beats a stale manual override. */
      const o = ov[it.key] ?? (it.key.startsWith('q-') ? ov['prop-' + it.ref] : undefined);
      const terminal = it.stage === 'won' || it.stage === 'lost';
      return o && !terminal ? { ...base, stage: o } : base;
    });
  }, [deals, props, merged, opps, localOpps, projects, overrides, acts]);

  return items;
}

function setPipelineStage(item, stage) {
  if (item._deal) salesDealStore.set(list => (list || []).map(d => d.id === item._deal.id ? { ...d, stage } : d));
  else salesStageStore.set(m => ({ ...(m || {}), [item.key]: stage }));
  if (stage === 'won') showToast(`${item.title} marked won`, 'ok');
}
function salesDeleteDeal(item) {
  if (!item._deal) return;
  salesDealStore.set(list => (list || []).filter(d => d.id !== item._deal.id));
  salesActStore.set(list => (list || []).filter(a => a.dealKey !== item.key));
}

/* ── Activities ── */
function addActivity(rec) {
  salesActStore.set(list => [{
    id: 'a' + Date.now().toString(36), createdAt: Date.now(), status: 'open', by: salesMe(),
    ...rec,
  }, ...(list || [])]);
}
function salesLogForm(preset) {
  shieldModal({
    kind: 'form', title: 'Log activity or task', subtitle: preset && preset.title ? preset.title : 'Calls, meetings, emails, notes and follow-ups',
    submitLabel: 'Save', successMsg: 'Saved',
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: ['Task', 'Call', 'Meeting', 'Email', 'Note'] },
      { key: 'due', label: 'Due (tasks)', type: 'date', value: addDaysISO(todayISO(), 2) },
      { key: 'note', label: 'What happened / what to do', full: true, required: true, placeholder: 'e.g. Demo scheduled — bring camera samples' },
      { key: 'customer', label: 'Customer', value: (preset && preset.customer) || '' },
    ],
    onSubmit: (v) => {
      const type = String(v.type || 'Task').toLowerCase();
      addActivity({ type, note: String(v.note || '').trim(), due: type === 'task' ? (v.due || null) : null, customer: v.customer || '', dealKey: preset && preset.dealKey, status: type === 'task' ? 'open' : 'done' });
    },
  });
}

/* ── AI follow-up drafts (ShieldTech AI) ── */
async function salesDraftEmail(item, intent) {
  const ai = window.__shieldAI;
  if (!ai || !ai.askShieldAI) return { ok: false, error: 'AI not configured' };
  try {
    const r = await ai.askShieldAI('sales-assist', [{
      role: 'user',
      content: `Write a short, professional ${intent} email for a security-integration deal.\nDeal: ${item.title}\nCustomer: ${item.customer}\nValue: $${(item.value || 0).toLocaleString()}\nStage: ${SALES_STAGE[item.stage].label}\nCompany: ShieldTech Solutions (security systems — cameras, access control, intrusion, fire, monitoring).\nReturn ONLY the email body, no subject line, no placeholders like [Name] left unexplained.`,
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

/* ── Forms (shieldModal) ── */
function salesDealForm(preset) {
  const names = shieldCustomerNames();
  shieldModal({
    kind: 'form', title: 'New deal', subtitle: 'Lands on the pipeline board; moves through the stages as you work it', submitLabel: 'Add deal', successMsg: 'Deal added to the pipeline',
    fields: [
      { key: 'title', label: 'Deal name', required: true, full: true, placeholder: 'e.g. Harbor View — 16-camera upgrade' },
      { key: 'customerSel', label: 'Customer / prospect', type: 'select', options: [...(preset && preset.customer && !names.includes(preset.customer) ? [preset.customer] : []), ...names, 'Other / new'], value: (preset && preset.customer) || undefined },
      { key: 'customerOther', label: 'New prospect name', placeholder: 'If not in the list' },
      { key: 'value', label: 'Est. value ($)', type: 'number', placeholder: '0' },
      { key: 'stage', label: 'Stage', type: 'select', options: ['Lead', 'Qualified', 'Proposal sent'] },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    onSubmit: (v) => {
      const customer = v.customerSel === 'Other / new' ? String(v.customerOther || '').trim() : v.customerSel;
      const stage = SALES_STAGES.find(s => s[1] === v.stage);
      salesDealStore.set(list => [{
        id: Date.now(), title: String(v.title || '').trim(), customer: customer || '—', value: Number(v.value) || 0,
        stage: stage ? stage[0] : 'lead', notes: v.notes || '', owner: salesMe(), createdAt: Date.now(),
      }, ...(list || [])]);
    },
  });
}
function salesLeadForm() {
  shieldModal({
    kind: 'form', title: 'New lead', subtitle: 'Visible in the portal’s Customers the moment it is saved', submitLabel: 'Add lead', successMsg: 'Lead added',
    fields: [
      { key: 'name', label: 'Company / name', required: true, full: true, placeholder: 'e.g. Lakeside Storage' },
      { key: 'industry', label: 'Industry', placeholder: 'Retail, Medical, Education…' },
      { key: 'phone', label: 'Phone', placeholder: '(555) 555-0123' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'contact@company.com' },
      { key: 'contact', label: 'Contact name' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    onSubmit: (v) => {
      const rec = { ...buildCustomer({ name: String(v.name || '').trim(), industry: v.industry || '', phone: v.phone || '', notes: v.notes || '', owner: salesMe(), source: 'sales-app' }), email: v.email || '', contact: v.contact || '', leadStatus: 'lead', createdAt: Date.now() };
      customerStore.set(list => [rec, ...(list || [])]);
    },
  });
}

/* Quote form — line items, total, optional accept-link email (centered dialog). */
function SalesQuoteForm({ onClose, presetCustomer }) {
  const [allCusts] = useShieldStore(customerStore);
  const [f, setF] = React.useState({ customer: presetCustomer || '', email: '', title: '', lines: [{ desc: '', qty: 1, rate: '' }], send: true });
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const setLine = (i, k, v) => setF(p => ({ ...p, lines: p.lines.map((l, ix) => ix === i ? { ...l, [k]: v } : l) }));
  const total = f.lines.reduce((s, l) => s + (Number(l.qty) || 1) * (Number(l.rate) || 0), 0);
  const inp = { ...salesFont, width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none' };
  const lab = { fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' };
  const save = async () => {
    if (!f.customer.trim()) { showToast('Customer is required', 'warn'); return; }
    if (!total) { showToast('Add at least one line with a price', 'warn'); return; }
    setBusy(true);
    const doc = addEstimate({
      customer_name: f.customer.trim(), total,
      lines: f.lines.filter(l => l.desc || l.rate).map(l => ({ desc: l.desc, qty: Number(l.qty) || 1, rate: Number(l.rate) || 0 })),
      customer_email: f.email || null, status: 'pending',
    });
    if (doc) estimateStore.set(list => (list || []).map(d => d.qbo_id === doc.qbo_id ? { ...d, title: f.title || d.title, owner: salesMe(), createdAt: Date.now() } : d));
    let sentMsg = '', sendErr = null;
    if (f.send && f.email && f.email.includes('@') && window.__shieldAcceptance) {
      const r = await window.__shieldAcceptance.send({ estimateRef: doc.doc_number, estimateQboId: null, customerName: f.customer.trim(), customerEmail: f.email.trim(), amount: total });
      if (r && r.ok && r.data.emailed) sentMsg = ` and emailed to ${f.email.trim()} with a live accept link`;
      else sendErr = (r && (r.error || (r.data && r.data.emailError))) || 'unknown error';
    }
    addActivity({ type: 'email', note: `Quote ${doc.doc_number} created for ${f.customer.trim()} (${ucMoney(total)})${sentMsg}`, customer: f.customer.trim(), dealKey: 'q-' + doc.doc_number, status: 'done' });
    if (sendErr) showToast(`Quote ${doc.doc_number} created, but the accept link email failed: ${sendErr}`, 'warn');
    else showToast(`Quote ${doc.doc_number} created${sentMsg}`, 'ok');
    setBusy(false);
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" style={{ width: 620, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: '0 24px 70px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>New quote</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>Becomes a portal quote; the customer accepts it from the link.</div></div>
          <button onClick={onClose} style={{ ...salesFont, background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lab}>Customer *</label><input list="sales-quote-cust" value={f.customer} onChange={set('customer')} placeholder="Type or pick…" style={inp} /><datalist id="sales-quote-cust">{(allCusts || []).map(c => <option key={c.id} value={c.name} />)}</datalist></div>
          <div><label style={lab}>Customer email</label><input value={f.email} onChange={set('email')} placeholder="For the accept link" style={inp} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={lab}>Job title</label><input value={f.title} onChange={set('title')} placeholder="e.g. Lobby access control + 6 cameras" style={inp} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lab}>Line items</label>
            {f.lines.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={l.desc} onChange={e => setLine(i, 'desc', e.target.value)} placeholder="Description" style={{ ...inp, flex: 2.4 }} />
                <input type="number" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)} style={{ ...inp, width: 64, textAlign: 'center' }} />
                <input type="number" value={l.rate} onChange={e => setLine(i, 'rate', e.target.value)} placeholder="$ each" style={{ ...inp, width: 110 }} />
                <button onClick={() => setF(p => ({ ...p, lines: p.lines.length > 1 ? p.lines.filter((_, ix) => ix !== i) : p.lines }))} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 13, cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <UcBtn kind="ghost" small onClick={() => setF(p => ({ ...p, lines: [...p.lines, { desc: '', qty: 1, rate: '' }] }))}>+ Line</UcBtn>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-mid)', cursor: 'pointer' }}><input type="checkbox" checked={f.send} onChange={e => setF(p => ({ ...p, send: e.target.checked }))} /> Email the accept link now</label>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{ucMoney(total)}</span>
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <UcBtn kind="ghost" onClick={onClose}>Cancel</UcBtn>
          <UcBtn onClick={save} disabled={busy}>{busy ? 'Creating…' : 'Create quote'}</UcBtn>
        </div>
      </div>
    </div>
  );
}

/* ── Shared bits ── */
function SalesStageCell({ stage }) { const s = SALES_STAGE[stage]; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><UcDot color={s.c} />{s.label}</span>; }
function SalesKindChip({ kind }) { const c = SALES_KIND_COLOR[kind] || 'var(--text-mid)'; return <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: c, background: salesTint(c), border: `1px solid ${salesTint(c, 35)}`, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{kind}</span>; }
const salesStale = (it) => it.stage !== 'won' && it.stage !== 'lost' && it.staleDays != null && it.staleDays >= 14;
const salesOverdue = (a) => a.status === 'open' && a.due && a.due < todayISO();

/* ── Deal / quote drawer: stage, actions, AI, activity log ── */
function SalesDealDrawer({ item, onClose, isMobile }) {
  const [acts] = useShieldStore(salesActStore);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const linked = (acts || []).filter(a => a.dealKey === item.key || (item.ref && a.dealKey === 'prop-' + item.ref));
  const st = SALES_STAGE[item.stage];

  const emailAcceptLink = () => shieldModal({
    kind: 'form', title: `Send accept link — ${item.ref}`, subtitle: `${item.customer} · ${ucMoney(item.value)}`, submitLabel: 'Send',
    fields: [{ key: 'email', label: 'Customer email', type: 'email', required: true, full: true, value: (item._doc && item._doc._raw && item._doc._raw.customer_email) || '' }],
    onSubmit: async (v) => {
      const api = window.__shieldAcceptance;
      if (!api) { showToast('Acceptance backend not configured', 'warn'); return; }
      const doc = item._doc;
      const r = await api.send({ estimateRef: doc.num, estimateQboId: doc.qboId, customerName: doc.customer, customerEmail: String(v.email).trim(), amount: doc.amount });
      if (r && r.ok) {
        showToast(r.data.emailed ? `Accept link for ${item.ref} emailed to ${v.email}` : `Link created (email not sent: ${r.data.emailError})`, 'ok');
        setPipelineStage(item, 'proposal');
        addActivity({ type: 'email', note: `Sent accept link for ${item.ref} to ${String(v.email).trim()}`, dealKey: item.key, customer: item.customer, status: 'done' });
      } else showToast(`Could not send: ${(r && r.error) || 'unknown'}`, 'error');
    },
  });
  const winToProject = () => {
    if (item._doc && item._doc._raw && typeof acceptEstimateToProject === 'function') {
      const proj = acceptEstimateToProject(item._doc._raw, 'manual');
      showToast(`${item.ref} won — project ${proj.number} created with the quote attached`, 'ok');
    }
    setPipelineStage(item, 'won');
    addActivity({ type: 'note', note: `${item.title} marked won`, dealKey: item.key, customer: item.customer, status: 'done' });
  };
  const markLost = () => shieldModal({
    kind: 'form', title: `Mark ${item.title} lost`, submitLabel: 'Mark lost', danger: true,
    fields: [{ key: 'reason', label: 'Reason', type: 'select', options: ['Price', 'Went with a competitor', 'No budget / postponed', 'No response', 'Scope changed', 'Other'] }, { key: 'note', label: 'Note', type: 'textarea', full: true }],
    onSubmit: (v) => { setPipelineStage(item, 'lost'); addActivity({ type: 'note', note: `Lost — ${v.reason}${v.note ? ': ' + v.note : ''}`, dealKey: item.key, customer: item.customer, status: 'done' }); },
  });
  const aiDraft = async (intent) => {
    setAiBusy(true);
    const r = await salesDraftEmail(item, intent);
    setAiBusy(false);
    if (r.ok) setDraft({ intent, text: r.text });
    else showToast(`AI unavailable: ${r.error}`, 'warn');
  };
  const sendDraft = () => shieldModal({
    kind: 'form', title: 'Send this email', submitLabel: 'Send',
    fields: [{ key: 'to', label: 'To', type: 'email', required: true, full: true }, { key: 'subject', label: 'Subject', full: true, value: `${item.title} — ShieldTech Solutions` }],
    onSubmit: async (v) => {
      const r = await salesSendEmail(String(v.to).trim(), v.subject, draft.text);
      if (r.ok) { showToast(`Email sent to ${v.to}`, 'ok'); addActivity({ type: 'email', note: `Emailed ${String(v.to).trim()}: ${draft.intent}`, dealKey: item.key, customer: item.customer, status: 'done' }); setDraft(null); }
      else showToast(`Send failed: ${r.error}`, 'error');
    },
  });
  const del = () => shieldModal({ kind: 'confirm', title: `Delete ${item.title}?`, message: 'Removes the deal and its logged activity. Proposals, quotes and bids are managed in the portal.', confirmLabel: 'Delete', danger: true, onSubmit: () => { salesDeleteDeal(item); onClose(); } });
  const portalLink = item._opp ? salesPortalUrl('crm') : item._prop ? salesPortalUrl('proposals') : item._doc ? salesPortalUrl('estimates') : item._autobid ? salesPortalUrl('crm/autobid') : null;
  const terminal = item.stage === 'won' || item.stage === 'lost';

  return (
    <UcDrawer title={item.title} sub={`${item.ref} · ${item.customer}`} onClose={onClose} width={isMobile ? '100%' : 420}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <SalesKindChip kind={item.kind} />
        {item.project && <span style={{ fontSize: 11, color: 'var(--status-ok)', fontWeight: 600 }}>→ {item.project.number}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{item.value ? ucMoney(item.value) : '—'}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <UcTile label="Stage" value={st.label} sub={`${Math.round(st.p * 100)}% win probability`} tone={item.stage === 'won' ? 'ok' : item.stage === 'lost' ? 'crit' : undefined} />
        <UcTile label="Last touch" value={item.lastTouch ? ucDate(item.lastTouch) : '—'} sub={salesStale(item) ? `${item.staleDays} days quiet` : item.staleDays != null ? `${item.staleDays}d ago` : 'no activity yet'} tone={salesStale(item) ? 'warn' : undefined} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>Move to</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {SALES_STAGES.map(([id, label, c]) => (
          <button key={id} onClick={() => { if (id === item.stage) return; if (id === 'won') winToProject(); else if (id === 'lost') markLost(); else setPipelineStage(item, id); }}
            style={{ ...salesFont, padding: '6px 11px', borderRadius: 14, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: item.stage === id ? salesTint(c, 18) : 'var(--card)', border: `1px solid ${item.stage === id ? c : 'var(--border-subtle)'}`, color: item.stage === id ? c : 'var(--text-mid)' }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {item._doc && !terminal && <UcBtn small onClick={emailAcceptLink}>Email accept link</UcBtn>}
        {!terminal && <UcBtn small kind="soft" onClick={winToProject}>Won{item._doc ? ' → project' : ''}</UcBtn>}
        <UcBtn small kind="ghost" onClick={() => salesLogForm({ dealKey: item.key, customer: item.customer, title: item.title })}>Log activity</UcBtn>
        <UcBtn small kind="ghost" disabled={aiBusy} onClick={() => aiDraft('follow-up')}>{aiBusy ? 'Drafting…' : 'AI follow-up email'}</UcBtn>
        {portalLink && <UcBtn small kind="ghost" onClick={() => window.open(portalLink, '_blank')}>Open in portal</UcBtn>}
        {item._deal && <UcBtn small kind="danger" onClick={del}>Delete</UcBtn>}
      </div>
      {draft && (
        <UcCard title={`AI draft — ${draft.intent}`} style={{ marginBottom: 14 }} pad={12} action={<UcBtn small kind="ghost" onClick={() => setDraft(null)}>Discard</UcBtn>}>
          <textarea value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} rows={7} style={{ ...salesFont, width: '100%', boxSizing: 'border-box', padding: '9px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, lineHeight: 1.5, outline: 'none', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <UcBtn small kind="ghost" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(draft.text); showToast('Copied', 'ok'); }}>Copy</UcBtn>
            <UcBtn small onClick={sendDraft}>Send email</UcBtn>
          </div>
        </UcCard>
      )}
      <UcProp k="Reference" v={item.ref} />
      <UcProp k="Customer" v={item.customer} />
      <UcProp k="Owner" v={item.owner} />
      <UcProp k="Created" v={item.createdAt ? ucDate(item.createdAt) : '—'} />
      {item.due && <UcProp k="Due" v={ucDate(item.due)} />}
      {item.project && <UcProp k="Project" v={item.project.number} />}
      {item.notes && <UcProp k="Notes" v={item.notes} />}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', margin: '16px 0 6px' }}>Activity · {linked.length}</div>
      {linked.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)' }}>No activity yet — log a call, meeting, email or task.</div>}
      {linked.slice(0, 12).map(a => (
        <div key={a.id} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)', width: 52, flexShrink: 0 }}>{a.type}</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-high)', flex: 1 }}>{a.note}{a.status === 'open' && a.due ? <span style={{ color: salesOverdue(a) ? 'var(--status-critical)' : 'var(--text-mid)' }}> · due {ucDate(a.due)}</span> : null}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>{ucDate(a.createdAt)}</span>
        </div>
      ))}
    </UcDrawer>
  );
}

/* ══════════════ PIPELINE ══════════════ */
const SA_PIPE_SUBS = [{ id: 'board', label: 'Board' }, { id: 'list', label: 'List' }];
function SalesPipelineScreen({ isMobile }) {
  const items = useSalesPipeline();
  const [acts] = useShieldStore(salesActStore);
  const [tab, setTab] = useUcSub('pipeline', SA_PIPE_SUBS, 'board');
  const [q, setQ] = React.useState('');
  const [kind, setKind] = React.useState('all');
  const [selId, setSelId] = React.useState(null);
  const kinds = [...new Set(items.map(i => i.kind))];
  const shown = items.filter(i => (kind === 'all' || i.kind === kind) && docSearchMatch(q, i.ref, i.title, i.customer, i.value, i.kind, SALES_STAGE[i.stage].label));
  const open = items.filter(i => i.stage !== 'won' && i.stage !== 'lost');
  const won = items.filter(i => i.stage === 'won'), lost = items.filter(i => i.stage === 'lost');
  const pipeValue = open.reduce((s, i) => s + i.value, 0);
  const forecast = open.reduce((s, i) => s + i.value * SALES_STAGE[i.stage].p, 0);
  const winRate = won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) + '%' : '—';
  const stale = open.filter(salesStale).length;
  const overdue = (acts || []).filter(salesOverdue).length;
  const sel = items.find(i => i.key === selId) || null;

  const cols = [
    { k: 'ref', l: 'Ref', w: 110, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.ref}</span> },
    { k: 'title', l: 'Deal', render: r => <span><span style={{ fontWeight: 600 }}>{r.title}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.customer}</span></span> },
    { k: 'kind', l: 'Source', render: r => <SalesKindChip kind={r.kind} /> },
    { k: 'stage', l: 'Stage', render: r => <SalesStageCell stage={r.stage} /> },
    { k: 'value', l: 'Value', right: true, render: r => r.value ? ucMoney(r.value) : '—' },
    { k: 'owner', l: 'Owner', dim: true },
    { k: 'lastTouch', l: 'Last touch', dim: true, render: r => <span style={{ color: salesStale(r) ? 'var(--status-warn)' : undefined }}>{r.lastTouch ? ucDate(r.lastTouch) : '—'}{salesStale(r) ? ' · quiet' : ''}</span> },
  ];
  const card = (i) => {
    const s = SALES_STAGE[i.stage];
    return (
      <div key={i.key} onClick={() => setSelId(i.key)} style={{ padding: '10px 12px', background: 'var(--card)', border: `1px solid ${selId === i.key ? 'var(--brand)' : 'var(--border-subtle)'}`, borderLeft: `3px solid ${s.c}`, borderRadius: 8, cursor: 'pointer', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <SalesKindChip kind={i.kind} />
          {salesStale(i) && <span title="No activity in 14+ days"><UcDot color="var(--status-warn)" size={7} /></span>}
          <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{i.value ? salesFmt$(i.value) : '—'}</span>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{i.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>{i.customer}{i.due ? ` · due ${ucDate(i.due)}` : ''}{i.project ? ` · ${i.project.number}` : ''}</div>
      </div>
    );
  };
  const board = (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', height: '100%', paddingBottom: 4 }}>
      {SALES_STAGES.map(([id, label, c]) => {
        const col = shown.filter(i => i.stage === id);
        const colVal = col.reduce((s, i) => s + i.value, 0);
        return (
          <div key={id} style={{ width: isMobile ? 240 : 262, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '8px 11px', borderRadius: 8, background: salesTint(c, 8), border: `1px solid ${salesTint(c, 25)}`, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <UcDot color={c} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-high)' }}>{label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-mid)', fontVariantNumeric: 'tabular-nums' }}>{col.length} · {salesFmt$(colVal)}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {col.map(card)}
              {col.length === 0 && <div style={{ padding: '14px 10px', fontSize: 11, color: 'var(--text-low)', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 8 }}>Nothing here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <UcFrame label="Pipeline" title="Pipeline" sub={`${open.length} open · ${salesFmt$(pipeValue)} in play · ${salesFmt$(forecast)} weighted`} isMobile={isMobile}
      right={<><UcSearch value={q} onChange={setQ} placeholder="Search every bid" /><UcBtn kind="ghost" onClick={() => salesLogForm()}>Log activity</UcBtn><UcBtn onClick={() => salesDealForm()}>+ New deal</UcBtn></>}
      tiles={<>
        <UcTile label="Open pipeline" value={salesFmt$(pipeValue)} sub={`${open.length} deal${open.length === 1 ? '' : 's'} in play`} />
        <UcTile label="Forecast" value={salesFmt$(forecast)} sub="probability-weighted" tone="ok" />
        <UcTile label="Won" value={salesFmt$(won.reduce((s, i) => s + i.value, 0))} sub={`${won.length} deal${won.length === 1 ? '' : 's'}`} tone={won.length ? 'ok' : undefined} />
        <UcTile label="Win rate" value={winRate} sub={`${won.length} of ${won.length + lost.length} decided`} />
        <UcTile label="Needs attention" value={stale + overdue} sub={`${stale} quiet deal${stale === 1 ? '' : 's'} · ${overdue} overdue task${overdue === 1 ? '' : 's'}`} tone={stale + overdue ? 'warn' : undefined} />
      </>}
      tabs={SA_PIPE_SUBS} tab={tab} onTab={setTab}
      chips={kinds.length > 1 ? <UcChips options={[{ id: 'all', l: 'All sources' }, ...kinds.map(k => ({ id: k, l: k, n: items.filter(i => i.kind === k).length }))]} value={kind} onChange={setKind} /> : null}
      bodyStyle={tab === 'board' ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : undefined}
      drawer={sel ? <SalesDealDrawer item={sel} onClose={() => setSelId(null)} isMobile={isMobile} /> : null}>
      {items.length === 0
        ? <UcEmpty title="The pipeline is empty" body="Add a deal here, start a bid on the portal’s Bid Board, or send a proposal or quote — every one of them lands on this board automatically." cta="+ New deal" onCta={() => salesDealForm()} />
        : tab === 'board' ? board
        : <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={shown} selectedId={selId} onRow={r => setSelId(r.key)} empty={<UcEmpty title="No deals match" body="Clear the search or source filter." />} /></div></UcCard>}
    </UcFrame>
  );
}

/* ══════════════ LEADS & CUSTOMERS ══════════════ */
const SA_LEAD_SUBS = [{ id: 'leads', label: 'Leads' }, { id: 'customers', label: 'Customers' }, { id: 'all', label: 'All' }];
function SalesLeadsScreen({ isMobile }) {
  const [custs] = useShieldStore(customerStore);
  const [acts] = useShieldStore(salesActStore);
  const [tab, setTab] = useUcSub('leads', SA_LEAD_SUBS, 'leads');
  const [q, setQ] = React.useState('');
  const [selId, setSelId] = React.useState(null);
  const [quoteFor, setQuoteFor] = React.useState(null);
  const all = (custs || []).map(c => ({ ...c, id: c.id, isLead: c.leadStatus === 'lead' }));
  const leads = all.filter(c => c.isLead), customers = all.filter(c => !c.isLead);
  const rows = (tab === 'leads' ? leads : tab === 'customers' ? customers : all).filter(c => docSearchMatch(q, c.name, c.industry, c.phone, c.email, c.owner, c.contact));
  const addedRecently = all.filter(c => c.createdAt && ucAgoDays(c.createdAt) <= 30).length;
  const followUps = (acts || []).filter(a => a.status === 'open' && a.type === 'task').length;
  const sel = all.find(c => String(c.id) === String(selId)) || null;
  const update = (id, patch) => customerStore.set(list => (list || []).map(c => String(c.id) === String(id) ? { ...c, ...patch } : c));
  const cols = [
    { k: 'name', l: 'Company', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--brand-tint-12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{r.logo || (r.name || '?').slice(0, 2).toUpperCase()}</span><span><span style={{ fontWeight: 600 }}>{r.name}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.industry || '—'}</span></span></span> },
    { k: 'contact', l: 'Contact', dim: true, render: r => [r.contact, r.phone, r.email].filter(Boolean).join(' · ') || '—' },
    { k: 'status', l: 'Status', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><UcDot color={r.isLead ? 'var(--status-warn)' : 'var(--status-ok)'} />{r.isLead ? 'Lead' : 'Customer'}</span> },
    { k: 'owner', l: 'Owner', dim: true },
    { k: 'createdAt', l: 'Added', dim: true, render: r => r.createdAt ? ucDate(r.createdAt) : '—' },
  ];
  const drawer = sel && (
    <UcDrawer title={sel.name} sub={sel.isLead ? 'Lead' : 'Customer'} onClose={() => setSelId(null)} width={isMobile ? '100%' : 400}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <UcBtn small onClick={() => salesDealForm({ customer: sel.name })}>+ Deal</UcBtn>
        <UcBtn small kind="soft" onClick={() => setQuoteFor(sel.name)}>+ Quote</UcBtn>
        {sel.phone && <UcBtn small kind="ghost" onClick={() => { addActivity({ type: 'call', note: `Called ${sel.name}`, customer: sel.name, status: 'done' }); window.location.href = `tel:${sel.phone}`; }}>Call</UcBtn>}
        {sel.email && <UcBtn small kind="ghost" onClick={() => { addActivity({ type: 'email', note: `Emailed ${sel.name}`, customer: sel.name, status: 'done' }); window.location.href = `mailto:${sel.email}`; }}>Email</UcBtn>}
        <UcBtn small kind="ghost" onClick={() => { addActivity({ type: 'task', note: `Follow up with ${sel.name}`, customer: sel.name, due: addDaysISO(todayISO(), 2) }); showToast('Follow-up task added for 2 days out', 'ok'); }}>Follow up in 2 days</UcBtn>
        {sel.isLead && <UcBtn small kind="ghost" onClick={() => { update(sel.id, { leadStatus: 'customer', status: sel.status || 'active' }); showToast(`${sel.name} is now a customer`, 'ok'); }}>Convert to customer</UcBtn>}
        {sel.source === 'sales-app' && <UcBtn small kind="danger" onClick={() => shieldModal({ kind: 'confirm', title: `Delete ${sel.name}?`, message: 'Removes this record from the portal too.', confirmLabel: 'Delete', danger: true, onSubmit: () => { customerStore.set(list => (list || []).filter(c => String(c.id) !== String(sel.id))); setSelId(null); } })}>Delete</UcBtn>}
      </div>
      <UcProp k="Contact" v={sel.contact} />
      <UcProp k="Phone" v={sel.phone} />
      <UcProp k="Email" v={sel.email} />
      <UcProp k="Industry" v={sel.industry} />
      <UcProp k="Address" v={sel.address} />
      <UcProp k="Owner" v={sel.owner} />
      <UcProp k="Source" v={sel.source} />
      <UcProp k="Added" v={sel.createdAt ? ucDate(sel.createdAt) : '—'} />
      {sel.notes && <UcProp k="Notes" v={sel.notes} />}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', margin: '16px 0 6px' }}>Recent activity</div>
      {(acts || []).filter(a => a.customer === sel.name).slice(0, 8).map(a => <div key={a.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)', width: 52, flexShrink: 0 }}>{a.type}</span><span style={{ flex: 1, color: 'var(--text-high)' }}>{a.note}</span><span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{ucDate(a.createdAt)}</span></div>)}
      {(acts || []).filter(a => a.customer === sel.name).length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Nothing logged yet.</div>}
    </UcDrawer>
  );
  return (
    <UcFrame label="Leads" title="Leads & Customers" sub={`${leads.length} lead${leads.length === 1 ? '' : 's'} · ${customers.length} customer${customers.length === 1 ? '' : 's'} · shared with the portal`} isMobile={isMobile}
      right={<><UcSearch value={q} onChange={setQ} placeholder="Search leads & customers" /><UcBtn onClick={salesLeadForm}>+ New lead</UcBtn></>}
      tiles={<>
        <UcTile label="Leads" value={leads.length} sub="not yet customers" tone={leads.length ? 'warn' : undefined} />
        <UcTile label="Customers" value={customers.length} sub="book of business" />
        <UcTile label="Added (30d)" value={addedRecently} sub="new records" />
        <UcTile label="Open follow-ups" value={followUps} sub="tasks waiting" />
      </>}
      tabs={SA_LEAD_SUBS.map(s => ({ ...s, count: s.id === 'leads' ? leads.length : s.id === 'customers' ? customers.length : undefined }))} tab={tab} onTab={setTab}
      drawer={drawer}>
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} selectedId={selId} onRow={r => setSelId(r.id)} empty={<UcEmpty title={q ? 'No one matches' : tab === 'leads' ? 'No leads yet' : 'No customers yet'} body={q ? 'Try another name, phone or email.' : 'Add a lead here; it shows in the portal’s Customers immediately, and converts to a customer when the first deal lands.'} cta={q ? undefined : '+ New lead'} onCta={salesLeadForm} />} /></div></UcCard>
      {quoteFor && <SalesQuoteForm presetCustomer={quoteFor} onClose={() => setQuoteFor(null)} />}
    </UcFrame>
  );
}

/* ══════════════ QUOTES & PROPOSALS ══════════════ */
const SA_QUOTE_STATUS = { qualified: 'draft', lead: 'draft', proposal: 'sent', won: 'accepted', lost: 'declined' };
function SalesQuotesScreen({ isMobile }) {
  const items = useSalesPipeline();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [selId, setSelId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const docs = items.filter(i => i._doc || i._prop);
  const shown = docs.filter(i => (status === 'all' || SA_QUOTE_STATUS[i.stage] === status) && docSearchMatch(q, i.ref, i.title, i.customer, i.value, i.kind));
  const by = (s) => docs.filter(i => SA_QUOTE_STATUS[i.stage] === s);
  const sent = by('sent'), accepted = by('accepted'), declined = by('declined');
  const winRate = accepted.length + declined.length ? Math.round(accepted.length / (accepted.length + declined.length) * 100) + '%' : '—';
  const sel = items.find(i => i.key === selId) || null;
  const cols = [
    { k: 'ref', l: 'Ref', w: 110, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.ref}</span> },
    { k: 'customer', l: 'Customer', render: r => <span><span style={{ fontWeight: 600 }}>{r.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.title}</span></span> },
    { k: 'kind', l: 'Kind', render: r => <SalesKindChip kind={r.kind} /> },
    { k: 'stage', l: 'Status', render: r => <SalesStageCell stage={r.stage} /> },
    { k: 'value', l: 'Value', right: true, render: r => ucMoney(r.value) },
    { k: 'project', l: 'Project', dim: true, render: r => r.project ? r.project.number : '—' },
    { k: 'lastTouch', l: 'Last touch', dim: true, render: r => r.lastTouch ? ucDate(r.lastTouch) : '—' },
  ];
  return (
    <UcFrame label="Quotes" title="Quotes & Proposals" sub={`${sent.length} out for signature · ${salesFmt$(sent.reduce((s, i) => s + i.value, 0))} awaiting a decision`} isMobile={isMobile}
      right={<><UcSearch value={q} onChange={setQ} placeholder="Search quotes & proposals" /><UcBtn kind="ghost" onClick={() => window.open(salesPortalUrl('proposals'), '_blank')}>Proposal builder</UcBtn><UcBtn onClick={() => setCreating(true)}>+ New quote</UcBtn></>}
      tiles={<>
        <UcTile label="Drafts" value={by('draft').length} sub="not sent yet" />
        <UcTile label="Sent" value={sent.length} sub={`${salesFmt$(sent.reduce((s, i) => s + i.value, 0))} awaiting a decision`} tone={sent.length ? 'warn' : undefined} />
        <UcTile label="Accepted" value={accepted.length} sub={`${salesFmt$(accepted.reduce((s, i) => s + i.value, 0))} won`} tone={accepted.length ? 'ok' : undefined} />
        <UcTile label="Win rate" value={winRate} sub={`${accepted.length} of ${accepted.length + declined.length} decided`} />
      </>}
      chips={<UcChips options={[{ id: 'all', l: 'All', n: docs.length }, { id: 'draft', l: 'Draft', n: by('draft').length }, { id: 'sent', l: 'Sent', n: sent.length }, { id: 'accepted', l: 'Accepted', n: accepted.length }, { id: 'declined', l: 'Declined', n: declined.length }]} value={status} onChange={setStatus} />}
      drawer={sel ? <SalesDealDrawer item={sel} onClose={() => setSelId(null)} isMobile={isMobile} /> : null}>
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={shown} selectedId={selId} onRow={r => setSelId(r.key)} empty={<UcEmpty title={q || status !== 'all' ? 'No quotes match' : 'No quotes yet'} body={q || status !== 'all' ? 'Clear the search or status filter.' : 'Build a quote here and email the accept link, or draft a full proposal in the portal — both show up in this list.'} cta={q || status !== 'all' ? undefined : '+ New quote'} onCta={() => setCreating(true)} />} /></div></UcCard>
      {creating && <SalesQuoteForm onClose={() => setCreating(false)} />}
    </UcFrame>
  );
}

/* ══════════════ ACTIVITIES & TASKS ══════════════ */
const SA_ACT_SUBS = [{ id: 'tasks', label: 'Tasks' }, { id: 'log', label: 'Activity log' }];
function SalesActivitiesScreen({ isMobile }) {
  const [acts, setActs] = useShieldStore(salesActStore);
  const [tab, setTab] = useUcSub('tasks', SA_ACT_SUBS, 'tasks');
  const [filter, setFilter] = React.useState('open');
  const [q, setQ] = React.useState('');
  const tIso = todayISO();
  const tasks = (acts || []).filter(a => a.type === 'task');
  const openTasks = tasks.filter(a => a.status === 'open');
  const overdue = openTasks.filter(salesOverdue);
  const doneWeek = (acts || []).filter(a => a.status === 'done' && a.type === 'task' && ucAgoDays(a.createdAt) <= 7).length;
  const loggedWeek = (acts || []).filter(a => a.type !== 'task' && ucAgoDays(a.createdAt) <= 7).length;
  const rows = (tab === 'tasks'
    ? tasks.filter(a => filter === 'all' ? true : filter === 'open' ? a.status === 'open' : filter === 'overdue' ? salesOverdue(a) : a.status === 'done')
    : (acts || []).filter(a => a.type !== 'task'))
    .filter(a => docSearchMatch(q, a.note, a.customer, a.type, a.by));
  const toggle = (a) => setActs(list => (list || []).map(x => x.id === a.id ? { ...x, status: x.status === 'open' ? 'done' : 'open', doneAt: x.status === 'open' ? Date.now() : null } : x));
  const remove = (a) => setActs(list => (list || []).filter(x => x.id !== a.id));
  const cols = [
    ...(tab === 'tasks' ? [{ k: 'done', l: '', w: 36, render: r => <button onClick={e => { e.stopPropagation(); toggle(r); }} title={r.status === 'done' ? 'Reopen' : 'Mark done'} style={{ width: 20, height: 20, borderRadius: 6, border: r.status === 'done' ? 'none' : '1.5px solid var(--border-strong)', background: r.status === 'done' ? 'var(--status-ok)' : 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{r.status === 'done' ? '✓' : ''}</button> }] : [{ k: 'type', l: 'Type', w: 90, render: r => <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)' }}>{r.type}</span> }]),
    { k: 'note', l: tab === 'tasks' ? 'Task' : 'What happened', render: r => <span style={{ textDecoration: r.status === 'done' && tab === 'tasks' ? 'line-through' : 'none', opacity: r.status === 'done' && tab === 'tasks' ? 0.6 : 1 }}>{r.note}</span> },
    { k: 'customer', l: 'Customer', dim: true },
    ...(tab === 'tasks' ? [{ k: 'due', l: 'Due', render: r => r.due ? <span style={{ color: salesOverdue(r) ? 'var(--status-critical)' : undefined, fontWeight: salesOverdue(r) ? 600 : 400 }}>{ucDate(r.due)}{salesOverdue(r) ? ' · overdue' : ''}</span> : '—' }] : []),
    { k: 'by', l: 'By', dim: true },
    { k: 'createdAt', l: 'Logged', dim: true, render: r => ucDate(r.createdAt) },
    { k: 'act', l: '', w: 60, render: r => <UcBtn small kind="ghost" onClick={e => { e.stopPropagation(); remove(r); }}>Remove</UcBtn> },
  ];
  return (
    <UcFrame label="Activities" title="Activities & Tasks" sub={`${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} · ${overdue.length} overdue · ${loggedWeek} touch${loggedWeek === 1 ? '' : 'es'} logged this week`} isMobile={isMobile}
      right={<><UcSearch value={q} onChange={setQ} placeholder="Search activity" /><UcBtn onClick={() => salesLogForm()}>+ Log activity / task</UcBtn></>}
      tiles={<>
        <UcTile label="Open tasks" value={openTasks.length} sub="waiting on you" />
        <UcTile label="Overdue" value={overdue.length} sub="past their due date" tone={overdue.length ? 'crit' : 'ok'} />
        <UcTile label="Done (7d)" value={doneWeek} sub="tasks closed this week" tone={doneWeek ? 'ok' : undefined} />
        <UcTile label="Touches (7d)" value={loggedWeek} sub="calls, meetings, emails, notes" />
      </>}
      tabs={SA_ACT_SUBS.map(s => ({ ...s, count: s.id === 'tasks' ? openTasks.length : undefined }))} tab={tab} onTab={setTab}
      chips={tab === 'tasks' ? <UcChips options={[{ id: 'open', l: 'Open', n: openTasks.length }, { id: 'overdue', l: 'Overdue', n: overdue.length }, { id: 'done', l: 'Done' }, { id: 'all', l: 'All' }]} value={filter} onChange={setFilter} /> : null}>
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} empty={<UcEmpty title={tab === 'tasks' ? (filter === 'overdue' ? 'Nothing overdue' : 'No tasks here') : 'Nothing logged yet'} body={tab === 'tasks' ? 'Follow-ups you add from a lead or a deal land here with a due date.' : 'Calls, meetings, emails and notes you log build the activity leaderboard.'} cta="+ Log activity / task" onCta={() => salesLogForm()} />} /></div></UcCard>
    </UcFrame>
  );
}

/* ══════════════ DASHBOARD ══════════════ */
function SalesDashboardScreen({ isMobile, onOpen }) {
  const items = useSalesPipeline();
  const [acts] = useShieldStore(salesActStore);
  const open = items.filter(i => i.stage !== 'won' && i.stage !== 'lost');
  const won = items.filter(i => i.stage === 'won'), lost = items.filter(i => i.stage === 'lost');
  const winRate = won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) + '%' : '—';
  const forecast = open.reduce((s, i) => s + i.value * SALES_STAGE[i.stage].p, 0);
  const byOwner = {};
  (acts || []).forEach(a => { byOwner[a.by || '—'] = (byOwner[a.by || '—'] || 0) + 1; });
  const leaders = Object.entries(byOwner).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCol = Math.max(1, ...SALES_STAGES.map(([id]) => items.filter(i => i.stage === id).reduce((s, i) => s + i.value, 0)));
  const overdue = (acts || []).filter(salesOverdue);
  const stale = open.filter(salesStale);
  const sentLong = open.filter(i => i.stage === 'proposal' && i.lastTouch && ucAgoDays(i.lastTouch) >= 7);
  const attention = [
    ...overdue.map(a => ({ id: 'a-' + a.id, tone: 'var(--status-critical)', what: `Overdue task: ${a.note}`, who: a.customer || '', go: () => onOpen('tasks', 'tasks') })),
    ...sentLong.map(i => ({ id: 's-' + i.key, tone: 'var(--status-warn)', what: `Sent ${ucAgoDays(i.lastTouch)} days ago, no decision: ${i.title}`, who: `${i.customer} · ${ucMoney(i.value)}`, go: () => onOpen('quotes') })),
    ...stale.filter(i => !sentLong.includes(i)).map(i => ({ id: 'q-' + i.key, tone: 'var(--status-warn)', what: `Quiet ${i.staleDays} days: ${i.title}`, who: `${i.customer} · ${ucMoney(i.value)}`, go: () => onOpen('pipeline', 'list') })),
  ];
  const recent = (acts || []).slice(0, 8);
  return (
    <UcFrame label="Dashboard" title="Sales dashboard" sub="Live from the same records as the portal — every proposal, quote and bid in the business" isMobile={isMobile}
      right={<><UcBtn kind="ghost" onClick={() => salesLogForm()}>Log activity</UcBtn><UcBtn onClick={() => salesDealForm()}>+ New deal</UcBtn></>}
      tiles={<>
        <UcTile label="Open pipeline" value={salesFmt$(open.reduce((s, i) => s + i.value, 0))} sub={`${open.length} deal${open.length === 1 ? '' : 's'}`} onClick={() => onOpen('pipeline', 'board')} />
        <UcTile label="Forecast" value={salesFmt$(forecast)} sub="probability-weighted" tone="ok" />
        <UcTile label="Won" value={salesFmt$(won.reduce((s, i) => s + i.value, 0))} sub={`${won.length} deal${won.length === 1 ? '' : 's'}`} tone={won.length ? 'ok' : undefined} />
        <UcTile label="Win rate" value={winRate} sub={won.length + lost.length ? `${won.length} of ${won.length + lost.length} decided` : 'no decided deals yet'} />
        <UcTile label="Needs attention" value={attention.length} sub="overdue, quiet or undecided" tone={attention.length ? 'warn' : undefined} />
      </>}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <UcCard title="Needs attention" action={<span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{attention.length} item{attention.length === 1 ? '' : 's'}</span>} pad={attention.length ? 0 : 16}>
          {attention.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>All clear — no overdue tasks, no quiet deals, nothing waiting more than a week for a decision.</div>}
          {attention.slice(0, 10).map(a => (
            <div key={a.id} onClick={a.go} className="st-clickrow" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <UcDot color={a.tone} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.what}</div>{a.who && <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{a.who}</div>}</div>
              <span style={{ color: 'var(--text-low)' }}>›</span>
            </div>
          ))}
        </UcCard>
        <UcCard title="Pipeline by stage">
          {SALES_STAGES.map(([id, label, c]) => {
            const col = items.filter(i => i.stage === id);
            const v = col.reduce((s, i) => s + i.value, 0);
            return (
              <div key={id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-high)', fontWeight: 600 }}><UcDot color={c} />{label}</span>
                  <span style={{ color: 'var(--text-mid)', fontVariantNumeric: 'tabular-nums' }}>{col.length} · {salesFmt$(v)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}><div style={{ width: `${Math.round(v / maxCol * 100)}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 0.4s' }} /></div>
              </div>
            );
          })}
        </UcCard>
        <UcCard title="Activity leaderboard">
          {leaders.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>Log calls, meetings and tasks — the leaderboard builds itself.</div>}
          {leaders.map(([who, n], i) => (
            <div key={who} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--status-warn)' : 'var(--text-low)', width: 22 }}>#{i + 1}</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-high)', flex: 1 }}>{who}</span>
              <span style={{ fontSize: 12, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>{n} activit{n === 1 ? 'y' : 'ies'}</span>
            </div>
          ))}
        </UcCard>
        <UcCard title="Recent activity" action={<UcBtn small kind="ghost" onClick={() => onOpen('tasks', 'log')}>All</UcBtn>}>
          {recent.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>Nothing logged yet.</div>}
          {recent.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', alignItems: 'baseline', fontSize: 12.5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)', width: 52, flexShrink: 0 }}>{a.type}</span>
              <span style={{ flex: 1, color: 'var(--text-high)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.note}{a.customer ? <span style={{ color: 'var(--text-mid)' }}> · {a.customer}</span> : null}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>{ucDate(a.createdAt)}</span>
            </div>
          ))}
        </UcCard>
      </div>
    </UcFrame>
  );
}

/* ══════════════ APP SHELL (sidebar on desktop · tab bar on the phone) ══════════════ */
const SALES_NAV = [
  { id: 'stats', icon: 'dashboard', label: 'Dashboard' },
  { id: 'pipeline', icon: 'pipeline', label: 'Pipeline', children: [{ sub: 'board', label: 'Board' }, { sub: 'list', label: 'List' }] },
  { id: 'leads', icon: 'customers', label: 'Leads & Customers', children: [{ sub: 'leads', label: 'Leads' }, { sub: 'customers', label: 'Customers' }] },
  { id: 'quotes', icon: 'proposals', label: 'Quotes & Proposals' },
  { id: 'tasks', icon: 'approvals', label: 'Activities', children: [{ sub: 'tasks', label: 'Tasks' }, { sub: 'log', label: 'Activity log' }] },
];
const SALES_TABS = [
  { id: 'stats', icon: 'dashboard', label: 'Home' },
  { id: 'pipeline', icon: 'pipeline', label: 'Pipeline' },
  { id: 'leads', icon: 'customers', label: 'Leads' },
  { id: 'quotes', icon: 'proposals', label: 'Quotes' },
  { id: 'tasks', icon: 'approvals', label: 'Tasks' },
];

function SalesAvatarMenu() {
  const [open, setOpen] = React.useState(false);
  const [prefs, setPrefs] = useShieldStore(userPrefsStore);
  const u = window.__shieldUser;
  const theme = (prefs && prefs.theme) || 'dark';
  const item = { ...salesFont, display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 13, cursor: 'pointer', textAlign: 'left' };
  const seg = (active) => ({ ...salesFont, flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: active ? 'var(--brand-tint-12)' : 'transparent', border: `1px solid ${active ? 'var(--brand)' : 'var(--border-subtle)'}`, color: active ? 'var(--brand)' : 'var(--text-low)' });
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{(u && u.initials) || '·'}</button>
      {open && ReactDOM.createPortal((
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483646 }} />
          <div style={{ position: 'fixed', top: 46, right: 8, zIndex: 2147483647, width: 'min(250px, 88vw)', background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: '0 16px 44px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{(u && u.name) || 'Sales'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{(u && u.role) || 'Sales'}{u && u.email ? ` · ${u.email}` : ''}</div>
            </div>
            <button style={item} onClick={() => { setOpen(false); window.open(salesPortalUrl('crm'), '_blank'); }}>Open the portal</button>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 14px 6px' }}>Appearance</div>
            <div style={{ display: 'flex', gap: 5, padding: '0 14px 10px' }}>
              {[['dark', 'Dark'], ['light', 'Light'], ['system', 'System']].map(([id, l]) => <button key={id} onClick={() => setPrefs(p => ({ ...(p || {}), theme: id }))} style={seg(theme === id)}>{l}</button>)}
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />
            <button style={{ ...item, color: 'var(--status-critical)' }} onClick={() => { setOpen(false); if (window.__shieldAuth) window.__shieldAuth.signOut(); }}>Sign out</button>
          </div>
        </React.Fragment>
      ), document.body)}
    </div>
  );
}

function SalesRail({ current, onNav }) {
  const navSub = useUcNavSub();
  return (
    <nav className="sa-rail" style={{ width: 220, flexShrink: 0, background: 'var(--card)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', padding: '16px 0', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', marginBottom: 18, minHeight: 36 }}>
        <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 30, objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>Sales</div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {SALES_NAV.map(item => {
          const active = current === item.id;
          const activeSub = active && navSub && navSub.screen === item.id ? navSub.sub : null;
          return (
            <React.Fragment key={item.id}>
              <button onClick={() => onNav(item.id, item.children ? item.children[0].sub : undefined)} style={{ ...salesFont, display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 16px 7px 20px', background: active ? 'rgba(var(--brand-rgb),0.08)' : 'transparent', border: 'none', cursor: 'pointer', position: 'relative', color: active ? 'var(--brand)' : 'var(--text-mid)', fontSize: 13, textAlign: 'left' }}>
                {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 2px 2px 0', background: 'var(--brand)', boxShadow: '0 0 10px var(--brand)' }} />}
                <Icon name={item.icon} size={14} color={active ? 'var(--brand)' : 'var(--text-mid)'} style={{ flexShrink: 0, width: 20, opacity: active ? 1 : 0.7 }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
              {active && item.children && item.children.map(k => {
                const on = activeSub === k.sub || (!activeSub && k === item.children[0]);
                return (
                  <button key={k.sub} onClick={() => onNav(item.id, k.sub)} style={{ ...salesFont, display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 16px 5px 48px', background: on ? 'rgba(var(--brand-rgb),0.08)' : 'transparent', border: 'none', cursor: 'pointer', color: on ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12.5, textAlign: 'left', position: 'relative', fontWeight: on ? 600 : 400 }}>
                    <span style={{ position: 'absolute', left: 34, top: '50%', width: 5, height: 5, borderRadius: '50%', transform: 'translateY(-50%)', background: on ? 'var(--brand)' : 'var(--border-strong)' }} />
                    {k.label}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>
        <a href={salesPortalUrl('crm')} target="_blank" rel="noreferrer" style={{ color: 'var(--text-mid)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}><Icon name="dashboard" size={12} color="var(--text-low)" /> Portal</a>
        Wired live into the portal — same customers, proposals and bids.
      </div>
    </nav>
  );
}

function SalesApp() {
  const isMobile = useUcMobile(959);
  // Restore the last screen on refresh/relaunch (device-local).
  const [screen, setScreenState] = React.useState(() => { const s = savedScreen('sales', 'stats'); return SALES_NAV.some(n => n.id === s) ? s : 'stats'; });
  const setScreen = (id, sub) => { if (sub) ucNavSubSet(id, sub, 'nav'); setScreenState(id); saveScreen('sales', id); };
  React.useEffect(() => { window.__shieldNav = (id) => setScreen(id); });

  const views = {
    stats: <SalesDashboardScreen isMobile={isMobile} onOpen={setScreen} />,
    pipeline: <SalesPipelineScreen isMobile={isMobile} />,
    leads: <SalesLeadsScreen isMobile={isMobile} />,
    quotes: <SalesQuotesScreen isMobile={isMobile} />,
    tasks: <SalesActivitiesScreen isMobile={isMobile} />,
  };
  const current = SALES_NAV.find(n => n.id === screen) || SALES_NAV[0];

  if (!isMobile) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--canvas)', overflow: 'hidden' }}>
        <SalesRail current={screen} onNav={setScreen} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <header style={{ height: 48, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-subtle)', background: 'var(--card)', flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)' }}>{current.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-low)' }}>ShieldTech Sales</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href={salesPortalUrl('crm')} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: 'var(--text-mid)', textDecoration: 'none' }}>Open the portal ↗</a>
              <SalesAvatarMenu />
            </div>
          </header>
          <div className="sa-screen" style={{ flex: 1, minHeight: 0, padding: 12, '--uf-h': 'calc(100vh - 72px)', '--uf-m': '0' }}>
            {views[screen]}
          </div>
        </div>
        <ShieldToastHost />
      </div>
    );
  }
  return (
    <div className="m-app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
      <header style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(var(--card-rgb),0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0 }}>
        <img src="uploads/ShieldTech Emblem Transparent MK1 .png" alt="ShieldTech" style={{ height: 22 }} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-high)' }}>SHIELDTECH</span>
        <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 700 }}>SALES</span>
        <div style={{ flex: 1 }} />
        <SalesAvatarMenu />
      </header>
      <div className="sa-screen" style={{ flex: 1, minHeight: 0, overflow: 'hidden', '--uf-h': '100%', '--uf-m': '0', '--uf-r': '0', '--uf-b': 'none' }}>
        {views[screen]}
      </div>
      <nav style={{ display: 'flex', borderTop: '1px solid var(--border-subtle)', background: 'rgba(var(--card-rgb),0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {SALES_TABS.map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{ ...salesFont, flex: 1, padding: '8px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: screen === t.id ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', position: 'relative' }}>
            {screen === t.id && <div style={{ position: 'absolute', top: -1, left: '30%', right: '30%', height: 2, background: 'var(--brand)', borderRadius: '0 0 2px 2px', boxShadow: '0 0 8px var(--brand)' }} />}
            <Icon name={t.icon} size={18} color={screen === t.id ? 'var(--brand)' : 'var(--text-low)'} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}>{t.label}</span>
          </button>
        ))}
      </nav>
      <ShieldToastHost />
    </div>
  );
}

Object.assign(window, {
  SalesApp, salesDealStore, salesActStore, salesStageStore, useSalesPipeline, setPipelineStage, addActivity,
  SalesPipelineScreen, SalesLeadsScreen, SalesQuotesScreen, SalesActivitiesScreen, SalesDashboardScreen, SalesDealDrawer, SalesQuoteForm,
});

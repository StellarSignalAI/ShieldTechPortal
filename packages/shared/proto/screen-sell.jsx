/* SELL — Bid Board + Proposals on the UniFi-pattern layout, under the one
   unified sidebar.

   Bid Board: every opportunity is a persisted record (oppStore, synced across
   desktop / mobile) that the guided Bid Room (sw/) opens and advances. The
   board shows the six bid phases plus Sent out / Won / Lost, a list view, the
   AI lead feed and Auto-Bid. A selected bid opens a properties drawer with the
   real actions: open the bid room, move phase, mark won / lost / no-go, turn
   the estimate into a proposal, create the customer, schedule the site walk.

   Proposals: the same proposalStore records the builder and mobile edit, in a
   UniFi table with status chips, a properties drawer and a real “new proposal”
   form (no window.prompt). The block builder (screen-proposal-v2) is reused. */

const oppStore = createShieldStore('opps', []);
const sellFont = { fontFamily: 'var(--font-body)' };
const SELL_TRADES = ['CCTV', 'Access', 'Intrusion', 'Fire', 'Intercom', 'Paging', 'Network', 'Cabling', 'Fiber', 'Nurse call'];
const SELL_SOURCES = ['Referral', 'RFP / bid portal', 'Website', 'Existing customer', 'Walk-in / call', 'Trade show', 'AI lead agent'];
const SELL_TRADE_COLOR = { CCTV: 'var(--disc-cctv)', Access: 'var(--disc-access)', Intrusion: 'var(--disc-alarm)', Fire: 'var(--disc-fire)', Intercom: 'var(--disc-intercom)', Paging: 'var(--disc-av)', Network: 'var(--brand)', Cabling: 'var(--disc-cabling)', Fiber: 'var(--disc-cabling)', 'Nurse call': 'var(--disc-intercom)' };
const SELL_FIN = { submitted: { id: 'submitted', label: 'Sent out' }, won: { id: 'won', label: 'Won' }, lost: { id: 'lost', label: 'Lost / No-go' } };

/* Persisted opportunities feed the Secret Weapon engine's in-memory list so
   the Bid Room, Auto-Bid and the lead feed all see the same records. */
function sellSyncOpps() {
  const SW = window.SW; if (!SW || !SW.OPPS) return;
  const rows = oppStore.get() || [];
  const ids = new Set(rows.map(r => r.id));
  for (let i = SW.OPPS.length - 1; i >= 0; i--) if (SW.OPPS[i]._local && !ids.has(SW.OPPS[i].id)) SW.OPPS.splice(i, 1);
  rows.forEach(r => { const ex = SW.OPPS.find(o => o.id === r.id); if (ex) Object.assign(ex, r); else SW.OPPS.push({ ...r }); });
}
sellSyncOpps();
function sellNextOppId() {
  const nums = [...(oppStore.get() || []), ...((window.SW && window.SW.OPPS) || [])].map(o => parseInt(String(o.id || '').replace(/\D/g, ''), 10) || 0);
  return 'OPP-' + (Math.max(1000, ...nums) + 1);
}
function sellPhase(o) { return brCurrentPhase(o, brLoad(o.id)); }
function sellCol(o) { const p = sellPhase(o); return p === 'nogo' ? 'lost' : p; }
function sellDue(iso) { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function sellHrs(o) { return o.dueAt ? brHoursLeft(o) : Infinity; }
function sellMoney(n) { return '$' + Math.round(Number(n) || 0).toLocaleString(); }
function sellSetPhase(o, phase) {
  const s = brLoad(o.id);
  const base = { ...s, phaseOverride: null, decision: s.decision === 'nogo' ? null : s.decision };
  if (phase === 'nogo') brSave(o.id, { ...base, decision: 'nogo', submitted: null, award: null });
  else if (phase === 'submitted') brSave(o.id, { ...base, submitted: s.submitted || { at: Date.now() }, award: null });
  else if (phase === 'won' || phase === 'lost') brSave(o.id, { ...base, submitted: s.submitted || { at: Date.now() }, award: { result: phase, reason: phase === 'won' ? 'Awarded' : 'Not selected' } });
  else brSave(o.id, { ...base, submitted: null, award: null, phaseOverride: phase });
}
/* Bid estimate → proposal record (block builder) with real line items. */
function sellOppToProposal(o) {
  const est = brEstimate(o, brLoad(o.id));
  const lines = est.lines.map(l => ({ desc: `${l.trade} — ${l.item}`, qty: l.qty, rate: Math.round(((l.material + l.labor) / Math.max(l.qty, 1)) * (1 + est.marginPct / 100)) }));
  if (est.equip) lines.push({ desc: 'Lifts, tooling and equipment', qty: 1, rate: Math.round(est.equip * (1 + est.marginPct / 100)) });
  if (est.pm) lines.push({ desc: 'Project management and engineering', qty: 1, rate: Math.round(est.pm * (1 + est.marginPct / 100)) });
  const id = nextProposalId();
  const today = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const rec = {
    id, customer: o.buyer, title: o.title, status: 'draft', oppId: o.id,
    created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), viewed: false, viewTime: '—',
    blocks: [
      { id: 'cover', type: 'cover', content: { heading: o.buyer, subtitle: o.title, date: today } },
      { id: 'intro', type: 'intro', content: { text: `Thank you for the opportunity to propose on ${o.title}. ShieldTech Solutions will furnish, install, program and commission the ${(o.trades || []).join(', ').toLowerCase()} systems described below.` } },
      { id: 'scope', type: 'scope', content: { items: (o.trades || []).map(t => `Furnish, install and commission the complete ${t} system`) } },
      { id: 'pricing', type: 'pricing', content: { items: lines } },
      { id: 'terms', type: 'terms', content: { text: 'Standard terms: 50% deposit upon acceptance, 40% at rough-in completion, 10% at final commissioning. All equipment carries manufacturer warranty. Proposal valid for 30 days.' } },
      { id: 'signature', type: 'signature', content: {} },
    ],
  };
  proposalStore.set(prev => [rec, ...(prev || [])]);
  oppStore.set(prev => (prev || []).map(x => x.id === o.id ? { ...x, proposalId: id } : x));
  return rec;
}
function sellEnsureCustomer(o) {
  const name = (o.buyer || '').trim(); if (!name) return null;
  const existing = (customerStore.get() || []).find(c => (c.name || c.customer || '').toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const poc = o.poc || {};
  const rec = { id: 'cust-' + Date.now(), name, contact: poc.name || '', phone: poc.phone || '', email: poc.email || '', address: o.address || '', createdAt: Date.now(), source: 'bid-board', oppId: o.id };
  customerStore.set(prev => [rec, ...(prev || [])]);
  return rec;
}

/* ── Opportunity form (new / edit) — a drawer-style modal with trade chips ── */
function SellOppForm({ initial, onSave, onClose }) {
  const [f, setF] = React.useState(() => ({
    title: '', buyer: '', value: '', dueAt: '', trades: [], source: SELL_SOURCES[0], state: '', address: '',
    pocName: '', pocPhone: '', pocEmail: '', siteWalk: '', notes: '',
    ...(initial ? { ...initial, value: initial.value || '', dueAt: initial.dueAt ? String(initial.dueAt).slice(0, 10) : '', siteWalk: initial.siteWalk ? String(initial.siteWalk).slice(0, 10) : '', pocName: (initial.poc || {}).name || '', pocPhone: (initial.poc || {}).phone || '', pocEmail: (initial.poc || {}).email || '' } : {}),
  }));
  const [tried, setTried] = React.useState(false);
  const customers = shieldCustomerNames();
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { ...sellFont, width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none' };
  const lab = { fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' };
  const bad = (k) => tried && !String(f[k] || '').trim();
  const submit = () => {
    setTried(true);
    if (!f.title.trim() || !f.buyer.trim() || !f.trades.length) return;
    onSave({
      ...(initial || {}),
      id: (initial && initial.id) || sellNextOppId(),
      title: f.title.trim(), buyer: f.buyer.trim(), value: Number(String(f.value).replace(/[^\d.]/g, '')) || 0,
      dueAt: f.dueAt ? new Date(f.dueAt + 'T17:00:00').toISOString() : null,
      trades: f.trades, source: f.source, state: (f.state || '').trim().toUpperCase().slice(0, 2) || 'US', address: f.address,
      poc: { name: f.pocName.trim(), phone: f.pocPhone.trim(), email: f.pocEmail.trim() },
      siteWalk: f.siteWalk ? new Date(f.siteWalk + 'T09:00:00').toISOString() : null,
      sourceRisk: f.source === 'AI lead agent' ? 'medium' : 'low', docs: (initial && initial.docs) || {},
      status: (initial && initial.status) || 'Warm', owner: (initial && initial.owner) || null, industry: (initial && initial.industry) || 'commercial', fit: (initial && initial.fit) || 70,
      notes: f.notes, createdAt: (initial && initial.createdAt) || Date.now(), _local: true,
    });
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" style={{ width: 640, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: '0 24px 70px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>{initial ? 'Edit opportunity' : 'New opportunity'}</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>Lands in Qualify; the guided bid room takes it from there.</div></div>
          <button onClick={onClose} style={{ ...sellFont, background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={lab}>Opportunity title *</label><input value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Riverside Medical — campus video + access" style={{ ...inp, borderColor: bad('title') ? 'var(--status-critical)' : 'var(--border-subtle)' }} /></div>
          <div><label style={lab}>Customer / buyer *</label><input list="sell-customers" value={f.buyer} onChange={e => set('buyer', e.target.value)} placeholder="Company" style={{ ...inp, borderColor: bad('buyer') ? 'var(--status-critical)' : 'var(--border-subtle)' }} /><datalist id="sell-customers">{customers.map(c => <option key={c} value={c} />)}</datalist></div>
          <div><label style={lab}>Estimated value ($)</label><input inputMode="numeric" value={f.value} onChange={e => set('value', e.target.value)} placeholder="125000" style={inp} /></div>
          <div><label style={lab}>Bid due</label><input type="date" value={f.dueAt} onChange={e => set('dueAt', e.target.value)} style={inp} /></div>
          <div><label style={lab}>Source</label><select value={f.source} onChange={e => set('source', e.target.value)} style={inp}>{SELL_SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lab}>Systems in scope *</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{SELL_TRADES.map(t => { const on = f.trades.includes(t); return <button key={t} onClick={() => set('trades', on ? f.trades.filter(x => x !== t) : [...f.trades, t])} style={{ ...sellFont, padding: '5px 11px', borderRadius: 14, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', background: on ? 'var(--brand)' : 'var(--card)', color: on ? '#fff' : 'var(--text-mid)', border: `1px solid ${on ? 'var(--brand)' : 'var(--border-subtle)'}` }}>{t}</button>; })}</div>
            {tried && !f.trades.length && <div style={{ fontSize: 11, color: 'var(--status-critical)', marginTop: 4 }}>Pick at least one system</div>}
          </div>
          <div><label style={lab}>Site address</label><input value={f.address} onChange={e => set('address', e.target.value)} placeholder="Street, City" style={inp} /></div>
          <div><label style={lab}>State</label><input value={f.state} onChange={e => set('state', e.target.value)} placeholder="VA" maxLength={2} style={inp} /></div>
          <div><label style={lab}>Point of contact</label><input value={f.pocName} onChange={e => set('pocName', e.target.value)} placeholder="Full name" style={inp} /></div>
          <div><label style={lab}>Contact phone</label><input value={f.pocPhone} onChange={e => set('pocPhone', e.target.value)} placeholder="(555) 555-0100" style={inp} /></div>
          <div><label style={lab}>Contact email</label><input value={f.pocEmail} onChange={e => set('pocEmail', e.target.value)} placeholder="name@company.com" style={inp} /></div>
          <div><label style={lab}>Pre-bid site walk</label><input type="date" value={f.siteWalk} onChange={e => set('siteWalk', e.target.value)} style={inp} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={lab}>Notes</label><textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="What does the customer need? Incumbent, budget, decision makers…" style={{ ...inp, minHeight: 70, resize: 'vertical' }} /></div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <UcBtn kind="ghost" onClick={onClose}>Cancel</UcBtn>
          <UcBtn onClick={submit}>{initial ? 'Save changes' : 'Add to board'}</UcBtn>
        </div>
      </div>
    </div>
  );
}

function SellTradeChips({ trades, max = 3 }) {
  const list = trades || [];
  return <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>{list.slice(0, max).map(t => <span key={t} style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: 'var(--card)', border: `1px solid ${SELL_TRADE_COLOR[t] || 'var(--border-strong)'}`, color: SELL_TRADE_COLOR[t] || 'var(--text-mid)' }}>{t}</span>)}{list.length > max && <span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>+{list.length - max}</span>}</span>;
}
function SellDueChip({ o, withDate }) {
  const col = sellCol(o);
  const date = <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{sellDue(o.dueAt)}</span>;
  if (col === 'won' || col === 'lost' || col === 'submitted') return date;
  const h = sellHrs(o);
  if (!isFinite(h)) return <span style={{ fontSize: 11, color: 'var(--text-low)' }}>no due date</span>;
  const c = h < 0 ? 'var(--status-critical)' : h < 72 ? 'var(--status-critical)' : h < 168 ? 'var(--status-warn)' : 'var(--text-mid)';
  const l = h < 0 ? 'overdue' : h < 48 ? `${Math.max(1, Math.round(h))}h left` : `${Math.round(h / 24)}d left`;
  return <span style={{ fontSize: 11, fontWeight: 600, color: c, whiteSpace: 'nowrap' }}>{withDate ? <>{date} · </> : null}{l}</span>;
}
function SellProgress({ o }) {
  const pct = Math.round(brProgress(o, brLoad(o.id)) * 100);
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 110 }}><span style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden' }}><span style={{ display: 'block', width: pct + '%', height: '100%', background: 'var(--brand)' }} /></span><span style={{ fontSize: 10.5, color: 'var(--text-low)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span></span>;
}

function SellBidCard({ o, selected, onOpen }) {
  const col = sellCol(o);
  const s = brLoad(o.id);
  const next = col !== 'won' && col !== 'lost' && col !== 'submitted' ? brNextAction(o, s) : null;
  return (
    <div onClick={() => onOpen(o)} className="st-clickrow" style={{ background: 'var(--card)', border: `1px solid ${selected ? 'var(--brand)' : 'var(--border-subtle)'}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: selected ? 'var(--glow-brand-sm)' : 'none' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3 }}>{o.title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.buyer}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{swK(o.value)}</span>
        <SellDueChip o={o} />
      </div>
      <SellTradeChips trades={o.trades} />
      {next && <div style={{ fontSize: 11, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Next: {next.action}</div>}
      <SellProgress o={o} />
    </div>
  );
}

/* AI lead feed card (leads come from the `opportunities` table when Supabase is configured) */
function SellLeadCard({ l, onAccept, onDismiss }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{l.title}</div><span style={{ fontSize: 11, fontWeight: 700, color: (l.fit || 0) >= 70 ? 'var(--status-ok)' : 'var(--status-warn)' }}>fit {l.fit || '—'}</span></div>
      <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{l.buyer}{l.state ? ` · ${l.state}` : ''} · {swK(l.value)} · due {sellDue(l.dueAt)}</div>
      <SellTradeChips trades={l.trades} max={4} />
      {l.why && <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.5 }}>{l.why}</div>}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}><UcBtn small onClick={onAccept}>Accept → Qualify</UcBtn><UcBtn small kind="ghost" onClick={onDismiss}>Pass</UcBtn>{l.sourceUrl && <a href={l.sourceUrl} target="_blank" rel="noreferrer" style={{ ...sellFont, fontSize: 11.5, color: 'var(--brand)', alignSelf: 'center', marginLeft: 'auto' }}>Source ↗</a>}</div>
    </div>
  );
}

/* ── Bid Board screen ── */
const SELL_SUBS = [{ id: 'board', label: 'Board' }, { id: 'list', label: 'List' }, { id: 'leads', label: 'AI leads' }, { id: 'autobid', label: 'Auto-Bid' }];
function SellBoardScreen() {
  const [rows] = useShieldStore(oppStore);
  brUseAll();
  sellSyncOpps();
  const isMobile = useIsMobile(820);
  const subInit = window.__navSub && window.__navSub.screen === 'crm' ? window.__navSub.sub : null;
  const hubInit = { autobid: 'autobid', 'secret-weapon': 'board' }[window.__hubScreenId || ''] || null;
  const [tab, setTab] = React.useState(SELL_SUBS.some(s => s.id === subInit) ? subInit : (hubInit || 'board'));
  React.useEffect(() => { const h = (e) => { if (e.detail.screen === 'crm' && e.detail.source !== 'screen' && e.detail.sub && SELL_SUBS.some(s => s.id === e.detail.sub)) setTab(e.detail.sub); }; window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, []);
  React.useEffect(() => { if (window.navSubSet && (!window.__navSub || window.__navSub.screen !== 'crm' || window.__navSub.sub !== tab)) window.navSubSet('crm', tab, 'screen'); }, [tab]);

  const [q, setQ] = React.useState('');
  const [trade, setTrade] = React.useState('all');
  const [selId, setSelId] = React.useState(null);
  const [form, setForm] = React.useState(null); // null | 'new' | opp record
  const [roomId, setRoomId] = React.useState(null);

  const opps = ((window.SW && window.SW.OPPS) || []).filter(o => {
    if (trade !== 'all' && !(o.trades || []).includes(trade)) return false;
    if (q && !`${o.title} ${o.buyer} ${(o.trades || []).join(' ')} ${o.id}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const sel = selId ? ((window.SW && window.SW.OPPS) || []).find(o => o.id === selId) : null;
  const cols = [...BR_PHASES.map(p => ({ id: p.id, label: p.label })), SELL_FIN.submitted, SELL_FIN.won, SELL_FIN.lost];
  const byCol = {}; cols.forEach(c => byCol[c.id] = []);
  opps.forEach(o => (byCol[sellCol(o)] || byCol.qualify).push(o));
  cols.forEach(c => byCol[c.id].sort((a, b) => sellHrs(a) - sellHrs(b)));
  const inFlight = opps.filter(o => !['submitted', 'won', 'lost'].includes(sellCol(o)));
  const dueSoon = inFlight.filter(o => sellHrs(o) <= 168);
  const won = byCol.won, lost = byCol.lost.filter(o => sellPhase(o) !== 'nogo');
  const winRate = won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) + '%' : '—';
  const sum = (l) => l.reduce((a, o) => a + (Number(o.value) || 0), 0);
  const leadSt = brLeadState();
  const leads = (typeof BR_LEADS !== 'undefined' ? BR_LEADS : []).filter(l => !leadSt[l.id]);

  const saveOpp = (rec) => {
    oppStore.set(prev => { const list = prev || []; return list.some(x => x.id === rec.id) ? list.map(x => x.id === rec.id ? rec : x) : [rec, ...list]; });
    sellSyncOpps(); setForm(null); setSelId(rec.id);
    shieldToast(`${rec.id} ${form === 'new' ? 'added to Qualify' : 'saved'}`, 'ok');
  };
  const removeOpp = (o) => shieldModal({ kind: 'confirm', danger: true, title: `Delete ${o.id}?`, message: `${o.title} and its bid room state are removed from every device.`, confirmLabel: 'Delete', successMsg: 'Opportunity deleted', onConfirm: () => { oppStore.set(prev => (prev || []).filter(x => x.id !== o.id)); try { localStorage.removeItem('sw:bidroom:' + o.id); } catch {} sellSyncOpps(); setSelId(null); } });
  const toProposal = (o) => { const rec = sellOppToProposal(o); shieldToast(`${rec.id} drafted from the ${o.id} estimate`, 'ok'); window.__sellOpenProposal = rec.id; if (window.__shieldNav) window.__shieldNav('proposals'); };
  const toCustomer = (o) => { const c = sellEnsureCustomer(o); if (c) shieldToast(`${c.name} is in Customers`, 'ok'); };
  const siteWalk = (o) => shieldModal({
    kind: 'form', title: 'Schedule the site walk', subtitle: `${o.title} · ${o.buyer}`, submitLabel: 'Create work order', successMsg: 'Site walk requested — it is on the Work Orders board',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, value: o.siteWalk ? String(o.siteWalk).slice(0, 10) : '' },
      { key: 'win', label: 'Window', type: 'select', options: ['Morning (8–12)', 'Afternoon (12–4)', 'Evening (4–7)'] },
      { key: 'who', label: 'Walk with', placeholder: 'Estimator / tech' },
      { key: 'notes', label: 'What to verify on site', type: 'textarea', placeholder: 'Head-end location, cable paths, door hardware, camera mounts…' },
    ],
    onSubmit: (v) => {
      const id = 'WO-' + Date.now().toString().slice(-6);
      const rec = { id, customer: o.buyer, site: o.address || '', type: 'Site walk', scope: `Pre-bid site walk for ${o.title} (${o.id}). ${v.notes || ''}`.trim(), status: 'requested', requestedBy: (window.__shieldUser || {}).name || 'Bid Board', requestedVia: 'bid-board', contact: (o.poc || {}).name || '', phone: (o.poc || {}).phone || '', window: v.win, scheduled: v.date, tech: v.who || 'Unassigned', techId: '—', assignedTo: null, materials: [], checklist: [], checkedItems: {}, createdAt: Date.now(), oppId: o.id, notes: `Opportunity ${o.id} · ${v.win}` };
      workOrderStore.set(prev => [rec, ...(prev || [])]);
      oppStore.set(prev => (prev || []).map(x => x.id === o.id ? { ...x, siteWalk: new Date(v.date + 'T09:00:00').toISOString(), siteWalkWo: id } : x));
      sellSyncOpps();
    },
  });

  const listCols = [
    { k: 'id', l: 'Bid', w: 90, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.id}</span> },
    { k: 'title', l: 'Opportunity', render: r => <span><span style={{ fontWeight: 600 }}>{r.title}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.buyer}</span></span> },
    { k: 'trades', l: 'Systems', render: r => <SellTradeChips trades={r.trades} /> },
    { k: 'value', l: 'Value', right: true, render: r => sellMoney(r.value) },
    { k: 'dueAt', l: 'Due', render: r => <SellDueChip o={r} withDate /> },
    { k: 'phase', l: 'Phase', render: r => { const c = sellCol(r); const col = c === 'won' ? 'var(--status-ok)' : c === 'lost' ? 'var(--text-low)' : c === 'submitted' ? 'var(--accent-2)' : 'var(--brand)'; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />{(cols.find(x => x.id === c) || {}).label}{sellPhase(r) === 'nogo' ? ' (no-go)' : ''}</span>; } },
    { k: 'progress', l: 'Progress', render: r => <SellProgress o={r} /> },
    { k: 'source', l: 'Source', dim: true },
  ];

  const drawer = sel && (
    <UcDrawer title={sel.title} sub={`${sel.id} · ${sel.buyer}`} onClose={() => setSelId(null)} width={isMobile ? '100%' : 400}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcBtn small onClick={() => setRoomId(sel.id)}>Open bid room</UcBtn>
        <UcBtn small kind="soft" onClick={() => toProposal(sel)}>{sel.proposalId ? 'Draft another proposal' : 'Estimate → Proposal'}</UcBtn>
        <UcBtn small kind="ghost" onClick={() => setForm(sel)}>Edit</UcBtn>
      </div>
      <UcCard title="Phase" pad={12} style={{ marginBottom: 12 }}>
        <select value={sellCol(sel) === 'lost' && sellPhase(sel) === 'nogo' ? 'nogo' : sellCol(sel)} onChange={e => { sellSetPhase(sel, e.target.value); shieldToast(`${sel.id} moved`, 'ok'); }} style={{ ...sellFont, width: '100%', padding: '8px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5 }}>
          {BR_PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          <option value="submitted">Sent out (awaiting award)</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="nogo">No-go</option>
        </select>
        <div style={{ marginTop: 10 }}>{brPhaseParts(sel, brLoad(sel.id)).map(p => <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: p.done ? 'var(--status-ok)' : p.frac ? 'var(--status-warn)' : 'var(--border-strong)' }} /><span style={{ flex: 1, color: 'var(--text-high)' }}>{p.label}</span><span style={{ color: 'var(--text-low)', fontSize: 11 }}>{Math.round(p.frac * 100)}%</span></div>)}</div>
        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-mid)' }}>Next: {brNextAction(sel, brLoad(sel.id)).action}</div>
      </UcCard>
      <UcCard title="Details" pad={12} style={{ marginBottom: 12 }}>
        <UcProp k="Value" v={sellMoney(sel.value)} />
        <UcProp k="Bid due" v={sel.dueAt ? new Date(sel.dueAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'} />
        <UcProp k="Systems" v={(sel.trades || []).join(', ')} />
        <UcProp k="Source" v={sel.source} />
        <UcProp k="Site" v={sel.address || '—'} />
        <UcProp k="State" v={sel.state && sel.state !== 'US' ? sel.state : '—'} />
        <UcProp k="Contact" v={[(sel.poc || {}).name, (sel.poc || {}).phone, (sel.poc || {}).email].filter(Boolean).join(' · ')} />
        <UcProp k="Site walk" v={sel.siteWalk ? sellDue(sel.siteWalk) + (sel.siteWalkWo ? ` · ${sel.siteWalkWo}` : '') : 'not scheduled'} />
        <UcProp k="Proposal" v={sel.proposalId || '—'} />
        {sel.notes && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 8, lineHeight: 1.5 }}>{sel.notes}</div>}
      </UcCard>
      <UcCard title="Hand-offs" pad={12}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <UcBtn small kind="ghost" onClick={() => siteWalk(sel)}>Schedule site walk</UcBtn>
          <UcBtn small kind="ghost" onClick={() => toCustomer(sel)}>Create customer</UcBtn>
          {sel.proposalId && <UcBtn small kind="ghost" onClick={() => { window.__sellOpenProposal = sel.proposalId; window.__shieldNav && window.__shieldNav('proposals'); }}>Open {sel.proposalId}</UcBtn>}
          <UcBtn small kind="danger" onClick={() => removeOpp(sel)}>Delete</UcBtn>
        </div>
      </UcCard>
    </UcDrawer>
  );

  const body = tab === 'autobid' ? (window.AutoBidScreen ? <AutoBidScreen /> : <UcEmpty title="Auto-Bid is not loaded" />)
    : tab === 'leads' ? (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>Leads the AI agent matched to your win profile. Accept to start the guided bid; pass to teach it.</div>
          <UcBtn small kind="ghost" style={{ marginLeft: 'auto' }} onClick={() => { if (typeof brFetchRemoteLeads === 'function') brFetchRemoteLeads(); shieldToast(window.__shieldSupabase ? 'Checking the lead feed…' : 'Connect the backend to receive AI leads'); }}>Refresh feed</UcBtn>
        </div>
        {leads.length ? <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>{leads.map(l => <SellLeadCard key={l.id} l={l} onAccept={() => { brSetLead(l.id, 'accepted'); shieldToast(`${l.buyer} added to Qualify`, 'ok'); }} onDismiss={() => { brSetLead(l.id, 'dismissed'); shieldToast('Passed — the agent deprioritizes this pattern'); }} />)}</div>
          : <UcEmpty title="No new leads" body="The overnight lead scan posts matches here. Until the backend is connected, add opportunities yourself with “New opportunity”." cta="New opportunity" onCta={() => setForm('new')} />}
      </div>)
    : tab === 'list' ? (
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={listCols} rows={opps} selectedId={selId} onRow={r => setSelId(r.id)} empty={<UcEmpty title="No opportunities yet" body="Every bid you pursue lives here — add the first one and the guided bid room builds the scope, BOM, pricing and proposal around it." cta="New opportunity" onCta={() => setForm('new')} />} /></div></UcCard>)
    : (
      opps.length ? <div style={{ display: 'flex', gap: 10, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 6 }}>
        {cols.map(c => (
          <div key={c.id} style={{ width: isMobile ? 240 : 250, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 8px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.id === 'won' ? 'var(--status-ok)' : c.id === 'lost' ? 'var(--text-low)' : c.id === 'submitted' ? 'var(--accent-2)' : 'var(--brand)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{c.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-low)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{byCol[c.id].length} · {swK(sum(byCol[c.id]))}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 70, padding: 6, borderRadius: 8, background: 'var(--brand-tint-05)', border: '1px dashed var(--border-subtle)' }}>
              {byCol[c.id].map(o => <SellBidCard key={o.id} o={o} selected={selId === o.id} onOpen={x => setSelId(x.id)} />)}
              {!byCol[c.id].length && <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center', padding: '14px 6px' }}>Nothing in {c.label.toLowerCase()}</div>}
            </div>
          </div>
        ))}
      </div>
      : <UcEmpty title="The board is empty" body="Add an opportunity to start a guided bid: ShieldTech AI drafts the scope, BOM, three-tier pricing and the customer proposal, and you review each phase." cta="New opportunity" onCta={() => setForm('new')} />
    );

  return (
    <div data-screen-label="Bid Board" style={{ display: 'flex', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Bid Board</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{inFlight.length} in flight · {swK(sum(inFlight))} · win rate {winRate}</div></div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <UcSearch value={q} onChange={setQ} placeholder="Search bids" />
              <UcBtn onClick={() => setForm('new')}>+ New opportunity</UcBtn>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <UcTile label="In flight" value={inFlight.length} sub={swK(sum(inFlight)) + ' on the board'} />
            <UcTile label="Due this week" value={dueSoon.length} sub={dueSoon.length ? swK(sum(dueSoon)) + ' at risk' : 'clear runway'} tone={dueSoon.length > 2 ? 'warn' : undefined} />
            <UcTile label="Sent out" value={byCol.submitted.length} sub={swK(sum(byCol.submitted)) + ' pending award'} />
            <UcTile label="Won" value={won.length} sub={won.length ? swK(sum(won)) + ' to operations' : 'awaiting awards'} tone={won.length ? 'ok' : undefined} />
            <UcTile label="AI leads" value={leads.length} sub={leads.length ? 'waiting for a decision' : 'none pending'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <UcTabs tabs={SELL_SUBS.map(s => ({ ...s, count: s.id === 'leads' && leads.length ? leads.length : undefined }))} value={tab} onChange={setTab} />
            {(tab === 'board' || tab === 'list') && <div style={{ marginBottom: 14 }}><UcChips options={[{ id: 'all', l: 'All systems' }, ...SELL_TRADES.filter(t => ((window.SW && window.SW.OPPS) || []).some(o => (o.trades || []).includes(t))).map(t => ({ id: t, l: t }))]} value={trade} onChange={setTrade} /></div>}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 16px' }}>{body}</div>
      </div>
      {!isMobile && drawer}
      {isMobile && sel && <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'var(--card)', display: 'flex' }}>{drawer}</div>}
      {form && <SellOppForm initial={form === 'new' ? null : form} onSave={saveOpp} onClose={() => setForm(null)} />}
      {roomId && window.BidRoom && <BidRoom oppId={roomId} onClose={() => setRoomId(null)} />}
      {window.BidToastHost && <BidToastHost />}
    </div>
  );
}

/* ── Proposals screen ── */
const PROP_TEMPLATES = ['Security System Proposal', 'Video Surveillance Proposal', 'Access Control Proposal', 'Intrusion Alarm Proposal', 'Fire Alarm Proposal', 'Structured Cabling Proposal', 'Intercom & AV Proposal', 'Network Proposal'];
const PROP_TOOLS = [
  { id: 'poe', l: 'PoE budget', C: 'PoECalculatorView' }, { id: 'survey', l: 'Site survey', C: 'SiteSurveyTool' }, { id: 'cable', l: 'Cable calc', C: 'CableCalculator' },
  { id: 'bandwidth', l: 'Bandwidth', C: 'BandwidthCalculator' }, { id: 'labor', l: 'Labor estimate', C: 'LaborEstimator' }, { id: 'compare', l: 'Competitive', C: 'CompetitiveComparison' }, { id: 'rmr', l: 'RMR', C: 'RMRCalculator' },
];
const PROP_SUBS = [{ id: 'all', label: 'Proposals' }, { id: 'tools', label: 'Calculators' }];
function sellNewProposal(v) {
  const customer = (v.customerSel && v.customerSel !== 'Other / new customer' ? v.customerSel : v.customerOther || '').trim() || 'New Client';
  const title = v.title || PROP_TEMPLATES[0];
  const blocks = defaultProposalBlocks(customer, title);
  const pricing = blocks.find(b => b.type === 'pricing'); if (pricing) pricing.content.items = [];
  const cover = blocks.find(b => b.type === 'cover'); if (cover) cover.content.date = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const rec = { id: nextProposalId(), customer, title, status: 'draft', created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), viewed: false, viewTime: '—', blocks: v.start === 'Blank proposal' ? blocks.filter(b => ['cover', 'pricing', 'signature'].includes(b.type)) : blocks };
  proposalStore.set(prev => [rec, ...(prev || [])]);
  return rec;
}
function SellProposalsScreen() {
  const [all] = useShieldStore(proposalStore);
  const isMobile = useIsMobile(820);
  const subInit = window.__navSub && window.__navSub.screen === 'proposals' ? window.__navSub.sub : null;
  const [tab, setTab] = React.useState(PROP_SUBS.some(s => s.id === subInit) ? subInit : 'all');
  React.useEffect(() => { const h = (e) => { if (e.detail.screen === 'proposals' && e.detail.source !== 'screen' && e.detail.sub && PROP_SUBS.some(s => s.id === e.detail.sub)) setTab(e.detail.sub); }; window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, []);
  React.useEffect(() => { if (window.navSubSet && (!window.__navSub || window.__navSub.screen !== 'proposals' || window.__navSub.sub !== tab)) window.navSubSet('proposals', tab, 'screen'); }, [tab]);
  const [tool, setTool] = React.useState('poe');
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [selId, setSelId] = React.useState(null);
  const [builderId, setBuilderId] = React.useState(() => { const id = window.__sellOpenProposal; window.__sellOpenProposal = null; return id || null; });
  const [previewMode, setPreviewMode] = React.useState(false);

  const proposals = (all || []).map(p => ({ ...p, value: proposalValue(p.blocks), st: p.status || 'draft' }));
  const shown = proposals.filter(p => (status === 'all' || p.st === status) && docSearchMatch(q, p.id, p.customer, p.title, p.value, p.st));
  const sel = selId ? proposals.find(p => p.id === selId) : null;
  const open = proposals.filter(p => p.st === 'sent'), accepted = proposals.filter(p => p.st === 'accepted'), declined = proposals.filter(p => p.st === 'declined');
  const winRate = accepted.length + declined.length ? Math.round(accepted.length / (accepted.length + declined.length) * 100) + '%' : '—';
  const sum = (l) => l.reduce((s, p) => s + p.value, 0);
  const patch = (id, f) => proposalStore.set(prev => (prev || []).map(x => x.id === id ? { ...x, ...f } : x));

  const newProposal = () => {
    const names = shieldCustomerNames();
    shieldModal({
      kind: 'form', title: 'New proposal', subtitle: 'Opens in the block builder; synced to mobile as you edit.', submitLabel: 'Create', successMsg: 'Proposal created',
      fields: [
        { key: 'customerSel', label: 'Customer', type: 'select', options: [...names, 'Other / new customer'] },
        { key: 'customerOther', label: 'New customer name', placeholder: 'If not in the list' },
        { key: 'title', label: 'Proposal type', type: 'select', options: PROP_TEMPLATES },
        { key: 'start', label: 'Start from', type: 'select', options: ['Standard template', 'Blank proposal'] },
      ],
      onSubmit: (v) => { const rec = sellNewProposal(v); setBuilderId(rec.id); },
    });
  };
  const send = (p) => shieldModal({
    kind: 'form', title: `Send ${p.id}`, subtitle: `${p.customer} · ${sellMoney(p.value)} — emails a live accept-and-sign link`, submitLabel: 'Send', successMsg: 'Sent',
    fields: [{ key: 'email', label: 'Customer email', type: 'email', required: true, full: true, value: ((customerStore.get() || []).find(c => (c.name || c.customer) === p.customer) || {}).email || '' }],
    onSubmit: (v) => {
      const doc = proposalToDoc(p);
      patch(p.id, { status: 'sent', sentAt: Date.now(), sentTo: v.email });
      const api = window.__shieldAcceptance;
      if (api) api.send({ estimateRef: doc.doc_number, estimateQboId: null, customerName: p.customer, customerEmail: v.email.trim(), amount: p.value })
        .then(r => shieldToast(r && r.ok ? (r.data.emailed ? `Sent to ${v.email.trim()} with a live accept link` : `Accept link created (email not sent: ${r.data.emailError})`) : `Could not create accept link: ${(r && r.error) || 'unknown error'}`));
      else shieldToast(`${p.id} marked sent — it is in the pipeline`, 'ok');
    },
  });
  const accept = (p) => { const doc = proposalToDoc(p); const proj = acceptEstimateToProject(doc, 'manual'); patch(p.id, { status: 'accepted', acceptedAt: Date.now() }); shieldToast(`${p.id} accepted — project ${proj.number} created`, 'ok'); };
  const decline = (p) => shieldModal({ kind: 'form', title: `Mark ${p.id} declined`, submitLabel: 'Mark declined', successMsg: 'Updated', fields: [{ key: 'why', label: 'Reason', full: true, placeholder: 'Price, timing, competitor…' }], onSubmit: (v) => patch(p.id, { status: 'declined', declinedAt: Date.now(), declineReason: v.why || '' }) });
  const duplicate = (p) => { const id = nextProposalId(); const rec = { ...p, id, status: 'draft', created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sentAt: null, acceptedAt: null, blocks: JSON.parse(JSON.stringify(p.blocks || [])) }; delete rec.value; delete rec.st; proposalStore.set(prev => [rec, ...(prev || [])]); setSelId(id); shieldToast(`${id} duplicated from ${p.id}`, 'ok'); };
  const pdf = (p) => {
    if (!window.__shieldPdf) { shieldToast('PDF export unavailable'); return; }
    const blocks = p.blocks || [];
    const sections = blocks.filter(b => ['intro', 'about', 'text', 'terms'].includes(b.type) && b.content && b.content.text).map(b => ({ title: b.title || b.type, body: b.content.text }));
    const scope = blocks.find(b => b.type === 'scope'); if (scope && (scope.content.items || []).length) sections.push({ title: 'Scope of Work', body: scope.content.items.map(i => '• ' + i).join('\n') });
    const pricing = blocks.find(b => b.type === 'pricing');
    window.__shieldPdf.exportDoc({ kind: 'proposal', number: p.id, customer: p.customer, date: new Date().toLocaleDateString(), sections: sections.length ? sections : [{ title: p.title, body: '' }], lineItems: pricing ? (pricing.content.items || []) : [], total: p.value });
  };
  const remove = (p) => shieldModal({ kind: 'confirm', danger: true, title: `Delete ${p.id}?`, message: 'Removed from every device. The sent doc in Finance, if any, stays.', confirmLabel: 'Delete', successMsg: 'Deleted', onConfirm: () => { proposalStore.set(prev => (prev || []).filter(x => x.id !== p.id)); setSelId(null); } });

  if (builderId && window.ProposalBuilderView) {
    return <div data-screen-label="Proposal builder"><ProposalBuilderView proposalId={builderId} onBack={() => { setBuilderId(null); setPreviewMode(false); }} previewMode={previewMode} setPreviewMode={setPreviewMode} /></div>;
  }

  const stCol = { draft: 'var(--text-low)', sent: 'var(--accent-2)', accepted: 'var(--status-ok)', declined: 'var(--status-critical)' };
  const StCell = ({ s }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: stCol[s] || 'var(--text-low)' }} />{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  const cols = [
    { k: 'id', l: 'Proposal', w: 100, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.id}</span> },
    { k: 'customer', l: 'Customer', render: r => <span><span style={{ fontWeight: 600 }}>{r.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.title}</span></span> },
    { k: 'value', l: 'Value', right: true, render: r => sellMoney(r.value) },
    { k: 'st', l: 'Status', render: r => <StCell s={r.st} /> },
    { k: 'created', l: 'Created', dim: true },
    { k: 'sentTo', l: 'Sent to', dim: true, render: r => r.sentTo || (r.sentAt ? 'link' : '—') },
  ];
  const drawer = sel && (
    <UcDrawer title={sel.id} sub={`${sel.customer} · ${sel.title}`} onClose={() => setSelId(null)} width={isMobile ? '100%' : 380}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcBtn small onClick={() => setBuilderId(sel.id)}>Open builder</UcBtn>
        <UcBtn small kind="soft" onClick={() => { setBuilderId(sel.id); setPreviewMode(true); }}>Preview as client</UcBtn>
        {sel.st !== 'accepted' && <UcBtn small kind="soft" onClick={() => send(sel)}>{sel.st === 'sent' ? 'Resend' : 'Send'}</UcBtn>}
      </div>
      <UcCard title="Summary" pad={12} style={{ marginBottom: 12 }}>
        <UcProp k="Status" v={<StCell s={sel.st} />} />
        <UcProp k="Value" v={sellMoney(sel.value)} />
        <UcProp k="Line items" v={String((((sel.blocks || []).find(b => b.type === 'pricing') || { content: {} }).content.items || []).length)} />
        <UcProp k="Sections" v={String((sel.blocks || []).length)} />
        <UcProp k="Created" v={sel.created} />
        <UcProp k="Sent" v={sel.sentAt ? new Date(sel.sentAt).toLocaleDateString() + (sel.sentTo ? ` · ${sel.sentTo}` : '') : '—'} />
        <UcProp k="From bid" v={sel.oppId || '—'} />
        {sel.declineReason && <UcProp k="Declined" v={sel.declineReason} />}
      </UcCard>
      <UcCard title="Outcome" pad={12} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sel.st !== 'accepted' && <UcBtn small onClick={() => accept(sel)}>Accept → Project</UcBtn>}
          {sel.st !== 'accepted' && sel.st !== 'declined' && <UcBtn small kind="ghost" onClick={() => decline(sel)}>Mark declined</UcBtn>}
          {sel.st === 'accepted' && <UcBtn small kind="ghost" onClick={() => window.__shieldNav && window.__shieldNav('projects')}>Open Projects</UcBtn>}
        </div>
      </UcCard>
      <UcCard title="More" pad={12}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <UcBtn small kind="ghost" onClick={() => pdf(sel)}>Download PDF</UcBtn>
          <UcBtn small kind="ghost" onClick={() => duplicate(sel)}>Duplicate</UcBtn>
          <UcBtn small kind="danger" onClick={() => remove(sel)}>Delete</UcBtn>
        </div>
      </UcCard>
    </UcDrawer>
  );
  const ToolC = window[(PROP_TOOLS.find(t => t.id === tool) || {}).C];

  return (
    <div data-screen-label="Proposals" style={{ display: 'flex', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Proposals</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{open.length} open · {swK(sum(open))} out for signature · win rate {winRate}</div></div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {tab === 'all' && <UcSearch value={q} onChange={setQ} placeholder="Search proposals" />}
              <UcBtn kind="ghost" onClick={() => window.__shieldNav && window.__shieldNav('studio')}>Design Studio</UcBtn>
              <UcBtn onClick={newProposal}>+ New proposal</UcBtn>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <UcTile label="Open" value={open.length} sub={swK(sum(open)) + ' awaiting a decision'} />
            <UcTile label="Drafts" value={proposals.filter(p => p.st === 'draft').length} sub="not sent yet" />
            <UcTile label="Accepted" value={accepted.length} sub={swK(sum(accepted)) + ' won'} tone={accepted.length ? 'ok' : undefined} />
            <UcTile label="Win rate" value={winRate} sub={`${accepted.length} of ${accepted.length + declined.length} decided`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <UcTabs tabs={PROP_SUBS.map(s => ({ ...s, count: s.id === 'all' ? proposals.length : undefined }))} value={tab} onChange={setTab} />
            <div style={{ marginBottom: 14 }}>{tab === 'all'
              ? <UcChips options={[{ id: 'all', l: 'All' }, { id: 'draft', l: 'Draft', n: proposals.filter(p => p.st === 'draft').length }, { id: 'sent', l: 'Sent', n: open.length }, { id: 'accepted', l: 'Accepted', n: accepted.length }, { id: 'declined', l: 'Declined', n: declined.length }]} value={status} onChange={setStatus} />
              : <UcChips options={PROP_TOOLS.map(t => ({ id: t.id, l: t.l }))} value={tool} onChange={setTool} />}</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 16px' }}>
          {tab === 'tools' ? (ToolC ? <ToolC /> : <UcEmpty title="Calculator not loaded" />)
            : <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={shown} selectedId={selId} onRow={r => setSelId(r.id)} empty={<UcEmpty title={q || status !== 'all' ? 'No proposals match' : 'No proposals yet'} body={q || status !== 'all' ? 'Clear the search or status filter.' : 'Create one here, draft one from a bid on the Bid Board, or export a Design Studio BOM — they all land in this list and sync to mobile.'} cta={q || status !== 'all' ? undefined : '+ New proposal'} onCta={newProposal} />} /></div></UcCard>}
        </div>
      </div>
      {!isMobile && tab === 'all' && drawer}
      {isMobile && tab === 'all' && sel && <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'var(--card)', display: 'flex' }}>{drawer}</div>}
    </div>
  );
}

Object.assign(window, { oppStore, SellBoardScreen, SellProposalsScreen, SellOppForm, sellOppToProposal, sellEnsureCustomer, sellNewProposal, SELL_TRADES, SELL_TRADE_COLOR });

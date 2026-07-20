// ============================================================
// ShieldTech — Leads engine data model (V3)
// Phases: Qualify → Scope (AI) → BOM → Pricing (3-tier) →
// Proposal → Submit. AI pre-generates scope, drawings markup,
// device counts, BOM, and the customer-facing proposal.
// ============================================================

const BR_PHASES = [
  { id: 'qualify', label: 'Qualify', icon: 'target', blurb: 'Verify the source is real, score the pursuit, and make the go / no-go call.' },
  { id: 'scope', label: 'Scope', icon: 'doc', blurb: 'SHIELDTECH AI already wrote the scope and marked every device on the drawings. Review the markups against the clean sheets and approve each trade.' },
  { id: 'bom', label: 'BOM', icon: 'list', blurb: 'The bill of materials is built from the approved scope — verify every line: part, quantity, unit cost.' },
  { id: 'pricing', label: 'Pricing', icon: 'dollar', blurb: 'Internal numbers first, then pick a tier — Low, Medium, or Aggressive — based on the field.' },
  { id: 'proposal', label: 'Proposal', icon: 'send', blurb: 'The customer-facing proposal is assembled from your selections. Review it exactly as the buyer will see it.' },
  { id: 'submit', label: 'Submit', icon: 'checkCircle', blurb: 'Final compliance gate. Everything green, then submit before the clock runs out.' },
];

/* ─────────── Persisted per-bid state ─────────── */
function brDefaultState() {
  return {
    verified: { source: false, buyer: false, due: false },
    scorecard: {},                  // critId -> 1..5
    decision: null,                 // 'go' | 'nogo'
    scopeApproved: {},              // trade -> true
    docsReviewed: { rfp: false, drawings: false },
    flagState: {},                  // flagId -> { status:'open'|'resolved'|'rfi', resolution }
    userFlags: [],
    scope: {},                      // rowId (ambiguities) -> 'include'|'exclude'|'clarify'
    rfis: [],
    qty: {},                        // rowId -> qty override
    bom: {},                        // bomLineId -> true (verified)
    tier: null,                     // 'low' | 'medium' | 'aggressive'
    phaseOverride: null,            // manual column placement from the board gear menu
    estimator: null,                // null | 'ok'  (numbers check sign-off)
    award: null,                    // { result:'won'|'lost', reason }
    decisions: {},                  // decisionId -> 'approved' | 'vetoed'
    marginPct: 18,                  // legacy fallback
    estimateLocked: false,
    proposal: {},                   // checkId -> bool
    coverLetter: null,              // customer proposal approved (truthy)
    submitted: null,
  };
}
function brLoad(oppId) {
  try {
    const raw = localStorage.getItem('sw:bidroom:' + oppId);
    return raw ? { ...brDefaultState(), ...JSON.parse(raw) } : brDefaultState();
  } catch { return brDefaultState(); }
}
function brSave(oppId, state) {
  try { localStorage.setItem('sw:bidroom:' + oppId, JSON.stringify(state)); } catch {}
  window.dispatchEvent(new CustomEvent('sw:bidroom'));
}
function useBidState(oppId) {
  const [s, setS] = React.useState(() => brLoad(oppId));
  React.useEffect(() => { setS(brLoad(oppId)); }, [oppId]);
  const update = (patch) => setS(prev => {
    const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
    brSave(oppId, next);
    return next;
  });
  return [s, update];
}
function brUseAll() {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const on = () => setV(x => x + 1);
    window.addEventListener('sw:bidroom', on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener('sw:bidroom', on); window.removeEventListener('storage', on); };
  }, []);
  return v;
}

function brHash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

/* [item, unit, _, unit material cost, labor hrs/unit, csi] */
const BR_ITEM_TPL = {
  'CCTV': [
    ['Fixed IP dome camera, 5MP, vandal-rated', 'ea', 0, 610, 2.5, '28 23 00'],
    ['Exterior bullet camera w/ IR', 'ea', 0, 890, 3.0, '28 23 00'],
    ['VMS server / NVR node, 96TB', 'ea', 0, 5200, 8.0, '28 23 29'],
  ],
  'Access': [
    ['Card-reader door: reader, controller I/O, strike', 'door', 0, 1180, 6.0, '28 13 00'],
    ['Access control panel, 8-door, PoE', 'ea', 0, 2950, 10.0, '28 13 16'],
  ],
  'Access (PACS)': [
    ['PACS reader door, FICAM-listed', 'door', 0, 1650, 7.0, '28 13 00'],
    ['PACS head-end panel, certified', 'ea', 0, 4400, 12.0, '28 13 16'],
  ],
  'Intrusion': [
    ['Door/window contact + motion zone', 'zone', 0, 145, 1.2, '28 16 00'],
    ['Intrusion panel w/ cellular communicator', 'ea', 0, 980, 6.0, '28 16 00'],
  ],
  'Cabling': [
    ['Cat6A horizontal drop, terminated + tested', 'drop', 0, 92, 1.6, '27 15 00'],
    ['Equipment rack w/ patch panels + PDU', 'ea', 0, 2400, 9.0, '27 11 00'],
  ],
  'Fiber': [
    ['OS2 single-mode backbone run, spliced + tested', 'strand', 0, 210, 2.2, '27 13 23'],
    ['Fiber distribution enclosure, 48-port', 'ea', 0, 1350, 5.0, '27 13 23'],
  ],
  'Network': [
    ['PoE++ access switch, 48-port', 'ea', 0, 3400, 3.0, '27 21 00'],
    ['Wireless AP, indoor', 'ea', 0, 420, 1.4, '27 21 33'],
  ],
  'Intercom': [
    ['IP intercom / call station', 'ea', 0, 640, 2.4, '27 51 23'],
    ['Intercom master console', 'ea', 0, 3100, 6.0, '27 51 23'],
  ],
  'Paging': [
    ['Speaker zone: horns + line-match', 'zone', 0, 380, 3.2, '27 51 16'],
    ['Paging amplifier rack', 'ea', 0, 2800, 7.0, '27 51 16'],
  ],
  'Div 28': [['Div 28 system commissioning + closeout docs', 'ls', 0, 4800, 40.0, '28 08 00']],
  'Div 27': [['Div 27 testing, labeling + as-builts', 'ls', 0, 3600, 32.0, '27 08 00']],
  'Nurse call': [['Nurse-call station + dome light', 'ea', 0, 720, 3.0, '27 52 23']],
  'Fire': [
    ['Addressable initiating device, tied to existing FACP', 'ea', 0, 185, 1.6, '28 46 21'],
    ['Notification appliance circuit extension', 'ea', 0, 260, 2.2, '28 46 21'],
  ],
  '_generic': [['Security system device, furnished + installed', 'ea', 0, 480, 2.4, '28 05 00']],
};
const BR_TRADE_SYMBOL = { 'CCTV': 'cam', 'Access': 'door', 'Access (PACS)': 'door', 'Intrusion': 'zone', 'Cabling': 'drop', 'Fiber': 'drop', 'Network': 'net', 'Intercom': 'spk', 'Paging': 'spk', 'Nurse call': 'spk', 'Fire': 'zone', 'Div 28': 'net', 'Div 27': 'net' };
const BR_DEVICE_TAG = { 'CCTV': 'C', 'Access': 'AC', 'Access (PACS)': 'AC', 'Intrusion': 'IZ', 'Cabling': 'D', 'Fiber': 'F', 'Network': 'N', 'Intercom': 'IC', 'Paging': 'SP', 'Nurse call': 'NC', 'Fire': 'FA' };

/* Spec rows — the single source for scope, drawings, BOM, estimate */
function brSpecRows(opp) {
  const h = brHash(opp.id);
  const items = [];
  opp.trades.forEach((trade, ti) => {
    const tpl = BR_ITEM_TPL[trade] || BR_ITEM_TPL['_generic'];
    tpl.forEach(([item, unit, _pu, cost, hrs, csi], ii) => {
      items.push({ id: `${opp.id}-r${ti}${ii}`, trade, item, unit, csi, cost, hrs, sheet: `SE-10${ti + 1}` });
    });
  });
  const rev = (it) => (it.cost + it.hrs * BR_LABOR_RATE) * 1.18;
  const lsRev = items.filter(i => i.unit === 'ls').reduce((a, i) => a + rev(i), 0);
  const countables = items.filter(i => i.unit !== 'ls');
  const remaining = Math.max(opp.value - lsRev, opp.value * 0.4);
  const rows = items.map(it => {
    const qty = it.unit === 'ls' ? 1 : Math.min(400, Math.max(1, Math.round((remaining / Math.max(countables.length, 1)) / rev(it))));
    return { ...it, rfpQty: qty, drawingQty: qty };
  });
  const big = rows.filter(r => r.unit !== 'ls' && r.rfpQty >= 4);
  if (big.length) {
    const a = big[h % big.length];
    a.drawingQty = a.rfpQty - (1 + (h % 3) + Math.round(a.rfpQty * 0.04));
    if (big.length > 2) {
      const b = big[(h >>> 3) % big.length];
      if (b !== a) b.drawingQty = b.rfpQty + 2 + ((h >>> 5) % 3);
    }
  }
  return rows;
}

function brQty(r, s) {
  if (s.qty[r.id] != null) return s.qty[r.id];
  const fl = s.flagState['fl-' + r.id];
  return fl && fl.resolution === 'drawing' ? r.drawingQty : r.rfpQty;
}

/* Ambiguities — always need a human call */
function brAmbiguities(opp) {
  const base = [
    { id: opp.id + '-x1', trade: 'General', item: 'Conduit, boxes & pathways', note: 'Drawings do not assign pathway ownership. Typically by EC — excluding without a note is a change-order fight later.', suggest: 'clarify' },
    { id: opp.id + '-x2', trade: 'General', item: 'Head-end room build-out (backboard, power, ground)', note: 'RFP §1.4 says "contractor provides complete system" but no head-end detail sheet exists.', suggest: 'clarify' },
    { id: opp.id + '-x3', trade: 'General', item: 'Owner training & closeout documentation', note: 'Explicitly required in the submission checklist — include, it is cheap and scored.', suggest: 'include' },
  ];
  if (opp.siteWalk) base.push({ id: opp.id + '-x4', trade: 'General', item: 'Off-hours / occupied-building labor premium', note: 'Occupied facility with a walk scheduled — confirm working hours before pricing straight time.', suggest: 'clarify' });
  return base;
}

/* AI-detected RFP vs drawing conflicts */
function brFlags(opp) {
  return brSpecRows(opp).filter(r => r.drawingQty !== r.rfpQty).map(r => ({
    id: 'fl-' + r.id, rowId: r.id,
    note: `RFP schedule calls for ${r.rfpQty} ${r.unit} of "${r.item}" (§${r.csi}) but sheet ${r.sheet} shows ${r.drawingQty}.`,
    delta: r.drawingQty - r.rfpQty,
  }));
}

/* Device counts by trade (AI-generated, shown on Scope) */
function brDeviceCounts(opp, s) {
  const rows = brSpecRows(opp);
  return opp.trades.map((trade, ti) => {
    const list = rows.filter(r => r.trade === trade);
    const devices = list.filter(r => r.unit !== 'ls').reduce((a, r) => a + brQty(r, s || brDefaultState()), 0);
    return { trade, devices, lines: list.length, sheet: `SE-10${ti + 1}`, tag: BR_DEVICE_TAG[trade] || 'X' };
  });
}

/* AI scope-of-work narrative per trade */
function brScopeText(opp, trade, s) {
  const rows = brSpecRows(opp).filter(r => r.trade === trade);
  const parts = rows.map(r => `${brQty(r, s || brDefaultState())} ${r.unit !== 'ls' ? r.unit + ' — ' : ''}${r.item.toLowerCase()}`);
  return `Furnish, install, program, and commission the complete ${trade.toLowerCase()} system shown on sheet SE-10${opp.trades.indexOf(trade) + 1}: ${parts.join('; ')}. Work includes device termination, head-end integration, point-to-point testing, labeling, and record documentation.`;
}

/* ─────────── Bill of Materials (AI-built) ─────────── */
const BR_BOM_META = {
  'CCTV': { mfr: 'Axis Communications', pre: 'AX', acc: 'Mount kit + VMS camera license' },
  'Access': { mfr: 'LenelS2 / HID', pre: 'LNL', acc: 'Door kit — DPS, REX, strike hardware' },
  'Access (PACS)': { mfr: 'LenelS2 (FICAM)', pre: 'LNL', acc: 'PACS certificate reader kit' },
  'Intrusion': { mfr: 'Bosch Security', pre: 'B', acc: 'Zone wiring + EOL resistor kit' },
  'Cabling': { mfr: 'Belden / Panduit', pre: 'BLD', acc: 'Patch cords, labels, J-hooks' },
  'Fiber': { mfr: 'Corning', pre: 'COR', acc: 'Splice trays + pigtails' },
  'Network': { mfr: 'Cisco', pre: 'C9K', acc: 'SFP modules + licensing' },
  'Intercom': { mfr: 'Aiphone', pre: 'AIP', acc: 'Backbox + power share' },
  'Paging': { mfr: 'Bogen', pre: 'BG', acc: 'Speaker wiring + volume controls' },
  'Nurse call': { mfr: 'Rauland', pre: 'RA', acc: 'Station wiring kit' },
  'Fire': { mfr: 'Notifier', pre: 'NF', acc: 'Monitor module + wiring kit' },
  'Div 28': { mfr: 'ShieldTech', pre: 'ST', acc: 'Commissioning consumables' },
  'Div 27': { mfr: 'ShieldTech', pre: 'ST', acc: 'Test & label consumables' },
  '_generic': { mfr: 'Various', pre: 'GEN', acc: 'Install kit' },
};
function brBOM(opp, s) {
  const st = s || brDefaultState();
  const rows = brSpecRows(opp).filter(r => st.scope[r.id] !== 'exclude');
  const lines = [];
  rows.forEach(r => {
    const meta = BR_BOM_META[r.trade] || BR_BOM_META['_generic'];
    const qty = brQty(r, st);
    const h = brHash(r.id);
    lines.push({ id: 'bm-' + r.id, rowId: r.id, trade: r.trade, mfr: meta.mfr, part: `${meta.pre}-${1000 + (h % 8000)}`, desc: r.item, qty, unit: r.unit, unitCost: Math.round(r.cost * 0.78), kind: 'device' });
    lines.push({ id: 'ba-' + r.id, rowId: r.id, trade: r.trade, mfr: meta.mfr, part: `${meta.pre}-${1000 + ((h >>> 4) % 8000)}-K`, desc: meta.acc, qty, unit: r.unit === 'ls' ? 'ls' : 'kit', unitCost: Math.round(r.cost * 0.22), kind: 'acc' });
  });
  return lines.map(l => ({ ...l, ext: l.qty * l.unitCost }));
}

/* ─────────── Pricing tiers ─────────── */
const BR_TIERS = [
  { id: 'low', label: 'Low', margin: 10, tag: 'Price to win', winP: 62, note: 'Leanest defensible number. Use when the field is crowded or an incumbent is bidding.' },
  { id: 'medium', label: 'Medium', margin: 18, tag: 'Balanced', winP: 45, note: 'Your standard book margin. Competitive without leaving money on the table.' },
  { id: 'aggressive', label: 'Aggressive', margin: 26, tag: 'Margin-rich', winP: 28, note: 'Take it when the field is thin, the scope is specialized, or you can afford to lose.' },
];

/* ─────────── Generated RFP document ─────────── */
function brRFP(opp) {
  const h = brHash(opp.id);
  const num = `RFP-${String(2600 + (h % 380))}-${opp.state}`;
  const rows = brSpecRows(opp);
  const due = new Date(opp.dueAt);
  const dueStr = due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) + ' at ' + due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' local';
  return {
    number: num, issued: 'June 8, 2026', title: opp.title, buyer: opp.buyer,
    sections: [
      { id: 's1', ref: '§ 1.0', title: 'Notice & Instructions to Bidders', paras: [
        `${opp.buyer} ("Owner") invites sealed bids for the ${opp.title} project. Bids are due ${dueStr}. Late bids will not be opened.`,
        opp.siteWalk ? `A pre-bid site walk is scheduled for ${new Date(opp.siteWalk).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}.` : 'No pre-bid site walk is scheduled. Bidders may request site access through the procurement contact.',
        'All questions must be submitted in writing through the procurement portal no later than five (5) business days before the bid due date. Verbal answers are not binding.',
      ]},
      { id: 's2', ref: '§ 1.4', title: 'Scope of Work — General', paras: [
        `The Contractor shall furnish and install a complete and operational system including all ${opp.trades.join(', ').toLowerCase()} work shown on the drawings and specified herein, including programming, testing, commissioning, owner training, and closeout documentation.`,
        'Quantities in the schedules below govern for bidding purposes. Where drawings and specifications conflict, the bidder shall request clarification in writing prior to bid; otherwise the greater quantity and higher quality shall be assumed.',
      ], specRows: rows },
      { id: 's3', ref: '§ 2.1', title: 'Submission Requirements', paras: [
        'Bids shall include: completed bid form, acknowledgement of all addenda, bid security in the amount of ten percent (10%), three (3) references for projects of similar scope completed within five years, W-9, and certificate of insurance naming the Owner as additional insured.',
        'Bidders shall list any exceptions or clarifications on the Exceptions Form. Unlisted exceptions are deemed waived.',
      ]},
    ],
  };
}

function brSheets(opp) {
  const rows = brSpecRows(opp);
  return opp.trades.map((trade, i) => ({
    id: `SE-10${i + 1}`, trade,
    title: `${trade} — Device Plan & Schedule`,
    rows: rows.filter(r => r.sheet === `SE-10${i + 1}`),
  }));
}

function brChecklist(opp) {
  return [
    { id: 'form', label: 'Bid form completed & signed' },
    { id: 'addenda', label: 'All addenda acknowledged', hint: opp.docs && opp.docs.addenda === 'portal' ? 'Addenda live on the buyer portal — pull the latest before signing.' : null },
    { id: 'bond', label: 'Bid security / bond (10%)' },
    { id: 'refs', label: '3 references, similar scope, last 5 yrs' },
    { id: 'w9coi', label: 'W-9 + COI (Owner as additional insured)' },
    { id: 'pricing', label: 'Pricing schedule attached (selected tier)' },
    { id: 'exceptions', label: 'Exceptions form — exclusions & RFIs listed' },
  ];
}

/* ─────────── Phase completion model ─────────── */
function brPhaseParts(opp, s) {
  const flags = brFlags(opp);
  const allFlags = [...flags.map(f => f.id), ...(s.userFlags || []).map(f => f.id)];
  const flagsDone = allFlags.filter(id => s.flagState[id] && s.flagState[id].status !== 'open').length;
  const ambs = brAmbiguities(opp);
  const ambsDone = ambs.filter(a => s.scope[a.id]).length;
  const tradesDone = opp.trades.filter(t => (s.scopeApproved || {})[t]).length;
  const bomLines = brBOM(opp, s);
  const bomDone = bomLines.filter(l => (s.bom || {})[l.id]).length;
  const checks = brChecklist(opp);
  const checksDone = checks.filter(c => s.proposal[c.id]).length;
  const phases = [
    { id: 'qualify', parts: [
      { label: 'Source verified', done: s.verified.source },
      { label: 'Buyer & contact confirmed', done: s.verified.buyer },
      { label: 'Due date & walk confirmed', done: s.verified.due },
      { label: 'Scorecard filled (5 criteria)', done: window.BR_SCORECARD ? window.BR_SCORECARD.every(c => (s.scorecard || {})[c.id]) : true },
      { label: 'Go / no-go decision made', done: !!s.decision },
    ]},
    { id: 'scope', parts: [
      { label: `Trade scopes approved (${tradesDone}/${opp.trades.length})`, done: tradesDone === opp.trades.length },
      { label: 'Drawing markups reviewed', done: s.docsReviewed.drawings },
      { label: `Conflicts resolved (${flagsDone}/${allFlags.length})`, done: allFlags.length === 0 || flagsDone === allFlags.length },
      { label: `Open items dispositioned (${ambsDone}/${ambs.length})`, done: ambsDone === ambs.length },
    ]},
    { id: 'bom', parts: [
      { label: `BOM lines verified (${bomDone}/${bomLines.length})`, done: bomLines.length > 0 && bomDone === bomLines.length },
    ]},
    { id: 'pricing', parts: [
      { label: 'Tier selected', done: !!s.tier },
      { label: 'Number locked', done: s.estimateLocked },
      { label: 'Estimator sign-off', done: s.estimator === 'ok' },
    ]},
    { id: 'proposal', parts: [
      { label: `Package items (${checksDone}/${checks.length})`, done: checksDone === checks.length },
      { label: 'Customer proposal approved', done: !!s.coverLetter },
    ]},
    { id: 'submit', parts: [
      { label: 'Submitted', done: !!s.submitted },
    ]},
  ];
  return phases.map(p => {
    const doneN = p.parts.filter(x => x.done).length;
    return { ...p, ...BR_PHASES.find(b => b.id === p.id), done: doneN === p.parts.length, frac: p.parts.length ? doneN / p.parts.length : 0 };
  });
}
function brProgress(opp, s) {
  const ph = brPhaseParts(opp, s);
  return ph.reduce((a, p) => a + p.frac, 0) / ph.length;
}
function brCurrentPhase(opp, s) {
  if (s.decision === 'nogo') return 'nogo';
  if (s.submitted) return s.award ? (s.award.result === 'won' ? 'won' : 'lost') : 'submitted';
  if (s.phaseOverride && BR_PHASES.some(p => p.id === s.phaseOverride)) return s.phaseOverride;
  const ph = brPhaseParts(opp, s);
  const first = ph.find(p => !p.done);
  return first ? first.id : 'submit';
}

/* ─────────── Estimate / internal numbers ─────────── */
const BR_LABOR_RATE = 98;
function brEstimate(opp, s) {
  const included = brSpecRows(opp).filter(r => (s.scope[r.id] || 'include') !== 'exclude');
  const lines = included.map(r => {
    const qty = brQty(r, s);
    return { ...r, qty, material: qty * r.cost, laborHrs: qty * r.hrs, labor: qty * r.hrs * BR_LABOR_RATE };
  });
  const material = lines.reduce((a, l) => a + l.material, 0);
  const labor = lines.reduce((a, l) => a + l.labor, 0);
  const equip = Math.round(material * 0.03);       // lifts, tooling
  const pm = Math.round(labor * 0.08);             // PM + engineering
  const subtotal = material + labor + equip + pm;
  const tier = BR_TIERS.find(t => t.id === s.tier);
  const pct = tier ? tier.margin : (s.marginPct || 18);
  const margin = subtotal * (pct / 100);
  const total = subtotal + margin;
  return { lines, material, labor, laborHrs: lines.reduce((a, l) => a + l.laborHrs, 0), equip, pm, subtotal, marginPct: pct, margin, total, tier: tier ? tier.id : null };
}
function brTierPrice(opp, s, tierId) {
  const est = brEstimate(opp, { ...s, tier: null, marginPct: 0 });
  const t = BR_TIERS.find(x => x.id === tierId);
  return est.subtotal * (1 + t.margin / 100);
}

/* Likely competitors — deterministic war-games field */
const BR_COMPETITOR_POOL = [];
function brCompetitors(opp) {
  const h = brHash(opp.id);
  const n = 3 + (h % 3);
  const est = brEstimate(opp, brDefaultState());
  return BR_COMPETITOR_POOL.slice(0, n).map((c, i) => {
    const drift = 0.96 + (((h >>> (i * 3)) % 9)) / 100;
    const mid = est.subtotal * (1 + c.m / 100) * drift;
    return { ...c, id: 'cmp' + i, low: mid * 0.96, high: mid * 1.05, mid, incumbent: i === 1 && h % 3 === 0 };
  });
}

/* ─────────── AI lead feed ─────────── */
const BR_LEADS = [];

function brLeadState() {
  try { return JSON.parse(localStorage.getItem('sw:bidroom:leads') || '{}'); } catch { return {}; }
}
function brSetLead(id, v) {
  const st = brLeadState(); st[id] = v;
  try { localStorage.setItem('sw:bidroom:leads', JSON.stringify(st)); } catch {}
  brSyncAcceptedLeads();
  window.dispatchEvent(new CustomEvent('sw:bidroom'));
}
function brSyncAcceptedLeads() {
  const st = brLeadState();
  BR_LEADS.forEach(l => {
    const exists = window.SW.OPPS.some(o => o.id === l.id);
    if (st[l.id] === 'accepted' && !exists) window.SW.OPPS.push({ ...l, industry: 'govmuni', sourceUrl: '#' });
  });
}
brSyncAcceptedLeads();

Object.assign(window, {
  BR_PHASES, brDefaultState, brLoad, brSave, useBidState, brUseAll, brSpecRows, brQty, brAmbiguities,
  brFlags, brDeviceCounts, brScopeText, brBOM, BR_BOM_META, BR_TIERS, brTierPrice,
  brRFP, brSheets, brChecklist, brPhaseParts, brProgress, brCurrentPhase,
  brEstimate, BR_LABOR_RATE, BR_LEADS, brLeadState, brSetLead, BR_TRADE_SYMBOL, BR_DEVICE_TAG, brHash,
  brCompetitors, BR_COMPETITOR_POOL, BR_ITEM_TPL,
});

/* MONEY (outside Finance) + BlueShield — Inventory & Purchasing, Recurring
   Revenue, Revenue Ops, BlueShield Studio on the UniFi-pattern layout under the
   one unified sidebar (DvFrame / useDvSub from screen-deliver).

   Purchasing: purchase orders get real line items (add / receive per line),
   receiving puts stock into the inventory store, requisitions turn into draft
   POs. Inventory is a persisted stock list (no seeded warehouse). Recurring
   revenue: contracts are records with a start date, so the trend is computed
   from the book, never from a baked-in baseline. */

const inventoryStore = createShieldStore('inventory', []);
const mnMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();
const mnInp = { fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box', padding: '7px 9px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none' };
const MN_PO_STATUS = { draft: { l: 'Draft', c: 'var(--text-low)' }, sent: { l: 'Sent', c: 'var(--brand)' }, partial: { l: 'Partial', c: 'var(--status-warn)' }, received: { l: 'Received', c: 'var(--status-ok)' }, cancelled: { l: 'Cancelled', c: 'var(--status-critical)' } };
const MN_REQ_STAGES = [
  { id: 'requested', label: 'Requested', c: 'var(--brand)', action: 'Approve', next: 'approved' },
  { id: 'approved', label: 'Approved', c: 'var(--accent-2)', action: 'Start picking', next: 'picking' },
  { id: 'picking', label: 'Picking', c: 'var(--status-warn)', action: 'Mark shipped', next: 'shipped' },
  { id: 'shipped', label: 'Shipped', c: 'var(--brand)', action: 'Confirm delivery', next: 'delivered' },
  { id: 'delivered', label: 'Delivered', c: 'var(--status-ok)', action: null, next: null },
];
const MN_URG = { urgent: 'var(--status-critical)', normal: 'var(--status-warn)', standard: 'var(--status-warn)', low: 'var(--text-low)' };
function mnPoTotal(po) { return (po.items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unit) || 0), 0); }
function mnPoRecv(po) { return (po.items || []).reduce((s, i) => s + Math.min(Number(i.received) || 0, Number(i.qty) || 0) * (Number(i.unit) || 0), 0); }
/* Received PO lines land in stock (matched by SKU, else by description). */
function mnStockIn(items) {
  inventoryStore.set(prev => {
    const list = [...(prev || [])];
    items.forEach(it => {
      const q = Number(it.qty) || 0; if (!q) return;
      const idx = list.findIndex(x => (it.sku && x.sku === it.sku) || (!it.sku && (x.name || '').toLowerCase() === (it.desc || '').toLowerCase()));
      if (idx >= 0) list[idx] = { ...list[idx], inStock: (Number(list[idx].inStock) || 0) + q, cost: Number(it.unit) || list[idx].cost, lastReceived: Date.now() };
      else list.push({ id: 'inv-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), sku: it.sku || '', name: it.desc || 'Item', brand: '', cat: 'Uncategorized', inStock: q, committed: 0, reorder: 0, cost: Number(it.unit) || 0, location: '', lastReceived: Date.now() });
    });
    return list;
  });
}

/* ═══════════════════ INVENTORY & PURCHASING ═══════════════════ */
const MN_PUR_SUBS = [{ id: 'pos', label: 'Purchase orders' }, { id: 'req', label: 'Parts requisitions' }, { id: 'inventory', label: 'Inventory' }];
function MnPoDrawer({ po, onClose }) {
  const [, setPos] = useShieldStore(poStore);
  const [line, setLine] = React.useState({ desc: '', sku: '', qty: '1', unit: '' });
  const patch = (f) => setPos(prev => (prev || []).map(p => p.id === po.id ? { ...p, ...(typeof f === 'function' ? f(p) : f) } : p));
  const st = MN_PO_STATUS[po.status] || MN_PO_STATUS.draft;
  const total = mnPoTotal(po), recv = mnPoRecv(po);
  const items = po.items || [];
  const addLine = () => { if (!line.desc.trim()) return; patch(p => { const its = [...(p.items || []), { desc: line.desc.trim(), sku: line.sku.trim(), qty: Number(line.qty) || 1, unit: Number(line.unit) || 0, received: 0 }]; return { items: its, total: mnPoTotal({ items: its }) }; }); setLine({ desc: '', sku: '', qty: '1', unit: '' }); };
  const removeLine = (i) => patch(p => { const its = (p.items || []).filter((_, j) => j !== i); return { items: its, total: mnPoTotal({ items: its }) }; });
  const recvLine = (i) => { const it = items[i]; const add = (Number(it.qty) || 0) - (Number(it.received) || 0); if (add > 0) mnStockIn([{ ...it, qty: add }]); patch(p => { const its = (p.items || []).map((x, j) => j === i ? { ...x, received: x.qty } : x); const all = its.every(x => (x.received || 0) >= x.qty); return { items: its, status: all ? 'received' : 'partial', receivedAt: all ? Date.now() : p.receivedAt }; }); shieldToast('Line received — stock updated', 'ok'); };
  const recvAll = () => { const pend = items.map(it => ({ ...it, qty: (Number(it.qty) || 0) - (Number(it.received) || 0) })).filter(x => x.qty > 0); if (pend.length) mnStockIn(pend); patch(p => ({ items: (p.items || []).map(x => ({ ...x, received: x.qty })), status: 'received', receivedAt: Date.now() })); shieldToast(`${po.id} fully received — stock updated`, 'ok'); };
  const submit = () => { if (!items.length) { shieldToast('Add line items before sending', 'warn'); return; } patch({ status: 'sent', sentAt: Date.now() }); shieldToast(`${po.id} sent to ${po.vendor}`, 'ok'); };
  const cancel = () => shieldModal({ kind: 'confirm', danger: true, title: `Cancel ${po.id}?`, message: 'The vendor should be notified separately. Received lines stay in stock.', confirmLabel: 'Cancel PO', successMsg: 'PO cancelled', onConfirm: () => patch({ status: 'cancelled' }) });
  const remove = () => shieldModal({ kind: 'confirm', danger: true, title: `Delete ${po.id}?`, message: 'Removes the draft from every device.', confirmLabel: 'Delete', successMsg: 'Deleted', onConfirm: () => { setPos(prev => (prev || []).filter(p => p.id !== po.id)); onClose(); } });
  const print = () => shieldModal({ kind: 'doc', title: 'Purchase Order', docTitle: `Purchase Order ${po.id}`, meta: `${po.vendor || 'Vendor'} · ${po.date || ''}`, paragraphs: ['ShieldTech Solutions — Purchase Order. Please reference the PO number on all shipping documents and invoices.', { k: 'Vendor', v: po.vendor || '—' }, { k: 'Ship to', v: po.job || 'ShieldTech warehouse' }, ...items.map(i => ({ k: `${i.qty} × ${i.desc}${i.sku ? ' (' + i.sku + ')' : ''}`, v: mnMoney((Number(i.qty) || 0) * (Number(i.unit) || 0)) })), { k: 'Total', v: mnMoney(total) }] });
  return (
    <UcDrawer title={`${po.id} · ${po.vendor}`} sub={`${po.date || ''}${po.job ? ' · ' + po.job : ''}`} onClose={onClose} width={460}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: st.c }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: st.c }} />{st.l}</span>
        {po.status === 'draft' && <UcBtn small onClick={submit}>Send to vendor</UcBtn>}
        {(po.status === 'sent' || po.status === 'partial') && <UcBtn small onClick={recvAll}>Receive all</UcBtn>}
        {(po.status === 'sent' || po.status === 'partial') && <UcBtn small kind="danger" onClick={cancel}>Cancel</UcBtn>}
        <UcBtn small kind="ghost" onClick={print}>Print</UcBtn>
        {po.status === 'draft' && <UcBtn small kind="danger" onClick={remove}>Delete</UcBtn>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcTile label="PO total" value={mnMoney(total)} sub={`${items.length} line${items.length === 1 ? '' : 's'}`} />
        <UcTile label="Received" value={mnMoney(recv)} sub={total ? Math.round(recv / total * 100) + '% of value' : 'nothing yet'} tone={recv && recv >= total ? 'ok' : recv ? 'warn' : undefined} />
      </div>
      <UcCard title="Line items" pad={0} style={{ marginBottom: 12 }}>
        <UcTable cols={[{ k: 'desc', l: 'Item', render: r => <span>{r.desc}{r.sku && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.sku}</span>}</span> }, { k: 'qty', l: 'Qty', right: true }, { k: 'received', l: 'Rcvd', right: true, render: r => <span style={{ color: (r.received || 0) >= r.qty ? 'var(--status-ok)' : r.received ? 'var(--status-warn)' : 'var(--text-low)', fontWeight: 600 }}>{r.received || 0}</span> }, { k: 'unit', l: 'Unit', right: true, render: r => mnMoney(r.unit) }, { k: 'total', l: 'Total', right: true, render: r => mnMoney((Number(r.qty) || 0) * (Number(r.unit) || 0)) }, { k: 'act', l: '', render: r => <span onClick={e => e.stopPropagation()}>{(po.status === 'sent' || po.status === 'partial') && (r.received || 0) < r.qty ? <UcBtn small kind="soft" onClick={() => recvLine(r.id)}>Receive</UcBtn> : po.status === 'draft' ? <button onClick={() => removeLine(r.id)} style={{ fontFamily: 'var(--font-body)', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>✕</button> : null}</span> }]} rows={items.map((it, i) => ({ ...it, id: i }))} empty={<div style={{ padding: 14, fontSize: 12, color: 'var(--text-mid)' }}>No line items yet — add what you are ordering below.</div>} />
        {po.status === 'draft' && <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <input value={line.desc} onChange={e => setLine({ ...line, desc: e.target.value })} placeholder="Item" style={{ ...mnInp, flex: '2 1 140px' }} onKeyDown={e => { if (e.key === 'Enter') addLine(); }} />
          <input value={line.sku} onChange={e => setLine({ ...line, sku: e.target.value })} placeholder="SKU" style={{ ...mnInp, flex: '1 1 90px' }} />
          <input value={line.qty} onChange={e => setLine({ ...line, qty: e.target.value })} inputMode="numeric" placeholder="Qty" style={{ ...mnInp, width: 56 }} />
          <input value={line.unit} onChange={e => setLine({ ...line, unit: e.target.value })} inputMode="decimal" placeholder="Unit $" style={{ ...mnInp, width: 80 }} />
          <UcBtn small onClick={addLine}>Add</UcBtn>
        </div>}
      </UcCard>
      <UcCard title="Details" pad={12}>
        <UcProp k="Vendor" v={po.vendor} />
        <UcProp k="For" v={po.job || '—'} />
        <UcProp k="Created" v={po.date} />
        {po.sentAt && <UcProp k="Sent" v={new Date(po.sentAt).toLocaleDateString()} />}
        {po.receivedAt && <UcProp k="Received" v={new Date(po.receivedAt).toLocaleDateString()} />}
        {po.reqId && <UcProp k="From requisition" v={po.reqId} />}
      </UcCard>
    </UcDrawer>
  );
}
function MnReqDrawer({ req, onClose }) {
  const [, setReqs] = useShieldStore(partsReqStore);
  const [pos, setPos] = useShieldStore(poStore);
  const stage = MN_REQ_STAGES.find(s => s.id === req.status) || MN_REQ_STAGES[0];
  const patch = (f) => setReqs(prev => (prev || []).map(r => r.id === req.id ? { ...r, ...f } : r));
  const advance = () => { if (stage.next) { patch({ status: stage.next, [stage.next + 'At']: Date.now() }); shieldToast(`${req.id} → ${stage.next}`, stage.next === 'delivered' ? 'ok' : 'info'); } };
  const linkedPo = (pos || []).find(p => p.reqId === req.id);
  const toPo = () => shieldModal({ kind: 'form', title: `Purchase order for ${req.id}`, subtitle: `${(req.parts || []).length} part${(req.parts || []).length === 1 ? '' : 's'} · ${req.techName || 'Technician'}`, submitLabel: 'Create draft PO', successMsg: 'Draft PO created', fields: [{ key: 'vendor', label: 'Vendor', required: true, full: true, placeholder: 'e.g. ADI Global' }], onSubmit: (v) => { const id = genId('PO'); setPos(prev => [{ id, vendor: v.vendor.trim(), job: req.job || '', status: 'draft', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), reqId: req.id, items: (req.parts || []).map(p => ({ desc: p.name, sku: p.sku || '', qty: Number(p.qty) || 1, unit: 0, received: 0 })), total: 0 }, ...(prev || [])]); if (req.status === 'requested') patch({ status: 'approved', approvedAt: Date.now() }); } });
  const remove = () => shieldModal({ kind: 'confirm', danger: true, title: `Delete ${req.id}?`, message: 'Removes the requisition from the technician’s app too.', confirmLabel: 'Delete', successMsg: 'Deleted', onConfirm: () => { setReqs(prev => (prev || []).filter(r => r.id !== req.id)); onClose(); } });
  return (
    <UcDrawer title={req.id} sub={`${req.techName || 'Technician'}${req.job ? ' · ' + req.job : ''}`} onClose={onClose} width={400}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: stage.c }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.c }} />{stage.label}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: MN_URG[req.urgency] || 'var(--text-mid)', textTransform: 'uppercase' }}>{req.urgency || 'standard'}</span>
        {stage.action && <UcBtn small onClick={advance}>{stage.action}</UcBtn>}
        {!linkedPo && req.status !== 'delivered' && <UcBtn small kind="soft" onClick={toPo}>Create PO</UcBtn>}
      </div>
      <UcCard title={`Parts (${(req.parts || []).length})`} pad={12} style={{ marginBottom: 12 }}>
        {(req.parts || []).map((p, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span style={{ color: 'var(--text-high)' }}>{p.name}{p.sku ? <span style={{ color: 'var(--text-mid)', fontSize: 11 }}> · {p.sku}</span> : null}</span><span style={{ color: 'var(--brand)', fontWeight: 600 }}>× {p.qty}</span></div>)}
        {req.notes && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 8 }}>{req.notes}</div>}
      </UcCard>
      <UcCard title="Progress" pad={12} style={{ marginBottom: 12 }}>
        {MN_REQ_STAGES.map(s => { const done = MN_REQ_STAGES.findIndex(x => x.id === s.id) <= MN_REQ_STAGES.findIndex(x => x.id === req.status); return <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: done ? s.c : 'var(--border-strong)' }} /><span style={{ flex: 1, color: done ? 'var(--text-high)' : 'var(--text-low)' }}>{s.label}</span>{req[s.id + 'At'] && <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{new Date(req[s.id + 'At']).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}</div>; })}
        {linkedPo && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-mid)' }}>Purchase order <b style={{ color: 'var(--brand)' }}>{linkedPo.id}</b> · {MN_PO_STATUS[linkedPo.status].l}</div>}
      </UcCard>
      <UcBtn small kind="danger" onClick={remove}>Delete requisition</UcBtn>
    </UcDrawer>
  );
}
function MnInventory({ onPo }) {
  const [items, setItems] = useShieldStore(inventoryStore);
  const [q, setQ] = React.useState('');
  const [chip, setChip] = React.useState('all');
  const list = (items || []).map(i => ({ ...i, available: (Number(i.inStock) || 0) - (Number(i.committed) || 0), low: (Number(i.inStock) || 0) - (Number(i.committed) || 0) <= (Number(i.reorder) || 0) }));
  const cats = [...new Set(list.map(i => i.cat).filter(Boolean))];
  const rows = list.filter(i => (chip === 'all' || (chip === 'low' ? i.low : i.cat === chip)) && docSearchMatch(q, i.sku, i.name, i.brand, i.cat, i.location));
  const value = list.reduce((s, i) => s + (Number(i.inStock) || 0) * (Number(i.cost) || 0), 0);
  const low = list.filter(i => i.low && (i.reorder || 0) > 0);
  const addItem = () => shieldModal({ kind: 'form', title: 'New stock item', submitLabel: 'Add', successMsg: 'Item added', fields: [{ key: 'name', label: 'Item', required: true, full: true, placeholder: 'Axis P3265-V Dome Camera' }, { key: 'sku', label: 'SKU', placeholder: 'CAM-AX-P3265V' }, { key: 'brand', label: 'Brand', placeholder: 'Axis' }, { key: 'cat', label: 'Category', type: 'select', options: ['Camera', 'NVR', 'Access', 'Intrusion', 'Fire', 'Intercom', 'Network', 'Power', 'Cabling', 'Rack', 'Tools', 'Uncategorized'] }, { key: 'inStock', label: 'In stock', type: 'number', value: '0' }, { key: 'reorder', label: 'Reorder point', type: 'number', value: '0' }, { key: 'cost', label: 'Unit cost ($)', type: 'number', value: '0' }, { key: 'location', label: 'Location', placeholder: 'Shelf A-3 / Truck 2' }], onSubmit: (v) => setItems(prev => [{ id: 'inv-' + Date.now().toString(36), sku: (v.sku || '').trim(), name: v.name.trim(), brand: v.brand || '', cat: v.cat, inStock: Number(v.inStock) || 0, committed: 0, reorder: Number(v.reorder) || 0, cost: Number(v.cost) || 0, location: v.location || '', createdAt: Date.now() }, ...(prev || [])]) });
  const adjust = (it) => shieldModal({ kind: 'form', title: `Adjust ${it.name}`, subtitle: `${it.inStock} in stock · ${it.committed || 0} committed`, submitLabel: 'Save', successMsg: 'Stock updated', fields: [{ key: 'inStock', label: 'In stock', type: 'number', value: String(it.inStock || 0) }, { key: 'committed', label: 'Committed', type: 'number', value: String(it.committed || 0) }, { key: 'reorder', label: 'Reorder point', type: 'number', value: String(it.reorder || 0) }, { key: 'cost', label: 'Unit cost ($)', type: 'number', value: String(it.cost || 0) }, { key: 'location', label: 'Location', value: it.location || '' }], onSubmit: (v) => setItems(prev => (prev || []).map(x => x.id === it.id ? { ...x, inStock: Number(v.inStock) || 0, committed: Number(v.committed) || 0, reorder: Number(v.reorder) || 0, cost: Number(v.cost) || 0, location: v.location || '' } : x)) });
  const remove = (it) => shieldModal({ kind: 'confirm', danger: true, title: `Remove ${it.name}?`, message: 'Removes the stock record.', confirmLabel: 'Remove', successMsg: 'Removed', onConfirm: () => setItems(prev => (prev || []).filter(x => x.id !== it.id)) });
  const reorder = () => { if (!low.length) return; onPo(low.map(i => ({ desc: i.name, sku: i.sku, qty: Math.max(1, (Number(i.reorder) || 0) * 2 - i.available), unit: Number(i.cost) || 0, received: 0 }))); };
  const cols = [
    { k: 'name', l: 'Item', render: r => <span><span style={{ fontWeight: 600 }}>{r.name}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{[r.sku, r.brand].filter(Boolean).join(' · ') || '—'}</span></span> },
    { k: 'cat', l: 'Category', dim: true },
    { k: 'inStock', l: 'In stock', right: true, render: r => <span style={{ fontWeight: 600, color: r.low ? 'var(--status-warn)' : 'var(--text-high)' }}>{r.inStock}</span> },
    { k: 'committed', l: 'Committed', right: true, render: r => r.committed || 0 },
    { k: 'available', l: 'Available', right: true, render: r => <span style={{ color: r.available <= 0 ? 'var(--status-critical)' : 'var(--text-high)' }}>{r.available}</span> },
    { k: 'reorder', l: 'Reorder at', right: true, dim: true },
    { k: 'cost', l: 'Unit cost', right: true, render: r => mnMoney(r.cost) },
    { k: 'location', l: 'Location', dim: true },
    { k: 'act', l: '', render: r => <span style={{ display: 'inline-flex', gap: 6 }} onClick={e => e.stopPropagation()}><UcBtn small kind="ghost" onClick={() => adjust(r)}>Adjust</UcBtn><button onClick={() => remove(r)} style={{ fontFamily: 'var(--font-body)', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>✕</button></span> },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcTile label="Stock items" value={list.length} sub={`${cats.length} categories`} />
        <UcTile label="Stock value" value={mnMoney(value)} sub="at unit cost" />
        <UcTile label="Below reorder" value={low.length} sub={low.length ? 'needs a PO' : 'all stocked'} tone={low.length ? 'warn' : 'ok'} />
        <UcTile label="Committed" value={list.reduce((s, i) => s + (Number(i.committed) || 0), 0)} sub="reserved for jobs" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcChips options={[{ id: 'all', l: 'All', n: list.length }, { id: 'low', l: 'Below reorder', n: low.length }, ...cats.map(c => ({ id: c, l: c, n: list.filter(i => i.cat === c).length }))]} value={chip} onChange={setChip} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}><UcSearch value={q} onChange={setQ} placeholder="Search stock" />{low.length > 0 && <UcBtn kind="soft" onClick={reorder}>PO for low stock ({low.length})</UcBtn>}<UcBtn onClick={addItem}>+ Stock item</UcBtn></div>
      </div>
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} empty={<UcEmpty title={list.length ? 'No items match' : 'No stock recorded yet'} body={list.length ? 'Clear the search or filter.' : 'Add stock items here, or receive a purchase order — received lines land in stock automatically.'} cta={list.length ? undefined : '+ Stock item'} onCta={addItem} />} /></div></UcCard>
    </div>
  );
}
function MoneyPurchasingScreen() {
  const [pos, setPos] = useShieldStore(poStore);
  const [reqs] = useShieldStore(partsReqStore);
  const isMobile = useIsMobile(820);
  const [tab, setTab] = useDvSub('purchase-orders', MN_PUR_SUBS, 'pos', { 'parts-req': 'req' });
  const [q, setQ] = React.useState('');
  const [chip, setChip] = React.useState('all');
  const [selPo, setSelPo] = React.useState(null);
  const [selReq, setSelReq] = React.useState(null);
  const poList = (pos || []).map(p => ({ ...p, total: mnPoTotal(p), recv: mnPoRecv(p) }));
  const poRows = poList.filter(p => (chip === 'all' || (chip === 'open' ? ['sent', 'partial'].includes(p.status) : p.status === chip)) && docSearchMatch(q, p.id, p.vendor, p.job, p.status));
  const po = selPo ? poList.find(p => p.id === selPo) : null;
  const req = selReq ? (reqs || []).find(r => r.id === selReq) : null;
  const inFlight = poList.filter(p => ['sent', 'partial'].includes(p.status)).reduce((s, p) => s + p.total - p.recv, 0);
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const mtd = poList.filter(p => p.status === 'received' && (p.receivedAt || 0) >= month.getTime()).reduce((s, p) => s + p.total, 0);
  const openReqs = (reqs || []).filter(r => r.status !== 'delivered');
  const newPo = (items) => shieldModal({ kind: 'form', title: 'New purchase order', subtitle: items ? `${items.length} line${items.length === 1 ? '' : 's'} from inventory reorder points` : 'Add line items in the PO after creating it', submitLabel: 'Create draft', successMsg: 'Draft PO created', fields: [{ key: 'vendor', label: 'Vendor', required: true, placeholder: 'e.g. ADI Global' }, { key: 'job', label: 'For (job / project / stock)', placeholder: 'Warehouse stock' }], onSubmit: (v) => { const id = genId('PO'); setPos(prev => [{ id, vendor: v.vendor.trim(), job: (v.job || '').trim(), status: 'draft', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), items: items || [], total: mnPoTotal({ items: items || [] }), createdAt: Date.now() }, ...(prev || [])]); setSelPo(id); if (window.navSubSet) window.navSubSet('purchase-orders', 'pos', 'nav'); } });
  const poCols = [
    { k: 'id', l: 'PO', w: 100, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.id}</span> },
    { k: 'vendor', l: 'Vendor', render: r => <span><span style={{ fontWeight: 600 }}>{r.vendor}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.job || '—'}</span></span> },
    { k: 'date', l: 'Date', dim: true },
    { k: 'items', l: 'Lines', right: true, render: r => (r.items || []).length },
    { k: 'recv', l: 'Received', right: true, render: r => r.total ? Math.round(r.recv / r.total * 100) + '%' : '—' },
    { k: 'total', l: 'Total', right: true, render: r => mnMoney(r.total) },
    { k: 'status', l: 'Status', render: r => { const s = MN_PO_STATUS[r.status] || MN_PO_STATUS.draft; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />{s.l}</span>; } },
  ];
  const reqBoard = (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 6 }}>
      {MN_REQ_STAGES.map(s => { const cards = (reqs || []).filter(r => r.status === s.id); return (
        <div key={s.id} style={{ width: 240, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 8px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{s.label}</span><span style={{ fontSize: 10.5, color: 'var(--text-low)', marginLeft: 'auto' }}>{cards.length}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 70, padding: 6, borderRadius: 8, background: 'var(--brand-tint-05)', border: '1px dashed var(--border-subtle)' }}>
            {cards.map(c => <div key={c.id} onClick={() => setSelReq(c.id)} className="st-clickrow" style={{ background: 'var(--card)', border: `1px solid ${selReq === c.id ? 'var(--brand)' : 'var(--border-subtle)'}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>{c.id}</span><span style={{ fontSize: 10.5, fontWeight: 700, color: MN_URG[c.urgency] || 'var(--text-mid)', textTransform: 'uppercase' }}>{c.urgency || 'standard'}</span></div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginTop: 4 }}>{(c.techName || 'Technician')}{c.job ? ` · ${c.job}` : ''}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 3 }}>{(c.parts || []).map(p => `${p.qty}× ${p.name}`).join(', ')}</div>
            </div>)}
            {!cards.length && <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center', padding: '14px 6px' }}>Nothing {s.label.toLowerCase()}</div>}
          </div>
        </div>); })}
    </div>
  );
  const body = tab === 'inventory' ? <MnInventory onPo={(items) => newPo(items)} />
    : tab === 'req' ? ((reqs || []).length ? reqBoard : <UcEmpty title="No parts requisitions" body="Technicians request parts from their app; requests move Requested → Approved → Picking → Shipped → Delivered here, and can become a purchase order in one step." />)
    : <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={poCols} rows={poRows} selectedId={selPo} onRow={r => setSelPo(r.id)} empty={<UcEmpty title={q || chip !== 'all' ? 'No purchase orders match' : 'No purchase orders yet'} body="Create a PO, add line items, send it to the vendor, then receive lines as they arrive — received stock lands in Inventory." cta={q || chip !== 'all' ? undefined : '+ New PO'} onCta={() => newPo()} />} /></div></UcCard>;
  return (
    <DvFrame label="Inventory & Purchasing" title="Inventory & Purchasing" sub={`${poList.filter(p => ['sent', 'partial'].includes(p.status)).length} POs in flight · ${mnMoney(inFlight)} on order · ${openReqs.length} open requisition${openReqs.length === 1 ? '' : 's'}`} isMobile={isMobile}
      right={tab === 'pos' ? <><UcSearch value={q} onChange={setQ} placeholder="Search POs" /><UcBtn onClick={() => newPo()}>+ New PO</UcBtn></> : null}
      tiles={tab !== 'inventory' ? <>
        <UcTile label="Purchase orders" value={poList.length} sub={`${poList.filter(p => p.status === 'draft').length} draft`} />
        <UcTile label="In flight" value={mnMoney(inFlight)} sub="sent, not yet received" tone={inFlight ? 'warn' : undefined} />
        <UcTile label="Received (MTD)" value={mnMoney(mtd)} sub="this month" tone={mtd ? 'ok' : undefined} />
        <UcTile label="Requisitions" value={openReqs.length} sub={`${openReqs.filter(r => r.urgency === 'urgent').length} urgent`} tone={openReqs.some(r => r.urgency === 'urgent') ? 'crit' : undefined} />
      </> : null}
      tabs={MN_PUR_SUBS.map(s => ({ ...s, count: s.id === 'req' && openReqs.length ? openReqs.length : undefined }))} tab={tab} onTab={setTab}
      chips={tab === 'pos' ? <UcChips options={[{ id: 'all', l: 'All', n: poList.length }, { id: 'draft', l: 'Draft' }, { id: 'open', l: 'Sent / partial' }, { id: 'received', l: 'Received' }, { id: 'cancelled', l: 'Cancelled' }]} value={chip} onChange={setChip} /> : null}
      drawer={tab === 'pos' && po ? <MnPoDrawer po={po} onClose={() => setSelPo(null)} /> : tab === 'req' && req ? <MnReqDrawer req={req} onClose={() => setSelReq(null)} /> : null}>
      {body}
    </DvFrame>
  );
}

/* ═══════════════════ RECURRING REVENUE ═══════════════════ */
const MN_RR_SUBS = [{ id: 'contracts', label: 'Contracts' }, { id: 'builder', label: 'RR Builder' }];
const MN_RR_STATUS = { active: { l: 'Active', c: 'var(--status-ok)' }, 'at-risk': { l: 'At risk', c: 'var(--status-critical)' }, pending: { l: 'Pending', c: 'var(--brand)' }, cancelled: { l: 'Cancelled', c: 'var(--text-low)' } };
const MN_RISK = { low: 'var(--status-ok)', medium: 'var(--status-warn)', high: 'var(--status-critical)' };
function mnMonthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function MoneyRecurringScreen() {
  const [contracts, setContracts] = useShieldStore(mrrStore);
  const isMobile = useIsMobile(820);
  const [tab, setTab] = useDvSub('mrr', MN_RR_SUBS, 'contracts', { 'rr-builder': 'builder' });
  const [q, setQ] = React.useState('');
  const [chip, setChip] = React.useState('all');
  const [sel, setSel] = React.useState(null);
  const [sim, setSim] = React.useState(() => new Set());
  const list = (contracts || []).map((c, i) => ({ ...c, id: c.id || c.customer + ':' + i, mrr: Number(c.mrr) || 0, status: c.status || 'active', risk: c.risk || 'low', churned: sim.has(c.customer) }));
  const active = list.filter(c => c.status === 'active' || c.status === 'at-risk');
  const live = active.filter(c => !c.churned);
  const mrr = live.reduce((s, c) => s + c.mrr, 0);
  const simLoss = active.filter(c => c.churned).reduce((s, c) => s + c.mrr, 0);
  const atRisk = active.filter(c => c.status === 'at-risk' || c.risk === 'high').reduce((s, c) => s + c.mrr, 0);
  const rows = list.filter(c => (chip === 'all' || c.status === chip) && docSearchMatch(q, c.customer, c.plan, c.status, c.risk));
  const cur = sel ? list.find(c => c.id === sel) : null;
  /* Six-month trend from contract start / cancel dates — no baked-in baseline. */
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d; });
  const trend = months.map(m => { const end = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59).getTime(); return list.filter(c => c.status !== 'pending' && (!c.startedAt || c.startedAt <= end) && (!c.cancelledAt || c.cancelledAt > end) && c.status !== 'cancelled' ? true : (c.status === 'cancelled' && c.startedAt && c.startedAt <= end && c.cancelledAt && c.cancelledAt > end)).reduce((s, c) => s + c.mrr, 0); });
  const dated = list.some(c => c.startedAt);
  const maxT = Math.max(...trend, 1);
  const patch = (id, f) => setContracts(prev => (prev || []).map((c, i) => (c.id || c.customer + ':' + i) === id ? { ...c, ...f } : c));
  const newContract = () => shieldModal({ kind: 'form', title: 'New recurring contract', submitLabel: 'Add', successMsg: 'Contract added', fields: [{ key: 'customerSel', label: 'Customer', type: 'select', options: [...shieldCustomerNames(), 'Other'] }, { key: 'customerOther', label: 'Customer name', placeholder: 'If not in the list' }, { key: 'plan', label: 'Plan', type: 'select', options: ['Monitoring — Standard', 'Monitoring — Pro', 'Monitoring — Enterprise', 'Maintenance agreement', 'Managed network', 'Managed access', 'Government'] }, { key: 'mrr', label: 'MRR ($/mo)', type: 'number', required: true }, { key: 'start', label: 'Start', type: 'date', value: new Date().toISOString().slice(0, 10) }, { key: 'renewal', label: 'Renewal', type: 'date' }, { key: 'risk', label: 'Churn risk', type: 'select', options: ['low', 'medium', 'high'] }], onSubmit: (v) => { const customer = (v.customerSel && v.customerSel !== 'Other' ? v.customerSel : v.customerOther || '').trim() || 'Customer'; setContracts(prev => [{ id: 'rr-' + Date.now().toString(36), customer, plan: v.plan, mrr: Number(v.mrr) || 0, renewal: v.renewal || '', risk: v.risk, status: 'active', startedAt: v.start ? new Date(v.start + 'T12:00:00').getTime() : Date.now(), createdAt: Date.now() }, ...(prev || [])]); } });
  const edit = (c) => shieldModal({ kind: 'form', title: `Edit ${c.customer}`, submitLabel: 'Save', successMsg: 'Saved', fields: [{ key: 'plan', label: 'Plan', value: c.plan || '' }, { key: 'mrr', label: 'MRR ($/mo)', type: 'number', value: String(c.mrr) }, { key: 'renewal', label: 'Renewal', value: c.renewal || '' }, { key: 'risk', label: 'Churn risk', type: 'select', options: ['low', 'medium', 'high'], value: c.risk }], onSubmit: (v) => patch(c.id, { plan: v.plan, mrr: Number(v.mrr) || 0, renewal: v.renewal, risk: v.risk }) });
  const cols = [
    { k: 'customer', l: 'Customer', render: r => <span style={{ textDecoration: r.churned ? 'line-through' : 'none', color: r.churned ? 'var(--text-low)' : 'var(--text-high)' }}><span style={{ fontWeight: 600 }}>{r.customer}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.plan || '—'}</span></span> },
    { k: 'mrr', l: 'MRR', right: true, render: r => <span style={{ fontWeight: 600, color: r.churned ? 'var(--status-critical)' : 'var(--text-high)' }}>{mnMoney(r.mrr)}</span> },
    { k: 'arr', l: 'ARR', right: true, dim: true, render: r => mnMoney(r.mrr * 12) },
    { k: 'renewal', l: 'Renewal', dim: true, render: r => r.renewal || '—' },
    { k: 'risk', l: 'Risk', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: MN_RISK[r.risk] }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: MN_RISK[r.risk] }} />{r.risk}</span> },
    { k: 'status', l: 'Status', render: r => { const s = MN_RR_STATUS[r.status] || MN_RR_STATUS.active; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />{s.l}</span>; } },
  ];
  const drawer = cur && (
    <UcDrawer title={cur.customer} sub={cur.plan || 'Recurring contract'} onClose={() => setSel(null)} width={380}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcBtn small kind="ghost" onClick={() => edit(cur)}>Edit</UcBtn>
        {cur.status !== 'at-risk' && cur.status !== 'cancelled' && <UcBtn small kind="soft" onClick={() => patch(cur.id, { status: 'at-risk', risk: 'high' })}>Flag at risk</UcBtn>}
        {cur.status === 'at-risk' && <UcBtn small onClick={() => patch(cur.id, { status: 'active', risk: 'low' })}>Saved — mark active</UcBtn>}
        {cur.status !== 'cancelled' && <UcBtn small kind="danger" onClick={() => shieldModal({ kind: 'confirm', danger: true, title: `Cancel ${cur.customer}?`, message: `Removes ${mnMoney(cur.mrr)}/mo from MRR. The record stays for history.`, confirmLabel: 'Cancel contract', successMsg: 'Contract cancelled', onConfirm: () => patch(cur.id, { status: 'cancelled', cancelledAt: Date.now() }) })}>Cancel</UcBtn>}
        {cur.status === 'cancelled' && <UcBtn small onClick={() => patch(cur.id, { status: 'active', cancelledAt: null })}>Reactivate</UcBtn>}
        <UcBtn small kind="ghost" onClick={() => setSim(s => { const n = new Set(s); if (n.has(cur.customer)) n.delete(cur.customer); else n.add(cur.customer); return n; })}>{cur.churned ? 'Undo what-if' : 'What if they churn?'}</UcBtn>
      </div>
      <UcCard title="Contract" pad={12}>
        <UcProp k="MRR" v={mnMoney(cur.mrr) + '/mo'} />
        <UcProp k="ARR" v={mnMoney(cur.mrr * 12)} />
        <UcProp k="Renewal" v={cur.renewal || '—'} />
        <UcProp k="Started" v={cur.startedAt ? new Date(cur.startedAt).toLocaleDateString() : '—'} />
        <UcProp k="Risk" v={cur.risk} />
        <UcProp k="Status" v={(MN_RR_STATUS[cur.status] || {}).l} />
      </UcCard>
    </UcDrawer>
  );
  const body = tab === 'builder' ? (window.RRBuilderScreen ? <RRBuilderScreen /> : null) : (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 260px', gap: 12, alignItems: 'start' }}>
      <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} selectedId={sel} onRow={r => setSel(r.id)} empty={<UcEmpty title={q || chip !== 'all' ? 'No contracts match' : 'No recurring contracts yet'} body="Monitoring, maintenance and managed-service agreements go here; MRR, ARR and churn risk roll up from the book." cta={q || chip !== 'all' ? undefined : '+ New contract'} onCta={newContract} />} /></div></UcCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <UcCard title="MRR trend" pad={12}>
          {dated ? <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90 }}>{trend.map((v, i) => <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{v ? '$' + Math.round(v / 1000) + 'k' : ''}</span><div style={{ width: '100%', height: Math.max(2, v / maxT * 60), background: i === 5 ? 'var(--brand)' : 'var(--brand-tint-12)', borderRadius: 3 }} /><span style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{months[i].toLocaleDateString('en-US', { month: 'short' })}</span></div>)}</div>
            : <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Add contracts with a start date and the trend builds itself.</div>}
        </UcCard>
        <UcCard title="By plan" pad={12}>
          {[...new Set(live.map(c => c.plan || 'Other'))].map(p => { const v = live.filter(c => (c.plan || 'Other') === p).reduce((s, c) => s + c.mrr, 0); return <div key={p} style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--text-high)' }}>{p}</span><span style={{ fontWeight: 600 }}>{mnMoney(v)}</span></div><div style={{ height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden', marginTop: 4 }}><div style={{ width: mrr ? (v / mrr * 100) + '%' : 0, height: '100%', background: 'var(--brand)' }} /></div></div>; })}
          {!live.length && <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>No active contracts.</div>}
        </UcCard>
        <UcCard title="Churn risk" pad={12}>
          {['low', 'medium', 'high'].map(r => <div key={r} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-high)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: MN_RISK[r] }} />{r}</span><span style={{ fontWeight: 600, color: MN_RISK[r] }}>{mnMoney(live.filter(c => c.risk === r).reduce((s, c) => s + c.mrr, 0))}</span></div>)}
          {simLoss > 0 && <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--status-critical)' }}>What-if churn: −{mnMoney(simLoss)}/mo · −{mnMoney(simLoss * 12)} ARR <button onClick={() => setSim(new Set())} style={{ fontFamily: 'var(--font-body)', background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 11.5 }}>reset</button></div>}
        </UcCard>
      </div>
    </div>
  );
  return (
    <DvFrame label="Recurring Revenue" title="Recurring Revenue" sub={`${live.length} active contract${live.length === 1 ? '' : 's'} · ${mnMoney(mrr)}/mo · ${mnMoney(mrr * 12)} ARR`} isMobile={isMobile}
      right={tab === 'contracts' ? <><UcSearch value={q} onChange={setQ} placeholder="Search contracts" /><UcBtn onClick={newContract}>+ New contract</UcBtn></> : null}
      tiles={<>
        <UcTile label="MRR" value={mnMoney(mrr)} sub={simLoss ? `−${mnMoney(simLoss)} what-if churn` : 'monthly recurring'} tone={simLoss ? 'warn' : undefined} />
        <UcTile label="ARR" value={mnMoney(mrr * 12)} sub="annualized" />
        <UcTile label="Active contracts" value={live.length} sub={`${list.filter(c => c.status === 'pending').length} pending`} />
        <UcTile label="At-risk MRR" value={mnMoney(atRisk)} sub="flagged or high risk" tone={atRisk ? 'crit' : 'ok'} />
        <UcTile label="Cancelled (12m)" value={list.filter(c => c.status === 'cancelled' && (c.cancelledAt || 0) > Date.now() - 365 * 864e5).length} sub="lost contracts" />
      </>}
      tabs={MN_RR_SUBS} tab={tab} onTab={setTab}
      chips={tab === 'contracts' ? <UcChips options={[{ id: 'all', l: 'All', n: list.length }, { id: 'active', l: 'Active' }, { id: 'at-risk', l: 'At risk' }, { id: 'pending', l: 'Pending' }, { id: 'cancelled', l: 'Cancelled' }]} value={chip} onChange={setChip} /> : null}
      drawer={tab === 'contracts' ? drawer : null}>
      {body}
    </DvFrame>
  );
}

/* ═══════════════════ REVENUE OPS + BLUESHIELD ═══════════════════ */
function MoneyRevOpsScreen() {
  return (
    <div data-screen-label="Revenue Ops" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Revenue Ops</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Live cash, AR, AP and recurring revenue from QuickBooks and the contract book</div></div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '4px 16px 16px' }}>{window.RevOpsScreen ? <RevOpsScreen /> : null}</div>
    </div>
  );
}
function MoneyBlueShieldScreen() {
  return (
    <div data-screen-label="BlueShield Studio" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      <div style={{ padding: '10px 16px 8px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}><div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>BlueShield Studio</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Plans, takeoffs and markups — signed in with your ShieldTech account</div></div><div style={{ marginLeft: 'auto' }}><UcBtn kind="ghost" small onClick={() => window.open('/blueshield/app.html', '_blank')}>Open full screen</UcBtn></div></div>
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px 12px' }}>{window.PlanRoomScreen ? <PlanRoomScreen embedded /> : null}</div>
    </div>
  );
}

Object.assign(window, { inventoryStore, MoneyPurchasingScreen, MoneyRecurringScreen, MoneyRevOpsScreen, MoneyBlueShieldScreen, MnInventory, MnPoDrawer, MnReqDrawer, mnStockIn });

/* ShieldTech Mobile — Native Ops Screens VI (full bespoke, no desktop fallback)
   Replaces every remaining hero/intro screen with a complete, working native
   tool. Each binds real shared stores (created here where none existed) so
   everything persists and syncs company-wide like the rest of the portal.
   Registered by overriding entries in the window-global M_OPS5 map. */

const OPS6_EMPTY = ({ children }) => <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{children}</div>;
const ops6$ = (n) => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const ops6Inp = { width: '100%', padding: '12px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' };
const ops6Lbl = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };
const ops6Btn = (primary) => ({ padding: '12px 16px', borderRadius: 11, border: primary ? 'none' : '1px solid var(--border-subtle)', background: primary ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'transparent', color: primary ? '#fff' : 'var(--text-mid)', fontSize: 13, fontWeight: primary ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)' });

/* Shared stores for the tools below */
const mExpenseStore = createShieldStore('mexpenses', []);
const mStatusStore = createShieldStore('statuspage2', [
  { id: 'monitoring', name: 'Monitoring & Alarm Receiving', status: 'operational' },
  { id: 'portal', name: 'Customer Portal', status: 'operational' },
  { id: 'video', name: 'Video Retention Cloud', status: 'operational' },
  { id: 'dispatch', name: 'Service Dispatch', status: 'operational' },
]);
const mCampaignStore = createShieldStore('campaigns2', []);
const mOnboardStore = createShieldStore('onboarding2', []);
const mRfpStore = createShieldStore('rfp2', []);
const mPlanStore = createShieldStore('mplans', [
  { id: 'essential', name: 'Essential Monitoring', price: 49, features: ['24/7 alarm monitoring', 'Quarterly test', 'Email support'] },
  { id: 'pro', name: 'Professional', price: 129, features: ['24/7 monitoring + video verify', 'Semi-annual maintenance visit', 'Priority dispatch', 'Phone support'] },
  { id: 'total', name: 'Total Shield', price: 249, features: ['Everything in Professional', 'Unlimited service calls', 'Annual system health report', 'Loaner hardware', '4-hour SLA'] },
]);

/* ══════════════ RECEIPT QUICK-SNAP + INBOX (shared bits) ══════════════ */
/* One-tap receipt capture → private receipts bucket + shared inbox. */
function MReceiptSnap({ onDone }) {
  const inputRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!window.__shieldReceipts) { showToast('Receipts backend not configured', 'warn'); return; }
    setBusy(true);
    const r = await window.__shieldReceipts.snap(file, {});
    setBusy(false);
    if (r.ok) { showToast('Receipt in the inbox — the office will categorize it', 'ok'); onDone && onDone(); }
    else showToast('Upload failed: ' + (r.error || 'unknown'), 'warn');
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
      <button disabled={busy} onClick={() => inputRef.current && inputRef.current.click()} style={{ ...ops6Btn(false), borderColor: 'var(--border-strong)', color: 'var(--brand)', opacity: busy ? 0.5 : 1 }}>
        {busy ? 'Uploading…' : '📷 Quick-snap a receipt'}
      </button>
    </>
  );
}

/* Thumbnail that resolves its signed URL lazily. */
function MReceiptThumb({ row, size = 54 }) {
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    if (window.__shieldReceipts) window.__shieldReceipts.imageUrl(row).then(u => { if (alive) setSrc(u); });
    return () => { alive = false; };
  }, [row.id]);
  return (
    <div onClick={src ? () => window.open(src, '_blank') : undefined} style={{ width: size, height: size, borderRadius: 9, overflow: 'hidden', background: 'rgba(63,169,245,0.07)', border: '1px solid var(--border-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: src ? 'pointer' : 'default' }}>
      {src ? <img src={src} alt="receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🧾</span>}
    </div>
  );
}

/* ══════════════ EXPENSES — submit & approve + receipt inbox, native ══════════════ */
function MExpensesFull() {
  const [rows, setRows] = useShieldStore(mExpenseStore);
  const [adding, setAdding] = React.useState(false);
  const [f, setF] = React.useState({ desc: '', amount: '', category: 'Materials' });
  const isAdmin = ((window.__shieldUser || {}).role || 'Admin') !== 'Technician';
  const pending = (rows || []).filter(r => r.status === 'pending');
  const [inbox, setInbox] = React.useState(null);
  const [convertRow, setConvertRow] = React.useState(null);
  const [cf, setCf] = React.useState({ vendor: '', amount: '', category: 'Materials' });
  const refreshInbox = React.useCallback(() => {
    if (!window.__shieldReceipts) { setInbox([]); return; }
    window.__shieldReceipts.list('inbox').then(r => setInbox(r.ok ? r.data : []));
  }, []);
  React.useEffect(() => { refreshInbox(); }, [refreshInbox]);
  const doConvert = async () => {
    if (!(Number(cf.amount) > 0)) { showToast('Enter the amount', 'warn'); return; }
    const r = convertRow;
    await window.__shieldReceipts.convert(r.id, { vendor: cf.vendor, amount: cf.amount, category: cf.category });
    mExpenseStore.set(prev => [{
      id: genId('exp'), desc: (cf.vendor || 'Receipt') + (r.note ? ` — ${r.note}` : ''),
      amount: Number(cf.amount), category: cf.category,
      by: r.uploader_name || 'Field', date: (r.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: 'approved', receipt_id: r.id,
    }, ...(prev || [])]);
    setConvertRow(null); setCf({ vendor: '', amount: '', category: 'Materials' });
    showToast('Receipt converted to a categorized expense ✓', 'ok');
    refreshInbox();
  };
  const act = (id, status) => { mExpenseStore.set(prev => prev.map(r => r.id === id ? { ...r, status } : r)); showToast(status === 'approved' ? 'Expense approved' : 'Expense rejected', 'ok'); };
  const save = () => {
    if (!f.desc.trim() || !(Number(f.amount) > 0)) { showToast('Add a description and amount', 'warn'); return; }
    mExpenseStore.set(prev => [{ id: genId('exp'), desc: f.desc.trim(), amount: Number(f.amount), category: f.category, by: (window.__shieldUser || {}).name || 'You', date: new Date().toISOString().slice(0, 10), status: 'pending' }, ...(prev || [])]);
    setF({ desc: '', amount: '', category: 'Materials' }); setAdding(false); showToast('Expense submitted for approval', 'ok');
  };
  const stC = { pending: 'var(--status-warn)', approved: 'var(--status-ok)', rejected: 'var(--status-critical)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['PENDING', pending.length, pending.length ? 'var(--status-warn)' : 'var(--status-ok)'], ['RECEIPT INBOX', inbox === null ? '…' : inbox.length, (inbox || []).length ? 'var(--status-warn)' : 'var(--status-ok)'], ['ALL', (rows || []).length, 'var(--text-mid)']]} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><MReceiptSnap onDone={refreshInbox} /></div>
        <button onClick={() => setAdding(true)} style={{ ...ops6Btn(true), flex: 1 }}>+ Submit expense</button>
      </div>
      {(inbox || []).length > 0 && <>
        <MSection title={`Receipt inbox (${inbox.length})`} />
        {inbox.map(r => (
          <div key={r.id} className="glass" style={{ padding: '11px 12px', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', borderLeft: '3px solid var(--status-warn)' }}>
            <MReceiptThumb row={r} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{r.vendor || r.note || 'Receipt'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.uploader_name || 'Field'} · {new Date(r.created_at).toLocaleDateString()}{r.amount ? ` · ${ops6$(r.amount)}` : ''}</div>
            </div>
            {isAdmin && <button onClick={() => { setConvertRow(r); setCf({ vendor: r.vendor || '', amount: r.amount || '', category: 'Materials' }); }} style={{ padding: '8px 12px', borderRadius: 9, border: 'none', background: 'rgba(52,211,153,0.14)', color: 'var(--status-ok)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>→ Expense</button>}
          </div>
        ))}
      </>}
      {(rows || []).map(r => (
        <div key={r.id} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${stC[r.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{r.desc}</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{ops6$(r.amount)}</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', margin: '3px 0 0' }}>{r.by} · {r.category} · {r.date} · <span style={{ color: stC[r.status] }}>{r.status}</span></div>
          {isAdmin && r.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
              <button onClick={() => act(r.id, 'approved')} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: 'rgba(52,211,153,0.14)', color: 'var(--status-ok)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>
              <button onClick={() => act(r.id, 'rejected')} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--status-critical)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕ Reject</button>
            </div>
          )}
        </div>
      ))}
      {(rows || []).length === 0 && <OPS6_EMPTY>No expenses yet — receipts submitted here route to approval and payroll.</OPS6_EMPTY>}
      {convertRow && (
        <MSheet title="Convert receipt → expense" onClose={() => setConvertRow(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <MReceiptThumb row={convertRow} size={72} />
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{convertRow.uploader_name || 'Field'} · {new Date(convertRow.created_at).toLocaleString()}<br/>Tap the image to zoom.</div>
            </div>
            <div><span style={ops6Lbl}>Vendor</span><input value={cf.vendor} onChange={e => setCf(p => ({ ...p, vendor: e.target.value }))} placeholder="Home Depot" style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Amount ($)</span><input type="number" inputMode="decimal" value={cf.amount} onChange={e => setCf(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Category</span><MSegment options={['Materials', 'Fuel', 'Tools', 'Other']} value={cf.category} onChange={v => setCf(p => ({ ...p, category: v }))} /></div>
            <button onClick={doConvert} style={ops6Btn(true)}>Convert to expense</button>
            <button onClick={async () => { await window.__shieldReceipts.dismiss(convertRow.id); setConvertRow(null); refreshInbox(); showToast('Receipt dismissed'); }} style={{ ...ops6Btn(false), color: 'var(--status-critical)' }}>Dismiss receipt</button>
          </div>
        </MSheet>
      )}
      {adding && (
        <MSheet title="Submit expense" onClose={() => setAdding(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><span style={ops6Lbl}>What was it?</span><input value={f.desc} onChange={e => setF(p => ({ ...p, desc: e.target.value }))} placeholder="Conduit + fittings, Home Depot" style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Amount ($)</span><input type="number" inputMode="decimal" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Category</span><MSegment options={['Materials', 'Fuel', 'Tools', 'Other']} value={f.category} onChange={v => setF(p => ({ ...p, category: v }))} /></div>
            <button onClick={save} style={ops6Btn(true)}>Submit for approval</button>
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* ══════════════ ROI CALCULATOR — fully interactive ══════════════ */
function MROIFull() {
  const [v, setV] = React.useState({ system: 18500, incidents: 4, loss: 3800, insurance: 8, premium: 14000, guardHrs: 0 });
  const set = (k) => (e) => setV(p => ({ ...p, [k]: Number(e.target.value) || 0 }));
  const annualSavings = v.incidents * v.loss * 0.72 + (v.premium * v.insurance / 100) + v.guardHrs * 52 * 28;
  const paybackMo = annualSavings > 0 ? Math.max(1, Math.round((v.system / annualSavings) * 12)) : null;
  const roi5 = annualSavings > 0 ? Math.round(((annualSavings * 5 - v.system) / v.system) * 100) : 0;
  const field = (label, key, hint) => (
    <div><span style={ops6Lbl}>{label}</span><input type="number" inputMode="decimal" value={v[key]} onChange={set(key)} style={ops6Inp} />{hint && <div style={{ fontSize: 9.5, color: 'var(--text-low)', marginTop: 3 }}>{hint}</div>}</div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="ANNUAL SAVINGS" value={ops6$(annualSavings)} accent="var(--status-ok)" sub="prevention + insurance + staffing" />
        <MStat label="PAYBACK" value={paybackMo ? `${paybackMo} mo` : '—'} accent="var(--brand)" sub={`5-yr ROI ${roi5}%`} />
      </div>
      <MSection title="Customer inputs" />
      {field('Proposed system cost ($)', 'system')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {field('Incidents / year', 'incidents', 'theft, vandalism, false alarms')}
        {field('Avg loss per incident ($)', 'loss', '72% assumed preventable')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {field('Insurance premium ($/yr)', 'premium')}
        {field('Premium discount (%)', 'insurance', 'typical 5–15% with monitored systems')}
      </div>
      {field('Guard hours replaced / week', 'guardHrs', 'at $28/hr loaded')}
      <button onClick={() => { const b = new Blob([`ShieldTech ROI Summary\n\nSystem investment: ${ops6$(v.system)}\nAnnual savings: ${ops6$(annualSavings)}\nPayback: ${paybackMo} months\n5-year ROI: ${roi5}%\n\nAssumptions: ${v.incidents} incidents/yr × ${ops6$(v.loss)} avg (72% preventable) · ${v.insurance}% insurance discount on ${ops6$(v.premium)} · ${v.guardHrs} guard hrs/wk @ $28.`], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ShieldTech-ROI.txt'; a.click(); URL.revokeObjectURL(a.href); showToast('ROI summary downloaded', 'ok'); }} style={ops6Btn(true)}>⭳ Download ROI summary</button>
    </div>
  );
}

/* ══════════════ RECURRING REVENUE BUILDER — live math ══════════════ */
function MRRBuilderFull({ onNav }) {
  const [plans] = useShieldStore(mPlanStore);
  const [v, setV] = React.useState({ plan: 'pro', sites: 3, term: 36 });
  const plan = (plans || []).find(p => p.id === v.plan) || (plans || [])[0] || { price: 0, name: '' };
  const mrr = plan.price * v.sites;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="MRR" value={ops6$(mrr)} accent="var(--status-ok)" sub={`${v.sites} site${v.sites === 1 ? '' : 's'} × ${ops6$(plan.price)}`} />
        <MStat label="CONTRACT VALUE" value={ops6$(mrr * v.term)} accent="var(--brand)" sub={`${v.term}-month term · ARR ${ops6$(mrr * 12)}`} />
      </div>
      <MSection title="Plan" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(plans || []).map(p => (
          <button key={p.id} onClick={() => setV(s => ({ ...s, plan: p.id }))} className="glass" style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: `1px solid ${v.plan === p.id ? 'var(--brand)' : 'var(--border-subtle)'}`, background: v.plan === p.id ? 'rgba(63,169,245,0.1)' : 'var(--glass-bg)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{p.name}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{ops6$(p.price)}/mo</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 3 }}>{(p.features || []).join(' · ')}</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><span style={ops6Lbl}>Sites</span><input type="number" inputMode="numeric" value={v.sites} onChange={e => setV(p => ({ ...p, sites: Math.max(1, Number(e.target.value) || 1) }))} style={ops6Inp} /></div>
        <div><span style={ops6Lbl}>Term (months)</span><MSegment options={['12', '24', '36', '60']} value={String(v.term)} onChange={t => setV(p => ({ ...p, term: Number(t) }))} /></div>
      </div>
      <button onClick={() => { addEstimate({ customer_name: 'Monitoring plan proposal', total: mrr * v.term, status: 'draft', lines: [{ desc: `${plan.name} — ${v.sites} site(s), ${v.term}-month term`, qty: v.term, rate: mrr }] }); showToast('Draft estimate created in Money → Estimates', 'ok'); onNav && onNav('estimates'); }} style={ops6Btn(true)}>Create draft estimate from this plan</button>
    </div>
  );
}

/* ══════════════ SERVICE PLANS — editable tiers ══════════════ */
function MServicePlansFull({ onNav }) {
  const [plans] = useShieldStore(mPlanStore);
  const [editing, setEditing] = React.useState(null);
  const save = () => {
    mPlanStore.set(prev => prev.map(p => p.id === editing.id ? { ...editing, price: Number(editing.price) || 0, features: editing.features.filter(f => f.trim()) } : p));
    setEditing(null); showToast('Plan saved', 'ok');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MSection title="Your monitoring & maintenance tiers" />
      {(plans || []).map(p => (
        <div key={p.id} className="glass" style={{ padding: '13px 14px', borderRadius: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>{p.name}</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>{ops6$(p.price)}<span style={{ fontSize: 9, color: 'var(--text-low)' }}>/mo·site</span></span>
          </div>
          <div style={{ margin: '8px 0 10px' }}>
            {(p.features || []).map((f, i) => <div key={i} style={{ fontSize: 11.5, color: 'var(--text-mid)', padding: '2px 0' }}>✓ {f}</div>)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing({ ...p, features: [...p.features] })} style={{ ...ops6Btn(false), flex: 1, padding: '9px 0', fontSize: 12, color: 'var(--brand)', borderColor: 'var(--border-strong)' }}>✎ Edit plan</button>
            <button onClick={() => onNav && onNav('rr-builder')} style={{ ...ops6Btn(false), flex: 1, padding: '9px 0', fontSize: 12 }}>Quote it →</button>
          </div>
        </div>
      ))}
      {editing && (
        <MSheet title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><span style={ops6Lbl}>Plan name</span><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Price ($/month per site)</span><input type="number" inputMode="decimal" value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))} style={ops6Inp} /></div>
            <div>
              <span style={ops6Lbl}>What's included</span>
              {editing.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
                  <input value={f} onChange={e => setEditing(p => ({ ...p, features: p.features.map((x, ix) => ix === i ? e.target.value : x) }))} style={{ ...ops6Inp, padding: '9px 11px', fontSize: 13 }} />
                  <button onClick={() => setEditing(p => ({ ...p, features: p.features.filter((_, ix) => ix !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--status-critical)', fontSize: 15, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <button onClick={() => setEditing(p => ({ ...p, features: [...p.features, ''] }))} style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add inclusion</button>
            </div>
            <button onClick={save} style={ops6Btn(true)}>Save plan</button>
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* ══════════════ STATUS PAGE — manage component health ══════════════ */
const OPS6_ST = { operational: ['Operational', 'var(--status-ok)'], degraded: ['Degraded', 'var(--status-warn)'], down: ['Outage', 'var(--status-critical)'] };
function MStatusPageFull() {
  const [comps] = useShieldStore(mStatusStore);
  const cycle = (id) => mStatusStore.set(prev => prev.map(c => {
    if (c.id !== id) return c;
    const order = ['operational', 'degraded', 'down'];
    return { ...c, status: order[(order.indexOf(c.status) + 1) % 3] };
  }));
  const worst = (comps || []).some(c => c.status === 'down') ? 'down' : (comps || []).some(c => c.status === 'degraded') ? 'degraded' : 'operational';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '15px 16px', borderRadius: 14, borderLeft: `3px solid ${OPS6_ST[worst][1]}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: OPS6_ST[worst][1], boxShadow: `0 0 10px ${OPS6_ST[worst][1]}` }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{worst === 'operational' ? 'All systems operational' : worst === 'degraded' ? 'Partial degradation' : 'Service outage'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>This is what customers see on your public status page</div>
        </div>
      </div>
      <MSection title="Components — tap to change status" />
      {(comps || []).map(c => (
        <div key={c.id} onClick={() => cycle(c.id)} className="glass" style={{ padding: '13px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: OPS6_ST[c.status][1], flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1 }}>{c.name}</span>
          <MBadge color={OPS6_ST[c.status][1]}>{OPS6_ST[c.status][0]}</MBadge>
        </div>
      ))}
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center' }}>Status changes sync live to every signed-in portal.</div>
    </div>
  );
}

/* ══════════════ MARKETING — campaign tracker ══════════════ */
function MMarketingFull({ onNav }) {
  const [rows] = useShieldStore(mCampaignStore);
  const [adding, setAdding] = React.useState(false);
  const [f, setF] = React.useState({ name: '', channel: 'Google Ads', budget: '' });
  const active = (rows || []).filter(r => r.active);
  const save = () => {
    if (!f.name.trim()) { showToast('Name the campaign', 'warn'); return; }
    mCampaignStore.set(prev => [{ id: genId('cmp'), name: f.name.trim(), channel: f.channel, budget: Number(f.budget) || 0, active: true, started: new Date().toISOString().slice(0, 10), leads: 0 }, ...(prev || [])]);
    setAdding(false); setF({ name: '', channel: 'Google Ads', budget: '' }); showToast('Campaign started', 'ok');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACTIVE', active.length, 'var(--status-ok)'], ['MONTHLY BUDGET', ops6$(active.reduce((s, r) => s + r.budget, 0)), 'var(--brand)']]} />
      <button onClick={() => setAdding(true)} style={ops6Btn(true)}>+ New campaign</button>
      {(rows || []).map(r => (
        <div key={r.id} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{r.name}</span>
            <MBadge color={r.active ? 'var(--status-ok)' : 'var(--text-low)'}>{r.active ? 'Live' : 'Paused'}</MBadge>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', margin: '3px 0 9px' }}>{r.channel} · {ops6$(r.budget)}/mo · since {r.started}</div>
          <button onClick={() => mCampaignStore.set(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x))} style={{ ...ops6Btn(false), width: '100%', padding: '9px 0', fontSize: 12 }}>{r.active ? '⏸ Pause' : '▶ Resume'}</button>
        </div>
      ))}
      {(rows || []).length === 0 && <OPS6_EMPTY>No campaigns yet — track ad spend and lead sources here. Scraped gov leads run automatically in Auto-Bid.</OPS6_EMPTY>}
      {adding && (
        <MSheet title="New campaign" onClose={() => setAdding(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><span style={ops6Lbl}>Campaign name</span><input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Spring CCTV promo" style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Channel</span><MSegment options={['Google Ads', 'Facebook', 'Direct mail', 'Referral']} value={f.channel} onChange={v => setF(p => ({ ...p, channel: v }))} /></div>
            <div><span style={ops6Lbl}>Monthly budget ($)</span><input type="number" inputMode="decimal" value={f.budget} onChange={e => setF(p => ({ ...p, budget: e.target.value }))} style={ops6Inp} /></div>
            <button onClick={save} style={ops6Btn(true)}>Start campaign</button>
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* ══════════════ ONBOARDING — per-customer go-live checklist ══════════════ */
const OPS6_OB_TEMPLATE = ['Contract signed & filed', 'Site survey completed', 'System installed & tested', 'Monitoring account activated', 'Customer portal invite sent', 'Training walkthrough done', 'First invoice sent'];
function MOnboardingFull({ onNav }) {
  const [lists] = useShieldStore(mOnboardStore);
  const [customers] = useShieldStore(customerStore);
  const [name, setName] = React.useState('');
  const start = () => {
    const n = name.trim() || ((customers || [])[0] || {}).name;
    if (!n) { showToast('Type the customer name', 'warn'); return; }
    mOnboardStore.set(prev => [{ id: genId('ob'), customer: n, started: new Date().toISOString().slice(0, 10), items: OPS6_OB_TEMPLATE.map(t => ({ t, done: false })) }, ...(prev || [])]);
    setName(''); showToast(`Onboarding started for ${n}`, 'ok');
  };
  const toggle = (id, i) => mOnboardStore.set(prev => prev.map(l => l.id === id ? { ...l, items: l.items.map((it, ix) => ix === i ? { ...it, done: !it.done } : it) } : l));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New customer name…" style={{ ...ops6Inp, flex: 1 }} list="ob-custs" />
        <datalist id="ob-custs">{(customers || []).map(c => <option key={c.id || c.name} value={c.name} />)}</datalist>
        <button onClick={start} style={{ ...ops6Btn(true), padding: '0 16px', flexShrink: 0 }}>Start</button>
      </div>
      {(lists || []).map(l => {
        const done = l.items.filter(i => i.done).length;
        const pct = Math.round((done / l.items.length) * 100);
        return (
          <div key={l.id} className="glass" style={{ padding: '13px 14px', borderRadius: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>{l.customer}</span>
              <span className="mono" style={{ fontSize: 11, color: pct === 100 ? 'var(--status-ok)' : 'var(--brand)' }}>{pct}%</span>
            </div>
            <MBar pct={pct} color={pct === 100 ? 'var(--status-ok)' : undefined} />
            <div style={{ marginTop: 9 }}>
              {l.items.map((it, i) => (
                <button key={i} onClick={() => toggle(l.id, i)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 2px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${it.done ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: it.done ? 'rgba(52,211,153,0.15)' : 'transparent', color: 'var(--status-ok)', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{it.done ? '✓' : ''}</span>
                  <span style={{ fontSize: 12.5, color: it.done ? 'var(--text-low)' : 'var(--text-high)', textDecoration: it.done ? 'line-through' : 'none' }}>{it.t}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {(lists || []).length === 0 && <OPS6_EMPTY>Start a checklist above — it walks every new account from signed contract to live service.</OPS6_EMPTY>}
    </div>
  );
}

/* ══════════════ RFP WORKSPACE — requirement matrix ══════════════ */
function MRFPFull({ onNav }) {
  const [rfps] = useShieldStore(mRfpStore);
  const [adding, setAdding] = React.useState(false);
  const [f, setF] = React.useState({ title: '', reqs: '' });
  const save = () => {
    const lines = f.reqs.split('\n').map(s => s.trim()).filter(Boolean);
    if (!f.title.trim() || !lines.length) { showToast('Add a title and paste the requirements', 'warn'); return; }
    mRfpStore.set(prev => [{ id: genId('rfp'), title: f.title.trim(), created: new Date().toISOString().slice(0, 10), reqs: lines.map(t => ({ t, ok: false })) }, ...(prev || [])]);
    setAdding(false); setF({ title: '', reqs: '' }); showToast('RFP matrix created', 'ok');
  };
  const toggle = (id, i) => mRfpStore.set(prev => prev.map(r => r.id === id ? { ...r, reqs: r.reqs.map((q, ix) => ix === i ? { ...q, ok: !q.ok } : q) } : r));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '11px 13px', borderRadius: 11, fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.5 }}>💡 Government solicitations are handled automatically by <span onClick={() => onNav && onNav('autobid')} style={{ color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>Auto-Bid</span>. Use this workspace for private RFPs where you track a compliance matrix by hand.</div>
      <button onClick={() => setAdding(true)} style={ops6Btn(true)}>+ New RFP matrix</button>
      {(rfps || []).map(r => {
        const done = r.reqs.filter(q => q.ok).length;
        return (
          <div key={r.id} className="glass" style={{ padding: '13px 14px', borderRadius: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>{r.title}</span>
              <span className="mono" style={{ fontSize: 11, color: done === r.reqs.length ? 'var(--status-ok)' : 'var(--brand)' }}>{done}/{r.reqs.length}</span>
            </div>
            <MBar pct={(done / r.reqs.length) * 100} color={done === r.reqs.length ? 'var(--status-ok)' : undefined} />
            <div style={{ marginTop: 9 }}>
              {r.reqs.map((q, i) => (
                <button key={i} onClick={() => toggle(r.id, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%', padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${q.ok ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: q.ok ? 'rgba(52,211,153,0.15)' : 'transparent', color: 'var(--status-ok)', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{q.ok ? '✓' : ''}</span>
                  <span style={{ fontSize: 12, color: q.ok ? 'var(--text-low)' : 'var(--text-high)', lineHeight: 1.4 }}>{q.t}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {(rfps || []).length === 0 && <OPS6_EMPTY>No RFP matrices yet — paste a solicitation's requirements and check off compliance as you draft.</OPS6_EMPTY>}
      {adding && (
        <MSheet title="New RFP matrix" onClose={() => setAdding(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><span style={ops6Lbl}>RFP title</span><input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Riverside Plaza access control RFP" style={ops6Inp} /></div>
            <div><span style={ops6Lbl}>Requirements — one per line</span><textarea rows={7} value={f.reqs} onChange={e => setF(p => ({ ...p, reqs: e.target.value }))} placeholder={'Proof of PA license\n3 references\nBAFO pricing sheet\n…'} style={{ ...ops6Inp, resize: 'vertical' }} /></div>
            <button onClick={save} style={ops6Btn(true)}>Create matrix</button>
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* ══════════════ SCHEDULING COPILOT — real suggestions from the week ══════════════ */
function MCopilotFull({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const all = jobs || [];
  const unassigned = all.filter(j => !j.techs || j.techs.length === 0);
  const byTech = {};
  all.forEach(j => (j.techs || []).forEach(t => { byTech[t] = byTech[t] || []; byTech[t].push(j); }));
  const overlaps = [];
  Object.entries(byTech).forEach(([t, js]) => {
    js.forEach((a, i) => js.slice(i + 1).forEach(b => {
      if (a.day === b.day && a.start < b.start + b.dur && b.start < a.start + a.dur) overlaps.push({ t, a, b });
    }));
  });
  const loads = Object.entries(byTech).map(([t, js]) => [t, js.reduce((s, j) => s + (j.dur || 0), 0)]).sort((x, y) => y[1] - x[1]);
  const busiest = loads[0], lightest = loads[loads.length - 1];
  const assign = (job, tech) => { jobStore.set(prev => prev.map(j => j.id === job.id ? { ...j, techs: [tech] } : j)); showToast(`${job.title} → ${tech}`, 'ok'); };
  const techIds = Object.keys(window.M_TECH_COLORS || { MR: 1, JL: 1, KW: 1, DP: 1, TG: 1 });
  const sugg = (icon, title, sub, action) => (
    <div className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.35 }}>{title}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      {action}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <OpsKpis items={[['JOBS THIS WK', all.length, 'var(--brand)'], ['UNASSIGNED', unassigned.length, unassigned.length ? 'var(--status-warn)' : 'var(--status-ok)'], ['CONFLICTS', overlaps.length, overlaps.length ? 'var(--status-critical)' : 'var(--status-ok)']]} />
      {all.length === 0 && <OPS6_EMPTY>No jobs on the schedule yet — the copilot reviews your week and flags gaps, conflicts and overloads the moment jobs exist.</OPS6_EMPTY>}
      {unassigned.map(j => sugg('◌', `“${j.title}” has no tech assigned`, `Day ${j.day} · ${window.mFmtH ? window.mFmtH(j.start) : j.start}`, (
        <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          {techIds.slice(0, 5).map(t => <button key={t} onClick={() => assign(j, t)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ {t}</button>)}
        </div>
      )))}
      {overlaps.map((o, i) => sugg('⚠', `${o.t} is double-booked`, `“${o.a.title}” overlaps “${o.b.title}” on day ${o.a.day}`, (
        <button onClick={() => onNav && onNav('calendar')} style={{ ...ops6Btn(false), width: '100%', marginTop: 9, padding: '8px 0', fontSize: 11.5, color: 'var(--brand)' }}>Open schedule to resolve →</button>
      )))}
      {busiest && lightest && busiest[0] !== lightest[0] && busiest[1] - lightest[1] >= 4 &&
        sugg('⚖', `Load imbalance: ${busiest[0]} has ${busiest[1]}h, ${lightest[0]} has ${lightest[1]}h`, 'Consider moving a job to balance drive-time and overtime', null)}
      {all.length > 0 && unassigned.length === 0 && overlaps.length === 0 &&
        sugg('✅', 'The week looks clean', 'Every job has a tech and no one is double-booked', null)}
    </div>
  );
}

/* ══════════════ SECURITY INTEL — derived from live incident/ticket data ══════════════ */
function MIntelFull({ onNav }) {
  const [incidents] = useShieldStore(incidentStore);
  const [tickets] = useShieldStore(ticketStore);
  const inc = incidents || [], tk = tickets || [];
  const openInc = inc.filter(i => i.status !== 'resolved');
  const bySite = {};
  [...inc, ...tk].forEach(x => { const s = x.site || x.customer || 'Unknown'; bySite[s] = (bySite[s] || 0) + 1; });
  const hot = Object.entries(bySite).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['OPEN INCIDENTS', openInc.length, openInc.length ? 'var(--status-critical)' : 'var(--status-ok)'], ['TICKETS', tk.length, 'var(--brand)'], ['SITES TRACKED', hot.length, 'var(--text-mid)']]} />
      <MSection title="Hottest sites — incidents + tickets" />
      {hot.map(([site, n]) => (
        <div key={site} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{site}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--status-warn)' }}>{n} event{n === 1 ? '' : 's'}</span>
          </div>
          <MBar pct={(n / (hot[0][1] || 1)) * 100} color="var(--status-warn)" />
        </div>
      ))}
      {hot.length === 0 && <OPS6_EMPTY>No incident history yet — patterns appear here as tickets and incidents accumulate.</OPS6_EMPTY>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MActionBtn label="Incidents" icon="warroom" onClick={() => onNav && onNav('incidents')} />
        <MActionBtn label="Monitoring" icon="topology" onClick={() => onNav && onNav('cameras')} />
      </div>
    </div>
  );
}

/* ══════════════ MARGIN X-RAY — real project billing margins ══════════════ */
function MMarginXRayFull({ onNav }) {
  const [projects] = useShieldStore(projectStore);
  const inv = useMergedInvoices();
  const rows = (projects || []).map(p => {
    const billed = inv.filter(i => i.project_id === p.number).reduce((s, i) => s + i.amount, 0);
    const contract = Number(p.contract) || 0;
    return { ...p, billed, contract, pct: contract ? Math.min(100, Math.round((billed / contract) * 100)) : 0 };
  }).sort((a, b) => b.contract - a.contract);
  const totC = rows.reduce((s, r) => s + r.contract, 0), totB = rows.reduce((s, r) => s + r.billed, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="CONTRACTED" value={ops6$(totC)} accent="var(--brand)" sub={`${rows.length} project${rows.length === 1 ? '' : 's'}`} />
        <MStat label="BILLED TO DATE" value={ops6$(totB)} accent="var(--status-ok)" sub={totC ? `${Math.round((totB / totC) * 100)}% of contract value` : '—'} />
      </div>
      <MSection title="Billed vs contract, per project" />
      {rows.map(r => (
        <div key={r.number} onClick={() => onNav && onNav('projects')} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{r.name || r.number}</span>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{ops6$(r.billed)} / {ops6$(r.contract)}</span>
          </div>
          <MBar pct={r.pct} color={r.pct >= 100 ? 'var(--status-ok)' : undefined} />
          <div style={{ fontSize: 9.5, color: 'var(--text-low)', marginTop: 4 }}>{r.pct}% billed · {ops6$(Math.max(0, r.contract - r.billed))} remaining</div>
        </div>
      ))}
      {rows.length === 0 && <OPS6_EMPTY>No projects yet — margins appear as estimates convert to projects and progress invoices go out.</OPS6_EMPTY>}
    </div>
  );
}

/* ══════════════ SERVICE REPORTS — build & share after-visit reports ══════════════ */
function MServiceReportsFull() {
  const [jobs] = useShieldStore(jobStore);
  const [f, setF] = React.useState({ job: '', customer: '', work: '', recs: '' });
  const gen = () => {
    if (!f.customer.trim() || !f.work.trim()) { showToast('Add the customer and what was done', 'warn'); return; }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Service Report</title><style>body{font-family:-apple-system,Segoe UI,sans-serif;max-width:700px;margin:0 auto;padding:40px 32px;color:#16202b;line-height:1.5}h1{font-size:22px;border-bottom:3px solid #3FA9F5;padding-bottom:10px}h2{font-size:14px;color:#1d5c96;margin-top:24px}.meta{color:#54636f;font-size:13px}</style></head><body><h1>ShieldTech Service Report</h1><div class="meta">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · ${f.job || 'Service visit'}</div><h2>Customer</h2><p>${f.customer}</p><h2>Work performed</h2><p>${f.work.replace(/\n/g, '<br/>')}</p>${f.recs.trim() ? `<h2>Recommendations</h2><p>${f.recs.replace(/\n/g, '<br/>')}</p>` : ''}<h2>Technician</h2><p>${(window.__shieldUser || {}).name || 'ShieldTech Solutions'} · (215) 555-0100</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ShieldTech-Report-${f.customer.replace(/\W+/g, '-')}.html`; a.click(); URL.revokeObjectURL(a.href);
    showToast('Report downloaded — print to PDF or email it', 'ok');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <MSection title="Build an after-visit report" />
      <div><span style={ops6Lbl}>Job (optional)</span>
        <select value={f.job} onChange={e => setF(p => ({ ...p, job: e.target.value }))} style={{ ...ops6Inp, appearance: 'auto' }}>
          <option value="">— pick from this week —</option>
          {(jobs || []).map(j => <option key={j.id} value={j.title}>{j.title}</option>)}
        </select></div>
      <div><span style={ops6Lbl}>Customer</span><input value={f.customer} onChange={e => setF(p => ({ ...p, customer: e.target.value }))} placeholder="Acme Dental — Cherry Hill" style={ops6Inp} /></div>
      <div><span style={ops6Lbl}>Work performed</span><textarea rows={5} value={f.work} onChange={e => setF(p => ({ ...p, work: e.target.value }))} placeholder="Replaced NVR hard drive, verified all 12 cameras recording…" style={{ ...ops6Inp, resize: 'vertical' }} /></div>
      <div><span style={ops6Lbl}>Recommendations (optional)</span><textarea rows={3} value={f.recs} onChange={e => setF(p => ({ ...p, recs: e.target.value }))} placeholder="Two exterior cameras approaching end-of-life…" style={{ ...ops6Inp, resize: 'vertical' }} /></div>
      <button onClick={gen} style={ops6Btn(true)}>⭳ Generate branded report</button>
    </div>
  );
}

/* ══════════════ SURVEY CLOUD — the survey archive ══════════════ */
function MSurveyCloudFull({ onNav }) {
  const [surveys] = useShieldStore(surveyStore);
  const scans = (window.__shieldStores && window.__shieldStores.sitescans && window.__shieldStores.sitescans.get()) || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['AI SURVEYS', (surveys || []).length, 'var(--brand)'], ['SITE SCANS', scans.length, '#c084fc']]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MActionBtn label="New Survey Scan" icon="survey-ai" primary onClick={() => onNav && onNav('sitescan')} />
        <MActionBtn label="AI Estimator" icon="hermes" onClick={() => onNav && onNav('survey-ai')} />
      </div>
      {(surveys || []).length > 0 && <MSection title="AI survey estimates" />}
      {(surveys || []).map((s, i) => {
        const t = surveyTotals(s);
        return <MRow key={s.id || i} icon="survey-ai" title={s.customer || s.name || `Survey ${i + 1}`} sub={`${(s.bom || []).length} line items · ${t.laborHrs.toFixed(0)}h labor`} right={ops6$(t.price)} onClick={() => onNav && onNav('survey-ai')} />;
      })}
      {scans.length > 0 && <MSection title="3D site scans" style={{ marginTop: 4 }} />}
      {scans.map((s, i) => (
        <MRow key={s.id || i} icon="topology" title={`${s.customer} — ${s.site}`} sub={`${s.created} · ${s.status}`} rightSub={s.source || ''} onClick={() => onNav && onNav('sitescan')} />
      ))}
      {(surveys || []).length === 0 && scans.length === 0 && <OPS6_EMPTY>Every survey and 3D scan your team captures lands here automatically.</OPS6_EMPTY>}
    </div>
  );
}

/* ══════════════ DESIGN STUDIO — blueprint inbox + brand ══════════════ */
function MStudioFull({ onNav }) {
  const [inbox] = useShieldStore(studioInboxStore);
  const brand = (window.brandStore && window.brandStore.get && window.brandStore.get()) || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '14px 15px', borderRadius: 13 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>BRAND</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="logo" style={{ height: 34 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)' }}>{brand.company || 'ShieldTech Solutions LLC'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{brand.email || 'billing@shieldtechsolutions.com'} · {brand.phone || '(215) 555-0100'}</div>
          </div>
        </div>
        <button onClick={() => showToast('Brand identity applies to every invoice, estimate, proposal and report automatically', 'info')} style={{ ...ops6Btn(false), width: '100%', marginTop: 11, padding: '9px 0', fontSize: 11.5 }}>Where this brand appears</button>
      </div>
      <MSection title="Blueprints pushed from Survey Scan" />
      {(inbox || []).map((b, i) => (
        <MRow key={b.id || i} icon="topology" title={b.customer || b.name || `Blueprint ${i + 1}`} sub={b.site || b.created || ''} onClick={() => onNav && onNav('sitescan')} />
      ))}
      {(inbox || []).length === 0 && <OPS6_EMPTY>No blueprints yet — finish a Survey Scan and push it to the studio; it lands here for design work.</OPS6_EMPTY>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MActionBtn label="Survey Scan" icon="survey-ai" onClick={() => onNav && onNav('sitescan')} />
        <MActionBtn label="Proposals" icon="proposals" onClick={() => onNav && onNav('proposals')} />
      </div>
    </div>
  );
}

/* ══════════════ CUSTOMER 360 — picker + live records ══════════════ */
function MCustomerFull({ onNav }) {
  const [customers] = useShieldStore(customerStore);
  const [sel, setSel] = React.useState(null);
  const inv = useMergedInvoices();
  const est = useMergedEstimates();
  const list = customers || [];
  const c = sel || list[0];
  if (!c) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OPS6_EMPTY>No customers yet — add them in Customers or sync QuickBooks, then this becomes each account's 360° view.</OPS6_EMPTY>
      <MActionBtn label="Open Customers" icon="customers" primary onClick={() => onNav && onNav('customers-list')} />
    </div>
  );
  const cInv = inv.filter(i => (i.customer || '').toLowerCase().includes((c.name || '').toLowerCase().slice(0, 12)));
  const cEst = est.filter(i => (i.customer || '').toLowerCase().includes((c.name || '').toLowerCase().slice(0, 12)));
  const open = cInv.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select value={c.id || c.name} onChange={e => setSel(list.find(x => (x.id || x.name) === e.target.value))} style={{ ...ops6Inp, appearance: 'auto', fontWeight: 600 }}>
        {list.map(x => <option key={x.id || x.name} value={x.id || x.name}>{x.name}</option>)}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="OPEN A/R" value={ops6$(open)} accent={open ? 'var(--status-warn)' : 'var(--status-ok)'} sub={`${cInv.length} invoices total`} />
        <MStat label="ESTIMATES" value={cEst.length} accent="var(--brand)" sub={`${cEst.filter(e2 => e2.status === 'accepted').length} accepted`} />
      </div>
      {(c.phone || c.email) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {c.phone && <a href={`tel:${c.phone}`} style={{ ...ops6Btn(false), textAlign: 'center', textDecoration: 'none', color: 'var(--brand)', borderColor: 'var(--border-strong)' }}>📞 Call</a>}
          {c.email && <a href={`mailto:${c.email}`} style={{ ...ops6Btn(false), textAlign: 'center', textDecoration: 'none', color: 'var(--brand)', borderColor: 'var(--border-strong)' }}>✉ Email</a>}
        </div>
      )}
      {cInv.length > 0 && <MSection title="Invoices" />}
      {cInv.slice(0, 6).map((i, ix) => <MRow key={ix} icon="finance" title={i.num} sub={`${i.status} · due ${i.due}`} right={ops6$(i.amount)} onClick={() => onNav && onNav('invoices')} />)}
      {cEst.length > 0 && <MSection title="Estimates" style={{ marginTop: 2 }} />}
      {cEst.slice(0, 6).map((i, ix) => <MRow key={ix} icon="proposals" title={i.num} sub={i.status} right={ops6$(i.amount)} onClick={() => onNav && onNav('estimates')} />)}
      <MActionBtn label="Full customer record" icon="customers" onClick={() => onNav && onNav('customers-list')} />
    </div>
  );
}

/* ══════════════ TIMELINE — every touchpoint, in order ══════════════ */
function MTimelineFull({ onNav }) {
  const inv = useMergedInvoices();
  const est = useMergedEstimates();
  const [projects] = useShieldStore(projectStore);
  const events = [
    ...inv.map(i => ({ when: i._raw.txn_date || '', icon: '💵', text: `Invoice ${i.num} — ${i.customer}`, sub: `${ops6$(i.amount)} · ${i.status}`, to: 'invoices' })),
    ...est.map(e => ({ when: e._raw.txn_date || '', icon: '📄', text: `Estimate ${e.num} — ${e.customer}`, sub: `${ops6$(e.amount)} · ${e.status}`, to: 'estimates' })),
    ...(projects || []).map(p => ({ when: p.created || '', icon: '🏗', text: `Project ${p.number} — ${p.name || ''}`, sub: ops6$(p.contract), to: 'projects' })),
  ].filter(e => e.when).sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 40);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <MSection title="Business timeline — newest first" />
      {events.map((e, i) => (
        <div key={i} onClick={() => onNav && onNav(e.to)} className="glass" style={{ display: 'flex', gap: 11, padding: '11px 13px', borderRadius: 12, cursor: 'pointer', alignItems: 'center' }}>
          <span style={{ fontSize: 15 }}>{e.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.text}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.sub}</div>
          </div>
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)', flexShrink: 0 }}>{String(e.when).slice(0, 10)}</span>
        </div>
      ))}
      {events.length === 0 && <OPS6_EMPTY>Activity appears here as invoices, estimates and projects are created.</OPS6_EMPTY>}
    </div>
  );
}

/* Override the intro-style entries with the full native tools. */
Object.assign(window.M_OPS5 || {}, {
  expenses: MExpensesFull,
  roi: MROIFull,
  'rr-builder': MRRBuilderFull,
  'service-plans': MServicePlansFull,
  statuspage: MStatusPageFull,
  marketing: MMarketingFull,
  onboarding: MOnboardingFull,
  rfp: MRFPFull,
  copilot: MCopilotFull,
  intel: MIntelFull,
  'margin-xray': MMarginXRayFull,
  'service-reports': MServiceReportsFull,
  'survey-cloud': MSurveyCloudFull,
  studio: MStudioFull,
  customer: MCustomerFull,
  timeline: MTimelineFull,
});

Object.assign(window, { MReceiptSnap, MReceiptThumb, MExpensesFull, MROIFull, MRRBuilderFull, MServicePlansFull, MStatusPageFull, MMarketingFull, MOnboardingFull, MRFPFull, MCopilotFull, MIntelFull, MMarginXRayFull, MServiceReportsFull, MSurveyCloudFull, MStudioFull, MCustomerFull, MTimelineFull, mPlanStore, mStatusStore, mExpenseStore, mCampaignStore, mOnboardStore, mRfpStore });

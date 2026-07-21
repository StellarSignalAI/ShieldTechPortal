/* ShieldTech Mobile — Builders (real, persistent, mobility-optimized)
   • Proposal Builder — create/edit proposals block-by-block, live pricing → proposalStore
   • Survey Report Builder — capture site, AI-detect, edit BOM, price → surveyStore, convert to proposal
   Everything saves to a shared store, so it persists and syncs to the desktop portal. */

const PROP_STATUS2 = { draft:'var(--text-low)', sent:'var(--brand)', accepted:'var(--status-ok)', declined:'var(--status-critical)' };
const PB_BLOCK_TYPES = [
  ['cover', 'Cover Page'], ['intro', 'Introduction'], ['scope', 'Scope of Work'],
  ['pricing', 'Pricing Table'], ['options', 'Packages'], ['about', 'About / Team'],
  ['testimonial', 'Testimonial'], ['text', 'Text Block'], ['terms', 'Terms'],
  ['signature', 'Signature Block'],
];
const pbLabel = (t) => (PB_BLOCK_TYPES.find(b => b[0] === t) || [t, t])[1];
const mbInput = { width: '100%', padding: '10px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
const mbLabel = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };

/* ════════════ PROPOSALS LIST ════════════ */
function MProposals({ onNav }) {
  const [proposals] = useShieldStore(proposalStore);
  const [filter, setFilter] = React.useState('All');
  const [buildId, setBuildId] = React.useState(null);   // 'new' | id | null
  const list = filter === 'All' ? proposals : proposals.filter(p => p.status === filter.toLowerCase());
  const pipeline = proposals.filter(p => p.status === 'sent').reduce((s, p) => s + proposalValue(p.blocks), 0);
  const won = proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + proposalValue(p.blocks), 0);

  if (buildId) return <MProposalBuilder id={buildId === 'new' ? null : buildId} onClose={() => setBuildId(null)} onNav={onNav} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['OUT', `$${(pipeline / 1000).toFixed(0)}K`, 'var(--brand)'], ['WON', `$${(won / 1000).toFixed(0)}K`, 'var(--status-ok)'], ['TOTAL', proposals.length, 'var(--text-high)']]} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, overflowX: 'auto' }}><MSegment options={['All', 'Draft', 'Sent', 'Accepted', 'Declined']} value={filter} onChange={setFilter} /></div>
        <button onClick={() => setBuildId('new')} style={{ padding: '0 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0, whiteSpace: 'nowrap' }}>+ Build</button>
      </div>
      {list.map(p => {
        const val = proposalValue(p.blocks);
        return (
          <div key={p.id} onClick={() => setBuildId(p.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${PROP_STATUS2[p.status]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.id}</span>
              <MBadge color={PROP_STATUS2[p.status]}>{p.status}</MBadge>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${(val / 1000).toFixed(0)}K</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{p.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{p.customer} · {(p.blocks || []).length} sections · {p.viewed ? `viewed ${p.viewTime}` : 'not opened'}</div>
          </div>
        );
      })}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No {filter.toLowerCase()} proposals. Tap <strong>+ Build</strong> to create one.</div>}
    </div>
  );
}

/* ════════════ PROPOSAL BUILDER ════════════ */
function MProposalBuilder({ id, onClose, onNav }) {
  const [allCusts] = useShieldStore(customerStore);
  const [store] = useShieldStore(proposalStore);
  const existing = id ? store.find(p => p.id === id) : null;
  const [draft, setDraft] = React.useState(() => existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: 'PROP-' + (Math.floor(Math.random() * 600) + 320), customer: '', title: '', status: 'draft', created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), viewed: false, viewTime: '—', blocks: defaultProposalBlocks('', '') });
  const [openBlk, setOpenBlk] = React.useState('cover');
  const [addOpen, setAddOpen] = React.useState(false);
  const [preview, setPreview] = React.useState(false);
  const value = proposalValue(draft.blocks);

  const setBlocks = (fn) => setDraft(d => ({ ...d, blocks: fn(d.blocks) }));
  const updateBlock = (bid, contentPatch) => setBlocks(bs => bs.map(b => b.id === bid ? { ...b, content: { ...b.content, ...contentPatch } } : b));
  const move = (bid, dir) => setBlocks(bs => { const i = bs.findIndex(b => b.id === bid); const j = i + dir; if (j < 0 || j >= bs.length) return bs; const n = [...bs]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (bid) => setBlocks(bs => bs.filter(b => b.id !== bid));
  const add = (type) => { const nb = { id: type + '-' + Date.now(), type, content: type === 'scope' ? { items: ['New scope item'] } : type === 'pricing' ? { items: [{ desc: 'New line item', qty: 1, rate: 0 }] } : type === 'cover' ? { heading: draft.customer, subtitle: draft.title, date: draft.created } : { text: '' } }; setBlocks(bs => [...bs, nb]); setAddOpen(false); setOpenBlk(nb.id); };

  const save = (sendIt) => {
    if (!draft.customer.trim()) { showToast('Add a customer first', 'warn'); return; }
    const rec = { ...draft, title: draft.title || 'Security System Proposal', status: sendIt ? 'sent' : draft.status };
    // keep cover synced to header fields
    rec.blocks = rec.blocks.map(b => b.type === 'cover' ? { ...b, content: { ...b.content, heading: rec.customer, subtitle: rec.title } } : b);
    proposalStore.set(list => existing ? list.map(p => p.id === draft.id ? rec : p) : [rec, ...list]);
    showToast(sendIt ? `${rec.id} sent to ${rec.customer} — synced` : `${rec.id} saved — synced`, 'ok');
    onClose();
  };

  if (preview) return <MProposalPreview draft={draft} value={value} onBack={() => setPreview(false)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Builder header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{existing ? 'Edit Proposal' : 'New Proposal'}</span>
        <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-ok)' }}>${value.toLocaleString()}</span>
      </div>

      <div className="glass" style={{ padding: '12px 13px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label><span style={mbLabel}>Customer *</span>
          <input list="mb-custs" value={draft.customer} onChange={e => setDraft(d => ({ ...d, customer: e.target.value }))} placeholder="Select or type…" style={mbInput} />
          <datalist id="mb-custs">{allCusts.map(c => <option key={c.id} value={c.name} />)}</datalist>
        </label>
        <label><span style={mbLabel}>Proposal Title</span>
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. 12-Camera CCTV + Access Control" style={mbInput} />
        </label>
      </div>

      {/* Section list */}
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>Sections ({draft.blocks.length})</span><span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>tap to edit</span>
      </div>
      {draft.blocks.map((b, i) => (
        <div key={b.id} className="glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div onClick={() => setOpenBlk(openBlk === b.id ? null : b.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', cursor: 'pointer' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(63,169,245,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{pbLabel(b.type)}{b.type === 'pricing' ? <span className="mono" style={{ color: 'var(--text-low)', fontWeight: 400, fontSize: 11 }}> · ${proposalValue([b]).toLocaleString()}</span> : ''}</span>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => move(b.id, -1)} disabled={i === 0} style={mbIcon(i === 0)}>↑</button>
              <button onClick={() => move(b.id, 1)} disabled={i === draft.blocks.length - 1} style={mbIcon(i === draft.blocks.length - 1)}>↓</button>
              {b.type !== 'cover' && <button onClick={() => remove(b.id)} style={{ ...mbIcon(false), color: 'var(--status-critical)', borderColor: 'rgba(244,63,94,0.3)' }}>✕</button>}
              <span style={{ color: 'var(--text-low)', fontSize: 14, marginLeft: 2, transform: openBlk === b.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
            </div>
          </div>
          {openBlk === b.id && <div style={{ padding: '0 13px 13px', borderTop: '1px solid var(--border-subtle)' }}><PBBlockEditor block={b} update={(patch) => updateBlock(b.id, patch)} /></div>}
        </div>
      ))}

      <button onClick={() => setAddOpen(true)} style={{ padding: '11px 0', background: 'rgba(63,169,245,0.06)', border: '1px dashed var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add section</button>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setPreview(true)} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
        <button onClick={() => save(false)} style={{ flex: 1, padding: '12px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
        <button onClick={() => save(true)} style={{ flex: 1.4, padding: '12px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save & Send</button>
      </div>

      {addOpen && (
        <MSheet title="Add Section" onClose={() => setAddOpen(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PB_BLOCK_TYPES.filter(t => t[0] !== 'cover').map(([type, label]) => (
              <button key={type} onClick={() => add(type)} className="glass" style={{ padding: '13px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: 'var(--text-high)', border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', textAlign: 'left' }}>{label}</button>
            ))}
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* Per-block editor */
function PBBlockEditor({ block, update }) {
  const b = block;
  if (b.type === 'cover') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 11 }}>
      <label><span style={mbLabel}>Heading</span><input value={b.content.heading || ''} onChange={e => update({ heading: e.target.value })} style={mbInput} /></label>
      <label><span style={mbLabel}>Subtitle</span><input value={b.content.subtitle || ''} onChange={e => update({ subtitle: e.target.value })} style={mbInput} /></label>
      <label><span style={mbLabel}>Date</span><input value={b.content.date || ''} onChange={e => update({ date: e.target.value })} style={mbInput} /></label>
    </div>
  );
  if (['intro', 'about', 'terms', 'text', 'testimonial'].includes(b.type)) return (
    <div style={{ paddingTop: 11 }}>
      <span style={mbLabel}>Text</span>
      <textarea value={b.content.text || ''} onChange={e => update({ text: e.target.value })} rows={5} style={{ ...mbInput, resize: 'vertical', minHeight: 90 }} />
    </div>
  );
  if (b.type === 'scope') {
    const items = b.content.items || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 11 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 7 }}>
            <input value={it} onChange={e => update({ items: items.map((x, k) => k === i ? e.target.value : x) })} style={{ ...mbInput, flex: 1 }} />
            <button onClick={() => update({ items: items.filter((_, k) => k !== i) })} style={{ ...mbIcon(false), color: 'var(--status-critical)', borderColor: 'rgba(244,63,94,0.3)', flexShrink: 0 }}>✕</button>
          </div>
        ))}
        <button onClick={() => update({ items: [...items, 'New item'] })} style={{ padding: '8px 0', background: 'rgba(63,169,245,0.05)', border: '1px dashed var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add item</button>
      </div>
    );
  }
  if (b.type === 'pricing') {
    const items = b.content.items || [];
    const setItem = (i, patch) => update({ items: items.map((x, k) => k === i ? { ...x, ...patch } : x) });
    const total = items.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.rate) || 0), 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 11 }}>
        {items.map((it, i) => (
          <div key={i} className="glass" style={{ padding: '9px 10px', borderRadius: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={it.desc} onChange={e => setItem(i, { desc: e.target.value })} placeholder="Description" style={{ ...mbInput, flex: 1, padding: '7px 9px', fontSize: 12 }} />
              <button onClick={() => update({ items: items.filter((_, k) => k !== i) })} style={{ ...mbIcon(false), color: 'var(--status-critical)', borderColor: 'rgba(244,63,94,0.3)', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Qty</span>
              <input type="number" value={it.qty} onChange={e => setItem(i, { qty: e.target.value })} style={{ ...mbInput, width: 56, padding: '6px 8px', fontSize: 12 }} />
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>× $</span>
              <input type="number" value={it.rate} onChange={e => setItem(i, { rate: e.target.value })} style={{ ...mbInput, width: 76, padding: '6px 8px', fontSize: 12 }} />
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>${((Number(it.qty) || 0) * (Number(it.rate) || 0)).toLocaleString()}</span>
            </div>
          </div>
        ))}
        <button onClick={() => update({ items: [...items, { desc: 'New line item', qty: 1, rate: 0 }] })} style={{ padding: '8px 0', background: 'rgba(63,169,245,0.05)', border: '1px dashed var(--border-subtle)', borderRadius: 8, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add line</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 2px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>Total</span>
          <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-ok)' }}>${total.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  if (b.type === 'options') {
    const tiers = b.content.tiers || [{ name: 'Essential', price: 0, items: [] }, { name: 'Professional', price: 0, recommended: true, items: [] }];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 11 }}>
        {tiers.map((t, i) => (
          <div key={i} className="glass" style={{ padding: '10px 12px', borderRadius: 9, border: t.recommended ? '1px solid var(--brand)' : '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={t.name} onChange={e => update({ tiers: tiers.map((x, k) => k === i ? { ...x, name: e.target.value } : x) })} style={{ ...mbInput, flex: 1, padding: '6px 8px', fontSize: 12 }} />
              <input type="number" value={t.price} onChange={e => update({ tiers: tiers.map((x, k) => k === i ? { ...x, price: Number(e.target.value) } : x) })} style={{ ...mbInput, width: 90, padding: '6px 8px', fontSize: 12 }} />
            </div>
            {t.recommended && <span style={{ fontSize: 9, color: 'var(--brand)', fontWeight: 600 }}>★ RECOMMENDED</span>}
          </div>
        ))}
      </div>
    );
  }
  if (b.type === 'signature') return <div style={{ paddingTop: 11, fontSize: 12, color: 'var(--text-low)' }}>E-signature block — the client signs here in the sent proposal. Deposit terms pulled from the Terms section.</div>;
  return <div style={{ paddingTop: 11, fontSize: 12, color: 'var(--text-low)' }}>Editable in the desktop builder.</div>;
}
const mbIcon = (disabled) => ({ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--border-subtle)', color: disabled ? 'var(--text-low)' : 'var(--text-mid)', fontSize: 12, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: disabled ? 0.35 : 1 });

/* Proposal preview (client-facing render) */
function MProposalPreview({ draft, value, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>Preview</span>
        <MBadge>client view</MBadge>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', color: '#0d1420' }}>
        {draft.blocks.map(b => {
          if (b.type === 'cover') return (
            <div key={b.id} style={{ padding: '34px 22px', background: 'linear-gradient(135deg, #0d1420, #16243a)', color: '#fff' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', opacity: 0.6, marginBottom: 10 }}>SHIELDTECH SOLUTIONS</div>
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15 }}>{b.content.heading || draft.customer}</div>
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>{b.content.subtitle || draft.title}</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 14 }}>{b.content.date}</div>
            </div>
          );
          const Heading = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#2A6FDB', textTransform: 'uppercase', marginBottom: 8 }}>{children}</div>;
          if (['intro', 'about', 'terms', 'text', 'testimonial'].includes(b.type)) return <div key={b.id} style={{ padding: '18px 22px', borderBottom: '1px solid #eef' }}><Heading>{pbLabel(b.type)}</Heading><div style={{ fontSize: 13, lineHeight: 1.6, color: '#33405a' }}>{b.content.text}</div></div>;
          if (b.type === 'scope') return <div key={b.id} style={{ padding: '18px 22px', borderBottom: '1px solid #eef' }}><Heading>Scope of Work</Heading>{(b.content.items || []).map((it, i) => <div key={i} style={{ fontSize: 13, color: '#33405a', padding: '3px 0', display: 'flex', gap: 8 }}><span style={{ color: '#1F8A5B' }}>✓</span>{it}</div>)}</div>;
          if (b.type === 'pricing') { const t = proposalValue([b]); return <div key={b.id} style={{ padding: '18px 22px', borderBottom: '1px solid #eef' }}><Heading>Pricing</Heading>{(b.content.items || []).map((li, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#33405a', padding: '5px 0', borderBottom: '1px solid #f3f5fa' }}><span>{li.desc}{li.qty > 1 ? ` (${li.qty}×)` : ''}</span><span style={{ fontWeight: 600 }}>${((Number(li.qty) || 0) * (Number(li.rate) || 0)).toLocaleString()}</span></div>)}<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#0d1420', paddingTop: 9 }}><span>Total</span><span>${t.toLocaleString()}</span></div></div>; }
          if (b.type === 'options') return <div key={b.id} style={{ padding: '18px 22px', borderBottom: '1px solid #eef' }}><Heading>Packages</Heading><div style={{ display: 'flex', gap: 8 }}>{(b.content.tiers || []).map((t, i) => <div key={i} style={{ flex: 1, border: t.recommended ? '2px solid #2A6FDB' : '1px solid #dde', borderRadius: 10, padding: 11 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#0d1420' }}>{t.name}</div><div style={{ fontSize: 16, fontWeight: 700, color: '#2A6FDB', margin: '4px 0' }}>${(t.price / 1000).toFixed(1)}K</div>{(t.items || []).map((x, k) => <div key={k} style={{ fontSize: 10, color: '#5a6b85' }}>· {x}</div>)}</div>)}</div></div>;
          if (b.type === 'signature') return <div key={b.id} style={{ padding: '22px' }}><Heading>Acceptance</Heading><div style={{ borderBottom: '1.5px solid #33405a', height: 34, marginBottom: 4 }}></div><div style={{ fontSize: 10, color: '#8090a8' }}>Authorized signature & date</div></div>;
          return null;
        })}
      </div>
    </div>
  );
}

Object.assign(window, { MProposals, MProposalBuilder });

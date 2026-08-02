/* Proposal Builder V2 — REAL block builder on proposalStore.
   Every proposal here is the same record mobile's MProposalBuilder edits
   (shared synced store). Sending bridges into the money-doc pipeline via
   proposalToDoc (same PROP- number) so accept → project → invoice works. */

function ProposalScreen() {
  const [view, setView] = React.useState('list');
  const [activeId, setActiveId] = React.useState(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [topTab, setTopTab] = React.useState('proposals'); // proposals | tools…
  const [all] = useShieldStore(proposalStore);

  const proposals = (all || []).map(p => ({ ...p, value: proposalValue(p.blocks) }));

  const newProposal = () => {
    const customer = window.prompt('Customer name for this proposal:', '');
    if (customer === null) return;
    const title = window.prompt('Proposal title:', 'Security System Proposal') || 'Security System Proposal';
    const rec = {
      id: nextProposalId(), customer: (customer || 'New Client').trim(), title,
      status: 'draft', created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      viewed: false, viewTime: '—',
      blocks: defaultProposalBlocks((customer || 'New Client').trim(), title),
    };
    proposalStore.set(prev => [rec, ...(prev || [])]);
    setActiveId(rec.id); setView('builder');
  };

  const sendProposal = (p) => {
    const doc = proposalToDoc(p);
    proposalStore.set(prev => (prev || []).map(x => x.id === p.id ? { ...x, status: 'sent', sentAt: Date.now() } : x));
    const api = window.__shieldAcceptance;
    if (api) {
      const email = window.prompt(`Email the acceptance link for ${p.id} ($${proposalValue(p.blocks).toLocaleString()}) to:`, '');
      if (email && email.includes('@')) {
        api.send({ estimateRef: doc.doc_number, estimateQboId: null, customerName: p.customer, customerEmail: email.trim(), amount: proposalValue(p.blocks) })
          .then(r => shieldToast(r && r.ok
            ? (r.data.emailed ? `Proposal ${p.id} sent to ${email.trim()} with a live accept link` : `Accept link created (email not sent: ${r.data.emailError})`)
            : `Could not create accept link: ${(r && r.error) || 'unknown error'}`));
        return;
      }
    }
    shieldToast(`Proposal ${p.id} marked sent — it's now in the pipeline (Finance → Proposals)`, 'ok');
  };

  const toProject = (p) => {
    const doc = proposalToDoc(p);
    const proj = acceptEstimateToProject(doc, 'manual');
    proposalStore.set(prev => (prev || []).map(x => x.id === p.id ? { ...x, status: 'accepted' } : x));
    shieldToast(`${p.id} accepted — project ${proj.number} created with the quote attached`, 'ok');
  };

  if (view === 'builder') {
    return <ProposalBuilderView proposalId={activeId} onBack={() => setView('list')} previewMode={previewMode} setPreviewMode={setPreviewMode} />;
  }

  const proposalTabs = [
    {id:'proposals',l:'Proposals'},
    {id:'studio',l:'Design Studio'},
    {id:'poe',l:'PoE Calculator'},
    {id:'survey',l:'Site Survey'},
    {id:'cable',l:'Cable Calc'},
    {id:'bandwidth',l:'Bandwidth'},
    {id:'labor',l:'Labor Est.'},
    {id:'compare',l:'Competitive'},
    {id:'rmr',l:'RMR Calc'},
  ];

  const toolComponents = {
    studio: () => <StudioScreen onExportToProposal={() => { setTopTab('proposals'); newProposal(); }} />,
    poe: () => <PoECalculatorView />,
    survey: () => <SiteSurveyTool />,
    cable: () => <CableCalculator />,
    bandwidth: () => <BandwidthCalculator />,
    labor: () => <LaborEstimator />,
    compare: () => <CompetitiveComparison />,
    rmr: () => <RMRCalculator />,
  };

  // Tool tabs (non-proposals)
  if (topTab !== 'proposals') {
    const ToolComp = toolComponents[topTab];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 10, flexShrink: 0, overflow: 'auto' }}>
          {proposalTabs.map(t => (
            <button key={t.id} onClick={() => setTopTab(t.id)} style={{
              padding: '6px 14px', fontSize: 11, fontWeight: topTab===t.id?600:400,
              background: topTab===t.id?'rgba(63,169,245,0.1)':'transparent',
              border: 'none', borderBottom: topTab===t.id?'2px solid var(--brand)':'2px solid transparent',
              color: topTab===t.id?'var(--brand)':'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
            }}>{t.l}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {ToolComp ? <ToolComp /> : null}
        </div>
      </div>
    );
  }

  const open = proposals.filter(p => p.status === 'sent');
  const accepted = proposals.filter(p => p.status === 'accepted');
  const decided = proposals.filter(p => p.status === 'accepted' || p.status === 'declined');
  const winRate = decided.length ? Math.round(accepted.length / decided.length * 100) + '%' : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1400 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0, marginBottom: -6, overflow: 'auto' }}>
        {proposalTabs.map(t => (
          <button key={t.id} onClick={() => setTopTab(t.id)} style={{
            padding: '6px 18px', borderRadius: '6px 6px 0 0', fontSize: 12, fontWeight: topTab===t.id?600:400,
            background: topTab===t.id?'rgba(63,169,245,0.1)':'transparent',
            border: 'none', borderBottom: topTab===t.id?'2px solid var(--brand)':'2px solid transparent',
            color: topTab===t.id?'var(--brand)':'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{t.l}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Proposal Builder</h2>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>Create, customize, and send interactive proposals — synced with mobile</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={newProposal} style={{ padding: '7px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Proposal</button>
        </div>
      </div>

      {/* Stats — computed from the real records */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="OPEN PROPOSALS" value={open.length} delay={0} />
        <StatCard label="PIPELINE VALUE" value={`$${(open.reduce((s,p)=>s+p.value,0)/1000).toFixed(0)}K`} mono={false} delay={80} />
        <StatCard label="WIN RATE" value={winRate} mono={false} delay={160} />
        <StatCard label="DRAFTS" value={proposals.filter(p=>!p.status || p.status==='draft').length} delay={240} />
        <StatCard label="ACCEPTED" value={`$${(accepted.reduce((s,p)=>s+p.value,0)/1000).toFixed(0)}K`} mono={false} trend={accepted.length ? `${accepted.length} deal${accepted.length>1?'s':''}` : undefined} delay={320} />
      </div>

      {/* Proposals Table */}
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Proposal','Customer','Title','Value','Status','Created','Actions'].map((h,i) => (
              <th key={i} style={{ textAlign: i===3?'right':'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {proposals.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '26px 14px', fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>
                No proposals yet — hit “+ New Proposal”, or build one from a site survey on mobile and it appears here.
              </td></tr>
            )}
            {proposals.map((p) => (
              <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setActiveId(p.id); setView('builder'); }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{p.id}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{p.customer}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{p.title}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${p.value.toLocaleString()}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <StatusBadge status={p.status==='accepted'?'online':p.status==='sent'?'info':p.status==='declined'?'critical':'draft'} label={p.status || 'draft'} />
                </td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{p.created || '—'}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {p.status === 'accepted' && <button onClick={() => toProject(p)} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Project</button>}
                    {(!p.status || p.status === 'draft') && <button onClick={() => sendProposal(p)} style={{ padding: '3px 8px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send</button>}
                    {p.status === 'sent' && <button onClick={() => toProject(p)} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Accept → Project</button>}
                    <button onClick={() => { if (window.confirm(`Delete ${p.id}?`)) proposalStore.set(prev => (prev || []).filter(x => x.id !== p.id)); }} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 4, color: 'var(--status-critical)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Proposal Builder (3-Pane) — edits persist straight to proposalStore ── */
function ProposalBuilderView({ proposalId, onBack, previewMode, setPreviewMode }) {
  const [all] = useShieldStore(proposalStore);
  const record = (all || []).find(p => p.id === proposalId) || null;
  const blocks = (record && record.blocks) || [];
  const [selectedBlock, setSelectedBlock] = React.useState(blocks[0] ? blocks[0].id : null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [hermesDrawer, setShieldAIDrawer] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);

  const persistBlocks = (updater) => {
    proposalStore.set(prev => (prev || []).map(p => p.id === proposalId
      ? { ...p, blocks: typeof updater === 'function' ? updater(p.blocks || []) : updater }
      : p));
  };
  const patchBlockContent = (blockId, patch) => {
    persistBlocks(bs => bs.map(b => b.id === blockId ? { ...b, content: { ...(b.content || {}), ...patch } } : b));
  };

  const blockTypes = [
    { type: 'cover', label: 'Cover Page', icon: '◉' },
    { type: 'intro', label: 'Introduction', icon: '✎' },
    { type: 'scope', label: 'Scope of Work', icon: '◎' },
    { type: 'pricing', label: 'Pricing Table', icon: '⊞' },
    { type: 'options', label: 'Packages', icon: '◈' },
    { type: 'about', label: 'About / Team', icon: '◇' },
    { type: 'text', label: 'Text Block', icon: '¶' },
    { type: 'divider', label: 'Divider', icon: '—' },
    { type: 'terms', label: 'Terms & Conditions', icon: '⊡' },
    { type: 'deposit', label: 'Deposit / Payment', icon: '⊛' },
    { type: 'signature', label: 'Signature Block', icon: '✍' },
  ];
  const typeLabel = (t) => (blockTypes.find(b => b.type === t) || {}).label || t;

  const addBlock = (type) => {
    const newBlock = { id: `block-${Date.now()}`, type, title: typeLabel(type), content: type === 'scope' ? { items: [] } : type === 'pricing' ? { items: [] } : {} };
    persistBlocks(bs => [...bs, newBlock]);
    setSelectedBlock(newBlock.id);
  };
  const removeBlock = (id) => {
    persistBlocks(bs => bs.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(blocks[0] && blocks[0].id !== id ? blocks[0].id : null);
  };
  const moveBlock = (id, dir) => {
    persistBlocks(bs => {
      const idx = bs.findIndex(b => b.id === id);
      if ((dir === -1 && idx <= 0) || (dir === 1 && idx === bs.length - 1) || idx === -1) return bs;
      const next = [...bs];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next;
    });
  };

  const total = proposalValue(blocks);
  const sel = blocks.find(b => b.id === selectedBlock);

  const exportPdf = () => {
    if (!window.__shieldPdf) { shieldToast('Export unavailable'); return; }
    const sections = blocks
      .filter(b => ['intro','about','text','terms'].includes(b.type) && b.content && b.content.text)
      .map(b => ({ title: b.title || typeLabel(b.type), body: b.content.text }));
    const scope = blocks.find(b => b.type === 'scope');
    if (scope && (scope.content.items || []).length) sections.push({ title: 'Scope of Work', body: scope.content.items.map(i => '• ' + i).join('\n') });
    const pricing = blocks.find(b => b.type === 'pricing');
    window.__shieldPdf.exportDoc({
      kind: 'proposal', number: proposalId, customer: (record && record.customer) || '',
      date: new Date().toLocaleDateString(),
      sections: sections.length ? sections : [{ title: (record && record.title) || 'Proposal', body: '' }],
      lineItems: pricing ? (pricing.content.items || []) : [],
      total,
    });
  };

  const doSend = () => {
    if (!record) return;
    const doc = proposalToDoc(record);
    proposalStore.set(prev => (prev || []).map(x => x.id === proposalId ? { ...x, status: 'sent', sentAt: Date.now() } : x));
    const api = window.__shieldAcceptance;
    if (api) {
      const email = window.prompt(`Email the acceptance link for ${proposalId} ($${total.toLocaleString()}) to:`, '');
      if (email && email.includes('@')) {
        api.send({ estimateRef: doc.doc_number, estimateQboId: null, customerName: record.customer, customerEmail: email.trim(), amount: total })
          .then(r => shieldToast(r && r.ok
            ? (r.data.emailed ? `Sent to ${email.trim()} with a live accept link` : `Accept link created (email not sent: ${r.data.emailError})`)
            : `Could not create accept link: ${(r && r.error) || 'unknown error'}`));
        return;
      }
    }
    shieldToast(`${proposalId} marked sent — now in the pipeline`, 'ok');
  };

  const aiRewrite = async (block, instruction) => {
    const ai = window.__shieldAI;
    if (!ai || !ai.askShieldAI) { shieldToast('AI backend not configured'); return; }
    setAiBusy(true);
    try {
      const prompt = `${instruction}\n\nCustomer: ${(record && record.customer) || ''}\nProposal: ${(record && record.title) || ''}\nCurrent text:\n${(block && block.content && block.content.text) || '(empty)'}\n\nReply with ONLY the new text, no preamble.`;
      const r = await ai.askShieldAI('proposal-assist', [{ role: 'user', content: prompt }]);
      const text = r && r.text;
      if (text && block) { patchBlockContent(block.id, { text: String(text).trim() }); shieldToast('Section rewritten ✓', 'ok'); }
      else shieldToast('AI did not return text');
    } catch (e) { shieldToast('AI error: ' + (e.message || e)); }
    setAiBusy(false);
  };

  if (!record) {
    return (
      <div style={{ padding: 40 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
        <div style={{ marginTop: 16, color: 'var(--text-mid)', fontSize: 13 }}>Proposal not found — it may have been deleted on another device.</div>
      </div>
    );
  }

  if (previewMode) {
    return <ProposalClientView blocks={blocks} onBack={() => setPreviewMode(false)} customer={record.customer || 'Client'} total={total}
      onAccept={() => { setPreviewMode(false); const doc = proposalToDoc(record); const proj = acceptEstimateToProject(doc, 'manual'); proposalStore.set(prev => (prev || []).map(x => x.id === proposalId ? { ...x, status: 'accepted' } : x)); shieldToast(`${proposalId} accepted — project ${proj.number} created`, 'ok'); }} />;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 76px)', overflow: 'hidden', gap: 0 }}>
      {/* Left: Block Palette */}
      <div style={{ width: 200, background: 'var(--card)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>saved ✓</span>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>ADD BLOCKS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflow: 'auto' }}>
            {blockTypes.map(bt => (
              <button key={bt.type} onClick={() => addBlock(bt.type)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'transparent', border: '1px solid transparent', borderRadius: 4, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='transparent'}>
                <span style={{ fontSize: 12, opacity: 0.5, width: 16, textAlign: 'center' }}>{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '10px 12px', flex: 1, overflow: 'auto' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>PROPOSAL OUTLINE</div>
          {blocks.map((b) => (
            <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', marginBottom: 2,
              background: selectedBlock === b.id ? 'rgba(63,169,245,0.08)' : 'transparent',
              border: `1px solid ${selectedBlock === b.id ? 'var(--brand)' : 'transparent'}`,
              color: selectedBlock === b.id ? 'var(--brand)' : 'var(--text-mid)'
            }}>
              <span style={{ fontSize: 10, opacity: 0.5, width: 14 }}>{(blockTypes.find(bt=>bt.type===b.type)||{}).icon}</span>
              <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title || typeLabel(b.type)}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={e=>{e.stopPropagation();moveBlock(b.id,-1)}} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 8, cursor: 'pointer', padding: '1px 3px' }}>▲</button>
                <button onClick={e=>{e.stopPropagation();moveBlock(b.id,1)}} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 8, cursor: 'pointer', padding: '1px 3px' }}>▼</button>
                <button onClick={e=>{e.stopPropagation();removeBlock(b.id)}} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', padding: '1px 3px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {/* ShieldTech AI assist */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setShieldAIDrawer(!hermesDrawer)} style={{ width: '100%', padding: '6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>⟡</span> ShieldTech AI Assist
          </button>
        </div>
      </div>

      {/* Center: Canvas */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: 'rgba(5,7,10,0.3)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="display" style={{ fontSize: 14, fontWeight: 400 }}>{proposalId} · {record.customer}</span>
            <StatusBadge status={record.status==='accepted'?'online':record.status==='sent'?'info':'draft'} label={record.status || 'draft'} />
            <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>${total.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPreviewMode(true)} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
            <button onClick={exportPdf} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Download PDF</button>
            <button onClick={doSend} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send Proposal</button>
          </div>
        </div>

        {/* Rendered blocks */}
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {blocks.map(block => (
            <div key={block.id} onClick={() => setSelectedBlock(block.id)} style={{
              borderRadius: 8, padding: 20, cursor: 'pointer',
              background: 'var(--glass-bg)', border: `1px solid ${selectedBlock === block.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
              boxShadow: selectedBlock === block.id ? 'var(--glow-brand-sm)' : 'none',
              transition: 'all 0.15s', backdropFilter: 'blur(16px)'
            }}>
              <ProposalBlockRenderer block={block} total={total} />
            </div>
          ))}
          {blocks.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>Empty proposal — add blocks from the left palette.</div>
          )}
        </div>
      </div>

      {/* Right: Settings Panel — edits write straight to the block */}
      <div style={{ width: 280, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="label-sm">BLOCK SETTINGS</div>
        </div>
        {sel ? (
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>BLOCK TYPE</div>
              <div style={{ fontSize: 13, color: 'var(--text-high)', fontWeight: 500 }}>{sel.title || typeLabel(sel.type)}</div>
            </div>
            {sel.type === 'cover' && <>
              <PropField label="Heading" value={sel.content.heading || ''} onChange={v => patchBlockContent(sel.id, { heading: v })} />
              <PropField label="Subtitle" value={sel.content.subtitle || ''} onChange={v => patchBlockContent(sel.id, { subtitle: v })} />
              <PropField label="Date" value={sel.content.date || ''} onChange={v => patchBlockContent(sel.id, { date: v })} />
            </>}
            {sel.type === 'scope' && <>
              <div className="label-sm">SCOPE ITEMS (one per line)</div>
              <textarea value={(sel.content.items || []).join('\n')}
                onChange={e => patchBlockContent(sel.id, { items: e.target.value.split('\n') })}
                onBlur={e => patchBlockContent(sel.id, { items: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                style={{ width: '100%', minHeight: 120, padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
            </>}
            {sel.type === 'pricing' && <>
              <div className="label-sm">LINE ITEMS</div>
              {(sel.content.items || []).map((li, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input value={li.desc} placeholder="Item" onChange={e => patchBlockContent(sel.id, { items: sel.content.items.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) })}
                    style={{ flex: 1, minWidth: 0, padding: '5px 6px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  <input value={li.qty} inputMode="numeric" onChange={e => patchBlockContent(sel.id, { items: sel.content.items.map((x, j) => j === i ? { ...x, qty: e.target.value.replace(/[^\d.]/g, '') } : x) })}
                    style={{ width: 34, padding: '5px 4px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, textAlign: 'right', outline: 'none' }} />
                  <input value={li.rate} inputMode="numeric" onChange={e => patchBlockContent(sel.id, { items: sel.content.items.map((x, j) => j === i ? { ...x, rate: e.target.value.replace(/[^\d.]/g, '') } : x) })}
                    style={{ width: 54, padding: '5px 4px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, textAlign: 'right', outline: 'none' }} />
                  <button onClick={() => patchBlockContent(sel.id, { items: sel.content.items.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 11, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <button onClick={() => patchBlockContent(sel.id, { items: [...(sel.content.items || []), { desc: '', qty: 1, rate: 0 }] })}
                style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add line</button>
              <div className="mono" style={{ fontSize: 12, color: 'var(--brand)', textAlign: 'right' }}>Total ${total.toLocaleString()}</div>
            </>}
            {(sel.type === 'intro' || sel.type === 'about' || sel.type === 'terms' || sel.type === 'text') && <>
              <div className="label-sm">CONTENT</div>
              <textarea value={sel.content.text || ''} onChange={e => patchBlockContent(sel.id, { text: e.target.value })}
                placeholder="Edit block text..." style={{ width: '100%', minHeight: 100, padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              {sel.type !== 'terms' && (
                <button disabled={aiBusy} onClick={() => aiRewrite(sel, 'Rewrite this proposal section to be persuasive and professional for a commercial security-integration customer.')}
                  style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: aiBusy ? 'default' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4, opacity: aiBusy ? 0.5 : 1 }}>
                  <span>⟡</span> {aiBusy ? 'Rewriting…' : 'AI Rewrite'}
                </button>
              )}
            </>}
            {sel.type === 'options' && <>
              <div className="label-sm">PACKAGES</div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Client picks their package interactively in the client view. Edit tiers directly on the canvas coming soon — pricing lives in the Pricing block.</div>
            </>}
            {sel.type === 'deposit' && <>
              <PropField label="Deposit %" value={String(sel.content.pct ?? 50)} onChange={v => patchBlockContent(sel.id, { pct: Number(v.replace(/[^\d.]/g, '')) || 0 })} />
              <div className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>= ${Math.round(total * ((sel.content.pct ?? 50) / 100)).toLocaleString()}</div>
            </>}
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>Select a block to edit</div>
        )}
      </div>

      {/* ShieldTech AI Drawer */}
      {hermesDrawer && (
        <div style={{ position: 'fixed', right: 280, top: 52, bottom: 0, width: 320, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', zIndex: 500, display: 'flex', flexDirection: 'column', animation: 'fade-up 0.2s ease both' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⟡</span><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>ShieldTech AI Proposal Assist</span></div>
            <button onClick={() => setShieldAIDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { s: 'Draft scope of work for this system', target: 'scope' },
              { s: 'Write the introduction letter', target: 'intro' },
              { s: 'Summarize the value proposition', target: 'text' },
              { s: 'Rewrite the About section', target: 'about' },
            ].map((a, i) => (
              <button key={i} disabled={aiBusy} onClick={() => {
                let block = blocks.find(b => b.type === a.target);
                if (!block && a.target === 'text') { addBlock('text'); block = null; shieldToast('Text block added — tap the AI action again'); return; }
                if (!block) { shieldToast(`No ${a.target} block in this proposal — add one first`); return; }
                if (a.target === 'scope') {
                  aiRewrite({ ...block, content: { text: (block.content.items || []).join('\n') } }, 'Draft a scope of work as a short list (one item per line, no bullets) for this security install.')
                    .then(() => {
                      const fresh = ((proposalStore.get() || []).find(p => p.id === proposalId) || {}).blocks || [];
                      const sb = fresh.find(b => b.id === block.id);
                      if (sb && sb.content.text) patchBlockContent(block.id, { items: sb.content.text.split('\n').map(s => s.replace(/^[-•]\s*/, '').trim()).filter(Boolean), text: undefined });
                    });
                } else {
                  aiRewrite(block, a.s + ' for this commercial security proposal.');
                }
                setSelectedBlock(block.id);
              }} style={{ padding: '8px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: aiBusy ? 'default' : 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', opacity: aiBusy ? 0.5 : 1 }}>{aiBusy ? '⟡ Working…' : a.s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Controlled field for the settings panel */
function PropField({ label, value, onChange }) {
  return (
    <div>
      <div className="label-sm" style={{ marginBottom: 4 }}>{label.toUpperCase()}</div>
      <input value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
    </div>
  );
}

/* ── Block Renderer ── */
function ProposalBlockRenderer({ block, total }) {
  if (block.type === 'cover') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <ShieldLogo size={40} />
        <div className="display" style={{ fontSize: 22, fontWeight: 200, marginTop: 14, letterSpacing: '-0.01em' }}>{block.content.heading}</div>
        <div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>{block.content.subtitle}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 10 }}>{block.content.date}</div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-low)' }}>Prepared by ShieldTech Solutions</div>
      </div>
    );
  }
  if (block.type === 'intro' || block.type === 'about' || block.type === 'text') {
    return (
      <div>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>{(block.title || block.type).toUpperCase()}</div>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{block.content.text || 'Click to edit this block...'}</p>
      </div>
    );
  }
  if (block.type === 'scope') {
    return (
      <div>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>SCOPE OF WORK</div>
        {(block.content.items || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <span style={{ color: 'var(--brand)', fontSize: 12 }}>✓</span>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item}</span>
          </div>
        ))}
        {(block.content.items || []).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)' }}>No scope items yet — add them in the settings panel.</div>}
      </div>
    );
  }
  if (block.type === 'pricing') {
    const items = block.content.items || [];
    const blockTotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
    return (
      <div>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>PRICING</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Item','Qty','Rate','Total'].map((h,i) => (
              <th key={i} style={{ textAlign: i>0?'right':'left', padding: '6px 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}><td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{item.desc}</td><td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>{item.qty}</td><td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>${(Number(item.rate) || 0).toLocaleString()}</td><td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 500 }}>${((Number(item.qty) || 0) * (Number(item.rate) || 0)).toLocaleString()}</td></tr>
            ))}
            <tr><td colSpan="3" style={{ padding: '8px', fontSize: 13, fontWeight: 600, borderTop: '1px solid var(--border-subtle)' }}>Total</td><td className="mono" style={{ padding: '8px', fontSize: 16, fontWeight: 700, textAlign: 'right', color: 'var(--brand)', borderTop: '1px solid var(--border-subtle)' }}>${blockTotal.toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === 'options') {
    return (
      <div>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>SELECT YOUR PACKAGE</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(block.content.tiers || []).map((t, i) => (
            <div key={i} style={{ flex: 1, padding: 14, borderRadius: 8, border: `1px solid ${t.recommended?'var(--brand)':'var(--border-subtle)'}`, background: t.recommended?'rgba(63,169,245,0.04)':'transparent', position: 'relative' }}>
              {t.recommended && <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 3, background: 'var(--brand)', borderRadius: '8px 8px 0 0' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.recommended?'var(--brand)':'var(--text-high)' }}>{t.name}</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>${(Number(t.price) || 0).toLocaleString()}</div>
              </div>
              <div style={{ marginTop: 10 }}>
                {(t.items || []).map((item, j) => (
                  <div key={j} style={{ fontSize: 11, color: 'var(--text-mid)', padding: '3px 0', display: 'flex', gap: 4 }}>
                    <span style={{ color: 'var(--status-ok)' }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(block.content.tiers || []).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)' }}>No package tiers defined.</div>}
        </div>
      </div>
    );
  }
  if (block.type === 'signature') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div className="label-sm" style={{ marginBottom: 12, color: 'var(--brand)' }}>ACCEPTANCE & E-SIGNATURE</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <div style={{ width: 200, borderBottom: '1px solid var(--text-low)', paddingBottom: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 4 }}>Client Signature</div>
          </div>
          <div style={{ width: 120, borderBottom: '1px solid var(--text-low)', paddingBottom: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 4 }}>Date</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>⊛</span>
          <span style={{ fontSize: 11, color: 'var(--brand)' }}>Accept online via the emailed link</span>
        </div>
      </div>
    );
  }
  if (block.type === 'terms') {
    return (
      <div>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>TERMS & CONDITIONS</div>
        <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{block.content.text || 'Standard terms and conditions...'}</p>
      </div>
    );
  }
  if (block.type === 'deposit') {
    const pct = block.content.pct ?? 50;
    const amt = Math.round((Number(total) || 0) * (pct / 100));
    return (
      <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.03)' }}>
        <span style={{ fontSize: 16 }}>⊛</span>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>Deposit Payment</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)', marginTop: 4 }}>${amt.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{pct}% of proposal total · due on acceptance</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>
      {block.type === 'divider' ? <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} /> : `[${block.title || block.type}]`}
    </div>
  );
}

/* ── Client Proposal View ── */
function ProposalClientView({ blocks, onBack, customer, total, onAccept }) {
  const [selectedTier, setSelectedTier] = React.useState(1);
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onBack} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Exit Preview</button>
        <StatusBadge status="info" label="Client View" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {blocks.map(block => (
          <div key={block.id} style={{ padding: 24, borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)' }}>
            {block.type === 'options' ? (
              <div>
                <div className="label-sm" style={{ marginBottom: 12, color: 'var(--brand)' }}>SELECT YOUR PACKAGE</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(block.content.tiers || []).map((t, i) => (
                    <div key={i} onClick={() => setSelectedTier(i)} style={{ flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer', border: `2px solid ${selectedTier===i?'var(--brand)':'var(--border-subtle)'}`, background: selectedTier===i?'rgba(63,169,245,0.06)':'transparent', transition: 'all 0.2s' }}>
                      {t.recommended && <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>Recommended</div>}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: selectedTier===i?'var(--brand)':'var(--text-high)' }}>{t.name}</div>
                        <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>${(Number(t.price) || 0).toLocaleString()}</div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {(t.items || []).map((item, j) => (
                          <div key={j} style={{ fontSize: 12, color: 'var(--text-mid)', padding: '4px 0', display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--status-ok)' }}>✓</span>{item}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setSelectedTier(i)} style={{ width: '100%', marginTop: 12, padding: '8px', borderRadius: 6, background: selectedTier===i?'var(--brand)':'rgba(63,169,245,0.06)', border: selectedTier===i?'none':'1px solid var(--border-subtle)', color: selectedTier===i?'#fff':'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        {selectedTier===i?'✓ Selected':'Select'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ProposalBlockRenderer block={block} total={total} />
            )}
          </div>
        ))}
        {/* Accept */}
        <div style={{ padding: 24, borderRadius: 10, background: 'rgba(63,169,245,0.04)', border: '2px solid var(--brand)', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Ready to proceed?</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>Accepting creates the project and attaches this quote</div>
          <button onClick={() => onAccept ? onAccept() : shieldToast('This is a preview — customers accept via the emailed link')} style={{ marginTop: 14, padding: '12px 32px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 0 20px -4px rgba(63,169,245,0.4)' }}>Accept Proposal</button>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 8 }}>{customer} · ${(Number(total) || 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProposalScreen, ProposalBuilderView, ProposalBlockRenderer, ProposalClientView });

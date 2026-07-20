/* Proposal Builder V2 — Real drag-and-drop builder with blocks, settings, templates */

function ProposalScreen() {
  const [view, setView] = React.useState('list');
  const [activeProposal, setActiveProposal] = React.useState(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [topTab, setTopTab] = React.useState('proposals'); // proposals | studio

  const proposals = [
    { id: 'PROP-301', customer: 'Pinnacle Financial Group', title: '3-Floor Office Security System', value: 128500, status: 'sent', created: 'Jun 4', viewed: true, viewTime: '4m 22s', sections: 8, template: 'Enterprise', signedAt: null, deposit: 50 },
    { id: 'PROP-298', customer: 'Pacific Rim Hotels', title: 'Multi-Property Security Upgrade', value: 215000, status: 'accepted', created: 'May 30', viewed: true, viewTime: '12m 08s', sections: 10, template: 'Enterprise', signedAt: 'Jun 3', deposit: 50 },
    { id: 'PROP-295', customer: 'Bayshore Medical Center', title: 'HIPAA Compliance Security Upgrade', value: 94200, status: 'draft', created: 'Jun 2', viewed: false, viewTime: '—', sections: 6, template: 'Medical', signedAt: null, deposit: 30 },
    { id: 'PROP-290', customer: 'Golden Gate Logistics', title: 'Warehouse Perimeter Security', value: 52000, status: 'sent', created: 'May 28', viewed: true, viewTime: '2m 15s', sections: 7, template: 'Standard', signedAt: null, deposit: 40 },
    { id: 'PROP-288', customer: 'Redwood Community College', title: 'Campus Safety System', value: 38000, status: 'declined', created: 'Apr 15', viewed: true, viewTime: '0m 45s', sections: 5, template: 'Standard', signedAt: null, deposit: 0 },
  ];

  if (view === 'builder') {
    return <ProposalBuilderView proposal={activeProposal} onBack={() => setView('list')} previewMode={previewMode} setPreviewMode={setPreviewMode} />;
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
    studio: () => <StudioScreen onExportToProposal={() => { setTopTab('proposals'); setActiveProposal(null); setView('builder'); }} />,
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
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>Create, customize, and send interactive proposals</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setActiveProposal(null); setView('builder'); }} style={{ padding: '7px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Proposal</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="OPEN PROPOSALS" value={proposals.filter(p=>p.status==='sent').length} delay={0} />
        <StatCard label="PIPELINE VALUE" value={`$${(proposals.filter(p=>p.status==='sent').reduce((s,p)=>s+p.value,0)/1000).toFixed(0)}K`} mono={false} delay={80} />
        <StatCard label="WIN RATE" value="67%" mono={false} delay={160} />
        <StatCard label="AVG VIEW TIME" value="4m 48s" mono={false} delay={240} />
        <StatCard label="ACCEPTED (MTD)" value={`$${(proposals.filter(p=>p.status==='accepted').reduce((s,p)=>s+p.value,0)/1000).toFixed(0)}K`} mono={false} trend="1 deal" delay={320} />
      </div>

      {/* Proposals Table */}
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Proposal','Customer','Title','Value','Status','Created','Viewed','View Time','Actions'].map((h,i) => (
              <th key={i} style={{ textAlign: i===3?'right':'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {proposals.map((p, i) => (
              <tr key={i} style={{ cursor: 'pointer' }} onClick={() => { setActiveProposal(p); setView('builder'); }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{p.id}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{p.customer}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{p.title}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${p.value.toLocaleString()}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <StatusBadge status={p.status==='accepted'?'online':p.status==='sent'?'info':p.status==='draft'?'draft':'critical'} label={p.status} />
                </td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{p.created}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: p.viewed?'var(--status-ok)':'var(--text-low)' }}>{p.viewed?'✓ Yes':'—'}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{p.viewTime}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {p.status === 'accepted' && <button onClick={() => shieldToast('Converting ' + p.id + ' → Project + Invoice…', 'ok')} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, color: 'var(--status-ok)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Project + Invoice</button>}
                    {p.status === 'draft' && <button onClick={() => shieldToast('Proposal ' + p.id + ' sent to ' + p.customer)} style={{ padding: '3px 8px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send</button>}
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

/* ── Proposal Builder (3-Pane) ── */
function ProposalBuilderView({ proposal, onBack, previewMode, setPreviewMode }) {
  const [blocks, setBlocks] = React.useState([
    { id: 'cover', type: 'cover', title: 'Cover Page', content: { heading: proposal?.customer || 'New Client', subtitle: proposal?.title || 'Security System Proposal', date: 'June 5, 2026' } },
    { id: 'intro', type: 'intro', title: 'Introduction', content: { text: 'Thank you for the opportunity to partner with you on your security needs. ShieldTech Solutions brings 15+ years of experience protecting businesses like yours with cutting-edge technology and white-glove service.' } },
    { id: 'scope', type: 'scope', title: 'Scope of Work', content: { items: ['Site survey and system design','Equipment procurement and staging','Professional installation and cabling','System programming and commissioning','Customer training and handoff','30-day post-install support'] } },
    { id: 'pricing', type: 'pricing', title: 'Pricing', content: { items: [
      { desc: 'Axis P3265-V Dome Camera', qty: 8, rate: 890 },
      { desc: 'Hanwha XNR-6410 16ch NVR', qty: 1, rate: 2800 },
      { desc: 'HID iCLASS SE Reader', qty: 4, rate: 340 },
      { desc: 'Cat6A Cabling & Conduit', qty: 1, rate: 4200 },
      { desc: 'Installation Labor (80h)', qty: 80, rate: 125 },
      { desc: 'Project Management', qty: 1, rate: 3500 },
    ], display: 'itemized' } },
    { id: 'options', type: 'options', title: 'Packages', content: { tiers: [
      { name: 'Essential', price: 28500, items: ['4 cameras','8ch NVR','Basic alarm','1-year warranty'] },
      { name: 'Professional', price: 48200, recommended: true, items: ['8 cameras','16ch NVR','Access control (4 doors)','2-year warranty','Central station monitoring'] },
      { name: 'Enterprise', price: 72800, items: ['12 cameras','16ch NVR RAID','Access control (8 doors)','Fire panel','3-year warranty','24/7 monitoring + mobile'] },
    ] } },
    { id: 'about', type: 'about', title: 'About ShieldTech', content: { text: 'ShieldTech Solutions is a full-service security integrator serving the greater Philadelphia metro area. Licensed, bonded, and insured. NICET certified technicians.' } },
    { id: 'terms', type: 'terms', title: 'Terms & Conditions', content: { text: 'Standard terms: 50% deposit upon acceptance, 40% at rough-in completion, 10% at final commissioning. All equipment carries manufacturer warranty. Proposal valid for 30 days.' } },
    { id: 'signature', type: 'signature', title: 'Acceptance & Signature', content: {} },
  ]);
  const [selectedBlock, setSelectedBlock] = React.useState('cover');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [hermesDrawer, setHermesDrawer] = React.useState(false);

  const blockTypes = [
    { type: 'cover', label: 'Cover Page', icon: '◉' },
    { type: 'intro', label: 'Introduction', icon: '✎' },
    { type: 'scope', label: 'Scope of Work', icon: '◎' },
    { type: 'pricing', label: 'Pricing Table', icon: '⊞' },
    { type: 'options', label: 'Packages', icon: '◈' },
    { type: 'gallery', label: 'Image Gallery', icon: '◫' },
    { type: 'about', label: 'About / Team', icon: '◇' },
    { type: 'testimonial', label: 'Testimonial', icon: '❝' },
    { type: 'text', label: 'Text Block', icon: '¶' },
    { type: 'divider', label: 'Divider', icon: '—' },
    { type: 'terms', label: 'Terms & Conditions', icon: '⊡' },
    { type: 'deposit', label: 'Deposit / Payment', icon: '⊛' },
    { type: 'signature', label: 'Signature Block', icon: '✍' },
  ];

  const addBlock = (type) => {
    const newBlock = { id: `block-${Date.now()}`, type, title: blockTypes.find(b=>b.type===type)?.label || type, content: {} };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(blocks[0]?.id);
  };

  const moveBlock = (id, dir) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next;
    });
  };

  const sel = blocks.find(b => b.id === selectedBlock);

  if (previewMode) {
    return <ProposalClientView blocks={blocks} onBack={() => setPreviewMode(false)} customer={proposal?.customer || 'Client'} />;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 76px)', overflow: 'hidden', gap: 0 }}>
      {/* Left: Block Palette */}
      <div style={{ width: 200, background: 'var(--card)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
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
          {blocks.map((b, i) => (
            <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', marginBottom: 2,
              background: selectedBlock === b.id ? 'rgba(63,169,245,0.08)' : 'transparent',
              border: `1px solid ${selectedBlock === b.id ? 'var(--brand)' : 'transparent'}`,
              color: selectedBlock === b.id ? 'var(--brand)' : 'var(--text-mid)'
            }}>
              <span style={{ fontSize: 10, opacity: 0.5, width: 14 }}>{blockTypes.find(bt=>bt.type===b.type)?.icon}</span>
              <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={e=>{e.stopPropagation();moveBlock(b.id,-1)}} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 8, cursor: 'pointer', padding: '1px 3px' }}>▲</button>
                <button onClick={e=>{e.stopPropagation();moveBlock(b.id,1)}} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 8, cursor: 'pointer', padding: '1px 3px' }}>▼</button>
                <button onClick={e=>{e.stopPropagation();removeBlock(b.id)}} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', padding: '1px 3px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {/* Hermes assist */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setHermesDrawer(!hermesDrawer)} style={{ width: '100%', padding: '6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>⟡</span> Hermes Assist
          </button>
        </div>
      </div>

      {/* Center: Canvas */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: 'rgba(5,7,10,0.3)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="display" style={{ fontSize: 14, fontWeight: 400 }}>{proposal?.id || 'New Proposal'}</span>
            <StatusBadge status={proposal?.status==='accepted'?'online':proposal?.status==='sent'?'info':'draft'} label={proposal?.status || 'draft'} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPreviewMode(true)} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
            <button onClick={() => shieldToast('Generating PDF… ' + (proposal?.id || 'proposal') + '.pdf will download shortly')} style={{ padding: '5px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Download PDF</button>
            <button onClick={() => shieldToast('Proposal sent to client — they’ll get an email with a secure link', 'ok')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send Proposal</button>
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
              <ProposalBlockRenderer block={block} />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Settings Panel */}
      <div style={{ width: 280, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="label-sm">BLOCK SETTINGS</div>
        </div>
        {sel ? (
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>BLOCK TYPE</div>
              <div style={{ fontSize: 13, color: 'var(--text-high)', fontWeight: 500 }}>{sel.title}</div>
            </div>
            {sel.type === 'cover' && <>
              <FormField label="Heading" placeholder={sel.content.heading} />
              <FormField label="Subtitle" placeholder={sel.content.subtitle} />
              <FormField label="Date" placeholder={sel.content.date} />
              <div className="label-sm" style={{ marginTop: 4 }}>COVER IMAGE</div>
              <div style={{ height: 60, borderRadius: 6, border: '2px dashed var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-low)', cursor: 'pointer' }}>Drop image or click</div>
            </>}
            {sel.type === 'pricing' && <>
              <div className="label-sm">PRICE DISPLAY</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Itemized','By System','Lump Sum'].map(d => (
                  <button key={d} onClick={() => shieldToast('Price display: ' + d)} style={{ flex: 1, padding: '5px', borderRadius: 4, fontSize: 10, background: d==='Itemized'?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${d==='Itemized'?'var(--brand)':'var(--border-subtle)'}`, color: d==='Itemized'?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{d}</button>
                ))}
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 4, background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.1)', fontSize: 10, color: 'var(--status-critical)' }}>
                Internal margin hidden from client view
              </div>
            </>}
            {(sel.type === 'intro' || sel.type === 'about' || sel.type === 'terms' || sel.type === 'text') && <>
              <div className="label-sm">CONTENT</div>
              <textarea placeholder="Edit block text..." defaultValue={sel.content.text || ''} style={{ width: '100%', minHeight: 100, padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              {sel.type !== 'terms' && (
                <button onClick={() => shieldToast('Hermes is rewriting this section…', 'info')} style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⟡</span> AI Rewrite
                </button>
              )}
            </>}
            {sel.type === 'options' && <>
              <div className="label-sm">PACKAGE DISPLAY</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Side by Side','Stacked','Toggleable'].map(d => (
                  <button key={d} onClick={() => shieldToast('Package layout: ' + d)} style={{ flex: 1, padding: '5px', borderRadius: 4, fontSize: 10, background: d==='Side by Side'?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${d==='Side by Side'?'var(--brand)':'var(--border-subtle)'}`, color: d==='Side by Side'?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{d}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Client can select their preferred package interactively</div>
            </>}

            {/* Common style controls */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4 }}>
              <div className="label-sm" style={{ marginBottom: 8 }}>STYLING</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3 }}>PADDING</div>
                  <input type="range" min="8" max="48" defaultValue="20" style={{ width: '100%', accentColor: 'var(--brand)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Left','Center','Right'].map(a => (
                  <button key={a} onClick={() => shieldToast('Align: ' + a)} style={{ flex: 1, padding: '4px', borderRadius: 4, fontSize: 10, background: a==='Left'?'rgba(63,169,245,0.1)':'transparent', border: '1px solid var(--border-subtle)', color: a==='Left'?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>Select a block to edit</div>
        )}

        {/* Builder Settings */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSettingsOpen(!settingsOpen)} style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚙ Builder Settings</button>
          {settingsOpen && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FormField label="Default Terms" placeholder="Net 30" />
              <FormField label="Validity Period" placeholder="30 days" />
              <FormField label="Deposit %" placeholder="50" />
              <FormField label="Proposal Numbering" placeholder="PROP-{auto}" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} />
                <span style={{ color: 'var(--text-mid)' }}>E-signature enabled</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} />
                <span style={{ color: 'var(--text-mid)' }}>Stripe deposit payment</span>
              </div>
            </div>
          )}
        </div>

        {/* Template actions */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => shieldToast('Saved as reusable proposal template', 'ok')} style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save as Template</button>
          <button onClick={() => shieldToast('Choose a saved template to load')} style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Load Template</button>
        </div>
      </div>

      {/* Hermes Drawer */}
      {hermesDrawer && (
        <div style={{ position: 'fixed', right: 280, top: 52, bottom: 0, width: 320, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', zIndex: 500, display: 'flex', flexDirection: 'column', animation: 'fade-up 0.2s ease both' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⟡</span><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Hermes Proposal Assist</span></div>
            <button onClick={() => setHermesDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Draft scope of work for this system','Write the introduction letter','Summarize the value proposition','Suggest upsell opportunities','Rewrite pricing for executive audience'].map((s, i) => (
              <button key={i} onClick={() => shieldToast('Hermes: “' + s + '” — drafting…', 'info')} style={{ padding: '8px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Block Renderer ── */
function ProposalBlockRenderer({ block }) {
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
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>{block.title.toUpperCase()}</div>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7 }}>{block.content.text || 'Click to edit this block...'}</p>
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
      </div>
    );
  }
  if (block.type === 'pricing') {
    const items = block.content.items || [];
    const total = items.reduce((s, i) => s + i.qty * i.rate, 0);
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
              <tr key={i}><td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{item.desc}</td><td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>{item.qty}</td><td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>${item.rate.toLocaleString()}</td><td className="mono" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 500 }}>${(item.qty * item.rate).toLocaleString()}</td></tr>
            ))}
            <tr><td colSpan="3" style={{ padding: '8px', fontSize: 13, fontWeight: 600, borderTop: '1px solid var(--border-subtle)' }}>Total</td><td className="mono" style={{ padding: '8px', fontSize: 16, fontWeight: 700, textAlign: 'right', color: 'var(--brand)', borderTop: '1px solid var(--border-subtle)' }}>${total.toLocaleString()}</td></tr>
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
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>${t.price.toLocaleString()}</div>
              </div>
              <div style={{ marginTop: 10 }}>
                {t.items.map((item, j) => (
                  <div key={j} style={{ fontSize: 11, color: 'var(--text-mid)', padding: '3px 0', display: 'flex', gap: 4 }}>
                    <span style={{ color: 'var(--status-ok)' }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          <span style={{ fontSize: 11, color: 'var(--brand)' }}>Pay deposit via Stripe on acceptance</span>
        </div>
      </div>
    );
  }
  if (block.type === 'terms') {
    return (
      <div>
        <div className="label-sm" style={{ marginBottom: 8, color: 'var(--brand)' }}>TERMS & CONDITIONS</div>
        <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.7 }}>{block.content.text || 'Standard terms and conditions...'}</p>
      </div>
    );
  }
  if (block.type === 'deposit') {
    return (
      <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.03)' }}>
        <span style={{ fontSize: 16 }}>⊛</span>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>Deposit Payment</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)', marginTop: 4 }}>$24,100</div>
        <div style={{ fontSize: 11, color: 'var(--text-low)' }}>50% of selected package · Pay securely via Stripe</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>
      {block.type === 'divider' ? <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} /> : `[${block.title}]`}
    </div>
  );
}

/* ── Client Proposal View ── */
function ProposalClientView({ blocks, onBack, customer }) {
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
                        <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>${t.price.toLocaleString()}</div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {t.items.map((item, j) => (
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
              <ProposalBlockRenderer block={block} />
            )}
          </div>
        ))}
        {/* Accept + Pay */}
        <div style={{ padding: 24, borderRadius: 10, background: 'rgba(63,169,245,0.04)', border: '2px solid var(--brand)', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Ready to proceed?</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>Accept this proposal and pay your deposit securely</div>
          <button onClick={() => shieldToast('Redirecting to secure Stripe checkout for deposit…', 'ok')} style={{ marginTop: 14, padding: '12px 32px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 0 20px -4px rgba(63,169,245,0.4)' }}>Accept & Pay Deposit</button>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 8 }}>Secure payment via Stripe</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProposalScreen, ProposalBuilderView, ProposalBlockRenderer, ProposalClientView });

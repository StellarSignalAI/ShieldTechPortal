/* Branding Studio — Brand Kit + Document Template Editor with Live Preview */

function BrandingStudio({ showToast: parentToast }) {
  const [view, setView] = React.useState('kit');
  const [toast, setToast] = React.useState(null);
  const showToast = parentToast || ((m) => { setToast(m); setTimeout(() => setToast(null), 3000); });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, padding: '0 0 12px', flexShrink: 0 }}>
        {[{id:'kit',label:'Brand Kit'},{id:'invoice',label:'Invoice Templates'},{id:'estimate',label:'Estimate Templates'},{id:'proposal',label:'Proposal Templates'}].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: view===t.id?600:400,
            background: view===t.id?'rgba(63,169,245,0.12)':'transparent',
            border: `1px solid ${view===t.id?'var(--brand)':'var(--border-subtle)'}`,
            color: view===t.id?'var(--brand)':'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {view === 'kit' && <BrandKit showToast={showToast} />}
        {(view === 'invoice' || view === 'estimate' || view === 'proposal') && (
          <TemplateEditor docType={view} showToast={showToast} />
        )}
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Brand Kit ── */
function BrandKit({ showToast }) {
  const [logo, setLogo] = React.useState('shield');
  const [primaryColor, setPrimaryColor] = React.useState('#3FA9F5');
  const [secondaryColor, setSecondaryColor] = React.useState('#0A0E14');
  const [font, setFont] = React.useState('Montserrat');

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 className="display" style={{ fontSize: 18, fontWeight: 300 }}>Brand Kit</h2>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>Applied across invoices, estimates, and proposals</p>
        </div>
        <button onClick={() => showToast('Brand Kit saved')} style={{ padding: '7px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Brand Kit</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Logo */}
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12 }}>LOGO</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 120, height: 80, borderRadius: 8, border: '2px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(63,169,245,0.03)' }} onClick={() => showToast('Logo upload dialog')}>
              <ShieldLogo size={40} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>Click to upload logo (PNG, SVG)</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Light BG', 'Dark BG'].map(v => (
                  <button key={v} onClick={() => setLogo(v.toLowerCase())} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{v} variant</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Segmented options={['Left','Center','Right']} defaultValue="Left"
                  btnStyle={{ padding: '3px 8px', borderRadius: 3, fontSize: 9 }}
                  activeStyle={{ background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
                  idleStyle={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }} />
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Colors */}
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12 }}>BRAND COLORS</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            {[
              { label: 'Primary', color: primaryColor, setter: setPrimaryColor },
              { label: 'Secondary', color: secondaryColor, setter: setSecondaryColor },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 4 }}>{c.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: c.color, border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => showToast('Color picker')} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>{c.color}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {['#3FA9F5','#1E6FB0','#0D2137','#F43F5E','#34D399','#8B5CF6'].map(c => (
              <div key={c} onClick={() => setPrimaryColor(c)} style={{ width: 24, height: 24, borderRadius: 4, background: c, cursor: 'pointer', border: primaryColor===c?'2px solid #fff':'2px solid transparent' }} />
            ))}
          </div>
        </GlassPanel>

        {/* Typography */}
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12 }}>TYPOGRAPHY</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['Montserrat','Inter','Georgia','Helvetica'].map(f => (
              <button key={f} onClick={() => setFont(f)} style={{ padding: '6px 12px', borderRadius: 5, fontSize: 12, background: font===f?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${font===f?'var(--brand)':'var(--border-subtle)'}`, color: font===f?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: f }}>{f}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Heading: {font} · Body: IBM Plex Sans · Mono: JetBrains Mono</div>
        </GlassPanel>

        {/* Company Info */}
        <GlassPanel>
          <div className="label-sm" style={{ marginBottom: 12 }}>COMPANY INFO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{l:'Company',v:'ShieldTech Solutions LLC'},{l:'Address',v:'1234 Security Way, Philadelphia, PA 19103'},{l:'Phone',v:'(215) 555-0100'},{l:'Email',v:'billing@shieldtechsolutions.com'},{l:'License',v:'PA HIC #PA123456'}].map((f,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{f.v}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Default Footer & Terms */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>DEFAULT FOOTER & PAYMENT INSTRUCTIONS</div>
        <textarea defaultValue="Thank you for your business. Payment due upon receipt unless terms specified. Make checks payable to ShieldTech Solutions LLC. For questions, contact billing@shieldtechsolutions.com." style={{ width: '100%', minHeight: 60, padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
      </GlassPanel>
    </div>
  );
}

/* ── Template Editor (3-tab: Design, Content, Emails) + Live Preview ── */
function TemplateEditor({ docType, showToast }) {
  const [activeTemplate, setActiveTemplate] = React.useState(0);
  const [editorTab, setEditorTab] = React.useState('design');
  const [layout, setLayout] = React.useState('modern');
  const [logoPos, setLogoPos] = React.useState('left');
  const [accentColor, setAccentColor] = React.useState('#3FA9F5');
  const [headerFont, setHeaderFont] = React.useState('Montserrat');
  const [showPO, setShowPO] = React.useState(true);
  const [showTerms, setShowTerms] = React.useState(true);
  const [showSalesRep, setShowSalesRep] = React.useState(false);
  const [showSig, setShowSig] = React.useState(docType !== 'invoice');
  const [pricingMode, setPricingMode] = React.useState('itemized');
  const [emailSubject, setEmailSubject] = React.useState(`Your ${docType} from ShieldTech Solutions — {amount}`);
  const [emailBody, setEmailBody] = React.useState(`Hi {customer},\n\nPlease find your ${docType} attached. Total: {amount}, due {due_date}.\n\nView and pay online: {link}\n\nThank you,\nShieldTech Solutions`);

  const templates = [
    { name: 'Modern (Default)', id: 'modern' },
    { name: 'Classic', id: 'classic' },
    { name: 'Minimal', id: 'minimal' },
  ];

  const docLabel = docType.charAt(0).toUpperCase() + docType.slice(1);

  return (
    <div style={{ display: 'flex', gap: 14, height: '100%' }}>
      {/* Left: Template list + Editor */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', flexShrink: 0 }}>
        {/* Template selector */}
        <GlassPanel style={{ padding: 12 }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>{docLabel.toUpperCase()} TEMPLATES</div>
          {templates.map((t, i) => (
            <div key={i} onClick={() => setActiveTemplate(i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px', borderRadius: 5, marginBottom: 3, cursor: 'pointer',
              background: activeTemplate===i?'rgba(63,169,245,0.08)':'transparent',
              border: `1px solid ${activeTemplate===i?'var(--brand)':'transparent'}`
            }}>
              <span style={{ fontSize: 12, color: activeTemplate===i?'var(--brand)':'var(--text-mid)' }}>{t.name}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {activeTemplate===i && <span style={{ fontSize: 9, color: 'var(--status-ok)', padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.08)' }}>Default</span>}
                <button onClick={(e) => { e.stopPropagation(); showToast('Template duplicated'); }} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer' }}>⊕</button>
              </div>
            </div>
          ))}
          <button onClick={() => showToast('New template created')} style={{ width: '100%', padding: '6px', marginTop: 4, background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Template</button>
        </GlassPanel>

        {/* Editor Tabs */}
        <div style={{ display: 'flex', gap: 3 }}>
          {['design','content','emails'].map(t => (
            <button key={t} onClick={() => setEditorTab(t)} style={{
              flex: 1, padding: '6px', borderRadius: 5, fontSize: 11, fontWeight: editorTab===t?600:400,
              background: editorTab===t?'rgba(63,169,245,0.12)':'transparent',
              border: `1px solid ${editorTab===t?'var(--brand)':'var(--border-subtle)'}`,
              color: editorTab===t?'var(--brand)':'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>

        {/* Design Tab */}
        {editorTab === 'design' && (
          <GlassPanel style={{ padding: 14 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>LAYOUT STYLE</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {['modern','classic','minimal'].map(l => (
                <button key={l} onClick={() => setLayout(l)} style={{ flex: 1, padding: '6px', borderRadius: 5, fontSize: 10, background: layout===l?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${layout===l?'var(--brand)':'var(--border-subtle)'}`, color: layout===l?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{l}</button>
              ))}
            </div>

            <div className="label-sm" style={{ marginBottom: 8 }}>LOGO PLACEMENT</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {['left','center','right'].map(p => (
                <button key={p} onClick={() => setLogoPos(p)} style={{ flex: 1, padding: '5px', borderRadius: 4, fontSize: 10, background: logoPos===p?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${logoPos===p?'var(--brand)':'var(--border-subtle)'}`, color: logoPos===p?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{p}</button>
              ))}
            </div>

            <div className="label-sm" style={{ marginBottom: 8 }}>ACCENT COLOR</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {['#3FA9F5','#1E6FB0','#8B5CF6','#F43F5E','#FBBF24','#34D399'].map(c => (
                <div key={c} onClick={() => setAccentColor(c)} style={{ width: 24, height: 24, borderRadius: 4, background: c, cursor: 'pointer', border: accentColor===c?'2px solid #fff':'2px solid transparent' }} />
              ))}
            </div>

            <div className="label-sm" style={{ marginBottom: 8 }}>HEADING FONT</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {['Montserrat','Georgia','Helvetica'].map(f => (
                <button key={f} onClick={() => setHeaderFont(f)} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, background: headerFont===f?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${headerFont===f?'var(--brand)':'var(--border-subtle)'}`, color: headerFont===f?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: f }}>{f}</button>
              ))}
            </div>

            <div className="label-sm" style={{ marginBottom: 8 }}>TABLE HEADER</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <Segmented options={['Filled','Bordered','Minimal']} defaultValue="Filled"
                btnStyle={{ flex: 1, padding: '4px', borderRadius: 4, fontSize: 10 }}
                activeStyle={{ background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
                idleStyle={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }} />
            </div>

            <div className="label-sm" style={{ marginBottom: 6, marginTop: 8 }}>SPACING</div>
            <input type="range" min="12" max="40" defaultValue="20" style={{ width: '100%', accentColor: accentColor }} />
          </GlassPanel>
        )}

        {/* Content Tab */}
        {editorTab === 'content' && (
          <GlassPanel style={{ padding: 14 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>HEADER FIELDS</div>
            {[{l:'PO Number',v:showPO,s:setShowPO},{l:'Terms',v:showTerms,s:setShowTerms},{l:'Sales Rep',v:showSalesRep,s:setShowSalesRep},{l:'Signature Block',v:showSig,s:setShowSig}].map((f,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{f.l}</span>
                <div onClick={() => f.s(!f.v)} style={{ width: 28, height: 14, borderRadius: 7, background: f.v?'var(--brand)':'rgba(92,111,134,0.3)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: f.v?16:2, transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}

            <div className="label-sm" style={{ marginBottom: 8, marginTop: 14 }}>LINE ITEM COLUMNS</div>
            {['Description','Qty','Rate','Amount','Tax','SKU','Category'].map((col, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{col}</span>
                <div style={{ width: 28, height: 14, borderRadius: 7, background: i < 4 ? 'var(--brand)' : 'rgba(92,111,134,0.3)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: i < 4 ? 16 : 2 }} />
                </div>
              </div>
            ))}

            <div className="label-sm" style={{ marginBottom: 8, marginTop: 14 }}>PRICING DISPLAY</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['itemized','by-system','lump-sum'].map(m => (
                <button key={m} onClick={() => setPricingMode(m)} style={{ flex: 1, padding: '5px', borderRadius: 4, fontSize: 10, background: pricingMode===m?'rgba(63,169,245,0.1)':'transparent', border: `1px solid ${pricingMode===m?'var(--brand)':'var(--border-subtle)'}`, color: pricingMode===m?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{m.replace('-',' ')}</button>
              ))}
            </div>

            <div className="label-sm" style={{ marginBottom: 6, marginTop: 14 }}>CUSTOM MESSAGE</div>
            <textarea defaultValue="Thank you for choosing ShieldTech Solutions for your security needs." style={{ width: '100%', minHeight: 50, padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
          </GlassPanel>
        )}

        {/* Emails Tab */}
        {editorTab === 'emails' && (
          <GlassPanel style={{ padding: 14 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>EMAIL SUBJECT</div>
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', marginBottom: 12 }} />

            <div className="label-sm" style={{ marginBottom: 8 }}>EMAIL BODY</div>
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} style={{ width: '100%', minHeight: 120, padding: '8px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.6, marginBottom: 10 }} />

            <div className="label-sm" style={{ marginBottom: 6 }}>MERGE TOKENS</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {['{customer}','{amount}','{due_date}','{link}','{invoice_num}','{company}'].map(t => (
                <span key={t} className="mono" style={{ padding: '2px 8px', borderRadius: 3, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', fontSize: 9, color: 'var(--brand)', cursor: 'pointer' }} onClick={() => showToast(`Copied: ${t}`)}>{t}</span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Include "Pay Now" (Stripe) button</span>
              <div style={{ width: 28, height: 14, borderRadius: 7, background: 'var(--brand)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 16 }} />
              </div>
            </div>

            <div className="label-sm" style={{ marginBottom: 6, marginTop: 10 }}>REMINDER EMAIL</div>
            <textarea defaultValue={`Hi {customer},\n\nThis is a friendly reminder that {invoice_num} for {amount} is due on {due_date}.\n\nPay online: {link}\n\nThank you,\nShieldTech Solutions`} style={{ width: '100%', minHeight: 80, padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />

            <button onClick={() => showToast('Test email sent to your inbox')} style={{ width: '100%', marginTop: 10, padding: '8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✉ Send Test Email</button>
          </GlassPanel>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => showToast('Template saved')} style={{ flex: 1, padding: '8px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Template</button>
          <button onClick={() => showToast('Preview updated')} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
          <button onClick={() => showToast('PDF downloaded')} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>PDF</button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <DocumentPreview
          docType={docType}
          layout={layout}
          logoPos={logoPos}
          accentColor={accentColor}
          headerFont={headerFont}
          showPO={showPO}
          showTerms={showTerms}
          showSig={showSig}
          pricingMode={pricingMode}
        />
      </div>
    </div>
  );
}

/* ── Document Live Preview ── */
function DocumentPreview({ docType, layout, logoPos, accentColor, headerFont, showPO, showTerms, showSig, pricingMode }) {
  const docLabel = docType.charAt(0).toUpperCase() + docType.slice(1);
  const isModern = layout === 'modern';
  const isMinimal = layout === 'minimal';

  const lineItems = [
    { desc: 'Axis P3265-V Dome Camera', qty: 8, rate: 890 },
    { desc: 'Hanwha XNR-6410 16ch NVR', qty: 1, rate: 2800 },
    { desc: 'Cat6A Cabling & Conduit', qty: 1, rate: 4200 },
    { desc: 'Installation Labor (80h)', qty: 80, rate: 125 },
    { desc: 'Project Management', qty: 1, rate: 3500 },
  ];
  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.rate, 0);
  const tax = Math.round(subtotal * 0.06);
  const total = subtotal + tax;

  return (
    <div style={{ background: '#1a1f28', borderRadius: 10, border: '1px solid var(--border-subtle)', padding: 24, minHeight: 600 }}>
      <div style={{ background: '#fff', borderRadius: 6, padding: 32, color: '#1a1a2e', maxWidth: 600, margin: '0 auto', fontSize: 12, lineHeight: 1.5 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: logoPos==='right'?'flex-end':logoPos==='center'?'center':'flex-start', marginBottom: 20 }}>
          <div style={{ textAlign: logoPos }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: logoPos==='right'?'flex-end':logoPos==='center'?'center':'flex-start' }}>
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L8 12v12c0 11 16 20 16 20s16-9 16-20V12L24 4z" fill={`${accentColor}20`} stroke={accentColor} strokeWidth="1.5"/>
                <circle cx="24" cy="24" r="3" fill={accentColor} opacity="0.8"/>
              </svg>
              <span style={{ fontFamily: headerFont, fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>SHIELDTECH</span>
            </div>
            <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>1234 Security Way, Philadelphia, PA 19103 · (215) 555-0100</div>
          </div>
        </div>

        {/* Document title + meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: isModern ? `2px solid ${accentColor}` : '1px solid #ddd' }}>
          <div>
            <div style={{ fontFamily: headerFont, fontSize: 20, fontWeight: isMinimal ? 300 : 600, color: isModern ? accentColor : '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{docLabel}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>#INV-2865 · June 5, 2026</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Bill To:</div>
            <div>Marina District Dental</div>
            <div style={{ color: '#888' }}>456 Marina Blvd, Suite 200</div>
            <div style={{ color: '#888' }}>San Francisco, CA 94123</div>
            {showPO && <div style={{ marginTop: 4, fontSize: 10, color: '#888' }}>PO: MD-2026-07</div>}
          </div>
        </div>

        {showTerms && (
          <div style={{ display: 'flex', gap: 20, marginBottom: 14, fontSize: 10 }}>
            <div><span style={{ color: '#888' }}>Terms:</span> Net 30</div>
            <div><span style={{ color: '#888' }}>Due:</span> July 5, 2026</div>
          </div>
        )}

        {/* Line items table */}
        {pricingMode === 'itemized' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr>
                {['Description','Qty','Rate','Amount'].map((h,i) => (
                  <th key={i} style={{
                    textAlign: i>0?'right':'left', padding: '8px 10px', fontSize: 9,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: isModern ? accentColor : isMinimal ? 'transparent' : '#f4f4f4',
                    color: isModern ? '#fff' : '#555',
                    borderBottom: isMinimal ? `1px solid ${accentColor}` : 'none'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((l, i) => (
                <tr key={i} style={{ background: !isMinimal && i%2===1 ? '#fafafa' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontSize: 11 }}>{l.desc}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontSize: 11, textAlign: 'right', color: '#666' }}>{l.qty}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontSize: 11, textAlign: 'right', color: '#666' }}>${l.rate.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontSize: 11, textAlign: 'right', fontWeight: 500 }}>${(l.qty * l.rate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : pricingMode === 'lump-sum' ? (
          <div style={{ padding: '16px 0', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>8-Camera Security System — Complete Installation</div>
            <div style={{ fontFamily: headerFont, fontSize: 24, fontWeight: 600, color: accentColor }}>${total.toLocaleString()}</div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Camera System</span><span style={{ fontWeight: 500 }}>${(8*890+2800).toLocaleString()}</span>
            </div>
            <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Cabling & Infrastructure</span><span style={{ fontWeight: 500 }}>$4,200</span>
            </div>
            <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Labor & Project Management</span><span style={{ fontWeight: 500 }}>${(80*125+3500).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: '#888' }}>Subtotal</span><span>${subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: '#888' }}>Tax (6%)</span><span>${tax.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `2px solid ${accentColor}`, marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: accentColor }}>${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pay button */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 6, background: accentColor, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Pay Now — ${total.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>Secure payment via Stripe</div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 12, fontSize: 9, color: '#aaa', textAlign: 'center', lineHeight: 1.6 }}>
          Thank you for choosing ShieldTech Solutions. Payment due upon receipt unless terms specified.<br />
          Make checks payable to ShieldTech Solutions LLC · billing@shieldtechsolutions.com
        </div>

        {showSig && (
          <div style={{ marginTop: 20, display: 'flex', gap: 20, justifyContent: 'center' }}>
            <div style={{ width: 160, borderBottom: '1px solid #ccc', paddingBottom: 4, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#aaa', marginTop: 4 }}>Client Signature</div>
            </div>
            <div style={{ width: 100, borderBottom: '1px solid #ccc', paddingBottom: 4, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#aaa', marginTop: 4 }}>Date</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BrandingStudio, BrandKit, TemplateEditor, DocumentPreview });

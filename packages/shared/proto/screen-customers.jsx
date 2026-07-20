/* Customers Module — List, Create/Edit, Sub-customers, Detail Page, Customer Selector */

/* Local controlled field — the global FormField is shadowed by another module's
   definition that drops value/onChange, so the customer forms use their own. */
function CField({ label, placeholder, textarea, value, onChange, style }) {
  const inputStyle = {
    width: '100%', padding: textarea ? '10px 14px' : '8px 12px',
    background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
    resize: textarea ? 'vertical' : undefined, minHeight: textarea ? 72 : undefined
  };
  return (
    <div style={style}>
      {label && <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 4 }}>{label}</div>}
      {textarea
        ? <textarea placeholder={placeholder} value={value} onChange={onChange} style={inputStyle}></textarea>
        : <input placeholder={placeholder} value={value} onChange={onChange} style={inputStyle} />}
    </div>
  );
}

function CustomersScreen() {
  const [view, setView] = React.useState('list');
  const [selectedId, setSelectedId] = React.useState(null);
  const [createModal, setCreateModal] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const [allCustomers] = useShieldStore(customerStore);
  const [subCustomers] = useShieldStore(subCustomerStore);
  const selectedCustomer = allCustomers.find(c => c.id === selectedId) || null;
  const customers = allCustomers.filter(c =>
    !query || (c.name + ' ' + (c.dba || '') + ' ' + c.type + ' ' + (c.acctNum || '')).toLowerCase().includes(query.toLowerCase())
  );

  if (view === 'detail' && selectedCustomer) {
    return <CustomerDetail customer={selectedCustomer} subCustomers={subCustomers.filter(s => s.parentId === selectedCustomer.id)} onBack={() => setView('list')} showToast={showToast} toast={toast} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'calc(100vh - 76px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Customers</h2>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{customers.length} organizations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customers..." style={{ padding: '6px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 200 }} />
          <button onClick={() => showToast('Bulk actions')} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Bulk Actions</button>
          <button onClick={() => setCreateModal(true)} style={{ padding: '6px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Customer</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="TOTAL CUSTOMERS" value={customers.length} delay={0} />
        <StatCard label="TOTAL SITES" value={customers.reduce((s,c) => s+c.sites, 0)} delay={80} />
        <StatCard label="TOTAL ASSETS" value={customers.reduce((s,c) => s+c.assets, 0)} delay={160} />
        <StatCard label="TOTAL MRR" value={`$${(customers.reduce((s,c) => s+c.mrr, 0)/1000).toFixed(1)}K`} mono={false} delay={240} />
        <StatCard label="AR BALANCE" value={`$${(customers.reduce((s,c) => s+c.balance, 0)/1000).toFixed(1)}K`} mono={false} delay={320} />
      </div>

      {/* Customers Table */}
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['','Customer','Type','Sites','Assets','Account Owner','MRR','Balance','Health','Status'].map((h,i) => (
              <th key={i} style={{ textAlign: [6,7].includes(i)?'right':i===8?'center':'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} onClick={() => { setSelectedId(c.id); setView('detail'); }} style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(63,169,245,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', width: 40 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>{c.logo}</div>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 1 }}>{c.acctNum}{c.dba ? ` · DBA: ${c.dba}` : ''}</div>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{c.type}</td>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{c.sites}</td>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{c.assets}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{c.owner}</td>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: c.mrr > 0 ? 'var(--text-high)' : 'var(--text-low)' }}>{c.mrr > 0 ? `$${c.mrr.toLocaleString()}` : '—'}</td>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', color: c.balance > 0 ? 'var(--status-warn)' : 'var(--text-low)' }}>{c.balance > 0 ? `$${c.balance.toLocaleString()}` : '—'}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'center' }}>
                  {c.health > 0 ? <MiniBar value={c.health} color={c.health>=80?'var(--status-ok)':c.health>=60?'var(--status-warn)':'var(--status-critical)'} width={50} label={`${c.health}`} /> : <span style={{ fontSize: 10, color: 'var(--text-low)' }}>—</span>}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <StatusBadge status="online" label={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>

      {/* Create Customer Modal */}
      {createModal && <CustomerCreateModal onClose={() => setCreateModal(false)} showToast={showToast} />}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Customer Detail Page (IT Glue org-style tabbed hub) ── */
function CustomerDetail({ customer, subCustomers, onBack, showToast, toast }) {
  const [tab, setTab] = React.useState('overview');
  const [subModal, setSubModal] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [projectWizardOpen, setProjectWizardOpen] = React.useState(false);
  const c = customer;

  const detailTabs = [
    { id: 'overview', label: 'Overview' }, { id: 'churn', label: 'Churn Radar' }, { id: 'contacts', label: 'Contacts' },
    { id: 'sites', label: 'Sites' }, { id: 'assets', label: 'Assets' },
    { id: 'flexible', label: 'Flexible Assets' }, { id: 'passwords', label: 'Passwords' },
    { id: 'documents', label: 'Documents' }, { id: 'networks', label: 'Networks' },
    { id: 'tickets', label: 'Tickets' }, { id: 'estimates', label: 'Estimates' },
    { id: 'invoices', label: 'Invoices' }, { id: 'proposals', label: 'Proposals' },
    { id: 'projects', label: 'Projects' }, { id: 'monitoring', label: 'Monitoring' },
    { id: 'timeline', label: 'Timeline' }, { id: 'onboarding', label: 'Onboarding' },
    { id: 'status', label: 'Status Page' },
    { id: 'activity', label: 'Activity' }, { id: 'related', label: 'Related' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 0 12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '4px 10px', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Customers</button>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{c.logo}</div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 400 }}>{c.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{c.acctNum} · {c.type} · {c.industry}{c.dba ? ` · DBA: ${c.dba}` : ''}</div>
        </div>
        <StatusBadge status="online" label={c.status} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setEditOpen(true)} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit</button>
          <button onClick={() => { customerStore.set(list => list.map(x => x.id === c.id ? { ...x, status: 'archived' } : x)); showToast(`${c.name} archived`); onBack(); }} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Archive</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 0 10px', overflowX: 'auto', flexShrink: 0 }}>
        {detailTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: tab===t.id?600:400,
            background: tab===t.id?'rgba(63,169,245,0.12)':'transparent',
            border: `1px solid ${tab===t.id?'var(--brand)':'transparent'}`,
            color: tab===t.id?'var(--brand)':'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxWidth: 1400 }}>
            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 10 }}>COMPANY INFO</div>
              {[{l:'Address',v:c.address},{l:'Phone',v:c.phone},{l:'Website',v:c.website},{l:'Tax ID',v:c.taxId},{l:'Terms',v:c.terms},{l:'Tax Exempt',v:c.taxExempt?'Yes':'No'},{l:'Account Owner',v:c.owner}].map((f,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-mid)', textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.v || '—'}</span>
                </div>
              ))}
            </GlassPanel>

            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 10 }}>FINANCIAL SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 20, fontWeight: 600, color: c.mrr>0?'var(--brand)':'var(--text-low)' }}>${c.mrr.toLocaleString()}</div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>MRR</div></div>
                <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 20, fontWeight: 600, color: c.balance>0?'var(--status-warn)':'var(--status-ok)' }}>${c.balance.toLocaleString()}</div><div style={{ fontSize: 9, color: 'var(--text-low)' }}>Balance Due</div></div>
              </div>
              {c.health > 0 && <div style={{ display: 'flex', justifyContent: 'center' }}><HealthRing value={c.health} size={80} label="Health" /></div>}
            </GlassPanel>

            <GlassPanel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="label-sm">SUB-CUSTOMERS</div>
                <button onClick={() => setSubModal(true)} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add</button>
              </div>
              {subCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-low)', fontSize: 12 }}>No sub-customers</div>
              ) : subCustomers.map((sc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-mid)' }}>{sc.name}</span>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: sc.role==='billing_entity'?'rgba(251,191,36,0.08)':sc.role==='estimate_recipient'?'rgba(63,169,245,0.08)':'rgba(192,132,252,0.08)', color: sc.role==='billing_entity'?'var(--status-warn)':sc.role==='estimate_recipient'?'var(--brand)':'#c084fc', fontWeight: 600, textTransform: 'uppercase' }}>{sc.role.replace(/_/g,' ')}</span>
                </div>
              ))}
              {subCustomers.length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-mid)' }}>
                  <strong>Role routing:</strong> Estimates → <span style={{ color: 'var(--brand)' }}>Parks & Rec</span> · Invoices → <span style={{ color: 'var(--status-warn)' }}>Finance Dept</span>
                </div>
              )}
            </GlassPanel>

            {/* Tags */}
            <GlassPanel style={{ gridColumn: 'span 3' }}>
              <div className="label-sm" style={{ marginBottom: 8 }}>TAGS</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {c.tags.map(t => <span key={t} style={{ padding: '3px 10px', borderRadius: 4, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--brand)' }}>{t}</span>)}
                <button onClick={() => showToast('Add tag')} style={{ padding: '3px 10px', borderRadius: 4, background: 'transparent', border: '1px dashed var(--border-subtle)', color: 'var(--text-low)', fontSize: 11, cursor: 'pointer' }}>+ Tag</button>
              </div>
            </GlassPanel>
          </div>
        )}

        {tab === 'churn' && <ChurnRadarPanel customer={c} showToast={showToast} />}
        {tab === 'contacts' && <CustomerContacts showToast={showToast} />}
        {tab === 'sites' && <CustomerSites customer={c} showToast={showToast} />}
        {tab === 'assets' && <CustomerAssets customer={c} showToast={showToast} />}
        {tab === 'passwords' && <CustomerPasswords showToast={showToast} />}
        {tab === 'flexible' && <CustomerFlexAssets customer={c} showToast={showToast} />}
        {tab === 'documents' && <CustomerDocs showToast={showToast} />}
        {tab === 'networks' && <CustomerNetworks showToast={showToast} />}
        {(tab === 'tickets' || tab === 'estimates' || tab === 'invoices' || tab === 'proposals') && (
          <GlassPanel><div style={{ textAlign: 'center', padding: 24, color: 'var(--text-mid)' }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{c.name} — {tab.charAt(0).toUpperCase()+tab.slice(1)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>All {tab} for this customer appear here. Create new from any module with this customer pre-selected.</div>
            <button onClick={() => showToast(`New ${tab.slice(0,-1)} for ${c.name}`)} style={{ marginTop: 12, padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New {tab.charAt(0).toUpperCase()+tab.slice(1,-1)}</button>
          </div></GlassPanel>
        )}
        {tab === 'projects' && (
          <GlassPanel><div style={{ textAlign: 'center', padding: 24, color: 'var(--text-mid)' }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{c.name} — Projects</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)', marginBottom: 12 }}>Projects link proposals, designs, jobs, and invoices into one workflow.</div>
            <button onClick={() => setProjectWizardOpen(true)} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="add" size={14} color="#fff" /> New Project</button>
          </div></GlassPanel>
        )}
        {tab === 'monitoring' && <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-mid)' }}>Monitoring scoped to <strong>{c.name}</strong> — {c.sites} sites, {c.assets} devices. All asset status, uptime, and events for this customer.</div>}
        {tab === 'timeline' && <CustomerTimeline customer={c.name} />}
        {tab === 'onboarding' && <CustomerOnboardingTab customer={c} showToast={showToast} />}
        {tab === 'status' && <CustomerStatusTab customer={c} showToast={showToast} />}
        {tab === 'activity' && <CustomerTimeline customer={c.name} />}
        {tab === 'related' && <GlassPanel><div style={{ textAlign: 'center', padding: 20, color: 'var(--text-low)', fontSize: 12 }}>Related items web — link any asset, document, password, contact, or network to any other item. Cross-reference everything.</div></GlassPanel>}
      </div>

      {subModal && <SubCustomerModal parent={c} onClose={() => setSubModal(false)} showToast={showToast} />}
      {editOpen && <CustomerCreateModal editing={c} onClose={() => setEditOpen(false)} showToast={showToast} />}
      {projectWizardOpen && typeof ProjectWizard !== 'undefined' && <ProjectWizard customer={c.name} onClose={() => setProjectWizardOpen(false)} onComplete={(proj) => { showToast(`Project "${proj.name}" created for ${c.name}`); setProjectWizardOpen(false); }} showToast={showToast} />}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Customer Contacts ── */
function CustomerContacts({ showToast }) {
  const contacts = [
    { name: 'Robert Chen', title: 'VP Facilities', email: 'rchen@metrobankcorp.com', phone: '(215) 555-0210', type: 'Primary', portal: true },
    { name: 'Linda Park', title: 'Security Manager', email: 'lpark@metrobankcorp.com', phone: '(215) 555-0211', type: 'Technical', portal: true },
    { name: 'James Wong', title: 'AP Clerk', email: 'jwong@metrobankcorp.com', phone: '(215) 555-0212', type: 'Billing', portal: false },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title="Contacts" icon="◎" count={contacts.length} />
        <button onClick={() => showToast('New contact')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Contact</button>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Name','Title','Email','Phone','Type','Portal Access'].map((h,i) => (
            <th key={i} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{contacts.map((ct,i) => (
            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{ct.name}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{ct.title}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{ct.email}</td>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{ct.phone}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={ct.type==='Primary'?'info':ct.type==='Technical'?'online':'warning'} label={ct.type} /></td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: ct.portal?'var(--status-ok)':'var(--text-low)' }}>{ct.portal?'✓ Enabled':'—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Customer Sites ── */
function CustomerSites({ customer, showToast }) {
  const sites = [
    { name: 'Main Office — 1450 Market St', type: 'Primary', devices: 28, status: 'online', floors: 3 },
    { name: 'Branch — 2200 Broad St', type: 'Branch', devices: 12, status: 'online', floors: 1 },
    { name: 'Data Center — 500 Vine St', type: 'Infrastructure', devices: 8, status: 'warning', floors: 1 },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title="Sites / Locations" icon="map-pin" count={sites.length} />
        <button onClick={() => showToast('New site added')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Site</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {sites.map((s,i) => (
          <GlassPanel key={i} style={{ cursor: 'pointer', borderLeft: `3px solid ${s.status==='online'?'var(--status-ok)':'var(--status-warn)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
              <StatusDot status={s.status} size={8} />
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-low)' }}>
              <span>{s.type}</span><span>{s.devices} devices</span><span>{s.floors} floor{s.floors>1?'s':''}</span>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

/* ── Customer Assets (brief — full detail in screen-assets-v2) ── */
function CustomerAssets({ customer, showToast }) {
  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title={`Assets — ${customer.name}`} icon="⬡" count={customer.assets} />
        <button onClick={() => showToast('New configuration')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Asset</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 12 }}>Full IT Glue-class asset management available in the Assets module. Customer → Site → Device breadcrumb.</div>
      <GlassPanel style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 600 }}>{customer.assets}</div>
        <div style={{ fontSize: 12, color: 'var(--text-low)' }}>configurations across {customer.sites} sites</div>
      </GlassPanel>
    </div>
  );
}

/* ── Flexible Assets ── */
function CustomerFlexAssets({ customer, showToast }) {
  const [createModal, setCreateModal] = React.useState(false);
  const types = [
    { name: 'CCTV System', icon: '◉', count: 2, fields: ['NVR Model','Camera Count','Storage (TB)','Retention (days)','VMS Software'] },
    { name: 'Access Control System', icon: '⊠', count: 1, fields: ['Panel Model','Door Count','Credential Type','Software','Cloud/On-Prem'] },
    { name: 'Monitoring Account', icon: '⊚', count: 1, fields: ['Central Station','Account #','Signal Path','Zone Count','Permit #'] },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title="Flexible Assets" icon="◈" />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => showToast('Flexible asset type builder')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Manage Types</button>
          <button onClick={() => setCreateModal(true)} style={{ padding: '5px 12px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {types.map((t,i) => (
          <GlassPanel key={i} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{t.count} instance{t.count>1?'s':''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {t.fields.map((f,j) => <span key={j} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.04)', color: 'var(--text-low)' }}>{f}</span>)}
            </div>
          </GlassPanel>
        ))}
      </div>
      {createModal && <CreateFlexAssetModal onClose={() => setCreateModal(false)} showToast={showToast} />}
    </div>
  );
}

/* ── Passwords Vault ── */
function CustomerPasswords({ showToast }) {
  const [revealed, setRevealed] = React.useState({});
  const [createModal, setCreateModal] = React.useState(false);
  const creds = [
    { id: 1, name: 'NVR Admin', user: 'admin', pass: 'X#k9$mP2!qR7', url: 'https://192.168.1.100', cat: 'NVR', device: 'Hanwha XNR-6410', expiry: 'Aug 2026', lastRotated: 'Feb 2026' },
    { id: 2, name: 'Access Panel', user: 'installer', pass: 'ShldTch@2026!', url: 'https://192.168.1.110', cat: 'Access Control', device: 'HID VertX V1000', expiry: null, lastRotated: 'Mar 2026' },
    { id: 3, name: 'Monitoring Portal', user: 'shieldtech_metro', pass: 'Tr!@ngulm#8842', url: 'https://monitoring.triangulum.com', cat: 'Monitoring', device: null, expiry: null, lastRotated: 'Jan 2026' },
    { id: 4, name: 'Camera Wi-Fi', user: '', pass: 'Metro-WiFi-2026', url: '', cat: 'Network', device: null, expiry: null, lastRotated: 'Apr 2026' },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title="Passwords & Credentials" icon="credential" count={creds.length} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => showToast('Password generated: kQ8#xP2$mT!nR')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Generate</button>
          <button onClick={() => setCreateModal(true)} style={{ padding: '5px 12px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add</button>
        </div>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Name','Username','Password','Category','Linked Device','Last Rotated',''].map((h,i) => (
            <th key={i} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{creds.map(cr => (
            <tr key={cr.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{cr.name}</td>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{cr.user || '—'}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="mono" style={{ fontSize: 11, color: revealed[cr.id] ? 'var(--text-high)' : 'var(--text-low)', letterSpacing: revealed[cr.id] ? '0' : '0.1em' }}>
                    {revealed[cr.id] ? cr.pass : '••••••••••••'}
                  </span>
                  <button onClick={() => { setRevealed(p => ({...p, [cr.id]: !p[cr.id]})); if (!revealed[cr.id]) showToast('Reveal audit-logged'); }} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{revealed[cr.id]?'Hide':'Reveal'}</button>
                  <button onClick={() => { navigator.clipboard?.writeText?.(cr.pass); showToast('Copied — auto-clears in 30s'); }} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Copy</button>
                </div>
              </td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{cr.cat}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: cr.device?'var(--brand)':'var(--text-low)' }}>{cr.device || '—'}</td>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{cr.lastRotated}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', display: 'flex', gap: 3 }}>
                <button onClick={() => showToast('Revision history')} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>History</button>
                <button onClick={() => showToast('Access log')} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Audit</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
      {createModal && <CreatePasswordModal onClose={() => setCreateModal(false)} showToast={showToast} />}
    </div>
  );
}

/* ── Documents ── */
function CustomerDocs({ showToast }) {
  const [createModal, setCreateModal] = React.useState(false);
  const docs = [
    { name: 'Network Diagram — Main Office', type: 'Diagram', updated: 'Jun 2, 2026', version: 'v3', author: 'Mike Reyes' },
    { name: 'Camera Schedule & Locations', type: 'As-Built', updated: 'May 15, 2026', version: 'v2', author: 'Kevin White' },
    { name: 'Alarm Panel Programming Guide', type: 'Runbook', updated: 'Apr 20, 2026', version: 'v1', author: 'Jessica Liu' },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title="Documents & Runbooks" icon="note" count={docs.length} />
        <button onClick={() => setCreateModal(true)} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Document</button>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        {docs.map((d,i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{ fontSize: 20 }}>▤</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{d.type} · {d.version} · Updated {d.updated} by {d.author}</div>
            </div>
            <button onClick={() => showToast('Version history')} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Versions</button>
          </div>
        ))}
      </GlassPanel>
      {createModal && <CreateDocumentModal onClose={() => setCreateModal(false)} showToast={showToast} />}
    </div>
  );
}

/* ── Networks ── */
function CustomerNetworks({ showToast }) {
  const [createModal, setCreateModal] = React.useState(false);
  const networks = [
    { subnet: '192.168.1.0/24', vlan: 10, name: 'Security VLAN', gateway: '192.168.1.1', assignments: 28, site: 'Main Office' },
    { subnet: '192.168.2.0/24', vlan: 20, name: 'Camera VLAN', gateway: '192.168.2.1', assignments: 16, site: 'Main Office' },
    { subnet: '10.0.1.0/24', vlan: 100, name: 'Management', gateway: '10.0.1.1', assignments: 4, site: 'Data Center' },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionHeader title="Networks & IP Addresses" icon="⊚" count={networks.length} />
        <button onClick={() => setCreateModal(true)} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Network</button>
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Subnet','VLAN','Name','Gateway','Assignments','Site'].map((h,i) => (
            <th key={i} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{networks.map((n,i) => (
            <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{n.subnet}</td>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11 }}>{n.vlan}</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{n.name}</td>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{n.gateway}</td>
              <td className="mono" style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11 }}>{n.assignments} IPs</td>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{n.site}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
      {createModal && <CreateNetworkModal onClose={() => setCreateModal(false)} showToast={showToast} />}
    </div>
  );
}

/* ── Create / Edit Customer Modal (writes to the shared store → syncs everywhere) ── */
function CustomerCreateModal({ onClose, showToast, editing }) {
  const [f, setF] = React.useState(() => editing ? {
    name: editing.name || '', dba: editing.dba || '', type: editing.type || 'Commercial', industry: editing.industry || '',
    address: editing.address || '', billing: editing.billing || '', shipping: editing.shipping || '',
    phone: editing.phone || '', website: editing.website || '', taxId: editing.taxId || '',
    terms: editing.terms || 'Net 30', taxExempt: !!editing.taxExempt, owner: editing.owner || '',
    tags: (editing.tags || []).join(', '), notes: editing.notes || '',
  } : { name: '', dba: '', type: 'Commercial', industry: '', address: '', billing: '', shipping: '', phone: '', website: '', taxId: '', terms: 'Net 30', taxExempt: false, owner: '', tags: '', notes: '' });
  const set = (k) => (e) => { const v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e; setF(p => ({ ...p, [k]: v })); };
  const selStyle = { width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' };

  const save = () => {
    if (!f.name.trim()) { showToast('Company name is required'); return; }
    if (editing) {
      const logo = f.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || editing.logo;
      customerStore.set(list => list.map(c => c.id === editing.id ? {
        ...c, name: f.name.trim(), dba: f.dba, type: f.type, industry: f.industry,
        address: f.address, billing: f.billing, shipping: f.shipping, phone: f.phone, website: f.website,
        taxId: f.taxId, terms: f.terms, taxExempt: !!f.taxExempt, owner: f.owner || c.owner,
        tags: f.tags.split(',').map(t => t.trim()).filter(Boolean), notes: f.notes, logo,
      } : c));
      showToast(`${f.name.trim()} updated — synced to all apps`);
    } else {
      const rec = buildCustomer({ ...f, source: 'portal' });
      customerStore.set(list => [rec, ...list]);
      showToast(`${rec.name} created — synced to all apps`);
    }
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 580, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>{editing ? 'Edit Customer' : 'New Customer'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="label-sm">COMPANY</div>
          <div style={{ display: 'flex', gap: 12 }}><CField label="Company Name" placeholder="e.g. Metro Bank Corp" value={f.name} onChange={set('name')} style={{ flex: 2 }} /><CField label="DBA" placeholder="Optional" value={f.dba} onChange={set('dba')} style={{ flex: 1 }} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="label-sm" style={{ marginBottom: 4 }}>Type</div>
              <select value={f.type} onChange={set('type')} style={selStyle}>
                {['Commercial','Government','Healthcare','Hospitality','Residential','Industrial','Education','Non-Profit'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <CField label="Industry" placeholder="Banking" value={f.industry} onChange={set('industry')} style={{ flex: 1 }} />
            <CField label="Account #" placeholder="Auto-generated" value="" onChange={() => {}} style={{ flex: 1 }} />
          </div>
          <div className="label-sm" style={{ marginTop: 4 }}>ADDRESSES</div>
          <CField label="Primary Address" placeholder="1450 Market St, Philadelphia, PA 19102" value={f.address} onChange={set('address')} />
          <div style={{ display: 'flex', gap: 12 }}><CField label="Billing Address" placeholder="Same as primary" value={f.billing} onChange={set('billing')} style={{ flex: 1 }} /><CField label="Shipping" placeholder="Optional" value={f.shipping} onChange={set('shipping')} style={{ flex: 1 }} /></div>
          <div className="label-sm" style={{ marginTop: 4 }}>CONTACT & BILLING</div>
          <div style={{ display: 'flex', gap: 12 }}><CField label="Phone" placeholder="(215) 555-0200" value={f.phone} onChange={set('phone')} style={{ flex: 1 }} /><CField label="Website" placeholder="metrobankcorp.com" value={f.website} onChange={set('website')} style={{ flex: 1 }} /></div>
          <div style={{ display: 'flex', gap: 12 }}><CField label="Tax ID" placeholder="23-4567890" value={f.taxId} onChange={set('taxId')} style={{ flex: 1 }} />
            <div style={{ flex: 1 }}>
              <div className="label-sm" style={{ marginBottom: 4 }}>Payment Terms</div>
              <select value={f.terms} onChange={set('terms')} style={selStyle}>
                {['Due on Receipt','Net 10','Net 15','Net 30','Net 45','Net 60','Net 90','2/10 Net 30'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.taxExempt} onChange={set('taxExempt')} style={{ accentColor: 'var(--brand)' }} />
            <span style={{ color: 'var(--text-mid)' }}>Tax exempt</span>
          </label>
          <div className="label-sm" style={{ marginTop: 4 }}>OWNER & TAGS</div>
          <CField label="Account Owner" placeholder="John Mitchell" value={f.owner} onChange={set('owner')} />
          <CField label="Tags" placeholder="Enterprise, Banking" value={f.tags} onChange={set('tags')} />
          <CField label="Notes" placeholder="Internal notes..." value={f.notes} onChange={set('notes')} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{editing ? 'Save Changes' : 'Create Customer'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-Customer Modal ── */
function SubCustomerModal({ parent, onClose, showToast }) {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('billing_entity');
  const roles = ['billing_entity','estimate_recipient','service_location','AP_contact','division','franchise'];
  const save = () => {
    if (!name.trim()) { showToast('Sub-customer name is required'); return; }
    subCustomerStore.set(list => [...list, { id: Date.now(), parentId: parent.id, name: name.trim(), role, status: 'active' }]);
    showToast('Sub-customer added — synced to all apps');
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 440, padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 16, fontWeight: 400 }}>Add Sub-Customer</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>Parent: <strong>{parent.name}</strong></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CField label="Name" placeholder="e.g. City Hall — Annex Building" value={name} onChange={e => setName(e.target.value)} />
          <div>
            <div className="label-sm" style={{ marginBottom: 6 }}>ROLE</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {roles.map(r => (
                <button key={r} onClick={() => setRole(r)} style={{ padding: '5px 10px', borderRadius: 5, fontSize: 10, background: r===role?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${r===role?'var(--brand)':'var(--border-subtle)'}`, color: r===role?'var(--brand)':'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{r.replace(/_/g,' ')}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ padding: '8px 20px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add</button>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Customer Selector (with inline + Add new customer) ── */
function CustomerSelector({ value, onChange, showToast, style }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [quickCreate, setQuickCreate] = React.useState(false);
  const allCusts = useShieldStore(customerStore)[0];
  const customers = allCusts.map(c => c.name);
  const filtered = search ? customers.filter(c => c.toLowerCase().includes(search.toLowerCase())) : customers;

  if (quickCreate) {
    return (
      <div style={{ ...style }}>
        <div className="label-sm" style={{ marginBottom: 4 }}>QUICK-CREATE CUSTOMER</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input autoFocus placeholder="Company name..." style={{ flex: 1, padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--brand)', borderRadius: 5, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
          <button onClick={() => { setQuickCreate(false); onChange?.('New Customer'); showToast?.('Customer created & selected'); }} style={{ padding: '6px 12px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
          <button onClick={() => setQuickCreate(false)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <div className="label-sm" style={{ marginBottom: 4 }}>CUSTOMER</div>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '7px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: value ? 'var(--text-high)' : 'var(--text-low)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
        <span>{value || 'Select customer...'}</span>
        <span style={{ color: 'var(--text-low)' }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4, background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '6px 0', maxHeight: 240, overflow: 'auto' }}>
          <div style={{ padding: '4px 8px' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '5px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }} />
          </div>
          {filtered.map(c => (
            <button key={c} onClick={() => { onChange?.(c); setOpen(false); setSearch(''); }} style={{ display: 'block', width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: value===c?'var(--brand)':'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', fontWeight: value===c?600:400 }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>{c}</button>
          ))}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 8px' }} />
          <button onClick={() => { setOpen(false); setQuickCreate(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', fontWeight: 600 }}>
            <span>+</span> Add new customer
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Customer Onboarding Tab (merged from standalone screen) ── */
function CustomerOnboardingTab({ customer, showToast }) {
  const c = customer;
  const [steps, setSteps] = React.useState([
    { id: 1, label: 'Welcome email sent', done: true, auto: true },
    { id: 2, label: 'Customer portal credentials created', done: true, auto: true },
    { id: 3, label: 'Site survey scheduled', done: true, auto: false },
    { id: 4, label: 'Design / floor plan uploaded', done: c.assets > 0, auto: false },
    { id: 5, label: 'Proposal accepted & signed', done: c.mrr > 0, auto: false },
    { id: 6, label: 'Equipment ordered', done: c.assets > 20, auto: false },
    { id: 7, label: 'Installation scheduled', done: c.assets > 20, auto: false },
    { id: 8, label: 'Installation complete', done: c.assets > 30, auto: false },
    { id: 9, label: 'System test & handoff', done: c.assets > 30, auto: false },
    { id: 10, label: 'Monitoring activated & RMR billing started', done: c.mrr > 0, auto: true },
    { id: 11, label: 'Customer satisfaction survey sent', done: false, auto: true },
    { id: 12, label: 'Onboarding complete', done: false, auto: false },
  ]);
  const completedCount = steps.filter(s => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);
  const toggleStep = (id) => { setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s)); showToast('Checklist updated'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <GlassPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div><div style={{ fontSize: 14, fontWeight: 500 }}>Onboarding: {c.name}</div><div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{completedCount}/{steps.length} steps complete</div></div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: pct === 100 ? 'var(--status-ok)' : 'var(--brand)' }}>{pct}%</div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: pct === 100 ? 'var(--status-ok)' : 'var(--brand)', transition: 'width 0.3s' }} /></div>
      </GlassPanel>
      <GlassPanel style={{ padding: 0 }}>
        {steps.map((step, i) => (
          <div key={step.id} onClick={() => toggleStep(step.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < steps.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none', cursor: 'pointer', opacity: step.done ? 0.6 : 1 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: step.done ? 'var(--status-ok)' : 'transparent', border: step.done ? 'none' : '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{step.done ? '✓' : ''}</div>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)', textDecoration: step.done ? 'line-through' : 'none' }}>{step.label}</span>
            {step.auto && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.06)', color: 'var(--brand)', border: '1px solid var(--border-subtle)' }}>Auto</span>}
          </div>
        ))}
      </GlassPanel>
      <GlassPanel style={{ borderLeft: '3px solid var(--brand)', padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⟡</span><span style={{ fontSize: 12, color: 'var(--brand)' }}>Hermes: Next step is "{steps.find(s => !s.done)?.label || 'All complete!'}". Want me to send a reminder or schedule it?</span></div></GlassPanel>
    </div>
  );
}

/* ── Customer Status Page Tab (auto-generated by AI, customer-facing) ── */
function CustomerStatusTab({ customer, showToast }) {
  const c = customer;
  const systems = [
    { name: 'CCTV / Surveillance', status: 'operational', uptime: '99.97%', lastIncident: '14d ago' },
    { name: 'Access Control', status: 'operational', uptime: '99.99%', lastIncident: '32d ago' },
    { name: 'Alarm / Intrusion', status: 'operational', uptime: '100%', lastIncident: 'None' },
    { name: 'Network Infrastructure', status: c.health < 70 ? 'degraded' : 'operational', uptime: c.health < 70 ? '98.2%' : '99.95%', lastIncident: c.health < 70 ? '2d ago' : '21d ago' },
    { name: 'Monitoring Service (RMR)', status: c.mrr > 0 ? 'operational' : 'inactive', uptime: c.mrr > 0 ? '100%' : '—', lastIncident: '—' },
  ];
  const allOp = systems.every(s => s.status === 'operational' || s.status === 'inactive');
  const statusColors = { operational: 'var(--status-ok)', degraded: 'var(--status-warn)', down: 'var(--status-critical)', inactive: 'var(--text-low)' };
  const incidents = [{ date: 'May 28', title: 'NVR brief connectivity drop', dur: '12 min' },{ date: 'May 14', title: 'Scheduled maintenance — firmware', dur: '45 min' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <GlassPanel style={{ borderLeft: '3px solid var(--brand)', padding: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⟡</span><span style={{ fontSize: 12, color: 'var(--brand)' }}>Auto-generated by Hermes AI — visible to {c.name} in their Customer Portal. Updates in real-time.</span></div></GlassPanel>
      <GlassPanel style={{ textAlign: 'center', padding: 20 }}>
        <StatusDot status={allOp ? 'online' : 'warning'} size={12} />
        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 8, color: allOp ? 'var(--status-ok)' : 'var(--status-warn)' }}>{allOp ? 'All Systems Operational' : 'Partial Degradation'}</div>
        <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 4 }}>Last checked: just now · Auto-refreshes every 60s</div>
      </GlassPanel>
      <GlassPanel style={{ padding: 0 }}>
        {systems.map((sys, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < systems.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none' }}>
            <StatusDot status={sys.status === 'operational' ? 'online' : sys.status === 'degraded' ? 'warning' : 'offline'} size={7} />
            <span style={{ flex: 1, fontSize: 12 }}>{sys.name}</span>
            <span style={{ fontSize: 10, color: statusColors[sys.status], textTransform: 'capitalize', fontWeight: 500 }}>{sys.status}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 50, textAlign: 'right' }}>{sys.uptime}</span>
          </div>
        ))}
      </GlassPanel>
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>90-DAY UPTIME</div>
        <div style={{ display: 'flex', gap: 1, height: 24, borderRadius: 3, overflow: 'hidden' }}>
          {Array.from({ length: 90 }).map((_, i) => { const bad = i === 62 || i === 76; return <div key={i} style={{ flex: 1, background: bad ? 'var(--status-warn)' : 'var(--status-ok)', opacity: bad ? 1 : 0.4, borderRadius: 1 }} />; })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginTop: 4 }}><span>90 days ago</span><span>Today</span></div>
      </GlassPanel>
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>RECENT INCIDENTS</div>
        {incidents.map((inc, i) => (<div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusDot status="online" size={6} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{inc.title}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{inc.date} · {inc.dur} · Resolved</div></div></div>))}
      </GlassPanel>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => showToast('Status page link copied')} style={{ flex: 1, padding: '8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Copy Public Link</button>
        <button onClick={() => showToast('Notification settings opened')} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Notification Settings</button>
      </div>
    </div>
  );
}

Object.assign(window, { CustomersScreen, CustomerDetail, CustomerContacts, CustomerSites, CustomerAssets, CustomerFlexAssets, CustomerPasswords, CustomerDocs, CustomerNetworks, CustomerCreateModal, SubCustomerModal, CustomerSelector, CustomerOnboardingTab, CustomerStatusTab });

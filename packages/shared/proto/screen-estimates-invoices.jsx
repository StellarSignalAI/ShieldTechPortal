/* Vendored from updated design prototype (new-generation screens). */

// ── screen-finance-v2.jsx ──
/* Finance Suite V2 — Full QuickBooks Replacement + Stripe */

function NIFinanceScreen({ initialTab }) {
  const [tab, setTab] = React.useState(initialTab || 'overview');
  const [drawer, setDrawer] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [selectedInv, setSelectedInv] = React.useState(null);
  const [invFilter, setInvFilter] = React.useState('All');
  const [toast, setToast] = React.useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '◉' },
    { id: 'invoices', label: 'Invoices', icon: '⊞' },
    { id: 'recurring', label: 'Recurring', icon: '◔' },
    { id: 'estimates', label: 'Estimates', icon: '◇' },
    { id: 'credits', label: 'Credits & Receipts', icon: '◈' },
    { id: 'products', label: 'Products & Services', icon: '⊡' },
    { id: 'ap', label: 'Bills & AP', icon: '⊜' },
    { id: 'expenses', label: 'Expenses', icon: '◈' },
    { id: 'accounts', label: 'Chart of Accounts', icon: '⊡' },
    { id: 'ledger', label: 'General Ledger', icon: '⊞' },
    { id: 'bankfeed', label: 'Bank Feed', icon: '◎' },
    { id: 'statements', label: 'Statements', icon: '◉' },
    { id: 'reconcile', label: 'Reconciliation', icon: '◎' },
    { id: 'reports-center', label: 'Reports', icon: '▥' },
    { id: 'stripe', label: 'Stripe Payments', icon: '⊛' },
    { id: 'branding', label: 'Branding', icon: '✎' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
    { id: 'copilot', label: 'AI Co-pilot', icon: '⟡' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Finance Tab Bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 0 12px', overflowX: 'auto', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
            background: tab === t.id ? 'rgba(63,169,245,0.12)' : 'transparent',
            border: `1px solid ${tab === t.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
            color: tab === t.id ? 'var(--brand)' : 'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
          }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'overview' && <NIFinanceOverview onNav={setTab} />}
        {tab === 'invoices' && <NIFinanceInvoices drawer={drawer} setDrawer={setDrawer} modal={modal} setModal={setModal} selectedInv={selectedInv} setSelectedInv={setSelectedInv} invFilter={invFilter} setInvFilter={setInvFilter} showToast={showToast} />}
        {tab === 'recurring' && <NIFinanceRecurring showToast={showToast} />}
        {tab === 'estimates' && <NIFinanceEstimates setModal={setModal} showToast={showToast} />}
        {tab === 'ap' && <NIFinanceAP setDrawer={setDrawer} setModal={setModal} showToast={showToast} />}
        {tab === 'expenses' && <NIFinanceExpenses setModal={setModal} showToast={showToast} />}
        {tab === 'accounts' && <NIFinanceCOA setModal={setModal} showToast={showToast} />}
        {tab === 'ledger' && <NIFinanceGL />}
        {tab === 'statements' && <NIFinanceStatements />}
        {tab === 'reconcile' && <NIFinanceReconcile showToast={showToast} />}
        {tab === 'credits' && <FinanceCredits showToast={showToast} />}
        {tab === 'products' && <FinanceProducts setModal={setModal} showToast={showToast} />}
        {tab === 'bankfeed' && <FinanceBankFeed showToast={showToast} />}
        {tab === 'reports-center' && <FinanceReportsCenter showToast={showToast} />}
        {tab === 'stripe' && <FinanceStripe />}
        {tab === 'branding' && <BrandingStudio showToast={showToast} />}
        {tab === 'settings' && <FinanceSettings showToast={showToast} />}
        {tab === 'copilot' && <FinanceCopilot />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>
          {toast}
        </div>
      )}

      {/* Modal Overlay */}
      {modal && <NIFinanceModal modal={modal} setModal={setModal} showToast={showToast} />}

      {/* Drawer Overlay */}
      {drawer && <NIFinanceDrawer drawer={drawer} setDrawer={setDrawer} showToast={showToast} />}
    </div>
  );
}

/* ── Finance Overview Dashboard ── */
function NIFinanceOverview({ onNav }) {
  const arBuckets = [
    { label: 'Current', amount: 134400, color: 'var(--status-ok)' },
    { label: '1–30', amount: 22100, color: 'var(--status-warn)' },
    { label: '31–60', amount: 14250, color: 'var(--status-critical)' },
    { label: '60+', amount: 5200, color: '#c084fc' },
  ];
  const arTotal = arBuckets.reduce((s, b) => s + b.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1400 }}>
      {/* Top KPIs */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="CASH POSITION" value="$482,600" mono={false} trend="+$38K this week" trendDir="up" delay={0} />
        <StatCard label="REVENUE (MTD)" value="$284,600" mono={false} trend="+8.2% vs prior" trendDir="up" delay={80} />
        <StatCard label="REVENUE (YTD)" value="$1.25M" mono={false} delay={160} />
        <StatCard label="GROSS MARGIN" value="28.4%" mono={false} trend="Target: 25%" trendDir="up" delay={240} />
        <StatCard label="MRR" value="$171,200" mono={false} trend="+3.8% MoM" trendDir="up" delay={320} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* AR Aging */}
        <GlassPanel style={{ cursor: 'pointer' }} onClick={() => onNav('invoices')}>
          <SectionHeader title="Accounts Receivable" icon="reports" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
            {arBuckets.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>${(b.amount/1000).toFixed(1)}K</span>
                <div style={{ width: '100%', height: Math.max((b.amount/arTotal)*80, 12), background: `${b.color}25`, border: `1px solid ${b.color}40`, borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: 8, color: 'var(--text-low)' }}>{b.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Total Outstanding</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>${arTotal.toLocaleString()}</span>
          </div>
        </GlassPanel>

        {/* AP Summary */}
        <GlassPanel style={{ cursor: 'pointer' }} onClick={() => onNav('ap')}>
          <SectionHeader title="Accounts Payable" icon="finance" />
          {[
            { label: 'Due This Week', amount: '$8,420', color: 'var(--status-critical)' },
            { label: 'Due This Month', amount: '$24,600', color: 'var(--status-warn)' },
            { label: 'Overdue', amount: '$3,200', color: 'var(--status-critical)' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{r.label}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: r.color }}>{r.amount}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Total AP</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>$36,220</span>
          </div>
        </GlassPanel>

        {/* Profit & Loss Quick */}
        <GlassPanel style={{ cursor: 'pointer' }} onClick={() => onNav('statements')}>
          <SectionHeader title="P&L Summary (MTD)" icon="forecast" />
          {[
            { label: 'Revenue', value: '$284,600', indent: 0 },
            { label: 'Cost of Goods', value: '−$142,800', indent: 1, color: 'var(--text-mid)' },
            { label: 'Gross Profit', value: '$141,800', indent: 0, bold: true },
            { label: 'Operating Expenses', value: '−$61,100', indent: 1, color: 'var(--text-mid)' },
            { label: 'Net Income', value: '$80,700', indent: 0, bold: true, color: 'var(--status-ok)' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', paddingLeft: r.indent * 12, borderBottom: r.bold ? '1px solid var(--border-subtle)' : '1px solid rgba(63,169,245,0.03)' }}>
              <span style={{ fontSize: 12, color: r.color || 'var(--text-high)', fontWeight: r.bold ? 600 : 400 }}>{r.label}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: r.bold ? 600 : 400, color: r.color || 'var(--text-high)' }}>{r.value}</span>
            </div>
          ))}
        </GlassPanel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Cash Flow Forecast */}
        <GlassPanel>
          <SectionHeader title="90-Day Cash Flow Forecast" icon="⟡" />
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {[
              { label: '30 Days', inflow: '$186K', outflow: '$124K', net: '+$62K', color: 'var(--status-ok)' },
              { label: '60 Days', inflow: '$342K', outflow: '$248K', net: '+$94K', color: 'var(--status-ok)' },
              { label: '90 Days', inflow: '$510K', outflow: '$385K', net: '+$125K', color: 'var(--status-ok)' },
            ].map((p, i) => (
              <div key={i} className="glass" style={{ flex: 1, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 6 }}>{p.label}</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: p.color }}>{p.net}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 4 }}>In: {p.inflow} · Out: {p.outflow}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⟡</span>
            <span style={{ fontSize: 11, color: 'var(--brand)' }}>ShieldTech AI: Cash position strong. $19,450 in overdue AR is the main risk — draft collection reminders?</span>
            <button onClick={() => shieldModal({ kind: 'editor', title: 'Collection Reminders', subtitle: '3 overdue accounts · $19,450 outstanding', submitLabel: 'Send Reminders', successMsg: 'Reminders sent to 3 accounts', value: 'Subject: Friendly reminder — invoice past due\n\nHi {{customer}},\n\nOur records show invoice {{invoice}} for {{amount}} is now {{days}} days past due. If payment has already been sent, please disregard this note.\n\nYou can pay securely online or reply with any questions. We appreciate your business.\n\nBest regards,\nShieldTech Accounts Receivable' })} style={{ marginLeft: 'auto', padding: '3px 10px', fontSize: 10, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Draft Reminders</button>
          </div>
        </GlassPanel>

        {/* Profitability by Service Line */}
        <GlassPanel>
          <SectionHeader title="Profitability by Service Line" icon="flag" />
          {[
            { line: 'CCTV / Video', revenue: 142000, margin: 32.1, jobs: 24 },
            { line: 'Access Control', revenue: 68400, margin: 28.7, jobs: 12 },
            { line: 'Alarm / Intrusion', revenue: 38200, margin: 35.4, jobs: 18 },
            { line: 'Fire / Life Safety', revenue: 28400, margin: 22.8, jobs: 6 },
            { line: 'Managed Services (RMR)', revenue: 171200, margin: 68.2, jobs: 0 },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-high)', flex: 1 }}>{s.line}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)', width: 70, textAlign: 'right' }}>${(s.revenue/1000).toFixed(0)}K</span>
              <div style={{ width: 60 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(s.margin / 70 * 100, 100)}%`, height: '100%', borderRadius: 2, background: s.margin >= 30 ? 'var(--status-ok)' : s.margin >= 20 ? 'var(--status-warn)' : 'var(--status-critical)' }} />
                </div>
              </div>
              <span className="mono" style={{ fontSize: 11, fontWeight: 600, width: 42, textAlign: 'right', color: s.margin >= 30 ? 'var(--status-ok)' : s.margin >= 20 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{s.margin}%</span>
            </div>
          ))}
        </GlassPanel>
      </div>

      {/* Recent Transactions */}
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <SectionHeader title="Recent Transactions" icon="◉" />
          <span style={{ fontSize: 11, color: 'var(--text-low)' }}>Auto-posted from invoices, payments, and bills</span>
        </div>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {[
          ].map((tx, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px', borderBottom: '1px solid rgba(63,169,245,0.03)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 48 }}>{tx.date}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{tx.desc}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 100 }}>{tx.acct}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: tx.type === 'credit' ? 'var(--status-ok)' : tx.type === 'debit' ? 'var(--status-critical)' : 'var(--text-high)' }}>{tx.amount}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── Invoices Tab ── */
function NIFinanceInvoices({ drawer, setDrawer, modal, setModal, selectedInv, setSelectedInv, invFilter, setInvFilter, showToast }) {
  /* Live shared store — invoice actions persist and sync across surfaces */
  const [invoices] = useShieldStore(invoiceStore);
  const updateInv = (num, patch) => invoiceStore.set(prev => prev.map(i => i.num === num ? { ...i, ...(typeof patch === 'function' ? patch(i) : patch) } : i));

  const filtered = invFilter === 'All' ? invoices : invoices.filter(i => i.status === invFilter.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All','Paid','Pending','Overdue','Draft'].map(f => (
            <button key={f} onClick={() => setInvFilter(f)} style={{
              padding: '4px 12px', fontSize: 11, borderRadius: 5,
              background: invFilter === f ? 'rgba(63,169,245,0.12)' : 'transparent',
              border: `1px solid ${invFilter === f ? 'var(--brand)' : 'var(--border-subtle)'}`,
              color: invFilter === f ? 'var(--brand)' : 'var(--text-low)',
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>
              {f} {f !== 'All' && <span className="mono" style={{ fontSize: 9, marginLeft: 3, opacity: 0.6 }}>({invoices.filter(i => i.status === f.toLowerCase()).length})</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModal({ type: 'new-invoice' })} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Invoice</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedInv !== null ? '1fr 400px' : '1fr', gap: 12 }}>
        <GlassPanel style={{ padding: 0 }}>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Invoice','Customer','Amount','Status','Due','Terms',''].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 2 ? 'right' : 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'var(--card)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={i} onClick={() => setSelectedInv(i)} style={{ cursor: 'pointer', background: selectedInv === i ? 'rgba(63,169,245,0.06)' : 'transparent', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (selectedInv !== i) e.currentTarget.style.background = 'rgba(63,169,245,0.03)'; }}
                    onMouseLeave={e => { if (selectedInv !== i) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{inv.num}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{inv.customer}</td>
                    <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${inv.amount.toLocaleString()}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={inv.status} /></td>
                    <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: inv.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-mid)' }}>{inv.due}{inv.days > 0 ? ` (${inv.days}d)` : ''}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{inv.terms}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <span style={{ color: 'var(--text-low)', fontSize: 14 }}>›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        {/* Invoice Detail Drawer */}
        {selectedInv !== null && filtered[selectedInv] && (
          <GlassPanel style={{ animation: 'fade-up 0.25s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)' }}>{filtered[selectedInv].num}</div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 2 }}>{filtered[selectedInv].customer}</div>
              </div>
              <StatusBadge status={filtered[selectedInv].status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <DetailField label="Amount" value={`$${filtered[selectedInv].amount.toLocaleString()}`} mono />
              <DetailField label="Due Date" value={filtered[selectedInv].due} mono />
              <DetailField label="Terms" value={filtered[selectedInv].terms} />
              <DetailField label="PO Number" value={filtered[selectedInv].po || '—'} mono />
            </div>

            <div className="label-sm" style={{ marginBottom: 6 }}>LINE ITEMS</div>
            {filtered[selectedInv].lines.map((li, j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-mid)', flex: 1 }}>{li.desc}</span>
                <span className="mono" style={{ color: 'var(--text-low)', marginRight: 8 }}>{li.qty > 1 ? `${li.qty} × $${li.rate.toLocaleString()}` : ''}</span>
                <span className="mono" style={{ color: 'var(--text-high)', fontWeight: 500 }}>${(li.qty * li.rate).toLocaleString()}</span>
              </div>
            ))}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {filtered[selectedInv].status === 'draft' && (
                <button onClick={() => { const inv = filtered[selectedInv]; const mail = buildInvoiceEmail({ ...inv, due: 'Jul 21, 2026' }); updateInv(inv.num, { status: 'pending', due: 'Jul 21, 2026', sentAt: Date.now(), payLink: mail.payLink }); queueEmail(mail); showToast(`${inv.num} finalized — branded email with pay link queued in Outbox`); }} style={{ width: '100%', padding: '9px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Finalize & Send</button>
              )}
              {filtered[selectedInv].status === 'pending' && <>
                <button onClick={() => { const inv = filtered[selectedInv]; updateInv(inv.num, { payLink: `pay.shieldtech.com/${inv.num.toLowerCase()}`, payLinkAt: Date.now() }); showToast(`Stripe payment link created — pay.shieldtech.com/${inv.num.toLowerCase()}`); }} style={{ width: '100%', padding: '9px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>⊛</span> {filtered[selectedInv].payLink ? 'Payment Link Active ✓' : 'Create Stripe Payment Link'}
                </button>
                <button onClick={() => { const inv = filtered[selectedInv]; updateInv(inv.num, { status: 'paid', days: 0, paidAt: Date.now() }); showToast(`Payment recorded — ${inv.num} marked paid ($${inv.amount.toLocaleString()})`); }} style={{ width: '100%', padding: '9px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Record Payment</button>
              </>}
              {filtered[selectedInv].status === 'overdue' && <>
                <button onClick={() => { const inv = filtered[selectedInv]; approvalStore.set(prev => [{ id: prev.reduce((m, a) => Math.max(m, a.id), 0) + 1, kind: 'AR REMINDER', title: `${inv.customer} — ${inv.num} reminder (${inv.days}d overdue)`, amt: `$${inv.amount.toLocaleString()}`, sub: 'AI-drafted · review before sending', status: 'pending' }, ...prev]); showToast(`Reminder drafted for ${inv.num} → Approvals queue`); }} style={{ width: '100%', padding: '9px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>⟡</span> AI Draft Reminder
                </button>
                <button onClick={() => { const inv = filtered[selectedInv]; const mail = buildInvoiceEmail(inv); updateInv(inv.num, { payLink: mail.payLink, payLinkSentAt: Date.now() }); queueEmail(mail); showToast(`Payment-link email for ${inv.num} queued in Outbox`); }} style={{ width: '100%', padding: '9px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{filtered[selectedInv].payLinkSentAt ? 'Payment Link Sent ✓' : 'Send Payment Link'}</button>
              </>}
              <button onClick={() => { const inv = filtered[selectedInv]; payFocusStore.set(inv.num); navTo('pay'); }} style={{ width: '100%', padding: '8px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View customer pay page →</button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => showToast('PDF downloaded')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Download PDF</button>
                <button onClick={() => { const inv = filtered[selectedInv]; const num = nextInvoiceNum(); invoiceStore.set(prev => [{ ...inv, num, status: 'draft', due: '—', days: 0, payLink: null, payLinkSentAt: null, paidAt: null }, ...prev]); setSelectedInv(null); showToast(`Duplicated as ${num} (draft)`); }} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Duplicate</button>
                {filtered[selectedInv].status !== 'paid' && (
                  <button onClick={() => { const inv = filtered[selectedInv]; updateInv(inv.num, { status: 'void', days: 0 }); setSelectedInv(null); showToast(`${inv.num} voided`); }} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 5, color: 'var(--status-critical)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Void</button>
                )}
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

/* ── Recurring Invoices / Subscriptions ── */
function NIFinanceRecurring({ showToast }) {
  const subs = [
    { customer: 'Westfield Mall', amount: 5200, freq: 'Monthly', next: 'Jul 1, 2026', method: 'Stripe AutoPay', status: 'active', stripe: true },
    { customer: 'Metro Bank Corp', amount: 4800, freq: 'Monthly', next: 'Jul 1, 2026', method: 'Stripe AutoPay', status: 'active', stripe: true },
    { customer: 'City Hall', amount: 3200, freq: 'Monthly', next: 'Jul 1, 2026', method: 'Manual Invoice', status: 'active', stripe: false },
    { customer: 'Riverside Medical', amount: 2800, freq: 'Monthly', next: 'Jul 1, 2026', method: 'Stripe AutoPay', status: 'active', stripe: true },
    { customer: 'Acme Dental Group', amount: 2400, freq: 'Monthly', next: 'Jul 1, 2026', method: 'Manual Invoice', status: 'active', stripe: false },
    { customer: 'Harbor View Condos', amount: 1800, freq: 'Monthly', next: 'Jul 1, 2026', method: 'Manual Invoice', status: 'past_due', stripe: false },
  ];
  const totalMRR = subs.reduce((s, r) => s + r.amount, 0);
  const autoPayPct = Math.round(subs.filter(s => s.stripe).length / subs.length * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1200 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="TOTAL MRR" value={`$${(totalMRR).toLocaleString()}`} mono={false} delay={0} />
        <StatCard label="ARR" value={`$${(totalMRR * 12 / 1000).toFixed(0)}K`} mono={false} delay={80} />
        <StatCard label="AUTOPAY RATE" value={`${autoPayPct}%`} mono={false} delay={160} />
        <StatCard label="ACTIVE SUBS" value={subs.filter(s => s.status === 'active').length} delay={240} />
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <SectionHeader title="Recurring Invoices / Subscriptions" icon="◔" />
          <button onClick={() => showToast('New subscription modal opened')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Subscription</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Customer','Amount','Frequency','Next Invoice','Payment Method','Status',''].map((h, i) => (
              <th key={i} style={{ textAlign: i === 1 ? 'right' : 'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {subs.map((s, i) => (
              <tr key={i} style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{s.customer}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${s.amount.toLocaleString()}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{s.freq}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{s.next}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: s.stripe ? 'var(--brand)' : 'var(--text-low)' }}>{s.stripe && '⊛ '}{s.method}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={s.status === 'active' ? 'online' : 'critical'} label={s.status === 'active' ? 'Active' : 'Past Due'} /></td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <button onClick={() => showToast(s.stripe ? 'Stripe subscription updated' : 'Enroll in AutoPay?')} style={{ padding: '3px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{s.stripe ? 'Manage' : 'Enroll AutoPay'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Stub components for remaining tabs — defined in screen-finance-books.jsx / screen-finance-payments.jsx ── */

/* ── DetailField helper ── */
function DetailField({ label, value, mono }) {
  return (
    <div>
      <div className="label-sm" style={{ marginBottom: 3 }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 13, color: 'var(--text-high)' }}>{value}</div>
    </div>
  );
}

/* Direct-entry screens — Finance Suite opened on a specific tab (sidebar + mobile bottom bar) */
function InvoicesDirectScreen() { return <NIFinanceScreen initialTab="invoices" />; }
function EstimatesDirectScreen() { return <NIFinanceScreen initialTab="estimates" />; }

Object.assign(window, { NIFinanceScreen, NIFinanceOverview, NIFinanceInvoices, NIFinanceRecurring, InvoicesDirectScreen, EstimatesDirectScreen });


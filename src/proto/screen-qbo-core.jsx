/* QBO Handoff — Core: sync badges, demo states, cross-links, QBO Map */

/* ── Cross-module navigation helper ── */
function qboGo(screen, params) {
  window.__qboParams = params || {};
  if (window.__shieldNav) window.__shieldNav(screen);
  window.dispatchEvent(new CustomEvent('qbo-nav', { detail: { screen, params: params || {} } }));
}

/* ── Cross-link chip (wired navigation between modules) ── */
function LinkChip({ screen, params, label, color }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); qboGo(screen, params); }} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20,
      background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)',
      color: color || 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
    }}>
      {label} <span style={{ fontSize: 9, opacity: 0.7 }}>→</span>
    </button>
  );
}

/* ── QuickBooks sync metadata badge ── */
function QboSyncBadge({ state = 'synced', time = '2 min ago' }) {
  const cfg = {
    synced: { c: 'var(--status-ok)', label: `QBO synced · ${time}` },
    stale: { c: 'var(--status-warn)', label: `QBO stale · last sync 3 hrs ago` },
    error: { c: 'var(--status-critical)', label: `QBO sync error · retrying` },
  }[state] || { c: 'var(--text-mid)', label: 'QBO not connected' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'var(--card)', fontSize: 10, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.c, boxShadow: `0 0 6px ${cfg.c}` }}></span>
      {cfg.label}
    </span>
  );
}

/* ── Demo state switcher (loading / empty / error / synced / stale / denied) ── */
const QBO_STATES = ['live', 'loading', 'empty', 'error', 'stale', 'denied'];
function DemoStateBar({ state, setState }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 2, borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'var(--card)' }}>
      <span style={{ fontSize: 9, color: 'var(--text-mid)', padding: '0 6px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>State</span>
      {QBO_STATES.map((s) => (
        <button key={s} onClick={() => setState(s)} style={{
          padding: '2px 8px', borderRadius: 16, fontSize: 9.5, fontWeight: state === s ? 700 : 400,
          background: state === s ? 'rgba(63,169,245,0.15)' : 'transparent', border: 'none',
          color: state === s ? 'var(--brand)' : 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize'
        }}>{s}</button>
      ))}
    </div>
  );
}

/* ── State gate — wraps content and renders the selected demo state ── */
function StateGate({ state = 'live', label = 'records', onRetry, children }) {
  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
        {[92, 100, 78, 96, 60].map((w, i) => (
          <div key={i} style={{ height: 44, width: `${w}%`, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(63,169,245,0.06), rgba(255,255,255,0.02))', backgroundSize: '200% 100%', animation: 'qbo-shimmer 1.4s linear infinite' }}></div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>Loading {label} from QuickBooks…</div>
      </div>
    );
  }
  if (state === 'empty') {
    return (
      <GlassPanel style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 10 }}>⊘</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No {label} yet</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 16 }}>Once QuickBooks sync runs or you create your first record, it will appear here.</div>
        <button onClick={() => shieldToast('Create flow opened', 'info')} style={{ padding: '6px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ Create</button>
      </GlassPanel>
    );
  }
  if (state === 'error') {
    return (
      <GlassPanel style={{ textAlign: 'center', padding: '48px 24px', borderColor: 'rgba(239,68,68,0.35)' }}>
        <div style={{ fontSize: 28, color: 'var(--status-critical)', marginBottom: 10 }}>⚠</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Couldn't load {label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 4 }}>QBO-410: QuickBooks token expired during import. Your data is safe — nothing was posted.</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Last successful sync: Jul 5, 2026 06:12</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => (onRetry ? onRetry() : shieldToast('Retrying sync…', 'info'))} style={{ padding: '6px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Retry sync</button>
          <button onClick={() => qboGo('integrations')} style={{ padding: '6px 18px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Open Integrations</button>
        </div>
      </GlassPanel>
    );
  }
  if (state === 'denied') {
    return (
      <GlassPanel style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 28, opacity: 0.4, marginBottom: 10 }}>🔒</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>You don't have access to {label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 16 }}>Your role (Technician) doesn't include finance permissions. Ask an admin to grant "Finance · View".</div>
        <button onClick={() => qboGo('portal-settings', { section: 'users' })} style={{ padding: '6px 18px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Request access</button>
      </GlassPanel>
    );
  }
  return (
    <React.Fragment>
      {state === 'stale' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.06)', marginBottom: 12, fontSize: 11.5, color: 'var(--status-warn)' }}>
          <span>◔</span> Data shown is from the last successful QuickBooks sync (3 hrs ago). Live totals may differ.
          <button onClick={() => shieldToast('Sync queued — refreshing from QuickBooks', 'info')} style={{ marginLeft: 'auto', padding: '3px 12px', background: 'transparent', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 5, color: 'var(--status-warn)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Sync now</button>
        </div>
      )}
      {children}
    </React.Fragment>
  );
}

/* ── QBO Map — full traceability of the 153-item scan ── */
const QBO_MAP_DATA = [
  { area: 'Home & command', rows: [
    { dest: 'Dashboard', key: 'dashboard', n: 1, go: { screen: 'dashboard' }, abs: ['Home dashboard'] },
    { dest: 'Daily Mission', key: 'daily-mission', n: 3, go: { screen: 'digest' }, abs: ['Feed', 'Tasks', 'Notifications and tasks panel'] },
    { dest: 'Portal search', key: 'search', n: 2, go: { screen: 'custom-dashboard' }, abs: ['Global search', 'Search panel'] },
    { dest: 'Finance / AI Co-pilot', key: 'finance:copilot', n: 2, go: { screen: 'finance', params: { financeTab: 'copilot' } }, abs: ['Intuit Intelligence chat', 'AI chat panel'] },
    { dest: 'QBO Map', key: 'finance:qbo-map', n: 2, go: { screen: 'finance', params: { financeTab: 'qbo-map' } }, abs: ['Create menu panel', 'Settings menu panel'] },
    { dest: 'Portal navigation', key: 'navigation', n: 1, go: { screen: 'dashboard' }, abs: ['Left navigation'] }] },
  { area: 'Money in', rows: [
    { dest: 'Finance / Overview', key: 'finance:overview', n: 1, go: { screen: 'finance', params: { financeTab: 'overview' } }, abs: ['Sales overview'] },
    { dest: 'Finance / Invoices', key: 'finance:invoices', n: 5, go: { screen: 'finance', params: { financeTab: 'invoices' } }, abs: ['Invoice (Create + Sales)', 'Delayed charge', 'Sales transactions', 'Invoice detail drawer'] },
    { dest: 'Finance / Estimates', key: 'finance:estimates', n: 3, go: { screen: 'finance', params: { financeTab: 'estimates' } }, abs: ['Estimate (Create + Customer Hub)', 'Estimate detail drawer'] },
    { dest: 'Finance / Stripe Payments', key: 'finance:stripe', n: 2, go: { screen: 'finance', params: { financeTab: 'stripe' } }, abs: ['Payment links (Create + Sales)'] },
    { dest: 'Finance / Credits & Receipts', key: 'finance:credits', n: 5, go: { screen: 'finance', params: { financeTab: 'credits' } }, abs: ['Receive payment', 'Credit memo', 'Sales receipt', 'Refund receipt', 'Delayed credit'] },
    { dest: 'Finance / Statements', key: 'finance:statements', n: 1, go: { screen: 'finance', params: { financeTab: 'statements' } }, abs: ['Statement'] },
    { dest: 'Finance / Recurring', key: 'finance:recurring', n: 3, go: { screen: 'finance', params: { financeTab: 'recurring' } }, abs: ['Recurring payments', 'Recurring transactions'] },
    { dest: 'Finance / Products & Services', key: 'finance:products', n: 4, go: { screen: 'finance', params: { financeTab: 'products' } }, abs: ['Products & Services (3 areas)', 'Product/service drawer'] }] },
  { area: 'Money out', rows: [
    { dest: 'Finance / Bills & AP', key: 'finance:ap', n: 7, go: { screen: 'finance', params: { financeTab: 'ap' } }, abs: ['Vendors', 'Bills', 'Bill payments', '1099s', 'Vendor drawer'] },
    { dest: 'Finance / Expenses', key: 'finance:expenses', n: 5, go: { screen: 'finance', params: { financeTab: 'expenses' } }, abs: ['Checks', 'Pay down credit card', 'Expenses overview', 'Expense transactions', 'Mileage'] },
    { dest: 'Finance / Lending', key: 'finance:lending', n: 4, go: { screen: 'finance', params: { financeTab: 'lending' } }, abs: ['Apply for capital', 'Term loan', 'Line of credit', 'Credit cards'] },
    { dest: 'Team / Contractors', key: 'team:contractors', n: 2, go: { screen: 'employees', params: { teamTab: 'contractors' } }, abs: ['Contractors (Expenses + Team)'] }] },
  { area: 'Accounting controls', rows: [
    { dest: 'Finance / Bank Feed', key: 'finance:bankfeed', n: 8, go: { screen: 'finance', params: { financeTab: 'bankfeed' } }, abs: ['Bank deposit', 'Transfer', 'Bank transactions', 'Receipts', 'Rules', 'QBO payouts', 'QuickBooks Checking', 'Banking drawer'] },
    { dest: 'Finance / Reconciliation', key: 'finance:reconcile', n: 1, go: { screen: 'finance', params: { financeTab: 'reconcile' } }, abs: ['Reconcile'] },
    { dest: 'Finance / Chart of Accounts', key: 'finance:accounts', n: 1, go: { screen: 'finance', params: { financeTab: 'accounts' } }, abs: ['Chart of accounts'] },
    { dest: 'Finance / General Ledger', key: 'finance:ledger', n: 1, go: { screen: 'finance', params: { financeTab: 'ledger' } }, abs: ['Journal entry'] },
    { dest: 'Finance / Sales Tax', key: 'finance:sales-tax', n: 5, go: { screen: 'finance', params: { financeTab: 'sales-tax' } }, abs: ['Sales tax overview', 'Returns', 'Categories', 'Economic nexus', 'Sales tax settings'] },
    { dest: 'Finance / Settings', key: 'finance:settings', n: 6, go: { screen: 'finance', params: { financeTab: 'settings' } }, abs: ['My accountant', 'Intuit Experts', 'Account and settings', 'Report settings', 'All lists', 'Lists menu'] },
    { dest: 'Finance / Branding', key: 'finance:branding', n: 1, go: { screen: 'finance', params: { financeTab: 'branding' } }, abs: ['Custom form styles'] }] },
  { area: 'Reports & planning', rows: [
    { dest: 'Finance / Reports', key: 'finance:reports-center', n: 16, go: { screen: 'finance', params: { financeTab: 'reports-center' } }, abs: ['Reports overview', 'Standard/Custom/Management reports', 'Cash flow overview + planner', 'Budgeting', 'P&L', 'Balance Sheet', 'A/R Aging', 'Sales by Customer', 'Business tax overview', 'Tax checklist', 'Report filter panel', 'Custom report builder'] },
    { dest: 'Reports / Dashboards', key: 'reports:dashboards', n: 2, go: { screen: 'reports' }, abs: ['KPIs', 'Dashboards'] },
    { dest: 'Reports / Spreadsheet Sync', key: 'reports:spreadsheet-sync', n: 1, go: { screen: 'reports' }, abs: ['Spreadsheet sync'] }] },
  { area: 'Operations links', rows: [
    { dest: 'CRM / Overview + Pipeline + Customers', key: 'crm:*', n: 5, go: { screen: 'crm' }, abs: ['Customer Hub overview', 'Opportunities', 'Customers', 'Customer drawer'] },
    { dest: 'Quote-to-Cash / Proposals', key: 'qtc:proposals', n: 1, go: { screen: 'quote-cash' }, abs: ['Proposals'] },
    { dest: 'Contracts', key: 'contracts', n: 1, go: { screen: 'contracts' }, abs: ['Contracts'] },
    { dest: 'Calendar / Appointments', key: 'calendar:appointments', n: 1, go: { screen: 'calendar' }, abs: ['Appointments'] },
    { dest: 'Customer Reviews', key: 'reviews', n: 1, go: { screen: 'nps' }, abs: ['Reviews'] },
    { dest: 'Projects + Job Costing', key: 'projects / job-costing', n: 3, go: { screen: 'costing' }, abs: ['Projects', 'Project profitability', 'Job costing'] },
    { dest: 'Team / Overview + Employees + Time + Payroll', key: 'team:*', n: 11, go: { screen: 'employees' }, abs: ['Team overview', 'Employees', 'Time overview', 'Time entries', 'Single time activity', 'Weekly timesheet', 'Payroll (3 areas)', 'Payroll setup', 'Payroll tax'] },
    { dest: 'Inventory / Overview + Stock + SO + PO + Receipts + Shipping', key: 'inventory:*', n: 11, go: { screen: 'inventory' }, abs: ['Inventory overview', 'Inventory', 'Qty adjustment', 'Sales orders (3 areas)', 'Purchase orders (2 areas)', 'Item receipts', 'Shipping labels'] },
    { dest: 'Marketing', key: 'marketing', n: 2, go: { screen: 'marketing' }, abs: ['Marketing overview', 'Campaigns'] },
    { dest: 'Integrations hub', key: 'integrations:*', n: 9, go: { screen: 'integrations' }, abs: ['Integrations', 'Integration settings', 'Integration transactions', 'Sales channels', 'Store', 'Import data', 'Import desktop data', 'Export data', 'Import/export modal'] }] },
  { area: 'Administration', rows: [
    { dest: 'Portal Settings (Users, Billing, Privacy, Fields, Resolution, Desktop, Updates, Help, Account)', key: 'settings:*', n: 14, go: { screen: 'portal-settings' }, abs: ['Manage users', 'User management panel', 'Subscriptions and billing', 'Privacy', 'Custom fields', 'Resolution center', 'Desktop app', "What's new", 'Help', 'Help panel', 'Intuit account', 'Account switcher'] },
    { dest: 'Documents / Attachments', key: 'documents:attachments', n: 1, go: { screen: 'documents' }, abs: ['Attachments'] }] },
];

function FinanceQboMap() {
  const [q, setQ] = React.useState('');
  const total = QBO_MAP_DATA.reduce((s, g) => s + g.rows.reduce((x, r) => x + r.n, 0), 0);
  const openRow = (r) => shieldModal({
    kind: 'detail', title: r.dest, subtitle: `Route key: ${r.key} · ${r.n} QBO source item(s)`,
    sections: [{ label: 'Absorbed QuickBooks screens & panels', rows: r.abs.map((a) => ({ k: '•', v: a, full: true })) }],
    actions: [{ label: 'Open destination', primary: true, onClick: () => qboGo(r.go.screen, r.go.params), close: true }],
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="QBO ITEMS SCANNED" value={153} delay={0} />
        <StatCard label="CANONICAL ROWS" value={136} delay={60} />
        <StatCard label="DUPLICATES MERGED" value={17} delay={120} />
        <StatCard label="PORTAL DESTINATIONS" value={64} delay={180} />
        <StatCard label="COVERED IN THIS MAP" value={total} delay={240} />
      </div>
      <GlassPanel style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Every scanned QuickBooks screen routes to exactly one ShieldTech destination — no duplicate screens. Click a row to see absorbed sources and jump to it.</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter destinations…" style={{ marginLeft: 'auto', width: 200, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-hi, #fff)', fontSize: 11.5, fontFamily: 'var(--font-body)', outline: 'none' }} />
      </GlassPanel>
      {QBO_MAP_DATA.map((g) => {
        const rows = g.rows.filter((r) => !q || (r.dest + ' ' + r.key).toLowerCase().includes(q.toLowerCase()));
        if (!rows.length) return null;
        return (
          <GlassPanel key={g.area} style={{ padding: 0 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>{g.area}</div>
            {rows.map((r, i) => (
              <div key={i} onClick={() => openRow(r)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }} className="st-rowcard">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.dest}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>{r.key}</div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{r.n} source{r.n > 1 ? 's' : ''}</span>
                <LinkChip screen={r.go.screen} params={r.go.params} label="Open" />
              </div>
            ))}
          </GlassPanel>
        );
      })}
    </div>
  );
}

/* shimmer keyframes (inject once) */
(function () {
  if (!document.getElementById('qbo-shimmer-style')) {
    const s = document.createElement('style');
    s.id = 'qbo-shimmer-style';
    s.textContent = '@keyframes qbo-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
    document.head.appendChild(s);
  }
})();

Object.assign(window, { qboGo, LinkChip, QboSyncBadge, DemoStateBar, StateGate, FinanceQboMap, QBO_STATES });

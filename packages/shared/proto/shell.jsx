/* ShieldTech — App Shell (Nav Rail + Top Bar) */

/* The approved consolidation: five workspaces, ~20 screens. On desktop the
   merged tools live as tabs inside their workspace hub (screen-hubs.jsx);
   `mobileOnly` items keep their bespoke native tiles on mobile without
   re-cluttering the desktop rail. */
const NAV_GROUPS = [
{ id: 'home', label: 'HOME', collapsible: false, items: [
  { id: 'custom-dashboard', icon: 'dashboard', label: 'Dashboard', useSvg: true },
  { id: 'shieldtech-ai', icon: 'hermes', label: 'ShieldTech AI', useSvg: true },
  { id: 'messages', icon: 'chat', label: 'Messages', useSvg: true }]
},
{ id: 'sell', label: 'SELL', collapsible: true, items: [
  { id: 'crm', icon: 'pipeline', label: 'Bid Board', useSvg: true, children: [
    { sub: 'board', label: 'Board' },
    { sub: 'list', label: 'All bids' },
    { sub: 'leads', label: 'AI leads' },
    { sub: 'autobid', label: 'Auto-Bid' }] },
  { id: 'proposals', icon: 'proposals', label: 'Proposals', useSvg: true, children: [
    { sub: 'all', label: 'Proposals' },
    { sub: 'tools', label: 'Calculators' }] },
  { id: 'studio', icon: 'topology', label: 'Design Studio', useSvg: true },
  { id: 'survey-cloud', icon: 'floorplan', label: 'Survey Cloud', useSvg: true }]
},
{ id: 'deliver', label: 'DELIVER', collapsible: true, items: [
  { id: 'calendar', icon: 'calendar', label: 'Calendar', useSvg: true, children: [
    { sub: 'calendar', label: 'Calendar' },
    { sub: 'copilot', label: 'Scheduling Copilot' }] },
  { id: 'dispatch', icon: 'dispatch', label: 'Dispatch & Fleet', useSvg: true, children: [
    { sub: 'map', label: 'Live map' },
    { sub: 'schedule', label: 'Schedule board' },
    { sub: 'queue', label: 'Dispatch queue' },
    { sub: 'owner', label: 'Where are my techs' },
    { sub: 'driving', label: 'Driving safety' },
    { sub: 'fleet', label: 'Fleet' }] },
  { id: 'workorder', icon: 'clipboard', label: 'Work Orders', useSvg: true, children: [
    { sub: 'all', label: 'Work orders' },
    { sub: 'requested', label: 'Requests' },
    { sub: 'photos', label: 'Site photos' },
    { sub: 'punch', label: 'Punch lists' }] },
  { id: 'projects', icon: 'projects', label: 'Projects', useSvg: true, children: [
    { sub: 'board', label: 'Board' },
    { sub: 'list', label: 'List' }] },
  { id: 'plan-room', icon: 'floorplan', label: 'BlueShield Studio', useSvg: true }]
},
{ id: 'collect', label: 'MONEY', collapsible: true, items: [
  /* The QuickBooks-pattern Finance suite: its pages are children of ONE sidebar
     entry (no second rail inside the screen). `sub` is the finance page id. */
  { id: 'finance', icon: 'finance', label: 'Finance', useSvg: true, children: [
    { sub: 'overview', label: 'Home' },
    { sub: 'invoices', label: 'Invoices' },
    { sub: 'estimates', label: 'Estimates' },
    { sub: 'customers', label: 'Customers' },
    { sub: 'bank-transactions', label: 'Bank transactions' },
    { sub: 'expenses', label: 'Expenses' },
    { sub: 'receipts', label: 'Receipts' },
    { sub: 'ap', label: 'Bills' },
    { sub: 'vendors', label: 'Suppliers' },
    { sub: 'reconcile', label: 'Reconcile' },
    { sub: 'accounts', label: 'Chart of accounts' },
    { sub: 'products', label: 'Products & services' },
    { sub: 'payroll', label: 'Payroll' },
    { sub: 'sales-tax', label: 'Sales tax' },
    { sub: 'reports-center', label: 'Reports' },
    { sub: 'settings', label: 'Settings' }] },
  { id: 'revops', icon: 'forecast', label: 'Revenue Ops', useSvg: true },
  { id: 'mrr', icon: 'roi', label: 'Recurring Revenue', useSvg: true, children: [
    { sub: 'contracts', label: 'Contracts' },
    { sub: 'builder', label: 'RR Builder' }] },
  { id: 'purchase-orders', icon: 'cart', label: 'Inventory & Purchasing', useSvg: true, children: [
    { sub: 'pos', label: 'Purchase orders' },
    { sub: 'req', label: 'Parts requisitions' },
    { sub: 'inventory', label: 'Inventory' }] }]
},
{ id: 'os', label: 'SHIELDTECH OS', collapsible: true, items: [
  /* Every low-voltage discipline the company installs and monitors, as children
     of ONE entry. `sub` is the console app id. */
  { id: 'cameras', icon: 'topology', label: 'Sites & Systems', useSvg: true, children: [
    { sub: 'sites', label: 'All sites' },
    { sub: 'network', label: 'Network' },
    { sub: 'protect', label: 'Video (CCTV)' },
    { sub: 'access', label: 'Access control' },
    { sub: 'intrusion', label: 'Intrusion' },
    { sub: 'fire', label: 'Fire alarm' },
    { sub: 'intercom', label: 'Intercom & AV' },
    { sub: 'cabling', label: 'Cabling & racks' },
    { sub: 'alerts', label: 'Alerts' },
    { sub: 'assets', label: 'Assets' },
    { sub: 'settings', label: 'Controllers & settings' }] }]
},
{ id: 'care', label: 'CARE', collapsible: true, items: [
  { id: 'customers-list', icon: 'customers', label: 'Customers', useSvg: true, children: [
    { sub: 'all', label: 'Directory' },
    { sub: 'nps', label: 'NPS & feedback' }] },
  { id: 'helpdesk', icon: 'notification', label: 'Help Desk', useSvg: true, children: [
    { sub: 'tickets', label: 'Tickets' },
    { sub: 'incidents', label: 'Incidents' }] }]
},
{ id: 'admin', label: 'ADMIN', collapsible: true, items: [
  { id: 'employees', icon: 'employees', label: 'Team', useSvg: true, children: [
    { sub: 'team', label: 'Team & skills' },
    { sub: 'skills', label: 'Skills matrix' }] },
  { id: 'hr', icon: 'onboarding', label: 'HR Center', useSvg: true, children: [
    { sub: 'people', label: 'People' },
    { sub: 'paycenter', label: 'Payroll Center' },
    { sub: 'projects', label: 'Project labor' },
    { sub: 'hiring', label: 'Hiring & actions' },
    { sub: 'insights', label: 'Insights' },
    { sub: 'audit', label: 'Audit' },
    { sub: 'setup', label: 'Setup' }] },
  { id: 'approvals', icon: 'check', label: 'Approvals', useSvg: true, children: [
    { sub: 'appr', label: 'Approvals' },
    { sub: 'time', label: 'Timesheets' },
    { sub: 'pay', label: 'Payroll' },
    { sub: 'exp', label: 'Expenses & receipts' }] },
  { id: 'documents', icon: 'note', label: 'Documents', useSvg: true },
  { id: 'users', icon: 'credential', label: 'Users & Invites', useSvg: true },
  { id: 'portal-settings', icon: 'settings', label: 'Settings', useSvg: true, children: [
    { sub: 'users', label: 'Users & roles' },
    { sub: 'account', label: 'Account' },
    { sub: 'billing', label: 'Billing' },
    { sub: 'privacy', label: 'Privacy' },
    { sub: 'fields', label: 'Custom fields' },
    { sub: 'resolution', label: 'Resolution center' },
    { sub: 'desktop', label: 'Desktop app' },
    { sub: 'updates', label: "What's new" },
    { sub: 'help', label: 'Help' }] }]
}];
/* Screen ids that used to be separate menu entries. They still resolve (deep
   links, the phone directory, saved screens) — the menu just no longer lists
   them, because each one is a tab inside the entry that owns it now. */
const NAV_LEGACY_IDS = {
  autobid: ['crm', 'autobid'], 'secret-weapon': ['crm', 'board'], copilot: ['calendar', 'copilot'], photos: ['workorder', 'photos'], punchlist: ['workorder', 'punch'],
  invoices: ['finance', 'invoices'], estimates: ['finance', 'estimates'], outbox: ['finance', 'invoices'], 'parts-req': ['purchase-orders', 'req'], 'rr-builder': ['mrr', 'builder'], expenses: ['approvals', 'exp'],
  assets: ['cameras', 'assets'], incidents: ['helpdesk', 'incidents'], nps: ['customers-list', 'nps'], skills: ['employees', 'skills'], timesheets: ['approvals', 'time'], payroll: ['approvals', 'pay'],
};

/* ── The menu: seven workspaces, nothing nested in the rail ──
   One flat list. Each workspace is a screen with a quiet tab strip for its
   second level (screen-workspaces.jsx); a screen's own pages (Finance's
   ledger, the OS disciplines, HR, Settings) stay inside that screen. NAV_GROUPS
   above is kept as the search index behind "Jump to…" and the phone directory. */
const NAV_WORKSPACES = [
  { id: 'home', label: 'Home', icon: 'dashboard', screen: 'custom-dashboard', screens: ['custom-dashboard', 'dashboard', 'shieldtech-ai'], tabs: [] },
  { id: 'sell', label: 'Sell', icon: 'pipeline', screen: 'crm', component: 'SellWorkspace', tabs: [
    { screen: 'crm', label: 'Bid Board', component: 'SellBoardScreen', m: 'crm' },
    { screen: 'proposals', label: 'Proposals', component: 'SellProposalsScreen', m: 'proposals' },
    { screen: 'studio', label: 'Design Studio', component: 'StudioScreen', m: 'studio' },
    { screen: 'survey-cloud', label: 'Survey Cloud', component: 'SurveyCloudScreen', m: 'sitescan', mLabel: 'Survey Scan' }] },
  { id: 'work', label: 'Work', icon: 'dispatch', screen: 'calendar', component: 'WorkWorkspace', tabs: [
    { screen: 'calendar', label: 'Calendar', component: 'DeliverCalendarScreen', m: 'calendar', mLabel: 'Schedule' },
    { screen: 'dispatch', label: 'Dispatch & Fleet', component: 'DeliverDispatchScreen', m: 'dispatch', mLabel: 'Field' },
    { screen: 'workorder', label: 'Work Orders', component: 'DeliverWorkOrdersScreen', m: 'workorder' },
    { screen: 'projects', label: 'Projects', component: 'DeliverProjectsScreen', m: 'projects' },
    { screen: 'plan-room', label: 'BlueShield', component: 'MoneyBlueShieldScreen', m: 'punchlist', mLabel: 'Punch lists' }] },
  { id: 'money', label: 'Money', icon: 'finance', screen: 'finance', component: 'MoneyWorkspace', tabs: [
    { screen: 'finance', label: 'Finance', component: 'FinanceScreen', m: 'finance' },
    { screen: 'revops', label: 'Revenue', component: 'MoneyRevOpsScreen', m: 'revops' },
    { screen: 'mrr', label: 'Recurring', component: 'MoneyRecurringScreen', m: 'mrr' },
    { screen: 'purchase-orders', label: 'Purchasing', component: 'MoneyPurchasingScreen', m: 'purchase-orders' }] },
  { id: 'customers', label: 'Customers', icon: 'customers', screen: 'customers-list', component: 'CustomersWorkspace', tabs: [
    { screen: 'customers-list', label: 'Directory', component: 'CareCustomersScreen', m: 'customers-list' },
    { screen: 'helpdesk', label: 'Help Desk', component: 'CareHelpdeskScreen', m: 'helpdesk' },
    { screen: 'messages', label: 'Messages', component: 'CareMessagesScreen', m: 'messages' }] },
  { id: 'systems', label: 'Systems', icon: 'topology', screen: 'cameras', screens: ['cameras', 'assets', 'topology', 'warroom', 'floorplan', 'anomaly'], tabs: [] },
  { id: 'team', label: 'Team', icon: 'employees', screen: 'employees', component: 'TeamWorkspace', tabs: [
    { screen: 'employees', label: 'Team', component: 'AdminTeamScreen', m: 'employees' },
    { screen: 'hr', label: 'HR', component: 'AdminHRScreen', m: 'hr' },
    { screen: 'approvals', label: 'Approvals', component: 'AdminApprovalsScreen', m: 'approvals' },
    { screen: 'documents', label: 'Documents', component: 'AdminDocumentsScreen', m: 'documents' },
    { screen: 'users', label: 'Users', component: 'AdminUsersScreen', m: 'users' }] },
];
const NAV_SETTINGS = { id: 'settings', label: 'Settings', icon: 'settings', screen: 'portal-settings' };
/* screen id (current or legacy) → workspace id */
const WORKSPACE_OF = (() => {
  const m = {};
  NAV_WORKSPACES.forEach(w => { m[w.screen] = w.id; (w.screens || []).forEach(s => { m[s] = w.id; }); w.tabs.forEach(t => { m[t.screen] = w.id; if (t.m) m[t.m] = w.id; }); });
  Object.assign(m, { pay: 'money', invoices: 'money', estimates: 'money', outbox: 'money', inventory: 'money', customer: 'customers', timeline: 'customers', 'portal-settings': 'settings' });
  return m;
})();
/* The workspace tab that owns a screen id (legacy ids resolve to their owner). */
function wsTabFor(ws, id) {
  const legacy = NAV_LEGACY_IDS[id] ? NAV_LEGACY_IDS[id][0] : id;
  const extra = { pay: 'finance', invoices: 'finance', estimates: 'finance', outbox: 'finance', inventory: 'purchase-orders' }[id];
  const sid = extra || legacy;
  return ws.tabs.find(t => t.screen === sid || t.m === id) || ws.tabs[0] || null;
}

/* ── Sub-navigation bus ──
   A screen with children (Finance, ShieldTech OS) tells the sidebar which page
   it is on, and the sidebar tells the screen which page to open — one source
   of truth, no second menu inside the screen. */
function navSubSet(screen, sub, source) {
  window.__navSub = { screen, sub };
  try { window.dispatchEvent(new CustomEvent('st2:subnav', { detail: { screen, sub, source: source || 'nav' } })); } catch { /* noop */ }
}
function useNavSub() {
  const [v, setV] = React.useState(() => window.__navSub || null);
  React.useEffect(() => { const h = (e) => setV({ screen: e.detail.screen, sub: e.detail.sub }); window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, []);
  return v;
}

/* Flat list for backward compat (tab editor candidates, labels, command palette).
   The phone's workspace screens (ws-sell, ws-work, …) lead so they are the
   first things offered as bottom tabs. */
const NAV_ITEMS = [
  ...NAV_WORKSPACES.filter(w => w.component).map(w => ({ id: 'ws-' + w.id, icon: w.icon, label: w.label, section: 'workspace', useSvg: true })),
  ...NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, section: g.id }))),
];
NAV_ITEMS.unshift({ id: 'login', icon: 'credential', label: 'Login', section: 'auth', useSvg: true, hidden: true });
const PAY_LEGACY = { pay: ['finance', 'invoices'], inventory: ['purchase-orders', 'inventory'] };
Object.assign(NAV_LEGACY_IDS, PAY_LEGACY);

/* ── Shield Logo ── */
function ShieldLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 4L8 12v12c0 11 16 20 16 20s16-9 16-20V12L24 4z" fill="rgba(var(--brand-rgb),0.1)" stroke="var(--brand)" strokeWidth="1.5" />
      <path d="M24 14l-8 4v6c0 5.5 8 10 8 10s8-4.5 8-10v-6l-8-4z" fill="rgba(var(--brand-rgb),0.15)" stroke="var(--brand)" strokeWidth="1" />
      <circle cx="24" cy="24" r="3" fill="var(--brand)" opacity="0.8" />
      <line x1="24" y1="21" x2="24" y2="16" stroke="var(--brand)" strokeWidth="0.8" opacity="0.5" />
      <line x1="24" y1="27" x2="24" y2="32" stroke="var(--brand)" strokeWidth="0.8" opacity="0.5" />
      <line x1="21" y1="24" x2="18" y2="24" stroke="var(--brand)" strokeWidth="0.8" opacity="0.5" />
      <line x1="27" y1="24" x2="30" y2="24" stroke="var(--brand)" strokeWidth="0.8" opacity="0.5" />
    </svg>);

}

/* ── Nav Rail — seven workspaces, one flat list ──
   The active workspace unfolds its tabs underneath it (quiet, indented), so
   the rail never shows more than ~12 rows. "Jump to…" searches every page the
   platform has, including the third level that lives inside the screens. */
function NavRail({ current: rawCurrent, onNav, collapsed = false, onToggleCollapse }) {
  const navSub = useNavSub();
  const current = NAV_LEGACY_IDS[rawCurrent] ? NAV_LEGACY_IDS[rawCurrent][0] : rawCurrent;
  const wsId = WORKSPACE_OF[rawCurrent] || WORKSPACE_OF[current] || null;
  const [q, setQ] = React.useState('');
  const qn = q.trim().toLowerCase();

  /* Search index: workspace tabs + every page of every screen. */
  const index = React.useMemo(() => {
    const out = [];
    NAV_WORKSPACES.forEach(w => {
      out.push({ key: 'ws:' + w.id, label: w.label, where: 'Workspace', go: () => onNav(w.screen) });
      w.tabs.forEach(t => out.push({ key: 'tab:' + t.screen, label: t.label, where: w.label, go: () => onNav(t.screen) }));
    });
    NAV_GROUPS.forEach(g => g.items.forEach(i => (i.children || []).forEach(k => {
      const w = NAV_WORKSPACES.find(x => x.id === WORKSPACE_OF[i.id]);
      out.push({ key: 'sub:' + i.id + ':' + k.sub, label: k.label, where: (w ? w.label + ' · ' : '') + i.label, go: () => onNav(i.id, k.sub) });
    })));
    out.push({ key: 'settings', label: 'Settings', where: 'Account', go: () => onNav(NAV_SETTINGS.screen) });
    return out;
  }, []);
  const hits = qn ? index.filter(e => e.label.toLowerCase().includes(qn) || e.where.toLowerCase().includes(qn)).slice(0, 24) : [];

  const rowBase = { display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 16px)', margin: '1px 8px', padding: collapsed ? '10px 0' : '9px 12px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', cursor: 'pointer', borderRadius: 9, fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'background 0.12s, color 0.12s', position: 'relative', background: 'transparent' };
  const Row = ({ active, icon, label, onClick, title, sub }) => (
    <button title={title || label} onClick={onClick}
      style={{ ...rowBase, ...(sub ? { padding: '6px 12px 6px 40px', margin: '0 8px', width: 'calc(100% - 16px)' } : {}), background: active ? 'rgba(var(--brand-rgb),0.12)' : 'transparent', color: active ? 'var(--brand)' : (sub ? 'var(--text-mid)' : 'var(--text-high)'), fontSize: sub ? 12.5 : 13.5, fontWeight: active ? 600 : (sub ? 400 : 500) }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(var(--brand-rgb),0.05)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      {icon && <Icon name={icon} size={16} color={active ? 'var(--brand)' : 'var(--text-mid)'} style={{ flexShrink: 0, width: 18 }} />}
      {sub && <span style={{ position: 'absolute', left: 26, top: '50%', width: 5, height: 5, borderRadius: '50%', transform: 'translateY(-50%)', background: active ? 'var(--brand)' : 'var(--border-strong)' }} />}
      {!collapsed && <span style={{ whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </button>
  );

  return (
    <nav style={{ width: collapsed ? 60 : 224, height: '100vh', flexShrink: 0, background: 'var(--card)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden', zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 12px 12px', minHeight: 40 }}>
        {collapsed
          ? <img src="uploads/ShieldTech Emblem Transparent MK1 .png" alt="ShieldTech" style={{ height: 26, objectFit: 'contain' }} />
          : <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 30, objectFit: 'contain' }} />}
      </div>
      {!collapsed && (
        <div style={{ padding: '0 12px 8px' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to…" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)', color: 'var(--text-high)', fontSize: 12.5, fontFamily: 'var(--font-body)', outline: 'none' }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '2px 0 8px' }}>
        {qn ? (
          hits.length ? hits.map(h => (
            <button key={h.key} onClick={() => { setQ(''); h.go(); }} style={{ ...rowBase, flexDirection: 'column', alignItems: 'flex-start', gap: 1, padding: '7px 12px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--brand-rgb),0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 13, color: 'var(--text-high)', fontWeight: 500 }}>{h.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{h.where}</span>
            </button>
          )) : <div style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-low)' }}>Nothing matches “{q}”.</div>
        ) : NAV_WORKSPACES.map(w => {
          const active = wsId === w.id;
          const open = active && !collapsed && w.tabs.length > 0;
          const activeTab = open ? wsTabFor(w, rawCurrent) : null;
          return (
            <React.Fragment key={w.id}>
              <Row active={active} icon={w.icon} label={w.label} onClick={() => onNav(active && w.tabs.length ? (activeTab || w.tabs[0]).screen : w.screen)} />
              {open && w.tabs.map(t => <Row key={t.screen} sub active={activeTab === t} label={t.label} onClick={() => onNav(t.screen)} />)}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ padding: '8px 0 6px', borderTop: '1px solid var(--border-subtle)' }}>
        <Row active={wsId === 'settings'} icon={NAV_SETTINGS.icon} label={NAV_SETTINGS.label} onClick={() => onNav(NAV_SETTINGS.screen)} />
      </div>
      <div style={{ padding: '4px 10px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {!collapsed && <>
          <a href={(window.__shieldAppUrls && window.__shieldAppUrls.tech) || '#'} title="Tech app" style={{ flex: 1, fontSize: 11.5, color: 'var(--text-mid)', textDecoration: 'none', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="phone" size={12} color="var(--text-low)" /> Tech</a>
          <a href={(window.__shieldAppUrls && window.__shieldAppUrls.customer) || '#'} title="Customer portal" style={{ flex: 1, fontSize: 11.5, color: 'var(--text-mid)', textDecoration: 'none', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="customers" size={12} color="var(--text-low)" /> Customer</a>
        </>}
        <button onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(var(--brand-rgb),0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-low)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0 }}>
          <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={12} color="currentColor" style={{ transform: collapsed ? 'none' : 'rotate(90deg)' }} />
        </button>
      </div>
    </nav>);
}

/* ── Top Bar ── */
function TopBar({ title, onAI, onNotifications, onNav }) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  // Re-render when auth resolves so the avatar/name fill in instead of showing
  // the "·" placeholder forever (window.__shieldUser is set after first paint).
  const [, authTick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const on = () => authTick();
    window.addEventListener('shield:auth', on);
    return () => window.removeEventListener('shield:auth', on);
  }, []);
  // Live unread badge: pull the count from chat on mount, on new realtime
  // messages, and whenever auth resolves (unreadTotal needs a signed-in user).
  React.useEffect(() => {
    let alive = true;
    const refresh = () => {
      const chat = window.__shieldChat;
      if (!chat || !chat.unreadTotal) return;
      Promise.resolve(chat.unreadTotal()).then(n => {
        if (!alive) return;
        const next = Number(n) || 0;
        if (next !== (window.__shieldUnreadCount || 0)) { window.__shieldUnreadCount = next; authTick(); }
      }).catch(() => {});
    };
    refresh();
    window.addEventListener('shield:auth', refresh);
    const unsub = (window.__shieldChat && window.__shieldChat.subscribe) ? window.__shieldChat.subscribe(refresh) : null;
    return () => { alive = false; window.removeEventListener('shield:auth', refresh); if (unsub) unsub(); };
  }, []);
  // Appearance + presence are per-user config, remembered across reloads and
  // synced to whatever device this user signs in on (userPrefsStore).
  const [prefs, setPrefs] = useShieldStore(userPrefsStore);
  const theme = (prefs && prefs.theme) || 'dark';
  const userStatus = (prefs && prefs.status) || 'online';
  const setTheme = (t) => setPrefs(p => ({ ...(p || {}), theme: t }));
  const setUserStatus = (s) => setPrefs(p => ({ ...(p || {}), status: s }));

  // Edit display name / phone — persists to the profiles row.
  const openProfileModal = () => {
    const u = window.__shieldUser || {};
    window.shieldModal && window.shieldModal({
      kind: 'form', title: 'My Profile', subtitle: 'Your name and contact info',
      submitLabel: 'Save', successMsg: 'Profile updated',
      fields: [
        { key: 'name', label: 'Full name', value: u.name || '', required: true, full: true },
        { key: 'phone', label: 'Phone', value: u.phone || '', placeholder: '(555) 555-0100' },
      ],
      onSubmit: async (v) => {
        const sb = window.__shieldSupabase;
        if (sb && u.id) { try { await sb.from('profiles').update({ name: (v.name || '').trim(), phone: v.phone || null }).eq('id', u.id); } catch {} }
        if (window.__shieldUser) window.__shieldUser.name = (v.name || '').trim();
        try { window.dispatchEvent(new CustomEvent('shield:auth', { detail: { authed: true } })); } catch {}
      },
    });
  };

  // Notification channel toggles — stored per-user (userPrefsStore.notify).
  const openNotifPrefs = () => {
    const n = (userPrefsStore.get() || {}).notify || { email: true, push: true, desktop: false };
    const yn = (b) => b ? 'On' : 'Off';
    window.shieldModal && window.shieldModal({
      kind: 'form', title: 'Notification Preferences', subtitle: 'Where ShieldTech reaches you',
      submitLabel: 'Save', successMsg: 'Notification preferences saved',
      fields: [
        { key: 'email', label: 'Email', type: 'select', options: ['On', 'Off'], value: yn(n.email) },
        { key: 'push', label: 'Push', type: 'select', options: ['On', 'Off'], value: yn(n.push) },
        { key: 'desktop', label: 'Desktop', type: 'select', options: ['On', 'Off'], value: yn(n.desktop) },
      ],
      onSubmit: (v) => setPrefs(p => ({ ...(p || {}), notify: { email: v.email === 'On', push: v.push === 'On', desktop: v.desktop === 'On' } })),
    });
  };

  return (
    <header style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(var(--card-rgb),0.8)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      position: 'relative', zIndex: 100
    }}>
      {/* Left: breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="display" style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-high)', letterSpacing: '-0.01em' }}>{title}</span>
      </div>

      {/* Center: search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(var(--brand-rgb),0.04)', border: '1px solid var(--border-subtle)',
        borderRadius: 8, padding: '6px 14px', width: 320, cursor: 'text'
      }}>
        <span style={{ color: 'var(--text-low)', fontSize: 13 }}>⌕</span>
        <span style={{ color: 'var(--text-low)', fontSize: 13, flex: 1 }}>Search everything…</span>
        <span className="mono" style={{
          fontSize: 10, color: 'var(--text-low)', border: '1px solid var(--border-subtle)',
          padding: '1px 5px', borderRadius: 4
        }}>⌘K</span>
      </div>

      {/* Right: status + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* ShieldTech AI button */}
        <button onClick={() => onNav && onNav('shieldtech-ai')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(var(--brand-rgb),0.08)', border: '1px solid var(--border-strong)',
          borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          color: 'var(--brand)', fontSize: 12, fontWeight: 500,
          fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          boxShadow: '0 0 12px -4px rgba(var(--brand-rgb),0.2)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--glow-brand-sm)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 12px -4px rgba(var(--brand-rgb),0.2)'}>

          <Icon name="hermes" size={14} color="#fff" /> Ask ShieldTech AI
        </button>

        {/* Notifications (badge appears when unread notifications exist) */}
        <div onClick={onNotifications} style={{ position: 'relative', cursor: 'pointer' }}>
          <Icon name="notification" size={18} color="var(--text-mid)" />
          {(window.__shieldUnreadCount || 0) > 0 && <span style={{
            position: 'absolute', top: -4, right: -6,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--status-critical)', color: '#fff',
            fontSize: 9, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>{window.__shieldUnreadCount}</span>}
        </div>

        {/* Avatar + Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setProfileOpen(!profileOpen)} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
            boxShadow: profileOpen ? '0 0 0 2px var(--brand)' : 'none',
            transition: 'box-shadow 0.15s'
          }}>{(window.__shieldUser && window.__shieldUser.initials) || '·'}</div>

          {profileOpen && (
            <>
              <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 260, background: 'var(--modal)', border: '1px solid var(--border-strong)',
                borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                zIndex: 9999, animation: 'fade-up 0.12s ease both', overflow: 'hidden'
              }}>
                {/* Profile header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(window.__shieldUser && window.__shieldUser.initials) || '·'}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{(window.__shieldUser && window.__shieldUser.name) || 'Not signed in'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{(window.__shieldUser && window.__shieldUser.role) || ''}</div>
                    <div style={{ fontSize: 10, color: 'var(--brand)' }}>{(window.__shieldUser && window.__shieldUser.email) || ''}</div>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '4px 0' }}>
                  {[
                    { icon: 'customers', label: 'My Profile', desc: 'Name, photo, contact info', act: () => openProfileModal() },
                    { icon: 'settings', label: 'Account Settings', desc: 'Company, billing, plan', act: () => onNav && onNav('portal-settings') },
                    { icon: 'notification', label: 'Notification Preferences', desc: 'Channels, quiet hours', act: () => openNotifPrefs() },
                  ].map((item, i) => (
                    <button key={i} onClick={() => { setProfileOpen(false); item.act && item.act(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 16px',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--brand-rgb),0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <Icon name={item.icon} size={14} color="var(--text-mid)" />
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{item.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

                <div style={{ padding: '4px 0' }}>
                  <button onClick={async () => {
                    setProfileOpen(false);
                    if (!window.__shieldPasskey || !window.__shieldPasskey.supported()) { window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg: 'This device/browser does not support passkeys', type: 'warn' } })); return; }
                    const r = await window.__shieldPasskey.createPasskey('Passkey');
                    window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg: r.ok ? 'Passkey added — you can now sign in with Face ID / Touch ID' : (r.error || 'Could not add passkey'), type: r.ok ? 'ok' : 'error' } }));
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 16px',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--brand-rgb),0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Icon name="lock" size={14} color="var(--text-mid)" />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-high)' }}>Add a passkey</div>
                      <div style={{ fontSize: 9, color: 'var(--text-low)' }}>Sign in with Face ID / Touch ID next time</div>
                    </div>
                  </button>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

                <div style={{ padding: '4px 0' }}>
                  {[
                    { icon: 'hermes', label: 'ShieldTech AI Settings', desc: 'Tone, auto-actions, context', act: () => (window.__shieldOpenAI ? window.__shieldOpenAI() : (onNav && onNav('shieldtech-ai'))) },
                    { icon: 'poe', label: 'Integrations', desc: 'Stripe, QuickBooks, Samsara', act: () => onNav && onNav('portal-settings') },
                  ].map((item, i) => (
                    <button key={i} onClick={() => { setProfileOpen(false); item.act && item.act(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 16px',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--brand-rgb),0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <Icon name={item.icon} size={14} color="var(--text-mid)" />
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{item.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

                {/* Appearance */}
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>APPEARANCE</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[{id:'dark',l:'Dark'},{id:'light',l:'Light'},{id:'system',l:'System'}].map(t => (
                      <button key={t.id} onClick={() => { setTheme(t.id); shieldToast('Appearance: ' + t.l); }} style={{
                        flex: 1, padding: '4px', borderRadius: 4, fontSize: 10,
                        background: t.id === theme ? 'rgba(var(--brand-rgb),0.12)' : 'transparent',
                        border: `1px solid ${t.id === theme ? 'var(--brand)' : 'var(--border-subtle)'}`,
                        color: t.id === theme ? 'var(--brand)' : 'var(--text-low)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)'
                      }}>{t.l}</button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

                {/* Status */}
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>STATUS</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[{id:'online',l:'Online',c:'var(--status-ok)'},{id:'busy',l:'Busy',c:'var(--status-warn)'},{id:'away',l:'Away',c:'var(--text-low)'}].map(s => (
                      <button key={s.id} onClick={() => { setUserStatus(s.id); shieldToast('Status set to ' + s.l); }} style={{
                        flex: 1, padding: '4px', borderRadius: 4, fontSize: 10,
                        background: s.id === userStatus ? `${s.c}15` : 'transparent',
                        border: `1px solid ${s.id === userStatus ? s.c : 'var(--border-subtle)'}`,
                        color: s.id === userStatus ? s.c : 'var(--text-low)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.c }} />
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

                {/* Sign out */}
                <div style={{ padding: '4px 0' }}>
                  <button onClick={async () => {
                    setProfileOpen(false);
                    // Really end the session, then fall back to the login screen.
                    try { if (window.__shieldAuth && window.__shieldAuth.signOut) await window.__shieldAuth.signOut(); } catch {}
                    if (onNav) onNav('login');
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 16px',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--critical-rgb),0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Icon name="export" size={14} color="var(--status-critical)" />
                    <span style={{ fontSize: 12, color: 'var(--status-critical)' }}>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>);

}

/* ── App Shell ── */
function AppShell({ screen, onNav, children, onAI, isCustomer, onBack }) {
  const titles = {
    'purchase-orders': 'Inventory & Purchasing', 'parts-req': 'Inventory & Purchasing', mrr: 'Recurring Revenue', 'rr-builder': 'Recurring Revenue', revops: 'Revenue Ops',
    messages: 'Messages', users: 'Users & Invites', documents: 'Documents', 'portal-settings': 'Portal Settings', employees: 'Team & Skills', helpdesk: 'Help Desk', incidents: 'Help Desk', nps: 'Customers', skills: 'Team & Skills',
    dashboard: 'Mission Control', customer: 'Customer Portal',
    assets: 'Asset Management', 'shieldtech-ai': 'ShieldTech AI',
    crm: 'Bid Board', studio: 'Design Studio',
    'product-library': 'Product Library', 'service-plans': 'Service Plans',
    'custom-dashboard': 'My Dashboard',
    'customers-list': 'Customers',
    dispatch: 'Dispatch & Fleet', finance: 'Finance Suite', revops: 'Revenue Ops',
    timeline: 'Customer Timeline',
    approvals: 'Approvals & Expenses',
    cameras: 'ShieldTech OS', topology: 'ShieldTech OS', finance: 'Finance',
    certs: 'Certifications', tools: 'Engineering Tools',
    costing: 'Job Costing', audit: 'Audit Trail',
    warroom: 'ShieldTech OS', floorplan: 'ShieldTech OS', anomaly: 'ShieldTech OS',
    expenses: 'Expense Approval', timesheets: 'Timesheet Approval', payroll: 'Payroll',
    hr: 'HR Center',
    projects: 'Projects', 'plan-room': 'BlueShield Studio', inventory: 'Inventory',
    reports: 'Reports & BI', proposals: 'Proposals',
    employees: 'Team & Skills', contracts: 'Contracts', sla: 'SLA Dashboard',
    integrations: 'Integrations', marketing: 'Marketing',
    documents: 'Documents', 'portal-settings': 'Portal Settings',
    health: 'Customer Health', forecast: 'Revenue Forecast',
    commissions: 'Commissions', compliance: 'Compliance Calendar',
    onboarding: 'Customer Onboarding', 'service-reports': 'Service Reports',
    pricebook: 'Vendor Price Book', roi: 'ROI Calculator',
    chat: 'Team Chat', statuspage: 'Status Pages',
    calendar: 'Calendar',
    photos: 'Site Photos',
    punchlist: 'Punch Lists',
    digest: 'Daily Digest',
    'survey-ai': 'AI Survey Estimator',
    'survey-cloud': 'Survey Cloud',
    copilot: 'Scheduling Copilot',
    intel: 'Security Intelligence',
    'margin-xray': 'Margin X-Ray',
    'rr-builder': 'Recurring Revenue',
    rfp: 'RFP Workspace',
    wallboard: 'NOC Wallboard',
    nps: 'NPS & Feedback',
    incidents: 'Incident Response',
    warranty: 'Warranty Tracker',
    'quote-cash': 'Quote to Cash',
    mrr: 'Recurring Revenue',
    helpdesk: 'Help Desk',
    workorder: 'Work Orders',
    'parts-req': 'Inventory & Purchasing',
    subcontractors: 'Sub-Contractors',
    'purchase-orders': 'Inventory & Purchasing',
    skills: 'Skills Matrix',
    knowledge: 'Knowledge Base'
  };

  if (isCustomer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
        {/* Simplified customer top bar */}
        <header style={{
          height: 56, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(var(--card-rgb),0.9)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack &&
            <button onClick={onBack} style={{
              background: 'rgba(var(--brand-rgb),0.06)', border: '1px solid var(--border-subtle)',
              borderRadius: 6, padding: '4px 10px', color: 'var(--brand)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 4
            }}>← Back</button>
            }
            <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 24, objectFit: 'contain' }} />
            <span style={{ color: 'var(--text-low)', margin: '0 4px' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>Customer Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => shieldToast('Connecting you with ShieldTech support…')} style={{
              background: 'rgba(var(--brand-rgb),0.08)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '5px 14px', color: 'var(--brand)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>Support</button>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F4CC7, var(--brand))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: '#fff'
            }}>AD</div>
          </div>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>{children}</div>
      </div>);

  }

  const [notifOpen, setNotifOpen] = React.useState(false);
  const [navCustomizeOpen, setNavCustomizeOpen] = React.useState(false);
  const [navCollapsed, setNavCollapsed] = React.useState(false);
  const shellToast = (m) => {}; // notifications handle their own toasts

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--canvas)' }}>
      <div onContextMenu={(e) => {e.preventDefault();setNavCustomizeOpen(true);}}>
        <NavRail current={screen} onNav={onNav} collapsed={navCollapsed} onToggleCollapse={() => setNavCollapsed(prev => !prev)} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={(NAV_WORKSPACES.find(w => w.id === WORKSPACE_OF[screen]) || {}).label || titles[screen] || 'ShieldTech'} onAI={onAI} onNotifications={() => setNotifOpen(!notifOpen)} onNav={onNav} />
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
      {notifOpen && typeof NotificationCenter !== 'undefined' && <NotificationCenter onClose={() => setNotifOpen(false)} showToast={shellToast} />}
      {navCustomizeOpen && typeof NavCustomizeDrawer !== 'undefined' && (
        <div style={{ position: 'fixed', top: 0, bottom: 0, left: 210, zIndex: 8000, display: 'flex' }}>
          <div style={{ width: 300, height: '100%', background: 'var(--card)', borderRight: '1px solid var(--border-subtle)', boxShadow: '8px 0 24px rgba(0,0,0,0.3)', overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
            <NavCustomizeDrawer onClose={() => setNavCustomizeOpen(false)} showToast={(m) => {setNavCustomizeOpen(false);}} inline />
          </div>
          <div onClick={() => setNavCustomizeOpen(false)} style={{ flex: 1 }} />
        </div>
      )}
    </div>);

}

Object.assign(window, { ShieldLogo, NavRail, TopBar, AppShell, NAV_ITEMS, NAV_GROUPS, NAV_WORKSPACES, NAV_SETTINGS, WORKSPACE_OF, wsTabFor, NAV_LEGACY_IDS, navSubSet, useNavSub });

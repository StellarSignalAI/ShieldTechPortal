/* ShieldTech Portal — desktop surface (ported inline App shell). */
import '@shared/proto-manifest.js';
import '@shared/store-sync.js';

const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect } = React;

/* Gate fade-up entrance animations on a real paint (see base/global.css). */
requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    document.documentElement.classList.add('anim-ready');
  });
});

const TWEAK_DEFAULTS = {
  screen: 'login',
  glowIntensity: 'normal',
  density: 'comfortable',
  financeRole: 'Owner / Admin',
  financeState: 'live',
};

/* Master screen list for Tweaks selector */
const SCREEN_LIST = [
  'login', 'custom-dashboard', 'dashboard', 'customer', 'customers-list',
  'assets', 'shieldtech-ai', 'crm', 'studio', 'dispatch', 'finance',
  'approvals', 'cameras', 'topology', 'certs', 'tools', 'costing',
  'audit', 'warroom', 'floorplan', 'anomaly', 'expenses', 'timesheets',
  'projects', 'inventory', 'reports', 'proposals', 'employees',
  'contracts', 'sla', 'health', 'forecast', 'commissions', 'compliance',
  'onboarding', 'service-reports', 'pricebook', 'roi', 'chat', 'statuspage',
  'calendar', 'nps', 'incidents', 'warranty', 'quote-cash', 'mrr',
  'photos', 'punchlist', 'digest', 'survey-ai', 'survey-cloud', 'copilot', 'intel',
  'margin-xray', 'rr-builder', 'rfp', 'wallboard',
  'helpdesk', 'workorder', 'parts-req', 'subcontractors', 'purchase-orders',
  'skills', 'knowledge', 'integrations', 'marketing', 'documents', 'portal-settings', 'users',
, 'fleet', 'invoices', 'estimates', 'outbox', 'pay', 'secret-weapon'];

/* screen id → window component name (same mapping as the prototype shell) */
const SCREEN_COMPONENTS = {
  dashboard: 'DashboardScreen',
  assets: 'AssetsScreen',
  'shieldtech-ai': 'ShieldAIScreen',
  crm: 'BidBoardScreen',
  studio: 'StudioScreen',
  'product-library': 'ProductLibraryScreen',
  'service-plans': 'ServicePlansScreen',
  dispatch: 'DispatchScreen',
  finance: 'FinanceScreen',
  approvals: 'ApprovalsScreen',
  'customers-list': 'CustomersScreen',
  cameras: 'MonitoringConsole',
  topology: 'MonitoringConsole',
  certs: 'CertificationsView',
  tools: 'PoECalculatorView',
  costing: 'JobCostingView',
  audit: 'AuditTrailView',
  warroom: 'MonitoringConsole',
  floorplan: 'MonitoringConsole',
  anomaly: 'MonitoringConsole',
  expenses: 'ExpenseApprovalScreen',
  timesheets: 'TimesheetApprovalScreen',
  projects: 'ProjectsScreen',
  inventory: 'InventoryScreenPlus',
  reports: 'ReportsScreen',
  proposals: 'ProposalScreen',
  employees: 'TeamScreenPlus',
  contracts: 'ContractsScreen',
  sla: 'SLAScreen',
  health: 'CustomerHealthScreen',
  forecast: 'RevenueForecastScreen',
  commissions: 'CommissionScreen',
  compliance: 'ComplianceScreen',
  onboarding: 'OnboardingScreen',
  'service-reports': 'ServiceReportScreen',
  pricebook: 'VendorPriceBookScreen',
  roi: 'ROICalculatorScreen',
  chat: 'TeamChatScreen',
  statuspage: 'StatusPageScreen',
  calendar: 'CalendarScreen',
  photos: 'SitePhotosScreen',
  punchlist: 'PunchListScreen',
  digest: 'DailyDigestScreen',
  'survey-ai': 'SurveyEstimatorScreen',
  'survey-cloud': 'SurveyCloudScreen',
  copilot: 'SchedCopilotScreen',
  intel: 'MonitoringIntelScreen',
  'margin-xray': 'MarginXRayScreen',
  'rr-builder': 'RRBuilderScreen',
  rfp: 'RFPScreen',
  wallboard: 'WallboardScreen',
  nps: 'NPSScreen',
  incidents: 'IncidentScreen',
  warranty: 'WarrantyScreen',
  'quote-cash': 'QuoteToCashScreen',
  mrr: 'MRRScreen',
  helpdesk: 'HelpdeskScreen',
  workorder: 'WorkOrderScreen',
  'parts-req': 'PartsReqScreen',
  subcontractors: 'SubcontractorScreen',
  'purchase-orders': 'PurchaseOrdersScreen',
  skills: 'SkillsMatrixScreen',
  knowledge: 'KnowledgeScreen',
  integrations: 'IntegrationsScreen',
  marketing: 'MarketingScreen',
  documents: 'DocumentsScreen',
  'portal-settings': 'PortalSettingsScreen',
  users: 'UsersScreen',
  fleet: 'FleetMapScreen',
  invoices: 'InvoicesDirectScreen',
  estimates: 'EstimatesDirectScreen',
  outbox: 'OutboxScreen',
  pay: 'PayPageScreen',
  'secret-weapon': 'SecretWeaponScreen',
};

function MissingScreen({ id }) {
  return (
    <div className="glass" style={{ padding: 32, margin: 32, textAlign: 'center' }}>
      <div className="label-sm" style={{ marginBottom: 8 }}>Screen module not loaded</div>
      <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>
        “{id}” is not available in this build yet.
      </div>
    </div>
  );
}

/* URL-hash ↔ screen sync so screens are deep-linkable (replaces the design
   host's tweak persistence as the navigation state of record). */
function screenFromHash() {
  let h = window.location.hash.replace(/^#\/?/, '');
  if (h === 'hermes') h = 'shieldtech-ai'; // legacy alias
  return SCREEN_LIST.includes(h) ? h : null;
}

function App() {
  const [t, setTweak] = window.useTweaks({
    ...TWEAK_DEFAULTS,
    screen: screenFromHash() || TWEAK_DEFAULTS.screen,
  });
  const [aiOpen, setShieldAIOpen] = useState(false);
  const screen = t.screen;

  useEffect(() => {
    const cur = screenFromHash();
    if (cur !== screen) window.history.replaceState(null, '', '#/' + screen);
  }, [screen]);
  useEffect(() => {
    const onHash = () => {
      const s = screenFromHash();
      if (s) setTweak('screen', s);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleNav = (id) => {
    setTweak('screen', id);
  };
  window.__shieldNav = handleNav;

  /* Finance data state — driven in the background by role/privilege (no on-screen switcher) */
  const finState = t.financeRole === 'Technician (no finance access)' ? 'denied' : (t.financeState || 'live');
  useEffect(() => {
    window.__qboDemoState = finState;
    window.dispatchEvent(new CustomEvent('qbo-demo-state', { detail: finState }));
  }, [finState]);

  const {
    TweaksPanel, TweakSection, TweakSelect, TweakRadio, AppShell,
  } = window;
  const pick = (name) => window[name] || (() => <MissingScreen id={screen} />);

  const navTweaks = (
    <React.Fragment>
      <TweakSection label="Navigation" />
      <TweakSelect label="Screen" value={screen}
        options={SCREEN_LIST}
        onChange={(v) => setTweak('screen', v)} />
    </React.Fragment>
  );

  // Once really signed in, the prototype login screen auto-forwards.
  useEffect(() => {
    if (screen === 'login' && window.__shieldSupabaseConfigured && window.__shieldAuthed) {
      handleNav('custom-dashboard');
    }
  }, [screen]);

  // Login screen — no shell
  if (screen === 'login') {
    const LoginScreen = pick('LoginScreen');
    return (
      <>
        <LoginScreen />
        <TweaksPanel>{navTweaks}</TweaksPanel>
      </>
    );
  }

  // Customer screen — customer shell
  if (screen === 'customer') {
    const CustomerExpandedScreen = pick('CustomerExpandedScreen');
    return (
      <>
        <AppShell screen={screen} onNav={handleNav} isCustomer onAI={() => setShieldAIOpen(!aiOpen)} onBack={() => handleNav('custom-dashboard')}>
          <CustomerExpandedScreen />
        </AppShell>
        <TweaksPanel>
          {navTweaks}
          <TweakSection label="Display" />
          <TweakRadio label="Glow" value={t.glowIntensity}
            options={['subtle', 'normal', 'vivid']}
            onChange={(v) => setTweak('glowIntensity', v)} />
        </TweaksPanel>
      </>
    );
  }

  // Timeline screen
  if (screen === 'timeline') {
    const CustomerTimeline = pick('CustomerTimeline');
    return (
      <>
        <AppShell screen={screen} onNav={handleNav} onAI={() => setShieldAIOpen(!aiOpen)}>
          <CustomerTimeline customer="City Hall" />
        </AppShell>
        <TweaksPanel>{navTweaks}</TweaksPanel>
      </>
    );
  }

  // Custom Dashboard — special: passes onNav for command palette
  if (screen === 'custom-dashboard') {
    const CustomDashboard = pick('CustomDashboard');
    return (
      <>
        <AppShell screen={screen} onNav={handleNav} onAI={() => setShieldAIOpen(!aiOpen)}>
          <CustomDashboard onNav={handleNav} />
        </AppShell>
        <TweaksPanel>
          {navTweaks}
          <TweakSection label="Display" />
          <TweakRadio label="Glow" value={t.glowIntensity}
            options={['subtle', 'normal', 'vivid']}
            onChange={(v) => setTweak('glowIntensity', v)} />
          <TweakRadio label="Density" value={t.density}
            options={['compact', 'comfortable']}
            onChange={(v) => setTweak('density', v)} />
        </TweaksPanel>
      </>
    );
  }

  // All other screens — full internal shell
  const ScreenComponent = pick(SCREEN_COMPONENTS[screen] || 'DashboardScreen');

  return (
    <>
      <AppShell screen={screen} onNav={handleNav} onAI={() => setShieldAIOpen(!aiOpen)}>
        <ScreenComponent />
      </AppShell>
      <TweaksPanel>
        {navTweaks}
        {screen === 'finance' && (
          <React.Fragment>
            <TweakSection label="Finance · simulate" />
            <TweakSelect label="Signed-in role" value={t.financeRole}
              options={['Owner / Admin', 'Accountant', 'Sales Manager', 'Technician (no finance access)']}
              onChange={(v) => setTweak('financeRole', v)} />
            <TweakSelect label="Data state" value={t.financeState}
              options={['live', 'loading', 'empty', 'error', 'stale']}
              onChange={(v) => setTweak('financeState', v)} />
          </React.Fragment>
        )}
        <TweakSection label="Display" />
        <TweakRadio label="Glow" value={t.glowIntensity}
          options={['subtle', 'normal', 'vivid']}
          onChange={(v) => setTweak('glowIntensity', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'comfortable']}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </>
  );
}

const ShieldAuthGate = window.ShieldAuthGate;
ReactDOM.createRoot(document.getElementById('root')).render(
  <ShieldAuthGate appId="portal"><App /></ShieldAuthGate>
);

/* ── Toast notification system (ported from the shell's second inline script) ── */
function ToastHost() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      setToasts(prev => [...prev.slice(-4), { id, msg: e.detail.msg, type: e.detail.type || 'info' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    window.addEventListener('shield:toast', handler);
    return () => window.removeEventListener('shield:toast', handler);
  }, []);
  const colors = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', info: 'var(--brand)', error: 'var(--status-critical)' };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: 'var(--modal)', border: '1px solid ' + (colors[t.type] || 'var(--border-strong)'), borderRadius: 8, padding: '10px 16px', fontSize: 12, color: 'var(--text-high)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 8, animation: 'fade-up 0.2s ease both', minWidth: 220 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[t.type], flexShrink: 0 }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
// Mount toast host separately on a portal div
const toastRoot = document.createElement('div');
document.body.appendChild(toastRoot);
ReactDOM.createRoot(toastRoot).render(<ToastHost />);

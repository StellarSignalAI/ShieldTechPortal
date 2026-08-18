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

/* Master screen list — the approved consolidation: five workspaces, ~20
   screens. Merged ids stay routable (they land on their hub with the right
   tab open); the deleted demo/empty screens are gone. */
const SCREEN_LIST = [
  'login', 'custom-dashboard', 'customer', 'shieldtech-ai',
  /* Sell */    'crm', 'autobid', 'secret-weapon', 'proposals', 'studio', 'survey-cloud',
  /* Deliver */ 'calendar', 'copilot', 'dispatch', 'workorder', 'photos', 'punchlist', 'projects', 'plan-room',
  /* Collect */ 'finance', 'invoices', 'estimates', 'outbox', 'purchase-orders', 'parts-req', 'mrr', 'rr-builder', 'pay',
  /* Care */    'customers-list', 'cameras', 'assets', 'helpdesk', 'incidents', 'nps', 'messages',
  /* Admin */   'employees', 'skills', 'users', 'approvals', 'timesheets', 'expenses', 'documents', 'portal-settings',
];

/* screen id → window component name. Merged ids point at their workspace hub
   (screen-hubs.jsx), which opens the matching tab via window.__hubScreenId. */
const SCREEN_COMPONENTS = {
  'shieldtech-ai': 'ShieldAIScreen',
  /* Sell */
  crm: 'SellHubScreen',
  autobid: 'SellHubScreen',
  'secret-weapon': 'SellHubScreen',
  proposals: 'ProposalScreen',
  studio: 'StudioScreen',
  'survey-cloud': 'SurveyCloudScreen',
  /* Deliver */
  calendar: 'CalendarHubScreen',
  copilot: 'CalendarHubScreen',
  dispatch: 'DispatchScreen',
  workorder: 'WorkOrderHubScreen',
  photos: 'WorkOrderHubScreen',
  punchlist: 'WorkOrderHubScreen',
  projects: 'ProjectsScreen',
  'plan-room': 'PlanRoomScreen',
  /* Collect */
  finance: 'FinanceScreen',
  invoices: 'InvoicesDirectScreen',
  estimates: 'EstimatesDirectScreen',
  outbox: 'OutboxScreen',
  'purchase-orders': 'PurchasingHubScreen',
  'parts-req': 'PurchasingHubScreen',
  mrr: 'RevenueHubScreen',
  'rr-builder': 'RevenueHubScreen',
  pay: 'PayPageScreen',
  /* Care */
  'customers-list': 'CustomersScreen',
  cameras: 'MonitoringHubScreen',
  assets: 'MonitoringHubScreen',
  helpdesk: 'HelpdeskHubScreen',
  incidents: 'HelpdeskHubScreen',
  nps: 'NPSScreen',
  messages: 'PortalMessagesScreen',
  /* Admin */
  employees: 'TeamHubScreen',
  skills: 'TeamHubScreen',
  users: 'UsersScreen',
  approvals: 'ApprovalsHubScreen',
  timesheets: 'ApprovalsHubScreen',
  expenses: 'ApprovalsHubScreen',
  documents: 'DocumentsScreen',
  'portal-settings': 'PortalSettingsScreen',
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
  window.__hubScreenId = screen; // hubs open the tab matching the requested id
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
const EB = window.AppErrorBoundary || React.Fragment;
ReactDOM.createRoot(document.getElementById('root')).render(
  <ShieldAuthGate appId="portal"><EB><App /></EB></ShieldAuthGate>
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

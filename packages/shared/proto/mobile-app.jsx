/* ShieldTech Mobile — portal mobile shell (ported from "ShieldTech Mobile.html" inline app).
   Renders on the portal domain when a mobile device is detected; ?desktop=1 overrides. */

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = {
  "mscreen": "custom-dashboard"
};

const M_TECH_COLORS = { MR: 'var(--brand)', JL: '#34D399', KW: '#FBBF24', DP: 'var(--accent-2)', TG: '#F43F5E' };
const mFmtH = h => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

/* Same screen map as the desktop portal — 100% parity */
const M_NATIVE = {
  'custom-dashboard': MHomeView,
  dispatch: MDispatchView,
  'customers-list': MCustomersView,
  inventory: MInventoryView,
  approvals: MApprovalsView,
  workorder: MWorkOrdersView,
  'shieldtech-ai': MHermesView,
};
const M_SCREEN_MAP = {
  dashboard: () => <DashboardScreen />,
  assets: () => <AssetsScreen />,
  'shieldtech-ai': () => <ShieldAIScreen />,
  crm: () => (window.SellBoardScreen ? <SellBoardScreen /> : <BidBoardScreen />),
  studio: () => <StudioScreen />,
  'product-library': () => <ProductLibraryScreen />,
  'service-plans': () => <ServicePlansScreen />,
  dispatch: () => <DispatchScreen />,
  finance: () => <FinanceScreen />,
  approvals: () => <ApprovalsScreen />,
  'customers-list': () => <CustomersScreen />,
  customer: () => <CustomerExpandedScreen />,
  timeline: () => <CustomerTimeline customer="City Hall" />,
  cameras: () => <MonitoringConsole />,
  certs: () => <CertificationsView />,
  tools: () => <PoECalculatorView />,
  costing: () => <JobCostingView />,
  audit: () => <AuditTrailView />,
  expenses: () => <ExpenseApprovalScreen />,
  timesheets: () => <TimesheetApprovalScreen />,
  payroll: () => <PayrollScreen />,
  hr: () => <HRHubScreen />,
  projects: () => <ProjectsScreen />,
  'plan-room': () => <PlanRoomScreen />,
  inventory: () => <InventoryScreen />,
  reports: () => <ReportsScreen />,
  proposals: () => <ProposalScreen />,
  employees: () => <EmployeeScreen />,
  contracts: () => <ContractsScreen />,
  sla: () => <SLAScreen />,
  health: () => <CustomerHealthScreen />,
  forecast: () => <RevenueForecastScreen />,
  commissions: () => <CommissionScreen />,
  compliance: () => <ComplianceScreen />,
  onboarding: () => <OnboardingScreen />,
  'service-reports': () => <ServiceReportScreen />,
  pricebook: () => <VendorPriceBookScreen />,
  roi: () => <ROICalculatorScreen />,
  chat: () => <TeamChatScreen />,
  statuspage: () => <StatusPageScreen />,
  calendar: () => <CalendarScreen />,
  photos: () => <SitePhotosScreen />,
  punchlist: () => <PunchListScreen />,
  digest: () => <DailyDigestScreen />,
  'survey-ai': () => <SurveyEstimatorScreen />,
  'survey-cloud': () => <SurveyCloudScreen />,
  copilot: () => <SchedCopilotScreen />,
  intel: () => <MonitoringIntelScreen />,
  'margin-xray': () => <MarginXRayScreen />,
  'rr-builder': () => <RRBuilderScreen />,
  rfp: () => <RFPScreen />,
  wallboard: () => <WallboardScreen />,
  nps: () => <NPSScreen />,
  incidents: () => <IncidentScreen />,
  warranty: () => <WarrantyScreen />,
  'quote-cash': () => <QuoteToCashScreen />,
  mrr: () => <MRRScreen />,
  helpdesk: () => <HelpdeskScreen />,
  workorder: () => <WorkOrderScreen />,
  'parts-req': () => <PartsReqScreen />,
  subcontractors: () => <SubcontractorScreen />,
  'purchase-orders': () => <PurchaseOrdersScreen />,
  skills: () => <SkillsMatrixScreen />,
  knowledge: () => <KnowledgeScreen />,
  integrations: () => <IntegrationsScreen />,
  marketing: () => <MarketingScreen />,
  documents: () => <DocumentsScreen />,
  'portal-settings': () => <PortalSettingsScreen />,
  users: () => <UsersScreen />,
  fleet: () => <FleetMapScreen />,
  invoices: () => <InvoicesDirectScreen />,
  estimates: () => <EstimatesDirectScreen />,
  outbox: () => <OutboxScreen />,
  'secret-weapon': () => <SecretWeaponScreen />,
  autobid: () => <AutoBidScreen />,
};

/* Unified SELL / DELIVER / CARE / ADMIN / MONEY screens — the same UniFi-pattern
   frames the desktop uses, sized to the phone (frame fills the content area,
   drawers go full-screen, tabs render inline). One codebase, one truth. */
const M_UNIFIED = {
  crm: 'SellBoardScreen', autobid: 'SellBoardScreen', 'secret-weapon': 'SellBoardScreen',
  proposals: 'SellProposalsScreen',
  workorder: 'DeliverWorkOrdersScreen', photos: 'DeliverWorkOrdersScreen', punchlist: 'DeliverWorkOrdersScreen',
  projects: 'DeliverProjectsScreen',
  dispatch: 'DeliverDispatchScreen',
  calendar: 'DeliverCalendarScreen', copilot: 'DeliverCalendarScreen',
  'customers-list': 'CareCustomersScreen', nps: 'CareCustomersScreen',
  helpdesk: 'CareHelpdeskScreen', incidents: 'CareHelpdeskScreen',
  messages: 'CareMessagesScreen',
  employees: 'AdminTeamScreen', skills: 'AdminTeamScreen',
  users: 'AdminUsersScreen', hr: 'AdminHRScreen',
  approvals: 'AdminApprovalsScreen', timesheets: 'AdminApprovalsScreen', payroll: 'AdminApprovalsScreen', expenses: 'AdminApprovalsScreen',
  documents: 'AdminDocumentsScreen', 'portal-settings': 'AdminSettingsScreen',
  revops: 'MoneyRevOpsScreen',
  'purchase-orders': 'MoneyPurchasingScreen', 'parts-req': 'MoneyPurchasingScreen', inventory: 'MoneyPurchasingScreen',
  mrr: 'MoneyRecurringScreen', 'rr-builder': 'MoneyRecurringScreen',
  'plan-room': 'MoneyBlueShieldScreen',
};
const mUnified = (id) => (M_UNIFIED[id] && window[M_UNIFIED[id]]) || null;

/* Ids resolved by purpose-built touch-native views (branches below). */
const M_NATIVE_IDS = ['m-more','calendar','login','helpdesk','incidents','quote-cash','purchase-orders','parts-req','mrr','nps','skills','knowledge','warranty','photos','punchlist','subcontractors','projects','proposals','finance','certs','tools','costing','audit','reports','contracts','sla','commissions','compliance','survey-ai','sitescan','fleet'];

function screenLabel(id) {
  if (id === 'sitescan') return 'Survey Scan';
  if (id === 'autobid') return 'Auto-Bid';
  if (id === 'm-more') return 'Menu';
  if (id === 'cameras') return 'ShieldTech OS';
  if (id === 'finance') return 'Money';
  const item = NAV_ITEMS.find(i => i.id === id);
  return item ? item.label : 'ShieldTech';
}

/* ── Menu (☰) — the seven workspaces, nothing else to scroll through ──
   A row per workspace with its second level as chips, then Settings, the tab
   bar editor and the other apps. Tapping a chip opens that workspace on that
   tab (the phone remembers the last tab per workspace). */
function MobileDirectory({ onNav }) {
  const appUrls = window.__shieldAppUrls || {};
  const target = (w) => (w.component ? 'ws-' + w.id : w.screen);
  const openTab = (w, t) => { window.__mwsPick = { ws: w.id, m: t.m }; try { localStorage.setItem('st2:mws:' + w.id, t.m); } catch { /* noop */ } onNav('ws-' + w.id); };
  const row = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px', border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--glass-bg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {NAV_WORKSPACES.map(w => (
        <div key={w.id} className="glass" style={{ borderRadius: 12 }}>
          <button onClick={() => onNav(target(w))} style={{ ...row, border: 'none', borderRadius: w.tabs.length ? '12px 12px 0 0' : 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(var(--brand-rgb),0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={w.icon} size={16} color="var(--brand)" /></span>
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: 'var(--text-high)' }}>{w.label}</span>
            <span style={{ color: 'var(--text-low)', fontSize: 16 }}>›</span>
          </button>
          {w.tabs.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 14px 12px 60px' }}>
              {w.tabs.map(t => <button key={t.m} onClick={() => openTab(w, t)} style={{ padding: '6px 11px', borderRadius: 14, fontSize: 11.5, fontWeight: 600, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.mLabel || t.label}</button>)}
            </div>
          )}
        </div>
      ))}
      <button onClick={() => onNav(NAV_SETTINGS.screen)} className="glass" style={{ ...row, borderRadius: 12 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(var(--brand-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="settings" size={16} color="var(--text-mid)" /></span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>Settings</span>
        <span style={{ color: 'var(--text-low)', fontSize: 16 }}>›</span>
      </button>
      <button onClick={() => window.__shieldEditTabs && window.__shieldEditTabs()} className="glass" style={{ ...row, borderRadius: 12 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(var(--brand-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-mid)', fontSize: 15 }}>✎</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>Tab bar</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-low)' }}>Choose and reorder the bottom tabs</span>
        </span>
        <span style={{ color: 'var(--text-low)', fontSize: 16 }}>›</span>
      </button>
      <div style={{ padding: '10px 2px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="label-sm" style={{ marginBottom: 6 }}>OTHER APPS</div>
        <a href="?desktop=1" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}><ShieldLogo size={18} /> Desktop Portal →</a>
        <a href={appUrls.tech || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}><ShieldLogo size={18} /> Technician App →</a>
        <a href={appUrls.customer || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}><ShieldLogo size={18} /> Customer Portal →</a>
        <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)', paddingTop: 10, opacity: 0.6 }}>build {window.__shieldBuild || 'dev'}{window.__shieldViewportInfo ? ` · ${window.__shieldViewportInfo()}` : ''}</div>
      </div>
    </div>
  );
}

/* Top-right avatar → account & settings dropdown (parity with desktop menu) */
function MAvatarMenu({ onNav }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useShieldStore(userPrefsStore);
  const u = window.__shieldUser;
  const theme = (prefs && prefs.theme) || 'dark';
  const status = (prefs && prefs.status) || 'online';
  const setTheme = (t) => setPrefs(p => ({ ...(p || {}), theme: t }));
  const setStatus = (s) => setPrefs(p => ({ ...(p || {}), status: s }));
  const go = (id) => { setOpen(false); onNav(id); };
  const item = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' };
  const seg = (active, c) => ({ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', background: active ? (c ? `${c}22` : 'rgba(var(--brand-rgb),0.14)') : 'transparent', border: `1px solid ${active ? (c || 'var(--brand)') : 'var(--border-subtle)'}`, color: active ? (c || 'var(--brand)') : 'var(--text-low)' });
  const label = { fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 14px 6px' };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{(u && u.initials) || '·'}</button>
      {open && window.ReactDOM.createPortal((
        <>
          {/* Portal to <body> so the panel escapes the header's stacking context
              (its backdrop-filter otherwise lets page content paint over it). */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483646 }} />
          <div style={{ position: 'fixed', top: 46, right: 8, zIndex: 2147483647, width: 'min(260px, 88vw)', maxHeight: '82vh', overflowY: 'auto', background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderRadius: 12, boxShadow: '0 16px 44px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '12px 14px 9px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{(u && u.name) || 'ShieldTech'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{(u && u.role) || ''} {(u && u.email) || 'not signed in'}</div>
            </div>
            <button style={item} onClick={() => go('portal-settings')}>⚙ Settings</button>
            <button style={item} onClick={() => go('messages')}>✉ Messages</button>
            <button style={item} onClick={() => go('users')}>◈ Users & Invites</button>
            <button style={item} onClick={() => go('integrations')}>⇄ Integrations</button>
            <button style={item} onClick={() => go('dispatch')}>⌖ Dispatch &amp; Fleet</button>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '5px 12px' }} />
            <div style={label}>Appearance</div>
            <div style={{ display: 'flex', gap: 5, padding: '0 14px 8px' }}>
              {[['dark', 'Dark'], ['light', 'Light'], ['system', 'System']].map(([id, l]) => (
                <button key={id} onClick={() => setTheme(id)} style={seg(theme === id)}>{l}</button>
              ))}
            </div>
            <div style={label}>Status</div>
            <div style={{ display: 'flex', gap: 5, padding: '0 14px 8px' }}>
              {[['online', 'Online', 'var(--status-ok)'], ['busy', 'Busy', 'var(--status-warn)'], ['away', 'Away', 'var(--text-low)']].map(([id, l, c]) => (
                <button key={id} onClick={() => setStatus(id)} style={seg(status === id, c)}>{l}</button>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '5px 12px' }} />
            {u && <button style={{ ...item, color: 'var(--status-critical)' }} onClick={() => { setOpen(false); if (window.__shieldAuth) window.__shieldAuth.signOut(); if (onNav) onNav('login'); }}>← Sign out</button>}
            <div className="mono" style={{ padding: '6px 14px 10px', fontSize: 9, color: 'var(--text-low)', opacity: 0.6 }}>build {window.__shieldBuild || 'dev'}{window.__shieldViewportInfo ? ` · ${window.__shieldViewportInfo()}` : ''}</div>
          </div>
        </>
      ), document.body)}
    </div>
  );
}

/* Which kind of view a screen id resolves to on the phone: a unified
   (UniFi-pattern) frame, a purpose-built native view, or a desktop-built
   screen adapted by mobile.css. The shell sizes its scroll area by this. */
function mobileKind(screen) {
  if (mUnified(screen)) return 'unified';
  if (M_NATIVE_IDS.includes(screen) || !!M_NATIVE[screen] || !!(window.M_OPS5 && window.M_OPS5[screen])) return 'native';
  return 'desk';
}
/* The one place a screen id becomes a view. */
function renderMobileScreen(screen, nav) {
  let content;
  const Unified = mUnified(screen);
  if (screen === 'm-more') content = <MobileDirectory onNav={nav} />;
  else if (Unified) {
    // Legacy id → the unified screen opens on the matching tab (same hand-off the desktop uses).
    window.__hubScreenId = screen;
    content = <div className="m-unified" style={{ height: '100%', '--uf-h': '100%', '--uf-m': '0', '--uf-r': '0', '--uf-b': 'none' }}><Unified key={M_UNIFIED[screen]} /></div>;
  }
  else if (screen === 'calendar') content = <MobileCalendar onNav={nav} />;
  else if (screen === 'cameras' || screen === 'topology' || screen === 'warroom' || screen === 'floorplan' || screen === 'anomaly' || screen === 'assets') content = window.MobileOS ? <MobileOS onNav={nav} /> : <MonitoringConsole />;
  else if (screen === 'helpdesk') content = <MHelpdesk onNav={nav} />;
  else if (screen === 'incidents') content = <MIncidents onNav={nav} />;
  else if (screen === 'quote-cash') content = <MQuoteToCash onNav={nav} />;
  else if (screen === 'purchase-orders') content = <MPurchaseOrders onNav={nav} />;
  else if (screen === 'parts-req') content = <MPartsReq onNav={nav} />;
  else if (screen === 'mrr') content = <MMRR onNav={nav} />;
  else if (screen === 'nps') content = <MNPS onNav={nav} />;
  else if (screen === 'skills') content = <MSkills onNav={nav} />;
  else if (screen === 'knowledge') content = <MKnowledge onNav={nav} />;
  else if (screen === 'warranty') content = <MWarranty onNav={nav} />;
  else if (screen === 'photos') content = <MPhotos onNav={nav} />;
  else if (screen === 'punchlist') content = <MPunch onNav={nav} />;
  else if (screen === 'subcontractors') content = <MSubcontractors onNav={nav} />;
  else if (screen === 'projects') content = <MProjects onNav={nav} />;
  else if (screen === 'proposals') content = <MProposals onNav={nav} />;
  else if (screen === 'finance') content = <MFinance onNav={nav} />;
  else if (screen === 'certs') content = <MCerts onNav={nav} />;
  else if (screen === 'tools') content = <MPoECalc onNav={nav} />;
  else if (screen === 'costing') content = <MCosting onNav={nav} />;
  else if (screen === 'audit') content = <MAudit onNav={nav} />;
  else if (screen === 'reports') content = <MReports onNav={nav} />;
  else if (screen === 'contracts') content = <MContracts onNav={nav} />;
  else if (screen === 'sla') content = <MSLA onNav={nav} />;
  else if (screen === 'commissions') content = <MCommissions onNav={nav} />;
  else if (screen === 'compliance') content = <MCompliance onNav={nav} />;
  else if (screen === 'survey-ai') content = <MSurvey onNav={nav} />;
  else if (screen === 'sitescan') content = <MSurveyScan onNav={nav} />;
  else if (screen === 'fleet') content = <div style={{ height: 'calc(100dvh - 118px)', minHeight: 360, margin: -14 }}><FleetMapScreen /></div>;
  else if (screen === 'dispatch') content = <MDispatchView onNav={nav} />;
  else if (screen === 'login') content = <LoginScreen />;
  else if (M_NATIVE[screen]) { const Native = M_NATIVE[screen]; content = <Native onNav={nav} />; }
  else if (window.M_OPS5 && window.M_OPS5[screen]) { const Native = window.M_OPS5[screen]; content = <Native onNav={nav} />; }
  else {
    const Fn = M_SCREEN_MAP[screen] || (() => <MHomeView onNav={nav} />);
    content = <Fn />;
  }
  return content;
}

/* ── Workspace (phone) — a chip row for the second level, then the chosen
   bespoke mobile view underneath. ws-sell / ws-work / ws-money / ws-customers /
   ws-team. The chosen tab is remembered per workspace on the device. */
const M_WS_KEY = (id) => 'st2:mws:' + id;
function MWorkspace({ wsId, nav }) {
  const ws = NAV_WORKSPACES.find(w => w.id === wsId);
  const tabs = ws ? ws.tabs : [];
  const [cur, setCur] = useState(() => {
    const pick = window.__mwsPick;
    if (pick && pick.ws === wsId && tabs.some(t => t.m === pick.m)) { window.__mwsPick = null; return pick.m; }
    try { const v = localStorage.getItem(M_WS_KEY(wsId)); if (v && tabs.some(t => t.m === v)) return v; } catch { /* noop */ }
    return tabs.length ? tabs[0].m : 'custom-dashboard';
  });
  useEffect(() => { try { localStorage.setItem(M_WS_KEY(wsId), cur); } catch { /* noop */ } }, [cur]);
  const kind = mobileKind(cur);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(var(--card-rgb),0.6)', scrollbarWidth: 'none' }}>
        {tabs.map(t => {
          const on = t.m === cur;
          return <button key={t.m} onClick={() => setCur(t.m)} style={{ padding: '7px 13px', borderRadius: 16, border: `1px solid ${on ? 'rgba(var(--brand-rgb),0.45)' : 'var(--border-subtle)'}`, background: on ? 'rgba(var(--brand-rgb),0.14)' : 'var(--card)', color: on ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{t.mLabel || t.label}</button>;
        })}
      </div>
      <div className="m-screen" data-desk={kind === 'unified' ? 'unified' : String(kind === 'desk')} style={kind === 'unified' ? { flex: 1, minHeight: 0, overflow: 'hidden', padding: 0 } : { flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 14 }}>
        {renderMobileScreen(cur, nav)}
      </div>
    </div>
  );
}
const mWorkspaceOf = (screen) => (typeof screen === 'string' && screen.startsWith('ws-') && NAV_WORKSPACES.some(w => 'ws-' + w.id === screen)) ? screen.slice(3) : null;

function MobilePortalApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Restore the last screen on refresh/relaunch (device-local).
  React.useEffect(() => {
    const s = savedScreen('portal-m', null);
    if (s && s !== (t.mscreen || 'custom-dashboard')) setTweak('mscreen', s);
  }, []);
  let screen = t.mscreen || 'custom-dashboard';
  if (screen === 'hermes') screen = 'shieldtech-ai';
  const handleNav = (id) => { const v = id === 'hermes' ? 'shieldtech-ai' : id; setTweak('mscreen', v); saveScreen('portal-m', v); };
  const [histBack, setHistBack] = useState([]);
  const [tabCfg] = useShieldStore(mobileTabsStore);
  const [ssPrefs] = useShieldStore(ssPrefsStore);
  const [svPrefs] = useShieldStore(surveyPrefsStore);
  const [tabEditor, setTabEditor] = useState(false);
  const [newJob, setNewJob] = useState(false);
  const [drawer, setDrawer] = useState(false);
  // Refresh the window hooks every render so they never capture stale closures.
  React.useEffect(() => {
    window.__shieldNav = handleNav;
    window.__shieldNewJob = () => setNewJob(true);
    window.__shieldEditTabs = () => setTabEditor(true);
    window.__shieldOpenMenu = () => setDrawer(true);
  });
  const liveTabs = tabCfg.tabs.slice(0, tabCfg.maxTabs);

  const nav = (id) => { setHistBack(h => [...h.slice(-12), screen]); handleNav(id); };
  const goBack = () => {
    if (histBack.length === 0) { nav('m-more'); return; }
    const prev = histBack[histBack.length - 1];
    setHistBack(h => h.slice(0, -1));
    handleNav(prev);
  };

  const isTab = liveTabs.some(x => x.id === screen);
  const activeId = isTab ? screen : null;

  // Long-press anywhere on the tab bar opens the editor (tap still navigates).
  const lpTimer = React.useRef(null);
  const lpFired = React.useRef(false);
  const startLP = () => { lpFired.current = false; lpTimer.current = setTimeout(() => { lpFired.current = true; setTabEditor(true); }, 450); };
  const cancelLP = () => { clearTimeout(lpTimer.current); };

  const wsId = mWorkspaceOf(screen);
  const Unified = wsId ? null : mUnified(screen);
  const content = wsId ? <MWorkspace key={screen} wsId={wsId} nav={nav} /> : renderMobileScreen(screen, nav);
  // Every mobile screen IS the complete, bespoke experience — no desktop
  // fallback and no "full toolset" escape hatch. Desktop layouts stay
  // desktop-only.
  return (
    <div className="m-app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(var(--card-rgb),0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0
      }}>
        {histBack.length > 0 && (
          <button onClick={goBack} aria-label="Back" title="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 26, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-high)', fontSize: 22, lineHeight: 1, fontFamily: 'var(--font-body)' }}>‹</button>
        )}
        <button onClick={() => setDrawer(true)} aria-label="Menu" title="Menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, width: 30, height: 30 }}>
          <span style={{ height: 2, width: 19, borderRadius: 2, background: 'var(--text-high)' }} />
          <span style={{ height: 2, width: 19, borderRadius: 2, background: 'var(--text-high)' }} />
          <span style={{ height: 2, width: 19, borderRadius: 2, background: 'var(--text-high)' }} />
        </button>
        <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 24 }} />
        <div style={{ flex: 1 }} />
        <button onClick={() => nav('shieldtech-ai')} title="ShieldTech AI" style={{ background: 'rgba(var(--brand-rgb),0.08)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="hermes" size={15} color="var(--brand)" />
        </button>
        <MAvatarMenu onNav={nav} />
      </header>

      {/* Content */}
      <div className={wsId ? 'm-workspace' : 'm-screen'} data-desk={wsId ? 'ws' : Unified ? 'unified' : !(M_NATIVE_IDS.includes(screen) || !!M_NATIVE[screen] || !!(window.M_OPS5 && window.M_OPS5[screen]))} style={wsId || Unified ? { flex: 1, minHeight: 0, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' } : { flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 14 }}>
        {content}
      </div>

      {/* Bottom tabs */}
      <nav onPointerDown={startLP} onPointerUp={cancelLP} onPointerLeave={cancelLP} onPointerCancel={cancelLP} style={{
        display: 'flex', borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(var(--card-rgb),0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}>
        {liveTabs.map(tb => {
          const on = tb.id === activeId;
          return (
            <button key={tb.id} onClick={() => { if (lpFired.current) { lpFired.current = false; return; } nav(tb.id); }} style={{
              flex: 1, padding: '8px 1px 6px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, background: 'none', border: 'none',
              color: on ? 'var(--brand)' : 'var(--text-low)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 0.15s', position: 'relative',
              minWidth: 0
            }}>
              {on && <div style={{ position: 'absolute', top: -1, left: '28%', right: '28%', height: 2, background: 'var(--brand)', borderRadius: '0 0 2px 2px', boxShadow: '0 0 8px var(--brand)' }} />}
              <Icon name={tb.icon} size={18} color={on ? 'var(--brand)' : 'var(--text-low)'} />
              <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.01em', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>{tb.label}</span>
            </button>
          );
        })}
        {/* Edit-tabs control */}
        <button onClick={() => setTabEditor(true)} title="Edit tab bar" style={{
          width: 30, flexShrink: 0, padding: '8px 0 6px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2, background: 'none',
          border: 'none', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-low)',
          cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>✎</span>
        </button>
      </nav>

      {tabEditor && <MTabEditor onClose={() => setTabEditor(false)} />}
      {newJob && <MNewJobSheet onClose={() => setNewJob(false)} />}

      {/* Left slide-out drawer — anchored to the app frame (absolute, not fixed) so it can never spill outside the phone column */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 950, pointerEvents: drawer ? 'auto' : 'none' }}>
        <div onClick={() => setDrawer(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: drawer ? 'blur(2px)' : 'none', opacity: drawer ? 1 : 0, transition: 'opacity 0.25s ease' }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '86%', maxWidth: 330,
          background: 'var(--canvas)', borderRight: '1px solid var(--border-strong)',
          display: 'flex', flexDirection: 'column',
          transform: drawer ? 'translateX(0)' : 'translateX(-104%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: drawer ? '10px 0 44px rgba(0,0,0,0.55)' : 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 24 }} />
            <button onClick={() => setDrawer(false)} aria-label="Close menu" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <MobileDirectory onNav={(id) => { setDrawer(false); nav(id); }} />
          </div>
        </div>
      </div>


      <TweaksPanel>
        <TweakSection label="Navigation" />
        <TweakSelect label="Screen" value={screen}
          options={['custom-dashboard', 'm-more', 'sitescan', ...Object.keys(M_SCREEN_MAP)]}
          onChange={(v) => handleNav(v)} />
        <TweakSection label="Survey Scan" />
        <TweakRadio label="Hub layout" value={svPrefs.hubLayout} options={[{ value: 'workflow', label: 'Workflow' }, { value: 'grid', label: 'Grid' }]} onChange={v => surveyPrefsStore.set(s => ({ ...s, hubLayout: v }))} />
        <TweakRadio label="Report style" value={svPrefs.reportStyle} options={[{ value: 'blueprint', label: 'Blueprint' }, { value: 'clean', label: 'Clean' }]} onChange={v => surveyPrefsStore.set(s => ({ ...s, reportStyle: v }))} />
        <TweakToggle label="ShieldTech AI capture" value={svPrefs.aiCapture} onChange={v => surveyPrefsStore.set(s => ({ ...s, aiCapture: v }))} />
        <TweakRadio label="Blueprint" value={ssPrefs.theme} options={[{ value: 'dark', label: 'Dark' }, { value: 'paper', label: 'Paper' }]} onChange={v => ssPrefsStore.set(s => ({ ...s, theme: v }))} />
        <TweakRadio label="Device icons" value={ssPrefs.icons} options={[{ value: 'glyph', label: 'Glyphs' }, { value: 'letter', label: 'Letters' }]} onChange={v => ssPrefsStore.set(s => ({ ...s, icons: v }))} />
        <TweakSlider label="Scan speed" value={ssPrefs.scanSpeed} min={0.5} max={3} step={0.25} unit="×" onChange={v => ssPrefsStore.set(s => ({ ...s, scanSpeed: v }))} />
        <TweakSlider label="AR walk speed" value={ssPrefs.vrSpeed} min={0.5} max={3} step={0.25} unit="×" onChange={v => ssPrefsStore.set(s => ({ ...s, vrSpeed: v }))} />
        <TweakSlider label="AR field of view" value={ssPrefs.vrFov} min={50} max={100} step={5} unit="°" onChange={v => ssPrefsStore.set(s => ({ ...s, vrFov: v }))} />
      </TweaksPanel>
      <ShieldToastHost />
    </div>
  );
}

Object.assign(window, { MobilePortalApp, MobileDirectory, M_NATIVE, M_SCREEN_MAP, screenLabel, M_TECH_COLORS, mFmtH });

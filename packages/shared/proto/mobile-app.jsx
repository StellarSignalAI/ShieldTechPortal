/* ShieldTech Mobile — portal mobile shell (ported from "ShieldTech Mobile.html" inline app).
   Renders on the portal domain when a mobile device is detected; ?desktop=1 overrides. */

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = {
  "mscreen": "custom-dashboard"
};

/* ── Mobile-native Schedule (agenda view — replaces desktop calendar grid) ── */
const M_AGENDA_TYPES = {
  install:     { c: '#3FA9F5', label: 'Install' },
  maintenance: { c: '#FBBF24', label: 'Maintenance' },
  repair:      { c: '#F43F5E', label: 'Repair' },
  survey:      { c: '#c084fc', label: 'Survey' },
  meeting:     { c: '#34D399', label: 'Meeting' },
};
const M_TECH_COLORS = { MR: '#3FA9F5', JL: '#34D399', KW: '#FBBF24', DP: '#c084fc', TG: '#F43F5E' };
const mFmtH = h => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

function MobileAgendaView({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const [day, setDay] = useState(3); // Wed = today
  const [addJob, setAddJob] = useState(false);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [8, 9, 10, 11, 12, 13, 14];
  const dayJobs = jobs.filter(j => j.day <= day && day <= (j.endDay || j.day)).sort((a, b) => a.start - b.start);
  const weekRevenue = jobs.filter(j => j.value && j.type !== 'meeting').reduce((s, j) => s + (j.value || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="display" style={{ fontSize: 15, color: 'var(--text-high)' }}>This week</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)' }}>${weekRevenue.toLocaleString()} wk</span>
          <button onClick={() => setAddJob(true)} style={{ padding: '6px 13px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Job</button>
        </div>
      </div>
      {/* Day pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {dayLabels.map((d, i) => {
          const n = jobs.filter(j => j.day <= i + 1 && i + 1 <= (j.endDay || j.day)).length;
          const on = day === i + 1, today = i === 2;
          return (
            <button key={d} onClick={() => setDay(i + 1)} style={{ padding: '8px 0 6px', borderRadius: 9, border: '1px solid', borderColor: on ? 'var(--border-strong)' : 'var(--border-subtle)', background: on ? 'rgba(63,169,245,0.12)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: 8, letterSpacing: '0.06em', color: on ? 'var(--brand)' : 'var(--text-low)' }}>{d.toUpperCase()}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: today ? 700 : 400, color: today ? 'var(--brand)' : on ? 'var(--text-high)' : 'var(--text-mid)' }}>{dates[i]}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: n ? 'var(--brand)' : 'transparent' }}></span>
            </button>
          );
        })}
      </div>
      {/* Jobs for the day */}
      {dayJobs.length === 0 && <div className="glass" style={{ padding: 28, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Nothing scheduled — enjoy it</div>}
      {dayJobs.map(j => {
        const tc = M_AGENDA_TYPES[j.type] || M_AGENDA_TYPES.install;
        const span = (j.endDay || j.day) - j.day + 1;
        const unassigned = !j.techs || j.techs.length === 0;
        return (
          <div key={j.id} onClick={() => onNav('workorder')} className="glass" style={{ padding: '12px 14px', borderRadius: 12, borderLeft: `3px solid ${tc.c}`, cursor: 'pointer', border: unassigned ? '1px dashed #94A3B8' : undefined, borderLeftColor: tc.c, borderLeftStyle: 'solid', borderLeftWidth: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: tc.c, flexShrink: 0 }}>{mFmtH(j.start)}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {(j.techs || []).slice(0, 3).map((tid, ti) => (
                  <span key={tid} style={{ width: 20, height: 20, borderRadius: '50%', background: `${M_TECH_COLORS[tid] || '#3FA9F5'}28`, border: `1px solid ${M_TECH_COLORS[tid] || '#3FA9F5'}60`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: M_TECH_COLORS[tid] || '#3FA9F5', marginLeft: ti > 0 ? -6 : 0 }}>{tid}</span>
                ))}
                {unassigned && <span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8' }}>◌ unassigned</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingLeft: 0, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{mFmtH(j.start)} – {mFmtH(j.start + j.dur)}{span > 1 ? ` · ${span} days` : ''}</span>
              <span style={{ fontSize: 10, color: tc.c }}>{tc.label}</span>
              {j.value > 0 && <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', marginLeft: 'auto' }}>${(j.value / 1000).toFixed(1)}k</span>}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Drag-and-drop scheduling lives on the desktop calendar — this is your day view.</div>
      {addJob && <MNewJobSheet defaultDay={day} onClose={() => setAddJob(false)} />}
    </div>
  );
}

/* Same screen map as the desktop portal — 100% parity */
const M_NATIVE = {
  'custom-dashboard': MHomeView,
  dashboard: MMissionView,
  dispatch: MDispatchView,
  finance: MFinanceView,
  'customers-list': MCustomersView,
  crm: MPipelineView,
  inventory: MInventoryView,
  approvals: MApprovalsView,
  workorder: MWorkOrdersView,
  'shieldtech-ai': MHermesView,
};
const M_SCREEN_MAP = {
  'finance-full': () => <FinanceScreen />,
  'workorder-full': () => <WorkOrderScreen />,
  dashboard: () => <DashboardScreen />,
  assets: () => <AssetsScreen />,
  'shieldtech-ai': () => <ShieldAIScreen />,
  crm: () => <BidBoardScreen />,
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
  projects: () => <ProjectsScreen />,
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
};

/* Ids resolved by purpose-built touch-native views (branches below). Any of
   these can also open its full desktop screen via the '<id>-full' alias. */
const M_NATIVE_IDS = ['m-more','calendar','cameras','topology','warroom','floorplan','anomaly','login','helpdesk','incidents','quote-cash','purchase-orders','parts-req','mrr','nps','skills','knowledge','warranty','photos','punchlist','subcontractors','projects','proposals','finance','certs','tools','costing','audit','reports','contracts','sla','commissions','compliance','survey-ai','sitescan'];

const M_TABS = [
  { id: 'custom-dashboard', icon: 'dashboard', label: 'Home' },
  { id: 'calendar', icon: 'calendar', label: 'Schedule' },
  { id: 'dispatch', icon: 'dispatch', label: 'Field' },
  { id: 'finance', icon: 'finance', label: 'Money' },
  { id: 'm-more', icon: 'grid-2', label: 'All' },
];

function screenLabel(id) {
  if (id === 'sitescan') return 'Survey Scan';
  if (id === 'm-more') return 'Everything';
  if (id === 'finance-full') return 'Finance Suite';
  if (id === 'workorder-full') return 'Work Order';
  if (id.endsWith('-full')) return screenLabel(id.slice(0, -5)) + ' · Full';
  const item = NAV_ITEMS.find(i => i.id === id);
  return item ? item.label : 'ShieldTech';
}

/* ── Full directory (every desktop screen) ── */
function MobileDirectory({ onNav }) {
  const [q, setQ] = useState('');
  const groups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(i => !i.hidden && i.label.toLowerCase().includes(q.toLowerCase())),
  })).filter(g => g.items.length > 0);
  const appUrls = window.__shieldAppUrls || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search all screens…"
        style={{ background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 14px', color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
      {'survey scan surveyscan site scan 3d lidar'.includes(q.toLowerCase()) && (
        <button onClick={() => onNav('sitescan')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 13px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'linear-gradient(120deg, rgba(63,169,245,0.10), rgba(192,132,252,0.08))', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--brand)', flexShrink: 0 }}>◉</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>Survey Scan <span style={{ fontSize: 8, fontWeight: 700, color: '#c084fc', border: '1px solid rgba(192,132,252,0.4)', borderRadius: 4, padding: '1px 5px', marginLeft: 4, verticalAlign: 'middle' }}>NEW</span></span>
            <span style={{ display: 'block', fontSize: 10, color: 'var(--text-low)' }}>Scan · document · estimate · report — the whole site visit</span>
          </span>
          <span style={{ color: 'var(--text-low)', fontSize: 14 }}>›</span>
        </button>
      )}
      {groups.map(g => (
        <div key={g.id}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-low)', margin: '4px 0 8px' }}>{g.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {g.items.map(item => (
              <button key={item.id} onClick={() => onNav(item.id)} className="glass" style={{
                padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 9,
                border: '1px solid var(--border-subtle)', cursor: 'pointer',
                background: 'var(--glass-bg)', borderRadius: 10,
                textAlign: 'left', fontFamily: 'var(--font-body)'
              }}>
                <Icon name={item.icon} size={16} color="var(--brand)" />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.25 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>SETTINGS</div>
        <button onClick={() => window.__shieldEditTabs && window.__shieldEditTabs()} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 13px', border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--glass-bg)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
          <span style={{ fontSize: 16, color: 'var(--brand)' }}>✎</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>Customize tab bar</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Choose, reorder & rename your bottom tabs</div>
          </div>
          <span style={{ color: 'var(--text-low)', fontSize: 14 }}>›</span>
        </button>
      </div>
      <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>OTHER APPS</div>
        <a href="?desktop=1" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}><ShieldLogo size={18} /> Desktop Portal →</a>
        <a href={appUrls.tech || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}><ShieldLogo size={18} /> Technician App →</a>
        <a href={appUrls.customer || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}><ShieldLogo size={18} /> Customer Portal →</a>
        <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)', paddingTop: 10, opacity: 0.6 }}>build {window.__shieldBuild || 'dev'}</div>
      </div>
    </div>
  );
}

/* Top-right avatar → account & settings dropdown */
function MAvatarMenu({ onNav }) {
  const [open, setOpen] = useState(false);
  const u = window.__shieldUser;
  const go = (id) => { setOpen(false); onNav(id); };
  const item = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 13px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{(u && u.initials) || '·'}</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 4000 }} />
          <div style={{ position: 'absolute', top: 34, right: 0, zIndex: 4001, width: 236, background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 44px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '12px 13px 9px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{(u && u.name) || 'ShieldTech'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{(u && u.role) || ''} {(u && u.email) || 'not signed in'}</div>
            </div>
            <button style={item} onClick={() => go('portal-settings')}>⚙ Settings</button>
            <button style={item} onClick={() => go('users')}>◈ Users & Invites</button>
            <button style={item} onClick={() => go('integrations')}>⇄ Integrations</button>
            <button style={item} onClick={() => go('fleet')}>⌖ Fleet GPS</button>
            {u && <button style={item} onClick={() => { setOpen(false); if (window.__shieldAuth) window.__shieldAuth.signOut(); }}>← Sign out</button>}
            <div className="mono" style={{ padding: '6px 13px 10px', fontSize: 9, color: 'var(--text-low)', opacity: 0.6 }}>build {window.__shieldBuild || 'dev'}</div>
          </div>
        </>
      )}
    </div>
  );
}

function MobilePortalApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  let screen = t.mscreen || 'custom-dashboard';
  if (screen === 'hermes') screen = 'shieldtech-ai';
  const handleNav = (id) => setTweak('mscreen', id === 'hermes' ? 'shieldtech-ai' : id);
  window.__shieldNav = handleNav;
  const [histBack, setHistBack] = useState([]);
  const [tabCfg] = useShieldStore(mobileTabsStore);
  const [ssPrefs] = useShieldStore(ssPrefsStore);
  const [svPrefs] = useShieldStore(surveyPrefsStore);
  const [tabEditor, setTabEditor] = useState(false);
  const [newJob, setNewJob] = useState(false);
  const [drawer, setDrawer] = useState(false);
  window.__shieldNewJob = () => setNewJob(true);
  window.__shieldEditTabs = () => setTabEditor(true);
  window.__shieldOpenMenu = () => setDrawer(true);
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
  const topLevel = isTab || screen === 'm-more';

  // Long-press anywhere on the tab bar opens the editor (tap still navigates).
  const lpTimer = React.useRef(null);
  const lpFired = React.useRef(false);
  const startLP = () => { lpFired.current = false; lpTimer.current = setTimeout(() => { lpFired.current = true; setTabEditor(true); }, 450); };
  const cancelLP = () => { clearTimeout(lpTimer.current); };

  // '<id>-full' opens the full desktop screen for ids that default to a native view
  const fullBase = screen.endsWith('-full') && M_SCREEN_MAP[screen.slice(0, -5)] ? screen.slice(0, -5) : null;
  const hasFullView = !screen.endsWith('-full') && Boolean(M_SCREEN_MAP[screen]) && (Boolean(M_NATIVE[screen]) || M_NATIVE_IDS.includes(screen));

  let content;
  if (fullBase) { const Fn = M_SCREEN_MAP[fullBase]; content = <Fn />; }
  else if (screen === 'm-more') content = <MobileDirectory onNav={nav} />;
  else if (screen === 'calendar') content = <MobileCalendar onNav={nav} />;
  else if (screen === 'cameras' || screen === 'topology' || screen === 'warroom' || screen === 'floorplan' || screen === 'anomaly') content = <MobileMonitoring onNav={nav} />;
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
  else if (screen === 'login') content = <LoginScreen />;
  else if (M_NATIVE[screen]) { const Native = M_NATIVE[screen]; content = <Native onNav={nav} />; }
  else {
    const Fn = M_SCREEN_MAP[screen] || (() => <MHomeView onNav={nav} />);
    content = <Fn />;
  }
  // Bespoke mobile = native touch view + the COMPLETE desktop toolset inline,
  // reflowed for the phone. One surface, nothing missing, no mode toggle.
  const FULL_INLINE_SKIP = ['m-more', 'login', 'sitescan', 'cameras', 'topology', 'warroom', 'floorplan', 'anomaly', 'custom-dashboard'];
  if (!fullBase && hasFullView && !FULL_INLINE_SKIP.includes(screen)) {
    const FullFn = M_SCREEN_MAP[screen];
    content = (
      <>
        {content}
        <div style={{ margin: '18px -14px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '14px 14px 2px', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-low)', textTransform: 'uppercase' }}>{screenLabel(screen)} — full suite</div>
          <div className="m-screen" data-desk="true" style={{ padding: 14 }}><FullFn /></div>
        </div>
      </>
    );
  }

  return (
    <div className="m-app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0
      }}>
        <button onClick={() => setDrawer(true)} aria-label="Menu" title="Menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, width: 30, height: 30 }}>
          <span style={{ height: 2, width: 19, borderRadius: 2, background: 'var(--text-high)' }} />
          <span style={{ height: 2, width: 19, borderRadius: 2, background: 'var(--text-high)' }} />
          <span style={{ height: 2, width: 19, borderRadius: 2, background: 'var(--text-high)' }} />
        </button>
        <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 24 }} />
        <div style={{ flex: 1 }} />
        <button onClick={() => nav('shieldtech-ai')} title="ShieldTech AI" style={{ background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="hermes" size={15} color="var(--brand)" />
        </button>
        <MAvatarMenu onNav={nav} />
      </header>

      {/* Content */}
      <div className="m-screen" data-desk={Boolean(fullBase) || !(M_NATIVE_IDS.includes(screen) || !!M_NATIVE[screen])} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 14 }}>
        {content}
      </div>

      {/* Bottom tabs */}
      <nav onPointerDown={startLP} onPointerUp={cancelLP} onPointerLeave={cancelLP} onPointerCancel={cancelLP} style={{
        display: 'flex', borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
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

Object.assign(window, { MobilePortalApp, MobileAgendaView, MobileDirectory, M_NATIVE, M_SCREEN_MAP, M_TABS, screenLabel, M_AGENDA_TYPES, M_TECH_COLORS, mFmtH });

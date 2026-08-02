/* Workspace hubs — the approved 77→20 consolidation.
   Each hub folds the surviving MERGE screens into its KEEP screen as quiet
   top tabs, so nothing real was lost while the sidebar collapsed to five
   workspaces. Deep links to a merged id land on its hub with that tab open. */

function HubTabs({ tabs, initial }) {
  const [tab, setTab] = React.useState(initial && tabs.some(t => t.id === initial) ? initial : tabs[0].id);
  const active = tabs.find(t => t.id === tab) || tabs[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', marginBottom: 14, flexShrink: 0, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 18px', fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
            background: 'transparent', border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
            color: tab === t.id ? 'var(--brand)' : 'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <active.C key={active.id} />
      </div>
    </div>
  );
}

/* The screen the router asked for decides the initial tab. */
const hubInitial = () => (window.__hubScreenId || null);

/* SELL — Bid Board is the engine; Auto-Bid and Secret Weapon are its views. */
function SellHubScreen() {
  return <HubTabs initial={{ autobid: 'autobid', 'secret-weapon': 'board' }[hubInitial()] || 'board'} tabs={[
    { id: 'board', label: 'Bid Board', C: window.BidBoardScreen },
    { id: 'autobid', label: 'Auto-Bid', C: window.AutoBidScreen },
  ]} />;
}

/* DELIVER — work orders own their evidence (photos, punch lists). */
function WorkOrderHubScreen() {
  return <HubTabs initial={{ photos: 'photos', punchlist: 'punch' }[hubInitial()] || 'wo'} tabs={[
    { id: 'wo', label: 'Work Orders', C: window.WorkOrderScreen },
    { id: 'photos', label: 'Site Photos', C: window.SitePhotosScreen },
    { id: 'punch', label: 'Punch Lists', C: window.PunchListScreen },
  ]} />;
}

/* DELIVER — the copilot schedules onto the calendar's own store. */
function CalendarHubScreen() {
  return <HubTabs initial={hubInitial() === 'copilot' ? 'copilot' : 'cal'} tabs={[
    { id: 'cal', label: 'Calendar', C: window.CalendarScreen },
    { id: 'copilot', label: 'Scheduling Copilot', C: window.SchedCopilotScreen },
  ]} />;
}

/* CARE — the console plus the asset inventory it monitors. */
function MonitoringHubScreen() {
  return <HubTabs initial={hubInitial() === 'assets' ? 'assets' : 'console'} tabs={[
    { id: 'console', label: 'Monitoring Console', C: window.MonitoringConsole },
    { id: 'assets', label: 'Assets', C: window.AssetsScreen },
  ]} />;
}

/* CARE — an incident is a P1 ticket. */
function HelpdeskHubScreen() {
  return <HubTabs initial={hubInitial() === 'incidents' ? 'incidents' : 'tickets'} tabs={[
    { id: 'tickets', label: 'Help Desk', C: window.HelpdeskScreen },
    { id: 'incidents', label: 'Incidents', C: window.IncidentScreen },
  ]} />;
}

/* COLLECT — purchasing: POs and the requisitions that precede them. */
function PurchasingHubScreen() {
  return <HubTabs initial={hubInitial() === 'parts-req' ? 'req' : 'pos'} tabs={[
    { id: 'pos', label: 'Purchase Orders', C: window.PurchaseOrdersScreen },
    { id: 'req', label: 'Parts Requisitions', C: window.PartsReqScreen },
  ]} />;
}

/* ADMIN — the team and its skills matrix. */
function TeamHubScreen() {
  return <HubTabs initial={hubInitial() === 'skills' ? 'skills' : 'team'} tabs={[
    { id: 'team', label: 'Team', C: window.TeamScreenPlus },
    { id: 'skills', label: 'Skills Matrix', C: window.SkillsMatrixScreen },
  ]} />;
}

/* COLLECT — one recurring-revenue home. */
function RevenueHubScreen() {
  return <HubTabs initial={hubInitial() === 'rr-builder' ? 'builder' : 'mrr'} tabs={[
    { id: 'mrr', label: 'Recurring Revenue', C: window.MRRScreen },
    { id: 'builder', label: 'RR Builder', C: window.RRBuilderScreen },
  ]} />;
}

/* ADMIN — one approval queue: general approvals, timesheets, expenses+receipts. */
function ApprovalsHubScreen() {
  return <HubTabs initial={{ timesheets: 'time', expenses: 'exp' }[hubInitial()] || 'appr'} tabs={[
    { id: 'appr', label: 'Approvals', C: window.ApprovalsScreen },
    { id: 'time', label: 'Timesheets', C: window.TimesheetApprovalScreen },
    { id: 'exp', label: 'Expenses & Receipts', C: window.ExpenseApprovalScreen },
  ]} />;
}

Object.assign(window, {
  HubTabs, SellHubScreen, WorkOrderHubScreen, CalendarHubScreen, MonitoringHubScreen,
  HelpdeskHubScreen, PurchasingHubScreen, TeamHubScreen, RevenueHubScreen, ApprovalsHubScreen,
});

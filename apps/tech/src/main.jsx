/* ShieldTech Technician App — entry.
   Ports the inline TechApp shell from the prototype's "Technician App.html" verbatim
   (Hermes → ShieldTech AI renames, env-configured sibling app links). */
import '@shared/globals.js';

import '@fontsource/montserrat/200.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/ibm-plex-sans/300.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

import '@shared/styles/styles.css';
import '@shared/styles/mobile.css';
import '@shared/styles/viewport-lock.css';
import '@shared/supabase.js';
import '@shared/auth.js';
import '@shared/ai.js';
import '@shared/time.js';
import '@shared/proto-manifest-tech.js';

const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState } = React;

requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    document.documentElement.classList.add('anim-ready');
  });
});

const DEV = import.meta.env.DEV;
window.__shieldAppUrls = {
  portal: import.meta.env.VITE_PORTAL_APP_URL || (DEV ? 'http://localhost:4170' : 'https://portal.shieldtechsolutions.com'),
  customer: import.meta.env.VITE_CUSTOMER_APP_URL || (DEV ? 'http://localhost:4172' : 'https://customer.shieldtechsolutions.com'),
};

const TWEAK_DEFAULTS = {
  "view": "today"
};

/* Extended shell with 7 tabs */
function TechShellV2({ tab, setTab, children }) {
  const tabs = [
  { id: 'today', icon: 'grid-2', label: 'Today' },
  { id: 'photos', icon: 'cameras', label: 'Photos' },
  { id: 'time', icon: 'timesheets', label: 'Time' },
  { id: 'assets', icon: 'assets', label: 'Assets' },
  { id: 'expenses', icon: 'receipt', label: 'Expenses' },
  { id: 'ai', icon: 'hermes', label: 'AI' },
  { id: 'more', icon: 'settings', label: 'More' }];


  return (
    <div className="m-app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
          {/* Top bar */}
          <header style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', flexShrink: 0
      }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="uploads/ShieldTech Emblem Transparent MK1 .png" alt="ShieldTech" style={{ height: 22 }} />
              <span className="display" style={{ fontSize: 12, fontWeight: 300, letterSpacing: '0.08em', color: 'var(--text-high)' }}>SHIELDTECH</span>
              <span style={{ fontSize: 10, color: 'var(--text-low)', marginLeft: 4 }}>Tech</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 100,
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)'
          }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-ok)', animation: 'pulse-online 3s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, color: 'var(--status-ok)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>On Duty</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{(window.__shieldUser && window.__shieldUser.initials) || '·'}</div>
            </div>
          </header>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>{children}</div>

          <nav style={{
        display: 'flex', borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.95)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}>
            {tabs.map((t) =>
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          flex: 1, padding: '8px 0 6px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 2, background: 'none', border: 'none',
          color: tab === t.id ? 'var(--brand)' : 'var(--text-low)',
          cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 0.15s', position: 'relative'
        }}>
                {tab === t.id && <div style={{ position: 'absolute', top: -1, left: '30%', right: '30%', height: 2, background: 'var(--brand)', borderRadius: '0 0 2px 2px', boxShadow: '0 0 8px var(--brand)' }} />}
                <Icon name={t.icon} size={18} color={tab === t.id ? 'var(--brand)' : 'var(--text-low)'} />
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}>{t.label}</span>
              </button>
        )}
          </nav>
        </div>);

}

/* More sub-menu */
function MoreMenu({ setTab }) {
  const items = [
  { id: 'route', label: 'My Route', icon: 'dispatch', desc: 'Smart day plan · traffic-aware' },
  { id: 'voice', label: 'Voice Notes', icon: 'chat', desc: 'Dictate → auto work-order' },
  { id: 'scanner', label: 'Model Scanner', icon: 'cam-dome', desc: 'Scan stickers → specs & manuals' },
  { id: 'ar', label: 'AR Wire-Mapper', icon: 'topology', desc: 'Tag ports & cable runs' },
  { id: 'upsell', label: 'Upsell Spotter', icon: 'roi', desc: 'AI-spotted quote opportunities' },
  { id: 'safety', label: 'Lone-Worker Safety', icon: 'warning-tri', desc: 'Check-in timer & man-down' },
  { id: 'skills', label: 'Skill Tree', icon: 'certs', desc: 'Certs, XP & leaderboard' },
  { id: 'toolbox', label: 'Toolbox Talk', icon: 'compliance', desc: 'Daily safety briefing' },
  { id: 'sync', label: 'Sync Queue', icon: 'statuspage', desc: 'Offline capture status' },
  { id: 'photos', label: 'Site Photos', icon: 'cameras', desc: 'Capture & job documentation' },
  { id: 'punch', label: 'My Punch List', icon: 'approvals', desc: 'Assigned fix-it items' },
  { id: 'truck', label: 'My Truck', icon: 'inventory', desc: 'Van stock — auto restock' },
  { id: 'vehicle', label: 'Vehicle Inspection', icon: 'vehicle', desc: 'Daily pre-trip checklist' },
  { id: 'parts', label: 'Parts Request', icon: 'package', desc: 'Request parts from warehouse' },
  { id: 'resources', label: 'Resources', icon: 'pricebook', desc: 'Guides, diagrams, SOPs' },
  { id: 'jobs', label: 'All Jobs', icon: 'clipboard', desc: 'Full job history' }];

  const appUrls = window.__shieldAppUrls || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>More</div>
          {items.map((item, i) =>
      <button key={i} onClick={() => setTab(item.id)} className="glass" style={{
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        border: '1px solid var(--border-subtle)', cursor: 'pointer',
        background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)',
        textAlign: 'left', fontFamily: 'var(--font-body)', width: '100%'
      }}>
              <Icon name={item.icon} size={22} color="var(--brand)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{item.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-low)' }}>›</span>
            </button>
      )}
          {/* Links to other apps */}
          <div style={{ marginTop: 12, padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>OTHER APPS</div>
            <a href={appUrls.portal || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}>
              <ShieldLogo size={18} /> Open Owner Portal →
            </a>
            <a href={appUrls.customer || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}>
              <ShieldLogo size={18} /> Open Customer Portal →
            </a>
          </div>
        </div>);

}

/* Shared back-button wrapper for More sub-views */
function BackWrap({ setTab, children }) {
  return (
    <React.Fragment>
      <button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button>
      {children}
    </React.Fragment>
  );
}

function TechApp() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [selectedJob, setSelectedJob] = useState(null);
  const rawTab = t.view || 'today';
  // job-detail needs a selected job; fall back to today on fresh load
  const tab = rawTab === 'job-detail' && !selectedJob ? 'today' : rawTab;
  const setTab = (v) => setTweak('view', v);

  const views = {
    today: () => <TodayView setTab={setTab} setSelectedJob={setSelectedJob} />,
    photos: () => <TechPhotosView setTab={setTab} />,
    capture: () => <TechCaptureView setTab={setTab} />,
    punch: () => <React.Fragment><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button><TechPunchView setTab={setTab} /></React.Fragment>,
    truck: () => <React.Fragment><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button><TechTruckView /></React.Fragment>,
    'job-detail': () => <JobDetailView job={selectedJob} setTab={setTab} />,
    time: () => <TimeViewV2 />,
    assets: () => <TechAssetsView />,
    expenses: () => <ExpenseView />,
    ai: () => <TechCopilotView />,
    route: () => <BackWrap setTab={setTab}><TechRouteView /></BackWrap>,
    voice: () => <BackWrap setTab={setTab}><TechVoiceView /></BackWrap>,
    scanner: () => <BackWrap setTab={setTab}><TechScannerView /></BackWrap>,
    ar: () => <BackWrap setTab={setTab}><TechARView /></BackWrap>,
    sync: () => <BackWrap setTab={setTab}><TechSyncView /></BackWrap>,
    upsell: () => <BackWrap setTab={setTab}><TechUpsellView /></BackWrap>,
    safety: () => <BackWrap setTab={setTab}><TechSafetyView /></BackWrap>,
    skills: () => <BackWrap setTab={setTab}><TechSkillTreeView /></BackWrap>,
    toolbox: () => <BackWrap setTab={setTab}><TechToolboxView /></BackWrap>,
    more: () => <MoreMenu setTab={setTab} />,
    vehicle: () => <React.Fragment><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button><VehicleInspectionView /></React.Fragment>,
    parts: () => <React.Fragment><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button><PartsRequestView /></React.Fragment>,
    resources: () => <React.Fragment><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button><ResourcesView /></React.Fragment>,
    jobs: () => <React.Fragment><button onClick={() => setTab('more')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, marginBottom: 12 }}>← Back</button><TodayView setTab={setTab} setSelectedJob={setSelectedJob} /></React.Fragment>
  };

  const ViewFn = views[tab] || views.today;
  const mainTab = ['today', 'photos', 'time', 'assets', 'expenses', 'ai', 'more'].includes(tab) ? tab : tab === 'capture' ? 'photos' : ['vehicle', 'parts', 'resources', 'jobs', 'punch', 'truck', 'route', 'voice', 'scanner', 'ar', 'sync', 'upsell', 'safety', 'skills', 'toolbox'].includes(tab) ? 'more' : 'today';

  const { TweaksPanel, TweakSection, TweakSelect, ShieldToastHost } = window;

  return (
    <TechShellV2 tab={mainTab} setTab={setTab}>
          <ViewFn />
          {tab !== 'capture' && ['today', 'photos'].includes(mainTab) && (
            <button onClick={() => setTab('capture')} title="Open camera" style={{
              position: 'fixed', bottom: 76, right: 'max(16px, calc(50% - 199px))',
              width: 54, height: 54, borderRadius: '50%', zIndex: 500,
              background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(63,169,245,0.45)'
            }}>
              <Icon name="cameras" size={22} color="#fff" />
            </button>
          )}
          <TweaksPanel>
            <TweakSection label="Navigation" />
            <TweakSelect label="Tab" value={tab}
        options={['today', 'photos', 'capture', 'punch', 'truck', 'route', 'voice', 'scanner', 'ar', 'sync', 'upsell', 'safety', 'skills', 'toolbox', 'job-detail', 'time', 'expenses', 'ai', 'more', 'vehicle', 'parts', 'resources']}
        onChange={(v) => setTab(v)} />
          </TweaksPanel>
          <ShieldToastHost />
        </TechShellV2>);

}

const ShieldAuthGate = window.ShieldAuthGate;
ReactDOM.createRoot(document.getElementById('root')).render(
  <ShieldAuthGate appId="tech"><TechApp /></ShieldAuthGate>
);

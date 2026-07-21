/* ShieldTech Customer Portal — entry.
   Ports the inline CustomerPortalApp shell from the prototype's "Customer Portal.html"
   verbatim (blank-canvas data, Hermes → ShieldTech AI renames, env-configured links). */
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
import '@shared/supabase.js';
import '@shared/auth.js';
import '@shared/ai.js';
import '@shared/proto-manifest-customer.js';

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
};

const TWEAK_DEFAULTS = {
  "tab": "dashboard"
};

/* ── Customer Nav Tabs ── */
const CUST_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'score', label: 'Security Score', icon: '◎' },
  { id: 'sites', label: 'Sites', icon: '⬢' },
  { id: 'devices', label: 'Devices', icon: '⬡' },
  { id: 'photos', label: 'Photos', icon: '▣' },
  { id: 'footage', label: 'Footage', icon: '▸' },
  { id: 'access', label: 'Access', icon: '⎇' },
  { id: 'tickets', label: 'Tickets', icon: '☰' },
  { id: 'approvals', label: 'Approvals', icon: '✓' },
  { id: 'invoices', label: 'Invoices', icon: '⊞' },
  { id: 'planner', label: 'Planner', icon: '⫼' },
  { id: 'compliance', label: 'Compliance', icon: '⧉' },
  { id: 'drill', label: 'Drill', icon: '⏱' },
  { id: 'claims', label: 'Claims', icon: '⛨' },
  { id: 'remote', label: 'Remote', icon: '⊙' },
  { id: 'ai', label: 'Concierge', icon: '⟡' },
  { id: 'reports', label: 'Reports', icon: '◈' },
];

/* ── Device Status Screen ── */
function CustomerDevicesScreen() {
  const devices = [];
  const online = devices.filter(d => d.status === 'online').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatCard label="ONLINE" value={`${online} / ${devices.length}`} mono={false} delay={0} />
        <StatCard label="CAMERAS" value={devices.filter(d => d.type === 'Camera').length} delay={80} />
        <StatCard label="ACCESS POINTS" value={devices.filter(d => d.type === 'Access').length} delay={160} />
        <StatCard label="30-DAY UPTIME" value="—" mono={false} delay={240} />
      </div>
      <GlassPanel style={{ padding: 0 }}>
        {devices.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No devices yet — your installed cameras, access points, alarm panels and recorders appear here with live status.</div>}
        {devices.length > 0 && <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Device','Location','Type','Status','Uptime','Last Seen'].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={i} style={{ transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500 }}>{d.name}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{d.location}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{d.type}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={d.status} /></td>
                <td className="mono" style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{d.uptime}</td>
                <td className="mono" style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{d.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </GlassPanel>
    </div>
  );
}

/* ── Customer Invoice Screen ── */
function CustomerInvoicesScreen() {
  const invoices = [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatCard label="OUTSTANDING" value="$0" mono={false} delay={0} />
        <StatCard label="PAID (YTD)" value="$0" mono={false} delay={80} />
        <StatCard label="NEXT DUE" value="—" mono={false} delay={160} />
      </div>
      <GlassPanel style={{ padding: 0 }}>
        {invoices.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No invoices yet.</div>}
        {invoices.map((inv, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
            borderBottom: '1px solid rgba(63,169,245,0.05)',
            cursor: 'pointer', transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{inv.num}</span>
                <StatusBadge status={inv.status} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{inv.desc}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>
                Due: {inv.due}{inv.paidDate ? ` · Paid: ${inv.paidDate}` : ''}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-high)' }}>${inv.amount.toLocaleString()}</div>
            {inv.status === 'pending' && (
              <button onClick={() => shieldModal({ kind: 'form', title: 'Pay Invoice', subtitle: `${inv.num} · $${inv.amount.toLocaleString()} due`, submitLabel: `Pay $${inv.amount.toLocaleString()}`, successMsg: `Payment of $${inv.amount.toLocaleString()} submitted`, fields: [
                { key: 'name', label: 'Cardholder Name', placeholder: 'Name on card', required: true, full: true },
                { key: 'card', label: 'Card Number', placeholder: '4242 4242 4242 4242', required: true, full: true },
                { key: 'exp', label: 'Expiry', placeholder: 'MM/YY', required: true },
                { key: 'cvc', label: 'CVC', placeholder: '123', required: true },
                { key: 'method', label: 'Method', type: 'select', options: ['Credit Card','ACH Bank Transfer'] }
              ] })} style={{
                padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                boxShadow: '0 0 12px -4px rgba(63,169,245,0.3)'
              }}>Pay Now</button>
            )}
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

/* ── Customer Reports ── */
function CustomerReportsScreen() {
  const reports = [];

  return (
    <div>
      <h2 className="display" style={{ fontSize: 20, fontWeight: 300, marginBottom: 16 }}>Reports & Documents</h2>
      <GlassPanel>
        {reports.length === 0 && <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No reports yet — monthly health reports, incident reports and reviews are published here.</div>}
        {reports.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
            borderBottom: i < reports.length - 1 ? '1px solid rgba(63,169,245,0.05)' : 'none',
            cursor: 'pointer'
          }}>
            <Icon name={r.type === 'Health' ? 'reports' : r.type === 'Incident' ? 'warning-tri' : r.type === 'Review' ? 'clipboard' : 'compliance'} size={18} color="var(--text-mid)" style={{ opacity: 0.7, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.date} · {r.pages} pages</div>
            </div>
            <button onClick={() => shieldModal({ kind: 'doc', title: r.title, docTitle: r.title, meta: `${r.date} · ${r.pages} pages`, downloadLabel: 'Download PDF', downloadMsg: `${r.title} downloaded`, paragraphs: [
              'This report was prepared for your records by ShieldTech Security.',
              { k: 'Date', v: r.date },
              { k: 'Pages', v: String(r.pages) },
              'The full document includes detailed findings, photos, and recommendations. Use Download to save a copy.'
            ] })} style={{
              padding: '4px 12px', background: 'rgba(63,169,245,0.06)',
              border: '1px solid var(--border-subtle)', borderRadius: 4,
              color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>View PDF</button>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

/* ── Customer Photos Screen (work documentation from ShieldTech techs) ── */
function CustomerPhotosScreen() {
  const [photos] = useShieldStore(photoStore);
  const [lightbox, setLightbox] = useState(null);
  const mine = photos;
  const pairs = completePairs(mine);
  const visits = [...new Set(mine.map(p => p.wo))].length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatCard label="WORK PHOTOS" value={mine.length} delay={0} />
        <StatCard label="DOCUMENTED VISITS" value={visits} delay={80} />
        <StatCard label="BEFORE / AFTER" value={pairs.length} delay={160} />
      </div>

      {pairs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: 18, fontWeight: 300, marginBottom: 12 }}>Before &amp; After</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
            {pairs.map(pair => (
              <GlassPanel key={pair.id} style={{ padding: 14 }}>
                <BeforeAfterSlider before={pair.before} after={pair.after} caption={pair.after.label} />
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>{pair.before.techName} · {pair.after.day} · drag the handle to compare</div>
              </GlassPanel>
            ))}
          </div>
        </div>
      )}

      <h2 className="display" style={{ fontSize: 18, fontWeight: 300, marginBottom: 12 }}>All Work Photos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
        {mine.map(p => <PhotoCard key={p.id} photo={p} onClick={() => setLightbox(p.id)} />)}
      </div>
      {mine.length === 0 && <GlassPanel style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No work photos yet</GlassPanel>}

      {lightbox && <PhotoLightbox photoId={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ── Main App ── */
function CustomerPortalApp() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const tab = t.tab || 'dashboard';
  const setTab = (v) => setTweak('tab', v);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const screens = {
    dashboard: () => <CustomerDashboardView onNavigate={setTab} />,
    score: () => <CustSecurityScoreView />,
    sites: () => <CustSitesView />,
    devices: () => <CustomerDevicesScreen />,
    photos: () => <CustomerPhotosScreen />,
    footage: () => <CustFootageFinderView />,
    access: () => <CustAccessView />,
    tickets: () => <TicketListView onNavigate={setTab} selectedTicket={selectedTicket} setSelectedTicket={setSelectedTicket} />,
    'new-ticket': () => <NewTicketView onNavigate={setTab} />,
    approvals: () => <CustApprovalsInboxView />,
    invoices: () => <CustomerInvoicesScreen />,
    planner: () => <CustBudgetPlannerView />,
    compliance: () => <CustComplianceVaultView />,
    drill: () => <CustDrillView />,
    claims: () => <CustClaimPackView />,
    remote: () => <RemoteSessionView />,
    ai: () => <CustConciergeView />,
    reports: () => <CustomerReportsScreen />,
  };

  const Screen = screens[tab] || screens.dashboard;
  const activeTab = ['new-ticket'].includes(tab) ? 'tickets' : tab;

  const { TweaksPanel, TweakSection, TweakSelect, ShieldToastHost } = window;
  const me = window.__shieldUser || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
      {/* Header */}
      <header style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 26, objectFit: 'contain' }} />
          <span style={{ color: 'var(--text-low)', margin: '0 4px' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>Customer Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1E6FB0, #3FA9F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>{me.initials || '·'}</div>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 32px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.6)', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'thin'
      }}>
        {CUST_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--brand)' : 'var(--text-low)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'all 0.15s', fontWeight: activeTab === t.id ? 500 : 400
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Screen />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '8px 32px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 10, color: 'var(--text-low)', flexShrink: 0
      }}>
        <span>{me.company || 'ShieldTech customer'}</span>
        <span>ShieldTech Unified Portal · ShieldTech AI {window.__shieldAIModel ? 'Online' : 'not configured'}</span>
      </footer>

      <TweaksPanel>
        <TweakSection label="Navigation" />
        <TweakSelect label="Tab" value={tab}
          options={['dashboard','score','sites','devices','photos','footage','access','tickets','new-ticket','approvals','invoices','planner','compliance','drill','claims','remote','ai','reports']}
          onChange={(v) => setTab(v)} />
      </TweaksPanel>
      <ShieldToastHost />
    </div>
  );
}

const ShieldAuthGate = window.ShieldAuthGate;
ReactDOM.createRoot(document.getElementById('root')).render(
  <ShieldAuthGate appId="customer"><CustomerPortalApp /></ShieldAuthGate>
);

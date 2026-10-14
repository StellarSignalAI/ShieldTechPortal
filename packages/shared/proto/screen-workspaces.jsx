/* Workspaces — the second level of the menu, inside the screen.

   The rail lists seven workspaces (shell.jsx NAV_WORKSPACES). Each of Sell,
   Work, Money, Customers and Team is this one component: a quiet tab strip
   across the top and the chosen screen underneath, filling the content area.
   Tabs are real screen ids, so the URL hash, deep links, the rail highlight and
   the "Jump to…" search all keep working; a legacy id (photos, incidents,
   rr-builder…) lands on the tab that owns it and that screen opens its own
   matching page. Home and Systems are single screens and need no strip. */

function Workspace({ wsId, screenId }) {
  const ws = NAV_WORKSPACES.find(w => w.id === wsId);
  const tabs = ws ? ws.tabs : [];
  const resolve = (id) => wsTabFor(ws, id || window.__hubScreenId || ws.screen) || tabs[0];
  const [tab, setTab] = React.useState(() => resolve(screenId));
  const isMobile = window.useUcMobile ? window.useUcMobile(820) : false;

  /* A legacy id carries the page inside the tab (photos → Work Orders › Site
     photos, invoices → Finance › Invoices): hand it to that screen before it
     mounts, the same way the sidebar children used to. */
  const steer = (id) => {
    const legacy = NAV_LEGACY_IDS[id];
    if (!legacy) return;
    const [owner, sub] = legacy;
    if (owner === 'finance') window.__qboParams = { ...(window.__qboParams || {}), financeTab: sub };
    if (window.navSubSet) window.navSubSet(owner, sub, 'nav');
  };
  React.useEffect(() => { steer(screenId); setTab(resolve(screenId)); }, [screenId]);

  const go = (t) => { if (t === tab) return; setTab(t); if (window.__shieldNav) window.__shieldNav(t.screen); };
  const active = tab || tabs[0];
  const C = active && window[active.component];

  return (
    <div data-screen-label={ws ? ws.label : 'Workspace'} style={{ display: 'flex', flexDirection: 'column', height: isMobile ? '100%' : 'calc(100vh - 76px)', margin: isMobile ? 0 : '-4px 0 0', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, padding: isMobile ? '8px 12px 6px' : '0 0 10px', overflowX: 'auto' }}>
        <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 9 }}>
          {tabs.map(t => {
            const on = active && t.screen === active.screen;
            return (
              <button key={t.screen} onClick={() => go(t)} style={{ padding: isMobile ? '7px 12px' : '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', background: on ? 'rgba(var(--brand-rgb),0.14)' : 'transparent', color: on ? 'var(--brand)' : 'var(--text-mid)', transition: 'background 0.12s, color 0.12s' }}>{t.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', '--uf-h': '100%', '--uf-m': '0' }}>
        {C ? <C key={active.screen} /> : <div style={{ padding: 32, color: 'var(--text-low)', fontSize: 13 }}>“{active ? active.label : wsId}” is not available in this build.</div>}
      </div>
    </div>
  );
}

function SellWorkspace({ screenId }) { return <Workspace wsId="sell" screenId={screenId} />; }
function WorkWorkspace({ screenId }) { return <Workspace wsId="work" screenId={screenId} />; }
function MoneyWorkspace({ screenId }) { return <Workspace wsId="money" screenId={screenId} />; }
function CustomersWorkspace({ screenId }) { return <Workspace wsId="customers" screenId={screenId} />; }
function TeamWorkspace({ screenId }) { return <Workspace wsId="team" screenId={screenId} />; }

Object.assign(window, { Workspace, SellWorkspace, WorkWorkspace, MoneyWorkspace, CustomersWorkspace, TeamWorkspace });

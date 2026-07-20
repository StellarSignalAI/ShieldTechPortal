// ============================================================
// Portal screen — Bid Board + guided Bid Room
// Replaces the Pipeline/CRM screen. Wraps the Secret Weapon
// bid engine (sw/sw-bidroom*, sw/sw-bidboard) inside the
// portal shell, resolving the two global-name collisions:
//   Icon      → merged dispatcher (portal set wins on shared names)
//   Segmented → restored to the portal version
// Loaded AFTER the sw/ scripts in ShieldTech Portal.html.
// ============================================================

const __swIcon = window.Icon; // Secret Weapon Icon (just loaded)
const __swOnlyIconNames = new Set([
  'shield', 'checkCircle', 'x', 'clock', 'snooze', 'mapPin', 'map', 'grid', 'chevL', 'chevR', 'chevD',
  'arrowR', 'sparkles', 'bell', 'target', 'doc', 'building', 'user', 'users', 'plus', 'send', 'message',
  'route', 'alert', 'lock', 'refresh', 'play', 'back',
]);
function MergedIcon(props) {
  const Cmp = (__swOnlyIconNames.has(props.name) || !window.__portalIcon) ? __swIcon : window.__portalIcon;
  return <Cmp {...props} />;
}
window.Icon = MergedIcon;
if (window.__portalSegmented) window.Segmented = window.__portalSegmented;

/* Toast host for sw:toast events (the SW app shell isn't loaded here) */
function BidToastHost() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const h = (e) => {
      const id = Date.now() + Math.random();
      setToasts(p => [...p.slice(-3), { id, ...e.detail }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
    };
    window.addEventListener('sw:toast', h);
    return () => window.removeEventListener('sw:toast', h);
  }, []);
  const c = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', info: 'var(--brand)', error: 'var(--status-critical)' };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 22, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 15px', borderRadius: 10, minWidth: 230, maxWidth: 340, background: 'var(--modal)', border: `1px solid ${c[t.type] || 'var(--border-strong)'}`, boxShadow: '0 12px 32px -10px rgba(0,0,0,0.7)', font: '500 12.5px/1.4 var(--font-body)', color: 'var(--text-high)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c[t.type] || 'var(--brand)', flexShrink: 0 }} />{t.msg}
        </div>
      ))}
    </div>
  );
}

function BidBoardScreen() {
  const [oppId, setOppId] = React.useState(null);
  return (
    <div data-screen-label="Bid Board (Portal)">
      <BidBoardWorkspace onOpenOpp={setOppId} />
      {oppId && <BidRoom oppId={oppId} onClose={() => setOppId(null)} />}
      <BidToastHost />
    </div>
  );
}

Object.assign(window, { BidBoardScreen, BidToastHost });

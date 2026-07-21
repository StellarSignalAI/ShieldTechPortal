/* ShieldTech Mobile — UI kit (mobile-first primitives) */

function MStat({ label, value, accent, sub, delay = 0 }) {
  return (
    <div className="glass" style={{ padding: '12px 14px', borderRadius: 12, animation: `fade-up 0.3s ease ${delay}ms both` }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--text-low)', marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: accent || 'var(--text-high)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MSection({ title, action, onAction, children, style }) {
  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.11em', color: 'var(--text-low)', textTransform: 'uppercase' }}>{title}</span>
        {action && <button onClick={onAction} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>{action} ›</button>}
      </div>
      {children}
    </div>
  );
}

function MRow({ icon, iconColor, title, sub, right, rightSub, onClick, accent }) {
  return (
    <div onClick={onClick} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 12, cursor: onClick ? 'pointer' : 'default', borderLeft: accent ? `3px solid ${accent}` : undefined, marginBottom: 7 }}>
      {icon && <Icon name={icon} size={18} color={iconColor || 'var(--brand)'} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {right && <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{right}</div>}
        {rightSub && <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{rightSub}</div>}
      </div>
      {onClick && <span style={{ color: 'var(--text-low)', fontSize: 14 }}>›</span>}
    </div>
  );
}

function MBadge({ children, color = 'var(--brand)' }) {
  return <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color, background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`, borderRadius: 9, padding: '2px 8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</span>;
}

function MSegment({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'rgba(63,169,245,0.06)', borderRadius: 10, padding: 3, border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ flex: 1, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', background: value === o ? 'rgba(63,169,245,0.18)' : 'transparent', color: value === o ? 'var(--brand)' : 'var(--text-low)', transition: 'all 0.15s' }}>{o}</button>
      ))}
    </div>
  );
}

function MBar({ pct, color }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 2, background: color || (pct > 90 ? 'var(--status-critical)' : pct > 70 ? 'var(--status-warn)' : 'var(--brand)'), transition: 'width 0.4s' }}></div>
    </div>
  );
}

function MSpark({ data, color = 'var(--brand)', w = 64, h = 22 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(' ');
  return <svg width={w} height={h} style={{ display: 'block' }}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

/* Bottom sheet */
function MSheet({ title, onClose, children }) {
  /* Portaled to <body>: ancestor transforms/filters and the screen's scroll
     container can otherwise trap the fixed sheet UNDER the bottom tab bar,
     cutting off the last fields and the primary button. Safe-area padding
     keeps the CTA above the iOS home indicator / Android gesture bar. */
  const sheet = (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 4000, backdropFilter: 'blur(3px)' }}></div>
      <div style={{ position: 'fixed', left: 0, right: 0, margin: '0 auto', bottom: 0, width: '100%', maxWidth: 430, maxHeight: '86dvh', zIndex: 4001, background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderBottom: 'none', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column', animation: 'fade-up 0.22s ease both', boxShadow: '0 -16px 50px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.3)', margin: '0 auto 10px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 19, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '0 18px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>{children}</div>
      </div>
    </>
  );
  return (window.ReactDOM && window.ReactDOM.createPortal) ? window.ReactDOM.createPortal(sheet, document.body) : sheet;
}

function MActionBtn({ label, icon, onClick, primary }) {
  return (
    <button onClick={onClick} className={primary ? '' : 'glass'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '13px 4px 11px', borderRadius: 13, border: primary ? 'none' : '1px solid var(--border-subtle)', background: primary ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'var(--glass-bg)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
      <Icon name={icon} size={19} color={primary ? '#fff' : 'var(--brand)'} />
      <span style={{ fontSize: 9.5, fontWeight: 600, color: primary ? '#fff' : 'var(--text-mid)' }}>{label}</span>
    </button>
  );
}

Object.assign(window, { MStat, MSection, MRow, MBadge, MSegment, MBar, MSpark, MSheet, MActionBtn });

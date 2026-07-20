// ============================================================
// ShieldTech Secret Weapon — UI primitives (portal tokens)
// Self-contained so the focus mode never breaks if portal
// internals change. All color/spacing via styles.css vars.
// ============================================================
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

/* ─────────── Icon — monoline 16px glyphs ─────────── */
function Icon({ name, size = 16, color = 'currentColor', style = {} }) {
  const P = {
    shield: 'M8 1.5l5 2v4c0 3.2-2.4 5.6-5 6.5-2.6-.9-5-3.3-5-6.5v-4z',
    check: 'M3 8.5l3 3 6.5-7',
    checkCircle: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM5 8l2 2 4-4.5',
    x: 'M4 4l8 8M12 4l-8 8',
    phone: 'M3 3c0 5 5 10 10 10l-.5-3-3-.5-1 1.5C6.5 11 5 9.5 4 7l1.5-1-.5-3z',
    calendar: 'M3 4h10v9H3zM3 6.5h10M5.5 2.5v2M10.5 2.5v2',
    clock: 'M8 2.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM8 5v3.2l2.2 1.3',
    snooze: 'M5 4h4l-4 5h4M8 2.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z',
    mapPin: 'M8 1.8c2.5 0 4.2 1.9 4.2 4.3 0 3-4.2 7.6-4.2 7.6S3.8 9.1 3.8 6.1C3.8 3.7 5.5 1.8 8 1.8zM8 4.6a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4z',
    map: 'M2 4l4-1.5L10 4l4-1.5v9L10 13 6 11.5 2 13zM6 2.5v9M10 4v9',
    list: 'M5 4h9M5 8h9M5 12h9M2.5 4h.01M2.5 8h.01M2.5 12h.01',
    grid: 'M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z',
    chevL: 'M10 3.5L5.5 8l4.5 4.5',
    chevR: 'M6 3.5L10.5 8 6 12.5',
    chevD: 'M3.5 6L8 10.5 12.5 6',
    arrowR: 'M3 8h9M9 5l3 3-3 3',
    sparkles: 'M8 1.5l1.3 3.2L12.5 6l-3.2 1.3L8 10.5 6.7 7.3 3.5 6l3.2-1.3zM12.5 10.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z',
    bell: 'M8 2a3.5 3.5 0 013.5 3.5v2.5l1.3 1.5H3.2L4.5 8V5.5A3.5 3.5 0 018 2zM6.5 12a1.5 1.5 0 003 0',
    bolt: 'M8.5 1.5l-4 6.5h3l-1 4.5 4.5-6.5h-3z',
    target: 'M8 2.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 7.5a.5.5 0 100 1 .5.5 0 000-1z',
    doc: 'M4 2h5l3 3v9H4zM9 2v3h3M6 8.5h4M6 11h4',
    building: 'M3 14V3h6v11M9 6h3v8M5 5.5h2M5 8h2M5 10.5h2M10.5 8.5h.01M10.5 11h.01',
    user: 'M8 8a2.7 2.7 0 100-5.4A2.7 2.7 0 008 8zM3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5',
    users: 'M6 7.5a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6zM1.5 13.5c0-2.4 2-3.8 4.5-3.8M11 6.5a2 2 0 100-4M11.5 9.8c1.8.2 3 1.5 3 3.4',
    pipeline: 'M2.5 3.5l3 4.5-3 4.5h9l-3-4.5 3-4.5z',
    settings: 'M8 5.8a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4zM8 1.5v1.6m0 9.8v1.6m4.6-9.8l-1.1 1.1M4.5 10.4l-1.1 1.1m9.2 0l-1.1-1.1M4.5 5.6L3.4 4.5M14.5 8H13M3 8H1.5',
    search: 'M7 2.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM10.5 10.5l3 3',
    plus: 'M8 3v10M3 8h10',
    send: 'M14 2L2 7l4.5 2L9 14l5-12zM6.5 9L14 2',
    message: 'M2.5 3.5h11v7h-7l-3 2.5v-2.5h-1z',
    route: 'M4 12.5a2 2 0 100-4 2 2 0 000 4zM12 7.5a2 2 0 100-4 2 2 0 000 4zM12 7.5v1c0 2-2 2-4 2s-4 0-4 2',
    dollar: 'M8 2v12M10.5 4.5C10 3.5 9 3 8 3 6.5 3 5.5 3.8 5.5 5S6.5 7 8 7s2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5',
    alert: 'M8 2l6 11H2zM8 6.5v3M8 11h.01',
    lock: 'M4.5 7V5.2a3.5 3.5 0 017 0V7M3.5 7h9v6h-9zM8 9.5v1.5',
    refresh: 'M13 8a5 5 0 11-1.5-3.6M13 2v3h-3',
    play: 'M5 3.5l7 4.5-7 4.5z',
    back: 'M6.5 3L2 8l4.5 5M2 8h11',
    flag: 'M4 2v12M4 3h7l-1.5 2.5L11 8H4',
    eye: 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 6a2 2 0 100 4 2 2 0 000-4z',
    link: 'M6.5 9.5l3-3M6 5l1-1a2.5 2.5 0 014 4l-1 1M10 11l-1 1a2.5 2.5 0 01-4-4l1-1',
  };
  const stroked = !['play'].includes(name);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={stroked ? 'none' : color}
      stroke={stroked ? color : 'none'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      <path d={P[name] || P.shield} />
    </svg>
  );
}

/* ─────────── Shield mark — official ShieldTech emblem ─────────── */
function ShieldMark({ size = 26 }) {
  return (
    <img src="sw/shieldtech-emblem.png" alt="ShieldTech" width={size} height={size}
      style={{ display: 'block', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(63,169,245,0.35))' }} />
  );
}

/* ─────────── Card / GlassCard ─────────── */
function Card({ children, style, className = '', hover, glow, onClick }) {
  return (
    <div onClick={onClick} className={(hover ? 'sw-hoverlift ' : '') + className} style={{
      background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
      boxShadow: glow ? 'var(--glow-brand-sm)' : '0 8px 28px -18px rgba(0,0,0,0.9)',
      cursor: onClick ? 'pointer' : undefined, ...style,
    }}>{children}</div>
  );
}
function GlassCard({ children, style, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--glass-bg)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(var(--glass-blur))', WebkitBackdropFilter: 'blur(var(--glass-blur))',
      boxShadow: '0 18px 50px -22px rgba(0,0,0,0.95)', ...style,
    }}>{children}</div>
  );
}

/* ─────────── Buttons ─────────── */
function Btn({ kind = 'primary', icon, iconR, children, onClick, disabled, full, size = 'md', style }) {
  const pad = size === 'sm' ? '7px 12px' : size === 'lg' ? '13px 22px' : '10px 16px';
  const fs = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;
  const kinds = {
    primary: { background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#03121F', border: '1px solid rgba(95,192,255,0.5)', boxShadow: '0 6px 18px -8px var(--brand)' },
    secondary: { background: 'rgba(63,169,245,0.06)', color: 'var(--text-high)', border: '1px solid var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--text-mid)', border: '1px solid transparent' },
    danger: { background: 'rgba(244,63,94,0.10)', color: 'var(--status-critical)', border: '1px solid rgba(244,63,94,0.35)' },
    success: { background: 'rgba(52,211,153,0.12)', color: 'var(--status-ok)', border: '1px solid rgba(52,211,153,0.4)' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: pad, borderRadius: 'var(--radius-md)', font: `600 ${fs}px/1 var(--font-body)`,
      letterSpacing: '0.01em', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
      width: full ? '100%' : undefined, transition: 'filter 0.15s ease, transform 0.1s ease', whiteSpace: 'nowrap',
      ...kinds[kind], ...style,
    }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      {icon && <Icon name={icon} size={size === 'lg' ? 17 : 15} />}
      {children}
      {iconR && <Icon name={iconR} size={size === 'lg' ? 17 : 15} />}
    </button>
  );
}
function IconBtn({ icon, onClick, label, active, size = 34, disabled }) {
  return (
    <button onClick={onClick} title={label} disabled={disabled} style={{
      width: size, height: size, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'rgba(63,169,245,0.14)' : 'rgba(63,169,245,0.05)',
      border: '1px solid ' + (active ? 'var(--border-strong)' : 'var(--border-subtle)'),
      color: active ? 'var(--brand)' : 'var(--text-mid)', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.14s ease', flexShrink: 0,
    }}><Icon name={icon} size={size > 30 ? 16 : 14} /></button>
  );
}

/* ─────────── Status / priority pills ─────────── */
const SW_STATUS_C = {
  Hot: { bg: 'rgba(244,63,94,0.12)', fg: '#FB7185', bd: 'rgba(244,63,94,0.34)' },
  Warm: { bg: 'rgba(251,191,36,0.12)', fg: '#FCD34D', bd: 'rgba(251,191,36,0.32)' },
  Nurture: { bg: 'rgba(63,169,245,0.12)', fg: '#7DD3FC', bd: 'rgba(63,169,245,0.32)' },
  Dead: { bg: 'rgba(148,163,184,0.1)', fg: '#94A3B8', bd: 'rgba(148,163,184,0.28)' },
  Done: { bg: 'rgba(52,211,153,0.12)', fg: '#6EE7B7', bd: 'rgba(52,211,153,0.34)' },
};
const SW_PRIO_C = {
  Urgent: { bg: 'rgba(244,63,94,0.12)', fg: '#FB7185', bd: 'rgba(244,63,94,0.34)' },
  High: { bg: 'rgba(251,146,60,0.12)', fg: '#FDBA74', bd: 'rgba(251,146,60,0.32)' },
  Medium: { bg: 'rgba(63,169,245,0.1)', fg: '#7DD3FC', bd: 'rgba(63,169,245,0.3)' },
  Low: { bg: 'rgba(148,163,184,0.1)', fg: '#94A3B8', bd: 'rgba(148,163,184,0.26)' },
};
function Pill({ tone, label, dot, small }) {
  const c = (SW_STATUS_C[tone] || SW_PRIO_C[tone] || SW_STATUS_C.Nurture);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: small ? '2px 8px' : '3px 10px',
      borderRadius: 'var(--radius-sm)', background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      font: `600 ${small ? 10 : 11}px/1.4 var(--font-body)`, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.fg }} />}
      {label}
    </span>
  );
}
function TypeChip({ type }) {
  const icons = { Call: 'phone', Email: 'send', Bid: 'doc', 'Source Check': 'search', 'Site Walk': 'mapPin', 'Follow-up': 'refresh' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 'var(--radius-sm)',
      background: 'rgba(63,169,245,0.07)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)',
      font: '600 11px/1.3 var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
    }}><Icon name={icons[type] || 'doc'} size={12} color="var(--brand)" />{type}</span>
  );
}

/* ─────────── Sync chip — never fakes success ─────────── */
function SyncChip({ state, label }) {
  const map = {
    connected: { c: 'var(--status-ok)', t: label || 'Synced' },
    pending: { c: 'var(--status-warn)', t: label || 'Pending' },
    disconnected: { c: 'var(--text-low)', t: label || 'Not synced' },
    failed: { c: 'var(--status-critical)', t: label || 'Failed' },
  };
  const s = map[state] || map.disconnected;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '500 11px/1 var(--font-mono)', color: s.c, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.c, boxShadow: `0 0 8px ${s.c}`, flexShrink: 0 }} />{s.t}
    </span>
  );
}

/* ─────────── Progress ring ─────────── */
function ProgressRing({ value, max = 100, size = 64, stroke = 6, color = 'var(--brand)', label, sub }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(63,169,245,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ font: `700 ${size > 56 ? 16 : 13}px/1 var(--font-display)`, color: 'var(--text-high)' }}>{label}</span>
        {sub && <span style={{ font: '500 8px/1 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{sub}</span>}
      </div>
    </div>
  );
}
function LinearProgress({ value, max = 100, color = 'var(--brand)', height = 6 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height, borderRadius: height, background: 'rgba(63,169,245,0.1)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: height, transition: 'width 0.5s ease' }} />
    </div>
  );
}

/* ─────────── Segmented toggle ─────────── */
function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div style={{ display: 'inline-flex', background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label, ic = o.icon;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: size === 'sm' ? '5px 11px' : '7px 14px',
            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: active ? 'rgba(63,169,245,0.16)' : 'transparent',
            color: active ? 'var(--brand)' : 'var(--text-mid)', font: '600 12px/1 var(--font-body)',
            boxShadow: active ? 'inset 0 0 0 1px var(--border-strong)' : 'none', transition: 'all 0.14s ease',
          }}>{ic && <Icon name={ic} size={13} />}{l}</button>
        );
      })}
    </div>
  );
}

/* ─────────── Avatar ─────────── */
function Avatar({ user, size = 32, ring }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${user.accent}, color-mix(in srgb, ${user.accent} 55%, #03121F))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: `700 ${size * 0.36}px/1 var(--font-display)`, color: '#03121F',
      border: ring ? `2px solid ${user.accent}` : '1px solid rgba(255,255,255,0.15)',
      boxShadow: ring ? `0 0 0 2px var(--canvas), 0 0 14px -2px ${user.accent}` : 'none',
    }}>{user.initials}</div>
  );
}

/* ─────────── Assignment: live-update hook + reusable menu ─────────── */
function swUseAssign() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV(x => x + 1);
    window.addEventListener('sw:assign', on);
    return () => window.removeEventListener('sw:assign', on);
  }, []);
  return v;
}

/* AssignMenu — reassign an item to a teammate. Drops into any surface.
   kind: 'task' | 'pipeline' | 'opp'; id: item id; defaultOwner: seed owner. */
function AssignMenu({ kind, id, defaultOwner, size = 24, showName = false, label, align = 'right' }) {
  swUseAssign();
  const [open, setOpen] = useState(false);
  const users = window.SW.USERS;
  const ownerId = window.SW.getOwner(kind, id, defaultOwner);
  const owner = users.find(u => u.id === ownerId) || null;
  const halt = (e) => { e.stopPropagation(); };
  const pick = (e, uid) => {
    halt(e); window.SW.setOwner(kind, id, uid); setOpen(false);
    swToast(uid ? `Assigned to ${users.find(u => u.id === uid).name}` : 'Unassigned', uid ? 'ok' : 'info');
  };
  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={halt}>
      <button onClick={(e) => { halt(e); setOpen(o => !o); }} title={owner ? `Assigned to ${owner.name}` : 'Unassigned — click to assign'}
        style={{ display: 'flex', alignItems: 'center', gap: showName ? 7 : 4, padding: showName ? '4px 9px 4px 4px' : 3, borderRadius: 999, cursor: 'pointer', background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)' }}>
        {owner ? <Avatar user={owner} size={size} /> : (
          <span style={{ width: size, height: size, borderRadius: '50%', border: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={Math.round(size * 0.5)} color="var(--text-low)" /></span>
        )}
        {showName && <span style={{ font: '600 12px/1 var(--font-body)', color: owner ? 'var(--text-high)' : 'var(--text-low)', whiteSpace: 'nowrap' }}>{owner ? owner.name.split(' ')[0] : 'Assign'}</span>}
        <Icon name="chevD" size={12} color="var(--text-low)" />
      </button>
      {open && (
        <>
          <div onClick={(e) => { halt(e); setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 119 }} />
          <div className="sw-up" style={{ position: 'absolute', top: '100%', [align]: 0, marginTop: 6, width: 232, zIndex: 120, background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px -18px rgba(0,0,0,0.9)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}><Eyebrow>{label || 'Assign to'}</Eyebrow></div>
            {users.map(u => (
              <button key={u.id} onClick={(e) => pick(e, u.id)} className="sw-clickrow" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: u.id === ownerId ? 'rgba(63,169,245,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                <Avatar user={u} size={26} />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ font: '600 12.5px/1.2 var(--font-body)', color: 'var(--text-high)' }}>{u.name}</div>
                  <div style={{ font: '500 10.5px/1.2 var(--font-body)', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.role}</div>
                </div>
                {u.id === ownerId && <Icon name="check" size={15} color="var(--brand)" />}
              </button>
            ))}
            <button onClick={(e) => pick(e, null)} className="sw-clickrow" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={13} color="var(--text-low)" /></span>
              <span style={{ flex: 1, textAlign: 'left', font: '600 12.5px/1.2 var(--font-body)', color: 'var(--text-mid)' }}>Unassigned</span>
              {!ownerId && <Icon name="check" size={15} color="var(--brand)" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────── Empty / all-clear state ─────────── */
function EmptyState({ icon = 'checkCircle', title, body, accent = 'var(--status-ok)', children }) {
  return (
    <div className="sw-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px', gap: 14 }}>
      <div style={{ width: 76, height: 76, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${accent} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)` }}>
        <Icon name={icon} size={34} color={accent} />
      </div>
      <div style={{ font: '700 19px/1.2 var(--font-display)', color: 'var(--text-high)' }}>{title}</div>
      {body && <div style={{ font: '400 14px/1.5 var(--font-body)', color: 'var(--text-mid)', maxWidth: 360 }}>{body}</div>}
      {children}
    </div>
  );
}

/* ─────────── Section label ─────────── */
function Eyebrow({ children, color = 'var(--text-low)' }) {
  return <div style={{ font: '600 11px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase', color }}>{children}</div>;
}
function FieldRow({ label, children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      {icon && <Icon name={icon} size={14} color="var(--text-low)" style={{ marginTop: 2 }} />}
      <div style={{ minWidth: 96, font: '500 12px/1.5 var(--font-body)', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ flex: 1, font: '500 13px/1.5 var(--font-body)', color: 'var(--text-high)' }}>{children}</div>
    </div>
  );
}

/* ─────────── Toast ─────────── */
function swToast(msg, type = 'info') {
  window.dispatchEvent(new CustomEvent('sw:toast', { detail: { msg, type } }));
}
function swDueLabel(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date(window.SW.TODAY + 'T08:00:00Z');
  const days = Math.round((d - now) / 86400000);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  if (days <= 0) return `Today · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function swMoney(n) { return '$' + (n >= 1000 ? Math.round(n / 1000) + 'K' : n); }

/* ─────────── Responsive hook ─────────── */
function useIsMobile(bp = 720) {
  const read = () => (typeof window !== 'undefined' && (window.__forceMobile || window.innerWidth <= bp));
  const [m, setM] = useState(read);
  useEffect(() => {
    const on = () => setM(read());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

/* ─────────── ReviewFrame — generic one-card-at-a-time deck ───────────
   Gives any list the Today-style swipe-through treatment. */
function ReviewFrame({ items, renderItem, peekLabel, emptyLabel = 'Nothing to review.' }) {
  const [i, setI] = useState(0);
  const isMobile = useIsMobile();
  const safe = Math.max(0, Math.min(i, items.length - 1));
  useEffect(() => { if (i !== safe) setI(safe); }, [i, safe]);
  if (!items.length) return <Card style={{ padding: 28, textAlign: 'center', font: '400 14px/1.5 var(--font-body)', color: 'var(--text-low)' }}>{emptyLabel}</Card>;
  const item = items[safe], next = items[safe + 1];
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
        {items.length <= 9 ? (
          <div style={{ display: 'flex', gap: 5 }}>
            {items.map((_, k) => <span key={k} style={{ width: k === safe ? 22 : 7, height: 7, borderRadius: 4, background: k === safe ? 'var(--brand)' : 'rgba(63,169,245,0.2)', transition: 'all 0.2s ease' }} />)}
          </div>
        ) : (
          <div style={{ flex: 1, maxWidth: 320, height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.14)', overflow: 'hidden' }}>
            <div style={{ width: `${((safe + 1) / items.length) * 100}%`, height: '100%', background: 'var(--brand)', borderRadius: 3, transition: 'width 0.2s ease' }} />
          </div>
        )}
        <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-low)', whiteSpace: 'nowrap', flexShrink: 0 }}>{safe + 1} of {items.length}</div>
      </div>
      <div className="sw-up" key={safe}>{renderItem(item, safe)}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12 }}>
        <Btn kind="ghost" icon="chevL" size="sm" disabled={safe === 0} onClick={() => setI(v => Math.max(0, v - 1))}>Previous</Btn>
        {next && !isMobile ? (
          <button onClick={() => setI(v => v + 1)} className="sw-clickrow" style={{ flex: 1, maxWidth: 360, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
            <div style={{ font: '500 10px/1 var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', flexShrink: 0 }}>Next</div>
            <div style={{ flex: 1, textAlign: 'left', font: '500 12.5px/1.3 var(--font-body)', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peekLabel ? peekLabel(next) : ''}</div>
            <Icon name="chevR" size={14} color="var(--text-low)" />
          </button>
        ) : <div style={{ flex: 1 }} />}
        <Btn kind="ghost" iconR="chevR" size="sm" disabled={safe >= items.length - 1} onClick={() => setI(v => Math.min(items.length - 1, v + 1))}>Next</Btn>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, ShieldMark, Card, GlassCard, Btn, IconBtn, Pill, TypeChip, SyncChip,
  ProgressRing, LinearProgress, Segmented, Avatar, EmptyState, Eyebrow, FieldRow,
  swToast, swDueLabel, swMoney, SW_STATUS_C, SW_PRIO_C, useIsMobile, ReviewFrame,
  AssignMenu, swUseAssign,
});

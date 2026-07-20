/* ShieldTech — Shared Components */
const { useState, useEffect, useRef, useMemo } = React;

/* ── Global toast helper — concise feedback for prototype actions ── */
function shieldToast(msg, type) {
  window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg, type: type || 'info' } }));
}
window.shieldToast = shieldToast;

/* ── Glass Panel ── */
function GlassPanel({ children, style, className = '', glow, onClick, ...props }) {
  return (
    <div
      className={`glass ${className}`}
      onClick={onClick}
      style={{
        padding: 'var(--space-lg)',
        boxShadow: glow ? 'var(--glow-brand-sm)' : 'none',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, suffix, trend, trendDir, sparkData, mono = true, delay = 0 }) {
  const [displayed, setDisplayed] = useState(0);
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNum = !isNaN(numVal) && typeof value !== 'string';

  useEffect(() => {
    if (!isNum) return;
    const dur = 1200;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(numVal * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    const t = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(t);
  }, [numVal]);

  return (
    <div className="glass" style={{
      padding: '20px 24px',
      flex: '1 1 0',
      minWidth: 180,
      animation: `fade-up 0.5s ease ${delay}ms both`
    }}>
      <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className={mono ? 'mono' : ''} style={{
          fontSize: 28, fontWeight: 600, color: 'var(--text-high)',
          letterSpacing: '-0.02em'
        }}>
          {isNum ? (typeof value === 'number' && value > 999 ? displayed.toLocaleString() : displayed) : value}
        </span>
        {suffix && <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{suffix}</span>}
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: trendDir === 'up' ? 'var(--status-ok)' : trendDir === 'down' ? 'var(--status-critical)' : 'var(--text-mid)',
            display: 'flex', alignItems: 'center', gap: 2
          }}>
            {trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : ''}{trend}
          </span>
        )}
      </div>
      {sparkData && <Sparkline data={sparkData} style={{ marginTop: 12 }} />}
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color = 'var(--brand)', width = 120, height = 28, style }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block', ...style }}>
      <defs>
        <linearGradient id={`sp-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#sp-${color.replace(/[^a-z0-9]/gi,'')})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Status Dot ── */
function StatusDot({ status = 'online', size = 8, pulse }) {
  const colors = { online: 'var(--status-ok)', warning: 'var(--status-warn)', critical: 'var(--status-critical)', offline: 'var(--text-low)', info: 'var(--status-info)' };
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
      background: colors[status] || colors.offline,
      boxShadow: status === 'online' ? `0 0 6px ${colors.online}` : status === 'critical' ? `0 0 8px ${colors.critical}` : 'none',
      animation: status === 'critical' ? 'pulse-critical 2s ease-in-out infinite' : status === 'online' && pulse ? 'pulse-online 3s ease-in-out infinite' : 'none'
    }} />
  );
}

/* ── Status Badge ── */
function StatusBadge({ status, label }) {
  const map = {
    online: { bg: 'rgba(52,211,153,0.12)', color: 'var(--status-ok)', text: label || 'Online' },
    warning: { bg: 'rgba(251,191,36,0.12)', color: 'var(--status-warn)', text: label || 'Warning' },
    critical: { bg: 'rgba(244,63,94,0.12)', color: 'var(--status-critical)', text: label || 'Critical' },
    offline: { bg: 'rgba(92,111,134,0.15)', color: 'var(--text-low)', text: label || 'Offline' },
    info: { bg: 'rgba(63,169,245,0.12)', color: 'var(--status-info)', text: label || 'Info' },
    paid: { bg: 'rgba(52,211,153,0.12)', color: 'var(--status-ok)', text: label || 'Paid' },
    overdue: { bg: 'rgba(244,63,94,0.12)', color: 'var(--status-critical)', text: label || 'Overdue' },
    pending: { bg: 'rgba(251,191,36,0.12)', color: 'var(--status-warn)', text: label || 'Pending' },
    draft: { bg: 'rgba(92,111,134,0.15)', color: 'var(--text-low)', text: label || 'Draft' },
    hot: { bg: 'rgba(244,63,94,0.12)', color: 'var(--status-critical)', text: label || 'Hot' },
    warm: { bg: 'rgba(251,191,36,0.12)', color: 'var(--status-warn)', text: label || 'Warm' },
    cold: { bg: 'rgba(63,169,245,0.12)', color: 'var(--status-info)', text: label || 'Cold' },
  };
  const s = map[status] || map.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: s.bg, color: s.color
    }}>
      {s.text}
    </span>
  );
}

/* ── Section Header ── */
/* icon: an SVG icon name from icons.jsx (e.g. "reports") renders the monoline
   Icon; any other string renders as a text glyph (e.g. "◈"). */
function SectionHeader({ title, action, actionLabel, icon, count }) {
  const isSvgName = typeof icon === 'string' && /^[a-z0-9-]+$/.test(icon) && typeof Icon !== 'undefined';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (isSvgName
          ? <Icon name={icon} size={15} color="var(--brand)" />
          : <span style={{ color: 'var(--brand)', fontSize: 16 }}>{icon}</span>)}
        <h3 className="display" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {count != null && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)', background: 'rgba(63,169,245,0.08)', padding: '2px 8px', borderRadius: 100 }}>{count}</span>
        )}
      </div>
      {actionLabel && (
        <button onClick={action} style={{
          background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--brand)',
          padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>{actionLabel}</button>
      )}
    </div>
  );
}

/* ── Health Ring ── */
function HealthRing({ value, size = 140, strokeWidth = 10, color, label }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const c = color || (value >= 80 ? 'var(--status-ok)' : value >= 50 ? 'var(--status-warn)' : 'var(--status-critical)');
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    const dur = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      setAnim(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(63,169,245,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={circ - (anim / 100) * circ}
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${c})`, transition: 'stroke-dashoffset 0.1s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span className="mono" style={{ fontSize: size * 0.24, fontWeight: 600, color: 'var(--text-high)' }}>
          {Math.round(anim)}
        </span>
        {label && <span style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

/* ── Uptime Strip (90 days GitHub-style) ── */
function UptimeStrip({ data, style }) {
  return (
    <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', ...style }}>
      {data.map((v, i) => (
        <div key={i} style={{
          width: 4, height: 16, borderRadius: 1,
          background: v >= 99 ? 'var(--status-ok)' : v >= 95 ? 'var(--status-warn)' : v < 50 ? 'var(--status-critical)' : 'rgba(63,169,245,0.2)',
          opacity: v >= 99 ? 0.7 : 1
        }} title={`Day ${i+1}: ${v}%`} />
      ))}
    </div>
  );
}

/* ── Approval Card ── */
function ApprovalCard({ tag, title, summary, detail, aiContent, onApprove, onReject, style }) {
  return (
    <div className="glass" style={{
      padding: 20, ...style,
      borderLeft: `3px solid ${tag === 'pricing' ? 'var(--status-warn)' : tag === 'comms' ? 'var(--brand)' : tag === 'alarm' ? 'var(--status-critical)' : 'var(--text-low)'}`,
      borderLeftStyle: 'solid'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
          background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 4
        }}>{tag}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 8 }}>{summary}</p>
      {aiContent && (
        <div style={{
          background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)',
          borderRadius: 6, padding: 12, fontSize: 12, color: 'var(--text-mid)',
          lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic'
        }}>
          {aiContent}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onApprove} style={{
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
          color: 'var(--status-ok)', padding: '6px 16px', borderRadius: 6, fontSize: 12,
          fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>Approve</button>
        <button onClick={onReject} style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
          color: 'var(--status-critical)', padding: '6px 16px', borderRadius: 6, fontSize: 12,
          fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>Reject</button>
      </div>
    </div>
  );
}

/* ── Data Table ── */
function DataTable({ columns, rows, onRowClick, style }) {
  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                textAlign: col.align || 'left', padding: '10px 12px',
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} onClick={() => onRowClick?.(row, ri)} style={{
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((col, ci) => (
                <td key={ci} style={{
                  padding: '10px 12px', fontSize: 13,
                  borderBottom: '1px solid rgba(63,169,245,0.05)',
                  color: 'var(--text-high)', whiteSpace: 'nowrap',
                  fontFamily: col.mono ? 'var(--font-mono)' : 'inherit',
                  textAlign: col.align || 'left'
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Mini Chart Bar ── */
function MiniBar({ value, max = 100, color = 'var(--brand)', width = 80, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width, height: 6, background: 'rgba(63,169,245,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(value/max)*100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      {label && <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>{label}</span>}
    </div>
  );
}

/* ── Detail Field (label + value pair) ── */
function DetailField({ label, value, mono, badge }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-high)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
        {badge && <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(251,191,36,0.12)', color: 'var(--status-warn)', padding: '1px 4px', borderRadius: 3 }}>{badge}</span>}
      </div>
    </div>
  );
}


/* ── Form Field (label + input) ── */
function FormField({ label, placeholder, textarea, value, onChange, style }) {
  const inputStyle = {
    width: '100%', padding: textarea ? '10px 14px' : '8px 12px',
    background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
    resize: textarea ? 'vertical' : undefined, minHeight: textarea ? 72 : undefined
  };
  return (
    <div style={style}>
      {label && <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 4 }}>{label}</div>}
      {textarea
        ? <textarea placeholder={placeholder} value={value} onChange={onChange} style={inputStyle}></textarea>
        : <input placeholder={placeholder} value={value} onChange={onChange} style={inputStyle} />}
    </div>
  );
}

/* ── Modal / Window System (shared across all apps) ──
   Usage: shieldModal({ kind, title, ... })
   kinds: 'form' | 'editor' | 'doc' | 'confirm' | 'signature' | 'detail'
   - detail:  badge:{label,status}, meter:{value,label}, sections:[{label, rows:[{k,v,color}], text, meters:[{label,value,max,color}], items:[{title,sub,right,status,onClick}]}], actions:[{label,primary,danger,onClick}]
   - form:    fields:[{key,label,type,placeholder,required,options,full}], submitLabel, successMsg, onSubmit(values)
   - editor:  value (prefilled text), submitLabel, successMsg, onSubmit(text)
   - doc:     meta, paragraphs:[...], downloadLabel
   - confirm: message, confirmLabel, danger, onConfirm()
   - signature: subtitle, onSave()
*/
function shieldModal(config) {
  window.dispatchEvent(new CustomEvent('shield:modal', { detail: config }));
}
window.shieldModal = shieldModal;

function ShieldModalHost() {
  const [cfg, setCfg] = React.useState(null);
  const [values, setValues] = React.useState({});
  const [tried, setTried] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const sigRef = React.useRef(null);
  const drawing = React.useRef(false);
  const hasInk = React.useRef(false);

  React.useEffect(() => {
    const open = (e) => {
      const c = e.detail || {};
      const init = {};
      (c.fields || []).forEach(f => { init[f.key] = f.value != null ? f.value : (f.type === 'select' && f.options ? f.options[0] : ''); });
      if (c.kind === 'editor') init.__text = c.value || '';
      setValues(init); setTried(false); setBusy(false); setCfg(c);
    };
    window.addEventListener('shield:modal', open);
    return () => window.removeEventListener('shield:modal', open);
  }, []);

  const close = React.useCallback(() => setCfg(null), []);

  React.useEffect(() => {
    if (!cfg) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cfg, close]);

  if (!cfg) return null;
  const kind = cfg.kind || 'form';
  const statusColorMap = { ok: 'var(--status-ok)', online: 'var(--status-ok)', warn: 'var(--status-warn)', warning: 'var(--status-warn)', critical: 'var(--status-critical)', offline: 'var(--text-low)', info: 'var(--brand)', pending: 'var(--brand)' };
  const set = (k, v) => setValues(prev => ({ ...prev, [k]: v }));
  const inputStyle = {
    width: '100%', padding: '9px 12px', background: 'rgba(5,7,10,0.5)',
    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
  };

  const finish = (msg) => { setBusy(true); setTimeout(() => { setBusy(false); close(); if (msg) shieldToast(msg, 'ok'); }, 600); };

  const submitForm = () => {
    setTried(true);
    const missing = (cfg.fields || []).filter(f => f.required && !String(values[f.key] || '').trim());
    if (missing.length) return;
    if (cfg.onSubmit) cfg.onSubmit(values);
    finish(cfg.successMsg || 'Saved');
  };
  const submitEditor = () => { if (cfg.onSubmit) cfg.onSubmit(values.__text); finish(cfg.successMsg || 'Sent'); };
  const confirmAction = () => { if (cfg.onConfirm) cfg.onConfirm(); finish(cfg.successMsg); };

  // Signature pad handlers
  const sigPoint = (e) => {
    const c = sigRef.current; if (!c) return null;
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) };
  };
  const sigStart = (e) => { e.preventDefault(); drawing.current = true; const p = sigPoint(e); const ctx = sigRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const sigMove = (e) => { if (!drawing.current) return; const p = sigPoint(e); const ctx = sigRef.current.getContext('2d'); ctx.strokeStyle = '#cfe8ff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineTo(p.x, p.y); ctx.stroke(); hasInk.current = true; };
  const sigEnd = () => { drawing.current = false; };
  const sigClear = () => { const c = sigRef.current; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); hasInk.current = false; };

  const titles = { form: cfg.title, editor: cfg.title, doc: cfg.title, confirm: cfg.title, signature: cfg.title, detail: cfg.title };

  return (
    <div onClick={close} style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{
        width: kind === 'doc' ? 640 : kind === 'detail' ? 560 : 520, maxWidth: '100%', maxHeight: '86vh',
        background: 'var(--modal, var(--card))', border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md, 12px)', boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'fade-up 0.18s ease both'
      }}>
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '15px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{titles[kind] || 'Details'}</div>
            {cfg.subtitle && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>{cfg.subtitle}</div>}
          </div>
          <button onClick={close} aria-label="Close" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Body (scrolls) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {kind === 'form' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(cfg.fields || []).map(f => {
                const err = tried && f.required && !String(values[f.key] || '').trim();
                return (
                  <div key={f.key} style={{ gridColumn: f.full || f.type === 'textarea' ? '1 / -1' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-low)', marginBottom: 4 }}>
                      {f.label}{f.required && <span style={{ color: 'var(--status-critical)' }}> *</span>}
                    </label>
                    {f.type === 'select'
                      ? <select value={values[f.key]} onChange={e => set(f.key, e.target.value)} style={{ ...inputStyle, borderColor: err ? 'var(--status-critical)' : 'var(--border-subtle)' }}>{(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}</select>
                      : f.type === 'textarea'
                      ? <textarea value={values[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, minHeight: 84, resize: 'vertical', borderColor: err ? 'var(--status-critical)' : 'var(--border-subtle)' }} />
                      : <input type={f.type || 'text'} value={values[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, borderColor: err ? 'var(--status-critical)' : 'var(--border-subtle)' }} />}
                    {err && <div style={{ fontSize: 10, color: 'var(--status-critical)', marginTop: 3 }}>{f.label} is required</div>}
                  </div>
                );
              })}
            </div>
          )}

          {kind === 'editor' && (
            <textarea value={values.__text} onChange={e => set('__text', e.target.value)} autoFocus style={{ ...inputStyle, width: '100%', minHeight: 220, resize: 'vertical', lineHeight: 1.6, whiteSpace: 'pre-wrap' }} />
          )}

          {kind === 'doc' && (
            <div style={{ background: '#f7f8fa', borderRadius: 6, padding: '32px 36px', color: '#1a2230', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{cfg.docTitle || cfg.title}</div>
              {cfg.meta && <div style={{ fontSize: 11, color: '#6b7686', marginBottom: 20, fontFamily: 'var(--font-mono)' }}>{cfg.meta}</div>}
              {(cfg.paragraphs || ['Document preview.']).map((p, i) => (
                typeof p === 'string'
                  ? <p key={i} style={{ fontSize: 12.5, lineHeight: 1.7, marginBottom: 12, color: '#2a3445' }}>{p}</p>
                  : <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e8ee', padding: '7px 0', fontSize: 12.5 }}><span style={{ color: '#41506a' }}>{p.k}</span><span style={{ fontWeight: 600 }}>{p.v}</span></div>
              ))}
            </div>
          )}

          {kind === 'confirm' && (
            <div style={{ fontSize: 13.5, color: 'var(--text-mid)', lineHeight: 1.6 }}>{cfg.message}</div>
          )}

          {kind === 'detail' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(cfg.meter || cfg.badge) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {cfg.meter && <HealthRing value={cfg.meter.value} size={64} strokeWidth={5} label={cfg.meter.label || ''} />}
                  {cfg.badge && <StatusBadge status={cfg.badge.status || 'info'} label={cfg.badge.label} />}
                  {cfg.headline && <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5 }}>{cfg.headline}</div>}
                </div>
              )}
              {(cfg.sections || []).map((sec, si) => (
                <div key={si}>
                  {sec.label && <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 8 }}>{sec.label}</div>}
                  {sec.text && <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>{sec.text}</div>}
                  {sec.rows && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 16px' }}>
                      {sec.rows.map((r, ri) => (
                        <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid rgba(63,169,245,0.06)', paddingBottom: 6, gridColumn: r.full ? '1 / -1' : 'auto' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-low)' }}>{r.k}</span>
                          <span className={r.mono === false ? '' : 'mono'} style={{ fontSize: 12, fontWeight: 600, color: r.color || 'var(--text-high)', textAlign: 'right' }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sec.meters && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {sec.meters.map((m, mi) => {
                        const pct = Math.min(100, (m.value / (m.max || 100)) * 100);
                        const col = m.color || (pct >= 80 ? 'var(--status-ok)' : pct >= 50 ? 'var(--brand)' : 'var(--status-warn)');
                        return (
                          <div key={mi}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{m.label}</span>
                              <span className="mono" style={{ fontSize: 12, color: col, fontWeight: 600 }}>{m.display != null ? m.display : Math.round(m.value)}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                              <div style={{ width: pct + '%', height: '100%', borderRadius: 3, background: col, transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {sec.items && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {sec.items.map((it, ii) => (
                        <div key={ii} onClick={it.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: ii < sec.items.length - 1 ? '1px solid rgba(63,169,245,0.06)' : 'none', cursor: it.onClick ? 'pointer' : 'default' }}>
                          {it.status && <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColorMap[it.status] || 'var(--text-low)', flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{it.title}</div>
                            {it.sub && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{it.sub}</div>}
                          </div>
                          {it.right && <span className="mono" style={{ fontSize: 11, color: it.rightColor || 'var(--text-mid)', flexShrink: 0 }}>{it.right}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {kind === 'signature' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>{cfg.signPrompt || 'Have the customer sign below to confirm completion.'}</div>
              <canvas ref={sigRef} width={560} height={200}
                onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd}
                onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd}
                style={{ width: '100%', height: 180, background: 'rgba(5,7,10,0.5)', border: '1px dashed var(--border-strong)', borderRadius: 8, touchAction: 'none', cursor: 'crosshair' }} />
              <button onClick={sigClear} style={{ marginTop: 8, padding: '5px 12px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '13px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={close} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{kind === 'doc' || kind === 'detail' ? 'Close' : 'Cancel'}</button>
          {kind === 'form' && <ModalPrimary busy={busy} onClick={submitForm} label={cfg.submitLabel || 'Save'} />}
          {kind === 'editor' && <ModalPrimary busy={busy} onClick={submitEditor} label={cfg.submitLabel || 'Save'} />}
          {kind === 'doc' && <ModalPrimary busy={busy} onClick={() => finish(cfg.downloadMsg || 'Download started')} label={cfg.downloadLabel || 'Download PDF'} />}
          {kind === 'confirm' && <ModalPrimary busy={busy} danger={cfg.danger} onClick={confirmAction} label={cfg.confirmLabel || 'Confirm'} />}
          {kind === 'signature' && <ModalPrimary busy={busy} onClick={() => { if (!hasInk.current) { shieldToast('Please capture a signature first', 'warn'); return; } if (cfg.onSave) cfg.onSave(); finish(cfg.successMsg || 'Signature captured'); }} label={cfg.submitLabel || 'Save & Complete'} />}
          {kind === 'detail' && (cfg.actions || []).map((a, ai) => (
            a.primary || a.danger
              ? <ModalPrimary key={ai} busy={busy} danger={a.danger} onClick={() => { if (a.onClick) a.onClick(); if (a.close !== false) finish(a.successMsg); }} label={a.label} />
              : <button key={ai} onClick={() => { if (a.onClick) a.onClick(); if (a.close) close(); }} style={{ padding: '8px 18px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalPrimary({ busy, onClick, label, danger }) {
  return (
    <button onClick={onClick} disabled={busy} style={{
      padding: '8px 20px', borderRadius: 6, border: 'none',
      background: danger ? 'var(--status-critical)' : 'var(--brand)', color: '#fff',
      fontSize: 12.5, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--font-body)',
      opacity: busy ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: 7
    }}>
      {busy && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
      {busy ? 'Working…' : label}
    </button>
  );
}

/* Self-mount one modal host per app */
(function mountShieldModalHost() {
  if (window.__shieldModalMounted) return;
  window.__shieldModalMounted = true;
  const el = document.createElement('div');
  document.body.appendChild(el);
  ReactDOM.createRoot(el).render(<ShieldModalHost />);
})();

/* ── Segmented toggle — self-stateful pill/button group ── */
function Segmented({ options, defaultValue, onChange, btnStyle, activeStyle, idleStyle }) {
  const [val, setVal] = useState(defaultValue != null ? defaultValue : options[0]);
  return options.map(v => {
    const active = v === val;
    return (
      <button key={v} onClick={() => { setVal(v); onChange && onChange(v); }} style={{
        cursor: 'pointer', fontFamily: 'var(--font-body)',
        ...btnStyle,
        ...(active ? activeStyle : idleStyle)
      }}>{v}</button>
    );
  });
}

/* ── Export to window ── */
Object.assign(window, {
  GlassPanel, StatCard, Sparkline, StatusDot, StatusBadge,
  SectionHeader, HealthRing, UptimeStrip, ApprovalCard,
  DataTable, MiniBar, DetailField, FormField, Segmented,
  shieldModal, ShieldModalHost
});

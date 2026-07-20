/* ShieldTech Widget System — Core shell + shared primitives
   Apple-Weather-style progressive disclosure: small → medium → large.
   Dark-glass theme. Each widget component takes a `size` prop ('small'|'medium'|'large').
   Registry (ST_WIDGETS) is assembled at the end of st-widgets-fun.jsx. */

/* ── Size geometry (mirrors iOS small/medium/large) ── */
const WSIZE = {
  small:  { w: 178, h: 178, cols: 1, rows: 1 },
  medium: { w: 372, h: 178, cols: 2, rows: 1 },
  large:  { w: 372, h: 372, cols: 2, rows: 2 },
};

/* ── Color helpers ── */
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/* ── The widget shell (the "card") ──
   Provides the rounded dark-glass surface, an accent wash, a top-lit highlight,
   and a standard header (title left, glyph right). Body is the children. */
function WCard({ size = 'medium', accent = '#3FA9F5', title, sub, glyph, children, flush = false, onClick }) {
  const s = WSIZE[size];
  const pad = size === 'small' ? 14 : 16;
  return (
    <div
      onClick={onClick}
      className="st-wcard glass"
      style={{
        width: s.w, height: s.h, borderRadius: 'var(--radius-md)', padding: pad,
        position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column',
        background: 'var(--card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'none',
        '--wc-accent': accent,
      }}
    >
      {/* accent rail down the left edge — the only color the resting card carries */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: accent, opacity: 0.55, pointerEvents: 'none' }} />
      {/* header */}
      {(title || glyph) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            {title && <div className="label-sm" style={{ fontSize: size === 'small' ? 9.5 : 10, letterSpacing: '0.03em', color: 'var(--text-low)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>}
            {sub && <div style={{ fontSize: 10.5, color: 'var(--text-mid)', fontWeight: 500, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
          </div>
          {glyph && <div style={{ flexShrink: 0, color: accent, display: 'flex', opacity: 0.85 }}><Icon name={glyph} size={size === 'small' ? 15 : 16} color={accent} /></div>}
        </div>
      )}
      {/* body */}
      <div style={{ flex: 1, minHeight: 0, marginTop: flush ? 0 : (size === 'small' ? 6 : 10), display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Hero metric (the big "29°") ── */
function WHero({ value, unit, sub, size, color = 'var(--text-high)' }) {
  const fs = size === 'small' ? 34 : 44;
  return (
    <div>
      <div className="mono" style={{ fontSize: fs, fontWeight: 600, lineHeight: 1, color, letterSpacing: '-0.02em' }}>
        {value}<span style={{ fontSize: fs * 0.42, fontWeight: 500, color: 'var(--text-mid)', marginLeft: 2 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

/* ── Horizontal strip cell (the "1PM ☀ 29°" hourly column) ── */
function WStrip({ cells, accent, anchor = true }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: 2, marginTop: anchor ? 'auto' : 12 }}>
      {cells.map((c, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-mid)', fontWeight: 500 }}>{c.top}</span>
          {c.glyph !== undefined
            ? <Icon name={c.glyph} size={15} color={c.color || accent} />
            : <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color || accent }} />}
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 600 }}>{c.bot}</span>
        </div>
      ))}
    </div>
  );
}

/* ── List row (the "Tuesday ☀ 24 14" daily forecast row) ── */
function WRow({ label, glyph, glyphColor, a, b, accent, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {glyph && <Icon name={glyph} size={15} color={glyphColor || accent} />}
      {a != null && <span className="mono" style={{ fontSize: 13, color: 'var(--text-high)', fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{a}</span>}
      {b != null && <span className="mono" style={{ fontSize: 13, color: 'var(--text-low)', minWidth: 30, textAlign: 'right' }}>{b}</span>}
    </div>
  );
}

/* ── Divider used under the header on medium/large (like the weather hairline) ── */
/* Shared empty state for widgets whose data source has no records yet */
function WNoData({ size, accent = '#3FA9F5', title, glyph, sub }) {
  return (
    <WCard size={size} accent={accent} title={title} glyph={glyph} sub={sub}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, padding: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-low)' }}>No data yet</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-low)', opacity: 0.7, textAlign: 'center' }}>Records will appear here as you add them</div>
      </div>
    </WCard>
  );
}

function WDivide() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.10)', margin: '10px 0' }} />;
}

/* ── Donut/ring gauge ── */
function WRing({ pct, size = 64, stroke = 7, color = '#3FA9F5', label, value }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: size > 80 ? 20 : 15, fontWeight: 700, color: 'var(--text-high)', lineHeight: 1 }}>{value != null ? value : pct + '%'}</span>
        {label && <span style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

/* ── Sparkline ── */
function WSpark({ data, color = '#3FA9F5', w = 120, h = 34, fill = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 4) - 2]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {fill && <path d={area} fill={hexToRgba(color, 0.16)} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Mini bar row ── */
function WBars({ data, color = '#3FA9F5', h = 38 }) {
  const max = Math.max(...data.map(d => d.v)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: h }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', height: `${(d.v / max) * 100}%`, minHeight: 3, borderRadius: 3, background: d.color || color, opacity: d.dim ? 0.4 : 1 }} />
          <span style={{ fontSize: 8, color: 'var(--text-low)' }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Status pill ── */
function WPill({ children, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: hexToRgba(color, 0.16), color, letterSpacing: '0.03em' }}>{children}</span>;
}

const ST_REGISTRY = {};
function registerWidget(type, def) { ST_REGISTRY[type] = def; }

Object.assign(window, { WSIZE, hexToRgba, WCard, WHero, WStrip, WRow, WDivide, WRing, WSpark, WBars, WPill, ST_REGISTRY, registerWidget });

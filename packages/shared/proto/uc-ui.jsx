/* UniFi-pattern UI vocabulary shared by every ShieldTech app (portal desktop +
   mobile, sales). Buttons, tabs, cards, KPI tiles, tables, chips, drawers,
   properties, donut — plus the unified screen frame (UcFrame) and the
   sidebar ↔ screen tab binding (useUcSub). Loaded before any screen that
   uses it; the ShieldTech OS console and the SELL / DELIVER / CARE / MONEY
   screens build on these. */

const ucFont = { fontFamily: 'var(--font-body)' };
function UcBtn({ children, onClick, kind = 'primary', small, style, disabled, title }) {
  const base = { ...ucFont, display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '5px 10px' : '7px 14px', borderRadius: 6, fontSize: small ? 11.5 : 12.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', border: '1px solid transparent', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' };
  const kinds = { primary: { background: 'var(--brand)', color: '#fff' }, ghost: { background: 'transparent', color: 'var(--text-high)', borderColor: 'var(--border-strong)' }, soft: { background: 'var(--brand-tint-12)', color: 'var(--brand)' }, danger: { background: 'var(--critical-tint-12)', color: 'var(--status-critical)' } };
  return <button disabled={disabled} onClick={onClick} title={title} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}
function UcToggle({ value, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12.5, color: 'var(--text-high)' }}>
      <span onClick={(e) => { e.preventDefault(); onChange(!value); }} style={{ width: 36, height: 20, borderRadius: 10, background: value ? 'var(--brand)' : 'var(--border-strong)', position: 'relative', transition: 'background var(--dur)', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left var(--dur)' }} />
      </span>
      {label}
    </label>
  );
}
function UcTabs({ tabs, value, onChange }) {
  return (
    <div className="uc-tabs" style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', marginBottom: 14, overflowX: 'auto', flexShrink: 0 }}>
      {tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} style={{ ...ucFont, padding: '9px 14px', background: 'none', border: 'none', borderBottom: value === t.id ? '2px solid var(--brand)' : '2px solid transparent', color: value === t.id ? 'var(--text-high)' : 'var(--text-mid)', fontSize: 13, fontWeight: value === t.id ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>{t.label}{t.count != null && <span style={{ marginLeft: 6, fontSize: 10.5, padding: '1px 6px', borderRadius: 10, background: 'var(--brand-tint-12)', color: 'var(--brand)' }}>{t.count}</span>}</button>)}
    </div>
  );
}
function UcCard({ title, action, children, style, pad = 16 }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, ...style }}>
      {title && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}><span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)' }}>{title}</span>{action}</div>}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}
function UcTile({ label, value, sub, tone, onClick }) {
  const col = tone === 'ok' ? 'var(--status-ok)' : tone === 'warn' ? 'var(--status-warn)' : tone === 'crit' ? 'var(--status-critical)' : 'var(--text-high)';
  return (
    <div className="uc-tile" onClick={onClick} style={{ flex: '1 1 0', minWidth: 150, background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</div>
      <div className="uc-tile-v" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: col, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function UcEmpty({ title, body, cta, onCta }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.6, maxWidth: 460, margin: '6px auto 0' }}>{body}</div>
      {cta && <div style={{ marginTop: 14 }}><UcBtn kind="soft" onClick={onCta}>{cta}</UcBtn></div>}
    </div>
  );
}
function UcTable({ cols, rows, onRow, empty, selectedId }) {
  const th = { ...ucFont, textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--card)' };
  const td = { padding: '9px 12px', fontSize: 12.5, color: 'var(--text-high)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' };
  if (!rows.length) return empty || null;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr>{cols.map(c => <th key={c.k} style={{ ...th, width: c.w, textAlign: c.right ? 'right' : 'left' }}>{c.l}</th>)}</tr></thead>
      <tbody>{rows.map(r => (
        <tr key={r.id} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'st-clickrow' : ''} style={{ background: selectedId === r.id ? 'var(--brand-tint-05)' : 'transparent' }}>
          {cols.map(c => <td key={c.k} style={{ ...td, textAlign: c.right ? 'right' : 'left', color: c.dim ? 'var(--text-mid)' : td.color }} className={c.mono ? 'mono' : ''}>{c.render ? c.render(r) : (r[c.k] ?? '—')}</td>)}
        </tr>))}</tbody>
    </table>
  );
}
function UcDot({ s, size = 8, color }) { return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: color || (s === 'online' || s === 'healthy' ? 'var(--status-ok)' : s === 'warning' || s === 'attention' ? 'var(--status-warn)' : s === 'offline' ? 'var(--status-critical)' : 'var(--text-low)'), flexShrink: 0 }} />; }
function UcStatusCell({ s }) { const l = { online: 'Online', warning: 'Attention', offline: 'Offline', healthy: 'Healthy', attention: 'Attention', empty: 'No devices' }[s] || s; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><UcDot s={s} />{l}</span>; }
function UcSearch({ value, onChange, placeholder, style }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search'} style={{ ...ucFont, padding: '7px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none', minWidth: 200, ...style }} />;
}
function UcChips({ options, value, onChange }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(o => <button key={o.id} onClick={() => onChange(o.id)} style={{ ...ucFont, padding: '5px 11px', borderRadius: 14, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', background: value === o.id ? 'var(--brand)' : 'var(--card)', color: value === o.id ? '#fff' : 'var(--text-mid)', border: `1px solid ${value === o.id ? 'var(--brand)' : 'var(--border-subtle)'}` }}>{o.l}{o.n != null ? ` ${o.n}` : ''}</button>)}</div>;
}
function UcDrawer({ title, sub, onClose, children, width = 380, head }) {
  return (
    <div style={{ width, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', background: 'var(--card)', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>}{head}</div>
        <button onClick={onClose} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{children}</div>
    </div>
  );
}
function UcProp({ k, v }) { return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span style={{ color: 'var(--text-mid)' }}>{k}</span><span style={{ color: 'var(--text-high)', textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span></div>; }
function UcDonut({ parts, size = 120, unit = 'devices' }) {
  const total = parts.reduce((s, p) => s + p.v, 0) || 1; const r = 46, c = 2 * Math.PI * r; let off = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="14" />
      {parts.filter(p => p.v).map((p, i) => { const len = c * p.v / total; const el = <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={p.c} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />; off += len; return el; })}
      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-high)" fontFamily="var(--font-body)">{total === 1 && !parts.some(p => p.v) ? 0 : total}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="var(--text-mid)" fontFamily="var(--font-body)">{unit}</text>
    </svg>
  );
}

/* ── Unified screen frame ──
   Title + subtitle, right-side actions, KPI tiles, tabs (+ chips), scrolling
   body and a properties drawer. Desktop sizing by default; a host sets
   --uf-h / --uf-m / --uf-r / --uf-b to fit the frame into any shell (the
   phone shells set 100% / 0 / 0 / none). On phones the drawer goes
   full-screen. */
function UcFrame({ label, title, sub, right, tiles, tabs, tab, onTab, chips, children, drawer, isMobile, bodyStyle }) {
  return (
    <div data-screen-label={label} style={{ display: 'flex', height: 'var(--uf-h, calc(100vh - 76px))', margin: 'var(--uf-m, -4px 0 0)', overflow: 'hidden', borderRadius: 'var(--uf-r, 8px)', border: 'var(--uf-b, 1px solid var(--border-subtle))', background: 'var(--canvas)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{sub}</div>}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{right}</div>
          </div>
          {tiles && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>{tiles}</div>}
          {tabs && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><UcTabs tabs={tabs} value={tab} onChange={onTab} />{chips && <div style={{ marginBottom: 14 }}>{chips}</div>}</div>}
          {!tabs && chips && <div style={{ marginBottom: 12 }}>{chips}</div>}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 16px', ...bodyStyle }}>{children}</div>
      </div>
      {drawer && !isMobile && drawer}
      {drawer && isMobile && <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'var(--card)', display: 'flex' }}>{drawer}</div>}
    </div>
  );
}
/* Sidebar ↔ screen tab bus. The portal shell owns navSubSet; apps without the
   shell (sales) get the same event protocol from this fallback. */
function ucNavSubSet(screen, sub, source) {
  if (window.navSubSet) return window.navSubSet(screen, sub, source);
  window.__navSub = { screen, sub };
  try { window.dispatchEvent(new CustomEvent('st2:subnav', { detail: { screen, sub, source: source || 'nav' } })); } catch { /* noop */ }
}
function useUcSub(screen, subs, fallback, hubMap) {
  const subInit = window.__navSub && window.__navSub.screen === screen ? window.__navSub.sub : null;
  const hubInit = hubMap ? hubMap[window.__hubScreenId || ''] : null;
  const [tab, setTab] = React.useState(subs.some(s => s.id === subInit) ? subInit : (hubInit || fallback));
  React.useEffect(() => { const h = (e) => { if (e.detail.screen === screen && e.detail.source !== 'screen' && e.detail.sub && subs.some(s => s.id === e.detail.sub)) setTab(e.detail.sub); }; window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, []);
  React.useEffect(() => { if (!window.__navSub || window.__navSub.screen !== screen || window.__navSub.sub !== tab) ucNavSubSet(screen, tab, 'screen'); }, [tab]);
  return [tab, setTab];
}
function useUcNavSub() {
  const [v, setV] = React.useState(() => window.__navSub || null);
  React.useEffect(() => { const h = (e) => setV({ screen: e.detail.screen, sub: e.detail.sub }); window.addEventListener('st2:subnav', h); return () => window.removeEventListener('st2:subnav', h); }, []);
  return v;
}
function useUcMobile(bp = 820) {
  const read = () => (typeof window !== 'undefined' && (window.__forceMobile || window.innerWidth <= bp));
  const [m, setM] = React.useState(read);
  React.useEffect(() => { const on = () => setM(read()); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  return m;
}
const ucMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();
const ucMoneyK = (n) => { n = Number(n) || 0; return n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K` : `$${Math.round(n).toLocaleString()}`; };
const ucDate = (t) => { if (!t) return '—'; const d = typeof t === 'number' ? new Date(t) : new Date(String(t).length === 10 ? t + 'T12:00:00' : t); return isNaN(d) ? String(t) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const ucAgoDays = (t) => { if (!t) return null; return Math.floor((Date.now() - (typeof t === 'number' ? t : new Date(t).getTime())) / 86400000); };

Object.assign(window, {
  UcBtn, UcToggle, UcTabs, UcCard, UcTile, UcEmpty, UcTable, UcDot, UcStatusCell, UcSearch, UcChips, UcDrawer, UcProp, UcDonut,
  UcFrame, useUcSub, useUcNavSub, useUcMobile, ucNavSubSet, ucMoney, ucMoneyK, ucDate, ucAgoDays, ucFont,
});

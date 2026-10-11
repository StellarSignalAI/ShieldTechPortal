/* ShieldTech OS — the Care console laid out the way the Ubiquiti UniFi family
   lays out a site: a dark app rail (Sites · Network · Protect · Access ·
   Alerts · Assets · Settings), a site selector up top, underline tabs per
   app, dense tables with a properties drawer, flat status dots and one blue.
   Every number comes from ShieldTech's own registry (assetStore, customers,
   tickets, photos, access logs). Nothing live is invented: a stream, an ISP
   line or a client list that needs a controller says so and tells you what
   connects it. */

/* ── Stores (shared across surfaces) ── */
const accessUserStore = createShieldStore('accessusers', []);       // [{id, customer, name, group, cred, status}]
const accessVisitorStore = createShieldStore('accessvisitors', []); // [{id, customer, name, host, doors, from, to, pin}]
const accessPolicyStore = createShieldStore('accesspolicies', []);  // [{id, customer, name, doors, schedule, groups}]
const accessLogStore = createShieldStore('accesslogs', []);         // [{id, customer, site, door, user, kind, result, at}]
const alarmRuleStore = createShieldStore('alarmrules', []);         // [{id, customer, name, trigger, scope, action, enabled}]
const osConsoleStore = createShieldStore('osconsole', { acked: {}, locks: {}, notify: { offline: true, alarms: true, access: false, digest: true }, isp: false, unifiHost: '' });

/* ── Helpers ── */
const ucMe = () => (window.__shieldUser || {}).name || 'Office';
const ucNow = () => Date.now();
const ucAgo = (t) => { if (!t) return '—'; const m = Math.max(0, Math.round((ucNow() - t) / 60000)); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; return `${Math.round(h / 24)}d ago`; };
const ucClock = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const ucStatus = (a) => !a.status || a.status === 'online' ? 'online' : a.status === 'warning' ? 'warning' : 'offline';
const ucKind = (a) => (typeof monitorNodeType === 'function' ? monitorNodeType(a.type) : 'device');
const UC_KIND_LABEL = { gateway: 'Gateway', switch: 'Switch', ap: 'Access point', camera: 'Camera', access: 'Door / reader', alarm: 'Alarm panel', nvr: 'Recorder', server: 'Server', device: 'Device' };
const UC_KIND_COLOR = { gateway: 'var(--brand)', switch: 'var(--brand)', ap: 'var(--disc-alarm)', camera: 'var(--disc-cctv)', access: 'var(--disc-access)', alarm: 'var(--disc-fire)', nvr: 'var(--brand)', server: 'var(--text-mid)', device: 'var(--text-low)' };
const UC_KIND_GLYPH = { gateway: '⌂', switch: '⊞', ap: '◠', camera: '◉', access: '⊠', alarm: '◬', nvr: '⊟', server: '▤', device: '▢' };

/* One site record per (customer, site) seen in the registry or on the customer card. */
function useUcSites() {
  const [custs] = useShieldStore(customerStore);
  const [assets] = useShieldStore(assetStore);
  const [tickets] = useShieldStore(ticketStore);
  return React.useMemo(() => {
    const map = new Map();
    const add = (customer, site, extra) => { const k = `${customer}|${site || 'Main site'}`; if (!map.has(k)) map.set(k, { id: k, customer, site: site || 'Main site', devices: [], address: '', ...extra }); return map.get(k); };
    (custs || []).forEach(c => {
      const recs = typeof custRecords === 'function' ? custRecords(c.id, 'sites') : [];
      if (recs.length) recs.forEach(s => add(c.name, s.name, { address: s.address || '' }));
      else add(c.name, 'Main site', { address: c.address || '' });
    });
    (assets || []).forEach(a => { if (a.customer) add(a.customer, a.site).devices.push(a); });
    return [...map.values()].map(s => {
      const on = s.devices.filter(a => ucStatus(a) === 'online').length;
      const warn = s.devices.filter(a => ucStatus(a) === 'warning').length;
      const off = s.devices.length - on - warn;
      const openTickets = (tickets || []).filter(t => (t.customer === s.customer || t.company === s.customer) && !['resolved', 'closed'].includes(t.status)).length;
      const verdict = !s.devices.length ? 'empty' : off ? 'offline' : warn ? 'attention' : 'healthy';
      return { ...s, on, warn, off, openTickets, verdict, cams: s.devices.filter(a => ucKind(a) === 'camera').length, doors: s.devices.filter(a => ucKind(a) === 'access').length, net: s.devices.filter(a => ['gateway', 'switch', 'ap'].includes(ucKind(a))).length };
    }).sort((a, b) => a.customer.localeCompare(b.customer) || a.site.localeCompare(b.site));
  }, [custs, assets, tickets]);
}

/* ── Primitives (UniFi console vocabulary) ── */
const ucFont = { fontFamily: 'var(--font-body)' };
function UcBtn({ children, onClick, kind = 'primary', small, style, disabled }) {
  const base = { ...ucFont, display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '5px 10px' : '7px 14px', borderRadius: 6, fontSize: small ? 11.5 : 12.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', border: '1px solid transparent', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' };
  const kinds = { primary: { background: 'var(--brand)', color: '#fff' }, ghost: { background: 'transparent', color: 'var(--text-high)', borderColor: 'var(--border-strong)' }, soft: { background: 'var(--brand-tint-12)', color: 'var(--brand)' }, danger: { background: 'var(--critical-tint-12)', color: 'var(--status-critical)' } };
  return <button disabled={disabled} onClick={onClick} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
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
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', marginBottom: 14, overflowX: 'auto', flexShrink: 0 }}>
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
function UcTile({ label, value, sub, tone }) {
  const col = tone === 'ok' ? 'var(--status-ok)' : tone === 'warn' ? 'var(--status-warn)' : tone === 'crit' ? 'var(--status-critical)' : 'var(--text-high)';
  return (
    <div style={{ flex: '1 1 0', minWidth: 150, background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: col, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
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
function UcDot({ s, size = 8 }) { return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: s === 'online' || s === 'healthy' ? 'var(--status-ok)' : s === 'warning' || s === 'attention' ? 'var(--status-warn)' : s === 'offline' ? 'var(--status-critical)' : 'var(--text-low)', flexShrink: 0 }} />; }
function UcStatusCell({ s }) { const l = { online: 'Online', warning: 'Attention', offline: 'Offline', healthy: 'Healthy', attention: 'Attention', empty: 'No devices' }[s] || s; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><UcDot s={s} />{l}</span>; }
function UcSearch({ value, onChange, placeholder }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search'} style={{ ...ucFont, padding: '7px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none', minWidth: 200 }} />;
}
function UcChips({ options, value, onChange }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(o => <button key={o.id} onClick={() => onChange(o.id)} style={{ ...ucFont, padding: '5px 11px', borderRadius: 14, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', background: value === o.id ? 'var(--brand)' : 'var(--card)', color: value === o.id ? '#fff' : 'var(--text-mid)', border: `1px solid ${value === o.id ? 'var(--brand)' : 'var(--border-subtle)'}` }}>{o.l}{o.n != null ? ` ${o.n}` : ''}</button>)}</div>;
}
function UcDrawer({ title, sub, onClose, children, width = 380 }) {
  return (
    <div style={{ width, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', background: 'var(--card)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>}</div>
        <button onClick={onClose} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{children}</div>
    </div>
  );
}
function UcProp({ k, v }) { return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span style={{ color: 'var(--text-mid)' }}>{k}</span><span style={{ color: 'var(--text-high)', textAlign: 'right', wordBreak: 'break-all' }}>{v || '—'}</span></div>; }
function UcDonut({ parts, size = 120 }) {
  const total = parts.reduce((s, p) => s + p.v, 0) || 1; const r = 46, c = 2 * Math.PI * r; let off = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="14" />
      {parts.filter(p => p.v).map((p, i) => { const len = c * p.v / total; const el = <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={p.c} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />; off += len; return el; })}
      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-high)" fontFamily="var(--font-body)">{total === 1 && !parts.some(p => p.v) ? 0 : total}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="var(--text-mid)" fontFamily="var(--font-body)">devices</text>
    </svg>
  );
}

/* ── Device table + properties drawer (Network › Devices, Protect › Devices, Access › Devices) ── */
function UcDeviceList({ assets, kinds, scopeLabel, onOpenAssets }) {
  const [q, setQ] = React.useState('');
  const [kind, setKind] = React.useState('all');
  const [sel, setSel] = React.useState(null);
  const rows = assets.filter(a => !kinds || kinds.includes(ucKind(a))).filter(a => kind === 'all' || ucKind(a) === kind).filter(a => !q || ['name', 'model', 'mfg', 'ip', 'site', 'serial'].some(k => String(a[k] || '').toLowerCase().includes(q.toLowerCase()))).map(a => ({ ...a, id: a.id || a.name, _s: ucStatus(a), _k: ucKind(a) }));
  const kindOpts = [{ id: 'all', l: 'All', n: assets.filter(a => !kinds || kinds.includes(ucKind(a))).length }, ...Object.keys(UC_KIND_LABEL).filter(k => !kinds || kinds.includes(k)).map(k => ({ id: k, l: UC_KIND_LABEL[k], n: assets.filter(a => ucKind(a) === k).length })).filter(o => o.n)];
  const setStatus = (a, s) => { assetStore.set(list => (list || []).map(x => (x.id || x.name) === a.id ? { ...x, status: s, lastSeen: ucNow() } : x)); shieldToast(`${a.name} marked ${s}`, 'ok'); setSel(p => p ? { ...p, status: s, _s: s } : p); };
  const cur = sel ? rows.find(r => r.id === sel.id) || sel : null;
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <UcSearch value={q} onChange={setQ} placeholder="Search devices" />
          <UcChips options={kindOpts} value={kind} onChange={setKind} />
          <div style={{ flex: 1 }} />
          <UcBtn kind="ghost" small onClick={onOpenAssets}>+ Add device</UcBtn>
        </div>
        <UcCard pad={0} style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <UcTable selectedId={cur && cur.id} onRow={setSel} rows={rows} empty={<UcEmpty title={`No devices documented${scopeLabel ? ` for ${scopeLabel}` : ''}`} body="Devices you record in Asset Management show up here with status, site and model. Adopt them from a job, the tech app or the Assets app." cta="Open Assets" onCta={onOpenAssets} />} cols={[
            { k: 'name', l: 'Device', render: r => <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: UC_KIND_COLOR[r._k], fontSize: 13 }}>{UC_KIND_GLYPH[r._k]}</span><span><span style={{ display: 'block', fontWeight: 600 }}>{r.name || r.model || 'Device'}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{[r.mfg, r.model].filter(Boolean).join(' ') || UC_KIND_LABEL[r._k]}</span></span></span> },
            { k: '_s', l: 'Status', render: r => <UcStatusCell s={r._s} /> },
            { k: 'ip', l: 'IP address', mono: true, dim: true },
            { k: 'site', l: 'Site', dim: true, render: r => [r.site, r.room].filter(Boolean).join(' · ') || '—' },
            { k: 'customer', l: 'Customer', dim: true },
            { k: 'uptime', l: 'Uptime', dim: true, render: r => r.uptime || 'Not monitored' },
            { k: 'lastSeen', l: 'Last change', dim: true, render: r => r.lastSeen ? ucAgo(r.lastSeen) : '—' },
          ]} />
        </UcCard>
      </div>
      {cur && (
        <UcDrawer title={cur.name || cur.model || 'Device'} sub={`${UC_KIND_LABEL[cur._k]} · ${cur.customer || ''}`} onClose={() => setSel(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><UcStatusCell s={cur._s} /><span style={{ flex: 1 }} /><span style={{ fontSize: 11, color: 'var(--text-low)' }}>{cur.lastSeen ? `changed ${ucAgo(cur.lastSeen)}` : ''}</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <UcBtn small kind="soft" onClick={() => shieldToast('Locate flashes the device LED once it is adopted on a controller — not connected yet', 'info')}>Locate</UcBtn>
            <UcBtn small kind="soft" onClick={() => shieldToast('Restart is sent to the controller when one is connected — logged as a request', 'info')}>Restart</UcBtn>
            {cur._s !== 'online' && <UcBtn small kind="ghost" onClick={() => setStatus(cur, 'online')}>Mark online</UcBtn>}
            {cur._s !== 'warning' && <UcBtn small kind="ghost" onClick={() => setStatus(cur, 'warning')}>Flag attention</UcBtn>}
            {cur._s !== 'offline' && <UcBtn small kind="danger" onClick={() => setStatus(cur, 'offline')}>Mark offline</UcBtn>}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '6px 0 2px' }}>Overview</div>
          <UcProp k="Model" v={[cur.mfg, cur.model].filter(Boolean).join(' ')} />
          <UcProp k="IP address" v={cur.ip} />
          <UcProp k="MAC / serial" v={cur.mac || cur.serial} />
          <UcProp k="Firmware" v={cur.firmware ? `${cur.firmware}${cur.fwUpdate ? ' · update available' : ''}` : ''} />
          <UcProp k="Site" v={[cur.site, cur.room].filter(Boolean).join(' · ')} />
          <UcProp k="Mount / cable" v={[cur.mount, cur.cable, cur.switchPort && `port ${cur.switchPort}`].filter(Boolean).join(' · ')} />
          <UcProp k="Tag" v={cur.tag} />
          {cur.notes && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 10, lineHeight: 1.5 }}>{cur.notes}</div>}
          <div style={{ marginTop: 14 }}><UcBtn small kind="ghost" onClick={onOpenAssets}>Open in Assets</UcBtn></div>
        </UcDrawer>
      )}
    </div>
  );
}

/* ── Sites (Site Manager pattern) ── */
function UcSitesPage({ sites, onPick }) {
  const [view, setView] = React.useState('grid');
  const [q, setQ] = React.useState('');
  const rows = sites.filter(s => !q || `${s.customer} ${s.site}`.toLowerCase().includes(q.toLowerCase()));
  const dev = sites.reduce((n, s) => n + s.devices.length, 0), on = sites.reduce((n, s) => n + s.on, 0), off = sites.reduce((n, s) => n + s.off, 0), tk = sites.reduce((n, s) => n + s.openTickets, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <UcTile label="Sites" value={sites.length} sub={`${sites.filter(s => s.verdict === 'healthy').length} healthy`} />
        <UcTile label="Devices online" value={`${on} / ${dev}`} tone={off ? 'warn' : 'ok'} />
        <UcTile label="Offline" value={off} tone={off ? 'crit' : undefined} sub={off ? 'needs a truck or a reboot' : 'all reporting'} />
        <UcTile label="Open tickets" value={tk} sub="help desk" />
        <UcTile label="ISP monitor" value="—" sub="connect a gateway to watch WAN" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <UcSearch value={q} onChange={setQ} placeholder="Search sites or customers" />
        <div style={{ flex: 1 }} />
        <UcChips options={[{ id: 'grid', l: 'Grid' }, { id: 'list', l: 'List' }]} value={view} onChange={setView} />
      </div>
      {!rows.length && <UcCard><UcEmpty title="No sites yet" body="Sites come from customers and the devices documented for them. Add a customer or record a device in Assets and it shows up here." /></UcCard>}
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12, overflow: 'auto', paddingBottom: 8 }}>
          {rows.map(s => (
            <div key={s.id} onClick={() => onPick(s)} className="st-rowcard" style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UcDot s={s.verdict} /><span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-high)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.site}</span>{s.openTickets > 0 && <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 10, background: 'var(--warn-tint-12)', color: 'var(--status-warn)' }}>{s.openTickets} open</span>}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{s.customer}{s.address ? ` · ${s.address}` : ''}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12 }}>
                {[['Devices', `${s.on}/${s.devices.length}`], ['Cameras', s.cams], ['Doors', s.doors], ['Network', s.net]].map(([l, v]) => <div key={l}><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{l}</div></div>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10.5, color: 'var(--text-low)' }}><span>ISP · not monitored</span><span>{s.verdict === 'offline' ? `${s.off} offline` : s.verdict === 'attention' ? `${s.warn} flagged` : s.verdict === 'empty' ? 'no devices' : 'healthy'}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <UcCard pad={0} style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <UcTable rows={rows} onRow={onPick} cols={[
            { k: 'site', l: 'Site', render: r => <strong>{r.site}</strong> }, { k: 'customer', l: 'Customer', dim: true }, { k: 'verdict', l: 'Status', render: r => <UcStatusCell s={r.verdict} /> },
            { k: 'devices', l: 'Devices', right: true, render: r => `${r.on} / ${r.devices.length}` }, { k: 'cams', l: 'Cameras', right: true }, { k: 'doors', l: 'Doors', right: true }, { k: 'net', l: 'Network', right: true },
            { k: 'isp', l: 'ISP', dim: true, render: () => 'Not monitored' }, { k: 'openTickets', l: 'Open tickets', right: true },
          ]} />
        </UcCard>
      )}
    </div>
  );
}

/* ── Network app ── */
function UcNetworkPage({ assets, scope, sites, go, onOpenAssets }) {
  const [tab, setTab] = React.useState('dashboard');
  const [logs] = useShieldStore(accessLogStore);
  const on = assets.filter(a => ucStatus(a) === 'online').length, warn = assets.filter(a => ucStatus(a) === 'warning').length, off = assets.length - on - warn;
  const byKind = Object.keys(UC_KIND_LABEL).map(k => ({ k, l: UC_KIND_LABEL[k], v: assets.filter(a => ucKind(a) === k).length, c: UC_KIND_COLOR[k] })).filter(p => p.v);
  const flagged = assets.filter(a => ucStatus(a) !== 'online');
  const recent = [...flagged.map(a => ({ at: a.lastSeen || 0, t: `${a.name || a.model} ${ucStatus(a) === 'offline' ? 'went offline' : 'needs attention'}`, s: ucStatus(a) })), ...(logs || []).filter(l => !scope.customer || l.customer === scope.customer).slice(0, 10).map(l => ({ at: l.at, t: `${l.door}: ${l.kind} by ${l.user}`, s: l.result === 'denied' ? 'warning' : 'online' }))].sort((a, b) => b.at - a.at).slice(0, 12);
  const exp = assets.length ? Math.round(on / assets.length * 100) : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <UcTabs value={tab} onChange={setTab} tabs={[{ id: 'dashboard', label: 'Dashboard' }, { id: 'topology', label: 'Topology' }, { id: 'devices', label: 'Devices', count: assets.length }, { id: 'clients', label: 'Clients' }, { id: 'insights', label: 'Insights' }, { id: 'settings', label: 'Settings' }]} />
      <div style={{ flex: 1, minHeight: 0, overflow: tab === 'devices' || tab === 'topology' ? 'hidden' : 'auto' }}>
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <UcTile label="Internet" value="—" sub="WAN health needs a gateway adopted" />
              <UcTile label="Devices" value={`${on} / ${assets.length}`} tone={off ? 'crit' : warn ? 'warn' : 'ok'} sub={off ? `${off} offline` : warn ? `${warn} flagged` : 'all online'} />
              <UcTile label="Clients" value="—" sub="client list needs a controller" />
              <UcTile label="Experience" value={exp == null ? '—' : `${exp}%`} tone={exp == null ? undefined : exp >= 95 ? 'ok' : exp >= 80 ? 'warn' : 'crit'} sub="share of devices reporting online" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
              <UcCard title="Devices by type">
                {!assets.length ? <UcEmpty title="No devices" body="Document devices for this site in Assets." cta="Open Assets" onCta={onOpenAssets} /> : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <UcDonut parts={byKind} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>{byKind.map(p => <div key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: p.c }} /><span style={{ flex: 1, color: 'var(--text-mid)' }}>{p.l}</span><span style={{ fontWeight: 600 }}>{p.v}</span></div>)}</div>
                  </div>)}
              </UcCard>
              <UcCard title="Recent activity" action={<UcBtn small kind="ghost" onClick={() => go('alerts')}>All alerts</UcBtn>}>
                {!recent.length ? <div style={{ fontSize: 12, color: 'var(--text-mid)', padding: '8px 0' }}>Quiet. Devices reporting online, no door events logged{scope.customer ? ` for ${scope.customer}` : ''}.</div>
                  : recent.map((r, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><UcDot s={r.s} /><span style={{ flex: 1 }}>{r.t}</span><span style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.at ? ucAgo(r.at) : ''}</span></div>)}
              </UcCard>
            </div>
            <UcCard title="Sites in scope">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{sites.map(s => <button key={s.id} onClick={() => go('sites', s)} style={{ ...ucFont, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 6, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-high)', fontSize: 12, cursor: 'pointer' }}><UcDot s={s.verdict} />{s.site}<span style={{ color: 'var(--text-low)' }}>{s.on}/{s.devices.length}</span></button>)}{!sites.length && <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>No sites in scope.</span>}</div>
            </UcCard>
          </div>
        )}
        {tab === 'topology' && (typeof TopologyView === 'function' ? <TopologyView customer={scope.customer} assets={assets} showToast={(m) => shieldToast(m, 'info')} /> : null)}
        {tab === 'devices' && <UcDeviceList assets={assets} scopeLabel={scope.site || scope.customer} onOpenAssets={onOpenAssets} />}
        {tab === 'clients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <UcCard><UcEmpty title="Client list needs a gateway or controller" body="Wired and wireless clients, their experience score and which switch port or access point they sit on come from the site's controller. Adopt the gateway in Settings › Integrations to see them here. Until then, discovery scans show what a collector can see." /></UcCard>
            {typeof NetworkDiscoveryView === 'function' && <NetworkDiscoveryView showToast={(m) => shieldToast(m, 'info')} />}
          </div>
        )}
        {tab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {typeof PortMapView === 'function' && <PortMapView showToast={(m) => shieldToast(m, 'info')} />}
            {typeof CVECenter === 'function' && <CVECenter />}
            {typeof FleetHealthPanel === 'function' && <FleetHealthPanel />}
          </div>
        )}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {typeof MicrosoftDocsView === 'function' && <MicrosoftDocsView showToast={(m) => shieldToast(m, 'info')} />}
            {typeof BitLockerView === 'function' && <BitLockerView showToast={(m) => shieldToast(m, 'info')} />}
            {typeof PasswordRotationPanel === 'function' && <PasswordRotationPanel showToast={(m) => shieldToast(m, 'info')} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Protect app ── */
function UcProtectPage({ assets, scope, onOpenAssets }) {
  const [tab, setTab] = React.useState('live');
  const [layout, setLayout] = React.useState(4);
  const [focus, setFocus] = React.useState(null);
  const [det, setDet] = React.useState('all');
  const [photos] = useShieldStore(photoStore);
  const [logs] = useShieldStore(accessLogStore);
  const [rules, setRules] = useShieldStore(alarmRuleStore);
  const cams = assets.filter(a => ucKind(a) === 'camera').map(a => ({ ...a, id: a.id || a.name, _s: ucStatus(a) }));
  const shown = focus ? cams.filter(c => c.id === focus) : cams.slice(0, layout);
  const cols = focus ? 1 : layout === 1 ? 1 : layout === 4 ? 2 : layout === 9 ? 3 : 4;
  const myPhotos = (photos || []).filter(p => !scope.customer || (p.customer || '') === scope.customer);
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const events = [
    ...assets.filter(a => ucStatus(a) !== 'online' && a.lastSeen).map(a => ({ at: a.lastSeen, kind: ucStatus(a) === 'offline' ? 'Device offline' : 'Attention', who: a.name || a.model, c: ucStatus(a) === 'offline' ? 'var(--status-critical)' : 'var(--status-warn)' })),
    ...(logs || []).filter(l => !scope.customer || l.customer === scope.customer).map(l => ({ at: l.at, kind: l.kind === 'remote-unlock' ? 'Remote unlock' : l.kind, who: `${l.door} · ${l.user}`, c: 'var(--disc-access)' })),
    ...myPhotos.filter(p => p.ts || p.at).map(p => ({ at: p.ts || p.at, kind: 'Site photo', who: p.label || p.wo || 'Tech photo', c: 'var(--disc-cctv)' })),
  ].sort((a, b) => b.at - a.at);
  const today = events.filter(e => e.at >= dayStart.getTime());
  const myRules = (rules || []).filter(r => !scope.customer || r.customer === scope.customer);
  const addRule = () => shieldModal({ kind: 'form', title: 'New alarm', submitLabel: 'Create alarm', successMsg: 'Alarm created', fields: [
    { key: 'name', label: 'Name', placeholder: 'e.g. After-hours motion at loading dock', required: true, full: true },
    { key: 'trigger', label: 'Trigger', type: 'select', options: ['Motion', 'Person', 'Vehicle', 'Package', 'Line crossing', 'Loitering', 'Known face', 'Device offline', 'Door forced', 'Door held open'] },
    { key: 'scope', label: 'Cameras / doors', placeholder: 'All, or names' },
    { key: 'schedule', label: 'Schedule', type: 'select', options: ['Always', 'After hours', 'Business hours', 'Weekends'] },
    { key: 'action', label: 'Action', type: 'select', options: ['Notify office', 'Create ticket', 'Email customer', 'Notify office + customer', 'Dispatch on-call tech'] },
  ], onSubmit: (v) => setRules(list => [{ id: genId('ALM'), customer: scope.customer || '', name: v.name, trigger: v.trigger || 'Motion', scope: v.scope || 'All', schedule: v.schedule || 'Always', action: v.action || 'Notify office', enabled: true, createdAt: ucNow() }, ...(list || [])]) });
  const toggleRule = (id, on) => setRules(list => (list || []).map(r => r.id === id ? { ...r, enabled: on } : r));
  const detOpts = [{ id: 'all', l: 'All' }, { id: 'person', l: 'Person' }, { id: 'vehicle', l: 'Vehicle' }, { id: 'package', l: 'Package' }, { id: 'line', l: 'Line crossing' }, { id: 'loiter', l: 'Loitering' }, { id: 'face', l: 'Known face' }, { id: 'plate', l: 'Licence plate' }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <UcTabs value={tab} onChange={setTab} tabs={[{ id: 'live', label: 'Live view' }, { id: 'timeline', label: 'Timeline' }, { id: 'detections', label: 'Find anything' }, { id: 'devices', label: 'Devices', count: cams.length }, { id: 'alarms', label: 'Alarm manager', count: myRules.length || undefined }]} />
      <div style={{ flex: 1, minHeight: 0, overflow: tab === 'devices' ? 'hidden' : 'auto' }}>
        {tab === 'live' && (
          <div style={{ display: 'flex', gap: 12, height: '100%', minHeight: 0 }}>
            <div style={{ width: 220, flexShrink: 0, background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'auto' }}>
              <div style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-subtle)' }}>Cameras · {cams.length}</div>
              {cams.map(c => <button key={c.id} onClick={() => setFocus(focus === c.id ? null : c.id)} style={{ ...ucFont, display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: focus === c.id ? 'var(--brand-tint-12)' : 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-high)', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}><UcDot s={c._s} /><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span></button>)}
              {!cams.length && <div style={{ padding: 12, fontSize: 11.5, color: 'var(--text-mid)' }}>No cameras documented{scope.site ? ` at ${scope.site}` : ''}.</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UcChips options={[{ id: 1, l: '1' }, { id: 4, l: '4' }, { id: 9, l: '9' }, { id: 16, l: '16' }]} value={focus ? 1 : layout} onChange={(v) => { setFocus(null); setLayout(v); }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{cams.filter(c => c._s === 'online').length} online · {cams.filter(c => c._s !== 'online').length} flagged</span>
                <div style={{ flex: 1 }} />
                <UcBtn small kind="ghost" onClick={() => shieldToast('Live streams arrive once the site NVR is connected in Settings › Integrations', 'info')}>Connect NVR</UcBtn>
              </div>
              {!cams.length ? <UcCard><UcEmpty title="No cameras to view" body="Cameras documented in Assets appear here as tiles. Live video needs the site recorder connected." cta="Open Assets" onCta={onOpenAssets} /></UcCard> : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, flex: 1, minHeight: 0, alignContent: 'start' }}>
                  {shown.map(c => (
                    <div key={c.id} onClick={() => setFocus(focus === c.id ? null : c.id)} style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b0d11', borderRadius: 6, border: `1px solid ${c._s === 'offline' ? 'var(--status-critical)' : 'var(--border-subtle)'}`, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}><div style={{ fontSize: 22, marginBottom: 4 }}>◉</div>{c._s === 'offline' ? 'Camera offline' : 'No stream · connect NVR'}</div>
                      <div style={{ position: 'absolute', left: 8, bottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}><UcDot s={c._s} size={6} />{c.name}{c.site ? <span style={{ opacity: 0.7 }}> · {c.site}</span> : null}</div>
                      <div className="mono" style={{ position: 'absolute', right: 8, top: 6, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{ucClock(ucNow())}</div>
                    </div>
                  ))}
                </div>)}
            </div>
          </div>
        )}
        {tab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <UcCard title={`Today · ${new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`} action={<span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{today.length} events</span>}>
              <div style={{ position: 'relative', height: 54, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                {[0, 3, 6, 9, 12, 15, 18, 21].map(h => <div key={h} style={{ position: 'absolute', left: `${h / 24 * 100}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--border-subtle)' }}><span className="mono" style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, color: 'var(--text-low)' }}>{h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}</span></div>)}
                {today.map((e, i) => { const d = new Date(e.at); const x = (d.getHours() * 60 + d.getMinutes()) / 1440 * 100; return <div key={i} title={`${ucClock(e.at)} ${e.kind} — ${e.who}`} style={{ position: 'absolute', left: `${x}%`, top: 22, width: 4, height: 26, borderRadius: 2, background: e.c }} />; })}
                <div style={{ position: 'absolute', left: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 1440 * 100}%`, top: 0, bottom: 0, borderLeft: '2px solid var(--brand)' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 8 }}>Recorded video and motion segments fill this strip once the NVR is connected. Markers now: device changes, door events and tech photos.</div>
            </UcCard>
            <UcCard title="Events" pad={0}>
              {!events.length ? <UcEmpty title="No events yet" body="Door unlocks, device status changes and site photos land here with a time." /> : events.slice(0, 60).map((e, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span className="mono" style={{ width: 120, color: 'var(--text-mid)', fontSize: 11.5 }}>{new Date(e.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><span style={{ width: 8, height: 8, borderRadius: 2, background: e.c }} /><span style={{ fontWeight: 600, width: 130 }}>{e.kind}</span><span style={{ color: 'var(--text-mid)', flex: 1 }}>{e.who}</span></div>)}
            </UcCard>
          </div>
        )}
        {tab === 'detections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <UcChips options={detOpts} value={det} onChange={setDet} />
            <UcCard><UcEmpty title="Smart detections need an AI recorder on site" body="Person, vehicle, package, line-crossing, loitering, face and plate detections come from the site NVR once it is connected. Known people and vehicles of interest are managed per customer." cta="Connect NVR" onCta={() => shieldToast('Add the site recorder in Settings › Integrations', 'info')} /></UcCard>
            <UcCard title={`Site photos · ${myPhotos.length}`} action={<span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>evidence captured by techs</span>}>
              {!myPhotos.length ? <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>No photos yet for this scope.</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>{myPhotos.slice(0, 24).map(p => <div key={p.id} style={{ aspectRatio: '4 / 3', borderRadius: 6, overflow: 'hidden', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', position: 'relative' }}>{p.url || p.src || p.dataUrl ? <img src={p.url || p.src || p.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}<span style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 10, color: '#fff', textShadow: '0 1px 2px #000' }}>{p.label || p.wo || ''}</span></div>)}</div>}
            </UcCard>
          </div>
        )}
        {tab === 'devices' && <UcDeviceList assets={assets} kinds={['camera', 'nvr']} scopeLabel={scope.site || scope.customer} onOpenAssets={onOpenAssets} />}
        {tab === 'alarms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>Alarms turn a detection or a device event into an action for the office, the customer or the on-call tech.</span><div style={{ flex: 1 }} /><UcBtn onClick={addRule}>+ New alarm</UcBtn></div>
            <UcCard pad={0}>
              <UcTable rows={myRules} empty={<UcEmpty title="No alarms yet" body="Create one: after-hours person at the dock → notify office and the customer; recorder offline → create a ticket." cta="New alarm" onCta={addRule} />} cols={[
                { k: 'enabled', l: '', w: 60, render: r => <UcToggle value={!!r.enabled} onChange={(v) => toggleRule(r.id, v)} /> },
                { k: 'name', l: 'Alarm', render: r => <strong>{r.name}</strong> }, { k: 'trigger', l: 'Trigger' }, { k: 'scope', l: 'Scope', dim: true }, { k: 'schedule', l: 'When', dim: true }, { k: 'action', l: 'Action' },
                { k: 'x', l: '', w: 60, render: r => <button onClick={(e) => { e.stopPropagation(); setRules(list => (list || []).filter(x => x.id !== r.id)); }} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 11.5 }}>Delete</button> },
              ]} />
            </UcCard>
            <UcCard title="Alarm history" pad={0}>
              {!events.length ? <div style={{ padding: 16, fontSize: 12, color: 'var(--text-mid)' }}>Nothing has fired yet.</div> : events.slice(0, 20).map((e, i) => <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span className="mono" style={{ color: 'var(--text-mid)', fontSize: 11.5, width: 120 }}>{new Date(e.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><span style={{ fontWeight: 600 }}>{e.kind}</span><span style={{ color: 'var(--text-mid)' }}>{e.who}</span></div>)}
            </UcCard>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Access app ── */
function UcAccessPage({ assets, scope, onOpenAssets }) {
  const [tab, setTab] = React.useState('doors');
  const [users, setUsers] = useShieldStore(accessUserStore);
  const [visitors, setVisitors] = useShieldStore(accessVisitorStore);
  const [policies, setPolicies] = useShieldStore(accessPolicyStore);
  const [logs, setLogs] = useShieldStore(accessLogStore);
  const [os, setOs] = useShieldStore(osConsoleStore);
  const inScope = (r) => !scope.customer || (r.customer || '') === scope.customer;
  const doors = assets.filter(a => ucKind(a) === 'access').map(a => ({ ...a, id: a.id || a.name, _s: ucStatus(a) }));
  const locks = (os || {}).locks || {};
  const log = (door, kind, result = 'granted', user = ucMe()) => setLogs(list => [{ id: genId('ACL'), customer: door.customer || scope.customer || '', site: door.site || '', door: door.name, user, kind, result, at: ucNow() }, ...(list || [])].slice(0, 2000));
  const setLock = (door, state) => { setOs(o => ({ ...(o || {}), locks: { ...((o || {}).locks || {}), [door.id]: state } })); log(door, state === 'unlocked' ? 'remote-unlock' : state === 'open' ? 'keep-open' : 'lock'); shieldToast(state === 'unlocked' ? `${door.name} unlocked for 5 seconds — the controller receives this once connected` : state === 'open' ? `${door.name} held open` : `${door.name} locked`, 'ok'); if (state === 'unlocked') setTimeout(() => setOs(o => ({ ...(o || {}), locks: { ...((o || {}).locks || {}), [door.id]: 'locked' } })), 5000); };
  const addUser = () => shieldModal({ kind: 'form', title: 'New user', submitLabel: 'Add user', successMsg: 'User added', fields: [
    { key: 'name', label: 'Name', required: true, full: true }, { key: 'group', label: 'Group', type: 'select', options: ['Staff', 'Management', 'Cleaning', 'Contractor', 'Security'] },
    { key: 'cred', label: 'Credential', type: 'select', options: ['Mobile (app)', 'NFC card', 'PIN', 'Mobile + card', 'Face'] }, { key: 'pin', label: 'PIN (optional)' }, { key: 'email', label: 'Email' },
  ], onSubmit: (v) => setUsers(list => [{ id: genId('ACU'), customer: scope.customer || '', name: v.name, group: v.group || 'Staff', cred: v.cred || 'Mobile (app)', pin: v.pin || '', email: v.email || '', status: 'active', createdAt: ucNow() }, ...(list || [])]) });
  const addVisitor = () => shieldModal({ kind: 'form', title: 'New visitor', submitLabel: 'Issue pass', successMsg: 'Visitor pass issued', fields: [
    { key: 'name', label: 'Visitor', required: true, full: true }, { key: 'host', label: 'Host', placeholder: ucMe() }, { key: 'doors', label: 'Doors', placeholder: doors.map(d => d.name).slice(0, 3).join(', ') || 'Front door' },
    { key: 'from', label: 'From', type: 'date' }, { key: 'to', label: 'To', type: 'date' },
  ], onSubmit: (v) => setVisitors(list => [{ id: genId('ACV'), customer: scope.customer || '', name: v.name, host: v.host || ucMe(), doors: v.doors || 'All', from: v.from || new Date().toISOString().slice(0, 10), to: v.to || new Date().toISOString().slice(0, 10), pin: String(Math.floor(100000 + Math.random() * 900000)), createdAt: ucNow() }, ...(list || [])]) });
  const addPolicy = () => shieldModal({ kind: 'form', title: 'New access policy', submitLabel: 'Create policy', successMsg: 'Policy created', fields: [
    { key: 'name', label: 'Name', placeholder: 'e.g. Staff · business hours', required: true, full: true }, { key: 'groups', label: 'Groups', placeholder: 'Staff, Management' }, { key: 'doors', label: 'Doors', placeholder: 'All doors' },
    { key: 'schedule', label: 'Schedule', type: 'select', options: ['Always', 'Business hours (8–6)', 'Extended (6–10)', 'Weekdays', 'Weekends', 'Custom'] },
  ], onSubmit: (v) => setPolicies(list => [{ id: genId('ACP'), customer: scope.customer || '', name: v.name, groups: v.groups || 'All', doors: v.doors || 'All doors', schedule: v.schedule || 'Always', createdAt: ucNow() }, ...(list || [])]) });
  const myUsers = (users || []).filter(inScope), myVisitors = (visitors || []).filter(inScope), myPolicies = (policies || []).filter(inScope), myLogs = (logs || []).filter(inScope);
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <UcTabs value={tab} onChange={setTab} tabs={[{ id: 'doors', label: 'Doors', count: doors.length }, { id: 'users', label: 'Users', count: myUsers.length || undefined }, { id: 'visitors', label: 'Visitors', count: myVisitors.filter(v => v.to >= todayIso).length || undefined }, { id: 'policies', label: 'Policies' }, { id: 'logs', label: 'Logs' }, { id: 'devices', label: 'Devices' }]} />
      <div style={{ flex: 1, minHeight: 0, overflow: tab === 'devices' ? 'hidden' : 'auto' }}>
        {tab === 'doors' && (!doors.length ? <UcCard><UcEmpty title="No doors documented" body="Readers, hubs and doors recorded in Assets (type: Access Reader / Door) show here with remote unlock, hold-open and the event log." cta="Open Assets" onCta={onOpenAssets} /></UcCard> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {doors.map(d => { const st = locks[d.id] || 'locked'; return (
              <div key={d.id} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UcDot s={d._s} /><span style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}>{d.name}</span><span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: st === 'locked' ? 'var(--ok-tint-12)' : 'var(--warn-tint-12)', color: st === 'locked' ? 'var(--status-ok)' : 'var(--status-warn)', fontWeight: 600 }}>{st === 'locked' ? 'Locked' : st === 'open' ? 'Held open' : 'Unlocked'}</span></div>
                <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{[d.site, d.room].filter(Boolean).join(' · ') || d.customer}{d.model ? ` · ${d.model}` : ''}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <UcBtn small onClick={() => setLock(d, 'unlocked')} disabled={d._s === 'offline'}>Unlock</UcBtn>
                  <UcBtn small kind="ghost" onClick={() => setLock(d, st === 'open' ? 'locked' : 'open')} disabled={d._s === 'offline'}>{st === 'open' ? 'Lock' : 'Hold open'}</UcBtn>
                  <div style={{ flex: 1 }} />
                  <UcBtn small kind="ghost" onClick={() => { setTab('logs'); }}>Log</UcBtn>
                </div>
                {d._s === 'offline' && <div style={{ fontSize: 11, color: 'var(--status-critical)', marginTop: 8 }}>Reader offline — remote actions disabled.</div>}
              </div>); })}
          </div>))}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex' }}><div style={{ flex: 1 }} /><UcBtn onClick={addUser}>+ Add user</UcBtn></div>
            <UcCard pad={0}><UcTable rows={myUsers} empty={<UcEmpty title="No access users yet" body="People who hold a credential at this customer: staff, cleaners, contractors. Add one with a mobile, card or PIN credential." cta="Add user" onCta={addUser} />} cols={[
              { k: 'name', l: 'Name', render: r => <strong>{r.name}</strong> }, { k: 'group', l: 'Group', dim: true }, { k: 'cred', l: 'Credential' }, { k: 'email', l: 'Email', dim: true }, { k: 'status', l: 'Status', render: r => <UcStatusCell s={r.status === 'active' ? 'online' : 'offline'} /> },
              { k: 'x', l: '', w: 110, render: r => <span style={{ display: 'flex', gap: 6 }}><button onClick={() => setUsers(list => (list || []).map(x => x.id === r.id ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' } : x))} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 11.5 }}>{r.status === 'active' ? 'Suspend' : 'Activate'}</button><button onClick={() => setUsers(list => (list || []).filter(x => x.id !== r.id))} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 11.5 }}>Remove</button></span> },
            ]} /></UcCard>
          </div>)}
        {tab === 'visitors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex' }}><div style={{ flex: 1 }} /><UcBtn onClick={addVisitor}>+ New visitor</UcBtn></div>
            <UcCard pad={0}><UcTable rows={myVisitors} empty={<UcEmpty title="No visitor passes" body="Issue a time-boxed PIN for a delivery, an inspector or a contractor. The pass expires on its own." cta="New visitor" onCta={addVisitor} />} cols={[
              { k: 'name', l: 'Visitor', render: r => <strong>{r.name}</strong> }, { k: 'host', l: 'Host', dim: true }, { k: 'doors', l: 'Doors', dim: true }, { k: 'from', l: 'From', mono: true }, { k: 'to', l: 'To', mono: true }, { k: 'pin', l: 'PIN', mono: true },
              { k: 'st', l: 'Status', render: r => <UcStatusCell s={r.to >= todayIso ? 'online' : 'offline'} /> },
              { k: 'x', l: '', w: 70, render: r => <button onClick={() => setVisitors(list => (list || []).filter(x => x.id !== r.id))} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 11.5 }}>Revoke</button> },
            ]} /></UcCard>
          </div>)}
        {tab === 'policies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex' }}><div style={{ flex: 1 }} /><UcBtn onClick={addPolicy}>+ New policy</UcBtn></div>
            <UcCard pad={0}><UcTable rows={myPolicies} empty={<UcEmpty title="No access policies" body="A policy says which groups open which doors on which schedule. Start with Staff · business hours." cta="New policy" onCta={addPolicy} />} cols={[
              { k: 'name', l: 'Policy', render: r => <strong>{r.name}</strong> }, { k: 'groups', l: 'Groups' }, { k: 'doors', l: 'Doors', dim: true }, { k: 'schedule', l: 'Schedule', dim: true },
              { k: 'x', l: '', w: 70, render: r => <button onClick={() => setPolicies(list => (list || []).filter(x => x.id !== r.id))} style={{ ...ucFont, background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 11.5 }}>Delete</button> },
            ]} /></UcCard>
          </div>)}
        {tab === 'logs' && (
          <UcCard pad={0}><UcTable rows={myLogs.slice(0, 300)} empty={<UcEmpty title="No access events" body="Remote unlocks, hold-opens and (once the controller is connected) every badge, PIN and denied attempt list here." />} cols={[
            { k: 'at', l: 'Time', mono: true, dim: true, render: r => new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }, { k: 'door', l: 'Door', render: r => <strong>{r.door}</strong> }, { k: 'site', l: 'Site', dim: true }, { k: 'user', l: 'User' }, { k: 'kind', l: 'Event', dim: true },
            { k: 'result', l: 'Result', render: r => <UcStatusCell s={r.result === 'denied' ? 'warning' : 'online'} /> },
          ]} /></UcCard>)}
        {tab === 'devices' && <UcDeviceList assets={assets} kinds={['access', 'alarm']} scopeLabel={scope.site || scope.customer} onOpenAssets={onOpenAssets} />}
      </div>
    </div>
  );
}

/* ── Alerts (every app's flagged state in one list; acknowledge + ticket) ── */
function UcAlertsPage({ assets, scope, go }) {
  const [os, setOs] = useShieldStore(osConsoleStore);
  const [, setTickets] = useShieldStore(ticketStore);
  const [f, setF] = React.useState('open');
  const acked = (os || {}).acked || {};
  const alerts = assets.filter(a => ucStatus(a) !== 'online').map(a => ({ id: a.id || a.name, sev: ucStatus(a) === 'offline' ? 'critical' : 'warning', title: `${ucStatus(a) === 'offline' ? 'Device offline' : 'Needs attention'} · ${a.name || a.model || 'Device'}`, detail: [UC_KIND_LABEL[ucKind(a)], a.site, a.ip].filter(Boolean).join(' · '), customer: a.customer, at: a.lastSeen, a }));
  const rows = alerts.filter(x => f === 'all' || (f === 'open' ? !acked[x.id] : acked[x.id]));
  const ack = (id) => setOs(o => ({ ...(o || {}), acked: { ...((o || {}).acked || {}), [id]: ucNow() } }));
  const ticket = (x) => { const id = 'TKT-' + Date.now().toString(36).toUpperCase(); setTickets(list => [{ id, ref: id, priority: x.sev === 'critical' ? 'critical' : 'high', status: 'open', customer: x.customer || scope.customer || '', contact: '', subject: x.title, created: Date.now(), source: 'ShieldTech OS', sla: { total: x.sev === 'critical' ? 4 : 8, remaining: x.sev === 'critical' ? 4 : 8 }, messages: [{ from: 'ShieldTech OS', text: x.detail, at: Date.now() }] }, ...(list || [])]); ack(x.id); shieldToast(`${id} opened in Help Desk`, 'ok'); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <UcTile label="Critical" value={alerts.filter(x => x.sev === 'critical' && !acked[x.id]).length} tone="crit" />
        <UcTile label="Attention" value={alerts.filter(x => x.sev === 'warning' && !acked[x.id]).length} tone="warn" />
        <UcTile label="Acknowledged" value={alerts.filter(x => acked[x.id]).length} />
        <UcTile label="Sites affected" value={new Set(alerts.map(x => `${x.customer}|${x.a.site}`)).size} />
      </div>
      <UcChips options={[{ id: 'open', l: 'Open' }, { id: 'acked', l: 'Acknowledged' }, { id: 'all', l: 'All' }]} value={f} onChange={setF} />
      <UcCard pad={0}>
        {!rows.length ? <UcEmpty title={f === 'open' ? 'No open alerts' : 'Nothing here'} body={`Every device documented${scope.customer ? ` for ${scope.customer}` : ''} reports online. Alerts raise when a device is flagged offline or for attention — by a tech, the office or a connected controller.`} /> : rows.map(x => (
          <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)', borderLeft: `3px solid ${x.sev === 'critical' ? 'var(--status-critical)' : 'var(--status-warn)'}` }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{x.title}</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{x.customer}{x.detail ? ` · ${x.detail}` : ''}{x.at ? ` · ${ucAgo(x.at)}` : ''}</div></div>
            {acked[x.id] ? <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: 'var(--ok-tint-12)', color: 'var(--status-ok)', fontWeight: 600 }}>ACK {ucAgo(acked[x.id])}</span> : <UcBtn small kind="ghost" onClick={() => ack(x.id)}>Acknowledge</UcBtn>}
            <UcBtn small kind="soft" onClick={() => ticket(x)}>Create ticket</UcBtn>
            <UcBtn small kind="ghost" onClick={() => { if (window.__shieldNav) window.__shieldNav('dispatch'); }}>Dispatch</UcBtn>
          </div>))}
      </UcCard>
    </div>
  );
}

/* ── Settings ── */
function UcSettingsPage() {
  const [os, setOs] = useShieldStore(osConsoleStore);
  const [prefs, setPrefs] = useShieldStore(userPrefsStore);
  const n = (os || {}).notify || {};
  const setN = (k, v) => setOs(o => ({ ...(o || {}), notify: { ...((o || {}).notify || {}), [k]: v } }));
  const theme = (prefs || {}).theme || 'system';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, alignContent: 'start' }}>
      <UcCard title="Appearance">
        <UcChips options={[{ id: 'system', l: 'System' }, { id: 'light', l: 'Light' }, { id: 'dark', l: 'Dark' }]} value={theme} onChange={(v) => setPrefs(p => ({ ...(p || {}), theme: v }))} />
        <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 10 }}>Follows the console pattern: light by day, dark at night, one blue everywhere.</div>
      </UcCard>
      <UcCard title="Notifications">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <UcToggle value={!!n.offline} onChange={(v) => setN('offline', v)} label="Device goes offline" />
          <UcToggle value={!!n.alarms} onChange={(v) => setN('alarms', v)} label="Alarm fires (Protect)" />
          <UcToggle value={!!n.access} onChange={(v) => setN('access', v)} label="Door events (Access)" />
          <UcToggle value={!!n.digest} onChange={(v) => setN('digest', v)} label="Daily site digest" />
        </div>
      </UcCard>
      <UcCard title="Integrations">
        <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 10 }}>Connect a customer's controller so devices, clients, streams and door events arrive live instead of from the registry. Keys stay on the office backend; this only records where the controller lives.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={(os || {}).unifiHost || ''} onChange={e => setOs(o => ({ ...(o || {}), unifiHost: e.target.value }))} placeholder="Site Manager host or console address" style={{ ...ucFont, flex: 1, padding: '7px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none' }} />
          <UcBtn onClick={() => shieldToast((os || {}).unifiHost ? 'Saved. Ask the office to add the controller API key on the backend to go live.' : 'Enter the controller address first', 'info')}>Save</UcBtn>
        </div>
        <div style={{ marginTop: 12 }}><UcToggle value={!!(os || {}).isp} onChange={(v) => { setOs(o => ({ ...(o || {}), isp: v })); if (v) shieldToast('ISP monitoring starts once a gateway reports in', 'info'); }} label="ISP monitor (latency, uptime, packet loss)" /></div>
      </UcCard>
      <UcCard title="About">
        <UcProp k="Console" v="ShieldTech OS" />
        <UcProp k="Pattern" v="UniFi-family layout on ShieldTech data" />
        <UcProp k="Data" v="Assets · Customers · Tickets · Photos · Access logs" />
      </UcCard>
    </div>
  );
}

/* ── The console ── */
const UC_APPS = [
  { id: 'sites', l: 'Sites', g: '⌂' }, { id: 'network', l: 'Network', g: '⊚' }, { id: 'protect', l: 'Protect', g: '◉' }, { id: 'access', l: 'Access', g: '⊠' },
  { id: 'alerts', l: 'Alerts', g: '◬' }, { id: 'assets', l: 'Assets', g: '▤' }, { id: 'settings', l: 'Settings', g: '⚙' },
];
function ShieldOSConsole({ initial }) {
  const [app, setApp] = React.useState(initial && UC_APPS.some(a => a.id === initial) ? initial : 'sites');
  const [scope, setScope] = React.useState({ customer: null, site: null });
  const [pick, setPick] = React.useState(false);
  const [q, setQ] = React.useState('');
  const sites = useUcSites();
  const [allAssets] = useShieldStore(assetStore);
  const assets = (allAssets || []).filter(a => (!scope.customer || a.customer === scope.customer) && (!scope.site || (a.site || 'Main site') === scope.site));
  const scopedSites = sites.filter(s => (!scope.customer || s.customer === scope.customer) && (!scope.site || s.site === scope.site));
  const alertCount = assets.filter(a => ucStatus(a) !== 'online').length;
  const go = (id, site) => { if (site) setScope({ customer: site.customer, site: site.site }); setApp(id === 'sites' && site ? 'network' : id); };
  const onOpenAssets = () => setApp('assets');
  const customers = [...new Set(sites.map(s => s.customer))];
  const label = scope.site ? `${scope.site} · ${scope.customer}` : scope.customer || 'All sites';
  const verdictOf = scope.site ? (scopedSites[0] || {}).verdict : scopedSites.some(s => s.verdict === 'offline') ? 'offline' : scopedSites.some(s => s.verdict === 'attention') ? 'attention' : scopedSites.length ? 'healthy' : 'empty';
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      {/* App rail */}
      <div style={{ width: 64, flexShrink: 0, background: 'var(--rail-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 2 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, marginBottom: 10, letterSpacing: '-0.02em' }}>ST</div>
        {UC_APPS.map(a => (
          <button key={a.id} title={a.l} onClick={() => setApp(a.id)} style={{ ...ucFont, width: 56, padding: '8px 0 6px', borderRadius: 8, background: app === a.id ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: app === a.id ? '#fff' : 'var(--rail-fg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>{a.g}</span>
            <span style={{ fontSize: 9.5, fontWeight: 600 }}>{a.l}</span>
            {a.id === 'alerts' && alertCount > 0 && <span style={{ position: 'absolute', top: 4, right: 8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--status-critical)', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{alertCount}</span>}
            {app === a.id && <span style={{ position: 'absolute', left: -4, top: 10, bottom: 10, width: 3, borderRadius: 2, background: 'var(--brand)' }} />}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{(window.__shieldUser || {}).initials || 'ST'}</div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--card)', flexShrink: 0, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setPick(!pick)} style={{ ...ucFont, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 240 }}><UcDot s={verdictOf} /><span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span><span style={{ color: 'var(--text-low)', fontSize: 10 }}>▾</span></button>
            {pick && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 340, maxHeight: 380, overflow: 'auto', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 8, zIndex: 50, boxShadow: '0 12px 32px rgba(0,0,0,0.35)', padding: 6 }}>
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Find a site or customer" style={{ ...ucFont, width: '100%', padding: '7px 10px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none', marginBottom: 6 }} />
                <button onClick={() => { setScope({ customer: null, site: null }); setPick(false); }} style={{ ...ucFont, display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', background: !scope.customer ? 'var(--brand-tint-12)' : 'none', border: 'none', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>All sites <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>· {sites.length}</span></button>
                {customers.filter(c => !q || c.toLowerCase().includes(q.toLowerCase()) || sites.some(s => s.customer === c && s.site.toLowerCase().includes(q.toLowerCase()))).map(c => (
                  <div key={c}>
                    <button onClick={() => { setScope({ customer: c, site: null }); setPick(false); }} style={{ ...ucFont, display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 10px', background: scope.customer === c && !scope.site ? 'var(--brand-tint-12)' : 'none', border: 'none', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>{c}</button>
                    {sites.filter(s => s.customer === c).map(s => <button key={s.id} onClick={() => { setScope({ customer: c, site: s.site }); setPick(false); }} style={{ ...ucFont, display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '6px 10px 6px 22px', background: scope.site === s.site && scope.customer === c ? 'var(--brand-tint-12)' : 'none', border: 'none', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer' }}><UcDot s={s.verdict} size={6} />{s.site}<span style={{ marginLeft: 'auto', color: 'var(--text-low)', fontSize: 11 }}>{s.on}/{s.devices.length}</span></button>)}
                  </div>))}
              </div>)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{assets.filter(a => ucStatus(a) === 'online').length} online · {alertCount} flagged · {scopedSites.length} {scopedSites.length === 1 ? 'site' : 'sites'}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)', letterSpacing: '-0.01em' }}>ShieldTech OS <span style={{ color: 'var(--text-low)', fontWeight: 500 }}>· {UC_APPS.find(a => a.id === app).l}</span></div>
          <button onClick={() => setApp('alerts')} title="Alerts" style={{ ...ucFont, position: 'relative', width: 32, height: 32, borderRadius: 6, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', cursor: 'pointer', fontSize: 14 }}>◬{alertCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--status-critical)', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{alertCount}</span>}</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, padding: 14, overflow: ['network', 'protect', 'access', 'assets'].includes(app) ? 'hidden' : 'auto' }} onClick={() => pick && setPick(false)}>
          {app === 'sites' && <UcSitesPage sites={scopedSites} onPick={(s) => go('sites', s)} />}
          {app === 'network' && <UcNetworkPage assets={assets} scope={scope} sites={scopedSites} go={go} onOpenAssets={onOpenAssets} />}
          {app === 'protect' && <UcProtectPage assets={assets} scope={scope} onOpenAssets={onOpenAssets} />}
          {app === 'access' && <UcAccessPage assets={assets} scope={scope} onOpenAssets={onOpenAssets} />}
          {app === 'alerts' && <UcAlertsPage assets={assets} scope={scope} go={go} />}
          {app === 'assets' && <div style={{ height: '100%', overflow: 'auto' }}>{typeof AssetsScreen === 'function' ? <AssetsScreen /> : null}</div>}
          {app === 'settings' && <UcSettingsPage />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ShieldOSConsole, UcDeviceList, UcSitesPage, UcNetworkPage, UcProtectPage, UcAccessPage, UcAlertsPage, UcSettingsPage,
  UcBtn, UcToggle, UcTabs, UcCard, UcTile, UcEmpty, UcTable, UcDot, UcStatusCell, UcSearch, UcChips, UcDrawer, UcProp, UcDonut,
  accessUserStore, accessVisitorStore, accessPolicyStore, accessLogStore, alarmRuleStore, osConsoleStore, useUcSites,
  ucStatus, ucKind, ucAgo, UC_APPS, UC_KIND_LABEL, UC_KIND_COLOR, UC_KIND_GLYPH,
});

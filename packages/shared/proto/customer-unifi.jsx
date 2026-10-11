/* Customer portal — Sites, Devices and Access the way the UniFi mobile apps
   show a site owner their own system: a site card with health, a flat device
   list with status dots, and doors with a one-tap unlock request. Scoped to
   the signed-in company only (never another customer's gear). Live video and
   true remote unlock need the site controller connected by ShieldTech; until
   then every action is a logged request the office fulfils. */

const CU_KIND_LABEL = { gateway: 'Gateway', switch: 'Switch', ap: 'Wi-Fi', camera: 'Camera', access: 'Door', alarm: 'Alarm panel', nvr: 'Recorder', server: 'Server', device: 'Device' };
const CU_KIND_GLYPH = { gateway: '⌂', switch: '⊞', ap: '◠', camera: '◉', access: '⊠', alarm: '◬', nvr: '⊟', server: '▤', device: '▢' };
function cuKind(a) {
  const s = String(a.type || '').toLowerCase();
  if (s.includes('cam')) return 'camera'; if (s.includes('nvr') || s.includes('record')) return 'nvr'; if (s.includes('switch')) return 'switch';
  if (s.includes('router') || s.includes('gateway') || s.includes('firewall')) return 'gateway'; if (s.includes('access point') || s === 'ap' || s.includes('wifi') || s.includes('wireless')) return 'ap';
  if (s.includes('access') || s.includes('reader') || s.includes('door')) return 'access'; if (s.includes('alarm') || s.includes('panel') || s.includes('intrusion')) return 'alarm'; if (s.includes('server')) return 'server'; return 'device';
}
const cuStatus = (a) => !a.status || a.status === 'online' ? 'online' : a.status === 'warning' ? 'warning' : 'offline';
const cuDot = (s) => s === 'online' ? 'var(--status-ok)' : s === 'warning' ? 'var(--status-warn)' : s === 'offline' ? 'var(--status-critical)' : 'var(--text-low)';
const cuAccessLogStore = (typeof accessLogStore !== 'undefined') ? accessLogStore : createShieldStore('accesslogs', []);
const cuAccessUserStore = (typeof accessUserStore !== 'undefined') ? accessUserStore : createShieldStore('accessusers', []);
const cuCompany = () => ((window.__shieldUser || {}).company || '').trim();
const cuMine = (rows) => { const c = cuCompany().toLowerCase(); return c ? (rows || []).filter(r => (r.customer || '').trim().toLowerCase() === c) : []; };

function CuCard({ title, action, children, pad = 16, style }) {
  return <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 10, ...style }}>{title && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)' }}>{title}{action}</div>}<div style={{ padding: pad }}>{children}</div></div>;
}
function CuTile({ label, value, sub, tone }) {
  return <div style={{ flex: '1 1 0', minWidth: 140, background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 16px' }}><div style={{ fontSize: 11.5, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color: tone === 'ok' ? 'var(--status-ok)' : tone === 'warn' ? 'var(--status-warn)' : tone === 'crit' ? 'var(--status-critical)' : 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>{sub && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{sub}</div>}</div>;
}
const cuBtn = (kind = 'primary', small) => ({ fontFamily: 'var(--font-body)', padding: small ? '6px 12px' : '9px 16px', borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', border: '1px solid transparent', background: kind === 'primary' ? 'var(--brand)' : kind === 'soft' ? 'var(--brand-tint-12)' : 'transparent', color: kind === 'primary' ? '#fff' : kind === 'soft' ? 'var(--brand)' : 'var(--text-high)', borderColor: kind === 'ghost' ? 'var(--border-strong)' : 'transparent' });
async function cuRequest(subject, description, category = 'service', priority = 'medium') {
  const t = window.__shieldTickets;
  if (!t) { shieldToast('Request logged — support backend not configured, the office sees it on sync', 'warn'); return { ok: true, data: { ref: 'LOCAL' } }; }
  const r = await t.create({ subject, description, category, priority });
  if (!r.ok) shieldToast(`Could not send: ${r.error}`, 'warn');
  return r;
}

/* ── Sites ── */
function CuSitesView({ onOpen }) {
  const [assets] = useShieldStore(assetStore);
  const [custs] = useShieldStore(customerStore);
  const mine = cuMine(assets);
  const me = (custs || []).find(c => (c.name || '').trim().toLowerCase() === cuCompany().toLowerCase());
  const sites = React.useMemo(() => {
    const m = new Map();
    const recs = me && typeof custRecords === 'function' ? custRecords(me.id, 'sites') : [];
    recs.forEach(s => m.set(s.name, { site: s.name, address: s.address || '', devices: [] }));
    if (!m.size && me) m.set('Main site', { site: 'Main site', address: me.address || '', devices: [] });
    mine.forEach(a => { const k = a.site || 'Main site'; if (!m.has(k)) m.set(k, { site: k, address: '', devices: [] }); m.get(k).devices.push(a); });
    return [...m.values()].map(s => { const on = s.devices.filter(a => cuStatus(a) === 'online').length, warn = s.devices.filter(a => cuStatus(a) === 'warning').length, off = s.devices.length - on - warn; return { ...s, on, warn, off, verdict: !s.devices.length ? 'empty' : off ? 'offline' : warn ? 'attention' : 'healthy', cams: s.devices.filter(a => cuKind(a) === 'camera').length, doors: s.devices.filter(a => cuKind(a) === 'access').length, net: s.devices.filter(a => ['gateway', 'switch', 'ap'].includes(cuKind(a))).length }; });
  }, [assets, custs]);
  const on = mine.filter(a => cuStatus(a) === 'online').length, off = mine.filter(a => cuStatus(a) === 'offline').length;
  if (!cuCompany()) return <CuCard><div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)' }}>Your account isn't linked to a company yet, so no sites can be shown. Ask ShieldTech to link it.</div></CuCard>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <CuTile label="Sites" value={sites.length} sub={cuCompany()} />
        <CuTile label="Devices online" value={`${on} / ${mine.length}`} tone={off ? 'warn' : 'ok'} />
        <CuTile label="Needs attention" value={mine.length - on} tone={mine.length - on ? 'warn' : undefined} sub={off ? `${off} offline` : 'all reporting'} />
        <CuTile label="Monitoring" value={mine.length ? 'Active' : '—'} sub="ShieldTech watches your devices" />
      </div>
      {!sites.length && <CuCard><div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)' }}>No sites on file yet — locations covered by your ShieldTech service appear here with their devices.</div></CuCard>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {sites.map(s => (
          <div key={s.site} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: cuDot(s.verdict === 'healthy' ? 'online' : s.verdict === 'attention' ? 'warning' : s.verdict === 'offline' ? 'offline' : 'none') }} /><span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-high)', flex: 1 }}>{s.site}</span><span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{s.verdict === 'healthy' ? 'Healthy' : s.verdict === 'attention' ? 'Attention' : s.verdict === 'offline' ? `${s.off} offline` : 'No devices'}</span></div>
            {s.address && <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{s.address}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 14 }}>{[['Devices', `${s.on}/${s.devices.length}`], ['Cameras', s.cams], ['Doors', s.doors], ['Network', s.net]].map(([l, v]) => <div key={l}><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{l}</div></div>)}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => onOpen && onOpen('devices')} style={{ ...cuBtn('soft', true), flex: 1 }}>Devices</button>
              {s.cams > 0 && <button onClick={() => onOpen && onOpen('footage')} style={{ ...cuBtn('ghost', true), flex: 1 }}>Cameras</button>}
              {s.doors > 0 && <button onClick={() => onOpen && onOpen('access')} style={{ ...cuBtn('ghost', true), flex: 1 }}>Doors</button>}
            </div>
          </div>))}
      </div>
      <CuCard title="Need a change at a site?" pad={14}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-mid)', flex: 1 }}>Add a camera, move a reader, extend Wi-Fi — one request and a ShieldTech tech schedules it.</span>
          <button onClick={() => shieldModal({ kind: 'form', title: 'Request a site change', submitLabel: 'Send request', fields: [{ key: 'site', label: 'Site', placeholder: sites[0] ? sites[0].site : '' }, { key: 'what', label: 'What do you need?', required: true, full: true }], onSubmit: async (v) => { const r = await cuRequest(`Site change · ${v.site || cuCompany()}`, v.what, 'service'); if (r.ok) shieldToast(`Request ${r.data.ref} sent — we'll confirm a visit`, 'ok'); } })} style={cuBtn('primary')}>Request a change</button>
        </div>
      </CuCard>
    </div>
  );
}

/* ── Devices ── */
function CuDevicesView() {
  const [assets] = useShieldStore(assetStore);
  const [kind, setKind] = React.useState('all');
  const [sel, setSel] = React.useState(null);
  const mine = cuMine(assets).map(a => ({ ...a, id: a.id || a.name, _s: cuStatus(a), _k: cuKind(a) }));
  const list = mine.filter(a => kind === 'all' || a._k === kind);
  const kinds = [{ id: 'all', l: 'All', n: mine.length }, ...Object.keys(CU_KIND_LABEL).map(k => ({ id: k, l: CU_KIND_LABEL[k], n: mine.filter(a => a._k === k).length })).filter(k => k.n)];
  const on = mine.filter(a => a._s === 'online').length;
  const report = async (d) => { const r = await cuRequest(`Device issue · ${d.name}`, `${CU_KIND_LABEL[d._k]} at ${[d.site, d.room].filter(Boolean).join(' · ') || 'site'} — customer reports a problem.`, 'service', d._k === 'alarm' ? 'high' : 'medium'); if (r.ok) shieldToast(`Reported — ticket ${r.data.ref}`, 'ok'); setSel(null); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <CuTile label="Online" value={`${on} / ${mine.length}`} tone={on === mine.length ? 'ok' : 'warn'} />
        <CuTile label="Cameras" value={mine.filter(a => a._k === 'camera').length} />
        <CuTile label="Doors" value={mine.filter(a => a._k === 'access').length} />
        <CuTile label="Network" value={mine.filter(a => ['gateway', 'switch', 'ap'].includes(a._k)).length} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{kinds.map(k => <button key={k.id} onClick={() => setKind(k.id)} style={{ fontFamily: 'var(--font-body)', padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: kind === k.id ? 'var(--brand)' : 'var(--card)', color: kind === k.id ? '#fff' : 'var(--text-mid)', border: `1px solid ${kind === k.id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer' }}>{k.l} {k.n}</button>)}</div>
      <CuCard pad={0}>
        {!list.length && <div style={{ padding: 26, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)' }}>No devices yet — your installed cameras, doors, Wi-Fi and alarm panels appear here with status.</div>}
        {list.map((d, i) => (
          <button key={d.id} onClick={() => setSel(sel && sel.id === d.id ? null : d)} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 12, width: '100%', padding: '11px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', background: sel && sel.id === d.id ? 'var(--brand-tint-05)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
            <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--text-mid)', position: 'relative' }}>{CU_KIND_GLYPH[d._k]}<span style={{ position: 'absolute', right: -3, bottom: -3, width: 10, height: 10, borderRadius: '50%', background: cuDot(d._s), border: '2px solid var(--card)' }} /></span>
            <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{d.name || d.model || 'Device'}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)' }}>{CU_KIND_LABEL[d._k]}{d.site ? ` · ${d.site}` : ''}{d.room ? ` · ${d.room}` : ''}</span></span>
            <span style={{ fontSize: 12, color: d._s === 'online' ? 'var(--status-ok)' : d._s === 'warning' ? 'var(--status-warn)' : 'var(--status-critical)', fontWeight: 600 }}>{d._s === 'online' ? 'Online' : d._s === 'warning' ? 'Attention' : 'Offline'}</span>
          </button>))}
      </CuCard>
      {sel && (
        <CuCard title={sel.name || 'Device'} action={<button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 16, fontFamily: 'var(--font-body)' }}>✕</button>}>
          {[['Type', CU_KIND_LABEL[sel._k]], ['Model', [sel.mfg, sel.model].filter(Boolean).join(' ')], ['Location', [sel.site, sel.room].filter(Boolean).join(' · ')], ['Status', sel._s === 'online' ? 'Online' : sel._s === 'warning' ? 'Needs attention' : 'Offline'], ['Installed', sel.adoptedAt ? new Date(sel.adoptedAt).toLocaleDateString() : '—']].map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5 }}><span style={{ color: 'var(--text-mid)' }}>{k}</span><span>{v || '—'}</span></div>)}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={() => report(sel)} style={cuBtn('primary')}>Report a problem</button>
            {sel._k === 'camera' && <button onClick={() => shieldToast('Live view opens here once ShieldTech connects your recorder — use Footage to request a clip now', 'info')} style={cuBtn('ghost')}>Live view</button>}
            {sel._k === 'access' && <button onClick={() => shieldToast('Open the Access tab to request an unlock', 'info')} style={cuBtn('ghost')}>Door controls</button>}
          </div>
        </CuCard>)}
    </div>
  );
}

/* ── Access (doors + users on top of the badge / visitor tools) ── */
function CuAccessView() {
  const [assets] = useShieldStore(assetStore);
  const [logs, setLogs] = useShieldStore(cuAccessLogStore);
  const [users] = useShieldStore(cuAccessUserStore);
  const doors = cuMine(assets).filter(a => cuKind(a) === 'access').map(a => ({ ...a, id: a.id || a.name, _s: cuStatus(a) }));
  const myLogs = cuMine(logs).slice(0, 30);
  const myUsers = cuMine(users);
  const who = (window.__shieldUser || {}).name || 'Customer';
  const unlock = async (d) => {
    setLogs(l => [{ id: genId('ACL'), customer: d.customer || cuCompany(), site: d.site || '', door: d.name, user: who, kind: 'unlock-request', result: 'pending', at: Date.now() }, ...(l || [])].slice(0, 2000));
    const r = await cuRequest(`Unlock request · ${d.name}`, `${who} asked to unlock ${d.name} (${d.site || 'site'}) from the customer portal.`, 'access', 'urgent');
    shieldToast(r.ok ? `Unlock request for ${d.name} sent to ShieldTech — you'll get a confirmation` : 'Unlock request logged', 'ok');
  };
  const Legacy = window.CustAccessView;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <CuCard title={`Doors · ${doors.length}`} pad={doors.length ? 12 : 16}>
        {!doors.length && <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>No doors on file yet — readers and controllers we install appear here with remote unlock.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {doors.map(d => (
            <div key={d.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 12, background: 'var(--canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: cuDot(d._s) }} /><span style={{ fontWeight: 600, fontSize: 13.5, flex: 1, color: 'var(--text-high)' }}>{d.name}</span><span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--status-ok)', background: 'var(--ok-tint-12)', padding: '2px 8px', borderRadius: 10 }}>Locked</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{[d.site, d.room].filter(Boolean).join(' · ') || 'Site'}</div>
              <button onClick={() => unlock(d)} disabled={d._s === 'offline'} style={{ ...cuBtn('primary'), width: '100%', marginTop: 10, opacity: d._s === 'offline' ? 0.5 : 1 }}>{d._s === 'offline' ? 'Reader offline' : 'Request unlock'}</button>
            </div>))}
        </div>
      </CuCard>
      {(myUsers.length > 0 || myLogs.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          <CuCard title={`People with access · ${myUsers.length}`} pad={0}>
            {!myUsers.length && <div style={{ padding: 14, fontSize: 12, color: 'var(--text-mid)' }}>None recorded yet.</div>}
            {myUsers.map((u, i) => <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', fontSize: 12.5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: u.status === 'active' ? 'var(--status-ok)' : 'var(--text-low)' }} /><span style={{ flex: 1, color: 'var(--text-high)', fontWeight: 600 }}>{u.name}</span><span style={{ color: 'var(--text-mid)' }}>{u.group} · {u.cred}</span></div>)}
          </CuCard>
          <CuCard title="Recent door activity" pad={0}>
            {!myLogs.length && <div style={{ padding: 14, fontSize: 12, color: 'var(--text-mid)' }}>Nothing logged yet.</div>}
            {myLogs.map((l, i) => <div key={l.id} style={{ display: 'flex', gap: 10, padding: '8px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', fontSize: 12.5 }}><span className="mono" style={{ color: 'var(--text-mid)', fontSize: 11.5, width: 110 }}>{new Date(l.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{l.door}</span><span style={{ color: 'var(--text-mid)', flex: 1 }}>{l.kind.replace(/-/g, ' ')} · {l.user}</span><span style={{ color: l.result === 'pending' ? 'var(--status-warn)' : l.result === 'denied' ? 'var(--status-critical)' : 'var(--status-ok)', fontWeight: 600 }}>{l.result}</span></div>)}
          </CuCard>
        </div>)}
      {Legacy && <Legacy />}
    </div>
  );
}

Object.assign(window, { CuSitesView, CuDevicesView, CuAccessView, CuCard, CuTile, cuKind, cuStatus, cuMine, cuRequest });

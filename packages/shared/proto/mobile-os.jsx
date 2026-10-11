/* Mobile portal — ShieldTech OS at phone size. Same data, same live controllers
   and the same disciplines as the desktop console, laid out the way the UniFi
   mobile apps lay out a site: site picker on top, discipline chips, tiles, a
   flat device list, and a bottom sheet for the device you tap. Reuses the
   desktop console's helpers (useUcLive, ucMergeLive, UcSnapshot, UcAlertsPage,
   UcControllers) so there is one source of truth. */

const MOS_APPS = [
  ['sites', 'Sites', '⌂'], ['network', 'Network', '⊚'], ['protect', 'Video', '◉'], ['access', 'Access', '⊠'],
  ['intrusion', 'Intrusion', '◬'], ['fire', 'Fire', '△'], ['intercom', 'Intercom', '☏'], ['cabling', 'Cabling', '≣'],
  ['alerts', 'Alerts', '!'], ['settings', 'Controllers', '⚙'],
];
const MOS_KINDS = { network: ['gateway', 'switch', 'ap', 'server', 'device'], protect: ['camera', 'nvr'], access: ['access'], intrusion: ['alarm'], fire: ['fire'], intercom: ['intercom', 'av'], cabling: ['cabling'] };
const mosDot = (s) => s === 'online' || s === 'healthy' ? 'var(--status-ok)' : s === 'warning' || s === 'attention' ? 'var(--status-warn)' : s === 'offline' ? 'var(--status-critical)' : 'var(--text-low)';
const mosBtn = (kind = 'primary') => ({ fontFamily: 'var(--font-body)', padding: '11px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: '1px solid transparent', background: kind === 'primary' ? 'var(--brand)' : kind === 'danger' ? 'var(--critical-tint-12)' : 'var(--card)', color: kind === 'primary' ? '#fff' : kind === 'danger' ? 'var(--status-critical)' : 'var(--text-high)', borderColor: kind === 'ghost' ? 'var(--border-subtle)' : 'transparent', width: '100%', textAlign: 'center' });
const mosCard = { background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' };

function MosSheet({ title, sub, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflow: 'auto', background: 'var(--modal)', borderRadius: '16px 16px 0 0', padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0px))', color: 'var(--text-high)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>{sub && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>}</div><button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕</button></div>
        {children}
      </div>
    </div>
  );
}
function MosTile({ label, value, sub, tone }) {
  return <div style={{ ...mosCard, padding: '12px 14px', borderRadius: 12 }}><div style={{ fontSize: 11, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2, color: tone === 'ok' ? 'var(--status-ok)' : tone === 'warn' ? 'var(--status-warn)' : tone === 'crit' ? 'var(--status-critical)' : 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>{sub && <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 1 }}>{sub}</div>}</div>;
}
function MosRow({ d, onTap, right }) {
  const k = ucKind(d);
  return (
    <button onClick={() => onTap(d)} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
      <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: UC_KIND_COLOR[k], position: 'relative' }}>{UC_KIND_GLYPH[k]}<span style={{ position: 'absolute', right: -3, bottom: -3, width: 10, height: 10, borderRadius: '50%', background: mosDot(ucStatus(d)), border: '2px solid var(--card)' }} /></span>
      <span style={{ minWidth: 0 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || d.model || 'Device'}</span>{d.live && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: 'var(--ok-tint-12)', color: 'var(--status-ok)', flexShrink: 0 }}>LIVE</span>}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[d.mfg, d.model].filter(Boolean).join(' ') || UC_KIND_LABEL[k]}{d.site ? ` · ${d.site}` : ''}{d.room ? ` · ${d.room}` : ''}</span></span>
      <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{right != null ? right : (d.ip || '')}</span>
    </button>
  );
}

function MobileOS({ onNav }) {
  const subInit = window.__navSub && window.__navSub.screen === 'cameras' ? window.__navSub.sub : null;
  const [app, setApp] = React.useState(MOS_APPS.some(a => a[0] === subInit) ? subInit : 'sites');
  const [scope, setScope] = React.useState({ customer: null, site: null });
  const [pick, setPick] = React.useState(false);
  const [sel, setSel] = React.useState(null);
  const [kind, setKind] = React.useState('all');
  const sites = useUcSites();
  const [allAssets, setAssets] = useShieldStore(assetStore);
  const [logs, setLogs] = useShieldStore(accessLogStore);
  const [insp] = useShieldStore(fireInspectionStore);
  const live = useUcLive(scope);
  const merged = React.useMemo(() => ucMergeLive(allAssets || [], live.devices), [allAssets, live.devices]);
  const assets = merged.filter(a => (!scope.customer || a.customer === scope.customer) && (!scope.site || (a.site || 'Main site') === scope.site));
  const scopedSites = sites.filter(s => (!scope.customer || s.customer === scope.customer) && (!scope.site || s.site === scope.site));
  const on = assets.filter(a => ucStatus(a) === 'online').length, flagged = assets.length - on;
  const me = (window.__shieldUser || {}).name || 'Office';
  const label = scope.site ? scope.site : scope.customer || 'All sites';
  const kinds = MOS_KINDS[app];
  const list = kinds ? assets.filter(a => kinds.includes(ucKind(a))).filter(a => kind === 'all' || ucKind(a) === kind).map(a => ({ ...a, id: a.id || a.name })) : [];
  const kindOpts = kinds ? [['all', 'All', list.length === 0 && kind !== 'all' ? assets.filter(a => kinds.includes(ucKind(a))).length : assets.filter(a => kinds.includes(ucKind(a))).length], ...kinds.map(k => [k, UC_KIND_LABEL[k], assets.filter(a => ucKind(a) === k).length]).filter(x => x[2])] : [];
  const setStatus = (d, s) => { setAssets(l => (l || []).map(x => (x.id || x.name) === d.id ? { ...x, status: s, lastSeen: Date.now(), lastBy: me } : x)); shieldToast(`${d.name} marked ${s}`, 'ok'); setSel(p => p ? { ...p, status: s } : p); };
  const unlock = async (d) => {
    if (d.live && d.liveKind === 'door' && window.__shieldUniFi) { const r = await window.__shieldUniFi.unlock(d.controllerId, d.liveId, me); shieldToast(r && r.ok ? `${d.name} unlocked at the controller` : `Unlock failed: ${(r && r.error) || 'unknown'}`, r && r.ok ? 'ok' : 'warn'); if (r && r.ok) window.dispatchEvent(new CustomEvent('uc:sync')); }
    else shieldToast(`${d.name}: unlock logged — the controller receives it once connected`, 'ok');
    setLogs(l => [{ id: genId('ACL'), customer: d.customer || '', site: d.site || '', door: d.name, user: me, kind: 'remote-unlock', result: 'granted', at: Date.now() }, ...(l || [])].slice(0, 2000));
  };
  const ctrls = (live.controllers || []).filter(c => c.enabled && (!scope.customer || c.customer === scope.customer));
  const wan = ctrls.map(c => (c.health || {}).wan).filter(Boolean);
  const wanVal = !ctrls.length ? '—' : wan.every(w => w === 'ok') ? 'Up' : wan.some(w => w === 'ok') ? 'Degraded' : 'Down';
  const today = new Date().toISOString().slice(0, 10);
  const inspDue = (insp || []).filter(i => (!scope.customer || i.customer === scope.customer) && i.next && i.next <= today);
  const events = ucLiveEvents(live.events, scope).slice(0, 20);
  React.useEffect(() => { setKind('all'); setSel(null); }, [app]);
  const chip = (id, l, n, onPick) => <button key={id} onClick={onPick} style={{ fontFamily: 'var(--font-body)', flexShrink: 0, padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: kind === id ? 'var(--brand)' : 'var(--card)', color: kind === id ? '#fff' : 'var(--text-mid)', border: `1px solid ${kind === id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer' }}>{l}{n != null ? ` ${n}` : ''}</button>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', flex: 1 }}>ShieldTech OS</div><span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{on} online · {flagged} flagged{live.devices.length ? <span style={{ color: 'var(--status-ok)' }}> · {assets.filter(a => a.live).length} live</span> : null}</span></div>
      <button onClick={() => setPick(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-high)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: mosDot(flagged ? (assets.some(a => ucStatus(a) === 'offline') ? 'offline' : 'warning') : assets.length ? 'online' : 'none') }} />
        <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{label}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)' }}>{scope.site ? scope.customer : `${scopedSites.length} sites · ${assets.length} devices`}</span></span>
        <span style={{ color: 'var(--text-low)' }}>▾</span>
      </button>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, margin: '0 -14px', padding: '0 14px 2px' }}>
        {MOS_APPS.map(([id, l, g]) => <button key={id} onClick={() => { setApp(id); window.navSubSet && window.navSubSet('cameras', id, 'screen'); }} style={{ fontFamily: 'var(--font-body)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, background: app === id ? 'var(--brand)' : 'var(--card)', color: app === id ? '#fff' : 'var(--text-mid)', border: `1px solid ${app === id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer', position: 'relative' }}><span>{g}</span>{l}{id === 'alerts' && flagged > 0 && <span style={{ marginLeft: 2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--status-critical)', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{flagged}</span>}</button>)}
      </div>

      {app === 'sites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><MosTile label="Sites" value={scopedSites.length} sub={`${scopedSites.filter(s => s.verdict === 'healthy').length} healthy`} /><MosTile label="Devices online" value={`${on} / ${assets.length}`} tone={flagged ? 'warn' : 'ok'} /><MosTile label="Internet" value={wanVal} tone={wanVal === 'Up' ? 'ok' : wanVal === 'Down' ? 'crit' : wanVal === 'Degraded' ? 'warn' : undefined} sub={ctrls.length ? `${ctrls.length} controller${ctrls.length === 1 ? '' : 's'}` : 'connect a controller'} /><MosTile label="Inspections due" value={inspDue.length} tone={inspDue.length ? 'crit' : 'ok'} sub="fire alarm" /></div>
          {!scopedSites.length && <div style={{ ...mosCard, padding: 20, fontSize: 12.5, color: 'var(--text-mid)', textAlign: 'center' }}>No sites yet. Add a customer or document a device and it appears here.</div>}
          {scopedSites.map(s => (
            <button key={s.id} onClick={() => { setScope({ customer: s.customer, site: s.site }); setApp('network'); }} style={{ ...mosCard, padding: 14, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: mosDot(s.verdict) }} /><span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{s.site}</span>{s.openTickets > 0 && <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 10, background: 'var(--warn-tint-12)', color: 'var(--status-warn)' }}>{s.openTickets} open</span>}<span style={{ color: 'var(--text-low)' }}>›</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 2 }}>{s.customer}{s.address ? ` · ${s.address}` : ''}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginTop: 10 }}>{[['Dev', `${s.on}/${s.devices.length}`], ['Video', s.cams], ['Doors', s.doors], ['Intr.', s.intrusion], ['Fire', s.fire], ['Net', s.net]].map(([l, v]) => <div key={l}><div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{l}</div></div>)}</div>
            </button>))}
        </div>)}

      {kinds && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {app === 'network' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><MosTile label="Internet" value={wanVal} tone={wanVal === 'Up' ? 'ok' : wanVal === 'Down' ? 'crit' : undefined} sub={ctrls.length ? [...new Set(ctrls.map(c => (c.health || {}).isp).filter(Boolean))].join(', ') || 'controller connected' : 'needs a controller'} /><MosTile label="Clients" value={ctrls.length && ctrls.reduce((n, c) => n + (Number((c.health || {}).clients) || 0), 0) || '—'} sub="reported by the controller" /></div>}
          {app === 'protect' && list.filter(c => ucKind(c) === 'camera').length > 0 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{list.filter(c => ucKind(c) === 'camera').slice(0, 6).map(c => <div key={c.id} onClick={() => setSel(c)} style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b0d11', borderRadius: 10, border: `1px solid ${ucStatus(c) === 'offline' ? 'var(--status-critical)' : 'var(--border-subtle)'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UcSnapshot cam={{ ...c, _s: ucStatus(c) }} /><div style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 10, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: mosDot(ucStatus(c)) }} />{c.name}</div></div>)}</div>}
          {app === 'fire' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><MosTile label="Fire panels" value={list.filter(d => /panel|facp/i.test(d.type || d.name || '')).length} /><MosTile label="Inspections due" value={inspDue.length} tone={inspDue.length ? 'crit' : 'ok'} sub={inspDue[0] ? `${inspDue[0].site} · ${inspDue[0].next}` : 'nothing overdue'} /></div>}
          {app === 'intrusion' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><MosTile label="Panels" value={list.filter(d => /panel|control/i.test(d.type || d.name || '')).length} /><MosTile label="Armed state" value="—" sub="needs the panel integration" /></div>}
          {kindOpts.length > 2 && <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>{kindOpts.map(([id, l, n]) => chip(id, l, n, () => setKind(id)))}</div>}
          <div style={mosCard}>
            {!list.length && <div style={{ padding: 22, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.6 }}>No {MOS_APPS.find(a => a[0] === app)[1].toLowerCase()} devices documented{scope.site ? ` at ${scope.site}` : ''}. Add them in Assets or adopt them from the tech app.</div>}
            {list.map((d, i) => <div key={d.id} style={{ marginTop: i ? 0 : -1 }}><MosRow d={d} onTap={setSel} right={app === 'access' ? (d.live && d.raw && d.raw.locked === false ? 'Unlocked' : 'Locked') : undefined} /></div>)}
          </div>
          {events.length > 0 && <div style={mosCard}><div style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700 }}>Recent events</div>{events.slice(0, 8).map((e, i) => <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: e.c, marginTop: 4, flexShrink: 0 }} /><span style={{ flex: 1 }}><span style={{ fontWeight: 600 }}>{e.kind}</span> <span style={{ color: 'var(--text-mid)' }}>{e.who}</span></span><span style={{ color: 'var(--text-low)', fontSize: 11 }}>{ucAgo(e.at)}</span></div>)}</div>}
        </div>)}

      {app === 'alerts' && <UcAlertsPage assets={assets} scope={scope} go={(id) => setApp(id === 'sites' ? 'sites' : id)} />}
      {app === 'settings' && <UcControllers sites={sites} />}

      {pick && (
        <MosSheet title="Choose a site" onClose={() => setPick(false)}>
          <button onClick={() => { setScope({ customer: null, site: null }); setPick(false); }} style={{ ...mosBtn('ghost'), textAlign: 'left', marginBottom: 8, background: !scope.customer ? 'var(--brand-tint-12)' : 'var(--card)' }}>All sites · {sites.length}</button>
          {[...new Set(sites.map(s => s.customer))].map(c => <React.Fragment key={c}><button onClick={() => { setScope({ customer: c, site: null }); setPick(false); }} style={{ ...mosBtn('ghost'), textAlign: 'left', marginBottom: 6, background: scope.customer === c && !scope.site ? 'var(--brand-tint-12)' : 'var(--card)' }}>{c}</button>{sites.filter(s => s.customer === c).map(s => <button key={s.id} onClick={() => { setScope({ customer: c, site: s.site }); setPick(false); }} style={{ ...mosBtn('ghost'), textAlign: 'left', marginBottom: 6, marginLeft: 16, width: 'calc(100% - 16px)', fontWeight: 500, background: scope.site === s.site && scope.customer === c ? 'var(--brand-tint-12)' : 'var(--card)' }}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: mosDot(s.verdict), marginRight: 8 }} />{s.site} <span style={{ color: 'var(--text-low)' }}>· {s.on}/{s.devices.length}</span></button>)}</React.Fragment>)}
        </MosSheet>)}

      {sel && (
        <MosSheet title={sel.name || sel.model || 'Device'} sub={`${UC_KIND_LABEL[ucKind(sel)]} · ${[sel.customer, sel.site, sel.room].filter(Boolean).join(' · ')}`} onClose={() => setSel(null)}>
          {ucKind(sel) === 'camera' && <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b0d11', borderRadius: 10, overflow: 'hidden', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UcSnapshot cam={{ ...sel, _s: ucStatus(sel) }} hq /></div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: mosDot(ucStatus(sel)) }} />{ucStatus(sel) === 'online' ? 'Online' : ucStatus(sel) === 'warning' ? 'Needs attention' : 'Offline'}{sel.live && <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: 'var(--ok-tint-12)', color: 'var(--status-ok)' }}>LIVE</span>}{sel.uptime && <span style={{ color: 'var(--text-low)', fontSize: 11.5 }}>· up {sel.uptime}</span>}</div>
          <div style={{ ...mosCard, borderRadius: 12, padding: '4px 14px', marginBottom: 12 }}>{[['Make / model', [sel.mfg, sel.model].filter(Boolean).join(' ')], ['IP address', sel.ip], ['MAC / serial', sel.mac || sel.serial], ['Firmware', sel.firmware], ['Switch port', sel.switchPort], ['Notes', sel.notes]].map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}><span style={{ color: 'var(--text-mid)' }}>{k}</span><span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span></div>)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ucKind(sel) === 'access' && <button onClick={() => unlock(sel)} style={{ ...mosBtn('primary'), gridColumn: '1 / -1' }}>Unlock door</button>}
            {ucStatus(sel) !== 'online' && !sel.live && <button onClick={() => setStatus(sel, 'online')} style={mosBtn('primary')}>Mark online</button>}
            {ucStatus(sel) !== 'warning' && !sel.live && <button onClick={() => setStatus(sel, 'warning')} style={mosBtn('ghost')}>Flag attention</button>}
            {ucStatus(sel) !== 'offline' && !sel.live && <button onClick={() => setStatus(sel, 'offline')} style={mosBtn('danger')}>Mark offline</button>}
            <button onClick={() => { setSel(null); onNav && onNav('helpdesk'); }} style={mosBtn('ghost')}>Open a ticket</button>
            <button onClick={() => { setSel(null); onNav && onNav('dispatch'); }} style={mosBtn('ghost')}>Dispatch a tech</button>
            {sel.undocumented && <button onClick={() => { setAssets(l => [{ id: genId('CFG'), status: sel.status, customer: sel.customer, site: sel.site, room: '', name: sel.name, type: sel.type, mfg: 'Ubiquiti', model: sel.model, serial: sel.mac, ip: sel.ip, mac: sel.mac, firmware: sel.firmware, notes: 'Adopted from the controller', lastSeen: Date.now() }, ...(l || [])]); shieldToast(`${sel.name} documented in Assets`, 'ok'); setSel(null); }} style={{ ...mosBtn('ghost'), gridColumn: '1 / -1' }}>Add to Assets</button>}
          </div>
          {sel.live && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 12, lineHeight: 1.5 }}>Status and facts come from the controller on each sync.</div>}
        </MosSheet>)}
    </div>
  );
}

/* Home strip: the OS in one row on the mobile dashboard */
function MobileOSStrip({ onNav }) {
  const [allAssets] = useShieldStore(assetStore);
  const live = useUcLive({ customer: null, site: null });
  const merged = React.useMemo(() => ucMergeLive(allAssets || [], live.devices), [allAssets, live.devices]);
  const flagged = merged.filter(a => ucStatus(a) !== 'online');
  const sites = useUcSites();
  if (!merged.length && !sites.length) return null;
  return (
    <button onClick={() => { window.navSubSet && window.navSubSet('cameras', flagged.length ? 'alerts' : 'sites', 'nav'); onNav('cameras'); }} style={{ ...mosCard, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', width: '100%', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-high)', textAlign: 'left' }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>OS</span>
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>ShieldTech OS</span><span style={{ display: 'block', fontSize: 11.5, color: flagged.length ? 'var(--status-warn)' : 'var(--text-mid)' }}>{sites.length} sites · {merged.length - flagged.length} online{flagged.length ? ` · ${flagged.length} need attention` : ''}{merged.some(a => a.live) ? ` · ${merged.filter(a => a.live).length} live` : ''}</span></span>
      <span style={{ color: 'var(--text-low)' }}>›</span>
    </button>
  );
}

Object.assign(window, { MobileOS, MobileOSStrip, MosSheet, MosTile, MosRow, MOS_APPS, MOS_KINDS });

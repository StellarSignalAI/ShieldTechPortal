/* Tech app — Devices, the UniFi mobile pattern on ShieldTech's registry.
   A site picker, a flat device list (status dot · name · model · IP), filter
   chips by kind, and a device sheet with the actions a tech actually has on
   site: mark status, note the port and mount, open photos, hand the device to
   the office as a ticket. Adopt = document a new device for this site. Door
   readers get a remote-unlock request that goes to the office log. */

const TU_KIND_LABEL = { gateway: 'Gateway', switch: 'Switch', ap: 'Access point', camera: 'Camera', access: 'Door / reader', alarm: 'Alarm panel', nvr: 'Recorder', server: 'Server', device: 'Device' };
const TU_KIND_GLYPH = { gateway: '⌂', switch: '⊞', ap: '◠', camera: '◉', access: '⊠', alarm: '◬', nvr: '⊟', server: '▤', device: '▢' };
function tuKind(a) {
  const s = String(a.type || '').toLowerCase();
  if (s.includes('cam')) return 'camera'; if (s.includes('nvr') || s.includes('record')) return 'nvr'; if (s.includes('switch')) return 'switch';
  if (s.includes('router') || s.includes('gateway') || s.includes('firewall')) return 'gateway'; if (s.includes('access point') || s === 'ap' || s.includes('wifi') || s.includes('wireless')) return 'ap';
  if (s.includes('access') || s.includes('reader') || s.includes('door') || s.includes('controller')) return 'access'; if (s.includes('alarm') || s.includes('panel') || s.includes('intrusion')) return 'alarm'; if (s.includes('server')) return 'server'; return 'device';
}
const tuStatus = (a) => !a.status || a.status === 'online' ? 'online' : a.status === 'warning' ? 'warning' : 'offline';
const tuDotColor = (s) => s === 'online' ? 'var(--status-ok)' : s === 'warning' ? 'var(--status-warn)' : 'var(--status-critical)';
const tuAccessLogStore = (typeof accessLogStore !== 'undefined') ? accessLogStore : createShieldStore('accesslogs', []);

function TuSheet({ title, sub, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxHeight: '88vh', overflow: 'auto', background: 'var(--modal)', borderRadius: '16px 16px 0 0', padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0px))', color: 'var(--text-high)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>{sub && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>}</div><button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕</button></div>
        {children}
      </div>
    </div>
  );
}
const tuBtn = (kind = 'primary') => ({ fontFamily: 'var(--font-body)', padding: '11px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: '1px solid transparent', background: kind === 'primary' ? 'var(--brand)' : kind === 'danger' ? 'var(--critical-tint-12)' : 'var(--card)', color: kind === 'primary' ? '#fff' : kind === 'danger' ? 'var(--status-critical)' : 'var(--text-high)', borderColor: kind === 'ghost' ? 'var(--border-subtle)' : 'transparent', width: '100%', textAlign: 'center' });

function TechDevicesView({ setTab }) {
  const [assets, setAssets] = useShieldStore(assetStore);
  const [wos] = useShieldStore(workOrderStore);
  const [, setLogs] = useShieldStore(tuAccessLogStore);
  const [, setTickets] = useShieldStore(ticketStore);
  const [site, setSite] = React.useState(() => { try { return localStorage.getItem('st2:tech-site') || ''; } catch { return ''; } });
  const [kind, setKind] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(null);
  const [showSites, setShowSites] = React.useState(false);
  const me = (window.__shieldUser || {}).name || 'Tech';
  React.useEffect(() => { try { localStorage.setItem('st2:tech-site', site); } catch {} }, [site]);
  /* Sites a tech can be at: every (customer · site) in the registry plus the customers on today's work orders. */
  const sites = React.useMemo(() => {
    const m = new Map();
    (assets || []).forEach(a => { if (!a.customer) return; const k = `${a.customer}|${a.site || 'Main site'}`; if (!m.has(k)) m.set(k, { id: k, customer: a.customer, site: a.site || 'Main site', n: 0 }); m.get(k).n++; });
    (wos || []).forEach(w => { const c = w.customer || w.client; if (!c) return; const k = `${c}|${w.site || 'Main site'}`; if (!m.has(k)) m.set(k, { id: k, customer: c, site: w.site || 'Main site', n: 0 }); });
    return [...m.values()].sort((a, b) => a.customer.localeCompare(b.customer));
  }, [assets, wos]);
  const cur = sites.find(s => s.id === site) || null;
  const list = (assets || []).filter(a => !cur || (a.customer === cur.customer && (a.site || 'Main site') === cur.site)).filter(a => kind === 'all' || tuKind(a) === kind).filter(a => !q || ['name', 'model', 'mfg', 'ip', 'room'].some(k => String(a[k] || '').toLowerCase().includes(q.toLowerCase()))).map(a => ({ ...a, id: a.id || a.name, _s: tuStatus(a), _k: tuKind(a) }));
  const on = list.filter(a => a._s === 'online').length;
  const kinds = [{ id: 'all', l: 'All', n: list.length }, ...Object.keys(TU_KIND_LABEL).map(k => ({ id: k, l: TU_KIND_LABEL[k], n: (assets || []).filter(a => (!cur || (a.customer === cur.customer && (a.site || 'Main site') === cur.site)) && tuKind(a) === k).length })).filter(k => k.n)];
  const patch = (id, p) => setAssets(l => (l || []).map(x => (x.id || x.name) === id ? { ...x, ...p, lastSeen: Date.now(), lastBy: me } : x));
  const setStatus = (d, s) => { patch(d.id, { status: s }); shieldToast(`${d.name} marked ${s}`, 'ok'); setSel(p => p ? { ...p, status: s, _s: s } : p); };
  const adopt = () => shieldModal({ kind: 'form', title: `Adopt device${cur ? ` · ${cur.site}` : ''}`, submitLabel: 'Adopt', successMsg: 'Device documented — the office console sees it now', fields: [
    { key: 'name', label: 'Device name', placeholder: 'e.g. CAM-07 (Rear dock)', required: true, full: true },
    { key: 'type', label: 'Type', type: 'select', options: ['IP Camera', 'NVR', 'Network Switch', 'Gateway / Router', 'Access Point', 'Access Reader', 'Door Controller', 'Alarm Panel', 'Other'] },
    ...(cur ? [] : [{ key: 'customer', label: 'Customer', required: true }, { key: 'site', label: 'Site' }]),
    { key: 'mfg', label: 'Make', placeholder: 'e.g. Axis' }, { key: 'model', label: 'Model' }, { key: 'serial', label: 'Serial / MAC' }, { key: 'ip', label: 'IP address', placeholder: '192.168.1.' },
    { key: 'room', label: 'Room / location' }, { key: 'switchPort', label: 'Switch port' }, { key: 'mount', label: 'Mount' }, { key: 'notes', label: 'Notes', full: true },
  ], onSubmit: (v) => setAssets(l => [{ id: genId('CFG'), status: 'online', customer: cur ? cur.customer : (v.customer || '—'), site: cur ? cur.site : (v.site || ''), name: v.name, type: v.type || 'Other', mfg: v.mfg || '', model: v.model || '', serial: v.serial || '', ip: v.ip || '', mac: '', room: v.room || '', firmware: '', fwUpdate: false, mount: v.mount || '', cable: '', switchPort: v.switchPort || '', notes: v.notes || '', adoptedBy: me, adoptedAt: Date.now(), lastSeen: Date.now() }, ...(l || [])]) });
  const editNotes = (d) => shieldModal({ kind: 'form', title: `Update ${d.name}`, submitLabel: 'Save', successMsg: 'Saved', fields: [
    { key: 'ip', label: 'IP address', placeholder: d.ip }, { key: 'room', label: 'Room', placeholder: d.room }, { key: 'switchPort', label: 'Switch port', placeholder: d.switchPort }, { key: 'mount', label: 'Mount', placeholder: d.mount }, { key: 'firmware', label: 'Firmware', placeholder: d.firmware }, { key: 'notes', label: 'Notes', placeholder: d.notes, full: true },
  ], onSubmit: (v) => { const p = {}; Object.keys(v).forEach(k => { if (v[k]) p[k] = v[k]; }); patch(d.id, p); setSel(s => s ? { ...s, ...p } : s); } });
  const ticket = (d) => { const id = 'TKT-' + Date.now().toString(36).toUpperCase(); setTickets(l => [{ id, ref: id, priority: d._s === 'offline' ? 'high' : 'medium', status: 'open', customer: d.customer || '', contact: me, subject: `${d.name}: ${d._s === 'online' ? 'follow-up needed' : d._s}`, created: Date.now(), source: 'Tech app', sla: { total: 8, remaining: 8 }, messages: [{ from: me, text: `${TU_KIND_LABEL[d._k]} at ${[d.site, d.room].filter(Boolean).join(' · ')}${d.ip ? ` (${d.ip})` : ''}.`, at: Date.now() }] }, ...(l || [])]); shieldToast(`${id} sent to the office`, 'ok'); };
  const unlock = (d) => { setLogs(l => [{ id: genId('ACL'), customer: d.customer || '', site: d.site || '', door: d.name, user: me, kind: 'remote-unlock', result: 'granted', at: Date.now() }, ...(l || [])].slice(0, 2000)); shieldToast(`${d.name}: unlock sent — logged in ShieldTech OS`, 'ok'); };
  const row = { display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: '1px solid var(--border-subtle)', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-high)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', flex: 1 }}>Devices</div>
        <button onClick={adopt} style={{ ...tuBtn('primary'), width: 'auto', padding: '8px 14px', fontSize: 12.5 }}>+ Adopt</button>
      </div>
      <button onClick={() => setShowSites(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-high)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: list.length ? (on === list.length ? 'var(--status-ok)' : 'var(--status-warn)') : 'var(--text-low)' }} />
        <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{cur ? cur.site : 'All sites'}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)' }}>{cur ? cur.customer : `${sites.length} sites`} · {on}/{list.length} online</span></span>
        <span style={{ color: 'var(--text-low)' }}>▾</span>
      </button>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, model, IP, room" style={{ fontFamily: 'var(--font-body)', padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 13.5, outline: 'none' }} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>{kinds.map(k => <button key={k.id} onClick={() => setKind(k.id)} style={{ fontFamily: 'var(--font-body)', flexShrink: 0, padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: kind === k.id ? 'var(--brand)' : 'var(--card)', color: kind === k.id ? '#fff' : 'var(--text-mid)', border: `1px solid ${kind === k.id ? 'var(--brand)' : 'var(--border-subtle)'}`, cursor: 'pointer' }}>{k.l} {k.n}</button>)}</div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
        {!list.length && <div style={{ padding: 26, textAlign: 'center', fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.6 }}>No devices documented{cur ? ` at ${cur.site}` : ''}. Tap <strong>Adopt</strong> to record what you install or find on site.</div>}
        {list.map((d, i) => (
          <button key={d.id} onClick={() => setSel(d)} style={{ ...row, borderTop: i ? row.borderTop : 'none' }}>
            <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--text-mid)', position: 'relative' }}>{TU_KIND_GLYPH[d._k]}<span style={{ position: 'absolute', right: -3, bottom: -3, width: 10, height: 10, borderRadius: '50%', background: tuDotColor(d._s), border: '2px solid var(--card)' }} /></span>
            <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || d.model || 'Device'}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[d.mfg, d.model].filter(Boolean).join(' ') || TU_KIND_LABEL[d._k]}{d.room ? ` · ${d.room}` : ''}</span></span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{d.ip || ''}</span>
          </button>))}
      </div>
      {showSites && (
        <TuSheet title="Choose site" sub="Where are you working?" onClose={() => setShowSites(false)}>
          <button onClick={() => { setSite(''); setShowSites(false); }} style={{ ...tuBtn('ghost'), textAlign: 'left', marginBottom: 8, background: !cur ? 'var(--brand-tint-12)' : 'var(--card)' }}>All sites</button>
          {sites.map(s => <button key={s.id} onClick={() => { setSite(s.id); setShowSites(false); }} style={{ ...tuBtn('ghost'), textAlign: 'left', marginBottom: 8, background: site === s.id ? 'var(--brand-tint-12)' : 'var(--card)' }}><span style={{ display: 'block' }}>{s.site}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mid)', fontWeight: 400 }}>{s.customer} · {s.n} devices</span></button>)}
          {!sites.length && <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>No sites yet. Adopt a device and name the customer to create one.</div>}
        </TuSheet>)}
      {sel && (
        <TuSheet title={sel.name || sel.model || 'Device'} sub={`${TU_KIND_LABEL[sel._k]} · ${[sel.customer, sel.site, sel.room].filter(Boolean).join(' · ')}`} onClose={() => setSel(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: tuDotColor(sel._s) }} />{sel._s === 'online' ? 'Online' : sel._s === 'warning' ? 'Needs attention' : 'Offline'}{sel.lastSeen ? <span style={{ color: 'var(--text-low)', fontSize: 11.5 }}> · updated {new Date(sel.lastSeen).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{sel.lastBy ? ` by ${sel.lastBy}` : ''}</span> : null}</div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '4px 14px', marginBottom: 12 }}>
            {[['Make / model', [sel.mfg, sel.model].filter(Boolean).join(' ')], ['IP address', sel.ip], ['Serial / MAC', sel.serial || sel.mac], ['Firmware', sel.firmware], ['Switch port', sel.switchPort], ['Mount', sel.mount], ['Notes', sel.notes]].map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}><span style={{ color: 'var(--text-mid)' }}>{k}</span><span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {sel._k === 'access' && <button onClick={() => unlock(sel)} style={{ ...tuBtn('primary'), gridColumn: '1 / -1' }}>Unlock door</button>}
            {sel._s !== 'online' && <button onClick={() => setStatus(sel, 'online')} style={tuBtn('primary')}>Mark online</button>}
            {sel._s !== 'warning' && <button onClick={() => setStatus(sel, 'warning')} style={tuBtn('ghost')}>Flag attention</button>}
            {sel._s !== 'offline' && <button onClick={() => setStatus(sel, 'offline')} style={tuBtn('danger')}>Mark offline</button>}
            <button onClick={() => editNotes(sel)} style={tuBtn('ghost')}>Edit details</button>
            <button onClick={() => { setSel(null); setTab && setTab('photos'); }} style={tuBtn('ghost')}>Photos</button>
            <button onClick={() => ticket(sel)} style={tuBtn('ghost')}>Send to office</button>
            {sel.ip && <button onClick={() => { try { navigator.clipboard.writeText(sel.ip); shieldToast('IP copied', 'ok'); } catch { shieldToast(sel.ip, 'info'); } }} style={tuBtn('ghost')}>Copy IP</button>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 12, lineHeight: 1.5 }}>Locate, restart and live stats arrive once the site controller is connected by the office. Everything you mark here shows in ShieldTech OS right away.</div>
        </TuSheet>)}
    </div>
  );
}

Object.assign(window, { TechDevicesView, TuSheet, tuKind, tuStatus, TU_KIND_LABEL, TU_KIND_GLYPH });

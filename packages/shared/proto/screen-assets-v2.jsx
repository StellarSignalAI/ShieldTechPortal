/* Assets V2 — IT Glue-Class: Configurations, Flexible Assets, Passwords, Documents, Networks */

function AssetsScreen() {
  const [tab, setTab] = React.useState('configs');
  const [customerScope, setCustomerScope] = React.useState('');
  const [siteScope, setSiteScope] = React.useState('');
  const [selectedConfig, setSelectedConfig] = React.useState(null);
  const [createAssetModal, setCreateAssetModal] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const tabs = [
    { id: 'configs', label: 'Configurations', icon: '⬡' },
    { id: 'discovery', label: 'Network Discovery', icon: '⊙' },
    { id: 'flexible', label: 'Flexible Assets', icon: '◈' },
    { id: 'passwords', label: 'Passwords', icon: '⊠' },
    { id: 'rotation', label: 'Password Rotation', icon: '↻' },
    { id: 'bitlocker', label: 'BitLocker Keys', icon: '⊟' },
    { id: 'microsoft', label: 'Microsoft / Identity', icon: '⊞' },
    { id: 'documents', label: 'Documents', icon: '▤' },
    { id: 'networks', label: 'Networks / IPs', icon: '⊚' },
    { id: 'types', label: 'Asset Types', icon: '⊡' },
  ];

  const [configs] = useShieldStore(assetStore);
  const [allCusts] = useShieldStore(customerStore);
  const [search, setSearch] = React.useState('');
  const scopedCustomer = (allCusts || []).find(c => c.name === customerScope) || null;

  const filteredConfigs = customerScope ? configs.filter(c => c.customer === customerScope) : configs;
  const searched = search.trim()
    ? filteredConfigs.filter(c => ['name','tag','type','mfg','model','serial','ip','customer','site','room'].some(k => String(c[k] || '').toLowerCase().includes(search.trim().toLowerCase())))
    : filteredConfigs;
  const siteScopedConfigs = siteScope ? searched.filter(c => c.site === siteScope) : searched;
  const sites = [...new Set(filteredConfigs.map(c => c.site))];

  if (selectedConfig) {
    return <ConfigurationDetail config={selectedConfig} onBack={() => setSelectedConfig(null)} showToast={showToast} toast={toast} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Customer scope bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '0 0 10px', flexShrink: 0 }}>
        <CustomerSelector value={customerScope} onChange={(v) => { setCustomerScope(v); setSiteScope(''); }} showToast={showToast} style={{ width: 240 }} />
        {customerScope && sites.length > 0 && (
          <div style={{ width: 200 }}>
            <div className="label-sm" style={{ marginBottom: 4 }}>SITE</div>
            <select value={siteScope} onChange={e => setSiteScope(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              <option value="">All sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {customerScope && (
          <div style={{ fontSize: 11, color: 'var(--text-low)', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--brand)' }}>{customerScope}</span>
            {siteScope && <><span>▸</span><span style={{ color: 'var(--brand)' }}>{siteScope}</span></>}
            <span>· {siteScopedConfigs.length} devices</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search configurations..." style={{ padding: '6px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 240 }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 0 10px', flexShrink: 0, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: tab===t.id?600:400,
            background: tab===t.id?'rgba(63,169,245,0.12)':'transparent',
            border: `1px solid ${tab===t.id?'var(--brand)':'var(--border-subtle)'}`,
            color: tab===t.id?'var(--brand)':'var(--text-mid)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5
          }}><span style={{ fontSize: 12, opacity: 0.7 }}>{t.icon}</span>{t.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => {
          const rows = siteScopedConfigs.length ? siteScopedConfigs : configs;
          if (!rows.length) { showToast('No assets to export yet'); return; }
          const cols = ['id','name','type','mfg','model','serial','ip','customer','site','room','status'];
          const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'shieldtech-assets.csv'; a.click();
          showToast('Assets exported (CSV)', 'ok');
        }} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export</button>
        <button onClick={() => document.getElementById('asset-import-inp').click()} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Import</button>
        <input id="asset-import-inp" type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files && e.target.files[0]; if (!f) return;
          const rd = new FileReader();
          rd.onload = () => {
            const lines = String(rd.result).split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) { showToast('Empty or invalid CSV', 'warn'); return; }
            const hdr = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
            const recs = lines.slice(1).map((ln, k) => {
              const vals = ln.match(/("([^"]|"")*"|[^,]*)/g).filter((_,ix)=>ix%2===0).map(v => v.replace(/^"|"$/g,'').replace(/""/g,'"'));
              const o = { id: 'CFG-' + Date.now() + '-' + k }; hdr.forEach((h,ix) => o[h] = vals[ix] || ''); o.status = o.status || 'online'; return o;
            });
            assetStore.set(prev => [...recs, ...prev]);
            showToast(recs.length + ' assets imported', 'ok');
          };
          rd.readAsText(f); e.target.value = '';
        }} />
        <button onClick={() => setCreateAssetModal(true)} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Asset</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'configs' && (
          <GlassPanel style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['','Name','Tag','Type','Mfg / Model','IP','Status','Uptime','Site','Warranty','FW'].map((h,i) => (
                <th key={i} style={{ textAlign: 'left', padding: '9px 10px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr></thead>
              <tbody>{siteScopedConfigs.map(cfg => (
                <tr key={cfg.id} onClick={() => setSelectedConfig(cfg)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', width: 24 }}><StatusDot status={cfg.status==='online'?'online':cfg.status==='warning'?'warning':'critical'} size={7} /></td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{cfg.name}</div>
                    {!customerScope && <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{cfg.customer}</div>}
                  </td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--brand)' }}>{cfg.tag}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{cfg.type}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    <div style={{ fontSize: 11 }}>{cfg.mfg}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{cfg.model}</div>
                  </td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: cfg.ip?'var(--text-mid)':'var(--text-low)' }}>{cfg.ip || '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={cfg.status==='online'?'online':cfg.status==='warning'?'warning':'critical'} label={cfg.status} /></td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: cfg.uptime>=99?'var(--status-ok)':cfg.uptime>=95?'var(--status-warn)':'var(--status-critical)' }}>{cfg.uptime}%</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{cfg.site}<br/>{cfg.room}</td>
                  <td className="mono" style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{cfg.warranty}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                    {cfg.fwUpdate && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(251,191,36,0.08)', color: 'var(--status-warn)', fontWeight: 600 }}>UPDATE</span>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </GlassPanel>
        )}

        {tab === 'discovery' && <NetworkDiscoveryView showToast={showToast} />}
        {tab === 'rotation' && <PasswordRotationPanel showToast={showToast} />}
        {tab === 'bitlocker' && <BitLockerView showToast={showToast} />}
        {tab === 'microsoft' && <MicrosoftDocsView showToast={showToast} />}
        {['flexible','passwords','documents','networks'].includes(tab) && !scopedCustomer && (
          <GlassPanel style={{ textAlign: 'center', padding: 36 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Pick a customer</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>These records are stored per customer — choose one in the selector above to view or add entries.</div>
          </GlassPanel>
        )}
        {tab === 'flexible' && scopedCustomer && <CustomerFlexAssets customer={scopedCustomer} showToast={showToast} />}
        {tab === 'passwords' && scopedCustomer && <CustomerPasswords customer={scopedCustomer} showToast={showToast} />}
        {tab === 'documents' && scopedCustomer && <CustomerDocs customer={scopedCustomer} showToast={showToast} />}
        {tab === 'networks' && scopedCustomer && <CustomerNetworks customer={scopedCustomer} showToast={showToast} />}
        {tab === 'types' && <AssetTypesManager showToast={showToast} />}
      </div>

      {createAssetModal && <CreateAssetModal onClose={() => setCreateAssetModal(false)} showToast={showToast} />}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Configuration Detail (exhaustive IT Glue-class) ── */
function ConfigurationDetail({ config: cfg, onBack, showToast, toast }) {
  const [detailTab, setDetailTab] = React.useState('info');
  const [notes, setNotes] = React.useState(cfg.notes || '');
  const editNotes = () => {
    const next = window.prompt(`Notes for ${cfg.name}:`, notes);
    if (next === null) return;
    assetStore.set(list => (list || []).map(a => a.id === cfg.id ? { ...a, notes: next } : a));
    setNotes(next);
    showToast('Notes saved');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 10px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '4px 10px', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
        <StatusDot status={cfg.status==='online'?'online':'warning'} size={10} />
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 400 }}>{cfg.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{cfg.customer} ▸ {cfg.site} ▸ {cfg.room} · {cfg.tag}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => showToast("Configuration editing isn't wired up yet")} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit</button>
          <button onClick={() => showToast("Revision history isn't wired up yet")} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>History</button>
          <button onClick={() => setDetailTab('related')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Related</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, padding: '0 0 10px', flexShrink: 0 }}>
        {['info','network','monitoring','photos','related','audit'].map(t => (
          <button key={t} onClick={() => setDetailTab(t)} style={{ padding: '4px 12px', borderRadius: 5, fontSize: 11, background: detailTab===t?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${detailTab===t?'var(--brand)':'transparent'}`, color: detailTab===t?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {detailTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxWidth: 1400 }}>
            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 10 }}>IDENTITY</div>
              {[{l:'Asset ID',v:cfg.id},{l:'Asset Tag',v:cfg.tag},{l:'Name',v:cfg.name},{l:'Type',v:cfg.type},{l:'Manufacturer',v:cfg.mfg},{l:'Model',v:cfg.model},{l:'Serial #',v:cfg.serial},{l:'MAC Address',v:cfg.mac},{l:'Hostname',v:cfg.hostname}].map((f,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                  <span className="mono" style={{ fontSize: 11, color: f.v?'var(--text-mid)':'var(--text-low)', textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.v || '—'}</span>
                </div>
              ))}
            </GlassPanel>

            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 10 }}>NETWORK</div>
              {[{l:'IP Address',v:cfg.ip},{l:'Subnet',v:cfg.subnet},{l:'Gateway',v:cfg.gateway},{l:'VLAN',v:cfg.vlan||'—'},{l:'HTTP',v:cfg.ports.http},{l:'HTTPS',v:cfg.ports.https},{l:'RTSP',v:cfg.ports.rtsp},{l:'ONVIF',v:cfg.ports.onvif}].map((f,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                  <span className="mono" style={{ fontSize: 11, color: f.v?'var(--text-mid)':'var(--text-low)' }}>{f.v || '—'}</span>
                </div>
              ))}
              {cfg.rtsp && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>RTSP URL</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--brand)', padding: '4px 8px', borderRadius: 4, background: 'rgba(63,169,245,0.04)', wordBreak: 'break-all', cursor: 'pointer' }} onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(cfg.rtsp); showToast('Copied RTSP URL'); } else showToast('Clipboard unavailable'); }}>{cfg.rtsp}</div>
                </div>
              )}
              {cfg.ip && (
                <button onClick={() => {
                  const p = cfg.ports || {};
                  const url = p.https ? `https://${cfg.ip}:${p.https}` : `http://${cfg.ip}${p.http ? `:${p.http}` : ''}`;
                  window.open(url, '_blank', 'noopener');
                }} style={{ marginTop: 8, width: '100%', padding: '6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open Web UI →</button>
              )}
            </GlassPanel>

            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 10 }}>INSTALLATION</div>
              {[{l:'Firmware',v:cfg.firmware},{l:'PoE',v:cfg.poe?'Yes':'No'},{l:'Mount',v:cfg.mount},{l:'Cable',v:cfg.cable},{l:'Switch / Port',v:cfg.switch},{l:'Install Date',v:cfg.installDate},{l:'Purchase Date',v:cfg.purchaseDate},{l:'Warranty',v:cfg.warranty}].map((f,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                  <span className={f.l==='Firmware'?'mono':''} style={{ fontSize: 11, color: 'var(--text-mid)' }}>{f.v || '—'}</span>
                </div>
              ))}
              {cfg.fwUpdate && (
                <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 5, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 11, color: 'var(--status-warn)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚠ Firmware update available
                  <button onClick={() => showToast("Firmware scheduling isn't wired up yet — update the device directly")} style={{ marginLeft: 'auto', padding: '3px 8px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 4, color: 'var(--status-warn)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Schedule Update</button>
                </div>
              )}
            </GlassPanel>

            {/* Location */}
            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 10 }}>LOCATION</div>
              {[{l:'Customer',v:cfg.customer},{l:'Site',v:cfg.site},{l:'Room',v:cfg.room},{l:'Floor',v:cfg.floor}].map((f,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                  <span style={{ fontSize: 11, color: f.l==='Customer'?'var(--brand)':'var(--text-mid)' }}>{f.v}</span>
                </div>
              ))}
            </GlassPanel>

            {/* Cost (internal only) */}
            <GlassPanel style={{ borderLeft: '3px solid var(--status-warn)' }}>
              <div className="label-sm" style={{ marginBottom: 10, color: 'var(--status-warn)' }}>COST (INTERNAL ONLY)</div>
              {[{l:'Purchase Cost',v:`$${cfg.cost}`},{l:'Install Cost',v:`$${cfg.installCost}`},{l:'Total',v:`$${cfg.cost+cfg.installCost}`}].map((f,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i<2?'1px solid rgba(63,169,245,0.04)':'2px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.l}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: i===2?600:400 }}>{f.v}</span>
                </div>
              ))}
            </GlassPanel>

            {/* Notes */}
            <GlassPanel>
              <div className="label-sm" style={{ marginBottom: 6 }}>NOTES</div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6 }}>{notes || 'No notes.'}</p>
              <button onClick={editNotes} style={{ marginTop: 8, padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit Notes</button>
            </GlassPanel>
          </div>
        )}

        {detailTab === 'monitoring' && (
          <GlassPanel style={{ textAlign: 'center', padding: 28 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>MONITORING</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>No uptime feed connected</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Connect a monitoring collector to see live uptime and ping events for this device.</div>
          </GlassPanel>
        )}

        {detailTab === 'related' && (
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 10 }}>RELATED ITEMS</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '8px 0' }}>No related items linked to this configuration.</div>
            <button onClick={() => showToast("Related-item linking isn't wired up yet")} style={{ marginTop: 8, padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Link Related Item</button>
          </GlassPanel>
        )}

        {(detailTab === 'network' || detailTab === 'photos' || detailTab === 'audit') && (
          <GlassPanel style={{ textAlign: 'center', padding: 24, color: 'var(--text-mid)', fontSize: 13 }}>
            {detailTab === 'photos' && 'Photos & attachments — drag to upload images of installation, cable runs, mounting.'}
            {detailTab === 'audit' && 'Full audit trail: who viewed/edited this configuration, with timestamps and revision diffs.'}
            {detailTab === 'network' && `IP Map: ${cfg.ip} on VLAN ${cfg.vlan} · Switch ${cfg.switch} · All assignments for ${cfg.site}`}
          </GlassPanel>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Asset Types Manager ── */
function AssetTypesManager({ showToast }) {
  const [createModal, setCreateModal] = React.useState(false);
  const types = [
    { name: 'IP Camera', icon: '◉', count: 42, fields: 12, color: 'var(--brand)' },
    { name: 'NVR / DVR', icon: '⊟', count: 8, fields: 10, color: 'var(--brand)' },
    { name: 'Access Reader', icon: '⊠', count: 24, fields: 8, color: '#c084fc' },
    { name: 'Access Panel', icon: '⊞', count: 6, fields: 9, color: '#c084fc' },
    { name: 'Alarm Panel', icon: '⚠', count: 4, fields: 11, color: 'var(--status-critical)' },
    { name: 'Fire Panel', icon: '⚠', count: 2, fields: 10, color: 'var(--status-critical)' },
    { name: 'Network Switch', icon: '⊚', count: 12, fields: 8, color: 'var(--status-ok)' },
    { name: 'UPS / Power', icon: '⚡', count: 6, fields: 6, color: 'var(--status-warn)' },
    { name: 'Intercom', icon: '✆', count: 3, fields: 7, color: 'var(--text-mid)' },
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeader title="Configuration Types" icon="⊡" count={types.length} />
        <button onClick={() => setCreateModal(true)} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Type</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {types.map((t,i) => (
          <GlassPanel key={i} style={{ cursor: 'pointer', padding: 14 }} onClick={() => showToast("Type editing isn't wired up yet")}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-low)' }}>
              <span>{t.count} assets</span>
              <span>{t.fields} fields</span>
            </div>
          </GlassPanel>
        ))}
      </div>
      {createModal && <CreateAssetTypeModal onClose={() => setCreateModal(false)} showToast={showToast} />}
    </div>
  );
}

/* ── Create Asset (Configuration) Modal ── */
function CreateAssetModal({ onClose, showToast }) {
  const [f, setF] = React.useState({});
  const bind = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const [assetType, setAssetType] = React.useState('IP Camera');
  const [step, setStep] = React.useState(1);
  const types = ['IP Camera','NVR / DVR','Access Reader','Access Panel','Alarm Panel','Fire Panel','Network Switch','UPS / Power','Intercom','Other'];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 640, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Configuration</span>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>Step {step} of 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'var(--brand)' : 'var(--border-subtle)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="label-sm">ASSET TYPE</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {types.map(t => (
                <button key={t} onClick={() => setAssetType(t)} style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, background: assetType===t?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${assetType===t?'var(--brand)':'var(--border-subtle)'}`, color: assetType===t?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t}</button>
              ))}
            </div>
            <div className="label-sm" style={{ marginTop: 4 }}>CUSTOMER & LOCATION</div>
            <CustomerSelector style={{}} showToast={showToast} value={f.customer || ''} onChange={(v) => setF(prev => ({ ...prev, customer: v }))} />
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Site" value={f['Site'] || ''} onChange={bind('Site')} placeholder="Main Office" style={{ flex: 1 }} />
              <FormField label="Room / Location" value={f['Room / Location'] || ''} onChange={bind('Room / Location')} placeholder="Lobby" style={{ flex: 1 }} />
              <FormField label="Floor" value={f['Floor'] || ''} onChange={bind('Floor')} placeholder="1" style={{ flex: 1 }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="label-sm">IDENTITY</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Name" value={f['Name'] || ''} onChange={bind('Name')} placeholder="CAM-01 (Lobby)" style={{ flex: 2 }} />
              <FormField label="Asset Tag" value={f['Asset Tag'] || ''} onChange={bind('Asset Tag')} placeholder="ST-40012 (auto)" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Manufacturer" value={f['Manufacturer'] || ''} onChange={bind('Manufacturer')} placeholder="Axis" style={{ flex: 1 }} />
              <FormField label="Model" value={f['Model'] || ''} onChange={bind('Model')} placeholder="P3265-V" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Serial Number" value={f['Serial Number'] || ''} onChange={bind('Serial Number')} placeholder="ACCC8EF01234" style={{ flex: 1 }} />
              <FormField label="MAC Address" value={f['MAC Address'] || ''} onChange={bind('MAC Address')} placeholder="AC:CC:8E:F0:12:34" style={{ flex: 1 }} />
            </div>
            <FormField label="Hostname" value={f['Hostname'] || ''} onChange={bind('Hostname')} placeholder="cam-lobby-01" />

            <div className="label-sm" style={{ marginTop: 4 }}>NETWORK</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="IP Address" value={f['IP Address'] || ''} onChange={bind('IP Address')} placeholder="192.168.1.101" style={{ flex: 1 }} />
              <FormField label="Subnet" value={f['Subnet'] || ''} onChange={bind('Subnet')} placeholder="/24" style={{ flex: 1 }} />
              <FormField label="Gateway" value={f['Gateway'] || ''} onChange={bind('Gateway')} placeholder="192.168.1.1" style={{ flex: 1 }} />
              <FormField label="VLAN" value={f['VLAN'] || ''} onChange={bind('VLAN')} placeholder="10" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="HTTP Port" value={f['HTTP Port'] || ''} onChange={bind('HTTP Port')} placeholder="80" style={{ flex: 1 }} />
              <FormField label="HTTPS Port" value={f['HTTPS Port'] || ''} onChange={bind('HTTPS Port')} placeholder="443" style={{ flex: 1 }} />
              <FormField label="RTSP Port" value={f['RTSP Port'] || ''} onChange={bind('RTSP Port')} placeholder="554" style={{ flex: 1 }} />
              <FormField label="ONVIF Port" value={f['ONVIF Port'] || ''} onChange={bind('ONVIF Port')} placeholder="8080" style={{ flex: 1 }} />
            </div>
            <FormField label="RTSP URL" value={f['RTSP URL'] || ''} onChange={bind('RTSP URL')} placeholder="rtsp://192.168.1.101:554/axis-media/media.amp" />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="label-sm">INSTALLATION</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Firmware Version" value={f['Firmware Version'] || ''} onChange={bind('Firmware Version')} placeholder="11.8.64" style={{ flex: 1 }} />
              <div style={{ flex: 1 }}>
                <div className="label-sm" style={{ marginBottom: 4 }}>PoE Powered</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Segmented options={['Yes','No']} defaultValue="Yes"
                    btnStyle={{ flex: 1, padding: '7px', borderRadius: 5, fontSize: 12 }}
                    activeStyle={{ background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
                    idleStyle={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Mount Type" value={f['Mount Type'] || ''} onChange={bind('Mount Type')} placeholder="10ft ceiling" style={{ flex: 1 }} />
              <FormField label="Cable Type" value={f['Cable Type'] || ''} onChange={bind('Cable Type')} placeholder="Cat6A" style={{ flex: 1 }} />
              <FormField label="Switch / Port" value={f['Switch / Port'] || ''} onChange={bind('Switch / Port')} placeholder="SW-01 Port 3" style={{ flex: 1 }} />
            </div>

            <div className="label-sm" style={{ marginTop: 4 }}>DATES & WARRANTY</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Purchase Date" value={f['Purchase Date'] || ''} onChange={bind('Purchase Date')} placeholder="Dec 20, 2024" style={{ flex: 1 }} />
              <FormField label="Install Date" value={f['Install Date'] || ''} onChange={bind('Install Date')} placeholder="Jan 15, 2025" style={{ flex: 1 }} />
              <FormField label="Warranty Expires" value={f['Warranty Expires'] || ''} onChange={bind('Warranty Expires')} placeholder="Jan 15, 2028" style={{ flex: 1 }} />
            </div>

            <div className="label-sm" style={{ marginTop: 4 }}>COST (INTERNAL)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Purchase Cost" value={f['Purchase Cost'] || ''} onChange={bind('Purchase Cost')} placeholder="$520" style={{ flex: 1 }} />
              <FormField label="Install Cost" value={f['Install Cost'] || ''} onChange={bind('Install Cost')} placeholder="$280" style={{ flex: 1 }} />
            </div>

            <div className="label-sm" style={{ marginTop: 4 }}>CREDENTIALS (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Username" value={f['Username'] || ''} onChange={bind('Username')} placeholder="admin" style={{ flex: 1 }} />
              <FormField label="Password" value={f['Password'] || ''} onChange={bind('Password')} placeholder="••••••••" style={{ flex: 1 }} />
            </div>

            <FormField label="Notes" value={f['Notes'] || ''} onChange={bind('Notes')} placeholder="Additional notes about this device..." />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Next →</button>
          ) : (
            <button onClick={() => {
              const rec = {
                id: genId('CFG'), status: 'online', customer: f.customer || '\u2014',
                name: f['Name'] || `${assetType} \u2014 ${f.customer || 'unnamed'}`, type: assetType,
                mfg: f['Manufacturer'] || '', model: f['Model'] || '', serial: f['Serial Number'] || '',
                mac: f['MAC Address'] || '', ip: f['IP Address'] || '', site: f['Site'] || '', room: f['Room / Location'] || '',
                firmware: f['Firmware Version'] || '', fwUpdate: false,
                mount: f['Mount Type'] || '', cable: f['Cable Type'] || '', switchPort: f['Switch / Port'] || '',
                notes: f['Notes'] || '',
              };
              assetStore.set(list => [rec, ...(list || [])]);
              if (f['Password']) assetPwStore.set(list => [{ id: genId('PW'), customer: f.customer || '\u2014', label: `${rec.name} admin`, device: rec.name, username: f['Username'] || 'admin', password: f['Password'], type: 'Device' }, ...(list || [])]);
              onClose(); showToast(`${rec.name} created \u2014 synced everywhere`);
            }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Asset</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Create Flexible Asset Modal ── */
function CreateFlexAssetModal({ onClose, showToast }) {
  const [f, setF] = React.useState({});
  const bind = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const [selectedType, setSelectedType] = React.useState('CCTV System');
  const flexTypes = {
    'CCTV System': ['NVR Model','NVR IP Address','Camera Count','Total Storage (TB)','Retention (days)','VMS Software','Recording Resolution','Frame Rate','Motion Detection','Analytics Enabled'],
    'Access Control System': ['Panel Model','Panel IP Address','Door/Reader Count','Credential Type','Max Cardholders','Software Platform','Cloud / On-Prem','Lockdown Capable','Anti-passback','Integration Notes'],
    'Monitoring Account': ['Central Station','Account Number','Signal Path (IP/Cell/POTS)','Zone Count','Permit Number','Permit Expiry','Test Schedule','Subscriber Name','Emergency Contact','Special Instructions'],
    'Network Infrastructure': ['Router Model','Firewall','ISP','WAN IP','Bandwidth (Mbps)','VPN Type','VLAN Count','DHCP Server','DNS Servers','Wi-Fi SSID'],
    'Custom Type': ['Field 1','Field 2','Field 3'],
  };
  const fields = flexTypes[selectedType] || [];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 580, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Flexible Asset</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="label-sm">ASSET TYPE</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(flexTypes).map(t => (
              <button key={t} onClick={() => setSelectedType(t)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, background: selectedType===t?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${selectedType===t?'var(--brand)':'var(--border-subtle)'}`, color: selectedType===t?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t}</button>
            ))}
          </div>
          <CustomerSelector style={{}} showToast={showToast} value={f.customer || ''} onChange={(v) => setF(prev => ({ ...prev, customer: v }))} />
          <FormField label="Asset Name" value={f['Asset Name'] || ''} onChange={bind('Asset Name')} placeholder={`e.g. ${selectedType} — Main Office`} />
          <div className="label-sm" style={{ marginTop: 4 }}>{selectedType.toUpperCase()} FIELDS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map((f, i) => <FormField key={i} label={f} placeholder={`Enter ${f.toLowerCase()}...`} />)}
          </div>
          <FormField label="Notes" value={f['Notes'] || ''} onChange={bind('Notes')} placeholder="Additional notes..." />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => {
            const fieldNotes = fields.map(fl => f[fl] ? `${fl}: ${f[fl]}` : null).filter(Boolean).join('\n');
            assetStore.set(list => [{
              id: genId('FLX'), status: 'online', customer: f.customer || '\u2014',
              name: f['Asset Name'] || `${selectedType} \u2014 ${f.customer || 'unnamed'}`, type: selectedType,
              mfg: '', model: '', serial: '', mac: '', ip: '', site: '', room: '',
              firmware: '', fwUpdate: false, mount: '', cable: '', switchPort: '',
              notes: [fieldNotes, f['Notes'] || ''].filter(Boolean).join('\n'),
            }, ...(list || [])]);
            onClose(); showToast(`${selectedType} created \u2014 synced everywhere`);
          }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Password Modal ── */
function CreatePasswordModal({ onClose, showToast }) {
  const [f, setF] = React.useState({});
  const bind = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const [genPass, setGenPass] = React.useState('');
  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    setGenPass(Array.from({length: 16}, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 480, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Credential</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Name" value={f['Name'] || ''} onChange={bind('Name')} placeholder="e.g. NVR Admin, Camera Wi-Fi, Panel Installer" />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Category</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option>NVR</option><option>Access Control</option><option>Monitoring</option><option>Network</option><option>Alarm Panel</option><option>Fire Panel</option><option>Wi-Fi</option><option>Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Username" value={f['Username'] || ''} onChange={bind('Username')} placeholder="admin" style={{ flex: 1 }} />
            <FormField label="URL" value={f['URL'] || ''} onChange={bind('URL')} placeholder="https://192.168.1.100" style={{ flex: 1 }} />
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Password</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={f['Password'] ?? genPass} onChange={bind('Password')} placeholder="Enter or generate..." style={{ flex: 1, padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }} />
              <button onClick={generate} style={{ padding: '7px 14px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Generate</button>
            </div>
            {genPass && <div className="mono" style={{ fontSize: 11, color: 'var(--status-ok)', marginTop: 6, padding: '4px 8px', borderRadius: 4, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>{genPass}</div>}
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Linked Device (optional)</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option value="">None — standalone credential</option>
              <option>NVR-01 (Server Room)</option><option>CAM-01 (Lobby)</option><option>SW-01 (IDF)</option><option>Panel-01 (Alarm)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Password Expiry" value={f['Password Expiry'] || ''} onChange={bind('Password Expiry')} placeholder="Optional — e.g. Aug 2026" style={{ flex: 1 }} />
            <FormField label="Rotation Reminder" value={f['Rotation Reminder'] || ''} onChange={bind('Rotation Reminder')} placeholder="e.g. 90 days" style={{ flex: 1 }} />
          </div>
          <FormField label="Notes" value={f['Notes'] || ''} onChange={bind('Notes')} placeholder="Who has access, special instructions..." />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => {
            const pw = f['Password'] ?? genPass;
            if (!(f['Name'] || '').trim() || !pw) { showToast('Name and password are required'); return; }
            assetPwStore.set(list => [{
              id: genId('PW'), customer: f.customer || '\u2014', label: f['Name'].trim(),
              device: f['URL'] || '', username: f['Username'] || '', password: pw, type: 'Device',
              expiry: f['Password Expiry'] || '', notes: f['Notes'] || '',
            }, ...(list || [])]);
            onClose(); showToast('Credential saved to the shared vault');
          }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Credential</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Document Modal ── */
function CreateDocumentModal({ onClose, showToast }) {
  const [f, setF] = React.useState({});
  const bind = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Document</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Document Title" value={f['Document Title'] || ''} onChange={bind('Document Title')} placeholder="e.g. Network Diagram — Main Office" />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Document Type</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option>As-Built</option><option>Diagram</option><option>Runbook</option><option>SOP</option><option>Checklist</option><option>Contract</option><option>Floor Plan</option><option>Wiring Schedule</option><option>Other</option>
            </select>
          </div>
          <CustomerSelector style={{}} showToast={showToast} value={f.customer || ''} onChange={(v) => setF(prev => ({ ...prev, customer: v }))} />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Content</div>
            <textarea placeholder="Start typing your document content here... Supports rich text, tables, and embedded images." style={{ width: '100%', minHeight: 120, padding: '10px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Attachments</div>
            <div style={{ padding: 20, border: '2px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer' }}>
              Drag & drop files or click to upload<br />
              <span style={{ fontSize: 10 }}>PDF, PNG, JPG, DWG, Visio — up to 25MB</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="label-sm" style={{ marginBottom: 4 }}>Related Devices</div>
              <select multiple style={{ width: '100%', padding: '6px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', minHeight: 60 }}>
                <option>NVR-01 (Server Room)</option><option>CAM-01 (Lobby)</option><option>SW-01 (IDF)</option><option>Panel-01 (Alarm)</option>
              </select>
            </div>
            <FormField label="Version" value={f['Version'] || ''} onChange={bind('Version')} placeholder="v1" style={{ flex: 0.4 }} />
          </div>
          <FormField label="Tags" value={f['Tags'] || ''} onChange={bind('Tags')} placeholder="network, diagram, as-built" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => {
            if (!(f['Document Title'] || '').trim()) { showToast('Add a document title first'); return; }
            assetDocStore.set(list => [{
              id: genId('DOC'), customer: f.customer || '\u2014', name: f['Document Title'].trim(),
              type: 'Document', size: '\u2014', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              url: null, status: 'draft',
            }, ...(list || [])]);
            onClose(); showToast('Document saved as draft');
          }} style={{ padding: '8px 20px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Draft</button>
          <button onClick={() => {
            if (!(f['Document Title'] || '').trim()) { showToast('Add a document title first'); return; }
            assetDocStore.set(list => [{
              id: genId('DOC'), customer: f.customer || '\u2014', name: f['Document Title'].trim(),
              type: 'Document', size: '\u2014', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              url: null, status: 'published',
            }, ...(list || [])]);
            onClose(); showToast('Document published \u2014 synced everywhere');
          }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Publish</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Network Modal ── */
function CreateNetworkModal({ onClose, showToast }) {
  const [f, setF] = React.useState({});
  const bind = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Network Range</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Network Name" value={f['Network Name'] || ''} onChange={bind('Network Name')} placeholder="e.g. Security VLAN, Camera VLAN, Management" />
          <CustomerSelector style={{}} showToast={showToast} value={f.customer || ''} onChange={(v) => setF(prev => ({ ...prev, customer: v }))} />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Site</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option value="">Select site...</option><option>Main Office</option><option>Branch Office</option><option>Data Center</option>
            </select>
          </div>
          <div className="label-sm" style={{ marginTop: 4 }}>NETWORK DETAILS</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Subnet" value={f['Subnet'] || ''} onChange={bind('Subnet')} placeholder="192.168.1.0/24" style={{ flex: 2 }} />
            <FormField label="VLAN ID" value={f['VLAN ID'] || ''} onChange={bind('VLAN ID')} placeholder="10" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Gateway" value={f['Gateway'] || ''} onChange={bind('Gateway')} placeholder="192.168.1.1" style={{ flex: 1 }} />
            <FormField label="Subnet Mask" value={f['Subnet Mask'] || ''} onChange={bind('Subnet Mask')} placeholder="255.255.255.0" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="DNS Primary" value={f['DNS Primary'] || ''} onChange={bind('DNS Primary')} placeholder="8.8.8.8" style={{ flex: 1 }} />
            <FormField label="DNS Secondary" value={f['DNS Secondary'] || ''} onChange={bind('DNS Secondary')} placeholder="8.8.4.4" style={{ flex: 1 }} />
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>DHCP</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Segmented options={['Enabled','Disabled','External']} defaultValue="Disabled"
                btnStyle={{ flex: 1, padding: '6px', borderRadius: 5, fontSize: 11 }}
                activeStyle={{ background: 'rgba(63,169,245,0.1)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
                idleStyle={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="DHCP Range Start" value={f['DHCP Range Start'] || ''} onChange={bind('DHCP Range Start')} placeholder="192.168.1.100" style={{ flex: 1 }} />
            <FormField label="DHCP Range End" value={f['DHCP Range End'] || ''} onChange={bind('DHCP Range End')} placeholder="192.168.1.200" style={{ flex: 1 }} />
          </div>
          <FormField label="Purpose / Notes" value={f['Purpose / Notes'] || ''} onChange={bind('Purpose / Notes')} placeholder="Security cameras, access control, etc." />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => {
            if (!(f['Network Name'] || '').trim()) { showToast('Add a network name first'); return; }
            assetNetStore.set(list => [{
              id: genId('NET'), customer: f.customer || '\u2014', name: f['Network Name'].trim(),
              subnet: f['Subnet (CIDR)'] || f['Subnet'] || '', gw: f['Gateway'] || '', vlan: f['VLAN ID'] || '',
              devices: 0, type: 'Wired', notes: f['Notes'] || '',
            }, ...(list || [])]);
            onClose(); showToast('Network documented \u2014 synced everywhere');
          }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Network</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Asset Type Modal ── */
function CreateAssetTypeModal({ onClose, showToast }) {
  const [f, setF] = React.useState({});
  const bind = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const [fields, setFields] = React.useState([{ name: '', type: 'text', required: false }]);
  const addField = () => setFields(prev => [...prev, { name: '', type: 'text', required: false }]);
  const removeField = (idx) => setFields(prev => prev.filter((_, i) => i !== idx));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 560, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Asset Type</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Type Name" value={f['Type Name'] || ''} onChange={bind('Type Name')} placeholder="e.g. Intercom Station, Gate Operator" style={{ flex: 2 }} />
            <FormField label="Icon" value={f['Icon'] || ''} onChange={bind('Icon')} placeholder="◉" style={{ flex: 0.5 }} />
          </div>
          <FormField label="Description" value={f['Description'] || ''} onChange={bind('Description')} placeholder="Short description of this configuration type" />

          <div className="label-sm" style={{ marginTop: 4 }}>CUSTOM FIELDS</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 4 }}>Define the fields that appear on every configuration of this type (in addition to standard fields like Name, Serial, IP, etc.)</div>

          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <FormField label={i === 0 ? 'Field Name' : ''} placeholder="e.g. Resolution, Zone Count" style={{ flex: 2 }} />
              <div style={{ flex: 1 }}>
                {i === 0 && <div className="label-sm" style={{ marginBottom: 4 }}>Type</div>}
                <select style={{ width: '100%', padding: '7px 8px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="date">Date</option>
                  <option value="url">URL</option>
                  <option value="ip">IP Address</option>
                  <option value="password">Password</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 2 }}>
                <input type="checkbox" style={{ accentColor: 'var(--brand)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Req</span>
              </div>
              <button onClick={() => removeField(i)} style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--status-critical)', fontSize: 11, cursor: 'pointer', marginBottom: 2 }}>✕</button>
            </div>
          ))}
          <button onClick={addField} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Field</button>

          <div className="label-sm" style={{ marginTop: 4 }}>OPTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Show in global asset list','Include in customer exports','Auto-generate asset tag prefix'].map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-mid)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={i < 2} style={{ accentColor: 'var(--brand)' }} /> {opt}
              </label>
            ))}
          </div>
          <FormField label="Tag Prefix" value={f['Tag Prefix'] || ''} onChange={bind('Tag Prefix')} placeholder="e.g. INT for Intercom → ST-INT-001" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button disabled title="Custom asset types aren't available yet — use Flexible Assets meanwhile" style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.5, fontFamily: 'var(--font-body)' }}>Custom types coming soon</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AssetsScreen, ConfigurationDetail, AssetTypesManager, CreateAssetModal, CreateFlexAssetModal, CreatePasswordModal, CreateDocumentModal, CreateNetworkModal, CreateAssetTypeModal });

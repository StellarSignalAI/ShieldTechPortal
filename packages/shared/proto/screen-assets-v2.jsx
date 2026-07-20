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

  const configs = [
    { id: 'CFG-001', name: 'CAM-01 (Lobby)', tag: 'ST-40012', type: 'IP Camera', mfg: 'Axis', model: 'P3265-V', serial: 'ACCC8EF01234', mac: 'AC:CC:8E:F0:12:34', hostname: 'cam-lobby-01', ip: '192.168.1.101', subnet: '/24', gateway: '192.168.1.1', vlan: 10, ports: { http: 80, https: 443, rtsp: 554, onvif: 8080 }, rtsp: 'rtsp://192.168.1.101:554/axis-media/media.amp', firmware: '11.8.64', fwUpdate: true, poe: true, mount: '10ft ceiling', cable: 'Cat6A', switch: 'SW-01 Port 3', installDate: 'Jan 15, 2025', purchaseDate: 'Dec 20, 2024', warranty: 'Jan 15, 2028', customer: 'Metro Bank Corp', site: 'Main Office', room: 'Lobby', floor: 1, status: 'online', uptime: 99.8, cost: 520, installCost: 280, notes: 'Covers main entrance + ATM area' },
    { id: 'CFG-002', name: 'CAM-02 (Parking N)', tag: 'ST-40013', type: 'IP Camera', mfg: 'Axis', model: 'P3265-V', serial: 'ACCC8EF01235', mac: 'AC:CC:8E:F0:12:35', hostname: 'cam-parking-n', ip: '192.168.1.102', subnet: '/24', gateway: '192.168.1.1', vlan: 10, ports: { http: 80, https: 443, rtsp: 554, onvif: 8080 }, rtsp: 'rtsp://192.168.1.102:554/axis-media/media.amp', firmware: '11.8.64', fwUpdate: false, poe: true, mount: '15ft pole', cable: 'Cat6A', switch: 'SW-01 Port 4', installDate: 'Jan 15, 2025', purchaseDate: 'Dec 20, 2024', warranty: 'Jan 15, 2028', customer: 'Metro Bank Corp', site: 'Main Office', room: 'Parking N', floor: 0, status: 'online', uptime: 99.6, cost: 520, installCost: 350, notes: '' },
    { id: 'CFG-003', name: 'NVR-01 (Server Room)', tag: 'ST-40020', type: 'NVR', mfg: 'Hanwha', model: 'XNR-6410', serial: 'HWV2605001234', mac: '00:09:18:A0:12:34', hostname: 'nvr-main', ip: '192.168.1.100', subnet: '/24', gateway: '192.168.1.1', vlan: 10, ports: { http: 80, https: 443 }, rtsp: '', firmware: '2.01.04', fwUpdate: true, poe: false, mount: 'Rack U4', cable: 'Cat6A', switch: 'SW-01 Port 1', installDate: 'Jan 15, 2025', purchaseDate: 'Dec 18, 2024', warranty: 'Jan 15, 2028', customer: 'Metro Bank Corp', site: 'Main Office', room: 'Server Room', floor: 1, status: 'online', uptime: 99.9, cost: 1650, installCost: 400, notes: '8TB RAID5, 30-day retention' },
    { id: 'CFG-004', name: 'RDR-01 (Front Door)', tag: 'ST-40030', type: 'Access Reader', mfg: 'HID', model: 'iCLASS SE RK40', serial: 'HID8820001234', mac: '', hostname: '', ip: '', subnet: '', gateway: '', vlan: 0, ports: {}, rtsp: '', firmware: 'R3.4', fwUpdate: false, poe: false, mount: '48in AFF', cable: '18/4 + 22/6', switch: '', installDate: 'Mar 10, 2025', purchaseDate: 'Mar 1, 2025', warranty: 'Mar 10, 2027', customer: 'Metro Bank Corp', site: 'Main Office', room: 'Main Entrance', floor: 1, status: 'online', uptime: 100, cost: 180, installCost: 120, notes: 'Wiegand to VertX V1000' },
    { id: 'CFG-005', name: 'SW-01 (IDF)', tag: 'ST-40040', type: 'Network Switch', mfg: 'Cisco', model: 'CBS350-24P-4G', serial: 'FCW12345678', mac: '00:1A:2B:3C:4D:5E', hostname: 'sw-idf-01', ip: '192.168.1.2', subnet: '/24', gateway: '192.168.1.1', vlan: 1, ports: { http: 80, https: 443 }, rtsp: '', firmware: '3.2.0.84', fwUpdate: false, poe: true, mount: 'Rack U10', cable: 'Cat6A', switch: 'Core Port 24', installDate: 'Jan 12, 2025', purchaseDate: 'Dec 10, 2024', warranty: 'Jan 12, 2030', customer: 'Metro Bank Corp', site: 'Main Office', room: 'Server Room', floor: 1, status: 'online', uptime: 99.95, cost: 680, installCost: 200, notes: '24-port PoE+, 370W budget' },
    { id: 'CFG-006', name: 'CAM-10 (ER Entrance)', tag: 'ST-50001', type: 'IP Camera', mfg: 'Axis', model: 'P3265-V', serial: 'ACCC8EF05678', mac: 'AC:CC:8E:F0:56:78', hostname: 'cam-er-01', ip: '10.0.1.101', subnet: '/24', gateway: '10.0.1.1', vlan: 20, ports: { http: 80, https: 443, rtsp: 554 }, rtsp: 'rtsp://10.0.1.101:554/axis-media/media.amp', firmware: '11.6.42', fwUpdate: true, poe: true, mount: '12ft ceiling', cable: 'Cat6A', switch: 'SW-RM-01 Port 2', installDate: 'Feb 1, 2024', purchaseDate: 'Jan 15, 2024', warranty: 'Feb 1, 2027', customer: 'Riverside Medical', site: 'Main Campus', room: 'ER Entrance', floor: 1, status: 'warning', uptime: 97.2, cost: 520, installCost: 300, notes: 'Intermittent packet loss — check cable run' },
  ];

  const filteredConfigs = customerScope ? configs.filter(c => c.customer === customerScope) : configs;
  const siteScopedConfigs = siteScope ? filteredConfigs.filter(c => c.site === siteScope) : filteredConfigs;
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
        <input placeholder="Search configs, passwords, docs..." style={{ padding: '6px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 240 }} />
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
        <button onClick={() => showToast('Export: asset list PDF/CSV')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export</button>
        <button onClick={() => showToast('Bulk import CSV')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Import</button>
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
        {tab === 'flexible' && <CustomerFlexAssets customer={{ name: customerScope || 'All Customers' }} showToast={showToast} />}
        {tab === 'passwords' && <CustomerPasswords showToast={showToast} />}
        {tab === 'documents' && <CustomerDocs showToast={showToast} />}
        {tab === 'networks' && <CustomerNetworks showToast={showToast} />}
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
          <button onClick={() => showToast('Edit configuration')} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit</button>
          <button onClick={() => showToast('Revision history')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>History</button>
          <button onClick={() => showToast('Related items')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Related</button>
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
                  <div className="mono" style={{ fontSize: 10, color: 'var(--brand)', padding: '4px 8px', borderRadius: 4, background: 'rgba(63,169,245,0.04)', wordBreak: 'break-all', cursor: 'pointer' }} onClick={() => showToast('Copied RTSP URL')}>{cfg.rtsp}</div>
                </div>
              )}
              {cfg.ip && (
                <button onClick={() => showToast('Opening web UI...')} style={{ marginTop: 8, width: '100%', padding: '6px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open Web UI →</button>
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
                  <button onClick={() => showToast('Firmware update scheduled')} style={{ marginLeft: 'auto', padding: '3px 8px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 4, color: 'var(--status-warn)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Schedule Update</button>
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
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6 }}>{cfg.notes || 'No notes.'}</p>
              <button onClick={() => showToast('Edit notes')} style={{ marginTop: 8, padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit Notes</button>
            </GlassPanel>
          </div>
        )}

        {detailTab === 'monitoring' && (
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 10 }}>LIVE MONITORING</div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--status-ok)' }}>{cfg.uptime}%</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>90-Day Uptime</div></div>
              <div style={{ flex: 1 }}><div className="label-sm" style={{ marginBottom: 6 }}>UPTIME STRIP (90 DAYS)</div><UptimeStrip data={Array.from({length:90},()=>97+Math.random()*3)} /></div>
            </div>
            <div className="label-sm" style={{ marginBottom: 8 }}>RECENT EVENTS</div>
            {[{t:'Jun 5, 2:14 PM',e:'Ping OK — 2ms latency',s:'online'},{t:'Jun 4, 11:30 PM',e:'Brief packet loss (0.5%)',s:'warning'},{t:'Jun 1, 9:00 AM',e:'Firmware check — update available',s:'info'}].map((ev,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <StatusDot status={ev.s} size={5} /><span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 100 }}>{ev.t}</span><span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{ev.e}</span>
              </div>
            ))}
          </GlassPanel>
        )}

        {detailTab === 'related' && (
          <GlassPanel>
            <div className="label-sm" style={{ marginBottom: 10 }}>RELATED ITEMS</div>
            {[{type:'Password',name:'NVR Admin',icon:'⊠'},{type:'Document',name:'Camera Schedule & Locations',icon:'▤'},{type:'Device (Parent)',name:'NVR-01 (Server Room)',icon:'⬡'},{type:'Contact',name:'Linda Park — Security Manager',icon:'◎'}].map((r,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer' }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.type}</div>
                </div>
                <span style={{ color: 'var(--text-low)', fontSize: 10 }}>›</span>
              </div>
            ))}
            <button onClick={() => showToast('Add related item')} style={{ marginTop: 8, padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Link Related Item</button>
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
          <GlassPanel key={i} style={{ cursor: 'pointer', padding: 14 }} onClick={() => showToast(`Edit type: ${t.name}`)}>
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
            <CustomerSelector style={{}} showToast={showToast} />
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Site" placeholder="Main Office" style={{ flex: 1 }} />
              <FormField label="Room / Location" placeholder="Lobby" style={{ flex: 1 }} />
              <FormField label="Floor" placeholder="1" style={{ flex: 1 }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="label-sm">IDENTITY</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Name" placeholder="CAM-01 (Lobby)" style={{ flex: 2 }} />
              <FormField label="Asset Tag" placeholder="ST-40012 (auto)" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Manufacturer" placeholder="Axis" style={{ flex: 1 }} />
              <FormField label="Model" placeholder="P3265-V" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Serial Number" placeholder="ACCC8EF01234" style={{ flex: 1 }} />
              <FormField label="MAC Address" placeholder="AC:CC:8E:F0:12:34" style={{ flex: 1 }} />
            </div>
            <FormField label="Hostname" placeholder="cam-lobby-01" />

            <div className="label-sm" style={{ marginTop: 4 }}>NETWORK</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="IP Address" placeholder="192.168.1.101" style={{ flex: 1 }} />
              <FormField label="Subnet" placeholder="/24" style={{ flex: 1 }} />
              <FormField label="Gateway" placeholder="192.168.1.1" style={{ flex: 1 }} />
              <FormField label="VLAN" placeholder="10" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="HTTP Port" placeholder="80" style={{ flex: 1 }} />
              <FormField label="HTTPS Port" placeholder="443" style={{ flex: 1 }} />
              <FormField label="RTSP Port" placeholder="554" style={{ flex: 1 }} />
              <FormField label="ONVIF Port" placeholder="8080" style={{ flex: 1 }} />
            </div>
            <FormField label="RTSP URL" placeholder="rtsp://192.168.1.101:554/axis-media/media.amp" />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="label-sm">INSTALLATION</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Firmware Version" placeholder="11.8.64" style={{ flex: 1 }} />
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
              <FormField label="Mount Type" placeholder="10ft ceiling" style={{ flex: 1 }} />
              <FormField label="Cable Type" placeholder="Cat6A" style={{ flex: 1 }} />
              <FormField label="Switch / Port" placeholder="SW-01 Port 3" style={{ flex: 1 }} />
            </div>

            <div className="label-sm" style={{ marginTop: 4 }}>DATES & WARRANTY</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Purchase Date" placeholder="Dec 20, 2024" style={{ flex: 1 }} />
              <FormField label="Install Date" placeholder="Jan 15, 2025" style={{ flex: 1 }} />
              <FormField label="Warranty Expires" placeholder="Jan 15, 2028" style={{ flex: 1 }} />
            </div>

            <div className="label-sm" style={{ marginTop: 4 }}>COST (INTERNAL)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Purchase Cost" placeholder="$520" style={{ flex: 1 }} />
              <FormField label="Install Cost" placeholder="$280" style={{ flex: 1 }} />
            </div>

            <div className="label-sm" style={{ marginTop: 4 }}>CREDENTIALS (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormField label="Username" placeholder="admin" style={{ flex: 1 }} />
              <FormField label="Password" placeholder="••••••••" style={{ flex: 1 }} />
            </div>

            <FormField label="Notes" placeholder="Additional notes about this device..." />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Next →</button>
          ) : (
            <button onClick={() => { onClose(); showToast('Configuration created'); }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Asset</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Create Flexible Asset Modal ── */
function CreateFlexAssetModal({ onClose, showToast }) {
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
          <CustomerSelector style={{}} showToast={showToast} />
          <FormField label="Asset Name" placeholder={`e.g. ${selectedType} — Main Office`} />
          <div className="label-sm" style={{ marginTop: 4 }}>{selectedType.toUpperCase()} FIELDS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map((f, i) => <FormField key={i} label={f} placeholder={`Enter ${f.toLowerCase()}...`} />)}
          </div>
          <FormField label="Notes" placeholder="Additional notes..." />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { onClose(); showToast(`${selectedType} created`); }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Password Modal ── */
function CreatePasswordModal({ onClose, showToast }) {
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
          <FormField label="Name" placeholder="e.g. NVR Admin, Camera Wi-Fi, Panel Installer" />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Category</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option>NVR</option><option>Access Control</option><option>Monitoring</option><option>Network</option><option>Alarm Panel</option><option>Fire Panel</option><option>Wi-Fi</option><option>Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Username" placeholder="admin" style={{ flex: 1 }} />
            <FormField label="URL" placeholder="https://192.168.1.100" style={{ flex: 1 }} />
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Password</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input defaultValue={genPass} placeholder="Enter or generate..." style={{ flex: 1, padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }} />
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
            <FormField label="Password Expiry" placeholder="Optional — e.g. Aug 2026" style={{ flex: 1 }} />
            <FormField label="Rotation Reminder" placeholder="e.g. 90 days" style={{ flex: 1 }} />
          </div>
          <FormField label="Notes" placeholder="Who has access, special instructions..." />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { onClose(); showToast('Credential saved'); }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Credential</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Document Modal ── */
function CreateDocumentModal({ onClose, showToast }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Document</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Document Title" placeholder="e.g. Network Diagram — Main Office" />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Document Type</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option>As-Built</option><option>Diagram</option><option>Runbook</option><option>SOP</option><option>Checklist</option><option>Contract</option><option>Floor Plan</option><option>Wiring Schedule</option><option>Other</option>
            </select>
          </div>
          <CustomerSelector style={{}} showToast={showToast} />
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
            <FormField label="Version" placeholder="v1" style={{ flex: 0.4 }} />
          </div>
          <FormField label="Tags" placeholder="network, diagram, as-built" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { onClose(); showToast('Document saved as draft'); }} style={{ padding: '8px 20px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Draft</button>
          <button onClick={() => { onClose(); showToast('Document published'); }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Publish</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Network Modal ── */
function CreateNetworkModal({ onClose, showToast }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 520, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 400 }}>New Network Range</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Network Name" placeholder="e.g. Security VLAN, Camera VLAN, Management" />
          <CustomerSelector style={{}} showToast={showToast} />
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>Site</div>
            <select style={{ width: '100%', padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
              <option value="">Select site...</option><option>Main Office</option><option>Branch Office</option><option>Data Center</option>
            </select>
          </div>
          <div className="label-sm" style={{ marginTop: 4 }}>NETWORK DETAILS</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Subnet" placeholder="192.168.1.0/24" style={{ flex: 2 }} />
            <FormField label="VLAN ID" placeholder="10" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="Gateway" placeholder="192.168.1.1" style={{ flex: 1 }} />
            <FormField label="Subnet Mask" placeholder="255.255.255.0" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField label="DNS Primary" placeholder="8.8.8.8" style={{ flex: 1 }} />
            <FormField label="DNS Secondary" placeholder="8.8.4.4" style={{ flex: 1 }} />
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
            <FormField label="DHCP Range Start" placeholder="192.168.1.100" style={{ flex: 1 }} />
            <FormField label="DHCP Range End" placeholder="192.168.1.200" style={{ flex: 1 }} />
          </div>
          <FormField label="Purpose / Notes" placeholder="Security cameras, access control, etc." />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { onClose(); showToast('Network range created'); }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Network</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Asset Type Modal ── */
function CreateAssetTypeModal({ onClose, showToast }) {
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
            <FormField label="Type Name" placeholder="e.g. Intercom Station, Gate Operator" style={{ flex: 2 }} />
            <FormField label="Icon" placeholder="◉" style={{ flex: 0.5 }} />
          </div>
          <FormField label="Description" placeholder="Short description of this configuration type" />

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
          <FormField label="Tag Prefix" placeholder="e.g. INT for Intercom → ST-INT-001" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={() => { onClose(); showToast('Asset type created'); }} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Type</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AssetsScreen, ConfigurationDetail, AssetTypesManager, CreateAssetModal, CreateFlexAssetModal, CreatePasswordModal, CreateDocumentModal, CreateNetworkModal, CreateAssetTypeModal });

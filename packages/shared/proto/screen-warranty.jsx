/* Screen — Equipment Warranty Tracker */

function WarrantyScreen() {
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState(null);

  const today = new Date(2026, 5, 10); // Jun 10 2026

  const assets = [
    { id: 'AST-001', type: 'Camera',        name: 'Axis P3245-V',           customer: 'Metro Bank Corp',       site: 'Branch 2 Floor 2',      serial: 'AXS-PB4201', installed: new Date(2024,0,15), warrantyEnd: new Date(2027,0,15), value: 285,  status: 'active' },
    { id: 'AST-002', type: 'Camera',        name: 'Axis P3245-V',           customer: 'Metro Bank Corp',       site: 'Branch 2 Floor 3',      serial: 'AXS-PB4202', installed: new Date(2024,0,15), warrantyEnd: new Date(2027,0,15), value: 285,  status: 'active' },
    { id: 'AST-003', type: 'NVR',           name: 'Hikvision DS-9616NI',    customer: 'Riverside Medical',     site: 'ICU Floor',             serial: 'HKV-9302',   installed: new Date(2021,3,20), warrantyEnd: new Date(2024,3,20), value: 1200, status: 'expired' },
    { id: 'AST-004', type: 'Access Control','name': 'HID RP40 Reader',      customer: 'City Hall',             site: 'Main Entrance',         serial: 'HID-8812A',  installed: new Date(2023,8,5),  warrantyEnd: new Date(2026,8,5),  value: 165,  status: 'expiring' },
    { id: 'AST-005', type: 'Alarm Panel',   name: 'Bosch B9512G',           customer: 'Westfield Mall',        site: 'Security Office',       serial: 'BSH-5541',   installed: new Date(2022,11,1), warrantyEnd: new Date(2026,11,1), value: 1200, status: 'active' },
    { id: 'AST-006', type: 'Camera',        name: 'Axis Q6135-LE PTZ',      customer: 'Pacific Rim Hotels',    site: 'Hotel 1 Lobby',         serial: 'AXS-QP0991', installed: new Date(2025,1,20), warrantyEnd: new Date(2028,1,20), value: 890,  status: 'active' },
    { id: 'AST-007', type: 'UPS',           name: 'APC Smart-UPS 1500VA',   customer: 'Acme Dental',           site: 'Server Closet',         serial: 'APC-0042',   installed: new Date(2022,5,10), warrantyEnd: new Date(2026,5,10), value: 320,  status: 'expiring' },
    { id: 'AST-008', type: 'Switch',        name: 'Netgear PoE+ 24P',       customer: 'Embarcadero Partners',  site: 'IT Room',               serial: 'NTG-2241',   installed: new Date(2023,2,15), warrantyEnd: new Date(2028,2,15), value: 480,  status: 'active' },
    { id: 'AST-009', type: 'Camera',        name: 'Hikvision DS-2CD2143G2', customer: 'Harbor View Condos',    site: 'Garage Level B1',       serial: 'HKV-8823',   installed: new Date(2021,7,10), warrantyEnd: new Date(2024,7,10), value: 180,  status: 'expired' },
    { id: 'AST-010', type: 'Access Control','name': 'HID Controller EP1501','customer': 'Pinnacle Financial',  site: 'Floor 14 Server',       serial: 'HID-9901B',  installed: new Date(2025,5,1),  warrantyEnd: new Date(2028,5,1),  value: 420,  status: 'active' },
    { id: 'AST-011', type: 'Alarm Panel',   name: 'DSC PowerSeries Neo',    customer: 'Harbor View Condos',    site: 'Front Desk',            serial: 'DSC-PP220',  installed: new Date(2022,3,22), warrantyEnd: new Date(2026,9,22), value: 560,  status: 'expiring' },
    { id: 'AST-012', type: 'Camera',        name: 'Axis P3245-V',           customer: 'Riverside Medical',     site: 'Emergency Dept',        serial: 'AXS-PB9811', installed: new Date(2023,1,5),  warrantyEnd: new Date(2026,1,5),  value: 285,  status: 'expired' },
  ];

  const getDaysLeft = (d) => Math.round((d - today) / (1000 * 60 * 60 * 24));

  const enriched = assets.map(a => {
    const daysLeft = getDaysLeft(a.warrantyEnd);
    const status = daysLeft < 0 ? 'expired' : daysLeft < 120 ? 'expiring' : 'active';
    const totalDays = Math.round((a.warrantyEnd - a.installed) / (1000 * 60 * 60 * 24));
    const usedDays = Math.round((today - a.installed) / (1000 * 60 * 60 * 24));
    const pct = Math.max(0, Math.min(100, (usedDays / totalDays) * 100));
    return { ...a, status, daysLeft, pct, totalDays, usedDays };
  });

  const filtered = enriched.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.customer.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    active: enriched.filter(a => a.status === 'active').length,
    expiring: enriched.filter(a => a.status === 'expiring').length,
    expired: enriched.filter(a => a.status === 'expired').length,
    expiredValue: enriched.filter(a => a.status === 'expired').reduce((s, a) => s + a.value, 0),
  };

  const statusStyle = {
    active:   { color: 'var(--status-ok)',       bg: 'rgba(52,211,153,0.12)',   label: 'Active' },
    expiring: { color: 'var(--status-warn)',      bg: 'rgba(251,191,36,0.12)',   label: 'Expiring' },
    expired:  { color: 'var(--status-critical)',  bg: 'rgba(244,63,94,0.1)',     label: 'Expired' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', gap: 12, overflow: 'hidden' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {[
          { label: 'ACTIVE WARRANTY', val: stats.active, color: 'var(--status-ok)', filter: 'active' },
          { label: 'EXPIRING <120 DAYS', val: stats.expiring, color: 'var(--status-warn)', filter: 'expiring' },
          { label: 'EXPIRED (no coverage)', val: stats.expired, color: 'var(--status-critical)', filter: 'expired' },
          { label: 'EXPIRED ASSET VALUE', val: `$${stats.expiredValue.toLocaleString()}`, color: 'var(--status-critical)', filter: 'expired' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ flex: 1, padding: '12px 18px', cursor: 'pointer', borderTop: `2px solid ${s.color}`, transition: 'all 0.15s' }}
            onClick={() => setFilter(filter === s.filter ? 'all' : s.filter)}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', background: 'rgba(63,169,245,0.06)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)', gap: 2 }}>
          {['all','active','expiring','expired'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer',
              background: filter === f ? 'rgba(63,169,245,0.18)' : 'transparent',
              color: filter === f ? 'var(--brand)' : 'var(--text-low)',
              fontWeight: filter === f ? 600 : 400, transition: 'all 0.15s', textTransform: 'capitalize'
            }}>{f}</button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets or customers…"
          style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '7px 14px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => shieldToast('Exporting warranty report to CSV', 'ok')} style={{ padding: '7px 16px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export Report</button>
      </div>

      {/* Asset grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {filtered.map(a => {
            const ss = statusStyle[a.status];
            const isSelected = selected?.id === a.id;
            return (
              <div key={a.id} onClick={() => setSelected(isSelected ? null : a)} className="glass" style={{
                padding: '14px 16px', cursor: 'pointer',
                border: `1px solid ${isSelected ? ss.color : 'var(--border-subtle)'}`,
                boxShadow: isSelected ? `0 0 16px ${ss.color}25` : 'none',
                transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', padding: '1px 7px', borderRadius: 4, display: 'inline-block', marginBottom: 4 }}>{a.type}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{a.name}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ss.color, background: ss.bg, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', whiteSpace: 'nowrap', marginLeft: 8 }}>{ss.label}</span>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 2 }}>{a.customer}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 10 }}>{a.site} · {a.serial}</div>

                {/* Warranty timeline bar */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-low)' }}>Installed {a.installed.toLocaleDateString('en-US',{month:'short',year:'numeric'})}</span>
                    <span style={{ fontSize: 9, color: a.daysLeft < 0 ? 'var(--status-critical)' : a.daysLeft < 120 ? 'var(--status-warn)' : 'var(--text-low)' }}>
                      {a.daysLeft < 0 ? `Expired ${Math.abs(a.daysLeft)}d ago` : `${a.daysLeft}d remaining`}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(63,169,245,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${a.pct}%`, height: '100%', borderRadius: 3, background: a.status === 'expired' ? 'var(--status-critical)' : a.status === 'expiring' ? 'var(--status-warn)' : 'var(--status-ok)', transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>Expires {a.warrantyEnd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {a.status === 'expired' && (
                    <button onClick={() => shieldToast('Extended warranty quote drafted for ' + a.customer + ' — ' + a.name, 'ok')} style={{ flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 600, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Upsell Extended Warranty
                    </button>
                  )}
                  {a.status === 'expiring' && (
                    <button onClick={() => shieldToast('Renewal sent to ' + a.customer + ' — ' + a.name)} style={{ flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 600, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Renew Warranty
                    </button>
                  )}
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)', alignSelf: 'center' }}>${a.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WarrantyScreen });

/* Screen — Security Intelligence (Monitoring)
   Three tabs: False-Alarm & Fine Shield · Predictive Fleet Health · CVE Bulletin Center.
   Actions feed real stores (backlog jobs, toasts) so automations are tangible. */

function MonitoringIntelScreen() {
  const [tab, setTab] = React.useState('alarms');
  const tabs = [
    { id: 'alarms', label: 'False-Alarm Shield', icon: 'anomaly' },
    { id: 'fleet', label: 'Fleet Health', icon: 'assets' },
    { id: 'cve', label: 'CVE Bulletins', icon: 'compliance' },
  ];
  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 2, background: 'rgba(63,169,245,0.06)', borderRadius: 9, padding: 3, border: '1px solid var(--border-subtle)', alignSelf: 'flex-start' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', fontWeight: 500, background: tab === t.id ? 'rgba(63,169,245,0.18)' : 'transparent', color: tab === t.id ? 'var(--brand)' : 'var(--text-low)', transition: 'all 0.15s' }}>
            <Icon name={t.icon} size={13} color={tab === t.id ? 'var(--brand)' : 'var(--text-low)'} />{t.label}
          </button>
        ))}
      </div>
      {tab === 'alarms' && <FalseAlarmShield />}
      {tab === 'fleet' && <FleetHealthPanel />}
      {tab === 'cve' && <CVECenter />}
    </div>
  );
}

/* ── False-Alarm & Fine Shield ── */
function FalseAlarmShield() {
  const sites = [
    { customer: 'Westfield Mall',     month: [3, 5, 2, 8], fines: 1200, zone: 'Zone 7 — HVAC vestibule', cause: 'Air-handler vibration 2–4 AM', risk: 'high' },
    { customer: 'Golden Gate Logistics', month: [1, 2, 2, 3], fines: 300, zone: 'Dock door 4', cause: 'Loose contact, wind-flex', risk: 'medium' },
    { customer: 'Harbor View Condos', month: [2, 1, 1, 1], fines: 0,    zone: 'Lobby motion', cause: 'Cleaning crew 5 AM entries', risk: 'low' },
    { customer: 'Acme Dental',        month: [0, 1, 0, 0], fines: 0,    zone: '—', cause: '—', risk: 'low' },
  ];
  const totalAlarms = sites.reduce((s, x) => s + x.month[3], 0);
  const totalFines = sites.reduce((s, x) => s + x.fines, 0);
  const riskC = { high: 'var(--status-critical)', medium: 'var(--status-warn)', low: 'var(--status-ok)' };

  const createRecal = (site) => {
    backlogStore.set(prev => [{ id: 'p' + Date.now(), title: `${site.customer} — Recalibration (${site.zone})`, customer: site.customer, type: 'maintenance', dur: 2, days: 1, value: 0, addr: '—', sla: '3d' }, ...prev]);
    showToast(`Recalibration job created — in Unscheduled tray + Dispatch queue`, 'ok');
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'FALSE ALARMS — JUNE', v: totalAlarms, c: 'var(--status-warn)' },
          { l: 'MUNICIPAL FINES YTD', v: `$${totalFines.toLocaleString()}`, c: 'var(--status-critical)' },
          { l: 'TOP OFFENDER', v: 'Westfield', c: 'var(--text-high)' },
          { l: 'AVOIDED VIA BYPASS', v: '$2,800', c: 'var(--status-ok)' },
        ].map(s => (
          <div key={s.l} className="glass" style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Per-Site Pattern Analysis (Mar–Jun)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sites.map(s => (
            <div key={s.customer} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 9, background: 'rgba(5,7,10,0.4)', border: `1px solid ${s.risk === 'high' ? 'rgba(244,63,94,0.25)' : 'var(--border-subtle)'}` }}>
              {/* sparkbars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30, width: 56, flexShrink: 0 }}>
                {s.month.map((v, i) => <div key={i} style={{ flex: 1, height: `${Math.max(8, v / 8 * 100)}%`, borderRadius: 2, background: i === 3 ? riskC[s.risk] : 'rgba(63,169,245,0.25)' }}></div>)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{s.customer}</span>
                  <span className="mono" style={{ fontSize: 10, color: riskC[s.risk] }}>{s.month[3]} this month</span>
                  {s.fines > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.08)', borderRadius: 7, padding: '2px 8px' }}>${s.fines} fines</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{s.zone !== '—' ? `${s.zone} · AI root cause: ${s.cause}` : 'No recurring pattern'}</div>
              </div>
              {s.risk !== 'low' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => showToast(`${s.zone} bypassed tonight 1–5 AM`, 'ok')} style={intelBtn('var(--status-warn)', 'rgba(251,191,36,0.08)', 'rgba(251,191,36,0.3)')}>Bypass tonight</button>
                  <button onClick={() => createRecal(s)} style={intelBtn('var(--brand)', 'rgba(63,169,245,0.08)', 'var(--border-strong)')}>Create recal job</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 10 }}>⚡ Auto-rule active: 3+ false alarms from one zone in 7 days → bypass suggested + recal job drafted</div>
      </div>
    </>
  );
}

/* ── Predictive Fleet Health ── */
function FleetHealthPanel() {
  const devices = [
    { id: 'NVR-RM-04', model: 'Hikvision DS-9616NI', customer: 'Riverside Medical', age: 6.2, uptime: 94.1, eol: true,  risk: 92, why: 'UPS failure history · 6 yrs old · EOL firmware' },
    { id: 'CAM-WF-09', model: 'Analog PTZ (legacy)',  customer: 'Westfield Mall',    age: 8.5, uptime: 88.0, eol: true,  risk: 87, why: 'Analog EOL · degraded night image' },
    { id: 'ALM-HV-01', model: 'DSC PowerSeries',      customer: 'Harbor View Condos',age: 7.1, uptime: 97.2, eol: false, risk: 64, why: 'Battery cycles above spec' },
    { id: 'ACR-MB-03', model: 'HID RP40',             customer: 'Metro Bank Corp',   age: 3.4, uptime: 99.0, eol: false, risk: 38, why: 'Firmware hang pattern (fixed in 2.1.6)' },
    { id: 'CAM-AD-04', model: 'Axis P3245',           customer: 'Acme Dental',       age: 1.9, uptime: 99.7, eol: false, risk: 12, why: 'Healthy' },
  ];
  const riskColor = r => r > 80 ? 'var(--status-critical)' : r > 50 ? 'var(--status-warn)' : 'var(--status-ok)';
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'DEVICES MONITORED', v: 312 }, { l: 'HIGH FAILURE RISK', v: 2, c: 'var(--status-critical)' },
          { l: 'EOL THIS YEAR', v: 14, c: 'var(--status-warn)' }, { l: 'REFRESH PIPELINE', v: '$46k', c: 'var(--status-ok)' },
        ].map(s => (
          <div key={s.l} className="glass" style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, color: s.c || 'var(--text-high)' }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Replace-Before-It-Fails Ranking</div>
        {devices.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(5,7,10,0.4)', border: '1px solid var(--border-subtle)', marginBottom: 8 }}>
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(63,169,245,0.1)" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke={riskColor(d.risk)} strokeWidth="4" strokeDasharray={`${d.risk / 100 * 113} 113`} strokeLinecap="round" transform="rotate(-90 22 22)" />
              </svg>
              <span className="mono" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: riskColor(d.risk) }}>{d.risk}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{d.id}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{d.model}</span>
                {d.eol && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--status-critical)', background: 'rgba(244,63,94,0.1)', borderRadius: 6, padding: '1px 7px' }}>EOL</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{d.customer} · {d.age} yrs · {d.uptime}% uptime · {d.why}</div>
            </div>
            {d.risk > 50 && (
              <button onClick={() => { showToast(`Refresh quote drafted for ${d.customer}`, 'ok'); navTo('survey-ai'); }} style={intelBtn('var(--brand)', 'rgba(63,169,245,0.08)', 'var(--border-strong)')}>Draft refresh quote</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── CVE Bulletin Center ── */
function CVECenter() {
  const [patched, setPatched] = React.useState([]);
  const bulletins = [
    { id: 'CVE-2026-30817', vendor: 'Hikvision', sev: 'critical', cvss: 9.8, affected: 14, summary: 'Unauthenticated RCE in web service ≤ v5.7.3', sites: 'Riverside Medical, Westfield Mall +3' },
    { id: 'CVE-2026-22104', vendor: 'Axis',      sev: 'high',     cvss: 7.5, affected: 31, summary: 'DoS via crafted RTSP request, AXIS OS < 11.9', sites: 'Metro Bank, Acme Dental +6' },
    { id: 'CVE-2026-18550', vendor: 'HID Global', sev: 'medium',  cvss: 5.3, affected: 24, summary: 'Reader config disclosure on default SNMP', sites: 'Metro Bank, City Hall +2' },
    { id: 'CVE-2025-99412', vendor: 'Bosch',     sev: 'low',      cvss: 3.1, affected: 4,  summary: 'Log injection in B-series panels', sites: 'Westfield Mall' },
  ];
  const sevC = { critical: 'var(--status-critical)', high: 'var(--status-warn)', medium: 'var(--brand)', low: 'var(--text-low)' };
  const campaign = (b) => {
    backlogStore.set(prev => [{ id: 'p' + Date.now(), title: `Patch campaign — ${b.vendor} (${b.id})`, customer: 'Multiple sites', type: 'maintenance', dur: 4, days: 1, value: 0, addr: '—', sla: b.sev === 'critical' ? '24h' : '7d' }, ...prev]);
    setPatched(p => [...p, b.id]);
    showToast(`Patch campaign created — ${b.affected} devices batched into work orders`, 'ok');
  };
  return (
    <>
      <div className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(244,63,94,0.25)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-critical)', animation: 'pulse-online 2s ease-in-out infinite' }}></span>
        <span style={{ fontSize: 12, color: 'var(--text-high)' }}><strong>1 critical CVE</strong> affects 14 devices across your installed base — patch campaign recommended today</span>
      </div>
      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Vendor Bulletins — matched to your asset inventory</div>
        {bulletins.map(b => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 9, background: 'rgba(5,7,10,0.4)', border: `1px solid ${b.sev === 'critical' ? 'rgba(244,63,94,0.25)' : 'var(--border-subtle)'}`, marginBottom: 8 }}>
            <div style={{ textAlign: 'center', flexShrink: 0, width: 48 }}>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: sevC[b.sev] }}>{b.cvss}</div>
              <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.08em', color: sevC[b.sev] }}>{b.sev}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{b.id}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{b.vendor}</span>
                <span className="mono" style={{ fontSize: 10, color: sevC[b.sev] }}>{b.affected} devices affected</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>{b.summary}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 1 }}>Your sites: {b.sites}</div>
            </div>
            {patched.includes(b.id)
              ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-ok)' }}>✓ Campaign queued</span>
              : <button onClick={() => campaign(b)} style={intelBtn(sevC[b.sev], 'rgba(63,169,245,0.05)', 'var(--border-strong)')}>Create patch campaign</button>}
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 6 }}>Feed: CISA KEV + vendor PSIRTs, cross-referenced nightly against Asset Management</div>
      </div>
    </>
  );
}

const intelBtn = (color, bg, border) => ({ padding: '6px 13px', background: bg, border: `1px solid ${border}`, borderRadius: 7, color, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' });

Object.assign(window, { MonitoringIntelScreen });

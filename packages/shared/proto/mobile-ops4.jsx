/* ShieldTech Mobile — Native Ops Screens IV (long-tail bespoke)
   Certs · PoE Calc (tools) · Job Costing · Audit · Reports · Contracts · SLA · Commissions · Compliance
   Read-display screens with native filters & detail; PoE Calc is fully interactive. */

const OPS4_SEV = { info:'var(--brand)', ok:'var(--status-ok)', warn:'var(--status-warn)', critical:'var(--status-critical)' };
const MOpsEmpty = ({ children }) => <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{children}</div>;

/* ══════════════ CERTIFICATIONS ══════════════ */
const CERT_TECHS = [];
const certColor = (d) => d < 30 ? 'var(--status-critical)' : d < 60 ? 'var(--status-warn)' : 'var(--status-ok)';
function MCerts({ onNav }) {
  const all = CERT_TECHS.flatMap(t => t.certs);
  const expiring = all.filter(c => c.days < 30).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['TECHS', CERT_TECHS.length, 'var(--brand)'], ['CERTS', all.length, 'var(--text-high)'], ['EXPIRING', expiring, expiring ? 'var(--status-critical)' : 'var(--status-ok)']]} />
      {expiring > 0 && <div className="glass" style={{ padding: '11px 13px', borderLeft: '3px solid var(--status-critical)', borderRadius: 11, fontSize: 12, color: 'var(--text-high)' }}>⚠ <strong>{expiring} certification{expiring > 1 ? 's' : ''}</strong> expiring within 30 days</div>}
      {CERT_TECHS.map(t => (
        <div key={t.initials} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: `${t.color}22`, border: `1px solid ${t.color}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: t.color }}>{t.initials}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{t.tech}</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{t.certs.length} active</span>
          </div>
          {t.certs.map((c, j) => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: j < t.certs.length - 1 ? '1px solid rgba(63,169,245,0.05)' : 'none' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: certColor(c.days), flexShrink: 0 }}></span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{c.name}</span>
              <span className="mono" style={{ fontSize: 10.5, color: certColor(c.days) }}>{c.exp} ({c.days}d)</span>
            </div>
          ))}
        </div>
      ))}
      {CERT_TECHS.length === 0 && <MOpsEmpty>No technician certifications tracked yet.</MOpsEmpty>}
    </div>
  );
}

/* ══════════════ PoE CALCULATOR (tools) ══════════════ */
const POE_SWITCHES = [
  { model:'USW-Lite-8-PoE', ports:8, budget:52 }, { model:'USW-24-PoE', ports:24, budget:95 },
  { model:'USW-Pro-24-PoE', ports:24, budget:400 }, { model:'USW-Pro-48-PoE', ports:48, budget:600 },
  { model:'Cisco CBS350-24FP', ports:24, budget:370 }, { model:'Aruba CX 6100 24G', ports:24, budget:370 },
];
const POE_DEVICES = [
  { name:'Axis P3265-V', watts:12.4, cls:'PoE+' }, { name:'Axis P3268-LV', watts:25.5, cls:'PoE++' },
  { name:'Axis Q6135-LE PTZ', watts:60, cls:'PoE++' }, { name:'Axis M3075-V', watts:4.5, cls:'PoE' },
  { name:'Verkada CD52', watts:25.5, cls:'PoE++' }, { name:'Hikvision DS-2CD2143', watts:12, cls:'PoE' },
  { name:'HID iCLASS SE', watts:3.8, cls:'PoE' }, { name:'Ubiquiti U6-Pro', watts:13.5, cls:'PoE+' },
  { name:'Ubiquiti U6-Enterprise', watts:25.5, cls:'PoE++' }, { name:'VoIP Phone', watts:6.5, cls:'PoE' },
];
function MPoECalc({ onNav }) {
  const [sw, setSw] = React.useState(POE_SWITCHES[1]);
  const [devices, setDevices] = React.useState([]);
  const [picker, setPicker] = React.useState(false);
  const load = devices.reduce((s, d) => s + d.watts * d.qty, 0);
  const ports = devices.reduce((s, d) => s + d.qty, 0);
  const budgetPct = (load / sw.budget) * 100;
  const portPct = (ports / sw.ports) * 100;
  const over = load > sw.budget || ports > sw.ports;
  const add = (d) => { setDevices(prev => { const ex = prev.find(x => x.name === d.name); return ex ? prev.map(x => x.name === d.name ? { ...x, qty: x.qty + 1 } : x) : [...prev, { ...d, qty: 1 }]; }); setPicker(false); };
  const setQty = (name, q) => setDevices(prev => q <= 0 ? prev.filter(x => x.name !== name) : prev.map(x => x.name === name ? { ...x, qty: q } : x));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '14px', borderRadius: 13, border: over ? '1px solid rgba(244,63,94,0.4)' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-low)' }}>POWER BUDGET</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: over ? 'var(--status-critical)' : 'var(--status-ok)' }}>{load.toFixed(1)}W / {sw.budget}W</span>
        </div>
        <MBar pct={budgetPct} color={budgetPct > 90 ? 'var(--status-critical)' : budgetPct > 75 ? 'var(--status-warn)' : 'var(--status-ok)'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0 8px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-low)' }}>PORTS</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: ports > sw.ports ? 'var(--status-critical)' : 'var(--text-high)' }}>{ports} / {sw.ports}</span>
        </div>
        <MBar pct={portPct} color={portPct > 100 ? 'var(--status-critical)' : 'var(--brand)'} />
        {over && <div style={{ fontSize: 11, color: 'var(--status-critical)', marginTop: 9, fontWeight: 600 }}>⚠ Exceeds switch capacity — upgrade switch or split load</div>}
      </div>

      <div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 6 }}>Switch</div>
        <select value={sw.model} onChange={e => setSw(POE_SWITCHES.find(s => s.model === e.target.value))} style={{ width: '100%', padding: '11px 13px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', appearance: 'none' }}>
          {POE_SWITCHES.map(s => <option key={s.model} value={s.model}>{s.model} — {s.ports}p · {s.budget}W</option>)}
        </select>
      </div>

      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase' }}>Load</div>
      {devices.map(d => (
        <div key={d.name} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{d.name}</div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{d.watts}W · {d.cls} · {(d.watts * d.qty).toFixed(1)}W total</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setQty(d.name, d.qty - 1)} style={poeStep}>−</button>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', width: 22, textAlign: 'center' }}>{d.qty}</span>
            <button onClick={() => setQty(d.name, d.qty + 1)} style={poeStep}>+</button>
          </div>
        </div>
      ))}
      <button onClick={() => setPicker(true)} style={{ padding: '11px 0', background: 'rgba(63,169,245,0.06)', border: '1px dashed var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add device</button>
      <button onClick={() => showToast('PoE plan exported to Design Studio', 'ok')} style={{ padding: '12px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export Plan</button>

      {picker && (
        <MSheet title="Add Device" onClose={() => setPicker(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {POE_DEVICES.map(d => (
              <button key={d.name} onClick={() => add(d)} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)' }}>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{d.name}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{d.watts}W</span>
                <MBadge>{d.cls}</MBadge>
              </button>
            ))}
          </div>
        </MSheet>
      )}
    </div>
  );
}
const poeStep = { width: 30, height: 30, borderRadius: 8, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-body)' };

/* ══════════════ JOB COSTING ══════════════ */
const COSTING_JOBS = [];
const marginColor = (m) => m >= 30 ? 'var(--status-ok)' : m >= 20 ? 'var(--status-warn)' : 'var(--status-critical)';
function MCosting({ onNav }) {
  const [openId, setOpenId] = React.useState(null);
  const avg = COSTING_JOBS.length ? (COSTING_JOBS.reduce((s, j) => s + j.margin, 0) / COSTING_JOBS.length).toFixed(1) : 0;
  const over = COSTING_JOBS.filter(j => j.actCost > j.estCost).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['AVG MARGIN', `${avg}%`, marginColor(avg)], ['JOBS', COSTING_JOBS.length, 'var(--text-high)'], ['OVER BUDGET', over, over ? 'var(--status-warn)' : 'var(--status-ok)']]} />
      {COSTING_JOBS.map(j => {
        const costOver = j.actCost > j.estCost;
        return (
          <div key={j.id} onClick={() => setOpenId(j.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${marginColor(j.margin)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{j.id}</span>
              <MBadge>{j.type}</MBadge>
              {j.status === 'in-progress' && <MBadge color="var(--status-warn)">in progress</MBadge>}
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: marginColor(j.margin) }}>{j.margin}%</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{j.customer}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>Rev ${(j.actRevenue / 1000).toFixed(1)}K · Cost ${(j.actCost / 1000).toFixed(1)}K{costOver ? ` (▲ ${(((j.actCost - j.estCost) / j.estCost) * 100).toFixed(0)}% over)` : ''} · {j.actHours}h</div>
          </div>
        );
      })}
      {COSTING_JOBS.length === 0 && <MOpsEmpty>No completed jobs to cost yet.</MOpsEmpty>}
      {openId && <MCostingDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MCostingDetail({ id, onClose }) {
  const j = COSTING_JOBS.find(x => x.id === id);
  if (!j) return null;
  const rows = [['Revenue', j.estRevenue, j.actRevenue], ['Cost', j.estCost, j.actCost], ['Hours', j.estHours, j.actHours]];
  return (
    <MSheet title={`${j.id} · ${j.customer}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}><div className="mono" style={{ fontSize: 30, fontWeight: 700, color: marginColor(j.margin) }}>{j.margin}%</div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>actual margin</div></div>
          <MBadge>{j.type}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 0, border: '1px solid var(--border-subtle)', borderRadius: 11, overflow: 'hidden' }}>
          <div style={hCell}></div><div style={{ ...hCell, textAlign: 'right' }}>EST</div><div style={{ ...hCell, textAlign: 'right' }}>ACTUAL</div>
          {rows.map(([k, est, act]) => {
            const isHours = k === 'Hours';
            const worse = isHours || k === 'Cost' ? act > est : act < est;
            return (
              <React.Fragment key={k}>
                <div style={bCell}>{k}</div>
                <div style={{ ...bCell, textAlign: 'right', color: 'var(--text-low)' }} className="mono">{isHours ? est + 'h' : '$' + est.toLocaleString()}</div>
                <div style={{ ...bCell, textAlign: 'right', color: worse ? 'var(--status-warn)' : 'var(--status-ok)' }} className="mono">{isHours ? act + 'h' : '$' + act.toLocaleString()}</div>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 13px' }}>
          {j.actCost > j.estCost ? `Cost ran $${(j.actCost - j.estCost).toLocaleString()} over estimate (${j.actHours - j.estHours}h extra labor).` : 'Job came in at or under budget.'}
        </div>
      </div>
    </MSheet>
  );
}
const hCell = { padding: '8px 11px', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-low)', background: 'rgba(10,14,20,0.5)', textTransform: 'uppercase' };
const bCell = { padding: '9px 11px', fontSize: 12, color: 'var(--text-high)', borderTop: '1px solid var(--border-subtle)' };

/* ══════════════ AUDIT TRAIL ══════════════ */
const AUDIT_LOGS = [];
function MAudit({ onNav }) {
  const [role, setRole] = React.useState('All');
  const [q, setQ] = React.useState('');
  const list = AUDIT_LOGS.filter(l => (role === 'All' || l.role === role) && (l.user + l.action + l.target).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search audit log…" style={{ background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 14px', color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
      <MSegment options={['All', 'Admin', 'Tech', 'Customer', 'System']} value={role} onChange={setRole} />
      {list.map((l, i) => (
        <div key={i} className="glass" style={{ padding: '11px 13px', borderRadius: 11, borderLeft: `3px solid ${OPS4_SEV[l.severity]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{l.time}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{l.user}</span>
            <MBadge color={l.role === 'Admin' ? 'var(--status-critical)' : l.role === 'System' ? 'var(--text-low)' : 'var(--brand)'}>{l.role}</MBadge>
            {l.ip !== '—' && <span className="mono" style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-low)' }}>{l.ip}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{l.action}</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)', marginTop: 1 }}>→ {l.target}</div>
        </div>
      ))}
      {list.length === 0 && <MOpsEmpty>No audit events yet.</MOpsEmpty>}
    </div>
  );
}

/* ══════════════ REPORTS / BI ══════════════ */
const RPT_KPIS = [];
const RPT_REVCAT = [];
const RPT_LEADS = [];
function MReports({ onNav }) {
  const [period, setPeriod] = React.useState('This Month');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MSegment options={['This Month', 'Last Month', 'Quarter', 'YTD']} value={period} onChange={setPeriod} />
      {RPT_KPIS.length === 0 && RPT_REVCAT.length === 0 && RPT_LEADS.length === 0 && <MOpsEmpty>No report data yet — reports populate as jobs, invoices, and leads are recorded.</MOpsEmpty>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
        {RPT_KPIS.map(([l, v, t, up]) => (
          <div key={l} className="glass" style={{ padding: '11px 13px', borderRadius: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{l}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-high)' }}>{v}</div>
            <div style={{ fontSize: 10, color: up ? 'var(--status-ok)' : 'var(--status-critical)', marginTop: 2 }}>{up ? '▲' : '▼'} {t}</div>
          </div>
        ))}
      </div>
      {RPT_REVCAT.length > 0 && <MSection title="Revenue by category">
        {RPT_REVCAT.map(([cat, val, pct]) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{cat}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>${(val / 1000).toFixed(0)}K · {pct}%</span>
            </div>
            <MBar pct={pct * 2} color="var(--brand)" />
          </div>
        ))}
      </MSection>}
      {RPT_LEADS.length > 0 && <MSection title="Lead sources">
        {RPT_LEADS.map(([src, leads, won, rev, cac]) => (
          <div key={src} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{src}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{won}/{leads} won · CAC {cac}</div>
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-ok)' }}>{rev}</span>
          </div>
        ))}
      </MSection>}
    </div>
  );
}

/* ══════════════ CONTRACTS ══════════════ */
const CONTRACTS = [];
const CONTRACT_STATUS = { active:'var(--status-ok)', expiring:'var(--status-warn)', expired:'var(--status-critical)' };
function MContracts({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const list = filter === 'All' ? CONTRACTS : CONTRACTS.filter(c => c.status === filter.toLowerCase());
  const mrr = CONTRACTS.reduce((s, c) => s + c.value, 0);
  const expiring = CONTRACTS.filter(c => c.renewsIn < 60);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACTIVE', CONTRACTS.filter(c => c.status === 'active').length, 'var(--status-ok)'], ['TOTAL MRR', `$${(mrr / 1000).toFixed(1)}K`, 'var(--brand)'], ['EXPIRING', expiring.length, expiring.length ? 'var(--status-warn)' : 'var(--text-low)']]} />
      {expiring.length > 0 && <div className="glass" style={{ padding: '11px 13px', borderLeft: '3px solid var(--status-warn)', borderRadius: 11, fontSize: 12, color: 'var(--text-high)' }}><strong>{expiring.length} contracts</strong> expiring &lt;60d — at-risk MRR <span className="mono" style={{ color: 'var(--status-warn)' }}>${(expiring.reduce((s, c) => s + c.value, 0) / 1000).toFixed(1)}K/mo</span></div>}
      <MSegment options={['All', 'Active', 'Expiring']} value={filter} onChange={setFilter} />
      {list.map(c => (
        <div key={c.id} onClick={() => setOpenId(c.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${CONTRACT_STATUS[c.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{c.id}</span>
            <MBadge>{c.type}</MBadge>
            <MBadge color={CONTRACT_STATUS[c.status]}>{c.status}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${c.value.toLocaleString()}/mo</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{c.customer}</div>
          <div style={{ fontSize: 10, color: c.renewsIn < 30 ? 'var(--status-critical)' : c.renewsIn < 60 ? 'var(--status-warn)' : 'var(--text-low)' }}>{c.term} · ends {c.end} ({c.renewsIn}d) · {c.autoRenew ? '✓ auto-renew' : 'manual renew'}</div>
        </div>
      ))}
      {list.length === 0 && <MOpsEmpty>No contracts yet.</MOpsEmpty>}
      {openId && <MContractDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MContractDetail({ id, onClose }) {
  const c = CONTRACTS.find(x => x.id === id);
  if (!c) return null;
  const specs = [['Type', c.type], ['Term', c.term], ['Start', c.start], ['Ends', c.end], ['Renews in', `${c.renewsIn}d`], ['Auto-renew', c.autoRenew ? 'Yes' : 'No']];
  return (
    <MSheet title={c.customer} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}><div className="mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-high)' }}>${c.value.toLocaleString()}<span style={{ fontSize: 13, color: 'var(--text-low)', fontWeight: 400 }}>/mo</span></div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>{c.id}</div></div>
          <MBadge color={CONTRACT_STATUS[c.status]}>{c.status}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {specs.map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-mid)' }}>{v}</div>
            </div>
          ))}
        </div>
        {c.renewsIn < 60 && <button onClick={() => { showToast('Renewal quote drafted', 'ok'); onClose(); }} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Draft Renewal</button>}
      </div>
    </MSheet>
  );
}

/* ══════════════ SLA ══════════════ */
const SLAS = [];
const scoreColor = (s) => s >= 95 ? 'var(--status-ok)' : s >= 85 ? 'var(--status-warn)' : 'var(--status-critical)';
function MSLA({ onNav }) {
  const avg = SLAS.length ? Math.round(SLAS.reduce((s, x) => s + x.score, 0) / SLAS.length) : 0;
  if (SLAS.length === 0) {
    return <MOpsEmpty>No SLA metrics configured yet.</MOpsEmpty>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: 20, borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--text-low)', letterSpacing: '0.1em', marginBottom: 8 }}>OVERALL SLA SCORE</div>
        <div className="mono" style={{ fontSize: 52, fontWeight: 700, color: scoreColor(avg), lineHeight: 1 }}>{avg}</div>
        <div style={{ fontSize: 12, color: avg >= 95 ? 'var(--status-ok)' : 'var(--status-warn)', marginTop: 6 }}>{avg >= 95 ? 'All SLAs Met' : 'Minor breaches'}</div>
        <div style={{ marginTop: 12 }}><MBar pct={avg} color={scoreColor(avg)} /></div>
      </div>
      {SLAS.map(s => (
        <div key={s.metric} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${scoreColor(s.score)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{s.metric}</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-low)' }}>
            <span>Target: <span style={{ color: 'var(--text-mid)' }}>{s.target}</span></span>
            <span>Actual: <span style={{ color: scoreColor(s.score) }}>{s.actual}</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════ COMMISSIONS ══════════════ */
const COMMISSION_REPS = [];
const COMMISSION_DEALS = [];
const DEAL_STATUS = { earned:'var(--status-ok)', paid:'var(--brand)', pending:'var(--status-warn)' };
function MCommissions({ onNav }) {
  const [rep, setRep] = React.useState('All');
  const deals = rep === 'All' ? COMMISSION_DEALS : COMMISSION_DEALS.filter(d => d.rep === rep);
  if (COMMISSION_REPS.length === 0 && COMMISSION_DEALS.length === 0) {
    return <MOpsEmpty>No commission data yet — reps and deals appear here as they're added.</MOpsEmpty>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {COMMISSION_REPS.map(r => (
          <div key={r.initials} onClick={() => setRep(rep === r.initials ? 'All' : r.initials)} className="glass" style={{ padding: '13px', borderRadius: 13, cursor: 'pointer', border: rep === r.initials ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: `${r.color}22`, border: `1px solid ${r.color}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: r.color }}>{r.initials}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{r.name}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.role} · {r.rate}% rate</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
              {[['EARNED', `$${(r.commission / 1000).toFixed(1)}K`, 'var(--status-ok)'], ['PENDING', `$${(r.pending * r.rate / 100 / 1000).toFixed(1)}K`, 'var(--status-warn)'], ['WON', r.closed, 'var(--text-high)']].map(([k, v, c]) => (
                <div key={k} style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 17, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 8, color: 'var(--text-low)', letterSpacing: '0.04em' }}>{k}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginBottom: 4 }}><span>QUOTA ${(r.quota / 1000).toFixed(0)}K</span><span className="mono">{r.quotaPct}%</span></div>
            <MBar pct={r.quotaPct} color={r.quotaPct >= 100 ? 'var(--status-ok)' : r.quotaPct >= 70 ? 'var(--brand)' : 'var(--status-warn)'} />
          </div>
        ))}
      </div>
      <MSection title={rep === 'All' ? 'Commission ledger' : `${rep} deals`}>
        {deals.map((d, i) => (
          <div key={i} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.customer}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{d.rep} · {d.stage} · {d.closeDate}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-ok)' }}>${d.commission.toLocaleString()}</div>
              <MBadge color={DEAL_STATUS[d.status]}>{d.status}</MBadge>
            </div>
          </div>
        ))}
      </MSection>
    </div>
  );
}

/* ══════════════ COMPLIANCE ══════════════ */
const COMPLIANCE = [];
function MCompliance({ onNav }) {
  const overdue = COMPLIANCE.filter(i => i.status === 'overdue');
  const week = COMPLIANCE.filter(i => i.daysLeft > 0 && i.daysLeft <= 7);
  const month = COMPLIANCE.filter(i => i.daysLeft > 7 && i.daysLeft <= 30);
  const cColor = (d) => d < 0 ? 'var(--status-critical)' : d <= 7 ? 'var(--status-critical)' : d <= 30 ? 'var(--status-warn)' : 'var(--status-ok)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['OVERDUE', overdue.length, overdue.length ? 'var(--status-critical)' : 'var(--status-ok)'], ['THIS WEEK', week.length, week.length ? 'var(--status-warn)' : 'var(--text-low)'], ['THIS MONTH', month.length, 'var(--brand)']]} />
      {overdue.length > 0 && <div className="glass" style={{ padding: '11px 13px', borderLeft: '3px solid var(--status-critical)', borderRadius: 11, fontSize: 12, color: 'var(--text-high)' }}>⚠ <strong>{overdue.length} OVERDUE</strong> — {overdue[0].customer} {overdue[0].title.split('—')[0]} is {Math.abs(overdue[0].daysLeft)}d past due</div>}
      {[...COMPLIANCE].sort((a, b) => a.daysLeft - b.daysLeft).map((i, k) => (
        <div key={k} className="glass" style={{ padding: '12px 13px', borderRadius: 12, borderLeft: `3px solid ${cColor(i.daysLeft)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MBadge color={cColor(i.daysLeft)}>{i.status}</MBadge>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: cColor(i.daysLeft) }} className="mono">{i.daysLeft < 0 ? `${Math.abs(i.daysLeft)}d overdue` : `${i.daysLeft}d`}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.3 }}>{i.title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{i.customer} · {i.authority} · due {i.due}</div>
        </div>
      ))}
      {COMPLIANCE.length === 0 && <MOpsEmpty>No compliance items tracked yet.</MOpsEmpty>}
    </div>
  );
}

Object.assign(window, { MCerts, MPoECalc, MCosting, MAudit, MReports, MContracts, MSLA, MCommissions, MCompliance });

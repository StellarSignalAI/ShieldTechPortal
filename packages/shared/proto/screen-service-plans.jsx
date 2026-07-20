/* Service Plans Engine — D-Tools-class recurring service contracts
   Plan templates → sell to customers → service orders → MRR rollup. */

const SP_PLANS = [];

const SP_CONTRACTS = [];

const SP_ORDERS = [];

const SP_ORDER_STATUS = {
  scheduled: { c: 'var(--brand)', l: 'Scheduled' },
  'in-progress': { c: 'var(--status-warn)', l: 'In progress' },
  complete: { c: 'var(--status-ok)', l: 'Complete' },
};

function ServicePlansScreen() {
  const [tab, setTab] = React.useState('overview');
  const [toast, setToast] = React.useState(null);
  const [sellOpen, setSellOpen] = React.useState(false);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const planById = (id) => SP_PLANS.find(p => p.id === id);

  const totalMRR = SP_CONTRACTS.reduce((s, c) => s + c.mrr, 0);
  const arr = totalMRR * 12;
  const renewals = SP_CONTRACTS.filter(c => c.status === 'renewal').length;
  const openOrders = SP_ORDERS.filter(o => o.status !== 'complete').length;

  const tabs = [['overview', 'Overview'], ['plans', 'Plan Catalog'], ['contracts', 'Contracts'], ['orders', 'Service Orders']];

  return (
    <div style={{ padding: 18, height: '100%', overflow: 'auto' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-high)' }}>Service Plans</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Sell and manage recurring service contracts — the engine behind your MRR</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setSellOpen(true)} style={{ padding: '8px 16px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Sell a Plan</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['MONTHLY RECURRING', `$${totalMRR.toLocaleString()}`, 'var(--brand)'], ['ANNUAL RUN-RATE', `$${arr.toLocaleString()}`, 'var(--status-ok)'], ['ACTIVE CONTRACTS', SP_CONTRACTS.length, 'var(--text-high)'], ['UP FOR RENEWAL', renewals, renewals ? 'var(--status-warn)' : 'var(--text-low)'], ['OPEN SERVICE ORDERS', openOrders, 'var(--text-high)']].map(([l, v, c]) => (
        <GlassPanel key={l} style={{ flex: 1, minWidth: 150, padding: '12px 14px' }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: c, lineHeight: 1.1 }}>{v}</div>
          <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{l}</div>
        </GlassPanel>
        ))}
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {tabs.map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: tab === id ? 600 : 400, background: tab === id ? 'rgba(63,169,245,0.12)' : 'transparent', border: `1px solid ${tab === id ? 'var(--brand)' : 'var(--border-subtle)'}`, color: tab === id ? 'var(--brand)' : 'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>
        ))}
      </div>

      {(tab === 'overview' || tab === 'plans') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: tab === 'overview' ? 16 : 0 }}>
          {SP_PLANS.map(p => {
            const subs = SP_CONTRACTS.filter(c => c.plan === p.id).length;
            return (
              <GlassPanel key={p.id} style={{ borderTop: `3px solid ${p.color}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: p.color }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{subs} active</span>
                </div>
                <div style={{ margin: '6px 0 10px' }}>
                  <span className="mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-high)' }}>${p.price}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>/mo</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: 'rgba(63,169,245,0.08)', color: 'var(--text-mid)' }}>SLA {p.sla}</span>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: 'rgba(63,169,245,0.08)', color: 'var(--text-mid)' }}>{p.visits} visits/yr</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-mid)' }}><span style={{ color: p.color }}>✓</span><span>{f}</span></div>
                  ))}
                </div>
                <button onClick={() => { setSellOpen(true); }} style={{ marginTop: 12, padding: '7px', background: 'transparent', border: `1px solid ${p.color}55`, borderRadius: 6, color: p.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Sell {p.name}</button>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {(tab === 'overview' || tab === 'contracts') && (
        <GlassPanel style={{ padding: 0, marginBottom: tab === 'overview' ? 16 : 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, fontWeight: 600 }}>Active Contracts</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Customer', 'Plan', 'MRR', 'Sites', 'Devices', 'Since', 'Renews', 'Status', ''].map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{SP_CONTRACTS.map(c => {
              const p = planById(c.plan);
              return (
                <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{c.customer}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: `${p.color}1f`, color: p.color }}>{p.name}</span></td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>${c.mrr}</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{c.sites}</td>
                  <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{c.devices}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: 'var(--text-low)' }}>{c.since}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 10, color: c.status === 'renewal' ? 'var(--status-warn)' : 'var(--text-low)' }}>{c.renews}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{c.status === 'renewal' ? <span style={{ fontSize: 10, color: 'var(--status-warn)' }}>● Renewal due</span> : <span style={{ fontSize: 10, color: 'var(--status-ok)' }}>● Active</span>}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><button onClick={() => showToast(`${c.status === 'renewal' ? 'Renewing' : 'Opening'} ${c.customer}`)} style={{ padding: '3px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{c.status === 'renewal' ? 'Renew' : 'Manage'}</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </GlassPanel>
      )}

      {(tab === 'overview' || tab === 'orders') && (
        <GlassPanel style={{ padding: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, fontWeight: 600 }}>Service Orders <span style={{ fontSize: 10, color: 'var(--text-low)', fontWeight: 400 }}>· generated from plan SLAs & requests</span></div>
          {SP_ORDERS.map(o => {
            const p = planById(o.plan); const st = SP_ORDER_STATUS[o.status] || SP_ORDER_STATUS.scheduled;
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.c, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{o.summary}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{o.customer} · <span style={{ color: p.color }}>{p.name}</span> · {o.type}</div>
                </div>
                <span style={{ fontSize: 10, color: o.tech === 'Unassigned' ? 'var(--status-warn)' : 'var(--text-mid)' }}>{o.tech}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-mid)', width: 120, textAlign: 'right' }}>{o.due}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: st.c, width: 80, textAlign: 'right' }}>{st.l}</span>
              </div>
            );
          })}
        </GlassPanel>
      )}

      {sellOpen && <SellPlanModal onClose={() => setSellOpen(false)} showToast={showToast} />}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

function SellPlanModal({ onClose, showToast }) {
  const [cust, setCust] = React.useState('Acme Dental');
  const [plan, setPlan] = React.useState('gold');
  const customers = ['Acme Dental', 'Harbor View Condos', 'New Prospect', 'Metro Bank Corp', 'City Hall'];
  const p = SP_PLANS.find(x => x.id === plan);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{ width: 440, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Sell a Service Plan</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <label style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer</label>
        <select value={cust} onChange={e => setCust(e.target.value)} style={{ width: '100%', padding: '8px 10px', margin: '4px 0 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)' }}>
          {customers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '6px 0 14px' }}>
          {SP_PLANS.map(pl => (
            <button key={pl.id} onClick={() => setPlan(pl.id)} style={{ padding: '8px', borderRadius: 7, textAlign: 'left', background: plan === pl.id ? `${pl.color}1f` : 'transparent', border: `1px solid ${plan === pl.id ? pl.color : 'var(--border-subtle)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: pl.color }}>{pl.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>${pl.price}/mo</div>
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{cust} → <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>Adds <span className="mono" style={{ color: 'var(--brand)' }}>${p.price}/mo</span> (<span className="mono">${(p.price * 12).toLocaleString()}/yr</span>) to recurring revenue · SLA {p.sla}</div>
        </div>
        <button onClick={() => { showToast(`${p.name} plan sold to ${cust} — +$${p.price}/mo MRR`); onClose(); }} style={{ width: '100%', padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Activate Plan</button>
      </div>
    </div>
  );
}

Object.assign(window, { ServicePlansScreen, SellPlanModal, SP_PLANS, SP_CONTRACTS, SP_ORDERS });

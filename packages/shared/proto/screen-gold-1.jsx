/* Gold Features Part 1 — Customer Health, Revenue Forecast, Commission, Compliance, Onboarding */

/* ── Customer Health Score + Churn Prediction ── */
function CustomerHealthScreen() {
  const customers = [];

  const atRisk = customers.filter(c => c.churnRisk > 20);
  const scored = customers.filter(c => c.score > 0);
  const avgScore = scored.length ? Math.round(scored.reduce((s,c) => s + c.score, 0) / scored.length) : 0;

  const openCustomer = (c) => shieldModal({
    kind: 'detail', title: c.name, subtitle: `Health ${c.score} · ${c.churnRisk}% churn risk · ${c.tenure} tenure`,
    meter: { value: c.score, label: 'health' },
    badge: c.churnRisk > 20 ? { status: 'critical', label: `${c.churnRisk}% churn risk` } : { status: 'online', label: 'Healthy' },
    headline: c.churnRisk > 20 ? 'Elevated churn signals — recommend proactive outreach this week.' : 'Account is stable across engagement, system and financial signals.',
    sections: [
      { label: 'Account', rows: [
        { k: 'MRR', v: '$' + c.mrr.toLocaleString() }, { k: 'Tenure', v: c.tenure, mono: false },
        { k: 'Uptime', v: c.uptime + '%' }, { k: 'NPS', v: c.nps },
        { k: 'Avg Pay Days', v: c.payDays + 'd', color: c.payDays > 15 ? 'var(--status-critical)' : 'var(--text-high)' },
        { k: 'Open Tickets', v: c.tickets }, { k: 'Last Contact', v: c.lastContact, mono: false }, { k: 'Trend', v: c.trend, mono: false },
      ]},
      { label: 'Health Factors', meters: Object.entries(c.factors).filter(([,v]) => v > 0).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v })) },
    ],
    actions: [
      { label: 'Log Call', onClick: () => shieldToast('Call logged for ' + c.name, 'ok'), close: true },
      { label: 'Draft Outreach', primary: true, successMsg: 'Outreach email sent to ' + c.name, onClick: () => {} },
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Overview */}
      <div style={{ display: 'flex', gap: 12 }}>
        <GlassPanel style={{ width: 160, textAlign: 'center', padding: 20 }}>
          <div className="label-sm" style={{ marginBottom: 10 }}>PORTFOLIO HEALTH</div>
          <HealthRing value={avgScore} size={100} strokeWidth={7} label="avg score" />
        </GlassPanel>
        <div style={{ flex: 1, display: 'flex', gap: 10 }}>
          <StatCard label="CUSTOMERS" value={customers.filter(c => c.mrr > 0).length} delay={0} />
          <StatCard label="AT-RISK" value={atRisk.length} delay={80} />
          <StatCard label="AT-RISK MRR" value={`$${(atRisk.reduce((s,c) => s + c.mrr,0)/1000).toFixed(1)}K`} mono={false} delay={160} />
          <StatCard label="AVG NPS" value={customers.filter(c => c.nps > 0).length ? (customers.filter(c => c.nps > 0).reduce((s,c) => s + c.nps,0) / customers.filter(c => c.nps > 0).length).toFixed(1) : '—'} mono={false} delay={240} />
        </div>
      </div>

      {/* Churn alert */}
      {atRisk.length > 0 && (
        <div className="glass" style={{ padding: '12px 18px', borderLeft: '3px solid var(--status-critical)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⟡</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: 'var(--text-high)' }}><strong>ShieldTech AI Churn Alert:</strong> {atRisk.length} customer{atRisk.length > 1 ? 's' : ''} showing elevated churn signals. </span>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Harbor View hasn't been contacted in 4 weeks and is paying 24 days late. Recommend an immediate outreach call.</span>
          </div>
          <button onClick={() => shieldModal({ kind: 'editor', title: 'Draft Outreach — Harbor View Condos', subtitle: 'Review and edit before sending', submitLabel: 'Send Email', successMsg: 'Outreach email sent to Harbor View Condos', value: 'Hi Frank,\n\nWe wanted to check in — it’s been about a month since our last touchpoint, and we noticed your recent invoices have run a little behind. We value the partnership and want to make sure everything is running smoothly on your end.\n\nCould we schedule a quick 15-minute call this week to review your system health and answer any billing questions?\n\nBest regards,\nShieldTech Account Team' })} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Draft Outreach</button>
        </div>
      )}

      {/* Customer cards */}
      {customers.length === 0 && <EmptyState icon="users" title="No customers yet" accent="var(--brand)" body="Health scores appear here once customers are onboarded." />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {customers.filter(c => c.mrr > 0).sort((a,b) => a.score - b.score).map((c, i) => (
          <GlassPanel key={i} onClick={() => openCustomer(c)} className="st-rowcard" style={{ padding: '16px 20px', cursor: 'pointer', borderLeft: `3px solid ${c.score >= 85 ? 'var(--status-ok)' : c.score >= 70 ? 'var(--status-warn)' : 'var(--status-critical)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <HealthRing value={c.score} size={56} strokeWidth={4} label="" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: c.trend === 'up' ? 'var(--status-ok)' : c.trend === 'down' ? 'var(--status-critical)' : 'var(--text-low)' }}>{c.trend === 'up' ? '↑' : c.trend === 'down' ? '↓' : '→'} {c.trend}</span>
                  {c.churnRisk > 20 && <StatusBadge status="critical" label={`${c.churnRisk}% churn risk`} />}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: 'var(--text-mid)' }}>
                  <span>MRR: <span className="mono" style={{ color: 'var(--text-high)' }}>${c.mrr.toLocaleString()}</span></span>
                  <span>Tenure: {c.tenure}</span>
                  <span>Uptime: <span className="mono">{c.uptime}%</span></span>
                  <span>Pay: <span className="mono" style={{ color: c.payDays > 15 ? 'var(--status-critical)' : 'var(--text-high)' }}>{c.payDays}d avg</span></span>
                  <span>NPS: <span className="mono">{c.nps}</span></span>
                  <span>Contact: {c.lastContact}</span>
                </div>
              </div>
              {/* Factor bars */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {Object.entries(c.factors).filter(([,v]) => v > 0).map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ width: 6, height: 30, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                      <div style={{ width: '100%', height: `${v}%`, background: v >= 80 ? 'var(--status-ok)' : v >= 60 ? 'var(--status-warn)' : 'var(--status-critical)', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 7, color: 'var(--text-low)', marginTop: 2, textTransform: 'uppercase' }}>{k.slice(0,3)}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

/* ── Revenue Forecasting ── */
function RevenueForecastScreen() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const actual = months.map(() => null);
  const forecast = months.map(() => null);
  const optimistic = months.map(() => null);
  const pessimistic = months.map(() => null);

  const pipelineWeighted = [];

  const totalWeighted = pipelineWeighted.reduce((s,p) => s + p.weighted, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="YTD REVENUE" value="—" mono={false} delay={0} />
        <StatCard label="FORECAST (EOY)" value="—" mono={false} delay={80} />
        <StatCard label="MRR GROWTH" value="—" mono={false} delay={160} />
        <StatCard label="WEIGHTED PIPELINE" value={`$${(totalWeighted/1000).toFixed(0)}K`} mono={false} delay={240} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Revenue Chart */}
        <GlassPanel>
          <SectionHeader title="12-Month Revenue Forecast" icon="forecast" />
          <div style={{ position: 'relative', height: 200, marginTop: 10 }}>
            <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0,50,100,150,200].map(y => (
                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(63,169,245,0.05)" strokeWidth="0.5" />
              ))}
              {/* Pessimistic band */}
              {(() => {
                const pts = months.map((_, i) => {
                  const val = pessimistic[i] || forecast[i] || actual[i];
                  if (!val) return null;
                  return { x: (i / 11) * 580 + 10, y: 190 - ((val - 200) / 200) * 180 };
                }).filter(Boolean);
                const ptsOpt = months.map((_, i) => {
                  const val = optimistic[i] || forecast[i] || actual[i];
                  if (!val) return null;
                  return { x: (i / 11) * 580 + 10, y: 190 - ((val - 200) / 200) * 180 };
                }).filter(Boolean);
                if (pts.length < 2) return null;
                const top = ptsOpt.map(p => `${p.x},${p.y}`).join(' ');
                const bot = pts.reverse().map(p => `${p.x},${p.y}`).join(' ');
                return <polygon points={`${top} ${bot}`} fill="rgba(63,169,245,0.06)" />;
              })()}
              {/* Actual line */}
              {(() => {
                const pts = actual.map((v, i) => v ? { x: (i / 11) * 580 + 10, y: 190 - ((v - 200) / 200) * 180 } : null).filter(Boolean);
                if (!pts.length) return null;
                return <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" />;
              })()}
              {/* Forecast line */}
              {(() => {
                const pts = forecast.map((v, i) => v ? { x: (i / 11) * 580 + 10, y: 190 - ((v - 200) / 200) * 180 } : null).filter(Boolean);
                const last = actual.filter(Boolean);
                if (!last.length || !pts.length) return null;
                const lastPt = { x: ((last.length - 1) / 11) * 580 + 10, y: 190 - ((last[last.length-1] - 200) / 200) * 180 };
                return <polyline points={`${lastPt.x},${lastPt.y} ${pts.map(p => `${p.x},${p.y}`).join(' ')}`} fill="none" stroke="var(--brand)" strokeWidth="2" strokeDasharray="6 4" strokeLinejoin="round" opacity="0.6" />;
              })()}
              {/* Dots + labels */}
              {months.map((m, i) => {
                const v = actual[i] || forecast[i];
                if (!v) return null;
                const x = (i / 11) * 580 + 10;
                const y = 190 - ((v - 200) / 200) * 180;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={actual[i] ? 3.5 : 2.5} fill={actual[i] ? 'var(--brand)' : 'var(--card)'} stroke="var(--brand)" strokeWidth="1.5" />
                    <text x={x} y={198} textAnchor="middle" fill="var(--text-low)" fontSize="8" fontFamily="var(--font-mono)">{m}</text>
                  </g>
                );
              })}
            </svg>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 16, height: 2, background: 'var(--brand)' }} /><span style={{ fontSize: 10, color: 'var(--text-low)' }}>Actual</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 16, height: 2, background: 'var(--brand)', opacity: 0.5 }} /><span style={{ fontSize: 10, color: 'var(--text-low)' }}>Forecast</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 16, height: 8, background: 'rgba(63,169,245,0.1)', borderRadius: 2 }} /><span style={{ fontSize: 10, color: 'var(--text-low)' }}>Range</span></div>
            </div>
          </div>
        </GlassPanel>

        {/* Pipeline Breakdown */}
        <GlassPanel>
          <SectionHeader title="Weighted Pipeline" icon="flag" />
          {pipelineWeighted.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '14px 0' }}>No open pipeline yet — deals appear here from the CRM.</div>}
          {pipelineWeighted.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{p.stage} <span style={{ color: 'var(--text-low)' }}>({p.deals})</span></span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>${(p.weighted/1000).toFixed(0)}K</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${p.prob}%`, height: '100%', borderRadius: 3, background: p.prob >= 80 ? 'var(--status-ok)' : p.prob >= 50 ? 'var(--brand)' : 'var(--status-warn)' }} />
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 30 }}>{p.prob}%</span>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Total Weighted</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)' }}>${(totalWeighted/1000).toFixed(0)}K</span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ── Commission Tracker ── */
function CommissionScreen() {
  const reps = [];

  const deals = [];

  const repName = {};

  const openRep = (rep) => shieldModal({
    kind: 'detail', title: rep.name, subtitle: `${rep.role} · ${rep.rate}% commission rate`,
    meter: { value: Math.round(rep.quotaPct), label: 'quota' },
    badge: rep.quotaPct >= 90 ? { status: 'online', label: 'On track' } : { status: 'warning', label: 'Behind quota' },
    sections: [
      { label: 'This Period', rows: [
        { k: 'Commission Earned', v: '$' + rep.commission.toLocaleString(), color: 'var(--status-ok)' },
        { k: 'Pending Commission', v: '$' + Math.round(rep.pending * rep.rate / 100).toLocaleString(), color: 'var(--status-warn)' },
        { k: 'Revenue Closed', v: '$' + rep.revenue.toLocaleString() }, { k: 'Deals Won', v: rep.closed },
        { k: 'Quota', v: '$' + rep.quota.toLocaleString() }, { k: 'Attainment', v: rep.quotaPct.toFixed(1) + '%' },
      ]},
      { label: 'Open Deals', items: deals.filter(d => d.rep === rep.initials && d.status === 'pending').map(d => ({ title: d.customer, sub: d.stage + ' · close ' + d.closeDate, right: '$' + d.commission.toLocaleString(), status: 'pending' })) },
    ],
    actions: [
      { label: 'Export Statement', onClick: () => shieldToast('Commission statement exported for ' + rep.name, 'ok'), close: true },
      { label: 'Approve Payout', primary: true, successMsg: 'Payout approved for ' + rep.name, onClick: () => {} },
    ],
  });

  const openDeal = (d) => shieldModal({
    kind: 'detail', title: d.customer, subtitle: `${repName[d.rep] || d.rep} · ${d.stage}`,
    badge: { status: d.status === 'earned' ? 'online' : d.status === 'paid' ? 'info' : 'pending', label: d.status },
    sections: [
      { label: 'Deal', rows: [
        { k: 'Deal Value', v: '$' + d.value.toLocaleString() },
        { k: 'Commission', v: '$' + d.commission.toLocaleString(), color: 'var(--status-ok)' },
        { k: 'Rep', v: repName[d.rep] || d.rep, mono: false }, { k: 'Stage', v: d.stage, mono: false },
        { k: 'Status', v: d.status, mono: false }, { k: 'Close Date', v: d.closeDate, mono: false },
      ]},
    ],
    actions: [
      { label: 'Open in CRM', onClick: () => shieldToast('Opening ' + d.customer + ' in CRM', 'info'), close: true },
      ...(d.status === 'pending' ? [{ label: 'Mark Won', primary: true, successMsg: d.customer + ' marked as won', onClick: () => {} }] : []),
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Rep Cards */}
      {reps.length === 0 && <EmptyState icon="users" title="No sales reps yet" accent="var(--brand)" body="Invite your team from Admin → Users & Invites to start tracking commissions." />}
      <div style={{ display: 'flex', gap: 16 }}>
        {reps.map((rep, i) => (
          <GlassPanel key={i} onClick={() => openRep(rep)} className="st-rowcard" style={{ flex: 1, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, rgba(63,169,245,0.2), rgba(63,169,245,0.05))', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>{rep.initials}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{rep.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{rep.role} · {rep.rate}% rate</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--status-ok)' }}>${(rep.commission/1000).toFixed(1)}K</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Earned</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--status-warn)' }}>${(rep.pending * rep.rate / 100 / 1000).toFixed(1)}K</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Pending</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-high)' }}>{rep.closed}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>Deals Won</div>
              </div>
            </div>
            {/* Quota bar */}
            <div className="label-sm" style={{ marginBottom: 4 }}>QUOTA: ${(rep.quota/1000).toFixed(0)}K</div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(rep.quotaPct, 100)}%`, height: '100%', borderRadius: 4, background: rep.quotaPct >= 100 ? 'var(--status-ok)' : rep.quotaPct >= 70 ? 'var(--brand)' : 'var(--status-warn)' }} />
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 4, textAlign: 'right' }}>{rep.quotaPct.toFixed(1)}%</div>
          </GlassPanel>
        ))}
      </div>

      {/* Deal Table */}
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <SectionHeader title="Commission Ledger" icon="dollar" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Rep','Customer','Deal Value','Commission','Stage','Status','Close Date'].map((h, i) => (
              <th key={i} style={{ textAlign: i > 1 ? 'right' : 'left', padding: '8px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {deals.map((d, i) => (
              <tr key={i} onClick={() => openDeal(d)} style={{ transition: 'background 0.15s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='rgba(63,169,245,0.04)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{d.rep}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{d.customer}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right' }}>${d.value.toLocaleString()}</td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 500, color: 'var(--status-ok)' }}>${d.commission.toLocaleString()}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{d.stage}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={d.status === 'earned' ? 'online' : d.status === 'paid' ? 'info' : 'pending'} label={d.status} /></td>
                <td className="mono" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, textAlign: 'right', color: 'var(--text-low)' }}>{d.closeDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── Compliance Calendar ── */
function ComplianceScreen() {
  const items = [];

  const overdue = items.filter(i => i.status === 'overdue');
  const upcoming7 = items.filter(i => i.daysLeft > 0 && i.daysLeft <= 7);
  const upcoming30 = items.filter(i => i.daysLeft > 7 && i.daysLeft <= 30);

  const openItem = (item) => shieldModal({
    kind: 'detail', title: item.title, subtitle: `${item.customer} · ${item.authority}`,
    badge: { status: item.status === 'overdue' ? 'critical' : item.status === 'scheduled' ? 'info' : 'pending', label: item.status },
    headline: item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} days past due — schedule immediately to stay compliant.` : `Due in ${item.daysLeft} days (${item.due}).`,
    sections: [
      { label: 'Requirement', rows: [
        { k: 'Type', v: item.type, mono: false }, { k: 'Authority', v: item.authority, mono: false },
        { k: 'Customer', v: item.customer, mono: false }, { k: 'Due Date', v: item.due, mono: false },
        { k: 'Status', v: item.status, mono: false, color: item.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-high)' },
        { k: 'Days Left', v: item.daysLeft < 0 ? Math.abs(item.daysLeft) + 'd overdue' : item.daysLeft + 'd', color: item.daysLeft < 0 ? 'var(--status-critical)' : item.daysLeft <= 7 ? 'var(--status-warn)' : 'var(--text-high)' },
      ]},
    ],
    actions: [
      { label: 'Mark Complete', onClick: () => shieldToast(item.title + ' marked complete', 'ok'), close: true },
      { label: 'Schedule', primary: true, successMsg: 'Scheduled ' + item.title, onClick: () => {} },
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="OVERDUE" value={overdue.length} delay={0} />
        <StatCard label="DUE THIS WEEK" value={upcoming7.length} delay={80} />
        <StatCard label="DUE THIS MONTH" value={upcoming30.length} delay={160} />
        <StatCard label="TOTAL TRACKED" value={items.length} delay={240} />
      </div>

      {overdue.length > 0 && (
        <div className="glass" style={{ padding: '10px 16px', borderLeft: '3px solid var(--status-critical)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot status="critical" size={6} />
            <span style={{ fontSize: 13, color: 'var(--status-critical)', fontWeight: 600 }}>{overdue.length} OVERDUE</span>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>— Westfield Mall NFPA 25 inspection is 8 days past due</span>
          </div>
        </div>
      )}

      {items.length === 0 && <EmptyState icon="checkCircle" title="Nothing tracked yet" accent="var(--status-ok)" body="Inspections, permits, tests and renewals will appear here as they are added." />}
      <GlassPanel style={{ padding: 0 }}>
        {items.sort((a,b) => a.daysLeft - b.daysLeft).map((item, i) => (
          <div key={i} onClick={() => openItem(item)} className="st-clickrow" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
            borderBottom: '1px solid rgba(63,169,245,0.04)',
            background: item.status === 'overdue' ? 'rgba(244,63,94,0.03)' : 'transparent'
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{item.customer} · {item.authority}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: item.daysLeft < 0 ? 'var(--status-critical)' : item.daysLeft <= 7 ? 'var(--status-warn)' : 'var(--text-mid)' }}>
                {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d left`}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{item.due}</div>
            </div>
            <StatusBadge status={item.status === 'overdue' ? 'critical' : item.status === 'scheduled' ? 'info' : 'pending'} label={item.status} />
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

/* ── Customer Onboarding Wizard ── */
function OnboardingScreen() {
  const workflows = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Customer Onboarding</h2>
        <button onClick={() => shieldModal({ kind: 'form', title: 'Start New Onboarding', subtitle: 'Kick off the onboarding workflow for a new customer', submitLabel: 'Start Onboarding', successMsg: 'Onboarding workflow created', fields: [
          { key: 'customer', label: 'Customer', placeholder: 'Customer name', required: true, full: true },
          { key: 'plan', label: 'Service Plan', type: 'select', options: ['Essential','Professional','Enterprise'] },
          { key: 'pm', label: 'Project Manager', type: 'select', options: (window.SW && window.SW.USERS && window.SW.USERS.length) ? window.SW.USERS.map(u => u.name) : ['Unassigned'] },
          { key: 'start', label: 'Target Start', type: 'date' }
        ] })} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Start New Onboarding</button>
      </div>

      {workflows.length === 0 && <EmptyState icon="flag" title="No onboarding workflows yet" accent="var(--brand)" body="Start a new onboarding to track every step from contract to handoff." />}
      {workflows.map((wf, wi) => (
        <GlassPanel key={wi}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{wf.customer}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Started {wf.started} · Stage: {wf.stage}</div>
            </div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>{wf.progress}%</div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ width: `${wf.progress}%`, height: '100%', borderRadius: 3, background: 'var(--brand)', transition: 'width 0.6s ease' }} />
          </div>
          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {wf.steps.map((step, si) => (
              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: step.done ? 'var(--status-ok)' : 'transparent',
                  border: step.done ? 'none' : '1.5px solid var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff'
                }}>{step.done ? '✓' : ''}</div>
                <span style={{ fontSize: 11, color: step.done ? 'var(--text-low)' : 'var(--text-high)', textDecoration: step.done ? 'line-through' : 'none' }}>{step.label}</span>
                {step.date && <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)', marginLeft: 'auto' }}>{step.date}</span>}
              </div>
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

Object.assign(window, { CustomerHealthScreen, RevenueForecastScreen, CommissionScreen, ComplianceScreen, OnboardingScreen });

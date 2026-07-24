/* ShieldTech Mobile — native screens I: Home, Mission Control, Dispatch, Finance, Customers */
const MN_TECH = { MR: '#3FA9F5', JL: '#34D399', KW: '#FBBF24', DP: '#c084fc', TG: '#F43F5E' };
const firstName = () => {
  const n = (window.__shieldUser && window.__shieldUser.name) || '';
  const f = String(n).trim().split(/\s+/)[0];
  return f && !f.includes('@') ? f : 'there';
};
const dayGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'; };

function MHomeView({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const todayJobs = jobs.filter(j => j.day <= 3 && 3 <= (j.endDay || j.day)).sort((a, b) => a.start - b.start);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Wednesday, June 10</div>
        <div className="display" style={{ fontSize: 21, fontWeight: 300, color: 'var(--text-high)' }}>{dayGreeting()}, {firstName()}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="CASH POSITION" value="$482.6K" sub="↑ +$38K this week" accent="var(--status-ok)" />
        <MStat label="REVENUE (MTD)" value="$284.6K" sub="↑ +8.2% vs prior" delay={60} />
        <MStat label="TECHS ON SITE" value="4 / 5" sub="Diana unassigned" delay={120} />
        <MStat label="OPEN TICKETS" value="13" sub="↓ 3 since Monday" delay={180} />
      </div>
      <MSection title="Quick actions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <MActionBtn label="New Job" icon="calendar" primary onClick={() => (window.__shieldNewJob ? window.__shieldNewJob() : onNav('calendar'))} />
          <MActionBtn label="Dispatch" icon="dispatch" onClick={() => onNav('dispatch')} />
          <MActionBtn label="Photos" icon="cameras" onClick={() => onNav('photos')} />
          <MActionBtn label="Approve" icon="approvals" onClick={() => onNav('approvals')} />
        </div>
      </MSection>
      <button onClick={() => onNav('sitescan')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'linear-gradient(120deg, rgba(63,169,245,0.10), rgba(192,132,252,0.08))', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--brand)', flexShrink: 0 }}>◉</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>Survey Scan <span style={{ fontSize: 8, fontWeight: 700, color: '#c084fc', border: '1px solid rgba(192,132,252,0.4)', borderRadius: 4, padding: '1px 5px', marginLeft: 4, verticalAlign: 'middle' }}>NEW</span></span>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--text-low)' }}>Scan · document · estimate · report — the whole site visit in one walk</span>
        </span>
        <span style={{ color: 'var(--text-low)', fontSize: 14 }}>›</span>
      </button>
      <MSection title="Today's jobs" action="Schedule" onAction={() => onNav('calendar')}>
        {todayJobs.slice(0, 4).map(j => (
          <MRow key={j.id} title={j.title} sub={`${Math.floor(j.start)}:${j.start % 1 ? '30' : '00'} · ${(j.techs || []).join(', ') || '◌ unassigned'}`}
            right={j.value ? `$${(j.value / 1000).toFixed(1)}k` : ''} accent={MN_TECH[(j.techs || [])[0]] || '#94A3B8'} onClick={() => onNav('calendar')} />
        ))}
      </MSection>
      <MSection title="Needs your attention">
        <MRow icon="warning-tri" iconColor="var(--status-critical)" title="Acme Dental — NVR offline 23m" sub="Recorder unreachable · Mike en route" onClick={() => onNav('incidents')} />
        <MRow icon="expenses" iconColor="var(--status-warn)" title="3 expenses awaiting approval" sub="$842 total · oldest 2 days" onClick={() => onNav('expenses')} />
        <MRow icon="contracts" iconColor="var(--brand)" title="City Hall contract renews in 21 days" sub="$48K/yr · renewal draft ready" onClick={() => onNav('contracts')} />
      </MSection>
      <MSection title="Recent activity">
        {[['Payment received — City Hall', '$22,100', '2:14 PM'], ['Invoice INV-2865 sent — Marina Dental', '', '1:50 PM'], ['Mike checked in at Metro Bank', '', '12:30 PM'], ['Proposal viewed by Pinnacle Financial', '', '11:00 AM']].map(([t, amt, time]) => (
          <div key={t} style={{ display: 'flex', gap: 10, padding: '7px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{t}</span>
            {amt && <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)' }}>{amt}</span>}
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{time}</span>
          </div>
        ))}
      </MSection>
    </div>
  );
}

function MMissionView({ onNav }) {
  const kpis = [
    { label: 'REVENUE TODAY', value: '$16,955', spark: [4, 6, 5, 8, 7, 9, 11], c: 'var(--brand)' },
    { label: 'OPEN TICKETS', value: '13', spark: [9, 11, 8, 12, 10, 8, 7], c: 'var(--status-warn)' },
    { label: 'TECHS ACTIVE', value: '11 / 15', spark: [6, 8, 9, 10, 9, 11, 11], c: 'var(--status-ok)' },
    { label: 'JOBS TODAY', value: '15', spark: [10, 12, 11, 13, 12, 14, 15], c: 'var(--brand)' },
  ];
  const R = 30, C = 2 * Math.PI * R;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {kpis.map((k, i) => (
          <div key={k.label} className="glass" style={{ padding: '12px 14px', borderRadius: 12, animation: `fade-up 0.3s ease ${i * 60}ms both` }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--text-low)', marginBottom: 3 }}>{k.label}</div>
            <div className="mono" style={{ fontSize: 19, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>{k.value}</div>
            <MSpark data={k.spark} color={k.c} w={110} h={20} />
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(63,169,245,0.1)" strokeWidth="6" />
            <circle cx="36" cy="36" r={R} fill="none" stroke="var(--status-ok)" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - 0.81)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-high)' }}>81</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginBottom: 2 }}>SLA Compliance</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>48 on time · 2 breached this month</div>
          <button onClick={() => onNav('sla')} style={{ marginTop: 7, padding: '5px 12px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>SLA board ›</button>
        </div>
      </div>
      <MSection title="Monthly performance">
        {[['Revenue vs last month', '$284,600', '↑ 8.2%', 'var(--status-ok)'], ['Gross margin', '28.4%', 'target 25%', 'var(--status-ok)'], ['Win rate', '62%', 'target 55%', 'var(--status-ok)'], ['AR aging >30d', '$42,800', 'target <$30K', 'var(--status-warn)'], ['Avg ticket close', '4.2h', 'target <6h', 'var(--status-ok)']].map(([k, v, note, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{k}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{v}</span>
            <span style={{ fontSize: 9, color: c, width: 64, textAlign: 'right' }}>{note}</span>
          </div>
        ))}
      </MSection>
      <MSection title="Live alerts" action="Incidents" onAction={() => onNav('incidents')}>
        <MRow icon="warning-tri" iconColor="var(--status-critical)" title="Acme Dental — NVR offline" sub="23 min · Mike en route" onClick={() => onNav('incidents')} />
        <MRow icon="anomaly" iconColor="var(--status-warn)" title="Metro Bank — Cam 7 signal degraded" sub="Intermittent since 9:40 AM" onClick={() => onNav('cameras')} />
        <MRow icon="poe" iconColor="var(--status-warn)" title="Westfield — UPS on battery" sub="Utility event · 64 min runtime left" onClick={() => onNav('cameras')} />
      </MSection>
    </div>
  );
}

function MDispatchView({ onNav }) {
  /* Blank canvas: the SAME live technicians as the Fleet map and the desktop
     dispatch board. Techs appear the moment they sign in and share GPS. */
  const [fleet] = useShieldStore(fleetStore);
  const techs = (window.deriveDispatchTechs ? window.deriveDispatchTechs(fleet.techs) : []).map(t => ({
    ...t,
    STATUS: (t.status || '').toUpperCase(),
    c: t.status === 'driving' ? 'var(--brand)' : t.status === 'idle' ? 'var(--status-warn)' : t.status === 'clocked-out' ? 'var(--text-low)' : 'var(--status-ok)',
  }));
  const onSite = techs.filter(t => t.status === 'on-site').length;
  const driving = techs.filter(t => t.status === 'driving').length;
  const idle = techs.filter(t => t.status === 'idle').length;
  const accent = (id) => (MN_TECH && MN_TECH[id]) || 'var(--brand)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MStat label="ON SITE" value={String(onSite)} accent="var(--status-ok)" />
        <MStat label="DRIVING" value={String(driving)} accent="var(--brand)" delay={60} />
        <MStat label="IDLE" value={String(idle)} accent="var(--status-warn)" delay={120} />
      </div>

      {/* Live fleet map — same real map the dispatcher sees */}
      <div className="glass" style={{ height: 260, borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ height: '100%' }}>{window.FleetMapScreen ? <FleetMapScreen /> : null}</div>
      </div>

      <MSection title="Active technicians">
        {techs.length === 0 && (
          <div className="glass" style={{ padding: '16px 14px', borderRadius: 12, fontSize: 12, color: 'var(--text-low)', lineHeight: 1.5 }}>
            No technicians on shift yet. They appear here automatically when they sign in and their app shares location.
          </div>
        )}
        {techs.map(t => (
          <div key={t.id} className="glass" style={{ padding: '12px 13px', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: `${accent(t.id)}28`, border: `1px solid ${accent(t.id)}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: accent(t.id), flexShrink: 0 }}>{t.id.slice(0, 2).toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{t.name} <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-low)' }}>· {t.role}</span></div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.job !== '—' ? t.job : 'Unassigned'}{t.eta !== '—' ? ` · ETA ${t.eta}` : ''}</div>
              </div>
              <MBadge color={t.c}>{t.STATUS}</MBadge>
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
              <button onClick={() => showToast(`Message sent to ${t.name.split(' ')[0]}`, 'ok')} style={mDispBtn}>Message</button>
              <button onClick={() => onNav('fleet')} style={mDispBtn}>Locate</button>
              {t.status === 'idle' && <button onClick={() => onNav('calendar')} style={{ ...mDispBtn, color: 'var(--status-warn)', borderColor: 'rgba(251,191,36,0.3)' }}>Assign job</button>}
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)', alignSelf: 'center' }}>{t.hours}</span>
            </div>
          </div>
        ))}
      </MSection>
      <button onClick={() => showToast(techs.length ? 'Broadcast sent to all field techs' : 'No techs online to broadcast', techs.length ? 'ok' : 'warn')} style={{ padding: '12px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Broadcast all techs</button>
      <MRow icon="dispatch" title="Full dispatch board" sub="Schedule · queue · driving safety" onClick={() => onNav('dispatch-full')} />
    </div>
  );
}
const mDispBtn = { padding: '6px 13px', background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };

function MFinanceView({ onNav }) {
  const [seg, setSeg] = React.useState('Overview');
  const invoices = [
    { num: 'INV-2871', cust: 'Metro Bank Corp', amt: 22100, status: 'paid', due: 'Paid Jun 10' },
    { num: 'INV-2868', cust: 'Westfield Mall', amt: 9200, status: 'pending', due: 'Due Jun 18' },
    { num: 'INV-2865', cust: 'Marina District Dental', amt: 2400, status: 'pending', due: 'Due Jun 15' },
    { num: 'INV-2860', cust: 'Harbor View Condos', amt: 1850, status: 'overdue', due: '12 days late' },
    { num: 'INV-2858', cust: 'Golden Gate Logistics', amt: 14600, status: 'pending', due: 'Due Jun 22' },
  ];
  const stC = { paid: 'var(--status-ok)', pending: 'var(--status-warn)', overdue: 'var(--status-critical)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MSegment options={['Overview', 'Invoices', 'AR Aging']} value={seg} onChange={setSeg} />
      {seg === 'Overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <MStat label="CASH POSITION" value="$482.6K" sub="↑ +$38K this week" accent="var(--status-ok)" />
            <MStat label="REVENUE (MTD)" value="$284.6K" sub="↑ +8.2% vs prior" delay={60} />
            <MStat label="MRR" value="$171.2K" sub="↑ +3.8% MoM" delay={120} />
            <MStat label="GROSS MARGIN" value="28.4%" sub="target 25%" delay={180} />
          </div>
          <MSection title="90-day cash forecast">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['30 DAYS', '+$62K'], ['60 DAYS', '+$94K'], ['90 DAYS', '+$125K']].map(([k, v], i) => (
                <MStat key={k} label={k} value={v} accent="var(--status-ok)" delay={i * 60} />
              ))}
            </div>
            <div className="glass" style={{ marginTop: 8, padding: '10px 13px', borderRadius: 11, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icon name="hermes" size={14} color="var(--brand)" />
              <span style={{ fontSize: 11, color: 'var(--text-mid)', flex: 1 }}>Cash position strong. $19,450 overdue AR is the main risk — draft reminders?</span>
              <button onClick={() => showToast('Collection reminders drafted for 2 accounts', 'ok')} style={{ ...mDispBtn, color: 'var(--brand)', flexShrink: 0 }}>Draft</button>
            </div>
          </MSection>
          <MSection title="Payables">
            {[['Due this week', '$8,420', 'var(--status-warn)'], ['Due this month', '$24,600', 'var(--text-high)'], ['Overdue', '$3,200', 'var(--status-critical)']].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{k}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: c }}>{v}</span>
              </div>
            ))}
          </MSection>
        </>
      )}
      {seg === 'Invoices' && (
        <>
          {invoices.map(inv => (
            <div key={inv.num} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{inv.num}</span>
                    <MBadge color={stC[inv.status]}>{inv.status}</MBadge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-high)', marginTop: 3 }}>{inv.cust}</div>
                  <div style={{ fontSize: 9, color: inv.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)' }}>{inv.due}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>${inv.amt.toLocaleString()}</div>
                  {inv.status !== 'paid' && <button onClick={() => showToast(`Reminder sent for ${inv.num}`, 'ok')} style={{ ...mDispBtn, marginTop: 5, color: 'var(--brand)' }}>Remind</button>}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
      {seg === 'AR Aging' && (
        <MSection title="Receivables by age — $175,950 total">
          {[['Current', 134400, 'var(--status-ok)'], ['1–30 days', 22100, '#FBBF24'], ['31–60 days', 14300, '#F43F5E'], ['60+ days', 5150, '#c084fc']].map(([k, v, c]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{k}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>${(v / 1000).toFixed(1)}K</span>
              </div>
              <MBar pct={(v / 134400) * 100} color={c} />
            </div>
          ))}
          <button onClick={() => onNav('finance-full')} style={{ ...mDispBtn, width: '100%', padding: '10px 0', color: 'var(--brand)' }}>Open full finance suite (desktop layout) ›</button>
        </MSection>
      )}
    </div>
  );
}

function MCustomersView({ onNav }) {
  const [q, setQ] = React.useState('');
  const [allCusts] = useShieldStore(customerStore);
  const [formOpen, setFormOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState(null);
  const custs = allCusts.filter(c => c.status !== 'archived' && c.name.toLowerCase().includes(q.toLowerCase()));
  const detail = allCusts.find(c => c.id === detailId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search customers…" style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 13px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => setFormOpen(true)} style={{ padding: '0 14px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+</button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{custs.length} customers · changes sync to the portal live</div>
      {custs.map(c => (
        <div key={c.id} onClick={() => setDetailId(c.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{c.logo}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{c.type} · {c.sites} site{c.sites !== 1 ? 's' : ''}{c.mrr > 0 ? <> · <span className="mono">${(c.mrr / 1000).toFixed(1)}K MRR</span></> : ''}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: c.health === 0 ? 'var(--text-low)' : c.health >= 85 ? 'var(--status-ok)' : c.health >= 70 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{c.health > 0 ? c.health : '—'}</div>
              <div style={{ fontSize: 8, color: 'var(--text-low)', letterSpacing: '0.06em' }}>HEALTH</div>
            </div>
          </div>
          {c.health > 0 && c.health < 70 && <div style={{ marginTop: 7, fontSize: 10, color: 'var(--status-warn)' }}>⚠ Churn radar — late payments / open complaints · save-play suggested</div>}
        </div>
      ))}
      {custs.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No customers match "{q}".</div>}
      {formOpen && <MobileCustomerForm onClose={() => setFormOpen(false)} />}
      {detail && <MobileCustomerDetail customer={detail} onClose={() => setDetailId(null)} onNav={onNav} />}
    </div>
  );
}

Object.assign(window, { MHomeView, MMissionView, MDispatchView, MFinanceView, MCustomersView });

/* ShieldTech Mobile — native screens I: Home, Dispatch, Customers */
const MN_TECH = { MR: '#3FA9F5', JL: '#34D399', KW: '#FBBF24', DP: '#c084fc', TG: '#F43F5E' };
const firstName = () => {
  const n = (window.__shieldUser && window.__shieldUser.name) || '';
  const f = String(n).trim().split(/\s+/)[0];
  return f && !f.includes('@') ? f : 'there';
};
const dayGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'; };

function MHomeView({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const [tickets] = useShieldStore(ticketStore);
  const [fleet] = useShieldStore(fleetStore);
  const [proposals] = useShieldStore(proposalStore);
  const roster = useTechs();
  const invoices = useMergedInvoices();
  const mExp = createShieldStore('mexpenses');
  const [expenses] = useShieldStore(mExp);
  const tIso = todayISO();
  const todayJobs = jobs.filter(j => jobOnISO(j, tIso)).sort((a, b) => a.start - b.start);

  /* Live numbers from the same stores every other screen uses. */
  const openAR = invoices.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + (i.amount || 0), 0);
  const overdueInv = invoices.filter(i => i.status === 'overdue');
  const overdue = overdueInv.reduce((s, i) => s + (i.amount || 0), 0);
  const fleetTechs = window.deriveDispatchTechs ? deriveDispatchTechs((fleet || {}).techs) : [];
  const onSite = fleetTechs.filter(t => t.status === 'on-site').length;
  const openTickets = (tickets || []).filter(t => !/closed|resolved|done/i.test(t.status || '')).length;
  const fmtK = (n) => n >= 100000 ? `$${(n / 1000).toFixed(0)}K` : n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n).toLocaleString()}`;

  /* Needs attention — only real items, never filler. */
  const pendingExp = (expenses || []).filter(e => (e.status || 'pending') === 'pending');
  const awaitingProps = (proposals || []).filter(p => p.status === 'sent');
  const unassignedToday = todayJobs.filter(j => !j.techs || j.techs.length === 0);
  const attention = [
    overdueInv.length && { icon: 'expenses', color: 'var(--status-critical)', title: `${overdueInv.length} overdue invoice${overdueInv.length > 1 ? 's' : ''} — ${fmtK(overdue)}`, sub: 'Send a reminder or pay link', nav: 'invoices' },
    unassignedToday.length && { icon: 'warning-tri', color: 'var(--status-warn)', title: `${unassignedToday.length} job${unassignedToday.length > 1 ? 's' : ''} today with no technician`, sub: 'Assign a crew in the schedule', nav: 'calendar' },
    pendingExp.length && { icon: 'expenses', color: 'var(--status-warn)', title: `${pendingExp.length} expense${pendingExp.length > 1 ? 's' : ''} awaiting approval`, sub: fmtK(pendingExp.reduce((s, e) => s + (Number(e.amount) || 0), 0)) + ' total', nav: 'expenses' },
    awaitingProps.length && { icon: 'proposals', color: 'var(--brand)', title: `${awaitingProps.length} proposal${awaitingProps.length > 1 ? 's' : ''} awaiting customer`, sub: awaitingProps.map(p => p.customer).slice(0, 2).join(', '), nav: 'proposals' },
  ].filter(Boolean);

  /* Recent activity — real timestamps recorded by the money pipeline. */
  const activity = [
    ...invoices.filter(i => i._raw && i._raw.payLinkSentAt).map(i => ({ ts: i._raw.payLinkSentAt, text: `Pay link sent — ${i.num} · ${i.customer}`, amt: `$${i.amount.toLocaleString()}` })),
    ...invoices.filter(i => i._raw && i._raw.sentAt && !(i._raw.payLinkSentAt)).map(i => ({ ts: i._raw.sentAt, text: `Invoice ${i.num} sent — ${i.customer}`, amt: '' })),
    ...invoices.filter(i => i.status === 'paid' && i._raw && i._raw.paidAt).map(i => ({ ts: i._raw.paidAt, text: `Payment received — ${i.customer}`, amt: `$${i.amount.toLocaleString()}` })),
    ...(proposals || []).filter(p => p.sentAt).map(p => ({ ts: p.sentAt, text: `Proposal ${p.id} sent — ${p.customer}`, amt: '' })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);
  const fmtWhen = (ts) => { const d = new Date(ts); return isoOfDate(d) === tIso ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  const techColor = (id) => ((roster.find(t => t.id === id) || {}).color) || '#94A3B8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div className="display" style={{ fontSize: 21, fontWeight: 300, color: 'var(--text-high)' }}>{dayGreeting()}, {firstName()}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="OPEN A/R" value={fmtK(openAR)} sub={`${invoices.filter(i => i.status !== 'paid' && i.status !== 'draft').length} open invoices`} accent="var(--status-ok)" />
        <MStat label="OVERDUE" value={fmtK(overdue)} sub={overdueInv.length ? `${overdueInv.length} invoice${overdueInv.length > 1 ? 's' : ''} late` : 'nothing late ✓'} accent={overdue > 0 ? 'var(--status-critical)' : 'var(--status-ok)'} delay={60} />
        <MStat label="TECHS ON SITE" value={fleetTechs.length ? `${onSite} / ${fleetTechs.length}` : '—'} sub={fleetTechs.length ? `${fleetTechs.filter(t => t.status === 'driving').length} driving` : 'no one clocked in yet'} delay={120} />
        <MStat label="OPEN TICKETS" value={String(openTickets)} sub={`${todayJobs.length} job${todayJobs.length === 1 ? '' : 's'} today`} delay={180} />
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
        {todayJobs.length === 0 && (
          <div className="glass" style={{ padding: '14px', borderRadius: 12, fontSize: 12, color: 'var(--text-low)' }}>Nothing on the schedule today — tap Schedule to book a job.</div>
        )}
        {todayJobs.slice(0, 4).map(j => (
          <MRow key={j.id} title={j.title} sub={`${Math.floor(j.start)}:${j.start % 1 ? '30' : '00'} · ${(j.techs || []).join(', ') || '◌ unassigned'}`}
            right={j.value ? `$${(j.value / 1000).toFixed(1)}k` : ''} accent={techColor((j.techs || [])[0])} onClick={() => onNav('calendar')} />
        ))}
      </MSection>
      <MSection title="Needs your attention">
        {attention.length === 0 && (
          <div className="glass" style={{ padding: '14px', borderRadius: 12, fontSize: 12, color: 'var(--status-ok)' }}>✓ All clear — no overdue invoices, unassigned jobs, or waiting approvals.</div>
        )}
        {attention.map((a, i) => (
          <MRow key={i} icon={a.icon} iconColor={a.color} title={a.title} sub={a.sub} onClick={() => onNav(a.nav)} />
        ))}
      </MSection>
      <MSection title="Recent activity">
        {activity.length === 0 && (
          <div style={{ padding: '10px 2px', fontSize: 11, color: 'var(--text-low)' }}>Activity shows here as you work — send an invoice, pay link, or proposal and it lands in this feed.</div>
        )}
        {activity.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{a.text}</span>
            {a.amt && <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)' }}>{a.amt}</span>}
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{fmtWhen(a.ts)}</span>
          </div>
        ))}
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
              <button onClick={() => onNav('messages')} style={mDispBtn}>Message</button>
              <button onClick={() => onNav('fleet')} style={mDispBtn}>Locate</button>
              {t.status === 'idle' && <button onClick={() => onNav('calendar')} style={{ ...mDispBtn, color: 'var(--status-warn)', borderColor: 'rgba(251,191,36,0.3)' }}>Assign job</button>}
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)', alignSelf: 'center' }}>{t.hours}</span>
            </div>
          </div>
        ))}
      </MSection>
      <button onClick={() => {
        // A broadcast must actually reach the techs' Messages inboxes.
        const chat = window.__shieldChat;
        if (!chat) { showToast('Messaging not configured', 'warn'); return; }
        shieldModal({ kind: 'editor', title: 'Broadcast to all techs', placeholder: 'Message every technician…', submitLabel: 'Send Broadcast', successMsg: null, onSubmit: async (txt) => {
          if (!txt || !txt.trim()) return;
          const ths = await chat.threads();
          if (!ths || !ths.length) { showToast('No technician threads yet — techs appear after their first message or sign-in', 'warn'); return; }
          const results = await Promise.all(ths.map(th => chat.send(th.threadId, `📢 BROADCAST: ${txt.trim()}`)));
          const sent = results.filter(r => r && r.ok).length;
          showToast(sent ? `Broadcast delivered to ${sent} technician${sent === 1 ? '' : 's'}` : 'Broadcast failed — try Messages directly', sent ? 'ok' : 'warn');
        } });
      }} style={{ padding: '12px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Broadcast all techs</button>
    </div>
  );
}
const mDispBtn = { padding: '6px 13px', background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' };

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
      {custs.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{q.trim() ? `No customers match “${q}”.` : 'No customers yet — add your first with the + button, or sync QuickBooks to pull them in.'}</div>}
      {formOpen && <MobileCustomerForm onClose={() => setFormOpen(false)} />}
      {detail && <MobileCustomerDetail customer={detail} onClose={() => setDetailId(null)} onNav={onNav} />}
    </div>
  );
}

Object.assign(window, { MHomeView, MDispatchView, MCustomersView });

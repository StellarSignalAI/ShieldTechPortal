/* Finance Payments — Stripe Integration + AI Copilot */

/* ── Stripe Payments Dashboard ── */
function FinanceStripe() {
  const [stripeTab, setStripeTab] = React.useState('dashboard');

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{id:'dashboard',label:'Payments Dashboard'},{id:'methods',label:'Cards on File'},{id:'subscriptions',label:'Subscriptions'},{id:'disputes',label:'Disputes'},{id:'payouts',label:'Payouts'},{id:'events',label:'Webhook Log'},{id:'settings',label:'Settings'}].map(t => (
          <button key={t.id} onClick={() => setStripeTab(t.id)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, background: stripeTab===t.id?'rgba(63,169,245,0.12)':'transparent', border: `1px solid ${stripeTab===t.id?'var(--brand)':'var(--border-subtle)'}`, color: stripeTab===t.id?'var(--brand)':'var(--text-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.label}</button>
        ))}
      </div>

      {stripeTab === 'dashboard' && <StripeDashboard />}
      {stripeTab === 'methods' && <StripeCards />}
      {stripeTab === 'subscriptions' && <StripeSubscriptions />}
      {stripeTab === 'disputes' && <StripeDisputes />}
      {stripeTab === 'payouts' && <StripePayouts />}
      {stripeTab === 'events' && <StripeEvents />}
      {stripeTab === 'settings' && <StripeSettings />}
    </div>
  );
}

function StripeDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="VOLUME (MTD)" value="$86,400" mono={false} trend="+22% vs prior" trendDir="up" delay={0} />
        <StatCard label="SUCCESS RATE" value="97.8%" mono={false} delay={80} />
        <StatCard label="FAILED / RETRYING" value="3" delay={160} />
        <StatCard label="NEXT PAYOUT" value="$12,800" mono={false} trend="Jun 7" delay={240} />
        <StatCard label="MRR VIA STRIPE" value="$14,200" mono={false} trend="83% of total" delay={320} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <GlassPanel>
          <SectionHeader title="Recent Payments" icon="⊛" />
          {[
            { customer: 'City Hall', amount: 22100, method: 'ACH Bank Transfer', status: 'succeeded', date: 'Jun 5, 2:14 PM', fee: 44.20 },
            { customer: 'Westfield Mall', amount: 5200, method: 'Visa •••• 4242', status: 'succeeded', date: 'Jun 3, 10:30 AM', fee: 181.00 },
            { customer: 'Metro Bank Corp', amount: 4800, method: 'ACH Bank Transfer', status: 'succeeded', date: 'Jun 1, 9:00 AM', fee: 9.60 },
            { customer: 'Riverside Medical', amount: 2800, method: 'Mastercard •••• 5555', status: 'succeeded', date: 'Jun 1, 8:45 AM', fee: 111.20 },
            { customer: 'Harbor View Condos', amount: 1800, method: 'Visa •••• 1234', status: 'failed', date: 'May 28, 3:00 PM', fee: 0 },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <StatusDot status={p.status==='succeeded'?'online':'critical'} size={6} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{p.customer}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.method}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: p.status==='succeeded'?'var(--text-high)':'var(--status-critical)' }}>${p.amount.toLocaleString()}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{p.fee>0?`Fee: $${p.fee.toFixed(2)}`:p.status==='failed'?'Declined':''}</div>
              </div>
            </div>
          ))}
        </GlassPanel>

        <GlassPanel>
          <SectionHeader title="Payment Volume (30 Days)" icon="reports" />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, marginBottom: 12 }}>
            {[3200, 5200, 0, 8400, 2800, 1200, 0, 4800, 6200, 0, 22100, 3600, 5200, 0, 0, 4200, 0, 8400, 2100, 0, 5600, 0, 3800, 6400, 0, 0, 12800, 0, 4200, 7600].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${Math.max((v / 22100) * 100, 2)}%`, background: v > 0 ? 'var(--brand)' : 'rgba(63,169,245,0.06)', borderRadius: '2px 2px 0 0', opacity: v > 10000 ? 1 : 0.6 }} title={`$${v.toLocaleString()}`} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-low)' }}>
            <span>30 days ago</span><span>Today</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>68%</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>Card</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>32%</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>ACH</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>$286</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>Avg Fee</div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function StripeCards() {
  const cards = [
    { customer: 'Westfield Mall', type: 'Visa', last4: '4242', exp: '09/28', autopay: true, default: true },
    { customer: 'Westfield Mall', type: 'ACH', last4: '6789', exp: '—', autopay: false, default: false },
    { customer: 'Metro Bank Corp', type: 'ACH', last4: '1234', exp: '—', autopay: true, default: true },
    { customer: 'Riverside Medical', type: 'Mastercard', last4: '5555', exp: '11/27', autopay: true, default: true },
    { customer: 'City Hall', type: 'ACH', last4: '9876', exp: '—', autopay: true, default: true },
    { customer: 'Harbor View Condos', type: 'Visa', last4: '1234', exp: '03/26', autopay: false, default: true },
    { customer: 'Acme Dental Group', type: '—', last4: '—', exp: '—', autopay: false, default: false },
  ];
  return (
    <GlassPanel style={{ padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <SectionHeader title="Saved Payment Methods" icon="finance" count={cards.length} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Customer','Type','Last 4','Expires','AutoPay','Default',''].map((h,i) => (
          <th key={i} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
        ))}</tr></thead>
        <tbody>{cards.map((c,i) => (
          <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{c.customer}</td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{c.type}</td>
            <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{c.last4 !== '—' ? `•••• ${c.last4}` : '—'}</td>
            <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: c.exp==='03/26'?'var(--status-critical)':'var(--text-mid)' }}>{c.exp}{c.exp==='03/26'?' ⚠':''}</td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: c.autopay?'var(--status-ok)':'var(--text-low)' }}>{c.autopay?'✓ Enrolled':'—'}</td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11 }}>{c.default?'✓':''}</td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              {c.last4 === '—' ? <button onClick={() => shieldToast('Opening secure card entry for ' + (c.customer || 'customer'), 'info')} style={{ padding: '3px 8px', background: 'var(--brand)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add Card</button> : null}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </GlassPanel>
  );
}

function StripeSubscriptions() {
  const subs = [
    { customer: 'Westfield Mall', plan: 'Enterprise Monitoring', amount: 5200, interval: 'monthly', status: 'active', next: 'Jul 1', method: 'Visa •••• 4242' },
    { customer: 'Metro Bank Corp', plan: 'Enterprise Monitoring', amount: 4800, interval: 'monthly', status: 'active', next: 'Jul 1', method: 'ACH •••• 1234' },
    { customer: 'Riverside Medical', plan: 'Standard Monitoring', amount: 2800, interval: 'monthly', status: 'active', next: 'Jul 1', method: 'MC •••• 5555' },
    { customer: 'City Hall', plan: 'Standard Monitoring + Fire', amount: 3200, interval: 'monthly', status: 'active', next: 'Jul 1', method: 'ACH •••• 9876' },
    { customer: 'Harbor View Condos', plan: 'Basic Monitoring', amount: 1800, interval: 'monthly', status: 'past_due', next: 'Retry Jun 8', method: 'Visa •••• 1234' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="ACTIVE SUBS" value={subs.filter(s=>s.status==='active').length} delay={0} />
        <StatCard label="MRR (STRIPE)" value="$17,800" mono={false} delay={80} />
        <StatCard label="PAST DUE" value={subs.filter(s=>s.status==='past_due').length} delay={160} />
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Customer','Plan','Amount','Interval','Status','Next Billing','Payment Method'].map((h,i) => (
            <th key={i} style={{ textAlign: i===2?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{subs.map((s,i) => (
            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, fontWeight: 500 }}>{s.customer}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{s.plan}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${s.amount.toLocaleString()}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{s.interval}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={s.status==='active'?'online':'critical'} label={s.status==='active'?'Active':'Past Due'} /></td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: s.status==='past_due'?'var(--status-critical)':'var(--text-mid)' }}>{s.next}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{s.method}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

function StripeDisputes() {
  return (
    <GlassPanel>
      <SectionHeader title="Disputes & Chargebacks" icon="warning-tri" />
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>No open disputes</div>
        <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>Last dispute resolved: Mar 12, 2026 — Won ($2,400)</div>
      </div>
    </GlassPanel>
  );
}

function StripePayouts() {
  const payouts = [
    { date: 'Jun 4', amount: 8400, status: 'paid', arrival: 'Jun 6', txns: 4 },
    { date: 'May 28', amount: 12600, status: 'paid', arrival: 'May 30', txns: 6 },
    { date: 'May 21', amount: 6800, status: 'paid', arrival: 'May 23', txns: 3 },
    { date: 'May 14', amount: 15200, status: 'paid', arrival: 'May 16', txns: 8 },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="STRIPE BALANCE" value="$12,800" mono={false} delay={0} />
        <StatCard label="NEXT PAYOUT" value="Jun 7" mono={false} delay={80} />
        <StatCard label="PAYOUT SCHEDULE" value="T+2 days" mono={false} delay={160} />
      </div>
      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Date','Amount','Status','Arrival','Transactions'].map((h,i) => (
            <th key={i} style={{ textAlign: i===1?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>{payouts.map((p,i) => (
            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(63,169,245,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{p.date}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>${p.amount.toLocaleString()}</td>
              <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status="paid" /></td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{p.arrival}</td>
              <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{p.txns} payments</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

function StripeEvents() {
  const events = [
    { time: '2:14:08 PM', type: 'payment_intent.succeeded', desc: 'City Hall — $22,100 ACH', status: 'ok' },
    { time: '2:14:08 PM', type: 'invoice.payment_succeeded', desc: '→ Invoice INV-2854 marked paid', status: 'ok' },
    { time: '2:14:09 PM', type: 'journal_entry.auto_posted', desc: '→ JE-1042: DR Checking / CR AR $22,100', status: 'ok' },
    { time: '10:30:00 AM', type: 'payment_intent.succeeded', desc: 'Westfield Mall — $5,200 card', status: 'ok' },
    { time: '10:30:01 AM', type: 'invoice.payment_succeeded', desc: '→ Invoice INV-2860 marked paid', status: 'ok' },
    { time: '3:00:12 PM', type: 'payment_intent.payment_failed', desc: 'Harbor View — $1,800 card declined', status: 'error' },
    { time: '3:00:12 PM', type: 'subscription.payment_failed', desc: '→ Retry scheduled Jun 8', status: 'warn' },
    { time: '3:00:13 PM', type: 'dunning.reminder_sent', desc: '→ Smart retry email sent to customer', status: 'info' },
  ];
  return (
    <GlassPanel style={{ padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <SectionHeader title="Webhook Event Log" icon="◉" />
        <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: -8 }}>Stripe → ShieldTech: payment received → invoice updated → GL auto-posted</div>
      </div>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid rgba(63,169,245,0.03)', background: e.status==='error'?'rgba(244,63,94,0.02)':e.status==='warn'?'rgba(251,191,36,0.02)':'transparent' }}>
          <StatusDot status={e.status==='ok'?'online':e.status==='error'?'critical':e.status==='warn'?'warning':'info'} size={5} />
          <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)', width: 72 }}>{e.time}</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--brand)', width: 200 }}>{e.type}</span>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-mid)' }}>{e.desc}</span>
        </div>
      ))}
    </GlassPanel>
  );
}

function StripeSettings() {
  return (
    <div style={{ maxWidth: 600 }}>
      <SectionHeader title="Stripe Settings" icon="⊛" />
      <GlassPanel style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(99,91,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20 }}>⊛</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Stripe Connected</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>acct_shieldtech_live · Live mode</div>
          </div>
          <StatusBadge status="online" label="Connected" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Statement Descriptor', value: 'SHIELDTECH SEC' },
            { label: 'Accepted Methods', value: 'Visa, Mastercard, Amex, ACH' },
            { label: 'Payout Schedule', value: 'T+2 business days' },
            { label: 'Surcharge / Convenience Fee', value: 'Disabled (absorbed)' },
            { label: 'Test Mode', value: 'Off' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{s.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
      <GlassPanel style={{ borderLeft: '3px solid var(--status-warn)' }}>
        <SectionHeader title="Tax Configuration" icon="receipt" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { jurisdiction: 'Pennsylvania', rate: '6.00%', active: true },
            { jurisdiction: 'New Jersey', rate: '6.625%', active: true },
            { jurisdiction: 'New York State', rate: '4.00%', active: true },
            { jurisdiction: 'NYC', rate: '4.50%', active: true },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ flex: 1, fontSize: 12 }}>{t.jurisdiction}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, marginRight: 12 }}>{t.rate}</span>
              <StatusBadge status={t.active?'online':'offline'} label={t.active?'Active':'Off'} />
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── AI Financial Co-pilot ── */
function FinanceCopilot() {
  const [query, setQuery] = React.useState('');
  const [convo, setConvo] = React.useState([
    { role: 'hermes', text: 'I\'m your AI Financial Co-pilot. Ask me anything about your books, cash flow, profitability, or collections. I can also draft reminders and journal entries.', chart: null },
  ]);
  const [loading, setLoading] = React.useState(false);

  const presets = [
    'What\'s my cash position?',
    'Who\'s overdue?',
    'Profitability by service line last quarter?',
    'Project cash flow 90 days',
    'Draft collection reminders for overdue invoices',
    'What\'s my burn rate?',
  ];

  const answers = {
    'What\'s my cash position?': { text: 'Your current cash position is **$482,600** in checking + **$125,000** in savings = **$607,600 total liquid**. You have $36,220 in AP due within 30 days and $175,950 in AR outstanding. Net liquid position after AP: **$571,380**. This is a strong position — 4.2 months of operating runway.', chart: 'cash' },
    'Who\'s overdue?': { text: 'You have **2 overdue invoices** totaling **$19,450**:\n\n• **INV-2847** — Acme Dental Group: **$14,250** (38 days overdue, Net 30 terms)\n• **INV-2858** — Harbor View Condos: **$5,200** (24 days overdue, Net 15 terms)\n\nAcme Dental has historically paid within 5 days of reminder. Harbor View\'s card on file expired — they need to update their payment method. Want me to draft reminders?', chart: null },
    'Profitability by service line last quarter?': { text: 'Q1 2026 profitability by service line:\n\n• **Managed Services (RMR)**: 68.2% margin — your highest margin line\n• **Alarm / Intrusion**: 35.4% margin — strong, low materials cost\n• **CCTV / Video**: 32.1% margin — volume leader\n• **Access Control**: 28.7% margin — above 25% target\n• **Fire / Life Safety**: 22.8% margin — below target, driven by subcontractor costs on Riverside Medical\n\n**Recommendation**: Fire/Life Safety margins improve 6-8% if you bring fire panel programming in-house (Kevin White is NICET II certified). That would add ~$18K to annual gross profit.', chart: 'profitability' },
    'Project cash flow 90 days': { text: '90-day cash flow projection:\n\n• **30 days**: +$62K net (inflows: $186K from AR + new invoices; outflows: $124K payroll + AP)\n• **60 days**: +$94K net cumulative\n• **90 days**: +$125K net cumulative\n\nKey assumptions: Pacific Rim $48K deposit collected by Jun 15, Westfield expansion $31.8K by Jul 1, and continued MRR collection at 97% rate.\n\n**Risk**: If Acme Dental ($14.2K) and Harbor View ($5.2K) don\'t pay within 30 days, net drops to +$43K at 30 days. I recommend escalating collection efforts today.', chart: 'cashflow' },
  };

  const handleSend = (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setConvo(prev => [...prev, { role: 'user', text: question }]);
    setQuery('');
    setLoading(true);
    setTimeout(() => {
      const answer = answers[question] || { text: `Based on your books, I can see the relevant data. Let me analyze this for you...\n\nYour total revenue YTD is $1.25M with a 28.4% gross margin. Cash position is strong at $482,600. I'd recommend reviewing the AR aging report for any items that need attention.`, chart: null };
      setConvo(prev => [...prev, { role: 'hermes', text: answer.text, chart: answer.chart }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⟡</span>
        <div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Hermes Financial Co-pilot</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Natural-language BI over your books</div>
        </div>
      </div>

      {/* Preset chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => handleSend(p)} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{p}</button>
        ))}
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
        {convo.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, maxWidth: msg.role === 'user' ? '70%' : '100%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'hermes' && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⟡</div>
            )}
            <div style={{ padding: '10px 14px', borderRadius: 10, background: msg.role === 'user' ? 'var(--brand)' : 'var(--glass-bg)', border: msg.role === 'hermes' ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ fontSize: 12, color: msg.role === 'user' ? '#fff' : 'var(--text-high)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}</div>
              {msg.chart === 'profitability' && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  {[{ label: 'RMR', pct: 68 },{ label: 'Alarm', pct: 35 },{ label: 'CCTV', pct: 32 },{ label: 'Access', pct: 29 },{ label: 'Fire', pct: 23 }].map((b,j) => (
                    <div key={j} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ width: 20, height: `${b.pct}%`, background: b.pct>=30?'var(--status-ok)':b.pct>=25?'var(--status-warn)':'var(--status-critical)', borderRadius: '3px 3px 0 0' }} />
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3 }}>{b.label}</div>
                      <div className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mid)' }}>{b.pct}%</div>
                    </div>
                  ))}
                </div>
              )}
              {msg.chart === 'cash' && (
                <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
                  {[{ label: 'Checking', val: '$482.6K', color: 'var(--brand)' },{ label: 'Savings', val: '$125K', color: 'var(--status-ok)' },{ label: 'AR', val: '$175.9K', color: 'var(--status-warn)' },{ label: 'AP', val: '$36.2K', color: 'var(--status-critical)' }].map((b,j) => (
                    <div key={j} className="glass" style={{ flex: 1, padding: 8, textAlign: 'center', borderRadius: 6 }}>
                      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: b.color }}>{b.val}</div>
                      <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{b.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⟡</div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', opacity: 0.4, animation: `pulse-online 1s ease ${d*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 0 0', borderTop: '1px solid var(--border-subtle)' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about your finances..." style={{ flex: 1, padding: '10px 16px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => handleSend()} style={{ padding: '10px 20px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ask</button>
      </div>
    </div>
  );
}

Object.assign(window, { FinanceStripe, StripeDashboard, StripeCards, StripeSubscriptions, StripeDisputes, StripePayouts, StripeEvents, StripeSettings, FinanceCopilot });

/* QBO Handoff — Bank Feed & Reports wrappers + Integrations hub, Marketing, Documents */

/* ════ Bank Feed Plus — rules, payouts, deposits/transfers + AI match gating ════ */
function FinanceBankFeedPlus(props) {
  const [sub, setSub] = React.useState('feed');
  const [suggestions, setSuggestions] = React.useState([
    { txn: 'ACH IN · $22,100 · Jun 30', suggest: 'Match to INV-2049 — Sunrise Charter Schools', conf: 96, cites: ['Amount exact match', 'Payer name 92% similar', 'Invoice open 26 days'], status: 'pending' },
    { txn: 'CARD · -$318.40 · Jun 29 · ADI GLOBAL', suggest: 'Categorize: 5010 Materials — job HARBOR-04', conf: 88, cites: ['Vendor rule #12', 'PO-2210 open for Harbor', 'Prior 14 txns same category'], status: 'pending' },
    { txn: 'ACH OUT · -$2,840 · Jun 28', suggest: 'Match to term loan payment (Lending)', conf: 99, cites: ['Recurring amount match', 'Lender descriptor', 'Schedule: 15th ±3 days'], status: 'pending' },
  ]);
  const rules = [
    { name: 'ADI Global → 5010 Materials', cond: 'Descriptor contains "ADI GLOBAL"', applied: 142, auto: 'Suggest only' },
    { name: 'Stripe payouts → 1050 Stripe Clearing', cond: 'Descriptor starts "STRIPE PAYOUT"', applied: 96, auto: 'Auto-accept' },
    { name: 'Fuel cards → 6110 Vehicle Fuel', cond: 'MCC 5541/5542', applied: 88, auto: 'Auto-accept' },
    { name: 'Loan payment → 2400 Term Loan', cond: 'Descriptor contains "QBO CAP"', applied: 12, auto: 'Suggest only' },
  ];
  const payouts = [
    { src: 'Stripe payout', date: 'Jul 3', gross: 18420, fees: 552, net: 17868, status: 'cleared' },
    { src: 'Stripe payout', date: 'Jun 28', gross: 9660, fees: 292, net: 9368, status: 'cleared' },
    { src: 'QBO Payments payout', date: 'Jun 26', gross: 4400, fees: 123, net: 4277, status: 'cleared' },
  ];
  const deposits = [
    { ref: 'DEP-441', desc: 'Check deposit — City Hall retainage', amount: 12000, date: 'Jul 1', status: 'cleared' },
    { ref: 'TRF-118', desc: 'Transfer Checking → Payroll reserve', amount: 24000, date: 'Jun 30', status: 'cleared' },
    { ref: 'DEP-440', desc: 'Cash deposit — service calls', amount: 860, date: 'Jun 27', status: 'cleared' },
  ];
  const act = (i, status, msg) => { setSuggestions((s) => s.map((r, j) => j === i ? { ...r, status } : r)); props.showToast(msg); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'feed', label: 'Feed & Receipts' }, { id: 'ai', label: 'AI Matches', count: suggestions.filter(s => s.status === 'pending').length }, { id: 'rules', label: 'Rules', count: rules.length }, { id: 'payouts', label: 'Payouts' }, { id: 'deposits', label: 'Deposits & Transfers' }]} val={sub} set={setSub} />
      {sub === 'feed' && <FinanceBankFeed {...props} />}
      {sub === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Suggested matches and categorizations. Nothing posts to the ledger until you accept — every suggestion cites its evidence.</div>
          {suggestions.map((s, i) => (
            <GlassPanel key={i} style={{ opacity: s.status === 'dismissed' ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.txn}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: s.conf > 90 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{s.conf}% confidence</span>
                <QboStatus s={s.status} />
              </div>
              <div style={{ fontSize: 12.5, marginBottom: 8 }}>⟡ {s.suggest}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: s.status === 'pending' ? 10 : 0 }}>
                {s.cites.map((c, j) => <span key={j} style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 12, border: '1px dashed var(--border-subtle)', color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>⌕ {c}</span>)}
              </div>
              {s.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => act(i, 'approved', 'Match accepted — posted to ledger')} style={{ padding: '5px 14px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Accept & post</button>
                  <button onClick={() => props.showToast('Opening manual categorization')} style={{ padding: '5px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Categorize manually</button>
                  <button onClick={() => act(i, 'dismissed', 'Suggestion dismissed')} style={{ padding: '5px 14px', background: 'transparent', border: 'none', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Dismiss</button>
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      )}
      {sub === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QboTable cols={['Rule', 'Condition', 'Times applied', 'Mode']}
            rows={rules.map((r) => ({ cells: [r.name, r.cond, r.applied, <span style={{ fontSize: 10.5, color: r.auto === 'Auto-accept' ? 'var(--status-ok)' : 'var(--status-warn)', fontWeight: 600 }}>{r.auto}</span>] }))}
            onRow={(r, i) => props.showToast('Rule editor opened — ' + rules[i].name)} />
          <button onClick={() => props.showToast('New rule builder opened')} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ New rule</button>
        </div>
      )}
      {sub === 'payouts' && (
        <QboTable cols={['Source', 'Date', 'Gross', 'Fees', 'Net', 'Status']}
          rows={payouts.map((p) => ({ cells: [p.src, p.date, qboMoney(p.gross), '-' + qboMoney(p.fees), qboMoney(p.net), <QboStatus s={p.status} />] }))}
          onRow={() => qboGo('finance', { financeTab: 'stripe' })} />
      )}
      {sub === 'deposits' && (
        <QboTable cols={['Ref', 'Description', 'Date', 'Amount', 'Status']}
          rows={deposits.map((d) => ({ cells: [<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{d.ref}</span>, d.desc, d.date, qboMoney(d.amount), <QboStatus s={d.status} />] }))}
          onRow={() => shieldToast('Deposit detail opened', 'info')} />
      )}
    </div>
  );
}

/* ════ Reports Plus — cash flow planner, budgets, tax prep ════ */
function FinanceReportsPlus(props) {
  const [sub, setSub] = React.useState('center');
  const weeks = [
    { w: 'Jul 6–12', inflow: 48200, outflow: 39400 }, { w: 'Jul 13–19', inflow: 31800, outflow: 44100 },
    { w: 'Jul 20–26', inflow: 55600, outflow: 38200 }, { w: 'Jul 27–Aug 2', inflow: 29400, outflow: 51800 },
    { w: 'Aug 3–9', inflow: 46100, outflow: 37900 }, { w: 'Aug 10–16', inflow: 38800, outflow: 40600 },
  ];
  let running = 482600;
  const budget = [
    { line: 'Revenue — installations', budget: 220000, actual: 238400 }, { line: 'Revenue — recurring/monitoring', budget: 96000, actual: 94200 },
    { line: 'COGS — materials', budget: 88000, actual: 96800 }, { line: 'COGS — subcontractors', budget: 24000, actual: 19400 },
    { line: 'Payroll & burden', budget: 118000, actual: 116200 }, { line: 'Vehicles & fuel', budget: 14000, actual: 15900 },
    { line: 'Marketing', budget: 8000, actual: 5200 },
  ];
  const taxTasks = [
    { t: 'Reconcile all bank/credit accounts through Jun 30', done: true }, { t: 'Review uncategorized transactions (3 open)', done: false },
    { t: 'Verify fixed asset purchases > $2,500 for depreciation', done: true }, { t: 'Collect missing W-9 (Ramirez Concrete)', done: false },
    { t: 'Confirm Q2 estimated tax payment posted', done: true }, { t: 'Share accountant access for mid-year review', done: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <QboSubTabs tabs={[{ id: 'center', label: 'Reports Center' }, { id: 'cashflow', label: 'Cash Flow Planner' }, { id: 'budgets', label: 'Budgets' }, { id: 'tax', label: 'Tax Prep', count: taxTasks.filter(t => !t.done).length }]} val={sub} set={setSub} />
      {sub === 'center' && <FinanceReportsCenter {...props} />}
      {sub === 'cashflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="CASH TODAY" value="$482,600" delay={0} />
            <StatCard label="6-WK NET CHANGE" value="-$2,100" delay={60} />
            <StatCard label="LOWEST PROJECTED" value="$441,100" delay={120} />
            <StatCard label="RISK WEEK" value="Jul 27" mono={false} delay={180} />
          </div>
          <QboTable cols={['Week', 'Projected in', 'Projected out', 'Net', 'Running balance']}
            rows={weeks.map((w) => {
              const net = w.inflow - w.outflow; running += net;
              return { cells: [w.w, qboMoney(w.inflow), qboMoney(w.outflow), <span style={{ color: net >= 0 ? 'var(--status-ok)' : 'var(--status-critical)', fontWeight: 600 }}>{(net >= 0 ? '+' : '−') + qboMoney(Math.abs(net))}</span>, qboMoney(running)] };
            })} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Inflows from open <LinkChip screen="finance" params={{ financeTab: 'invoices' }} label="Invoices" /> + <LinkChip screen="finance" params={{ financeTab: 'recurring' }} label="Recurring" />; outflows from <LinkChip screen="finance" params={{ financeTab: 'ap' }} label="Bills & AP" /> + payroll schedule.</div>
        </div>
      )}
      {sub === 'budgets' && (
        <QboTable cols={['Budget line · FY2026 H1', 'Budget', 'Actual', 'Variance', '% used']}
          rows={budget.map((b) => {
            const varc = b.actual - b.budget; const isRev = b.line.startsWith('Revenue');
            const good = isRev ? varc >= 0 : varc <= 0;
            return { cells: [b.line, qboMoney(b.budget), qboMoney(b.actual),
              <span style={{ color: good ? 'var(--status-ok)' : 'var(--status-critical)', fontWeight: 600 }}>{(varc >= 0 ? '+' : '−') + qboMoney(Math.abs(varc))}</span>,
              Math.round(b.actual / b.budget * 100) + '%'] };
          })}
          onRow={() => props.showToast('Budget line drill-through opened')} />
      )}
      {sub === 'tax' && (
        <GlassPanel style={{ maxWidth: 680 }}>
          <SectionHeader title="Business Tax Checklist — FY2026" icon="check" />
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 12 }}>{taxTasks.filter(t => t.done).length} of {taxTasks.length} complete · prepared jointly with your accountant (<LinkChip screen="finance" params={{ financeTab: 'settings' }} label="Accountant access" />)</div>
          {taxTasks.map((t, i) => (
            <div key={i} onClick={() => props.showToast(t.done ? 'Already complete' : 'Task opened: ' + t.t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < taxTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${t.done ? 'var(--status-ok)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--status-ok)' }}>{t.done ? '✓' : ''}</span>
              <span style={{ fontSize: 12, color: t.done ? 'var(--text-mid)' : 'inherit', textDecoration: t.done ? 'line-through' : 'none' }}>{t.t}</span>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}

/* ════ Integrations Hub ════ */
function IntegrationsScreen() {
  const [sub, setSub] = React.useState('connections');
  const [demo, setDemo] = React.useState(window.__qboDemoState || 'live');
  React.useEffect(() => {
    const h = (e) => setDemo(e.detail || 'live');
    window.addEventListener('qbo-demo-state', h); return () => window.removeEventListener('qbo-demo-state', h);
  }, []);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const supaOn = Boolean(window.__shieldSupabaseConfigured);
  const aiOn = Boolean(window.__shieldAIModel);
  const conns = [
    { name: 'Supabase (platform backend)', kind: 'Database · Auth · Functions', state: supaOn ? 'connected' : 'credential', last: supaOn ? 'live' : 'never', note: supaOn ? 'Profiles, stores, Edge Functions' : 'Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' },
    { name: 'ShieldTech AI (OpenAI)', kind: 'AI service layer', state: aiOn ? 'connected' : 'credential', last: aiOn ? 'live' : 'never', note: aiOn ? `Model: ${window.__shieldAIModel}` : 'Set OPENAI_API_KEY on the ai Edge Function' },
    { name: 'SAM.gov (Get Opportunities v2)', kind: 'Bid / lead source', state: 'credential', last: 'never', note: 'Set SAM_GOV_API_KEY — see OUTSTANDING-APIS.md' },
    { name: 'Resend (invite & reset email)', kind: 'Email delivery', state: 'credential', last: 'never', note: 'Set RESEND_API_KEY on Edge Functions' },
    { name: 'Rippling (payroll & time)', kind: 'Time entries · labor payout', state: 'credential', last: 'never', note: 'Set RIPPLING_API_TOKEN — approved tech hours sync both ways' },
    { name: 'Google OAuth', kind: 'Sign-in provider', state: 'credential', last: 'never', note: 'Configure the Google provider in Supabase Auth' },
    { name: 'QuickBooks Online', kind: 'Accounting', state: 'credential', last: 'never', note: 'Later phase — see 07-INTEGRATIONS' },
    { name: 'Stripe', kind: 'Payments', state: 'credential', last: 'never', note: 'Later phase — see 07-INTEGRATIONS' },
  ];
  const stateCfg = { connected: ['var(--status-ok)', 'Connected'], polling: ['var(--brand)', 'Polling'], paused: ['var(--status-warn)', 'Paused'], failed: ['var(--status-critical)', 'Failed'], credential: ['var(--text-mid)', 'Needs credentials'] };
  const syncLog = [];
  const imports = [];
  const exports_ = [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300, marginRight: 'auto' }}>Integrations</h2>
        <button onClick={async () => {
          if (!window.__shieldAI) { showToast('AI client not loaded'); return; }
          showToast('Testing ShieldTech AI…');
          const st = await window.__shieldAI.aiStatus(true);
          if (!st.configured) { showToast('AI not configured — set OPENAI_API_KEY'); return; }
          const r = await window.__shieldAI.shieldAIChat('assistant', [{ role: 'user', content: 'Reply with exactly: ShieldTech AI online.' }]);
          showToast(r.live ? `✓ ${st.model}: ${r.text.slice(0, 60)}` : r.text.slice(0, 80));
        }} style={{ padding: '7px 14px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⟡ Test ShieldTech AI</button>
        <QboSyncBadge state={demo === 'stale' ? 'stale' : demo === 'error' ? 'error' : 'synced'} />
      </div>
      <QboSubTabs tabs={[{ id: 'connections', label: 'Connections', count: conns.length }, { id: 'activity', label: 'Sync Activity' }, { id: 'import', label: 'Import' }, { id: 'export', label: 'Export' }]} val={sub} set={setSub} />
      <StateGate state={demo} label="integrations">
        {sub === 'connections' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {conns.map((c, i) => {
              const [col, label] = stateCfg[c.state];
              return (
                <GlassPanel key={i} className="st-rowcard" style={{ cursor: 'pointer', animation: `fade-up 0.3s ease ${i * 40}ms both` }} onClick={() => shieldModal({
                  kind: 'detail', title: c.name, subtitle: c.kind,
                  sections: [{ label: 'Connection', rows: [{ k: 'Status', v: label, mono: false }, { k: 'Last sync', v: c.last, mono: false }, { k: 'Notes', v: c.note, mono: false, full: true }] }],
                  actions: c.state === 'failed' || c.state === 'credential'
                    ? [{ label: 'Reconnect', primary: true, successMsg: 'OAuth flow opened', onClick: () => {}, close: true }]
                    : [{ label: c.state === 'paused' ? 'Resume sync' : 'Pause sync', onClick: () => showToast(c.state === 'paused' ? 'Sync resumed' : 'Sync paused'), close: true },
                       { label: 'View sync history', primary: true, onClick: () => setSub('activity'), close: true }] })}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: col, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }}></span>{label}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-mid)', marginBottom: 4 }}>{c.kind} · last sync {c.last}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{c.note}</div>
                </GlassPanel>
              );
            })}
          </div>
        )}
        {sub === 'activity' && (
          <GlassPanel style={{ padding: 0 }}>
            {syncLog.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < syncLog.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-mid)', width: 40 }}>{l.t}</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: l.ok === true ? 'var(--status-ok)' : l.ok === false ? 'var(--status-critical)' : 'var(--text-mid)' }}></span>
                <span style={{ fontSize: 11.5, fontWeight: 500, width: 150, flexShrink: 0 }}>{l.src}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{l.ev}</span>
                {l.ok === false && <button onClick={() => showToast('Retrying — reconnect flow opened')} style={{ marginLeft: 'auto', padding: '3px 12px', background: 'transparent', border: '1px solid var(--status-critical)', borderRadius: 5, color: 'var(--status-critical)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Recover</button>}
              </div>
            ))}
          </GlassPanel>
        )}
        {sub === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <QboTable cols={['Import', 'Type', 'Rows', 'Status']} rows={imports.map((im) => ({ cells: [im.name, im.kind, im.rows, im.status] }))} onRow={() => showToast('Import detail opened')} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => showToast('CSV import wizard opened')} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ Import CSV</button>
              <button onClick={() => showToast('QuickBooks Desktop migration wizard opened')} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Import from QuickBooks Desktop</button>
            </div>
          </div>
        )}
        {sub === 'export' && (
          <QboTable cols={['Export', 'Format', 'Status', 'Date']} rows={exports_.map((ex) => ({ cells: [ex.name, ex.fmt, ex.status, ex.date] }))} onRow={() => showToast('Export downloaded')} />
        )}
      </StateGate>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)' }}>{toast}</div>}
    </div>
  );
}

/* ════ Marketing ════ */
function MarketingScreen() {
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const campaigns = [
    { name: 'Q3 camera upgrade offer — existing customers', ch: 'Email', audience: 'Customers w/ cameras >4 yrs (48)', status: 'active', sent: 48, opens: '64%', pipeline: 38500 },
    { name: 'Monitoring plan cross-sell', ch: 'Email', audience: 'Install-only customers (112)', status: 'active', sent: 112, opens: '41%', pipeline: 21600 },
    { name: 'Google LSA — access control SF', ch: 'Ads', audience: 'Local search', status: 'active', sent: '—', opens: '—', pipeline: 64000 },
    { name: 'Spring fire-inspection reminder', ch: 'Email + SMS', audience: 'Fire service contracts (36)', status: 'closed', sent: 36, opens: '78%', pipeline: 12400 },
    { name: 'July 4 office closure notice', ch: 'Email', audience: 'All active customers', status: 'draft', sent: 0, opens: '—', pipeline: 0 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300, marginRight: 'auto' }}>Marketing</h2>
        <button onClick={() => showToast('Campaign builder opened')} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ New campaign</button>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="ACTIVE CAMPAIGNS" value={3} delay={0} />
        <StatCard label="PIPELINE ATTRIBUTED" value="$124,100" delay={60} />
        <StatCard label="AVG OPEN RATE" value="61%" delay={120} />
        <StatCard label="LEADS THIS MONTH" value={14} delay={180} />
      </div>
      <QboTable cols={['Campaign', 'Channel', 'Audience', 'Status', 'Sent', 'Opens', 'Pipeline']}
        rows={campaigns.map((c) => ({ cells: [c.name, c.ch, c.audience, <QboStatus s={c.status} />, c.sent, c.opens, c.pipeline ? qboMoney(c.pipeline) : '—'] }))}
        onRow={(r, i) => {
          const c = campaigns[i];
          shieldModal({ kind: 'detail', title: c.name, subtitle: `${c.ch} · ${c.audience}`,
            sections: [{ label: 'Performance', rows: [{ k: 'Status', v: c.status, mono: false }, { k: 'Sent', v: String(c.sent) }, { k: 'Open rate', v: c.opens, mono: false }, { k: 'Pipeline attributed', v: c.pipeline ? qboMoney(c.pipeline) : '—' }] }],
            actions: [
              { label: 'View leads in CRM', onClick: () => qboGo('crm'), close: true },
              { label: c.status === 'active' ? 'Pause campaign' : c.status === 'draft' ? 'Review & launch' : 'Duplicate', primary: true, successMsg: c.status === 'active' ? 'Campaign paused' : c.status === 'draft' ? 'Launch requires final review — opened' : 'Campaign duplicated', onClick: () => {}, close: true },
            ] });
        }} />
      <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Campaign outcomes link to <LinkChip screen="crm" label="Leads / CRM" /> and revenue rolls into <LinkChip screen="finance" params={{ financeTab: 'overview' }} label="Finance Overview" /> — campaign data never posts to the ledger.</div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

/* ════ Documents / Attachments ════ */
function DocumentsScreen() {
  const [filter, setFilter] = React.useState('all');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const docs = [
    { name: 'INV-2054-signed.pdf', type: 'PDF', size: '184 KB', owner: 'S. Chen', date: 'Jul 2', scan: 'Clean', link: { screen: 'finance', params: { financeTab: 'invoices' }, label: 'INV-2054' }, cat: 'invoice' },
    { name: 'receipt-adi-318.40.jpg', type: 'Image', size: '2.1 MB', owner: 'M. Reyes', date: 'Jun 29', scan: 'Clean', link: { screen: 'finance', params: { financeTab: 'expenses' }, label: 'Expense' }, cat: 'receipt' },
    { name: 'W9-voltbros-2026.pdf', type: 'PDF', size: '96 KB', owner: 'J. Mitchell', date: 'Jun 24', scan: 'Clean', link: { screen: 'finance', params: { financeTab: 'ap' }, label: 'Vendor' }, cat: 'vendor' },
    { name: 'EST-301-scope-photos.zip', type: 'Archive', size: '18 MB', owner: 'J. Liu', date: 'Jun 20', scan: 'Scanning…', link: { screen: 'finance', params: { financeTab: 'estimates' }, label: 'EST-301' }, cat: 'estimate' },
    { name: 'sunrise-contract-exec.pdf', type: 'PDF', size: '412 KB', owner: 'S. Chen', date: 'Jun 18', scan: 'Clean', link: { screen: 'contracts', label: 'Contract' }, cat: 'customer' },
    { name: 'qbo-desktop-migration.qbb', type: 'Backup', size: '212 MB', owner: 'System', date: 'Jun 12', scan: 'Clean', link: { screen: 'integrations', label: 'Import' }, cat: 'import' },
    { name: 'bayview-coi-2026.pdf', type: 'PDF', size: '128 KB', owner: 'J. Mitchell', date: 'Jun 8', scan: 'Clean', link: { screen: 'customers-list', label: 'Customer' }, cat: 'customer' },
  ];
  const cats = [{ id: 'all', label: 'All' }, { id: 'invoice', label: 'Invoices' }, { id: 'receipt', label: 'Receipts' }, { id: 'estimate', label: 'Estimates' }, { id: 'vendor', label: 'Vendors' }, { id: 'customer', label: 'Customers' }, { id: 'import', label: 'Imports' }];
  const shown = docs.filter((d) => filter === 'all' || d.cat === filter);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300, marginRight: 'auto' }}>Documents & Attachments</h2>
        <QboSyncBadge state="synced" time="8 min ago" />
        <button onClick={() => showToast('Upload dialog opened — files link to a source record')} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>↑ Upload</button>
      </div>
      <QboSubTabs tabs={cats} val={filter} set={setFilter} />
      <QboTable cols={['File', 'Type', 'Size', 'Owner', 'Added', 'Scan', 'Linked record']}
        rows={shown.map((d) => ({ cells: [d.name, d.type, d.size, d.owner, d.date,
          <span style={{ fontSize: 10.5, color: d.scan === 'Clean' ? 'var(--status-ok)' : 'var(--status-warn)', fontWeight: 600 }}>{d.scan}</span>,
          <LinkChip screen={d.link.screen} params={d.link.params} label={d.link.label} />] }))}
        onRow={(r, i) => shieldModal({ kind: 'detail', title: shown[i].name, subtitle: `${shown[i].type} · ${shown[i].size} · uploaded by ${shown[i].owner}`,
          sections: [{ label: 'File', rows: [{ k: 'Added', v: shown[i].date, mono: false }, { k: 'Virus scan', v: shown[i].scan, mono: false }, { k: 'Permissions', v: 'Finance · Admin roles', mono: false }] }],
          actions: [{ label: 'Download', onClick: () => showToast('Downloading ' + shown[i].name), close: true }, { label: 'Open linked record', primary: true, onClick: () => qboGo(shown[i].link.screen, shown[i].link.params), close: true }] })} />
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

Object.assign(window, { FinanceBankFeedPlus, FinanceReportsPlus, IntegrationsScreen, MarketingScreen, DocumentsScreen });

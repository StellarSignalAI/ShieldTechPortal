/* QBO Handoff — Portal Settings, Team Plus (Payroll/Time/Contractors), Inventory Plus */

/* ════ Portal Settings ════ */
function PortalSettingsScreen() {
  const [section, setSection] = React.useState((window.__qboParams && window.__qboParams.section) || 'users');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  React.useEffect(() => {
    const h = (e) => { if (e.detail.screen === 'portal-settings' && e.detail.params.section) setSection(e.detail.params.section); };
    window.addEventListener('qbo-nav', h); return () => window.removeEventListener('qbo-nav', h);
  }, []);
  const sections = [
    { id: 'users', label: 'Users & Roles' }, { id: 'account', label: 'Account' }, { id: 'billing', label: 'Billing' },
    { id: 'privacy', label: 'Privacy' }, { id: 'fields', label: 'Custom Fields' }, { id: 'resolution', label: 'Resolution Center' },
    { id: 'desktop', label: 'Desktop App' }, { id: 'updates', label: "What's New" }, { id: 'help', label: 'Help' },
  ];
  const users = [
    { name: 'John Mitchell', role: 'Owner / Admin', access: 'Everything', last: 'now', status: 'active' },
    { name: 'Sarah Chen', role: 'Sales Manager', access: 'Sales, CRM, Finance · View', last: '12 min ago', status: 'active' },
    { name: 'Mike Reyes', role: 'Lead Technician', access: 'Field Ops, Inventory', last: '1 hr ago', status: 'active' },
    { name: 'Alma Torres (CPA)', role: 'Accountant', access: 'Finance · Full, Reports', last: 'Jul 1', status: 'active' },
    { name: 'Kevin White', role: 'Technician', access: 'Field Ops', last: '2 days ago', status: 'active' },
  ];
  const fields = [
    { name: 'PO Number', on: 'Invoices, Estimates', type: 'Text', visible: 'Print + portal' },
    { name: 'Site / Building', on: 'Invoices, Work Orders', type: 'Dropdown', visible: 'Internal + print' },
    { name: 'Contract ID', on: 'Invoices, Statements', type: 'Text', visible: 'Print only' },
    { name: 'Tech crew', on: 'Expenses, Time', type: 'Dropdown', visible: 'Internal' },
  ];
  const issues = [
    { id: 'RES-114', title: 'Duplicate customer records after QBO import (Bayview / Bayview Medical)', sev: 'warn', status: 'Open — merge suggested', date: 'Jul 3' },
    { id: 'RES-113', title: 'Stripe payout variance $12.40 vs bank feed (fee rounding)', sev: 'warn', status: 'Investigating', date: 'Jul 1' },
    { id: 'RES-110', title: 'Google Workspace token revoked', sev: 'critical', status: 'Action required', date: 'Jul 4' },
    { id: 'RES-108', title: 'COA duplicate: "Vehicle Fuel" vs "Fuel — Vehicles"', sev: 'ok', status: 'Resolved — merged Jun 28', date: 'Jun 28' },
  ];
  const updates = [
    { d: 'Jul 5, 2026', t: 'QuickBooks Finance Suite merge complete', b: 'All 153 scanned QBO screens now route to canonical ShieldTech destinations. See the QBO Map in the Finance Suite.' },
    { d: 'Jun 28, 2026', t: 'AI review gates', b: 'Co-pilot suggestions (reminders, bank matches) now require explicit approval with cited source rows before anything sends or posts.' },
    { d: 'Jun 20, 2026', t: 'Sales tax & lending', b: 'New Sales Tax workspace (returns, nexus, categories) and Lending surface (loans, LOC, capital offers).' },
  ];
  const confirmSensitive = (title, body, ok) => shieldModal({ kind: 'confirm', title, message: body + ' This change is logged to the audit trail and takes effect immediately.', confirmLabel: 'Apply change', onConfirm: () => showToast(ok) });
  const row = (k, v, i, n) => (
    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: i < n - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{k}</span><span style={{ fontSize: 11.5, textAlign: 'right' }}>{v}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300, marginRight: 'auto' }}>Portal Settings</h2>
        <span style={{ fontSize: 10.5, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>Signed in as John Mitchell · Owner</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <GlassPanel style={{ width: 190, flexShrink: 0, padding: 8 }}>
          {sections.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 7, border: 'none',
              background: section === s.id ? 'rgba(63,169,245,0.12)' : 'transparent',
              color: section === s.id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 11.5, fontWeight: section === s.id ? 600 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{s.label}</button>
          ))}
        </GlassPanel>
        <div style={{ flex: 1, minWidth: 0 }}>
          {section === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <QboTable cols={['User', 'Role', 'Access', 'Last active', '']}
                rows={users.map((u) => ({ cells: [u.name, u.role, u.access, u.last,
                  <button onClick={(e) => { e.stopPropagation(); confirmSensitive('Edit role — ' + u.name + '?', 'Changing permissions affects what this user can see across Finance, CRM, and Field Ops.', 'Role editor opened for ' + u.name); }} style={{ padding: '3px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--text-mid)', fontSize: 10.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Edit role</button>] }))} />
              <button onClick={() => confirmSensitive('Invite user?', 'New users start with no finance access until a role is assigned.', 'Invite sent')} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ Invite user</button>
              <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Accountant access maps to <LinkChip screen="finance" params={{ financeTab: 'settings' }} label="Finance Settings" />. Permission denials render as blocked states — try the "denied" demo state in the Finance Suite.</div>
            </div>
          )}
          {section === 'account' && (
            <GlassPanel style={{ maxWidth: 620 }}>
              <SectionHeader title="Company Account" icon="settings" />
              {[['Company', 'ShieldTech Solutions, Inc.'], ['Primary admin', 'John Mitchell — jmitchell@shieldtech.com'], ['Company ID', 'ST-2020-0114'], ['Linked QuickBooks realm', 'QBO ····8812 (connected)'], ['Time zone', 'America/Los_Angeles'], ['Fiscal year start', 'January']].map((r, i, a) => row(r[0], r[1], i, a.length))}
              <button onClick={() => confirmSensitive('Edit company account?', 'Company identity fields flow onto invoices, statements, and tax filings.', 'Account editor opened')} style={{ marginTop: 12, padding: '6px 16px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Edit account</button>
            </GlassPanel>
          )}
          {section === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 620 }}>
              <GlassPanel>
                <SectionHeader title="Subscription" icon="dollar" />
                {[['Plan', 'ShieldTech Platform — Pro (12 seats)'], ['Price', '$489/mo · billed annually'], ['Renewal', 'Mar 1, 2027'], ['Payment method', 'Visa ····8841']].map((r, i, a) => row(r[0], r[1], i, a.length))}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => showToast('Plan comparison opened')} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Change plan</button>
                  <button onClick={() => confirmSensitive('Update payment method?', 'The card on file is charged at the next renewal.', 'Payment method editor opened')} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Update card</button>
                </div>
              </GlassPanel>
              <QboTable cols={['Platform invoice', 'Date', 'Amount', 'Status']}
                rows={[['ST-SUB-2026-03', 'Mar 1, 2026', '$5,868.00', 'Paid'], ['ST-SUB-2025-03', 'Mar 1, 2025', '$5,388.00', 'Paid']].map((r) => ({ cells: [r[0], r[1], r[2], <span style={{ color: 'var(--status-ok)', fontSize: 11, fontWeight: 600 }}>{r[3]}</span>] }))}
                onRow={() => showToast('Invoice PDF downloaded')} />
            </div>
          )}
          {section === 'privacy' && (
            <GlassPanel style={{ maxWidth: 620 }}>
              <SectionHeader title="Privacy & Data" icon="eye" />
              {[
                { k: 'Share usage analytics', v: 'Off', danger: false },
                { k: 'AI features may read finance records', v: 'On — suggestions only, review-gated', danger: false },
                { k: 'Customer portal data visibility', v: 'Invoices + service history only', danger: false },
                { k: 'Data export (GDPR/CCPA)', v: 'Request full export', danger: false },
                { k: 'Delete company data', v: 'Contact support — 30-day hold', danger: true },
              ].map((r, i, a) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: i < a.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{r.k}</span>
                  <button onClick={() => confirmSensitive('Change privacy setting?', `"${r.k}" affects data flow across integrations and AI features.`, 'Privacy setting updated')} style={{ padding: '2px 10px', background: 'transparent', border: `1px solid ${r.danger ? 'var(--status-critical)' : 'var(--border-subtle)'}`, borderRadius: 5, color: r.danger ? 'var(--status-critical)' : 'var(--text-hi, #fff)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{r.v}</button>
                </div>
              ))}
            </GlassPanel>
          )}
          {section === 'fields' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <QboTable cols={['Field', 'Appears on', 'Type', 'Visibility']} rows={fields.map((f) => ({ cells: [f.name, f.on, f.type, f.visible] }))}
                onRow={(r, i) => confirmSensitive('Edit custom field — ' + fields[i].name + '?', 'Changing a field affects every form it appears on, including printed invoices.', 'Field editor opened')} />
              <button onClick={() => showToast('New custom field builder opened')} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>+ Add field</button>
            </div>
          )}
          {section === 'resolution' && (
            <GlassPanel style={{ padding: 0 }}>
              {issues.map((it, i) => (
                <div key={it.id} onClick={() => showToast(it.id + ' opened')} className="st-rowcard" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < issues.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: it.sev === 'critical' ? 'var(--status-critical)' : it.sev === 'warn' ? 'var(--status-warn)' : 'var(--status-ok)' }}></span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-mid)' }}>{it.id}</span>
                  <span style={{ flex: 1, fontSize: 12 }}>{it.title}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>{it.status} · {it.date}</span>
                </div>
              ))}
            </GlassPanel>
          )}
          {section === 'desktop' && (
            <GlassPanel style={{ maxWidth: 620 }}>
              <SectionHeader title="Desktop App" icon="grid-2" />
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14, lineHeight: 1.6 }}>The ShieldTech desktop app keeps the portal one keystroke away, adds global search (⌘K), and stays signed in with your hardware key.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => showToast('Download started — ShieldTech-2.4.1.dmg')} style={{ padding: '7px 18px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Download for macOS</button>
                <button onClick={() => showToast('Download started — ShieldTech-2.4.1.exe')} style={{ padding: '7px 18px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Download for Windows</button>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-mid)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>Current version 2.4.1 · your workstation: 2.4.1 (up to date)</div>
            </GlassPanel>
          )}
          {section === 'updates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 }}>
              {updates.map((u, i) => (
                <GlassPanel key={i}>
                  <div style={{ fontSize: 10, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{u.d}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 6 }}>{u.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.6 }}>{u.b}</div>
                </GlassPanel>
              ))}
            </div>
          )}
          {section === 'help' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 680 }}>
              {[
                { t: 'Knowledge Base', d: 'Guides for every module, including the QuickBooks migration.', act: () => qboGo('knowledge') },
                { t: 'QBO Map', d: 'Where did each QuickBooks screen go? Full traceability.', act: () => qboGo('finance', { financeTab: 'qbo-map' }) },
                { t: 'Contact support', d: 'Live chat 6am–6pm PT · support@shieldtech.com', act: () => showToast('Support chat opened') },
                { t: 'Resolution Center', d: 'Open data issues and sync conflicts.', act: () => setSection('resolution') },
              ].map((c, i) => (
                <GlassPanel key={i} className="st-rowcard" onClick={c.act} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>{c.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.5 }}>{c.d}</div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

/* ════ Team Plus — Employees / Payroll / Time / Contractors ════ */
function TeamScreenPlus() {
  const [sub, setSub] = React.useState((window.__qboParams && window.__qboParams.teamTab) || 'employees');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  React.useEffect(() => {
    const h = (e) => { if (e.detail.screen === 'employees' && e.detail.params.teamTab) setSub(e.detail.params.teamTab); };
    window.addEventListener('qbo-nav', h); return () => window.removeEventListener('qbo-nav', h);
  }, []);
  const payHistory = [
    { run: 'Jun 16–30, 2026', type: 'Regular · 7 employees', gross: 58200, taxes: 14260, net: 43940, status: 'cleared' },
    { run: 'Jun 1–15, 2026', type: 'Regular · 7 employees', gross: 56800, taxes: 13910, net: 42890, status: 'cleared' },
    { run: 'May 16–31, 2026', type: 'Regular + OT · 7 employees', gross: 61400, taxes: 15040, net: 46360, status: 'cleared' },
  ];
  const timeRows = [
    { tech: 'Mike Reyes', week: 'Jun 29–Jul 5', reg: 38.5, ot: 4.0, jobs: 'Bayview (22h) · Service (16.5h)', status: 'pending' },
    { tech: 'Jessica Liu', week: 'Jun 29–Jul 5', reg: 40.0, ot: 2.5, jobs: 'Harbor rollout (34h) · Admin (8.5h)', status: 'pending' },
    { tech: 'Kevin White', week: 'Jun 29–Jul 5', reg: 36.0, ot: 0, jobs: 'Sunrise punch list (30h) · Training (6h)', status: 'approved' },
    { tech: 'Diana Patel', week: 'Jun 29–Jul 5', reg: 39.5, ot: 1.5, jobs: 'Service calls (28h) · Shop (13h)', status: 'approved' },
    { tech: 'Tony Garcia', week: 'Jun 29–Jul 5', reg: 40.0, ot: 6.0, jobs: 'Fire inspections (40h) · Emergency (6h)', status: 'pending' },
  ];
  const contractors = [
    { name: 'Volt Bros Electrical LLC', trade: 'Electrical', active: 'Harbor Logistics rollout', ytd: 48200, w9: 'On file', ins: 'COI valid → Feb 2027' },
    { name: 'SafeWire Security Consulting', trade: 'Design/eng', active: 'RFP support', ytd: 22400, w9: 'On file', ins: 'COI valid → Nov 2026' },
    { name: 'Ramirez Concrete Coring', trade: 'Coring', active: '—', ytd: 9600, w9: 'MISSING', ins: 'COI valid → Sep 2026' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <QboSubTabs tabs={[{ id: 'employees', label: 'Employees' }, { id: 'payroll', label: 'Payroll' }, { id: 'time', label: 'Time', count: timeRows.filter(t => t.status === 'pending').length }, { id: 'contractors', label: 'Contractors' }]} val={sub} set={setSub} />
      {sub === 'employees' && <EmployeeScreen />}
      {sub === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="NEXT PAY RUN" value="Jul 15" mono={false} delay={0} />
            <StatCard label="EST. GROSS" value="$59,400" delay={60} />
            <StatCard label="PAYROLL TAX DUE JUL 15" value="$14,580" delay={120} />
            <StatCard label="PENDING TIME APPROVALS" value={3} delay={180} />
          </div>
          <GlassPanel style={{ borderColor: 'rgba(63,169,245,0.3)' }}>
            <SectionHeader title="Pay run — Jul 1–15, 2026" icon="dollar" />
            <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 12 }}>7 employees · 3 timesheets still pending approval. Approving time first keeps job costing accurate.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSub('time')} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Review time first</button>
              <button onClick={() => shieldModal({ kind: 'confirm', title: 'Run payroll for Jul 1–15?', message: 'Direct deposits total ≈ $44,800 and post to the ledger on settle. Payroll tax liabilities accrue automatically. This cannot be un-sent after 5:00 PM PT.', confirmLabel: 'Run payroll', onConfirm: () => showToast('Payroll submitted — deposits land Jul 15') })} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Run payroll…</button>
            </div>
          </GlassPanel>
          <QboTable cols={['Pay period', 'Type', 'Gross', 'Taxes & withholding', 'Net pay', 'Status']}
            rows={payHistory.map((p) => ({ cells: [p.run, p.type, qboMoney(p.gross), qboMoney(p.taxes), qboMoney(p.net), <QboStatus s={p.status} />] }))}
            onRow={() => showToast('Pay run detail opened')} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Wages post to <LinkChip screen="finance" params={{ financeTab: 'ledger' }} label="General Ledger" /> and labor burden flows to <LinkChip screen="costing" label="Job Costing" />. Payroll tax filings tracked under <LinkChip screen="finance" params={{ financeTab: 'reports-center' }} label="Tax Prep" />.</div>
        </div>
      )}
      {sub === 'time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QboTable cols={['Technician', 'Week', 'Regular', 'OT', 'Job attribution', 'Status', '']}
            rows={timeRows.map((t, i) => ({ cells: [t.tech, t.week, t.reg + 'h', t.ot ? <span style={{ color: 'var(--status-warn)' }}>{t.ot}h</span> : '—', t.jobs, <QboStatus s={t.status} />,
              t.status === 'pending' ? <button onClick={(e) => { e.stopPropagation(); showToast('Timesheet approved — ' + t.tech); }} style={{ padding: '3px 12px', background: 'var(--brand)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Approve</button> : ''] }))}
            onRow={(r, i) => showToast(timeRows[i].tech + ' — weekly timesheet opened')} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Single time entries and weekly timesheets share this workspace. Approved hours feed <LinkChip screen="employees" params={{ teamTab: 'payroll' }} label="Payroll" /> and <LinkChip screen="costing" label="Job Costing" />. Field entry lives in <LinkChip screen="timesheets" label="Timesheet Approval" />.</div>
        </div>
      )}
      {sub === 'contractors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QboTable cols={['Contractor', 'Trade', 'Active engagement', 'YTD paid', 'W-9', 'Insurance']}
            rows={contractors.map((c) => ({ cells: [c.name, c.trade, c.active, qboMoney(c.ytd),
              <span style={{ color: c.w9 === 'MISSING' ? 'var(--status-critical)' : 'var(--status-ok)', fontSize: 11, fontWeight: 600 }}>{c.w9}</span>, c.ins] }))}
            onRow={(r, i) => shieldModal({ kind: 'detail', title: contractors[i].name, subtitle: contractors[i].trade + ' · linked vendor record',
              sections: [{ label: 'Compliance', rows: [{ k: 'W-9', v: contractors[i].w9, mono: false }, { k: 'Insurance', v: contractors[i].ins, mono: false }, { k: 'YTD paid', v: qboMoney(contractors[i].ytd) }] }],
              actions: [
                { label: 'Open vendor / 1099', onClick: () => qboGo('finance', { financeTab: 'ap' }), close: true },
                { label: 'View in Sub-Contractors', primary: true, onClick: () => qboGo('subcontractors'), close: true },
              ] })} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>One identity per contractor — payments live in <LinkChip screen="finance" params={{ financeTab: 'ap' }} label="Bills & AP / 1099s" />, field assignments in <LinkChip screen="subcontractors" label="Sub-Contractors" />.</div>
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

/* ════ Inventory Plus — Warehouse / Sales Orders / Item Receipts / Shipping ════ */
function InventoryScreenPlus() {
  const [sub, setSub] = React.useState((window.__qboParams && window.__qboParams.invTab) || 'warehouse');
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  React.useEffect(() => {
    const h = (e) => { if (e.detail.screen === 'inventory' && e.detail.params.invTab) setSub(e.detail.params.invTab); };
    window.addEventListener('qbo-nav', h); return () => window.removeEventListener('qbo-nav', h);
  }, []);
  const salesOrders = [
    { so: 'SO-2214', customer: 'Harbor Logistics', items: '12 cameras, 1 NVR, cabling', committed: 14, total: 24800, fulfill: 'Partially picked (8/14)', status: 'open' },
    { so: 'SO-2213', customer: 'Bayview Medical Plaza', items: '4 readers, 1 controller', committed: 5, total: 4120, fulfill: 'Awaiting stock — CD52 backorder', status: 'open' },
    { so: 'SO-2211', customer: 'Sunrise Charter Schools', items: 'Fire panel + 12 devices', committed: 13, total: 9400, fulfill: 'Shipped Jul 1', status: 'billed' },
  ];
  const receipts = [
    { rcpt: 'RC-1181', po: 'PO-2214', vendor: 'ADI Global', items: '8 × Axis P3265-V', qty: 8, status: 'Received — putaway pending', date: 'Jul 3' },
    { rcpt: 'RC-1180', po: 'PO-2210', vendor: 'Verkada Direct', items: '4 × CD52 Indoor', qty: 4, status: 'Inspecting (1 damaged?)', date: 'Jul 2' },
    { rcpt: 'RC-1178', po: 'PO-2206', vendor: 'Anixter', items: 'Cat6A × 10 boxes', qty: 10, status: 'Complete', date: 'Jun 28' },
  ];
  const shipments = [
    { ship: 'SH-448', dest: 'Harbor Logistics — Dock 4', carrier: 'Tech delivery V-08', tracking: '—', contents: 'SO-2214 partial (8 units)', status: 'In transit today' },
    { ship: 'SH-447', dest: 'Sunrise Charter — Campus B', carrier: 'FedEx Ground', tracking: '7811 4402 1180', contents: 'SO-2211 complete', status: 'Delivered Jul 2' },
    { ship: 'SH-445', dest: 'RMA → Verkada', carrier: 'UPS', tracking: '1Z 884 A21', contents: '1 × CD52 (damaged)', status: 'Label created' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <QboSubTabs tabs={[{ id: 'warehouse', label: 'Warehouse & Trucks' }, { id: 'so', label: 'Sales Orders', count: salesOrders.filter(s => s.status === 'open').length }, { id: 'receipts', label: 'Item Receipts', count: 2 }, { id: 'shipping', label: 'Shipping' }]} val={sub} set={setSub} />
      {sub === 'warehouse' && <InventoryScreen />}
      {sub === 'so' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QboTable cols={['SO', 'Customer', 'Items', 'Committed qty', 'Value', 'Fulfillment', 'Status']}
            rows={salesOrders.map((s) => ({ cells: [<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{s.so}</span>, s.customer, s.items, s.committed, qboMoney(s.total), s.fulfill, <QboStatus s={s.status} />] }))}
            onRow={(r, i) => {
              const s = salesOrders[i];
              shieldModal({ kind: 'detail', title: s.so + ' — ' + s.customer, subtitle: s.items,
                sections: [{ label: 'Fulfillment', rows: [{ k: 'Committed', v: String(s.committed) }, { k: 'Value', v: qboMoney(s.total) }, { k: 'Status', v: s.fulfill, mono: false, full: true }] }],
                actions: [
                  { label: 'Create invoice', onClick: () => qboGo('finance', { financeTab: 'invoices' }), close: true },
                  { label: s.status === 'open' ? 'Pick & ship…' : 'View shipment', primary: true, onClick: () => setSub('shipping'), close: true },
                ] });
            }} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)' }}>Committed quantities reserve warehouse stock. Sales orders convert to <LinkChip screen="finance" params={{ financeTab: 'invoices' }} label="Invoices" /> and drive reorder risk on <LinkChip screen="purchase-orders" label="Purchase Orders" />.</div>
        </div>
      )}
      {sub === 'receipts' && (
        <QboTable cols={['Receipt', 'PO', 'Vendor', 'Items', 'Qty', 'Status', 'Date']}
          rows={receipts.map((r) => ({ cells: [<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{r.rcpt}</span>, <LinkChip screen="purchase-orders" label={r.po} />, r.vendor, r.items, r.qty, r.status, r.date] }))}
          onRow={(r, i) => shieldModal({ kind: 'confirm', title: 'Post ' + receipts[i].rcpt + ' to inventory?', message: 'Posting updates on-hand quantities and accrues the vendor bill in AP.', confirmLabel: 'Post receipt', onConfirm: () => showToast('Receipt posted — stock and AP updated') })} />
      )}
      {sub === 'shipping' && (
        <QboTable cols={['Shipment', 'Destination', 'Carrier', 'Tracking', 'Contents', 'Status']}
          rows={shipments.map((s) => ({ cells: [<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{s.ship}</span>, s.dest, s.carrier, <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{s.tracking}</span>, s.contents, s.status] }))}
          onRow={(r, i) => showToast(shipments[i].ship + ' — label PDF opened')} />
      )}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  );
}

Object.assign(window, { PortalSettingsScreen, TeamScreenPlus, InventoryScreenPlus });

/* Portal Additions — Expense Approval, Timesheet Approval, HR, Contracts, SLA */

/* ── Expense Approval (Owner View) ── */
function ExpenseApprovalScreen() {
  const [filter, setFilter] = React.useState('pending');
  const [expenses, setExpenses] = React.useState([
    { id: 'EXP-042', tech: 'Mike Reyes', initials: 'MR', date: 'Jun 5', type: 'Materials', desc: 'Cat6A patch cables (10-pack)', amount: 48.50, status: 'pending', job: 'J-4202', receipt: true },
    { id: 'EXP-041', tech: 'Mike Reyes', initials: 'MR', date: 'Jun 4', type: 'Mileage', desc: '42.6 mi — 3 site visits', amount: 29.82, status: 'pending', job: '—', miles: 42.6 },
    { id: 'EXP-040', tech: 'Jessica Liu', initials: 'JL', date: 'Jun 4', type: 'Meals', desc: 'Lunch — on-site Metro Bank', amount: 18.50, status: 'pending', job: 'J-4198', receipt: true },
    { id: 'EXP-039', tech: 'Kevin White', initials: 'KW', date: 'Jun 3', type: 'Tools', desc: 'Wire stripper replacement', amount: 42.00, status: 'pending', job: '—', receipt: true },
    { id: 'EXP-038', tech: 'Diana Patel', initials: 'DP', date: 'Jun 3', type: 'Parking', desc: 'Downtown garage — City Hall', amount: 22.00, status: 'pending', job: 'J-4192', receipt: true },
    { id: 'EXP-037', tech: 'Tony Garcia', initials: 'TG', date: 'Jun 2', type: 'Materials', desc: 'Conduit + fittings — emergency', amount: 67.40, status: 'pending', job: 'J-4190', receipt: true },
    { id: 'EXP-036', tech: 'Mike Reyes', initials: 'MR', date: 'Jun 1', type: 'Tools', desc: 'RJ45 crimp tool replacement', amount: 89.99, status: 'approved', job: '—', receipt: true },
    { id: 'EXP-035', tech: 'Jessica Liu', initials: 'JL', date: 'May 30', type: 'Meals', desc: 'Team dinner — project completion', amount: 124.00, status: 'rejected', job: '—', receipt: true, rejectReason: 'Over per-person limit ($25). Resubmit split.' },
  ]);

  const setStatus = (id, status, verb) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    shieldToast(`${verb} ${id}`, status === 'approved' ? 'ok' : 'warn');
  };
  const approveAll = () => {
    const n = expenses.filter(e => e.status === 'pending').length;
    setExpenses(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'approved' } : e));
    shieldToast(`Approved all ${n} pending expense${n === 1 ? '' : 's'}`, 'ok');
  };

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);
  const pendingTotal = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="PENDING APPROVAL" value={expenses.filter(e => e.status === 'pending').length} delay={0} />
        <StatCard label="PENDING TOTAL" value={`$${pendingTotal.toFixed(0)}`} mono={false} delay={80} />
        <StatCard label="MONTH TO DATE" value={`$${monthTotal.toFixed(0)}`} mono={false} delay={160} />
        <StatCard label="AVG PER TECH" value={`$${(monthTotal / 5).toFixed(0)}`} mono={false} delay={240} />
      </div>

      {/* ShieldTech AI insight */}
      <div className="glass" style={{ padding: '10px 16px', borderLeft: '3px solid var(--brand)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>⟡</span>
        <span style={{ fontSize: 12, color: 'var(--text-high)', flex: 1 }}>
          <strong>ShieldTech AI:</strong> Diana Patel's parking expense ($22) could use the company parking pass — saved $88/mo for City Hall jobs last quarter.
        </span>
        <button onClick={() => shieldToast('Flagged for Diana Patel — parking pass note sent', 'info')} style={{ padding: '4px 10px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Flag & Notify</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 12,
            background: filter === f ? 'rgba(63,169,245,0.12)' : 'transparent',
            border: '1px solid var(--border-subtle)',
            color: filter === f ? 'var(--brand)' : 'var(--text-low)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize'
          }}>{f} {f === 'pending' ? `(${expenses.filter(e => e.status === 'pending').length})` : ''}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={approveAll} style={{ padding: '5px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve All Pending</button>
      </div>

      {/* Expense cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((e, i) => (
          <GlassPanel key={i} style={{ padding: '14px 18px', animation: `fade-up 0.3s ease ${i * 40}ms both` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{e.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{e.tech}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{e.id}</span>
                  <StatusBadge status={e.status === 'approved' ? 'online' : e.status === 'rejected' ? 'critical' : 'pending'} label={e.status} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-high)', marginBottom: 2 }}>{e.desc}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-low)' }}>
                  <span>{e.date}</span><span>·</span><span>{e.type}</span>
                  {e.job !== '—' && <><span>·</span><span className="mono" style={{ color: 'var(--brand)' }}>{e.job}</span></>}
                  {e.receipt && <><span>·</span><span>▤ Receipt</span></>}
                  {e.miles && <><span>·</span><span>{e.miles} mi @ $0.70</span></>}
                </div>
                {e.rejectReason && <div style={{ fontSize: 11, color: 'var(--status-critical)', marginTop: 4, fontStyle: 'italic' }}>Reason: {e.rejectReason}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-high)' }}>${e.amount.toFixed(2)}</div>
              </div>
            </div>
            {e.status === 'pending' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end' }}>
                <button onClick={() => setStatus(e.id, 'approved', 'Approved')} style={{ padding: '5px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>
                <button onClick={() => setStatus(e.id, 'rejected', 'Rejected')} style={{ padding: '5px 12px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕ Reject</button>
                <button onClick={() => shieldToast(`Question sent to ${e.tech} about ${e.id}`, 'info')} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>? Ask</button>
              </div>
            )}
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

/* ── Timesheet Approval ── */
function TimesheetApprovalScreen() {
  const [timesheets, setTimesheets] = React.useState([
    { tech: 'Mike Reyes', initials: 'MR', period: 'Jun 2–6', total: 38.2, billable: 32.5, drive: 4.2, admin: 1.5, overtime: 0, status: 'pending', jobs: 8 },
    { tech: 'Jessica Liu', initials: 'JL', period: 'Jun 2–6', total: 41.5, billable: 35.0, drive: 3.8, admin: 2.7, overtime: 1.5, status: 'pending', jobs: 6 },
    { tech: 'Kevin White', initials: 'KW', period: 'Jun 2–6', total: 36.8, billable: 31.2, drive: 3.6, admin: 2.0, overtime: 0, status: 'pending', jobs: 7 },
    { tech: 'Diana Patel', initials: 'DP', period: 'Jun 2–6', total: 40.0, billable: 33.8, drive: 4.5, admin: 1.7, overtime: 0, status: 'submitted', jobs: 9 },
    { tech: 'Tony Garcia', initials: 'TG', period: 'Jun 2–6', total: 42.3, billable: 36.0, drive: 3.2, admin: 3.1, overtime: 2.3, status: 'submitted', jobs: 7 },
  ]);

  const setTsStatus = (tech, status, verb) => {
    setTimesheets(prev => prev.map(t => t.tech === tech ? { ...t, status } : t));
    shieldToast(`${verb} — ${tech}, week of Jun 2`, status === 'approved' ? 'ok' : 'warn');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="PENDING APPROVAL" value={timesheets.filter(t => t.status === 'pending' || t.status === 'submitted').length} delay={0} />
        <StatCard label="TOTAL HOURS" value={timesheets.reduce((s,t) => s + t.total, 0).toFixed(0) + 'h'} mono={false} delay={80} />
        <StatCard label="BILLABLE %" value={Math.round(timesheets.reduce((s,t) => s + t.billable, 0) / timesheets.reduce((s,t) => s + t.total, 0) * 100) + '%'} mono={false} delay={160} />
        <StatCard label="OVERTIME" value={timesheets.reduce((s,t) => s + t.overtime, 0).toFixed(1) + 'h'} mono={false} delay={240} />
      </div>

      {/* Timesheet cards */}
      {timesheets.map((ts, i) => (
        <GlassPanel key={i} style={{ animation: `fade-up 0.3s ease ${i * 60}ms both` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ts.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{ts.tech}</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{ts.period} · {ts.jobs} jobs</div>
            </div>
            <StatusBadge status={ts.status === 'pending' ? 'pending' : 'info'} label={ts.status} />
          </div>

          {/* Hours breakdown */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Total', value: ts.total, color: 'var(--text-high)' },
              { label: 'Billable', value: ts.billable, color: 'var(--brand)' },
              { label: 'Drive', value: ts.drive, color: 'var(--status-warn)' },
              { label: 'Admin', value: ts.admin, color: 'var(--text-low)' },
              { label: 'OT', value: ts.overtime, color: ts.overtime > 0 ? 'var(--status-critical)' : 'var(--text-low)' },
            ].map((h, hi) => (
              <div key={hi} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 4, background: 'rgba(63,169,245,0.03)' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: h.color }}>{h.value}h</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{h.label}</div>
              </div>
            ))}
          </div>

          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1, marginBottom: 10 }}>
            <div style={{ width: `${(ts.billable/ts.total)*100}%`, background: 'var(--brand)' }} />
            <div style={{ width: `${(ts.drive/ts.total)*100}%`, background: 'var(--status-warn)' }} />
            <div style={{ width: `${(ts.admin/ts.total)*100}%`, background: 'var(--text-low)', opacity: 0.5 }} />
            {ts.overtime > 0 && <div style={{ width: `${(ts.overtime/ts.total)*100}%`, background: 'var(--status-critical)' }} />}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={() => shieldModal({ kind: 'doc', title: 'Timesheet Detail', docTitle: `${ts.tech} — Week of ${ts.period}`, meta: `${ts.jobs} jobs · ${ts.total}h total`, downloadLabel: 'Export Timesheet', downloadMsg: 'Timesheet exported', paragraphs: [
              { k: 'Billable hours', v: ts.billable + 'h' },
              { k: 'Drive time', v: ts.drive + 'h' },
              { k: 'Admin', v: ts.admin + 'h' },
              { k: 'Overtime', v: ts.overtime + 'h' },
              { k: 'Total', v: ts.total + 'h' },
              { k: 'Status', v: ts.status }
            ] })} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View Details</button>
            <button onClick={() => setTsStatus(ts.tech, 'approved', 'Approved')} style={{ padding: '5px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>
            <button onClick={() => setTsStatus(ts.tech, 'returned', 'Returned')} style={{ padding: '5px 12px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Return</button>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

/* ── HR / Employee Management ── */
function EmployeeScreen() {
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  // Blank canvas: the team is the real profiles table (people invited via the
  // Add Team Member flow). No filler employees.
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const deptFor = (role) => /tech|field|install/i.test(role || '') ? 'Field Ops'
    : /sales|account exec|bd/i.test(role || '') ? 'Sales'
    : /admin|owner|manager|gm/i.test(role || '') ? 'Admin' : 'Team';
  const load = React.useCallback(async () => {
    if (!window.__shieldSupabase) { setLoading(false); return; }
    const { data } = await window.__shieldSupabase
      .from('profiles').select('id,name,email,role,created_at').order('created_at', { ascending: true });
    setEmployees((data || []).map(p => {
      const name = p.name || p.email || 'Team member';
      return {
        id: p.id, name, email: p.email || '',
        initials: name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') || 'T',
        role: p.role || 'Technician', dept: deptFor(p.role), status: 'active',
        hireDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—',
        phone: '', certs: 0, rating: 0, utilization: 0,
      };
    }));
    setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const isAdmin = ((window.__shieldUser && window.__shieldUser.role) === 'Admin');
  // Service-role user actions (remove / reset password / resend invite).
  const manageUser = async (action, emp) => {
    if (!window.__shieldSupabase) { shieldToast('Backend not configured', 'warn'); return; }
    const { data, error } = await window.__shieldSupabase.functions.invoke('manage-user', {
      body: { action, userId: emp.id },
    });
    if (error || !data || !data.ok) {
      shieldToast((data && data.error) || (error && error.message) || 'Action failed', 'error');
      return;
    }
    if (action === 'remove') { shieldToast(`Removed ${emp.name}`, 'ok'); load(); }
    else shieldToast(data.data && data.data.emailed ? `Email sent to ${emp.email}` : `New temp password: ${data.data && data.data.temp_password}`, 'ok');
  };
  const confirmRemove = (emp) => shieldModal({
    kind: 'confirm', title: 'Remove team member',
    message: `Remove ${emp.name} from the team? This deletes their login and profile. This can't be undone.`,
    confirmLabel: 'Remove', danger: true,
    onConfirm: () => manageUser('remove', emp),
  });

  const openEmployee = (emp) => shieldModal({
    kind: 'detail', title: emp.name, subtitle: `${emp.role} · ${emp.dept}`,
    badge: { status: 'online', label: 'Active' },
    sections: [
      { label: 'Contact', rows: [
        { k: 'Email', v: emp.email, mono: false, full: true }, { k: 'Phone', v: emp.phone, mono: false },
        { k: 'Hire Date', v: emp.hireDate, mono: false }, { k: 'Department', v: emp.dept, mono: false },
        { k: 'Certifications', v: emp.certs },
      ]},
      ...(emp.utilization > 0 || emp.rating > 0 ? [{ label: 'Performance', meters: [
        ...(emp.utilization > 0 ? [{ label: 'Utilization', value: emp.utilization, max: 100 }] : []),
        ...(emp.rating > 0 ? [{ label: 'Customer Rating', value: emp.rating, max: 5, display: emp.rating.toFixed(1) }] : []),
      ] }] : []),
    ],
    actions: [
      { label: 'Message', onClick: () => shieldToast('Message sent to ' + emp.name, 'info'), close: true },
      ...(isAdmin ? [
        { label: 'Resend Invite', onClick: () => manageUser('resend', emp), close: true },
        { label: 'Reset Password', onClick: () => manageUser('reset', emp), close: true },
        { label: 'Remove', danger: true, close: true, onClick: () => confirmRemove(emp) },
      ] : [
        { label: 'View Schedule', primary: true, successMsg: 'Opening schedule for ' + emp.name, onClick: () => {} },
      ]),
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 300 }}>Team</h2>
        <button onClick={() => setAddModalOpen(true)} style={{ padding: '6px 16px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="add" size={14} color="#fff" /> Add Team Member</button>
      </div>

      {/* Stats */}
      {(() => {
        const uts = employees.filter(e => e.utilization > 0);
        const rts = employees.filter(e => e.rating > 0);
        return (
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard label="TEAM MEMBERS" value={employees.length} delay={0} />
            <StatCard label="FIELD TECHS" value={employees.filter(e => e.dept === 'Field Ops').length} delay={80} />
            <StatCard label="AVG UTILIZATION" value={uts.length ? Math.round(uts.reduce((s,e) => s + e.utilization, 0) / uts.length) + '%' : '—'} mono={false} delay={160} />
            <StatCard label="AVG RATING" value={rts.length ? (rts.reduce((s,e) => s + e.rating, 0) / rts.length).toFixed(1) : '—'} mono={false} delay={240} />
          </div>
        );
      })()}

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <GlassPanel style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-high)', marginBottom: 6 }}>No team members yet</div>
          <div style={{ fontSize: 12, color: 'var(--text-low)', maxWidth: 380, margin: '0 auto 14px' }}>Add your first team member — you'll set their role, app access, and pay, then send the invite in the same flow.</div>
          <button onClick={() => setAddModalOpen(true)} style={{ padding: '9px 18px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Team Member</button>
        </GlassPanel>
      )}

      {/* Employee cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {employees.map((emp, i) => (
          <GlassPanel key={i} onClick={() => openEmployee(emp)} className="st-rowcard" style={{ cursor: 'pointer', animation: `fade-up 0.3s ease ${i * 50}ms both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(63,169,245,0.2), rgba(63,169,245,0.05))', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>{emp.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{emp.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{emp.role}</div>
              </div>
              <StatusDot status="online" size={6} pulse />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: emp.utilization >= 85 ? 'var(--status-ok)' : emp.utilization >= 70 ? 'var(--status-warn)' : emp.utilization > 0 ? 'var(--status-critical)' : 'var(--text-low)' }}>{emp.utilization > 0 ? emp.utilization + '%' : '—'}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Utilization</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{emp.certs}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Certs</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: emp.rating >= 4.7 ? 'var(--status-ok)' : emp.rating > 0 ? 'var(--text-high)' : 'var(--text-low)' }}>{emp.rating > 0 ? emp.rating : '—'}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Rating</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', display: 'flex', gap: 8 }}>
              <span>{emp.dept}</span><span>·</span><span>Since {emp.hireDate}</span>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Add Team Member Modal — collects info + role + privileges, then sends the invite */}
      {addModalOpen && <AddEmployeeModal onClose={() => setAddModalOpen(false)} showToast={showToast} onDone={load} team={employees} />}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>
  );
}

/* ── Add Team Member Modal — new-hire wizard that ends by creating the user +
   sending the invite (Users & Invites folded into the create flow). ── */
function AddEmployeeModal({ onClose, showToast, onDone, team = [] }) {
  const [step, setStep] = React.useState(0); // 0=info, 1=role, 2=privileges, 3=documents, 4=invite
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [emp, setEmp] = React.useState({
    firstName: '', lastName: '', email: '', phone: '', dept: 'Field Ops',
    role: 'Technician', reportTo: '', startDate: '',
    // Privileges
    portalAccess: true, techAppAccess: true, dispatchView: true, dispatchEdit: false,
    financeView: false, financeEdit: false, crmView: true, crmEdit: false,
    proposalsView: true, proposalsEdit: false, inventoryView: true, inventoryEdit: false,
    assetsView: true, assetsEdit: true, monitoringView: true, monitoringEdit: false,
    adminView: false, adminEdit: false, approvals: false, reportsView: true,
    // Pay
    payType: 'hourly', payRate: '', overtimeRate: '',
    // Docs
    documents: [],
  });
  const update = (f, v) => setEmp(prev => ({ ...prev, [f]: v }));

  // Upload a team-member document to Supabase Storage and mark it on the record.
  const uploadDoc = async (label, file) => {
    if (!file) return;
    const store = window.__shieldStorage;
    const entityId = (emp.email || `${emp.firstName} ${emp.lastName}`).trim().toLowerCase() || 'new-hire';
    showToast(`Uploading ${label}…`);
    let res = { local: true };
    if (store && store.uploadFile) {
      try {
        res = await store.uploadFile(file, {
          folder: 'team-documents', entity: 'employee', entityId, name: `${label} — ${file.name}`,
          shared: true,
        });
      } catch { res = { local: true }; }
    }
    setEmp(prev => prev.documents.includes(label) ? prev : { ...prev, documents: [...prev.documents, label] });
    showToast(res && res.local ? `${label} attached` : `${label} saved`, 'ok');
  };

  // Create the user + send the invite (this IS Users & Invites, inside the flow).
  const sendInvite = async () => {
    const email = (emp.email || '').trim();
    const name = `${emp.firstName} ${emp.lastName}`.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showToast('Enter a valid email in Personal Info', 'warn'); setStep(0); return; }
    if (!window.__shieldSupabase) { showToast('Backend not configured', 'warn'); return; }
    const inviteRole = emp.adminEdit ? 'Admin' : emp.portalAccess ? 'Staff' : 'Technician';
    const app_rights = { portal: !!emp.portalAccess, tech: !!emp.techAppAccess, customer: false };
    setBusy(true); setResult(null);
    const { data, error } = await window.__shieldSupabase.functions.invoke('invite-user', {
      body: { email, name: name || email, role: inviteRole, app_rights },
    });
    setBusy(false);
    if (error || !data || !data.ok) { showToast((data && data.error) || (error && error.message) || 'Could not create team member', 'error'); return; }
    setResult(data.data);
    if (onDone) onDone();
    showToast(data.data.emailed ? `Invite emailed to ${email}` : 'Team member created — copy the temp password below', 'ok');
  };

  const steps = ['Personal Info', 'Role & Pay', 'App Privileges', 'Documents', 'Send Invite'];
  const inputStyle = { width: '100%', padding: '8px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' };
  const labelStyle = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' };

  const privilegeGroups = [
    { label: 'PORTAL ACCESS', items: [
      { id: 'portalAccess', name: 'Owner Portal Login' },
      { id: 'techAppAccess', name: 'Technician App Login' },
    ]},
    { label: 'DISPATCH & FIELD', items: [
      { id: 'dispatchView', name: 'View Dispatch Board' },
      { id: 'dispatchEdit', name: 'Edit/Assign Jobs' },
    ]},
    { label: 'FINANCE & BILLING', items: [
      { id: 'financeView', name: 'View Invoices & Financials' },
      { id: 'financeEdit', name: 'Create/Edit Invoices' },
    ]},
    { label: 'SALES & CRM', items: [
      { id: 'crmView', name: 'View Pipeline & Customers' },
      { id: 'crmEdit', name: 'Edit Deals & Contacts' },
      { id: 'proposalsView', name: 'View Proposals' },
      { id: 'proposalsEdit', name: 'Create/Send Proposals' },
    ]},
    { label: 'INVENTORY & ASSETS', items: [
      { id: 'inventoryView', name: 'View Inventory' },
      { id: 'inventoryEdit', name: 'Adjust Stock / POs' },
      { id: 'assetsView', name: 'View Asset Configs' },
      { id: 'assetsEdit', name: 'Edit Configurations' },
    ]},
    { label: 'MONITORING', items: [
      { id: 'monitoringView', name: 'View Network & Cameras' },
      { id: 'monitoringEdit', name: 'Manage Devices & Alerts' },
    ]},
    { label: 'ADMIN', items: [
      { id: 'adminView', name: 'View Team & Settings' },
      { id: 'adminEdit', name: 'Edit Users & Roles' },
      { id: 'approvals', name: 'Approve Expenses & POs' },
      { id: 'reportsView', name: 'View Reports & BI' },
    ]},
  ];

  const rolePresets = {
    'Technician': { portalAccess: false, techAppAccess: true, dispatchView: true, dispatchEdit: false, financeView: false, financeEdit: false, crmView: false, crmEdit: false, proposalsView: false, proposalsEdit: false, inventoryView: true, inventoryEdit: false, assetsView: true, assetsEdit: true, monitoringView: true, monitoringEdit: false, adminView: false, adminEdit: false, approvals: false, reportsView: false },
    'Lead Technician': { portalAccess: true, techAppAccess: true, dispatchView: true, dispatchEdit: true, financeView: false, financeEdit: false, crmView: true, crmEdit: false, proposalsView: true, proposalsEdit: false, inventoryView: true, inventoryEdit: true, assetsView: true, assetsEdit: true, monitoringView: true, monitoringEdit: true, adminView: false, adminEdit: false, approvals: false, reportsView: true },
    'Sales Rep': { portalAccess: true, techAppAccess: false, dispatchView: true, dispatchEdit: false, financeView: true, financeEdit: false, crmView: true, crmEdit: true, proposalsView: true, proposalsEdit: true, inventoryView: true, inventoryEdit: false, assetsView: false, assetsEdit: false, monitoringView: false, monitoringEdit: false, adminView: false, adminEdit: false, approvals: false, reportsView: true },
    'Office Admin': { portalAccess: true, techAppAccess: false, dispatchView: true, dispatchEdit: true, financeView: true, financeEdit: true, crmView: true, crmEdit: true, proposalsView: true, proposalsEdit: true, inventoryView: true, inventoryEdit: true, assetsView: true, assetsEdit: false, monitoringView: true, monitoringEdit: false, adminView: true, adminEdit: false, approvals: true, reportsView: true },
    'Manager': { portalAccess: true, techAppAccess: true, dispatchView: true, dispatchEdit: true, financeView: true, financeEdit: true, crmView: true, crmEdit: true, proposalsView: true, proposalsEdit: true, inventoryView: true, inventoryEdit: true, assetsView: true, assetsEdit: true, monitoringView: true, monitoringEdit: true, adminView: true, adminEdit: true, approvals: true, reportsView: true },
  };

  const applyPreset = (role) => {
    const preset = rolePresets[role];
    if (preset) setEmp(prev => ({ ...prev, role, ...preset }));
    else update('role', role);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 640, maxHeight: '85vh', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', animation: 'fade-up 0.2s ease both', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Add Employee</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Step {step + 1}: {steps[step]}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', padding: '8px 24px', gap: 2, borderBottom: '1px solid var(--border-subtle)' }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, padding: '5px 4px', fontSize: 10, fontWeight: step === i ? 600 : 400,
              background: step === i ? 'rgba(63,169,245,0.1)' : i < step ? 'rgba(52,211,153,0.04)' : 'transparent',
              border: 'none', borderBottom: step === i ? '2px solid var(--brand)' : '2px solid transparent',
              color: step === i ? 'var(--brand)' : i < step ? 'var(--status-ok)' : 'var(--text-low)',
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{i < step ? '✓ ' : ''}{s}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>First Name</label><input value={emp.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" style={inputStyle} autoFocus /></div>
              <div><label style={labelStyle}>Last Name</label><input value={emp.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Smith" style={inputStyle} /></div>
              <div><label style={labelStyle}>Work Email</label><input value={emp.email} onChange={e => update('email', e.target.value)} placeholder="jsmith@shieldtech.com" type="email" style={inputStyle} /></div>
              <div><label style={labelStyle}>Phone</label><input value={emp.phone} onChange={e => update('phone', e.target.value)} placeholder="(215) 555-0100" style={inputStyle} /></div>
              <div><label style={labelStyle}>Department</label>
                <select value={emp.dept} onChange={e => update('dept', e.target.value)} style={inputStyle}>
                  {['Field Ops','Sales','Admin','Finance','Engineering'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Start Date</label><input type="date" value={emp.startDate} onChange={e => update('startDate', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Reporting Manager</label>
                <select value={emp.reportTo} onChange={e => update('reportTo', e.target.value)} style={inputStyle}>
                  <option value="">— Select manager —</option>
                  {team.map(m => <option key={m.id || m.name} value={m.name}>{m.name}{m.role ? ` · ${m.role}` : ''}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Role & Pay */}
          {step === 1 && (
            <div>
              <label style={labelStyle}>Role</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {['Technician','Lead Technician','Fire Alarm Specialist','Sales Rep','Office Admin','Manager','Custom'].map(r => (
                  <button key={r} onClick={() => applyPreset(r)} style={{
                    padding: '6px 14px', borderRadius: 5, fontSize: 11,
                    background: emp.role === r ? 'rgba(63,169,245,0.12)' : 'transparent',
                    border: `1px solid ${emp.role === r ? 'var(--brand)' : 'var(--border-subtle)'}`,
                    color: emp.role === r ? 'var(--brand)' : 'var(--text-mid)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>{r}</button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 16, padding: '6px 10px', borderRadius: 4, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)' }}>
                Selecting a role preset auto-configures app privileges. You can customize them in the next step.
              </div>

              <label style={labelStyle}>Pay Type</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {['hourly','salary','1099'].map(p => (
                  <button key={p} onClick={() => update('payType', p)} style={{
                    flex: 1, padding: '7px', borderRadius: 5, fontSize: 11, textTransform: 'capitalize',
                    background: emp.payType === p ? 'rgba(63,169,245,0.12)' : 'transparent',
                    border: `1px solid ${emp.payType === p ? 'var(--brand)' : 'var(--border-subtle)'}`,
                    color: emp.payType === p ? 'var(--brand)' : 'var(--text-mid)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>{p}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>{emp.payType === 'salary' ? 'Annual Salary' : 'Hourly Rate'}</label><input value={emp.payRate} onChange={e => update('payRate', e.target.value)} placeholder={emp.payType === 'salary' ? '65,000' : '35.00'} style={inputStyle} /></div>
                {emp.payType === 'hourly' && <div><label style={labelStyle}>Overtime Rate</label><input value={emp.overtimeRate} onChange={e => update('overtimeRate', e.target.value)} placeholder="52.50" style={inputStyle} /></div>}
              </div>
            </div>
          )}

          {/* Step 2: App Privileges */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 12 }}>Configure exactly what this employee can see and do. Preset from role: <strong>{emp.role}</strong></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {privilegeGroups.map(group => (
                  <div key={group.label}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{group.label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {group.items.map(item => (
                        <div key={item.id} onClick={() => update(item.id, !emp[item.id])} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                          background: emp[item.id] ? 'rgba(63,169,245,0.04)' : 'transparent',
                          border: `1px solid ${emp[item.id] ? 'rgba(63,169,245,0.1)' : 'var(--border-subtle)'}`
                        }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                            background: emp[item.id] ? 'var(--brand)' : 'transparent',
                            border: `1.5px solid ${emp[item.id] ? 'var(--brand)' : 'var(--border-subtle)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {emp[item.id] && <Icon name="check" size={10} color="#fff" />}
                          </div>
                          <span style={{ fontSize: 12, color: emp[item.id] ? 'var(--text-high)' : 'var(--text-mid)' }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 12 }}>Upload employment documents, certifications, licenses, and ID for their records.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'W-4 / Tax Form', icon: 'proposals', required: true },
                  { label: 'I-9 Verification', icon: 'compliance', required: true },
                  { label: 'Direct Deposit Form', icon: 'finance', required: false },
                  { label: 'Driver License', icon: 'credential', required: true },
                  { label: 'Background Check', icon: 'eye', required: true },
                  { label: 'Drug Test Results', icon: 'compliance', required: false },
                  { label: 'NICET Certification', icon: 'certs', required: false },
                  { label: 'State Alarm License', icon: 'certs', required: false },
                  { label: 'Vendor Certifications', icon: 'certs', required: false },
                  { label: 'Signed Handbook', icon: 'contracts', required: true },
                  { label: 'NDA / Non-Compete', icon: 'contracts', required: false },
                  { label: 'Emergency Contact', icon: 'phone', required: true },
                ].map((doc, i) => {
                  const uploaded = emp.documents.includes(doc.label);
                  return (
                    <label key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                      background: uploaded ? 'rgba(52,211,153,0.04)' : 'transparent',
                      border: `1px solid ${uploaded ? 'rgba(52,211,153,0.15)' : doc.required ? 'rgba(251,191,36,0.15)' : 'var(--border-subtle)'}`
                    }}>
                      <input type="file" accept="image/*,application/pdf,.doc,.docx,.txt" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) uploadDoc(doc.label, f); }} />
                      <Icon name={doc.icon} size={14} color={uploaded ? 'var(--status-ok)' : 'var(--text-low)'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: uploaded ? 'var(--status-ok)' : 'var(--text-high)', fontWeight: uploaded ? 500 : 400 }}>{uploaded ? '✓ ' : ''}{doc.label}</div>
                        {doc.required && !uploaded && <div style={{ fontSize: 8, color: 'var(--status-warn)' }}>Required</div>}
                      </div>
                      <span style={{ fontSize: 9, color: uploaded ? 'var(--status-ok)' : 'var(--brand)' }}>{uploaded ? 'Uploaded' : 'Upload'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Send Invite */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(63,169,245,0.1)', border: '1px solid rgba(63,169,245,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="employees" size={28} color="var(--brand)" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{emp.firstName} {emp.lastName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 4 }}>{emp.role} · {emp.dept}</div>
              <div style={{ fontSize: 12, color: 'var(--text-low)', marginBottom: 20 }}>{emp.email || 'No email provided'}</div>

              <GlassPanel style={{ textAlign: 'left', marginBottom: 12, padding: 14 }}>
                <div className="label-sm" style={{ marginBottom: 8 }}>INVITE SUMMARY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Portal Access: <strong style={{ color: emp.portalAccess ? 'var(--status-ok)' : 'var(--text-low)' }}>{emp.portalAccess ? 'Yes' : 'No'}</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Tech App: <strong style={{ color: emp.techAppAccess ? 'var(--status-ok)' : 'var(--text-low)' }}>{emp.techAppAccess ? 'Yes' : 'No'}</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Documents: <strong>{emp.documents.length} uploaded</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Pay: <strong>{emp.payType} {emp.payRate ? `$${emp.payRate}` : '—'}</strong></div>
                </div>
              </GlassPanel>

              {!result ? (<>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>
                  Creating this member sends an invite to <strong>{emp.email || '(enter email)'}</strong> — a temporary password by email (they set their own on first login).
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button disabled={busy} onClick={sendInvite} style={{ padding: '10px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="export" size={14} color="#fff" /> {busy ? 'Creating…' : 'Create & Send Invite'}
                  </button>
                </div>
              </>) : (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-ok)', marginBottom: 8 }}>✓ {result.email} added to the team</div>
                  {result.emailed
                    ? <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Invite emailed with a temporary password.</div>
                    : <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Give them this temporary password (email isn't configured):<br/><span className="mono" style={{ display: 'inline-block', marginTop: 8, padding: '6px 12px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 13 }}>{result.temp_password}</span></div>}
                  <button onClick={onClose} style={{ marginTop: 16, padding: '9px 22px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Done</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < 4 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{step > 0 ? 'Back' : 'Cancel'}</button>
            <div style={{ display: 'flex', gap: 6 }}>
              {step > 0 && step < 4 && <button onClick={() => setStep(step + 1)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Skip</button>}
              <button onClick={() => setStep(step + 1)} style={{ padding: '8px 24px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Contract Management ── */
function ContractsScreen() {
  const contracts = [
    { id: 'CT-2024-001', customer: 'Acme Dental Group', type: 'RMR', value: '$2,400/mo', term: '36 months', start: 'Jan 2024', end: 'Dec 2026', status: 'active', renewsIn: 185, autoRenew: true },
    { id: 'CT-2024-003', customer: 'Metro Bank Corp', type: 'RMR', value: '$4,800/mo', term: '24 months', start: 'Mar 2024', end: 'Feb 2026', status: 'expiring', renewsIn: 28, autoRenew: false },
    { id: 'CT-2024-005', customer: 'Riverside Medical', type: 'RMR', value: '$2,800/mo', term: '36 months', start: 'Jun 2024', end: 'May 2027', status: 'active', renewsIn: 360, autoRenew: true },
    { id: 'CT-2023-012', customer: 'City Hall', type: 'Government', value: '$3,200/mo', term: '12 months', start: 'Jul 2025', end: 'Jun 2026', status: 'expiring', renewsIn: 25, autoRenew: false },
    { id: 'CT-2024-008', customer: 'Westfield Mall', type: 'RMR', value: '$5,200/mo', term: '24 months', start: 'Sep 2024', end: 'Aug 2026', status: 'active', renewsIn: 88, autoRenew: true },
    { id: 'CT-2024-010', customer: 'Harbor View Condos', type: 'HOA', value: '$1,800/mo', term: '12 months', start: 'Jan 2025', end: 'Dec 2025', status: 'active', renewsIn: 210, autoRenew: false },
  ];

  const totalMRR = contracts.filter(c => c.status !== 'expired').reduce((s, c) => s + parseFloat(c.value.replace(/[^0-9.]/g, '')), 0);
  const expiringSoon = contracts.filter(c => c.renewsIn < 60);

  const openContract = (c) => shieldModal({
    kind: 'detail', title: c.customer, subtitle: `${c.id} · ${c.type} · ${c.value}`,
    badge: { status: c.status === 'active' ? 'online' : c.status === 'expiring' ? 'warning' : 'offline', label: c.status },
    headline: c.renewsIn < 60 ? `Renews in ${c.renewsIn} days — ${c.autoRenew ? 'set to auto-renew.' : 'no auto-renew, action needed.'}` : `Active through ${c.end}.`,
    sections: [
      { label: 'Contract Terms', rows: [
        { k: 'Contract ID', v: c.id }, { k: 'Type', v: c.type, mono: false },
        { k: 'Value', v: c.value }, { k: 'Term', v: c.term, mono: false },
        { k: 'Start', v: c.start, mono: false }, { k: 'End', v: c.end, mono: false },
        { k: 'Renews In', v: c.renewsIn + ' days', color: c.renewsIn < 30 ? 'var(--status-critical)' : c.renewsIn < 60 ? 'var(--status-warn)' : 'var(--text-high)' },
        { k: 'Auto-Renew', v: c.autoRenew ? 'Yes' : 'No', mono: false, color: c.autoRenew ? 'var(--status-ok)' : 'var(--text-low)' },
      ]},
    ],
    actions: [
      { label: 'View PDF', onClick: () => shieldToast('Opening ' + c.id + '.pdf', 'info'), close: true },
      { label: c.status === 'expiring' ? 'Send Renewal' : 'Edit Contract', primary: true, successMsg: c.status === 'expiring' ? 'Renewal sent to ' + c.customer : 'Contract updated', onClick: () => {} },
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="ACTIVE CONTRACTS" value={contracts.filter(c => c.status === 'active').length} delay={0} />
        <StatCard label="TOTAL MRR" value={`$${(totalMRR/1000).toFixed(1)}K`} mono={false} delay={80} />
        <StatCard label="EXPIRING <60D" value={expiringSoon.length} delay={160} />
        <StatCard label="AVG CONTRACT" value="24 mo" mono={false} delay={240} />
      </div>

      {/* Expiring alert */}
      {expiringSoon.length > 0 && (
        <div className="glass" style={{ padding: '10px 16px', borderLeft: '3px solid var(--status-warn)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusDot status="warning" size={6} />
          <span style={{ fontSize: 12, color: 'var(--text-high)' }}><strong>{expiringSoon.length} contract{expiringSoon.length > 1 ? 's' : ''}</strong> expiring within 60 days — total at-risk MRR: <span className="mono" style={{ color: 'var(--status-warn)' }}>${(expiringSoon.reduce((s,c) => s + parseFloat(c.value.replace(/[^0-9.]/g,'')),0)/1000).toFixed(1)}K/mo</span></span>
        </div>
      )}

      <GlassPanel style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Contract','Customer','Type','Value','Term','Expires','Auto-Renew','Status'].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.map((c, i) => (
              <tr key={i} onClick={() => openContract(c)} style={{ transition: 'background 0.15s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--brand)' }}>{c.id}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500 }}>{c.customer}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{c.type}</td>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500 }}>{c.value}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{c.term}</td>
                <td className="mono" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: c.renewsIn < 30 ? 'var(--status-critical)' : c.renewsIn < 60 ? 'var(--status-warn)' : 'var(--text-mid)' }}>{c.end} ({c.renewsIn}d)</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <span style={{ fontSize: 12, color: c.autoRenew ? 'var(--status-ok)' : 'var(--text-low)' }}>{c.autoRenew ? '✓ Yes' : '— No'}</span>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <StatusBadge status={c.status === 'active' ? 'online' : c.status === 'expiring' ? 'warning' : 'offline'} label={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

/* ── SLA Dashboard ── */
function SLAScreen() {
  const slas = [
    { metric: 'Emergency Response Time', target: '<1 hour', actual: '42 min', score: 98, status: 'ok' },
    { metric: 'Standard Response Time', target: '<4 hours', actual: '2.8 hours', score: 94, status: 'ok' },
    { metric: 'System Uptime', target: '99.5%', actual: '99.7%', score: 100, status: 'ok' },
    { metric: 'First-Time Fix Rate', target: '>85%', actual: '87%', score: 92, status: 'ok' },
    { metric: 'Monitoring Availability', target: '99.9%', actual: '99.95%', score: 100, status: 'ok' },
    { metric: 'Ticket Resolution (P1)', target: '<4 hours', actual: '3.1 hours', score: 88, status: 'warn' },
    { metric: 'Ticket Resolution (P2)', target: '<24 hours', actual: '18.4 hours', score: 90, status: 'ok' },
    { metric: 'Preventive Maintenance', target: 'Quarterly', actual: 'On schedule', score: 100, status: 'ok' },
  ];

  const avgScore = Math.round(slas.reduce((s, sl) => s + sl.score, 0) / slas.length);

  const openSLA = (sl) => shieldModal({
    kind: 'detail', title: sl.metric, subtitle: `Target ${sl.target} · Actual ${sl.actual}`,
    meter: { value: sl.score, label: 'score' },
    badge: { status: sl.status === 'ok' ? 'online' : 'warning', label: sl.status === 'ok' ? 'Meeting SLA' : 'At risk' },
    headline: sl.status === 'ok' ? 'Currently exceeding the agreed service level.' : 'Trending close to the SLA threshold — monitor closely.',
    sections: [
      { label: 'Performance', rows: [
        { k: 'Target', v: sl.target, mono: false }, { k: 'Actual', v: sl.actual, mono: false },
        { k: 'Score', v: sl.score + ' / 100', color: sl.score >= 95 ? 'var(--status-ok)' : sl.score >= 85 ? 'var(--status-warn)' : 'var(--status-critical)' },
        { k: 'Status', v: sl.status === 'ok' ? 'Met' : 'Watch', mono: false },
      ]},
      { label: 'Trailing 6 Months', meters: ['Jan','Feb','Mar','Apr','May','Jun'].map((m, mi) => ({ label: m, value: Math.max(70, Math.min(100, sl.score + (mi - 3) * 2)), max: 100 })) },
    ],
    actions: [
      { label: 'Export Report', onClick: () => shieldToast('SLA report exported: ' + sl.metric, 'ok'), close: true },
      { label: 'View Breaches', primary: true, successMsg: 'No active breaches for ' + sl.metric, onClick: () => {} },
    ],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        <GlassPanel style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
          <div className="label-sm" style={{ marginBottom: 12 }}>OVERALL SLA SCORE</div>
          <HealthRing value={avgScore} size={120} strokeWidth={8} label="composite" />
          <div style={{ marginTop: 12, fontSize: 12, color: avgScore >= 95 ? 'var(--status-ok)' : 'var(--status-warn)' }}>
            {avgScore >= 95 ? 'All SLAs Met' : 'Attention Needed'}
          </div>
        </GlassPanel>
        <GlassPanel style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['SLA Metric','Target','Actual','Score','Status'].map((h, i) => (
                  <th key={i} style={{ textAlign: i > 1 ? 'right' : 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slas.map((sl, i) => (
                <tr key={i} onClick={() => openSLA(sl)} className="st-clickrow">
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13 }}>{sl.metric}</td>
                  <td className="mono" style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)' }}>{sl.target}</td>
                  <td className="mono" style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, textAlign: 'right', fontWeight: 500 }}>{sl.actual}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${sl.score}%`, height: '100%', borderRadius: 2, background: sl.score >= 95 ? 'var(--status-ok)' : sl.score >= 85 ? 'var(--status-warn)' : 'var(--status-critical)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: sl.score >= 95 ? 'var(--status-ok)' : sl.score >= 85 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{sl.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', textAlign: 'right' }}>
                    <StatusDot status={sl.status === 'ok' ? 'online' : 'warning'} size={6} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      </div>
    </div>
  );
}

Object.assign(window, { ExpenseApprovalScreen, TimesheetApprovalScreen, EmployeeScreen, ContractsScreen, SLAScreen });

/* ShieldTech Mobile — Native Ops Screens V (full bespoke coverage)
   Native touch layers for every remaining screen that previously rendered as a
   reflowed desktop page. Each view binds the same live data the desktop screen
   uses (QBO tables, shared stores, Supabase APIs); the complete desktop suite
   stays inline below it via the shell's full-suite section, so nothing is lost.
   Registered through the M_OPS5 map consumed by mobile-app.jsx. */

const OPS5_EMPTY = ({ children }) => <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>{children}</div>;
const ops5$ = (n) => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

/* Hero card + quick-action chips — the native top layer for tool screens whose
   full workbench renders below. Honest by design: shows real KPIs when given,
   never fabricated numbers. */
function MDeskIntro({ icon, title, blurb, chips = [], kpis, onNav }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '15px 16px', borderRadius: 14, border: '1px solid var(--border-strong)', background: 'linear-gradient(125deg, rgba(63,169,245,0.08), rgba(63,169,245,0.02))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.45, marginTop: 2 }}>{blurb}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
          {chips.map(c => (
            <button key={c.label} onClick={() => (c.onClick ? c.onClick() : onNav && onNav(c.to))} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c.label}</button>
          ))}
        </div>
      </div>
      {kpis && <OpsKpis items={kpis} />}
    </div>
  );
}

/* ══════════════ TEAM CHAT (real — __shieldChat) ══════════════ */
function MChatN({ onNav }) {
  const chat = window.__shieldChat;
  const [threads, setThreads] = React.useState(null);
  const [open, setOpen] = React.useState(null);   // threadId
  const [msgs, setMsgs] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const scroller = React.useRef(null);
  const refresh = React.useCallback(() => { chat && chat.threads().then(setThreads); }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => {
    if (!chat) return;
    return chat.subscribe((m) => {
      refresh();
      if (open && m.thread_id === open) setMsgs(prev => [...prev, m]);
    });
  }, [open, refresh]);
  React.useEffect(() => {
    if (!open || !chat) return;
    chat.list(open).then(m => { setMsgs(m); chat.markRead(open); });
  }, [open]);
  React.useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs]);
  const send = async () => {
    if (!draft.trim()) return;
    const r = await chat.send(open, draft.trim());
    if (r.ok) { setMsgs(prev => [...prev, r.data]); setDraft(''); }
    else showToast(r.error || 'Send failed', 'error');
  };
  const me = (window.__shieldUser || {}).id;
  if (!chat || !window.__shieldSupabaseConfigured) return <OPS5_EMPTY>Team chat needs the backend connection.</OPS5_EMPTY>;
  if (open) {
    const th = (threads || []).find(t => t.threadId === open);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 150px)', minHeight: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 10 }}>
          <button onClick={() => { setOpen(null); refresh(); }} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 15, cursor: 'pointer', padding: 0 }}>←</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>{(th && th.name) || 'Conversation'}</span>
        </div>
        <div ref={scroller} className="glass" style={{ flex: 1, overflowY: 'auto', borderRadius: 12, padding: '12px 12px' }}>
          {msgs.map(m => {
            const mine = m.sender_id === me;
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{ maxWidth: '82%', padding: '8px 12px', borderRadius: mine ? '13px 13px 4px 13px' : '13px 13px 13px 4px', background: mine ? 'rgba(63,169,245,0.18)' : 'rgba(148,163,184,0.1)', border: '1px solid var(--border-subtle)' }}>
                  {!mine && <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--brand)', marginBottom: 2 }}>{m.sender_name}</div>}
                  <div style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                  <div style={{ fontSize: 8.5, color: 'var(--text-low)', marginTop: 3, textAlign: 'right' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              </div>
            );
          })}
          {msgs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-low)', fontSize: 12, padding: 20 }}>No messages yet — say hello.</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message…"
            style={{ flex: 1, padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.04)', color: 'var(--text-high)', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none' }} />
          <button onClick={send} style={{ padding: '0 17px', borderRadius: 11, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>➤</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MSection title="Team chat" />
      {threads === null && <OPS5_EMPTY>Loading conversations…</OPS5_EMPTY>}
      {threads !== null && threads.length === 0 && <OPS5_EMPTY>No conversations yet. Messages from techs and staff land here.</OPS5_EMPTY>}
      {(threads || []).map(t => (
        <MRow key={t.threadId} icon="chat" title={t.name || 'Conversation'} sub={t.last}
          right={t.unread ? String(t.unread) : ''} rightSub={new Date(t.lastAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          accent={t.unread ? 'var(--brand)' : undefined} onClick={() => setOpen(t.threadId)} />
      ))}
    </div>
  );
}

/* ══════════════ INVOICES / ESTIMATES (real — merged portal+QBO) ══════════════ */
const OPS5_INV_STATUS = { paid: 'var(--status-ok)', open: 'var(--brand)', overdue: 'var(--status-critical)', draft: 'var(--text-low)', sent: 'var(--brand)' };
function MInvoicesN({ onNav }) {
  const all = useMergedInvoices();
  const [query, setQuery] = React.useState('');
  const [editing, setEditing] = React.useState(null);
  const rows = all.filter(r => docSearchMatch(query, r.num, r.customer, r.amount, r.status, (r._raw || {}).estimate_ref));
  const open = rows.filter(r => (r.status || '').toLowerCase() !== 'paid');
  const openTotal = open.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['INVOICES', rows.length, 'var(--brand)'], ['OPEN', open.length, open.length ? 'var(--status-warn)' : 'var(--status-ok)'], ['OPEN $', ops5$(openTotal), 'var(--text-high)']]} />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕ Search invoices — number, customer, amount…"
        style={{ width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
      <MSection title="Tap any invoice to edit" action="Money tab" onAction={() => onNav('finance')} />
      {rows.slice(0, 40).map((r, i) => {
        const st = (r.status || 'open').toLowerCase();
        return <MRow key={r.num || i} icon="finance" title={`${r.num} · ${r.customer}`}
          sub={`due ${r.due} · ${st}`} right={ops5$(r.amount)} accent={OPS5_INV_STATUS[st]} onClick={() => setEditing(r)} />;
      })}
      {rows.length === 0 && <OPS5_EMPTY>No invoices yet — create one from the Money tab.</OPS5_EMPTY>}
      {editing && <MDocEditor kind="invoice" doc={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
function MEstimatesN({ onNav }) {
  const all = useMergedEstimates();
  const [query, setQuery] = React.useState('');
  const [editing, setEditing] = React.useState(null);
  const rows = all.filter(r => docSearchMatch(query, r.num, r.customer, r.amount, r.status));
  const pending = rows.filter(r => !/accepted|closed|converted/i.test(r.status || ''));
  const value = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ESTIMATES', rows.length, 'var(--brand)'], ['AWAITING', pending.length, pending.length ? 'var(--status-warn)' : 'var(--status-ok)'], ['PIPELINE', ops5$(value), 'var(--text-high)']]} />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕ Search proposals — number, customer, amount…"
        style={{ width: '100%', padding: '11px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
      <MSection title="Tap any estimate to edit" action="Money tab" onAction={() => onNav('finance')} />
      {rows.slice(0, 40).map((r, i) => (
        <MRow key={r.num || i} icon="proposals" title={`${r.num} · ${r.customer}`}
          sub={`${r.date} · ${r.status || 'pending'}`} right={ops5$(r.amount)}
          accent={/accepted/i.test(r.status || '') ? 'var(--status-ok)' : undefined} onClick={() => setEditing(r)} />
      ))}
      {rows.length === 0 && <OPS5_EMPTY>No estimates yet — the Money tab creates and emails them.</OPS5_EMPTY>}
      {editing && <MDocEditor kind="estimate" doc={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/* ══════════════ TIMESHEET APPROVALS (real — __shieldTime) ══════════════ */
function MTimesheetsN() {
  const [rows, setRows] = React.useState(null);
  const [busy, setBusy] = React.useState({});
  const load = React.useCallback(() => {
    const t = window.__shieldTime;
    if (!t) return setRows([]);
    t.pendingEntries().then(r => setRows(r.ok ? r.data : []));
  }, []);
  React.useEffect(() => { load(); }, [load]);
  const act = async (id, status) => {
    setBusy(b => ({ ...b, [id]: true }));
    const r = await window.__shieldTime.setEntryStatus(id, status);
    setBusy(b => ({ ...b, [id]: false }));
    if (r.ok) { showToast(status === 'approved' ? 'Hours approved' : 'Entry rejected', 'ok'); load(); }
    else showToast(r.error || 'Update failed', 'error');
  };
  const totalH = (rows || []).reduce((s, e) => s + (Number(e.hours) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['PENDING', (rows || []).length, (rows || []).length ? 'var(--status-warn)' : 'var(--status-ok)'], ['HOURS', totalH.toFixed(1), 'var(--brand)']]} />
      {rows === null && <OPS5_EMPTY>Loading submitted hours…</OPS5_EMPTY>}
      {rows !== null && rows.length === 0 && <OPS5_EMPTY>Inbox zero — no hours waiting for approval.</OPS5_EMPTY>}
      {(rows || []).map(e => (
        <div key={e.id} className="glass" style={{ padding: '12px 13px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{(e.tech && (e.tech.name || e.tech.email)) || 'Tech'}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{e.hours}h</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', margin: '3px 0 9px' }}>{e.work_date}{e.job_ref ? ` · ${e.job_ref}` : ''}{e.notes ? ` · ${e.notes}` : ''}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={busy[e.id]} onClick={() => act(e.id, 'approved')} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: 'rgba(52,211,153,0.14)', color: 'var(--status-ok)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>
            <button disabled={busy[e.id]} onClick={() => act(e.id, 'rejected')} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--status-critical)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════ EMPLOYEES (real — QBO payroll mirror) ══════════════ */
function MEmployeesN({ onNav }) {
  const [emps, setEmps] = React.useState(null);
  React.useEffect(() => {
    const q = window.__shieldQBO;
    if (!q) return setEmps([]);
    q.employees().then(r => setEmps(r.ok ? r.data : []));
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['EMPLOYEES', (emps || []).length, 'var(--brand)'], ['SOURCE', 'QuickBooks', 'var(--text-mid)']]} />
      {emps === null && <OPS5_EMPTY>Loading team…</OPS5_EMPTY>}
      {(emps || []).map((e, i) => (
        <MRow key={e.qbo_id || i} icon="employees" title={e.name || e.display_name || 'Employee'}
          sub={[e.title, e.email, e.phone].filter(Boolean).join(' · ')} onClick={() => onNav('timesheets')} rightSub={e.active === false ? 'inactive' : ''} />
      ))}
      {emps !== null && emps.length === 0 && <OPS5_EMPTY>No employees synced yet — connect QuickBooks payroll to populate the roster.</OPS5_EMPTY>}
    </div>
  );
}

/* ══════════════ PRICEBOOK + PRODUCT LIBRARY (real — qbo_items) ══════════════ */
function MItemsList({ onNav, title }) {
  const [items, setItems] = React.useState(null);
  const [q, setQ] = React.useState('');
  React.useEffect(() => {
    const api = window.__shieldQBO;
    if (!api) return setItems([]);
    api.items().then(r => setItems(r.ok ? r.data : []));
  }, []);
  const list = (items || []).filter(i => (i.name || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ITEMS', (items || []).length, 'var(--brand)'], ['SHOWN', list.length, 'var(--text-mid)']]} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${title}…`}
        style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.04)', color: 'var(--text-high)', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none' }} />
      {items === null && <OPS5_EMPTY>Loading pricebook…</OPS5_EMPTY>}
      {list.slice(0, 40).map((i, ix) => (
        <MRow key={i.qbo_id || ix} icon="product-library" title={i.name} sub={i.description || i.type || ''} right={ops5$(i.unit_price)} />
      ))}
      {items !== null && list.length === 0 && <OPS5_EMPTY>{items.length === 0 ? 'No items yet — sync QuickBooks products & services.' : 'Nothing matches that search.'}</OPS5_EMPTY>}
    </div>
  );
}
function MPricebookN({ onNav }) { return <MItemsList onNav={onNav} title="pricebook" />; }
function MProductLibraryN({ onNav }) { return <MItemsList onNav={onNav} title="products" />; }

/* ══════════════ DOCUMENTS (real — __shieldStorage) ══════════════ */
function MDocumentsN() {
  const [docs, setDocs] = React.useState(null);
  const fileRef = React.useRef(null);
  const load = React.useCallback(() => {
    const s = window.__shieldStorage;
    if (!s) return setDocs([]);
    s.listAttachments().then(setDocs).catch(() => setDocs([]));
  }, []);
  React.useEffect(() => { load(); }, [load]);
  const upload = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    showToast('Uploading…', 'info');
    const r = await window.__shieldStorage.uploadFile(f, { folder: 'mobile' });
    if (r.ok) { showToast(`Uploaded ${f.name}`, 'ok'); load(); } else showToast(r.error || 'Upload failed', 'error');
    e.target.value = '';
  };
  const fmtSize = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((b || 0) / 1024)) + ' KB';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['FILES', (docs || []).length, 'var(--brand)']]} />
      <button onClick={() => fileRef.current && fileRef.current.click()} style={{ padding: '12px 0', borderRadius: 11, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⭱ Upload a file</button>
      <input ref={fileRef} type="file" onChange={upload} style={{ display: 'none' }} />
      {docs === null && <OPS5_EMPTY>Loading documents…</OPS5_EMPTY>}
      {(docs || []).map(d => (
        <MRow key={d.id} icon="documents" title={d.name} sub={`${d.mime || ''} · ${fmtSize(d.size)}`}
          onClick={d.url ? () => (window.__shieldStorage ? window.__shieldStorage.openFile(d.url) : window.open(d.url, '_blank')) : undefined} rightSub={d.created_at ? new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''} />
      ))}
      {docs !== null && docs.length === 0 && <OPS5_EMPTY>No documents yet — photos, PDFs and files you upload live here, synced company-wide.</OPS5_EMPTY>}
    </div>
  );
}

/* ══════════════ USERS & INVITES (real — profiles) ══════════════ */
const OPS5_ROLE_C = { Admin: 'var(--status-critical)', Staff: 'var(--brand)', Technician: 'var(--status-ok)', Sales: '#FBBF24', Customer: 'var(--text-low)' };
/* Full native user console — invite (role-aware emails), role/app-rights
   management, reset/resend/remove. Same backend as desktop (invite-user +
   manage-user edge functions + profiles RLS). */
const M_ROLE_RIGHTS = {
  Admin: { portal: true, tech: true, customer: false, sales: true },
  Staff: { portal: true, tech: true, customer: false, sales: true },
  Technician: { portal: false, tech: true, customer: false, sales: false },
  Sales: { portal: false, tech: false, customer: false, sales: true },
  Client: { portal: false, tech: false, customer: true, sales: false },
};
const M_APPS = [['portal', 'Portal'], ['tech', 'Tech App'], ['sales', 'Sales'], ['customer', 'Customer']];

function MUsersN({ onNav }) {
  const sb = window.__shieldSupabase;
  const selfId = (window.__shieldUser && window.__shieldUser.id) || null;
  const [rows, setRows] = React.useState(null);
  const [inviting, setInviting] = React.useState(false);
  const [manage, setManage] = React.useState(null);   // profile row being managed
  const [f, setF] = React.useState({ email: '', name: '', role: 'Technician' });
  const [busy, setBusy] = React.useState('');
  const [result, setResult] = React.useState(null);

  const load = React.useCallback(() => {
    if (!sb) return setRows([]);
    sb.from('profiles').select('id,email,name,role,app_rights,must_change_password,created_at')
      .order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!sb) { showToast('Backend not configured', 'warn'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) { showToast('Enter a valid email', 'warn'); return; }
    setBusy('invite'); setResult(null);
    const { data, error } = await sb.functions.invoke('invite-user', {
      body: { email: f.email.trim(), name: f.name.trim(), role: f.role, app_rights: M_ROLE_RIGHTS[f.role] },
    });
    setBusy('');
    if (error || !data || !data.ok) { showToast((data && data.error) || (error && error.message) || 'Invite failed', 'error'); return; }
    setResult(data.data);
    showToast(data.data.emailed
      ? (f.role === 'Technician' ? `Tech App invite emailed to ${data.data.email}` : `Invite emailed to ${data.data.email}`)
      : 'User created — hand over the temporary password shown', 'ok');
    setF({ email: '', name: '', role: 'Technician' });
    if (data.data.emailed) setInviting(false);
    load();
  };

  const callManage = async (action, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    const { data, error } = await sb.functions.invoke('manage-user', { body: { action, userId: manage.id } });
    setBusy('');
    if (error || !data || !data.ok) { showToast((data && data.error) || (error && error.message) || 'Action failed', 'error'); return; }
    if (action === 'remove') { showToast(`Removed ${manage.email}`, 'ok'); setManage(null); load(); return; }
    showToast(data.data.emailed ? `New temporary password emailed to ${manage.email}` : `Temp password: ${data.data.temp_password}`, 'ok');
    load();
  };

  const saveManage = async () => {
    setBusy('save');
    const { error } = await sb.from('profiles')
      .update({ role: manage.role, app_rights: manage.app_rights })
      .eq('id', manage.id);
    setBusy('');
    if (error) { showToast(error.message, 'error'); return; }
    showToast(`Updated ${manage.email}`, 'ok'); setManage(null); load();
  };

  const inp = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-high)', fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none' };
  const lbl = { fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['USERS', (rows || []).length, 'var(--brand)'], ['ADMINS', (rows || []).filter(r => r.role === 'Admin').length, 'var(--status-critical)'], ['TECHS', (rows || []).filter(r => r.role === 'Technician').length, 'var(--status-ok)']]} />
      <button onClick={() => { setInviting(true); setResult(null); }} style={{ padding: '13px 0', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Invite a user</button>
      {result && result.temp_password && (
        <div className="glass" style={{ padding: '12px 14px', borderRadius: 11, borderLeft: '3px solid var(--status-warn)', fontSize: 12, color: 'var(--text-high)' }}>
          Email didn't send — share these once: <span className="mono">{result.email}</span> · <span className="mono" style={{ color: 'var(--status-warn)', fontWeight: 700 }}>{result.temp_password}</span>
        </div>
      )}
      {rows === null && <OPS5_EMPTY>Loading users…</OPS5_EMPTY>}
      {(rows || []).map(u => (
        <MRow key={u.id} icon="users" title={(u.name || u.email) + (u.id === selfId ? ' (you)' : '')} sub={`${u.email}${u.must_change_password ? ' · temp pw' : ''}`}
          right={<MBadge color={OPS5_ROLE_C[u.role] || 'var(--brand)'}>{u.role || 'Staff'}</MBadge>}
          onClick={() => setManage({ ...u, app_rights: { ...(u.app_rights || {}) } })} />
      ))}
      {rows !== null && rows.length === 0 && <OPS5_EMPTY>No user profiles visible.</OPS5_EMPTY>}

      {/* Invite sheet */}
      {inviting && (
        <MSheet title="Invite a user" onClose={() => setInviting(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><span style={lbl}>Email</span><input value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="person@example.com" inputMode="email" autoCapitalize="none" style={inp} /></div>
            <div><span style={lbl}>Name</span><input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Full name" style={inp} /></div>
            <div><span style={lbl}>Role</span><MSegment options={['Technician', 'Sales', 'Staff', 'Admin', 'Client']} value={f.role} onChange={v => setF(p => ({ ...p, role: v }))} /></div>
            <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.6, padding: '2px 2px 0' }}>
              {f.role === 'Technician'
                ? <>They'll get one email with their sign-in and a single link to <b style={{ color: 'var(--brand)' }}>tech.shieldtechsolutions.com</b> — you administer any further access here.</>
                : f.role === 'Sales'
                ? <>They'll get one email with their sign-in and a single link to the <b style={{ color: 'var(--brand)' }}>Sales CRM app</b> — nothing else; you administer any further access here.</>
                : <>They'll get a branded email with a temporary password ({M_APPS.filter(([id]) => M_ROLE_RIGHTS[f.role][id]).map(([, l]) => l).join(' + ') || 'no apps'} access).</>}
            </div>
            <button disabled={busy === 'invite'} onClick={invite} style={{ padding: '13px 0', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: busy === 'invite' ? 0.6 : 1 }}>{busy === 'invite' ? 'Inviting…' : 'Send invite'}</button>
          </div>
        </MSheet>
      )}

      {/* Manage sheet */}
      {manage && (
        <MSheet title={manage.name || manage.email} onClose={() => setManage(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-low)' }}>{manage.email}</div>
            <div><span style={lbl}>Role</span><MSegment options={['Technician', 'Sales', 'Staff', 'Admin', 'Client']} value={manage.role} onChange={v => setManage(m => ({ ...m, role: v, app_rights: { ...M_ROLE_RIGHTS[v] } }))} /></div>
            <div>
              <span style={lbl}>App access</span>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '4px 2px' }}>
                {M_APPS.map(([id, label]) => (
                  <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-high)' }}>
                    <input type="checkbox" checked={!!(manage.app_rights && manage.app_rights[id])} onChange={e => setManage(m => ({ ...m, app_rights: { ...m.app_rights, [id]: e.target.checked } }))} style={{ accentColor: 'var(--brand)', width: 17, height: 17 }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button disabled={busy === 'save'} onClick={saveManage} style={{ padding: '12px 0', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: busy === 'save' ? 0.6 : 1 }}>Save changes</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={!!busy} onClick={() => callManage('resend')} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.06)', color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Resend invite</button>
              <button disabled={!!busy} onClick={() => callManage('reset', `Reset password for ${manage.email}?`)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reset password</button>
            </div>
            {manage.id !== selfId && (
              <button disabled={!!busy} onClick={() => callManage('remove', `Remove ${manage.email}? They lose all access immediately.`)} style={{ padding: '11px 0', borderRadius: 10, border: '1px solid rgba(244,63,94,0.25)', background: 'transparent', color: 'var(--status-critical)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Remove user</button>
            )}
          </div>
        </MSheet>
      )}
    </div>
  );
}

/* ══════════════ OUTBOX (real — acceptances + sent proposals) ══════════════ */
function MOutboxN({ onNav }) {
  const [acc, setAcc] = React.useState(null);
  const [sentBids, setSentBids] = React.useState([]);
  React.useEffect(() => {
    const a = window.__shieldAcceptance;
    if (a) a.list().then(r => setAcc(r.ok ? r.data : [])); else setAcc([]);
    const b = window.__shieldBids;
    if (b) b.list().then(r => r.ok && setSentBids(r.data.filter(o => o.bid && o.bid.sent_at)));
  }, []);
  const stC = (s) => s === 'accepted' ? 'var(--status-ok)' : s === 'declined' ? 'var(--status-critical)' : 'var(--status-warn)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACCEPT LINKS', (acc || []).length, 'var(--brand)'], ['PROPOSALS SENT', sentBids.length, 'var(--text-high)']]} />
      <MSection title="Estimate accept links" />
      {acc === null && <OPS5_EMPTY>Loading outbox…</OPS5_EMPTY>}
      {(acc || []).map(a => (
        <MRow key={a.id} icon="outbox" title={`${a.estimate_ref || 'Estimate'} · ${a.customer_name || ''}`}
          sub={`${a.customer_email || ''} · sent ${a.sent_at ? new Date(a.sent_at).toLocaleDateString() : ''}`}
          right={ops5$(a.amount)} rightSub={a.status || 'sent'} accent={stC(a.status)} onClick={() => onNav('finance')} />
      ))}
      {acc !== null && acc.length === 0 && <OPS5_EMPTY>Nothing sent yet — estimate accept links appear here with their live status.</OPS5_EMPTY>}
      {sentBids.length > 0 && <MSection title="Proposals emailed" style={{ marginTop: 4 }} />}
      {sentBids.map(o => (
        <MRow key={o.id} icon="proposals" title={o.title} sub={`to ${o.bid.sent_to || ''} · ${new Date(o.bid.sent_at).toLocaleDateString()}`} onClick={() => onNav('autobid')} />
      ))}
    </div>
  );
}

/* ══════════════ SECRET WEAPON HUB (real — leads + bids) ══════════════ */
function MSecretWeaponN({ onNav }) {
  const [stats, setStats] = React.useState(null);
  React.useEffect(() => {
    const b = window.__shieldBids;
    if (!b) return setStats({ leads: 0, ready: 0, due: null });
    b.list().then(r => {
      if (!r.ok) return setStats({ leads: 0, ready: 0, due: null });
      const ready = r.data.filter(o => o.bid && (o.bid.status === 'ready' || o.bid.status === 'proposal')).length;
      const due = r.data.filter(o => o.due_at).sort((a, x) => new Date(a.due_at) - new Date(x.due_at))[0];
      setStats({ leads: r.data.length, ready, due });
    });
  }, []);
  const s = stats || { leads: '…', ready: '…', due: null };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['LEADS', s.leads, 'var(--brand)'], ['BIDS READY', s.ready, 'var(--status-ok)']]} />
      {s.due && (
        <div className="glass" style={{ padding: '11px 13px', borderRadius: 11, borderLeft: '3px solid var(--status-warn)', fontSize: 12, color: 'var(--text-high)' }}>
          ⏳ Next due: <strong>{s.due.title}</strong> — {new Date(s.due.due_at).toLocaleDateString()}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MActionBtn label="Auto-Bid" icon="crm" primary onClick={() => onNav('autobid')} />
        <MActionBtn label="Survey Scan" icon="survey-ai" onClick={() => onNav('sitescan')} />
        <MActionBtn label="Proposals" icon="proposals" onClick={() => onNav('proposals')} />
        <MActionBtn label="Outbox" icon="outbox" onClick={() => onNav('outbox')} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center' }}>Scrapers run nightly at 4 AM ET · bids auto-build at 4:26 AM ET. The full war-room with every tab is below.</div>
    </div>
  );
}

/* ══════════════ ASSETS (real — assetStore configs) ══════════════ */
function MAssetsN({ onNav }) {
  const [configs] = useShieldStore(assetStore);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['CONFIGS', (configs || []).length, 'var(--brand)']]} />
      {(configs || []).slice(0, 20).map((c, i) => (
        <MRow key={c.id || i} icon="assets" title={c.name || c.customer || `Configuration ${i + 1}`}
          sub={[c.site, c.type, c.updated].filter(Boolean).join(' · ')} />
      ))}
      {(!configs || configs.length === 0) && <OPS5_EMPTY>No asset configurations yet — build them in the full designer below.</OPS5_EMPTY>}
    </div>
  );
}

/* ══════════════ FORECAST / HEALTH / WALLBOARD / DIGEST (real-derived) ══════════════ */
function MForecastN({ onNav }) {
  const inv = useMergedInvoices();
  const est = useMergedEstimates();
  const open = inv.filter(r => !/paid/i.test(r.status || ''));
  const openT = open.reduce((s, r) => s + (Number(r.total ?? r.amount) || 0), 0);
  const pipe = est.filter(r => !/accepted|declined/i.test(r.status || '')).reduce((s, r) => s + (Number(r.total ?? r.amount) || 0), 0);
  const won = est.filter(r => /accepted/i.test(r.status || '')).reduce((s, r) => s + (Number(r.total ?? r.amount) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="BOOKED (A/R OPEN)" value={ops5$(openT)} accent="var(--brand)" sub={`${open.length} open invoices`} />
        <MStat label="QUOTED PIPELINE" value={ops5$(pipe)} accent="var(--status-warn)" sub="estimates awaiting decision" />
        <MStat label="WON (ACCEPTED)" value={ops5$(won)} accent="var(--status-ok)" sub="accepted estimates" />
        <MStat label="TOTAL VISIBLE" value={ops5$(openT + pipe)} sub="booked + pipeline" />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center' }}>Live from your invoices & estimates. Scenario modeling is in the full forecaster below.</div>
    </div>
  );
}
function MHealthN({ onNav }) {
  const inv = useMergedInvoices();
  const byCust = {};
  inv.forEach(r => {
    const c = r.customer || r.customer_name || '—';
    byCust[c] = byCust[c] || { open: 0, overdue: 0, total: 0 };
    const amt = Number(r.total ?? r.amount) || 0;
    byCust[c].total += amt;
    if (!/paid/i.test(r.status || '')) byCust[c].open += amt;
    if (/overdue/i.test(r.status || '') || (r.due_date && new Date(r.due_date) < new Date() && !/paid/i.test(r.status || ''))) byCust[c].overdue += amt;
  });
  const rows = Object.entries(byCust).sort((a, b) => b[1].overdue - a[1].overdue || b[1].open - a[1].open).slice(0, 15);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['CUSTOMERS', rows.length, 'var(--brand)'], ['AT RISK', rows.filter(([, v]) => v.overdue > 0).length, 'var(--status-critical)']]} />
      {rows.map(([name, v]) => (
        <MRow key={name} icon="health" title={name} sub={v.overdue > 0 ? `⚠ ${ops5$(v.overdue)} overdue` : 'in good standing'}
          right={ops5$(v.open)} rightSub="open A/R" accent={v.overdue > 0 ? 'var(--status-critical)' : 'var(--status-ok)'}
          onClick={() => onNav('customers-list')} />
      ))}
      {rows.length === 0 && <OPS5_EMPTY>No billing history yet — health scores appear as invoices land.</OPS5_EMPTY>}
    </div>
  );
}
function MWallboardN({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const inv = useMergedInvoices();
  const [projects] = useShieldStore(projectStore);
  const open = inv.filter(r => !/paid/i.test(r.status || ''));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MStat label="JOBS THIS WEEK" value={(jobs || []).length} accent="var(--brand)" />
        <MStat label="ACTIVE PROJECTS" value={(projects || []).length} accent="var(--status-ok)" />
        <MStat label="OPEN INVOICES" value={open.length} accent="var(--status-warn)" />
        <MStat label="OPEN A/R" value={ops5$(open.reduce((s, r) => s + (Number(r.total ?? r.amount) || 0), 0))} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center' }}>The TV-mode rotating wallboard is below — cast it from a desktop.</div>
    </div>
  );
}
function MDigestN({ onNav }) {
  const [jobs] = useShieldStore(jobStore);
  const inv = useMergedInvoices();
  const est = useMergedEstimates();
  const today = (jobs || []).filter(j => j.day === 3);
  const overdue = inv.filter(r => /overdue/i.test(r.status || ''));
  const awaiting = est.filter(r => /await|sent|pending/i.test(r.status || ''));
  const item = (icon, text, to) => (
    <div onClick={() => onNav(to)} className="glass" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 13px', borderRadius: 11, cursor: 'pointer' }}>
      <span style={{ fontSize: 14 }}>{icon}</span><span style={{ fontSize: 12.5, color: 'var(--text-high)', flex: 1 }}>{text}</span><span style={{ color: 'var(--text-low)' }}>›</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <MSection title={`Today — ${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}`} />
      {item('🗓', `${today.length} job${today.length === 1 ? '' : 's'} on today's schedule`, 'calendar')}
      {item('💰', overdue.length ? `${overdue.length} overdue invoice${overdue.length === 1 ? '' : 's'} need chasing` : 'No overdue invoices — A/R is clean', 'finance')}
      {item('✉', awaiting.length ? `${awaiting.length} estimate${awaiting.length === 1 ? '' : 's'} awaiting customer decision` : 'No estimates waiting on customers', 'finance')}
      {item('⟡', 'Check fresh leads & AI-built bids', 'autobid')}
    </div>
  );
}

/* ══════════════ PORTAL SETTINGS + INTEGRATIONS (real prefs/status) ══════════════ */
function MPortalSettingsN({ onNav }) {
  const [prefs, setPrefs] = useShieldStore(userPrefsStore);
  const theme = (prefs && prefs.theme) || 'dark';
  const u = window.__shieldUser || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '13px 14px', borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{u.name || 'Not signed in'}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{u.email || ''} · {u.role || ''}</div>
      </div>
      <MSection title="Appearance" />
      <MSegment options={['dark', 'light', 'system']} value={theme} onChange={t => setPrefs(p => ({ ...(p || {}), theme: t }))} />
      <MSection title="Shortcuts" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <MActionBtn label="Users & invites" icon="users" onClick={() => onNav('users')} />
        <MActionBtn label="Integrations" icon="integrations" onClick={() => onNav('integrations')} />
        <MActionBtn label="Edit tab bar" icon="grid-2" onClick={() => window.__shieldEditTabs && window.__shieldEditTabs()} />
        <MActionBtn label="Branding studio" icon="studio" onClick={() => onNav('studio')} />
      </div>
    </div>
  );
}
function MIntegrationsN({ onNav }) {
  const [qboLive, setQboLive] = React.useState(null);
  const [ai, setAi] = React.useState(window.__shieldAIModel || null);
  React.useEffect(() => {
    if (window.__shieldQBO) window.__shieldQBO.hasData().then(setQboLive);
    const h = (e) => setAi(e.detail && e.detail.configured ? e.detail.model : null);
    window.addEventListener('shield:ai-status', h);
    return () => window.removeEventListener('shield:ai-status', h);
  }, []);
  const row = (name, ok, sub) => (
    <MRow icon="integrations" title={name} sub={sub}
      right={<MBadge color={ok ? 'var(--status-ok)' : 'var(--status-warn)'}>{ok ? 'Connected' : 'Not configured'}</MBadge>} />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {row('Supabase backend', !!window.__shieldSupabaseConfigured, 'Auth, database, storage, edge functions')}
      {row('QuickBooks Online', !!qboLive, 'Invoices, estimates, customers, payroll mirror')}
      {row('ShieldTech AI', !!ai, ai ? `Model: ${ai}` : 'Set OPENAI_API_KEY to enable')}
      {row('Resend email', !!window.__shieldSupabaseConfigured, 'Proposals, accept links, notifications')}
      {row('SAM.gov + bid platforms', true, 'Nightly lead scrapers · 4:00 AM ET')}
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', marginTop: 8 }}>Connection keys and sync controls are in the full console below.</div>
    </div>
  );
}

/* ══════════════ Native intro layers for the remaining desktop workbenches ══════════════ */
function MStudioN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🎨" title="Design Studio"
    blurb="Brand assets, logo treatments, marketing collateral and the site theme — the full studio canvas is below."
    chips={[{ label: 'Branding', to: 'studio', onClick: () => {} }, { label: 'Marketing', to: 'marketing' }, { label: 'Proposals', to: 'proposals' }]} />;
}
function MServicePlansN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🛡" title="Service Plans"
    blurb="Monitoring & maintenance plan tiers you sell — pricing, inclusions, and per-customer assignments live in the plan builder below."
    chips={[{ label: 'Customers', to: 'customers-list' }, { label: 'Contracts', to: 'contracts' }, { label: 'MRR', to: 'mrr' }]} />;
}
function MOnboardingN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🚀" title="Customer Onboarding"
    blurb="Kick-off checklists that walk every new account from signed contract to live service. Work the full checklist below."
    chips={[{ label: 'New customer', to: 'customers-list' }, { label: 'Projects', to: 'projects' }]} />;
}
function MServiceReportsN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="📋" title="Service Reports"
    blurb="Branded after-visit reports for customers — build and send them from the reporter below."
    chips={[{ label: 'Work orders', to: 'workorder' }, { label: 'Photos', to: 'photos' }]} />;
}
function MStatusPageN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🟢" title="Status Page"
    blurb="The public system-status page your customers see — components, uptime history and incident posts are managed below."
    chips={[{ label: 'Incidents', to: 'incidents' }, { label: 'Monitoring', to: 'cameras' }]} />;
}
function MMarketingN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="📣" title="Marketing"
    blurb="Campaigns, email blasts and lead-gen tracking — the campaign tools are below."
    chips={[{ label: 'Leads', to: 'secret-weapon' }, { label: 'Design Studio', to: 'studio' }]} />;
}
function MSurveyCloudN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="☁️" title="Survey Cloud"
    blurb="Every site survey your team captures, synced. Capture new ones with Survey Scan — browse the archive below."
    chips={[{ label: 'Survey Scan', to: 'sitescan', primary: true }, { label: 'AI Estimator', to: 'survey-ai' }]} />;
}
function MCopilotN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🧭" title="Scheduling Copilot"
    blurb="AI suggestions for tomorrow's routes: drive-time, skills and SLA risk balanced automatically. Review its plan below."
    chips={[{ label: 'Schedule', to: 'calendar' }, { label: 'Dispatch', to: 'dispatch' }]} />;
}
function MIntelN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🔎" title="Monitoring Intelligence"
    blurb="Cross-site camera analytics: uptime patterns, anomaly clusters, storage forecasts. The analysis board is below."
    chips={[{ label: 'Live cameras', to: 'cameras' }, { label: 'Incidents', to: 'incidents' }]} />;
}
function MMarginXRayN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="📊" title="Margin X-Ray"
    blurb="True job-level margin after labor, materials and warranty reserve. Drill into every job below."
    chips={[{ label: 'Job costing', to: 'costing' }, { label: 'Reports', to: 'reports' }]} />;
}
function MRRBuilderN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🔁" title="Recurring Revenue Builder"
    blurb="Turn one-time installs into monitoring contracts — attach plans, model MRR uplift, generate the pitch. Full builder below."
    chips={[{ label: 'Service plans', to: 'service-plans' }, { label: 'MRR', to: 'mrr' }]} />;
}
function MRFPN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="📄" title="RFP Responder"
    blurb="Structured responses to formal RFPs: requirement matrix, compliance grid, boilerplate library. Draft below — or let Auto-Bid do it."
    chips={[{ label: 'Auto-Bid', to: 'autobid', primary: true }, { label: 'Proposals', to: 'proposals' }]} />;
}
function MROIN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🧮" title="ROI Calculator"
    blurb="Show customers the payback on a security investment — loss prevention, insurance, staffing. The interactive calculator is below."
    chips={[{ label: 'Proposals', to: 'proposals' }, { label: 'Sales tools', to: 'crm' }]} />;
}
function MExpensesN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🧾" title="Expense Approvals"
    blurb="Tech-submitted receipts and purchases waiting for sign-off. Review and approve in the queue below."
    chips={[{ label: 'Timesheets', to: 'timesheets' }, { label: 'Approvals hub', to: 'approvals' }]} />;
}
function MCustomerHubN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="👤" title="Customer 360"
    blurb="The full customer workspace — sites, assets, passwords, documents, invoices, contacts — is below."
    chips={[{ label: 'All customers', to: 'customers-list', primary: true }, { label: 'Health', to: 'health' }]} />;
}
function MTimelineN({ onNav }) {
  return <MDeskIntro onNav={onNav} icon="🕒" title="Customer Timeline"
    blurb="Every touchpoint in order — installs, tickets, invoices, calls. Scroll the full history below."
    chips={[{ label: 'Customers', to: 'customers-list' }]} />;
}

/* ══════════════ AUTO-BID — native approval queue ══════════════
   Bids auto-build nightly WITH their recommended-tier proposal already
   generated. This screen is purely review → approve: tap a lead, see the
   finished proposal + exactly how the price was built, then Approve & Email
   or Approve & Download. Nothing else to do. */
const AB_CONF = { high: 'var(--status-ok)', medium: 'var(--status-warn)', low: 'var(--status-critical)' };
const ab$ = (n) => '$' + Number(n || 0).toLocaleString();

function MAutoBidN({ onNav }) {
  const [rows, setRows] = React.useState(null);
  const [open, setOpen] = React.useState(null);       // opp row under review
  const [genBusy, setGenBusy] = React.useState({});
  const refresh = React.useCallback(() => {
    const api = window.__shieldBids; if (!api) return setRows([]);
    api.list().then(r => setRows(r && r.ok ? r.data.filter(o => o.bid) : []));
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  const list = rows || [];
  const readyQ = list.filter(o => o.bid.status === 'proposal' && !o.bid.sent_at);
  const sent = list.filter(o => o.bid.sent_at);
  const building = list.filter(o => o.bid.status === 'ready' || o.bid.status === 'building');
  const failed = list.filter(o => o.bid.status === 'error');
  const finishOne = async (o) => {
    setGenBusy(b => ({ ...b, [o.id]: true }));
    const r = await window.__shieldBids.proposal(o.bid.id, 'medium');
    setGenBusy(b => ({ ...b, [o.id]: false }));
    if (r && r.ok) { showToast('Proposal ready', 'ok'); refresh(); }
    else showToast(`Could not generate: ${(r && r.error) || 'unknown'}`, 'error');
  };
  const card = (o, badge, badgeColor, sub, onTap, trailing) => (
    <div key={o.id} onClick={onTap} className="glass" style={{ padding: '13px 14px', borderRadius: 14, cursor: onTap ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <MBadge color={badgeColor}>{badge}</MBadge>
        {o.bid.scope && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: AB_CONF[o.bid.scope.confidence] || 'var(--text-low)' }}>{o.bid.scope.confidence}</span>}
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>
          {o.bid.tiers ? ab$((o.bid.tiers[o.bid.selected_tier || 'medium'] || o.bid.tiers.medium || {}).price) : ''}
        </span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.35 }}>{o.title}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 2 }}>{o.buyer}{o.state ? ` · ${o.state}` : ''}{o.due_at ? ` · due ${new Date(o.due_at).toLocaleDateString()}` : ''}{sub ? ` · ${sub}` : ''}</div>
      {trailing}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['TO APPROVE', readyQ.length, readyQ.length ? 'var(--brand)' : 'var(--status-ok)'], ['SENT', sent.length, 'var(--status-ok)'], ['LEADS', list.length, 'var(--text-mid)']]} />
      {rows === null && <OPS5_EMPTY>Loading your bid queue…</OPS5_EMPTY>}
      {rows !== null && list.length === 0 && <OPS5_EMPTY>No leads yet — the scrapers land them nightly at 4 AM ET and bids build themselves by 4:30.</OPS5_EMPTY>}

      {readyQ.length > 0 && <MSection title="Ready for your approval" />}
      {readyQ.map(o => card(o, 'REVIEW', 'var(--brand)', null, () => setOpen(o)))}

      {building.length > 0 && <MSection title="Finishing up" style={{ marginTop: 4 }} />}
      {building.map(o => card(o, o.bid.status === 'building' ? 'BUILDING' : 'PRICING DONE', 'var(--status-warn)', null, null, (
        <button disabled={genBusy[o.id]} onClick={() => finishOne(o)} style={{ marginTop: 9, width: '100%', padding: '9px 0', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          {genBusy[o.id] ? 'Writing proposal…' : 'Finish proposal now'}
        </button>
      )))}

      {sent.length > 0 && <MSection title="Approved & sent" style={{ marginTop: 4 }} />}
      {sent.map(o => card(o, 'SENT', 'var(--status-ok)', `to ${o.bid.sent_to || '—'}`, () => setOpen(o)))}

      {failed.length > 0 && <MSection title="Needs attention" style={{ marginTop: 4 }} />}
      {failed.map(o => card(o, 'ERROR', 'var(--status-critical)', (o.bid.error || '').slice(0, 60), () => finishOne(o)))}

      {open && <MBidReview opp={open} onClose={(changed) => { setOpen(null); if (changed) refresh(); }} />}
    </div>
  );
}

/* Full-screen native review: the finished proposal + a transparent "how this
   price was built" panel, then one decision — email it or download it. */
function MBidReview({ opp, onClose }) {
  const [bid, setBid] = React.useState(opp.bid);
  const [tierBusy, setTierBusy] = React.useState(false);
  const [emailOpen, setEmailOpen] = React.useState(false);
  const [showMath, setShowMath] = React.useState(false);
  const [to, setTo] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const tierKey = bid.selected_tier || 'medium';
  const tier = (bid.tiers || {})[tierKey] || {};
  const laborCost = Math.round((Number(bid.labor_hours) || 0) * (Number(bid.labor_rate) || 145));
  const docs = bid.docs_read || [];
  const readOk = docs.filter(d => d.fetched).length;
  const switchTier = async (k) => {
    if (k === tierKey || tierBusy) return;
    setTierBusy(true);
    const r = await window.__shieldBids.proposal(bid.id, k);
    setTierBusy(false);
    if (r && r.ok) setBid(b => ({ ...b, selected_tier: k, proposal_html: r.data.proposalHtml, status: 'proposal' }));
    else showToast(`Could not switch tier: ${(r && r.error) || 'unknown'}`, 'error');
  };
  const download = () => {
    const blob = new Blob([bid.proposal_html || ''], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ShieldTech-Proposal-${String(opp.solicitation_id || opp.id).slice(0, 24)}.html`;
    a.click(); URL.revokeObjectURL(a.href);
    window.__shieldBids.toPipeline(opp, bid);
    showToast('Approved — downloaded and added to the pipeline', 'ok');
  };
  const send = async () => {
    if (!to.includes('@')) { showToast('Enter a valid email', 'warn'); return; }
    setSending(true);
    const html = bid.proposal_html || '';
    const r = await window.__shieldEmail.send({
      to: to.trim(),
      subject: `Proposal — ${opp.title} — ShieldTech Solutions`,
      html: `<p style="font-family:sans-serif;font-size:14px">Hello,<br/><br/>Please find our proposal for "${opp.title}" below. We're ready to schedule a walkthrough or answer any questions.<br/><br/>Best regards,<br/>ShieldTech Solutions · (215) 555-0100</p><hr/>` +
        html.replace(/^[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, ''),
    });
    setSending(false);
    if (r && r.ok) {
      await window.__shieldBids.markSent(bid.id, to.trim());
      window.__shieldBids.toPipeline(opp, bid);
      showToast(`Approved — proposal emailed to ${to.trim()}`, 'ok');
      onClose(true);
    } else showToast(`Email failed: ${(r && r.error) || 'unknown'} — use Download instead`, 'error');
  };
  const mathRow = (k, v, strong) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.06)' }}>
      <span style={{ fontSize: 11.5, color: strong ? 'var(--text-high)' : 'var(--text-mid)', fontWeight: strong ? 700 : 400 }}>{k}</span>
      <span className="mono" style={{ fontSize: 11.5, fontWeight: strong ? 700 : 500, color: strong ? 'var(--brand)' : 'var(--text-high)' }}>{v}</span>
    </div>
  );
  const overlay = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'var(--canvas)', display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: 'calc(10px + env(safe-area-inset-top)) 16px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => onClose(false)} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 17, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opp.title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{opp.buyer}{opp.due_at ? ` · due ${new Date(opp.due_at).toLocaleDateString()}` : ''}</div>
        </div>
        {opp.source_url && <a href={opp.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: 'var(--brand)', textDecoration: 'none', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '5px 9px', whiteSpace: 'nowrap' }}>Source ↗</a>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {/* Price + tier picker */}
        <div className="glass" style={{ padding: '14px 15px', borderRadius: 14, border: '1px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span className="mono" style={{ fontSize: 27, fontWeight: 700, color: 'var(--text-high)' }}>{ab$(tier.price)}</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{tier.marginPct}% margin</span>
            {bid.scope && <span style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: AB_CONF[bid.scope.confidence] }}>{bid.scope.confidence} confidence</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 11 }}>
            {[['low', 'Lower'], ['medium', 'Recommended'], ['aggressive', 'Premium']].map(([k, label]) => {
              const t = (bid.tiers || {})[k]; if (!t) return null;
              const onIt = k === tierKey;
              return (
                <button key={k} disabled={tierBusy} onClick={() => switchTier(k)} style={{ flex: 1, padding: '8px 0 7px', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--font-body)', border: `1px solid ${onIt ? 'var(--brand)' : 'var(--border-subtle)'}`, background: onIt ? 'rgba(63,169,245,0.14)' : 'transparent', opacity: tierBusy ? 0.55 : 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: onIt ? 'var(--brand)' : 'var(--text-low)', textTransform: 'uppercase' }}>{label}</div>
                  <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: onIt ? 'var(--text-high)' : 'var(--text-mid)' }}>{ab$(t.price)}</div>
                </button>
              );
            })}
          </div>
          {tierBusy && <div style={{ fontSize: 10.5, color: 'var(--status-warn)', marginTop: 8, textAlign: 'center' }}>Rewriting proposal at this price…</div>}
        </div>

        {/* How this price was built — the accuracy panel */}
        <button onClick={() => setShowMath(s => !s)} className="glass" style={{ width: '100%', textAlign: 'left', padding: '12px 15px', borderRadius: 13, border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 13 }}>🧮</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>How this price was built</span>
          <span style={{ fontSize: 10, color: readOk ? 'var(--status-ok)' : 'var(--status-warn)' }}>{readOk}/{docs.length} sources read</span>
          <span style={{ color: 'var(--text-low)', transform: showMath ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
        </button>
        {showMath && (
          <div className="glass" style={{ padding: '12px 15px', borderRadius: 13, marginTop: -4 }}>
            {mathRow('Materials & equipment', ab$(bid.material_cost))}
            {mathRow(`Labor — ${bid.labor_hours}h × $${bid.labor_rate}/hr`, ab$(laborCost))}
            {mathRow('Our cost', ab$(bid.cost_total))}
            {mathRow(`+ ${tier.marginPct}% margin (${tierKey})`, ab$(tier.price), true)}
            {(bid.line_items || []).length > 0 && <>
              <div className="label-sm" style={{ margin: '10px 0 4px' }}>LINE ITEMS ({bid.line_items.length})</div>
              {bid.line_items.slice(0, 10).map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{l.qty}× {l.desc}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)', whiteSpace: 'nowrap' }}>{ab$((Number(l.qty) || 0) * (Number(l.unitCost) || 0))}</span>
                </div>
              ))}
              {bid.line_items.length > 10 && <div style={{ fontSize: 10, color: 'var(--text-low)' }}>+{bid.line_items.length - 10} more…</div>}
            </>}
            {docs.length > 0 && <>
              <div className="label-sm" style={{ margin: '10px 0 4px' }}>SOURCES THE AI READ</div>
              {docs.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '3px 0' }}>
                  <span style={{ fontSize: 10, color: d.fetched ? 'var(--status-ok)' : 'var(--status-critical)' }}>{d.fetched ? '✓' : '✗'}</span>
                  <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--brand)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{d.url}</a>
                </div>
              ))}
            </>}
            {(bid.scope?.missingInfo || []).length > 0 && <>
              <div className="label-sm" style={{ margin: '10px 0 4px', color: 'var(--status-warn)' }}>⚠ VERIFY AT SOURCE BEFORE SENDING</div>
              {bid.scope.missingInfo.map((m, i) => <div key={i} style={{ fontSize: 11, color: 'var(--status-warn)', padding: '2px 0' }}>• {m}</div>)}
            </>}
            {(bid.scope?.assumptions || []).length > 0 && <>
              <div className="label-sm" style={{ margin: '10px 0 4px' }}>ASSUMPTIONS MADE</div>
              {bid.scope.assumptions.slice(0, 5).map((a, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-mid)', padding: '2px 0' }}>• {a}</div>)}
            </>}
          </div>
        )}

        {/* The finished proposal */}
        {bid.proposal_html
          ? <iframe title="proposal" srcDoc={bid.proposal_html} style={{ width: '100%', height: '56vh', border: '1px solid var(--border-subtle)', borderRadius: 13, background: '#fff', flexShrink: 0 }} />
          : <OPS5_EMPTY>Proposal not written yet for this lead.</OPS5_EMPTY>}
        {bid.sent_at && <div style={{ fontSize: 10.5, color: 'var(--status-ok)', textAlign: 'center' }}>✓ Already sent to {bid.sent_to} on {new Date(bid.sent_at).toLocaleDateString()}</div>}
      </div>

      {/* Decision bar */}
      <div style={{ padding: '10px 14px calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 9, flexShrink: 0, background: 'rgba(10,14,20,0.96)' }}>
        <button onClick={download} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⭳ Approve & Download</button>
        <button onClick={() => setEmailOpen(true)} style={{ flex: 1.2, padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✉ Approve & Email</button>
      </div>

      {emailOpen && (
        <div onClick={() => setEmailOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--modal, #0d1420)', borderTop: '1px solid var(--border-strong)', borderRadius: '18px 18px 0 0', padding: '18px 18px calc(20px + env(safe-area-inset-bottom))' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)', marginBottom: 10 }}>Send to</div>
            <input autoFocus value={to} onChange={e => setTo(e.target.value)} placeholder="buyer@agency.gov" inputMode="email"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'rgba(5,7,10,0.5)', color: 'var(--text-high)', fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none', marginBottom: 12 }} />
            <button onClick={send} disabled={sending} style={{ width: '100%', padding: '13px 0', borderRadius: 11, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending…' : 'Send proposal'}</button>
          </div>
        </div>
      )}
    </div>
  );
  return (window.ReactDOM && window.ReactDOM.createPortal) ? window.ReactDOM.createPortal(overlay, document.body) : overlay;
}

/* Screen id → native view. Consumed by mobile-app.jsx; every id here renders
   its native layer with data-desk=false, plus the full desktop suite inline
   (except ids in the shell's FULL_INLINE_SKIP). */
const M_OPS5 = {
  chat: MChatN,
  messages: MChatN,
  invoices: MInvoicesN,
  estimates: MEstimatesN,
  timesheets: MTimesheetsN,
  expenses: MExpensesN,
  employees: MEmployeesN,
  pricebook: MPricebookN,
  'product-library': MProductLibraryN,
  documents: MDocumentsN,
  users: MUsersN,
  outbox: MOutboxN,
  'secret-weapon': MSecretWeaponN,
  assets: MAssetsN,
  forecast: MForecastN,
  health: MHealthN,
  wallboard: MWallboardN,
  digest: MDigestN,
  'portal-settings': MPortalSettingsN,
  integrations: MIntegrationsN,
  studio: MStudioN,
  'service-plans': MServicePlansN,
  onboarding: MOnboardingN,
  'service-reports': MServiceReportsN,
  statuspage: MStatusPageN,
  marketing: MMarketingN,
  'survey-cloud': MSurveyCloudN,
  copilot: MCopilotN,
  intel: MIntelN,
  'margin-xray': MMarginXRayN,
  'rr-builder': MRRBuilderN,
  rfp: MRFPN,
  roi: MROIN,
  customer: MCustomerHubN,
  timeline: MTimelineN,
  autobid: MAutoBidN,
};

Object.assign(window, { M_OPS5, MDeskIntro, MChatN, MInvoicesN, MEstimatesN, MTimesheetsN, MEmployeesN, MPricebookN, MProductLibraryN, MDocumentsN, MUsersN, MOutboxN, MSecretWeaponN, MAssetsN, MForecastN, MHealthN, MWallboardN, MDigestN, MPortalSettingsN, MIntegrationsN, MAutoBidN, MBidReview });

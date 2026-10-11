/* CARE + ADMIN — Customers, Help Desk & Incidents, Messages, Team & Skills,
   HR Center, Users & Invites, Approvals & Expenses, Documents, Portal Settings
   on the UniFi-pattern layout under the one unified sidebar.

   Customers and Help Desk are rebuilt (tiles, chips, table, properties drawer
   on the real stores + the customer-portal ticket queue). The rest keep their
   working engines inside the unified frame; their inner menus are gone — the
   sidebar children drive them (DvFrame / useDvSub from screen-deliver). */

const caInp = { fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box', padding: '7px 9px', background: 'var(--canvas)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12.5, outline: 'none' };
const caMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();
const CA_PRIORITY = { critical: 'var(--status-critical)', high: 'var(--status-warn)', medium: 'var(--brand)', low: 'var(--text-low)' };
const CA_TSTATUS = { open: { l: 'Open', c: 'var(--status-critical)' }, 'in-progress': { l: 'In progress', c: 'var(--status-warn)' }, resolved: { l: 'Resolved', c: 'var(--status-ok)' } };

/* ═══════════════════ CUSTOMERS ═══════════════════ */
const CA_CUST_SUBS = [{ id: 'all', label: 'Directory' }, { id: 'nps', label: 'NPS & feedback' }];
function caQboCustomer(c) {
  const name = c.display_name || c.company_name || 'Customer';
  const addr = [c.billing_line, c.billing_city, c.billing_state, c.billing_postal].filter(Boolean).join(', ');
  return { id: 'qbo:' + c.qbo_id, name, dba: (c.company_name && c.company_name !== name) ? c.company_name : '', type: 'Commercial', industry: '', sites: 0, assets: 0, contacts: 0, owner: '—', mrr: 0, balance: Number(c.balance) || 0, health: 0, status: c.active === false ? 'inactive' : 'active', acctNum: 'QB-' + c.qbo_id, logo: name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') || 'C', email: c.email || '', phone: c.phone || '', address: addr, billing: addr, shipping: '', website: '', taxId: '', terms: 'Net 30', taxExempt: false, tags: [], notes: '', parent: null, city: c.billing_city || '', state: c.billing_state || '', source: 'quickbooks', createdAt: c.synced_at ? new Date(c.synced_at).getTime() : Date.now() };
}
function CareCustomersScreen() {
  const [storeCustomers] = useShieldStore(customerStore);
  const [subCustomers] = useShieldStore(subCustomerStore);
  const [custData] = useShieldStore(customerDataStore);
  const [wos] = useShieldStore(workOrderStore);
  const [tickets] = useShieldStore(ticketStore);
  const isMobile = useIsMobile(820);
  const [tab, setTab] = useDvSub('customers-list', CA_CUST_SUBS, 'all', { nps: 'nps' });
  const [q, setQ] = React.useState('');
  const [chip, setChip] = React.useState('all');
  const [detailId, setDetailId] = React.useState(null);
  const [create, setCreate] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const [qbo, setQbo] = React.useState([]);
  React.useEffect(() => { const qb = window.__shieldQBO; if (!qb) return; qb.customers(2000).then(r => { if (r && r.ok && r.data) setQbo(r.data.map(caQboCustomer)); }); }, []);
  const all = React.useMemo(() => { const names = new Set((storeCustomers || []).map(c => (c.name || '').toLowerCase())); return [...(storeCustomers || []), ...qbo.filter(c => !names.has((c.name || '').toLowerCase()))]; }, [storeCustomers, qbo]);
  const enrich = (c) => {
    const nm = (c.name || '').toLowerCase();
    const sites = ((custData || {})[`${c.id}:sites`] || []).length || Number(c.sites) || 0;
    const openWos = (wos || []).filter(w => (w.customer || '').toLowerCase() === nm && w.status !== 'completed').length;
    const openTk = (tickets || []).filter(t => (t.customer || '').toLowerCase() === nm && t.status !== 'resolved').length;
    return { mrr: 0, balance: 0, assets: 0, contacts: 0, health: 0, tags: [], type: c.type || 'Commercial', logo: c.logo || (c.name || 'C').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join(''), ...c, id: c.id, sites, _sites: sites, _wos: openWos, _tickets: openTk, _status: c.status || 'active', _source: c.source === 'quickbooks' ? 'QuickBooks' : 'Portal' };
  };
  const list = all.map(enrich);
  const rows = list.filter(c => (chip === 'all' || (chip === 'quickbooks' ? c.source === 'quickbooks' : chip === 'portal' ? c.source !== 'quickbooks' : c._status === chip)) && docSearchMatch(q, c.name, c.dba, c.type, c.acctNum, c.contact, c.email, c.phone, c.city, c.state));
  const detail = detailId ? list.find(c => c.id === detailId) : null;
  const ar = list.reduce((s, c) => s + (Number(c.balance) || 0), 0);

  const cols = [
    { k: 'name', l: 'Customer', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><span style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--brand-tint-12)', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r.logo || (r.name || 'C').slice(0, 2).toUpperCase()}</span><span><span style={{ fontWeight: 600 }}>{r.name}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.acctNum || r.id}{r.dba ? ` · DBA ${r.dba}` : ''}{r.city ? ` · ${r.city}${r.state ? ', ' + r.state : ''}` : ''}</span></span></span> },
    { k: 'type', l: 'Type', dim: true, render: r => r.type || '—' },
    { k: 'contact', l: 'Contact', render: r => <span>{r.contact || '—'}<span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{[r.email, r.phone].filter(Boolean).join(' · ') || '—'}</span></span> },
    { k: '_sites', l: 'Sites', right: true },
    { k: '_wos', l: 'Open WOs', right: true, render: r => r._wos ? <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r._wos}</span> : '—' },
    { k: '_tickets', l: 'Tickets', right: true, render: r => r._tickets ? <span style={{ color: 'var(--status-warn)', fontWeight: 600 }}>{r._tickets}</span> : '—' },
    { k: 'balance', l: 'AR balance', right: true, render: r => Number(r.balance) ? <span style={{ color: 'var(--status-warn)' }}>{caMoney(r.balance)}</span> : '—' },
    { k: '_source', l: 'Source', dim: true },
    { k: '_status', l: 'Status', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: r._status === 'active' ? 'var(--status-ok)' : 'var(--text-low)' }} />{r._status}</span> },
  ];
  const body = tab === 'nps' ? (window.NPSScreen ? <NPSScreen /> : null)
    : detail && window.CustomerDetail ? <CustomerDetail customer={detail} subCustomers={(subCustomers || []).filter(s => s.parentId === detail.id)} onBack={() => setDetailId(null)} showToast={showToast} toast={toast} />
    : <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} onRow={r => setDetailId(r.id)} empty={<UcEmpty title={q || chip !== 'all' ? 'No customers match' : 'No customers yet'} body={q || chip !== 'all' ? 'Clear the search or filter.' : 'Add a customer here, win one on the Bid Board, or connect QuickBooks and the book of business appears automatically.'} cta={q || chip !== 'all' ? undefined : '+ New customer'} onCta={() => setCreate(true)} />} /></div></UcCard>;
  return (
    <DvFrame label="Customers" title={detail ? detail.name : 'Customers'} sub={detail ? 'Customer record' : `${list.length} organizations · ${list.filter(c => c.source === 'quickbooks').length} from QuickBooks`} isMobile={isMobile}
      right={!detail && tab === 'all' ? <><UcSearch value={q} onChange={setQ} placeholder="Search customers" /><UcBtn onClick={() => setCreate(true)}>+ New customer</UcBtn></> : null}
      tiles={!detail ? <>
        <UcTile label="Customers" value={list.length} sub={`${list.filter(c => c._status === 'active').length} active`} />
        <UcTile label="From QuickBooks" value={list.filter(c => c.source === 'quickbooks').length} sub={window.__shieldQBO ? 'synced book of business' : 'connect QuickBooks to sync'} />
        <UcTile label="Open work orders" value={list.reduce((s, c) => s + c._wos, 0)} sub="across all customers" />
        <UcTile label="Open tickets" value={list.reduce((s, c) => s + c._tickets, 0)} sub="help desk" tone={list.reduce((s, c) => s + c._tickets, 0) ? 'warn' : undefined} />
        <UcTile label="AR balance" value={caMoney(ar)} sub="outstanding" tone={ar ? 'warn' : undefined} />
      </> : null}
      tabs={!detail ? CA_CUST_SUBS : null} tab={tab} onTab={setTab}
      chips={!detail && tab === 'all' ? <UcChips options={[{ id: 'all', l: 'All', n: list.length }, { id: 'active', l: 'Active' }, { id: 'inactive', l: 'Inactive' }, { id: 'quickbooks', l: 'QuickBooks' }, { id: 'portal', l: 'Portal-created' }]} value={chip} onChange={setChip} /> : null}>
      {body}
      {create && window.CustomerCreateModal && <CustomerCreateModal onClose={() => setCreate(false)} showToast={showToast} />}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </DvFrame>
  );
}

/* ═══════════════════ HELP DESK ═══════════════════ */
const CA_HD_SUBS = [{ id: 'tickets', label: 'Tickets' }, { id: 'incidents', label: 'Incidents' }];
function caMapSupport(t) {
  return { id: t.ref, _support: t, priority: t.priority === 'urgent' ? 'critical' : (t.priority || 'medium'), status: t.status === 'resolved' || t.status === 'closed' ? 'resolved' : t.status === 'open' ? 'open' : 'in-progress', customer: t.company || t.contact_name || t.contact_email || 'Customer', contact: t.contact_name || t.contact_email || '', subject: t.subject, created: new Date(t.created_at).getTime(), sla: { total: t.priority === 'urgent' ? 4 : t.priority === 'high' ? 8 : 24 }, tags: [t.category, 'customer-portal'].filter(Boolean), assignee: null, relatedAsset: '', thread: (t.thread || []).map(m => ({ from: m.from === 'shieldtech' ? (m.by || 'ShieldTech') : (m.by || 'Customer'), time: m.at ? new Date(m.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '', msg: m.text, system: false })) };
}
function CaTicketDrawer({ tk, roster, now, onClose, reload }) {
  const [reply, setReply] = React.useState('');
  const [, setTickets] = useShieldStore(ticketStore);
  const st = CA_TSTATUS[tk.status] || CA_TSTATUS.open;
  const slaRem = Math.max(0, tk.sla.total - (now - tk.created) / 3600000);
  const slaPct = Math.max(0, Math.min(100, slaRem / tk.sla.total * 100));
  const stamp = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const patchLocal = (f) => setTickets(prev => (prev || []).map(t => t.id === tk.id ? { ...t, ...(typeof f === 'function' ? f(t) : f) } : t));
  const send = async () => {
    const body = reply.trim(); if (!body) return;
    if (tk._support) { const r = await window.__shieldTickets.addMessage(tk._support.id, body, true); if (!r.ok) { shieldToast(`Reply failed: ${r.error}`, 'warn'); return; } if (tk._support.status === 'open') await window.__shieldTickets.setStatus(tk._support.id, 'waiting'); setReply(''); reload(); shieldToast('Reply sent — visible in the customer portal', 'ok'); return; }
    const me = (window.__shieldUser && window.__shieldUser.name) || 'ShieldTech';
    patchLocal(t => ({ thread: [...(t.thread || []), { from: me, time: stamp(), msg: body, system: false }] })); setReply(''); shieldToast('Reply added', 'ok');
  };
  const setStatus = (status) => {
    if (tk._support) { window.__shieldTickets.setStatus(tk._support.id, status === 'resolved' ? 'resolved' : 'in-progress').then(r => { if (!r.ok) shieldToast(`Update failed: ${r.error}`, 'warn'); reload(); }); shieldToast(`Ticket ${status}`, 'ok'); return; }
    patchLocal(t => ({ status, thread: [...(t.thread || []), { from: 'System', time: stamp(), msg: `Status changed to ${status}.`, system: true }] })); shieldToast(`Ticket ${status}`, 'ok');
  };
  const assign = (id) => {
    if (tk._support) { shieldToast('Customer-portal tickets are worked from this queue; dispatch owns assignment', 'info'); return; }
    const t = roster.find(r => r.id === id);
    patchLocal(x => ({ assignee: id || null, status: x.status === 'open' && id ? 'in-progress' : x.status, thread: [...(x.thread || []), { from: 'System', time: stamp(), msg: id ? `Assigned to ${t ? t.name : id}.` : 'Unassigned.', system: true }] }));
  };
  const escalate = () => {
    const inc = { id: genId('INC'), severity: tk.priority === 'critical' ? 'P1' : 'P2', status: 'active', customer: tk.customer, type: 'Escalated from Help Desk', assignee: (roster.find(r => r.id === tk.assignee) || {}).name || 'Unassigned', openedAt: Date.now(), title: tk.subject, playbook: [{ step: 'Acknowledge and assess severity', done: false }, { step: 'Notify stakeholders', done: false }, { step: 'Begin remediation', done: false }, { step: 'Resolve and document', done: false }], timeline: [{ time: stamp(), actor: 'System', msg: `Escalated from ${tk.id}.`, type: 'alert' }], relatedTicket: tk.id };
    incidentStore.set(prev => [inc, ...(prev || [])]); setStatus('in-progress'); shieldToast(`Escalated to ${inc.id}`, 'warn');
    if (window.navSubSet) window.navSubSet('helpdesk', 'incidents', 'nav');
  };
  const remove = () => shieldModal({ kind: 'confirm', danger: true, title: `Delete ${tk.id}?`, message: 'Removes this internal ticket from every device.', confirmLabel: 'Delete', successMsg: 'Deleted', onConfirm: () => { setTickets(prev => (prev || []).filter(t => t.id !== tk.id)); onClose(); } });
  return (
    <UcDrawer title={tk.subject} sub={`${tk.id} · ${tk.customer}${tk.contact ? ' · ' + tk.contact : ''}`} onClose={onClose} width={440}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: st.c }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: st.c }} />{st.l}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: CA_PRIORITY[tk.priority] || 'var(--text-mid)', fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: CA_PRIORITY[tk.priority] }} />{tk.priority}</span>
        {tk.status === 'open' && <UcBtn small onClick={() => setStatus('in-progress')}>Start</UcBtn>}
        {tk.status !== 'resolved' && <UcBtn small kind="soft" onClick={() => setStatus('resolved')}>Resolve</UcBtn>}
        {tk.status !== 'resolved' && tk.priority !== 'low' && <UcBtn small kind="danger" onClick={escalate}>Escalate</UcBtn>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <UcTile label="SLA" value={tk.status === 'resolved' ? 'Met' : `${slaRem.toFixed(1)}h`} sub={tk.status === 'resolved' ? 'closed' : `of ${tk.sla.total}h target`} tone={tk.status === 'resolved' ? 'ok' : slaRem < 1 ? 'crit' : slaRem < 2 ? 'warn' : undefined} />
        <UcTile label="Age" value={`${((now - tk.created) / 3600000).toFixed(1)}h`} sub={new Date(tk.created).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} />
      </div>
      {tk.status !== 'resolved' && <div style={{ height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden', marginBottom: 12 }}><div style={{ width: slaPct + '%', height: '100%', background: slaPct > 50 ? 'var(--status-ok)' : slaPct > 20 ? 'var(--status-warn)' : 'var(--status-critical)' }} /></div>}
      <UcCard title="Assignment" pad={12} style={{ marginBottom: 12 }}>
        <select value={tk.assignee || ''} onChange={e => assign(e.target.value)} style={{ ...caInp }}><option value="">Unassigned</option>{roster.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        {!roster.length && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 6 }}>No technicians yet — invite users in Team.</div>}
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(tk.tags || []).map(t => <span key={t} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: 'var(--canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)' }}>#{t}</span>)}{tk._support && <span style={{ fontSize: 10.5, color: 'var(--accent-2)', fontWeight: 600 }}>customer portal</span>}</div>
      </UcCard>
      <UcCard title={`Thread (${(tk.thread || []).length})`} pad={12} style={{ marginBottom: 12 }}>
        {!(tk.thread || []).length && <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>No messages yet.</div>}
        {(tk.thread || []).map((m, i) => m.system ? <div key={i} style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic', padding: '4px 0' }}>{m.msg} · {m.time}</div> : (
          <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><div style={{ display: 'flex', gap: 8, fontSize: 11.5, marginBottom: 3 }}><span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{m.from}</span><span style={{ color: 'var(--text-low)' }}>{m.time}</span></div><div style={{ fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.msg}</div></div>))}
        <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} placeholder="Reply… (⌘Enter to send)" style={{ ...caInp, minHeight: 64, resize: 'vertical', marginTop: 10 }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><UcBtn small onClick={send} disabled={!reply.trim()}>Send reply</UcBtn>{tk._support && <span style={{ fontSize: 11, color: 'var(--text-low)', alignSelf: 'center' }}>lands in the customer portal</span>}</div>
      </UcCard>
      {!tk._support && <UcBtn small kind="danger" onClick={remove}>Delete ticket</UcBtn>}
    </UcDrawer>
  );
}
function CareHelpdeskScreen() {
  const [storeTickets, setTickets] = useShieldStore(ticketStore);
  const [incidents] = useShieldStore(incidentStore);
  const isMobile = useIsMobile(820);
  const [tab, setTab] = useDvSub('helpdesk', CA_HD_SUBS, 'tickets', { incidents: 'incidents' });
  const [q, setQ] = React.useState('');
  const [chip, setChip] = React.useState('open');
  const [selId, setSelId] = React.useState(null);
  const [now, setNow] = React.useState(Date.now());
  const techs = useTechs();
  const roster = techs.map(t => ({ id: t.id, name: t.name }));
  const [cust, setCust] = React.useState([]);
  const loadCust = React.useCallback(() => { const t = window.__shieldTickets; if (t) t.list().then(r => { if (r.ok) setCust(r.data || []); }); }, []);
  React.useEffect(() => { loadCust(); const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, [loadCust]);
  const tickets = React.useMemo(() => [...cust.map(caMapSupport), ...(storeTickets || [])], [cust, storeTickets]);
  const slaRem = (t) => Math.max(0, t.sla.total - (now - t.created) / 3600000);
  const rows = tickets.filter(t => (chip === 'all' || (chip === 'open' ? t.status !== 'resolved' : t.status === chip)) && docSearchMatch(q, t.id, t.subject, t.customer, t.contact, t.priority, (t.tags || []).join(' '))).sort((a, b) => b.created - a.created);
  const sel = selId ? tickets.find(t => t.id === selId) : null;
  const weekAgo = now - 7 * 864e5;
  const atRisk = tickets.filter(t => t.status !== 'resolved' && slaRem(t) < 2).length;
  const activeInc = (incidents || []).filter(i => i.status === 'active').length;

  const newTicket = () => {
    const names = shieldCustomerNames();
    shieldModal({
      kind: 'form', title: 'New ticket', subtitle: 'Internal ticket — customer-portal tickets arrive on their own', submitLabel: 'Create', successMsg: 'Ticket created',
      fields: [
        { key: 'customerSel', label: 'Customer', type: 'select', options: [...names, 'Other'] }, { key: 'customerOther', label: 'Customer name', placeholder: 'If not in the list' },
        { key: 'contact', label: 'Contact', placeholder: 'Name' }, { key: 'priority', label: 'Priority', type: 'select', options: ['medium', 'high', 'critical', 'low'] },
        { key: 'subject', label: 'Subject', required: true, full: true, placeholder: 'Describe the issue briefly' },
        { key: 'assignee', label: 'Assign to', type: 'select', options: ['Unassigned', ...roster.map(r => r.name)] }, { key: 'tags', label: 'Tags', placeholder: 'nvr, alarm (comma-separated)' },
        { key: 'desc', label: 'Details', type: 'textarea', placeholder: 'What is happening, where, since when…' },
      ],
      onSubmit: (v) => {
        const customer = (v.customerSel && v.customerSel !== 'Other' ? v.customerSel : v.customerOther || '').trim() || 'Customer';
        const a = roster.find(r => r.name === v.assignee);
        const stamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const t = { id: genId('TK'), priority: v.priority, status: a ? 'in-progress' : 'open', customer, contact: v.contact || '', subject: v.subject, created: Date.now(), sla: { total: v.priority === 'critical' ? 4 : v.priority === 'high' ? 8 : 24 }, tags: (v.tags || '').split(',').map(s => s.trim()).filter(Boolean), assignee: a ? a.id : null, relatedAsset: '', aiSuggestion: null, thread: [{ from: 'System', time: stamp, msg: 'Ticket created.', system: true }, ...(v.desc ? [{ from: (window.__shieldUser || {}).name || 'ShieldTech', time: stamp, msg: v.desc, system: false }] : [])] };
        setTickets(prev => [t, ...(prev || [])]); setSelId(t.id);
      },
    });
  };
  const cols = [
    { k: 'id', l: 'Ticket', w: 100, mono: true, render: r => <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.id}</span> },
    { k: 'subject', l: 'Subject', render: r => <span><span style={{ fontWeight: 600 }}>{r.subject}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-mid)' }}>{r.customer}{r.contact ? ' · ' + r.contact : ''}{r._support ? ' · portal' : ''}</span></span> },
    { k: 'priority', l: 'Priority', render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: CA_PRIORITY[r.priority] }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: CA_PRIORITY[r.priority] }} />{r.priority}</span> },
    { k: 'assignee', l: 'Assignee', render: r => (roster.find(x => x.id === r.assignee) || {}).name || (r.assignee || <span style={{ color: 'var(--text-low)' }}>—</span>) },
    { k: 'sla', l: 'SLA', render: r => r.status === 'resolved' ? <span style={{ color: 'var(--status-ok)' }}>Met</span> : <span style={{ color: slaRem(r) < 1 ? 'var(--status-critical)' : slaRem(r) < 2 ? 'var(--status-warn)' : 'var(--text-mid)', fontWeight: 600 }}>{slaRem(r).toFixed(1)}h</span> },
    { k: 'status', l: 'Status', render: r => { const s = CA_TSTATUS[r.status] || CA_TSTATUS.open; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />{s.l}</span>; } },
    { k: 'created', l: 'Opened', dim: true, render: r => new Date(r.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  ];
  const body = tab === 'incidents' ? (window.IncidentScreen ? <div style={{ '--inc-h': '100%', height: '100%' }}><IncidentScreen /></div> : null)
    : <UcCard pad={0}><div style={{ overflow: 'auto' }}><UcTable cols={cols} rows={rows} selectedId={selId} onRow={r => setSelId(r.id)} empty={<UcEmpty title={chip === 'open' && !q ? 'No open tickets' : 'No tickets match'} body="Customer-portal tickets and internal tickets both land here, with SLA countdowns by priority." cta="+ New ticket" onCta={newTicket} />} /></div></UcCard>;
  return (
    <DvFrame label="Help Desk" title="Help Desk" sub={`${tickets.filter(t => t.status !== 'resolved').length} open · ${atRisk} at SLA risk · ${activeInc} active incident${activeInc === 1 ? '' : 's'}`} isMobile={isMobile}
      right={tab === 'tickets' ? <><UcSearch value={q} onChange={setQ} placeholder="Search tickets" /><UcBtn onClick={newTicket}>+ New ticket</UcBtn></> : null}
      tiles={<>
        <UcTile label="Open" value={tickets.filter(t => t.status === 'open').length} sub="awaiting first response" tone={tickets.some(t => t.status === 'open') ? 'warn' : undefined} />
        <UcTile label="In progress" value={tickets.filter(t => t.status === 'in-progress').length} sub="being worked" />
        <UcTile label="SLA at risk" value={atRisk} sub="under 2h left" tone={atRisk ? 'crit' : undefined} />
        <UcTile label="Resolved (7d)" value={tickets.filter(t => t.status === 'resolved' && t.created > weekAgo).length} sub="closed this week" tone="ok" />
        <UcTile label="Incidents" value={activeInc} sub="active" tone={activeInc ? 'crit' : undefined} />
      </>}
      tabs={CA_HD_SUBS.map(s => ({ ...s, count: s.id === 'incidents' && activeInc ? activeInc : undefined }))} tab={tab} onTab={setTab}
      chips={tab === 'tickets' ? <UcChips options={[{ id: 'open', l: 'Open', n: tickets.filter(t => t.status !== 'resolved').length }, { id: 'in-progress', l: 'In progress' }, { id: 'resolved', l: 'Resolved' }, { id: 'all', l: 'All', n: tickets.length }]} value={chip} onChange={setChip} /> : null}
      drawer={sel && tab === 'tickets' ? <CaTicketDrawer tk={sel} roster={roster} now={now} onClose={() => setSelId(null)} reload={loadCust} /> : null}>
      {body}
    </DvFrame>
  );
}

/* ═══════════════════ MESSAGES ═══════════════════ */
function CareMessagesScreen() {
  return (
    <div data-screen-label="Messages" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>Messages</div><div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>Field ⇄ office conversations, live</div></div>
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px 12px', '--msg-h': '100%' }}>{window.PortalMessagesScreen ? <PortalMessagesScreen /> : null}</div>
    </div>
  );
}

/* ═══════════════════ ADMIN ═══════════════════ */
function CaEngine({ label, title, sub, subs, screen, fallback, hubMap, render, right }) {
  const [tab, setTab] = useDvSub(screen, subs, fallback, hubMap);
  return (
    <div data-screen-label={label} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', margin: '-4px 0 0', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--canvas)' }}>
      <div style={{ padding: '10px 16px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)' }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{sub}</div>}</div>
        {subs.length > 1 && <div style={{ marginLeft: 12 }}><UcTabs tabs={subs} value={tab} onChange={setTab} /></div>}
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '4px 16px 16px' }}>{render(tab)}</div>
    </div>
  );
}
const CA_TEAM_SUBS = [{ id: 'team', label: 'Team' }, { id: 'skills', label: 'Skills matrix' }];
function AdminTeamScreen() { return <CaEngine label="Team & Skills" title="Team & Skills" sub="People, labor and certifications" subs={CA_TEAM_SUBS} screen="employees" fallback="team" hubMap={{ skills: 'skills' }} render={t => t === 'skills' ? (window.SkillsMatrixScreen ? <SkillsMatrixScreen /> : null) : (window.TeamScreenPlus ? <TeamScreenPlus /> : null)} />; }
const CA_HR_SUBS = [{ id: 'people', label: 'People' }, { id: 'paycenter', label: 'Payroll Center' }, { id: 'projects', label: 'Project labor' }, { id: 'hiring', label: 'Hiring & actions' }, { id: 'insights', label: 'Insights' }, { id: 'audit', label: 'Audit' }, { id: 'setup', label: 'Setup' }];
const CA_HR_C = { people: 'HRPeopleScreen', paycenter: 'HRPayrollCenterScreen', projects: 'HRProjectsScreen', hiring: 'HRHiringScreen', insights: 'HRInsightsScreen', audit: 'HRAuditScreen', setup: 'HRSetupScreen' };
function AdminHRScreen() { return <CaEngine label="HR Center" title="HR Center" sub="People ops on the real roster" subs={CA_HR_SUBS} screen="hr" fallback="people" hubMap={{ 'hr-payroll': 'paycenter', 'hr-hiring': 'hiring', 'hr-projects': 'projects', 'hr-insights': 'insights', 'hr-audit': 'audit', 'hr-setup': 'setup' }} render={t => { const C = window[CA_HR_C[t]]; return C ? <C /> : null; }} />; }
function AdminUsersScreen() { return <CaEngine label="Users & Invites" title="Users & Invites" sub="Who can sign in to which app" subs={[{ id: 'users', label: 'Users' }]} screen="users" fallback="users" render={() => (window.UsersScreen ? <UsersScreen embedded /> : null)} />; }
const CA_APPR_SUBS = [{ id: 'appr', label: 'Approvals' }, { id: 'time', label: 'Timesheets' }, { id: 'pay', label: 'Payroll' }, { id: 'exp', label: 'Expenses & receipts' }];
const CA_APPR_C = { appr: 'ApprovalsScreen', time: 'TimesheetApprovalScreen', pay: 'PayrollScreen', exp: 'ExpenseApprovalScreen' };
function AdminApprovalsScreen() { return <CaEngine label="Approvals & Expenses" title="Approvals & Expenses" sub="One queue: AI drafts, timesheets, payroll, field expenses" subs={CA_APPR_SUBS} screen="approvals" fallback="appr" hubMap={{ timesheets: 'time', expenses: 'exp', payroll: 'pay' }} render={t => { const C = window[CA_APPR_C[t]]; return C ? <C /> : null; }} />; }
function AdminDocumentsScreen() { return <CaEngine label="Documents" title="Documents" sub="Shared storage for the whole team" subs={[{ id: 'all', label: 'All' }]} screen="documents" fallback="all" render={() => (window.DocumentsScreen ? <DocumentsScreen embedded /> : null)} />; }
const CA_SET_SUBS = [{ id: 'users', label: 'Users & roles' }, { id: 'account', label: 'Account' }, { id: 'billing', label: 'Billing' }, { id: 'privacy', label: 'Privacy' }, { id: 'fields', label: 'Custom fields' }, { id: 'resolution', label: 'Resolution center' }, { id: 'desktop', label: 'Desktop app' }, { id: 'updates', label: "What's new" }, { id: 'help', label: 'Help' }];
function AdminSettingsScreen() { return <CaEngine label="Portal Settings" title="Portal Settings" sub={(window.__shieldUser && window.__shieldUser.name) ? `Signed in as ${window.__shieldUser.name}${window.__shieldUser.role ? ' · ' + window.__shieldUser.role : ''}` : 'Not signed in'} subs={CA_SET_SUBS} screen="portal-settings" fallback="users" render={t => (window.PortalSettingsScreen ? <PortalSettingsScreen section={t} embedded /> : null)} />; }

Object.assign(window, { CareCustomersScreen, CareHelpdeskScreen, CareMessagesScreen, CaTicketDrawer, AdminTeamScreen, AdminHRScreen, AdminUsersScreen, AdminApprovalsScreen, AdminDocumentsScreen, AdminSettingsScreen });

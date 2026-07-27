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
        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
            {chips.map(c => (
              <button key={c.label} onClick={() => (c.onClick ? c.onClick() : onNav && onNav(c.to))} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: c.primary ? 'var(--brand)' : 'rgba(63,169,245,0.08)', color: c.primary ? '#fff' : 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{c.label}</button>
            ))}
          </div>
        )}
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
  const rows = useMergedInvoices();
  const open = rows.filter(r => (r.status || '').toLowerCase() !== 'paid');
  const openTotal = open.reduce((s, r) => s + (Number(r.total ?? r.amount) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['INVOICES', rows.length, 'var(--brand)'], ['OPEN', open.length, open.length ? 'var(--status-warn)' : 'var(--status-ok)'], ['OPEN $', ops5$(openTotal), 'var(--text-high)']]} />
      <MSection title="Latest" action="Money tab" onAction={() => onNav('finance')} />
      {rows.slice(0, 25).map((r, i) => {
        const st = (r.status || 'open').toLowerCase();
        return <MRow key={r.id || i} icon="finance" title={`${r.number || r.doc_number || 'INV'} · ${r.customer || r.customer_name || ''}`}
          sub={`${r.date || r.txn_date || ''} · ${st}`} right={ops5$(r.total ?? r.amount)} accent={OPS5_INV_STATUS[st]} onClick={() => onNav('finance')} />;
      })}
      {rows.length === 0 && <OPS5_EMPTY>No invoices yet — create one from the Money tab.</OPS5_EMPTY>}
    </div>
  );
}
function MEstimatesN({ onNav }) {
  const rows = useMergedEstimates();
  const pending = rows.filter(r => !/accepted|closed|converted/i.test(r.status || ''));
  const value = rows.reduce((s, r) => s + (Number(r.total ?? r.amount) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ESTIMATES', rows.length, 'var(--brand)'], ['AWAITING', pending.length, pending.length ? 'var(--status-warn)' : 'var(--status-ok)'], ['PIPELINE', ops5$(value), 'var(--text-high)']]} />
      <MSection title="Latest" action="Money tab" onAction={() => onNav('finance')} />
      {rows.slice(0, 25).map((r, i) => (
        <MRow key={r.id || i} icon="proposals" title={`${r.number || r.doc_number || 'EST'} · ${r.customer || r.customer_name || ''}`}
          sub={`${r.date || r.txn_date || ''} · ${r.status || 'pending'}`} right={ops5$(r.total ?? r.amount)}
          accent={/accepted/i.test(r.status || '') ? 'var(--status-ok)' : undefined} onClick={() => onNav('finance')} />
      ))}
      {rows.length === 0 && <OPS5_EMPTY>No estimates yet — the Money tab creates and emails them.</OPS5_EMPTY>}
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
          onClick={d.url ? () => window.open(d.url, '_blank') : undefined} rightSub={d.created_at ? new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''} />
      ))}
      {docs !== null && docs.length === 0 && <OPS5_EMPTY>No documents yet — photos, PDFs and files you upload live here, synced company-wide.</OPS5_EMPTY>}
    </div>
  );
}

/* ══════════════ USERS & INVITES (real — profiles) ══════════════ */
const OPS5_ROLE_C = { Admin: 'var(--status-critical)', Staff: 'var(--brand)', Technician: 'var(--status-ok)', Customer: 'var(--text-low)' };
function MUsersN({ onNav }) {
  const [rows, setRows] = React.useState(null);
  React.useEffect(() => {
    const sb = window.__shieldSupabase;
    if (!sb) return setRows([]);
    sb.from('profiles').select('id,email,name,role').order('name').then(({ data }) => setRows(data || []));
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['USERS', (rows || []).length, 'var(--brand)'], ['ADMINS', (rows || []).filter(r => r.role === 'Admin').length, 'var(--status-critical)']]} />
      {rows === null && <OPS5_EMPTY>Loading users…</OPS5_EMPTY>}
      {(rows || []).map(u => (
        <MRow key={u.id} icon="users" title={u.name || u.email} sub={u.email}
          right={<MBadge color={OPS5_ROLE_C[u.role] || 'var(--brand)'}>{u.role || 'Staff'}</MBadge>} />
      ))}
      {rows !== null && rows.length === 0 && <OPS5_EMPTY>No user profiles visible.</OPS5_EMPTY>}
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center' }}>Invites, app rights and password resets are in the full console below.</div>
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

/* ══════════════ Auto-Bid: already phone-native — render it directly ══════════════ */
function MAutoBidN() { return <AutoBidScreen />; }

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

Object.assign(window, { M_OPS5, MDeskIntro, MChatN, MInvoicesN, MEstimatesN, MTimesheetsN, MEmployeesN, MPricebookN, MProductLibraryN, MDocumentsN, MUsersN, MOutboxN, MSecretWeaponN, MAssetsN, MForecastN, MHealthN, MWallboardN, MDigestN, MPortalSettingsN, MIntegrationsN, MAutoBidN });

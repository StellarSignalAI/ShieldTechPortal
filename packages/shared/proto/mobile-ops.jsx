/* ShieldTech Mobile — Native Ops Screens (bespoke, store-backed, full parity + sync)
   Helpdesk · Incidents · Quote-to-Cash · Purchase Orders · Parts Requests
   Each reads/writes its shared store, so every action syncs to the desktop portal. */

const OPS_TECHS = { MR:{n:'Mike Reyes',c:'#3FA9F5'}, JL:{n:'Jessica Liu',c:'#34D399'}, KW:{n:'Kevin White',c:'#FBBF24'}, DP:{n:'Diana Patel',c:'#c084fc'}, TG:{n:'Tony Garcia',c:'#F43F5E'}, AL:{n:'Alex Lee',c:'#60a5fa'} };
const opsNow = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const PRI_COLOR = { critical:'var(--status-critical)', high:'var(--status-warn)', medium:'var(--brand)', low:'var(--text-low)', P1:'var(--status-critical)', P2:'var(--status-warn)', P3:'var(--brand)' };
const STATUS_COLOR = { open:'var(--status-warn)', 'in-progress':'var(--brand)', resolved:'var(--status-ok)', active:'var(--status-critical)' };

function OpsKpis({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
      {items.map(([l, v, c]) => (
        <div key={l} className="glass" style={{ padding: '11px 13px', borderRadius: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 3 }}>{l}</div>
          <div className="mono" style={{ fontSize: 19, fontWeight: 600, color: c || 'var(--text-high)', lineHeight: 1.1 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}
function TechAvatar({ id, size = 22 }) {
  const t = OPS_TECHS[id]; if (!t) return null;
  return <span style={{ width: size, height: size, borderRadius: '50%', background: `${t.c}26`, border: `1px solid ${t.c}66`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, color: t.c, flexShrink: 0 }}>{id}</span>;
}

/* ══════════════ HELPDESK ══════════════ */
function MHelpdesk({ onNav }) {
  const [tickets] = useShieldStore(ticketStore);
  const [filter, setFilter] = React.useState('Open');
  const [openId, setOpenId] = React.useState(null);
  const fmap = { Open:'open', 'In Progress':'in-progress', Resolved:'resolved' };
  const list = tickets.filter(t => filter === 'All' ? true : t.status === fmap[filter]);
  const open = tickets.filter(t => t.status !== 'resolved').length;
  const crit = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;
  const atRisk = tickets.filter(t => t.sla && t.sla.remaining <= 2 && t.status !== 'resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['OPEN', open, 'var(--status-warn)'], ['CRITICAL', crit, crit ? 'var(--status-critical)' : 'var(--text-low)'], ['SLA AT-RISK', atRisk, atRisk ? 'var(--status-critical)' : 'var(--status-ok)']]} />
      <MSegment options={['Open', 'In Progress', 'Resolved', 'All']} value={filter} onChange={setFilter} />
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No {filter.toLowerCase()} tickets.</div>}
      {list.map(t => {
        const pc = PRI_COLOR[t.priority];
        const slaPct = t.sla ? (1 - t.sla.remaining / t.sla.total) * 100 : 0;
        return (
          <div key={t.id} onClick={() => setOpenId(t.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${pc}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: pc, flexShrink: 0 }}></span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.id}</span>
              <MBadge color={STATUS_COLOR[t.status]}>{t.status}</MBadge>
              {t.assignee ? <span style={{ marginLeft: 'auto' }}><TechAvatar id={t.assignee} size={20} /></span> : <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--status-warn)', fontWeight: 600 }}>UNASSIGNED</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginBottom: 3 }}>{t.subject}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: t.status !== 'resolved' ? 7 : 0 }}>{t.customer} · {t.contact}</div>
            {t.status !== 'resolved' && t.sla && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}><MBar pct={slaPct} color={t.sla.remaining <= 2 ? 'var(--status-critical)' : t.sla.remaining <= 4 ? 'var(--status-warn)' : 'var(--status-ok)'} /></div>
                <span className="mono" style={{ fontSize: 9, color: t.sla.remaining <= 2 ? 'var(--status-critical)' : 'var(--text-low)' }}>{t.sla.remaining}h SLA</span>
              </div>
            )}
          </div>
        );
      })}
      {openId && <MTicketDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MTicketDetail({ id, onClose }) {
  const [tickets] = useShieldStore(ticketStore);
  const t = tickets.find(x => x.id === id);
  const [reply, setReply] = React.useState('');
  const [assignOpen, setAssignOpen] = React.useState(false);
  if (!t) return null;
  const pc = PRI_COLOR[t.priority];
  const upd = (patch) => ticketStore.set(list => list.map(x => x.id === id ? { ...x, ...patch } : x));
  const send = () => { if (!reply.trim()) return; upd({ thread: [...(t.thread || []), { from: 'You', time: opsNow(), msg: reply.trim(), system: false }] }); setReply(''); showToast('Reply sent — synced', 'ok'); };
  const resolve = () => { upd({ status: 'resolved', sla: t.sla ? { ...t.sla, remaining: 0 } : t.sla }); showToast(`${t.id} resolved`, 'ok'); onClose(); };
  const assign = (tid) => { upd({ assignee: tid, status: t.status === 'open' ? 'in-progress' : t.status }); setAssignOpen(false); showToast(`Assigned to ${OPS_TECHS[tid].n}`, 'ok'); };

  return (
    <MSheet title={t.id} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
            <MBadge color={pc}>{t.priority}</MBadge>
            <MBadge color={STATUS_COLOR[t.status]}>{t.status}</MBadge>
            {t.tags && t.tags.map(tag => <span key={tag} style={{ fontSize: 9, color: 'var(--text-low)', background: 'rgba(63,169,245,0.06)', borderRadius: 7, padding: '2px 7px' }}>#{tag}</span>)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{t.subject}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{t.customer} · {t.contact}{t.relatedAsset ? ` · ${t.relatedAsset}` : ''}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAssignOpen(v => !v)} style={{ flex: 1, padding: '10px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t.assignee ? `Reassign · ${t.assignee}` : 'Assign'}</button>
          {t.status !== 'resolved' && <button onClick={resolve} style={{ flex: 1, padding: '10px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, color: 'var(--status-ok)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Resolve</button>}
        </div>
        {assignOpen && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(OPS_TECHS).map(tid => (
              <button key={tid} onClick={() => assign(tid)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 5px', borderRadius: 16, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-mid)' }}><TechAvatar id={tid} size={18} />{OPS_TECHS[tid].n.split(' ')[0]}</button>
            ))}
          </div>
        )}

        {t.aiSuggestion && (
          <div style={{ background: 'linear-gradient(135deg, rgba(63,169,245,0.08), rgba(192,132,252,0.05))', border: '1px solid var(--border-strong)', borderRadius: 11, padding: '11px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}><Icon name="hermes" size={13} color="var(--brand)" /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.04em' }}>SHIELDTECH AI SUGGESTS</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.45 }}>{t.aiSuggestion}</div>
          </div>
        )}

        <MSection title="Conversation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(t.thread || []).map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'You' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {!m.system && <div style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 2, textAlign: m.from === 'You' ? 'right' : 'left' }}>{m.from} · {m.time}</div>}
                <div style={{ fontSize: 12, lineHeight: 1.4, padding: m.system ? '5px 10px' : '8px 11px', borderRadius: 10, background: m.system ? 'transparent' : m.from === 'You' ? 'rgba(63,169,245,0.14)' : 'var(--glass-bg)', border: m.system ? 'none' : '1px solid var(--border-subtle)', color: m.system ? 'var(--text-low)' : 'var(--text-high)', fontStyle: m.system ? 'italic' : 'normal', textAlign: m.system ? 'center' : 'left' }}>{m.msg}</div>
              </div>
            ))}
          </div>
        </MSection>

        {t.status !== 'resolved' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Type a reply…" style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 13px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
            <button onClick={send} style={{ padding: '0 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send</button>
          </div>
        )}
      </div>
    </MSheet>
  );
}

/* ══════════════ INCIDENTS ══════════════ */
function MIncidents({ onNav }) {
  const [incidents] = useShieldStore(incidentStore);
  const [filter, setFilter] = React.useState('Active');
  const [openId, setOpenId] = React.useState(null);
  const list = incidents.filter(i => filter === 'All' ? true : filter === 'Active' ? i.status === 'active' : i.status === 'resolved');
  const active = incidents.filter(i => i.status === 'active').length;
  const p1 = incidents.filter(i => i.severity === 'P1' && i.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACTIVE', active, active ? 'var(--status-critical)' : 'var(--status-ok)'], ['P1 OPEN', p1, p1 ? 'var(--status-critical)' : 'var(--text-low)'], ['TOTAL', incidents.length, 'var(--brand)']]} />
      <MSegment options={['Active', 'Resolved', 'All']} value={filter} onChange={setFilter} />
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No {filter.toLowerCase()} incidents.</div>}
      {list.map(inc => {
        const sc = PRI_COLOR[inc.severity];
        const done = inc.playbook.filter(s => s.done).length;
        const mins = Math.floor((Date.now() - inc.openedAt) / 60000);
        const age = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
        return (
          <div key={inc.id} onClick={() => setOpenId(inc.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${sc}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <MBadge color={sc}>{inc.severity}</MBadge>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{inc.id}</span>
              <MBadge color={STATUS_COLOR[inc.status] || 'var(--status-ok)'}>{inc.status}</MBadge>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>{inc.status === 'active' ? age : 'closed'}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginBottom: 3 }}>{inc.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 7 }}>{inc.customer} · {inc.type} · {inc.assignee}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}><MBar pct={(done / inc.playbook.length) * 100} color={done === inc.playbook.length ? 'var(--status-ok)' : sc} /></div>
              <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{done}/{inc.playbook.length} steps</span>
            </div>
          </div>
        );
      })}
      {openId && <MIncidentDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MIncidentDetail({ id, onClose }) {
  const [incidents] = useShieldStore(incidentStore);
  const inc = incidents.find(x => x.id === id);
  if (!inc) return null;
  const sc = PRI_COLOR[inc.severity];
  const done = inc.playbook.filter(s => s.done).length;
  const upd = (patch) => incidentStore.set(list => list.map(x => x.id === id ? { ...x, ...patch } : x));
  const toggle = (i) => upd({ playbook: inc.playbook.map((s, k) => k === i ? { ...s, done: !s.done } : s) });
  const resolve = () => { upd({ status: 'resolved' }); showToast(`${inc.id} resolved`, 'ok'); onClose(); };

  return (
    <MSheet title={inc.id} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <MBadge color={sc}>{inc.severity} · {inc.severity === 'P1' ? 'Critical' : inc.severity === 'P2' ? 'High' : 'Medium'}</MBadge>
            <MBadge color={STATUS_COLOR[inc.status] || 'var(--status-ok)'}>{inc.status}</MBadge>
            {inc.relatedTicket && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--brand)' }}>↔ {inc.relatedTicket}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{inc.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{inc.customer} · {inc.type} · {inc.assignee}</div>
        </div>

        {inc.severity === 'P1' && inc.status === 'active' && (
          <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 11, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--status-critical)', fontWeight: 600, flex: 1 }}>P1 incident — on-call manager paging enabled</span>
            <button onClick={() => showToast('On-call manager paged', 'warn')} style={{ padding: '7px 13px', background: 'var(--status-critical)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Page</button>
          </div>
        )}

        <MSection title={`Response Playbook · ${done}/${inc.playbook.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inc.playbook.map((s, i) => (
              <button key={i} onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: s.done ? 'rgba(52,211,153,0.06)' : 'var(--glass-bg)', border: `1px solid ${s.done ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${s.done ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: s.done ? 'var(--status-ok)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06281c', fontSize: 12, fontWeight: 800 }}>{s.done ? '✓' : ''}</span>
                <span style={{ fontSize: 12.5, color: s.done ? 'var(--text-low)' : 'var(--text-high)', textDecoration: s.done ? 'line-through' : 'none', lineHeight: 1.35 }}>{s.step}</span>
              </button>
            ))}
          </div>
        </MSection>

        {inc.status === 'active' && (
          <button onClick={resolve} disabled={done < inc.playbook.length} style={{ padding: '13px 0', background: done < inc.playbook.length ? 'rgba(148,163,184,0.08)' : 'linear-gradient(135deg, var(--status-ok), #1f9d6b)', border: 'none', borderRadius: 11, color: done < inc.playbook.length ? 'var(--text-low)' : '#fff', fontSize: 14, fontWeight: 600, cursor: done < inc.playbook.length ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>{done < inc.playbook.length ? `Complete all steps to resolve (${inc.playbook.length - done} left)` : '✓ Resolve Incident'}</button>
        )}
      </div>
    </MSheet>
  );
}

/* ══════════════ QUOTE-TO-CASH ══════════════ */
const QTC_STAGES = [['quote','Quote'],['approved','Approved'],['po','PO Issued'],['scheduled','Scheduled'],['installed','Installed'],['invoiced','Invoiced'],['paid','Paid']];
const QTC_RISK = { low:'var(--status-ok)', medium:'var(--status-warn)', high:'var(--status-critical)' };
function MQuoteToCash({ onNav }) {
  const [deals] = useShieldStore(qtcStore);
  const [stage, setStage] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const stageLabel = (s) => (QTC_STAGES.find(x => x[0] === s) || [s, s])[1];
  const pipeline = deals.filter(d => !['paid'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const won = deals.filter(d => d.stage === 'paid').reduce((s, d) => s + d.value, 0);
  const list = stage === 'All' ? deals : deals.filter(d => d.stage === stage);
  const segOpts = ['All', ...QTC_STAGES.map(s => s[1])];
  const labelToStage = (l) => l === 'All' ? 'All' : (QTC_STAGES.find(x => x[1] === l) || [l])[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['PIPELINE', `$${(pipeline / 1000).toFixed(0)}K`, 'var(--brand)'], ['WON YTD', `$${(won / 1000).toFixed(0)}K`, 'var(--status-ok)'], ['DEALS', list.length, 'var(--text-high)']]} />
      <MSegment options={segOpts} value={stage === 'All' ? 'All' : stageLabel(stage)} onChange={l => setStage(labelToStage(l))} />
      {list.sort((a, b) => b.value - a.value).map(d => (
        <div key={d.id} onClick={() => setOpenId(d.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${QTC_RISK[d.risk]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 1 }}>{d.contact} · {d.age}d in stage</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${(d.value / 1000).toFixed(0)}K</div>
              <MBadge color={d.stage === 'paid' ? 'var(--status-ok)' : 'var(--brand)'}>{stageLabel(d.stage)}</MBadge>
            </div>
          </div>
          {d.risk === 'high' && <div style={{ fontSize: 10, color: 'var(--status-critical)', marginTop: 6 }}>⚠ High risk · {d.age}d stalled — needs attention</div>}
        </div>
      ))}
      {openId && <MDealDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MDealDetail({ id, onClose }) {
  const [deals] = useShieldStore(qtcStore);
  const d = deals.find(x => x.id === id);
  if (!d) return null;
  const idx = QTC_STAGES.findIndex(s => s[0] === d.stage);
  const next = QTC_STAGES[idx + 1];
  const advance = () => { qtcStore.set(list => list.map(x => x.id === id ? { ...x, stage: next[0], age: 0 } : x)); showToast(`${d.name} → ${next[1]}`, 'ok'); };

  return (
    <MSheet title={d.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-high)' }}>${d.value.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{d.id} · {d.contact}</div>
          </div>
          <MBadge color={QTC_RISK[d.risk]}>{d.risk} risk</MBadge>
        </div>

        {/* Stage tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {QTC_STAGES.map((s, i) => {
            const state = i < idx ? 'done' : i === idx ? 'current' : 'future';
            const c = state === 'done' ? 'var(--status-ok)' : state === 'current' ? 'var(--brand)' : 'var(--text-low)';
            return (
              <div key={s[0]} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${c}`, background: state === 'done' ? 'var(--status-ok)' : state === 'current' ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#08131f' }}>{state === 'done' ? '✓' : ''}</span>
                <span style={{ fontSize: 12.5, fontWeight: state === 'current' ? 600 : 400, color: state === 'future' ? 'var(--text-low)' : 'var(--text-high)' }}>{s[1]}</span>
                {state === 'current' && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--brand)' }}>{d.age}d here</span>}
              </div>
            );
          })}
        </div>

        {next
          ? <button onClick={advance} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Advance → {next[1]}</button>
          : <div style={{ padding: '13px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', borderRadius: 11 }}>✓ Deal closed & paid</div>}
      </div>
    </MSheet>
  );
}

/* ══════════════ PURCHASE ORDERS ══════════════ */
const PO_STATUS = { draft:'var(--text-low)', sent:'var(--brand)', partial:'var(--status-warn)', received:'var(--status-ok)' };
function MPurchaseOrders({ onNav }) {
  const [pos] = useShieldStore(poStore);
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const list = filter === 'All' ? pos : pos.filter(p => p.status === filter.toLowerCase());
  const inFlight = pos.filter(p => p.status !== 'received').reduce((s, p) => s + p.total, 0);
  const received = pos.filter(p => p.status === 'received').reduce((s, p) => s + p.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['TOTAL POS', pos.length, 'var(--text-high)'], ['IN-FLIGHT', `$${(inFlight / 1000).toFixed(1)}K`, 'var(--status-warn)'], ['RECEIVED', `$${(received / 1000).toFixed(1)}K`, 'var(--status-ok)']]} />
      <MSegment options={['All', 'Draft', 'Sent', 'Partial', 'Received']} value={filter} onChange={setFilter} />
      {list.map(p => {
        const recv = p.items.reduce((s, i) => s + i.received, 0);
        const tot = p.items.reduce((s, i) => s + i.qty, 0);
        return (
          <div key={p.id} onClick={() => setOpenId(p.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${PO_STATUS[p.status]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>{p.id}</span>
              <MBadge color={PO_STATUS[p.status]}>{p.status}</MBadge>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${p.total.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{p.vendor}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: p.status === 'partial' ? 7 : 0 }}>{p.date} · {p.items.length} line items · {recv}/{tot} units received</div>
            {p.status === 'partial' && <MBar pct={(recv / tot) * 100} color="var(--status-warn)" />}
          </div>
        );
      })}
      {openId && <MPODetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MPODetail({ id, onClose }) {
  const [pos] = useShieldStore(poStore);
  const p = pos.find(x => x.id === id);
  if (!p) return null;
  const upd = (patch) => poStore.set(list => list.map(x => x.id === id ? { ...x, ...patch } : x));
  const receiveAll = () => { upd({ status: 'received', items: p.items.map(i => ({ ...i, received: i.qty })) }); showToast(`${p.id} fully received — synced`, 'ok'); };
  const send = () => { upd({ status: 'sent' }); showToast(`${p.id} sent to ${p.vendor}`, 'ok'); };

  return (
    <MSheet title={p.id} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{p.vendor}</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{p.date} · {p.items.length} line items</div>
          </div>
          <MBadge color={PO_STATUS[p.status]}>{p.status}</MBadge>
        </div>

        <MSection title="Line Items">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {p.items.map((it, i) => (
              <div key={i} className="glass" style={{ padding: '10px 12px', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{it.desc}</div>
                    <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{it.sku} · ${it.unit}/ea</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>${(it.qty * it.unit).toLocaleString()}</div>
                    <div className="mono" style={{ fontSize: 9, color: it.received === it.qty ? 'var(--status-ok)' : 'var(--status-warn)' }}>{it.received}/{it.qty} recv</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MSection>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '0 2px' }}>
          <span style={{ color: 'var(--text-low)' }}>Total</span>
          <span className="mono" style={{ fontWeight: 700, color: 'var(--text-high)' }}>${p.total.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {p.status === 'draft' && <button onClick={send} style={{ flex: 1, padding: '12px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send to Vendor</button>}
          {p.status !== 'received' && p.status !== 'draft' && <button onClick={receiveAll} style={{ flex: 1, padding: '12px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, color: 'var(--status-ok)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Receive All</button>}
          {p.status === 'received' && <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', borderRadius: 10 }}>✓ Fully received</div>}
        </div>
      </div>
    </MSheet>
  );
}

/* ══════════════ PARTS REQUESTS ══════════════ */
const PR_STATUS = ['requested','approved','picking','shipped','delivered'];
const PR_COLOR = { requested:'var(--status-warn)', approved:'var(--brand)', picking:'#c084fc', shipped:'#60a5fa', delivered:'var(--status-ok)' };
const PR_URGENCY = { urgent:'var(--status-critical)', normal:'var(--text-low)', low:'var(--text-low)' };
function MPartsReq({ onNav }) {
  const [reqs] = useShieldStore(partsReqStore);
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const list = filter === 'All' ? reqs : reqs.filter(r => r.status === filter.toLowerCase());
  const pending = reqs.filter(r => r.status === 'requested').length;
  const urgent = reqs.filter(r => r.urgency === 'urgent' && r.status !== 'delivered').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['REQUESTS', reqs.length, 'var(--text-high)'], ['PENDING', pending, pending ? 'var(--status-warn)' : 'var(--status-ok)'], ['URGENT', urgent, urgent ? 'var(--status-critical)' : 'var(--text-low)']]} />
      <MSegment options={['All', 'Requested', 'Approved', 'Picking', 'Shipped', 'Delivered']} value={filter} onChange={setFilter} />
      {list.map(r => (
        <div key={r.id} onClick={() => setOpenId(r.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${PR_COLOR[r.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TechAvatar id={r.tech} size={20} />
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.id}</span>
            <MBadge color={PR_COLOR[r.status]}>{r.status}</MBadge>
            {r.urgency === 'urgent' && <MBadge color="var(--status-critical)">urgent</MBadge>}
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-low)' }}>{r.submitted}</span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{r.parts.map(pt => `${pt.qty}× ${pt.name}`).join(', ')}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.job}</div>
        </div>
      ))}
      {openId && <MPartsReqDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MPartsReqDetail({ id, onClose }) {
  const [reqs] = useShieldStore(partsReqStore);
  const r = reqs.find(x => x.id === id);
  if (!r) return null;
  const idx = PR_STATUS.indexOf(r.status);
  const next = PR_STATUS[idx + 1];
  const upd = (patch) => partsReqStore.set(list => list.map(x => x.id === id ? { ...x, ...patch } : x));
  const advance = () => { upd({ status: next }); showToast(`${r.id} → ${next}`, 'ok'); };

  return (
    <MSheet title={r.id} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TechAvatar id={r.tech} size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>{r.techName}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.job}</div>
          </div>
          <MBadge color={PR_COLOR[r.status]}>{r.status}</MBadge>
        </div>

        {r.notes && <div style={{ fontSize: 12, color: 'var(--text-mid)', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '9px 12px' }}>{r.notes}</div>}

        <MSection title="Parts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {r.parts.map((pt, i) => (
              <div key={i} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10 }}>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{pt.qty}×</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, color: 'var(--text-high)' }}>{pt.name}</div></div>
                <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{pt.sku}</span>
              </div>
            ))}
          </div>
        </MSection>

        {/* status tracker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {PR_STATUS.map((s, i) => (
            <React.Fragment key={s}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: i <= idx ? PR_COLOR[r.status] : 'var(--border-strong)', flexShrink: 0 }}></span>
              {i < PR_STATUS.length - 1 && <span style={{ flex: 1, height: 2, background: i < idx ? PR_COLOR[r.status] : 'var(--border-strong)' }}></span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', textTransform: 'capitalize', marginTop: -6 }}>
          {PR_STATUS.map(s => <span key={s}>{s}</span>)}
        </div>

        {next
          ? <button onClick={advance} style={{ padding: '13px 0', background: r.status === 'requested' ? 'rgba(52,211,153,0.1)' : 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: r.status === 'requested' ? '1px solid rgba(52,211,153,0.3)' : 'none', borderRadius: 11, color: r.status === 'requested' ? 'var(--status-ok)' : '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{r.status === 'requested' ? '✓ Approve Request' : `Mark ${next}`}</button>
          : <div style={{ padding: '13px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', borderRadius: 11 }}>✓ Delivered to tech</div>}
      </div>
    </MSheet>
  );
}

Object.assign(window, { MHelpdesk, MIncidents, MQuoteToCash, MPurchaseOrders, MPartsReq, OpsKpis, TechAvatar, OPS_TECHS, opsNow });

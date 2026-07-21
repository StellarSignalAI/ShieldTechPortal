/* ShieldTech Mobile — Native Ops Screens II
   MRR/Subscriptions · NPS · Skills Matrix · Knowledge Base · Warranty
   Store-backed screens sync live to the desktop portal. */

/* ══════════════ MRR / SUBSCRIPTIONS ══════════════ */
const MRR_RISK = { low:'var(--status-ok)', medium:'var(--status-warn)', high:'var(--status-critical)' };
const MRR_STATUS = { active:'var(--status-ok)', 'at-risk':'var(--status-critical)', pending:'var(--status-warn)' };
function MMRR({ onNav }) {
  const [subs] = useShieldStore(mrrStore);
  const [filter, setFilter] = React.useState('All');
  const [openC, setOpenC] = React.useState(null);
  const live = subs.filter(s => !s.churned);
  const total = live.filter(s => s.status === 'active').reduce((a, s) => a + s.mrr, 0);
  const atRisk = live.filter(s => s.risk !== 'low').reduce((a, s) => a + s.mrr, 0);
  const fmap = { Active:'active', 'At-Risk':'at-risk', Pending:'pending' };
  const list = filter === 'All' ? live : live.filter(s => s.status === fmap[filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['MRR', `$${(total / 1000).toFixed(1)}K`, 'var(--brand)'], ['ARR', `$${(total * 12 / 1000).toFixed(0)}K`, 'var(--status-ok)'], ['AT-RISK', `$${(atRisk / 1000).toFixed(1)}K`, atRisk ? 'var(--status-warn)' : 'var(--text-low)']]} />
      <MSegment options={['All', 'Active', 'At-Risk', 'Pending']} value={filter} onChange={setFilter} />
      {list.sort((a, b) => b.mrr - a.mrr).map(s => (
        <div key={s.customer} onClick={() => setOpenC(s.customer)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${MRR_RISK[s.risk]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.customer}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 1 }}>{s.plan} · renews {s.renewal}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>${(s.mrr / 1000).toFixed(1)}K</div>
              <MBadge color={MRR_STATUS[s.status]}>{s.status}</MBadge>
            </div>
          </div>
          {s.risk !== 'low' && <div style={{ fontSize: 10, color: MRR_RISK[s.risk], marginTop: 6 }}>⚠ {s.risk === 'high' ? 'High' : 'Medium'} churn risk — proactive outreach advised</div>}
        </div>
      ))}
      {openC && <MMRRDetail customer={openC} onClose={() => setOpenC(null)} onNav={onNav} />}
    </div>
  );
}
function MMRRDetail({ customer, onClose, onNav }) {
  const [subs] = useShieldStore(mrrStore);
  const s = subs.find(x => x.customer === customer);
  if (!s) return null;
  const setRisk = (risk, status) => { mrrStore.set(list => list.map(x => x.customer === customer ? { ...x, risk, status: status || x.status } : x)); showToast(`${customer} updated — synced`, 'ok'); };
  return (
    <MSheet title={customer} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-high)' }}>${s.mrr.toLocaleString()}<span style={{ fontSize: 13, color: 'var(--text-low)', fontWeight: 400 }}>/mo</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{s.plan}</div>
          </div>
          <MBadge color={MRR_STATUS[s.status]}>{s.status}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          {[['ANNUAL', `$${(s.mrr * 12 / 1000).toFixed(0)}K`], ['RENEWS', s.renewal], ['RISK', s.risk]].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '9px 11px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div className="mono" style={{ fontSize: 13, color: k === 'RISK' ? MRR_RISK[s.risk] : 'var(--text-mid)', textTransform: 'capitalize' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {s.risk !== 'low'
            ? <button onClick={() => setRisk('low', 'active')} style={{ flex: 1, padding: '11px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, color: 'var(--status-ok)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Clear Risk</button>
            : <button onClick={() => setRisk('high', 'at-risk')} style={{ flex: 1, padding: '11px 0', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, color: 'var(--status-critical)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Flag At-Risk</button>}
          <button onClick={() => { onClose(); onNav && onNav('nps'); }} style={{ flex: 1, padding: '11px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View NPS</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ══════════════ NPS ══════════════ */
const NPS_CAT = { promoter:'var(--status-ok)', passive:'var(--status-warn)', detractor:'var(--status-critical)' };
function MNPS({ onNav }) {
  const [responses] = useShieldStore(npsStore);
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const promoters = responses.filter(r => r.category === 'promoter').length;
  const detractors = responses.filter(r => r.category === 'detractor').length;
  const nps = responses.length ? Math.round(((promoters - detractors) / responses.length) * 100) : 0;
  const fmap = { Promoters:'promoter', Passives:'passive', Detractors:'detractor' };
  const list = filter === 'All' ? responses : responses.filter(r => r.category === fmap[filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['NPS SCORE', nps, nps >= 50 ? 'var(--status-ok)' : nps >= 0 ? 'var(--status-warn)' : 'var(--status-critical)'], ['PROMOTERS', promoters, 'var(--status-ok)'], ['DETRACTORS', detractors, detractors ? 'var(--status-critical)' : 'var(--text-low)']]} />
      <MSegment options={['All', 'Promoters', 'Passives', 'Detractors']} value={filter} onChange={setFilter} />
      {list.map(r => (
        <div key={r.id} onClick={() => setOpenId(r.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${NPS_CAT[r.category]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: `${NPS_CAT[r.category]}1c`, border: `1px solid ${NPS_CAT[r.category]}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: NPS_CAT[r.category] }} className="mono">{r.score}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{r.customer}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.contact} · {r.job} · {r.date}</div>
            </div>
            {!r.followedUp && r.category !== 'promoter' && <MBadge color="var(--status-warn)">follow up</MBadge>}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{r.comment}"</div>
        </div>
      ))}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No survey responses yet.</div>}
      {openId && <MNPSDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MNPSDetail({ id, onClose }) {
  const [responses] = useShieldStore(npsStore);
  const r = responses.find(x => x.id === id);
  if (!r) return null;
  const followUp = () => { npsStore.set(list => list.map(x => x.id === id ? { ...x, followedUp: true } : x)); showToast('Marked followed-up — synced', 'ok'); };
  return (
    <MSheet title={r.customer} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 52, height: 52, borderRadius: 14, background: `${NPS_CAT[r.category]}1c`, border: `1px solid ${NPS_CAT[r.category]}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22, fontWeight: 700, color: NPS_CAT[r.category] }} className="mono">{r.score}</span>
          <div style={{ flex: 1 }}>
            <MBadge color={NPS_CAT[r.category]}>{r.category}</MBadge>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 4 }}>{r.contact} · {r.job} · {r.date}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 11, padding: '13px 15px' }}>"{r.comment}"</div>
        {r.followedUp
          ? <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', borderRadius: 11 }}>✓ Followed up</div>
          : <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={followUp} style={{ flex: 2, padding: '12px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Mark Followed-Up</button>
              <button onClick={() => showToast('Opening call…', 'ok')} style={{ flex: 1, padding: '12px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Call</button>
            </div>}
      </div>
    </MSheet>
  );
}

/* ══════════════ SKILLS MATRIX ══════════════ */
const SKILL_TECHS = [];
const SKILL_GROUPS = [
  { group:'Camera Systems', skills:[['axis-cert','Axis Certified'],['hik-cert','Hikvision Cert'],['ip-config','IP Camera Config'],['nvr-setup','NVR/DVR Setup']] },
  { group:'Access Control', skills:[['hid-cert','HID Certified'],['lenel-cert','Lenel S2 Cert'],['door-hardware','Door Hardware']] },
  { group:'Alarm & Fire', skills:[['nicet-ii','NICET Level II'],['bosch-cert','Bosch Certified'],['dsc-cert','DSC PowerSeries'],['fire-panel','Fire Panel Config']] },
  { group:'Networking', skills:[['network-config','Network Config'],['poe-install','PoE Installation'],['fiber-splice','Fiber Splicing']] },
  { group:'Compliance', skills:[['c7-license','CA C-7 License'],['hipaa-aware','HIPAA Awareness'],['low-voltage','Low Voltage Cert']] },
];
const SKILL_LEVELS = [
  { bg:'rgba(92,111,134,0.12)', color:'var(--text-low)', sym:'·' },
  { bg:'rgba(63,169,245,0.14)', color:'var(--brand)', sym:'1' },
  { bg:'rgba(251,191,36,0.16)', color:'var(--status-warn)', sym:'2' },
  { bg:'rgba(52,211,153,0.18)', color:'var(--status-ok)', sym:'★' },
];
function MSkills({ onNav }) {
  const [matrix, setMatrix] = useShieldStore(skillsStore);
  const [group, setGroup] = React.useState('Camera Systems');
  const allSkills = SKILL_GROUPS.flatMap(g => g.skills);
  const gaps = SKILL_TECHS.length ? allSkills.filter(([sid]) => SKILL_TECHS.filter(t => (matrix[t.id] || {})[sid] === 3).length < 2) : [];
  const cur = SKILL_GROUPS.find(g => g.group === group);
  const cycle = (tid, sid) => setMatrix(m => ({ ...m, [tid]: { ...m[tid], [sid]: (((m[tid] || {})[sid] || 0) + 1) % 4 } }));

  if (SKILL_TECHS.length === 0) {
    return <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No technicians yet — invite team members to build the skills matrix.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tech overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
        {SKILL_TECHS.map(t => {
          const vals = Object.values(matrix[t.id] || {});
          const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          const experts = vals.filter(v => v === 3).length;
          return (
            <div key={t.id} className="glass" style={{ padding: '10px', borderRadius: 11, textAlign: 'center' }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: `${t.color}26`, border: `1px solid ${t.color}66`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: t.color, marginBottom: 5 }}>{t.id}</span>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name.split(' ')[0]}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{experts}★ · {(avg / 3 * 100).toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      {gaps.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 11, padding: '11px 13px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-warn)', marginBottom: 4 }}>⚠ {gaps.length} skills need 2+ experts</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>{gaps.map(g => g[1]).join(' · ')}</div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Tap any cell to cycle proficiency · syncs live</div>
      <MSegment options={SKILL_GROUPS.map(g => g.group)} value={group} onChange={setGroup} />

      {cur.skills.map(([sid, sname]) => (
        <div key={sid} className="glass" style={{ padding: '11px 13px', borderRadius: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 8 }}>{sname}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {SKILL_TECHS.map(t => {
              const lv = (matrix[t.id] || {})[sid] || 0;
              const ls = SKILL_LEVELS[lv];
              return (
                <button key={t.id} onClick={() => cycle(t.id, sid)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>
                  <span style={{ fontSize: 8, color: 'var(--text-low)', fontWeight: 600 }}>{t.id}</span>
                  <span style={{ width: '100%', height: 30, borderRadius: 8, background: ls.bg, border: `1px solid ${ls.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: ls.color }}>{ls.sym}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 9, color: 'var(--text-low)', flexWrap: 'wrap' }}>
        {[['·', 'None'], ['1', 'Basic'], ['2', 'Proficient'], ['★', 'Expert']].map(([s, l]) => <span key={l}>{s} {l}</span>)}
      </div>
    </div>
  );
}

/* ══════════════ KNOWLEDGE BASE ══════════════ */
const KB_CATS = [['all','All'],['install','Installation'],['troubleshoot','Troubleshooting'],['config','Configuration'],['compliance','Compliance'],['vendor','Vendor Guides']];
const KB_ARTICLES = [];
function MKnowledge({ onNav }) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const catId = (KB_CATS.find(c => c[1] === cat) || ['all'])[0];
  const list = KB_ARTICLES.filter(a => (catId === 'all' || a.category === catId) && (a.title + ' ' + a.tags.join(' ')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the knowledge base…" style={{ background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 14px', color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
      <MSegment options={KB_CATS.map(c => c[1])} value={cat} onChange={setCat} />
      {list.map(a => (
        <div key={a.id} onClick={() => setOpenId(a.id)} className="glass" style={{ padding: '13px 14px', borderRadius: 12, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <MBadge>{(KB_CATS.find(c => c[0] === a.category) || ['', a.category])[1]}</MBadge>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--status-warn)' }}>★ {a.rating}</span>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3, marginBottom: 4 }}>{a.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>{a.summary}</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{a.author} · {a.updated} · {a.readTime} · {a.views} views</div>
        </div>
      ))}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No articles yet.</div>}
      {openId && <MKBDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MKBDetail({ id, onClose }) {
  const a = KB_ARTICLES.find(x => x.id === id);
  if (!a) return null;
  return (
    <MSheet title={a.title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.author} · {a.updated} · {a.readTime} · ★ {a.rating}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{a.tags.map(t => <span key={t} style={{ fontSize: 10, color: 'var(--brand)', background: 'rgba(63,169,245,0.06)', borderRadius: 7, padding: '2px 8px' }}>#{t}</span>)}</div>
        <div style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.6 }}>
          {a.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', margin: '8px 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{line.slice(3)}</div>;
            if (/^\d+\.\s/.test(line) || line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 8, color: 'var(--text-mid)', margin: '2px 0' }}>{line}</div>;
            if (!line.trim()) return <div key={i} style={{ height: 4 }}></div>;
            return <div key={i} style={{ color: 'var(--text-mid)' }}>{line}</div>;
          })}
        </div>
        <button onClick={() => showToast('Sent to your saved articles', 'ok')} style={{ padding: '12px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>☆ Save for offline</button>
      </div>
    </MSheet>
  );
}

/* ══════════════ WARRANTY ══════════════ */
const WARRANTY_ASSETS = [];
const warrStatus = (end) => { const d = (end - Date.now()) / 86400000; return d < 0 ? 'expired' : d < 90 ? 'expiring' : 'active'; };
const WARR_COLOR = { active:'var(--status-ok)', expiring:'var(--status-warn)', expired:'var(--status-critical)' };
function MWarranty({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const withStatus = WARRANTY_ASSETS.map(a => ({ ...a, status: warrStatus(a.warrantyEnd) }));
  const active = withStatus.filter(a => a.status === 'active').length;
  const expiring = withStatus.filter(a => a.status === 'expiring').length;
  const expired = withStatus.filter(a => a.status === 'expired').length;
  const list = filter === 'All' ? withStatus : withStatus.filter(a => a.status === filter.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACTIVE', active, 'var(--status-ok)'], ['EXPIRING', expiring, expiring ? 'var(--status-warn)' : 'var(--text-low)'], ['EXPIRED', expired, expired ? 'var(--status-critical)' : 'var(--text-low)']]} />
      <MSegment options={['All', 'Active', 'Expiring', 'Expired']} value={filter} onChange={setFilter} />
      {list.sort((a, b) => a.warrantyEnd - b.warrantyEnd).map(a => (
        <div key={a.id} onClick={() => setOpenId(a.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${WARR_COLOR[a.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.id}</span>
            <MBadge>{a.type}</MBadge>
            <MBadge color={WARR_COLOR[a.status]}>{a.status}</MBadge>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{a.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.customer} · {a.site} · ends {a.warrantyEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        </div>
      ))}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No assets tracked yet.</div>}
      {openId && <MWarrantyDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MWarrantyDetail({ id, onClose }) {
  const a = { ...WARRANTY_ASSETS.find(x => x.id === id) };
  if (!a.id) return null;
  a.status = warrStatus(a.warrantyEnd);
  const days = Math.round((a.warrantyEnd - Date.now()) / 86400000);
  const specs = [['Type', a.type], ['Serial', a.serial], ['Customer', a.customer], ['Site', a.site], ['Installed', a.installed], ['Warranty ends', a.warrantyEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })], ['Value', `$${a.value}`], ['Remaining', a.status === 'expired' ? `${Math.abs(days)}d ago` : `${days}d`]];
  return (
    <MSheet title={a.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)', flex: 1 }}>{a.id}</span>
          <MBadge color={WARR_COLOR[a.status]}>{a.status}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {specs.map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div className="mono" style={{ fontSize: 12, color: k === 'Remaining' ? WARR_COLOR[a.status] : 'var(--text-mid)' }}>{v}</div>
            </div>
          ))}
        </div>
        {a.status !== 'active' && <button onClick={() => { showToast('Renewal quote drafted — synced', 'ok'); onClose(); }} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Renewal Quote</button>}
      </div>
    </MSheet>
  );
}

Object.assign(window, { MMRR, MNPS, MSkills, MKnowledge, MWarranty });

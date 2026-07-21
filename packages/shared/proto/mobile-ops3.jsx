/* ShieldTech Mobile — Native Ops Screens III
   Site Photos · Punch List · Subcontractors · Projects · Proposals
   Photo & Punch screens are store-backed and sync live to the desktop portal. */

const phLook = (l) => `linear-gradient(150deg, hsl(${l.h} 32% 22%), hsl(${(l.h + 25) % 360} 28% 12%))`;
const PH_PHASE = { before:'#94A3B8', progress:'var(--brand)', after:'var(--status-ok)', issue:'var(--status-critical)' };

/* ══════════════ SITE PHOTOS ══════════════ */
function MPhotos({ onNav }) {
  const [photos] = useShieldStore(photoStore);
  const [phase, setPhase] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const fmap = { Before:'before', Progress:'progress', After:'after', Issues:'issue' };
  const list = phase === 'All' ? photos : photos.filter(p => p.phase === fmap[phase]);
  const issues = photos.filter(p => p.phase === 'issue').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['PHOTOS', photos.length, 'var(--brand)'], ['JOBS', new Set(photos.map(p => p.wo)).size, 'var(--text-high)'], ['ISSUES', issues, issues ? 'var(--status-critical)' : 'var(--status-ok)']]} />
      <MSegment options={['All', 'Before', 'Progress', 'After', 'Issues']} value={phase} onChange={setPhase} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {list.map(p => (
          <div key={p.id} onClick={() => setOpenId(p.id)} className="glass" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', borderColor: p.phase === 'issue' ? 'rgba(244,63,94,0.35)' : 'var(--border-subtle)' }}>
            <div style={{ height: 96, background: phLook(p.look), position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ position: 'absolute', top: 6, left: 6 }}><span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', background: `${PH_PHASE[p.phase]}cc`, borderRadius: 6, padding: '2px 7px' }}>{p.phase}</span></div>
              {p.annotations && p.annotations.length > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: 'var(--status-critical)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.annotations.length}</div>}
              <div style={{ width: '100%', padding: '14px 8px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}><span className="mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>{p.time}</span></div>
            </div>
            <div style={{ padding: '7px 9px' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.customer}</div>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No site photos yet.</div>}
      {openId && <MPhotoDetail id={openId} onClose={() => setOpenId(null)} onNav={onNav} />}
    </div>
  );
}
function MPhotoDetail({ id, onClose, onNav }) {
  const [photos] = useShieldStore(photoStore);
  const p = photos.find(x => x.id === id);
  if (!p) return null;
  const pair = p.pair ? photos.filter(x => x.pair === p.pair && x.id !== p.id) : [];
  return (
    <MSheet title={p.label} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ height: 200, borderRadius: 12, background: phLook(p.look), position: 'relative', border: '1px solid var(--border-subtle)' }}>
          {(p.annotations || []).map((an, i) => (
            <div key={i} style={{ position: 'absolute', left: `${an.x}%`, top: `${an.y}%`, transform: 'translate(-50%,-50%)' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-critical)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 8, left: 10 }}><MBadge color={PH_PHASE[p.phase]}>{p.phase}</MBadge></div>
        </div>
        {(p.annotations || []).map((an, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-mid)' }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--status-critical)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>{an.label}</div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {[['WO', p.wo], ['Tech', p.techName], ['Customer', p.customer], ['Site', p.site], ['Slot', p.slot || '—'], ['Taken', `${p.day} ${p.time}`]].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{v}</div>
            </div>
          ))}
        </div>
        {pair.length > 0 && (
          <MSection title="Before / After pair">
            <div style={{ display: 'flex', gap: 8 }}>
              {pair.map(x => (
                <div key={x.id} onClick={() => onClose() || setTimeout(() => onNav, 0)} style={{ flex: 1, height: 70, borderRadius: 9, background: phLook(x.look), position: 'relative', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ position: 'absolute', bottom: 5, left: 6 }}><MBadge color={PH_PHASE[x.phase]}>{x.phase}</MBadge></span>
                </div>
              ))}
            </div>
          </MSection>
        )}
      </div>
    </MSheet>
  );
}

/* ══════════════ PUNCH LIST ══════════════ */
const PUNCH_NEXT = { open:'done', done:'verified', verified:null };
function MPunch({ onNav }) {
  const [items] = useShieldStore(punchStore);
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const fmap = { Open:'open', Done:'done', Verified:'verified' };
  const list = filter === 'All' ? items : items.filter(i => i.status === fmap[filter]);
  const open = items.filter(i => i.status === 'open').length;
  const done = items.filter(i => i.status === 'done').length;
  const verified = items.filter(i => i.status === 'verified').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['OPEN', open, open ? 'var(--status-warn)' : 'var(--status-ok)'], ['DONE', done, 'var(--status-ok)'], ['VERIFIED', verified, 'var(--brand)']]} />
      <MSegment options={['All', 'Open', 'Done', 'Verified']} value={filter} onChange={setFilter} />
      {list.map(i => {
        const st = PUNCH_STATUS[i.status];
        const tech = PUNCH_TECHS[i.assignee];
        return (
          <div key={i.id} onClick={() => setOpenId(i.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${st.c}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{i.id}</span>
              <MBadge color={st.c}>{st.label}</MBadge>
              {i.priority === 'high' && <MBadge color="var(--status-critical)">high</MBadge>}
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-low)' }}>due {i.due}</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.3 }}>{i.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{i.customer} · {i.site}{tech ? ` · ${tech.name}` : ''}</div>
          </div>
        );
      })}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No punch items yet.</div>}
      {openId && <MPunchDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MPunchDetail({ id, onClose }) {
  const [items] = useShieldStore(punchStore);
  const i = items.find(x => x.id === id);
  if (!i) return null;
  const st = PUNCH_STATUS[i.status];
  const tech = PUNCH_TECHS[i.assignee];
  const next = PUNCH_NEXT[i.status];
  const advance = () => { punchStore.set(list => list.map(x => x.id === id ? { ...x, status: next } : x)); showToast(`${i.id} → ${PUNCH_STATUS[next].label} — synced`, 'ok'); };
  return (
    <MSheet title={i.id} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <MBadge color={st.c}>{st.label}</MBadge>
          {i.priority === 'high' && <MBadge color="var(--status-critical)">high priority</MBadge>}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-low)' }}>due {i.due}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3 }}>{i.title}</div>
        {i.detail && <div style={{ fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.45 }}>{i.detail}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {[['Customer', i.customer], ['Site', i.site], ['Assignee', tech ? tech.name : '—'], ['Linked photo', i.photoId || '—']].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)' }}>{v}</div>
            </div>
          ))}
        </div>
        {next && <button onClick={advance} style={{ padding: '13px 0', background: i.status === 'open' ? 'linear-gradient(135deg, var(--status-ok), #1f9d6b)' : 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{i.status === 'open' ? '✓ Mark Done' : 'Mark Verified'}</button>}
        {!next && <div style={{ padding: '13px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', borderRadius: 11 }}>✓ Verified & closed</div>}
      </div>
    </MSheet>
  );
}

/* ══════════════ SUBCONTRACTORS ══════════════ */
const SUBS = [];
const CERT_COLOR = { active:'var(--status-ok)', expiring:'var(--status-warn)', expired:'var(--status-critical)' };
function MSubcontractors({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const list = filter === 'All' ? SUBS : SUBS.filter(s => s.status === filter.toLowerCase());
  const active = SUBS.filter(s => s.status === 'active').length;
  const avgRating = SUBS.length ? (SUBS.reduce((a, s) => a + s.rating, 0) / SUBS.length).toFixed(1) : '—';
  const revenue = SUBS.reduce((a, s) => a + s.revenue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACTIVE', active, 'var(--status-ok)'], ['AVG RATING', avgRating, 'var(--status-warn)'], ['REVENUE', `$${(revenue / 1000).toFixed(0)}K`, 'var(--brand)']]} />
      <MSegment options={['All', 'Active', 'Inactive']} value={filter} onChange={setFilter} />
      {list.map(s => {
        const certIssue = s.certs.some(c => c.status !== 'active');
        return (
          <div key={s.id} onClick={() => setOpenId(s.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${s.status === 'active' ? 'var(--status-ok)' : 'var(--text-low)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{s.contact} · {s.jobs} jobs · ${s.rate}/hr</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-warn)' }}>★ {s.rating}</div>
                <MBadge color={s.status === 'active' ? 'var(--status-ok)' : 'var(--text-low)'}>{s.status}</MBadge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {s.specialty.map(sp => <span key={sp} style={{ fontSize: 9, color: 'var(--brand)', background: 'rgba(63,169,245,0.06)', borderRadius: 7, padding: '2px 7px' }}>{sp}</span>)}
            </div>
            {certIssue && <div style={{ fontSize: 10, color: 'var(--status-warn)', marginTop: 6 }}>⚠ Certification expiring/expired — review</div>}
          </div>
        );
      })}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No subcontractors yet.</div>}
      {openId && <MSubDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MSubDetail({ id, onClose }) {
  const s = SUBS.find(x => x.id === id);
  if (!s) return null;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <MSheet title={s.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{s.contact}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{s.phone} · {s.email}</div>
          </div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-warn)' }}>★ {s.rating}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => showToast('Calling…', 'ok')} style={{ flex: 1, padding: '10px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, color: 'var(--status-ok)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Call</button>
          <button onClick={() => showToast('Composing email…', 'ok')} style={{ flex: 1, padding: '10px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Email</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          {[['JOBS', s.jobs], ['REVENUE', `$${(s.revenue / 1000).toFixed(0)}K`], ['YTD PAID', `$${(s.ytdPaid / 1000).toFixed(0)}K`]].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '9px 10px', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{v}</div>
              <div style={{ fontSize: 8, color: 'var(--text-low)', letterSpacing: '0.05em' }}>{k}</div>
            </div>
          ))}
        </div>
        <MSection title="Certifications">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.certs.map((c, i) => (
              <div key={i} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, color: 'var(--text-high)' }}>{c.name}</div><div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>expires {c.exp}</div></div>
                <MBadge color={CERT_COLOR[c.status]}>{c.status}</MBadge>
              </div>
            ))}
          </div>
        </MSection>
        <MSection title="This week availability">
          <div style={{ display: 'flex', gap: 5 }}>
            {s.availability.map((av, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 28, borderRadius: 7, background: av ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.08)', border: `1px solid ${av ? 'rgba(52,211,153,0.35)' : 'rgba(244,63,94,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av ? 'var(--status-ok)' : 'var(--status-critical)', fontSize: 11 }}>{av ? '✓' : '—'}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 2 }}>{days[i]}</div>
              </div>
            ))}
          </div>
        </MSection>
      </div>
    </MSheet>
  );
}

/* ══════════════ PROJECTS ══════════════ */
const PRJ_STAGE = { planning:'var(--text-low)', 'in-progress':'var(--brand)', review:'#c084fc', complete:'var(--status-ok)' };
const PRJ_STAGE_LABEL = { planning:'Planning', 'in-progress':'In Progress', review:'Review', complete:'Complete' };
const PROJECTS = [];
function MProjects({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const fmap = { Planning:'planning', Active:'in-progress', Review:'review', Done:'complete' };
  const list = filter === 'All' ? PROJECTS : PROJECTS.filter(p => p.stage === fmap[filter]);
  const active = PROJECTS.filter(p => p.stage !== 'complete').length;
  const value = PROJECTS.filter(p => p.stage !== 'complete').reduce((a, p) => a + p.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['ACTIVE', active, 'var(--brand)'], ['PIPELINE', `$${(value / 1000).toFixed(0)}K`, 'var(--text-high)'], ['COMPLETE', PROJECTS.filter(p => p.stage === 'complete').length, 'var(--status-ok)']]} />
      <MSegment options={['All', 'Planning', 'Active', 'Review', 'Done']} value={filter} onChange={setFilter} />
      {list.map(p => (
        <div key={p.id} onClick={() => setOpenId(p.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${PRJ_STAGE[p.stage]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.id}</span>
            <MBadge color={PRJ_STAGE[p.stage]}>{PRJ_STAGE_LABEL[p.stage]}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>${(p.value / 1000).toFixed(0)}K</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginBottom: 3 }}>{p.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 7 }}>{p.pm} · {p.start}–{p.end} · {p.techs.map(t => t).join(',') || 'unstaffed'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}><MBar pct={p.progress} color={PRJ_STAGE[p.stage]} /></div>
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{p.progress}%</span>
          </div>
        </div>
      ))}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No projects yet.</div>}
      {openId && <MProjectDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MProjectDetail({ id, onClose }) {
  const p = PROJECTS.find(x => x.id === id);
  const [milestones, setMilestones] = React.useState(p ? p.milestones : []);
  if (!p) return null;
  const doneCount = milestones.filter(m => m[1]).length;
  const toggle = (i) => setMilestones(ms => ms.map((m, k) => k === i ? [m[0], !m[1]] : m));
  return (
    <MSheet title={p.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-high)' }}>${p.value.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{p.customer} · {p.id}</div>
          </div>
          <MBadge color={PRJ_STAGE[p.stage]}>{PRJ_STAGE_LABEL[p.stage]}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          {[['PM', p.pm.split(' ')[0]], ['TIMELINE', `${p.start}–${p.end}`], ['TEAM', p.techs.join(',') || '—']].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{v}</div>
            </div>
          ))}
        </div>
        <MSection title={`Milestones · ${doneCount}/${milestones.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {milestones.map((m, i) => (
              <button key={i} onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: m[1] ? 'rgba(52,211,153,0.06)' : 'var(--glass-bg)', border: `1px solid ${m[1] ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${m[1] ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: m[1] ? 'var(--status-ok)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06281c', fontSize: 12, fontWeight: 800 }}>{m[1] ? '✓' : ''}</span>
                <span style={{ fontSize: 12.5, color: m[1] ? 'var(--text-low)' : 'var(--text-high)', textDecoration: m[1] ? 'line-through' : 'none' }}>{m[0]}</span>
              </button>
            ))}
          </div>
        </MSection>
      </div>
    </MSheet>
  );
}

/* ══════════════ PROPOSALS ══════════════ */
const PROP_STATUS = { draft:'var(--text-low)', sent:'var(--brand)', accepted:'var(--status-ok)', declined:'var(--status-critical)' };
const PROPOSALS = [];
function MProposals({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const list = filter === 'All' ? PROPOSALS : PROPOSALS.filter(p => p.status === filter.toLowerCase());
  const pipeline = PROPOSALS.filter(p => p.status === 'sent').reduce((a, p) => a + p.value, 0);
  const won = PROPOSALS.filter(p => p.status === 'accepted').reduce((a, p) => a + p.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['OUT', `$${(pipeline / 1000).toFixed(0)}K`, 'var(--brand)'], ['WON', `$${(won / 1000).toFixed(0)}K`, 'var(--status-ok)'], ['ACTIVE', PROPOSALS.filter(p => p.status !== 'declined').length, 'var(--text-high)']]} />
      <MSegment options={['All', 'Draft', 'Sent', 'Accepted', 'Declined']} value={filter} onChange={setFilter} />
      {list.map(p => (
        <div key={p.id} onClick={() => setOpenId(p.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: `3px solid ${PROP_STATUS[p.status]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.id}</span>
            <MBadge color={PROP_STATUS[p.status]}>{p.status}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>${(p.value / 1000).toFixed(0)}K</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{p.title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{p.customer} · {p.created}{p.viewed ? ` · viewed ${p.viewTime}` : ' · not opened'}</div>
        </div>
      ))}
      {list.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No proposals yet.</div>}
      {openId && <MProposalDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
function MProposalDetail({ id, onClose }) {
  const p = PROPOSALS.find(x => x.id === id);
  if (!p) return null;
  return (
    <MSheet title={p.title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-high)' }}>${p.value.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{p.customer} · {p.id}</div>
          </div>
          <MBadge color={PROP_STATUS[p.status]}>{p.status}</MBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          {[['SECTIONS', p.sections], ['CREATED', p.created], ['VIEW TIME', p.viewTime]].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '9px 10px', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{v}</div>
              <div style={{ fontSize: 8, color: 'var(--text-low)', letterSpacing: '0.04em' }}>{k}</div>
            </div>
          ))}
        </div>
        <div style={{ background: p.viewed ? 'rgba(52,211,153,0.06)' : 'rgba(148,163,184,0.05)', border: `1px solid ${p.viewed ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, borderRadius: 11, padding: '11px 13px', fontSize: 12, color: 'var(--text-mid)' }}>
          {p.viewed ? `✓ Client opened this proposal and spent ${p.viewTime} reviewing it.` : 'Client has not opened this proposal yet.'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {p.status === 'draft' && <button onClick={() => { showToast(`${p.id} sent to ${p.customer}`, 'ok'); onClose(); }} style={{ flex: 2, padding: '12px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send to Client</button>}
          {p.status === 'sent' && <button onClick={() => { showToast('Reminder sent', 'ok'); }} style={{ flex: 2, padding: '12px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Send Reminder</button>}
          <button onClick={() => showToast('Duplicated to draft', 'ok')} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Duplicate</button>
        </div>
      </div>
    </MSheet>
  );
}

Object.assign(window, { MPhotos, MPunch, MSubcontractors, MProjects, MProposals });

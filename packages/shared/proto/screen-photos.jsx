/* Screen — Site Photos (admin): CompanyCam-style field documentation hub.
   Photo feed with filters, per-job checklist compliance, before/after pairs, lightbox. */

function SitePhotosScreen() {
  const [photos] = useShieldStore(photoStore);
  const [wos] = useShieldStore(workOrderStore);
  const [custFilter, setCustFilter] = React.useState('all');
  const [techFilter, setTechFilter] = React.useState('all');
  const [phaseFilter, setPhaseFilter] = React.useState('all');
  const [view, setView] = React.useState('feed'); // feed | pairs
  const [lightbox, setLightbox] = React.useState(null);

  const customers = [...new Set(photos.map(p => p.customer))];
  const techs = [...new Set(photos.map(p => JSON.stringify({ id: p.tech, name: p.techName })))].map(s => JSON.parse(s));

  const filtered = photos.filter(p =>
    (custFilter === 'all' || p.customer === custFilter) &&
    (techFilter === 'all' || p.tech === techFilter) &&
    (phaseFilter === 'all' || p.phase === phaseFilter)
  );

  const pairs = completePairs(filtered);
  const issues = photos.filter(p => p.phase === 'issue');
  const compliance = wos.map(wo => ({ wo, ...photoCompliance(wo, photos) })).filter(c => c.required.length > 0);
  const avgCompliance = compliance.length ? Math.round(compliance.reduce((s, c) => s + c.pct, 0) / compliance.length) : 100;

  const dayOrder = ['Today', 'Yesterday', 'Jun 10', 'Jun 9'];
  const days = dayOrder.filter(d => filtered.some(p => p.day === d));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'PHOTOS THIS WEEK', value: photos.length, color: 'var(--brand)' },
          { label: 'JOBS DOCUMENTED', value: new Set(photos.map(p => p.wo)).size, color: 'var(--text-high)' },
          { label: 'CHECKLIST COMPLIANCE', value: `${avgCompliance}%`, color: avgCompliance >= 80 ? 'var(--status-ok)' : 'var(--status-warn)' },
          { label: 'FLAGGED ISSUES', value: issues.length, color: issues.length ? 'var(--status-critical)' : 'var(--text-high)' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 4 }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Checklist compliance per job */}
      <div className="glass" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Required-Shot Compliance — Active Jobs</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
          {compliance.map(({ wo, required, done, missing, pct }) => (
            <div key={wo.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', background: 'rgba(5,7,10,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{wo.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-mid)', marginLeft: 6 }}>{wo.customer}</span>
                </div>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? 'var(--status-ok)' : pct >= 50 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{done.length}/{required.length}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', marginBottom: 7 }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: pct === 100 ? 'var(--status-ok)' : pct >= 50 ? 'var(--status-warn)' : 'var(--status-critical)', transition: 'width 0.3s' }}></div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {required.map(slot => {
                  const ok = done.includes(slot);
                  return <span key={slot} style={{ fontSize: 8, padding: '2px 7px', borderRadius: 8, background: ok ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.08)', border: `1px solid ${ok ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`, color: ok ? 'var(--status-ok)' : 'var(--text-low)' }}>{ok ? '✓ ' : '○ '}{slot}</span>;
                })}
              </div>
              {missing.length > 0 && wo.status !== 'completed' && (
                <div style={{ fontSize: 9, color: 'var(--status-warn)', marginTop: 6 }}>⚠ Cannot close until {missing.length} shot{missing.length > 1 ? 's' : ''} captured</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <select value={custFilter} onChange={e => setCustFilter(e.target.value)} style={photosSelStyle}>
          <option value="all">All customers</option>
          {customers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={techFilter} onChange={e => setTechFilter(e.target.value)} style={photosSelStyle}>
          <option value="all">All technicians</option>
          {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', ...Object.keys(PHOTO_PHASES)].map(ph => {
            const conf = PHOTO_PHASES[ph];
            const on = phaseFilter === ph;
            return (
              <button key={ph} onClick={() => setPhaseFilter(ph)} style={{ padding: '4px 11px', borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: on ? (conf ? `${conf.c}1c` : 'rgba(63,169,245,0.15)') : 'transparent', border: `1px solid ${on ? (conf ? conf.c + '60' : 'var(--border-strong)') : 'var(--border-subtle)'}`, color: on ? (conf ? conf.c : 'var(--brand)') : 'var(--text-low)', textTransform: 'capitalize' }}>{ph}</button>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'rgba(63,169,245,0.06)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
          {[['feed', 'Photo Feed'], ['pairs', `Before / After (${pairs.length})`]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer', fontWeight: 500, background: view === v ? 'rgba(63,169,245,0.18)' : 'transparent', color: view === v ? 'var(--brand)' : 'var(--text-low)' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === 'feed' ? (
        days.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No photos match these filters</div>
        ) : (
          days.map(day => (
            <div key={day}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{day}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{filtered.filter(p => p.day === day).length} photos</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                {filtered.filter(p => p.day === day).map(p => <PhotoCard key={p.id} photo={p} onClick={() => setLightbox(p.id)} />)}
              </div>
            </div>
          ))
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {pairs.length === 0 && <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No complete before/after pairs for these filters</div>}
          {pairs.map(pair => (
            <div key={pair.id} className="glass" style={{ padding: 14 }}>
              <BeforeAfterSlider before={pair.before} after={pair.after} caption={`${pair.before.customer} · ${pair.after.label}`} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <span className="mono" style={{ fontSize: 9, color: 'var(--brand)' }}>{pair.before.wo}</span>
                <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{pair.before.techName} · {pair.after.day}</span>
                <button onClick={() => showToast('Pair shared to customer portal', 'ok')} style={{ marginLeft: 'auto', padding: '3px 10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 5, color: 'var(--brand)', fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Share</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && <PhotoLightbox photoId={lightbox} onClose={() => setLightbox(null)} canAnnotate />}
    </div>
  );
}

const photosSelStyle = { background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '6px 10px', color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' };

Object.assign(window, { SitePhotosScreen });

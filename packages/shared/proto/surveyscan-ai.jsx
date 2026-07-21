/* Survey Scan — ShieldTech AI walk-and-talk capture.
   Talk while you walk; ShieldTech AI turns speech into pinned issues, notes,
   checklist hits and scope items — magicplan-style AI capture, ShieldTech flavored. */

const SV_AI_SCRIPT = [];
const SV_AI_KIND = { note: { c: '#3FA9F5', label: 'Note' }, issue: { c: '#F43F5E', label: 'Issue' }, scope: { c: '#34D399', label: 'Scope item' }, photo: { c: '#FBBF24', label: 'Photo task' } };

function SVAICapture({ project, update, floor, updateFloor, onClose }) {
  const [entries, setEntries] = React.useState([]);
  const [live, setLive] = React.useState('');
  const [done, setDone] = React.useState(false);
  const idx = React.useRef(0);

  React.useEffect(() => {
    let word = 0, timer;
    const step = () => {
      const item = SV_AI_SCRIPT[idx.current];
      if (!item) { setDone(true); return; }
      const words = item.say.split(' ');
      if (word < words.length) {
        setLive(words.slice(0, ++word).join(' '));
        timer = setTimeout(step, 130 + Math.random() * 120);
      } else {
        setEntries(e => [...e, { ...item, id: ssId('ai') }]);
        setLive(''); word = 0; idx.current++;
        timer = setTimeout(step, 900);
      }
    };
    timer = setTimeout(step, 700);
    return () => clearTimeout(timer);
  }, []);

  const apply = () => {
    let nf = { ...floor, issues: [...(floor.issues || [])], photos: [...(floor.photos || [])] };
    const scope = [...((project.estimate || {}).scope || [])];
    let notes = [...(project.aiNotes || [])];
    entries.forEach(e => {
      const rm = floor.rooms.find(r => r.name === e.target);
      const [cx, cy] = rm ? ssCentroid(rm.poly) : [5, 5];
      if (e.kind === 'issue') nf.issues.push({ id: ssId('is'), x: cx, y: cy, sev: e.sev || 'med', room: e.target, title: e.title, note: 'ShieldTech AI — voice capture' });
      if (e.kind === 'photo') nf.photos.push({ id: ssId('p'), x: cx, y: cy, kind: 'photo', label: e.title, hue: Math.floor(Math.random() * 360) });
      if (e.kind === 'scope') {
        const g = scope.find(s => s.room === e.target);
        if (g) g.tasks = [...g.tasks, e.task]; else scope.push({ room: e.target, tasks: [e.task] });
      }
      if (e.kind === 'note') notes.push({ id: e.id, room: e.target, text: e.say });
    });
    updateFloor(nf);
    update(p => ({ ...p, floors: p.floors, aiNotes: notes, estimate: { ...(p.estimate || {}), scope } }));
    showToast(`${entries.length} items filed — issues pinned, scope updated`, 'ok');
    onClose();
  };

  return (
    <div style={{ ...ssOverlay }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: done ? 'var(--status-ok)' : '#F43F5E', boxShadow: done ? 'none' : '0 0 8px #F43F5E', animation: done ? 'none' : 'pulse 1.2s infinite' }}></span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>ShieldTech AI walk-and-talk</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', lineHeight: 1.5, padding: '0 16px' }}>Keep scanning and just talk. ShieldTech AI files what you say as pinned issues, scope lines and notes — nothing to type up back at the office.</div>
        {entries.map(e => {
          const k = SV_AI_KIND[e.kind];
          return (
            <div key={e.id} className="glass" style={{ padding: '10px 12px', borderRadius: 11, borderLeft: `3px solid ${k.c}`, animation: 'fade-up 0.3s ease both' }}>
              <div style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic', marginBottom: 4 }}>“{e.say}”</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MBadge color={k.c}>{k.label}</MBadge>
                <span style={{ fontSize: 10.5, color: 'var(--text-mid)', fontWeight: 600 }}>→ {e.target}</span>
              </div>
            </div>
          );
        })}
        {live && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '4px 2px' }}>
            <span style={{ display: 'flex', gap: 2, alignItems: 'center', paddingTop: 5, flexShrink: 0 }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 3, borderRadius: 2, background: 'var(--brand)', height: 6 + ((i * 7 + live.length) % 9), transition: 'height 0.12s' }}></span>)}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{live}<span style={{ opacity: 0.5 }}>▍</span></span>
          </div>
        )}
        {done && entries.length > 0 && <div style={{ fontSize: 10.5, color: 'var(--status-ok)', textAlign: 'center', paddingTop: 6 }}>✓ Walk complete — {entries.length} items parsed</div>}
        {done && entries.length === 0 && <div style={{ fontSize: 10.5, color: 'var(--text-low)', textAlign: 'center', paddingTop: 6 }}>Voice capture requires the ShieldTech AI service to be configured.</div>}
      </div>

      <div style={{ padding: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-mid)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Discard</button>
        <button onClick={apply} disabled={!entries.length} style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: entries.length ? 'linear-gradient(135deg, var(--brand), var(--brand-pressed))' : 'rgba(63,169,245,0.1)', color: entries.length ? '#fff' : 'var(--text-low)', fontSize: 12.5, fontWeight: 700, cursor: entries.length ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>File {entries.length} items to survey</button>
      </div>
    </div>
  );
}

Object.assign(window, { SVAICapture });

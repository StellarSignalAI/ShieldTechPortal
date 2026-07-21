/* Tech App — Field Tools I: ShieldTech AI Copilot, Voice Work-Order, Model Scanner, Day Route, AR Wire-Mapper */

/* ── 1. ShieldTech AI Field Copilot (replaces plain AI chat) ── */
function TechCopilotView() {
  const [thread, setThread] = React.useState([]);
  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef(null);

  const push = (msg) => setThread(t => [...t, msg]);
  const send = () => {
    if (!input.trim()) return;
    push({ from: 'me', text: input });
    setTimeout(() => {
      push({ from: 'hermes', text: 'ShieldTech AI responses appear here once the AI service is configured in Settings → Integrations.' });
    }, 400);
    setInput('');
  };

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [thread]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="hermes" size={18} color="var(--brand)" />
        <span style={{ fontSize: 16, fontWeight: 500 }}>Field Copilot</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-low)' }}>no job context</span>
      </div>
      {/* Quick diagnostics */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {['NVR not recording', 'Reader won’t beep', 'Zone won’t clear', 'Camera no PoE'].map(s => (
          <button key={s} onClick={() => { push({ from: 'me', text: s }); setTimeout(() => push({ from: 'hermes', text: 'Guided diagnostics run through the ShieldTech AI service — configure it to enable this.' }), 400); }}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 14, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⚡ {s}</button>
        ))}
      </div>
      {/* Thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
        {thread.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-low)', fontSize: 12, lineHeight: 1.6, maxWidth: 260 }}>
            Describe a symptom or pick a quick diagnostic — the copilot answers from the knowledge base and this site's history.
          </div>
        )}
        {thread.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ padding: '9px 13px', borderRadius: m.from === 'me' ? '12px 12px 3px 12px' : '12px 12px 12px 3px', background: m.from === 'me' ? 'rgba(63,169,245,0.14)' : 'rgba(5,7,10,0.55)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-high)', lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Describe the symptom…"
          style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={send} style={{ padding: '0 18px', background: 'rgba(63,169,245,0.12)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↑</button>
      </div>
    </div>
  );
}

/* ── 2. Voice-to-Work-Order ── */
function TechVoiceView() {
  const [state, setState] = React.useState('idle'); // idle | listening | parsed
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (state !== 'listening') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Voice Notes</div>
      <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <button onClick={() => { setElapsed(0); if (state === 'listening') { setState('idle'); showToast('Transcription requires the ShieldTech AI service — recording discarded', 'warn'); } else { setState('listening'); } }}
          style={{ width: 84, height: 84, borderRadius: '50%', border: state === 'listening' ? '3px solid var(--status-critical)' : '3px solid var(--brand)', background: state === 'listening' ? 'rgba(244,63,94,0.12)' : 'rgba(63,169,245,0.08)', cursor: 'pointer', fontSize: 30, color: state === 'listening' ? 'var(--status-critical)' : 'var(--brand)', boxShadow: state === 'listening' ? '0 0 0 8px rgba(244,63,94,0.08)' : 'none', transition: 'all 0.2s' }}>
          {state === 'listening' ? '■' : '🎙'}
        </button>
        <div style={{ marginTop: 12, fontSize: 12, color: state === 'listening' ? 'var(--status-critical)' : 'var(--text-low)' }}>
          {state === 'listening' ? `Listening… 0:0${Math.min(elapsed, 9)} — talk through what you did` : 'Tap to dictate — hands stay on the ladder'}
        </div>
        {state === 'listening' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 14, height: 26, alignItems: 'center' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ width: 3, borderRadius: 2, background: 'var(--brand)', height: 6 + Math.abs(Math.sin(i * 1.7 + elapsed * 3)) * 18, transition: 'height 0.15s' }}></div>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', lineHeight: 1.5 }}>Dictations are transcribed and parsed into work-order notes, parts used, time entries and follow-ups by ShieldTech AI.</div>
    </div>
  );
}

/* ── 3. Model-Sticker Scanner ── */
function TechScannerView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Model Scanner</div>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-strong)', aspectRatio: '3/4', background: photoBg({ h: 230, p: 'panel', s: 77 }) }}>
        <div style={{ position: 'absolute', top: '32%', left: '22%', right: '22%', height: '20%', border: '2px solid var(--brand)', borderRadius: 8, boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)', animation: 'pulse-online 2s ease-in-out infinite' }}>
          <span style={{ position: 'absolute', top: -22, left: 0, fontSize: 9, color: 'var(--brand)', letterSpacing: '0.08em' }}>ALIGN MODEL STICKER</span>
        </div>
        <button onClick={() => showToast('Sticker recognition requires the ShieldTech AI service', 'warn')} style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', padding: '10px 26px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 22, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 6px 20px rgba(63,169,245,0.4)' }}>Scan</button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'center', lineHeight: 1.5 }}>Scanning a model sticker pulls specs, manuals, warranty status and known issues for the device.</div>
    </div>
  );
}

/* ── 4. Smart Day Route ── */
function TechRouteView() {
  const stops = [];
  const statusC = { done: 'var(--text-low)', now: 'var(--status-ok)', next: 'var(--brand)', later: 'var(--text-mid)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>My Route</div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{stops.length} stops</span>
      </div>
      {stops.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)' }}>No stops today — your dispatched jobs build the route automatically.</div>}
      <div style={{ position: 'relative', paddingLeft: 22 }}>
        {stops.length > 0 && <div style={{ position: 'absolute', left: 8, top: 10, bottom: 10, width: 2, background: 'rgba(63,169,245,0.15)' }}></div>}
        {stops.map((s, i) => (
          <div key={s.job} style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: -20, top: 16, width: 12, height: 12, borderRadius: '50%', background: s.status === 'now' ? 'var(--status-ok)' : 'var(--canvas)', border: `2px solid ${statusC[s.status]}`, boxShadow: s.status === 'now' ? '0 0 8px var(--status-ok)' : 'none' }}></span>
            {s.drive && <div className="mono" style={{ fontSize: 9, color: s.drive.includes('⚠') ? 'var(--status-warn)' : 'var(--text-low)', padding: '0 0 4px 4px' }}>↓ {s.drive}</div>}
            <div className="glass" style={{ padding: '11px 14px', borderRadius: 'var(--radius-md)', opacity: s.status === 'done' ? 0.55 : 1, border: s.status === 'now' ? '1px solid rgba(52,211,153,0.35)' : '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: statusC[s.status], width: 42 }}>{s.t}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', textDecoration: s.status === 'done' ? 'line-through' : 'none' }}>{s.job}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.addr} · {s.dur}</div>
                </div>
                {s.status === 'now' && <button onClick={() => showToast('Navigation opened', 'ok')} style={{ padding: '5px 12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, color: 'var(--status-ok)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Navigate</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-low)' }}>ETA changes auto-notify customers via the portal tracker</div>
    </div>
  );
}

/* ── 5. AR Wire-Mapper ── */
function TechARView() {
  const [tags, setTags] = React.useState([]);
  const addTag = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    setTags(t => [...t, { x, y, label: `SW1 P${String(t.length + 1).padStart(2, '0')} → unlabeled` }]);
  };
  const save = () => {
    if (!tags.length) { showToast('Tag at least one port first', 'warn'); return; }
    const me = window.__shieldUser || {};
    photoStore.set(prev => [{
      id: genId('PH'), wo: '', customer: '', site: '', tech: me.initials || '—', techName: me.name || 'Technician',
      phase: 'progress', slot: null, label: `AR wire-map — head-end rack (${tags.length} ports tagged)`,
      day: 'Today', time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      look: { h: 195, p: 'rack', s: 88 }, pair: null,
      annotations: tags.map(t => ({ x: t.x, y: t.y, label: t.label })),
    }, ...prev]);
    showToast(`Wire-map saved to Site Photos — ${tags.length} ports documented`, 'ok');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>AR Wire-Mapper</div>
        <span style={{ fontSize: 9, color: 'var(--text-low)' }}>tap a port to tag it</span>
      </div>
      <div onClick={addTag} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-strong)', aspectRatio: '3/4', background: photoBg({ h: 195, p: 'rack', s: 88 }), cursor: 'crosshair' }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(63,169,245,0.15)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '3px 12px', fontSize: 9, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.08em' }}>AR OVERLAY</div>
        {tags.map((t, i) => (
          <div key={i} style={{ position: 'absolute', left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--brand)', background: 'rgba(63,169,245,0.25)', boxShadow: '0 0 10px rgba(63,169,245,0.6)' }}></div>
            <div className="mono" style={{ position: 'absolute', left: 16, top: -4, whiteSpace: 'nowrap', fontSize: 8, color: '#fff', background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 6px', border: '1px solid rgba(63,169,245,0.4)' }}>{t.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} style={{ flex: 2, padding: '10px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save to Site Photos ({tags.length} tags)</button>
        <button onClick={() => setTags([])} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear</button>
      </div>
    </div>
  );
}

Object.assign(window, { TechCopilotView, TechVoiceView, TechScannerView, TechRouteView, TechARView });

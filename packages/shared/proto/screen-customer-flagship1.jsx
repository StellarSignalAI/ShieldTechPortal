/* Customer Portal — Flagship features I
   Security Score, Footage Finder, Concierge, Badges & Visitors, Compliance Vault */
const { useState, useEffect } = React;

/* ── 1. Security Score ── */
function CustSecurityScoreView() {
  const cats = [];
  const total = 0;
  const R = 62, C = 2 * Math.PI * R;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 20 }}>
        <GlassPanel style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
            <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="75" cy="75" r={R} fill="none" stroke="rgba(63,169,245,0.1)" strokeWidth="9" />
              <circle cx="75" cy="75" r={R} fill="none" stroke="var(--status-ok)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - total / 100)} style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="display" style={{ fontSize: 40, fontWeight: 300, color: 'var(--text-high)' }}>—</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>no data</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 10 }}>Security Score</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>The score builds as devices and monitoring come online</div>
        </GlassPanel>
        <GlassPanel style={{ padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Score breakdown</div>
          {cats.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '20px 0', textAlign: 'center' }}>No score categories yet — device health, coverage, response readiness, access hygiene and patching are graded here.</div>}
          {cats.map(c => (
            <div key={c.name} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{c.name}</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: c.score >= 90 ? 'var(--status-ok)' : c.score >= 80 ? 'var(--brand)' : 'var(--status-warn)' }}>{c.score}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${c.score}%`, height: '100%', borderRadius: 3, background: c.score >= 90 ? 'var(--status-ok)' : c.score >= 80 ? 'var(--brand)' : 'var(--status-warn)' }}></div>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{c.note}</div>
            </div>
          ))}
        </GlassPanel>
      </div>
      <GlassPanel style={{ padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Raise your score — prioritized</div>
        <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '14px 0', textAlign: 'center' }}>Recommendations appear here once the score is established.</div>
      </GlassPanel>
    </div>
  );
}

/* ── 2. AI Footage Finder ── */
function CustFootageFinderView() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const samples = ['white van in parking lot Tuesday afternoon', 'person at rear exit after 10 PM', 'delivery left at front door last week'];
  const search = (query) => {
    setQ(query); setSearching(true); setResults(null);
    setTimeout(() => {
      setSearching(false);
      setResults([]);
    }, 1200);
  };
  return (
    <div>
      <GlassPanel style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Describe what you're looking for</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && q && search(q)} placeholder='e.g. "white van in the parking lot Tuesday afternoon"'
            style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
          <button onClick={() => q && search(q)} style={{ padding: '0 22px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Search</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {samples.map(s => (
            <button key={s} onClick={() => search(s)} style={{ padding: '4px 11px', borderRadius: 12, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>"{s}"</button>
          ))}
        </div>
      </GlassPanel>
      {searching && (
        <GlassPanel style={{ padding: 30, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--brand)' }}>ShieldTech AI is scanning your cameras…</div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', marginTop: 12, maxWidth: 320, margin: '12px auto 0' }}>
            <div style={{ width: '40%', height: '100%', background: 'var(--brand)', borderRadius: 2, animation: 'pulse-online 1.2s ease-in-out infinite' }}></div>
          </div>
        </GlassPanel>
      )}
      {results && (
        <div>
          {results.length === 0 && <GlassPanel style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No matches — footage search requires connected cameras and the ShieldTech AI service.</GlassPanel>}
          {results.length > 0 && <>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 10 }}>{results.length} matches · sorted by confidence</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {results.map(r => (
              <GlassPanel key={r.id} style={{ padding: 10 }}>
                <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: photoBg(r.look) }}>
                  <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, fontWeight: 700, color: r.conf > 85 ? 'var(--status-ok)' : 'var(--status-warn)', background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '2px 8px' }}>{r.conf}% match</span>
                  <span style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9, color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px' }}>▶ 0:42</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)' }}>{r.cam}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.t}</div>
                  </div>
                  <button onClick={() => showToast('Clip exported — link valid 30 days', 'ok')} style={{ padding: '5px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--brand)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Export</button>
                </div>
              </GlassPanel>
            ))}
          </div>
          </>}
        </div>
      )}
    </div>
  );
}

/* ── 3. Incident Concierge (acting AI) ── */
function CustConciergeView() {
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState('');
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [thread]);
  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    const history = [...thread.map(m => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: msg }];
    setThread(t => [...t, { from: 'me', text: msg }]);
    setInput('');
    const reply = window.__shieldAI
      ? await window.__shieldAI.shieldAIChat('concierge', history)
      : { text: 'The concierge answers and acts on requests like these once the ShieldTech AI service is configured for your account.' };
    setThread(t => [...t, { from: 'ai', text: reply.text }]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: 420 }}>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
        {thread.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-low)', fontSize: 12, lineHeight: 1.6, maxWidth: 320 }}>
            The concierge can do things, not just answer — try "book a visit", "bypass the rear zone tonight", or "why did my alarm go off Saturday?"
          </div>
        )}
        {thread.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
            <div style={{ padding: '10px 14px', borderRadius: m.from === 'me' ? '12px 12px 3px 12px' : '12px 12px 12px 3px', background: m.from === 'me' ? 'rgba(63,169,245,0.14)' : 'rgba(5,7,10,0.55)', border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5 }}>{m.text}</div>
            {m.card && (
              <div className="glass" style={{ marginTop: 6, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-strong)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{m.card.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{m.card.sub}</div>
                <button onClick={() => showToast(`${m.card.cta} ✓ — confirmation sent to your email`, 'ok')} style={{ marginTop: 8, padding: '7px 16px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{m.card.cta}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {['Book a maintenance visit', 'Bypass rear zone tonight', 'Why did my alarm go off Saturday?'].map(s => (
          <button key={s} onClick={() => send(s)} style={{ padding: '5px 12px', borderRadius: 12, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask — or tell me to do something…"
          style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 14px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => send()} style={{ padding: '0 20px', background: 'var(--brand)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↑</button>
      </div>
    </div>
  );
}

/* ── 4. Badge & Visitor Management ── */
function CustAccessView() {
  const [badges, setBadges] = useState([]);
  const entries = [];
  const revoke = (id) => { setBadges(b => b.map(x => x.id === id ? { ...x, status: 'revoked' } : x)); showToast('Badge revoked — effective immediately', 'ok'); };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
      <GlassPanel style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)' }}>Badges</span>
          <button onClick={() => showToast('Badge request sent — programmed at next visit (or mobile credential issued now)', 'ok')} style={{ padding: '5px 13px', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Issue badge</button>
        </div>
        {badges.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '18px 0', textAlign: 'center' }}>No badges yet — issued credentials for your team appear here.</div>}
        {badges.map(b => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <Icon name="credential" size={17} color={b.status === 'active' ? 'var(--brand)' : b.status === 'dormant' ? 'var(--status-warn)' : 'var(--text-low)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: b.status === 'revoked' ? 'var(--text-low)' : 'var(--text-high)', textDecoration: b.status === 'revoked' ? 'line-through' : 'none' }}>{b.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{b.role} · last used {b.last}</div>
            </div>
            {b.status === 'dormant' && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: '2px 8px' }}>DORMANT</span>}
            {b.status === 'revoked'
              ? <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)' }}>REVOKED</span>
              : <button onClick={() => revoke(b.id)} style={{ padding: '4px 11px', background: 'transparent', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 5, color: 'var(--status-critical)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Revoke</button>}
          </div>
        ))}
      </GlassPanel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GlassPanel style={{ padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Visitor pass</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 10 }}>Generate a one-day QR pass — works on the front reader, auto-expires at 6 PM.</div>
          <button onClick={() => showToast('Visitor pass created — QR sent to their phone', 'ok')} style={{ width: '100%', padding: '9px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 7, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create visitor pass</button>
        </GlassPanel>
        <GlassPanel style={{ padding: 20, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Today's entries</div>
          {entries.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-low)', padding: '10px 0', textAlign: 'center' }}>No entries logged today.</div>}
          {entries.map(([t, who, where], i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 56, flexShrink: 0 }}>{t}</span>
              <span style={{ fontSize: 11, color: 'var(--text-high)', flex: 1 }}>{who}</span>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{where}</span>
            </div>
          ))}
        </GlassPanel>
      </div>
    </div>
  );
}

/* ── 5. Compliance Vault ── */
function CustComplianceVaultView() {
  const docs = [];
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatCard label="DOCUMENTS" value={docs.length} delay={0} />
        <StatCard label="CURRENT" value={docs.filter(d => d.status === 'current').length} delay={80} />
        <StatCard label="EXPIRING SOON" value={docs.filter(d => d.status === 'expiring').length} delay={160} />
      </div>
      <GlassPanel style={{ padding: 20, marginBottom: 16, border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Icon name="compliance" size={22} color="var(--brand)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>Auditor share link</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Read-only bundle of every current document — perfect for insurance renewals and HIPAA audits</div>
        </div>
        <button onClick={() => showToast('Share link copied — valid 14 days, watermarked', 'ok')} style={{ padding: '8px 18px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Copy share link</button>
      </GlassPanel>
      <GlassPanel style={{ padding: 0 }}>
        {docs.length === 0 && <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>No compliance documents yet — certificates, inspections and attestations filed by ShieldTech appear here.</div>}
        {docs.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <Icon name="proposals" size={16} color={d.status === 'expiring' ? 'var(--status-warn)' : 'var(--text-mid)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{d.name}</div>
              <div className="mono" style={{ fontSize: 10, color: d.status === 'expiring' ? 'var(--status-warn)' : 'var(--text-low)' }}>{d.status === 'expiring' ? `⚠ Expires ${d.exp} — renewal already scheduled` : `Valid through ${d.exp}`}</div>
            </div>
            <button onClick={() => showToast('Opening PDF…', 'ok')} style={{ padding: '4px 12px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--brand)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View</button>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

Object.assign(window, { CustSecurityScoreView, CustFootageFinderView, CustConciergeView, CustAccessView, CustComplianceVaultView });

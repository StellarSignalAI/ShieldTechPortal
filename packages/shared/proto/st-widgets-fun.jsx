/* ShieldTech Widgets — Inventive / Fun group
   Field Weather (the Apple baseline) · Tech Leaderboard · NPS Pulse ·
   Safety Streak · ShieldTech AI Briefing · Ops Clock */

/* ── Weather glyphs (SVG, matches the Apple sun) ── */
function Sun({ size = 16, color = '#FCD34D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 0 4px ${hexToRgba(color, 0.6)})` }}>
      <circle cx="12" cy="12" r="5" fill={color} />
      {[...Array(8)].map((_, i) => {
        const a = (i * Math.PI) / 4, x1 = 12 + Math.cos(a) * 8, y1 = 12 + Math.sin(a) * 8, x2 = 12 + Math.cos(a) * 10.5, y2 = 12 + Math.sin(a) * 10.5;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.8" strokeLinecap="round" />;
      })}
    </svg>
  );
}

/* ─────────── Field Weather (Apple Weather baseline, dark-glass) ─────────── */
function WWeather({ size }) {
  /* No weather provider is connected — an honest state instead of an
     invented forecast for an invented city. */
  return (
    <WCard size={size} accent="#4AA3E0" title="Field Weather" glyph="cameras"
      sub={size !== 'small' ? 'crew dispatch conditions' : null}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, textAlign: 'center', padding: 6 }}>
        <Sun size={size === 'small' ? 22 : 28} color="#5C6F86" />
        <div style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 500 }}>Weather feed isn't connected</div>
        {size !== 'small' && <div style={{ fontSize: 10.5, color: 'var(--text-low)', lineHeight: 1.5 }}>Connect a weather provider to see forecasts and dispatch impact here.</div>}
      </div>
    </WCard>
  );
}

/* ─────────── Tech Leaderboard (gamified) ─────────── */
function WLeaderboard({ size }) {
  /* Per-tech closed-job counts aren't tracked client-side yet — no invented
     techs or XP. The widget lights up once real job attribution exists. */
  const techs = [];
  if (!techs.length) return <WNoData size={size} title="Leaderboard" glyph="star" accent="#FCD34D" />;
  const top = techs[0];
  const medals = ['#FCD34D', '#CBD5E1', '#D69E2E'];
  return (
    <WCard size={size} accent="#FCD34D" title="Leaderboard" glyph="star" sub={size !== 'small' ? 'this week · jobs closed' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: hexToRgba(top.color, 0.2), border: `2px solid ${top.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: top.color }}>{top.id}</div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{top.name.split(' ')[0]}</div><div style={{ fontSize: 10, color: '#FCD34D' }}>🏆 #1 this week</div></div>
          </div>
          <div style={{ marginTop: 'auto' }}><div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-high)' }}>{top.jobs}</div><div style={{ fontSize: 10, color: 'var(--text-low)' }}>jobs · {top.xp} XP</div></div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: '100%', paddingTop: 6 }}>
          {[techs[1], techs[0], techs[2]].map((t, i) => {
            const podium = i === 1 ? 1 : i === 0 ? 2 : 3;
            const hgt = i === 1 ? '100%' : i === 0 ? '74%' : '58%';
            return (
              <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: '100%' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: hexToRgba(t.color, 0.2), border: `2px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: t.color }}>{t.id}</div>
                <div style={{ width: '78%', height: hgt, minHeight: 22, borderRadius: '6px 6px 0 0', background: `linear-gradient(${hexToRgba(medals[podium - 1], 0.5)},${hexToRgba(medals[podium - 1], 0.12)})`, border: `1px solid ${hexToRgba(medals[podium - 1], 0.5)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: medals[podium - 1] }}>{podium}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-high)', marginTop: 2 }}>{t.jobs}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {size === 'large' && (
        <div style={{ marginTop: 8 }}>
          {techs.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < techs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ width: 18, fontSize: 13, fontWeight: 700, color: i < 3 ? medals[i] : 'var(--text-low)' }}>{i + 1}</span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: hexToRgba(t.color, 0.2), border: `1.5px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: t.color }}>{t.id}</div>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{t.name}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{t.jobs}</span>
              <span className="mono" style={{ fontSize: 11, color: '#FCD34D', width: 52, textAlign: 'right' }}>{t.xp}xp</span>
            </div>
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── NPS Pulse ─────────── */
function WNPS({ size }) {
  const [nps] = useShieldStore(npsStore);
  const prom = nps.filter(n => n.score >= 9).length, det = nps.filter(n => n.score <= 6).length, pass = nps.length - prom - det;
  const score = Math.round(((prom - det) / (nps.length || 1)) * 100);
  const color = score >= 50 ? '#34D399' : score >= 0 ? '#FBBF24' : '#F43F5E';
  const recent = [...nps].slice(0, 4);
  return (
    <WCard size={size} accent={color} title="NPS Pulse" glyph="star" sub={size !== 'small' ? `${nps.length} responses` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
          <WRing pct={(score + 100) / 2} value={score > 0 ? '+' + score : score} color={color} size={72} />
          <div><div style={{ fontSize: 11, color: 'var(--text-low)' }}>net score</div><div style={{ fontSize: 12, color: '#34D399', marginTop: 2 }}>{prom} promoters</div></div>
        </div>
      )}
      {size !== 'small' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
          <WRing pct={(score + 100) / 2} value={score > 0 ? '+' + score : score} label="NPS" color={color} size={size === 'large' ? 88 : 78} stroke={size === 'large' ? 9 : 7} />
          <div style={{ flex: 1 }}>
            <WStrip accent={color} cells={[
              { top: 'Prom', color: '#34D399', bot: prom }, { top: 'Pass', color: '#FBBF24', bot: pass }, { top: 'Det', color: '#F43F5E', bot: det },
            ]} />
          </div>
        </div>
      </>}
      {size === 'large' && <>
        <WDivide />
        <div>
          {recent.map((n, i) => (
            <WRow key={n.id} last={i === recent.length - 1} label={n.customer}
              glyph={n.score >= 9 ? 'check' : n.score <= 6 ? 'warning-tri' : 'chat'}
              glyphColor={n.score >= 9 ? '#34D399' : n.score <= 6 ? '#F43F5E' : '#FBBF24'} a={n.score} b={n.date} accent={color} />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Safety Streak (motivational) ─────────── */
function WSafety({ size }) {
  /* Incident-free streaks, toolbox talks and inspections aren't recorded in
     any store yet — honest empty state instead of invented numbers. */
  const safety = null;
  if (!safety) return <WNoData size={size} title="Safety Streak" glyph="check" accent="#34D399" />;
  const { days, record, target, milestones } = safety;
  return (
    <WCard size={size} accent="#34D399" title="Safety Streak" glyph="check" sub={size !== 'small' ? 'days incident-free' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="display" style={{ fontSize: 46, fontWeight: 600, color: '#34D399', lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 4 }}>days incident-free</div>
          <div style={{ marginTop: 'auto', fontSize: 10.5, color: 'var(--text-low)' }}>record: {record}d</div>
        </div>
      )}
      {size !== 'small' && <>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span className="display" style={{ fontSize: size === 'large' ? 56 : 46, fontWeight: 600, color: '#34D399', lineHeight: 1 }}>{days}</span>
          <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>days · target {target}</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ width: `${(days / target) * 100}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#1E6FB0,#34D399)', boxShadow: '0 0 8px #34D399' }} />
        </div>
        <WStrip accent="#34D399" cells={milestones.map(([m, hit]) => ({ top: m, color: hit ? '#34D399' : '#5C6F86', bot: hit ? '✓' : '·' }))} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 12 }}>
          <WRow label="Last incident" glyph="warroom" glyphColor="#5C6F86" a="May 5" b="P3" accent="#34D399" />
          <WRow label="Toolbox talks logged" glyph="compliance" glyphColor="#34D399" a="47" b="100%" accent="#34D399" />
          <WRow label="Vehicle inspections" glyph="vehicle" glyphColor="#34D399" a="6/6" b="today" last accent="#34D399" />
        </div>
      )}
    </WCard>
  );
}

/* ─────────── ShieldTech AI Briefing (AI digest) ─────────── */
function WShieldAI({ size }) {
  /* No scheduled AI briefing exists yet, so no invented findings — the widget
     is an honest gateway to the real assistant. */
  return (
    <WCard size={size} accent="#3FA9F5" title="ShieldTech AI" glyph="hermes" sub={size !== 'small' ? 'your AI assistant' : null}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, textAlign: 'center', padding: 6 }}>
        <span style={{ fontSize: size === 'small' ? 18 : 22 }}>⟡</span>
        {size !== 'small' && <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>Ask about finances, dispatch, customers or reports — answers come from your live data.</div>}
        <button onClick={() => { if (window.__shieldNav) window.__shieldNav('shieldtech-ai'); }} style={{ padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(63,169,245,0.1)', border: '1px solid rgba(63,169,245,0.4)', color: '#3FA9F5', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ask ShieldTech AI</button>
      </div>
    </WCard>
  );
}

/* ─────────── Ops Clock (live) ─────────── */
function WClock({ size }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: size !== 'small' ? '2-digit' : undefined });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  /* Just the (real) clock — no invented on-call rotation or always-green
     service status board; there's no status feed to back either. */
  return (
    <WCard size={size} accent="#3FA9F5" title="Ops Center" glyph="statuspage">
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-high)', letterSpacing: '0.02em' }}>{time}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>{date}</div>
        </div>
      )}
      {size !== 'small' && <>
        <div className="mono" style={{ fontSize: size === 'large' ? 48 : 40, fontWeight: 600, color: 'var(--text-high)', marginTop: 4, lineHeight: 1 }}>{time}</div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{date}</div>
        {size === 'large' && <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 11, color: 'var(--text-low)' }}>On-call rotation and service status appear here once those feeds are set up.</div>}
      </>}
    </WCard>
  );
}

registerWidget('weather',     { label: 'Field Weather',      cat: 'Inventive', accent: '#4AA3E0', glyph: 'cameras',    sizes: ['small', 'medium', 'large'], render: s => <WWeather size={s} /> });
registerWidget('leaderboard', { label: 'Tech Leaderboard',   cat: 'Inventive', accent: '#FCD34D', glyph: 'star',       sizes: ['small', 'medium', 'large'], render: s => <WLeaderboard size={s} /> });
registerWidget('nps',         { label: 'NPS Pulse',          cat: 'Inventive', accent: '#34D399', glyph: 'star',       sizes: ['small', 'medium', 'large'], render: s => <WNPS size={s} /> });
registerWidget('safety',      { label: 'Safety Streak',      cat: 'Inventive', accent: '#34D399', glyph: 'check',      sizes: ['small', 'medium', 'large'], render: s => <WSafety size={s} /> });
registerWidget('hermes',      { label: 'ShieldTech AI Briefing',    cat: 'Inventive', accent: '#3FA9F5', glyph: 'hermes',     sizes: ['small', 'medium', 'large'], render: s => <WShieldAI size={s} /> });
registerWidget('clock',       { label: 'Ops Center Clock',   cat: 'Inventive', accent: '#3FA9F5', glyph: 'statuspage', sizes: ['small', 'medium', 'large'], render: s => <WClock size={s} /> });

/* ── Master display order for the gallery ── */
const ST_ORDER = ['tickets', 'monitoring', 'workorders', 'schedule', 'fleet', 'approvals', 'mrr', 'pipeline', 'revenue', 'health', 'renewals', 'weather', 'leaderboard', 'nps', 'safety', 'hermes', 'clock'];

Object.assign(window, { Sun, WWeather, WLeaderboard, WNPS, WSafety, WShieldAI, WClock, ST_ORDER });

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
  const city = 'Porto', temp = 29, cond = 'Sunny', hi = 30, lo = 13;
  const hours = [['1PM', 29], ['2PM', 28], ['3PM', 27], ['4PM', 23], ['5PM', 19], ['6PM', 17]];
  const days = [['Tuesday', 24, 14], ['Wednesday', 22, 12], ['Thursday', 22, 14], ['Friday', 29, 13], ['Saturday', 27, 14]];
  const accent = '#4AA3E0';
  return (
    <div className="st-wcard" style={{
      width: WSIZE[size].w, height: WSIZE[size].h, borderRadius: 22, padding: 16, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', color: '#fff',
      background: 'linear-gradient(165deg, #3E8FCC 0%, #4AA3E0 45%, #5FB8EC 100%)',
      border: '1px solid rgba(255,255,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px -12px rgba(0,0,0,0.7)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="display" style={{ fontSize: size === 'small' ? 16 : 19, fontWeight: 500 }}>{city}</div>
          <div className="display" style={{ fontSize: size === 'small' ? 40 : 46, fontWeight: 200, lineHeight: 1 }}>{temp}°</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Sun size={size === 'small' ? 26 : 30} color="#FCD34D" />
          {size !== 'small' && <>
            <div style={{ fontSize: 14, marginTop: 6 }}>{cond}</div>
            <div style={{ fontSize: 13, opacity: 0.95 }}>H:{hi}° L:{lo}°</div>
          </>}
        </div>
      </div>
      {size === 'small' && (
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}><Sun size={14} /> {cond}</div>
          <div style={{ fontSize: 13, opacity: 0.95 }}>H:{hi}° L:{lo}°</div>
        </div>
      )}
      {size !== 'small' && <>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '12px 0 10px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 2 }}>
          {hours.map(([h, t]) => (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.95 }}>{h}</span>
              <Sun size={15} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t}°</span>
            </div>
          ))}
        </div>
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {days.map(([d, h, l], i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < days.length - 1 ? '1px solid rgba(255,255,255,0.18)' : 'none' }}>
              <span style={{ flex: 1, fontSize: 15 }}>{d}</span>
              <Sun size={17} />
              <span className="mono" style={{ width: 44, textAlign: 'right', fontSize: 15, fontWeight: 500 }}>{h}</span>
              <span className="mono" style={{ width: 40, textAlign: 'right', fontSize: 15, opacity: 0.7 }}>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── Tech Leaderboard (gamified) ─────────── */
function WLeaderboard({ size }) {
  const techs = [
    { id: 'TG', name: 'Tony Garcia', jobs: 14, xp: 2840, color: '#F43F5E' },
    { id: 'MR', name: 'Mike Reyes', jobs: 12, xp: 2610, color: '#3FA9F5' },
    { id: 'JL', name: 'Jessica Liu', jobs: 11, xp: 2390, color: '#34D399' },
    { id: 'KW', name: 'Kevin White', jobs: 9, xp: 1980, color: '#FBBF24' },
    { id: 'DP', name: 'Diana Patel', jobs: 8, xp: 1720, color: '#c084fc' },
  ];
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
  const days = 47, record = 63, target = 90;
  const milestones = [['30d', true], ['45d', true], ['60d', false], ['90d', false]];
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
  const insights = [
    { icon: 'warning-tri', color: '#F43F5E', t: 'Riverside NVR SLA breaches in 1.8h', s: 'Dispatch ETA 10am — on track' },
    { icon: 'roi', color: '#34D399', t: 'MRR up 6.2% MoM', s: 'Pinnacle Enterprise plan activated' },
    { icon: 'pipeline', color: '#3FA9F5', t: 'Pacific Rim deal ready to schedule', s: '$215k · 3 properties approved' },
    { icon: 'warning-tri', color: '#FBBF24', t: 'Bayshore Medical at churn risk', s: 'NPS 4 · renewal Jul · no follow-up' },
  ];
  return (
    <WCard size={size} accent="#3FA9F5" title="ShieldTech AI Briefing" glyph="hermes" sub={size !== 'small' ? 'AI · updated 8:00 AM' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Icon name={insights[0].icon} size={18} color={insights[0].color} />
          <div style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 500, marginTop: 8, lineHeight: 1.3 }}>{insights[0].t}</div>
          <div style={{ marginTop: 'auto', fontSize: 10, color: 'var(--text-low)' }}>+{insights.length - 1} more insights</div>
        </div>
      )}
      {size !== 'small' && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: size === 'large' ? 11 : 9 }}>
          {insights.slice(0, size === 'large' ? 4 : 2).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: hexToRgba(it.color, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={it.icon} size={14} color={it.color} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-high)', fontWeight: 500, lineHeight: 1.25 }}>{it.t}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 1 }}>{it.s}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Ops Clock (live) ─────────── */
function WClock({ size }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: size !== 'small' ? '2-digit' : undefined });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const systems = [['Monitoring', '#34D399'], ['Dispatch', '#34D399'], ['Payments', '#34D399'], ['ShieldTech AI', '#34D399']];
  return (
    <WCard size={size} accent="#3FA9F5" title="Ops Center" glyph="statuspage" sub={size !== 'small' ? 'on-call: Mike Reyes' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-high)', letterSpacing: '0.02em' }}>{time}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>{date}</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} /><span style={{ fontSize: 11, color: '#34D399' }}>All systems go</span></div>
        </div>
      )}
      {size !== 'small' && <>
        <div className="mono" style={{ fontSize: size === 'large' ? 48 : 40, fontWeight: 600, color: 'var(--text-high)', marginTop: 4, lineHeight: 1 }}>{time}</div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{date}</div>
        <WDivide />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: size === 'large' ? 9 : 6 }}>
          {systems.slice(0, size === 'large' ? 4 : 2).map(([s, c]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{s}</span>
            </div>
          ))}
        </div>
        {size === 'large' && <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 11, color: 'var(--text-low)' }}>On-call rotation · Mike Reyes until 6:00 PM → Tony Garcia</div>}
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

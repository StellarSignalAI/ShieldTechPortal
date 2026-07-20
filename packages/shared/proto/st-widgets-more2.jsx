/* ShieldTech Widgets — More: Inventive / Fun
   Threat Level (animated) · Device Uptime Wall · Team Kudos (rotating) ·
   Cert Expiry · Install Heatmap · On-Call Rotation */

const M2_TEAM = [];
function m2Avatar(t, sz = 24) {
  return (
    <span style={{ width: sz, height: sz, borderRadius: '50%', background: hexToRgba(t.color, 0.22), color: t.color, fontSize: sz * 0.42, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${hexToRgba(t.color, 0.4)}` }}>{t.init}</span>
  );
}

/* ─────────── Threat Level (animated security posture) ─────────── */
const M2_LEVELS = [
  { label: 'LOW', color: '#34D399' },
  { label: 'GUARDED', color: '#3FA9F5' },
  { label: 'ELEVATED', color: '#FBBF24' },
  { label: 'HIGH', color: '#FB923C' },
  { label: 'SEVERE', color: '#F43F5E' },
];
function WThreat({ size }) {
  const [incidents] = useShieldStore(incidentStore);
  const [tickets] = useShieldStore(ticketStore);
  const p1 = incidents.filter(i => i.status === 'active' && i.severity === 'P1').length;
  const p2 = incidents.filter(i => i.status === 'active' && i.severity === 'P2').length;
  const crit = tickets.filter(t => t.status !== 'resolved' && t.priority === 'critical').length;
  const score = p1 * 3 + p2 + crit * 2;
  const idx = score === 0 ? 0 : score <= 2 ? 1 : score <= 4 ? 2 : score <= 7 ? 3 : 4;
  const lvl = M2_LEVELS[idx];
  const pct = ((idx + 1) / 5) * 100;
  const factors = [
    { l: 'Active P1 incidents', v: p1, bad: p1 > 0 },
    { l: 'Critical tickets', v: crit, bad: crit > 0 },
    { l: 'P2 incidents', v: p2, bad: p2 > 1 },
  ];
  const Halo = ({ d }) => (
    <span className="st-threat-pulse" style={{ width: d, height: d, borderRadius: '50%', background: lvl.color, boxShadow: `0 0 0 0 ${lvl.color}`, display: 'inline-block', flexShrink: 0 }} />
  );
  return (
    <WCard size={size} accent={lvl.color} title="Threat Level" glyph="siren"
      sub={size !== 'small' ? 'live security posture' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', gap: 10 }}>
          <Halo d={16} />
          <div className="display" style={{ fontSize: 24, fontWeight: 600, color: lvl.color, letterSpacing: '0.02em' }}>{lvl.label}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>level {idx + 1} of 5</div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'center' }}>
          <WRing pct={pct} value={idx + 1} label={`of 5`} color={lvl.color} size={82} stroke={8} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Halo d={11} /><span className="display" style={{ fontSize: 20, fontWeight: 600, color: lvl.color }}>{lvl.label}</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 6 }}>{score === 0 ? 'No active threats detected' : `${p1 + crit} signals driving posture`}</div>
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WRing pct={pct} value={idx + 1} label="of 5" color={lvl.color} size={92} stroke={9} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Halo d={13} /><span className="display" style={{ fontSize: 26, fontWeight: 600, color: lvl.color }}>{lvl.label}</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>posture recalculated live</div>
          </div>
        </div>
        <WDivide />
        <div>
          {factors.map((f, i) => (
            <WRow key={f.l} last={i === factors.length - 1} label={f.l} glyph={f.bad ? 'warning-tri' : 'check'}
              glyphColor={f.bad ? lvl.color : '#34D399'} a={f.v} accent={lvl.color} />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Device Uptime Wall ─────────── */
/* deterministic fleet status: 0 ok · 1 warn · 2 down */
const M2_FLEET = [];
const M2_UPCOLOR = ['#34D399', '#FBBF24', '#F43F5E'];
const M2_SITES = [];
function WUptime({ size }) {
  if (!M2_FLEET.length) return <WNoData size={size} title="Device Uptime" glyph="camera-feed" accent="#34D399" />;
  const down = M2_FLEET.filter(s => s === 2).length;
  const warn = M2_FLEET.filter(s => s === 1).length;
  const ok = M2_FLEET.length - down - warn;
  const pct = (ok / M2_FLEET.length * 100).toFixed(1);
  const accent = down ? '#F43F5E' : warn ? '#FBBF24' : '#34D399';
  const Grid = ({ cells, dot, gap }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells}, 1fr)`, gap, marginTop: 'auto' }}>
      {M2_FLEET.slice(0, cells * Math.ceil(M2_FLEET.length / cells)).map((s, i) => (
        <span key={i} style={{ width: dot, height: dot, borderRadius: 3, background: M2_UPCOLOR[s], boxShadow: s ? `0 0 5px ${M2_UPCOLOR[s]}` : 'none', opacity: s === 0 ? 0.85 : 1 }} />
      ))}
    </div>
  );
  return (
    <WCard size={size} accent={accent} title="Device Uptime" glyph="camera-feed"
      sub={size !== 'small' ? `${ok}/${M2_FLEET.length} devices online` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="display" style={{ fontSize: 30, fontWeight: 600, color: accent }}>{pct}<span style={{ fontSize: 16, color: 'var(--text-mid)' }}>%</span></div>
          <Grid cells={8} dot={10} gap={4} />
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div className="display" style={{ fontSize: 34, fontWeight: 600, color: accent }}>{pct}<span style={{ fontSize: 16, color: 'var(--text-mid)' }}>%</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{down} down · {warn} warning</div>
          </div>
          <Grid cells={16} dot={12} gap={4} />
        </div>
      )}
      {size === 'large' && <>
        <div className="display" style={{ fontSize: 40, fontWeight: 600, color: accent }}>{pct}<span style={{ fontSize: 20, color: 'var(--text-mid)' }}>%</span></div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 8 }}>{down} offline · {warn} degraded · {ok} healthy</div>
        <Grid cells={16} dot={13} gap={5} />
        <WDivide />
        <div>
          {M2_SITES.map((s, i) => (
            <WRow key={s.name} last={i === M2_SITES.length - 1} label={s.name} glyph="topology"
              glyphColor={s.up >= 99 ? '#34D399' : s.up >= 96 ? '#FBBF24' : '#F43F5E'} a={`${s.up}%`} b={`${s.n}`} accent={accent} />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Team Kudos (rotating shoutouts) ─────────── */
const M2_KUDOS = [];
function WKudos({ size }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % M2_KUDOS.length), 4500);
    return () => clearInterval(t);
  }, []);
  if (!M2_KUDOS.length || !M2_TEAM.length) return <WNoData size={size} title="Team Kudos" glyph="star" accent="#FCD34D" />;
  const k = M2_KUDOS[idx % M2_KUDOS.length];
  const from = M2_TEAM[k.from], to = M2_TEAM[k.to];
  return (
    <WCard size={size} accent="#FCD34D" title="Team Kudos" glyph="star"
      sub={size !== 'small' ? 'shoutouts this week' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: 6 }}>{m2Avatar(to, 30)}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-high)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            <strong>{to.name.split(' ')[0]}</strong> {k.text}
          </div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 12, height: '100%', alignItems: 'center' }}>
          {m2Avatar(to, 48)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{to.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.35, marginTop: 3 }}>{k.text}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 6 }}>— from {from.name}</div>
          </div>
        </div>
      )}
      {size === 'large' && (
        <div style={{ marginTop: 4 }}>
          {M2_KUDOS.slice(0, 4).map((kd, i) => {
            const t = M2_TEAM[kd.to], f = M2_TEAM[kd.from];
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i === 3 ? 'none' : '1px solid rgba(255,255,255,0.06)', alignItems: 'flex-start', opacity: i === idx ? 1 : 0.72 }}>
                {m2Avatar(t, 30)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-high)', lineHeight: 1.3 }}><strong>{t.name.split(' ')[0]}</strong> {kd.text}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>from {f.name.split(' ')[0]}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Cert Expiry Countdown ─────────── */
const M2_CERTS = [];
function m2CertColor(d) { return d <= 14 ? '#F43F5E' : d <= 45 ? '#FBBF24' : '#34D399'; }
function WCerts({ size }) {
  if (!M2_CERTS.length || !M2_TEAM.length) return <WNoData size={size} title="Cert Expiry" glyph="certs" />;
  const sorted = [...M2_CERTS].sort((a, b) => a.days - b.days);
  const soon = sorted.filter(c => c.days <= 60);
  const nearest = sorted[0];
  const nt = M2_TEAM[nearest.t];
  const accent = m2CertColor(nearest.days);
  return (
    <WCard size={size} accent={accent} title="Cert Expiry" glyph="certs"
      sub={size !== 'small' ? `${soon.length} expiring ≤ 60 days` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={nearest.days} unit="d" color={accent} />
          <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nt.name.split(' ')[0]} · {nearest.cert.split('—')[0].trim()}</div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 12, height: '100%', alignItems: 'center' }}>
          {m2Avatar(nt, 46)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nearest.cert}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>{nt.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginTop: 6 }}>expires in {nearest.days} days</div>
          </div>
        </div>
      )}
      {size === 'large' && (
        <div style={{ marginTop: 2 }}>
          {sorted.slice(0, 5).map((c, i) => {
            const t = M2_TEAM[c.t];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === Math.min(sorted.length, 5) - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                {m2Avatar(t, 26)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cert}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.name}</div>
                </div>
                <WPill color={m2CertColor(c.days)}>{c.days}d</WPill>
              </div>
            );
          })}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Install Heatmap (busiest windows) ─────────── */
const M2_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const M2_BLOCKS = ['AM', 'Mid', 'PM'];
function WPowerHour({ size }) {
  const [jobs] = useShieldStore(jobStore);
  // grid[day 0-4][block 0-2] = weighted job count
  const grid = M2_DAYS.map(() => [0, 0, 0]);
  jobs.forEach(j => {
    if (j.day >= 1 && j.day <= 5 && j.type !== 'meeting') {
      const b = j.start < 10 ? 0 : j.start < 13 ? 1 : 2;
      grid[j.day - 1][b] += 1;
    }
  });
  const max = Math.max(1, ...grid.flat());
  // peak
  let peak = { d: 0, b: 0, v: 0 };
  grid.forEach((row, d) => row.forEach((v, b) => { if (v > peak.v) peak = { d, b, v }; }));
  const accent = '#c084fc';
  const cell = (v, sz) => (
    <div style={{ width: sz, height: sz, borderRadius: 4, background: v ? hexToRgba(accent, 0.18 + 0.6 * (v / max)) : 'rgba(255,255,255,0.04)', border: `1px solid ${v ? hexToRgba(accent, 0.35) : 'rgba(255,255,255,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sz > 22 ? 11 : 0, color: 'var(--text-high)', fontWeight: 600 }}>{sz > 22 && v ? v : ''}</div>
  );
  const Heat = ({ sz }) => (
    <div style={{ display: 'flex', gap: 5, marginTop: 'auto' }}>
      {M2_DAYS.map((d, di) => (
        <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {grid[di].map((v, bi) => <React.Fragment key={bi}>{cell(v, sz)}</React.Fragment>)}
          {sz > 18 && <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{d}</span>}
        </div>
      ))}
    </div>
  );
  return (
    <WCard size={size} accent={accent} title="Install Heatmap" glyph="bolt"
      sub={size !== 'small' ? 'job density · this week' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>peak window</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 600, color: accent, marginTop: 2 }}>{M2_DAYS[peak.d]} {M2_BLOCKS[peak.b]}</div>
          <Heat sz={11} />
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WDivide />
          <Heat sz={18} />
        </div>
      )}
      {size === 'large' && <>
        <WDivide />
        <Heat sz={30} />
        <WDivide />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-mid)' }}>Busiest</span>
          <span style={{ color: accent, fontWeight: 600 }}>{M2_DAYS[peak.d]} {M2_BLOCKS[peak.b]} · {peak.v} jobs</span>
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── On-Call Rotation ─────────── */
function WOnCall({ size }) {
  if (!M2_TEAM.length) return <WNoData size={size} title="On-Call" glyph="phone" />;
  const dow = new Date().getDay(); // 0 Sun..6 Sat
  const cur = M2_TEAM[dow % M2_TEAM.length];
  const next = M2_TEAM[(dow + 1) % M2_TEAM.length];
  const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const accent = '#3FA9F5';
  return (
    <WCard size={size} accent={accent} title="On-Call" glyph="phone"
      sub={size !== 'small' ? 'duty rotation' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', gap: 8 }}>
          {m2Avatar(cur, 40)}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{cur.name}</div>
            <div style={{ fontSize: 10.5, color: '#34D399', marginTop: 1 }}>● on call now</div>
          </div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            {m2Avatar(cur, 52)}
            <div style={{ fontSize: 9, color: '#34D399', marginTop: 4 }}>NOW</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>{cur.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>primary responder</div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              {m2Avatar(next, 22)}
              <span style={{ fontSize: 11, color: 'var(--text-low)' }}>next: {next.name.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 4 }}>
          {m2Avatar(cur, 46)}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)' }}>{cur.name}</div>
            <div style={{ fontSize: 11, color: '#34D399' }}>● on call now</div>
          </div>
        </div>
        <WDivide />
        <div>
          {week.map((d, i) => {
            const t = M2_TEAM[i % M2_TEAM.length];
            const isToday = i === dow;
            return (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i === 6 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ width: 32, fontSize: 11, color: isToday ? accent : 'var(--text-low)', fontWeight: isToday ? 700 : 400 }}>{d}</span>
                {m2Avatar(t, 22)}
                <span style={{ flex: 1, fontSize: 12.5, color: isToday ? 'var(--text-high)' : 'var(--text-mid)' }}>{t.name}</span>
                {isToday && <WPill color="#34D399">now</WPill>}
              </div>
            );
          })}
        </div>
      </>}
    </WCard>
  );
}

registerWidget('threat',    { label: 'Threat Level',      cat: 'Inventive', accent: '#F43F5E', glyph: 'siren',       sizes: ['small', 'medium', 'large'], render: s => <WThreat size={s} /> });
registerWidget('uptime',    { label: 'Device Uptime Wall',cat: 'Inventive', accent: '#34D399', glyph: 'camera-feed', sizes: ['small', 'medium', 'large'], render: s => <WUptime size={s} /> });
registerWidget('kudos',     { label: 'Team Kudos',        cat: 'Inventive', accent: '#FCD34D', glyph: 'star',        sizes: ['small', 'medium', 'large'], render: s => <WKudos size={s} /> });
registerWidget('certs',     { label: 'Cert Expiry',       cat: 'Inventive', accent: '#FBBF24', glyph: 'certs',       sizes: ['small', 'medium', 'large'], render: s => <WCerts size={s} /> });
registerWidget('powerhour', { label: 'Install Heatmap',   cat: 'Inventive', accent: '#c084fc', glyph: 'bolt',        sizes: ['small', 'medium', 'large'], render: s => <WPowerHour size={s} /> });
registerWidget('oncall',    { label: 'On-Call Rotation',  cat: 'Inventive', accent: '#3FA9F5', glyph: 'phone',       sizes: ['small', 'medium', 'large'], render: s => <WOnCall size={s} /> });

/* Extend the gallery/picker order with all the new widgets */
window.ST_ORDER = [
  ...window.ST_ORDER.slice(0, 6),                 // ops originals
  'incidents', 'sla', 'inventory', 'parts',       // ops new
  ...window.ST_ORDER.slice(6, 11),                // finance originals
  'invoices', 'commissions',                      // finance new
  ...window.ST_ORDER.slice(11),                   // inventive originals
  'threat', 'uptime', 'kudos', 'certs', 'powerhour', 'oncall', // inventive new
];

Object.assign(window, { WThreat, WUptime, WKudos, WCerts, WPowerHour, WOnCall, M2_TEAM });

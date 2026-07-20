// ============================================================
// Leads engine — Isometric site model + HERMES agent replay
// BrIsoView: 3D-ish building with AI device placement.
// BrAgentReplay: watch the overnight run rebuild this bid.
// ============================================================

/* ─────────── Isometric building ─────────── */
function BrIsoView({ opp, state }) {
  const plan = React.useMemo(() => brPlan(opp), [opp.id]);
  const counts = brDeviceCounts(opp, state);
  const [hover, setHover] = React.useState(null);
  // map plan coords (0..100, 0..80) to iso space
  const iso = (x, y, z = 0) => ({ X: 50 + (x - y * 1.25) * 0.52, Y: 34 + (x + y * 1.25) * 0.26 - z });
  const P = (x, y, z) => { const p = iso(x, y, z); return `${p.X},${p.Y}`; };
  const H = 14; // wall height
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ padding: 0, overflow: 'hidden', background: 'radial-gradient(circle at 50% 0%, rgba(63,169,245,0.07), transparent 60%), #080D18' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Icon name="building" size={15} color="var(--brand)" />
          <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>Digital site model</span>
          <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-low)' }}>— survey-grade · field-verified dimensions · BM-1 EL 100.00'</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {counts.filter(c => c.devices > 0).map(c => (
              <span key={c.trade} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', font: '600 10.5px/1 var(--font-mono)', color: BR_TRADE_COLOR[c.trade] || '#7DD3FC' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: BR_TRADE_COLOR[c.trade] || '#7DD3FC' }} />{c.devices} {c.trade}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 100 72" style={{ display: 'block', width: '100%', maxHeight: 480 }}>
          {/* ground grid */}
          {[0, 20, 40, 60, 80, 100].map(g => (
            <React.Fragment key={g}>
              <polyline points={`${P(g, 0, 0)} ${P(g, 80, 0)}`} fill="none" stroke="rgba(63,169,245,0.07)" strokeWidth="0.2" />
              <polyline points={`${P(0, g * 0.8, 0)} ${P(100, g * 0.8, 0)}`} fill="none" stroke="rgba(63,169,245,0.07)" strokeWidth="0.2" />
            </React.Fragment>
          ))}
          {/* column grid bubbles on the slab */}
          {[10, 30, 50, 70, 90].map((gx, i) => {
            const p = iso(gx, 0, 0);
            return (
              <g key={'g' + gx}>
                <circle cx={p.X} cy={p.Y - 2.5} r="1.5" fill="#080D18" stroke="rgba(125,211,252,0.5)" strokeWidth="0.22" />
                <text x={p.X} y={p.Y - 1.9} fontSize="1.6" fill="rgba(125,211,252,0.75)" textAnchor="middle" fontFamily="var(--font-mono)">{String.fromCharCode(65 + i)}</text>
                <line x1={p.X} y1={p.Y - 1} x2={iso(gx, 80, 0).X} y2={iso(gx, 80, 0).Y} stroke="rgba(125,211,252,0.08)" strokeWidth="0.15" strokeDasharray="1.4 0.8" />
              </g>
            );
          })}
          {/* building slab */}
          <polygon points={`${P(2, 2, 0)} ${P(98, 2, 0)} ${P(98, 78, 0)} ${P(2, 78, 0)}`} fill="rgba(63,169,245,0.05)" stroke="rgba(125,211,252,0.4)" strokeWidth="0.3" />
          {/* rooms as extruded blocks */}
          {plan.rooms.map((r, i) => {
            const x2 = r.x + r.w, y2 = r.y + r.h;
            return (
              <g key={i}>
                <polygon points={`${P(r.x, y2, 0)} ${P(x2, y2, 0)} ${P(x2, y2, H)} ${P(r.x, y2, H)}`} fill="rgba(16,35,59,0.9)" stroke="rgba(125,211,252,0.45)" strokeWidth="0.25" />
                <polygon points={`${P(x2, r.y, 0)} ${P(x2, y2, 0)} ${P(x2, y2, H)} ${P(x2, r.y, H)}`} fill="rgba(10,22,38,0.9)" stroke="rgba(125,211,252,0.45)" strokeWidth="0.25" />
                <polygon points={`${P(r.x, r.y, H)} ${P(x2, r.y, H)} ${P(x2, y2, H)} ${P(r.x, y2, H)}`} fill="rgba(30,58,95,0.55)" stroke="rgba(125,211,252,0.55)" strokeWidth="0.3" />
                <text {...(() => { const p = iso(r.x + 2, r.y + 4, H); return { x: p.X, y: p.Y }; })()} fontSize="1.7" fill="rgba(125,211,252,0.55)" fontFamily="var(--font-mono)">{100 + i * 2}</text>
              </g>
            );
          })}
          {/* devices on the roof plane with drop lines */}
          {plan.devices.map(d => {
            const c = BR_TRADE_COLOR[d.trade] || '#7DD3FC';
            const p = iso(d.x, d.y, H);
            const on = hover === d.id;
            return (
              <g key={d.id} onPointerEnter={() => setHover(d.id)} onPointerLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
                <line x1={p.X} y1={p.Y} x2={p.X} y2={p.Y - (on ? 6 : 4)} stroke={c} strokeWidth="0.22" opacity="0.75" />
                <circle cx={p.X} cy={p.Y - (on ? 6 : 4)} r={on ? 1.3 : 0.9} fill={c} opacity="0.95" />
                <circle cx={p.X} cy={p.Y} r="0.4" fill={c} />
                {on && (
                  <g>
                    <rect x={p.X + 2} y={p.Y - 11} width="16" height="3.4" rx="0.6" fill="rgba(8,13,24,0.95)" stroke={c} strokeWidth="0.22" />
                    <text x={p.X + 10} y={p.Y - 8.6} fontSize="1.8" fill={c} textAnchor="middle" fontFamily="var(--font-mono)">{d.tag}</text>
                  </g>
                )}
              </g>
            );
          })}
          {/* overall dimension string along the front edge */}
          {(() => {
            const a = iso(2, 78, 0), b = iso(98, 78, 0);
            const mx = (a.X + b.X) / 2, my = (a.Y + b.Y) / 2;
            return (
              <g>
                <line x1={a.X - 1} y1={a.Y + 2.5} x2={b.X - 1} y2={b.Y + 2.5} stroke="rgba(125,211,252,0.45)" strokeWidth="0.2" />
                <line x1={a.X - 1} y1={a.Y + 1.4} x2={a.X - 1} y2={a.Y + 3.6} stroke="rgba(125,211,252,0.45)" strokeWidth="0.2" />
                <line x1={b.X - 1} y1={b.Y + 1.4} x2={b.X - 1} y2={b.Y + 3.6} stroke="rgba(125,211,252,0.45)" strokeWidth="0.2" />
                <text x={mx} y={my + 5.2} fontSize="1.8" fill="rgba(125,211,252,0.75)" textAnchor="middle" fontFamily="var(--font-mono)">{'192\'-0" OVERALL'}</text>
              </g>
            );
          })()}
          {/* survey benchmark */}
          {(() => {
            const p = iso(2, 2, 0);
            return (
              <g>
                <path d={`M ${p.X} ${p.Y} l 1.3 0 l -1.3 1.3 Z`} fill="#FCD34D" />
                <text x={p.X + 2} y={p.Y + 1} fontSize="1.4" fill="rgba(251,191,36,0.8)" fontFamily="var(--font-mono)">BM-1 EL 100.00'</text>
              </g>
            );
          })()}
          <text x="97" y="70" fontSize="2" fill="rgba(125,211,252,0.5)" textAnchor="end" fontFamily="var(--font-mono)">{'SURVEY-GRADE MODEL · DIMENSIONS FIELD-VERIFIED · WALL HT 14\'-0"'}</text>
        </svg>
      </Card>
      <div style={{ font: '400 12px/1.6 var(--font-body)', color: 'var(--text-low)' }}>
        Hover any device for its callout tag. Model is dimensioned to the column grid and benchmark BM-1 — device locations match the marked plan set coordinate-for-coordinate.
      </div>
    </div>
  );
}

/* ─────────── Agent replay — watch HERMES build the bid ─────────── */
function BrAgentReplay({ opp, onClose }) {
  const h = brHash(opp.id);
  const counts = brDeviceCounts(opp, brDefaultState());
  const totalDev = counts.reduce((a, c) => a + c.devices, 0);
  const bomN = brBOM(opp, brDefaultState()).length;
  const est = brEstimate(opp, brDefaultState());
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const pages = 24 + (h % 40);
  const steps = [
    { t: '04:11:52', icon: 'route', txt: `Connected to ${opp.source} — scanning new solicitations for PA/NJ/NY/MD low-voltage work` },
    { t: '04:12:07', icon: 'target', txt: `Matched "${opp.title}" — ${opp.buyer}. Fit ${opp.fit}/100 against your win profile` },
    { t: '04:12:31', icon: 'doc', txt: `Downloaded and parsed the RFP — ${pages} pages, ${brRFP(opp).sections.length} sections, bid due ${swDueLabel(opp.dueAt)}` },
    { t: '04:13:04', icon: 'grid', txt: `Read ${opp.trades.length} drawing sheets. Counted ${totalDev} devices: ${counts.filter(c => c.devices > 0).map(c => `${c.devices} ${c.trade.toLowerCase()}`).join(', ')}` },
    { t: '04:13:22', icon: 'alert', txt: `Cross-checked schedules vs drawings — ${brFlags(opp).length} quantity conflicts flagged for your review` },
    { t: '04:13:48', icon: 'sparkles', txt: `Marked up all sheets: device symbols, callout tags, and a combined plan model` },
    { t: '04:14:15', icon: 'list', txt: `Built the BOM — ${bomN} lines, ${fmt(est.material)} material, matched to distributor pricing` },
    { t: '04:14:36', icon: 'dollar', txt: `Priced 3 tiers off your cost stack: Low ${fmt(est.subtotal * 1.10)} · Medium ${fmt(est.subtotal * 1.18)} · Aggressive ${fmt(est.subtotal * 1.26)}` },
    { t: '04:14:52', icon: 'users', txt: `Simulated the field — ${brCompetitors(opp).length} likely competitors modeled from award history` },
    { t: '04:15:03', icon: 'send', txt: `Drafted the customer proposal and queued this bid for your morning review` },
  ];
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  React.useEffect(() => {
    if (n >= steps.length) return;
    const id = setTimeout(() => setN(x => x + 1), n === 0 ? 350 : 620);
    return () => clearTimeout(id);
  }, [n]);
  return (
    <div className="sw-fade" style={{ position: 'fixed', inset: 0, zIndex: 170, background: 'rgba(4,7,13,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(640px, 100%)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', background: '#0A0F1A', border: '1px solid var(--border-strong)', overflow: 'hidden', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)' }}><Icon name="sparkles" size={14} color="var(--brand)" /></span>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 13px/1 var(--font-display)', color: 'var(--text-high)' }}>How HERMES built this bid</div>
            <div style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-low)', letterSpacing: '0.08em', marginTop: 4 }}>OVERNIGHT RUN · {new Date(window.SW.TODAY + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase()} · 3M 11S TOTAL</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="x" size={16} color="var(--text-low)" /></button>
        </div>
        <div style={{ height: 3, background: 'rgba(63,169,245,0.1)' }}>
          <div style={{ width: (n / steps.length) * 100 + '%', height: '100%', background: 'linear-gradient(90deg, var(--brand), var(--status-ok))', transition: 'width 0.5s ease' }} />
        </div>
        <div className="sw-scroll" style={{ padding: '14px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 320 }}>
          {steps.slice(0, n).map((s, i) => (
            <div key={i} className="sw-up" style={{ display: 'flex', gap: 11, padding: '8px 4px', alignItems: 'flex-start' }}>
              <span style={{ font: '500 10.5px/1.7 var(--font-mono)', color: 'var(--text-low)', flexShrink: 0 }}>{s.t}</span>
              <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)' }}><Icon name={s.icon} size={12} color={i === steps.length - 1 ? 'var(--status-ok)' : 'var(--brand)'} /></span>
              <span style={{ font: '400 12.5px/1.55 var(--font-body)', color: i === n - 1 ? 'var(--text-high)' : 'var(--text-mid)' }}>{s.txt}</span>
            </div>
          ))}
          {n < steps.length && (
            <div style={{ display: 'flex', gap: 11, padding: '8px 4px', alignItems: 'center' }}>
              <span style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--text-low)' }}>·······</span>
              <span className="sw-pulse" style={{ font: '500 11.5px/1 var(--font-mono)', color: 'var(--brand)' }}>working…</span>
            </div>
          )}
          {n >= steps.length && (
            <div className="sw-up" style={{ marginTop: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="checkCircle" size={16} color="var(--status-ok)" />
              <span style={{ font: '600 12.5px/1.4 var(--font-body)', color: 'var(--text-high)' }}>Bid fully assembled — every decision below is waiting for your approval in the Review deck.</span>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {n < steps.length && <Btn kind="ghost" size="sm" onClick={() => setN(steps.length)}>Skip to end</Btn>}
          <Btn kind="primary" size="sm" icon="check" onClick={onClose}>Start reviewing</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BrIsoView, BrAgentReplay });

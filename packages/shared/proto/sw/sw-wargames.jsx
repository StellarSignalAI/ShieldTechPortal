// ============================================================
// Leads engine — War Games
// Simulate the competitive field: modeled competitor bids on a
// price axis, your three tiers as markers, win odds per tier.
// ============================================================

function BrWarGames({ opp, state, update }) {
  const est = brEstimate(opp, { ...state, tier: null, marginPct: 0 });
  const comps = brCompetitors(opp);
  const fmt = (n) => '$' + Math.round(n / 1000) + 'K';
  const fmtF = (n) => '$' + Math.round(n).toLocaleString();
  const tiers = BR_TIERS.map(t => ({ ...t, price: est.subtotal * (1 + t.margin / 100) }));
  const all = [...comps.map(c => c.low), ...comps.map(c => c.high), ...tiers.map(t => t.price)];
  const min = Math.min(...all) * 0.97, max = Math.max(...all) * 1.03;
  const X = (v) => ((v - min) / (max - min)) * 100;
  const winOdds = (price) => {
    const beat = comps.filter(c => c.mid > price).length;
    return Math.min(92, Math.max(6, Math.round((beat / comps.length) * 78 + (opp.fit - 60) * 0.4)));
  };
  const [simTier, setSimTier] = React.useState(state.tier || 'medium');
  const sim = tiers.find(t => t.id === simTier);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <Icon name="target" size={15} color="var(--status-critical)" />
          <span style={{ font: '700 13.5px/1 var(--font-display)', color: 'var(--text-high)' }}>War games — the field SHIELDTECH AI expects</span>
          <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-low)' }}>— modeled from public award history in {opp.state}, ±5% bands</span>
        </div>
        {/* price axis */}
        <div style={{ position: 'relative', margin: '38px 8px 10px', height: comps.length * 34 + 60 }}>
          {/* tier markers */}
          {tiers.map(t => {
            const on = simTier === t.id;
            return (
              <div key={t.id} onClick={() => setSimTier(t.id)} style={{ position: 'absolute', left: X(t.price) + '%', top: 0, bottom: 24, cursor: 'pointer', zIndex: 3 }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: -1, width: 2, background: on ? 'var(--brand)' : 'rgba(63,169,245,0.35)', boxShadow: on ? '0 0 10px rgba(63,169,245,0.6)' : 'none' }} />
                <div style={{ position: 'absolute', top: -30, left: 0, transform: 'translateX(-50%)', padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap', background: on ? 'var(--brand)' : 'rgba(63,169,245,0.1)', border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border-strong)'), font: '700 10px/1 var(--font-mono)', color: on ? '#03121F' : 'var(--brand)', letterSpacing: '0.06em' }}>
                  {t.label.toUpperCase()} {fmt(t.price)}
                </div>
              </div>
            );
          })}
          {/* competitor ranges */}
          {comps.map((c, i) => (
            <div key={c.id} style={{ position: 'absolute', top: 34 + i * 34, left: 0, right: 0, height: 26 }}>
              <div style={{ position: 'absolute', left: X(c.low) + '%', width: (X(c.high) - X(c.low)) + '%', top: 7, height: 12, borderRadius: 6, background: c.mid < sim.price ? 'rgba(248,113,113,0.22)' : 'rgba(52,211,153,0.16)', border: '1px solid ' + (c.mid < sim.price ? 'rgba(248,113,113,0.55)' : 'rgba(52,211,153,0.45)') }} />
              <div style={{ position: 'absolute', left: X(c.mid) + '%', top: 5, width: 3, height: 16, borderRadius: 2, background: c.mid < sim.price ? 'var(--status-critical)' : 'var(--status-ok)' }} />
              <div style={{ position: 'absolute', left: X(c.low) + '%', top: -7, transform: 'translateX(-2px)', font: '600 9.5px/1 var(--font-mono)', color: 'var(--text-low)', whiteSpace: 'nowrap' }}>
                {c.name}{c.incumbent ? ' · INCUMBENT' : ''}
              </div>
            </div>
          ))}
          {/* axis */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'var(--border-strong)' }} />
          {[0, 25, 50, 75, 100].map(p => (
            <div key={p} style={{ position: 'absolute', left: p + '%', bottom: -18, transform: 'translateX(-50%)', font: '500 9.5px/1 var(--font-mono)', color: 'var(--text-low)' }}>{fmt(min + (max - min) * (p / 100))}</div>
          ))}
        </div>
      </Card>

      {/* outcome per tier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {tiers.map(t => {
          const odds = winOdds(t.price);
          const beats = comps.filter(c => c.mid > t.price).length;
          const on = simTier === t.id;
          const chosen = state.tier === t.id;
          return (
            <Card key={t.id} hover onClick={() => setSimTier(t.id)} style={{ padding: 14, border: on ? '1.5px solid var(--brand)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '700 12px/1 var(--font-display)', color: on ? 'var(--brand)' : 'var(--text-high)', letterSpacing: '0.05em' }}>{t.label.toUpperCase()}</span>
                <span style={{ font: '700 15px/1 var(--font-mono)', color: 'var(--text-high)' }}>{fmt(t.price)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, margin: '12px 0 4px' }}>
                <span style={{ font: '700 26px/1 var(--font-display)', color: odds >= 50 ? 'var(--status-ok)' : odds >= 30 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{odds}%</span>
                <span style={{ font: '500 11px/1.3 var(--font-body)', color: 'var(--text-low)' }}>simulated win odds</span>
              </div>
              <div style={{ font: '500 11.5px/1.5 var(--font-body)', color: 'var(--text-mid)' }}>Undercuts {beats} of {comps.length} modeled bids · {t.margin}% margin · {fmtF(t.price - est.subtotal)} gross</div>
              {update && (
                <Btn kind={chosen ? 'success' : 'secondary'} size="sm" icon={chosen ? 'checkCircle' : 'check'} full style={{ marginTop: 10 }}
                  onClick={(e) => { e.stopPropagation(); update({ tier: t.id, estimateLocked: true }); swToast(`${t.label} tier locked at ${fmtF(t.price)}`, 'ok'); }}>
                  {chosen ? 'Locked in' : 'Lock this tier'}
                </Btn>
              )}
            </Card>
          );
        })}
      </div>
      <div style={{ font: '400 11.5px/1.6 var(--font-body)', color: 'var(--text-low)' }}>
        Bands are SHIELDTECH AI's model of each competitor's likely number from public award history and their bidding style — a planning tool, not a guarantee. Red band = they likely beat the selected tier.
      </div>
    </div>
  );
}

Object.assign(window, { BrWarGames });

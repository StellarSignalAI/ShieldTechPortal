/* ShieldTech Widgets — Money group
   MRR / RMR · Pipeline · Revenue & Cash · Customer Health · Upcoming Renewals */

/* ─────────── MRR / Recurring Revenue ─────────── */
function WMRR({ size }) {
  const [mrr] = useShieldStore(mrrStore);
  const total = mrr.filter(m => !m.churned).reduce((s, m) => s + m.mrr, 0);
  const atRisk = mrr.filter(m => m.risk === 'high' && !m.churned);
  const spark = [38, 41, 40, 44, 47, 49, 52, total / 1000].map(v => Math.round(v));
  const top = [...mrr].filter(m => !m.churned).sort((a, b) => b.mrr - a.mrr);
  return (
    <WCard size={size} accent="#34D399" title="MRR" glyph="dollar"
      sub={size !== 'small' ? `${mrr.filter(m => !m.churned).length} active plans` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={`$${(total / 1000).toFixed(1)}k`} color="#34D399" />
          <div style={{ marginTop: 'auto' }}><WSpark data={spark} color="#34D399" w={150} h={28} /></div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 12, height: '100%' }}>
          <div style={{ flex: 1 }}>
            <WHero size={size} value={`$${(total / 1000).toFixed(1)}k`} color="#34D399" sub={`▲ 6.2% MoM`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}><WSpark data={spark} color="#34D399" w={140} h={70} /></div>
        </div>
      )}
      {size === 'large' && <>
        <WHero size="medium" value={`$${(total / 1000).toFixed(1)}k`} color="#34D399" sub="▲ 6.2% MoM · per-month recurring" />
        <div style={{ marginTop: 8 }}><WSpark data={spark} color="#34D399" w={336} h={48} /></div>
        <WDivide />
        <div>
          {top.slice(0, 4).map((m, i) => (
            <WRow key={m.customer} last={i === 3} label={m.customer} glyph="contracts"
              glyphColor={m.risk === 'high' ? '#F43F5E' : '#34D399'}
              a={`$${(m.mrr / 1000).toFixed(1)}k`} b={m.renewal.split(' ')[0]} accent="#34D399" />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Pipeline / Deals ─────────── */
function WPipeline({ size }) {
  const [deals] = useShieldStore(qtcStore);
  const stages = ['quote', 'approved', 'po', 'scheduled', 'installed', 'invoiced', 'paid'];
  const open = deals.filter(d => !['paid'].includes(d.stage));
  const totalVal = open.reduce((s, d) => s + d.value, 0);
  const byStage = st => deals.filter(d => d.stage === st).reduce((s, d) => s + d.value, 0);
  const hot = [...open].sort((a, b) => b.value - a.value);
  return (
    <WCard size={size} accent="#3FA9F5" title="Pipeline" glyph="pipeline"
      sub={size !== 'small' ? `${open.length} open deals` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={`$${(totalVal / 1000).toFixed(0)}k`} />
          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-mid)' }}>{open.length} deals open</div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WBars color="#3FA9F5" data={[
          { l: 'Qte', v: byStage('quote') }, { l: 'Apr', v: byStage('approved') }, { l: 'PO', v: byStage('po') },
          { l: 'Sch', v: byStage('scheduled') }, { l: 'Inst', v: byStage('installed') }, { l: 'Inv', v: byStage('invoiced') },
        ]} h={size === 'large' ? 56 : 46} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {hot.slice(0, 4).map((d, i) => (
            <WRow key={d.id} last={i === 3} label={d.name} glyph="dollar"
              glyphColor={d.risk === 'high' ? '#F43F5E' : d.risk === 'medium' ? '#FBBF24' : '#34D399'}
              a={`$${(d.value / 1000).toFixed(0)}k`} b={d.stage.slice(0, 4)} accent="#3FA9F5" />
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Revenue & Cash ─────────── */
function WRevenue({ size }) {
  const cash = 284500, ar = 159050, target = 350000;
  const monthly = [{ l: 'Jan', v: 210 }, { l: 'Feb', v: 245 }, { l: 'Mar', v: 232 }, { l: 'Apr', v: 278 }, { l: 'May', v: 305 }, { l: 'Jun', v: 284, color: '#34D399' }];
  const pct = Math.round((cash / target) * 100);
  return (
    <WCard size={size} accent="#34D399" title="Revenue" glyph="finance"
      sub={size !== 'small' ? 'June 2026 · MTD' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={`$${(cash / 1000).toFixed(0)}k`} color="#34D399" />
          <div style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--text-mid)' }}>{pct}% to goal</div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 12, height: '100%', alignItems: 'center' }}>
          <WRing pct={pct} value={pct + '%'} label="of goal" color="#34D399" size={80} />
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-high)' }}>${(cash / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>AR: ${(ar / 1000).toFixed(0)}k · Goal ${(target / 1000).toFixed(0)}k</div>
            <div style={{ marginTop: 8 }}><WSpark data={monthly.map(m => m.v)} color="#34D399" w={150} h={30} /></div>
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WRing pct={pct} value={pct + '%'} label="of goal" color="#34D399" size={92} stroke={9} />
          <div>
            <div className="display" style={{ fontSize: 36, fontWeight: 600, color: 'var(--text-high)' }}>${(cash / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>collected this month</div>
          </div>
        </div>
        <WDivide />
        <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>6-month revenue</div>
        <WBars data={monthly} color="#3FA9F5" h={64} />
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-mid)' }}>AR outstanding</span>
          <span className="mono" style={{ color: '#FBBF24', fontWeight: 600 }}>${(ar / 1000).toFixed(1)}k</span>
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Customer Health ─────────── */
function WHealth({ size }) {
  const [customers] = useShieldStore(customerStore);
  const scored = customers.filter(c => c.health > 0);
  const avg = Math.round(scored.reduce((s, c) => s + c.health, 0) / (scored.length || 1));
  const atRisk = customers.filter(c => c.health > 0 && c.health < 70).sort((a, b) => a.health - b.health);
  const color = avg >= 85 ? '#34D399' : avg >= 70 ? '#FBBF24' : '#F43F5E';
  return (
    <WCard size={size} accent={color} title="Customer Health" glyph="health"
      sub={size !== 'small' ? `${atRisk.length} need attention` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
          <WRing pct={avg} value={avg} color={color} size={72} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>avg score</div>
            <div style={{ fontSize: 13, color: atRisk.length ? '#F43F5E' : '#34D399', fontWeight: 600, marginTop: 2 }}>{atRisk.length} at risk</div>
          </div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'center' }}>
          <WRing pct={avg} value={avg} label="avg" color={color} size={80} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {atRisk.slice(0, 3).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.health < 50 ? '#F43F5E' : '#FBBF24', flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.name}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{c.health}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WRing pct={avg} value={avg} label="avg health" color={color} size={92} stroke={9} />
          <div>
            <div className="display" style={{ fontSize: 30, fontWeight: 600, color }}>{scored.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>active accounts scored</div>
          </div>
        </div>
        <WDivide />
        <div>
          {atRisk.slice(0, 4).map((c, i) => (
            <WRow key={c.id} last={i === Math.min(atRisk.length, 4) - 1} label={c.name} glyph="warning-tri"
              glyphColor={c.health < 50 ? '#F43F5E' : '#FBBF24'} a={c.health} b={`$${(c.mrr / 1000).toFixed(1)}k`} accent={color} />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Upcoming Renewals ─────────── */
function WRenewals({ size }) {
  const [mrr] = useShieldStore(mrrStore);
  const monthMap = { Jul: 0, Aug: 1, Sep: 2, Oct: 3, Nov: 4, Dec: 5 };
  const upcoming = mrr.filter(m => !m.churned && monthMap[m.renewal.split(' ')[0]] !== undefined)
    .sort((a, b) => monthMap[a.renewal.split(' ')[0]] - monthMap[b.renewal.split(' ')[0]]);
  const next90 = upcoming.filter(m => monthMap[m.renewal.split(' ')[0]] <= 2);
  const val90 = next90.reduce((s, m) => s + m.mrr, 0);
  return (
    <WCard size={size} accent="#FBBF24" title="Renewals" glyph="contracts"
      sub={size !== 'small' ? 'next 90 days' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={next90.length} color="#FBBF24" />
          <div style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--text-mid)' }}>${(val90 / 1000).toFixed(1)}k at renewal</div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent="#FBBF24" anchor={size === 'medium'} cells={['Jul', 'Aug', 'Sep'].map(mo => ({
          top: mo, color: '#FBBF24', bot: upcoming.filter(m => m.renewal.startsWith(mo)).length,
        }))} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {upcoming.slice(0, 4).map((m, i) => (
            <WRow key={m.customer} last={i === Math.min(upcoming.length, 4) - 1} label={m.customer}
              glyph={m.risk === 'high' ? 'warning-tri' : 'check'} glyphColor={m.risk === 'high' ? '#F43F5E' : '#34D399'}
              a={`$${(m.mrr / 1000).toFixed(1)}k`} b={m.renewal.split(' ')[0]} accent="#FBBF24" />
          ))}
        </div>
      )}
    </WCard>
  );
}

registerWidget('mrr',       { label: 'MRR / Recurring Rev',  cat: 'Finance', accent: '#34D399', glyph: 'dollar',    sizes: ['small', 'medium', 'large'], render: s => <WMRR size={s} /> });
registerWidget('pipeline',  { label: 'Pipeline / Deals',     cat: 'Finance', accent: '#3FA9F5', glyph: 'pipeline',  sizes: ['small', 'medium', 'large'], render: s => <WPipeline size={s} /> });
registerWidget('revenue',   { label: 'Revenue & Cash',       cat: 'Finance', accent: '#34D399', glyph: 'finance',   sizes: ['small', 'medium', 'large'], render: s => <WRevenue size={s} /> });
registerWidget('health',    { label: 'Customer Health',      cat: 'Finance', accent: '#FBBF24', glyph: 'health',    sizes: ['small', 'medium', 'large'], render: s => <WHealth size={s} /> });
registerWidget('renewals',  { label: 'Upcoming Renewals',    cat: 'Finance', accent: '#FBBF24', glyph: 'contracts', sizes: ['small', 'medium', 'large'], render: s => <WRenewals size={s} /> });

Object.assign(window, { WMRR, WPipeline, WRevenue, WHealth, WRenewals });

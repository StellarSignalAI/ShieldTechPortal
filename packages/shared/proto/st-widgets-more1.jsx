/* ShieldTech Widgets — More: Operations & Finance
   Live Incidents · SLA Countdown (ticking) · Truck Stock · Parts Requests · AR Aging · Commissions
   Same Apple-style small/medium/large progressive disclosure, dark-glass theme. */

const M1_SEV = { P1: '#F43F5E', P2: '#FBBF24', P3: '#3FA9F5' };
function m1Ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  return h < 24 ? h + 'h' : Math.floor(h / 24) + 'd';
}

/* ─────────── Live Incident Response ─────────── */
function WIncidents({ size }) {
  const [incidents] = useShieldStore(incidentStore);
  const active = incidents.filter(i => i.status === 'active');
  const sev = s => active.filter(i => i.severity === s).length;
  const accent = sev('P1') ? '#F43F5E' : sev('P2') ? '#FBBF24' : active.length ? '#3FA9F5' : '#34D399';
  const oldest = [...active].sort((a, b) => a.openedAt - b.openedAt);
  return (
    <WCard size={size} accent={accent} title="Incidents" glyph="siren"
      sub={size !== 'small' ? `${active.length} active · response` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={active.length} color={accent} />
          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-mid)' }}>
            <span style={{ color: M1_SEV.P1, fontWeight: 600 }}>{sev('P1')} P1</span> · {sev('P2')} P2
          </div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent={accent} anchor={size === 'medium'}
          cells={['P1', 'P2', 'P3'].map(s => ({ top: s, color: M1_SEV[s], bot: sev(s) }))} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {oldest.slice(0, 4).map((i, idx) => (
            <WRow key={i.id} last={idx === Math.min(oldest.length, 4) - 1} label={i.customer}
              glyph="warning-tri" glyphColor={M1_SEV[i.severity]} a={i.severity} b={m1Ago(i.openedAt)} accent={accent} />
          ))}
          {!oldest.length && <div style={{ fontSize: 12.5, color: '#34D399', marginTop: 8 }}>✓ No active incidents — all clear</div>}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── SLA Countdown (live ticking) ─────────── */
function WSLA({ size }) {
  const [tickets] = useShieldStore(ticketStore);
  const open = tickets.filter(t => t.status !== 'resolved' && t.sla);
  const sorted = [...open].sort((a, b) => a.sla.remaining - b.sla.remaining);
  const nearest = sorted[0];
  const [secs, setSecs] = React.useState((nearest?.sla.remaining || 0) * 3600);
  React.useEffect(() => { setSecs((nearest?.sla.remaining || 0) * 3600); }, [nearest?.id]);
  React.useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = Math.floor(secs / 3600), mm = Math.floor((secs % 3600) / 60), ss = secs % 60;
  const clock = `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const accent = secs < 3600 ? '#F43F5E' : secs < 10800 ? '#FBBF24' : '#34D399';
  return (
    <WCard size={size} accent={accent} title="SLA Countdown" glyph="timeline"
      sub={size !== 'small' ? `${open.length} tickets on clock` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: accent, letterSpacing: '-0.01em', marginTop: 4 }}>{clock}</div>
          <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nearest?.customer || 'All clear'}</div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next breach</div>
          <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: accent, lineHeight: 1, margin: '4px 0' }}>{clock}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIO[nearest?.priority] || accent }} />
            {nearest ? `${nearest.id} · ${nearest.customer}` : 'No tickets pending'}
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ textAlign: 'center', padding: '6px 0 10px' }}>
          <div className="mono" style={{ fontSize: 54, fontWeight: 700, color: accent, lineHeight: 1 }}>{clock}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginTop: 4 }}>until <strong style={{ color: 'var(--text-high)' }}>{nearest?.id}</strong> breaches SLA</div>
        </div>
        <WDivide />
        <div>
          {sorted.slice(0, 4).map((t, i) => (
            <WRow key={t.id} last={i === Math.min(sorted.length, 4) - 1} label={t.customer} glyph="clock"
              glyphColor={t.sla.remaining < 1 ? '#F43F5E' : t.sla.remaining < 3 ? '#FBBF24' : '#34D399'}
              a={`${t.sla.remaining}h`} b={t.id.replace('TK-', '#')} accent={accent} />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Truck Stock / Low Inventory ─────────── */
function WInventory({ size }) {
  const [truck] = useShieldStore(truckStore);
  const all = Object.entries(truck).flatMap(([tech, items]) => (items || []).map(it => ({ ...it, tech })));
  const low = all.filter(it => it.qty <= it.min).sort((a, b) => (a.qty - a.min) - (b.qty - b.min));
  const accent = low.length ? '#FBBF24' : '#34D399';
  return (
    <WCard size={size} accent={accent} title="Truck Stock" glyph="package"
      sub={size !== 'small' ? `${all.length} SKUs across fleet` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={low.length} color={accent} />
          <div style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--text-mid)' }}>{low.length ? 'need restock' : 'fully stocked'}</div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WDivide />
          <div style={{ flex: 1 }}>
            {low.slice(0, 3).map((it, i) => (
              <WRow key={it.sku + it.tech} last={i === Math.min(low.length, 3) - 1} label={it.name}
                glyph="package" glyphColor={accent} a={`${it.qty}/${it.min}`} b={it.tech} accent={accent} />
            ))}
            {!low.length && <div style={{ fontSize: 12.5, color: '#34D399', marginTop: 10 }}>✓ All trucks fully stocked</div>}
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WRing pct={Math.round((1 - low.length / (all.length || 1)) * 100)} value={low.length} label="low" color={accent} size={88} stroke={9} />
          <div>
            <div className="display" style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-high)' }}>{all.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>SKUs tracked on {Object.keys(truck).length} trucks</div>
          </div>
        </div>
        <WDivide />
        <div>
          {low.slice(0, 4).map((it, i) => (
            <WRow key={it.sku + it.tech} last={i === Math.min(low.length, 4) - 1} label={it.name}
              glyph="warning-tri" glyphColor={it.qty === 0 ? '#F43F5E' : '#FBBF24'} a={`${it.qty}/${it.min}`} b={it.tech} accent={accent} />
          ))}
        </div>
      </>}
    </WCard>
  );
}

/* ─────────── Parts Requests ─────────── */
function WParts({ size }) {
  const [parts] = useShieldStore(partsReqStore);
  const pending = parts.filter(p => p.status === 'requested');
  const urgent = pending.filter(p => p.urgency === 'urgent');
  const accent = urgent.length ? '#F43F5E' : pending.length ? '#3FA9F5' : '#34D399';
  const stat = s => parts.filter(p => p.status === s).length;
  return (
    <WCard size={size} accent={accent} title="Parts Requests" glyph="cart"
      sub={size !== 'small' ? `${pending.length} awaiting action` : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={pending.length} color={accent} />
          <div style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--text-mid)' }}>
            <span style={{ color: '#F43F5E', fontWeight: 600 }}>{urgent.length} urgent</span>
          </div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WStrip accent={accent} anchor={size === 'medium'} cells={[
          { top: 'Req', color: '#FBBF24', bot: stat('requested') },
          { top: 'Appr', color: '#3FA9F5', bot: stat('approved') },
          { top: 'Ful', color: '#34D399', bot: stat('fulfilled') },
        ]} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {parts.slice(0, 4).map((p, i) => (
            <WRow key={p.id} last={i === Math.min(parts.length, 4) - 1} label={p.techName || p.tech}
              glyph={p.urgency === 'urgent' ? 'warning-tri' : 'cart'} glyphColor={p.urgency === 'urgent' ? '#F43F5E' : accent}
              a={`${p.parts.reduce((s, x) => s + x.qty, 0)}pc`} b={p.status.slice(0, 4)} accent={accent} />
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── AR Aging / Invoices ─────────── */
const M1_AR = [
  { l: 'Current', v: 96400, color: '#34D399' },
  { l: '1-30', v: 42100, color: '#3FA9F5' },
  { l: '31-60', v: 18750, color: '#FBBF24' },
  { l: '61-90', v: 9200, color: '#FB923C' },
  { l: '90+', v: 5400, color: '#F43F5E' },
];
const M1_OVERDUE = [
  { customer: 'Pacific Rim Hotels', amt: 12600, days: 47 },
  { customer: 'Golden Gate Logistics', amt: 3100, days: 62 },
  { customer: 'Sutter Health', amt: 7800, days: 38 },
  { customer: 'Westfield Mall', amt: 5400, days: 94 },
];
function WInvoices({ size }) {
  const total = M1_AR.reduce((s, b) => s + b.v, 0);
  const overdue = M1_AR.slice(2).reduce((s, b) => s + b.v, 0);
  return (
    <WCard size={size} accent="#FB923C" title="A/R Aging" glyph="receipt"
      sub={size !== 'small' ? 'outstanding receivables' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={`$${(total / 1000).toFixed(0)}k`} color="#FB923C" />
          <div style={{ marginTop: 'auto', fontSize: 11.5, color: '#F43F5E' }}>${(overdue / 1000).toFixed(1)}k overdue</div>
        </div>
      )}
      {size !== 'small' && <>
        <WDivide />
        <WBars data={M1_AR.map(b => ({ l: b.l, v: b.v, color: b.color }))} h={size === 'large' ? 58 : 48} />
      </>}
      {size === 'large' && (
        <div style={{ marginTop: 14 }}>
          {M1_OVERDUE.slice(0, 4).map((o, i) => (
            <WRow key={o.customer} last={i === 3} label={o.customer} glyph="clock"
              glyphColor={o.days > 90 ? '#F43F5E' : o.days > 60 ? '#FB923C' : '#FBBF24'}
              a={`$${(o.amt / 1000).toFixed(1)}k`} b={`${o.days}d`} accent="#FB923C" />
          ))}
        </div>
      )}
    </WCard>
  );
}

/* ─────────── Commission Tracker ─────────── */
const M1_REPS = [
  { name: 'Dana Cole', init: 'DC', color: '#3FA9F5', sold: 184000, comm: 12880 },
  { name: 'Marcus Vale', init: 'MV', color: '#34D399', sold: 156500, comm: 10955 },
  { name: 'Priya Shah', init: 'PS', color: '#c084fc', sold: 98200, comm: 6874 },
  { name: 'Tom Ruiz', init: 'TR', color: '#FBBF24', sold: 61400, comm: 4298 },
];
function WCommissions({ size }) {
  const totalComm = M1_REPS.reduce((s, r) => s + r.comm, 0);
  const top = M1_REPS[0];
  const goal = 40000;
  const pct = Math.round((totalComm / goal) * 100);
  return (
    <WCard size={size} accent="#34D399" title="Commissions" glyph="dollar"
      sub={size !== 'small' ? 'team payout · MTD' : null}>
      {size === 'small' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <WHero size={size} value={`$${(totalComm / 1000).toFixed(1)}k`} color="#34D399" />
          <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-mid)' }}>🏆 {top.name.split(' ')[0]} leads</div>
        </div>
      )}
      {size === 'medium' && (
        <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'center' }}>
          <WRing pct={pct} value={pct + '%'} label="of pool" color="#34D399" size={80} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {M1_REPS.slice(0, 3).map(r => (
              <div key={r.init} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-high)', fontWeight: 600 }}>${(r.comm / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {size === 'large' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WRing pct={pct} value={`$${(totalComm / 1000).toFixed(0)}k`} label="paid out" color="#34D399" size={92} stroke={9} />
          <div>
            <div className="display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-high)' }}>${(M1_REPS.reduce((s, r) => s + r.sold, 0) / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>booked this month</div>
          </div>
        </div>
        <WDivide />
        <div>
          {M1_REPS.map((r, i) => (
            <div key={r.init} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === M1_REPS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: hexToRgba(r.color, 0.22), color: r.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.init}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{r.name}</span>
              <span className="mono" style={{ fontSize: 12.5, color: '#34D399', fontWeight: 600 }}>${(r.comm / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </>}
    </WCard>
  );
}

registerWidget('incidents',   { label: 'Live Incidents',       cat: 'Operations', accent: '#F43F5E', glyph: 'siren',     sizes: ['small', 'medium', 'large'], render: s => <WIncidents size={s} /> });
registerWidget('sla',         { label: 'SLA Countdown',        cat: 'Operations', accent: '#FBBF24', glyph: 'timeline',  sizes: ['small', 'medium', 'large'], render: s => <WSLA size={s} /> });
registerWidget('inventory',   { label: 'Truck Stock',          cat: 'Operations', accent: '#FBBF24', glyph: 'package',   sizes: ['small', 'medium', 'large'], render: s => <WInventory size={s} /> });
registerWidget('parts',       { label: 'Parts Requests',       cat: 'Operations', accent: '#3FA9F5', glyph: 'cart',      sizes: ['small', 'medium', 'large'], render: s => <WParts size={s} /> });
registerWidget('invoices',    { label: 'A/R Aging',            cat: 'Finance',    accent: '#FB923C', glyph: 'receipt',   sizes: ['small', 'medium', 'large'], render: s => <WInvoices size={s} /> });
registerWidget('commissions', { label: 'Commissions',          cat: 'Finance',    accent: '#34D399', glyph: 'dollar',    sizes: ['small', 'medium', 'large'], render: s => <WCommissions size={s} /> });

Object.assign(window, { WIncidents, WSLA, WInventory, WParts, WInvoices, WCommissions });

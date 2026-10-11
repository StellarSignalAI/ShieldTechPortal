/* Revenue Operations — ShieldTech electric design language.

   Live finance dashboard wired to the same real sources the Finance Suite uses:
   window.__shieldQBO.invoices()/bills() + the shared mrrStore. Shows honest
   empty states ("—" / Connect QuickBooks) when QBO isn't connected — never
   invents numbers. Self-contained electric palette (logo blue #1E80F0 + cyan +
   violet + red), Hanken Grotesk + Geist Mono, glow on the live layer. */

(function () {
  if (!document.getElementById('revops-css')) {
    const s = document.createElement('style');
    s.id = 'revops-css';
    s.textContent = `
    .revops{--bg:#05070C;--surface:#0A0E16;--raised:#0F1522;--sunk:#070A11;
      --line:rgba(120,170,255,.09);--line-2:rgba(120,170,255,.16);
      --fg:#EAF1FB;--fg-2:#9DB2CC;--fg-3:#5E7086;
      --brand:#1E80F0;--brand-b:#3DA2FF;--brand-rgb:30,128,240;--cyan:#19E3EC;--cyan-rgb:25,227,236;
      --violet:var(--accent-2);--red:#FF3B5C;--ok:#2BE08A;--warn:#FFC53D;
      --d-cctv:#1E80F0;--d-access:#19E3EC;--d-cable:#2BE08A;--d-alarm:var(--disc-alarm);--d-fire:#FF3B5C;
      --f:'Hanken Grotesk',-apple-system,sans-serif;--m:'Geist Mono',ui-monospace,monospace;
      font-family:var(--f);color:var(--fg);font-size:14px;letter-spacing:-.003em;
      background:#05070C;border-radius:16px;padding:22px;margin:-4px;
      background-image:radial-gradient(55% 40% at 8% -5%,rgba(var(--brand-rgb),.14),transparent 60%),radial-gradient(45% 40% at 100% 0%,rgba(var(--warn-rgb),.08),transparent 60%)}
    .revops .m{font-family:var(--m);font-variant-numeric:tabular-nums}
    .revops .rv-bar{display:flex;align-items:center;gap:13px;margin-bottom:20px}
    .revops .rv-mk{width:32px;height:32px;border-radius:9px;background:linear-gradient(150deg,var(--brand-b),#0057C8);display:grid;place-items:center;color:#fff;font-weight:800;font-size:15px;box-shadow:0 0 20px -4px rgba(var(--brand-rgb),.8)}
    .revops .rv-ttl{font-size:18px;font-weight:600;letter-spacing:-.02em}
    .revops .rv-ttl small{display:block;font-family:var(--m);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--fg-3);font-weight:400;margin-top:1px}
    .revops .rv-seg{margin-left:auto;display:flex;border:1px solid var(--line-2);border-radius:9px;overflow:hidden}
    .revops .rv-seg button{background:transparent;border:0;color:var(--fg-2);font-family:var(--m);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:8px 13px;cursor:pointer}
    .revops .rv-seg button[aria-pressed="true"]{background:linear-gradient(180deg,var(--brand-b),var(--brand));color:#021226;font-weight:600}
    .revops .rv-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}
    .revops .rv-card{background:linear-gradient(180deg,#0C1220,var(--surface));border:1px solid var(--line);border-radius:16px;box-shadow:0 24px 50px -28px #000,inset 0 1px 0 rgba(255,255,255,.03)}
    .revops .pad{padding:20px}
    .revops .c3{grid-column:span 3}.revops .c4{grid-column:span 4}.revops .c5{grid-column:span 5}.revops .c7{grid-column:span 7}.revops .c8{grid-column:span 8}
    .revops .lab{font-size:12.5px;color:var(--fg-2);font-weight:500}
    .revops .val{font-size:29px;font-weight:600;letter-spacing:-.03em;margin:11px 0 0;font-variant-numeric:tabular-nums;filter:drop-shadow(0 0 16px rgba(var(--brand-rgb),.26))}
    .revops .val .u{font-size:16px;color:var(--fg-3);font-weight:500;filter:none}
    .revops .kpi.alt .val{filter:drop-shadow(0 0 16px rgba(var(--cyan-rgb),.26))}
    .revops .kpi.dim .val{filter:none;color:var(--fg-3)}
    .revops .foot{display:flex;align-items:center;gap:8px;margin-top:11px}
    .revops .delta{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;padding:3px 8px;border-radius:100px}
    .revops .delta.up{color:var(--ok);background:color-mix(in srgb,var(--ok) 15%,transparent)}
    .revops .delta.dn{color:var(--red);background:color-mix(in srgb,var(--red) 15%,transparent)}
    .revops .since{font-size:11.5px;color:var(--fg-3)}
    .revops .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
    .revops .hd h3{margin:0;font-size:15px;font-weight:600}
    .revops .hd .mut{font-family:var(--m);font-size:10.5px;color:var(--fg-3);letter-spacing:.06em}
    .revops .legend{display:flex;gap:14px;margin-top:8px;flex-wrap:wrap}
    .revops .legend span{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--fg-2)}
    .revops .legend i{width:9px;height:9px;border-radius:3px}
    .revops .gln{stroke:var(--line)}.revops .axis{font-family:var(--m);font-size:9.5px;fill:var(--fg-3)}
    .revops .disc{display:flex;flex-direction:column;gap:13px;margin-top:8px}
    .revops .disc .t{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px}
    .revops .disc .t b{font-family:var(--m);font-weight:600}
    .revops .track{height:9px;border-radius:5px;background:var(--sunk);overflow:hidden}
    .revops .track i{display:block;height:100%;border-radius:5px}
    .revops .ar-bar{display:flex;height:34px;border-radius:9px;overflow:hidden;border:1px solid var(--line);margin-top:6px}
    .revops .ar-bar i{display:flex;align-items:center;justify-content:center;font-family:var(--m);font-size:10px;color:#04121f;font-weight:600}
    .revops .ar-legend{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
    .revops .ar-legend .l{display:flex;align-items:center;justify-content:space-between;font-size:12.5px}
    .revops .ar-legend .nm{display:flex;align-items:center;gap:8px;color:var(--fg-2)}
    .revops .ar-legend .nm i{width:9px;height:9px;border-radius:3px}
    .revops .ar-legend b{font-family:var(--m);font-weight:600}
    .revops table{width:100%;border-collapse:collapse}
    .revops th{text-align:left;font-family:var(--m);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg-3);font-weight:500;padding:0 16px 11px;border-bottom:1px solid var(--line)}
    .revops td{padding:12px 16px;border-bottom:1px solid var(--line);font-size:13.5px}
    .revops tbody tr:last-child td{border-bottom:0}
    .revops tbody tr:hover{background:rgba(var(--brand-rgb),.04)}
    .revops .id{font-family:var(--m);font-size:12px;color:var(--fg-2)}
    .revops .amt{font-family:var(--m);text-align:right;font-variant-numeric:tabular-nums}
    .revops .pill{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:100px}
    .revops .pill::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 7px currentColor}
    .revops .pill.ok{color:var(--ok);background:color-mix(in srgb,var(--ok) 13%,transparent)}
    .revops .pill.open{color:var(--cyan);background:color-mix(in srgb,var(--cyan) 13%,transparent)}
    .revops .pill.over{color:var(--red);background:color-mix(in srgb,var(--red) 13%,transparent)}
    .revops .av{width:28px;height:28px;border-radius:8px;background:color-mix(in srgb,var(--brand) 18%,var(--raised));color:var(--brand-b);display:grid;place-items:center;font-size:11px;font-weight:700}
    .revops .cust{display:flex;align-items:center;gap:10px}
    .revops .empty{padding:22px;text-align:center;color:var(--fg-3);font-size:12.5px}
    .revops .banner{display:flex;align-items:center;gap:10px;background:color-mix(in srgb,var(--warn) 9%,var(--surface));border:1px solid color-mix(in srgb,var(--warn) 30%,transparent);border-radius:12px;padding:12px 15px;margin-bottom:16px;font-size:13px;color:var(--fg)}
    .revops .banner b{color:var(--warn)}
    @media(max-width:1100px){.revops .c3{grid-column:span 6}.revops .c4,.revops .c5,.revops .c7,.revops .c8{grid-column:span 12}}
    @media(max-width:620px){.revops .c3{grid-column:span 12}}
    `;
    document.head.appendChild(s);
  }

  function RevOpsScreen() {
    const h = React.createElement;
    const money = (n) => '$' + Math.round(n || 0).toLocaleString();
    const kish = (n) => { n = n || 0; return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : Math.round(n).toString(); };
    const [inv, setInv] = React.useState(null);
    const [scope, setScope] = React.useState('qtd');
    React.useEffect(() => {
      const q = window.__shieldQBO; if (!q || !q.invoices) return;
      q.invoices({ limit: 3000 }).then(r => { if (r && r.ok && Array.isArray(r.data)) setInv(r.data); }).catch(() => {});
    }, []);
    const mrrStoreRef = (typeof mrrStore !== 'undefined') ? mrrStore : (window.mrrStore || null);
    const [mrrRows] = mrrStoreRef ? useShieldStore(mrrStoreRef) : [[]];
    const mrrTotal = (mrrRows || []).filter(m => m && m.status !== 'cancelled').reduce((s, m) => s + (Number(m.mrr) || 0), 0);
    const connected = Array.isArray(inv) && inv.length > 0;

    const M = React.useMemo(() => {
      if (!connected) return null;
      const now = new Date(), yr = now.getFullYear(), mo = now.getMonth(), q = Math.floor(mo / 3);
      let revYTD = 0, revMTD = 0, revQTD = 0, billed = 0, collected = 0;
      const ar = { cur: 0, d30: 0, d60: 0, d60p: 0 };
      const monthly = {};
      inv.forEach(v => {
        const tot = Number(v.total) || 0, bal = Number(v.balance) || 0;
        const tdstr = v.txn_date || v.txnDate || v.date;
        const td = tdstr ? new Date(String(tdstr).slice(0, 10) + 'T00:00:00') : null;
        if (td && td.getFullYear() === yr) { revYTD += tot; if (td.getMonth() === mo) revMTD += tot; if (Math.floor(td.getMonth() / 3) === q) revQTD += tot; }
        billed += tot; collected += (tot - bal);
        if (bal > 0) {
          const due = v.due_date ? new Date(v.due_date).getTime() : Date.now();
          const days = Math.floor((Date.now() - due) / 86400000);
          if (days <= 0) ar.cur += bal; else if (days <= 30) ar.d30 += bal; else if (days <= 60) ar.d60 += bal; else ar.d60p += bal;
        }
        if (td) { const ym = td.getFullYear() + '-' + String(td.getMonth() + 1).padStart(2, '0'); monthly[ym] = (monthly[ym] || 0) + tot; }
      });
      const series = [];
      for (let i = 11; i >= 0; i--) { const d = new Date(yr, mo - i, 1); const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); series.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), v: monthly[ym] || 0 }); }
      const arTotal = ar.cur + ar.d30 + ar.d60 + ar.d60p;
      const overdue = inv.filter(v => (Number(v.balance) || 0) > 0 && v.due_date && new Date(v.due_date).getTime() < Date.now()).length;
      return { revYTD, revMTD, revQTD, billed, collected, ar, arTotal, series, overdue };
    }, [inv, connected]);

    const recent = React.useMemo(() => {
      if (!connected) return [];
      return [...inv].sort((a, b) => String(b.txn_date || b.date || '').localeCompare(String(a.txn_date || a.date || ''))).slice(0, 6);
    }, [inv, connected]);

    const scopeRev = M ? (scope === 'mtd' ? M.revMTD : scope === 'ytd' ? M.revYTD : M.revQTD) : 0;
    const collectRate = M && M.billed > 0 ? Math.round(M.collected / M.billed * 100) : 0;

    // revenue chart path from the real monthly series
    const chart = React.useMemo(() => {
      if (!M) return null;
      const max = Math.max(1, ...M.series.map(s => s.v));
      const W = 640, H = 170, n = M.series.length;
      const x = i => (i / (n - 1)) * W;
      const y = v => H - 12 - (v / max) * (H - 28);
      let line = '', area = '';
      M.series.forEach((s, i) => { const px = x(i), py = y(s.v); line += (i ? ' L' : 'M') + px.toFixed(0) + ',' + py.toFixed(0); });
      area = line + ' L' + W + ',' + H + ' L0,' + H + 'Z';
      return { line, area, lastX: x(n - 1), lastY: y(M.series[n - 1].v) };
    }, [M]);

    const seg = (id, lab) => h('button', { key: id, 'aria-pressed': scope === id ? 'true' : 'false', onClick: () => setScope(id) }, lab);
    const kpi = (cls, lab, val, footEl) => h('div', { className: 'rv-card pad kpi ' + cls },
      h('div', { className: 'lab' }, lab), h('div', { className: 'val' }, val), footEl || null);
    const avi = (s) => (String(s || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase();
    const invStatus = (v) => { const bal = Number(v.balance) || 0; if (bal <= 0) return ['ok', 'Paid']; if (v.due_date && new Date(v.due_date).getTime() < Date.now()) return ['over', 'Overdue']; return ['open', 'Open']; };

    return h('div', { className: 'revops' },
      h('div', { className: 'rv-bar' },
        h('div', { className: 'rv-mk' }, 'S'),
        h('div', { className: 'rv-ttl' }, 'Revenue Operations', h('small', null, 'ShieldTech · ' + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))),
        h('div', { className: 'rv-seg' }, seg('mtd', 'MTD'), seg('qtd', 'QTD'), seg('ytd', 'YTD'))
      ),
      !connected ? h('div', { className: 'banner' }, h('span', null, '●'), h('span', null, h('b', null, 'QuickBooks not connected'), ' — live revenue, AR and invoices appear here once QBO is synced. Figures below show as “—”.')) : null,
      h('div', { className: 'rv-grid' },
        kpi('', 'Revenue · ' + scope.toUpperCase(), connected ? h(React.Fragment, null, h('span', { className: 'u' }, '$'), kish(scopeRev)) : '—',
          h('div', { className: 'foot' }, connected ? h('span', { className: 'since' }, 'from QuickBooks') : h('span', { className: 'since' }, 'Connect QuickBooks'))),
        kpi('alt', 'Recurring · monitoring MRR', mrrTotal > 0 ? h(React.Fragment, null, h('span', { className: 'u' }, '$'), kish(mrrTotal)) : '—',
          h('div', { className: 'foot' }, h('span', { className: 'since' }, (mrrRows || []).length ? (mrrRows.filter(m => m && m.status !== 'cancelled').length + ' active contracts') : 'No contracts yet'))),
        kpi(connected ? '' : 'dim', 'Collected · ' + scope.toUpperCase(), connected ? h(React.Fragment, null, h('span', { className: 'u' }, '$'), kish(M.collected)) : '—',
          h('div', { className: 'foot' }, connected ? h('span', { className: 'since' }, collectRate + '% of billed') : h('span', { className: 'since' }, '—'))),
        kpi(connected ? '' : 'dim', 'AR outstanding', connected ? h(React.Fragment, null, h('span', { className: 'u' }, '$'), kish(M.arTotal)) : '—',
          h('div', { className: 'foot' }, connected && M.overdue ? h('span', { className: 'delta dn' }, M.overdue + ' overdue') : h('span', { className: 'since' }, connected ? 'all current' : '—'))),

        // revenue chart
        h('div', { className: 'rv-card pad c8' },
          h('div', { className: 'hd' }, h('h3', null, 'Revenue'), h('span', { className: 'mut' }, 'last 12 months')),
          connected && chart ? h('svg', { width: '100%', height: 200, viewBox: '0 0 640 200', preserveAspectRatio: 'none', style: { marginTop: 8 } },
            h('defs', null, h('linearGradient', { id: 'rvg', x1: 0, y1: 0, x2: 0, y2: 1 }, h('stop', { offset: 0, 'stop-color': 'var(--brand)', 'stop-opacity': .28 }), h('stop', { offset: 1, 'stop-color': 'var(--brand)', 'stop-opacity': 0 }))),
            h('line', { className: 'gln', x1: 0, y1: 56, x2: 640, y2: 56 }), h('line', { className: 'gln', x1: 0, y1: 113, x2: 640, y2: 113 }),
            h('path', { d: chart.area, fill: 'url(#rvg)' }),
            h('path', { d: chart.line, fill: 'none', stroke: 'var(--brand-b)', 'stroke-width': 2.5, style: { filter: 'drop-shadow(0 0 7px rgba(30,128,240,.6))' } }),
            h('circle', { cx: chart.lastX, cy: chart.lastY, r: 4, fill: 'var(--brand-b)', style: { filter: 'drop-shadow(0 0 7px var(--brand-b))' } })
          ) : h('div', { className: 'empty' }, 'Revenue trend appears once invoices sync from QuickBooks.')
        ),

        // AR aging
        h('div', { className: 'rv-card pad c4' },
          h('div', { className: 'hd' }, h('h3', null, 'AR aging'), h('span', { className: 'mut' }, connected ? money(M.arTotal) + ' open' : '')),
          connected && M.arTotal > 0 ? h(React.Fragment, null,
            h('div', { className: 'ar-bar' },
              h('i', { style: { width: Math.max(2, M.ar.cur / M.arTotal * 100) + '%', background: 'var(--ok)' } }),
              h('i', { style: { width: Math.max(0, M.ar.d30 / M.arTotal * 100) + '%', background: 'var(--warn)' } }),
              h('i', { style: { width: Math.max(0, M.ar.d60 / M.arTotal * 100) + '%', background: '#FF8A3D' } }),
              h('i', { style: { width: Math.max(0, M.ar.d60p / M.arTotal * 100) + '%', background: 'var(--red)' } })),
            h('div', { className: 'ar-legend' },
              h('div', { className: 'l' }, h('span', { className: 'nm' }, h('i', { style: { background: 'var(--ok)' } }), 'Current'), h('b', null, money(M.ar.cur))),
              h('div', { className: 'l' }, h('span', { className: 'nm' }, h('i', { style: { background: 'var(--warn)' } }), '1–30 d'), h('b', null, money(M.ar.d30))),
              h('div', { className: 'l' }, h('span', { className: 'nm' }, h('i', { style: { background: '#FF8A3D' } }), '31–60 d'), h('b', null, money(M.ar.d60))),
              h('div', { className: 'l' }, h('span', { className: 'nm' }, h('i', { style: { background: 'var(--red)' } }), '60+ d'), h('b', null, money(M.ar.d60p))))
          ) : h('div', { className: 'empty' }, connected ? 'No outstanding receivables — all invoices are current.' : 'AR aging appears once invoices sync.')
        ),

        // recent invoices
        h('div', { className: 'rv-card c7' },
          h('div', { className: 'pad', style: { paddingBottom: 8 } }, h('div', { className: 'hd' }, h('h3', null, 'Recent invoices'), h('span', { className: 'mut' }, 'QuickBooks'))),
          connected ? h('table', null,
            h('thead', null, h('tr', null, h('th', null, 'Invoice'), h('th', null, 'Customer'), h('th', null, 'Status'), h('th', { style: { textAlign: 'right' } }, 'Amount'))),
            h('tbody', null, recent.map((v, i) => { const st = invStatus(v); return h('tr', { key: i },
              h('td', { className: 'id' }, v.doc_number || v.num || ('INV-' + (v.id || i))),
              h('td', null, h('div', { className: 'cust' }, h('div', { className: 'av' }, avi(v.customer || v.customer_name)), (v.customer || v.customer_name || '—'))),
              h('td', null, h('span', { className: 'pill ' + st[0] }, st[1])),
              h('td', { className: 'amt' }, money(Number(v.total) || 0))); }))
          ) : h('div', { className: 'empty', style: { padding: '28px 16px' } }, 'Recent invoices appear here once QuickBooks is connected.')
        ),

        // recurring / MRR summary
        h('div', { className: 'rv-card pad c5' },
          h('div', { className: 'hd' }, h('h3', null, 'Recurring revenue'), h('span', { className: 'mut' }, 'monitoring & service plans')),
          (mrrRows || []).length ? h('div', { style: { marginTop: 10 } },
            h('div', { style: { fontFamily: 'var(--m)', fontSize: 26, fontWeight: 600, letterSpacing: '-.02em' } }, money(mrrTotal), h('span', { style: { fontSize: 13, color: 'var(--fg-3)' } }, ' / mo')),
            h('div', { style: { fontSize: 12, color: 'var(--fg-2)', marginTop: 4 } }, (mrrRows.filter(m => m && m.status !== 'cancelled').length) + ' active · ' + money(mrrTotal * 12) + ' annualized')
          ) : h('div', { className: 'empty' }, 'Recurring contracts appear here from the Recurring Revenue builder.')
        )
      )
    );
  }

  Object.assign(window, { RevOpsScreen });
})();

/* ShieldTech Mobile — Money, as an instrument.
   The Money tab's home is a collections dial in the same family as the
   technician's Dial: a ticked bezel holding everything customers owe, one arc
   per customer sized by balance and colored by age (current → 1–30 → 31–60 →
   60+). A fixed needle; turn, flick or tap to dial a customer in; the one card
   below has the one right action — receive the payment, send the pay link,
   or draft the reminder. Nothing moves unless you move it.

   Data is the same merged invoice rows every Finance screen uses
   (useMergedInvoices: portal + QuickBooks), bills from the QBO mirror, MRR from
   the recurring store. Actions reuse the shared "+ New" engine (openQboNew),
   the pay-link backend (mSendPayLink) and the Approvals queue. Tokens only. */

const MD_SPAN = 300, MD_START = -150;
const mdRad = (d) => d * Math.PI / 180;
const mdVar = (name, fb) => { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch { return fb; } };
const mdMoney = (n, short) => { n = Number(n) || 0; if (short && Math.abs(n) >= 10000) return '$' + (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K'; return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
const mdReduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
/* age bucket → label + token */
function mdAge(days) {
  days = Number(days) || 0;
  if (days <= 0) return { key: 'current', label: 'Current', token: '--status-ok', fb: '#34D399' };
  if (days <= 30) return { key: 'd30', label: '1–30 days', token: '--status-warn', fb: '#FBBF24' };
  if (days <= 60) return { key: 'd60', label: '31–60 days', token: '--status-critical', fb: '#F43F5E' };
  return { key: 'd90', label: '60+ days', token: '--disc-alarm', fb: 'var(--disc-alarm)' };
}
const mdAgeColor = (days) => { const a = mdAge(days); return mdVar(a.token, a.fb); };

/* open invoices → one segment per customer, oldest debt first (clockwise) */
function mdSegments(invoices) {
  const open = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const by = new Map();
  open.forEach(i => { const k = i.customer || 'Customer'; if (!by.has(k)) by.set(k, { id: k, label: k, value: 0, days: 0, invoices: [] }); const s = by.get(k); s.value += i.amount; s.days = Math.max(s.days, Number(i.days) || 0); s.invoices.push(i); });
  const segs = [...by.values()].filter(s => s.value > 0).sort((a, b) => b.days - a.days || b.value - a.value);
  const total = segs.reduce((s, x) => s + x.value, 0) || 1;
  const gap = 2.2, minArc = 4;
  const usable = MD_SPAN - gap * Math.max(0, segs.length - 1);
  let a = MD_START;
  segs.forEach(s => { const len = Math.max(minArc, s.value / total * usable); s.a0 = a; s.a1 = a + len; a += len + gap; s.invoices.sort((x, y) => (Number(y.days) || 0) - (Number(x.days) || 0)); });
  /* if minimums pushed us past the span, scale back proportionally */
  const over = (a - gap) - (MD_START + MD_SPAN);
  if (over > 0 && segs.length) { const k = MD_SPAN / (MD_SPAN + over); let b = MD_START; segs.forEach(s => { const len = (s.a1 - s.a0) * k; s.a0 = b; s.a1 = b + len; b += len + gap * k; }); }
  return { segs, total: segs.reduce((s, x) => s + x.value, 0), open };
}

/* ══════════════ the dial ══════════════ */
function MoneyDial({ segs, total, overdue, focusId, onFocus }) {
  const wrapRef = React.useRef(null), cvRef = React.useRef(null);
  const rot = React.useRef(null);
  const drag = React.useRef({ on: false, a0: 0, r0: 0, moved: 0, last: [] });
  const anim = React.useRef(null);
  const focusRef = React.useRef(focusId); focusRef.current = focusId;
  const reduce = mdReduce();
  const detents = React.useCallback(() => segs.map(s => -s.a0), [segs]);
  const focusAt = React.useCallback((r) => { const a = -r; const hit = segs.find(s => a >= s.a0 - 1 && a <= s.a1 + 1); if (hit) return hit; if (!segs.length) return null; return segs.reduce((b, s) => Math.abs(s.a0 - a) < Math.abs(b.a0 - a) ? s : b); }, [segs]);

  const draw = React.useCallback(() => {
    const cv = cvRef.current, wrap = wrapRef.current; if (!cv || !wrap) return;
    const w = wrap.clientWidth; if (w < 120) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = w / 2, r = rot.current || 0, ink = mdVar('--text-high', '#FAFAFB');
    ctx.clearRect(0, 0, w, w); ctx.save(); ctx.translate(R, R);
    ctx.beginPath(); ctx.arc(0, 0, R - 66, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.rotate(mdRad(r));
    const pt = (a, rad) => [rad * Math.sin(mdRad(a)), -rad * Math.cos(mdRad(a))];
    /* ticks: every 10% of the book, majors at quarters */
    for (let i = 0; i <= 20; i++) {
      const a = MD_START + MD_SPAN * i / 20, major = i % 5 === 0, p0 = pt(a, R - 5), p1 = pt(a, R - 5 - (major ? 12 : 6));
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.strokeStyle = major ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = major ? 1.6 : 1; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.font = `500 10.5px ${mdVar('--font-mono', 'ui-monospace, monospace')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [[0, 'oldest'], [0.5, mdMoney(total / 2, true)], [1, mdMoney(total, true)]].forEach(([k, t]) => { const p = pt(MD_START + MD_SPAN * k, R - 52); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-mdRad(r)); ctx.fillStyle = 'rgba(250,250,251,0.4)'; ctx.fillText(t, 0, 0); ctx.restore(); });
    const TR = R - 32;
    segs.forEach(s => {
      const f = s.id === focusRef.current, c = mdAgeColor(s.days);
      ctx.beginPath(); ctx.arc(0, 0, TR, mdRad(s.a0 - 90), mdRad(s.a1 - 90)); ctx.lineCap = 'butt'; ctx.lineWidth = f ? 11 : 8;
      ctx.strokeStyle = c; ctx.globalAlpha = f ? 1 : 0.45; ctx.shadowColor = c; ctx.shadowBlur = f ? 16 : 0; ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      if (s.days > 60) { const q = pt((s.a0 + s.a1) / 2, R - 18); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0; }
    });
    /* overdue share marker on the bezel: where "overdue" ends, since oldest debt sits first */
    if (total > 0 && overdue > 0) { const a = MD_START + MD_SPAN * Math.min(1, overdue / total); const n = pt(a, TR); ctx.beginPath(); ctx.arc(n[0], n[1], 4.5, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.shadowColor = ink; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(n[0], n[1], 7.5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(250,250,251,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }, [segs, total, overdue]);

  const fromDial = React.useRef(null);
  const setRot = React.useCallback((v) => { rot.current = v; draw(); const f = focusAt(v); if (f && f.id !== focusRef.current) { focusRef.current = f.id; fromDial.current = f.id; try { if (navigator.vibrate) navigator.vibrate(6); } catch { /* noop */ } onFocus(f.id); } }, [draw, focusAt, onFocus]);
  const animateTo = React.useCallback((target, ms = 420) => { if (anim.current) cancelAnimationFrame(anim.current); if (reduce) { setRot(target); return; } const from = rot.current || 0, t0 = performance.now(); const step = (now) => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); setRot(from + (target - from) * e); if (k < 1) anim.current = requestAnimationFrame(step); else anim.current = null; }; anim.current = requestAnimationFrame(step); }, [reduce, setRot]);
  const snap = React.useCallback((from) => { const d = detents(); if (!d.length) return; let best = d[0]; d.forEach(v => { if (Math.abs(v - from) < Math.abs(best - from)) best = v; }); animateTo(best); }, [detents, animateTo]);
  React.useEffect(() => {
    const target = segs.find(s => s.id === focusId); const r = target ? -target.a0 : 0;
    if (rot.current == null) { rot.current = r; draw(); }
    else if (target && fromDial.current !== focusId && Math.abs((rot.current || 0) - r) > 0.5 && !drag.current.on) animateTo(r);
    fromDial.current = null;
  }, [focusId, segs.length]);
  React.useEffect(() => { draw(); const ro = new ResizeObserver(draw); if (wrapRef.current) ro.observe(wrapRef.current); return () => ro.disconnect(); }, [draw]);

  const angleOf = (e) => { const r = wrapRef.current.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  const distOf = (e) => { const r = wrapRef.current.getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); };
  const onDown = (e) => { if (e.target.closest('button')) return; if (anim.current) { cancelAnimationFrame(anim.current); anim.current = null; } drag.current = { on: true, a0: angleOf(e), r0: rot.current || 0, moved: 0, last: [[angleOf(e), performance.now()]] }; wrapRef.current.setPointerCapture(e.pointerId); };
  const onMove = (e) => { const d = drag.current; if (!d.on) return; const a = angleOf(e), delta = ((a - d.a0 + 540) % 360) - 180; d.moved = Math.max(d.moved, Math.abs(delta)); const raw = d.r0 + delta, lim = MD_SPAN / 2; setRot(raw > lim ? lim + (raw - lim) * 0.28 : raw < -lim ? -lim + (raw + lim) * 0.28 : raw); d.last.push([a, performance.now()]); if (d.last.length > 4) d.last.shift(); };
  const onUp = (e) => {
    const d = drag.current; if (!d.on) return; d.on = false;
    if (d.moved < 3) { const R = wrapRef.current.clientWidth / 2, dd = distOf(e); if (dd > R - 50 && dd <= R) { const ta = ((angleOf(e) + 90) - (rot.current || 0) + 540) % 360 - 180; const hit = segs.find(s => ta >= s.a0 - 3 && ta <= s.a1 + 3); if (hit) { animateTo(-hit.a0); return; } } snap(rot.current || 0); return; }
    let v = 0; if (d.last.length > 1) { const p = d.last[0], q = d.last[d.last.length - 1], dt = q[1] - p[1]; if (dt > 0) v = (((q[0] - p[0] + 540) % 360) - 180) / dt; }
    snap(Math.max(-MD_SPAN / 2, Math.min(MD_SPAN / 2, (rot.current || 0) + v * 140)));
  };
  const wheelT = React.useRef(null);
  const onWheel = (e) => { e.preventDefault(); setRot(Math.max(-MD_SPAN / 2, Math.min(MD_SPAN / 2, (rot.current || 0) + e.deltaY * 0.08))); clearTimeout(wheelT.current); wheelT.current = setTimeout(() => snap(rot.current || 0), 140); };

  const f = segs.find(s => s.id === focusId) || null;
  const c = f ? mdAgeColor(f.days) : mdVar('--text-low', '#656365');
  return (
    <div ref={wrapRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
      style={{ position: 'relative', width: 'min(100%, 320px)', aspectRatio: '1', margin: '0 auto', touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', left: '50%', top: 2, width: 2.5, height: 26, borderRadius: 2, background: 'var(--text-high)', transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 3 }}>
        <div style={{ position: 'absolute', left: '50%', top: -1, transform: 'translateX(-50%)', border: '5px solid transparent', borderTop: '7px solid var(--text-high)', borderBottom: 0 }} />
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none', width: '62%', zIndex: 2 }}>
        {f ? (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: c, marginBottom: 6, fontWeight: 500 }}>{f.days > 0 ? `${f.days}d overdue` : 'Current'}</div>
            <div className="mono" style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-high)', fontVariantNumeric: 'tabular-nums' }}>{mdMoney(f.value, true)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 6, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 6 }}>Outstanding</div>
            <div className="mono" style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-high)' }}>{mdMoney(total, true)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 6 }}>{total > 0 ? 'turn to a customer' : 'everything is collected'}</div>
          </React.Fragment>
        )}
      </div>
      {segs.length > 0 && <button onClick={() => animateTo(-segs[0].a0)} className="mono" style={{ position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%)', zIndex: 3, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--text-mid)', fontSize: 11, letterSpacing: '0.08em', padding: '6px 12px', borderRadius: 999, cursor: 'pointer' }}>OLDEST</button>}
    </div>
  );
}

/* ══════════════ Money home ══════════════ */
function MoneyHome({ go }) {
  const invoices = useMergedInvoices();
  const { segs, total, open } = React.useMemo(() => mdSegments(invoices), [invoices]);
  const overdue = open.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const defaultFocus = segs.length ? segs[0].id : null;
  const [focusId, setFocusId] = React.useState(defaultFocus);
  React.useEffect(() => { if (!segs.find(s => s.id === focusId)) setFocusId(defaultFocus); }, [segs, defaultFocus]);
  const seg = segs.find(s => s.id === focusId) || null;
  const c = seg ? mdAgeColor(seg.days) : 'var(--brand)';
  const oldest = seg ? seg.invoices[0] : null;
  const [openInv, setOpenInv] = React.useState(null);
  React.useEffect(() => { if (window.__shieldPay) window.__shieldPay.applyPayments(); }, []);

  /* collected this month, MRR, bills — the other three numbers that matter */
  const monthKey = new Date().toISOString().slice(0, 7);
  const paidThisMonth = (i) => { const raw = i._raw || {}; if (raw.paidAt) return new Date(raw.paidAt).toISOString().slice(0, 7) === monthKey; return String(raw.txn_date || '').slice(0, 7) === monthKey; };
  const collected = invoices.filter(i => i.status === 'paid' && paidThisMonth(i)).reduce((s, i) => s + i.amount, 0);
  const [mrrSubs] = useShieldStore(mrrStore);
  const mrr = (mrrSubs || []).filter(x => !x.churned && x.status === 'active').reduce((s, x) => s + (Number(x.mrr) || 0), 0);
  const [bills, setBills] = React.useState([]);
  const loadBills = React.useCallback(() => { const q = window.__shieldQBO; if (!q || !q.bills) return; q.bills(200).then(r => setBills(r && r.ok ? (r.data || []).filter(b => Number(b.balance) > 0) : [])); }, []);
  React.useEffect(() => { loadBills(); window.addEventListener('qbo:changed', loadBills); return () => window.removeEventListener('qbo:changed', loadBills); }, [loadBills]);
  const billsDue = bills.reduce((s, b) => s + Number(b.balance), 0);
  const fmtD = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  const remind = (inv) => { approvalStore.set(prev => [{ id: (prev || []).reduce((m, a) => Math.max(m, a.id), 0) + 1, kind: 'AR REMINDER', title: `${inv.customer} — ${inv.num} reminder (${inv.days}d overdue)`, amt: `$${inv.amount.toLocaleString()}`, sub: 'AI-drafted · review before sending', status: 'pending' }, ...(prev || [])]); showToast(`Reminder drafted for ${inv.num} → Approvals`, 'ok'); };
  const chip = (txt, color) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: color || 'var(--text-mid)', background: 'var(--card)', border: '1px solid var(--border-subtle)', padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{txt}</span>;
  const kpi = (v, k, col) => <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '11px 8px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 15, fontWeight: 600, color: col || 'var(--text-high)', letterSpacing: '-0.02em' }}>{v}</div><div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 3 }}>{k}</div></div>;
  const ghost = (label, fn, color) => <button onClick={fn} style={{ background: 'var(--modal)', color: color || 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 12px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{label}</button>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 2px 0' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>Money</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>{segs.length} {segs.length === 1 ? 'customer owes' : 'customers owe'} · {mdMoney(overdue, true)} overdue</div>
      </div>

      <MoneyDial segs={segs} total={total} overdue={overdue} focusId={focusId} onFocus={setFocusId} />

      {/* the one card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c, boxShadow: `0 0 12px ${c}` }} />
        {seg && oldest ? (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8 }}><span style={{ color: c, fontWeight: 600 }}>{seg.days > 0 ? `${seg.days} days overdue` : 'Current'}</span> · {seg.invoices.length} {seg.invoices.length === 1 ? 'invoice' : 'invoices'}</div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{seg.label}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 4, fontWeight: 500 }}>Oldest {oldest.num} · {mdMoney(oldest.amount)} · due {oldest.due}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {chip(<React.Fragment>{mdAge(seg.days).label}<span style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} /></React.Fragment>, c)}
              {chip(mdMoney(seg.value))}
              {oldest._raw && oldest._raw.payLink && chip('Pay link sent', 'var(--brand)')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginTop: 14 }}>
              <button onClick={() => window.openQboNew('payment', { invoice: oldest })} style={{ border: 'none', borderRadius: 14, padding: '14px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff', background: c, boxShadow: `0 8px 24px ${c}55`, fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>Receive payment</button>
              {ghost('Pay link', () => mSendPayLink(oldest))}
              {seg.days > 0 ? ghost('Remind', () => remind(oldest)) : ghost('Open', () => setOpenInv(oldest))}
            </div>
            {seg.invoices.length > 1 && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                {seg.invoices.map(i => (
                  <button key={i.num} onClick={() => setOpenInv(i)} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', width: '100%', padding: '9px 2px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-mid)' }}>{i.num}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: mdAgeColor(i.days) }}>{i.days > 0 ? `${i.days}d` : 'current'}</span>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{mdMoney(i.amount)}</span>
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8 }}>Receivables</div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>Nothing outstanding</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>Every sent invoice is paid. New invoices appear on the dial the moment they go out.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>{ghost('+ New invoice', () => window.openQboNew ? window.openQboNew('invoice') : go('Invoices'), 'var(--brand)')}{ghost('All invoices', () => go('Invoices'))}</div>
          </React.Fragment>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {kpi(mdMoney(collected, true), 'collected this month', 'var(--status-ok)')}
        {kpi(mdMoney(billsDue, true), 'bills to pay', billsDue ? 'var(--status-warn)' : undefined)}
        {kpi(mdMoney(mrr, true), 'monthly recurring', 'var(--brand)')}
      </div>

      {/* everyone who owes, compact */}
      {segs.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {segs.map(s => { const sc = mdAgeColor(s.days), on = s.id === focusId; return (
            <button key={s.id} onClick={() => setFocusId(s.id)} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${on ? 'var(--border-strong)' : 'var(--border-subtle)'}`, background: on ? 'var(--card)' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
              <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span><span style={{ display: 'block', fontSize: 11, color: 'var(--text-low)' }}>{s.invoices.length} {s.invoices.length === 1 ? 'invoice' : 'invoices'}{s.days > 0 ? ` · ${s.days}d` : ' · current'}</span></span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{mdMoney(s.value)}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: on ? `0 0 8px ${sc}` : 'none' }} />
            </button>
          ); })}
        </div>
      )}

      {/* bills due next */}
      {bills.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '6px 2px 8px' }}>Bills to pay · {mdMoney(billsDue)}</div>
          {bills.slice().sort((a, b) => String(a.due_date || '').localeCompare(String(b.due_date || ''))).slice(0, 4).map(b => (
            <div key={b.qbo_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.vendor_name || 'Vendor'}</span><span style={{ display: 'block', fontSize: 11, color: b.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)' }}>due {fmtD(b.due_date)}</span></span>
              <span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{mdMoney(b.balance)}</span>
              <button onClick={() => window.openQboNew('billpayment', { bill: b })} style={{ padding: '7px 12px', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text-high)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Pay</button>
            </div>
          ))}
          {bills.length > 4 && <button onClick={() => go('Bills')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '4px 2px' }}>All {bills.length} bills ›</button>}
        </div>
      )}

      {openInv && window.FinInvoiceDetail && <FinInvoiceDetail inv={invoices.find(i => i.num === openInv.num) || openInv} onClose={() => setOpenInv(null)} />}
    </div>
  );
}

Object.assign(window, { MoneyDial, MoneyHome, mdSegments, mdAge });

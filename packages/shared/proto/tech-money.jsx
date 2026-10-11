/* Technician App — Clock + Receipts.
   Two instruments in the Dial family:

   Clock (Time tab): the one timer the Dial already runs (`st2:timer`), on a
   card with one action. Start it against the job under the needle, pause,
   stop → one note → it lands on the timesheet (draft or submitted). Today is
   a strip on the same 6 AM–8 PM track as the Dial; the week is seven bars and
   one "Submit week" button. Entries come from `time_entries` through
   `window.__shieldTime` — the same rows the office approves and pays.

   Receipts (Expenses tab): camera first. Snap → the photo is shrunk, the
   `ai` edge function reads vendor / total / date / category off it (vision,
   when configured), the tech confirms, and it goes to the office receipt
   inbox (`window.__shieldReceipts`) tagged with the job — the office converts
   it to an expense and QuickBooks from there, so nothing is double-entered.
   Mileage and no-receipt expenses go straight to the shared expense store the
   office approves (`techExpenseStore`).

   Colors are tokens only. */

/* ── small helpers ── */
const TM_WIN = { s: 6 * 60, e: 20 * 60 };
const tmIso = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const tmMoney = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tmHours = (h) => { const m = Math.round((Number(h) || 0) * 60); const hh = Math.floor(m / 60), mm = m % 60; return hh ? `${hh}h ${mm < 10 ? '0' : ''}${mm}m` : `${mm}m`; };
const tmClock = (ms) => { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${m < 10 ? '0' : ''}${m}:${x < 10 ? '0' : ''}${x}`; };
const tmTimeOf = (iso) => iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;
const tmMinOf = (iso) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
const tmDayLabel = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
function tmMonday(d = new Date()) { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const tmVar = (name, fb) => { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch { return fb; } };
const TM_STATUS = { draft: ['Draft', 'var(--text-mid)'], submitted: ['Submitted', 'var(--brand)'], approved: ['Approved', 'var(--status-ok)'], synced: ['Approved', 'var(--status-ok)'], paid: ['Paid', 'var(--status-ok)'], rejected: ['Rejected', 'var(--status-critical)'], pending: ['Pending', 'var(--status-warn)'], inbox: ['With office', 'var(--status-warn)'], converted: ['Booked', 'var(--status-ok)'], dismissed: ['Dismissed', 'var(--text-low)'] };
const TM_TASKS = ['Installation', 'Repair', 'Maintenance', 'Survey', 'Programming', 'Testing', 'Travel', 'Admin'];
const TM_CATS = ['Materials', 'Fuel', 'Tools', 'Meals', 'Other'];
const TM_MILEAGE_RATE = 0.70; // $/mile — IRS standard rate; the office can change this in one place

/* ── the one timer (shared with the Dial): {start, project, task, job} or {pausedElapsed, …} ── */
const TM_KEY = 'st2:timer';
function tmTimerRead() { try { return JSON.parse(localStorage.getItem(TM_KEY) || 'null') || null; } catch { return null; } }
function tmTimerWrite(t) { try { if (t) localStorage.setItem(TM_KEY, JSON.stringify(t)); else localStorage.removeItem(TM_KEY); } catch { /* quota */ } try { window.dispatchEvent(new Event('st2:timer')); } catch { /* noop */ } }
function tmTimerStart({ jobRef, label, task }) { const cur = tmTimerRead() || {}; tmTimerWrite({ start: Date.now() - (cur.pausedElapsed || 0) * 1000, project: label || jobRef || 'General', task: task || cur.task || 'Installation', job: jobRef || cur.job || null, startedAt: cur.startedAt || Date.now() }); }
function tmTimerPause() { const t = tmTimerRead(); if (!t || !t.start) return; tmTimerWrite({ ...t, start: null, pausedElapsed: Math.max(0, Math.floor((Date.now() - t.start) / 1000)) }); }
function tmTimerClear() { tmTimerWrite(null); }
function useTechTimer() {
  const [t, setT] = React.useState(tmTimerRead);
  const [, tick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const sync = () => setT(tmTimerRead());
    window.addEventListener('st2:timer', sync); window.addEventListener('storage', sync); window.addEventListener('focus', sync);
    const iv = setInterval(() => { const cur = tmTimerRead(); if (cur && cur.start) tick(); }, 1000);
    return () => { window.removeEventListener('st2:timer', sync); window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); clearInterval(iv); };
  }, []);
  const running = !!(t && t.start);
  const elapsedMs = running ? Math.max(0, Date.now() - t.start) : ((t && t.pausedElapsed) || 0) * 1000;
  return { t, running, paused: !!(t && !t.start && t.pausedElapsed), elapsedMs };
}

/* ── my time entries ── */
function useMyTime() {
  const [rows, setRows] = React.useState([]);
  const [err, setErr] = React.useState(null);
  const refresh = React.useCallback(() => {
    const s = window.__shieldTime; if (!s) return;
    s.myEntries().then(r => { if (r.ok) { setRows(r.data || []); setErr(null); } else setErr(r.error || 'load failed'); }).catch(e => setErr(String(e)));
  }, []);
  React.useEffect(() => { refresh(); window.addEventListener('shield:time-changed', refresh); return () => window.removeEventListener('shield:time-changed', refresh); }, [refresh]);
  return { rows, err, refresh };
}
const tmTimeChanged = () => { try { window.dispatchEvent(new Event('shield:time-changed')); } catch { /* noop */ } };

/* ── pickable work: today's dial jobs first, then open projects / WOs ── */
function useTmJobOptions() {
  const day = (window.useTechDay ? window.useTechDay() : { jobs: [] });
  const [projects] = useShieldStore(projectStore);
  const [wos] = useShieldStore(workOrderStore);
  return React.useMemo(() => {
    const today = (day.jobs || []).map(j => ({ ref: j.woId || j.id, label: j.customer, sub: j.desc, active: j.field === 'in-progress' || j.field === 'on-site' || j.field === 'paused', done: j.done }));
    const seen = new Set(today.map(o => o.ref));
    const openWos = (wos || []).filter(w => !['done', 'completed', 'closed', 'cancelled'].includes(String(w.status || '')) && !seen.has(w.id)).map(w => ({ ref: w.id, label: w.customer, sub: w.id }));
    const openPrj = (projects || []).filter(p => !['completed', 'closed', 'cancelled'].includes(String(p.status || ''))).map(p => ({ ref: p.number, label: p.name, sub: p.number }));
    const cats = ['General', 'Travel', 'Admin', 'Training'].map(c => ({ ref: c, label: c, sub: '' }));
    const groups = [['Today', today], ['Categories', cats], ['Projects', openPrj], ['Work orders', openWos]].filter(g => g[1].length);
    const def = today.find(o => o.active) || today.find(o => !o.done) || null;
    return { groups, def, labelOf: (ref) => { for (const g of groups) { const o = g[1].find(x => x.ref === ref); if (o) return o.label; } return ref || 'General'; } };
  }, [day.jobs, projects, wos]);
}

/* ── bottom sheet (local; the tech bundle doesn't ship mobile-ui) ── */
function TmSheet({ title, onClose, children, tall }) {
  const [vv, setVv] = React.useState(() => ({ bottom: 0, h: window.innerHeight }));
  React.useEffect(() => {
    const v = window.visualViewport; if (!v) return;
    const upd = () => setVv({ bottom: Math.max(0, window.innerHeight - v.height - v.offsetTop), h: Math.round(v.height) });
    upd(); v.addEventListener('resize', upd); v.addEventListener('scroll', upd);
    return () => { v.removeEventListener('resize', upd); v.removeEventListener('scroll', upd); };
  }, []);
  const sheet = (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 4000, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, margin: '0 auto', bottom: vv.bottom, width: '100%', maxWidth: 430, maxHeight: Math.round(vv.h * (tall ? 0.96 : 0.9)), zIndex: 4001, background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderBottom: 'none', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -16px 50px rgba(0,0,0,0.6)', color: 'var(--text-high)' }}>
        <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>
        <div onFocusCapture={(e) => { const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) setTimeout(() => { try { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* noop */ } }, 250); }} style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '0 18px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
      </div>
    </React.Fragment>
  );
  return ReactDOM.createPortal(sheet, document.body);
}

/* ── form primitives ── */
const tmLbl = { fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 6, display: 'block' };
const tmInput = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 12, color: 'var(--text-high)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' };
function TmField({ label, children }) { return <div><span style={tmLbl}>{label}</span>{children}</div>; }
function TmChips({ options, value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => { const on = o === value; return <button key={o} onClick={() => onChange(o)} style={{ padding: '8px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: on ? (color || 'var(--brand)') : 'var(--card)', color: on ? '#fff' : 'var(--text-mid)', border: `1px solid ${on ? (color || 'var(--brand)') : 'var(--border-subtle)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{o}</button>; })}
    </div>
  );
}
function TmPrimary({ label, onClick, disabled, color, busy }) {
  const c = color || 'var(--brand)';
  return <button onClick={onClick} disabled={disabled || busy} style={{ width: '100%', border: 'none', borderRadius: 14, padding: '15px 16px', fontWeight: 700, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer', color: '#fff', background: c, opacity: disabled || busy ? 0.5 : 1, boxShadow: `0 8px 24px color-mix(in srgb, ${c} 35%, transparent)`, fontFamily: 'var(--font-body)' }}>{busy ? 'Working…' : label}</button>;
}
function TmGhost({ label, onClick, color, style }) {
  return <button onClick={onClick} style={{ flex: 1, background: 'var(--card)', color: color || 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(style || {}) }}>{label}</button>;
}
function TmStatus({ s }) { const [l, c] = TM_STATUS[s] || [s, 'var(--text-low)']; return <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c, whiteSpace: 'nowrap' }}>{l}</span>; }
function TmJobSelect({ value, onChange, opts }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...tmInput, textOverflow: 'ellipsis', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'none' }}>
      {!value && <option value="">Pick a job…</option>}
      {opts.groups.map(([g, list]) => <optgroup key={g} label={g}>{list.map(o => <option key={o.ref} value={o.ref}>{o.label}{o.sub && o.sub !== o.label ? ` — ${o.sub}` : ''}</option>)}</optgroup>)}
    </select>
  );
}

/* ══════════════ Clock ══════════════ */
function TechClockView() {
  const { t, running, paused, elapsedMs } = useTechTimer();
  const { rows, err, refresh } = useMyTime();
  const opts = useTmJobOptions();
  const [mode, setMode] = React.useState('today');
  const [sheet, setSheet] = React.useState(null); // {kind:'stop'|'manual'|'entry'|'start', …}
  const [nowMin, setNowMin] = React.useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  React.useEffect(() => { const iv = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 30000); return () => clearInterval(iv); }, []);
  const today = tmIso();
  const jobRef = t ? (t.job || t.project) : null;
  const jobLabel = t ? (t.project || opts.labelOf(t.job)) : null;

  /* week + today derived from the live rows */
  const mon = tmMonday(); const weekKeys = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return tmIso(d); });
  const inWeek = rows.filter(r => weekKeys.includes(r.work_date));
  const weekTotal = inWeek.reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const todayRows = rows.filter(r => r.work_date === today).sort((a, b) => String(a.start_at || a.created_at).localeCompare(String(b.start_at || b.created_at)));
  const todayTotal = todayRows.reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const rejected = rows.filter(r => r.status === 'rejected' && r.work_date !== today);
  const drafts = inWeek.filter(r => r.status === 'draft').length;

  const start = (ref, label, task) => { tmTimerStart({ jobRef: ref, label, task }); shieldToast(`Clock running · ${label || ref}`, 'ok'); };
  const startDefault = () => { if (paused) { tmTimerStart({}); return; } if (opts.def) start(opts.def.ref, opts.def.label); else setSheet({ kind: 'start', ref: '', task: 'Installation' }); };
  const stop = () => { const ms = elapsedMs; if (ms < 60000) { shieldModal({ kind: 'confirm', title: 'Under a minute', message: 'Discard this timer? Nothing is saved.', confirmLabel: 'Discard', onConfirm: () => tmTimerClear() }); return; } tmTimerPause(); setSheet({ kind: 'stop', note: '', task: (t && t.task) || 'Installation', ref: jobRef }); };
  const save = async (asSubmitted) => {
    const s = window.__shieldTime; if (!s) { shieldToast('Time backend not configured', 'warn'); return; }
    const cur = tmTimerRead() || {}; const secs = cur.pausedElapsed || Math.floor(elapsedMs / 1000); const hours = Math.round((secs / 3600) * 100) / 100;
    const endAt = new Date(); const startAt = new Date(cur.startedAt || (endAt.getTime() - secs * 1000));
    const r = await s.submitHours({ workDate: tmIso(endAt), startAt: startAt.toISOString(), endAt: endAt.toISOString(), hours, jobRef: sheet.ref || jobRef || 'General', notes: `${sheet.task} — ${sheet.note.trim()}`, draft: !asSubmitted });
    if (!r.ok) { shieldToast(`Could not save (${r.error || 'unknown'}) — your time is still on the clock`, 'warn'); return; }
    tmTimerClear(); setSheet(null); tmTimeChanged(); refresh();
    shieldToast(asSubmitted ? `${tmHours(hours)} submitted for approval` : `${tmHours(hours)} saved to this week's timesheet`, 'ok');
  };
  const submitWeek = async () => {
    const s = window.__shieldTime; if (!s) return;
    const r = await s.submitWeek(weekKeys[0], weekKeys[6]);
    if (!r.ok) { shieldToast(r.error || 'Could not submit', 'warn'); return; }
    shieldToast(r.count ? `Week submitted — ${r.count} ${r.count === 1 ? 'entry' : 'entries'}` : 'Nothing left to submit this week', r.count ? 'ok' : 'info'); refresh();
  };
  const del = (row) => shieldModal({ kind: 'confirm', title: 'Delete this entry?', message: `${tmHours(row.hours)} on ${row.job_ref || 'General'} — this cannot be undone.`, confirmLabel: 'Delete', onConfirm: async () => { const r = await window.__shieldTime.deleteEntry(row.id); shieldToast(r.ok ? 'Entry deleted' : (r.error || 'Could not delete'), r.ok ? 'ok' : 'warn'); setSheet(null); refresh(); } });

  /* ── the instrument ── */
  const c = running ? 'var(--brand)' : paused ? 'var(--status-warn)' : 'var(--text-low)';
  const card = (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 22, padding: '18px 16px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c, boxShadow: running ? `0 0 12px ${c}` : 'none' }} />
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: running ? c : 'var(--text-low)', fontWeight: 600 }}>{running ? 'On the clock' : paused ? 'Paused' : 'Off the clock'}{t && t.task ? ` · ${t.task}` : ''}</div>
      <div className="mono" style={{ fontSize: 52, fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 1.05, marginTop: 6, color: running || paused ? 'var(--text-high)' : 'var(--text-low)', fontVariantNumeric: 'tabular-nums' }}>{tmClock(elapsedMs)}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(running || paused) ? jobLabel : (opts.def ? opts.def.label : 'No job on the dial')}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 2 }}>{(running || paused) ? (t.job && t.job !== t.project ? t.job : 'since ' + tmTimeOf(new Date(t.startedAt || Date.now()).toISOString())) : (opts.def ? `${opts.def.sub || ''}` : 'pick any job, project or category')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: running || paused ? '1fr 1fr' : '1fr auto', gap: 8, marginTop: 14 }}>
        {running ? (
          <React.Fragment>
            <button onClick={tmTimerPause} style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Pause</button>
            <button onClick={stop} style={{ border: 'none', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff', background: 'var(--status-critical)', boxShadow: '0 8px 24px color-mix(in srgb, var(--status-critical) 35%, transparent)', fontFamily: 'var(--font-body)' }}>Stop</button>
          </React.Fragment>
        ) : paused ? (
          <React.Fragment>
            <button onClick={() => tmTimerStart({})} style={{ border: 'none', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff', background: 'var(--brand)', boxShadow: '0 8px 24px color-mix(in srgb, var(--brand) 35%, transparent)', fontFamily: 'var(--font-body)' }}>Resume</button>
            <button onClick={stop} style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Stop &amp; save</button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <button onClick={startDefault} style={{ border: 'none', borderRadius: 14, padding: '14px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff', background: 'var(--brand)', boxShadow: '0 8px 24px color-mix(in srgb, var(--brand) 35%, transparent)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opts.def ? `Start · ${opts.def.label}` : 'Start'}</button>
            <button onClick={() => setSheet({ kind: 'start', ref: (opts.def && opts.def.ref) || '', task: 'Installation' })} title="Choose job" style={{ background: 'var(--modal)', color: 'var(--text-high)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '14px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Job…</button>
          </React.Fragment>
        )}
      </div>
    </div>
  );

  /* ── today strip on the dial's track ── */
  const strip = (() => {
    const W = 100, pct = (m) => Math.max(0, Math.min(W, (m - TM_WIN.s) / (TM_WIN.e - TM_WIN.s) * W));
    const blocks = []; let cursor = 8 * 60;
    todayRows.forEach(r => {
      let s, e;
      if (r.start_at && r.end_at) { s = tmMinOf(r.start_at); e = tmMinOf(r.end_at); }
      else { s = cursor; e = cursor + Math.round((Number(r.hours) || 0) * 60); cursor = e + 10; }
      blocks.push({ id: r.id, s, e: Math.max(e, s + 6), status: r.status, travel: r.job_ref === 'Travel' });
    });
    const live = running && t.startedAt ? { s: tmMinOf(new Date(t.startedAt).toISOString()), e: nowMin } : null;
    return (
      <div style={{ padding: '4px 2px 0' }}>
        <div style={{ position: 'relative', height: 34, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          {[6, 9, 12, 15, 18].map(h => <div key={h} style={{ position: 'absolute', left: `${pct(h * 60)}%`, top: 0, bottom: 0, width: 1, background: 'var(--border-subtle)' }} />)}
          {blocks.map(b => { const [, col] = TM_STATUS[b.status] || ['', 'var(--text-mid)']; return <div key={b.id} title={b.status} style={{ position: 'absolute', left: `${pct(b.s)}%`, width: `${Math.max(1.2, pct(b.e) - pct(b.s))}%`, top: 8, bottom: 8, borderRadius: 5, background: b.travel ? 'var(--status-warn)' : (b.status === 'draft' ? 'var(--text-mid)' : col), opacity: 0.85 }} />; })}
          {live && <div style={{ position: 'absolute', left: `${pct(live.s)}%`, width: `${Math.max(1.2, pct(live.e) - pct(live.s))}%`, top: 8, bottom: 8, borderRadius: 5, background: 'var(--brand)', boxShadow: '0 0 10px var(--brand)' }} />}
          <div style={{ position: 'absolute', left: `${pct(nowMin)}%`, top: 0, bottom: 0, width: 2, background: 'var(--text-high)', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
        </div>
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-low)', marginTop: 4, padding: '0 1px' }}>{['6a', '9a', '12p', '3p', '6p', '8p'].map(l => <span key={l}>{l}</span>)}</div>
      </div>
    );
  })();

  const entryRow = (r) => { const [, col] = TM_STATUS[r.status] || ['', 'var(--text-mid)']; const [task, ...rest] = String(r.notes || '').split(' — '); return (
    <button key={r.id} onClick={() => setSheet({ kind: 'entry', row: r })} style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', alignItems: 'center', gap: 12, width: '100%', padding: '11px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
      <span style={{ width: 4, height: 34, borderRadius: 2, background: col }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opts.labelOf(r.job_ref) || 'General'}{r.job_ref && opts.labelOf(r.job_ref) !== r.job_ref ? <span className="mono" style={{ color: 'var(--text-low)', fontWeight: 500, fontSize: 11, marginLeft: 6 }}>{r.job_ref}</span> : null}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{rest.length ? `${task} · ${rest.join(' — ')}` : task || '—'}</span>
        {r.status === 'rejected' && r.rejection_reason && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--status-critical)', marginTop: 4 }}>Office: {r.rejection_reason}</span>}
      </span>
      <span style={{ textAlign: 'right' }}>
        <span className="mono" style={{ display: 'block', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{tmHours(r.hours)}</span>
        <span className="mono" style={{ display: 'block', fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{r.start_at && r.end_at ? `${tmTimeOf(r.start_at)} – ${tmTimeOf(r.end_at)}` : <TmStatus s={r.status} />}</span>
      </span>
    </button>
  ); };

  /* ── week bars ── */
  const week = (() => {
    const per = weekKeys.map(k => rows.filter(r => r.work_date === k));
    const tot = per.map(list => list.reduce((s, r) => s + (Number(r.hours) || 0), 0));
    const max = Math.max(8, ...tot);
    const [selDay, setSelDay] = [sheet && sheet.kind === 'day' ? sheet.iso : null, (iso) => setSheet(iso ? { kind: 'day', iso } : null)];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '14px 14px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Week of {tmDayLabel(weekKeys[0]).replace(/^\w+, /, '')}</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{tmHours(weekTotal)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, alignItems: 'end', height: 92 }}>
            {weekKeys.map((k, i) => { const h = tot[i], isT = k === today, has = per[i].length > 0; const over = h > 8; return (
              <button key={k} onClick={() => has && setSelDay(k)} style={{ background: 'none', border: 'none', padding: 0, cursor: has ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', fontFamily: 'var(--font-body)' }}>
                <span className="mono" style={{ fontSize: 9.5, color: has ? 'var(--text-mid)' : 'transparent', marginBottom: 4 }}>{h ? h.toFixed(1) : '0'}</span>
                <span style={{ width: '100%', height: `${Math.max(3, h / max * 60)}px`, borderRadius: 5, background: has ? (over ? 'var(--status-warn)' : 'var(--brand)') : 'var(--border-subtle)', opacity: isT ? 1 : 0.7, boxShadow: isT && has ? '0 0 10px color-mix(in srgb, var(--brand) 50%, transparent)' : 'none' }} />
                <span style={{ fontSize: 10, fontWeight: isT ? 700 : 500, color: isT ? 'var(--text-high)' : 'var(--text-low)', marginTop: 6 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </button>
            ); })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[[drafts, 'drafts'], [inWeek.filter(r => r.status === 'submitted').length, 'submitted'], [inWeek.filter(r => ['approved', 'synced', 'paid'].includes(r.status)).length, 'approved']].map(([v, k]) => (
            <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '10px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 2 }}>{k}</div></div>
          ))}
        </div>
        {drafts > 0 && <TmPrimary label={`Submit week for approval · ${drafts} ${drafts === 1 ? 'entry' : 'entries'}`} onClick={submitWeek} />}
        {!drafts && inWeek.length > 0 && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--status-ok)', fontWeight: 600 }}>Everything this week is submitted ✓</div>}
        {selDay && (
          <TmSheet title={tmDayLabel(selDay)} onClose={() => setSelDay(null)}>
            {rows.filter(r => r.work_date === selDay).map(entryRow)}
          </TmSheet>
        )}
      </div>
    );
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 2px 0' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>Time</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>{tmHours(todayTotal)} today · {tmHours(weekTotal)} week</div>
      </div>
      {card}
      {err && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'color-mix(in srgb, var(--status-warn) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--status-warn) 30%, transparent)', fontSize: 12, color: 'var(--status-warn)' }}>Couldn't load your entries ({err}) — <span onClick={refresh} style={{ textDecoration: 'underline', cursor: 'pointer' }}>retry</span></div>}
      {rejected.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--status-critical)', margin: '2px 2px 2px' }}>Needs fixing</div>
          {rejected.map(entryRow)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 2, background: 'var(--card)', borderRadius: 12, padding: 3, border: '1px solid var(--border-subtle)' }}>
        {[['today', 'Today'], ['week', 'Week']].map(([id, l]) => <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', background: mode === id ? 'var(--modal)' : 'transparent', color: mode === id ? 'var(--text-high)' : 'var(--text-low)', boxShadow: mode === id ? '0 1px 6px rgba(0,0,0,0.3)' : 'none' }}>{l}</button>)}
      </div>
      {mode === 'today' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {strip}
          {todayRows.length === 0 && !running && <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12.5, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>Nothing logged yet today. Start the clock, or add time by hand.</div>}
          {todayRows.map(entryRow)}
          <button onClick={() => setSheet({ kind: 'manual', ref: (opts.def && opts.def.ref) || 'General', task: 'Installation', date: today, start: '08:00', end: '12:00', note: '' })} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '11px', color: 'var(--text-mid)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add time by hand</button>
        </div>
      ) : week}

      {/* ── sheets ── */}
      {sheet && sheet.kind === 'start' && (
        <TmSheet title="Start the clock" onClose={() => setSheet(null)}>
          <TmField label="Job"><TmJobSelect value={sheet.ref} onChange={v => setSheet(s => ({ ...s, ref: v }))} opts={opts} /></TmField>
          <TmField label="Task"><TmChips options={TM_TASKS} value={sheet.task} onChange={v => setSheet(s => ({ ...s, task: v }))} /></TmField>
          <TmPrimary label="Start" disabled={!sheet.ref} onClick={() => { start(sheet.ref, opts.labelOf(sheet.ref), sheet.task); setSheet(null); }} />
        </TmSheet>
      )}
      {sheet && sheet.kind === 'stop' && (
        <TmSheet title="What did you do?" onClose={() => { tmTimerStart({}); setSheet(null); }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}><span className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.04em' }}>{tmHours(elapsedMs / 3600000)}</span><span style={{ fontSize: 13, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opts.labelOf(sheet.ref)}</span></div>
          <TmField label="Job"><TmJobSelect value={sheet.ref} onChange={v => setSheet(s => ({ ...s, ref: v }))} opts={opts} /></TmField>
          <TmField label="Task"><TmChips options={TM_TASKS} value={sheet.task} onChange={v => setSheet(s => ({ ...s, task: v }))} /></TmField>
          <TmField label="Note · required"><textarea autoFocus rows={3} value={sheet.note} onChange={e => setSheet(s => ({ ...s, note: e.target.value }))} placeholder="Mounted 4 domes in the lobby, terminated and tested runs 3–6" style={{ ...tmInput, resize: 'vertical', borderColor: sheet.note.trim() ? 'var(--border-subtle)' : 'color-mix(in srgb, var(--status-warn) 50%, transparent)' }} /></TmField>
          <TmPrimary label="Save to timesheet" disabled={!sheet.note.trim()} onClick={() => save(false)} />
          <div style={{ display: 'flex', gap: 8 }}><TmGhost label="Submit now" onClick={() => sheet.note.trim() ? save(true) : shieldToast('Add a note first', 'warn')} /><TmGhost label="Keep timing" onClick={() => { tmTimerStart({}); setSheet(null); }} /></div>
        </TmSheet>
      )}
      {sheet && sheet.kind === 'manual' && (() => {
        const mins = (() => { const [sh, sm] = sheet.start.split(':').map(Number), [eh, em] = sheet.end.split(':').map(Number); return (eh * 60 + em) - (sh * 60 + sm); })();
        const ok = mins > 0 && sheet.note.trim() && sheet.ref;
        const saveManual = async () => {
          const s = window.__shieldTime; if (!s) { shieldToast('Time backend not configured', 'warn'); return; }
          const r = sheet.row
            ? await s.updateEntry(sheet.row.id, { work_date: sheet.date, start_at: `${sheet.date}T${sheet.start}:00`, end_at: `${sheet.date}T${sheet.end}:00`, hours: mins / 60, job_ref: sheet.ref, notes: `${sheet.task} — ${sheet.note.trim()}`, status: sheet.row.status === 'rejected' ? 'submitted' : undefined })
            : await s.submitHours({ workDate: sheet.date, startAt: `${sheet.date}T${sheet.start}:00`, endAt: `${sheet.date}T${sheet.end}:00`, jobRef: sheet.ref, notes: `${sheet.task} — ${sheet.note.trim()}`, draft: true });
          if (!r.ok) { shieldToast(r.error || 'Could not save', 'warn'); return; }
          shieldToast(sheet.row ? (sheet.row.status === 'rejected' ? 'Fixed and resubmitted' : 'Entry updated') : `${tmHours(mins / 60)} saved as draft`, 'ok'); setSheet(null); tmTimeChanged(); refresh();
        };
        return (
          <TmSheet title={sheet.row ? 'Edit entry' : 'Add time'} onClose={() => setSheet(null)}>
            <TmField label="Job"><TmJobSelect value={sheet.ref} onChange={v => setSheet(s => ({ ...s, ref: v }))} opts={opts} /></TmField>
            <TmField label="Task"><TmChips options={TM_TASKS} value={sheet.task} onChange={v => setSheet(s => ({ ...s, task: v }))} /></TmField>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8 }}>
              <TmField label="Date"><input type="date" value={sheet.date} onChange={e => setSheet(s => ({ ...s, date: e.target.value }))} style={tmInput} /></TmField>
              <TmField label="Start"><input type="time" value={sheet.start} onChange={e => setSheet(s => ({ ...s, start: e.target.value }))} style={tmInput} /></TmField>
              <TmField label="End"><input type="time" value={sheet.end} onChange={e => setSheet(s => ({ ...s, end: e.target.value }))} style={tmInput} /></TmField>
            </div>
            <div className="mono" style={{ fontSize: 13, color: mins > 0 ? 'var(--text-mid)' : 'var(--status-warn)' }}>{mins > 0 ? tmHours(mins / 60) : 'End must be after start'}</div>
            <TmField label="Note · required"><textarea rows={2} value={sheet.note} onChange={e => setSheet(s => ({ ...s, note: e.target.value }))} placeholder="What did you work on?" style={{ ...tmInput, resize: 'vertical' }} /></TmField>
            <TmPrimary label={sheet.row ? (sheet.row.status === 'rejected' ? 'Save & resubmit' : 'Save changes') : 'Save as draft'} disabled={!ok} onClick={saveManual} />
          </TmSheet>
        );
      })()}
      {sheet && sheet.kind === 'entry' && (() => {
        const r = sheet.row; const editable = ['draft', 'rejected', 'submitted'].includes(r.status); const [task, ...rest] = String(r.notes || '').split(' — ');
        const toEdit = () => setSheet({ kind: 'manual', row: r, ref: r.job_ref || 'General', task: TM_TASKS.includes(task) ? task : 'Installation', date: r.work_date, start: r.start_at ? new Date(r.start_at).toTimeString().slice(0, 5) : '08:00', end: r.end_at ? new Date(r.end_at).toTimeString().slice(0, 5) : '12:00', note: rest.join(' — ') || task || '' });
        const submitOne = async () => { const x = await window.__shieldTime.updateEntry(r.id, { status: 'submitted' }); shieldToast(x.ok ? 'Submitted for approval' : (x.error || 'Could not submit'), x.ok ? 'ok' : 'warn'); setSheet(null); refresh(); };
        return (
          <TmSheet title={tmDayLabel(r.work_date)} onClose={() => setSheet(null)}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.04em' }}>{tmHours(r.hours)}</span><TmStatus s={r.status} /></div>
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>{opts.labelOf(r.job_ref) || 'General'}</div><div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 2 }}>{r.job_ref}{r.start_at && r.end_at ? ` · ${tmTimeOf(r.start_at)} – ${tmTimeOf(r.end_at)}` : ''}</div></div>
            <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.notes || '—'}</div>
            {r.status === 'rejected' && r.rejection_reason && <div style={{ padding: '10px 12px', borderRadius: 12, background: 'color-mix(in srgb, var(--status-critical) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--status-critical) 30%, transparent)', fontSize: 13, color: 'var(--status-critical)' }}>Office: {r.rejection_reason}</div>}
            {r.status === 'draft' && <TmPrimary label="Submit for approval" onClick={submitOne} />}
            {r.status === 'rejected' && <TmPrimary label="Fix & resubmit" onClick={toEdit} />}
            {editable && <div style={{ display: 'flex', gap: 8 }}>{r.status !== 'rejected' && <TmGhost label="Edit" onClick={toEdit} />}<TmGhost label="Delete" color="var(--status-critical)" onClick={() => del(r)} /></div>}
            {!editable && <div style={{ fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>Approved and paid entries are locked.</div>}
          </TmSheet>
        );
      })()}
    </div>
  );
}

/* ══════════════ Receipts ══════════════ */
function tmShrink(file, max = 1600, q = 0.85) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)); const w = Math.round(img.width * k), h = Math.round(img.height * k);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      const dataUrl = cv.toDataURL('image/jpeg', q);
      cv.toBlob(b => resolve({ blob: b || file, dataUrl }), 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ blob: file, dataUrl: null }); };
    img.src = url;
  });
}
/* Vision read through the shared `ai` edge function (feature 'extract' = JSON
   only). Returns null when AI isn't configured or the photo can't be read. */
async function tmScanReceipt(dataUrl) {
  const ai = window.__shieldAI; if (!ai || !dataUrl) return null;
  if (!window.__shieldAIModel) { try { const st = await ai.aiStatus(true); if (!st.configured) return null; } catch { return null; } }
  const prompt = 'This is a photo of a purchase receipt. Reply with JSON only, no prose: {"vendor": string|null, "total": number|null, "date": "YYYY-MM-DD"|null, "category": "Materials"|"Fuel"|"Tools"|"Meals"|"Other"|null, "last4": string|null, "summary": string|null}. "total" is the final amount paid including tax and tip. "summary" is at most 8 words describing what was bought. Use null for anything you cannot read.';
  try {
    const { text, live } = await ai.shieldAIChat('extract', [{ role: 'user', content: prompt }], undefined, [{ name: 'receipt.jpg', mime: 'image/jpeg', dataUrl }]);
    if (!live || !text) return null;
    const m = String(text).match(/\{[\s\S]*\}/); if (!m) return null;
    const j = JSON.parse(m[0]);
    return { vendor: j.vendor || null, total: j.total != null && isFinite(Number(j.total)) ? Number(j.total) : null, date: /^\d{4}-\d{2}-\d{2}$/.test(String(j.date || '')) ? j.date : null, category: TM_CATS.includes(j.category) ? j.category : null, last4: j.last4 ? String(j.last4).slice(-4) : null, summary: j.summary || null };
  } catch { return null; }
}
/* The Dial (and anything else) can open the receipt capture pre-tagged to a job. */
function openTechReceipt(prefill) { window.__techReceiptPrefill = prefill || {}; try { window.dispatchEvent(new Event('tech:receipt')); } catch { /* noop */ } }

function TechReceiptsView() {
  const opts = useTmJobOptions();
  const { t: timer } = useTechTimer();
  const [allRows, setAllRows] = useShieldStore(techExpenseStore);
  const [receipts, setReceipts] = React.useState([]);
  const [sheet, setSheet] = React.useState(null); // {kind:'receipt'|'mileage'|'manual'|'detail', …}
  const [thumbs, setThumbs] = React.useState({});
  const camRef = React.useRef(null), libRef = React.useRef(null);
  const me = window.__shieldUser || {};
  const meName = (me.name || '').toLowerCase();
  const defaultJob = () => (timer && (timer.job || timer.project)) || (opts.def && opts.def.ref) || '';

  const refresh = React.useCallback(() => { const r = window.__shieldReceipts; if (!r) return; r.list().then(x => { if (x.ok) setReceipts(x.data || []); }); }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  /* thumbnails: short-lived signed URLs, fetched once per row */
  React.useEffect(() => {
    const r = window.__shieldReceipts; if (!r) return;
    receipts.slice(0, 30).forEach(row => { if (thumbs[row.id] !== undefined) return; setThumbs(p => ({ ...p, [row.id]: null })); r.imageUrl(row).then(u => setThumbs(p => ({ ...p, [row.id]: u || false }))); });
  }, [receipts]);

  /* capture → shrink → sheet (+ AI read) */
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
    const pre = window.__techReceiptPrefill || {}; window.__techReceiptPrefill = null;
    const { blob, dataUrl } = await tmShrink(file);
    setSheet({ kind: 'receipt', blob, dataUrl, amount: '', vendor: '', date: tmIso(), category: 'Materials', ref: pre.jobRef || defaultJob(), paid: 'Company card', note: '', scanning: !!window.__shieldAI, scanned: null });
    const read = await tmScanReceipt(dataUrl);
    setSheet(s => (!s || s.kind !== 'receipt' || s.dataUrl !== dataUrl) ? s : { ...s, scanning: false, scanned: read, amount: read && read.total != null && !s.amount ? read.total.toFixed(2) : s.amount, vendor: read && read.vendor && !s.vendor ? read.vendor : s.vendor, date: read && read.date ? read.date : s.date, category: read && read.category ? read.category : s.category, note: read && read.summary && !s.note ? read.summary : s.note });
  };
  /* opened from the Dial with a job attached → straight to the camera */
  React.useEffect(() => {
    const go = () => { if (window.__techReceiptPrefill && camRef.current) camRef.current.click(); };
    go(); window.addEventListener('tech:receipt', go); return () => window.removeEventListener('tech:receipt', go);
  }, []);

  const sendReceipt = async () => {
    const r = window.__shieldReceipts; if (!r) { shieldToast('Receipts backend not configured', 'warn'); return; }
    const amt = Number(sheet.amount);
    setSheet(s => ({ ...s, busy: true }));
    const note = [sheet.note.trim(), sheet.paid === 'Personal — reimburse me' ? 'PERSONAL CARD — reimburse' : null, sheet.date !== tmIso() ? `dated ${sheet.date}` : null, sheet.scanned && sheet.scanned.last4 ? `card ••${sheet.scanned.last4}` : null].filter(Boolean).join(' · ');
    const x = await r.snap(sheet.blob, { note, vendor: sheet.vendor.trim() || null, amount: amt > 0 ? amt : null, jobRef: sheet.ref || null, category: sheet.category });
    if (!x.ok) { setSheet(s => ({ ...s, busy: false })); shieldToast('Upload failed: ' + (x.error || 'unknown'), 'warn'); return; }
    setSheet(null); refresh();
    shieldToast(amt > 0 ? `${tmMoney(amt)} receipt sent to the office` : 'Receipt sent to the office', 'ok');
  };
  const addExpense = (row) => {
    setAllRows(prev => [{ id: genId('exp'), by: me.name || 'Tech', date: tmIso(), status: 'pending', ...row }, ...(prev || [])]);
    setSheet(null); shieldToast(`${tmMoney(row.amount)} submitted for approval`, 'ok');
  };
  const removeExpense = (row) => shieldModal({ kind: 'confirm', title: 'Remove this expense?', message: `${tmMoney(row.amount)} · ${row.desc}`, confirmLabel: 'Remove', onConfirm: () => { setAllRows(prev => (prev || []).filter(x => x.id !== row.id)); setSheet(null); } });

  /* ── one list: receipts (office inbox) + store expenses, mine only ── */
  const mine = (allRows || []).filter(e => meName ? (e.by || '').toLowerCase() === meName : !e.by);
  const items = [
    ...receipts.map(r => ({ key: 'r' + r.id, kind: 'receipt', date: String(r.created_at).slice(0, 10), title: r.vendor || r.note || 'Receipt', sub: [r.expense_category, r.job_ref ? opts.labelOf(r.job_ref) : null].filter(Boolean).join(' · '), amount: r.amount, status: r.status, row: r })),
    ...mine.map(e => ({ key: 'e' + e.id, kind: 'expense', date: e.date, title: e.desc, sub: [e.category, e.job_ref ? opts.labelOf(e.job_ref) : null].filter(Boolean).join(' · '), amount: e.amount, status: e.status, row: e })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const month = tmIso().slice(0, 7);
  const monthItems = items.filter(i => String(i.date).startsWith(month));
  const sum = (list) => list.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const monthTotal = sum(monthItems), pendingTotal = sum(monthItems.filter(i => i.status === 'inbox' || i.status === 'pending')), reimb = sum(items.filter(i => i.kind === 'receipt' && /PERSONAL CARD/.test(i.row.note || '') && i.status !== 'dismissed'));
  const byDay = []; items.forEach(i => { const d = byDay.find(x => x.date === i.date); if (d) d.rows.push(i); else byDay.push({ date: i.date, rows: [i] }); });

  const dup = sheet && sheet.kind === 'receipt' && Number(sheet.amount) > 0 ? receipts.find(r => Number(r.amount) === Number(sheet.amount) && Math.abs(new Date(r.created_at) - Date.now()) < 3 * 86400000 && (!sheet.vendor || !r.vendor || r.vendor.toLowerCase() === sheet.vendor.trim().toLowerCase())) : null;

  const itemRow = (i) => { const [, col] = TM_STATUS[i.status] || ['', 'var(--text-mid)']; const th = i.kind === 'receipt' ? thumbs[i.row.id] : undefined; return (
    <button key={i.key} onClick={() => setSheet({ kind: 'detail', item: i })} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', alignItems: 'center', gap: 12, width: '100%', padding: '9px 10px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--text-high)' }}>
      <span style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-low)', fontSize: 16 }}>{th ? <img src={th} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (i.kind === 'expense' ? (i.row.category === 'Mileage' ? '⟶' : '＄') : '▢')}</span>
      <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</span><span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{i.sub || '—'}</span></span>
      <span style={{ textAlign: 'right' }}><span className="mono" style={{ display: 'block', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i.amount != null ? tmMoney(i.amount) : '—'}</span><span className="mono" style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: col, marginTop: 2 }}>{(TM_STATUS[i.status] || [i.status])[0]}</span></span>
    </button>
  ); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-high)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 2px 0' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>Receipts</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>{new Date().toLocaleDateString('en-US', { month: 'long' })} · {tmMoney(monthTotal)}</div>
      </div>

      {/* capture card */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
      <input ref={libRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 22, padding: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
        <button onClick={() => camRef.current && camRef.current.click()} style={{ width: '100%', border: 'none', borderRadius: 16, padding: '22px 16px', cursor: 'pointer', color: '#fff', background: 'var(--brand)', boxShadow: '0 10px 30px color-mix(in srgb, var(--brand) 40%, transparent)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>◉</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>Snap a receipt</span>
          <span style={{ fontSize: 11.5, opacity: 0.85 }}>{window.__shieldAIModel ? 'amount, vendor and date are read for you' : 'tag it to the job and send it to the office'}</span>
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
          <TmGhost label="From photos" onClick={() => libRef.current && libRef.current.click()} />
          <TmGhost label="Mileage" onClick={() => setSheet({ kind: 'mileage', miles: '', from: '', to: '', ref: defaultJob(), date: tmIso() })} />
          <TmGhost label="No receipt" onClick={() => setSheet({ kind: 'manual', amount: '', desc: '', category: 'Materials', ref: defaultJob(), vendor: '' })} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[[tmMoney(monthTotal), 'this month', 'var(--text-high)'], [tmMoney(pendingTotal), 'with office', 'var(--status-warn)'], [tmMoney(reimb), 'owed to you', 'var(--status-ok)']].map(([v, k, col]) => (
          <div key={k} style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '11px 8px', textAlign: 'center' }}><div className="mono" style={{ fontSize: 14, fontWeight: 600, color: col, letterSpacing: '-0.02em' }}>{v}</div><div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 3 }}>{k}</div></div>
        ))}
      </div>

      {byDay.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-low)', fontSize: 12.5, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>No receipts yet. Snap one at the counter — it takes five seconds.</div>}
      {byDay.slice(0, 40).map(d => (
        <div key={d.date} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 0' }}><span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>{d.date === tmIso() ? 'Today' : tmDayLabel(d.date)}</span><span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} /><span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{tmMoney(sum(d.rows))}</span></div>
          {d.rows.map(itemRow)}
        </div>
      ))}

      {/* ── receipt sheet ── */}
      {sheet && sheet.kind === 'receipt' && (
        <TmSheet title="New receipt" onClose={() => setSheet(null)} tall>
          <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 12, alignItems: 'start' }}>
            <div style={{ width: 96, height: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-strong)', background: 'var(--card)' }}>{sheet.dataUrl && <img src={sheet.dataUrl} alt="receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
            <div>
              <span style={tmLbl}>Amount</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: `1px solid ${Number(sheet.amount) > 0 ? 'var(--border-subtle)' : 'color-mix(in srgb, var(--status-warn) 50%, transparent)'}`, borderRadius: 12, padding: '4px 12px' }}>
                <span className="mono" style={{ fontSize: 22, color: 'var(--text-low)' }}>$</span>
                <input type="number" inputMode="decimal" step="0.01" value={sheet.amount} onChange={e => setSheet(s => ({ ...s, amount: e.target.value }))} placeholder="0.00" autoFocus={!sheet.scanning} className="mono" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'var(--text-high)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', outline: 'none', padding: '6px 4px' }} />
              </div>
              <div className="mono" style={{ fontSize: 10.5, marginTop: 6, color: sheet.scanning ? 'var(--brand)' : sheet.scanned ? 'var(--status-ok)' : 'var(--text-low)' }}>{sheet.scanning ? 'Reading the receipt…' : sheet.scanned ? `Read by ShieldTech AI — check it` : window.__shieldAIModel ? 'Could not read it — type the total' : 'Type the total'}</div>
            </div>
          </div>
          {dup && <div style={{ padding: '9px 12px', borderRadius: 12, background: 'color-mix(in srgb, var(--status-warn) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--status-warn) 30%, transparent)', fontSize: 12.5, color: 'var(--status-warn)' }}>Looks like a duplicate: {tmMoney(dup.amount)} from {dup.vendor || 'a receipt'} on {new Date(dup.created_at).toLocaleDateString()}.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
            <TmField label="Vendor"><input value={sheet.vendor} onChange={e => setSheet(s => ({ ...s, vendor: e.target.value }))} placeholder="Home Depot" style={tmInput} /></TmField>
            <TmField label="Date"><input type="date" value={sheet.date} onChange={e => setSheet(s => ({ ...s, date: e.target.value }))} style={tmInput} /></TmField>
          </div>
          <TmField label="Category"><TmChips options={TM_CATS} value={sheet.category} onChange={v => setSheet(s => ({ ...s, category: v }))} /></TmField>
          <TmField label="Job"><TmJobSelect value={sheet.ref} onChange={v => setSheet(s => ({ ...s, ref: v }))} opts={opts} /></TmField>
          <TmField label="Paid with"><TmChips options={['Company card', 'Personal — reimburse me', 'Cash']} value={sheet.paid} onChange={v => setSheet(s => ({ ...s, paid: v }))} /></TmField>
          <TmField label="Note"><input value={sheet.note} onChange={e => setSheet(s => ({ ...s, note: e.target.value }))} placeholder="What was it for?" style={tmInput} /></TmField>
          <TmPrimary label={Number(sheet.amount) > 0 ? `Send ${tmMoney(sheet.amount)} to the office` : 'Send to the office'} busy={sheet.busy} onClick={sendReceipt} />
        </TmSheet>
      )}

      {/* ── mileage ── */}
      {sheet && sheet.kind === 'mileage' && (() => { const mi = Number(sheet.miles) || 0, amt = Math.round(mi * TM_MILEAGE_RATE * 100) / 100; return (
        <TmSheet title="Mileage" onClose={() => setSheet(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'end' }}>
            <TmField label="Miles"><input type="number" inputMode="decimal" value={sheet.miles} onChange={e => setSheet(s => ({ ...s, miles: e.target.value }))} placeholder="0" className="mono" style={{ ...tmInput, fontSize: 24, fontWeight: 600 }} /></TmField>
            <div style={{ paddingBottom: 10 }}><span style={tmLbl}>At {TM_MILEAGE_RATE.toFixed(2)}/mi</span><span className="mono" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em' }}>{tmMoney(amt)}</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <TmField label="From"><input value={sheet.from} onChange={e => setSheet(s => ({ ...s, from: e.target.value }))} placeholder="Shop" style={tmInput} /></TmField>
            <TmField label="To"><input value={sheet.to} onChange={e => setSheet(s => ({ ...s, to: e.target.value }))} placeholder="Site" style={tmInput} /></TmField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <TmField label="Job"><TmJobSelect value={sheet.ref} onChange={v => setSheet(s => ({ ...s, ref: v }))} opts={opts} /></TmField>
            <TmField label="Date"><input type="date" value={sheet.date} onChange={e => setSheet(s => ({ ...s, date: e.target.value }))} style={tmInput} /></TmField>
          </div>
          <TmPrimary label={mi > 0 ? `Submit ${mi} mi · ${tmMoney(amt)}` : 'Submit mileage'} disabled={!(mi > 0)} onClick={() => addExpense({ desc: `Mileage · ${mi} mi${sheet.from || sheet.to ? ` · ${sheet.from || '?'} → ${sheet.to || '?'}` : ''}`, amount: amt, category: 'Mileage', miles: mi, job_ref: sheet.ref || null, date: sheet.date, vendor: null })} />
        </TmSheet>
      ); })()}

      {/* ── no-receipt expense ── */}
      {sheet && sheet.kind === 'manual' && (
        <TmSheet title="Expense without a receipt" onClose={() => setSheet(null)}>
          <TmField label="Amount"><div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '4px 12px' }}><span className="mono" style={{ fontSize: 22, color: 'var(--text-low)' }}>$</span><input type="number" inputMode="decimal" step="0.01" value={sheet.amount} onChange={e => setSheet(s => ({ ...s, amount: e.target.value }))} placeholder="0.00" autoFocus className="mono" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'var(--text-high)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', outline: 'none', padding: '6px 4px' }} /></div></TmField>
          <TmField label="What for · required"><input value={sheet.desc} onChange={e => setSheet(s => ({ ...s, desc: e.target.value }))} placeholder="Parking at the site" style={tmInput} /></TmField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <TmField label="Vendor"><input value={sheet.vendor} onChange={e => setSheet(s => ({ ...s, vendor: e.target.value }))} placeholder="optional" style={tmInput} /></TmField>
            <TmField label="Job"><TmJobSelect value={sheet.ref} onChange={v => setSheet(s => ({ ...s, ref: v }))} opts={opts} /></TmField>
          </div>
          <TmField label="Category"><TmChips options={TM_CATS} value={sheet.category} onChange={v => setSheet(s => ({ ...s, category: v }))} /></TmField>
          <TmPrimary label="Submit for approval" disabled={!(Number(sheet.amount) > 0) || !sheet.desc.trim()} onClick={() => addExpense({ desc: sheet.desc.trim(), amount: Number(sheet.amount), category: sheet.category, vendor: sheet.vendor.trim() || null, job_ref: sheet.ref || null })} />
        </TmSheet>
      )}

      {/* ── detail ── */}
      {sheet && sheet.kind === 'detail' && (() => { const i = sheet.item, r = i.row; const img = i.kind === 'receipt' ? thumbs[r.id] : null; return (
        <TmSheet title={i.title} onClose={() => setSheet(null)} tall>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.04em' }}>{i.amount != null ? tmMoney(i.amount) : '—'}</span><TmStatus s={i.status} /></div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{[i.sub, i.date === tmIso() ? 'today' : tmDayLabel(i.date)].filter(Boolean).join(' · ')}</div>
          {i.kind === 'receipt' && r.note && <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{r.note}</div>}
          {i.kind === 'receipt' && (img ? <img src={img} alt="receipt" style={{ width: '100%', borderRadius: 14, border: '1px solid var(--border-strong)' }} /> : <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>{img === false ? 'Image unavailable' : 'Loading image…'}</div>)}
          {i.kind === 'receipt' && <div style={{ fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>{i.status === 'inbox' ? 'The office turns this into an expense and books it in QuickBooks.' : i.status === 'converted' ? 'Booked by the office ✓' : 'Dismissed by the office — ask them if that was a mistake.'}</div>}
          {i.kind === 'expense' && i.status === 'pending' && <TmGhost label="Remove" color="var(--status-critical)" onClick={() => removeExpense(r)} />}
        </TmSheet>
      ); })()}
    </div>
  );
}

Object.assign(window, { TechClockView, TechReceiptsView, openTechReceipt, useTechTimer, tmTimerStart, tmTimerPause, tmTimerClear, tmScanReceipt, tmShrink, TM_MILEAGE_RATE });

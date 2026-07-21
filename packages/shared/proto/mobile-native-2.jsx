/* ShieldTech Mobile — native screens II: Pipeline, Inventory, Approvals, Work Orders, ShieldTech AI */

function MPipelineView({ onNav }) {
  const stages = [
    { name: 'Lead', total: '$240K', deals: [{ t: 'Sutter Health — 3 clinics', v: 86000 }, { t: 'Presidio Storage — CCTV', v: 34000 }, { t: 'Embarcadero Partners', v: 120000 }] },
    { name: 'Proposal', total: '$180K', deals: [{ t: 'Pinnacle Financial — access', v: 96000 }, { t: 'Mission Bay Dental', v: 22000 }, { t: 'Golden Gate Logistics ph2', v: 62000 }] },
    { name: 'Negotiate', total: '$128K', deals: [{ t: 'City Hall — annex expansion', v: 84000 }, { t: 'Westfield — analog refresh', v: 44000 }] },
    { name: 'Closed', total: '$420K', deals: [{ t: 'Metro Bank — vault upgrade', v: 156000 }, { t: 'Riverside Medical — ICU', v: 98000 }] },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {stages.map(s => (
          <div key={s.name} className="glass" style={{ padding: '9px 8px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 8.5, letterSpacing: '0.07em', color: 'var(--text-low)', textTransform: 'uppercase' }}>{s.name}</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>{s.deals.length}</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--brand)' }}>{s.total}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -14px', padding: '0 14px 6px' }}>
        {stages.map(s => (
          <div key={s.name} style={{ flexShrink: 0, width: 264, scrollSnapAlign: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, padding: '0 2px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-high)' }}>{s.name}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{s.total}</span>
            </div>
            {s.deals.map(d => (
              <div key={d.t} className="glass" style={{ padding: '11px 12px', borderRadius: 11, marginBottom: 7, cursor: 'pointer' }} onClick={() => showToast('Deal opened — full CRM on desktop', 'ok')}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.3 }}>{d.t}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--status-ok)' }}>${(d.v / 1000).toFixed(0)}K</span>
                  <span style={{ fontSize: 9, color: 'var(--text-low)' }}>tap for detail</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center' }}>Swipe stages horizontally · drag-to-stage lives on desktop</div>
    </div>
  );
}

function MInventoryView() {
  const [q, setQ] = React.useState('');
  const items = [
    { sku: 'CAM-AXS-P32', name: 'Axis P3245-V dome', stock: 14, min: 6 },
    { sku: 'CAM-HIK-4K', name: 'Hikvision 4K bullet', stock: 3, min: 6 },
    { sku: 'NVR-HW-16', name: 'Hanwha 16-ch NVR', stock: 2, min: 2 },
    { sku: 'RDR-HID-SE', name: 'HID iCLASS SE reader', stock: 22, min: 8 },
    { sku: 'PNL-DSC-NEO', name: 'DSC PowerSeries Neo', stock: 5, min: 4 },
    { sku: 'CBL-CAT6A', name: 'CAT6A spool (1000ft)', stock: 1, min: 3 },
    { sku: 'UPS-1500', name: 'CyberPower 1500VA UPS', stock: 7, min: 4 },
  ].filter(i => (i.name + i.sku).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU or item…" style={{ background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 13px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
      {items.map(i => {
        const low = i.stock <= i.min;
        return (
          <div key={i.sku} className="glass" style={{ padding: '11px 13px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{i.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{i.sku} · min {i.min}</div>
              </div>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: low ? 'var(--status-critical)' : 'var(--text-high)' }}>{i.stock}</span>
              {low && <button onClick={() => showToast(`PO drafted — restock ${i.name}`, 'ok')} style={{ padding: '6px 11px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 7, color: 'var(--status-critical)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Restock</button>}
            </div>
            <div style={{ marginTop: 7 }}><MBar pct={(i.stock / (i.min * 3)) * 100} color={low ? 'var(--status-critical)' : 'var(--brand)'} /></div>
          </div>
        );
      })}
    </div>
  );
}

function MApprovalsView() {
  const [items, setItems] = useShieldStore(approvalStore);
  const pending = items.filter(i => i.status === 'pending').length;
  const act = (id, ok) => {
    setItems(list => list.map(i => i.id === id ? { ...i, status: ok ? 'approved' : 'denied' } : i));
    showToast(ok ? 'Approved ✓ — synced to portal' : 'Denied — submitter notified', ok ? 'ok' : 'warn');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{pending} pending · approvals e-sign to the audit trail & sync everywhere</div>
      {items.map(i => {
        const decided = i.status !== 'pending';
        return (
        <div key={i.id} className="glass" style={{ padding: '13px 14px', borderRadius: 12, opacity: decided ? 0.55 : 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <MBadge>{i.kind}</MBadge>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{i.amt}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{i.title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 9 }}>{i.sub}</div>
          {decided
            ? <span style={{ fontSize: 11, fontWeight: 700, color: i.status === 'approved' ? 'var(--status-ok)' : 'var(--status-warn)' }}>{i.status === 'approved' ? '✓ Approved' : 'Denied'}</span>
            : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => act(i.id, true)} style={{ flex: 2, padding: '9px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, color: 'var(--status-ok)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>
                <button onClick={() => act(i.id, false)} style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Deny</button>
              </div>
            )}
        </div>
      ); })}
    </div>
  );
}

function MWorkOrdersView({ onNav }) {
  const [wos] = useShieldStore(workOrderStore);
  const [photos] = useShieldStore(photoStore);
  const [open, setOpen] = React.useState(null);
  const stC = { 'in-progress': 'var(--brand)', scheduled: 'var(--text-low)', completed: 'var(--status-ok)', blocked: 'var(--status-critical)' };
  const wo = wos.find(w => w.id === open);
  const comp = wo ? photoCompliance(wo, photos) : null;
  const woPhotos = wo ? photos.filter(p => p.wo === wo.id) : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {wos.map(w => {
        const c = photoCompliance(w, photos);
        return (
          <div key={w.id} onClick={() => setOpen(w.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>{w.id}</span>
              <MBadge color={stC[w.status] || 'var(--brand)'}>{(w.status || 'open').replace('-', ' ')}</MBadge>
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-low)' }}>{w.type}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginTop: 4 }}>{w.customer}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{w.site}</div>
            {c.required.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                <div style={{ flex: 1 }}><MBar pct={c.pct} color={c.pct === 100 ? 'var(--status-ok)' : 'var(--status-warn)'} /></div>
                <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{c.done.length}/{c.required.length} shots</span>
              </div>
            )}
          </div>
        );
      })}
      {wo && (
        <MSheet title={`${wo.id} — ${wo.customer}`} onClose={() => setOpen(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Site', wo.site], ['Type', wo.type], ['Status', (wo.status || 'open').replace('-', ' ')], ['Tech', wo.tech || 'Mike Reyes']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--text-low)', width: 60, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: 'var(--text-high)', textTransform: k === 'Status' ? 'capitalize' : 'none' }}>{v}</span>
              </div>
            ))}
            {comp && comp.required.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Photo checklist — {comp.done.length}/{comp.required.length}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {comp.required.map(s => (
                    <span key={s} style={{ fontSize: 9, padding: '3px 9px', borderRadius: 9, background: comp.done.includes(s) ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.07)', border: `1px solid ${comp.done.includes(s) ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`, color: comp.done.includes(s) ? 'var(--status-ok)' : 'var(--text-low)' }}>{comp.done.includes(s) ? '✓ ' : '○ '}{s}</span>
                  ))}
                </div>
              </div>
            )}
            {woPhotos.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Site photos ({woPhotos.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {woPhotos.slice(0, 6).map(p => <MockPhoto key={p.id} photo={p} stamp={false} style={{ aspectRatio: '4/3', borderRadius: 8 }} />)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setOpen(null); onNav('photos'); }} style={{ flex: 1, padding: '11px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>All photos</button>
              <button onClick={() => { setOpen(null); onNav('workorder-full'); }} style={{ flex: 1, padding: '11px 0', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 9, color: 'var(--status-ok)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Full work order</button>
            </div>
          </div>
        </MSheet>
      )}
    </div>
  );
}

function MHermesView() {
  const [thread, setThread] = React.useState([
    { from: 'ai', text: 'Morning Sarah. Revenue is pacing +8.2%, one NVR incident is active at Acme Dental, and 4 approvals are waiting. What do you need?' },
  ]);
  const [input, setInput] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [thread]);
  const send = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setThread(t => [...t, { from: 'me', text: msg }]);
    setInput('');
    setTimeout(() => {
      const q = msg.toLowerCase();
      let reply;
      if (q.includes('revenue') || q.includes('money') || q.includes('cash')) reply = 'MTD revenue $284.6K (+8.2%). Cash $482.6K. Biggest risk: $19.4K overdue AR — Harbor View is 12 days late. Want collection reminders drafted?';
      else if (q.includes('week') || q.includes('schedule')) reply = 'This week: 15 jobs, $51.9K booked. Friday is overbooked for Jessica (conflict flagged) and Diana has 6 idle hours Thursday — the Copilot suggests moving the Westfield recal to her.';
      else if (q.includes('churn') || q.includes('risk')) reply = 'Churn radar: Harbor View (58) and Westfield (64) are at risk. Harbor View: late payments + unanswered complaint. Suggested save-play: waive the camera-add trip fee and book a free health check.';
      else reply = 'Pulled that across all three apps — summary: nothing urgent beyond the Acme incident. I’ve flagged the detail to your Daily Digest.';
      setThread(t => [...t, { from: 'ai', text: reply }]);
    }, 700);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 9, paddingBottom: 8 }}>
        {thread.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
            <div style={{ padding: '10px 13px', borderRadius: m.from === 'me' ? '13px 13px 4px 13px' : '13px 13px 13px 4px', background: m.from === 'me' ? 'rgba(63,169,245,0.14)' : 'rgba(5,7,10,0.55)', border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {['How’s revenue?', 'What’s my week look like?', 'Who’s at churn risk?'].map(s => (
          <button key={s} onClick={() => send(s)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 13, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask ShieldTech AI anything…"
          style={{ flex: 1, background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 11, padding: '11px 14px', color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => send()} style={{ padding: '0 18px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↑</button>
      </div>
    </div>
  );
}

Object.assign(window, { MPipelineView, MInventoryView, MApprovalsView, MWorkOrdersView, MHermesView });

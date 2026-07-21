/* Tech App — My Truck: van stock with auto-restock automation.
   Using a part decrements stock; dropping below min auto-files a parts requisition
   that appears in the admin portal's Parts Requisition screen. */

function TechTruckView() {
  const [truck, setTruck] = useShieldStore(truckStore);
  const [reqs] = useShieldStore(partsReqStore);
  const me = window.__shieldUser || {};
  const meId = me.initials || 'ME';
  const items = truck[meId] || [];

  const pendingRestock = (sku) => reqs.some(r => r.tech === meId && r.status === 'requested' && r.parts.some(p => p.sku === sku) && (r.notes || '').includes('Auto-restock'));

  const useOne = (sku) => {
    const item = items.find(i => i.sku === sku);
    if (!item || item.qty === 0) return;
    const newQty = item.qty - 1;
    setTruck(prev => ({ ...prev, [meId]: prev[meId].map(i => i.sku === sku ? { ...i, qty: newQty } : i) }));
    if (newQty < item.min && !pendingRestock(sku)) {
      const reorder = item.min * 2 - newQty;
      partsReqStore.set(prev => [{
        id: genId('REQ'), tech: meId, techName: me.name || 'Technician', status: 'requested',
        urgency: newQty === 0 ? 'urgent' : 'normal', job: '',
        parts: [{ name: item.name, sku: item.sku, qty: reorder }],
        submitted: 'just now', notes: 'Auto-restock from truck inventory',
      }, ...prev]);
      showToast(`${item.name} below minimum — restock auto-requested (×${reorder})`, 'warn');
    } else {
      showToast(`${item.name} logged to job`, 'ok');
    }
  };
  const restock = (sku) => {
    setTruck(prev => ({ ...prev, [meId]: prev[meId].map(i => i.sku === sku ? { ...i, qty: i.min * 2 } : i) }));
    showToast('Marked as restocked', 'ok');
  };

  const lowCount = items.filter(i => i.qty < i.min).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>My Truck</div>
        <span className="mono" style={{ fontSize: 11, color: lowCount ? 'var(--status-warn)' : 'var(--status-ok)' }}>{lowCount ? `${lowCount} below min` : 'fully stocked'}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-low)', lineHeight: 1.5, marginTop: -6 }}>
        "Use on job" logs the part to your active work order. Anything that drops below minimum files a warehouse restock request automatically.
      </div>
      {items.length === 0 && <div className="glass" style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-low)', borderRadius: 'var(--radius-md)' }}>No van stock configured yet — inventory assigned to your truck appears here.</div>}
      {items.map(item => {
        const low = item.qty < item.min;
        const pending = pendingRestock(item.sku);
        const pct = Math.min(100, Math.round((item.qty / (item.min * 2)) * 100));
        return (
          <div key={item.sku} className="glass" style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${low ? 'rgba(251,191,36,0.3)' : 'var(--border-subtle)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{item.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 1 }}>{item.sku} · min {item.min}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: item.qty === 0 ? 'var(--status-critical)' : low ? 'var(--status-warn)' : 'var(--text-high)' }}>{item.qty}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)', letterSpacing: '0.08em' }}>ON HAND</div>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden', margin: '8px 0' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: item.qty === 0 ? 'var(--status-critical)' : low ? 'var(--status-warn)' : 'var(--status-ok)', transition: 'width 0.25s' }}></div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => useOne(item.sku)} disabled={item.qty === 0}
                style={{ padding: '6px 14px', background: item.qty ? 'rgba(63,169,245,0.08)' : 'rgba(148,163,184,0.04)', border: `1px solid ${item.qty ? 'var(--border-strong)' : 'var(--border-subtle)'}`, borderRadius: 6, color: item.qty ? 'var(--brand)' : 'var(--text-low)', fontSize: 11, fontWeight: 600, cursor: item.qty ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>
                Use on job
              </button>
              {pending && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '3px 9px' }}>⟳ restock requested</span>}
              {low && !pending && <button onClick={() => restock(item.sku)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Restocked</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { TechTruckView });

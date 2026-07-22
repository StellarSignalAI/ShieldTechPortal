/* Global customer/project context — one pill in every top bar.
   Pick a customer (and optionally a project); the choice syncs across devices
   (contextStore rides the app_state sync) and is exposed as
   window.__shieldContext for any screen that wants to filter. */

const contextStore = createShieldStore('appcontext', { customer: null, project: null });

function shieldContextOptions() {
  const custs = new Set();
  try { (window.__shieldStores.customers.get() || []).forEach(c => custs.add(c.name || c.customer || String(c))); } catch {}
  try { (window.SW && window.SW.OPPS || []).forEach(o => o.buyer && custs.add(o.buyer)); } catch {}
  const projects = [];
  try { (window.__shieldStores.sitescans.get() || []).forEach(p => projects.push({ id: p.id, label: `${p.id} · ${p.customer}`, customer: p.customer })); } catch {}
  try { (window.SW && window.SW.OPPS || []).forEach(o => projects.push({ id: o.id, label: o.title, customer: o.buyer })); } catch {}
  return { customers: [...custs], projects };
}

function ShieldContextPill({ compact }) {
  const [ctx] = useShieldStore(contextStore);
  const [open, setOpen] = React.useState(false);
  window.__shieldContext = ctx;
  const label = ctx.customer ? (ctx.project ? `${ctx.customer} · ${ctx.project.slice(0, 14)}` : ctx.customer) : 'All customers';
  const { customers, projects } = open ? shieldContextOptions() : { customers: [], projects: [] };
  const set = (patch) => contextStore.set(prev => ({ ...prev, ...patch }));
  const row = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 13px', background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' };
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button onClick={() => setOpen(o => !o)} title="Customer / project context" style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: compact ? 130 : 220, padding: '5px 10px', borderRadius: 100, background: ctx.customer ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.05)', border: `1px solid ${ctx.customer ? 'var(--brand)' : 'var(--border-subtle)'}`, color: ctx.customer ? 'var(--brand)' : 'var(--text-mid)', font: '600 10px/1.2 var(--font-body)', cursor: 'pointer', overflow: 'hidden' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 8, flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 4000 }} />
          <div style={{ position: 'absolute', top: 32, left: 0, zIndex: 4001, width: 250, maxHeight: 340, overflowY: 'auto', background: 'var(--modal, #0d1420)', border: '1px solid var(--border-strong)', borderRadius: 12, boxShadow: '0 16px 44px rgba(0,0,0,0.6)' }}>
            <button style={row} onClick={() => { set({ customer: null, project: null }); setOpen(false); }}>◎ All customers</button>
            {customers.length > 0 && <div style={{ padding: '7px 13px 3px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-low)' }}>CUSTOMERS</div>}
            {customers.slice(0, 20).map(c => (
              <button key={c} style={{ ...row, color: ctx.customer === c ? 'var(--brand)' : 'var(--text-high)' }} onClick={() => { set({ customer: c, project: null }); setOpen(false); }}>{c}</button>
            ))}
            {projects.length > 0 && <div style={{ padding: '7px 13px 3px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-low)' }}>PROJECTS</div>}
            {projects.slice(0, 20).map(p => (
              <button key={p.id} style={{ ...row, fontSize: 12 }} onClick={() => { set({ customer: p.customer || null, project: p.id }); setOpen(false); }}>{p.label}</button>
            ))}
            {customers.length === 0 && projects.length === 0 && (
              <div style={{ padding: '12px 13px', fontSize: 11, color: 'var(--text-low)' }}>No customers or projects yet — they appear here as they're created.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { contextStore, ShieldContextPill, shieldContextOptions });

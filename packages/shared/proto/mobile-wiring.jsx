/* ShieldTech Mobile — wiring layer
   Real, persistent, cross-app-syncing flows for the mobile app:
   • MobileCustomerForm  — full create/edit form (parity with desktop) → customerStore
   • MobileCustomerDetail — tappable customer record sheet
   • MTabEditor          — edit the bottom tab bar (allocated slots + locked 'All')
   • MNewJobSheet        — schedule a job → jobStore (shows on desktop calendar too) */

const MW_TECHS = { MR: 'Mike Reyes', JL: 'Jessica Liu', KW: 'Kevin White', DP: 'Diana Patel', TG: 'Tony Garcia' };

/* Shared field styles */
const mwInput = { width: '100%', padding: '11px 13px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' };
const mwLabel = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };

function MWField({ label, value, onChange, placeholder, type = 'text', textarea }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={mwLabel}>{label}</span>
      {textarea
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={2} style={{ ...mwInput, resize: 'vertical', minHeight: 56 }} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={mwInput} />}
    </label>
  );
}

function MWSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={mwLabel}>{label}</span>
      <select value={value} onChange={onChange} style={{ ...mwInput, cursor: 'pointer', appearance: 'none' }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </label>
  );
}

/* ── Create / Edit Customer (mobile) ── */
function MobileCustomerForm({ editing, onClose, onSaved }) {
  const [f, setF] = React.useState(() => editing ? {
    name: editing.name || '', dba: editing.dba || '', type: editing.type || 'Commercial', industry: editing.industry || '',
    address: editing.address || '', billing: editing.billing || '', phone: editing.phone || '', website: editing.website || '',
    taxId: editing.taxId || '', terms: editing.terms || 'Net 30', taxExempt: !!editing.taxExempt, owner: editing.owner || '',
    mrr: editing.mrr || '', sites: editing.sites || '', tags: (editing.tags || []).join(', '), notes: editing.notes || '',
  } : { name: '', dba: '', type: 'Commercial', industry: '', address: '', billing: '', phone: '', website: '', taxId: '', terms: 'Net 30', taxExempt: false, owner: '', mrr: '', sites: '', tags: '', notes: '' });
  const set = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setF(p => ({ ...p, [k]: v })); };

  const save = () => {
    if (!f.name.trim()) { showToast('Company name is required', 'warn'); return; }
    if (editing) {
      const logo = f.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || editing.logo;
      customerStore.set(list => list.map(c => c.id === editing.id ? {
        ...c, name: f.name.trim(), dba: f.dba, type: f.type, industry: f.industry, address: f.address, billing: f.billing,
        phone: f.phone, website: f.website, taxId: f.taxId, terms: f.terms, taxExempt: !!f.taxExempt, owner: f.owner || c.owner,
        mrr: f.mrr !== '' ? Number(f.mrr) : c.mrr, sites: f.sites !== '' ? Number(f.sites) : c.sites,
        tags: f.tags.split(',').map(t => t.trim()).filter(Boolean), notes: f.notes, logo,
      } : c));
      showToast(`${f.name.trim()} updated — synced to portal`, 'ok');
    } else {
      const rec = buildCustomer({ ...f, source: 'mobile' });
      customerStore.set(list => [rec, ...list]);
      showToast(`${rec.name} added — synced to portal`, 'ok');
    }
    onSaved ? onSaved() : onClose();
  };

  return (
    <MSheet title={editing ? 'Edit Customer' : 'New Customer'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-ok)', boxShadow: '0 0 6px var(--status-ok)' }}></span>
          Saves to the shared book — appears on the desktop portal instantly
        </div>
        <MWField label="Company Name *" value={f.name} onChange={set('name')} placeholder="e.g. Metro Bank Corp" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWSelect label="Type" value={f.type} onChange={set('type')} options={['Commercial','Government','Healthcare','Hospitality','Residential','Industrial','Education','Non-Profit']} /></div>
          <div style={{ flex: 1 }}><MWField label="Industry" value={f.industry} onChange={set('industry')} placeholder="Banking" /></div>
        </div>
        <MWField label="DBA" value={f.dba} onChange={set('dba')} placeholder="Optional" />
        <MWField label="Primary Address" value={f.address} onChange={set('address')} placeholder="1450 Market St, Philadelphia, PA" />
        <MWField label="Billing Address" value={f.billing} onChange={set('billing')} placeholder="Same as primary" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWField label="Phone" value={f.phone} onChange={set('phone')} placeholder="(215) 555-0200" /></div>
          <div style={{ flex: 1 }}><MWField label="Website" value={f.website} onChange={set('website')} placeholder="acme.com" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWField label="Tax ID" value={f.taxId} onChange={set('taxId')} placeholder="23-4567890" /></div>
          <div style={{ flex: 1 }}><MWSelect label="Terms" value={f.terms} onChange={set('terms')} options={['Due on Receipt','Net 10','Net 15','Net 30','Net 45','Net 60','Net 90','2/10 Net 30']} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWField label="MRR ($)" type="number" value={f.mrr} onChange={set('mrr')} placeholder="0" /></div>
          <div style={{ flex: 1 }}><MWField label="Sites" type="number" value={f.sites} onChange={set('sites')} placeholder="0" /></div>
        </div>
        <MWField label="Account Owner" value={f.owner} onChange={set('owner')} placeholder="John Mitchell" />
        <MWField label="Tags (comma separated)" value={f.tags} onChange={set('tags')} placeholder="Enterprise, Banking" />
        <MWField label="Notes" textarea value={f.notes} onChange={set('notes')} placeholder="Internal notes…" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-mid)', padding: '4px 0' }}>
          <input type="checkbox" checked={f.taxExempt} onChange={set('taxExempt')} style={{ accentColor: 'var(--brand)', width: 17, height: 17 }} />
          Tax exempt
        </label>
        <div style={{ display: 'flex', gap: 9, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{editing ? 'Save Changes' : 'Add Customer'}</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Customer detail (mobile) ── */
function MobileCustomerDetail({ customer, onClose, onNav }) {
  const [allCusts] = useShieldStore(customerStore);
  const [subs] = useShieldStore(subCustomerStore);
  const [editOpen, setEditOpen] = React.useState(false);
  const c = allCusts.find(x => x.id === customer.id) || customer;
  const mySubs = subs.filter(s => s.parentId === c.id);
  const hColor = c.health >= 85 ? 'var(--status-ok)' : c.health >= 70 ? 'var(--status-warn)' : 'var(--status-critical)';

  if (editOpen) return <MobileCustomerForm editing={c} onClose={() => setEditOpen(false)} onSaved={() => setEditOpen(false)} />;

  return (
    <MSheet title={c.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{c.logo}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{c.acctNum} · {c.type}{c.industry ? ` · ${c.industry}` : ''}</div>
            <MBadge color={c.status === 'archived' ? 'var(--text-low)' : 'var(--status-ok)'}>{c.status}</MBadge>
          </div>
          <button onClick={() => setEditOpen(true)} style={{ padding: '8px 16px', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 9, color: 'var(--brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Edit</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <MStat label="MRR" value={c.mrr > 0 ? `$${(c.mrr / 1000).toFixed(1)}K` : '—'} accent={c.mrr > 0 ? 'var(--brand)' : 'var(--text-low)'} />
          <MStat label="BALANCE" value={c.balance > 0 ? `$${(c.balance / 1000).toFixed(1)}K` : '—'} accent={c.balance > 0 ? 'var(--status-warn)' : 'var(--status-ok)'} />
          <MStat label="HEALTH" value={c.health > 0 ? c.health : '—'} accent={c.health > 0 ? hColor : 'var(--text-low)'} />
        </div>

        <MSection title="Company info">
          {[['Address', c.address], ['Phone', c.phone], ['Website', c.website], ['Tax ID', c.taxId], ['Terms', c.terms], ['Tax exempt', c.taxExempt ? 'Yes' : 'No'], ['Owner', c.owner], ['Sites', c.sites]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-low)', flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '—'}</span>
            </div>
          ))}
        </MSection>

        {c.tags && c.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.tags.map(t => <span key={t} style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--brand)' }}>{t}</span>)}
          </div>
        )}

        <MSection title={`Sub-customers (${mySubs.length})`}>
          {mySubs.length === 0
            ? <div style={{ fontSize: 11, color: 'var(--text-low)', padding: '6px 2px' }}>None linked.</div>
            : mySubs.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 2px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-mid)' }}>{s.name}</span>
                <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 7, background: 'rgba(63,169,245,0.08)', color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase' }}>{s.role.replace(/_/g, ' ')}</span>
              </div>
            ))}
        </MSection>

        <button onClick={() => { onClose(); onNav && onNav('customers-list'); }} style={{ padding: '12px 0', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open full record (desktop layout) ›</button>
      </div>
    </MSheet>
  );
}

/* ── New Job sheet → jobStore (live on mobile agenda + desktop calendar) ── */
function MNewJobSheet({ onClose, onSaved, defaultDay = 3 }) {
  const [allCusts] = useShieldStore(customerStore);
  const [f, setF] = React.useState({ title: '', customer: '', type: 'install', day: String(defaultDay), start: '9', dur: '2', value: '', tech: '' });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const dayOpts = [['1', 'Mon Jun 8'], ['2', 'Tue Jun 9'], ['3', 'Wed Jun 10'], ['4', 'Thu Jun 11'], ['5', 'Fri Jun 12'], ['6', 'Sat Jun 13'], ['7', 'Sun Jun 14']];
  const hourOpts = []; for (let h = 7; h <= 18; h++) hourOpts.push([String(h), `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`]);

  const save = () => {
    if (!f.title.trim()) { showToast('Job title is required', 'warn'); return; }
    jobStore.set(prev => {
      const nextId = prev.reduce((m, j) => Math.max(m, j.id), 0) + 1;
      const day = Number(f.day);
      return [...prev, {
        id: nextId, title: f.title.trim(), techs: f.tech ? [f.tech] : [], type: f.type,
        day, endDay: day, start: Number(f.start), dur: Number(f.dur),
        customer: f.customer || '—', value: Number(f.value) || 0,
      }];
    });
    showToast('Job scheduled — synced to portal calendar', 'ok');
    onSaved ? onSaved() : onClose();
  };

  return (
    <MSheet title="Schedule a Job" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MWField label="Job Title *" value={f.title} onChange={set('title')} placeholder="e.g. Metro Bank — Camera Install" />
        <MWSelect label="Customer" value={f.customer} onChange={set('customer')} options={[{ value: '', label: 'Select customer…' }, ...allCusts.map(c => ({ value: c.name, label: c.name }))]} />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWSelect label="Type" value={f.type} onChange={set('type')} options={[{ value: 'install', label: 'Install' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'repair', label: 'Repair' }, { value: 'survey', label: 'Survey' }, { value: 'meeting', label: 'Meeting' }]} /></div>
          <div style={{ flex: 1 }}><MWSelect label="Assign Tech" value={f.tech} onChange={set('tech')} options={[{ value: '', label: 'Unassigned' }, ...Object.entries(MW_TECHS).map(([id, n]) => ({ value: id, label: n }))]} /></div>
        </div>
        <MWSelect label="Day" value={f.day} onChange={set('day')} options={dayOpts.map(([v, l]) => ({ value: v, label: l }))} />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><MWSelect label="Start" value={f.start} onChange={set('start')} options={hourOpts.map(([v, l]) => ({ value: v, label: l }))} /></div>
          <div style={{ flex: 1 }}><MWField label="Duration (h)" type="number" value={f.dur} onChange={set('dur')} placeholder="2" /></div>
        </div>
        <MWField label="Job Value ($)" type="number" value={f.value} onChange={set('value')} placeholder="0" />
        <div style={{ display: 'flex', gap: 9, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-mid)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Schedule Job</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── Bottom Tab Bar Editor ── */
function MTabEditor({ onClose }) {
  const [cfg, setCfg] = useShieldStore(mobileTabsStore);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [q, setQ] = React.useState('');

  const editableCap = cfg.maxTabs;                  // every slot is editable (All lives in the side menu)
  const tabs = cfg.tabs.slice(0, editableCap);
  const usedTotal = tabs.length;

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));
  const setMax = (n) => setCfg(prev => ({ ...prev, maxTabs: n, tabs: prev.tabs.slice(0, n) }));
  const move = (i, dir) => setCfg(prev => {
    const arr = [...prev.tabs]; const j = i + dir;
    if (j < 0 || j >= arr.length) return prev;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...prev, tabs: arr };
  });
  const remove = (i) => setCfg(prev => ({ ...prev, tabs: prev.tabs.filter((_, k) => k !== i) }));
  const rename = (i, label) => setCfg(prev => ({ ...prev, tabs: prev.tabs.map((t, k) => k === i ? { ...t, label } : t) }));
  const add = (item) => { setCfg(prev => ({ ...prev, tabs: [...prev.tabs, { id: item.id, icon: item.icon, label: item.label }] })); setPickerOpen(false); setQ(''); };

  // ── Hold-and-drag reordering ──
  const rowsRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null); // { i, dy, target, h }
  const gripDown = (i) => (e) => {
    e.preventDefault();
    const rowEls = rowsRef.current ? rowsRef.current.querySelectorAll('[data-trow]') : [];
    const h = rowEls[0] ? rowEls[0].offsetHeight + 8 : 58;
    dragRef.current = { i, startY: e.clientY, h, target: i };
    setDrag({ i, dy: 0, target: i, h });
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    if (navigator.vibrate) navigator.vibrate(8);
  };
  const gripMove = (e) => {
    if (!dragRef.current) return;
    const { i, startY, h } = dragRef.current;
    const dy = e.clientY - startY;
    let target = i + Math.round(dy / h);
    target = Math.max(0, Math.min(tabs.length - 1, target));
    dragRef.current.target = target;
    setDrag({ i, dy, target, h });
  };
  const gripUp = () => {
    const d = dragRef.current;
    dragRef.current = null; setDrag(null);
    if (!d || d.target == null || d.target === d.i) return;
    setCfg(prev => { const arr = [...prev.tabs]; const [it] = arr.splice(d.i, 1); arr.splice(d.target, 0, it); return { ...prev, tabs: arr }; });
    if (navigator.vibrate) navigator.vibrate(8);
  };
  const rowShift = (k) => {
    if (!drag) return 0;
    const { i, target, h } = drag;
    if (k === i) return null; // dragged row handled separately
    if (i < target && k > i && k <= target) return -h;
    if (i > target && k < i && k >= target) return h;
    return 0;
  };

  // Candidate screens from the full nav directory (minus the All tab + already-chosen).
  const chosen = new Set(tabs.map(t => t.id));
  const candidates = NAV_ITEMS.filter(i => !i.hidden && i.id !== 'm-more' && !chosen.has(i.id))
    .filter(i => i.label.toLowerCase().includes(q.toLowerCase()));

  if (pickerOpen) {
    return (
      <MSheet title="Add a Tab" onClose={() => setPickerOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search screens…" style={mwInput} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {candidates.map(item => (
              <button key={item.id} onClick={() => add(item)} className="glass" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 9, border: '1px solid var(--border-subtle)', cursor: 'pointer', background: 'var(--glass-bg)', borderRadius: 10, textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <Icon name={item.icon} size={16} color="var(--brand)" />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', lineHeight: 1.2 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </MSheet>
    );
  }

  return (
    <MSheet title="Edit Tab Bar" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Allocation */}
        <div className="glass" style={{ padding: '13px 14px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Allocated tabs</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setMax(Math.max(3, cfg.maxTabs - 1))} disabled={cfg.maxTabs <= 3} style={mwStep(cfg.maxTabs <= 3)}>−</button>
              <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand)', width: 18, textAlign: 'center' }}>{cfg.maxTabs}</span>
              <button onClick={() => setMax(Math.min(6, cfg.maxTabs + 1))} disabled={cfg.maxTabs >= 6} style={mwStep(cfg.maxTabs >= 6)}>+</button>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{usedTotal} of {cfg.maxTabs} slots used · the full <strong style={{ color: 'var(--text-mid)' }}>All</strong> directory now opens from the ☰ menu, top-left.</div>
        </div>

        {/* Editable slots */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}><span>Your tabs</span><span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--text-low)' }}>hold ⠿ &amp; drag to reorder</span></div>
          <div ref={rowsRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tabs.map((t, i) => {
              const isDragged = drag && drag.i === i;
              const shift = rowShift(i);
              const ty = isDragged ? drag.dy : (shift || 0);
              return (
              <div key={t.id + i} data-trow className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 11, transform: `translateY(${ty}px)`, transition: isDragged ? 'none' : 'transform 0.16s ease', zIndex: isDragged ? 5 : 1, position: 'relative', boxShadow: isDragged ? '0 12px 28px -8px rgba(0,0,0,0.6)' : 'none', borderColor: isDragged ? 'var(--border-strong)' : undefined, opacity: isDragged ? 0.97 : 1 }}>
                <span onPointerDown={gripDown(i)} onPointerMove={gripMove} onPointerUp={gripUp} onPointerCancel={gripUp} title="Drag to reorder" style={{ flexShrink: 0, width: 26, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', touchAction: 'none', color: 'var(--text-low)', fontSize: 15, lineHeight: 1, userSelect: 'none' }}>⠿</span>
                <Icon name={t.icon} size={17} color="var(--brand)" />
                <input value={t.label} onChange={e => rename(i, e.target.value)} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', borderBottom: '1px solid transparent', color: 'var(--text-high)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', outline: 'none', padding: '2px 0' }} onFocus={e => e.target.style.borderBottomColor = 'var(--border-subtle)'} onBlur={e => e.target.style.borderBottomColor = 'transparent'} />
                <button onClick={() => remove(i)} style={{ ...mwIconBtn(false), color: 'var(--status-critical)', borderColor: 'rgba(244,63,94,0.3)', flexShrink: 0 }}>✕</button>
              </div>
              );
            })}

            {/* Add slot */}
            {tabs.length < editableCap
              ? <button onClick={() => setPickerOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: 'rgba(63,169,245,0.06)', border: '1px dashed var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add tab ({editableCap - tabs.length} left)</button>
              : <div style={{ padding: '11px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-low)', border: '1px dashed var(--border-subtle)', borderRadius: 11 }}>All {editableCap} slots filled — raise the allocation or remove one to add more.</div>}
          </div>
        </div>

        <button onClick={() => { mobileTabsStore.reset(); }} style={{ padding: '10px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 11, color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reset to default</button>
        <button onClick={onClose} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Done</button>
      </div>
    </MSheet>
  );
}
const mwStep = (disabled) => ({ width: 30, height: 30, borderRadius: 8, background: disabled ? 'transparent' : 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', color: disabled ? 'var(--text-low)' : 'var(--brand)', fontSize: 16, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: disabled ? 0.4 : 1 });
const mwIconBtn = (disabled) => ({ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--border-subtle)', color: disabled ? 'var(--text-low)' : 'var(--text-mid)', fontSize: 12, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: disabled ? 0.35 : 1 });

Object.assign(window, { MobileCustomerForm, MobileCustomerDetail, MNewJobSheet, MTabEditor, MWField, MWSelect });

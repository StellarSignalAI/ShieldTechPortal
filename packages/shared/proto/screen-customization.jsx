/* Customization Layer — Widget Dashboard, Custom Nav, Sidecart, Preferences, Notifications */

/* Map each widget type to the portal screen it drills into when clicked */
const WIDGET_NAV = {
  tickets: 'helpdesk', monitoring: 'cameras', workorders: 'workorder', schedule: 'dispatch',
  fleet: 'dispatch', approvals: 'approvals', mrr: 'mrr', pipeline: 'crm', revenue: 'finance',
  health: 'health', renewals: 'contracts', leaderboard: 'skills', nps: 'nps', safety: 'compliance',
  hermes: 'hermes', clock: 'statuspage', threat: 'intel', uptime: 'cameras', kudos: 'employees',
  certs: 'certs', powerhour: 'reports', oncall: 'dispatch', incidents: 'incidents', sla: 'sla',
  inventory: 'inventory', parts: 'parts-req', invoices: 'finance', commissions: 'commissions',
};

/* Widgets with no dedicated screen open a self-contained detail drawer instead */
const WIDGET_DETAIL = {
  weather: () => ({
    kind: 'detail', title: 'Field Weather', subtitle: 'San Francisco Bay Area · crew dispatch conditions',
    badge: { status: 'online', label: 'Good for install' },
    headline: 'Clear through midday — rooftop camera installs are a go. Light rain after 4 PM.',
    sections: [
      { label: '5-Day Forecast', items: [
        { title: 'Today · Sunny', sub: 'Wind 6 mph · Humidity 54%', right: '68° / 54°', status: 'ok' },
        { title: 'Sat · Partly Cloudy', sub: 'Wind 9 mph', right: '66° / 53°', status: 'ok' },
        { title: 'Sun · Light Rain', sub: 'Reschedule exterior work', right: '61° / 50°', status: 'warn' },
        { title: 'Mon · Showers', sub: 'Indoor jobs only', right: '59° / 49°', status: 'critical' },
        { title: 'Tue · Clearing', sub: 'Wind 7 mph', right: '64° / 51°', status: 'ok' },
      ]},
      { label: 'Dispatch Impact', rows: [
        { k: 'Jobs Today', v: '12 scheduled' }, { k: 'Weather-Sensitive', v: '4 exterior', color: 'var(--status-warn)' },
        { k: 'Recommended', v: 'Front-load AM', mono: false },
      ]},
    ],
    actions: [
      { label: 'Notify Crews', onClick: () => shieldToast('Weather advisory sent to field crews', 'ok'), close: true },
      { label: 'Open Dispatch', primary: true, successMsg: 'Opening dispatch board', onClick: () => {} },
    ],
  }),
};

function CustomDashboard({ onNav }) {
  const [editMode, setEditMode] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [widgetDrawer, setWidgetDrawer] = React.useState(false);
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  const [navCustomize, setNavCustomize] = React.useState(false);
  const [sidecart, setSidecart] = React.useState(false);
  const [sidecartItems, setSidecartItems] = React.useState([
  { desc: 'Axis P3265-V Dome Camera', qty: 4, rate: 890 },
  { desc: 'HID iCLASS SE Reader', qty: 2, rate: 340 }]
  );
  const [notifCenter, setNotifCenter] = React.useState(false);
  const [cmdPalette, setCmdPalette] = React.useState(false);
  const [tabCtx, setTabCtx] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);
  const [widgetGallery, setWidgetGallery] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => {setToast(m);setTimeout(() => setToast(null), 3000);};

  const [tabs, setTabs] = React.useState([
  { id: 0, label: 'Overview', locked: false },
  { id: 1, label: 'Finance', locked: false },
  { id: 2, label: 'Field', locked: false }]
  );
  const [renamingTab, setRenamingTab] = React.useState(null);

  const [widgets, setWidgets] = React.useState({
    0: [
    { id: 'w1', type: 'tickets', size: 'small' },
    { id: 'w2', type: 'incidents', size: 'small' },
    { id: 'w3', type: 'sla', size: 'medium' },
    { id: 'w4', type: 'revenue', size: 'medium' },
    { id: 'w5', type: 'uptime', size: 'large' },
    { id: 'w6', type: 'hermes', size: 'large' },
    { id: 'w7', type: 'threat', size: 'small' },
    { id: 'w8', type: 'oncall', size: 'small' },
    { id: 'w9', type: 'kudos', size: 'medium' },
    { id: 'w10', type: 'schedule', size: 'medium' }],

    1: [
    { id: 'f1', type: 'mrr', size: 'medium' },
    { id: 'f2', type: 'revenue', size: 'medium' },
    { id: 'f3', type: 'invoices', size: 'large' },
    { id: 'f4', type: 'pipeline', size: 'large' },
    { id: 'f5', type: 'commissions', size: 'medium' },
    { id: 'f6', type: 'renewals', size: 'small' },
    { id: 'f7', type: 'health', size: 'small' }],

    2: [
    { id: 'd1', type: 'fleet', size: 'large' },
    { id: 'd2', type: 'schedule', size: 'medium' },
    { id: 'd3', type: 'workorders', size: 'small' },
    { id: 'd4', type: 'inventory', size: 'small' },
    { id: 'd5', type: 'parts', size: 'medium' },
    { id: 'd6', type: 'leaderboard', size: 'large' },
    { id: 'd7', type: 'certs', size: 'medium' },
    { id: 'd8', type: 'safety', size: 'small' }]

  });

  const [density, setDensity] = React.useState('comfortable');
  const [accentIntensity, setAccentIntensity] = React.useState('normal');

  const widgetLibrary = (window.ST_ORDER || Object.keys(ST_REGISTRY)).map((type) => ({ type, label: ST_REGISTRY[type].label, cat: ST_REGISTRY[type].cat }));



  // ⌘K listener
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPalette(true);
      }
      if (e.key === 'Escape') {
        setCmdPalette(false);
        setNotifCenter(false);
        setPrefsOpen(false);
        setNavCustomize(false);
        setWidgetDrawer(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const currentWidgets = widgets[tabs[activeTab]?.id] || [];

  const removeWidget = (wid) => {
    const tabId = tabs[activeTab].id;
    setWidgets((prev) => ({ ...prev, [tabId]: prev[tabId].filter((w) => w.id !== wid) }));
    showToast('Widget removed');
  };

  const addWidget = (type, size = 'medium') => {
    const tabId = tabs[activeTab].id;
    const def = ST_REGISTRY[type];
    const sz = (def?.sizes || ['medium']).includes(size) ? size : def.sizes[0];
    const newW = { id: `w-${Date.now()}`, type, size: sz };
    setWidgets((prev) => ({ ...prev, [tabId]: [...(prev[tabId] || []), newW] }));
    showToast(`${def?.label || type} added`);
  };

  const resizeWidget = (wid, size) => {
    const tabId = tabs[activeTab].id;
    setWidgets((prev) => ({ ...prev, [tabId]: prev[tabId].map((w) => w.id === wid ? { ...w, size } : w) }));
  };
  const cycleSize = (wid) => {
    const tabId = tabs[activeTab].id;
    setWidgets((prev) => ({ ...prev, [tabId]: prev[tabId].map((w) => {
      if (w.id !== wid) return w;
      const order = ST_REGISTRY[w.type].sizes;
      return { ...w, size: order[(order.indexOf(w.size) + 1) % order.length] };
    }) }));
  };

  /* ── Drag-to-reorder + drag-to-resize ── */
  const [dragId, setDragId] = React.useState(null);
  const [dragOverId, setDragOverId] = React.useState(null);
  const [resizingId, setResizingId] = React.useState(null);

  const moveWidget = (fromId, toId) => {
    const tabId = tabs[activeTab].id;
    setWidgets((prev) => {
      const arr = [...(prev[tabId] || [])];
      const from = arr.findIndex((w) => w.id === fromId);
      const to = arr.findIndex((w) => w.id === toId);
      if (from < 0 || to < 0 || from === to) return prev;
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return { ...prev, [tabId]: arr };
    });
  };

  const CELL = 178, GAP = 16;
  const startResize = (e, widget) => {
    e.stopPropagation();
    e.preventDefault();
    const def = ST_REGISTRY[widget.type];
    const cell = e.currentTarget.closest('.st-cell');
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    setResizingId(widget.id);
    const pickSize = (cols, rows) => {
      let target = cols === 2 && rows === 2 ? 'large' : rows === 2 ? 'large' : cols === 2 ? 'medium' : 'small';
      if (def.sizes.includes(target)) return target;
      // fall back to the closest allowed size
      const rank = { small: 1, medium: 2, large: 3 }[target];
      return [...def.sizes].sort((a, b) => Math.abs(rank - { small: 1, medium: 2, large: 3 }[a]) - Math.abs(rank - { small: 1, medium: 2, large: 3 }[b]))[0];
    };
    const onMove = (ev) => {
      const dw = ev.clientX - rect.left;
      const dh = ev.clientY - rect.top;
      const cols = dw > CELL + GAP * 0.5 + CELL * 0.45 ? 2 : 1;
      const rows = dh > CELL + GAP * 0.5 + CELL * 0.45 ? 2 : 1;
      resizeWidget(widget.id, pickSize(cols, rows));
    };
    const onUp = () => {
      setResizingId(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const addTab = () => {
    const newId = Math.max(...tabs.map((t) => t.id)) + 1;
    setTabs((prev) => [...prev, { id: newId, label: `Tab ${newId + 1}`, locked: false }]);
    setWidgets((prev) => ({ ...prev, [newId]: [] }));
    setActiveTab(tabs.length);
  };

  const removeTab = (idx) => {
    if (tabs.length <= 1) return;
    const tabId = tabs[idx].id;
    setTabs((prev) => prev.filter((_, i) => i !== idx));
    const newWidgets = { ...widgets };
    delete newWidgets[tabId];
    setWidgets(newWidgets);
    if (activeTab >= tabs.length - 1) setActiveTab(Math.max(0, tabs.length - 2));
    showToast('Tab removed');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflow: 'auto', maxWidth: '50%', scrollbarWidth: 'none' }}>
          {/* Dashboard tabs — scrollable, hover X to close */}
          {tabs.map((tab, i) => {
            const isActive = activeTab === i;
            return (
              <div key={tab.id} style={{ display: 'flex', alignItems: 'center', position: 'relative', flexShrink: 0 }}
              onContextMenu={(e) => {e.preventDefault();setTabCtx({ idx: i, x: e.clientX, y: e.clientY });}}>
                {renamingTab === i ?
                <input autoFocus defaultValue={tab.label} onBlur={(e) => {setTabs((prev) => prev.map((t, j) => j === i ? { ...t, label: e.target.value } : t));setRenamingTab(null);}} onKeyDown={(e) => {if (e.key === 'Enter') e.target.blur();}} style={{ width: 80, padding: '4px 8px', background: 'var(--card)', border: '1px solid var(--brand)', borderRadius: 4, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }} /> :

                <DashboardTab label={tab.label} isActive={isActive} onClick={() => setActiveTab(i)} onDoubleClick={() => setRenamingTab(i)} onClose={tabs.length > 1 ? () => removeTab(i) : null} />
                }
              </div>);

          })}
          <button onClick={addTab} style={{ padding: '4px 8px', background: 'none', border: '1px dashed var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', flexShrink: 0, marginLeft: 4 }}>+</button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {editMode &&
          <span style={{ fontSize: 10.5, color: 'var(--text-low)', marginRight: 4, letterSpacing: '0.02em' }}>Drag to reorder · drag corner to resize</span>}
          <button onClick={() => setEditMode(!editMode)} style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: editMode ? 'var(--brand)' : 'rgba(63,169,245,0.06)',
            border: editMode ? 'none' : '1px solid var(--border-strong)',
            color: editMode ? '#fff' : 'var(--brand)',
            cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{editMode ? '✓ Done Editing' : '✎ Edit Dashboard'}</button>
        </div>
      </div>

      {/* Widget Grid */}
      <div style={{ flex: 1, overflow: 'auto' }} data-comment-anchor="a209161057-div-181-7">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 178px)', gridAutoRows: '178px', gap: 16, gridAutoFlow: 'dense', justifyContent: 'start', paddingBottom: 40 }}>
          {currentWidgets.map((widget) => {
            const def = ST_REGISTRY[widget.type];
            if (!def) return null;
            const sp = ({ small: { c: 1, r: 1 }, medium: { c: 2, r: 1 }, large: { c: 2, r: 2 } })[widget.size] || { c: 1, r: 1 };
            const navTarget = WIDGET_NAV[widget.type];
            const detailFn = WIDGET_DETAIL[widget.type];
            const hasDrill = !!(navTarget || detailFn);
            const canResize = def.sizes.length > 1;
            return (
              <div key={widget.id}
                className={'st-cell' + (editMode ? ' editing' : '') + (dragId === widget.id ? ' st-dragging' : '') + (dragOverId === widget.id ? ' st-dragover' : '') + (resizingId === widget.id ? ' st-resizing' : '')}
                draggable={editMode && resizingId === null}
                onDragStart={(e) => { if (!editMode || resizingId) { e.preventDefault(); return; } setDragId(widget.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragEnter={() => { if (editMode && dragId && dragId !== widget.id) setDragOverId(widget.id); }}
                onDragOver={(e) => { if (editMode && dragId) e.preventDefault(); }}
                onDrop={(e) => { if (editMode && dragId) { e.preventDefault(); moveWidget(dragId, widget.id); setDragId(null); setDragOverId(null); } }}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                style={{ gridColumn: `span ${sp.c}`, gridRow: `span ${sp.r}`, position: 'relative' }}
                onClick={() => { if (editMode) return; if (navTarget && onNav) { onNav(navTarget); } else if (detailFn) { shieldModal(detailFn()); } }}>
                {def.render(widget.size)}
                {editMode &&
                <>
                    <button onClick={(e) => {e.stopPropagation();removeWidget(widget.id);}} title="Remove widget" style={{ position: 'absolute', top: -7, left: -7, width: 23, height: 23, borderRadius: '50%', background: 'var(--status-critical)', color: '#fff', border: '2px solid var(--canvas)', cursor: 'pointer', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7, fontWeight: 700 }}>−</button>
                    {canResize &&
                    <div className="st-resize-handle" title="Drag to resize" onPointerDown={(e) => startResize(e, widget)} onClick={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M10 1 L10 10 L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M10 5 L5 10 M10 8 L8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </div>}
                  </>
                }
                {!editMode && hasDrill &&
                <div className="st-open-hint" style={{ position: 'absolute', top: 11, right: 11, opacity: 0, transition: 'opacity 0.15s', color: 'var(--brand)', pointerEvents: 'none', zIndex: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3.5 8.5 L8.5 3.5 M4.5 3.5 H8.5 V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>}
              </div>);

          })}
          {editMode &&
          <button onClick={() => setWidgetGallery(true)} style={{ gridColumn: 'span 1', gridRow: 'span 1', borderRadius: 22, border: '2px dashed var(--border-strong)', background: 'rgba(63,169,245,0.03)', color: 'var(--text-low)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)' }}
          onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'var(--brand)';e.currentTarget.style.color = 'var(--brand)';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--border-strong)';e.currentTarget.style.color = 'var(--text-low)';}}>
              <span style={{ fontSize: 26 }}>+</span><span style={{ fontSize: 11 }}>Add</span>
            </button>
          }
          {/* Empty tab — always show add widget prompt */}
          {!editMode && currentWidgets.length === 0 &&
          <div onClick={() => {setEditMode(true);setWidgetGallery(true);}} style={{
            gridColumn: '1 / -1', minHeight: 200,
            border: '2px dashed var(--border-subtle)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8, cursor: 'pointer', color: 'var(--text-low)',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'var(--brand)';e.currentTarget.style.color = 'var(--brand)';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--border-subtle)';e.currentTarget.style.color = 'var(--text-low)';}}>
              <span style={{ fontSize: 32 }}>+</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Add your first widget</span>
              <span style={{ fontSize: 11 }}>Click to open the widget gallery</span>
            </div>
          }
        </div>
      </div>

      {/* Tab Context Menu */}
      {tabCtx && <TabContextMenu x={tabCtx.x} y={tabCtx.y} idx={tabCtx.idx} tabs={tabs} setTabs={setTabs} activeTab={activeTab} setActiveTab={setActiveTab} setRenamingTab={setRenamingTab} onClose={() => setTabCtx(null)} showToast={showToast} setDeleteConfirm={setDeleteConfirm} />}

      {/* Delete Tab Confirm */}
      {deleteConfirm !== null && <DeleteTabConfirm idx={deleteConfirm} tabs={tabs} onConfirm={() => {removeTab(deleteConfirm);setDeleteConfirm(null);}} onCancel={() => setDeleteConfirm(null)} />}

      {/* Widget Gallery (Apple-style) */}
      {widgetGallery && <WidgetGalleryPicker library={widgetLibrary} onAdd={addWidget} onClose={() => setWidgetGallery(false)} currentWidgets={currentWidgets} />}

      {/* Widget Library Drawer */}
      {widgetDrawer && <WidgetLibraryDrawer library={widgetLibrary} onAdd={addWidget} onClose={() => setWidgetDrawer(false)} currentWidgets={currentWidgets} />}

      {/* Preferences Drawer */}
      {prefsOpen && <PreferencesDrawer density={density} setDensity={setDensity} accent={accentIntensity} setAccent={setAccentIntensity} onClose={() => setPrefsOpen(false)} showToast={showToast} />}

      {/* Nav Customization Drawer */}
      {navCustomize && <NavCustomizeDrawer onClose={() => setNavCustomize(false)} showToast={showToast} />}

      {/* Sidecart */}
      {sidecart && <SidecartDrawer items={sidecartItems} setItems={setSidecartItems} onClose={() => setSidecart(false)} showToast={showToast} />}

      {/* Notification Center */}
      {notifCenter && <NotificationCenter onClose={() => setNotifCenter(false)} showToast={showToast} />}

      {/* Command Palette */}
      {cmdPalette && <CommandPalette onClose={() => setCmdPalette(false)} onNav={onNav} showToast={showToast} />}

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 24px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--glow-brand-sm)', animation: 'fade-up 0.3s ease both' }}>{toast}</div>}
    </div>);

}

/* ── Widget Menu Button ── */
function WidgetMenuBtn({ widget, onRemove, showToast }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--card)', border: '1px solid var(--border-subtle)', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋯</button>
      {open &&
      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 140, background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 6, zIndex: 100, padding: '4px 0', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {['Configure', 'Refresh', 'Resize', 'Set Time Range'].map((label, i) =>
        <button key={i} onClick={() => {showToast(`${label}: ${widget.label}`);setOpen(false);}} style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(63,169,245,0.06)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>{label}</button>
        )}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '3px 8px' }} />
          <button onClick={() => {onRemove();setOpen(false);}} style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', color: 'var(--status-critical)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.04)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>Remove</button>
        </div>
      }
    </div>);

}

/* ── Widget Renderer ── */
function WidgetRenderer({ type, label, editMode, density }) {
  const pad = density === 'compact' ? 12 : 18;
  const base = { padding: pad };

  if (type.startsWith('kpi-')) {
    const kpis = {
      'kpi-cash': { value: '$482,600', trend: '+$38K', dir: 'up' },
      'kpi-revenue': { value: '$284,600', trend: '+8.2%', dir: 'up' },
      'kpi-mrr': { value: '$171,200', trend: '+3.8%', dir: 'up' },
      'kpi-margin': { value: '28.4%', trend: 'Target: 25%', dir: 'up' }
    };
    const kpi = kpis[type] || { value: '—', trend: '' };
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
        <div className="mono" style={{ fontSize: 26, fontWeight: 600 }}>{kpi.value}</div>
        {kpi.trend && <span style={{ fontSize: 11, color: kpi.dir === 'up' ? 'var(--status-ok)' : 'var(--text-mid)' }}>{kpi.dir === 'up' ? '↑ ' : ''}{kpi.trend}</span>}
      </GlassPanel>);

  }
  if (type === 'ar-aging') {
    const buckets = [{ l: 'Current', v: 134 }, { l: '1-30', v: 22 }, { l: '31-60', v: 14 }, { l: '60+', v: 5 }];
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {buckets.map((b, i) =>
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>${b.v}K</div>
              <div style={{ height: Math.max(b.v / 134 * 60, 8), background: i === 0 ? 'var(--status-ok)' : i === 1 ? 'var(--status-warn)' : i === 2 ? 'var(--status-critical)' : '#c084fc', borderRadius: '3px 3px 0 0', opacity: 0.3 }} />
              <div style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 3 }}>{b.l}</div>
            </div>
          )}
        </div>
      </GlassPanel>);

  }
  if (type === 'pipeline') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ stage: 'Lead', n: 8, val: '$240K' }, { stage: 'Proposal', n: 4, val: '$180K' }, { stage: 'Negotiate', n: 2, val: '$128K' }, { stage: 'Closed', n: 6, val: '$420K' }].map((s, i) =>
          <div key={i} style={{ flex: 1, padding: 8, borderRadius: 6, background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>{s.stage}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{s.n}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-mid)' }}>{s.val}</div>
            </div>
          )}
        </div>
      </GlassPanel>);

  }
  if (type === 'device-health') {
    return (
      <GlassPanel style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="label-sm" style={{ marginBottom: 8, alignSelf: 'flex-start' }}>{label}</div>
        <HealthRing value={94} size={100} label="Fleet" />
      </GlassPanel>);

  }
  if (type === 'todays-jobs') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        {[{ job: 'Metro Bank — Install', tech: 'MR', status: 'In Progress' }, { job: 'Acme Dental — NVR', tech: 'JL', status: 'En Route' }, { job: 'City Hall — Access', tech: 'KW', status: 'In Progress' }].map((j, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11 }}>
            <StatusDot status={j.status === 'In Progress' ? 'online' : 'info'} size={5} />
            <span style={{ flex: 1, color: 'var(--text-mid)' }}>{j.job}</span>
            <span style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 10 }}>{j.tech}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'ai-insights') {
    return (
      <GlassPanel style={{ ...base, borderLeft: '3px solid var(--brand)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span>⟡</span><div className="label-sm">{label}</div>
        </div>
        {[
        'Acme Dental invoice is 38 days overdue — draft a reminder?',
        'Cash position strong: 4.2 months runway at current burn.',
        'Diana Patel is unassigned this afternoon — assign Bayshore Medical?'].
        map((insight, i) =>
        <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot status="info" size={4} />
            <span style={{ flex: 1 }}>{insight}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'activity') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        {[
        { time: '2:14 PM', text: 'Payment received — City Hall $22,100', icon: '$' },
        { time: '1:50 PM', text: 'Invoice INV-2865 sent — Marina Dental', icon: '▤' },
        { time: '12:30 PM', text: 'Mike Reyes checked in at Metro Bank', icon: '⌖' },
        { time: '11:00 AM', text: 'Proposal PROP-301 viewed by Pinnacle Financial', icon: '⊙' }].
        map((a, i) =>
        <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <span style={{ fontSize: 12 }}>{a.icon}</span>
            <span style={{ flex: 1, fontSize: 11, color: 'var(--text-mid)' }}>{a.text}</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{a.time}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'cashflow-forecast') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ p: '30 Days', net: '+$62K', color: 'var(--status-ok)' }, { p: '60 Days', net: '+$94K', color: 'var(--status-ok)' }, { p: '90 Days', net: '+$125K', color: 'var(--status-ok)' }].map((f, i) =>
          <div key={i} className="glass" style={{ flex: 1, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{f.p}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: f.color }}>{f.net}</div>
            </div>
          )}
        </div>
      </GlassPanel>);

  }
  if (type === 'profitability') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        {[{ l: 'Managed (RMR)', m: 68 }, { l: 'Alarm', m: 35 }, { l: 'CCTV', m: 32 }, { l: 'Access', m: 29 }, { l: 'Fire', m: 23 }].map((s, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <span style={{ fontSize: 11, color: 'var(--text-mid)', width: 100 }}>{s.l}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${s.m}%`, height: '100%', borderRadius: 2, background: s.m >= 30 ? 'var(--status-ok)' : s.m >= 25 ? 'var(--status-warn)' : 'var(--status-critical)' }} />
            </div>
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, width: 30, textAlign: 'right', color: s.m >= 30 ? 'var(--status-ok)' : s.m >= 25 ? 'var(--status-warn)' : 'var(--status-critical)' }}>{s.m}%</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'fleet-map') {
    return (
      <GlassPanel style={{ ...base, minHeight: 140, position: 'relative', overflow: 'hidden' }}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ position: 'absolute', inset: 40, background: 'rgba(63,169,245,0.02)', borderRadius: 6 }}>
          {[[30, 40], [55, 50], [42, 60], [65, 30]].map((pos, i) =>
          <div key={i} style={{ position: 'absolute', left: `${pos[0]}%`, top: `${pos[1]}%`, width: 20, height: 20, borderRadius: 5, background: 'var(--glass-bg)', border: '1px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--brand)' }}>
              {['MR', 'JL', 'KW', 'TG'][i]}
            </div>
          )}
        </div>
      </GlassPanel>);

  }
  if (type === 'open-tickets') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>7</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
          <span style={{ color: 'var(--status-critical)' }}>2 critical</span>
          <span style={{ color: 'var(--status-warn)' }}>3 high</span>
          <span style={{ color: 'var(--text-low)' }}>2 normal</span>
        </div>
      </GlassPanel>);

  }
  if (type === 'leaderboard') {
    return (
      <GlassPanel style={pad}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        {[{ n: 'Mike Reyes', jobs: 28, hours: 168, rating: 4.9 }, { n: 'Kevin White', jobs: 24, hours: 162, rating: 4.8 }, { n: 'Jessica Liu', jobs: 22, hours: 155, rating: 4.9 }].map((t, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--status-ok)' : i === 1 ? 'var(--brand)' : 'var(--text-mid)', width: 16 }}>#{i + 1}</span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-mid)' }}>{t.n}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.jobs} jobs</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{t.hours}h</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--status-ok)' }}>★ {t.rating}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'quick-actions') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[{ l: 'New Invoice', icon: '▤', c: 'var(--brand)' }, { l: 'New Proposal', icon: '▤', c: 'var(--status-ok)' }, { l: 'New Ticket', icon: '▣', c: 'var(--status-warn)' }, { l: 'New Customer', icon: '◯', c: '#c084fc' }].map((a, i) =>
          <div key={i} style={{ padding: '10px 8px', borderRadius: 6, background: `${a.c}08`, border: `1px solid ${a.c}20`, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = `${a.c}15`}
          onMouseLeave={(e) => e.currentTarget.style.background = `${a.c}08`}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 10, color: 'var(--text-mid)', fontWeight: 500 }}>{a.l}</div>
            </div>
          )}
        </div>
      </GlassPanel>);

  }
  if (type === 'weather') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 36 }}>☀️</div>
          <div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600 }}>72°F</div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Philadelphia, PA</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Sunny · H: 78° L: 62°</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {[{ d: 'Mon', t: '75°', i: '⛅' }, { d: 'Tue', t: '71°', i: '☁' }, { d: 'Wed', t: '68°', i: '☁' }, { d: 'Thu', t: '74°', i: '☀️' }, { d: 'Fri', t: '76°', i: '☀️' }].map((d, i) =>
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{d.d}</div>
              <div style={{ fontSize: 14, margin: '2px 0' }}>{d.i}</div>
              <div className="mono" style={{ fontSize: 10 }}>{d.t}</div>
            </div>
          )}
        </div>
      </GlassPanel>);

  }
  if (type === 'clock') {
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => {const t = setInterval(() => setTime(new Date()), 1000);return () => clearInterval(t);}, []);
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[{ city: 'Philadelphia', offset: 0 }, { city: 'London', offset: 5 }, { city: 'Tokyo', offset: 13 }].map((c, i) => {
            const d = new Date(time.getTime() + c.offset * 3600000);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{c.city}</span>
                <span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>);

          })}
        </div>
      </GlassPanel>);

  }
  if (type === 'team-status') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        {[{ n: 'John Mitchell', s: 'online', r: 'Admin' }, { n: 'Sarah Chen', s: 'online', r: 'Sales' }, { n: 'Mike Reyes', s: 'busy', r: 'Field' }, { n: 'Jessica Liu', s: 'busy', r: 'Field' }, { n: 'Kevin White', s: 'offline', r: 'Field' }].map((m, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <StatusDot status={m.s === 'online' ? 'online' : m.s === 'busy' ? 'warning' : 'offline'} size={6} />
            <span style={{ flex: 1, fontSize: 11, color: 'var(--text-mid)' }}>{m.n}</span>
            <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{m.r}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'quote-of-day') {
    return (
      <GlassPanel style={{ ...base, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 100 }}>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>"The best way to predict the future is to create it."</div>
        <div style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'right' }}>— Peter Drucker</div>
      </GlassPanel>);

  }
  if (type === 'countdown') {
    const daysLeft = 12;
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
        <div style={{ textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 36, fontWeight: 600, color: daysLeft < 7 ? 'var(--status-warn)' : 'var(--brand)' }}>{daysLeft}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>days until Metro Bank go-live</div>
        </div>
      </GlassPanel>);

  }
  if (type === 'revenue-goal') {
    const goal = 500000;const current = 384600;const pct = (current / goal * 100).toFixed(0);
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)' }}>${(current / 1000).toFixed(0)}K</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>/ ${(goal / 1000).toFixed(0)}K</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--brand), var(--status-ok))' }} />
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)', textAlign: 'right', marginTop: 4 }}>{pct}% of annual goal</div>
      </GlassPanel>);

  }
  if (type === 'customer-sat') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
        <div style={{ textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--status-ok)' }}>4.8</div>
          <div style={{ fontSize: 18, marginBottom: 4 }}>★★★★★</div>
          <div style={{ fontSize: 10, color: 'var(--text-low)' }}>142 reviews · Last 30 days</div>
        </div>
      </GlassPanel>);

  }
  if (type === 'inventory-alert') {
    return (
      <GlassPanel style={{ ...base, borderLeft: '3px solid var(--status-warn)' }}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
        {[{ n: 'Verkada CD52', s: 'Out of Stock', c: 'var(--status-critical)' }, { n: 'Axis Q6135-LE PTZ', s: '1 left', c: 'var(--status-warn)' }, { n: 'Mercury LP4502', s: '2 left', c: 'var(--status-warn)' }].map((a, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <StatusDot status={a.s.includes('Out') ? 'critical' : 'warning'} size={5} />
            <span style={{ flex: 1, fontSize: 11 }}>{a.n}</span>
            <span className="mono" style={{ fontSize: 9, color: a.c }}>{a.s}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'upcoming-renewals') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{label}</div>
        {[{ c: 'City Hall', d: 'Jun 15', v: '$3,200/mo' }, { c: 'Acme Dental', d: 'Jul 1', v: '$1,800/mo' }, { c: 'Westfield Mall', d: 'Jul 22', v: '$5,400/mo' }].map((r, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <span style={{ flex: 1, fontSize: 11, color: 'var(--text-mid)' }}>{r.c}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.d}</span>
            <span className="mono" style={{ fontSize: 10, fontWeight: 500, color: 'var(--brand)' }}>{r.v}</span>
          </div>
        )}
      </GlassPanel>);

  }
  if (type === 'notes') {
    return (
      <GlassPanel style={{ ...base, background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.15)' }}>
        <div className="label-sm" style={{ marginBottom: 6, color: 'var(--status-warn)' }}>⌖ {label}</div>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, minHeight: 60, outline: 'none', cursor: 'text' }}>
          Click to edit this note...
        </div>
      </GlassPanel>);

  }
  if (type === 'shortcuts') {
    return (
      <GlassPanel style={base}>
        <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
        {[{ k: '⌘K', d: 'Command palette' }, { k: '⌘N', d: 'New invoice' }, { k: '⌘F', d: 'Search' }, { k: 'ESC', d: 'Close modal' }].map((s, i) =>
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{s.d}</span>
            <span className="mono" style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-low)' }}>{s.k}</span>
          </div>
        )}
      </GlassPanel>);

  }

  if (type === 'hermes-chat') {
    return <ShieldAIChatWidget label={label} base={base} />;
  }

  // Fallback
  return (
    <GlassPanel style={{ ...base, textAlign: 'center', color: 'var(--text-low)', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 12 }}>{label}</span>
    </GlassPanel>);

}

/* ── Widget Library Drawer ── */
function WidgetLibraryDrawer({ library, onAdd, onClose, currentWidgets }) {
  const cats = [...new Set(library.map((w) => w.cat))];
  const currentTypes = currentWidgets.map((w) => w.type);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 340, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', padding: 20, overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Add Widget</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        {cats.map((cat) =>
        <div key={cat} style={{ marginBottom: 16 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {library.filter((w) => w.cat === cat).map((w) => {
              const already = currentTypes.includes(w.type);
              return (
                <button key={w.type} onClick={() => {if (!already) {onAdd(w.type);onClose();}}} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 6, background: already ? 'rgba(63,169,245,0.03)' : 'transparent',
                  border: '1px solid var(--border-subtle)', cursor: already ? 'default' : 'pointer',
                  opacity: already ? 0.5 : 1, fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%', color: 'var(--text-mid)', fontSize: 12
                }}>
                    {w.label}
                    {already ? <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Added</span> : <span style={{ color: 'var(--brand)', fontSize: 14 }}>+</span>}
                  </button>);

            })}
            </div>
          </div>
        )}
      </div>
    </div>);

}

/* ── Preferences Drawer ── */
function PreferencesDrawer({ density, setDensity, accent, setAccent, onClose, showToast }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 340, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', padding: 20, overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Preferences</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div className="label-sm" style={{ marginBottom: 8 }}>DENSITY</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['compact', 'comfortable'].map((d) =>
          <button key={d} onClick={() => setDensity(d)} style={{ flex: 1, padding: '8px', borderRadius: 6, background: density === d ? 'rgba(63,169,245,0.1)' : 'transparent', border: `1px solid ${density === d ? 'var(--brand)' : 'var(--border-subtle)'}`, color: density === d ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{d}</button>
          )}
        </div>
        <div className="label-sm" style={{ marginBottom: 8 }}>ACCENT INTENSITY</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['subtle', 'normal', 'vivid'].map((a) =>
          <button key={a} onClick={() => setAccent(a)} style={{ flex: 1, padding: '8px', borderRadius: 6, background: accent === a ? 'rgba(63,169,245,0.1)' : 'transparent', border: `1px solid ${accent === a ? 'var(--brand)' : 'var(--border-subtle)'}`, color: accent === a ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{a}</button>
          )}
        </div>
        <div className="label-sm" style={{ marginBottom: 8 }}>SAVED TABLE VIEWS</div>
        {['Invoice table — Overdue only, sorted by amount', 'CRM pipeline — Hot leads, last 30 days', 'Inventory — Low stock alert'].map((sv, i) =>
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{sv}</span>
            <button onClick={() => showToast('View loaded')} style={{ padding: '2px 8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--brand)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Load</button>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>DASHBOARD ADMIN</div>
          <button onClick={() => showToast('Dashboard reset to role default')} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 6 }}>Reset to Role Default</button>
          <button onClick={() => showToast('Saved as default for Owner role')} style={{ width: '100%', padding: '8px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save as Default for Role (Admin)</button>
        </div>
      </div>
    </div>);

}

/* ── Nav Customization Drawer ── */
function NavCustomizeDrawer({ onClose, showToast, inline }) {
  const [navItems, setNavItems] = React.useState([
  { id: 'dashboard', label: 'Mission Control', pinned: true, visible: true },
  { id: 'hermes', label: 'ShieldTech AI', pinned: true, visible: true },
  { id: 'crm', label: 'Pipeline / CRM', pinned: false, visible: true },
  { id: 'proposals', label: 'Proposal Builder', pinned: false, visible: true },
  { id: 'dispatch', label: 'Dispatch', pinned: false, visible: true },
  { id: 'finance', label: 'Finance', pinned: true, visible: true },
  { id: 'projects', label: 'Projects', pinned: false, visible: true },
  { id: 'assets', label: 'Asset Management', pinned: false, visible: true },
  { id: 'inventory', label: 'Inventory', pinned: false, visible: true },
  { id: 'reports', label: 'Reports', pinned: false, visible: true },
  { id: 'employees', label: 'Team', pinned: false, visible: true },
  { id: 'warroom', label: 'War Room', pinned: false, visible: false },
  { id: 'anomaly', label: 'Anomaly Detection', pinned: false, visible: false },
  { id: 'roi', label: 'ROI Calculator', pinned: false, visible: false }]
  );

  const togglePin = (id) => setNavItems((prev) => prev.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const toggleVisible = (id) => setNavItems((prev) => prev.map((n) => n.id === id ? { ...n, visible: !n.visible } : n));
  const moveItem = (idx, dir) => {
    setNavItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const navContent =
  <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Customize Navigation</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16, lineHeight: 1.5 }}>Right-click sidebar to open. Pin favorites, reorder, hide unused.</p>

        <div className="label-sm" style={{ marginBottom: 8 }}>PINNED (TOP)</div>
        {navItems.filter((n) => n.pinned).map((n, i) =>
    <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', marginBottom: 3, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.03)' }}>
            <span style={{ cursor: 'grab', color: 'var(--text-low)', fontSize: 10 }}>⠿</span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--brand)' }}>★ {n.label}</span>
            <button onClick={() => togglePin(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer' }}>Unpin</button>
          </div>
    )}

        <div className="label-sm" style={{ marginBottom: 8, marginTop: 14 }}>ALL MODULES</div>
        {navItems.map((n, i) =>
    <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 2, borderRadius: 6, border: '1px solid transparent', opacity: n.visible ? 1 : 0.4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button onClick={() => moveItem(i, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 7, cursor: 'pointer', padding: 0 }}>▲</button>
              <button onClick={() => moveItem(i, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 7, cursor: 'pointer', padding: 0 }}>▼</button>
            </div>
            <span style={{ flex: 1, fontSize: 12, color: n.visible ? 'var(--text-high)' : 'var(--text-low)' }}>{n.label}</span>
            <button onClick={() => togglePin(n.id)} style={{ padding: '2px 6px', background: n.pinned ? 'rgba(63,169,245,0.08)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: n.pinned ? 'var(--brand)' : 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{n.pinned ? '★' : '☆'}</button>
            <button onClick={() => toggleVisible(n.id)} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: n.visible ? 'var(--status-ok)' : 'var(--text-low)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{n.visible ? '⊙' : '—'}</button>
          </div>
    )}

        <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
          <button onClick={() => {onClose();showToast('Navigation saved');}} style={{ flex: 1, padding: '8px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
          <button onClick={() => showToast('Reset to role default')} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reset Default</button>
        </div>
    </>;


  if (inline) return <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>{navContent}</div>;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 340, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', padding: 20, overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
        {navContent}
      </div>
    </div>);

}

/* ── Sidecart (Builder/Cart Drawer) ── */
function SidecartDrawer({ items, setItems, onClose, showToast }) {
  const [expanded, setExpanded] = React.useState(false);
  const total = items.reduce((s, i) => s + i.qty * i.rate, 0);

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = () => setItems((prev) => [...prev, { desc: 'New Line Item', qty: 1, rate: 0 }]);

  const width = expanded ? '100vw' : 380;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width, maxWidth: '100vw',
        background: 'var(--card)', borderLeft: expanded ? 'none' : '1px solid var(--border-subtle)',
        padding: 20, overflow: 'auto', animation: 'fade-up 0.2s ease both',
        transition: 'width 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Builder Cart</div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Stage items for quotes, invoices, or proposals</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{expanded ? 'Collapse' : 'Expand'}</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {items.map((item, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{item.desc}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{item.qty} × ${item.rate.toLocaleString()}</div>
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>${(item.qty * item.rate).toLocaleString()}</span>
            <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--status-critical)', fontSize: 12, cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <button onClick={addItem} style={{ width: '100%', padding: '8px', marginTop: 8, background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 6, color: 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Line Item</button>

        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Subtotal</span>
          <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>${total.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
          <button onClick={() => {showToast('Added to quote');onClose();}} style={{ width: '100%', padding: '10px', background: 'var(--brand)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Add to Quote</button>
          <button onClick={() => {showToast('Invoice created');onClose();}} style={{ width: '100%', padding: '10px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Create Invoice</button>
          <button onClick={() => {showToast('Proposal started');onClose();}} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Start Proposal</button>
        </div>
      </div>
    </div>);

}

/* ── Notification Command Center ── */
function NotificationCenter({ onClose, showToast }) {
  const [prefTab, setPrefTab] = React.useState('all');
  const notifications = [
  { id: 1, type: 'payment', title: 'Payment received', body: 'City Hall — $22,100 via ACH', time: '2 min ago', read: false, channel: 'in-app' },
  { id: 2, type: 'geofence', title: 'Tech arrived on-site', body: 'Mike Reyes at Metro Bank', time: '5 min ago', read: false, channel: 'in-app' },
  { id: 3, type: 'proposal', title: 'Proposal viewed', body: 'Pinnacle Financial opened PROP-301 (4m 22s)', time: '18 min ago', read: false, channel: 'in-app' },
  { id: 4, type: 'overdue', title: 'Invoice overdue', body: 'INV-2847 — Acme Dental — 38 days', time: '1h ago', read: true, channel: 'in-app' },
  { id: 5, type: 'driving', title: 'Driving event', body: 'Tony Garcia — Speeding (42 in 25 zone)', time: '2h ago', read: true, channel: 'in-app' }];


  const typeIcons = { payment: '$', geofence: '⌖', proposal: '▤', overdue: '⚠', driving: '⬡' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 400, background: 'var(--card)', borderLeft: '1px solid var(--border-subtle)', overflow: 'auto', animation: 'fade-up 0.2s ease both' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Notifications</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => showToast('All marked as read')} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-low)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Mark all read</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['all', 'payments', 'geofence', 'proposals', 'overdue'].map((t) =>
          <button key={t} onClick={() => setPrefTab(t)} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, background: prefTab === t ? 'rgba(63,169,245,0.1)' : 'transparent', border: `1px solid ${prefTab === t ? 'var(--brand)' : 'transparent'}`, color: prefTab === t ? 'var(--brand)' : 'var(--text-low)', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{t}</button>
          )}
        </div>

        {/* Notifications list */}
        {notifications.filter((n) => prefTab === 'all' || n.type === prefTab || prefTab === 'payments' && n.type === 'payment' || prefTab === 'proposals' && n.type === 'proposal').map((n) =>
        <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(63,169,245,0.04)', background: n.read ? 'transparent' : 'rgba(63,169,245,0.02)', cursor: 'pointer' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(63,169,245,0.04)'}
        onMouseLeave={(e) => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(63,169,245,0.02)'}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcons[n.type]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--text-high)' }}>{n.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{n.body}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 4 }} />}
          </div>
        )}

        {/* Channel Preferences */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="label-sm" style={{ marginBottom: 10 }}>NOTIFICATION PREFERENCES</div>
          {[
          { event: 'Payment received', inApp: true, email: true, sms: false },
          { event: 'Tech on-site / departure', inApp: true, email: false, sms: true },
          { event: 'Proposal viewed / accepted', inApp: true, email: true, sms: true },
          { event: 'Invoice overdue', inApp: true, email: true, sms: false },
          { event: 'Driving safety event', inApp: true, email: false, sms: false },
          { event: 'Approval required', inApp: true, email: true, sms: false }].
          map((p, i) =>
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--text-mid)' }}>{p.event}</span>
              {['In-App', 'Email', 'SMS'].map((ch, j) => {
              const active = j === 0 ? p.inApp : j === 1 ? p.email : p.sms;
              return (
                <button key={ch} onClick={() => showToast(`${ch} ${active ? 'disabled' : 'enabled'} for ${p.event}`)} style={{
                  padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  background: active ? 'rgba(63,169,245,0.1)' : 'transparent',
                  border: `1px solid ${active ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  color: active ? 'var(--brand)' : 'var(--text-low)'
                }}>{ch}</button>);

            })}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)', padding: '6px 0' }}>
              <span>Quiet hours</span>
              <span className="mono" style={{ color: 'var(--text-low)' }}>10 PM – 7 AM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)', padding: '6px 0' }}>
              <span>Escalation</span>
              <span className="mono" style={{ color: 'var(--text-low)' }}>If no action in 30m → SMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

/* ── Command Palette (⌘K) ── */
function CommandPalette({ onClose, onNav, showToast }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);

  const allCommands = [
  { label: 'Go to Mission Control', cat: 'Navigation', action: () => {onNav?.('dashboard');onClose();} },
  { label: 'Go to Finance', cat: 'Navigation', action: () => {onNav?.('finance');onClose();} },
  { label: 'Go to Dispatch', cat: 'Navigation', action: () => {onNav?.('dispatch');onClose();} },
  { label: 'Go to Pipeline / CRM', cat: 'Navigation', action: () => {onNav?.('crm');onClose();} },
  { label: 'Go to Proposals', cat: 'Navigation', action: () => {onNav?.('proposals');onClose();} },
  { label: 'Go to Projects', cat: 'Navigation', action: () => {onNav?.('projects');onClose();} },
  { label: 'Go to Inventory', cat: 'Navigation', action: () => {onNav?.('inventory');onClose();} },
  { label: 'New Invoice', cat: 'Actions', action: () => {showToast('New Invoice modal');onClose();} },
  { label: 'New Proposal', cat: 'Actions', action: () => {onNav?.('proposals');onClose();} },
  { label: 'New Estimate', cat: 'Actions', action: () => {showToast('New Estimate');onClose();} },
  { label: 'New Customer', cat: 'Actions', action: () => {showToast('New Customer modal');onClose();} },
  { label: 'New Ticket', cat: 'Actions', action: () => {showToast('New Ticket created');onClose();} },
  { label: 'Record Payment', cat: 'Actions', action: () => {showToast('Record Payment');onClose();} },
  { label: 'Search Invoices...', cat: 'Search', action: () => {onNav?.('finance');onClose();} },
  { label: 'Search Customers...', cat: 'Search', action: () => {onNav?.('customer');onClose();} },
  { label: 'Search Proposals...', cat: 'Search', action: () => {onNav?.('proposals');onClose();} },
  { label: 'Ask ShieldTech AI: What\'s my cash position?', cat: 'AI', action: () => {onNav?.('hermes');onClose();} },
  { label: 'Ask ShieldTech AI: Who\'s overdue?', cat: 'AI', action: () => {onNav?.('hermes');onClose();} },
  { label: 'Ask ShieldTech AI: Profitability by service line?', cat: 'AI', action: () => {onNav?.('hermes');onClose();} }];


  const filtered = query ? allCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())) : allCommands;
  const grouped = {};
  filtered.forEach((c) => {if (!grouped[c.cat]) grouped[c.cat] = [];grouped[c.cat].push(c);});

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') setSelected((prev) => Math.min(prev + 1, filtered.length - 1));
    if (e.key === 'ArrowUp') setSelected((prev) => Math.max(prev - 1, 0));
    if (e.key === 'Enter' && filtered[selected]) filtered[selected].action();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxHeight: '60vh', background: 'var(--modal)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fade-up 0.15s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-low)', fontSize: 16 }}>⌕</span>
          <input autoFocus value={query} onChange={(e) => {setQuery(e.target.value);setSelected(0);}} onKeyDown={handleKeyDown} placeholder="Search commands, records, or ask ShieldTech AI..." style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-high)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: 4 }}>ESC</span>
        </div>
        <div style={{ maxHeight: 'calc(60vh - 52px)', overflow: 'auto', padding: '6px 0' }}>
          {Object.entries(grouped).map(([cat, cmds]) =>
          <div key={cat}>
              <div className="label-sm" style={{ padding: '8px 18px 4px' }}>{cat}</div>
              {cmds.map((cmd, i) => {
              const globalIdx = filtered.indexOf(cmd);
              return (
                <button key={i} onClick={cmd.action} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 18px',
                  background: selected === globalIdx ? 'rgba(63,169,245,0.08)' : 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-high)', fontSize: 13,
                  fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'background 0.1s'
                }}
                onMouseEnter={() => setSelected(globalIdx)}>
                    {selected === globalIdx && <span style={{ color: 'var(--brand)', fontSize: 10 }}>›</span>}
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    {cmd.cat === 'AI' && <span style={{ fontSize: 10, color: 'var(--brand)' }}>⟡</span>}
                  </button>);

            })}
            </div>
          )}
          {filtered.length === 0 &&
          <div style={{ padding: '20px 18px', textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
              No results — try a different search
            </div>
          }
        </div>
      </div>
    </div>);

}

/* ── Unified Customer Timeline ── */
function CustomerTimeline({ customer }) {
  const name = customer || 'City Hall';
  const events = [
  { date: 'Jun 5, 2026', time: '2:14 PM', type: 'payment', title: 'Payment received', detail: `$22,100 via ACH — INV-2854 marked paid`, icon: '$' },
  { date: 'Jun 4, 2026', time: '3:00 PM', type: 'job', title: 'Job completed', detail: 'Access control upgrade — Kevin White signed off', icon: '✓' },
  { date: 'Jun 3, 2026', time: '10:30 AM', type: 'invoice', title: 'Invoice sent', detail: 'INV-2854 — $22,100 — Access control upgrade', icon: '▤' },
  { date: 'Jun 1, 2026', time: '9:00 AM', type: 'proposal', title: 'Proposal accepted', detail: 'PROP-284 — Access control upgrade — e-signed', icon: '✍' },
  { date: 'May 28, 2026', time: '11:20 AM', type: 'proposal', title: 'Proposal viewed', detail: 'PROP-284 viewed for 3m 42s', icon: '⊙' },
  { date: 'May 25, 2026', time: '4:00 PM', type: 'proposal', title: 'Proposal sent', detail: 'PROP-284 — Access control upgrade — $22,100', icon: '↗' },
  { date: 'May 20, 2026', time: '2:00 PM', type: 'comm', title: 'Site survey scheduled', detail: 'Kevin White assigned — May 22', icon: '▦' },
  { date: 'May 15, 2026', time: '10:00 AM', type: 'deal', title: 'Deal created', detail: 'Access control upgrade — moved to Pipeline', icon: '◇' },
  { date: 'Apr 1, 2026', time: '—', type: 'payment', title: 'Subscription billed', detail: '$3,200 RMR — Standard Monitoring + Fire', icon: '◔' },
  { date: 'Mar 15, 2026', time: '—', type: 'ticket', title: 'Support ticket resolved', detail: 'TK-2201 — False alarm investigation — 42 min', icon: '▣' }];


  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>CH</div>
        <div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Unified Customer Timeline · All interactions</div>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 1, background: 'var(--border-subtle)' }} />

        {events.map((evt, i) =>
        <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
            {/* Dot */}
            <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: evt.type === 'payment' ? 'var(--status-ok)' : evt.type === 'proposal' ? 'var(--brand)' : evt.type === 'job' ? 'var(--status-ok)' : 'var(--text-low)', border: '2px solid var(--card)' }} />

            <GlassPanel style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{evt.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{evt.title}</span>
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{evt.date}{evt.time !== '—' ? ` · ${evt.time}` : ''}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>{evt.detail}</div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>);

}

/* ── Tab Context Menu ── */
function TabContextMenu({ x, y, idx, tabs, setTabs, activeTab, setActiveTab, setRenamingTab, onClose, showToast, setDeleteConfirm }) {
  const canDelete = tabs.length > 1;
  const moveTab = (dir) => {
    const target = idx + dir;
    if (target < 0 || target >= tabs.length) return;
    setTabs((prev) => {const n = [...prev];[n[idx], n[target]] = [n[target], n[idx]];return n;});
    if (activeTab === idx) setActiveTab(target);else
    if (activeTab === target) setActiveTab(idx);
    onClose();
  };
  const items = [
  { label: 'Rename', action: () => {setRenamingTab(idx);onClose();} },
  { label: 'Duplicate', action: () => {const t = tabs[idx];const newId = Math.max(...tabs.map((t) => t.id)) + 1;setTabs((prev) => [...prev.slice(0, idx + 1), { ...t, id: newId, label: t.label + ' (copy)' }, ...prev.slice(idx + 1)]);showToast('Tab duplicated');onClose();} },
  { divider: true },
  { label: 'Move left', action: () => moveTab(-1), disabled: idx === 0 },
  { label: 'Move right', action: () => moveTab(1), disabled: idx === tabs.length - 1 },
  { divider: true },
  { label: 'Set as default', action: () => {showToast(`"${tabs[idx].label}" set as default tab`);onClose();} },
  { label: 'Set as role default (admin)', action: () => {showToast(`"${tabs[idx].label}" saved as role default`);onClose();} },
  { divider: true },
  { label: 'Delete', action: () => {if (!canDelete) {showToast("Can't delete the last tab");} else {setDeleteConfirm(idx);}onClose();}, danger: true, disabled: !canDelete, tooltip: !canDelete ? "Can't delete the last remaining tab" : null }];


  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', left: x, top: y, zIndex: 9999, minWidth: 200, padding: '6px 0', borderRadius: 8, background: 'var(--modal)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', animation: 'fade-up 0.12s ease both' }}>
        {items.map((item, i) => {
          if (item.divider) return <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 8px' }} />;
          return (
            <button key={i} onClick={item.disabled ? undefined : item.action} title={item.tooltip || ''} style={{
              display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none',
              color: item.danger ? 'var(--status-critical)' : item.disabled ? 'var(--text-low)' : 'var(--text-high)',
              fontSize: 12, cursor: item.disabled ? 'default' : 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
              opacity: item.disabled ? 0.4 : 1
            }}
            onMouseEnter={(e) => {if (!item.disabled) e.currentTarget.style.background = 'rgba(63,169,245,0.06)';}}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>{item.label}</button>);

        })}
      </div>
    </div>);

}

/* ── Delete Tab Confirm ── */
function DeleteTabConfirm({ idx, tabs, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass" style={{ width: 380, padding: 24, animation: 'fade-up 0.2s ease both' }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Delete tab?</div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 16, lineHeight: 1.5 }}>
          Are you sure you want to delete <strong>"{tabs[idx]?.label}"</strong>? All widgets on this tab will be removed. This can't be undone.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 18px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, color: 'var(--status-critical)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete Tab</button>
        </div>
      </div>
    </div>);

}

/* ── Apple-Style Widget Gallery Picker ── */
function WidgetGalleryPicker({ library, onAdd, onClose, currentWidgets }) {
  const [search, setSearch] = React.useState('');
  const [selectedWidget, setSelectedWidget] = React.useState(null);
  const [selectedSize, setSelectedSize] = React.useState('medium');
  const [selectedStyle, setSelectedStyle] = React.useState(0);

  const currentTypes = currentWidgets.map((w) => w.type);
  const cats = [...new Set(library.map((w) => w.cat))];
  const filtered = search ? library.filter((w) => w.label.toLowerCase().includes(search.toLowerCase())) : library;

  const sizeOptions = { small: '1×1', medium: '2×1', large: '2×2' };
  const widgetSizes = Object.fromEntries((window.ST_ORDER || Object.keys(ST_REGISTRY)).map((t) => [t, ST_REGISTRY[t].sizes]));

  const widgetStyles = {};

  const sel = selectedWidget ? library.find((w) => w.type === selectedWidget) : null;
  const sizes = selectedWidget ? widgetSizes[selectedWidget] || ['small', 'medium'] : [];
  const styles = selectedWidget ? widgetStyles[selectedWidget] || ['Default'] : [];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 720, maxHeight: '80vh', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fade-up 0.2s ease both', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-comment-anchor="eefcc07a6b-div-1006-9">
          <div className="display" style={{ fontSize: 18, fontWeight: 400 }}>Widget Gallery</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search widgets..." style={{ padding: '5px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 180 }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Widget list */}
          <div style={{ width: 280, borderRight: '1px solid var(--border-subtle)', overflow: 'auto', padding: '12px 0' }}>
            {(search ? [{ cat: 'Results', items: filtered }] : cats.map((c) => ({ cat: c, items: library.filter((w) => w.cat === c) }))).map((group, gi) =>
            <div key={gi}>
                <div className="label-sm" style={{ padding: '8px 16px 4px' }}>{group.cat}</div>
                {(group.items || []).map((w) => {
                const already = currentTypes.includes(w.type);
                return (
                  <button key={w.type} onClick={() => {setSelectedWidget(w.type);setSelectedSize(widgetSizes[w.type]?.[1] || widgetSizes[w.type]?.[0] || 'medium');setSelectedStyle(0);}} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 16px',
                    background: selectedWidget === w.type ? 'rgba(63,169,245,0.08)' : 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
                    color: selectedWidget === w.type ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12
                  }}
                  onMouseEnter={(e) => {if (selectedWidget !== w.type) e.currentTarget.style.background = 'rgba(63,169,245,0.03)';}}
                  onMouseLeave={(e) => {if (selectedWidget !== w.type) e.currentTarget.style.background = 'none';}}>
                      <span style={{ flex: 1 }}>{w.label}</span>
                      {already && <span style={{ fontSize: 9, color: 'var(--text-low)', padding: '1px 6px', borderRadius: 3, background: 'rgba(63,169,245,0.06)' }}>Added</span>}
                    </button>);

              })}
              </div>
            )}
          </div>

          {/* Right: Preview + Size/Style picker */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {sel ?
            <div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{sel.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 16 }}>{sel.cat} widget</div>

                {/* Size picker */}
                <div className="label-sm" style={{ marginBottom: 8 }}>SIZE</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {sizes.map((s) =>
                <button key={s} onClick={() => setSelectedSize(s)} style={{
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  background: selectedSize === s ? 'rgba(63,169,245,0.12)' : 'var(--glass-bg)',
                  border: `1.5px solid ${selectedSize === s ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  color: selectedSize === s ? 'var(--brand)' : 'var(--text-mid)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                }}>
                      {/* Size visual */}
                      <div style={{ display: 'grid', gridTemplateColumns: s === 'small' ? '1fr' : s === 'wide' ? '1fr 1fr 1fr' : '1fr 1fr', gridTemplateRows: s === 'large' ? '1fr 1fr' : '1fr', gap: 2, width: s === 'wide' ? 42 : s === 'small' ? 14 : 28, height: s === 'large' ? 28 : 14 }}>
                        <div style={{ gridColumn: '1/-1', gridRow: '1/-1', borderRadius: 2, background: selectedSize === s ? 'var(--brand)' : 'var(--text-low)', opacity: 0.4 }} />
                      </div>
                      <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{s}</span>
                      <span className="mono" style={{ fontSize: 8, color: 'var(--text-low)' }}>{sizeOptions[s]}</span>
                    </button>
                )}
                </div>

                {/* Style variants */}
                {styles.length > 1 &&
              <>
                    <div className="label-sm" style={{ marginBottom: 8 }}>DISPLAY STYLE</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                      {styles.map((st, si) =>
                  <button key={si} onClick={() => setSelectedStyle(si)} style={{
                    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    background: selectedStyle === si ? 'rgba(63,169,245,0.12)' : 'transparent',
                    border: `1px solid ${selectedStyle === si ? 'var(--brand)' : 'var(--border-subtle)'}`,
                    color: selectedStyle === si ? 'var(--brand)' : 'var(--text-mid)',
                    fontSize: 11
                  }}>{st}</button>
                  )}
                    </div>
                  </>
              }

                {/* Preview */}
                <div className="label-sm" style={{ marginBottom: 8 }}>PREVIEW</div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0', minHeight: selectedSize === 'large' ? 380 : selectedSize === 'small' ? 190 : 190, transition: 'all 0.3s ease' }}>
                  {ST_REGISTRY[sel.type].render(selectedSize)}
                </div>

                {/* Add button */}
                <button onClick={() => {onAdd(sel.type, selectedSize);onClose();}} style={{
                width: '100%', marginTop: 16, padding: '10px', background: 'var(--brand)', border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>Add {sel.label} ({sizeOptions[selectedSize]})</button>
              </div> :

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-low)', fontSize: 13 }}>
                Select a widget to preview sizes and styles
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}

/* ── Dashboard Tab Component (hover X to close, scrollable) ── */
function DashboardTab({ label, isActive, onClick, onDoubleClick, onClose }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button onClick={onClick} onDoubleClick={onDoubleClick}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    style={{
      padding: '5px 6px 5px 10px',
      borderRadius: '6px 6px 0 0', fontSize: 11, fontWeight: isActive ? 600 : 400,
      background: isActive ? 'rgba(63,169,245,0.1)' : 'transparent',
      border: 'none', borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
      color: isActive ? 'var(--brand)' : 'var(--text-mid)',
      cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 2,
      whiteSpace: 'nowrap', transition: 'all 0.15s'
    }}>
      {label}
      {/* Always reserve space for X so width doesn't shift */}
      {onClose ?
      <span onClick={(e) => {e.stopPropagation();onClose();}}
      style={{ width: 16, height: 16, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: hovered ? 'var(--text-low)' : 'transparent', cursor: 'pointer', marginLeft: 2, background: hovered ? 'rgba(92,111,134,0.15)' : 'transparent', transition: 'all 0.15s', pointerEvents: hovered ? 'auto' : 'none' }}
      onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(244,63,94,0.15)';e.currentTarget.style.color = 'var(--status-critical)';}}
      onMouseLeave={(e) => {e.currentTarget.style.background = hovered ? 'rgba(92,111,134,0.15)' : 'transparent';e.currentTarget.style.color = hovered ? 'var(--text-low)' : 'transparent';}}>✕</span> :
      <span style={{ width: 16 }}></span>}
    </button>);

}

/* ── ShieldTech AI Chat Widget ── */
function ShieldAIChatWidget({ label, base }) {
  const [messages, setMessages] = React.useState([
  { role: 'ai', text: 'Hey! I\'m ShieldTech AI, your AI assistant. Ask me anything about your business — finances, dispatch, customers, reports.' }]
  );
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const aiResponses = {
    'cash': 'Your cash position is $482,600 — up $38K this month. You have 4.2 months runway at current burn rate. Looking strong.',
    'overdue': 'You have 3 overdue invoices totaling $18,400. The oldest is Acme Dental at 38 days. Want me to draft reminder emails?',
    'revenue': 'MTD revenue is $284,600 (↑8.2% vs last month). RMR is $171,200. Gross margin sitting at 28.4%, above your 25% target.',
    'dispatch': 'You have 4 techs active today. Diana Patel is unassigned this afternoon — Bayshore Medical has a critical SLA. Want me to assign her?',
    'pipeline': 'Your pipeline has $548K across 14 deals. 2 proposals are pending signature worth $128K. Pinnacle Financial viewed theirs 4 times yesterday.',
    'profitability': 'Managed services (RMR) has the best margin at 68%. CCTV installs run 32%, Access Control at 29%. Fire is underperforming at 23% — might be worth reviewing pricing.',
    'techs': 'Mike Reyes leads with 28 jobs this month (4.9★). Kevin White: 24 jobs. Jessica Liu: 22 jobs. Tony Garcia had a speeding event today — 42 in a 25 zone.',
    default: 'I can help with cash position, revenue, overdue invoices, dispatch status, pipeline, profitability by service, and tech performance. What would you like to know?'
  };

  const getResponse = (q) => {
    const lower = q.toLowerCase();
    if (lower.includes('cash') || lower.includes('money') || lower.includes('bank')) return aiResponses.cash;
    if (lower.includes('overdue') || lower.includes('late') || lower.includes('unpaid')) return aiResponses.overdue;
    if (lower.includes('revenue') || lower.includes('sales') || lower.includes('income') || lower.includes('mrr')) return aiResponses.revenue;
    if (lower.includes('dispatch') || lower.includes('tech') && lower.includes('where')) return aiResponses.dispatch;
    if (lower.includes('pipeline') || lower.includes('deal') || lower.includes('proposal')) return aiResponses.pipeline;
    if (lower.includes('profit') || lower.includes('margin')) return aiResponses.profitability;
    if (lower.includes('tech') || lower.includes('leaderboard') || lower.includes('performance')) return aiResponses.techs;
    return aiResponses.default;
  };

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: getResponse(q) }]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  const quickPrompts = ['Cash position?', 'Who\'s overdue?', 'Pipeline status', 'Profitability'];

  return (
    <GlassPanel style={{ ...base, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>⟡</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)' }}>{label || 'ShieldTech AI Chat'}</span>
        <StatusDot status="online" size={5} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200 }}>
        {messages.map((m, i) =>
        <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
            maxWidth: '85%', padding: '8px 11px', borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
            background: m.role === 'user' ? 'var(--brand)' : 'rgba(63,169,245,0.06)',
            border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
            color: m.role === 'user' ? '#fff' : 'var(--text-mid)', fontSize: 11, lineHeight: 1.5
          }}>
              {m.text}
            </div>
          </div>
        )}
        {typing &&
        <div style={{ display: 'flex', gap: 4, padding: '8px 11px', width: 'fit-content', borderRadius: '10px 10px 10px 2px', background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)' }}>
            {[0, 1, 2].map((d) => <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)', opacity: 0.4, animation: `pulse-online 1s ease-in-out ${d * 0.2}s infinite` }} />)}
          </div>
        }
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 &&
      <div style={{ display: 'flex', gap: 4, padding: '0 12px 6px', flexWrap: 'wrap' }}>
          {quickPrompts.map((p, i) =>
        <button key={i} onClick={() => {setInput(p);setTimeout(() => {setMessages((prev) => [...prev, { role: 'user', text: p }]);setTyping(true);setTimeout(() => {setMessages((prev) => [...prev, { role: 'ai', text: getResponse(p) }]);setTyping(false);}, 800);}, 50);}}
        style={{ padding: '3px 8px', borderRadius: 100, fontSize: 9, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{p}</button>
        )}
        </div>
      }

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter') send();}}
        placeholder="Ask ShieldTech AI anything..."
        style={{ flex: 1, padding: '7px 10px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={send} style={{ padding: '7px 12px', background: input.trim() ? 'var(--brand)' : 'rgba(63,169,245,0.06)', border: 'none', borderRadius: 6, color: input.trim() ? '#fff' : 'var(--text-low)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, transition: 'all 0.15s' }}>Send</button>
      </div>
    </GlassPanel>);

}

/* ── Widget Size Preview — Apple-style distinct layouts per size ── */
function WidgetSizePreview({ type, label, size, styleIdx, styles }) {
  const styleName = styles[styleIdx] || 'Default';

  // Color helpers per widget type
  const typeColors = {
    'kpi-cash': 'var(--status-ok)', 'kpi-revenue': 'var(--brand)', 'kpi-mrr': '#a78bfa', 'kpi-margin': '#fbbf24',
    'ar-aging': 'var(--status-warn)', 'pipeline': 'var(--brand)', 'device-health': 'var(--status-ok)',
    'todays-jobs': 'var(--brand)', 'ai-insights': 'var(--brand)', 'activity': 'var(--text-mid)',
    'cashflow-forecast': 'var(--status-ok)', 'profitability': 'var(--brand)', 'fleet-map': 'var(--brand)',
    'open-tickets': 'var(--status-critical)', 'leaderboard': 'var(--status-ok)', 'hermes-chat': 'var(--brand)',
    'revenue-goal': 'var(--brand)', 'weather': '#fbbf24', 'clock': 'var(--text-mid)'
  };
  const accent = typeColors[type] || 'var(--brand)';

  /* ── Small (1×1) — Compact number + icon, Apple-style glanceable ── */
  if (size === 'small') {
    if (type.startsWith('kpi-')) {
      const vals = { 'kpi-cash': '$482.6K', 'kpi-revenue': '$284.6K', 'kpi-mrr': '$171.2K', 'kpi-margin': '28.4%' };
      const trends = { 'kpi-cash': '+$38K', 'kpi-revenue': '+8.2%', 'kpi-mrr': '+3.8%', 'kpi-margin': '↑ 3.4pp' };
      const icons = { 'kpi-cash': '◎', 'kpi-revenue': '◈', 'kpi-mrr': '◉', 'kpi-margin': '◇' };
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)', fontWeight: 500 }}>{label}</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: accent }}>{icons[type] || '◎'}</div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1 }}>{vals[type] || '—'}</div>
            <div style={{ fontSize: 11, color: accent, marginTop: 4, fontWeight: 500 }}>{trends[type] || ''}</div>
          </div>
        </div>);

    }
    if (type === 'device-health') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8, alignSelf: 'flex-start' }}>{label}</div>
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke="rgba(63,169,245,0.08)" strokeWidth="6" /><circle cx="36" cy="36" r="30" fill="none" stroke={accent} strokeWidth="6" strokeDasharray={`${0.94 * 188.5} ${188.5}`} strokeLinecap="round" transform="rotate(-90 36 36)" /></svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="mono" style={{ fontSize: 18, fontWeight: 700, color: accent }}>94%</span></div>
          </div>
        </div>);

    }
    if (type === 'open-tickets') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)', fontWeight: 500 }}>{label}</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-critical)', fontSize: 12, fontWeight: 700 }}>!</div>
          </div>
          <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-high)' }}>7</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(244,63,94,0.08)', color: 'var(--status-critical)' }}>2 critical</span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.08)', color: 'var(--status-warn)' }}>3 high</span>
          </div>
        </div>);

    }
    // Generic small
    return (
      <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 140 }} data-comment-anchor="55640f5966-div-1494-7">
        <div style={{ width: 32, height: 32, borderRadius: 10, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 16, color: accent }}>⟡</div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', textAlign: 'center' }}>{label}</div>
      </div>);

  }

  /* ── Medium (2×1) — Card with chart/detail, Apple-style horizontal ── */
  if (size === 'medium') {
    if (type.startsWith('kpi-')) {
      const vals = { 'kpi-cash': '$482,600', 'kpi-revenue': '$284,600', 'kpi-mrr': '$171,200', 'kpi-margin': '28.4%' };
      const trends = { 'kpi-cash': '+$38K this month', 'kpi-revenue': '+8.2% vs last month', 'kpi-mrr': '+3.8% MoM', 'kpi-margin': 'Above 25% target' };
      // Sparkline points
      const sparkPoints = '0,12 8,10 16,8 24,11 32,6 40,9 48,4 56,7 64,3 72,5 80,2';
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 14, alignItems: 'center', minHeight: 100 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 4 }}>{label}</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-high)', marginBottom: 2 }}>{vals[type]}</div>
            <div style={{ fontSize: 11, color: accent }}>{trends[type]}</div>
          </div>
          <svg width="84" height="32" viewBox="0 0 84 16" style={{ flexShrink: 0 }}>
            <defs><linearGradient id={`sp-${type}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.3" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
            <polyline points={sparkPoints} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={`0,16 ${sparkPoints} 80,16`} fill={`url(#sp-${type})`} />
          </svg>
        </div>);

    }
    if (type === 'ar-aging' || type === 'profitability') {
      const bars = type === 'ar-aging' ?
      [{ l: 'Current', v: 0.76, c: 'var(--status-ok)' }, { l: '1-30', v: 0.40, c: 'var(--status-warn)' }, { l: '31-60', v: 0.22, c: 'var(--status-critical)' }, { l: '60+', v: 0.10, c: '#c084fc' }] :
      [{ l: 'RMR', v: 0.68, c: 'var(--status-ok)' }, { l: 'Alarm', v: 0.35, c: 'var(--brand)' }, { l: 'CCTV', v: 0.32, c: 'var(--brand)' }, { l: 'Access', v: 0.29, c: 'var(--status-warn)' }];
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', minHeight: 100 }}>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 10 }}>{label}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 50 }}>
            {bars.map((b, i) =>
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 50, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${b.v * 100}%`, background: b.c, borderRadius: '3px 3px 0 0', opacity: 0.7, transition: 'height 0.3s ease' }} />
                </div>
                <span style={{ fontSize: 7, color: 'var(--text-low)' }}>{b.l}</span>
              </div>
            )}
          </div>
        </div>);

    }
    if (type === 'pipeline') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', minHeight: 100 }}>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 10 }}>{label}</div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[{ s: 'Lead', n: 8, w: 30 }, { s: 'Proposal', n: 4, w: 24 }, { s: 'Negotiate', n: 2, w: 18 }, { s: 'Closed', n: 6, w: 28 }].map((s, i) =>
            <div key={i} style={{ width: `${s.w}%`, padding: '8px 4px', background: `rgba(63,169,245,${0.06 + i * 0.04})`, borderRadius: i === 0 ? '6px 0 0 6px' : i === 3 ? '0 6px 6px 0' : 0, textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{s.n}</div>
                <div style={{ fontSize: 7, color: 'var(--text-low)' }}>{s.s}</div>
              </div>
            )}
          </div>
        </div>);

    }
    // Generic medium — use existing renderer
    return <WidgetRenderer type={type} label={label} editMode={false} density="comfortable" />;
  }

  /* ── Large (2×2) — Rich detailed view with charts and lists ── */
  if (size === 'large') {
    if (type === 'todays-jobs') {
      const jobs = [
      { job: 'Metro Bank — Camera Install', tech: 'MR', time: '7:00 AM', status: 'In Progress', pct: 65 },
      { job: 'Acme Dental — NVR Swap', tech: 'JL', time: '9:30 AM', status: 'En Route', pct: 0 },
      { job: 'City Hall — Access Panel', tech: 'KW', time: '7:00 AM', status: 'In Progress', pct: 80 },
      { job: 'Harbor View — Camera Add', tech: 'TG', time: '11:00 AM', status: 'Scheduled', pct: 0 }];

      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', minHeight: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{label}</div>
            <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>{jobs.length}</span>
          </div>
          {jobs.map((j, i) =>
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: j.status === 'In Progress' ? 'rgba(52,211,153,0.1)' : j.status === 'En Route' ? 'rgba(63,169,245,0.1)' : 'rgba(92,111,134,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: j.status === 'In Progress' ? 'var(--status-ok)' : 'var(--brand)', flexShrink: 0 }}>{j.tech}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-high)' }}>{j.job}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)' }}>{j.time} · {j.status}</div>
              </div>
              {j.pct > 0 && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(63,169,245,0.08)', overflow: 'hidden' }}><div style={{ width: `${j.pct}%`, height: '100%', borderRadius: 2, background: 'var(--status-ok)' }} /></div>}
            </div>
          )}
        </div>);

    }
    if (type === 'ai-insights') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--brand)', minHeight: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>⟡</span><div style={{ fontSize: 11, color: 'var(--text-low)' }}>{label}</div>
          </div>
          {[
          { text: 'Cash runway is 4.2 months at current burn — above safety threshold.', type: 'info' },
          { text: 'Acme Dental invoice 38 days overdue ($4,200). Draft reminder?', type: 'warn' },
          { text: 'Diana Patel unassigned today. Bayshore Medical has critical SLA.', type: 'action' },
          { text: 'Pinnacle Financial viewed proposal PROP-301 four times yesterday.', type: 'hot' },
          { text: 'Tony Garcia speeding event: 42 in 25 zone. Review driving score?', type: 'warn' }].
          map((ins, i) =>
          <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: ins.type === 'warn' ? 'var(--status-warn)' : ins.type === 'action' ? 'var(--status-critical)' : ins.type === 'hot' ? 'var(--status-ok)' : 'var(--brand)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>{ins.text}</span>
            </div>
          )}
        </div>);

    }
    if (type === 'activity') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', minHeight: 220 }}>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 10 }}>{label}</div>
          {[
          { time: '2:14 PM', text: 'Payment $22,100 — City Hall', icon: '$', ago: '2m' },
          { time: '1:50 PM', text: 'INV-2865 sent — Marina Dental', icon: '▤', ago: '26m' },
          { time: '12:30 PM', text: 'Mike Reyes checked in at Metro Bank', icon: '⌖', ago: '1h' },
          { time: '11:00 AM', text: 'PROP-301 viewed by Pinnacle', icon: '⊙', ago: '3h' },
          { time: '10:20 AM', text: 'New ticket TK-2210 — Harbor View', icon: '▣', ago: '4h' },
          { time: '9:00 AM', text: 'Jessica Liu clocked in', icon: '◔', ago: '5h' }].
          map((a, i) =>
          <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.04)', alignItems: 'center' }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--text-mid)' }}>{a.text}</span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)', flexShrink: 0 }}>{a.ago}</span>
            </div>
          )}
        </div>);

    }
    if (type === 'cashflow-forecast') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', minHeight: 220 }}>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 12 }}>{label}</div>
          {/* Area chart mock */}
          <svg width="100%" height="100" viewBox="0 0 300 80" style={{ marginBottom: 10 }}>
            <defs><linearGradient id="cf-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--status-ok)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--status-ok)" stopOpacity="0" /></linearGradient></defs>
            <polyline points="0,60 30,55 60,48 90,52 120,40 150,38 180,30 210,32 240,22 270,18 300,15" fill="none" stroke="var(--status-ok)" strokeWidth="2" strokeLinecap="round" />
            <polygon points="0,80 0,60 30,55 60,48 90,52 120,40 150,38 180,30 210,32 240,22 270,18 300,15 300,80" fill="url(#cf-grad)" />
          </svg>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ p: '30 Days', v: '+$62K' }, { p: '60 Days', v: '+$94K' }, { p: '90 Days', v: '+$125K' }].map((f, i) =>
            <div key={i} style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--status-ok)' }}>{f.v}</div>
                <div style={{ fontSize: 8, color: 'var(--text-low)' }}>{f.p}</div>
              </div>
            )}
          </div>
        </div>);

    }
    // Generic large — double-height existing widget
    return (
      <div style={{ minHeight: 220 }}>
        <WidgetRenderer type={type} label={label} editMode={false} density="comfortable" />
      </div>);

  }

  /* ── Wide (3×1) — Full-width panoramic ── */
  if (size === 'wide') {
    if (type === 'revenue-chart' || type === 'custom-report') {
      return (
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', minHeight: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{label}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1W', '1M', '3M', 'YTD'].map((p) =>
              <span key={p} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 8, background: p === 'YTD' ? 'rgba(63,169,245,0.12)' : 'transparent', color: p === 'YTD' ? 'var(--brand)' : 'var(--text-low)', border: '1px solid transparent' }}>{p}</span>
              )}
            </div>
          </div>
          <svg width="100%" height="50" viewBox="0 0 400 40" style={{ display: 'block' }}>
            <defs><linearGradient id="rv-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity="0.15" /><stop offset="100%" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
            <polyline points="0,35 20,32 40,28 60,30 80,24 100,26 120,20 140,22 160,18 180,20 200,14 220,16 240,12 260,10 280,12 300,8 320,10 340,6 360,8 380,4 400,6" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="0,40 0,35 20,32 40,28 60,30 80,24 100,26 120,20 140,22 160,18 180,20 200,14 220,16 240,12 260,10 280,12 300,8 320,10 340,6 360,8 380,4 400,6 400,40" fill="url(#rv-g)" />
          </svg>
        </div>);

    }
    return <WidgetRenderer type={type} label={label} editMode={false} density="comfortable" />;
  }

  // Fallback to normal renderer
  return <WidgetRenderer type={type} label={label} editMode={false} density="comfortable" />;
}

Object.assign(window, {
  CustomDashboard, WidgetMenuBtn, WidgetRenderer, WidgetSizePreview, WidgetLibraryDrawer, ShieldAIChatWidget,
  PreferencesDrawer, NavCustomizeDrawer, SidecartDrawer, NotificationCenter,
  CommandPalette, CustomerTimeline, TabContextMenu, DeleteTabConfirm, WidgetGalleryPicker,
  DashboardTab
});
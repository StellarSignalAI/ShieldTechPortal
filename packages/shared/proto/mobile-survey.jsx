/* ShieldTech Mobile — Site Survey Report Builder (real, persistent → surveyStore)
   Capture site → AI-detect devices → edit BOM → price → save report → convert to proposal. */

const SV_STEPS = ['Reading floor plan geometry…', 'Detecting entry points & door hardware…', 'Placing camera coverage zones…', 'Matching devices against Price Book…', 'Estimating labor from Skills Matrix…', 'Building report draft…'];
const SV_DETECT_SEED = [];
const svInput = { width: '100%', padding: '10px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
const svLabel = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-low)', marginBottom: 5, display: 'block' };

/* ════════════ SURVEY LIST ════════════ */
function MSurvey({ onNav }) {
  const [surveys] = useShieldStore(surveyStore);
  const [buildId, setBuildId] = React.useState(null);
  if (buildId) return <MSurveyBuilder id={buildId === 'new' ? null : buildId} onClose={() => setBuildId(null)} onNav={onNav} />;
  const drafts = surveys.filter(s => s.status === 'draft').length;
  const pipeline = surveys.reduce((a, s) => a + surveyTotals(s).price, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OpsKpis items={[['SURVEYS', surveys.length, 'var(--brand)'], ['DRAFTS', drafts, drafts ? 'var(--status-warn)' : 'var(--status-ok)'], ['EST. VALUE', `$${(pipeline / 1000).toFixed(0)}K`, 'var(--status-ok)']]} />
      <button onClick={() => setBuildId('new')} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Site Survey</button>
      <button onClick={() => onNav && onNav('sitescan')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'linear-gradient(120deg, rgba(63,169,245,0.08), rgba(192,132,252,0.07))', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(63,169,245,0.14)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--brand)', flexShrink: 0 }}>◉</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>SiteScan 3D capture <span style={{ fontSize: 8, fontWeight: 700, color: '#c084fc', border: '1px solid rgba(192,132,252,0.4)', borderRadius: 4, padding: '1px 5px', marginLeft: 4, verticalAlign: 'middle' }}>NEW</span></span>
          <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-low)' }}>Scan rooms → blueprint → AR → feeds this estimator</span>
        </span>
        <span style={{ color: 'var(--text-low)', fontSize: 14 }}>›</span>
      </button>
      {surveys.map(s => {
        const t = surveyTotals(s);
        return (
          <div key={s.id} onClick={() => setBuildId(s.id)} className="glass" style={{ padding: '12px 13px', borderRadius: 12, cursor: 'pointer', borderLeft: '3px solid var(--brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{s.id}</span>
              <MBadge color={s.status === 'draft' ? 'var(--status-warn)' : 'var(--status-ok)'}>{s.status}</MBadge>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--status-ok)' }}>${(t.price / 1000).toFixed(1)}K</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{s.customer}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{s.site} · {s.date} · {s.bom.length} BOM lines · {s.detected.length} detections</div>
          </div>
        );
      })}
      {surveys.length === 0 && <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>No surveys yet — tap <strong>+ New Site Survey</strong> to start.</div>}
    </div>
  );
}

/* ════════════ SURVEY BUILDER ════════════ */
function MSurveyBuilder({ id, onClose, onNav }) {
  const [allCusts] = useShieldStore(customerStore);
  const [store] = useShieldStore(surveyStore);
  const existing = id ? store.find(s => s.id === id) : null;
  const [draft, setDraft] = React.useState(() => existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: 'SR-' + (Math.floor(Math.random() * 9000) + 1000), customer: '', site: '', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'draft', margin: 35, notes: '', detected: [], bom: [] });
  const [stage, setStage] = React.useState(existing && existing.bom.length ? 'edit' : 'input'); // input | analyzing | edit
  const [stepIdx, setStepIdx] = React.useState(0);

  React.useEffect(() => {
    if (stage !== 'analyzing') return;
    if (stepIdx >= SV_STEPS.length) {
      setDraft(d => ({ ...d, detected: SV_DETECT_SEED.map(x => ({ ...x })), bom: SURVEY_BOM_SEED.map(x => ({ ...x })) }));
      setStage('edit');
      return;
    }
    const t = setTimeout(() => setStepIdx(i => i + 1), 480);
    return () => clearTimeout(t);
  }, [stage, stepIdx]);

  const t = surveyTotals(draft);
  const setQty = (sku, qty) => setDraft(d => ({ ...d, bom: d.bom.map(b => b.sku === sku ? { ...b, qty: Math.max(0, qty) } : b) }));

  const save = () => {
    if (!draft.customer.trim()) { showToast('Add a customer / site first', 'warn'); return; }
    surveyStore.set(list => existing ? list.map(s => s.id === draft.id ? draft : s) : [draft, ...list]);
    showToast(`${draft.id} saved — synced to portal`, 'ok');
    onClose();
  };
  const toProposal = () => {
    const items = draft.bom.filter(b => b.qty > 0).map(b => ({ desc: b.desc, qty: b.qty, rate: b.unit }));
    const laborHrs = draft.bom.reduce((a, b) => a + b.qty * b.hrs, 0);
    if (laborHrs > 0) items.push({ desc: `Installation labor (${Math.round(laborHrs)}h)`, qty: Math.round(laborHrs), rate: SURVEY_RATE });
    const blocks = defaultProposalBlocks(draft.customer, `${draft.site} — Security System`).map(b => b.type === 'pricing' ? { ...b, content: { items } } : b);
    const pid = 'PROP-' + (Math.floor(Math.random() * 600) + 320);
    proposalStore.set(list => [{ id: pid, customer: draft.customer, title: `${draft.site} — Security System`, status: 'draft', created: draft.date, viewed: false, viewTime: '—', blocks }, ...list]);
    surveyStore.set(list => existing ? list : [draft, ...list]);
    showToast(`${pid} drafted from survey — opening Proposals`, 'ok');
    onClose(); onNav && onNav('proposals');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)', flex: 1 }}>{existing ? 'Edit Survey' : 'New Site Survey'}</span>
        {stage === 'edit' && <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-ok)' }}>${t.price.toLocaleString()}</span>}
      </div>

      {/* Site input */}
      <div className="glass" style={{ padding: '12px 13px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label><span style={svLabel}>Prospect / Customer *</span>
          <input list="sv-custs" value={draft.customer} onChange={e => setDraft(d => ({ ...d, customer: e.target.value }))} placeholder="Select or type…" style={svInput} />
          <datalist id="sv-custs">{allCusts.map(c => <option key={c.id} value={c.name} />)}</datalist>
        </label>
        <label><span style={svLabel}>Site / Building</span><input value={draft.site} onChange={e => setDraft(d => ({ ...d, site: e.target.value }))} placeholder="e.g. Main Campus — Bldg A" style={svInput} /></label>
        <label><span style={svLabel}>Walkthrough notes</span><textarea value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={2} placeholder="Conditions, access, hazards…" style={{ ...svInput, resize: 'vertical', minHeight: 52 }} /></label>
        <image-slot id={`survey-floorplan-${draft.id}`} shape="rounded" radius="10" placeholder="Drop floor plan / walkthrough photo" style={{ display: 'block', width: '100%', height: 120 }}></image-slot>
      </div>

      {/* Analyze */}
      {stage === 'input' && (
        <button onClick={() => { setStepIdx(0); setStage('analyzing'); }} style={{ padding: '13px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="hermes" size={16} color="#fff" /> Run AI Detection</button>
      )}
      {stage === 'analyzing' && (
        <div className="glass" style={{ padding: '16px 14px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Icon name="hermes" size={15} color="var(--brand)" /><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)' }}>ShieldTech AI analyzing site…</span></div>
          {SV_STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0', opacity: i <= stepIdx ? 1 : 0.3 }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${i < stepIdx ? 'var(--status-ok)' : 'var(--border-strong)'}`, background: i < stepIdx ? 'var(--status-ok)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06281c', fontSize: 9, fontWeight: 800 }}>{i < stepIdx ? '✓' : ''}</span>
              <span style={{ fontSize: 12, color: i <= stepIdx ? 'var(--text-high)' : 'var(--text-low)' }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Edit results */}
      {stage === 'edit' && <>
        <MSection title="Detected on site">
          {draft.detected.map((d, i) => (
            <div key={i} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand)', width: 26, textAlign: 'center', flexShrink: 0 }}>{d.count}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{d.kind}</div><div style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{d.note}</div></div>
              <span className="mono" style={{ fontSize: 10, color: d.conf >= 90 ? 'var(--status-ok)' : 'var(--status-warn)', flexShrink: 0 }}>{d.conf}%</span>
            </div>
          ))}
          {draft.detected.length === 0 && <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--text-low)', textAlign: 'center' }}>No detections yet — AI detection requires the ShieldTech AI service to be configured.</div>}
        </MSection>

        <MSection title="Bill of materials">
          {draft.bom.map(b => (
            <div key={b.sku} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)' }}>{b.desc}</div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-low)' }}>{b.sku} · ${b.unit}/ea · {b.hrs}h</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <button onClick={() => setQty(b.sku, b.qty - 1)} style={svStep}>−</button>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', width: 22, textAlign: 'center' }}>{b.qty}</span>
                <button onClick={() => setQty(b.sku, b.qty + 1)} style={svStep}>+</button>
              </div>
            </div>
          ))}
          {draft.bom.length === 0 && <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--text-low)', textAlign: 'center' }}>No BOM lines yet — add products to the Price Book to build estimates.</div>}
        </MSection>

        {/* Pricing */}
        <div className="glass" style={{ padding: '13px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 11, color: 'var(--text-low)' }}>TARGET MARGIN</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{draft.margin}%</span>
          </div>
          <input type="range" min="15" max="55" value={draft.margin} onChange={e => setDraft(d => ({ ...d, margin: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--brand)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {[['Hardware', `$${t.hardware.toLocaleString()}`], ['Labor', `$${t.labor.toLocaleString()} · ${Math.round(t.laborHrs)}h`], ['Cost', `$${t.cost.toLocaleString()}`], ['Sell Price', `$${t.price.toLocaleString()}`]].map(([k, v], i) => (
              <div key={k} style={{ background: i === 3 ? 'rgba(52,211,153,0.08)' : 'rgba(63,169,245,0.03)', border: `1px solid ${i === 3 ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`, borderRadius: 9, padding: '8px 10px' }}>
                <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: i === 3 ? 'var(--status-ok)' : 'var(--text-high)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} style={{ flex: 1, padding: '12px 0', background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save Report</button>
          <button onClick={toProposal} style={{ flex: 1.5, padding: '12px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>→ Draft Proposal</button>
        </div>
      </>}
    </div>
  );
}
const svStep = { width: 30, height: 30, borderRadius: 8, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-body)' };

Object.assign(window, { MSurvey, MSurveyBuilder });

/* Screen — AI Site Survey Estimator
   Floor plan / walkthrough photos in → ShieldTech AI detects devices, builds BOM from
   price book, estimates labor from skills matrix, drafts the proposal. */

const SURVEY_STEPS = [
  'Reading floor plan geometry…',
  'Detecting entry points & door hardware…',
  'Placing camera coverage zones…',
  'Matching devices against Price Book…',
  'Estimating labor from Skills Matrix…',
  'Building proposal draft…',
];

const SURVEY_DETECTED = [
  { kind: 'Perimeter doors', icon: 'reader', count: 6, note: '4 need access readers, 2 alarm-only', conf: 96 },
  { kind: 'Camera positions', icon: 'cam-dome', count: 14, note: '8 indoor dome · 4 outdoor bullet · 2 PTZ', conf: 91 },
  { kind: 'Head-end location', icon: 'controller', count: 1, note: 'IT closet, rack space available', conf: 88 },
  { kind: 'Cable runs', icon: 'topology', count: 21, note: '~2,400 ft CAT6A, plenum required', conf: 82 },
  { kind: 'Motion zones', icon: 'anomaly', count: 9, note: 'Open-plan office + warehouse bays', conf: 90 },
];

const SURVEY_BOM_SEED = [
  { sku: 'P3245-V',  desc: 'Axis P3245-V Indoor Dome',        qty: 8,  unit: 285,  hrs: 1.5 },
  { sku: 'P1468-LE', desc: 'Axis P1468-LE Outdoor Bullet 4K', qty: 4,  unit: 412,  hrs: 2.0 },
  { sku: 'Q6135-LE', desc: 'Axis Q6135-LE PTZ',               qty: 2,  unit: 890,  hrs: 2.5 },
  { sku: 'RP40',     desc: 'HID RP40 Multiclass Reader',      qty: 4,  unit: 165,  hrs: 1.5 },
  { sku: 'HID-CTRL', desc: 'HID Controller (4-door)',         qty: 1,  unit: 320,  hrs: 3.0 },
  { sku: 'XNR-6410', desc: 'Hanwha XNR-6410 NVR 64ch',        qty: 1,  unit: 1850, hrs: 4.0 },
  { sku: 'POE24',    desc: 'PoE++ Switch 24-port',            qty: 1,  unit: 480,  hrs: 2.0 },
  { sku: 'CAT6A-1K', desc: 'CAT6A Plenum 1000ft',             qty: 3,  unit: 280,  hrs: 0 },
  { sku: 'LABOR-RUN',desc: 'Cable runs & terminations (21 drops)', qty: 21, unit: 0, hrs: 1.2 },
];

const SURVEY_RATE = 145; // blended labor $/hr

function SurveyEstimatorScreen() {
  const [stage, setStage] = React.useState('input'); // input | analyzing | results
  const [stepIdx, setStepIdx] = React.useState(0);
  const [customer, setCustomer] = React.useState('Redwood College');
  const [bom, setBom] = React.useState(SURVEY_BOM_SEED);
  const [margin, setMargin] = React.useState(35);

  React.useEffect(() => {
    if (stage !== 'analyzing') return;
    if (stepIdx >= SURVEY_STEPS.length) { setStage('results'); return; }
    const t = setTimeout(() => setStepIdx(i => i + 1), 520);
    return () => clearTimeout(t);
  }, [stage, stepIdx]);

  const run = () => { setStepIdx(0); setStage('analyzing'); };
  const setQty = (sku, qty) => setBom(prev => prev.map(b => b.sku === sku ? { ...b, qty: Math.max(0, qty) } : b));

  const hardware = bom.reduce((s, b) => s + b.qty * b.unit, 0);
  const laborHrs = bom.reduce((s, b) => s + b.qty * b.hrs, 0);
  const labor = Math.round(laborHrs * SURVEY_RATE);
  const cost = hardware + labor;
  const price = Math.round(cost / (1 - margin / 100) / 50) * 50;

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Input stage */}
      {stage === 'input' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Survey Input</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prospect / Site</div>
              <select value={customer} onChange={e => setCustomer(e.target.value)} style={{ width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7, padding: '9px 12px', color: 'var(--text-high)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
                {['Redwood College', 'Westfield Mall — Phase 2', 'Sutter Health — Annex', 'New prospect…'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Upload zones (mock) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: '22px 12px', textAlign: 'center', cursor: 'pointer', background: 'rgba(63,169,245,0.03)' }}
                onClick={() => showToast('Floor plan attached — redwood-college-L1.pdf', 'ok')}>
                <Icon name="floorplan" size={22} color="var(--brand)" />
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)', marginTop: 6 }}>Floor plan</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>PDF, DWG, or photo</div>
                <div style={{ fontSize: 9, color: 'var(--status-ok)', marginTop: 6 }}>✓ redwood-college-L1.pdf</div>
              </div>
              <div style={{ border: '1.5px dashed var(--border-subtle)', borderRadius: 10, padding: '22px 12px', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => showToast('12 walkthrough photos attached', 'ok')}>
                <Icon name="cameras" size={22} color="var(--text-mid)" />
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-high)', marginTop: 6 }}>Walkthrough photos</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>From the Tech App survey visit</div>
                <div style={{ fontSize: 9, color: 'var(--status-ok)', marginTop: 6 }}>✓ 12 photos · Tony G · Jun 10</div>
              </div>
            </div>
            <button onClick={run} style={{ width: '100%', marginTop: 14, padding: '11px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 18px rgba(63,169,245,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="hermes" size={15} color="#fff" /> Run ShieldTech AI Site Analysis
            </button>
          </div>
          <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)' }}>How it works</div>
            {[
              ['Detect', 'Doors, camera sightlines, head-end space, and cable paths are read off the plan and photos.'],
              ['Price', 'Every detected device is matched to your Price Book with current vendor cost.'],
              ['Estimate', 'Labor hours come from your team’s actual install times per device type.'],
              ['Draft', 'A branded proposal is assembled — you review, tweak margin, send.'],
            ].map(([t, d], i) => (
              <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="mono" style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(63,169,245,0.1)', color: 'var(--brand)', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{t}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 'auto', fontSize: 10, color: 'var(--text-low)', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              Avg. quote turnaround with estimator: <span style={{ color: 'var(--status-ok)', fontWeight: 600 }}>22 min</span> vs 2.5 days manual
            </div>
          </div>
        </div>
      )}

      {/* Analyzing stage */}
      {stage === 'analyzing' && (
        <div className="glass" style={{ padding: 40, maxWidth: 560, margin: '40px auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Icon name="hermes" size={20} color="var(--brand)" />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)' }}>ShieldTech AI is analyzing {customer}…</span>
          </div>
          {SURVEY_STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', opacity: i <= stepIdx ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              {i < stepIdx
                ? <span style={{ color: 'var(--status-ok)', fontSize: 12, width: 16 }}>✓</span>
                : i === stepIdx
                  ? <span style={{ width: 12, height: 12, marginRight: 4, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                  : <span style={{ width: 16 }}></span>}
              <span style={{ fontSize: 12, color: i <= stepIdx ? 'var(--text-high)' : 'var(--text-low)' }}>{s}</span>
            </div>
          ))}
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      )}

      {/* Results stage */}
      {stage === 'results' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="display" style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-high)' }}>{customer} — AI Survey Estimate</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>Analyzed from floor plan + 12 walkthrough photos · review before sending</div>
            </div>
            <button onClick={() => setStage('input')} style={{ marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↻ Re-run</button>
          </div>

          {/* Detected */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {SURVEY_DETECTED.map(d => (
              <div key={d.kind} className="glass" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Icon name={d.icon} size={16} color="var(--brand)" />
                  <span className="mono" style={{ fontSize: 9, color: d.conf > 88 ? 'var(--status-ok)' : 'var(--status-warn)' }}>{d.conf}%</span>
                </div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-high)', margin: '6px 0 2px' }}>{d.count}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mid)' }}>{d.kind}</div>
                <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3, lineHeight: 1.4 }}>{d.note}</div>
              </div>
            ))}
          </div>

          {/* BOM */}
          <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['SKU', 'Description', 'Qty', 'Unit', 'Hardware', 'Labor hrs'].map(h => (
                    <th key={h} style={{ textAlign: h === 'SKU' || h === 'Description' ? 'left' : 'right', padding: '10px 14px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bom.map(b => (
                  <tr key={b.sku}>
                    <td className="mono" style={{ padding: '8px 14px', fontSize: 10, color: 'var(--brand)', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{b.sku}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-high)', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{b.desc}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                      <input type="number" value={b.qty} onChange={e => setQty(b.sku, parseInt(e.target.value) || 0)}
                        style={{ width: 52, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '3px 6px', color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-mono, monospace)', textAlign: 'right', outline: 'none' }} />
                    </td>
                    <td className="mono" style={{ padding: '8px 14px', fontSize: 11, textAlign: 'right', color: 'var(--text-mid)', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{b.unit ? `$${b.unit}` : '—'}</td>
                    <td className="mono" style={{ padding: '8px 14px', fontSize: 11, textAlign: 'right', color: 'var(--text-high)', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{b.unit ? `$${(b.qty * b.unit).toLocaleString()}` : '—'}</td>
                    <td className="mono" style={{ padding: '8px 14px', fontSize: 11, textAlign: 'right', color: 'var(--text-mid)', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>{(b.qty * b.hrs).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + margin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            <div className="glass" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Margin</div>
              <input type="range" min="15" max="55" value={margin} onChange={e => setMargin(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>
                <span>15%</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: margin < 25 ? 'var(--status-warn)' : 'var(--brand)' }}>{margin}%</span>
                <span>55%</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.5 }}>
                {margin < 25 ? '⚠ Below your 28% average for education-sector installs.' : `Comparable wins in this sector closed at 30–38%.`}
              </div>
            </div>
            <div className="glass" style={{ padding: 18 }}>
              {[
                ['Hardware', `$${hardware.toLocaleString()}`],
                [`Labor (${laborHrs.toFixed(0)} hrs @ $${SURVEY_RATE})`, `$${labor.toLocaleString()}`],
                ['Cost basis', `$${cost.toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: 'var(--text-mid)' }}>
                  <span>{k}</span><span className="mono">{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Quote price</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--status-ok)' }}>${price.toLocaleString()}</span>
              </div>
              <button onClick={() => { showToast('Proposal drafted — opening builder', 'ok'); navTo('proposals'); }} style={{ width: '100%', marginTop: 12, padding: '10px 0', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Draft proposal →</button>
              <button onClick={() => showToast('Estimate saved to pipeline', 'ok')} style={{ width: '100%', marginTop: 6, padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save estimate</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { SurveyEstimatorScreen });

/* SiteScan — Export tab: blueprint summary + BOM, push to Design Studio,
   attach to a project, PDF survey report, hand off to the AI Survey Estimator. */

function SSExport({ project, onNav, update }) {
  const t = ssTotals(project);
  const [report, setReport] = React.useState(false);
  const [attach, setAttach] = React.useState(false);
  const [pushing, setPushing] = React.useState(false);

  const pushedStudio = (project.pushed || []).includes('studio');

  const pushToStudio = () => {
    if (pushing) return;
    setPushing(true);
    setTimeout(() => {
      studioInboxStore.set(list => [{
        id: 'sd-' + project.id, name: `${project.customer} — ${project.site} (SiteScan)`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        customer: project.customer, rooms: t.rooms, devices: t.devices, area: t.area, source: 'sitescan',
      }, ...list.filter(x => x.id !== 'sd-' + project.id)]);
      update({ ...project, pushed: [...new Set([...(project.pushed || []), 'studio'])] });
      setPushing(false);
      showToast('Blueprint uploaded to Design Studio ✓', 'ok');
    }, 1400);
  };

  const totObjects = project.floors.reduce((a, f) => a + (f.objects || []).length, 0);

  const toEstimator = () => {
    const detected = [
      { kind: 'Rooms captured', count: t.rooms, note: `${t.area.toLocaleString()} ft² across ${project.floors.length} floor${project.floors.length > 1 ? 's' : ''}`, conf: 98 },
      { kind: 'Camera positions', count: project.floors.reduce((a, f) => a + (f.devices || []).filter(v => ['dome', 'bullet', 'ptz'].includes(v.type)).length, 0), note: 'Placed on SiteScan blueprint', conf: 97 },
      { kind: 'Doors & openings', count: project.floors.reduce((a, f) => a + (f.doors || []).filter(d => d.kind === 'door').length, 0), note: 'From captured geometry', conf: 95 },
      { kind: 'Obstructions documented', count: totObjects, note: 'Furniture, fixtures & racks classified by AR scan', conf: 92 },
      { kind: 'Cable runs', count: project.floors.reduce((a, f) => a + (f.cables || []).length, 0), note: `~${t.cableFt} ft CAT6A measured on plan`, conf: 93 },
    ].filter(d => d.count > 0);
    const id = 'SR-' + (Math.floor(Math.random() * 9000) + 1000);
    surveyStore.set(list => [{
      id, customer: project.customer, site: project.site, date: project.created, status: 'draft', margin: 35,
      notes: `Generated from SiteScan ${project.id} — ${t.rooms} rooms, geometry-measured cable runs.`,
      detected, bom: t.bom.map(b => ({ ...b })),
    }, ...list]);
    showToast(`${id} drafted from ${project.id} — opening Estimator`, 'ok');
    onNav && onNav('survey-ai');
  };

  const act = (icon, title, sub, onClick, { done, busy, color = 'var(--brand)' } = {}) => (
    <button onClick={onClick} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 13px', borderRadius: 12, border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', width: '100%', background: 'var(--glass-bg)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `color-mix(in srgb, ${done ? 'var(--status-ok)' : color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${done ? 'var(--status-ok)' : color} 35%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: done ? 'var(--status-ok)' : color }}>{busy ? '◌' : done ? '✓' : icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{title}</div>
        <div style={{ fontSize: 9.5, color: 'var(--text-low)', lineHeight: 1.4 }}>{busy ? 'Uploading blueprint…' : sub}</div>
      </div>
      <span style={{ color: 'var(--text-low)', fontSize: 14, flexShrink: 0 }}>›</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* summary */}
      <div className="glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <SSPlanThumb floor={project.floors[0]} height={120} />
        <div style={{ display: 'flex', padding: '10px 0' }}>
          {[['Rooms', t.rooms], ['Area', t.area.toLocaleString() + 'ft²'], ['Devices', t.devices], ['Objects', totObjects], ['Est. cost', '$' + (t.cost / 1000).toFixed(1) + 'K']].map(([k, v]) => (
            <div key={k} style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{v}</div>
              <div style={{ fontSize: 7.5, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* auto BOM */}
      <MSection title="Auto bill of materials — from placed symbols">
        {t.bom.length === 0 && <div className="glass" style={{ padding: 18, textAlign: 'center', color: 'var(--text-low)', fontSize: 11, borderRadius: 11 }}>Place devices on the plan to build the BOM.</div>}
        {t.bom.map(b => (
          <div key={b.sku} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, marginBottom: 5 }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', width: 24, textAlign: 'center', flexShrink: 0 }}>{b.qty}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-high)' }}>{b.desc}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{b.sku} · ${b.unit}/ea · {b.hrs}h</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-mid)', flexShrink: 0 }}>${(b.qty * b.unit).toLocaleString()}</span>
          </div>
        ))}
      </MSection>

      {/* actions */}
      <MSection title="Send it somewhere">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {act('⬒', pushedStudio ? 'In Design Studio' : 'Upload to Design Studio', pushedStudio ? 'Blueprint available in Studio → Saved Drawings' : 'Blueprint + devices become an editable Studio drawing', pushToStudio, { done: pushedStudio, busy: pushing, color: '#c084fc' })}
          {act('▣', project.projectLink ? `Attached — ${project.projectLink}` : 'Add to a project', project.projectLink ? 'Linked to project record' : 'Attach the survey to an existing or new project', () => setAttach(true), { done: !!project.projectLink })}
          {act('⎙', 'PDF survey report', 'Plan, device schedule, photos & measurements', () => setReport(true))}
          {act('Σ', 'Send to AI Survey Estimator', 'Geometry-accurate BOM → margin, pricing & proposal', toEstimator, { color: 'var(--status-ok)' })}
        </div>
      </MSection>

      {report && <SSReport project={project} onClose={() => setReport(false)} />}
      {attach && <SSAttach project={project} update={update} onClose={() => setAttach(false)} />}
    </div>
  );
}

/* ── Attach to project sheet ── */
function SSAttach({ project, update, onClose }) {
  const [jobs] = useShieldStore(backlogStore);
  const [newName, setNewName] = React.useState('');
  const options = [...new Set(jobs.map(j => j.title))].slice(0, 5);
  const link = name => {
    update({ ...project, projectLink: name });
    showToast(`Survey attached to "${name}"`, 'ok');
    onClose();
  };
  return (
    <MSheet title="Attach survey to project" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {options.map(o => (
          <button key={o} onClick={() => link(o)} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
            <span style={{ fontSize: 13, color: 'var(--brand)' }}>▣</span>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--text-high)' }}>{o}</span>
            <span style={{ color: 'var(--text-low)', fontSize: 13 }}>›</span>
          </button>
        ))}
        <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="…or new project name" style={{ flex: 1, padding: '11px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 12.5, fontFamily: 'var(--font-body)', outline: 'none', minWidth: 0 }} />
          <button onClick={() => newName.trim() && link(newName.trim())} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Create</button>
        </div>
      </div>
    </MSheet>
  );
}

/* ── PDF survey report preview ── */
function SSReport({ project, onClose }) {
  const [prefs] = useShieldStore(ssPrefsStore);
  const [svPrefs] = useShieldStore(typeof surveyPrefsStore !== 'undefined' ? surveyPrefsStore : ssPrefsStore);
  const blue = (svPrefs.reportStyle || 'blueprint') === 'blueprint';
  const paper = blue
    ? { bg: '#10233a', ink: '#dbeafe', sub: '#7da2c8', line: '#27425f', rule: '#dbeafe' }
    : { bg: '#f4f6f4', ink: '#16283c', sub: '#4a6a8a', line: '#d7dfe7', rule: '#16283c' };
  const t = ssTotals(project);
  return (
    <div style={{ ...ssOverlay, background: 'rgba(2,5,9,0.96)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>Survey report — preview</span>
        <button onClick={() => { showToast('Report exported — SiteSurvey_' + project.id + '.pdf', 'ok'); onClose(); }} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>⇩ Download PDF</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: 18, cursor: 'pointer', padding: '0 0 0 4px' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* paper */}
        <div style={{ background: paper.bg, borderRadius: 10, padding: '20px 18px', color: paper.ink, fontFamily: 'var(--font-body)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `2px solid ${paper.rule}`, paddingBottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>Site Survey Report</div>
            <div style={{ marginLeft: 'auto', fontSize: 9, color: paper.sub }} className="mono">{project.id} · {project.created}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: '10px 0', fontSize: 10.5 }}>
            <div><span style={{ color: paper.sub }}>Customer</span><br /><b>{project.customer}</b></div>
            <div><span style={{ color: paper.sub }}>Site</span><br /><b>{project.site}</b></div>
            <div><span style={{ color: paper.sub }}>Surveyed area</span><br /><b>{t.area.toLocaleString()} ft² · {t.rooms} rooms · {project.floors.length} floors</b></div>
            <div><span style={{ color: paper.sub }}>Prepared by</span><br /><b>ShieldTech Solutions — Survey Scan</b></div>
          </div>
          {project.floors.map(f => f.rooms.length > 0 && (
            <div key={f.id} style={{ margin: '8px 0 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: blue ? '#8ab8e8' : '#1e3a5f', marginBottom: 5 }}>{f.label.toUpperCase()} — {f.rooms.length} ROOMS · {ssCableFt(f)} FT CABLE</div>
              <div style={{ border: `1px solid ${paper.line}`, borderRadius: 8, overflow: 'hidden' }}>
                <SSPlanThumb floor={f} theme={blue ? 'dark' : 'paper'} icons={prefs.icons} height={170} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: blue ? '#8ab8e8' : '#1e3a5f', margin: '10px 0 5px' }}>DEVICE SCHEDULE</div>
          {t.bom.map(b => (
            <div key={b.sku} style={{ display: 'flex', gap: 8, fontSize: 10, padding: '5px 0', borderBottom: `1px solid ${paper.line}` }}>
              <span className="mono" style={{ width: 18, fontWeight: 700 }}>{b.qty}</span>
              <span style={{ flex: 1 }}>{b.desc}</span>
              <span className="mono" style={{ color: paper.sub }}>{b.sku}</span>
            </div>
          ))}
          {(() => {
            const inv = {};
            project.floors.forEach(f => (f.objects || []).forEach(o => { inv[o.type] = inv[o.type] || { n: 0, conf: 0 }; inv[o.type].n++; inv[o.type].conf += o.conf || 90; }));
            const rows = Object.entries(inv);
            if (!rows.length) return null;
            return <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#1e3a5f', margin: '12px 0 5px' }}>DOCUMENTED REALITY — OBJECT INVENTORY</div>
              <div style={{ fontSize: 8.5, color: '#4a6a8a', marginBottom: 5 }}>Obstructions auto-classified during the AR scan; positions recorded on the plan.</div>
              {rows.map(([type, v]) => {
                const d = ssObj(type);
                return (
                  <div key={type} style={{ display: 'flex', gap: 8, fontSize: 10, padding: '4px 0', borderBottom: '1px solid #d7dfe7' }}>
                    <span className="mono" style={{ width: 18, fontWeight: 700 }}>{v.n}</span>
                    <span style={{ flex: 1 }}>{d.label}</span>
                    <span style={{ color: '#4a6a8a', textTransform: 'capitalize' }}>{d.cat}</span>
                    <span className="mono" style={{ color: '#4a6a8a' }}>{Math.round(v.conf / v.n)}%</span>
                  </div>
                );
              })}
            </>;
          })()}
          {project.floors.some(f => (f.photos || []).length) && <>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#1e3a5f', margin: '12px 0 6px' }}>SITE PHOTOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {project.floors.flatMap(f => f.photos || []).map(p => (
                <div key={p.id} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #b8c6d4' }}>
                  <div style={{ height: 64, background: `linear-gradient(150deg, hsl(${p.hue},25%,72%), hsl(${p.hue},30%,48%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>⧇</div>
                  <div style={{ fontSize: 8.5, padding: '4px 6px', color: '#16283c' }}>{p.label}</div>
                </div>
              ))}
            </div>
          </>}
          <div style={{ marginTop: 14, paddingTop: 8, borderTop: `2px solid ${paper.rule}`, display: 'flex', fontSize: 10.5 }}>
            <span>Estimated hardware + labor</span>
            <b className="mono" style={{ marginLeft: 'auto' }}>${t.cost.toLocaleString()}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SSExport, SSAttach, SSReport });

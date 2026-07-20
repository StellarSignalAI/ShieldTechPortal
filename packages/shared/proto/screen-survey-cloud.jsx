/* Survey Cloud — desktop office-side review of Survey Scan field data.
   Project list → plan review, media & issue review, estimate approval, share links. */

const SV_CLOUD_GLYPH = { photo: '⧇', video: '▶', '360': '◍' };

function SurveyCloudScreen() {
  const [projects] = useShieldStore(siteScanStore);
  const [selId, setSelId] = React.useState(projects[0] ? projects[0].id : null);
  const [tab, setTab] = React.useState('Overview');
  const p = projects.find(x => x.id === selId) || projects[0];
  const update = next => siteScanStore.set(list => list.map(x => x.id === next.id ? next : x));

  if (!p) return <div style={{ padding: 40, color: 'var(--text-low)' }}>No surveys yet — field captures from the mobile app land here in real time.</div>;

  const t = ssTotals(p);
  const est = svEstimate(p);
  const issues = p.floors.flatMap(f => (f.issues || []).map(i => ({ ...i, floor: f.label })));
  const media = p.floors.flatMap(f => (f.photos || []).map(m => ({ ...m, floor: f.label })));
  const readings = p.floors.flatMap(f => (f.readings || []).map(r => ({ ...r, floor: f.label })));
  const setEst = patch => update({ ...p, estimate: { ...(p.estimate || {}), ...patch } });
  const money = n => '$' + Math.round(n).toLocaleString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display" style={{ fontSize: 24, fontWeight: 300, color: 'var(--text-high)', margin: 0 }}>Survey Cloud</h1>
        <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Field captures, reviewed at your desk — synced live from the mobile app</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--status-ok)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-ok)', boxShadow: '0 0 8px var(--status-ok)' }}></span>Live sync</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        {/* project list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(x => {
            const xt = ssTotals(x), xe = svEstimate(x), on = x.id === p.id;
            return (
              <button key={x.id} onClick={() => setSelId(x.id)} className="glass" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid', borderColor: on ? 'var(--border-strong)' : 'var(--border-subtle)', background: on ? 'rgba(63,169,245,0.08)' : 'var(--glass-bg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{x.id}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: svStatusColor(xe.status), marginLeft: 'auto' }}>est {xe.status}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', marginTop: 2 }}>{x.customer}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{x.site} · {xt.rooms} rooms · {xt.area.toLocaleString()} ft²</div>
              </button>
            );
          })}
          <div style={{ fontSize: 10, color: 'var(--text-low)', padding: '4px 6px', lineHeight: 1.5 }}>Techs capture on mobile; every room, pin, reading and voice note appears here the moment it syncs.</div>
        </div>

        {/* detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Overview', 'Review', 'Estimate', 'Share'].map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{ padding: '8px 18px', borderRadius: 9, border: '1px solid', borderColor: tab === tb ? 'var(--border-strong)' : 'var(--border-subtle)', background: tab === tb ? 'rgba(63,169,245,0.12)' : 'transparent', color: tab === tb ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{tb}</button>
            ))}
          </div>

          {tab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
              <div className="glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
                {p.floors.map(f => f.rooms.length > 0 && (
                  <div key={f.id}>
                    <div style={{ padding: '9px 14px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)' }}>{f.label.toUpperCase()} · {f.rooms.length} ROOMS · {ssCableFt(f)} FT CABLE</div>
                    <SSPlanThumb floor={f} height={190} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['ROOMS', t.rooms], ['AREA', t.area.toLocaleString() + ' ft²'], ['DEVICES', t.devices], ['MEDIA', media.length], ['ISSUES', issues.length], ['EST TOTAL', money(est.total)]].map(([k, v]) => (
                    <div key={k} className="glass" style={{ padding: '10px 12px', borderRadius: 11 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--text-low)' }}>{k}</div>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: k === 'ISSUES' && issues.length ? 'var(--status-warn)' : 'var(--text-high)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="glass" style={{ padding: '11px 14px', borderRadius: 11, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 7 }}>SYNC ACTIVITY</div>
                  {(p.sync || []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                      <span style={{ fontSize: 11, color: s.dir === 'up' ? 'var(--brand)' : '#c084fc' }}>{s.dir === 'up' ? '↑' : '↓'}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1 }}>{s.t}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-low)' }}>{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'Review' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
              <div className="glass" style={{ padding: '13px 16px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-low)', marginBottom: 9 }}>FIELD MEDIA — {media.length}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {media.map(m => (
                    <div key={m.id} style={{ borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ height: 66, background: `linear-gradient(150deg, hsl(${m.hue},30%,38%), hsl(${m.hue},34%,20%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 17 }}>{SV_CLOUD_GLYPH[m.kind || 'photo']}</div>
                      <div style={{ padding: '5px 8px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-high)', fontWeight: 500 }}>{m.label}</div>
                        <div style={{ fontSize: 8.5, color: 'var(--text-low)' }}>{m.floor} · {m.kind || 'photo'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="glass" style={{ padding: '13px 16px', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-low)', marginBottom: 6 }}>ISSUES FLAGGED ON-SITE — {issues.length}</div>
                  {issues.map(i => (
                    <div key={i.id} style={{ display: 'flex', gap: 9, padding: '7px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: SV_SEV[i.sev].c, flexShrink: 0, position: 'relative', top: 1 }}></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{i.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{i.room} · {i.floor} · {i.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="glass" style={{ padding: '13px 16px', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-low)', marginBottom: 6 }}>SIGNAL READINGS — {readings.length}</div>
                  {readings.map(r => {
                    const k = svReading(r.kind), ok = k.good(r.val);
                    return (
                      <div key={r.id} style={{ display: 'flex', gap: 9, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 11, color: k.color, width: 68, flexShrink: 0 }}>{k.label}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-mid)', flex: 1 }}>{r.label}</span>
                        <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: ok ? 'var(--status-ok)' : 'var(--status-warn)' }}>{r.val} {k.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'Estimate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12, alignItems: 'start' }}>
              <div className="glass" style={{ padding: '14px 18px', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', flex: 1 }}>On-site estimate — {p.customer}</div>
                  <span style={{ padding: '4px 12px', borderRadius: 14, background: svStatusColor(est.status) + '18', border: `1px solid ${svStatusColor(est.status)}50`, color: svStatusColor(est.status), fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{est.status}</span>
                </div>
                {est.bom.map(b => (
                  <div key={b.sku} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)', width: 24 }}>{b.qty}</span>
                    <span style={{ flex: 1, color: 'var(--text-mid)' }}>{b.desc}</span>
                    <span className="mono" style={{ color: 'var(--text-high)' }}>{money(b.qty * b.unit)}</span>
                  </div>
                ))}
                {est.extras.map(x => (
                  <div key={x.id} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
                    <span className="mono" style={{ fontWeight: 700, color: '#c084fc', width: 24 }}>{x.qty}</span>
                    <span style={{ flex: 1, color: 'var(--text-mid)' }}>{x.desc}</span>
                    <span className="mono" style={{ color: 'var(--text-high)' }}>{money(x.qty * x.unit)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', fontSize: 12, padding: '6px 0', color: 'var(--text-mid)' }}>
                  <span style={{ flex: 1 }}>Labor {est.laborHrs.toFixed(1)}h · markup {p.estimate?.markup ?? 32}% · tax {p.estimate?.tax ?? 8.25}%</span>
                </div>
                <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: 'var(--text-high)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ flex: 1 }}>Total</span><span className="mono" style={{ color: 'var(--brand)' }}>{money(est.total)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setEst({ status: 'approved' }); showToast('Estimate approved — field notified', 'ok'); }} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #34D399, #10B981)', color: '#04231a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Approve</button>
                  <button onClick={() => { setEst({ status: 'rejected' }); showToast('Estimate sent back with comments', 'warn'); }} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Request changes</button>
                </div>
              </div>
              <div className="glass" style={{ padding: '14px 18px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-low)', marginBottom: 8 }}>SCOPE OF WORK</div>
                {((p.estimate || {}).scope || []).map(s => (
                  <div key={s.room} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)', marginBottom: 3 }}>{s.room}</div>
                    {s.tasks.map((tk, i) => <div key={i} style={{ fontSize: 11.5, color: 'var(--text-mid)', padding: '2px 0 2px 12px', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--brand)' }}>▸</span>{tk}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Share' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
              <div className="glass" style={{ padding: '16px 18px', borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', marginBottom: 4 }}>Shareable project link</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5, marginBottom: 10 }}>Read-only view of the plan, media and report for the customer, GC or adjuster — no login needed.</div>
                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--brand)' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>shieldtech.app/s/{p.id.toLowerCase()}-metro</span>
                  <button onClick={() => showToast('Link copied', 'ok')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Copy</button>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-low)', margin: '16px 0 6px' }}>EXPORT FORMATS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {['PDF report', 'PNG plan', 'DXF (CAD)', 'CSV takeoff', 'OBJ / USDZ 3D', 'Estimate XLS'].map(f => (
                    <button key={f} onClick={() => showToast(f + ' exported', 'ok')} style={{ padding: '9px 4px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'rgba(63,169,245,0.04)', color: 'var(--text-mid)', fontSize: 10.5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ padding: '16px 18px', borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', marginBottom: 4 }}>Send downstream</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 10 }}>Push this survey into the rest of the platform.</div>
                {[['⬒ Design Studio', 'Editable blueprint with placed devices'], ['Σ AI Survey Estimator', 'Geometry-accurate BOM → priced proposal'], ['▤ Proposal Builder', 'Scope of work → customer proposal'], ['▣ Project record', 'Attach survey to job & work orders']].map(([lbl, sub]) => (
                  <button key={lbl} onClick={() => showToast(lbl.slice(2) + ' — pushed', 'ok')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>{lbl}</span>
                      <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-low)' }}>{sub}</span>
                    </span>
                    <span style={{ color: 'var(--text-low)' }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SurveyCloudScreen });

/* Technician Field App — Mobile Components */

/* ── Mobile Shell ── */
function TechShell({ tab, setTab, children }) {
  const tabs = [
    { id: 'today', icon: '◉', label: 'Today' },
    { id: 'jobs', icon: '⬡', label: 'Jobs' },
    { id: 'time', icon: '◔', label: 'Time' },
    { id: 'ai', icon: '⟡', label: 'AI Chat' },
    { id: 'resources', icon: '☰', label: 'Resources' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
      {/* Top bar */}
      <header style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldLogo size={22} />
          <span className="display" style={{ fontSize: 12, fontWeight: 300, letterSpacing: '0.08em', color: 'var(--text-high)' }}>SHIELDTECH</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* On-duty indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 100,
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)'
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--status-ok)',
              animation: 'pulse-online 3s ease-in-out infinite'
            }} />
            <span style={{ fontSize: 10, color: 'var(--status-ok)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>On Duty</span>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff'
          }}>{(window.__shieldUser && window.__shieldUser.initials) || '·'}</div>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </div>

      {/* Bottom tabs */}
      <nav style={{
        display: 'flex', borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10,14,20,0.95)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 0 6px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2, background: 'none', border: 'none',
            color: tab === t.id ? 'var(--brand)' : 'var(--text-low)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'color 0.15s', position: 'relative'
          }}>
            {tab === t.id && <div style={{
              position: 'absolute', top: -1, left: '30%', right: '30%', height: 2,
              background: 'var(--brand)', borderRadius: '0 0 2px 2px',
              boxShadow: '0 0 8px var(--brand)'
            }} />}
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── Today View ── */
function TodayView({ setTab, setSelectedJob }) {
  const jobs = [];

  const statusColors = { completed: 'var(--status-ok)', active: 'var(--brand)', upcoming: 'var(--text-low)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Day summary */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Jobs Left', value: String(jobs.filter(j => j.status !== 'completed').length), icon: '⚙' },
          { label: 'Hours', value: '0h', icon: '⏱' },
          { label: 'Miles', value: '0', icon: '⬡' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{
            flex: 1, padding: '12px', textAlign: 'center',
            animation: `fade-up 0.4s ease ${i * 80}ms both`
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-high)' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <div className="label-sm" style={{ marginBottom: 10 }}>TODAY'S SCHEDULE</div>
        {jobs.length === 0 && (
          <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>
            No jobs assigned today — dispatched work appears here.
          </div>
        )}
        {jobs.map((job, i) => (
          <div key={i}
            onClick={() => { setSelectedJob(job); setTab('job-detail'); }}
            style={{
              display: 'flex', gap: 12, padding: '14px 0',
              borderBottom: '1px solid rgba(63,169,245,0.05)',
              cursor: 'pointer', animation: `fade-up 0.4s ease ${(i + 3) * 80}ms both`
            }}
          >
            {/* Timeline dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, paddingTop: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                border: `2px solid ${statusColors[job.status]}`,
                background: job.status === 'completed' ? statusColors.completed : 'transparent',
                boxShadow: job.status === 'active' ? `0 0 8px ${statusColors.active}` : 'none'
              }} />
              {i < jobs.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: 4 }} />}
            </div>
            {/* Job info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{job.time}</span>
                {job.status === 'active' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    padding: '2px 6px', borderRadius: 3,
                    background: 'rgba(63,169,245,0.12)', color: 'var(--brand)',
                    letterSpacing: '0.04em'
                  }}>CURRENT</span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-high)', marginBottom: 2 }}>{job.customer}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 4 }}>{job.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-low)' }}>⌖ {job.site}</span>
                {job.status === 'upcoming' && (
                  <button onClick={e => e.stopPropagation()} style={{
                    marginLeft: 'auto', padding: '3px 10px',
                    background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)',
                    borderRadius: 4, color: 'var(--brand)', fontSize: 10,
                    cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>Navigate →</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Week preview */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>THIS WEEK</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '8px 0',
              borderRadius: 6,
              background: i === 3 ? 'rgba(63,169,245,0.08)' : 'transparent',
              border: i === 3 ? '1px solid var(--border-strong)' : '1px solid transparent'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{d}</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: i === 3 ? 'var(--brand)' : 'var(--text-high)', marginTop: 2 }}>
                0
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 1 }}>jobs</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── Job Detail View ── */
function JobDetailView({ job, setTab }) {
  const [status, setStatus] = React.useState('on-site');
  const [checklist, setChecklist] = React.useState([
    { label: 'Verify scope with customer', done: false },
    { label: 'Check existing cable runs', done: false },
    { label: 'Mount / position devices', done: false },
    { label: 'Terminate & label cables', done: false },
    { label: 'Configure on network', done: false },
    { label: 'Test all devices', done: false },
    { label: 'Clean up & photograph', done: false },
    { label: 'Customer sign-off', done: false },
  ]);

  const statusSteps = ['en-route','on-site','in-progress','paused','complete'];

  const bom = (job && job.bom) || [];

  if (!job) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setTab('today')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, textAlign: 'left' }}>← Back to Today</button>
        <div className="glass" style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 12 }}>Select a job from Today to see its details.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Back + header */}
      <button onClick={() => setTab('today')} style={{
        background: 'none', border: 'none', color: 'var(--brand)',
        fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
        padding: 0, textAlign: 'left'
      }}>← Back to Today</button>

      <GlassPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--brand)' }}>{job.id}</span>
          <StatusBadge status="info" label={status.replace('-', ' ')} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{job.customer}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 4 }}>{job.desc}</p>
        <p style={{ fontSize: 11, color: 'var(--text-low)' }}>⌖ {job.site} · {job.time}</p>

        {/* Status workflow */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {statusSteps.map((s, i) => {
            const idx = statusSteps.indexOf(status);
            return (
              <button key={i} onClick={() => setStatus(s)} style={{
                flex: 1, padding: '6px 0', fontSize: 9, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: i <= idx ? 'rgba(63,169,245,0.12)' : 'rgba(63,169,245,0.03)',
                border: i === idx ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                color: i <= idx ? 'var(--brand)' : 'var(--text-low)'
              }}>{s.replace('-',' ')}</button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Contact + access */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>SITE ACCESS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Contact</div>
            <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{job.contact || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Phone</div>
            <span className="mono" style={{ fontSize: 13, color: 'var(--brand)' }}>{job.phone || '—'}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', padding: '8px 10px', background: 'rgba(63,169,245,0.03)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
          {job.accessNotes || 'No access notes on this work order.'}
        </div>
      </GlassPanel>

      {/* Equipment BOM */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>EQUIPMENT</div>
        {bom.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)' }}>No equipment lines on this job.</div>}
        {bom.map((b, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: i < bom.length - 1 ? '1px solid rgba(63,169,245,0.04)' : 'none'
          }}>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-high)' }}>{b.name}</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{b.installed}/{b.qty}</span>
            <MiniBar value={b.installed} max={b.qty} width={50} />
          </div>
        ))}
      </GlassPanel>

      {/* Checklist */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 10 }}>INSTALL CHECKLIST</div>
        {checklist.map((c, i) => (
          <label key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer'
          }}>
            <div onClick={() => {
              const copy = [...checklist];
              copy[i] = { ...copy[i], done: !copy[i].done };
              setChecklist(copy);
            }} style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              border: c.done ? 'none' : '1.5px solid var(--border-strong)',
              background: c.done ? 'var(--brand)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff', cursor: 'pointer'
            }}>{c.done ? '✓' : ''}</div>
            <span style={{
              fontSize: 13, color: c.done ? 'var(--text-low)' : 'var(--text-high)',
              textDecoration: c.done ? 'line-through' : 'none'
            }}>{c.label}</span>
          </label>
        ))}
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 8 }}>
          {checklist.filter(c => c.done).length} / {checklist.length} complete
        </div>
      </GlassPanel>

      {/* Photo capture */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 8 }}>PHOTOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {['Before','During','After','Issue'].map((p, i) => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 8,
              border: '1px dashed var(--border-subtle)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', gap: 4
            }}>
              <span style={{ fontSize: 20, opacity: 0.3 }}>◉</span>
              <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span>⟡</span>
          <span style={{ fontSize: 11, color: 'var(--brand)' }}>ShieldTech AI Photo QA: 0/4 captured</span>
        </div>
      </GlassPanel>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => shieldModal({ kind: 'confirm', title: 'Put Alarm on Test', message: 'Place this site’s alarm system on test mode? The central monitoring station will be notified and signals will be ignored until you take it off test. Auto-restore after 2 hours.', confirmLabel: 'Put on Test', successMsg: 'Alarm placed on test — central station notified' })} style={{
          padding: '12px', background: 'rgba(63,169,245,0.08)',
          border: '1px solid var(--border-strong)', borderRadius: 8,
          color: 'var(--brand)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>🛡 Put Alarm on Test</button>
        <button onClick={() => shieldModal({ kind: 'signature', title: 'Capture Signature', subtitle: `Job ${job.id} — ${job.customer}`, signPrompt: 'Have the customer sign below to confirm the work is complete and acceptable.', submitLabel: 'Save & Complete Job', successMsg: 'Job completed — signature captured', onSave: () => { if (setTab) setTab('today'); } })} style={{
          padding: '12px', background: 'var(--brand)', border: 'none', borderRadius: 8,
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 0 16px -4px rgba(63,169,245,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>✍ Capture Signature & Complete</button>
      </div>
    </div>
  );
}

/* ── Time View ── */
function TimeView() {
  const [clockedIn, setClockedIn] = React.useState(false);
  const entries = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Clock */}
      <GlassPanel style={{ textAlign: 'center', padding: 24 }}>
        <div className="label-sm" style={{ marginBottom: 6 }}>{clockedIn ? 'CLOCKED IN' : 'NOT CLOCKED IN'}</div>
        <div className="mono" style={{ fontSize: 36, fontWeight: 300, color: 'var(--brand)', letterSpacing: '-0.02em' }}>
          00:00:00
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <StatusDot status="online" size={5} pulse />
          GPS location recorded at clock-in
        </div>
        <button onClick={() => setClockedIn(!clockedIn)} style={{
          marginTop: 16, padding: '10px 32px',
          background: clockedIn ? 'rgba(244,63,94,0.1)' : 'rgba(52,211,153,0.1)',
          border: `1px solid ${clockedIn ? 'rgba(244,63,94,0.25)' : 'rgba(52,211,153,0.25)'}`,
          borderRadius: 8, color: clockedIn ? 'var(--status-critical)' : 'var(--status-ok)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>{clockedIn ? 'Clock Out' : 'Clock In'}</button>
      </GlassPanel>

      {/* Today's entries */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>TODAY'S ENTRIES</div>
        {entries.length === 0 && <div className="glass" style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 10 }}>No time entries yet.</div>}
        {entries.map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
            borderBottom: '1px solid rgba(63,169,245,0.05)'
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2,
              background: e.type === 'work' ? 'var(--brand)' : e.type === 'drive' ? 'var(--status-warn)' : 'var(--text-low)',
              boxShadow: e.active ? `0 0 6px var(--brand)` : 'none'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)', fontWeight: e.active ? 500 : 400 }}>{e.job}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{e.start} — {e.end}</div>
            </div>
            <span className="mono" style={{ fontSize: 13, color: e.active ? 'var(--brand)' : 'var(--text-mid)', fontWeight: 500 }}>{e.dur}</span>
            {e.billable && <span style={{ fontSize: 9, color: 'var(--status-ok)', fontWeight: 600 }}>$</span>}
          </div>
        ))}
      </div>

      {/* Weekly summary */}
      <GlassPanel>
        <div className="label-sm" style={{ marginBottom: 10 }}>WEEKLY SUMMARY</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-high)' }}>0h</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Total</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>0h</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Billable</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-mid)' }}>0h</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Drive</div>
          </div>
        </div>
        <button onClick={() => shieldToast('Timesheet submitted for approval', 'ok')} style={{
          width: '100%', marginTop: 12, padding: '10px',
          background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
          borderRadius: 6, color: 'var(--brand)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>Submit Timesheet for Approval</button>
      </GlassPanel>
    </div>
  );
}

/* ── AI Chat View ── */
function TechAIChatView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>⟡</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>ShieldTech AI Tech Assistant</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>No job context selected</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-low)', fontSize: 12, lineHeight: 1.6, maxWidth: 260 }}>
          Ask about wiring diagrams, RTSP URLs, panel programming, or anything on today's jobs — answers cite their source guides.
        </div>
      </div>

      {/* Suggested */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {['ONVIF setup','Cable termination','Panel programming'].map((s, i) => (
          <button key={i} onClick={() => shieldToast('ShieldTech AI: ' + s)} style={{
            padding: '4px 10px', borderRadius: 100,
            background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
            color: 'var(--brand)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => shieldToast('Voice input — listening…')} style={{
          padding: '10px', background: 'rgba(63,169,245,0.06)',
          border: '1px solid var(--border-subtle)', borderRadius: 8,
          color: 'var(--brand)', fontSize: 16, cursor: 'pointer', width: 40
        }}>◌</button>
        <input placeholder="Ask ShieldTech AI…" style={{
          flex: 1, padding: '10px 14px', background: 'rgba(5,7,10,0.5)',
          border: '1px solid var(--border-subtle)', borderRadius: 8,
          color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
        }} />
        <button onClick={() => shieldToast(window.__shieldAIModel ? 'Use the AI tab — the Field Copilot has full chat' : 'ShieldTech AI service not configured yet', window.__shieldAIModel ? 'ok' : 'warn')} style={{
          background: 'var(--brand)', border: 'none', borderRadius: 8,
          padding: '8px 14px', color: '#fff', fontSize: 13, cursor: 'pointer'
        }}>→</button>
      </div>
    </div>
  );
}

/* ── Resources View ── */
function ResourcesView() {
  const folders = [];

  const recent = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: 'rgba(63,169,245,0.04)',
        border: '1px solid var(--border-subtle)', borderRadius: 8
      }}>
        <span style={{ color: 'var(--text-low)' }}>⌕</span>
        <input placeholder="Search resources…" style={{
          flex: 1, background: 'none', border: 'none', color: 'var(--text-high)',
          fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
        }} />
      </div>

      {/* Recent */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>RECENT</div>
        {recent.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: '6px 0' }}>Nothing opened yet.</div>}
        {recent.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
            borderBottom: '1px solid rgba(63,169,245,0.04)', cursor: 'pointer'
          }}>
            <span style={{ fontSize: 14 }}>{r.type === 'article' ? '▤' : r.type === 'diagram' ? '△' : '▤'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-high)' }}>{r.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{r.type} · {r.time}</div>
            </div>
            <span style={{ color: 'var(--text-low)', fontSize: 11 }}>★</span>
          </div>
        ))}
      </div>

      {/* Folders */}
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>FOLDERS</div>
        {folders.length === 0 && <div className="glass" style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12, borderRadius: 10 }}>No resources yet — guides, diagrams and SOPs uploaded from the portal appear here.</div>}
        {folders.map((f, i) => (
          <div key={i} className="glass" style={{
            padding: '12px 14px', marginBottom: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)'
          }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{f.name}</div>
              {f.children && <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{f.children.join(' · ')}</div>}
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{f.count}</span>
            <span style={{ color: 'var(--text-low)' }}>›</span>
          </div>
        ))}
      </div>

      {/* Offline indicator */}
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <StatusDot status="online" size={6} />
        <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Offline caching keeps resources available in the field</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  TechShell, TodayView, JobDetailView, TimeView,
  TechAIChatView, ResourcesView
});

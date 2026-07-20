/* Screen — Sub-Contractor Management */

function SubcontractorScreen() {
  const [selected, setSelected] = React.useState(0);
  const [tab, setTab] = React.useState('roster');

  const contractors = [
    {
      id: 'SC-01', name: 'Delta Security Services', contact: 'Marcus Webb', phone: '(415) 555-0812', email: 'mwebb@deltasec.com',
      status: 'active', rating: 4.8, jobs: 34, revenue: 68400, ytdPaid: 41200,
      rate: 85, specialty: ['Installation', 'Low Voltage', 'Access Control'],
      certs: [
        { name: 'California C-7 License', expires: new Date(2027, 5, 30), status: 'active' },
        { name: 'NICET Level II', expires: new Date(2028, 0, 15), status: 'active' },
        { name: 'Axis Certified Partner', expires: new Date(2026, 11, 1), status: 'active' },
      ],
      availability: [true, true, false, true, true, false, false],
      performance: { onTime: 96, quality: 92, communication: 88 },
      ytd1099: 41200, pendingPayment: 8600,
      notes: 'Preferred vendor for large installations. Always brings 2-man crew.'
    },
    {
      id: 'SC-02', name: 'Pacific Low Voltage LLC', contact: 'Rosa Vidal',   phone: '(415) 555-0934', email: 'rosa@paclv.com',
      status: 'active', rating: 4.5, jobs: 18, revenue: 29800, ytdPaid: 22400,
      rate: 75, specialty: ['Cable Installation', 'Fiber', 'Network'],
      certs: [
        { name: 'California C-7 License', expires: new Date(2026, 9, 15), status: 'expiring' },
        { name: 'BICSI RCDD', expires: new Date(2027, 2, 20), status: 'active' },
      ],
      availability: [true, false, true, true, false, true, false],
      performance: { onTime: 88, quality: 90, communication: 82 },
      ytd1099: 22400, pendingPayment: 3200,
      notes: 'Excellent cable work. C-7 renewal needed before Q4 projects.'
    },
    {
      id: 'SC-03', name: 'Bay Area Fire & Safety', contact: 'James Okafor', phone: '(415) 555-0761', email: 'j.okafor@bafs.com',
      status: 'inactive', rating: 3.9, jobs: 7, revenue: 14200, ytdPaid: 14200,
      rate: 95, specialty: ['Fire Alarm', 'Suppression'],
      certs: [
        { name: 'NICET Level III Fire Alarm', expires: new Date(2025, 8, 1), status: 'expired' },
        { name: 'California Alarm License', expires: new Date(2026, 3, 10), status: 'expiring' },
      ],
      availability: [false, false, false, false, false, false, false],
      performance: { onTime: 71, quality: 78, communication: 65 },
      ytd1099: 14200, pendingPayment: 0,
      notes: 'NICET cert expired — do not dispatch for fire work until renewed. Last job had 2 callbacks.'
    },
    {
      id: 'SC-04', name: 'Coastal AV & Security',   contact: 'Tina Park',     phone: '(415) 555-0455', email: 'tina@coastalav.com',
      status: 'active', rating: 4.6, jobs: 22, revenue: 38100, ytdPaid: 28900,
      rate: 80, specialty: ['Camera Systems', 'Networking', 'Commissioning'],
      certs: [
        { name: 'California C-7 License', expires: new Date(2028, 1, 28), status: 'active' },
        { name: 'Hikvision Certified', expires: new Date(2027, 7, 5), status: 'active' },
        { name: 'Axis Certified Partner', expires: new Date(2026, 11, 31), status: 'active' },
      ],
      availability: [true, true, true, false, true, true, false],
      performance: { onTime: 93, quality: 95, communication: 91 },
      ytd1099: 28900, pendingPayment: 5400,
      notes: 'Great for commissioning work. Available on weekends for emergency jobs.'
    },
  ];

  const sc = contractors[selected];
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const certStatusStyle = {
    active:   { color: 'var(--status-ok)',       bg: 'rgba(52,211,153,0.12)' },
    expiring: { color: 'var(--status-warn)',      bg: 'rgba(251,191,36,0.12)' },
    expired:  { color: 'var(--status-critical)',  bg: 'rgba(244,63,94,0.1)' },
  };

  const PerformanceRing = ({ value, label, color }) => {
    const r = 28, sw = 5;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <svg width={70} height={70}>
          <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(63,169,245,0.08)" strokeWidth={sw} />
          <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={circ} strokeDashoffset={circ - (value/100)*circ}
            strokeLinecap="round" transform="rotate(-90 35 35)"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
          <text x={35} y={40} textAnchor="middle" fill="var(--text-high)" fontSize={14} fontWeight={600} fontFamily="var(--font-mono)">{value}</text>
        </svg>
        <span style={{ fontSize: 9, color: 'var(--text-low)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', gap: 12, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {/* List */}
        <div className="glass" style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>Sub-Contractors</span>
            <button onClick={() => shieldModal({ kind: 'form', title: 'Add Sub-Contractor', subtitle: 'Register a new sub-contractor', submitLabel: 'Add Sub-Contractor', successMsg: 'Sub-contractor added', fields: [
              { key: 'company', label: 'Company', placeholder: 'Bay Area Cabling LLC', required: true, full: true },
              { key: 'contact', label: 'Contact', placeholder: 'Carlos Mendez' },
              { key: 'trade', label: 'Trade', type: 'select', options: ['Cabling','Electrical','Fire Alarm','Access Control','General'] },
              { key: 'rate', label: 'Hourly Rate ($)', type: 'number', placeholder: '85' },
              { key: 'coi', label: 'COI Expiry', type: 'date' }
            ] })} style={{ fontSize: 11, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {contractors.map((c, i) => {
              const hasCertIssue = c.certs.some(cert => cert.status !== 'active');
              return (
                <div key={c.id} onClick={() => setSelected(i)} style={{
                  padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                  background: selected === i ? 'rgba(63,169,245,0.06)' : 'transparent',
                  borderLeft: `3px solid ${selected === i ? 'var(--brand)' : 'transparent'}`,
                  transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(63,169,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{c.contact}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <span style={{ fontSize: 9, color: c.status === 'active' ? 'var(--status-ok)' : 'var(--text-low)', background: c.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(92,111,134,0.15)', padding: '1px 6px', borderRadius: 100 }}>{c.status}</span>
                      {hasCertIssue && <span style={{ fontSize: 8, color: 'var(--status-warn)' }}>⚠ cert</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-low)' }}>✦ {c.rating}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{c.jobs} jobs</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--status-ok)', marginLeft: 'auto' }}>${c.ytd1099.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div className="glass" style={{ padding: '14px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(63,169,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--brand)', border: '1px solid var(--border-strong)' }}>{sc.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-high)' }}>{sc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{sc.contact} · {sc.phone} · {sc.email}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => shieldModal({ kind: 'form', title: 'Assign Job', subtitle: 'Assign a work order to this sub-contractor', submitLabel: 'Assign Job', successMsg: 'Job assigned to sub-contractor', fields: [
                  { key: 'wo', label: 'Work Order', placeholder: 'WO-2847', required: true, full: true },
                  { key: 'date', label: 'Scheduled Date', type: 'date' },
                  { key: 'rate', label: 'Agreed Rate ($)', type: 'number', placeholder: '85' },
                  { key: 'scope', label: 'Scope', type: 'textarea', placeholder: 'Describe the work…' }
                ] })} style={{ fontSize: 11, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Assign Job</button>
                <button onClick={() => shieldModal({ kind: 'confirm', title: 'Process Payment', message: 'Process payment for this sub-contractor’s completed work? This will queue an ACH transfer for the approved amount.', confirmLabel: 'Process Payment', successMsg: 'Payment queued for processing' })} style={{ fontSize: 11, color: 'var(--status-ok)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Process Payment</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Rate', val: `$${sc.rate}/hr` },
                { label: 'YTD Jobs', val: sc.jobs },
                { label: 'YTD Revenue', val: `$${sc.revenue.toLocaleString()}` },
                { label: 'YTD 1099', val: `$${sc.ytd1099.toLocaleString()}` },
                { label: 'Pending', val: `$${sc.pendingPayment.toLocaleString()}`, color: sc.pendingPayment > 0 ? 'var(--status-warn)' : 'var(--status-ok)' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 1 }}>{f.label}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: f.color || 'var(--text-high)' }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0, overflow: 'hidden' }}>
            {/* Left: certs + availability */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              {/* Certs */}
              <div className="glass" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Certifications & Licenses</div>
                {sc.certs.map((cert, i) => {
                  const cs = certStatusStyle[cert.status];
                  const daysLeft = Math.round((cert.expires - new Date(2026,5,10)) / (1000*60*60*24));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < sc.certs.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cs.color, flexShrink: 0, boxShadow: cert.status === 'active' ? `0 0 6px ${cs.color}` : 'none' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-high)' }}>{cert.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Expires {cert.expires.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: cs.color, background: cs.bg, padding: '2px 8px', borderRadius: 100 }}>
                        {cert.status === 'expired' ? 'Expired' : cert.status === 'expiring' ? `${daysLeft}d left` : 'Valid'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Availability */}
              <div className="glass" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>This Week Availability</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {sc.availability.map((avail, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-low)' }}>{dayLabels[i]}</span>
                      <div style={{ width: '100%', height: 32, borderRadius: 5, background: avail ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.08)', border: `1px solid ${avail ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                        {avail ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {sc.notes && (
                <div className="glass" style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 6 }}>Notes</div>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.55 }}>{sc.notes}</p>
                </div>
              )}
            </div>

            {/* Right: performance + specialty */}
            <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="glass" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 12 }}>Performance</div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <PerformanceRing value={sc.performance.onTime} label="On-Time" color="var(--status-ok)" />
                  <PerformanceRing value={sc.performance.quality} label="Quality" color="var(--brand)" />
                  <PerformanceRing value={sc.performance.communication} label="Comms" color="#c084fc" />
                </div>
              </div>
              <div className="glass" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 10 }}>Specialties</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {sc.specialty.map(s => (
                    <span key={s} style={{ fontSize: 10, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', padding: '3px 9px', borderRadius: 100 }}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 8 }}>1099 Tracking</div>
                {[
                  { label: 'YTD Payments', val: `$${sc.ytd1099.toLocaleString()}`, color: 'var(--status-ok)' },
                  { label: 'Pending', val: `$${sc.pendingPayment.toLocaleString()}`, color: sc.pendingPayment > 0 ? 'var(--status-warn)' : 'var(--text-low)' },
                  { label: 'Until 1099 Required', val: sc.ytd1099 >= 600 ? 'Required' : `$${(600 - sc.ytd1099).toLocaleString()} away`, color: sc.ytd1099 >= 600 ? 'var(--status-warn)' : 'var(--text-low)' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.label}</span>
                    <span className="mono" style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SubcontractorScreen });

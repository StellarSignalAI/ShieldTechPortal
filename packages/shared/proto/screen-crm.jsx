/* Screen 6 — Sales/CRM: Pipeline + Lead Detail */

function CRMScreen() {
  const [selectedLead, setSelectedLead] = React.useState(0);

  const stages = [
    { name: 'New', color: 'var(--text-low)' },
    { name: 'Contacted', color: 'var(--status-info)' },
    { name: 'Qualified', color: 'var(--status-warn)' },
    { name: 'Proposal', color: '#c084fc' },
    { name: 'Won', color: 'var(--status-ok)' },
  ];

  const leads = [
    { name: 'Pinnacle Financial Group', contact: 'Sarah Chen', score: 92, temp: 'hot', value: '$128,500', stage: 3, followUp: 'Jun 7', source: 'Referral', phone: '(415) 555-0142', email: 'schen@pinnaclefg.com', notes: 'Expanding to 3 new floors. Needs full CCTV + access control. Budget approved Q2.', riskFactors: ['Long procurement cycle', 'Multiple decision makers'], winFactors: ['Budget pre-approved', 'Existing relationship', 'Competitor contract expiring'] },
    { name: 'Bayshore Medical Center', contact: 'Dr. Michael Torres', score: 78, temp: 'warm', value: '$94,200', stage: 2, followUp: 'Jun 8', source: 'Website', phone: '(415) 555-0289', email: 'mtorres@bayshoremc.org', notes: 'HIPAA compliance upgrade needed. Current system is 8 years old.', riskFactors: ['Budget committee approval needed', 'Compliance timeline unclear'], winFactors: ['Urgent compliance need', 'Outdated current system'] },
    { name: 'Golden Gate Logistics', contact: 'James Park', score: 65, temp: 'warm', value: '$52,000', stage: 1, followUp: 'Jun 10', source: 'Cold Call', phone: '(415) 555-0367', email: 'jpark@gglogistics.com', notes: 'Warehouse security upgrade. 40K sqft facility. Interested in perimeter cameras + intrusion.', riskFactors: ['Early stage', 'Price sensitive'], winFactors: ['Clear need', 'Decision maker engaged'] },
    { name: 'Pacific Rim Hotels', contact: 'Lisa Wang', score: 88, temp: 'hot', value: '$215,000', stage: 3, followUp: 'Jun 6', source: 'RFP', phone: '(415) 555-0445', email: 'lwang@pacrimhotels.com', notes: 'Full property upgrade — 3 hotels, 450 cameras, enterprise access control. Major opportunity.', riskFactors: ['Competing bids from 2 nationals'], winFactors: ['Local preference', 'Existing pilot at property #1', 'Technical depth'] },
    { name: 'Redwood Community College', contact: 'Tom Bradley', score: 41, temp: 'cold', value: '$38,000', stage: 0, followUp: 'Jun 15', source: 'Trade Show', phone: '(415) 555-0523', email: 'tbradley@redwoodcc.edu', notes: 'Campus safety inquiry. Still in budget planning phase for next fiscal year.', riskFactors: ['No budget yet', 'Long sales cycle', 'Government procurement'], winFactors: ['No incumbent vendor'] },
    { name: 'Marina District Dental', contact: 'Dr. Amy Foster', score: 85, temp: 'hot', value: '$24,800', stage: 4, followUp: '—', source: 'Referral', phone: '(415) 555-0601', email: 'afoster@marinadental.com', notes: 'Won! 8-camera system + alarm. Install scheduled for Jun 20.', riskFactors: [], winFactors: ['Fast close', 'Clear scope'] },
    { name: 'Embarcadero Partners', contact: 'Ryan McCarthy', score: 72, temp: 'warm', value: '$67,500', stage: 2, followUp: 'Jun 9', source: 'LinkedIn', phone: '(415) 555-0698', email: 'rmccarthy@embpartners.com', notes: 'Law office. 3 floors. Needs access control + visitor management integration.', riskFactors: ['IT dept. wants to self-manage'], winFactors: ['Managed service interest', 'High-value per door'] },
  ];

  const lead = leads[selectedLead];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, height: 'calc(100vh - 100px)' }}>
      {/* Left: Kanban Pipeline */}
      <div style={{ overflow: 'auto' }}>
        <SectionHeader title="Sales Pipeline" count={leads.length} actionLabel="+ New Lead" action={() => shieldModal({ kind: 'form', title: 'New Lead', subtitle: 'Add a prospect to the pipeline', submitLabel: 'Create Lead', successMsg: 'Lead added to pipeline', fields: [
          { key: 'company', label: 'Company', placeholder: 'Acme Corp', required: true },
          { key: 'contact', label: 'Contact Name', placeholder: 'Jane Doe', required: true },
          { key: 'phone', label: 'Phone', placeholder: '(415) 555-0100' },
          { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@acme.com' },
          { key: 'value', label: 'Est. Value ($)', type: 'number', placeholder: '50000' },
          { key: 'source', label: 'Source', type: 'select', options: ['Referral','Website','Cold Call','Trade Show','RFP'] },
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What does this prospect need?' }
        ] })} />
        <div style={{ display: 'flex', gap: 12, minWidth: 'max-content', paddingBottom: 8 }}>
          {stages.map((stage, si) => {
            const stageLeads = leads.filter(l => l.stage === si);
            const total = stageLeads.reduce((s, l) => s + parseFloat(l.value.replace(/[^0-9.]/g, '')), 0);
            return (
              <div key={si} style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Stage header */}
                <div style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(63,169,245,0.03)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-high)' }}>{stage.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{stageLeads.length}</span>
                </div>
                {/* Total */}
                {total > 0 && (
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)', padding: '0 4px' }}>
                    ${total.toLocaleString()}
                  </div>
                )}
                {/* Lead cards */}
                {stageLeads.map((l, li) => {
                  const idx = leads.indexOf(l);
                  return (
                    <div key={li}
                      onClick={() => setSelectedLead(idx)}
                      className="glass"
                      style={{
                        padding: 14, cursor: 'pointer',
                        borderColor: idx === selectedLead ? 'var(--border-strong)' : 'var(--border-subtle)',
                        boxShadow: idx === selectedLead ? 'var(--glow-brand-sm)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', marginBottom: 4 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 8 }}>{l.contact}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <StatusBadge status={l.temp} />
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 500 }}>{l.value}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Follow-up: {l.followUp}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{l.source}</span>
                      </div>
                    </div>
                  );
                })}
                {stageLeads.length === 0 && (
                  <div style={{
                    padding: 20, borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)',
                    textAlign: 'center', fontSize: 12, color: 'var(--text-low)'
                  }}>No leads</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Lead Detail + AI Scoring */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <GlassPanel>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-high)' }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{lead.contact}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <DetailField label="Phone" value={lead.phone} mono />
            <DetailField label="Email" value={lead.email} />
            <DetailField label="Est. Value" value={lead.value} mono />
            <DetailField label="Source" value={lead.source} />
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>NOTES</div>
            <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>{lead.notes}</p>
          </div>
        </GlassPanel>

        {/* AI Scoring Panel */}
        <GlassPanel style={{ borderLeft: '3px solid var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>⟡</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Hermes AI Score</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <HealthRing value={lead.score} size={80} strokeWidth={6}
              color={lead.score >= 80 ? 'var(--status-critical)' : lead.score >= 60 ? 'var(--status-warn)' : 'var(--brand)'}
            />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 4 }}>Close Probability</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-high)' }}>{lead.score >= 80 ? '74%' : lead.score >= 60 ? '48%' : '22%'}</div>
            </div>
          </div>

          {/* Breakdown bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Budget Fit', val: lead.score >= 70 ? 85 : 40 },
              { label: 'Engagement', val: lead.score >= 60 ? 78 : 30 },
              { label: 'Timeline', val: lead.score >= 80 ? 90 : lead.score >= 50 ? 55 : 25 },
              { label: 'Authority', val: lead.score >= 70 ? 72 : 45 },
            ].map((b, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{b.label}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{b.val}</span>
                </div>
                <MiniBar value={b.val} color={b.val >= 70 ? 'var(--status-ok)' : b.val >= 45 ? 'var(--status-warn)' : 'var(--status-critical)'} width={280} />
              </div>
            ))}
          </div>

          {/* Risk / Win factors */}
          {lead.winFactors.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div className="label-sm" style={{ marginBottom: 6, color: 'var(--status-ok)' }}>WINNING FACTORS</div>
              {lead.winFactors.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', padding: '2px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--status-ok)' }}>+</span> {f}
                </div>
              ))}
            </div>
          )}
          {lead.riskFactors.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div className="label-sm" style={{ marginBottom: 6, color: 'var(--status-critical)' }}>RISK FACTORS</div>
              {lead.riskFactors.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', padding: '2px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--status-critical)' }}>−</span> {f}
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: 12, padding: 10, borderRadius: 6,
            background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)'
          }}>
            <div className="label-sm" style={{ marginBottom: 4 }}>RECOMMENDED NEXT ACTION</div>
            <p style={{ fontSize: 12, color: 'var(--text-high)', lineHeight: 1.4 }}>
              {lead.score >= 80 ? 'Send final proposal with 5% volume discount. Schedule decision meeting within 48h.' :
               lead.score >= 60 ? 'Follow up with site survey proposal. Share case study from similar industry.' :
               'Nurture with educational content. Re-engage in 30 days when budget cycle begins.'}
            </p>
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8 }}>
            gpt-4o · 892 tokens · $0.006
          </div>
        </GlassPanel>

        {/* Activity Timeline */}
        <GlassPanel>
          <SectionHeader title="Activity Timeline" />
          {[
            { date: 'Jun 4', action: 'Proposal sent — $128,500', type: 'info' },
            { date: 'Jun 2', action: 'Site survey completed — 4 floors mapped', type: 'ok' },
            { date: 'May 29', action: 'Discovery call — 45 min with Sarah + IT Dir.', type: 'info' },
            { date: 'May 25', action: 'Lead created from referral — John Martinez', type: 'info' },
          ].map((a, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '8px 0',
              borderBottom: '1px solid rgba(63,169,245,0.04)'
            }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 50, flexShrink: 0, paddingTop: 2 }}>{a.date}</span>
              <StatusDot status={a.type === 'ok' ? 'online' : 'info'} size={6} />
              <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{a.action}</span>
            </div>
          ))}
        </GlassPanel>

        {/* Email Sequence Status */}
        <GlassPanel>
          <SectionHeader title="Email Sequence" icon="✉" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <StatusBadge status="info" label="Active" />
            <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Enterprise Follow-up (3 of 5)</span>
          </div>
          {[
            { step: 1, label: 'Intro email', status: 'sent', date: 'May 25', open: true },
            { step: 2, label: 'Case study share', status: 'sent', date: 'May 28', open: true },
            { step: 3, label: 'Survey scheduling', status: 'sent', date: 'Jun 2', open: false },
            { step: 4, label: 'Proposal follow-up', status: 'scheduled', date: 'Jun 7', open: null },
            { step: 5, label: 'Decision check-in', status: 'scheduled', date: 'Jun 12', open: null },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.03)' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.status === 'sent' ? 'rgba(52,211,153,0.12)' : 'rgba(63,169,245,0.06)',
                color: s.status === 'sent' ? 'var(--status-ok)' : 'var(--text-low)',
                fontFamily: 'var(--font-mono)'
              }}>{s.status === 'sent' ? '✓' : s.step}</div>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-high)' }}>{s.label}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)' }}>{s.date}</span>
              {s.open !== null && (
                <span style={{ fontSize: 9, color: s.open ? 'var(--status-ok)' : 'var(--status-warn)' }}>
                  {s.open ? 'Opened' : 'No open'}
                </span>
              )}
            </div>
          ))}
        </GlassPanel>

        {/* Revenue Forecast Mini */}
        <GlassPanel>
          <SectionHeader title="Pipeline Forecast" />
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)' }}>$620K</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Total Pipeline</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-subtle)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-ok)' }}>$385K</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>Weighted</div>
            </div>
          </div>
          {['Q2 2026', 'Q3 2026'].map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <span style={{ fontSize: 11, color: 'var(--text-mid)', width: 60 }}>{q}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(63,169,245,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: i === 0 ? '78%' : '35%', height: '100%', background: 'var(--brand)', borderRadius: 3 }} />
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-high)' }}>{i === 0 ? '$486K' : '$134K'}</span>
            </div>
          ))}
        </GlassPanel>
      </div>
    </div>
  );
}

Object.assign(window, { CRMScreen });

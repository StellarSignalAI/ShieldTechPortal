/* Screen — Knowledge Base / Runbooks */

function KnowledgeScreen() {
  const [selected, setSelected] = React.useState(null);
  const [category, setCategory] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const categories = [
    { id: 'all', label: 'All Articles', icon: '◈' },
    { id: 'install', label: 'Installation', icon: '◉' },
    { id: 'troubleshoot', label: 'Troubleshooting', icon: '◎' },
    { id: 'config', label: 'Configuration', icon: '◫' },
    { id: 'compliance', label: 'Compliance', icon: '◷' },
    { id: 'vendor', label: 'Vendor Guides', icon: '◻' },
  ];

  const articles = [
    {
      id: 1, category: 'install', title: 'Axis Camera IP Configuration — Field Guide',
      author: 'Mike Reyes', updated: 'Jun 5, 2026', views: 142, rating: 4.9, readTime: '6 min',
      tags: ['axis', 'ip', 'camera', 'network'],
      summary: 'Step-by-step field guide for configuring Axis P-series cameras on customer networks. Covers default IP, subnet setup, and ONVIF binding.',
      content: `## Overview\nThis guide covers initial IP configuration for Axis cameras on customer LANs.\n\n## Default Credentials\n- IP: 192.168.0.90\n- User: root / pass: (set on first boot)\n\n## Steps\n1. Connect camera directly to laptop via PoE injector\n2. Set laptop IP to 192.168.0.x / 255.255.255.0\n3. Open browser → 192.168.0.90\n4. Set root password on first login\n5. Navigate to System → Network → TCP/IP\n6. Set static IP per customer network plan\n7. Verify ping from NVR before mounting\n\n## Common Issues\n- **Camera not reachable**: Check PoE injector power LED\n- **Login loop**: Factory reset via pinhole (hold 10s)\n- **ONVIF not finding camera**: Ensure same subnet`
    },
    {
      id: 2, category: 'troubleshoot', title: 'NVR Offline — Diagnostic Runbook',
      author: 'Jessica Liu', updated: 'Jun 8, 2026', views: 98, rating: 4.7, readTime: '5 min',
      tags: ['nvr', 'hikvision', 'offline', 'troubleshoot'],
      summary: 'Structured runbook for diagnosing NVR offline incidents. Covers power, network, and storage failure modes.',
      content: `## Triage Steps\n\n### 1. Confirm Outage\n- Check monitoring console for last-seen timestamp\n- Ping NVR IP from remote — if no response, likely power/network\n\n### 2. Power Issues\n- Check UPS battery status via APC Smart Connect\n- If UPS bypassed or failed → dispatch with replacement unit\n- Check circuit breaker at customer site (call front desk)\n\n### 3. Network Issues\n- Check switch port status — is PoE active?\n- Try accessing via backup IP (check asset notes)\n- Remote reboot via managed switch if accessible\n\n### 4. Storage Full\n- Common cause: recording retention set too long\n- Remote in via Hikvision Hik-Connect → Storage → check % full\n- Clear oldest recordings or extend storage plan\n\n### 5. Escalation\n- If unresolved in 30min → dispatch tech\n- P1 if healthcare/bank client`
    },
    {
      id: 3, category: 'config', title: 'HID Access Control — Adding User Credentials',
      author: 'Diana Patel', updated: 'May 30, 2026', views: 76, rating: 4.5, readTime: '4 min',
      tags: ['hid', 'access-control', 'programming'],
      summary: 'How to add, modify, and delete user credentials in the HID controller panel. Covers iCLASS and mobile credentials.',
      content: `## Prerequisites\n- HID controller admin access (IP + password from asset notes)\n- Customer provides: cardholder name, access group, expiry (optional)\n\n## Adding a Credential\n1. Login to HID Admin Portal\n2. Navigate to Cardholders → Add New\n3. Enter first/last name, employee ID\n4. Select Access Group (match to door permissions)\n5. Issue Card: scan physical card OR assign mobile credential\n6. Set Start/End dates if temporary access\n7. Save and test at door\n\n## Bulk Import\n- Use CSV template: Name, CardNumber, AccessGroup, StartDate, EndDate\n- Upload via Cardholders → Import\n\n## Deleting a Credential\n- Cardholders → search name → Edit → Status: Inactive\n- Do NOT delete — deactivate to preserve audit trail`
    },
    {
      id: 4, category: 'compliance', title: 'HIPAA Camera Placement Requirements',
      author: 'John Mitchell', updated: 'Apr 15, 2026', views: 54, rating: 4.8, readTime: '8 min',
      tags: ['hipaa', 'healthcare', 'compliance', 'camera'],
      summary: 'Camera placement rules for healthcare facilities. What areas are allowed, restricted, and how to document compliance.',
      content: `## HIPAA and Surveillance\nHIPAA does not explicitly ban cameras but requires protecting PHI (patient health information).\n\n## Prohibited Areas\n- Patient exam rooms (without explicit consent)\n- Restrooms and changing areas (absolute prohibition)\n- Areas where PHI is displayed (nursing stations — angle away from monitors)\n\n## Allowed Areas\n- Lobbies, waiting rooms, corridors\n- Exterior/parking — no restriction\n- Medication storage rooms (with admin approval)\n\n## Documentation Required\n- Camera placement map signed by facility admin\n- Copy stored in project folder AND asset notes\n- Annual review recommended\n\n## Field Practice\n- When in doubt, angle cameras away from screens/charts\n- Always get written sign-off from hospital administration before install`
    },
    {
      id: 5, category: 'vendor', title: 'Bosch B9512G Panel Programming Reference',
      author: 'Tony Garcia', updated: 'May 20, 2026', views: 89, rating: 4.6, readTime: '10 min',
      tags: ['bosch', 'alarm', 'programming', 'reference'],
      summary: 'Quick reference for Bosch B9512G panel programming: zones, keypads, outputs, communication paths.',
      content: `## Initial Setup\n- Connect laptop via USB or IP\n- Open RPS (Remote Programming Software) — v6.06+\n- Default panel IP: 192.168.0.1 / passcode: 123456 (change immediately)\n\n## Zone Programming\n- Zones → Zone Definitions\n- Zone Type: 1=Standard, 3=24hr, 9=Fire\n- Response time: leave at default 400ms unless requested\n- Assign to Area (usually Area 1 for single-tenant)\n\n## Keypad Assignment\n- Keypads → SDI2 Addresses\n- Address must match physical DIP switch on keypad\n- Assign to Area, set language: English\n\n## Communication Paths\n- Program → Communications\n- Path 1: IP to monitoring center\n- Path 2: Cellular backup (if SIM installed)\n- Test all paths before leaving site: press * 5 6 + code\n\n## Common Mistakes\n- Forgetting to program installer code (lockout risk)\n- Zone EOL resistors — must match panel DIP setting (1k/2.2k/5.6k)`
    },
    {
      id: 6, category: 'troubleshoot', title: 'False Alarm Investigation Checklist',
      author: 'Diana Patel', updated: 'Jun 2, 2026', views: 63, rating: 4.4, readTime: '5 min',
      tags: ['alarm', 'false-alarm', 'troubleshoot'],
      summary: 'Structured checklist for investigating repeated false alarms. Covers PIR sensitivity, HVAC interference, and environmental causes.',
      content: `## Step 1 — Pull Event Log\n- Login to panel remotely or on-site\n- Export last 72h of events\n- Note: zone number, time, temp at time of event\n\n## Step 2 — Environmental Analysis\n- **PIR near HVAC vent?** Warm air causes false triggers — relocate or replace with dual-tech\n- **Sunlight angle?** Check if motion sensor faces east/west window at sunrise/sunset\n- **Spider/insect activity?** Common in warehouse PIRs — clean dome\n\n## Step 3 — Sensitivity Adjustment\n- Most panels: zone sensitivity 1–10 (default 5)\n- Reduce to 3 for test period (24h)\n- Document before/after in ticket\n\n## Step 4 — Temporary Bypass\n- Only bypass if customer approves in writing\n- Note bypass start/end time in incident log\n- Set reminder to unbypass\n\n## Step 5 — Escalation\n- 3+ false alarms/week → schedule on-site inspection\n- Document all findings for police/insurance report`
    },
  ];

  const filtered = articles.filter(a => {
    const matchCat = category === 'all' || a.category === category;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const sel = selected !== null ? articles.find(a => a.id === selected) : null;

  const renderContent = (content) => content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', marginTop: 16, marginBottom: 6, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>{line.slice(3)}</div>;
    if (line.startsWith('### ')) return <div key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginTop: 12, marginBottom: 4 }}>{line.slice(4)}</div>;
    if (line.startsWith('- **')) {
      const match = line.match(/- \*\*(.+?)\*\*(.+)/);
      if (match) return <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, paddingLeft: 12, marginBottom: 2 }}>• <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{match[1]}</span>{match[2]}</div>;
    }
    if (line.match(/^\d+\./)) return <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, paddingLeft: 12, marginBottom: 2 }}>{line}</div>;
    if (line.startsWith('- ')) return <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, paddingLeft: 12, marginBottom: 2 }}>• {line.slice(2)}</div>;
    if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
    return <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 2 }}>{line}</div>;
  });

  const catColors = { install: 'var(--brand)', troubleshoot: 'var(--status-critical)', config: '#c084fc', compliance: 'var(--status-warn)', vendor: 'var(--status-ok)' };

  return (
    <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="glass" style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginBottom: 8 }}>Knowledge Base</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ width: '100%', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-high)', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
              background: category === c.id ? 'rgba(63,169,245,0.08)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              color: category === c.id ? 'var(--brand)' : 'var(--text-mid)', fontSize: 12,
              borderLeft: `2px solid ${category === c.id ? 'var(--brand)' : 'transparent'}`,
              transition: 'all 0.15s', textAlign: 'left'
            }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{c.icon}</span>
              <span>{c.label}</span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-low)', background: 'rgba(63,169,245,0.08)', padding: '1px 5px', borderRadius: 100 }}>{c.id === 'all' ? articles.length : articles.filter(a => a.category === c.id).length}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => shieldModal({ kind: 'form', title: 'New Knowledge Article', subtitle: 'Document a procedure or reference for the team', submitLabel: 'Create Article', successMsg: 'Article saved to Knowledge Base', fields: [
            { key: 'title', label: 'Title', placeholder: 'e.g. Axis Camera IP Configuration', required: true, full: true },
            { key: 'category', label: 'Category', type: 'select', options: ['Installation','Troubleshooting','Configuration','Compliance','Vendor Guides'] },
            { key: 'readTime', label: 'Read Time', placeholder: '5 min' },
            { key: 'tags', label: 'Tags', placeholder: 'axis, ip, camera', full: true },
            { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Write the article…', required: true }
          ] })} style={{ width: '100%', padding: '7px 0', fontSize: 11, fontWeight: 600, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ New Article</button>
        </div>
      </div>

      {/* Article list */}
      <div style={{ width: sel ? 280 : undefined, flex: sel ? undefined : 1, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {filtered.map(a => {
          const cc = catColors[a.category] || 'var(--brand)';
          return (
            <div key={a.id} className="glass" onClick={() => setSelected(selected === a.id ? null : a.id)} style={{
              padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
              border: `1px solid ${selected === a.id ? cc : 'var(--border-subtle)'}`,
              borderLeft: `3px solid ${cc}`,
              boxShadow: selected === a.id ? `0 0 12px ${cc}20` : 'none'
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>{a.summary}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 9, color: cc, background: `${cc}15`, padding: '2px 7px', borderRadius: 100, textTransform: 'capitalize' }}>{a.category}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.author}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>⏱ {a.readTime}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--status-warn)' }}>★ {a.rating}</span>
                <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{a.views} views</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {a.tags.map(t => <span key={t} style={{ fontSize: 9, color: 'var(--text-low)', background: 'rgba(63,169,245,0.06)', padding: '1px 6px', borderRadius: 4 }}>#{t}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Article reader */}
      {sel && (
        <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, animation: 'fade-up 0.15s ease both' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: catColors[sel.category] || 'var(--brand)', background: `${catColors[sel.category] || 'var(--brand)'}15`, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{sel.category}</span>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Updated {sel.updated}</span>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>by {sel.author}</span>
              <button onClick={() => setSelected(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.3 }}>{sel.title}</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {renderContent(sel.content)}
          </div>
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => shieldToast('Editing “' + sel.title + '”', 'info')} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--brand)', background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-strong)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit</button>
            <button onClick={() => shieldToast('Share link copied to clipboard', 'ok')} style={{ padding: '6px 14px', fontSize: 11, color: 'var(--text-mid)', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Share Link</button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-low)' }}>Helpful?</span>
              {['👍', '👎'].map(e => <button key={e} onClick={() => shieldToast('Thanks for your feedback!', 'ok')} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 13 }}>{e}</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { KnowledgeScreen });

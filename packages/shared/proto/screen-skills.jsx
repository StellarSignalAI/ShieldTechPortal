/* Screen — Skills & Certifications Matrix (v2: editable cells) */

function SkillsMatrixScreen() {
  const [matrix, setMatrix] = useShieldStore(skillsStore);
  const [filter, setFilter] = React.useState('all');
  const [highlight, setHighlight] = React.useState(null);

  const techs = [
    { id: 'MR', name: 'Mike Reyes',   role: 'Lead Installer',    color: '#3FA9F5' },
    { id: 'JL', name: 'Jessica Liu',  role: 'Senior Tech',       color: '#34D399' },
    { id: 'KW', name: 'Kevin White',  role: 'Field Technician',  color: '#FBBF24' },
    { id: 'DP', name: 'Diana Patel',  role: 'Field Technician',  color: '#c084fc' },
    { id: 'TG', name: 'Tony Garcia',  role: 'Lead Installer',    color: '#F43F5E' },
    { id: 'AL', name: 'Alex Lee',     role: 'Junior Tech',       color: '#94A3B8' },
  ];

  const skillGroups = [
    { group: 'Camera Systems', color: 'var(--brand)', skills: [
      { id: 'axis-cert',   name: 'Axis Certified',    vendor: 'Axis' },
      { id: 'hik-cert',    name: 'Hikvision Cert',    vendor: 'Hikvision' },
      { id: 'ip-config',   name: 'IP Camera Config',  vendor: 'General' },
      { id: 'nvr-setup',   name: 'NVR/DVR Setup',     vendor: 'General' },
    ]},
    { group: 'Access Control', color: '#c084fc', skills: [
      { id: 'hid-cert',    name: 'HID Certified',     vendor: 'HID' },
      { id: 'lenel-cert',  name: 'Lenel S2 Cert',     vendor: 'Lenel' },
      { id: 'door-hardware',name: 'Door Hardware',    vendor: 'General' },
    ]},
    { group: 'Alarm & Fire', color: 'var(--status-critical)', skills: [
      { id: 'nicet-ii',    name: 'NICET Level II',    vendor: 'NICET' },
      { id: 'bosch-cert',  name: 'Bosch Certified',   vendor: 'Bosch' },
      { id: 'dsc-cert',    name: 'DSC PowerSeries',   vendor: 'DSC' },
      { id: 'fire-panel',  name: 'Fire Panel Config', vendor: 'General' },
    ]},
    { group: 'Networking', color: 'var(--status-warn)', skills: [
      { id: 'network-config',name: 'Network Config',  vendor: 'General' },
      { id: 'poe-install', name: 'PoE Installation',  vendor: 'General' },
      { id: 'fiber-splice',name: 'Fiber Splicing',    vendor: 'General' },
    ]},
    { group: 'Compliance', color: 'var(--status-ok)', skills: [
      { id: 'c7-license',  name: 'CA C-7 License',    vendor: 'State' },
      { id: 'hipaa-aware', name: 'HIPAA Awareness',   vendor: 'Compliance' },
      { id: 'low-voltage', name: 'Low Voltage Cert',  vendor: 'State' },
    ]},
  ];

  const levelStyle = [
    { bg: 'rgba(92,111,134,0.1)',   color: 'var(--text-low)',    border: 'var(--border-subtle)', symbol: '·',  label: 'None' },
    { bg: 'rgba(63,169,245,0.12)',  color: 'var(--brand)',       border: 'rgba(63,169,245,0.3)', symbol: '1',  label: 'Basic' },
    { bg: 'rgba(251,191,36,0.15)',  color: 'var(--status-warn)', border: 'rgba(251,191,36,0.35)',symbol: '2',  label: 'Proficient' },
    { bg: 'rgba(52,211,153,0.18)',  color: 'var(--status-ok)',   border: 'rgba(52,211,153,0.35)',symbol: 'star',label: 'Expert' },
  ];

  const cycleLevel = (techId, skillId) => {
    const current = matrix[techId]?.[skillId] || 0;
    const next = (current + 1) % 4;
    setMatrix(prev => ({ ...prev, [techId]: { ...prev[techId], [skillId]: next } }));
    const levelName = levelStyle[next].label;
    showToast(techId + ': ' + skillId + ' → ' + levelName, next === 0 ? 'info' : next === 3 ? 'ok' : 'info');
  };

  const allSkills = skillGroups.flatMap(g => g.skills);
  const filteredGroups = filter === 'all' ? skillGroups : skillGroups.filter(g => g.group === filter);

  const gapSkills = allSkills.filter(s => {
    const expertCount = techs.filter(t => (matrix[t.id]?.[s.id] || 0) === 3).length;
    return expertCount < 2;
  });

  const techScore = techs.map(t => {
    const vals = allSkills.map(s => matrix[t.id]?.[s.id] || 0);
    const total = vals.reduce((a,b) => a+b, 0);
    return { ...t, score: Math.round((total / (allSkills.length * 3)) * 100) };
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 76px)', gap:12, overflow:'hidden' }}>
      {/* Tech score header */}
      <div style={{ display:'flex', gap:10, alignItems:'stretch', flexShrink:0 }}>
        {techScore.map(t => (
          <div key={t.id} className="glass" style={{ flex:1, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(63,169,245,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:t.color, margin:'0 auto 5px', border:'1px solid '+t.color+'40' }}>{t.id}</div>
            <div style={{ fontSize:10, fontWeight:500, color:'var(--text-high)', marginBottom:2 }}>{t.name.split(' ')[0]}</div>
            <div className="mono" style={{ fontSize:14, fontWeight:700, color:t.score>=80?'var(--status-ok)':t.score>=60?'var(--status-warn)':'var(--brand)' }}>{t.score}%</div>
            <div style={{ height:3, background:'rgba(63,169,245,0.08)', borderRadius:2, overflow:'hidden', marginTop:4 }}>
              <div style={{ width:t.score+'%', height:'100%', background:t.score>=80?'var(--status-ok)':t.score>=60?'var(--status-warn)':'var(--brand)', borderRadius:2, transition:'width 0.4s ease' }} />
            </div>
          </div>
        ))}
        {gapSkills.length > 0 && (
          <div className="glass" style={{ padding:'10px 14px', borderLeft:'3px solid var(--status-warn)', maxWidth:260 }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--status-warn)', marginBottom:5 }}>warn {gapSkills.length} Skills Need 2+ Experts</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {gapSkills.slice(0,8).map(s => (
                <span key={s.id} style={{ fontSize:9, color:'var(--status-warn)', background:'rgba(251,191,36,0.1)', padding:'2px 7px', borderRadius:100 }}>{s.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend + filter */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:10, color:'var(--text-low)' }}>Click any cell to cycle proficiency:</span>
        {levelStyle.map((l,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:16, height:16, borderRadius:3, background:l.bg, border:'1px solid '+l.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:l.color, fontWeight:700 }}>{l.symbol}</div>
            <span style={{ fontSize:10, color:l.color }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:2, background:'rgba(63,169,245,0.06)', borderRadius:7, padding:3, border:'1px solid var(--border-subtle)' }}>
          {['all','Camera Systems','Access Control','Alarm & Fire','Networking','Compliance'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'3px 10px', borderRadius:5, fontSize:10, fontFamily:'var(--font-body)', border:'none', cursor:'pointer', background:filter===f?'rgba(63,169,245,0.18)':'transparent', color:filter===f?'var(--brand)':'var(--text-low)', fontWeight:filter===f?600:400, transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {f==='all'?'All':f}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead>
            <tr>
              <th style={{ padding:'8px 12px', textAlign:'left', fontSize:10, color:'var(--text-low)', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', borderBottom:'1px solid var(--border-subtle)', position:'sticky', top:0, background:'var(--card)', zIndex:2, whiteSpace:'nowrap' }}>Skill / Vendor</th>
              {techs.map(t => (
                <th key={t.id} style={{ padding:'8px 10px', textAlign:'center', fontSize:10, color:t.color, fontWeight:700, borderBottom:'1px solid var(--border-subtle)', position:'sticky', top:0, background:'var(--card)', zIndex:2 }}>{t.id}</th>
              ))}
              <th style={{ padding:'8px 10px', position:'sticky', top:0, background:'var(--card)', zIndex:2, borderBottom:'1px solid var(--border-subtle)' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map(group => (
              <React.Fragment key={group.group}>
                <tr>
                  <td colSpan={techs.length+2} style={{ padding:'10px 12px 4px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:group.color, background:'rgba(63,169,245,0.03)', borderTop:'1px solid var(--border-subtle)' }}>{group.group}</td>
                </tr>
                {group.skills.map(skill => {
                  const vals = techs.map(t => matrix[t.id]?.[skill.id] || 0);
                  const expertCount = vals.filter(v => v===3).length;
                  const isGap = expertCount < 2;
                  return (
                    <tr key={skill.id} onMouseEnter={() => setHighlight(skill.id)} onMouseLeave={() => setHighlight(null)} style={{ background:highlight===skill.id?'rgba(63,169,245,0.04)':'transparent', transition:'background 0.1s' }}>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'var(--text-high)', borderBottom:'1px solid rgba(63,169,245,0.05)', whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          {skill.name}
                          {isGap && <span style={{ fontSize:8, color:'var(--status-warn)', background:'rgba(251,191,36,0.1)', padding:'1px 5px', borderRadius:4 }}>gap</span>}
                        </div>
                        <div style={{ fontSize:9, color:'var(--text-low)' }}>{skill.vendor}</div>
                      </td>
                      {techs.map(t => {
                        const level = matrix[t.id]?.[skill.id] || 0;
                        const ls = levelStyle[level];
                        return (
                          <td key={t.id} style={{ padding:'6px 8px', textAlign:'center', borderBottom:'1px solid rgba(63,169,245,0.05)' }}>
                            <div
                              onClick={() => cycleLevel(t.id, skill.id)}
                              title={'Click to change — current: ' + ls.label}
                              style={{ width:28, height:28, borderRadius:6, margin:'0 auto', background:ls.bg, border:'1px solid '+ls.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:ls.color, cursor:'pointer', transition:'all 0.15s', userSelect:'none' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.boxShadow = '0 0 8px '+ls.color+'60'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                              {ls.symbol}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding:'6px 8px', borderBottom:'1px solid rgba(63,169,245,0.05)' }}>
                        <div style={{ display:'flex', gap:2 }}>
                          {vals.map((v,vi) => <div key={vi} style={{ width:4, height:16, borderRadius:2, background:v===0?'rgba(63,169,245,0.08)':v===1?'rgba(63,169,245,0.4)':v===2?'var(--status-warn)':'var(--status-ok)' }} />)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { SkillsMatrixScreen });

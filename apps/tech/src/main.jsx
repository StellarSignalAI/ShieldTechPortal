/* ShieldTech Technician App — entry. The vendored Technician App shell lands in WS1;
   this boot screen proves the domain + build pipeline end-to-end. */
import '@shared/globals.js';
import '@shared/styles/styles.css';
import '@shared/supabase.js';

const React = window.React;
const ReactDOM = window.ReactDOM;

function Boot() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
      <div className="glass" style={{ padding: '48px 56px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 48, objectFit: 'contain' }} />
        <div style={{ font: '600 13px/1.4 var(--font-body)', color: 'var(--text-mid)', marginTop: 18 }}>Technician App</div>
        <div style={{ font: '500 11px/1.4 var(--font-mono)', color: 'var(--text-low)', marginTop: 8 }}>Surface build in progress</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Boot />);

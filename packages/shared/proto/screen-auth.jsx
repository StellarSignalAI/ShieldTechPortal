/* Auth surfaces — ShieldAuthGate (per-app session + rights gate),
   ChangePasswordScreen (forced on first login / recovery links),
   AccessDeniedScreen, and the Admin → Users & Invites screen.
   Uses window.__shieldAuth from packages/shared/auth.js. */

const authInput = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(5,7,10,0.6)', border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
};
const authLabel = {
  display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6,
};
const authPrimaryBtn = {
  width: '100%', padding: '12px', background: 'var(--brand)', border: 'none',
  borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
  boxShadow: '0 0 20px -4px rgba(63,169,245,0.4)',
};

function AuthCardFrame({ children }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,7,10,0.8) 100%)' }} />
      <div style={{
        position: 'relative', zIndex: 2, width: 400, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '44px 40px',
        boxShadow: '0 0 60px -20px rgba(63,169,245,0.15), 0 24px 48px -12px rgba(0,0,0,0.5)',
        animation: 'fade-up 0.5s ease both',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech" style={{ height: 48, objectFit: 'contain' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Forced password change (first login / recovery link) ── */
function ChangePasswordScreen() {
  const [pw1, setPw1] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const submit = async () => {
    setErr('');
    if (pw1.length < 10) { setErr('Use at least 10 characters.'); return; }
    if (pw1 !== pw2) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await window.__shieldAuth.changePassword(pw1);
    setBusy(false);
    if (error) setErr(error.message);
    else showToast('Password updated — welcome to ShieldTech', 'ok');
  };
  return (
    <AuthCardFrame>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)', textAlign: 'center', marginBottom: 6 }}>Set your password</div>
      <div style={{ fontSize: 12, color: 'var(--text-low)', textAlign: 'center', marginBottom: 22, lineHeight: 1.5 }}>Choose a new password to replace your temporary one.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={authLabel}>New password</label>
          <input type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="At least 10 characters" style={authInput} /></div>
        <div><label style={authLabel}>Confirm password</label>
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Repeat it" style={authInput} /></div>
        {err && <div style={{ fontSize: 12, color: 'var(--status-critical)' }}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{ ...authPrimaryBtn, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Save & continue'}</button>
        <button onClick={() => window.__shieldAuth.signOut()} style={{ background: 'none', border: 'none', color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Sign out</button>
      </div>
    </AuthCardFrame>
  );
}

/* ── App-rights denial ── */
function AccessDeniedScreen({ appId }) {
  const u = window.__shieldUser || {};
  return (
    <AuthCardFrame>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-high)', textAlign: 'center', marginBottom: 8 }}>No access to this application</div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
        {u.email || 'Your account'} isn't authorized for the <strong>{appId}</strong> app.
        Ask a ShieldTech admin to grant access from Users &amp; Invites.
      </div>
      <button onClick={() => window.__shieldAuth.signOut()} style={authPrimaryBtn}>Sign in as someone else</button>
    </AuthCardFrame>
  );
}

/* ── Per-app gate ── */
function ShieldAuthGate({ appId, children }) {
  const [snap, setSnap] = React.useState(() => window.__shieldAuth ? window.__shieldAuth.authState() : { configured: false });
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    if (!window.__shieldAuth) return;
    return window.__shieldAuth.onAuthChange(s => { setSnap({ ...s }); force(); });
  }, []);

  if (!snap.configured) { window.__shieldAuthed = true; return children; }
  if (snap.loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(63,169,245,0.3)', borderTopColor: 'var(--brand)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }
  if (!snap.session) { window.__shieldAuthed = false; return <LoginScreen />; }
  const u = window.__shieldUser || {};
  if (snap.recovery || u.mustChangePassword) return <ChangePasswordScreen />;
  if (!window.__shieldAuth.hasAppRight(appId)) return <AccessDeniedScreen appId={appId} />;
  window.__shieldAuthed = true;
  return children;
}

/* ── Admin → Users & Invites ── */
const AU_APPS = [['portal', 'Portal'], ['tech', 'Tech App'], ['customer', 'Customer Portal']];
const AU_ROLE_DEFAULT_RIGHTS = {
  Admin: { portal: true, tech: true, customer: true },
  Staff: { portal: true, tech: true, customer: false },
  Technician: { portal: false, tech: true, customer: false },
  Client: { portal: false, tech: false, customer: true },
};

function UsersScreen() {
  const configured = Boolean(window.__shieldSupabaseConfigured);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(configured);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('Client');
  const [rights, setRights] = React.useState(AU_ROLE_DEFAULT_RIGHTS.Client);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    const { data } = await window.__shieldSupabase
      .from('profiles')
      .select('id,email,name,role,app_rights,must_change_password,created_at')
      .order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, [configured]);
  React.useEffect(() => { load(); }, [load]);

  const setRoleAndDefaults = (r) => { setRole(r); setRights(AU_ROLE_DEFAULT_RIGHTS[r]); };

  const invite = async () => {
    if (!configured) { showToast('Connect Supabase first — see OUTSTANDING-APIS.md', 'warn'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showToast('Enter a valid email', 'warn'); return; }
    setBusy(true); setResult(null);
    const { data, error } = await window.__shieldSupabase.functions.invoke('invite-user', {
      body: { email: email.trim(), name: name.trim(), role, app_rights: rights },
    });
    setBusy(false);
    if (error || !data || !data.ok) {
      showToast((data && data.error) || (error && error.message) || 'Invite failed', 'error');
      return;
    }
    setResult(data.data);
    setEmail(''); setName('');
    showToast(data.data.emailed ? `Invite emailed to ${data.data.email}` : 'User created — hand over the temporary password below', 'ok');
    load();
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 className="display" style={{ fontSize: 22, fontWeight: 300, color: 'var(--text-high)' }}>Users &amp; Invites</h1>
        <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>
          shieldtechsolutions.com Google accounts sign in automatically. Everyone else must be invited here — they get a temporary password by email and set their own on first login.
        </div>
      </div>

      {/* Invite form */}
      <GlassPanel style={{ padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: 14 }}>Invite a user</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr', gap: 12, marginBottom: 12 }}>
          <div><label style={authLabel}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com" style={authInput} /></div>
          <div><label style={authLabel}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={authInput} /></div>
          <div><label style={authLabel}>Role</label>
            <select value={role} onChange={e => setRoleAndDefaults(e.target.value)} style={{ ...authInput, appearance: 'none' }}>
              {['Admin', 'Staff', 'Technician', 'Client'].map(r => <option key={r} value={r}>{r}</option>)}
            </select></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>App access</span>
          {AU_APPS.map(([id, label]) => (
            <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-high)', cursor: 'pointer' }}>
              <input type="checkbox" checked={Boolean(rights[id])} onChange={e => setRights(r => ({ ...r, [id]: e.target.checked }))} style={{ accentColor: 'var(--brand)', width: 15, height: 15 }} />
              {label}
            </label>
          ))}
          <button onClick={invite} disabled={busy} style={{ marginLeft: 'auto', padding: '10px 22px', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: busy ? 0.7 : 1 }}>{busy ? 'Inviting…' : 'Send invite'}</button>
        </div>
        {result && result.temp_password && (
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)', fontSize: 12, color: 'var(--text-high)' }}>
            Email delivery isn't configured yet — share these credentials securely (shown once):<br />
            <span className="mono">{result.email}</span> · temporary password <span className="mono" style={{ color: 'var(--status-warn)', fontWeight: 700 }}>{result.temp_password}</span>
          </div>
        )}
        {!configured && (
          <div style={{ fontSize: 11, color: 'var(--status-warn)' }}>Supabase isn't connected — invites go live once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set.</div>
        )}
      </GlassPanel>

      {/* User list */}
      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-low)' }}>Platform users</span>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-low)' }}>{rows.length}</span>
        </div>
        {loading && <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>Loading…</div>}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>
            {configured ? 'No users yet — send the first invite above.' : 'User list appears here once Supabase is connected.'}
          </div>
        )}
        {rows.map(r => (
          <div key={r.email} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(63,169,245,0.05)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(r.name || r.email).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)' }}>{r.name || r.email}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-low)' }}>{r.email}</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: r.role === 'Admin' ? 'var(--status-critical)' : 'var(--brand)', background: 'rgba(63,169,245,0.08)', borderRadius: 8, padding: '3px 10px' }}>{r.role.toUpperCase()}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-low)', width: 170, textAlign: 'right' }}>
              {AU_APPS.filter(([id]) => r.app_rights && r.app_rights[id]).map(([, l]) => l).join(' · ') || 'no apps'}
            </span>
            {r.must_change_password && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--status-warn)', background: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: '3px 9px' }}>TEMP PW</span>}
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

Object.assign(window, { ShieldAuthGate, ChangePasswordScreen, AccessDeniedScreen, UsersScreen });

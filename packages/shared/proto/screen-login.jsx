/* Screen 1 — Login / Sign-in (ShieldTech dark design language)

   One shared credential screen rendered by ShieldAuthGate for EVERY app
   (portal, tech, customer, sales) and on mobile, so the sign-in experience is
   identical everywhere. The palette is hardcoded dark-indigo (independent of
   each app's light/dark theme) so the credential page always matches. */

function LoginScreen() {
  const [signingIn, setSigningIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [note, setNote] = React.useState(null); // inline status — the login screen has no toast host
  const configured = Boolean(window.__shieldSupabaseConfigured && window.__shieldAuth);

  // ── Design tokens (hardcoded so the credential page is identical across apps/themes)
  const F = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, monospace";
  const SCR = '#060410', CARD = '#0C0A14';
  const BORDER = 'rgba(255,255,255,0.08)', BORDER_STRONG = 'rgba(255,255,255,0.16)';
  const FG = '#FAFAFB', FG2 = '#A1A0A6', FG3 = '#656365';
  const ACCENT = '#6366F1', ACCENT_HOVER = '#7D7CF5', ACCENT_GLOW = 'rgba(99,102,241,0.55)';

  const toast = (msg, type) => {
    setNote({ msg, type: type || 'ok' });
    window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg, type: type || 'ok' } }));
  };

  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    if (!configured) {
      setTimeout(() => {
        if (window.__shieldNav) window.__shieldNav('custom-dashboard');
      }, 750);
      return;
    }
    const { error } = await window.__shieldAuth.signInWithPassword(email.trim(), password);
    setSigningIn(false);
    if (error) { toast(error.message || 'Sign-in failed', 'error'); return; }
    await offerPasskeySetup();
    if (window.__shieldNav) window.__shieldNav('custom-dashboard');
  };

  // After a successful email sign-in, offer to set up a passkey once (per
  // device) so future logins are one-tap Face ID / Touch ID with no password.
  const offerPasskeySetup = async () => {
    try {
      const pk = window.__shieldPasskey;
      if (!configured || !pk || !pk.supported || !pk.supported()) return;
      if (localStorage.getItem('st2:passkey-offered')) return;
      localStorage.setItem('st2:passkey-offered', '1');
      if (!window.confirm('Set up a passkey on this device? Next time you can sign in with just Face ID / Touch ID — no password or email.')) return;
      setNote({ msg: 'Confirm with Face ID / Touch ID to create your passkey…', type: 'info' });
      const r = await pk.createPasskey('This device');
      setNote(r.ok ? { msg: 'Passkey saved — tap “Sign in with a passkey” next time.', type: 'ok' } : { msg: r.error || 'Could not set up passkey', type: 'warn' });
    } catch { /* non-fatal */ }
  };

  const handleGoogle = async () => {
    if (!configured) { toast('Google sign-in goes live once Supabase is connected', 'warn'); return; }
    const { error } = await window.__shieldAuth.signInWithGoogle();
    if (error) toast(error.message, 'error');
  };

  const handlePasskey = async () => {
    if (!configured || !window.__shieldPasskey) { toast('Passkeys go live once Supabase is connected', 'warn'); return; }
    if (!window.__shieldPasskey.supported || !window.__shieldPasskey.supported()) { toast('This browser can’t use passkeys — sign in with email/password', 'warn'); return; }
    // Usernameless: no email needed. The device offers its passkey directly.
    setSigningIn(true);
    setNote({ msg: 'Choose your passkey and confirm with Face ID / Touch ID…', type: 'info' });
    const r = await window.__shieldPasskey.signInWithPasskey(email.trim() || undefined);
    setSigningIn(false);
    if (!r.ok) { toast(r.error || 'Passkey sign-in failed', 'error'); return; }
    if (window.__shieldNav) window.__shieldNav('custom-dashboard');
  };

  const handleForgot = async () => {
    if (!configured) { toast('Password reset link sent to your email.'); return; }
    if (!email.trim()) { toast('Enter your email above first', 'warn'); return; }
    const { error } = await window.__shieldAuth.requestPasswordReset(email.trim());
    if (error) toast(error.message, 'error');
    else toast('Password reset link sent to ' + email.trim());
  };

  const label = {
    display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase',
    letterSpacing: '0.12em', color: FG3, marginBottom: 7, fontFamily: MONO,
  };
  const input = {
    width: '100%', padding: '12px 14px', background: SCR,
    border: `1px solid ${BORDER_STRONG}`, borderRadius: 12, color: FG,
    fontSize: 14, fontFamily: F, outline: 'none',
    transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
  };
  const onInFocus = (e) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.18)`; };
  const onInBlur = (e) => { e.target.style.borderColor = BORDER_STRONG; e.target.style.boxShadow = 'none'; };
  const secondaryBtn = {
    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${BORDER}`, borderRadius: 12, color: FG,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: F,
    transition: 'border-color 0.16s ease, background 0.16s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1, overflow: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      fontFamily: F, color: FG,
      background: `
        radial-gradient(75% 48% at 50% -8%, #6E3AA6 0%, transparent 60%),
        radial-gradient(60% 46% at 92% 100%, #84329E 0%, transparent 58%),
        radial-gradient(52% 42% at 4% 86%, #3A2597 0%, transparent 60%),
        ${SCR}`,
    }}>
      {/* faint grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
        background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 44px)',
        maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 78%)',
      }} />

      {/* Login card */}
      <div style={{
        position: 'relative', zIndex: 2, width: 'min(400px, 100%)',
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24,
        padding: '40px clamp(22px, 7vw, 36px)',
        boxShadow: '0 0 70px -24px rgba(99,102,241,0.35), 0 30px 60px -18px rgba(0,0,0,0.7)',
        animation: 'fade-up 0.6s ease both',
      }}>
        {/* Top sheen */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${ACCENT_GLOW}, transparent)`,
          borderRadius: '24px 24px 0 0',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ display: 'inline-flex', animation: 'fade-up 0.6s ease 0.1s both' }}>
            <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech"
              style={{ height: 52, objectFit: 'contain' }} />
          </div>
          <p style={{
            fontSize: 10, color: FG3, marginTop: 10, letterSpacing: '0.16em',
            textTransform: 'uppercase', fontFamily: MONO,
            animation: 'fade-up 0.6s ease 0.3s both',
          }}>Unified Security Operations</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ animation: 'fade-up 0.5s ease 0.35s both' }}>
            <label style={label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@shieldtechsolutions.com" style={input}
              onFocus={onInFocus} onBlur={onInBlur} />
          </div>

          <div style={{ animation: 'fade-up 0.5s ease 0.4s both' }}>
            <label style={label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="••••••••••" style={input}
              onFocus={onInFocus} onBlur={onInBlur} />
          </div>

          <button onClick={handleSignIn} disabled={signingIn} style={{
            width: '100%', padding: '13px', background: ACCENT, border: 'none',
            borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: signingIn ? 'wait' : 'pointer', fontFamily: F, opacity: signingIn ? 0.85 : 1,
            boxShadow: `0 10px 24px -8px ${ACCENT_GLOW}`,
            transition: 'background 0.16s ease, box-shadow 0.16s ease, transform 0.07s ease',
            animation: 'fade-up 0.5s ease 0.45s both',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => { if (!signingIn) { e.currentTarget.style.background = ACCENT_HOVER; e.currentTarget.style.boxShadow = `0 12px 30px -8px ${ACCENT_GLOW}`; } }}
          onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.boxShadow = `0 10px 24px -8px ${ACCENT_GLOW}`; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {signingIn && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
            {signingIn ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0', animation: 'fade-up 0.5s ease 0.47s both' }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: FG3, fontFamily: MONO }}>or</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          <button onClick={handleGoogle} style={{ ...secondaryBtn, animation: 'fade-up 0.5s ease 0.48s both' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_STRONG; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <button onClick={handlePasskey} style={{ ...secondaryBtn, animation: 'fade-up 0.5s ease 0.49s both' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_STRONG; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18v3h3l7.5-7.5"/><circle cx="16.5" cy="7.5" r="4.5"/><path d="M12.5 11.5 15 14"/></svg>
            Sign in with a passkey
          </button>

          {note && (
            <div style={{
              padding: '10px 12px', borderRadius: 12, fontSize: 12, lineHeight: 1.4, textAlign: 'center',
              background: note.type === 'error' ? 'rgba(244,63,94,0.10)' : note.type === 'warn' ? 'rgba(251,191,36,0.10)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${note.type === 'error' ? 'rgba(244,63,94,0.3)' : note.type === 'warn' ? 'rgba(251,191,36,0.3)' : 'rgba(99,102,241,0.3)'}`,
              color: note.type === 'error' ? '#FF6B6B' : note.type === 'warn' ? '#FBBF24' : FG,
            }}>{note.msg}</div>
          )}

          <div style={{ textAlign: 'center', animation: 'fade-up 0.5s ease 0.5s both' }}>
            <button onClick={handleForgot} style={{
              color: ACCENT_HOVER, fontSize: 12, opacity: 0.9, transition: 'opacity 0.2s',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: F,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}
            >Forgot password?</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 28, paddingTop: 18, borderTop: `1px solid ${BORDER}`,
          textAlign: 'center', animation: 'fade-up 0.5s ease 0.55s both',
        }}>
          <p style={{ fontSize: 10, color: FG3, lineHeight: 1.6, fontFamily: MONO, letterSpacing: '0.04em' }}>
            Protected by 256-bit encryption<br />
            <span style={{ opacity: 0.6 }}>v5.0 · ShieldTech AI Online</span>
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });

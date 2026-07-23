/* Screen 1 — Login / Sign-in */

function LoginScreen() {
  const canvasRef = React.useRef(null);
  const [signingIn, setSigningIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const configured = Boolean(window.__shieldSupabaseConfigured && window.__shieldAuth);

  const toast = (msg, type) => window.dispatchEvent(new CustomEvent('shield:toast', { detail: { msg, type: type || 'ok' } }));

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
    if (window.__shieldNav) window.__shieldNav('custom-dashboard');
  };

  const handleGoogle = async () => {
    if (!configured) { toast('Google sign-in goes live once Supabase is connected', 'warn'); return; }
    const { error } = await window.__shieldAuth.signInWithGoogle();
    if (error) toast(error.message, 'error');
  };

  const handlePasskey = async () => {
    if (!configured || !window.__shieldPasskey) { toast('Passkeys go live once Supabase is connected', 'warn'); return; }
    if (!email.trim()) { toast('Enter your email above first', 'warn'); return; }
    setSigningIn(true);
    const r = await window.__shieldPasskey.signInWithPasskey(email.trim());
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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let angle = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(63,169,245,0.04)';
      ctx.lineWidth = 0.5;
      const gs = 40;
      const offX = (performance.now() / 80) % gs;
      const offY = (performance.now() / 120) % gs;
      for (let x = -gs + offX; x < w + gs; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = -gs + offY; y < h + gs; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Topo rings
      const cx = w / 2, cy = h / 2;
      for (let r = 60; r < 500; r += 50) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(63,169,245,${0.03 - r * 0.00005})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Radar sweep
      angle += 0.008;
      const gradient = ctx.createConicalGradient ? null : null;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 400, 0, Math.PI * 0.4);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 300, 0);
      g.addColorStop(0, 'rgba(63,169,245,0.06)');
      g.addColorStop(1, 'rgba(63,169,245,0)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      // Dots
      const t = performance.now() / 1000;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.2;
        const r2 = 180 + Math.sin(t + i) * 30;
        const dx = cx + Math.cos(a) * r2;
        const dy = cy + Math.sin(a) * r2;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(63,169,245,${0.3 + Math.sin(t * 2 + i) * 0.15})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--canvas)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', zIndex: 1
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,7,10,0.8) 100%)'
      }} />

      {/* Login card */}
      <div style={{
        position: 'relative', zIndex: 2, width: 400,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 40px',
        boxShadow: '0 0 60px -20px rgba(63,169,245,0.15), 0 24px 48px -12px rgba(0,0,0,0.5)',
        animation: 'fade-up 0.6s ease both'
      }}>
        {/* Top highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', animation: 'fade-up 0.6s ease 0.1s both' }}>
            <img src="uploads/ShieldTech Logo Transparent MK3.png" alt="ShieldTech"
              style={{ height: 56, objectFit: 'contain' }} />
          </div>
          <p style={{
            fontSize: 12, color: 'var(--text-low)', marginTop: 6, letterSpacing: '0.04em',
            animation: 'fade-up 0.6s ease 0.3s both'
          }}>Unified Security Operations Platform</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ animation: 'fade-up 0.5s ease 0.35s both' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6
            }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@shieldtech.com" style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(5,7,10,0.6)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
              fontSize: 14, fontFamily: 'var(--font-body)',
              outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = 'var(--glow-brand-sm)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ animation: 'fade-up 0.5s ease 0.4s both' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-low)', marginBottom: 6
            }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} placeholder="••••••••••" style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(5,7,10,0.6)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
              fontSize: 14, fontFamily: 'var(--font-body)',
              outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = 'var(--glow-brand-sm)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button onClick={handleSignIn} disabled={signingIn} style={{
            width: '100%', padding: '12px',
            background: 'var(--brand)', border: 'none',
            borderRadius: 'var(--radius-sm)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: signingIn ? 'wait' : 'pointer',
            fontFamily: 'var(--font-body)', opacity: signingIn ? 0.8 : 1,
            boxShadow: '0 0 20px -4px rgba(63,169,245,0.4)',
            transition: 'all 0.2s', animation: 'fade-up 0.5s ease 0.45s both',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
          onMouseEnter={e => { if (!signingIn) { e.currentTarget.style.background = 'var(--brand-hover)'; e.currentTarget.style.boxShadow = '0 0 30px -4px rgba(63,169,245,0.5)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 0 20px -4px rgba(63,169,245,0.4)'; }}
          >
            {signingIn && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
            {signingIn ? 'Signing in…' : 'Sign In'}
          </button>

          <button onClick={handleGoogle} style={{
            width: '100%', padding: '11px',
            background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            animation: 'fade-up 0.5s ease 0.48s both'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <button onClick={handlePasskey} style={{
            width: '100%', padding: '11px',
            background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-high)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            animation: 'fade-up 0.5s ease 0.49s both'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18v3h3l7.5-7.5"/><circle cx="16.5" cy="7.5" r="4.5"/><path d="M12.5 11.5 15 14"/></svg>
            Sign in with a passkey
          </button>

          <div style={{
            textAlign: 'center', animation: 'fade-up 0.5s ease 0.5s both'
          }}>
            <button onClick={handleForgot} style={{
              color: 'var(--brand)', fontSize: 12, textDecoration: 'none',
              opacity: 0.8, transition: 'opacity 0.2s',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
            >Forgot password?</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 32, paddingTop: 20,
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center', animation: 'fade-up 0.5s ease 0.55s both'
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>
            Protected by 256-bit encryption<br />
            <span className="mono" style={{ fontSize: 10, opacity: 0.6 }}>v4.2.1 · ShieldTech AI Online</span>
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });

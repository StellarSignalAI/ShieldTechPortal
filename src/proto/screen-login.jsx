/* Screen 1 — Login / Sign-in */

function LoginScreen() {
  const canvasRef = React.useRef(null);
  const [signingIn, setSigningIn] = React.useState(false);

  const handleSignIn = () => {
    if (signingIn) return;
    setSigningIn(true);
    setTimeout(() => {
      if (window.__shieldNav) window.__shieldNav('custom-dashboard');
    }, 750);
  };

  const handleForgot = () => {
    window.dispatchEvent(new CustomEvent('shield:toast', {
      detail: { msg: 'Password reset link sent to your email.', type: 'ok' }
    }));
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
      width: '100vw', height: '100vh', background: 'var(--canvas)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden'
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
            <ShieldLogo size={48} />
          </div>
          <h1 className="display" style={{
            fontSize: 22, fontWeight: 200, letterSpacing: '0.1em',
            color: 'var(--text-high)', marginTop: 16, animation: 'fade-up 0.6s ease 0.2s both'
          }}>SHIELDTECH</h1>
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
            <input type="email" placeholder="operator@shieldtech.com" style={{
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
            <input type="password" placeholder="••••••••••" style={{
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
            <span className="mono" style={{ fontSize: 10, opacity: 0.6 }}>v4.2.1 · Hermes AI Online</span>
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });

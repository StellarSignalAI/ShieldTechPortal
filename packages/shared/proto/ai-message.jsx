/* AIMessage — renders a ShieldTech AI reply, turning ```mermaid fenced blocks
   into real diagrams (mermaid is lazy-loaded on first diagram so it never
   weighs down initial load). Everything else renders as plain text. Exposed as
   window.AIMessage so every AI chat surface (portal/tech/customer/mobile) can
   use it. */

let _mermaidPromise = null;
function loadMermaid() {
  if (!_mermaidPromise) {
    _mermaidPromise = import('mermaid').then(m => {
      const mermaid = m.default || m;
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict', fontFamily: 'inherit' });
      return mermaid;
    });
  }
  return _mermaidPromise;
}

function MermaidDiagram({ code }) {
  const ref = React.useRef(null);
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    let alive = true;
    loadMermaid().then(async (mermaid) => {
      try {
        const id = 'mmd-' + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, code.trim());
        if (alive && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (alive) setErr(String(e && e.message ? e.message : e));
      }
    });
    return () => { alive = false; };
  }, [code]);
  if (err) {
    return (
      <div style={{ margin: '8px 0', padding: 10, borderRadius: 8, background: 'rgba(5,7,10,0.55)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10, color: 'var(--status-warn)', marginBottom: 4 }}>Diagram couldn't render — showing source</div>
        <pre style={{ margin: 0, fontSize: 11, color: 'var(--text-mid)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>{code}</pre>
      </div>
    );
  }
  return <div ref={ref} className="ai-mermaid" style={{ margin: '10px 0', overflowX: 'auto', textAlign: 'center' }} />;
}

/* Split a reply into text + mermaid segments and render each. */
function AIMessage({ content }) {
  const text = String(content == null ? '' : content);
  const segments = [];
  const re = /```mermaid\s*([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ t: 'text', v: text.slice(last, m.index) });
    segments.push({ t: 'mermaid', v: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });
  if (segments.length === 0) segments.push({ t: 'text', v: text });

  return (
    <>
      {segments.map((s, i) => s.t === 'mermaid'
        ? <MermaidDiagram key={i} code={s.v} />
        : (s.v.trim() ? <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{s.v}</span> : null))}
    </>
  );
}

Object.assign(window, { AIMessage, MermaidDiagram });

/* Finance Payments — Payments & Links (real) + AI Copilot */

/* ── Payments & Links ──
   REAL surface for collections: connection lights (Stripe / email), the live
   payment-link ledger from invoice_links, and connect instructions. The old
   fake Stripe dashboard (fabricated payments, cards, disputes) was removed. */
function FinanceStripe() {
  const [conn, setConn] = React.useState(null);        // {stripe, resend}
  const [links, setLinks] = React.useState(null);
  const refresh = React.useCallback(() => {
    const p = window.__shieldPay; if (!p) { setConn(false); setLinks([]); return; }
    p.status().then(r => setConn(r && r.ok ? { stripe: r.stripe, resend: r.resend } : false));
    p.list().then(r => setLinks(r && r.ok ? r.data : []));
  }, []);
  React.useEffect(() => { refresh(); if (window.__shieldPay) window.__shieldPay.applyPayments().then(() => refresh()); }, [refresh]);

  const light = (on, labelOn, labelOff) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? 'var(--status-ok)' : 'var(--status-warn)', boxShadow: on ? '0 0 8px var(--status-ok)' : 'none' }} />
      <span style={{ fontSize: 12, color: on ? 'var(--text-high)' : 'var(--text-mid)' }}>{on ? labelOn : labelOff}</span>
    </div>
  );
  const money = (n) => '$' + (Number(n) || 0).toLocaleString();

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <GlassPanel>
        <SectionHeader title="Payment collection status" icon="⊛" />
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', margin: '10px 0 4px' }}>
          {conn === null ? <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Checking…</span> : <>
            {light(conn && conn.stripe, 'Stripe connected — pay links include secure checkout', 'Stripe not connected — pay pages show remit-by-check until keys are added')}
            {light(conn && conn.resend, 'Email sending live (Resend)', 'Email backend not configured')}
          </>}
        </div>
        {conn !== null && !(conn && conn.stripe) && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(63,169,245,0.05)', border: '1px solid var(--border-subtle)', fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.7 }}>
            <b style={{ color: 'var(--text-high)' }}>Connect Stripe (one-time):</b> in your Supabase dashboard → Edge Functions → Secrets, add
            <span className="mono" style={{ color: 'var(--brand)' }}> STRIPE_SECRET_KEY</span> (from Stripe → Developers → API keys) and
            <span className="mono" style={{ color: 'var(--brand)' }}> STRIPE_WEBHOOK_SECRET</span> (Stripe → Webhooks → add endpoint
            <span className="mono"> …/functions/v1/stripe-webhook</span>, event <span className="mono">checkout.session.completed</span>).
            Every pay link switches to live Stripe checkout instantly — nothing else changes.
          </div>
        )}
      </GlassPanel>

      <GlassPanel style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeader title="Payment links sent" icon="reports" count={links ? links.length : undefined} />
          <button onClick={refresh} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 6, background: 'rgba(63,169,245,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Refresh</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Invoice','Customer','Amount','Status','Reminders','Sent',''].map((h,i) => (
            <th key={i} style={{ textAlign: i===2?'right':'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-low)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {links === null && <tr><td colSpan={7} style={{ padding: 20, fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>Loading…</td></tr>}
            {links && links.length === 0 && <tr><td colSpan={7} style={{ padding: 24, fontSize: 12, color: 'var(--text-low)', textAlign: 'center' }}>No payment links yet — send an invoice from the Invoices tab and it lands here with a live customer pay page.</td></tr>}
            {(links || []).map(l => (
              <tr key={l.id}>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12, color: 'var(--brand)' }}>{l.invoice_ref}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 12 }}>{l.customer_name || '—'}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{money(l.amount)}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}><StatusBadge status={l.status === 'paid' ? 'online' : 'info'} label={l.status === 'paid' ? `paid · ${l.paid_via || ''}` : 'awaiting payment'} /></td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-mid)' }}>{l.reminder_count || 0}</td>
                <td className="mono" style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)', fontSize: 11, color: 'var(--text-low)' }}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(63,169,245,0.04)' }}>
                  <button onClick={() => { const base = window.__shieldSupabaseUrl || ''; if (base) window.open(`${base}/functions/v1/invoice-pay?token=${l.token}`, '_blank'); else showToast('Backend URL unavailable'); }} style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open page →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>

      <div style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.6 }}>
        Overdue links are reminded automatically (daily check · 3-day gap · max 4 nudges). Stripe payments post back here and mark the invoice paid on their own.
      </div>
    </div>
  );
}


/* ── AI Financial Co-pilot ── */
function FinanceCopilot() {
  const [query, setQuery] = React.useState('');
  const [convo, setConvo] = React.useState([
    { role: 'ai', text: 'I\'m your AI Financial Co-pilot. Ask me anything about your books, cash flow, profitability, or collections. I can also draft reminders and journal entries.', chart: null },
  ]);
  const [loading, setLoading] = React.useState(false);

  const presets = [
    'What\'s my cash position?',
    'Who\'s overdue?',
    'Profitability by service line last quarter?',
    'Project cash flow 90 days',
    'Draft collection reminders for overdue invoices',
    'What\'s my burn rate?',
  ];



  const handleSend = async (q) => {
    const question = q || query;
    if (!question.trim() || loading) return;
    const history = [...convo.filter(m => m.role !== 'ai' || convo.indexOf(m) > 0)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })), { role: 'user', content: question }];
    setConvo(prev => [...prev, { role: 'user', text: question }]);
    setQuery('');
    setLoading(true);
    const ctx = {
      invoices: (typeof qtcStore !== 'undefined' && qtcStore.get) ? qtcStore.get() : undefined,
      mrr: (typeof mrrStore !== 'undefined' && mrrStore.get) ? mrrStore.get() : undefined,
    };
    const reply = window.__shieldAI
      ? await window.__shieldAI.shieldAIChat('finance', history, ctx)
      : { text: 'ShieldTech AI is not configured yet — connect Supabase and set OPENAI_API_KEY.' };
    setConvo(prev => [...prev, { role: 'ai', text: reply.text, chart: null }]);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⟡</span>
        <div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>ShieldTech AI Financial Co-pilot</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Natural-language BI over your books</div>
        </div>
      </div>

      {/* Preset chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => handleSend(p)} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, background: 'rgba(63,169,245,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{p}</button>
        ))}
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
        {convo.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, maxWidth: msg.role === 'user' ? '70%' : '100%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⟡</div>
            )}
            <div style={{ padding: '10px 14px', borderRadius: 10, background: msg.role === 'user' ? 'var(--brand)' : 'var(--glass-bg)', border: msg.role === 'ai' ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ fontSize: 12, color: msg.role === 'user' ? '#fff' : 'var(--text-high)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}</div>
              {msg.chart === 'profitability' && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  {[{ label: 'RMR', pct: 68 },{ label: 'Alarm', pct: 35 },{ label: 'CCTV', pct: 32 },{ label: 'Access', pct: 29 },{ label: 'Fire', pct: 23 }].map((b,j) => (
                    <div key={j} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ width: 20, height: `${b.pct}%`, background: b.pct>=30?'var(--status-ok)':b.pct>=25?'var(--status-warn)':'var(--status-critical)', borderRadius: '3px 3px 0 0' }} />
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3 }}>{b.label}</div>
                      <div className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mid)' }}>{b.pct}%</div>
                    </div>
                  ))}
                </div>
              )}
              {msg.chart === 'cash' && (
                <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
                  {[{ label: 'Checking', val: '$482.6K', color: 'var(--brand)' },{ label: 'Savings', val: '$125K', color: 'var(--status-ok)' },{ label: 'AR', val: '$175.9K', color: 'var(--status-warn)' },{ label: 'AP', val: '$36.2K', color: 'var(--status-critical)' }].map((b,j) => (
                    <div key={j} className="glass" style={{ flex: 1, padding: 8, textAlign: 'center', borderRadius: 6 }}>
                      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: b.color }}>{b.val}</div>
                      <div style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>{b.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(63,169,245,0.1)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⟡</div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', opacity: 0.4, animation: `pulse-online 1s ease ${d*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 0 0', borderTop: '1px solid var(--border-subtle)' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about your finances..." style={{ flex: 1, padding: '10px 16px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={() => handleSend()} style={{ padding: '10px 20px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ask</button>
      </div>
    </div>
  );
}

Object.assign(window, { FinanceStripe, FinanceCopilot });

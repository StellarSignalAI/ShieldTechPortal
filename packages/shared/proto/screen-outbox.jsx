/* Vendored from updated design prototype (new-generation screens). */

// ── pay-outbox.jsx ──
/* Customer Pay Page (ShieldTech-branded checkout) + Email Outbox.
   The pay page is what the {link} in outgoing emails opens: branded invoice
   summary + demo card flow that marks the invoice paid in invoiceStore.
   Live Stripe drops in behind the same button once API keys + a backend
   exist — the page and data flow don't change.
   NOTE: loads BEFORE app-registry (index.html orders this early). */

/* ── Branded customer pay page (shell-less) ── */
function PayPageScreen({ onBack }) {
  const [invoices, setInvoices] = useShieldStore(invoiceStore);
  const [brand] = useShieldStore(brandStore);
  const [focus] = useShieldStore(payFocusStore);
  const inv = invoices.find(i => i.num === focus) || invoices.find(i => i.status === 'pending' || i.status === 'overdue') || invoices[0];
  const [card, setCard] = React.useState({ number: '', exp: '', cvc: '', name: '' });
  const [state, setState] = React.useState('form'); // form | processing | paid
  const set = (k, v) => setCard(p => ({ ...p, [k]: v }));

  if (!inv) return <div style={{ padding: 40, color: 'var(--text-mid)' }}>No invoice selected.</div>;
  const alreadyPaid = inv.status === 'paid';

  const pay = () => {
    if (!card.number.replace(/\s/g, '') || !card.exp || !card.cvc) { showToast('Enter card number, expiry, and CVC', 'warn'); return; }
    setState('processing');
    setTimeout(() => {
      setInvoices(prev => prev.map(i => i.num === inv.num ? { ...i, status: 'paid', days: 0, paidAt: Date.now(), paidVia: 'pay-page' } : i));
      setState('paid');
    }, 1600);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 12px', overflow: 'auto' }}>
      <div style={{ width: 520, maxWidth: '100%' }}>
        {/* Branded header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>{brand.logoInitials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>{brand.company}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{brand.tagline} · {brand.license}</div>
          </div>
          {onBack && <button onClick={onBack} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-mid)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Portal</button>}
        </div>

        {/* Invoice summary */}
        <div className="glass" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 13, color: 'var(--brand)' }}>{inv.num}</span>
            <span style={{ fontSize: 10, color: inv.status === 'overdue' ? 'var(--status-critical)' : 'var(--text-low)', textTransform: 'uppercase', fontWeight: 700 }}>{inv.status}{inv.status === 'overdue' ? ` · ${inv.days}d` : ''}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 12 }}>Billed to <b style={{ color: 'var(--text-high)' }}>{inv.customer}</b> · due {inv.due}</div>
          {inv.lines.map((li, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(63,169,245,0.05)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-mid)' }}>{li.desc}</span>
              <span className="mono" style={{ color: 'var(--text-high)' }}>${(li.qty * li.rate).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>Total due</span>
            <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand)' }}>${inv.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment */}
        {(alreadyPaid || state === 'paid') ? (
          <div className="glass" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ width: 46, height: 46, margin: '0 auto 10px', borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '2px solid var(--status-ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--status-ok)' }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>Payment received</div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 4 }}>{inv.num} · ${inv.amount.toLocaleString()} · a receipt was emailed to {inv.customer}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 10 }}>Thank you for your business — {brand.company}</div>
          </div>
        ) : (
          <div className="glass" style={{ padding: 20 }}>
            <div className="label-sm" style={{ marginBottom: 10 }}>PAY BY CARD</div>
            <input value={card.name} onChange={e => set('name', e.target.value)} placeholder="Name on card" style={payInput()} />
            <input value={card.number} onChange={e => set('number', e.target.value.replace(/[^\d ]/g, ''))} placeholder="Card number" inputMode="numeric" style={payInput()} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={card.exp} onChange={e => set('exp', e.target.value)} placeholder="MM / YY" style={{ ...payInput(), flex: 1 }} />
              <input value={card.cvc} onChange={e => set('cvc', e.target.value.replace(/\D/g, ''))} placeholder="CVC" inputMode="numeric" style={{ ...payInput(), flex: 1 }} />
            </div>
            <button onClick={pay} disabled={state === 'processing'} style={{ width: '100%', marginTop: 12, padding: '12px 0', background: state === 'processing' ? 'rgba(63,169,245,0.3)' : 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: state === 'processing' ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>
              {state === 'processing' ? 'Processing…' : `Pay $${inv.amount.toLocaleString()}`}
            </button>
            <div style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
              🔒 Demo checkout — swaps to live Stripe with your API keys; this page and flow stay identical. Payments post to the ShieldTech ledger instantly.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function payInput() {
  return { width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: '11px 12px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
}

/* ── Outbox — every merged email, with clickable pay links ── */
function OutboxScreen() {
  const [outbox] = useShieldStore(outboxStore);
  const [open, setOpen] = React.useState(null);
  const openPay = (m) => { if (m.invoice) { payFocusStore.set(m.invoice); navTo('pay'); } };
  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass" style={{ padding: '10px 16px', borderLeft: '3px solid var(--status-warn)', fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>
        Emails are fully merged from your branded templates and queued here. <b>Delivery requires the email backend</b> (Edge Function + Resend/SendGrid) — once connected, this queue drains automatically. Every pay link below is live in-app.
      </div>
      {outbox.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-low)', padding: 20 }}>Nothing queued yet — send an invoice or estimate and it will land here fully merged.</div>}
      {outbox.map(m => (
        <div key={m.id} className="glass" style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => setOpen(open === m.id ? null : m.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="chat" size={14} color="var(--brand)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)' }}>To {m.to} · {m.customer}{m.invoice ? ` · ${m.invoice}` : ''}</div>
            </div>
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--status-warn)', fontWeight: 700 }}>QUEUED</span>
          </div>
          {open === m.id && (
            <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 8, background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)' }}>
              <pre style={{ margin: 0, fontSize: 11, color: 'var(--text-mid)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                {m.body.split(m.payLink || ' ').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <a onClick={e => { e.stopPropagation(); openPay(m); }} style={{ color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer' }}>{m.payLink}</a>
                    )}
                  </React.Fragment>
                ))}
              </pre>
              {m.invoice && (
                <button onClick={e => { e.stopPropagation(); openPay(m); }} style={{ marginTop: 10, padding: '7px 16px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 7, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Open customer pay page →</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PayPageScreen, OutboxScreen });


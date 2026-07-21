/* Mobile Finance — QBO merge mirror: grouped menu + Sales Tax, Lending, AI Reminders, Bank AI, 1099s */

function MFinCard({ children, onClick, style }) {
  return (
    <div onClick={onClick} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--card)', cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</div>
  );
}
const mfinMoney = (n) => '$' + n.toLocaleString();

/* ── Sales Tax (mobile) ── */
function MFinSalesTax() {
  const returns = [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['Collected QTD', '$0'], ['Next filing', '—'], ['Exceptions', '0']].map((s, i) => (
          <MFinCard key={i} style={{ flex: 1, padding: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{s[0]}</div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s[1]}</div>
          </MFinCard>
        ))}
      </div>
      {returns.map((r, i) => (
        <MFinCard key={i} onClick={() => shieldToast(r.status === 'Filed' ? 'Filed copy opened' : 'Return worksheet opened', 'info')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.period}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: r.c }}>{r.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-mid)' }}>
            <span>Due {r.due}</span><span style={{ fontFamily: 'var(--font-mono)' }}>{mfinMoney(r.tax)}</span>
          </div>
        </MFinCard>
      ))}
      {returns.length === 0 && <MFinCard style={{ textAlign: 'center', color: 'var(--text-mid)', fontSize: 12.5 }}>No sales tax returns yet.</MFinCard>}
      <div style={{ fontSize: 10.5, color: 'var(--text-mid)', padding: '0 2px' }}>Full workspace (categories, nexus, settings) in the desktop Finance Suite.</div>
    </div>
  );
}

/* ── Lending (mobile) ── */
function MFinLending() {
  const accounts = [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {accounts.map((a, i) => (
        <MFinCard key={i} onClick={() => shieldToast(a.name + ' — detail opened', 'info')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{mfinMoney(a.bal)} / {mfinMoney(a.limit)}</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }}>
            <div style={{ width: `${Math.round(a.bal / a.limit * 100)}%`, height: '100%', borderRadius: 3, background: 'var(--brand)' }}></div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{a.note}</div>
        </MFinCard>
      ))}
      {accounts.length === 0 && <MFinCard style={{ textAlign: 'center', color: 'var(--text-mid)', fontSize: 12.5 }}>No lending accounts connected yet.</MFinCard>}
    </div>
  );
}

/* ── AI approval queue (mobile) — reminders + bank matches ── */
function MFinAIQueue() {
  const [items, setItems] = React.useState([]);
  const resolve = (i, msg) => { setItems((xs) => xs.filter((_, j) => j !== i)); shieldToast(msg, 'info'); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--text-mid)', padding: '0 2px' }}>Nothing sends or posts without your approval. Every suggestion cites its source rows.</div>
      {items.length === 0 && <MFinCard style={{ textAlign: 'center', color: 'var(--text-mid)', fontSize: 12.5 }}>Queue clear — AI suggestions appear here as invoices and bank activity come in.</MFinCard>}
      {items.map((it, i) => (
        <MFinCard key={it.title}>
          <div style={{ fontSize: 9.5, color: 'var(--brand)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>⟡ {it.kind}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{it.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 10 }}>{it.body}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => resolve(i, it.act === 'Approve & send' ? 'Reminder sent' : 'Posted to ledger')} style={{ flex: 1.4, padding: '10px', background: 'linear-gradient(135deg, var(--brand), var(--brand-pressed))', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{it.act}</button>
            <button onClick={() => resolve(i, 'Dismissed')} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Dismiss</button>
          </div>
        </MFinCard>
      ))}
    </div>
  );
}

/* ── More menu (mobile) — every remaining QBO destination, grouped ── */
function MFinMore({ onNav }) {
  const groups = [
    { g: 'Money in', items: [['Credits & Receipts', 'Payments, credit memos, refunds'], ['Statements', 'Customer balance statements'], ['Products & Services', 'Catalog, pricing, tax categories']] },
    { g: 'Money out', items: [['Checks & Mileage', 'Expense subtypes — approve trips'], ['1099 Contractors', 'W-9 status, YTD reportable']] },
    { g: 'Accounting controls', items: [['Bank Feed & Rules', 'Match, categorize, reconcile'], ['Chart of Accounts', 'Account tree & balances'], ['General Ledger', 'Journal entries']] },
    { g: 'Reports & planning', items: [['Cash Flow Planner', '6-week projection'], ['Budgets', 'Budget vs actual'], ['Tax Prep', 'Filing checklist']] },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map((g) => (
        <div key={g.g}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--brand)', fontFamily: 'var(--font-mono)', margin: '0 2px 6px' }}>{g.g}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.items.map((it) => (
              <MFinCard key={it[0]} onClick={() => onNav('finance-full')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{it[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{it[1]}</div>
                </div>
                <span style={{ color: 'var(--text-mid)', fontSize: 14 }}>›</span>
              </MFinCard>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10.5, color: 'var(--text-mid)', padding: '0 2px' }}>These open the full Finance Suite — every QuickBooks screen maps to exactly one destination there (see QBO Map).</div>
    </div>
  );
}

Object.assign(window, { MFinSalesTax, MFinLending, MFinAIQueue, MFinMore });

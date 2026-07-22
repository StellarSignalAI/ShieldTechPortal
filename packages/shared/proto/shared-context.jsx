/* Customer selection, everywhere it matters.
   CustomerSelect — drop-in <select> for any flow that needs a customer
   (projects, invoices, estimates, proposals, scanner). Includes
   "＋ New customer…", which opens the create form (shieldModal — renders as a
   sheet-sized dialog on mobile, modal on desktop), saves to the shared
   customer store, and returns with the new customer selected so the original
   flow continues uninterrupted. */

const contextStore = createShieldStore('appcontext', { customer: null, project: null });

function shieldCustomerNames() {
  const names = [];
  try { (customerStore.get() || []).forEach(c => { const n = c.name || c.customer; if (n && !names.includes(n)) names.push(n); }); } catch {}
  return names;
}

function openNewCustomer(onCreated) {
  shieldModal({
    kind: 'form', title: 'New Customer', subtitle: 'Added to the shared customer list — available everywhere immediately',
    submitLabel: 'Create Customer', successMsg: 'Customer created',
    fields: [
      { key: 'name', label: 'Company / Customer name', required: true, full: true, placeholder: 'Customer name' },
      { key: 'contact', label: 'Primary contact', placeholder: 'Full name' },
      { key: 'phone', label: 'Phone', placeholder: '(555) 555-0100' },
      { key: 'email', label: 'Email', placeholder: 'name@company.com' },
      { key: 'address', label: 'Address', full: true, placeholder: 'Street, City, State' },
    ],
    onSubmit: (v) => {
      const rec = { id: 'cust-' + Date.now(), name: (v.name || '').trim(), contact: v.contact || '', phone: v.phone || '', email: v.email || '', address: v.address || '', createdAt: Date.now() };
      if (!rec.name) return;
      customerStore.set(prev => [rec, ...(prev || [])]);
      if (onCreated) onCreated(rec);
    },
  });
}

const NEW_CUSTOMER = '__new__';

function CustomerSelect({ value, onChange, style, placeholder }) {
  const [custs] = useShieldStore(customerStore);
  void custs; // subscribe so new customers appear instantly
  const names = shieldCustomerNames();
  if (value && !names.includes(value)) names.unshift(value);
  const base = { width: '100%', padding: '10px 12px', background: 'rgba(63,169,245,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-high)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
  return (
    <select
      value={value || ''}
      onChange={(e) => {
        if (e.target.value === NEW_CUSTOMER) { openNewCustomer((rec) => onChange(rec.name, rec)); return; }
        onChange(e.target.value);
      }}
      style={{ ...base, ...(style || {}) }}>
      <option value="">{placeholder || 'Select customer…'}</option>
      {names.map(n => <option key={n} value={n}>{n}</option>)}
      <option value={NEW_CUSTOMER}>＋ New customer…</option>
    </select>
  );
}

Object.assign(window, { contextStore, CustomerSelect, openNewCustomer, shieldCustomerNames });

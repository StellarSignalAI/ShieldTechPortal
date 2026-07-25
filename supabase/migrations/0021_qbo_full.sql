-- QuickBooks: the rest of the model so a sync lands EVERYTHING in its place —
-- vendors, bills (AP), expenses/purchases, payments, and the chart of accounts.
-- Same access rules as 0019: Admin/Staff read, service role writes.

create table if not exists public.qbo_vendors (
  qbo_id text primary key,
  display_name text,
  company_name text,
  email text,
  phone text,
  balance numeric(14,2) default 0,
  active boolean default true,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_bills (
  qbo_id text primary key,
  doc_number text,
  vendor_qbo_id text,
  vendor_name text,
  txn_date date,
  due_date date,
  total numeric(14,2) default 0,
  balance numeric(14,2) default 0,
  status text,                    -- paid | open | overdue
  private_note text,
  lines jsonb,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_purchases (
  qbo_id text primary key,
  payment_type text,              -- Cash | Check | CreditCard
  account_name text,
  entity_name text,               -- payee (vendor/customer/employee)
  txn_date date,
  total numeric(14,2) default 0,
  memo text,
  lines jsonb,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_payments (
  qbo_id text primary key,
  customer_qbo_id text,
  customer_name text,
  txn_date date,
  total numeric(14,2) default 0,
  unapplied numeric(14,2) default 0,
  method text,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_accounts (
  qbo_id text primary key,
  acct_num text,
  name text,
  account_type text,              -- Asset | Liability | Equity | Income | Expense
  account_subtype text,
  classification text,
  current_balance numeric(16,2) default 0,
  active boolean default true,
  raw jsonb,
  synced_at timestamptz default now()
);

create index if not exists qbo_bills_vendor    on public.qbo_bills (vendor_qbo_id);
create index if not exists qbo_bills_status    on public.qbo_bills (status);
create index if not exists qbo_purchases_date  on public.qbo_purchases (txn_date desc);
create index if not exists qbo_payments_cust   on public.qbo_payments (customer_qbo_id);
create index if not exists qbo_accounts_type   on public.qbo_accounts (account_type);

do $$
declare t text;
begin
  foreach t in array array['qbo_vendors','qbo_bills','qbo_purchases','qbo_payments','qbo_accounts'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "qbo: staff read" on public.%I;', t);
    execute format($p$
      create policy "qbo: staff read" on public.%I
        for select using (
          exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
        );
    $p$, t);
  end loop;
end $$;

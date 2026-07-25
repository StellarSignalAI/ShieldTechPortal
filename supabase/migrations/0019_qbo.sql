-- QuickBooks Online data landing tables.
--
-- Populated by the qbo-sync edge function (server-side Intuit OAuth) on a
-- nightly cron and on demand, and by the initial agent-driven import. Read by
-- the portal Finance suite via window.__shieldQBO. `qbo_id` is the Intuit
-- entity id, so every sync is an idempotent upsert.
--
-- Access: Admin/Staff can READ (finance is sensitive). WRITES happen only
-- through the service role (edge function / import), which bypasses RLS — there
-- are deliberately no insert/update policies for normal users.

create table if not exists public.qbo_customers (
  qbo_id text primary key,
  display_name text,
  company_name text,
  email text,
  phone text,
  billing_line text,
  billing_city text,
  billing_state text,
  billing_postal text,
  balance numeric(14,2) default 0,
  active boolean default true,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_items (
  qbo_id text primary key,
  name text,
  fully_qualified_name text,
  type text,
  description text,
  unit_price numeric(14,2),
  taxable boolean,
  active boolean default true,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_invoices (
  qbo_id text primary key,
  doc_number text,
  customer_qbo_id text,
  customer_name text,
  txn_date date,
  due_date date,
  total numeric(14,2) default 0,
  balance numeric(14,2) default 0,
  status text,                    -- paid | open | overdue | void
  currency text default 'USD',
  private_note text,
  lines jsonb,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_estimates (
  qbo_id text primary key,
  doc_number text,
  customer_qbo_id text,
  customer_name text,
  txn_date date,
  expiration_date date,
  total numeric(14,2) default 0,
  status text,                    -- pending | accepted | closed | rejected
  lines jsonb,
  raw jsonb,
  synced_at timestamptz default now()
);

-- Financial reports are stored as period snapshots (P&L, Balance Sheet, AR/AP
-- aging, sales-by-customer/product). The dashboard reads the latest snapshot.
create table if not exists public.qbo_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,      -- profit_loss | balance_sheet | ar_aging | ap_aging | sales_by_customer | sales_by_product
  period_start date,
  period_end date,
  data jsonb,
  generated_at timestamptz default now(),
  unique (report_type, period_start, period_end)
);

create table if not exists public.qbo_employees (
  qbo_id text primary key,
  name text,
  email text,
  phone text,
  status text,
  work_location text,
  pay_type text,
  raw jsonb,
  synced_at timestamptz default now()
);

create table if not exists public.qbo_payslips (
  qbo_id text primary key,
  employee_qbo_id text,
  employee_name text,
  pay_date date,
  gross_pay numeric(14,2),
  net_pay numeric(14,2),
  raw jsonb,
  synced_at timestamptz default now()
);

-- One-row bookkeeping so the portal can show "last synced" and status.
create table if not exists public.qbo_sync_state (
  id int primary key default 1,
  realm_id text,
  last_sync_at timestamptz,
  last_status text,               -- ok | error | running
  last_error text,
  counts jsonb,                   -- { customers: n, invoices: n, ... }
  constraint qbo_sync_state_singleton check (id = 1)
);
insert into public.qbo_sync_state (id) values (1) on conflict do nothing;

-- Service-role-only secret store for the Intuit OAuth tokens. Intuit rotates
-- the refresh token on every use, so the edge function must persist the new one
-- between runs. RLS is enabled with NO policies, so ONLY the service role (the
-- edge function) can read/write this — never the browser/Admin/Staff.
create table if not exists public.qbo_secrets (
  id int primary key default 1,
  refresh_token text,
  access_token text,
  access_expires_at timestamptz,
  updated_at timestamptz default now(),
  constraint qbo_secrets_singleton check (id = 1)
);
insert into public.qbo_secrets (id) values (1) on conflict do nothing;
alter table public.qbo_secrets enable row level security;

-- Indexes for the portal reads.
create index if not exists qbo_invoices_customer  on public.qbo_invoices (customer_qbo_id);
create index if not exists qbo_invoices_status    on public.qbo_invoices (status);
create index if not exists qbo_invoices_date      on public.qbo_invoices (txn_date desc);
create index if not exists qbo_estimates_customer on public.qbo_estimates (customer_qbo_id);
create index if not exists qbo_estimates_date     on public.qbo_estimates (txn_date desc);
create index if not exists qbo_payslips_emp       on public.qbo_payslips (employee_qbo_id);

-- ── RLS: Admin/Staff read-only; service role writes (import + edge fn) ──
do $$
declare t text;
begin
  foreach t in array array[
    'qbo_customers','qbo_items','qbo_invoices','qbo_estimates',
    'qbo_report_snapshots','qbo_employees','qbo_payslips','qbo_sync_state'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "qbo: staff read" on public.%I;', t);
    execute format($p$
      create policy "qbo: staff read" on public.%I
        for select using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('Admin','Staff')
          )
        );
    $p$, t);
  end loop;
end $$;

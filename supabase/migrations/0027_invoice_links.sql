-- Payment links + collections: one row per sent invoice. The public pay page
-- (invoice-pay edge function) reads these by token; Stripe checkout attaches
-- when STRIPE_SECRET_KEY is configured; the reminders cron nudges unpaid ones.
create table if not exists public.invoice_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  invoice_ref text not null,
  customer_name text,
  customer_email text,
  amount numeric,
  lines jsonb,
  due_date date,
  status text not null default 'sent',           -- sent | paid
  stripe_url text,                               -- hosted Stripe checkout/payment-link url
  stripe_session_id text,
  paid_at timestamptz,
  paid_via text,                                 -- stripe | manual
  applied_at timestamptz,                        -- when the portal marked its local row paid
  reminder_count int not null default 0,
  last_reminder_at timestamptz,
  sent_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index if not exists invoice_links_ref_idx on public.invoice_links (invoice_ref);

alter table public.invoice_links enable row level security;

create policy "staff read invoice_links" on public.invoice_links
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "staff update invoice_links" on public.invoice_links
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
-- inserts/public reads go through the invoice-pay edge function (service role)

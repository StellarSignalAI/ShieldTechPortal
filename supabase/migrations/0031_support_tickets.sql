-- Customer support tickets + customer invoice visibility (audit batch 2).
--
-- The customer portal previously "submitted" tickets into thin air and showed
-- fixture data. Client-role accounts are locked out of the shared app_state
-- stores (0030), so customer-facing data needs real, RLS-scoped tables:
--
--  * support_tickets — customers create and read THEIR OWN tickets and append
--    messages to the thread; office (staff) sees and works all of them.
--  * invoice_links   — customers may read their own rows (matched by their
--    account email), so the Invoices tab can list real invoices with the real
--    tokenized pay page (Stripe when connected).

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                    -- TKT-…
  created_by uuid not null references public.profiles (id) on delete cascade,
  company text,
  contact_name text,
  contact_email text,
  subject text not null,
  description text,
  category text,                               -- camera | access | alarm | network | billing | remote-access | other
  priority text not null default 'medium',     -- low | medium | high | urgent
  status text not null default 'open',         -- open | in-progress | waiting | resolved | closed
  thread jsonb not null default '[]'::jsonb,   -- [{from:'customer'|'shieldtech', by, text, at}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_creator on public.support_tickets (created_by);
create index if not exists support_tickets_status on public.support_tickets (status);

alter table public.support_tickets enable row level security;

create policy "tickets: customer insert own" on public.support_tickets
  for insert with check (created_by = (select auth.uid()));
create policy "tickets: customer read own" on public.support_tickets
  for select using (created_by = (select auth.uid()));
create policy "tickets: customer update own open" on public.support_tickets
  for update using (created_by = (select auth.uid()) and status <> 'closed')
  with check (created_by = (select auth.uid()));
create policy "tickets: staff read" on public.support_tickets
  for select using (public.is_staff());
create policy "tickets: staff update" on public.support_tickets
  for update using (public.is_staff())
  with check (public.is_staff());

drop trigger if exists support_tickets_touch on public.support_tickets;
create trigger support_tickets_touch before update on public.support_tickets
  for each row execute function public.touch_updated_at();

-- Customers read their own invoice links (never anyone else's) by account email.
create policy "customer read own invoice_links" on public.invoice_links
  for select using (
    customer_email is not null
    and lower(customer_email) = (select lower(email) from public.profiles where id = (select auth.uid()))
  );

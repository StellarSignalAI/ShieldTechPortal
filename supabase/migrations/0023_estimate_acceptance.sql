-- Estimate acceptance → project pipeline.
--
-- An estimate becomes a project when accepted, either manually in the portal
-- or by the customer clicking an emailed acceptance link. This table holds the
-- tokenized email-acceptance records: the estimate-accept edge function
-- creates a row when the portal emails an acceptance request, and flips it to
-- accepted/declined when the customer clicks. The portal polls for accepted
-- rows it hasn't applied yet, turns each into a project (attaching the quote),
-- and marks the row applied.

create table if not exists public.estimate_acceptances (
  id             uuid primary key default gen_random_uuid(),
  token          text not null unique,        -- unguessable link token
  estimate_ref   text not null,               -- doc number, e.g. EST-1042
  estimate_qbo_id text,                       -- set when the estimate is a QBO row
  customer_name  text,
  customer_email text,
  amount         numeric(14,2),
  status         text not null default 'pending',  -- pending | accepted | declined
  accepted_via   text,                        -- email | manual
  sent_by        uuid references public.profiles(id),
  sent_at        timestamptz not null default now(),
  responded_at   timestamptz,
  applied        boolean not null default false,    -- portal has created the project
  applied_project text                        -- project number, e.g. PRJ-1007
);

create index if not exists estimate_acceptances_status
  on public.estimate_acceptances (status, applied);
create index if not exists estimate_acceptances_ref
  on public.estimate_acceptances (estimate_ref);

alter table public.estimate_acceptances enable row level security;

-- Admin/Staff manage acceptance requests from the portal; the edge function
-- (service role) bypasses RLS for the public accept/decline click.
create policy "estimate_acceptances: staff read" on public.estimate_acceptances
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "estimate_acceptances: staff insert" on public.estimate_acceptances
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "estimate_acceptances: staff update" on public.estimate_acceptances
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

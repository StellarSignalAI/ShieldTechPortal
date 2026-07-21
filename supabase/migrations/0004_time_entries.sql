-- Time & labor: technician hours → portal approval → Rippling sync (two-way)

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  tech_id uuid not null references public.profiles (id),
  work_date date not null,
  start_at timestamptz,
  end_at timestamptz,
  break_minutes integer not null default 0,
  hours numeric(6,2) not null,
  job_ref text,
  notes text,
  status text not null default 'draft',       -- draft | submitted | approved | rejected | synced | paid
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  rejection_reason text,
  rippling_entry_id text,
  rippling_status text,                        -- DRAFT | APPROVED | PAID | FINALIZED (as reported by Rippling)
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_entries_tech_date on public.time_entries (tech_id, work_date);
create index if not exists time_entries_status on public.time_entries (status);
create unique index if not exists time_entries_rippling_key
  on public.time_entries (rippling_entry_id) where rippling_entry_id is not null;

-- Rippling worker mirror: roster + pay rates pulled from Rippling for payout math
create table if not exists public.rippling_workers (
  rippling_worker_id text primary key,
  profile_id uuid references public.profiles (id),
  name text,
  email text,
  pay_rate numeric(10,2),                      -- hourly rate as reported by Rippling compensation
  pay_currency text default 'USD',
  employment_type text,
  last_synced timestamptz
);

alter table public.time_entries enable row level security;
alter table public.rippling_workers enable row level security;

-- Technicians: manage their own entries while still editable; read their own always
create policy "time: own read" on public.time_entries
  for select using (tech_id = auth.uid());
create policy "time: own insert" on public.time_entries
  for insert with check (tech_id = auth.uid() and status in ('draft','submitted'));
create policy "time: own update while editable" on public.time_entries
  for update using (tech_id = auth.uid() and status in ('draft','submitted','rejected'))
  with check (tech_id = auth.uid() and status in ('draft','submitted'));

-- Admin/Staff: full read + status changes (approve/reject)
create policy "time: staff read" on public.time_entries
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "time: staff update" on public.time_entries
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

create policy "rippling: staff read" on public.rippling_workers
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
-- Technicians can see their own worker record (their rate / link status)
create policy "rippling: own read" on public.rippling_workers
  for select using (profile_id = auth.uid());

drop trigger if exists time_entries_touch on public.time_entries;
create trigger time_entries_touch before update on public.time_entries
  for each row execute function public.touch_updated_at();

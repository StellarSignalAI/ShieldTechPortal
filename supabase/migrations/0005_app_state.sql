-- Cross-device platform state: ShieldTech stores synced through Supabase.
-- One row per store key. Shared rows (owner null) are company-wide; rows with
-- an owner are per-user preferences (id = key || ':' || owner).

create table if not exists public.app_state (
  id text primary key,                 -- '<key>' (shared) or '<key>:<uid>' (personal)
  key text not null,
  owner uuid references public.profiles (id),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists app_state_key on public.app_state (key);

alter table public.app_state enable row level security;

-- Shared workspace rows: any signed-in platform user (has a profile) can read/write
create policy "state: shared read" on public.app_state
  for select using (
    owner is null and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "state: shared write" on public.app_state
  for insert with check (
    owner is null and exists (select 1 from public.profiles p where p.id = auth.uid())
  );
create policy "state: shared update" on public.app_state
  for update using (
    owner is null and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- Personal rows: owner-scoped
create policy "state: own read" on public.app_state
  for select using (owner = auth.uid());
create policy "state: own write" on public.app_state
  for insert with check (owner = auth.uid());
create policy "state: own update" on public.app_state
  for update using (owner = auth.uid());

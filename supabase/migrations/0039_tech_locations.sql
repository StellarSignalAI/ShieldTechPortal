-- Live technician positions — one row per technician, rewritten in place as the
-- tech app streams GPS. The portal (Dispatch, Fleet, work orders, mobile home)
-- subscribes to this table over realtime, so every surface shows where each
-- tech is right now, on any device. Replaces the old path that pushed the whole
-- fleet store through app_state (last-write-wins across techs lost positions).
--
--   tech_id    the technician's profile id (auth.uid())
--   tech_key   the short key the fleet screens use (initials, e.g. "DM")
--   on_duty    true while the app is streaming; set false on sign-out
--   updated_at refreshed on every fix AND by a heartbeat, so "stale" means
--              the phone really stopped reporting, not that the tech sat still

create table if not exists public.tech_locations (
  tech_id    uuid primary key references public.profiles(id) on delete cascade,
  tech_key   text not null,
  name       text,
  role       text,
  lat        double precision not null,
  lng        double precision not null,
  accuracy   double precision,
  heading    double precision,
  speed      double precision,
  on_duty    boolean not null default true,
  status     text not null default 'on-site',
  source     text not null default 'geolocation',
  updated_at timestamptz not null default now()
);
create index if not exists tech_locations_updated_idx on public.tech_locations (updated_at desc);

alter table public.tech_locations enable row level security;

-- Staff and technicians see the whole fleet; customers never see positions.
drop policy if exists "tech_locations: team read" on public.tech_locations;
create policy "tech_locations: team read" on public.tech_locations
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin', 'Staff', 'Technician'))
  );

-- A technician writes only their own row.
drop policy if exists "tech_locations: own insert" on public.tech_locations;
create policy "tech_locations: own insert" on public.tech_locations
  for insert with check (auth.uid() = tech_id);
drop policy if exists "tech_locations: own update" on public.tech_locations;
create policy "tech_locations: own update" on public.tech_locations
  for update using (auth.uid() = tech_id) with check (auth.uid() = tech_id);
drop policy if exists "tech_locations: own delete" on public.tech_locations;
create policy "tech_locations: own delete" on public.tech_locations
  for delete using (auth.uid() = tech_id);

-- Realtime: full rows on UPDATE so subscribers get the new position, not just the key.
alter table public.tech_locations replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.tech_locations;
exception when duplicate_object then null; end $$;

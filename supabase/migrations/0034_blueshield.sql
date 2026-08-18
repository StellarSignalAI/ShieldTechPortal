-- BlueShield Studio backing tables. The Studio (served at /blueshield/app.html,
-- the exact single-file build) signs into this project and syncs:
--   bs_drawings — one row per drawing (.bsd): shapes, layers, scale, title
--                 block, PDF underlay, thumbnail. Team-shared: everyone pulls
--                 every drawing; writes carry the author as owner.
--   bs_settings — per-user Studio settings (labor rates, task library, part
--                 overrides, vendors, company info).
--   bs_parts    — shared parts catalog (searchable device library w/ cost+hrs).
--   bs_cables   — shared cable catalog (specs, vendors, pricing tiers).
-- Also removes the plan_threads/plan_messages experiment it replaces.

drop table if exists public.plan_messages;
drop table if exists public.plan_threads;

create table if not exists public.bs_drawings (
  id          text primary key,
  owner       uuid references public.profiles(id) on delete set null,
  name        text not null default 'Untitled_Drawing.bsd',
  project     text,
  sheet_no    text,
  title_block jsonb,
  shapes      jsonb not null default '[]'::jsonb,
  layers      jsonb not null default '[]'::jsonb,
  scale       numeric,
  underlay    jsonb,
  thumb       text,
  updated_at  timestamptz not null default now()
);

create or replace function public.bs_touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at := now(); return new; end $$;
revoke execute on function public.bs_touch_updated_at() from public, anon, authenticated;
drop trigger if exists bs_drawings_touch on public.bs_drawings;
create trigger bs_drawings_touch before insert or update on public.bs_drawings
  for each row execute function public.bs_touch_updated_at();

create table if not exists public.bs_settings (
  owner          uuid primary key references public.profiles(id) on delete cascade,
  rates          jsonb,
  tasks          jsonb,
  task_map       jsonb,
  part_overrides jsonb,
  vendors        jsonb,
  company        jsonb,
  updated_at     timestamptz not null default now()
);
drop trigger if exists bs_settings_touch on public.bs_settings;
create trigger bs_settings_touch before insert or update on public.bs_settings
  for each row execute function public.bs_touch_updated_at();

create table if not exists public.bs_parts (
  model        text primary key,
  mfr          text,
  descr        text,
  cat          text,
  subcat       text,
  features     text,
  cost         numeric,
  hrs          numeric,
  price_status text,
  product_url  text,
  img_q        text,
  source_id    text
);

create table if not exists public.bs_cables (
  id             bigint generated always as identity primary key,
  spec           text,
  shielding      text,
  brand          text,
  model          text,
  vendor         text,
  construction   text,
  gauge          text,
  length_ft      numeric,
  tiers          jsonb,
  low_price      numeric,
  low_per_ft     numeric,
  availability   text,
  recommendation text,
  product_url    text,
  notes          text,
  verified       text
);

alter table public.bs_drawings enable row level security;
alter table public.bs_settings enable row level security;
alter table public.bs_parts    enable row level security;
alter table public.bs_cables   enable row level security;

-- Drawings are team-shared: the Studio pulls every row and any teammate can
-- save; Clients see nothing.
create policy "bs_drawings: read"   on public.bs_drawings for select using (public.is_employee());
create policy "bs_drawings: insert" on public.bs_drawings for insert with check (public.is_employee());
create policy "bs_drawings: update" on public.bs_drawings for update using (public.is_employee());
create policy "bs_drawings: delete" on public.bs_drawings for delete using (public.is_employee());

-- Settings are personal.
create policy "bs_settings: own" on public.bs_settings
  for all using (owner = (select auth.uid()) and public.is_employee())
  with check (owner = (select auth.uid()) and public.is_employee());

-- Catalogs: everyone internal reads; office roles maintain (bulk loads from
-- the importer use the service key and bypass RLS anyway).
create policy "bs_parts: read"    on public.bs_parts  for select using (public.is_employee());
create policy "bs_parts: write"   on public.bs_parts  for all using (public.is_staff()) with check (public.is_staff());
create policy "bs_cables: read"   on public.bs_cables for select using (public.is_employee());
create policy "bs_cables: write"  on public.bs_cables for all using (public.is_staff()) with check (public.is_staff());

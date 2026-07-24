-- Live, editable lead-scraping configuration. A single row the scrapers read at
-- run time so the target regions (and keywords) can change without a redeploy —
-- including from the ShieldTech AI chat, which writes here in the background.
-- Defaults to ShieldTech's home region: NJ / PA / MD / VA.

create table if not exists public.lead_config (
  id          int primary key default 1,
  regions     text[] not null default '{NJ,PA,MD,VA}',
  keywords    text[] not null default '{}',
  enabled     boolean not null default true,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now(),
  constraint lead_config_singleton check (id = 1)
);

insert into public.lead_config (id, regions) values (1, '{NJ,PA,MD,VA}')
on conflict (id) do nothing;

alter table public.lead_config enable row level security;

-- Any signed-in user can read the config; only Admin/Staff can change it.
create policy "lead_config: read" on public.lead_config
  for select using (auth.uid() is not null);
create policy "lead_config: write" on public.lead_config
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

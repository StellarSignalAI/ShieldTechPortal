-- UniFi controller connection for ShieldTech OS.
--
--   unifi_controllers  one row per customer site controller (Site Manager cloud
--                      key or a local UniFi OS console). The API key lives ONLY
--                      here and is readable by the service role; the portal reads
--                      through unifi_controllers_public, which never exposes it.
--   unifi_devices      normalized devices the unifi-proxy function syncs from the
--                      controller (network gear, cameras, doors) — what the console
--                      merges over the asset registry as "live".
--   unifi_events       door openings, remote unlocks, device offline/online and
--                      sync problems, for the Protect timeline and Access logs.
--
-- Staff read everything; customers never touch these tables directly (the
-- customer app stays on the registry until a per-customer read path exists).

create table if not exists public.unifi_controllers (
  id          uuid primary key default gen_random_uuid(),
  customer    text not null,
  site        text not null default 'Main site',
  label       text,
  kind        text not null default 'console' check (kind in ('site-manager', 'console')),
  host        text not null,                 -- https://console.local or https://api.ui.com
  site_id     text,                          -- Network integration site id (console kind)
  api_key     text not null,                 -- SECRET: service role only
  enabled     boolean not null default true,
  health      jsonb,                         -- {wan, isp, clients, devices, hostName, version}
  last_sync   timestamptz,
  last_error  text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists unifi_controllers_customer_idx on public.unifi_controllers (customer, site);
alter table public.unifi_controllers enable row level security;
-- Staff may read every column EXCEPT api_key (column-scoped grant + RLS);
-- writes go only through unifi-proxy with the service role.
revoke all on public.unifi_controllers from anon, authenticated;
grant select (id, customer, site, label, kind, host, site_id, enabled, health, last_sync, last_error, created_at, updated_at)
  on public.unifi_controllers to authenticated;
drop policy if exists "unifi_controllers: staff read" on public.unifi_controllers;
create policy "unifi_controllers: staff read" on public.unifi_controllers
  for select using (public.is_staff());

-- Staff-readable projection without the key (runs as the caller).
create or replace view public.unifi_controllers_public
  with (security_barrier = true, security_invoker = true) as
  select id, customer, site, label, kind, host, site_id, enabled, health, last_sync, last_error, created_at, updated_at
  from public.unifi_controllers;
grant select on public.unifi_controllers_public to authenticated;
revoke all on public.unifi_controllers_public from anon;

create table if not exists public.unifi_devices (
  id             text primary key,            -- `${controller_id}:${kind}:${remote_id}`
  controller_id  uuid not null references public.unifi_controllers(id) on delete cascade,
  customer       text not null,
  site           text not null default 'Main site',
  kind           text not null check (kind in ('gateway','switch','ap','camera','nvr','door','hub','device')),
  remote_id      text not null,
  name           text,
  model          text,
  mac            text,
  ip             text,
  status         text not null default 'offline',   -- online | offline | warning
  uptime_s       bigint,
  firmware       text,
  clients        integer,
  raw            jsonb,
  synced_at      timestamptz not null default now()
);
create index if not exists unifi_devices_customer_idx on public.unifi_devices (customer, site);
create index if not exists unifi_devices_mac_idx on public.unifi_devices (mac);
alter table public.unifi_devices enable row level security;
drop policy if exists "unifi_devices: staff read" on public.unifi_devices;
create policy "unifi_devices: staff read" on public.unifi_devices
  for select using (public.is_staff());

create table if not exists public.unifi_events (
  id             bigserial primary key,
  controller_id  uuid references public.unifi_controllers(id) on delete cascade,
  customer       text not null,
  site           text,
  kind           text not null,               -- door-open | remote-unlock | device-offline | device-online | sync-error | alarm
  subject        text,                        -- door / device name
  actor          text,                        -- who (user, credential, 'ShieldTech OS')
  result         text,                        -- granted | denied | ok | error
  detail         jsonb,
  at             timestamptz not null default now()
);
create index if not exists unifi_events_customer_at_idx on public.unifi_events (customer, at desc);
alter table public.unifi_events enable row level security;
drop policy if exists "unifi_events: staff read" on public.unifi_events;
create policy "unifi_events: staff read" on public.unifi_events
  for select using (public.is_staff());

-- Every 5 minutes: pull devices + health from every enabled controller.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'shieldtech-unifi-sync';
    perform cron.schedule('shieldtech-unifi-sync', '*/5 * * * *',
      $job$select public.invoke_lead_function('unifi-proxy', '{"action":"sync-all"}')$job$);
  end if;
end $$;

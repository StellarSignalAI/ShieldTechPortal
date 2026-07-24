-- Automated daily lead pull — 4:00 AM Eastern every morning.
-- Schedules the three server-side lead lanes (sam-poll, sources-poll,
-- bid-sweep) so fresh opportunities land in public.opportunities before the
-- team logs in. The Secret Weapon Bid Board and the portal Bid Board both read
-- that table live (brFetchRemoteLeads), so scheduling here is all that's needed
-- for "leads pull in every morning".
--
-- SECRETS ARE NOT HARD-CODED. Before running this migration once, set two
-- Vault secrets in the Supabase dashboard (Project Settings → Vault) — or run:
--
--   select vault.create_secret(
--     'https://<PROJECT_REF>.supabase.co', 'project_url', 'Supabase functions base URL');
--   select vault.create_secret(
--     '<CRON_SECRET>', 'cron_secret', 'Shared secret sent as x-cron-secret to lead functions');
--
-- CRON_SECRET must equal the CRON_SECRET edge-function secret (the value in
-- scripts/go-live.env). The functions accept the call only when x-cron-secret
-- matches, so no user JWT is needed for the scheduled run.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- One helper so the three jobs stay identical and the secret is read at run
-- time from Vault (never stored in the job definition or this file).
create or replace function public.invoke_lead_function(fn text, payload jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  base   text;
  secret text;
  req_id bigint;
begin
  select decrypted_secret into base   from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if base is null or secret is null then
    raise notice 'invoke_lead_function: project_url or cron_secret not set in Vault — skipping %', fn;
    return null;
  end if;
  select net.http_post(
    url     := base || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body    := payload,
    timeout_milliseconds := 120000
  ) into req_id;
  return req_id;
end;
$$;

revoke all on function public.invoke_lead_function(text, jsonb) from public, anon, authenticated;

-- (Re)schedule the jobs. 08:00 UTC = 04:00 America/New_York during EDT
-- (summer). Standard time shifts this to 03:00 local; adjust to '0 9 * * *'
-- if a strict 4 AM year-round is required. Staggered a few minutes apart so
-- the three fetches don't contend.
select cron.unschedule('shieldtech-sam-poll')     where exists (select 1 from cron.job where jobname = 'shieldtech-sam-poll');
select cron.unschedule('shieldtech-sources-poll') where exists (select 1 from cron.job where jobname = 'shieldtech-sources-poll');
select cron.unschedule('shieldtech-bid-sweep')    where exists (select 1 from cron.job where jobname = 'shieldtech-bid-sweep');

select cron.schedule('shieldtech-sam-poll',     '0 8 * * *',  $$select public.invoke_lead_function('sam-poll',     '{"days":7}')$$);
select cron.schedule('shieldtech-sources-poll', '3 8 * * *',  $$select public.invoke_lead_function('sources-poll')$$);
select cron.schedule('shieldtech-bid-sweep',    '6 8 * * *',  $$select public.invoke_lead_function('bid-sweep')$$);

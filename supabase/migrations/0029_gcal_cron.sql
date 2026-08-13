-- Google Workspace Calendar sync — keep the shared "ShieldTech Schedule"
-- calendar current every 30 minutes. Reuses invoke_lead_function (0010),
-- which reads project_url + cron_secret from Vault and calls the edge
-- function with x-cron-secret; it no-ops safely until GOOGLE_SA_* secrets
-- are configured on the gcal-sync function (503 until then).
create extension if not exists pg_cron;

select cron.unschedule('shieldtech-gcal-sync')
where exists (select 1 from cron.job where jobname = 'shieldtech-gcal-sync');

select cron.schedule('shieldtech-gcal-sync', '*/30 * * * *',
  $$select public.invoke_lead_function('gcal-sync')$$);

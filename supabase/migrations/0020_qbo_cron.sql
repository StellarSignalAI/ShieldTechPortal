-- Nightly QuickBooks sync — 07:00 UTC (a couple of hours before the 08:00 UTC
-- lead pull) so the portal Finance suite shows current numbers each morning.
-- Reuses public.invoke_lead_function, which reads project_url + cron_secret
-- from Vault at run time and calls the edge function with x-cron-secret. The
-- qbo-sync function no-ops with a clear 503 until the QBO_* Intuit credentials
-- are set, so this schedule is safe to create before the connection is wired.
--
-- Requires the same Vault secrets as the lead cron (project_url, cron_secret);
-- if they are absent the helper simply skips.

create extension if not exists pg_cron;

select cron.unschedule('shieldtech-qbo-sync')
  where exists (select 1 from cron.job where jobname = 'shieldtech-qbo-sync');

select cron.schedule('shieldtech-qbo-sync', '0 7 * * *',
  $$select public.invoke_lead_function('qbo-sync', '{"direction":"pull"}')$$);

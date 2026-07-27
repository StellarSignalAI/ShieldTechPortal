-- SAM.gov API key via Vault (fallback to the SAM_GOV_API_KEY function secret).
--
-- Lets the key be provisioned with plain SQL —
--   select vault.create_secret('<KEY>', 'sam_gov_api_key', 'api.data.gov key');
-- — instead of requiring dashboard access to Edge Function secrets. sam-poll
-- reads it through this service-role-only helper when the env var is absent.

create or replace function public.get_sam_gov_api_key()
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'sam_gov_api_key' limit 1;
$$;

revoke all on function public.get_sam_gov_api_key() from public, anon, authenticated;
grant execute on function public.get_sam_gov_api_key() to service_role;

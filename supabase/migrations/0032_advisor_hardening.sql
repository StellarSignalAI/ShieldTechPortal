-- Advisor cleanups (applied 2026-08-15):
-- 1) Pin search_path on the time-entry guard trigger function.
alter function public.guard_time_entry_update() set search_path = public, pg_temp;

-- 2) Trigger functions never need to be callable through the API.
--    (Functions default to EXECUTE granted to PUBLIC, so revoke that too.)
revoke execute on function public.guard_profile_privileges() from public, anon, authenticated;
revoke execute on function public.guard_time_entry_update() from public, anon, authenticated;

-- 3) Role helpers are only evaluated inside RLS policies for signed-in users;
--    anon has no business calling them via /rest/v1/rpc.
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_staff() from anon;
revoke execute on function public.is_employee() from anon;

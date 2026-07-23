-- Fix infinite recursion in the profiles RLS policies.
-- The original "admins read/update all" policies queried public.profiles from
-- *within* a policy on public.profiles, which Postgres rejects as
-- "infinite recursion detected in policy for relation profiles" — so profile
-- reads failed for every signed-in user and the app showed "no access".
--
-- Fix: check admin via a SECURITY DEFINER helper that bypasses RLS.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin');
$$;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.is_admin() from anon, public;

drop policy if exists "profiles: admins read all" on public.profiles;
create policy "profiles: admins read all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles: admins update all" on public.profiles;
create policy "profiles: admins update all" on public.profiles
  for update using (public.is_admin());

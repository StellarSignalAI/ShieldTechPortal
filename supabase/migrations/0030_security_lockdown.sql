-- Security lockdown (full-platform audit, Aug 2026).
--
--  1. profiles: users can no longer change their own role/app_rights/email —
--     privilege changes are admin-only (trigger guard; service role exempt).
--  2. app_state shared rows: employees only (Admin/Staff/Manager/Technician/
--     Sales). Client-role customer logins can no longer read or write the
--     company-wide stores (invoices, projects, pipeline, …).
--  3. Storage buckets flipped PRIVATE for real (0028 documented it but never
--     ran the update). Object policies tightened: clients out, receipts
--     readable only by staff or their uploader, documents mutable only by
--     owner or staff.
--  4. attachments registry: authenticated employees only (was readable by anon).
--  5. time_entries: approved/synced/paid rows immutable except status/sync
--     bookkeeping; entries can never be reassigned to another technician.
--  6. profiles role CHECK extended to match the roles the invite flow actually
--     issues (Manager, Sales) — inviting a Sales rep previously 500'd.
--
-- Policy predicates use (select auth.uid()) so Postgres evaluates them once
-- per statement (auth_rls_initplan advisor).

-- ── role helpers ─────────────────────────────────────────────────────────────
create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles
                 where id = (select auth.uid()) and role in ('Admin','Staff','Manager'));
$$;
grant execute on function public.is_staff() to authenticated;
revoke execute on function public.is_staff() from anon, public;

create or replace function public.is_employee()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles
                 where id = (select auth.uid())
                   and role in ('Admin','Staff','Manager','Technician','Sales'));
$$;
grant execute on function public.is_employee() to authenticated;
revoke execute on function public.is_employee() from anon, public;

-- ── 6) profiles role CHECK matches the invite flow ──────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Admin','Staff','Manager','Technician','Sales','Client'));

-- ── 1) profiles: no self-escalation ─────────────────────────────────────────
-- RLS already scopes updates to own row; this guard stops the OWN row's
-- privileged columns from changing unless the caller is an Admin. Service-role
-- and auth-trigger contexts (auth.uid() is null) are exempt so invite/manage
-- functions and first-login id binding keep working.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is null then return new; end if;
  if (new.role is distinct from old.role
      or new.app_rights is distinct from old.app_rights
      or new.email is distinct from old.email
      or new.invited_by is distinct from old.invited_by)
     and not public.is_admin() then
    raise exception 'Only an Admin can change roles, app rights, or account email';
  end if;
  return new;
end $$;
drop trigger if exists profiles_privilege_guard on public.profiles;
create trigger profiles_privilege_guard before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ── 2) app_state: shared rows are employee-only ─────────────────────────────
drop policy if exists "state: shared read" on public.app_state;
create policy "state: shared read" on public.app_state
  for select using (owner is null and public.is_employee());

drop policy if exists "state: shared write" on public.app_state;
create policy "state: shared write" on public.app_state
  for insert with check (owner is null and public.is_employee());

drop policy if exists "state: shared update" on public.app_state;
create policy "state: shared update" on public.app_state
  for update using (owner is null and public.is_employee())
  with check (owner is null and public.is_employee());

drop policy if exists "state: own read" on public.app_state;
create policy "state: own read" on public.app_state
  for select using (owner = (select auth.uid()));
drop policy if exists "state: own write" on public.app_state;
create policy "state: own write" on public.app_state
  for insert with check (owner = (select auth.uid()));
drop policy if exists "state: own update" on public.app_state;
create policy "state: own update" on public.app_state
  for update using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

-- ── 3) storage: buckets private + tightened object policies ─────────────────
update storage.buckets set public = false
 where id in ('site-photos', 'documents', 'receipts');

-- site-photos: employees only (was: public read, any-profile write)
drop policy if exists "photos: public read" on storage.objects;
drop policy if exists "photos: authenticated read" on storage.objects;
create policy "photos: authenticated read" on storage.objects
  for select using (bucket_id = 'site-photos' and public.is_employee());
drop policy if exists "photos: authenticated upload" on storage.objects;
create policy "photos: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'site-photos' and public.is_employee());
drop policy if exists "photos: authenticated update" on storage.objects;
create policy "photos: authenticated update" on storage.objects
  for update using (bucket_id = 'site-photos' and public.is_employee());

-- documents: employees read; mutate only your own uploads unless staff
drop policy if exists "documents: public read" on storage.objects;
drop policy if exists "documents: authenticated read" on storage.objects;
create policy "documents: authenticated read" on storage.objects
  for select using (bucket_id = 'documents' and public.is_employee());
drop policy if exists "documents: authenticated upload" on storage.objects;
create policy "documents: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'documents' and public.is_employee());
drop policy if exists "documents: authenticated update" on storage.objects;
create policy "documents: owner or staff update" on storage.objects
  for update using (bucket_id = 'documents'
    and (owner = (select auth.uid()) or public.is_staff()));
drop policy if exists "documents: authenticated delete" on storage.objects;
create policy "documents: owner or staff delete" on storage.objects
  for delete using (bucket_id = 'documents'
    and (owner = (select auth.uid()) or public.is_staff()));

-- receipts: techs see only their own receipt images; staff see all
drop policy if exists "receipts: authenticated read" on storage.objects;
create policy "receipts: own or staff read" on storage.objects
  for select using (bucket_id = 'receipts'
    and (public.is_staff() or (storage.foldername(name))[1] = (select auth.uid())::text));
drop policy if exists "receipts: authenticated upload" on storage.objects;
create policy "receipts: own upload" on storage.objects
  for insert with check (bucket_id = 'receipts'
    and public.is_employee()
    and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ── 4) attachments registry: no anon reads, employees only for shared rows ──
drop policy if exists "attachments: read" on public.attachments;
create policy "attachments: read" on public.attachments
  for select to authenticated using (
    (shared = true and public.is_employee()) or owner = (select auth.uid())
  );

-- ── 5) time_entries: staff updates bounded; paid hours immutable ────────────
drop policy if exists "time: staff update" on public.time_entries;
create policy "time: staff update" on public.time_entries
  for update using (public.is_staff())
  with check (public.is_staff());

create or replace function public.guard_time_entry_update()
returns trigger language plpgsql as $$
begin
  if new.tech_id is distinct from old.tech_id then
    raise exception 'Time entries cannot be reassigned to another technician';
  end if;
  if old.status in ('approved','synced','paid')
     and (new.hours is distinct from old.hours
          or new.work_date is distinct from old.work_date
          or new.start_at is distinct from old.start_at
          or new.end_at is distinct from old.end_at) then
    raise exception 'Approved/synced/paid time entries are immutable — reject the entry instead';
  end if;
  return new;
end $$;
drop trigger if exists time_entries_guard on public.time_entries;
create trigger time_entries_guard before update on public.time_entries
  for each row execute function public.guard_time_entry_update();

-- messages policies referenced role 'Manager' before it was a legal role;
-- nothing to change there now that the CHECK includes it.

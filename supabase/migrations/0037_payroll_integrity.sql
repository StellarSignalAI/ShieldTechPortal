-- 0037: payroll integrity fixes
--  1. profiles.hourly_rate joins the privileged columns guarded by
--     guard_profile_privileges(): it was added (0035) after the guard (0030),
--     so any user could set their OWN pay rate via the "profiles: update own"
--     policy — and payroll math treats the portal rate as authoritative.
--  2. guard_time_entry_update(): the approved-timecard correction pipeline
--     (proposed_actions kind 'timecard_edit' → Admin approval → hr execute)
--     runs through the service role, which the trigger blocked — every
--     approved correction landed in status='failed'. The service path
--     (auth.uid() is null) is now exempt, mirroring the profile guard's
--     existing exemption. Human sessions remain fully blocked; tech_id
--     reassignment stays blocked for everyone.
--  3. payroll_exceptions unique(rule, tech_id, week_start): week_start is
--     null for the 'rate_missing' rule and Postgres treats NULLs as
--     distinct, so every exceptions_run inserted a fresh duplicate row.

-- ── 1) hourly_rate is admin-only ─────────────────────────────────────────────
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is null then return new; end if;
  if (new.role is distinct from old.role
      or new.app_rights is distinct from old.app_rights
      or new.email is distinct from old.email
      or new.invited_by is distinct from old.invited_by
      or new.hourly_rate is distinct from old.hourly_rate)
     and not public.is_admin() then
    raise exception 'Only an Admin can change roles, app rights, account email, or pay rates';
  end if;
  return new;
end $$;

-- ── 2) service-path timecard corrections ─────────────────────────────────────
create or replace function public.guard_time_entry_update()
returns trigger language plpgsql as $$
begin
  if new.tech_id is distinct from old.tech_id then
    raise exception 'Time entries cannot be reassigned to another technician';
  end if;
  -- Service path (hr function's approved+audited execution) may correct hours;
  -- every human session goes through the proposal → approval pipeline instead.
  if (select auth.uid()) is null then return new; end if;
  if old.status in ('approved','synced','paid')
     and (new.hours is distinct from old.hours
          or new.work_date is distinct from old.work_date
          or new.start_at is distinct from old.start_at
          or new.end_at is distinct from old.end_at) then
    raise exception 'Approved/synced/paid time entries are immutable — reject the entry instead';
  end if;
  return new;
end $$;

-- ── 3) rate_missing exceptions no longer duplicate ───────────────────────────
delete from public.payroll_exceptions a using public.payroll_exceptions b
 where a.rule = b.rule and a.tech_id = b.tech_id
   and a.week_start is null and b.week_start is null and a.id > b.id;
alter table public.payroll_exceptions
  drop constraint if exists payroll_exceptions_rule_tech_id_week_start_key;
alter table public.payroll_exceptions
  add constraint payroll_exceptions_rule_tech_id_week_start_key
  unique nulls not distinct (rule, tech_id, week_start);

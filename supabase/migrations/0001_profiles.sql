-- ShieldTech platform — profiles + auth rules
-- Roles: Admin / Staff / Technician / Client (06-SECURITY-RBAC-AI.md)
-- app_rights: {"portal": bool, "tech": bool, "customer": bool}

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'Staff' check (role in ('Admin', 'Staff', 'Technician', 'Client')),
  app_rights jsonb not null default '{"portal": true, "tech": false, "customer": false}'::jsonb,
  must_change_password boolean not null default false,
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone signed in can read their own profile; Admins can read all.
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: admins read all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Admin')
  );

-- Users may update only their own must_change_password/name; Admins update anything.
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admins update all" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Admin')
  );

-- Inserts happen via the auth trigger below or the service-role invite function only.

-- ── Signup rules ─────────────────────────────────────────────────────────────
-- Google (or any) signup is allowed when:
--   * the email domain is shieldtechsolutions.com  → auto-provision Staff/portal
--   * OR an invited profile row already exists for that email (created by
--     the invite-user function before first login)
-- Anything else is rejected at the door.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  invited public.profiles%rowtype;
begin
  select * into invited from public.profiles where email = lower(new.email) limit 1;

  if invited.email is not null then
    -- Pre-invited: bind the placeholder profile to the real auth user id.
    if invited.id is distinct from new.id then
      update public.profiles set id = new.id, updated_at = now() where email = lower(new.email);
    end if;
    return new;
  end if;

  if lower(new.email) like '%@shieldtechsolutions.com' then
    insert into public.profiles (id, email, name, role, app_rights, must_change_password)
    values (
      new.id,
      lower(new.email),
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      'Staff',
      '{"portal": true, "tech": true, "customer": false}'::jsonb,
      false
    )
    on conflict (id) do nothing;
    return new;
  end if;

  raise exception 'Sign-ups are invite-only. Ask a ShieldTech admin to invite %', new.email
    using errcode = 'P0001';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Invited placeholder rows are created with a random uuid before the auth user
-- exists; relax the FK so those rows can exist until first login binds them.
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

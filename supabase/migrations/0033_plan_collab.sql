-- Plan Room collaboration — Bluebeam-Studio-style sessions on blueprints.
-- Two layers on top of the existing drawing markup (drawanno store):
--   • plan_threads   — numbered comment pins dropped at a location on a sheet
--                      (Autodesk-issue-style), open/resolved lifecycle.
--   • plan_messages  — chat messages; thread_id set = replies on a pin,
--                      thread_id null = the sheet's live session chat.
-- Internal-only (Admin/Staff/Manager/Technician/Sales); Clients never see
-- plan collaboration. Realtime-enabled so every open session updates live.

create table if not exists public.plan_threads (
  id           text primary key,                -- client id (th-…)
  drawing_id   text not null,                   -- drawing id from the project's drawings list
  project_ref  text,                            -- PRJ-… number, for cross-links
  num          int  not null,                   -- pin number shown on the sheet
  x            int  not null,                   -- normalized 0-1000 sheet space (same as markups)
  y            int  not null,
  status       text not null default 'open' check (status in ('open','resolved')),
  title        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_name text,
  created_at   timestamptz not null default now(),
  resolved_by  text,
  resolved_at  timestamptz
);
create index if not exists plan_threads_drawing_idx on public.plan_threads (drawing_id, created_at);

create table if not exists public.plan_messages (
  id           uuid primary key default gen_random_uuid(),
  drawing_id   text not null,
  thread_id    text references public.plan_threads(id) on delete cascade,
  sender_id    uuid references public.profiles(id) on delete set null,
  sender_name  text,
  sender_role  text,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists plan_messages_drawing_idx on public.plan_messages (drawing_id, created_at);
create index if not exists plan_messages_thread_idx on public.plan_messages (thread_id, created_at);

alter table public.plan_threads  enable row level security;
alter table public.plan_messages enable row level security;

-- Any internal teammate can see and join the session; Clients cannot.
create policy "plan_threads: read" on public.plan_threads
  for select using (public.is_employee());
create policy "plan_threads: insert" on public.plan_threads
  for insert with check (created_by = (select auth.uid()) and public.is_employee());
-- Resolve/reopen (status flip) is open to any internal teammate.
create policy "plan_threads: update" on public.plan_threads
  for update using (public.is_employee());

create policy "plan_messages: read" on public.plan_messages
  for select using (public.is_employee());
create policy "plan_messages: insert" on public.plan_messages
  for insert with check (sender_id = (select auth.uid()) and public.is_employee());

alter publication supabase_realtime add table public.plan_threads;
alter publication supabase_realtime add table public.plan_messages;

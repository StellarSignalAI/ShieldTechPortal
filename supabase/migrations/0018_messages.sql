-- Two-way messaging between the field (tech app) and the office (portal).
-- Model: one thread per technician, keyed by the technician's profile id.
--   • A technician posts into their own thread (thread_id = their id).
--   • Any dispatcher (Admin/Staff) can read every thread and post into any of
--     them — that's the office side of the conversation.
-- Realtime-enabled so both ends update live.

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references public.profiles(id) on delete cascade, -- the technician
  sender_id    uuid not null references public.profiles(id) on delete set null,
  sender_name  text,
  sender_role  text,
  body         text not null,
  work_order_id text,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

create index if not exists messages_thread_idx on public.messages (thread_id, created_at);

alter table public.messages enable row level security;

-- Read: the technician on their own thread, or any dispatcher (Admin/Staff).
create policy "messages: read" on public.messages
  for select using (
    thread_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff','Manager'))
  );

-- Insert: you must be the sender, and either posting into your own thread (a
-- technician) or be a dispatcher posting into any technician's thread.
create policy "messages: insert" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and (
      thread_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff','Manager'))
    )
  );

-- Update (mark read): the technician on their thread, or a dispatcher.
create policy "messages: update" on public.messages
  for update using (
    thread_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff','Manager'))
  );

-- Live updates for both surfaces.
alter publication supabase_realtime add table public.messages;

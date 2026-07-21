-- AI service run log (single AI service layer per 06-SECURITY-RBAC-AI.md)
create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  feature text not null,
  model text,
  prompt_chars integer,
  completion_chars integer,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

alter table public.ai_runs enable row level security;

create policy "ai_runs: admins read" on public.ai_runs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Admin')
  );
-- Inserts come from the service-role Edge Function only.

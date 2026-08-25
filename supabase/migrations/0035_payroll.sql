-- Payroll: weekly hours × rate → owed / paid tracking.
--   • profiles.hourly_rate — each person's pay rate, edited by Admins on the
--     Payroll screen (Rippling's mirrored pay_rate is the fallback).
--   • payroll_payments — one row per tech per week marked paid, keeping the
--     hours/rate/amount as they were at payout time so later edits can't
--     rewrite history.

alter table public.profiles add column if not exists hourly_rate numeric(10,2);

create table if not exists public.payroll_payments (
  id         uuid primary key default gen_random_uuid(),
  tech_id    uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,                    -- Monday of the paid week
  hours      numeric(8,2) not null default 0,
  rate       numeric(10,2),
  amount     numeric(12,2) not null default 0,
  note       text,
  paid_by    uuid references public.profiles(id) on delete set null,
  paid_at    timestamptz not null default now(),
  unique (tech_id, week_start)
);

alter table public.payroll_payments enable row level security;

-- Office runs payroll; each tech can see their own payout history.
create policy "payroll: staff all" on public.payroll_payments
  for all using (public.is_staff()) with check (public.is_staff());
create policy "payroll: own read" on public.payroll_payments
  for select using (tech_id = (select auth.uid()));

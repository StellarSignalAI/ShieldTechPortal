-- HR / Rippling integration foundations (see docs/rippling-integration-plan.md)
--   • rippling_workers grows roster columns so it fully serves as the
--     employee↔Rippling mapping + mirror (no separate employee_integrations).
--   • integration_connections / integration_sync_runs — connection state,
--     feature flags (all dangerous writes default OFF) and sync history.
--   • labor_cost_config — configurable loaded-labor burden components; no
--     hardcoded tax/burden percentages live in code.
--   • payroll_snapshots / payroll_exceptions — Payroll Center data.
--   • proposed_actions — the human-approval gate for every financially
--     consequential action. AI/MCP can only create rows in awaiting_approval;
--     approval/execution happen server-side in the hr edge function.
--   • audit_events — immutable audit log (insert via service role only).
--   • financial_metric_snapshots / business_recommendations /
--     staffing_forecasts / scenario_runs — BI layer with provenance.

-- ── Worker mirror: roster fields + linkage provenance ──────────────────────
alter table public.rippling_workers add column if not exists title text;
alter table public.rippling_workers add column if not exists department text;
alter table public.rippling_workers add column if not exists status text;          -- ACTIVE | TERMINATED | … as reported by Rippling
alter table public.rippling_workers add column if not exists start_date date;
alter table public.rippling_workers add column if not exists end_date date;
alter table public.rippling_workers add column if not exists match_method text;    -- email | manual
alter table public.rippling_workers add column if not exists sync_error text;

-- ── Integration connection state + feature flags ───────────────────────────
create table if not exists public.integration_connections (
  provider    text primary key,                -- 'rippling'
  status      text not null default 'disconnected',  -- disconnected | connected | error
  config      jsonb not null default '{}'::jsonb,    -- feature flags; NEVER credentials
  last_ok_at  timestamptz,
  last_error  text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.integration_sync_runs (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  kind         text not null,                  -- workers | worker | time_push | time_pull | exceptions | metrics
  status       text not null default 'running',-- running | ok | error
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  stats        jsonb,
  error        text,
  triggered_by text                            -- profile id | 'cron' | 'mcp'
);
create index if not exists integration_sync_runs_idx on public.integration_sync_runs (provider, started_at desc);

-- ── Loaded labor cost configuration (Admin-editable, no hardcoded rates) ───
create table if not exists public.labor_cost_config (
  id         int primary key default 1 check (id = 1),
  components jsonb not null default '[]'::jsonb,  -- [{key,label,type:'percent'|'per_hour'|'per_period',value,enabled}]
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ── Payroll Center ─────────────────────────────────────────────────────────
create table if not exists public.payroll_snapshots (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'upcoming',   -- upcoming | history
  period_start date not null,
  period_end   date not null,
  totals       jsonb not null default '{}'::jsonb, -- {hours, regular, overtime, gross, loaded, workers, completeness}
  per_worker   jsonb not null default '[]'::jsonb, -- [{tech_id,name,hours,ot_hours,rate,gross,loaded,flags}]
  source       text not null default 'time_entries',
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists payroll_snapshots_idx on public.payroll_snapshots (period_start desc);

create table if not exists public.payroll_exceptions (
  id          uuid primary key default gen_random_uuid(),
  rule        text not null,                   -- missing_time | high_overtime | unapproved | big_delta | duplicate | terminated_hours | rate_missing | implausible_hours
  severity    text not null default 'warn',    -- info | warn | critical
  tech_id     uuid references public.profiles(id) on delete cascade,
  week_start  date,
  details     jsonb not null default '{}'::jsonb,
  status      text not null default 'open',    -- open | acknowledged | resolved
  created_at  timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  unique (rule, tech_id, week_start)
);
create index if not exists payroll_exceptions_open_idx on public.payroll_exceptions (status, created_at desc);

-- ── Human-approval gate for consequential actions ──────────────────────────
create table if not exists public.proposed_actions (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,                  -- hire_draft | comp_change | bonus | payroll_run | timecard_edit | status_change
  summary      text not null,
  payload      jsonb not null default '{}'::jsonb,
  status       text not null default 'draft'
               check (status in ('draft','awaiting_approval','approved','executing','completed','failed','rejected','expired')),
  created_by   uuid references public.profiles(id) on delete set null,
  created_via  text not null default 'ui',     -- ui | mcp | advisor
  approved_by  uuid references public.profiles(id) on delete set null,
  approved_at  timestamptz,
  expires_at   timestamptz,
  executed_at  timestamptz,
  result       jsonb,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- An approved/executed action must carry a real approver row.
  constraint proposed_actions_approver check (
    status in ('draft','awaiting_approval','rejected','expired') or approved_by is not null
  )
);
create index if not exists proposed_actions_status_idx on public.proposed_actions (status, created_at desc);
drop trigger if exists proposed_actions_touch on public.proposed_actions;
create trigger proposed_actions_touch before update on public.proposed_actions
  for each row execute function public.touch_updated_at();

-- ── Immutable audit log ────────────────────────────────────────────────────
create table if not exists public.audit_events (
  id           uuid primary key default gen_random_uuid(),
  actor        uuid,
  actor_name   text,
  actor_role   text,
  action       text not null,                  -- e.g. rippling.sync.workers, action.approved, payroll.exception.resolved
  subject_type text,
  subject_id   text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_events_idx on public.audit_events (created_at desc);
create index if not exists audit_events_action_idx on public.audit_events (action, created_at desc);

-- ── BI layer ───────────────────────────────────────────────────────────────
create table if not exists public.financial_metric_snapshots (
  id            uuid primary key default gen_random_uuid(),
  metric        text not null,                 -- labor_cost_week | revenue_month | ar_open | …
  period_start  date,
  period_end    date,
  value         numeric,
  meta          jsonb not null default '{}'::jsonb,  -- {source, completeness, calculated_at, inputs}
  created_at    timestamptz not null default now()
);
create index if not exists financial_metric_snapshots_idx on public.financial_metric_snapshots (metric, created_at desc);

create table if not exists public.business_recommendations (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,                    -- overtime | staffing | margin | ar | payroll_hygiene
  severity   text not null default 'info',
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,   -- grounded inputs the rule used
  status     text not null default 'new',     -- new | dismissed | actioned
  created_at timestamptz not null default now()
);

create table if not exists public.staffing_forecasts (
  id         uuid primary key default gen_random_uuid(),
  params     jsonb not null default '{}'::jsonb,
  result     jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.scenario_runs (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,                    -- rate_change | headcount | utilization | hire_vs_ot
  inputs     jsonb not null default '{}'::jsonb,
  outputs    jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.integration_connections    enable row level security;
alter table public.integration_sync_runs      enable row level security;
alter table public.labor_cost_config          enable row level security;
alter table public.payroll_snapshots          enable row level security;
alter table public.payroll_exceptions         enable row level security;
alter table public.proposed_actions           enable row level security;
alter table public.audit_events               enable row level security;
alter table public.financial_metric_snapshots enable row level security;
alter table public.business_recommendations   enable row level security;
alter table public.staffing_forecasts         enable row level security;
alter table public.scenario_runs              enable row level security;

-- Office (Admin/Staff/Manager) reads HR/BI data; flags + approvals are edge-
-- function-side (service role) so no client write policy exists where the
-- function must be the only writer.
create policy "intconn: staff read"  on public.integration_connections for select using (public.is_staff());
create policy "syncruns: staff read" on public.integration_sync_runs   for select using (public.is_staff());

create policy "laborcfg: staff read" on public.labor_cost_config for select using (public.is_staff());
create policy "laborcfg: admin write" on public.labor_cost_config
  for all using (public.is_admin()) with check (public.is_admin());

create policy "paysnap: staff read" on public.payroll_snapshots for select using (public.is_staff());
create policy "payex: staff read"   on public.payroll_exceptions for select using (public.is_staff());
create policy "payex: staff update" on public.payroll_exceptions
  for update using (public.is_staff()) with check (public.is_staff());

-- Proposed actions: staff can read and create drafts/awaiting_approval rows;
-- approval, execution and terminal states are ONLY reachable through the hr
-- edge function (service role), so no client update policy is granted.
create policy "actions: staff read" on public.proposed_actions for select using (public.is_staff());
create policy "actions: staff insert" on public.proposed_actions
  for insert with check (
    public.is_staff()
    and created_by = (select auth.uid())
    and status in ('draft','awaiting_approval')
    and approved_by is null
  );

-- Audit log: staff read; nobody inserts/updates/deletes from the client.
create policy "audit: staff read" on public.audit_events for select using (public.is_staff());

create policy "finmetrics: staff read" on public.financial_metric_snapshots for select using (public.is_staff());
create policy "recos: staff read"   on public.business_recommendations for select using (public.is_staff());
create policy "recos: staff update" on public.business_recommendations
  for update using (public.is_staff()) with check (public.is_staff());

create policy "forecasts: staff all" on public.staffing_forecasts
  for all using (public.is_staff()) with check (public.is_staff());
create policy "scenarios: staff all" on public.scenario_runs
  for all using (public.is_staff()) with check (public.is_staff());

-- Seed the Rippling connection row with every dangerous flag OFF.
insert into public.integration_connections (provider, status, config)
values ('rippling', 'disconnected', jsonb_build_object(
  'enabled', false,
  'writes_enabled', false,
  'hiring_enabled', false,
  'payroll_write_enabled', false,
  'ai_recommendations_enabled', false
))
on conflict (provider) do nothing;

# Rippling HR / Payroll / BI Integration — How It Works

The HR Center (portal → ADMIN → HR Center; mobile → All menu → HR Center) is the
UI for the Rippling-backed HR, payroll, labor-cost, hiring and business-
intelligence system. Everything server-side lives in three Supabase edge
functions; the browser never sees a Rippling credential.

## Components

| Piece | Where | Purpose |
|---|---|---|
| Endpoint registry + client | `supabase/functions/_shared/rippling.ts` | The ONLY module that talks to Rippling (`https://rest.ripplingapis.com`). Bearer auth, optional `Rippling-API-Version` header, cursor pagination, timeout, 429/5xx retry with backoff, correlation IDs. The token never appears in logs, errors or responses. |
| `hr` function | `supabase/functions/hr/` | Server API: status/flags, worker sync, payroll snapshots, exception engine, metrics + recommendations, daily brief, and the proposed-action approval pipeline. Office JWT (Admin/Staff/Manager) or `x-cron-secret`. |
| `rippling-sync` function | `supabase/functions/rippling-sync/` | Pre-existing two-way time-entry sync (approve flow pushes approved hours; PAID/FINALIZED pulls back). Unchanged contract. |
| `mcp-hr` function | `supabase/functions/mcp-hr/` | MCP server (official SDK, Streamable HTTP) for AI clients. Read/analyze/prepare tools + human-gated approve. |
| Calc engine | `packages/shared/labor-calc.js` | Pure deterministic math (OT split, loaded cost, hire-vs-OT, forecast, scenarios). Unit tests: `node --test tests/labor-calc.test.mjs`. The LLM never does arithmetic. |
| Client layer | `packages/shared/hr.js` | `window.__shieldHR` — calls the `hr` function and reads HR tables under RLS. |
| UI | `packages/shared/proto/screen-hr.jsx` | HR Center tabs: People, Payroll Center, Hiring & Actions, Insights, Audit, Setup. |
| Schema | `supabase/migrations/0036_hr_rippling.sql` | Tables + RLS below. |

## Data model

- `rippling_workers` — Rippling mirror **and** employee↔worker mapping
  (`profile_id`, `match_method` email/manual). Sync never silently overwrites a
  manual link; disagreements land in `sync_error` and the run's conflict count.
  Stores roster + hourly rate only — never SSNs, bank details or tax IDs.
- `integration_connections` — connection status + feature flags
  (`enabled`, `writes_enabled`, `hiring_enabled`, `payroll_write_enabled`,
  `ai_recommendations_enabled`; all default OFF) and configurable exception
  thresholds. Credentials are never stored here.
- `integration_sync_runs` — history of every sync with stats/errors.
- `labor_cost_config` — burden components (percent of gross / $ per hour /
  $ per period). No tax or burden percentage is hardcoded anywhere.
- `payroll_snapshots` — per-period totals + per-worker detail (hours, weekly-OT
  split, gross, loaded, flags) with a completeness verdict. Workers without a
  rate are flagged and excluded from totals — missing data is never estimated.
- `payroll_exceptions` — output of the exception engine: `missing_time`,
  `high_overtime`, `unapproved`, `big_delta`, `duplicate`, `terminated_hours`,
  `rate_missing`, `implausible_hours` (thresholds configurable in Setup flags).
- `proposed_actions` — the approval pipeline (below).
- `audit_events` — immutable log (insert-only via service role; no client
  write/update/delete policy exists). Surfaced in the Audit tab.
- `financial_metric_snapshots` / `business_recommendations` /
  `staffing_forecasts` / `scenario_runs` — BI layer. Every metric carries
  `{source, completeness, calculated_at}` provenance.

## Payroll safety model (the critical part)

No AI output can submit payroll, change compensation, hire, terminate, or touch
pay. The only path to a consequential action:

1. **Prepare** — UI or MCP `prepare_*` tool creates a `proposed_actions` row in
   `awaiting_approval` (RLS only allows creating rows in that state, with
   `approved_by` null).
2. **Approve** — a human **Admin** calls the `hr` function; approval is recorded
   server-side from the authenticated JWT. An `approved: true` field in any
   request body or tool argument is ignored — it isn't even read. An action
   created via MCP/advisor can never be approved by the identity that created it.
3. **Execute** — Admin-only, requires status `approved` + a recorded approver +
   the relevant feature flag ON; the row is claimed atomically
   (`approved → executing`) so a double submit can't run twice; expired
   approvals are refused.
4. **Execution semantics**:
   - `local_rate_change`, `timecard_edit` — applied to portal tables.
   - `hire_draft`, `comp_change`, `bonus`, `payroll_run`, `status_change` —
     produce the validated hand-off package + deep link into Rippling. Rippling
     exposes no verified public endpoint to submit/finalize these from here,
     and per policy we do **not** use browser automation, scraping or
     undocumented APIs — the final step is completed in Rippling by the human
     ("Final onboarding action required in Rippling").
5. Every transition is written to `audit_events`.

## AI grounding

The Insights advisor and MCP clients receive only real queried data: metric
snapshots with provenance, deterministic calculator outputs, exception counts
and pending approvals. The prompt instructs the model to answer only from that
context and to report missing data as missing. Recommendations are produced by
deterministic rules (`hr` function `metrics_run`), stored with the inputs each
rule used; the model may summarize them, never invent them. Compensation data
sent to the model is limited to what the requesting office user can already
see; SSNs/bank/tax identifiers are never stored in this system at all.

## Observability

Structured events logged (no tokens, no sensitive values): `rippling.request`
(correlation id, path, status, attempt), `rippling.sync.*`, `payroll.prepared`,
`payroll.exceptions.run`, `action.proposed|approved|rejected|executed|failed|expired`,
`integration.flags.changed`, `business.recommendation.generated`, `metrics.run` —
all also visible in the Audit tab via `audit_events`.

## Scheduled work

Existing pg_cron → edge-function pattern applies: point a cron job at
`POST /functions/v1/hr` with `x-cron-secret` and a body like
`{"action":"sync_workers"}`, `{"action":"exceptions_run"}` or
`{"action":"metrics_run"}`. Runs are idempotent (upserts keyed on natural
keys) and recorded in `integration_sync_runs` / `audit_events`.

## Two MCP server instances

Both are Streamable-HTTP MCP servers (official SDK). Each requires an office
user's Supabase access token (`Authorization: Bearer …`) AND, when its access
key secret is set, a matching `x-mcp-key` header — so each instance is
independently revocable (rotate/clear `MCP_BUSINESS_ACCESS_KEY` or
`MCP_HR_ACCESS_KEY`). Every audit event they write carries the instance name.
Shared plumbing lives in `_shared/mcp-common.ts`; Rippling credential
selection in `_shared/rippling.ts` (`business` → `BUSINESS_RIPPLING_API_TOKEN`,
`hr` → `HR_RIPPLING_API_TOKEN`, each falling back to `RIPPLING_API_TOKEN`).

### `POST /functions/v1/mcp-business` — ShieldTech Business MCP
Read + analyze only; deterministic math server-side; missing data returns
null, never an estimate. Tools: `business_get_health`,
`business_get_daily_brief`, `business_get_alerts`,
`business_get_recommendations`, `business_refresh_metrics`,
`rippling_get_workers` (mirror, or `live:true` via the business credential),
`rippling_get_worker`, `rippling_get_compensation`, `rippling_get_time`,
`rippling_get_payroll_periods`, `rippling_get_payroll_history`,
`rippling_get_organization`, `labor_analyze_employee`,
`labor_analyze_project`, `labor_get_utilization`, `labor_get_overtime`,
`finance_get_summary`, `finance_get_cashflow`, `finance_get_payroll_ratio`,
`staffing_get_capacity`, `staffing_forecast`,
`staffing_compare_hire_vs_overtime`, `scenario_hire_employee`,
`scenario_change_compensation`, `scenario_change_billing_rate`,
`scenario_reduce_overtime`.

### `POST /functions/v1/mcp-hr` — ShieldTech HR/Payroll MCP
Read + analyze + PREPARE; consequential changes require the human-approval
pipeline. Tools: `hr_get_workers`, `hr_get_worker`, `hr_get_compensation`,
`hr_sync_workers`, `time_get_entries`, `time_get_employee_summary`,
`payroll_get_current_period`, `payroll_get_history`, `payroll_preview`,
`payroll_get_exceptions`, `payroll_run_exception_scan`,
`payroll_compare_periods`, `hr_prepare_new_hire`,
`hr_prepare_employee_change`, `hr_prepare_compensation_change`,
`time_prepare_change`, `payroll_prepare_bonus`, `get_proposed_actions`,
`approve_and_execute_action`, `reject_action`, `rippling_get_capabilities`.

Rippling Functions execution and payroll submission are deliberately NOT
exposed: those capabilities could not be verified against current official
Rippling documentation from this deployment environment, and unverified
endpoints are never called — `rippling_get_capabilities` reports exactly this.

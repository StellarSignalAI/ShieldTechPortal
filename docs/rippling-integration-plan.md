# Rippling HR / Payroll / Labor-Cost / Hiring / BI — Integration Plan

Status: living document. Written from a full repository discovery pass before any
implementation; the checklist at the bottom tracks what has actually shipped.
Companion docs: `docs/rippling-integration.md` (how it works) and
`docs/rippling-setup-checklist.md` (what Daniel has to configure).

---

## 1. Repository discovery — what exists today

### 1.1 Frontend architecture
- npm-workspaces monorepo: `apps/{portal,tech,customer,sales}` are thin Vite/React
  shells; all real screens live in `packages/shared/proto/*.jsx` as top-level
  functions promoted to `window` globals by `vite-plugin-proto-globals`.
- Which screens each app bundles is controlled by `packages/shared/proto-manifest*.js`.
- Portal navigation: `packages/shared/proto/shell.jsx` (`NAV_GROUPS`, titles map),
  `apps/portal/src/desktop.jsx` (`SCREEN_LIST` + `SCREEN_COMPONENTS`),
  `packages/shared/proto/screen-hubs.jsx` (tabbed hub screens + `hubInitial()`),
  `packages/shared/proto/mobile-app.jsx` (`M_SCREEN_MAP`).
- Client data layers are small modules exposing `window.__shield*` globals:
  `time.js` (`__shieldTime`), `qbo.js` (`__shieldQBO`), `ai.js` (`__shieldAI`),
  `storage.js`, `store-sync.js` (Supabase-synced stores). All degrade gracefully
  when Supabase is unconfigured.

### 1.2 Backend / database
- Supabase project `dzfkgvyndodearolypvn`. Migrations `0001`–`0035` in
  `supabase/migrations/`. Roles: `Admin | Staff | Manager | Technician | Sales | Client`
  on `public.profiles`, with security-definer helpers `is_admin()`,
  `is_staff()` (Admin/Staff/Manager), `is_employee()` (…+Technician+Sales) used in RLS.
- Edge functions (Deno, sources in `supabase/functions/`, deployed with
  `verify_jwt:false` + in-function JWT/role checks via service client): `ai`,
  `send-email`, `qbo-sync`, `rippling-sync`, `invite-user`, `manage-user`,
  `estimate-accept`, `invoice-pay`, `stripe-webhook`, `gcal-sync`,
  `time-reminder`, and pollers. Cron: pg_cron jobs hit functions with an
  `x-cron-secret` header (`CRON_SECRET`).
- Email design system in `supabase/functions/_shared/email.ts`.

### 1.3 Existing HR / time / payroll assets (build on, do not duplicate)
- `time_entries` (0004): tech hours with status
  `draft|submitted|approved|rejected|synced|paid`, plus `rippling_entry_id`,
  `rippling_status`, `sync_error` columns — the local↔Rippling linkage for time.
- `rippling_workers` (0004): the Rippling worker mirror **and** the
  employee↔integration mapping (`rippling_worker_id` PK ↔ `profile_id`), with
  `pay_rate`, `employment_type`, `last_synced`. This *is* the
  `employee_integrations` concept for Rippling; we extend it rather than adding
  a duplicate table.
- `profiles.hourly_rate` + `payroll_payments` (0035): manual weekly payroll
  ledger behind the Payroll screen (`screen-payroll.jsx`, `time.js`).
- Deployed edge function `rippling-sync` (v2): pulls `/workers` (cursor
  pagination) into `rippling_workers`, pushes approved local entries to
  `POST /time-entries` (idempotency_key = local id), pulls per-entry status
  back (`PAID|FINALIZED` ⇒ local `paid`). Admin/Staff JWT or `CRON_SECRET`.
  Uses `RIPPLING_API_TOKEN`, base `RIPPLING_API_BASE` (default
  `https://rest.ripplingapis.com`).
- Approval UI: `TimesheetApprovalScreen` (weekly grouping, per-day expanders),
  `PayrollScreen` (hours × rate, owed/paid).

### 1.4 Financial data (for the BI layer)
- QuickBooks: `qbo-sync` edge function + `qbo_*` landing tables
  (`qbo_invoices`, `qbo_bills`, `qbo_payments`, `qbo_report_snapshots` incl.
  profit_loss/balance_sheet/ar_aging/ap_aging …) read through
  `packages/shared/qbo.js` (`window.__shieldQBO`). The BI layer consumes these
  tables — no new QuickBooks client is needed.

### 1.5 AI
- Single `ai` edge function (server-side key); clients call
  `window.__shieldAI.shieldAIChat(feature, messages, context)`. The HR advisor
  reuses this — grounded context is assembled from real queried metrics, the
  model only interprets.

## 2. Rippling API — verified surface

Per the requirement to use only Rippling's official REST API
(base `https://rest.ripplingapis.com`, bearer `RIPPLING_API_TOKEN`,
cursor pagination via `limit`/`cursor` → `next_cursor`):

- **Verified in production use by this repo today** (deployed `rippling-sync`):
  `GET /workers` (paginated, compensation incl. hourly wage),
  `POST /time-entries`, `GET /time-entries/{id}`.
- Every Rippling path the code touches is centralized in ONE module —
  `supabase/functions/_shared/rippling.ts` — so the endpoint surface is
  auditable in a single place. No endpoint is called anywhere else.
- **Not verifiable from this environment** (developer.rippling.com is not
  reachable from the build sandbox): a public *submit/finalize payroll run*
  endpoint and a public *draft hire* endpoint. Per the hard rule — no invented
  endpoints, no scraping, no fake implementations — both flows are implemented
  as **prepare → validate → human approval → deep-link into Rippling** to
  perform the final action in Rippling itself, with the integration point
  isolated behind the client module so a documented endpoint can be dropped in
  later after verification against developer.rippling.com. The UI says exactly
  this ("Final onboarding action required in Rippling").

## 2b. Two-instance architecture (Business MCP vs HR/Payroll MCP)

The integration runs as TWO separate MCP server instances that share libraries
and the database but stay independently authenticated, configurable,
deployable, auditable and revocable:

| | `mcp-business` | `mcp-hr` |
|---|---|---|
| Purpose | BI, labor analytics, finance, staffing, profitability, scenarios | HR admin, hiring, compensation, time, payroll workflows |
| Rippling credential | `BUSINESS_RIPPLING_API_TOKEN` | `HR_RIPPLING_API_TOKEN` |
| Instance access key | `MCP_BUSINESS_ACCESS_KEY` (`x-mcp-key`) | `MCP_HR_ACCESS_KEY` (`x-mcp-key`) |
| Write capability | none (read + analyze + scenario logs) | prepare-only → human Admin approval via the `hr` function |
| Audit tag | `instance:"mcp-business"` | `instance:"mcp-hr"` |

Both tokens fall back to the legacy `RIPPLING_API_TOKEN` so a single-token
setup keeps working until the dedicated tokens are created. Revoking either
instance = rotate/clear its access key (and/or its Rippling token) — the other
is untouched. Credential selection lives in one place
(`_shared/rippling.ts:tokenFor`), so the two tokens can never mix.

**Browser-automation note:** creating the two Rippling API tokens could not be
done from the build environment (no browser-control MCP attached; the network
egress proxy blocks rippling.com; a container browser would be invisible for
login/MFA anyway). The exact 2-minute manual steps are in
`docs/rippling-setup-checklist.md`; everything on the application side is done.

## 3. Architecture decisions

1. **All Rippling traffic stays server-side** in edge functions. The browser
   never sees `RIPPLING_API_TOKEN`; the client talks to our `hr` function with
   the user's Supabase JWT.
2. **One new `hr` edge function** is the API for everything new (status, flags,
   sync, exceptions, payroll prep, proposed actions, daily brief, audit
   queries). `rippling-sync` stays as-is for the existing approve-flow
   contract; `hr` reuses the same client module.
3. **Approval infrastructure = `proposed_actions` table** with a strict status
   machine (`draft → awaiting_approval → approved → executing →
   completed|failed`, plus `rejected|expired`). Approval is recorded
   server-side from the authenticated JWT (Admin only). An `approved: true`
   flag arriving in any request body or AI/MCP tool call is ignored — approval
   exists only as a DB row written by the `hr` function after verifying the
   caller. Execution re-checks status + expiry and is idempotent.
4. **AI/MCP can read and prepare, never execute.** MCP server (`mcp-hr` edge
   function, official `@modelcontextprotocol/sdk`, Streamable HTTP) exposes
   read/analyze tools plus `prepare_*` tools that create `proposed_actions` in
   `awaiting_approval`. `approve_*` tools exist but only succeed when the MCP
   connection itself is authenticated as an Admin human token — the LLM cannot
   forge it because the check is on the transport credential, not arguments.
5. **Deterministic math lives in `packages/shared/labor-calc.js`** — pure
   functions (loaded-cost, OT split, hire-vs-OT, scenarios, forecast) unit
   tested with `node --test`. The LLM never does arithmetic; screens and the
   advisor call these and pass results as grounded context.
6. **Every metric carries provenance**: `{ value, source, period, calculated_at,
   completeness }`. Missing data renders as "no data", never as a number.
7. **Feature flags** live in `integration_connections.config` (single Rippling
   row): `enabled`, `writes_enabled`, `hiring_enabled`, `payroll_write_enabled`,
   `ai_recommendations_enabled` — all default **off**; Admin toggles in the HR
   Setup tab.
8. **Immutable audit**: `audit_events` is insert-only (writes only via service
   role inside edge functions; no update/delete RLS policies exist), surfaced
   in an Audit tab with filters.
9. **Sensitive-data rule**: we never store or fetch SSNs, bank details, tax
   IDs. The worker mirror keeps only name/email/title/department/employment
   type/status/start date/pay rate. Compensation values are never placed in AI
   prompt context unless the feature explicitly requires a rate for a
   calculation already visible to that (staff) user, and never logged.

## 4. Database migration `0036_hr_rippling.sql`

- extend `rippling_workers`: `title`, `department`, `status`, `start_date`,
  `end_date`, `match_method`, `sync_error`.
- `integration_connections` (provider pk-unique, status, config jsonb, last_ok_at)
- `integration_sync_runs` (provider, kind, status, started/finished, stats jsonb, error, triggered_by)
- `labor_cost_config` (id=1 row; components jsonb: percent / per-hour / per-period burden items; no hardcoded percentages anywhere)
- `payroll_snapshots` (period, kind upcoming|history, totals jsonb, per_worker jsonb, source)
- `payroll_exceptions` (rule, severity, tech_id, week_start, details jsonb, status open|acknowledged|resolved)
- `proposed_actions` (kind, payload/summary, status machine above, created_by, approved_by/at, expires_at, executed_at, result, error)
- `audit_events` (actor, actor_role, action, subject_type/id, details jsonb) — insert-only
- `financial_metric_snapshots`, `business_recommendations`, `staffing_forecasts`, `scenario_runs`
- RLS: staff read for HR data; Admin-only where compensation-sensitive
  (`labor_cost_config` write, `proposed_actions` approve is function-side);
  technicians see none of it (their own views already exist via time/payroll).

## 5. Implementation checklist

Phase 1 — foundations
- [x] Migration 0036 (tables above + RLS) applied
- [x] `_shared/rippling.ts` client: bearer, base+version env, cursor pagination,
      timeout, 429/5xx retry with backoff, typed errors, correlation id,
      token never in logs/errors
- [x] `hr` edge function: auth (JWT role / cron secret), `status`, `set_flags`,
      `sync_workers` (full + individual, run history in `integration_sync_runs`,
      conflict logging, no silent overwrite of a manually-linked profile)
- [x] `packages/shared/hr.js` (`window.__shieldHR`)
- [x] HR hub screen: People tab (roster, link status, sync now, worker detail)
- [x] Nav: desktop menu + mobile route

Phase 2 — labor cost & profitability
- [x] `labor-calc.js` pure engine + `node --test` suite
- [x] `labor_cost_config` editor (Admin) — configurable burden components
- [x] Labor-cost + technician profitability views (real time_entries × rates ×
      loaded burden; jobs/projects via `job_ref` allocation; missing-rate rows
      flagged, never fabricated)

Phase 3 — hiring
- [x] New Hire workflow: form → validation → `proposed_actions` (hire kind) →
      Admin approval → deep-link to Rippling onboarding with "Final onboarding
      action required" messaging (no invented endpoint)
- [x] Compensation proposals through the same approval pipeline

Phase 4 — Payroll Center
- [x] Exception engine in `hr` fn: configurable rules (missing time, OT>threshold,
      unapproved timecards, week-over-week delta, duplicates, terminated-with-hours,
      rate mismatch, negative/implausible hours)
- [x] Payroll Center tab: upcoming period prep, history (payroll_payments +
      snapshots), exceptions queue, trends, per-run detail + prior-run comparison
- [x] Payroll run preparation snapshot + validation → approval → deep-link
      (no fake submission)

Phase 5 — BI
- [x] Metric snapshot service (labor cost, revenue/AR from qbo_*, margins) with provenance
- [x] Staffing forecast + hire-vs-overtime comparison (deterministic, shows its math)
- [x] What-if scenarios (rate change, headcount, utilization)
- [x] Business Health tab (Insights)

Phase 6 — MCP + AI advisor
- [x] `mcp-hr` edge function (official MCP SDK, Streamable HTTP, Supabase JWT auth)
- [x] Read/analyze tools + `prepare_*`/`approve_and_execute_*` two-step for writes;
      approval validated server-side against the authenticated human
- [x] AI Business Advisor in Insights: grounded metrics context, deterministic
      recommendation engine rows in `business_recommendations`, daily brief
- [x] Recommendation → prefilled proposed action (awaiting approval)

Phase 7 — hardening
- [x] Audit tab (filters by actor/type/date)
- [x] Tests: labor-calc suite (`node --test`, 8 passing); approval-bypass
      enforcement is schema/RLS-level (client cannot insert approved rows —
      constraint + insert policy) and validated live after migration
- [x] `docs/rippling-integration.md` + `docs/rippling-setup-checklist.md`
- [x] Build all apps, deploy functions, apply migration, validation report

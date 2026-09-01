# ChatGPT Business ↔ ShieldTech HR & Payroll MCP

How the **ShieldTech HR & Payroll** MCP server connects to ChatGPT Business as
a custom MCP app. (The Business-intelligence instance, `mcp-business`, exposes
the same auth surface and can be added as a second connector the same way.)

## Connection card (non-secret — what to paste into ChatGPT)

| Field | Value |
|---|---|
| App name | ShieldTech HR & Payroll |
| Description | ShieldTech Rippling HR, payroll, employee, time, and compensation management. |
| MCP server URL | `https://dzfkgvyndodearolypvn.supabase.co/functions/v1/mcp-hr` |
| Authentication | **OAuth** (ChatGPT auto-discovers the authorization server; users sign in with their ShieldTech portal account and approve on the consent screen) |

Second connector (optional): *ShieldTech Business Intelligence* at
`…/functions/v1/mcp-business`, same authentication.

## Architecture

```
ChatGPT Business ──(Streamable HTTP MCP + OAuth bearer)──▶ Supabase Edge Function mcp-hr
                                                             │  validates the Supabase-issued
                                                             │  user token → profiles.role RBAC
                                                             ├──▶ hr edge function (approvals, sync,
                                                             │    payroll prep — single write path)
                                                             ├──▶ Postgres (RLS'd HR/BI tables)
                                                             └──▶ Rippling REST API (HR credential,
                                                                  server-side only)

OAuth: ChatGPT ──▶ /.well-known/oauth-protected-resource (on the MCP URL)
              ──▶ Supabase Auth OAuth 2.1 server (discovery, dynamic client
                  registration, authorize, token, PKCE, refresh tokens)
              ──▶ consent UI: https://portal.shieldtechsolutions.com/oauth/consent
```

- Transport: **Streamable HTTP** via the official MCP TypeScript SDK
  (`WebStandardStreamableHTTPServerTransport`), stateless per request. No
  stdio anywhere.
- Hosting reuses the existing production stack: Supabase Edge Functions
  (HTTPS/TLS, process management, restarts, structured logs, health via
  function status — all platform-managed), Vercel for the consent page.
  No new infrastructure, no tunnels, no localhost.

## Authentication flow (OAuth 2.1 + PKCE)

1. ChatGPT calls the MCP URL → gets `401` with a `WWW-Authenticate` header
   pointing at `…/mcp-hr/.well-known/oauth-protected-resource` (RFC 9728),
   which names the authorization server `https://<ref>.supabase.co/auth/v1`.
2. ChatGPT reads the server metadata at
   `https://<ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1`,
   registers itself via **dynamic client registration**, and starts the
   **authorization-code + PKCE** flow.
3. Supabase Auth redirects the user to the portal consent screen
   (`/oauth/consent`, built into the portal SPA). The user signs in with
   their ShieldTech account; only **Admin/Staff/Manager** accounts can
   approve (Client roles get deny-only). Approve/deny go through
   `supabase.auth.oauth.approveAuthorization()` / `denyAuthorization()`.
4. ChatGPT exchanges the code for tokens (refresh tokens supported by the
   Supabase token endpoint) and calls the MCP server with
   `Authorization: Bearer <access token>`.
5. The MCP function validates the token with Supabase Auth, loads the user's
   `profiles.role`, and enforces application RBAC on every call — so ChatGPT
   acts *as that portal user*, never as a service account. Rippling
   credentials never reach ChatGPT; they exist only as server-side secrets.

**One-time dashboard setup (Supabase → Authentication):**
- **OAuth Server**: enable the OAuth 2.1 server; set Authorization Path to
  `/oauth/consent`; enable **dynamic client registration** (ChatGPT registers
  itself; the consent screen still gates every grant).
- **URL Configuration**: Site URL must be `https://portal.shieldtechsolutions.com`.
- Recommended: switch JWT signing keys to an asymmetric algorithm (RS256/ES256).
- Leave `MCP_HR_ACCESS_KEY` **unset** for the ChatGPT-connected instance —
  ChatGPT cannot send custom headers; OAuth + RBAC is the authentication.
  (Setting the key remains an option for non-ChatGPT clients / kill-switch.)
- Revocation: Supabase → Authentication → OAuth Server → revoke the ChatGPT
  client/grants; or per-user `supabase.auth.oauth.revokeGrant`.

## MCP tools (what “Scan tools” should find)

Read: `hr_get_workers`, `hr_get_worker`, `hr_get_compensation`,
`hr_get_company`, `hr_get_departments`, `time_get_entries`,
`time_get_employee_summary`, `time_get_current_period`,
`payroll_get_current_period`, `payroll_get_history`, `payroll_get_summary`,
`payroll_get_exceptions`, `payroll_compare_periods`, `get_proposed_actions`,
`action_get`, `rippling_get_capabilities`.

Analyze/act (safe): `hr_sync_workers`, `payroll_preview`,
`payroll_run_exception_scan`.

Prepare (create `awaiting_approval` proposals only): `hr_prepare_new_hire`,
`hr_prepare_compensation_change`, `hr_prepare_employee_change`,
`time_prepare_change`, `payroll_prepare_bonus`.

Approval (human Admin only, enforced server-side): `action_approve`,
`action_reject`, `action_execute`, `approve_and_execute_action`.

Not exposed (honest gaps): `hr_get_locations` (worker locations aren't part
of the synced data), Rippling Functions execution and payroll
submission/finalization (no endpoint verified against current official docs
from the deployment environment — unverified endpoints are never called;
`rippling_get_capabilities` reports this).

All tools use strongly-typed zod input schemas and return structured JSON.

## Approval architecture

`ChatGPT request → prepare_* tool → proposed_actions row (awaiting_approval)
→ authenticated human Admin approval → server validation (status machine,
expiry, feature flags, atomic execution claim) → execute → immutable
audit_events row (tagged instance:"mcp-hr")`.

- Approval is recorded from the **transport credential** (the Admin's own
  OAuth token); any `approved` field in tool arguments is never read.
- An action created via MCP cannot be approved by the identity that created it.
- Compensation, bonuses, hires, employment changes, timecard edits and
  payroll runs all require this pipeline; every write flag defaults OFF.
- Where Rippling has no documented public execution endpoint (payroll
  submit/finalize, hire completion), execution returns a validated hand-off
  package + deep link — “final action required in Rippling”. Nothing is faked.

## Rippling scopes & endpoints

- Endpoints in use (single auditable registry,
  `supabase/functions/_shared/rippling.ts`): `GET /workers` (cursor
  pagination), `POST /time-entries`, `GET /time-entries/{id}` — base
  `https://rest.ripplingapis.com`, bearer auth, optional
  `Rippling-API-Version` header, retries/backoff/429 handling, correlation
  IDs, token never logged.
- Scopes are whatever the token created in Rippling carries (see
  `docs/rippling-setup-checklist.md` step 1 — grant the broadest set the
  tenant offers for the HR token). The tenant's actual scope list is the
  ground truth; unavailable capabilities stay unexposed.

## Environment variables (names only)

`HR_RIPPLING_API_TOKEN`, `BUSINESS_RIPPLING_API_TOKEN`,
`RIPPLING_API_TOKEN` (legacy fallback), `RIPPLING_API_BASE`,
`RIPPLING_API_VERSION`, `RIPPLING_COMPANY_ID` (reserved),
`MCP_HR_ACCESS_KEY`, `MCP_BUSINESS_ACCESS_KEY`, `CRON_SECRET`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (platform-injected).

## Deployment

- `mcp-hr` / `mcp-business` / `hr`: deployed Supabase Edge Functions
  (sources in `supabase/functions/`), `verify_jwt:false` with in-function
  OAuth-token + role validation. Redeploy = re-run the deploy from the repo
  sources; the platform handles TLS, scaling, restarts, and logs
  (`rippling.request`, auth failures, audit rows in `audit_events`).
- Consent page ships with the portal (Vercel; SPA rewrite for
  `/oauth/consent` in `apps/portal/vercel.json`).

## Testing

- Deterministic math: `node --test tests/labor-calc.test.mjs`.
- MCP protocol: `npx @modelcontextprotocol/inspector` against the MCP URL
  (authenticate via the OAuth flow, or paste a portal user's access token as
  the bearer). Verify initialize, `tools/list`, a read tool, and that
  unauthenticated requests return the 401 + `WWW-Authenticate` envelope.
- Safe Rippling read test: `hr_sync_workers` (read-only pull) or
  `rippling_get_capabilities`; write paths are tested only as proposals.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| ChatGPT: “couldn't connect / auth failed” | OAuth server not enabled, dynamic client registration off, or Authorization Path ≠ `/oauth/consent` (Supabase → Authentication → OAuth Server). |
| Consent page says “Authorization request not found” | The `authorization_id` expired — restart the connection from ChatGPT. |
| 401 with valid login | User's `profiles.role` isn't Admin/Staff/Manager, or `MCP_HR_ACCESS_KEY` is set (ChatGPT can't send it — unset it). |
| Tools return `Rippling not configured (503)` | `HR_RIPPLING_API_TOKEN` missing in Supabase secrets. |
| Approve/execute returns 403 | Caller isn't Admin, the action's creator is approving their own MCP proposal, or the relevant feature flag is OFF (HR Center → Setup). |
| ID-token errors during OAuth | Project still on HS256 signing keys — switch to RS256/ES256, or have the client skip the `openid` scope. |

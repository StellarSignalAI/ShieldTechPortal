# QuickBooks Online → Portal

Imports QuickBooks Online (company **ShieldTech Security**, realm `9341455437414566`)
into the portal Finance suite. Two layers:

1. **Landing tables** (`supabase/migrations/0019_qbo.sql`) — `qbo_customers`,
   `qbo_items`, `qbo_invoices`, `qbo_estimates`, `qbo_report_snapshots`,
   `qbo_employees`, `qbo_payslips`, plus `qbo_sync_state` (last-synced status)
   and `qbo_secrets` (service-role-only OAuth token store). Admin/Staff can read;
   only the service role writes.
2. **Read layer** (`packages/shared/qbo.js` → `window.__shieldQBO`) — the Finance
   screens (Overview KPIs + AR aging, Invoices, Estimates, Products & Services)
   render live rows when present and fall back to the built-in demo data until
   the first sync lands. A **Sync now** button sits in the Finance header.

## Ongoing sync + write-back (`supabase/functions/qbo-sync`)

Nightly at 07:00 UTC (`0020_qbo_cron.sql`) and on demand, the `qbo-sync` edge
function refreshes everything server-side, and `{direction:"push"}` creates
invoices/estimates/customers back in QuickBooks. It needs a QuickBooks Online
app (Intuit developer portal) — set these secrets on the function:

| Secret | Where to get it |
| --- | --- |
| `QBO_CLIENT_ID` / `QBO_CLIENT_SECRET` | Intuit developer app → **Production** keys |
| `QBO_REALM_ID` | The authorized company id (`9341455437414566`) |
| `QBO_REFRESH_TOKEN` | One-time OAuth authorization; rotated tokens are then persisted in `qbo_secrets` |
| `QBO_ENV` | `production` (default) or `sandbox` |

Until those are set, `qbo-sync` returns a clear 503 and **Sync now** reports the
setup step — nothing breaks. The nightly cron reuses the existing Vault
`project_url` + `cron_secret` (same as the lead cron).

## Initial all-time import

Because the QuickBooks connector used for the first load is agent-side (MCP),
the one-time historical import is performed by pulling via the connector and
upserting into the `qbo_*` tables. After that, the nightly `qbo-sync` job keeps
them current (once the Intuit app credentials above are configured).

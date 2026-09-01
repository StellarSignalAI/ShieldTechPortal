# Rippling Setup Checklist (for Daniel)

Everything on the application side is built and deployed. What remains is the
part only you can do: creating the two API tokens inside Rippling (login/MFA
required) and pasting them into Supabase secrets. Until then the HR Center
works in "not configured" mode — local data (time entries, rates, payroll
snapshots, exceptions, project labor, BI, both MCP servers' local tools) all
function; only the Rippling sync itself reports 503.

> Why manual: this build ran in a cloud environment with no browser-control
> access and a network policy that blocks rippling.com — and token creation
> sits behind your login/MFA regardless. It is ~2 minutes of clicking.

## 1. Create TWO API tokens in Rippling

Rippling → Settings → **API access** (Company admin required). Create two
separate tokens so each side is independently revocable:

1. **"ShieldTech Business MCP"** — grant the broadest READ scopes your tenant
   offers (workers/employment, compensation, time, payroll read, company/org).
   This instance never writes to Rippling.
2. **"ShieldTech HR Payroll MCP"** — grant the broadest scopes available,
   read and write (workers, employment, compensation, time entries read/write,
   payroll, hiring/recruiting, documents, Functions if offered).

Copy each token once — Rippling won't show them again. While you're in the
scope picker, note anything your tenant does NOT offer (e.g. payroll write,
draft hires, Functions) — that list is the ground truth for what the app can
ever do, and the app already degrades honestly where scopes are missing.

## 2. Set Supabase secrets

Dashboard → Project Settings → Edge Functions → **Secrets**
(project `dzfkgvyndodearolypvn`):

| Secret | Value |
|---|---|
| `BUSINESS_RIPPLING_API_TOKEN` | token #1 |
| `HR_RIPPLING_API_TOKEN` | token #2 |
| `MCP_BUSINESS_ACCESS_KEY` | any long random string you generate |
| `MCP_HR_ACCESS_KEY` | a different long random string |
| `RIPPLING_API_VERSION` | optional — only if Rippling's docs say to pin one |
| `RIPPLING_API_BASE` | leave unset (defaults to `https://rest.ripplingapis.com`) |

Tokens live only in these secrets: never in the repo, the database, the
browser, logs, or any AI prompt. The Setup tab only ever shows whether each
exists. **Revocation:** rotate/clear `MCP_BUSINESS_ACCESS_KEY` (and/or delete
token #1 in Rippling) to kill the Business instance without touching HR — and
vice versa.

## 3. In the portal → ADMIN → HR Center → Setup

- Confirm both credentials show **configured**.
- Flip **Rippling integration** ON; leave every write flag OFF until needed.
- Add your real loaded-labor burden components (payroll taxes %, workers'
  comp %, benefits). Nothing is prefilled or hardcoded.

## 4. People tab → “Sync from Rippling”

Workers auto-link to portal profiles by work email; fix any misses with the
link button (manual links are never overwritten by sync).

## 5. Connect AI clients to the two MCP servers

- Business: `https://dzfkgvyndodearolypvn.supabase.co/functions/v1/mcp-business`
- HR/Payroll: `https://dzfkgvyndodearolypvn.supabase.co/functions/v1/mcp-hr`
- Headers: `Authorization: Bearer <Supabase access token of an office user>`
  and `x-mcp-key: <that instance's access key>`.
- AI can read/analyze (Business) and additionally prepare (HR); approving and
  executing anything requires a human Admin and is enforced server-side.

## 6. Optional: schedule background jobs

pg_cron (same pattern as existing jobs) POSTing to `/functions/v1/hr` with the
`x-cron-secret` header: nightly `{"action":"sync_workers"}`, hourly-ish
`{"action":"exceptions_run"}`, nightly `{"action":"metrics_run"}`.

Payroll reality check: preparing, validating, approving and auditing a pay run
happens here; **submitting/finalizing payroll happens in Rippling** — the
system deep-links you there and never automates that step.

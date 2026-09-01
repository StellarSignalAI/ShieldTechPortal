# Rippling Setup Checklist (for Daniel)

Everything below is a one-time configuration step done outside the codebase.
Until the token is set, the HR Center works in "not configured" mode: local
data (time entries, rates, payroll snapshots, exceptions, BI) all function;
only the Rippling sync itself reports 503.

1. **Create the API token in Rippling**
   - Rippling → Settings → API access (Company admin required).
   - Grant read scopes for workers/employment/compensation and time entries;
     write scope for time entries only if you want approved portal hours pushed.
   - Copy the token once — it won't be shown again.

2. **Set Supabase secrets** (Dashboard → Project Settings → Edge Functions →
   Secrets, project `dzfkgvyndodearolypvn`):
   - `RIPPLING_API_TOKEN` — the token from step 1 (required).
   - `RIPPLING_API_VERSION` — optional; set only if Rippling's docs tell you to
     pin a version header.
   - `RIPPLING_API_BASE` — leave unset (defaults to `https://rest.ripplingapis.com`).
   The token lives only in these secrets: never in the repo, the database, or
   the browser. The Setup tab only ever shows whether it exists.

3. **In the portal → ADMIN → HR Center → Setup**
   - Flip **Rippling integration** ON, leave every write flag OFF until you
     need it (they gate execution of approved actions).
   - Add your real loaded-labor burden components (payroll taxes %, workers'
     comp %, benefits $/period, etc.). Nothing is prefilled or hardcoded.

4. **People tab → “Sync from Rippling”**
   - Workers auto-link to portal profiles by work email; fix any misses with
     the link button (manual links are never overwritten by sync).

5. **Optional: schedule the background jobs** (SQL editor, pg_cron — same
   pattern as existing jobs): nightly `{"action":"sync_workers"}`, hourly-ish
   `{"action":"exceptions_run"}`, nightly `{"action":"metrics_run"}` POSTed to
   `/functions/v1/hr` with the `x-cron-secret` header.

6. **Optional: connect an AI client to the MCP server**
   - Endpoint: `https://dzfkgvyndodearolypvn.supabase.co/functions/v1/mcp-hr`
   - Auth: `Authorization: Bearer <Supabase access token of an office user>`.
   - AI can read/analyze/prepare only; approving and executing anything
     requires an Admin identity and is enforced server-side.

Payroll reality check: preparing, validating, approving and auditing a pay run
happens here; **submitting/finalizing payroll happens in Rippling** — the
system deep-links you there and never automates that step.

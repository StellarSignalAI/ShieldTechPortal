# ShieldTech Platform — Session Handoff

Living status doc for continuing work in a fresh Claude Code session. Read this
first, then pick up the "What's left" items.

## The platform
- npm-workspaces monorepo, three Vite/React apps: `apps/portal`, `apps/tech`, `apps/customer`.
- Vendored design-prototype JSX in `packages/shared/proto/` (window-global scope; the
  `vite-plugin-proto-globals` plugin auto-exposes top-level `function`/`var` — **`const`
  must be added manually to the `Object.assign(window, {…})` export in `shared-state.jsx`**,
  or it throws "Can't find variable" at runtime while still building fine).
- Shared ESM libs registered per app in `main.jsx`: `supabase.js`, `auth.js`, `passkey.js`,
  `qbo.js` (`window.__shieldQBO`), `time.js` (`window.__shieldTime`), `storage.js`,
  `messaging.js`, `store-sync.js`, etc.
- Supabase project ref: `dzfkgvyndodearolypvn`. QuickBooks company (realm): `9341455437414566`.
- Vercel auto-deploys: preview per PR branch, production on merge to `main`.
- Dev branch: `claude/design-implementation-cugvf0`. Work there, open a **draft** PR, wait
  for the 3 Vercel checks green, mark ready, squash-merge.

## What's live (done)
- Full customer hub: Contacts (add/edit/delete + who-receives invoices/estimates/proposals),
  Sites, Assets, Passwords (reveal/copy/generate), Documents (upload/link), Networks — all
  real per-customer CRUD, persisted + synced. Customer detail crash (`u.tags.map`) fixed.
- Customers directory merges QuickBooks customers; editable category (Contractor, etc.).
- Finance suite reads live QBO data; **portal-created invoices/estimates now persist**
  (`invoiceStore`/`estimateStore`) and **merge with QBO both ways** across Finance + customer
  tabs. Projects persist (`projectStore`); **create projects on mobile**; **create invoice
  from a project** (desktop + mobile).
- Timesheets loop: tech logs hours → portal Timesheets/Approvals → approve → Rippling push.
  Verified end-to-end against prod.
- Installable PWA (Tech app + others) + branded "Get the Tech App" download page linked from
  invite emails; branded invite emails (Google-SSO vs credentials).
- Migrations applied on prod: `0019_qbo` (customers/items/invoices/estimates/report_snapshots/
  employees/payslips + `qbo_sync_state` + service-role-only `qbo_secrets`), `0020_qbo_cron`
  (nightly 07:00 UTC), `0021_qbo_full` (vendors/bills/purchases/payments/accounts).
- Edge functions deployed: `passkey` (usernameless, v2), `qbo-sync` (pull + write-back).
- Initial QBO import done via MCP: **13 customers, 32 products (seed keys), 82 invoices,
  61 estimates** (~$217K invoiced, ~$30K AR).

## What's left (action items)

### 1. Lead cron — just set one secret (verified working otherwise)
Diagnosed live: Vault `project_url`/`cron_secret` are set, the cron helper fires, and a lead
landed at exactly `bid-sweep`'s scheduled time — so `CRON_SECRET` matches and the plumbing
works. The only gap is **`SAM_GOV_API_KEY`** (SAM.gov returns nothing without it; the free
lanes had no new matches).
- **Action:** set `SAM_GOV_API_KEY` in Supabase → Edge Functions → Secrets (free key at
  sam.gov → Account → API Key).
- **Verify:** `select jobname, schedule, active from cron.job where jobname like 'shieldtech-%';`
  should show 3 active jobs; then `select public.invoke_lead_function('sam-poll','{"days":30}'::jsonb);`
  wait ~30s, `select count(*), max(created_at) from public.opportunities;` should climb.
- If count still flat after the key with jobs active, read
  `select id, status_code, error_msg, left(content::text,400), created from net._http_response order by created desc limit 8;`
  (401 = CRON_SECRET mismatch on the functions; 503 = body names the missing var).

### 2. QuickBooks — full nightly sync + write-back (needs Intuit app creds)
`qbo-sync` is deployed and the schema is ready; it returns a clean 503 until creds are set.
Once set, a sync pulls **everything at full fidelity** — full invoice/estimate line items,
customer billing + AR balances, and bills/vendors/expenses/payments/accounts — nightly, and
enables portal→QBO write-back.
- **Action (Supabase → Edge Functions → Secrets):** `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`,
  `QBO_REALM_ID` = `9341455437414566`, `QBO_REFRESH_TOKEN`, `QBO_ENV` = `production`.
  Get keys at developer.intuit.com (Production) and a refresh token via the OAuth 2.0
  Playground with scope `com.intuit.quickbooks.accounting` (+ `...payroll` if you want
  employees). Full step-by-step is in `docs/QBO-IMPORT.md`.
- **After first real sync:** run `delete from public.qbo_items where qbo_id like 'seed:%';`
  to drop the 32 bootstrap product rows (real QBO-keyed items replace them).
- Employees/payroll need the payroll scope (or MCP payroll re-auth) — otherwise everything
  else syncs on the accounting scope.

### 3. Housekeeping
- Rotate the Google OAuth client secret (was shared in chat earlier; advised).

## Known environment quirks
- The Supabase MCP connector kept **detaching mid-session** in the prior chat (attached for a
  call or two, then dropped). Fix: **enable connectors at the start of a fresh session** rather
  than re-toggling mid-session. Same flaky browser↔session websocket also caused "have to
  refresh to see replies" — disable ad-block/privacy extensions on claude.ai, use an updated
  browser or the desktop app.
- To do the DB/edge work live, start the new session with Supabase (and QuickBooks, if doing
  the QBO import) connected up front.

## Conventions
- Push: `git push -u origin claude/design-implementation-cugvf0` (retry w/ backoff on network err).
- After push, open a **draft** PR; merge only after the 3 Vercel deploys are green; squash-merge.
- A merged PR is finished — for follow-ups, restart the branch from `origin/main`.

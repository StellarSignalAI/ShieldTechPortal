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

### 2b. QuickBooks write engine ("+ New") — built, waits on the same creds
`qbo-sync` now has a full transaction engine (`{direction:'push', entity, payload}`):
**customer, vendor, item, invoice, estimate, payment (receive payment), purchase (expense),
bill, billpayment**. Payloads are portal-shaped (names, not Intuit ids); the server
finds-or-creates customers/vendors/items, resolves accounts by name → type, posts the
record, mirrors it into the `qbo_*` landing tables and refreshes the invoice/bill balance.
Already-paid invoices/bills are skipped, never double-posted.
- Client: `window.__shieldQBO.{receivePayment, recordExpense, createBill, payBill,
  createVendor, createCustomer, createItem, push, notConnected}` (`packages/shared/qbo.js`).
- UI: one shared **+ New** menu + forms (`packages/shared/proto/qbo-new.jsx`,
  `window.openQboNew(kind, prefill)`) used by the desktop Finance Suite header, the mobile
  Money tab, invoice "Receive Payment", Bills "Pay", Expenses approvals (desktop +
  mobile + receipt-inbox conversions → one `qboPostExpense`), Products "+ New Item" and
  **Add standard LV services** (reviewable low-voltage service catalog; reuses existing
  item names). Modal on desktop, `MSheet` on phones — no duplicate forms.
- Stripe: `stripe-webhook` books the matching QuickBooks Payment server-side on a verified
  `checkout.session.completed` (via the cron secret; no-op until QBO is connected).
- Every form writes the shared stores first and reports honestly: "recorded in QuickBooks"
  vs "saved here — QuickBooks isn't connected yet". **Nothing reaches QuickBooks until the
  four `QBO_*` secrets in item 2 are set.** Landing tables currently hold only the July
  MCP import (13 customers / 32 seed items / 82 invoices / 61 estimates; no bills, vendors,
  payments, accounts) — the first real sync replaces that.
- Real QBO today (via the Intuit MCP): 40 items, all Service type, mostly one-off job
  names; A/R $185,852.63 with $94,657.63 overdue across 7 customers.

### 2c. Technician app — the Dial (home) + execution flow
`packages/shared/proto/tech-dial.jsx` replaces the tech home (`TechDialHome`) and job
detail (`JobFlowView`); `apps/tech/src/main.jsx` falls back to the old `TodayView` /
`JobDetailView` if the module is missing. The home is one instrument: a ticked bezel
holding 6 AM–8 PM with every dispatched job (workOrderStore + jobStore, filtered to the
signed-in tech, crew view when nothing is assigned) as a block colored by discipline
(`--disc-*` tokens); a fixed needle; turn/flick/tap to dial a job in; one card with one
action (Start → I'm on site → Begin work → Continue → Summary). Untimed work orders are
packed into free slots and labeled "anytime". The flow is Arrive → Verify → Install →
Test → Sign-off (labels adapt per WO type): fieldStatus, checklist + test ticks
(`woCheckStore`), photos (`techcam` → capture), signature upload, `st2:timer` from "on
site" to completion, then optional one-tap hours submission (`__shieldTime.submitHours`).
Colors are tokens only — the color pass is a `colors.css` change.

### 2d. Technician app — Clock (Time) + Receipts (Expenses)
`packages/shared/proto/tech-money.jsx` replaces `TimeViewV2` / `ExpenseView` (both kept as
fallbacks in `apps/tech/src/main.jsx`).
- **Clock**: the one `st2:timer` the Dial runs, on a card with one action — Start (defaults
  to the job under the needle; "Job…" picks any today-job / category / project / WO), Pause,
  Resume, Stop → one note → draft or submitted `time_entries` row with real start/end.
  Today is a strip on the Dial's 6 AM–8 PM track plus entry rows; Week is seven bars,
  draft/submitted/approved counts and one "Submit week" button. Rejected entries surface at
  the top with the office's reason and a "Fix & resubmit" path (new `__shieldTime.updateEntry`
  in `time.js`; drafts can be edited/submitted singly). Paused time survives in the timer
  (`pausedElapsed`); the Dial's helpers honor it and fire a `st2:timer` event on every write.
- **Receipts**: camera first. Snap → `tmShrink` (≤1600px JPEG) → sheet with the photo,
  big amount field, vendor/date/category/job/paid-with/note. If the `ai` edge function has
  `OPENAI_API_KEY`, `tmScanReceipt` reads vendor/total/date/category/last4 off the image
  (feature `extract`, vision) and pre-fills; otherwise the tech types the total. Duplicate
  warning (same amount within 3 days). Sends to the office receipt inbox
  (`__shieldReceipts.snap`, tagged with job + "PERSONAL CARD — reimburse" when applicable) —
  the office converts → expense → QuickBooks, so nothing is entered twice. Mileage
  (`TM_MILEAGE_RATE`, $0.70/mi) and no-receipt expenses go to `techExpenseStore` for approval.
  One list merges receipts + expenses by day with thumbnails (signed URLs) and status;
  totals: this month / with office / owed to you.
- The Dial's Install step has a **Receipt** action (`window.openTechReceipt({jobRef,label})`)
  that opens the camera pre-tagged to the job.

### 2e. Mobile portal — Money as a collections dial
`packages/shared/proto/mobile-money.jsx` (`MoneyDial`, `MoneyHome`) is the Money tab's
Overview (`MFinance` falls back to `FinOverview` if missing). One arc per customer who
owes, sized by balance, colored by age (`--status-ok` current, `--status-warn` 1–30,
`--status-critical` 31–60, `--disc-alarm` 60+), oldest debt first; the white marker on the
track is where overdue ends. Turn/flick/tap to dial a customer in; the one card shows the
oldest invoice with **Receive payment** (`openQboNew('payment')`), **Pay link**
(`mSendPayLink`) and **Remind** (AR reminder → Approvals), plus that customer's invoices
(tap → `FinInvoiceDetail`). Under it: collected this month / bills to pay / MRR, everyone
who owes, and the next bills with **Pay** (`openQboNew('billpayment')`). Data is
`useMergedInvoices` (portal + QuickBooks), `__shieldQBO.bills`, `mrrStore`.

### 2f. Field-service shell (tech app) + QuickBooks-pattern Finance home (portal)
Patterned on the workforce apps and QuickBooks Online screens in Mobbin, built with
ShieldTech's own data and tools.
- **Tech app** (`packages/shared/proto/tech-field.jsx`, wired in `apps/tech/src/main.jsx`;
  every previous view stays as fallback): tabs **Home · Schedule · Timesheet · Search · More**.
  Home = greeting, live map of today's sites (`__shieldLiveMap` + `__shieldLiveMap.L`; site
  addresses geocoded once via OpenStreetMap Nominatim, cached in `st2:geo`), "N visits worth
  $X · N complete", the next visit with its one action, later today, this week, a **+** FAB
  (request a job → `workOrderStore` status `requested`, snap receipt, log time, photo,
  message dispatch). Schedule = Day (today = the Dial) / List / Map with a week strip.
  Search = jobs, customers, devices, invoices. More = every tool grouped. Job page
  (`TechJobView`) = status pill, "WO for Customer for $value", address + directions, start,
  primary action + "…" sheet (pause, alarm on test, navigate, call, photo, receipt, message,
  AI), tabs **Job / Flow / Notes / Money** — Flow embeds `JobFlowView` (`embedded` prop),
  Notes persist to `woNotesStore` ('wonotes'), Money lists the customer's invoices/quotes and
  can ask the office to invoice (Approvals row `INVOICE REQUEST`).
- **Portal Finance home** (`packages/shared/proto/screen-qbo-home.jsx`, `QboGlance`,
  used by the Finance Suite Overview tab with `FinanceOverview` as fallback): app pills,
  Business feed (QBO connection, overdue AR, to-review, bills due, open quotes), Create
  actions (→ `openQboNew`), "Business at a glance" widgets (P&L with period select,
  Expenses donut by category, Smart suggestions, Bank accounts, Cash flow in-minus-out by
  month, Sales, AR aging donut), Sales & Get Paid quick actions (Money in), Customer Hub
  funnel. All from merged invoices, QBO bills/purchases mirror, `techExpenseStore`,
  `mrrStore`, `projectStore`, `npsStore`, receipts inbox.

### 2g. QuickBooks shell (portal) + Jobber feature parity (tech app)
- **Portal** (`packages/shared/proto/screen-qbo-shell.jsx`, `QboFinanceScreen`; `FinanceScreen`
  renders it and keeps the tabbed layout as `FinanceScreenTabs` fallback): QuickBooks
  Online's chrome page for page — top bar (company, "Navigate or search…", + New, sync,
  notifications → Feed, settings), left rail (Create, Bookmarks, Home, Feed, Reports, All
  apps, pinned Accounting/Expenses/Sales, Customise), the ALL APPS tree (`QBO_APPS`:
  Accounting → Bank transactions, Integration transactions, Receipts, Reconcile, Rules,
  Chart of accounts, Recurring transactions, My accountant · Expenses & Bills → Expense
  transactions, Suppliers, Bills · Sales & Get Paid → Overview, Sales transactions,
  Invoices, Products & services · Customer Hub → Overview, Leads, Customers, Estimates,
  Reviews · Team → Employees, Timesheets, Payroll · Tax · Marketing) and the Reports tree
  (Standard, Custom, Management, Cash flow overview/planner). Page template `QboPage` +
  `QboMoneyBar` (QBO's unpaid/paid segment bars) + `QboList` (checkbox column, sortable
  headers, action links with ▾, totals row, pagination). New pages: Invoices with money
  bars, Sales overview (quick actions · income over time), Sales transactions (invoices +
  estimates + payments with filters), Customers (open balance, Receive payment / Create
  invoice), Customer Hub overview, Suppliers (vendors + bills bars), Bills (For review /
  Unpaid / Paid), Receipts (upload tiles, For review / Reviewed → `openQboNew('purchase')`),
  Rules (`bankRuleStore` 'bankrules'), My accountant (invite via outbox), Management /
  Custom reports, Feed, Advanced transactions search. Everything else re-hosts the existing
  Finance components inside the same chrome. Bookmarks and the tree state persist in
  localStorage.
- **Tech app** (`packages/shared/proto/tech-jobber.jsx`): speed-dial **+** (Request, Task →
  `punchStore`, Expense, Invoice, Quote, Job, Client → `customerStore` via `buildCustomer`),
  `TjDocBuilder` (client, overview, intro, line items from `__shieldQBO.items` or a
  fallback catalog, optional lines, discount %, tax %, deposit, due, client message,
  contract, Review and Send → `addEstimate`/`addInvoice` + email + QBO push), `TjDocView`
  (Quote: Approve & Schedule → creates a WO · Resend · Collect signature · Convert to
  invoice · Mark declined · Archive; Invoice: Collect Payment → marks paid + `recordPaid` ·
  Resend · Send pay link via Approvals · Void; Notes tab on `woNotesStore` `doc:`),
  `TjDocList` (Quotes / Invoices with status filters), `TjRequestView` (requested WOs: Send
  Booking Confirmation, Complete assessment, Convert to quote / job, Archive, Delete),
  `TjBusinessHealth` (clients, quotes, jobs, invoices with 30-day deltas), `TjRecent`
  (search chips + recently active). Email goes through `queueEmail` when loaded, else
  `__shieldEmail` (`tjMail`). Wired in `apps/tech/src/main.jsx` as tabs quotes, invoices,
  doc-view, new-quote, new-invoice, request, health with a `ctx` state.

### 2h. Ubiquiti pass — UniFi-pattern skin, fonts and the ShieldTech OS console
- **Skin + type (every app)** — `packages/shared/styles/tokens/*`: Inter replaces Geist
  (the open stand-in for the UniFi console typeface; Geist Mono stays for data), one
  action blue (`--brand` #3B8BFF dark / #006FFF light) on neutral charcoal or white
  surfaces, flat UniFi status colours, 8px card radius, no grain/glow (`effects.css`
  keeps the `--glow-*` names so nothing breaks). New alpha tokens: `--brand-rgb`,
  `--ok-rgb`, `--warn-rgb`, `--critical-rgb`, `--canvas-rgb`, `--card-rgb`, plus
  `--rail-bg`/`--rail-fg` for the console rail. ~2,250 hard-coded indigo / status /
  near-black values across 140 files were swept onto those tokens (only canvas `ctx.*`
  and `data:` URIs keep literals). Default appearance is now **System** (UniFi follows
  the OS); Light and Dark remain in the avatar menu and in ShieldTech OS › Settings.
  `theme-color` metas and font links updated in all four `index.html`.
- **Portal — ShieldTech OS** (`packages/shared/proto/screen-unifi-console.jsx`,
  `ShieldOSConsole`; `MonitoringHubScreen` renders it when loaded and keeps the tabbed
  console as fallback; sidebar entry renamed "ShieldTech OS"): the UniFi OS layout —
  dark app rail (Sites · Network · Protect · Access · Alerts · Assets · Settings), site
  selector (All sites → customer → site, with health dot and online/flagged counts),
  underline tabs per app, dense tables with a properties drawer. **Sites** = Site
  Manager (tiles, grid/list of every customer·site with verdict, devices, cameras,
  doors, network, open tickets; ISP honestly "not monitored"). **Network**: Dashboard
  (Internet / Devices / Clients / Experience tiles, devices-by-type donut, recent
  activity, sites in scope), Topology (`TopologyView`), Devices (`UcDeviceList`:
  search, kind chips, table, drawer with Locate/Restart (honest toasts) and Mark
  online / Flag attention / Mark offline → `assetStore`), Clients (empty state +
  `NetworkDiscoveryView`), Insights (`PortMapView`, `CVECenter`, `FleetHealthPanel`),
  Settings (Microsoft docs, BitLocker, password rotation). **Protect**: Live view
  (camera sidebar, 1/4/9/16 layouts, tiles say "No stream · connect NVR"), Timeline
  (24h strip with markers from device changes, door events and tech photos + event
  list), Find anything (detection chips + honest NVR note + site photos as evidence),
  Devices (cameras + recorders), Alarm manager (`alarmRuleStore` 'alarmrules':
  trigger/scope/schedule/action with enable toggle + history). **Access**: Doors
  (Unlock → 5-second unlocked state + `accessLogStore` entry, Hold open, Log),
  Users (`accessUserStore`), Visitors (`accessVisitorStore`, time-boxed PIN),
  Policies (`accessPolicyStore`), Logs, Devices. **Alerts**: flagged devices with
  Acknowledge (`osConsoleStore.acked`), Create ticket → `ticketStore` (help desk
  shape), Dispatch. **Settings**: appearance, notification toggles, controller
  address + ISP monitor toggle (honest: keys live on the backend), About.
- **Tech app — Devices** (`packages/shared/proto/tech-unifi.jsx`, `TechDevicesView`,
  More › Work › Devices, tab `devices`): site picker (registry sites + today's WO
  customers, remembered in `st2:tech-site`), kind chips, flat list with status dot and
  IP, **+ Adopt** documents a device for the site, device sheet with Mark online /
  Flag attention / Mark offline, Edit details, Photos, Send to office (ticket), Copy IP,
  and **Unlock door** for readers (logs to `accessLogStore`).
- **Customer app** (`packages/shared/proto/customer-unifi.jsx`, `CuSitesView`,
  `CuDevicesView`, `CuAccessView`; wired in `apps/customer/src/main.jsx` with the old
  views as fallback): Sites (per-site health cards scoped to `__shieldUser.company`,
  Request a change → ticket), Devices (status list + Report a problem → ticket),
  Access (doors with **Request unlock** → `accessLogStore` pending entry + urgent
  ticket via `__shieldTickets`, people with access, recent door activity, then the
  existing badge / visitor tools). Header and tab bar now use `--card`.
- Verified: all four builds green; Playwright walk of every ShieldTech OS app and tab
  (light + dark), device drawer, door unlock → log, alert → ticket, tech Devices + sheet,
  customer Sites / Devices / Access + unlock request — no page errors (sandbox only
  blocks fonts/tiles). Service worker cache → `shieldtech-v15`.

### 2i. Customer app — pay, approve, book (build-order item 4)
- `packages/shared/proto/customer-pay.jsx`, wired in `apps/customer/src/main.jsx`
  (old views kept as fallback). Tabs now: … Access · **Book a visit** · Tickets ·
  **Quotes** · Invoices … (`approvals` routes to Quotes).
- **Company resolution** (`useCuCompany`): `profiles` has no company column, so the
  signed-in customer's company is resolved from the registry — customer email /
  billing email, a contact on the customer card (`contactsStore`), or the email
  domain vs the customer website — re-run on every `shield:auth` and published on
  `window.__shieldUser.company` so tickets, photos and the OS views agree.
- **Invoices** (`CuInvoicesView`): `invoice_links` rows (customer RLS by email) merged
  with `useMergedInvoices()` rows for the company; Balance due / Next due / Paid YTD /
  Autopay tiles; Open · Paid · All; detail sheet with lines, Download PDF
  (`__shieldPdf.exportDoc`), Ask a question. **Pay** opens the tokenized pay page
  (`invoice-pay?token=`; Stripe when connected); an invoice without a link gets
  "Pay online" → `approvalStore` PAY LINK REQUEST + billing ticket, and the office
  sends the link with `__shieldPay.createLink`.
- **Quotes** (`CuQuotesView`): `useMergedEstimates()` for the company; Approve & sign
  (signature modal → `__shieldStorage` upload → `acceptEstimateToProject` → status
  accepted + `approvalStore` QUOTE APPROVED + high-priority ticket), Decline (reason →
  status rejected + ticket), Ask a question, PDF.
- **Book a visit** (`CuRequestView`): Repair / Maintenance / Install / Survey, site
  (from the registry), preferred day + window, scope, contact → `workOrderStore` row
  with `status: 'requested'`, `requestedVia: 'customer-portal'` (shows in the tech
  app request page and the portal Work Orders card, which now offers **Accept &
  schedule** for `requested`/`open` rows) + a ticket. "Your visits" lists the
  company's work orders.
- **Home strip** (`CuHomeStrip`): Balance due · Quotes to approve · Next visit above
  the dashboard; dashboard "Schedule service" opens Book a visit.
- Phone layout: `.cp-main` / `.cp-header` / `.cp-tabs` / `.cp-two-col` media rules at
  ≤640px. Verified with Playwright at 390px and 1200px: invoices → detail → pay link
  request, quote → sign → approved (project created, approvals written), booking →
  WO-… requested, home strip updates; no page errors. SW cache → `shieldtech-v16`.

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

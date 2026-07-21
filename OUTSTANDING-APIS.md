# Outstanding APIs & Keys to Configure

Everything you (Daniel) must provision to take the platform live. The code for
all of it is already wired — each item below just needs its account/key.
Until a key exists, the related feature degrades gracefully and reports
"not configured" on **Settings → Integrations** in the portal.

Status legend: 🔴 required to launch · 🟡 required for a specific feature · ⚪ later phase

---

## 1. 🔴 Supabase (database, auth, edge functions)

The backbone: profiles/roles, invites, opportunities, AI logs, all Edge Functions.

1. Create a project at https://supabase.com/dashboard
2. Project Settings → API → copy:

| Env var | Where it goes | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel env (all 3 apps) | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel env (all 3 apps) | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets | `service_role` key (never in frontend) |

3. Run the migrations in `supabase/migrations/` (SQL editor or `supabase db push`):
   `0001_profiles.sql`, `0002_ai_runs.sql`, `0003_opportunities.sql`, `0004_time_entries.sql`
4. Deploy the Edge Functions in `supabase/functions/`:
   `invite-user`, `ai`, `ingest-alerts`, `ingest-report-text`, `sources-poll`, `sam-poll`, `rippling-sync`
   (`supabase functions deploy <name>`)

## 2. 🔴 Vercel + DNS (three apps, three subdomains)

1. Create three Vercel projects from this repo (https://vercel.com/new), each with its root directory:

| Project | Root directory | Domain |
|---|---|---|
| shieldtech-portal | `apps/portal` | `portal.shieldtechsolutions.com` |
| shieldtech-tech | `apps/tech` | `tech.shieldtechsolutions.com` |
| shieldtech-customer | `apps/customer` | `customer.shieldtechsolutions.com` |

2. In your DNS provider, add a **CNAME** for each subdomain → `cname.vercel-dns.com`
3. Set env vars on **each** project: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, plus the app-URL vars
   (`VITE_PORTAL_URL`, `VITE_TECH_URL`, `VITE_CUSTOMER_URL` — the production subdomains above).

Mobile is not a separate deployment: portal.shieldtechsolutions.com auto-switches to the
mobile surface on phones/tablets (`?desktop=1` / `?mobile=1` to override).

## 3. 🔴 Google OAuth (shieldtechsolutions.com sign-in)

1. https://console.cloud.google.com/apis/credentials → Create OAuth client ID (Web application)
2. Consent screen: Internal (or External + your domain)
3. Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google → paste Client ID + Secret

Behavior already wired: any `@shieldtechsolutions.com` Google account is auto-allowed;
any other Google account only gets in if it was pre-invited from **Admin → Users & Invites**.

## 4. 🔴 OpenAI (powers all ShieldTech AI features)

1. https://platform.openai.com/api-keys → create key, add billing
2. Supabase → Edge Functions → Secrets:

| Env var | Value |
|---|---|
| `OPENAI_API_KEY` | your key |
| `OPENAI_MODEL` | optional, defaults to `gpt-4o-mini` |

Powers: assistant chat, Finance Copilot, tech copilot, customer concierge,
bid narratives/go-no-go, digests, and report-text extraction (`ingest-report-text`).
Verify with the "Test ShieldTech AI" button on Settings → Integrations.

## 5. 🟡 SAM.gov / api.data.gov (verified federal leads)

1. Sign in at https://sam.gov → Account Details → **API Key** (this is an api.data.gov key)
2. Supabase Edge Function secret: `SAM_GOV_API_KEY`
3. Optional tuning secrets: `SAM_NAICS` (default `561621,238210,922160,561612`),
   `TERRITORIES` (e.g. `NY,NJ,PA,MD,VA`), `TRADES` (e.g. `security,fire,low-voltage`)

The `sam-poll` function pulls Get Opportunities v2 and feeds verified leads straight
onto the Bid Board (deduped). Schedule it: Supabase → Edge Functions → `sam-poll` →
cron (e.g. nightly), sending header `x-cron-secret: <CRON_SECRET>`.

## 6. 🟡 Email (invites + password resets) — Resend recommended

1. https://resend.com → create account, verify the `shieldtechsolutions.com` domain (SPF/DKIM records)
2. Two places to configure:
   - **Supabase Auth SMTP** (password-reset mail): Dashboard → Authentication → SMTP →
     host `smtp.resend.com`, user `resend`, password = Resend API key
   - **Edge Function secret** `RESEND_API_KEY` (invite mail with temp credentials) and
     `INVITE_FROM_EMAIL` (e.g. `ShieldTech <no-reply@shieldtechsolutions.com>`)

Without this, invites still work — the temp password is shown on-screen to the Admin
instead of being emailed.

## 7. 🟡 Rippling (technician hours → payroll, two-way)

Technicians log hours in the Tech app → Admin/Staff approve in the portal
(Approvals Center or Team → Time) → approved hours push to Rippling as time
entries; worker roster + pay rates and PAID/FINALIZED status flow back.

1. Rippling admin → **Settings → API Access** (Custom API integration) → create an API token
2. Grant scopes: **workers read**, **time entries read/write**, compensation read
3. Supabase Edge Function secret: `RIPPLING_API_TOKEN`
4. Deploy `supabase/functions/rippling-sync` and schedule it (cron with
   `x-cron-secret`, e.g. hourly) — or rely on the automatic push that fires
   when a timesheet is approved in the portal
5. Workers link to platform users by matching work email — invite technicians
   with the same email they have in Rippling

Until the token exists, hours still collect and approvals still work; entries
queue with "not configured" sync status and push on first successful sync.

## 8. 🟡 CRON_SECRET (ingest automation)

Any long random string. Set as a Supabase Edge Function secret: `CRON_SECRET`.
Lets schedulers call `ingest-alerts`, `ingest-report-text`, `sources-poll`, `sam-poll`
without a user session (header `x-cron-secret`).

---

## 9. Bid portals with NO public API

These cannot be polled directly — no key exists to buy. They are covered by the
**BD Command Center pattern**: your alert emails / saved searches / BD reports get
pasted or forwarded into `ingest-report-text` (AI-extracts opportunities) or posted
as structured JSON to `ingest-alerts`. All land on the Bid Board deduped. The
`sources-poll` function tracks each portal's reachability on the source registry.

| Portal | Coverage | Path in |
|---|---|---|
| GSA eBuy | Federal (GSA schedule holders, login-only) | email alerts → ingest |
| DLA DIBBS | Defense logistics | saved search → ingest |
| PIEE / WAWF | DoD procurement | manual/report → ingest |
| eVA | Virginia | email alerts → ingest |
| eMMA | Maryland | email alerts → ingest |
| NJSTART | New Jersey | email alerts → ingest |
| PA eMarketplace | Pennsylvania | email alerts → ingest |
| PennBid (Bonfire) | PA municipal | email alerts → ingest |
| NYS Contract Reporter | New York State | email alerts → ingest |
| DASNY | NY dormitory authority | email alerts → ingest |
| Empire State Bid System | NY regional | email alerts → ingest |
| BidNet Direct | Multi-state municipal | email alerts → ingest |
| GC bid lists (invited) | Private/commercial | forward → ingest-report-text |

## 10. ⚪ Later-phase integrations (coded as placeholders, not yet wired)

Per the integrations roadmap — these show as "Not connected" on Settings → Integrations:

- **Stripe** (customer-portal payments) — needs `STRIPE_SECRET_KEY` + webhook, later phase
- **QuickBooks Online** (finance sync) — OAuth2 app at developer.intuit.com, later phase
- **Twilio** (SMS dispatch/notifications) — later phase
- **Google Calendar / Drive** (schedule + doc sync) — extra OAuth scopes, later phase
- **Google Maps** (routing/geocoding) — `VITE_GOOGLE_MAPS_KEY`, later phase

---

## Quick launch checklist

- [ ] Supabase project + migrations + 6 Edge Functions deployed
- [ ] `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` on all 3 Vercel projects
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret set
- [ ] 3 Vercel projects + 3 DNS CNAMEs
- [ ] Google OAuth client → Supabase Google provider
- [ ] `OPENAI_API_KEY` secret set → Test button green
- [ ] `SAM_GOV_API_KEY` secret set → `sam-poll` scheduled nightly
- [ ] Resend domain verified → Supabase SMTP + `RESEND_API_KEY`
- [ ] `CRON_SECRET` set → ingest schedulers configured
- [ ] `RIPPLING_API_TOKEN` set → rippling-sync scheduled; technicians invited with their Rippling work email
- [ ] First Admin signs in with Google (@shieldtechsolutions.com) → invites the team

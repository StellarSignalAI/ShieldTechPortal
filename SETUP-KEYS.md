# Turning the platform on — Supabase + OpenAI + Resend

Do these in order. The whole thing takes ~30 minutes. Nothing here touches code —
it's all account creation + pasting keys into two places (GitHub secrets for the
public frontend config, Supabase secrets for the private server keys).

The golden rule: **two public keys go in the frontend build; every other key is
a Supabase Edge Function secret and must never be in the frontend.**

---

## Step 1 — Supabase project (the backbone)

1. Go to https://supabase.com/dashboard → **New project**. Pick a name, a strong
   database password, a region near you. Wait ~2 min for it to provision.
2. **Project Settings → API.** Copy three values:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key (long `eyJ...`) — this one is safe in the browser
   - **service_role** key (also `eyJ...`) — **secret**, server-only, never in the frontend
3. **Run the database migrations.** Left sidebar → **SQL Editor** → open each file
   from this repo's `supabase/migrations/` folder in order (`0001` … `0007`),
   paste its contents, and click **Run**. (Or, with the Supabase CLI:
   `supabase db push`.)
4. **Create the storage bucket** — migration `0006_storage.sql` does this; if you
   ran all migrations it's already there (bucket `site-photos`).

## Step 2 — Deploy the Edge Functions (the server logic)

Install the Supabase CLI (`npm i -g supabase`), then from the repo root:

```
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy invite-user ai ingest-alerts ingest-report-text \
  ingest-email bid-sweep sources-poll sam-poll rippling-sync send-email
```

(You can also deploy them one at a time. `YOUR-PROJECT-REF` is the `xxxx` in your
project URL.)

## Step 3 — Set the SECRET keys (Supabase, not the frontend)

Supabase Dashboard → **Edge Functions → Secrets → Add new secret**, or via CLI
`supabase secrets set KEY=value`. Add:

| Secret | Value | Needed for |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role key from Step 1 | all functions |
| `OPENAI_API_KEY` | from https://platform.openai.com/api-keys (add billing) | all AI + bid extraction |
| `RESEND_API_KEY` | from https://resend.com/api-keys | invite + invoice email |
| `INVITE_FROM_EMAIL` | `ShieldTech <no-reply@shieldtechsolutions.com>` | email "from" line |
| `CRON_SECRET` | any long random string you make up | scheduled pollers |

(`SUPABASE_URL` is provided to functions automatically — you don't set it.)

## Step 4 — Resend (email delivery)

1. https://resend.com → sign up → **Domains → Add domain** → `shieldtechsolutions.com`.
2. Resend shows a few **DNS records** (SPF, DKIM). Add them at your domain
   registrar. Verification is usually minutes.
3. **API Keys → Create** → paste it into Supabase as `RESEND_API_KEY` (Step 3).
4. For password-reset mail specifically: Supabase → **Authentication → Emails →
   SMTP** → host `smtp.resend.com`, port `465`, user `resend`, password = your
   Resend API key, sender = `no-reply@shieldtechsolutions.com`.

## Step 5 — Turn on the frontend (the two PUBLIC keys)

The live site is built by GitHub Actions, so the two public keys go in as
**GitHub repository secrets** (they get baked into the build):

1. GitHub → your repo → **Settings → Secrets and variables → Actions →
   New repository secret**. Add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
2. Push any commit (or re-run the latest **Deploy** workflow). The next build
   picks them up and the site goes from "backend not configured" to live auth +
   synced data.

(When you move to Vercel later, you set the same two vars in each project's
**Environment Variables** instead — same names.)

## Step 6 — Google sign-in (so you can actually log in)

1. https://console.cloud.google.com/apis/credentials → **Create credentials →
   OAuth client ID → Web application**.
2. **Authorized redirect URI:** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
3. Supabase → **Authentication → Providers → Google** → paste the Client ID +
   Secret → enable.
4. Supabase → **Authentication → URL Configuration → Redirect URLs** → add your
   live site URL(s).
5. First login: use a `@shieldtechsolutions.com` Google account (auto-allowed).
   From the portal, **Admin → Users & Invites** invites everyone else.

---

## How to verify it worked
- Open the site → you should get the **login screen** (not the open dev mode).
- Sign in with Google → you're in.
- **Settings → Integrations** → the Supabase, ShieldTech AI (OpenAI), Resend,
  etc. rows should flip to **Connected**; the **"Test ShieldTech AI"** action on
  the OpenAI card returns a live reply.
- Send an invoice → it actually emails; invite a user → they get a temp password.

## Optional keys (add anytime)
- `SAM_GOV_API_KEY` — free at sam.gov, turns on the federal-lead poller
- `RIPPLING_API_TOKEN` — turns on two-way payroll/time sync
- Schedule `sam-poll` / `bid-sweep` / `sources-poll` in Supabase → Edge Functions
  → Schedules (header `x-cron-secret: <CRON_SECRET>`) for the always-on lead engine

Full per-service detail lives in `OUTSTANDING-APIS.md`.

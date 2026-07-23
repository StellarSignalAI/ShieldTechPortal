#!/usr/bin/env bash
# ShieldTech go-live: links your Supabase project, runs every migration,
# deploys every Edge Function, and sets every server secret — in one run.
#
# Usage:
#   1) cp scripts/go-live.example.env scripts/go-live.env
#   2) fill in the 6 values in scripts/go-live.env
#   3) bash scripts/go-live.sh
#
# Safe to re-run: migrations, deploys and secrets are all idempotent.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ENV_FILE="$HERE/go-live.env"

info() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ── Preflight ──────────────────────────────────────────────────────────────
command -v supabase >/dev/null 2>&1 || die "Supabase CLI not found. Install it: npm i -g supabase"
[ -f "$ENV_FILE" ] || die "Missing $ENV_FILE — copy scripts/go-live.example.env to it and fill in your values."

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

for v in SUPABASE_PROJECT_REF SUPABASE_SERVICE_ROLE_KEY OPENAI_API_KEY RESEND_API_KEY INVITE_FROM_EMAIL CRON_SECRET; do
  [ -n "${!v:-}" ] || die "$v is empty in go-live.env"
  case "${!v}" in *xxxx*|sk-...|re_...|eyJ...) die "$v still has a placeholder value — set the real key.";; esac
done

cd "$ROOT"

# ── 1. Log in + link ───────────────────────────────────────────────────────
info "Checking Supabase CLI login"
if ! supabase projects list >/dev/null 2>&1; then
  echo "Opening browser login (or set SUPABASE_ACCESS_TOKEN to skip)…"
  supabase login
fi
ok "Logged in"

info "Linking project $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF"
ok "Linked"

# ── 2. Migrations (0001 … 0007) ────────────────────────────────────────────
info "Applying database migrations"
supabase db push
ok "All migrations applied"

# ── 3. Edge Functions (all 12) ─────────────────────────────────────────────
info "Deploying Edge Functions"
supabase functions deploy \
  invite-user manage-user ai ingest-alerts ingest-report-text ingest-email \
  bid-sweep contractor-outreach sources-poll sam-poll rippling-sync send-email passkey
ok "All functions deployed"

# ── 4. Secrets ─────────────────────────────────────────────────────────────
info "Setting Edge Function secrets"
supabase secrets set \
  "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
  "OPENAI_API_KEY=$OPENAI_API_KEY" \
  "RESEND_API_KEY=$RESEND_API_KEY" \
  "INVITE_FROM_EMAIL=$INVITE_FROM_EMAIL" \
  "CRON_SECRET=$CRON_SECRET"
ok "Secrets set"

# ── 5. Optional: GitHub public keys (only if gh CLI is authenticated) ───────
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  info "Setting GitHub Actions secrets (frontend public keys)"
  gh secret set VITE_SUPABASE_URL     -b "https://${SUPABASE_PROJECT_REF}.supabase.co" || true
  # anon key is public-safe; pull it from the linked project if the CLI exposes it
  ANON="$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null | awk '/anon/{print $NF; exit}')" || true
  if [ -n "${ANON:-}" ]; then
    gh secret set VITE_SUPABASE_ANON_KEY -b "$ANON" && ok "GitHub secrets set — next deploy goes live automatically"
  else
    printf '\033[1;33m!  Could not auto-read the anon key. Add it manually in GitHub → Settings → Secrets → Actions as VITE_SUPABASE_ANON_KEY.\033[0m\n'
  fi
else
  printf '\n\033[1;33m!  gh CLI not authenticated — add the two frontend keys manually:\033[0m\n'
  printf '   GitHub → repo → Settings → Secrets and variables → Actions → New repository secret\n'
  printf '     VITE_SUPABASE_URL      = https://%s.supabase.co\n' "$SUPABASE_PROJECT_REF"
  printf '     VITE_SUPABASE_ANON_KEY = <anon public key from Supabase → Settings → API>\n'
fi

# ── 6. Vault secrets for the 4 AM lead cron (pg_cron reads these at run time) ─
info "Arming the daily lead-pull cron (Vault secrets)"
VAULT_SQL="select vault.create_secret('https://${SUPABASE_PROJECT_REF}.supabase.co','project_url','functions base URL') where not exists (select 1 from vault.secrets where name='project_url');
select vault.create_secret('${CRON_SECRET}','cron_secret','x-cron-secret for lead functions') where not exists (select 1 from vault.secrets where name='cron_secret');"
if [ -n "${SUPABASE_DB_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  printf '%s' "$VAULT_SQL" | psql "$SUPABASE_DB_URL" >/dev/null 2>&1 && ok "Cron secrets set in Vault" \
    || printf '\033[1;33m!  Could not set Vault secrets automatically — paste the two lines below in the SQL Editor.\033[0m\n'
else
  printf '\033[1;33m!  Set SUPABASE_DB_URL (Project Settings → Database → Connection string) to auto-arm the cron,\n   or paste these two lines once in Supabase → SQL Editor:\033[0m\n'
  printf '   %s\n' "$VAULT_SQL"
fi

info "Backend is live 🎉"
cat <<EOF

Still yours to do (browser-only, can't be scripted):
  • Resend  → add domain + SPF/DKIM DNS records, then Auth → SMTP for reset mail
  • Google  → OAuth client → paste into Supabase → Auth → Providers → Google
              redirect URI: https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
  • If gh wasn't set up above, add the two VITE_ secrets in GitHub, then re-run the Deploy workflow.

Verify: open the site → login screen → Settings → Integrations shows Connected.
The lead board fills after the first 4 AM cron run — or trigger it now from SQL Editor:
  select public.invoke_lead_function('sam-poll','{"days":7}'::jsonb);
EOF

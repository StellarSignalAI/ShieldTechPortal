-- Passkeys (WebAuthn) — credential store + short-lived challenge store.
-- Registration and authentication ceremonies run in the `passkey` edge function
-- (server holds the challenge, verifies the attestation/assertion with
-- @simplewebauthn/server, then mints a Supabase session on success).

create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  credential_id text not null unique,          -- base64url of the raw credential id
  public_key text not null,                    -- base64url COSE public key
  counter bigint not null default 0,
  transports text[] default '{}',
  device_label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists webauthn_credentials_user on public.webauthn_credentials (user_id);

-- Pending challenges (registration + authentication). Rows are single-use and
-- expire quickly; a sweep on read keeps the table tiny.
create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  email text,                                  -- for username-first auth before we know the user
  kind text not null,                          -- 'register' | 'authenticate'
  challenge text not null,
  created_at timestamptz not null default now()
);
create index if not exists webauthn_challenges_lookup on public.webauthn_challenges (user_id, kind, created_at desc);

alter table public.webauthn_credentials enable row level security;
alter table public.webauthn_challenges enable row level security;

-- Users can see (and delete) their own passkeys; the edge function uses the
-- service role for writes during the ceremony. Challenges are never client-read.
create policy "webauthn: own read" on public.webauthn_credentials
  for select using (user_id = auth.uid());
create policy "webauthn: own delete" on public.webauthn_credentials
  for delete using (user_id = auth.uid());

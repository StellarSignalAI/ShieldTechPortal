-- Bid/lead source layer (API contract: leads, bids, ingest-alerts, source registry)

create table if not exists public.sources (
  id text primary key,                       -- e.g. 'sam-gov', 'penn-bid'
  name text not null,
  url text not null,
  kind text not null default 'portal',       -- 'api' | 'portal' | 'gc-list'
  has_api boolean not null default false,
  last_checked timestamptz,
  last_ok boolean,
  last_error text
);

insert into public.sources (id, name, url, kind, has_api) values
  ('sam-gov',          'SAM.gov',                    'https://sam.gov',                              'api',    true),
  ('gsa-ebuy',         'GSA eBuy',                   'https://www.ebuy.gsa.gov',                     'portal', false),
  ('dla-dibbs',        'DLA DIBBS',                  'https://www.dibbs.bsm.dla.mil',                'portal', false),
  ('piee',             'PIEE (WAWF)',                'https://piee.eb.mil',                          'portal', false),
  ('eva-virginia',     'eVA (Virginia)',             'https://eva.virginia.gov',                     'portal', false),
  ('emma-maryland',    'eMMA (Maryland)',            'https://emma.maryland.gov',                    'portal', false),
  ('njstart',          'NJSTART',                    'https://www.njstart.gov',                      'portal', false),
  ('pa-emarketplace',  'PA eMarketplace',            'https://www.emarketplace.state.pa.us',         'portal', false),
  ('penn-bid',         'PennBid',                    'https://pennbid.bonfirehub.com',               'portal', false),
  ('nyscr',            'NYS Contract Reporter',      'https://www.nyscr.ny.gov',                     'portal', false),
  ('dasny',            'DASNY',                      'https://www.dasny.org',                        'portal', false),
  ('camelot',          'Camelot / Empire State bids','https://www.empirestatebidsystem.com',         'portal', false)
on conflict (id) do nothing;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  solicitation_id text,
  source_id text references public.sources (id),
  source_url text,
  title text not null,
  buyer text not null,
  state text,
  territory text,
  trades text[] default '{}',
  value_estimate numeric,
  due_at timestamptz,
  site_walk_at timestamptz,
  poc jsonb,
  docs jsonb,
  raw jsonb,
  status text not null default 'fresh',      -- fresh | accepted | dismissed | submitted | won | lost
  fit_score integer,
  why text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dedupe ladder: source_url → solicitation_id → (title, buyer, due)
create unique index if not exists opportunities_source_url_key
  on public.opportunities (source_url) where source_url is not null;
create unique index if not exists opportunities_solicitation_key
  on public.opportunities (solicitation_id) where solicitation_id is not null;
create unique index if not exists opportunities_tbd_key
  on public.opportunities (title, buyer, due_at);

alter table public.opportunities enable row level security;
alter table public.sources enable row level security;

create policy "opportunities: staff read" on public.opportunities
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "opportunities: staff update" on public.opportunities
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
create policy "sources: staff read" on public.sources
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

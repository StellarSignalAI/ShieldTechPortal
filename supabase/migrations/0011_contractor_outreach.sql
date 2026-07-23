-- Contractor outreach lane — non-union electrical contractors to pitch on
-- subcontract low-voltage / Div 28 scope. Public state license directories are
-- fetched by the contractor-outreach function, AI-extracts company records,
-- excludes anyone on the NECA/IBEW signatory list, and writes the rest into
-- public.opportunities as a distinct lane so they show on the Bid Board /
-- Secret Weapon alongside bids.

-- Separate the two sweep lanes so bid-sweep and contractor-outreach never step
-- on each other's sources. Existing rows default to the bid lane.
alter table public.sources add column if not exists lane text not null default 'bid';

-- Public electrical-contractor license directories for the bid territory.
-- listing_url is the public search/results page the function fetches; some
-- state boards are form-driven, so these may need a results URL with query
-- params tuned after first live run (the function records last_error per source).
insert into public.sources (id, name, url, kind, has_api, lane, listing_url) values
  ('ec-va', 'VA DPOR — Electrical Contractors', 'https://www.dpor.virginia.gov', 'directory', false, 'contractor',
     'https://dporweb.dpor.virginia.gov/LicenseLookup/Search'),
  ('ec-md', 'MD Master Electricians', 'https://www.dllr.state.md.us', 'directory', false, 'contractor',
     'https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi?calling_app=ME::ME_registration'),
  ('ec-nj', 'NJ DCA — Electrical Contractors', 'https://www.njconsumeraffairs.gov', 'directory', false, 'contractor',
     'https://newjersey.mylicense.com/verification/Search.aspx'),
  ('ec-pa', 'PA — Electrical Contractor Registrations', 'https://www.dos.pa.gov', 'directory', false, 'contractor',
     'https://www.pals.pa.gov/#/page/search')
on conflict (id) do update set lane = excluded.lane, listing_url = excluded.listing_url, kind = excluded.kind;

-- NECA / IBEW signatory exclusion list. Company names here are treated as UNION
-- and are dropped from outreach. Seeded with a starter set of regional NECA
-- signatory contractors; expand as the union member rolls are reviewed. The
-- match is case-insensitive substring on a normalized company name.
create table if not exists public.union_contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  norm text generated always as (lower(regexp_replace(name, '[^a-z0-9]+', '', 'gi'))) stored,
  local text,
  state text,
  source text default 'seed',
  created_at timestamptz not null default now()
);
create unique index if not exists union_contractors_norm_key on public.union_contractors (norm);
alter table public.union_contractors enable row level security;

create policy "union_contractors: staff read" on public.union_contractors
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

insert into public.union_contractors (name, local, state, source) values
  ('IES Commercial',                'IBEW', 'VA', 'seed'),
  ('Rosendin Electric',             'IBEW', 'VA', 'seed'),
  ('Cupertino Electric',            'IBEW', 'VA', 'seed'),
  ('Truland Systems',               'IBEW Local 26', 'VA', 'seed'),
  ('Dynalectric',                   'IBEW', 'MD', 'seed'),
  ('Mona Electric Group',           'IBEW Local 26', 'MD', 'seed'),
  ('Freestate Electrical',          'IBEW Local 26', 'MD', 'seed'),
  ('Singleton Electric',            'IBEW Local 26', 'MD', 'seed'),
  ('Hatzel & Buehler',              'IBEW', 'NJ', 'seed'),
  ('Gaylor Electric',               'IBEW', 'NJ', 'seed'),
  ('Fischbach & Moore',             'IBEW', 'NJ', 'seed'),
  ('DiGioia-Suburban Electric',     'IBEW', 'PA', 'seed'),
  ('Fisher Electric',               'IBEW', 'PA', 'seed'),
  ('Bracken Construction',          'IBEW', 'PA', 'seed'),
  ('Guy M. Cooper',                 'IBEW', 'MD', 'seed')
on conflict (norm) do nothing;

-- Add the contractor lane to the 4 AM daily pull (reuses invoke_lead_function
-- from 0010; staggered after the bid lanes). Weekly is plenty for a slow-moving
-- license roll, but daily keeps it simple and dedupe makes re-runs cheap.
select cron.unschedule('shieldtech-contractor-outreach')
  where exists (select 1 from cron.job where jobname = 'shieldtech-contractor-outreach');
select cron.schedule('shieldtech-contractor-outreach', '10 8 * * *',
  $$select public.invoke_lead_function('contractor-outreach')$$);

-- Auto-Bid pipeline: AI-built bids for scraped opportunities.
--
-- The bid-builder edge function reads each lead's source page (and SAM.gov
-- description when available), prices the work against the qbo_items
-- pricebook, and lands a structured bid here: scope, line items, labor, and
-- THREE pricing tiers (low / medium / aggressive). The portal shows the tiers
-- with the source URL for cross-reference; picking a tier generates the full
-- proposal (stored as branded HTML) which can be emailed, downloaded, or
-- shared straight from the portal.

create table if not exists public.bids (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null unique references public.opportunities(id) on delete cascade,
  status          text not null default 'pending',   -- pending | building | ready | proposal | error
  scope           jsonb,          -- {summary, assumptions[], exclusions[], missingInfo[], confidence}
  line_items      jsonb,          -- [{desc, qty, unit, unitCost, hours}]
  labor_hours     numeric(10,2) default 0,
  labor_rate      numeric(10,2) default 145,
  material_cost   numeric(14,2) default 0,
  cost_total      numeric(14,2) default 0,
  tiers           jsonb,          -- {low:{price,marginPct,pitch}, medium:{...}, aggressive:{...}}
  selected_tier   text,           -- low | medium | aggressive
  proposal_html   text,
  proposal_at     timestamptz,
  sent_at         timestamptz,
  sent_to         text,
  docs_read       jsonb,          -- [{url, fetched, note}]
  error           text,
  built_at        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists bids_status on public.bids (status);

alter table public.bids enable row level security;

create policy "bids: staff read" on public.bids
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );
-- Staff can record tier selection / send state from the portal; heavy writes
-- (build results, proposals) come from the edge function's service role.
create policy "bids: staff update" on public.bids
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Admin','Staff'))
  );

drop trigger if exists bids_touch on public.bids;
create trigger bids_touch before update on public.bids
  for each row execute function public.touch_updated_at();

-- Nightly auto-build for fresh leads, 20 min after the scrapers land them
-- (sam-poll 08:00, sources-poll 08:03, bid-sweep 08:06 UTC).
select cron.unschedule('shieldtech-bid-builder')
  where exists (select 1 from cron.job where jobname = 'shieldtech-bid-builder');
select cron.schedule('shieldtech-bid-builder', '26 8 * * *',
  $$select public.invoke_lead_function('bid-builder', '{"mode":"pending","limit":15}')$$);

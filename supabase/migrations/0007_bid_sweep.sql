-- Automated bid sweeping: public listing pages the AI reads on a schedule.
-- listing_url = the portal's PUBLIC open-solicitations page (no login, no ToS
-- violation); the bid-sweep function fetches it, AI-extracts opportunities,
-- and every lead links back to the platform.

alter table public.sources add column if not exists listing_url text;
alter table public.sources add column if not exists last_found integer;

update public.sources set listing_url = v.u from (values
  ('eva-virginia',    'https://mvendor.cgieva.com/Vendor/public/AllOpportunities.jsp'),
  ('emma-maryland',   'https://emma.maryland.gov/page.aspx/en/rfp/request_browse_public'),
  ('njstart',         'https://www.njstart.gov/bso/view/search/external/advancedSearchBid.xhtml'),
  ('pa-emarketplace', 'https://www.emarketplace.state.pa.us/Search.aspx'),
  ('penn-bid',        'https://pennbid.bonfirehub.com/portal/?tab=openOpportunities'),
  ('dasny',           'https://www.dasny.org/opportunities/rfps-bids'),
  ('nyscr',           'https://www.nyscr.ny.gov/business/adsOpen.cfm'),
  ('gsa-ebuy',        'https://www.ebuy.gsa.gov/ebuy/'),
  ('dla-dibbs',       'https://www.dibbs.bsm.dla.mil/RFQ/')
) as v(id, u) where sources.id = v.id;

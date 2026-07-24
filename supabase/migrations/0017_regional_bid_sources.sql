-- Starter set of public e-procurement portals for ShieldTech's home region
-- (NJ / PA / MD / VA) plus a mid-Atlantic aggregator. bid-sweep fetches each
-- listing_url, strips it to text, and AI-extracts security / low-voltage
-- solicitations. Form-only portals may yield little on the first pass (they
-- record a last_error and can be tuned with a results URL later); the static
-- listing pages work immediately.

insert into public.sources (id, name, url, kind, has_api, lane, listing_url) values
  -- New Jersey
  ('nj-treasury',   'NJ Treasury — Current Bid Solicitations', 'https://www.nj.gov/treasury/purchase', 'portal', false, 'bid',
     'https://www.nj.gov/treasury/purchase/bid/summary/bid.shtml'),
  ('nj-njstart',    'NJSTART — State of New Jersey', 'https://www.njstart.gov', 'portal', false, 'bid',
     'https://www.njstart.gov/bso/view/search/external/advancedSearchBid.xhtml'),
  -- Pennsylvania
  ('pa-emarket',    'PA eMarketplace — Open Solicitations', 'https://www.emarketplace.state.pa.us', 'portal', false, 'bid',
     'https://www.emarketplace.state.pa.us/Solicitations.aspx'),
  ('pa-philadelphia','City of Philadelphia — Contract Opportunities', 'https://www.phlcontracts.phila.gov', 'portal', false, 'bid',
     'https://www.phlcontracts.phila.gov/bso/view/search/external/advancedSearchBid.xhtml'),
  -- Maryland
  ('md-emma',       'eMaryland Marketplace Advantage (eMMA)', 'https://emma.maryland.gov', 'portal', false, 'bid',
     'https://emma.maryland.gov/page.aspx/en/rfp/request_browse_public'),
  ('md-montgomery', 'Montgomery County MD — Bid Opportunities', 'https://www.montgomerycountymd.gov', 'portal', false, 'bid',
     'https://www.montgomerycountymd.gov/PRO/Solicitations/SolicitationsList.html'),
  -- Virginia
  ('va-eva',        'eVA Virginia — Public Opportunities', 'https://www.eva.virginia.gov', 'portal', false, 'bid',
     'https://mvendor.cgieva.com/Vendor/public/AllOpportunities.jsp'),
  ('va-fairfax',    'Fairfax County VA — Current Solicitations', 'https://www.fairfaxcounty.gov', 'portal', false, 'bid',
     'https://www.fairfaxcounty.gov/procurement/current-solicitations'),
  -- Multi-state aggregator (mid-Atlantic)
  ('bidnet-midatl', 'BidNet Direct — Mid-Atlantic', 'https://www.bidnetdirect.com', 'portal', false, 'bid',
     'https://www.bidnetdirect.com/mid-atlantic')
on conflict (id) do update set
  name = excluded.name, url = excluded.url, kind = excluded.kind,
  lane = excluded.lane, listing_url = excluded.listing_url;

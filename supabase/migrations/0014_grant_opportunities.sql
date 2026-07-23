-- "Creative opportunities" lane — security-grant funding programs. Beyond
-- standard procurement RFPs (lane 'bid') and non-union contractor outreach
-- (lane 'contractor'), these are grant-funded angles ShieldTech can chase:
-- nonprofit/house-of-worship security grants, school-safety grants, and state
-- homeland-security programs that pay for cameras / access control / alarms.
-- Swept by the same bid-sweep function (now lane in ('bid','grant')) and shown
-- on the Bid Board / Secret Weapon next to bids.

insert into public.sources (id, name, url, kind, has_api, lane, listing_url) values
  ('grant-nsgp',   'FEMA Nonprofit Security Grant Program', 'https://www.fema.gov', 'grant', false, 'grant',
     'https://www.fema.gov/grants/preparedness/nonprofit-security'),
  ('grant-svpp',   'DOJ COPS School Violence Prevention Program', 'https://cops.usdoj.gov', 'grant', false, 'grant',
     'https://cops.usdoj.gov/svpp'),
  ('grant-cisa-schools', 'CISA School Safety', 'https://www.cisa.gov', 'grant', false, 'grant',
     'https://www.cisa.gov/topics/physical-security/school-safety'),
  ('grant-hsgp',   'FEMA Homeland Security Grant Program', 'https://www.fema.gov', 'grant', false, 'grant',
     'https://www.fema.gov/grants/preparedness/homeland-security')
on conflict (id) do update set lane = excluded.lane, listing_url = excluded.listing_url, kind = excluded.kind;

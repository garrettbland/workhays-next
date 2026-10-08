-- Site #1: Work Hays. Fixed id so app config and the data migration can reference it.
insert into public.sites (id, slug, name, tagline, primary_domain, timezone, settings)
values (
  '00000000-0000-4000-8000-000000000001', 'workhays', 'Work Hays',
  'Local jobs in Hays and western Kansas', 'workhays.com', 'America/Chicago',
  jsonb_build_object(
    'posting_days', 30,
    'reminder_days_before', 3,
    'auto_renew_confirm_days', 60,
    'auto_renew_grace_days', 7,
    'from_email', 'Work Hays <hello@mail.workhays.com>'
  )
)
on conflict (id) do nothing;

insert into public.site_domains (domain, site_id) values
  ('workhays.com', '00000000-0000-4000-8000-000000000001'),
  ('www.workhays.com', '00000000-0000-4000-8000-000000000001'),
  ('localhost', '00000000-0000-4000-8000-000000000001')
on conflict do nothing;

insert into public.industries (site_id, slug, name, sort_order)
select '00000000-0000-4000-8000-000000000001', v.slug, v.name, v.ord
from (values
  ('accounting-finance-banking',       'Accounting / Finance / Banking',        1),
  ('administrative-officesupport',     'Administrative / Office Support',       2),
  ('agriculture',                      'Agriculture',                           3),
  ('construction-naturalgas-oil',      'Construction / Natural Gas / Oil',      4),
  ('delivery-transportation-trucking', 'Delivery / Transportation / Trucking',  5),
  ('education',                        'Education',                             6),
  ('foodservice',                      'Food Service',                          7),
  ('healthcare-socialassistance',      'Healthcare / Social Assistance',        8),
  ('hotel-hospitality',                'Hotel / Hospitality',                   9),
  ('it-computer',                      'IT / Computer',                        10),
  ('maintenance-custodial',            'Maintenance / Custodial',              11),
  ('manufacturing-assembly',           'Manufacturing / Assembly',             12),
  ('professionalservices',             'Professional Services',                13),
  ('realestate-rental',                'Real Estate / Rental',                 14),
  ('retail-sales',                     'Retail / Sales',                       15),
  ('other',                            'Other',                                99)
) as v(slug, name, ord)
on conflict do nothing;

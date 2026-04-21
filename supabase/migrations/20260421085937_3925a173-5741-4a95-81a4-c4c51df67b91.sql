
ALTER TABLE public.cold_email_campaigns
DROP CONSTRAINT IF EXISTS cold_email_campaigns_campaign_category_check;

ALTER TABLE public.cold_email_campaigns
ADD CONSTRAINT cold_email_campaigns_campaign_category_check
CHECK (campaign_category = ANY (ARRAY[
  'corporate_planner'::text,
  'wedding_planner'::text,
  'country_club'::text,
  'pr_agency'::text,
  'nonprofit'::text,
  'talent_management'::text,
  'talent'::text,
  'restaurant'::text,
  'spirits'::text,
  'nightlife'::text
]));

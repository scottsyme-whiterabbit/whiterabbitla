ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS linkedin_url text;
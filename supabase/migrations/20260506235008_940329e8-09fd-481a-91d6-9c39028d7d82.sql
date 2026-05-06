ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS tournament_name text,
  ADD COLUMN IF NOT EXISTS tournament_date text,
  ADD COLUMN IF NOT EXISTS tournament_course text;
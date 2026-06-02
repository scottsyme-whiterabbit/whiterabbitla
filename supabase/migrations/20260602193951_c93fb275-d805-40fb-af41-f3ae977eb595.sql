ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS email_status text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

CREATE UNIQUE INDEX IF NOT EXISTS cold_email_campaigns_email_lower_idx
  ON public.cold_email_campaigns (lower(email));
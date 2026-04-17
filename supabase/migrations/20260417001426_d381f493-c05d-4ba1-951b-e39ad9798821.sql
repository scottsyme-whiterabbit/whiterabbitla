ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS apollo_id text,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE UNIQUE INDEX IF NOT EXISTS cold_email_campaigns_apollo_id_unique
  ON public.cold_email_campaigns (apollo_id)
  WHERE apollo_id IS NOT NULL;
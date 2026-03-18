ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nurture_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS nurture_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS nurture_last_sent_at timestamptz;
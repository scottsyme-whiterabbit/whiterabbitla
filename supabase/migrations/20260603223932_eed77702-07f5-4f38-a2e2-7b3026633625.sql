
ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS campaign_track TEXT NOT NULL DEFAULT 'national_drip',
  ADD COLUMN IF NOT EXISTS castle_invite_status TEXT,
  ADD COLUMN IF NOT EXISTS castle_night_date DATE,
  ADD COLUMN IF NOT EXISTS castle_tier TEXT,
  ADD COLUMN IF NOT EXISTS castle_invited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cec_castle_track
  ON public.cold_email_campaigns (campaign_track, castle_invite_status, castle_tier)
  WHERE campaign_track = 'castle_invite_la';

CREATE TABLE IF NOT EXISTS public.castle_invite_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Los_Angeles')::date,
  tier TEXT NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0,
  replies_received INTEGER NOT NULL DEFAULT 0,
  accepted INTEGER NOT NULL DEFAULT 0,
  declined INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (log_date, tier)
);

GRANT ALL ON public.castle_invite_log TO service_role;
ALTER TABLE public.castle_invite_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages castle_invite_log"
  ON public.castle_invite_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_castle_invite_log_updated_at
  BEFORE UPDATE ON public.castle_invite_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

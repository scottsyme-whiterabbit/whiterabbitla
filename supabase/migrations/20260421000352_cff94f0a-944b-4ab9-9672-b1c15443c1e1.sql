CREATE TABLE IF NOT EXISTS public.unpause_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_category text NOT NULL,
  action text NOT NULL,
  threshold_fired text,
  bounce_rate numeric,
  hard_bounce_rate numeric,
  send_volume integer,
  contacts_affected integer,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unpause_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only unpause_audit_log"
  ON public.unpause_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_unpause_audit_category_created
  ON public.unpause_audit_log (campaign_category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unpause_audit_action_created
  ON public.unpause_audit_log (action, created_at DESC);
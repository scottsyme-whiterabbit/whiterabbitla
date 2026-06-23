
CREATE TABLE public.action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  action_type text NOT NULL,
  actor text NOT NULL DEFAULT 'scott',
  contact_email text,
  contact_name text,
  deal_id uuid,
  draft_id uuid,
  subject text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.action_log TO authenticated;
GRANT ALL ON public.action_log TO service_role;

ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_action_log" ON public.action_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_action_log_occurred ON public.action_log (occurred_at DESC);
CREATE INDEX idx_action_log_contact ON public.action_log (contact_email, occurred_at DESC);
CREATE INDEX idx_action_log_deal ON public.action_log (deal_id, occurred_at DESC);
CREATE INDEX idx_action_log_type ON public.action_log (action_type, occurred_at DESC);

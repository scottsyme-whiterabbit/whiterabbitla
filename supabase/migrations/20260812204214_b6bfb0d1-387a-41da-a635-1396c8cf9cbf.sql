CREATE TABLE public.seasonal_campaign_schedule (
  campaign_key text PRIMARY KEY,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  requires_prior_campaign_key text,
  min_days_since_prior_send integer,
  min_days_since_any_seasonal_send integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.seasonal_campaign_schedule TO service_role;

ALTER TABLE public.seasonal_campaign_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages seasonal schedule"
ON public.seasonal_campaign_schedule
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TRIGGER seasonal_campaign_schedule_updated
BEFORE UPDATE ON public.seasonal_campaign_schedule
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
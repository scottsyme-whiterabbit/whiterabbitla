
CREATE TABLE public.seasonal_campaign_copy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_key TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  paragraphs JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_key, category)
);
GRANT ALL ON public.seasonal_campaign_copy TO service_role;
ALTER TABLE public.seasonal_campaign_copy ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.seasonal_campaign_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_key TEXT NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.cold_email_campaigns(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  UNIQUE (campaign_key, contact_id)
);
CREATE INDEX seasonal_campaign_sends_key_idx ON public.seasonal_campaign_sends (campaign_key, sent_at);
GRANT ALL ON public.seasonal_campaign_sends TO service_role;
ALTER TABLE public.seasonal_campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER seasonal_campaign_copy_updated
  BEFORE UPDATE ON public.seasonal_campaign_copy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

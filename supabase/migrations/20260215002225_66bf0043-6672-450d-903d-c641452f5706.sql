
-- Contacts table for newsletter recipients
CREATE TABLE public.newsletter_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT DEFAULT 'csv',
  subscribed BOOLEAN NOT NULL DEFAULT true,
  drip_step INTEGER NOT NULL DEFAULT 0,
  drip_started_at TIMESTAMP WITH TIME ZONE,
  last_emailed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Newsletter campaigns table
CREATE TABLE public.newsletter_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sending', 'sent')),
  campaign_type TEXT NOT NULL DEFAULT 'broadcast' CHECK (campaign_type IN ('broadcast', 'drip')),
  drip_step INTEGER,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email send log for tracking
CREATE TABLE public.newsletter_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.newsletter_contacts(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.newsletter_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_send_log ENABLE ROW LEVEL SECURITY;

-- Service role only policies (edge functions use service role)
CREATE POLICY "Service role full access contacts" ON public.newsletter_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access campaigns" ON public.newsletter_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access send_log" ON public.newsletter_send_log FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_newsletter_contacts_updated_at
  BEFORE UPDATE ON public.newsletter_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

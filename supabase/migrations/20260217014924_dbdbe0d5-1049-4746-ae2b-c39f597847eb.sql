
CREATE TABLE public.newsletter_opens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.newsletter_contacts(id) ON DELETE CASCADE,
  drip_step integer NOT NULL DEFAULT 0,
  campaign_id uuid REFERENCES public.newsletter_campaigns(id) ON DELETE SET NULL,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text
);

ALTER TABLE public.newsletter_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only opens" ON public.newsletter_opens FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_newsletter_opens_contact ON public.newsletter_opens(contact_id);
CREATE INDEX idx_newsletter_opens_campaign ON public.newsletter_opens(campaign_id);

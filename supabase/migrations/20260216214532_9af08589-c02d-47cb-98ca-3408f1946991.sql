-- Click tracking table
CREATE TABLE public.newsletter_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.newsletter_contacts(id) ON DELETE CASCADE,
  drip_step INTEGER NOT NULL,
  link_slug TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_clicks ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role only clicks"
  ON public.newsletter_clicks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_newsletter_clicks_contact ON public.newsletter_clicks(contact_id);

-- Add engagement_status column to contacts for segmentation
ALTER TABLE public.newsletter_contacts
  ADD COLUMN IF NOT EXISTS engagement_status TEXT NOT NULL DEFAULT 'new';

-- Add reply_detected flag
ALTER TABLE public.newsletter_contacts
  ADD COLUMN IF NOT EXISTS reply_detected BOOLEAN NOT NULL DEFAULT false;
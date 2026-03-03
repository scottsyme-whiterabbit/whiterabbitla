
-- Create cold email campaigns table
CREATE TABLE public.cold_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  company text,
  phone text,
  campaign_category text NOT NULL CHECK (campaign_category IN ('corporate_planner', 'wedding_planner', 'country_club', 'pr_agency', 'nonprofit', 'talent_management', 'restaurant')),
  current_step integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone,
  last_email_sent_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'replied')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cold_email_campaigns ENABLE ROW LEVEL SECURITY;

-- Service role only policy (same pattern as deals, newsletter_contacts)
CREATE POLICY "Service role only cold_email_campaigns"
ON public.cold_email_campaigns
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for cron queries
CREATE INDEX idx_cold_email_active ON public.cold_email_campaigns (status, current_step) WHERE status = 'active';
CREATE INDEX idx_cold_email_category ON public.cold_email_campaigns (campaign_category);

-- Unique constraint: one campaign per contact email
CREATE UNIQUE INDEX idx_cold_email_unique_contact ON public.cold_email_campaigns (email);

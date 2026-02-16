
-- Add drip_campaign column to distinguish between welcome and planner drips
ALTER TABLE public.newsletter_contacts 
ADD COLUMN IF NOT EXISTS drip_campaign TEXT NOT NULL DEFAULT 'welcome';

-- Add company column for planner personalization
ALTER TABLE public.newsletter_contacts 
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_newsletter_contacts_drip_campaign 
ON public.newsletter_contacts (drip_campaign, drip_step, subscribed);

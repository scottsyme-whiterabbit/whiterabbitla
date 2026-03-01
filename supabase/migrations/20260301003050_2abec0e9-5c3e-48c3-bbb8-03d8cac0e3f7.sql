
-- Create outreach_log table
CREATE TABLE public.outreach_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  action_type TEXT NOT NULL DEFAULT 'call',
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only outreach_log" ON public.outreach_log FOR ALL USING (true) WITH CHECK (true);

-- Add columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS outreach_status TEXT DEFAULT 'not_contacted';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS last_outreach_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS outreach_notes TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

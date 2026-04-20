-- Create manual outreach log table
CREATE TABLE IF NOT EXISTS public.manual_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  category text NOT NULL,
  sent_date date NOT NULL DEFAULT current_date,
  replied boolean DEFAULT false,
  castle_preview_booked boolean DEFAULT false,
  concept_call_booked boolean DEFAULT false,
  event_booked boolean DEFAULT false,
  revenue_dollars numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (email, sent_date)
);

CREATE INDEX IF NOT EXISTS idx_manual_outreach_log_email ON public.manual_outreach_log(email);
CREATE INDEX IF NOT EXISTS idx_manual_outreach_log_sent_date ON public.manual_outreach_log(sent_date);

ALTER TABLE public.manual_outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only manual_outreach_log"
  ON public.manual_outreach_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add engagement tracking columns to cold_email_campaigns
ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS engagement_clicks integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_opens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hot_tag boolean DEFAULT false;
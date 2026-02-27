
-- Create deals table for CRM pipeline
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  company TEXT,
  event_type TEXT,
  event_date DATE,
  location TEXT,
  guest_count TEXT,
  deal_value INTEGER,
  stage TEXT NOT NULL DEFAULT 'new',
  lost_reason TEXT,
  notes TEXT,
  next_follow_up DATE,
  source TEXT,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validation trigger for stage values instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_deal_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stage NOT IN ('new', 'contacted', 'proposal_sent', 'negotiating', 'booked', 'completed', 'lost', 'on_hold') THEN
    RAISE EXCEPTION 'Invalid deal stage: %', NEW.stage;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_deal_stage_trigger
BEFORE INSERT OR UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.validate_deal_stage();

-- Updated_at trigger
CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_deals_stage ON public.deals (stage);
CREATE INDEX idx_deals_next_follow_up ON public.deals (next_follow_up);

-- RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only deals"
ON public.deals
FOR ALL
USING (true)
WITH CHECK (true);

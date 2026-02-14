
CREATE TABLE public.lead_magnet_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_magnet_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.lead_magnet_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "No public reads" ON public.lead_magnet_signups
  FOR SELECT USING (false);

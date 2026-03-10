
CREATE TABLE public.consultation_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text,
  event_date date,
  description text,
  source text NOT NULL DEFAULT 'meta_ads',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.consultation_leads
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "No public reads" ON public.consultation_leads
  FOR SELECT TO public
  USING (false);

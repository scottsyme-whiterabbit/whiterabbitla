
CREATE TABLE public.discovery_quiz_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  event_type TEXT,
  guest_count TEXT,
  biggest_concern TEXT,
  experience_priority TEXT,
  recommendation TEXT NOT NULL,
  quiz_answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discovery_quiz_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.discovery_quiz_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "No public reads" ON public.discovery_quiz_leads
  FOR SELECT USING (false);

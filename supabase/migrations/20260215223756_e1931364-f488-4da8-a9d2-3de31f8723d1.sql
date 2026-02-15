
-- Create table to store all contact/booking inquiries with client segment
CREATE TABLE public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  date TEXT,
  location TEXT,
  guest_count TEXT,
  budget TEXT,
  message TEXT,
  client_type TEXT,
  source TEXT NOT NULL DEFAULT 'contact_form',
  recommendation TEXT
);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public forms)
CREATE POLICY "Allow anonymous inserts"
  ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (true);

-- No public reads (admin only via service role)
CREATE POLICY "No public reads"
  ON public.contact_inquiries
  FOR SELECT
  USING (false);

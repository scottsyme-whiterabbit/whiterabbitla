-- Add unsubscribed_at column to cold_email_campaigns
ALTER TABLE public.cold_email_campaigns
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamp with time zone;

-- Create email_unsubscribes audit table
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  unsubscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'list_unsubscribe_header',
  user_agent text,
  ip_hash text
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON public.email_unsubscribes (lower(email));
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_unsubscribed_at ON public.email_unsubscribes (unsubscribed_at DESC);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only email_unsubscribes"
  ON public.email_unsubscribes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
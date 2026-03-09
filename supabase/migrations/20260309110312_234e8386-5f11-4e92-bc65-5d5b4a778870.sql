
CREATE TABLE public.email_bounces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.newsletter_contacts(id) ON DELETE CASCADE,
  email text NOT NULL,
  bounce_type text NOT NULL,
  reason text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only bounces" ON public.email_bounces
  AS RESTRICTIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

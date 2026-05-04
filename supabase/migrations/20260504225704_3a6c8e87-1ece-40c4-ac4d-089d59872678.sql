CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  recipient_email text,
  event_type text NOT NULL DEFAULT 'Wedding',
  event_date text NOT NULL DEFAULT '',
  venue text,
  intro_paragraph text NOT NULL DEFAULT '',
  hero_image text NOT NULL DEFAULT 'wedding',
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  closing_quote text,
  closing_attribution text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view proposals by slug"
  ON public.proposals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_proposals_slug ON public.proposals(slug);
CREATE INDEX idx_proposals_created ON public.proposals(created_at DESC);
-- New table for venue/residency pitches
CREATE TABLE public.venue_pitches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  venue_name text NOT NULL DEFAULT '',
  gm_name text NOT NULL DEFAULT '',
  gm_email text,
  submarket text,
  hero_image text NOT NULL DEFAULT 'signature',
  hero_subhead text NOT NULL DEFAULT 'One night a week. Every booth. Two hours. No microphone. No spectacle.',
  intro_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb,
  pilot_weeks integer NOT NULL DEFAULT 4,
  nights_per_week integer NOT NULL DEFAULT 1,
  session_hours integer NOT NULL DEFAULT 2,
  fee_dollars integer,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  press_line text,
  scheduling_url text,
  closing_private_line text NOT NULL DEFAULT 'The Hand and Eye in your home. And, perhaps, in your room.',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_pitches ENABLE ROW LEVEL SECURITY;

-- Public can view by slug (same model as proposals)
CREATE POLICY "Public can view venue pitches by slug"
ON public.venue_pitches
FOR SELECT
TO anon, authenticated
USING (true);

-- All writes go through service role only (admin via edge function)
CREATE POLICY "Service role full access venue_pitches"
ON public.venue_pitches
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_venue_pitches_updated_at
BEFORE UPDATE ON public.venue_pitches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_venue_pitches_slug ON public.venue_pitches(slug);
CREATE INDEX idx_venue_pitches_created_at ON public.venue_pitches(created_at DESC);

-- Extend proposal_views to also track venue pitch views
ALTER TABLE public.proposal_views
  ALTER COLUMN proposal_id DROP NOT NULL,
  ADD COLUMN venue_pitch_id uuid;

-- Ensure at least one of the two is set
ALTER TABLE public.proposal_views
  ADD CONSTRAINT proposal_views_target_check
  CHECK (proposal_id IS NOT NULL OR venue_pitch_id IS NOT NULL);

CREATE INDEX idx_proposal_views_venue_pitch_id ON public.proposal_views(venue_pitch_id);
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS gallery_photos jsonb NOT NULL DEFAULT '[]'::jsonb;
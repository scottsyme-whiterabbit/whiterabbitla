CREATE TABLE public.gallery_order (
  source text NOT NULL,
  ref text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, ref)
);

GRANT ALL ON public.gallery_order TO service_role;

ALTER TABLE public.gallery_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages gallery order"
  ON public.gallery_order
  FOR ALL
  USING (false)
  WITH CHECK (false);
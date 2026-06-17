CREATE TABLE public.gallery_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  file_name text,
  mime_type text,
  size_bytes bigint,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.gallery_uploads TO service_role;

ALTER TABLE public.gallery_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages gallery uploads"
  ON public.gallery_uploads
  FOR ALL
  USING (false)
  WITH CHECK (false);
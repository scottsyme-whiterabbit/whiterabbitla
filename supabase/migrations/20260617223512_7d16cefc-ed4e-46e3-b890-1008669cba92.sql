CREATE TABLE public.drive_gallery_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id text NOT NULL,
  file_id text NOT NULL,
  file_name text,
  mime_type text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (folder_id, file_id)
);

GRANT ALL ON public.drive_gallery_picks TO service_role;

ALTER TABLE public.drive_gallery_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages picks"
  ON public.drive_gallery_picks
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX drive_gallery_picks_folder_idx ON public.drive_gallery_picks(folder_id);
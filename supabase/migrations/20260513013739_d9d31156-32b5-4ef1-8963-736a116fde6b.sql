CREATE TABLE public.drive_photo_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drive_photo_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only drive_photo_folders"
ON public.drive_photo_folders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
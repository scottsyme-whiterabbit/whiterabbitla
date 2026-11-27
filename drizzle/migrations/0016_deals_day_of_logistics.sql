ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS arrival_time time without time zone,
  ADD COLUMN IF NOT EXISTS on_site_contact_name text,
  ADD COLUMN IF NOT EXISTS on_site_contact_phone text,
  ADD COLUMN IF NOT EXISTS parking_access text,
  ADD COLUMN IF NOT EXISTS venue_address text;
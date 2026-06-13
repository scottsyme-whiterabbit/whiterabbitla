ALTER TABLE public.venue_pitches
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS room_detail text,
  ADD COLUMN IF NOT EXISTS night_of_week text DEFAULT 'Thursday',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS case_study_result text,
  ADD COLUMN IF NOT EXISTS case_study_quote text,
  ADD COLUMN IF NOT EXISTS case_study_attribution text;
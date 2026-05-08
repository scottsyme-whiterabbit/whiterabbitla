ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nurture_started_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_nurture
  ON public.contact_inquiries (nurture_step, followup_step);

-- Add followup tracking columns to contact_inquiries
ALTER TABLE public.contact_inquiries
ADD COLUMN followup_step INTEGER NOT NULL DEFAULT 0,
ADD COLUMN followup_started_at TIMESTAMP WITH TIME ZONE;

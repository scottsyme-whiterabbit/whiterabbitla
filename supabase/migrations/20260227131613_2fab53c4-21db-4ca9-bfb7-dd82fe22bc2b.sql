
-- Add post-show sequence tracking to deals
ALTER TABLE public.deals
ADD COLUMN post_show_step INTEGER NOT NULL DEFAULT 0,
ADD COLUMN post_show_started_at TIMESTAMP WITH TIME ZONE;

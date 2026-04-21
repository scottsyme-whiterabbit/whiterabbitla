ALTER TABLE public.cold_email_campaigns DROP CONSTRAINT IF EXISTS cold_email_campaigns_status_check;
ALTER TABLE public.cold_email_campaigns ADD CONSTRAINT cold_email_campaigns_status_check
  CHECK (status IN ('active','paused','replied','completed','bounced','unsubscribed','scrubbed_zerobounce','paused_catch_all'));
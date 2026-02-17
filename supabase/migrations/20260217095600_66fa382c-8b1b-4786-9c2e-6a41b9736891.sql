-- Add A/B variant tracking to send log
ALTER TABLE public.newsletter_send_log
ADD COLUMN ab_variant text DEFAULT NULL;

-- Add index for quick variant-based aggregation
CREATE INDEX idx_send_log_ab_variant ON public.newsletter_send_log (campaign_id, ab_variant);

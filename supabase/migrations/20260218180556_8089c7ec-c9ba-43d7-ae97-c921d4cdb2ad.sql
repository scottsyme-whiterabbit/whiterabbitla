-- Change campaign_id from UUID to TEXT to support string identifiers like "resident-step-0"
-- First drop the foreign key constraint
ALTER TABLE public.newsletter_send_log DROP CONSTRAINT IF EXISTS newsletter_send_log_campaign_id_fkey;

-- Change column type
ALTER TABLE public.newsletter_send_log ALTER COLUMN campaign_id TYPE text USING campaign_id::text;
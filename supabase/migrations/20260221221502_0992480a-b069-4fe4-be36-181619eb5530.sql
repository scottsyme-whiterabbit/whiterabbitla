
-- Add optimal send hour column for send time optimization
ALTER TABLE public.newsletter_contacts ADD COLUMN IF NOT EXISTS optimal_send_hour integer;

-- Add comment for clarity
COMMENT ON COLUMN public.newsletter_contacts.optimal_send_hour IS 'Calculated best hour (0-23 UTC) to send emails to this contact based on open history';

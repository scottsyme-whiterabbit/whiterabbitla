
-- Allow newsletter_opens & newsletter_clicks to track BOTH newsletter_contacts and cold_email_campaigns recipients.
-- We drop the FKs on contact_id (since the UUID can now reference either table) and add a contact_source column to disambiguate.

ALTER TABLE public.newsletter_opens DROP CONSTRAINT IF EXISTS newsletter_opens_contact_id_fkey;
ALTER TABLE public.newsletter_clicks DROP CONSTRAINT IF EXISTS newsletter_clicks_contact_id_fkey;

ALTER TABLE public.newsletter_opens ADD COLUMN IF NOT EXISTS contact_source TEXT NOT NULL DEFAULT 'newsletter';
ALTER TABLE public.newsletter_clicks ADD COLUMN IF NOT EXISTS contact_source TEXT NOT NULL DEFAULT 'newsletter';

CREATE INDEX IF NOT EXISTS idx_newsletter_opens_source_contact ON public.newsletter_opens (contact_source, contact_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_source_contact ON public.newsletter_clicks (contact_source, contact_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_opens_opened_at ON public.newsletter_opens (opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_clicked_at ON public.newsletter_clicks (clicked_at DESC);

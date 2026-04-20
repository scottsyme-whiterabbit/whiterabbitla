-- Step 1: Mark malformed/example.com contacts as unsendable + log them
-- We use subscribed=false (already filtered by send-newsletter) rather than DELETE
-- because 3 of the 4 affected rows contain real Greystar emails mashed with notes
-- that require manual review. Keeping the row preserves audit history.

CREATE TABLE IF NOT EXISTS public.contact_cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_at timestamptz NOT NULL DEFAULT now(),
  original_email text NOT NULL,
  contact_id uuid,
  reason text NOT NULL,
  source_table text NOT NULL DEFAULT 'newsletter_contacts'
);

ALTER TABLE public.contact_cleanup_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only cleanup_log" ON public.contact_cleanup_log;
CREATE POLICY "Service role only cleanup_log"
  ON public.contact_cleanup_log
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Snapshot affected rows before mutation
INSERT INTO public.contact_cleanup_log (original_email, contact_id, reason)
SELECT
  email,
  id,
  CASE
    WHEN email LIKE '%<%' OR email LIKE '%>%' THEN 'angle_brackets'
    WHEN email LIKE '% %' THEN 'whitespace_in_email'
    WHEN lower(email) LIKE '%example.com' THEN 'example_domain'
    ELSE 'unknown'
  END
FROM public.newsletter_contacts
WHERE email LIKE '%<%'
   OR email LIKE '%>%'
   OR email LIKE '% %'
   OR lower(email) LIKE '%example.com';

-- Mark unsendable (subscribed=false is the existing send filter)
UPDATE public.newsletter_contacts
SET subscribed = false,
    engagement_status = 'invalid_email',
    updated_at = now()
WHERE email LIKE '%<%'
   OR email LIKE '%>%'
   OR email LIKE '% %'
   OR lower(email) LIKE '%example.com';

-- Step 3 (DB-side): block future malformed inserts via trigger
-- (matches the edge-function sanitization we'll add in code)
CREATE OR REPLACE FUNCTION public.sanitize_newsletter_contact_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Strip angle brackets and all whitespace, lowercase
  NEW.email := lower(regexp_replace(NEW.email, '[<>\s]', '', 'g'));

  -- Reject empty
  IF NEW.email IS NULL OR length(NEW.email) = 0 THEN
    RAISE EXCEPTION 'Invalid email: empty after sanitization';
  END IF;

  -- Basic RFC-ish format check
  IF NEW.email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;

  -- Block example domains
  IF NEW.email LIKE '%@example.com'
     OR NEW.email LIKE '%@example.org'
     OR NEW.email LIKE '%@example.net' THEN
    RAISE EXCEPTION 'Reserved example domain not allowed: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_newsletter_contact_email_trg ON public.newsletter_contacts;
CREATE TRIGGER sanitize_newsletter_contact_email_trg
  BEFORE INSERT OR UPDATE OF email ON public.newsletter_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_newsletter_contact_email();
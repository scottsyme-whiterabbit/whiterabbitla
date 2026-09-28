CREATE OR REPLACE FUNCTION public.validate_automated_gmail_send_kind()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.kind NOT IN ('instant_reply', 'followup_1', 'followup_2') THEN
    RAISE EXCEPTION 'Invalid automated Gmail send kind: %', NEW.kind;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_automated_gmail_send_kind() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_automated_gmail_send_kind() TO service_role;

CREATE TRIGGER validate_automated_gmail_send_kind_trigger
BEFORE INSERT OR UPDATE OF kind ON public.automated_gmail_sends
FOR EACH ROW
EXECUTE FUNCTION public.validate_automated_gmail_send_kind();
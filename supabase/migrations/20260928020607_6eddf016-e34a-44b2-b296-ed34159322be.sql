ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS instant_reply_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS instant_reply_message_id text,
  ADD COLUMN IF NOT EXISTS sequence_stopped_at timestamptz,
  ADD COLUMN IF NOT EXISTS sequence_stopped_reason text;

CREATE TABLE public.automated_gmail_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id text NOT NULL UNIQUE,
  kind text NOT NULL,
  inquiry_id uuid REFERENCES public.contact_inquiries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.automated_gmail_sends TO service_role;

ALTER TABLE public.automated_gmail_sends ENABLE ROW LEVEL SECURITY;

CREATE INDEX contact_inquiries_sequence_processing_idx
  ON public.contact_inquiries (sequence_stopped_at, instant_reply_sent_at, created_at);

CREATE OR REPLACE FUNCTION public.stop_inquiry_sequence(p_email text, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN;
  END IF;

  UPDATE public.contact_inquiries
  SET sequence_stopped_at = now(),
      sequence_stopped_reason = p_reason
  WHERE lower(email) = lower(btrim(p_email))
    AND sequence_stopped_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.stop_inquiry_sequence(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stop_inquiry_sequence(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.stop_inquiry_sequence_from_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.stop_inquiry_sequence(NEW.recipient_email, 'proposal_sent');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.stop_inquiry_sequence_from_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.stop_inquiry_sequence(NEW.contact_email, 'deal_' || NEW.stage);
  RETURN NEW;
END;
$$;

CREATE TRIGGER stop_inquiry_sequence_proposal_insert
AFTER INSERT ON public.proposals
FOR EACH ROW
WHEN (NEW.sent_at IS NOT NULL)
EXECUTE FUNCTION public.stop_inquiry_sequence_from_proposal();

CREATE TRIGGER stop_inquiry_sequence_proposal_update
AFTER UPDATE OF sent_at ON public.proposals
FOR EACH ROW
WHEN (NEW.sent_at IS NOT NULL)
EXECUTE FUNCTION public.stop_inquiry_sequence_from_proposal();

CREATE TRIGGER stop_inquiry_sequence_deal_stage
AFTER UPDATE OF stage ON public.deals
FOR EACH ROW
WHEN (NEW.stage IS DISTINCT FROM OLD.stage AND NEW.stage NOT IN ('new', 'contacted'))
EXECUTE FUNCTION public.stop_inquiry_sequence_from_deal();
CREATE TABLE public.personal_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  deal_id uuid NOT NULL,
  inquiry_id uuid,
  reply_type text NOT NULL CHECK (reply_type IN ('voicemail','schedule_call','date_open','booked','proposal_followup')),
  to_email text NOT NULL,
  subject text,
  body text,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent')),
  gmail_message_id text,
  gmail_thread_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

GRANT ALL ON public.personal_replies TO service_role;

ALTER TABLE public.personal_replies ENABLE ROW LEVEL SECURITY;

-- Only one send in flight per deal: a double tap cannot send twice.
CREATE UNIQUE INDEX personal_replies_one_sending_per_deal ON public.personal_replies (deal_id) WHERE status = 'sending';
CREATE INDEX personal_replies_deal_sent_idx ON public.personal_replies (deal_id, sent_at);

COMMENT ON TABLE public.personal_replies IS 'Personal replies Scott sends from the CRM helper on the Booking Inquiry thread. Service role only.';
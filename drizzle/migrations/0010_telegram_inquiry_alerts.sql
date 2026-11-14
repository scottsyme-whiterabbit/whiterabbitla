CREATE TABLE public.telegram_inquiry_alerts (
  dedupe_key text PRIMARY KEY,
  inquiry_id uuid,
  deal_id uuid,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','unknown')),
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

GRANT ALL ON public.telegram_inquiry_alerts TO service_role;

ALTER TABLE public.telegram_inquiry_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX telegram_inquiry_alerts_inquiry_idx ON public.telegram_inquiry_alerts (inquiry_id);

COMMENT ON TABLE public.telegram_inquiry_alerts IS 'One row per inquiry Telegram alert to Scott. The unique key (a hash of the inquiry details) stops retries and duplicate submits from alerting twice. Service role only.';
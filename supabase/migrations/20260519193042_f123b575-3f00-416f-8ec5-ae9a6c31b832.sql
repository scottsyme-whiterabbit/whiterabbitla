
-- Deal email threads
CREATE TABLE IF NOT EXISTS public.deal_email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  gmail_thread_id text NOT NULL,
  subject text,
  snippet text,
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, gmail_thread_id)
);
CREATE INDEX IF NOT EXISTS idx_deal_email_threads_deal ON public.deal_email_threads(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_email_threads_last_inbound ON public.deal_email_threads(last_inbound_at DESC);
ALTER TABLE public.deal_email_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only deal_email_threads" ON public.deal_email_threads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Deal email messages
CREATE TABLE IF NOT EXISTS public.deal_email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES public.deal_email_threads(id) ON DELETE CASCADE,
  gmail_message_id text NOT NULL UNIQUE,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_email text,
  to_email text,
  subject text,
  snippet text,
  body_text text,
  sent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deal_email_messages_deal ON public.deal_email_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_email_messages_thread ON public.deal_email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_deal_email_messages_sent_at ON public.deal_email_messages(sent_at DESC);
ALTER TABLE public.deal_email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only deal_email_messages" ON public.deal_email_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Unified activity feed
CREATE TABLE IF NOT EXISTS public.deal_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  body text,
  metadata jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deal_activity_deal ON public.deal_activity(deal_id, occurred_at DESC);
ALTER TABLE public.deal_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only deal_activity" ON public.deal_activity FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Deal columns
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS gmail_thread_id text,
  ADD COLUMN IF NOT EXISTS calendar_event_id text,
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz,
  ADD COLUMN IF NOT EXISTS hot_signal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hot_reason text,
  ADD COLUMN IF NOT EXISTS last_gmail_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_calendar_sync_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_deals_last_inbound ON public.deals(last_inbound_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_deals_hot_signal ON public.deals(hot_signal) WHERE hot_signal = true;
CREATE INDEX IF NOT EXISTS idx_deals_calendar_event ON public.deals(calendar_event_id) WHERE calendar_event_id IS NOT NULL;

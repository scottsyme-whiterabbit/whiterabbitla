
CREATE TABLE IF NOT EXISTS public.auto_unsubscribe_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  matched_pattern text NOT NULL,
  source_thread_id uuid REFERENCES public.deal_email_threads(id) ON DELETE SET NULL,
  source_message_id text,
  reply_from_email text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);
GRANT ALL ON public.auto_unsubscribe_log TO service_role;
ALTER TABLE public.auto_unsubscribe_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only auto_unsubscribe_log" ON public.auto_unsubscribe_log
  TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_auto_unsub_log_processed_at ON public.auto_unsubscribe_log(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_unsub_log_email ON public.auto_unsubscribe_log(lower(email));

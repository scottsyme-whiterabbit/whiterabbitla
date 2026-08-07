ALTER TABLE public.event_invoices
  ADD COLUMN IF NOT EXISTS pending_session_id text,
  ADD COLUMN IF NOT EXISTS pending_since timestamptz,
  ADD COLUMN IF NOT EXISTS pending_alert_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_failed_at timestamptz;
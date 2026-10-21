ALTER TABLE public.event_invoices
  ADD COLUMN IF NOT EXISTS dispute_status text,
  ADD COLUMN IF NOT EXISTS dispute_id text,
  ADD COLUMN IF NOT EXISTS dispute_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputed_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  invoice_id uuid,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
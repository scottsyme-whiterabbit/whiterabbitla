ALTER TABLE public.event_invoices
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS external_note text,
  ADD COLUMN IF NOT EXISTS client_emails_paused boolean NOT NULL DEFAULT false;
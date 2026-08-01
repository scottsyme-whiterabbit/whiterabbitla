ALTER TABLE public.event_invoices
  ADD COLUMN IF NOT EXISTS anticipation_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_anticipation_at timestamptz NULL;
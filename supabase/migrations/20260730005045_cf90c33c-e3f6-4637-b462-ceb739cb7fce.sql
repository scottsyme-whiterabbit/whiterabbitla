CREATE TABLE public.event_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES public.signed_agreements(id) ON DELETE SET NULL,
  deal_id uuid,
  pay_token text NOT NULL UNIQUE,
  client_name text,
  client_email text,
  event_type text,
  event_date date,
  venue text,
  tier_name text,
  total_cents integer NOT NULL,
  deposit_percent integer NOT NULL DEFAULT 50,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  environment text NOT NULL DEFAULT 'sandbox',
  stripe_session_id text,
  stripe_payment_intent_id text,
  initial_reminders_sent integer NOT NULL DEFAULT 0,
  last_reminder_at timestamptz,
  balance_reminders_sent integer NOT NULL DEFAULT 0,
  last_balance_reminder_at timestamptz,
  deposit_paid_at timestamptz,
  paid_in_full_at timestamptz,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_invoices_status ON public.event_invoices(status);
CREATE INDEX idx_event_invoices_token ON public.event_invoices(pay_token);

GRANT ALL ON public.event_invoices TO service_role;

ALTER TABLE public.event_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages event invoices"
  ON public.event_invoices FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_event_invoices_updated_at
  BEFORE UPDATE ON public.event_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Find the Lady booking credits. One active credit per email; written only by
-- the find-the-lady-claim backend function, read only by the admin CRM function.
CREATE TABLE public.find_the_lady_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  email text NOT NULL,
  first_name text NOT NULL,
  event_type text NOT NULL,
  approx_event_date date,
  found_queen boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  credit_cents integer NOT NULL DEFAULT 25000,
  min_package_cents integer NOT NULL DEFAULT 250000,
  expires_on date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT find_the_lady_credits_status_check CHECK (status IN ('active', 'redeemed', 'expired', 'void')),
  CONSTRAINT find_the_lady_credits_code_format CHECK (code ~ '^WR-LADY-[A-Z0-9]{4}$')
);

CREATE UNIQUE INDEX find_the_lady_credits_one_active_per_email
  ON public.find_the_lady_credits (lower(email)) WHERE status = 'active';
CREATE INDEX find_the_lady_credits_deal_id ON public.find_the_lady_credits (deal_id);

GRANT ALL ON public.find_the_lady_credits TO service_role;

ALTER TABLE public.find_the_lady_credits ENABLE ROW LEVEL SECURITY;
-- No policies: visitors and signed-in browsers can never read or change credits.

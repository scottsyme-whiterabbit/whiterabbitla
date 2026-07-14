
CREATE TABLE public.signed_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  proposal_slug text,
  tier_name text NOT NULL,
  tier_price text,
  client_name text NOT NULL,
  client_email text,
  event_type text,
  event_date text,
  venue text,
  agreement_text text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  signer_ip text,
  user_agent text,
  invoice_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signed_agreements TO authenticated;
GRANT SELECT, INSERT ON public.signed_agreements TO anon;
GRANT ALL ON public.signed_agreements TO service_role;
ALTER TABLE public.signed_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can insert signed agreements" ON public.signed_agreements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "no public read" ON public.signed_agreements FOR SELECT TO anon USING (false);
CREATE INDEX signed_agreements_proposal_id_idx ON public.signed_agreements(proposal_id);
CREATE INDEX signed_agreements_signed_at_idx ON public.signed_agreements(signed_at DESC);


ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_deal_id ON public.proposals(deal_id);

ALTER TABLE public.signed_agreements
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_signed_agreements_deal_id ON public.signed_agreements(deal_id);

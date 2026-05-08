CREATE TABLE public.proposal_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_proposal_views_proposal_id ON public.proposal_views(proposal_id, viewed_at DESC);

ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a proposal view"
ON public.proposal_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

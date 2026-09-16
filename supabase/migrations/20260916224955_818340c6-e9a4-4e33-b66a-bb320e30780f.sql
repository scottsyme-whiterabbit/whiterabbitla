ALTER TABLE public.signed_agreements
  ADD COLUMN IF NOT EXISTS performance_time text,
  ADD COLUMN IF NOT EXISTS arrival_time text;
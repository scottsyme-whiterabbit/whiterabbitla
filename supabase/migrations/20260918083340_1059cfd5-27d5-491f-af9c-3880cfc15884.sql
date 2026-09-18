ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS followup_step int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_paused boolean NOT NULL DEFAULT false;

UPDATE public.proposals SET followup_step = 3 WHERE sent_at IS NOT NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS hold_until date;

UPDATE public.proposals
SET hold_until = (sent_at + interval '7 days')::date
WHERE sent_at IS NOT NULL AND hold_until IS NULL;
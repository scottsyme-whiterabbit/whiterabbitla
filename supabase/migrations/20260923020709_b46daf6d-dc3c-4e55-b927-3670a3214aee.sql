-- Re-engagement tracking for old inquiries. Nobody gets the "still interested?" email twice.
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS reengaged_at timestamptz;

-- No-op record: the RLS policy "public can insert signed agreements" on
-- public.signed_agreements was dropped manually. Signing still works because
-- proposals-api writes with the service role. Do not re-add that policy.
DO $$ BEGIN PERFORM 1; END $$;
-- 1. Drop anon/public SELECT policies that expose all rows
DROP POLICY IF EXISTS "Public can view proposals by slug" ON public.proposals;
DROP POLICY IF EXISTS "Public can view venue pitches by slug" ON public.venue_pitches;

-- 2. Ensure RLS is enabled on every table in the public schema
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;

-- 3. Revoke all SELECT access from anon and PUBLIC (INSERT grants untouched)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t.relname);
    EXECUTE format('REVOKE SELECT ON public.%I FROM PUBLIC', t.relname);
  END LOOP;
END $$;

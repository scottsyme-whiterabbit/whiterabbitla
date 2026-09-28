DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.system_health()'::regprocedure);
  d := replace(d, '''gmail-sync-every-10min''', '''gmail-sync-every-3min''');
  EXECUTE d;
END $$;
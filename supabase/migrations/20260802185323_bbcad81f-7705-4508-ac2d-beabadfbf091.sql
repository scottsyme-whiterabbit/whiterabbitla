SELECT cron.alter_job(18, command := $cmd$
  SELECT net.http_post(
    url := 'https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/delay-watchdog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET_V2' LIMIT 1)
    ),
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
$cmd$);

SELECT cron.alter_job(20, command := $cmd$
  SELECT net.http_post(
    url := 'https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/bounce-threshold-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET_V2' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
$cmd$);
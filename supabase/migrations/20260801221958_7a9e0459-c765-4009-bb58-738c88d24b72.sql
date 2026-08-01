select cron.schedule('castle-invite-send-weekdays', '0 17,20,23 * * 1-5', $$
  select net.http_post(
    url := 'https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/castle-invite-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnanl6YXl2a3lyZnRja3N2bmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzQ4ODAsImV4cCI6MjA4NjUxMDg4MH0.8iBF_fusZWai1zaWRBSDUksvkfAHNPrd0th4YW3XBhc',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
$$);

select cron.schedule('castle-invite-summary-7pm-pt', '0 3 * * *', $$
  select net.http_post(
    url := 'https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/castle-invite-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnanl6YXl2a3lyZnRja3N2bmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzQ4ODAsImV4cCI6MjA4NjUxMDg4MH0.8iBF_fusZWai1zaWRBSDUksvkfAHNPrd0th4YW3XBhc',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
$$);
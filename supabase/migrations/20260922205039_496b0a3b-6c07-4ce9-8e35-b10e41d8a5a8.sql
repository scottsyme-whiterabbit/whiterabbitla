UPDATE public.event_invoices
SET status = 'canceled'
WHERE status = 'open'
  AND (
    client_email IS NULL
    OR btrim(client_email) = ''
    OR lower(btrim(client_email)) = 'scott.syme@whiterabbitla.com'
    OR client_name LIKE 'DIAG%'
    OR client_name LIKE '%TEST%'
    OR client_name = 'Scott Syme'
  );
CREATE OR REPLACE FUNCTION public.get_resident_opens_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM newsletter_opens o JOIN newsletter_contacts c ON o.contact_id = c.id WHERE c.drip_campaign IN ('resident', 'resident-done', 'resident-pulse')),
    'uniqueContacts', (SELECT count(DISTINCT o.contact_id) FROM newsletter_opens o JOIN newsletter_contacts c ON o.contact_id = c.id WHERE c.drip_campaign IN ('resident', 'resident-done', 'resident-pulse')),
    'perStep', (
      SELECT jsonb_agg(COALESCE(step_count, 0) ORDER BY step)
      FROM generate_series(0, 4) AS step
      LEFT JOIN (
        SELECT o.drip_step, count(*) AS step_count
        FROM newsletter_opens o
        JOIN newsletter_contacts c ON o.contact_id = c.id
        WHERE c.drip_campaign IN ('resident', 'resident-done', 'resident-pulse')
        AND o.drip_step BETWEEN 0 AND 4
        GROUP BY o.drip_step
      ) sc ON sc.drip_step = step
    ),
    'clicksTotal', (SELECT count(*) FROM newsletter_clicks cl JOIN newsletter_contacts c ON cl.contact_id = c.id WHERE c.drip_campaign IN ('resident', 'resident-done', 'resident-pulse')),
    'clicksUnique', (SELECT count(DISTINCT cl.contact_id) FROM newsletter_clicks cl JOIN newsletter_contacts c ON cl.contact_id = c.id WHERE c.drip_campaign IN ('resident', 'resident-done', 'resident-pulse'))
  );
$$;
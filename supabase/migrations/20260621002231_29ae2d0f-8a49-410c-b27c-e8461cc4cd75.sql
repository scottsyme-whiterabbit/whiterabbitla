
-- Attach triggers so existing increment functions actually fire
DROP TRIGGER IF EXISTS trg_cold_campaign_incr_opens ON public.newsletter_opens;
CREATE TRIGGER trg_cold_campaign_incr_opens
AFTER INSERT ON public.newsletter_opens
FOR EACH ROW EXECUTE FUNCTION public.cold_campaign_increment_opens();

DROP TRIGGER IF EXISTS trg_cold_campaign_incr_clicks ON public.newsletter_clicks;
CREATE TRIGGER trg_cold_campaign_incr_clicks
AFTER INSERT ON public.newsletter_clicks
FOR EACH ROW EXECUTE FUNCTION public.cold_campaign_increment_clicks();

-- Backfill engagement counters from existing tracking history
WITH op AS (
  SELECT contact_id, count(*)::int AS c
  FROM public.newsletter_opens
  WHERE contact_source = 'cold'
  GROUP BY contact_id
),
cl AS (
  SELECT contact_id, count(*)::int AS c
  FROM public.newsletter_clicks
  WHERE contact_source = 'cold'
  GROUP BY contact_id
)
UPDATE public.cold_email_campaigns c
SET engagement_opens  = COALESCE(op.c, 0),
    engagement_clicks = COALESCE(cl.c, 0),
    hot_tag = (COALESCE(cl.c,0) >= 1 OR COALESCE(op.c,0) >= 3)
FROM (SELECT id FROM public.cold_email_campaigns) ids
LEFT JOIN op ON op.contact_id = ids.id
LEFT JOIN cl ON cl.contact_id = ids.id
WHERE c.id = ids.id;

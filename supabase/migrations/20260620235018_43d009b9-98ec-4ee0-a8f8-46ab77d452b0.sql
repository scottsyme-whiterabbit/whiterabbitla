
-- Function: increment opens
CREATE OR REPLACE FUNCTION public.cold_campaign_increment_opens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.contact_source = 'cold' THEN
    UPDATE public.cold_email_campaigns
    SET engagement_opens = COALESCE(engagement_opens, 0) + 1,
        hot_tag = CASE
          WHEN COALESCE(engagement_opens, 0) + 1 >= 3
            OR COALESCE(engagement_clicks, 0) >= 1
          THEN true ELSE hot_tag
        END
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cold_increment_opens ON public.newsletter_opens;
CREATE TRIGGER trg_cold_increment_opens
AFTER INSERT ON public.newsletter_opens
FOR EACH ROW EXECUTE FUNCTION public.cold_campaign_increment_opens();

-- Function: increment clicks
CREATE OR REPLACE FUNCTION public.cold_campaign_increment_clicks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.contact_source = 'cold' THEN
    UPDATE public.cold_email_campaigns
    SET engagement_clicks = COALESCE(engagement_clicks, 0) + 1,
        hot_tag = true
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cold_increment_clicks ON public.newsletter_clicks;
CREATE TRIGGER trg_cold_increment_clicks
AFTER INSERT ON public.newsletter_clicks
FOR EACH ROW EXECUTE FUNCTION public.cold_campaign_increment_clicks();

-- Backfill from existing tracking history
WITH open_counts AS (
  SELECT contact_id, COUNT(*)::int AS n
  FROM public.newsletter_opens
  WHERE contact_source = 'cold'
  GROUP BY contact_id
),
click_counts AS (
  SELECT contact_id, COUNT(*)::int AS n
  FROM public.newsletter_clicks
  WHERE contact_source = 'cold'
  GROUP BY contact_id
)
UPDATE public.cold_email_campaigns c
SET engagement_opens = COALESCE(o.n, 0),
    engagement_clicks = COALESCE(k.n, 0),
    hot_tag = (COALESCE(o.n, 0) >= 3 OR COALESCE(k.n, 0) >= 1)
FROM open_counts o
FULL OUTER JOIN click_counts k ON k.contact_id = o.contact_id
WHERE c.id = COALESCE(o.contact_id, k.contact_id);

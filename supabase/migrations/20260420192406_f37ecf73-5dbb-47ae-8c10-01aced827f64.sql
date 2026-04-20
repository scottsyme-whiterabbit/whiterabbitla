UPDATE public.cold_email_campaigns
SET status = 'active',
    updated_at = now()
WHERE campaign_category IN ('pr_agency', 'restaurant', 'corporate_planner')
  AND status = 'paused';
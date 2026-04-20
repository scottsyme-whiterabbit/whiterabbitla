UPDATE public.cold_email_campaigns
SET status = 'active',
    updated_at = now()
WHERE campaign_category IN ('wedding_planner', 'spirits', 'talent_management', 'nonprofit')
  AND status = 'paused';
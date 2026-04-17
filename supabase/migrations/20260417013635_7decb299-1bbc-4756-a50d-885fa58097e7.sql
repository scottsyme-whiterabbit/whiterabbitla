UPDATE cold_email_campaigns
SET status = 'paused',
    started_at = NULL,
    updated_at = now(),
    notes = COALESCE(notes, '') || ' [paused 2026-04-17 — wedding_planner full halt for QA]'
WHERE campaign_category = 'wedding_planner'
  AND status = 'active';
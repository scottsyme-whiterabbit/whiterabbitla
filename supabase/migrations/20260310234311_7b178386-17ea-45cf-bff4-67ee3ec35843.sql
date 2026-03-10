
-- Fix deals RLS
DROP POLICY "Service role only deals" ON public.deals;
CREATE POLICY "Service role only deals"
  ON public.deals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix outreach_log RLS
DROP POLICY "Service role only outreach_log" ON public.outreach_log;
CREATE POLICY "Service role only outreach_log"
  ON public.outreach_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix cold_email_campaigns RLS
DROP POLICY "Service role only cold_email_campaigns" ON public.cold_email_campaigns;
CREATE POLICY "Service role only cold_email_campaigns"
  ON public.cold_email_campaigns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix newsletter_opens RLS
DROP POLICY "Service role only opens" ON public.newsletter_opens;
CREATE POLICY "Service role only opens"
  ON public.newsletter_opens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix newsletter_clicks RLS
DROP POLICY "Service role only clicks" ON public.newsletter_clicks;
CREATE POLICY "Service role only clicks"
  ON public.newsletter_clicks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix email_bounces RLS
DROP POLICY "Service role only bounces" ON public.email_bounces;
CREATE POLICY "Service role only bounces"
  ON public.email_bounces FOR ALL TO service_role
  USING (true) WITH CHECK (true);

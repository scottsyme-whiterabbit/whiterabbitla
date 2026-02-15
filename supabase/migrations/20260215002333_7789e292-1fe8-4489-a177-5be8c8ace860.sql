
-- Drop overly permissive policies
DROP POLICY "Service role full access contacts" ON public.newsletter_contacts;
DROP POLICY "Service role full access campaigns" ON public.newsletter_campaigns;
DROP POLICY "Service role full access send_log" ON public.newsletter_send_log;

-- Restrict to service_role only (edge functions)
CREATE POLICY "Service role only contacts" ON public.newsletter_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role only campaigns" ON public.newsletter_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role only send_log" ON public.newsletter_send_log FOR ALL TO service_role USING (true) WITH CHECK (true);

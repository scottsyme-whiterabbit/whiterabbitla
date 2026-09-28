REVOKE ALL ON FUNCTION public.stop_inquiry_sequence_from_proposal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.stop_inquiry_sequence_from_deal() FROM PUBLIC, anon, authenticated;

CREATE POLICY automated_gmail_sends_server_only
ON public.automated_gmail_sends
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
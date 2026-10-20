ALTER TABLE public.deal_value_backup_20261001 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_sequence_backup_20260926 ENABLE ROW LEVEL SECURITY;
-- PUBLIC grants are inherited by anon; remove that path as well as explicit anon access.
REVOKE EXECUTE ON FUNCTION public.deals_awaiting_reply() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.system_health() FROM PUBLIC, anon;
-- Preserve existing authenticated access and the gated report's service-role caller.
GRANT EXECUTE ON FUNCTION public.deals_awaiting_reply(), public.system_health() TO authenticated, service_role;
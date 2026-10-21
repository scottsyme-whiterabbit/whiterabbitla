CREATE UNIQUE INDEX IF NOT EXISTS event_invoices_one_active_per_deal
  ON public.event_invoices (deal_id)
  WHERE deal_id IS NOT NULL AND status NOT IN ('void', 'cancelled', 'canceled');

CREATE OR REPLACE FUNCTION public.deal_value_from_invoice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE d uuid;
BEGIN
  BEGIN
    IF NEW.status IN ('void','cancelled','canceled') THEN RETURN NEW; END IF;
    IF NEW.total_cents IS NULL OR NEW.total_cents <= 0 OR NEW.client_email IS NULL THEN RETURN NEW; END IF;
    SELECT id INTO d FROM deals WHERE lower(contact_email) = lower(btrim(NEW.client_email)) ORDER BY created_at DESC LIMIT 1;
    IF d IS NULL THEN RETURN NEW; END IF;
    IF NEW.status IN ('paid','deposit_paid') THEN
      UPDATE deals SET deal_value = NEW.total_cents WHERE id = d AND deal_value IS DISTINCT FROM NEW.total_cents;
    ELSE
      UPDATE deals SET deal_value = NEW.total_cents WHERE id = d AND COALESCE(deal_value,0) = 0;
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'deal_value_from_invoice: %', SQLERRM;
  END;
  RETURN NEW;
END $function$;
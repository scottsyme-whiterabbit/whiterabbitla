CREATE OR REPLACE FUNCTION public.deal_value_from_proposal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE d uuid; v integer; t jsonb;
BEGIN
  BEGIN
    IF jsonb_typeof(NEW.tiers) <> 'array' OR jsonb_array_length(NEW.tiers) = 0 THEN RETURN NEW; END IF;
    SELECT e INTO t FROM jsonb_array_elements(NEW.tiers) e WHERE (e->>'recommended')::text = 'true' LIMIT 1;
    IF t IS NULL THEN t := NEW.tiers->0; END IF;
    v := parse_price_cents(t->>'price');
    IF v IS NULL OR v <= 0 THEN RETURN NEW; END IF;
    d := resolve_proposal_deal(NEW.id, NULL);
    IF d IS NULL THEN RETURN NEW; END IF;
    UPDATE deals SET deal_value = v WHERE id = d AND COALESCE(deal_value,0) = 0;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'deal_value_from_proposal: %', SQLERRM;
  END;
  RETURN NEW;
END $function$;
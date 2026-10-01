CREATE OR REPLACE FUNCTION public.parse_price_cents(p text)
RETURNS integer LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public','pg_temp' AS $$
DECLARE d text; v bigint;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(split_part(p, '.', 1), '[^0-9]', '', 'g');
  IF d = '' OR length(d) > 7 THEN RETURN NULL; END IF;
  v := d::bigint * 100;
  IF v <= 0 THEN RETURN NULL; END IF;
  RETURN v::integer;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.resolve_proposal_deal(p_proposal_id uuid, p_slug text)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE pr record; d uuid;
BEGIN
  SELECT id, deal_id, recipient_email INTO pr FROM proposals
   WHERE (p_proposal_id IS NOT NULL AND id = p_proposal_id) OR (p_proposal_id IS NULL AND p_slug IS NOT NULL AND slug = p_slug)
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF pr.deal_id IS NOT NULL THEN RETURN pr.deal_id; END IF;
  IF pr.recipient_email IS NULL OR btrim(pr.recipient_email) = '' THEN RETURN NULL; END IF;
  SELECT id INTO d FROM deals WHERE lower(contact_email) = lower(btrim(pr.recipient_email)) ORDER BY created_at DESC LIMIT 1;
  RETURN d;
END $$;

-- Trigger A: invoices
CREATE OR REPLACE FUNCTION public.deal_value_from_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE d uuid;
BEGIN
  BEGIN
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
END $$;

DROP TRIGGER IF EXISTS deal_value_from_invoice ON public.event_invoices;
CREATE TRIGGER deal_value_from_invoice AFTER INSERT OR UPDATE OF total_cents, status ON public.event_invoices
FOR EACH ROW EXECUTE FUNCTION public.deal_value_from_invoice();

-- Trigger B: signed agreements
CREATE OR REPLACE FUNCTION public.deal_value_from_agreement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE d uuid; v integer;
BEGIN
  BEGIN
    v := parse_price_cents(NEW.tier_price);
    IF v IS NULL OR v <= 0 THEN RETURN NEW; END IF;
    d := resolve_proposal_deal(NEW.proposal_id, NEW.proposal_slug);
    IF d IS NULL THEN RETURN NEW; END IF;
    UPDATE deals SET deal_value = v WHERE id = d AND COALESCE(deal_value,0) = 0;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'deal_value_from_agreement: %', SQLERRM;
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS deal_value_from_agreement ON public.signed_agreements;
CREATE TRIGGER deal_value_from_agreement AFTER INSERT ON public.signed_agreements
FOR EACH ROW EXECUTE FUNCTION public.deal_value_from_agreement();

-- Trigger C: proposals sent
CREATE OR REPLACE FUNCTION public.deal_value_from_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE d uuid; v integer; t jsonb;
BEGIN
  BEGIN
    IF NEW.sent_at IS NULL OR jsonb_typeof(NEW.tiers) <> 'array' OR jsonb_array_length(NEW.tiers) = 0 THEN RETURN NEW; END IF;
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
END $$;

DROP TRIGGER IF EXISTS deal_value_from_proposal ON public.proposals;
CREATE TRIGGER deal_value_from_proposal AFTER INSERT OR UPDATE OF sent_at ON public.proposals
FOR EACH ROW WHEN (NEW.sent_at IS NOT NULL) EXECUTE FUNCTION public.deal_value_from_proposal();

REVOKE EXECUTE ON FUNCTION public.deal_value_from_invoice(), public.deal_value_from_agreement(), public.deal_value_from_proposal(), public.resolve_proposal_deal(uuid, text) FROM PUBLIC, anon, authenticated;
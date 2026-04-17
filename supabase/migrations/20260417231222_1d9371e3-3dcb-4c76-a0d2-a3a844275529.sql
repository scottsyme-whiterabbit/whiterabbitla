-- Create email suppression list table
CREATE TABLE public.email_suppression_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  source_campaign_category TEXT,
  notes TEXT,
  suppressed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validate reason values via trigger (not CHECK, per project rules)
CREATE OR REPLACE FUNCTION public.validate_suppression_reason()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reason NOT IN ('hard_bounce', 'soft_bounce', 'role_based', 'manual_suppression', 'unsubscribe', 'complaint', 'invalid_domain', 'spam_trap') THEN
    RAISE EXCEPTION 'Invalid suppression reason: %', NEW.reason;
  END IF;
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_suppression_reason_trigger
BEFORE INSERT OR UPDATE ON public.email_suppression_list
FOR EACH ROW
EXECUTE FUNCTION public.validate_suppression_reason();

-- Index for fast lookups
CREATE INDEX idx_email_suppression_email ON public.email_suppression_list(email);
CREATE INDEX idx_email_suppression_reason ON public.email_suppression_list(reason);

-- Enable RLS
ALTER TABLE public.email_suppression_list ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role only suppression"
ON public.email_suppression_list
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Seed the 15 known bounced wedding_planner addresses
INSERT INTO public.email_suppression_list (email, reason, source_campaign_category, notes) VALUES
('jenna@epicevents.world', 'hard_bounce', 'wedding_planner', 'Epic Events by Booth - 32 events before bounce, mailbox dead'),
('lauren@chasentherain.com', 'hard_bounce', 'wedding_planner', 'Chasen the Rain - mailbox full or abandoned'),
('natalie@nataliesofer.com', 'hard_bounce', 'wedding_planner', 'Natalie Sofer Weddings - personal domain inactive'),
('jeff@disneylandweddings.com', 'hard_bounce', 'wedding_planner', 'Disneyland - corporate hard-block'),
('samantha@lovebysamantha.com', 'hard_bounce', 'wedding_planner', 'Love by Samantha - dead mailbox'),
('rebeccab@thefivestarwedding.com', 'hard_bounce', 'wedding_planner', 'Five Star Wedding - invalid'),
('slonne@2friendsevents.com', 'hard_bounce', 'wedding_planner', '2 Friends Events - mailbox does not exist'),
('info@leveleventsoc.com', 'role_based', 'wedding_planner', 'Level Events - role-based address'),
('amanda@ueeventplanner.com', 'hard_bounce', 'wedding_planner', 'Unforgettable Events - dead'),
('rachel@thegatheringseason.com', 'hard_bounce', 'wedding_planner', 'The Gathering Season - dead'),
('lea.nguyen@tracytaylorward.com', 'hard_bounce', 'wedding_planner', 'Tracy Taylor Ward Design - ex-employee'),
('alexa@jovemeyer.com', 'hard_bounce', 'wedding_planner', 'Jove Meyer - dead'),
('aimeemonihan@wedgewoodweddings.com', 'hard_bounce', 'wedding_planner', 'Wedgewood Weddings - corporate chain strict security'),
('savannah@feastonthis.com', 'hard_bounce', 'wedding_planner', 'Feast on This - dead'),
('shannelresto@wedgewoodweddings.com', 'hard_bounce', 'wedding_planner', 'Wedgewood Weddings - corporate chain strict security')
ON CONFLICT (email) DO NOTHING;

-- Backfill from existing email_bounces (hard bounces only)
INSERT INTO public.email_suppression_list (email, reason, source_campaign_category, notes)
SELECT DISTINCT lower(trim(email)), 'hard_bounce', 'backfill', 'Auto-imported from email_bounces table'
FROM public.email_bounces
WHERE bounce_type IN ('hard', 'hard_bounce', 'permanent', 'Permanent')
  AND email IS NOT NULL
  AND email != ''
ON CONFLICT (email) DO NOTHING;

-- Backfill from unsubscribed newsletter_contacts
INSERT INTO public.email_suppression_list (email, reason, source_campaign_category, notes)
SELECT DISTINCT lower(trim(email)), 'unsubscribe', 'backfill', 'Auto-imported from newsletter_contacts unsubscribed'
FROM public.newsletter_contacts
WHERE subscribed = false
  AND email IS NOT NULL
  AND email != ''
ON CONFLICT (email) DO NOTHING;
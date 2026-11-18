ALTER TABLE public.find_the_lady_credits DROP CONSTRAINT find_the_lady_credits_code_format;
ALTER TABLE public.find_the_lady_credits ADD CONSTRAINT find_the_lady_credits_code_format
  CHECK (code ~ '^(WR-LADY-[A-Z0-9]{4}|WR500-[A-Z0-9]{4}|LIGHTS-UP-[0-9]{4})$');
ALTER TABLE public.find_the_lady_credits ADD COLUMN IF NOT EXISTS event_timing text;
ALTER TABLE public.find_the_lady_credits ADD CONSTRAINT find_the_lady_credits_event_timing_check
  CHECK (event_timing IS NULL OR event_timing IN ('this_month','next_3_months','later_this_year','still_deciding'));
ALTER TABLE public.find_the_lady_credits ADD COLUMN IF NOT EXISTS inquiry_id uuid;
ALTER TABLE public.find_the_lady_credits ADD COLUMN IF NOT EXISTS inquiry_linked_at timestamptz;
ALTER TABLE public.find_the_lady_credits ADD COLUMN IF NOT EXISTS moved_to_pipeline_at timestamptz;
COMMENT ON COLUMN public.find_the_lady_credits.event_type IS 'Occasion chosen in the pop-up: wedding, corporate, private_party, holiday_party or other (older rows may hold the retired Find the Lady values).';
COMMENT ON COLUMN public.find_the_lady_credits.drawing_entry IS 'True only when the guest found the Queen; free alternate entries live in find_the_queen_alt_entries.';

-- Free alternate entries (no purchase, no game), added by Scott from the CRM.
CREATE TABLE public.find_the_queen_alt_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter text NOT NULL CHECK (quarter ~ '^[0-9]{4} Q[1-4]$'),
  first_name text NOT NULL,
  email text NOT NULL,
  received_on date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX find_the_queen_alt_entries_one_per_quarter ON public.find_the_queen_alt_entries (quarter, lower(email));
GRANT ALL ON public.find_the_queen_alt_entries TO service_role;
ALTER TABLE public.find_the_queen_alt_entries ENABLE ROW LEVEL SECURITY;

-- One winner per quarter, picked at random from the CRM and kept as the record.
CREATE TABLE public.find_the_queen_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter text NOT NULL UNIQUE CHECK (quarter ~ '^[0-9]{4} Q[1-4]$'),
  winner_kind text NOT NULL CHECK (winner_kind IN ('claim','alternate')),
  winner_credit_id uuid REFERENCES public.find_the_lady_credits(id) ON DELETE SET NULL,
  winner_alt_entry_id uuid REFERENCES public.find_the_queen_alt_entries(id) ON DELETE SET NULL,
  winner_name text NOT NULL,
  winner_email text NOT NULL,
  entry_count integer NOT NULL CHECK (entry_count > 0),
  picked_at timestamptz NOT NULL DEFAULT now(),
  picked_by text
);
GRANT ALL ON public.find_the_queen_drawings TO service_role;
ALTER TABLE public.find_the_queen_drawings ENABLE ROW LEVEL SECURITY;

-- Anonymous pop-up counters for the CRM. No personal details, insert only.
CREATE TABLE public.find_the_queen_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL CHECK (event IN ('view','play','found','answered','reserve_click')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX find_the_queen_events_recent ON public.find_the_queen_events (created_at, event);
GRANT INSERT ON public.find_the_queen_events TO anon, authenticated;
GRANT ALL ON public.find_the_queen_events TO service_role;
ALTER TABLE public.find_the_queen_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can record pop-up steps" ON public.find_the_queen_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (event IN ('view','play','found','answered','reserve_click'));

-- Daily report "waiting on your reply" list never includes pop-up claims.
CREATE OR REPLACE FUNCTION public.deals_awaiting_reply()
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with latest as (
    select m.deal_id,
           max(m.sent_at) filter (where m.direction = 'inbound')  as last_in,
           max(m.sent_at) filter (where m.direction = 'outbound') as last_out
    from deal_email_messages m
    group by m.deal_id
  )
  select coalesce(jsonb_agg(x order by x->>'waiting_since' asc), '[]'::jsonb)
  from (
    select jsonb_build_object(
             'name',    coalesce(d.contact_name, d.contact_email),
             'email',   d.contact_email,
             'stage',   d.stage,
             'event_date', d.event_date,
             'waiting_since', to_char(l.last_in at time zone 'America/Los_Angeles','Mon DD'),
             'hours_waiting', round(extract(epoch from (now() - l.last_in))/3600)
           ) as x
    from latest l
    join deals d on d.id = l.deal_id
    where l.last_in is not null
      and (l.last_out is null or l.last_out < l.last_in)
      and l.last_in > now() - interval '30 days'
      and l.last_in < now() - interval '20 hours'
      and d.stage not in ('lost','completed')
      and coalesce(d.source, '') <> 'find-the-queen-popup'
      and lower(coalesce(d.contact_email,'')) <> 'scott.syme@whiterabbitla.com'
  ) s;
$function$;
REVOKE EXECUTE ON FUNCTION public.deals_awaiting_reply() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deals_awaiting_reply() TO authenticated, service_role;
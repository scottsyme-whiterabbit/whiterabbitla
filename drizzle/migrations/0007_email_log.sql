CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient text NOT NULL,
  subject text,
  email_type text NOT NULL DEFAULT 'other',
  label text,
  provider text NOT NULL DEFAULT 'resend',
  status text NOT NULL DEFAULT 'sent',
  block_reason text,
  delivery_status text,
  provider_message_id text,
  deal_id uuid,
  source text NOT NULL DEFAULT 'live',
  backfilled boolean NOT NULL DEFAULT false,
  approximate_time boolean NOT NULL DEFAULT false,
  dedupe_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX email_log_recipient_idx ON public.email_log (lower(recipient), sent_at DESC);
CREATE INDEX email_log_deal_idx ON public.email_log (deal_id, sent_at DESC);
CREATE INDEX email_log_provider_msg_idx ON public.email_log (provider_message_id);

-- Backfill: Gmail messages Scott or the system sent, from the CRM mirror.
INSERT INTO public.email_log (sent_at, recipient, subject, email_type, provider, deal_id, source, backfilled, provider_message_id, dedupe_key)
SELECT m.sent_at, lower(coalesce(m.to_email, d.contact_email)), m.subject,
       coalesce(a.kind, 'crm_gmail'), 'gmail', m.deal_id, 'deal_email_messages', true, m.gmail_message_id, 'gmail:' || m.gmail_message_id
FROM public.deal_email_messages m
LEFT JOIN public.deals d ON d.id = m.deal_id
LEFT JOIN public.automated_gmail_sends a ON a.gmail_message_id = m.gmail_message_id
WHERE m.direction = 'outbound' AND coalesce(m.to_email, d.contact_email) IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, email_type, provider, source, backfilled, provider_message_id, dedupe_key)
SELECT a.created_at, lower(ci.email), a.kind, 'gmail', 'automated_gmail_sends', true, a.gmail_message_id, 'gmail:' || a.gmail_message_id
FROM public.automated_gmail_sends a JOIN public.contact_inquiries ci ON ci.id = a.inquiry_id
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, subject, email_type, provider, deal_id, source, backfilled, dedupe_key)
SELECT al.occurred_at, lower(al.contact_email), al.subject, 'crm_gmail', 'gmail', al.deal_id, 'action_log', true, 'action:' || al.id
FROM public.action_log al
WHERE al.action_type = 'email_sent_gmail' AND al.contact_email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.email_log e WHERE e.provider = 'gmail'
                  AND lower(e.recipient) = lower(al.contact_email)
                  AND abs(extract(epoch FROM e.sent_at - al.occurred_at)) < 120)
  AND al.id = (SELECT min(al2.id::text)::uuid FROM public.action_log al2 WHERE al2.action_type = al.action_type
               AND lower(al2.contact_email) = lower(al.contact_email) AND al2.occurred_at = al.occurred_at)
ON CONFLICT (dedupe_key) DO NOTHING;

-- Post-show sequence (contact_id is the deal id for post-show rows).
INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, status, source, backfilled, dedupe_key)
SELECT l.sent_at, lower(d.contact_email),
       CASE l.campaign_id WHEN 'post-show-0' THEN 'post_show_thank_you' WHEN 'post-show-1' THEN 'post_show_referral' ELSE 'post_show_holiday' END,
       'resend', d.id, CASE WHEN l.status = 'sent' THEN 'sent' ELSE l.status END, 'newsletter_send_log', true, 'nsl:' || l.id
FROM public.newsletter_send_log l JOIN public.deals d ON d.id = l.contact_id
WHERE l.campaign_id LIKE 'post-show-%'
ON CONFLICT (dedupe_key) DO NOTHING;

-- Invoice engine counters. Only the latest send of each kind has an exact time.
INSERT INTO public.email_log (sent_at, recipient, subject, email_type, provider, deal_id, source, backfilled, approximate_time, dedupe_key, metadata)
SELECT i.last_anticipation_at, lower(i.client_email), 'Two weeks to go', 'two_weeks_out', 'resend', i.deal_id, 'event_invoices', true, false,
       'inv:' || i.id || ':ant:1', jsonb_build_object('invoice_id', i.id, 'invoice_status', i.status)
FROM public.event_invoices i WHERE i.anticipation_sent = 1 AND i.last_anticipation_at IS NOT NULL AND i.client_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, subject, email_type, provider, deal_id, source, backfilled, approximate_time, dedupe_key, metadata)
SELECT i.last_anticipation_at, lower(i.client_email), 'See you tomorrow', 'see_you_tomorrow', 'resend', i.deal_id, 'event_invoices', true, false,
       'inv:' || i.id || ':ant:2', jsonb_build_object('invoice_id', i.id, 'invoice_status', i.status)
FROM public.event_invoices i WHERE i.anticipation_sent >= 2 AND i.last_anticipation_at IS NOT NULL AND i.client_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, subject, email_type, provider, deal_id, source, backfilled, approximate_time, dedupe_key, metadata)
SELECT ((i.event_date - 14)::timestamp + interval '16 hours') AT TIME ZONE 'UTC', lower(i.client_email), 'Two weeks to go', 'two_weeks_out', 'resend', i.deal_id, 'event_invoices', true, true,
       'inv:' || i.id || ':ant:1', jsonb_build_object('invoice_id', i.id, 'invoice_status', i.status)
FROM public.event_invoices i WHERE i.anticipation_sent = 3 AND i.event_date IS NOT NULL AND i.client_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, source, backfilled, approximate_time, dedupe_key, metadata)
SELECT CASE WHEN s.n = i.balance_reminders_sent THEN i.last_balance_reminder_at
            ELSE ((i.event_date - (ARRAY[7,2,0])[s.n])::timestamp + interval '16 hours') AT TIME ZONE 'UTC' END,
       lower(i.client_email), 'balance_reminder_' || (ARRAY[7,2,0])[s.n] || 'd', 'resend', i.deal_id, 'event_invoices', true,
       s.n <> i.balance_reminders_sent, 'inv:' || i.id || ':bal:' || s.n, jsonb_build_object('invoice_id', i.id, 'invoice_status', i.status)
FROM public.event_invoices i CROSS JOIN LATERAL generate_series(1, least(i.balance_reminders_sent, 3)) s(n)
WHERE i.balance_reminders_sent > 0 AND i.client_email IS NOT NULL AND i.last_balance_reminder_at IS NOT NULL AND i.event_date IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, source, backfilled, approximate_time, dedupe_key, metadata)
SELECT CASE WHEN s.n = i.initial_reminders_sent THEN i.last_reminder_at
            ELSE coalesce(i.sent_at, i.created_at) + (s.n || ' days')::interval END,
       lower(i.client_email), 'invoice_reminder_' || s.n, 'resend', i.deal_id, 'event_invoices', true,
       s.n <> i.initial_reminders_sent, 'inv:' || i.id || ':rem:' || s.n, jsonb_build_object('invoice_id', i.id, 'invoice_status', i.status)
FROM public.event_invoices i CROSS JOIN LATERAL generate_series(1, least(i.initial_reminders_sent, 4)) s(n)
WHERE i.initial_reminders_sent > 0 AND i.client_email IS NOT NULL AND i.last_reminder_at IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, source, backfilled, dedupe_key, metadata)
SELECT i.deposit_paid_at, lower(i.client_email), 'deposit_receipt', 'resend', i.deal_id, 'event_invoices', true, 'inv:' || i.id || ':dep', jsonb_build_object('invoice_id', i.id)
FROM public.event_invoices i WHERE i.deposit_paid_at IS NOT NULL AND i.stripe_session_id IS NOT NULL AND i.client_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, source, backfilled, dedupe_key, metadata)
SELECT i.paid_in_full_at, lower(i.client_email), 'paid_in_full_receipt', 'resend', i.deal_id, 'event_invoices', true, 'inv:' || i.id || ':full', jsonb_build_object('invoice_id', i.id)
FROM public.event_invoices i WHERE i.paid_in_full_at IS NOT NULL AND i.stripe_session_id IS NOT NULL AND i.client_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

-- Signing confirmation with agreement and reservation invoice.
INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, source, backfilled, dedupe_key, metadata)
SELECT a.invoice_sent_at, lower(a.client_email), 'agreement_invoice', 'resend', a.deal_id, 'signed_agreements', true, 'agr:' || a.id, jsonb_build_object('agreement_id', a.id)
FROM public.signed_agreements a WHERE a.invoice_sent_at IS NOT NULL AND a.client_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;

-- Proposal follow-ups: only the latest step has an exact time.
INSERT INTO public.email_log (sent_at, recipient, email_type, provider, deal_id, source, backfilled, approximate_time, dedupe_key, metadata)
SELECT CASE WHEN s.n = p.followup_step THEN p.last_followup_at ELSE p.sent_at + ((ARRAY[2,5,7])[s.n] || ' days')::interval END,
       lower(p.recipient_email), 'proposal_followup_' || s.n, 'resend', p.deal_id, 'proposals', true, s.n <> p.followup_step,
       'prop:' || p.id || ':fu:' || s.n, jsonb_build_object('proposal_id', p.id)
FROM public.proposals p CROSS JOIN LATERAL generate_series(1, least(p.followup_step, 3)) s(n)
WHERE p.followup_step > 0 AND p.sent_at IS NOT NULL AND p.last_followup_at IS NOT NULL AND p.recipient_email IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;
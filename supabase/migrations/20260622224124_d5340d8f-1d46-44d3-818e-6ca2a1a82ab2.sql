
CREATE TABLE public.email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email text NOT NULL,
  contact_name text,
  company text,
  vertical text,
  source text,
  deal_id uuid,
  gmail_thread_id text,
  in_reply_to text,
  variant_index integer NOT NULL DEFAULT 0,
  angle text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  user_hint text,
  ai_meta jsonb DEFAULT '{}'::jsonb,
  generation_id uuid,
  sent_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  dismissed_at timestamptz
);

CREATE INDEX idx_email_drafts_status ON public.email_drafts(status, created_at DESC);
CREATE INDEX idx_email_drafts_contact ON public.email_drafts(contact_email);
CREATE INDEX idx_email_drafts_generation ON public.email_drafts(generation_id);

GRANT ALL ON public.email_drafts TO service_role;

ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_email_drafts"
  ON public.email_drafts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

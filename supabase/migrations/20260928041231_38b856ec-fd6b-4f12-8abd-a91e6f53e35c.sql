CREATE TABLE public.admin_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_login_codes TO service_role;
ALTER TABLE public.admin_login_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX admin_login_codes_email_created_idx ON public.admin_login_codes (email, created_at DESC);
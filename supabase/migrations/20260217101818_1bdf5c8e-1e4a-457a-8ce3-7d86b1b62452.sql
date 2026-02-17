
-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_name TEXT NOT NULL,
  referrer_email TEXT NOT NULL,
  referrer_company TEXT,
  referred_name TEXT NOT NULL,
  referred_email TEXT,
  referred_event_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_redeemed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Allow anonymous referral submissions"
ON public.referrals
FOR INSERT
WITH CHECK (true);

-- No public reads
CREATE POLICY "No public reads on referrals"
ON public.referrals
FOR SELECT
USING (false);

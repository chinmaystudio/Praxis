CREATE TABLE public.member_email_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX member_email_challenges_leader_email_idx
  ON public.member_email_challenges (leader_user_id, email, created_at DESC);
ALTER TABLE public.member_email_challenges ENABLE ROW LEVEL SECURITY;

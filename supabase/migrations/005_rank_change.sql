-- Migration 005: rank change tracking
-- Adds previous_rank to quiniela_members so the server-side trigger (and future
-- Edge Functions) can persist the last-seen rank alongside the current one.
-- The frontend notification uses localStorage for instant UX; this column is
-- available for server-side calculations and auditing.

ALTER TABLE quiniela_members
  ADD COLUMN IF NOT EXISTS previous_rank integer;

-- Allow each member to update their own previous_rank (used by the client after
-- dismissing the rank-change notification overlay).
-- Wrapped in DO block to skip safely if the policy already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'quiniela_members'
      AND policyname = 'members_update_own_previous_rank'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY members_update_own_previous_rank
        ON quiniela_members
        FOR UPDATE
        USING     (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END
$$;

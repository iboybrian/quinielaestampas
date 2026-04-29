-- ============================================================
-- WC 2026 — Security Hardening
-- Run AFTER migrations 001, 002, 003
-- ============================================================

-- ── 1. Global admin flag on profiles ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_global_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- After running this migration, set yourself as admin:
-- UPDATE public.profiles SET is_global_admin = TRUE WHERE email = 'nicoleiboy98@gmail.com';


-- ── 2. Matches: restrict UPDATE/DELETE to global admins ───────
-- INSERT stays open to any auth user (required for useFixtures() upsert from browser).
-- UPDATE/DELETE restricted so no regular user can corrupt match scores via API.

DROP POLICY IF EXISTS "matches_insert_admin"         ON public.matches;
DROP POLICY IF EXISTS "matches_update_admin"         ON public.matches;
DROP POLICY IF EXISTS "matches_insert_auth"          ON public.matches;
DROP POLICY IF EXISTS "matches_update_global_admin"  ON public.matches;
DROP POLICY IF EXISTS "matches_delete_global_admin"  ON public.matches;

CREATE POLICY "matches_insert_auth" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "matches_update_global_admin" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_global_admin = TRUE
    )
  );

CREATE POLICY "matches_delete_global_admin" ON public.matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_global_admin = TRUE
    )
  );


-- ── 3. Quinielas: explicit DELETE protection ──────────────────
-- Only the creator or a global admin can delete a quiniela.

DROP POLICY IF EXISTS "quinielas_delete_creator" ON public.quinielas;

CREATE POLICY "quinielas_delete_creator" ON public.quinielas
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_global_admin = TRUE
    )
  );


-- ── 4. user_stickers: fix overly-permissive SELECT ────────────
-- The old "stickers_select_others_for_matching" used USING (true),
-- which OR-ed with stickers_select_own → everyone saw all stickers.
-- New single policy: own rows always visible; others visible only if
-- they have duplicates (quantity >= 2) or marked as needed.

DROP POLICY IF EXISTS "stickers_select_own"                 ON public.user_stickers;
DROP POLICY IF EXISTS "stickers_select_others_for_matching" ON public.user_stickers;
DROP POLICY IF EXISTS "stickers_select"                     ON public.user_stickers;

CREATE POLICY "stickers_select" ON public.user_stickers
  FOR SELECT USING (
    auth.uid() = user_id
    OR quantity >= 2
    OR is_needed = TRUE
  );


-- ── 5. Predictions: DB-level deadline enforcement ─────────────
-- Complements client-side masking in maskPredictions().
-- Own predictions always visible; others only after match deadline.

DROP POLICY IF EXISTS "predictions_select_group"         ON public.predictions;
DROP POLICY IF EXISTS "predictions_select_with_deadline" ON public.predictions;

CREATE POLICY "predictions_select_with_deadline" ON public.predictions
  FOR SELECT USING (
    quiniela_id IN (
      SELECT quiniela_id FROM public.quiniela_members WHERE user_id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.matches m
        JOIN public.quinielas q ON q.id = predictions.quiniela_id
        WHERE m.id = predictions.match_id
          AND (
            m.status IN ('finished', 'live')
            OR m.starts_at <= (NOW() - COALESCE(q.prediction_deadline_minutes, 10) * INTERVAL '1 minute')
          )
      )
    )
  );


-- ── 6. Predictions: allow users to delete their own ──────────

DROP POLICY IF EXISTS "predictions_delete_own" ON public.predictions;

CREATE POLICY "predictions_delete_own" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);

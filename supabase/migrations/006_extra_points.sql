-- 006_extra_points.sql
-- Extra points predictions for knockout stage (QF, SF, 3rd Place, Final)
-- Adds: quinielas.extra_points_enabled, predictions/matches.first_scorer + first_goal_half
-- Extends score_predictions() trigger to award +1 per correct field

ALTER TABLE public.quinielas
  ADD COLUMN IF NOT EXISTS extra_points_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS first_scorer TEXT,
  ADD COLUMN IF NOT EXISTS first_goal_half TEXT;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS first_scorer TEXT,
  ADD COLUMN IF NOT EXISTS first_goal_half TEXT;

ALTER TABLE public.predictions
  ADD CONSTRAINT predictions_first_scorer_check
    CHECK (first_scorer IS NULL OR first_scorer IN ('home', 'away', 'none'));

ALTER TABLE public.predictions
  ADD CONSTRAINT predictions_first_goal_half_check
    CHECK (first_goal_half IS NULL OR first_goal_half IN ('first', 'second'));

ALTER TABLE public.matches
  ADD CONSTRAINT matches_first_scorer_check
    CHECK (first_scorer IS NULL OR first_scorer IN ('home', 'away', 'none'));

ALTER TABLE public.matches
  ADD CONSTRAINT matches_first_goal_half_check
    CHECK (first_goal_half IS NULL OR first_goal_half IN ('first', 'second'));

-- Replace trigger function — adds extra pts logic, also re-fires on first_scorer/half changes
CREATE OR REPLACE FUNCTION public.score_predictions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pred         RECORD;
  pts          INTEGER;
  extra_pts    INTEGER;
  pred_diff    INTEGER;
  actual_diff  INTEGER;
BEGIN
  IF (NEW.status = 'finished' AND OLD.status <> 'finished') OR
     (NEW.status = 'finished' AND (
       OLD.first_scorer IS DISTINCT FROM NEW.first_scorer OR
       OLD.first_goal_half IS DISTINCT FROM NEW.first_goal_half
     )) THEN

    FOR pred IN
      SELECT p.*, q.extra_points_enabled
      FROM public.predictions p
      JOIN public.quinielas q ON q.id = p.quiniela_id
      WHERE p.match_id = NEW.id
    LOOP
      -- Base score (exact / goal diff / winner / miss)
      actual_diff := NEW.home_score - NEW.away_score;
      pred_diff   := pred.home_score - pred.away_score;

      IF pred.home_score = NEW.home_score AND pred.away_score = NEW.away_score THEN
        pts := 5;
      ELSIF pred_diff = actual_diff THEN
        pts := 3;
      ELSIF SIGN(pred_diff) = SIGN(actual_diff) THEN
        pts := 2;
      ELSE
        pts := 0;
      END IF;

      -- Extra points (+1 first scorer, +1 first half — only for enabled quinielas)
      extra_pts := 0;
      IF pred.extra_points_enabled AND NEW.first_scorer IS NOT NULL THEN
        IF pred.first_scorer = NEW.first_scorer THEN
          extra_pts := extra_pts + 1;
        END IF;
        IF NEW.first_scorer <> 'none' AND NEW.first_goal_half IS NOT NULL
           AND pred.first_goal_half = NEW.first_goal_half THEN
          extra_pts := extra_pts + 1;
        END IF;
      END IF;

      UPDATE public.predictions
      SET points_earned = pts + extra_pts
      WHERE id = pred.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_finish ON public.matches;
CREATE TRIGGER on_match_finish
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.score_predictions();

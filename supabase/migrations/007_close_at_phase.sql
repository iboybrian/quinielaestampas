-- Migration 007: close_at_phase
-- Lets the admin declare which knockout phase determines the quiniela winner.
-- null = runs to completion without automatic winner announcement
-- 'r16' | 'qf' | 'sf' | 'final' = winner determined once all matches in that phase finish

ALTER TABLE quinielas
  ADD COLUMN IF NOT EXISTS close_at_phase TEXT
    CHECK (close_at_phase IN ('r16', 'qf', 'sf', 'final'));

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'quinielas' AND column_name = 'close_at_phase';

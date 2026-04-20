-- Add admin role and payment tracking to members
ALTER TABLE quiniela_members
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  ADD COLUMN IF NOT EXISTS has_paid BOOLEAN NOT NULL DEFAULT FALSE;

-- Add admin-configurable fields to quinielas
ALTER TABLE quinielas
  ADD COLUMN IF NOT EXISTS prediction_deadline_minutes INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS entry_fee NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS participant_limit INTEGER,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS info_contact TEXT;

-- Retroactively assign admin role to creators
UPDATE quiniela_members qm
SET role = 'admin'
FROM quinielas q
WHERE qm.quiniela_id = q.id
  AND qm.user_id = q.created_by;

-- Allow admins to update quiniela settings
CREATE POLICY IF NOT EXISTS "Admins can update their quiniela"
  ON quinielas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quiniela_members
      WHERE quiniela_id = quinielas.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Allow admins to update member payment status
CREATE POLICY IF NOT EXISTS "Admins can update member payment"
  ON quiniela_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quiniela_members AS admin_check
      WHERE admin_check.quiniela_id = quiniela_members.quiniela_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
  );

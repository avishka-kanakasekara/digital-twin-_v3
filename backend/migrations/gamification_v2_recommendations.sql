-- =============================================================
-- Gamification v2 — Recommendation & AI Generation Support
-- Run in: Supabase SQL Editor
-- =============================================================

-- Add optional columns to challenges for better recommendation matching
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS target_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS learning_objective TEXT;

-- Index for faster recommendation queries
CREATE INDEX IF NOT EXISTS idx_challenges_active_category ON challenges(is_active, category);
CREATE INDEX IF NOT EXISTS idx_submissions_employee_step ON submissions(employee_id, step_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON evaluations(submission_id);

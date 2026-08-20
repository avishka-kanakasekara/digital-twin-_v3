-- =============================================================
-- Gamification Step Evaluation — DB Migration
-- Run in: https://supabase.com/dashboard/project/khrchkotgqbpzhurmbju/sql/new
-- =============================================================

CREATE TABLE IF NOT EXISTS challenge_steps (
  id                TEXT PRIMARY KEY,
  challenge_id      TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  step_order        INT  NOT NULL,
  title             TEXT NOT NULL,
  instructions      TEXT NOT NULL,
  submission_type   TEXT NOT NULL DEFAULT 'text',
  evaluation_rubric TEXT NOT NULL,
  xp_value          INT  NOT NULL DEFAULT 100,
  reference_url     TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id              TEXT PRIMARY KEY,
  employee_id     TEXT NOT NULL REFERENCES employees(id),
  challenge_id    TEXT NOT NULL REFERENCES challenges(id),
  step_id         TEXT NOT NULL REFERENCES challenge_steps(id),
  submission_type TEXT NOT NULL,
  content         TEXT NOT NULL,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS evaluations (
  id                  TEXT PRIMARY KEY,
  submission_id       TEXT NOT NULL REFERENCES submissions(id),
  ai_score            INT  NOT NULL,
  pass                BOOLEAN NOT NULL,
  feedback            TEXT NOT NULL,
  xp_awarded          INT  NOT NULL DEFAULT 0,
  evaluated_at        TIMESTAMPTZ DEFAULT now(),
  raw_model_response  TEXT
);

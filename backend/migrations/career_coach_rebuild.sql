ALTER TABLE career_goals
    ADD COLUMN IF NOT EXISTS visible_to_manager BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ai_analysis_json JSONB,
    ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ;

ALTER TABLE career_roadmap_steps
    ADD COLUMN IF NOT EXISTS step_type TEXT DEFAULT 'learning',
    ADD COLUMN IF NOT EXISTS related_skill_gap_id TEXT,
    ADD COLUMN IF NOT EXISTS requires_evidence BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS evidence_type TEXT,
    ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS due_window TEXT,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS readiness_components (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    goal_id         TEXT NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    score           INTEGER NOT NULL DEFAULT 0,
    weight          NUMERIC(5,2) NOT NULL DEFAULT 0,
    explanation     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_gaps (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    goal_id           TEXT NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
    skill             TEXT NOT NULL,
    current_level     INTEGER DEFAULT 0,
    target_level      INTEGER DEFAULT 0,
    gap               INTEGER DEFAULT 0,
    recommended_path  TEXT,
    estimated_hours   INTEGER DEFAULT 0,
    status            TEXT DEFAULT 'not_started',
    path_type         TEXT DEFAULT 'course',
    priority          TEXT DEFAULT 'Medium',
    category          TEXT,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_submissions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    skill_gap_id    TEXT REFERENCES skill_gaps(id) ON DELETE SET NULL,
    roadmap_step_id TEXT REFERENCES career_roadmap_steps(id) ON DELETE SET NULL,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evidence_type   TEXT NOT NULL,
    file_ref        TEXT,
    description     TEXT,
    status          TEXT DEFAULT 'submitted',
    verified_by     TEXT,
    verified_at     TIMESTAMPTZ,
    xp_awarded      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS internal_roles (
    role_id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title            TEXT NOT NULL,
    department       TEXT,
    required_skills  JSONB DEFAULT '[]'::jsonb,
    is_open          BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_gap_matches (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id           TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    goal_id               TEXT NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
    role_id               TEXT NOT NULL REFERENCES internal_roles(role_id) ON DELETE CASCADE,
    overall_fit_pct       INTEGER DEFAULT 0,
    missing_requirements  JSONB DEFAULT '[]'::jsonb,
    computed_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentor_matches (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id         TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    mentor_employee_id  TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shared_target_role  TEXT,
    shared_skill        TEXT,
    match_reason        TEXT,
    intro_requested     BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xp_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    source          TEXT NOT NULL,
    amount          INTEGER NOT NULL DEFAULT 0,
    timestamp       TIMESTAMPTZ DEFAULT now(),
    reference_type  TEXT,
    reference_id    TEXT
);

CREATE TABLE IF NOT EXISTS stall_flags (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id       TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    goal_id           TEXT NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
    last_progress_at  TIMESTAMPTZ NOT NULL,
    flagged_at        TIMESTAMPTZ DEFAULT now(),
    resolved          BOOLEAN DEFAULT false
);

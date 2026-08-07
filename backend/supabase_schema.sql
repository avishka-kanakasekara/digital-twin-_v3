-- ════════════════════════════════════════════════════════════════
-- Digital Twin v3 — Supabase Schema
-- Run this in Supabase SQL Editor to create all tables.
-- ════════════════════════════════════════════════════════════════

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ──────────────────────────────────────────────────────────────
-- 1. EMPLOYEES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_code   TEXT UNIQUE NOT NULL,
    full_name       TEXT NOT NULL,
    initials        TEXT,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT,

    department      TEXT,
    role            TEXT,
    team            TEXT,
    manager_id      TEXT,
    manager_name    TEXT,
    location        TEXT,
    timezone_str    TEXT,
    phone           TEXT,

    education       JSONB DEFAULT '[]'::jsonb,
    languages       JSONB DEFAULT '[]'::jsonb,

    biography       TEXT,
    headline        TEXT,
    avatar_url      TEXT,

    years_experience    INTEGER,
    years_in_company    INTEGER,
    employment_type     TEXT DEFAULT 'Full-Time',
    employment_status   TEXT DEFAULT 'Active',

    -- Twin metadata
    twin_health             INTEGER DEFAULT 0,
    ai_confidence           INTEGER DEFAULT 0,
    profile_completeness    INTEGER DEFAULT 0,

    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);


-- ──────────────────────────────────────────────────────────────
-- 2. SKILLS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT,
    sub_category    TEXT,
    icon            TEXT,

    proficiency     INTEGER DEFAULT 0,
    target_level    INTEGER DEFAULT 0,
    years_experience NUMERIC(4,1),
    trend           TEXT DEFAULT 'stable',

    ai_confidence       INTEGER,
    verified            BOOLEAN DEFAULT false,
    source              TEXT,
    ai_recommendation   TEXT,

    last_updated    TIMESTAMPTZ DEFAULT now(),

    UNIQUE(employee_id, name)
);

CREATE INDEX IF NOT EXISTS idx_skills_employee ON skills(employee_id);


-- ──────────────────────────────────────────────────────────────
-- 3. GAMIFICATION PROFILES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_profiles (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    level           INTEGER DEFAULT 1,
    xp              INTEGER DEFAULT 0,
    next_level_xp   INTEGER DEFAULT 1000,
    total_xp_earned INTEGER DEFAULT 0,
    company_rank    INTEGER,
    department_rank INTEGER,
    streak_days     INTEGER DEFAULT 0,
    longest_streak  INTEGER DEFAULT 0,
    last_activity   TIMESTAMPTZ,
    title           TEXT DEFAULT 'Newcomer',
    updated_at      TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 4. XP TRANSACTIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_transactions (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL,
    reason      TEXT,
    category    TEXT,
    emoji       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_employee ON xp_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_xp_created ON xp_transactions(created_at);


-- ──────────────────────────────────────────────────────────────
-- 5. ACHIEVEMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name            TEXT NOT NULL,
    description     TEXT,
    emoji           TEXT,
    xp_value        INTEGER DEFAULT 0,
    rarity          TEXT,
    criteria_type   TEXT,
    criteria_value  JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 6. EMPLOYEE ACHIEVEMENTS (junction)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_achievements (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    achievement_id  TEXT NOT NULL REFERENCES achievements(id),
    unlocked_at     TIMESTAMPTZ DEFAULT now(),

    UNIQUE(employee_id, achievement_id)
);


-- ──────────────────────────────────────────────────────────────
-- 7. CHALLENGES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title       TEXT NOT NULL,
    description TEXT,
    xp_reward   INTEGER DEFAULT 0,
    bonus_badge TEXT,
    difficulty  TEXT,
    type        TEXT,
    category    TEXT,
    color       TEXT,
    start_date  TIMESTAMPTZ,
    end_date    TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 8. CHALLENGE PROGRESS (junction)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_progress (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL REFERENCES challenges(id),
    progress    INTEGER DEFAULT 0,
    completed   BOOLEAN DEFAULT false,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,

    UNIQUE(employee_id, challenge_id)
);


-- ──────────────────────────────────────────────────────────────
-- 9. LEARNING PATHS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_paths (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    progress        INTEGER DEFAULT 0,
    total_courses   INTEGER DEFAULT 0,
    completed_courses INTEGER DEFAULT 0,
    estimated_hours NUMERIC(6,1),
    due_date        TEXT,
    tags            JSONB DEFAULT '[]'::jsonb,
    color           TEXT,
    is_ai_recommended BOOLEAN DEFAULT false,
    platform        TEXT,
    instructor      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_employee ON learning_paths(employee_id);


-- ──────────────────────────────────────────────────────────────
-- 10. COURSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title       TEXT NOT NULL,
    provider    TEXT,
    hours       NUMERIC(6,1),
    level       TEXT,
    rating      NUMERIC(3,2),
    enrolled_count INTEGER DEFAULT 0,
    tags        JSONB DEFAULT '[]'::jsonb,
    emoji       TEXT,
    color       TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 11. EMPLOYEE COURSES (junction)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_courses (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    course_id   TEXT NOT NULL REFERENCES courses(id),
    status      TEXT DEFAULT 'available',
    progress    INTEGER DEFAULT 0,
    started_at  TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    UNIQUE(employee_id, course_id)
);


-- ──────────────────────────────────────────────────────────────
-- 12. CERTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    issuer          TEXT,
    status          TEXT DEFAULT 'planned',
    score           INTEGER,
    progress        INTEGER DEFAULT 0,
    credential_id   TEXT,
    completed_date  DATE,
    expiry_date     DATE,
    exam_date       TEXT,
    emoji           TEXT,
    color           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certs_employee ON certifications(employee_id);


-- ──────────────────────────────────────────────────────────────
-- 13. WEEKLY SCHEDULE ENTRIES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_schedule_entries (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day         TEXT NOT NULL,
    topic       TEXT NOT NULL,
    duration    TEXT,
    status      TEXT DEFAULT 'upcoming',
    color       TEXT,
    week_of     DATE
);


-- ──────────────────────────────────────────────────────────────
-- 14. CAREER GOALS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_goals (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    target_role     TEXT NOT NULL,
    timeline        TEXT,
    focus_area      TEXT,
    target_industry TEXT,
    readiness_score INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cg_employee ON career_goals(employee_id);


-- ──────────────────────────────────────────────────────────────
-- 15. CAREER ROADMAP STEPS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_roadmap_steps (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    career_goal_id  TEXT NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
    step_order      INTEGER NOT NULL,
    title           TEXT NOT NULL,
    status          TEXT DEFAULT 'upcoming',
    description     TEXT
);


-- ──────────────────────────────────────────────────────────────
-- 16. KNOWLEDGE SOURCES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT DEFAULT 'File',
    connected       BOOLEAN DEFAULT true,
    file_path       TEXT,
    coverage        INTEGER DEFAULT 0,
    skills_extracted INTEGER DEFAULT 0,
    projects_found  INTEGER DEFAULT 0,
    confidence      INTEGER DEFAULT 0,
    last_synced     TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 17. REWARD ITEMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_items (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT NOT NULL,
    description TEXT,
    cost        INTEGER NOT NULL,
    emoji       TEXT,
    category    TEXT,
    available   BOOLEAN DEFAULT true,
    stock       INTEGER,
    created_at  TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 18. REWARD CLAIMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_claims (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reward_id   TEXT NOT NULL REFERENCES reward_items(id),
    claimed_at  TIMESTAMPTZ DEFAULT now(),
    status      TEXT DEFAULT 'claimed'
);


-- ──────────────────────────────────────────────────────────────
-- 19. RECOGNITIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recognitions (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    date        TEXT,
    awarded_by  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 20. PROJECTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    role            TEXT,
    description     TEXT,
    technologies    JSONB DEFAULT '[]'::jsonb,
    duration        TEXT,
    domain          TEXT,
    complexity      TEXT,
    success_score   INTEGER DEFAULT 0,
    leadership_score INTEGER DEFAULT 0,
    customer_rating NUMERIC(3,2),
    status          TEXT DEFAULT 'On Track',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_employee ON projects(employee_id);


-- ──────────────────────────────────────────────────────────────
-- Disable RLS on all tables (using service-role key server-side)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (your backend uses the service role key)
-- These policies allow the service_role to bypass RLS entirely (which it does by default).
-- We also add permissive policies for the anon role so the supabase-py client works.
CREATE POLICY "Allow all for service_role" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON gamification_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON xp_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON employee_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON challenge_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON learning_paths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON employee_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON certifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON weekly_schedule_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON career_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON career_roadmap_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON knowledge_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON reward_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON reward_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON recognitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON projects FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- ORGANIZATION MODULE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS organization_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month VARCHAR(20) NOT NULL,
    date VARCHAR(20) NOT NULL,
    total_headcount INT NOT NULL,
    voluntary_attrition_rate FLOAT NOT NULL,
    involuntary_attrition_rate FLOAT NOT NULL,
    new_hires INT NOT NULL,
    open_positions INT NOT NULL,
    enps INT NOT NULL,
    training_hours_per_employee FLOAT NOT NULL,
    absenteeism_rate FLOAT NOT NULL,
    revenue FLOAT NOT NULL,
    operating_cost FLOAT NOT NULL,
    ebitda FLOAT NOT NULL,
    net_profit FLOAT NOT NULL,
    marketing_spend FLOAT NOT NULL,
    rd_spend FLOAT NOT NULL,
    overall_productivity_score INT NOT NULL,
    csat FLOAT NOT NULL,
    nps INT NOT NULL,
    market_share_percentage FLOAT NOT NULL,
    project_completion_rate FLOAT NOT NULL,
    carbon_footprint_tons INT NOT NULL,
    energy_consumption_kwh INT NOT NULL,
    compliance_score INT NOT NULL,
    security_incidents INT NOT NULL,
    anomaly_flag VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS organization_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_name VARCHAR(255) NOT NULL,
    target_metric VARCHAR(100) NOT NULL,
    confidence_level INT NOT NULL,
    predicted_impact_percentage FLOAT NOT NULL,
    predicted_roi FLOAT NOT NULL,
    time_to_impact_months INT NOT NULL,
    ai_recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS org_innovation_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author_initials VARCHAR(10) NOT NULL,
    author_bg VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    roi VARCHAR(100) NOT NULL,
    timeline VARCHAR(100) NOT NULL,
    budget VARCHAR(100) NOT NULL,
    risks TEXT NOT NULL,
    team_required TEXT NOT NULL,
    impact_score INT NOT NULL,
    feasibility VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    patent_pending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS org_innovation_communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    members INT NOT NULL,
    joined BOOLEAN DEFAULT false,
    icon VARCHAR(50) NOT NULL,
    bg_class VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS org_at_risk_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    risk_level VARCHAR(50) NOT NULL,
    risk_score FLOAT NOT NULL,
    primary_factor VARCHAR(255) NOT NULL,
    burnout_probability FLOAT NOT NULL,
    compensation_satisfaction FLOAT NOT NULL,
    career_stagnation_score FLOAT NOT NULL,
    last_1_on_1 VARCHAR(100) NOT NULL,
    ai_retention_suggestion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_talent_gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    required_skills JSONB DEFAULT '[]'::jsonb,
    matched_employees JSONB DEFAULT '[]'::jsonb,
    urgency VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS org_talent_mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    match_score INT NOT NULL,
    initials VARCHAR(10) NOT NULL,
    icon_bg VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS org_team_builder_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    success_rate INT NOT NULL,
    compatibility_score INT NOT NULL,
    skill_balance INT NOT NULL,
    performance_prediction INT NOT NULL,
    rationale TEXT NOT NULL,
    members JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS org_okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    progress INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    initiatives JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE organization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_innovation_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_innovation_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_at_risk_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_talent_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_talent_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_team_builder_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service_role" ON organization_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON organization_scenarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_innovation_ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_innovation_communities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_at_risk_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_talent_gigs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_talent_mentors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_team_builder_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_okrs FOR ALL USING (true) WITH CHECK (true);


-- 🎉 Schema creation complete!
-- Next: Run the seed script with `python -m scripts.seed_database`

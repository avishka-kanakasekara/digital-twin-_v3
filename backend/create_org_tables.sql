-- ════════════════════════════════════════════════════════════════
-- Organization Module Tables — Run this in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organization Metrics
CREATE TABLE IF NOT EXISTS organization_metrics (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    month           VARCHAR(20) NOT NULL,
    date            VARCHAR(20) NOT NULL,
    total_headcount INT NOT NULL,
    voluntary_attrition_rate FLOAT NOT NULL,
    involuntary_attrition_rate FLOAT NOT NULL,
    new_hires       INT NOT NULL,
    open_positions  INT NOT NULL,
    enps            INT NOT NULL,
    training_hours_per_employee FLOAT NOT NULL,
    absenteeism_rate FLOAT NOT NULL,
    revenue         FLOAT NOT NULL,
    operating_cost  FLOAT NOT NULL,
    ebitda          FLOAT NOT NULL,
    net_profit      FLOAT NOT NULL,
    marketing_spend FLOAT NOT NULL,
    rd_spend        FLOAT NOT NULL,
    overall_productivity_score INT NOT NULL,
    csat            FLOAT NOT NULL,
    nps             INT NOT NULL,
    market_share_percentage FLOAT NOT NULL,
    project_completion_rate FLOAT NOT NULL,
    carbon_footprint_tons INT NOT NULL,
    energy_consumption_kwh INT NOT NULL,
    compliance_score INT NOT NULL,
    security_incidents INT NOT NULL,
    anomaly_flag    VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Organization Scenarios
CREATE TABLE IF NOT EXISTS organization_scenarios (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    scenario_name   VARCHAR(255) NOT NULL,
    target_metric   VARCHAR(100) NOT NULL,
    confidence_level INT NOT NULL,
    predicted_impact_percentage FLOAT NOT NULL,
    predicted_roi   FLOAT NOT NULL,
    time_to_impact_months INT NOT NULL,
    ai_recommendation TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Innovation Ideas
CREATE TABLE IF NOT EXISTS org_innovation_ideas (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title           VARCHAR(255) NOT NULL,
    author_initials VARCHAR(10) NOT NULL,
    author_bg       VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL,
    full_description TEXT NOT NULL,
    roi             VARCHAR(100) NOT NULL,
    timeline        VARCHAR(100) NOT NULL,
    budget          VARCHAR(100) NOT NULL,
    risks           TEXT NOT NULL,
    team_required   TEXT NOT NULL,
    impact_score    INT NOT NULL,
    feasibility     VARCHAR(50) NOT NULL,
    status          VARCHAR(50) NOT NULL,
    patent_pending  BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Innovation Communities
CREATE TABLE IF NOT EXISTS org_innovation_communities (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name    VARCHAR(255) NOT NULL,
    members INT NOT NULL,
    joined  BOOLEAN DEFAULT false,
    icon    VARCHAR(50) NOT NULL,
    bg_class VARCHAR(50) NOT NULL
);

-- 5. At Risk Employees
CREATE TABLE IF NOT EXISTS org_at_risk_employees (
    id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id                 TEXT,
    risk_level                  VARCHAR(50) NOT NULL,
    risk_score                  FLOAT NOT NULL,
    primary_factor              VARCHAR(255) NOT NULL,
    burnout_probability         FLOAT NOT NULL,
    compensation_satisfaction   FLOAT NOT NULL,
    career_stagnation_score     FLOAT NOT NULL,
    last_1_on_1                 VARCHAR(100) NOT NULL,
    ai_retention_suggestion     TEXT NOT NULL
);

-- 6. Talent Gigs
CREATE TABLE IF NOT EXISTS org_talent_gigs (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role_title          VARCHAR(255) NOT NULL,
    department          VARCHAR(100) NOT NULL,
    required_skills     JSONB DEFAULT '[]'::jsonb,
    matched_employees   JSONB DEFAULT '[]'::jsonb,
    urgency             VARCHAR(50) NOT NULL
);

-- 7. Talent Mentors
CREATE TABLE IF NOT EXISTS org_talent_mentors (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    match_score INT NOT NULL,
    initials    VARCHAR(10) NOT NULL,
    icon_bg     VARCHAR(50) NOT NULL
);

-- 8. Team Builder Options
CREATE TABLE IF NOT EXISTS org_team_builder_options (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name                    VARCHAR(255) NOT NULL,
    success_rate            INT NOT NULL,
    compatibility_score     INT NOT NULL,
    skill_balance           INT NOT NULL,
    performance_prediction  INT NOT NULL,
    rationale               TEXT NOT NULL,
    members                 JSONB DEFAULT '[]'::jsonb
);

-- 9. OKRs
CREATE TABLE IF NOT EXISTS org_okrs (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title       VARCHAR(255) NOT NULL,
    owner       VARCHAR(100) NOT NULL,
    progress    INT NOT NULL,
    status      VARCHAR(50) NOT NULL,
    initiatives JSONB DEFAULT '[]'::jsonb
);

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE organization_metrics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_scenarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_innovation_ideas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_innovation_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_at_risk_employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_talent_gigs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_talent_mentors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_team_builder_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_okrs                   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service_role" ON organization_metrics       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON organization_scenarios     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_innovation_ideas       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_innovation_communities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_at_risk_employees      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_talent_gigs            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_talent_mentors         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_team_builder_options   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON org_okrs                   FOR ALL USING (true) WITH CHECK (true);

-- Done!

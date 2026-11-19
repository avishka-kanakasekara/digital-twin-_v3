-- ============================================================
-- Missing Tables Migration for Supabase (public schema)
-- Generated from supabase_edt.sql — targets public schema
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/khrchkotgqbpzhurmbju/sql/new
-- ============================================================

-- ─── ALTER: add missing columns to existing tables ───────────
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS access_role TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS timezone_str TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS education TEXT DEFAULT '[]';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS languages TEXT DEFAULT '[]';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS biography TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS years_in_company INTEGER;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-Time';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'Active';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS twin_health INTEGER DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS ai_confidence INTEGER DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- ─── user_identities ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_identities (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    subject TEXT NOT NULL,
    email TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    UNIQUE (provider, subject),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── xp_transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    category TEXT,
    emoji TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── achievements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    xp_value INTEGER DEFAULT 0,
    rarity TEXT,
    criteria_type TEXT,
    criteria_value TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text)
);

-- ─── employee_achievements ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_achievements (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    UNIQUE (employee_id, achievement_id),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES public.achievements (id) ON DELETE NO ACTION
);

-- ─── submissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    submission_type TEXT NOT NULL,
    content TEXT NOT NULL,
    submitted_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE NO ACTION,
    FOREIGN KEY (challenge_id) REFERENCES public.challenges (id) ON DELETE NO ACTION,
    FOREIGN KEY (step_id) REFERENCES public.challenge_steps (id) ON DELETE NO ACTION
);

-- ─── courses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    provider TEXT,
    hours REAL,
    level TEXT,
    rating REAL,
    enrolled_count INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    emoji TEXT,
    color TEXT,
    description TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text)
);

-- ─── employee_courses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_courses (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    progress INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    UNIQUE (employee_id, course_id),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES public.courses (id) ON DELETE NO ACTION
);

-- ─── weekly_schedule_entries ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_schedule_entries (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    day TEXT NOT NULL,
    topic TEXT NOT NULL,
    duration TEXT,
    status TEXT DEFAULT 'upcoming',
    color TEXT,
    week_of TEXT,
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── career_goals ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_goals (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    target_role TEXT NOT NULL,
    timeline TEXT,
    focus_area TEXT,
    target_industry TEXT,
    readiness_score INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    visible_to_manager INTEGER DEFAULT 0,
    ai_analysis_json TEXT,
    ai_generated_at TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    updated_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── readiness_components ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.readiness_components (
    id TEXT NOT NULL PRIMARY KEY,
    goal_id TEXT NOT NULL,
    name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    weight REAL NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (goal_id) REFERENCES public.career_goals (id) ON DELETE CASCADE
);

-- ─── skill_gaps ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_gaps (
    id TEXT NOT NULL PRIMARY KEY,
    goal_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    current_level INTEGER DEFAULT 0,
    target_level INTEGER DEFAULT 0,
    gap INTEGER DEFAULT 0,
    recommended_path TEXT,
    estimated_hours INTEGER DEFAULT 0,
    status TEXT DEFAULT 'not_started',
    path_type TEXT DEFAULT 'course',
    priority TEXT DEFAULT 'Medium',
    category TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    updated_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (goal_id) REFERENCES public.career_goals (id) ON DELETE CASCADE
);

-- ─── evidence_submissions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evidence_submissions (
    id TEXT NOT NULL PRIMARY KEY,
    skill_gap_id TEXT,
    roadmap_step_id TEXT,
    employee_id TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    file_ref TEXT,
    description TEXT,
    status TEXT DEFAULT 'submitted',
    verified_by TEXT,
    verified_at TEXT,
    xp_awarded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (skill_gap_id) REFERENCES public.skill_gaps (id) ON DELETE NO ACTION,
    FOREIGN KEY (roadmap_step_id) REFERENCES public.career_roadmap_steps (id) ON DELETE NO ACTION,
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE NO ACTION
);

-- ─── internal_roles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_roles (
    role_id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT,
    required_skills TEXT DEFAULT '[]',
    is_open INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text)
);

-- ─── role_gap_matches ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_gap_matches (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    overall_fit_pct INTEGER DEFAULT 0,
    missing_requirements TEXT DEFAULT '[]',
    computed_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES public.career_goals (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES public.internal_roles (role_id) ON DELETE CASCADE
);

-- ─── mentor_matches ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mentor_matches (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    mentor_employee_id TEXT NOT NULL,
    shared_target_role TEXT,
    shared_skill TEXT,
    match_reason TEXT,
    intro_requested INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_employee_id) REFERENCES public.employees (id) ON DELETE NO ACTION
);

-- ─── xp_events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xp_events (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    source TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    reference_type TEXT,
    reference_id TEXT,
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── stall_flags ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stall_flags (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    last_progress_at TEXT NOT NULL,
    flagged_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    resolved INTEGER DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES public.career_goals (id) ON DELETE CASCADE
);

-- ─── knowledge_sources ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'File',
    connected INTEGER DEFAULT 1,
    file_path TEXT,
    coverage INTEGER DEFAULT 0,
    skills_extracted INTEGER DEFAULT 0,
    projects_found INTEGER DEFAULT 0,
    confidence INTEGER DEFAULT 0,
    last_synced TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    original_filename TEXT,
    mime_type TEXT,
    file_size INTEGER,
    storage_path TEXT,
    source_type TEXT DEFAULT 'UNKNOWN',
    content_hash TEXT,
    status TEXT DEFAULT 'UPLOADED',
    processing_stage TEXT,
    extracted_text TEXT,
    analysis_result TEXT,
    extraction_version TEXT DEFAULT '1.0',
    analysis_version TEXT DEFAULT '1.0',
    error_code TEXT,
    error_message TEXT,
    processed_at TEXT,
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── reward_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reward_items (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    emoji TEXT,
    category TEXT,
    available INTEGER DEFAULT 1,
    stock INTEGER,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text)
);

-- ─── peer_recommendations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.peer_recommendations (
    id TEXT NOT NULL PRIMARY KEY,
    from_employee_id TEXT NOT NULL,
    to_employee_id TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    skill TEXT,
    message TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (from_employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    FOREIGN KEY (to_employee_id) REFERENCES public.employees (id) ON DELETE NO ACTION,
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    CHECK (from_employee_id <> to_employee_id)
);

-- ─── projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    description TEXT,
    technologies TEXT DEFAULT '[]',
    duration TEXT,
    domain TEXT,
    complexity TEXT,
    success_score INTEGER DEFAULT 0,
    leadership_score INTEGER DEFAULT 0,
    customer_rating REAL,
    status TEXT DEFAULT 'On Track',
    progress INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE
);

-- ─── tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT NOT NULL PRIMARY KEY,
    project_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Medium',
    due_date TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE NO ACTION
);

-- ─── learning_chat_messages ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_chat_messages (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text),
    FOREIGN KEY (employee_id) REFERENCES public.employees (id) ON DELETE CASCADE,
    CHECK (role IN ('user', 'assistant', 'system'))
);

-- ─── org_innovation_ideas ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_innovation_ideas (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_bg TEXT NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    roi TEXT NOT NULL,
    timeline TEXT NOT NULL,
    budget TEXT NOT NULL,
    risks TEXT NOT NULL,
    team_required TEXT NOT NULL,
    impact_score INTEGER NOT NULL,
    feasibility TEXT NOT NULL,
    status TEXT NOT NULL,
    patent_pending INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP::text)
);

-- ─── org_innovation_communities ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_innovation_communities (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    members INTEGER NOT NULL,
    joined INTEGER DEFAULT 0,
    icon TEXT NOT NULL,
    bg_class TEXT NOT NULL
);

-- ─── org_talent_gigs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_talent_gigs (
    id TEXT NOT NULL PRIMARY KEY,
    role_title TEXT NOT NULL,
    department TEXT NOT NULL,
    required_skills TEXT DEFAULT '[]',
    matched_employees TEXT DEFAULT '[]',
    urgency TEXT NOT NULL
);

-- ─── skill_aliases ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_aliases (
    id TEXT NOT NULL PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    alias TEXT NOT NULL,
    created_at TEXT
);

-- ─── employee_capacity ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_capacity (
    id TEXT NOT NULL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    allocatable_pct INTEGER NOT NULL,
    notes TEXT,
    updated_by TEXT,
    updated_at TEXT,
    reviewed INTEGER NOT NULL DEFAULT 0
);

-- ─── team_builder_requests ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_builder_requests (
    id TEXT NOT NULL PRIMARY KEY,
    project_id TEXT,
    project_name TEXT NOT NULL,
    objective TEXT,
    project_type TEXT,
    owner_employee_id TEXT,
    start_date TEXT,
    end_date TEXT,
    headcount INTEGER NOT NULL,
    allocation_pct INTEGER NOT NULL,
    context TEXT,
    allow_smaller INTEGER NOT NULL DEFAULT 0,
    skills_json TEXT NOT NULL,
    roles_json TEXT NOT NULL,
    requested_by TEXT,
    created_at TEXT NOT NULL
);

-- ─── team_builder_runs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_builder_runs (
    id TEXT NOT NULL PRIMARY KEY,
    request_id TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    status TEXT NOT NULL,
    warnings_json TEXT,
    eligible_count INTEGER NOT NULL,
    requested_headcount INTEGER NOT NULL,
    context_skills_json TEXT,
    created_at TEXT NOT NULL
);

-- ─── team_builder_members ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_builder_members (
    id TEXT NOT NULL PRIMARY KEY,
    option_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    explanation TEXT NOT NULL,
    capacity_status TEXT,
    matched_json TEXT,
    warnings_json TEXT,
    requirement_score INTEGER NOT NULL
);

-- ─── team_builder_assignments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_builder_assignments (
    id TEXT NOT NULL PRIMARY KEY,
    option_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    project_id TEXT,
    project_name TEXT NOT NULL,
    role_title TEXT,
    allocation_pct INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL,
    assembled_by TEXT,
    assembled_at TEXT NOT NULL
);

-- ─── team_builder_audit ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_builder_audit (
    id TEXT NOT NULL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
);

-- ─── workforce_teams ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workforce_teams (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    team_type TEXT,
    project_type TEXT,
    origin TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    leader_id TEXT,
    project_id TEXT,
    project_name TEXT,
    headcount INTEGER NOT NULL,
    allocation_pct INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    skills_json TEXT NOT NULL,
    roles_json TEXT NOT NULL,
    context TEXT,
    registration_status TEXT NOT NULL,
    operational_status TEXT NOT NULL,
    option_id TEXT,
    decision_note TEXT,
    decided_by TEXT,
    decided_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- ─── workforce_team_members ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workforce_team_members (
    id TEXT NOT NULL PRIMARY KEY,
    team_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    member_role TEXT NOT NULL,
    membership_status TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- ─── workforce_team_invitations ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.workforce_team_invitations (
    id TEXT NOT NULL PRIMARY KEY,
    team_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    responded_at TEXT
);

-- ─── team_success_predictions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_success_predictions (
    id TEXT NOT NULL PRIMARY KEY,
    team_id TEXT,
    option_id TEXT,
    run_id TEXT,
    roster_fingerprint TEXT NOT NULL,
    probability REAL,
    status TEXT NOT NULL,
    model_version TEXT,
    model_type TEXT,
    training_data_type TEXT,
    feature_schema TEXT,
    features_json TEXT NOT NULL,
    notes_json TEXT NOT NULL,
    warning TEXT,
    evaluated_by TEXT,
    created_at TEXT NOT NULL
);

-- ─── project_outcomes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_outcomes (
    id TEXT NOT NULL PRIMARY KEY,
    project_id TEXT,
    project_name TEXT NOT NULL,
    team_id TEXT,
    outcome_label TEXT NOT NULL,
    definition TEXT NOT NULL,
    acceptance_status TEXT,
    planned_end TEXT,
    actual_end TEXT,
    recorded_by TEXT NOT NULL,
    verified INTEGER NOT NULL,
    recorded_at TEXT NOT NULL
);

-- ─── workforce_join_requests ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workforce_join_requests (
    id TEXT NOT NULL PRIMARY KEY,
    team_id TEXT NOT NULL,
    option_id TEXT,
    employee_id TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL,
    decided_by TEXT,
    decided_at TEXT,
    created_at TEXT NOT NULL
);

-- ─── org_okrs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_okrs (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    progress INTEGER NOT NULL,
    status TEXT NOT NULL,
    initiatives TEXT DEFAULT '[]'
);

-- ─── org_strategy_role_specs ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_strategy_role_specs (
    id TEXT NOT NULL PRIMARY KEY,
    rank INTEGER NOT NULL,
    role TEXT NOT NULL,
    skill TEXT NOT NULL,
    dept TEXT NOT NULL,
    level TEXT NOT NULL,
    gap TEXT NOT NULL,
    urgency TEXT NOT NULL,
    status TEXT NOT NULL
);

-- ─── org_strategy_primary_inputs ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_strategy_primary_inputs (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL
);

-- ─── org_strategy_knowledge_assets ───────────────────────────
CREATE TABLE IF NOT EXISTS public.org_strategy_knowledge_assets (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    count TEXT NOT NULL,
    color TEXT NOT NULL
);

-- ─── org_strategy_forecast_timeline ──────────────────────────
CREATE TABLE IF NOT EXISTS public.org_strategy_forecast_timeline (
    id TEXT NOT NULL PRIMARY KEY,
    year TEXT NOT NULL,
    headcount INTEGER NOT NULL,
    target INTEGER NOT NULL,
    engineering INTEGER NOT NULL,
    operations INTEGER NOT NULL
);

-- ─── org_strategy_competency_radar ───────────────────────────
CREATE TABLE IF NOT EXISTS public.org_strategy_competency_radar (
    id TEXT NOT NULL PRIMARY KEY,
    subject TEXT NOT NULL,
    "A" INTEGER NOT NULL,
    "fullMark" INTEGER NOT NULL
);

-- ─── wi_capability_gaps ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wi_capability_gaps (
    id TEXT NOT NULL PRIMARY KEY,
    role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    department TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    current_headcount INTEGER NOT NULL,
    current_proficiency_avg REAL NOT NULL,
    target_proficiency REAL NOT NULL,
    demanded_headcount INTEGER NOT NULL,
    headcount_gap INTEGER NOT NULL,
    proficiency_gap REAL NOT NULL,
    capability_gap_score REAL NOT NULL,
    time_horizon TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── wi_role_scores ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wi_role_scores (
    id TEXT NOT NULL PRIMARY KEY,
    role_name TEXT NOT NULL,
    department TEXT NOT NULL,
    overall_gap_score REAL NOT NULL,
    gap_level TEXT NOT NULL,
    top_missing_skills TEXT DEFAULT '[]',
    criticality_index REAL NOT NULL,
    succession_readiness REAL NOT NULL,
    skill_scarcity_index REAL NOT NULL,
    risk_flag TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── wi_role_criticality ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wi_role_criticality (
    id TEXT NOT NULL PRIMARY KEY,
    role_name TEXT NOT NULL,
    department TEXT NOT NULL,
    business_impact_score REAL NOT NULL,
    succession_readiness_score REAL NOT NULL,
    skill_scarcity_score REAL NOT NULL,
    risk_status TEXT NOT NULL,
    mitigation_plan TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── wi_config ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wi_config (
    id TEXT NOT NULL PRIMARY KEY,
    config_key TEXT NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── lr_courses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_courses (
    id TEXT PRIMARY KEY,
    course_title TEXT NOT NULL,
    provider TEXT,
    modality TEXT NOT NULL,
    duration_hours REAL NOT NULL,
    cost_lkr REAL NOT NULL DEFAULT 0,
    difficulty_level TEXT NOT NULL,
    is_mandatory INTEGER NOT NULL DEFAULT 0,
    mandatory_for_role_ids TEXT NOT NULL DEFAULT '[]',
    strategic_priority_flag INTEGER NOT NULL DEFAULT 0,
    has_assessment INTEGER NOT NULL DEFAULT 0,
    catalogue_status TEXT NOT NULL DEFAULT 'Active'
);

-- ─── lr_course_skills ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_course_skills (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    level_delivered INTEGER NOT NULL
);

-- ─── lr_plans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_plans (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    source_gap_reference TEXT NOT NULL,
    title TEXT NOT NULL,
    target_skill_ids TEXT NOT NULL,
    plan_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    target_completion_date TEXT NOT NULL,
    total_estimated_hours REAL NOT NULL,
    priority_score REAL NOT NULL,
    abandonment_reason TEXT
);

-- ─── lr_plan_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_plan_items (
    id TEXT PRIMARY KEY,
    learning_plan_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    skill_gap_score REAL NOT NULL,
    expected_proficiency_gain INTEGER NOT NULL,
    status TEXT NOT NULL,
    enrolled_at TEXT,
    completed_at TEXT
);

-- ─── lr_assessments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_assessments (
    id TEXT PRIMARY KEY,
    learning_plan_item_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    proficiency_before INTEGER NOT NULL,
    proficiency_after INTEGER,
    intended_proficiency INTEGER NOT NULL,
    assessment_score_pct INTEGER NOT NULL,
    assessment_date TEXT NOT NULL,
    passed INTEGER NOT NULL,
    sfa_sync_status TEXT NOT NULL
);

-- ─── lr_gap_closures ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_gap_closures (
    id TEXT PRIMARY KEY,
    source_gap_reference TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    before_level INTEGER NOT NULL,
    after_level INTEGER NOT NULL,
    required_level INTEGER NOT NULL,
    closure_status TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- ─── lr_id_counters ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_id_counters (
    prefix TEXT PRIMARY KEY,
    next_value INTEGER NOT NULL
);

-- ─── lr_audit ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_audit (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    event TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL
);

-- ─── lr_course_questions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lr_course_questions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_index INTEGER NOT NULL
);

-- ─── career_plan_settings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_plan_settings (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    hours_per_week INTEGER NOT NULL,
    target_date TEXT NOT NULL,
    started_at TEXT NOT NULL,
    baseline_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
);

-- ─── career_checkins ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_checkins (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    skill TEXT,
    hours REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
);

-- ─── career_role_profiles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_role_profiles (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    target_role TEXT NOT NULL,
    profile_json TEXT NOT NULL,
    source TEXT NOT NULL,
    generated_at TEXT NOT NULL
);

-- ─── succession_roles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.succession_roles (
    id TEXT PRIMARY KEY,
    role_title TEXT NOT NULL,
    department TEXT,
    incumbent_employee_id TEXT NOT NULL,
    owner_manager_id TEXT,
    is_business_critical INTEGER NOT NULL DEFAULT 0,
    criticality_reason TEXT,
    departure_risk TEXT NOT NULL DEFAULT 'Medium',
    expected_departure_date TEXT,
    requirements_json TEXT NOT NULL DEFAULT '{}',
    flagged_by TEXT,
    flagged_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    role_family TEXT,
    departure_scenario TEXT,
    interim_backup_employee_id TEXT,
    interim_backup_note TEXT,
    criticality_json TEXT,
    last_review_date TEXT,
    next_review_date TEXT,
    external_contingency INTEGER NOT NULL DEFAULT 0,
    position_status TEXT
);

-- ─── succession_records ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.succession_records (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    incumbent_employee_id TEXT NOT NULL,
    trigger_reason TEXT NOT NULL CHECK (trigger_reason IN ('Business-Critical Flag', 'HR Request')),
    trigger_note TEXT,
    requested_by TEXT,
    pairing_status TEXT NOT NULL CHECK (pairing_status IN ('Slate Generated', 'Candidate Nominated', 'Confirmed', 'Withdrawn')),
    nominee_employee_id TEXT,
    approved_by_hr INTEGER NOT NULL DEFAULT 0,
    approved_by TEXT,
    approved_at TEXT,
    decision_note TEXT,
    shared_with_candidates INTEGER NOT NULL DEFAULT 0,
    generated_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    excluded_json TEXT,
    CHECK (pairing_status <> 'Confirmed' OR approved_by_hr = 1)
);

-- ─── succession_candidates ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.succession_candidates (
    id TEXT PRIMARY KEY,
    succession_record_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    rank_position INTEGER NOT NULL,
    candidate_readiness_score INTEGER NOT NULL,
    candidate_skill_gap_pct REAL NOT NULL,
    readiness_band TEXT NOT NULL,
    components_json TEXT NOT NULL DEFAULT '{}',
    gaps_json TEXT NOT NULL DEFAULT '[]',
    strengths_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);

-- ─── kt_plans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kt_plans (
    id TEXT PRIMARY KEY,
    succession_record_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    incumbent_employee_id TEXT NOT NULL,
    successor_employee_id TEXT,
    opened_reason TEXT NOT NULL,
    status TEXT NOT NULL,
    overall_progress_pct REAL NOT NULL DEFAULT 0,
    target_handover_date TEXT NOT NULL,
    drafted_by TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    assurance_status TEXT,
    validated_by TEXT,
    validated_at TEXT,
    validation_note TEXT
);

-- ─── kt_tasks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kt_tasks (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('Shadowing Session', 'Documentation Task', 'Mentor Meeting', 'Handover Checklist Item')),
    title TEXT NOT NULL,
    description TEXT,
    knowledge_area TEXT,
    owner_employee_id TEXT,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Complete')),
    completed_at TEXT,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    evidence_note TEXT,
    verification_status TEXT,
    verified_by TEXT,
    verified_at TEXT,
    cancelled_at TEXT,
    cancel_reason TEXT
);

-- ─── succession_audit ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.succession_audit (
    id TEXT PRIMARY KEY,
    record_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
);

-- ─── org_strategy_vision ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_strategy_vision (
    id TEXT PRIMARY KEY,
    vision_text TEXT,
    tech_app_features TEXT[],
    tech_team_goals TEXT[],
    habits TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── org_ai_readiness ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_ai_readiness (
    id TEXT PRIMARY KEY,
    overall_score INTEGER,
    literacy_score INTEGER,
    adoption_score INTEGER,
    automation_opportunities JSONB,
    dept_projects JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── org_transformations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_transformations (
    id TEXT PRIMARY KEY,
    name TEXT,
    owner TEXT,
    progress INTEGER,
    status TEXT,
    milestones JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── workforce_employee_records ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.workforce_employee_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role_id TEXT NOT NULL,
    org_unit_id TEXT NOT NULL,
    manager_employee_id TEXT,
    career_level_id TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    employee_status TEXT NOT NULL,
    tenure_years REAL NOT NULL,
    location TEXT NOT NULL,
    work_model TEXT NOT NULL,
    cost_band_id TEXT NOT NULL,
    annual_cost_lkr INTEGER NOT NULL,
    performance_rating_current REAL NOT NULL,
    current_allocation_pct REAL NOT NULL,
    availability_from_date TEXT NOT NULL,
    notice_period_days INTEGER NOT NULL
);

-- ─── workforce_employee_skill_records ─────────────────────────
CREATE TABLE IF NOT EXISTS public.workforce_employee_skill_records (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    name TEXT NOT NULL,
    proficiency_effective INTEGER NOT NULL,
    proficiency_source TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    last_assessed_date TEXT NOT NULL,
    last_used_date TEXT NOT NULL,
    assessment_method TEXT NOT NULL,
    evidence_reference TEXT,
    is_decayed INTEGER NOT NULL DEFAULT 0
);

-- ─── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_identities_employee_id ON public.user_identities (employee_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_employee_id ON public.xp_transactions (employee_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON public.xp_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_career_goals_employee_id ON public.career_goals (employee_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_goal_id ON public.skill_gaps (goal_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_employee_id ON public.evidence_submissions (employee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_matches_employee_id ON public.mentor_matches (employee_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_employee_id ON public.xp_events (employee_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_employee_id ON public.knowledge_sources (employee_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_content_hash ON public.knowledge_sources (content_hash);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON public.knowledge_sources (status);
CREATE INDEX IF NOT EXISTS idx_peer_recommendations_to_employee_id ON public.peer_recommendations (to_employee_id);
CREATE INDEX IF NOT EXISTS idx_peer_recommendations_from_employee_id ON public.peer_recommendations (from_employee_id);
CREATE INDEX IF NOT EXISTS idx_projects_employee_id ON public.projects (employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON public.tasks (employee_id);
CREATE INDEX IF NOT EXISTS idx_learning_chat_messages_employee_id ON public.learning_chat_messages (employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tb_assign_option_employee ON public.team_builder_assignments (option_id, employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wt_member ON public.workforce_team_members (team_id, employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wt_invite_pending ON public.workforce_team_invitations (team_id, employee_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wt_join_status ON public.workforce_join_requests (team_id, employee_id, status);

-- ─── Disable RLS for all new tables (match existing pattern) ──
ALTER TABLE public.user_identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedule_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_gap_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stall_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_innovation_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_innovation_communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_talent_gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_aliases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_capacity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_builder_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_builder_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_builder_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_builder_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_builder_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_team_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_success_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_outcomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_okrs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_strategy_role_specs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_strategy_primary_inputs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_strategy_knowledge_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_strategy_forecast_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_strategy_competency_radar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wi_capability_gaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wi_role_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wi_role_criticality DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wi_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_course_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_plan_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_gap_closures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_id_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_course_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_plan_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_role_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kt_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kt_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_strategy_vision DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_ai_readiness DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_transformations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_employee_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_employee_skill_records DISABLE ROW LEVEL SECURITY;

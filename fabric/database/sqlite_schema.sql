PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "initials" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "department" TEXT,
    "role" TEXT,
    "access_role" TEXT,
    "team" TEXT,
    "manager_id" TEXT,
    "manager_name" TEXT,
    "location" TEXT,
    "timezone_str" TEXT,
    "phone" TEXT,
    "education" TEXT DEFAULT '[]',
    "languages" TEXT DEFAULT '[]',
    "biography" TEXT,
    "headline" TEXT,
    "avatar_url" TEXT,
    "years_experience" INTEGER,
    "years_in_company" INTEGER,
    "employment_type" TEXT DEFAULT 'Full-Time',
    "employment_status" TEXT DEFAULT 'Active',
    "twin_health" INTEGER DEFAULT 0,
    "ai_confidence" INTEGER DEFAULT 0,
    "profile_completeness" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT (datetime('now')),
    "updated_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    UNIQUE ("employee_code"),
    UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "user_identities" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    UNIQUE ("provider", "subject"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "skills" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "sub_category" TEXT,
    "icon" TEXT,
    "proficiency" INTEGER DEFAULT 0,
    "target_level" INTEGER DEFAULT 0,
    "years_experience" REAL,
    "trend" TEXT DEFAULT 'stable',
    "ai_confidence" INTEGER,
    "verified" INTEGER DEFAULT 0,
    "source" TEXT,
    "ai_recommendation" TEXT,
    "last_updated" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    UNIQUE ("employee_id", "name"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "gamification_profiles" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "level" INTEGER DEFAULT 1,
    "xp" INTEGER DEFAULT 0,
    "next_level_xp" INTEGER DEFAULT 1000,
    "total_xp_earned" INTEGER DEFAULT 0,
    "company_rank" INTEGER,
    "department_rank" INTEGER,
    "streak_days" INTEGER DEFAULT 0,
    "longest_streak" INTEGER DEFAULT 0,
    "last_activity" TEXT,
    "title" TEXT DEFAULT 'Newcomer',
    "updated_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    UNIQUE ("employee_id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "xp_transactions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "category" TEXT,
    "emoji" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "xp_value" INTEGER DEFAULT 0,
    "rarity" TEXT,
    "criteria_type" TEXT,
    "criteria_value" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "employee_achievements" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    UNIQUE ("employee_id", "achievement_id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xp_reward" INTEGER DEFAULT 0,
    "bonus_badge" TEXT,
    "difficulty" TEXT,
    "type" TEXT,
    "category" TEXT,
    "color" TEXT,
    "start_date" TEXT,
    "end_date" TEXT,
    "is_active" INTEGER DEFAULT 1,
    "target_skills" TEXT DEFAULT '[]',
    "estimated_minutes" INTEGER,
    "learning_objective" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "challenge_progress" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "progress" INTEGER DEFAULT 0,
    "completed" INTEGER DEFAULT 0,
    "enrolled_at" TEXT DEFAULT (datetime('now')),
    "completed_at" TEXT,
    PRIMARY KEY ("id"),
    UNIQUE ("employee_id", "challenge_id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("challenge_id") REFERENCES "challenges" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "challenge_steps" (
    "id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "submission_type" TEXT NOT NULL DEFAULT 'text',
    "evaluation_rubric" TEXT NOT NULL,
    "xp_value" INTEGER NOT NULL DEFAULT 100,
    "reference_url" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("challenge_id") REFERENCES "challenges" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "submissions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "submission_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "submitted_at" TEXT DEFAULT (datetime('now')),
    "status" TEXT NOT NULL DEFAULT 'pending',
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE NO ACTION,
    FOREIGN KEY ("challenge_id") REFERENCES "challenges" ("id") ON DELETE NO ACTION,
    FOREIGN KEY ("step_id") REFERENCES "challenge_steps" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "evaluations" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "ai_score" INTEGER NOT NULL,
    "pass" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "evaluated_at" TEXT DEFAULT (datetime('now')),
    "raw_model_response" TEXT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("submission_id") REFERENCES "submissions" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "learning_paths" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" INTEGER DEFAULT 0,
    "total_courses" INTEGER DEFAULT 0,
    "completed_courses" INTEGER DEFAULT 0,
    "estimated_hours" REAL,
    "due_date" TEXT,
    "tags" TEXT DEFAULT '[]',
    "color" TEXT,
    "is_ai_recommended" INTEGER DEFAULT 0,
    "platform" TEXT,
    "instructor" TEXT,
    "course_ids" TEXT DEFAULT '[]',
    "ai_rationale" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "hours" REAL,
    "level" TEXT,
    "rating" REAL,
    "enrolled_count" INTEGER DEFAULT 0,
    "tags" TEXT DEFAULT '[]',
    "emoji" TEXT,
    "color" TEXT,
    "description" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "employee_courses" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'available',
    "progress" INTEGER DEFAULT 0,
    "started_at" TEXT,
    "completed_at" TEXT,
    PRIMARY KEY ("id"),
    UNIQUE ("employee_id", "course_id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "certifications" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "status" TEXT DEFAULT 'planned',
    "score" INTEGER,
    "progress" INTEGER DEFAULT 0,
    "credential_id" TEXT,
    "completed_date" TEXT,
    "expiry_date" TEXT,
    "exam_date" TEXT,
    "emoji" TEXT,
    "color" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "weekly_schedule_entries" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "duration" TEXT,
    "status" TEXT DEFAULT 'upcoming',
    "color" TEXT,
    "week_of" TEXT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "career_goals" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "target_role" TEXT NOT NULL,
    "timeline" TEXT,
    "focus_area" TEXT,
    "target_industry" TEXT,
    "readiness_score" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "visible_to_manager" INTEGER DEFAULT 0,
    "ai_analysis_json" TEXT,
    "ai_generated_at" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    "updated_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "career_roadmap_steps" (
    "id" TEXT NOT NULL,
    "career_goal_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT DEFAULT 'upcoming',
    "description" TEXT,
    "step_type" TEXT DEFAULT 'learning',
    "related_skill_gap_id" TEXT,
    "requires_evidence" INTEGER DEFAULT 0,
    "evidence_type" TEXT,
    "estimated_hours" INTEGER DEFAULT 0,
    "xp_reward" INTEGER DEFAULT 0,
    "due_window" TEXT,
    "completed_at" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    "updated_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("career_goal_id") REFERENCES "career_goals" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "readiness_components" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "weight" REAL NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("goal_id") REFERENCES "career_goals" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "skill_gaps" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "current_level" INTEGER DEFAULT 0,
    "target_level" INTEGER DEFAULT 0,
    "gap" INTEGER DEFAULT 0,
    "recommended_path" TEXT,
    "estimated_hours" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'not_started',
    "path_type" TEXT DEFAULT 'course',
    "priority" TEXT DEFAULT 'Medium',
    "category" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    "updated_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("goal_id") REFERENCES "career_goals" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "evidence_submissions" (
    "id" TEXT NOT NULL,
    "skill_gap_id" TEXT,
    "roadmap_step_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "evidence_type" TEXT NOT NULL,
    "file_ref" TEXT,
    "description" TEXT,
    "status" TEXT DEFAULT 'submitted',
    "verified_by" TEXT,
    "verified_at" TEXT,
    "xp_awarded" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("skill_gap_id") REFERENCES "skill_gaps" ("id") ON DELETE NO ACTION,
    FOREIGN KEY ("roadmap_step_id") REFERENCES "career_roadmap_steps" ("id") ON DELETE NO ACTION,
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "internal_roles" (
    "role_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "required_skills" TEXT DEFAULT '[]',
    "is_open" INTEGER DEFAULT 1,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("role_id")
);

CREATE TABLE IF NOT EXISTS "role_gap_matches" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "overall_fit_pct" INTEGER DEFAULT 0,
    "missing_requirements" TEXT DEFAULT '[]',
    "computed_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("goal_id") REFERENCES "career_goals" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("role_id") REFERENCES "internal_roles" ("role_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "mentor_matches" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "mentor_employee_id" TEXT NOT NULL,
    "shared_target_role" TEXT,
    "shared_skill" TEXT,
    "match_reason" TEXT,
    "intro_requested" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("mentor_employee_id") REFERENCES "employees" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "xp_events" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TEXT DEFAULT (datetime('now')),
    "reference_type" TEXT,
    "reference_id" TEXT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "stall_flags" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "last_progress_at" TEXT NOT NULL,
    "flagged_at" TEXT DEFAULT (datetime('now')),
    "resolved" INTEGER DEFAULT 0,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("goal_id") REFERENCES "career_goals" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "knowledge_sources" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'File',
    "connected" INTEGER DEFAULT 1,
    "file_path" TEXT,
    "coverage" INTEGER DEFAULT 0,
    "skills_extracted" INTEGER DEFAULT 0,
    "projects_found" INTEGER DEFAULT 0,
    "confidence" INTEGER DEFAULT 0,
    "last_synced" TEXT DEFAULT (datetime('now')),
    "created_at" TEXT DEFAULT (datetime('now')),
    "original_filename" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "storage_path" TEXT,
    "source_type" TEXT DEFAULT 'UNKNOWN',
    "content_hash" TEXT,
    "status" TEXT DEFAULT 'UPLOADED',
    "processing_stage" TEXT,
    "extracted_text" TEXT,
    "analysis_result" TEXT,
    "extraction_version" TEXT DEFAULT 1.0,
    "analysis_version" TEXT DEFAULT 1.0,
    "error_code" TEXT,
    "error_message" TEXT,
    "processed_at" TEXT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "knowledge_extracted_facts" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "fact_type" TEXT NOT NULL,
    "fact_key" TEXT NOT NULL,
    "fact_value" TEXT NOT NULL,
    "evidence_text" TEXT,
    "evidence_page" INTEGER,
    "original_value" TEXT,
    "canonical_value" TEXT,
    "confidence" REAL DEFAULT 0,
    "source_reliability" REAL DEFAULT 0.7,
    "extraction_version" TEXT DEFAULT 1.0,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("source_id") REFERENCES "knowledge_sources" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "knowledge_update_events" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "source_id" TEXT,
    "operation" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_key" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "confidence" REAL,
    "reason" TEXT,
    "evidence_text" TEXT,
    "requires_approval" INTEGER DEFAULT 0,
    "approval_status" TEXT DEFAULT 'auto_approved',
    "model_name" TEXT,
    "model_version" TEXT,
    "prompt_version" TEXT DEFAULT 1.0,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("source_id") REFERENCES "knowledge_sources" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "reward_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "emoji" TEXT,
    "category" TEXT,
    "available" INTEGER DEFAULT 1,
    "stock" INTEGER,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reward_claims" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "claimed_at" TEXT DEFAULT (datetime('now')),
    "status" TEXT DEFAULT 'claimed',
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("reward_id") REFERENCES "reward_items" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "recognitions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT,
    "awarded_by" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "peer_recommendations" (
    "id" TEXT NOT NULL,
    "from_employee_id" TEXT NOT NULL,
    "to_employee_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "skill" TEXT,
    "message" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 5,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("from_employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("to_employee_id") REFERENCES "employees" ("id") ON DELETE NO ACTION,
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    CHECK (from_employee_id <> to_employee_id)
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "technologies" TEXT DEFAULT '[]',
    "duration" TEXT,
    "domain" TEXT,
    "complexity" TEXT,
    "success_score" INTEGER DEFAULT 0,
    "leadership_score" INTEGER DEFAULT 0,
    "customer_rating" REAL,
    "status" TEXT DEFAULT 'On Track',
    "progress" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'Pending',
    "priority" TEXT DEFAULT 'Medium',
    "due_date" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "learning_chat_messages" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
    CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE TABLE IF NOT EXISTS "learning_feed_cache" (
    "employee_id" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '[]',
    "input_hash" TEXT,
    "generated_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("employee_id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "open_positions" INTEGER NOT NULL,
    "allocated_budget" REAL NOT NULL,
    "actual_spend" REAL NOT NULL,
    "performance_score" INTEGER NOT NULL,
    "target_score" INTEGER NOT NULL,
    "enps" INTEGER NOT NULL,
    "attrition_rate" REAL NOT NULL,
    "risk_level" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "organization_metrics" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "total_headcount" INTEGER NOT NULL,
    "voluntary_attrition_rate" REAL NOT NULL,
    "involuntary_attrition_rate" REAL NOT NULL,
    "new_hires" INTEGER NOT NULL,
    "open_positions" INTEGER NOT NULL,
    "enps" INTEGER NOT NULL,
    "training_hours_per_employee" REAL NOT NULL,
    "absenteeism_rate" REAL NOT NULL,
    "revenue" REAL NOT NULL,
    "operating_cost" REAL NOT NULL,
    "ebitda" REAL NOT NULL,
    "net_profit" REAL NOT NULL,
    "marketing_spend" REAL NOT NULL,
    "rd_spend" REAL NOT NULL,
    "overall_productivity_score" INTEGER NOT NULL,
    "csat" REAL NOT NULL,
    "nps" INTEGER NOT NULL,
    "market_share_percentage" REAL NOT NULL,
    "project_completion_rate" REAL NOT NULL,
    "carbon_footprint_tons" INTEGER NOT NULL,
    "energy_consumption_kwh" INTEGER NOT NULL,
    "compliance_score" INTEGER NOT NULL,
    "security_incidents" INTEGER NOT NULL,
    "anomaly_flag" TEXT,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "organization_scenarios" (
    "id" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "target_metric" TEXT NOT NULL,
    "confidence_level" INTEGER NOT NULL,
    "predicted_impact_percentage" REAL NOT NULL,
    "predicted_roi" REAL NOT NULL,
    "time_to_impact_months" INTEGER NOT NULL,
    "ai_recommendation" TEXT NOT NULL,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "org_innovation_ideas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author_initials" TEXT NOT NULL,
    "author_bg" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "full_description" TEXT NOT NULL,
    "roi" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "team_required" TEXT NOT NULL,
    "impact_score" INTEGER NOT NULL,
    "feasibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "patent_pending" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT (datetime('now')),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "org_innovation_communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "members" INTEGER NOT NULL,
    "joined" INTEGER DEFAULT 0,
    "icon" TEXT NOT NULL,
    "bg_class" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "org_at_risk_employees" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT,
    "risk_level" TEXT NOT NULL,
    "risk_score" REAL NOT NULL,
    "primary_factor" TEXT NOT NULL,
    "burnout_probability" REAL NOT NULL,
    "compensation_satisfaction" REAL NOT NULL,
    "career_stagnation_score" REAL NOT NULL,
    "last_1_on_1" TEXT NOT NULL,
    "ai_retention_suggestion" TEXT NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "org_talent_gigs" (
    "id" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "required_skills" TEXT DEFAULT '[]',
    "matched_employees" TEXT DEFAULT '[]',
    "urgency" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "org_talent_mentors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "match_score" INTEGER NOT NULL,
    "initials" TEXT NOT NULL,
    "icon_bg" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "org_team_builder_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "success_rate" INTEGER NOT NULL,
    "compatibility_score" INTEGER NOT NULL,
    "skill_balance" INTEGER NOT NULL,
    "performance_prediction" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "members" TEXT DEFAULT '[]',
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "org_okrs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "initiatives" TEXT DEFAULT '[]',
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_employees_department" ON "employees" ("department");

CREATE INDEX IF NOT EXISTS "idx_employees_email" ON "employees" ("email");

CREATE INDEX IF NOT EXISTS "idx_user_identities_employee_id" ON "user_identities" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_skills_employee_id" ON "skills" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_xp_transactions_employee_id" ON "xp_transactions" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_xp_transactions_created_at" ON "xp_transactions" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_challenges_is_active_category" ON "challenges" ("is_active", "category");

CREATE INDEX IF NOT EXISTS "idx_challenge_steps_challenge_id" ON "challenge_steps" ("challenge_id");

CREATE INDEX IF NOT EXISTS "idx_submissions_employee_id_step_id" ON "submissions" ("employee_id", "step_id");

CREATE INDEX IF NOT EXISTS "idx_evaluations_submission_id" ON "evaluations" ("submission_id");

CREATE INDEX IF NOT EXISTS "idx_learning_paths_employee_id" ON "learning_paths" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_certifications_employee_id" ON "certifications" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_weekly_schedule_entries_employee_id" ON "weekly_schedule_entries" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_career_goals_employee_id" ON "career_goals" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_career_roadmap_steps_career_goal_id" ON "career_roadmap_steps" ("career_goal_id");

CREATE INDEX IF NOT EXISTS "idx_skill_gaps_goal_id" ON "skill_gaps" ("goal_id");

CREATE INDEX IF NOT EXISTS "idx_evidence_submissions_employee_id" ON "evidence_submissions" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_mentor_matches_employee_id" ON "mentor_matches" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_xp_events_employee_id" ON "xp_events" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_employee_id" ON "knowledge_sources" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_content_hash" ON "knowledge_sources" ("content_hash");

CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_status" ON "knowledge_sources" ("status");

CREATE INDEX IF NOT EXISTS "idx_knowledge_extracted_facts_employee_id" ON "knowledge_extracted_facts" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_extracted_facts_source_id" ON "knowledge_extracted_facts" ("source_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_extracted_facts_fact_type" ON "knowledge_extracted_facts" ("fact_type");

CREATE INDEX IF NOT EXISTS "idx_knowledge_update_events_employee_id" ON "knowledge_update_events" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_update_events_source_id" ON "knowledge_update_events" ("source_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_update_events_created_at" ON "knowledge_update_events" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_reward_claims_employee_id" ON "reward_claims" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_recognitions_employee_id" ON "recognitions" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_recognitions_type" ON "recognitions" ("type");

CREATE INDEX IF NOT EXISTS "idx_peer_recommendations_to_employee_id" ON "peer_recommendations" ("to_employee_id");

CREATE INDEX IF NOT EXISTS "idx_peer_recommendations_from_employee_id" ON "peer_recommendations" ("from_employee_id");

CREATE INDEX IF NOT EXISTS "idx_projects_employee_id" ON "projects" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_tasks_project_id" ON "tasks" ("project_id");

CREATE INDEX IF NOT EXISTS "idx_tasks_employee_id" ON "tasks" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_learning_chat_messages_employee_id" ON "learning_chat_messages" ("employee_id");

CREATE INDEX IF NOT EXISTS "idx_departments_region" ON "departments" ("region");

CREATE INDEX IF NOT EXISTS "idx_departments_function" ON "departments" ("function");

CREATE INDEX IF NOT EXISTS "idx_departments_risk_level" ON "departments" ("risk_level");

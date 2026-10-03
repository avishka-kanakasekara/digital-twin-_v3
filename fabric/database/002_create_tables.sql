-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.

IF OBJECT_ID(N'dbo.employees', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[employees] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_code] NVARCHAR(400) NOT NULL,
    [full_name] NVARCHAR(400) NOT NULL,
    [initials] NVARCHAR(400),
    [email] NVARCHAR(400) NOT NULL,
    [password_hash] NVARCHAR(MAX),
    [department] NVARCHAR(400),
    [role] NVARCHAR(400),
    [access_role] NVARCHAR(400),
    [team] NVARCHAR(400),
    [manager_id] NVARCHAR(400),
    [manager_name] NVARCHAR(400),
    [location] NVARCHAR(400),
    [timezone_str] NVARCHAR(400),
    [phone] NVARCHAR(400),
    [education] NVARCHAR(MAX) DEFAULT '[]',
    [languages] NVARCHAR(MAX) DEFAULT '[]',
    [biography] NVARCHAR(MAX),
    [headline] NVARCHAR(400),
    [avatar_url] NVARCHAR(MAX),
    [years_experience] INT,
    [years_in_company] INT,
    [employment_type] NVARCHAR(400) DEFAULT 'Full-Time',
    [employment_status] NVARCHAR(400) DEFAULT 'Active',
    [twin_health] INT DEFAULT 0,
    [ai_confidence] INT DEFAULT 0,
    [profile_completeness] INT DEFAULT 0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.user_identities', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[user_identities] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [provider] NVARCHAR(400) NOT NULL,
    [subject] NVARCHAR(400) NOT NULL,
    [email] NVARCHAR(400),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.skills', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[skills] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [category] NVARCHAR(400),
    [sub_category] NVARCHAR(400),
    [icon] NVARCHAR(400),
    [proficiency] INT DEFAULT 0,
    [target_level] INT DEFAULT 0,
    [years_experience] DECIMAL(10,2),
    [trend] NVARCHAR(400) DEFAULT 'stable',
    [ai_confidence] INT,
    [verified] BIT DEFAULT 0,
    [source] NVARCHAR(400),
    [ai_recommendation] NVARCHAR(MAX),
    [last_updated] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.gamification_profiles', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[gamification_profiles] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [level] INT DEFAULT 1,
    [xp] INT DEFAULT 0,
    [next_level_xp] INT DEFAULT 1000,
    [total_xp_earned] INT DEFAULT 0,
    [company_rank] INT,
    [department_rank] INT,
    [streak_days] INT DEFAULT 0,
    [longest_streak] INT DEFAULT 0,
    [last_activity] DATETIMEOFFSET,
    [title] NVARCHAR(400) DEFAULT 'Newcomer',
    [updated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.xp_transactions', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[xp_transactions] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [amount] INT NOT NULL,
    [reason] NVARCHAR(MAX),
    [category] NVARCHAR(400),
    [emoji] NVARCHAR(400),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.achievements', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[achievements] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX),
    [emoji] NVARCHAR(400),
    [xp_value] INT DEFAULT 0,
    [rarity] NVARCHAR(400),
    [criteria_type] NVARCHAR(400),
    [criteria_value] NVARCHAR(MAX),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.employee_achievements', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[employee_achievements] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [achievement_id] NVARCHAR(400) NOT NULL,
    [unlocked_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.challenges', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[challenges] (
    [id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX),
    [xp_reward] INT DEFAULT 0,
    [bonus_badge] NVARCHAR(400),
    [difficulty] NVARCHAR(400),
    [type] NVARCHAR(400),
    [category] NVARCHAR(400),
    [color] NVARCHAR(400),
    [start_date] DATETIMEOFFSET,
    [end_date] DATETIMEOFFSET,
    [is_active] BIT DEFAULT 1,
    [target_skills] NVARCHAR(MAX) DEFAULT '[]',
    [estimated_minutes] INT,
    [learning_objective] NVARCHAR(MAX),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.challenge_progress', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[challenge_progress] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [challenge_id] NVARCHAR(400) NOT NULL,
    [progress] INT DEFAULT 0,
    [completed] BIT DEFAULT 0,
    [enrolled_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [completed_at] DATETIMEOFFSET,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.challenge_steps', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[challenge_steps] (
    [id] NVARCHAR(400) NOT NULL,
    [challenge_id] NVARCHAR(400) NOT NULL,
    [step_order] INT NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [instructions] NVARCHAR(MAX) NOT NULL,
    [submission_type] NVARCHAR(400) NOT NULL DEFAULT 'text',
    [evaluation_rubric] NVARCHAR(MAX) NOT NULL,
    [xp_value] INT NOT NULL DEFAULT 100,
    [reference_url] NVARCHAR(MAX),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.submissions', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[submissions] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [challenge_id] NVARCHAR(400) NOT NULL,
    [step_id] NVARCHAR(400) NOT NULL,
    [submission_type] NVARCHAR(400) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [submitted_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [status] NVARCHAR(400) NOT NULL DEFAULT 'pending',
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.evaluations', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[evaluations] (
    [id] NVARCHAR(400) NOT NULL,
    [submission_id] NVARCHAR(400) NOT NULL,
    [ai_score] INT NOT NULL,
    [pass] BIT NOT NULL,
    [feedback] NVARCHAR(MAX) NOT NULL,
    [xp_awarded] INT NOT NULL DEFAULT 0,
    [evaluated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [raw_model_response] NVARCHAR(MAX),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.learning_paths', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[learning_paths] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX),
    [progress] INT DEFAULT 0,
    [total_courses] INT DEFAULT 0,
    [completed_courses] INT DEFAULT 0,
    [estimated_hours] DECIMAL(10,2),
    [due_date] NVARCHAR(400),
    [tags] NVARCHAR(MAX) DEFAULT '[]',
    [color] NVARCHAR(400),
    [is_ai_recommended] BIT DEFAULT 0,
    [platform] NVARCHAR(400),
    [instructor] NVARCHAR(400),
    [course_ids] NVARCHAR(MAX) DEFAULT '[]',
    [ai_rationale] NVARCHAR(MAX),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.courses', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[courses] (
    [id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [provider] NVARCHAR(400),
    [hours] DECIMAL(10,2),
    [level] NVARCHAR(400),
    [rating] DECIMAL(10,2),
    [enrolled_count] INT DEFAULT 0,
    [tags] NVARCHAR(MAX) DEFAULT '[]',
    [emoji] NVARCHAR(400),
    [color] NVARCHAR(400),
    [description] NVARCHAR(MAX),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.employee_courses', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[employee_courses] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [course_id] NVARCHAR(400) NOT NULL,
    [status] NVARCHAR(400) DEFAULT 'available',
    [progress] INT DEFAULT 0,
    [started_at] DATETIMEOFFSET,
    [completed_at] DATETIMEOFFSET,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.certifications', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[certifications] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [issuer] NVARCHAR(400),
    [status] NVARCHAR(400) DEFAULT 'planned',
    [score] INT,
    [progress] INT DEFAULT 0,
    [credential_id] NVARCHAR(400),
    [completed_date] DATE,
    [expiry_date] DATE,
    [exam_date] NVARCHAR(400),
    [emoji] NVARCHAR(400),
    [color] NVARCHAR(400),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.weekly_schedule_entries', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[weekly_schedule_entries] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [day] NVARCHAR(400) NOT NULL,
    [topic] NVARCHAR(400) NOT NULL,
    [duration] NVARCHAR(400),
    [status] NVARCHAR(400) DEFAULT 'upcoming',
    [color] NVARCHAR(400),
    [week_of] DATE,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.career_goals', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[career_goals] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [target_role] NVARCHAR(400) NOT NULL,
    [timeline] NVARCHAR(400),
    [focus_area] NVARCHAR(400),
    [target_industry] NVARCHAR(400),
    [readiness_score] INT DEFAULT 0,
    [is_active] BIT DEFAULT 1,
    [visible_to_manager] BIT DEFAULT 0,
    [ai_analysis_json] NVARCHAR(MAX),
    [ai_generated_at] DATETIMEOFFSET,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.career_roadmap_steps', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[career_roadmap_steps] (
    [id] NVARCHAR(400) NOT NULL,
    [career_goal_id] NVARCHAR(400) NOT NULL,
    [step_order] INT NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [status] NVARCHAR(400) DEFAULT 'upcoming',
    [description] NVARCHAR(MAX),
    [step_type] NVARCHAR(400) DEFAULT 'learning',
    [related_skill_gap_id] NVARCHAR(400),
    [requires_evidence] BIT DEFAULT 0,
    [evidence_type] NVARCHAR(400),
    [estimated_hours] INT DEFAULT 0,
    [xp_reward] INT DEFAULT 0,
    [due_window] NVARCHAR(400),
    [completed_at] DATETIMEOFFSET,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.readiness_components', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[readiness_components] (
    [id] NVARCHAR(400) NOT NULL,
    [goal_id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [score] INT NOT NULL DEFAULT 0,
    [weight] DECIMAL(10,2) NOT NULL DEFAULT 0,
    [explanation] NVARCHAR(MAX),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.skill_gaps', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[skill_gaps] (
    [id] NVARCHAR(400) NOT NULL,
    [goal_id] NVARCHAR(400) NOT NULL,
    [skill] NVARCHAR(400) NOT NULL,
    [current_level] INT DEFAULT 0,
    [target_level] INT DEFAULT 0,
    [gap] INT DEFAULT 0,
    [recommended_path] NVARCHAR(MAX),
    [estimated_hours] INT DEFAULT 0,
    [status] NVARCHAR(400) DEFAULT 'not_started',
    [path_type] NVARCHAR(400) DEFAULT 'course',
    [priority] NVARCHAR(400) DEFAULT 'Medium',
    [category] NVARCHAR(400),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.evidence_submissions', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[evidence_submissions] (
    [id] NVARCHAR(400) NOT NULL,
    [skill_gap_id] NVARCHAR(400),
    [roadmap_step_id] NVARCHAR(400),
    [employee_id] NVARCHAR(400) NOT NULL,
    [evidence_type] NVARCHAR(400) NOT NULL,
    [file_ref] NVARCHAR(MAX),
    [description] NVARCHAR(MAX),
    [status] NVARCHAR(400) DEFAULT 'submitted',
    [verified_by] NVARCHAR(400),
    [verified_at] DATETIMEOFFSET,
    [xp_awarded] INT DEFAULT 0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.internal_roles', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[internal_roles] (
    [role_id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [department] NVARCHAR(400),
    [required_skills] NVARCHAR(MAX) DEFAULT '[]',
    [is_open] BIT DEFAULT 1,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([role_id])
);
END
GO

IF OBJECT_ID(N'dbo.role_gap_matches', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[role_gap_matches] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [goal_id] NVARCHAR(400) NOT NULL,
    [role_id] NVARCHAR(400) NOT NULL,
    [overall_fit_pct] INT DEFAULT 0,
    [missing_requirements] NVARCHAR(MAX) DEFAULT '[]',
    [computed_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.mentor_matches', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[mentor_matches] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [mentor_employee_id] NVARCHAR(400) NOT NULL,
    [shared_target_role] NVARCHAR(400),
    [shared_skill] NVARCHAR(400),
    [match_reason] NVARCHAR(MAX),
    [intro_requested] BIT DEFAULT 0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.xp_events', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[xp_events] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [source] NVARCHAR(400) NOT NULL,
    [amount] INT NOT NULL DEFAULT 0,
    [timestamp] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [reference_type] NVARCHAR(400),
    [reference_id] NVARCHAR(400),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.stall_flags', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[stall_flags] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [goal_id] NVARCHAR(400) NOT NULL,
    [last_progress_at] DATETIMEOFFSET NOT NULL,
    [flagged_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [resolved] BIT DEFAULT 0,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.knowledge_sources', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[knowledge_sources] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [type] NVARCHAR(400) DEFAULT 'File',
    [connected] BIT DEFAULT 1,
    [file_path] NVARCHAR(MAX),
    [coverage] INT DEFAULT 0,
    [skills_extracted] INT DEFAULT 0,
    [projects_found] INT DEFAULT 0,
    [confidence] INT DEFAULT 0,
    [last_synced] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [original_filename] NVARCHAR(400),
    [mime_type] NVARCHAR(400),
    [file_size] INT,
    [storage_path] NVARCHAR(MAX),
    [source_type] NVARCHAR(400) DEFAULT 'UNKNOWN',
    [content_hash] NVARCHAR(400),
    [status] NVARCHAR(400) DEFAULT 'UPLOADED',
    [processing_stage] NVARCHAR(400),
    [extracted_text] NVARCHAR(MAX),
    [analysis_result] NVARCHAR(MAX),
    [extraction_version] NVARCHAR(400) DEFAULT 1.0,
    [analysis_version] NVARCHAR(400) DEFAULT 1.0,
    [error_code] NVARCHAR(400),
    [error_message] NVARCHAR(MAX),
    [processed_at] DATETIMEOFFSET,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.knowledge_extracted_facts', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[knowledge_extracted_facts] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [source_id] NVARCHAR(400) NOT NULL,
    [fact_type] NVARCHAR(400) NOT NULL,
    [fact_key] NVARCHAR(400) NOT NULL,
    [fact_value] NVARCHAR(MAX) NOT NULL,
    [evidence_text] NVARCHAR(MAX),
    [evidence_page] INT,
    [original_value] NVARCHAR(MAX),
    [canonical_value] NVARCHAR(MAX),
    [confidence] DECIMAL(10,2) DEFAULT 0,
    [source_reliability] DECIMAL(10,2) DEFAULT 0.7,
    [extraction_version] NVARCHAR(400) DEFAULT 1.0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.knowledge_update_events', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[knowledge_update_events] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [source_id] NVARCHAR(400),
    [operation] NVARCHAR(400) NOT NULL,
    [entity_type] NVARCHAR(400) NOT NULL,
    [entity_key] NVARCHAR(400) NOT NULL,
    [old_value] NVARCHAR(MAX),
    [new_value] NVARCHAR(MAX),
    [confidence] DECIMAL(10,2),
    [reason] NVARCHAR(MAX),
    [evidence_text] NVARCHAR(MAX),
    [requires_approval] BIT DEFAULT 0,
    [approval_status] NVARCHAR(400) DEFAULT 'auto_approved',
    [model_name] NVARCHAR(400),
    [model_version] NVARCHAR(400),
    [prompt_version] NVARCHAR(400) DEFAULT 1.0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.reward_items', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[reward_items] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX),
    [cost] INT NOT NULL,
    [emoji] NVARCHAR(400),
    [category] NVARCHAR(400),
    [available] BIT DEFAULT 1,
    [stock] INT,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.reward_claims', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[reward_claims] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [reward_id] NVARCHAR(400) NOT NULL,
    [claimed_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    [status] NVARCHAR(400) DEFAULT 'claimed',
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.recognitions', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[recognitions] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [type] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX),
    [date] NVARCHAR(400),
    [awarded_by] NVARCHAR(400),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.peer_recommendations', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[peer_recommendations] (
    [id] NVARCHAR(400) NOT NULL,
    [from_employee_id] NVARCHAR(400) NOT NULL,
    [to_employee_id] NVARCHAR(400) NOT NULL,
    [category] NVARCHAR(400) NOT NULL DEFAULT 'general',
    [skill] NVARCHAR(400),
    [message] NVARCHAR(MAX) NOT NULL,
    [rating] INT DEFAULT 5,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.projects', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[projects] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [role] NVARCHAR(400),
    [description] NVARCHAR(MAX),
    [technologies] NVARCHAR(MAX) DEFAULT '[]',
    [duration] NVARCHAR(400),
    [domain] NVARCHAR(400),
    [complexity] NVARCHAR(400),
    [success_score] INT DEFAULT 0,
    [leadership_score] INT DEFAULT 0,
    [customer_rating] DECIMAL(10,2),
    [status] NVARCHAR(400) DEFAULT 'On Track',
    [progress] INT DEFAULT 0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.tasks', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[tasks] (
    [id] NVARCHAR(400) NOT NULL,
    [project_id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX),
    [status] NVARCHAR(400) DEFAULT 'Pending',
    [priority] NVARCHAR(400) DEFAULT 'Medium',
    [due_date] DATE,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.learning_chat_messages', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[learning_chat_messages] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [role] NVARCHAR(400) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.learning_feed_cache', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[learning_feed_cache] (
    [employee_id] NVARCHAR(400) NOT NULL,
    [payload] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    [input_hash] NVARCHAR(400),
    [generated_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([employee_id])
);
END
GO

IF OBJECT_ID(N'dbo.departments', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[departments] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [region] NVARCHAR(400) NOT NULL,
    [function] NVARCHAR(400) NOT NULL,
    [headcount] INT NOT NULL,
    [open_positions] INT NOT NULL,
    [allocated_budget] FLOAT NOT NULL,
    [actual_spend] FLOAT NOT NULL,
    [performance_score] INT NOT NULL,
    [target_score] INT NOT NULL,
    [enps] INT NOT NULL,
    [attrition_rate] FLOAT NOT NULL,
    [risk_level] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.organization_metrics', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[organization_metrics] (
    [id] NVARCHAR(400) NOT NULL,
    [month] NVARCHAR(400) NOT NULL,
    [date] NVARCHAR(400) NOT NULL,
    [total_headcount] INT NOT NULL,
    [voluntary_attrition_rate] FLOAT NOT NULL,
    [involuntary_attrition_rate] FLOAT NOT NULL,
    [new_hires] INT NOT NULL,
    [open_positions] INT NOT NULL,
    [enps] INT NOT NULL,
    [training_hours_per_employee] FLOAT NOT NULL,
    [absenteeism_rate] FLOAT NOT NULL,
    [revenue] FLOAT NOT NULL,
    [operating_cost] FLOAT NOT NULL,
    [ebitda] FLOAT NOT NULL,
    [net_profit] FLOAT NOT NULL,
    [marketing_spend] FLOAT NOT NULL,
    [rd_spend] FLOAT NOT NULL,
    [overall_productivity_score] INT NOT NULL,
    [csat] FLOAT NOT NULL,
    [nps] INT NOT NULL,
    [market_share_percentage] FLOAT NOT NULL,
    [project_completion_rate] FLOAT NOT NULL,
    [carbon_footprint_tons] INT NOT NULL,
    [energy_consumption_kwh] INT NOT NULL,
    [compliance_score] INT NOT NULL,
    [security_incidents] INT NOT NULL,
    [anomaly_flag] NVARCHAR(400),
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.organization_scenarios', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[organization_scenarios] (
    [id] NVARCHAR(400) NOT NULL,
    [scenario_name] NVARCHAR(400) NOT NULL,
    [target_metric] NVARCHAR(400) NOT NULL,
    [confidence_level] INT NOT NULL,
    [predicted_impact_percentage] FLOAT NOT NULL,
    [predicted_roi] FLOAT NOT NULL,
    [time_to_impact_months] INT NOT NULL,
    [ai_recommendation] NVARCHAR(MAX) NOT NULL,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_innovation_ideas', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_innovation_ideas] (
    [id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [author_initials] NVARCHAR(400) NOT NULL,
    [author_bg] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [full_description] NVARCHAR(MAX) NOT NULL,
    [roi] NVARCHAR(400) NOT NULL,
    [timeline] NVARCHAR(400) NOT NULL,
    [budget] NVARCHAR(400) NOT NULL,
    [risks] NVARCHAR(MAX) NOT NULL,
    [team_required] NVARCHAR(MAX) NOT NULL,
    [impact_score] INT NOT NULL,
    [feasibility] NVARCHAR(400) NOT NULL,
    [status] NVARCHAR(400) NOT NULL,
    [patent_pending] BIT DEFAULT 0,
    [created_at] DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_innovation_communities', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_innovation_communities] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [members] INT NOT NULL,
    [joined] BIT DEFAULT 0,
    [icon] NVARCHAR(400) NOT NULL,
    [bg_class] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_at_risk_employees', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_at_risk_employees] (
    [id] NVARCHAR(400) NOT NULL,
    [employee_id] NVARCHAR(400),
    [risk_level] NVARCHAR(400) NOT NULL,
    [risk_score] FLOAT NOT NULL,
    [primary_factor] NVARCHAR(400) NOT NULL,
    [burnout_probability] FLOAT NOT NULL,
    [compensation_satisfaction] FLOAT NOT NULL,
    [career_stagnation_score] FLOAT NOT NULL,
    [last_1_on_1] NVARCHAR(400) NOT NULL,
    [ai_retention_suggestion] NVARCHAR(MAX) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_talent_gigs', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_talent_gigs] (
    [id] NVARCHAR(400) NOT NULL,
    [role_title] NVARCHAR(400) NOT NULL,
    [department] NVARCHAR(400) NOT NULL,
    [required_skills] NVARCHAR(MAX) DEFAULT '[]',
    [matched_employees] NVARCHAR(MAX) DEFAULT '[]',
    [urgency] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_talent_mentors', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_talent_mentors] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [role] NVARCHAR(400) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [match_score] INT NOT NULL,
    [initials] NVARCHAR(400) NOT NULL,
    [icon_bg] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_team_builder_options', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_team_builder_options] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [success_rate] INT NOT NULL,
    [compatibility_score] INT NOT NULL,
    [skill_balance] INT NOT NULL,
    [performance_prediction] INT NOT NULL,
    [rationale] NVARCHAR(MAX) NOT NULL,
    [members] NVARCHAR(MAX) DEFAULT '[]',
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_okrs', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_okrs] (
    [id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [owner] NVARCHAR(400) NOT NULL,
    [progress] INT NOT NULL,
    [status] NVARCHAR(400) NOT NULL,
    [initiatives] NVARCHAR(MAX) DEFAULT '[]',
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_strategy_role_specs', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_strategy_role_specs] (
    [id] NVARCHAR(400) NOT NULL,
    [rank] INT NOT NULL,
    [role] NVARCHAR(400) NOT NULL,
    [skill] NVARCHAR(MAX) NOT NULL,
    [dept] NVARCHAR(400) NOT NULL,
    [level] NVARCHAR(400) NOT NULL,
    [gap] NVARCHAR(400) NOT NULL,
    [urgency] NVARCHAR(400) NOT NULL,
    [status] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_strategy_primary_inputs', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_strategy_primary_inputs] (
    [id] NVARCHAR(400) NOT NULL,
    [title] NVARCHAR(MAX) NOT NULL,
    [type] NVARCHAR(400) NOT NULL,
    [status] NVARCHAR(400) NOT NULL,
    [date] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

IF OBJECT_ID(N'dbo.org_strategy_knowledge_assets', N'U') IS NULL
BEGIN
CREATE TABLE [dbo].[org_strategy_knowledge_assets] (
    [id] NVARCHAR(400) NOT NULL,
    [name] NVARCHAR(400) NOT NULL,
    [count] NVARCHAR(400) NOT NULL,
    [color] NVARCHAR(400) NOT NULL,
    PRIMARY KEY ([id])
);
END
GO

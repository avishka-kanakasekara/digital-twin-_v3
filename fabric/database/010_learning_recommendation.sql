-- Learning Recommendation catalogue, plans, assessments, and gap closure.
-- Idempotent. Does not alter the older courses / learning_paths tables.

IF OBJECT_ID(N'dbo.lr_courses', N'U') IS NULL
CREATE TABLE [dbo].[lr_courses] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [course_title] NVARCHAR(400) NOT NULL,
    [provider] NVARCHAR(200) NULL,
    [modality] NVARCHAR(40) NOT NULL,
    [duration_hours] FLOAT NOT NULL,
    [cost_lkr] FLOAT NOT NULL,
    [difficulty_level] NVARCHAR(40) NOT NULL,
    [is_mandatory] INT NOT NULL,
    [mandatory_for_role_ids] NVARCHAR(MAX) NOT NULL,
    [strategic_priority_flag] INT NOT NULL,
    [has_assessment] INT NOT NULL,
    [catalogue_status] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.lr_course_skills', N'U') IS NULL
CREATE TABLE [dbo].[lr_course_skills] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [course_id] NVARCHAR(40) NOT NULL,
    [skill_name] NVARCHAR(200) NOT NULL,
    [level_delivered] INT NOT NULL
);
GO

IF OBJECT_ID(N'dbo.lr_plans', N'U') IS NULL
CREATE TABLE [dbo].[lr_plans] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [employee_id] NVARCHAR(80) NOT NULL,
    [source_gap_reference] NVARCHAR(200) NOT NULL,
    [title] NVARCHAR(400) NOT NULL,
    [target_skill_ids] NVARCHAR(MAX) NOT NULL,
    [plan_status] NVARCHAR(40) NOT NULL,
    [created_at] NVARCHAR(40) NOT NULL,
    [target_completion_date] NVARCHAR(40) NOT NULL,
    [total_estimated_hours] FLOAT NOT NULL,
    [priority_score] FLOAT NOT NULL,
    [abandonment_reason] NVARCHAR(MAX) NULL
);
GO

IF OBJECT_ID(N'dbo.lr_plan_items', N'U') IS NULL
CREATE TABLE [dbo].[lr_plan_items] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [learning_plan_id] NVARCHAR(40) NOT NULL,
    [course_id] NVARCHAR(40) NOT NULL,
    [sequence_order] INT NOT NULL,
    [skill_gap_score] FLOAT NOT NULL,
    [expected_proficiency_gain] INT NOT NULL,
    [status] NVARCHAR(40) NOT NULL,
    [enrolled_at] NVARCHAR(40) NULL,
    [completed_at] NVARCHAR(40) NULL
);
GO

IF OBJECT_ID(N'dbo.lr_assessments', N'U') IS NULL
CREATE TABLE [dbo].[lr_assessments] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [learning_plan_item_id] NVARCHAR(40) NOT NULL,
    [employee_id] NVARCHAR(80) NOT NULL,
    [skill_name] NVARCHAR(200) NOT NULL,
    [proficiency_before] INT NOT NULL,
    [proficiency_after] INT NULL,
    [intended_proficiency] INT NOT NULL,
    [assessment_score_pct] INT NOT NULL,
    [assessment_date] NVARCHAR(40) NOT NULL,
    [passed] INT NOT NULL,
    [sfa_sync_status] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.lr_gap_closures', N'U') IS NULL
CREATE TABLE [dbo].[lr_gap_closures] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [source_gap_reference] NVARCHAR(200) NOT NULL,
    [employee_id] NVARCHAR(80) NOT NULL,
    [skill_name] NVARCHAR(200) NOT NULL,
    [before_level] INT NOT NULL,
    [after_level] INT NOT NULL,
    [required_level] INT NOT NULL,
    [closure_status] NVARCHAR(40) NOT NULL,
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.lr_id_counters', N'U') IS NULL
CREATE TABLE [dbo].[lr_id_counters] (
    [prefix] NVARCHAR(20) NOT NULL PRIMARY KEY,
    [next_value] INT NOT NULL
);
GO

IF OBJECT_ID(N'dbo.lr_audit', N'U') IS NULL
CREATE TABLE [dbo].[lr_audit] (
    [id] NVARCHAR(40) NOT NULL PRIMARY KEY,
    [employee_id] NVARCHAR(80) NULL,
    [event] NVARCHAR(80) NOT NULL,
    [detail] NVARCHAR(MAX) NULL,
    [created_at] NVARCHAR(40) NOT NULL
);
GO

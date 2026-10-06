-- Module 6: Succession & Knowledge Transfer.
-- Role register (business-critical flag), succession records with ranked slates and the HR
-- approval gate, knowledge transfer plans and tasks, and an audit trail. Idempotent.
-- The API also runs these statements at startup (app.services.succession.ensure_schema).

IF OBJECT_ID(N'dbo.succession_roles', N'U') IS NULL
CREATE TABLE [dbo].[succession_roles] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [role_title] NVARCHAR(200) NOT NULL,
    [department] NVARCHAR(200),
    [incumbent_employee_id] NVARCHAR(400) NOT NULL,
    [owner_manager_id] NVARCHAR(400),
    [is_business_critical] BIT NOT NULL DEFAULT 0,
    [criticality_reason] NVARCHAR(MAX),
    [departure_risk] NVARCHAR(20) NOT NULL DEFAULT 'Medium',
    [expected_departure_date] NVARCHAR(40),
    [requirements_json] NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    [flagged_by] NVARCHAR(200),
    [flagged_at] NVARCHAR(40),
    [created_at] NVARCHAR(40) NOT NULL,
    [updated_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.succession_records', N'U') IS NULL
CREATE TABLE [dbo].[succession_records] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [role_id] NVARCHAR(80) NOT NULL,
    [incumbent_employee_id] NVARCHAR(400) NOT NULL,
    [trigger_reason] NVARCHAR(40) NOT NULL,
    [trigger_note] NVARCHAR(MAX),
    [requested_by] NVARCHAR(200),
    [pairing_status] NVARCHAR(40) NOT NULL,
    [nominee_employee_id] NVARCHAR(400),
    [approved_by_hr] BIT NOT NULL DEFAULT 0,
    [approved_by] NVARCHAR(200),
    [approved_at] NVARCHAR(40),
    [decision_note] NVARCHAR(MAX),
    [shared_with_candidates] BIT NOT NULL DEFAULT 0,
    [generated_at] NVARCHAR(40) NOT NULL,
    [created_at] NVARCHAR(40) NOT NULL,
    [updated_at] NVARCHAR(40) NOT NULL,
    CONSTRAINT [ck_succession_trigger] CHECK ([trigger_reason] IN (N'Business-Critical Flag', N'HR Request')),
    CONSTRAINT [ck_succession_status] CHECK ([pairing_status] IN (N'Slate Generated', N'Candidate Nominated', N'Confirmed', N'Withdrawn')),
    CONSTRAINT [ck_succession_confirmed_needs_hr] CHECK ([pairing_status] <> N'Confirmed' OR [approved_by_hr] = 1)
);
GO

IF OBJECT_ID(N'dbo.succession_candidates', N'U') IS NULL
CREATE TABLE [dbo].[succession_candidates] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [succession_record_id] NVARCHAR(80) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [rank_position] INT NOT NULL,
    [candidate_readiness_score] INT NOT NULL,
    [candidate_skill_gap_pct] FLOAT NOT NULL,
    [readiness_band] NVARCHAR(60) NOT NULL,
    [components_json] NVARCHAR(MAX) NOT NULL,
    [gaps_json] NVARCHAR(MAX) NOT NULL,
    [strengths_json] NVARCHAR(MAX) NOT NULL,
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.kt_plans', N'U') IS NULL
CREATE TABLE [dbo].[kt_plans] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [succession_record_id] NVARCHAR(80) NOT NULL,
    [role_id] NVARCHAR(80) NOT NULL,
    [incumbent_employee_id] NVARCHAR(400) NOT NULL,
    [successor_employee_id] NVARCHAR(400),
    [opened_reason] NVARCHAR(60) NOT NULL,
    [status] NVARCHAR(40) NOT NULL,
    [overall_progress_pct] FLOAT NOT NULL DEFAULT 0,
    [target_handover_date] NVARCHAR(40) NOT NULL,
    [drafted_by] NVARCHAR(40),
    [created_by] NVARCHAR(200),
    [created_at] NVARCHAR(40) NOT NULL,
    [updated_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.kt_tasks', N'U') IS NULL
CREATE TABLE [dbo].[kt_tasks] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [plan_id] NVARCHAR(80) NOT NULL,
    [task_type] NVARCHAR(60) NOT NULL,
    [title] NVARCHAR(300) NOT NULL,
    [description] NVARCHAR(MAX),
    [knowledge_area] NVARCHAR(200),
    [owner_employee_id] NVARCHAR(400),
    [due_date] NVARCHAR(40) NOT NULL,
    [status] NVARCHAR(40) NOT NULL,
    [completed_at] NVARCHAR(40),
    [notes] NVARCHAR(MAX),
    [sort_order] INT NOT NULL DEFAULT 0,
    [created_at] NVARCHAR(40) NOT NULL,
    [updated_at] NVARCHAR(40) NOT NULL,
    CONSTRAINT [ck_kt_task_type] CHECK ([task_type] IN (N'Shadowing Session', N'Documentation Task', N'Mentor Meeting', N'Handover Checklist Item')),
    CONSTRAINT [ck_kt_task_status] CHECK ([status] IN (N'Not Started', N'In Progress', N'Blocked', N'Complete'))
);
GO

IF OBJECT_ID(N'dbo.succession_audit', N'U') IS NULL
CREATE TABLE [dbo].[succession_audit] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [record_id] NVARCHAR(80),
    [entity_type] NVARCHAR(40) NOT NULL,
    [entity_id] NVARCHAR(80) NOT NULL,
    [action] NVARCHAR(80) NOT NULL,
    [actor] NVARCHAR(200),
    [detail] NVARCHAR(MAX),
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_succession_roles_owner' AND object_id = OBJECT_ID(N'dbo.succession_roles'))
CREATE INDEX [ix_succession_roles_owner] ON [dbo].[succession_roles] ([owner_manager_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_succession_roles_incumbent' AND object_id = OBJECT_ID(N'dbo.succession_roles'))
CREATE INDEX [ix_succession_roles_incumbent] ON [dbo].[succession_roles] ([incumbent_employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_succession_records_role' AND object_id = OBJECT_ID(N'dbo.succession_records'))
CREATE INDEX [ix_succession_records_role] ON [dbo].[succession_records] ([role_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_succession_candidates_record' AND object_id = OBJECT_ID(N'dbo.succession_candidates'))
CREATE INDEX [ix_succession_candidates_record] ON [dbo].[succession_candidates] ([succession_record_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_succession_candidates_employee' AND object_id = OBJECT_ID(N'dbo.succession_candidates'))
CREATE INDEX [ix_succession_candidates_employee] ON [dbo].[succession_candidates] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_kt_plans_record' AND object_id = OBJECT_ID(N'dbo.kt_plans'))
CREATE INDEX [ix_kt_plans_record] ON [dbo].[kt_plans] ([succession_record_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_kt_tasks_plan' AND object_id = OBJECT_ID(N'dbo.kt_tasks'))
CREATE INDEX [ix_kt_tasks_plan] ON [dbo].[kt_tasks] ([plan_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_kt_tasks_owner' AND object_id = OBJECT_ID(N'dbo.kt_tasks'))
CREATE INDEX [ix_kt_tasks_owner] ON [dbo].[kt_tasks] ([owner_employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_succession_audit_record' AND object_id = OBJECT_ID(N'dbo.succession_audit'))
CREATE INDEX [ix_succession_audit_record] ON [dbo].[succession_audit] ([record_id]);
GO

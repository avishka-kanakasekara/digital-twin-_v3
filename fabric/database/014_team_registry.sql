-- Team registry, invitations, success predictions, and verified project outcomes.
-- Repeatable. Does not drop or update existing rows.
-- The API applies the same tables at startup (team_registry.ensure_schema).

IF OBJECT_ID(N'dbo.workforce_teams', N'U') IS NULL
CREATE TABLE [dbo].[workforce_teams] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(200) NOT NULL,
    [description] NVARCHAR(MAX),
    [objective] NVARCHAR(MAX),
    [team_type] NVARCHAR(120),
    [project_type] NVARCHAR(200),
    [origin] NVARCHAR(40) NOT NULL,
    [creator_id] NVARCHAR(400) NOT NULL,
    [owner_id] NVARCHAR(400) NOT NULL,
    [leader_id] NVARCHAR(400),
    [project_id] NVARCHAR(400),
    [project_name] NVARCHAR(400),
    [headcount] INT NOT NULL,
    [allocation_pct] INT NOT NULL,
    [start_date] NVARCHAR(40),
    [end_date] NVARCHAR(40),
    [skills_json] NVARCHAR(MAX) NOT NULL,
    [roles_json] NVARCHAR(MAX) NOT NULL,
    [context] NVARCHAR(MAX),
    [registration_status] NVARCHAR(40) NOT NULL,
    [operational_status] NVARCHAR(40) NOT NULL,
    [option_id] NVARCHAR(80),
    [decision_note] NVARCHAR(MAX),
    [decided_by] NVARCHAR(200),
    [decided_at] NVARCHAR(40),
    [created_at] NVARCHAR(40) NOT NULL,
    [updated_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.workforce_team_members', N'U') IS NULL
CREATE TABLE [dbo].[workforce_team_members] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [team_id] NVARCHAR(80) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [member_role] NVARCHAR(40) NOT NULL,
    [membership_status] NVARCHAR(40) NOT NULL,
    [source] NVARCHAR(40) NOT NULL,
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_wt_member')
CREATE UNIQUE INDEX [ux_wt_member] ON [dbo].[workforce_team_members] ([team_id], [employee_id]);
GO

IF OBJECT_ID(N'dbo.workforce_team_invitations', N'U') IS NULL
CREATE TABLE [dbo].[workforce_team_invitations] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [team_id] NVARCHAR(80) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [invited_by] NVARCHAR(400) NOT NULL,
    [status] NVARCHAR(40) NOT NULL,
    [created_at] NVARCHAR(40) NOT NULL,
    [responded_at] NVARCHAR(40)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_wt_invite_pending')
CREATE UNIQUE INDEX [ux_wt_invite_pending] ON [dbo].[workforce_team_invitations] ([team_id], [employee_id], [status]);
GO

IF OBJECT_ID(N'dbo.team_success_predictions', N'U') IS NULL
CREATE TABLE [dbo].[team_success_predictions] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [team_id] NVARCHAR(80),
    [option_id] NVARCHAR(80),
    [run_id] NVARCHAR(80),
    [roster_fingerprint] NVARCHAR(MAX) NOT NULL,
    [probability] FLOAT,
    [status] NVARCHAR(40) NOT NULL,
    [model_version] NVARCHAR(120),
    [model_type] NVARCHAR(80),
    [training_data_type] NVARCHAR(40),
    [feature_schema] NVARCHAR(80),
    [features_json] NVARCHAR(MAX) NOT NULL,
    [notes_json] NVARCHAR(MAX) NOT NULL,
    [warning] NVARCHAR(MAX),
    [evaluated_by] NVARCHAR(200),
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.project_outcomes', N'U') IS NULL
CREATE TABLE [dbo].[project_outcomes] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [project_id] NVARCHAR(400),
    [project_name] NVARCHAR(400) NOT NULL,
    [team_id] NVARCHAR(80),
    [outcome_label] NVARCHAR(40) NOT NULL,
    [definition] NVARCHAR(MAX) NOT NULL,
    [acceptance_status] NVARCHAR(80),
    [planned_end] NVARCHAR(40),
    [actual_end] NVARCHAR(40),
    [recorded_by] NVARCHAR(200) NOT NULL,
    [verified] INT NOT NULL,
    [recorded_at] NVARCHAR(40) NOT NULL
);
GO

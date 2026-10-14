-- Team Builder: persisted briefs, runs, capacity, aliases, and assembly.
-- Repeatable. Adds columns to org_team_builder_options. Does not drop rows.
-- The API applies the same changes at startup (team_builder.ensure_schema).
-- Apply on Fabric only after reviewing the script. It does not delete data.

IF OBJECT_ID(N'dbo.skill_aliases', N'U') IS NULL
CREATE TABLE [dbo].[skill_aliases] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [canonical_name] NVARCHAR(200) NOT NULL,
    [alias] NVARCHAR(200) NOT NULL,
    [created_at] NVARCHAR(40)
);
GO

IF OBJECT_ID(N'dbo.employee_capacity', N'U') IS NULL
CREATE TABLE [dbo].[employee_capacity] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [employee_id] NVARCHAR(400) NOT NULL,
    [start_date] NVARCHAR(40),
    [end_date] NVARCHAR(40),
    [allocatable_pct] INT NOT NULL,
    [notes] NVARCHAR(MAX),
    [updated_by] NVARCHAR(200),
    [updated_at] NVARCHAR(40),
    [reviewed] INT NOT NULL DEFAULT 0
);
GO

IF OBJECT_ID(N'dbo.team_builder_requests', N'U') IS NULL
CREATE TABLE [dbo].[team_builder_requests] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [project_id] NVARCHAR(400),
    [project_name] NVARCHAR(400) NOT NULL,
    [objective] NVARCHAR(MAX),
    [project_type] NVARCHAR(200),
    [owner_employee_id] NVARCHAR(400),
    [start_date] NVARCHAR(40),
    [end_date] NVARCHAR(40),
    [headcount] INT NOT NULL,
    [allocation_pct] INT NOT NULL,
    [context] NVARCHAR(MAX),
    [allow_smaller] INT NOT NULL DEFAULT 0,
    [skills_json] NVARCHAR(MAX) NOT NULL,
    [roles_json] NVARCHAR(MAX) NOT NULL,
    [requested_by] NVARCHAR(200),
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.team_builder_runs', N'U') IS NULL
CREATE TABLE [dbo].[team_builder_runs] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [request_id] NVARCHAR(80) NOT NULL,
    [algorithm_version] NVARCHAR(80) NOT NULL,
    [status] NVARCHAR(40) NOT NULL,
    [warnings_json] NVARCHAR(MAX),
    [eligible_count] INT NOT NULL,
    [requested_headcount] INT NOT NULL,
    [context_skills_json] NVARCHAR(MAX),
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.team_builder_members', N'U') IS NULL
CREATE TABLE [dbo].[team_builder_members] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [option_id] NVARCHAR(80) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [explanation] NVARCHAR(MAX),
    [capacity_status] NVARCHAR(40),
    [matched_json] NVARCHAR(MAX),
    [warnings_json] NVARCHAR(MAX),
    [requirement_score] INT NOT NULL
);
GO

IF OBJECT_ID(N'dbo.team_builder_assignments', N'U') IS NULL
CREATE TABLE [dbo].[team_builder_assignments] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [option_id] NVARCHAR(80) NOT NULL,
    [request_id] NVARCHAR(80) NOT NULL,
    [employee_id] NVARCHAR(400) NOT NULL,
    [project_id] NVARCHAR(400),
    [project_name] NVARCHAR(400) NOT NULL,
    [role_title] NVARCHAR(200),
    [allocation_pct] INT NOT NULL,
    [start_date] NVARCHAR(40),
    [end_date] NVARCHAR(40),
    [status] NVARCHAR(40) NOT NULL,
    [assembled_by] NVARCHAR(200),
    [assembled_at] NVARCHAR(40) NOT NULL
);
GO

IF OBJECT_ID(N'dbo.team_builder_audit', N'U') IS NULL
CREATE TABLE [dbo].[team_builder_audit] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [entity_type] NVARCHAR(40) NOT NULL,
    [entity_id] NVARCHAR(80) NOT NULL,
    [action] NVARCHAR(80) NOT NULL,
    [actor] NVARCHAR(200),
    [detail] NVARCHAR(MAX),
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF COL_LENGTH(N'dbo.org_team_builder_options', N'run_id') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [run_id] NVARCHAR(80);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'request_id') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [request_id] NVARCHAR(80);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'strategy') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [strategy] NVARCHAR(80);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'option_status') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [option_status] NVARCHAR(40);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'feasibility') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [feasibility] NVARCHAR(40);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'metrics_json') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [metrics_json] NVARCHAR(MAX);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'warnings_json') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [warnings_json] NVARCHAR(MAX);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'gaps_json') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [gaps_json] NVARCHAR(MAX);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'actual_headcount') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [actual_headcount] INT;
IF COL_LENGTH(N'dbo.org_team_builder_options', N'requested_headcount') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [requested_headcount] INT;
IF COL_LENGTH(N'dbo.org_team_builder_options', N'score_basis') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [score_basis] NVARCHAR(40);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'recommendation_score') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [recommendation_score] INT;
IF COL_LENGTH(N'dbo.org_team_builder_options', N'created_at') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [created_at] NVARCHAR(40);
IF COL_LENGTH(N'dbo.org_team_builder_options', N'updated_at') IS NULL ALTER TABLE [dbo].[org_team_builder_options] ADD [updated_at] NVARCHAR(40);
GO

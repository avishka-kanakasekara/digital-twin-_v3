-- Requests to join a recommended team.
-- Repeatable. Does not drop or update existing rows.
-- The API creates the same table at startup.

IF OBJECT_ID(N'dbo.workforce_join_requests', N'U') IS NULL
CREATE TABLE [dbo].[workforce_join_requests] (
    [id] NVARCHAR(80) NOT NULL PRIMARY KEY,
    [team_id] NVARCHAR(80) NOT NULL,
    [option_id] NVARCHAR(80),
    [employee_id] NVARCHAR(400) NOT NULL,
    [note] NVARCHAR(MAX),
    [status] NVARCHAR(40) NOT NULL,
    [decided_by] NVARCHAR(200),
    [decided_at] NVARCHAR(40),
    [created_at] NVARCHAR(40) NOT NULL
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_wt_join_status')
CREATE UNIQUE INDEX [ux_wt_join_status] ON [dbo].[workforce_join_requests] ([team_id], [employee_id], [status]);
GO

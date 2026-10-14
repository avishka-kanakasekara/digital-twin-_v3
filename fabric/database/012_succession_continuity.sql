-- Continuity fields for the succession register.
-- Repeatable. Does not drop or recreate the tables created in 011.
-- The API applies the same columns at startup (succession._ensure_columns).

IF COL_LENGTH(N'dbo.succession_roles', N'role_family') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [role_family] NVARCHAR(200);
IF COL_LENGTH(N'dbo.succession_roles', N'departure_scenario') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [departure_scenario] NVARCHAR(40);
IF COL_LENGTH(N'dbo.succession_roles', N'interim_backup_employee_id') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [interim_backup_employee_id] NVARCHAR(400);
IF COL_LENGTH(N'dbo.succession_roles', N'interim_backup_note') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [interim_backup_note] NVARCHAR(MAX);
IF COL_LENGTH(N'dbo.succession_roles', N'criticality_json') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [criticality_json] NVARCHAR(MAX);
IF COL_LENGTH(N'dbo.succession_roles', N'last_review_date') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [last_review_date] NVARCHAR(40);
IF COL_LENGTH(N'dbo.succession_roles', N'next_review_date') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [next_review_date] NVARCHAR(40);
IF COL_LENGTH(N'dbo.succession_roles', N'external_contingency') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [external_contingency] INT NOT NULL DEFAULT 0;
IF COL_LENGTH(N'dbo.succession_roles', N'position_status') IS NULL ALTER TABLE [dbo].[succession_roles] ADD [position_status] NVARCHAR(40);
GO

IF COL_LENGTH(N'dbo.succession_records', N'excluded_json') IS NULL ALTER TABLE [dbo].[succession_records] ADD [excluded_json] NVARCHAR(MAX);
GO

IF COL_LENGTH(N'dbo.kt_plans', N'assurance_status') IS NULL ALTER TABLE [dbo].[kt_plans] ADD [assurance_status] NVARCHAR(40);
IF COL_LENGTH(N'dbo.kt_plans', N'validated_by') IS NULL ALTER TABLE [dbo].[kt_plans] ADD [validated_by] NVARCHAR(200);
IF COL_LENGTH(N'dbo.kt_plans', N'validated_at') IS NULL ALTER TABLE [dbo].[kt_plans] ADD [validated_at] NVARCHAR(40);
IF COL_LENGTH(N'dbo.kt_plans', N'validation_note') IS NULL ALTER TABLE [dbo].[kt_plans] ADD [validation_note] NVARCHAR(MAX);
GO

IF COL_LENGTH(N'dbo.kt_tasks', N'evidence_note') IS NULL ALTER TABLE [dbo].[kt_tasks] ADD [evidence_note] NVARCHAR(MAX);
IF COL_LENGTH(N'dbo.kt_tasks', N'verification_status') IS NULL ALTER TABLE [dbo].[kt_tasks] ADD [verification_status] NVARCHAR(40);
IF COL_LENGTH(N'dbo.kt_tasks', N'verified_by') IS NULL ALTER TABLE [dbo].[kt_tasks] ADD [verified_by] NVARCHAR(200);
IF COL_LENGTH(N'dbo.kt_tasks', N'verified_at') IS NULL ALTER TABLE [dbo].[kt_tasks] ADD [verified_at] NVARCHAR(40);
IF COL_LENGTH(N'dbo.kt_tasks', N'cancelled_at') IS NULL ALTER TABLE [dbo].[kt_tasks] ADD [cancelled_at] NVARCHAR(40);
IF COL_LENGTH(N'dbo.kt_tasks', N'cancel_reason') IS NULL ALTER TABLE [dbo].[kt_tasks] ADD [cancel_reason] NVARCHAR(MAX);
GO

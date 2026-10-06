-- Rollback for 011_succession_knowledge_transfer.sql. Drops Module 6 tables only.

IF OBJECT_ID(N'dbo.succession_audit', N'U') IS NOT NULL DROP TABLE [dbo].[succession_audit];
GO
IF OBJECT_ID(N'dbo.kt_tasks', N'U') IS NOT NULL DROP TABLE [dbo].[kt_tasks];
GO
IF OBJECT_ID(N'dbo.kt_plans', N'U') IS NOT NULL DROP TABLE [dbo].[kt_plans];
GO
IF OBJECT_ID(N'dbo.succession_candidates', N'U') IS NOT NULL DROP TABLE [dbo].[succession_candidates];
GO
IF OBJECT_ID(N'dbo.succession_records', N'U') IS NOT NULL DROP TABLE [dbo].[succession_records];
GO
IF OBJECT_ID(N'dbo.succession_roles', N'U') IS NOT NULL DROP TABLE [dbo].[succession_roles];
GO

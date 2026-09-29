-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'dbo') EXEC(N'CREATE SCHEMA dbo');
GO

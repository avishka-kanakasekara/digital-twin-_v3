-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.


-- XP, recommendations, and challenge evaluation stay in FastAPI so Gemini
-- calls and HTTP responses remain in one transaction boundary with the app.
IF OBJECT_ID(N'dbo.usp_database_health', N'P') IS NOT NULL DROP PROCEDURE [dbo].[usp_database_health];
GO
CREATE PROCEDURE [dbo].[usp_database_health]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [dbo].[fn_database_health]() AS status, SYSUTCDATETIME() AS checked_at;
END;
GO

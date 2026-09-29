-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.


-- No PostgreSQL functions were used by the application.
-- Business rules stay in FastAPI services. This function only supports health checks.
IF OBJECT_ID(N'dbo.fn_database_health', N'FN') IS NOT NULL DROP FUNCTION [dbo].[fn_database_health];
GO
CREATE FUNCTION [dbo].[fn_database_health]()
RETURNS NVARCHAR(20)
AS
BEGIN
    RETURN N'ok';
END;
GO

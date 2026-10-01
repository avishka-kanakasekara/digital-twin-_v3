-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.


IF OBJECT_ID(N'dbo.v_employee_skill_summary', N'V') IS NOT NULL DROP VIEW [dbo].[v_employee_skill_summary];
GO
CREATE VIEW [dbo].[v_employee_skill_summary] AS
SELECT e.[id] AS employee_id, e.[full_name], e.[department],
       COUNT(s.[id]) AS skill_count, AVG(CAST(s.[proficiency] AS FLOAT)) AS avg_proficiency
FROM [dbo].[employees] e
LEFT JOIN [dbo].[skills] s ON s.[employee_id] = e.[id]
GROUP BY e.[id], e.[full_name], e.[department];
GO

IF OBJECT_ID(N'dbo.v_gamification_leaderboard', N'V') IS NOT NULL DROP VIEW [dbo].[v_gamification_leaderboard];
GO
CREATE VIEW [dbo].[v_gamification_leaderboard] AS
SELECT g.[employee_id], e.[full_name], e.[department], g.[level], g.[total_xp_earned], g.[streak_days]
FROM [dbo].[gamification_profiles] g
INNER JOIN [dbo].[employees] e ON e.[id] = g.[employee_id];
GO

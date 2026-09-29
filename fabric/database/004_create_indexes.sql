-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_employees_department' AND object_id = OBJECT_ID(N'dbo.employees'))
CREATE INDEX [idx_employees_department] ON [dbo].[employees] ([department]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_employees_email' AND object_id = OBJECT_ID(N'dbo.employees'))
CREATE INDEX [idx_employees_email] ON [dbo].[employees] ([email]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_user_identities_employee_id' AND object_id = OBJECT_ID(N'dbo.user_identities'))
CREATE INDEX [idx_user_identities_employee_id] ON [dbo].[user_identities] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_skills_employee_id' AND object_id = OBJECT_ID(N'dbo.skills'))
CREATE INDEX [idx_skills_employee_id] ON [dbo].[skills] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_xp_transactions_employee_id' AND object_id = OBJECT_ID(N'dbo.xp_transactions'))
CREATE INDEX [idx_xp_transactions_employee_id] ON [dbo].[xp_transactions] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_xp_transactions_created_at' AND object_id = OBJECT_ID(N'dbo.xp_transactions'))
CREATE INDEX [idx_xp_transactions_created_at] ON [dbo].[xp_transactions] ([created_at]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_challenges_is_active_category' AND object_id = OBJECT_ID(N'dbo.challenges'))
CREATE INDEX [idx_challenges_is_active_category] ON [dbo].[challenges] ([is_active], [category]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_challenge_steps_challenge_id' AND object_id = OBJECT_ID(N'dbo.challenge_steps'))
CREATE INDEX [idx_challenge_steps_challenge_id] ON [dbo].[challenge_steps] ([challenge_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_submissions_employee_id_step_id' AND object_id = OBJECT_ID(N'dbo.submissions'))
CREATE INDEX [idx_submissions_employee_id_step_id] ON [dbo].[submissions] ([employee_id], [step_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_evaluations_submission_id' AND object_id = OBJECT_ID(N'dbo.evaluations'))
CREATE INDEX [idx_evaluations_submission_id] ON [dbo].[evaluations] ([submission_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_learning_paths_employee_id' AND object_id = OBJECT_ID(N'dbo.learning_paths'))
CREATE INDEX [idx_learning_paths_employee_id] ON [dbo].[learning_paths] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_certifications_employee_id' AND object_id = OBJECT_ID(N'dbo.certifications'))
CREATE INDEX [idx_certifications_employee_id] ON [dbo].[certifications] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_weekly_schedule_entries_employee_id' AND object_id = OBJECT_ID(N'dbo.weekly_schedule_entries'))
CREATE INDEX [idx_weekly_schedule_entries_employee_id] ON [dbo].[weekly_schedule_entries] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_career_goals_employee_id' AND object_id = OBJECT_ID(N'dbo.career_goals'))
CREATE INDEX [idx_career_goals_employee_id] ON [dbo].[career_goals] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_career_roadmap_steps_career_goal_id' AND object_id = OBJECT_ID(N'dbo.career_roadmap_steps'))
CREATE INDEX [idx_career_roadmap_steps_career_goal_id] ON [dbo].[career_roadmap_steps] ([career_goal_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_skill_gaps_goal_id' AND object_id = OBJECT_ID(N'dbo.skill_gaps'))
CREATE INDEX [idx_skill_gaps_goal_id] ON [dbo].[skill_gaps] ([goal_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_evidence_submissions_employee_id' AND object_id = OBJECT_ID(N'dbo.evidence_submissions'))
CREATE INDEX [idx_evidence_submissions_employee_id] ON [dbo].[evidence_submissions] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_mentor_matches_employee_id' AND object_id = OBJECT_ID(N'dbo.mentor_matches'))
CREATE INDEX [idx_mentor_matches_employee_id] ON [dbo].[mentor_matches] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_xp_events_employee_id' AND object_id = OBJECT_ID(N'dbo.xp_events'))
CREATE INDEX [idx_xp_events_employee_id] ON [dbo].[xp_events] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_sources_employee_id' AND object_id = OBJECT_ID(N'dbo.knowledge_sources'))
CREATE INDEX [idx_knowledge_sources_employee_id] ON [dbo].[knowledge_sources] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_sources_content_hash' AND object_id = OBJECT_ID(N'dbo.knowledge_sources'))
CREATE INDEX [idx_knowledge_sources_content_hash] ON [dbo].[knowledge_sources] ([content_hash]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_sources_status' AND object_id = OBJECT_ID(N'dbo.knowledge_sources'))
CREATE INDEX [idx_knowledge_sources_status] ON [dbo].[knowledge_sources] ([status]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_extracted_facts_employee_id' AND object_id = OBJECT_ID(N'dbo.knowledge_extracted_facts'))
CREATE INDEX [idx_knowledge_extracted_facts_employee_id] ON [dbo].[knowledge_extracted_facts] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_extracted_facts_source_id' AND object_id = OBJECT_ID(N'dbo.knowledge_extracted_facts'))
CREATE INDEX [idx_knowledge_extracted_facts_source_id] ON [dbo].[knowledge_extracted_facts] ([source_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_extracted_facts_fact_type' AND object_id = OBJECT_ID(N'dbo.knowledge_extracted_facts'))
CREATE INDEX [idx_knowledge_extracted_facts_fact_type] ON [dbo].[knowledge_extracted_facts] ([fact_type]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_update_events_employee_id' AND object_id = OBJECT_ID(N'dbo.knowledge_update_events'))
CREATE INDEX [idx_knowledge_update_events_employee_id] ON [dbo].[knowledge_update_events] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_update_events_source_id' AND object_id = OBJECT_ID(N'dbo.knowledge_update_events'))
CREATE INDEX [idx_knowledge_update_events_source_id] ON [dbo].[knowledge_update_events] ([source_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_knowledge_update_events_created_at' AND object_id = OBJECT_ID(N'dbo.knowledge_update_events'))
CREATE INDEX [idx_knowledge_update_events_created_at] ON [dbo].[knowledge_update_events] ([created_at]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_reward_claims_employee_id' AND object_id = OBJECT_ID(N'dbo.reward_claims'))
CREATE INDEX [idx_reward_claims_employee_id] ON [dbo].[reward_claims] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_recognitions_employee_id' AND object_id = OBJECT_ID(N'dbo.recognitions'))
CREATE INDEX [idx_recognitions_employee_id] ON [dbo].[recognitions] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_recognitions_type' AND object_id = OBJECT_ID(N'dbo.recognitions'))
CREATE INDEX [idx_recognitions_type] ON [dbo].[recognitions] ([type]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_peer_recommendations_to_employee_id' AND object_id = OBJECT_ID(N'dbo.peer_recommendations'))
CREATE INDEX [idx_peer_recommendations_to_employee_id] ON [dbo].[peer_recommendations] ([to_employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_peer_recommendations_from_employee_id' AND object_id = OBJECT_ID(N'dbo.peer_recommendations'))
CREATE INDEX [idx_peer_recommendations_from_employee_id] ON [dbo].[peer_recommendations] ([from_employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_projects_employee_id' AND object_id = OBJECT_ID(N'dbo.projects'))
CREATE INDEX [idx_projects_employee_id] ON [dbo].[projects] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_tasks_project_id' AND object_id = OBJECT_ID(N'dbo.tasks'))
CREATE INDEX [idx_tasks_project_id] ON [dbo].[tasks] ([project_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_tasks_employee_id' AND object_id = OBJECT_ID(N'dbo.tasks'))
CREATE INDEX [idx_tasks_employee_id] ON [dbo].[tasks] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_learning_chat_messages_employee_id' AND object_id = OBJECT_ID(N'dbo.learning_chat_messages'))
CREATE INDEX [idx_learning_chat_messages_employee_id] ON [dbo].[learning_chat_messages] ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_departments_region' AND object_id = OBJECT_ID(N'dbo.departments'))
CREATE INDEX [idx_departments_region] ON [dbo].[departments] ([region]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_departments_function' AND object_id = OBJECT_ID(N'dbo.departments'))
CREATE INDEX [idx_departments_function] ON [dbo].[departments] ([function]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_departments_risk_level' AND object_id = OBJECT_ID(N'dbo.departments'))
CREATE INDEX [idx_departments_risk_level] ON [dbo].[departments] ([risk_level]);
GO

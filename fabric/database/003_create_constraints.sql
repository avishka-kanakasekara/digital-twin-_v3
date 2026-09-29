-- Employee Digital Twin operational schema
-- Target: SQL database in Microsoft Fabric
-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.

-- Foreign keys, unique keys, and checks.
-- Applied after tables so the dependency order does not matter.
-- SQL Server rejects multiple cascade paths, so only one CASCADE is kept
-- per child table (prefer employee_id). Other FKs use NO ACTION.

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_employees_employee_code')
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [uq_employees_employee_code] UNIQUE ([employee_code]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_employees_email')
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [uq_employees_email] UNIQUE ([email]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_user_identities_provider_subject')
ALTER TABLE [dbo].[user_identities] ADD CONSTRAINT [uq_user_identities_provider_subject] UNIQUE ([provider], [subject]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_user_identities_employee_id')
ALTER TABLE [dbo].[user_identities] ADD CONSTRAINT [fk_user_identities_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_skills_employee_id_name')
ALTER TABLE [dbo].[skills] ADD CONSTRAINT [uq_skills_employee_id_name] UNIQUE ([employee_id], [name]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_skills_employee_id')
ALTER TABLE [dbo].[skills] ADD CONSTRAINT [fk_skills_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_gamification_profiles_employee_id')
ALTER TABLE [dbo].[gamification_profiles] ADD CONSTRAINT [uq_gamification_profiles_employee_id] UNIQUE ([employee_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_gamification_profiles_employee_id')
ALTER TABLE [dbo].[gamification_profiles] ADD CONSTRAINT [fk_gamification_profiles_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_xp_transactions_employee_id')
ALTER TABLE [dbo].[xp_transactions] ADD CONSTRAINT [fk_xp_transactions_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_employee_achievements_employee_id_achievement_id')
ALTER TABLE [dbo].[employee_achievements] ADD CONSTRAINT [uq_employee_achievements_employee_id_achievement_id] UNIQUE ([employee_id], [achievement_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_employee_achievements_employee_id')
ALTER TABLE [dbo].[employee_achievements] ADD CONSTRAINT [fk_employee_achievements_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_employee_achievements_achievement_id')
ALTER TABLE [dbo].[employee_achievements] ADD CONSTRAINT [fk_employee_achievements_achievement_id] FOREIGN KEY ([achievement_id]) REFERENCES [dbo].[achievements] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_challenge_progress_employee_id_challenge_id')
ALTER TABLE [dbo].[challenge_progress] ADD CONSTRAINT [uq_challenge_progress_employee_id_challenge_id] UNIQUE ([employee_id], [challenge_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_challenge_progress_employee_id')
ALTER TABLE [dbo].[challenge_progress] ADD CONSTRAINT [fk_challenge_progress_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_challenge_progress_challenge_id')
ALTER TABLE [dbo].[challenge_progress] ADD CONSTRAINT [fk_challenge_progress_challenge_id] FOREIGN KEY ([challenge_id]) REFERENCES [dbo].[challenges] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_challenge_steps_challenge_id')
ALTER TABLE [dbo].[challenge_steps] ADD CONSTRAINT [fk_challenge_steps_challenge_id] FOREIGN KEY ([challenge_id]) REFERENCES [dbo].[challenges] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_submissions_employee_id')
ALTER TABLE [dbo].[submissions] ADD CONSTRAINT [fk_submissions_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_submissions_challenge_id')
ALTER TABLE [dbo].[submissions] ADD CONSTRAINT [fk_submissions_challenge_id] FOREIGN KEY ([challenge_id]) REFERENCES [dbo].[challenges] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_submissions_step_id')
ALTER TABLE [dbo].[submissions] ADD CONSTRAINT [fk_submissions_step_id] FOREIGN KEY ([step_id]) REFERENCES [dbo].[challenge_steps] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_evaluations_submission_id')
ALTER TABLE [dbo].[evaluations] ADD CONSTRAINT [fk_evaluations_submission_id] FOREIGN KEY ([submission_id]) REFERENCES [dbo].[submissions] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_learning_paths_employee_id')
ALTER TABLE [dbo].[learning_paths] ADD CONSTRAINT [fk_learning_paths_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'uq_employee_courses_employee_id_course_id')
ALTER TABLE [dbo].[employee_courses] ADD CONSTRAINT [uq_employee_courses_employee_id_course_id] UNIQUE ([employee_id], [course_id]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_employee_courses_employee_id')
ALTER TABLE [dbo].[employee_courses] ADD CONSTRAINT [fk_employee_courses_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_employee_courses_course_id')
ALTER TABLE [dbo].[employee_courses] ADD CONSTRAINT [fk_employee_courses_course_id] FOREIGN KEY ([course_id]) REFERENCES [dbo].[courses] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_certifications_employee_id')
ALTER TABLE [dbo].[certifications] ADD CONSTRAINT [fk_certifications_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_weekly_schedule_entries_employee_id')
ALTER TABLE [dbo].[weekly_schedule_entries] ADD CONSTRAINT [fk_weekly_schedule_entries_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_career_goals_employee_id')
ALTER TABLE [dbo].[career_goals] ADD CONSTRAINT [fk_career_goals_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_career_roadmap_steps_career_goal_id')
ALTER TABLE [dbo].[career_roadmap_steps] ADD CONSTRAINT [fk_career_roadmap_steps_career_goal_id] FOREIGN KEY ([career_goal_id]) REFERENCES [dbo].[career_goals] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_readiness_components_goal_id')
ALTER TABLE [dbo].[readiness_components] ADD CONSTRAINT [fk_readiness_components_goal_id] FOREIGN KEY ([goal_id]) REFERENCES [dbo].[career_goals] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_skill_gaps_goal_id')
ALTER TABLE [dbo].[skill_gaps] ADD CONSTRAINT [fk_skill_gaps_goal_id] FOREIGN KEY ([goal_id]) REFERENCES [dbo].[career_goals] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_evidence_submissions_skill_gap_id')
ALTER TABLE [dbo].[evidence_submissions] ADD CONSTRAINT [fk_evidence_submissions_skill_gap_id] FOREIGN KEY ([skill_gap_id]) REFERENCES [dbo].[skill_gaps] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_evidence_submissions_roadmap_step_id')
ALTER TABLE [dbo].[evidence_submissions] ADD CONSTRAINT [fk_evidence_submissions_roadmap_step_id] FOREIGN KEY ([roadmap_step_id]) REFERENCES [dbo].[career_roadmap_steps] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_evidence_submissions_employee_id')
ALTER TABLE [dbo].[evidence_submissions] ADD CONSTRAINT [fk_evidence_submissions_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_role_gap_matches_employee_id')
ALTER TABLE [dbo].[role_gap_matches] ADD CONSTRAINT [fk_role_gap_matches_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_role_gap_matches_goal_id')
ALTER TABLE [dbo].[role_gap_matches] ADD CONSTRAINT [fk_role_gap_matches_goal_id] FOREIGN KEY ([goal_id]) REFERENCES [dbo].[career_goals] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_role_gap_matches_role_id')
ALTER TABLE [dbo].[role_gap_matches] ADD CONSTRAINT [fk_role_gap_matches_role_id] FOREIGN KEY ([role_id]) REFERENCES [dbo].[internal_roles] ([role_id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_mentor_matches_employee_id')
ALTER TABLE [dbo].[mentor_matches] ADD CONSTRAINT [fk_mentor_matches_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_mentor_matches_mentor_employee_id')
ALTER TABLE [dbo].[mentor_matches] ADD CONSTRAINT [fk_mentor_matches_mentor_employee_id] FOREIGN KEY ([mentor_employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_xp_events_employee_id')
ALTER TABLE [dbo].[xp_events] ADD CONSTRAINT [fk_xp_events_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_stall_flags_employee_id')
ALTER TABLE [dbo].[stall_flags] ADD CONSTRAINT [fk_stall_flags_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_stall_flags_goal_id')
ALTER TABLE [dbo].[stall_flags] ADD CONSTRAINT [fk_stall_flags_goal_id] FOREIGN KEY ([goal_id]) REFERENCES [dbo].[career_goals] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_knowledge_sources_employee_id')
ALTER TABLE [dbo].[knowledge_sources] ADD CONSTRAINT [fk_knowledge_sources_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_knowledge_extracted_facts_employee_id')
ALTER TABLE [dbo].[knowledge_extracted_facts] ADD CONSTRAINT [fk_knowledge_extracted_facts_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_knowledge_extracted_facts_source_id')
ALTER TABLE [dbo].[knowledge_extracted_facts] ADD CONSTRAINT [fk_knowledge_extracted_facts_source_id] FOREIGN KEY ([source_id]) REFERENCES [dbo].[knowledge_sources] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_knowledge_update_events_employee_id')
ALTER TABLE [dbo].[knowledge_update_events] ADD CONSTRAINT [fk_knowledge_update_events_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_knowledge_update_events_source_id')
ALTER TABLE [dbo].[knowledge_update_events] ADD CONSTRAINT [fk_knowledge_update_events_source_id] FOREIGN KEY ([source_id]) REFERENCES [dbo].[knowledge_sources] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_reward_claims_employee_id')
ALTER TABLE [dbo].[reward_claims] ADD CONSTRAINT [fk_reward_claims_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_reward_claims_reward_id')
ALTER TABLE [dbo].[reward_claims] ADD CONSTRAINT [fk_reward_claims_reward_id] FOREIGN KEY ([reward_id]) REFERENCES [dbo].[reward_items] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_recognitions_employee_id')
ALTER TABLE [dbo].[recognitions] ADD CONSTRAINT [fk_recognitions_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_peer_recommendations_from_employee_id')
ALTER TABLE [dbo].[peer_recommendations] ADD CONSTRAINT [fk_peer_recommendations_from_employee_id] FOREIGN KEY ([from_employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_peer_recommendations_to_employee_id')
ALTER TABLE [dbo].[peer_recommendations] ADD CONSTRAINT [fk_peer_recommendations_to_employee_id] FOREIGN KEY ([to_employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_peer_recommendations_1')
ALTER TABLE [dbo].[peer_recommendations] ADD CONSTRAINT [ck_peer_recommendations_1] CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_peer_recommendations_2')
ALTER TABLE [dbo].[peer_recommendations] ADD CONSTRAINT [ck_peer_recommendations_2] CHECK (from_employee_id <> to_employee_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_projects_employee_id')
ALTER TABLE [dbo].[projects] ADD CONSTRAINT [fk_projects_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_tasks_project_id')
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [fk_tasks_project_id] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_tasks_employee_id')
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [fk_tasks_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_learning_chat_messages_employee_id')
ALTER TABLE [dbo].[learning_chat_messages] ADD CONSTRAINT [fk_learning_chat_messages_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_learning_chat_messages_1')
ALTER TABLE [dbo].[learning_chat_messages] ADD CONSTRAINT [ck_learning_chat_messages_1] CHECK (role IN ('user', 'assistant', 'system'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_learning_feed_cache_employee_id')
ALTER TABLE [dbo].[learning_feed_cache] ADD CONSTRAINT [fk_learning_feed_cache_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_org_at_risk_employees_employee_id')
ALTER TABLE [dbo].[org_at_risk_employees] ADD CONSTRAINT [fk_org_at_risk_employees_employee_id] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE SET NULL;
GO

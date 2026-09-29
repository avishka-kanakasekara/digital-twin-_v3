"""Emit Fabric T-SQL scripts and the local SQLite schema from one catalog."""

from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent

# (name, type, nullable, default)
# type: id, text, long, int, bit, json, dt, date, num, float
TEXT = "text"
LONG = "long"
INT = "int"
BIT = "bit"
JSON = "json"
DT = "dt"
DATE = "date"
NUM = "num"
FLOAT = "float"


def C(name, typ, null=True, default=None):
    return (name, typ, null, default)


TABLES: dict[str, dict] = {}


def table(name, columns, pk, fks=None, uniques=None, checks=None, indexes=None):
    TABLES[name] = {
        "columns": columns,
        "pk": pk,
        "fks": fks or [],
        "uniques": uniques or [],
        "checks": checks or [],
        "indexes": indexes or [],
    }


def _load():
    table(
        "employees",
        [
            C("id", TEXT, False),
            C("employee_code", TEXT, False),
            C("full_name", TEXT, False),
            C("initials", TEXT),
            C("email", TEXT, False),
            C("password_hash", LONG),
            C("department", TEXT),
            C("role", TEXT),
            C("access_role", TEXT),
            C("team", TEXT),
            C("manager_id", TEXT),
            C("manager_name", TEXT),
            C("location", TEXT),
            C("timezone_str", TEXT),
            C("phone", TEXT),
            C("education", JSON, True, "[]"),
            C("languages", JSON, True, "[]"),
            C("biography", LONG),
            C("headline", TEXT),
            C("avatar_url", LONG),
            C("years_experience", INT),
            C("years_in_company", INT),
            C("employment_type", TEXT, True, "Full-Time"),
            C("employment_status", TEXT, True, "Active"),
            C("twin_health", INT, True, "0"),
            C("ai_confidence", INT, True, "0"),
            C("profile_completeness", INT, True, "0"),
            C("created_at", DT, True, "now"),
            C("updated_at", DT, True, "now"),
        ],
        ["id"],
        uniques=[["employee_code"], ["email"]],
        indexes=["department", "email"],
    )
    table(
        "user_identities",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("provider", TEXT, False),
            C("subject", TEXT, False),
            C("email", TEXT),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        uniques=[["provider", "subject"]],
        indexes=["employee_id"],
    )
    table(
        "skills",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("name", TEXT, False),
            C("category", TEXT),
            C("sub_category", TEXT),
            C("icon", TEXT),
            C("proficiency", INT, True, "0"),
            C("target_level", INT, True, "0"),
            C("years_experience", NUM),
            C("trend", TEXT, True, "stable"),
            C("ai_confidence", INT),
            C("verified", BIT, True, "0"),
            C("source", TEXT),
            C("ai_recommendation", LONG),
            C("last_updated", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        uniques=[["employee_id", "name"]],
        indexes=["employee_id"],
    )
    table(
        "gamification_profiles",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("level", INT, True, "1"),
            C("xp", INT, True, "0"),
            C("next_level_xp", INT, True, "1000"),
            C("total_xp_earned", INT, True, "0"),
            C("company_rank", INT),
            C("department_rank", INT),
            C("streak_days", INT, True, "0"),
            C("longest_streak", INT, True, "0"),
            C("last_activity", DT),
            C("title", TEXT, True, "Newcomer"),
            C("updated_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        uniques=[["employee_id"]],
    )
    table(
        "xp_transactions",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("amount", INT, False),
            C("reason", LONG),
            C("category", TEXT),
            C("emoji", TEXT),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id", "created_at"],
    )
    table(
        "achievements",
        [
            C("id", TEXT, False),
            C("name", TEXT, False),
            C("description", LONG),
            C("emoji", TEXT),
            C("xp_value", INT, True, "0"),
            C("rarity", TEXT),
            C("criteria_type", TEXT),
            C("criteria_value", JSON),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
    )
    table(
        "employee_achievements",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("achievement_id", TEXT, False),
            C("unlocked_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("achievement_id", "achievements", "id", "NO ACTION"),
        ],
        uniques=[["employee_id", "achievement_id"]],
    )
    table(
        "challenges",
        [
            C("id", TEXT, False),
            C("title", TEXT, False),
            C("description", LONG),
            C("xp_reward", INT, True, "0"),
            C("bonus_badge", TEXT),
            C("difficulty", TEXT),
            C("type", TEXT),
            C("category", TEXT),
            C("color", TEXT),
            C("start_date", DT),
            C("end_date", DT),
            C("is_active", BIT, True, "1"),
            C("target_skills", JSON, True, "[]"),
            C("estimated_minutes", INT),
            C("learning_objective", LONG),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        indexes=[("is_active", "category")],
    )
    table(
        "challenge_progress",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("challenge_id", TEXT, False),
            C("progress", INT, True, "0"),
            C("completed", BIT, True, "0"),
            C("enrolled_at", DT, True, "now"),
            C("completed_at", DT),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("challenge_id", "challenges", "id", "NO ACTION"),
        ],
        uniques=[["employee_id", "challenge_id"]],
    )
    table(
        "challenge_steps",
        [
            C("id", TEXT, False),
            C("challenge_id", TEXT, False),
            C("step_order", INT, False),
            C("title", TEXT, False),
            C("instructions", LONG, False),
            C("submission_type", TEXT, False, "text"),
            C("evaluation_rubric", LONG, False),
            C("xp_value", INT, False, "100"),
            C("reference_url", LONG),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("challenge_id", "challenges", "id", "CASCADE")],
        indexes=["challenge_id"],
    )
    table(
        "submissions",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("challenge_id", TEXT, False),
            C("step_id", TEXT, False),
            C("submission_type", TEXT, False),
            C("content", LONG, False),
            C("submitted_at", DT, True, "now"),
            C("status", TEXT, False, "pending"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "NO ACTION"),
            ("challenge_id", "challenges", "id", "NO ACTION"),
            ("step_id", "challenge_steps", "id", "NO ACTION"),
        ],
        indexes=[("employee_id", "step_id")],
    )
    table(
        "evaluations",
        [
            C("id", TEXT, False),
            C("submission_id", TEXT, False),
            C("ai_score", INT, False),
            C("pass", BIT, False),
            C("feedback", LONG, False),
            C("xp_awarded", INT, False, "0"),
            C("evaluated_at", DT, True, "now"),
            C("raw_model_response", LONG),
        ],
        ["id"],
        fks=[("submission_id", "submissions", "id", "NO ACTION")],
        indexes=["submission_id"],
    )
    table(
        "learning_paths",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("title", TEXT, False),
            C("description", LONG),
            C("progress", INT, True, "0"),
            C("total_courses", INT, True, "0"),
            C("completed_courses", INT, True, "0"),
            C("estimated_hours", NUM),
            C("due_date", TEXT),
            C("tags", JSON, True, "[]"),
            C("color", TEXT),
            C("is_ai_recommended", BIT, True, "0"),
            C("platform", TEXT),
            C("instructor", TEXT),
            C("course_ids", JSON, True, "[]"),
            C("ai_rationale", LONG),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id"],
    )
    table(
        "courses",
        [
            C("id", TEXT, False),
            C("title", TEXT, False),
            C("provider", TEXT),
            C("hours", NUM),
            C("level", TEXT),
            C("rating", NUM),
            C("enrolled_count", INT, True, "0"),
            C("tags", JSON, True, "[]"),
            C("emoji", TEXT),
            C("color", TEXT),
            C("description", LONG),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
    )
    table(
        "employee_courses",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("course_id", TEXT, False),
            C("status", TEXT, True, "available"),
            C("progress", INT, True, "0"),
            C("started_at", DT),
            C("completed_at", DT),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("course_id", "courses", "id", "NO ACTION"),
        ],
        uniques=[["employee_id", "course_id"]],
    )
    table(
        "certifications",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("name", TEXT, False),
            C("issuer", TEXT),
            C("status", TEXT, True, "planned"),
            C("score", INT),
            C("progress", INT, True, "0"),
            C("credential_id", TEXT),
            C("completed_date", DATE),
            C("expiry_date", DATE),
            C("exam_date", TEXT),
            C("emoji", TEXT),
            C("color", TEXT),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id"],
    )
    table(
        "weekly_schedule_entries",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("day", TEXT, False),
            C("topic", TEXT, False),
            C("duration", TEXT),
            C("status", TEXT, True, "upcoming"),
            C("color", TEXT),
            C("week_of", DATE),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id"],
    )
    table(
        "career_goals",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("target_role", TEXT, False),
            C("timeline", TEXT),
            C("focus_area", TEXT),
            C("target_industry", TEXT),
            C("readiness_score", INT, True, "0"),
            C("is_active", BIT, True, "1"),
            C("visible_to_manager", BIT, True, "0"),
            C("ai_analysis_json", JSON),
            C("ai_generated_at", DT),
            C("created_at", DT, True, "now"),
            C("updated_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id"],
    )
    table(
        "career_roadmap_steps",
        [
            C("id", TEXT, False),
            C("career_goal_id", TEXT, False),
            C("step_order", INT, False),
            C("title", TEXT, False),
            C("status", TEXT, True, "upcoming"),
            C("description", LONG),
            C("step_type", TEXT, True, "learning"),
            C("related_skill_gap_id", TEXT),
            C("requires_evidence", BIT, True, "0"),
            C("evidence_type", TEXT),
            C("estimated_hours", INT, True, "0"),
            C("xp_reward", INT, True, "0"),
            C("due_window", TEXT),
            C("completed_at", DT),
            C("created_at", DT, True, "now"),
            C("updated_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("career_goal_id", "career_goals", "id", "CASCADE")],
        indexes=["career_goal_id"],
    )
    table(
        "readiness_components",
        [
            C("id", TEXT, False),
            C("goal_id", TEXT, False),
            C("name", TEXT, False),
            C("score", INT, False, "0"),
            C("weight", NUM, False, "0"),
            C("explanation", LONG),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("goal_id", "career_goals", "id", "CASCADE")],
    )
    table(
        "skill_gaps",
        [
            C("id", TEXT, False),
            C("goal_id", TEXT, False),
            C("skill", TEXT, False),
            C("current_level", INT, True, "0"),
            C("target_level", INT, True, "0"),
            C("gap", INT, True, "0"),
            C("recommended_path", LONG),
            C("estimated_hours", INT, True, "0"),
            C("status", TEXT, True, "not_started"),
            C("path_type", TEXT, True, "course"),
            C("priority", TEXT, True, "Medium"),
            C("category", TEXT),
            C("created_at", DT, True, "now"),
            C("updated_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("goal_id", "career_goals", "id", "CASCADE")],
        indexes=["goal_id"],
    )
    table(
        "evidence_submissions",
        [
            C("id", TEXT, False),
            C("skill_gap_id", TEXT),
            C("roadmap_step_id", TEXT),
            C("employee_id", TEXT, False),
            C("evidence_type", TEXT, False),
            C("file_ref", LONG),
            C("description", LONG),
            C("status", TEXT, True, "submitted"),
            C("verified_by", TEXT),
            C("verified_at", DT),
            C("xp_awarded", INT, True, "0"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("skill_gap_id", "skill_gaps", "id", "NO ACTION"),
            ("roadmap_step_id", "career_roadmap_steps", "id", "NO ACTION"),
            ("employee_id", "employees", "id", "NO ACTION"),
        ],
        indexes=["employee_id"],
    )
    table(
        "internal_roles",
        [
            C("role_id", TEXT, False),
            C("title", TEXT, False),
            C("department", TEXT),
            C("required_skills", JSON, True, "[]"),
            C("is_open", BIT, True, "1"),
            C("created_at", DT, True, "now"),
        ],
        ["role_id"],
    )
    table(
        "role_gap_matches",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("goal_id", TEXT, False),
            C("role_id", TEXT, False),
            C("overall_fit_pct", INT, True, "0"),
            C("missing_requirements", JSON, True, "[]"),
            C("computed_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("goal_id", "career_goals", "id", "CASCADE"),
            ("role_id", "internal_roles", "role_id", "CASCADE"),
        ],
    )
    table(
        "mentor_matches",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("mentor_employee_id", TEXT, False),
            C("shared_target_role", TEXT),
            C("shared_skill", TEXT),
            C("match_reason", LONG),
            C("intro_requested", BIT, True, "0"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("mentor_employee_id", "employees", "id", "NO ACTION"),
        ],
        indexes=["employee_id"],
    )
    table(
        "xp_events",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("source", TEXT, False),
            C("amount", INT, False, "0"),
            C("timestamp", DT, True, "now"),
            C("reference_type", TEXT),
            C("reference_id", TEXT),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id"],
    )
    table(
        "stall_flags",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("goal_id", TEXT, False),
            C("last_progress_at", DT, False),
            C("flagged_at", DT, True, "now"),
            C("resolved", BIT, True, "0"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("goal_id", "career_goals", "id", "CASCADE"),
        ],
    )
    table(
        "knowledge_sources",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("name", TEXT, False),
            C("type", TEXT, True, "File"),
            C("connected", BIT, True, "1"),
            C("file_path", LONG),
            C("coverage", INT, True, "0"),
            C("skills_extracted", INT, True, "0"),
            C("projects_found", INT, True, "0"),
            C("confidence", INT, True, "0"),
            C("last_synced", DT, True, "now"),
            C("created_at", DT, True, "now"),
            C("original_filename", TEXT),
            C("mime_type", TEXT),
            C("file_size", INT),
            C("storage_path", LONG),
            C("source_type", TEXT, True, "UNKNOWN"),
            C("content_hash", TEXT),
            C("status", TEXT, True, "UPLOADED"),
            C("processing_stage", TEXT),
            C("extracted_text", LONG),
            C("analysis_result", JSON),
            C("extraction_version", TEXT, True, "1.0"),
            C("analysis_version", TEXT, True, "1.0"),
            C("error_code", TEXT),
            C("error_message", LONG),
            C("processed_at", DT),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id", "content_hash", "status"],
    )
    table(
        "knowledge_extracted_facts",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("source_id", TEXT, False),
            C("fact_type", TEXT, False),
            C("fact_key", TEXT, False),
            C("fact_value", JSON, False),
            C("evidence_text", LONG),
            C("evidence_page", INT),
            C("original_value", LONG),
            C("canonical_value", LONG),
            C("confidence", NUM, True, "0"),
            C("source_reliability", NUM, True, "0.7"),
            C("extraction_version", TEXT, True, "1.0"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("source_id", "knowledge_sources", "id", "CASCADE"),
        ],
        indexes=["employee_id", "source_id", "fact_type"],
    )
    table(
        "knowledge_update_events",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("source_id", TEXT),
            C("operation", TEXT, False),
            C("entity_type", TEXT, False),
            C("entity_key", TEXT, False),
            C("old_value", JSON),
            C("new_value", JSON),
            C("confidence", NUM),
            C("reason", LONG),
            C("evidence_text", LONG),
            C("requires_approval", BIT, True, "0"),
            C("approval_status", TEXT, True, "auto_approved"),
            C("model_name", TEXT),
            C("model_version", TEXT),
            C("prompt_version", TEXT, True, "1.0"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("source_id", "knowledge_sources", "id", "NO ACTION"),
        ],
        indexes=["employee_id", "source_id", "created_at"],
    )
    table(
        "reward_items",
        [
            C("id", TEXT, False),
            C("name", TEXT, False),
            C("description", LONG),
            C("cost", INT, False),
            C("emoji", TEXT),
            C("category", TEXT),
            C("available", BIT, True, "1"),
            C("stock", INT),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
    )
    table(
        "reward_claims",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("reward_id", TEXT, False),
            C("claimed_at", DT, True, "now"),
            C("status", TEXT, True, "claimed"),
        ],
        ["id"],
        fks=[
            ("employee_id", "employees", "id", "CASCADE"),
            ("reward_id", "reward_items", "id", "NO ACTION"),
        ],
        indexes=["employee_id"],
    )
    table(
        "recognitions",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("type", TEXT, False),
            C("title", TEXT, False),
            C("description", LONG),
            C("date", TEXT),
            C("awarded_by", TEXT),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id", "type"],
    )
    table(
        "peer_recommendations",
        [
            C("id", TEXT, False),
            C("from_employee_id", TEXT, False),
            C("to_employee_id", TEXT, False),
            C("category", TEXT, False, "general"),
            C("skill", TEXT),
            C("message", LONG, False),
            C("rating", INT, True, "5"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("from_employee_id", "employees", "id", "CASCADE"),
            ("to_employee_id", "employees", "id", "NO ACTION"),
        ],
        checks=[
            "rating IS NULL OR (rating >= 1 AND rating <= 5)",
            "from_employee_id <> to_employee_id",
        ],
        indexes=["to_employee_id", "from_employee_id"],
    )
    table(
        "projects",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("name", TEXT, False),
            C("role", TEXT),
            C("description", LONG),
            C("technologies", JSON, True, "[]"),
            C("duration", TEXT),
            C("domain", TEXT),
            C("complexity", TEXT),
            C("success_score", INT, True, "0"),
            C("leadership_score", INT, True, "0"),
            C("customer_rating", NUM),
            C("status", TEXT, True, "On Track"),
            C("progress", INT, True, "0"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        indexes=["employee_id"],
    )
    table(
        "tasks",
        [
            C("id", TEXT, False),
            C("project_id", TEXT, False),
            C("employee_id", TEXT, False),
            C("title", TEXT, False),
            C("description", LONG),
            C("status", TEXT, True, "Pending"),
            C("priority", TEXT, True, "Medium"),
            C("due_date", DATE),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[
            ("project_id", "projects", "id", "CASCADE"),
            ("employee_id", "employees", "id", "NO ACTION"),
        ],
        indexes=["project_id", "employee_id"],
    )
    table(
        "learning_chat_messages",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT, False),
            C("role", TEXT, False),
            C("content", LONG, False),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
        checks=["role IN ('user', 'assistant', 'system')"],
        indexes=["employee_id"],
    )
    table(
        "learning_feed_cache",
        [
            C("employee_id", TEXT, False),
            C("payload", JSON, False, "[]"),
            C("input_hash", TEXT),
            C("generated_at", DT, True, "now"),
        ],
        ["employee_id"],
        fks=[("employee_id", "employees", "id", "CASCADE")],
    )
    table(
        "departments",
        [
            C("id", TEXT, False),
            C("name", TEXT, False),
            C("region", TEXT, False),
            C("function", TEXT, False),
            C("headcount", INT, False),
            C("open_positions", INT, False),
            C("allocated_budget", FLOAT, False),
            C("actual_spend", FLOAT, False),
            C("performance_score", INT, False),
            C("target_score", INT, False),
            C("enps", INT, False),
            C("attrition_rate", FLOAT, False),
            C("risk_level", TEXT, False),
        ],
        ["id"],
        indexes=["region", "function", "risk_level"],
    )
    table(
        "organization_metrics",
        [
            C("id", TEXT, False),
            C("month", TEXT, False),
            C("date", TEXT, False),
            C("total_headcount", INT, False),
            C("voluntary_attrition_rate", FLOAT, False),
            C("involuntary_attrition_rate", FLOAT, False),
            C("new_hires", INT, False),
            C("open_positions", INT, False),
            C("enps", INT, False),
            C("training_hours_per_employee", FLOAT, False),
            C("absenteeism_rate", FLOAT, False),
            C("revenue", FLOAT, False),
            C("operating_cost", FLOAT, False),
            C("ebitda", FLOAT, False),
            C("net_profit", FLOAT, False),
            C("marketing_spend", FLOAT, False),
            C("rd_spend", FLOAT, False),
            C("overall_productivity_score", INT, False),
            C("csat", FLOAT, False),
            C("nps", INT, False),
            C("market_share_percentage", FLOAT, False),
            C("project_completion_rate", FLOAT, False),
            C("carbon_footprint_tons", INT, False),
            C("energy_consumption_kwh", INT, False),
            C("compliance_score", INT, False),
            C("security_incidents", INT, False),
            C("anomaly_flag", TEXT),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
    )
    table(
        "organization_scenarios",
        [
            C("id", TEXT, False),
            C("scenario_name", TEXT, False),
            C("target_metric", TEXT, False),
            C("confidence_level", INT, False),
            C("predicted_impact_percentage", FLOAT, False),
            C("predicted_roi", FLOAT, False),
            C("time_to_impact_months", INT, False),
            C("ai_recommendation", LONG, False),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
    )
    table(
        "org_innovation_ideas",
        [
            C("id", TEXT, False),
            C("title", TEXT, False),
            C("author_initials", TEXT, False),
            C("author_bg", TEXT, False),
            C("description", LONG, False),
            C("full_description", LONG, False),
            C("roi", TEXT, False),
            C("timeline", TEXT, False),
            C("budget", TEXT, False),
            C("risks", LONG, False),
            C("team_required", LONG, False),
            C("impact_score", INT, False),
            C("feasibility", TEXT, False),
            C("status", TEXT, False),
            C("patent_pending", BIT, True, "0"),
            C("created_at", DT, True, "now"),
        ],
        ["id"],
    )
    table(
        "org_innovation_communities",
        [
            C("id", TEXT, False),
            C("name", TEXT, False),
            C("members", INT, False),
            C("joined", BIT, True, "0"),
            C("icon", TEXT, False),
            C("bg_class", TEXT, False),
        ],
        ["id"],
    )
    table(
        "org_at_risk_employees",
        [
            C("id", TEXT, False),
            C("employee_id", TEXT),
            C("risk_level", TEXT, False),
            C("risk_score", FLOAT, False),
            C("primary_factor", TEXT, False),
            C("burnout_probability", FLOAT, False),
            C("compensation_satisfaction", FLOAT, False),
            C("career_stagnation_score", FLOAT, False),
            C("last_1_on_1", TEXT, False),
            C("ai_retention_suggestion", LONG, False),
        ],
        ["id"],
        fks=[("employee_id", "employees", "id", "SET NULL")],
    )
    table(
        "org_talent_gigs",
        [
            C("id", TEXT, False),
            C("role_title", TEXT, False),
            C("department", TEXT, False),
            C("required_skills", JSON, True, "[]"),
            C("matched_employees", JSON, True, "[]"),
            C("urgency", TEXT, False),
        ],
        ["id"],
    )
    table(
        "org_talent_mentors",
        [
            C("id", TEXT, False),
            C("name", TEXT, False),
            C("role", TEXT, False),
            C("description", LONG, False),
            C("match_score", INT, False),
            C("initials", TEXT, False),
            C("icon_bg", TEXT, False),
        ],
        ["id"],
    )
    table(
        "org_team_builder_options",
        [
            C("id", TEXT, False),
            C("name", TEXT, False),
            C("success_rate", INT, False),
            C("compatibility_score", INT, False),
            C("skill_balance", INT, False),
            C("performance_prediction", INT, False),
            C("rationale", LONG, False),
            C("members", JSON, True, "[]"),
        ],
        ["id"],
    )
    table(
        "org_okrs",
        [
            C("id", TEXT, False),
            C("title", TEXT, False),
            C("owner", TEXT, False),
            C("progress", INT, False),
            C("status", TEXT, False),
            C("initiatives", JSON, True, "[]"),
        ],
        ["id"],
    )


def tsql_type(typ: str) -> str:
    return {
        TEXT: "NVARCHAR(400)",
        LONG: "NVARCHAR(MAX)",
        INT: "INT",
        BIT: "BIT",
        JSON: "NVARCHAR(MAX)",
        DT: "DATETIME2",
        DATE: "DATE",
        NUM: "DECIMAL(10,2)",
        FLOAT: "FLOAT",
    }[typ]


def sqlite_type(typ: str) -> str:
    return {
        TEXT: "TEXT",
        LONG: "TEXT",
        INT: "INTEGER",
        BIT: "INTEGER",
        JSON: "TEXT",
        DT: "TEXT",
        DATE: "TEXT",
        NUM: "REAL",
        FLOAT: "REAL",
    }[typ]


def default_sql(default, dialect: str) -> str:
    if default is None:
        return ""
    if default == "now":
        return " DEFAULT SYSUTCDATETIME()" if dialect == "tsql" else " DEFAULT (datetime('now'))"
    if default == "[]":
        return " DEFAULT '[]'"
    if default in {"0", "1", "100", "1000", "0.7"} or default.replace(".", "", 1).isdigit():
        return f" DEFAULT {default}"
    return f" DEFAULT '{default}'"


def quote(name: str, dialect: str) -> str:
    return f"[{name}]" if dialect == "tsql" else f'"{name}"'


def render_create(dialect: str) -> str:
    chunks = []
    for name, spec in TABLES.items():
        lines = []
        for col, typ, null, default in spec["columns"]:
            sql_type = tsql_type(typ) if dialect == "tsql" else sqlite_type(typ)
            piece = f"    {quote(col, dialect)} {sql_type}"
            if not null:
                piece += " NOT NULL"
            piece += default_sql(default, dialect)
            lines.append(piece)
        pk = ", ".join(quote(col, dialect) for col in spec["pk"])
        lines.append(f"    PRIMARY KEY ({pk})")
        if dialect == "sqlite":
            for cols in spec["uniques"]:
                quoted = ", ".join(quote(col, dialect) for col in cols)
                lines.append(f"    UNIQUE ({quoted})")
            for col, ref_table, ref_col, on_delete in spec["fks"]:
                lines.append(
                    f"    FOREIGN KEY ({quote(col, dialect)}) REFERENCES {quote(ref_table, dialect)} ({quote(ref_col, dialect)}) ON DELETE {on_delete}"
                )
            for check in spec["checks"]:
                lines.append(f"    CHECK ({check})")
        body = ",\n".join(lines)
        if dialect == "tsql":
            chunks.append(
                f"IF OBJECT_ID(N'dbo.{name}', N'U') IS NULL\nBEGIN\nCREATE TABLE [dbo].[{name}] (\n{body}\n);\nEND\nGO\n"
            )
        else:
            chunks.append(f"CREATE TABLE IF NOT EXISTS {quote(name, dialect)} (\n{body}\n);\n")
    return "\n".join(chunks)


def render_constraints() -> str:
    chunks = [
        "-- Foreign keys, unique keys, and checks.\n"
        "-- Applied after tables so the dependency order does not matter.\n"
        "-- SQL Server rejects multiple cascade paths, so only one CASCADE is kept\n"
        "-- per child table (prefer employee_id). Other FKs use NO ACTION.\n"
    ]
    for name, spec in TABLES.items():
        for cols in spec["uniques"]:
            cname = "uq_" + name + "_" + "_".join(cols)
            quoted = ", ".join(f"[{col}]" for col in cols)
            chunks.append(
                f"IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'{cname}')\n"
                f"ALTER TABLE [dbo].[{name}] ADD CONSTRAINT [{cname}] UNIQUE ({quoted});\nGO\n"
            )
        fks = list(spec["fks"])
        cascade_cols = [col for col, _, _, on_delete in fks if on_delete in {"CASCADE", "SET NULL"}]
        preferred = "employee_id" if "employee_id" in cascade_cols else (cascade_cols[0] if cascade_cols else None)
        for col, ref_table, ref_col, on_delete in fks:
            cname = f"fk_{name}_{col}"
            effective = on_delete
            if preferred and col != preferred and on_delete in {"CASCADE", "SET NULL"}:
                effective = "NO ACTION"
            action = (
                "ON DELETE CASCADE"
                if effective == "CASCADE"
                else "ON DELETE SET NULL"
                if effective == "SET NULL"
                else "ON DELETE NO ACTION"
            )
            chunks.append(
                f"IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'{cname}')\n"
                f"ALTER TABLE [dbo].[{name}] ADD CONSTRAINT [{cname}] FOREIGN KEY ([{col}]) "
                f"REFERENCES [dbo].[{ref_table}] ([{ref_col}]) {action};\nGO\n"
            )
        for index, check in enumerate(spec["checks"], start=1):
            cname = f"ck_{name}_{index}"
            chunks.append(
                f"IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'{cname}')\n"
                f"ALTER TABLE [dbo].[{name}] ADD CONSTRAINT [{cname}] CHECK ({check});\nGO\n"
            )
    return "\n".join(chunks)


def render_indexes(dialect: str) -> str:
    chunks = []
    for name, spec in TABLES.items():
        for item in spec["indexes"]:
            cols = item if isinstance(item, tuple) else (item,)
            iname = "idx_" + name + "_" + "_".join(cols)
            quoted = ", ".join(quote(col, dialect) for col in cols)
            if dialect == "tsql":
                chunks.append(
                    f"IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'{iname}' AND object_id = OBJECT_ID(N'dbo.{name}'))\n"
                    f"CREATE INDEX [{iname}] ON [dbo].[{name}] ({quoted});\nGO\n"
                )
            else:
                chunks.append(
                    f"CREATE INDEX IF NOT EXISTS {quote(iname, dialect)} ON {quote(name, dialect)} ({quoted});\n"
                )
    return "\n".join(chunks)


def main() -> None:
    _load()
    header = (
        "-- Employee Digital Twin operational schema\n"
        "-- Target: SQL database in Microsoft Fabric\n"
        "-- IDs stay NVARCHAR so existing text UUID values are preserved exactly.\n\n"
    )
    (OUT / "001_create_schema.sql").write_text(
        header
        + "IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'dbo') EXEC(N'CREATE SCHEMA dbo');\nGO\n",
        encoding="utf-8",
    )
    (OUT / "002_create_tables.sql").write_text(header + render_create("tsql"), encoding="utf-8")
    (OUT / "003_create_constraints.sql").write_text(header + render_constraints(), encoding="utf-8")
    (OUT / "004_create_indexes.sql").write_text(header + render_indexes("tsql"), encoding="utf-8")
    (OUT / "005_create_views.sql").write_text(
        header
        + """
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
""",
        encoding="utf-8",
    )
    (OUT / "006_create_functions.sql").write_text(
        header
        + """
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
""",
        encoding="utf-8",
    )
    (OUT / "007_create_procedures.sql").write_text(
        header
        + """
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
""",
        encoding="utf-8",
    )
    (OUT / "008_seed_data.sql").write_text(
        header
        + """
-- Demo data is built in Python because it includes password hashes and
-- cross-table relationships generated by backend/scripts/seed_database.py.
-- After the schema scripts succeed, run:
--   cd backend && python -m scripts.seed_database
-- Organization demo rows:
--   cd backend && python -m scripts.seed_organization_data
""",
        encoding="utf-8",
    )
    sqlite = (
        "PRAGMA foreign_keys = ON;\n"
        + render_create("sqlite")
        + "\n"
        + render_indexes("sqlite")
    )
    (OUT / "sqlite_schema.sql").write_text(sqlite, encoding="utf-8")
    print(f"Wrote schema for {len(TABLES)} tables")


if __name__ == "__main__":
    main()

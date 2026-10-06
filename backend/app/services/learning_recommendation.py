"""Learning Recommendation engine.

Course completion never changes official skill proficiency.
A skill changes only when an assessment is passed and SF-A sync status is Synced.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException

from app.database import Client

PASS_SCORE = 70
HOURS_PER_WEEK = 14
PRIORITY_WEIGHTS = {"gap": 0.50, "strategic": 0.30, "mandatory": 0.20}
DIFFICULTY_RANK = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
MODALITIES = {"Self-paced", "Instructor-led", "Cohort", "On-the-job"}
DIFFICULTIES = set(DIFFICULTY_RANK)
CATALOGUE_STATUSES = {"Active", "Retired", "Draft"}
PLAN_STATUSES = {"Draft", "Active", "Completed", "Abandoned"}
ITEM_STATUSES = {"Recommended", "Enrolled", "In Progress", "Completed", "Skipped"}
SYNC_STATUSES = {"Pending", "Synced", "Failed"}
PLAN_TRANSITIONS = {
    "Draft": {"Active", "Abandoned"},
    "Active": {"Completed", "Abandoned"},
    "Completed": set(),
    "Abandoned": set(),
}
ITEM_TRANSITIONS = {
    "Recommended": {"Enrolled", "Skipped"},
    "Enrolled": {"In Progress", "Skipped"},
    "In Progress": {"Completed", "Skipped"},
    "Completed": set(),
    "Skipped": set(),
}

_SCHEMA_READY = False


def proficiency_to_scale(value: Any) -> int:
    """Map stored proficiency (0–10 or 0–100) onto the 0–5 learning scale."""
    try:
        number = int(float(value or 0))
    except (TypeError, ValueError):
        return 0
    if number > 10:
        number = round(number / 20)
    elif number > 5:
        number = round(number / 2)
    return max(0, min(5, number))


def scale_to_storage(level: int, previous: Any) -> int:
    """Write the verified level back in the same band the skill row already uses."""
    try:
        previous_number = int(float(previous or 0))
    except (TypeError, ValueError):
        previous_number = 0
    level = max(0, min(5, int(level)))
    if previous_number > 10:
        return level * 20
    if previous_number > 5:
        return level * 2
    return level


def _scale_hint(rows: list[dict[str, Any]]) -> int:
    """A new skill row uses the scale most of the employee's other skills already use."""
    values = []
    for row in rows:
        try:
            values.append(int(float(row.get("proficiency") or 0)))
        except (TypeError, ValueError):
            continue
    if not values:
        return 0
    if sum(1 for value in values if value > 10) * 2 >= len(values):
        return 100
    if any(value > 5 for value in values):
        return 10
    return 0


_SKILL_ALIASES = {
    "cloud cost": ("cloud cost", "cost optimization", "finops"),
    "cloud networking": ("cloud networking",),
    "cloud security": ("cloud security",),
    "system design": ("system design",),
    "aws": ("amazon web services", "aws"),
    "azure": ("azure",),
    "terraform": ("terraform",),
    "kubernetes": ("kubernetes", "k8s"),
}


def _skills_equivalent(left: str, right: str) -> bool:
    """True when a catalogue skill is the same requirement the career goal named."""
    goal_skill = left.casefold().strip()
    course_skill = right.casefold().strip()
    if not goal_skill or not course_skill:
        return False
    if goal_skill == course_skill:
        return True
    return any(len(alias) >= 6 and alias in course_skill for alias in _SKILL_ALIASES.get(goal_skill, ()))


def _career_display(current_raw: Any, target_raw: Any) -> tuple[int, int, int]:
    """Return current, required, and the scale Career Coach already shows."""
    def number(value: Any) -> int:
        try:
            return int(float(value or 0))
        except (TypeError, ValueError):
            return 0

    current, target = number(current_raw), number(target_raw)
    if current > 10:
        current = round(current / 10)
    if target > 10:
        target = round(target / 10)
    current, target = max(0, min(10, current)), max(0, min(10, target))
    if current > 5 or target > 5:
        return current, target, 10
    return current, target, 5


def _learning_levels(current: int, required: int, scale: int) -> tuple[int, int]:
    """Course levels stay on 0–5. A 0–10 career bar is mapped without closing a real gap."""
    if scale != 10:
        return current, required
    learning_current = min(5, current // 2)
    learning_required = min(5, (required + 1) // 2)
    if learning_required <= learning_current and required > current:
        learning_required = min(5, learning_current + 1)
    return learning_current, learning_required


def gap_score(current: int, required: int) -> float:
    current = max(0, int(current))
    required = max(0, int(required))
    if required <= 0 or current >= required:
        return 0.0
    return round(max(0.0, min(1.0, (required - current) / required)), 4)


def priority_score(gap: float, strategic: bool, mandatory: bool) -> float:
    score = (
        PRIORITY_WEIGHTS["gap"] * max(0.0, min(1.0, gap))
        + PRIORITY_WEIGHTS["strategic"] * (1.0 if strategic else 0.0)
        + PRIORITY_WEIGHTS["mandatory"] * (1.0 if mandatory else 0.0)
    )
    return round(max(0.0, min(1.0, score)), 4)


def proficiency_verified(passed: bool, sync_status: str) -> bool:
    return bool(passed) and sync_status == "Synced"


def closure_status(before: int, after: int, required: int) -> str:
    if after <= before:
        return "Unchanged"
    if after >= required:
        return "Full Closure"
    return "Partial Closure"


def _utc() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime | None = None) -> str:
    return (value or _utc()).isoformat()


def _loads(value: Any, fallback: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return fallback
    return value if value is not None else fallback


def _dumps(value: Any) -> str:
    return json.dumps(value)


def ensure_schema(db: Client) -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    dialect = db.db.dialect
    if dialect == "sqlite":
        statements = [
            """CREATE TABLE IF NOT EXISTS lr_courses (
                id TEXT PRIMARY KEY, course_title TEXT NOT NULL, provider TEXT,
                modality TEXT NOT NULL, duration_hours REAL NOT NULL, cost_lkr REAL NOT NULL DEFAULT 0,
                difficulty_level TEXT NOT NULL, is_mandatory INTEGER NOT NULL DEFAULT 0,
                mandatory_for_role_ids TEXT NOT NULL DEFAULT '[]', strategic_priority_flag INTEGER NOT NULL DEFAULT 0,
                has_assessment INTEGER NOT NULL DEFAULT 0, catalogue_status TEXT NOT NULL DEFAULT 'Active')""",
            """CREATE TABLE IF NOT EXISTS lr_course_skills (
                id TEXT PRIMARY KEY, course_id TEXT NOT NULL, skill_name TEXT NOT NULL, level_delivered INTEGER NOT NULL)""",
            """CREATE TABLE IF NOT EXISTS lr_plans (
                id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, source_gap_reference TEXT NOT NULL,
                title TEXT NOT NULL, target_skill_ids TEXT NOT NULL, plan_status TEXT NOT NULL,
                created_at TEXT NOT NULL, target_completion_date TEXT NOT NULL,
                total_estimated_hours REAL NOT NULL, priority_score REAL NOT NULL, abandonment_reason TEXT)""",
            """CREATE TABLE IF NOT EXISTS lr_plan_items (
                id TEXT PRIMARY KEY, learning_plan_id TEXT NOT NULL, course_id TEXT NOT NULL,
                sequence_order INTEGER NOT NULL, skill_gap_score REAL NOT NULL,
                expected_proficiency_gain INTEGER NOT NULL, status TEXT NOT NULL,
                enrolled_at TEXT, completed_at TEXT)""",
            """CREATE TABLE IF NOT EXISTS lr_assessments (
                id TEXT PRIMARY KEY, learning_plan_item_id TEXT NOT NULL, employee_id TEXT NOT NULL,
                skill_name TEXT NOT NULL, proficiency_before INTEGER NOT NULL, proficiency_after INTEGER,
                intended_proficiency INTEGER NOT NULL, assessment_score_pct INTEGER NOT NULL,
                assessment_date TEXT NOT NULL, passed INTEGER NOT NULL, sfa_sync_status TEXT NOT NULL)""",
            """CREATE TABLE IF NOT EXISTS lr_gap_closures (
                id TEXT PRIMARY KEY, source_gap_reference TEXT NOT NULL, employee_id TEXT NOT NULL,
                skill_name TEXT NOT NULL, before_level INTEGER NOT NULL, after_level INTEGER NOT NULL,
                required_level INTEGER NOT NULL, closure_status TEXT NOT NULL, created_at TEXT NOT NULL)""",
            """CREATE TABLE IF NOT EXISTS lr_id_counters (prefix TEXT PRIMARY KEY, next_value INTEGER NOT NULL)""",
            """CREATE TABLE IF NOT EXISTS lr_audit (
                id TEXT PRIMARY KEY, employee_id TEXT, event TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL)""",
            """CREATE TABLE IF NOT EXISTS lr_course_questions (
                id TEXT PRIMARY KEY, course_id TEXT NOT NULL, sequence_order INTEGER NOT NULL,
                prompt TEXT NOT NULL, options_json TEXT NOT NULL, correct_index INTEGER NOT NULL)""",
        ]
    else:
        statements = [
            """IF OBJECT_ID(N'dbo.lr_courses', N'U') IS NULL CREATE TABLE [dbo].[lr_courses] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [course_title] NVARCHAR(400) NOT NULL, [provider] NVARCHAR(200),
                [modality] NVARCHAR(40) NOT NULL, [duration_hours] FLOAT NOT NULL, [cost_lkr] FLOAT NOT NULL,
                [difficulty_level] NVARCHAR(40) NOT NULL, [is_mandatory] INT NOT NULL, [mandatory_for_role_ids] NVARCHAR(MAX) NOT NULL,
                [strategic_priority_flag] INT NOT NULL, [has_assessment] INT NOT NULL, [catalogue_status] NVARCHAR(40) NOT NULL)""",
            """IF OBJECT_ID(N'dbo.lr_course_skills', N'U') IS NULL CREATE TABLE [dbo].[lr_course_skills] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [course_id] NVARCHAR(40) NOT NULL, [skill_name] NVARCHAR(200) NOT NULL, [level_delivered] INT NOT NULL)""",
            """IF OBJECT_ID(N'dbo.lr_plans', N'U') IS NULL CREATE TABLE [dbo].[lr_plans] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [employee_id] NVARCHAR(80) NOT NULL, [source_gap_reference] NVARCHAR(200) NOT NULL,
                [title] NVARCHAR(400) NOT NULL, [target_skill_ids] NVARCHAR(MAX) NOT NULL, [plan_status] NVARCHAR(40) NOT NULL,
                [created_at] NVARCHAR(40) NOT NULL, [target_completion_date] NVARCHAR(40) NOT NULL,
                [total_estimated_hours] FLOAT NOT NULL, [priority_score] FLOAT NOT NULL, [abandonment_reason] NVARCHAR(MAX))""",
            """IF OBJECT_ID(N'dbo.lr_plan_items', N'U') IS NULL CREATE TABLE [dbo].[lr_plan_items] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [learning_plan_id] NVARCHAR(40) NOT NULL, [course_id] NVARCHAR(40) NOT NULL,
                [sequence_order] INT NOT NULL, [skill_gap_score] FLOAT NOT NULL, [expected_proficiency_gain] INT NOT NULL,
                [status] NVARCHAR(40) NOT NULL, [enrolled_at] NVARCHAR(40), [completed_at] NVARCHAR(40))""",
            """IF OBJECT_ID(N'dbo.lr_assessments', N'U') IS NULL CREATE TABLE [dbo].[lr_assessments] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [learning_plan_item_id] NVARCHAR(40) NOT NULL, [employee_id] NVARCHAR(80) NOT NULL,
                [skill_name] NVARCHAR(200) NOT NULL, [proficiency_before] INT NOT NULL, [proficiency_after] INT,
                [intended_proficiency] INT NOT NULL, [assessment_score_pct] INT NOT NULL, [assessment_date] NVARCHAR(40) NOT NULL,
                [passed] INT NOT NULL, [sfa_sync_status] NVARCHAR(40) NOT NULL)""",
            """IF OBJECT_ID(N'dbo.lr_gap_closures', N'U') IS NULL CREATE TABLE [dbo].[lr_gap_closures] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [source_gap_reference] NVARCHAR(200) NOT NULL, [employee_id] NVARCHAR(80) NOT NULL,
                [skill_name] NVARCHAR(200) NOT NULL, [before_level] INT NOT NULL, [after_level] INT NOT NULL,
                [required_level] INT NOT NULL, [closure_status] NVARCHAR(40) NOT NULL, [created_at] NVARCHAR(40) NOT NULL)""",
            """IF OBJECT_ID(N'dbo.lr_id_counters', N'U') IS NULL CREATE TABLE [dbo].[lr_id_counters] (
                [prefix] NVARCHAR(20) NOT NULL PRIMARY KEY, [next_value] INT NOT NULL)""",
            """IF OBJECT_ID(N'dbo.lr_audit', N'U') IS NULL CREATE TABLE [dbo].[lr_audit] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [employee_id] NVARCHAR(80), [event] NVARCHAR(80) NOT NULL,
                [detail] NVARCHAR(MAX), [created_at] NVARCHAR(40) NOT NULL)""",
            """IF OBJECT_ID(N'dbo.lr_course_questions', N'U') IS NULL CREATE TABLE [dbo].[lr_course_questions] (
                [id] NVARCHAR(40) NOT NULL PRIMARY KEY, [course_id] NVARCHAR(40) NOT NULL, [sequence_order] INT NOT NULL,
                [prompt] NVARCHAR(MAX) NOT NULL, [options_json] NVARCHAR(MAX) NOT NULL, [correct_index] INT NOT NULL)""",
        ]
    for statement in statements:
        db.db.execute(statement)
    _seed_catalogue_if_empty(db)
    _ensure_gap_courses(db)
    _ensure_questions(db)
    _SCHEMA_READY = True


def _next_id(db: Client, prefix: str) -> str:
    rows = db.table("lr_id_counters").select("*").eq("prefix", prefix).execute().data or []
    if not rows:
        db.table("lr_id_counters").insert({"prefix": prefix, "next_value": 2}).execute()
        number = 1
    else:
        number = int(rows[0]["next_value"])
        db.table("lr_id_counters").update({"next_value": number + 1}).eq("prefix", prefix).execute()
    return f"{prefix}-{number:05d}"


def _audit(db: Client, employee_id: str | None, event: str, detail: str) -> None:
    db.table("lr_audit").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "event": event,
        "detail": detail[:500],
        "created_at": _iso(),
    }).execute()


def _question_set(skill: str, level: int) -> list[dict[str, Any]]:
    return [
        {
            "prompt": f"Before you change a live system using {skill}, what do you confirm first?",
            "options": [
                "The current state and the exact change you intend to make",
                "That finishing the course has already raised official proficiency",
                "That a failed check can be ignored once the course is complete",
                "That the hardest material should come before the foundation",
            ],
            "correct": 0,
        },
        {
            "prompt": f"Which result shows {skill} at level {level}, rather than attendance?",
            "options": [
                "A passed assessment that has been synchronized to the skill record",
                "The course status set to Completed",
                "An assessment that failed, or a pass that is still waiting to sync",
                "Hours spent with the material",
            ],
            "correct": 0,
        },
        {
            "prompt": f"You need to raise {skill} by one level. What order is sound?",
            "options": [
                "Foundation material, then the next level, then the assessment",
                "The most advanced course first, with no assessment",
                "Mark every course complete and edit the skill yourself",
                "Treat a strategic label as proof the level is already met",
            ],
            "correct": 0,
        },
        {
            "prompt": f"A check for {skill} is below the pass mark. What happens to official proficiency?",
            "options": [
                "It stays unchanged until a later attempt is passed and synchronized",
                "It increases because the course was completed",
                "It increases halfway",
                "The original skill gap is closed",
            ],
            "correct": 0,
        },
    ]


def _ensure_questions(db: Client) -> None:
    for course in _courses(db):
        if not course.get("has_assessment") or course.get("catalogue_status") != "Active":
            continue
        existing = db.table("lr_course_questions").select("id").eq("course_id", course["id"]).limit(1).execute().data or []
        if existing:
            continue
        skill = course["skills"][0] if course.get("skills") else {"skill_name": course["course_title"], "level_delivered": 1}
        for index, question in enumerate(_question_set(skill["skill_name"], int(skill["level_delivered"])), start=1):
            db.table("lr_course_questions").insert({
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{course['id']}:q:{index}")),
                "course_id": course["id"],
                "sequence_order": index,
                "prompt": question["prompt"],
                "options_json": _dumps(question["options"]),
                "correct_index": question["correct"],
            }).execute()


def _questions(db: Client, course_id: str) -> list[dict[str, Any]]:
    rows = db.table("lr_course_questions").select("*").eq("course_id", course_id).execute().data or []
    rows.sort(key=lambda row: int(row["sequence_order"]))
    for row in rows:
        row["options"] = _loads(row.get("options_json"), [])
    return rows


def course_questions(db: Client, course_id: str) -> list[dict[str, Any]]:
    ensure_schema(db)
    if not any(course["id"] == course_id for course in _courses(db)):
        raise HTTPException(status_code=404, detail="Course not found")
    return [{"id": row["id"], "prompt": row["prompt"], "options": row["options"]} for row in _questions(db, course_id)]


def _feedback_source_gap(db: Client, employee_id: str, skill_name: str, after_level: int, source_gap_reference: str) -> None:
    if not source_gap_reference or str(source_gap_reference).startswith("ROLECHK-"):
        return
    rows = db.table("skill_gaps").select("*").eq("id", source_gap_reference).limit(1).execute().data or []
    if not rows:
        return
    row = rows[0]
    target = int(float(row.get("target_level") or 0))
    current_raw = int(float(row.get("current_level") or 0))
    hint = target if target > 5 else current_raw
    stored = scale_to_storage(after_level, hint)
    gap_size = max(0, target - stored)
    db.table("skill_gaps").update({
        "current_level": stored,
        "gap": gap_size,
        "status": "closed" if gap_size == 0 else "in_progress",
    }).eq("id", row["id"]).execute()
    _audit(db, employee_id, "gap_feedback", f"{skill_name} {current_raw}->{stored} gap {gap_size}")


def validate_course(course: dict[str, Any], skills: list[dict[str, Any]]) -> None:
    if not skills:
        raise HTTPException(status_code=400, detail="A course must map to at least one skill.")
    if course.get("modality") not in MODALITIES:
        raise HTTPException(status_code=400, detail="Modality is not allowed.")
    if course.get("difficulty_level") not in DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Difficulty is not allowed.")
    if course.get("catalogue_status") not in CATALOGUE_STATUSES:
        raise HTTPException(status_code=400, detail="Catalogue status is not allowed.")
    hours = float(course.get("duration_hours") or 0)
    if hours < 1 or hours > 300:
        raise HTTPException(status_code=400, detail="Duration must be between 1 and 300 hours.")
    if float(course.get("cost_lkr") or 0) < 0:
        raise HTTPException(status_code=400, detail="Cost cannot be negative.")
    mandatory = bool(course.get("is_mandatory"))
    roles = course.get("mandatory_for_role_ids") or []
    if roles and not mandatory:
        raise HTTPException(status_code=400, detail="mandatory_for_role_ids is only valid when the course is mandatory.")
    names = set()
    for skill in skills:
        level = int(skill["level_delivered"])
        if level < 1 or level > 5:
            raise HTTPException(status_code=400, detail="Skill level delivered must be 1–5.")
        if not str(skill.get("skill_name") or "").strip():
            raise HTTPException(status_code=400, detail="Skill name is required.")
        names.add(str(skill["skill_name"]).casefold())
    if len(names) != len(skills):
        raise HTTPException(status_code=400, detail="A course cannot map the same skill twice.")


def known_skill_names(db: Client) -> list[str]:
    ensure_schema(db)
    names: dict[str, str] = {}
    for row in db.table("skills").select("name").execute().data or []:
        name = str(row.get("name") or "").strip()
        if name:
            names[name.casefold()] = name
    try:
        for row in db.table("skill_gaps").select("skill").execute().data or []:
            name = str(row.get("skill") or "").strip()
            if name:
                names.setdefault(name.casefold(), name)
    except Exception:
        pass
    return sorted(names.values(), key=str.casefold)


def create_course(db: Client, course: dict[str, Any], skills: list[dict[str, Any]]) -> dict[str, Any]:
    ensure_schema(db)
    course = {**course, "catalogue_status": course.get("catalogue_status") or "Active"}
    validate_course(course, skills)
    allowed = {name.casefold() for name in known_skill_names(db)}
    for skill in skills:
        if str(skill["skill_name"]).casefold() not in allowed:
            raise HTTPException(status_code=400, detail=f"{skill['skill_name']} is not a skill on record. Map the course to an existing skill.")
    course_id = _next_id(db, "CRS")
    while db.table("lr_courses").select("id").eq("id", course_id).limit(1).execute().data:
        course_id = _next_id(db, "CRS")
    db.table("lr_courses").insert({
        "id": course_id,
        "course_title": str(course["course_title"]).strip(),
        "provider": str(course.get("provider") or "Internal Academy").strip(),
        "modality": course["modality"],
        "duration_hours": float(course["duration_hours"]),
        "cost_lkr": float(course.get("cost_lkr") or 0),
        "difficulty_level": course["difficulty_level"],
        "is_mandatory": int(bool(course.get("is_mandatory"))),
        "mandatory_for_role_ids": _dumps(course.get("mandatory_for_role_ids") or []),
        "strategic_priority_flag": int(bool(course.get("strategic_priority_flag"))),
        "has_assessment": int(bool(course.get("has_assessment"))),
        "catalogue_status": course.get("catalogue_status") or "Active",
    }).execute()
    for skill in skills:
        db.table("lr_course_skills").insert({
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "skill_name": str(skill["skill_name"]).strip(),
            "level_delivered": int(skill["level_delivered"]),
        }).execute()
    if course.get("has_assessment"):
        primary = skills[0]
        for index, question in enumerate(_question_set(primary["skill_name"], int(primary["level_delivered"])), start=1):
            db.table("lr_course_questions").insert({
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{course_id}:q:{index}")),
                "course_id": course_id,
                "sequence_order": index,
                "prompt": question["prompt"],
                "options_json": _dumps(question["options"]),
                "correct_index": question["correct"],
            }).execute()
    _audit(db, None, "course_created", course_id)
    created = next(row for row in _courses(db) if row["id"] == course_id)
    return created


def _seed_catalogue_if_empty(db: Client) -> None:
    existing = db.table("lr_courses").select("id").limit(1).execute().data or []
    if existing:
        return
    catalogue = [
        ("CRS-00001", "MLOps Foundations", "Internal Academy", "Self-paced", 40, 0, "Beginner", 0, [], 1, 1, "Active", [("MLOps", 2)]),
        ("CRS-00002", "Advanced MLOps", "Internal Academy", "Cohort", 60, 45000, "Advanced", 0, [], 1, 1, "Active", [("MLOps", 4)]),
        ("CRS-00003", "Cloud Security Basics", "Security Guild", "Instructor-led", 16, 12000, "Beginner", 1, ["Cloud Architect"], 1, 1, "Active", [("Cloud Security", 2)]),
        ("CRS-00004", "Terraform for Architects", "Platform Guild", "Self-paced", 24, 0, "Intermediate", 0, [], 0, 1, "Active", [("Terraform", 3)]),
        ("CRS-00005", "Statistics for Analysts", "Data Guild", "Self-paced", 20, 0, "Beginner", 0, [], 0, 1, "Active", [("Statistics", 3)]),
        ("CRS-00006", "Python for Data Work", "Data Guild", "Self-paced", 18, 0, "Beginner", 0, [], 0, 1, "Active", [("Python", 3)]),
        ("CRS-00007", "Kubernetes Operations", "Platform Guild", "Instructor-led", 30, 20000, "Intermediate", 0, [], 1, 1, "Active", [("Kubernetes", 3)]),
        ("CRS-00008", "System Design Studio", "Architecture Guild", "Cohort", 28, 0, "Advanced", 0, [], 0, 0, "Active", [("System Design", 4)]),
        ("CRS-00009", "Azure Architecture Workshop", "Cloud Guild", "Instructor-led", 22, 18000, "Intermediate", 1, ["Cloud Architect"], 0, 1, "Active", [("Azure", 3)]),
        ("CRS-00010", "SQL Practice Lab", "Data Guild", "Self-paced", 12, 0, "Beginner", 0, [], 0, 1, "Active", [("SQL", 3)]),
        ("CRS-00011", "Communication for Technical Leads", "People Team", "On-the-job", 8, 0, "Intermediate", 0, [], 0, 0, "Active", [("Communication", 3)]),
        ("CRS-00012", "Retired MLOps Legacy", "Internal Academy", "Self-paced", 10, 0, "Beginner", 0, [], 0, 1, "Retired", [("MLOps", 2)]),
    ]
    for row in catalogue:
        db.table("lr_courses").insert({
            "id": row[0], "course_title": row[1], "provider": row[2], "modality": row[3],
            "duration_hours": row[4], "cost_lkr": row[5], "difficulty_level": row[6],
            "is_mandatory": int(row[7]), "mandatory_for_role_ids": _dumps(row[8]),
            "strategic_priority_flag": int(row[9]), "has_assessment": int(row[10]), "catalogue_status": row[11],
        }).execute()
        for skill_name, level in row[12]:
            db.table("lr_course_skills").insert({
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{row[0]}:{skill_name}")),
                "course_id": row[0], "skill_name": skill_name, "level_delivered": level,
            }).execute()
    for prefix, start in (("CRS", 13), ("LPLAN", 1), ("LREC", 1), ("ASSESS", 1)):
        db.table("lr_id_counters").insert({"prefix": prefix, "next_value": start}).execute()


def _ensure_gap_courses(db: Client) -> None:
    """Insert catalogue rows for recorded skill-gap names when those ids are absent.

    Matching is an exact skill-name match, so a generic MLOps row cannot cover
    Advanced Cloud Networking. Fixed ids keep this idempotent on Fabric.
    """
    extra = [
        ("CRS-00013", "Advanced Cloud Networking Foundations", "Cloud Guild", "Self-paced", 28, 0, "Beginner", 0, [], 1, 1, "Active", [("Advanced Cloud Networking", 2)]),
        ("CRS-00014", "Advanced Cloud Networking Practice", "Cloud Guild", "Instructor-led", 36, 22000, "Intermediate", 0, [], 1, 1, "Active", [("Advanced Cloud Networking", 4)]),
        ("CRS-00015", "Architectural Governance Foundations", "Architecture Guild", "Self-paced", 18, 0, "Beginner", 1, ["Cloud Architect"], 1, 1, "Active", [("Architectural Governance & Standards", 2)]),
        ("CRS-00016", "Architectural Governance Practice", "Architecture Guild", "Cohort", 32, 15000, "Intermediate", 1, ["Cloud Architect"], 1, 1, "Active", [("Architectural Governance & Standards", 4)]),
        ("CRS-00017", "Cloud Cost Foundations", "FinOps Guild", "Self-paced", 16, 0, "Beginner", 0, [], 1, 1, "Active", [("Cloud Cost Optimization", 2)]),
        ("CRS-00018", "Cloud Cost Optimization Studio", "FinOps Guild", "Instructor-led", 24, 18000, "Intermediate", 0, [], 1, 1, "Active", [("Cloud Cost Optimization", 4)]),
        ("CRS-00019", "GCP Architecture Foundations", "Cloud Guild", "Self-paced", 20, 0, "Beginner", 0, [], 1, 1, "Active", [("GCP Professional Cloud Architecture", 2)]),
        ("CRS-00020", "GCP Architecture Workshop", "Cloud Guild", "Instructor-led", 30, 25000, "Intermediate", 1, ["Cloud Architect"], 1, 1, "Active", [("GCP Professional Cloud Architecture", 4)]),
        ("CRS-00021", "LLM Fine-tuning Foundations", "AI Guild", "Self-paced", 22, 0, "Beginner", 0, [], 1, 1, "Active", [("LLM Fine-tuning", 3)]),
        ("CRS-00022", "LLM Fine-tuning Lab", "AI Guild", "Cohort", 40, 30000, "Advanced", 0, [], 1, 1, "Active", [("LLM Fine-tuning", 4)]),
        ("CRS-00023", "Strategic Planning Workshop", "People Team", "Instructor-led", 12, 0, "Intermediate", 0, [], 0, 1, "Active", [("Strategic Planning", 3)]),
        ("CRS-00024", "Strategic Planning for Leads", "People Team", "Cohort", 16, 8000, "Advanced", 0, [], 0, 1, "Active", [("Strategic Planning", 4)]),
        ("CRS-00025", "Vector Database Foundations", "Data Guild", "Self-paced", 14, 0, "Beginner", 0, [], 1, 1, "Active", [("Vector Databases", 3)]),
        ("CRS-00026", "Vector Databases in Production", "Data Guild", "Instructor-led", 26, 16000, "Advanced", 0, [], 1, 1, "Active", [("Vector Databases", 4)]),
        ("CRS-00027", "AI Ethics Practice", "AI Guild", "On-the-job", 10, 0, "Intermediate", 1, ["Cloud Architect"], 1, 0, "Active", [("AI Ethics & Governance", 4)]),
        ("CRS-00028", "Go for Platform Engineers", "Platform Guild", "Self-paced", 20, 0, "Intermediate", 0, [], 0, 1, "Active", [("Go Programming", 4)]),
        ("CRS-00029", "Kubernetes for Architects", "Platform Guild", "Instructor-led", 24, 20000, "Advanced", 0, [], 1, 1, "Active", [("Kubernetes", 5)]),
        ("CRS-00030", "Terraform in Production", "Platform Guild", "Self-paced", 18, 0, "Advanced", 0, [], 0, 1, "Active", [("Terraform", 5)]),
        ("CRS-00031", "Draft Networking Outline", "Cloud Guild", "Self-paced", 8, 0, "Beginner", 0, [], 0, 0, "Draft", [("Advanced Cloud Networking", 1)]),
        ("CRS-00040", "Cloud Cost Foundations for Architects", "FinOps Guild", "Self-paced", 16, 0, "Beginner", 0, ["Cloud Architect"], 1, 1, "Active", [("Cloud Cost", 2)]),
        ("CRS-00041", "Cloud Cost Practice for Architects", "FinOps Guild", "Instructor-led", 24, 18000, "Intermediate", 0, ["Cloud Architect"], 1, 1, "Active", [("Cloud Cost", 4)]),
        ("CRS-00042", "Cloud Networking Foundations", "Cloud Guild", "Self-paced", 18, 0, "Beginner", 0, ["Cloud Architect"], 1, 1, "Active", [("Cloud Networking", 2)]),
        ("CRS-00043", "Cloud Networking Practice", "Cloud Guild", "Instructor-led", 28, 20000, "Intermediate", 0, ["Cloud Architect"], 1, 1, "Active", [("Cloud Networking", 4)]),
    ]
    for row in extra:
        existing = db.table("lr_courses").select("id").eq("id", row[0]).limit(1).execute().data or []
        if existing:
            continue
        db.table("lr_courses").insert({
            "id": row[0], "course_title": row[1], "provider": row[2], "modality": row[3],
            "duration_hours": row[4], "cost_lkr": row[5], "difficulty_level": row[6],
            "is_mandatory": int(row[7]), "mandatory_for_role_ids": _dumps(row[8]),
            "strategic_priority_flag": int(row[9]), "has_assessment": int(row[10]), "catalogue_status": row[11],
        }).execute()
        for skill_name, level in row[12]:
            db.table("lr_course_skills").insert({
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{row[0]}:{skill_name}")),
                "course_id": row[0], "skill_name": skill_name, "level_delivered": level,
            }).execute()
    counter = db.table("lr_id_counters").select("*").eq("prefix", "CRS").limit(1).execute().data or []
    if counter and int(counter[0]["next_value"]) < 44:
        db.table("lr_id_counters").update({"next_value": 44}).eq("prefix", "CRS").execute()


def _courses(db: Client) -> list[dict[str, Any]]:
    courses = db.table("lr_courses").select("*").execute().data or []
    skills = db.table("lr_course_skills").select("*").execute().data or []
    by_course: dict[str, list[dict[str, Any]]] = {}
    for skill in skills:
        by_course.setdefault(skill["course_id"], []).append(skill)
    for course in courses:
        course["skills"] = by_course.get(course["id"], [])
        course["mandatory_for_role_ids"] = _loads(course.get("mandatory_for_role_ids"), [])
        course["is_mandatory"] = bool(course.get("is_mandatory"))
        course["strategic_priority_flag"] = bool(course.get("strategic_priority_flag"))
        course["has_assessment"] = bool(course.get("has_assessment"))
    return courses


def _employee_levels(db: Client, employee_id: str) -> dict[str, dict[str, Any]]:
    rows = db.table("skills").select("*").eq("employee_id", employee_id).execute().data or []
    levels: dict[str, dict[str, Any]] = {}
    for row in rows:
        name = str(row.get("name") or "").strip()
        if not name:
            continue
        levels[name.casefold()] = {
            "name": name,
            "raw": row.get("proficiency"),
            "level": proficiency_to_scale(row.get("proficiency")),
            "target": proficiency_to_scale(row.get("target_level")),
            "id": row.get("id"),
        }
    return levels


def list_skill_gaps(db: Client, employee_id: str) -> list[dict[str, Any]]:
    ensure_schema(db)
    levels = _employee_levels(db, employee_id)
    gaps: list[dict[str, Any]] = []
    career_gaps: list[dict] = []
    goal_locked = False
    try:
        from app.services.career_coach import requirement_gaps_for_employee

        requirement_gaps = requirement_gaps_for_employee(db, employee_id)
        if requirement_gaps is not None:
            goal_locked = True
            career_gaps = requirement_gaps
    except Exception:
        career_gaps = []
        goal_locked = False
    if not goal_locked:
        try:
            goal_rows = db.table("career_goals").select("id").eq("employee_id", employee_id).eq("is_active", True).limit(1).execute().data or []
            goal_id = goal_rows[0]["id"] if goal_rows else None
            if goal_id:
                career_gaps = db.table("skill_gaps").select("*").eq("goal_id", goal_id).execute().data or []
                goal_locked = bool(career_gaps)
        except Exception:
            career_gaps = []
    seen: set[str] = set()
    for row in career_gaps:
        skill = str(row.get("skill") or "").strip()
        if not skill:
            continue
        display_current, display_required, scale = _career_display(row.get("current_level"), row.get("target_level"))
        live = levels.get(skill.casefold())
        if live is not None:
            live_current, _, _ = _career_display(live.get("raw"), display_required if scale == 10 else 0)
            if scale == 5:
                live_current = int(live["level"])
            display_current = max(display_current, live_current)
        if display_required <= display_current:
            continue
        current, required = _learning_levels(display_current, display_required, scale)
        reference = str(row.get("id"))
        seen.add(skill.casefold())
        gaps.append(_gap_payload(
            employee_id, skill, current, required, reference, "Career Path Step", db,
            display_current, display_required, scale,
        ))
    if not goal_locked:
        for info in levels.values():
            if info["name"].casefold() in seen:
                continue
            required = int(info["target"])
            if required <= info["level"]:
                continue
            reference = f"ROLECHK-{info['id']}"
            gaps.append(_gap_payload(
                employee_id, info["name"], info["level"], required, reference, "Role Readiness Check", db,
                info["level"], required, 5,
            ))
    gaps.sort(key=lambda item: (-item["priority_score"], -item["gap_levels"], item["skill"]))
    return gaps


def _gap_payload(
    employee_id: str,
    skill: str,
    current: int,
    required: int,
    reference: str,
    source_type: str,
    db: Client,
    display_current: int | None = None,
    display_required: int | None = None,
    display_scale: int = 5,
) -> dict[str, Any]:
    score = gap_score(current, required)
    plans = db.table("lr_plans").select("id, plan_status, target_skill_ids, source_gap_reference").eq("employee_id", employee_id).execute().data or []
    attached = None
    for plan in plans:
        skills = [name.casefold() for name in _loads(plan.get("target_skill_ids"), [])]
        if plan.get("source_gap_reference") == reference or skill.casefold() in skills:
            if plan.get("plan_status") in {"Draft", "Active"}:
                attached = plan["id"]
                break
    courses = match_courses(db, skill, current, required)
    strategic = any(course["strategic_priority_flag"] for course in courses)
    mandatory = any(course["is_mandatory"] for course in courses)
    shown_current = current if display_current is None else display_current
    shown_required = required if display_required is None else display_required
    if source_type == "Career Path Step":
        why = (
            f"{skill} is {shown_current}/{display_scale} against the {shown_required}/{display_scale} this career goal requires. "
            "This is the same gap Career Coach is tracking. Choose the courses, then generate the plan."
        )
    else:
        why = f"{skill} is {shown_current}/{display_scale} against a required {shown_required}/{display_scale}. A learning plan can only be opened from this gap."
    return {
        "skill": skill,
        "current_level": current,
        "required_level": required,
        "display_current": shown_current,
        "display_required": shown_required,
        "display_scale": display_scale,
        "gap_levels": max(0, shown_required - shown_current),
        "gap_score": score,
        "priority_score": priority_score(score, strategic, mandatory),
        "priority_label": "High" if score >= 0.5 or strategic or mandatory else "Medium" if score >= 0.25 else "Low",
        "source_gap_reference": reference,
        "source_type": source_type,
        "strategic": strategic,
        "mandatory": mandatory,
        "learning_plan_id": attached,
        "matching_courses": len(courses),
        "matched_course_ids": [course["id"] for course in courses],
        "why": why,
    }


def match_courses(db: Client, skill: str, current: int, required: int) -> list[dict[str, Any]]:
    ensure_schema(db)
    matched = []
    needle = skill.casefold()
    for course in _courses(db):
        if course["catalogue_status"] != "Active":
            continue
        covers = [item for item in course["skills"] if _skills_equivalent(needle, str(item["skill_name"]))]
        if not covers:
            continue
        level = max(int(item["level_delivered"]) for item in covers)
        if level <= current:
            continue
        if level > required + 1 and current + 1 < level:
            # Keep a reachable next step ahead of a far advanced course.
            course["_rank_penalty"] = 1
        else:
            course["_rank_penalty"] = 0
        course["matched_level"] = level
        matched.append(course)
    matched.sort(key=lambda course: (
        course["_rank_penalty"],
        course["matched_level"],
        DIFFICULTY_RANK[course["difficulty_level"]],
        -int(course["strategic_priority_flag"]),
        -int(course["is_mandatory"]),
    ))
    return matched


def _append_courses(db: Client, plan_id: str, gap: dict[str, Any], chosen: list[dict[str, Any]]) -> dict[str, Any]:
    plan = get_plan(db, plan_id)
    if plan.get("plan_status") not in {"Active", "Draft"}:
        raise HTTPException(status_code=400, detail="Only an open plan can receive another course.")
    existing = {item["course_id"] for item in plan["items"]}
    order = len(plan["items"])
    added_hours = 0.0
    for course in chosen:
        if course["id"] in existing:
            continue
        order += 1
        delivered = int(course.get("matched_level") or 0)
        gain = max(0, min(int(gap["required_level"]), delivered) - int(gap["current_level"]))
        db.table("lr_plan_items").insert({
            "id": _next_id(db, "LREC"),
            "learning_plan_id": plan_id,
            "course_id": course["id"],
            "sequence_order": order,
            "skill_gap_score": gap["gap_score"],
            "expected_proficiency_gain": gain,
            "status": "Recommended",
            "enrolled_at": None,
            "completed_at": None,
        }).execute()
        added_hours += float(course["duration_hours"])
    if added_hours:
        hours = float(plan["total_estimated_hours"]) + added_hours
        weeks = max(1, round(hours / HOURS_PER_WEEK))
        db.table("lr_plans").update({
            "total_estimated_hours": hours,
            "target_completion_date": (_utc() + timedelta(weeks=weeks)).date().isoformat(),
        }).eq("id", plan_id).execute()
        _audit(db, plan["employee_id"], "courses_added", plan_id)
    return get_plan(db, plan_id)


def generate_plan(db: Client, employee_id: str, source_gap_reference: str, course_ids: list[str] | None = None) -> dict[str, Any]:
    ensure_schema(db)
    if not str(source_gap_reference or "").strip():
        raise HTTPException(status_code=400, detail="A learning plan requires source_gap_reference.")
    gaps = list_skill_gaps(db, employee_id)
    gap = next((item for item in gaps if item["source_gap_reference"] == source_gap_reference), None)
    if not gap:
        raise HTTPException(status_code=400, detail="That skill gap is closed or is not a valid source for this employee.")
    courses = match_courses(db, gap["skill"], gap["current_level"], gap["required_level"])
    if course_ids:
        by_id = {course["id"]: course for course in courses}
        missing = [course_id for course_id in course_ids if course_id not in by_id]
        if missing:
            raise HTTPException(status_code=400, detail=f"A selected course does not raise {gap['skill']} from the current level.")
        chosen = [by_id[course_id] for course_id in course_ids]
    else:
        chosen = courses[:3]
    if gap["learning_plan_id"]:
        if course_ids:
            return _append_courses(db, gap["learning_plan_id"], gap, chosen)
        return get_plan(db, gap["learning_plan_id"])
    if not chosen:
        raise HTTPException(status_code=404, detail=f"No active courses currently cover {gap['skill']}.")
    hours = sum(float(course["duration_hours"]) for course in chosen)
    weeks = max(1, round(hours / HOURS_PER_WEEK))
    target_date = (_utc() + timedelta(weeks=weeks)).date().isoformat()
    score = max(priority_score(gap["gap_score"], course["strategic_priority_flag"], course["is_mandatory"]) for course in chosen)
    plan_id = _next_id(db, "LPLAN")
    db.table("lr_plans").insert({
        "id": plan_id,
        "employee_id": employee_id,
        "source_gap_reference": source_gap_reference,
        "title": f"{gap['skill']} growth plan",
        "target_skill_ids": _dumps([gap["skill"]]),
        "plan_status": "Active",
        "created_at": _iso(),
        "target_completion_date": target_date,
        "total_estimated_hours": hours,
        "priority_score": score,
        "abandonment_reason": None,
    }).execute()
    for index, course in enumerate(chosen, start=1):
        gain = max(0, min(gap["required_level"], int(course["matched_level"])) - gap["current_level"])
        db.table("lr_plan_items").insert({
            "id": _next_id(db, "LREC"),
            "learning_plan_id": plan_id,
            "course_id": course["id"],
            "sequence_order": index,
            "skill_gap_score": gap["gap_score"],
            "expected_proficiency_gain": gain,
            "status": "Recommended",
            "enrolled_at": None,
            "completed_at": None,
        }).execute()
    _audit(db, employee_id, "plan_generated", plan_id)
    return get_plan(db, plan_id)


def add_course_to_plan(db: Client, plan_id: str, course_id: str) -> dict[str, Any]:
    ensure_schema(db)
    plan = get_plan(db, plan_id)
    if plan.get("plan_status") not in {"Active", "Draft"}:
        raise HTTPException(status_code=400, detail="Only an open plan can receive another course.")
    if any(item["course_id"] == course_id for item in plan["items"]):
        return plan
    course = next((row for row in _courses(db) if row["id"] == course_id), None)
    if not course or course.get("catalogue_status") != "Active":
        raise HTTPException(status_code=400, detail="That course is not active in the catalogue.")
    targets = {str(name).casefold() for name in plan.get("target_skill_ids") or []}
    mapped = [skill for skill in course["skills"] if str(skill["skill_name"]).casefold() in targets]
    if not mapped:
        raise HTTPException(status_code=400, detail="This course does not teach a skill on this plan.")
    gaps = list_skill_gaps(db, plan["employee_id"])
    gap = next((item for item in gaps if item["source_gap_reference"] == plan.get("source_gap_reference")), None)
    current = int(gap["current_level"]) if gap else 0
    required = int(gap["required_level"]) if gap else 5
    delivered = max(int(skill["level_delivered"]) for skill in mapped)
    if delivered <= current:
        raise HTTPException(status_code=400, detail="This course does not raise the current level.")
    gain = max(0, min(required, delivered) - current)
    db.table("lr_plan_items").insert({
        "id": _next_id(db, "LREC"),
        "learning_plan_id": plan_id,
        "course_id": course_id,
        "sequence_order": len(plan["items"]) + 1,
        "skill_gap_score": gap["gap_score"] if gap else 0,
        "expected_proficiency_gain": gain,
        "status": "Recommended",
        "enrolled_at": None,
        "completed_at": None,
    }).execute()
    hours = float(plan["total_estimated_hours"]) + float(course["duration_hours"])
    weeks = max(1, round(hours / HOURS_PER_WEEK))
    db.table("lr_plans").update({
        "total_estimated_hours": hours,
        "target_completion_date": (_utc() + timedelta(weeks=weeks)).date().isoformat(),
    }).eq("id", plan_id).execute()
    _audit(db, plan["employee_id"], "course_added", f"{course_id} -> {plan_id}")
    return get_plan(db, plan_id)


def _items(db: Client, plan_id: str) -> list[dict[str, Any]]:
    items = db.table("lr_plan_items").select("*").eq("learning_plan_id", plan_id).execute().data or []
    items.sort(key=lambda row: int(row["sequence_order"]))
    courses = {course["id"]: course for course in _courses(db)}
    for item in items:
        course = courses.get(item["course_id"], {})
        item["course_title"] = course.get("course_title")
        item["duration_hours"] = course.get("duration_hours")
        item["difficulty_level"] = course.get("difficulty_level")
        item["has_assessment"] = course.get("has_assessment")
        item["modality"] = course.get("modality")
    return items


def get_plan(db: Client, plan_id: str) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("lr_plans").select("*").eq("id", plan_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Learning plan not found.")
    plan = rows[0]
    plan["target_skill_ids"] = _loads(plan.get("target_skill_ids"), [])
    plan["items"] = _items(db, plan_id)
    done = [item for item in plan["items"] if item["status"] == "Completed"]
    plan["progress_pct"] = round(100 * len(done) / len(plan["items"])) if plan["items"] else 0
    plan["estimated_weeks"] = max(1, round(float(plan["total_estimated_hours"]) / HOURS_PER_WEEK))
    plan["priority_score"] = float(plan["priority_score"])
    return plan


def list_plans(db: Client, employee_id: str) -> list[dict[str, Any]]:
    ensure_schema(db)
    rows = db.table("lr_plans").select("id").eq("employee_id", employee_id).execute().data or []
    return [get_plan(db, row["id"]) for row in rows]


def transition_item(db: Client, item_id: str, new_status: str, actor_employee_id: str | None = None) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("lr_plan_items").select("*").eq("id", item_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Learning item not found.")
    item = rows[0]
    plan = get_plan(db, item["learning_plan_id"])
    if actor_employee_id and plan["employee_id"] != actor_employee_id:
        raise HTTPException(status_code=403, detail="You cannot change another employee's learning item.")
    if new_status not in ITEM_TRANSITIONS.get(item["status"], set()):
        raise HTTPException(status_code=400, detail=f"Cannot move an item from {item['status']} to {new_status}.")
    payload: dict[str, Any] = {"status": new_status}
    if new_status == "Enrolled":
        payload["enrolled_at"] = _iso()
    if new_status == "Completed":
        if not item.get("enrolled_at") and item["status"] != "In Progress":
            raise HTTPException(status_code=400, detail="Enroll before completing a course.")
        payload["completed_at"] = _iso()
        if not item.get("enrolled_at"):
            payload["enrolled_at"] = item.get("enrolled_at") or _iso()
    db.table("lr_plan_items").update(payload).eq("id", item_id).execute()
    _audit(db, plan["employee_id"], "item_" + new_status.lower().replace(" ", "_"), item_id)
    if new_status == "Completed":
        _maybe_complete_plan(db, plan["id"])
    return get_plan(db, plan["id"])


def _maybe_complete_plan(db: Client, plan_id: str) -> None:
    items = _items(db, plan_id)
    if items and all(item["status"] in {"Completed", "Skipped"} for item in items) and any(item["status"] == "Completed" for item in items):
        db.table("lr_plans").update({"plan_status": "Completed"}).eq("id", plan_id).execute()


def abandon_plan(db: Client, plan_id: str, reason: str, actor_employee_id: str | None = None) -> dict[str, Any]:
    plan = get_plan(db, plan_id)
    if actor_employee_id and plan["employee_id"] != actor_employee_id:
        raise HTTPException(status_code=403, detail="You cannot abandon another employee's plan.")
    if not str(reason or "").strip():
        raise HTTPException(status_code=400, detail="An abandoned plan requires a reason.")
    if "Abandoned" not in PLAN_TRANSITIONS.get(plan["plan_status"], set()):
        raise HTTPException(status_code=400, detail=f"Cannot abandon a plan that is {plan['plan_status']}.")
    db.table("lr_plans").update({"plan_status": "Abandoned", "abandonment_reason": reason.strip()}).eq("id", plan_id).execute()
    _audit(db, plan["employee_id"], "plan_abandoned", reason.strip())
    return get_plan(db, plan_id)


def submit_assessment(db: Client, item_id: str, score: int | None = None, actor_employee_id: str | None = None, answers: list[int] | None = None) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("lr_plan_items").select("*").eq("id", item_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Learning item not found.")
    item = rows[0]
    plan = get_plan(db, item["learning_plan_id"])
    if actor_employee_id and plan["employee_id"] != actor_employee_id:
        raise HTTPException(status_code=403, detail="You cannot submit an assessment for another employee.")
    if item["status"] != "Completed":
        raise HTTPException(status_code=400, detail="Complete the course before taking the assessment. Completion alone does not change proficiency.")
    course = next((row for row in _courses(db) if row["id"] == item["course_id"]), None)
    if not course or not course["has_assessment"]:
        raise HTTPException(status_code=400, detail="This course does not provide an assessment, so completion cannot verify a proficiency change.")
    prior = db.table("lr_assessments").select("*").eq("learning_plan_item_id", item_id).execute().data or []
    if any(bool(row.get("passed")) for row in prior):
        raise HTTPException(status_code=400, detail="This course already has a passed assessment. Sync it before the skill can change. A failed attempt can be retaken.")
    questions = _questions(db, course["id"])
    if answers is not None:
        if len(answers) != len(questions) or not questions:
            raise HTTPException(status_code=400, detail="Answer every assessment question.")
        correct = sum(1 for index, question in enumerate(questions) if int(answers[index]) == int(question["correct_index"]))
        score = round(100 * correct / len(questions))
    if score is None or score < 0 or score > 100:
        raise HTTPException(status_code=400, detail="Assessment score must be between 0 and 100.")
    skill = plan["target_skill_ids"][0]
    if not any(str(row["skill_name"]).casefold() == skill.casefold() for row in course["skills"]):
        raise HTTPException(status_code=400, detail="This assessment is not for the plan's target skill.")
    levels = _employee_levels(db, plan["employee_id"])
    before = levels.get(skill.casefold(), {}).get("level", 0)
    delivered = max(int(row["level_delivered"]) for row in course["skills"] if str(row["skill_name"]).casefold() == skill.casefold())
    intended = max(before, min(5, delivered))
    passed = score >= PASS_SCORE
    assessment_id = _next_id(db, "ASSESS")
    db.table("lr_assessments").insert({
        "id": assessment_id,
        "learning_plan_item_id": item_id,
        "employee_id": plan["employee_id"],
        "skill_name": skill,
        "proficiency_before": before,
        "proficiency_after": None,
        "intended_proficiency": intended if passed else before,
        "assessment_score_pct": score,
        "assessment_date": _iso(),
        "passed": int(passed),
        "sfa_sync_status": "Pending",
    }).execute()
    _audit(db, plan["employee_id"], "assessment_passed" if passed else "assessment_failed", assessment_id)
    return get_assessment(db, assessment_id)


def get_assessment(db: Client, assessment_id: str) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("lr_assessments").select("*").eq("id", assessment_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    row = rows[0]
    row["passed"] = bool(row.get("passed"))
    row["proficiency_verified_flag"] = proficiency_verified(row["passed"], row["sfa_sync_status"])
    row["proficiency_after"] = row.get("proficiency_after")
    return row


def sync_assessment(db: Client, assessment_id: str, force_fail: bool = False) -> dict[str, Any]:
    ensure_schema(db)
    row = get_assessment(db, assessment_id)
    if not row["passed"]:
        raise HTTPException(status_code=400, detail="A failed assessment cannot synchronize a proficiency gain.")
    if row["sfa_sync_status"] == "Synced":
        return row
    if force_fail:
        db.table("lr_assessments").update({"sfa_sync_status": "Failed", "proficiency_after": None}).eq("id", assessment_id).execute()
        _audit(db, row["employee_id"], "sync_failed", assessment_id)
        return get_assessment(db, assessment_id)
    with db.transaction():
        item_rows = db.table("lr_plan_items").select("*").eq("id", row["learning_plan_item_id"]).limit(1).execute().data or []
        plan = get_plan(db, item_rows[0]["learning_plan_id"]) if item_rows else None
        required = int(row["intended_proficiency"])
        if plan:
            origin = next((gap for gap in list_skill_gaps(db, row["employee_id"]) if gap["source_gap_reference"] == plan["source_gap_reference"]), None)
            if origin:
                required = int(origin["required_level"])
        before_rows = db.table("skills").select("*").eq("employee_id", row["employee_id"]).execute().data or []
        match = next((skill for skill in before_rows if str(skill.get("name") or "").casefold() == row["skill_name"].casefold()), None)
        stored = scale_to_storage(int(row["intended_proficiency"]), (match or {}).get("proficiency") or _scale_hint(before_rows))
        if match:
            db.table("skills").update({"proficiency": stored, "verified": True}).eq("id", match["id"]).execute()
        else:
            db.table("skills").insert({
                "id": str(uuid.uuid4()),
                "employee_id": row["employee_id"],
                "name": row["skill_name"],
                "proficiency": stored,
                "verified": True,
            }).execute()
        db.table("lr_assessments").update({
            "sfa_sync_status": "Synced",
            "proficiency_after": int(row["intended_proficiency"]),
        }).eq("id", assessment_id).execute()
        after_level = int(row["intended_proficiency"])
        status = closure_status(int(row["proficiency_before"]), after_level, required)
        db.table("lr_gap_closures").insert({
            "id": str(uuid.uuid4()),
            "source_gap_reference": plan["source_gap_reference"] if plan else row["learning_plan_item_id"],
            "employee_id": row["employee_id"],
            "skill_name": row["skill_name"],
            "before_level": int(row["proficiency_before"]),
            "after_level": after_level,
            "required_level": required,
            "closure_status": status,
            "created_at": _iso(),
        }).execute()
        _audit(db, row["employee_id"], "sync_succeeded", assessment_id)
        _audit(db, row["employee_id"], "proficiency_updated", f"{row['skill_name']} {row['proficiency_before']}->{after_level}")
        if plan:
            _feedback_source_gap(db, row["employee_id"], row["skill_name"], after_level, plan["source_gap_reference"])
            _audit(db, row["employee_id"], "gap_closed", plan["source_gap_reference"])
    return get_assessment(db, assessment_id)


def list_assessments(db: Client, employee_id: str) -> list[dict[str, Any]]:
    ensure_schema(db)
    rows = db.table("lr_assessments").select("id").eq("employee_id", employee_id).execute().data or []
    return [get_assessment(db, row["id"]) for row in rows]


def list_closures(db: Client, employee_id: str | None = None) -> list[dict[str, Any]]:
    ensure_schema(db)
    query = db.table("lr_gap_closures").select("*")
    if employee_id:
        query = query.eq("employee_id", employee_id)
    return query.execute().data or []


def _assigned_items(db: Client, employee_ids: list[str] | None = None) -> list[dict[str, Any]]:
    plans = db.table("lr_plans").select("*").execute().data or []
    if employee_ids is not None:
        allowed = set(employee_ids)
        plans = [plan for plan in plans if plan["employee_id"] in allowed]
    courses = {course["id"]: course for course in _courses(db)}
    items = []
    for plan in plans:
        if plan["plan_status"] == "Abandoned":
            continue
        for item in _items(db, plan["id"]):
            course = courses.get(item["course_id"])
            if not course:
                continue
            assessments = db.table("lr_assessments").select("*").eq("learning_plan_item_id", item["id"]).execute().data or []
            verified = any(proficiency_verified(bool(row.get("passed")), row.get("sfa_sync_status")) for row in assessments)
            items.append({
                "employee_id": plan["employee_id"],
                "mandatory": course["is_mandatory"],
                "strategic": course["strategic_priority_flag"],
                "completed": item["status"] == "Completed",
                "verified": verified,
            })
    return items


def _ratio(verified: int, assigned: int) -> dict[str, Any]:
    if assigned == 0:
        return {"assigned": 0, "verified_completed": 0, "ratio": None, "state": "No items assigned"}
    return {"assigned": assigned, "verified_completed": verified, "ratio": round(verified / assigned, 4), "state": "Calculated"}


def compliance(db: Client, kind: str, employee_id: str | None = None) -> dict[str, Any]:
    ensure_schema(db)
    employee_ids = [employee_id] if employee_id else None
    items = _assigned_items(db, employee_ids)
    flag = "mandatory" if kind == "mandatory" else "strategic"
    relevant = [item for item in items if item[flag]]
    verified = sum(1 for item in relevant if item["completed"] and item["verified"])
    return _ratio(verified, len(relevant))


def manager_overview(db: Client, manager_id: str) -> dict[str, Any]:
    ensure_schema(db)
    people, scope = _team_people(db, manager_id)
    rows = []
    for person in people:
        for gap in list_skill_gaps(db, person["id"]):
            if not gap["strategic"]:
                continue
            rows.append({
                "employee_id": person["id"],
                "employee": person.get("full_name"),
                "skill": gap["skill"],
                "current_level": gap["current_level"],
                "required_level": gap["required_level"],
                "gap_levels": gap["gap_levels"],
                "strategic": True,
                "learning_plan_status": "Attached" if gap["learning_plan_id"] else "No plan",
            })
    ids = [person["id"] for person in people]
    team_items = _assigned_items(db, ids)

    def _team_ratio(flag: str) -> dict[str, Any]:
        relevant = [item for item in team_items if item[flag]]
        verified = sum(1 for item in relevant if item["completed"] and item["verified"])
        return _ratio(verified, len(relevant))

    team_ids = {person["id"] for person in people}
    names = {person["id"]: person.get("full_name") for person in people}
    team_plans = [
        {
            "id": plan["id"],
            "employee": names.get(plan["employee_id"], "Employee"),
            "title": plan.get("title"),
            "plan_status": plan.get("plan_status"),
            "priority_score": float(plan.get("priority_score") or 0),
            "total_estimated_hours": plan.get("total_estimated_hours") or 0,
        }
        for plan in (db.table("lr_plans").select("id, employee_id, title, plan_status, priority_score, total_estimated_hours").execute().data or [])
        if plan["employee_id"] in team_ids and plan.get("plan_status") in {"Draft", "Active"}
    ]
    unverified = [
        {
            "employee": names.get(row["employee_id"], "Employee"),
            "skill": row.get("skill_name"),
            "score": row.get("assessment_score_pct"),
            "sfa_sync_status": row.get("sfa_sync_status"),
        }
        for row in (db.table("lr_assessments").select("employee_id, skill_name, passed, sfa_sync_status, assessment_score_pct").execute().data or [])
        if row["employee_id"] in team_ids and bool(row.get("passed")) and row.get("sfa_sync_status") != "Synced"
    ]
    return {
        "team_size": len(people),
        "strategic_gaps_without_plan": [row for row in rows if row["learning_plan_status"] == "No plan"],
        "strategic_gaps": rows,
        "active_plans": team_plans,
        "unverified_completions": unverified,
        "mandatory_compliance": _team_ratio("mandatory"),
        "strategic_coverage": _team_ratio("strategic"),
        "scope": scope,
    }


def _team_people(db: Client, anchor_id: str) -> tuple[list[dict[str, Any]], str]:
    fields = "id, full_name, role, department, manager_id"
    direct = db.table("employees").select(fields).eq("manager_id", anchor_id).limit(8).execute().data or []
    if direct:
        return direct, "Direct reports"
    anchor_rows = db.table("employees").select(fields).eq("id", anchor_id).limit(1).execute().data or []
    if not anchor_rows:
        return [], "Employee not found"
    anchor = anchor_rows[0]
    if anchor.get("manager_id"):
        peers = db.table("employees").select(fields).eq("manager_id", anchor["manager_id"]).limit(8).execute().data or []
        if len(peers) > 1:
            return peers, "People who report to the same manager"
    if anchor.get("department"):
        department_people = db.table("employees").select(fields).eq("department", anchor["department"]).limit(8).execute().data or []
        if len(department_people) > 1:
            return department_people, f"People in {anchor['department']}"
    return [anchor], "This employee has no direct reports. Showing their own strategic gaps."


def employer_overview(db: Client) -> dict[str, Any]:
    ensure_schema(db)
    plans = db.table("lr_plans").select("*").execute().data or []
    abandoned = [plan for plan in plans if plan["plan_status"] == "Abandoned"]
    assessments = db.table("lr_assessments").select("*").execute().data or []
    verified = [row for row in assessments if proficiency_verified(bool(row.get("passed")), row.get("sfa_sync_status"))]
    unverified = [row for row in assessments if bool(row.get("passed")) and row.get("sfa_sync_status") != "Synced"]
    courses = _courses(db)
    used = {item["course_id"] for plan in plans for item in _items(db, plan["id"])}
    unused = [course["course_title"] for course in courses if course["catalogue_status"] == "Active" and course["id"] not in used]
    hours = sum(float(plan["total_estimated_hours"] or 0) for plan in plans if plan["plan_status"] != "Abandoned")
    cost = 0.0
    by_id = {course["id"]: course for course in courses}
    for plan in plans:
        if plan["plan_status"] == "Abandoned":
            continue
        for item in _items(db, plan["id"]):
            cost += float(by_id.get(item["course_id"], {}).get("cost_lkr") or 0)
    people = {row["id"]: row for row in (db.table("employees").select("id, department").execute().data or [])}
    departments: dict[str, dict[str, Any]] = {}
    for plan in plans:
        department = str((people.get(plan["employee_id"]) or {}).get("department") or "Unassigned")
        bucket = departments.setdefault(department, {"department": department, "plans": 0, "active": 0, "abandoned": 0, "hours": 0.0})
        bucket["plans"] += 1
        if plan["plan_status"] == "Active":
            bucket["active"] += 1
        if plan["plan_status"] == "Abandoned":
            bucket["abandoned"] += 1
        else:
            bucket["hours"] += float(plan.get("total_estimated_hours") or 0)
    return {
        "mandatory_compliance": compliance(db, "mandatory"),
        "strategic_coverage": compliance(db, "strategic"),
        "verified_skill_gains": len(verified),
        "unverified_passes": len(unverified),
        "abandoned_plans": len(abandoned),
        "learning_hours": hours,
        "catalogue_cost_lkr": cost,
        "unused_active_courses": unused,
        "plans_by_department": sorted(departments.values(), key=lambda row: (-row["plans"], row["department"])),
        "assessment_outcomes": {
            "passed": sum(1 for row in assessments if bool(row.get("passed"))),
            "failed": sum(1 for row in assessments if not bool(row.get("passed"))),
            "pending_sync": sum(1 for row in assessments if bool(row.get("passed")) and row.get("sfa_sync_status") == "Pending"),
            "synced": sum(1 for row in assessments if row.get("sfa_sync_status") == "Synced"),
            "failed_sync": sum(1 for row in assessments if row.get("sfa_sync_status") == "Failed"),
        },
        "gap_closures": list_closures(db),
    }


def next_learning_answer(db: Client, employee_id: str) -> dict[str, Any]:
    gaps = list_skill_gaps(db, employee_id)
    if not gaps:
        return {"answer": "No unresolved skill gaps found. Your current role profile does not require an additional learning plan."}
    gap = next((item for item in gaps if item["matching_courses"] and not item["learning_plan_id"]), None)
    if gap is None:
        gap = next((item for item in gaps if item["matching_courses"]), gaps[0])
    courses = match_courses(db, gap["skill"], gap["current_level"], gap["required_level"])
    if not courses:
        return {"answer": f"No active courses currently cover {gap['skill']}."}
    chosen = courses[:3]
    hours = sum(float(course["duration_hours"]) for course in chosen)
    weeks = max(1, round(hours / HOURS_PER_WEEK))
    lines = [
        f"Your highest-priority current gap is {gap['skill']}.",
        f"Current proficiency: {gap['current_level']}",
        f"Required proficiency: {gap['required_level']}",
        f"Gap: {gap['gap_levels']} level(s)",
        "Recommended sequence:",
    ]
    for index, course in enumerate(chosen, start=1):
        lines.append(f"{index}. {course['course_title']} — {int(course['duration_hours'])}h")
    lines.append(f"Total learning time: {int(hours)}h")
    lines.append(f"Estimated duration: {weeks} weeks at {HOURS_PER_WEEK} hours per week.")
    lines.append("Assessment is required before the skill is officially updated. Course completion alone does not change proficiency.")
    sequence = [
        {
            "course_id": course["id"],
            "course_title": course["course_title"],
            "duration_hours": float(course["duration_hours"]),
            "difficulty_level": course["difficulty_level"],
            "has_assessment": bool(course["has_assessment"]),
            "modality": course["modality"],
            "provider": course.get("provider"),
        }
        for course in chosen
    ]
    return {
        "answer": "\n".join(lines),
        "source_gap_reference": gap["source_gap_reference"],
        "hours": hours,
        "weeks": weeks,
        "gap": gap,
        "sequence": sequence,
    }


def seed_demonstration(db: Client, email: str = "alex.carter@company.com") -> dict[str, Any]:
    """Create a varied plan/assessment set once. Does not sync a pass, so official skills stay unchanged."""
    ensure_schema(db)
    marker = db.table("lr_audit").select("id").eq("event", "demonstration_seed").limit(1).execute().data or []
    if marker:
        return {"status": "already_seeded"}
    people = db.table("employees").select("id").eq("email", email).limit(1).execute().data or []
    if not people:
        return {"status": "employee_not_found"}
    employee_id = people[0]["id"]
    gaps = [gap for gap in list_skill_gaps(db, employee_id) if gap["matching_courses"] and not gap["learning_plan_id"]]
    if len(gaps) < 3:
        return {"status": "not_enough_gaps", "available": len(gaps)}
    plans = [generate_plan(db, employee_id, gap["source_gap_reference"]) for gap in gaps[:3]]
    abandon_plan(db, plans[2]["id"], "Focus moved to the higher-priority networking and architecture plans.")
    failed_item = plans[0]["items"][0]["id"]
    transition_item(db, failed_item, "Enrolled")
    transition_item(db, failed_item, "In Progress")
    transition_item(db, failed_item, "Completed")
    submit_assessment(db, failed_item, 52)
    pending_item = plans[1]["items"][0]["id"]
    transition_item(db, pending_item, "Enrolled")
    transition_item(db, pending_item, "In Progress")
    transition_item(db, pending_item, "Completed")
    pending = submit_assessment(db, pending_item, 91)
    sync_assessment(db, pending["id"], force_fail=True)
    _audit(db, employee_id, "demonstration_seed", "abandoned, failed assessment, failed sync")
    return {"status": "seeded", "plans": [plan["id"] for plan in plans]}

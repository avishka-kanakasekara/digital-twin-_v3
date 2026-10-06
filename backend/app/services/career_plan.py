"""Career Coach plan engine.

A goal becomes a dated plan. Every skill the target role still requires gets three
milestones: learn it, use it in real work, and get it confirmed at the required level.
The schedule comes from the hours per week the employee can give, and the plan is
compared against the target date the employee chose.

Scores and dates are deterministic. Gemini is only used to phrase coach answers,
and those answers are grounded in the plan facts.
"""

from __future__ import annotations

import json
import math
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException

from app.database import Client
from app.services.career_market import role_profile
from app.services.career_coach import (
    ROLE_SUGGESTIONS,
    _build_internal_role_matches,
    _match_requirement_level,
    _role_family,
    award_career_xp,
    goal_requirement_rows,
    sync_goal_gaps,
)

HOURS_PER_LEVEL = 20
PHASES = ("learn", "apply", "prove")
PHASE_SHARE = {"learn": 0.4, "apply": 0.4, "prove": 0.2}
DEFAULT_HOURS_PER_WEEK = 5
DEFAULT_TARGET_MONTHS = 12
STALL_DAYS = 14
CHECKIN_XP = 10
STEP_XP = {"learn": 60, "apply": 90, "prove": 120}

PRACTICE_IDEAS = {
    "cloud cost": "Run a cost review of one production workload and propose savings with numbers attached.",
    "cloud networking": "Design private connectivity, DNS, or network segmentation for one service and have it reviewed.",
    "aws": "Own the AWS design for one component, including failure modes and recovery.",
    "azure": "Deliver one workload or integration on Azure from design to production.",
    "terraform": "Move one hand-built resource into a reviewed Terraform module.",
    "kubernetes": "Lead an upgrade or take on-call for one Kubernetes workload.",
    "system design": "Write a design document with options and tradeoffs, then present it at a design review.",
    "cloud security": "Run a threat review of one service and fix the highest finding.",
    "ci/cd": "Shorten or harden one delivery pipeline and measure the change.",
    "observability": "Add dashboards and alerts for one service and use them in a real incident review.",
    "people leadership": "Run regular one-to-ones for one or two people and agree growth goals with them.",
    "delivery management": "Plan and track one release end to end, including risks and dates.",
    "stakeholder management": "Run the planning conversation with one partner team and write up the agreement.",
    "hiring & coaching": "Join an interview loop and give structured feedback, or coach a newer teammate.",
    "technical leadership": "Lead a cross-team technical decision and document the outcome.",
    "architecture reviews": "Review two designs from other teams and record the decisions.",
    "leadership": "Mentor a teammate through one piece of work and review their code each week.",
    "backend development": "Own one service change from design to production, including tests and rollout.",
}

ACTIVE_PLAN = {"Active", "Draft"}
SKILL_FIELDS = "name, proficiency, category, sub_category, years_experience, verified, source"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _now().date()


def _parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)
    text = str(value).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        try:
            parsed = datetime.strptime(text[:19], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                parsed = datetime.strptime(text[:10], "%Y-%m-%d")
            except ValueError:
                return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _add_months(start: date, months: int) -> date:
    month = start.month - 1 + months
    year = start.year + month // 12
    month = month % 12 + 1
    day = min(start.day, [31, 29 if year % 4 == 0 and (year % 100 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


def months_from_timeline(timeline: Any) -> int:
    text = str(timeline or "").lower()
    numbers = [int(value) for value in re.findall(r"\d+", text)]
    if not numbers:
        return DEFAULT_TARGET_MONTHS
    months = max(numbers)
    if "year" in text:
        months *= 12
    return max(1, min(60, months))


def _loads(value: Any, fallback: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return json.loads(value)
        except ValueError:
            return fallback
    return fallback


_SCHEMA_READY = False


def ensure_schema(db: Client) -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    if db.db.dialect == "sqlite":
        statements = [
            """CREATE TABLE IF NOT EXISTS career_plan_settings (
                id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, hours_per_week INTEGER NOT NULL,
                target_date TEXT NOT NULL, started_at TEXT NOT NULL, baseline_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL)""",
            """CREATE TABLE IF NOT EXISTS career_checkins (
                id TEXT PRIMARY KEY, goal_id TEXT NOT NULL, employee_id TEXT NOT NULL, skill TEXT,
                hours REAL NOT NULL, note TEXT, created_at TEXT NOT NULL)""",
        ]
    else:
        statements = [
            """IF OBJECT_ID(N'dbo.career_plan_settings', N'U') IS NULL CREATE TABLE [dbo].[career_plan_settings] (
                [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [employee_id] NVARCHAR(80) NOT NULL, [hours_per_week] INT NOT NULL,
                [target_date] NVARCHAR(40) NOT NULL, [started_at] NVARCHAR(40) NOT NULL, [baseline_json] NVARCHAR(MAX) NOT NULL,
                [updated_at] NVARCHAR(40) NOT NULL)""",
            """IF OBJECT_ID(N'dbo.career_checkins', N'U') IS NULL CREATE TABLE [dbo].[career_checkins] (
                [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [goal_id] NVARCHAR(80) NOT NULL, [employee_id] NVARCHAR(80) NOT NULL,
                [skill] NVARCHAR(200), [hours] FLOAT NOT NULL, [note] NVARCHAR(MAX), [created_at] NVARCHAR(40) NOT NULL)""",
        ]
    for statement in statements:
        db.db.execute(statement)
    _SCHEMA_READY = True


# ── Goal and settings ─────────────────────────────────────────────────────


def active_goal(db: Client, employee_id: str) -> dict[str, Any] | None:
    rows = db.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).limit(1).execute().data or []
    return rows[0] if rows else None


def _settings(db: Client, goal: dict[str, Any]) -> dict[str, Any]:
    rows = db.table("career_plan_settings").select("*").eq("id", goal["id"]).limit(1).execute().data or []
    if rows:
        row = rows[0]
        row["baseline"] = _loads(row.get("baseline_json"), {})
        return row
    started = (_parse_dt(goal.get("created_at")) or _now()).date()
    row = {
        "id": goal["id"],
        "employee_id": goal["employee_id"],
        "hours_per_week": DEFAULT_HOURS_PER_WEEK,
        "target_date": _add_months(started, months_from_timeline(goal.get("timeline"))).isoformat(),
        "started_at": started.isoformat(),
        "baseline_json": "{}",
        "updated_at": _now().isoformat(),
    }
    db.table("career_plan_settings").insert(row).execute()
    row["baseline"] = {}
    return row


def create_goal(db: Client, employee_id: str, target_role: str, target_months: int, hours_per_week: int, visible_to_manager: bool) -> None:
    ensure_schema(db)
    role = " ".join(str(target_role or "").split())
    if len(role) < 3:
        raise HTTPException(status_code=400, detail="Choose the role you are aiming for.")
    months = max(3, min(36, int(target_months)))
    hours = max(1, min(20, int(hours_per_week)))
    employees = db.table("employees").select("id").eq("id", employee_id).limit(1).execute().data or []
    if not employees:
        raise HTTPException(status_code=404, detail="Employee not found.")
    now = _now()
    for row in db.table("career_goals").select("id").eq("employee_id", employee_id).eq("is_active", True).execute().data or []:
        db.table("career_goals").update({"is_active": False, "updated_at": now.isoformat()}).eq("id", row["id"]).execute()
    goal_id = str(uuid.uuid4())
    db.table("career_goals").insert({
        "id": goal_id,
        "employee_id": employee_id,
        "target_role": role,
        "timeline": f"{months} months",
        "focus_area": _role_family(role.lower()).replace("_", " ").title(),
        "visible_to_manager": bool(visible_to_manager),
        "is_active": True,
        "readiness_score": 0,
    }).execute()
    db.table("career_plan_settings").insert({
        "id": goal_id,
        "employee_id": employee_id,
        "hours_per_week": hours,
        "target_date": _add_months(now.date(), months).isoformat(),
        "started_at": now.date().isoformat(),
        "baseline_json": "{}",
        "updated_at": now.isoformat(),
    }).execute()


def update_settings(db: Client, employee_id: str, hours_per_week: int | None, target_months: int | None) -> None:
    ensure_schema(db)
    goal = active_goal(db, employee_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Set a career goal first.")
    settings = _settings(db, goal)
    changes: dict[str, Any] = {"updated_at": _now().isoformat()}
    if hours_per_week is not None:
        changes["hours_per_week"] = max(1, min(20, int(hours_per_week)))
    if target_months is not None:
        months = max(3, min(36, int(target_months)))
        started = (_parse_dt(settings["started_at"]) or _now()).date()
        changes["target_date"] = _add_months(started, months).isoformat()
        db.table("career_goals").update({"timeline": f"{months} months"}).eq("id", goal["id"]).execute()
    db.table("career_plan_settings").update(changes).eq("id", goal["id"]).execute()


def set_visibility(db: Client, employee_id: str, visible: bool) -> None:
    goal = active_goal(db, employee_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Set a career goal first.")
    db.table("career_goals").update({"visible_to_manager": bool(visible)}).eq("id", goal["id"]).execute()


# ── Role preview ──────────────────────────────────────────────────────────


def _open_roles(db: Client) -> list[dict[str, Any]]:
    try:
        return db.table("internal_roles").select("*").eq("is_open", True).execute().data or []
    except Exception:
        return []


def role_options(db: Client, open_roles: list[dict[str, Any]] | None = None) -> list[str]:
    names = list(ROLE_SUGGESTIONS)
    try:
        for row in open_roles if open_roles is not None else _open_roles(db):
            title = str(row.get("title") or "").strip()
            if title and title.lower() not in {name.lower() for name in names}:
                names.append(title)
    except Exception:
        pass
    return names


def preview_role(db: Client, employee_id: str, target_role: str) -> dict[str, Any]:
    skills = db.table("skills").select(SKILL_FIELDS).eq("employee_id", employee_id).execute().data or []
    profile = role_profile(db, employee_id, target_role, skills)
    rows = goal_requirement_rows("preview", target_role, skills, profile["requirements"])
    rows.sort(key=lambda row: (-row["gap"], row["skill"]))
    required_sum = sum(row["required"] for row in rows) or 1
    covered = sum(min(row["current"], row["required"]) for row in rows)
    hours = sum(row["hours_to_close"] for row in rows if row["gap"] > 0)
    return {
        "target_role": target_role,
        "market": _market_summary(profile),
        "readiness_pct": round(100 * covered / required_sum),
        "met": [{"skill": row["skill"], "current": row["current"], "required": row["required"]} for row in rows if row["gap"] == 0],
        "to_build": [{"skill": row["skill"], "current": row["current"], "required": row["required"]} for row in rows if row["gap"] > 0],
        "total_hours": hours,
    }


# ── Plan ──────────────────────────────────────────────────────────────────


def _market_summary(profile: dict[str, Any]) -> dict[str, Any]:
    return {
        "source": profile.get("source") or "library",
        "generated_at": profile.get("generated_at"),
        "summary": profile.get("summary"),
        "sources": profile.get("sources") or [],
        "queries": profile.get("queries") or [],
    }


def refresh_market(db: Client, employee_id: str) -> None:
    goal = active_goal(db, employee_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Set a career goal first.")
    skills = db.table("skills").select(SKILL_FIELDS).eq("employee_id", employee_id).execute().data or []
    role_profile(db, employee_id, str(goal["target_role"]), skills, refresh=True)


def _learning_links(db: Client, employee_id: str, gaps: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Learning Recommendation plans and course suggestions per career gap."""
    links: dict[str, dict[str, Any]] = {}
    if not gaps:
        return links
    try:
        from app.services import learning_recommendation as lr

        lr.ensure_schema(db)
        plans = db.table("lr_plans").select("*").eq("employee_id", employee_id).execute().data or []
        courses = lr._courses(db)
    except Exception as exc:
        print(f"[career_plan] Learning data unavailable: {exc}")
        return links
    by_course = {course["id"]: course for course in courses}
    chosen: dict[str, dict[str, Any]] = {}
    for gap in gaps:
        candidates = []
        for plan in plans:
            targets = [str(name) for name in _loads(plan.get("target_skill_ids"), [])]
            if plan.get("source_gap_reference") == gap["gap_id"] or any(lr._skills_equivalent(gap["skill"], name) for name in targets):
                if plan.get("plan_status") in ACTIVE_PLAN or plan.get("plan_status") == "Completed":
                    candidates.append(plan)
        candidates.sort(key=lambda plan: (plan.get("plan_status") not in ACTIVE_PLAN, str(plan.get("created_at") or "")), reverse=False)
        if candidates:
            chosen[gap["gap_id"]] = candidates[0]
    items_by_plan: dict[str, list[dict[str, Any]]] = {}
    plan_ids = [plan["id"] for plan in chosen.values()]
    if plan_ids:
        for item in db.table("lr_plan_items").select("*").in_("learning_plan_id", plan_ids).execute().data or []:
            items_by_plan.setdefault(item["learning_plan_id"], []).append(item)
    for gap in gaps:
        current5, required5 = lr._learning_levels(gap["current"], gap["required"], 10)
        suggestions = []
        for course in courses:
            if course.get("catalogue_status") != "Active":
                continue
            levels = [int(item["level_delivered"]) for item in course["skills"] if lr._skills_equivalent(gap["skill"], str(item["skill_name"]))]
            if not levels or max(levels) <= current5:
                continue
            suggestions.append((max(levels), float(course.get("duration_hours") or 0), course))
        suggestions.sort(key=lambda row: (row[0], row[1]))
        plan = chosen.get(gap["gap_id"])
        link: dict[str, Any] = {
            "plan_id": None,
            "plan_status": None,
            "progress_pct": 0,
            "courses": [],
            "suggested_courses": [
                {"id": course["id"], "title": course["course_title"], "hours": float(course.get("duration_hours") or 0), "level": level}
                for level, _hours, course in suggestions[:3]
            ],
            "course_count": len(suggestions),
            "learning_target": required5,
        }
        if plan:
            items = sorted(items_by_plan.get(plan["id"], []), key=lambda item: int(item.get("sequence_order") or 0))
            live = [item for item in items if item.get("status") != "Skipped"]
            done = [item for item in live if item.get("status") == "Completed"]
            link.update({
                "plan_id": plan["id"],
                "plan_status": plan.get("plan_status"),
                "progress_pct": round(100 * len(done) / len(live)) if live else 0,
                "courses": [
                    {
                        "id": item["id"],
                        "title": (by_course.get(item["course_id"]) or {}).get("course_title") or item["course_id"],
                        "status": item.get("status"),
                        "hours": float((by_course.get(item["course_id"]) or {}).get("duration_hours") or 0),
                    }
                    for item in items
                ],
            })
        links[gap["gap_id"]] = link
    return links


def _project_for(skill: str, requirement: str, projects: list[dict[str, Any]]) -> dict[str, Any] | None:
    needles = {skill.lower(), requirement.lower()}
    for project in projects:
        status = str(project.get("status") or "").lower()
        if status in {"completed", "done", "closed", "cancelled"}:
            continue
        technologies = _loads(project.get("technologies"), [])
        if isinstance(technologies, str):
            technologies = [technologies]
        label = f"{project.get('name') or ''} {project.get('description') or ''} {' '.join(str(item) for item in technologies)}".lower()
        if any(len(needle) >= 3 and needle in label for needle in needles):
            return project
    return None


def _phase_hours(total: float) -> dict[str, int]:
    total = max(HOURS_PER_LEVEL, total)
    return {phase: max(4, round(total * share)) for phase, share in PHASE_SHARE.items()}


def _step_id(goal_id: str, requirement: str, phase: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{goal_id}:plan:{requirement}:{phase}"))


def build_plan(db: Client, employee_id: str) -> dict[str, Any]:
    ensure_schema(db)
    people = {row["id"]: row for row in db.table("employees").select("id, full_name, role, department, manager_id").execute().data or []}
    employee = people.get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")
    goal = active_goal(db, employee_id)
    open_roles = _open_roles(db)
    base = {
        "employee": {
            "id": employee_id,
            "name": employee.get("full_name"),
            "role": employee.get("role"),
            "department": employee.get("department"),
        },
        "role_options": role_options(db, open_roles),
    }
    if not goal:
        return {**base, "goal": None}

    goal_id = str(goal["id"])
    settings = _settings(db, goal)
    hours_per_week = max(1, int(settings.get("hours_per_week") or DEFAULT_HOURS_PER_WEEK))
    target_date = (_parse_dt(settings.get("target_date")) or _now()).date()
    started_at = (_parse_dt(settings.get("started_at")) or _now()).date()
    today = _today()

    all_skills = db.table("skills").select(f"employee_id, {SKILL_FIELDS}").execute().data or []
    skills = [row for row in all_skills if row.get("employee_id") == employee_id]
    profile = role_profile(db, employee_id, str(goal["target_role"]), skills)
    rows = goal_requirement_rows(goal_id, str(goal["target_role"]), skills, profile["requirements"])
    sync_goal_gaps(db, goal_id, [row["gap_row"] for row in rows if row["gap"] > 0])

    baseline: dict[str, Any] = dict(settings.get("baseline") or {})
    baseline_changed = False
    for row in rows:
        if row["gap"] > 0 and row["requirement"] not in baseline:
            baseline[row["requirement"]] = {"start": row["current"], "required": row["required"], "hours": row["hours_to_close"]}
            baseline_changed = True
    if baseline_changed:
        db.table("career_plan_settings").update({"baseline_json": json.dumps(baseline), "updated_at": _now().isoformat()}).eq("id", goal_id).execute()

    tracked = [row for row in rows if row["requirement"] in baseline]
    open_rows = [row for row in tracked if row["gap"] > 0]
    links = _learning_links(db, employee_id, open_rows)
    projects = db.table("projects").select("*").eq("employee_id", employee_id).execute().data or []
    stored_steps = {row["id"]: row for row in db.table("career_roadmap_steps").select("*").eq("career_goal_id", goal_id).execute().data or []}
    evidence_rows = db.table("evidence_submissions").select("*").eq("employee_id", employee_id).execute().data or []
    evidence_by_step: dict[str, list[dict[str, Any]]] = {}
    for row in evidence_rows:
        if row.get("roadmap_step_id"):
            evidence_by_step.setdefault(row["roadmap_step_id"], []).append(row)

    # Largest open gap first, then the skills already closed at the end.
    tracked.sort(key=lambda row: (row["gap"] == 0, -row["gap"], row["skill"]))
    milestones: list[dict[str, Any]] = []
    desired_steps: list[dict[str, Any]] = []
    total_hours = 0.0
    done_hours = 0.0
    order = 0
    for row in tracked:
        start_level = int(baseline[row["requirement"]].get("start", row["current"]))
        span = max(1, row["required"] - start_level)
        hours = _phase_hours(float(baseline[row["requirement"]].get("hours") or span * HOURS_PER_LEVEL))
        met = row["gap"] == 0
        link = links.get(row["gap_id"], {})
        project = _project_for(row["skill"], row["requirement"], projects)
        idea = row.get("practice_task") or PRACTICE_IDEAS.get(row["requirement"].lower()) or f"Take a piece of work where {row['skill']} is the main skill and have someone already at the bar review it."
        phases: list[dict[str, Any]] = []
        for phase in PHASES:
            step_id = _step_id(goal_id, row["requirement"], phase)
            stored = stored_steps.get(step_id) or {}
            evidence = evidence_by_step.get(step_id, [])
            status = str(stored.get("status") or "upcoming")
            progress = 0
            if met:
                status = "achieved"
            elif phase == "learn":
                if link.get("plan_id") and link.get("progress_pct", 0) >= 100:
                    status = "achieved"
                elif status != "achieved" and link.get("plan_id"):
                    status = "in_progress"
                progress = 100 if status == "achieved" else int(link.get("progress_pct") or 0)
            elif phase == "prove":
                status = "upcoming"
            if status == "achieved":
                progress = 100
            if phase == "learn":
                title = f"Learn {row['skill']}"
                if link.get("plan_id"):
                    detail = f"Work through your {row['skill']} learning plan. {link.get('progress_pct', 0)}% of its courses are complete."
                elif link.get("course_count"):
                    detail = f"Choose {row['skill']} courses in Learning Recommendation. {link['course_count']} course{'s' if link['course_count'] != 1 else ''} in the catalogue raise this skill."
                else:
                    detail = f"No catalogue course covers {row['skill']} yet. Ask for one in Learning Recommendation, or record an external course you finish."
            elif phase == "apply":
                title = f"Use {row['skill']} in real work"
                if project:
                    detail = f"Take on a {row['skill']} task in “{project.get('name')}”. {idea}"
                else:
                    detail = f"Agree a scoped task with your manager. {idea}"
            else:
                title = f"Get {row['skill']} confirmed at {row['required']}/10"
                detail = (
                    f"{row['skill']} is recorded at {row['current']}/10. It reaches {row['required']}/10 on your profile when you pass the "
                    f"{row['skill']} assessment and it is synchronized in Learning Recommendation."
                )
                if row.get("proof"):
                    detail += f" Employers also accept: {row['proof']}"
            remaining = 0 if status == "achieved" else hours[phase] * (1 - progress / 100)
            total_hours += hours[phase]
            done_hours += hours[phase] - remaining
            order += 1
            phase_row = {
                "id": step_id,
                "phase": phase,
                "title": title,
                "detail": detail,
                "status": status,
                "progress_pct": progress,
                "hours": hours[phase],
                "hours_remaining": round(remaining, 1),
                "evidence": [
                    {"id": item["id"], "type": item.get("evidence_type"), "status": item.get("status"), "description": (item.get("description") or "")[:240], "created_at": item.get("created_at")}
                    for item in evidence
                ],
                "completed_at": stored.get("completed_at") if status == "achieved" else None,
                "project": project.get("name") if (project and phase == "apply") else None,
                "resources": (row.get("resources") or []) if phase == "learn" else [],
            }
            phases.append(phase_row)
            desired_steps.append({
                "id": step_id,
                "career_goal_id": goal_id,
                "step_order": order,
                "title": title,
                "status": status,
                "description": detail,
                "step_type": {"learn": "learning", "apply": "project", "prove": "evidence"}[phase],
                "related_skill_gap_id": row["gap_id"],
                "requires_evidence": phase != "prove",
                "evidence_type": {"learn": "certificate", "apply": "project", "prove": "manager_signoff"}[phase],
                "estimated_hours": hours[phase],
                "xp_reward": STEP_XP[phase],
                "due_window": None,
                "completed_at": stored.get("completed_at") or (_now().isoformat() if status == "achieved" else None),
            })
        milestones.append({
            "skill": row["skill"],
            "requirement": row["requirement"],
            "gap_id": row["gap_id"],
            "category": row["category"],
            "why": row["why"],
            "market_signal": row.get("market_signal"),
            "practice_task": row.get("practice_task"),
            "recorded_as": row.get("recorded_as"),
            "start_level": start_level,
            "current": row["current"],
            "required": row["required"],
            "met": met,
            "phases": phases,
            "learning": link,
        })

    # Schedule what is left from today, one skill at a time, at the chosen weekly hours.
    cursor = today
    projected_finish = today
    for milestone in milestones:
        for phase in milestone["phases"]:
            if phase["status"] == "achieved":
                phase["due"] = None
                continue
            weeks = max(1, math.ceil(phase["hours_remaining"] / hours_per_week))
            phase["starts"] = cursor.isoformat()
            cursor = cursor + timedelta(weeks=weeks)
            phase["due"] = cursor.isoformat()
            projected_finish = cursor
        open_due = [phase["due"] for phase in milestone["phases"] if phase.get("due")]
        milestone["due"] = open_due[-1] if open_due else None
        milestone["status"] = "done" if milestone["met"] else "in_progress" if any(p["status"] != "upcoming" for p in milestone["phases"]) else "upcoming"
    for step in desired_steps:
        due = next((phase.get("due") for milestone in milestones for phase in milestone["phases"] if phase["id"] == step["id"]), None)
        step["due_window"] = due

    _sync_steps(db, goal_id, stored_steps, desired_steps)

    remaining_hours = round(max(0.0, total_hours - done_hours), 1)
    weeks_left = max(0.0, (target_date - today).days / 7)
    needed_per_week = math.ceil(remaining_hours / weeks_left) if weeks_left > 0 and remaining_hours > 0 else (0 if remaining_hours == 0 else None)
    weeks_elapsed = max(0.0, (today - started_at).days / 7)
    expected_done = min(total_hours, weeks_elapsed * hours_per_week)
    if remaining_hours == 0:
        pace = "complete"
    elif projected_finish <= target_date:
        pace = "on_track"
    else:
        pace = "at_risk"
    behind_hours = round(max(0.0, expected_done - done_hours), 1)

    required_sum = sum(row["required"] for row in rows) or 1
    covered = sum(min(row["current"], row["required"]) for row in rows)
    readiness = round(100 * covered / required_sum)
    if int(goal.get("readiness_score") or 0) != readiness:
        db.table("career_goals").update({"readiness_score": readiness}).eq("id", goal_id).execute()
    start_covered = sum(
        min(int(baseline.get(row["requirement"], {}).get("start", row["current"])), row["required"])
        for row in rows
    )
    start_readiness = round(100 * start_covered / required_sum)

    checkins = db.table("career_checkins").select("*").eq("goal_id", goal_id).execute().data or []
    checkins.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    momentum = _momentum(checkins, evidence_rows, stored_steps, hours_per_week, today)

    mentors = _mentors(db, employee_id, [m for m in milestones if not m["met"]], people, all_skills)
    opportunities = _opportunities(employee_id, str(goal["target_role"]), skills, open_roles)
    manager_row = people.get(employee.get("manager_id") or "")
    manager = {"id": manager_row["id"], "name": manager_row.get("full_name"), "role": manager_row.get("role")} if manager_row else None
    this_week = _this_week(milestones, mentors, momentum, hours_per_week)

    profile_names = {str(skill.get("name") or "").strip().casefold() for skill in skills if skill.get("name")}
    used = {str(row["recorded_as"]).casefold() for row in rows if row.get("recorded_as")}

    plan = {
        **base,
        "goal": {
            "id": goal_id,
            "target_role": goal["target_role"],
            "family": _role_family(str(goal["target_role"]).lower()),
            "timeline": goal.get("timeline"),
            "visible_to_manager": bool(goal.get("visible_to_manager")),
            "created_at": goal.get("created_at"),
        },
        "settings": {
            "hours_per_week": hours_per_week,
            "target_date": target_date.isoformat(),
            "target_months": max(1, round((target_date - started_at).days / 30.4)),
            "started_at": started_at.isoformat(),
        },
        "readiness": {
            "pct": readiness,
            "start_pct": start_readiness,
            "met": sum(1 for row in rows if row["gap"] == 0),
            "total": len(rows),
        },
        "timeline": {
            "pace": pace,
            "total_hours": round(total_hours, 1),
            "done_hours": round(done_hours, 1),
            "remaining_hours": remaining_hours,
            "projected_finish": projected_finish.isoformat() if remaining_hours else today.isoformat(),
            "target_date": target_date.isoformat(),
            "weeks_left": round(weeks_left, 1),
            "hours_per_week_needed": needed_per_week,
            "behind_hours": behind_hours,
        },
        "requirements": [
            {
                "skill": row["skill"],
                "requirement": row["requirement"],
                "recorded_as": row["recorded_as"],
                "current": row["current"],
                "required": row["required"],
                "gap": row["gap"],
                "category": row["category"],
                "why": row["why"],
                "market_signal": row.get("market_signal"),
                "related": row.get("related") or [],
                "proof": row.get("proof"),
                "resources": row.get("resources") or [],
                "gap_id": row["gap_id"] if row["gap"] > 0 else None,
            }
            for row in sorted(rows, key=lambda item: (item["gap"] == 0, -item["gap"], item["skill"]))
        ],
        "unused_profile_skills": max(0, len(profile_names - used)),
        "market": _market_summary(profile),
        "milestones": milestones,
        "this_week": this_week,
        "momentum": momentum,
        "checkins": [
            {"id": row["id"], "skill": row.get("skill"), "hours": float(row.get("hours") or 0), "note": row.get("note"), "created_at": row.get("created_at")}
            for row in checkins[:8]
        ],
        "mentors": mentors,
        "opportunities": opportunities,
        "manager": manager,
    }
    plan["manager_brief"] = _manager_brief(plan)
    return plan


def _sync_steps(db: Client, goal_id: str, stored: dict[str, dict[str, Any]], desired: list[dict[str, Any]]) -> None:
    wanted = {row["id"] for row in desired}
    stale = [step_id for step_id in stored if step_id not in wanted]
    for step_id in stale:
        db.table("career_roadmap_steps").delete().eq("id", step_id).execute()
    keys = ("step_order", "title", "status", "description", "due_window", "related_skill_gap_id", "estimated_hours")
    for row in desired:
        current = stored.get(row["id"])
        if current is None:
            db.table("career_roadmap_steps").insert(row).execute()
            continue
        changes = {key: row[key] for key in keys if str(current.get(key) or "") != str(row[key] or "")}
        if row["status"] == "achieved" and not current.get("completed_at"):
            changes["completed_at"] = row["completed_at"]
        if changes:
            db.table("career_roadmap_steps").update(changes).eq("id", row["id"]).execute()


def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def _momentum(checkins: list[dict[str, Any]], evidence: list[dict[str, Any]], steps: dict[str, dict[str, Any]], hours_per_week: int, today: date) -> dict[str, Any]:
    this_week = _week_start(today)
    four_weeks = this_week - timedelta(weeks=3)
    hours_this_week = 0.0
    hours_four = 0.0
    weeks_with_checkin: set[date] = set()
    for row in checkins:
        created = _parse_dt(row.get("created_at"))
        if not created:
            continue
        week = _week_start(created.date())
        weeks_with_checkin.add(week)
        hours = float(row.get("hours") or 0)
        if week == this_week:
            hours_this_week += hours
        if week >= four_weeks:
            hours_four += hours
    streak = 0
    cursor = this_week if this_week in weeks_with_checkin else this_week - timedelta(weeks=1)
    while cursor in weeks_with_checkin:
        streak += 1
        cursor -= timedelta(weeks=1)
    moments = [_parse_dt(row.get("created_at")) for row in checkins]
    moments += [_parse_dt(row.get("created_at")) for row in evidence]
    moments += [_parse_dt(row.get("completed_at")) for row in steps.values()]
    moments = [moment for moment in moments if moment]
    last = max(moments) if moments else None
    days_since = (today - last.date()).days if last else None
    return {
        "hours_this_week": round(hours_this_week, 1),
        "hours_last_4_weeks": round(hours_four, 1),
        "planned_last_4_weeks": hours_per_week * 4,
        "streak_weeks": streak,
        "last_activity": last.isoformat() if last else None,
        "days_since_activity": days_since,
        "stalled": days_since is None or days_since > STALL_DAYS,
    }


def _this_week(milestones: list[dict[str, Any]], mentors: list[dict[str, Any]], momentum: dict[str, Any], hours_per_week: int) -> list[dict[str, Any]]:
    actions: list[dict[str, Any]] = []
    current = next((m for m in milestones if not m["met"]), None)
    if current:
        phase = next((p for p in current["phases"] if p["status"] != "achieved"), None)
        if phase:
            if phase["phase"] == "learn":
                link = current["learning"]
                if link.get("plan_id"):
                    nxt = next((c for c in link.get("courses", []) if c.get("status") not in {"Completed", "Skipped"}), None)
                    actions.append({
                        "id": f"learn:{current['gap_id']}",
                        "kind": "learning",
                        "title": f"Continue “{nxt['title']}”" if nxt else f"Finish your {current['skill']} learning plan",
                        "detail": f"{link.get('progress_pct', 0)}% of the {current['skill']} plan is complete. Give it {min(hours_per_week, phase['hours'])} hours this week.",
                        "gap_id": current["gap_id"],
                        "step_id": phase["id"],
                        "hours": min(hours_per_week, phase["hours"]),
                    })
                else:
                    suggested = (link.get("suggested_courses") or [])
                    actions.append({
                        "id": f"learn:{current['gap_id']}",
                        "kind": "learning",
                        "title": f"Pick your {current['skill']} courses",
                        "detail": (
                            f"Start with “{suggested[0]['title']}” ({int(suggested[0]['hours'])}h). Generating the plan takes a minute."
                            if suggested else f"Open {current['skill']} in Learning Recommendation to choose or request a course."
                        ),
                        "gap_id": current["gap_id"],
                        "step_id": phase["id"],
                        "hours": 1,
                    })
            elif phase["phase"] == "apply":
                actions.append({
                    "id": f"apply:{current['gap_id']}",
                    "kind": "evidence",
                    "title": f"Agree a {current['skill']} task" if not phase.get("project") else f"Take a {current['skill']} task in {phase['project']}",
                    "detail": phase["detail"],
                    "gap_id": current["gap_id"],
                    "step_id": phase["id"],
                    "hours": min(hours_per_week, phase["hours"]),
                })
            else:
                actions.append({
                    "id": f"prove:{current['gap_id']}",
                    "kind": "assessment",
                    "title": f"Take the {current['skill']} assessment",
                    "detail": phase["detail"],
                    "gap_id": current["gap_id"],
                    "step_id": phase["id"],
                    "hours": 1,
                })
        mentor = next((m for m in mentors if m["skill"] == current["skill"] and not m["intro_requested"]), None)
        if mentor:
            actions.append({
                "id": f"mentor:{mentor['employee_id']}",
                "kind": "mentor",
                "title": f"Ask {mentor['name'].split(' ')[0]} for 30 minutes on {current['skill']}",
                "detail": f"{mentor['name']} is recorded at {mentor['level']}/10 in {mentor['recorded_as']}. One conversation usually saves hours of guessing.",
                "mentor_id": mentor["employee_id"],
                "skill": current["skill"],
                "hours": 0.5,
            })
    remaining = max(0.0, hours_per_week - momentum["hours_this_week"])
    actions.append({
        "id": "checkin",
        "kind": "checkin",
        "title": "Log this week's hours" if momentum["hours_this_week"] == 0 else f"{momentum['hours_this_week']:g} of {hours_per_week} hours logged this week",
        "detail": (
            f"Your plan assumes {hours_per_week} hours a week. Logging keeps the dates honest."
            if remaining else "This week's hours are in. The plan dates assume the same next week."
        ),
        "hours": 0,
    })
    return actions[:3]


def _mentors(
    db: Client,
    employee_id: str,
    open_milestones: list[dict[str, Any]],
    employees: dict[str, dict[str, Any]],
    all_skills: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not open_milestones:
        return []
    by_employee: dict[str, list[dict[str, Any]]] = {}
    for row in all_skills:
        if row.get("employee_id") and row["employee_id"] != employee_id:
            by_employee.setdefault(row["employee_id"], []).append(row)
    requested = {
        row.get("mentor_employee_id")
        for row in db.table("mentor_matches").select("mentor_employee_id, intro_requested").eq("employee_id", employee_id).execute().data or []
        if row.get("intro_requested")
    }
    mentors: list[dict[str, Any]] = []
    for milestone in open_milestones:
        found = []
        for person_id, rows in by_employee.items():
            if person_id not in employees:
                continue
            level, name = _match_requirement_level(milestone["requirement"], rows)
            if level >= milestone["required"]:
                found.append((level, person_id, name))
        found.sort(key=lambda row: (-row[0], employees[row[1]].get("full_name") or ""))
        for level, person_id, name in found[:2]:
            person = employees[person_id]
            mentors.append({
                "employee_id": person_id,
                "name": person.get("full_name") or "Colleague",
                "role": person.get("role"),
                "department": person.get("department"),
                "skill": milestone["skill"],
                "recorded_as": name or milestone["skill"],
                "level": level,
                "intro_requested": person_id in requested,
            })
    return mentors


def _opportunities(employee_id: str, target_role: str, skills: list[dict[str, Any]], roles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not roles:
        return []
    matches = _build_internal_role_matches(employee_id, target_role, skills, roles)
    family = _role_family(target_role.lower())
    for match in matches:
        match["same_track"] = _role_family(str(match["title"]).lower()) == family
    matches.sort(key=lambda row: (not row["same_track"], -row["overall_fit_pct"]))
    return matches[:4]


def _manager_brief(plan: dict[str, Any]) -> str:
    goal = plan["goal"]
    readiness = plan["readiness"]
    timeline = plan["timeline"]
    open_ms = [m for m in plan["milestones"] if not m["met"]]
    met = [row["skill"] for row in plan["requirements"] if row["gap"] == 0]
    lines = [
        f"I am working towards {goal['target_role']} by {timeline['target_date']}.",
        f"I meet {readiness['met']} of {readiness['total']} skills the role requires ({readiness['pct']}% of the skill bar)."
        + (f" Already at the bar: {', '.join(met[:5])}." if met else ""),
    ]
    if open_ms:
        first = open_ms[0]
        lines.append(
            "Still to build: " + ", ".join(f"{m['skill']} ({m['current']}/10 to {m['required']}/10)" for m in open_ms) + "."
        )
        lines.append(
            f"My plan gives this {plan['settings']['hours_per_week']} hours a week and finishes around {timeline['projected_finish']}."
        )
        idea = first.get("practice_task") or PRACTICE_IDEAS.get(first["requirement"].lower())
        ask = f"a real {first['skill']} task to practise on"
        lines.append(f"What I need from you: {ask}" + (f", for example: {idea[0].lower()}{idea[1:]}" if idea else "."))
    else:
        lines.append("Every required skill is at the bar. I would like to talk about the next opening for this role.")
    return " ".join(lines)


# ── Actions ───────────────────────────────────────────────────────────────


def _owned_step(db: Client, employee_id: str, step_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    goal = active_goal(db, employee_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Set a career goal first.")
    rows = db.table("career_roadmap_steps").select("*").eq("id", step_id).eq("career_goal_id", goal["id"]).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="That plan step is not on your current goal.")
    return goal, rows[0]


def record_evidence(db: Client, employee_id: str, step_id: str, description: str, file_ref: str | None) -> None:
    ensure_schema(db)
    goal, step = _owned_step(db, employee_id, step_id)
    if step.get("step_type") == "evidence":
        raise HTTPException(
            status_code=400,
            detail="This milestone completes when your skill level is confirmed by a passed and synchronized assessment.",
        )
    text = " ".join(str(description or "").split())
    if len(text) < 20 and not file_ref:
        raise HTTPException(status_code=400, detail="Describe what you did in at least a sentence, or attach a file.")
    evidence_type = "certificate" if step.get("step_type") == "learning" else "project"
    evidence_id = str(uuid.uuid4())
    now = _now().isoformat()
    db.table("evidence_submissions").insert({
        "id": evidence_id,
        "skill_gap_id": step.get("related_skill_gap_id"),
        "roadmap_step_id": step_id,
        "employee_id": employee_id,
        "evidence_type": evidence_type,
        "file_ref": file_ref,
        "description": text,
        "status": "approved",
        "verified_by": "system",
        "verified_at": now,
        "xp_awarded": int(step.get("xp_reward") or 0),
    }).execute()
    if step.get("status") != "achieved":
        db.table("career_roadmap_steps").update({"status": "achieved", "completed_at": now}).eq("id", step_id).execute()
        try:
            award_career_xp(db, employee_id, int(step.get("xp_reward") or 50), f"Career plan milestone: {step['title']}", "roadmap_step", step_id)
        except Exception as exc:
            print(f"[career_plan] XP not awarded: {exc}")


def reopen_step(db: Client, employee_id: str, step_id: str) -> None:
    _goal, step = _owned_step(db, employee_id, step_id)
    if step.get("step_type") == "evidence":
        raise HTTPException(status_code=400, detail="The confirmation milestone follows your recorded skill level.")
    db.table("career_roadmap_steps").update({"status": "upcoming", "completed_at": None}).eq("id", step_id).execute()


def add_checkin(db: Client, employee_id: str, hours: float, skill: str | None, note: str | None) -> None:
    ensure_schema(db)
    goal = active_goal(db, employee_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Set a career goal first.")
    value = float(hours)
    if value <= 0 or value > 60:
        raise HTTPException(status_code=400, detail="Hours must be between 0.5 and 60.")
    db.table("career_checkins").insert({
        "id": str(uuid.uuid4()),
        "goal_id": goal["id"],
        "employee_id": employee_id,
        "skill": (skill or "").strip() or None,
        "hours": round(value, 1),
        "note": " ".join(str(note or "").split())[:1000] or None,
        "created_at": _now().isoformat(),
    }).execute()
    try:
        award_career_xp(db, employee_id, CHECKIN_XP, "Career plan weekly check-in", "career_checkin", goal["id"])
    except Exception as exc:
        print(f"[career_plan] XP not awarded: {exc}")


def request_intro(db: Client, employee_id: str, mentor_id: str, skill: str) -> None:
    goal = active_goal(db, employee_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Set a career goal first.")
    if mentor_id == employee_id:
        raise HTTPException(status_code=400, detail="Choose a colleague.")
    people = db.table("employees").select("id, full_name").eq("id", mentor_id).limit(1).execute().data or []
    if not people:
        raise HTTPException(status_code=404, detail="Colleague not found.")
    existing = db.table("mentor_matches").select("*").eq("employee_id", employee_id).eq("mentor_employee_id", mentor_id).limit(1).execute().data or []
    if existing:
        db.table("mentor_matches").update({"intro_requested": True, "shared_skill": skill}).eq("id", existing[0]["id"]).execute()
        return
    db.table("mentor_matches").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "mentor_employee_id": mentor_id,
        "shared_target_role": goal["target_role"],
        "shared_skill": skill,
        "match_reason": f"{people[0].get('full_name')} is already at the {goal['target_role']} bar for {skill}.",
        "intro_requested": True,
    }).execute()


# ── Coach answers ─────────────────────────────────────────────────────────


def coach_answer(db: Client, employee_id: str, message: str, history: list[dict[str, Any]]) -> dict[str, Any]:
    question = " ".join(str(message or "").split())
    if not question:
        raise HTTPException(status_code=400, detail="Ask a question.")
    plan = build_plan(db, employee_id)
    if not plan.get("goal"):
        return {"answer": "Set a target role first. I can then tell you exactly which skills to build and in what order.", "grounding": []}
    open_ms = [m for m in plan["milestones"] if not m["met"]]
    facts = {
        "target_role": plan["goal"]["target_role"],
        "market_summary": plan["market"].get("summary"),
        "current_role": plan["employee"]["role"],
        "readiness_pct": plan["readiness"]["pct"],
        "skills_met": [row["skill"] for row in plan["requirements"] if row["gap"] == 0],
        "skills_to_build": [
            {
                "skill": m["skill"],
                "current": m["current"],
                "required": m["required"],
                "why_role_needs_it": m["why"],
                "market_signal": m.get("market_signal"),
                "real_world_task": m.get("practice_task"),
                "recognized_resources": [r["name"] for r in (m["phases"][0].get("resources") or [])],
                "next_milestone": next((p["title"] for p in m["phases"] if p["status"] != "achieved"), None),
                "learning_plan_progress_pct": m["learning"].get("progress_pct") if m["learning"].get("plan_id") else None,
                "catalogue_courses": [c["title"] for c in m["learning"].get("suggested_courses", [])],
            }
            for m in open_ms
        ],
        "hours_per_week": plan["settings"]["hours_per_week"],
        "target_date": plan["timeline"]["target_date"],
        "projected_finish": plan["timeline"]["projected_finish"],
        "pace": plan["timeline"]["pace"],
        "hours_per_week_needed_for_target": plan["timeline"]["hours_per_week_needed"],
        "hours_logged_this_week": plan["momentum"]["hours_this_week"],
        "weekly_streak": plan["momentum"]["streak_weeks"],
        "days_since_last_activity": plan["momentum"]["days_since_activity"],
        "recent_checkins": [{"skill": row["skill"], "hours": row["hours"], "note": row["note"]} for row in plan["checkins"][:3]],
        "colleagues_at_the_bar": [{"name": m["name"], "skill": m["skill"], "level": m["level"]} for m in plan["mentors"]],
        "open_internal_roles": [{"title": r["title"], "fit_pct": r["overall_fit_pct"], "missing": r["missing_requirements"][:3]} for r in plan["opportunities"]],
    }
    grounding = [
        f"{plan['readiness']['pct']}% of the {plan['goal']['target_role']} skill bar",
        *[f"{m['skill']} {m['current']}/10, needs {m['required']}/10" for m in open_ms[:3]],
        f"{plan['momentum']['hours_this_week']:g}h logged this week",
        f"Finish around {plan['timeline']['projected_finish']} at {plan['settings']['hours_per_week']}h/week",
    ]
    recent = [
        {"role": str(item.get("role")), "content": str(item.get("content"))[:600]}
        for item in (history or [])[-6:]
        if item.get("role") in {"user", "assistant"}
    ]
    prompt = f"""You are a career coach inside the company's Digital Twin. You help one employee reach a specific role.
Use only the facts below. Do not invent courses, people, roles, levels, or dates. If the facts do not answer the question, say what is missing and suggest the closest useful next step.
Be direct and practical. Use at most 170 words. Use short markdown bullets when you list steps. Mention concrete skills, hours, dates, courses, or colleagues from the facts.

FACTS:
{json.dumps(facts, default=str)}

RECENT CONVERSATION:
{json.dumps(recent)}

EMPLOYEE QUESTION: {question}
"""
    answer = ""
    try:
        from app.services.gemini_safe import ask_gemini_timed

        answer = ask_gemini_timed(prompt, timeout=25.0, fallback="")
    except Exception as exc:
        print(f"[career_plan] Coach answer fallback: {exc}")
    if not answer:
        answer = _fallback_answer(plan, open_ms)
    return {"answer": answer.strip(), "grounding": grounding}


def _fallback_answer(plan: dict[str, Any], open_ms: list[dict[str, Any]]) -> str:
    timeline = plan["timeline"]
    if not open_ms:
        return (
            f"You already meet every skill **{plan['goal']['target_role']}** requires. "
            "Share your plan with your manager and ask about the next opening for the role."
        )
    first = open_ms[0]
    phase = next((p for p in first["phases"] if p["status"] != "achieved"), first["phases"][-1])
    lines = [
        f"Your next focus is **{first['skill']}** ({first['current']}/10, the role needs {first['required']}/10).",
        f"- Next milestone: **{phase['title']}**. {phase['detail']}",
        f"- At {plan['settings']['hours_per_week']} hours a week you finish around **{timeline['projected_finish']}**; your target is {timeline['target_date']}.",
    ]
    if timeline["pace"] == "at_risk" and timeline["hours_per_week_needed"]:
        lines.append(f"- To hit the target date you need about **{timeline['hours_per_week_needed']} hours a week**, or a later date.")
    return "\n".join(lines)

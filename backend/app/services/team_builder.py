"""Persisted Team Builder runs. Fabric is the store. Tests use the project's SQLite stand-in."""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi import HTTPException

from app.database import Client
from app.services.team_builder_engine import (
    ALGORITHM_VERSION,
    canonical_key,
    form_teams,
    skill_key,
    skills_mentioned_in_context,
)

_SCHEMA_READY = False

DEFAULT_ALIASES = (
    ("Node.js", "node"),
    ("Node.js", "nodejs"),
    ("React", "react.js"),
    ("React", "reactjs"),
    ("PostgreSQL", "postgres"),
    ("Kubernetes", "k8s"),
    ("TypeScript", "ts"),
    ("JavaScript", "js"),
    ("AWS", "amazon web services"),
)

_SQLITE = [
    """CREATE TABLE IF NOT EXISTS skill_aliases (
        id TEXT PRIMARY KEY, canonical_name TEXT NOT NULL, alias TEXT NOT NULL, created_at TEXT)""",
    """CREATE TABLE IF NOT EXISTS employee_capacity (
        id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, start_date TEXT, end_date TEXT,
        allocatable_pct INTEGER NOT NULL, notes TEXT, updated_by TEXT, updated_at TEXT, reviewed INTEGER NOT NULL DEFAULT 0)""",
    """CREATE TABLE IF NOT EXISTS team_builder_requests (
        id TEXT PRIMARY KEY, project_id TEXT, project_name TEXT NOT NULL, objective TEXT, project_type TEXT,
        owner_employee_id TEXT, start_date TEXT, end_date TEXT, headcount INTEGER NOT NULL, allocation_pct INTEGER NOT NULL,
        context TEXT, allow_smaller INTEGER NOT NULL DEFAULT 0, skills_json TEXT NOT NULL, roles_json TEXT NOT NULL,
        requested_by TEXT, created_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS team_builder_runs (
        id TEXT PRIMARY KEY, request_id TEXT NOT NULL, algorithm_version TEXT NOT NULL, status TEXT NOT NULL,
        warnings_json TEXT, eligible_count INTEGER NOT NULL, requested_headcount INTEGER NOT NULL,
        context_skills_json TEXT, created_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS team_builder_members (
        id TEXT PRIMARY KEY, option_id TEXT NOT NULL, employee_id TEXT NOT NULL, explanation TEXT NOT NULL,
        capacity_status TEXT, matched_json TEXT, warnings_json TEXT, requirement_score INTEGER NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS team_builder_assignments (
        id TEXT PRIMARY KEY, option_id TEXT NOT NULL, request_id TEXT NOT NULL, employee_id TEXT NOT NULL,
        project_id TEXT, project_name TEXT NOT NULL, role_title TEXT, allocation_pct INTEGER NOT NULL,
        start_date TEXT, end_date TEXT, status TEXT NOT NULL, assembled_by TEXT, assembled_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS team_builder_audit (
        id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL,
        actor TEXT, detail TEXT, created_at TEXT NOT NULL)""",
]

_FABRIC = [
    """IF OBJECT_ID(N'dbo.skill_aliases', N'U') IS NULL CREATE TABLE [dbo].[skill_aliases] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [canonical_name] NVARCHAR(200) NOT NULL, [alias] NVARCHAR(200) NOT NULL, [created_at] NVARCHAR(40))""",
    """IF OBJECT_ID(N'dbo.employee_capacity', N'U') IS NULL CREATE TABLE [dbo].[employee_capacity] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [employee_id] NVARCHAR(400) NOT NULL, [start_date] NVARCHAR(40), [end_date] NVARCHAR(40),
        [allocatable_pct] INT NOT NULL, [notes] NVARCHAR(MAX), [updated_by] NVARCHAR(200), [updated_at] NVARCHAR(40), [reviewed] INT NOT NULL DEFAULT 0)""",
    """IF OBJECT_ID(N'dbo.team_builder_requests', N'U') IS NULL CREATE TABLE [dbo].[team_builder_requests] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [project_id] NVARCHAR(400), [project_name] NVARCHAR(400) NOT NULL, [objective] NVARCHAR(MAX),
        [project_type] NVARCHAR(200), [owner_employee_id] NVARCHAR(400), [start_date] NVARCHAR(40), [end_date] NVARCHAR(40),
        [headcount] INT NOT NULL, [allocation_pct] INT NOT NULL, [context] NVARCHAR(MAX), [allow_smaller] INT NOT NULL DEFAULT 0,
        [skills_json] NVARCHAR(MAX) NOT NULL, [roles_json] NVARCHAR(MAX) NOT NULL, [requested_by] NVARCHAR(200), [created_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.team_builder_runs', N'U') IS NULL CREATE TABLE [dbo].[team_builder_runs] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [request_id] NVARCHAR(80) NOT NULL, [algorithm_version] NVARCHAR(80) NOT NULL,
        [status] NVARCHAR(40) NOT NULL, [warnings_json] NVARCHAR(MAX), [eligible_count] INT NOT NULL, [requested_headcount] INT NOT NULL,
        [context_skills_json] NVARCHAR(MAX), [created_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.team_builder_members', N'U') IS NULL CREATE TABLE [dbo].[team_builder_members] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [option_id] NVARCHAR(80) NOT NULL, [employee_id] NVARCHAR(400) NOT NULL,
        [explanation] NVARCHAR(MAX) NOT NULL, [capacity_status] NVARCHAR(40), [matched_json] NVARCHAR(MAX), [warnings_json] NVARCHAR(MAX),
        [requirement_score] INT NOT NULL)""",
    """IF OBJECT_ID(N'dbo.team_builder_assignments', N'U') IS NULL CREATE TABLE [dbo].[team_builder_assignments] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [option_id] NVARCHAR(80) NOT NULL, [request_id] NVARCHAR(80) NOT NULL,
        [employee_id] NVARCHAR(400) NOT NULL, [project_id] NVARCHAR(400), [project_name] NVARCHAR(400) NOT NULL, [role_title] NVARCHAR(200),
        [allocation_pct] INT NOT NULL, [start_date] NVARCHAR(40), [end_date] NVARCHAR(40), [status] NVARCHAR(40) NOT NULL,
        [assembled_by] NVARCHAR(200), [assembled_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.team_builder_audit', N'U') IS NULL CREATE TABLE [dbo].[team_builder_audit] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [entity_type] NVARCHAR(40) NOT NULL, [entity_id] NVARCHAR(80) NOT NULL,
        [action] NVARCHAR(80) NOT NULL, [actor] NVARCHAR(200), [detail] NVARCHAR(MAX), [created_at] NVARCHAR(40) NOT NULL)""",
]

_OPTION_COLUMNS = (
    ("run_id", "TEXT", "NVARCHAR(80)"),
    ("request_id", "TEXT", "NVARCHAR(80)"),
    ("strategy", "TEXT", "NVARCHAR(80)"),
    ("option_status", "TEXT", "NVARCHAR(40)"),
    ("feasibility", "TEXT", "NVARCHAR(40)"),
    ("metrics_json", "TEXT", "NVARCHAR(MAX)"),
    ("warnings_json", "TEXT", "NVARCHAR(MAX)"),
    ("gaps_json", "TEXT", "NVARCHAR(MAX)"),
    ("actual_headcount", "INTEGER", "INT"),
    ("requested_headcount", "INTEGER", "INT"),
    ("score_basis", "TEXT", "NVARCHAR(40)"),
    ("recommendation_score", "INTEGER", "INT"),
    ("created_at", "TEXT", "NVARCHAR(40)"),
    ("updated_at", "TEXT", "NVARCHAR(40)"),
)


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _loads(value: Any, fallback: Any) -> Any:
    if value is None or value == "":
        return fallback
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def _parse_date(value: Any) -> str | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10]).isoformat()
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be YYYY-MM-DD.")


def _overlaps(start_a: str | None, end_a: str | None, start_b: str | None, end_b: str | None) -> bool:
    if end_a and start_b and end_a < start_b:
        return False
    if end_b and start_a and end_b < start_a:
        return False
    return True


def ensure_schema(db: Client) -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    for statement in _SQLITE if db.db.dialect == "sqlite" else _FABRIC:
        db.db.execute(statement)
    for name, sqlite_type, fabric_type in _OPTION_COLUMNS:
        if db.db.dialect == "sqlite":
            sql = f"ALTER TABLE org_team_builder_options ADD COLUMN {name} {sqlite_type}"
        else:
            sql = (
                f"IF COL_LENGTH(N'dbo.org_team_builder_options', N'{name}') IS NULL "
                f"ALTER TABLE [dbo].[org_team_builder_options] ADD [{name}] {fabric_type}"
            )
        try:
            db.db.execute(sql)
        except Exception:
            continue
    index_sql = (
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_tb_assign_option_employee ON team_builder_assignments (option_id, employee_id)"
        if db.db.dialect == "sqlite"
        else "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_tb_assign_option_employee') CREATE UNIQUE INDEX [ux_tb_assign_option_employee] ON [dbo].[team_builder_assignments] ([option_id], [employee_id])"
    )
    try:
        db.db.execute(index_sql)
    except Exception:
        pass
    if not (db.table("skill_aliases").select("id").limit(1).execute().data or []):
        now = _now()
        for canonical, alias in DEFAULT_ALIASES:
            db.table("skill_aliases").insert({
                "id": str(uuid.uuid4()),
                "canonical_name": canonical,
                "alias": alias,
                "created_at": now,
            }).execute()
    _SCHEMA_READY = True


def _audit(db: Client, entity_type: str, entity_id: str, action: str, actor: str, detail: str = "") -> None:
    db.table("team_builder_audit").insert({
        "id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "actor": actor,
        "detail": detail[:2000],
        "created_at": _now(),
    }).execute()


def _alias_map(db: Client) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for row in db.table("skill_aliases").select("*").execute().data or []:
        canonical = skill_key(row["canonical_name"])
        mapping[canonical] = canonical
        mapping[skill_key(row["alias"])] = canonical
    return mapping


def _employees(db: Client) -> list[dict[str, Any]]:
    people = db.table("employees").select("id, full_name, role, department, employment_status").execute().data or []
    skills: dict[str, list[dict[str, Any]]] = {}
    for row in db.table("skills").select("employee_id, name, proficiency, verified").execute().data or []:
        skills.setdefault(str(row["employee_id"]), []).append(row)
    for person in people:
        person["skills"] = skills.get(str(person["id"]), [])
    return people


def _capacity_tables(db: Client) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    windows = db.table("employee_capacity").select("*").execute().data or []
    bookings = [row for row in db.table("team_builder_assignments").select("*").eq("status", "active").execute().data or []]
    return windows, bookings


def _capacity_status(
    employee_id: str,
    start: str | None,
    end: str | None,
    needed: int,
    windows: list[dict[str, Any]],
    bookings: list[dict[str, Any]],
) -> tuple[str, int | None]:
    own_windows = [
        row for row in windows
        if str(row.get("employee_id")) == str(employee_id) and _overlaps(start, end, row.get("start_date"), row.get("end_date"))
    ]
    own_bookings = [
        row for row in bookings
        if str(row.get("employee_id")) == str(employee_id) and _overlaps(start, end, row.get("start_date"), row.get("end_date"))
    ]
    booked = sum(int(row.get("allocation_pct") or 0) for row in own_bookings)
    windows = own_windows
    if not windows:
        if booked >= 100:
            return "conflict", 0
        return "unknown", None
    allocatable = min(int(row.get("allocatable_pct") or 0) for row in windows) - booked
    if allocatable < needed:
        return "conflict", max(0, allocatable)
    return "sufficient", allocatable


def catalogue(db: Client) -> dict[str, Any]:
    ensure_schema(db)
    people = _employees(db)
    active = [person for person in people if str(person.get("employment_status") or "Active").lower() in {"active", ""}]
    names: dict[str, int] = {}
    for person in active:
        for skill in person["skills"]:
            if skill.get("name"):
                names[str(skill["name"])] = names.get(str(skill["name"]), 0) + 1
    projects = db.table("projects").select("id, name, employee_id, status").limit(100).execute().data or []
    windows, _bookings = _capacity_tables(db)
    covered = {str(row.get("employee_id")) for row in windows}
    with_capacity = sum(1 for person in active if str(person["id"]) in covered)
    return {
        "skills": [{"name": name, "employees": count} for name, count in sorted(names.items(), key=lambda item: item[0].lower())],
        "aliases": [
            {"canonical_name": row["canonical_name"], "alias": row["alias"]}
            for row in db.table("skill_aliases").select("canonical_name, alias").execute().data or []
        ],
        "projects": projects,
        "employees": [
            {"id": person["id"], "full_name": person.get("full_name"), "role": person.get("role"), "department": person.get("department")}
            for person in sorted(active, key=lambda person: str(person.get("full_name") or "").lower())
        ],
        "workforce": {
            "active": len(active),
            "with_capacity": with_capacity,
            "without_capacity": len(active) - with_capacity,
        },
    }


def _clean_requirements(raw: list[dict[str, Any]], catalogue_names: list[str], aliases: dict[str, str]) -> tuple[list[dict[str, Any]], list[str]]:
    cleaned = []
    seen = set()
    warnings = []
    known = {canonical_key(name, aliases) for name in catalogue_names}
    for item in raw:
        name = str(item.get("name") or "").strip()
        priority = str(item.get("priority") or "important").lower()
        if priority not in {"mandatory", "important", "optional"}:
            raise HTTPException(status_code=400, detail="Skill priority must be mandatory, important, or optional.")
        key = canonical_key(name, aliases)
        if len(name) < 2 or key in seen:
            continue
        seen.add(key)
        if known and key not in known:
            warnings.append(f"{name} is not in the skill catalogue. It will only match an employee who already has that label or a configured alias.")
        cleaned.append({"name": name, "priority": priority})
    return cleaned[:20], warnings


def optimize(db: Client, payload: dict[str, Any], actor: str) -> dict[str, Any]:
    ensure_schema(db)
    name = str(payload.get("project_name") or "").strip()
    if len(name) < 3:
        raise HTTPException(status_code=400, detail="Give the project a name.")
    try:
        headcount = int(payload.get("headcount") or 4)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Headcount must be a number from 2 to 10.")
    if headcount < 2 or headcount > 10:
        raise HTTPException(status_code=400, detail="Headcount must be from 2 to 10.")
    try:
        allocation = int(payload.get("allocation_pct") or 40)
    except (TypeError, ValueError):
        allocation = 40
    allocation = max(10, min(100, allocation))
    start = _parse_date(payload.get("start_date"))
    end = _parse_date(payload.get("end_date"))
    if start and end and end < start:
        raise HTTPException(status_code=400, detail="The end date is before the start date.")
    project_id = payload.get("project_id") or None
    if project_id:
        found = db.table("projects").select("id, name").eq("id", project_id).limit(1).execute().data or []
        if not found:
            raise HTTPException(status_code=400, detail="That project is not in the database.")
        name = name or found[0]["name"]
    aliases = _alias_map(db)
    people = _employees(db)
    catalogue_names = sorted({str(skill["name"]) for person in people for skill in person["skills"] if skill.get("name")})
    context = str(payload.get("context") or "").strip()
    requirements, warnings = _clean_requirements(payload.get("skills") or [], catalogue_names, aliases)
    if not requirements and payload.get("core_competencies"):
        requirements, extra = _clean_requirements(
            [{"name": skill, "priority": "important"} for skill in payload["core_competencies"]],
            catalogue_names,
            aliases,
        )
        warnings.extend(extra)
    mentioned = skills_mentioned_in_context(context, catalogue_names, aliases)
    present = {canonical_key(req["name"], aliases) for req in requirements}
    context_added = []
    for skill_name in mentioned:
        if canonical_key(skill_name, aliases) in present:
            continue
        requirements.append({"name": skill_name, "priority": "optional"})
        present.add(canonical_key(skill_name, aliases))
        context_added.append(skill_name)
    roles = [str(role).strip() for role in (payload.get("roles") or []) if str(role).strip()][:8]
    active = []
    excluded = []
    windows, bookings = _capacity_tables(db)
    for person in people:
        if str(person.get("employment_status") or "Active").lower() not in {"active", ""}:
            continue
        status, _remaining = _capacity_status(person["id"], start, end, allocation, windows, bookings)
        if status == "conflict":
            excluded.append(person.get("full_name") or person["id"])
            continue
        active.append({**person, "capacity_status": status})
    if excluded:
        warnings.append("Left out because recorded availability is below the requested allocation: " + ", ".join(excluded[:8]))
    formed = form_teams(active, requirements, roles, headcount, aliases)
    warnings.extend(formed["warnings"])
    status_label = "completed_with_warnings" if warnings or any(opt["feasibility"] != "feasible" for opt in formed["options"]) else "completed"
    if not formed["options"]:
        status_label = "completed_with_warnings"
    now = _now()
    request_id = str(uuid.uuid4())
    run_id = str(uuid.uuid4())
    request_row = {
        "id": request_id,
        "project_id": project_id,
        "project_name": name[:400],
        "objective": str(payload.get("objective") or "").strip()[:2000] or None,
        "project_type": str(payload.get("project_type") or "").strip()[:200] or None,
        "owner_employee_id": payload.get("owner_employee_id") or None,
        "start_date": start,
        "end_date": end,
        "headcount": headcount,
        "allocation_pct": allocation,
        "context": context[:4000] or None,
        "allow_smaller": 1 if payload.get("allow_smaller") else 0,
        "skills_json": json.dumps(requirements),
        "roles_json": json.dumps(roles),
        "requested_by": actor,
        "created_at": now,
    }
    with db.transaction():
        db.table("team_builder_requests").insert(request_row).execute()
        db.table("team_builder_runs").insert({
            "id": run_id,
            "request_id": request_id,
            "algorithm_version": ALGORITHM_VERSION,
            "status": status_label,
            "warnings_json": json.dumps(warnings),
            "eligible_count": formed["eligible_count"],
            "requested_headcount": headcount,
            "context_skills_json": json.dumps(context_added),
            "created_at": now,
        }).execute()
        for option in formed["options"]:
            option_id = str(uuid.uuid4())
            option["id"] = option_id
            metrics = option["metrics"]
            db.table("org_team_builder_options").insert({
                "id": option_id,
                "name": option["name"],
                "success_rate": 0,
                "compatibility_score": 0,
                "skill_balance": int(metrics.get("weighted_coverage") or 0),
                "performance_prediction": 0,
                "rationale": option["rationale"],
                "members": [
                    {"id": member["employee_id"], "name": member["full_name"], "role": member["role"], "skills": [hit["skill"] for hit in member["matched"]]}
                    for member in option["members"]
                ],
                "run_id": run_id,
                "request_id": request_id,
                "strategy": option["strategy"],
                "option_status": option["option_status"],
                "feasibility": option["feasibility"],
                "metrics_json": json.dumps(metrics),
                "warnings_json": json.dumps(option["warnings"]),
                "gaps_json": json.dumps({"uncovered": option["uncovered"], "roles": option["roles"]}),
                "actual_headcount": metrics["actual_headcount"],
                "requested_headcount": headcount,
                "score_basis": "calculated",
                "recommendation_score": metrics.get("recommendation_score"),
                "created_at": now,
                "updated_at": now,
            }).execute()
            for member in option["members"]:
                db.table("team_builder_members").insert({
                    "id": str(uuid.uuid4()),
                    "option_id": option_id,
                    "employee_id": member["employee_id"],
                    "explanation": member["explanation"],
                    "capacity_status": member["capacity_status"],
                    "matched_json": json.dumps(member["matched"]),
                    "warnings_json": json.dumps(member["warnings"]),
                    "requirement_score": member["requirement_score"],
                }).execute()
        _audit(db, "run", run_id, "run_completed", actor, f"{name}; {len(formed['options'])} options")
    return run_detail(db, run_id)


def _option_view(db: Client, row: dict[str, Any]) -> dict[str, Any]:
    gaps = _loads(row.get("gaps_json"), {})
    members = []
    for member in db.table("team_builder_members").select("*").eq("option_id", row["id"]).execute().data or []:
        person = db.table("employees").select("id, full_name, role, department").eq("id", member["employee_id"]).limit(1).execute().data or []
        info = person[0] if person else {}
        members.append({
            "employee_id": member["employee_id"],
            "full_name": info.get("full_name"),
            "role": info.get("role"),
            "department": info.get("department"),
            "requirement_score": member.get("requirement_score"),
            "capacity_status": member.get("capacity_status"),
            "matched": _loads(member.get("matched_json"), []),
            "warnings": _loads(member.get("warnings_json"), []),
            "explanation": member.get("explanation"),
        })
    assignments = db.table("team_builder_assignments").select("*").eq("option_id", row["id"]).execute().data or []
    metrics = _loads(row.get("metrics_json"), None)
    return {
        "id": row["id"],
        "name": row["name"],
        "strategy": row.get("strategy"),
        "option_status": row.get("option_status"),
        "feasibility": row.get("feasibility"),
        "rationale": row.get("rationale"),
        "score_basis": row.get("score_basis") or "legacy",
        "metrics": metrics,
        "warnings": _loads(row.get("warnings_json"), []),
        "uncovered": gaps.get("uncovered") or [],
        "roles": gaps.get("roles") or [],
        "members": members,
        "assignments": assignments,
        "actual_headcount": row.get("actual_headcount"),
        "requested_headcount": row.get("requested_headcount"),
    }


def run_detail(db: Client, run_id: str) -> dict[str, Any]:
    ensure_schema(db)
    runs = db.table("team_builder_runs").select("*").eq("id", run_id).limit(1).execute().data or []
    if not runs:
        raise HTTPException(status_code=404, detail="Optimization run not found.")
    run = runs[0]
    requests = db.table("team_builder_requests").select("*").eq("id", run["request_id"]).limit(1).execute().data or []
    request = requests[0] if requests else {}
    options = db.table("org_team_builder_options").select("*").eq("run_id", run_id).execute().data or []
    options.sort(key=lambda row: (0 if row.get("strategy") == "balanced" else 1, str(row.get("name") or "")))
    detail = {
        "run_id": run["id"],
        "request_id": run["request_id"],
        "status": run["status"],
        "algorithm_version": run["algorithm_version"],
        "created_at": run["created_at"],
        "eligible_count": run["eligible_count"],
        "requested_headcount": run["requested_headcount"],
        "warnings": _loads(run.get("warnings_json"), []),
        "context_skills": _loads(run.get("context_skills_json"), []),
        "request": {
            "project_id": request.get("project_id"),
            "project_name": request.get("project_name"),
            "objective": request.get("objective"),
            "project_type": request.get("project_type"),
            "start_date": request.get("start_date"),
            "end_date": request.get("end_date"),
            "headcount": request.get("headcount"),
            "allocation_pct": request.get("allocation_pct"),
            "context": request.get("context"),
            "allow_smaller": bool(request.get("allow_smaller")),
            "skills": _loads(request.get("skills_json"), []),
            "roles": _loads(request.get("roles_json"), []),
        },
        "options": [_option_view(db, row) for row in options],
    }
    return _with_skill_model(detail)


def _with_skill_model(detail: dict[str, Any]) -> dict[str, Any]:
    from app.ml.skill_fit.predict import score_roster

    requirements = (detail.get("request") or {}).get("skills") or []
    for option in detail.get("options") or []:
        option["skill_model"] = score_roster(requirements, option.get("members") or [])
    return detail


def list_runs(db: Client, limit: int = 20) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("team_builder_runs").select("*").execute().data or []
    rows.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    items = []
    for row in rows[:limit]:
        request = db.table("team_builder_requests").select("project_name").eq("id", row["request_id"]).limit(1).execute().data or []
        items.append({
            "run_id": row["id"],
            "created_at": row["created_at"],
            "status": row["status"],
            "project_name": request[0]["project_name"] if request else None,
            "eligible_count": row["eligible_count"],
            "requested_headcount": row["requested_headcount"],
        })
    return {"runs": items}


def option_detail(db: Client, option_id: str) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("org_team_builder_options").select("*").eq("id", option_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Team option not found.")
    return _option_view(db, rows[0])


def save_capacity(db: Client, payload: dict[str, Any], actor: str) -> dict[str, Any]:
    ensure_schema(db)
    employee_id = str(payload.get("employee_id") or "")
    people = db.table("employees").select("id").eq("id", employee_id).limit(1).execute().data or []
    if not people:
        raise HTTPException(status_code=400, detail="That employee is not in the database.")
    try:
        allocatable = int(payload.get("allocatable_pct"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Allocatable percentage must be from 0 to 100.")
    if allocatable < 0 or allocatable > 100:
        raise HTTPException(status_code=400, detail="Allocatable percentage must be from 0 to 100.")
    start = _parse_date(payload.get("start_date"))
    end = _parse_date(payload.get("end_date"))
    row_id = str(uuid.uuid4())
    db.table("employee_capacity").insert({
        "id": row_id,
        "employee_id": employee_id,
        "start_date": start,
        "end_date": end,
        "allocatable_pct": allocatable,
        "notes": str(payload.get("notes") or "")[:500] or None,
        "updated_by": actor,
        "updated_at": _now(),
        "reviewed": 1,
    }).execute()
    _audit(db, "capacity", row_id, "capacity_recorded", actor, employee_id)
    return {"id": row_id, "employee_id": employee_id, "allocatable_pct": allocatable, "start_date": start, "end_date": end}


def _option_row(db: Client, option_id: str) -> dict[str, Any]:
    rows = db.table("org_team_builder_options").select("*").eq("id", option_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Team option not found.")
    return rows[0]


def assemble(db: Client, option_id: str, actor: str, accept_smaller: bool) -> dict[str, Any]:
    ensure_schema(db)
    row = _option_row(db, option_id)
    if row.get("option_status") == "assembled" or row.get("score_basis") != "calculated":
        if row.get("option_status") == "assembled":
            return option_detail(db, option_id)
        raise HTTPException(status_code=409, detail="This saved option has no calculated feasibility, so it cannot be assembled.")
    if row.get("option_status") != "proposed":
        raise HTTPException(status_code=409, detail=f"A {row.get('option_status') or 'stored'} option cannot be assembled.")
    if row.get("feasibility") == "short_staffed" and not accept_smaller:
        raise HTTPException(status_code=409, detail="This team is smaller than requested. Confirm that a smaller team is acceptable.")
    if row.get("feasibility") not in {"feasible", "short_staffed"}:
        raise HTTPException(status_code=409, detail="This option does not meet the mandatory constraints.")
    request = db.table("team_builder_requests").select("*").eq("id", row["request_id"]).limit(1).execute().data or []
    if not request:
        raise HTTPException(status_code=409, detail="The project brief for this option is missing.")
    brief = request[0]
    members = db.table("team_builder_members").select("*").eq("option_id", option_id).execute().data or []
    if len({member["employee_id"] for member in members}) != len(members):
        raise HTTPException(status_code=409, detail="This option lists the same person twice.")
    windows, bookings = _capacity_tables(db)
    for member in members:
        status, _remaining = _capacity_status(member["employee_id"], brief.get("start_date"), brief.get("end_date"), int(brief.get("allocation_pct") or 40), windows, bookings)
        if status == "conflict":
            raise HTTPException(status_code=409, detail="A selected person no longer has the requested availability. Generate the teams again.")
    now = _now()
    with db.transaction():
        current = _option_row(db, option_id)
        if current.get("option_status") == "assembled":
            return option_detail(db, option_id)
        if current.get("option_status") != "proposed":
            raise HTTPException(status_code=409, detail="This option was already updated. Reload it and try again.")
        db.table("org_team_builder_options").update({
            "option_status": "assembled",
            "updated_at": now,
        }).eq("id", option_id).execute()
        for member in members:
            person = db.table("employees").select("role").eq("id", member["employee_id"]).limit(1).execute().data or [{}]
            db.table("team_builder_assignments").insert({
                "id": str(uuid.uuid4()),
                "option_id": option_id,
                "request_id": row["request_id"],
                "employee_id": member["employee_id"],
                "project_id": brief.get("project_id"),
                "project_name": brief["project_name"],
                "role_title": person[0].get("role") if person else None,
                "allocation_pct": int(brief.get("allocation_pct") or 40),
                "start_date": brief.get("start_date"),
                "end_date": brief.get("end_date"),
                "status": "active",
                "assembled_by": actor,
                "assembled_at": now,
            }).execute()
        for other in db.table("org_team_builder_options").select("id, option_status").eq("run_id", row["run_id"]).execute().data or []:
            if other["id"] == option_id or other.get("option_status") not in {"proposed", "infeasible"}:
                continue
            db.table("org_team_builder_options").update({"option_status": "superseded", "updated_at": now}).eq("id", other["id"]).execute()
        _audit(db, "option", option_id, "team_assembled", actor, brief["project_name"])
    return option_detail(db, option_id)


def reject_option(db: Client, option_id: str, actor: str, note: str) -> dict[str, Any]:
    ensure_schema(db)
    row = _option_row(db, option_id)
    if row.get("option_status") == "assembled":
        raise HTTPException(status_code=409, detail="An assembled team cannot be rejected.")
    if row.get("option_status") == "rejected":
        return option_detail(db, option_id)
    db.table("org_team_builder_options").update({"option_status": "rejected", "updated_at": _now()}).eq("id", option_id).execute()
    _audit(db, "option", option_id, "option_rejected", actor, note[:500])
    return option_detail(db, option_id)


def assert_option_mutable(db: Client, option_id: str) -> None:
    ensure_schema(db)
    row = _option_row(db, option_id)
    if row.get("option_status") in {"assembled", "superseded"}:
        raise HTTPException(status_code=409, detail="An assembled or superseded team cannot be edited or deleted.")

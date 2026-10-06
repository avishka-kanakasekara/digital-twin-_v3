"""Succession & Knowledge Transfer.

A business-critical role (flagged in the role register) gets a ranked slate of successor
candidates, an HR-approved pairing, and a knowledge-transfer plan made of dated tasks.

Rules enforced here and in the database:
- A slate is generated only for a role flagged business-critical, or on an explicit HR request.
  The reason is stored in trigger_reason.
- Candidates are ranked by candidate_readiness_score descending, then by the lower
  candidate_skill_gap_pct, and at most five are kept.
- pairing_status reaches Confirmed only when approved_by_hr is TRUE.
- overall_progress_pct = completed tasks / total tasks. A task past its due_date that is
  still open carries an overdue flag.

Scores, ranks, and exposure are deterministic. Gemini drafts knowledge-transfer tasks and
phrases answers to persona questions from the module facts.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException

from app.database import Client
from app.services.career_coach import _match_requirement_level, _normalize_skill_level, _role_family

MAX_CANDIDATES = 5
HOURS_PER_LEVEL = 20
DEFAULT_HANDOVER_DAYS = 90

TRIGGER_BUSINESS_CRITICAL = "Business-Critical Flag"
TRIGGER_HR_REQUEST = "HR Request"
TRIGGERS = {"business_critical": TRIGGER_BUSINESS_CRITICAL, "hr_request": TRIGGER_HR_REQUEST}

STATUS_SLATE = "Slate Generated"
STATUS_NOMINATED = "Candidate Nominated"
STATUS_CONFIRMED = "Confirmed"
STATUS_WITHDRAWN = "Withdrawn"
PAIRING_STATUSES = (STATUS_SLATE, STATUS_NOMINATED, STATUS_CONFIRMED, STATUS_WITHDRAWN)

TASK_TYPES = ("Shadowing Session", "Documentation Task", "Mentor Meeting", "Handover Checklist Item")
TASK_STATUSES = ("Not Started", "In Progress", "Blocked", "Complete")
TASK_COMPLETE = "Complete"

DEPARTURE_RISKS = ("Low", "Medium", "High")
RISK_WEIGHT = {"Low": 0.6, "Medium": 0.8, "High": 1.0}

READINESS_WEIGHTS = {"skills": 70, "verified": 10, "experience": 10, "context": 10}
BANDS = (
    (80, "Ready now"),
    (65, "Ready in 6–12 months"),
    (45, "Ready in 1–2 years"),
    (0, "Development pool"),
)
READY_NOW = 80

EMPLOYEE_FIELDS = (
    "id, full_name, initials, role, department, team, manager_id, manager_name, "
    "years_experience, years_in_company, employment_status, avatar_url"
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _now().date()


def _ai_enabled() -> bool:
    return os.environ.get("SUCCESSION_AI", "true").strip().lower() not in {"0", "false", "no", "off"}


def _loads(value: Any, fallback: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return json.loads(value)
        except ValueError:
            return fallback
    return fallback


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value).strip()[:10])
    except ValueError:
        return None


def _clean(text: Any, limit: int = 400) -> str:
    return " ".join(str(text or "").split())[:limit]


# ── Schema ────────────────────────────────────────────────────────────────

_SCHEMA_READY = False

_SQLITE_DDL = [
    """CREATE TABLE IF NOT EXISTS succession_roles (
        id TEXT PRIMARY KEY, role_title TEXT NOT NULL, department TEXT, incumbent_employee_id TEXT NOT NULL,
        owner_manager_id TEXT, is_business_critical INTEGER NOT NULL DEFAULT 0, criticality_reason TEXT,
        departure_risk TEXT NOT NULL DEFAULT 'Medium', expected_departure_date TEXT, requirements_json TEXT NOT NULL DEFAULT '{}',
        flagged_by TEXT, flagged_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS succession_records (
        id TEXT PRIMARY KEY, role_id TEXT NOT NULL, incumbent_employee_id TEXT NOT NULL,
        trigger_reason TEXT NOT NULL CHECK (trigger_reason IN ('Business-Critical Flag', 'HR Request')),
        trigger_note TEXT, requested_by TEXT,
        pairing_status TEXT NOT NULL CHECK (pairing_status IN ('Slate Generated', 'Candidate Nominated', 'Confirmed', 'Withdrawn')),
        nominee_employee_id TEXT, approved_by_hr INTEGER NOT NULL DEFAULT 0, approved_by TEXT, approved_at TEXT,
        decision_note TEXT, shared_with_candidates INTEGER NOT NULL DEFAULT 0, generated_at TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        CHECK (pairing_status <> 'Confirmed' OR approved_by_hr = 1))""",
    """CREATE TABLE IF NOT EXISTS succession_candidates (
        id TEXT PRIMARY KEY, succession_record_id TEXT NOT NULL, employee_id TEXT NOT NULL, rank_position INTEGER NOT NULL,
        candidate_readiness_score INTEGER NOT NULL, candidate_skill_gap_pct REAL NOT NULL, readiness_band TEXT NOT NULL,
        components_json TEXT NOT NULL DEFAULT '{}', gaps_json TEXT NOT NULL DEFAULT '[]', strengths_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS kt_plans (
        id TEXT PRIMARY KEY, succession_record_id TEXT NOT NULL, role_id TEXT NOT NULL, incumbent_employee_id TEXT NOT NULL,
        successor_employee_id TEXT, opened_reason TEXT NOT NULL, status TEXT NOT NULL, overall_progress_pct REAL NOT NULL DEFAULT 0,
        target_handover_date TEXT NOT NULL, drafted_by TEXT, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS kt_tasks (
        id TEXT PRIMARY KEY, plan_id TEXT NOT NULL,
        task_type TEXT NOT NULL CHECK (task_type IN ('Shadowing Session', 'Documentation Task', 'Mentor Meeting', 'Handover Checklist Item')),
        title TEXT NOT NULL, description TEXT, knowledge_area TEXT, owner_employee_id TEXT, due_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Complete')),
        completed_at TEXT, notes TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS succession_audit (
        id TEXT PRIMARY KEY, record_id TEXT, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL,
        actor TEXT, detail TEXT, created_at TEXT NOT NULL)""",
]

_FABRIC_DDL = [
    """IF OBJECT_ID(N'dbo.succession_roles', N'U') IS NULL CREATE TABLE [dbo].[succession_roles] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [role_title] NVARCHAR(200) NOT NULL, [department] NVARCHAR(200),
        [incumbent_employee_id] NVARCHAR(400) NOT NULL, [owner_manager_id] NVARCHAR(400),
        [is_business_critical] BIT NOT NULL DEFAULT 0, [criticality_reason] NVARCHAR(MAX),
        [departure_risk] NVARCHAR(20) NOT NULL DEFAULT 'Medium', [expected_departure_date] NVARCHAR(40),
        [requirements_json] NVARCHAR(MAX) NOT NULL DEFAULT '{}', [flagged_by] NVARCHAR(200), [flagged_at] NVARCHAR(40),
        [created_at] NVARCHAR(40) NOT NULL, [updated_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.succession_records', N'U') IS NULL CREATE TABLE [dbo].[succession_records] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [role_id] NVARCHAR(80) NOT NULL, [incumbent_employee_id] NVARCHAR(400) NOT NULL,
        [trigger_reason] NVARCHAR(40) NOT NULL, [trigger_note] NVARCHAR(MAX), [requested_by] NVARCHAR(200),
        [pairing_status] NVARCHAR(40) NOT NULL, [nominee_employee_id] NVARCHAR(400),
        [approved_by_hr] BIT NOT NULL DEFAULT 0, [approved_by] NVARCHAR(200), [approved_at] NVARCHAR(40),
        [decision_note] NVARCHAR(MAX), [shared_with_candidates] BIT NOT NULL DEFAULT 0, [generated_at] NVARCHAR(40) NOT NULL,
        [created_at] NVARCHAR(40) NOT NULL, [updated_at] NVARCHAR(40) NOT NULL,
        CONSTRAINT [ck_succession_trigger] CHECK ([trigger_reason] IN (N'Business-Critical Flag', N'HR Request')),
        CONSTRAINT [ck_succession_status] CHECK ([pairing_status] IN (N'Slate Generated', N'Candidate Nominated', N'Confirmed', N'Withdrawn')),
        CONSTRAINT [ck_succession_confirmed_needs_hr] CHECK ([pairing_status] <> N'Confirmed' OR [approved_by_hr] = 1))""",
    """IF OBJECT_ID(N'dbo.succession_candidates', N'U') IS NULL CREATE TABLE [dbo].[succession_candidates] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [succession_record_id] NVARCHAR(80) NOT NULL, [employee_id] NVARCHAR(400) NOT NULL,
        [rank_position] INT NOT NULL, [candidate_readiness_score] INT NOT NULL, [candidate_skill_gap_pct] FLOAT NOT NULL,
        [readiness_band] NVARCHAR(60) NOT NULL, [components_json] NVARCHAR(MAX) NOT NULL, [gaps_json] NVARCHAR(MAX) NOT NULL,
        [strengths_json] NVARCHAR(MAX) NOT NULL, [created_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.kt_plans', N'U') IS NULL CREATE TABLE [dbo].[kt_plans] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [succession_record_id] NVARCHAR(80) NOT NULL, [role_id] NVARCHAR(80) NOT NULL,
        [incumbent_employee_id] NVARCHAR(400) NOT NULL, [successor_employee_id] NVARCHAR(400), [opened_reason] NVARCHAR(60) NOT NULL,
        [status] NVARCHAR(40) NOT NULL, [overall_progress_pct] FLOAT NOT NULL DEFAULT 0, [target_handover_date] NVARCHAR(40) NOT NULL,
        [drafted_by] NVARCHAR(40), [created_by] NVARCHAR(200), [created_at] NVARCHAR(40) NOT NULL, [updated_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.kt_tasks', N'U') IS NULL CREATE TABLE [dbo].[kt_tasks] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [plan_id] NVARCHAR(80) NOT NULL, [task_type] NVARCHAR(60) NOT NULL,
        [title] NVARCHAR(300) NOT NULL, [description] NVARCHAR(MAX), [knowledge_area] NVARCHAR(200), [owner_employee_id] NVARCHAR(400),
        [due_date] NVARCHAR(40) NOT NULL, [status] NVARCHAR(40) NOT NULL, [completed_at] NVARCHAR(40), [notes] NVARCHAR(MAX),
        [sort_order] INT NOT NULL DEFAULT 0, [created_at] NVARCHAR(40) NOT NULL, [updated_at] NVARCHAR(40) NOT NULL,
        CONSTRAINT [ck_kt_task_type] CHECK ([task_type] IN (N'Shadowing Session', N'Documentation Task', N'Mentor Meeting', N'Handover Checklist Item')),
        CONSTRAINT [ck_kt_task_status] CHECK ([status] IN (N'Not Started', N'In Progress', N'Blocked', N'Complete')))""",
    """IF OBJECT_ID(N'dbo.succession_audit', N'U') IS NULL CREATE TABLE [dbo].[succession_audit] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [record_id] NVARCHAR(80), [entity_type] NVARCHAR(40) NOT NULL,
        [entity_id] NVARCHAR(80) NOT NULL, [action] NVARCHAR(80) NOT NULL, [actor] NVARCHAR(200), [detail] NVARCHAR(MAX),
        [created_at] NVARCHAR(40) NOT NULL)""",
]


def ensure_schema(db: Client) -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    for statement in _SQLITE_DDL if db.db.dialect == "sqlite" else _FABRIC_DDL:
        db.db.execute(statement)
    _SCHEMA_READY = True


def _audit(db: Client, entity_type: str, entity_id: str, action: str, actor: str, detail: str = "", record_id: str | None = None) -> None:
    db.table("succession_audit").insert({
        "id": str(uuid.uuid4()),
        "record_id": record_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "actor": actor,
        "detail": _clean(detail, 2000),
        "created_at": _now().isoformat(),
    }).execute()


# ── Loading ───────────────────────────────────────────────────────────────


def _employees(db: Client) -> dict[str, dict[str, Any]]:
    rows = db.table("employees").select(EMPLOYEE_FIELDS).execute().data or []
    return {str(row["id"]): row for row in rows}


def _skills_by_employee(db: Client) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in db.table("skills").select("employee_id, name, proficiency, category, verified").execute().data or []:
        grouped.setdefault(str(row["employee_id"]), []).append(row)
    return grouped


def _person(employees: dict[str, dict[str, Any]], employee_id: Any) -> dict[str, Any] | None:
    if not employee_id:
        return None
    row = employees.get(str(employee_id))
    if not row:
        return {"id": str(employee_id), "full_name": "Unknown employee", "role": None, "department": None, "initials": "?"}
    name = row.get("full_name") or "Employee"
    initials = row.get("initials") or "".join(part[0] for part in name.split()[:2]).upper()
    return {
        "id": str(row["id"]),
        "full_name": name,
        "initials": initials,
        "role": row.get("role"),
        "department": row.get("department"),
        "avatar_url": row.get("avatar_url"),
    }


def _role_row(db: Client, role_id: str) -> dict[str, Any]:
    rows = db.table("succession_roles").select("*").eq("id", role_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Role not found in the succession register.")
    return rows[0]


def _record_row(db: Client, record_id: str) -> dict[str, Any]:
    rows = db.table("succession_records").select("*").eq("id", record_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Succession record not found.")
    return rows[0]


def _plan_row(db: Client, plan_id: str) -> dict[str, Any]:
    rows = db.table("kt_plans").select("*").eq("id", plan_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Knowledge transfer plan not found.")
    return rows[0]


def _active_record(db: Client, role_id: str) -> dict[str, Any] | None:
    rows = db.table("succession_records").select("*").eq("role_id", role_id).neq("pairing_status", STATUS_WITHDRAWN).execute().data or []
    rows.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    return rows[0] if rows else None


def _candidates(db: Client, record_id: str) -> list[dict[str, Any]]:
    rows = db.table("succession_candidates").select("*").eq("succession_record_id", record_id).execute().data or []
    rows.sort(key=lambda row: int(row.get("rank_position") or 0))
    return rows


def _plan_for_record(db: Client, record_id: str) -> dict[str, Any] | None:
    rows = db.table("kt_plans").select("*").eq("succession_record_id", record_id).limit(1).execute().data or []
    return rows[0] if rows else None


def _tasks(db: Client, plan_id: str) -> list[dict[str, Any]]:
    rows = db.table("kt_tasks").select("*").eq("plan_id", plan_id).execute().data or []
    rows.sort(key=lambda row: (str(row.get("due_date") or ""), int(row.get("sort_order") or 0)))
    return rows


# ── Role register (Module 1 business-critical flag) ───────────────────────


def _requirements(role: dict[str, Any]) -> dict[str, Any]:
    data = _loads(role.get("requirements_json"), {})
    if isinstance(data, list):
        data = {"items": data}
    data.setdefault("items", [])
    data.setdefault("source", "hr")
    return data


def clean_requirement_items(items: list[Any]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in items or []:
        if not isinstance(item, dict):
            continue
        skill = _clean(item.get("skill"), 120)
        key = skill.lower()
        if len(skill) < 2 or key in seen:
            continue
        seen.add(key)
        try:
            level = int(round(float(item.get("level") or 7)))
        except (TypeError, ValueError):
            level = 7
        cleaned.append({
            "skill": skill,
            "level": max(1, min(10, level)),
            "category": _clean(item.get("category"), 80) or None,
            "why": _clean(item.get("why"), 300) or None,
        })
    return cleaned[:12]


def incumbent_requirements(role_title: str, incumbent: dict[str, Any] | None, skills: list[dict[str, Any]]) -> dict[str, Any]:
    """The incumbent's strongest skills are the knowledge the role depends on today."""
    from app.services.career_market import library_requirements

    name = (incumbent or {}).get("full_name") or "The incumbent"
    ranked = sorted(
        ({"skill": s.get("name"), "level": _normalize_skill_level(s.get("proficiency")), "category": s.get("category")} for s in skills if s.get("name")),
        key=lambda row: (-row["level"], str(row["skill"]).lower()),
    )
    strong = [row for row in ranked if row["level"] >= 6][:8]
    if len(strong) >= 3:
        items = [{
            "skill": row["skill"],
            "level": max(5, min(9, row["level"])),
            "category": row["category"],
            "why": f"{name} holds this at {row['level']}/10 and the role relies on it day to day.",
        } for row in strong]
        return {"items": clean_requirement_items(items), "source": "incumbent", "summary": f"Built from {name}'s Skill DNA."}
    return {
        "items": clean_requirement_items(library_requirements(role_title)),
        "source": "library",
        "summary": f"{name} has fewer than three strong recorded skills, so the role library for {role_title} is used.",
    }


def market_requirements(db: Client, role_title: str, incumbent_id: str, skills: list[dict[str, Any]]) -> dict[str, Any]:
    from app.services.career_market import role_profile

    profile = role_profile(db, incumbent_id, role_title, skills, refresh=False)
    return {
        "items": clean_requirement_items(profile.get("requirements") or []),
        "source": "market" if profile.get("source") == "market" else "library",
        "summary": profile.get("summary") or "",
        "sources": profile.get("sources") or [],
    }


def _validate_role_fields(payload: dict[str, Any], employees: dict[str, dict[str, Any]]) -> None:
    if "role_title" in payload and len(_clean(payload["role_title"], 200)) < 3:
        raise HTTPException(status_code=400, detail="Give the role a title.")
    if "incumbent_employee_id" in payload and str(payload["incumbent_employee_id"]) not in employees:
        raise HTTPException(status_code=400, detail="Choose the current incumbent.")
    owner = payload.get("owner_manager_id")
    if owner and str(owner) not in employees:
        raise HTTPException(status_code=400, detail="The role owner is not an employee.")
    risk = payload.get("departure_risk")
    if risk is not None and risk not in DEPARTURE_RISKS:
        raise HTTPException(status_code=400, detail=f"departure_risk must be one of {', '.join(DEPARTURE_RISKS)}.")
    if payload.get("expected_departure_date") and not _parse_date(payload["expected_departure_date"]):
        raise HTTPException(status_code=400, detail="expected_departure_date must be YYYY-MM-DD.")
    if payload.get("is_business_critical") and len(_clean(payload.get("criticality_reason"))) < 5 and "criticality_reason" in payload:
        raise HTTPException(status_code=400, detail="Record why the role is business-critical.")


def create_role(db: Client, payload: dict[str, Any], actor: str) -> dict[str, Any]:
    ensure_schema(db)
    employees = _employees(db)
    payload = dict(payload)
    payload.setdefault("criticality_reason", "")
    _validate_role_fields({**payload, "role_title": payload.get("role_title", "")}, employees)
    incumbent_id = str(payload["incumbent_employee_id"])
    incumbent = employees[incumbent_id]
    title = _clean(payload["role_title"], 200)
    source = payload.get("requirements_source") or "incumbent"
    skills = _skills_by_employee(db).get(incumbent_id, [])
    if payload.get("requirements"):
        requirements = {"items": clean_requirement_items(payload["requirements"]), "source": "hr", "summary": "Set by HR."}
    elif source == "market":
        requirements = market_requirements(db, title, incumbent_id, skills)
    else:
        requirements = incumbent_requirements(title, incumbent, skills)
    now = _now().isoformat()
    critical = bool(payload.get("is_business_critical"))
    row = {
        "id": str(uuid.uuid4()),
        "role_title": title,
        "department": _clean(payload.get("department") or incumbent.get("department"), 200) or None,
        "incumbent_employee_id": incumbent_id,
        "owner_manager_id": payload.get("owner_manager_id") or incumbent.get("manager_id") or None,
        "is_business_critical": critical,
        "criticality_reason": _clean(payload.get("criticality_reason"), 1000) or None,
        "departure_risk": payload.get("departure_risk") or "Medium",
        "expected_departure_date": payload.get("expected_departure_date") or None,
        "requirements_json": json.dumps(requirements),
        "flagged_by": actor if critical else None,
        "flagged_at": now if critical else None,
        "created_at": now,
        "updated_at": now,
    }
    db.table("succession_roles").insert(row).execute()
    _audit(db, "role", row["id"], "role_registered", actor, f"{title}; business-critical={critical}")
    return row


def update_role(db: Client, role_id: str, payload: dict[str, Any], actor: str) -> dict[str, Any]:
    ensure_schema(db)
    role = _role_row(db, role_id)
    employees = _employees(db)
    allowed = {"role_title", "department", "incumbent_employee_id", "owner_manager_id", "is_business_critical",
               "criticality_reason", "departure_risk", "expected_departure_date"}
    changes = {key: value for key, value in payload.items() if key in allowed and value is not None}
    for clearable in ("owner_manager_id", "expected_departure_date"):
        if clearable in payload and not payload[clearable]:
            changes[clearable] = None
    if changes.get("is_business_critical") and not role.get("is_business_critical"):
        changes["criticality_reason"] = payload.get("criticality_reason") or role.get("criticality_reason") or ""
    _validate_role_fields(changes, employees)
    if "requirements" in payload and payload["requirements"] is not None:
        items = clean_requirement_items(payload["requirements"])
        if not items:
            raise HTTPException(status_code=400, detail="Keep at least one required skill.")
        current = _requirements(role)
        changes["requirements_json"] = json.dumps({**current, "items": items, "source": "hr", "summary": "Adjusted by HR."})
    if "role_title" in changes:
        changes["role_title"] = _clean(changes["role_title"], 200)
    if "criticality_reason" in changes:
        changes["criticality_reason"] = _clean(changes["criticality_reason"], 1000) or None
    if "is_business_critical" in changes:
        changes["is_business_critical"] = bool(changes["is_business_critical"])
        if changes["is_business_critical"] and not role.get("is_business_critical"):
            changes["flagged_by"] = actor
            changes["flagged_at"] = _now().isoformat()
    if not changes:
        return role
    changes["updated_at"] = _now().isoformat()
    db.table("succession_roles").update(changes).eq("id", role_id).execute()
    detail = ", ".join(sorted(key for key in changes if key not in {"updated_at", "requirements_json"}))
    if "requirements_json" in changes:
        detail = (detail + ", requirements").strip(", ")
    _audit(db, "role", role_id, "role_updated", actor, detail)
    return _role_row(db, role_id)


def derive_requirements(db: Client, role_id: str, source: str, actor: str) -> dict[str, Any]:
    ensure_schema(db)
    role = _role_row(db, role_id)
    employees = _employees(db)
    incumbent_id = str(role["incumbent_employee_id"])
    skills = _skills_by_employee(db).get(incumbent_id, [])
    if source == "market":
        requirements = market_requirements(db, role["role_title"], incumbent_id, skills)
    else:
        requirements = incumbent_requirements(role["role_title"], employees.get(incumbent_id), skills)
    if not requirements["items"]:
        raise HTTPException(status_code=422, detail="No requirements could be derived for this role.")
    db.table("succession_roles").update({"requirements_json": json.dumps(requirements), "updated_at": _now().isoformat()}).eq("id", role_id).execute()
    _audit(db, "role", role_id, "requirements_derived", actor, f"source={requirements['source']}")
    return requirements


# ── Candidate scoring ─────────────────────────────────────────────────────


def _band(score: int) -> str:
    for floor, label in BANDS:
        if score >= floor:
            return label
    return BANDS[-1][1]


def score_candidate(
    requirements: list[dict[str, Any]],
    candidate: dict[str, Any],
    skills: list[dict[str, Any]],
    role: dict[str, Any],
    incumbent: dict[str, Any] | None,
) -> dict[str, Any]:
    """Readiness 0–100: skill coverage 70, verified skills 10, experience 10, role context 10."""
    total_required = sum(int(req["level"]) for req in requirements) or 1
    covered = 0
    shortfall = 0
    verified_hits = 0
    gaps: list[dict[str, Any]] = []
    strengths: list[dict[str, Any]] = []
    for req in requirements:
        level, matched = _match_requirement_level(req["skill"], skills)
        required = int(req["level"])
        covered += min(level, required)
        missing = max(0, required - level)
        shortfall += missing
        if matched and any(str(s.get("name")) == matched and s.get("verified") for s in skills):
            verified_hits += 1
        entry = {"skill": req["skill"], "current": level, "required": required, "gap": missing, "matched_as": matched}
        if missing:
            entry["hours_to_close"] = missing * HOURS_PER_LEVEL
            gaps.append(entry)
        else:
            strengths.append(entry)
    coverage = covered / total_required
    verified = verified_hits / len(requirements) if requirements else 0.0

    years = candidate.get("years_experience")
    target_years = max(3, int((incumbent or {}).get("years_experience") or 6))
    experience = min(1.0, float(years) / target_years) if years else 0.0

    same_department = bool(role.get("department")) and str(candidate.get("department") or "").lower() == str(role.get("department")).lower()
    same_family = _role_family(str(candidate.get("role") or "").lower()) == _role_family(str(role.get("role_title") or "").lower())
    context = 1.0 if same_department and same_family else 0.6 if same_department or same_family else 0.0

    components = {
        "skills": round(READINESS_WEIGHTS["skills"] * coverage, 1),
        "verified": round(READINESS_WEIGHTS["verified"] * verified, 1),
        "experience": round(READINESS_WEIGHTS["experience"] * experience, 1),
        "context": round(READINESS_WEIGHTS["context"] * context, 1),
    }
    readiness = int(round(sum(components.values())))
    gap_pct = round(100 * shortfall / total_required, 1)
    gaps.sort(key=lambda row: (-row["gap"], row["skill"].lower()))
    return {
        "employee_id": str(candidate["id"]),
        "candidate_readiness_score": readiness,
        "candidate_skill_gap_pct": gap_pct,
        "readiness_band": _band(readiness),
        "components": {
            **components,
            "coverage_pct": round(100 * coverage, 1),
            "years_experience": years,
            "same_department": same_department,
            "same_role_family": same_family,
        },
        "gaps": gaps,
        "strengths": strengths,
        "matched_requirements": len(requirements) - sum(1 for g in gaps if g["current"] == 0),
    }


def rank_candidates(scored: list[dict[str, Any]], names: dict[str, str] | None = None) -> list[dict[str, Any]]:
    """Readiness descending, then lower skill gap, then name for a stable order. At most five."""
    names = names or {}
    ordered = sorted(
        scored,
        key=lambda row: (-row["candidate_readiness_score"], row["candidate_skill_gap_pct"], names.get(row["employee_id"], "").lower(), row["employee_id"]),
    )[:MAX_CANDIDATES]
    for index, row in enumerate(ordered, start=1):
        row["rank_position"] = index
    return ordered


def build_slate(db: Client, role: dict[str, Any]) -> list[dict[str, Any]]:
    employees = _employees(db)
    skills = _skills_by_employee(db)
    requirements = _requirements(role)["items"]
    if not requirements:
        raise HTTPException(status_code=422, detail="Set the role's required skills before generating a slate.")
    incumbent = employees.get(str(role["incumbent_employee_id"]))
    scored = []
    for employee_id, employee in employees.items():
        if employee_id == str(role["incumbent_employee_id"]):
            continue
        if str(employee.get("employment_status") or "Active").lower() not in {"active", ""}:
            continue
        result = score_candidate(requirements, employee, skills.get(employee_id, []), role, incumbent)
        if result["matched_requirements"] <= 0:
            continue
        scored.append(result)
    return rank_candidates(scored, {key: str(value.get("full_name") or "") for key, value in employees.items()})


# ── Succession records and the HR gate ────────────────────────────────────


def generate_slate(db: Client, role_id: str, trigger: str, note: str, actor: str) -> dict[str, Any]:
    ensure_schema(db)
    role = _role_row(db, role_id)
    reason = TRIGGERS.get(trigger)
    if not reason:
        raise HTTPException(status_code=400, detail="trigger must be business_critical or hr_request.")
    if reason == TRIGGER_BUSINESS_CRITICAL and not role.get("is_business_critical"):
        raise HTTPException(
            status_code=409,
            detail="This role is not flagged business-critical. Flag it in the role register or raise an explicit HR request.",
        )
    note = _clean(note, 1000)
    if reason == TRIGGER_HR_REQUEST and len(note) < 5:
        raise HTTPException(status_code=400, detail="An HR request needs a recorded reason.")

    record = _active_record(db, role_id)
    if record and record["pairing_status"] == STATUS_CONFIRMED:
        raise HTTPException(status_code=409, detail="This role already has a confirmed successor. Withdraw the pairing before generating a new slate.")
    slate = build_slate(db, role)
    now = _now().isoformat()
    if record:
        record_id = record["id"]
        for row in _candidates(db, record_id):
            db.table("succession_candidates").delete().eq("id", row["id"]).execute()
        changes: dict[str, Any] = {
            "trigger_reason": reason,
            "trigger_note": note or None,
            "requested_by": actor,
            "generated_at": now,
            "updated_at": now,
        }
        if record.get("nominee_employee_id") and record["nominee_employee_id"] not in {row["employee_id"] for row in slate}:
            changes.update({"nominee_employee_id": None, "pairing_status": STATUS_SLATE})
        db.table("succession_records").update(changes).eq("id", record_id).execute()
        action = "slate_regenerated"
    else:
        record_id = str(uuid.uuid4())
        db.table("succession_records").insert({
            "id": record_id,
            "role_id": role_id,
            "incumbent_employee_id": role["incumbent_employee_id"],
            "trigger_reason": reason,
            "trigger_note": note or None,
            "requested_by": actor,
            "pairing_status": STATUS_SLATE,
            "nominee_employee_id": None,
            "approved_by_hr": False,
            "shared_with_candidates": False,
            "generated_at": now,
            "created_at": now,
            "updated_at": now,
        }).execute()
        action = "slate_generated"
    for row in slate:
        db.table("succession_candidates").insert({
            "id": str(uuid.uuid4()),
            "succession_record_id": record_id,
            "employee_id": row["employee_id"],
            "rank_position": row["rank_position"],
            "candidate_readiness_score": row["candidate_readiness_score"],
            "candidate_skill_gap_pct": row["candidate_skill_gap_pct"],
            "readiness_band": row["readiness_band"],
            "components_json": json.dumps(row["components"]),
            "gaps_json": json.dumps(row["gaps"]),
            "strengths_json": json.dumps(row["strengths"]),
            "created_at": now,
        }).execute()
    _audit(db, "record", record_id, action, actor, f"{reason}; {len(slate)} candidates" + (f"; {note}" if note else ""), record_id)
    return record_detail(db, record_id)


def nominate(db: Client, record_id: str, employee_id: str, note: str, actor: str) -> dict[str, Any]:
    ensure_schema(db)
    record = _record_row(db, record_id)
    if record["pairing_status"] in {STATUS_CONFIRMED, STATUS_WITHDRAWN}:
        raise HTTPException(status_code=409, detail=f"A {record['pairing_status'].lower()} pairing cannot take a new nominee.")
    if employee_id not in {row["employee_id"] for row in _candidates(db, record_id)}:
        raise HTTPException(status_code=400, detail="Nominate a candidate from the ranked slate.")
    db.table("succession_records").update({
        "nominee_employee_id": employee_id,
        "pairing_status": STATUS_NOMINATED,
        "approved_by_hr": False,
        "decision_note": _clean(note, 1000) or None,
        "updated_at": _now().isoformat(),
    }).eq("id", record_id).execute()
    _audit(db, "record", record_id, "candidate_nominated", actor, employee_id + (f"; {note}" if note else ""), record_id)
    return record_detail(db, record_id)


def set_pairing_status(db: Client, record_id: str, status: str, actor: str) -> dict[str, Any]:
    """Every status change goes through here so Confirmed always needs approved_by_hr."""
    record = _record_row(db, record_id)
    if status not in PAIRING_STATUSES:
        raise HTTPException(status_code=400, detail="Unknown pairing status.")
    if status == STATUS_CONFIRMED and not record.get("approved_by_hr"):
        raise HTTPException(status_code=409, detail="pairing_status can reach Confirmed only after HR approval (approved_by_hr = TRUE).")
    if status == STATUS_NOMINATED and not record.get("nominee_employee_id"):
        raise HTTPException(status_code=409, detail="Nominate a candidate first.")
    db.table("succession_records").update({"pairing_status": status, "updated_at": _now().isoformat()}).eq("id", record_id).execute()
    _audit(db, "record", record_id, "status_changed", actor, status, record_id)
    return _record_row(db, record_id)


def hr_decision(db: Client, record_id: str, approve: bool, note: str, actor: str, open_plan_now: bool = True) -> dict[str, Any]:
    ensure_schema(db)
    record = _record_row(db, record_id)
    if record["pairing_status"] != STATUS_NOMINATED or not record.get("nominee_employee_id"):
        raise HTTPException(status_code=409, detail="HR approves a pairing once a candidate is nominated.")
    now = _now().isoformat()
    note = _clean(note, 1000)
    if approve:
        db.table("succession_records").update({
            "approved_by_hr": True,
            "approved_by": actor,
            "approved_at": now,
            "decision_note": note or None,
            "updated_at": now,
        }).eq("id", record_id).execute()
        _audit(db, "record", record_id, "hr_approved", actor, note, record_id)
        set_pairing_status(db, record_id, STATUS_CONFIRMED, actor)
        plan = _plan_for_record(db, record_id)
        if plan:
            db.table("kt_plans").update({"successor_employee_id": record["nominee_employee_id"], "updated_at": now}).eq("id", plan["id"]).execute()
            _audit(db, "plan", plan["id"], "successor_assigned", actor, record["nominee_employee_id"], record_id)
        elif open_plan_now:
            open_plan(db, record_id, actor, hr_discretion=False)
    else:
        if len(note) < 5:
            raise HTTPException(status_code=400, detail="Record why HR is declining this pairing.")
        db.table("succession_records").update({
            "approved_by_hr": False,
            "nominee_employee_id": None,
            "pairing_status": STATUS_SLATE,
            "decision_note": note,
            "updated_at": now,
        }).eq("id", record_id).execute()
        _audit(db, "record", record_id, "hr_declined", actor, f"{record['nominee_employee_id']}; {note}", record_id)
    return record_detail(db, record_id)


def withdraw(db: Client, record_id: str, note: str, actor: str) -> dict[str, Any]:
    ensure_schema(db)
    record = _record_row(db, record_id)
    if record["pairing_status"] == STATUS_WITHDRAWN:
        return record_detail(db, record_id)
    note = _clean(note, 1000)
    if len(note) < 5:
        raise HTTPException(status_code=400, detail="Record why the pairing is withdrawn.")
    db.table("succession_records").update({
        "pairing_status": STATUS_WITHDRAWN,
        "decision_note": note,
        "updated_at": _now().isoformat(),
    }).eq("id", record_id).execute()
    _audit(db, "record", record_id, "withdrawn", actor, note, record_id)
    return record_detail(db, record_id)


def share_with_candidates(db: Client, record_id: str, shared: bool, actor: str) -> dict[str, Any]:
    ensure_schema(db)
    _record_row(db, record_id)
    db.table("succession_records").update({"shared_with_candidates": bool(shared), "updated_at": _now().isoformat()}).eq("id", record_id).execute()
    _audit(db, "record", record_id, "shared" if shared else "unshared", actor, "", record_id)
    return record_detail(db, record_id)


# ── Knowledge transfer plans ──────────────────────────────────────────────


def _handover_date(role: dict[str, Any], requested: Any = None) -> date:
    today = _today()
    for value in (requested, role.get("expected_departure_date")):
        parsed = _parse_date(value)
        if parsed and parsed > today + timedelta(days=6):
            return parsed
    return today + timedelta(days=DEFAULT_HANDOVER_DAYS)


def _template_tasks(role: dict[str, Any], incumbent: dict[str, Any] | None, successor: dict[str, Any] | None, gaps: list[dict[str, Any]], requirements: list[dict[str, Any]], horizon: int) -> list[dict[str, Any]]:
    who = (incumbent or {}).get("full_name") or "the incumbent"
    heir = (successor or {}).get("full_name") or "the successor"
    focus = [g["skill"] for g in gaps[:3]] or [r["skill"] for r in requirements[:3]]
    areas = [r["skill"] for r in sorted(requirements, key=lambda r: -int(r["level"]))[:3]]
    tasks: list[dict[str, Any]] = []
    for index, skill in enumerate(focus):
        tasks.append({
            "task_type": "Shadowing Session",
            "title": f"Shadow {who} on {skill} work",
            "description": f"{heir} joins {who} on live {skill} work and writes up what was decided and why.",
            "knowledge_area": skill,
            "owner": "successor",
            "due_in_days": int(horizon * (0.15 + 0.15 * index)),
        })
    for index, area in enumerate(areas):
        tasks.append({
            "task_type": "Documentation Task",
            "title": f"Document {area} runbooks and decisions",
            "description": f"{who} records the procedures, contacts, and past decisions for {area} in the team knowledge base.",
            "knowledge_area": area,
            "owner": "incumbent",
            "due_in_days": int(horizon * (0.3 + 0.15 * index)),
        })
    for index, share in enumerate((0.25, 0.55, 0.85)):
        tasks.append({
            "task_type": "Mentor Meeting",
            "title": f"Mentor check-in {index + 1}",
            "description": f"{who} and {heir} review progress on the plan and the open questions.",
            "knowledge_area": None,
            "owner": "incumbent",
            "due_in_days": int(horizon * share),
        })
    for title, share in (
        ("Introduce the successor to key stakeholders", 0.5),
        ("Transfer system access, credentials ownership, and on-call duties", 0.8),
        (f"{heir} runs the role for a week with {who} on standby", 0.9),
        ("Sign-off: handover complete", 1.0),
    ):
        tasks.append({
            "task_type": "Handover Checklist Item",
            "title": title,
            "description": None,
            "knowledge_area": None,
            "owner": "incumbent",
            "due_in_days": int(horizon * share),
        })
    return tasks


def _ai_tasks(role: dict[str, Any], incumbent: dict[str, Any] | None, successor: dict[str, Any] | None, gaps: list[dict[str, Any]], requirements: list[dict[str, Any]], horizon: int) -> list[dict[str, Any]] | None:
    if not _ai_enabled():
        return None
    from app.services.gemini_safe import ask_gemini_timed

    facts = {
        "role": role.get("role_title"),
        "department": role.get("department"),
        "criticality_reason": role.get("criticality_reason"),
        "incumbent": {"name": (incumbent or {}).get("full_name"), "role": (incumbent or {}).get("role")},
        "successor": {"name": (successor or {}).get("full_name"), "role": (successor or {}).get("role")} if successor else None,
        "critical_knowledge": [{"skill": r["skill"], "level_needed": r["level"], "why": r.get("why")} for r in requirements],
        "successor_gaps": [{"skill": g["skill"], "current": g["current"], "required": g["required"]} for g in gaps],
        "days_until_handover": horizon,
    }
    prompt = f"""You are an HR knowledge-transfer lead. Draft a knowledge transfer plan for handing over a
business-critical role before the incumbent leaves. Use only the facts below.

FACTS:
{json.dumps(facts, indent=2)}

Return JSON only, in this shape:
{{"tasks": [{{"task_type": "Shadowing Session|Documentation Task|Mentor Meeting|Handover Checklist Item",
  "title": "short imperative title", "description": "one or two sentences naming the concrete output",
  "knowledge_area": "skill or area, or null", "owner": "incumbent|successor", "due_in_days": 1-{horizon}}}]}}

Rules: 8 to 14 tasks. Include every task type at least once. Target the successor gaps first with shadowing
and mentor meetings. Documentation tasks capture the incumbent's critical knowledge as runbooks, decision logs,
or diagrams. Finish with handover checklist items (stakeholder introductions, access transfer, a supervised
period running the role, and a final sign-off). Spread due dates across the window and keep the final
sign-off on day {horizon}."""
    text = ask_gemini_timed(prompt, timeout=30.0, fallback="")
    match = re.search(r"\{.*\}", text or "", re.S)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except ValueError:
        return None
    tasks = []
    for item in data.get("tasks") or []:
        if not isinstance(item, dict) or item.get("task_type") not in TASK_TYPES:
            continue
        title = _clean(item.get("title"), 300)
        if len(title) < 4:
            continue
        try:
            due = int(item.get("due_in_days") or horizon)
        except (TypeError, ValueError):
            due = horizon
        tasks.append({
            "task_type": item["task_type"],
            "title": title,
            "description": _clean(item.get("description"), 800) or None,
            "knowledge_area": _clean(item.get("knowledge_area"), 200) or None,
            "owner": "successor" if str(item.get("owner")).lower() == "successor" else "incumbent",
            "due_in_days": max(1, min(horizon, due)),
        })
    if len(tasks) < 4 or len({task["task_type"] for task in tasks}) < len(TASK_TYPES):
        return None
    return tasks[:14]


def _successor_gaps(db: Client, record_id: str, successor_id: str | None) -> list[dict[str, Any]]:
    if not successor_id:
        return []
    for row in _candidates(db, record_id):
        if row["employee_id"] == successor_id:
            return _loads(row.get("gaps_json"), [])
    return []


def open_plan(db: Client, record_id: str, actor: str, hr_discretion: bool, target_handover_date: Any = None, use_ai: bool = True) -> dict[str, Any]:
    """A plan opens when the pairing is confirmed, or earlier at HR's discretion."""
    ensure_schema(db)
    record = _record_row(db, record_id)
    existing = _plan_for_record(db, record_id)
    if existing:
        return plan_detail(db, existing["id"])
    if record["pairing_status"] == STATUS_WITHDRAWN:
        raise HTTPException(status_code=409, detail="This pairing was withdrawn.")
    confirmed = record["pairing_status"] == STATUS_CONFIRMED
    if not confirmed and not hr_discretion:
        raise HTTPException(status_code=409, detail="A knowledge transfer plan opens once the pairing is confirmed, or earlier at HR's discretion.")
    role = _role_row(db, record["role_id"])
    employees = _employees(db)
    successor_id = record.get("nominee_employee_id")
    incumbent = employees.get(str(record["incumbent_employee_id"]))
    successor = employees.get(str(successor_id)) if successor_id else None
    handover = _handover_date(role, target_handover_date)
    horizon = max(7, (handover - _today()).days)
    requirements = _requirements(role)["items"]
    gaps = _successor_gaps(db, record_id, successor_id)

    drafted = None
    if use_ai:
        drafted = _ai_tasks(role, incumbent, successor, gaps, requirements, horizon)
    tasks = drafted or _template_tasks(role, incumbent, successor, gaps, requirements, horizon)
    now = _now().isoformat()
    plan_id = str(uuid.uuid4())
    db.table("kt_plans").insert({
        "id": plan_id,
        "succession_record_id": record_id,
        "role_id": role["id"],
        "incumbent_employee_id": record["incumbent_employee_id"],
        "successor_employee_id": successor_id,
        "opened_reason": "Pairing Confirmed" if confirmed else "HR Discretion",
        "status": "Open",
        "overall_progress_pct": 0,
        "target_handover_date": handover.isoformat(),
        "drafted_by": "Gemini" if drafted else "Template",
        "created_by": actor,
        "created_at": now,
        "updated_at": now,
    }).execute()
    for index, task in enumerate(tasks):
        owner = successor_id if task["owner"] == "successor" and successor_id else record["incumbent_employee_id"]
        db.table("kt_tasks").insert({
            "id": str(uuid.uuid4()),
            "plan_id": plan_id,
            "task_type": task["task_type"],
            "title": task["title"],
            "description": task.get("description"),
            "knowledge_area": task.get("knowledge_area"),
            "owner_employee_id": owner,
            "due_date": (_today() + timedelta(days=max(1, int(task["due_in_days"])))).isoformat(),
            "status": "Not Started",
            "completed_at": None,
            "notes": None,
            "sort_order": index,
            "created_at": now,
            "updated_at": now,
        }).execute()
    _audit(db, "plan", plan_id, "plan_opened", actor, f"{'Pairing Confirmed' if confirmed else 'HR Discretion'}; {len(tasks)} tasks drafted by {'Gemini' if drafted else 'template'}", record_id)
    recompute_progress(db, plan_id)
    return plan_detail(db, plan_id)


def _is_overdue(task: dict[str, Any], today: date | None = None) -> bool:
    due = _parse_date(task.get("due_date"))
    return bool(due and due < (today or _today()) and task.get("status") != TASK_COMPLETE)


def progress_of(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(tasks)
    done = sum(1 for task in tasks if task.get("status") == TASK_COMPLETE)
    started = any(task.get("status") in {"In Progress", "Blocked", TASK_COMPLETE} for task in tasks)
    pct = round(100 * done / total, 1) if total else 0.0
    status = "Complete" if total and done == total else "In Progress" if started else "Open"
    return {"total": total, "completed": done, "overall_progress_pct": pct, "status": status, "overdue": sum(1 for task in tasks if _is_overdue(task))}


def recompute_progress(db: Client, plan_id: str) -> dict[str, Any]:
    summary = progress_of(_tasks(db, plan_id))
    db.table("kt_plans").update({
        "overall_progress_pct": summary["overall_progress_pct"],
        "status": summary["status"],
        "updated_at": _now().isoformat(),
    }).eq("id", plan_id).execute()
    return summary


def _validate_task(payload: dict[str, Any], partial: bool) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if not partial or "task_type" in payload:
        if payload.get("task_type") not in TASK_TYPES:
            raise HTTPException(status_code=400, detail=f"task_type must be one of: {', '.join(TASK_TYPES)}.")
        out["task_type"] = payload["task_type"]
    if not partial or "title" in payload:
        title = _clean(payload.get("title"), 300)
        if len(title) < 3:
            raise HTTPException(status_code=400, detail="Give the task a title.")
        out["title"] = title
    if not partial or "due_date" in payload:
        due = _parse_date(payload.get("due_date"))
        if not due:
            raise HTTPException(status_code=400, detail="Every task needs a due_date (YYYY-MM-DD).")
        out["due_date"] = due.isoformat()
    if "status" in payload and payload["status"] is not None:
        if payload["status"] not in TASK_STATUSES:
            raise HTTPException(status_code=400, detail=f"status must be one of: {', '.join(TASK_STATUSES)}.")
        out["status"] = payload["status"]
    for key, limit in (("description", 800), ("knowledge_area", 200), ("notes", 2000)):
        if key in payload and payload[key] is not None:
            out[key] = _clean(payload[key], limit) or None
    if payload.get("owner_employee_id"):
        out["owner_employee_id"] = str(payload["owner_employee_id"])
    return out


def add_task(db: Client, plan_id: str, payload: dict[str, Any], actor: str) -> dict[str, Any]:
    ensure_schema(db)
    plan = _plan_row(db, plan_id)
    fields = _validate_task(payload, partial=False)
    now = _now().isoformat()
    status = fields.pop("status", "Not Started")
    task_id = str(uuid.uuid4())
    db.table("kt_tasks").insert({
        "id": task_id,
        "plan_id": plan_id,
        "owner_employee_id": fields.pop("owner_employee_id", None) or plan.get("successor_employee_id") or plan["incumbent_employee_id"],
        "status": status,
        "completed_at": now if status == TASK_COMPLETE else None,
        "sort_order": len(_tasks(db, plan_id)),
        "created_at": now,
        "updated_at": now,
        "description": None,
        "knowledge_area": None,
        "notes": None,
        **fields,
    }).execute()
    _audit(db, "task", task_id, "task_added", actor, fields["title"], plan["succession_record_id"])
    recompute_progress(db, plan_id)
    return plan_detail(db, plan_id)


def update_task(db: Client, task_id: str, payload: dict[str, Any], actor: str) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("kt_tasks").select("*").eq("id", task_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Task not found.")
    task = rows[0]
    changes = _validate_task(payload, partial=True)
    if not changes:
        return plan_detail(db, task["plan_id"])
    now = _now().isoformat()
    if "status" in changes:
        changes["completed_at"] = now if changes["status"] == TASK_COMPLETE else None
    changes["updated_at"] = now
    db.table("kt_tasks").update(changes).eq("id", task_id).execute()
    plan = _plan_row(db, task["plan_id"])
    detail = changes.get("status") or ", ".join(sorted(k for k in changes if k not in {"updated_at", "completed_at"}))
    _audit(db, "task", task_id, "task_updated", actor, f"{task['title']}: {detail}", plan["succession_record_id"])
    recompute_progress(db, task["plan_id"])
    return plan_detail(db, task["plan_id"])


def delete_task(db: Client, task_id: str, actor: str) -> dict[str, Any]:
    ensure_schema(db)
    rows = db.table("kt_tasks").select("*").eq("id", task_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Task not found.")
    task = rows[0]
    db.table("kt_tasks").delete().eq("id", task_id).execute()
    plan = _plan_row(db, task["plan_id"])
    _audit(db, "task", task_id, "task_removed", actor, task["title"], plan["succession_record_id"])
    recompute_progress(db, task["plan_id"])
    return plan_detail(db, task["plan_id"])


# ── Views ─────────────────────────────────────────────────────────────────


def _task_view(task: dict[str, Any], employees: dict[str, dict[str, Any]], today: date) -> dict[str, Any]:
    due = _parse_date(task.get("due_date"))
    overdue = _is_overdue(task, today)
    return {
        "id": task["id"],
        "plan_id": task["plan_id"],
        "task_type": task["task_type"],
        "title": task["title"],
        "description": task.get("description"),
        "knowledge_area": task.get("knowledge_area"),
        "owner": _person(employees, task.get("owner_employee_id")),
        "due_date": task.get("due_date"),
        "status": task["status"],
        "completed_at": task.get("completed_at"),
        "notes": task.get("notes"),
        "overdue_flag": overdue,
        "days_overdue": (today - due).days if overdue and due else 0,
        "days_left": (due - today).days if due and not overdue and task["status"] != TASK_COMPLETE else None,
    }


def plan_detail(db: Client, plan_id: str, employees: dict[str, dict[str, Any]] | None = None) -> dict[str, Any]:
    plan = _plan_row(db, plan_id)
    employees = employees or _employees(db)
    today = _today()
    tasks = _tasks(db, plan_id)
    summary = progress_of(tasks)
    handover = _parse_date(plan.get("target_handover_date"))
    views = [_task_view(task, employees, today) for task in tasks]
    return {
        "id": plan["id"],
        "succession_record_id": plan["succession_record_id"],
        "role_id": plan["role_id"],
        "incumbent": _person(employees, plan["incumbent_employee_id"]),
        "successor": _person(employees, plan.get("successor_employee_id")),
        "opened_reason": plan["opened_reason"],
        "status": summary["status"],
        "overall_progress_pct": summary["overall_progress_pct"],
        "completed_tasks": summary["completed"],
        "total_tasks": summary["total"],
        "overdue_tasks": summary["overdue"],
        "overdue_flags": [{"task_id": t["id"], "title": t["title"], "due_date": t["due_date"], "days_overdue": t["days_overdue"], "owner": t["owner"]} for t in views if t["overdue_flag"]],
        "target_handover_date": plan["target_handover_date"],
        "days_to_handover": (handover - today).days if handover else None,
        "drafted_by": plan.get("drafted_by"),
        "created_by": plan.get("created_by"),
        "created_at": plan.get("created_at"),
        "by_type": {kind: sum(1 for t in views if t["task_type"] == kind) for kind in TASK_TYPES},
        "tasks": views,
    }


def _candidate_view(row: dict[str, Any], employees: dict[str, dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "employee": _person(employees, row["employee_id"]),
        "employee_id": row["employee_id"],
        "rank_position": int(row["rank_position"]),
        "candidate_readiness_score": int(row["candidate_readiness_score"]),
        "candidate_skill_gap_pct": float(row["candidate_skill_gap_pct"]),
        "readiness_band": row["readiness_band"],
        "components": _loads(row.get("components_json"), {}),
        "gaps": _loads(row.get("gaps_json"), []),
        "strengths": _loads(row.get("strengths_json"), []),
    }


def _record_view(db: Client, record: dict[str, Any], employees: dict[str, dict[str, Any]], include_audit: bool = False) -> dict[str, Any]:
    candidates = [_candidate_view(row, employees) for row in _candidates(db, record["id"])]
    nominee = next((c for c in candidates if c["employee_id"] == record.get("nominee_employee_id")), None)
    view = {
        "succession_record_id": record["id"],
        "role_id": record["role_id"],
        "trigger_reason": record["trigger_reason"],
        "trigger_note": record.get("trigger_note"),
        "requested_by": record.get("requested_by"),
        "pairing_status": record["pairing_status"],
        "approved_by_hr": bool(record.get("approved_by_hr")),
        "approved_by": record.get("approved_by"),
        "approved_at": record.get("approved_at"),
        "decision_note": record.get("decision_note"),
        "shared_with_candidates": bool(record.get("shared_with_candidates")),
        "generated_at": record.get("generated_at"),
        "nominee": nominee,
        "candidates": candidates,
        "has_ready_successor": any(c["candidate_readiness_score"] >= READY_NOW for c in candidates),
    }
    if include_audit:
        rows = db.table("succession_audit").select("*").eq("record_id", record["id"]).execute().data or []
        rows.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
        view["audit"] = [{k: row.get(k) for k in ("action", "actor", "detail", "created_at", "entity_type")} for row in rows[:50]]
    return view


def record_detail(db: Client, record_id: str) -> dict[str, Any]:
    record = _record_row(db, record_id)
    employees = _employees(db)
    view = _record_view(db, record, employees, include_audit=True)
    plan = _plan_for_record(db, record_id)
    view["plan"] = plan_detail(db, plan["id"], employees) if plan else None
    view["role"] = role_view(db, _role_row(db, record["role_id"]), employees, include_record=False)
    return view


def _departure_risk(role: dict[str, Any], at_risk: dict[str, str]) -> str:
    risk = role.get("departure_risk") or "Medium"
    flagged = at_risk.get(str(role["incumbent_employee_id"]))
    if flagged in {"High", "Critical"}:
        return "High"
    if flagged == "Medium" and risk == "Low":
        return "Medium"
    return risk if risk in DEPARTURE_RISKS else "Medium"


def exposure(role: dict[str, Any], record: dict[str, Any] | None, plan: dict[str, Any] | None, risk: str) -> dict[str, Any]:
    """Exposure 0–100. Mitigation = 60% succession cover + 40% knowledge captured, scaled by departure risk."""
    candidates = (record or {}).get("candidates") or []
    confirmed = record and record["pairing_status"] == STATUS_CONFIRMED and record.get("nominee")
    if confirmed:
        cover = float(record["nominee"]["candidate_readiness_score"])
        cover_note = f"Confirmed successor at {int(cover)}% readiness"
    elif candidates:
        cover = 0.5 * max(c["candidate_readiness_score"] for c in candidates)
        cover_note = "Best candidate not yet confirmed (counted at half weight)"
    elif record:
        cover = 0.0
        cover_note = "Slate generated with no qualifying internal candidate"
    else:
        cover = 0.0
        cover_note = "No successor slate yet"
    knowledge = float((plan or {}).get("overall_progress_pct") or 0)
    mitigation = 0.6 * cover + 0.4 * knowledge
    score = int(round((100 - mitigation) * RISK_WEIGHT.get(risk, 0.8)))
    if not role.get("is_business_critical"):
        score = int(round(score * 0.6))
    level = "Critical" if score >= 70 else "High" if score >= 45 else "Moderate" if score >= 25 else "Low"
    return {
        "score": score,
        "level": level,
        "succession_cover": round(cover, 1),
        "knowledge_captured": round(knowledge, 1),
        "departure_risk": risk,
        "explanation": f"{cover_note}; {knowledge:.0f}% of knowledge transfer complete; departure risk {risk.lower()}.",
    }


def role_view(db: Client, role: dict[str, Any], employees: dict[str, dict[str, Any]], include_record: bool = True, at_risk: dict[str, str] | None = None) -> dict[str, Any]:
    requirements = _requirements(role)
    view: dict[str, Any] = {
        "id": role["id"],
        "role_title": role["role_title"],
        "department": role.get("department"),
        "incumbent": _person(employees, role["incumbent_employee_id"]),
        "owner": _person(employees, role.get("owner_manager_id")),
        "is_business_critical": bool(role.get("is_business_critical")),
        "criticality_reason": role.get("criticality_reason"),
        "departure_risk": role.get("departure_risk") or "Medium",
        "expected_departure_date": role.get("expected_departure_date"),
        "flagged_by": role.get("flagged_by"),
        "flagged_at": role.get("flagged_at"),
        "requirements": requirements["items"],
        "requirements_source": requirements.get("source"),
        "requirements_summary": requirements.get("summary"),
        "requirements_sources": requirements.get("sources") or [],
        "can_generate_slate": bool(role.get("is_business_critical")),
    }
    if include_record:
        record_row = _active_record(db, role["id"])
        record = _record_view(db, record_row, employees) if record_row else None
        plan_row = _plan_for_record(db, record_row["id"]) if record_row else None
        plan = plan_detail(db, plan_row["id"], employees) if plan_row else None
        risk = _departure_risk(role, at_risk if at_risk is not None else _at_risk(db))
        view["record"] = record
        view["plan"] = plan
        view["exposure"] = exposure(role, record, plan, risk)
        view["has_ready_successor"] = bool(record and (record["has_ready_successor"] or (record.get("nominee") and record["nominee"]["candidate_readiness_score"] >= READY_NOW)))
    return view


def _at_risk(db: Client) -> dict[str, str]:
    try:
        rows = db.table("org_at_risk_employees").select("employee_id, risk_level").execute().data or []
    except Exception:
        return {}
    return {str(row["employee_id"]): str(row.get("risk_level") or "") for row in rows if row.get("employee_id")}


def overview(db: Client, manager_id: str | None = None) -> dict[str, Any]:
    ensure_schema(db)
    employees = _employees(db)
    at_risk = _at_risk(db)
    rows = db.table("succession_roles").select("*").execute().data or []
    if manager_id:
        rows = [row for row in rows if str(row.get("owner_manager_id") or "") == manager_id or str(employees.get(str(row["incumbent_employee_id"]), {}).get("manager_id") or "") == manager_id]
    roles = [role_view(db, row, employees, at_risk=at_risk) for row in rows]
    roles.sort(key=lambda r: (-r["exposure"]["score"], r["role_title"].lower()))
    critical = [r for r in roles if r["is_business_critical"]]
    plans = [r["plan"] for r in roles if r.get("plan")]
    owners = {str(r["owner"]["id"]): r["owner"] for r in roles if r.get("owner")}
    return {
        "generated_at": _now().isoformat(),
        "scope": {"manager_id": manager_id} if manager_id else {"manager_id": None},
        "totals": {
            "roles": len(roles),
            "business_critical": len(critical),
            "critical_without_ready_successor": sum(1 for r in critical if not r["has_ready_successor"]),
            "critical_without_slate": sum(1 for r in critical if not r.get("record")),
            "pending_hr_approval": sum(1 for r in roles if r.get("record") and r["record"]["pairing_status"] == STATUS_NOMINATED),
            "confirmed_pairings": sum(1 for r in roles if r.get("record") and r["record"]["pairing_status"] == STATUS_CONFIRMED),
            "plans_open": len(plans),
            "avg_kt_progress_pct": round(sum(p["overall_progress_pct"] for p in plans) / len(plans), 1) if plans else 0.0,
            "overdue_tasks": sum(p["overdue_tasks"] for p in plans),
            "exposure_by_level": {level: sum(1 for r in roles if r["exposure"]["level"] == level) for level in ("Critical", "High", "Moderate", "Low")},
        },
        "roles": roles,
        "role_owners": sorted(owners.values(), key=lambda p: p["full_name"]),
    }


def employee_view(db: Client, employee_id: str) -> dict[str, Any]:
    """What an employee may see: pairings they are confirmed for, or slates HR has shared with candidates."""
    ensure_schema(db)
    employees = _employees(db)
    if employee_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found.")
    considered = []
    for row in db.table("succession_candidates").select("*").eq("employee_id", employee_id).execute().data or []:
        record = _record_row(db, row["succession_record_id"])
        if record["pairing_status"] == STATUS_WITHDRAWN:
            continue
        confirmed = record["pairing_status"] == STATUS_CONFIRMED and record.get("nominee_employee_id") == employee_id
        if not (confirmed or record.get("shared_with_candidates")):
            continue
        role = _role_row(db, record["role_id"])
        candidate = _candidate_view(row, employees)
        plan_row = _plan_for_record(db, record["id"]) if confirmed else None
        considered.append({
            "succession_record_id": record["id"],
            "role_title": role["role_title"],
            "department": role.get("department"),
            "incumbent": _person(employees, role["incumbent_employee_id"]),
            "status": "Confirmed successor" if confirmed else "On the successor slate",
            "rank_position": candidate["rank_position"],
            "slate_size": len(_candidates(db, record["id"])),
            "candidate_readiness_score": candidate["candidate_readiness_score"],
            "candidate_skill_gap_pct": candidate["candidate_skill_gap_pct"],
            "readiness_band": candidate["readiness_band"],
            "components": candidate["components"],
            "gaps": candidate["gaps"],
            "strengths": candidate["strengths"],
            "hours_to_close": sum(int(g.get("hours_to_close") or 0) for g in candidate["gaps"]),
            "plan": plan_detail(db, plan_row["id"], employees) if plan_row else None,
        })
    considered.sort(key=lambda row: (row["status"] != "Confirmed successor", -row["candidate_readiness_score"]))
    my_tasks = []
    for task in db.table("kt_tasks").select("*").eq("owner_employee_id", employee_id).execute().data or []:
        if task.get("status") == TASK_COMPLETE:
            continue
        plan = _plan_row(db, task["plan_id"])
        role = _role_row(db, plan["role_id"])
        view = _task_view(task, employees, _today())
        view["role_title"] = role["role_title"]
        my_tasks.append(view)
    my_tasks.sort(key=lambda t: (not t["overdue_flag"], str(t["due_date"])))
    incumbent_roles = [
        {"id": r["id"], "role_title": r["role_title"], "is_business_critical": bool(r.get("is_business_critical"))}
        for r in db.table("succession_roles").select("id, role_title, is_business_critical").eq("incumbent_employee_id", employee_id).execute().data or []
    ]
    return {
        "employee": _person(employees, employee_id),
        "considered": considered,
        "my_tasks": my_tasks,
        "incumbent_roles": incumbent_roles,
    }


def audit_log(db: Client, limit: int = 100) -> list[dict[str, Any]]:
    ensure_schema(db)
    rows = db.table("succession_audit").select("*").execute().data or []
    rows.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    return rows[:limit]


# ── Persona questions ─────────────────────────────────────────────────────


def _facts_for(db: Client, persona: str, employee_id: str | None, manager_id: str | None) -> dict[str, Any]:
    if persona == "employee":
        if not employee_id:
            raise HTTPException(status_code=400, detail="employee_id is required for the employee view.")
        view = employee_view(db, employee_id)
        return {
            "employee": view["employee"]["full_name"],
            "considered_for": [{
                "role": c["role_title"], "status": c["status"], "rank": c["rank_position"], "of": c["slate_size"],
                "readiness": c["candidate_readiness_score"], "band": c["readiness_band"], "skill_gap_pct": c["candidate_skill_gap_pct"],
                "gaps_to_close": [{"skill": g["skill"], "current": g["current"], "required": g["required"], "hours": g.get("hours_to_close")} for g in c["gaps"]],
            } for c in view["considered"]],
            "open_handover_tasks": [{"title": t["title"], "role": t["role_title"], "due": t["due_date"], "overdue": t["overdue_flag"]} for t in view["my_tasks"]],
        }
    data = overview(db, manager_id if persona == "manager" else None)
    return {
        "totals": data["totals"],
        "roles": [_role_facts(r) for r in data["roles"]],
    }


def _role_facts(r: dict[str, Any]) -> dict[str, Any]:
    record = r.get("record") or {}
    plan = r.get("plan") or {}
    nominee = record.get("nominee") if record.get("pairing_status") == STATUS_CONFIRMED else None
    open_tasks = sorted((t for t in plan.get("tasks") or [] if t.get("status") != TASK_COMPLETE), key=lambda t: str(t.get("due_date")))
    return {
        "role": r["role_title"], "department": r["department"], "business_critical": r["is_business_critical"],
        "incumbent": (r["incumbent"] or {}).get("full_name"),
        "exposure": r["exposure"]["level"], "exposure_score": r["exposure"]["score"], "exposure_reason": r["exposure"]["explanation"],
        "pairing_status": record.get("pairing_status") or "No slate",
        "confirmed_successor": {
            "name": nominee["employee"]["full_name"], "readiness": nominee["candidate_readiness_score"], "band": nominee["readiness_band"],
        } if nominee else None,
        "ready_now_successor": r["has_ready_successor"],
        "top_candidates": [{"name": c["employee"]["full_name"], "readiness": c["candidate_readiness_score"], "band": c["readiness_band"]} for c in (record.get("candidates") or [])[:3]],
        "kt_plan": {
            "status": plan.get("status"),
            "progress_pct": plan.get("overall_progress_pct"),
            "completed_tasks": plan.get("completed_tasks"),
            "total_tasks": plan.get("total_tasks"),
            "tasks_by_type": plan.get("by_type"),
            "handover_date": plan.get("target_handover_date"),
            "overdue": [{"title": t["title"], "due": t["due_date"], "owner": (t.get("owner") or {}).get("full_name")} for t in open_tasks if t.get("overdue_flag")],
            "next_tasks": [{"title": t["title"], "type": t["task_type"], "due": t["due_date"], "owner": (t.get("owner") or {}).get("full_name")} for t in open_tasks if not t.get("overdue_flag")][:4],
        } if plan else None,
    }


def _fallback_answer(persona: str, facts: dict[str, Any]) -> str:
    if persona == "employee":
        items = facts["considered_for"]
        if not items:
            return "You are not on a shared successor slate right now. HR shares slates with candidates once a role's succession plan is ready to discuss."
        lines = []
        for c in items:
            gaps = ", ".join(f"{g['skill']} ({g['current']}→{g['required']})" for g in c["gaps_to_close"][:4]) or "no remaining skill gaps"
            lines.append(f"- **{c['role']}**: {c['status'].lower()}, rank {c['rank']} of {c['of']}, readiness {c['readiness']}% ({c['band']}). To close: {gaps}.")
        return "You are being considered for:\n" + "\n".join(lines)
    roles = facts["roles"]
    if not roles:
        return "No roles are in the succession register yet. Flag a business-critical role to start."
    if persona == "manager":
        missing = [r for r in roles if r["business_critical"] and not r["ready_now_successor"]]
        lines = [f"- **{r['role']}** ({r['incumbent']}): {r['pairing_status']}, exposure {r['exposure'].lower()}" for r in missing] or ["- Every business-critical role you own has a ready successor."]
        plans = []
        for r in roles:
            kt = r["kt_plan"]
            if not kt:
                continue
            successor = f" to {r['confirmed_successor']['name']}" if r["confirmed_successor"] else ""
            nxt = "; next: " + ", ".join(f"{t['title']} (due {t['due']})" for t in kt["next_tasks"][:2]) if kt["next_tasks"] else ""
            plans.append(
                f"- **{r['role']}**{successor}: {kt['completed_tasks']}/{kt['total_tasks']} tasks ({kt['progress_pct'] or 0:.0f}%), "
                f"{len(kt['overdue'])} overdue, handover {kt['handover_date']}{nxt}"
            )
        return "Business-critical roles without a ready successor:\n" + "\n".join(lines) + ("\n\nKnowledge-transfer plans:\n" + "\n".join(plans) if plans else "\n\nNo knowledge-transfer plans are open yet.")
    top = roles[:5]
    lines = [f"- **{r['role']}** — {r['exposure']} exposure ({r['exposure_score']}/100). {r['exposure_reason']}" for r in top]
    totals = facts["totals"]
    return (
        "Highest single-point-of-failure exposure:\n" + "\n".join(lines)
        + f"\n\nMitigation: {totals['confirmed_pairings']} confirmed pairings, {totals['plans_open']} knowledge-transfer plans at "
        f"{totals['avg_kt_progress_pct']:.0f}% average progress, {totals['overdue_tasks']} overdue tasks."
    )


def answer(db: Client, persona: str, question: str, employee_id: str | None = None, manager_id: str | None = None) -> dict[str, Any]:
    ensure_schema(db)
    persona = persona if persona in {"employee", "manager", "employer", "hr"} else "hr"
    question = _clean(question, 600)
    if len(question) < 3:
        raise HTTPException(status_code=400, detail="Ask a question.")
    facts = _facts_for(db, persona, employee_id, manager_id)
    fallback = _fallback_answer("employer" if persona == "hr" else persona, facts)
    text = ""
    if _ai_enabled():
        from app.services.gemini_safe import ask_gemini_timed

        audience = {"employee": "an employee asking about their own succession status", "manager": "a manager responsible for business-critical roles",
                    "employer": "an executive looking at business-wide exposure", "hr": "an HR / talent mobility partner"}[persona]
        prompt = f"""You answer questions about succession and knowledge transfer for {audience}.
Use only the facts below. Name roles, people, numbers, and dates from the facts. If the facts do not
cover the question, say what is known and what HR would need to add. Keep it under 180 words, use short
markdown bullets, and finish with one recommended next action.

FACTS:
{json.dumps(facts, indent=2, default=str)}

QUESTION: {question}"""
        text = ask_gemini_timed(prompt, timeout=25.0, fallback="")
    return {"answer": text or fallback, "source": "gemini" if text else "rules", "facts_used": facts}

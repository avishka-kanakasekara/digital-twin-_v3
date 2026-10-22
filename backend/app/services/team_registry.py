"""Shared team registry for employee-led and HR-led teams.

Registration waits for someone other than the creator. Confirmed membership
comes from an accepted invitation or an authorised direct assignment.
The success estimate is stored beside the team and never replaces feasibility.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import HTTPException

from app.database import Client
from app.ml.team_success.feature_builder import build_features, evaluation_notes
from app.ml.team_success.model_registry import artifact_paths, load_active
from app.ml.team_success.predict import predict_success
from app.ml.team_success.schemas import FEATURES, LIMITATIONS
from app.services.authorization import access_role, settings_enforce
from app.services.team_builder import (
    _alias_map,
    _audit,
    _capacity_status,
    _capacity_tables,
    _employees,
    _loads,
    _now,
    _parse_date,
    ensure_schema as ensure_builder_schema,
    option_detail,
    run_detail,
)
from app.ml.skill_fit.predict import score_roster
from app.services.team_builder_engine import evaluate_roster

TEAM_TYPES = (
    "Project Team",
    "Product Development Team",
    "Data and AI Team",
    "Software Engineering Team",
    "Research and Innovation Team",
    "Cross-Functional Team",
    "Operations and Support Team",
    "Crisis Response Team",
    "Temporary Task Force",
)

_SQLITE = [
    """CREATE TABLE IF NOT EXISTS workforce_teams (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, objective TEXT, team_type TEXT, project_type TEXT,
        origin TEXT NOT NULL, creator_id TEXT NOT NULL, owner_id TEXT NOT NULL, leader_id TEXT,
        project_id TEXT, project_name TEXT, headcount INTEGER NOT NULL, allocation_pct INTEGER NOT NULL,
        start_date TEXT, end_date TEXT, skills_json TEXT NOT NULL, roles_json TEXT NOT NULL, context TEXT,
        registration_status TEXT NOT NULL, operational_status TEXT NOT NULL, option_id TEXT,
        decision_note TEXT, decided_by TEXT, decided_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS workforce_team_members (
        id TEXT PRIMARY KEY, team_id TEXT NOT NULL, employee_id TEXT NOT NULL, member_role TEXT NOT NULL,
        membership_status TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS workforce_team_invitations (
        id TEXT PRIMARY KEY, team_id TEXT NOT NULL, employee_id TEXT NOT NULL, invited_by TEXT NOT NULL,
        status TEXT NOT NULL, created_at TEXT NOT NULL, responded_at TEXT)""",
    """CREATE TABLE IF NOT EXISTS team_success_predictions (
        id TEXT PRIMARY KEY, team_id TEXT, option_id TEXT, run_id TEXT, roster_fingerprint TEXT NOT NULL,
        probability REAL, status TEXT NOT NULL, model_version TEXT, model_type TEXT, training_data_type TEXT,
        feature_schema TEXT, features_json TEXT NOT NULL, notes_json TEXT NOT NULL, warning TEXT,
        evaluated_by TEXT, created_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS project_outcomes (
        id TEXT PRIMARY KEY, project_id TEXT, project_name TEXT NOT NULL, team_id TEXT,
        outcome_label TEXT NOT NULL, definition TEXT NOT NULL, acceptance_status TEXT,
        planned_end TEXT, actual_end TEXT, recorded_by TEXT NOT NULL, verified INTEGER NOT NULL,
        recorded_at TEXT NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS workforce_join_requests (
        id TEXT PRIMARY KEY, team_id TEXT NOT NULL, option_id TEXT, employee_id TEXT NOT NULL,
        note TEXT, status TEXT NOT NULL, decided_by TEXT, decided_at TEXT, created_at TEXT NOT NULL)""",
]

_FABRIC = [
    """IF OBJECT_ID(N'dbo.workforce_teams', N'U') IS NULL CREATE TABLE [dbo].[workforce_teams] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [name] NVARCHAR(200) NOT NULL, [description] NVARCHAR(MAX), [objective] NVARCHAR(MAX),
        [team_type] NVARCHAR(120), [project_type] NVARCHAR(200), [origin] NVARCHAR(40) NOT NULL, [creator_id] NVARCHAR(400) NOT NULL, [owner_id] NVARCHAR(400) NOT NULL,
        [leader_id] NVARCHAR(400), [project_id] NVARCHAR(400), [project_name] NVARCHAR(400), [headcount] INT NOT NULL,
        [allocation_pct] INT NOT NULL, [start_date] NVARCHAR(40), [end_date] NVARCHAR(40), [skills_json] NVARCHAR(MAX) NOT NULL,
        [roles_json] NVARCHAR(MAX) NOT NULL, [context] NVARCHAR(MAX), [registration_status] NVARCHAR(40) NOT NULL,
        [operational_status] NVARCHAR(40) NOT NULL, [option_id] NVARCHAR(80), [decision_note] NVARCHAR(MAX),
        [decided_by] NVARCHAR(200), [decided_at] NVARCHAR(40), [created_at] NVARCHAR(40) NOT NULL, [updated_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.workforce_team_members', N'U') IS NULL CREATE TABLE [dbo].[workforce_team_members] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [team_id] NVARCHAR(80) NOT NULL, [employee_id] NVARCHAR(400) NOT NULL,
        [member_role] NVARCHAR(40) NOT NULL, [membership_status] NVARCHAR(40) NOT NULL, [source] NVARCHAR(40) NOT NULL,
        [created_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.workforce_team_invitations', N'U') IS NULL CREATE TABLE [dbo].[workforce_team_invitations] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [team_id] NVARCHAR(80) NOT NULL, [employee_id] NVARCHAR(400) NOT NULL,
        [invited_by] NVARCHAR(400) NOT NULL, [status] NVARCHAR(40) NOT NULL, [created_at] NVARCHAR(40) NOT NULL, [responded_at] NVARCHAR(40))""",
    """IF OBJECT_ID(N'dbo.team_success_predictions', N'U') IS NULL CREATE TABLE [dbo].[team_success_predictions] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [team_id] NVARCHAR(80), [option_id] NVARCHAR(80), [run_id] NVARCHAR(80),
        [roster_fingerprint] NVARCHAR(MAX) NOT NULL, [probability] FLOAT, [status] NVARCHAR(40) NOT NULL, [model_version] NVARCHAR(120),
        [model_type] NVARCHAR(80), [training_data_type] NVARCHAR(40), [feature_schema] NVARCHAR(80), [features_json] NVARCHAR(MAX) NOT NULL,
        [notes_json] NVARCHAR(MAX) NOT NULL, [warning] NVARCHAR(MAX), [evaluated_by] NVARCHAR(200), [created_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.project_outcomes', N'U') IS NULL CREATE TABLE [dbo].[project_outcomes] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [project_id] NVARCHAR(400), [project_name] NVARCHAR(400) NOT NULL, [team_id] NVARCHAR(80),
        [outcome_label] NVARCHAR(40) NOT NULL, [definition] NVARCHAR(MAX) NOT NULL, [acceptance_status] NVARCHAR(80),
        [planned_end] NVARCHAR(40), [actual_end] NVARCHAR(40),         [recorded_by] NVARCHAR(200) NOT NULL, [verified] INT NOT NULL,
        [recorded_at] NVARCHAR(40) NOT NULL)""",
    """IF OBJECT_ID(N'dbo.workforce_join_requests', N'U') IS NULL CREATE TABLE [dbo].[workforce_join_requests] (
        [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [team_id] NVARCHAR(80) NOT NULL, [option_id] NVARCHAR(80),
        [employee_id] NVARCHAR(400) NOT NULL, [note] NVARCHAR(MAX), [status] NVARCHAR(40) NOT NULL,
        [decided_by] NVARCHAR(200), [decided_at] NVARCHAR(40), [created_at] NVARCHAR(40) NOT NULL)""",
]

_READY = False


def ensure_schema(db: Client) -> None:
    global _READY
    ensure_builder_schema(db)
    if _READY:
        return
    for statement in _SQLITE if db.db.dialect == "sqlite" else _FABRIC:
        db.db.execute(statement)
    for name, table, columns in (
        ("ux_wt_member", "workforce_team_members", "(team_id, employee_id)"),
        ("ux_wt_invite_pending", "workforce_team_invitations", "(team_id, employee_id, status)"),
        ("ux_wt_join_status", "workforce_join_requests", "(team_id, employee_id, status)"),
    ):
        sql = (
            f"CREATE UNIQUE INDEX IF NOT EXISTS {name} ON {table} {columns}"
            if db.db.dialect == "sqlite"
            else f"IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'{name}') CREATE UNIQUE INDEX [{name}] ON [dbo].[{table}] {columns.replace('(', '([').replace(')', '])').replace(', ', '], [')}"
        )
        try:
            db.db.execute(sql)
        except Exception:
            continue
    _READY = True


def _user(actor: dict | None) -> dict:
    if not actor or not actor.get("id"):
        raise HTTPException(status_code=401, detail="Sign in to manage teams.")
    return actor


def _label(actor: dict) -> str:
    return actor.get("full_name") or actor.get("email") or str(actor.get("id"))


def _hr(actor: dict) -> bool:
    return access_role(actor) in {"hr", "employer", "admin"}


def _manages(db: Client, actor: dict, employee_id: str) -> bool:
    rows = db.table("employees").select("manager_id").eq("id", employee_id).limit(1).execute().data or []
    return bool(rows) and str(rows[0].get("manager_id") or "") == str(actor.get("id"))


def _can_decide(db: Client, actor: dict, team: dict) -> bool:
    if str(actor.get("id")) == str(team.get("creator_id")):
        return False
    if _hr(actor):
        return True
    return _manages(db, actor, str(team.get("creator_id")))


def _can_edit(db: Client, actor: dict, team: dict) -> bool:
    if str(actor.get("id")) in {str(team.get("creator_id")), str(team.get("owner_id")), str(team.get("leader_id") or "")}:
        return True
    if _hr(actor):
        return True
    return _manages(db, actor, str(team.get("creator_id")))


def _participates(actor: dict, team: dict, members: list[dict], invites: list[dict]) -> bool:
    user_id = str(actor.get("id"))
    if user_id in {str(team.get("creator_id")), str(team.get("owner_id")), str(team.get("leader_id") or "")}:
        return True
    if any(str(row.get("employee_id")) == user_id and row.get("membership_status") != "removed" for row in members):
        return True
    return any(str(row.get("employee_id")) == user_id and row.get("status") == "pending" for row in invites)


def _team_row(db: Client, team_id: str) -> dict:
    rows = db.table("workforce_teams").select("*").eq("id", team_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Team not found.")
    return rows[0]


def _members(db: Client, team_id: str) -> list[dict]:
    return db.table("workforce_team_members").select("*").eq("team_id", team_id).execute().data or []


def _invites(db: Client, team_id: str) -> list[dict]:
    return db.table("workforce_team_invitations").select("*").eq("team_id", team_id).execute().data or []


def _visible(db: Client, actor: dict, team: dict, members: list[dict], invites: list[dict]) -> bool:
    if _participates(actor, team, members, invites):
        return True
    if _hr(actor):
        return True
    return _manages(db, actor, str(team.get("creator_id")))


def _names(db: Client) -> dict[str, dict]:
    people = db.table("employees").select("id, full_name, role, department").execute().data or []
    return {str(person["id"]): person for person in people}


def _fingerprint(members: list[dict]) -> str:
    confirmed = sorted(str(row["employee_id"]) for row in members if row.get("membership_status") == "confirmed")
    return ",".join(confirmed)


def _view(db: Client, team: dict, actor: dict | None = None) -> dict[str, Any]:
    members = _members(db, team["id"])
    invites = _invites(db, team["id"])
    directory = _names(db)
    predictions = db.table("team_success_predictions").select("*").eq("team_id", team["id"]).execute().data or []
    predictions.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    current = _fingerprint(members)
    latest = _prediction_view(predictions[0], current) if predictions else None
    return {
        "id": team["id"],
        "name": team["name"],
        "description": team.get("description"),
        "objective": team.get("objective"),
        "team_type": team.get("team_type"),
        "project_type": team.get("project_type"),
        "origin": team.get("origin"),
        "creator_id": team.get("creator_id"),
        "owner_id": team.get("owner_id"),
        "leader_id": team.get("leader_id"),
        "project_id": team.get("project_id"),
        "project_name": team.get("project_name"),
        "headcount": team.get("headcount"),
        "allocation_pct": team.get("allocation_pct"),
        "start_date": team.get("start_date"),
        "end_date": team.get("end_date"),
        "skills": _loads(team.get("skills_json"), []),
        "roles": _loads(team.get("roles_json"), []),
        "context": team.get("context"),
        "registration_status": team.get("registration_status"),
        "operational_status": team.get("operational_status"),
        "decision_note": team.get("decision_note"),
        "decided_by": team.get("decided_by"),
        "can_decide": bool(actor and _can_decide(db, actor, team) and team.get("registration_status") == "pending_approval"),
        "members": [_member_view(row, directory) for row in members if row.get("membership_status") != "removed"],
        "invitations": [_invite_view(row, directory) for row in invites],
        "prediction": latest,
        "created_at": team.get("created_at"),
        "updated_at": team.get("updated_at"),
    }


def _member_view(row: dict, directory: dict[str, dict]) -> dict:
    person = directory.get(str(row.get("employee_id")), {})
    return {
        "employee_id": row.get("employee_id"),
        "full_name": person.get("full_name"),
        "role": person.get("role"),
        "department": person.get("department"),
        "member_role": row.get("member_role"),
        "membership_status": row.get("membership_status"),
        "source": row.get("source"),
    }


def _invite_view(row: dict, directory: dict[str, dict]) -> dict:
    person = directory.get(str(row.get("employee_id")), {})
    return {
        "id": row.get("id"),
        "team_id": row.get("team_id"),
        "employee_id": row.get("employee_id"),
        "full_name": person.get("full_name"),
        "role": person.get("role"),
        "department": person.get("department"),
        "status": row.get("status"),
        "created_at": row.get("created_at"),
        "responded_at": row.get("responded_at"),
    }


def _prediction_view(row: dict, current_fingerprint: str | None) -> dict:
    notes = _loads(row.get("notes_json"), {})
    probability = row.get("probability")
    if row.get("status") != "ok" or probability is None:
        label = "Prediction unavailable"
    else:
        percent = round(float(probability) * 100)
        label = f"{percent}% demo estimate" if row.get("training_data_type") != "historical" else f"{percent}% estimated"
    return {
        "id": row.get("id"),
        "status": row.get("status"),
        "probability": probability,
        "display_label": label,
        "model_version": row.get("model_version"),
        "model_type": row.get("model_type"),
        "training_data_type": row.get("training_data_type"),
        "feature_schema": row.get("feature_schema"),
        "warning": row.get("warning"),
        "strengths": notes.get("strengths") or [],
        "risks": notes.get("risks") or [],
        "missing": notes.get("missing") or [],
        "stale": current_fingerprint is not None and row.get("roster_fingerprint") != current_fingerprint,
        "created_at": row.get("created_at"),
        "production_validated": False,
    }


def _skills(payload: dict) -> list[dict]:
    skills = []
    for item in payload.get("skills") or []:
        name = str(item.get("name") or "").strip()
        priority = str(item.get("priority") or "important")
        if name and priority in {"mandatory", "important", "optional"}:
            skills.append({"name": name, "priority": priority})
    return skills


def _origin_for(actor: dict) -> str:
    if _hr(actor):
        return "hr_created"
    if access_role(actor) == "manager":
        return "manager_created"
    return "employee_self_service"


def create_team(db: Client, payload: dict, actor: dict | None, allow_optimizer: bool = False) -> dict:
    ensure_schema(db)
    user = _user(actor)
    name = str(payload.get("name") or "").strip()
    if len(name) < 3:
        raise HTTPException(status_code=400, detail="Give the team a name of at least 3 characters.")
    team_type = str(payload.get("team_type") or TEAM_TYPES[0])
    if team_type not in TEAM_TYPES:
        raise HTTPException(status_code=400, detail="Choose a team type from the list.")
    try:
        headcount = int(payload.get("headcount") or 2)
        allocation = int(payload.get("allocation_pct") or 40)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Team size and allocation must be numbers.")
    if headcount < 2 or headcount > 10:
        raise HTTPException(status_code=400, detail="Team size must be from 2 to 10.")
    if allocation < 10 or allocation > 100:
        raise HTTPException(status_code=400, detail="Allocation must be from 10 to 100.")
    now = _now()
    team_id = str(uuid.uuid4())
    origin = "optimizer_generated" if allow_optimizer else _origin_for(user)
    with db.transaction():
        db.table("workforce_teams").insert({
            "id": team_id,
            "name": name[:200],
            "description": (payload.get("description") or "")[:1000] or None,
            "objective": (payload.get("objective") or "")[:1000] or None,
            "team_type": team_type,
            "project_type": (payload.get("project_type") or "")[:200] or None,
            "origin": origin,
            "creator_id": user["id"],
            "owner_id": user["id"],
            "leader_id": payload.get("leader_id") or user["id"],
            "project_id": payload.get("project_id") or None,
            "project_name": (payload.get("project_name") or "")[:400] or None,
            "headcount": headcount,
            "allocation_pct": allocation,
            "start_date": _parse_date(payload.get("start_date")),
            "end_date": _parse_date(payload.get("end_date")),
            "skills_json": json.dumps(_skills(payload)),
            "roles_json": json.dumps([str(role).strip() for role in (payload.get("roles") or []) if str(role).strip()]),
            "context": (payload.get("context") or "")[:2000] or None,
            "registration_status": "draft",
            "operational_status": "forming",
            "option_id": payload.get("option_id"),
            "created_at": now,
            "updated_at": now,
        }).execute()
        db.table("workforce_team_members").insert({
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "employee_id": user["id"],
            "member_role": "owner",
            "membership_status": "confirmed",
            "source": "creator",
            "created_at": now,
        }).execute()
        _audit(db, "team", team_id, "team_created", _label(user), origin)
    return _view(db, _team_row(db, team_id), user)


def update_team(db: Client, team_id: str, payload: dict, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _can_edit(db, user, team):
        raise HTTPException(status_code=403, detail="You cannot edit this team.")
    if team.get("registration_status") not in {"draft", "rejected"}:
        raise HTTPException(status_code=409, detail="Only a draft or a returned team can be edited.")
    changes: dict[str, Any] = {"updated_at": _now()}
    if payload.get("name"):
        changes["name"] = str(payload["name"]).strip()[:200]
    if "description" in payload:
        changes["description"] = (payload.get("description") or "")[:1000] or None
    if "objective" in payload:
        changes["objective"] = (payload.get("objective") or "")[:1000] or None
    if payload.get("team_type"):
        if payload["team_type"] not in TEAM_TYPES:
            raise HTTPException(status_code=400, detail="Choose a team type from the list.")
        changes["team_type"] = payload["team_type"]
    if "skills" in payload:
        changes["skills_json"] = json.dumps(_skills(payload))
    if "roles" in payload:
        changes["roles_json"] = json.dumps([str(role).strip() for role in payload.get("roles") or [] if str(role).strip()])
    if "context" in payload:
        changes["context"] = (payload.get("context") or "")[:2000] or None
    if "project_name" in payload:
        changes["project_name"] = (payload.get("project_name") or "")[:400] or None
    if "project_id" in payload:
        changes["project_id"] = payload.get("project_id") or None
    for field in ("headcount", "allocation_pct"):
        if payload.get(field) is not None:
            changes[field] = int(payload[field])
    for field in ("start_date", "end_date"):
        if field in payload:
            changes[field] = _parse_date(payload.get(field))
    if team.get("registration_status") == "rejected":
        changes["registration_status"] = "draft"
    db.table("workforce_teams").update(changes).eq("id", team_id).execute()
    _audit(db, "team", team_id, "team_updated", _label(user), "")
    return _view(db, _team_row(db, team_id), user)


def list_workspace(db: Client, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    directory = _names(db)
    teams = []
    review = []
    for team in db.table("workforce_teams").select("*").execute().data or []:
        members = _members(db, team["id"])
        invites = _invites(db, team["id"])
        if team.get("registration_status") == "archived":
            if not _participates(user, team, members, invites):
                continue
        view = _view(db, team, user)
        if _participates(user, team, members, invites):
            teams.append(view)
        if view["can_decide"]:
            review.append(view)
    incoming = []
    for row in db.table("workforce_team_invitations").select("*").eq("employee_id", user["id"]).eq("status", "pending").execute().data or []:
        team = _team_row(db, row["team_id"])
        incoming.append({**_invite_view(row, directory), "team_name": team.get("name")})
    outgoing = []
    for row in db.table("workforce_team_invitations").select("*").eq("invited_by", user["id"]).eq("status", "pending").execute().data or []:
        team = _team_row(db, row["team_id"])
        outgoing.append({**_invite_view(row, directory), "team_name": team.get("name")})
    join_requests = _join_lists(db, user, directory)
    return {
        "teams": teams,
        "incoming": incoming,
        "outgoing": outgoing,
        "review": review,
        "join_requests": join_requests["mine"],
        "join_reviews": join_requests["review"],
        "team_types": list(TEAM_TYPES),
        "registration_policy": "A team stays pending until HR or the creator's manager approves it. The creator cannot approve their own team.",
        "can_review": _hr(user) or access_role(user) == "manager" or bool(review),
        "model": model_status(),
    }


def get_team(db: Client, team_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _visible(db, user, team, _members(db, team_id), _invites(db, team_id)):
        raise HTTPException(status_code=403, detail="You cannot view this team.")
    return _view(db, team, user)


def invite(db: Client, team_id: str, employee_ids: list[str], actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _can_edit(db, user, team):
        raise HTTPException(status_code=403, detail="You cannot invite people to this team.")
    if team.get("registration_status") in {"archived", "registered"} and team.get("operational_status") in {"assigned", "active", "completed"}:
        raise HTTPException(status_code=409, detail="This team is no longer open for invitations.")
    now = _now()
    existing_members = {str(row["employee_id"]) for row in _members(db, team_id) if row.get("membership_status") != "removed"}
    pending = {
        str(row["employee_id"])
        for row in _invites(db, team_id)
        if row.get("status") == "pending"
    }
    invited: list[str] = []
    already: list[str] = []
    problems: list[str] = []
    with db.transaction():
        for raw_id in employee_ids:
            employee_id = str(raw_id or "").strip()
            people = db.table("employees").select("id, full_name").eq("id", employee_id).limit(1).execute().data or [] if employee_id else []
            if not people:
                problems.append("That person is not in the workforce.")
                continue
            employee_id = str(people[0]["id"])
            person_name = people[0].get("full_name") or "That colleague"
            if employee_id == str(user.get("id")):
                problems.append("You are already on this team.")
                continue
            if employee_id in existing_members:
                problems.append(f"{person_name} is already on the team.")
                continue
            if employee_id in pending:
                already.append(person_name)
                continue
            db.table("workforce_team_invitations").insert({
                "id": str(uuid.uuid4()),
                "team_id": team_id,
                "employee_id": employee_id,
                "invited_by": user["id"],
                "status": "pending",
                "created_at": now,
            }).execute()
            pending.add(employee_id)
            invited.append(person_name)
        if invited:
            _audit(db, "team", team_id, "invitations_sent", _label(user), ", ".join(invited))
    if not invited and not already:
        raise HTTPException(status_code=400, detail=problems[0] if problems else "Choose a colleague to invite.")
    return _view(db, _team_row(db, team_id), user)


def respond(db: Client, invitation_id: str, accept: bool, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    rows = db.table("workforce_team_invitations").select("*").eq("id", invitation_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    invitation = rows[0]
    if str(invitation.get("employee_id")) != str(user.get("id")):
        raise HTTPException(status_code=403, detail="Only the invited person can respond.")
    if invitation.get("status") != "pending":
        raise HTTPException(status_code=409, detail="This invitation is no longer pending.")
    now = _now()
    status = "accepted" if accept else "declined"
    with db.transaction():
        db.table("workforce_team_invitations").update({"status": status, "responded_at": now}).eq("id", invitation_id).execute()
        if accept:
            current = [row for row in _members(db, invitation["team_id"]) if str(row["employee_id"]) == str(user["id"])]
            if current:
                db.table("workforce_team_members").update({
                    "membership_status": "confirmed",
                    "source": "invitation",
                    "member_role": current[0].get("member_role") or "member",
                }).eq("id", current[0]["id"]).execute()
            else:
                db.table("workforce_team_members").insert({
                    "id": str(uuid.uuid4()),
                    "team_id": invitation["team_id"],
                    "employee_id": user["id"],
                    "member_role": "member",
                    "membership_status": "confirmed",
                    "source": "invitation",
                    "created_at": now,
                }).execute()
        _audit(db, "invitation", invitation_id, status, _label(user), invitation["team_id"])
    return _view(db, _team_row(db, invitation["team_id"]), user)


def cancel_invitation(db: Client, invitation_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    rows = db.table("workforce_team_invitations").select("*").eq("id", invitation_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    invitation = rows[0]
    team = _team_row(db, invitation["team_id"])
    if not _can_edit(db, user, team):
        raise HTTPException(status_code=403, detail="You cannot cancel this invitation.")
    if invitation.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Only a pending invitation can be cancelled.")
    db.table("workforce_team_invitations").update({"status": "cancelled", "responded_at": _now()}).eq("id", invitation_id).execute()
    _audit(db, "invitation", invitation_id, "cancelled", _label(user), "")
    return get_team(db, invitation["team_id"], user)


def remove_member(db: Client, team_id: str, employee_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _can_edit(db, user, team):
        raise HTTPException(status_code=403, detail="You cannot change this roster.")
    if str(employee_id) == str(team.get("creator_id")):
        raise HTTPException(status_code=409, detail="The creator stays on the team.")
    if team.get("operational_status") in {"assigned", "active", "completed"} and not _can_decide(db, user, team):
        raise HTTPException(status_code=409, detail="An assigned roster can be changed only by a reviewer.")
    rows = [row for row in _members(db, team_id) if str(row["employee_id"]) == str(employee_id)]
    if not rows:
        raise HTTPException(status_code=404, detail="That person is not on the team.")
    db.table("workforce_team_members").update({"membership_status": "removed"}).eq("id", rows[0]["id"]).execute()
    _audit(db, "team", team_id, "member_removed", _label(user), employee_id)
    return get_team(db, team_id, user)


def assign_member(db: Client, team_id: str, employee_id: str, actor: dict | None) -> dict:
    """Authorised reviewers may place someone directly. The assignment is audited."""
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not (_hr(user) or _manages(db, user, employee_id) or _manages(db, user, str(team.get("creator_id")))):
        raise HTTPException(status_code=403, detail="Only HR or the person's manager can assign a member directly.")
    people = db.table("employees").select("id").eq("id", employee_id).limit(1).execute().data or []
    if not people:
        raise HTTPException(status_code=400, detail="That employee is not in the database.")
    now = _now()
    current = [row for row in _members(db, team_id) if str(row["employee_id"]) == str(employee_id)]
    if current and current[0].get("membership_status") == "confirmed":
        return get_team(db, team_id, user)
    with db.transaction():
        if current:
            db.table("workforce_team_members").update({
                "membership_status": "confirmed",
                "source": "hr_assignment",
            }).eq("id", current[0]["id"]).execute()
        else:
            db.table("workforce_team_members").insert({
                "id": str(uuid.uuid4()),
                "team_id": team_id,
                "employee_id": employee_id,
                "member_role": "member",
                "membership_status": "confirmed",
                "source": "hr_assignment",
                "created_at": now,
            }).execute()
        _audit(db, "team", team_id, "member_assigned", _label(user), employee_id)
    return get_team(db, team_id, user)


def submit_team(db: Client, team_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if str(user.get("id")) not in {str(team.get("creator_id")), str(team.get("owner_id"))} and not _hr(user):
        raise HTTPException(status_code=403, detail="Only the owner can submit this team.")
    if team.get("registration_status") == "pending_approval":
        return get_team(db, team_id, user)
    if team.get("registration_status") not in {"draft", "rejected"}:
        raise HTTPException(status_code=409, detail="This team is not waiting to be submitted.")
    confirmed = [row for row in _members(db, team_id) if row.get("membership_status") == "confirmed"]
    if len(confirmed) < 1:
        raise HTTPException(status_code=400, detail="The team needs its owner before it can be submitted.")
    now = _now()
    db.table("workforce_teams").update({
        "registration_status": "pending_approval",
        "operational_status": "forming",
        "updated_at": now,
    }).eq("id", team_id).execute()
    _audit(db, "team", team_id, "submitted", _label(user), "pending_approval")
    return get_team(db, team_id, user)


def decide(db: Client, team_id: str, approve: bool, note: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _can_decide(db, user, team):
        raise HTTPException(status_code=403, detail="Only HR or the creator's manager can decide this registration.")
    if team.get("registration_status") != "pending_approval":
        raise HTTPException(status_code=409, detail="Only a pending registration can be decided.")
    now = _now()
    status = "registered" if approve else "rejected"
    operational = "ready" if approve else "forming"
    db.table("workforce_teams").update({
        "registration_status": status,
        "operational_status": operational,
        "decision_note": (note or "")[:1000] or None,
        "decided_by": _label(user),
        "decided_at": now,
        "updated_at": now,
    }).eq("id", team_id).execute()
    _audit(db, "team", team_id, status, _label(user), note or "")
    return get_team(db, team_id, user)


def assign_project(db: Client, team_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _can_decide(db, user, team):
        raise HTTPException(status_code=403, detail="Only HR or the creator's manager can assign a registered team.")
    if team.get("registration_status") != "registered":
        raise HTTPException(status_code=409, detail="Register the team before assigning it to a project.")
    if team.get("operational_status") == "assigned":
        return get_team(db, team_id, user)
    now = _now()
    confirmed = [row for row in _members(db, team_id) if row.get("membership_status") == "confirmed"]
    project_name = team.get("project_name") or team.get("name")
    with db.transaction():
        for member in confirmed:
            existing = db.table("team_builder_assignments").select("id").eq("option_id", team_id).eq("employee_id", member["employee_id"]).execute().data or []
            if existing:
                continue
            db.table("team_builder_assignments").insert({
                "id": str(uuid.uuid4()),
                "option_id": team_id,
                "request_id": team_id,
                "employee_id": member["employee_id"],
                "project_id": team.get("project_id"),
                "project_name": project_name,
                "role_title": member.get("member_role"),
                "allocation_pct": int(team.get("allocation_pct") or 40),
                "start_date": team.get("start_date"),
                "end_date": team.get("end_date"),
                "status": "active",
                "assembled_by": _label(user),
                "assembled_at": now,
            }).execute()
        db.table("workforce_teams").update({
            "operational_status": "assigned",
            "updated_at": now,
        }).eq("id", team_id).execute()
        _audit(db, "team", team_id, "assigned", _label(user), project_name)
    return get_team(db, team_id, user)


def archive_team(db: Client, team_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if not _can_edit(db, user, team):
        raise HTTPException(status_code=403, detail="You cannot archive this team.")
    if team.get("operational_status") == "assigned" and not _can_decide(db, user, team):
        raise HTTPException(status_code=409, detail="A reviewer closes an assigned team.")
    db.table("workforce_teams").update({
        "registration_status": "archived",
        "operational_status": "disbanded",
        "updated_at": _now(),
    }).eq("id", team_id).execute()
    _audit(db, "team", team_id, "archived", _label(user), "")
    return get_team(db, team_id, user)


def _roster_people(db: Client, team: dict, members: list[dict]) -> list[dict]:
    confirmed = {str(row["employee_id"]) for row in members if row.get("membership_status") == "confirmed"}
    people = [person for person in _employees(db) if str(person["id"]) in confirmed]
    windows, bookings = _capacity_tables(db)
    for person in people:
        status, _remaining = _capacity_status(
            str(person["id"]), team.get("start_date"), team.get("end_date"), int(team.get("allocation_pct") or 40), windows, bookings,
        )
        person["capacity_status"] = status
    return people


def _store_prediction(
    db: Client,
    *,
    team_id: str | None,
    option_id: str | None,
    run_id: str | None,
    fingerprint: str,
    features: dict,
    notes: dict,
    scored: dict,
    actor: dict | None,
) -> dict:
    row_id = str(uuid.uuid4())
    db.table("team_success_predictions").insert({
        "id": row_id,
        "team_id": team_id,
        "option_id": option_id,
        "run_id": run_id,
        "roster_fingerprint": fingerprint,
        "probability": scored.get("probability"),
        "status": scored.get("status"),
        "model_version": scored.get("model_version"),
        "model_type": scored.get("model_type"),
        "training_data_type": scored.get("training_data_type"),
        "feature_schema": scored.get("feature_schema"),
        "features_json": json.dumps(features),
        "notes_json": json.dumps(notes),
        "warning": scored.get("warning"),
        "evaluated_by": _label(actor) if actor else None,
        "created_at": _now(),
    }).execute()
    stored = db.table("team_success_predictions").select("*").eq("id", row_id).limit(1).execute().data or []
    return _prediction_view(stored[0], fingerprint)


def evaluate_team(db: Client, team_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    team = get_team(db, team_id, user)
    raw = _team_row(db, team_id)
    members = _members(db, team_id)
    people = _roster_people(db, raw, members)
    if not people:
        raise HTTPException(status_code=400, detail="Confirm at least one member before evaluating the team.")
    skills = team["skills"]
    aliases = _alias_map(db)
    evaluation = evaluate_roster(people, skills, team["roles"], aliases, int(raw.get("headcount") or len(people)))
    features = build_features(evaluation["metrics"], evaluation["uncovered"], evaluation["members"], raw.get("project_type") or raw.get("team_type"))
    scored = predict_success(features)
    notes = evaluation_notes(evaluation["metrics"], evaluation["uncovered"], evaluation["members"])
    pending = [row for row in team["invitations"] if row["status"] == "pending"]
    if pending:
        notes["missing"].append(f"{len(pending)} invitation{'s are' if len(pending) != 1 else ' is'} still unanswered, so those people are not confirmed members.")
    prediction = _store_prediction(
        db,
        team_id=team_id,
        option_id=raw.get("option_id"),
        run_id=None,
        fingerprint=_fingerprint(members),
        features=features,
        notes=notes,
        scored=scored,
        actor=user,
    )
    _audit(db, "team", team_id, "evaluated", _label(user), prediction["status"])
    fresh = get_team(db, team_id, user)
    fresh["evaluation"] = {
        "feasibility": evaluation["feasibility"],
        "metrics": evaluation["metrics"],
        "uncovered": evaluation["uncovered"],
        "warnings": evaluation["warnings"],
        "members": evaluation["members"],
    }
    fresh["prediction"] = prediction
    return fresh


def predict_options(db: Client, run: dict, actor: dict | None) -> dict:
    ensure_schema(db)
    project_type = (run.get("request") or {}).get("project_type")
    for option in run.get("options") or []:
        metrics = option.get("metrics") or {}
        features = build_features(metrics, option.get("uncovered") or [], option.get("members") or [], project_type)
        scored = predict_success(features)
        notes = evaluation_notes(metrics, option.get("uncovered") or [], option.get("members") or [])
        fingerprint = ",".join(sorted(str(member["employee_id"]) for member in option.get("members") or []))
        option["prediction"] = _store_prediction(
            db,
            team_id=None,
            option_id=option.get("id"),
            run_id=run.get("run_id"),
            fingerprint=fingerprint,
            features=features,
            notes=notes,
            scored=scored,
            actor=actor if actor and actor.get("id") else None,
        )
    return run


def _join_view(db: Client, row: dict, directory: dict[str, dict], team: dict, actor: dict) -> dict:
    person = directory.get(str(row.get("employee_id")), {})
    return {
        "id": row.get("id"),
        "team_id": row.get("team_id"),
        "team_name": team.get("name"),
        "option_id": row.get("option_id"),
        "employee_id": row.get("employee_id"),
        "full_name": person.get("full_name"),
        "role": person.get("role"),
        "department": person.get("department"),
        "status": row.get("status"),
        "note": row.get("note"),
        "created_at": row.get("created_at"),
        "can_decide": _can_respond_join(db, actor, team, row),
    }


def _can_respond_join(db: Client, actor: dict, team: dict, request: dict) -> bool:
    if request.get("status") != "pending":
        return False
    if str(actor.get("id")) == str(request.get("employee_id")):
        return False
    if str(actor.get("id")) in {str(team.get("owner_id")), str(team.get("leader_id") or "")}:
        return True
    return _can_decide(db, actor, team)


def _join_lists(db: Client, user: dict, directory: dict[str, dict]) -> dict:
    rows = db.table("workforce_join_requests").select("*").execute().data or []
    mine = []
    review = []
    for row in rows:
        try:
            team = _team_row(db, row["team_id"])
        except HTTPException:
            continue
        view = _join_view(db, row, directory, team, user)
        if str(row.get("employee_id")) == str(user.get("id")):
            mine.append(view)
        elif view["can_decide"]:
            review.append(view)
    mine.sort(key=lambda item: str(item.get("created_at") or ""), reverse=True)
    review.sort(key=lambda item: str(item.get("created_at") or ""), reverse=True)
    return {"mine": mine, "review": review}


def _team_for_option(db: Client, option_id: str, asker_id: str) -> dict:
    existing = db.table("workforce_teams").select("*").eq("option_id", option_id).execute().data or []
    if existing:
        return existing[0]
    option = option_detail(db, option_id)
    runs = db.table("org_team_builder_options").select("run_id").eq("id", option_id).limit(1).execute().data or []
    request = {}
    if runs and runs[0].get("run_id"):
        request = run_detail(db, runs[0]["run_id"]).get("request") or {}
    member_ids = [str(member["employee_id"]) for member in option.get("members") or []]
    owner_id = next((member_id for member_id in member_ids if member_id != str(asker_id)), None) or str(asker_id)
    now = _now()
    team_id = str(uuid.uuid4())
    name = option.get("name") or request.get("project_name") or "Recommended team"
    db.table("workforce_teams").insert({
        "id": team_id,
        "name": str(name)[:200],
        "description": None,
        "objective": request.get("objective"),
        "team_type": "Project Team",
        "project_type": request.get("project_type"),
        "origin": "optimizer_generated",
        "creator_id": owner_id,
        "owner_id": owner_id,
        "leader_id": owner_id,
        "project_id": request.get("project_id"),
        "project_name": request.get("project_name"),
        "headcount": int(request.get("headcount") or option.get("requested_headcount") or max(2, len(member_ids) or 2)),
        "allocation_pct": int(request.get("allocation_pct") or 40),
        "start_date": request.get("start_date"),
        "end_date": request.get("end_date"),
        "skills_json": json.dumps(request.get("skills") or []),
        "roles_json": json.dumps(request.get("roles") or []),
        "context": request.get("context"),
        "registration_status": "draft",
        "operational_status": "forming",
        "option_id": option_id,
        "created_at": now,
        "updated_at": now,
    }).execute()
    if owner_id != str(asker_id):
        db.table("workforce_team_members").insert({
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "employee_id": owner_id,
            "member_role": "owner",
            "membership_status": "confirmed",
            "source": "recommendation",
            "created_at": now,
        }).execute()
    _audit(db, "team", team_id, "team_opened_for_join", owner_id, option_id)
    return _team_row(db, team_id)


def _file_join(db: Client, team: dict, option_id: str | None, user: dict, note: str = "") -> dict:
    confirmed = [row for row in _members(db, team["id"]) if row.get("membership_status") == "confirmed" and str(row.get("employee_id")) == str(user["id"])]
    if confirmed:
        raise HTTPException(status_code=409, detail="You are already on this team.")
    pending = [
        row for row in db.table("workforce_join_requests").select("*").eq("team_id", team["id"]).eq("employee_id", user["id"]).eq("status", "pending").execute().data or []
    ]
    directory = _names(db)
    if pending:
        return _join_view(db, pending[0], directory, team, user)
    now = _now()
    row_id = str(uuid.uuid4())
    db.table("workforce_join_requests").insert({
        "id": row_id,
        "team_id": team["id"],
        "option_id": option_id,
        "employee_id": user["id"],
        "note": (note or "")[:500] or None,
        "status": "pending",
        "created_at": now,
    }).execute()
    _audit(db, "join_request", row_id, "join_requested", _label(user), team["id"])
    stored = db.table("workforce_join_requests").select("*").eq("id", row_id).limit(1).execute().data or []
    return _join_view(db, stored[0], directory, team, user)


def ask_to_join(db: Client, option_id: str, actor: dict | None, note: str = "") -> dict:
    """Ask to join a recommended team. This does not make the asker the owner or invite the roster."""
    ensure_schema(db)
    user = _user(actor)
    team = _team_for_option(db, option_id, str(user["id"]))
    return _file_join(db, team, option_id, user, note)


def ask_to_join_team(db: Client, team_id: str, actor: dict | None, note: str = "") -> dict:
    """Ask to join a team that already exists. Acceptance is still required from someone else."""
    ensure_schema(db)
    user = _user(actor)
    team = _team_row(db, team_id)
    if team.get("registration_status") == "archived" or team.get("operational_status") == "disbanded":
        raise HTTPException(status_code=409, detail="This team is closed.")
    return _file_join(db, team, team.get("option_id"), user, note)


def attach_existing_teams(db: Client, run: dict) -> dict:
    """Add saved teams whose confirmed members already cover skills or roles in this brief."""
    request = run.get("request") or {}
    requirements = request.get("skills") or []
    roles = request.get("roles") or []
    if not requirements and not roles:
        run["existing_teams"] = []
        return run
    aliases = _alias_map(db)
    requested = int(run.get("requested_headcount") or request.get("headcount") or 2)
    generated = {
        frozenset(str(member.get("employee_id")) for member in option.get("members") or [])
        for option in run.get("options") or []
    }
    matches = []
    for team in db.table("workforce_teams").select("*").execute().data or []:
        if team.get("registration_status") == "archived" or team.get("operational_status") == "disbanded":
            continue
        people = _roster_people(db, team, _members(db, team["id"]))
        if not people:
            continue
        roster = frozenset(str(person["id"]) for person in people)
        if roster in generated:
            continue
        evaluation = evaluate_roster(people, requirements, roles, aliases, requested)
        covered = len(requirements) - len(evaluation["uncovered"]) if requirements else 0
        role_hit = any(row.get("employee_id") for row in evaluation["roles"])
        if requirements and covered < 1:
            continue
        if not requirements and not role_hit:
            continue
        members = evaluation["members"]
        skill_model = score_roster(requirements, members)
        reason = (
            f"Existing team. {covered} of {len(requirements)} skills in this brief are already covered by the confirmed members."
            if requirements else
            "Existing team. A confirmed member already covers a role in this brief."
        )
        matches.append({
            "id": team["id"],
            "team_id": team["id"],
            "source": "existing",
            "name": team.get("name"),
            "strategy": "existing",
            "option_status": "existing",
            "feasibility": evaluation["feasibility"],
            "rationale": reason,
            "score_basis": "existing_team",
            "metrics": evaluation["metrics"],
            "warnings": evaluation["warnings"],
            "uncovered": evaluation["uncovered"],
            "roles": evaluation["roles"],
            "members": members,
            "assignments": [],
            "actual_headcount": evaluation["metrics"].get("actual_headcount"),
            "requested_headcount": requested,
            "skill_model": skill_model,
            "registration_status": team.get("registration_status"),
            "operational_status": team.get("operational_status"),
            "_score": skill_model.get("score") if skill_model.get("score") is not None else -1,
        })
    matches.sort(key=lambda item: (-int(item["_score"]), str(item.get("name") or "")))
    for item in matches:
        item.pop("_score", None)
    run["existing_teams"] = matches[:4]
    return run


def respond_join(db: Client, request_id: str, accept: bool, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    rows = db.table("workforce_join_requests").select("*").eq("id", request_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Join request not found.")
    request = rows[0]
    team = _team_row(db, request["team_id"])
    if str(user.get("id")) == str(request.get("employee_id")):
        raise HTTPException(status_code=403, detail="Someone else has to decide your request to join.")
    if not _can_respond_join(db, user, team, request):
        raise HTTPException(status_code=403, detail="You cannot decide this request to join.")
    if request.get("status") != "pending":
        raise HTTPException(status_code=409, detail="This request is no longer pending.")
    now = _now()
    status = "accepted" if accept else "declined"
    with db.transaction():
        db.table("workforce_join_requests").update({"status": status, "decided_by": _label(user), "decided_at": now}).eq("id", request_id).execute()
        if accept:
            current = [row for row in _members(db, team["id"]) if str(row["employee_id"]) == str(request["employee_id"])]
            if current:
                db.table("workforce_team_members").update({
                    "membership_status": "confirmed",
                    "source": "join_request",
                    "member_role": current[0].get("member_role") or "member",
                }).eq("id", current[0]["id"]).execute()
            else:
                db.table("workforce_team_members").insert({
                    "id": str(uuid.uuid4()),
                    "team_id": team["id"],
                    "employee_id": request["employee_id"],
                    "member_role": "member",
                    "membership_status": "confirmed",
                    "source": "join_request",
                    "created_at": now,
                }).execute()
        _audit(db, "join_request", request_id, status, _label(user), team["id"])
    directory = _names(db)
    stored = db.table("workforce_join_requests").select("*").eq("id", request_id).limit(1).execute().data or []
    return _join_view(db, stored[0], directory, team, user)


def cancel_join(db: Client, request_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    rows = db.table("workforce_join_requests").select("*").eq("id", request_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Join request not found.")
    request = rows[0]
    if str(request.get("employee_id")) != str(user.get("id")):
        raise HTTPException(status_code=403, detail="Only the person who asked can cancel this request.")
    if request.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Only a pending request can be cancelled.")
    db.table("workforce_join_requests").update({"status": "cancelled", "decided_at": _now(), "decided_by": _label(user)}).eq("id", request_id).execute()
    team = _team_row(db, request["team_id"])
    stored = db.table("workforce_join_requests").select("*").eq("id", request_id).limit(1).execute().data or []
    return _join_view(db, stored[0], _names(db), team, user)


def list_join_requests(db: Client, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    return _join_lists(db, user, _names(db))


def save_option_as_team(db: Client, option_id: str, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    option = option_detail(db, option_id)
    runs = db.table("org_team_builder_options").select("run_id").eq("id", option_id).limit(1).execute().data or []
    request = {}
    if runs and runs[0].get("run_id"):
        request = run_detail(db, runs[0]["run_id"]).get("request") or {}
    team = create_team(db, {
        "name": option.get("name") or request.get("project_name") or "Recommended team",
        "objective": request.get("objective"),
        "team_type": "Project Team",
        "project_type": request.get("project_type"),
        "project_id": request.get("project_id"),
        "project_name": request.get("project_name"),
        "headcount": request.get("headcount") or option.get("requested_headcount") or 2,
        "allocation_pct": request.get("allocation_pct") or 40,
        "start_date": request.get("start_date"),
        "end_date": request.get("end_date"),
        "skills": request.get("skills") or [],
        "roles": request.get("roles") or [],
        "context": request.get("context"),
        "option_id": option_id,
    }, user, allow_optimizer=True)
    others = [member["employee_id"] for member in option.get("members") or [] if str(member["employee_id"]) != str(user["id"])]
    if others:
        team = invite(db, team["id"], others, user)
    return team


def record_outcome(db: Client, payload: dict, actor: dict | None) -> dict:
    ensure_schema(db)
    user = _user(actor)
    if settings_enforce() and not (_hr(user) or access_role(user) == "manager"):
        raise HTTPException(status_code=403, detail="HR or a manager records a project outcome.")
    label = str(payload.get("outcome_label") or "")
    if label not in {"success", "not_success"}:
        raise HTTPException(status_code=400, detail="Record the outcome as success or not_success.")
    definition = str(payload.get("definition") or "").strip()
    if len(definition) < 10:
        raise HTTPException(status_code=400, detail="Describe the acceptance criteria used for this outcome.")
    row_id = str(uuid.uuid4())
    db.table("project_outcomes").insert({
        "id": row_id,
        "project_id": payload.get("project_id"),
        "project_name": str(payload.get("project_name") or "Project")[:400],
        "team_id": payload.get("team_id"),
        "outcome_label": label,
        "definition": definition[:2000],
        "acceptance_status": payload.get("acceptance_status"),
        "planned_end": _parse_date(payload.get("planned_end")),
        "actual_end": _parse_date(payload.get("actual_end")),
        "recorded_by": _label(user),
        "verified": 1 if payload.get("verified") else 0,
        "recorded_at": _now(),
    }).execute()
    _audit(db, "outcome", row_id, "outcome_recorded", _label(user), label)
    return {"id": row_id, "outcome_label": label, "verified": bool(payload.get("verified"))}


def predictions_for_team(db: Client, team_id: str, actor: dict | None) -> dict:
    team = get_team(db, team_id, actor)
    rows = db.table("team_success_predictions").select("*").eq("team_id", team_id).execute().data or []
    rows.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    current = _fingerprint(_members(db, team_id))
    return {"team_id": team_id, "predictions": [_prediction_view(row, current) for row in rows], "registration_status": team["registration_status"]}


def audit_for_team(db: Client, team_id: str, actor: dict | None) -> dict:
    get_team(db, team_id, actor)
    rows = db.table("team_builder_audit").select("*").eq("entity_id", team_id).execute().data or []
    rows.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    return {"events": rows}


def model_status() -> dict:
    loaded = load_active()
    model_path, meta_path = artifact_paths()
    if loaded is None:
        return {
            "available": False,
            "status": "Prediction unavailable",
            "warning": "The trained model artifact could not be loaded.",
            "production_validated": False,
            "features": list(FEATURES),
            "limitations": LIMITATIONS,
            "artifact": str(model_path.name),
        }
    _bundle, metadata = loaded
    return {
        "available": True,
        "version": metadata.get("version"),
        "model_type": metadata.get("model_type"),
        "training_data_type": metadata.get("training_data_type"),
        "trained_at": metadata.get("trained_at"),
        "feature_schema": metadata.get("feature_schema"),
        "features": metadata.get("features") or list(FEATURES),
        "validation": metadata.get("validation"),
        "test_metrics_not_used_for_selection": metadata.get("test_metrics_not_used_for_selection"),
        "selected_because": metadata.get("selected_because"),
        "class_balance": metadata.get("class_balance"),
        "status": metadata.get("status"),
        "production_validated": False,
        "warning": metadata.get("limitations") or LIMITATIONS,
        "limitations": metadata.get("limitations") or LIMITATIONS,
        "artifact": meta_path.name,
    }


def historical_retrain_ready(db: Client) -> dict:
    ensure_schema(db)
    rows = db.table("project_outcomes").select("*").eq("verified", 1).execute().data or []
    usable = []
    for outcome in rows:
        if not outcome.get("team_id"):
            continue
        predictions = db.table("team_success_predictions").select("*").eq("team_id", outcome["team_id"]).eq("status", "ok").execute().data or []
        predictions = [row for row in predictions if str(row.get("created_at") or "") <= str(outcome.get("recorded_at") or "")]
        if not predictions:
            continue
        predictions.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
        usable.append(outcome["id"])
    return {
        "verified_outcomes": len(rows),
        "usable_labeled_snapshots": len(usable),
        "minimum_required": 30,
        "ready": len(usable) >= 30,
        "note": "Verified outcomes are not mixed with synthetic labels. Retraining stays unavailable until 30 outcomes have a prediction snapshot from before the outcome was recorded.",
    }

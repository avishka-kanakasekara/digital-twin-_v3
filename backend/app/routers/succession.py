"""Succession & Knowledge Transfer API.

HR / Talent Mobility actions (register, slate, nominate, approve, plans) need an HR,
employer, or admin caller when authorization is enforced. Employees see only their own view.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database import get_db
from app.services import succession
from app.services.authorization import access_role, settings_enforce
from app.utils.auth import get_optional_employee

router = APIRouter(prefix="/api/succession", tags=["Succession & Knowledge Transfer"])

_PRIVILEGED = {"hr", "employer", "admin"}


def _label(actor: dict | None) -> str:
    if actor and actor.get("full_name"):
        return str(actor["full_name"])
    return "HR / Talent Mobility"


def _hr(actor: dict | None) -> str:
    if settings_enforce():
        if not actor:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if access_role(actor) not in _PRIVILEGED:
            raise HTTPException(status_code=403, detail="Only HR / Talent Mobility can do this.")
    return _label(actor)


def _manager_scope(actor: dict | None, manager_id: str | None) -> None:
    if not settings_enforce():
        return
    if not actor:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if access_role(actor) in _PRIVILEGED:
        return
    if not manager_id or str(actor.get("id")) != manager_id:
        raise HTTPException(status_code=403, detail="Managers see the roles they own.")


class Requirement(BaseModel):
    skill: str = Field(min_length=2, max_length=120)
    level: int = Field(ge=1, le=10)
    category: str | None = None
    why: str | None = None


class RoleCreate(BaseModel):
    role_title: str = Field(min_length=3, max_length=200)
    incumbent_employee_id: str = Field(min_length=1)
    department: str | None = None
    owner_manager_id: str | None = None
    is_business_critical: bool = False
    criticality_reason: str | None = None
    departure_risk: Literal["Low", "Medium", "High"] = "Medium"
    expected_departure_date: str | None = None
    requirements_source: Literal["incumbent", "market"] = "incumbent"
    requirements: list[Requirement] | None = None


class RoleUpdate(BaseModel):
    role_title: str | None = None
    incumbent_employee_id: str | None = None
    department: str | None = None
    owner_manager_id: str | None = None
    is_business_critical: bool | None = None
    criticality_reason: str | None = None
    departure_risk: Literal["Low", "Medium", "High"] | None = None
    expected_departure_date: str | None = None
    requirements: list[Requirement] | None = None


class DeriveBody(BaseModel):
    source: Literal["incumbent", "market"] = "incumbent"


class SlateBody(BaseModel):
    trigger: Literal["business_critical", "hr_request"]
    note: str = ""


class NominateBody(BaseModel):
    employee_id: str = Field(min_length=1)
    note: str = ""


class DecisionBody(BaseModel):
    approve: bool
    note: str = ""


class NoteBody(BaseModel):
    note: str = ""


class ShareBody(BaseModel):
    shared: bool


class PlanBody(BaseModel):
    hr_discretion: bool = False
    target_handover_date: str | None = None
    use_ai: bool = True


class TaskCreate(BaseModel):
    task_type: str
    title: str
    due_date: str
    description: str | None = None
    knowledge_area: str | None = None
    owner_employee_id: str | None = None
    status: str | None = None


class TaskUpdate(BaseModel):
    task_type: str | None = None
    title: str | None = None
    due_date: str | None = None
    description: str | None = None
    knowledge_area: str | None = None
    owner_employee_id: str | None = None
    status: str | None = None
    notes: str | None = None


class AskBody(BaseModel):
    persona: Literal["hr", "manager", "employer", "employee"] = "hr"
    question: str = Field(min_length=3, max_length=600)
    employee_id: str | None = None
    manager_id: str | None = None


def _db():
    db = get_db()
    succession.ensure_schema(db)
    return db


@router.get("/overview")
def overview(manager_id: str | None = None, actor: dict | None = Depends(get_optional_employee)):
    if manager_id:
        _manager_scope(actor, manager_id)
    else:
        _hr(actor)
    return succession.overview(_db(), manager_id)


@router.get("/meta")
def meta():
    return {
        "task_types": list(succession.TASK_TYPES),
        "task_statuses": list(succession.TASK_STATUSES),
        "pairing_statuses": list(succession.PAIRING_STATUSES),
        "triggers": succession.TRIGGERS,
        "departure_risks": list(succession.DEPARTURE_RISKS),
        "readiness_weights": succession.READINESS_WEIGHTS,
        "bands": [{"min": floor, "label": label} for floor, label in succession.BANDS],
        "max_candidates": succession.MAX_CANDIDATES,
    }


@router.post("/roles")
def create_role(body: RoleCreate, actor: dict | None = Depends(get_optional_employee)):
    db = _db()
    label = _hr(actor)
    row = succession.create_role(db, body.model_dump(), label)
    return succession.role_view(db, row, succession._employees(db))


@router.get("/roles/{role_id}")
def get_role(role_id: str, actor: dict | None = Depends(get_optional_employee)):
    _hr(actor)
    db = _db()
    return succession.role_view(db, succession._role_row(db, role_id), succession._employees(db))


@router.patch("/roles/{role_id}")
def update_role(role_id: str, body: RoleUpdate, actor: dict | None = Depends(get_optional_employee)):
    db = _db()
    row = succession.update_role(db, role_id, body.model_dump(exclude_unset=True), _hr(actor))
    return succession.role_view(db, row, succession._employees(db))


@router.post("/roles/{role_id}/requirements/derive")
def derive_requirements(role_id: str, body: DeriveBody, actor: dict | None = Depends(get_optional_employee)):
    db = _db()
    succession.derive_requirements(db, role_id, body.source, _hr(actor))
    return succession.role_view(db, succession._role_row(db, role_id), succession._employees(db))


@router.post("/roles/{role_id}/slate")
def generate_slate(role_id: str, body: SlateBody, actor: dict | None = Depends(get_optional_employee)):
    return succession.generate_slate(_db(), role_id, body.trigger, body.note, _hr(actor))


@router.get("/records/{record_id}")
def get_record(record_id: str, actor: dict | None = Depends(get_optional_employee)):
    _hr(actor)
    return succession.record_detail(_db(), record_id)


@router.post("/records/{record_id}/nominate")
def nominate(record_id: str, body: NominateBody, actor: dict | None = Depends(get_optional_employee)):
    return succession.nominate(_db(), record_id, body.employee_id, body.note, _hr(actor))


@router.post("/records/{record_id}/decision")
def decision(record_id: str, body: DecisionBody, actor: dict | None = Depends(get_optional_employee)):
    return succession.hr_decision(_db(), record_id, body.approve, body.note, _hr(actor))


@router.post("/records/{record_id}/withdraw")
def withdraw(record_id: str, body: NoteBody, actor: dict | None = Depends(get_optional_employee)):
    return succession.withdraw(_db(), record_id, body.note, _hr(actor))


@router.post("/records/{record_id}/share")
def share(record_id: str, body: ShareBody, actor: dict | None = Depends(get_optional_employee)):
    return succession.share_with_candidates(_db(), record_id, body.shared, _hr(actor))


@router.post("/records/{record_id}/plan")
def open_plan(record_id: str, body: PlanBody, actor: dict | None = Depends(get_optional_employee)):
    return succession.open_plan(_db(), record_id, _hr(actor), body.hr_discretion, body.target_handover_date, body.use_ai)


@router.get("/plans/{plan_id}")
def get_plan(plan_id: str, actor: dict | None = Depends(get_optional_employee)):
    _hr(actor)
    return succession.plan_detail(_db(), plan_id)


@router.post("/plans/{plan_id}/tasks")
def add_task(plan_id: str, body: TaskCreate, actor: dict | None = Depends(get_optional_employee)):
    return succession.add_task(_db(), plan_id, body.model_dump(exclude_none=True), _hr(actor))


@router.patch("/tasks/{task_id}")
def update_task(task_id: str, body: TaskUpdate, actor: dict | None = Depends(get_optional_employee)):
    db = _db()
    if settings_enforce():
        rows = db.table("kt_tasks").select("owner_employee_id").eq("id", task_id).limit(1).execute().data or []
        owner = rows[0]["owner_employee_id"] if rows else None
        if not actor or (access_role(actor) not in _PRIVILEGED and str(actor.get("id")) != str(owner)):
            raise HTTPException(status_code=403, detail="Only HR or the task owner can update this task.")
    return succession.update_task(db, task_id, body.model_dump(exclude_unset=True), _label(actor))


@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, actor: dict | None = Depends(get_optional_employee)):
    return succession.delete_task(_db(), task_id, _hr(actor))


@router.get("/employee/{employee_id}")
def employee_view(employee_id: str):
    return succession.employee_view(_db(), employee_id)


@router.get("/audit")
def audit(limit: int = 100, actor: dict | None = Depends(get_optional_employee)):
    _hr(actor)
    return {"events": succession.audit_log(_db(), max(1, min(500, limit)))}


@router.post("/ask")
def ask(body: AskBody, actor: dict | None = Depends(get_optional_employee)):
    if settings_enforce():
        if body.persona == "employee":
            if not actor or (str(actor.get("id")) != str(body.employee_id) and access_role(actor) not in _PRIVILEGED):
                raise HTTPException(status_code=403, detail="Forbidden")
        elif body.persona == "manager":
            _manager_scope(actor, body.manager_id)
        else:
            _hr(actor)
    return succession.answer(_db(), body.persona, body.question, body.employee_id, body.manager_id)

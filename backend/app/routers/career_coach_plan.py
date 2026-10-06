from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.database import get_db
from app.services import career_plan
from app.services.career_evidence_upload import save_career_evidence

router = APIRouter(prefix="/api/career-coach", tags=["Career Coach Plan"])


class GoalBody(BaseModel):
    target_role: str = Field(min_length=3, max_length=120)
    target_months: int = Field(default=12, ge=3, le=36)
    hours_per_week: int = Field(default=5, ge=1, le=20)
    visible_to_manager: bool = False


class SettingsBody(BaseModel):
    hours_per_week: int | None = Field(default=None, ge=1, le=20)
    target_months: int | None = Field(default=None, ge=3, le=36)


class StepBody(BaseModel):
    action: str = Field(pattern="^(reopen)$")


class CheckinBody(BaseModel):
    hours: float = Field(gt=0, le=60)
    skill: str | None = None
    note: str | None = Field(default=None, max_length=1000)


class IntroBody(BaseModel):
    skill: str = Field(min_length=1)


class VisibilityBody(BaseModel):
    visible_to_manager: bool


class AskBody(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[dict[str, Any]] = []


def _db():
    db = get_db()
    career_plan.ensure_schema(db)
    return db


@router.get("/roles")
def roles(employee_id: str | None = None, role: str | None = None):
    db = _db()
    body: dict[str, Any] = {"roles": career_plan.role_options(db)}
    if employee_id and role:
        body["preview"] = career_plan.preview_role(db, employee_id, role)
    return body


@router.get("/{employee_id}")
def plan(employee_id: str):
    return career_plan.build_plan(_db(), employee_id)


@router.post("/{employee_id}/goal")
def set_goal(employee_id: str, body: GoalBody):
    db = _db()
    career_plan.create_goal(db, employee_id, body.target_role, body.target_months, body.hours_per_week, body.visible_to_manager)
    return career_plan.build_plan(db, employee_id)


@router.patch("/{employee_id}/settings")
def update_settings(employee_id: str, body: SettingsBody):
    db = _db()
    career_plan.update_settings(db, employee_id, body.hours_per_week, body.target_months)
    return career_plan.build_plan(db, employee_id)


@router.post("/{employee_id}/steps/{step_id}")
def update_step(employee_id: str, step_id: str, body: StepBody):
    db = _db()
    career_plan.reopen_step(db, employee_id, step_id)
    return career_plan.build_plan(db, employee_id)


@router.post("/{employee_id}/evidence")
async def add_evidence(
    employee_id: str,
    step_id: str = Form(...),
    description: str = Form(""),
    file: UploadFile | None = File(None),
):
    db = _db()
    file_ref = None
    text = description
    if file is not None and file.filename:
        try:
            uploaded = save_career_evidence(employee_id, file.filename, await file.read())
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        file_ref = uploaded["file_ref"]
        text = f"{description}\n{uploaded.get('content_preview') or ''}".strip()
    career_plan.record_evidence(db, employee_id, step_id, text, file_ref)
    return career_plan.build_plan(db, employee_id)


@router.post("/{employee_id}/checkins")
def add_checkin(employee_id: str, body: CheckinBody):
    db = _db()
    career_plan.add_checkin(db, employee_id, body.hours, body.skill, body.note)
    return career_plan.build_plan(db, employee_id)


@router.post("/{employee_id}/mentors/{mentor_id}/intro")
def intro(employee_id: str, mentor_id: str, body: IntroBody):
    db = _db()
    career_plan.request_intro(db, employee_id, mentor_id, body.skill)
    return career_plan.build_plan(db, employee_id)


@router.patch("/{employee_id}/visibility")
def visibility(employee_id: str, body: VisibilityBody):
    db = _db()
    career_plan.set_visibility(db, employee_id, body.visible_to_manager)
    return career_plan.build_plan(db, employee_id)


@router.post("/{employee_id}/market/refresh")
def refresh_market(employee_id: str):
    db = _db()
    career_plan.refresh_market(db, employee_id)
    return career_plan.build_plan(db, employee_id)


@router.post("/{employee_id}/ask")
def ask(employee_id: str, body: AskBody):
    return career_plan.coach_answer(_db(), employee_id, body.message, body.history)

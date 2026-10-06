from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import get_db
from app.services.authorization import can_access_employee, settings_enforce
from app.services.learning_recommendation import (
    abandon_plan,
    compliance,
    employer_overview,
    ensure_schema,
    generate_plan,
    get_assessment,
    get_plan,
    known_skill_names,
    list_assessments,
    list_closures,
    list_plans,
    list_skill_gaps,
    manager_overview,
    match_courses,
    next_learning_answer,
    submit_assessment,
    sync_assessment,
    transition_item,
    add_course_to_plan,
    course_questions,
    create_course,
    _courses,
)

router = APIRouter(prefix="/api/learning/recommendation", tags=["Learning Recommendation"])


class PlanCreate(BaseModel):
    source_gap_reference: str = Field(min_length=1)
    course_ids: list[str] = []


class AbandonBody(BaseModel):
    reason: str = Field(min_length=1)


class StatusBody(BaseModel):
    status: str


class AssessmentBody(BaseModel):
    learning_plan_item_id: str
    assessment_score_pct: int | None = Field(default=None, ge=0, le=100)
    answers: list[int] | None = None


class SkillMap(BaseModel):
    skill_name: str = Field(min_length=1)
    level_delivered: int = Field(ge=1, le=5)


class CourseCreate(BaseModel):
    course_title: str = Field(min_length=3)
    provider: str = "Internal Academy"
    modality: str
    duration_hours: float
    cost_lkr: float = 0
    difficulty_level: str
    is_mandatory: bool = False
    mandatory_for_role_ids: list[str] = []
    strategic_priority_flag: bool = False
    has_assessment: bool = True
    skill_maps: list[SkillMap] = Field(min_length=1)


class SyncBody(BaseModel):
    force_fail: bool = False


class PlanCourseBody(BaseModel):
    course_id: str = Field(min_length=1)


def _actor_id() -> str | None:
    return None


def _allow(employee_id: str) -> None:
    if not settings_enforce():
        return
    actor_id = _actor_id()
    if not actor_id:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    db = get_db()
    actor = (db.table("employees").select("*").eq("id", actor_id).limit(1).execute().data or [None])[0]
    if not actor or not can_access_employee(actor, employee_id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")


def _employee(db, employee_id: str) -> dict:
    rows = db.table("employees").select("id, full_name, role, department, manager_id").eq("id", employee_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Employee not found")
    return rows[0]


@router.get("/courses")
def courses(skill: str | None = None, difficulty: str | None = None, modality: str | None = None, mandatory: bool | None = None, strategic: bool | None = None, assessment: bool | None = None, status: str | None = None):
    db = get_db()
    ensure_schema(db)
    rows = _courses(db)
    if skill:
        needle = skill.casefold()
        rows = [row for row in rows if any(str(item["skill_name"]).casefold() == needle for item in row["skills"])]
    if difficulty:
        rows = [row for row in rows if row["difficulty_level"] == difficulty]
    if modality:
        rows = [row for row in rows if row["modality"] == modality]
    if mandatory is not None:
        rows = [row for row in rows if row["is_mandatory"] is mandatory]
    if strategic is not None:
        rows = [row for row in rows if row["strategic_priority_flag"] is strategic]
    if assessment is not None:
        rows = [row for row in rows if row["has_assessment"] is assessment]
    if status:
        rows = [row for row in rows if row["catalogue_status"] == status]
    return {"courses": rows}


@router.get("/skill-names")
def skill_names():
    return {"skills": known_skill_names(get_db())}


@router.post("/courses")
def add_course(body: CourseCreate):
    return create_course(get_db(), body.model_dump(), [skill.model_dump() for skill in body.skill_maps])


@router.get("/courses/{course_id}/questions")
def questions(course_id: str):
    return {"questions": course_questions(get_db(), course_id)}


@router.get("/courses/{course_id}")
def course_detail(course_id: str):
    db = get_db()
    ensure_schema(db)
    row = next((item for item in _courses(db) if item["id"] == course_id), None)
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    return row


@router.get("/{employee_id}/skill-gaps")
def skill_gaps(employee_id: str):
    db = get_db()
    _allow(employee_id)
    _employee(db, employee_id)
    return {"gaps": list_skill_gaps(db, employee_id)}


@router.post("/{employee_id}/plans")
def create_plan(employee_id: str, body: PlanCreate):
    db = get_db()
    _allow(employee_id)
    _employee(db, employee_id)
    return generate_plan(db, employee_id, body.source_gap_reference, body.course_ids or None)


@router.get("/{employee_id}/plans")
def plans(employee_id: str):
    db = get_db()
    _allow(employee_id)
    _employee(db, employee_id)
    return {"plans": list_plans(db, employee_id)}


@router.get("/plans/{plan_id}")
def plan_detail(plan_id: str):
    db = get_db()
    plan = get_plan(db, plan_id)
    _allow(plan["employee_id"])
    return plan


@router.post("/plans/{plan_id}/abandon")
def abandon(plan_id: str, body: AbandonBody):
    db = get_db()
    plan = get_plan(db, plan_id)
    _allow(plan["employee_id"])
    return abandon_plan(db, plan_id, body.reason, plan["employee_id"] if settings_enforce() else None)


@router.post("/plans/{plan_id}/items")
def add_plan_course(plan_id: str, body: PlanCourseBody):
    db = get_db()
    plan = get_plan(db, plan_id)
    _allow(plan["employee_id"])
    return add_course_to_plan(db, plan_id, body.course_id)


@router.post("/items/{item_id}/enroll")
def enroll(item_id: str):
    db = get_db()
    return transition_item(db, item_id, "Enrolled")


@router.patch("/items/{item_id}/status")
def item_status(item_id: str, body: StatusBody):
    db = get_db()
    return transition_item(db, item_id, body.status)


@router.post("/assessments")
def create_assessment(body: AssessmentBody):
    if body.answers is None and body.assessment_score_pct is None:
        raise HTTPException(status_code=400, detail="Submit the assessment answers.")
    db = get_db()
    return submit_assessment(db, body.learning_plan_item_id, body.assessment_score_pct, answers=body.answers)


@router.get("/assessments/{assessment_id}")
def assessment(assessment_id: str):
    db = get_db()
    row = get_assessment(db, assessment_id)
    _allow(row["employee_id"])
    return row


@router.get("/{employee_id}/assessments")
def assessments(employee_id: str):
    db = get_db()
    _allow(employee_id)
    return {"assessments": list_assessments(db, employee_id)}


@router.post("/assessments/{assessment_id}/sync")
def sync(assessment_id: str, body: SyncBody | None = None):
    db = get_db()
    row = get_assessment(db, assessment_id)
    _allow(row["employee_id"])
    return sync_assessment(db, assessment_id, force_fail=bool(body and body.force_fail))


@router.post("/assessments/{assessment_id}/retry-sync")
def retry_sync(assessment_id: str):
    db = get_db()
    row = get_assessment(db, assessment_id)
    _allow(row["employee_id"])
    if row["sfa_sync_status"] != "Failed":
        raise HTTPException(status_code=400, detail="Only a failed synchronization can be retried.")
    return sync_assessment(db, assessment_id, force_fail=False)


@router.get("/compliance/mandatory")
def mandatory(employee_id: str | None = None):
    return compliance(get_db(), "mandatory", employee_id)


@router.get("/compliance/strategic")
def strategic(employee_id: str | None = None):
    return compliance(get_db(), "strategic", employee_id)


@router.get("/gap-closure")
def gap_closure(employee_id: str | None = None):
    if employee_id:
        _allow(employee_id)
    return {"closures": list_closures(get_db(), employee_id)}


@router.get("/manager/{manager_id}/overview")
def manager(manager_id: str):
    _allow(manager_id)
    return manager_overview(get_db(), manager_id)


@router.get("/employer/overview")
def employer():
    return employer_overview(get_db())


@router.get("/{employee_id}/next")
def next_step(employee_id: str):
    db = get_db()
    _allow(employee_id)
    _employee(db, employee_id)
    return next_learning_answer(db, employee_id)


@router.get("/{employee_id}/matches")
def matches(employee_id: str, skill: str, current: int, required: int):
    db = get_db()
    _allow(employee_id)
    _employee(db, employee_id)
    return {"courses": match_courses(db, skill, current, required)}

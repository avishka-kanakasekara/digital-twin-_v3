from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.database import get_supabase_admin
from app.schemas.career import (
    CareerAnalysisResponse,
    CareerChatRequest,
    CareerChatResponse,
    CareerGoalCreate,
    CareerGoalResponse,
    CareerGoalVisibilityUpdate,
    CareerRoadmapStepResponse,
    CareerRoadmapStepUpdate,
    EvidenceSubmissionResponse,
    InternalRoleMatchResponse,
    MentorIntroRequestResponse,
    MentorMatchResponse,
    StallFlagResponse,
    StallScanResponse,
)
from app.services.career_coach import (
    analysis_response_from_state,
    award_career_xp,
    build_grounded_chat_response,
    compute_career_state,
    goal_has_ai_plan,
    persist_career_snapshot,
    scan_for_stalled_goals,
)
from app.services.career_evidence_upload import save_career_evidence

def _persist_state(sb, employee_id: str, state: dict[str, Any]) -> None:
    try:
        persist_career_snapshot(
            sb,
            employee_id,
            state["goal_id"],
            state["readiness_components"],
            state["skill_gaps"],
            state["roadmap"],
            state["internal_roles"],
            state["mentors"],
            ai_cache=state.get("ai_cache"),
        )
        sb.table("career_goals").update({"readiness_score": state["readiness_score"]}).eq("id", state["goal_id"]).execute()
    except Exception as exc:
        print(f"[career] Could not persist career state: {exc}")


router = APIRouter(prefix="/api/career", tags=["Career Coach"])


def _require_active_goal(employee_id: str, sb):
    goal_rows = sb.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).limit(1).execute().data or []
    if not goal_rows:
        raise HTTPException(status_code=404, detail="No active career goal")
    return goal_rows[0]


@router.get("/{employee_id}/goal", response_model=CareerGoalResponse | None)
def get_active_goal(employee_id: str):
    sb = get_supabase_admin()
    goal_rows = sb.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).limit(1).execute().data or []
    if not goal_rows:
        return None
    goal = goal_rows[0]
    state = compute_career_state(employee_id, sb, refresh_ai=False)
    return CareerGoalResponse(
        id=goal["id"],
        employee_id=goal["employee_id"],
        target_role=goal["target_role"],
        timeline=goal.get("timeline"),
        focus_area=goal.get("focus_area"),
        target_industry=goal.get("target_industry"),
        readiness_score=goal.get("readiness_score", state["readiness_score"]),
        visible_to_manager=bool(goal.get("visible_to_manager", False)),
        is_active=bool(goal.get("is_active", True)),
        created_at=goal.get("created_at"),
        updated_at=goal.get("updated_at"),
        roadmap_steps=analysis_response_from_state(employee_id, sb, state).roadmap_steps,
    )


@router.post("/{employee_id}/goal", response_model=CareerGoalResponse, status_code=201)
def set_or_update_goal(employee_id: str, data: CareerGoalCreate):
    sb = get_supabase_admin()
    existing_rows = sb.table("career_goals").select("id").eq("employee_id", employee_id).eq("is_active", True).execute().data or []
    for row in existing_rows:
        sb.table("career_goals").update({"is_active": False, "updated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()}).eq("id", row["id"]).execute()

    goal_id = str(uuid.uuid4())
    sb.table("career_goals").insert({
        "id": goal_id,
        "employee_id": employee_id,
        "target_role": data.target_role,
        "timeline": data.timeline,
        "focus_area": data.focus_area,
        "target_industry": data.target_industry,
        "visible_to_manager": data.visible_to_manager,
        "is_active": True,
    }).execute()

    state = compute_career_state(employee_id, sb, data.target_role, data.timeline, data.focus_area, refresh_ai=True)
    if state.get("ai_cache"):
        _persist_state(sb, employee_id, state)
    goal_rows = sb.table("career_goals").select("*").eq("id", goal_id).limit(1).execute().data or []
    goal = goal_rows[0]
    return CareerGoalResponse(
        id=goal["id"],
        employee_id=goal["employee_id"],
        target_role=goal["target_role"],
        timeline=goal.get("timeline"),
        focus_area=goal.get("focus_area"),
        target_industry=goal.get("target_industry"),
        readiness_score=state["readiness_score"],
        visible_to_manager=bool(goal.get("visible_to_manager", False)),
        is_active=bool(goal.get("is_active", True)),
        created_at=goal.get("created_at"),
        updated_at=goal.get("updated_at"),
        roadmap_steps=[CareerRoadmapStepResponse(**row) for row in state["roadmap"]],
    )


@router.get("/{employee_id}/analysis", response_model=CareerAnalysisResponse)
def get_analysis(employee_id: str, refresh: bool = Query(default=False)):
    sb = get_supabase_admin()
    goal_rows = sb.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).limit(1).execute().data or []
    if not goal_rows:
        default_goal = CareerGoalCreate(target_role="Senior Software Engineer", timeline="12 months", focus_area="Engineering")
        set_or_update_goal(employee_id, default_goal)
        goal_rows = sb.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).limit(1).execute().data or []

    goal = goal_rows[0]
    refresh_ai = refresh or not goal_has_ai_plan(sb, goal["id"])
    state = compute_career_state(employee_id, sb, refresh_ai=refresh_ai)
    if state.get("ai_cache"):
        _persist_state(sb, employee_id, state)
    return analysis_response_from_state(employee_id, sb, state)


@router.patch("/roadmap/{step_id}")
def update_roadmap_step(step_id: str, data: CareerRoadmapStepUpdate):
    sb = get_supabase_admin()
    step_rows = sb.table("career_roadmap_steps").select("*").eq("id", step_id).limit(1).execute().data or []
    if not step_rows:
        raise HTTPException(status_code=404, detail="Roadmap step not found")
    step = step_rows[0]
    goal_rows = sb.table("career_goals").select("*").eq("id", step["career_goal_id"]).limit(1).execute().data or []
    if not goal_rows:
        raise HTTPException(status_code=404, detail="Career goal not found")
    goal = goal_rows[0]

    new_status = "achieved" if data.status in {"achieved", "completed"} else "in_progress" if data.status == "in_progress" else "upcoming"
    if step.get("requires_evidence") and new_status == "achieved":
        if not data.evidence_id:
            raise HTTPException(status_code=400, detail="Evidence is required for this roadmap step.")
        evidence_rows = sb.table("evidence_submissions").select("*").eq("id", data.evidence_id).limit(1).execute().data or []
        if not evidence_rows:
            raise HTTPException(status_code=404, detail="Evidence submission not found")
        evidence = evidence_rows[0]
        if evidence.get("status") not in {"approved", "submitted"}:
            raise HTTPException(status_code=400, detail="Evidence is not approved yet.")

    update_payload = {"status": new_status}
    if new_status == "achieved":
        update_payload["completed_at"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    sb.table("career_roadmap_steps").update(update_payload).eq("id", step_id).execute()

    if new_status == "achieved" and step.get("status") != "achieved":
        award_career_xp(sb, goal["employee_id"], int(step.get("xp_reward") or 100), f"Career roadmap step completed: {step['title']}", "roadmap_step", step_id)

    state = compute_career_state(goal["employee_id"], sb, refresh_ai=False)
    return {"id": step_id, "status": new_status, "analysis": analysis_response_from_state(goal["employee_id"], sb, state).model_dump()}


@router.post("/{employee_id}/evidence", response_model=EvidenceSubmissionResponse)
async def submit_evidence(
    employee_id: str,
    skill_gap_id: str | None = Form(default=None),
    roadmap_step_id: str | None = Form(default=None),
    evidence_type: str = Form(...),
    description: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
):
    sb = get_supabase_admin()
    _require_active_goal(employee_id, sb)

    if not skill_gap_id and not roadmap_step_id:
        raise HTTPException(status_code=400, detail="Evidence must be attached to a skill gap or roadmap step.")

    file_ref = None
    content_preview = description or ""
    if file:
        uploaded = save_career_evidence(employee_id, file.filename or "evidence", await file.read())
        file_ref = uploaded["file_ref"]
        content_preview = f"{description or ''}\n{uploaded['content_preview']}".strip()

    status = "pending_approval" if evidence_type == "manager_signoff" else "approved"
    verified_by = "system" if status == "approved" else None
    verified_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat() if status == "approved" else None
    xp_awarded = 60 if status == "approved" else 0
    evidence_id = str(uuid.uuid4())
    row = {
        "id": evidence_id,
        "skill_gap_id": skill_gap_id,
        "roadmap_step_id": roadmap_step_id,
        "employee_id": employee_id,
        "evidence_type": evidence_type,
        "file_ref": file_ref,
        "description": content_preview,
        "status": status,
        "verified_by": verified_by,
        "verified_at": verified_at,
        "xp_awarded": xp_awarded,
    }
    sb.table("evidence_submissions").insert(row).execute()

    if status == "approved":
        award_career_xp(sb, employee_id, xp_awarded, f"Career evidence approved: {evidence_type}", "evidence", evidence_id)
        if skill_gap_id:
            sb.table("skill_gaps").update({"status": "in_progress"}).eq("id", skill_gap_id).execute()

    return EvidenceSubmissionResponse(
        id=evidence_id,
        employee_id=employee_id,
        skill_gap_id=skill_gap_id,
        roadmap_step_id=roadmap_step_id,
        evidence_type=evidence_type,
        description=content_preview,
        file_ref=file_ref,
        status=status,
        verified_by=verified_by,
        verified_at=verified_at,
        xp_awarded=xp_awarded,
    )


@router.get("/{employee_id}/internal-roles", response_model=list[InternalRoleMatchResponse])
def get_internal_roles(employee_id: str):
    sb = get_supabase_admin()
    state = compute_career_state(employee_id, sb)
    return [InternalRoleMatchResponse(**row) for row in state["internal_roles"]]


@router.get("/{employee_id}/mentors", response_model=list[MentorMatchResponse])
def get_mentors(employee_id: str):
    sb = get_supabase_admin()
    state = compute_career_state(employee_id, sb)
    return [MentorMatchResponse(**row) for row in state["mentors"]]


@router.post("/{employee_id}/mentors/{mentor_id}/request-intro", response_model=MentorIntroRequestResponse)
def request_mentor_intro(employee_id: str, mentor_id: str):
    sb = get_supabase_admin()
    existing = sb.table("mentor_matches").select("*").eq("employee_id", employee_id).eq("mentor_employee_id", mentor_id).limit(1).execute().data or []
    if not existing:
        state = compute_career_state(employee_id, sb)
        mentor_rows = [row for row in state["mentors"] if row["mentor_employee_id"] == mentor_id]
        if not mentor_rows:
            raise HTTPException(status_code=404, detail="Mentor match not found")
        sb.table("mentor_matches").insert(mentor_rows[0]).execute()
        existing = [mentor_rows[0]]
    sb.table("mentor_matches").update({"intro_requested": True}).eq("id", existing[0]["id"]).execute()
    updated = {**existing[0], "intro_requested": True}
    return MentorIntroRequestResponse(status="requested", mentor_match=MentorMatchResponse(**updated))


@router.post("/{employee_id}/chat", response_model=CareerChatResponse)
def grounded_chat(employee_id: str, request: CareerChatRequest):
    sb = get_supabase_admin()
    response, grounding = build_grounded_chat_response(employee_id, request.message, request.history, sb)
    return CareerChatResponse(response=response, grounding_points=grounding)


@router.patch("/{employee_id}/visibility", response_model=CareerGoalResponse)
def update_visibility(employee_id: str, data: CareerGoalVisibilityUpdate):
    sb = get_supabase_admin()
    goal = _require_active_goal(employee_id, sb)
    sb.table("career_goals").update({"visible_to_manager": data.visible_to_manager}).eq("id", goal["id"]).execute()
    return get_active_goal(employee_id)


@router.post("/stall-flags/scan", response_model=StallScanResponse)
def scan_stall_flags(days: int = 14):
    sb = get_supabase_admin()
    result = scan_for_stalled_goals(sb, days)
    return StallScanResponse(
        scanned_goals=result["scanned_goals"],
        flagged_goals=result["flagged_goals"],
        resolved_goals=result["resolved_goals"],
        flags=[
            StallFlagResponse(
                id=row["id"],
                employee_id=row["employee_id"],
                goal_id=row["goal_id"],
                last_progress_at=row["last_progress_at"],
                flagged_at=row["flagged_at"],
                resolved=bool(row.get("resolved", False)),
                message="You have not logged career progress recently. Pick one small step this week to keep momentum.",
            )
            for row in result["flags"]
        ],
    )

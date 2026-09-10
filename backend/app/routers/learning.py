from __future__ import annotations
"""
Learning router — paths, courses, certifications, feed, schedule, hours, AI coach.
Uses Supabase as the database backend. Gemini calls go through gemini_learning_service.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.database import get_supabase_admin
from app.schemas.learning import (
    LearnerProfileResponse,
    LearningPathResponse,
    LearningPathProgressUpdate,
    PathGenerateRequest,
    CourseResponse,
    CourseProgressUpdate,
    CertificationCreate,
    CertificationResponse,
    LearningFeedItem,
    WeeklyScheduleResponse,
    MonthlyHoursResponse,
    SkillGapsResponse,
    SkillGapItem,
    RecommendedRef,
    ChatMessageCreate,
    ChatMessageResponse,
)
from app.services.learning_engine import compute_learning_hours, ensure_learning_paths
from app.services.gemini_learning_service import (
    compute_learning_score,
    gap_closure_ratio,
    recency_boost,
    generate_ai_paths,
    generate_learning_feed,
    enrich_skill_gaps,
    compute_db_skill_gaps,
    chat_with_coach,
    top_ai_course_recommendations,
)

logger = logging.getLogger("learning_router")
router = APIRouter(prefix="/api/learning", tags=["Learning"])


def _err(status_code: int, message: str, code: str):
    return JSONResponse(
        status_code=status_code,
        content={"error": message, "code": code, "detail": message},
    )


def _as_percent(value) -> int:
    """Normalize proficiency-like values that may be 0–10 or 0–100."""
    try:
        n = int(value or 0)
    except (TypeError, ValueError):
        return 0
    if n <= 10:
        return n * 10
    return max(0, min(100, n))


def _gap_points(current: int, target: int, raw_gap=None) -> int:
    """Gap is always a 0–100 point difference — never scaled with ×10."""
    recomputed = max(0, min(100, target - current))
    if raw_gap is None:
        return recomputed
    try:
        g = int(raw_gap)
    except (TypeError, ValueError):
        return recomputed
    # Prefer recomputed; raw was previously wrongly passed through _as_percent
    if abs(g - recomputed) <= 5:
        return max(0, min(100, g))
    return recomputed


def _map_gap_item(g: dict) -> SkillGapItem:
    current = _as_percent(g.get("current_level"))
    target = _as_percent(g.get("target_level"))
    gap = _gap_points(current, target, g.get("gap"))
    return SkillGapItem(
        skill=g["skill"],
        current_level=current,
        target_level=target,
        gap=gap,
        priority=g.get("priority") or (
            "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
        ),
        category=g.get("category"),
        color=g.get("color"),
        rationale=g.get("rationale"),
        recommended_courses=[
            RecommendedRef(id=r.get("id"), title=r["title"])
            for r in (g.get("recommended_courses") or [])
            if r.get("title")
        ],
        recommended_paths=[
            RecommendedRef(id=r.get("id"), title=r["title"])
            for r in (g.get("recommended_paths") or [])
            if r.get("title")
        ],
    )


def _require_employee(sb, employee_id: str) -> dict:
    if not employee_id or len(employee_id) > 80:
        raise HTTPException(status_code=400, detail="Invalid employee_id")
    emp = sb.table("employees").select("id, full_name, role").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp.data[0]



# ─── Learner Profile ──────────────────────────────────────────

@router.get("/{employee_id}/profile", response_model=LearnerProfileResponse)
def get_learner_profile(employee_id: str):
    """Get learning stats for an employee (real enrollment + weighted learning_score)."""
    try:
        sb = get_supabase_admin()
        employee = _require_employee(sb, employee_id)

        completed_result = sb.table("employee_courses").select("id", count="exact").eq(
            "employee_id", employee_id
        ).eq("status", "completed").execute()
        completed = completed_result.count or 0

        in_progress_result = sb.table("employee_courses").select("id", count="exact").eq(
            "employee_id", employee_id
        ).eq("status", "in_progress").execute()
        in_progress = in_progress_result.count or 0

        gam_result = sb.table("gamification_profiles").select("streak_days, longest_streak").eq(
            "employee_id", employee_id
        ).execute()
        gam_profile = gam_result.data[0] if gam_result.data else {}

        goal_result = sb.table("career_goals").select("target_role").eq(
            "employee_id", employee_id
        ).eq("is_active", True).execute()
        active_goal = goal_result.data[0] if goal_result.data else None

        skills = sb.table("skills").select("proficiency, target_level").eq(
            "employee_id", employee_id
        ).execute().data or []

        hours_month, hours_year, _ = compute_learning_hours(sb, employee_id)
        learning_score = compute_learning_score(
            courses_completed=completed,
            courses_in_progress=in_progress,
            hours_year=hours_year,
            streak_days=int(gam_profile.get("streak_days") or 0),
            gap_closure_pct=gap_closure_ratio(skills),
            recency_boost=recency_boost(sb, employee_id),
        )

        return LearnerProfileResponse(
            name=employee["full_name"],
            hours_this_month=hours_month,
            hours_this_year=hours_year,
            courses_completed=completed,
            courses_in_progress=in_progress,
            current_streak=gam_profile.get("streak_days", 0),
            longest_streak=gam_profile.get("longest_streak", 0),
            learning_score=learning_score,
            target_role=active_goal["target_role"] if active_goal else None,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("profile failed employee=%s", employee_id)
        return _err(503, f"Failed to load learner profile: {exc}", "PROFILE_ERROR")


# ─── Learning Paths ───────────────────────────────────────────

@router.get("/{employee_id}/paths", response_model=list[LearningPathResponse])
def get_learning_paths(employee_id: str):
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)
        return ensure_learning_paths(sb, employee_id)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("paths list failed employee=%s", employee_id)
        return _err(503, f"Failed to load paths: {exc}", "PATHS_ERROR")


@router.post("/{employee_id}/paths/{path_id}/progress")
def update_path_progress(
    employee_id: str,
    path_id: str,
    data: LearningPathProgressUpdate,
):
    try:
        sb = get_supabase_admin()
        existing = sb.table("learning_paths").select("id").eq("id", path_id).eq(
            "employee_id", employee_id
        ).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Learning path not found")

        update_data: dict = {"progress": min(100, data.progress)}
        if data.completed_courses is not None:
            update_data["completed_courses"] = data.completed_courses

        sb.table("learning_paths").update(update_data).eq("id", path_id).execute()

        if update_data["progress"] >= 100:
            try:
                from app.services.gamification_engine import fire_gamification_event
                fire_gamification_event(sb, employee_id, "course_completed")
            except Exception as gam_err:
                logger.warning("gamification course_completed: %s", gam_err)

        return {"status": "updated", "progress": update_data["progress"]}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("path progress failed employee=%s path=%s", employee_id, path_id)
        return _err(503, f"Failed to update path: {exc}", "PATH_PROGRESS_ERROR")


@router.post("/{employee_id}/paths/generate", response_model=list[LearningPathResponse])
def regenerate_learning_paths(employee_id: str, body: PathGenerateRequest | None = None):
    """Gemini-powered path generation (falls back to rules). Optional free-text goal."""
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)
        goal = body.goal if body else None
        return generate_ai_paths(sb, employee_id, goal_text=goal)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("path generate failed employee=%s", employee_id)
        return _err(503, "AI path generation is temporarily unavailable. Please retry.", "PATH_GENERATE_ERROR")


# ─── Skill Gaps ────────────────────────────────────────────────

@router.get("/{employee_id}/skill-gaps", response_model=SkillGapsResponse)
def get_skill_gaps(employee_id: str, enrich: bool = False):
    """
    Skill gaps vs target role.
    Fast DB/rule path by default so the UI never hangs on Gemini.
    Pass enrich=true for optional short Gemini enrichment.
    """
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)

        if enrich:
            try:
                data = enrich_skill_gaps(sb, employee_id, use_gemini=True)
            except Exception as ai_exc:
                logger.warning("skill gap AI failed, using DB gaps: %s", ai_exc)
                data = compute_db_skill_gaps(sb, employee_id)
        else:
            data = compute_db_skill_gaps(sb, employee_id)

        gaps = [_map_gap_item(g) for g in (data.get("gaps") or []) if g.get("skill")]
        gaps.sort(key=lambda x: x.gap, reverse=True)
        return SkillGapsResponse(target_role=data.get("target_role"), gaps=gaps)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("skill gaps failed employee=%s", employee_id)
        return _err(503, f"Failed to load skill gaps: {exc}", "SKILL_GAPS_ERROR")


# ─── Certifications ───────────────────────────────────────────

@router.get("/{employee_id}/certifications", response_model=list[CertificationResponse])
def get_certifications(employee_id: str):
    sb = get_supabase_admin()
    result = sb.table("certifications").select("*").eq(
        "employee_id", employee_id
    ).order("status").order("name").execute()
    return result.data


@router.post("/{employee_id}/certifications", response_model=CertificationResponse, status_code=201)
def add_certification(employee_id: str, data: CertificationCreate):
    sb = get_supabase_admin()
    cert_data = {
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        **data.model_dump(),
    }
    result = sb.table("certifications").insert(cert_data).execute()
    try:
        from app.services.gamification_engine import fire_gamification_event
        fire_gamification_event(sb, employee_id, "certification_added")
    except Exception as gam_err:
        logger.warning("gamification certification_added: %s", gam_err)
    return result.data[0]


# ─── Course Library ────────────────────────────────────────────

@router.get("/courses", response_model=list[CourseResponse])
def list_courses(
    search: str | None = None,
    level: str | None = None,
    employee_id: str | None = None,
    ai_recommended: bool = False,
):
    """Search the course library. ai_recommended=true returns top Gemini matches."""
    try:
        if search and len(search) > 120:
            raise HTTPException(status_code=400, detail="Search query too long")

        sb = get_supabase_admin()

        if ai_recommended and employee_id:
            _require_employee(sb, employee_id)
            recs = top_ai_course_recommendations(sb, employee_id, limit=2)
            # Enrich status
            for course in recs:
                ec = sb.table("employee_courses").select("status, progress").eq(
                    "employee_id", employee_id
                ).eq("course_id", course["id"]).execute()
                if ec.data:
                    course["status"] = ec.data[0]["status"]
                    course["progress"] = ec.data[0]["progress"]
            return recs

        query = sb.table("courses").select("*").order("title")
        if search:
            query = query.ilike("title", f"%{search}%")
        if level:
            query = query.eq("level", level)

        result = query.execute()
        courses = result.data or []

        # Tag search (client also filters; server-side boost)
        if search:
            q = search.lower()
            filtered = []
            for course in courses:
                title = str(course.get("title") or "").lower()
                tags = course.get("tags") or []
                tag_blob = " ".join(str(t).lower() for t in tags) if isinstance(tags, list) else ""
                if q in title or q in tag_blob:
                    filtered.append(course)
            courses = filtered

        response = []
        for course in courses:
            course_data = dict(course)
            course_data.setdefault("status", "available")
            course_data.setdefault("progress", 0)

            if employee_id:
                ec_result = sb.table("employee_courses").select("status, progress").eq(
                    "employee_id", employee_id
                ).eq("course_id", course["id"]).execute()
                if ec_result.data:
                    ec = ec_result.data[0]
                    course_data["status"] = ec["status"]
                    course_data["progress"] = ec["progress"]

            response.append(course_data)

        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("list courses failed")
        return _err(503, f"Failed to load courses: {exc}", "COURSES_ERROR")


@router.post("/{employee_id}/courses/{course_id}/enroll")
def enroll_in_course(employee_id: str, course_id: str):
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)

        existing = sb.table("employee_courses").select("id").eq(
            "employee_id", employee_id
        ).eq("course_id", course_id).execute()
        if existing.data:
            return {"status": "already_enrolled", "course_id": course_id}

        course = sb.table("courses").select("id, enrolled_count").eq("id", course_id).execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found")

        sb.table("employee_courses").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "course_id": course_id,
            "status": "in_progress",
            "started_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        new_count = (course.data[0].get("enrolled_count") or 0) + 1
        sb.table("courses").update({"enrolled_count": new_count}).eq("id", course_id).execute()

        return {"status": "enrolled", "course_id": course_id}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("enroll failed employee=%s course=%s", employee_id, course_id)
        return _err(503, f"Enrollment failed: {exc}", "ENROLL_ERROR")


@router.patch("/{employee_id}/courses/{course_id}")
def update_course_progress(
    employee_id: str,
    course_id: str,
    data: CourseProgressUpdate,
):
    try:
        sb = get_supabase_admin()

        ec_result = sb.table("employee_courses").select("*").eq(
            "employee_id", employee_id
        ).eq("course_id", course_id).execute()
        if not ec_result.data:
            raise HTTPException(status_code=404, detail="Not enrolled in this course")

        ec = ec_result.data[0]
        new_progress = min(100, max(0, data.progress))
        update_data: dict = {"progress": new_progress}

        newly_completed = False
        if new_progress >= 100 and ec.get("status") != "completed":
            update_data["status"] = "completed"
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            newly_completed = True

        sb.table("employee_courses").update(update_data).eq("id", ec["id"]).execute()

        if newly_completed:
            try:
                from app.services.gamification_engine import fire_gamification_event
                fire_gamification_event(sb, employee_id, "course_completed")
            except Exception as gam_err:
                logger.warning("gamification course_completed: %s", gam_err)
            _bump_related_paths(sb, employee_id)

        return {
            "status": "updated",
            "progress": new_progress,
            "completed": newly_completed or ec.get("status") == "completed",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("course progress failed employee=%s", employee_id)
        return _err(503, f"Failed to update course progress: {exc}", "COURSE_PROGRESS_ERROR")


def _bump_related_paths(sb, employee_id: str):
    paths = sb.table("learning_paths").select("*").eq("employee_id", employee_id).execute()
    completed = sb.table("employee_courses").select("id", count="exact").eq(
        "employee_id", employee_id
    ).eq("status", "completed").execute()
    done = completed.count or 0
    for path in paths.data or []:
        total = max(1, path.get("total_courses") or 1)
        completed_courses = min(total, done)
        progress = int((completed_courses / total) * 100)
        sb.table("learning_paths").update({
            "completed_courses": completed_courses,
            "progress": progress,
        }).eq("id", path["id"]).execute()


# ─── Weekly Schedule / Hours ───────────────────────────────────

@router.get("/{employee_id}/schedule", response_model=list[WeeklyScheduleResponse])
def get_weekly_schedule(employee_id: str):
    sb = get_supabase_admin()
    result = sb.table("weekly_schedule_entries").select("*").eq(
        "employee_id", employee_id
    ).order("day").execute()
    return result.data


@router.get("/{employee_id}/hours", response_model=list[MonthlyHoursResponse])
def get_monthly_hours(employee_id: str):
    sb = get_supabase_admin()
    _, _, months = compute_learning_hours(sb, employee_id)
    return [MonthlyHoursResponse(**m) for m in months]


# ─── AI Learning Feed ─────────────────────────────────────────

@router.get("/{employee_id}/feed", response_model=list[LearningFeedItem])
def get_learning_feed(employee_id: str):
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)
        return generate_learning_feed(sb, employee_id, force=False)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("feed failed employee=%s", employee_id)
        return _err(503, "Learning feed is temporarily unavailable.", "FEED_ERROR")


@router.post("/{employee_id}/feed/refresh", response_model=list[LearningFeedItem])
def refresh_learning_feed(employee_id: str):
    """Force Gemini regeneration of the learning feed (bypasses 24h cache)."""
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)
        return generate_learning_feed(sb, employee_id, force=True)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("feed refresh failed employee=%s", employee_id)
        return _err(503, "Could not refresh AI feed. Please retry shortly.", "FEED_REFRESH_ERROR")


# ─── AI Coach ─────────────────────────────────────────────────

@router.post("/{employee_id}/ai/chat", response_model=ChatMessageResponse)
def ai_chat(employee_id: str, body: ChatMessageCreate):
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)
        result = chat_with_coach(sb, employee_id, body.message.strip())
        return ChatMessageResponse(role=result["role"], content=result["content"])
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("ai chat failed employee=%s", employee_id)
        return _err(503, "AI Coach is temporarily unavailable.", "AI_CHAT_ERROR")


@router.get("/{employee_id}/ai/chat/history", response_model=list[ChatMessageResponse])
def ai_chat_history(employee_id: str):
    try:
        sb = get_supabase_admin()
        _require_employee(sb, employee_id)
        try:
            rows = sb.table("learning_chat_messages").select(
                "id, role, content, created_at"
            ).eq("employee_id", employee_id).order("created_at").limit(50).execute()
            return rows.data or []
        except Exception as exc:
            logger.warning("chat history table missing or failed: %s", exc)
            return []
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("chat history failed employee=%s", employee_id)
        return _err(503, f"Failed to load chat history: {exc}", "CHAT_HISTORY_ERROR")

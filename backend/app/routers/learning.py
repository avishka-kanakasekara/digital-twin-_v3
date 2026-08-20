from __future__ import annotations
"""
Learning router — paths, courses, certifications, feed, schedule, hours.
Uses Supabase as the database backend.
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status

from app.database import get_supabase_admin
from app.schemas.learning import (
    LearnerProfileResponse,
    LearningPathResponse,
    LearningPathProgressUpdate,
    CourseResponse,
    CourseProgressUpdate,
    CertificationCreate,
    CertificationResponse,
    LearningFeedItem,
    WeeklyScheduleResponse,
    MonthlyHoursResponse,
    SkillGapsResponse,
    SkillGapItem,
)
from app.services.learning_engine import compute_learning_hours, build_learning_feed, ensure_learning_paths

router = APIRouter(prefix="/api/learning", tags=["Learning"])


def _as_percent(value) -> int:
    try:
        n = int(value or 0)
    except (TypeError, ValueError):
        return 0
    if n <= 10:
        return n * 10
    return max(0, min(100, n))


# ─── Learner Profile ──────────────────────────────────────────

@router.get("/{employee_id}/profile", response_model=LearnerProfileResponse)
def get_learner_profile(employee_id: str):
    """Get learning stats for an employee."""
    sb = get_supabase_admin()

    emp_result = sb.table("employees").select("full_name").eq("id", employee_id).execute()
    if not emp_result.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee = emp_result.data[0]

    # Count completed courses
    completed_result = sb.table("employee_courses").select("id", count="exact").eq(
        "employee_id", employee_id
    ).eq("status", "completed").execute()
    completed = completed_result.count or 0

    # Count in-progress courses
    in_progress_result = sb.table("employee_courses").select("id", count="exact").eq(
        "employee_id", employee_id
    ).eq("status", "in_progress").execute()
    in_progress = in_progress_result.count or 0

    # Get gamification profile for streak
    gam_result = sb.table("gamification_profiles").select("streak_days, longest_streak").eq(
        "employee_id", employee_id
    ).execute()
    gam_profile = gam_result.data[0] if gam_result.data else {}

    # Get active career goal for target role
    goal_result = sb.table("career_goals").select("target_role").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    active_goal = goal_result.data[0] if goal_result.data else None

    hours_month, hours_year, _ = compute_learning_hours(sb, employee_id)
    learning_score = min(100, completed * 12 + in_progress * 5 + min(20, hours_year // 8))

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


# ─── Learning Paths ───────────────────────────────────────────

@router.get("/{employee_id}/paths", response_model=list[LearningPathResponse])
def get_learning_paths(employee_id: str):
    """Get all learning paths for an employee."""
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return ensure_learning_paths(sb, employee_id)


@router.post("/{employee_id}/paths/{path_id}/progress")
def update_path_progress(
    employee_id: str,
    path_id: str,
    data: LearningPathProgressUpdate,
):
    """Update learning path progress."""
    sb = get_supabase_admin()

    existing = sb.table("learning_paths").select("id").eq("id", path_id).eq(
        "employee_id", employee_id
    ).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Learning path not found")

    update_data = {"progress": min(100, data.progress)}
    if data.completed_courses is not None:
        update_data["completed_courses"] = data.completed_courses

    sb.table("learning_paths").update(update_data).eq("id", path_id).execute()

    # 🎮 Gamification: award XP when a course/path is completed
    if update_data["progress"] >= 100:
        try:
            from app.services.gamification_engine import fire_gamification_event
            from app.database import get_supabase_admin
            fire_gamification_event(get_supabase_admin(), employee_id, "course_completed")
        except Exception as gam_err:
            print(f"[gamification] course_completed event error: {gam_err}")

    return {"status": "updated", "progress": update_data["progress"]}


# ─── Skill Gaps ────────────────────────────────────────────────

@router.get("/{employee_id}/skill-gaps", response_model=SkillGapsResponse)
def get_skill_gaps(employee_id: str):
    """Get skill gaps vs target role."""
    sb = get_supabase_admin()

    goal_result = sb.table("career_goals").select("target_role").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    goal = goal_result.data[0] if goal_result.data else None

    skills_result = sb.table("skills").select("*").eq(
        "employee_id", employee_id
    ).gt("target_level", 0).execute()

    gaps = []
    for skill in skills_result.data or []:
        current = _as_percent(skill.get("proficiency"))
        target = _as_percent(skill.get("target_level"))
        gap = max(0, target - current)
        if gap > 0:
            priority = "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
            cat = skill.get("category") or "General"
            gaps.append(SkillGapItem(
                skill=skill["name"],
                current_level=current,
                target_level=target,
                gap=gap,
                priority=priority,
                category=cat,
                color="#7c3aed" if cat == "AI" else "#06b6d4" if cat == "Cloud" else "#f59e0b",
            ))

    gaps.sort(key=lambda x: x.gap, reverse=True)
    return SkillGapsResponse(
        target_role=goal["target_role"] if goal else None,
        gaps=gaps,
    )


# ─── Certifications ───────────────────────────────────────────

@router.get("/{employee_id}/certifications", response_model=list[CertificationResponse])
def get_certifications(employee_id: str):
    """Get certification tracker for an employee."""
    sb = get_supabase_admin()
    result = sb.table("certifications").select("*").eq(
        "employee_id", employee_id
    ).order("status").order("name").execute()
    return result.data


@router.post("/{employee_id}/certifications", response_model=CertificationResponse, status_code=201)
def add_certification(employee_id: str, data: CertificationCreate):
    """Add a new certification to track."""
    sb = get_supabase_admin()
    cert_data = {
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        **data.model_dump(),
    }
    result = sb.table("certifications").insert(cert_data).execute()

    # 🎮 Gamification: award XP + unlock Certified Expert achievement
    try:
        from app.services.gamification_engine import fire_gamification_event
        fire_gamification_event(sb, employee_id, "certification_added")
    except Exception as gam_err:
        print(f"[gamification] certification_added event error: {gam_err}")

    return result.data[0]


# ─── Course Library ────────────────────────────────────────────

@router.get("/courses", response_model=list[CourseResponse])
def list_courses(
    search: str | None = None,
    level: str | None = None,
    employee_id: str | None = None,
):
    """Search the course library. Optionally includes per-employee status."""
    sb = get_supabase_admin()

    query = sb.table("courses").select("*").order("title")
    if search:
        query = query.ilike("title", f"%{search}%")
    if level:
        query = query.eq("level", level)

    result = query.execute()
    courses = result.data or []

    # If employee_id provided, enrich with enrollment status
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


@router.post("/{employee_id}/courses/{course_id}/enroll")
def enroll_in_course(employee_id: str, course_id: str):
    """Enroll an employee in a course."""
    sb = get_supabase_admin()

    # Check not already enrolled
    existing = sb.table("employee_courses").select("id").eq(
        "employee_id", employee_id
    ).eq("course_id", course_id).execute()
    if existing.data:
        return {"status": "already_enrolled", "course_id": course_id}

    sb.table("employee_courses").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "course_id": course_id,
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    # Update course enrolled count
    course_result = sb.table("courses").select("enrolled_count").eq("id", course_id).execute()
    if course_result.data:
        new_count = (course_result.data[0].get("enrolled_count") or 0) + 1
        sb.table("courses").update({"enrolled_count": new_count}).eq("id", course_id).execute()

    return {"status": "enrolled", "course_id": course_id}


@router.patch("/{employee_id}/courses/{course_id}")
def update_course_progress(
    employee_id: str,
    course_id: str,
    data: CourseProgressUpdate,
):
    """Update course progress for an employee."""
    sb = get_supabase_admin()

    ec_result = sb.table("employee_courses").select("*").eq(
        "employee_id", employee_id
    ).eq("course_id", course_id).execute()
    if not ec_result.data:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")

    ec = ec_result.data[0]
    new_progress = min(100, max(0, data.progress))
    update_data = {"progress": new_progress}

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
            print(f"[gamification] course_completed event error: {gam_err}")

        _bump_related_paths(sb, employee_id)

    return {"status": "updated", "progress": new_progress, "completed": newly_completed or ec.get("status") == "completed"}


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


# ─── Weekly Schedule ───────────────────────────────────────────

@router.get("/{employee_id}/schedule", response_model=list[WeeklyScheduleResponse])
def get_weekly_schedule(employee_id: str):
    """Get this week's learning schedule."""
    sb = get_supabase_admin()
    result = sb.table("weekly_schedule_entries").select("*").eq(
        "employee_id", employee_id
    ).order("day").execute()
    return result.data


# ─── Monthly Hours ─────────────────────────────────────────────

@router.get("/{employee_id}/hours", response_model=list[MonthlyHoursResponse])
def get_monthly_hours(employee_id: str):
    """Get monthly learning hours derived from course progress."""
    sb = get_supabase_admin()
    _, _, months = compute_learning_hours(sb, employee_id)
    return [MonthlyHoursResponse(**m) for m in months]


# ─── AI Learning Feed ─────────────────────────────────────────

@router.get("/{employee_id}/feed", response_model=list[LearningFeedItem])
def get_learning_feed(employee_id: str):
    """AI-curated learning feed based on skill gaps and catalog courses."""
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return build_learning_feed(sb, employee_id)


@router.post("/{employee_id}/paths/generate", response_model=list[LearningPathResponse])
def regenerate_learning_paths(employee_id: str):
    """Rebuild recommended paths from current career goal and skill gaps."""
    sb = get_supabase_admin()
    sb.table("learning_paths").delete().eq("employee_id", employee_id).eq("is_ai_recommended", True).execute()
    return ensure_learning_paths(sb, employee_id)

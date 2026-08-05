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
    CertificationCreate,
    CertificationResponse,
    LearningFeedItem,
    WeeklyScheduleResponse,
    MonthlyHoursResponse,
    SkillGapsResponse,
    SkillGapItem,
)

router = APIRouter(prefix="/api/learning", tags=["Learning"])


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

    return LearnerProfileResponse(
        name=employee["full_name"],
        hours_this_month=24,  # TODO: compute from actual learning time tracking
        hours_this_year=187,
        courses_completed=completed,
        courses_in_progress=in_progress,
        current_streak=gam_profile.get("streak_days", 0),
        longest_streak=gam_profile.get("longest_streak", 0),
        learning_score=min(100, completed * 6 + in_progress * 3),
        target_role=active_goal["target_role"] if active_goal else None,
    )


# ─── Learning Paths ───────────────────────────────────────────

@router.get("/{employee_id}/paths", response_model=list[LearningPathResponse])
def get_learning_paths(employee_id: str):
    """Get all learning paths for an employee."""
    sb = get_supabase_admin()
    result = sb.table("learning_paths").select("*").eq(
        "employee_id", employee_id
    ).order("is_ai_recommended", desc=True).order("title").execute()
    return result.data


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
        gap = max(0, skill["target_level"] - skill["proficiency"])
        if gap > 0:
            priority = "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
            cat = skill.get("category") or "General"
            gaps.append(SkillGapItem(
                skill=skill["name"],
                current_level=skill["proficiency"],
                target_level=skill["target_level"],
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
        raise HTTPException(status_code=409, detail="Already enrolled")

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
    progress: int,
):
    """Update course progress for an employee."""
    sb = get_supabase_admin()

    ec_result = sb.table("employee_courses").select("*").eq(
        "employee_id", employee_id
    ).eq("course_id", course_id).execute()
    if not ec_result.data:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")

    ec = ec_result.data[0]
    new_progress = min(100, progress)
    update_data = {"progress": new_progress}

    if new_progress >= 100 and ec.get("status") != "completed":
        update_data["status"] = "completed"
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

    sb.table("employee_courses").update(update_data).eq("id", ec["id"]).execute()
    return {"status": "updated", "progress": new_progress}


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
    """Get monthly learning hours (placeholder — returns static data until time tracking is implemented)."""
    # TODO: compute from actual learning activity tracking
    return [
        MonthlyHoursResponse(month="Feb", hours=18),
        MonthlyHoursResponse(month="Mar", hours=26),
        MonthlyHoursResponse(month="Apr", hours=21),
        MonthlyHoursResponse(month="May", hours=32),
        MonthlyHoursResponse(month="Jun", hours=28),
        MonthlyHoursResponse(month="Jul", hours=24),
    ]


# ─── AI Learning Feed ─────────────────────────────────────────

@router.get("/{employee_id}/feed", response_model=list[LearningFeedItem])
def get_learning_feed(employee_id: str):
    """AI-curated learning feed based on skill gaps. 
    (Placeholder — will be replaced by ML model in Phase 6)."""
    # TODO: Replace with content recommender model
    return [
        LearningFeedItem(id="lf1", type="article", title="RAG vs Fine-tuning: When to Use Each for Production LLMs",
                         source="Towards Data Science", read_time="8 min", relevance=98,
                         tags=["LLM", "AI Engineering"], emoji="📰", color="#7c3aed", published="2 hours ago"),
        LearningFeedItem(id="lf2", type="video", title="Advanced Kubernetes Patterns for ML Workloads",
                         source="KubeCon 2024", read_time="32 min", relevance=91,
                         tags=["Kubernetes", "MLOps"], emoji="🎬", color="#06b6d4", published="1 day ago"),
        LearningFeedItem(id="lf3", type="course", title="Vector Embeddings & Semantic Search Fundamentals",
                         source="DeepLearning.AI", read_time="4 hours", relevance=96,
                         tags=["Vector DB", "Embeddings"], emoji="🎓", color="#10b981", published="3 days ago"),
    ]

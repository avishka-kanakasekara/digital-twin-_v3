from __future__ import annotations
"""
Learning router — paths, courses, certifications, feed, schedule, hours.
"""


from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.employee import Employee
from app.models.learning import LearningPath, Course, EmployeeCourse, Certification, WeeklyScheduleEntry
from app.models.gamification import GamificationProfile
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
)

router = APIRouter(prefix="/api/learning", tags=["Learning"])


# ─── Learner Profile ──────────────────────────────────────────

@router.get("/{employee_id}/profile", response_model=LearnerProfileResponse)
def get_learner_profile(employee_id: str, db: Session = Depends(get_db)):
    """Get learning stats for an employee."""
    emp = db.execute(select(Employee).where(Employee.id == employee_id))
    employee = emp.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Count completed courses
    completed = db.execute(
        select(func.count()).where(
            EmployeeCourse.employee_id == employee_id,
            EmployeeCourse.status == "completed"
        )
    ).scalar_one()

    in_progress = db.execute(
        select(func.count()).where(
            EmployeeCourse.employee_id == employee_id,
            EmployeeCourse.status == "in_progress"
        )
    ).scalar_one()

    # Get gamification profile for streak
    gam = db.execute(
        select(GamificationProfile).where(GamificationProfile.employee_id == employee_id)
    )
    gam_profile = gam.scalar_one_or_none()

    # Get active career goal for target role
    from app.models.career import CareerGoal
    goal = db.execute(
        select(CareerGoal).where(CareerGoal.employee_id == employee_id, CareerGoal.is_active == True)
    )
    active_goal = goal.scalar_one_or_none()

    return LearnerProfileResponse(
        name=employee.full_name,
        hours_this_month=24,  # TODO: compute from actual learning time tracking
        hours_this_year=187,
        courses_completed=completed,
        courses_in_progress=in_progress,
        current_streak=gam_profile.streak_days if gam_profile else 0,
        longest_streak=gam_profile.longest_streak if gam_profile else 0,
        learning_score=min(100, completed * 6 + in_progress * 3),
        target_role=active_goal.target_role if active_goal else None,
    )


# ─── Learning Paths ───────────────────────────────────────────

@router.get("/{employee_id}/paths", response_model=list[LearningPathResponse])
def get_learning_paths(employee_id: str, db: Session = Depends(get_db)):
    """Get all learning paths for an employee."""
    result = db.execute(
        select(LearningPath)
        .where(LearningPath.employee_id == employee_id)
        .order_by(desc(LearningPath.is_ai_recommended), LearningPath.title)
    )
    return result.scalars().all()


@router.post("/{employee_id}/paths/{path_id}/progress")
def update_path_progress(
    employee_id: str,
    path_id: str,
    data: LearningPathProgressUpdate,
    db: Session = Depends(get_db),
):
    """Update learning path progress."""
    result = db.execute(
        select(LearningPath)
        .where(LearningPath.id == path_id, LearningPath.employee_id == employee_id)
    )
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    path.progress = min(100, data.progress)
    if data.completed_courses is not None:
        path.completed_courses = data.completed_courses

    return {"status": "updated", "progress": path.progress}


# ─── Skill Gaps ────────────────────────────────────────────────

@router.get("/{employee_id}/skill-gaps")
def get_skill_gaps(employee_id: str, db: Session = Depends(get_db)):
    """Get skill gaps vs target role."""
    from app.models.skill import Skill

    skills = db.execute(
        select(Skill).where(Skill.employee_id == employee_id, Skill.target_level > 0)
    )
    gaps = []
    for skill in skills.scalars().all():
        gap = max(0, skill.target_level - skill.proficiency)
        if gap > 0:
            priority = "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
            gaps.append({
                "skill": skill.name,
                "current_level": skill.proficiency,
                "target_level": skill.target_level,
                "gap": gap,
                "priority": priority,
                "category": skill.category or "General",
                "color": "#7c3aed" if skill.category == "AI" else "#06b6d4" if skill.category == "Cloud" else "#f59e0b",
            })

    # Sort by gap descending
    gaps.sort(key=lambda x: x["gap"], reverse=True)
    return gaps


# ─── Certifications ───────────────────────────────────────────

@router.get("/{employee_id}/certifications", response_model=list[CertificationResponse])
def get_certifications(employee_id: str, db: Session = Depends(get_db)):
    """Get certification tracker for an employee."""
    result = db.execute(
        select(Certification)
        .where(Certification.employee_id == employee_id)
        .order_by(Certification.status, Certification.name)
    )
    return result.scalars().all()


@router.post("/{employee_id}/certifications", response_model=CertificationResponse, status_code=201)
def add_certification(
    employee_id: str, data: CertificationCreate, db: Session = Depends(get_db)
):
    """Add a new certification to track."""
    cert = Certification(employee_id=employee_id, **data.model_dump())
    db.add(cert)
    db.flush()
    return cert


# ─── Course Library ────────────────────────────────────────────

@router.get("/courses", response_model=list[CourseResponse])
def list_courses(
    search: str | None = None,
    level: str | None = None,
    employee_id: str | None = None,
    db: Session = Depends(get_db),
):
    """Search the course library. Optionally includes per-employee status."""
    query = select(Course).order_by(Course.title)

    if search:
        query = query.where(Course.title.ilike(f"%{search}%"))
    if level:
        query = query.where(Course.level == level)

    result = db.execute(query)
    courses = result.scalars().all()

    # If employee_id provided, enrich with enrollment status
    response = []
    for course in courses:
        course_data = CourseResponse.model_validate(course)
        if employee_id:
            enrollment = db.execute(
                select(EmployeeCourse)
                .where(EmployeeCourse.employee_id == employee_id, EmployeeCourse.course_id == course.id)
            )
            ec = enrollment.scalar_one_or_none()
            if ec:
                course_data.status = ec.status
                course_data.progress = ec.progress
        response.append(course_data)

    return response


@router.post("/{employee_id}/courses/{course_id}/enroll")
def enroll_in_course(employee_id: str, course_id: str, db: Session = Depends(get_db)):
    """Enroll an employee in a course."""
    # Check not already enrolled
    existing = db.execute(
        select(EmployeeCourse)
        .where(EmployeeCourse.employee_id == employee_id, EmployeeCourse.course_id == course_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already enrolled")

    ec = EmployeeCourse(
        employee_id=employee_id,
        course_id=course_id,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
    )
    db.add(ec)

    # Update course enrolled count
    course = db.execute(select(Course).where(Course.id == course_id))
    c = course.scalar_one_or_none()
    if c:
        c.enrolled_count += 1

    return {"status": "enrolled", "course_id": str(course_id)}


@router.patch("/{employee_id}/courses/{course_id}")
def update_course_progress(
    employee_id: str,
    course_id: str,
    progress: int,
    db: Session = Depends(get_db),
):
    """Update course progress for an employee."""
    result = db.execute(
        select(EmployeeCourse)
        .where(EmployeeCourse.employee_id == employee_id, EmployeeCourse.course_id == course_id)
    )
    ec = result.scalar_one_or_none()
    if not ec:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")

    ec.progress = min(100, progress)
    if ec.progress >= 100 and ec.status != "completed":
        ec.status = "completed"
        ec.completed_at = datetime.now(timezone.utc)

    return {"status": "updated", "progress": ec.progress}


# ─── Weekly Schedule ───────────────────────────────────────────

@router.get("/{employee_id}/schedule", response_model=list[WeeklyScheduleResponse])
def get_weekly_schedule(employee_id: str, db: Session = Depends(get_db)):
    """Get this week's learning schedule."""
    result = db.execute(
        select(WeeklyScheduleEntry)
        .where(WeeklyScheduleEntry.employee_id == employee_id)
        .order_by(WeeklyScheduleEntry.day)
    )
    return result.scalars().all()


# ─── Monthly Hours ─────────────────────────────────────────────

@router.get("/{employee_id}/hours", response_model=list[MonthlyHoursResponse])
def get_monthly_hours(employee_id: str, db: Session = Depends(get_db)):
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
def get_learning_feed(employee_id: str, db: Session = Depends(get_db)):
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

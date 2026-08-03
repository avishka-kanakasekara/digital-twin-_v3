from __future__ import annotations
"""
Career Coach router — goals, roadmaps, readiness, market trends.
"""


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.career import CareerGoal, CareerRoadmapStep
from app.models.skill import Skill
from app.schemas.career import (
    CareerGoalCreate,
    CareerGoalResponse,
    SkillGapResponse,
    MarketTrendResponse,
    CareerRecommendationResponse,
)

router = APIRouter(prefix="/api/career", tags=["Career Coach"])


# ─── Career Goals ──────────────────────────────────────────────

@router.get("/{employee_id}/goal", response_model=CareerGoalResponse | None)
def get_active_career_goal(employee_id: str, db: Session = Depends(get_db)):
    """Get the current active career goal for an employee."""
    result = db.execute(
        select(CareerGoal)
        .where(CareerGoal.employee_id == employee_id, CareerGoal.is_active == True)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        return None

    # Load roadmap steps
    steps_result = db.execute(
        select(CareerRoadmapStep)
        .where(CareerRoadmapStep.career_goal_id == goal.id)
        .order_by(CareerRoadmapStep.step_order)
    )
    goal_dict = CareerGoalResponse.model_validate(goal)
    goal_dict.roadmap_steps = [
        {"id": s.id, "step_order": s.step_order, "title": s.title,
         "status": s.status, "description": s.description}
        for s in steps_result.scalars().all()
    ]
    return goal_dict


@router.post("/{employee_id}/goal", response_model=CareerGoalResponse, status_code=201)
def set_career_goal(
    employee_id: str, data: CareerGoalCreate, db: Session = Depends(get_db)
):
    """Create or update the active career goal."""
    # Deactivate any existing active goal
    existing = db.execute(
        select(CareerGoal)
        .where(CareerGoal.employee_id == employee_id, CareerGoal.is_active == True)
    )
    for old in existing.scalars().all():
        old.is_active = False

    # Create new goal
    goal = CareerGoal(
        employee_id=employee_id,
        target_role=data.target_role,
        timeline=data.timeline,
        focus_area=data.focus_area,
        target_industry=data.target_industry,
    )
    db.add(goal)
    db.flush()

    # Auto-generate roadmap steps based on target role
    steps = _generate_roadmap_steps(data.target_role)
    for i, step_data in enumerate(steps):
        step = CareerRoadmapStep(
            career_goal_id=goal.id,
            step_order=i + 1,
            title=step_data["title"],
            status=step_data["status"],
            description=step_data.get("description"),
        )
        db.add(step)

    # TODO: Compute readiness score with ML model (Phase 4)
    goal.readiness_score = 65  # Placeholder

    return goal


# ─── Skill Gaps (Career-specific) ─────────────────────────────

@router.get("/{employee_id}/skill-gaps", response_model=list[SkillGapResponse])
def get_career_skill_gaps(employee_id: str, db: Session = Depends(get_db)):
    """Skill gap analysis relative to the active career goal."""
    # Get target role
    goal = db.execute(
        select(CareerGoal)
        .where(CareerGoal.employee_id == employee_id, CareerGoal.is_active == True)
    )
    active_goal = goal.scalar_one_or_none()

    # Get employee skills
    skills = db.execute(
        select(Skill).where(Skill.employee_id == employee_id)
    )
    skill_map = {s.name: s for s in skills.scalars().all()}

    # Define required skills per role (hardcoded for now — ML model in Phase 4)
    target_role = active_goal.target_role if active_goal else "Cloud Architect"
    required_skills = _get_role_requirements(target_role)

    gaps = []
    for req in required_skills:
        current = skill_map.get(req["name"])
        current_level = current.proficiency if current else 0
        target_level = req["target"]
        gap = max(0, target_level - current_level)
        if gap > 0:
            gaps.append(SkillGapResponse(
                skill=req["name"],
                current_level=current_level,
                target_level=target_level,
                gap=gap,
                priority="Critical" if gap >= 40 else "High" if gap >= 25 else "Medium",
                category=req.get("category", "General"),
                color=req.get("color", "#7c3aed"),
            ))

    gaps.sort(key=lambda x: x.gap, reverse=True)
    return gaps


# ─── Career Recommendations ───────────────────────────────────

@router.get("/{employee_id}/recommendations", response_model=list[CareerRecommendationResponse])
def get_career_recommendations(employee_id: str, db: Session = Depends(get_db)):
    """AI-recommended learning for career goal. (Placeholder — ML model in Phase 4)."""
    return [
        CareerRecommendationResponse(
            id="cr1", title="Advanced EKS Architecture",
            provider="Coursera", duration="12 hours",
            readiness_impact="+15% Readiness",
            description="Directly closes your AWS EKS skill gap. 85% of Cloud Architects have completed this.",
            is_top_match=True,
        ),
        CareerRecommendationResponse(
            id="cr2", title="Enterprise System Design",
            provider="Internal Academy", duration="8 hours",
            readiness_impact="+20% Readiness",
            description="Required knowledge for Architect transitions. Covers high-availability microservices.",
            is_top_match=False,
        ),
    ]


# ─── Readiness Score ───────────────────────────────────────────

@router.post("/{employee_id}/readiness")
def compute_readiness(employee_id: str, db: Session = Depends(get_db)):
    """Compute career readiness score. (Placeholder — ML model in Phase 4)."""
    # TODO: Replace with trained XGBoost model
    return {"readiness_score": 65, "model": "placeholder", "note": "ML model coming in Phase 4"}


# ─── Market Trends ─────────────────────────────────────────────

@router.get("/market-trends", response_model=list[MarketTrendResponse])
def get_market_trends():
    """Get market demand trends for skills. (Placeholder — scraper in Phase 6)."""
    return [
        MarketTrendResponse(skill="Kubernetes", demand_change="+14%", trend="rising", category="Platform Eng."),
        MarketTrendResponse(skill="GenAI Architecture", demand_change="+45%", trend="rising", category="Data / Cloud Eng."),
        MarketTrendResponse(skill="React & Next.js", demand_change="Stable", trend="stable", category="Frontend"),
    ]


# ─── Helpers ───────────────────────────────────────────────────

def _generate_roadmap_steps(target_role: str) -> list[dict]:
    """Generate roadmap steps for a target role. (Hardcoded templates — ML in Phase 4)."""
    templates = {
        "Cloud Architect": [
            {"title": "Senior Cloud Engineer", "status": "achieved"},
            {"title": "Lead Cloud Projects", "status": "in_progress"},
            {"title": "System Design Mastery", "status": "upcoming"},
            {"title": "Cloud Architect", "status": "goal"},
        ],
        "Engineering Manager": [
            {"title": "Senior Engineer", "status": "achieved"},
            {"title": "Tech Lead", "status": "in_progress"},
            {"title": "People Management", "status": "upcoming"},
            {"title": "Engineering Manager", "status": "goal"},
        ],
        "Principal Engineer": [
            {"title": "Senior Engineer", "status": "achieved"},
            {"title": "Staff Engineer", "status": "in_progress"},
            {"title": "Company-wide Impact", "status": "upcoming"},
            {"title": "Principal Engineer", "status": "goal"},
        ],
    }
    return templates.get(target_role, [
        {"title": "Current Role", "status": "achieved"},
        {"title": "Build Key Skills", "status": "in_progress"},
        {"title": "Gain Experience", "status": "upcoming"},
        {"title": target_role, "status": "goal"},
    ])


def _get_role_requirements(role: str) -> list[dict]:
    """Get required skills for a role. (Hardcoded — ML model in Phase 4)."""
    requirements = {
        "Cloud Architect": [
            {"name": "AWS Architecture", "target": 95, "category": "Cloud", "color": "#f59e0b"},
            {"name": "Enterprise System Design", "target": 90, "category": "Engineering", "color": "#06b6d4"},
            {"name": "Kubernetes", "target": 85, "category": "Technical", "color": "#7c3aed"},
            {"name": "Terraform", "target": 90, "category": "Technical", "color": "#10b981"},
            {"name": "Cloud Security", "target": 85, "category": "Cloud", "color": "#f59e0b"},
        ],
        "Principal AI Engineer": [
            {"name": "LLM Fine-tuning", "target": 90, "category": "AI", "color": "#7c3aed"},
            {"name": "Kubernetes", "target": 85, "category": "Technical", "color": "#06b6d4"},
            {"name": "Strategic Planning", "target": 80, "category": "Leadership", "color": "#f59e0b"},
            {"name": "Vector Databases", "target": 80, "category": "AI", "color": "#7c3aed"},
            {"name": "System Design", "target": 90, "category": "Engineering", "color": "#06b6d4"},
        ],
    }
    return requirements.get(role, [
        {"name": "Communication", "target": 80, "category": "Soft", "color": "#10b981"},
        {"name": "Problem Solving", "target": 80, "category": "Soft", "color": "#06b6d4"},
    ])

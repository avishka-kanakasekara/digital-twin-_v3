from __future__ import annotations
"""
Career Coach router — goals, roadmaps, readiness, market trends.
Uses Supabase as the database backend.
"""

import uuid
from fastapi import APIRouter, HTTPException

from app.database import get_supabase_admin
from app.schemas.career import (
    CareerGoalCreate,
    CareerGoalResponse,
    CareerRoadmapStepResponse,
    SkillGapResponse,
    MarketTrendResponse,
    CareerRecommendationResponse,
)

router = APIRouter(prefix="/api/career", tags=["Career Coach"])


# ─── Career Goals ──────────────────────────────────────────────

@router.get("/{employee_id}/goal", response_model=CareerGoalResponse | None)
def get_active_career_goal(employee_id: str):
    """Get the current active career goal for an employee."""
    sb = get_supabase_admin()

    result = sb.table("career_goals").select("*").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()

    if not result.data:
        return None
    goal = result.data[0]

    # Load roadmap steps
    steps_result = sb.table("career_roadmap_steps").select("*").eq(
        "career_goal_id", goal["id"]
    ).order("step_order").execute()

    goal_response = CareerGoalResponse(
        id=goal["id"],
        target_role=goal["target_role"],
        timeline=goal.get("timeline"),
        focus_area=goal.get("focus_area"),
        target_industry=goal.get("target_industry"),
        readiness_score=goal.get("readiness_score", 0),
        is_active=goal.get("is_active", True),
    )
    goal_response.roadmap_steps = [
        CareerRoadmapStepResponse(
            id=s["id"],
            step_order=s["step_order"],
            title=s["title"],
            status="completed" if s.get("status") == "achieved" else s.get("status", "upcoming"),
            description=s.get("description"),
        )
        for s in (steps_result.data or [])
    ]
    return goal_response


@router.get("/{employee_id}/roadmap", response_model=list[CareerRoadmapStepResponse])
def get_career_roadmap(employee_id: str):
    """Get roadmap steps for the active career goal."""
    sb = get_supabase_admin()

    goal_result = sb.table("career_goals").select("id").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    if not goal_result.data:
        return []

    goal_id = goal_result.data[0]["id"]
    steps_result = sb.table("career_roadmap_steps").select("*").eq(
        "career_goal_id", goal_id
    ).order("step_order").execute()

    return [
        CareerRoadmapStepResponse(
            id=s["id"],
            step_order=s["step_order"],
            title=s["title"],
            status="completed" if s.get("status") == "achieved" else s.get("status", "upcoming"),
            description=s.get("description"),
        )
        for s in (steps_result.data or [])
    ]


@router.post("/{employee_id}/goal", response_model=CareerGoalResponse, status_code=201)
def set_career_goal(employee_id: str, data: CareerGoalCreate):
    """Create or update the active career goal."""
    sb = get_supabase_admin()

    # Deactivate any existing active goals
    existing = sb.table("career_goals").select("id").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    for old in existing.data or []:
        sb.table("career_goals").update({"is_active": False}).eq("id", old["id"]).execute()

    # Create new goal
    goal_id = str(uuid.uuid4())
    goal_data = {
        "id": goal_id,
        "employee_id": employee_id,
        "target_role": data.target_role,
        "timeline": data.timeline,
        "focus_area": data.focus_area,
        "target_industry": data.target_industry,
        "readiness_score": 65,  # Placeholder — ML model in Phase 4
    }
    sb.table("career_goals").insert(goal_data).execute()

    # Auto-generate roadmap steps
    steps = _generate_roadmap_steps(data.target_role)
    for i, step_data in enumerate(steps):
        sb.table("career_roadmap_steps").insert({
            "id": str(uuid.uuid4()),
            "career_goal_id": goal_id,
            "step_order": i + 1,
            "title": step_data["title"],
            "status": step_data["status"],
            "description": step_data.get("description"),
        }).execute()

    return CareerGoalResponse(
        id=goal_id,
        target_role=data.target_role,
        timeline=data.timeline,
        focus_area=data.focus_area,
        target_industry=data.target_industry,
        readiness_score=65,
        is_active=True,
    )


# ─── Skill Gaps (Career-specific) ─────────────────────────────

@router.get("/{employee_id}/skill-gaps", response_model=list[SkillGapResponse])
def get_career_skill_gaps(employee_id: str):
    """Skill gap analysis relative to the active career goal."""
    sb = get_supabase_admin()

    # Get target role
    goal_result = sb.table("career_goals").select("target_role").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    active_goal = goal_result.data[0] if goal_result.data else None

    # Get employee skills
    skills_result = sb.table("skills").select("name, proficiency").eq(
        "employee_id", employee_id
    ).execute()
    skill_map = {s["name"]: s for s in (skills_result.data or [])}

    # Define required skills per role
    target_role = active_goal["target_role"] if active_goal else "Cloud Architect"
    required_skills = _get_role_requirements(target_role)

    gaps = []
    for req in required_skills:
        current = skill_map.get(req["name"])
        current_level = current["proficiency"] if current else 0
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
def get_career_recommendations(employee_id: str):
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
def compute_readiness(employee_id: str):
    """Compute career readiness score. (Placeholder — ML model in Phase 4)."""
    # TODO: Replace with trained XGBoost model
    return {"readiness_score": 65, "model": "placeholder", "note": "ML model coming in Phase 4"}


# ─── Market Trends ─────────────────────────────────────────────

@router.get("/market-trends", response_model=list[MarketTrendResponse])
def get_market_trends():
    """Get market demand trends for skills."""
    return [
        MarketTrendResponse(skill="Kubernetes", category="Platform Eng.", trend="+14%", color="#059669"),
        MarketTrendResponse(skill="GenAI Architecture", category="Data / Cloud Eng.", trend="+45%", color="#059669"),
        MarketTrendResponse(skill="React & Next.js", category="Frontend", trend="Stable", color="#64748b"),
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

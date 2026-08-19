from __future__ import annotations
"""
Career Coach router — goals, roadmaps, readiness, market trends.
Uses Supabase as the database backend and Gemini for AI intelligence.
"""

import uuid
from fastapi import APIRouter, HTTPException

from app.database import get_supabase_admin
from app.config import settings
from app.schemas.career import (
    CareerGoalCreate,
    CareerGoalResponse,
    CareerRoadmapStepResponse,
    SkillGapResponse,
    MarketTrendResponse,
    CareerRecommendationResponse,
    CareerAnalysisResponse,
    CareerChatRequest,
    CareerChatResponse,
)
from app.services.career_coach import generate_career_analysis, generate_career_chat

router = APIRouter(prefix="/api/career", tags=["Career Coach"])

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

    # Generate AI analysis
    analysis = generate_career_analysis(employee_id, data.target_role, sb, settings.GOOGLE_API_KEY)

    # Create new goal
    goal_id = str(uuid.uuid4())
    goal_data = {
        "id": goal_id,
        "employee_id": employee_id,
        "target_role": data.target_role,
        "timeline": data.timeline,
        "focus_area": data.focus_area,
        "target_industry": data.target_industry,
        "readiness_score": analysis.readiness_score,
    }
    sb.table("career_goals").insert(goal_data).execute()

    # Auto-generate roadmap steps from AI
    for i, step_data in enumerate(analysis.roadmap_steps):
        sb.table("career_roadmap_steps").insert({
            "id": str(uuid.uuid4()),
            "career_goal_id": goal_id,
            "step_order": step_data.step_order,
            "title": step_data.title,
            "status": step_data.status,
            "description": step_data.description,
        }).execute()

    return CareerGoalResponse(
        id=goal_id,
        target_role=data.target_role,
        timeline=data.timeline,
        focus_area=data.focus_area,
        target_industry=data.target_industry,
        readiness_score=analysis.readiness_score,
        is_active=True,
    )


@router.get("/{employee_id}/analysis", response_model=CareerAnalysisResponse)
def get_career_analysis(employee_id: str):
    """Get full AI-generated career analysis."""
    sb = get_supabase_admin()
    
    # Get active goal
    goal_result = sb.table("career_goals").select("target_role").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    
    target_role = goal_result.data[0]["target_role"] if goal_result.data else "Senior Software Engineer"
    
    # Generate and return analysis
    return generate_career_analysis(employee_id, target_role, sb, settings.GOOGLE_API_KEY)


@router.post("/{employee_id}/chat", response_model=CareerChatResponse)
def chat_with_career_coach(employee_id: str, request: CareerChatRequest):
    """AI Career Coach conversational endpoint."""
    sb = get_supabase_admin()
    response_text = generate_career_chat(
        employee_id, 
        request.message, 
        request.history, 
        sb, 
        settings.GOOGLE_API_KEY
    )
    return CareerChatResponse(response=response_text)


# Backwards compatibility endpoints for the old UI parts (optional, but good to keep if some old components use them)
@router.get("/{employee_id}/roadmap", response_model=list[CareerRoadmapStepResponse])
def get_career_roadmap(employee_id: str):
    sb = get_supabase_admin()
    goal_result = sb.table("career_goals").select("id").eq("employee_id", employee_id).eq("is_active", True).execute()
    if not goal_result.data: return []
    steps_result = sb.table("career_roadmap_steps").select("*").eq("career_goal_id", goal_result.data[0]["id"]).order("step_order").execute()
    return [CareerRoadmapStepResponse(**s) for s in (steps_result.data or [])]

@router.get("/{employee_id}/skill-gaps", response_model=list[SkillGapResponse])
def get_career_skill_gaps(employee_id: str):
    sb = get_supabase_admin()
    goal_result = sb.table("career_goals").select("target_role").eq("employee_id", employee_id).eq("is_active", True).execute()
    target_role = goal_result.data[0]["target_role"] if goal_result.data else "Engineer"
    analysis = generate_career_analysis(employee_id, target_role, sb, settings.GOOGLE_API_KEY)
    return analysis.skill_gaps

@router.get("/{employee_id}/recommendations", response_model=list[CareerRecommendationResponse])
def get_career_recommendations(employee_id: str):
    sb = get_supabase_admin()
    goal_result = sb.table("career_goals").select("target_role").eq("employee_id", employee_id).eq("is_active", True).execute()
    target_role = goal_result.data[0]["target_role"] if goal_result.data else "Engineer"
    analysis = generate_career_analysis(employee_id, target_role, sb, settings.GOOGLE_API_KEY)
    return analysis.recommendations

@router.get("/market-trends", response_model=list[MarketTrendResponse])
def get_market_trends():
    return [
        MarketTrendResponse(skill="Generative AI", category="AI/ML", trend="+45%", color="#10b981"),
        MarketTrendResponse(skill="System Design", category="Architecture", trend="+15%", color="#10b981"),
        MarketTrendResponse(skill="React", category="Frontend", trend="Stable", color="#64748b"),
    ]

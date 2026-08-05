"""
Career schemas — goals, roadmaps, skill gaps, market trends.
"""

from pydantic import BaseModel

from datetime import datetime


class CareerGoalCreate(BaseModel):
    target_role: str
    timeline: str | None = None
    focus_area: str | None = None
    target_industry: str | None = None


class CareerGoalResponse(BaseModel):
    id: str
    target_role: str
    timeline: str | None = None
    focus_area: str | None = None
    target_industry: str | None = None
    readiness_score: int = 0
    is_active: bool = True
    roadmap_steps: list["CareerRoadmapStepResponse"] = []

    model_config = {"from_attributes": True}


class CareerRoadmapStepResponse(BaseModel):
    id: str
    step_order: int
    title: str
    status: str = "upcoming"
    description: str | None = None

    model_config = {"from_attributes": True}


class SkillGapResponse(BaseModel):
    skill: str
    current_level: int = 0
    target_level: int = 0
    gap: int = 0
    priority: str = "Medium"
    category: str | None = None
    color: str | None = None


class MarketTrendResponse(BaseModel):
    skill: str
    category: str | None = None
    trend: str  # display string e.g. "+14%" or "Stable"
    color: str = "#64748b"


class CareerRecommendationResponse(BaseModel):
    id: str
    title: str
    provider: str | None = None
    duration: str | None = None
    readiness_impact: str | None = None
    description: str | None = None
    is_top_match: bool = False

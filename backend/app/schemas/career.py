from __future__ import annotations
"""
Career schemas — goals, roadmaps, skill gaps, market trends.
"""

from typing import Optional, List
from pydantic import BaseModel

from datetime import datetime


class CareerGoalCreate(BaseModel):
    target_role: str
    timeline: Optional[str] = None
    focus_area: Optional[str] = None
    target_industry: Optional[str] = None


class CareerGoalResponse(BaseModel):
    id: str
    target_role: str
    timeline: Optional[str] = None
    focus_area: Optional[str] = None
    target_industry: Optional[str] = None
    readiness_score: int = 0
    is_active: bool = True
    roadmap_steps: list["CareerRoadmapStepResponse"] = []

    model_config = {"from_attributes": True}


class CareerRoadmapStepResponse(BaseModel):
    id: str
    step_order: int
    title: str
    status: str = "upcoming"
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class SkillGapResponse(BaseModel):
    skill: str
    current_level: int = 0
    target_level: int = 0
    gap: int = 0
    priority: str = "Medium"
    category: Optional[str] = None
    color: Optional[str] = None


class MarketTrendResponse(BaseModel):
    skill: str
    category: str | None = None
    trend: str  # display string e.g. "+14%" or "Stable"
    color: str = "#64748b"


class CareerRecommendationResponse(BaseModel):
    id: str
    title: str
    provider: Optional[str] = None
    duration: Optional[str] = None
    readiness_impact: Optional[str] = None
    description: Optional[str] = None
    is_top_match: bool = False

class CareerStrength(BaseModel):
    title: str
    description: str

class CareerAnalysisResponse(BaseModel):
    readiness_score: int
    strengths: List[CareerStrength]
    opportunities: List[CareerStrength]
    skill_gaps: List[SkillGapResponse]
    roadmap_steps: List[CareerRoadmapStepResponse]
    recommendations: List[CareerRecommendationResponse]
    market_trends: List[MarketTrendResponse]
    narrative: str

class CareerChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class CareerChatRequest(BaseModel):
    message: str
    history: List[CareerChatMessage] = []

class CareerChatResponse(BaseModel):
    response: str

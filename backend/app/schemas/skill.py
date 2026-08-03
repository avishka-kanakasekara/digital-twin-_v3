"""
Skill schemas.
"""

from pydantic import BaseModel

from datetime import datetime


class SkillCreate(BaseModel):
    name: str
    category: str | None = None
    sub_category: str | None = None
    icon: str | None = None
    proficiency: int = 0
    target_level: int = 0
    years_experience: float | None = None
    trend: str = "stable"
    ai_confidence: int | None = None
    verified: bool = False
    source: str | None = None
    ai_recommendation: str | None = None


class SkillUpdate(BaseModel):
    proficiency: int | None = None
    target_level: int | None = None
    trend: str | None = None
    verified: bool | None = None
    source: str | None = None
    ai_recommendation: str | None = None


class SkillResponse(BaseModel):
    id: str
    employee_id: str
    name: str
    category: str | None = None
    sub_category: str | None = None
    icon: str | None = None
    proficiency: int = 0
    target_level: int = 0
    years_experience: float | None = None
    trend: str = "stable"
    ai_confidence: int | None = None
    verified: bool = False
    source: str | None = None
    ai_recommendation: str | None = None
    last_updated: datetime | None = None

    model_config = {"from_attributes": True}

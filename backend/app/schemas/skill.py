from __future__ import annotations
"""
Skill schemas.
"""

from typing import Optional
from pydantic import BaseModel

from datetime import datetime


class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    icon: Optional[str] = None
    proficiency: int = 0
    target_level: int = 0
    years_experience: Optional[float] = None
    trend: str = "stable"
    ai_confidence: Optional[int] = None
    verified: bool = False
    source: Optional[str] = None
    ai_recommendation: Optional[str] = None


class SkillUpdate(BaseModel):
    proficiency: Optional[int] = None
    target_level: Optional[int] = None
    trend: Optional[str] = None
    verified: Optional[bool] = None
    source: Optional[str] = None
    ai_recommendation: Optional[str] = None


class SkillResponse(BaseModel):
    id: str
    employee_id: str
    name: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    icon: Optional[str] = None
    proficiency: int = 0
    target_level: int = 0
    years_experience: Optional[float] = None
    trend: str = "stable"
    ai_confidence: Optional[int] = None
    verified: bool = False
    source: Optional[str] = None
    ai_recommendation: Optional[str] = None
    last_updated: Optional[datetime] = None

    model_config = {"from_attributes": True}

from __future__ import annotations
"""
Learning schemas — paths, courses, certifications, feed, schedule, AI coach.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field


class LearnerProfileResponse(BaseModel):
    name: str
    hours_this_month: int = 0
    hours_this_year: int = 0
    courses_completed: int = 0
    courses_in_progress: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    learning_score: int = 0
    target_role: Optional[str] = None

    model_config = {"from_attributes": True}


class LearningPathResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    progress: int = 0
    total_courses: int = 0
    completed_courses: int = 0
    estimated_hours: Optional[float] = None
    due_date: Optional[str] = None
    tags: Optional[list] = None
    color: Optional[str] = None
    is_ai_recommended: bool = False
    platform: Optional[str] = None
    instructor: Optional[str] = None
    course_ids: Optional[list] = None
    ai_rationale: Optional[str] = None

    model_config = {"from_attributes": True}


class CourseProgressUpdate(BaseModel):
    progress: int = Field(ge=0, le=100)


class LearningPathProgressUpdate(BaseModel):
    progress: int = Field(ge=0, le=100)
    completed_courses: Optional[int] = None


class PathGenerateRequest(BaseModel):
    goal: Optional[str] = Field(default=None, max_length=200)


class CourseResponse(BaseModel):
    id: str
    title: str
    provider: Optional[str] = None
    hours: Optional[float] = None
    level: Optional[str] = None
    rating: Optional[float] = None
    enrolled_count: int = 0
    tags: Optional[list] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    status: str = "available"
    progress: int = 0
    relevance: Optional[int] = None

    model_config = {"from_attributes": True}


class CertificationCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    status: str = "planned"
    score: Optional[int] = None
    progress: int = 0
    credential_id: Optional[str] = None
    exam_date: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None


class CertificationResponse(BaseModel):
    id: str
    name: str
    issuer: Optional[str] = None
    status: str = "planned"
    score: Optional[int] = None
    progress: int = 0
    credential_id: Optional[str] = None
    completed_date: Optional[str] = None
    expiry_date: Optional[str] = None
    exam_date: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None

    model_config = {"from_attributes": True}


class LearningFeedItem(BaseModel):
    id: str
    type: str
    title: str
    source: str
    read_time: str
    relevance: int = 0
    tags: list = []
    emoji: Optional[str] = None
    color: Optional[str] = None
    published: Optional[str] = None

    model_config = {"from_attributes": True}


class WeeklyScheduleResponse(BaseModel):
    day: str
    topic: str
    duration: str
    status: str = "upcoming"
    color: Optional[str] = None

    model_config = {"from_attributes": True}


class MonthlyHoursResponse(BaseModel):
    month: str
    hours: int = 0


class RecommendedRef(BaseModel):
    id: Optional[str] = None
    title: str


class SkillGapItem(BaseModel):
    skill: str
    current_level: int = 0
    target_level: int = 0
    gap: int = 0
    priority: str = "Medium"
    category: str | None = None
    color: str | None = None
    rationale: str | None = None
    recommended_courses: list[RecommendedRef] = []
    recommended_paths: list[RecommendedRef] = []


class SkillGapsResponse(BaseModel):
    target_role: str | None = None
    gaps: list[SkillGapItem] = []


class ChatMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    created_at: Optional[str] = None

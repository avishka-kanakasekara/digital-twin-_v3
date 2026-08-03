from __future__ import annotations
"""
Learning schemas — paths, courses, certifications, feed, schedule.
"""

from typing import Optional
from pydantic import BaseModel

from datetime import datetime


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

    model_config = {"from_attributes": True}


class LearningPathProgressUpdate(BaseModel):
    progress: int
    completed_courses: Optional[int] = None


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
    # Per-employee fields (from junction table)
    status: str = "available"
    progress: int = 0

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

"""
Learning schemas — paths, courses, certifications, feed, schedule.
"""

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
    target_role: str | None = None

    model_config = {"from_attributes": True}


class LearningPathResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    progress: int = 0
    total_courses: int = 0
    completed_courses: int = 0
    estimated_hours: float | None = None
    due_date: str | None = None
    tags: list | None = None
    color: str | None = None
    is_ai_recommended: bool = False
    platform: str | None = None
    instructor: str | None = None

    model_config = {"from_attributes": True}


class LearningPathProgressUpdate(BaseModel):
    progress: int
    completed_courses: int | None = None


class CourseResponse(BaseModel):
    id: str
    title: str
    provider: str | None = None
    hours: float | None = None
    level: str | None = None
    rating: float | None = None
    enrolled_count: int = 0
    tags: list | None = None
    emoji: str | None = None
    color: str | None = None
    description: str | None = None
    # Per-employee fields (from junction table)
    status: str = "available"
    progress: int = 0

    model_config = {"from_attributes": True}


class CertificationCreate(BaseModel):
    name: str
    issuer: str | None = None
    status: str = "planned"
    score: int | None = None
    progress: int = 0
    credential_id: str | None = None
    exam_date: str | None = None
    emoji: str | None = None
    color: str | None = None


class CertificationResponse(BaseModel):
    id: str
    name: str
    issuer: str | None = None
    status: str = "planned"
    score: int | None = None
    progress: int = 0
    credential_id: str | None = None
    completed_date: str | None = None
    expiry_date: str | None = None
    exam_date: str | None = None
    emoji: str | None = None
    color: str | None = None

    model_config = {"from_attributes": True}


class LearningFeedItem(BaseModel):
    id: str
    type: str
    title: str
    source: str
    read_time: str
    relevance: int = 0
    tags: list = []
    emoji: str | None = None
    color: str | None = None
    published: str | None = None

    model_config = {"from_attributes": True}


class WeeklyScheduleResponse(BaseModel):
    day: str
    topic: str
    duration: str
    status: str = "upcoming"
    color: str | None = None

    model_config = {"from_attributes": True}


class MonthlyHoursResponse(BaseModel):
    month: str
    hours: int = 0

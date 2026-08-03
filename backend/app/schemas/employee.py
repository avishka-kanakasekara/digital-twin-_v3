"""
Employee schemas — request/response models.
"""

from pydantic import BaseModel
from datetime import datetime



class EmployeeCreate(BaseModel):
    employee_code: str
    full_name: str
    email: str
    password: str | None = None
    initials: str | None = None
    department: str | None = None
    role: str | None = None
    team: str | None = None
    manager_name: str | None = None
    location: str | None = None
    timezone_str: str | None = None
    phone: str | None = None
    education: list | None = None
    languages: list | None = None
    biography: str | None = None
    headline: str | None = None
    avatar_url: str | None = None
    years_experience: int | None = None
    years_in_company: int | None = None
    employment_type: str | None = "Full-Time"
    employment_status: str | None = "Active"


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    initials: str | None = None
    department: str | None = None
    role: str | None = None
    team: str | None = None
    manager_name: str | None = None
    location: str | None = None
    timezone_str: str | None = None
    phone: str | None = None
    education: list | None = None
    languages: list | None = None
    biography: str | None = None
    headline: str | None = None
    avatar_url: str | None = None
    years_experience: int | None = None
    years_in_company: int | None = None
    employment_type: str | None = None
    employment_status: str | None = None


class EmployeeStatsResponse(BaseModel):
    promotion_readiness: str | None = None
    projects_completed: int = 0
    projects_active: int = 0
    certifications: int = 0
    badges: int = 0
    recognitions: int = 0


class EmployeeResponse(BaseModel):
    id: str
    employee_code: str
    full_name: str
    initials: str | None = None
    email: str
    department: str | None = None
    role: str | None = None
    team: str | None = None
    manager_name: str | None = None
    location: str | None = None
    timezone_str: str | None = None
    phone: str | None = None
    education: list | None = None
    languages: list | None = None
    biography: str | None = None
    headline: str | None = None
    avatar_url: str | None = None
    years_experience: int | None = None
    years_in_company: int | None = None
    employment_type: str | None = None
    employment_status: str = "Active"
    twin_health: int = 0
    ai_confidence: int = 0
    profile_completeness: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeResponse]
    total: int


class TwinSummaryResponse(BaseModel):
    ai_confidence: int = 0
    profile_completeness: int = 0
    knowledge_freshness: str = "Low"
    twin_health: int = 0
    representation_quality: str = "Needs Data"
    summary_text: str = ""

    model_config = {"from_attributes": True}

from __future__ import annotations
"""
Employee schemas — request/response models.
"""

from typing import Optional
from pydantic import BaseModel
from datetime import datetime



class EmployeeCreate(BaseModel):
    employee_code: str
    full_name: str
    email: str
    password: Optional[str] = None
    initials: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    manager_name: Optional[str] = None
    location: Optional[str] = None
    timezone_str: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[list] = None
    languages: Optional[list] = None
    biography: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    years_experience: Optional[int] = None
    years_in_company: Optional[int] = None
    employment_type: Optional[str] = "Full-Time"
    employment_status: Optional[str] = "Active"


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    initials: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    manager_name: Optional[str] = None
    location: Optional[str] = None
    timezone_str: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[list] = None
    languages: Optional[list] = None
    biography: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    years_experience: Optional[int] = None
    years_in_company: Optional[int] = None
    employment_type: Optional[str] = None
    employment_status: Optional[str] = None


class EmployeeStatsResponse(BaseModel):
    promotion_readiness: Optional[str] = None
    projects_completed: int = 0
    projects_active: int = 0
    certifications: int = 0
    badges: int = 0
    recognitions: int = 0


class EmployeeResponse(BaseModel):
    id: str
    employee_code: str
    full_name: str
    initials: Optional[str] = None
    email: str
    department: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    manager_name: Optional[str] = None
    location: Optional[str] = None
    timezone_str: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[list] = None
    languages: Optional[list] = None
    biography: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    years_experience: Optional[int] = None
    years_in_company: Optional[int] = None
    employment_type: Optional[str] = None
    employment_status: str = "Active"
    twin_health: int = 0
    ai_confidence: int = 0
    profile_completeness: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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

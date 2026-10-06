from pydantic import BaseModel
from typing import Optional
from datetime import date

class WorkforceEmployeeRecordBase(BaseModel):
    employee_id: str
    display_name: str
    role_id: str
    org_unit_id: str
    manager_employee_id: Optional[str] = None
    career_level_id: str
    employment_type: str
    employee_status: str
    tenure_years: float
    location: str
    work_model: str
    cost_band_id: str
    annual_cost_lkr: int
    performance_rating_current: float
    current_allocation_pct: float
    availability_from_date: date
    notice_period_days: int

class WorkforceEmployeeRecordCreate(WorkforceEmployeeRecordBase):
    pass

class WorkforceEmployeeRecord(WorkforceEmployeeRecordBase):
    id: str

    class Config:
        from_attributes = True

class WorkforceEmployeeSkillRecordBase(BaseModel):
    skill_id: str
    employee_id: str
    name: str
    proficiency_effective: int
    proficiency_source: str
    confidence_score: float
    last_assessed_date: date
    last_used_date: date
    assessment_method: str
    evidence_reference: Optional[str] = None
    is_decayed: bool = False

class WorkforceEmployeeSkillRecordCreate(WorkforceEmployeeSkillRecordBase):
    pass

class WorkforceEmployeeSkillRecord(WorkforceEmployeeSkillRecordBase):
    id: str

    class Config:
        from_attributes = True

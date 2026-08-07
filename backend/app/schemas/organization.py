from __future__ import annotations
"""
Pydantic schemas for Organization metrics and scenarios.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Optional, Any


class OrganizationMetricBase(BaseModel):
    month: str
    date: str
    total_headcount: int
    voluntary_attrition_rate: float
    involuntary_attrition_rate: float
    new_hires: int
    open_positions: int
    enps: int
    training_hours_per_employee: float
    absenteeism_rate: float
    
    revenue: float
    operating_cost: float
    ebitda: float
    net_profit: float
    marketing_spend: float
    rd_spend: float
    
    overall_productivity_score: int
    csat: float
    nps: int
    market_share_percentage: float
    project_completion_rate: float
    
    carbon_footprint_tons: int
    energy_consumption_kwh: int
    compliance_score: int
    security_incidents: int
    anomaly_flag: str


class OrganizationMetricCreate(OrganizationMetricBase):
    pass


class OrganizationMetricRead(OrganizationMetricBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationScenarioBase(BaseModel):
    scenario_name: str
    target_metric: str
    confidence_level: int
    predicted_impact_percentage: float
    predicted_roi: float
    time_to_impact_months: int
    ai_recommendation: str


class OrganizationScenarioCreate(OrganizationScenarioBase):
    pass


class OrganizationScenarioRead(OrganizationScenarioBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrgInnovationIdeaBase(BaseModel):
    title: str
    author_initials: str
    author_bg: str
    description: str
    full_description: str
    roi: str
    timeline: str
    budget: str
    risks: str
    team_required: str
    impact_score: int
    feasibility: str
    status: str
    patent_pending: bool = False

class OrgInnovationIdeaRead(OrgInnovationIdeaBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrgInnovationCommunityBase(BaseModel):
    name: str
    members: int
    joined: bool = False
    icon: str
    bg_class: str

class OrgInnovationCommunityRead(OrgInnovationCommunityBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class OrgAtRiskEmployeeBase(BaseModel):
    employee_id: str
    risk_level: str
    risk_score: float
    primary_factor: str
    burnout_probability: float
    compensation_satisfaction: float
    career_stagnation_score: float
    last_1_on_1: str
    ai_retention_suggestion: str

class OrgAtRiskEmployeeRead(OrgAtRiskEmployeeBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class OrgTalentGigBase(BaseModel):
    role_title: str
    department: str
    required_skills: List[str] = []
    matched_employees: List[Dict[str, Any]] = []
    urgency: str

class OrgTalentGigRead(OrgTalentGigBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class OrgTalentMentorBase(BaseModel):
    name: str
    role: str
    description: str
    match_score: int
    initials: str
    icon_bg: str

class OrgTalentMentorRead(OrgTalentMentorBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class OrgTeamBuilderOptionBase(BaseModel):
    name: str
    success_rate: int
    compatibility_score: int
    skill_balance: int
    performance_prediction: int
    rationale: str
    members: List[Dict[str, Any]] = []

class OrgTeamBuilderOptionRead(OrgTeamBuilderOptionBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class OrgOKRBase(BaseModel):
    title: str
    owner: str
    progress: int
    status: str
    initiatives: List[Dict[str, Any]] = []

class OrgOKRRead(OrgOKRBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

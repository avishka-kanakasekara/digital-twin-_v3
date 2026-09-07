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

class IdeaScoreRequest(BaseModel):
    title: str
    description: str

class IdeaScoreResponse(BaseModel):
    impact: str
    impact_score: int
    feasibility: str
    similar: int

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

class TeamBuilderOptimizationRequest(BaseModel):
    project_type: str
    headcount: int
    core_competencies: List[str] = []
    context: Optional[str] = None

class RiskProfile(BaseModel):
    employee_id: str
    risk_level: str
    risk_score: float
    primary_factor: str
    burnout_probability: float
    compensation_satisfaction: float
    career_stagnation_score: float
    last_1_on_1: str
    ai_retention_suggestion: str

class InterventionEffectiveness(BaseModel):
    role_group: str
    intervention_name: str
    risk_reduction_percentage: int
    description: str
    theme_color: str

class SimulationRequest(BaseModel):
    headcountChange: float
    salaryChange: float
    remoteDays: float
    trainingBudget: float
    restructuringLevel: float
    isSnapshot: bool = False

# Simulation returns a dictionary of string keys to float values per month
class SimulationResult(BaseModel):
    pass # In FastAPI we can just return List[Dict[str, Any]] for simplicity if it's dynamic



class OrganizationMetricUpdate(BaseModel):
    month: Optional[str] = None
    date: Optional[str] = None
    total_headcount: Optional[int] = None
    voluntary_attrition_rate: Optional[float] = None
    involuntary_attrition_rate: Optional[float] = None
    new_hires: Optional[int] = None
    open_positions: Optional[int] = None
    enps: Optional[int] = None
    training_hours_per_employee: Optional[float] = None
    absenteeism_rate: Optional[float] = None
    revenue: Optional[float] = None
    operating_cost: Optional[float] = None
    ebitda: Optional[float] = None
    net_profit: Optional[float] = None
    marketing_spend: Optional[float] = None
    rd_spend: Optional[float] = None
    overall_productivity_score: Optional[int] = None
    csat: Optional[float] = None
    nps: Optional[int] = None
    market_share_percentage: Optional[float] = None
    project_completion_rate: Optional[float] = None
    carbon_footprint_tons: Optional[int] = None
    energy_consumption_kwh: Optional[int] = None
    compliance_score: Optional[int] = None
    security_incidents: Optional[int] = None
    anomaly_flag: Optional[str] = None

class OrganizationScenarioUpdate(BaseModel):
    scenario_name: Optional[str] = None
    target_metric: Optional[str] = None
    confidence_level: Optional[int] = None
    predicted_impact_percentage: Optional[float] = None
    predicted_roi: Optional[float] = None
    time_to_impact_months: Optional[int] = None
    ai_recommendation: Optional[str] = None

class OrgInnovationIdeaCreate(OrgInnovationIdeaBase):
    pass

class OrgInnovationIdeaUpdate(BaseModel):
    title: Optional[str] = None
    author_initials: Optional[str] = None
    author_bg: Optional[str] = None
    description: Optional[str] = None
    full_description: Optional[str] = None
    roi: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    risks: Optional[str] = None
    team_required: Optional[str] = None
    impact_score: Optional[int] = None
    feasibility: Optional[str] = None
    status: Optional[str] = None
    patent_pending: Optional[bool] = None

class OrgInnovationCommunityCreate(OrgInnovationCommunityBase):
    pass

class OrgInnovationCommunityUpdate(BaseModel):
    name: Optional[str] = None
    members: Optional[int] = None
    joined: Optional[bool] = None
    icon: Optional[str] = None
    bg_class: Optional[str] = None

class OrgAtRiskEmployeeCreate(OrgAtRiskEmployeeBase):
    pass

class OrgAtRiskEmployeeUpdate(BaseModel):
    employee_id: Optional[str] = None
    risk_level: Optional[str] = None
    risk_score: Optional[float] = None
    primary_factor: Optional[str] = None
    burnout_probability: Optional[float] = None
    compensation_satisfaction: Optional[float] = None
    career_stagnation_score: Optional[float] = None
    last_1_on_1: Optional[str] = None
    ai_retention_suggestion: Optional[str] = None

class OrgTalentGigCreate(OrgTalentGigBase):
    pass

class OrgTalentGigUpdate(BaseModel):
    role_title: Optional[str] = None
    department: Optional[str] = None
    required_skills: Optional[List[str]] = None
    matched_employees: Optional[List[Dict[str, Any]]] = None
    urgency: Optional[str] = None

class OrgTalentMentorCreate(OrgTalentMentorBase):
    pass

class OrgTalentMentorUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    match_score: Optional[int] = None
    initials: Optional[str] = None
    icon_bg: Optional[str] = None

class OrgTeamBuilderOptionCreate(OrgTeamBuilderOptionBase):
    pass

class OrgTeamBuilderOptionUpdate(BaseModel):
    name: Optional[str] = None
    success_rate: Optional[int] = None
    compatibility_score: Optional[int] = None
    skill_balance: Optional[int] = None
    performance_prediction: Optional[int] = None
    rationale: Optional[str] = None
    members: Optional[List[Dict[str, Any]]] = None




# ==================== TALENT APPLICATIONS ====================

class OrgTalentApplicationBase(BaseModel):
    applicant_employee_id: Optional[str] = None   # null = anonymous / manager-posted
    opportunity_id: str                            # gig or mentor id
    opportunity_type: str                          # "gig" | "mentoring"
    opportunity_title: str
    status: str = "Under Review"                  # Under Review | Accepted | Rejected

class OrgTalentApplicationCreate(OrgTalentApplicationBase):
    pass

class OrgTalentApplicationRead(OrgTalentApplicationBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrgTalentApplicationUpdate(BaseModel):
    status: Optional[str] = None

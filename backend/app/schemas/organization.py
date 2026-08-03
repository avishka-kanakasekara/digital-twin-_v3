"""
Pydantic schemas for Organization metrics and scenarios.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime


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

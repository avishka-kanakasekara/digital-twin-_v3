from __future__ import annotations
"""
Organization models for the Digital Twin platform.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class OrganizationMetric(Base):
    __tablename__ = "organization_metrics"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    month: Mapped[str] = mapped_column(String(20))
    date: Mapped[str] = mapped_column(String(20))
    
    total_headcount: Mapped[int] = mapped_column(Integer)
    voluntary_attrition_rate: Mapped[float] = mapped_column(Float)
    involuntary_attrition_rate: Mapped[float] = mapped_column(Float)
    new_hires: Mapped[int] = mapped_column(Integer)
    open_positions: Mapped[int] = mapped_column(Integer)
    enps: Mapped[int] = mapped_column(Integer)
    training_hours_per_employee: Mapped[float] = mapped_column(Float)
    absenteeism_rate: Mapped[float] = mapped_column(Float)
    
    revenue: Mapped[float] = mapped_column(Float)
    operating_cost: Mapped[float] = mapped_column(Float)
    ebitda: Mapped[float] = mapped_column(Float)
    net_profit: Mapped[float] = mapped_column(Float)
    marketing_spend: Mapped[float] = mapped_column(Float)
    rd_spend: Mapped[float] = mapped_column(Float)
    
    overall_productivity_score: Mapped[int] = mapped_column(Integer)
    csat: Mapped[float] = mapped_column(Float)
    nps: Mapped[int] = mapped_column(Integer)
    market_share_percentage: Mapped[float] = mapped_column(Float)
    project_completion_rate: Mapped[float] = mapped_column(Float)
    
    carbon_footprint_tons: Mapped[int] = mapped_column(Integer)
    energy_consumption_kwh: Mapped[int] = mapped_column(Integer)
    compliance_score: Mapped[int] = mapped_column(Integer)
    security_incidents: Mapped[int] = mapped_column(Integer)
    anomaly_flag: Mapped[str] = mapped_column(String(10))

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

class OrganizationScenario(Base):
    __tablename__ = "organization_scenarios"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    scenario_name: Mapped[str] = mapped_column(String(255))
    target_metric: Mapped[str] = mapped_column(String(100))
    confidence_level: Mapped[int] = mapped_column(Integer)
    predicted_impact_percentage: Mapped[float] = mapped_column(Float)
    predicted_roi: Mapped[float] = mapped_column(Float)
    time_to_impact_months: Mapped[int] = mapped_column(Integer)
    ai_recommendation: Mapped[str] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

class OrgInnovationIdea(Base):
    __tablename__ = "org_innovation_ideas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    author_initials: Mapped[str] = mapped_column(String(10))
    author_bg: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(1000))
    full_description: Mapped[str] = mapped_column(String(5000))
    roi: Mapped[str] = mapped_column(String(100))
    timeline: Mapped[str] = mapped_column(String(100))
    budget: Mapped[str] = mapped_column(String(100))
    risks: Mapped[str] = mapped_column(String(2000))
    team_required: Mapped[str] = mapped_column(String(2000))
    impact_score: Mapped[int] = mapped_column(Integer)
    feasibility: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50))
    patent_pending: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class OrgInnovationCommunity(Base):
    __tablename__ = "org_innovation_communities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    members: Mapped[int] = mapped_column(Integer)
    joined: Mapped[bool] = mapped_column(Boolean, default=False)
    icon: Mapped[str] = mapped_column(String(50))
    bg_class: Mapped[str] = mapped_column(String(50))

class OrgAtRiskEmployee(Base):
    __tablename__ = "org_at_risk_employees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"))
    risk_level: Mapped[str] = mapped_column(String(50))
    risk_score: Mapped[float] = mapped_column(Float)
    primary_factor: Mapped[str] = mapped_column(String(255))
    burnout_probability: Mapped[float] = mapped_column(Float)
    compensation_satisfaction: Mapped[float] = mapped_column(Float)
    career_stagnation_score: Mapped[float] = mapped_column(Float)
    last_1_on_1: Mapped[str] = mapped_column(String(100))
    ai_retention_suggestion: Mapped[str] = mapped_column(String(2000))

class OrgTalentGig(Base):
    __tablename__ = "org_talent_gigs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role_title: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(100))
    required_skills: Mapped[dict] = mapped_column(JSON)
    matched_employees: Mapped[dict] = mapped_column(JSON)
    urgency: Mapped[str] = mapped_column(String(50))

class OrgTalentMentor(Base):
    __tablename__ = "org_talent_mentors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000))
    match_score: Mapped[int] = mapped_column(Integer)
    initials: Mapped[str] = mapped_column(String(10))
    icon_bg: Mapped[str] = mapped_column(String(50))

class OrgTeamBuilderOption(Base):
    __tablename__ = "org_team_builder_options"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    success_rate: Mapped[int] = mapped_column(Integer)
    compatibility_score: Mapped[int] = mapped_column(Integer)
    skill_balance: Mapped[int] = mapped_column(Integer)
    performance_prediction: Mapped[int] = mapped_column(Integer)
    rationale: Mapped[str] = mapped_column(String(2000))
    members: Mapped[dict] = mapped_column(JSON)

class OrgOKR(Base):
    __tablename__ = "org_okrs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    owner: Mapped[str] = mapped_column(String(100))
    progress: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50))
    initiatives: Mapped[dict] = mapped_column(JSON)

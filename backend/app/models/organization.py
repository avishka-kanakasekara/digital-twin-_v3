"""
Organization models for the Digital Twin platform.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime
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

"""
Career models — goals, roadmap steps.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CareerGoal(Base):
    __tablename__ = "career_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    target_role: Mapped[str] = mapped_column(String(200), nullable=False)
    timeline: Mapped[str | None] = mapped_column(String(50))
    focus_area: Mapped[str | None] = mapped_column(String(100))
    target_industry: Mapped[str | None] = mapped_column(String(100))
    readiness_score: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    employee = relationship("Employee", back_populates="career_goals")
    roadmap_steps = relationship(
        "CareerRoadmapStep", back_populates="career_goal", cascade="all, delete-orphan",
        order_by="CareerRoadmapStep.step_order"
    )


class CareerRoadmapStep(Base):
    __tablename__ = "career_roadmap_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    career_goal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("career_goals.id", ondelete="CASCADE"), nullable=False
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    description: Mapped[str | None] = mapped_column(Text)

    career_goal = relationship("CareerGoal", back_populates="roadmap_steps")

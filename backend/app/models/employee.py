"""
Employee model — the central entity of the Digital Twin platform.
Uses String-based UUIDs for SQLite compatibility.
"""

from typing import Optional
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    employee_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    initials: Mapped[Optional[str]] = mapped_column(String(5))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255))

    department: Mapped[Optional[str]] = mapped_column(String(100))
    role: Mapped[Optional[str]] = mapped_column(String(150))
    team: Mapped[Optional[str]] = mapped_column(String(150))
    manager_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    manager_name: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(150))
    timezone_str: Mapped[Optional[str]] = mapped_column(String(50))
    phone: Mapped[Optional[str]] = mapped_column(String(30))

    education: Mapped[Optional[dict]] = mapped_column(JSON, default=list)
    languages: Mapped[Optional[dict]] = mapped_column(JSON, default=list)

    biography: Mapped[Optional[str]] = mapped_column(Text)
    headline: Mapped[Optional[str]] = mapped_column(String(300))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))

    years_experience: Mapped[Optional[int]] = mapped_column(Integer)
    years_in_company: Mapped[Optional[int]] = mapped_column(Integer)
    employment_type: Mapped[Optional[str]] = mapped_column(
        String(30), default="Full-Time"
    )
    employment_status: Mapped[str] = mapped_column(
        String(20), default="Active"
    )

    # Twin metadata
    twin_health: Mapped[int] = mapped_column(Integer, default=0)
    ai_confidence: Mapped[int] = mapped_column(Integer, default=0)
    profile_completeness: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    skills = relationship("Skill", back_populates="employee", cascade="all, delete-orphan")
    gamification_profile = relationship(
        "GamificationProfile", back_populates="employee", uselist=False, cascade="all, delete-orphan"
    )
    xp_transactions = relationship("XPTransaction", back_populates="employee", cascade="all, delete-orphan")
    achievements = relationship("EmployeeAchievement", back_populates="employee", cascade="all, delete-orphan")
    challenge_progress = relationship("ChallengeProgress", back_populates="employee", cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="employee", cascade="all, delete-orphan")
    employee_courses = relationship("EmployeeCourse", back_populates="employee", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="employee", cascade="all, delete-orphan")
    career_goals = relationship("CareerGoal", back_populates="employee", cascade="all, delete-orphan")
    knowledge_sources = relationship("KnowledgeSource", back_populates="employee", cascade="all, delete-orphan")
    reward_claims = relationship("RewardClaim", back_populates="employee", cascade="all, delete-orphan")
    recognitions = relationship("Recognition", back_populates="employee", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="employee", cascade="all, delete-orphan")
    weekly_schedule = relationship("WeeklyScheduleEntry", back_populates="employee", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Employee {self.employee_code} — {self.full_name}>"

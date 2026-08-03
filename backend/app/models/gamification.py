"""
Gamification models — XP system, achievements, challenges, leaderboard.
Uses String(36) UUIDs for SQLite compatibility.
"""

from typing import Optional
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class GamificationProfile(Base):
    __tablename__ = "gamification_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    next_level_xp: Mapped[int] = mapped_column(Integer, default=1000)
    total_xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    company_rank: Mapped[Optional[int]] = mapped_column(Integer)
    department_rank: Mapped[Optional[int]] = mapped_column(Integer)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity: Mapped[Optional[datetime]] = mapped_column(DateTime)
    title: Mapped[str] = mapped_column(String(50), default="Newcomer")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    employee = relationship("Employee", back_populates="gamification_profile")


class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255))
    category: Mapped[Optional[str]] = mapped_column(String(50))
    emoji: Mapped[Optional[str]] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="xp_transactions")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    emoji: Mapped[Optional[str]] = mapped_column(String(10))
    xp_value: Mapped[int] = mapped_column(Integer, default=0)
    rarity: Mapped[Optional[str]] = mapped_column(String(20))
    criteria_type: Mapped[Optional[str]] = mapped_column(String(50))
    criteria_value: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee_achievements = relationship("EmployeeAchievement", back_populates="achievement")


class EmployeeAchievement(Base):
    __tablename__ = "employee_achievements"
    __table_args__ = (
        UniqueConstraint("employee_id", "achievement_id", name="uq_emp_achievement"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    achievement_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("achievements.id"), nullable=False
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="employee_achievements")


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0)
    bonus_badge: Mapped[Optional[str]] = mapped_column(String(10))
    difficulty: Mapped[Optional[str]] = mapped_column(String(10))
    type: Mapped[Optional[str]] = mapped_column(String(20))
    category: Mapped[Optional[str]] = mapped_column(String(50))
    color: Mapped[Optional[str]] = mapped_column(String(10))
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    progress_entries = relationship("ChallengeProgress", back_populates="challenge")


class ChallengeProgress(Base):
    __tablename__ = "challenge_progress"
    __table_args__ = (
        UniqueConstraint("employee_id", "challenge_id", name="uq_emp_challenge"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id"), nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    employee = relationship("Employee", back_populates="challenge_progress")
    challenge = relationship("Challenge", back_populates="progress_entries")

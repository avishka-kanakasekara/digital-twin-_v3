"""
Reward store models.
"""

from typing import Optional
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RewardItem(Base):
    __tablename__ = "reward_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    cost: Mapped[int] = mapped_column(Integer, nullable=False)
    emoji: Mapped[Optional[str]] = mapped_column(String(10))
    category: Mapped[Optional[str]] = mapped_column(String(50))
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    stock: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    claims = relationship("RewardClaim", back_populates="reward")


class RewardClaim(Base):
    __tablename__ = "reward_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    reward_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("reward_items.id"), nullable=False
    )
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    status: Mapped[str] = mapped_column(String(20), default="claimed")

    employee = relationship("Employee", back_populates="reward_claims")
    reward = relationship("RewardItem", back_populates="claims")

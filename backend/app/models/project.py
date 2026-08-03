"""
Project model.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    technologies: Mapped[dict | None] = mapped_column(JSON, default=list)
    duration: Mapped[str | None] = mapped_column(String(50))
    domain: Mapped[str | None] = mapped_column(String(100))
    complexity: Mapped[str | None] = mapped_column(String(20))
    success_score: Mapped[int] = mapped_column(Integer, default=0)
    leadership_score: Mapped[int] = mapped_column(Integer, default=0)
    customer_rating: Mapped[float | None] = mapped_column(Numeric(3, 2))
    status: Mapped[str] = mapped_column(String(20), default="On Track")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="projects")

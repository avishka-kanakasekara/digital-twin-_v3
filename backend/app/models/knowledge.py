"""
Knowledge source model.
"""

from typing import Optional
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(30), default="File")
    connected: Mapped[bool] = mapped_column(Boolean, default=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    coverage: Mapped[int] = mapped_column(Integer, default=0)
    skills_extracted: Mapped[int] = mapped_column(Integer, default=0)
    projects_found: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    last_synced: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="knowledge_sources")

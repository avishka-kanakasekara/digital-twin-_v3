"""
Learning models — paths, courses, certifications, schedule.
Uses String(36) UUIDs for SQLite compatibility.
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Integer, Text, Boolean, DateTime, Date, ForeignKey, JSON, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    total_courses: Mapped[int] = mapped_column(Integer, default=0)
    completed_courses: Mapped[int] = mapped_column(Integer, default=0)
    estimated_hours: Mapped[float | None] = mapped_column(Numeric(6, 1))
    due_date: Mapped[str | None] = mapped_column(String(30))
    tags: Mapped[dict | None] = mapped_column(JSON, default=list)
    color: Mapped[str | None] = mapped_column(String(10))
    is_ai_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    platform: Mapped[str | None] = mapped_column(String(100))
    instructor: Mapped[str | None] = mapped_column(String(150))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="learning_paths")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(150))
    hours: Mapped[float | None] = mapped_column(Numeric(6, 1))
    level: Mapped[str | None] = mapped_column(String(20))
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2))
    enrolled_count: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[dict | None] = mapped_column(JSON, default=list)
    emoji: Mapped[str | None] = mapped_column(String(10))
    color: Mapped[str | None] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee_courses = relationship("EmployeeCourse", back_populates="course")


class EmployeeCourse(Base):
    __tablename__ = "employee_courses"
    __table_args__ = (
        UniqueConstraint("employee_id", "course_id", name="uq_emp_course"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("courses.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="available")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    employee = relationship("Employee", back_populates="employee_courses")
    course = relationship("Course", back_populates="employee_courses")


class Certification(Base):
    __tablename__ = "certifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(20), default="planned")
    score: Mapped[int | None] = mapped_column(Integer)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    credential_id: Mapped[str | None] = mapped_column(String(100))
    completed_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    exam_date: Mapped[str | None] = mapped_column(String(30))
    emoji: Mapped[str | None] = mapped_column(String(10))
    color: Mapped[str | None] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="certifications")


class WeeklyScheduleEntry(Base):
    __tablename__ = "weekly_schedule_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    day: Mapped[str] = mapped_column(String(5), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    duration: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    color: Mapped[str | None] = mapped_column(String(10))
    week_of: Mapped[date | None] = mapped_column(Date)

    employee = relationship("Employee", back_populates="weekly_schedule")

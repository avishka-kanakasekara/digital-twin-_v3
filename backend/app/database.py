from __future__ import annotations
"""
SQLAlchemy engine, session factory, and Base declarative class.
Using synchronous SQLite for compatibility (no async/greenlet issues).
"""

from sqlalchemy.orm import Session, sessionmaker, DeclarativeBase
from sqlalchemy import create_engine
from app.config import settings

# Engine configuration
engine_kwargs = {
    "echo": settings.DEBUG,
}

if not settings.is_sqlite:
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
    })

engine = create_engine(settings.DATABASE_URL_SYNC, **engine_kwargs)

# Session factory
SessionLocal = sessionmaker(
    engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db() -> Session:
    """FastAPI dependency — yields a database session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Create all tables (for development — use Alembic in production)."""
    Base.metadata.create_all(bind=engine)

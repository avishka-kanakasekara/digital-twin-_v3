from __future__ import annotations
"""
API routes for Organization module.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.organization import OrganizationMetric, OrganizationScenario
from app.schemas.organization import (
    OrganizationMetricRead,
    OrganizationScenarioRead,
)

router = APIRouter(
    prefix="/organization",
    tags=["Organization"],
)

@router.get("/history", response_model=List[OrganizationMetricRead])
def get_organization_history(
    limit: int = 100, db: Session = Depends(get_db)
):
    """
    Retrieve historical organization metrics.
    """
    stmt = select(OrganizationMetric).order_by(OrganizationMetric.date).limit(limit)
    metrics = db.scalars(stmt).all()
    return metrics


@router.get("/scenarios", response_model=List[OrganizationScenarioRead])
def get_organization_scenarios(
    db: Session = Depends(get_db)
):
    """
    Retrieve pre-calculated AI simulation scenarios.
    """
    stmt = select(OrganizationScenario)
    scenarios = db.scalars(stmt).all()
    return scenarios

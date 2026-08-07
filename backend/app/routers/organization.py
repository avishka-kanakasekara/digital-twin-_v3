from __future__ import annotations
"""
API routes for Organization module.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.organization import (
    OrganizationMetric, OrganizationScenario,
    OrgInnovationIdea, OrgInnovationCommunity,
    OrgAtRiskEmployee, OrgTalentGig,
    OrgTalentMentor, OrgTeamBuilderOption, OrgOKR
)
from app.schemas.organization import (
    OrganizationMetricRead,
    OrganizationScenarioRead,
    OrgInnovationIdeaRead, OrgInnovationCommunityRead,
    OrgAtRiskEmployeeRead, OrgTalentGigRead,
    OrgTalentMentorRead, OrgTeamBuilderOptionRead, OrgOKRRead
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

@router.get("/innovation/ideas", response_model=List[OrgInnovationIdeaRead])
def get_innovation_ideas(db: Session = Depends(get_db)):
    stmt = select(OrgInnovationIdea)
    return db.scalars(stmt).all()

@router.get("/innovation/communities", response_model=List[OrgInnovationCommunityRead])
def get_innovation_communities(db: Session = Depends(get_db)):
    stmt = select(OrgInnovationCommunity)
    return db.scalars(stmt).all()

@router.get("/talent/risks", response_model=List[OrgAtRiskEmployeeRead])
def get_at_risk_employees(db: Session = Depends(get_db)):
    stmt = select(OrgAtRiskEmployee)
    return db.scalars(stmt).all()

@router.get("/talent/gigs", response_model=List[OrgTalentGigRead])
def get_talent_gigs(db: Session = Depends(get_db)):
    stmt = select(OrgTalentGig)
    return db.scalars(stmt).all()

@router.get("/talent/mentors", response_model=List[OrgTalentMentorRead])
def get_talent_mentors(db: Session = Depends(get_db)):
    stmt = select(OrgTalentMentor)
    return db.scalars(stmt).all()

@router.get("/talent/team-builder", response_model=List[OrgTeamBuilderOptionRead])
def get_team_builder_options(db: Session = Depends(get_db)):
    stmt = select(OrgTeamBuilderOption)
    return db.scalars(stmt).all()

@router.get("/strategy/okrs", response_model=List[OrgOKRRead])
def get_okrs(db: Session = Depends(get_db)):
    stmt = select(OrgOKR)
    return db.scalars(stmt).all()

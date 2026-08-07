from __future__ import annotations
"""
API routes for Organization module.
"""
from typing import List
from fastapi import APIRouter

from app.database import get_supabase_admin
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
def get_organization_history(limit: int = 100):
    """
    Retrieve historical organization metrics.
    """
    sb = get_supabase_admin()
    result = sb.table("organization_metrics").select("*").order("date").limit(limit).execute()
    return result.data


@router.get("/scenarios", response_model=List[OrganizationScenarioRead])
def get_organization_scenarios():
    """
    Retrieve pre-calculated AI simulation scenarios.
    """
    sb = get_supabase_admin()
    result = sb.table("organization_scenarios").select("*").execute()
    return result.data

@router.get("/innovation/ideas", response_model=List[OrgInnovationIdeaRead])
def get_innovation_ideas():
    sb = get_supabase_admin()
    result = sb.table("org_innovation_ideas").select("*").execute()
    return result.data

@router.get("/innovation/communities", response_model=List[OrgInnovationCommunityRead])
def get_innovation_communities():
    sb = get_supabase_admin()
    result = sb.table("org_innovation_communities").select("*").execute()
    return result.data

@router.get("/talent/risks", response_model=List[OrgAtRiskEmployeeRead])
def get_at_risk_employees():
    sb = get_supabase_admin()
    result = sb.table("org_at_risk_employees").select("*").execute()
    return result.data

@router.get("/talent/gigs", response_model=List[OrgTalentGigRead])
def get_talent_gigs():
    sb = get_supabase_admin()
    result = sb.table("org_talent_gigs").select("*").execute()
    return result.data

@router.get("/talent/mentors", response_model=List[OrgTalentMentorRead])
def get_talent_mentors():
    sb = get_supabase_admin()
    result = sb.table("org_talent_mentors").select("*").execute()
    return result.data

@router.get("/talent/team-builder", response_model=List[OrgTeamBuilderOptionRead])
def get_team_builder_options():
    sb = get_supabase_admin()
    result = sb.table("org_team_builder_options").select("*").execute()
    return result.data

@router.get("/strategy/okrs", response_model=List[OrgOKRRead])
def get_okrs():
    sb = get_supabase_admin()
    result = sb.table("org_okrs").select("*").execute()
    return result.data

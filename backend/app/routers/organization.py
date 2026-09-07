from __future__ import annotations
"""
API routes for Organization module.
"""
from typing import List
from fastapi import APIRouter, HTTPException, status

from app.database import get_supabase_admin
from app.schemas.organization import (
    OrganizationMetricRead, OrganizationMetricCreate, OrganizationMetricUpdate,
    OrganizationScenarioRead, OrganizationScenarioCreate, OrganizationScenarioUpdate,
    OrgInnovationIdeaRead, OrgInnovationIdeaCreate, OrgInnovationIdeaUpdate,
    OrgInnovationCommunityRead, OrgInnovationCommunityCreate, OrgInnovationCommunityUpdate,
    OrgAtRiskEmployeeRead, OrgAtRiskEmployeeCreate, OrgAtRiskEmployeeUpdate,
    OrgTalentGigRead, OrgTalentGigCreate, OrgTalentGigUpdate,
    OrgTalentMentorRead, OrgTalentMentorCreate, OrgTalentMentorUpdate,
    OrgTeamBuilderOptionRead, OrgTeamBuilderOptionCreate, OrgTeamBuilderOptionUpdate,
    OrgOKRRead, OrgOKRCreate, OrgOKRUpdate,
    OrgStrategyVisionResponse, OrgAIReadinessResponse,
    OrgCapabilityResponse, OrgTransformationResponse,
    OrgTalentApplicationRead, OrgTalentApplicationCreate, OrgTalentApplicationUpdate,
    TeamBuilderOptimizationRequest,
)
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "ml", "src"))
from organization.workforce_forecasting.forecast_engine import forecast_headcount_loss, rank_skill_shortages
from organization.workforce_forecasting.burnout_calculator import calculate_average_burnout
from organization.team_builder.optimization_engine import optimize_team


router = APIRouter(
    prefix="/api/organization",
    tags=["Organization"],
)

# --- Organization Metrics ---

@router.get("/history", response_model=List[OrganizationMetricRead])
def get_organization_history(limit: int = 100):
    """
    Retrieve historical organization metrics. (Legacy alias for GET /metrics)
    """
    sb = get_supabase_admin()
    result = sb.table("organization_metrics").select("*").order("date").limit(limit).execute()
    return result.data

@router.get("/metrics", response_model=List[OrganizationMetricRead])
def get_organization_metrics(limit: int = 100):
    sb = get_supabase_admin()
    result = sb.table("organization_metrics").select("*").order("date").limit(limit).execute()
    return result.data

@router.post("/metrics", response_model=OrganizationMetricRead, status_code=status.HTTP_201_CREATED)
def create_organization_metric(metric: OrganizationMetricCreate):
    sb = get_supabase_admin()
    result = sb.table("organization_metrics").insert(metric.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create metric")
    return result.data[0]

@router.put("/metrics/{id}", response_model=OrganizationMetricRead)
def update_organization_metric(id: str, metric: OrganizationMetricUpdate):
    sb = get_supabase_admin()
    update_data = metric.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("organization_metrics").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Metric not found")
    return result.data[0]

@router.delete("/metrics/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_metric(id: str):
    sb = get_supabase_admin()
    result = sb.table("organization_metrics").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Metric not found")
    return None


# --- Organization Scenarios ---

@router.get("/scenarios", response_model=List[OrganizationScenarioRead])
def get_organization_scenarios():
    sb = get_supabase_admin()
    result = sb.table("organization_scenarios").select("*").execute()
    return result.data

@router.post("/scenarios", response_model=OrganizationScenarioRead, status_code=status.HTTP_201_CREATED)
def create_organization_scenario(scenario: OrganizationScenarioCreate):
    sb = get_supabase_admin()
    result = sb.table("organization_scenarios").insert(scenario.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create scenario")
    return result.data[0]

@router.put("/scenarios/{id}", response_model=OrganizationScenarioRead)
def update_organization_scenario(id: str, scenario: OrganizationScenarioUpdate):
    sb = get_supabase_admin()
    update_data = scenario.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("organization_scenarios").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return result.data[0]

@router.delete("/scenarios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_scenario(id: str):
    sb = get_supabase_admin()
    result = sb.table("organization_scenarios").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return None


# --- Innovation Ideas ---

@router.get("/innovation/ideas", response_model=List[OrgInnovationIdeaRead])
def get_innovation_ideas():
    sb = get_supabase_admin()
    result = sb.table("org_innovation_ideas").select("*").execute()
    return result.data

@router.post("/innovation/ideas", response_model=OrgInnovationIdeaRead, status_code=status.HTTP_201_CREATED)
def create_innovation_idea(idea: OrgInnovationIdeaCreate):
    sb = get_supabase_admin()
    result = sb.table("org_innovation_ideas").insert(idea.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create innovation idea")
    return result.data[0]

@router.put("/innovation/ideas/{id}", response_model=OrgInnovationIdeaRead)
def update_innovation_idea(id: str, idea: OrgInnovationIdeaUpdate):
    sb = get_supabase_admin()
    update_data = idea.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_innovation_ideas").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation idea not found")
    return result.data[0]

@router.delete("/innovation/ideas/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_innovation_idea(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_innovation_ideas").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation idea not found")
    return None


# --- Innovation Communities ---

@router.get("/innovation/communities", response_model=List[OrgInnovationCommunityRead])
def get_innovation_communities():
    sb = get_supabase_admin()
    result = sb.table("org_innovation_communities").select("*").execute()
    return result.data

@router.post("/innovation/communities", response_model=OrgInnovationCommunityRead, status_code=status.HTTP_201_CREATED)
def create_innovation_community(community: OrgInnovationCommunityCreate):
    sb = get_supabase_admin()
    result = sb.table("org_innovation_communities").insert(community.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create innovation community")
    return result.data[0]

@router.put("/innovation/communities/{id}", response_model=OrgInnovationCommunityRead)
def update_innovation_community(id: str, community: OrgInnovationCommunityUpdate):
    sb = get_supabase_admin()
    update_data = community.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_innovation_communities").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation community not found")
    return result.data[0]

@router.delete("/innovation/communities/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_innovation_community(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_innovation_communities").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation community not found")
    return None


# --- At Risk Employees ---

@router.get("/talent/risks", response_model=List[OrgAtRiskEmployeeRead])
def get_at_risk_employees():
    sb = get_supabase_admin()
    result = sb.table("org_at_risk_employees").select("*").execute()
    return result.data

@router.post("/talent/risks", response_model=OrgAtRiskEmployeeRead, status_code=status.HTTP_201_CREATED)
def create_at_risk_employee(risk: OrgAtRiskEmployeeCreate):
    sb = get_supabase_admin()
    result = sb.table("org_at_risk_employees").insert(risk.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create at-risk employee record")
    return result.data[0]

@router.put("/talent/risks/{id}", response_model=OrgAtRiskEmployeeRead)
def update_at_risk_employee(id: str, risk: OrgAtRiskEmployeeUpdate):
    sb = get_supabase_admin()
    update_data = risk.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_at_risk_employees").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="At-risk employee record not found")
    return result.data[0]

@router.delete("/talent/risks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_at_risk_employee(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_at_risk_employees").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="At-risk employee record not found")
    return None


# --- Talent Gigs ---

@router.get("/talent/gigs", response_model=List[OrgTalentGigRead])
def get_talent_gigs():
    sb = get_supabase_admin()
    result = sb.table("org_talent_gigs").select("*").execute()
    return result.data

@router.post("/talent/gigs", response_model=OrgTalentGigRead, status_code=status.HTTP_201_CREATED)
def create_talent_gig(gig: OrgTalentGigCreate):
    sb = get_supabase_admin()
    
    # Auto-match employees if not provided
    if not gig.matched_employees:
        import random
        res = sb.table("employees").select("id, full_name, department").limit(20).execute()
        if res.data:
            dept_matches = [emp for emp in res.data if emp["department"] == gig.department]
            if not dept_matches:
                dept_matches = res.data
            sampled = random.sample(dept_matches, min(3, len(dept_matches)))
            gig.matched_employees = [
                {"id": emp["id"], "name": emp["full_name"], "match": random.randint(75, 98)}
                for emp in sampled
            ]
            gig.matched_employees.sort(key=lambda x: x["match"], reverse=True)

    result = sb.table("org_talent_gigs").insert(gig.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create talent gig")
    return result.data[0]

@router.put("/talent/gigs/{id}", response_model=OrgTalentGigRead)
def update_talent_gig(id: str, gig: OrgTalentGigUpdate):
    sb = get_supabase_admin()
    update_data = gig.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_talent_gigs").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent gig not found")
    return result.data[0]

@router.delete("/talent/gigs/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_talent_gig(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_talent_gigs").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent gig not found")
    return None


# --- Talent Applications ---

@router.get("/talent/applications", response_model=List[OrgTalentApplicationRead])
def get_talent_applications(opportunity_type: str = None, employee_id: str = None):
    """List all applications, optionally filtered by type or employee."""
    sb = get_supabase_admin()
    query = sb.table("org_talent_applications").select("*").order("created_at", desc=True)
    if opportunity_type:
        query = query.eq("opportunity_type", opportunity_type)
    if employee_id:
        query = query.eq("applicant_employee_id", employee_id)
    result = query.execute()
    return result.data

@router.post("/talent/applications", response_model=OrgTalentApplicationRead, status_code=status.HTTP_201_CREATED)
def create_talent_application(application: OrgTalentApplicationCreate):
    """Submit a gig application or mentorship request."""
    sb = get_supabase_admin()
    result = sb.table("org_talent_applications").insert(application.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to submit application")
    return result.data[0]

@router.patch("/talent/applications/{id}", response_model=OrgTalentApplicationRead)
def update_application_status(id: str, update: OrgTalentApplicationUpdate):
    """Update application status (Under Review / Accepted / Rejected)."""
    sb = get_supabase_admin()
    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided")
    result = sb.table("org_talent_applications").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return result.data[0]


# --- Talent Mentors ---

@router.get("/talent/mentors", response_model=List[OrgTalentMentorRead])
def get_talent_mentors():
    sb = get_supabase_admin()
    result = sb.table("org_talent_mentors").select("*").execute()
    return result.data

@router.post("/talent/mentors", response_model=OrgTalentMentorRead, status_code=status.HTTP_201_CREATED)
def create_talent_mentor(mentor: OrgTalentMentorCreate):
    sb = get_supabase_admin()
    result = sb.table("org_talent_mentors").insert(mentor.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create talent mentor")
    return result.data[0]

@router.put("/talent/mentors/{id}", response_model=OrgTalentMentorRead)
def update_talent_mentor(id: str, mentor: OrgTalentMentorUpdate):
    sb = get_supabase_admin()
    update_data = mentor.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_talent_mentors").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent mentor not found")
    return result.data[0]

@router.delete("/talent/mentors/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_talent_mentor(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_talent_mentors").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent mentor not found")
    return None


# --- Team Builder Options ---

@router.get("/talent/team-builder", response_model=List[OrgTeamBuilderOptionRead])
def get_team_builder_options():
    sb = get_supabase_admin()
    result = sb.table("org_team_builder_options").select("*").execute()
    return result.data

@router.post("/talent/team-builder", response_model=OrgTeamBuilderOptionRead, status_code=status.HTTP_201_CREATED)
def create_team_builder_option(option: OrgTeamBuilderOptionCreate):
    sb = get_supabase_admin()
    result = sb.table("org_team_builder_options").insert(option.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create team builder option")
    return result.data[0]

@router.put("/talent/team-builder/{id}", response_model=OrgTeamBuilderOptionRead)
def update_team_builder_option(id: str, option: OrgTeamBuilderOptionUpdate):
    sb = get_supabase_admin()
    update_data = option.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_team_builder_options").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Team builder option not found")
    return result.data[0]

@router.delete("/talent/team-builder/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_builder_option(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_team_builder_options").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Team builder option not found")
    return None

@router.post("/talent/team-builder/optimize", response_model=List[OrgTeamBuilderOptionRead])
def optimize_team_builder(request: TeamBuilderOptimizationRequest):
    sb = get_supabase_admin()
    
    # Fetch active employees
    res = sb.table("employees").select("*").eq("employment_status", "Active").execute()
    employees = res.data
    # We will fetch actual skills for these employees from the `skills` table
    try:
        employee_ids = [emp["id"] for emp in employees]
        if employee_ids:
            res_skills = sb.table("skills").select("employee_id, name").in_("employee_id", employee_ids).execute()
            skills_data = res_skills.data if res_skills.data else []
            
            # Map skills to employees
            skills_map = {}
            for row in skills_data:
                emp_id = row["employee_id"]
                if emp_id not in skills_map:
                    skills_map[emp_id] = []
                skills_map[emp_id].append(row["name"])
                
            for emp in employees:
                emp["skills"] = skills_map.get(emp["id"], [])
        else:
            for emp in employees:
                emp["skills"] = []
    except Exception as e:
        print(f"Skills table fetch failed: {e}. Using empty skills.")
        for emp in employees:
            emp["skills"] = []
            
    # Run optimization engine
    options = optimize_team(
        employees=employees,
        headcount=request.headcount,
        required_skills=request.core_competencies
    )
    
    return options



# --- Strategy OKRs ---

@router.get("/strategy/okrs", response_model=List[OrgOKRRead])
def get_okrs():
    sb = get_supabase_admin()
    result = sb.table("org_okrs").select("*").execute()
    return result.data

@router.post("/strategy/okrs", response_model=OrgOKRRead, status_code=status.HTTP_201_CREATED)
def create_okr(okr: OrgOKRCreate):
    sb = get_supabase_admin()
    result = sb.table("org_okrs").insert(okr.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create OKR")
    return result.data[0]

@router.put("/strategy/okrs/{id}", response_model=OrgOKRRead)
def update_okr(id: str, okr: OrgOKRUpdate):
    sb = get_supabase_admin()
    update_data = okr.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_okrs").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="OKR not found")
    return result.data[0]

@router.delete("/strategy/okrs/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_okr(id: str):
    sb = get_supabase_admin()
    result = sb.table("org_okrs").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="OKR not found")
    return None

# --- Organization Context & Strategy ---

@router.get("/strategy/vision", response_model=List[OrgStrategyVisionResponse])
def get_strategy_vision():
    sb = get_supabase_admin()
    result = sb.table("org_strategy_vision").select("*").execute()
    return result.data

@router.get("/strategy/ai-readiness", response_model=List[OrgAIReadinessResponse])
def get_ai_readiness():
    sb = get_supabase_admin()
    result = sb.table("org_ai_readiness").select("*").execute()
    return result.data

@router.get("/strategy/capabilities", response_model=List[OrgCapabilityResponse])
def get_capabilities():
    sb = get_supabase_admin()
    result = sb.table("org_capabilities").select("*").execute()
    return result.data

@router.get("/strategy/transformations", response_model=List[OrgTransformationResponse])
def get_transformations():
    sb = get_supabase_admin()
    result = sb.table("org_transformations").select("*").execute()
    return result.data

@router.get("/talent/skill-shortages")
def get_skill_shortages():
    sb = get_supabase_admin()
    # 1. Fetch current employees to build skill inventory and calculate burnout
    res = sb.table("employees").select("role, department, twin_health, years_experience").execute()
    employees = res.data
    
    current_headcount = len(employees)
    
    # Build inventory
    skill_inventory = {}
    for emp in employees:
        role = emp.get("role", "Unknown")
        dept = emp.get("department", "Unknown")
        if role not in skill_inventory:
            skill_inventory[role] = {"count": 0, "dept": dept, "core_skill": f"{role} Core Skills"}
        skill_inventory[role]["count"] += 1
        
    # 2. Calculate dynamic average burnout for the whole org based on Proxy Metrics
    avg_burnout = calculate_average_burnout(employees)
    
    # Other features (Mocked for now)
    comp_ratio = 1.05
    industry_demand = 82.0
    avg_tenure = 4.2
    planned_retirements = 15 # Mocked
    
    # 3. Forecast loss using trained ML model
    projected_loss = forecast_headcount_loss(
        current_headcount=current_headcount, 
        average_burnout_score=avg_burnout, 
        comp_ratio=comp_ratio, 
        industry_demand=industry_demand, 
        average_tenure=avg_tenure, 
        planned_retirements=planned_retirements
    )
    
    # 4. Rank shortages using Rule-weighted ML scoring (Assume 15% growth target)
    growth_target = 15.0
    shortages = rank_skill_shortages(skill_inventory, growth_target, current_headcount, projected_loss)
    
    # Return top 15 shortages
    return shortages[:15]

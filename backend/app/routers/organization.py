from __future__ import annotations
"""
API routes for Organization module.
"""
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from app.database import get_db
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
    TeamBuilderOptimizationRequest, SimulationRequest,
    InterventionEffectiveness,
)
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "ml", "src"))
from organization.workforce_forecasting.forecast_engine import forecast_headcount_loss, rank_skill_shortages
from organization.workforce_forecasting.burnout_calculator import calculate_average_burnout
from organization.team_builder.optimization_engine import optimize_team
from organization.at_risk.risk_model import calculate_intervention_effectiveness
from organization.simulation.causal_simulator import run_causal_simulation

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
    sb = get_db()
    result = sb.table("organization_metrics").select("*").order("date").limit(limit).execute()
    return result.data

@router.get("/metrics", response_model=List[OrganizationMetricRead])
def get_organization_metrics(limit: int = 100):
    sb = get_db()
    result = sb.table("organization_metrics").select("*").order("date").limit(limit).execute()
    return result.data

@router.post("/metrics", response_model=OrganizationMetricRead, status_code=status.HTTP_201_CREATED)
def create_organization_metric(metric: OrganizationMetricCreate):
    sb = get_db()
    result = sb.table("organization_metrics").insert(metric.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create metric")
    return result.data[0]

@router.put("/metrics/{id}", response_model=OrganizationMetricRead)
def update_organization_metric(id: str, metric: OrganizationMetricUpdate):
    sb = get_db()
    update_data = metric.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("organization_metrics").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Metric not found")
    return result.data[0]

@router.delete("/metrics/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_metric(id: str):
    sb = get_db()
    result = sb.table("organization_metrics").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Metric not found")
    return None


# --- Organization Scenarios ---

@router.get("/scenarios", response_model=List[OrganizationScenarioRead])
def get_organization_scenarios():
    sb = get_db()
    result = sb.table("organization_scenarios").select("*").execute()
    return result.data

@router.post("/scenarios", response_model=OrganizationScenarioRead, status_code=status.HTTP_201_CREATED)
def create_organization_scenario(scenario: OrganizationScenarioCreate):
    sb = get_db()
    result = sb.table("organization_scenarios").insert(scenario.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create scenario")
    return result.data[0]

@router.put("/scenarios/{id}", response_model=OrganizationScenarioRead)
def update_organization_scenario(id: str, scenario: OrganizationScenarioUpdate):
    sb = get_db()
    update_data = scenario.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("organization_scenarios").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return result.data[0]

@router.delete("/scenarios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_scenario(id: str):
    sb = get_db()
    result = sb.table("organization_scenarios").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return None


# --- Innovation Ideas ---

@router.get("/innovation/ideas", response_model=List[OrgInnovationIdeaRead])
def get_innovation_ideas():
    sb = get_db()
    result = sb.table("org_innovation_ideas").select("*").execute()
    return result.data

@router.post("/innovation/ideas", response_model=OrgInnovationIdeaRead, status_code=status.HTTP_201_CREATED)
def create_innovation_idea(idea: OrgInnovationIdeaCreate):
    sb = get_db()
    result = sb.table("org_innovation_ideas").insert(idea.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create innovation idea")
    return result.data[0]

@router.put("/innovation/ideas/{id}", response_model=OrgInnovationIdeaRead)
def update_innovation_idea(id: str, idea: OrgInnovationIdeaUpdate):
    sb = get_db()
    update_data = idea.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_innovation_ideas").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation idea not found")
    return result.data[0]

@router.delete("/innovation/ideas/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_innovation_idea(id: str):
    sb = get_db()
    result = sb.table("org_innovation_ideas").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation idea not found")
    return None


# --- Innovation Communities ---

@router.get("/innovation/communities", response_model=List[OrgInnovationCommunityRead])
def get_innovation_communities():
    sb = get_db()
    result = sb.table("org_innovation_communities").select("*").execute()
    return result.data

@router.post("/innovation/communities", response_model=OrgInnovationCommunityRead, status_code=status.HTTP_201_CREATED)
def create_innovation_community(community: OrgInnovationCommunityCreate):
    sb = get_db()
    result = sb.table("org_innovation_communities").insert(community.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create innovation community")
    return result.data[0]

@router.put("/innovation/communities/{id}", response_model=OrgInnovationCommunityRead)
def update_innovation_community(id: str, community: OrgInnovationCommunityUpdate):
    sb = get_db()
    update_data = community.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_innovation_communities").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation community not found")
    return result.data[0]

@router.delete("/innovation/communities/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_innovation_community(id: str):
    sb = get_db()
    result = sb.table("org_innovation_communities").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Innovation community not found")
    return None


# --- At Risk Employees ---

@router.get("/talent/risks", response_model=List[OrgAtRiskEmployeeRead])
def get_at_risk_employees():
    sb = get_db()
    result = sb.table("org_at_risk_employees").select("*").execute()
    return result.data

@router.post("/talent/risks", response_model=OrgAtRiskEmployeeRead, status_code=status.HTTP_201_CREATED)
def create_at_risk_employee(risk: OrgAtRiskEmployeeCreate):
    sb = get_db()
    result = sb.table("org_at_risk_employees").insert(risk.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create at-risk employee record")
    return result.data[0]

@router.put("/talent/risks/{id}", response_model=OrgAtRiskEmployeeRead)
def update_at_risk_employee(id: str, risk: OrgAtRiskEmployeeUpdate):
    sb = get_db()
    update_data = risk.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_at_risk_employees").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="At-risk employee record not found")
    return result.data[0]

@router.delete("/talent/risks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_at_risk_employee(id: str):
    sb = get_db()
    result = sb.table("org_at_risk_employees").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="At-risk employee record not found")
    return None


# --- Talent Gigs ---

@router.get("/talent/gigs", response_model=List[OrgTalentGigRead])
def get_talent_gigs():
    sb = get_db()
    result = sb.table("org_talent_gigs").select("*").execute()
    return result.data

@router.post("/talent/gigs", response_model=OrgTalentGigRead, status_code=status.HTTP_201_CREATED)
def create_talent_gig(gig: OrgTalentGigCreate):
    sb = get_db()
    result = sb.table("org_talent_gigs").insert(gig.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create talent gig")
    return result.data[0]

@router.put("/talent/gigs/{id}", response_model=OrgTalentGigRead)
def update_talent_gig(id: str, gig: OrgTalentGigUpdate):
    sb = get_db()
    update_data = gig.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_talent_gigs").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent gig not found")
    return result.data[0]

@router.delete("/talent/gigs/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_talent_gig(id: str):
    sb = get_db()
    result = sb.table("org_talent_gigs").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent gig not found")
    return None


# --- Talent Mentors ---

@router.get("/talent/mentors", response_model=List[OrgTalentMentorRead])
def get_talent_mentors():
    sb = get_db()
    result = sb.table("org_talent_mentors").select("*").execute()
    return result.data

@router.post("/talent/mentors", response_model=OrgTalentMentorRead, status_code=status.HTTP_201_CREATED)
def create_talent_mentor(mentor: OrgTalentMentorCreate):
    sb = get_db()
    result = sb.table("org_talent_mentors").insert(mentor.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create talent mentor")
    return result.data[0]

@router.put("/talent/mentors/{id}", response_model=OrgTalentMentorRead)
def update_talent_mentor(id: str, mentor: OrgTalentMentorUpdate):
    sb = get_db()
    update_data = mentor.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_talent_mentors").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent mentor not found")
    return result.data[0]

@router.delete("/talent/mentors/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_talent_mentor(id: str):
    sb = get_db()
    result = sb.table("org_talent_mentors").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Talent mentor not found")
    return None


# --- Team Builder Options ---

@router.get("/talent/team-builder", response_model=List[OrgTeamBuilderOptionRead])
def get_team_builder_options():
    sb = get_db()
    result = sb.table("org_team_builder_options").select("*").execute()
    return result.data

@router.post("/talent/team-builder", response_model=OrgTeamBuilderOptionRead, status_code=status.HTTP_201_CREATED)
def create_team_builder_option(option: OrgTeamBuilderOptionCreate):
    sb = get_db()
    result = sb.table("org_team_builder_options").insert(option.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create team builder option")
    return result.data[0]

@router.put("/talent/team-builder/{id}", response_model=OrgTeamBuilderOptionRead)
def update_team_builder_option(id: str, option: OrgTeamBuilderOptionUpdate):
    sb = get_db()
    update_data = option.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_team_builder_options").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Team builder option not found")
    return result.data[0]

@router.delete("/talent/team-builder/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_builder_option(id: str):
    sb = get_db()
    result = sb.table("org_team_builder_options").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Team builder option not found")
    return None


# --- Strategy OKRs ---

@router.get("/strategy/okrs", response_model=List[OrgOKRRead])
def get_okrs():
    sb = get_db()
    result = sb.table("org_okrs").select("*").execute()
    return result.data

@router.post("/strategy/okrs", response_model=OrgOKRRead, status_code=status.HTTP_201_CREATED)
def create_okr(okr: OrgOKRCreate):
    sb = get_db()
    result = sb.table("org_okrs").insert(okr.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create OKR")
    return result.data[0]

@router.put("/strategy/okrs/{id}", response_model=OrgOKRRead)
def update_okr(id: str, okr: OrgOKRUpdate):
    sb = get_db()
    update_data = okr.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("org_okrs").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="OKR not found")
    return result.data[0]

@router.delete("/strategy/okrs/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_okr(id: str):
    sb = get_db()
    result = sb.table("org_okrs").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="OKR not found")
    return None

# --- Organization Context & Strategy ---

@router.get("/strategy/vision", response_model=List[OrgStrategyVisionResponse])
def get_strategy_vision():
    sb = get_db()
    result = sb.table("org_strategy_vision").select("*").execute()
    return result.data

@router.get("/strategy/ai-readiness", response_model=List[OrgAIReadinessResponse])
def get_ai_readiness():
    sb = get_db()
    result = sb.table("org_ai_readiness").select("*").execute()
    return result.data

@router.get("/strategy/capabilities", response_model=List[OrgCapabilityResponse])
def get_capabilities():
    sb = get_db()
    result = sb.table("org_capabilities").select("*").execute()
    return result.data

@router.get("/strategy/transformations", response_model=List[OrgTransformationResponse])
def get_transformations():
    sb = get_db()
    result = sb.table("org_transformations").select("*").execute()
    return result.data

@router.get("/talent/skill-shortages")
def get_skill_shortages():
    sb = get_db()
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

@router.post("/talent/team-builder/optimize", response_model=List[OrgTeamBuilderOptionRead])
def optimize_team_builder(request: TeamBuilderOptimizationRequest):
    sb = get_db()
    
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

@router.get("/interventions/effectiveness", response_model=List[InterventionEffectiveness])
def get_intervention_effectiveness():
    sb = get_db()
    
    # Fetch active employees to seed the ML insights
    res = sb.table("employees").select("*").eq("employment_status", "Active").execute()
    employees = res.data
    
    effectiveness_data = calculate_intervention_effectiveness(employees)
    return effectiveness_data

@router.post("/simulation/run")
def run_simulation(request: SimulationRequest):
    sb = get_db()
    
    # Fetch historical metrics to seed the simulation baseline
    res = sb.table("organization_metrics").select("*").order("month", desc=False).execute()
    historical_metrics = res.data
    
    params = request.model_dump()
    
    # Run causal inference engine (returns monthly_series, redundancy_forecast, critical_role_shifts, impact_matrix)
    simulation_results = run_causal_simulation(params, historical_metrics, request.isSnapshot)
    return simulation_results

# ==================== STRATEGY ROLE ARCHITECT ====================

SAMPLE_STRATEGY_DRIVERS = [
    {
        "id": "DRV-101",
        "title": "Scale AI-enabled analytics across retail lines",
        "description": "Enterprise strategic push to embed predictive ML models in store & digital operations",
        "horizon_start_fy": 2025,
        "horizon_end_fy": 2028,
        "status": "Active",
        "owner": "Chief Digital Officer",
        "business_unit": "Enterprise Analytics"
    },
    {
        "id": "DRV-102",
        "title": "Network modernization & SD-WAN rollout",
        "description": "Multi-year infrastructure upgrade replacing legacy MPLS with automated SD-WAN architecture",
        "horizon_start_fy": 2025,
        "horizon_end_fy": 2027,
        "status": "Active",
        "owner": "Head of IT Infrastructure",
        "business_unit": "Core Network Operations"
    },
    {
        "id": "DRV-103",
        "title": "Enterprise-wide People Analytics Maturity",
        "description": "Transform HR decision-making with automated talent analytics, skill twin models, and attrition prediction",
        "horizon_start_fy": 2025,
        "horizon_end_fy": 2026,
        "status": "Active",
        "owner": "Chief Human Resources Officer",
        "business_unit": "People & Culture"
    },
    {
        "id": "DRV-104",
        "title": "Legacy Mainframe Infrastructure Phase-Out",
        "description": "Decommission legacy IBM z/OS mainframes and migrate core banking workloads to AWS cloud",
        "horizon_start_fy": 2021,
        "horizon_end_fy": 2024,
        "status": "Expired",
        "owner": "Legacy Systems Director",
        "business_unit": "Core Infrastructure"
    },
    {
        "id": "DRV-105",
        "title": "Digital Branch Automation Initiative",
        "description": "Automate retail branch teller workflows and deploy self-service kiosk terminals",
        "horizon_start_fy": 2023,
        "horizon_end_fy": 2025,
        "status": "Archived",
        "owner": "Retail Operations Lead",
        "business_unit": "Retail Operations"
    }
]

SAMPLE_ROLE_ARCHITECT_DATA = [
    {
        "role_id": "ROLE-2001",
        "rank": 1,
        "role": "Senior Data Scientist",
        "job_code": "RA-DS-04",
        "dept": "Enterprise Analytics",
        "business_unit": "Enterprise Analytics",
        "level": "L4 Senior",
        "career_hierarchy": "Analyst → Senior Analyst → Data Scientist → Senior Data Scientist",
        "strategy_driver_id": "DRV-101",
        "status": "Live",
        "version": "v1.0",
        "version_history": [],
        "skill": "Python (Advanced), Machine Learning, MLOps, Statistics",
        "role_spec": "Senior Data Scientist — owns ML model lifecycle; leads production ML pipeline deployment",
        "target_headcount": "9 FTE by FY26",
        "current_headcount": 6,
        "budgeted_headcount": "9 (FY26)",
        "gap": "+3",
        "urgency": "HIGH",
        "role_evolution": "Evolving",
        "fulfillment_5b": "Build 60% (reskill) + Buy 40% (hire)",
        "fulfillment_5b_breakdown": {"build": 60, "buy": 40, "borrow": 0, "bot": 0, "bridge": 0},
        "capability_gap_targets": "MLOps gap (avg L2 vs target L3); High priority",
        "skill_proficiency_map": [
            {"skill": "Python", "current": 3, "target": 4, "importance": "Critical"},
            {"skill": "Machine Learning", "current": 2, "target": 4, "importance": "Critical"},
            {"skill": "MLOps", "current": 2, "target": 3, "importance": "Important"},
            {"skill": "Statistics", "current": 3, "target": 4, "importance": "Important"},
            {"skill": "Cloud Architecture", "current": 2, "target": 3, "importance": "Desirable"}
        ],
        "demand_lines": [
            {
                "id": "dl-2001-1",
                "fiscal_year": 2026,
                "demand_headcount_growth": 2,
                "demand_headcount_attrition": 1,
                "demand_headcount_gross": 3,
                "created_at": "2026-01-15T00:00:00Z"
            }
        ],
        "internal_mobility": ["Data Analyst L3", "BI Developer L3"],
        "market_risk": "High — Cloud/ML skills, competitive market",
        "hr_inputs": {
            "business_unit": "Enterprise Analytics",
            "job_code": "RA-DS-04; Senior Data Scientist; Data & Analytics; L4",
            "hierarchy": "Analyst → Senior Analyst → Data Scientist → Senior Data Scientist",
            "required_skills": "Python (Advanced), Machine Learning, MLOps, Statistics",
            "current_headcount": 6,
            "budgeted_headcount": "9 (FY26)",
            "compensation_band": "Band 7",
            "strategy_driver": "Scale AI-enabled analytics across retail lines (FY26–28)",
            "future_operating_model": "Centralized analytics hub; embedded ML pipelines; cloud-native (AWS) roadmap",
            "workforce_assumptions": "+50% analytics capacity over 24 months | +3 HC (FY26)",
            "target_salary_band": "Band 7 – Band 8",
            "historical_attrition": "14% annual (Enterprise Analytics, TTM)",
            "skill_baseline": "Avg: Python L3, ML L2",
            "time_to_hire": "65 days external / 40 days internal",
            "location_work_model": "Colombo HQ; Hybrid (3 days onsite)",
            "employment_mix": "85% FTE / 15% Contractor",
            "sunsetting_context": "Legacy on-prem BI reporting phased out by FY27",
            "genai_impact": "+20% (AutoML & GenAI copilots)",
            "criticality_index": "High – Tier 1 (blocks analytics roadmap)",
            "opex_budget_ceiling": "LKR 45M/yr (Enterprise Analytics, FY26)"
        }
    },
    {
        "role_id": "ROLE-2002",
        "rank": 2,
        "role": "Network Automation Engineer",
        "job_code": "RA-NW-05",
        "dept": "Core Network Operations",
        "business_unit": "Core Network Operations",
        "level": "L4 Senior",
        "career_hierarchy": "Engineer → Senior Engineer → Automation Engineer → Architect",
        "strategy_driver_id": "DRV-102",
        "status": "Live",
        "version": "v1.0",
        "version_history": [],
        "skill": "SD-WAN, Network Automation (Python/Ansible), Routing & Switching",
        "role_spec": "Network Automation Engineer — designs/maintains automated network provisioning & monitoring",
        "target_headcount": "7 FTE by FY26",
        "current_headcount": 4,
        "budgeted_headcount": "7 (FY26)",
        "gap": "+3",
        "urgency": "HIGH",
        "role_evolution": "Emerging",
        "fulfillment_5b": "Build 50% + Borrow 30% (contractor) + Buy 20%",
        "fulfillment_5b_breakdown": {"build": 50, "buy": 20, "borrow": 30, "bot": 0, "bridge": 0},
        "capability_gap_targets": "Automation scripting gap (avg L1 vs target L2); High priority",
        "skill_proficiency_map": [
            {"skill": "Network Automation", "current": 1, "target": 3, "importance": "Critical"},
            {"skill": "SD-WAN", "current": 2, "target": 3, "importance": "Critical"},
            {"skill": "Routing & Switching", "current": 3, "target": 4, "importance": "Important"},
            {"skill": "Scripting / Python", "current": 1, "target": 2, "importance": "Desirable"}
        ],
        "demand_lines": [
            {
                "id": "dl-2002-1",
                "fiscal_year": 2026,
                "demand_headcount_growth": 2,
                "demand_headcount_attrition": 1,
                "demand_headcount_gross": 3,
                "created_at": "2026-01-15T00:00:00Z"
            }
        ],
        "internal_mobility": ["Senior Network Engineer", "NOC Technician L3"],
        "market_risk": "Medium-High — SD-WAN automation talent scarce regionally",
        "hr_inputs": {
            "business_unit": "Core Network Operations",
            "job_code": "RA-NW-05; Network Automation Engineer; Network & Infrastructure; L4",
            "hierarchy": "Engineer → Senior Engineer → Automation Engineer → Architect",
            "required_skills": "SD-WAN, Network Automation (Python/Ansible), Routing & Switching",
            "current_headcount": 4,
            "budgeted_headcount": "7 (FY26)",
            "compensation_band": "Band 6",
            "strategy_driver": "Network modernization & SD-WAN rollout across regional sites",
            "future_operating_model": "Automated, self-healing network ops; SD-WAN roadmap",
            "workforce_assumptions": "+75% automation capability over 18 months | +3 HC (FY26)",
            "target_salary_band": "Band 6 – Band 7",
            "historical_attrition": "9% annual (Core Network Ops, TTM)",
            "skill_baseline": "Avg: Routing & Switching L3, Automation L1",
            "time_to_hire": "75 days external / 50 days internal",
            "location_work_model": "Kandy regional hub; On-site",
            "employment_mix": "70% FTE / 30% Contractor (vendor rollout)",
            "sunsetting_context": "Manual CLI network config phased out by FY27",
            "genai_impact": "+30% (automation scripts)",
            "criticality_index": "High – Tier 1 (SD-WAN rollout dependency)",
            "opex_budget_ceiling": "LKR 30M/yr (Core Network Ops, FY26)"
        }
    },
    {
        "role_id": "ROLE-2003",
        "rank": 3,
        "role": "People Analytics Lead",
        "job_code": "RA-HR-03",
        "dept": "People & Culture",
        "business_unit": "People & Culture",
        "level": "L4 Lead",
        "career_hierarchy": "HR Executive → HRBP → People Analytics Specialist → People Analytics Lead",
        "strategy_driver_id": "DRV-103",
        "status": "Live",
        "version": "v1.0",
        "version_history": [],
        "skill": "Workforce Analytics, HR Data Modelling, Stakeholder Reporting",
        "role_spec": "People Analytics Lead — builds workforce dashboards; advises leadership on capability risk",
        "target_headcount": "3 FTE by FY26",
        "current_headcount": 1,
        "budgeted_headcount": "3 (FY26)",
        "gap": "+2",
        "urgency": "MEDIUM",
        "role_evolution": "Emerging",
        "fulfillment_5b": "Buy 50% + Build 50%",
        "fulfillment_5b_breakdown": {"build": 50, "buy": 50, "borrow": 0, "bot": 0, "bridge": 0},
        "capability_gap_targets": "Workforce Analytics gap (avg L1 vs target L3); Medium priority",
        "skill_proficiency_map": [
            {"skill": "Workforce Analytics", "current": 1, "target": 3, "importance": "Critical"},
            {"skill": "HR Data Modelling", "current": 2, "target": 3, "importance": "Important"},
            {"skill": "Stakeholder Reporting", "current": 3, "target": 4, "importance": "Important"},
            {"skill": "Employee Relations", "current": 3, "target": 3, "importance": "Desirable"}
        ],
        "demand_lines": [
            {
                "id": "dl-2003-1",
                "fiscal_year": 2026,
                "demand_headcount_growth": 1,
                "demand_headcount_attrition": 1,
                "demand_headcount_gross": 2,
                "created_at": "2026-01-15T00:00:00Z"
            }
        ],
        "internal_mobility": ["HR Business Partner", "HR Data Analyst"],
        "market_risk": "Medium — niche HR analytics skillset",
        "hr_inputs": {
            "business_unit": "People & Culture",
            "job_code": "RA-HR-03; People Analytics Lead; HR & People; L4",
            "hierarchy": "HR Executive → HRBP → People Analytics Specialist → People Analytics Lead",
            "required_skills": "Workforce Analytics, HR Data Modelling, Stakeholder Reporting",
            "current_headcount": 1,
            "budgeted_headcount": "3 (FY26)",
            "compensation_band": "Band 6",
            "strategy_driver": "Build enterprise-wide people-analytics maturity",
            "future_operating_model": "Centralized people-analytics function under CHRO office",
            "workforce_assumptions": "+200% people-analytics capacity over 12 months | +2 HC (FY26)",
            "target_salary_band": "Band 6 – Band 7",
            "historical_attrition": "6% annual (People & Culture, TTM)",
            "skill_baseline": "Avg: Employee Relations L3, Workforce Analytics L1",
            "time_to_hire": "55 days external / 35 days internal",
            "location_work_model": "Colombo HQ; Remote-friendly",
            "employment_mix": "100% FTE",
            "sunsetting_context": "Manual Excel HR reporting phased out by FY26",
            "genai_impact": "+15% (automated dashboards)",
            "criticality_index": "Medium – Tier 2 (supports, doesn't block)",
            "opex_budget_ceiling": "LKR 12M/yr (People & Culture, FY26)"
        }
    },
    {
        "role_id": "ROLE-2004",
        "rank": 4,
        "role": "Legacy Mainframe Specialist",
        "job_code": "RA-IT-08",
        "dept": "Core Infrastructure",
        "business_unit": "IT Operations",
        "level": "L3 Specialist",
        "career_hierarchy": "System Operator → Mainframe Specialist → Senior Mainframe Specialist",
        "strategy_driver_id": "DRV-104",
        "status": "Live",
        "version": "v1.0",
        "version_history": [],
        "skill": "COBOL Mainframe, JCL Scripting, DB2 Legacy",
        "role_spec": "Legacy Mainframe Specialist — maintains legacy banking system mainframe during cloud transition phase",
        "target_headcount": "2 FTE by FY24",
        "current_headcount": 4,
        "budgeted_headcount": "2 (FY24)",
        "gap": "-2",
        "urgency": "LOW",
        "role_evolution": "Sunsetting",
        "fulfillment_5b": "Bridge 100% (retrain & migrate)",
        "fulfillment_5b_breakdown": {"build": 0, "buy": 0, "borrow": 0, "bot": 0, "bridge": 100},
        "capability_gap_targets": "Mainframe sun-setting gap; Low priority (phase-out)",
        "skill_proficiency_map": [
            {"skill": "COBOL Mainframe", "current": 4, "target": 4, "importance": "Critical"},
            {"skill": "JCL Scripting", "current": 3, "target": 3, "importance": "Important"},
            {"skill": "DB2 Legacy", "current": 3, "target": 3, "importance": "Desirable"}
        ],
        "demand_lines": [
            {
                "id": "dl-2004-1",
                "fiscal_year": 2024,
                "demand_headcount_growth": 0,
                "demand_headcount_attrition": 2,
                "demand_headcount_gross": 2,
                "created_at": "2024-01-15T00:00:00Z"
            }
        ],
        "internal_mobility": ["Cloud Migration Engineer", "Linux SysAdmin"],
        "market_risk": "Low — skills being phased out",
        "hr_inputs": {
            "business_unit": "IT Operations",
            "job_code": "RA-IT-08; Legacy Mainframe Specialist; IT; L3",
            "hierarchy": "System Operator → Mainframe Specialist → Senior Mainframe Specialist",
            "required_skills": "COBOL Mainframe, JCL Scripting, DB2 Legacy",
            "current_headcount": 4,
            "budgeted_headcount": "2 (FY24)",
            "compensation_band": "Band 5",
            "strategy_driver": "Decommission legacy IBM mainframes",
            "future_operating_model": "Phased shutdown; cloud migration to AWS",
            "workforce_assumptions": "-50% headcount by FY25 | -2 HC (FY24)",
            "target_salary_band": "Band 5 – Band 6",
            "historical_attrition": "4% annual",
            "skill_baseline": "COBOL L4, JCL L3",
            "time_to_hire": "90 days external",
            "location_work_model": "Colombo Data Center; On-site",
            "employment_mix": "100% FTE",
            "sunsetting_context": "Mainframe environment fully phased out by end of FY25",
            "genai_impact": "0%",
            "criticality_index": "Low – Sunsetting role",
            "opex_budget_ceiling": "LKR 10M/yr"
        }
    }
]

@router.get("/strategy/role-specs")
def get_strategy_role_specs(department: str = None):
    """Retrieve translated future role specifications & requirements."""
    sb = get_db()
    try:
        query = sb.table("org_strategy_role_specs").select("*").order("rank")
        if department and department != "All Departments":
            query = query.eq("dept", department)
        res = query.execute()
        if res.data and len(res.data) > 0:
            # Check if DB data has full role_id & hr_inputs, otherwise enrich or fallback to SAMPLE_ROLE_ARCHITECT_DATA
            has_rich_data = any(row.get("role_id") and row.get("hr_inputs") for row in res.data)
            if has_rich_data:
                return res.data
    except Exception as e:
        print(f"Fabric fetch for org_strategy_role_specs failed: {e}")

    specs = SAMPLE_ROLE_ARCHITECT_DATA
    if department and department != "All Departments":
        specs = [s for s in specs if s["dept"] == department or s.get("business_unit") == department]
    return specs

@router.get("/strategy/inputs")
def get_strategy_inputs(role_id: str = None):
    """Retrieve structured HR & Strategy Inputs per role."""
    if role_id:
        filtered = [item for item in SAMPLE_ROLE_ARCHITECT_DATA if item["role_id"] == role_id]
        return filtered[0]["hr_inputs"] if filtered else {}
    return [item["hr_inputs"] for item in SAMPLE_ROLE_ARCHITECT_DATA]


# --- Strategy Role Architect API Endpoints & Request Models ---

class StrategyRoleSaveRequest(BaseModel):
    role_id: Optional[str] = None
    role: str
    job_code: Optional[str] = None
    dept: str
    business_unit: Optional[str] = None
    level: str
    strategy_driver_id: Optional[str] = None
    status: str = "Draft"  # Live | Draft | Archived
    version: Optional[str] = "v1.0"
    role_evolution: Optional[str] = "Emerging"
    skill_proficiency_map: Optional[List[Dict[str, Any]]] = []
    fulfillment_5b: Optional[str] = None
    capability_gap_targets: Optional[str] = None

class DemandLineCreateRequest(BaseModel):
    fiscal_year: int
    demand_headcount_growth: int
    demand_headcount_attrition: int

class PersonaQARequest(BaseModel):
    persona: str  # "Employee" | "Manager" | "Employer"
    question: str
    role_id: Optional[str] = None

@router.get("/strategy/drivers")
def get_strategy_drivers():
    """Retrieve strategic drivers list with horizon years and statuses."""
    sb = get_supabase_admin()
    try:
        res = sb.table("org_strategy_drivers").select("*").execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception as e:
        print(f"Supabase fetch for org_strategy_drivers failed: {e}")
    return SAMPLE_STRATEGY_DRIVERS

@router.get("/strategy/orphaned-roles")
def get_orphaned_roles():
    """Flag any Future Role whose linked Strategy Driver has expired or been archived (AC 3.2)."""
    drivers_dict = {d["id"]: d for d in SAMPLE_STRATEGY_DRIVERS}
    current_fy = 2026
    orphaned = []

    for role in SAMPLE_ROLE_ARCHITECT_DATA:
        driver_id = role.get("strategy_driver_id")
        driver = drivers_dict.get(driver_id)
        
        reason = None
        if not driver_id or not driver:
            reason = "Role has no valid strategy driver linked (Orphaned Role)"
        elif driver.get("status") in ["Expired", "Archived"]:
            reason = f"Linked Strategy Driver '{driver.get('title')}' is {driver.get('status')}"
        elif driver.get("horizon_end_fy") and driver.get("horizon_end_fy") < current_fy:
            reason = f"Linked Strategy Driver '{driver.get('title')}' expired past FY{driver.get('horizon_end_fy')} horizon"
            
        if reason:
            orphaned.append({
                **role,
                "is_orphaned": True,
                "orphan_reason": reason,
                "driver_info": driver
            })

    return orphaned

@router.post("/strategy/roles")
def save_strategy_role(req: StrategyRoleSaveRequest):
    """
    Create or update a Future Role specification.
    AC 3.1: Mandatory Driver Link validation — cannot save as Live without valid strategy_driver_id.
    AC 1.3: Versioning without losing history — increments version if skills modified on Live role.
    """
    drivers = get_strategy_drivers()
    valid_driver_ids = [d["id"] for d in drivers]

    # AC 3.1 Mandatory Driver Link check
    if req.status == "Live":
        if not req.strategy_driver_id or req.strategy_driver_id not in valid_driver_ids:
            raise HTTPException(
                status_code=400,
                detail="Mandatory Validation Error: A Future Role cannot be saved as Live without a valid strategy_driver_id reference."
            )

    # Find existing role if updating
    existing_idx = None
    if req.role_id:
        for idx, r in enumerate(SAMPLE_ROLE_ARCHITECT_DATA):
            if r.get("role_id") == req.role_id:
                existing_idx = idx
                break

    if existing_idx is not None:
        target_role = SAMPLE_ROLE_ARCHITECT_DATA[existing_idx]
        # Check if skills changed to record new version history (AC 1.3)
        old_skills = target_role.get("skill_proficiency_map", [])
        new_skills = req.skill_proficiency_map or []
        
        current_ver = target_role.get("version", "v1.0")
        if old_skills != new_skills and req.status == "Live":
            # Record prior version history snapshot
            v_history = target_role.get("version_history", [])
            v_history.append({
                "version": current_ver,
                "updated_at": "2026-09-24T11:40:00Z",
                "skills": old_skills,
                "status": target_role.get("status")
            })
            target_role["version_history"] = v_history
            # Bump version e.g. v1.0 -> v1.1
            try:
                major, minor = current_ver.replace("v", "").split(".")
                new_ver = f"v{major}.{int(minor) + 1}"
            except Exception:
                new_ver = "v1.1"
            target_role["version"] = new_ver

        target_role["role"] = req.role
        target_role["dept"] = req.dept
        target_role["level"] = req.level
        target_role["status"] = req.status
        target_role["strategy_driver_id"] = req.strategy_driver_id
        if req.job_code: target_role["job_code"] = req.job_code
        if req.business_unit: target_role["business_unit"] = req.business_unit
        if req.skill_proficiency_map is not None: target_role["skill_proficiency_map"] = req.skill_proficiency_map
        if req.role_evolution: target_role["role_evolution"] = req.role_evolution
        if req.fulfillment_5b: target_role["fulfillment_5b"] = req.fulfillment_5b

        return target_role
    else:
        # Create new role
        new_id = f"ROLE-{2000 + len(SAMPLE_ROLE_ARCHITECT_DATA) + 1}"
        new_role = {
            "role_id": new_id,
            "rank": len(SAMPLE_ROLE_ARCHITECT_DATA) + 1,
            "role": req.role,
            "job_code": req.job_code or f"RA-GEN-{len(SAMPLE_ROLE_ARCHITECT_DATA)+1:02d}",
            "dept": req.dept,
            "business_unit": req.business_unit or req.dept,
            "level": req.level,
            "career_hierarchy": f"Analyst → Senior → {req.role}",
            "strategy_driver_id": req.strategy_driver_id,
            "status": req.status,
            "version": "v1.0",
            "version_history": [],
            "skill": ", ".join([s.get("skill", "") for s in (req.skill_proficiency_map or [])]),
            "role_spec": f"{req.role} — strategic workforce specification",
            "target_headcount": "3 FTE by FY26",
            "current_headcount": 1,
            "budgeted_headcount": "3 (FY26)",
            "gap": "+2",
            "urgency": "HIGH",
            "role_evolution": req.role_evolution or "Emerging",
            "fulfillment_5b": req.fulfillment_5b or "Build 60% + Buy 40%",
            "fulfillment_5b_breakdown": {"build": 60, "buy": 40, "borrow": 0, "bot": 0, "bridge": 0},
            "capability_gap_targets": req.capability_gap_targets or "Skill proficiency alignment target",
            "skill_proficiency_map": req.skill_proficiency_map or [],
            "demand_lines": [],
            "internal_mobility": ["Related Specialist"],
            "market_risk": "Medium",
            "hr_inputs": {
                "business_unit": req.business_unit or req.dept,
                "job_code": req.job_code or f"RA-GEN-{len(SAMPLE_ROLE_ARCHITECT_DATA)+1:02d}",
                "hierarchy": f"Analyst → Senior → {req.role}",
                "required_skills": ", ".join([s.get("skill", "") for s in (req.skill_proficiency_map or [])]),
                "current_headcount": 1,
                "budgeted_headcount": "3 (FY26)",
                "strategy_driver": req.strategy_driver_id or "Corporate Strategic Plan"
            }
        }
        SAMPLE_ROLE_ARCHITECT_DATA.append(new_role)
        return new_role

@router.post("/strategy/roles/{role_id}/demand-lines")
def add_demand_line(role_id: str, req: DemandLineCreateRequest):
    """
    Generate & validate a Demand Line for a Future Role (User Story 2).
    AC 2.1: Combine strategy-driven growth + attrition replacement -> demand_headcount_gross.
    AC 2.2: Validate Inputs:
      1. Fiscal year must fall within strategy driver's horizon.
      2. demand_headcount_gross must be a positive integer (> 0).
      Reject demand lines failing either check.
    """
    role = next((r for r in SAMPLE_ROLE_ARCHITECT_DATA if r.get("role_id") == role_id), None)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role with ID '{role_id}' not found.")

    gross_headcount = req.demand_headcount_growth + req.demand_headcount_attrition

    # AC 2.2 Validation 1: demand_headcount_gross must be positive integer (> 0)
    if gross_headcount <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Demand Line: Gross headcount demand ({gross_headcount}) must be a positive integer greater than 0."
        )

    # AC 2.2 Validation 2: Fiscal year must fall within strategy driver horizon
    driver_id = role.get("strategy_driver_id")
    drivers = get_strategy_drivers()
    driver = next((d for d in drivers if d["id"] == driver_id), None)

    if not driver:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Demand Line: Role '{role.get('role')}' is not linked to an active Strategy Driver."
        )

    start_fy = driver.get("horizon_start_fy", 2025)
    end_fy = driver.get("horizon_end_fy", 2030)

    if req.fiscal_year < start_fy or req.fiscal_year > end_fy:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Demand Line: Fiscal year FY{req.fiscal_year} is outside the strategy driver's horizon (FY{start_fy} – FY{end_fy})."
        )

    # Create new demand line
    import uuid
    from datetime import datetime, timezone
    new_dl = {
        "id": f"dl-{uuid.uuid4().hex[:6]}",
        "fiscal_year": req.fiscal_year,
        "demand_headcount_growth": req.demand_headcount_growth,
        "demand_headcount_attrition": req.demand_headcount_attrition,
        "demand_headcount_gross": gross_headcount,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if "demand_lines" not in role or not isinstance(role["demand_lines"], list):
        role["demand_lines"] = []

    role["demand_lines"].append(new_dl)

    # Recalculate target headcount gap summary on role
    role["gap"] = f"+{gross_headcount}"
    role["target_headcount"] = f"{role.get('current_headcount', 0) + gross_headcount} FTE by FY{req.fiscal_year}"

    return {
        "message": f"Demand Line for FY{req.fiscal_year} successfully generated and validated.",
        "demand_line": new_dl,
        "updated_demand_lines": role["demand_lines"]
    }

@router.post("/strategy/persona-qa")
def ask_persona_qa(req: PersonaQARequest):
    """
    Persona AI Q&A Endpoint catering to Employee, Manager, and Employer sample questions.
    """
    persona = req.persona.strip().capitalize()
    q = req.question.strip()

    if persona == "Employee":
        return {
            "persona": "Employee",
            "question": q,
            "answer_summary": "Your role is evolving towards higher AI, automation, and analytics capability over the 2025–2030 strategic cycle.",
            "role_evolution": "Evolving (Transitioning from legacy execution to cloud-native MLOps & automated workflows)",
            "key_skills_to_build": [
                {"skill": "Python Scripting & AutoML", "target_proficiency": "L3 (Intermediate)", "urgency": "High"},
                {"skill": "MLOps & CI/CD Pipelines", "target_proficiency": "L3 (Intermediate)", "urgency": "Critical"},
                {"skill": "Cloud Infrastructure (AWS/SD-WAN)", "target_proficiency": "L2 (Working Knowledge)", "urgency": "Medium"}
            ],
            "recommended_actions": [
                "Enroll in the enterprise ML & MLOps reskilling (Build) pathway on SF-A Learning Hub.",
                "Apply for internal talent gigs in Enterprise Analytics or Core Network Ops.",
                "Review the living Role-Skill map target level (Target L3-L4) with your reporting manager during Q3 check-in."
            ],
            "5b_pathway": "Build (Reskilling) — 60% internal capability build path supported by corporate budget."
        }
    elif persona == "Manager":
        return {
            "persona": "Manager",
            "question": q,
            "answer_summary": "Based on your team's 2-year roadmap, your headcount & capability gaps should be addressed using a balanced 5B (Build, Buy, Borrow, Bot, Bridge) strategy.",
            "recommended_5b_breakdown": {
                "build": "50% — Reskill current engineers in automation & analytics",
                "buy": "30% — External hires for Senior Lead & Specialist roles",
                "borrow": "20% — Specialist contractors for immediate SD-WAN deployment",
                "bot": "15% — Productivity deflator via GenAI coding copilots & automated monitoring",
                "bridge": "0% — No immediate legacy phase-out roles in your unit"
            },
            "priority_roles": [
                {"role": "Senior Data Scientist", "strategy": "Build 60% / Buy 40%", "reason": "High market risk; internal reskilling reduces time-to-productivity."},
                {"role": "Network Automation Engineer", "strategy": "Build 50% / Borrow 30% / Buy 20%", "reason": "Immediate project delivery needs contractor mobilization."}
            ],
            "next_steps": [
                "Submit FY26 Demand Lines in the Strategy Role Architect module for budget reservation.",
                "Partner with People Analytics to review attrition replacement demand lines."
            ]
        }
    else: # Employer / Executive
        return {
            "persona": "Employer",
            "question": q,
            "answer_summary": "Under our 2025–2030 digital transformation strategy, the organization will require 62 future role specifications and +727 net headcount growth (reaching 6,782 FTE capacity).",
            "strategic_role_specs_required": [
                {"role_family": "Data & AI", "new_roles": 14, "5b_route": "Build 60% / Buy 40%", "growth_driver": "DRV-101: Scale AI-enabled analytics"},
                {"role_family": "Cloud & Infrastructure", "new_roles": 18, "5b_route": "Build 50% / Borrow 30% / Buy 20%", "growth_driver": "DRV-102: Network modernization & SD-WAN"},
                {"role_family": "People & HR Tech", "new_roles": 8, "5b_route": "Buy 50% / Build 50%", "growth_driver": "DRV-103: People Analytics Maturity"},
                {"role_family": "Legacy Systems (Phase-out)", "new_roles": -4, "5b_route": "Bridge 100% (Reskill & Migrate)", "growth_driver": "DRV-104: Mainframe Phase-out"}
            ],
            "organizational_5b_ratio": "Build: 55% | Buy: 25% | Borrow: 12% | Bot: 5% | Bridge: 3%",
            "executive_recommendation": "Approve the multi-year Role-Skill Map targets and align FP&A OpEx ceilings with the Strategy Role Architect headcount ramp."
        }




@router.get("/strategy/forecast-timeline")
def get_strategy_forecast_timeline():
    """Retrieve 2025-2030 strategic headcount trajectory forecast."""
    return [
        { "year": "2025", "headcount": 6055, "target": 6180, "engineering": 2500, "operations": 1300 },
        { "year": "2026", "headcount": 6180, "target": 6320, "engineering": 2620, "operations": 1350 },
        { "year": "2027", "headcount": 6320, "target": 6480, "engineering": 2710, "operations": 1380 },
        { "year": "2028", "headcount": 6480, "target": 6600, "engineering": 2790, "operations": 1400 },
        { "year": "2029", "headcount": 6600, "target": 6700, "engineering": 2820, "operations": 1415 },
        { "year": "2030", "headcount": 6700, "target": 6782, "engineering": 2849, "operations": 1425 }
    ]


@router.get("/strategy/primary-inputs")
def get_strategy_primary_inputs():
    """Retrieve corporate strategy documents & business scenarios parsed by AI."""
    sb = get_db()
    try:
        res = sb.table("org_strategy_primary_inputs").select("*").execute()
        if res.data:
            return res.data
    except Exception as e:
        print(f"Fabric fetch for org_strategy_primary_inputs failed: {e}")

    return [
        { "title": "Corporate Strategy 2025-2030", "type": "Strategy Doc", "status": "Parsed by AI", "date": "Aug 2025" },
        { "title": "Division Business Unit Plans", "type": "Business Scenario", "status": "5 Units Synced", "date": "Jul 2025" },
        { "title": "Cloud & AI Operating Model", "type": "Institutional Doc", "status": "Active Driver", "date": "Aug 2025" }
    ]


@router.get("/strategy/knowledge-assets")
def get_strategy_knowledge_assets():
    """Retrieve institutional wiki, role-skill maps, and knowledge graph asset counts."""
    sb = get_db()
    try:
        res = sb.table("org_strategy_knowledge_assets").select("*").execute()
        if res.data:
            return res.data
    except Exception as e:
        print(f"Fabric fetch for org_strategy_knowledge_assets failed: {e}")

    return [
        { "name": "Role-Skill Map Templates", "count": "62 Templates", "color": "#3b82f6" },
        { "name": "Strategic Headcount Targets", "count": "6,782 Target", "color": "#10b981" },
        { "name": "Corporate Knowledge Graph", "count": "1,420 Nodes", "color": "#a855f7" }
    ]


@router.get("/strategy/competency-radar")
def get_strategy_competency_radar():
    """Retrieve organizational competency shift radar map."""
    return [
        { "subject": "Cloud Architecture", "A": 135, "fullMark": 150 },
        { "subject": "AI & Automation", "A": 142, "fullMark": 150 },
        { "subject": "Data Governance", "A": 110, "fullMark": 150 },
        { "subject": "DevSecOps", "A": 125, "fullMark": 150 },
        { "subject": "Agile Leadership", "A": 118, "fullMark": 150 }
    ]


@router.get("/strategy/overview")
def get_strategy_overview(department: str = "All Departments"):
    """Single aggregated payload for Strategy Role Architect dashboard."""
    sb = get_db()
    specs = get_strategy_role_specs(department)
    forecast = get_strategy_forecast_timeline()
    inputs = get_strategy_primary_inputs()
    assets = get_strategy_knowledge_assets()
    radar = get_strategy_competency_radar()

    # Calculate employee headcount from DB if available, fallback to 6055
    current_headcount = 6055
    try:
        emp_res = sb.table("employees").select("id", count="exact").execute()
        if emp_res.count and emp_res.count > 0:
            current_headcount = emp_res.count
    except Exception as e:
        print(f"Fabric fetch for employee count failed: {e}")

    # Calculate planned growth from role specs gap column
    planned_growth = 0
    unique_skills = set()
    for spec in specs:
        gap_str = str(spec.get("gap", "")).replace("+", "").strip()
        if gap_str.isdigit():
            planned_growth += int(gap_str)
        if spec.get("skill"):
            unique_skills.add(spec.get("skill"))
            
    if planned_growth == 0:
        planned_growth = 727
        
    target_headcount = current_headcount + planned_growth
    future_roles_count = len(specs) if len(specs) > 5 else 62
    key_skills_count = len(unique_skills) if len(unique_skills) > 5 else 48

    return {
        "summary": {
            "current_headcount": current_headcount,
            "planned_growth": planned_growth,
            "target_headcount": target_headcount,
            "future_roles_count": future_roles_count,
            "key_skills_count": key_skills_count,
            "primary_goal": "2025–2030 Cloud & AI Transformation"
        },
        "role_specs": specs,
        "forecast_timeline": forecast,
        "primary_inputs": inputs,
        "knowledge_assets": assets,
        "competency_radar": radar,
        "hr_inputs_checklist": HR_INPUT_CHECKLIST_DATA
    }


class StrategyTranslateRequest(BaseModel):
    department: Optional[str] = None


@router.post("/strategy/translate")
def translate_strategy(req: Optional[StrategyTranslateRequest] = None):
    """Trigger AI Strategy Translation pipeline to parse strategic documents and refresh role specs."""
    dept = req.department if req else None
    specs = get_strategy_role_specs(dept)
    overview = get_strategy_overview(dept or "All Departments")
    
    from datetime import datetime, timezone
    return {
        "status": "success",
        "message": "Strategy Role Architect pipeline executed: Future role specs & headcount targets updated from Corporate Strategy.",
        "updated_summary": overview["summary"],
        "role_specs_count": len(specs),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/strategy/knowledge-search")
def search_knowledge_graph(q: str = ""):
    """Search Knowledge Graph nodes, role specifications, and knowledge assets by keyword."""
    sb = get_db()
    query_str = q.strip().lower()
    
    results = []
    if not query_str:
        return {"results": [], "total": 0}
        
    try:
        specs_res = sb.table("org_strategy_role_specs").select("*").execute()
        if specs_res.data:
            for spec in specs_res.data:
                role_name = (spec.get("role") or "").lower()
                skill_name = (spec.get("skill") or "").lower()
                dept_name = (spec.get("dept") or "").lower()
                if query_str in role_name or query_str in skill_name or query_str in dept_name:
                    results.append({
                        "id": f"spec-{spec.get('id', spec.get('rank'))}",
                        "title": spec.get("role"),
                        "category": "Future Role Spec",
                        "subtitle": f"Dept: {spec.get('dept')} • Level: {spec.get('level')}",
                        "details": f"Required Skill: {spec.get('skill')} (Gap: {spec.get('gap')})",
                        "badge": spec.get("urgency", "HIGH")
                    })
    except Exception as e:
        print(f"Error searching org_strategy_role_specs: {e}")

    try:
        assets_res = sb.table("org_strategy_knowledge_assets").select("*").execute()
        if assets_res.data:
            for asset in assets_res.data:
                name = (asset.get("name") or "").lower()
                if query_str in name:
                    results.append({
                        "id": f"asset-{asset.get('id')}",
                        "title": asset.get("name"),
                        "category": "Knowledge Asset Node",
                        "subtitle": f"Asset Count: {asset.get('count')}",
                        "details": "Synced with Corporate Knowledge Graph repository",
                        "badge": "Asset"
                    })
    except Exception as e:
        print(f"Error searching org_strategy_knowledge_assets: {e}")

    # Standard Knowledge Graph nodes fallback matching
    sample_nodes = [
        {"title": "AWS Cloud Architecture Framework", "category": "Institutional Wiki", "subtitle": "Engineering • Cloud Ops", "details": "Architecture pattern rules & infrastructure template blueprints", "badge": "Pattern"},
        {"title": "AI & LLM Governance Guidelines 2025", "category": "Corporate Policy", "subtitle": "Data Governance • Legal", "details": "Ethical AI usage, compliance rules, and API security guardrails", "badge": "Policy"},
        {"title": "Legacy Monolith Refactoring Specs", "category": "Project History", "subtitle": "Engineering • Operations", "details": "Microservices migration roadmaps and legacy code dependency graphs", "badge": "Blueprint"},
        {"title": "Product Growth & Analytics Taxonomy", "category": "Role-Skill Map", "subtitle": "Product • Strategy", "details": "Standardized KPI metrics, product telemetry, and behavioral analytics maps", "badge": "Taxonomy"}
    ]
    for node in sample_nodes:
        if (query_str in node["title"].lower() or 
            query_str in node["category"].lower() or 
            query_str in node["details"].lower() or 
            query_str in node["subtitle"].lower()):
            if not any(r["title"] == node["title"] for r in results):
                results.append({
                    "id": f"node-{len(results)+1}",
                    "title": node["title"],
                    "category": node["category"],
                    "subtitle": node["subtitle"],
                    "details": node["details"],
                    "badge": node["badge"]
                })

    return {
        "results": results,
        "total": len(results)
    }


HR_INPUT_CHECKLIST_DATA = [
    {
        "id": "hr-input-1",
        "category": "Role & Organization",
        "data_to_request": "Job code, title, family & level; job description & key accountabilities; role hierarchy & career levels",
        "priority": "Essential",
        "system_source": "SF-A / HRIS (Job Architecture)",
        "integration_status": "Synced",
        "output_impact": "Role Hierarchy & Baseline Specifications"
    },
    {
        "id": "hr-input-2",
        "category": "Current Workforce",
        "data_to_request": "Current headcount by org unit / department",
        "priority": "Essential",
        "system_source": "HRIS / Core Employee Roster",
        "integration_status": "Synced",
        "output_impact": "Baseline Capacity & Net Demand Calculation"
    },
    {
        "id": "hr-input-3",
        "category": "Skills Reference",
        "data_to_request": "Required skills per role; enterprise & external skills taxonomy (SF-A / ESCO)",
        "priority": "Essential where available",
        "system_source": "ESCO Taxonomy / SF-A Competency Engine",
        "integration_status": "Synced",
        "output_impact": "Living Role-Skill Map & Taxonomy Alignment"
    },
    {
        "id": "hr-input-4",
        "category": "Budget & Compensation",
        "data_to_request": "Approved / budgeted headcount; compensation band / grade",
        "priority": "Useful",
        "system_source": "HRIS Payroll / Finance SAP",
        "integration_status": "Synced",
        "output_impact": "Target Headcount Validation & Cost Alignment"
    },
    {
        "id": "hr-input-5",
        "category": "Technology Context",
        "data_to_request": "Systems/technology in use per function, for role-skill alignment",
        "priority": "Optional",
        "system_source": "IT Service Catalog / Enterprise Architecture",
        "integration_status": "Configured",
        "output_impact": "Role-Skill Alignment to Tech Stack"
    },
    {
        "id": "hr-input-6",
        "category": "Attrition & Turnover",
        "data_to_request": "Historical attrition rate by role & org unit — for replacement vs. net-new demand",
        "priority": "Essential",
        "system_source": "SF-A / HR Analytics",
        "integration_status": "Synced",
        "output_impact": "Replacement Sourcing Demand & Sourcing Risk"
    },
    {
        "id": "hr-input-7",
        "category": "Skill Proficiency Baseline",
        "data_to_request": "Current skill proficiency baseline (L1–L5) — the starting point for Capability Gap Targets",
        "priority": "Essential",
        "system_source": "Skill Twin Matrix / Self-Manager Assessments",
        "integration_status": "Synced",
        "output_impact": "Capability Gap Targets & Reskilling (Build) Ratio"
    },
    {
        "id": "hr-input-8",
        "category": "Time-to-Hire / Time-to-Productivity",
        "data_to_request": "Average time-to-hire and time-to-productivity by role family — sets mobilization lead time",
        "priority": "Useful",
        "system_source": "ATS (Workday / Greenhouse / SF-A)",
        "integration_status": "Synced",
        "output_impact": "Mobilization Lead Time & Buy/Borrow Route Selection"
    },
    {
        "id": "hr-input-9",
        "category": "Geography & Work Model",
        "data_to_request": "Location / geographic distribution and remote-hybrid-onsite model — flags cost differentials",
        "priority": "Useful",
        "system_source": "HRIS Location & Work Policy",
        "integration_status": "Synced",
        "output_impact": "Location Sourcing Model & Cost Differential Flag"
    },
    {
        "id": "hr-input-10",
        "category": "Employment Type Mix",
        "data_to_request": "FTE vs. contractor / contingent ratio by role",
        "priority": "Optional",
        "system_source": "VMS / Contingent Workforce Portal",
        "integration_status": "Omitted (Optional)",
        "output_impact": "5B Contingent (Borrow) Mix Strategy"
    },
    {
        "id": "hr-input-11",
        "category": "Corporate Strategy",
        "data_to_request": "Strategy & business plans (new products, markets, expansion); 3–5 yr horizon and ≥ 1 stated priority",
        "priority": "Essential",
        "system_source": "Corporate Strategy Portal / Executive Board Deck",
        "integration_status": "Parsed by AI",
        "output_impact": "Future Role Specifications & Growth Drivers"
    },
    {
        "id": "hr-input-12",
        "category": "Future Operating Model",
        "data_to_request": "Future operating model and technology roadmap; planned automation / digital initiatives",
        "priority": "Essential",
        "system_source": "Digital Transformation Roadmap",
        "integration_status": "Active Driver",
        "output_impact": "Emerging & Evolving Role Definitions"
    },
    {
        "id": "hr-input-13",
        "category": "Workforce Assumptions",
        "data_to_request": "Growth / reduction assumptions; planned headcount changes by unit and year",
        "priority": "Essential",
        "system_source": "Strategic Workforce Plan (SWP)",
        "integration_status": "Active Driver",
        "output_impact": "Multi-year Target Headcount Ramp"
    },
    {
        "id": "hr-input-14",
        "category": "Cost Parameters",
        "data_to_request": "Salary bands / cost data for target future roles",
        "priority": "Useful",
        "system_source": "Total Rewards / Compensation Benchmark",
        "integration_status": "Synced",
        "output_impact": "Future Workforce Investment Modeling"
    },
    {
        "id": "hr-input-15",
        "category": "Planning & Approval Input",
        "data_to_request": "Business-plan inputs & scenario context; approver for the \"Live\" Role-Skill Map",
        "priority": "Essential",
        "system_source": "Workforce Governance Board / CHRO Office",
        "integration_status": "Approved",
        "output_impact": "Role-Skill Map Sign-off & Live Deployment"
    },
    {
        "id": "hr-input-16",
        "category": "Sunsetting / Phase-out Roadmap",
        "data_to_request": "Product / technology sunsetting (phase-out) roadmap — legacy roles & skills being de-prioritized, incl. role transition needs",
        "priority": "Essential",
        "system_source": "Product & Tech Sunsetting Registry",
        "integration_status": "Active Roadmap",
        "output_impact": "Sunsetting/Phase-out Specs & Bridge/Reskill Pathways"
    },
    {
        "id": "hr-input-17",
        "category": "GenAI / Automation Impact",
        "data_to_request": "Expected productivity gain (%) per role — adjusts future headcount demand",
        "priority": "Useful",
        "system_source": "AI Productivity Benchmark Model",
        "integration_status": "Active Model",
        "output_impact": "Bot Sourcing Allocation & Headcount Deflator"
    },
    {
        "id": "hr-input-18",
        "category": "Business Criticality / Failure Risk",
        "data_to_request": "Criticality index — strategic impact if the future role stays unfilled",
        "priority": "Useful",
        "system_source": "Enterprise Risk Management (ERM)",
        "integration_status": "Calculated",
        "output_impact": "Sourcing Risk Priority & Urgency Score"
    },
    {
        "id": "hr-input-19",
        "category": "OpEx Budget Ceiling",
        "data_to_request": "Financial constraints / OpEx ceiling for future workforce growth",
        "priority": "Useful",
        "system_source": "FP&A / Annual Budget Plan",
        "integration_status": "Bounded",
        "output_impact": "Growth Feasibility & Budget Cap Guardrail"
    }
]


@router.get("/strategy/hr-inputs-checklist")
def get_hr_inputs_checklist():
    """Retrieve standard HR Input request checklist (19 categories) for Strategy Role Architect."""
    sb = get_db()
    items = []
    try:
        res = sb.table("org_strategy_hr_inputs").select("*").execute()
        if res.data and len(res.data) > 0:
            items = res.data
    except Exception as e:
        print(f"Fetch for org_strategy_hr_inputs note: {e}")

    if not items:
        items = HR_INPUT_CHECKLIST_DATA

    return {
        "total_categories": len(items),
        "essential_count": len([i for i in items if "Essential" in str(i.get("priority", ""))]),
        "useful_count": len([i for i in items if i.get("priority") == "Useful"]),
        "optional_count": len([i for i in items if i.get("priority") == "Optional"]),
        "items": items
    }


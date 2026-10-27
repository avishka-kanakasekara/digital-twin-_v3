from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date

from app.database import get_db
from app.schemas.workforce import (
    WorkforceEmployeeRecordCreate, 
    WorkforceEmployeeRecord,
    WorkforceEmployeeSkillRecordCreate,
    WorkforceEmployeeSkillRecord
)
from app.services import workforce_service

router = APIRouter(
    prefix="/api/workforce",
    tags=["Workforce Intelligence"],
)

class ThresholdsUpdate(BaseModel):
    criticality_threshold: Optional[float] = 0.70
    scarcity_threshold: Optional[float] = 0.60
    succession_threshold: Optional[int] = 1
    gap_alert_threshold: Optional[float] = 0.30
    confidence_suppression_threshold: Optional[float] = 0.60
    notification_window_days: Optional[int] = 90
    refresh_cadence: Optional[str] = "Nightly"
    risk_view_owner_role: Optional[str] = "Workforce Planning Lead"
    calibration_frequency: Optional[str] = "Quarterly"


@router.get("/capability-gaps")
def get_capability_gaps(department: Optional[str] = None):
    """
    User Story 1: Compare Current Capability Against Future Demand
    AC 1: Compute Capability Gap per Skill: max(0, target_proficiency - mean effective proficiency)
    AC 2: Roll Up to a Role-Level Score: weighted by skill importance where configured
    AC 3: Refresh on a Defined Cadence
    Section 2.7 Outputs:
      - Capability gap per skill & role
      - Headcount gap & Internal supply ratio
      - Skill Scarcity index: 0.5*(1-internal_supply_ratio) + 0.5*(market_demand*(1-market_supply))
      - Workforce Readiness score & band (Green/Amber/Red)
      - Time to Close (Build) months & Time to Close (Buy) days
      - Closure Feasibility (Feasible / At Risk)
      - Knowledge Concentration Index (Bus factor)
      - Retirement Exposure (3-year)
    """
    return workforce_service.compute_capability_gaps(department)


@router.put("/thresholds")
def update_thresholds(t: ThresholdsUpdate):
    """
    User Story 2: Configure Thresholds Centrally
    AC 2: Configure Thresholds Centrally (criticality, scarcity, succession, gap-alert, confidence suppression).
    """
    updated = workforce_service.update_thresholds_config(t.model_dump(exclude_unset=True))
    return {"message": "Thresholds updated centrally", "thresholds": updated}


@router.get("/thresholds")
def get_thresholds():
    """Get centrally configured thresholds."""
    return workforce_service.get_thresholds_config()


@router.get("/critical-roles-at-risk")
def get_critical_roles_at_risk():
    """
    User Story 2: Flag a Business-Critical Role at Risk
    AC 1: Apply the Compound Rule:
         Critical Risk Flag is set TRUE only when:
         business_criticality_index > criticality_threshold
         AND ready_successors < succession_threshold
         AND skill_scarcity > scarcity_threshold
    AC 3: Suppress Low-Confidence Signals:
         Any risk signal whose confidence_level falls below confidence_suppression_threshold
         is hidden from manager-facing views.
    """
    return workforce_service.get_critical_roles_at_risk()


@router.get("/risk-signals")
def get_risk_signals(role_id: Optional[str] = None):
    """
    Section 2.5: Risk Signal (Predictive Output).
    Each score carries confidence and 2-4 contributing factors (never a bare score).
    """
    return workforce_service.get_risk_signals(role_id)


@router.get("/gap-heatmap")
def get_gap_heatmap():
    """
    Section 2.8 Recommended Addition:
    A gap heat map by org unit against skill family.
    """
    return workforce_service.get_org_gap_heatmap()


@router.get("/net-gap-pipeline")
def get_net_gap_pipeline(org_unit_id: Optional[str] = "OU-004"):
    """
    Computes dynamic Headcount Trajectory & Net Gap equation:
    Baseline Staff - Attrition - Retirements + Growth Demand = Net Shortage
    """
    return workforce_service.get_net_gap_pipeline(org_unit_id)


@router.get("/distributions")
def get_workforce_distributions():
    """
    Returns real Department Distribution and Career Level / Seniority Distribution
    calculated across the 146 active employees from Organization_Twin_Dummy_Data_M1-M9.xlsx.
    """
    return workforce_service.get_workforce_distributions()


class CertificationRecord(BaseModel):
    employee_id: str
    name: str
    issuer: str
    issue_date: str
    expiry_date: str
    verification_status: Optional[str] = "Unverified"
    linked_skill_ids: Optional[List[str]] = []
    is_mandatory_for_role: Optional[bool] = False


@router.post("/certifications/record")
def record_certification(cert: CertificationRecord):
    """
    User Story 3: Track Certification Expiry
    AC 1: Record and Verify a Certification
    """
    new_cert = {
        "certification_id": f"CRT-{len(workforce_service._WORKFORCE_CERTIFICATIONS) + 1:04d}",
        "employee_id": cert.employee_id,
        "display_name": cert.employee_id,
        "certification_name": cert.name,
        "issuing_authority": cert.issuer,
        "linked_skill_ids": cert.linked_skill_ids or [],
        "issue_date": cert.issue_date,
        "expiry_date": cert.expiry_date,
        "verification_status": cert.verification_status or "Unverified",
        "is_mandatory_for_role": cert.is_mandatory_for_role or False,
        "renewal_flag": False,
        "days_to_expiry": 365
    }
    workforce_service._WORKFORCE_CERTIFICATIONS.append(new_cert)
    return {"message": "Certification recorded successfully", "data": new_cert}


@router.get("/certifications/expiry")
def get_certification_expiry(employee_id: Optional[str] = None):
    """
    User Story 3: Track Certification Expiry
    AC 2: Auto-Compute Days to Expiry and set renewal_flag inside 90-day window.
    """
    return workforce_service.get_certifications_expiry(employee_id)


@router.get("/employees")
def get_workforce_employees(dept: Optional[str] = None):
    """
    Section 2.1: Master Active Workforce Employee Records
    """
    return workforce_service.get_workforce_employees(dept)


@router.post("/employees")
def create_workforce_employee(record: WorkforceEmployeeRecordCreate):
    """
    Section 2.1: Create a Workforce Employee Record
    """
    data = record.model_dump()
    data["hire_date"] = str(data.get("hire_date", date.today()))
    data["availability_from_date"] = str(data.get("availability_from_date", date.today()))
    workforce_service._WORKFORCE_EMPLOYEES.append(data)
    return data


@router.get("/skills")
def get_workforce_skills(employee_id: Optional[str] = None):
    """
    Section 2.2: Get Workforce Employee Skill Records
    """
    return workforce_service.get_employee_skills(employee_id)


@router.post("/skills")
def create_workforce_skill(record: WorkforceEmployeeSkillRecordCreate):
    """
    Section 2.2: Create a Workforce Employee Skill Record
    Enforces the logic: evidence beats manager beats self, unless steward override.
    """
    data = record.model_dump()
    data["employee_skill_id"] = f"ESK-{len(workforce_service._WORKFORCE_SKILLS) + 1:06d}"
    data["last_assessed_date"] = str(data.get("last_assessed_date", date.today()))
    data["last_used_date"] = str(data.get("last_used_date", date.today()))
    
    # Calculate proficiency_effective if not explicitly forced via steward
    if data.get("proficiency_source") != "Steward override":
        if data.get("proficiency_evidence") is not None:
            data["proficiency_effective"] = data["proficiency_evidence"]
            data["proficiency_source"] = "Evidence-based"
        elif data.get("proficiency_manager") is not None:
            data["proficiency_effective"] = data["proficiency_manager"]
            data["proficiency_source"] = "Manager-validated"
        elif data.get("proficiency_self") is not None:
            data["proficiency_effective"] = data["proficiency_self"]
            data["proficiency_source"] = "Self-assessed"
            
    workforce_service._WORKFORCE_SKILLS.append(data)
    return data

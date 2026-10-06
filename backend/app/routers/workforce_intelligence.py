from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime, date

from app.database import get_db
from app.schemas.workforce import (
    WorkforceEmployeeRecordCreate, 
    WorkforceEmployeeRecord,
    WorkforceEmployeeSkillRecordCreate,
    WorkforceEmployeeSkillRecord
)

router = APIRouter(
    prefix="/api/workforce",
    tags=["Workforce Intelligence"],
)

# Global in-memory configuration for thresholds (User Story 2: Configure Thresholds Centrally)
thresholds_config = {
    "criticality_threshold": 0.7,
    "succession_threshold": 1,
    "scarcity_threshold": 0.7,
    "confidence_suppression_threshold": 0.5,
    "notification_window_days": 30
}

class ThresholdsUpdate(BaseModel):
    criticality_threshold: float
    succession_threshold: int
    scarcity_threshold: float
    confidence_suppression_threshold: float
    notification_window_days: int


@router.get("/capability-gaps")
def get_capability_gaps():
    """
    User Story 1: Compare Current Capability Against Future Demand
    AC 1: Compute Capability Gap per Skill
    AC 2: Roll Up to a Role-Level Score
    AC 3: Refresh on a Defined Cadence
    """
    sb = get_db()
    # Fetch all employees
    employees_res = sb.table("employees").select("id, role").execute()
    employees = employees_res.data if employees_res else []
    
    # Fetch all skills
    skills_res = sb.table("skills").select("employee_id, name, proficiency, target_level").execute()
    skills = skills_res.data if skills_res else []
    
    # Group employees by role
    roles = {}
    for emp in employees:
        emp_role = emp.get("role") or "Unassigned"
        if emp_role not in roles:
            roles[emp_role] = []
        roles[emp_role].append(emp["id"])
        
    # Build skills by employee
    emp_skills = {}
    for skill in skills:
        emp_id = skill["employee_id"]
        if emp_id not in emp_skills:
            emp_skills[emp_id] = []
        emp_skills[emp_id].append(skill)
        
    result = []
    
    for role, emp_ids in roles.items():
        role_skills_agg = {}
        for eid in emp_ids:
            for s in emp_skills.get(eid, []):
                s_name = s["name"]
                if s_name not in role_skills_agg:
                    role_skills_agg[s_name] = {"proficiencies": [], "target_levels": []}
                # Handle None values gracefully
                prof = s.get("proficiency")
                tgt = s.get("target_level")
                role_skills_agg[s_name]["proficiencies"].append(prof if prof is not None else 0)
                role_skills_agg[s_name]["target_levels"].append(tgt if tgt is not None else 0)
                
        # AC 1: Compute Capability Gap per Skill
        skill_gaps = []
        total_gap = 0
        total_weight = 0
        
        for s_name, data in role_skills_agg.items():
            mean_effective_proficiency = sum(data["proficiencies"]) / len(data["proficiencies"]) if data["proficiencies"] else 0
            # Role target is max of individual targets, defaults to 5 if not set
            targets = [t for t in data["target_levels"] if t > 0]
            target_proficiency = max(targets) if targets else 5 
            
            gap = max(0, target_proficiency - mean_effective_proficiency)
            skill_gaps.append({
                "skill": s_name,
                "target_proficiency": target_proficiency,
                "mean_effective_proficiency": mean_effective_proficiency,
                "gap": gap
            })
            
            # AC 2: Roll Up to a Role-Level Score (0-1)
            # Assuming max proficiency scale is 5
            normalized_gap = min(1.0, gap / 5.0)
            importance_weight = 1.0 # default weight
            
            total_gap += normalized_gap * importance_weight
            total_weight += importance_weight
            
        role_gap_score = (total_gap / total_weight) if total_weight > 0 else 0
        
        result.append({
            "role": role,
            "capability_gap_score": role_gap_score,
            "skill_gaps": skill_gaps
        })
        
    return {"refresh_cadence": "Real-time", "data": result}


@router.put("/thresholds")
def update_thresholds(t: ThresholdsUpdate):
    """
    User Story 2: Configure Thresholds Centrally
    """
    global thresholds_config
    thresholds_config.update(t.model_dump())
    return {"message": "Thresholds updated centrally", "thresholds": thresholds_config}


@router.get("/thresholds")
def get_thresholds():
    return thresholds_config


@router.get("/critical-roles-at-risk")
def get_critical_roles_at_risk():
    """
    User Story 2: Flag a Business-Critical Role at Risk
    AC 1: Apply the Compound Rule
    AC 3: Suppress Low-Confidence Signals
    """
    # Mocked data since role_risk_metrics table doesn't exist
    mock_roles = [
        {"role": "Senior Cloud Architect", "business_criticality_index": 0.9, "ready_successors": 0, "skill_scarcity": 0.8, "confidence_level": 0.9},
        {"role": "Lead Data Scientist", "business_criticality_index": 0.8, "ready_successors": 2, "skill_scarcity": 0.6, "confidence_level": 0.8},
        {"role": "Product Manager", "business_criticality_index": 0.6, "ready_successors": 0, "skill_scarcity": 0.9, "confidence_level": 0.4}, # Low confidence
        {"role": "Full-stack Engineer", "business_criticality_index": 0.8, "ready_successors": 0, "skill_scarcity": 0.9, "confidence_level": 0.85},
    ]
    
    result = []
    for r in mock_roles:
        # AC 3: Suppress Low-Confidence Signals
        if r["confidence_level"] < thresholds_config["confidence_suppression_threshold"]:
            continue
            
        # AC 1: Apply the Compound Rule
        is_critical_risk = (
            r["business_criticality_index"] > thresholds_config["criticality_threshold"] and
            r["ready_successors"] < thresholds_config["succession_threshold"] and
            r["skill_scarcity"] > thresholds_config["scarcity_threshold"]
        )
        
        r["critical_risk_flag"] = is_critical_risk
        if is_critical_risk:
            result.append(r)
            
    return {"thresholds_applied": thresholds_config, "at_risk_roles": result}


class CertificationRecord(BaseModel):
    employee_id: str
    name: str
    issuer: str
    issue_date: str
    expiry_date: str
    verification_status: str


@router.post("/certifications/record")
def record_certification(cert: CertificationRecord):
    """
    User Story 3: Track Certification Expiry
    AC 1: Record and Verify a Certification
    """
    sb = get_db()
    data = {
        "employee_id": cert.employee_id,
        "name": cert.name,
        "issuer": cert.issuer,
        "status": cert.verification_status, # Use status to store verification_status for now
        "completed_date": cert.issue_date, # using as issue_date
        "expiry_date": cert.expiry_date,
    }
    res = sb.table("certifications").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to record certification")
    return {"message": "Certification recorded", "data": res.data[0]}


@router.get("/certifications/expiry")
def get_certification_expiry(employee_id: str = None):
    """
    User Story 3: Track Certification Expiry
    AC 2: Auto-Compute Days to Expiry
    """
    sb = get_db()
    query = sb.table("certifications").select("*")
    if employee_id:
        query = query.eq("employee_id", employee_id)
        
    certs_res = query.execute()
    certs = certs_res.data if certs_res else []
    
    today = date.today()
    result = []
    for c in certs:
        exp_date_str = c.get("expiry_date")
        if exp_date_str:
            try:
                # Handle possible time component
                exp_date_str = exp_date_str.split("T")[0]
                exp_date = datetime.strptime(exp_date_str, "%Y-%m-%d").date()
                days_to_expiry = (exp_date - today).days
                renewal_flag = days_to_expiry <= thresholds_config["notification_window_days"]
                
                c["days_to_expiry"] = days_to_expiry
                c["renewal_flag"] = renewal_flag
                result.append(c)
            except ValueError:
                pass
                
    return result


@router.post("/employees", response_model=WorkforceEmployeeRecord)
def create_workforce_employee(record: WorkforceEmployeeRecordCreate):
    """
    Module 2.1: Create a Workforce Employee Record
    """
    sb = get_db()
    data = record.model_dump()
    # Format dates to string for Supabase
    if data.get("hire_date"): data["hire_date"] = data["hire_date"].isoformat()
    if data.get("retirement_eligible_date"): data["retirement_eligible_date"] = data["retirement_eligible_date"].isoformat()
    if data.get("availability_from_date"): data["availability_from_date"] = data["availability_from_date"].isoformat()
    
    res = sb.table("workforce_employee_records").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create Workforce Employee Record")
    return res.data[0]


@router.get("/employees", response_model=List[WorkforceEmployeeRecord])
def get_workforce_employees():
    """
    Module 2.1: Get all Workforce Employee Records
    """
    sb = get_db()
    res = sb.table("workforce_employee_records").select("*").execute()
    return res.data if res.data else []


@router.post("/skills", response_model=WorkforceEmployeeSkillRecord)
def create_workforce_skill(record: WorkforceEmployeeSkillRecordCreate):
    """
    Module 2.2: Create a Workforce Employee Skill Record
    Enforces the logic: evidence beats manager beats self, unless steward override.
    """
    sb = get_db()
    data = record.model_dump()
    
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
            
    # Determine is_decayed based on last_used_date vs half-life (Assuming 365 days half-life for demo)
    if data.get("last_used_date"):
        last_used = data["last_used_date"]
        days_since_used = (date.today() - last_used).days
        data["is_decayed"] = days_since_used > 365
        data["last_used_date"] = last_used.isoformat()
        
    if data.get("last_assessed_date"):
        data["last_assessed_date"] = data["last_assessed_date"].isoformat()
        
    res = sb.table("workforce_employee_skill_records").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create Workforce Employee Skill Record")
    return res.data[0]


@router.get("/skills", response_model=List[WorkforceEmployeeSkillRecord])
def get_workforce_skills(employee_id: str = None):
    """
    Module 2.2: Get Workforce Employee Skill Records
    """
    sb = get_db()
    query = sb.table("workforce_employee_skill_records").select("*")
    if employee_id:
        query = query.eq("employee_id", employee_id)
        
    res = query.execute()
    return res.data if res.data else []

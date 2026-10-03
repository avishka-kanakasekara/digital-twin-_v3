import os
import sys
from pathlib import Path
from datetime import date, timedelta
import random

# Add the backend directory to sys.path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import get_db

def seed_workforce_module():
    sb = get_db()
    
    print("Seeding Workforce Module Data...")

    # Fetch 4 actual employees to avoid Foreign Key errors
    employees_res = sb.table("employees").select("id, full_name, role").limit(4).execute()
    employees = employees_res.data
    
    if len(employees) < 4:
        print("Error: Need at least 4 employees in the database to seed.")
        return

    emp1_id = employees[0]['id']
    emp2_id = employees[1]['id']
    emp3_id = employees[2]['id']
    emp4_id = employees[3]['id']

    # 1. Certifications
    certs_data = [
        {"employee_id": emp1_id, "name": "AWS Certified Solutions Architect", "issuer": "Amazon Web Services", "status": "Active", "progress": 100, "emoji": "☁️", "color": "#f59e0b", "expiry_date": (date.today() + timedelta(days=33)).isoformat()},
        {"employee_id": emp2_id, "name": "Certified Kubernetes Administrator (CKA)", "issuer": "Cloud Native Computing Foundation", "status": "Active", "progress": 100, "emoji": "☸️", "color": "#3b82f6", "expiry_date": (date.today() + timedelta(days=12)).isoformat()},
        {"employee_id": emp3_id, "name": "Offensive Security Certified Professional", "issuer": "OffSec", "status": "Active", "progress": 100, "emoji": "🛡️", "color": "#ef4444", "expiry_date": (date.today() - timedelta(days=2)).isoformat()},
        {"employee_id": emp4_id, "name": "Google Cloud Professional Data Engineer", "issuer": "Google Cloud", "status": "Active", "progress": 100, "emoji": "📊", "color": "#10b981", "expiry_date": (date.today() + timedelta(days=229)).isoformat()}
    ]
    
    print("Ensuring tables exist...")
    sb.db.execute("""
    CREATE TABLE IF NOT EXISTS "workforce_employee_records" (
        "id" TEXT PRIMARY KEY,
        "employee_id" TEXT NOT NULL,
        "display_name" TEXT NOT NULL,
        "role_id" TEXT NOT NULL,
        "org_unit_id" TEXT NOT NULL,
        "manager_employee_id" TEXT,
        "career_level_id" TEXT NOT NULL,
        "employment_type" TEXT NOT NULL,
        "employee_status" TEXT NOT NULL,
        "tenure_years" REAL NOT NULL,
        "location" TEXT NOT NULL,
        "work_model" TEXT NOT NULL,
        "cost_band_id" TEXT NOT NULL,
        "annual_cost_lkr" INTEGER NOT NULL,
        "performance_rating_current" REAL NOT NULL,
        "current_allocation_pct" REAL NOT NULL,
        "availability_from_date" TEXT NOT NULL,
        "notice_period_days" INTEGER NOT NULL
    )
    """)
    sb.db.execute("""
    CREATE TABLE IF NOT EXISTS "workforce_employee_skill_records" (
        "id" TEXT PRIMARY KEY,
        "skill_id" TEXT NOT NULL,
        "employee_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "proficiency_effective" INTEGER NOT NULL,
        "proficiency_source" TEXT NOT NULL,
        "confidence_score" REAL NOT NULL,
        "last_assessed_date" TEXT NOT NULL,
        "last_used_date" TEXT NOT NULL,
        "assessment_method" TEXT NOT NULL,
        "evidence_reference" TEXT,
        "is_decayed" INTEGER NOT NULL DEFAULT 0
    )
    """)

    print("Clearing old certifications...")
    sb.db.execute("DELETE FROM certifications")
    print(f"Inserting {len(certs_data)} certifications...")
    sb.table("certifications").insert(certs_data).execute()


    # 2. Workforce Employee Records (2.1)
    wf_employees = [
        {
            "employee_id": emp1_id,
            "display_name": employees[0]['full_name'],
            "role_id": "ROLE-ENG-03",
            "org_unit_id": "DEPT-ENG",
            "career_level_id": "L4",
            "employment_type": "Full-Time",
            "employee_status": "Active",
            "tenure_years": 4.2,
            "location": "Remote",
            "work_model": "Remote",
            "cost_band_id": "BAND-4",
            "annual_cost_lkr": 5200000,
            "performance_rating_current": 3.8,
            "current_allocation_pct": 1.0,
            "availability_from_date": date.today().isoformat(),
            "notice_period_days": 30
        },
        {
            "employee_id": emp2_id,
            "display_name": employees[1]['full_name'],
            "role_id": "ROLE-DSN-02",
            "org_unit_id": "DEPT-DSN",
            "career_level_id": "L3",
            "employment_type": "Full-Time",
            "employee_status": "Active",
            "tenure_years": 2.1,
            "location": "Office",
            "work_model": "Hybrid",
            "cost_band_id": "BAND-3",
            "annual_cost_lkr": 3800000,
            "performance_rating_current": 4.5,
            "current_allocation_pct": 1.0,
            "availability_from_date": date.today().isoformat(),
            "notice_period_days": 60
        }
    ]
    
    print("Clearing old workforce employee records...")
    sb.db.execute("DELETE FROM workforce_employee_records")
    print(f"Inserting {len(wf_employees)} workforce employee records...")
    sb.table("workforce_employee_records").insert(wf_employees).execute()

    
    # 3. Workforce Employee Skill Records (2.2)
    wf_skills = [
        {
            "skill_id": "SKL-AWS",
            "employee_id": emp1_id,
            "name": "AWS Cloud",
            "proficiency_effective": 5,
            "proficiency_source": "Evidence-based",
            "confidence_score": 0.95,
            "last_assessed_date": (date.today() - timedelta(days=20)).isoformat(),
            "last_used_date": (date.today() - timedelta(days=5)).isoformat(),
            "assessment_method": "Certification",
            "evidence_reference": "CERT-1042",
            "is_decayed": False
        },
        {
            "skill_id": "SKL-K8S",
            "employee_id": emp1_id,
            "name": "Kubernetes",
            "proficiency_effective": 4,
            "proficiency_source": "Manager-validated",
            "confidence_score": 0.70,
            "last_assessed_date": (date.today() - timedelta(days=90)).isoformat(),
            "last_used_date": (date.today() - timedelta(days=30)).isoformat(),
            "assessment_method": "Performance Review",
            "is_decayed": False
        },
        {
            "skill_id": "SKL-FIG",
            "employee_id": emp2_id,
            "name": "Figma",
            "proficiency_effective": 5,
            "proficiency_source": "Evidence-based",
            "confidence_score": 0.99,
            "last_assessed_date": (date.today() - timedelta(days=2)).isoformat(),
            "last_used_date": (date.today() - timedelta(days=1)).isoformat(),
            "assessment_method": "Portfolio",
            "is_decayed": False
        },
        {
            "skill_id": "SKL-UIX",
            "employee_id": emp2_id,
            "name": "UI/UX Research",
            "proficiency_effective": 3,
            "proficiency_source": "Self-assessed",
            "confidence_score": 0.40,
            "last_assessed_date": (date.today() - timedelta(days=300)).isoformat(),
            "last_used_date": (date.today() - timedelta(days=200)).isoformat(),
            "assessment_method": "Self-Reported",
            "is_decayed": True
        }
    ]
    
    print("Clearing old workforce skill records...")
    sb.db.execute("DELETE FROM workforce_employee_skill_records")
    print(f"Inserting {len(wf_skills)} workforce skill records...")
    sb.table("workforce_employee_skill_records").insert(wf_skills).execute()
    
    print("Workforce Module Data Seeding Complete!")

if __name__ == "__main__":
    seed_workforce_module()

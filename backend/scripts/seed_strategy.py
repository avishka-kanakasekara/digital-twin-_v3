import uuid
import sys
from pathlib import Path

# Add the backend directory to sys.path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import get_db

def seed_strategy_data():
    sb = get_db()
    
    # 1. Role Specs
    specs_data = [
        { "id": str(uuid.uuid4()), "rank": 1, "role": "Senior Cloud Architect", "skill": "AWS / Azure & Terraform", "dept": "Engineering", "level": "L5 Staff", "gap": "+14", "urgency": "HIGH", "status": "In Strategy Plan" },
        { "id": str(uuid.uuid4()), "rank": 2, "role": "AI / MLOps Specialist", "skill": "LLM Fine-tuning & PyTorch", "dept": "Engineering", "level": "L4 Senior", "gap": "+10", "urgency": "HIGH", "status": "In Strategy Plan" },
        { "id": str(uuid.uuid4()), "rank": 3, "role": "Lead Data Governance Officer", "skill": "GDPR & Data Architecture", "dept": "Corporate", "level": "L5 Lead", "gap": "+6", "urgency": "HIGH", "status": "In Strategy Plan" },
        { "id": str(uuid.uuid4()), "rank": 4, "role": "DevSecOps Engineer", "skill": "CI/CD & Container Security", "dept": "Operations", "level": "L4 Senior", "gap": "+8", "urgency": "MEDIUM", "status": "In Strategy Plan" },
        { "id": str(uuid.uuid4()), "rank": 5, "role": "Product Growth Strategist", "skill": "SaaS Metrics & A/B Testing", "dept": "Product", "level": "L4 Senior", "gap": "+5", "urgency": "MEDIUM", "status": "In Strategy Plan" }
    ]
    
    # 2. Primary Inputs
    inputs_data = [
        { "id": str(uuid.uuid4()), "title": "Corporate Strategy 2025-2030", "type": "Strategy Doc", "status": "Parsed by AI", "date": "Aug 2025" },
        { "id": str(uuid.uuid4()), "title": "Division Business Unit Plans", "type": "Business Scenario", "status": "5 Units Synced", "date": "Jul 2025" },
        { "id": str(uuid.uuid4()), "title": "Cloud & AI Operating Model", "type": "Institutional Doc", "status": "Active Driver", "date": "Aug 2025" }
    ]
    
    # 3. Knowledge Assets
    assets_data = [
        { "id": str(uuid.uuid4()), "name": "Role-Skill Map Templates", "count": "62 Templates", "color": "#3b82f6" },
        { "id": str(uuid.uuid4()), "name": "Strategic Headcount Targets", "count": "6,782 Target", "color": "#10b981" },
        { "id": str(uuid.uuid4()), "name": "Corporate Knowledge Graph", "count": "1,420 Nodes", "color": "#a855f7" }
    ]
    
    print("Clearing existing strategy data...")
    sb.db.execute("DELETE FROM org_strategy_role_specs")
    sb.db.execute("DELETE FROM org_strategy_primary_inputs")
    sb.db.execute("DELETE FROM org_strategy_knowledge_assets")
    
    print("Seeding Strategy Role Specs...")
    sb.table("org_strategy_role_specs").insert(specs_data).execute()
    
    print("Seeding Strategy Primary Inputs...")
    sb.table("org_strategy_primary_inputs").insert(inputs_data).execute()
    
    print("Seeding Strategy Knowledge Assets...")
    sb.table("org_strategy_knowledge_assets").insert(assets_data).execute()
    
    print("Strategy data seeded successfully!")

if __name__ == "__main__":
    seed_strategy_data()

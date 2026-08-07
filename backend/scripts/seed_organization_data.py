"""
Seed the Supabase database with Organization module mock data.
Run with: python -m scripts.seed_organization_data
"""

import uuid
from datetime import datetime, timezone

from app.database import get_supabase_admin

def _uid() -> str:
    return str(uuid.uuid4())

def seed_organization():
    print("🏢 Starting Organization Module seed...")
    sb = get_supabase_admin()

    print("  🗑️  Clearing existing organization data...")
    tables_to_clear = [
        "org_innovation_ideas",
        "org_innovation_communities",
        "org_at_risk_employees",
        "org_talent_gigs",
        "org_talent_mentors",
        "org_team_builder_options",
        "org_okrs"
    ]
    for table in tables_to_clear:
        try:
            sb.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception:
            pass

    now = datetime.now(timezone.utc)

    # 1. Innovation Ideas
    ideas = [
        {
            "id": _uid(),
            "title": "AI-Powered Customer Onboarding",
            "author_initials": "JD",
            "author_bg": "bg-indigo-600",
            "description": "Automate the KYC process using computer vision and LLMs.",
            "full_description": "A comprehensive system to verify customer identities using live video and AI-driven document analysis.",
            "roi": "$1.2M/yr",
            "timeline": "3 Months",
            "budget": "$50k",
            "risks": "Regulatory compliance, false positives in CV.",
            "team_required": "2 AI Engineers, 1 Product Manager, 1 Legal.",
            "impact_score": 92,
            "feasibility": "High",
            "status": "In Review",
            "patent_pending": True,
            "created_at": now.isoformat()
        },
        {
            "id": _uid(),
            "title": "Sustainable Supply Chain Predictor",
            "author_initials": "MS",
            "author_bg": "bg-emerald-600",
            "description": "Optimize logistics routes to reduce carbon emissions by 15%.",
            "full_description": "Uses real-time traffic, weather, and shipment weight to dynamically route delivery trucks.",
            "roi": "$500k/yr",
            "timeline": "6 Months",
            "budget": "$100k",
            "risks": "Driver adoption, third-party API costs.",
            "team_required": "1 Data Scientist, 2 Backend Engineers.",
            "impact_score": 85,
            "feasibility": "Medium",
            "status": "Approved",
            "patent_pending": False,
            "created_at": now.isoformat()
        }
    ]
    sb.table("org_innovation_ideas").insert(ideas).execute()
    print(f"  ✅ {len(ideas)} Innovation Ideas created")

    # 2. Talent Gigs
    gigs = [
        {
            "id": _uid(),
            "role_title": "Senior AI Architect",
            "department": "Engineering",
            "required_skills": ["Python", "TensorFlow", "System Design"],
            "matched_employees": [
                {"name": "Alex Carter", "match_score": 95, "role": "Senior Cloud Engineer"}
            ],
            "urgency": "High"
        },
        {
            "id": _uid(),
            "role_title": "Product Growth Lead",
            "department": "Product",
            "required_skills": ["A/B Testing", "Analytics", "Strategy"],
            "matched_employees": [
                {"name": "Priya Sharma", "match_score": 88, "role": "AI Research"}
            ],
            "urgency": "Medium"
        }
    ]
    sb.table("org_talent_gigs").insert(gigs).execute()
    print(f"  ✅ {len(gigs)} Talent Gigs created")

    # 3. OKRs
    okrs = [
        {
            "id": _uid(),
            "title": "Expand to European Market",
            "owner": "Sarah Mitchell",
            "progress": 65,
            "status": "On Track",
            "initiatives": [
                {"name": "Localize app to French and German", "progress": 100},
                {"name": "Hire EU Sales Lead", "progress": 30}
            ]
        }
    ]
    sb.table("org_okrs").insert(okrs).execute()
    print(f"  ✅ {len(okrs)} OKRs created")

    print("\n🎉 Organization data seeded successfully!")

if __name__ == "__main__":
    seed_organization()

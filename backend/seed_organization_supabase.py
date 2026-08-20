"""
seed_organization_supabase.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supabase ලා Organization module ටිකේ seed data insert කරන script.

Run:  python seed_organization_supabase.py
"""
from __future__ import annotations

import csv
import json
import os
import sys

from dotenv import load_dotenv
from supabase import create_client, Client

# ── Load env ────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ── Paths ────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORY_CSV     = os.path.join(BASE_DIR, "mock_data", "csv", "organization_history.csv")
SIMULATIONS_CSV = os.path.join(BASE_DIR, "mock_data", "csv", "simulations.csv")


# ─────────────────────────────────────────────────────────────────
# 1. organization_metrics   (from organization_history.csv)
# ─────────────────────────────────────────────────────────────────
def seed_metrics() -> None:
    print("\n📊  Checking organization_metrics...")

    existing = sb.table("organization_metrics").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    if not os.path.exists(HISTORY_CSV):
        print(f"   ❌  File not found: {HISTORY_CSV}")
        return

    records = []
    with open(HISTORY_CSV, mode="r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            records.append({
                "month":                        row["month"],
                "date":                         row["date"],
                "total_headcount":              int(row["totalHeadcount"]),
                "voluntary_attrition_rate":     float(row["voluntaryAttritionRate"]),
                "involuntary_attrition_rate":   float(row["involuntaryAttritionRate"]),
                "new_hires":                    int(row["newHires"]),
                "open_positions":               int(row["openPositions"]),
                "enps":                         int(row["eNPS"]),
                "training_hours_per_employee":  float(row["trainingHoursPerEmployee"]),
                "absenteeism_rate":             float(row["absenteeismRate"]),
                "revenue":                      float(row["revenue"]),
                "operating_cost":               float(row["operatingCost"]),
                "ebitda":                       float(row["ebitda"]),
                "net_profit":                   float(row["netProfit"]),
                "marketing_spend":              float(row["marketingSpend"]),
                "rd_spend":                     float(row["rdSpend"]),
                "overall_productivity_score":   int(row["overallProductivityScore"]),
                "csat":                         float(row["csat"]),
                "nps":                          int(row["nps"]),
                "market_share_percentage":      float(row["marketSharePercentage"]),
                "project_completion_rate":      float(row["projectCompletionRate"]),
                "carbon_footprint_tons":        int(row["carbonFootprintTons"]),
                "energy_consumption_kwh":       int(row["energyConsumptionKwh"]),
                "compliance_score":             int(row["complianceScore"]),
                "security_incidents":           int(row["securityIncidents"]),
                "anomaly_flag":                 row.get("anomalyFlag") or None,
            })

    # Insert in batches of 50
    for i in range(0, len(records), 50):
        batch = records[i:i+50]
        sb.table("organization_metrics").insert(batch).execute()

    print(f"   ✅  Inserted {len(records)} rows into organization_metrics.")


# ─────────────────────────────────────────────────────────────────
# 2. organization_scenarios  (from simulations.csv)
# ─────────────────────────────────────────────────────────────────
def seed_scenarios() -> None:
    print("\n📈  Checking organization_scenarios...")

    existing = sb.table("organization_scenarios").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    if not os.path.exists(SIMULATIONS_CSV):
        print(f"   ❌  File not found: {SIMULATIONS_CSV}")
        return

    records = []
    with open(SIMULATIONS_CSV, mode="r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            records.append({
                "scenario_name":                row["scenarioName"],
                "target_metric":                row["targetMetric"],
                "predicted_impact_percentage":  float(row["predictedImpactPercentage"]),
                "predicted_roi":                float(row["predictedROI"]),
                "confidence_level":             int(row["confidenceLevel"]),
                "time_to_impact_months":        int(row["timeToRealizeMonths"]),
                "ai_recommendation":            f"Status: {row['status']}",
            })

    for i in range(0, len(records), 50):
        batch = records[i:i+50]
        sb.table("organization_scenarios").insert(batch).execute()

    print(f"   ✅  Inserted {len(records)} rows into organization_scenarios.")


# ─────────────────────────────────────────────────────────────────
# 3. org_innovation_ideas
# ─────────────────────────────────────────────────────────────────
def seed_innovation_ideas() -> None:
    print("\n💡  Checking org_innovation_ideas...")

    existing = sb.table("org_innovation_ideas").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {
            "title": "AI-Powered Onboarding Assistant",
            "author_initials": "AK",
            "author_bg": "bg-blue-500",
            "description": "Automate onboarding with an AI chatbot that guides new hires through paperwork, policies, and first-week tasks.",
            "full_description": "Implement a conversational AI assistant that provides personalized onboarding experiences, reduces HR workload by 40%, and increases new hire satisfaction scores.",
            "roi": "180% in 18 months",
            "timeline": "6 months",
            "budget": "$120,000",
            "risks": "Integration complexity with HRIS, data privacy concerns",
            "team_required": "2 AI Engineers, 1 HR Specialist, 1 UX Designer",
            "impact_score": 87,
            "feasibility": "High",
            "status": "Under Review",
            "patent_pending": False,
        },
        {
            "title": "Predictive Burnout Detection System",
            "author_initials": "SR",
            "author_bg": "bg-purple-500",
            "description": "Use ML models to detect early signs of employee burnout and trigger proactive HR interventions.",
            "full_description": "Analyse calendar density, meeting patterns, after-hours work, and sentiment from internal communications to score burnout risk per employee.",
            "roi": "220% in 12 months",
            "timeline": "9 months",
            "budget": "$200,000",
            "risks": "Employee privacy, data ethics, false-positive interventions",
            "team_required": "3 Data Scientists, 1 HR Director, 1 Legal Advisor",
            "impact_score": 92,
            "feasibility": "Medium",
            "status": "Approved",
            "patent_pending": True,
        },
        {
            "title": "Internal Gig Marketplace",
            "author_initials": "MP",
            "author_bg": "bg-green-500",
            "description": "Create an internal platform where employees can pick up short-term projects outside their primary role.",
            "full_description": "A marketplace allowing employees to offer and take micro-projects, boosting cross-functional collaboration, skill development, and engagement.",
            "roi": "150% in 24 months",
            "timeline": "12 months",
            "budget": "$85,000",
            "risks": "Workload management, prioritisation conflicts",
            "team_required": "2 Full-Stack Developers, 1 Product Manager",
            "impact_score": 78,
            "feasibility": "High",
            "status": "In Development",
            "patent_pending": False,
        },
        {
            "title": "Zero-Carbon Remote Work Programme",
            "author_initials": "LT",
            "author_bg": "bg-emerald-500",
            "description": "Offset carbon footprint of remote workers by subsidising renewable energy subscriptions.",
            "full_description": "Partner with green energy providers to offer employees renewable energy vouchers, reducing corporate carbon footprint and improving ESG scores.",
            "roi": "95% in 36 months",
            "timeline": "4 months",
            "budget": "$50,000",
            "risks": "Provider reliability, global coverage gaps",
            "team_required": "1 Sustainability Lead, 1 Finance Analyst",
            "impact_score": 65,
            "feasibility": "High",
            "status": "Under Review",
            "patent_pending": False,
        },
        {
            "title": "Skill-Gap Simulation Engine",
            "author_initials": "JW",
            "author_bg": "bg-orange-500",
            "description": "Simulate future skill gaps based on industry trends and recommend upskilling plans.",
            "full_description": "Combine external labour market data with internal skill profiles to forecast skill deficits 12-24 months ahead, then auto-generate personalised learning paths.",
            "roi": "310% in 18 months",
            "timeline": "8 months",
            "budget": "$175,000",
            "risks": "Data quality, rapidly changing market conditions",
            "team_required": "2 Data Engineers, 1 L&D Specialist, 1 ML Engineer",
            "impact_score": 95,
            "feasibility": "Medium",
            "status": "Approved",
            "patent_pending": True,
        },
    ]

    sb.table("org_innovation_ideas").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_innovation_ideas.")


# ─────────────────────────────────────────────────────────────────
# 4. org_innovation_communities
# ─────────────────────────────────────────────────────────────────
def seed_innovation_communities() -> None:
    print("\n🏘️   Checking org_innovation_communities...")

    existing = sb.table("org_innovation_communities").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {"name": "AI & Machine Learning Guild",  "members": 142, "joined": False, "icon": "🤖", "bg_class": "bg-blue-500/20"},
        {"name": "Green Tech Circle",             "members": 88,  "joined": True,  "icon": "🌿", "bg_class": "bg-green-500/20"},
        {"name": "Product Innovation Lab",        "members": 215, "joined": False, "icon": "🚀", "bg_class": "bg-purple-500/20"},
        {"name": "Future of Work Forum",          "members": 173, "joined": True,  "icon": "💼", "bg_class": "bg-orange-500/20"},
        {"name": "Data & Analytics Community",    "members": 196, "joined": False, "icon": "📊", "bg_class": "bg-cyan-500/20"},
    ]

    sb.table("org_innovation_communities").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_innovation_communities.")


# ─────────────────────────────────────────────────────────────────
# 5. org_at_risk_employees
# ─────────────────────────────────────────────────────────────────
def seed_at_risk_employees() -> None:
    print("\n⚠️   Checking org_at_risk_employees...")

    existing = sb.table("org_at_risk_employees").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {
            "employee_id": "EMP-0042",
            "risk_level": "Critical",
            "risk_score": 91.5,
            "primary_factor": "Burnout",
            "burnout_probability": 0.88,
            "compensation_satisfaction": 0.32,
            "career_stagnation_score": 0.76,
            "last_1_on_1": "42 days ago",
            "ai_retention_suggestion": "Schedule immediate 1-on-1, offer flexible work arrangement, review compensation band.",
        },
        {
            "employee_id": "EMP-0117",
            "risk_level": "High",
            "risk_score": 78.2,
            "primary_factor": "Compensation Dissatisfaction",
            "burnout_probability": 0.45,
            "compensation_satisfaction": 0.21,
            "career_stagnation_score": 0.58,
            "last_1_on_1": "28 days ago",
            "ai_retention_suggestion": "Benchmark compensation against market rates and initiate salary review cycle.",
        },
        {
            "employee_id": "EMP-0253",
            "risk_level": "High",
            "risk_score": 74.8,
            "primary_factor": "Career Stagnation",
            "burnout_probability": 0.38,
            "compensation_satisfaction": 0.61,
            "career_stagnation_score": 0.84,
            "last_1_on_1": "15 days ago",
            "ai_retention_suggestion": "Present internal mobility opportunities and create a 90-day promotion plan.",
        },
        {
            "employee_id": "EMP-0389",
            "risk_level": "Medium",
            "risk_score": 58.3,
            "primary_factor": "Work-Life Balance",
            "burnout_probability": 0.62,
            "compensation_satisfaction": 0.74,
            "career_stagnation_score": 0.41,
            "last_1_on_1": "7 days ago",
            "ai_retention_suggestion": "Reduce meeting load, encourage PTO usage, and assign a wellness buddy.",
        },
        {
            "employee_id": "EMP-0501",
            "risk_level": "Medium",
            "risk_score": 52.1,
            "primary_factor": "Manager Relationship",
            "burnout_probability": 0.29,
            "compensation_satisfaction": 0.68,
            "career_stagnation_score": 0.37,
            "last_1_on_1": "21 days ago",
            "ai_retention_suggestion": "Facilitate skip-level meeting with senior leadership and provide manager coaching.",
        },
    ]

    sb.table("org_at_risk_employees").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_at_risk_employees.")


# ─────────────────────────────────────────────────────────────────
# 6. org_talent_gigs
# ─────────────────────────────────────────────────────────────────
def seed_talent_gigs() -> None:
    print("\n💼  Checking org_talent_gigs...")

    existing = sb.table("org_talent_gigs").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {
            "role_title": "ML Model Reviewer",
            "department": "Data & AI",
            "required_skills": ["Python", "TensorFlow", "Model Evaluation"],
            "matched_employees": [
                {"id": "EMP-0042", "name": "Alex Kim",    "match": 94},
                {"id": "EMP-0117", "name": "Sara Patel",  "match": 87},
            ],
            "urgency": "High",
        },
        {
            "role_title": "Internal Hackathon Mentor",
            "department": "Engineering",
            "required_skills": ["Mentoring", "Full-Stack Dev", "Agile"],
            "matched_employees": [
                {"id": "EMP-0253", "name": "Raj Mehta",   "match": 91},
                {"id": "EMP-0389", "name": "Lena Brooks",  "match": 82},
            ],
            "urgency": "Medium",
        },
        {
            "role_title": "ESG Report Contributor",
            "department": "Finance",
            "required_skills": ["Sustainability", "Data Analysis", "Writing"],
            "matched_employees": [
                {"id": "EMP-0501", "name": "Tom Wright",  "match": 88},
            ],
            "urgency": "Low",
        },
    ]

    sb.table("org_talent_gigs").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_talent_gigs.")


# ─────────────────────────────────────────────────────────────────
# 7. org_talent_mentors
# ─────────────────────────────────────────────────────────────────
def seed_talent_mentors() -> None:
    print("\n🎓  Checking org_talent_mentors...")

    existing = sb.table("org_talent_mentors").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {"name": "Dr. Anita Sharma",    "role": "Chief Data Officer",       "description": "10+ years in ML and AI strategy. Mentors on career transitions into leadership.", "match_score": 96, "initials": "AS", "icon_bg": "bg-violet-500"},
        {"name": "Marcus Webb",          "role": "VP Engineering",           "description": "Expert in scaling engineering teams and building high-performance cultures.",         "match_score": 92, "initials": "MW", "icon_bg": "bg-blue-500"},
        {"name": "Elena Costa",          "role": "Head of Product",          "description": "Specialises in product-led growth and cross-functional alignment.",                  "match_score": 88, "initials": "EC", "icon_bg": "bg-pink-500"},
        {"name": "James Okafor",         "role": "Director of Finance",      "description": "Guides on financial modelling, budgeting, and ESG reporting best practices.",       "match_score": 84, "initials": "JO", "icon_bg": "bg-green-500"},
        {"name": "Priya Nair",           "role": "HR Business Partner",      "description": "Mentor focused on people skills, conflict resolution, and leadership presence.",    "match_score": 79, "initials": "PN", "icon_bg": "bg-orange-500"},
    ]

    sb.table("org_talent_mentors").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_talent_mentors.")


# ─────────────────────────────────────────────────────────────────
# 8. org_team_builder_options
# ─────────────────────────────────────────────────────────────────
def seed_team_builder_options() -> None:
    print("\n👥  Checking org_team_builder_options...")

    existing = sb.table("org_team_builder_options").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {
            "name": "Alpha Squad",
            "success_rate": 94,
            "compatibility_score": 91,
            "skill_balance": 88,
            "performance_prediction": 92,
            "rationale": "High interpersonal trust, complementary skill sets, and proven delivery history.",
            "members": [
                {"id": "EMP-0042", "name": "Alex Kim",    "role": "Lead Engineer",    "avatar": "AK"},
                {"id": "EMP-0117", "name": "Sara Patel",  "role": "Product Designer", "avatar": "SP"},
                {"id": "EMP-0253", "name": "Raj Mehta",   "role": "Data Analyst",     "avatar": "RM"},
            ],
        },
        {
            "name": "Beta Force",
            "success_rate": 87,
            "compatibility_score": 84,
            "skill_balance": 90,
            "performance_prediction": 86,
            "rationale": "Diverse backgrounds covering frontend, backend, and domain expertise.",
            "members": [
                {"id": "EMP-0389", "name": "Lena Brooks", "role": "Backend Dev",      "avatar": "LB"},
                {"id": "EMP-0501", "name": "Tom Wright",  "role": "Frontend Dev",     "avatar": "TW"},
                {"id": "EMP-0042", "name": "Alex Kim",    "role": "Tech Lead",        "avatar": "AK"},
            ],
        },
        {
            "name": "Gamma Unit",
            "success_rate": 81,
            "compatibility_score": 78,
            "skill_balance": 85,
            "performance_prediction": 80,
            "rationale": "Strong analytical focus with cross-department representation.",
            "members": [
                {"id": "EMP-0117", "name": "Sara Patel",  "role": "UX Researcher",   "avatar": "SP"},
                {"id": "EMP-0253", "name": "Raj Mehta",   "role": "ML Engineer",     "avatar": "RM"},
                {"id": "EMP-0501", "name": "Tom Wright",  "role": "Finance Lead",    "avatar": "TW"},
            ],
        },
    ]

    sb.table("org_team_builder_options").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_team_builder_options.")


# ─────────────────────────────────────────────────────────────────
# 9. org_okrs
# ─────────────────────────────────────────────────────────────────
def seed_okrs() -> None:
    print("\n🎯  Checking org_okrs...")

    existing = sb.table("org_okrs").select("id").limit(1).execute()
    if existing.data:
        print("   ✅  Already has data — skipping.")
        return

    records = [
        {
            "title": "Achieve 30% Revenue Growth by Q4",
            "owner": "CEO",
            "progress": 68,
            "status": "On Track",
            "initiatives": [
                {"title": "Expand APAC market", "progress": 80, "status": "On Track"},
                {"title": "Launch premium tier", "progress": 55, "status": "At Risk"},
                {"title": "Upsell to enterprise accounts", "progress": 72, "status": "On Track"},
            ],
        },
        {
            "title": "Reduce Voluntary Attrition to <2% Annually",
            "owner": "CHRO",
            "progress": 52,
            "status": "At Risk",
            "initiatives": [
                {"title": "Implement retention bonus programme", "progress": 90, "status": "Completed"},
                {"title": "Launch career pathing platform",      "progress": 40, "status": "At Risk"},
                {"title": "Improve manager effectiveness score", "progress": 35, "status": "Behind"},
            ],
        },
        {
            "title": "Cut Carbon Footprint by 25% by Year End",
            "owner": "COO",
            "progress": 41,
            "status": "Behind",
            "initiatives": [
                {"title": "Switch to renewable energy in HQ",    "progress": 70, "status": "On Track"},
                {"title": "Remote-first policy rollout",          "progress": 35, "status": "At Risk"},
                {"title": "Green travel policy enforcement",      "progress": 20, "status": "Behind"},
            ],
        },
        {
            "title": "Improve eNPS to 60+ by Mid-Year",
            "owner": "CHRO",
            "progress": 78,
            "status": "On Track",
            "initiatives": [
                {"title": "Monthly pulse surveys",                "progress": 95, "status": "Completed"},
                {"title": "Action planning workshops",            "progress": 70, "status": "On Track"},
                {"title": "Leadership transparency sessions",     "progress": 65, "status": "On Track"},
            ],
        },
        {
            "title": "Launch 3 New AI-Powered Products",
            "owner": "CTO",
            "progress": 60,
            "status": "On Track",
            "initiatives": [
                {"title": "AI onboarding assistant MVP",          "progress": 85, "status": "On Track"},
                {"title": "Predictive analytics dashboard",       "progress": 55, "status": "On Track"},
                {"title": "Automated compliance monitor",         "progress": 40, "status": "At Risk"},
            ],
        },
    ]

    sb.table("org_okrs").insert(records).execute()
    print(f"   ✅  Inserted {len(records)} rows into org_okrs.")


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀  Starting Organization Supabase Seed Script")
    print("=" * 50)

    seed_metrics()
    seed_scenarios()
    seed_innovation_ideas()
    seed_innovation_communities()
    seed_at_risk_employees()
    seed_talent_gigs()
    seed_talent_mentors()
    seed_team_builder_options()
    seed_okrs()

    print("\n" + "=" * 50)
    print("🎉  Seeding complete! All organization tables are populated.")

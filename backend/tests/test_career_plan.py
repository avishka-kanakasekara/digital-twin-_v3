"""Career Coach plan: goal to dated milestones that track real progress."""

import uuid

import pytest
from fastapi import HTTPException

from app.database import get_db
from app.services import career_plan
from app.services.learning_recommendation import generate_plan, list_skill_gaps, transition_item

CLOUD_BAR = (
    ("AWS Architecture", 95),
    ("Azure Services", 75),
    ("Terraform", 85),
    ("Kubernetes", 90),
    ("System Design", 85),
    ("Cloud Security", 80),
)


def _cloud_engineer():
    db = get_db()
    career_plan.ensure_schema(db)
    employee_id = str(uuid.uuid4())
    db.table("employees").insert({
        "id": employee_id,
        "employee_code": "C-" + employee_id[:8],
        "full_name": "Cloud Person",
        "email": f"{employee_id[:8]}@example.com",
        "role": "Senior Cloud Engineer",
        "department": "Platform",
    }).execute()
    for name, level in CLOUD_BAR:
        db.table("skills").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "name": name,
            "proficiency": level,
            "target_level": level,
        }).execute()
    return db, employee_id


def test_no_goal_returns_role_options():
    db, employee_id = _cloud_engineer()
    plan = career_plan.build_plan(db, employee_id)
    assert plan["goal"] is None
    assert "Cloud Architect" in plan["role_options"]


def test_preview_lists_what_to_build():
    db, employee_id = _cloud_engineer()
    preview = career_plan.preview_role(db, employee_id, "Cloud Architect")
    assert [row["skill"] for row in preview["to_build"]] == ["Cloud Cost", "Cloud Networking"]
    assert preview["total_hours"] == 2 * 7 * career_plan.HOURS_PER_LEVEL


def test_goal_builds_dated_milestones_for_each_missing_skill():
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 12, 5, False)
    plan = career_plan.build_plan(db, employee_id)
    assert [m["skill"] for m in plan["milestones"]] == ["Cloud Cost", "Cloud Networking"]
    first = plan["milestones"][0]
    assert [p["phase"] for p in first["phases"]] == ["learn", "apply", "prove"]
    assert all(p["due"] for p in first["phases"])
    assert plan["readiness"]["met"] == 6 and plan["readiness"]["total"] == 8
    assert plan["timeline"]["remaining_hours"] == plan["timeline"]["total_hours"]
    assert plan["timeline"]["pace"] in {"on_track", "at_risk"}
    steps = db.table("career_roadmap_steps").select("id").eq("career_goal_id", plan["goal"]["id"]).execute().data
    assert len(steps) == 6
    assert plan["this_week"][0]["kind"] == "learning"


def test_more_hours_per_week_brings_the_finish_forward():
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 6, 2, False)
    slow = career_plan.build_plan(db, employee_id)
    career_plan.update_settings(db, employee_id, 15, None)
    fast = career_plan.build_plan(db, employee_id)
    assert fast["timeline"]["projected_finish"] < slow["timeline"]["projected_finish"]
    assert slow["timeline"]["pace"] == "at_risk"
    assert slow["timeline"]["hours_per_week_needed"] > 2


def test_learning_plan_progress_drives_the_learn_milestone():
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 12, 5, False)
    career_plan.build_plan(db, employee_id)
    gap = next(row for row in list_skill_gaps(db, employee_id) if row["skill"] == "Cloud Cost")
    learning = generate_plan(db, employee_id, gap["source_gap_reference"])
    plan = career_plan.build_plan(db, employee_id)
    learn = plan["milestones"][0]["phases"][0]
    assert plan["milestones"][0]["learning"]["plan_id"] == learning["id"]
    assert learn["status"] == "in_progress"
    for item in learning["items"]:
        transition_item(db, item["id"], "Enrolled")
        transition_item(db, item["id"], "In Progress")
        transition_item(db, item["id"], "Completed")
    plan = career_plan.build_plan(db, employee_id)
    assert plan["milestones"][0]["phases"][0]["status"] == "achieved"
    assert plan["milestones"][0]["current"] == 0


def test_evidence_completes_apply_and_prove_needs_a_synced_assessment():
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 12, 5, False)
    plan = career_plan.build_plan(db, employee_id)
    apply, prove = plan["milestones"][0]["phases"][1:]
    with pytest.raises(HTTPException):
        career_plan.record_evidence(db, employee_id, apply["id"], "short", None)
    with pytest.raises(HTTPException):
        career_plan.record_evidence(db, employee_id, prove["id"], "I reviewed costs for three services.", None)
    career_plan.record_evidence(db, employee_id, apply["id"], "Ran a cost review of the payments workload and saved 18%.", None)
    plan = career_plan.build_plan(db, employee_id)
    apply = plan["milestones"][0]["phases"][1]
    assert apply["status"] == "achieved" and apply["evidence"]
    career_plan.reopen_step(db, employee_id, apply["id"])
    assert career_plan.build_plan(db, employee_id)["milestones"][0]["phases"][1]["status"] == "upcoming"


MARKET_REPLY = """Here is the analysis.
```json
{
  "summary": "Employers want architects who design secure, cost-aware multi-cloud systems.",
  "requirements": [
    {"skill": "Multi-Cloud Architecture", "level": 8, "category": "Cloud", "why": "Postings ask for designs across AWS and Azure.",
     "market_signal": "Named in most postings", "matches": ["AWS Architecture", "Azure Services", "Not A Real Skill"],
     "practice_task": "Write the reference architecture for one workload across two clouds.", "proof": "AWS Solutions Architect Professional",
     "resources": [{"name": "AWS Certified Solutions Architect - Professional", "provider": "AWS", "type": "certification"}], "hours_to_close": 0},
    {"skill": "FinOps", "level": 7, "category": "Cloud", "why": "Employers expect cost ownership.", "matches": [{"name": "Cloud Security", "relation": "related"}],
     "practice_task": "Run a monthly cost review for your team's accounts and publish savings.", "proof": "FinOps Certified Practitioner",
     "resources": [{"name": "FinOps Certified Practitioner", "provider": "FinOps Foundation", "type": "certification"}], "hours_to_close": 90},
    {"skill": "Infrastructure as Code", "level": 7, "category": "Automation", "why": "Platforms are delivered as code.", "matches": ["Terraform"], "hours_to_close": 0},
    {"skill": "Kubernetes", "level": 8, "category": "Platform", "why": "Container platforms are standard.", "matches": ["Kubernetes"], "hours_to_close": 0},
    {"skill": "Cloud Security", "level": 8, "category": "Security", "why": "Security reviews sit with the architect.", "matches": ["Cloud Security"], "hours_to_close": 0},
    {"skill": "FinOps", "level": 9, "category": "Duplicate", "why": "Duplicate entry.", "matches": []}
  ]
}
```"""


def test_market_research_sets_the_bar_from_the_skill_dna(monkeypatch):
    from app.services import career_market

    monkeypatch.setattr(career_market, "_enabled", lambda: True)
    monkeypatch.setattr(career_market, "_ask_market", lambda prompt: (MARKET_REPLY, [{"title": "indeed.com", "uri": "https://example.com"}], ["cloud architect 2026"]))
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 12, 5, False)
    plan = career_plan.build_plan(db, employee_id)
    assert plan["market"]["source"] == "market"
    assert plan["market"]["sources"][0]["title"] == "indeed.com"
    names = [row["skill"] for row in plan["requirements"]]
    assert names.count("FinOps") == 1 and len(names) == 5
    multi = next(row for row in plan["requirements"] if row["skill"] == "Multi-Cloud Architecture")
    assert multi["recorded_as"] == "AWS Architecture" and multi["current"] == 10 and multi["gap"] == 0
    assert [m["skill"] for m in plan["milestones"]] == ["FinOps"]
    assert next(row for row in plan["requirements"] if row["skill"] == "FinOps")["related"] == ["Cloud Security"]
    finops = plan["milestones"][0]
    assert "monthly cost review" in finops["phases"][1]["detail"]
    assert finops["phases"][0]["resources"][0]["name"] == "FinOps Certified Practitioner"
    assert "FinOps Certified Practitioner" in finops["phases"][2]["detail"]
    assert sum(p["hours"] for p in finops["phases"]) == 90
    gaps = list_skill_gaps(db, employee_id)
    assert [gap["skill"] for gap in gaps] == ["FinOps"]


def test_researched_names_line_up_with_catalogue_names():
    from app.services.career_market import _canonical

    names = ["Cloud Cost", "Cloud Networking", "System Design"]
    assert _canonical("Cloud Cost Optimization", names) == "Cloud Cost"
    assert _canonical("Advanced Cloud Networking", names) == "Cloud Networking"
    assert _canonical("system design", names) == "System Design"
    assert _canonical("AI/ML Cloud Integration", names) == "AI/ML Cloud Integration"
    assert _canonical("Enterprise Cloud Cost Governance Programme Office", names) == "Enterprise Cloud Cost Governance Programme Office"


def test_market_research_failure_falls_back_to_the_library(monkeypatch):
    from app.services import career_market

    monkeypatch.setattr(career_market, "_enabled", lambda: True)
    monkeypatch.setattr(career_market, "_ask_market", lambda prompt: ("no json here", [], []))
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 12, 5, False)
    plan = career_plan.build_plan(db, employee_id)
    assert plan["market"]["source"] == "library"
    assert [m["skill"] for m in plan["milestones"]] == ["Cloud Cost", "Cloud Networking"]


def test_checkins_feed_momentum_and_closed_skill_stays_as_done_milestone():
    db, employee_id = _cloud_engineer()
    career_plan.create_goal(db, employee_id, "Cloud Architect", 12, 5, False)
    career_plan.build_plan(db, employee_id)
    career_plan.add_checkin(db, employee_id, 3, "Cloud Cost", "Finished module one")
    db.table("skills").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "name": "Cloud Cost",
        "proficiency": 70,
        "target_level": 70,
    }).execute()
    plan = career_plan.build_plan(db, employee_id)
    assert plan["momentum"]["hours_this_week"] == 3
    assert plan["momentum"]["streak_weeks"] == 1
    cost = next(m for m in plan["milestones"] if m["skill"] == "Cloud Cost")
    assert cost["met"] and all(p["status"] == "achieved" for p in cost["phases"])
    assert plan["milestones"][0]["skill"] == "Cloud Networking"
    assert plan["readiness"]["met"] == 7

"""Team Builder: calculated options, persistence, and assembly."""

import uuid

import pytest
from fastapi import HTTPException

from app.database import get_db
from app.services import team_builder
from app.services.team_builder_engine import form_teams, match_skill, proficiency_on_ten


def _person(name, department, role, skills, status="Active"):
    return {
        "id": name.lower().replace(" ", "-"),
        "full_name": name,
        "department": department,
        "role": role,
        "employment_status": status,
        "capacity_status": "sufficient",
        "skills": skills,
    }


ALIASES = {"node": "node.js", "node.js": "node.js", "postgres": "postgresql", "postgresql": "postgresql"}


def test_proficiency_keeps_missing_values_unknown():
    assert proficiency_on_ten(None) is None
    assert proficiency_on_ten(8) == 8
    assert proficiency_on_ten(90) == 9


def test_alias_matches_node_and_exact_match_is_labelled():
    skills = [{"name": "Node", "proficiency": 80, "verified": True}]
    hit = match_skill("Node.js", skills, ALIASES)
    assert hit["match"] == "alias"
    assert hit["proficiency"] == 8
    exact = match_skill("Node.js", [{"name": "Node.js", "proficiency": 7, "verified": False}], ALIASES)
    assert exact["match"] == "exact"


def test_two_strategies_differ_and_repeat():
    people = [
        _person("Ada Kern", "Engineering", "Backend Engineer", [{"name": "Node.js", "proficiency": 9, "verified": True}, {"name": "PostgreSQL", "proficiency": 8, "verified": True}]),
        _person("Bea Lang", "Engineering", "Backend Engineer", [{"name": "Node.js", "proficiency": 7, "verified": True}]),
        _person("Cal Moss", "Design", "Product Designer", [{"name": "Figma", "proficiency": 9, "verified": True}]),
        _person("Dee Orr", "Data", "Data Analyst", [{"name": "PostgreSQL", "proficiency": 6, "verified": False}]),
    ]
    requirements = [
        {"name": "Node.js", "priority": "mandatory"},
        {"name": "PostgreSQL", "priority": "mandatory"},
        {"name": "Figma", "priority": "important"},
    ]
    first = form_teams(people, requirements, ["Backend Engineer"], 3, ALIASES)
    second = form_teams(people, requirements, ["Backend Engineer"], 3, ALIASES)
    assert [option["members"] for option in first["options"]] == [option["members"] for option in second["options"]]
    assert len(first["options"]) == 2
    assert {option["strategy"] for option in first["options"]} == {"balanced", "skill_focus"}
    for option in first["options"]:
        assert option["metrics"]["mandatory_coverage"] == 100
        assert option["metrics"]["recommendation_score"] is not None
        assert "success" not in option["metrics"]
        assert all("Excellent cross-departmental" not in member["explanation"] for member in option["members"])


def test_short_staff_is_not_called_feasible():
    people = [_person("Ada Kern", "Engineering", "Backend Engineer", [{"name": "Node.js", "proficiency": 9, "verified": True}])]
    formed = form_teams(people, [{"name": "Node.js", "priority": "mandatory"}], [], 4, ALIASES)
    assert formed["options"][0]["feasibility"] == "short_staffed"
    assert formed["options"][0]["option_status"] == "infeasible"
    assert formed["options"][0]["metrics"]["actual_headcount"] == 1


def test_no_eligible_people_returns_no_options():
    formed = form_teams([], [{"name": "Node.js", "priority": "mandatory"}], [], 4, ALIASES)
    assert formed["options"] == []
    assert formed["eligible_count"] == 0


def test_missing_mandatory_skill_is_a_gap():
    people = [
        _person("Ada Kern", "Engineering", "Backend Engineer", [{"name": "Figma", "proficiency": 9, "verified": True}]),
        _person("Bea Lang", "Design", "Designer", [{"name": "Figma", "proficiency": 4, "verified": False}]),
    ]
    formed = form_teams(people, [{"name": "PostgreSQL", "priority": "mandatory"}, {"name": "Figma", "priority": "optional"}], [], 2, ALIASES)
    assert formed["options"][0]["feasibility"] == "gaps"
    assert "PostgreSQL" in formed["options"][0]["uncovered"][0]["skill"] or "PostgreSQL" in formed["options"][0]["warnings"][0]


def _employee(db, name, department, role, skills):
    employee_id = str(uuid.uuid4())
    db.table("employees").insert({
        "id": employee_id,
        "employee_code": "T-" + employee_id[:8],
        "full_name": name,
        "email": f"{employee_id[:8]}@example.com",
        "role": role,
        "department": department,
        "employment_status": "Active",
    }).execute()
    for skill, level in skills:
        db.table("skills").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "name": skill,
            "proficiency": level,
            "verified": True,
        }).execute()
    return employee_id


def test_optimize_persists_context_and_assemble_is_idempotent():
    db = get_db()
    team_builder.ensure_schema(db)
    ada = _employee(db, "Ada Kern", "Engineering", "Backend Engineer", (("Node.js", 90), ("PostgreSQL", 80)))
    cal = _employee(db, "Cal Moss", "Design", "Product Designer", (("Figma", 90),))
    dee = _employee(db, "Dee Orr", "Data", "Analyst", (("PostgreSQL", 70),))
    team_builder.save_capacity(db, {"employee_id": ada, "allocatable_pct": 80, "start_date": "2026-11-01", "end_date": "2026-12-31"}, "HR")
    team_builder.save_capacity(db, {"employee_id": cal, "allocatable_pct": 50, "start_date": "2026-11-01", "end_date": "2026-12-31"}, "HR")
    team_builder.save_capacity(db, {"employee_id": dee, "allocatable_pct": 10, "start_date": "2026-11-01", "end_date": "2026-12-31"}, "HR")
    run = team_builder.optimize(db, {
        "project_name": "Billing migration",
        "project_type": "System Migration",
        "start_date": "2026-11-03",
        "end_date": "2026-12-15",
        "headcount": 2,
        "allocation_pct": 40,
        "context": "The API should use node for the service layer.",
        "skills": [{"name": "PostgreSQL", "priority": "mandatory"}, {"name": "Figma", "priority": "important"}],
        "roles": ["Backend Engineer"],
    }, "HR")
    stored = team_builder.run_detail(db, run["run_id"])
    assert stored["request"]["context"].startswith("The API")
    assert "Node.js" in stored["context_skills"] or any(skill["name"] == "Node.js" and skill["priority"] == "optional" for skill in stored["request"]["skills"])
    assert stored["options"]
    assert all(option["score_basis"] == "calculated" for option in stored["options"])
    assert all(option["metrics"]["recommendation_score"] != 94 for option in stored["options"])
    chosen = next(option for option in stored["options"] if option["feasibility"] == "feasible")
    assert dee not in {member["employee_id"] for member in chosen["members"]}
    assembled = team_builder.assemble(db, chosen["id"], "HR", False)
    assert assembled["option_status"] == "assembled"
    assert len(assembled["assignments"]) == len(assembled["members"])
    again = team_builder.assemble(db, chosen["id"], "HR", False)
    assert len(again["assignments"]) == len(assembled["assignments"])
    with pytest.raises(HTTPException) as blocked:
        team_builder.reject_option(db, chosen["id"], "HR", "Too late")
    assert blocked.value.status_code == 409
    with pytest.raises(HTTPException):
        team_builder.assert_option_mutable(db, chosen["id"])


def test_empty_pool_is_saved_without_a_fake_team():
    db = get_db()
    team_builder.ensure_schema(db)
    run = team_builder.optimize(db, {
        "project_name": "Empty bench",
        "headcount": 3,
        "skills": [{"name": "COBOL", "priority": "mandatory"}],
    }, "HR")
    assert run["options"] == [] or all(option["feasibility"] != "feasible" for option in run["options"])
    reloaded = team_builder.run_detail(db, run["run_id"])
    assert reloaded["run_id"] == run["run_id"]

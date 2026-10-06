"""Succession & Knowledge Transfer: slate, HR gate, plans, and progress."""

import os
import uuid
from datetime import date, timedelta

import pytest
from fastapi import HTTPException

from app.database import get_db
from app.services import succession

os.environ["SUCCESSION_AI"] = "false"

DNA = (("Kafka", 90), ("Payments Ledger", 90), ("PostgreSQL", 80), ("Incident Command", 70))


def _employee(db, name, role="Senior Backend Engineer", department="Payments", years=6, skills=()):
    employee_id = str(uuid.uuid4())
    db.table("employees").insert({
        "id": employee_id,
        "employee_code": "S-" + employee_id[:8],
        "full_name": name,
        "email": f"{employee_id[:8]}@example.com",
        "role": role,
        "department": department,
        "years_experience": years,
        "employment_status": "Active",
    }).execute()
    for skill, level in skills:
        db.table("skills").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "name": skill,
            "proficiency": level,
            "verified": False,
        }).execute()
    return employee_id


@pytest.fixture()
def world():
    db = get_db()
    succession.ensure_schema(db)
    tag = uuid.uuid4().hex[:6]

    def s(name):
        return f"{name} {tag}"

    incumbent = _employee(db, f"Ivy Incumbent {tag}", years=10, skills=[(s(n), lvl) for n, lvl in DNA])
    strong = _employee(db, f"Sam Strong {tag}", skills=((s("Kafka"), 90), (s("Payments Ledger"), 80), (s("PostgreSQL"), 80), (s("Incident Command"), 70)))
    tie_a = _employee(db, f"Ana Tie {tag}", skills=((s("Kafka"), 50), (s("PostgreSQL"), 50)))
    tie_b = _employee(db, f"Ben Tie {tag}", skills=((s("Kafka"), 50), (s("PostgreSQL"), 50)))
    partial = _employee(db, f"Pat Partial {tag}", department="Data", role="Data Analyst", skills=((s("PostgreSQL"), 60),))
    role = succession.create_role(db, {
        "role_title": f"Payments Platform Lead {tag}",
        "incumbent_employee_id": incumbent,
        "is_business_critical": True,
        "criticality_reason": "Only person who can run ledger reconciliation.",
        "departure_risk": "High",
        "department": "Payments",
    }, "HR Tester")
    return {"db": db, "s": s, "role": role, "incumbent": incumbent, "strong": strong, "tie_a": tie_a, "tie_b": tie_b, "partial": partial}


def test_requirements_come_from_incumbent_skill_dna(world):
    view = succession.role_view(world["db"], world["role"], succession._employees(world["db"]))
    assert view["requirements_source"] == "incumbent"
    assert {r["skill"] for r in view["requirements"]} == {world["s"](name) for name, _ in DNA}


def test_role_owner_and_departure_date_can_be_cleared(world):
    db = world["db"]
    role_id = world["role"]["id"]
    row = succession.update_role(db, role_id, {"owner_manager_id": world["partial"], "expected_departure_date": "2027-01-31"}, "HR")
    assert row["owner_manager_id"] == world["partial"]
    assert str(row["expected_departure_date"])[:10] == "2027-01-31"
    row = succession.update_role(db, role_id, {"owner_manager_id": None, "expected_departure_date": None}, "HR")
    assert row["owner_manager_id"] is None
    assert row["expected_departure_date"] is None


def test_business_critical_trigger_needs_the_flag(world):
    db = world["db"]
    plain = succession.create_role(db, {"role_title": "Plain Role", "incumbent_employee_id": world["incumbent"]}, "HR")
    with pytest.raises(HTTPException) as exc:
        succession.generate_slate(db, plain["id"], "business_critical", "", "HR")
    assert exc.value.status_code == 409
    with pytest.raises(HTTPException):
        succession.generate_slate(db, plain["id"], "hr_request", "", "HR")
    record = succession.generate_slate(db, plain["id"], "hr_request", "Incumbent asked for an internal move", "HR")
    assert record["trigger_reason"] == succession.TRIGGER_HR_REQUEST
    assert record["trigger_note"] == "Incumbent asked for an internal move"


def test_slate_ranks_by_readiness_then_lower_gap_and_caps_at_five(world):
    db = world["db"]
    for index in range(6):
        _employee(db, f"Extra {index} {uuid.uuid4().hex[:4]}", skills=((world["s"]("Kafka"), 30),))
    record = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")
    candidates = record["candidates"]
    assert record["trigger_reason"] == succession.TRIGGER_BUSINESS_CRITICAL
    assert len(candidates) == succession.MAX_CANDIDATES
    assert candidates[0]["employee_id"] == world["strong"]
    assert world["incumbent"] not in {c["employee_id"] for c in candidates}
    keys = [(-c["candidate_readiness_score"], c["candidate_skill_gap_pct"]) for c in candidates]
    assert keys == sorted(keys)
    assert [c["rank_position"] for c in candidates] == [1, 2, 3, 4, 5]


def test_tie_on_readiness_breaks_on_lower_gap():
    rows = [
        {"employee_id": "a", "candidate_readiness_score": 60, "candidate_skill_gap_pct": 30.0},
        {"employee_id": "b", "candidate_readiness_score": 60, "candidate_skill_gap_pct": 20.0},
        {"employee_id": "c", "candidate_readiness_score": 70, "candidate_skill_gap_pct": 40.0},
    ]
    assert [r["employee_id"] for r in succession.rank_candidates(rows)] == ["c", "b", "a"]


def test_confirmed_requires_hr_approval(world):
    db = world["db"]
    record = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")
    record_id = record["succession_record_id"]
    with pytest.raises(HTTPException):
        succession.set_pairing_status(db, record_id, succession.STATUS_CONFIRMED, "HR")
    succession.nominate(db, record_id, world["strong"], "", "HR")
    with pytest.raises(HTTPException):
        succession.set_pairing_status(db, record_id, succession.STATUS_CONFIRMED, "HR")
    assert succession._record_row(db, record_id)["pairing_status"] == succession.STATUS_NOMINATED

    with pytest.raises(Exception):
        db.table("succession_records").update({"pairing_status": succession.STATUS_CONFIRMED}).eq("id", record_id).execute()

    approved = succession.hr_decision(db, record_id, True, "Strong ledger depth", "HR Lead")
    assert approved["pairing_status"] == succession.STATUS_CONFIRMED
    assert approved["approved_by_hr"] is True
    assert approved["approved_by"] == "HR Lead"
    assert approved["plan"] is not None
    assert approved["plan"]["opened_reason"] == "Pairing Confirmed"


def test_hr_decline_returns_to_slate(world):
    db = world["db"]
    record_id = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")["succession_record_id"]
    succession.nominate(db, record_id, world["tie_a"], "", "HR")
    with pytest.raises(HTTPException):
        succession.hr_decision(db, record_id, False, "", "HR")
    declined = succession.hr_decision(db, record_id, False, "Needs a year more depth", "HR")
    assert declined["pairing_status"] == succession.STATUS_SLATE
    assert declined["nominee"] is None
    assert declined["approved_by_hr"] is False


def test_plan_opens_early_only_at_hr_discretion(world):
    db = world["db"]
    record_id = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")["succession_record_id"]
    with pytest.raises(HTTPException):
        succession.open_plan(db, record_id, "HR", hr_discretion=False)
    plan = succession.open_plan(db, record_id, "HR", hr_discretion=True)
    assert plan["opened_reason"] == "HR Discretion"
    assert plan["succession_record_id"] == record_id
    assert set(plan["by_type"]) == set(succession.TASK_TYPES)
    assert all(plan["by_type"][kind] >= 1 for kind in succession.TASK_TYPES)
    assert all(task["due_date"] and task["status"] == "Not Started" for task in plan["tasks"])


def test_progress_is_completed_over_total_and_overdue_is_flagged(world):
    db = world["db"]
    record_id = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")["succession_record_id"]
    plan = succession.open_plan(db, record_id, "HR", hr_discretion=True)
    for task in plan["tasks"]:
        succession.delete_task(db, task["id"], "HR")
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    later = (date.today() + timedelta(days=10)).isoformat()
    plan = succession.add_task(db, plan["id"], {"task_type": "Shadowing Session", "title": "Shadow ledger close", "due_date": later}, "HR")
    plan = succession.add_task(db, plan["id"], {"task_type": "Documentation Task", "title": "Write reconciliation runbook", "due_date": yesterday}, "HR")
    plan = succession.add_task(db, plan["id"], {"task_type": "Mentor Meeting", "title": "Weekly mentor sync", "due_date": later}, "HR")
    plan = succession.add_task(db, plan["id"], {"task_type": "Handover Checklist Item", "title": "Transfer on-call", "due_date": later}, "HR")
    assert plan["overall_progress_pct"] == 0
    assert plan["overdue_tasks"] == 1
    assert plan["overdue_flags"][0]["title"] == "Write reconciliation runbook"

    first = next(t for t in plan["tasks"] if t["title"] == "Shadow ledger close")
    plan = succession.update_task(db, first["id"], {"status": "Complete"}, "HR")
    assert plan["overall_progress_pct"] == 25.0
    assert plan["status"] == "In Progress"

    overdue = next(t for t in plan["tasks"] if t["overdue_flag"])
    plan = succession.update_task(db, overdue["id"], {"status": "Complete"}, "HR")
    assert plan["overdue_tasks"] == 0
    assert plan["overall_progress_pct"] == 50.0
    stored = succession._plan_row(db, plan["id"])
    assert float(stored["overall_progress_pct"]) == 50.0

    with pytest.raises(HTTPException):
        succession.add_task(db, plan["id"], {"task_type": "Coffee", "title": "Bad type", "due_date": later}, "HR")
    with pytest.raises(HTTPException):
        succession.add_task(db, plan["id"], {"task_type": "Mentor Meeting", "title": "No date"}, "HR")


def test_employee_sees_only_shared_or_confirmed(world):
    db = world["db"]
    record_id = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")["succession_record_id"]
    assert succession.employee_view(db, world["tie_a"])["considered"] == []
    succession.share_with_candidates(db, record_id, True, "HR")
    view = succession.employee_view(db, world["tie_a"])
    assert view["considered"][0]["status"] == "On the successor slate"
    assert {g["skill"] for g in view["considered"][0]["gaps"]} >= {world["s"]("Payments Ledger"), world["s"]("Incident Command")}

    succession.share_with_candidates(db, record_id, False, "HR")
    succession.nominate(db, record_id, world["strong"], "", "HR")
    succession.hr_decision(db, record_id, True, "", "HR")
    strong = succession.employee_view(db, world["strong"])
    assert strong["considered"][0]["status"] == "Confirmed successor"
    assert strong["considered"][0]["plan"] is not None
    assert succession.employee_view(db, world["tie_a"])["considered"] == []


def test_overview_exposure_drops_as_mitigation_lands(world):
    db = world["db"]
    role_id = world["role"]["id"]
    before = next(r for r in succession.overview(db)["roles"] if r["id"] == role_id)
    assert before["exposure"]["level"] == "Critical"
    record_id = succession.generate_slate(db, role_id, "business_critical", "", "HR")["succession_record_id"]
    succession.nominate(db, record_id, world["strong"], "", "HR")
    succession.hr_decision(db, record_id, True, "", "HR")
    after = next(r for r in succession.overview(db)["roles"] if r["id"] == role_id)
    assert after["exposure"]["score"] < before["exposure"]["score"]
    assert after["record"]["pairing_status"] == succession.STATUS_CONFIRMED

    with pytest.raises(HTTPException):
        succession.generate_slate(db, role_id, "business_critical", "", "HR")


def test_persona_answers_fall_back_to_facts(world):
    db = world["db"]
    record_id = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")["succession_record_id"]
    succession.share_with_candidates(db, record_id, True, "HR")
    employee = succession.answer(db, "employee", "Am I being considered as a successor?", employee_id=world["tie_b"])
    assert employee["source"] == "rules"
    assert world["role"]["role_title"] in employee["answer"]
    employer = succession.answer(db, "employer", "Where are we most exposed?")
    assert "exposure" in employer["answer"].lower()


def test_manager_facts_describe_the_confirmed_plan(world):
    db = world["db"]
    succession.update_role(db, world["role"]["id"], {"owner_manager_id": world["partial"]}, "HR")
    record_id = succession.generate_slate(db, world["role"]["id"], "business_critical", "", "HR")["succession_record_id"]
    succession.nominate(db, record_id, world["strong"], "", "HR")
    succession.hr_decision(db, record_id, True, "Approved", "HR")
    facts = succession._facts_for(db, "manager", None, world["partial"])
    role = next(r for r in facts["roles"] if r["role"] == world["role"]["role_title"])
    assert role["confirmed_successor"]["name"].startswith("Sam Strong")
    assert role["kt_plan"]["total_tasks"] >= 4
    assert role["kt_plan"]["next_tasks"]
    reply = succession.answer(db, "manager", "What's the knowledge-transfer plan?", manager_id=world["partial"])
    assert "Sam Strong" in reply["answer"] and "tasks" in reply["answer"]

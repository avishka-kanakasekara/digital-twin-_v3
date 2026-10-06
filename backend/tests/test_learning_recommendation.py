"""Business rules for the Learning Recommendation module."""

import uuid

import pytest
from fastapi import HTTPException

from app.database import get_db
from app.services.learning_recommendation import (
    abandon_plan,
    closure_status,
    compliance,
    create_course,
    ensure_schema,
    gap_score,
    generate_plan,
    list_skill_gaps,
    match_courses,
    priority_score,
    proficiency_verified,
    submit_assessment,
    sync_assessment,
    transition_item,
    _employee_levels,
)


def _employee(skill_name="MLOps", proficiency=1, target=6):
    db = get_db()
    ensure_schema(db)
    employee_id = str(uuid.uuid4())
    db.table("employees").insert({
        "id": employee_id,
        "employee_code": "E-" + employee_id[:8],
        "full_name": "Learner One",
        "email": f"{employee_id[:8]}@example.com",
        "role": "Engineer",
        "department": "Data",
    }).execute()
    db.table("skills").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "name": skill_name,
        "proficiency": proficiency,
        "target_level": target,
    }).execute()
    return db, employee_id


def _complete_first(db, employee_id, title=None):
    gap = list_skill_gaps(db, employee_id)[0]
    plan = generate_plan(db, employee_id, gap["source_gap_reference"])
    item = plan["items"][0]
    if title:
        item = next(row for row in plan["items"] if row["course_title"] == title)
    transition_item(db, item["id"], "Enrolled")
    transition_item(db, item["id"], "In Progress")
    transition_item(db, item["id"], "Completed")
    return gap, item["id"]


def test_gap_score_example_and_closed_gap():
    assert gap_score(1, 3) == pytest.approx(0.6667, abs=0.001)
    assert gap_score(3, 3) == 0
    assert gap_score(5, 3) == 0


def test_priority_blends_gap_strategic_and_mandatory():
    gap_only = priority_score(0.67, False, False)
    strategic = priority_score(0.1, True, False)
    both = priority_score(0.67, True, True)
    assert 0 <= gap_only <= 1
    assert strategic > priority_score(0.1, False, False)
    assert both > gap_only
    assert both <= 1


def test_plan_requires_source_gap():
    db, employee_id = _employee()
    with pytest.raises(HTTPException) as exc:
        generate_plan(db, employee_id, "  ")
    assert exc.value.status_code == 400


def test_retired_course_is_not_recommended_and_foundation_is_first():
    db, _employee_id = _employee()
    courses = match_courses(db, "MLOps", 1, 4)
    titles = [course["course_title"] for course in courses]
    assert "Retired MLOps Legacy" not in titles
    assert titles[0] == "MLOps Foundations"
    assert titles.index("MLOps Foundations") < titles.index("Advanced MLOps")


def test_completion_does_not_change_proficiency():
    db, employee_id = _employee()
    _complete_first(db, employee_id)
    assert _employee_levels(db, employee_id)["mlops"]["level"] == 1


def test_passed_pending_or_failed_sync_does_not_update_proficiency():
    db, employee_id = _employee()
    _gap, item_id = _complete_first(db, employee_id)
    pending = submit_assessment(db, item_id, 88)
    assert pending["passed"] is True
    assert pending["sfa_sync_status"] == "Pending"
    assert pending["proficiency_verified_flag"] is False
    assert _employee_levels(db, employee_id)["mlops"]["level"] == 1
    failed = sync_assessment(db, pending["id"], force_fail=True)
    assert failed["sfa_sync_status"] == "Failed"
    assert _employee_levels(db, employee_id)["mlops"]["level"] == 1


def test_synced_pass_updates_proficiency_and_records_closure():
    db, employee_id = _employee()
    gap, item_id = _complete_first(db, employee_id)
    assessment = submit_assessment(db, item_id, 88)
    synced = sync_assessment(db, assessment["id"])
    assert synced["proficiency_verified_flag"] is True
    assert synced["proficiency_after"] == 2
    assert _employee_levels(db, employee_id)["mlops"]["level"] == 2
    closures = db.table("lr_gap_closures").select("*").eq("employee_id", employee_id).execute().data
    assert closures[0]["closure_status"] == "Partial Closure"
    assert closures[0]["source_gap_reference"] == gap["source_gap_reference"]


def test_failed_assessment_does_not_sync():
    db, employee_id = _employee()
    _gap, item_id = _complete_first(db, employee_id)
    assessment = submit_assessment(db, item_id, 52)
    assert assessment["passed"] is False
    with pytest.raises(HTTPException):
        sync_assessment(db, assessment["id"])
    assert _employee_levels(db, employee_id)["mlops"]["level"] == 1


def test_unverified_completion_does_not_count_as_compliance():
    db, employee_id = _employee(skill_name="Cloud Security", proficiency=1, target=6)
    _gap, item_id = _complete_first(db, employee_id, "Cloud Security Basics")
    before = compliance(db, "mandatory", employee_id)
    assert before["verified_completed"] == 0
    assert before["assigned"] >= 1
    assessment = submit_assessment(db, item_id, 90)
    sync_assessment(db, assessment["id"])
    after = compliance(db, "mandatory", employee_id)
    assert after["verified_completed"] == 1


def test_abandon_requires_reason_and_closure_labels():
    db, employee_id = _employee()
    gap = list_skill_gaps(db, employee_id)[0]
    plan = generate_plan(db, employee_id, gap["source_gap_reference"])
    with pytest.raises(HTTPException):
        abandon_plan(db, plan["id"], " ")
    abandoned = abandon_plan(db, plan["id"], "Changed role")
    assert abandoned["plan_status"] == "Abandoned"
    assert closure_status(1, 3, 3) == "Full Closure"
    assert closure_status(1, 2, 4) == "Partial Closure"
    assert proficiency_verified(True, "Pending") is False
    assert proficiency_verified(True, "Synced") is True


def test_course_without_a_skill_mapping_is_rejected():
    from app.services.learning_recommendation import validate_course

    with pytest.raises(HTTPException) as exc:
        validate_course({"modality": "Self-paced", "difficulty_level": "Beginner", "catalogue_status": "Active", "duration_hours": 8, "cost_lkr": 0, "is_mandatory": False}, [])
    assert exc.value.status_code == 400


def test_unverified_strategic_learning_does_not_count():
    db, employee_id = _employee()
    _gap, item_id = _complete_first(db, employee_id)
    before = compliance(db, "strategic", employee_id)
    assert before["verified_completed"] == 0
    assert before["assigned"] >= 1
    assessment = submit_assessment(db, item_id, 90)
    sync_assessment(db, assessment["id"])
    after = compliance(db, "strategic", employee_id)
    assert after["verified_completed"] == 1


def test_full_closure_is_recorded_against_the_source_gap():
    db, employee_id = _employee(proficiency=1, target=2)
    gap, item_id = _complete_first(db, employee_id, "MLOps Foundations")
    assessment = submit_assessment(db, item_id, 90)
    synced = sync_assessment(db, assessment["id"])
    assert synced["proficiency_after"] == 2
    closures = db.table("lr_gap_closures").select("*").eq("employee_id", employee_id).execute().data
    assert closures[0]["closure_status"] == "Full Closure"
    assert closures[0]["source_gap_reference"] == gap["source_gap_reference"]


def test_employee_cannot_change_another_employees_item():
    db, employee_id = _employee()
    _gap, item_id = _complete_first(db, employee_id)
    with pytest.raises(HTTPException) as exc:
        transition_item(db, item_id, "Skipped", actor_employee_id=str(uuid.uuid4()))
    assert exc.value.status_code == 403


def test_answers_are_scored_and_a_failed_attempt_can_be_retaken():
    db, employee_id = _employee()
    _gap, item_id = _complete_first(db, employee_id, "MLOps Foundations")
    failed = submit_assessment(db, item_id, answers=[1, 1, 1, 1])
    assert failed["passed"] is False
    assert failed["assessment_score_pct"] == 0
    passed = submit_assessment(db, item_id, answers=[0, 0, 0, 0])
    assert passed["passed"] is True
    assert passed["assessment_score_pct"] == 100
    with pytest.raises(HTTPException):
        submit_assessment(db, item_id, answers=[0, 0, 0, 0])


def test_sync_updates_the_originating_skill_gap():
    db, employee_id = _employee(skill_name="Cloud Security", proficiency=1, target=6)
    goal_id = str(uuid.uuid4())
    for name, level in (
        ("AWS Architecture", 95),
        ("Azure Services", 80),
        ("Terraform", 85),
        ("Kubernetes", 90),
        ("System Design", 85),
        ("Cloud Cost", 70),
        ("Cloud Networking", 70),
    ):
        db.table("skills").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "name": name,
            "proficiency": level,
            "target_level": level,
        }).execute()
    db.table("career_goals").insert({
        "id": goal_id,
        "employee_id": employee_id,
        "target_role": "Cloud Architect",
        "is_active": 1,
    }).execute()
    gap, item_id = _complete_first(db, employee_id, "Cloud Security Basics")
    expected = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{goal_id}:gap:Cloud Security"))
    assert gap["source_gap_reference"] == expected
    assessment = submit_assessment(db, item_id, 90)
    sync_assessment(db, assessment["id"])
    row = db.table("skill_gaps").select("*").eq("id", expected).execute().data[0]
    assert int(row["current_level"]) == 4
    assert row["status"] == "in_progress"


def test_created_course_fills_a_gap_and_unknown_skills_are_rejected():
    db, employee_id = _employee(skill_name="Rare Skill", proficiency=1, target=4)
    with pytest.raises(HTTPException) as unknown:
        create_course(db, {
            "course_title": "Invented Skill Lab",
            "provider": "Academy",
            "modality": "Self-paced",
            "duration_hours": 8,
            "cost_lkr": 0,
            "difficulty_level": "Beginner",
            "is_mandatory": False,
            "mandatory_for_role_ids": [],
            "strategic_priority_flag": False,
            "has_assessment": True,
            "catalogue_status": "Active",
        }, [{"skill_name": "Not A Skill", "level_delivered": 2}])
    assert unknown.value.status_code == 400
    course = create_course(db, {
        "course_title": "Rare Skill Foundations",
        "provider": "Academy",
        "modality": "Self-paced",
        "duration_hours": 10,
        "cost_lkr": 0,
        "difficulty_level": "Beginner",
        "is_mandatory": False,
        "mandatory_for_role_ids": [],
        "strategic_priority_flag": True,
        "has_assessment": True,
        "catalogue_status": "Active",
    }, [{"skill_name": "Rare Skill", "level_delivered": 2}])
    gaps = list_skill_gaps(db, employee_id)
    assert gaps[0]["matching_courses"] >= 1
    plan = generate_plan(db, employee_id, gaps[0]["source_gap_reference"])
    assert plan["items"][0]["course_id"] == course["id"]
    extra = create_course(db, {
        "course_title": "Rare Skill Practice",
        "provider": "Academy",
        "modality": "Instructor-led",
        "duration_hours": 6,
        "cost_lkr": 1000,
        "difficulty_level": "Intermediate",
        "is_mandatory": False,
        "mandatory_for_role_ids": [],
        "strategic_priority_flag": False,
        "has_assessment": True,
        "catalogue_status": "Active",
    }, [{"skill_name": "Rare Skill", "level_delivered": 3}])
    updated = generate_plan(db, employee_id, gaps[0]["source_gap_reference"], [extra["id"]])
    assert extra["id"] in [item["course_id"] for item in updated["items"]]
    again = generate_plan(db, employee_id, gaps[0]["source_gap_reference"], [extra["id"]])
    assert len(again["items"]) == len(updated["items"])


def test_active_career_goal_is_the_only_learning_gap_analysis():
    db, employee_id = _employee(skill_name="Go Programming", proficiency=65, target=90)
    for name, level in (
        ("AWS Architecture", 95),
        ("Azure Services", 75),
        ("Terraform", 85),
        ("Kubernetes", 90),
        ("System Design", 85),
        ("Cloud Security", 80),
    ):
        db.table("skills").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "name": name,
            "proficiency": level,
            "target_level": level,
        }).execute()
    db.table("career_goals").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "target_role": "Cloud Architect",
        "is_active": 1,
        "readiness_score": 77,
    }).execute()
    gaps = list_skill_gaps(db, employee_id)
    assert [gap["skill"] for gap in gaps] == ["Cloud Cost", "Cloud Networking"]
    cost = gaps[0]
    assert cost["display_current"] == 0
    assert cost["display_required"] == 7
    assert cost["display_scale"] == 10
    assert cost["source_type"] == "Career Path Step"
    assert cost["matching_courses"] >= 1
    assert "Go Programming" not in [gap["skill"] for gap in gaps]

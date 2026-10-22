"""Team registry, invitations, and the demonstration success model."""

import uuid

import pytest
from fastapi import HTTPException

from app.config import settings
from app.database import get_db
from app.ml.team_success.feature_builder import build_features
from app.ml.team_success.generate_demo_dataset import generate_rows
from app.ml.team_success.model_registry import clear_cache
from app.ml.team_success.predict import predict_success
from app.ml.team_success.schemas import FEATURES
from app.ml.team_success.train_model import train
from app.services import team_builder, team_registry


def _person(db, name, role="employee", manager_id=None):
    employee_id = str(uuid.uuid4())
    db.table("employees").insert({
        "id": employee_id,
        "employee_code": "R-" + employee_id[:8],
        "full_name": name,
        "email": f"{employee_id[:8]}@example.com",
        "role": "Engineer",
        "access_role": role,
        "department": "Engineering",
        "manager_id": manager_id,
        "employment_status": "Active",
    }).execute()
    db.table("skills").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "name": "Python",
        "proficiency": 8,
        "verified": True,
    }).execute()
    return {"id": employee_id, "full_name": name, "access_role": role, "role": "Engineer"}


def _features(mandatory=1.0, gaps=0):
    return {
        "mandatory_coverage": mandatory,
        "weighted_coverage": mandatory,
        "proficiency_coverage": 0.7,
        "role_coverage": 1.0,
        "capacity_fit": 1.0,
        "size_ratio": 1.0,
        "department_count": 2,
        "data_completeness": 0.8,
        "unknown_capacity_share": 0.0,
        "gap_count": gaps,
        "project_type": "System Migration",
    }


def test_synthetic_rows_vary_and_include_both_outcomes():
    rows = generate_rows(seed=42, rows=400)
    labels = {row["success"] for row in rows}
    assert labels == {0, 1}
    coverage = {row["mandatory_coverage"] for row in rows}
    assert len(coverage) > 5
    assert "employee_id" not in FEATURES


def test_trained_model_scores_are_not_hardcoded():
    clear_cache()
    metadata = train(seed=42)
    clear_cache()
    assert metadata["training_data_type"] == "synthetic"
    assert metadata["production_validated"] is False
    strong = predict_success(_features(1.0, 0))
    weak = predict_success(_features(0.1, 5))
    assert strong["status"] == "ok"
    assert 0 <= strong["probability"] <= 1
    assert strong["probability"] != weak["probability"]
    assert "Demo / Synthetic-Data Model" in strong["warning"]
    assert strong["display_label"].endswith("demo estimate")
    assert metadata["model_type"] == strong["model_type"]


def test_missing_model_does_not_invent_a_score(monkeypatch):
    monkeypatch.setattr("app.ml.team_success.predict.load_active", lambda: None)
    result = predict_success(_features())
    assert result["status"] == "unavailable"
    assert result["probability"] is None
    assert result["display_label"] == "Prediction unavailable"


def test_employee_invites_and_another_person_approves():
    db = get_db()
    owner = _person(db, "Riley Quinn")
    colleague = _person(db, "Sam Iyer")
    reviewer = _person(db, "Harper Diaz", role="hr")
    team = team_registry.create_team(db, {
        "name": "Billing companions",
        "objective": "Move the billing service.",
        "team_type": "Software Engineering Team",
        "project_type": "System Migration",
        "project_name": "Billing migration",
        "headcount": 2,
        "skills": [{"name": "Python", "priority": "mandatory"}],
        "context": "Use the existing Python services.",
    }, owner)
    assert team["origin"] == "employee_self_service"
    assert team["registration_status"] == "draft"
    assert team["context"] == "Use the existing Python services."
    team = team_registry.invite(db, team["id"], [colleague["id"], colleague["id"]], owner)
    pending = [row for row in team["invitations"] if row["status"] == "pending"]
    assert len(pending) == 1
    with pytest.raises(HTTPException) as denied:
        team_registry.respond(db, pending[0]["id"], True, owner)
    assert denied.value.status_code == 403
    team = team_registry.respond(db, pending[0]["id"], True, colleague)
    assert any(member["employee_id"] == colleague["id"] and member["membership_status"] == "confirmed" for member in team["members"])
    team = team_registry.submit_team(db, team["id"], owner)
    assert team["registration_status"] == "pending_approval"
    again = team_registry.submit_team(db, team["id"], owner)
    assert again["registration_status"] == "pending_approval"
    with pytest.raises(HTTPException) as own:
        team_registry.decide(db, team["id"], True, "Looks good", owner)
    assert own.value.status_code == 403
    approved = team_registry.decide(db, team["id"], True, "Skills are covered.", reviewer)
    assert approved["registration_status"] == "registered"
    assert approved["decided_by"] == "Harper Diaz"
    assigned = team_registry.assign_project(db, team["id"], reviewer)
    assert assigned["operational_status"] == "assigned"
    again_assigned = team_registry.assign_project(db, team["id"], reviewer)
    assert again_assigned["operational_status"] == "assigned"


def test_declined_invitation_is_not_membership_and_reject_blocks_assignment():
    db = get_db()
    owner = _person(db, "Noah Blake")
    colleague = _person(db, "Priya Shah")
    reviewer = _person(db, "Jordan Hale HR", role="hr")
    team = team_registry.create_team(db, {"name": "Support pod", "team_type": "Operations and Support Team", "headcount": 2}, owner)
    team = team_registry.invite(db, team["id"], [colleague["id"]], owner)
    invitation = next(row for row in team["invitations"] if row["status"] == "pending")
    team = team_registry.respond(db, invitation["id"], False, colleague)
    assert all(member["employee_id"] != colleague["id"] for member in team["members"])
    team = team_registry.submit_team(db, team["id"], owner)
    rejected = team_registry.decide(db, team["id"], False, "Need a broader roster.", reviewer)
    assert rejected["registration_status"] == "rejected"
    with pytest.raises(HTTPException) as blocked:
        team_registry.assign_project(db, team["id"], reviewer)
    assert blocked.value.status_code == 409


def test_enforced_manager_scope_and_prediction_goes_stale(monkeypatch):
    db = get_db()
    settings.AUTH_ENFORCE = True
    try:
        manager = _person(db, "Manager Lee", role="manager")
        owner = _person(db, "Report Kim", manager_id=manager["id"])
        outsider = _person(db, "Outsider Chen")
        team = team_registry.create_team(db, {
            "name": "Scoped squad",
            "team_type": "Project Team",
            "project_type": "New Product Development",
            "headcount": 2,
            "skills": [{"name": "Python", "priority": "mandatory"}],
        }, owner)
        with pytest.raises(HTTPException) as hidden:
            team_registry.get_team(db, team["id"], outsider)
        assert hidden.value.status_code == 403
        with pytest.raises(HTTPException):
            team_registry.decide(db, team["id"], True, "No", outsider)
        evaluated = team_registry.evaluate_team(db, team["id"], owner)
        assert evaluated["evaluation"]["feasibility"] in {"feasible", "short_staffed", "gaps", "empty"}
        assert evaluated["prediction"]["status"] in {"ok", "unavailable"}
        if evaluated["prediction"]["status"] == "ok":
            assert "synthetic" == evaluated["prediction"]["training_data_type"] or evaluated["prediction"]["training_data_type"] == "synthetic"
            assert evaluated["prediction"]["stale"] is False
        team_registry.assign_member(db, team["id"], outsider["id"], manager)
        refreshed = team_registry.get_team(db, team["id"], owner)
        if refreshed["prediction"]:
            assert refreshed["prediction"]["stale"] is True
        submitted = team_registry.submit_team(db, team["id"], owner)
        approved = team_registry.decide(db, submitted["id"], True, "Approved in scope.", manager)
        assert approved["registration_status"] == "registered"
        features = build_features({"requested_headcount": 2, "actual_headcount": 1, "department_count": 1, "data_completeness": 50}, [], [{"capacity_status": "unknown"}], None)
        assert "employee_id" not in features
        ready = team_registry.historical_retrain_ready(db)
        assert ready["ready"] is False
    finally:
        settings.AUTH_ENFORCE = False


def test_ask_to_join_stays_pending_until_someone_else_accepts():
    db = get_db()
    team_builder.ensure_schema(db)
    _person(db, "Ada Kern Join")
    _person(db, "Cal Moss Join")
    asker = _person(db, "Robin Lee")
    reviewer = _person(db, "Harper Review", role="hr")
    run = team_builder.optimize(db, {
        "project_name": "Joinable billing team",
        "headcount": 2,
        "skills": [{"name": "Python", "priority": "important"}],
    }, "HR")
    option = run["options"][0]
    first = team_registry.ask_to_join(db, option["id"], asker, "I can help with the migration.")
    assert first["status"] == "pending"
    assert first["employee_id"] == asker["id"]
    assert first["can_decide"] is False
    again = team_registry.ask_to_join(db, option["id"], asker)
    assert again["id"] == first["id"]
    with pytest.raises(HTTPException) as own:
        team_registry.respond_join(db, first["id"], True, asker)
    assert own.value.status_code == 403
    accepted = team_registry.respond_join(db, first["id"], True, reviewer)
    assert accepted["status"] == "accepted"
    team = team_registry.get_team(db, first["team_id"], reviewer)
    assert team["origin"] == "optimizer_generated"
    assert team["creator_id"] != asker["id"]
    assert any(member["employee_id"] == asker["id"] and member["source"] == "join_request" for member in team["members"])
    with pytest.raises(HTTPException) as already:
        team_registry.ask_to_join(db, option["id"], asker)
    assert already.value.status_code == 409


def test_existing_team_appears_when_its_members_cover_the_brief():
    db = get_db()
    team_builder.ensure_schema(db)
    team_registry.ensure_schema(db)
    owner = _person(db, "Skill Match Owner")
    other = _person(db, "Unrelated Owner")
    db.table("skills").update({"name": "COBOL"}).eq("employee_id", other["id"]).execute()
    team_registry.create_team(db, {"name": "Python companions", "skills": [{"name": "Python", "priority": "mandatory"}]}, owner)
    team_registry.create_team(db, {"name": "COBOL companions", "skills": [{"name": "COBOL", "priority": "mandatory"}]}, other)
    run = team_builder.optimize(db, {
        "project_name": "Python brief for existing teams",
        "headcount": 2,
        "skills": [{"name": "Python", "priority": "mandatory"}],
    }, "HR")
    shown = team_registry.attach_existing_teams(db, run)
    names = [item["name"] for item in shown["existing_teams"]]
    assert "Python companions" in names
    assert "COBOL companions" not in names
    match = next(item for item in shown["existing_teams"] if item["name"] == "Python companions")
    assert match["source"] == "existing"
    assert match["skill_model"]["skills_used"] == ["Python"]
    assert match["skill_model"]["score"] is not None


def test_hr_origin_and_outcome_are_stored():
    db = get_db()
    hr = _person(db, "HR Morgan", role="hr")
    team = team_registry.create_team(db, {"name": "HR formed crew", "team_type": "Crisis Response Team", "headcount": 3}, hr)
    assert team["origin"] == "hr_created"
    outcome = team_registry.record_outcome(db, {
        "project_name": "HR formed crew",
        "team_id": team["id"],
        "outcome_label": "success",
        "definition": "Accepted against the written handover checklist.",
        "verified": True,
    }, hr)
    assert outcome["verified"] is True
    status = team_registry.model_status()
    assert status["production_validated"] is False
    assert "employee_id" not in status["features"]


def test_each_person_sees_only_their_teams_and_receives_their_invitation():
    db = get_db()
    owner = _person(db, "Avery Cole")
    colleague = _person(db, "Mina Ortiz")
    stranger = _person(db, "Lee Park")
    team = team_registry.create_team(db, {"name": "Personal pod", "team_type": "Project Team", "headcount": 2}, owner)
    with pytest.raises(HTTPException) as missing:
        team_registry.invite(db, team["id"], ["not-a-person"], owner)
    assert missing.value.status_code == 400
    team = team_registry.invite(db, team["id"], [colleague["id"]], owner)
    assert any(row["employee_id"] == colleague["id"] and row["status"] == "pending" for row in team["invitations"])
    owner_space = team_registry.list_workspace(db, owner)
    colleague_space = team_registry.list_workspace(db, colleague)
    stranger_space = team_registry.list_workspace(db, stranger)
    assert any(item["id"] == team["id"] for item in owner_space["teams"])
    assert any(item["employee_id"] == colleague["id"] and item["status"] == "pending" for item in owner_space["outgoing"])
    assert any(item["team_id"] == team["id"] and item["status"] == "pending" for item in colleague_space["incoming"])
    assert all(item["id"] != team["id"] for item in stranger_space["teams"])
    assert all(item["team_id"] != team["id"] for item in stranger_space["incoming"])
    with pytest.raises(HTTPException) as hidden:
        team_registry.get_team(db, team["id"], stranger)
    assert hidden.value.status_code == 403


def test_recommendation_list_belongs_to_the_requester():
    db = get_db()
    owner = _person(db, "Run Owner")
    other = _person(db, "Run Other")
    team_builder.ensure_schema(db)

    def seed(person: dict, name: str) -> str:
        request_id = str(uuid.uuid4())
        run_id = str(uuid.uuid4())
        db.table("team_builder_requests").insert({
            "id": request_id,
            "project_name": name,
            "owner_employee_id": person["id"],
            "headcount": 2,
            "allocation_pct": 40,
            "skills_json": "[]",
            "roles_json": "[]",
            "requested_by": person["full_name"],
            "created_at": "2026-01-01T00:00:00",
        }).execute()
        db.table("team_builder_runs").insert({
            "id": run_id,
            "request_id": request_id,
            "algorithm_version": "test",
            "status": "completed",
            "eligible_count": 1,
            "requested_headcount": 2,
            "created_at": "2026-01-01T00:00:00",
        }).execute()
        return run_id

    mine = seed(owner, "Mine only")
    theirs = seed(other, "Not mine")
    listed = {item["run_id"] for item in team_builder.list_runs(db, owner_employee_id=owner["id"])["runs"]}
    assert mine in listed
    assert theirs not in listed

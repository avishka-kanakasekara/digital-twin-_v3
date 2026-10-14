"""Skill-match model: the card score comes from the brief's skills."""

from app.ml.skill_fit.features import build_skill_features, skill_bin
from app.ml.skill_fit.predict import score_roster
from app.ml.skill_fit.schemas import FEATURES


def _member(name, match="exact", proficiency=9, verified=True):
    return {"employee_id": "hidden-person", "matched": [{
        "requirement": name,
        "skill": name,
        "match": match,
        "proficiency": proficiency,
        "verified": verified,
        "priority": "mandatory",
    }]}


def test_score_uses_the_requested_skills_and_not_employee_identity():
    brief = [{"name": "Python", "priority": "mandatory"}, {"name": "SQL", "priority": "important"}]
    strong = score_roster(brief, [_member("Python"), _member("SQL")])
    weak = score_roster(brief, [])
    assert strong["status"] == "ok"
    assert strong["training_data_type"] == "synthetic"
    assert strong["production_validated"] is False
    assert strong["skills_used"] == ["Python", "SQL"]
    assert 0 <= strong["score"] <= 100
    assert weak["score"] < strong["score"]
    features = build_skill_features(brief, [_member("Python"), _member("SQL")])
    assert set(features) == set(FEATURES)
    assert "employee_id" not in features
    assert "hidden-person" not in features.values()


def test_different_skill_names_change_the_model_inputs():
    assert skill_bin("Python") != skill_bin("Excel")
    python_row = build_skill_features([{"name": "Python", "priority": "mandatory"}], [_member("Python")])
    excel_row = build_skill_features([{"name": "Excel", "priority": "mandatory"}], [_member("Excel")])
    assert python_row[f"required_bin_{skill_bin('Python')}"] == 1.0
    assert excel_row[f"required_bin_{skill_bin('Excel')}"] == 1.0
    assert python_row != excel_row
    assert score_roster([{"name": "Python", "priority": "mandatory"}], [_member("Python")])["score"] != (
        score_roster([{"name": "Excel", "priority": "mandatory"}], [_member("Excel")])["score"]
    )


def test_missing_skills_does_not_invent_a_score():
    result = score_roster([], [_member("Python")])
    assert result["status"] == "unavailable"
    assert result["score"] is None

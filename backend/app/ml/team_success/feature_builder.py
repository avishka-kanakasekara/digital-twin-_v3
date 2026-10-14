"""Team-level features available at the moment a roster is evaluated.

Employee names, identifiers, and personal attributes are not features.
"""

from __future__ import annotations

from typing import Any

from app.ml.team_success.schemas import CATEGORICAL_FEATURES, NUMERIC_FEATURES

PROJECT_TYPES = (
    "New Product Development",
    "System Migration",
    "Maintenance & Support",
    "Tiger Team / Crisis Resp",
    "Research",
    "unspecified",
)


def _ratio(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return max(0.0, min(1.5, float(value) / 100.0))
    except (TypeError, ValueError):
        return None


def build_features(metrics: dict[str, Any], uncovered: list[Any], members: list[dict[str, Any]], project_type: str | None) -> dict[str, Any]:
    count = max(1, len(members))
    requested = int(metrics.get("requested_headcount") or count)
    actual = int(metrics.get("actual_headcount") if metrics.get("actual_headcount") is not None else count)
    unknown = sum(1 for member in members if (member.get("capacity_status") or "unknown") == "unknown")
    label = project_type if project_type in PROJECT_TYPES else "unspecified"
    features = {
        "mandatory_coverage": _ratio(metrics.get("mandatory_coverage")),
        "weighted_coverage": _ratio(metrics.get("weighted_coverage")),
        "proficiency_coverage": _ratio(metrics.get("proficiency_coverage")),
        "role_coverage": _ratio(metrics.get("role_coverage")),
        "capacity_fit": _ratio(metrics.get("capacity_fit")),
        "size_ratio": round(actual / requested, 4) if requested else None,
        "department_count": int(metrics.get("department_count") or 0),
        "data_completeness": _ratio(metrics.get("data_completeness")),
        "unknown_capacity_share": round(unknown / count, 4),
        "gap_count": len(uncovered or []),
        "project_type": label,
    }
    unexpected = set(features) - set(NUMERIC_FEATURES) - set(CATEGORICAL_FEATURES)
    if unexpected:
        raise ValueError(f"Unexpected feature: {sorted(unexpected)}")
    return features


def evaluation_notes(metrics: dict[str, Any], uncovered: list[dict[str, Any]], members: list[dict[str, Any]]) -> dict[str, list[str]]:
    """Notes from the deterministic team evaluation. They are not causal claims about the model."""
    strengths: list[str] = []
    risks: list[str] = []
    missing: list[str] = []
    mandatory = metrics.get("mandatory_coverage")
    if mandatory is None:
        missing.append("Mandatory skill coverage cannot be scored because the brief has no mandatory skills.")
    elif mandatory >= 100:
        strengths.append("Every mandatory skill is covered by the current roster.")
    else:
        names = ", ".join(item.get("skill", "") for item in uncovered if item.get("priority") == "mandatory")
        risks.append("Mandatory skills are still uncovered" + (f": {names}." if names else "."))
    weighted = metrics.get("weighted_coverage")
    if weighted is not None and weighted >= 80:
        strengths.append("Weighted skill coverage is at least 80%.")
    elif weighted is not None and weighted < 50:
        risks.append("Weighted skill coverage is below 50%.")
    if metrics.get("role_coverage") == 0:
        risks.append("None of the requested roles are covered.")
    elif metrics.get("role_coverage") == 100:
        strengths.append("Every requested role is covered.")
    if metrics.get("capacity_fit") is None:
        missing.append("Availability is unknown for at least one person, so capacity fit is not confirmed.")
    elif metrics.get("capacity_fit") == 100:
        strengths.append("Recorded availability covers the allocation for everyone on the roster.")
    else:
        risks.append("Recorded availability is below the requested allocation for someone on the roster.")
    if any(member.get("capacity_status") == "conflict" for member in members):
        risks.append("At least one selected person has a known availability conflict.")
    return {"strengths": strengths, "risks": risks, "missing": missing}

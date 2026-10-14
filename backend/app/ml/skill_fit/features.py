"""Build one feature row from the skills in a brief and a roster's matches."""

from __future__ import annotations

import hashlib
from typing import Any

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

from app.ml.skill_fit.schemas import FEATURES, HASH_BINS
from app.services.team_builder_engine import skill_key

PRIORITY = {"mandatory": 1.0, "important": 0.6, "optional": 0.3}
MATCH_QUALITY = {"exact": 1.0, "normalized": 0.85, "alias": 0.7}


def skill_bin(name: str) -> int:
    digest = hashlib.sha256(skill_key(name).encode()).hexdigest()
    return int(digest[:8], 16) % HASH_BINS


def _best_match(requirement: str, members: list[dict[str, Any]]) -> dict[str, Any] | None:
    wanted = skill_key(requirement)
    found = None
    for member in members:
        for hit in member.get("matched") or []:
            if skill_key(hit.get("requirement") or hit.get("skill") or "") != wanted:
                continue
            level = hit.get("proficiency")
            if found is None or (level if level is not None else -1) > (found.get("proficiency") if found.get("proficiency") is not None else -1):
                found = hit
    return found


def build_skill_features(requirements: list[dict[str, Any]], members: list[dict[str, Any]]) -> dict[str, float | None]:
    """Return the model row. Raises ValueError when the brief has no skills."""
    skills = [item for item in requirements if str(item.get("name") or "").strip()]
    if not skills:
        raise ValueError("The skill model needs at least one skill from the brief.")
    count = len(skills)
    priorities = [str(item.get("priority") or "important").lower() for item in skills]
    required_bins = [0.0] * HASH_BINS
    covered_bins = [0.0] * HASH_BINS
    exact = alias = uncovered = verified_hits = matched = 0
    proficiency_values: list[float] = []
    mandatory = [item for item, priority in zip(skills, priorities) if priority == "mandatory"]
    mandatory_covered = 0
    for item, priority in zip(skills, priorities):
        weight = PRIORITY.get(priority, 0.6)
        bin_index = skill_bin(str(item["name"]))
        required_bins[bin_index] = max(required_bins[bin_index], weight)
        hit = _best_match(str(item["name"]), members)
        if not hit:
            uncovered += 1
            continue
        matched += 1
        kind = str(hit.get("match") or "")
        if kind == "exact":
            exact += 1
        elif kind in {"alias", "normalized"}:
            alias += 1
        quality = MATCH_QUALITY.get(kind, 0.5)
        level = hit.get("proficiency")
        if level is None:
            factor = 0.55
        else:
            factor = max(0.0, min(1.0, float(level) / 10.0))
            proficiency_values.append(factor)
        if hit.get("verified"):
            verified_hits += 1
        covered_bins[bin_index] = max(covered_bins[bin_index], quality * factor)
        if priority == "mandatory":
            mandatory_covered += 1
    features: dict[str, float | None] = {
        "skill_count": float(count),
        "mandatory_share": priorities.count("mandatory") / count,
        "important_share": priorities.count("important") / count,
        "optional_share": priorities.count("optional") / count,
        "exact_rate": exact / count,
        "alias_rate": alias / count,
        "uncovered_rate": uncovered / count,
        "mandatory_covered_rate": (mandatory_covered / len(mandatory)) if mandatory else None,
        "mean_proficiency": (sum(proficiency_values) / len(proficiency_values)) if proficiency_values else None,
        "verified_rate": (verified_hits / matched) if matched else 0.0,
    }
    for index, value in enumerate(required_bins):
        features[f"required_bin_{index}"] = value
    for index, value in enumerate(covered_bins):
        features[f"covered_bin_{index}"] = value
    unexpected = set(features) - set(FEATURES)
    if unexpected or set(FEATURES) - set(features):
        raise ValueError("Skill-model feature row does not match the schema.")
    return features


def _matrix(rows: list[dict]) -> np.ndarray:
    return np.array([
        [np.nan if row.get(name) is None else float(row[name]) for name in FEATURES]
        for row in rows
    ], dtype=float)


class SkillScale(BaseEstimator, TransformerMixin):
    """Median-impute and scale the skill-match features. Kept importable so the saved model can load."""

    def fit(self, rows, y=None):
        matrix = _matrix(rows)
        medians = np.nanmedian(matrix, axis=0)
        self.medians_ = np.where(np.isnan(medians), 0.0, medians)
        filled = np.where(np.isnan(matrix), self.medians_, matrix)
        self.mean_ = filled.mean(axis=0)
        scale = filled.std(axis=0)
        self.scale_ = np.where(scale < 1e-6, 1.0, scale)
        return self

    def transform(self, rows):
        matrix = _matrix(rows)
        filled = np.where(np.isnan(matrix), self.medians_, matrix)
        return (filled - self.mean_) / self.scale_

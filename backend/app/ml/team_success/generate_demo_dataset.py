"""Synthetic team-level examples for the demonstration model.

Labels are simulated. They are not company project outcomes.
The generating process mixes several features with noise so one input
does not determine the label.
"""

from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

from app.ml.team_success.schemas import FEATURES, TARGET

SEED = 42
ROWS = 1200
PROJECT_TYPES = (
    "New Product Development",
    "System Migration",
    "Maintenance & Support",
    "Tiger Team / Crisis Resp",
    "Research",
)


def generate_rows(seed: int = SEED, rows: int = ROWS) -> list[dict]:
    rng = np.random.default_rng(seed)
    generated: list[dict] = []
    for _ in range(rows):
        mandatory = float(np.clip(rng.beta(4.2, 1.8), 0, 1))
        weighted = float(np.clip(mandatory * rng.uniform(0.65, 1.08) - rng.uniform(0, 0.08), 0, 1))
        proficiency = float(np.clip(rng.normal(0.58, 0.2), 0, 1))
        role = float(rng.choice([0.0, 0.5, 1.0, np.nan], p=[0.16, 0.22, 0.47, 0.15]))
        capacity = float(rng.choice([0.0, 0.5, 1.0, np.nan], p=[0.12, 0.18, 0.48, 0.22]))
        size_ratio = float(np.clip(rng.normal(0.95, 0.28), 0.25, 1.7))
        departments = int(rng.integers(1, 5))
        completeness = float(np.clip(rng.beta(3.5, 1.8), 0, 1))
        unknown_share = float(np.clip(rng.beta(1.4, 3.6), 0, 1))
        gaps = int(rng.integers(0, 6))
        project = str(rng.choice(PROJECT_TYPES))
        if rng.random() < 0.07:
            proficiency = np.nan
        role_value = 0.45 if np.isnan(role) else role
        capacity_value = 0.4 if np.isnan(capacity) else capacity
        proficiency_value = 0.45 if np.isnan(proficiency) else proficiency
        project_shift = {
            "Maintenance & Support": 0.2,
            "Tiger Team / Crisis Resp": -0.25,
            "Research": -0.05,
        }.get(project, 0.0)
        latent = (
            -0.85
            + 1.7 * mandatory
            + 0.65 * weighted
            + 0.4 * proficiency_value
            + 0.5 * role_value
            + 0.7 * capacity_value
            - 0.9 * abs(size_ratio - 1.0)
            - 0.22 * gaps
            - 0.35 * unknown_share
            + 0.05 * min(departments, 3)
            + project_shift
            + float(rng.normal(0, 0.95))
        )
        probability = 1.0 / (1.0 + np.exp(-latent))
        generated.append({
            "mandatory_coverage": _num(mandatory),
            "weighted_coverage": _num(weighted),
            "proficiency_coverage": _num(proficiency),
            "role_coverage": _num(role),
            "capacity_fit": _num(capacity),
            "size_ratio": round(size_ratio, 4),
            "department_count": departments,
            "data_completeness": _num(completeness),
            "unknown_capacity_share": round(unknown_share, 4),
            "gap_count": gaps,
            "project_type": project,
            TARGET: int(rng.random() < probability),
        })
    positives = sum(row[TARGET] for row in generated)
    if positives < rows * 0.2 or positives > rows * 0.8:
        raise RuntimeError(f"Synthetic labels are too imbalanced: {positives}/{rows}")
    return generated


def _num(value: float) -> float | None:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    return round(float(value), 4)


def write_csv(path: Path, rows: list[dict] | None = None) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = rows if rows is not None else generate_rows()
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=[*FEATURES, TARGET])
        writer.writeheader()
        writer.writerows(payload)
    return path


if __name__ == "__main__":
    destination = Path(__file__).resolve().parent / "artifacts" / "synthetic_teams.csv"
    write_csv(destination)
    print(destination)

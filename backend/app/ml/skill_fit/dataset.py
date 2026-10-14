"""Simulated briefs used only to train the demonstration skill-match model."""

from __future__ import annotations

import hashlib

import numpy as np

from app.ml.skill_fit.features import build_skill_features
from app.ml.skill_fit.schemas import TARGET
from app.services.team_builder_engine import skill_key

SEED = 42
ROWS = 1800
SKILL_POOL = (
    "AI Ethics & Governance", "Android Studio", "ANOVA", "AWS Architecture", "Azure Services",
    "C", "C++", "CI/CD", "Cloud Security", "Collaboration", "Communication", "Cross-Validation",
    "DAX", "Decision Trees", "Dimensional Modelling", "Excel", "Figma", "GraphQL", "JavaScript",
    "Kubernetes", "Node.js", "PostgreSQL", "Python", "React", "SQL", "TypeScript", "Terraform",
    "Scrum", "Agile", "AWS",
)


def _unit(name: str) -> float:
    digest = hashlib.sha256(f"difficulty:{skill_key(name)}".encode()).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def difficulty(name: str) -> float:
    return 0.35 + 0.65 * _unit(name)


def generate_rows(seed: int = SEED, rows: int = ROWS) -> list[dict]:
    rng = np.random.default_rng(seed)
    dataset = []
    for _ in range(rows):
        chosen = list(rng.choice(SKILL_POOL, size=int(rng.integers(2, 7)), replace=False))
        requirements = []
        members_matched = []
        weighted = 0.0
        total_weight = 0.0
        for name in chosen:
            priority = str(rng.choice(["mandatory", "important", "optional"], p=[0.4, 0.4, 0.2]))
            requirements.append({"name": name, "priority": priority})
            weight = {"mandatory": 1.0, "important": 0.6, "optional": 0.3}[priority]
            total_weight += weight
            roll = float(rng.random())
            if roll < 0.28:
                continue
            kind = "exact" if roll < 0.72 else ("alias" if roll < 0.88 else "normalized")
            proficiency = None if rng.random() < 0.15 else int(rng.integers(3, 11))
            members_matched.append({
                "requirement": name,
                "skill": name,
                "match": kind,
                "proficiency": proficiency,
                "verified": bool(rng.random() < 0.5),
                "priority": priority,
            })
            quality = {"exact": 1.0, "normalized": 0.85, "alias": 0.7}[kind]
            factor = 0.55 if proficiency is None else proficiency / 10
            weighted += weight * quality * factor * (1.05 - 0.55 * difficulty(name))
        features = build_skill_features(requirements, [{"matched": members_matched}])
        score = float(np.clip(100 * weighted / total_weight + rng.normal(0, 3.5), 0, 100))
        dataset.append({**features, TARGET: round(score, 4)})
    return dataset

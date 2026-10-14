"""Train the skill-match demonstration model.

Model choice uses validation mean absolute error only. Test error is recorded
afterwards and is not used to pick the model.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from app.ml.skill_fit.dataset import SEED, generate_rows
from app.ml.skill_fit.features import SkillScale
from app.ml.skill_fit.schemas import FEATURE_SCHEMA, FEATURES, LIMITATIONS, TARGET

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "skill_fit_model.joblib"
METADATA_PATH = ARTIFACT_DIR / "skill_fit_model.json"


def _pipeline(kind: str) -> Pipeline:
    model = Ridge(alpha=1.0) if kind == "ridge" else RandomForestRegressor(
        n_estimators=160, min_samples_leaf=4, random_state=SEED,
    )
    return Pipeline([("scale", SkillScale()), ("model", model)])


def _scores(model: Pipeline, rows: list[dict], labels: np.ndarray) -> dict:
    predicted = np.clip(model.predict(rows), 0, 100)
    return {
        "mae": round(float(mean_absolute_error(labels, predicted)), 4),
        "r2": round(float(r2_score(labels, predicted)), 4),
    }


def train(seed: int = SEED) -> dict:
    rows = generate_rows(seed=seed)
    labels = np.array([float(row[TARGET]) for row in rows])
    index = np.arange(len(rows))
    rest_i, test_i = train_test_split(index, test_size=0.2, random_state=seed)
    train_i, val_i = train_test_split(rest_i, test_size=0.25, random_state=seed)
    train_x = [rows[item] for item in train_i]
    val_x = [rows[item] for item in val_i]
    test_x = [rows[item] for item in test_i]
    train_y, val_y, test_y = labels[train_i], labels[val_i], labels[test_i]
    candidates = {}
    for kind in ("ridge", "random_forest"):
        model = _pipeline(kind)
        model.fit(train_x, train_y)
        candidates[kind] = {"model": model, "validation": _scores(model, val_x, val_y)}
    chosen = min(candidates, key=lambda kind: candidates[kind]["validation"]["mae"])
    winner = candidates[chosen]["model"]
    version = f"synthetic-{FEATURE_SCHEMA}-{seed}"
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": winner, "features": list(FEATURES), "version": version}, MODEL_PATH)
    metadata = {
        "version": version,
        "model_type": chosen,
        "training_data_type": "synthetic",
        "feature_schema": FEATURE_SCHEMA,
        "features": list(FEATURES),
        "trained_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "rows": len(rows),
        "split": "60/20/20 train/validation/test. Validation mean absolute error selected the model. The test split was not used for selection.",
        "validation": {kind: candidates[kind]["validation"] for kind in candidates},
        "selected_because": f"Lowest validation mean absolute error ({candidates[chosen]['validation']['mae']}).",
        "test_metrics_not_used_for_selection": _scores(winner, test_x, test_y),
        "baseline_validation_mae": round(float(mean_absolute_error(val_y, np.full(len(val_y), train_y.mean()))), 4),
        "limitations": LIMITATIONS,
        "production_validated": False,
        "target": "Predicted skill-match score from 0 to 100 for the skills named in the brief.",
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    return metadata


if __name__ == "__main__":
    print(json.dumps({key: train()[key] for key in ("version", "model_type", "validation", "test_metrics_not_used_for_selection")}, indent=2))

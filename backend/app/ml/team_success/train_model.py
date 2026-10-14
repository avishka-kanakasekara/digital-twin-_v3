"""Train the demonstration model.

Model choice uses validation Brier score only. Test metrics are recorded
afterwards and are not used to pick or calibrate the model.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from app.ml.team_success.generate_demo_dataset import SEED, generate_rows, write_csv
from app.ml.team_success.schemas import FEATURE_SCHEMA, FEATURES, LIMITATIONS, NUMERIC_FEATURES, TARGET

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "synthetic_model.joblib"
METADATA_PATH = ARTIFACT_DIR / "synthetic_model.json"


class _Encode(BaseEstimator, TransformerMixin):
    """Median-impute and scale numeric team features. Unknown project types become zeros."""

    def fit(self, rows, y=None):
        matrix = _numeric(rows)
        medians = np.nanmedian(matrix, axis=0)
        self.medians_ = np.where(np.isnan(medians), 0.0, medians)
        filled = np.where(np.isnan(matrix), self.medians_, matrix)
        self.mean_ = filled.mean(axis=0)
        scale = filled.std(axis=0)
        self.scale_ = np.where(scale < 1e-6, 1.0, scale)
        self.types_ = sorted({str(row.get("project_type") or "unspecified") for row in rows})
        return self

    def transform(self, rows):
        matrix = _numeric(rows)
        filled = np.where(np.isnan(matrix), self.medians_, matrix)
        scaled = (filled - self.mean_) / self.scale_
        cats = np.zeros((len(rows), len(self.types_)))
        for index, row in enumerate(rows):
            label = str(row.get("project_type") or "unspecified")
            if label in self.types_:
                cats[index, self.types_.index(label)] = 1.0
        return np.hstack([scaled, cats])


def _numeric(rows: list[dict]) -> np.ndarray:
    matrix = []
    for row in rows:
        matrix.append([np.nan if row.get(name) is None else float(row[name]) for name in NUMERIC_FEATURES])
    return np.array(matrix, dtype=float)


def _pipeline(kind: str) -> Pipeline:
    if kind == "logistic":
        model = LogisticRegression(max_iter=400, random_state=SEED)
    else:
        model = RandomForestClassifier(n_estimators=120, min_samples_leaf=8, random_state=SEED)
    return Pipeline([("encode", _Encode()), ("model", model)])


def _scores(model: Pipeline, features: np.ndarray, labels: np.ndarray) -> dict:
    probabilities = model.predict_proba(features)[:, 1]
    predicted = (probabilities >= 0.5).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(labels, probabilities)), 4),
        "brier": round(float(brier_score_loss(labels, probabilities)), 4),
        "precision": round(float(precision_score(labels, predicted, zero_division=0)), 4),
        "recall": round(float(recall_score(labels, predicted, zero_division=0)), 4),
    }


def train(seed: int = SEED) -> dict:
    rows = generate_rows(seed=seed)
    write_csv(ARTIFACT_DIR / "synthetic_teams.csv", rows)
    labels = np.array([int(row[TARGET]) for row in rows])
    index = np.arange(len(rows))
    rest_i, test_i = train_test_split(index, test_size=0.2, random_state=seed, stratify=labels)
    train_i, val_i = train_test_split(rest_i, test_size=0.25, random_state=seed, stratify=labels[rest_i])
    train_x = [rows[item] for item in train_i]
    val_x = [rows[item] for item in val_i]
    test_x = [rows[item] for item in test_i]
    train_y, val_y, test_y = labels[train_i], labels[val_i], labels[test_i]
    candidates = {}
    for kind in ("logistic", "random_forest"):
        model = _pipeline(kind)
        model.fit(train_x, train_y)
        candidates[kind] = {"model": model, "validation": _scores(model, val_x, val_y)}
    chosen = min(candidates, key=lambda kind: candidates[kind]["validation"]["brier"])
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
        "class_balance": {
            "positive": int(labels.sum()),
            "negative": int(len(labels) - labels.sum()),
        },
        "split": "60/20/20 stratified train/validation/test. Validation Brier selected the model. The test split was not used for selection or calibration.",
        "validation": {kind: candidates[kind]["validation"] for kind in candidates},
        "selected_because": f"Lowest validation Brier score ({candidates[chosen]['validation']['brier']}).",
        "test_metrics_not_used_for_selection": _scores(winner, test_x, test_y),
        "baseline_validation_brier": round(float(brier_score_loss(val_y, np.full(len(val_y), train_y.mean()))), 4),
        "limitations": LIMITATIONS,
        "status": "active_demo",
        "production_validated": False,
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    return metadata


if __name__ == "__main__":
    print(json.dumps({key: train()[key] for key in ("version", "model_type", "selected_because", "test_metrics_not_used_for_selection")}, indent=2))

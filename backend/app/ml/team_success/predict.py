"""Inference for one team-level feature row."""

from __future__ import annotations

import numpy as np

from app.ml.team_success.model_registry import load_active
from app.ml.team_success.schemas import FEATURES, SYNTHETIC_WARNING


def predict_success(features: dict) -> dict:
    loaded = load_active()
    if loaded is None:
        return {
            "status": "unavailable",
            "probability": None,
            "display_label": "Prediction unavailable",
            "model_version": None,
            "model_type": None,
            "training_data_type": None,
            "warning": "The trained model artifact could not be loaded. Generate and train the demonstration model, then try the evaluation again.",
            "production_validated": False,
        }
    bundle, metadata = loaded
    for name in FEATURES:
        if name not in features:
            return {
                "status": "unavailable",
                "probability": None,
                "display_label": "Prediction unavailable",
                "model_version": metadata.get("version"),
                "model_type": metadata.get("model_type"),
                "training_data_type": metadata.get("training_data_type"),
                "warning": f"The feature {name} is missing, so the model was not run.",
                "production_validated": False,
            }
    try:
        probability = float(bundle["pipeline"].predict_proba([features])[0, 1])
    except Exception:
        return {
            "status": "unavailable",
            "probability": None,
            "display_label": "Prediction unavailable",
            "model_version": metadata.get("version"),
            "model_type": metadata.get("model_type"),
            "training_data_type": metadata.get("training_data_type"),
            "warning": "The model failed while scoring this team. No substitute score was used.",
            "production_validated": False,
        }
    if not 0.0 <= probability <= 1.0 or probability != probability:
        return {
            "status": "unavailable",
            "probability": None,
            "display_label": "Prediction unavailable",
            "model_version": metadata.get("version"),
            "model_type": metadata.get("model_type"),
            "training_data_type": metadata.get("training_data_type"),
            "warning": "The model returned a probability outside 0 to 1.",
            "production_validated": False,
        }
    synthetic = metadata.get("training_data_type") != "historical"
    percent = round(probability * 100)
    return {
        "status": "ok",
        "probability": round(probability, 4),
        "display_label": f"{percent}% demo estimate" if synthetic else f"{percent}% estimated",
        "model_version": metadata.get("version"),
        "model_type": metadata.get("model_type"),
        "training_data_type": metadata.get("training_data_type") or "synthetic",
        "feature_schema": metadata.get("feature_schema"),
        "warning": SYNTHETIC_WARNING if synthetic else "This estimate uses a historical model that an authorised user promoted. It is still a decision-support estimate, not a guarantee.",
        "production_validated": bool(metadata.get("production_validated")),
    }

"""Score one roster against the skills named in the brief."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib

from app.ml.skill_fit.features import build_skill_features
from app.ml.skill_fit.schemas import FEATURES, SYNTHETIC_WARNING
from app.ml.skill_fit.train import METADATA_PATH, MODEL_PATH

MEANING = "Model estimate of how well this roster matches the skills in the brief."


@lru_cache(maxsize=1)
def load_model() -> tuple[dict, dict] | None:
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        return None
    try:
        bundle = joblib.load(MODEL_PATH)
        metadata = json.loads(METADATA_PATH.read_text())
    except Exception:
        return None
    if not isinstance(bundle, dict) or "pipeline" not in bundle:
        return None
    if list(bundle.get("features") or []) != list(FEATURES):
        return None
    resolved = MODEL_PATH.resolve()
    if Path(__file__).resolve().parent not in resolved.parents:
        return None
    return bundle, metadata


def clear_cache() -> None:
    load_model.cache_clear()


def _unavailable(warning: str, metadata: dict | None = None) -> dict[str, Any]:
    metadata = metadata or {}
    return {
        "status": "unavailable",
        "score": None,
        "label": "Skill model",
        "meaning": MEANING,
        "warning": warning,
        "skills_used": [],
        "model_version": metadata.get("version"),
        "model_type": metadata.get("model_type"),
        "training_data_type": metadata.get("training_data_type"),
        "production_validated": False,
    }


def score_roster(requirements: list[dict[str, Any]], members: list[dict[str, Any]]) -> dict[str, Any]:
    names = [str(item.get("name")).strip() for item in requirements if str(item.get("name") or "").strip()]
    if not names:
        return _unavailable("Add skills from the catalogue, or mention a catalogue skill in the notes. The skill model was not run.")
    loaded = load_model()
    if loaded is None:
        result = _unavailable("The skill model artifact could not be loaded. No substitute score was used.")
        result["skills_used"] = names
        return result
    bundle, metadata = loaded
    try:
        features = build_skill_features(requirements, members)
        for name in FEATURES:
            if name not in features:
                raise KeyError(name)
        raw = float(bundle["pipeline"].predict([features])[0])
    except Exception:
        result = _unavailable("The skill model failed while scoring this roster. No substitute score was used.", metadata)
        result["skills_used"] = names
        return result
    if raw != raw:
        result = _unavailable("The skill model returned a score that is not a number.", metadata)
        result["skills_used"] = names
        return result
    score = int(round(min(100.0, max(0.0, raw))))
    return {
        "status": "ok",
        "score": score,
        "label": "Skill model",
        "meaning": MEANING,
        "warning": SYNTHETIC_WARNING,
        "skills_used": names,
        "model_version": metadata.get("version"),
        "model_type": metadata.get("model_type"),
        "training_data_type": metadata.get("training_data_type") or "synthetic",
        "feature_schema": metadata.get("feature_schema"),
        "production_validated": False,
    }

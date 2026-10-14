"""Load the versioned demonstration artifact. Client paths are never accepted."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import joblib

from app.ml.team_success.train_model import METADATA_PATH, MODEL_PATH

_PACKAGE_DIR = Path(__file__).resolve().parent


def artifact_paths() -> tuple[Path, Path]:
    pointer = _PACKAGE_DIR / "artifacts" / "active.json"
    if pointer.exists():
        data = json.loads(pointer.read_text())
        if data.get("training_data_type") == "historical" and data.get("promoted") is True:
            model = (_PACKAGE_DIR / "artifacts" / data["model_file"]).resolve()
            meta = (_PACKAGE_DIR / "artifacts" / data["metadata_file"]).resolve()
            if _PACKAGE_DIR in model.parents and model.exists() and meta.exists():
                return model, meta
    return MODEL_PATH, METADATA_PATH


@lru_cache(maxsize=2)
def load_active() -> tuple[dict, dict] | None:
    model_path, meta_path = artifact_paths()
    if not model_path.exists() or not meta_path.exists():
        return None
    try:
        bundle = joblib.load(model_path)
        metadata = json.loads(meta_path.read_text())
    except Exception:
        return None
    if not isinstance(bundle, dict) or "pipeline" not in bundle:
        return None
    return bundle, metadata


def clear_cache() -> None:
    load_active.cache_clear()

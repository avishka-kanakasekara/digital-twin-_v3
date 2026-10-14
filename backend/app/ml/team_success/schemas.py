"""Shared constants for the team-success demonstration model."""

FEATURE_SCHEMA = "team-success-v1"
NUMERIC_FEATURES = (
    "mandatory_coverage",
    "weighted_coverage",
    "proficiency_coverage",
    "role_coverage",
    "capacity_fit",
    "size_ratio",
    "department_count",
    "data_completeness",
    "unknown_capacity_share",
    "gap_count",
)
CATEGORICAL_FEATURES = ("project_type",)
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET = "success"
SYNTHETIC_WARNING = (
    "Demo / Synthetic-Data Model. This estimate is experimental. "
    "It was trained on simulated project outcomes, not this organisation's completed projects, "
    "and it is not a validated probability that the project will succeed."
)
LIMITATIONS = (
    "The active demonstration model was fit on a synthetic dataset with a fixed seed. "
    "Holdout scores describe that simulation only. They are not evidence that the model "
    "is calibrated for a real company. A historical model can be trained only from verified "
    "project outcomes and stays inactive until an authorised user promotes it."
)

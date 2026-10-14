"""Feature contract for the skill-match demonstration model.

The model sees the skills named in the brief and how the roster matches them.
Employee names and identifiers are not features.
"""

HASH_BINS = 24
FEATURE_SCHEMA = "skill-fit-v1"
AGGREGATE_FEATURES = (
    "skill_count",
    "mandatory_share",
    "important_share",
    "optional_share",
    "exact_rate",
    "alias_rate",
    "uncovered_rate",
    "mandatory_covered_rate",
    "mean_proficiency",
    "verified_rate",
)
REQUIRED_BIN_FEATURES = tuple(f"required_bin_{index}" for index in range(HASH_BINS))
COVERED_BIN_FEATURES = tuple(f"covered_bin_{index}" for index in range(HASH_BINS))
FEATURES = AGGREGATE_FEATURES + REQUIRED_BIN_FEATURES + COVERED_BIN_FEATURES
TARGET = "skill_fit"
SYNTHETIC_WARNING = (
    "Demo / Synthetic-Data Model. This score was trained on simulated matches between "
    "requested skills and rosters, not on this organisation's completed projects. "
    "It estimates how well the roster covers the skills in the brief. "
    "It is not a probability that the project will succeed."
)
LIMITATIONS = (
    "The skill-match model was fit on a synthetic dataset with a fixed seed. "
    "Holdout error describes that simulation only. It is not evidence that the score "
    "is calibrated for a real company. Skill names are represented by stable hash bins, "
    "so two different skills can share a bin."
)

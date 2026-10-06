# Learning Recommendation

Course completion does not change official skill proficiency.

Official proficiency changes only when an assessment is passed and `sfa_sync_status` is `Synced`.

## Priority

Weights live in `PRIORITY_WEIGHTS` in `backend/app/services/learning_recommendation.py`:

```text
priority = 0.50 * gap_score + 0.30 * strategic + 0.20 * mandatory
```

`gap_score = (required - current) / required`, clamped to 0–1. A closed gap scores 0 and does not open a plan.

## Matching and sequence

Only Active courses whose skill mapping includes the gap skill are eligible. A course with no skill mapping cannot be stored. Retired and draft courses are not recommended. Courses are ordered by the level they deliver, then by difficulty, so a foundation course precedes an advanced one.

## Plans

A plan requires `source_gap_reference` from a career skill gap or a role-readiness target on the skill row. Catalogue browsing does not create a plan. Hours are the sum of selected course durations. Weeks use 14 hours per week.

## Assessment gate

Completing a course sets the item to Completed and leaves the skill row unchanged. A failed assessment cannot sync. A passed assessment stays Pending until sync. A failed sync leaves proficiency unchanged. A successful sync writes the skill, stores `proficiency_after`, and records Full Closure or Partial Closure against the original gap reference.

## Compliance

Mandatory compliance and strategic coverage count an item only when it is Completed and a related assessment is passed and Synced. If nothing is assigned, the ratio is null and the state is `No items assigned`. A manager overview uses only the people who report to that manager. The employer overview uses the whole catalogue of plans.

A gap is marked strategic or mandatory when a matching Active course carries that flag. There is no separate strategic-skill register in this repository.

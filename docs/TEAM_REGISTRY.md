# Team registry and success estimate

Employees and HR use the same team records. Microsoft Fabric is the store when the API is pointed at Fabric. Tests use the SQLite stand-in.

## What was already true

`projects.success_score` is a personal project-history field. It is not a verified outcome label, and a project's current status is not treated as success or failure. There are not enough verified outcomes to train on company history, so the active model is a synthetic demonstration.

## Registration

Creating a team saves a draft. The creator is a confirmed owner. Colleagues become members only after they accept an invitation, or after HR or their manager assigns them directly. That assignment is audited.

Submitting a draft moves it to `pending_approval`. The creator cannot approve or assign it. Another signed-in person can decide while access checks are off. When `AUTH_ENFORCE` is on, only HR, an employer, an admin, or the creator's manager can decide, and still not the creator.

A rejected team is not assigned. Assigning a registered team writes active `team_builder_assignments` rows and is safe to repeat.

## API

- `GET /api/organization/talent/teams/workspace`
- `POST /api/organization/talent/teams`
- `POST /api/organization/talent/teams/{id}/invitations`
- `POST /api/organization/talent/invitations/{id}/accept` and `/decline`
- `POST /api/organization/talent/teams/{id}/submit`
- `POST /api/organization/talent/teams/{id}/approve` and `/reject`
- `POST /api/organization/talent/teams/{id}/assign`
- `POST /api/organization/talent/teams/{id}/evaluate`
- `GET /api/organization/talent/teams/{id}/predictions`
- `POST /api/organization/talent/team-builder/optimize` now also stores a prediction for each option
- `POST /api/organization/talent/team-builder/options/{id}/join` asks to join a recommended team. The asker is not made the owner and is not added until someone else accepts.
- `GET /api/organization/talent/team-builder/join-requests`
- `POST /api/organization/talent/join-requests/{id}/accept`, `/decline`, and `/cancel`
- `POST /api/organization/talent/team-builder/options/{id}/save-team` remains available to the API. The recommend cards use Ask to join instead.
- `GET /api/organization/talent/team-builder/model-status`
- `POST /api/organization/talent/team-builder/outcomes`

`fabric/database/014_team_registry.sql` and `fabric/database/015_join_requests.sql` match the tables the API creates on startup. Apply them on another Fabric database if that database does not start this API. They do not delete rows.

## Skill model on a recommendation

Generate teams keeps the calculated options and also lists up to four existing teams when a confirmed member already covers a skill or role in that brief. An archived team is left out, and a saved roster that is identical to a calculated option is not repeated. Ask to join on an existing team files a request against that team.

The number on each recommended team is the skill-match model, not the weighted coverage formula. It is built from the skills selected in the catalogue and any catalogue skill mentioned in the notes, together with how the roster matches each skill (exact, alias, proficiency, verified). Skill names are stored as stable hash bins. Employee names and identifiers are not inputs. The model is trained on simulated skill matches and is labelled as a demonstration. If it cannot run, the card shows no number and does not fall back to the weighted coverage score. The comparison table still shows the coverage components.

Train it from `backend`:

```bash
./venv/bin/python -m app.ml.skill_fit.train
```

## Model

Train from `backend`:

```bash
./venv/bin/python -m app.ml.team_success.train_model
```

The script builds 1,200 synthetic team rows with seed 42, splits them 60/20/20, and keeps the model with the lower validation Brier score. The test split is not used to choose or calibrate the model. The artifact is `backend/app/ml/team_success/artifacts/synthetic_model.joblib`.

Features are team-level coverage, capacity, size, gaps, data completeness, and project type. Employee names and identifiers are not features.

The interface shows the result as a demo estimate and states that it was not validated on this organisation's projects. If the artifact cannot be loaded, the API returns `Prediction unavailable` and does not substitute a percentage.

A changed confirmed roster marks the previous estimate stale. Verified outcomes can be recorded for later training. Retraining from history stays unavailable until 30 verified outcomes each have a prediction snapshot taken before the outcome was recorded. Synthetic and historical labels are not mixed, and a synthetic model is not marked production-validated.

## Tests

```bash
cd backend && ./venv/bin/python -m pytest tests/test_team_builder.py tests/test_team_registry.py -q
```

"""Explainable team formation.

Recommendation score (0–100) is a weighted coverage score, not a probability
that the project will succeed.

Default weights, renormalized over the components that can be calculated:

- Mandatory skill coverage: 40
- Weighted skill coverage: 25
- Proficiency coverage: 15 (omitted when no recorded proficiency exists)
- Role coverage: 10 (omitted when the brief has no required roles)
- Capacity fit: 10 (omitted when any selected person's availability is unknown)

Skill weights inside weighted coverage: mandatory 3, important 2, optional 1.
A skill matches by exact name, by normalized spelling (case and surrounding
space), or by an alias that was stored for the organisation. Similar names
are not matched on their own.

Proficiency is read on a 0–10 scale. Stored values above 10 are treated as a
0–100 scale and divided by 10. A missing proficiency is left unknown. It does
not count as zero and it does not block skill coverage.

Known capacity below the requested allocation is a hard conflict. Missing
capacity is unknown, not confirmed availability.
"""

from __future__ import annotations

import re
from typing import Any

ALGORITHM_VERSION = "team-builder-v2"
PRIORITY_WEIGHT = {"mandatory": 3, "important": 2, "optional": 1}
SCORE_WEIGHTS = {
    "mandatory_coverage": 40,
    "weighted_coverage": 25,
    "proficiency_coverage": 15,
    "role_coverage": 10,
    "capacity_fit": 10,
}

_SPACE = re.compile(r"\s+")


def skill_key(name: str) -> str:
    return _SPACE.sub(" ", (name or "").strip().lower())


def canonical_key(name: str, aliases: dict[str, str]) -> str:
    key = skill_key(name)
    return aliases.get(key, key)


def proficiency_on_ten(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number > 10:
        number = number / 10
    return max(0, min(10, int(round(number))))


def match_skill(requirement: str, employee_skills: list[dict[str, Any]], aliases: dict[str, str]) -> dict[str, Any] | None:
    target = canonical_key(requirement, aliases)
    exact_key = skill_key(requirement)
    found: dict[str, Any] | None = None
    for skill in employee_skills:
        name = str(skill.get("name") or "")
        if not name:
            continue
        kind = None
        if skill_key(name) == exact_key:
            kind = "exact" if name.strip() == requirement.strip() else "normalized"
        elif canonical_key(name, aliases) == target:
            kind = "alias"
        if not kind:
            continue
        level = proficiency_on_ten(skill.get("proficiency"))
        candidate = {
            "requirement": requirement,
            "skill": name,
            "match": kind,
            "proficiency": level,
            "verified": bool(skill.get("verified")),
        }
        if found is None or (candidate["proficiency"] or -1) > (found["proficiency"] or -1):
            found = candidate
    return found


def _requirement_score(employee: dict[str, Any], requirements: list[dict[str, Any]], aliases: dict[str, str]) -> tuple[int, list[dict[str, Any]]]:
    score = 0
    matched: list[dict[str, Any]] = []
    for req in requirements:
        hit = match_skill(req["name"], employee.get("skills") or [], aliases)
        if not hit:
            continue
        score += PRIORITY_WEIGHT[req["priority"]] * 10
        if hit["proficiency"] is not None:
            score += hit["proficiency"]
        matched.append({**hit, "priority": req["priority"]})
    return score, matched


def _covers_role(employee: dict[str, Any], role: str, aliases: dict[str, str]) -> str | None:
    title = skill_key(employee.get("role") or "")
    wanted = skill_key(role)
    if wanted and wanted in title:
        return "job title"
    if match_skill(role, employee.get("skills") or [], aliases):
        return "recorded skill"
    return None


def _sort_key(employee: dict[str, Any]) -> tuple:
    return (-int(employee["requirement_score"]), str(employee.get("full_name") or "").lower(), str(employee["id"]))


def _annotate(employees: list[dict[str, Any]], requirements: list[dict[str, Any]], aliases: dict[str, str]) -> list[dict[str, Any]]:
    annotated = []
    for employee in employees:
        score, matched = _requirement_score(employee, requirements, aliases)
        annotated.append({**employee, "requirement_score": score, "matched": matched})
    return annotated


def _repair_mandatory(team: list[dict[str, Any]], pool: list[dict[str, Any]], requirements: list[dict[str, Any]], aliases: dict[str, str]) -> list[dict[str, Any]]:
    mandatory = [req["name"] for req in requirements if req["priority"] == "mandatory"]
    if not mandatory or not team:
        return team
    selected = list(team)

    def covered(people: list[dict[str, Any]]) -> set[str]:
        names = set()
        for person in people:
            for hit in person["matched"]:
                if hit["priority"] == "mandatory":
                    names.add(skill_key(hit["requirement"]))
        return names

    for name in mandatory:
        if skill_key(name) in covered(selected):
            continue
        outsiders = [person for person in pool if person["id"] not in {row["id"] for row in selected} and skill_key(name) in {skill_key(hit["requirement"]) for hit in person["matched"] if hit["priority"] == "mandatory"}]
        outsiders.sort(key=_sort_key)
        if not outsiders:
            continue
        incoming = outsiders[0]

        def loss_if_removed(person: dict[str, Any]) -> tuple:
            remaining = [row for row in selected if row["id"] != person["id"]]
            lost = len(covered(selected) - covered(remaining) - {skill_key(name)})
            return (lost, -person["requirement_score"], str(person.get("full_name") or "").lower(), str(person["id"]))

        outgoing = sorted(selected, key=loss_if_removed)[0]
        if loss_if_removed(outgoing)[0] > 0 and skill_key(name) in {skill_key(hit["requirement"]) for hit in outgoing["matched"] if hit["priority"] == "mandatory"}:
            continue
        selected = [incoming if row["id"] == outgoing["id"] else row for row in selected]
    return selected


def _pick_skill_focus(pool: list[dict[str, Any]], take: int, requirements: list[dict[str, Any]], aliases: dict[str, str]) -> list[dict[str, Any]]:
    ordered = sorted(pool, key=_sort_key)
    return _repair_mandatory(ordered[:take], pool, requirements, aliases)


def _pick_balanced(pool: list[dict[str, Any]], take: int, requirements: list[dict[str, Any]], aliases: dict[str, str]) -> list[dict[str, Any]]:
    remaining = list(pool)
    selected: list[dict[str, Any]] = []
    while len(selected) < take and remaining:
        counts: dict[str, int] = {}
        for person in selected:
            dept = str(person.get("department") or "Unassigned")
            counts[dept] = counts.get(dept, 0) + 1
        departments = sorted({str(person.get("department") or "Unassigned") for person in remaining})
        departments.sort(key=lambda dept: (counts.get(dept, 0), dept.lower()))
        chosen = None
        for dept in departments:
            group = [person for person in remaining if str(person.get("department") or "Unassigned") == dept]
            if group:
                chosen = sorted(group, key=_sort_key)[0]
                break
        if chosen is None:
            break
        selected.append(chosen)
        remaining = [person for person in remaining if person["id"] != chosen["id"]]
    return _repair_mandatory(selected, pool, requirements, aliases)


def _team_metrics(
    team: list[dict[str, Any]],
    requirements: list[dict[str, Any]],
    roles: list[str],
    aliases: dict[str, str],
    requested: int,
) -> dict[str, Any]:
    mandatory = [req for req in requirements if req["priority"] == "mandatory"]
    covered_mandatory = []
    missing_mandatory = []
    for req in mandatory:
        hit = next((person for person in team if any(skill_key(item["requirement"]) == skill_key(req["name"]) for item in person["matched"])), None)
        (covered_mandatory if hit else missing_mandatory).append(req["name"])
    mandatory_coverage = round(100 * len(covered_mandatory) / len(mandatory)) if mandatory else None

    total_weight = sum(PRIORITY_WEIGHT[req["priority"]] for req in requirements) or 0
    satisfied = 0
    uncovered = []
    for req in requirements:
        if any(skill_key(item["requirement"]) == skill_key(req["name"]) for person in team for item in person["matched"]):
            satisfied += PRIORITY_WEIGHT[req["priority"]]
        else:
            uncovered.append({"skill": req["name"], "priority": req["priority"]})
    weighted_coverage = round(100 * satisfied / total_weight) if total_weight else None

    proficiency_hits = [item["proficiency"] for person in team for item in person["matched"] if item["proficiency"] is not None]
    proficiency_coverage = round(100 * (sum(proficiency_hits) / len(proficiency_hits)) / 10) if proficiency_hits else None

    role_rows = []
    assigned_people: set[str] = set()
    for role in roles:
        cover = None
        for person in sorted(team, key=_sort_key):
            if person["id"] in assigned_people:
                continue
            how = _covers_role(person, role, aliases)
            if how:
                cover = {"role": role, "employee_id": person["id"], "employee_name": person.get("full_name"), "how": how}
                assigned_people.add(person["id"])
                break
        role_rows.append(cover or {"role": role, "employee_id": None, "how": None})
    filled = sum(1 for row in role_rows if row.get("employee_id"))
    role_coverage = round(100 * filled / len(roles)) if roles else None

    known = [person for person in team if person.get("capacity_status") != "unknown"]
    sufficient = [person for person in team if person.get("capacity_status") == "sufficient"]
    capacity_fit = round(100 * len(sufficient) / len(team)) if team and len(known) == len(team) else None

    departments = sorted({str(person.get("department") or "Unassigned") for person in team})
    expected_fields = max(1, len(team) * 3)
    present = 0
    for person in team:
        present += 1 if person.get("skills") else 0
        present += 1 if any(item["proficiency"] is not None for item in person["matched"]) or not person["matched"] else 0
        present += 1 if person.get("capacity_status") != "unknown" else 0
    data_completeness = round(100 * present / expected_fields) if team else 0

    metrics = {
        "mandatory_coverage": mandatory_coverage,
        "mandatory_met": not missing_mandatory,
        "weighted_coverage": weighted_coverage,
        "proficiency_coverage": proficiency_coverage,
        "role_coverage": role_coverage,
        "capacity_fit": capacity_fit,
        "departments": departments,
        "department_count": len(departments),
        "data_completeness": data_completeness,
        "requested_headcount": requested,
        "actual_headcount": len(team),
        "weights": SCORE_WEIGHTS,
        "skill_weights": PRIORITY_WEIGHT,
    }
    parts = [(SCORE_WEIGHTS[key], metrics[key]) for key in SCORE_WEIGHTS if metrics.get(key) is not None]
    metrics["recommendation_score"] = round(sum(weight * value for weight, value in parts) / sum(weight for weight, _ in parts)) if parts else None
    metrics["score_meaning"] = "Weighted coverage of the brief. This is not a probability that the project will succeed."
    return {
        "metrics": metrics,
        "uncovered": uncovered,
        "missing_mandatory": missing_mandatory,
        "roles": role_rows,
    }


def _feasibility(team: list[dict[str, Any]], detail: dict[str, Any], requested: int, pool_size: int) -> tuple[str, list[str]]:
    warnings: list[str] = []
    if not team:
        return "empty", ["No eligible employee could be placed on this team."]
    if len(team) < requested:
        warnings.append(f"Requested {requested} people. {pool_size} eligible people are available, so this team has {len(team)}.")
        return "short_staffed", warnings
    if detail["missing_mandatory"]:
        warnings.append("Mandatory skills still uncovered: " + ", ".join(detail["missing_mandatory"]))
        return "gaps", warnings
    if any(row.get("employee_id") is None for row in detail["roles"]):
        missing = [row["role"] for row in detail["roles"] if not row.get("employee_id")]
        warnings.append("Required roles still uncovered: " + ", ".join(missing))
        return "gaps", warnings
    if any(person.get("capacity_status") == "unknown" for person in team):
        warnings.append("Availability is not recorded for every selected person. Unknown availability is not treated as confirmed.")
    return "feasible", warnings


def _explain(person: dict[str, Any], strategy: str, rank_note: str) -> str:
    if person["matched"]:
        bits = []
        for hit in person["matched"]:
            level = f", proficiency {hit['proficiency']}/10" if hit["proficiency"] is not None else ", proficiency not recorded"
            verified = ", verified" if hit["verified"] else ""
            bits.append(f"{hit['requirement']} ({hit['match']} match on {hit['skill']}{level}{verified}, {hit['priority']})")
        skills = "; ".join(bits)
    else:
        skills = "no selected requirement is recorded for this person"
    capacity = {
        "sufficient": "recorded availability covers the requested allocation",
        "unknown": "availability is not recorded",
        "conflict": "recorded availability is below the requested allocation",
    }.get(person.get("capacity_status") or "unknown", "availability is not recorded")
    return f"{person.get('full_name')} contributes {skills}. {capacity}. {rank_note}".strip()


def _members(team: list[dict[str, Any]], strategy: str, balanced: bool) -> list[dict[str, Any]]:
    ordered = sorted(team, key=_sort_key)
    rows = []
    for index, person in enumerate(ordered):
        if balanced:
            note = f"Placed from {person.get('department') or 'Unassigned'} so the team is not drawn from a single department. Requirement score {person['requirement_score']}."
        else:
            note = f"Ranked {index + 1} on requirement score {person['requirement_score']} for the skill-focused strategy."
        rows.append({
            "employee_id": person["id"],
            "full_name": person.get("full_name"),
            "role": person.get("role"),
            "department": person.get("department"),
            "requirement_score": person["requirement_score"],
            "matched": person["matched"],
            "capacity_status": person.get("capacity_status") or "unknown",
            "explanation": _explain(person, strategy, note),
            "warnings": [] if person.get("capacity_status") != "unknown" else ["Availability is not recorded."],
        })
    return rows


def evaluate_roster(
    employees: list[dict[str, Any]],
    requirements: list[dict[str, Any]],
    roles: list[str],
    aliases: dict[str, str],
    requested: int,
) -> dict[str, Any]:
    """Score a roster the user already chose. A high score does not make a conflicted roster feasible."""
    annotated = _annotate(employees, requirements, aliases)
    detail = _team_metrics(annotated, requirements, roles, aliases, max(1, int(requested)))
    feasibility, warnings = _feasibility(annotated, detail, max(1, int(requested)), len(annotated))
    if any(person.get("capacity_status") == "conflict" for person in annotated):
        feasibility = "gaps"
        warnings.append("A selected person does not have enough recorded availability for this timeframe.")
    return {
        "feasibility": feasibility,
        "warnings": warnings,
        "metrics": detail["metrics"],
        "uncovered": detail["uncovered"],
        "roles": detail["roles"],
        "members": _members(annotated, "manual", False),
    }


def form_teams(
    employees: list[dict[str, Any]],
    requirements: list[dict[str, Any]],
    roles: list[str],
    headcount: int,
    aliases: dict[str, str],
) -> dict[str, Any]:
    """Return up to two different teams. Conflicted people are already excluded by the caller."""
    pool = _annotate([row for row in employees if row.get("capacity_status") != "conflict"], requirements, aliases)
    pool = [row for row in pool if str(row.get("employment_status") or "Active").lower() in {"active", ""}]
    requested = max(1, int(headcount))
    take = min(requested, len(pool))
    warnings = []
    if len(pool) < requested:
        warnings.append(f"Only {len(pool)} eligible people are available for a team of {requested}.")
    if not pool:
        return {
            "algorithm_version": ALGORITHM_VERSION,
            "eligible_count": 0,
            "options": [],
            "warnings": warnings + ["No active employee is eligible."],
        }

    skill_team = _pick_skill_focus(pool, take, requirements, aliases)
    balanced_team = _pick_balanced(pool, take, requirements, aliases)
    same = {row["id"] for row in skill_team} == {row["id"] for row in balanced_team}

    def pack(strategy: str, name: str, team: list[dict[str, Any]], balanced: bool) -> dict[str, Any]:
        detail = _team_metrics(team, requirements, roles, aliases, requested)
        feasibility, local_warnings = _feasibility(team, detail, requested, len(pool))
        rationale = _rationale(name, team, detail, feasibility)
        return {
            "strategy": strategy,
            "name": name,
            "feasibility": feasibility,
            "option_status": "proposed" if feasibility == "feasible" else "infeasible",
            "members": _members(team, strategy, balanced),
            "metrics": detail["metrics"],
            "uncovered": detail["uncovered"],
            "roles": detail["roles"],
            "warnings": local_warnings,
            "rationale": rationale,
        }

    options = [pack("skill_focus", "Skill and delivery focus", skill_team, False)]
    if not same:
        options.insert(0, pack("balanced", "Balanced cross-functional team", balanced_team, True))
    else:
        warnings.append("Both strategies selected the same people, so only one option is returned.")
    return {
        "algorithm_version": ALGORITHM_VERSION,
        "eligible_count": len(pool),
        "options": options,
        "warnings": warnings,
    }


def _rationale(name: str, team: list[dict[str, Any]], detail: dict[str, Any], feasibility: str) -> str:
    departments = ", ".join(detail["metrics"]["departments"]) or "no department"
    gaps = ", ".join(item["skill"] for item in detail["uncovered"]) or "none"
    return (
        f"{name}: {len(team)} people from {departments}. "
        f"Feasibility is {feasibility.replace('_', ' ')}. "
        f"Uncovered requirements: {gaps}."
    )


def skills_mentioned_in_context(context: str, catalogue: list[str], aliases: dict[str, str]) -> list[str]:
    """Add catalogue skills named in the brief as optional requirements. Does not change skills already listed."""
    text = skill_key(context)
    if not text:
        return []
    found = []
    for name in catalogue:
        key = skill_key(name)
        if not key:
            continue
        if re.search(rf"(^|[^a-z0-9]){re.escape(key)}([^a-z0-9]|$)", text):
            found.append(name)
            continue
        for alias, canonical in aliases.items():
            if canonical == canonical_key(name, aliases) and re.search(rf"(^|[^a-z0-9]){re.escape(alias)}([^a-z0-9]|$)", text):
                found.append(name)
                break
    # Stable, unique by canonical key.
    seen = set()
    unique = []
    for name in found:
        key = canonical_key(name, aliases)
        if key in seen:
            continue
        seen.add(key)
        unique.append(name)
    return unique

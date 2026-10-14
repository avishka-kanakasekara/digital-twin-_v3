"""Compatibility wrapper. The live optimizer is app.services.team_builder_engine."""

from __future__ import annotations

from typing import Any


def optimize_team(employees: list[dict[str, Any]], headcount: int, required_skills: list[str]) -> list[dict[str, Any]]:
    from app.services.team_builder_engine import form_teams

    prepared = []
    for employee in employees:
        skills = []
        for skill in employee.get("skills") or []:
            if isinstance(skill, str):
                skills.append({"name": skill, "proficiency": None, "verified": False})
            else:
                skills.append(skill)
        prepared.append({
            "id": employee.get("id"),
            "full_name": employee.get("full_name") or employee.get("name"),
            "role": employee.get("role"),
            "department": employee.get("department"),
            "employment_status": employee.get("employment_status") or "Active",
            "capacity_status": employee.get("capacity_status") or "unknown",
            "skills": skills,
        })
    requirements = [{"name": skill, "priority": "important"} for skill in required_skills]
    return form_teams(prepared, requirements, [], headcount, {})["options"]

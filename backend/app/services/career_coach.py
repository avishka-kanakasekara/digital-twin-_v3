from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from supabase import Client

from app.schemas.career import (
    CareerAnalysisResponse,
    CareerChatMessage,
    CareerGoalResponse,
    CareerNextActionResponse,
    CareerRoadmapStepResponse,
    EvidenceSubmissionResponse,
    InternalRoleMatchResponse,
    MarketTrendResponse,
    MentorMatchResponse,
    ReadinessComponentResponse,
    SkillGapResponse,
    StallFlagResponse,
)

READINESS_WEIGHTS = {
    "skills_coverage": 0.45,
    "experience_fit": 0.2,
    "certifications": 0.15,
    "project_exposure": 0.2,
}

ROLE_SKILL_LIBRARY: dict[str, list[dict[str, Any]]] = {
    "default": [
        {"skill": "Backend Development", "level": 8, "category": "Engineering"},
        {"skill": "System Design", "level": 8, "category": "Architecture"},
        {"skill": "CI/CD", "level": 7, "category": "DevOps"},
        {"skill": "Leadership", "level": 7, "category": "Collaboration"},
    ],
    "principal": [
        {"skill": "System Design", "level": 9, "category": "Architecture"},
        {"skill": "Technical Leadership", "level": 9, "category": "Leadership"},
        {"skill": "Stakeholder Management", "level": 8, "category": "Collaboration"},
        {"skill": "Architecture Reviews", "level": 8, "category": "Architecture"},
    ],
    "cloud": [
        {"skill": "AWS", "level": 8, "category": "Cloud"},
        {"skill": "Azure", "level": 7, "category": "Cloud"},
        {"skill": "Kubernetes", "level": 8, "category": "DevOps"},
        {"skill": "System Design", "level": 8, "category": "Architecture"},
    ],
    "data": [
        {"skill": "Python", "level": 8, "category": "Programming"},
        {"skill": "Machine Learning", "level": 8, "category": "AI/ML"},
        {"skill": "Data Architecture", "level": 8, "category": "Data"},
        {"skill": "Model Deployment", "level": 7, "category": "MLOps"},
    ],
    "frontend": [
        {"skill": "React", "level": 8, "category": "Frontend"},
        {"skill": "TypeScript", "level": 8, "category": "Frontend"},
        {"skill": "UI/UX", "level": 7, "category": "Design"},
        {"skill": "Performance Optimization", "level": 7, "category": "Frontend"},
    ],
}

MARKET_TRENDS = [
    MarketTrendResponse(skill="System Design", category="Architecture", trend="+18%", implication="Still the clearest signal for senior and staff engineering mobility."),
    MarketTrendResponse(skill="AI Product Delivery", category="AI/ML", trend="+22%", implication="Employees who can ship AI-enabled workflows are getting faster promotion tracks."),
    MarketTrendResponse(skill="Cloud Cost Optimization", category="Cloud", trend="+14%", implication="Cloud migration programs increasingly reward engineers who can reduce cost as well as ship features."),
    MarketTrendResponse(skill="Stakeholder Communication", category="Leadership", trend="Stable", implication="For internal moves, communication skill is often the difference between ready-soon and ready-now."),
]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def _normalize_skill_level(value: Any) -> int:
    try:
        n = int(float(value or 0))
    except Exception:
        return 0
    if n > 10:
        return max(0, min(10, round(n / 10)))
    return max(0, min(10, n))


def _text_contains(a: str, b: str) -> bool:
    a_l = a.lower().strip()
    b_l = b.lower().strip()
    return a_l in b_l or b_l in a_l


def _match_skill_level(required_skill: str, skills: list[dict[str, Any]]) -> tuple[int, str | None]:
    best = 0
    matched_name = None
    for skill in skills:
        skill_name = str(skill.get("name", ""))
        if not skill_name:
            continue
        if _text_contains(required_skill, skill_name):
            level = _normalize_skill_level(skill.get("proficiency"))
            if level > best:
                best = level
                matched_name = skill_name
    return best, matched_name


def _requirements_for_goal(target_role: str, focus_area: str | None, internal_roles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    role_lower = f"{target_role} {focus_area or ''}".lower()
    for role in internal_roles:
        if role.get("title") and _text_contains(str(role["title"]), target_role):
            raw = role.get("required_skills") or []
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except Exception:
                    raw = []
            if isinstance(raw, list) and raw:
                return [
                    {
                        "skill": r.get("skill") or r.get("name") or "Unknown Skill",
                        "level": int(r.get("level") or r.get("target_level") or 7),
                        "category": r.get("category") or "General",
                    }
                    for r in raw
                ]
    if "principal" in role_lower or "staff" in role_lower:
        return ROLE_SKILL_LIBRARY["principal"]
    if "cloud" in role_lower or "architect" in role_lower:
        return ROLE_SKILL_LIBRARY["cloud"]
    if "data" in role_lower or "ai" in role_lower or "machine learning" in role_lower:
        return ROLE_SKILL_LIBRARY["data"]
    if "frontend" in role_lower or "ui" in role_lower:
        return ROLE_SKILL_LIBRARY["frontend"]
    return ROLE_SKILL_LIBRARY["default"]


def _fetch_employee_context(employee_id: str, sb: Client) -> dict[str, Any]:
    employee = sb.table("employees").select("*").eq("id", employee_id).execute().data or []
    skills = sb.table("skills").select("*").eq("employee_id", employee_id).execute().data or []
    projects = sb.table("projects").select("*").eq("employee_id", employee_id).execute().data or []
    knowledge = sb.table("knowledge_sources").select("*").eq("employee_id", employee_id).execute().data or []
    certs = sb.table("certifications").select("*").eq("employee_id", employee_id).execute().data or []
    goal = sb.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).execute().data or []
    roadmap = []
    if goal:
        roadmap = sb.table("career_roadmap_steps").select("*").eq("career_goal_id", goal[0]["id"]).order("step_order").execute().data or []
    return {
        "employee": employee[0] if employee else {},
        "skills": skills,
        "projects": projects,
        "knowledge_sources": knowledge,
        "certifications": certs,
        "active_goal": goal[0] if goal else None,
        "roadmap_steps": roadmap,
    }


def _readiness_band(score: int) -> str:
    if score >= 85:
        return "Ready now"
    if score >= 70:
        return "Close"
    if score >= 50:
        return "Building"
    return "Early stage"


def _recommended_path(skill: str, category: str, gap: int) -> tuple[str, str, int]:
    if category.lower() in {"cloud", "devops"}:
        return ("course", f"Complete a guided {skill} lab, then apply it in a live migration or platform hardening project.", gap * 10 + 8)
    if category.lower() in {"leadership", "collaboration"}:
        return ("mentor", f"Shadow a senior peer for one sprint and lead a review or planning session focused on {skill}.", gap * 8 + 6)
    if category.lower() in {"architecture", "data"}:
        return ("project", f"Own a scoped design or delivery milestone that demonstrates {skill} in production.", gap * 12 + 8)
    return ("course", f"Close the {skill} gap with one structured course and one work-backed deliverable reviewed by your manager or mentor.", gap * 8 + 8)


def _clean_gemini_json(raw: str) -> dict[str, Any] | None:
    cleaned = (raw or "").strip()
    if not cleaned:
        return None
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    try:
        data = json.loads(cleaned)
    except Exception:
        return None
    return data if isinstance(data, dict) else None


def _normalize_path_type(value: Any, fallback: str) -> str:
    candidate = str(value or "").strip().lower().replace(" ", "_")
    allowed = {"course", "project", "mentor", "milestone", "learning", "practice"}
    return candidate if candidate in allowed else fallback


def _normalize_priority(value: Any, fallback: str) -> str:
    candidate = str(value or "").strip().lower()
    mapping = {
        "critical": "Critical",
        "high": "High",
        "medium": "Medium",
        "low": "Low",
    }
    return mapping.get(candidate, fallback)


def _employee_signal_payload(context: dict[str, Any]) -> dict[str, Any]:
    employee = context["employee"]
    return {
        "employee": {
            "id": employee.get("id"),
            "name": employee.get("full_name"),
            "current_role": employee.get("role"),
            "department": employee.get("department"),
            "experience_years": employee.get("years_experience"),
            "bio": employee.get("bio"),
        },
        "skills": [
            {
                "name": row.get("name"),
                "proficiency": _normalize_skill_level(row.get("proficiency")),
                "category": row.get("category"),
            }
            for row in context["skills"][:20]
        ],
        "projects": [
            {
                "name": row.get("name"),
                "role": row.get("role"),
                "status": row.get("status"),
                "domain": row.get("domain"),
                "description": row.get("description"),
                "progress": row.get("progress"),
            }
            for row in context["projects"][:10]
        ],
        "knowledge_sources": [
            {
                "title": row.get("title"),
                "source_type": row.get("source_type"),
                "summary": row.get("summary") or row.get("description"),
            }
            for row in context["knowledge_sources"][:8]
        ],
        "certifications": [
            {
                "name": row.get("name") or row.get("title"),
                "issuer": row.get("issuer"),
                "type": row.get("type"),
                "status": row.get("status"),
            }
            for row in context["certifications"][:8]
        ],
    }


def _generate_full_career_analysis(
    context: dict[str, Any],
    target_role: str,
    timeline: str | None,
    focus_area: str | None,
    target_industry: str | None,
    internal_roles: list[dict[str, Any]],
) -> dict[str, Any] | None:
    employee_payload = _employee_signal_payload(context)
    measured_skills = [
        {
            "name": row.get("name"),
            "proficiency": _normalize_skill_level(row.get("proficiency")),
            "category": row.get("category"),
        }
        for row in context["skills"][:25]
    ]

    prompt = f"""
You are a senior internal mobility and career planning analyst.
Build a complete, personalized career coach plan for ONE employee toward ONE target role.
Use ONLY the employee data below. Do not invent employers, projects, certifications, or achievements.
Every skill gap, roadmap step, summary line, and market trend must be specific to this employee and this target role.
If the target role changes, the plan must change materially.

TARGET ROLE: {target_role}
TIMELINE: {timeline or "Not specified"}
FOCUS AREA: {focus_area or "Not specified"}
TARGET INDUSTRY: {target_industry or "Not specified"}

EMPLOYEE PROFILE:
{json.dumps(employee_payload)}

MEASURED EMPLOYEE SKILLS (authoritative current levels 0-10):
{json.dumps(measured_skills)}

OPEN INTERNAL ROLES:
{json.dumps([
    {
        "title": row.get("title"),
        "department": row.get("department"),
        "required_skills": row.get("required_skills"),
    }
    for row in internal_roles[:6]
])}

Return JSON only with this exact shape:
{{
  "summary": "2-4 sentences referencing this employee by context and target role",
  "strengths": ["specific strength tied to real data", "another specific strength"],
  "blockers": ["specific blocker tied to real gaps", "another specific blocker"],
  "readiness_components": [
    {{"name": "skills_coverage", "score": 0, "explanation": "why this score for this employee"}},
    {{"name": "experience_fit", "score": 0, "explanation": "why this score for this employee"}},
    {{"name": "certifications", "score": 0, "explanation": "why this score for this employee"}},
    {{"name": "project_exposure", "score": 0, "explanation": "why this score for this employee"}}
  ],
  "skill_gaps": [
    {{
      "skill": "skill name",
      "target_level": 8,
      "category": "Engineering",
      "recommended_path": "specific action plan tied to this employee's projects or knowledge",
      "path_type": "course|project|mentor|learning|practice",
      "estimated_hours": 12,
      "priority": "Critical|High|Medium|Low"
    }}
  ],
  "roadmap_steps": [
    {{
      "step_order": 1,
      "title": "unique step title",
      "description": "specific work this employee should do",
      "status": "in_progress",
      "step_type": "course|project|mentor|milestone|learning|practice",
      "related_skill": "skill name or empty string",
      "requires_evidence": true,
      "evidence_type": "project|certificate|manager_signoff",
      "estimated_hours": 10,
      "xp_reward": 100,
      "due_window": "Weeks 1-2"
    }}
  ],
  "market_trends": [
    {{
      "skill": "skill relevant to this employee's target path",
      "category": "category",
      "trend": "+12%|Stable|-5%",
      "implication": "what this means for this employee's move"
    }}
  ],
  "next_action": {{
    "title": "concrete weekly action",
    "description": "specific next step for this employee",
    "action_type": "course|project|mentor|milestone|learning|practice",
    "estimated_hours": 6,
    "xp_reward": 75
  }}
}}

Rules:
- Provide 4 to 6 skill_gaps ranked by importance for THIS target role.
- Provide 4 to 6 roadmap_steps in order.
- Provide 3 to 4 market_trends.
- Do NOT reuse generic templates across employees.
- Do NOT output markdown or commentary outside JSON.
"""
    try:
        from app.services.gemini_safe import ask_gemini_timed

        raw = ask_gemini_timed(prompt, timeout=90.0, fallback="")
        parsed = _clean_gemini_json(raw)
        if parsed:
            print(f"[career_coach] Gemini analysis generated for {target_role}")
        else:
            print(f"[career_coach] Gemini returned empty/invalid JSON for {target_role}")
        return parsed
    except Exception as exc:
        print(f"[career_coach] Gemini analysis failed: {exc}")
        return None


def _skill_gaps_from_ai(
    ai: dict[str, Any],
    goal_id: str,
    employee_skills: list[dict[str, Any]],
    persisted_gaps: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    persisted_by_skill = {str(row.get("skill", "")).lower(): row for row in (persisted_gaps or [])}
    rows: list[dict[str, Any]] = []
    for item in ai.get("skill_gaps") or []:
        skill = str(item.get("skill") or "").strip()
        if not skill:
            continue
        current, matched_name = _match_skill_level(skill, employee_skills)
        target = max(current, min(10, int(item.get("target_level") or 7)))
        gap = max(0, target - current)
        prev = persisted_by_skill.get(skill.lower())
        path_type = _normalize_path_type(item.get("path_type"), "course")
        rows.append({
            "id": prev.get("id") if prev else str(uuid.uuid4()),
            "goal_id": goal_id,
            "skill": skill,
            "current_level": current,
            "target_level": target,
            "gap": gap,
            "recommended_path": str(item.get("recommended_path") or "").strip() or f"Build {skill} through a work-backed deliverable.",
            "estimated_hours": max(1, int(item.get("estimated_hours") or 8)),
            "status": (prev or {}).get("status") or ("closed" if gap == 0 else "not_started"),
            "path_type": path_type,
            "priority": _normalize_priority(item.get("priority"), "Medium"),
            "category": item.get("category") or "General",
            "matched_name": matched_name,
        })
    rows.sort(key=lambda row: (-row["gap"], row["skill"]))
    return rows[:6]


def _roadmap_from_ai_analysis(
    ai: dict[str, Any],
    goal_id: str,
    skill_gaps: list[dict[str, Any]],
    persisted_roadmap: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    gap_id_by_skill = {row["skill"].lower(): row["id"] for row in skill_gaps}
    persisted_by_order = {int(row.get("step_order") or 0): row for row in (persisted_roadmap or [])}
    steps: list[dict[str, Any]] = []
    for item in ai.get("roadmap_steps") or []:
        order = int(item.get("step_order") or len(steps) + 1)
        prev = persisted_by_order.get(order, {})
        related_skill = str(item.get("related_skill") or "").strip().lower()
        step_type = _normalize_path_type(item.get("step_type"), "learning")
        requires_evidence = bool(item.get("requires_evidence", True))
        evidence_type = str(item.get("evidence_type") or ("manager_signoff" if step_type == "mentor" else "project" if step_type == "project" else "certificate"))
        steps.append({
            "id": prev.get("id") or str(uuid.uuid4()),
            "career_goal_id": goal_id,
            "step_order": order,
            "title": str(item.get("title") or f"Roadmap step {order}"),
            "description": str(item.get("description") or ""),
            "status": prev.get("status") or str(item.get("status") or ("in_progress" if order == 1 else "upcoming")),
            "step_type": step_type,
            "related_skill_gap_id": gap_id_by_skill.get(related_skill) if related_skill else None,
            "requires_evidence": requires_evidence,
            "evidence_type": evidence_type,
            "estimated_hours": max(1, int(item.get("estimated_hours") or 6)),
            "xp_reward": max(50, int(item.get("xp_reward") or 90)),
            "due_window": str(item.get("due_window") or ""),
            "completed_at": prev.get("completed_at"),
        })
    steps.sort(key=lambda row: row["step_order"])
    return steps[:8]


def _readiness_from_ai(ai: dict[str, Any], goal_id: str, fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ai_rows = ai.get("readiness_components") or []
    if not ai_rows:
        return fallback
    by_name = {str(row.get("name")): row for row in ai_rows if row.get("name")}
    merged: list[dict[str, Any]] = []
    for row in fallback:
        ai_row = by_name.get(row["name"], {})
        merged.append({
            **row,
            "score": max(0, min(100, int(ai_row.get("score") if ai_row.get("score") is not None else row["score"]))),
            "explanation": str(ai_row.get("explanation") or row["explanation"]),
        })
    return merged


def _market_trends_from_ai(ai: dict[str, Any]) -> list[dict[str, Any]]:
    trends: list[dict[str, Any]] = []
    for item in ai.get("market_trends") or []:
        skill = str(item.get("skill") or "").strip()
        if not skill:
            continue
        trends.append({
            "skill": skill,
            "category": str(item.get("category") or "General"),
            "trend": str(item.get("trend") or "Stable"),
            "implication": str(item.get("implication") or ""),
        })
    return trends[:4]


def _next_action_from_ai(ai: dict[str, Any], skill_gaps: list[dict[str, Any]], roadmap: list[dict[str, Any]]) -> dict[str, Any] | None:
    raw = ai.get("next_action") or {}
    title = str(raw.get("title") or "").strip()
    if not title:
        return _choose_next_action(skill_gaps, roadmap)
    target_id = None
    related_skill = str(raw.get("skill") or "").strip().lower()
    if related_skill:
        for gap in skill_gaps:
            if gap["skill"].lower() == related_skill:
                target_id = gap["id"]
                break
    if not target_id:
        for step in roadmap:
            if step.get("status") in {"upcoming", "in_progress"}:
                target_id = step["id"]
                break
    return {
        "title": title,
        "description": str(raw.get("description") or title),
        "action_type": _normalize_path_type(raw.get("action_type"), "learning"),
        "target_id": target_id,
        "estimated_hours": max(1, int(raw.get("estimated_hours") or 6)),
        "xp_reward": max(50, int(raw.get("xp_reward") or 75)),
    }


def _goal_has_ai_plan(sb: Client, goal_id: str) -> bool:
    try:
        goal_rows = (
            sb.table("career_goals")
            .select("ai_generated_at, ai_analysis_json")
            .eq("id", goal_id)
            .limit(1)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        msg = str(exc)
        if "ai_generated_at" in msg or "ai_analysis_json" in msg or "42703" in msg:
            return False
        raise
    if not goal_rows:
        return False
    row = goal_rows[0]
    if not row.get("ai_generated_at") or not row.get("ai_analysis_json"):
        return False
    raw = row.get("ai_analysis_json")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return False
    if not isinstance(raw, dict):
        return False
    return bool(raw.get("skill_gaps") or raw.get("summary") or raw.get("generated_for_role"))


# Public alias for router imports
goal_has_ai_plan = _goal_has_ai_plan


def _load_ai_cache(active_goal: dict[str, Any] | None) -> dict[str, Any]:
    if not active_goal:
        return {}
    raw = active_goal.get("ai_analysis_json")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return {}
    return raw if isinstance(raw, dict) else {}


def _skill_gaps_from_persisted(
    persisted: list[dict[str, Any]],
    goal_id: str,
    employee_skills: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in persisted:
        skill = str(row.get("skill") or "").strip()
        if not skill:
            continue
        current, matched_name = _match_skill_level(skill, employee_skills)
        target = max(current, min(10, int(row.get("target_level") or 7)))
        gap = max(0, target - current)
        rows.append({
            **row,
            "goal_id": goal_id,
            "current_level": current,
            "target_level": target,
            "gap": gap,
            "matched_name": matched_name,
            "status": row.get("status") or ("closed" if gap == 0 else "not_started"),
        })
    rows.sort(key=lambda row: (-row["gap"], row["skill"]))
    return rows


def _needs_ai_refresh(
    sb: Client,
    goal_id: str,
    active_goal: dict[str, Any] | None,
    target_role: str,
    refresh_ai: bool,
) -> bool:
    if refresh_ai:
        return True
    if not _goal_has_ai_plan(sb, goal_id):
        return True
    cache = _load_ai_cache(active_goal)
    cached_role = str(cache.get("generated_for_role") or "").strip()
    if cached_role and cached_role.lower() != target_role.strip().lower():
        return True
    return False


def _roadmap_from_persisted(
    persisted_roadmap: list[dict[str, Any]],
    skill_gaps: list[dict[str, Any]],
    goal_id: str,
    target_role: str,
    timeline: str | None,
) -> list[dict[str, Any]]:
    if persisted_roadmap:
        return [dict(row) for row in persisted_roadmap]

    return _build_roadmap(goal_id, target_role, timeline, skill_gaps, persisted_roadmap, ai_guidance=None)


def _enrich_persisted_mentors(
    persisted: list[dict[str, Any]],
    all_employees: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    employee_map = {row.get("id"): row for row in all_employees}
    mentors: list[dict[str, Any]] = []
    for row in persisted:
        mentor = employee_map.get(row.get("mentor_employee_id"), {})
        mentors.append({
            **row,
            "mentor_name": mentor.get("full_name", "Mentor"),
            "mentor_role": mentor.get("role"),
            "mentor_department": mentor.get("department"),
            "match_reason": row.get("match_reason")
            or f"{mentor.get('full_name', 'This mentor')} is a strong match for your target role.",
        })
    return mentors[:5]


def _role_matches_from_persisted(
    employee_id: str,
    goal_id: str,
    sb: Client,
    internal_role_rows: list[dict[str, Any]],
    skills: list[dict[str, Any]],
) -> list[dict[str, Any]] | None:
    rows = (
        sb.table("role_gap_matches")
        .select("*")
        .eq("employee_id", employee_id)
        .eq("goal_id", goal_id)
        .execute()
        .data
        or []
    )
    if not rows:
        return None

    role_map = {row.get("role_id"): row for row in internal_role_rows}
    matches: list[dict[str, Any]] = []
    for row in rows:
        role = role_map.get(row.get("role_id"), {})
        missing = row.get("missing_requirements") or []
        if isinstance(missing, str):
            try:
                missing = json.loads(missing)
            except Exception:
                missing = []
        matches.append({
            "role_id": row.get("role_id"),
            "title": role.get("title", "Internal role"),
            "department": role.get("department"),
            "is_open": bool(role.get("is_open", True)),
            "overall_fit_pct": int(row.get("overall_fit_pct") or 0),
            "missing_requirements": missing,
            "matched_skills": [],
            "eligibility_summary": "Eligible now" if not missing else f"Missing {len(missing)} requirement{'s' if len(missing) != 1 else ''}",
        })
    matches.sort(key=lambda x: (-x["overall_fit_pct"], len(x["missing_requirements"]), x["title"]))
    return matches[:6]


def _apply_ai_gap_guidance(skill_gaps: list[dict[str, Any]], ai_guidance: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not ai_guidance:
        return skill_gaps

    guidance_by_skill = {
        str(row.get("skill", "")).strip().lower(): row
        for row in ai_guidance.get("skill_gap_guidance", [])
        if str(row.get("skill", "")).strip()
    }
    out: list[dict[str, Any]] = []
    for gap in skill_gaps:
        guide = guidance_by_skill.get(gap["skill"].lower(), {})
        out.append({
            **gap,
            "recommended_path": str(guide.get("recommended_path") or gap["recommended_path"]),
            "estimated_hours": max(1, int(guide.get("estimated_hours") or gap["estimated_hours"] or 1)),
            "path_type": _normalize_path_type(guide.get("path_type"), gap["path_type"]),
            "priority": _normalize_priority(guide.get("priority"), gap["priority"]),
            "roadmap_description": str(guide.get("roadmap_description") or guide.get("recommended_path") or gap["recommended_path"]),
            "roadmap_step_type": _normalize_path_type(guide.get("roadmap_step_type"), gap["path_type"]),
            "roadmap_evidence_type": str(
                guide.get("evidence_type")
                or ("manager_signoff" if gap["path_type"] == "mentor" else "project" if gap["path_type"] == "project" else "certificate")
            ),
            "roadmap_due_window": str(guide.get("due_window") or ""),
        })
    return out


def _compute_skill_gaps(goal_id: str, requirements: list[dict[str, Any]], skills: list[dict[str, Any]], persisted: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    persisted_by_skill = {row.get("skill", "").lower(): row for row in (persisted or [])}
    rows: list[dict[str, Any]] = []
    for req in requirements:
        current, matched_name = _match_skill_level(req["skill"], skills)
        target = max(current, min(10, int(req["level"])))
        gap = max(0, target - current)
        path_type, path, est_hours = _recommended_path(req["skill"], req["category"], gap)
        prev = persisted_by_skill.get(req["skill"].lower())
        rows.append({
            "id": prev.get("id") if prev else str(uuid.uuid4()),
            "goal_id": goal_id,
            "skill": req["skill"],
            "current_level": current,
            "target_level": target,
            "gap": gap,
            "recommended_path": path,
            "estimated_hours": est_hours,
            "status": (prev or {}).get("status") or ("closed" if gap == 0 else "not_started"),
            "path_type": path_type,
            "priority": "Critical" if gap >= 4 else "High" if gap >= 2 else "Medium",
            "category": req["category"],
            "matched_name": matched_name,
        })
    return rows


def _build_readiness_components(goal_id: str, employee: dict[str, Any], skills: list[dict[str, Any]], projects: list[dict[str, Any]], certifications: list[dict[str, Any]], requirements: list[dict[str, Any]], skill_gaps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    matched_levels = sum(min(row["current_level"], row["target_level"]) for row in skill_gaps)
    target_levels = sum(row["target_level"] for row in skill_gaps) or 1
    skills_coverage = round((matched_levels / target_levels) * 100)

    role_years = len(projects)
    experience_fit = min(100, 35 + role_years * 12)

    cert_score = min(100, len(certifications) * 25)
    if any("cert" in str(k.get("type", "")).lower() for k in certifications):
        cert_score = max(cert_score, 40)

    matched_project_count = 0
    for project in projects:
        text = f"{project.get('name', '')} {project.get('description', '')} {project.get('domain', '')} {project.get('role', '')}".lower()
        if any(req["skill"].lower().split()[0] in text for req in requirements):
            matched_project_count += 1
    project_exposure = min(100, 20 + matched_project_count * 20)

    return [
        {
            "id": str(uuid.uuid4()),
            "goal_id": goal_id,
            "name": "skills_coverage",
            "score": skills_coverage,
            "weight": READINESS_WEIGHTS["skills_coverage"],
            "explanation": f"You currently cover {matched_levels} of {target_levels} target skill points for this role.",
        },
        {
            "id": str(uuid.uuid4()),
            "goal_id": goal_id,
            "name": "experience_fit",
            "score": experience_fit,
            "weight": READINESS_WEIGHTS["experience_fit"],
            "explanation": f"You have {role_years} documented projects that act as evidence for role-relevant delivery.",
        },
        {
            "id": str(uuid.uuid4()),
            "goal_id": goal_id,
            "name": "certifications",
            "score": cert_score,
            "weight": READINESS_WEIGHTS["certifications"],
            "explanation": f"You have {len(certifications)} certifications or formal credentials supporting the move.",
        },
        {
            "id": str(uuid.uuid4()),
            "goal_id": goal_id,
            "name": "project_exposure",
            "score": project_exposure,
            "weight": READINESS_WEIGHTS["project_exposure"],
            "explanation": f"{matched_project_count} of your projects directly map to the target role’s requirement areas.",
        },
    ]


def _score_from_components(components: list[dict[str, Any]]) -> int:
    total = sum(int(row["score"]) * float(row["weight"]) for row in components)
    return max(0, min(100, round(total)))


def _build_roadmap(
    goal_id: str,
    target_role: str,
    timeline: str | None,
    skill_gaps: list[dict[str, Any]],
    persisted: list[dict[str, Any]] | None = None,
    ai_guidance: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    persisted_by_title = {row.get("title", "").lower(): row for row in (persisted or [])}
    roadmap: list[dict[str, Any]] = []
    for idx, gap in enumerate(sorted(skill_gaps, key=lambda x: (-x["gap"], x["skill"]))[:3], start=1):
        prev = persisted_by_title.get(f"close {gap['skill']} gap".lower())
        roadmap.append({
            "id": prev.get("id") if prev else str(uuid.uuid4()),
            "career_goal_id": goal_id,
            "step_order": idx,
            "title": f"Close {gap['skill']} gap",
            "description": gap.get("roadmap_description") or gap["recommended_path"],
            "status": (prev or {}).get("status") or ("achieved" if gap["status"] == "closed" else "in_progress" if idx == 1 else "upcoming"),
            "step_type": gap.get("roadmap_step_type") or gap["path_type"],
            "related_skill_gap_id": gap["id"],
            "requires_evidence": True,
            "evidence_type": gap.get("roadmap_evidence_type") or ("manager_signoff" if gap["path_type"] == "mentor" else "project" if gap["path_type"] == "project" else "certificate"),
            "estimated_hours": gap["estimated_hours"],
            "xp_reward": 120 if gap["priority"] == "Critical" else 90,
            "due_window": gap.get("roadmap_due_window") or timeline or "Next 12 weeks",
            "completed_at": (prev or {}).get("completed_at"),
        })

    interview_title = f"Be interview-ready for {target_role}"
    prev_interview = persisted_by_title.get(interview_title.lower())
    interview_plan = (ai_guidance or {}).get("interview_prep") or {}
    roadmap.append({
        "id": prev_interview.get("id") if prev_interview else str(uuid.uuid4()),
        "career_goal_id": goal_id,
        "step_order": len(roadmap) + 1,
        "title": interview_title,
        "description": str(
            interview_plan.get("description")
            or "Package your evidence, rehearse your story, and prepare a manager-ready case for the move."
        ),
        "status": (prev_interview or {}).get("status") or "upcoming",
        "step_type": "milestone",
        "related_skill_gap_id": None,
        "requires_evidence": True,
        "evidence_type": "manager_signoff",
        "estimated_hours": max(1, int(interview_plan.get("estimated_hours") or 6)),
        "xp_reward": 150,
        "due_window": str(interview_plan.get("due_window") or timeline or "Final month"),
        "completed_at": (prev_interview or {}).get("completed_at"),
    })
    return roadmap


def _build_internal_role_matches(employee_id: str, target_role: str, skills: list[dict[str, Any]], roles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for role in roles:
        raw = role.get("required_skills") or []
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except Exception:
                raw = []
        if not raw:
            continue
        total_required = 0
        total_have = 0
        missing: list[str] = []
        matched: list[str] = []
        for req in raw:
            level = int(req.get("level") or req.get("target_level") or 7)
            total_required += level
            current, matched_name = _match_skill_level(str(req.get("skill") or req.get("name") or ""), skills)
            total_have += min(level, current)
            if current < level:
                missing.append(f"{req.get('skill') or req.get('name')} ({current}/{level})")
            else:
                matched.append(str(matched_name or req.get("skill") or req.get("name")))
        fit = round((total_have / max(total_required, 1)) * 100)
        summary = "Eligible now" if not missing else f"Missing {len(missing)} requirement{'s' if len(missing) != 1 else ''}"
        matches.append({
            "role_id": role["role_id"],
            "title": role["title"],
            "department": role.get("department"),
            "is_open": bool(role.get("is_open", True)),
            "overall_fit_pct": fit,
            "missing_requirements": missing,
            "matched_skills": matched,
            "eligibility_summary": summary,
        })
    matches.sort(key=lambda x: (-x["overall_fit_pct"], len(x["missing_requirements"]), x["title"]))
    return matches[:6]


def _build_mentor_matches(employee_id: str, target_role: str, requirements: list[dict[str, Any]], all_employees: list[dict[str, Any]], all_skills: list[dict[str, Any]], persisted: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    persisted_map = {row.get("mentor_employee_id"): row for row in (persisted or [])}
    mentors: list[dict[str, Any]] = []
    required_names = [req["skill"] for req in requirements]
    for emp in all_employees:
        mentor_id = emp.get("id")
        if not mentor_id or mentor_id == employee_id:
            continue
        mentor_skill_rows = [s for s in all_skills if s.get("employee_id") == mentor_id]
        overlap = []
        for req_name in required_names:
            level, matched_name = _match_skill_level(req_name, mentor_skill_rows)
            if level >= 7:
                overlap.append(matched_name or req_name)
        role_text = str(emp.get("role", ""))
        if _text_contains(target_role, role_text) or overlap:
            prev = persisted_map.get(mentor_id, {})
            mentors.append({
                "id": prev.get("id") or str(uuid.uuid4()),
                "employee_id": employee_id,
                "mentor_employee_id": mentor_id,
                "mentor_name": emp.get("full_name", "Mentor"),
                "mentor_role": role_text,
                "mentor_department": emp.get("department"),
                "shared_target_role": target_role if _text_contains(target_role, role_text) else None,
                "shared_skill": overlap[0] if overlap else None,
                "match_reason": f"{emp.get('full_name', 'This mentor')} already demonstrates {overlap[0] if overlap else role_text} relevant to your target role.",
                "intro_requested": bool(prev.get("intro_requested", False)),
            })
    mentors.sort(key=lambda x: (not bool(x["shared_target_role"]), x["mentor_name"]))
    return mentors[:5]


def _choose_next_action(skill_gaps: list[dict[str, Any]], roadmap: list[dict[str, Any]]) -> dict[str, Any] | None:
    for step in roadmap:
        if step["status"] in {"upcoming", "in_progress"}:
            return {
                "title": step["title"],
                "description": step["description"],
                "action_type": step["step_type"],
                "target_id": step["id"],
                "estimated_hours": step["estimated_hours"],
                "xp_reward": step["xp_reward"],
            }
    if skill_gaps:
        gap = sorted(skill_gaps, key=lambda x: (-x["gap"], x["skill"]))[0]
        return {
            "title": f"Start {gap['skill']}",
            "description": gap["recommended_path"],
            "action_type": gap["path_type"],
            "target_id": gap["id"],
            "estimated_hours": gap["estimated_hours"],
            "xp_reward": 75,
        }
    return None


_SKILL_GAP_DB_KEYS = {
    "id", "goal_id", "skill", "current_level", "target_level", "gap",
    "recommended_path", "estimated_hours", "status", "path_type", "priority", "category",
}
_ROADMAP_DB_KEYS = {
    "id", "career_goal_id", "step_order", "title", "status", "description",
    "step_type", "related_skill_gap_id", "requires_evidence", "evidence_type",
    "estimated_hours", "xp_reward", "due_window", "completed_at",
}
_MENTOR_DB_KEYS = {
    "id", "employee_id", "mentor_employee_id", "shared_target_role",
    "shared_skill", "match_reason", "intro_requested",
}
_READINESS_DB_KEYS = {"id", "goal_id", "name", "score", "weight", "explanation"}


def _db_payload(rows: list[dict[str, Any]], allowed: set[str]) -> list[dict[str, Any]]:
    return [{k: v for k, v in row.items() if k in allowed} for row in rows]


def persist_career_snapshot(
    sb: Client,
    employee_id: str,
    goal_id: str,
    readiness_components: list[dict[str, Any]],
    skill_gaps: list[dict[str, Any]],
    roadmap: list[dict[str, Any]],
    internal_roles: list[dict[str, Any]],
    mentors: list[dict[str, Any]],
    ai_cache: dict[str, Any] | None = None,
) -> None:
    try:
        sb.table("readiness_components").delete().eq("goal_id", goal_id).execute()
        if readiness_components:
            sb.table("readiness_components").insert(_db_payload(readiness_components, _READINESS_DB_KEYS)).execute()

        sb.table("skill_gaps").delete().eq("goal_id", goal_id).execute()
        if skill_gaps:
            sb.table("skill_gaps").insert(_db_payload(skill_gaps, _SKILL_GAP_DB_KEYS)).execute()

        sb.table("career_roadmap_steps").delete().eq("career_goal_id", goal_id).execute()
        if roadmap:
            sb.table("career_roadmap_steps").insert(_db_payload(roadmap, _ROADMAP_DB_KEYS)).execute()

        sb.table("role_gap_matches").delete().eq("employee_id", employee_id).eq("goal_id", goal_id).execute()
        if internal_roles:
            rows = []
            for role in internal_roles:
                rows.append({
                    "id": str(uuid.uuid4()),
                    "employee_id": employee_id,
                    "goal_id": goal_id,
                    "role_id": role["role_id"],
                    "overall_fit_pct": role["overall_fit_pct"],
                    "missing_requirements": role["missing_requirements"],
                })
            if rows:
                sb.table("role_gap_matches").insert(rows).execute()

        sb.table("mentor_matches").delete().eq("employee_id", employee_id).execute()
        if mentors:
            sb.table("mentor_matches").insert(_db_payload(mentors, _MENTOR_DB_KEYS)).execute()

        if ai_cache is not None:
            try:
                sb.table("career_goals").update({
                    "ai_analysis_json": ai_cache,
                    "ai_generated_at": _utc_now().isoformat(),
                    "updated_at": _utc_now().isoformat(),
                }).eq("id", goal_id).execute()
            except Exception as exc:
                print(f"[career_coach] Could not persist AI cache (run career_coach_rebuild.sql): {exc}")
    except Exception as exc:
        print(f"[career_coach] persist_career_snapshot failed: {exc}")


def compute_career_state(
    employee_id: str,
    sb: Client,
    target_role: str | None = None,
    timeline: str | None = None,
    focus_area: str | None = None,
    refresh_ai: bool = False,
) -> dict[str, Any]:
    context = _fetch_employee_context(employee_id, sb)
    employee = context["employee"]
    active_goal = context["active_goal"]
    target_role = target_role or (active_goal or {}).get("target_role") or employee.get("role") or "Senior Software Engineer"
    timeline = timeline or (active_goal or {}).get("timeline")
    focus_area = focus_area or (active_goal or {}).get("focus_area")
    target_industry = (active_goal or {}).get("target_industry")
    goal_id = (active_goal or {}).get("id") or str(uuid.uuid4())

    internal_role_rows = sb.table("internal_roles").select("*").eq("is_open", True).execute().data or []
    requirements = _requirements_for_goal(target_role, focus_area, internal_role_rows)
    persisted_gaps = sb.table("skill_gaps").select("*").eq("goal_id", goal_id).execute().data or []
    persisted_roadmap = sb.table("career_roadmap_steps").select("*").eq("career_goal_id", goal_id).order("step_order").execute().data or []
    ai_cache = _load_ai_cache(active_goal)

    run_ai = _needs_ai_refresh(sb, goal_id, active_goal, target_role, refresh_ai)
    ai_analysis: dict[str, Any] | None = None
    market_trends: list[dict[str, Any]] = []

    if run_ai:
        ai_analysis = _generate_full_career_analysis(
            context=context,
            target_role=target_role,
            timeline=timeline,
            focus_area=focus_area,
            target_industry=target_industry,
            internal_roles=internal_role_rows,
        )
        if ai_analysis:
            skill_gaps = _skill_gaps_from_ai(ai_analysis, goal_id, context["skills"], persisted_gaps)
            roadmap = _roadmap_from_ai_analysis(ai_analysis, goal_id, skill_gaps, persisted_roadmap)
            fallback_readiness = _build_readiness_components(
                goal_id, employee, context["skills"], context["projects"], context["certifications"], requirements, skill_gaps
            )
            readiness_components = _readiness_from_ai(ai_analysis, goal_id, fallback_readiness)
            market_trends = _market_trends_from_ai(ai_analysis)
            requirements = [{"skill": gap["skill"], "level": gap["target_level"], "category": gap.get("category") or "General"} for gap in skill_gaps]
        else:
            skill_gaps = _compute_skill_gaps(goal_id, requirements, context["skills"], persisted_gaps)
            roadmap = _build_roadmap(goal_id, target_role, timeline, skill_gaps, persisted_roadmap, ai_guidance=None)
            readiness_components = _build_readiness_components(
                goal_id, employee, context["skills"], context["projects"], context["certifications"], requirements, skill_gaps
            )
            market_trends = [row.model_dump() for row in MARKET_TRENDS]
    else:
        if persisted_gaps:
            skill_gaps = _skill_gaps_from_persisted(persisted_gaps, goal_id, context["skills"])
        elif ai_cache.get("skill_gaps"):
            skill_gaps = _skill_gaps_from_ai(ai_cache, goal_id, context["skills"], persisted_gaps)
        else:
            run_ai = True
            ai_analysis = _generate_full_career_analysis(
                context=context,
                target_role=target_role,
                timeline=timeline,
                focus_area=focus_area,
                target_industry=target_industry,
                internal_roles=internal_role_rows,
            )
            if ai_analysis:
                skill_gaps = _skill_gaps_from_ai(ai_analysis, goal_id, context["skills"], persisted_gaps)
                roadmap = _roadmap_from_ai_analysis(ai_analysis, goal_id, skill_gaps, persisted_roadmap)
                fallback_readiness = _build_readiness_components(
                    goal_id, employee, context["skills"], context["projects"], context["certifications"], requirements, skill_gaps
                )
                readiness_components = _readiness_from_ai(ai_analysis, goal_id, fallback_readiness)
                market_trends = _market_trends_from_ai(ai_analysis)
                requirements = [{"skill": gap["skill"], "level": gap["target_level"], "category": gap.get("category") or "General"} for gap in skill_gaps]
            else:
                skill_gaps = _compute_skill_gaps(goal_id, requirements, context["skills"], persisted_gaps)
                roadmap = _build_roadmap(goal_id, target_role, timeline, skill_gaps, persisted_roadmap, ai_guidance=None)
                readiness_components = _build_readiness_components(
                    goal_id, employee, context["skills"], context["projects"], context["certifications"], requirements, skill_gaps
                )
                market_trends = [row.model_dump() for row in MARKET_TRENDS]

        if not run_ai:
            roadmap = _roadmap_from_persisted(persisted_roadmap, skill_gaps, goal_id, target_role, timeline)
            if not roadmap and ai_cache.get("roadmap_steps"):
                roadmap = _roadmap_from_ai_analysis(ai_cache, goal_id, skill_gaps, persisted_roadmap)
            requirements = [{"skill": gap["skill"], "level": gap["target_level"], "category": gap.get("category") or "General"} for gap in skill_gaps]
            fallback_readiness = _build_readiness_components(
                goal_id, employee, context["skills"], context["projects"], context["certifications"], requirements, skill_gaps
            )
            readiness_components = _readiness_from_ai(ai_cache, goal_id, fallback_readiness)
            market_trends = _market_trends_from_ai(ai_cache) or [row.model_dump() for row in MARKET_TRENDS]
            ai_analysis = ai_cache or None

    readiness_score = _score_from_components(readiness_components)

    persisted_mentors = sb.table("mentor_matches").select("*").eq("employee_id", employee_id).execute().data or []
    has_ai_plan = bool(ai_analysis) and not run_ai or (_goal_has_ai_plan(sb, goal_id) and not run_ai)
    role_matches = (
        _role_matches_from_persisted(employee_id, goal_id, sb, internal_role_rows, context["skills"])
        if has_ai_plan
        else None
    )
    if role_matches is None:
        role_matches = _build_internal_role_matches(employee_id, target_role, context["skills"], internal_role_rows)

    if not run_ai and persisted_mentors:
        all_employees = sb.table("employees").select("id, full_name, role, department").execute().data or []
        mentor_matches = _enrich_persisted_mentors(persisted_mentors, all_employees)
    else:
        all_employees = sb.table("employees").select("id, full_name, role, department").execute().data or []
        all_skills = sb.table("skills").select("employee_id, name, proficiency").execute().data or []
        mentor_matches = _build_mentor_matches(employee_id, target_role, requirements, all_employees, all_skills, persisted_mentors)
    next_action = _next_action_from_ai(ai_analysis, skill_gaps, roadmap) if ai_analysis else _choose_next_action(skill_gaps, roadmap)
    evidence_rows = sb.table("evidence_submissions").select("*").eq("employee_id", employee_id).execute().data or []
    xp_rows = sb.table("xp_events").select("*").eq("employee_id", employee_id).order("timestamp", desc=True).execute().data or []
    stall_rows = sb.table("stall_flags").select("*").eq("employee_id", employee_id).eq("goal_id", goal_id).eq("resolved", False).order("flagged_at", desc=True).limit(1).execute().data or []

    evidence_count_by_gap: dict[str, int] = {}
    evidence_count_by_step: dict[str, int] = {}
    for evidence in evidence_rows:
        if evidence.get("skill_gap_id"):
            evidence_count_by_gap[evidence["skill_gap_id"]] = evidence_count_by_gap.get(evidence["skill_gap_id"], 0) + 1
        if evidence.get("roadmap_step_id"):
            evidence_count_by_step[evidence["roadmap_step_id"]] = evidence_count_by_step.get(evidence["roadmap_step_id"], 0) + 1

    for gap in skill_gaps:
        gap["evidence_count"] = evidence_count_by_gap.get(gap["id"], 0)
    for step in roadmap:
        step["evidence_submitted"] = evidence_count_by_step.get(step["id"], 0) > 0

    strengths = [
        str(item).strip()
        for item in (ai_analysis or {}).get("strengths", [])
        if str(item).strip()
    ][:3] or [f"Current evidence is strongest in {row['name'].replace('_', ' ')} ({row['score']}%)." for row in sorted(readiness_components, key=lambda x: -x["score"])[:2]]
    blockers = [
        str(item).strip()
        for item in (ai_analysis or {}).get("blockers", [])
        if str(item).strip()
    ][:3] or [f"{gap['skill']} is still {gap['gap']} level(s) short of the target bar." for gap in sorted(skill_gaps, key=lambda x: (-x["gap"], x["skill"]))[:3] if gap["gap"] > 0]
    readiness_explanation = " / ".join(f"{row['name'].replace('_', ' ')} {row['score']}%" for row in readiness_components)
    summary = str((ai_analysis or {}).get("summary") or "").strip() or (
        f"You are {_readiness_band(readiness_score).lower()} for {target_role} at {readiness_score}% readiness. "
        f"The biggest gaps are {', '.join(g['skill'] for g in sorted(skill_gaps, key=lambda x: (-x['gap'], x['skill']))[:2]) or 'already covered'}. "
        f"The fastest path this week is to {next_action['title'].lower()}." if next_action else
        f"You are {_readiness_band(readiness_score).lower()} for {target_role} at {readiness_score}% readiness."
    )

    ai_cache_out = None
    if ai_analysis and run_ai:
        ai_cache_out = {
            **{k: v for k, v in ai_analysis.items() if k in {"skill_gaps", "roadmap_steps", "market_trends", "readiness_components", "next_action"}},
            "summary": summary,
            "strengths": strengths,
            "blockers": blockers,
            "readiness_components": readiness_components,
            "market_trends": market_trends,
            "next_action": next_action,
            "generated_for_role": target_role,
        }

    return {
        "goal_id": goal_id,
        "target_role": target_role,
        "timeline": timeline,
        "focus_area": focus_area,
        "readiness_score": readiness_score,
        "readiness_components": readiness_components,
        "skill_gaps": skill_gaps,
        "roadmap": roadmap,
        "internal_roles": role_matches,
        "mentors": mentor_matches,
        "market_trends": market_trends or [row.model_dump() for row in MARKET_TRENDS],
        "next_action": next_action,
        "stall_flag": stall_rows[0] if stall_rows else None,
        "summary": summary,
        "strengths": strengths,
        "blockers": blockers,
        "xp_total": sum(int(row.get("amount") or 0) for row in xp_rows),
        "employee": employee,
        "ai_cache": ai_cache_out,
        "ai_generated": bool(ai_cache_out) or (_goal_has_ai_plan(sb, goal_id) and not run_ai),
    }


def analysis_response_from_state(employee_id: str, sb: Client, state: dict[str, Any]) -> CareerAnalysisResponse:
    active_goal = sb.table("career_goals").select("*").eq("id", state["goal_id"]).execute().data or []
    goal_row = active_goal[0] if active_goal else None
    goal = None
    if goal_row:
        goal = CareerGoalResponse(
            id=goal_row["id"],
            employee_id=goal_row["employee_id"],
            target_role=goal_row["target_role"],
            timeline=goal_row.get("timeline"),
            focus_area=goal_row.get("focus_area"),
            target_industry=goal_row.get("target_industry"),
            readiness_score=goal_row.get("readiness_score", state["readiness_score"]),
            visible_to_manager=bool(goal_row.get("visible_to_manager", False)),
            is_active=bool(goal_row.get("is_active", True)),
            created_at=goal_row.get("created_at"),
            updated_at=goal_row.get("updated_at"),
            roadmap_steps=[CareerRoadmapStepResponse(**row) for row in state["roadmap"]],
        )

    stall_flag = None
    if state["stall_flag"]:
        row = state["stall_flag"]
        stall_flag = StallFlagResponse(
            id=row["id"],
            employee_id=row["employee_id"],
            goal_id=row["goal_id"],
            last_progress_at=row["last_progress_at"],
            flagged_at=row["flagged_at"],
            resolved=bool(row.get("resolved", False)),
            message="You have not logged career progress recently. Pick one small step this week to keep momentum."
        )

    return CareerAnalysisResponse(
        goal=goal,
        readiness_score=state["readiness_score"],
        readiness_band=_readiness_band(state["readiness_score"]),
        readiness_explanation=state["readiness_components"][0]["explanation"] if state["readiness_components"] else "No readiness components available.",
        readiness_components=[ReadinessComponentResponse(**row) for row in state["readiness_components"]],
        skill_gaps=[
            SkillGapResponse(
                **{
                    k: v
                    for k, v in row.items()
                    if k not in {"matched_name", "roadmap_description", "roadmap_step_type", "roadmap_evidence_type", "roadmap_due_window"}
                }
            )
            for row in state["skill_gaps"]
        ],
        roadmap_steps=[CareerRoadmapStepResponse(**row) for row in state["roadmap"]],
        internal_roles=[InternalRoleMatchResponse(**row) for row in state["internal_roles"]],
        mentors=[MentorMatchResponse(**row) for row in state["mentors"]],
        market_trends=[MarketTrendResponse(**row) for row in state["market_trends"]],
        next_action=CareerNextActionResponse(**state["next_action"]) if state["next_action"] else None,
        stall_flag=stall_flag,
        summary=state["summary"],
        strengths=state["strengths"],
        blockers=state["blockers"],
        xp_total=state["xp_total"],
    )


def build_grounded_chat_response(employee_id: str, message: str, history: list[CareerChatMessage], sb: Client) -> tuple[str, list[str]]:
    state = compute_career_state(employee_id, sb)
    top_gaps = sorted(state["skill_gaps"], key=lambda x: (-x["gap"], x["skill"]))[:2]
    top_roles = state["internal_roles"][:2]
    grounding = [
        f"Readiness is {state['readiness_score']}% for {state['target_role']}.",
        *(f"{gap['skill']} is {gap['gap']} level(s) below target." for gap in top_gaps if gap["gap"] > 0),
        *(f"{role['title']} fit is {role['overall_fit_pct']}% with {len(role['missing_requirements'])} missing requirement(s)." for role in top_roles),
    ]

    prompt = f"""
You are the Digital Twin Career Coach. Use the employee's actual data only.

EMPLOYEE: {state['employee'].get('full_name', 'Employee')}
CURRENT ROLE: {state['employee'].get('role', 'Unknown')}
TARGET ROLE: {state['target_role']}
READINESS: {state['readiness_score']}%
NEXT ACTION: {(state['next_action'] or {}).get('title', 'None')}
TOP SKILL GAPS: {json.dumps([{k: gap[k] for k in ['skill', 'gap', 'recommended_path', 'estimated_hours']} for gap in top_gaps])}
ROLE MATCHES: {json.dumps(top_roles)}
RECENT HISTORY: {json.dumps([msg.model_dump() for msg in history[-8:]])}
USER MESSAGE: {message}

Respond in markdown. Reference at least two concrete facts from the data above. Do not give generic advice.
"""
    try:
        from app.services.gemini_safe import ask_gemini_timed

        answer = ask_gemini_timed(prompt, timeout=12.0, fallback="")
        if answer:
            return answer, grounding
    except Exception:
        pass

    if top_gaps:
        first_gap = top_gaps[0]
        fallback = (
            f"You're currently **{state['readiness_score']}%** ready for **{state['target_role']}**. "
            f"The biggest blocker is **{first_gap['skill']}**, which is still **{first_gap['gap']} level(s)** short. "
            f"My recommendation this week is to **{(state['next_action'] or {}).get('title', 'start the next roadmap step')}** "
            f"and collect evidence so you can move one requirement from missing to proven."
        )
    else:
        fallback = (
            f"You're already close to **{state['target_role']}** at **{state['readiness_score']}%** readiness. "
            f"Focus on packaging evidence for your completed work and targeting the strongest internal role match."
        )
    return fallback, grounding


def log_xp_event(sb: Client, employee_id: str, source: str, amount: int, reference_type: str | None = None, reference_id: str | None = None) -> None:
    sb.table("xp_events").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "source": source,
        "amount": amount,
        "timestamp": _utc_now().isoformat(),
        "reference_type": reference_type,
        "reference_id": reference_id,
    }).execute()


def award_career_xp(sb: Client, employee_id: str, amount: int, reason: str, reference_type: str | None = None, reference_id: str | None = None) -> None:
    from app.services.gamification_engine import award_xp

    award_xp(sb, employee_id, amount, reason, "career", "🚀")
    log_xp_event(sb, employee_id, reference_type or "career", amount, reference_type, reference_id)


def latest_progress_at(sb: Client, employee_id: str, goal_id: str) -> datetime:
    evidence = sb.table("evidence_submissions").select("created_at").eq("employee_id", employee_id).order("created_at", desc=True).limit(1).execute().data or []
    steps = sb.table("career_roadmap_steps").select("completed_at, updated_at").eq("career_goal_id", goal_id).order("updated_at", desc=True).limit(1).execute().data or []
    timestamps = []
    if evidence and evidence[0].get("created_at"):
        timestamps.append(datetime.fromisoformat(evidence[0]["created_at"].replace("Z", "+00:00")))
    if steps:
        row = steps[0]
        for key in ("completed_at", "updated_at"):
            if row.get(key):
                timestamps.append(datetime.fromisoformat(row[key].replace("Z", "+00:00")))
    return max(timestamps) if timestamps else _utc_now()


def scan_for_stalled_goals(sb: Client, stale_after_days: int = 14) -> dict[str, Any]:
    goals = sb.table("career_goals").select("*").eq("is_active", True).execute().data or []
    cutoff = _utc_now() - timedelta(days=stale_after_days)
    flagged = 0
    resolved = 0
    flags_out: list[dict[str, Any]] = []
    for goal in goals:
        last_progress = latest_progress_at(sb, goal["employee_id"], goal["id"])
        existing = sb.table("stall_flags").select("*").eq("goal_id", goal["id"]).eq("resolved", False).execute().data or []
        if last_progress < cutoff:
            if existing:
                row = existing[0]
            else:
                row = {
                    "id": str(uuid.uuid4()),
                    "employee_id": goal["employee_id"],
                    "goal_id": goal["id"],
                    "last_progress_at": last_progress.isoformat(),
                    "flagged_at": _utc_now().isoformat(),
                    "resolved": False,
                }
                sb.table("stall_flags").insert(row).execute()
            flagged += 1
            flags_out.append(row)
        elif existing:
            sb.table("stall_flags").update({"resolved": True, "last_progress_at": last_progress.isoformat()}).eq("id", existing[0]["id"]).execute()
            resolved += 1
    return {"scanned_goals": len(goals), "flagged_goals": flagged, "resolved_goals": resolved, "flags": flags_out}

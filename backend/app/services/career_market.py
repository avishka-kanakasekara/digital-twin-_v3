"""Market-researched role requirements.

Gemini, grounded with Google Search, reads what employers currently ask of a role and
maps each requirement onto the employee's own Skill DNA. The result is cached per
employee and role so Career Coach and Learning Recommendation measure the same bar.
The built-in role library is the fallback when research is unavailable.
"""

from __future__ import annotations

import json
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from app.database import Client
from app.services.career_coach import ROLE_SKILL_LIBRARY, _normalize_skill_level, _role_family

RESEARCH_TIMEOUT_S = 120.0
MIN_REQUIREMENTS = 4
MAX_REQUIREMENTS = 9
LIBRARY_RETRY_S = 30 * 60

_locks: dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()
_SCHEMA_READY = False


def _enabled() -> bool:
    return os.environ.get("CAREER_MARKET_AI", "true").strip().lower() not in {"0", "false", "no", "off"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _profile_id(employee_id: str, target_role: str) -> str:
    role = " ".join(target_role.lower().split())
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{employee_id}:role:{role}"))


def ensure_schema(db: Client) -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    if db.db.dialect == "sqlite":
        db.db.execute(
            """CREATE TABLE IF NOT EXISTS career_role_profiles (
                id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, target_role TEXT NOT NULL,
                profile_json TEXT NOT NULL, source TEXT NOT NULL, generated_at TEXT NOT NULL)"""
        )
    else:
        db.db.execute(
            """IF OBJECT_ID(N'dbo.career_role_profiles', N'U') IS NULL CREATE TABLE [dbo].[career_role_profiles] (
                [id] NVARCHAR(80) NOT NULL PRIMARY KEY, [employee_id] NVARCHAR(80) NOT NULL, [target_role] NVARCHAR(200) NOT NULL,
                [profile_json] NVARCHAR(MAX) NOT NULL, [source] NVARCHAR(40) NOT NULL, [generated_at] NVARCHAR(40) NOT NULL)"""
        )
    _SCHEMA_READY = True


# ── Public ────────────────────────────────────────────────────────────────


def role_profile(db: Client, employee_id: str, target_role: str, skills: list[dict[str, Any]], refresh: bool = False) -> dict[str, Any]:
    """Requirements for this employee and role: cached research, fresh research, or the library."""
    ensure_schema(db)
    role = " ".join(str(target_role or "").split())
    key = _profile_id(employee_id, role)
    if not refresh:
        cached = _load(db, key)
        if cached and _usable(cached):
            return cached
    with _lock_for(key):
        if not refresh:
            cached = _load(db, key)
            if cached and _usable(cached):
                return cached
        profile = _research(db, employee_id, role, skills) if _enabled() else None
        if profile is None:
            cached = _load(db, key)
            if cached and cached["source"] == "market":
                return cached
            profile = _library_profile(role)
        _save(db, key, employee_id, role, profile)
        return profile


def library_requirements(target_role: str) -> list[dict[str, Any]]:
    return [dict(row) for row in ROLE_SKILL_LIBRARY[_role_family(target_role.lower())]]


# ── Storage ───────────────────────────────────────────────────────────────


def _usable(profile: dict[str, Any]) -> bool:
    """Market research is kept until refreshed. A library fallback is retried after a cool-down."""
    if profile.get("source") == "market" or not _enabled():
        return True
    try:
        generated = datetime.fromisoformat(str(profile.get("generated_at")).replace("Z", "+00:00"))
    except ValueError:
        return False
    if generated.tzinfo is None:
        generated = generated.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - generated).total_seconds() < LIBRARY_RETRY_S


def _lock_for(key: str) -> threading.Lock:
    with _locks_guard:
        return _locks.setdefault(key, threading.Lock())


def _load(db: Client, key: str) -> dict[str, Any] | None:
    rows = db.table("career_role_profiles").select("*").eq("id", key).limit(1).execute().data or []
    if not rows:
        return None
    try:
        profile = json.loads(rows[0]["profile_json"])
    except (TypeError, ValueError):
        return None
    profile["source"] = rows[0].get("source") or profile.get("source") or "library"
    profile["generated_at"] = rows[0].get("generated_at")
    return profile


def _save(db: Client, key: str, employee_id: str, role: str, profile: dict[str, Any]) -> None:
    payload = {
        "employee_id": employee_id,
        "target_role": role,
        "profile_json": json.dumps(profile),
        "source": profile["source"],
        "generated_at": profile["generated_at"],
    }
    existing = db.table("career_role_profiles").select("id").eq("id", key).limit(1).execute().data or []
    if existing:
        db.table("career_role_profiles").update(payload).eq("id", key).execute()
    else:
        try:
            db.table("career_role_profiles").insert({"id": key, **payload}).execute()
        except Exception:
            db.table("career_role_profiles").update(payload).eq("id", key).execute()


def _library_profile(role: str) -> dict[str, Any]:
    return {
        "source": "library",
        "generated_at": _now(),
        "summary": f"Built-in skill bar for {role}. Market research was unavailable, so this uses the company role library.",
        "sources": [],
        "queries": [],
        "requirements": library_requirements(role),
    }


# ── Research ──────────────────────────────────────────────────────────────


def _catalogue_names(db: Client, role: str) -> list[str]:
    """Skill names the role library and the course catalogue use, so gaps line up with courses."""
    names = [str(row["skill"]) for row in library_requirements(role)]
    try:
        from app.services import learning_recommendation as lr

        lr.ensure_schema(db)
        for course in lr._courses(db):
            if course.get("catalogue_status") == "Active":
                names.extend(str(item["skill_name"]) for item in course.get("skills") or [])
    except Exception as exc:
        print(f"[career_market] Catalogue vocabulary unavailable: {exc}")
    return _unique(names)


def _unique(names: list[str]) -> list[str]:
    seen: set[str] = set()
    unique = []
    for name in names:
        key = name.strip().casefold()
        if key and key not in seen:
            seen.add(key)
            unique.append(name.strip())
    return unique


def _canonical(name: str, canonical_names: list[str]) -> str:
    """Map a researched name onto a catalogue name it clearly contains, e.g. "Advanced Cloud Networking" to "Cloud Networking"."""
    lowered = f" {name.casefold()} "
    best = None
    for candidate in canonical_names:
        key = candidate.casefold()
        if key == name.casefold():
            return candidate
        words = key.split()
        if len(words) < 2 or f" {key} " not in lowered:
            continue
        if len(name.split()) - len(words) > 2:
            continue
        if best is None or len(key) > len(best):
            best = candidate
    return best or name


def _skill_dna(skills: list[dict[str, Any]]) -> list[str]:
    lines = []
    ordered = sorted(skills, key=lambda row: -_normalize_skill_level(row.get("proficiency")))
    for skill in ordered[:120]:
        name = str(skill.get("name") or "").strip()
        if not name:
            continue
        parts = [f"{name} | {_normalize_skill_level(skill.get('proficiency'))}/10"]
        category = " / ".join(str(value) for value in (skill.get("category"), skill.get("sub_category")) if value)
        if category:
            parts.append(category)
        if skill.get("years_experience"):
            parts.append(f"{skill['years_experience']:g} yrs" if isinstance(skill["years_experience"], (int, float)) else f"{skill['years_experience']} yrs")
        if skill.get("verified"):
            parts.append("verified")
        if skill.get("source"):
            parts.append(f"from {skill['source']}")
        lines.append(" | ".join(parts))
    return lines


def _prompt(role: str, employee: dict[str, Any], skills: list[dict[str, Any]], vocabulary: list[str]) -> str:
    year = datetime.now(timezone.utc).year
    return f"""You are a talent-market analyst. Search current job postings, vendor certification paths, and industry
competency frameworks (for example SFIA) to find what employers in {year} require of a "{role}".
Then compare that bar with this employee's Skill DNA.

EMPLOYEE
Current role: {employee.get('role') or 'unknown'}
Department: {employee.get('department') or 'unknown'}
SKILL DNA (name | level on 0-10 | category | experience | verification | source):
{chr(10).join(_skill_dna(skills)) or 'none recorded'}

VOCABULARY (reuse one of these exact names whenever it means the same skill):
{', '.join(vocabulary)}

Return JSON only, inside a ```json block, with this shape:
{{
  "summary": "Two sentences on what employers currently expect of a {role}.",
  "requirements": [
    {{
      "skill": "short skill name, at most 4 words",
      "level": 7,
      "category": "one word or two",
      "why": "One affirmative sentence on why employers require it.",
      "market_signal": "Short phrase on how postings state it",
      "matches": [{{"name": "exact Skill DNA name", "relation": "same|specialization|related"}}],
      "practice_task": "A concrete deliverable the employee can produce in their current job that hiring managers accept as evidence",
      "proof": "What reviewers accept as proof at this level: a named certification, artifact, or review",
      "resources": [{{"name": "a certification or course that exists today", "provider": "who offers it", "type": "certification|course|book|community"}}],
      "hours_to_close": 60
    }}
  ]
}}

RULES
- Give 6 to {MAX_REQUIREMENTS} requirements that define the role in current postings, including ones this employee already meets.
- level is the bar for someone hired into the role: 5 working knowledge, 6 independent on routine work,
  7 independent on complex work, 8 the go-to person who leads others, 9 an authority across the organization, 10 industry-recognized.
- matches: Skill DNA entries that bear on this requirement, each with its relation.
  "same" means the same skill under another name. "specialization" means a narrower part of it, e.g. "AWS VPC Design" for "Cloud Networking".
  "related" means adjacent or broader, e.g. "AWS Architecture" for "Cloud Networking" or "Collaboration" for "Technical Leadership".
  Only same and specialization count towards the level, so label related skills honestly.
- hours_to_close is realistic focused hours from the employee's matched level to the bar; use 0 when already met.
- resources: up to 3 widely recognized options.
- Write every sentence in plain, affirmative language.
"""


def _parse(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else text[text.find("{"): text.rfind("}") + 1]
    try:
        data = json.loads(candidate)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def clean_requirements(raw: list[Any], skills: list[dict[str, Any]], canonical_names: list[str] | None = None) -> list[dict[str, Any]]:
    skill_names = {str(skill.get("name") or "").strip().casefold(): str(skill.get("name")).strip() for skill in skills if skill.get("name")}
    cleaned: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in raw or []:
        if not isinstance(item, dict):
            continue
        name = _canonical(" ".join(str(item.get("skill") or "").split())[:60], canonical_names or [])
        key = name.casefold()
        if len(name) < 2 or key in seen:
            continue
        try:
            level = int(round(float(item.get("level"))))
        except (TypeError, ValueError):
            continue
        level = max(1, min(10, level))
        matches = []
        related = []
        for match in item.get("matches") or []:
            if isinstance(match, dict):
                label, relation = match.get("name"), str(match.get("relation") or "related").lower()
            else:
                label, relation = match, "same"
            found = skill_names.get(str(label or "").strip().casefold())
            if not found or found in matches or found in related:
                continue
            (matches if relation in {"same", "specialization"} else related).append(found)
        resources = []
        for resource in item.get("resources") or []:
            if isinstance(resource, dict) and str(resource.get("name") or "").strip():
                resources.append({
                    "name": str(resource["name"]).strip()[:120],
                    "provider": str(resource.get("provider") or "").strip()[:80] or None,
                    "type": str(resource.get("type") or "course").strip().lower()[:20],
                })
        try:
            hours = max(0, min(400, int(float(item.get("hours_to_close") or 0))))
        except (TypeError, ValueError):
            hours = 0
        seen.add(key)
        cleaned.append({
            "skill": name,
            "level": level,
            "category": " ".join(str(item.get("category") or "General").split())[:40] or "General",
            "why": " ".join(str(item.get("why") or "").split())[:300],
            "market_signal": " ".join(str(item.get("market_signal") or "").split())[:140] or None,
            "matches": matches,
            "related": related[:5],
            "practice_task": " ".join(str(item.get("practice_task") or "").split())[:400] or None,
            "proof": " ".join(str(item.get("proof") or "").split())[:300] or None,
            "resources": resources[:3],
            "hours_to_close": hours,
        })
        if len(cleaned) >= MAX_REQUIREMENTS:
            break
    return cleaned


def _ask_market(prompt: str) -> tuple[str, list[dict[str, str]], list[str]]:
    from app.services.gemini_safe import ask_gemini_grounded_timed

    return ask_gemini_grounded_timed(prompt, timeout=RESEARCH_TIMEOUT_S)


def _research(db: Client, employee_id: str, role: str, skills: list[dict[str, Any]]) -> dict[str, Any] | None:
    employees = db.table("employees").select("role, department").eq("id", employee_id).limit(1).execute().data or [{}]
    canonical = _catalogue_names(db, role)
    vocabulary = _unique(canonical + [str(skill.get("name")) for skill in skills if skill.get("name")])[:220]
    prompt = _prompt(role, employees[0], skills, vocabulary)
    try:
        text, sources, queries = _ask_market(prompt)
    except Exception as exc:
        print(f"[career_market] Research failed for {role}: {exc}")
        return None
    data = _parse(text)
    requirements = clean_requirements((data or {}).get("requirements") or [], skills, canonical)
    if len(requirements) < MIN_REQUIREMENTS:
        print(f"[career_market] Research for {role} returned {len(requirements)} usable requirements; using the library.")
        return None
    return {
        "source": "market",
        "generated_at": _now(),
        "summary": " ".join(str((data or {}).get("summary") or "").split())[:500],
        "sources": sources[:8],
        "queries": queries[:5],
        "requirements": requirements,
    }

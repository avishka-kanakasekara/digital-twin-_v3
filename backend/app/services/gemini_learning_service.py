"""
Gemini-powered Learning Hub intelligence.

All structured Gemini calls for paths, feed, skill gaps, and AI coach live here.
Uses Vertex AI via gemini_client / ask_gemini_timed — never call genai from routers.

JSON contract:
  - Prompt asks for application/json only
  - Parse + validate against expected keys
  - Retry once on invalid schema
  - Fall back to deterministic rule-based results (never 500 / never corrupt DB)
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

from supabase import Client

from app.services.gemini_safe import ask_gemini_timed

logger = logging.getLogger("gemini_learning")

FEED_TTL_HOURS = 24
GEMINI_TIMEOUT_S = 15.0
GEMINI_PATH_TIMEOUT_S = 45.0


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _clean_json(text: str) -> Any:
    raw = (text or "").strip()
    if not raw:
        raise ValueError("empty gemini response")
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def _ask_json(prompt: str, timeout: float = GEMINI_TIMEOUT_S) -> Any | None:
    """Call Gemini expecting JSON. Retry once. Return None on failure."""
    full = (
        prompt
        + "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown fences, no commentary."
    )
    for attempt in range(2):
        raw = ask_gemini_timed(full, timeout=timeout, fallback="")
        if not raw:
            logger.warning("gemini_learning empty response attempt=%s", attempt + 1)
            continue
        try:
            return _clean_json(raw)
        except Exception as exc:
            logger.warning("gemini_learning JSON parse failed attempt=%s: %s", attempt + 1, exc)
    return None


def _employee_context(sb: Client, employee_id: str) -> dict[str, Any]:
    emp = sb.table("employees").select(
        "id, full_name, role, department, headline"
    ).eq("id", employee_id).execute()
    employee = emp.data[0] if emp.data else {"id": employee_id, "full_name": "Employee", "role": "Engineer"}

    goal = sb.table("career_goals").select("target_role, timeline, focus_area").eq(
        "employee_id", employee_id
    ).eq("is_active", True).limit(1).execute()
    active_goal = goal.data[0] if goal.data else {}

    skills = sb.table("skills").select(
        "name, category, proficiency, target_level, verified"
    ).eq("employee_id", employee_id).execute().data or []

    completed = sb.table("employee_courses").select(
        "course_id, status, progress"
    ).eq("employee_id", employee_id).execute().data or []
    course_ids = [c["course_id"] for c in completed if c.get("course_id")]
    course_map = {}
    if course_ids:
        rows = sb.table("courses").select("id, title").in_("id", course_ids).execute().data or []
        course_map = {r["id"]: r.get("title") for r in rows}

    recent_completed = [
        course_map.get(c["course_id"], c["course_id"])
        for c in completed
        if c.get("status") == "completed"
    ][:8]

    gaps = []
    for s in skills:
        try:
            cur = int(s.get("proficiency") or 0)
            tgt = int(s.get("target_level") or 0)
        except (TypeError, ValueError):
            continue
        if tgt <= 10:
            tgt *= 10
        if cur <= 10:
            cur *= 10
        if tgt > cur:
            gaps.append({
                "skill": s["name"],
                "category": s.get("category") or "General",
                "current_level": cur,
                "target_level": tgt,
                "gap": tgt - cur,
            })
    gaps.sort(key=lambda g: g["gap"], reverse=True)

    return {
        "employee": employee,
        "target_role": active_goal.get("target_role") or "Senior Engineer",
        "timeline": active_goal.get("timeline") or "12-18 Months",
        "focus_area": active_goal.get("focus_area"),
        "skills": skills,
        "gaps": gaps[:12],
        "recent_completed": recent_completed,
        "role": employee.get("role") or "Engineer",
    }


def _catalog_summary(sb: Client, limit: int = 40) -> list[dict]:
    rows = sb.table("courses").select(
        "id, title, provider, hours, level, tags, description, rating"
    ).order("rating", desc=True).limit(limit).execute().data or []
    out = []
    for c in rows:
        tags = c.get("tags") or []
        if not isinstance(tags, list):
            tags = []
        out.append({
            "id": c["id"],
            "title": c.get("title"),
            "provider": c.get("provider"),
            "hours": float(c.get("hours") or 4),
            "level": c.get("level"),
            "tags": tags[:6],
            "rating": float(c.get("rating") or 0),
        })
    return out


def _context_hash(ctx: dict[str, Any]) -> str:
    payload = {
        "target_role": ctx.get("target_role"),
        "gaps": [(g["skill"], g["gap"]) for g in ctx.get("gaps", [])[:8]],
        "recent": ctx.get("recent_completed", [])[:5],
        "role": ctx.get("role"),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:24]


# ─── Learning score ────────────────────────────────────────────

def compute_learning_score(
    *,
    courses_completed: int,
    courses_in_progress: int,
    hours_year: int,
    streak_days: int,
    gap_closure_pct: float,
    recency_boost: float,
) -> int:
    """
    Weighted learning score (0–100), computed server-side.

    Formula (weights sum to 1.0 before clamp):
      completion   35%  — completed / (completed + in_progress), or 0 if none
      streak       20%  — min(streak_days, 30) / 30
      gap_closure  25%  — fraction of skill gaps closed toward target (0–1)
      hours        10%  — min(hours_year, 80) / 80
      recency      10%  — 1.0 if activity in last 14 days else 0.35

    Final = round(100 * weighted sum), clamped to [0, 100].
    """
    total_enrolled = courses_completed + courses_in_progress
    completion = (courses_completed / total_enrolled) if total_enrolled else 0.0
    streak = min(max(streak_days, 0), 30) / 30.0
    gap_c = max(0.0, min(1.0, gap_closure_pct))
    hours = min(max(hours_year, 0), 80) / 80.0
    recency = max(0.0, min(1.0, recency_boost))

    score = (
        0.35 * completion
        + 0.20 * streak
        + 0.25 * gap_c
        + 0.10 * hours
        + 0.10 * recency
    )
    return int(max(0, min(100, round(score * 100))))


def gap_closure_ratio(skills: list[dict]) -> float:
    """Average progress toward target across skills that have a target."""
    ratios = []
    for s in skills:
        try:
            cur = float(s.get("proficiency") or 0)
            tgt = float(s.get("target_level") or 0)
        except (TypeError, ValueError):
            continue
        if tgt <= 0:
            continue
        if tgt <= 10:
            tgt *= 10
        if cur <= 10:
            cur *= 10
        ratios.append(min(1.0, cur / tgt))
    if not ratios:
        return 0.4
    return sum(ratios) / len(ratios)


def recency_boost(sb: Client, employee_id: str) -> float:
    rows = sb.table("employee_courses").select("started_at, completed_at").eq(
        "employee_id", employee_id
    ).execute().data or []
    cutoff = _utc_now() - timedelta(days=14)
    for r in rows:
        for key in ("completed_at", "started_at"):
            val = r.get(key)
            if not val:
                continue
            try:
                dt = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                if dt >= cutoff:
                    return 1.0
            except (ValueError, TypeError):
                continue
    return 0.35


# ─── Path generation ──────────────────────────────────────────

def generate_ai_paths(sb: Client, employee_id: str, goal_text: str | None = None) -> list[dict]:
    """
    Gemini-generate learning paths as strict JSON, persist with is_ai_recommended=True.
    Falls back to rule-based ensure_learning_paths on failure.
    """
    from app.services.learning_engine import ensure_learning_paths, rule_based_paths

    ctx = _employee_context(sb, employee_id)
    catalog = _catalog_summary(sb)
    if goal_text:
        ctx["target_role"] = goal_text.strip()[:120]

    prompt = f"""You are an expert L&D career coach for an Employee Digital Twin platform.
Build 1–2 structured learning paths for this employee.

Employee profile (ground truth — do not invent different stats):
{json.dumps({
    "name": ctx["employee"].get("full_name"),
    "current_role": ctx["role"],
    "target_role": ctx["target_role"],
    "timeline": ctx["timeline"],
    "skill_gaps": ctx["gaps"][:8],
    "recently_completed": ctx["recent_completed"],
}, indent=2)}

Available catalog courses (prefer these ids when recommending):
{json.dumps(catalog[:25], indent=2)}

Return JSON object:
{{
  "paths": [
    {{
      "title": string,
      "description": string,
      "estimated_hours": number,
      "tags": string[],
      "course_ids": string[],  // 2-5 ids from catalog when possible
      "course_titles": string[], // fallback titles if ids unknown
      "platform": string,
      "instructor": string,
      "rationale": string
    }}
  ]
}}
"""

    data = _ask_json(prompt, timeout=GEMINI_PATH_TIMEOUT_S)
    paths_raw = None
    if isinstance(data, dict):
        paths_raw = data.get("paths")
    elif isinstance(data, list):
        paths_raw = data

    if not isinstance(paths_raw, list) or not paths_raw:
        logger.warning("gemini path generation fallback employee=%s", employee_id)
        sb.table("learning_paths").delete().eq("employee_id", employee_id).eq(
            "is_ai_recommended", True
        ).execute()
        return rule_based_paths(sb, employee_id, force=True)

    # Replace prior AI paths
    sb.table("learning_paths").delete().eq("employee_id", employee_id).eq(
        "is_ai_recommended", True
    ).execute()

    catalog_by_id = {c["id"]: c for c in catalog}
    catalog_by_title = {str(c["title"]).lower(): c for c in catalog if c.get("title")}
    created: list[dict] = []
    colors = ["#0ea5e9", "#6366f1", "#10b981"]

    for i, p in enumerate(paths_raw[:2]):
        if not isinstance(p, dict) or not p.get("title"):
            continue
        course_ids: list[str] = []
        for cid in (p.get("course_ids") or [])[:5]:
            if cid in catalog_by_id:
                course_ids.append(cid)
        if not course_ids:
            for title in (p.get("course_titles") or [])[:5]:
                match = catalog_by_title.get(str(title).lower())
                if match:
                    course_ids.append(match["id"])
        if not course_ids:
            course_ids = [c["id"] for c in catalog[:3]]

        hours = p.get("estimated_hours")
        try:
            hours = float(hours)
        except (TypeError, ValueError):
            hours = sum(catalog_by_id.get(cid, {}).get("hours", 4) for cid in course_ids) or 12

        tags = p.get("tags") if isinstance(p.get("tags"), list) else [ctx["target_role"]]
        row = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "title": str(p["title"])[:160],
            "description": str(p.get("description") or "")[:600],
            "progress": 0,
            "total_courses": max(1, len(course_ids)),
            "completed_courses": 0,
            "estimated_hours": round(hours, 1),
            "due_date": ctx.get("timeline"),
            "tags": tags[:6],
            "color": colors[i % len(colors)],
            "is_ai_recommended": True,
            "platform": str(p.get("platform") or "Digital Twin Academy")[:80],
            "instructor": str(p.get("instructor") or "AI Learning Coach")[:80],
            "course_ids": course_ids,
            "ai_rationale": str(p.get("rationale") or "")[:400],
            "created_at": _utc_now().isoformat(),
        }
        try:
            sb.table("learning_paths").insert(row).execute()
            created.append(row)
        except Exception as exc:
            # Older schemas without course_ids / ai_rationale columns
            logger.warning("path insert with extras failed, retrying slim row: %s", exc)
            slim = {k: v for k, v in row.items() if k not in ("course_ids", "ai_rationale")}
            sb.table("learning_paths").insert(slim).execute()
            created.append(slim)

    if not created:
        return rule_based_paths(sb, employee_id, force=True)

    # Keep non-AI paths; return all
    all_paths = sb.table("learning_paths").select("*").eq("employee_id", employee_id).order(
        "is_ai_recommended", desc=True
    ).execute()
    return all_paths.data or created


# ─── Feed ──────────────────────────────────────────────────────

def _rule_feed(sb: Client, employee_id: str, ctx: dict[str, Any]) -> list[dict]:
    from app.services.learning_engine import build_learning_feed_rules
    return build_learning_feed_rules(sb, employee_id, ctx)


def generate_learning_feed(sb: Client, employee_id: str, *, force: bool = False) -> list[dict]:
    ctx = _employee_context(sb, employee_id)
    h = _context_hash(ctx)

    if not force:
        try:
            cached = sb.table("learning_feed_cache").select("*").eq(
                "employee_id", employee_id
            ).execute()
            if cached.data:
                row = cached.data[0]
                generated = row.get("generated_at")
                fresh = False
                if generated:
                    try:
                        dt = datetime.fromisoformat(str(generated).replace("Z", "+00:00"))
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        fresh = dt >= _utc_now() - timedelta(hours=FEED_TTL_HOURS)
                    except (ValueError, TypeError):
                        fresh = False
                if fresh and row.get("input_hash") == h and isinstance(row.get("payload"), list):
                    return row["payload"]
        except Exception as exc:
            logger.warning("feed cache read failed: %s", exc)

    catalog = _catalog_summary(sb, limit=30)
    prompt = f"""You are a learning recommender for an employee digital twin.
Create a ranked learning feed (mix of course, article, video, paper, podcast).

Grounded employee data (do not invent different skills/stats):
{json.dumps({
    "role": ctx["role"],
    "target_role": ctx["target_role"],
    "skill_gaps": ctx["gaps"][:8],
    "recently_completed": ctx["recent_completed"],
}, indent=2)}

Catalog courses to prefer for type=course (use real id):
{json.dumps(catalog[:20], indent=2)}

Return JSON:
{{
  "items": [
    {{
      "id": string,  // catalog course id when type=course, else unique slug
      "type": "course"|"article"|"video"|"paper"|"podcast",
      "title": string,
      "source": string,
      "read_time": string,
      "relevance": number,  // 0-100
      "tags": string[],
      "emoji": string,
      "published": string
    }}
  ]
}}
Return 6–8 items sorted by relevance descending.
"""

    data = _ask_json(prompt, timeout=GEMINI_TIMEOUT_S)
    items: list[dict] = []
    raw_items = data.get("items") if isinstance(data, dict) else None
    if isinstance(raw_items, list):
        for it in raw_items[:8]:
            if not isinstance(it, dict) or not it.get("title"):
                continue
            try:
                rel = int(it.get("relevance") or 70)
            except (TypeError, ValueError):
                rel = 70
            items.append({
                "id": str(it.get("id") or uuid.uuid4()),
                "type": str(it.get("type") or "article"),
                "title": str(it["title"])[:200],
                "source": str(it.get("source") or "AI Learning Feed")[:80],
                "read_time": str(it.get("read_time") or "10 min")[:40],
                "relevance": max(0, min(100, rel)),
                "tags": (it.get("tags") if isinstance(it.get("tags"), list) else [])[:4],
                "emoji": str(it.get("emoji") or "📄")[:8],
                "color": "#0ea5e9",
                "published": str(it.get("published") or f"For {ctx['target_role']}")[:80],
            })

    if not items:
        logger.warning("gemini feed fallback employee=%s", employee_id)
        items = _rule_feed(sb, employee_id, ctx)

    items.sort(key=lambda x: x.get("relevance", 0), reverse=True)

    try:
        sb.table("learning_feed_cache").upsert({
            "employee_id": employee_id,
            "payload": items,
            "input_hash": h,
            "generated_at": _utc_now().isoformat(),
        }).execute()
    except Exception as exc:
        logger.warning("feed cache write failed: %s", exc)

    return items


def top_ai_course_recommendations(sb: Client, employee_id: str, limit: int = 2) -> list[dict]:
    """Top catalog courses by feed relevance (Gemini or rules)."""
    feed = generate_learning_feed(sb, employee_id, force=False)
    courses = {c["id"]: c for c in (sb.table("courses").select("*").execute().data or [])}
    out = []
    for item in feed:
        if item.get("type") != "course":
            continue
        course = courses.get(item["id"])
        if not course:
            # try title match
            title = str(item.get("title") or "").lower()
            course = next((c for c in courses.values() if str(c.get("title") or "").lower() == title), None)
        if not course:
            continue
        row = dict(course)
        row["relevance"] = item.get("relevance", 80)
        row.setdefault("status", "available")
        row.setdefault("progress", 0)
        out.append(row)
        if len(out) >= limit:
            break
    if len(out) < limit:
        # pad from high-rated catalog
        for c in sorted(courses.values(), key=lambda x: float(x.get("rating") or 0), reverse=True):
            if any(o["id"] == c["id"] for o in out):
                continue
            row = dict(c)
            row["relevance"] = 72
            row.setdefault("status", "available")
            row.setdefault("progress", 0)
            out.append(row)
            if len(out) >= limit:
                break
    return out


# ─── Skill gaps (Gemini enrichment) ────────────────────────────

def compute_db_skill_gaps(sb: Client, employee_id: str) -> dict[str, Any]:
    """Fast deterministic gaps from skills (+ career skill_gaps if present). No Gemini."""
    ctx = _employee_context(sb, employee_id)
    catalog = _catalog_summary(sb, limit=30)
    paths = []
    try:
        paths = sb.table("learning_paths").select("id, title, tags").eq(
            "employee_id", employee_id
        ).execute().data or []
    except Exception:
        paths = []

    # Prefer career-coach persisted gaps when available
    career_gaps: list[dict] = []
    try:
        goal = sb.table("career_goals").select("id, target_role").eq(
            "employee_id", employee_id
        ).eq("is_active", True).limit(1).execute()
        if goal.data:
            rows = sb.table("skill_gaps").select("*").eq(
                "goal_id", goal.data[0]["id"]
            ).execute().data or []
            for row in rows:
                try:
                    current = int(row.get("current_level") or 0)
                    target = int(row.get("target_level") or 0)
                except (TypeError, ValueError):
                    continue
                if target <= 10:
                    target *= 10
                if current <= 10:
                    current *= 10
                gap = max(0, target - current)
                if gap <= 0:
                    continue
                career_gaps.append({
                    "skill": row.get("skill") or "Skill",
                    "current_level": current,
                    "target_level": target,
                    "gap": gap,
                    "priority": row.get("priority") or (
                        "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
                    ),
                    "category": row.get("category") or "General",
                    "color": "#0ea5e9",
                    "rationale": row.get("reason") or row.get("rationale") or (
                        f"Close the {gap}-point gap toward {goal.data[0].get('target_role')}."
                    ),
                    "recommended_courses": [],
                    "recommended_paths": [],
                })
    except Exception as exc:
        logger.warning("career skill_gaps read failed: %s", exc)

    # Primary: gaps from employee skills (real proficiency / target_level)
    base: list[dict] = []
    seen = set()
    for g in ctx["gaps"]:
        priority = "Critical" if g["gap"] >= 40 else "High" if g["gap"] >= 25 else "Medium"
        key = str(g["skill"]).lower()
        seen.add(key)
        base.append({
            **g,
            "priority": priority,
            "color": "#7c3aed" if g.get("category") == "AI" else "#06b6d4" if g.get("category") == "Cloud" else "#f59e0b",
            "rationale": f"Close the {g['gap']}-point gap in {g['skill']} for {ctx['target_role']}.",
            "recommended_courses": [],
            "recommended_paths": [],
        })

    # Supplement with career-coach gaps for skills not already present
    for g in career_gaps:
        key = str(g["skill"]).lower()
        if key in seen:
            # If career row has a better rationale / priority, lightly merge
            for row in base:
                if str(row["skill"]).lower() == key and not row.get("rationale"):
                    row["rationale"] = g.get("rationale") or row.get("rationale")
            continue
        seen.add(key)
        # Prefer live skill proficiency when the career gap shows 0 current
        for s in ctx.get("skills") or []:
            if str(s.get("name") or "").lower() == key:
                try:
                    cur = int(s.get("proficiency") or 0)
                except (TypeError, ValueError):
                    cur = 0
                if cur <= 10:
                    cur *= 10
                if cur > 0:
                    g["current_level"] = cur
                    g["gap"] = max(0, int(g.get("target_level") or 0) - cur)
                break
        if g.get("gap", 0) > 0:
            base.append(g)

    base.sort(key=lambda x: (0 if int(x.get("current_level") or 0) > 0 else 1, -int(x.get("gap") or 0)))
    base = base[:12]

    # If still empty but we have a target role + skills with proficiency only,
    # synthesize targets at 85 for skills below that bar.
    if not base:
        for s in ctx.get("skills") or []:
            try:
                cur = int(s.get("proficiency") or 0)
            except (TypeError, ValueError):
                continue
            if cur <= 10:
                cur *= 10
            target = 85
            gap = max(0, target - cur)
            if gap < 10:
                continue
            priority = "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
            base.append({
                "skill": s.get("name") or "Skill",
                "category": s.get("category") or "General",
                "current_level": cur,
                "target_level": target,
                "gap": gap,
                "priority": priority,
                "color": "#0ea5e9",
                "rationale": f"Raise {s.get('name')} toward the bar for {ctx['target_role']}.",
                "recommended_courses": [],
                "recommended_paths": [],
            })
        base.sort(key=lambda x: x["gap"], reverse=True)
        base = base[:8]

    # Keyword-link courses/paths without Gemini
    for g in base:
        skill_l = str(g["skill"]).lower()
        recs = []
        for c in catalog:
            blob = f"{c.get('title', '')} {' '.join(map(str, c.get('tags') or []))}".lower()
            if skill_l in blob or any(tok and tok in blob for tok in skill_l.split() if len(tok) > 3):
                recs.append({"id": c["id"], "title": c["title"]})
            if len(recs) >= 2:
                break
        g["recommended_courses"] = recs
        linked = []
        for p in paths:
            tags = p.get("tags") or []
            blob = f"{p.get('title', '')} {' '.join(map(str, tags))}".lower()
            if skill_l in blob:
                linked.append({"id": p["id"], "title": p["title"]})
        g["recommended_paths"] = linked[:2]

    return {"target_role": ctx.get("target_role"), "gaps": base}


def enrich_skill_gaps(sb: Client, employee_id: str, *, use_gemini: bool = True) -> dict[str, Any]:
    """
    Return skill gaps. Always computes a fast DB/rule result first.
    Gemini is optional and skipped when use_gemini=False or when Gemini fails/times out.
    """
    fast = compute_db_skill_gaps(sb, employee_id)
    if not use_gemini:
        return fast

    # Keep Gemini optional and short — never block the UI for 30s+
    ctx = _employee_context(sb, employee_id)
    catalog = _catalog_summary(sb, limit=20)
    if not fast.get("gaps") and not ctx.get("target_role"):
        return fast

    prompt = f"""You are analyzing skill gaps for target role "{ctx['target_role']}".
Employee current skills and measured gaps (ground truth):
{json.dumps(fast.get('gaps')[:10], indent=2)}

Catalog courses:
{json.dumps(catalog[:15], indent=2)}

Return JSON:
{{
  "target_role": "{ctx['target_role']}",
  "gaps": [
    {{
      "skill": string,
      "current_level": number,
      "target_level": number,
      "gap": number,
      "priority": "Critical"|"High"|"Medium",
      "category": string,
      "rationale": string,
      "recommended_course_ids": string[],
      "recommended_course_titles": string[]
    }}
  ]
}}
Prioritize 6–8 gaps. Keep current_level honest.
"""

    data = _ask_json(prompt, timeout=8.0)
    if not isinstance(data, dict) or not isinstance(data.get("gaps"), list) or not data["gaps"]:
        return fast

    catalog_by_id = {c["id"]: c for c in catalog}
    gaps_out: list[dict] = []
    for g in data["gaps"][:10]:
        if not isinstance(g, dict) or not g.get("skill"):
            continue
        try:
            current = int(g.get("current_level") or 0)
            target = int(g.get("target_level") or 0)
        except (TypeError, ValueError):
            continue
        if target <= 10:
            target *= 10
        if current <= 10:
            current *= 10
        gap = max(0, target - current)
        if gap <= 0:
            continue
        recs = []
        for cid in (g.get("recommended_course_ids") or [])[:2]:
            if cid in catalog_by_id:
                recs.append({"id": cid, "title": catalog_by_id[cid]["title"]})
        if not recs:
            for title in (g.get("recommended_course_titles") or [])[:2]:
                recs.append({"id": None, "title": str(title)})
        priority = g.get("priority") if g.get("priority") in ("Critical", "High", "Medium") else (
            "Critical" if gap >= 40 else "High" if gap >= 25 else "Medium"
        )
        gaps_out.append({
            "skill": str(g["skill"]),
            "current_level": current,
            "target_level": target,
            "gap": gap,
            "priority": priority,
            "category": str(g.get("category") or "General"),
            "color": "#7c3aed",
            "rationale": str(g.get("rationale") or "")[:220],
            "recommended_courses": recs,
            "recommended_paths": [],
        })

    if not gaps_out:
        return fast

    # Preserve path links from fast compute when possible
    path_by_skill = {
        str(g["skill"]).lower(): g.get("recommended_paths") or []
        for g in fast.get("gaps") or []
    }
    for g in gaps_out:
        g["recommended_paths"] = path_by_skill.get(g["skill"].lower(), [])

    return {
        "target_role": data.get("target_role") or fast.get("target_role") or ctx["target_role"],
        "gaps": gaps_out,
    }



# ─── AI Coach chat ─────────────────────────────────────────────

def chat_with_coach(sb: Client, employee_id: str, message: str) -> dict[str, str]:
    ctx = _employee_context(sb, employee_id)
    history = []
    try:
        hist = sb.table("learning_chat_messages").select("role, content").eq(
            "employee_id", employee_id
        ).order("created_at", desc=True).limit(8).execute().data or []
        history = list(reversed(hist))
    except Exception as exc:
        logger.warning("chat history read failed: %s", exc)

    prompt = f"""You are GrowthPath AI Coach inside an Employee Digital Twin Learning Hub.
Answer helpfully and specifically. Ground every recommendation in the employee's REAL profile below — never invent different completion stats or skills.

Profile:
{json.dumps({
    "name": ctx["employee"].get("full_name"),
    "current_role": ctx["role"],
    "target_role": ctx["target_role"],
    "skill_gaps": ctx["gaps"][:8],
    "recently_completed": ctx["recent_completed"],
}, indent=2)}

Recent conversation:
{json.dumps(history, indent=2)}

User question: {message}

Respond as plain text (not JSON), concise (under 250 words), with concrete next steps.
"""

    answer = ask_gemini_timed(prompt, timeout=GEMINI_TIMEOUT_S, fallback="")
    if not answer:
        top = ctx["gaps"][:3]
        gap_txt = ", ".join(g["skill"] for g in top) or "your target-role skills"
        answer = (
            f"Based on your profile aiming for {ctx['target_role']}, focus next on {gap_txt}. "
            f"Open Skill Gaps for priorities, then generate an AI path or enroll in a matching course."
        )

    user_id = str(uuid.uuid4())
    asst_id = str(uuid.uuid4())
    now = _utc_now().isoformat()
    try:
        sb.table("learning_chat_messages").insert([
            {"id": user_id, "employee_id": employee_id, "role": "user", "content": message, "created_at": now},
            {"id": asst_id, "employee_id": employee_id, "role": "assistant", "content": answer, "created_at": now},
        ]).execute()
    except Exception as exc:
        logger.warning("chat persist failed: %s", exc)

    return {"role": "assistant", "content": answer}

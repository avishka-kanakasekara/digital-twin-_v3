from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from calendar import month_abbr

from supabase import Client


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def compute_learning_hours(sb: Client, employee_id: str) -> tuple[int, int, list[dict]]:
    """Hours from enrolled courses, weighted by progress."""
    enrollments = sb.table("employee_courses").select("*").eq("employee_id", employee_id).execute()
    courses = {c["id"]: c for c in (sb.table("courses").select("id, hours, title").execute().data or [])}

    now = _utc_now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    hours_month = 0.0
    hours_year = 0.0
    monthly: dict[str, float] = {}

    for enr in enrollments.data or []:
        course = courses.get(enr.get("course_id"), {})
        course_hours = float(course.get("hours") or 4)
        progress = max(0, min(100, int(enr.get("progress") or 0)))
        earned = course_hours * (progress / 100.0)
        if enr.get("status") == "completed":
            earned = course_hours

        started = _parse_dt(enr.get("completed_at") or enr.get("started_at")) or now
        if started >= year_start:
            hours_year += earned
        if started >= month_start:
            hours_month += earned

        key = started.strftime("%b")
        monthly[key] = monthly.get(key, 0) + earned

    months = []
    for i in range(5, -1, -1):
        d = (now.replace(day=1) - timedelta(days=i * 28))
        label = month_abbr[d.month]
        months.append({"month": label, "hours": int(round(monthly.get(label, 0)))})

    return int(round(hours_month)), int(round(hours_year)), months


def build_learning_feed_rules(sb: Client, employee_id: str, ctx: dict | None = None) -> list[dict]:
    """Deterministic catalog-based feed (Gemini fallback)."""
    gaps_res = sb.table("skills").select("name, proficiency, target_level, category").eq(
        "employee_id", employee_id
    ).execute()
    gap_names = []
    for skill in gaps_res.data or []:
        target = skill.get("target_level") or 0
        current = skill.get("proficiency") or 0
        if target and target > current:
            gap_names.append(skill["name"])

    goal = sb.table("career_goals").select("target_role").eq("employee_id", employee_id).eq("is_active", True).execute()
    target_role = (
        (ctx or {}).get("target_role")
        or (goal.data[0]["target_role"] if goal.data else "your next role")
    )

    courses = sb.table("courses").select("*").order("rating", desc=True).limit(12).execute()
    feed = []
    for idx, course in enumerate(courses.data or []):
        tags = course.get("tags") or []
        if not isinstance(tags, list):
            tags = []
        relevance = 70
        for name in gap_names:
            hay = f"{course.get('title', '')} {' '.join(str(t) for t in tags)}".lower()
            if name.lower() in hay:
                relevance = min(99, relevance + 12)
        if gap_names and idx < 3:
            relevance = min(99, relevance + 8)

        hours = course.get("hours") or 2
        feed.append({
            "id": course["id"],
            "type": "course",
            "title": course.get("title"),
            "source": course.get("provider") or "Learning Catalog",
            "read_time": f"{hours}h",
            "relevance": relevance,
            "tags": tags[:3] or [course.get("level") or "General"],
            "emoji": course.get("emoji") or "🎓",
            "color": course.get("color") or "#0ea5e9",
            "published": f"Aligned to {target_role}",
        })

    feed.sort(key=lambda x: x["relevance"], reverse=True)
    return feed[:6]


def build_learning_feed(sb: Client, employee_id: str) -> list[dict]:
    """Prefer Gemini-cached feed; fall back to rules."""
    try:
        from app.services.gemini_learning_service import generate_learning_feed
        return generate_learning_feed(sb, employee_id, force=False)
    except Exception:
        return build_learning_feed_rules(sb, employee_id)


def rule_based_paths(sb: Client, employee_id: str, *, force: bool = False) -> list[dict]:
    """Create deterministic paths from gaps + catalog."""
    existing = sb.table("learning_paths").select("*").eq("employee_id", employee_id).order(
        "is_ai_recommended", desc=True
    ).execute()
    if existing.data and not force:
        return existing.data

    if force:
        sb.table("learning_paths").delete().eq("employee_id", employee_id).eq(
            "is_ai_recommended", True
        ).execute()

    goal = sb.table("career_goals").select("target_role, timeline").eq(
        "employee_id", employee_id
    ).eq("is_active", True).execute()
    target_role = goal.data[0]["target_role"] if goal.data else "Senior Engineer"
    timeline = (goal.data[0].get("timeline") if goal.data else None) or "12-18 Months"

    skills = sb.table("skills").select("name, proficiency, target_level, category").eq(
        "employee_id", employee_id
    ).execute()
    gap_skills = []
    for s in skills.data or []:
        target = s.get("target_level") or 0
        current = s.get("proficiency") or 0
        if target > current:
            gap_skills.append(s)

    courses = sb.table("courses").select("*").limit(20).execute().data or []
    if not courses and not gap_skills:
        return existing.data or []

    colors = ["#0ea5e9", "#6366f1", "#10b981"]
    created = []

    primary_tags = [s["name"] for s in gap_skills[:4]] or [target_role]
    matching = []
    for course in courses:
        tags = course.get("tags") or []
        blob = f"{course.get('title', '')} {' '.join(map(str, tags))}".lower()
        if any(t.lower() in blob for t in primary_tags):
            matching.append(course)
    if not matching:
        matching = courses[:3]

    path_id = str(uuid.uuid4())
    hours = sum(float(c.get("hours") or 4) for c in matching[:4])
    row = {
        "id": path_id,
        "employee_id": employee_id,
        "title": f"Path to {target_role}",
        "description": f"Personalized sequence covering your highest-priority gaps for {target_role}.",
        "progress": 0,
        "total_courses": max(1, len(matching[:4])),
        "completed_courses": 0,
        "estimated_hours": round(hours, 1),
        "due_date": timeline,
        "tags": primary_tags[:4],
        "color": colors[0],
        "is_ai_recommended": True,
        "platform": "Digital Twin Academy",
        "instructor": "AI Career Coach",
        "created_at": _utc_now().isoformat(),
    }
    sb.table("learning_paths").insert(row).execute()
    created.append(row)

    if len(matching) > 2:
        extra = matching[2:5]
        extra_id = str(uuid.uuid4())
        extra_row = {
            "id": extra_id,
            "employee_id": employee_id,
            "title": "Adjacent Skills Boost",
            "description": "Supporting courses that strengthen neighbouring capabilities on your roadmap.",
            "progress": 0,
            "total_courses": max(1, len(extra)),
            "completed_courses": 0,
            "estimated_hours": round(sum(float(c.get("hours") or 3) for c in extra), 1),
            "due_date": timeline,
            "tags": [c.get("level") or "Applied" for c in extra][:3],
            "color": colors[1],
            "is_ai_recommended": False,
            "platform": "Digital Twin Academy",
            "instructor": "Learning Hub",
            "created_at": _utc_now().isoformat(),
        }
        sb.table("learning_paths").insert(extra_row).execute()
        created.append(extra_row)

    all_paths = sb.table("learning_paths").select("*").eq("employee_id", employee_id).order(
        "is_ai_recommended", desc=True
    ).execute()
    return all_paths.data or created


def ensure_learning_paths(sb: Client, employee_id: str) -> list[dict]:
    existing = sb.table("learning_paths").select("*").eq("employee_id", employee_id).order(
        "is_ai_recommended", desc=True
    ).execute()
    if existing.data:
        return existing.data
    return rule_based_paths(sb, employee_id, force=False)

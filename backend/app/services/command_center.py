"""Employee Twin command center — fast live snapshot across career, learning, XP, peers.

No Gemini calls. Every section is independently try/except'd so a missing table
never blanks the dashboard.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any

from supabase import Client

_PEER_TYPE = "peer_recommendation"


def _safe(fn, fallback):
    try:
        return fn()
    except Exception as exc:
        print(f"[command_center] {fn.__name__ if hasattr(fn, '__name__') else 'block'} skipped: {exc}")
        return fallback


def _iso_today_start() -> str:
    return datetime.combine(datetime.now(timezone.utc).date(), datetime.min.time()).replace(
        tzinfo=timezone.utc
    ).isoformat()


def build_command_center(sb: Client, employee_id: str) -> dict[str, Any]:
    emp_rows = sb.table("employees").select("*").eq("id", employee_id).limit(1).execute().data or []
    if not emp_rows:
        return {"ok": False, "detail": "Employee not found"}
    emp = emp_rows[0]

    twin = _twin_block(sb, emp, employee_id)
    career = _career_block(sb, employee_id)
    learning = _learning_block(sb, employee_id)
    game = _game_block(sb, employee_id)
    social = _social_block(sb, employee_id)
    activity = _activity_block(sb, employee_id)
    focus = _weekly_focus(twin, career, learning, game, social)

    return {
        "employee_id": employee_id,
        "employee_name": emp.get("full_name"),
        "role": emp.get("role"),
        "department": emp.get("department"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "twin": twin,
        "career": career,
        "learning": learning,
        "gamification": game,
        "social": social,
        "weekly_focus": focus,
        "activity": activity,
        "checked_in_today": bool(game.get("checked_in_today")),
    }


def _twin_block(sb: Client, emp: dict, employee_id: str) -> dict[str, Any]:
    fields = [
        emp.get("full_name"), emp.get("email"), emp.get("department"),
        emp.get("role"), emp.get("team"), emp.get("location"),
        emp.get("biography"), emp.get("education"), emp.get("languages"),
        emp.get("phone"), emp.get("headline"), emp.get("years_experience"),
    ]
    completeness = int((sum(1 for f in fields if f) / len(fields)) * 100)

    def ks():
        r = sb.table("knowledge_sources").select("id", count="exact").eq("employee_id", employee_id).execute()
        return r.count or 0

    def skills():
        r = sb.table("skills").select("id", count="exact").eq("employee_id", employee_id).execute()
        return r.count or 0

    def projects():
        r = sb.table("projects").select("id, status").eq("employee_id", employee_id).execute()
        rows = r.data or []
        active = [p for p in rows if str(p.get("status") or "").lower() not in ("completed", "done")]
        return len(rows), len(active)

    ks_count = _safe(ks, 0)
    skill_count = _safe(skills, 0)
    total_projects, active_projects = _safe(projects, (0, 0))
    freshness = "High" if ks_count >= 3 else "Medium" if ks_count >= 1 else "Low"
    confidence = int(emp.get("ai_confidence") or 0)
    health = min(100, int(completeness * 0.4 + confidence * 0.3 + min(ks_count * 10, 30)))
    missing = []
    if not emp.get("headline"):
        missing.append("Add a professional headline")
    if not emp.get("biography"):
        missing.append("Write a short biography")
    if ks_count == 0:
        missing.append("Upload a CV or project file")
    if skill_count < 3:
        missing.append("Add at least 3 skills")

    return {
        "health": health,
        "completeness": completeness,
        "ai_confidence": confidence,
        "knowledge_freshness": freshness,
        "knowledge_sources": ks_count,
        "skills": skill_count,
        "projects_total": total_projects,
        "projects_active": active_projects,
        "missing": missing[:4],
        "quality": "Excellent" if health >= 80 else "Good" if health >= 60 else "Needs data",
    }


def _career_block(sb: Client, employee_id: str) -> dict[str, Any]:
    def load():
        goals = (
            sb.table("career_goals")
            .select("*")
            .eq("employee_id", employee_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not goals:
            return {
                "has_goal": False,
                "target_role": None,
                "timeline": None,
                "readiness_score": 0,
                "next_action": None,
                "top_gap": None,
                "open_steps": 0,
            }
        goal = goals[0]
        gid = goal["id"]
        steps = (
            sb.table("career_roadmap_steps")
            .select("*")
            .eq("career_goal_id", gid)
            .order("step_order")
            .execute()
            .data
            or []
        )
        open_steps = [s for s in steps if str(s.get("status") or "upcoming") in ("upcoming", "in_progress")]
        next_step = open_steps[0] if open_steps else None
        gaps = (
            sb.table("skill_gaps")
            .select("*")
            .eq("goal_id", gid)
            .order("gap", desc=True)
            .limit(3)
            .execute()
            .data
            or []
        )
        top_gap = gaps[0] if gaps else None
        next_action = None
        if next_step:
            next_action = {
                "title": next_step.get("title"),
                "description": next_step.get("description"),
                "kind": "roadmap",
                "xp_reward": next_step.get("xp_reward") or 75,
                "estimated_hours": next_step.get("estimated_hours") or 0,
            }
        elif top_gap:
            next_action = {
                "title": f"Close the {top_gap.get('skill')} gap",
                "description": top_gap.get("recommended_path"),
                "kind": "skill_gap",
                "xp_reward": 75,
                "estimated_hours": 0,
            }
        return {
            "has_goal": True,
            "target_role": goal.get("target_role"),
            "timeline": goal.get("timeline"),
            "readiness_score": int(goal.get("readiness_score") or 0),
            "next_action": next_action,
            "top_gap": {
                "skill": top_gap.get("skill"),
                "gap": top_gap.get("gap"),
                "current_level": top_gap.get("current_level"),
                "target_level": top_gap.get("target_level"),
                "priority": top_gap.get("priority"),
            } if top_gap else None,
            "open_steps": len(open_steps),
        }

    return _safe(load, {
        "has_goal": False,
        "target_role": None,
        "timeline": None,
        "readiness_score": 0,
        "next_action": None,
        "top_gap": None,
        "open_steps": 0,
    })


def _learning_block(sb: Client, employee_id: str) -> dict[str, Any]:
    def load():
        completed = (
            sb.table("employee_courses")
            .select("id", count="exact")
            .eq("employee_id", employee_id)
            .eq("status", "completed")
            .execute()
        )
        in_progress = (
            sb.table("employee_courses")
            .select("course_id, progress")
            .eq("employee_id", employee_id)
            .eq("status", "in_progress")
            .execute()
            .data
            or []
        )
        paths = (
            sb.table("learning_paths")
            .select("id, title, progress, estimated_hours, is_ai_recommended")
            .eq("employee_id", employee_id)
            .order("progress")
            .limit(5)
            .execute()
            .data
            or []
        )
        active_path = next((p for p in paths if int(p.get("progress") or 0) < 100), paths[0] if paths else None)
        course_title = None
        if in_progress:
            cid = in_progress[0].get("course_id")
            if cid:
                cr = sb.table("courses").select("title").eq("id", cid).limit(1).execute().data or []
                if cr:
                    course_title = cr[0].get("title")
        return {
            "courses_completed": completed.count or 0,
            "courses_in_progress": len(in_progress),
            "active_course": course_title,
            "active_path": {
                "id": active_path.get("id"),
                "title": active_path.get("title"),
                "progress": int(active_path.get("progress") or 0),
            } if active_path else None,
            "paths": len(paths),
        }

    return _safe(load, {
        "courses_completed": 0,
        "courses_in_progress": 0,
        "active_course": None,
        "active_path": None,
        "paths": 0,
    })


def _game_block(sb: Client, employee_id: str) -> dict[str, Any]:
    def load():
        from app.services.gamification_engine import ensure_profile

        profile = ensure_profile(sb, employee_id) or {}
        today = _iso_today_start()
        tx = (
            sb.table("xp_transactions")
            .select("category")
            .eq("employee_id", employee_id)
            .gte("created_at", today)
            .execute()
            .data
            or []
        )
        cats = {t.get("category") for t in tx}
        missions = (
            sb.table("challenges")
            .select("id, title, xp_reward")
            .eq("is_active", True)
            .order("end_date")
            .limit(3)
            .execute()
            .data
            or []
        )
        next_mission = None
        for ch in missions:
            prog = (
                sb.table("challenge_progress")
                .select("progress, completed")
                .eq("employee_id", employee_id)
                .eq("challenge_id", ch["id"])
                .limit(1)
                .execute()
                .data
                or []
            )
            done = bool(prog and prog[0].get("completed"))
            if not done:
                next_mission = {
                    "id": ch["id"],
                    "title": ch.get("title"),
                    "xp": ch.get("xp_reward") or 0,
                    "progress": (prog[0].get("progress") if prog else 0) or 0,
                }
                break
        total_players = profile.get("total_players") or 0
        rank = profile.get("company_rank")
        rank_pct = None
        if rank and total_players:
            rank_pct = max(1, round((rank / total_players) * 100))
        return {
            "level": profile.get("level") or 1,
            "xp": profile.get("xp") or 0,
            "next_level_xp": profile.get("next_level_xp") or 1000,
            "title": profile.get("title") or "Newcomer",
            "streak_days": profile.get("streak_days") or 0,
            "company_rank": rank,
            "rank_pct": rank_pct,
            "next_mission": next_mission,
            "checked_in_today": "daily_login" in cats or "checkin" in cats,
        }

    return _safe(load, {
        "level": 1,
        "xp": 0,
        "next_level_xp": 1000,
        "title": "Newcomer",
        "streak_days": 0,
        "company_rank": None,
        "rank_pct": None,
        "next_mission": None,
        "checked_in_today": False,
    })


def _social_block(sb: Client, employee_id: str) -> dict[str, Any]:
    def load():
        received = (
            sb.table("recognitions")
            .select("id", count="exact")
            .eq("employee_id", employee_id)
            .eq("type", _PEER_TYPE)
            .execute()
        )
        given = (
            sb.table("recognitions")
            .select("id", count="exact")
            .eq("awarded_by", employee_id)
            .eq("type", _PEER_TYPE)
            .execute()
        )
        latest = (
            sb.table("recognitions")
            .select("title, description, awarded_by, created_at")
            .eq("employee_id", employee_id)
            .eq("type", _PEER_TYPE)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
            or []
        )
        latest_from = None
        if latest:
            giver_id = latest[0].get("awarded_by")
            if giver_id:
                g = sb.table("employees").select("full_name").eq("id", giver_id).limit(1).execute().data or []
                if g:
                    latest_from = g[0].get("full_name")
        return {
            "received": received.count or 0,
            "given": given.count or 0,
            "latest_from": latest_from,
        }

    return _safe(load, {"received": 0, "given": 0, "latest_from": None})


def _activity_block(sb: Client, employee_id: str) -> list[dict[str, Any]]:
    def load():
        rows = (
            sb.table("xp_transactions")
            .select("amount, reason, category, emoji, created_at")
            .eq("employee_id", employee_id)
            .order("created_at", desc=True)
            .limit(8)
            .execute()
            .data
            or []
        )
        return [
            {
                "amount": r.get("amount") or 0,
                "reason": r.get("reason") or "Activity",
                "category": r.get("category") or "general",
                "emoji": r.get("emoji") or "⚡",
                "created_at": r.get("created_at"),
            }
            for r in rows
        ]

    return _safe(load, [])


def _weekly_focus(twin, career, learning, game, social) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    if not career.get("has_goal"):
        items.append({
            "id": "set-goal",
            "hub": "career",
            "href": "/career-coach",
            "title": "Set a career goal",
            "detail": "Tell Career Coach the role you want so the twin can build a roadmap.",
            "cta": "Open Career Coach",
            "priority": "critical",
            "done": False,
        })
    elif career.get("next_action"):
        na = career["next_action"]
        items.append({
            "id": "career-next",
            "hub": "career",
            "href": "/career-coach",
            "title": na.get("title") or "Next career step",
            "detail": na.get("description") or f"Toward {career.get('target_role')}",
            "cta": "Continue roadmap",
            "priority": "high",
            "done": False,
            "meta": f"+{na.get('xp_reward') or 0} XP",
        })

    if career.get("top_gap"):
        gap = career["top_gap"]
        items.append({
            "id": "close-gap",
            "hub": "learning",
            "href": "/learning-hub",
            "title": f"Close {gap.get('skill')} gap",
            "detail": f"{gap.get('current_level')} → {gap.get('target_level')}  ·  Learning Hub has a path for this.",
            "cta": "Open Learning Hub",
            "priority": "high",
            "done": False,
        })
    elif learning.get("active_path"):
        path = learning["active_path"]
        items.append({
            "id": "learn-path",
            "hub": "learning",
            "href": "/learning-hub",
            "title": f"Advance “{path.get('title')}”",
            "detail": f"{path.get('progress')}% complete — log the next block of learning.",
            "cta": "Continue learning",
            "priority": "medium",
            "done": int(path.get("progress") or 0) >= 100,
        })

    if game.get("next_mission"):
        m = game["next_mission"]
        items.append({
            "id": "mission",
            "hub": "gamification",
            "href": "/gamification-hub",
            "title": m.get("title") or "Complete a challenge",
            "detail": f"{m.get('progress') or 0}% · earn {m.get('xp') or 0} XP",
            "cta": "Open challenges",
            "priority": "medium",
            "done": False,
        })

    if not game.get("checked_in_today"):
        items.append({
            "id": "checkin",
            "hub": "dashboard",
            "href": "/employee-twin",
            "title": "Daily twin check-in",
            "detail": "Keep your streak alive and tell the twin you showed up today.",
            "cta": "Check in",
            "priority": "low",
            "done": False,
            "action": "checkin",
            "meta": "+25 XP",
        })

    if twin.get("missing"):
        items.append({
            "id": "enrich",
            "hub": "dashboard",
            "href": "/employee-twin",
            "title": twin["missing"][0],
            "detail": "A richer profile makes Career Coach and Learning Hub more accurate.",
            "cta": "Update twin",
            "priority": "medium",
            "done": False,
        })

    if social.get("received", 0) == 0:
        items.append({
            "id": "give-rec",
            "hub": "peers",
            "href": "/employee-twin",
            "title": "Recommend a colleague",
            "detail": "Peer recommendations strengthen both twins and award XP.",
            "cta": "Open Peers",
            "priority": "low",
            "done": False,
        })

    # Keep 4 highest-priority unique items
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    items.sort(key=lambda x: order.get(x.get("priority") or "low", 9))
    seen = set()
    out = []
    for it in items:
        if it["id"] in seen:
            continue
        seen.add(it["id"])
        out.append(it)
        if len(out) == 4:
            break
    return out


def daily_checkin(sb: Client, employee_id: str) -> dict[str, Any]:
    from app.services.gamification_engine import award_xp, ensure_profile

    ensure_profile(sb, employee_id)
    today = _iso_today_start()
    existing = (
        sb.table("xp_transactions")
        .select("id")
        .eq("employee_id", employee_id)
        .in_("category", ["daily_login", "checkin"])
        .gte("created_at", today)
        .limit(1)
        .execute()
        .data
        or []
    )
    if existing:
        return {"already": True, "xp_awarded": 0, "command_center": build_command_center(sb, employee_id)}

    award_xp(sb, employee_id, 25, "Daily twin check-in", "daily_login", "✅", _skip_rank_recalc=True)
    return {"already": False, "xp_awarded": 25, "command_center": build_command_center(sb, employee_id)}

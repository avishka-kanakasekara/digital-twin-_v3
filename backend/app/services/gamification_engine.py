from __future__ import annotations
"""
Gamification Engine — central event dispatcher.

Call `fire_gamification_event(employee_id, event_type, sb)` from any router
whenever a qualifying employee action occurs. This keeps all gamification logic
out of the individual routers.

Supported event_types:
  - skill_added
  - document_uploaded
  - certification_added
  - course_completed
  - profile_updated
  - project_added
"""

import uuid
from datetime import datetime, timezone, date
from supabase import Client


# ─── XP curve ─────────────────────────────────────────────────
# Level N requires: 1000 * 1.15^(N-1) cumulative XP to reach
def _xp_for_level(level: int) -> int:
    return int(1000 * (1.15 ** (level - 1)))


def _title_for_level(level: int) -> str:
    if level >= 20:
        return "Legend"
    elif level >= 15:
        return "AI Pioneer"
    elif level >= 10:
        return "Expert"
    elif level >= 5:
        return "Rising Star"
    return "Newcomer"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_profile(sb: Client, employee_id: str) -> dict:
    """Create a gamification profile if the employee does not have one yet."""
    result = sb.table("gamification_profiles").select("*").eq("employee_id", employee_id).execute()
    if result.data:
        return result.data[0]

    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        return {}

    now = _utc_now().isoformat()
    row = {
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "level": 1,
        "xp": 0,
        "next_level_xp": _xp_for_level(2),
        "total_xp_earned": 0,
        "streak_days": 0,
        "longest_streak": 0,
        "title": _title_for_level(1),
        "updated_at": now,
    }
    sb.table("gamification_profiles").insert(row).execute()
    return row


# ─── Core XP award ────────────────────────────────────────────

def award_xp(
    sb: Client,
    employee_id: str,
    amount: int,
    reason: str,
    category: str = "general",
    emoji: str = "⚡",
    _skip_achievement_check: bool = False,
    _skip_rank_recalc: bool = False,
) -> dict:
    """
    Single source of truth for awarding XP.
    - Writes xp_transactions ledger entry
    - Recalculates level, next_level_xp, title
    - Updates streak
    - Recalculates ranks
    - Checks achievement unlocks
    Returns updated profile dict.
    """
    # 1. Write ledger entry
    sb.table("xp_transactions").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "amount": amount,
        "reason": reason,
        "category": category,
        "emoji": emoji,
    }).execute()

    # 2. Fetch current profile (auto-create so new employees can earn XP)
    profile = ensure_profile(sb, employee_id)
    if not profile:
        return {}

    now = _utc_now()
    new_xp = profile["xp"] + amount
    new_total = profile["total_xp_earned"] + max(0, amount)  # total only goes up
    level = profile["level"]
    next_level_xp = profile.get("next_level_xp") or _xp_for_level(level + 1)

    # 3. Level-up loop
    while new_xp >= next_level_xp:
        level += 1
        next_level_xp = _xp_for_level(level + 1)

    # 4. Update streak
    streak_days = profile.get("streak_days", 0)
    longest_streak = profile.get("longest_streak", 0)
    last_activity_str = profile.get("last_activity")
    if last_activity_str:
        try:
            last_dt = datetime.fromisoformat(last_activity_str)
            if last_dt.tzinfo is None:
                last_dt = last_dt.replace(tzinfo=timezone.utc)
            last_date = last_dt.date()
            today = now.date()
            if last_date == today:
                pass  # same day, no change
            elif last_date == today - __import__('datetime').timedelta(days=1):
                streak_days += 1
            else:
                streak_days = 1  # reset
        except Exception:
            streak_days = 1
    else:
        streak_days = 1  # first activity

    if streak_days > longest_streak:
        longest_streak = streak_days

    # 5. Persist updates
    update_payload = {
        "xp": new_xp,
        "total_xp_earned": new_total,
        "level": level,
        "next_level_xp": next_level_xp,
        "title": _title_for_level(level),
        "streak_days": streak_days,
        "longest_streak": longest_streak,
        "last_activity": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    sb.table("gamification_profiles").update(update_payload).eq("id", profile["id"]).execute()
    profile.update(update_payload)

    # 6. Recalculate all ranks (optional — skip for high-frequency events like check-in)
    if not _skip_rank_recalc:
        _recalculate_ranks(sb)

    # 7. Check achievement unlocks (avoid infinite recursion)
    if not _skip_achievement_check:
        check_achievement_unlocks(sb, employee_id)

    return profile


# ─── Rank recalculation ───────────────────────────────────────

def _recalculate_ranks(sb: Client):
    """Recompute company_rank and department_rank for ALL employees."""
    try:
        all_profiles = sb.table("gamification_profiles").select(
            "id, employee_id, total_xp_earned"
        ).order("total_xp_earned", desc=True).execute()

        # Company rank
        for rank, p in enumerate(all_profiles.data or [], start=1):
            sb.table("gamification_profiles").update({"company_rank": rank}).eq("id", p["id"]).execute()

        # Department rank — fetch employee departments
        emp_result = sb.table("employees").select("id, department").execute()
        dept_map = {e["id"]: e.get("department", "") for e in (emp_result.data or [])}

        # Group profiles by department
        by_dept: dict[str, list] = {}
        for p in all_profiles.data or []:
            dept = dept_map.get(p["employee_id"], "")
            by_dept.setdefault(dept, []).append(p)

        for dept, profiles in by_dept.items():
            profiles.sort(key=lambda x: x["total_xp_earned"], reverse=True)
            for dept_rank, p in enumerate(profiles, start=1):
                sb.table("gamification_profiles").update({"department_rank": dept_rank}).eq("id", p["id"]).execute()
    except Exception as e:
        print(f"[gamification_engine] rank recalc error: {e}")


# ─── Achievement engine ───────────────────────────────────────

def check_achievement_unlocks(sb: Client, employee_id: str):
    """
    Evaluate all achievement rules for an employee.
    Unlocks any that are now met and haven't been awarded yet.
    """
    try:
        # Already unlocked
        unlocked_result = sb.table("employee_achievements").select("achievement_id").eq(
            "employee_id", employee_id
        ).execute()
        already_unlocked = {r["achievement_id"] for r in (unlocked_result.data or [])}

        # All achievements with criteria
        all_achievements = sb.table("achievements").select("*").execute()

        # Gather employee context (lazy - only fetch what we need)
        context_cache: dict = {}

        def get_context(key: str):
            if key in context_cache:
                return context_cache[key]
            val = _fetch_context_value(sb, employee_id, key)
            context_cache[key] = val
            return val

        for ach in (all_achievements.data or []):
            if ach["id"] in already_unlocked:
                continue
            ctype = ach.get("criteria_type")
            cvalue = ach.get("criteria_value")
            if not ctype or cvalue is None:
                continue

            current = get_context(ctype)
            if current is None:
                continue

            # Evaluate rule
            try:
                threshold = float(cvalue) if cvalue != "true" else True
                unlocked = False

                if cvalue == "true":
                    unlocked = bool(current)
                elif ctype in ("company_rank", "department_rank"):
                    # Lower rank number is BETTER (rank 1 is top)
                    unlocked = int(current) <= int(threshold)
                else:
                    unlocked = float(current) >= threshold

            except (ValueError, TypeError):
                continue

            if unlocked:
                _unlock_achievement(sb, employee_id, ach)

    except Exception as e:
        print(f"[gamification_engine] achievement check error: {e}")


def _fetch_context_value(sb: Client, employee_id: str, criteria_type: str):
    """Fetch the live value for a given criteria_type from the DB."""
    try:
        if criteria_type == "skill_count":
            r = sb.table("skills").select("id", count="exact").eq("employee_id", employee_id).execute()
            return r.count or 0

        elif criteria_type == "knowledge_sources":
            r = sb.table("knowledge_sources").select("id", count="exact").eq("employee_id", employee_id).execute()
            return r.count or 0

        elif criteria_type == "certification_count":
            r = sb.table("certifications").select("id", count="exact").eq("employee_id", employee_id).execute()
            return r.count or 0

        elif criteria_type == "projects_count":
            r = sb.table("projects").select("id", count="exact").eq("employee_id", employee_id).execute()
            return r.count or 0

        elif criteria_type == "challenges_completed":
            r = sb.table("challenge_progress").select("id", count="exact").eq(
                "employee_id", employee_id
            ).eq("completed", True).execute()
            return r.count or 0

        elif criteria_type in ("total_xp_earned", "streak_days", "company_rank", "department_rank"):
            r = sb.table("gamification_profiles").select(criteria_type).eq("employee_id", employee_id).execute()
            if r.data:
                return r.data[0].get(criteria_type, 0) or 0
            return 0

        elif criteria_type == "ai_readiness_score":
            # We do not persist a separate ai_readiness_results table.
            # Use the employee profile confidence as the stable proxy for unlock rules.
            r = sb.table("employees").select("ai_confidence").eq("id", employee_id).execute()
            if r.data:
                return r.data[0].get("ai_confidence", 0) or 0
            return 0

        elif criteria_type == "profile_complete":
            r = sb.table("employees").select("full_name, role, department").eq("id", employee_id).execute()
            if r.data:
                emp = r.data[0]
                complete = bool(emp.get("full_name") and emp.get("role") and emp.get("department"))
                return complete
            return False

        elif criteria_type == "peer_recognitions":
            try:
                r = (
                    sb.table("recognitions")
                    .select("id", count="exact")
                    .eq("employee_id", employee_id)
                    .eq("type", "peer_recommendation")
                    .execute()
                )
                if r.count is not None:
                    return r.count
                return len(r.data or [])
            except Exception:
                r = (
                    sb.table("recognitions")
                    .select("id", count="exact")
                    .eq("employee_id", employee_id)
                    .execute()
                )
                if r.count is not None:
                    return r.count
                return len(r.data or [])
            return 0

    except Exception as e:
        print(f"[gamification_engine] context fetch error for {criteria_type}: {e}")
    return None


def _unlock_achievement(sb: Client, employee_id: str, achievement: dict):
    """Insert unlock record and award XP (no recursive achievement check)."""
    try:
        sb.table("employee_achievements").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "achievement_id": achievement["id"],
            "unlocked_at": _utc_now().isoformat(),
        }).execute()
        print(f"[gamification] 🏆 Achievement unlocked: {achievement['name']} for {employee_id}")

        # Award XP for the achievement (skip further achievement checks to prevent loops)
        xp_value = achievement.get("xp_value", 0)
        if xp_value > 0:
            award_xp(
                sb=sb,
                employee_id=employee_id,
                amount=xp_value,
                reason=f"Achievement: {achievement['name']}",
                category="achievement",
                emoji=achievement.get("emoji", "🏆"),
                _skip_achievement_check=True,
            )
    except Exception as e:
        print(f"[gamification_engine] unlock achievement error: {e}")


# ─── Daily XP helper ─────────────────────────────────────────

def _award_daily_activity_xp(sb: Client, employee_id: str):
    """Award 25 XP once per calendar day for any activity."""
    try:
        today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
        existing = sb.table("xp_transactions").select("id").eq(
            "employee_id", employee_id
        ).eq("category", "daily_login").gte("created_at", today_start.isoformat()).execute()

        if not existing.data:
            award_xp(
                sb=sb,
                employee_id=employee_id,
                amount=25,
                reason="Daily Activity Bonus",
                category="daily_login",
                emoji="🌟",
            )
    except Exception as e:
        print(f"[gamification_engine] daily XP error: {e}")


# ─── Challenge auto-progress ───────────────────────────────────

# Maps event_type → list of (challenge_category_keyword, progress_increment_pct)
EVENT_CHALLENGE_MAP = {
    "document_uploaded":    [("Knowledge", 34)],   # 3 docs needed → 34% each
    "certification_added":  [("Learning", 100)],   # completing cert = done
    "course_completed":     [("Learning", 34)],
    "skill_added":          [("Skill", 20)],
    "project_added":        [("Innovation", 34)],
    "profile_updated":      [],                     # no challenge, just XP
}

XP_PER_EVENT = {
    "document_uploaded":   100,
    "certification_added": 200,
    "course_completed":    150,
    "skill_added":          50,
    "project_added":        75,
    "profile_updated":      25,
}


def fire_gamification_event(sb: Client, employee_id: str, event_type: str):
    """
    Main entry point called from routers when an employee takes a qualifying action.
    1. Awards daily activity XP (once per day)
    2. Awards event-specific XP
    3. Increments relevant challenge progress
    4. Achievement check is triggered inside award_xp
    """
    try:
        # Daily bonus
        _award_daily_activity_xp(sb, employee_id)

        # Event XP
        event_xp = XP_PER_EVENT.get(event_type, 0)
        if event_xp > 0:
            emoji_map = {
                "document_uploaded": "📄",
                "certification_added": "🎓",
                "course_completed": "📚",
                "skill_added": "⚡",
                "project_added": "🚀",
                "profile_updated": "👤",
            }
            reason_map = {
                "document_uploaded": "Document Uploaded",
                "certification_added": "Certification Added",
                "course_completed": "Course Completed",
                "skill_added": "Skill Added",
                "project_added": "Project Added",
                "profile_updated": "Profile Updated",
            }
            award_xp(
                sb=sb,
                employee_id=employee_id,
                amount=event_xp,
                reason=reason_map.get(event_type, event_type),
                category=event_type,
                emoji=emoji_map.get(event_type, "⚡"),
            )

        # Challenge progress
        challenge_updates = EVENT_CHALLENGE_MAP.get(event_type, [])
        if challenge_updates:
            _update_challenge_progress(sb, employee_id, challenge_updates)

    except Exception as e:
        print(f"[gamification_engine] fire_event error ({event_type}): {e}")


def _update_challenge_progress(sb: Client, employee_id: str, updates: list):
    """
    Increment challenge_progress for active challenges matching the category keyword.
    Auto-completes and awards XP if progress reaches 100%.
    """
    active_challenges = sb.table("challenges").select("*").eq("is_active", True).execute()

    for ch in (active_challenges.data or []):
        ch_category = (ch.get("category") or "").lower()
        ch_title = (ch.get("title") or "").lower()

        for (keyword, increment) in updates:
            if keyword.lower() in ch_category or keyword.lower() in ch_title:
                # Get or create progress row
                prog_result = sb.table("challenge_progress").select("*").eq(
                    "challenge_id", ch["id"]
                ).eq("employee_id", employee_id).execute()

                if prog_result.data:
                    prog = prog_result.data[0]
                    if prog.get("completed"):
                        continue  # already done

                    new_progress = min(100, (prog.get("progress") or 0) + increment)
                    update_data: dict = {"progress": new_progress}

                    if new_progress >= 100 and not prog.get("completed"):
                        update_data["completed"] = True
                        update_data["completed_at"] = _utc_now().isoformat()
                        # Award challenge XP
                        award_xp(
                            sb=sb,
                            employee_id=employee_id,
                            amount=ch.get("xp_reward", 0),
                            reason=f"Challenge Complete: {ch['title']}",
                            category="challenge",
                            emoji="🎯",
                        )

                    sb.table("challenge_progress").update(update_data).eq("id", prog["id"]).execute()
                else:
                    # Auto-enroll with initial progress
                    new_progress = min(100, increment)
                    completed = new_progress >= 100
                    row = {
                        "id": str(uuid.uuid4()),
                        "employee_id": employee_id,
                        "challenge_id": ch["id"],
                        "progress": new_progress,
                        "completed": completed,
                    }
                    if completed:
                        row["completed_at"] = _utc_now().isoformat()
                        award_xp(
                            sb=sb,
                            employee_id=employee_id,
                            amount=ch.get("xp_reward", 0),
                            reason=f"Challenge Complete: {ch['title']}",
                            category="challenge",
                            emoji="🎯",
                        )
                    sb.table("challenge_progress").insert(row).execute()

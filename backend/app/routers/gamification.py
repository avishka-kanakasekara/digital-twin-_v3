"""
Gamification router — XP, leaderboard, challenges, achievements, rewards.
Uses Supabase as the database backend.
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status

from app.database import get_supabase_admin
from app.schemas.gamification import (
    GamificationProfileResponse,
    LeaderboardEntry,
    ChallengeResponse,
    ChallengeProgressUpdate,
    AchievementResponse,
    XPTransactionResponse,
    RecentActivityResponse,
    StreakResponse,
    StreakCalendarDay,
    RewardItemResponse,
)

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(dt_str: str | None) -> datetime | None:
    """Parse an ISO datetime string from Supabase into a timezone-aware datetime."""
    if not dt_str:
        return None
    try:
        # Supabase returns ISO format: 2024-01-15T10:30:00+00:00
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


# ─── Player Profile ───────────────────────────────────────────

@router.get("/{employee_id}/profile", response_model=GamificationProfileResponse)
def get_gamification_profile(employee_id: str):
    """Get gamification profile for an employee."""
    sb = get_supabase_admin()

    result = sb.table("gamification_profiles").select("*").eq("employee_id", employee_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gamification profile not found")
    profile = result.data[0]

    # Get employee name
    emp_result = sb.table("employees").select("full_name, initials, department").eq("id", employee_id).execute()
    emp = emp_result.data[0] if emp_result.data else {}

    # Count total players
    total_result = sb.table("gamification_profiles").select("id", count="exact").execute()
    total = total_result.count or 0

    # Count dept players
    dept_count = 0
    if emp.get("department"):
        dept_result = (
            sb.table("gamification_profiles")
            .select("id, employees!inner(department)", count="exact")
            .eq("employees.department", emp["department"])
            .execute()
        )
        dept_count = dept_result.count or 0

    return GamificationProfileResponse(
        employee_id=employee_id,
        name=emp.get("full_name", ""),
        initials=emp.get("initials", ""),
        level=profile.get("level", 1),
        xp=profile.get("xp", 0),
        next_level_xp=profile.get("next_level_xp", 1000),
        total_xp_earned=profile.get("total_xp_earned", 0),
        company_rank=profile.get("company_rank"),
        department_rank=profile.get("department_rank"),
        total_players=total,
        department_players=dept_count,
        streak_days=profile.get("streak_days", 0),
        longest_streak=profile.get("longest_streak", 0),
        title=profile.get("title", "Newcomer"),
    )


# ─── Leaderboard ──────────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    department: str | None = None,
    limit: int = 10,
    current_employee_id: str | None = None,
):
    """Get company or department leaderboard."""
    sb = get_supabase_admin()

    # We need to join gamification_profiles with employees
    # Supabase PostgREST supports foreign key joins
    query = sb.table("gamification_profiles").select(
        "*, employees!inner(id, full_name, initials, department)"
    ).order("total_xp_earned", desc=True).limit(limit)

    if department:
        query = query.eq("employees.department", department)

    result = query.execute()
    rows = result.data or []

    entries = []
    for rank, row in enumerate(rows, start=1):
        emp = row.get("employees", {})
        badge = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else "⭐"
        entries.append(LeaderboardEntry(
            rank=rank,
            name=emp.get("full_name", ""),
            initials=emp.get("initials", ""),
            level=row.get("level", 1),
            xp=row.get("total_xp_earned", 0),
            department=emp.get("department", ""),
            badge=badge,
            trend="up",  # TODO: compute from XP history
            is_me=(str(emp.get("id")) == str(current_employee_id)) if current_employee_id else False,
        ))

    return entries


# ─── Challenges ────────────────────────────────────────────────

@router.get("/{employee_id}/challenges", response_model=list[ChallengeResponse])
def get_challenges(employee_id: str):
    """Get active challenges with employee progress."""
    sb = get_supabase_admin()

    challenges = sb.table("challenges").select("*").eq("is_active", True).order("end_date").execute()

    result_list = []
    for ch in challenges.data or []:
        # Get progress for this employee
        prog_result = sb.table("challenge_progress").select("*").eq(
            "challenge_id", ch["id"]
        ).eq("employee_id", employee_id).execute()
        prog = prog_result.data[0] if prog_result.data else None

        # Count participants
        part_result = sb.table("challenge_progress").select("id", count="exact").eq(
            "challenge_id", ch["id"]
        ).execute()
        part_count = part_result.count or 0

        # Calculate days left
        days_left = 0
        end_date = _parse_dt(ch.get("end_date"))
        if end_date:
            delta = end_date - _utc_now()
            days_left = max(0, delta.days)

        result_list.append(ChallengeResponse(
            id=ch["id"],
            title=ch["title"],
            description=ch.get("description"),
            xp_reward=ch.get("xp_reward", 0),
            bonus_badge=ch.get("bonus_badge"),
            difficulty=ch.get("difficulty"),
            type=ch.get("type"),
            category=ch.get("category"),
            color=ch.get("color"),
            days_left=days_left,
            progress=prog["progress"] if prog else 0,
            participants=part_count,
            is_active=ch.get("is_active", True),
        ))

    return result_list


@router.post("/{employee_id}/challenges/{challenge_id}/progress")
def update_challenge_progress(
    employee_id: str,
    challenge_id: str,
    data: ChallengeProgressUpdate,
):
    """Update challenge progress for an employee. Auto-enrolls if not yet enrolled."""
    sb = get_supabase_admin()

    # Find existing progress entry
    prog_result = sb.table("challenge_progress").select("*").eq(
        "employee_id", employee_id
    ).eq("challenge_id", challenge_id).execute()

    if not prog_result.data:
        # Auto-enroll
        prog_data = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "challenge_id": challenge_id,
            "progress": min(100, data.progress),
        }
        sb.table("challenge_progress").insert(prog_data).execute()
        prog = prog_data
    else:
        prog = prog_result.data[0]
        new_progress = min(100, data.progress)
        sb.table("challenge_progress").update({"progress": new_progress}).eq(
            "id", prog["id"]
        ).execute()
        prog["progress"] = new_progress

    completed = prog.get("completed", False)

    # Auto-complete and award XP
    if prog["progress"] >= 100 and not completed:
        sb.table("challenge_progress").update({
            "completed": True,
            "completed_at": _utc_now().isoformat(),
        }).eq("id", prog["id"]).execute()

        # Get challenge XP reward
        ch_result = sb.table("challenges").select("xp_reward, title").eq("id", challenge_id).execute()
        if ch_result.data:
            challenge = ch_result.data[0]
            _add_xp(sb, employee_id, challenge["xp_reward"], f"Challenge: {challenge['title']}", "challenge", "🎯")

        completed = True

    return {"status": "updated", "progress": prog["progress"], "completed": completed}


# ─── Achievements ──────────────────────────────────────────────

@router.get("/{employee_id}/achievements", response_model=list[AchievementResponse])
def get_achievements(employee_id: str):
    """Get all achievements with unlock status for an employee."""
    sb = get_supabase_admin()

    all_achievements = sb.table("achievements").select("*").order("name").execute()
    unlocked_result = sb.table("employee_achievements").select("achievement_id, unlocked_at").eq(
        "employee_id", employee_id
    ).execute()

    unlocked_map = {ea["achievement_id"]: ea["unlocked_at"] for ea in (unlocked_result.data or [])}

    result = []
    for ach in all_achievements.data or []:
        is_unlocked = ach["id"] in unlocked_map
        unlocked_at = unlocked_map.get(ach["id"])
        unlocked_date = None
        if unlocked_at:
            dt = _parse_dt(unlocked_at)
            if dt:
                unlocked_date = dt.strftime("%b %Y")

        result.append(AchievementResponse(
            id=ach["id"],
            name=ach["name"],
            description=ach.get("description"),
            emoji=ach.get("emoji"),
            xp_value=ach.get("xp_value", 0),
            rarity=ach.get("rarity"),
            unlocked=is_unlocked,
            unlocked_date=unlocked_date,
        ))

    return result


# ─── XP History ────────────────────────────────────────────────

@router.get("/{employee_id}/xp-history")
def get_xp_history(employee_id: str, months: int = 6):
    """Get monthly XP aggregation for charts."""
    sb = get_supabase_admin()

    since = (_utc_now() - timedelta(days=months * 30)).isoformat()
    result = sb.table("xp_transactions").select("amount, created_at").eq(
        "employee_id", employee_id
    ).gte("created_at", since).order("created_at").execute()

    # Aggregate by month
    monthly: dict[str, int] = {}
    for tx in result.data or []:
        dt = _parse_dt(tx["created_at"])
        if dt:
            month_key = dt.strftime("%b")
            monthly[month_key] = monthly.get(month_key, 0) + tx["amount"]

    return [{"month": m, "xp": xp} for m, xp in monthly.items()]


# ─── Recent Activity ───────────────────────────────────────────

@router.get("/{employee_id}/activity", response_model=list[RecentActivityResponse])
def get_recent_activity(employee_id: str, limit: int = 10):
    """Get recent XP activity feed."""
    sb = get_supabase_admin()

    result = sb.table("xp_transactions").select("*").eq(
        "employee_id", employee_id
    ).order("created_at", desc=True).limit(limit).execute()

    activities = []
    for tx in result.data or []:
        dt = _parse_dt(tx["created_at"])
        if dt:
            delta = _utc_now() - dt
            if delta.total_seconds() < 3600:
                time_str = f"{int(delta.total_seconds() / 60)}m ago"
            elif delta.total_seconds() < 86400:
                time_str = f"{int(delta.total_seconds() / 3600)}h ago"
            else:
                time_str = f"{delta.days}d ago"
        else:
            time_str = "Unknown"

        activities.append(RecentActivityResponse(
            action=tx.get("reason") or "XP earned",
            xp=tx["amount"],
            time=time_str,
            emoji=tx.get("emoji") or "⚡",
        ))

    return activities


# ─── Streak Calendar ──────────────────────────────────────────

@router.get("/{employee_id}/streak", response_model=StreakResponse)
def get_streak_calendar(employee_id: str, days: int = 42):
    """Get activity streak calendar data (last N days)."""
    sb = get_supabase_admin()

    profile_result = sb.table("gamification_profiles").select("streak_days, longest_streak").eq(
        "employee_id", employee_id
    ).execute()
    profile = profile_result.data[0] if profile_result.data else {}

    since = (_utc_now() - timedelta(days=days)).isoformat()
    result = sb.table("xp_transactions").select("amount, created_at").eq(
        "employee_id", employee_id
    ).gte("created_at", since).execute()

    daily_xp: dict[str, int] = {}
    for tx in result.data or []:
        dt = _parse_dt(tx["created_at"])
        if dt:
            day_key = dt.strftime("%Y-%m-%d")
            daily_xp[day_key] = daily_xp.get(day_key, 0) + tx["amount"]

    calendar = []
    for i in range(days - 1, -1, -1):
        d = _utc_now() - timedelta(days=i)
        day_str = d.strftime("%Y-%m-%d")
        xp = daily_xp.get(day_str, 0)
        intensity = 3 if xp >= 200 else 2 if xp >= 100 else 1 if xp > 0 else 0
        calendar.append(StreakCalendarDay(date=day_str, intensity=intensity))

    return StreakResponse(
        streak_days=profile.get("streak_days", 0),
        longest_streak=profile.get("longest_streak", 0),
        calendar=calendar,
    )


# ─── Reward Store ──────────────────────────────────────────────

@router.get("/rewards", response_model=list[RewardItemResponse])
def get_rewards():
    """Get all available reward items."""
    sb = get_supabase_admin()
    result = sb.table("reward_items").select("*").order("cost").execute()
    return result.data


@router.post("/{employee_id}/rewards/{reward_id}/claim")
def claim_reward(employee_id: str, reward_id: str):
    """Claim a reward — deducts XP from the employee's balance."""
    sb = get_supabase_admin()

    # Get gamification profile
    gam_result = sb.table("gamification_profiles").select("*").eq("employee_id", employee_id).execute()
    if not gam_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile = gam_result.data[0]

    # Get reward
    rew_result = sb.table("reward_items").select("*").eq("id", reward_id).execute()
    if not rew_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")
    reward = rew_result.data[0]

    if not reward.get("available", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reward not available")
    if profile["xp"] < reward["cost"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient XP")

    # Check if already claimed
    existing = sb.table("reward_claims").select("id").eq(
        "employee_id", employee_id
    ).eq("reward_id", reward_id).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Reward already claimed")

    # Deduct XP and create claim
    new_xp = profile["xp"] - reward["cost"]
    sb.table("gamification_profiles").update({"xp": new_xp}).eq("id", profile["id"]).execute()

    sb.table("reward_claims").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "reward_id": reward_id,
    }).execute()

    return {"status": "claimed", "reward": reward["name"], "xp_remaining": new_xp}


# ─── XP Helper ─────────────────────────────────────────────────

def _add_xp(
    sb,
    employee_id: str,
    amount: int,
    reason: str,
    category: str = "general",
    emoji: str = "⚡",
):
    """Internal helper: add XP to an employee and handle level-ups."""
    # Create transaction
    sb.table("xp_transactions").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "amount": amount,
        "reason": reason,
        "category": category,
        "emoji": emoji,
    }).execute()

    # Update profile
    result = sb.table("gamification_profiles").select("*").eq("employee_id", employee_id).execute()
    if not result.data:
        return
    profile = result.data[0]

    new_xp = profile["xp"] + amount
    total_xp = profile["total_xp_earned"] + amount
    level = profile["level"]
    next_level_xp = profile["next_level_xp"]

    # Level-up check
    while new_xp >= next_level_xp:
        level += 1
        next_level_xp = int(1000 * (1.15 ** (level - 1)))

    # Update title based on level
    if level >= 20:
        title = "Legend"
    elif level >= 15:
        title = "AI Pioneer"
    elif level >= 10:
        title = "Expert"
    elif level >= 5:
        title = "Rising Star"
    else:
        title = "Newcomer"

    sb.table("gamification_profiles").update({
        "xp": new_xp,
        "total_xp_earned": total_xp,
        "level": level,
        "next_level_xp": next_level_xp,
        "title": title,
        "last_activity": _utc_now().isoformat(),
    }).eq("id", profile["id"]).execute()

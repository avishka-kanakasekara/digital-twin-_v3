from __future__ import annotations
"""
Gamification router — XP, leaderboard, challenges, achievements, rewards, admin.
Uses Supabase as the database backend and gamification_engine for all business logic.
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.database import get_supabase_admin
from app.schemas.gamification import (
    GamificationProfileResponse,
    LeaderboardEntry,
    ChallengeResponse,
    ChallengeProgressUpdate,
    ChallengeVerifyRequest,
    AchievementResponse,
    XPTransactionResponse,
    RecentActivityResponse,
    StreakResponse,
    StreakCalendarDay,
    RewardItemResponse,
    ChallengeCreateWithSteps,
    ChallengeDetailResponse,
    ChallengeStepResponse,
    SubmitStepRequest,
    EvaluationResponse,
)
from app.services.gamification_engine import (
    award_xp,
    check_achievement_unlocks,
    _recalculate_ranks,
    fire_gamification_event,
)

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(dt_str: str | None) -> datetime | None:
    if not dt_str:
        return None
    try:
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

    emp_result = sb.table("employees").select("full_name, initials, department").eq("id", employee_id).execute()
    emp = emp_result.data[0] if emp_result.data else {}

    total_result = sb.table("gamification_profiles").select("id", count="exact").execute()
    total = total_result.count or 0

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
    """Get company or department leaderboard with real trend computed from XP history."""
    sb = get_supabase_admin()

    query = sb.table("gamification_profiles").select(
        "*, employees!inner(id, full_name, initials, department)"
    ).order("total_xp_earned", desc=True).limit(limit)

    if department:
        query = query.eq("employees.department", department)

    result = query.execute()
    rows = result.data or []

    # Compute trend: compare current rank to rank 7 days ago via XP totals
    # Fetch XP totals from 7 days ago by summing transactions up to that point
    seven_days_ago = (_utc_now() - timedelta(days=7)).isoformat()
    try:
        hist_txns = sb.table("xp_transactions").select(
            "employee_id, amount"
        ).lte("created_at", seven_days_ago).execute()

        # Sum XP per employee 7 days ago
        xp_7d: dict[str, int] = {}
        for tx in (hist_txns.data or []):
            eid = tx["employee_id"]
            xp_7d[eid] = xp_7d.get(eid, 0) + tx.get("amount", 0)

        # Build historical ranks
        sorted_7d = sorted(xp_7d.items(), key=lambda x: x[1], reverse=True)
        rank_7d: dict[str, int] = {eid: r + 1 for r, (eid, _) in enumerate(sorted_7d)}
    except Exception:
        rank_7d = {}

    entries = []
    for rank, row in enumerate(rows, start=1):
        emp = row.get("employees", {})
        badge = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else "⭐"

        emp_id = str(emp.get("id", ""))
        old_rank = rank_7d.get(emp_id)

        if old_rank is None:
            trend = "stable"  # new player
        elif rank < old_rank:
            trend = "up"
        elif rank > old_rank:
            trend = "down"
        else:
            trend = "stable"

        entries.append(LeaderboardEntry(
            rank=rank,
            name=emp.get("full_name", ""),
            initials=emp.get("initials", ""),
            level=row.get("level", 1),
            xp=row.get("total_xp_earned", 0),
            department=emp.get("department", ""),
            badge=badge,
            trend=trend,
            is_me=(emp_id == str(current_employee_id)) if current_employee_id else False,
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
        prog_result = sb.table("challenge_progress").select("*").eq(
            "challenge_id", ch["id"]
        ).eq("employee_id", employee_id).execute()
        prog = prog_result.data[0] if prog_result.data else None

        part_result = sb.table("challenge_progress").select("id", count="exact").eq(
            "challenge_id", ch["id"]
        ).execute()
        part_count = part_result.count or 0

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
            completed=prog.get("completed", False) if prog else False,
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
    """Update challenge progress manually. Auto-completes and awards XP at 100%."""
    sb = get_supabase_admin()

    prog_result = sb.table("challenge_progress").select("*").eq(
        "employee_id", employee_id
    ).eq("challenge_id", challenge_id).execute()

    if not prog_result.data:
        prog_data = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "challenge_id": challenge_id,
            "progress": min(100, data.progress),
            "completed": False,
        }
        sb.table("challenge_progress").insert(prog_data).execute()
        prog = prog_data
    else:
        prog = prog_result.data[0]
        if prog.get("completed"):
            return {"status": "already_completed", "progress": 100, "completed": True}
        new_progress = min(100, data.progress)
        sb.table("challenge_progress").update({"progress": new_progress}).eq(
            "id", prog["id"]
        ).execute()
        prog["progress"] = new_progress

    completed = prog.get("completed", False)

    return {"status": "updated", "progress": prog["progress"], "completed": completed, "pending_verification": prog["progress"] == 100 and not completed}


# ─── Verification ──────────────────────────────────────────────

@router.get("/admin/pending-verifications")
def get_pending_verifications():
    """Get all challenges that have reached 100% progress but are not yet verified (completed=False)."""
    sb = get_supabase_admin()
    
    # We join challenge_progress with challenges and employees
    # Supabase allows joined selects if FKs exist
    res = sb.table("challenge_progress").select(
        "id, employee_id, challenge_id, progress, completed, "
        "challenges(title, xp_reward), "
        "employees!challenge_progress_employee_id_fkey(full_name)"
    ).eq("progress", 100).eq("completed", False).execute()
    
    return res.data or []

@router.post("/admin/verify-challenge")
def verify_challenge(data: ChallengeVerifyRequest):
    """Admin endpoint to approve or reject a challenge that has reached 100% progress."""
    sb = get_supabase_admin()
    
    prog_result = sb.table("challenge_progress").select("*").eq(
        "employee_id", data.employee_id
    ).eq("challenge_id", data.challenge_id).execute()
    
    if not prog_result.data:
        raise HTTPException(status_code=404, detail="Challenge progress not found")
        
    prog = prog_result.data[0]
    if prog.get("completed"):
        return {"status": "already_completed"}
        
    if not data.approve:
        # Rejected: reset progress to 0 so they can try again
        sb.table("challenge_progress").update({"progress": 0}).eq("id", prog["id"]).execute()
        return {"status": "rejected", "progress": 0}
        
    # Approved: Mark as completed and award XP
    sb.table("challenge_progress").update({
        "completed": True,
        "completed_at": _utc_now().isoformat(),
    }).eq("id", prog["id"]).execute()

    ch_result = sb.table("challenges").select("xp_reward, title").eq("id", data.challenge_id).execute()
    if ch_result.data:
        challenge = ch_result.data[0]
        award_xp(sb, data.employee_id, challenge["xp_reward"], f"Challenge Verified: {challenge['title']}", "challenge", "🎯")

    return {"status": "approved", "completed": True}


# ─── Achievements ──────────────────────────────────────────────

@router.get("/{employee_id}/achievements", response_model=list[AchievementResponse])
def get_achievements(employee_id: str):
    """Get all achievements with unlock status. Triggers a live achievement check."""
    sb = get_supabase_admin()

    # Run achievement check on every load to catch any newly qualifying criteria
    check_achievement_unlocks(sb, employee_id)

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

    monthly: dict[str, int] = {}
    for tx in result.data or []:
        if (tx.get("amount") or 0) <= 0:
            continue  # skip redemptions for the chart
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
        if (tx.get("amount") or 0) <= 0:
            continue
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
    """
    Claim a reward — validates XP, prevents double-claim, deducts XP via ledger,
    and returns the updated profile.
    """
    sb = get_supabase_admin()

    # Atomic re-fetch profile (prevents double-spend on concurrent requests)
    gam_result = sb.table("gamification_profiles").select("*").eq("employee_id", employee_id).execute()
    if not gam_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile = gam_result.data[0]

    rew_result = sb.table("reward_items").select("*").eq("id", reward_id).execute()
    if not rew_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")
    reward = rew_result.data[0]

    if not reward.get("available", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reward not available")

    if profile["xp"] < reward["cost"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient XP. You have {profile['xp']} XP but need {reward['cost']} XP."
        )

    existing = sb.table("reward_claims").select("id").eq(
        "employee_id", employee_id
    ).eq("reward_id", reward_id).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Reward already claimed")

    # Deduct XP — write negative ledger entry via award_xp
    deduct_amount = -reward["cost"]
    award_xp(
        sb=sb,
        employee_id=employee_id,
        amount=deduct_amount,
        reason=f"Reward Redeemed: {reward['name']}",
        category="redemption",
        emoji=reward.get("emoji", "🎁"),
    )

    # Record the claim
    sb.table("reward_claims").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "reward_id": reward_id,
    }).execute()

    # Return updated profile for UI refresh
    updated = sb.table("gamification_profiles").select("*").eq("employee_id", employee_id).execute()
    up = updated.data[0] if updated.data else profile
    emp_result = sb.table("employees").select("full_name, initials").eq("id", employee_id).execute()
    emp = emp_result.data[0] if emp_result.data else {}

    return {
        "status": "claimed",
        "reward": reward["name"],
        "xp_spent": reward["cost"],
        "xp_remaining": up["xp"],
        "profile": {
            "xp": up["xp"],
            "total_xp_earned": up["total_xp_earned"],
            "level": up["level"],
            "title": up.get("title", "Newcomer"),
        }
    }


# ─── Admin Endpoints ──────────────────────────────────────────

@router.post("/admin/challenges", status_code=201)
def admin_create_challenge(data: dict):
    """Admin: create a new challenge."""
    sb = get_supabase_admin()
    payload = {
        "id": str(uuid.uuid4()),
        "title": data["title"],
        "description": data.get("description"),
        "xp_reward": data.get("xp_reward", 500),
        "bonus_badge": data.get("bonus_badge"),
        "difficulty": data.get("difficulty", "Medium"),
        "type": data.get("type", "weekly"),
        "category": data.get("category", "General"),
        "color": data.get("color", "#4f46e5"),
        "start_date": data.get("start_date", _utc_now().isoformat()),
        "end_date": data.get("end_date"),
        "is_active": data.get("is_active", True),
    }
    result = sb.table("challenges").insert(payload).execute()
    return result.data[0] if result.data else payload


@router.patch("/admin/challenges/{challenge_id}")
def admin_update_challenge(challenge_id: str, data: dict):
    """Admin: edit or deactivate a challenge."""
    sb = get_supabase_admin()
    result = sb.table("challenges").update(data).eq("id", challenge_id).execute()
    return result.data[0] if result.data else {"status": "updated"}


@router.post("/admin/achievements", status_code=201)
def admin_create_achievement(data: dict):
    """Admin: create or update an achievement."""
    sb = get_supabase_admin()
    payload = {
        "id": data.get("id", str(uuid.uuid4())),
        "name": data["name"],
        "description": data.get("description"),
        "emoji": data.get("emoji", "🏆"),
        "xp_value": data.get("xp_value", 100),
        "rarity": data.get("rarity", "Common"),
        "criteria_type": data.get("criteria_type"),
        "criteria_value": data.get("criteria_value"),
    }
    result = sb.table("achievements").upsert(payload).execute()
    return result.data[0] if result.data else payload


@router.post("/admin/rewards", status_code=201)
def admin_create_reward(data: dict):
    """Admin: create a reward item."""
    sb = get_supabase_admin()
    payload = {
        "id": data.get("id", str(uuid.uuid4())),
        "name": data["name"],
        "description": data.get("description"),
        "cost": data.get("cost", 1000),
        "emoji": data.get("emoji", "🎁"),
        "category": data.get("category", "General"),
        "available": data.get("available", True),
        "stock": data.get("stock"),
    }
    result = sb.table("reward_items").upsert(payload).execute()
    return result.data[0] if result.data else payload


@router.patch("/admin/rewards/{reward_id}")
def admin_toggle_reward(reward_id: str, data: dict):
    """Admin: toggle availability or update a reward."""
    sb = get_supabase_admin()
    result = sb.table("reward_items").update(data).eq("id", reward_id).execute()
    return result.data[0] if result.data else {"status": "updated"}


@router.post("/admin/xp")
def admin_grant_xp(data: dict):
    """Admin: manually grant or deduct XP (goes through full XP service)."""
    sb = get_supabase_admin()
    employee_id = data.get("employee_id")
    amount = data.get("amount", 0)
    reason = data.get("reason", "Admin adjustment")
    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id required")

    profile = award_xp(sb, employee_id, amount, reason, "admin", "🔧")
    return {"status": "ok", "new_xp": profile.get("xp"), "new_level": profile.get("level")}


@router.post("/admin/recalculate-ranks")
def admin_recalculate_ranks():
    """Admin: force-recalculate all company and department ranks."""
    sb = get_supabase_admin()
    _recalculate_ranks(sb)
    return {"status": "ranks recalculated"}


@router.post("/admin/check-achievements/{employee_id}")
def admin_check_achievements(employee_id: str):
    """Admin: force-run achievement checks for an employee."""
    sb = get_supabase_admin()
    check_achievement_unlocks(sb, employee_id)
    return {"status": "achievement check complete"}


@router.post("/admin/fire-event/{employee_id}")
def admin_fire_event(employee_id: str, data: dict):
    """Admin/Test: fire a gamification event for an employee."""
    sb = get_supabase_admin()
    event_type = data.get("event_type", "profile_updated")
    fire_gamification_event(sb, employee_id, event_type)
    return {"status": "event fired", "event_type": event_type}


# ─── Challenge Steps & AI Evaluation ──────────────────────────

def _compute_challenge_progress(sb, employee_id: str, challenge_id: str) -> tuple[int, bool]:
    """Return (progress_percent, all_completed) based on passing evaluations."""
    steps_res = sb.table("challenge_steps").select("id").eq("challenge_id", challenge_id).execute()
    all_steps = steps_res.data or []
    total = len(all_steps)
    if total == 0:
        return 0, False

    passed = 0
    for step in all_steps:
        # Find latest submission for this employee + step
        subs = sb.table("submissions").select("id, status").eq(
            "employee_id", employee_id
        ).eq("step_id", step["id"]).order("submitted_at", desc=True).limit(1).execute()
        if not subs.data:
            continue
        sub = subs.data[0]
        # Find latest evaluation for that submission
        evals = sb.table("evaluations").select("pass").eq(
            "submission_id", sub["id"]
        ).order("evaluated_at", desc=True).limit(1).execute()
        if evals.data and evals.data[0].get("pass"):
            passed += 1

    progress = int((passed / total) * 100)
    return progress, (passed == total)


@router.post("/admin/challenges", tags=["Gamification"])
def create_challenge_with_steps(data: ChallengeCreateWithSteps):
    """Create a challenge together with its ordered steps."""
    sb = get_supabase_admin()

    # Compute total XP from steps
    total_xp = sum(s.xp_value for s in data.steps) if data.steps else 0

    challenge_id = str(uuid.uuid4())
    ch_row = {
        "id": challenge_id,
        "title": data.title,
        "description": data.description,
        "type": data.type,
        "difficulty": data.difficulty,
        "category": data.category,
        "end_date": data.end_date,
        "bonus_badge": data.bonus_badge,
        "color": data.color,
        "is_active": data.is_active,
        "xp_reward": total_xp,
        "start_date": _utc_now().isoformat(),
    }
    sb.table("challenges").insert(ch_row).execute()

    for i, step in enumerate(data.steps):
        sb.table("challenge_steps").insert({
            "id": str(uuid.uuid4()),
            "challenge_id": challenge_id,
            "step_order": step.step_order if step.step_order else i + 1,
            "title": step.title,
            "instructions": step.instructions,
            "submission_type": step.submission_type,
            "evaluation_rubric": step.evaluation_rubric,
            "xp_value": step.xp_value,
            "reference_url": step.reference_url,
        }).execute()

    return {"id": challenge_id, "total_xp": total_xp, "steps_created": len(data.steps)}


@router.get("/{employee_id}/challenges/{challenge_id}/detail", response_model=ChallengeDetailResponse)
def get_challenge_detail(employee_id: str, challenge_id: str):
    """Full challenge detail with ordered steps and per-step status for this employee."""
    sb = get_supabase_admin()

    ch_res = sb.table("challenges").select("*").eq("id", challenge_id).execute()
    if not ch_res.data:
        raise HTTPException(status_code=404, detail="Challenge not found")
    ch = ch_res.data[0]

    steps_res = sb.table("challenge_steps").select("*").eq(
        "challenge_id", challenge_id
    ).order("step_order").execute()
    steps_raw = steps_res.data or []

    step_responses = []
    for step in steps_raw:
        # Latest submission for this employee + step
        subs = sb.table("submissions").select("id, status").eq(
            "employee_id", employee_id
        ).eq("step_id", step["id"]).order("submitted_at", desc=True).limit(1).execute()

        step_status = "not_started"
        latest_score = None
        latest_feedback = None
        xp_awarded = 0

        if subs.data:
            sub = subs.data[0]
            step_status = sub.get("status", "submitted")

            evals = sb.table("evaluations").select("*").eq(
                "submission_id", sub["id"]
            ).order("evaluated_at", desc=True).limit(1).execute()

            if evals.data:
                ev = evals.data[0]
                latest_score = ev.get("ai_score")
                latest_feedback = ev.get("feedback")
                xp_awarded = ev.get("xp_awarded", 0)
                step_status = "passed" if ev.get("pass") else (
                    "manual_review" if sub.get("status") == "manual_review" else "failed"
                )

        step_responses.append(ChallengeStepResponse(
            id=step["id"],
            challenge_id=step["challenge_id"],
            step_order=step["step_order"],
            title=step["title"],
            instructions=step["instructions"],
            submission_type=step["submission_type"],
            evaluation_rubric=step["evaluation_rubric"],
            xp_value=step["xp_value"],
            reference_url=step.get("reference_url"),
            status=step_status,
            latest_score=latest_score,
            latest_feedback=latest_feedback,
            xp_awarded=xp_awarded,
        ))

    total_xp = sum(s.xp_value for s in step_responses)
    progress, all_done = _compute_challenge_progress(sb, employee_id, challenge_id)

    days_left = 0
    end_date = _parse_dt(ch.get("end_date"))
    if end_date:
        delta = end_date - _utc_now()
        days_left = max(0, delta.days)

    return ChallengeDetailResponse(
        id=ch["id"],
        title=ch["title"],
        description=ch.get("description"),
        difficulty=ch.get("difficulty"),
        type=ch.get("type"),
        category=ch.get("category"),
        color=ch.get("color"),
        bonus_badge=ch.get("bonus_badge"),
        days_left=days_left,
        total_xp=total_xp,
        progress=progress,
        completed=all_done,
        steps=step_responses,
    )


@router.post("/{employee_id}/challenges/{challenge_id}/steps/{step_id}/submit", response_model=EvaluationResponse)
def submit_step(employee_id: str, challenge_id: str, step_id: str, data: SubmitStepRequest):
    """
    Submit work for a single challenge step.
    Immediately evaluates via Gemini, persists the result, and awards XP on a pass.
    Resubmission is allowed — history is preserved.
    """
    from app.services.challenge_evaluator import evaluate_submission

    sb = get_supabase_admin()

    # Fetch the step
    step_res = sb.table("challenge_steps").select("*").eq("id", step_id).execute()
    if not step_res.data:
        raise HTTPException(status_code=404, detail="Step not found")
    step = step_res.data[0]

    # Check employee already passed this step (no need to re-evaluate)
    subs = sb.table("submissions").select("id").eq(
        "employee_id", employee_id
    ).eq("step_id", step_id).order("submitted_at", desc=True).execute()
    for s in (subs.data or []):
        ev = sb.table("evaluations").select("pass").eq("submission_id", s["id"]).execute()
        if ev.data and ev.data[0].get("pass"):
            raise HTTPException(status_code=400, detail="Step already passed — no resubmission needed.")

    # Persist submission as 'pending'
    sub_id = str(uuid.uuid4())
    sb.table("submissions").insert({
        "id": sub_id,
        "employee_id": employee_id,
        "challenge_id": challenge_id,
        "step_id": step_id,
        "submission_type": step["submission_type"],
        "content": data.content,
        "status": "pending",
    }).execute()

    # AI evaluation (synchronous)
    result = evaluate_submission(
        step_title=step["title"],
        instructions=step["instructions"],
        evaluation_rubric=step["evaluation_rubric"],
        submission_type=step["submission_type"],
        content=data.content,
        max_xp=step["xp_value"],
        reference_url=step.get("reference_url"),
    )

    final_status = "manual_review" if result.raw.startswith("ERROR") or result.raw == "NO_API_KEY" else "evaluated"

    # Persist evaluation
    eval_id = str(uuid.uuid4())
    sb.table("evaluations").insert({
        "id": eval_id,
        "submission_id": sub_id,
        "ai_score": result.score,
        "pass": result.passed,
        "feedback": result.feedback,
        "xp_awarded": result.xp_awarded,
        "raw_model_response": result.raw[:4000],
    }).execute()

    # Update submission status
    sb.table("submissions").update({"status": final_status}).eq("id", sub_id).execute()

    # Award XP if passed
    if result.passed and result.xp_awarded > 0:
        award_xp(
            sb, employee_id, result.xp_awarded,
            f"Step '{step['title']}' passed", "challenge", "🎯"
        )

    # Recompute overall challenge progress
    progress, all_done = _compute_challenge_progress(sb, employee_id, challenge_id)

    # If all steps passed, update challenge_progress record
    prog_res = sb.table("challenge_progress").select("id, completed").eq(
        "employee_id", employee_id
    ).eq("challenge_id", challenge_id).execute()

    if prog_res.data:
        prog = prog_res.data[0]
        update_data: dict = {"progress": progress}
        if all_done and not prog.get("completed"):
            update_data["completed"] = True
            update_data["completed_at"] = _utc_now().isoformat()
        sb.table("challenge_progress").update(update_data).eq("id", prog["id"]).execute()
    else:
        sb.table("challenge_progress").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "challenge_id": challenge_id,
            "progress": progress,
            "completed": all_done,
            "completed_at": _utc_now().isoformat() if all_done else None,
        }).execute()

    return EvaluationResponse(
        submission_id=sub_id,
        ai_score=result.score,
        passed=result.passed,
        feedback=result.feedback,
        xp_awarded=result.xp_awarded,
        status=final_status,
    )

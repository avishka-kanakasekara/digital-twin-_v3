"""
Gamification router — XP, leaderboard, challenges, achievements, rewards.
"""


from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.employee import Employee
from app.models.gamification import (
    GamificationProfile,
    XPTransaction,
    Achievement,
    EmployeeAchievement,
    Challenge,
    ChallengeProgress,
)
from app.models.reward import RewardItem, RewardClaim
from app.schemas.gamification import (
    GamificationProfileResponse,
    LeaderboardEntry,
    ChallengeResponse,
    ChallengeProgressUpdate,
    AchievementResponse,
    XPTransactionResponse,
    RecentActivityResponse,
    StreakCalendarDay,
    RewardItemResponse,
)

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


# ─── Player Profile ───────────────────────────────────────────

@router.get("/{employee_id}/profile", response_model=GamificationProfileResponse)
def get_gamification_profile(employee_id: str, db: Session = Depends(get_db)):
    """Get gamification profile for an employee."""
    result = db.execute(
        select(GamificationProfile).where(GamificationProfile.employee_id == employee_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gamification profile not found")

    # Get employee name
    emp_result = db.execute(select(Employee).where(Employee.id == employee_id))
    emp = emp_result.scalar_one_or_none()

    # Count total players
    total = db.execute(select(func.count()).select_from(GamificationProfile)).scalar_one()

    # Count dept players
    dept_count = 0
    if emp and emp.department:
        dept_q = (
            select(func.count())
            .select_from(GamificationProfile)
            .join(Employee, Employee.id == GamificationProfile.employee_id)
            .where(Employee.department == emp.department)
        )
        dept_count = db.execute(dept_q).scalar_one()

    return GamificationProfileResponse(
        employee_id=employee_id,
        name=emp.full_name if emp else "",
        initials=emp.initials if emp else "",
        level=profile.level,
        xp=profile.xp,
        next_level_xp=profile.next_level_xp,
        total_xp_earned=profile.total_xp_earned,
        company_rank=profile.company_rank,
        department_rank=profile.department_rank,
        total_players=total,
        department_players=dept_count,
        streak_days=profile.streak_days,
        longest_streak=profile.longest_streak,
        title=profile.title,
    )


# ─── Leaderboard ──────────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    department: str | None = None,
    limit: int = 10,
    current_employee_id: str | None = None,
    db: Session = Depends(get_db),
):
    """Get company or department leaderboard."""
    query = (
        select(GamificationProfile, Employee)
        .join(Employee, Employee.id == GamificationProfile.employee_id)
        .order_by(desc(GamificationProfile.total_xp_earned))
    )

    if department:
        query = query.where(Employee.department == department)

    query = query.limit(limit)
    result = db.execute(query)
    rows = result.all()

    entries = []
    for rank, (profile, emp) in enumerate(rows, start=1):
        badge = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else "⭐"
        entries.append(LeaderboardEntry(
            rank=rank,
            name=emp.full_name,
            initials=emp.initials or "",
            level=profile.level,
            xp=profile.total_xp_earned,
            department=emp.department or "",
            badge=badge,
            trend="up",  # TODO: compute from XP history
            is_me=(str(emp.id) == str(current_employee_id)) if current_employee_id else False,
        ))

    return entries


# ─── Challenges ────────────────────────────────────────────────

@router.get("/{employee_id}/challenges", response_model=list[ChallengeResponse])
def get_challenges(employee_id: str, db: Session = Depends(get_db)):
    """Get active challenges with employee progress."""
    challenges = db.execute(
        select(Challenge).where(Challenge.is_active == True).order_by(Challenge.end_date)
    )
    result = []
    for ch in challenges.scalars().all():
        # Get progress for this employee
        prog_result = db.execute(
            select(ChallengeProgress)
            .where(ChallengeProgress.challenge_id == ch.id, ChallengeProgress.employee_id == employee_id)
        )
        prog = prog_result.scalar_one_or_none()

        # Count participants
        part_count = db.execute(
            select(func.count()).where(ChallengeProgress.challenge_id == ch.id)
        ).scalar_one()

        # Calculate days left
        days_left = 0
        if ch.end_date:
            delta = ch.end_date - datetime.now(timezone.utc)
            days_left = max(0, delta.days)

        result.append(ChallengeResponse(
            id=ch.id,
            title=ch.title,
            description=ch.description,
            xp_reward=ch.xp_reward,
            bonus_badge=ch.bonus_badge,
            difficulty=ch.difficulty,
            type=ch.type,
            category=ch.category,
            color=ch.color,
            days_left=days_left,
            progress=prog.progress if prog else 0,
            participants=part_count,
            is_active=ch.is_active,
        ))

    return result


@router.post("/{employee_id}/challenges/{challenge_id}/progress")
def update_challenge_progress(
    employee_id: str,
    challenge_id: str,
    data: ChallengeProgressUpdate,
    db: Session = Depends(get_db),
):
    """Update challenge progress for an employee. Auto-enrolls if not yet enrolled."""
    # Find or create progress entry
    result = db.execute(
        select(ChallengeProgress)
        .where(ChallengeProgress.employee_id == employee_id, ChallengeProgress.challenge_id == challenge_id)
    )
    prog = result.scalar_one_or_none()

    if not prog:
        prog = ChallengeProgress(employee_id=employee_id, challenge_id=challenge_id)
        db.add(prog)

    prog.progress = min(100, data.progress)

    # Auto-complete and award XP
    if prog.progress >= 100 and not prog.completed:
        prog.completed = True
        prog.completed_at = datetime.now(timezone.utc)

        # Get challenge XP reward
        ch_result = db.execute(select(Challenge).where(Challenge.id == challenge_id))
        challenge = ch_result.scalar_one_or_none()
        if challenge:
            _add_xp(db, employee_id, challenge.xp_reward, f"Challenge: {challenge.title}", "challenge", "🎯")

    return {"status": "updated", "progress": prog.progress, "completed": prog.completed}


# ─── Achievements ──────────────────────────────────────────────

@router.get("/{employee_id}/achievements", response_model=list[AchievementResponse])
def get_achievements(employee_id: str, db: Session = Depends(get_db)):
    """Get all achievements with unlock status for an employee."""
    all_achievements = db.execute(select(Achievement).order_by(Achievement.name))
    unlocked = db.execute(
        select(EmployeeAchievement).where(EmployeeAchievement.employee_id == employee_id)
    )
    unlocked_map = {str(ea.achievement_id): ea.unlocked_at for ea in unlocked.scalars().all()}

    result = []
    for ach in all_achievements.scalars().all():
        is_unlocked = str(ach.id) in unlocked_map
        unlocked_date = unlocked_map.get(str(ach.id))
        result.append(AchievementResponse(
            id=ach.id,
            name=ach.name,
            description=ach.description,
            emoji=ach.emoji,
            xp_value=ach.xp_value,
            rarity=ach.rarity,
            unlocked=is_unlocked,
            unlocked_date=unlocked_date.strftime("%b %Y") if unlocked_date else None,
        ))

    return result


# ─── XP History ────────────────────────────────────────────────

@router.get("/{employee_id}/xp-history")
def get_xp_history(employee_id: str, months: int = 6, db: Session = Depends(get_db)):
    """Get monthly XP aggregation for charts."""
    # Get XP transactions for last N months
    since = datetime.now(timezone.utc) - timedelta(days=months * 30)
    result = db.execute(
        select(XPTransaction)
        .where(XPTransaction.employee_id == employee_id, XPTransaction.created_at >= since)
        .order_by(XPTransaction.created_at)
    )
    transactions = result.scalars().all()

    # Aggregate by month
    monthly: dict[str, int] = {}
    for tx in transactions:
        month_key = tx.created_at.strftime("%b")
        monthly[month_key] = monthly.get(month_key, 0) + tx.amount

    return [{"month": m, "xp": xp} for m, xp in monthly.items()]


# ─── Recent Activity ───────────────────────────────────────────

@router.get("/{employee_id}/activity", response_model=list[RecentActivityResponse])
def get_recent_activity(employee_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get recent XP activity feed."""
    result = db.execute(
        select(XPTransaction)
        .where(XPTransaction.employee_id == employee_id)
        .order_by(desc(XPTransaction.created_at))
        .limit(limit)
    )
    transactions = result.scalars().all()

    activities = []
    for tx in transactions:
        # Compute relative time
        delta = datetime.now(timezone.utc) - tx.created_at
        if delta.total_seconds() < 3600:
            time_str = f"{int(delta.total_seconds() / 60)}m ago"
        elif delta.total_seconds() < 86400:
            time_str = f"{int(delta.total_seconds() / 3600)}h ago"
        else:
            time_str = f"{delta.days}d ago"

        activities.append(RecentActivityResponse(
            action=tx.reason or "XP earned",
            xp=tx.amount,
            time=time_str,
            emoji=tx.emoji or "⚡",
        ))

    return activities


# ─── Streak Calendar ──────────────────────────────────────────

@router.get("/{employee_id}/streak", response_model=list[StreakCalendarDay])
def get_streak_calendar(employee_id: str, days: int = 42, db: Session = Depends(get_db)):
    """Get activity streak calendar data (last N days)."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = db.execute(
        select(XPTransaction)
        .where(XPTransaction.employee_id == employee_id, XPTransaction.created_at >= since)
    )
    transactions = result.scalars().all()

    # Build a map of day → XP earned
    daily_xp: dict[str, int] = {}
    for tx in transactions:
        day_key = tx.created_at.strftime("%Y-%m-%d")
        daily_xp[day_key] = daily_xp.get(day_key, 0) + tx.amount

    # Generate calendar
    calendar = []
    for i in range(days - 1, -1, -1):
        d = datetime.now(timezone.utc) - timedelta(days=i)
        day_str = d.strftime("%Y-%m-%d")
        xp = daily_xp.get(day_str, 0)
        intensity = 3 if xp >= 200 else 2 if xp >= 100 else 1 if xp > 0 else 0
        calendar.append(StreakCalendarDay(date=day_str, intensity=intensity))

    return calendar


# ─── Reward Store ──────────────────────────────────────────────

@router.get("/rewards", response_model=list[RewardItemResponse])
def get_rewards(db: Session = Depends(get_db)):
    """Get all available reward items."""
    result = db.execute(select(RewardItem).order_by(RewardItem.cost))
    return result.scalars().all()


@router.post("/{employee_id}/rewards/{reward_id}/claim")
def claim_reward(employee_id: str, reward_id: str, db: Session = Depends(get_db)):
    """Claim a reward — deducts XP from the employee's balance."""
    # Get gamification profile
    gam = db.execute(
        select(GamificationProfile).where(GamificationProfile.employee_id == employee_id)
    )
    profile = gam.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    # Get reward
    rew = db.execute(select(RewardItem).where(RewardItem.id == reward_id))
    reward = rew.scalar_one_or_none()
    if not reward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")
    if not reward.available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reward not available")
    if profile.xp < reward.cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient XP")

    # Check if already claimed
    existing = db.execute(
        select(RewardClaim).where(RewardClaim.employee_id == employee_id, RewardClaim.reward_id == reward_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Reward already claimed")

    # Deduct XP and create claim
    profile.xp -= reward.cost
    claim = RewardClaim(employee_id=employee_id, reward_id=reward_id)
    db.add(claim)

    return {"status": "claimed", "reward": reward.name, "xp_remaining": profile.xp}


# ─── XP Helper ─────────────────────────────────────────────────

def _add_xp(
    db: Session,
    employee_id: str,
    amount: int,
    reason: str,
    category: str = "general",
    emoji: str = "⚡",
):
    """Internal helper: add XP to an employee and handle level-ups."""
    # Create transaction
    tx = XPTransaction(
        employee_id=employee_id,
        amount=amount,
        reason=reason,
        category=category,
        emoji=emoji,
    )
    db.add(tx)

    # Update profile
    result = db.execute(
        select(GamificationProfile).where(GamificationProfile.employee_id == employee_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return

    profile.xp += amount
    profile.total_xp_earned += amount
    profile.last_activity = datetime.now(timezone.utc)

    # Level-up check
    while profile.xp >= profile.next_level_xp:
        profile.level += 1
        profile.next_level_xp = int(1000 * (1.15 ** (profile.level - 1)))

    # Update title based on level
    if profile.level >= 20:
        profile.title = "Legend"
    elif profile.level >= 15:
        profile.title = "AI Pioneer"
    elif profile.level >= 10:
        profile.title = "Expert"
    elif profile.level >= 5:
        profile.title = "Rising Star"
    else:
        profile.title = "Newcomer"

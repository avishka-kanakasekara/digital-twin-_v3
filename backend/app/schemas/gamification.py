"""
Gamification schemas — profiles, leaderboard, challenges, achievements, XP.
"""

from pydantic import BaseModel

from datetime import datetime


class GamificationProfileResponse(BaseModel):
    employee_id: str
    name: str = ""
    initials: str = ""
    level: int = 1
    xp: int = 0
    next_level_xp: int = 1000
    total_xp_earned: int = 0
    company_rank: int | None = None
    department_rank: int | None = None
    total_players: int = 0
    department_players: int = 0
    streak_days: int = 0
    longest_streak: int = 0
    title: str = "Newcomer"

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    initials: str
    level: int
    xp: int
    department: str
    badge: str = "⭐"
    trend: str = "stable"
    is_me: bool = False

    model_config = {"from_attributes": True}


class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    xp_reward: int = 0
    bonus_badge: str | None = None
    difficulty: str | None = None
    type: str | None = None
    category: str | None = None
    color: str | None = None
    days_left: int = 0
    progress: int = 0
    participants: int = 0
    is_active: bool = True

    model_config = {"from_attributes": True}


class ChallengeProgressUpdate(BaseModel):
    progress: int


class AchievementResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    emoji: str | None = None
    xp_value: int = 0
    rarity: str | None = None
    unlocked: bool = False
    unlocked_date: str | None = None

    model_config = {"from_attributes": True}


class XPTransactionResponse(BaseModel):
    id: str
    amount: int
    reason: str | None = None
    category: str | None = None
    emoji: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RecentActivityResponse(BaseModel):
    action: str
    xp: int
    time: str
    emoji: str = "⚡"

    model_config = {"from_attributes": True}


class StreakCalendarDay(BaseModel):
    date: str
    intensity: int = 0


class StreakResponse(BaseModel):
    streak_days: int = 0
    longest_streak: int = 0
    calendar: list[StreakCalendarDay] = []


class RewardItemResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    cost: int
    emoji: str | None = None
    category: str | None = None
    available: bool = True

    model_config = {"from_attributes": True}


class RewardClaimRequest(BaseModel):
    reward_id: str

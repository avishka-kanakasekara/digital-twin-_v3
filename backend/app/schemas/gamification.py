from __future__ import annotations
"""
Gamification schemas — profiles, leaderboard, challenges, achievements, XP.
"""

from typing import Any, Optional
from pydantic import BaseModel, field_validator

from datetime import datetime


class GamificationProfileResponse(BaseModel):
    employee_id: str
    name: str = ""
    initials: str = ""
    level: int = 1
    xp: int = 0
    next_level_xp: int = 1000
    total_xp_earned: int = 0
    company_rank: Optional[int] = None
    department_rank: Optional[int] = None
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
    description: Optional[str] = None
    xp_reward: int = 0
    bonus_badge: Optional[str] = None
    difficulty: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    days_left: int = 0
    progress: int = 0
    completed: bool = False
    participants: int = 0
    is_active: bool = True

    model_config = {"from_attributes": True}


class ChallengeProgressUpdate(BaseModel):
    progress: int

class ChallengeVerifyRequest(BaseModel):
    employee_id: str
    challenge_id: str
    approve: bool


class AchievementResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    emoji: Optional[str] = None
    xp_value: int = 0
    rarity: Optional[str] = None
    unlocked: bool = False
    unlocked_date: Optional[str] = None

    model_config = {"from_attributes": True}


class XPTransactionResponse(BaseModel):
    id: str
    amount: int
    reason: Optional[str] = None
    category: Optional[str] = None
    emoji: Optional[str] = None
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
    xp: int = 0


class StreakResponse(BaseModel):
    streak_days: int = 0
    longest_streak: int = 0
    calendar: list[StreakCalendarDay] = []


class RewardItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    cost: int
    emoji: Optional[str] = None
    category: Optional[str] = None
    available: bool = True

    model_config = {"from_attributes": True}


class RewardClaimRequest(BaseModel):
    reward_id: str


# ─── Step / Submission / Evaluation schemas ───────────────────

class ChallengeStepIn(BaseModel):
    """One step as supplied in the challenge creation payload."""
    step_order: int = 1
    title: str
    instructions: str
    submission_type: str = "text"   # text | link | code | image | file
    evaluation_rubric: str
    xp_value: int = 100
    reference_url: Optional[str] = None

    @field_validator("reference_url", mode="before")
    @classmethod
    def _empty_url_to_none(cls, value: Any) -> Optional[str]:
        if value is None:
            return None
        text = str(value).strip()
        return text or None


class ChallengeStepResponse(BaseModel):
    id: str
    challenge_id: str
    step_order: int
    title: str
    instructions: str
    submission_type: str
    evaluation_rubric: str
    xp_value: int
    reference_url: Optional[str] = None
    # Injected per-employee at runtime
    status: str = "not_started"      # not_started | submitted | evaluating | passed | failed | manual_review
    latest_score: Optional[int] = None
    latest_feedback: Optional[str] = None
    xp_awarded: int = 0

    model_config = {"from_attributes": True}


class ChallengeDetailResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    bonus_badge: Optional[str] = None
    days_left: int = 0
    total_xp: int = 0
    progress: int = 0
    completed: bool = False
    steps: list[ChallengeStepResponse] = []

    model_config = {"from_attributes": True}


class ChallengeCreateWithSteps(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "weekly"
    difficulty: str = "Medium"
    category: str = "Learning"
    end_date: Optional[str] = None
    bonus_badge: Optional[str] = "🎯"
    color: str = "#7c3aed"
    is_active: bool = True
    reference_url: Optional[str] = None
    steps: list[ChallengeStepIn] = []


class SubmitStepRequest(BaseModel):
    content: str           # text / URL / code / extracted file text
    storage_path: Optional[str] = None  # server-side upload path for image/file evaluation


class ManualReviewRequest(BaseModel):
    submission_id: str
    approve: bool
    score: Optional[int] = None
    feedback: Optional[str] = None


class EvaluationResponse(BaseModel):
    submission_id: str
    ai_score: int
    passed: bool
    feedback: str
    xp_awarded: int
    status: str            # evaluated | manual_review
    criteria: list = []    # structured rubric criteria
    strengths: list = []   # what the employee did well
    improvements: list = []  # areas for improvement


# ─── Recommendation schemas ──────────────────────────────────

class ChallengeRecommendation(BaseModel):
    challenge_id: str
    title: str
    description: str = ""
    difficulty: str = "Medium"
    category: str = ""
    color: str = "#6366f1"
    bonus_badge: str = "🎯"
    xp_reward: int = 0
    estimated_minutes: Optional[int] = None
    days_left: int = 0
    why_recommended: str = ""
    target_skill: Optional[str] = None
    current_skill_level: Optional[int] = None
    target_skill_level: Optional[int] = None
    relevance_score: float = 0
    difficulty_match: str = "appropriate"
    expected_outcome: str = ""


class RecommendationsResponse(BaseModel):
    recommendations: list[ChallengeRecommendation] = []
    coach_insight: str = ""
    focus_skills: list = []


# ─── AI Generation schemas ───────────────────────────────────

class GenerateChallengeRequest(BaseModel):
    goal: str
    target_skill: str = ""
    difficulty: str = "Medium"
    duration: str = "30 min"
    style: str = "Practical task"


# ─── Hint schemas ─────────────────────────────────────────────

class HintRequest(BaseModel):
    hint_level: int = 1  # 1, 2, or 3


class HintResponse(BaseModel):
    hint: str
    xp_penalty: int = 0
    hint_level: int = 1


# ─── Skill progress schemas ──────────────────────────────────

class SkillProgressItem(BaseModel):
    name: str
    category: str = ""
    proficiency: int = 0
    target: int = 0
    trend: str = "stable"
    level_label: str = "Beginner"
    gap_pct: int = 0

    model_config = {"from_attributes": True}


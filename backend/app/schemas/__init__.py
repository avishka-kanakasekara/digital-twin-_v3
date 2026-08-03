from __future__ import annotations
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    TwinSummaryResponse,
)
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse
from app.schemas.gamification import (
    GamificationProfileResponse,
    LeaderboardEntry,
    ChallengeResponse,
    ChallengeProgressUpdate,
    AchievementResponse,
    XPTransactionResponse,
    RecentActivityResponse,
    StreakCalendarDay,
)
from app.schemas.learning import (
    LearnerProfileResponse,
    LearningPathResponse,
    CourseResponse,
    CertificationResponse,
    CertificationCreate,
    LearningFeedItem,
    WeeklyScheduleResponse,
    MonthlyHoursResponse,
)
from app.schemas.career import (
    CareerGoalCreate,
    CareerGoalResponse,
    CareerRoadmapStepResponse,
    SkillGapResponse,
    MarketTrendResponse,
)
from app.schemas.auth import TokenResponse, LoginRequest, RegisterRequest
from app.schemas.organization import (
    OrganizationMetricRead,
    OrganizationMetricCreate,
    OrganizationScenarioRead,
    OrganizationScenarioCreate,
)

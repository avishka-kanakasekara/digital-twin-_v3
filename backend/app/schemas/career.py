from __future__ import annotations

from pydantic import BaseModel, Field


class CareerGoalCreate(BaseModel):
    target_role: str
    timeline: str | None = None
    focus_area: str | None = None
    target_industry: str | None = None
    visible_to_manager: bool = False


class CareerGoalVisibilityUpdate(BaseModel):
    visible_to_manager: bool


class ReadinessComponentResponse(BaseModel):
    id: str
    goal_id: str
    name: str
    score: int
    weight: float
    explanation: str


class SkillGapResponse(BaseModel):
    id: str
    goal_id: str
    skill: str
    current_level: int = 0
    target_level: int = 0
    gap: int = 0
    recommended_path: str = ""
    estimated_hours: int = 0
    status: str = "not_started"
    path_type: str = "course"
    priority: str = "Medium"
    category: str | None = None
    evidence_count: int = 0


class CareerRoadmapStepResponse(BaseModel):
    id: str
    career_goal_id: str
    step_order: int
    title: str
    description: str | None = None
    status: str = "upcoming"
    step_type: str = "learning"
    related_skill_gap_id: str | None = None
    requires_evidence: bool = False
    evidence_type: str | None = None
    estimated_hours: int = 0
    xp_reward: int = 0
    due_window: str | None = None
    evidence_submitted: bool = False
    completed_at: str | None = None


class EvidenceSubmissionResponse(BaseModel):
    id: str
    employee_id: str
    skill_gap_id: str | None = None
    roadmap_step_id: str | None = None
    evidence_type: str
    description: str | None = None
    file_ref: str | None = None
    status: str = "submitted"
    verified_by: str | None = None
    verified_at: str | None = None
    xp_awarded: int = 0
    created_at: str | None = None


class InternalRoleMatchResponse(BaseModel):
    role_id: str
    title: str
    department: str | None = None
    is_open: bool = True
    overall_fit_pct: int
    missing_requirements: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    eligibility_summary: str


class MentorMatchResponse(BaseModel):
    id: str
    employee_id: str
    mentor_employee_id: str
    mentor_name: str
    mentor_role: str | None = None
    mentor_department: str | None = None
    shared_target_role: str | None = None
    shared_skill: str | None = None
    match_reason: str
    intro_requested: bool = False


class XPEventResponse(BaseModel):
    id: str
    employee_id: str
    source: str
    amount: int
    timestamp: str
    reference_type: str | None = None
    reference_id: str | None = None


class StallFlagResponse(BaseModel):
    id: str
    employee_id: str
    goal_id: str
    last_progress_at: str
    flagged_at: str
    resolved: bool = False
    message: str


class MarketTrendResponse(BaseModel):
    skill: str
    category: str
    trend: str
    implication: str


class CareerNextActionResponse(BaseModel):
    title: str
    description: str
    action_type: str
    target_id: str | None = None
    estimated_hours: int = 0
    xp_reward: int = 0


class CareerGoalResponse(BaseModel):
    id: str
    employee_id: str
    target_role: str
    timeline: str | None = None
    focus_area: str | None = None
    target_industry: str | None = None
    readiness_score: int = 0
    visible_to_manager: bool = False
    is_active: bool = True
    created_at: str | None = None
    updated_at: str | None = None
    roadmap_steps: list[CareerRoadmapStepResponse] = Field(default_factory=list)


class CareerAnalysisResponse(BaseModel):
    goal: CareerGoalResponse | None = None
    readiness_score: int
    readiness_band: str
    readiness_explanation: str
    readiness_components: list[ReadinessComponentResponse] = Field(default_factory=list)
    skill_gaps: list[SkillGapResponse] = Field(default_factory=list)
    roadmap_steps: list[CareerRoadmapStepResponse] = Field(default_factory=list)
    internal_roles: list[InternalRoleMatchResponse] = Field(default_factory=list)
    mentors: list[MentorMatchResponse] = Field(default_factory=list)
    market_trends: list[MarketTrendResponse] = Field(default_factory=list)
    next_action: CareerNextActionResponse | None = None
    stall_flag: StallFlagResponse | None = None
    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    xp_total: int = 0


class CareerChatMessage(BaseModel):
    role: str
    content: str


class CareerChatRequest(BaseModel):
    message: str
    history: list[CareerChatMessage] = Field(default_factory=list)


class CareerChatResponse(BaseModel):
    response: str
    grounding_points: list[str] = Field(default_factory=list)


class CareerRoadmapStepUpdate(BaseModel):
    status: str
    evidence_id: str | None = None


class MentorIntroRequestResponse(BaseModel):
    status: str
    mentor_match: MentorMatchResponse


class StallScanResponse(BaseModel):
    scanned_goals: int
    flagged_goals: int
    resolved_goals: int
    flags: list[StallFlagResponse] = Field(default_factory=list)

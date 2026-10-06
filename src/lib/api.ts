/**
 * API client utility for Digital Twin v3 backend
 * Provides typed functions for all backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CAREER_AI_TIMEOUT_MS = 120000;

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 15000, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');
  const isFormData = fetchOptions.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      const detail = error.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
        : (typeof detail === 'string' ? detail : `HTTP ${response.status}`);
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. The server may still be processing — refresh in a moment.');
    }
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '');
  if (filtered.length === 0) return '';
  return '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
}

// ==================== AUTH ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  employee_code: string;
  full_name: string;
  email: string;
  password: string;
  department?: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  employee: any;
}

export const authAPI = {
  login: (data: LoginRequest) =>
    fetchAPI<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    fetchAPI<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    fetchAPI<any>('/api/auth/me'),
};

// ==================== EMPLOYEES ====================

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  initials: string;
  email: string;
  department: string;
  role: string;
  team: string;
  manager_name?: string;
  location: string;
  timezone_str?: string;
  phone?: string;
  education?: any;
  languages?: any;
  biography?: string;
  headline?: string;
  avatar_url?: string;
  years_experience?: number;
  years_in_company?: number;
  employment_type?: string;
  employment_status: string;
  profile_completeness: number;
  ai_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  employee_id: string;
  name: string;
  category: string;
  sub_category?: string;
  proficiency: number;
  target_level?: number;
  years_experience?: number;
  trend: string;
  ai_confidence?: number;
  verified: boolean;
  source: string;
  last_updated: string;
  ai_recommendation?: string;
}

export interface TwinSummary {
  ai_confidence: number;
  profile_completeness: number;
  knowledge_freshness: string;
  twin_health: number;
  representation_quality: string;
  summary_text: string;
}

export interface TwinFocusItem {
  id: string;
  hub: string;
  href: string;
  title: string;
  detail: string;
  cta: string;
  priority: string;
  done: boolean;
  action?: string;
  meta?: string;
}

export interface TwinCommandCenter {
  employee_id: string;
  employee_name?: string;
  role?: string;
  department?: string;
  generated_at: string;
  checked_in_today: boolean;
  twin: {
    health: number;
    completeness: number;
    ai_confidence: number;
    knowledge_freshness: string;
    knowledge_sources: number;
    skills: number;
    projects_total: number;
    projects_active: number;
    missing: string[];
    quality: string;
  };
  career: {
    has_goal: boolean;
    target_role?: string | null;
    timeline?: string | null;
    readiness_score: number;
    next_action?: { title?: string; description?: string; kind?: string; xp_reward?: number; estimated_hours?: number } | null;
    top_gap?: { skill?: string; gap?: number; current_level?: number; target_level?: number; priority?: string } | null;
    open_steps: number;
  };
  learning: {
    courses_completed: number;
    courses_in_progress: number;
    active_course?: string | null;
    active_path?: { id?: string; title?: string; progress?: number } | null;
    paths: number;
  };
  gamification: {
    level: number;
    xp: number;
    next_level_xp: number;
    title: string;
    streak_days: number;
    company_rank?: number | null;
    rank_pct?: number | null;
    next_mission?: { id?: string; title?: string; xp?: number; progress?: number } | null;
    checked_in_today: boolean;
  };
  social: {
    received: number;
    given: number;
    latest_from?: string | null;
  };
  weekly_focus: TwinFocusItem[];
  activity: Array<{ amount: number; reason: string; category: string; emoji?: string; created_at?: string }>;
}

export interface PeerRecommendation {
  id: string;
  from_employee_id: string;
  to_employee_id: string;
  category: string;
  skill?: string | null;
  message: string;
  rating?: number | null;
  created_at?: string | null;
  from_employee_name?: string | null;
  from_employee_role?: string | null;
  from_employee_initials?: string | null;
  from_employee_department?: string | null;
  to_employee_name?: string | null;
  to_employee_role?: string | null;
  to_employee_initials?: string | null;
  to_employee_department?: string | null;
  xp_awarded?: number | null;
}

export interface PeerRecommendationSummary {
  received_count: number;
  given_count: number;
  average_rating?: number | null;
  top_categories: string[];
}

export const employeeAPI = {
  list: (params?: { skip?: number; limit?: number; department?: string }) =>
    fetchAPI<{ employees: Employee[]; total: number }>(
      `/api/employees${buildQueryString(params)}`
    ),

  get: (id: string) =>
    fetchAPI<Employee>(`/api/employees/${id}`),

  update: (id: string, data: Partial<Employee>) =>
    fetchAPI<Employee>(`/api/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getTwinSummary: (id: string) =>
    fetchAPI<TwinSummary>(`/api/employees/${id}/twin-summary`),

  getCommandCenter: (id: string) =>
    fetchAPI<TwinCommandCenter>(`/api/employees/${id}/command-center`),

  dailyCheckin: (id: string) =>
    fetchAPI<{ already: boolean; xp_awarded: number; command_center: TwinCommandCenter }>(
      `/api/employees/${id}/daily-checkin`,
      { method: 'POST' },
    ),

  getSkills: (id: string) =>
    fetchAPI<Skill[]>(`/api/employees/${id}/skills`),

  addSkill: (id: string, data: Omit<Skill, 'id' | 'employee_id' | 'last_updated'>) =>
    fetchAPI<Skill>(`/api/employees/${id}/skills`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSkill: (employeeId: string, skillId: string, data: Partial<Skill>) =>
    fetchAPI<Skill>(`/api/employees/${employeeId}/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSkill: (employeeId: string, skillId: string) =>
    fetchAPI<void>(`/api/employees/${employeeId}/skills/${skillId}`, {
      method: 'DELETE',
    }),

  getProjects: (id: string) =>
    fetchAPI<{ current: any[]; completed: any[] }>(`/api/employees/${id}/projects`),

  createProject: (id: string, data: any) =>
    fetchAPI<any>(`/api/employees/${id}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, projectId: string, data: any) =>
    fetchAPI<any>(`/api/employees/${id}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string, projectId: string) =>
    fetchAPI<{ message: string }>(`/api/employees/${id}/projects/${projectId}`, {
      method: 'DELETE',
    }),

  getTasks: (id: string, projectId: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/projects/${projectId}/tasks`),

  createTask: (id: string, projectId: string, data: any) =>
    fetchAPI<any>(`/api/employees/${id}/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (id: string, projectId: string, taskId: string, data: any) =>
    fetchAPI<any>(`/api/employees/${id}/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string, projectId: string, taskId: string) =>
    fetchAPI<{ message: string }>(`/api/employees/${id}/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  getAIReadiness: (id: string) =>
    fetchAPI<{
      overallScore: number;
      breakdown: Array<{ category: string; score: number }>;
      recommendation: { action: string; message: string; impact: string };
      analysisSummary: string;
    }>(`/api/employees/${id}/ai-readiness`),

  sendAIChatMessage: (id: string, message: string, history: Array<{ role: string; content: string }>) =>
    fetchAPI<{ response: string; sources: string[] }>(`/api/employees/${id}/ai-chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  getPersonalAnalytics: (id: string) =>
    fetchAPI<{
      insights: Array<{ category: string; title: string; description: string; impact: string; actionable: boolean }>;
      productivity_trends: Array<{ period: string; score: number; key_achievements: string[] }>;
      skill_growth: Array<{ skill_name: string; current_level: number; target_level: number; growth_rate: number; trajectory: string; category: string; recent_projects: string[] }>;
      recommendations: string[];
      overall_score: number;
    }>(`/api/employees/${id}/personal-analytics`, { timeoutMs: CAREER_AI_TIMEOUT_MS }),

  getKnowledgeSources: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/knowledge-sources`),

  getRecognitions: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/recognitions`),

  getPeerRecommendations: (id: string) =>
    fetchAPI<PeerRecommendation[]>(`/api/employees/${id}/peer-recommendations`),

  getPeerRecommendationsSent: (id: string) =>
    fetchAPI<PeerRecommendation[]>(`/api/employees/${id}/peer-recommendations/sent`),

  getPeerRecommendationsSummary: (id: string) =>
    fetchAPI<PeerRecommendationSummary>(`/api/employees/${id}/peer-recommendations/summary`),

  createPeerRecommendation: (
    fromEmployeeId: string,
    data: {
      to_employee_id: string;
      message: string;
      category?: string;
      skill?: string;
      rating?: number;
    },
  ) =>
    fetchAPI<PeerRecommendation>(`/api/employees/${fromEmployeeId}/peer-recommendations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deletePeerRecommendation: (fromEmployeeId: string, recommendationId: string) =>
    fetchAPI<void>(`/api/employees/${fromEmployeeId}/peer-recommendations/${recommendationId}`, {
      method: 'DELETE',
    }),

  getCertifications: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/certifications`),

  getAnalytics: (id: string) =>
    fetchAPI<any>(`/api/employees/${id}/analytics`),

  getSkillsGrouped: (id: string) =>
    fetchAPI<any>(`/api/employees/${id}/skills-grouped`),

  getTwinMemory: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/twin-memory`),

  getCollaboration: (id: string) =>
    fetchAPI<any>(`/api/employees/${id}/collaboration`),

  getProjectPrediction: (id: string) =>
    fetchAPI<any>(`/api/employees/${id}/project-prediction`),

  getAIRecommendations: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/ai-recommendations`),
};

// ==================== GAMIFICATION ====================

export interface GamificationProfile {
  id: string;
  employee_id: string;
  level: number;
  xp: number;
  next_level_xp: number;
  total_xp_earned: number;
  company_rank?: number;
  department_rank?: number;
  total_players?: number;
  department_players?: number;
  streak_days: number;
  longest_streak: number;
  last_activity?: string;
  title: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  bonus_badge?: string;
  difficulty: string;
  type: string;
  category: string;
  color: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface ChallengeProgress {
  id: string;
  employee_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  completed_at?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xp_value: number;
  rarity: string;
  criteria_type: string;
  criteria_value: any;
  created_at: string;
  unlocked_at?: string;
}

export const gamificationAPI = {
  getProfile: (employeeId: string) =>
    fetchAPI<GamificationProfile>(`/api/gamification/${employeeId}/profile`),

  getLeaderboard: (params?: { department?: string; limit?: number; current_employee_id?: string }) =>
    fetchAPI<any[]>(`/api/gamification/leaderboard${buildQueryString(params)}`),

  getChallenges: (employeeId: string) =>
    fetchAPI<Challenge[]>(`/api/gamification/${employeeId}/challenges`, { timeoutMs: 45000 }),

  updateChallengeProgress: (employeeId: string, challengeId: string, progress: number) =>
    fetchAPI<ChallengeProgress>(`/api/gamification/${employeeId}/challenges/${challengeId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    }),

  getAchievements: (employeeId: string) =>
    fetchAPI<Achievement[]>(`/api/gamification/${employeeId}/achievements`),

  getXPHistory: (employeeId: string) =>
    fetchAPI<any[]>(`/api/gamification/${employeeId}/xp-history`),

  getActivity: (employeeId: string) =>
    fetchAPI<any[]>(`/api/gamification/${employeeId}/activity`),

  getStreak: (employeeId: string) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/streak`),

  getRewards: () =>
    fetchAPI<any[]>(`/api/gamification/rewards`),

  getRewardClaims: (employeeId: string) =>
    fetchAPI<string[]>(`/api/gamification/${employeeId}/reward-claims`),

  getMissions: (employeeId: string) =>
    fetchAPI<any[]>(`/api/gamification/${employeeId}/missions`),

  claimReward: (employeeId: string, rewardId: string) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/rewards/${rewardId}/claim`, {
      method: 'POST',
    }),

  createChallenge: (data: any) =>
    fetchAPI<any>(`/api/gamification/admin/challenges`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 45000,
    }),

  getChallengeDetail: (employeeId: string, challengeId: string) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/challenges/${challengeId}/detail`),

  uploadSubmission: (employeeId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetchAPI<{ content: string; filename: string; storage_path: string; mime_type: string; is_image: boolean }>(
      `/api/gamification/${employeeId}/submissions/upload`,
      { method: 'POST', body: form, timeoutMs: 60000 }
    );
  },

  submitStep: (employeeId: string, challengeId: string, stepId: string, content: string, storagePath?: string) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/challenges/${challengeId}/steps/${stepId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ content, storage_path: storagePath || null }),
      timeoutMs: 90000,
    }),

  getPendingVerifications: () =>
    fetchAPI<any[]>(`/api/gamification/admin/pending-verifications`),

  getPendingReviews: () =>
    fetchAPI<any[]>(`/api/gamification/admin/pending-reviews`),

  reviewSubmission: (submissionId: string, approve: boolean, score?: number, feedback?: string) =>
    fetchAPI<any>(`/api/gamification/admin/review-submission`, {
      method: 'POST',
      body: JSON.stringify({ submission_id: submissionId, approve, score, feedback }),
    }),

  verifyChallenge: (employeeId: string, challengeId: string, approve: boolean) =>
    fetchAPI<any>(`/api/gamification/admin/verify-challenge`, {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, challenge_id: challengeId, approve }),
    }),

  // ─── v2: Recommendations & AI ──────────────────────────────

  getRecommendations: (employeeId: string) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/recommendations`),

  generateChallenge: (data: { goal: string; target_skill?: string; difficulty?: string; duration?: string; style?: string }) =>
    fetchAPI<any>(`/api/gamification/admin/challenges/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 60000,
    }),

  getHint: (employeeId: string, challengeId: string, stepId: string, hintLevel: number) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/challenges/${challengeId}/steps/${stepId}/hint`, {
      method: 'POST',
      body: JSON.stringify({ hint_level: hintLevel }),
      timeoutMs: 30000,
    }),

  getSkillProgress: (employeeId: string) =>
    fetchAPI<any[]>(`/api/gamification/${employeeId}/skill-progress`),
};

// ==================== LEARNING ====================

export interface LearningPath {
  id: string;
  employee_id?: string;
  title: string;
  description: string;
  progress: number;
  total_courses: number;
  completed_courses: number;
  estimated_hours: number;
  due_date?: string;
  tags: string[];
  color: string;
  is_ai_recommended: boolean;
  platform: string;
  instructor: string;
  created_at?: string;
  course_ids?: string[];
  ai_rationale?: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  hours: number;
  level: string;
  rating: number;
  enrolled_count: number;
  tags: string[];
  emoji: string;
  color: string;
  description: string;
  status?: string;
  progress?: number;
  relevance?: number;
}

export interface LearnerProfile {
  name: string;
  hours_this_month: number;
  hours_this_year: number;
  courses_completed: number;
  courses_in_progress: number;
  current_streak: number;
  longest_streak?: number;
  learning_score: number;
  target_role?: string | null;
}

export interface LearningFeedItem {
  id: string;
  type: string;
  title: string;
  source: string;
  read_time: string;
  relevance: number;
  tags: string[];
  emoji?: string;
  color?: string;
  published?: string;
}

export interface SkillGapRecommended {
  id?: string | null;
  title: string;
}

export interface SkillGap {
  skill: string;
  current_level: number;
  target_level: number;
  gap: number;
  priority: string;
  category?: string;
  color?: string;
  rationale?: string;
  recommended_courses?: SkillGapRecommended[];
  recommended_paths?: SkillGapRecommended[];
}

export interface SkillGapsResponse {
  target_role?: string | null;
  gaps: SkillGap[];
}

export interface LearningChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  created_at?: string;
}

export interface Certification {
  id: string;
  employee_id: string;
  name: string;
  issuer: string;
  status: string;
  score?: number;
  progress: number;
  credential_id?: string;
  completed_date?: string;
  expiry_date?: string;
  exam_date?: string;
  emoji: string;
  color: string;
  created_at: string;
}

export const learningAPI = {
  getProfile: (employeeId: string) =>
    fetchAPI<LearnerProfile>(`/api/learning/${employeeId}/profile`),

  getPaths: (employeeId: string) =>
    fetchAPI<LearningPath[]>(`/api/learning/${employeeId}/paths`),

  updatePathProgress: (employeeId: string, pathId: string, progress: number) =>
    fetchAPI<{ status: string; progress: number }>(`/api/learning/${employeeId}/paths/${pathId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    }),

  getSkillGaps: (employeeId: string) =>
    fetchAPI<SkillGapsResponse>(`/api/learning/${employeeId}/skill-gaps`),

  getCertifications: (employeeId: string) =>
    fetchAPI<Certification[]>(`/api/learning/${employeeId}/certifications`),

  addCertification: (employeeId: string, data: Omit<Certification, 'id' | 'employee_id' | 'created_at'>) =>
    fetchAPI<Certification>(`/api/learning/${employeeId}/certifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFeed: (employeeId: string) =>
    fetchAPI<LearningFeedItem[]>(`/api/learning/${employeeId}/feed`),

  refreshFeed: (employeeId: string) =>
    fetchAPI<LearningFeedItem[]>(`/api/learning/${employeeId}/feed/refresh`, {
      method: 'POST',
      timeoutMs: 60000,
    }),

  getCourses: (params?: { search?: string; level?: string; employee_id?: string; ai_recommended?: boolean }) =>
    fetchAPI<Course[]>(`/api/learning/courses${buildQueryString(params)}`),

  enrollCourse: (employeeId: string, courseId: string) =>
    fetchAPI<{ status: string; course_id: string }>(`/api/learning/${employeeId}/courses/${courseId}/enroll`, {
      method: 'POST',
    }),

  updateCourseProgress: (employeeId: string, courseId: string, progress: number) =>
    fetchAPI<{ status: string; progress: number; completed: boolean }>(`/api/learning/${employeeId}/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    }),

  getSchedule: (employeeId: string) =>
    fetchAPI<any>(`/api/learning/${employeeId}/schedule`),

  getHours: (employeeId: string) =>
    fetchAPI<any>(`/api/learning/${employeeId}/hours`),

  generatePaths: (employeeId: string, goal?: string) =>
    fetchAPI<LearningPath[]>(`/api/learning/${employeeId}/paths/generate`, {
      method: 'POST',
      body: JSON.stringify(goal ? { goal } : {}),
      timeoutMs: 90000,
    }),

  sendChatMessage: (employeeId: string, message: string) =>
    fetchAPI<LearningChatMessage>(`/api/learning/${employeeId}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      timeoutMs: 60000,
    }),

  getChatHistory: (employeeId: string) =>
    fetchAPI<LearningChatMessage[]>(`/api/learning/${employeeId}/ai/chat/history`),
};

export interface LearningSkillGap {
  skill: string;
  current_level: number;
  required_level: number;
  display_current?: number;
  display_required?: number;
  display_scale?: number;
  gap_levels: number;
  gap_score: number;
  priority_score: number;
  priority_label: string;
  source_gap_reference: string;
  source_type: string;
  strategic: boolean;
  mandatory: boolean;
  learning_plan_id?: string | null;
  matching_courses: number;
  matched_course_ids?: string[];
  why: string;
}

export interface LearningCourseSkill {
  skill_name: string;
  level_delivered: number;
}

export interface LearningCourse {
  id: string;
  course_title: string;
  provider?: string;
  modality: string;
  duration_hours: number;
  cost_lkr: number;
  difficulty_level: string;
  is_mandatory: boolean;
  strategic_priority_flag: boolean;
  has_assessment: boolean;
  catalogue_status: string;
  skills: LearningCourseSkill[];
}

export interface LearningPlanItem {
  id: string;
  course_id: string;
  course_title?: string;
  sequence_order: number;
  skill_gap_score: number;
  expected_proficiency_gain: number;
  status: string;
  duration_hours?: number;
  difficulty_level?: string;
  has_assessment?: boolean;
}

export interface LearningPlan {
  id: string;
  employee_id: string;
  title: string;
  source_gap_reference: string;
  target_skill_ids: string[];
  plan_status: string;
  target_completion_date: string;
  total_estimated_hours: number;
  priority_score: number;
  progress_pct: number;
  estimated_weeks: number;
  abandonment_reason?: string | null;
  items: LearningPlanItem[];
}

export interface LearningAssessment {
  id: string;
  learning_plan_item_id?: string;
  skill_name: string;
  proficiency_before: number;
  proficiency_after?: number | null;
  assessment_score_pct: number;
  passed: boolean;
  sfa_sync_status: string;
  proficiency_verified_flag: boolean;
  assessment_date?: string;
}

export interface LearningClosure {
  skill_name: string;
  before_level: number;
  after_level: number;
  required_level: number;
  closure_status: string;
  source_gap_reference: string;
}

const learningTimeout = { timeoutMs: 90000 };

export interface LearningNextStep {
  answer: string;
  source_gap_reference?: string;
  hours?: number;
  weeks?: number;
  gap?: LearningSkillGap;
  sequence?: Array<{
    course_id: string;
    course_title: string;
    duration_hours: number;
    difficulty_level: string;
    has_assessment: boolean;
    modality?: string;
    provider?: string;
  }>;
}

export interface ComplianceMetric {
  assigned: number;
  verified_completed: number;
  ratio: number | null;
  state: string;
}

export interface TeamGapRow {
  employee_id: string;
  employee: string;
  skill: string;
  current_level: number;
  required_level: number;
  gap_levels: number;
  strategic: boolean;
  learning_plan_status: string;
}

export interface OrgDepartment {
  department: string;
  plans: number;
  active: number;
  abandoned: number;
  hours: number;
}

export interface OrgOverview {
  mandatory_compliance: ComplianceMetric;
  strategic_coverage: ComplianceMetric;
  verified_skill_gains: number;
  unverified_passes: number;
  abandoned_plans: number;
  learning_hours: number;
  catalogue_cost_lkr: number;
  unused_active_courses: string[];
  plans_by_department?: OrgDepartment[];
  assessment_outcomes?: {
    passed: number;
    failed: number;
    pending_sync: number;
    synced: number;
    failed_sync: number;
  };
}

export const learningRecommendationAPI = {
  gaps: (employeeId: string) =>
    fetchAPI<{ gaps: LearningSkillGap[] }>(`/api/learning/recommendation/${employeeId}/skill-gaps`, learningTimeout),
  plans: (employeeId: string) =>
    fetchAPI<{ plans: LearningPlan[] }>(`/api/learning/recommendation/${employeeId}/plans`, learningTimeout),
  createPlan: (employeeId: string, sourceGapReference: string, courseIds?: string[]) =>
    fetchAPI<LearningPlan>(`/api/learning/recommendation/${employeeId}/plans`, {
      method: 'POST',
      body: JSON.stringify({ source_gap_reference: sourceGapReference, course_ids: courseIds ?? [] }),
      ...learningTimeout,
    }),
  abandonPlan: (planId: string, reason: string) =>
    fetchAPI<LearningPlan>(`/api/learning/recommendation/plans/${planId}/abandon`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      ...learningTimeout,
    }),
  enroll: (itemId: string) =>
    fetchAPI<LearningPlan>(`/api/learning/recommendation/items/${itemId}/enroll`, { method: 'POST', ...learningTimeout }),
  setItemStatus: (itemId: string, status: string) =>
    fetchAPI<LearningPlan>(`/api/learning/recommendation/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      ...learningTimeout,
    }),
  courses: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ courses: LearningCourse[] }>(`/api/learning/recommendation/courses${query ? `?${query}` : ''}`, learningTimeout);
  },
  skillNames: () =>
    fetchAPI<{ skills: string[] }>('/api/learning/recommendation/skill-names', learningTimeout),
  createCourse: (body: {
    course_title: string;
    provider: string;
    modality: string;
    duration_hours: number;
    cost_lkr: number;
    difficulty_level: string;
    is_mandatory: boolean;
    mandatory_for_role_ids: string[];
    strategic_priority_flag: boolean;
    has_assessment: boolean;
    skill_maps: Array<{ skill_name: string; level_delivered: number }>;
  }) =>
    fetchAPI<LearningCourse>('/api/learning/recommendation/courses', {
      method: 'POST',
      body: JSON.stringify(body),
      ...learningTimeout,
    }),
  addCourseToPlan: (planId: string, courseId: string) =>
    fetchAPI<LearningPlan>(`/api/learning/recommendation/plans/${planId}/items`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
      ...learningTimeout,
    }),
  assessments: (employeeId: string) =>
    fetchAPI<{ assessments: LearningAssessment[] }>(`/api/learning/recommendation/${employeeId}/assessments`, learningTimeout),
  submitAssessment: (itemId: string, answers: number[]) =>
    fetchAPI<LearningAssessment>(`/api/learning/recommendation/assessments`, {
      method: 'POST',
      body: JSON.stringify({ learning_plan_item_id: itemId, answers }),
      ...learningTimeout,
    }),
  questions: (courseId: string) =>
    fetchAPI<{ questions: Array<{ id: string; prompt: string; options: string[] }> }>(
      `/api/learning/recommendation/courses/${courseId}/questions`,
      learningTimeout,
    ),
  syncAssessment: (assessmentId: string, forceFail = false) =>
    fetchAPI<LearningAssessment>(`/api/learning/recommendation/assessments/${assessmentId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ force_fail: forceFail }),
      ...learningTimeout,
    }),
  retrySync: (assessmentId: string) =>
    fetchAPI<LearningAssessment>(`/api/learning/recommendation/assessments/${assessmentId}/retry-sync`, { method: 'POST', ...learningTimeout }),
  closures: (employeeId: string) =>
    fetchAPI<{ closures: LearningClosure[] }>(`/api/learning/recommendation/gap-closure?employee_id=${employeeId}`, learningTimeout),
  next: (employeeId: string) =>
    fetchAPI<LearningNextStep>(`/api/learning/recommendation/${employeeId}/next`, learningTimeout),
  mandatory: (employeeId?: string) =>
    fetchAPI<ComplianceMetric>(
      `/api/learning/recommendation/compliance/mandatory${employeeId ? `?employee_id=${employeeId}` : ''}`,
      learningTimeout,
    ),
  strategic: (employeeId?: string) =>
    fetchAPI<ComplianceMetric>(
      `/api/learning/recommendation/compliance/strategic${employeeId ? `?employee_id=${employeeId}` : ''}`,
      learningTimeout,
    ),
  manager: (managerId: string) =>
    fetchAPI<{
      team_size: number;
      strategic_gaps: TeamGapRow[];
      strategic_gaps_without_plan: TeamGapRow[];
      active_plans: Array<{ id: string; employee: string; title: string; plan_status: string; priority_score: number; total_estimated_hours: number }>;
      unverified_completions: Array<{ employee: string; skill: string; score: number; sfa_sync_status: string }>;
      mandatory_compliance: ComplianceMetric;
      strategic_coverage: ComplianceMetric;
      scope?: string;
    }>(`/api/learning/recommendation/manager/${managerId}/overview`, learningTimeout),
  employer: () => fetchAPI<OrgOverview>(`/api/learning/recommendation/employer/overview`, learningTimeout),
};

// ==================== CAREER ====================

export interface CareerGoal {
  id: string;
  employee_id: string;
  target_role: string;
  timeline?: string;
  focus_area?: string;
  target_industry?: string;
  readiness_score: number;
  visible_to_manager: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  roadmap_steps: CareerRoadmapStep[];
}

export interface CareerRoadmapStep {
  id: string;
  career_goal_id: string;
  step_order: number;
  title: string;
  status: string;
  description?: string;
  step_type: string;
  related_skill_gap_id?: string | null;
  skill?: string | null;
  requires_evidence: boolean;
  evidence_type?: string | null;
  estimated_hours: number;
  xp_reward: number;
  due_window?: string | null;
  evidence_submitted: boolean;
  completed_at?: string | null;
}

export interface ReadinessComponent {
  id: string;
  goal_id: string;
  name: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface CareerSkillGap {
  id: string;
  goal_id: string;
  skill: string;
  current_level: number;
  target_level: number;
  gap: number;
  recommended_path: string;
  estimated_hours: number;
  status: string;
  path_type: string;
  priority: string;
  category?: string | null;
  evidence_count: number;
}

export interface CareerInternalRole {
  role_id: string;
  title: string;
  department?: string | null;
  is_open: boolean;
  overall_fit_pct: number;
  missing_requirements: string[];
  matched_skills: string[];
  eligibility_summary: string;
}

export interface CareerMentorMatch {
  id: string;
  employee_id: string;
  mentor_employee_id: string;
  mentor_name: string;
  mentor_role?: string | null;
  mentor_department?: string | null;
  shared_target_role?: string | null;
  shared_skill?: string | null;
  match_reason: string;
  intro_requested: boolean;
}

export interface CareerMarketTrend {
  skill: string;
  category: string;
  trend: string;
  implication: string;
}

export interface CareerNextAction {
  title: string;
  description: string;
  action_type: string;
  target_id?: string | null;
  estimated_hours: number;
  xp_reward: number;
}

export interface CareerStallFlag {
  id: string;
  employee_id: string;
  goal_id: string;
  last_progress_at: string;
  flagged_at: string;
  resolved: boolean;
  message: string;
}

export interface CareerEvidenceSubmission {
  id: string;
  employee_id: string;
  skill_gap_id?: string | null;
  roadmap_step_id?: string | null;
  evidence_type: string;
  description?: string | null;
  file_ref?: string | null;
  status: string;
  verified_by?: string | null;
  verified_at?: string | null;
  xp_awarded: number;
  created_at?: string | null;
}

export interface CareerRoadmapOption {
  id: string;
  title: string;
  summary: string;
  readiness_pct: number;
  months: number;
  step_count: number;
  steps: CareerRoadmapStep[];
}

export interface CareerAnalysis {
  goal?: CareerGoal | null;
  readiness_score: number;
  readiness_band: string;
  readiness_explanation: string;
  readiness_components: ReadinessComponent[];
  skill_gaps: CareerSkillGap[];
  roadmap_steps: CareerRoadmapStep[];
  roadmap_options?: CareerRoadmapOption[];
  selected_roadmap_id?: string | null;
  internal_roles: CareerInternalRole[];
  mentors: CareerMentorMatch[];
  market_trends: CareerMarketTrend[];
  next_action?: CareerNextAction | null;
  stall_flag?: CareerStallFlag | null;
  summary: string;
  strengths: string[];
  blockers: string[];
  timeline_note?: string;
  manager_brief?: string;
  evidence_items?: { title: string; detail: string }[];
  steps_completed?: number;
  steps_total?: number;
  xp_total: number;
}

export const careerAPI = {
  getGoal: (employeeId: string) =>
    fetchAPI<CareerGoal>(`/api/career/${employeeId}/goal`, { timeoutMs: CAREER_AI_TIMEOUT_MS }),

  setGoal: (employeeId: string, data: {
    target_role: string;
    timeline?: string;
    focus_area?: string;
    target_industry?: string;
    visible_to_manager?: boolean;
  }) =>
    fetchAPI<CareerGoal>(`/api/career/${employeeId}/goal`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: CAREER_AI_TIMEOUT_MS,
    }),

  getAnalysis: (employeeId: string, refresh = false) =>
    fetchAPI<CareerAnalysis>(`/api/career/${employeeId}/analysis${refresh ? '?refresh=true' : ''}`, { timeoutMs: CAREER_AI_TIMEOUT_MS }),

  chat: (employeeId: string, message: string, history: any[] = []) =>
    fetchAPI<{ response: string; grounding_points: string[] }>(`/api/career/${employeeId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      timeoutMs: CAREER_AI_TIMEOUT_MS,
    }),

  updateRoadmapStep: (stepId: string, status: string, evidenceId?: string) =>
    fetchAPI<{ id: string; status: string; analysis: CareerAnalysis }>(`/api/career/roadmap/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, evidence_id: evidenceId || null }),
      timeoutMs: CAREER_AI_TIMEOUT_MS,
    }),

  submitEvidence: (
    employeeId: string,
    data: {
      skill_gap_id?: string;
      roadmap_step_id?: string;
      evidence_type: string;
      description?: string;
      file?: File | null;
    }
  ) => {
    const form = new FormData();
    if (data.skill_gap_id) form.append('skill_gap_id', data.skill_gap_id);
    if (data.roadmap_step_id) form.append('roadmap_step_id', data.roadmap_step_id);
    form.append('evidence_type', data.evidence_type);
    if (data.description) form.append('description', data.description);
    if (data.file) form.append('file', data.file);
    return fetchAPI<CareerEvidenceSubmission>(`/api/career/${employeeId}/evidence`, {
      method: 'POST',
      body: form,
      timeoutMs: 60000,
    });
  },

  getInternalRoles: (employeeId: string) =>
    fetchAPI<CareerInternalRole[]>(`/api/career/${employeeId}/internal-roles`),

  getMentors: (employeeId: string) =>
    fetchAPI<CareerMentorMatch[]>(`/api/career/${employeeId}/mentors`),

  requestMentorIntro: (employeeId: string, mentorId: string) =>
    fetchAPI<{ status: string; mentor_match: CareerMentorMatch }>(`/api/career/${employeeId}/mentors/${mentorId}/request-intro`, {
      method: 'POST',
    }),

  updateVisibility: (employeeId: string, visible_to_manager: boolean) =>
    fetchAPI<CareerGoal>(`/api/career/${employeeId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visible_to_manager }),
    }),

  scanStallFlags: (days = 14) =>
    fetchAPI<{ scanned_goals: number; flagged_goals: number; resolved_goals: number; flags: CareerStallFlag[] }>(`/api/career/stall-flags/scan?days=${days}`, {
      method: 'POST',
    }),
};

// ==================== CAREER COACH PLAN ====================

export type CoachPhaseKind = 'learn' | 'apply' | 'prove';
export type CoachStepStatus = 'upcoming' | 'in_progress' | 'achieved';

export interface CoachPhase {
  id: string;
  phase: CoachPhaseKind;
  title: string;
  detail: string;
  status: CoachStepStatus;
  progress_pct: number;
  hours: number;
  hours_remaining: number;
  starts?: string;
  due?: string | null;
  completed_at?: string | null;
  project?: string | null;
  evidence: { id: string; type?: string; status?: string; description?: string; created_at?: string }[];
  resources?: CoachResource[];
}

export interface CoachResource {
  name: string;
  provider?: string | null;
  type?: string;
}

export interface CoachMarket {
  source: 'market' | 'library';
  generated_at?: string | null;
  summary?: string | null;
  sources: { title: string; uri: string }[];
  queries: string[];
}

export interface CoachLearningLink {
  plan_id: string | null;
  plan_status: string | null;
  progress_pct: number;
  courses: { id: string; title: string; status: string; hours: number }[];
  suggested_courses: { id: string; title: string; hours: number; level: number }[];
  course_count: number;
  learning_target: number;
}

export interface CoachMilestone {
  skill: string;
  requirement: string;
  gap_id: string;
  category: string;
  why: string;
  market_signal?: string | null;
  practice_task?: string | null;
  recorded_as?: string | null;
  start_level: number;
  current: number;
  required: number;
  met: boolean;
  status: 'done' | 'in_progress' | 'upcoming';
  due: string | null;
  phases: CoachPhase[];
  learning: CoachLearningLink;
}

export interface CoachRequirement {
  skill: string;
  requirement: string;
  recorded_as: string | null;
  current: number;
  required: number;
  gap: number;
  category: string;
  why: string;
  market_signal?: string | null;
  related?: string[];
  proof?: string | null;
  resources?: CoachResource[];
  gap_id: string | null;
}

export interface CoachAction {
  id: string;
  kind: 'learning' | 'evidence' | 'assessment' | 'mentor' | 'checkin';
  title: string;
  detail: string;
  gap_id?: string;
  step_id?: string;
  mentor_id?: string;
  skill?: string;
  hours: number;
}

export interface CoachMentor {
  employee_id: string;
  name: string;
  role?: string;
  department?: string;
  skill: string;
  recorded_as: string;
  level: number;
  intro_requested: boolean;
}

export interface CoachOpportunity {
  role_id: string;
  title: string;
  department?: string;
  overall_fit_pct: number;
  missing_requirements: string[];
  matched_skills: string[];
  eligibility_summary: string;
  same_track: boolean;
}

export interface CoachPlan {
  employee: { id: string; name?: string; role?: string; department?: string };
  role_options: string[];
  goal: null | {
    id: string;
    target_role: string;
    family: string;
    timeline?: string;
    visible_to_manager: boolean;
    created_at?: string;
  };
  settings?: { hours_per_week: number; target_date: string; target_months: number; started_at: string };
  readiness?: { pct: number; start_pct: number; met: number; total: number };
  timeline?: {
    pace: 'on_track' | 'at_risk' | 'complete';
    total_hours: number;
    done_hours: number;
    remaining_hours: number;
    projected_finish: string;
    target_date: string;
    weeks_left: number;
    hours_per_week_needed: number | null;
    behind_hours: number;
  };
  requirements?: CoachRequirement[];
  unused_profile_skills?: number;
  market?: CoachMarket;
  milestones?: CoachMilestone[];
  this_week?: CoachAction[];
  momentum?: {
    hours_this_week: number;
    hours_last_4_weeks: number;
    planned_last_4_weeks: number;
    streak_weeks: number;
    last_activity: string | null;
    days_since_activity: number | null;
    stalled: boolean;
  };
  checkins?: { id: string; skill?: string; hours: number; note?: string; created_at: string }[];
  mentors?: CoachMentor[];
  opportunities?: CoachOpportunity[];
  manager?: { id: string; name?: string; role?: string } | null;
  manager_brief?: string;
}

export interface CoachRolePreview {
  target_role: string;
  market?: CoachMarket;
  readiness_pct: number;
  met: { skill: string; current: number; required: number }[];
  to_build: { skill: string; current: number; required: number }[];
  total_hours: number;
}

const COACH_TIMEOUT_MS = 45000;
// Market research is a grounded Gemini search; the first run for a role takes up to two minutes.
const COACH_RESEARCH_TIMEOUT_MS = 150000;

export const careerCoachAPI = {
  getPlan: (employeeId: string) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}`, { timeoutMs: COACH_RESEARCH_TIMEOUT_MS }),

  roles: (employeeId?: string, role?: string) =>
    fetchAPI<{ roles: string[]; preview?: CoachRolePreview }>(
      `/api/career-coach/roles${buildQueryString({ employee_id: employeeId, role })}`,
      { timeoutMs: COACH_RESEARCH_TIMEOUT_MS },
    ),

  setGoal: (employeeId: string, data: { target_role: string; target_months: number; hours_per_week: number; visible_to_manager: boolean }) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/goal`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: COACH_RESEARCH_TIMEOUT_MS,
    }),

  refreshMarket: (employeeId: string) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/market/refresh`, {
      method: 'POST',
      timeoutMs: COACH_RESEARCH_TIMEOUT_MS,
    }),

  updateSettings: (employeeId: string, data: { hours_per_week?: number; target_months?: number }) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      timeoutMs: COACH_TIMEOUT_MS,
    }),

  reopenStep: (employeeId: string, stepId: string) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/steps/${stepId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reopen' }),
      timeoutMs: COACH_TIMEOUT_MS,
    }),

  addEvidence: (employeeId: string, stepId: string, description: string, file?: File | null) => {
    const form = new FormData();
    form.append('step_id', stepId);
    form.append('description', description);
    if (file) form.append('file', file);
    return fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/evidence`, {
      method: 'POST',
      body: form,
      timeoutMs: 60000,
    });
  },

  checkin: (employeeId: string, data: { hours: number; skill?: string; note?: string }) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/checkins`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: COACH_TIMEOUT_MS,
    }),

  requestIntro: (employeeId: string, mentorId: string, skill: string) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/mentors/${mentorId}/intro`, {
      method: 'POST',
      body: JSON.stringify({ skill }),
      timeoutMs: COACH_TIMEOUT_MS,
    }),

  setVisibility: (employeeId: string, visible_to_manager: boolean) =>
    fetchAPI<CoachPlan>(`/api/career-coach/${employeeId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visible_to_manager }),
      timeoutMs: COACH_TIMEOUT_MS,
    }),

  ask: (employeeId: string, message: string, history: { role: string; content: string }[] = []) =>
    fetchAPI<{ answer: string; grounding: string[] }>(`/api/career-coach/${employeeId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      timeoutMs: 60000,
    }),
};

// ==================== ORGANIZATION ====================

export interface OrganizationMetric {
  id: string;
  month: string;
  date: string;
  total_headcount: number;
  voluntary_attrition_rate: number;
  involuntary_attrition_rate: number;
  new_hires: number;
  open_positions: number;
  enps: number;
  training_hours_per_employee: number;
  absenteeism_rate: number;
  revenue: number;
  operating_cost: number;
  ebitda: number;
  net_profit: number;
  marketing_spend: number;
  rd_spend: number;
  overall_productivity_score: number;
  csat: number;
  nps: number;
  market_share_percentage: number;
  project_completion_rate: number;
  carbon_footprint_tons: number;
  energy_consumption_kwh: number;
  compliance_score: number;
  security_incidents: number;
  anomaly_flag: string;
  created_at: string;
}

export interface OrganizationScenario {
  id: string;
  scenario_name: string;
  target_metric: string;
  confidence_level: number;
  predicted_impact_percentage: number;
  predicted_roi: number;
  time_to_impact_months: number;
  ai_recommendation: string;
  created_at: string;
}

export interface InnovationIdea {
  id: string;
  title: string;
  author_initials: string;
  author_bg: string;
  description: string;
  full_description: string;
  roi: string;
  timeline: string;
  budget: string;
  risks: string;
  team_required: string;
  impact_score: number;
  feasibility: string;
  status: string;
  patent_pending: boolean;
  created_at: string;
}

export interface InnovationCommunity {
  id: string;
  name: string;
  members: number;
  joined: boolean;
  icon: string;
  bg_class: string;
}

export interface RiskProfile {
  id: string;
  employee_id: string;
  risk_level: string; // 'High', 'Medium', 'Low'
  risk_score: number;
  primary_factor: string;
  burnout_probability: number;
  compensation_satisfaction: number;
  career_stagnation_score: number;
  last_1_on_1: string;
  ai_retention_suggestion: string;
}

export interface TalentMatch {
  id: string;
  role_title: string;
  department: string;
  required_skills: string[];
  matched_employees: {
    employee_id: string;
    match_score: number;
    skill_gap: string[];
  }[];
  urgency: string; // 'High', 'Normal'
}

export const organizationAPI = {
  getHistory: (params?: { limit?: number }) =>
    fetchAPI<OrganizationMetric[]>(`/api/organization/history${buildQueryString(params)}`),

  getScenarios: (params?: { limit?: number }) =>
    fetchAPI<OrganizationScenario[]>(`/api/organization/scenarios${buildQueryString(params)}`),

  getAnomalies: () =>
    fetchAPI<any[]>('/api/organization/anomalies'),

  // Innovation Hub Endpoints
  getIdeas: () => fetchAPI<InnovationIdea[]>('/api/organization/innovation/ideas'),
  scoreIdea: (data: { title: string, description: string }) => fetchAPI<{ impact: string, impact_score: number, feasibility: string, similar: number }>('/api/organization/innovation/score', { method: 'POST', body: JSON.stringify(data) }),
  submitIdea: (data: Partial<InnovationIdea>) => fetchAPI<InnovationIdea>('/api/organization/innovation/ideas', { method: 'POST', body: JSON.stringify(data) }),
  approveIdea: (id: string) => fetchAPI<InnovationIdea>(`/api/organization/innovation/ideas/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Approved' }) }),
  getCommunities: () => fetchAPI<InnovationCommunity[]>('/api/organization/innovation/communities'),

  // Risk & Talent Endpoints
  getSkillShortages: () => fetchAPI<any[]>('/api/organization/talent/skill-shortages'),
  getRiskProfiles: () => fetchAPI<RiskProfile[]>('/api/organization/talent/risks'),
  getInterventionEffectiveness: () => fetchAPI<any[]>('/api/organization/interventions/effectiveness'),
  runSimulation: (data: any) => fetchAPI<any>('/api/organization/simulation/run', { method: 'POST', body: JSON.stringify(data) }),
  getGigs: () => fetchAPI<any[]>('/api/organization/talent/gigs'),
  getMentors: () => fetchAPI<any[]>('/api/organization/talent/mentors'),
  getTeamBuilderOptions: () => fetchAPI<any[]>('/api/organization/talent/team-builder'),


  // Strategy Role Architect Endpoints
  getStrategyOverview: (department?: string) =>
    fetchAPI<any>(`/api/organization/strategy/overview${buildQueryString({ department })}`),

  getStrategyRoleSpecs: (department?: string) =>
    fetchAPI<any[]>(`/api/organization/strategy/role-specs${buildQueryString({ department })}`),

  translateStrategy: (department?: string) =>
    fetchAPI<any>('/api/organization/strategy/translate', {
      method: 'POST',
      body: JSON.stringify({ department }),
    }),

  searchKnowledgeGraph: (q: string) =>
    fetchAPI<{ results: any[]; total: number }>(`/api/organization/strategy/knowledge-search${buildQueryString({ q })}`),

  // Applications
  getApplications: (params?: { opportunity_type?: string; employee_id?: string }) =>
    fetchAPI<any[]>(`/api/organization/talent/applications?${new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString()}`),

  submitApplication: (data: { opportunity_id: string; opportunity_type: string; opportunity_title: string; applicant_employee_id?: string }) =>
    fetchAPI<any>('/api/organization/talent/applications', {
      method: 'POST',
      body: JSON.stringify({ status: 'Under Review', ...data }),
    }),

  updateApplicationStatus: (id: string, status: string) =>
    fetchAPI<any>(`/api/organization/talent/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ==================== DEPARTMENTS ====================

export interface Department {
  id: string;
  name: string;
  region: string;
  function: string;
  headcount: number;
  open_positions: number;
  allocated_budget: number;
  actual_spend: number;
  performance_score: number;
  target_score: number;
  enps: number;
  attrition_rate: number;
  risk_level: string;
}

export const departmentsAPI = {
  list: (params?: { region?: string; function?: string; risk_level?: string; limit?: number }) =>
    fetchAPI<Department[]>(`/api/departments?${new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString()}`),

  get: (id: string) => fetchAPI<Department>(`/api/departments/${id}`),

  getSummary: () => fetchAPI<any>('/api/departments/summary'),
};



// ==================== KNOWLEDGE INTELLIGENCE ====================

export interface KnowledgeSource {
  id: string;
  employee_id: string;
  name: string;
  original_filename?: string;
  type?: string;
  source_type?: string;
  status: string;
  processing_stage?: string;
  file_size?: number;
  mime_type?: string;
  coverage: number;
  skills_extracted: number;
  projects_found: number;
  confidence: number;
  connected: boolean;
  error_code?: string;
  error_message?: string;
  analysis_result?: {
    skills_count?: number;
    projects_count?: number;
    certifications_count?: number;
    experience_count?: number;
    education_count?: number;
  };
  last_synced?: string;
  processed_at?: string;
  created_at?: string;
}

export interface KnowledgeUploadResponse {
  source_id: string;
  status: string;
  message: string;
  skills_added: number;
  skills_updated: number;
  projects_added: number;
  certifications_added: number;
  conflicts: number;
}

export interface KnowledgeChangeEvent {
  id: string;
  operation: string;
  entity_type: string;
  entity_key: string;
  old_value?: any;
  new_value?: any;
  confidence?: number;
  reason?: string;
  evidence_text?: string;
  requires_approval: boolean;
  approval_status?: string;
  created_at?: string;
}

async function uploadFileToAPI(endpoint: string, file: File): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(url, { method: 'POST', headers, body: formData });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const knowledgeAPI = {
  upload: (employeeId: string, file: File): Promise<KnowledgeUploadResponse> =>
    uploadFileToAPI(`/api/employees/${employeeId}/knowledge-sources/upload`, file),

  uploadSync: (employeeId: string, file: File): Promise<KnowledgeUploadResponse> =>
    uploadFileToAPI(`/api/employees/${employeeId}/knowledge-sources/upload-sync`, file),

  list: (employeeId: string): Promise<KnowledgeSource[]> =>
    fetchAPI<KnowledgeSource[]>(`/api/employees/${employeeId}/knowledge-sources`),

  get: (employeeId: string, sourceId: string): Promise<KnowledgeSource> =>
    fetchAPI<KnowledgeSource>(`/api/employees/${employeeId}/knowledge-sources/${sourceId}`),

  reprocess: (employeeId: string, sourceId: string): Promise<any> =>
    fetchAPI<any>(`/api/employees/${employeeId}/knowledge-sources/${sourceId}/reprocess`, {
      method: 'POST',
    }),

  deleteSource: (employeeId: string, sourceId: string): Promise<void> =>
    fetchAPI<void>(`/api/employees/${employeeId}/knowledge-sources/${sourceId}`, {
      method: 'DELETE',
    }),

  getChanges: (employeeId: string, sourceId: string): Promise<KnowledgeChangeEvent[]> =>
    fetchAPI<KnowledgeChangeEvent[]>(
      `/api/employees/${employeeId}/knowledge-sources/${sourceId}/changes`
    ),

  getChangeHistory: (employeeId: string): Promise<KnowledgeChangeEvent[]> =>
    fetchAPI<KnowledgeChangeEvent[]>(`/api/employees/${employeeId}/knowledge/change-history`),
};

// ==================== WORKFORCE INTELLIGENCE (MODULE 2) ====================

export const workforceAPI = {
  getCapabilityGaps: () =>
    fetchAPI<any>(`/api/workforce/capability-gaps`),

  getCriticalRolesAtRisk: () =>
    fetchAPI<any>(`/api/workforce/critical-roles-at-risk`),

  getThresholds: () =>
    fetchAPI<any>(`/api/workforce/thresholds`),

  updateThresholds: (data: any) =>
    fetchAPI<any>(`/api/workforce/thresholds`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  recordCertification: (data: any) =>
    fetchAPI<any>(`/api/workforce/certifications/record`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCertificationExpiry: (employeeId?: string) =>
    fetchAPI<any[]>(`/api/workforce/certifications/expiry${buildQueryString({ employee_id: employeeId })}`),

  getEmployees: () =>
    fetchAPI<any[]>(`/api/workforce/employees`),

  createEmployee: (data: any) =>
    fetchAPI<any>(`/api/workforce/employees`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSkills: (employeeId?: string) =>
    fetchAPI<any[]>(`/api/workforce/skills${buildQueryString({ employee_id: employeeId })}`),

  createSkill: (data: any) =>
    fetchAPI<any>(`/api/workforce/skills`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default {
  auth: authAPI,
  employee: employeeAPI,
  gamification: gamificationAPI,
  learning: learningAPI,
  career: careerAPI,
  organization: organizationAPI,
  departments: departmentsAPI,
  workforce: workforceAPI,
  knowledge: knowledgeAPI,
};

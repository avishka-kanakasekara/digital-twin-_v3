/**
 * API client utility for Digital Twin v3 backend
 * Provides typed functions for all backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
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

export const employeeAPI = {
  list: (params?: { skip?: number; limit?: number; department?: string }) =>
    fetchAPI<{ employees: Employee[]; total: number }>(
      `/api/employees?${new URLSearchParams(params as any).toString()}`
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
  
  getKnowledgeSources: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/knowledge-sources`),
  
  getRecognitions: (id: string) =>
    fetchAPI<any[]>(`/api/employees/${id}/recognitions`),
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
  
  getLeaderboard: (params?: { dept?: string; limit?: number }) =>
    fetchAPI<any[]>(`/api/gamification/leaderboard?${new URLSearchParams(params as any).toString()}`),
  
  getChallenges: (employeeId: string) =>
    fetchAPI<{ challenges: Challenge[]; progress: ChallengeProgress[] }>(`/api/gamification/${employeeId}/challenges`),
  
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
  
  claimReward: (employeeId: string, rewardId: string) =>
    fetchAPI<any>(`/api/gamification/${employeeId}/rewards/${rewardId}/claim`, {
      method: 'POST',
    }),
};

// ==================== LEARNING ====================

export interface LearningPath {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  progress: number;
  total_courses: number;
  completed_courses: number;
  estimated_hours: number;
  due_date?: string;
  tags: any;
  color: string;
  is_ai_recommended: boolean;
  platform: string;
  instructor: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  hours: number;
  level: string;
  rating: number;
  enrolled_count: number;
  tags: any;
  emoji: string;
  color: string;
  description: string;
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
    fetchAPI<any>(`/api/learning/${employeeId}/profile`),
  
  getPaths: (employeeId: string) =>
    fetchAPI<LearningPath[]>(`/api/learning/${employeeId}/paths`),
  
  updatePathProgress: (employeeId: string, pathId: string, progress: number) =>
    fetchAPI<LearningPath>(`/api/learning/${employeeId}/paths/${pathId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    }),
  
  getSkillGaps: (employeeId: string) =>
    fetchAPI<any>(`/api/learning/${employeeId}/skill-gaps`),
  
  getCertifications: (employeeId: string) =>
    fetchAPI<Certification[]>(`/api/learning/${employeeId}/certifications`),
  
  addCertification: (employeeId: string, data: Omit<Certification, 'id' | 'employee_id' | 'created_at'>) =>
    fetchAPI<Certification>(`/api/learning/${employeeId}/certifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getFeed: (employeeId: string) =>
    fetchAPI<any[]>(`/api/learning/${employeeId}/feed`),
  
  getCourses: (params?: { search?: string; category?: string; level?: string }) =>
    fetchAPI<Course[]>(`/api/learning/courses?${new URLSearchParams(params as any).toString()}`),
  
  enrollCourse: (employeeId: string, courseId: string) =>
    fetchAPI<any>(`/api/learning/${employeeId}/courses/${courseId}/enroll`, {
      method: 'POST',
    }),
  
  updateCourseProgress: (employeeId: string, courseId: string, progress: number) =>
    fetchAPI<any>(`/api/learning/${employeeId}/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    }),
  
  getSchedule: (employeeId: string) =>
    fetchAPI<any>(`/api/learning/${employeeId}/schedule`),
  
  getHours: (employeeId: string) =>
    fetchAPI<any>(`/api/learning/${employeeId}/hours`),
};

// ==================== CAREER ====================

export interface CareerGoal {
  id: string;
  employee_id: string;
  target_role: string;
  timeline: string;
  focus_area: string;
  target_industry: string;
  readiness_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapStep {
  id: string;
  career_goal_id: string;
  step_order: number;
  title: string;
  status: string;
  description: string;
}

export const careerAPI = {
  getGoal: (employeeId: string) =>
    fetchAPI<CareerGoal>(`/api/career/${employeeId}/goal`),
  
  setGoal: (employeeId: string, data: Omit<CareerGoal, 'id' | 'employee_id' | 'readiness_score' | 'created_at' | 'updated_at'>) =>
    fetchAPI<CareerGoal>(`/api/career/${employeeId}/goal`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getRoadmap: (employeeId: string) =>
    fetchAPI<RoadmapStep[]>(`/api/career/${employeeId}/roadmap`),
  
  getSkillGaps: (employeeId: string) =>
    fetchAPI<any>(`/api/career/${employeeId}/skill-gaps`),
  
  getRecommendations: (employeeId: string) =>
    fetchAPI<any[]>(`/api/career/${employeeId}/recommendations`),
  
  getMarketTrends: () =>
    fetchAPI<any>('/api/career/market-trends'),
  
  computeReadiness: (employeeId: string) =>
    fetchAPI<{ readiness_score: number; gap_areas: any[] }>(`/api/career/${employeeId}/readiness`, {
      method: 'POST',
    }),
};

export default {
  auth: authAPI,
  employee: employeeAPI,
  gamification: gamificationAPI,
  learning: learningAPI,
  career: careerAPI,
};

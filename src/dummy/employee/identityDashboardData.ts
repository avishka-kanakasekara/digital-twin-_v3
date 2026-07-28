export interface EmployeeProfile {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  department: string;
  role: string;
  manager: string;
  employmentStatus: 'Active' | 'On Leave' | 'Probation';
  officeLocation: string;
  yearsOfExperience: number;
  education: string[];
  languages: { name: string; proficiency: string }[];
  currentProjects: string[];
  biography: string;
}

export type SkillTrend = 'up' | 'down' | 'stable';

export interface Skill {
  id: string;
  name: string;
  icon: string;
  currentLevel: number;
  targetLevel: number;
  trend: SkillTrend;
  yearsExperience: number;
  aiRecommendation: string;
}

export type SkillCategoryId =
  | 'technical'
  | 'soft'
  | 'leadership'
  | 'ai'
  | 'cloud'
  | 'business';

export interface SkillCategoryData {
  id: SkillCategoryId;
  label: string;
  description: string;
  skills: Skill[];
}

export type RecognitionType =
  | 'award'
  | 'achievement'
  | 'peer'
  | 'innovation'
  | 'mentoring'
  | 'badge'
  | 'eom'
  | 'top-performer';

export interface RecognitionItem {
  id: string;
  type: RecognitionType;
  title: string;
  description: string;
  date: string;
  awardedBy?: string;
}

export interface CompetencyItem {
  id: string;
  name: string;
  currentLevel: number;
  targetLevel: number;
  category: string;
}

export interface LearningRecommendation {
  id: string;
  title: string;
  provider: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  skillImpact: string;
  estimatedImprovement: number;
}

export interface IdentityScores {
  identityScore: number;
  profileCompletion: number;
  skillsScore: number;
  recognitionScore: number;
  competencyScore: number;
  overallHealth: number;
}

export type ActivityType =
  | 'certification'
  | 'award'
  | 'skill'
  | 'project'
  | 'training';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: ActivityType;
}

export interface SkillSummaryMetric {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export const mockEmployeeProfile: EmployeeProfile = {
  id: 'EMP-2847',
  fullName: 'Alex Carter',
  initials: 'AC',
  email: 'alex.carter@company.com',
  department: 'Product & Engineering',
  role: 'Senior Cloud Engineer',
  manager: 'Sarah Mitchell',
  employmentStatus: 'Active',
  officeLocation: 'Colombo, Sri Lanka',
  yearsOfExperience: 8,
  education: [
    'MSc Computer Science — University of Colombo (2018)',
    'BSc Software Engineering — University of Moratuwa (2016)',
  ],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Sinhala', proficiency: 'Native' },
    { name: 'Tamil', proficiency: 'Conversational' },
  ],
  currentProjects: [
    'Cloud Migration Phase 2',
    'Internal Identity Platform',
    'AI Readiness Assessment',
  ],
  biography:
    'Senior Cloud Engineer with 8 years of experience architecting scalable cloud infrastructure on AWS and Azure. Passionate about platform engineering, DevSecOps, and mentoring junior engineers. Currently leading the enterprise cloud migration initiative while building internal identity intelligence capabilities.',
};

export const mockSkillCategories: SkillCategoryData[] = [
  {
    id: 'technical',
    label: 'Technical Skills',
    description: 'Core engineering and development competencies',
    skills: [
      {
        id: 'ts-1',
        name: 'Kubernetes',
        icon: 'Boxes',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 4,
        aiRecommendation: 'Complete CKA certification to reach expert level',
      },
      {
        id: 'ts-2',
        name: 'Terraform',
        icon: 'Layers',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 3,
        aiRecommendation: 'Lead infrastructure-as-code guild sessions',
      },
      {
        id: 'ts-3',
        name: 'Go Programming',
        icon: 'Code2',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'stable',
        yearsExperience: 2,
        aiRecommendation: 'Build a microservice in Go for hands-on practice',
      },
    ],
  },
  {
    id: 'soft',
    label: 'Soft Skills',
    description: 'Interpersonal and communication abilities',
    skills: [
      {
        id: 'ss-1',
        name: 'Communication',
        icon: 'MessageCircle',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 8,
        aiRecommendation: 'Present at the next engineering all-hands',
      },
      {
        id: 'ss-2',
        name: 'Collaboration',
        icon: 'Users',
        currentLevel: 5,
        targetLevel: 5,
        trend: 'stable',
        yearsExperience: 8,
        aiRecommendation: 'Maintain cross-team collaboration excellence',
      },
      {
        id: 'ss-3',
        name: 'Problem Solving',
        icon: 'Lightbulb',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 7,
        aiRecommendation: 'Document complex troubleshooting in a knowledge base',
      },
    ],
  },
  {
    id: 'leadership',
    label: 'Leadership Skills',
    description: 'People management and strategic influence',
    skills: [
      {
        id: 'ls-1',
        name: 'Team Leadership',
        icon: 'Crown',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'up',
        yearsExperience: 2,
        aiRecommendation: 'Take ownership of the cloud guild initiative',
      },
      {
        id: 'ls-2',
        name: 'Strategic Thinking',
        icon: 'Compass',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'up',
        yearsExperience: 3,
        aiRecommendation: 'Contribute to the 2026 cloud roadmap planning',
      },
      {
        id: 'ls-3',
        name: 'Decision Making',
        icon: 'GitBranch',
        currentLevel: 4,
        targetLevel: 4,
        trend: 'stable',
        yearsExperience: 5,
        aiRecommendation: 'Continue leading architecture review sessions',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI Skills',
    description: 'Artificial intelligence and machine learning capabilities',
    skills: [
      {
        id: 'ai-1',
        name: 'Prompt Engineering',
        icon: 'Sparkles',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 1,
        aiRecommendation: 'Build an internal AI assistant prototype',
      },
      {
        id: 'ai-2',
        name: 'ML Fundamentals',
        icon: 'Brain',
        currentLevel: 2,
        targetLevel: 4,
        trend: 'up',
        yearsExperience: 1,
        aiRecommendation: 'Enroll in AWS Machine Learning Specialty',
      },
      {
        id: 'ai-3',
        name: 'AI Ethics & Governance',
        icon: 'Shield',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'stable',
        yearsExperience: 1,
        aiRecommendation: 'Join the AI governance working group',
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud Skills',
    description: 'Cloud platform and infrastructure expertise',
    skills: [
      {
        id: 'cs-1',
        name: 'AWS Architecture',
        icon: 'Cloud',
        currentLevel: 5,
        targetLevel: 5,
        trend: 'stable',
        yearsExperience: 6,
        aiRecommendation: 'Mentor others preparing for Solutions Architect Pro',
      },
      {
        id: 'cs-2',
        name: 'Azure Services',
        icon: 'CloudCog',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'up',
        yearsExperience: 2,
        aiRecommendation: 'Complete AZ-305 certification path',
      },
      {
        id: 'cs-3',
        name: 'Cloud Security',
        icon: 'Lock',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 4,
        aiRecommendation: 'Implement zero-trust patterns in migration phase 2',
      },
    ],
  },
  {
    id: 'business',
    label: 'Business Skills',
    description: 'Business acumen and domain knowledge',
    skills: [
      {
        id: 'bs-1',
        name: 'Stakeholder Management',
        icon: 'Handshake',
        currentLevel: 4,
        targetLevel: 5,
        trend: 'up',
        yearsExperience: 5,
        aiRecommendation: 'Lead quarterly business review presentations',
      },
      {
        id: 'bs-2',
        name: 'Financial Acumen',
        icon: 'TrendingUp',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'up',
        yearsExperience: 2,
        aiRecommendation: 'Complete cloud cost optimization workshop',
      },
      {
        id: 'bs-3',
        name: 'Product Thinking',
        icon: 'Target',
        currentLevel: 3,
        targetLevel: 4,
        trend: 'stable',
        yearsExperience: 3,
        aiRecommendation: 'Partner with PM on identity platform user stories',
      },
    ],
  },
];

export const mockRecognitionItems: RecognitionItem[] = [
  {
    id: 'rec-1',
    type: 'award',
    title: 'Cloud Excellence Award',
    description: 'Recognized for leading successful AWS migration reducing latency by 35%',
    date: '2025-11-15',
    awardedBy: 'CTO Office',
  },
  {
    id: 'rec-2',
    type: 'innovation',
    title: 'Innovation Champion',
    description: 'Designed automated IaC pipeline adopted across 4 engineering teams',
    date: '2025-09-22',
    awardedBy: 'Innovation Council',
  },
  {
    id: 'rec-3',
    type: 'peer',
    title: 'Peer Recognition — 47 Kudos',
    description: 'Top peer-nominated engineer in Q4 for mentorship and collaboration',
    date: '2025-12-01',
    awardedBy: 'Engineering Team',
  },
  {
    id: 'rec-4',
    type: 'mentoring',
    title: 'Mentor of the Quarter',
    description: 'Mentored 3 junior engineers through cloud certification journeys',
    date: '2025-10-10',
    awardedBy: 'People & Culture',
  },
  {
    id: 'rec-5',
    type: 'eom',
    title: 'Employee of the Month',
    description: 'Outstanding contribution to Cloud Migration Phase 1 delivery',
    date: '2025-08-01',
    awardedBy: 'Leadership Team',
  },
  {
    id: 'rec-6',
    type: 'top-performer',
    title: 'Top Performer — H1 2025',
    description: 'Exceeded all performance objectives with 4.8/5 rating',
    date: '2025-07-15',
    awardedBy: 'HR Analytics',
  },
  {
    id: 'rec-7',
    type: 'achievement',
    title: '500-Day Streak',
    description: 'Consistent daily contributions and knowledge sharing for 500 days',
    date: '2025-06-30',
  },
  {
    id: 'rec-8',
    type: 'badge',
    title: 'AWS Solutions Architect Pro',
    description: 'Verified professional certification badge',
    date: '2025-04-18',
    awardedBy: 'AWS',
  },
];

export const mockCompetencies: CompetencyItem[] = [
  { id: 'comp-1', name: 'Cloud Architecture', currentLevel: 4, targetLevel: 5, category: 'Technical' },
  { id: 'comp-2', name: 'DevSecOps', currentLevel: 4, targetLevel: 5, category: 'Technical' },
  { id: 'comp-3', name: 'People Leadership', currentLevel: 3, targetLevel: 4, category: 'Leadership' },
  { id: 'comp-4', name: 'AI/ML Literacy', currentLevel: 2, targetLevel: 4, category: 'Emerging' },
  { id: 'comp-5', name: 'Business Strategy', currentLevel: 3, targetLevel: 4, category: 'Business' },
  { id: 'comp-6', name: 'Change Management', currentLevel: 3, targetLevel: 4, category: 'Leadership' },
];

export const mockLearningRecommendations: LearningRecommendation[] = [
  {
    id: 'lr-1',
    title: 'AWS Machine Learning Specialty',
    provider: 'AWS Training',
    duration: '40 hours',
    priority: 'high',
    skillImpact: 'AI Skills + ML Fundamentals',
    estimatedImprovement: 25,
  },
  {
    id: 'lr-2',
    title: 'Certified Kubernetes Administrator (CKA)',
    provider: 'CNCF',
    duration: '30 hours',
    priority: 'high',
    skillImpact: 'Technical Skills + Kubernetes',
    estimatedImprovement: 20,
  },
  {
    id: 'lr-3',
    title: 'Executive Leadership Program',
    provider: 'Internal L&D',
    duration: '12 weeks',
    priority: 'medium',
    skillImpact: 'Leadership Skills + Strategic Thinking',
    estimatedImprovement: 15,
  },
  {
    id: 'lr-4',
    title: 'Cloud Financial Management',
    provider: 'FinOps Foundation',
    duration: '16 hours',
    priority: 'medium',
    skillImpact: 'Business Skills + Financial Acumen',
    estimatedImprovement: 18,
  },
];

export const mockIdentityScores: IdentityScores = {
  identityScore: 87,
  profileCompletion: 92,
  skillsScore: 84,
  recognitionScore: 91,
  competencyScore: 78,
  overallHealth: 86,
};

export const mockSkillSummaryMetrics: SkillSummaryMetric[] = [
  { id: 'sm-1', label: 'Technical', value: 82, maxValue: 100, color: 'var(--color-primary)' },
  { id: 'sm-2', label: 'Leadership', value: 68, maxValue: 100, color: 'var(--color-secondary)' },
  { id: 'sm-3', label: 'AI Readiness', value: 58, maxValue: 100, color: 'var(--color-info)' },
  { id: 'sm-4', label: 'Business', value: 72, maxValue: 100, color: 'var(--color-success)' },
];

export const mockActivityTimeline: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Completed AWS Solutions Architect Professional',
    description: 'Achieved professional-level AWS certification with score of 892/1000',
    date: '2026-01-18',
    type: 'certification',
  },
  {
    id: 'act-2',
    title: 'Received Innovation Award',
    description: 'Recognized for designing automated IaC pipeline adopted by 4 teams',
    date: '2025-11-15',
    type: 'award',
  },
  {
    id: 'act-3',
    title: 'Updated AI Skills Profile',
    description: 'Added Prompt Engineering and ML Fundamentals to Skills DNA',
    date: '2025-10-28',
    type: 'skill',
  },
  {
    id: 'act-4',
    title: 'Joined Project Alpha — Identity Platform',
    description: 'Assigned as technical lead for enterprise identity intelligence module',
    date: '2025-10-01',
    type: 'project',
  },
  {
    id: 'act-5',
    title: 'Completed Leadership Training',
    description: 'Finished "Leading High-Performance Teams" program with distinction',
    date: '2025-09-12',
    type: 'training',
  },
  {
    id: 'act-6',
    title: 'Earned Mentor of the Quarter',
    description: 'Recognized for mentoring 3 engineers through certification journeys',
    date: '2025-08-20',
    type: 'award',
  },
];

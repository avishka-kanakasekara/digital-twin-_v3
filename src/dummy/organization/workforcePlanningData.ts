export const mockHiringAttrition = [
  { month: 'Jan', hired: 45, attrition: 12 },
  { month: 'Feb', hired: 52, attrition: 15 },
  { month: 'Mar', hired: 38, attrition: 18 },
  { month: 'Apr', hired: 65, attrition: 14 },
  { month: 'May', hired: 48, attrition: 22 },
  { month: 'Jun', hired: 55, attrition: 16 },
];

export const mockDeptDistribution = [
  { name: 'Engineering', employees: 450 },
  { name: 'Sales', employees: 320 },
  { name: 'Marketing', employees: 180 },
  { name: 'Support', employees: 150 },
  { name: 'HR & Ops', employees: 90 },
];
export const DEPT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

export const mockExperience = [
  { name: 'Junior (0-2y)', value: 25 },
  { name: 'Mid (3-5y)', value: 45 },
  { name: 'Senior (6-9y)', value: 20 },
  { name: 'Lead (10y+)', value: 10 },
];
export const EXP_COLORS = ['#93c5fd', '#60a5fa', '#2563eb', '#1e3a8a'];

export const mockSkills = [
  { subject: 'Cloud & DevOps', A: 120, fullMark: 150 },
  { subject: 'Frontend', A: 98, fullMark: 150 },
  { subject: 'Backend', A: 86, fullMark: 150 },
  { subject: 'Data Science', A: 99, fullMark: 150 },
  { subject: 'UI/UX Design', A: 85, fullMark: 150 },
  { subject: 'Management', A: 65, fullMark: 150 },
];

export const mockSkillShortages = [
  { rank: '#1', role: 'Cloud Engineer', skill: 'AWS / Kubernetes', dept: 'Engineering', urgency: 'HIGH', gap: -9 },
  { rank: '#2', role: 'Account Executive', skill: 'Enterprise Sales', dept: 'Sales', urgency: 'MEDIUM', gap: -4 },
  { rank: '#3', role: 'Data Scientist', skill: 'Machine Learning', dept: 'Data & Analytics', urgency: 'HIGH', gap: -2 },
];

export const mockHiringAttrition = [
  { month: 'Jan', hired: 45, attrition: 12 },
  { month: 'Feb', hired: 52, attrition: 15 },
  { month: 'Mar', hired: 38, attrition: 18 },
  { month: 'Apr', hired: 65, attrition: 14 },
  { month: 'May', hired: 48, attrition: 22 },
  { month: 'Jun', hired: 55, attrition: 16 },
  { month: 'Jul', hired: 70, attrition: 20 },
  { month: 'Aug', hired: 60, attrition: 13 },
  { month: 'Sep', hired: 43, attrition: 17 },
  { month: 'Oct', hired: 58, attrition: 19 },
  { month: 'Nov', hired: 66, attrition: 11 },
  { month: 'Dec', hired: 50, attrition: 14 },
];

export const mockDeptDistribution = [
  { name: 'Engineering', employees: 450 },
  { name: 'Sales', employees: 320 },
  { name: 'Marketing', employees: 180 },
  { name: 'Support', employees: 150 },
  { name: 'Data & Analytics', employees: 110 },
  { name: 'HR & Ops', employees: 90 },
  { name: 'Finance', employees: 75 },
  { name: 'Product', employees: 65 },
];
export const DEPT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#f97316', '#6366f1'];

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
  { subject: 'Cybersecurity', A: 55, fullMark: 150 },
  { subject: 'Mobile Dev', A: 72, fullMark: 150 },
];

export const mockSkillShortages = [
  { rank: '#1', role: 'Cloud Engineer', skill: 'AWS / Kubernetes', dept: 'Engineering', urgency: 'HIGH', gap: -9 },
  { rank: '#2', role: 'Account Executive', skill: 'Enterprise Sales', dept: 'Sales', urgency: 'MEDIUM', gap: -4 },
  { rank: '#3', role: 'Data Scientist', skill: 'Machine Learning', dept: 'Data & Analytics', urgency: 'HIGH', gap: -7 },
  { rank: '#4', role: 'Cybersecurity Analyst', skill: 'Threat Analysis / SIEM', dept: 'IT Security', urgency: 'HIGH', gap: -3 },
  { rank: '#5', role: 'Mobile Developer', skill: 'React Native / Flutter', dept: 'Engineering', urgency: 'MEDIUM', gap: -5 },
];

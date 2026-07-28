export const mockOptionA = {
  id: 'alpha',
  name: 'Option A: High Collaboration',
  successRate: 94,
  compatibilityScore: 96,
  skillBalance: 88,
  performancePrediction: 92,
  rationale: 'Excellent past collaboration history on 3 similar projects.',
  members: [
    { id: 1, name: 'Kasun Bandara', role: 'Cloud Architect', match: 98, skills: ['AWS', 'Terraform', 'Kubernetes'] },
    { id: 2, name: 'Sanduni Silva', role: 'UX Lead', match: 92, skills: ['Figma', 'User Research', 'Prototyping'] },
    { id: 3, name: 'Nuwan Perera', role: 'Backend Engineer', match: 88, skills: ['Node.js', 'PostgreSQL', 'Redis'] },
    { id: 4, name: 'Anuradha Fernando', role: 'Product Manager', match: 95, skills: ['Agile', 'Roadmapping', 'Jira'] },
  ]
};

export const mockOptionB = {
  id: 'beta',
  name: 'Option B: Highest Skill Match',
  successRate: 88,
  compatibilityScore: 75,
  skillBalance: 99,
  performancePrediction: 85,
  rationale: 'Maximum technical skill coverage, though team has not worked together before.',
  members: [
    { id: 5, name: 'Lahiru Kumara', role: 'Sr. Cloud Architect', match: 100, skills: ['AWS', 'Terraform', 'Kubernetes', 'Go'] },
    { id: 6, name: 'Kavindi Alwis', role: 'UX Designer', match: 95, skills: ['Figma', 'UI/UX'] },
    { id: 7, name: 'Ruwan Wijesinghe', role: 'Backend Lead', match: 96, skills: ['Node.js', 'PostgreSQL', 'GraphQL'] },
    { id: 4, name: 'Anuradha Fernando', role: 'Product Manager', match: 95, skills: ['Agile', 'Roadmapping', 'Jira'] },
  ]
};

export const predefinedSkills = ['AWS', 'Node.js', 'React', 'Figma', 'PostgreSQL', 'Agile', 'Terraform'];

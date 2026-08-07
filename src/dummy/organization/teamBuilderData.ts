export const mockOptionA = {
  id: 'alpha',
  name: 'Option A: High Collaboration',
  successRate: 94,
  compatibilityScore: 96,
  skillBalance: 88,
  performancePrediction: 92,
  rationale: 'Excellent past collaboration history on 3 similar projects. Team has a proven track record of delivering on time.',
  members: [
    { id: 1, name: 'Kasun Bandara', role: 'Cloud Architect', match: 98, skills: ['AWS', 'Terraform', 'Kubernetes'] },
    { id: 2, name: 'Sanduni Silva', role: 'UX Lead', match: 92, skills: ['Figma', 'User Research', 'Prototyping'] },
    { id: 3, name: 'Nuwan Perera', role: 'Backend Engineer', match: 88, skills: ['Node.js', 'PostgreSQL', 'Redis'] },
    { id: 4, name: 'Anuradha Fernando', role: 'Product Manager', match: 95, skills: ['Agile', 'Roadmapping', 'Jira'] },
    { id: 5, name: 'Kavindi Alwis', role: 'Data Scientist', match: 86, skills: ['Python', 'scikit-learn', 'SQL'] },
  ]
};

export const mockOptionB = {
  id: 'beta',
  name: 'Option B: Highest Skill Match',
  successRate: 88,
  compatibilityScore: 75,
  skillBalance: 99,
  performancePrediction: 85,
  rationale: 'Maximum technical skill coverage, though team has not worked together before. High individual skill ratings.',
  members: [
    { id: 6, name: 'Lahiru Kumara', role: 'Sr. Cloud Architect', match: 100, skills: ['AWS', 'Terraform', 'Kubernetes', 'Go'] },
    { id: 7, name: 'Kavindi Alwis', role: 'UX Designer', match: 95, skills: ['Figma', 'UI/UX'] },
    { id: 8, name: 'Ruwan Wijesinghe', role: 'Backend Lead', match: 96, skills: ['Node.js', 'PostgreSQL', 'GraphQL'] },
    { id: 4, name: 'Anuradha Fernando', role: 'Product Manager', match: 95, skills: ['Agile', 'Roadmapping', 'Jira'] },
    { id: 9, name: 'Malitha Rathnayake', role: 'QA Lead', match: 90, skills: ['Selenium', 'Cypress', 'Jest'] },
  ]
};

export const mockOptionC = {
  id: 'gamma',
  name: 'Option C: Balanced Hybrid',
  successRate: 91,
  compatibilityScore: 85,
  skillBalance: 93,
  performancePrediction: 89,
  rationale: 'A balanced team with a mix of collaboration history and new skills. Low risk with moderate upside.',
  members: [
    { id: 1, name: 'Kasun Bandara', role: 'Cloud Architect', match: 98, skills: ['AWS', 'Terraform', 'Kubernetes'] },
    { id: 7, name: 'Kavindi Alwis', role: 'UX Designer', match: 95, skills: ['Figma', 'UI/UX'] },
    { id: 3, name: 'Nuwan Perera', role: 'Backend Engineer', match: 88, skills: ['Node.js', 'PostgreSQL', 'Redis'] },
    { id: 9, name: 'Malitha Rathnayake', role: 'QA Lead', match: 90, skills: ['Selenium', 'Cypress', 'Jest'] },
  ]
};

export const predefinedSkills = ['AWS', 'Node.js', 'React', 'Figma', 'PostgreSQL', 'Agile', 'Terraform', 'Python', 'GraphQL', 'Kubernetes', 'TypeScript', 'Scrum'];

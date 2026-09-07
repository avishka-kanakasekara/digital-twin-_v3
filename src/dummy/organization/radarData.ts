export interface EmployeeRisk {
  name: string;
  role: string;
  dept: string;
  urgency: 'Critical (Key Project)' | 'Critical (Architecture)' | 'High' | 'Moderate';
  urgencyColor: string;
  burnoutScore: number;
  attritionRisk: number;
  perfCurrent: number;
  perfPrior: number;
}

export const mockRiskyEmployees: EmployeeRisk[] = [
  {
    name: 'Sanduni Silva',
    role: 'UX Designer',
    dept: 'Design',
    urgency: 'Critical (Key Project)',
    urgencyColor: 'text-danger bg-danger-light border-danger/20',
    burnoutScore: 85,
    attritionRisk: 78,
    perfCurrent: 3.1,
    perfPrior: 4.2
  },
  {
    name: 'Nuwan Perera',
    role: 'Backend Engineer',
    dept: 'Engineering',
    urgency: 'Critical (Architecture)',
    urgencyColor: 'text-danger bg-danger-light border-danger/20',
    burnoutScore: 78,
    attritionRisk: 65,
    perfCurrent: 2.9,
    perfPrior: 3.8
  },
  {
    name: 'Lahiru Kumara',
    role: 'Product Manager',
    dept: 'Product',
    urgency: 'High',
    urgencyColor: 'text-warning-dark bg-warning-light/50 border-warning/20',
    burnoutScore: 55,
    attritionRisk: 30,
    perfCurrent: 3.6,
    perfPrior: 3.5
  },
  {
    name: 'Anuradha Fernando',
    role: 'Sales Lead',
    dept: 'Sales',
    urgency: 'Moderate',
    urgencyColor: 'text-info bg-info/10 border-info/20',
    burnoutScore: 62,
    attritionRisk: 45,
    perfCurrent: 4.0,
    perfPrior: 4.5
  },
  {
    name: 'Kavindi Alwis',
    role: 'Data Scientist',
    dept: 'Data & Analytics',
    urgency: 'High',
    urgencyColor: 'text-warning-dark bg-warning-light/50 border-warning/20',
    burnoutScore: 71,
    attritionRisk: 55,
    perfCurrent: 3.4,
    perfPrior: 4.1
  },
  {
    name: 'Ruwan Wijesinghe',
    role: 'DevOps Engineer',
    dept: 'Engineering',
    urgency: 'Critical (Key Project)',
    urgencyColor: 'text-danger bg-danger-light border-danger/20',
    burnoutScore: 88,
    attritionRisk: 80,
    perfCurrent: 2.7,
    perfPrior: 4.0
  },
  {
    name: 'Thisara Jayawardena',
    role: 'Marketing Specialist',
    dept: 'Marketing',
    urgency: 'Moderate',
    urgencyColor: 'text-info bg-info/10 border-info/20',
    burnoutScore: 42,
    attritionRisk: 28,
    perfCurrent: 3.8,
    perfPrior: 3.9
  },
  {
    name: 'Malitha Rathnayake',
    role: 'QA Engineer',
    dept: 'Engineering',
    urgency: 'High',
    urgencyColor: 'text-warning-dark bg-warning-light/50 border-warning/20',
    burnoutScore: 60,
    attritionRisk: 48,
    perfCurrent: 3.3,
    perfPrior: 3.7
  }
];

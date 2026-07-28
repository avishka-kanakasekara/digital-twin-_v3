export const mockLocations = ['Kegalle Branch', 'Colombo HQ', 'Kandy', 'Galle', 'Kurunegala'];

export const mockBusinessUnits = [
  { name: 'Core Product', head: 'Kasun Bandara', headcount: 150 },
  { name: 'Enterprise Solutions', head: 'Nuwan Perera', headcount: 120 },
  { name: 'Emerging Tech', head: 'Sanduni Silva', headcount: 50 },
  { name: 'Regional Operations', head: 'Lahiru Kumara', headcount: 128 },
];

export const mockOKRs = [
  { 
    id: 1, 
    title: 'Get more people to use our App', 
    owner: 'Marketing Team', 
    progress: 75,
    status: 'on-track',
    initiatives: ['Run Facebook ads', 'Give a discount for new users']
  },
  { 
    id: 2, 
    title: 'Make the App faster', 
    owner: 'Tech Team', 
    progress: 45,
    status: 'at-risk',
    initiatives: ['Fix the slow login screen', 'Update the server']
  },
  { 
    id: 3, 
    title: 'Make customers happy', 
    owner: 'Support Team', 
    progress: 90,
    status: 'on-track',
    initiatives: ['Reply to emails in 1 hour', 'Add a live chat button']
  }
];

export const mockAIReadiness = {
  overallScore: 78,
  literacyScore: 72,
  adoptionScore: 81,
  automationOpportunities: [
    { role: 'Data Entry Specialist', potential: 92, department: 'Finance' },
    { role: 'Customer Support Tier 1', potential: 85, department: 'Support' },
    { role: 'HR Coordinator', potential: 65, department: 'HR' },
  ],
  deptProjects: [
    { dept: 'Engineering', count: 12 },
    { dept: 'Marketing', count: 5 },
    { dept: 'Sales', count: 3 },
  ]
};

export const mockCapabilities = [
  { name: 'Predictive Analytics', type: 'Digital', maturity: 4, gap: 1 },
  { name: 'Omnichannel Routing', type: 'Digital', maturity: 3, gap: 2 },
  { name: 'Agile Delivery', type: 'Business', maturity: 4, gap: 0 },
  { name: 'Talent Acquisition', type: 'Business', maturity: 2, gap: 3 },
];

export const mockTransformations = [
  {
    id: 1,
    name: 'Cloud-Native Migration',
    owner: 'IT Ops',
    progress: 85,
    status: 'on-track',
    milestones: [
      { name: 'Phase 1: Lift & Shift', completed: true },
      { name: 'Phase 2: Microservices', completed: false },
    ]
  },
  {
    id: 2,
    name: 'AI Copilot Rollout',
    owner: 'Product',
    progress: 30,
    status: 'at-risk',
    milestones: [
      { name: 'Internal Alpha', completed: true },
      { name: 'Beta Launch', completed: false },
      { name: 'GA', completed: false },
    ]
  }
];

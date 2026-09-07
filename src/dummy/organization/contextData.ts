export const mockLocations = ['Kegalle Branch', 'Colombo HQ', 'Kandy Office', 'Galle Regional', 'Kurunegala Branch'];

export const mockBusinessUnits = [
  { name: 'Core Product', head: 'Kasun Bandara', headcount: 150 },
  { name: 'Enterprise Solutions', head: 'Nuwan Perera', headcount: 120 },
  { name: 'Emerging Tech', head: 'Sanduni Silva', headcount: 50 },
  { name: 'Regional Operations', head: 'Lahiru Kumara', headcount: 128 },
  { name: 'Data & Intelligence', head: 'Kavindi Alwis', headcount: 80 },
  { name: 'Customer Success', head: 'Anuradha Fernando', headcount: 95 },
];

export const mockOKRs = [
  { 
    id: 1, 
    title: 'Increase Mobile App User Base by 40%', 
    owner: 'Marketing Team', 
    progress: 75,
    status: 'on-track',
    initiatives: ['Run targeted social media campaigns', 'Partner with local tech communities', 'Launch referral incentive program']
  },
  { 
    id: 2, 
    title: 'Reduce App Load Time to Under 1.5s', 
    owner: 'Engineering Team', 
    progress: 45,
    status: 'at-risk',
    initiatives: ['Optimize API gateway with caching layer', 'Migrate to edge computing (CDN)', 'Refactor legacy authentication module']
  },
  { 
    id: 3, 
    title: 'Achieve 95% Customer Satisfaction (CSAT)', 
    owner: 'Support Team', 
    progress: 90,
    status: 'on-track',
    initiatives: ['Implement live chat with <1 min response SLA', 'Launch self-service knowledge base', 'Weekly customer feedback review loops']
  },
  { 
    id: 4, 
    title: 'Launch AI-Powered HR Copilot to All Staff', 
    owner: 'HR & Product', 
    progress: 30,
    status: 'at-risk',
    initiatives: ['Complete internal alpha with 50 users', 'Train HR team on copilot workflows', 'Integrate with existing HRMS platform']
  },
  { 
    id: 5, 
    title: 'Open 2 New Regional Offices', 
    owner: 'Operations & Finance', 
    progress: 60,
    status: 'on-track',
    initiatives: ['Finalize Kandy office lease agreement', 'Recruit 30 staff for Galle Regional hub', 'Set up IT infrastructure for new locations']
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
    { role: 'Report Analyst', potential: 78, department: 'Data & Analytics' },
    { role: 'Logistics Coordinator', potential: 70, department: 'Operations' },
  ],
  deptProjects: [
    { dept: 'Engineering', count: 12 },
    { dept: 'Marketing', count: 5 },
    { dept: 'Sales', count: 3 },
    { dept: 'HR', count: 2 },
    { dept: 'Finance', count: 4 },
  ]
};

export const mockCapabilities = [
  { name: 'Predictive Analytics', type: 'Digital', maturity: 4, gap: 1 },
  { name: 'Omnichannel Routing', type: 'Digital', maturity: 3, gap: 2 },
  { name: 'Agile Delivery', type: 'Business', maturity: 4, gap: 0 },
  { name: 'Talent Acquisition', type: 'Business', maturity: 2, gap: 3 },
  { name: 'Real-time Data Streaming', type: 'Digital', maturity: 2, gap: 3 },
  { name: 'Customer 360 View', type: 'Business', maturity: 3, gap: 2 },
  { name: 'Automated Compliance', type: 'Digital', maturity: 1, gap: 4 },
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
      { name: 'Phase 2: Microservices Refactor', completed: true },
      { name: 'Phase 3: Serverless Functions', completed: false },
      { name: 'Phase 4: Full Decommission Legacy', completed: false },
    ]
  },
  {
    id: 2,
    name: 'AI Copilot Rollout',
    owner: 'Product',
    progress: 30,
    status: 'at-risk',
    milestones: [
      { name: 'Internal Alpha (50 users)', completed: true },
      { name: 'Beta Launch (500 users)', completed: false },
      { name: 'General Availability', completed: false },
    ]
  },
  {
    id: 3,
    name: 'Data Mesh Architecture',
    owner: 'Data & Analytics',
    progress: 55,
    status: 'on-track',
    milestones: [
      { name: 'Domain Ownership Model Defined', completed: true },
      { name: 'First 3 Data Products Live', completed: true },
      { name: 'Self-Serve Analytics Portal', completed: false },
    ]
  }
];

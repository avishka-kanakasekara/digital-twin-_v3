// digitalTwinMockData.ts

export const employeeProfile = {
  id: "EMP-2847",
  avatarUrl: "",
  initials: "AC",
  status: "Online",
  fullName: "Alex Carter",
  department: "Product & Engineering",
  role: "Senior Cloud Engineer",
  team: "Cloud Platform Foundation",
  manager: "Sarah Mitchell (Director of Eng.)",
  location: "Colombo, Sri Lanka",
  timezone: "IST (UTC+5:30)",
  email: "alex.carter@company.com",
  phone: "+94 77 123 4567",
  education: "MSc Computer Science, Univ. of Colombo",
  experience: 8,
  yearsInCompany: 4,
  employmentType: "Full-Time",
  languages: ["English (Native)", "Sinhala (Native)"],
  biography: "Senior Cloud Engineer with 8 years of experience in AI, Azure, and Enterprise Architecture. Passionate about scalable platforms, DevSecOps, and mentoring junior engineers.",
  headline: "Architecting the future of cloud platforms",
  stats: {
    promotionReadiness: "High",
    projectsCompleted: 14,
    projectsActive: 3,
    certifications: 5,
    badges: 12,
    recognitions: 8
  }
};

export const twinSummary = {
  aiConfidence: 94,
  profileCompleteness: 98,
  knowledgeFreshness: "High (Synced 2h ago)",
  lastUpdated: "2026-07-28T08:00:00Z",
  representationQuality: "Excellent",
  twinHealth: 96,
  summaryText: "This digital twin represents a Senior Cloud Engineer with 8 years of experience in AI, Azure and Enterprise Architecture. Currently leading three AI transformation projects while mentoring junior engineers. Strong background in Generative AI, Cloud Infrastructure and MLOps."
};

export const skillsData = {
  Technical: [
    { name: "Kubernetes", category: "DevOps", experience: 5, proficiency: 90, aiConfidence: 95, verified: true, source: "Project Repo", lastUpdated: "Today" },
    { name: "Terraform", category: "DevOps", experience: 4, proficiency: 85, aiConfidence: 92, verified: true, source: "Project Repo", lastUpdated: "Yesterday" },
    { name: "React / Next.js", category: "Programming", experience: 6, proficiency: 88, aiConfidence: 89, verified: true, source: "GitHub", lastUpdated: "1w ago" },
  ],
  Cloud: [
    { name: "AWS Architecture", category: "Cloud", experience: 6, proficiency: 95, aiConfidence: 98, verified: true, source: "Certifications", lastUpdated: "1m ago" },
    { name: "Azure Services", category: "Cloud", experience: 3, proficiency: 75, aiConfidence: 82, verified: false, source: "Self-Reported", lastUpdated: "2m ago" },
  ],
  AI: [
    { name: "Prompt Engineering", category: "AI Skills", experience: 2, proficiency: 80, aiConfidence: 85, verified: true, source: "Coursework", lastUpdated: "Today" },
    { name: "MLOps", category: "Data Science", experience: 3, proficiency: 70, aiConfidence: 75, verified: true, source: "Projects", lastUpdated: "1m ago" },
  ],
  Soft: [
    { name: "Team Leadership", category: "Leadership", experience: 3, proficiency: 80, aiConfidence: 85, verified: true, source: "Peer Review", lastUpdated: "2w ago" },
    { name: "System Design", category: "Business", experience: 5, proficiency: 85, aiConfidence: 88, verified: true, source: "Architecture Board", lastUpdated: "1m ago" },
  ]
};

export const certificationsTimeline = [
  { id: "c1", logo: "AWSIcon", name: "AWS Solutions Architect Professional", issueDate: "2025-01-15", expiry: "2028-01-15", credentialId: "AWS-PSA-1234", issuer: "Amazon Web Services", status: "Verified" },
  { id: "c2", logo: "KubernetesIcon", name: "Certified Kubernetes Administrator (CKA)", issueDate: "2024-06-20", expiry: "2027-06-20", credentialId: "CKA-5678", issuer: "Cloud Native Computing Foundation", status: "Verified" },
  { id: "c3", logo: "AzureIcon", name: "Microsoft Certified: Azure Fundamentals", issueDate: "2023-11-10", expiry: "No Expiry", credentialId: "AZ-900-910", issuer: "Microsoft", status: "Verified" },
];

export const aiReadiness = {
  overallScore: 78,
  breakdown: [
    { category: "AI Literacy", score: 85 },
    { category: "Prompt Engineering", score: 65 },
    { category: "LLM Usage", score: 90 },
    { category: "Copilot Usage", score: 95 },
    { category: "Automation Skills", score: 80 },
    { category: "AI Ethics", score: 70 },
    { category: "Responsible AI", score: 75 },
    { category: "Generative AI", score: 60 },
  ],
  recommendation: {
    message: "Your prompt engineering score is moderate.",
    action: "Complete Prompt Engineering Level 2.",
    impact: "+12 points"
  }
};

export const knowledgeSources = [
  { id: "ks1", name: "LinkedIn Profile", connected: true, lastUpdated: "2h ago", coverage: 85, skillsExtracted: 24, projects: 6, confidence: 92, type: "Integration" },
  { id: "ks2", name: "Alex_Carter_CV_2026.pdf", connected: true, lastUpdated: "1d ago", coverage: 95, skillsExtracted: 32, projects: 12, confidence: 96, type: "File" },
  { id: "ks3", name: "GitHub Connect", connected: true, lastUpdated: "1w ago", coverage: 70, skillsExtracted: 18, projects: 15, confidence: 99, type: "Integration" },
  { id: "ks4", name: "Q1_Performance_Review.docx", connected: true, lastUpdated: "1m ago", coverage: 60, skillsExtracted: 10, projects: 3, confidence: 90, type: "File" },
];

export const projectsIntelligence = {
  current: [
    { id: "p1", name: "Cloud Migration Phase 2", role: "Lead Architect", description: "Migrating legacy on-prem databases to AWS RDS with zero downtime.", technologies: ["AWS", "Terraform", "PostgreSQL"], duration: "6 Months", domain: "Infrastructure", complexity: "High", successScore: 92, leadershipScore: 88, status: "On Track" },
    { id: "p2", name: "AI Talent Marketplce", role: "Backend Engineer", description: "Building the matching engine for the internal talent marketplace.", technologies: ["Go", "Kubernetes", "Redis"], duration: "3 Months", domain: "HR Tech", complexity: "Medium", successScore: 85, leadershipScore: 75, status: "At Risk" }
  ],
  completed: [
    { id: "p3", name: "Auth Service V2", role: "Senior Engineer", description: "Rewrote the core authentication service to support OAuth2 and SSO.", technologies: ["Node.js", "Redis", "OAuth2"], duration: "4 Months", domain: "Security", complexity: "High", successScore: 98, leadershipScore: 85, customerRating: 4.8, status: "Completed" }
  ]
};

export const twinMemory = [
  { date: "Today", event: "AI Reprocessed Knowledge from GitHub (3 new repos)" },
  { date: "Yesterday", event: "Project Added: AI Talent Marketplace" },
  { date: "Last Week", event: "New Skill Extracted: Prompt Engineering (Level 2)" },
  { date: "2 Weeks Ago", event: "Uploaded Knowledge: Alex_Carter_CV_2026.pdf" },
  { date: "1 Month Ago", event: "Certificate Verified: AWS Solutions Architect" }
];

export const collaborationIntel = {
  stats: {
    availability: "Available (Capacity: 15h/week)",
    bestCommunication: "Slack (Async)",
    reputation: "Top 5% in Cloud Architecture",
    knowledgeConfidence: 94
  },
  questions: [
    "Can this employee help with Kubernetes?",
    "Has this employee worked on HR Tech domain?",
    "Who should contact this employee for mentorship?"
  ]
};

export const projectPrediction = {
  hypotheticalProject: "Generative AI Knowledge Base for Sales",
  successProbability: 88,
  skillMatch: 92,
  domainMatch: 60,
  leadershipMatch: 85,
  riskLevel: "Low",
  learningCurve: "Medium (Domain context needed)",
  expectedContribution: "High (Architecture & AI Integration)"
};

export const personalAnalytics = {
  productivity: [
    { day: "Mon", score: 85 }, { day: "Tue", score: 92 }, { day: "Wed", score: 78 }, { day: "Thu", score: 95 }, { day: "Fri", score: 88 }
  ],
  skillGrowth: [
    { month: "Jan", ai: 40, cloud: 85, leadership: 60 },
    { month: "Feb", ai: 45, cloud: 88, leadership: 65 },
    { month: "Mar", ai: 60, cloud: 90, leadership: 70 },
    { month: "Apr", ai: 78, cloud: 95, leadership: 80 }
  ]
};

export const gamification = {
  level: 42,
  xp: 14500,
  nextLevelXp: 15000,
  ranks: {
    aiReadiness: "#12 (Top 5%)",
    organization: "#84 (Top 10%)",
    department: "#8 (Top 2%)"
  },
  scores: {
    innovation: 850,
    knowledgeContribution: 1240,
    mentorship: 600,
    collaboration: 950
  },
  streaks: {
    learning: 14,
    project: 5
  },
  achievements: [
    { id: "a1", name: "Cloud Hero", description: "Migrated 10+ services", icon: "Cloud", unlocked: true },
    { id: "a2", name: "AI Explorer", description: "Reached 70+ AI Readiness", icon: "Sparkles", unlocked: true },
    { id: "a3", name: "Knowledge Master", description: "Connected 5+ knowledge sources", icon: "Database", unlocked: false },
    { id: "a4", name: "Top Collaborator", description: "Helped on 5 cross-team projects", icon: "Users", unlocked: true },
  ],
  missions: [
    { name: "Complete AI Course", xp: 500, completed: false },
    { name: "Update Profile", xp: 100, completed: true },
    { name: "Review Skills", xp: 150, completed: false },
  ]
};

export const aiRecommendations = [
  { id: "r1", text: "Complete Azure AI certification to boost Domain Match for upcoming projects.", type: "Certification" },
  { id: "r2", text: "Mentor 2 junior engineers in Kubernetes.", type: "Leadership" },
  { id: "r3", text: "Contribute to the 'Internal Identity Platform' repository to increase knowledge freshness.", type: "Project" },
];

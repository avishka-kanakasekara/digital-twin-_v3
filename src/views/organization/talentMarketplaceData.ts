// Generated from Data3 CSVs & Word Specification Section 4
export interface RequiredSkill {
  skill_id: string;
  skill_name: string;
  target_proficiency: number;
  category: string;
}

export interface SkillGap {
  skill_id: string;
  skill_name: string;
  held_proficiency: number;
  target_proficiency: number;
  gap_levels: number;
  learning_hours: number;
}

export interface MarketplaceOpportunity {
  opportunity_id: string;
  opportunity_type: 'Role' | 'Project' | 'Gig' | 'Secondment';
  linked_role_id: string;
  linked_project_id: string;
  org_unit_id: string;
  org_unit_name: string;
  hiring_manager_id: string;
  hiring_manager_name: string;
  title: string;
  description: string;
  required_skills: RequiredSkill[];
  preferred_skills: { skill_id: string; skill_name: string; category: string }[];
  min_years_experience: number;
  qualifications_required: string;
  criticality_rating: 'Tier 1' | 'Tier 2' | 'Tier 3';
  published_at: string;
  application_deadline: string;
  positions_available: number;
  duration_months: number | null;
  capacity_required_pct: number;
  employment_type_eligible: string;
  location: string;
  work_model: string;
  publication_status: 'Draft' | 'Published' | 'Closed' | 'Filled' | 'Withdrawn';
  linked_gap_id: string;
}

export interface MarketplaceApplication {
  application_id: string;
  opportunity_id: string;
  opportunity_title: string;
  opportunity_type: string;
  org_unit_name: string;
  employee_id: string;
  employee_name: string;
  current_role_title: string;
  current_org_unit_id: string;
  current_org_unit_name: string;
  employee_location: string;
  tenure_years: number;
  application_date: string;
  current_stage: 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected' | 'Joined' | 'Withdrawn';
  stage_entered_at: string;
  stage_history: string;
  override_reason: string | null;
  manager_release_status: 'Not requested' | 'Requested' | 'Released' | 'Declined';
  outcome_reason: string | null;
  closed_gap_id: string | null;
  scores: {
    overall_match_pct: number;
    skill_match_pct: number;
    experience_match_pct: number;
    qualification_match_pct: number;
    career_fit_pct: number;
    location_fit_pct: number;
    readiness_score: number;
  };
  skill_gaps: SkillGap[];
  time_to_ready_months: number;
  backfill_impact: string;
}

export interface MarketplacePolicy {
  policy_id: string;
  min_months_in_current_role: number;
  manager_release_required: boolean;
  max_concurrent_applications: number;
  match_weight_skill: number;
  match_weight_experience: number;
  match_weight_qualification: number;
  match_weight_career_fit: number;
  match_weight_location_fit: number;
  min_match_score_to_display: number;
  explainability_factors_min: number;
}

export const INITIAL_MARKETPLACE_POLICY: MarketplacePolicy = {
  "policy_id": "POL-001",
  "min_months_in_current_role": 12,
  "manager_release_required": true,
  "max_concurrent_applications": 3,
  "match_weight_skill": 0.5,
  "match_weight_experience": 0.2,
  "match_weight_qualification": 0.15,
  "match_weight_career_fit": 0.1,
  "match_weight_location_fit": 0.05,
  "min_match_score_to_display": 0.4,
  "explainability_factors_min": 1
};

export const DATA3_OPPORTUNITIES: MarketplaceOpportunity[] = [
  {
    "opportunity_id": "OPP-4001",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2001",
    "linked_project_id": "",
    "org_unit_id": "OU-004",
    "org_unit_name": "Data Science & Retail Analytics",
    "hiring_manager_id": "EMP-0042",
    "hiring_manager_name": "Nethmi Madushanka",
    "title": "Senior Data Scientist",
    "description": "Own retail forecasting models end to end, from feature design to production monitoring.",
    "required_skills": [
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0068",
        "skill_name": "Machine Learning",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0071",
        "skill_name": "MLOps",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0090",
        "skill_name": "Generative AI & LLM Engineering",
        "category": "Technical"
      }
    ],
    "min_years_experience": 5,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-09-15",
    "application_deadline": "2026-10-31",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Published",
    "linked_gap_id": "GAP-0141"
  },
  {
    "opportunity_id": "OPP-4002",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2002",
    "linked_project_id": "",
    "org_unit_id": "OU-002",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "hiring_manager_id": "EMP-0011",
    "hiring_manager_name": "Tharushi Herath",
    "title": "Principal SD-WAN Architect",
    "description": "Designs and assures managed SD-WAN solutions for enterprise customers.",
    "required_skills": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "target_proficiency": 5,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "category": "Technical"
      }
    ],
    "min_years_experience": 8,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-09-23",
    "application_deadline": "2026-10-30",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Published",
    "linked_gap_id": "GAP-0130"
  },
  {
    "opportunity_id": "OPP-4003",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2003",
    "linked_project_id": "",
    "org_unit_id": "OU-004",
    "org_unit_name": "Data Science & Retail Analytics",
    "hiring_manager_id": "EMP-0042",
    "hiring_manager_name": "Nethmi Madushanka",
    "title": "MLOps Engineer",
    "description": "Builds and runs the platform that takes models from notebook to production.",
    "required_skills": [
      {
        "skill_id": "SKL-0071",
        "skill_name": "MLOps",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0049",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0054",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0050",
        "skill_name": "Infrastructure as Code (Terraform)",
        "category": "Technical"
      }
    ],
    "min_years_experience": 4,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-07-26",
    "application_deadline": "2026-10-20",
    "positions_available": 2,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Published",
    "linked_gap_id": "GAP-0131"
  },
  {
    "opportunity_id": "OPP-4004",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2004",
    "linked_project_id": "",
    "org_unit_id": "OU-008",
    "org_unit_name": "Mobile Core & 5G",
    "hiring_manager_id": "EMP-0016",
    "hiring_manager_name": "Shehani Bandara",
    "title": "5G Network Slicing Engineer",
    "description": "Designs, provisions and assures 5G network slices for enterprise use cases.",
    "required_skills": [
      {
        "skill_id": "SKL-0062",
        "skill_name": "5G Core (SA)",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0063",
        "skill_name": "Network Slicing (Cloud-native)",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0049",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "category": "Technical"
      }
    ],
    "min_years_experience": 4,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-07-21",
    "application_deadline": "2026-08-15",
    "positions_available": 3,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Closed",
    "linked_gap_id": "GAP-0132"
  },
  {
    "opportunity_id": "OPP-4005",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2005",
    "linked_project_id": "",
    "org_unit_id": "OU-003",
    "org_unit_name": "Cloud & Data Centre",
    "hiring_manager_id": "EMP-0012",
    "hiring_manager_name": "Pasan Mohamed",
    "title": "Cloud Platform Engineer",
    "description": "Builds and operates the hybrid cloud platform as code.",
    "required_skills": [
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0049",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0050",
        "skill_name": "Infrastructure as Code (Terraform)",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0052",
        "skill_name": "FinOps",
        "category": "Functional"
      }
    ],
    "min_years_experience": 4,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "",
    "application_deadline": "2026-11-14",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Draft",
    "linked_gap_id": "GAP-0133"
  },
  {
    "opportunity_id": "OPP-4006",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2006",
    "linked_project_id": "",
    "org_unit_id": "OU-003",
    "org_unit_name": "Cloud & Data Centre",
    "hiring_manager_id": "EMP-0012",
    "hiring_manager_name": "Pasan Mohamed",
    "title": "FinOps Analyst",
    "description": "Makes cloud spend visible and drives cost optimisation.",
    "required_skills": [
      {
        "skill_id": "SKL-0052",
        "skill_name": "FinOps",
        "target_proficiency": 4,
        "category": "Functional"
      },
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0099",
        "skill_name": "Budgeting & Cost Control",
        "target_proficiency": 3,
        "category": "Functional"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0043",
        "skill_name": "SQL",
        "category": "Technical"
      }
    ],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "2026-09-14",
    "application_deadline": "2026-11-14",
    "positions_available": 2,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Published",
    "linked_gap_id": "GAP-0134"
  },
  {
    "opportunity_id": "OPP-4007",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2007",
    "linked_project_id": "",
    "org_unit_id": "OU-007",
    "org_unit_name": "Cybersecurity",
    "hiring_manager_id": "EMP-0015",
    "hiring_manager_name": "Nethmi Cassim",
    "title": "AI-assisted SOC Analyst",
    "description": "Triages and responds to security events using AI-assisted tooling.",
    "required_skills": [
      {
        "skill_id": "SKL-0067",
        "skill_name": "SOC Operations & SIEM",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0073",
        "skill_name": "Incident Response",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0070",
        "skill_name": "Threat Intelligence",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "category": "Technical"
      }
    ],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-09-27",
    "application_deadline": "2026-10-27",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Published",
    "linked_gap_id": "GAP-0135"
  },
  {
    "opportunity_id": "OPP-4008",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2008",
    "linked_project_id": "",
    "org_unit_id": "OU-005",
    "org_unit_name": "Customer Experience & Contact Centre",
    "hiring_manager_id": "EMP-0013",
    "hiring_manager_name": "Navodya Tennakoon",
    "title": "Conversational AI Specialist",
    "description": "Designs, trains and improves the conversational AI virtual agent.",
    "required_skills": [
      {
        "skill_id": "SKL-0078",
        "skill_name": "Conversational AI Design",
        "target_proficiency": 4,
        "category": "Digital"
      },
      {
        "skill_id": "SKL-0041",
        "skill_name": "Natural Language Processing",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "target_proficiency": 2,
        "category": "Technical"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "",
    "application_deadline": "2026-12-02",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Draft",
    "linked_gap_id": "GAP-0136"
  },
  {
    "opportunity_id": "OPP-4009",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2010",
    "linked_project_id": "",
    "org_unit_id": "OU-005",
    "org_unit_name": "Customer Experience & Contact Centre",
    "hiring_manager_id": "EMP-0013",
    "hiring_manager_name": "Navodya Tennakoon",
    "title": "Customer Experience Analyst",
    "description": "Turns contact and journey data into CX improvement actions.",
    "required_skills": [
      {
        "skill_id": "SKL-0080",
        "skill_name": "CX Analytics",
        "target_proficiency": 4,
        "category": "Digital"
      },
      {
        "skill_id": "SKL-0043",
        "skill_name": "SQL",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0045",
        "skill_name": "Data Visualisation (Power BI)",
        "target_proficiency": 3,
        "category": "Digital"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "category": "Technical"
      }
    ],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "",
    "application_deadline": "2026-11-30",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Draft",
    "linked_gap_id": "GAP-0138"
  },
  {
    "opportunity_id": "OPP-4010",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2011",
    "linked_project_id": "",
    "org_unit_id": "OU-001",
    "org_unit_name": "Network Operations",
    "hiring_manager_id": "EMP-0010",
    "hiring_manager_name": "Chathura Wijesinghe",
    "title": "Network Automation Engineer",
    "description": "Automates network operations through code and closed-loop playbooks.",
    "required_skills": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "target_proficiency": 3,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "target_proficiency": 4,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0054",
        "skill_name": "CI/CD Pipelines",
        "category": "Technical"
      }
    ],
    "min_years_experience": 4,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-08-26",
    "application_deadline": "2026-10-24",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Published",
    "linked_gap_id": "GAP-0139"
  },
  {
    "opportunity_id": "OPP-4011",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2013",
    "linked_project_id": "",
    "org_unit_id": "OU-006",
    "org_unit_name": "Digital Platforms & IT",
    "hiring_manager_id": "EMP-0014",
    "hiring_manager_name": "Thisara Mendis",
    "title": "Digital Platform Product Owner",
    "description": "Owns the backlog for the digital platform products.",
    "required_skills": [
      {
        "skill_id": "SKL-0084",
        "skill_name": "Agile Product Ownership",
        "target_proficiency": 4,
        "category": "Functional"
      },
      {
        "skill_id": "SKL-0082",
        "skill_name": "API Design (TM Forum Open APIs)",
        "target_proficiency": 2,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0086",
        "skill_name": "Stakeholder Management",
        "target_proficiency": 3,
        "category": "Leadership"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 5,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "",
    "application_deadline": "2026-11-26",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Draft",
    "linked_gap_id": "GAP-0142"
  },
  {
    "opportunity_id": "OPP-4012",
    "opportunity_type": "Role",
    "linked_role_id": "ROLE-2014",
    "linked_project_id": "",
    "org_unit_id": "OU-004",
    "org_unit_name": "Data Science & Retail Analytics",
    "hiring_manager_id": "EMP-0042",
    "hiring_manager_name": "Nethmi Madushanka",
    "title": "Data Engineer",
    "description": "Builds the data pipelines and feature store that feed analytics and ML.",
    "required_skills": [
      {
        "skill_id": "SKL-0044",
        "skill_name": "Data Engineering (Spark)",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0043",
        "skill_name": "SQL",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [
      {
        "skill_id": "SKL-0046",
        "skill_name": "Data Governance",
        "category": "Functional"
      }
    ],
    "min_years_experience": 4,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "2026-06-03",
    "application_deadline": "2026-07-18",
    "positions_available": 1,
    "duration_months": null,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Closed",
    "linked_gap_id": "GAP-0143"
  },
  {
    "opportunity_id": "OPP-4013",
    "opportunity_type": "Project",
    "linked_role_id": "ROLE-2001",
    "linked_project_id": "PROJ-3001",
    "org_unit_id": "OU-004",
    "org_unit_name": "Data Science & Retail Analytics",
    "hiring_manager_id": "EMP-0042",
    "hiring_manager_name": "Nethmi Madushanka",
    "title": "Cloud Engineer - Retail Demand Forecasting Model",
    "description": "Join Retail Demand Forecasting Model as Cloud Engineer.",
    "required_skills": [
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-05-23",
    "application_deadline": "2026-06-14",
    "positions_available": 2,
    "duration_months": 3,
    "capacity_required_pct": 0.3,
    "employment_type_eligible": "FTE, Contractor",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Filled",
    "linked_gap_id": ""
  },
  {
    "opportunity_id": "OPP-4014",
    "opportunity_type": "Gig",
    "linked_role_id": "ROLE-2002",
    "linked_project_id": "PROJ-3010",
    "org_unit_id": "OU-002",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "hiring_manager_id": "EMP-0011",
    "hiring_manager_name": "Tharushi Herath",
    "title": "Solutions Architect - Enterprise SD-WAN Rollout Phase 2",
    "description": "Join Enterprise SD-WAN Rollout Phase 2 as Solutions Architect.",
    "required_skills": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0061",
        "skill_name": "Network Security",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-07-29",
    "application_deadline": "2026-08-20",
    "positions_available": 1,
    "duration_months": 4,
    "capacity_required_pct": 0.3,
    "employment_type_eligible": "FTE, Contractor",
    "location": "Colombo HQ",
    "work_model": "Remote",
    "publication_status": "Filled",
    "linked_gap_id": ""
  },
  {
    "opportunity_id": "OPP-4015",
    "opportunity_type": "Gig",
    "linked_role_id": "ROLE-2008",
    "linked_project_id": "PROJ-3012",
    "org_unit_id": "OU-005",
    "org_unit_name": "Customer Experience & Contact Centre",
    "hiring_manager_id": "EMP-0013",
    "hiring_manager_name": "Navodya Tennakoon",
    "title": "CRM Specialist - Conversational AI Virtual Agent",
    "description": "Join Conversational AI Virtual Agent as CRM Specialist.",
    "required_skills": [
      {
        "skill_id": "SKL-0079",
        "skill_name": "CRM Platforms (Salesforce)",
        "target_proficiency": 3,
        "category": "Digital"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-07-06",
    "application_deadline": "2026-08-10",
    "positions_available": 1,
    "duration_months": 6,
    "capacity_required_pct": 0.2,
    "employment_type_eligible": "FTE, Contractor",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Withdrawn",
    "linked_gap_id": ""
  },
  {
    "opportunity_id": "OPP-4016",
    "opportunity_type": "Secondment",
    "linked_role_id": "ROLE-2004",
    "linked_project_id": "PROJ-3014",
    "org_unit_id": "OU-008",
    "org_unit_name": "Mobile Core & 5G",
    "hiring_manager_id": "EMP-0016",
    "hiring_manager_name": "Shehani Bandara",
    "title": "RAN Engineer - 5G Network Slicing for Enterprise",
    "description": "Join 5G Network Slicing for Enterprise as RAN Engineer.",
    "required_skills": [
      {
        "skill_id": "SKL-0064",
        "skill_name": "RAN Optimisation",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 1",
    "published_at": "2026-09-14",
    "application_deadline": "2026-10-13",
    "positions_available": 1,
    "duration_months": 6,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Hybrid",
    "publication_status": "Filled",
    "linked_gap_id": "GAP-0132"
  },
  {
    "opportunity_id": "OPP-4017",
    "opportunity_type": "Gig",
    "linked_role_id": "ROLE-2011",
    "linked_project_id": "PROJ-3018",
    "org_unit_id": "OU-001",
    "org_unit_name": "Network Operations",
    "hiring_manager_id": "EMP-0010",
    "hiring_manager_name": "Chathura Wijesinghe",
    "title": "Senior NOC Engineer - Legacy Switch Decommissioning",
    "description": "Join Legacy Switch Decommissioning as Senior NOC Engineer.",
    "required_skills": [
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0059",
        "skill_name": "Network Monitoring & NOC Tools",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "2026-05-29",
    "application_deadline": "2026-06-26",
    "positions_available": 1,
    "duration_months": 3,
    "capacity_required_pct": 0.8,
    "employment_type_eligible": "FTE, Contractor",
    "location": "Colombo HQ",
    "work_model": "Remote",
    "publication_status": "Filled",
    "linked_gap_id": ""
  },
  {
    "opportunity_id": "OPP-4018",
    "opportunity_type": "Secondment",
    "linked_role_id": "ROLE-2007",
    "linked_project_id": "PROJ-3020",
    "org_unit_id": "OU-007",
    "org_unit_name": "Cybersecurity",
    "hiring_manager_id": "EMP-0015",
    "hiring_manager_name": "Nethmi Cassim",
    "title": "Security Architect - AI-assisted SOC Triage",
    "description": "Join AI-assisted SOC Triage as Security Architect.",
    "required_skills": [
      {
        "skill_id": "SKL-0075",
        "skill_name": "Security Architecture",
        "target_proficiency": 4,
        "category": "Technical"
      },
      {
        "skill_id": "SKL-0074",
        "skill_name": "Cloud Security",
        "target_proficiency": 3,
        "category": "Technical"
      }
    ],
    "preferred_skills": [],
    "min_years_experience": 2,
    "qualifications_required": "",
    "criticality_rating": "Tier 2",
    "published_at": "2026-08-02",
    "application_deadline": "2026-08-27",
    "positions_available": 2,
    "duration_months": 6,
    "capacity_required_pct": 1.0,
    "employment_type_eligible": "FTE",
    "location": "Colombo HQ",
    "work_model": "Remote",
    "publication_status": "Withdrawn",
    "linked_gap_id": "GAP-0135"
  }
];

export const DATA3_APPLICATIONS: MarketplaceApplication[] = [
  {
    "application_id": "APP-00412",
    "opportunity_id": "OPP-4001",
    "opportunity_title": "Senior Data Scientist",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1112",
    "employee_name": "Nadeesha Perera",
    "current_role_title": "Data Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 3.3,
    "application_date": "2026-09-21",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-09-22T10:15:00Z",
    "stage_history": "Applied 21 Sep; Shortlisted 22 Sep",
    "override_reason": null,
    "manager_release_status": "Requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0141",
    "scores": {
      "overall_match_pct": 79.1,
      "skill_match_pct": 72.7,
      "experience_match_pct": 66.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.712
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0068",
        "skill_name": "Machine Learning",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0071",
        "skill_name": "MLOps",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 13.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00400",
    "opportunity_id": "OPP-4001",
    "opportunity_title": "Senior Data Scientist",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1101",
    "employee_name": "Nuwan Bandara",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 12.1,
    "application_date": "2026-09-24",
    "current_stage": "Interview",
    "stage_entered_at": "2026-10-02T12:45:00Z",
    "stage_history": "Applied 24 Sep; Shortlisted 26 Sep; Interview 02 Oct",
    "override_reason": null,
    "manager_release_status": "Requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0141",
    "scores": {
      "overall_match_pct": 98.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.886
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00401",
    "opportunity_id": "OPP-4001",
    "opportunity_title": "Senior Data Scientist",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1057",
    "employee_name": "Imesha Gamage",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 13.2,
    "application_date": "2026-09-16",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-09-24T14:20:00Z",
    "stage_history": "Applied 16 Sep; Shortlisted 24 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0141",
    "scores": {
      "overall_match_pct": 98.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.788
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00402",
    "opportunity_id": "OPP-4001",
    "opportunity_title": "Senior Data Scientist",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1088",
    "employee_name": "Chamara Ekanayake",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 11.8,
    "application_date": "2026-09-30",
    "current_stage": "Interview",
    "stage_entered_at": "2026-10-10T10:30:00Z",
    "stage_history": "Applied 30 Sep; Shortlisted 06 Oct; Interview 10 Oct",
    "override_reason": null,
    "manager_release_status": "Requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0141",
    "scores": {
      "overall_match_pct": 76.8,
      "skill_match_pct": 54.5,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.691
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0068",
        "skill_name": "Machine Learning",
        "held_proficiency": 1,
        "target_proficiency": 4,
        "gap_levels": 3,
        "learning_hours": 270
      },
      {
        "skill_id": "SKL-0071",
        "skill_name": "MLOps",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 22.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00403",
    "opportunity_id": "OPP-4002",
    "opportunity_title": "Principal SD-WAN Architect",
    "opportunity_type": "Role",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-2059",
    "employee_name": "Rizwan Weerasinghe",
    "current_role_title": "Enterprise Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 4.1,
    "application_date": "2026-09-25",
    "current_stage": "Applied",
    "stage_entered_at": "2026-09-25T12:50:00Z",
    "stage_history": "Applied 25 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0130",
    "scores": {
      "overall_match_pct": 81.4,
      "skill_match_pct": 83.3,
      "experience_match_pct": 51.2,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.651
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "held_proficiency": 4,
        "target_proficiency": 5,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 9.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00404",
    "opportunity_id": "OPP-4002",
    "opportunity_title": "Principal SD-WAN Architect",
    "opportunity_type": "Role",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-1358",
    "employee_name": "Shehani Jayasinghe",
    "current_role_title": "Enterprise Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 2.3,
    "application_date": "2026-09-30",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-10-04T13:15:00Z",
    "stage_history": "Applied 30 Sep; Shortlisted 04 Oct",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0130",
    "scores": {
      "overall_match_pct": 71.8,
      "skill_match_pct": 75.0,
      "experience_match_pct": 28.7,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.574
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "held_proficiency": 2,
        "target_proficiency": 5,
        "gap_levels": 3,
        "learning_hours": 270
      }
    ],
    "time_to_ready_months": 13.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00405",
    "opportunity_id": "OPP-4002",
    "opportunity_title": "Principal SD-WAN Architect",
    "opportunity_type": "Role",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-1277",
    "employee_name": "Ruwan Munasinghe",
    "current_role_title": "NOC Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-001",
    "current_org_unit_name": "Network Operations",
    "employee_location": "Jaffna Hub",
    "tenure_years": 3.1,
    "application_date": "2026-09-26",
    "current_stage": "Applied",
    "stage_entered_at": "2026-09-26T13:40:00Z",
    "stage_history": "Applied 26 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0130",
    "scores": {
      "overall_match_pct": 71.2,
      "skill_match_pct": 75.0,
      "experience_match_pct": 38.8,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.57
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "held_proficiency": 3,
        "target_proficiency": 5,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 13.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Network Operations"
  },
  {
    "application_id": "APP-00406",
    "opportunity_id": "OPP-4002",
    "opportunity_title": "Principal SD-WAN Architect",
    "opportunity_type": "Role",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-2101",
    "employee_name": "Imesha Sivakumar",
    "current_role_title": "Network Solutions Architect | L5 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 17.7,
    "application_date": "2026-10-08",
    "current_stage": "Interview",
    "stage_entered_at": "2026-10-15T13:45:00Z",
    "stage_history": "Applied 08 Oct; Shortlisted 14 Oct; Interview 15 Oct",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0130",
    "scores": {
      "overall_match_pct": 95.3,
      "skill_match_pct": 91.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.763
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00407",
    "opportunity_id": "OPP-4003",
    "opportunity_title": "MLOps Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1694",
    "employee_name": "Sajith Hettiarachchi",
    "current_role_title": "Cloud Support Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-003",
    "current_org_unit_name": "Cloud & Data Centre",
    "employee_location": "Remote",
    "tenure_years": 11.0,
    "application_date": "2026-09-05",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-09-08T08:10:00Z",
    "stage_history": "Applied 05 Sep; Shortlisted 08 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0131",
    "scores": {
      "overall_match_pct": 71.0,
      "skill_match_pct": 50.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.568
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0071",
        "skill_name": "MLOps",
        "held_proficiency": 0,
        "target_proficiency": 4,
        "gap_levels": 4,
        "learning_hours": 360
      },
      {
        "skill_id": "SKL-0054",
        "skill_name": "CI/CD Pipelines",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 22.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cloud & Data Centre"
  },
  {
    "application_id": "APP-00408",
    "opportunity_id": "OPP-4007",
    "opportunity_title": "AI-assisted SOC Analyst",
    "opportunity_type": "Role",
    "org_unit_name": "Cybersecurity",
    "employee_id": "EMP-2814",
    "employee_name": "Mahesh Navaratnam",
    "current_role_title": "SOC Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-007",
    "current_org_unit_name": "Cybersecurity",
    "employee_location": "Colombo HQ",
    "tenure_years": 5.8,
    "application_date": "2026-09-27",
    "current_stage": "Interview",
    "stage_entered_at": "2026-10-01T12:50:00Z",
    "stage_history": "Applied 27 Sep; Shortlisted 30 Sep; Interview 01 Oct",
    "override_reason": null,
    "manager_release_status": "Requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0135",
    "scores": {
      "overall_match_pct": 79.5,
      "skill_match_pct": 60.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.716
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0073",
        "skill_name": "Incident Response",
        "held_proficiency": 1,
        "target_proficiency": 3,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0070",
        "skill_name": "Threat Intelligence",
        "held_proficiency": 1,
        "target_proficiency": 3,
        "gap_levels": 2,
        "learning_hours": 180
      }
    ],
    "time_to_ready_months": 18.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cybersecurity"
  },
  {
    "application_id": "APP-00409",
    "opportunity_id": "OPP-4007",
    "opportunity_title": "AI-assisted SOC Analyst",
    "opportunity_type": "Role",
    "org_unit_name": "Cybersecurity",
    "employee_id": "EMP-1546",
    "employee_name": "Kalana Kodikara",
    "current_role_title": "SOC Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-007",
    "current_org_unit_name": "Cybersecurity",
    "employee_location": "Colombo HQ",
    "tenure_years": 1.9,
    "application_date": "2026-10-09",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-10-10T09:40:00Z",
    "stage_history": "Applied 09 Oct; Shortlisted 10 Oct",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0135",
    "scores": {
      "overall_match_pct": 67.5,
      "skill_match_pct": 40.0,
      "experience_match_pct": 95.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.54
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0067",
        "skill_name": "SOC Operations & SIEM",
        "held_proficiency": 2,
        "target_proficiency": 4,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0073",
        "skill_name": "Incident Response",
        "held_proficiency": 1,
        "target_proficiency": 3,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0070",
        "skill_name": "Threat Intelligence",
        "held_proficiency": 1,
        "target_proficiency": 3,
        "gap_levels": 2,
        "learning_hours": 180
      }
    ],
    "time_to_ready_months": 27.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cybersecurity"
  },
  {
    "application_id": "APP-00410",
    "opportunity_id": "OPP-4007",
    "opportunity_title": "AI-assisted SOC Analyst",
    "opportunity_type": "Role",
    "org_unit_name": "Cybersecurity",
    "employee_id": "EMP-1623",
    "employee_name": "Rizwan Ekanayake",
    "current_role_title": "SOC Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-007",
    "current_org_unit_name": "Cybersecurity",
    "employee_location": "Colombo HQ",
    "tenure_years": 5.3,
    "application_date": "2026-10-12",
    "current_stage": "Applied",
    "stage_entered_at": "2026-10-12T11:15:00Z",
    "stage_history": "Applied 12 Oct",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0135",
    "scores": {
      "overall_match_pct": 69.5,
      "skill_match_pct": 40.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.556
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0067",
        "skill_name": "SOC Operations & SIEM",
        "held_proficiency": 0,
        "target_proficiency": 4,
        "gap_levels": 4,
        "learning_hours": 360
      },
      {
        "skill_id": "SKL-0070",
        "skill_name": "Threat Intelligence",
        "held_proficiency": 1,
        "target_proficiency": 3,
        "gap_levels": 2,
        "learning_hours": 180
      }
    ],
    "time_to_ready_months": 27.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cybersecurity"
  },
  {
    "application_id": "APP-00411",
    "opportunity_id": "OPP-4010",
    "opportunity_title": "Network Automation Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-1358",
    "employee_name": "Shehani Jayasinghe",
    "current_role_title": "Enterprise Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 2.3,
    "application_date": "2026-09-06",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-09-10T15:15:00Z",
    "stage_history": "Applied 06 Sep; Shortlisted 10 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0139",
    "scores": {
      "overall_match_pct": 71.8,
      "skill_match_pct": 63.6,
      "experience_match_pct": 57.5,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.575
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 0,
        "target_proficiency": 3,
        "gap_levels": 3,
        "learning_hours": 270
      }
    ],
    "time_to_ready_months": 18.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00413",
    "opportunity_id": "OPP-4010",
    "opportunity_title": "Network Automation Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-1277",
    "employee_name": "Ruwan Munasinghe",
    "current_role_title": "NOC Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-001",
    "current_org_unit_name": "Network Operations",
    "employee_location": "Jaffna Hub",
    "tenure_years": 3.1,
    "application_date": "2026-09-12",
    "current_stage": "Interview",
    "stage_entered_at": "2026-09-14T10:50:00Z",
    "stage_history": "Applied 12 Sep; Shortlisted 13 Sep; Interview 14 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0139",
    "scores": {
      "overall_match_pct": 69.8,
      "skill_match_pct": 54.5,
      "experience_match_pct": 77.5,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.558
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 2,
        "target_proficiency": 4,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 0,
        "target_proficiency": 3,
        "gap_levels": 3,
        "learning_hours": 270
      }
    ],
    "time_to_ready_months": 22.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Network Operations"
  },
  {
    "application_id": "APP-00414",
    "opportunity_id": "OPP-4010",
    "opportunity_title": "Network Automation Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-2101",
    "employee_name": "Imesha Sivakumar",
    "current_role_title": "Network Solutions Architect | L5 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 17.7,
    "application_date": "2026-08-31",
    "current_stage": "Shortlisted",
    "stage_entered_at": "2026-09-05T10:05:00Z",
    "stage_history": "Applied 31 Aug; Shortlisted 05 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0139",
    "scores": {
      "overall_match_pct": 75.8,
      "skill_match_pct": 54.5,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.606
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 2,
        "target_proficiency": 4,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 0,
        "target_proficiency": 3,
        "gap_levels": 3,
        "learning_hours": 270
      }
    ],
    "time_to_ready_months": 22.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00415",
    "opportunity_id": "OPP-4010",
    "opportunity_title": "Network Automation Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-2356",
    "employee_name": "Rashmi Rajapaksha",
    "current_role_title": "NOC Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-001",
    "current_org_unit_name": "Network Operations",
    "employee_location": "Galle Hub",
    "tenure_years": 9.1,
    "application_date": "2026-09-12",
    "current_stage": "Applied",
    "stage_entered_at": "2026-09-12T08:40:00Z",
    "stage_history": "Applied 12 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0139",
    "scores": {
      "overall_match_pct": 69.7,
      "skill_match_pct": 45.5,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.558
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 2,
        "target_proficiency": 4,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 0,
        "target_proficiency": 3,
        "gap_levels": 3,
        "learning_hours": 270
      },
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 27.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Network Operations"
  },
  {
    "application_id": "APP-00416",
    "opportunity_id": "OPP-4010",
    "opportunity_title": "Network Automation Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-1766",
    "employee_name": "Lakmini Nanayakkara",
    "current_role_title": "NOC Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-001",
    "current_org_unit_name": "Network Operations",
    "employee_location": "Galle Hub",
    "tenure_years": 10.9,
    "application_date": "2026-10-03",
    "current_stage": "Applied",
    "stage_entered_at": "2026-10-03T09:10:00Z",
    "stage_history": "Applied 03 Oct",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0139",
    "scores": {
      "overall_match_pct": 73.3,
      "skill_match_pct": 54.5,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.586
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0057",
        "skill_name": "Network Automation (Ansible)",
        "held_proficiency": 2,
        "target_proficiency": 4,
        "gap_levels": 2,
        "learning_hours": 180
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 0,
        "target_proficiency": 3,
        "gap_levels": 3,
        "learning_hours": 270
      }
    ],
    "time_to_ready_months": 22.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Network Operations"
  },
  {
    "application_id": "APP-00417",
    "opportunity_id": "OPP-4012",
    "opportunity_title": "Data Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-2118",
    "employee_name": "Kalana De Alwis",
    "current_role_title": "Data Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 11.7,
    "application_date": "2026-06-03",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-06-21T08:10:00Z",
    "stage_history": "Applied 03 Jun; Shortlisted 11 Jun; Interview 14 Jun; Rejected 21 Jun",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Minimum experience not met",
    "closed_gap_id": "GAP-0143",
    "scores": {
      "overall_match_pct": 84.9,
      "skill_match_pct": 72.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.679
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0044",
        "skill_name": "Data Engineering (Spark)",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0043",
        "skill_name": "SQL",
        "held_proficiency": 2,
        "target_proficiency": 4,
        "gap_levels": 2,
        "learning_hours": 180
      }
    ],
    "time_to_ready_months": 13.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00418",
    "opportunity_id": "OPP-4012",
    "opportunity_title": "Data Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1057",
    "employee_name": "Imesha Gamage",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 13.2,
    "application_date": "2026-06-26",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-07-03T15:40:00Z",
    "stage_history": "Applied 26 Jun; Rejected 03 Jul",
    "override_reason": "Screened out at eligibility review; Shortlisted and Interview skipped by hiring manager",
    "manager_release_status": "Not requested",
    "outcome_reason": "Python proficiency below the required level 4",
    "closed_gap_id": "GAP-0143",
    "scores": {
      "overall_match_pct": 80.3,
      "skill_match_pct": 63.6,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.643
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0044",
        "skill_name": "Data Engineering (Spark)",
        "held_proficiency": 0,
        "target_proficiency": 4,
        "gap_levels": 4,
        "learning_hours": 360
      }
    ],
    "time_to_ready_months": 18.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00419",
    "opportunity_id": "OPP-4012",
    "opportunity_title": "Data Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1063",
    "employee_name": "Oshadi Wickramasinghe",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 8.4,
    "application_date": "2026-07-10",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-07-25T10:00:00Z",
    "stage_history": "Applied 10 Jul; Shortlisted 15 Jul; Interview 18 Jul; Rejected 25 Jul",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Another candidate had stronger MLOps evidence",
    "closed_gap_id": "GAP-0143",
    "scores": {
      "overall_match_pct": 75.8,
      "skill_match_pct": 54.5,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.606
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0044",
        "skill_name": "Data Engineering (Spark)",
        "held_proficiency": 0,
        "target_proficiency": 4,
        "gap_levels": 4,
        "learning_hours": 360
      },
      {
        "skill_id": "SKL-0043",
        "skill_name": "SQL",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 22.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00420",
    "opportunity_id": "OPP-4012",
    "opportunity_title": "Data Engineer",
    "opportunity_type": "Role",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-2184",
    "employee_name": "Udara Wickramasinghe",
    "current_role_title": "BI Developer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 7.9,
    "application_date": "2026-06-28",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-07-05T17:00:00Z",
    "stage_history": "Applied 28 Jun; Rejected 05 Jul",
    "override_reason": "Screened out at eligibility review; Shortlisted and Interview skipped by hiring manager",
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": "GAP-0143",
    "scores": {
      "overall_match_pct": 80.3,
      "skill_match_pct": 63.6,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.643
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0044",
        "skill_name": "Data Engineering (Spark)",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0065",
        "skill_name": "Python",
        "held_proficiency": 0,
        "target_proficiency": 3,
        "gap_levels": 3,
        "learning_hours": 270
      }
    ],
    "time_to_ready_months": 18.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00421",
    "opportunity_id": "OPP-4013",
    "opportunity_title": "Cloud Engineer - Retail Demand Forecasting Model",
    "opportunity_type": "Project",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1946",
    "employee_name": "Yasara Vithanage",
    "current_role_title": "Software Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-006",
    "current_org_unit_name": "Digital Platforms & IT",
    "employee_location": "Colombo HQ",
    "tenure_years": 7.3,
    "application_date": "2026-06-11",
    "current_stage": "Joined",
    "stage_entered_at": "2026-06-26T17:40:00Z",
    "stage_history": "Applied 11 Jun; Shortlisted 19 Jun; Interview 21 Jun; Selected 25 Jun; Joined 26 Jun",
    "override_reason": null,
    "manager_release_status": "Released",
    "outcome_reason": null,
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 98.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.985
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Digital Platforms & IT"
  },
  {
    "application_id": "APP-00422",
    "opportunity_id": "OPP-4013",
    "opportunity_title": "Cloud Engineer - Retail Demand Forecasting Model",
    "opportunity_type": "Project",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-0012",
    "employee_name": "Pasan Mohamed",
    "current_role_title": "Cloud Practice Lead | L6 Telecom & Digital Professional",
    "current_org_unit_id": "OU-003",
    "current_org_unit_name": "Cloud & Data Centre",
    "employee_location": "Colombo HQ",
    "tenure_years": 21.2,
    "application_date": "2026-05-31",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-06-12T15:45:00Z",
    "stage_history": "Applied 31 May; Shortlisted 02 Jun; Interview 09 Jun; Rejected 12 Jun",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Another candidate had stronger MLOps evidence",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 98.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.788
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cloud & Data Centre"
  },
  {
    "application_id": "APP-00423",
    "opportunity_id": "OPP-4013",
    "opportunity_title": "Cloud Engineer - Retail Demand Forecasting Model",
    "opportunity_type": "Project",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1057",
    "employee_name": "Imesha Gamage",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 13.2,
    "application_date": "2026-05-24",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-06-04T08:10:00Z",
    "stage_history": "Applied 24 May; Shortlisted 28 May; Interview 30 May; Rejected 04 Jun",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Python proficiency below the required level 4",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 98.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.788
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00424",
    "opportunity_id": "OPP-4013",
    "opportunity_title": "Cloud Engineer - Retail Demand Forecasting Model",
    "opportunity_type": "Project",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1930",
    "employee_name": "Gayani Kumara",
    "current_role_title": "Cloud Support Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-003",
    "current_org_unit_name": "Cloud & Data Centre",
    "employee_location": "Colombo HQ",
    "tenure_years": 10.3,
    "application_date": "2026-06-14",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-06-15T17:15:00Z",
    "stage_history": "Applied 14 Jun; Rejected 15 Jun",
    "override_reason": "Screened out at eligibility review; Shortlisted and Interview skipped by hiring manager",
    "manager_release_status": "Not requested",
    "outcome_reason": "Minimum experience not met",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 81.8,
      "skill_match_pct": 66.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.655
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cloud & Data Centre"
  },
  {
    "application_id": "APP-00425",
    "opportunity_id": "OPP-4013",
    "opportunity_title": "Cloud Engineer - Retail Demand Forecasting Model",
    "opportunity_type": "Project",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1384",
    "employee_name": "Ishara Abeysekera",
    "current_role_title": "Cloud Support Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-003",
    "current_org_unit_name": "Cloud & Data Centre",
    "employee_location": "Colombo HQ",
    "tenure_years": 6.6,
    "application_date": "2026-06-01",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-06-16T10:50:00Z",
    "stage_history": "Applied 01 Jun; Shortlisted 09 Jun; Interview 15 Jun; Rejected 16 Jun",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Another candidate had stronger MLOps evidence",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 81.8,
      "skill_match_pct": 66.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.655
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cloud & Data Centre"
  },
  {
    "application_id": "APP-00426",
    "opportunity_id": "OPP-4013",
    "opportunity_title": "Cloud Engineer - Retail Demand Forecasting Model",
    "opportunity_type": "Project",
    "org_unit_name": "Data Science & Retail Analytics",
    "employee_id": "EMP-1063",
    "employee_name": "Oshadi Wickramasinghe",
    "current_role_title": "Data Scientist | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-004",
    "current_org_unit_name": "Data Science & Retail Analytics",
    "employee_location": "Colombo HQ",
    "tenure_years": 8.4,
    "application_date": "2026-05-31",
    "current_stage": "Withdrawn",
    "stage_entered_at": "2026-06-17T08:40:00Z",
    "stage_history": "Applied 31 May; Shortlisted 02 Jun; Interview 07 Jun; Selected 10 Jun; Withdrawn 17 Jun",
    "override_reason": null,
    "manager_release_status": "Released",
    "outcome_reason": null,
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 81.8,
      "skill_match_pct": 66.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.818
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0072",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Data Science & Retail Analytics"
  },
  {
    "application_id": "APP-00427",
    "opportunity_id": "OPP-4014",
    "opportunity_title": "Solutions Architect - Enterprise SD-WAN Rollout Phase 2",
    "opportunity_type": "Gig",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-2059",
    "employee_name": "Rizwan Weerasinghe",
    "current_role_title": "Enterprise Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 4.1,
    "application_date": "2026-07-30",
    "current_stage": "Joined",
    "stage_entered_at": "2026-08-09T08:50:00Z",
    "stage_history": "Applied 30 Jul; Shortlisted 31 Jul; Interview 01 Aug; Selected 06 Aug; Joined 09 Aug",
    "override_reason": null,
    "manager_release_status": "Released",
    "outcome_reason": null,
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 99.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.995
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00428",
    "opportunity_id": "OPP-4014",
    "opportunity_title": "Solutions Architect - Enterprise SD-WAN Rollout Phase 2",
    "opportunity_type": "Gig",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-2101",
    "employee_name": "Imesha Sivakumar",
    "current_role_title": "Network Solutions Architect | L5 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 17.7,
    "application_date": "2026-08-11",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-08-21T08:10:00Z",
    "stage_history": "Applied 11 Aug; Shortlisted 18 Aug; Interview 19 Aug; Rejected 21 Aug",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 99.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.796
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00429",
    "opportunity_id": "OPP-4014",
    "opportunity_title": "Solutions Architect - Enterprise SD-WAN Rollout Phase 2",
    "opportunity_type": "Gig",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-1898",
    "employee_name": "Dharshini Pathirana",
    "current_role_title": "Enterprise Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 11.3,
    "application_date": "2026-08-17",
    "current_stage": "Withdrawn",
    "stage_entered_at": "2026-09-03T08:30:00Z",
    "stage_history": "Applied 17 Aug; Shortlisted 25 Aug; Interview 26 Aug; Selected 02 Sep; Withdrawn 03 Sep",
    "override_reason": null,
    "manager_release_status": "Released",
    "outcome_reason": null,
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 84.2,
      "skill_match_pct": 71.4,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.842
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0061",
        "skill_name": "Network Security",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 9.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00430",
    "opportunity_id": "OPP-4014",
    "opportunity_title": "Solutions Architect - Enterprise SD-WAN Rollout Phase 2",
    "opportunity_type": "Gig",
    "org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_id": "EMP-2144",
    "employee_name": "Hiruni Weerakoon",
    "current_role_title": "Enterprise Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-002",
    "current_org_unit_name": "Enterprise & SD-WAN Solutions",
    "employee_location": "Colombo HQ",
    "tenure_years": 8.0,
    "application_date": "2026-08-16",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-09-03T08:00:00Z",
    "stage_history": "Applied 16 Aug; Shortlisted 21 Aug; Interview 28 Aug; Rejected 03 Sep",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Another candidate had stronger MLOps evidence",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 85.2,
      "skill_match_pct": 71.4,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.682
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0056",
        "skill_name": "SD-WAN Design",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      },
      {
        "skill_id": "SKL-0061",
        "skill_name": "Network Security",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 9.0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Enterprise & SD-WAN Solutions"
  },
  {
    "application_id": "APP-00431",
    "opportunity_id": "OPP-4015",
    "opportunity_title": "CRM Specialist - Conversational AI Virtual Agent",
    "opportunity_type": "Gig",
    "org_unit_name": "Customer Experience & Contact Centre",
    "employee_id": "EMP-2500",
    "employee_name": "Pradeep Wijesinghe",
    "current_role_title": "Contact Centre Agent | L1 Telecom & Digital Professional",
    "current_org_unit_id": "OU-005",
    "current_org_unit_name": "Customer Experience & Contact Centre",
    "employee_location": "Kandy Hub",
    "tenure_years": 5.5,
    "application_date": "2026-08-10",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-08-29T13:10:00Z",
    "stage_history": "Applied 10 Aug; Shortlisted 17 Aug; Interview 25 Aug; Rejected 29 Aug",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Minimum experience not met",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 97.0,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.776
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Customer Experience & Contact Centre"
  },
  {
    "application_id": "APP-00432",
    "opportunity_id": "OPP-4015",
    "opportunity_title": "CRM Specialist - Conversational AI Virtual Agent",
    "opportunity_type": "Gig",
    "org_unit_name": "Customer Experience & Contact Centre",
    "employee_id": "EMP-1451",
    "employee_name": "Mahesh Bandara",
    "current_role_title": "Contact Centre Agent | L1 Telecom & Digital Professional",
    "current_org_unit_id": "OU-005",
    "current_org_unit_name": "Customer Experience & Contact Centre",
    "employee_location": "Kandy Hub",
    "tenure_years": 1.5,
    "application_date": "2026-07-12",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-08-01T14:05:00Z",
    "stage_history": "Applied 12 Jul; Shortlisted 18 Jul; Interview 25 Jul; Rejected 01 Aug",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Minimum experience not met",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 93.2,
      "skill_match_pct": 100.0,
      "experience_match_pct": 75.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 75.0,
      "readiness_score": 0.746
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Customer Experience & Contact Centre"
  },
  {
    "application_id": "APP-00433",
    "opportunity_id": "OPP-4015",
    "opportunity_title": "CRM Specialist - Conversational AI Virtual Agent",
    "opportunity_type": "Gig",
    "org_unit_name": "Customer Experience & Contact Centre",
    "employee_id": "EMP-1177",
    "employee_name": "Dilini Jayasinghe",
    "current_role_title": "Contact Centre Team Lead | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-005",
    "current_org_unit_name": "Customer Experience & Contact Centre",
    "employee_location": "Jaffna Hub",
    "tenure_years": 4.4,
    "application_date": "2026-07-16",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-07-22T09:50:00Z",
    "stage_history": "Applied 16 Jul; Shortlisted 17 Jul; Interview 20 Jul; Rejected 22 Jul",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 96.0,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.768
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Customer Experience & Contact Centre"
  },
  {
    "application_id": "APP-00434",
    "opportunity_id": "OPP-4015",
    "opportunity_title": "CRM Specialist - Conversational AI Virtual Agent",
    "opportunity_type": "Gig",
    "org_unit_name": "Customer Experience & Contact Centre",
    "employee_id": "EMP-1403",
    "employee_name": "Kasun Kularatne",
    "current_role_title": "CX Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-005",
    "current_org_unit_name": "Customer Experience & Contact Centre",
    "employee_location": "Colombo HQ",
    "tenure_years": 8.6,
    "application_date": "2026-07-18",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-07-29T13:15:00Z",
    "stage_history": "Applied 18 Jul; Shortlisted 19 Jul; Interview 21 Jul; Rejected 29 Jul",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 99.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.796
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Customer Experience & Contact Centre"
  },
  {
    "application_id": "APP-00435",
    "opportunity_id": "OPP-4016",
    "opportunity_title": "RAN Engineer - 5G Network Slicing for Enterprise",
    "opportunity_type": "Secondment",
    "org_unit_name": "Mobile Core & 5G",
    "employee_id": "EMP-1125",
    "employee_name": "Pradeep Amarasinghe",
    "current_role_title": "RAN Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-008",
    "current_org_unit_name": "Mobile Core & 5G",
    "employee_location": "Kandy Hub",
    "tenure_years": 11.8,
    "application_date": "2026-10-09",
    "current_stage": "Joined",
    "stage_entered_at": "2026-10-15T18:00:00Z",
    "stage_history": "Applied 09 Oct; Shortlisted 15 Oct; Interview 15 Oct; Selected 15 Oct; Joined 15 Oct",
    "override_reason": null,
    "manager_release_status": "Released",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0132",
    "scores": {
      "overall_match_pct": 96.0,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.96
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Mobile Core & 5G"
  },
  {
    "application_id": "APP-00436",
    "opportunity_id": "OPP-4016",
    "opportunity_title": "RAN Engineer - 5G Network Slicing for Enterprise",
    "opportunity_type": "Secondment",
    "org_unit_name": "Mobile Core & 5G",
    "employee_id": "EMP-1147",
    "employee_name": "Senali Jayasinghe",
    "current_role_title": "RAN Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-008",
    "current_org_unit_name": "Mobile Core & 5G",
    "employee_location": "Colombo HQ",
    "tenure_years": 4.9,
    "application_date": "2026-10-13",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-10-15T15:50:00Z",
    "stage_history": "Applied 13 Oct; Shortlisted 14 Oct; Interview 15 Oct; Rejected 15 Oct",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": "GAP-0132",
    "scores": {
      "overall_match_pct": 98.5,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.788
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Mobile Core & 5G"
  },
  {
    "application_id": "APP-00437",
    "opportunity_id": "OPP-4016",
    "opportunity_title": "RAN Engineer - 5G Network Slicing for Enterprise",
    "opportunity_type": "Secondment",
    "org_unit_name": "Mobile Core & 5G",
    "employee_id": "EMP-1307",
    "employee_name": "Lakmini Tennakoon",
    "current_role_title": "Core Network Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-008",
    "current_org_unit_name": "Mobile Core & 5G",
    "employee_location": "Colombo HQ",
    "tenure_years": 9.2,
    "application_date": "2026-09-24",
    "current_stage": "Withdrawn",
    "stage_entered_at": "2026-10-09T13:00:00Z",
    "stage_history": "Applied 24 Sep; Shortlisted 29 Sep; Interview 01 Oct; Selected 03 Oct; Withdrawn 09 Oct",
    "override_reason": null,
    "manager_release_status": "Declined",
    "outcome_reason": null,
    "closed_gap_id": "GAP-0132",
    "scores": {
      "overall_match_pct": 81.8,
      "skill_match_pct": 66.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.655
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0064",
        "skill_name": "RAN Optimisation",
        "held_proficiency": 2,
        "target_proficiency": 3,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Mobile Core & 5G"
  },
  {
    "application_id": "APP-00438",
    "opportunity_id": "OPP-4017",
    "opportunity_title": "Senior NOC Engineer - Legacy Switch Decommissioning",
    "opportunity_type": "Gig",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-1277",
    "employee_name": "Ruwan Munasinghe",
    "current_role_title": "NOC Engineer | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-001",
    "current_org_unit_name": "Network Operations",
    "employee_location": "Jaffna Hub",
    "tenure_years": 3.1,
    "application_date": "2026-06-25",
    "current_stage": "Joined",
    "stage_entered_at": "2026-07-07T08:45:00Z",
    "stage_history": "Applied 25 Jun; Shortlisted 28 Jun; Interview 30 Jun; Selected 01 Jul; Joined 07 Jul",
    "override_reason": null,
    "manager_release_status": "Released",
    "outcome_reason": null,
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 97.0,
      "skill_match_pct": 100.0,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 50.0,
      "readiness_score": 0.97
    },
    "skill_gaps": [],
    "time_to_ready_months": 0,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Network Operations"
  },
  {
    "application_id": "APP-00439",
    "opportunity_id": "OPP-4017",
    "opportunity_title": "Senior NOC Engineer - Legacy Switch Decommissioning",
    "opportunity_type": "Gig",
    "org_unit_name": "Network Operations",
    "employee_id": "EMP-1578",
    "employee_name": "Lakmini Mohamed",
    "current_role_title": "Senior NOC Engineer | L4 Telecom & Digital Professional",
    "current_org_unit_id": "OU-001",
    "current_org_unit_name": "Network Operations",
    "employee_location": "Colombo HQ",
    "tenure_years": 14.4,
    "application_date": "2026-05-31",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-06-02T15:15:00Z",
    "stage_history": "Applied 31 May; Rejected 02 Jun",
    "override_reason": "Screened out at eligibility review; Shortlisted and Interview skipped by hiring manager",
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": null,
    "scores": {
      "overall_match_pct": 91.4,
      "skill_match_pct": 85.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.731
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0055",
        "skill_name": "IP/MPLS Routing",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Network Operations"
  },
  {
    "application_id": "APP-00440",
    "opportunity_id": "OPP-4018",
    "opportunity_title": "Security Architect - AI-assisted SOC Triage",
    "opportunity_type": "Secondment",
    "org_unit_name": "Cybersecurity",
    "employee_id": "EMP-1623",
    "employee_name": "Rizwan Ekanayake",
    "current_role_title": "SOC Analyst | L3 Telecom & Digital Professional",
    "current_org_unit_id": "OU-007",
    "current_org_unit_name": "Cybersecurity",
    "employee_location": "Colombo HQ",
    "tenure_years": 5.3,
    "application_date": "2026-08-13",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-08-19T08:10:00Z",
    "stage_history": "Applied 13 Aug; Rejected 19 Aug",
    "override_reason": "Screened out at eligibility review; Shortlisted and Interview skipped by hiring manager",
    "manager_release_status": "Not requested",
    "outcome_reason": "Minimum experience not met",
    "closed_gap_id": "GAP-0135",
    "scores": {
      "overall_match_pct": 92.4,
      "skill_match_pct": 85.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 95.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.739
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0075",
        "skill_name": "Security Architecture",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cybersecurity"
  },
  {
    "application_id": "APP-00441",
    "opportunity_id": "OPP-4018",
    "opportunity_title": "Security Architect - AI-assisted SOC Triage",
    "opportunity_type": "Secondment",
    "org_unit_name": "Cybersecurity",
    "employee_id": "EMP-2398",
    "employee_name": "Ama Ismail",
    "current_role_title": "Security Architect | L5 Telecom & Digital Professional",
    "current_org_unit_id": "OU-007",
    "current_org_unit_name": "Cybersecurity",
    "employee_location": "Colombo HQ",
    "tenure_years": 15.5,
    "application_date": "2026-08-08",
    "current_stage": "Rejected",
    "stage_entered_at": "2026-08-23T08:10:00Z",
    "stage_history": "Applied 08 Aug; Shortlisted 09 Aug; Interview 17 Aug; Rejected 23 Aug",
    "override_reason": null,
    "manager_release_status": "Not requested",
    "outcome_reason": "Role requires on-site presence the candidate cannot meet",
    "closed_gap_id": "GAP-0135",
    "scores": {
      "overall_match_pct": 91.4,
      "skill_match_pct": 85.7,
      "experience_match_pct": 100.0,
      "qualification_match_pct": 100.0,
      "career_fit_pct": 85.0,
      "location_fit_pct": 100.0,
      "readiness_score": 0.731
    },
    "skill_gaps": [
      {
        "skill_id": "SKL-0075",
        "skill_name": "Security Architecture",
        "held_proficiency": 3,
        "target_proficiency": 4,
        "gap_levels": 1,
        "learning_hours": 90
      }
    ],
    "time_to_ready_months": 4.5,
    "backfill_impact": "Leaves 1.0 FTE backfill vacancy in Cybersecurity"
  }
];

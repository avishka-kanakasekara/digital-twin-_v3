/**
 * Authentic Workforce Intelligence Defaults (from Organization_Twin_Dummy_Data_M1-M9.xlsx)
 * Ensures 100% resilient rendering even before/during API calls or offline modes.
 */

export const DEFAULT_SKILL_SHORTAGES = [
  {
    "rank": 1,
    "role_id": "ROLE-2001",
    "role": "Senior Data Scientist",
    "skill": "Python",
    "target_prof": 4,
    "mean_prof": 3.0,
    "dept": "Data Science & Retail Analytics",
    "urgency": "HIGH",
    "gap": "-3",
    "headcount_gap": 3,
    "current_headcount": 6,
    "demand_headcount_net": 9,
    "capability_gap_score": 0.33,
    "internal_supply_ratio": 0.22,
    "skill_scarcity_index": 0.73,
    "workforce_readiness_score": 0.44,
    "readiness_band": "Amber",
    "time_to_close_build_months": 11,
    "time_to_close_buy_days": 155,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.17,
    "retirement_exposure": "1 of 6",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 4,
        "mean_effective_proficiency": 3.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Machine Learning",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "MLOps",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Statistics",
        "target_proficiency": 4,
        "mean_effective_proficiency": 3.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      }
    ]
  },
  {
    "rank": 2,
    "role_id": "ROLE-2002",
    "role": "Principal SD-WAN Architect",
    "skill": "Network Automation (Ansible)",
    "target_prof": 3,
    "mean_prof": 2.0,
    "dept": "Enterprise & SD-WAN Solutions",
    "urgency": "HIGH",
    "gap": "-1",
    "headcount_gap": 1,
    "current_headcount": 1,
    "demand_headcount_net": 2,
    "capability_gap_score": 0.09,
    "internal_supply_ratio": 0.5,
    "skill_scarcity_index": 0.53,
    "workforce_readiness_score": 0.46,
    "readiness_band": "Amber",
    "time_to_close_build_months": 4,
    "time_to_close_buy_days": 240,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 1.0,
    "retirement_exposure": "1 of 1",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      }
    ]
  },
  {
    "rank": 3,
    "role_id": "ROLE-2003",
    "role": "MLOps Engineer",
    "skill": "MLOps",
    "target_prof": 4,
    "mean_prof": 0.6,
    "dept": "Data Science & Retail Analytics",
    "urgency": "HIGH",
    "gap": "-2",
    "headcount_gap": 2,
    "current_headcount": 20,
    "demand_headcount_net": 22,
    "capability_gap_score": 0.82,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.79,
    "workforce_readiness_score": 0,
    "readiness_band": "Red",
    "time_to_close_build_months": 25,
    "time_to_close_buy_days": 261,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.05,
    "retirement_exposure": "1 of 20",
    "critical_risk_flag": true,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "MLOps",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.6,
        "gap": 3.4,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 272
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.9,
        "gap": 2.1,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 168
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.8,
        "gap": 2.2,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 176
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.9,
        "gap": 2.1,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 168
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Infrastructure as Code (Terraform)",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ]
  },
  {
    "rank": 4,
    "role_id": "ROLE-2004",
    "role": "5G Network Slicing Engineer",
    "skill": "5G Core (SA)",
    "target_prof": 4,
    "mean_prof": 0.8,
    "dept": "Mobile Core & 5G",
    "urgency": "HIGH",
    "gap": "-3",
    "headcount_gap": 3,
    "current_headcount": 12,
    "demand_headcount_net": 15,
    "capability_gap_score": 0.81,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.85,
    "workforce_readiness_score": 0,
    "readiness_band": "Red",
    "time_to_close_build_months": 29,
    "time_to_close_buy_days": 303,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.08,
    "retirement_exposure": "1 of 12",
    "critical_risk_flag": true,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "5G Core (SA)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.8,
        "gap": 3.2,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 256
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Slicing (Cloud-native)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.2,
        "gap": 3.8,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 304
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.6,
        "gap": 2.4,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 192
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "IP/MPLS Routing",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.7,
        "gap": 1.3,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 104
      }
    ]
  },
  {
    "rank": 5,
    "role_id": "ROLE-2005",
    "role": "Cloud Platform Engineer",
    "skill": "Cloud Platforms (AWS/Azure)",
    "target_prof": 4,
    "mean_prof": 2.0,
    "dept": "Cloud & Data Centre",
    "urgency": "HIGH",
    "gap": "-2",
    "headcount_gap": 0,
    "current_headcount": 4,
    "demand_headcount_net": 4,
    "capability_gap_score": 0.56,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.8,
    "workforce_readiness_score": 0.44,
    "readiness_band": "Amber",
    "time_to_close_build_months": 15,
    "time_to_close_buy_days": 238,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.25,
    "retirement_exposure": "1 of 4",
    "critical_risk_flag": true,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Infrastructure as Code (Terraform)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.2,
        "gap": 1.8,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 144
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "FinOps",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.8,
        "gap": 1.2,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 96
      }
    ]
  },
  {
    "rank": 6,
    "role_id": "ROLE-2006",
    "role": "FinOps Analyst",
    "skill": "FinOps",
    "target_prof": 4,
    "mean_prof": 0.1,
    "dept": "Cloud & Data Centre",
    "urgency": "HIGH",
    "gap": "-2",
    "headcount_gap": 2,
    "current_headcount": 13,
    "demand_headcount_net": 15,
    "capability_gap_score": 0.83,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.8,
    "workforce_readiness_score": 0,
    "readiness_band": "Red",
    "time_to_close_build_months": 15,
    "time_to_close_buy_days": 254,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.08,
    "retirement_exposure": "1 of 13",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "FinOps",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.1,
        "gap": 3.9,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 312
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.9,
        "gap": 2.1,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 168
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Budgeting & Cost Control",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "SQL",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.8,
        "gap": 2.2,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 176
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Data Visualisation (Power BI)",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.8,
        "gap": 1.2,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 96
      }
    ]
  },
  {
    "rank": 7,
    "role_id": "ROLE-2007",
    "role": "AI-assisted SOC Analyst",
    "skill": "SOC Operations & SIEM",
    "target_prof": 4,
    "mean_prof": 2.3,
    "dept": "Cybersecurity",
    "urgency": "HIGH",
    "gap": "-2",
    "headcount_gap": 0,
    "current_headcount": 7,
    "demand_headcount_net": 7,
    "capability_gap_score": 0.56,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.79,
    "workforce_readiness_score": 0.44,
    "readiness_band": "Amber",
    "time_to_close_build_months": 14,
    "time_to_close_buy_days": 245,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.14,
    "retirement_exposure": "1 of 7",
    "critical_risk_flag": true,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "SOC Operations & SIEM",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.3,
        "gap": 1.7,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 136
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Incident Response",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Threat Intelligence",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.6,
        "gap": 1.4,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 112
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Security",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.7,
        "gap": 2.3,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 184
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ]
  },
  {
    "rank": 8,
    "role_id": "ROLE-2008",
    "role": "Conversational AI Specialist",
    "skill": "Conversational AI Design",
    "target_prof": 4,
    "mean_prof": 0.4,
    "dept": "Customer Experience & Contact Centre",
    "urgency": "HIGH",
    "gap": "-1",
    "headcount_gap": 1,
    "current_headcount": 29,
    "demand_headcount_net": 30,
    "capability_gap_score": 0.92,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.86,
    "workforce_readiness_score": 0,
    "readiness_band": "Red",
    "time_to_close_build_months": 25,
    "time_to_close_buy_days": 304,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.03,
    "retirement_exposure": "1 of 29",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Conversational AI Design",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.4,
        "gap": 3.6,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 288
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Natural Language Processing",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CX Analytics",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.9,
        "gap": 2.1,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 168
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Generative AI & LLM Engineering",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      }
    ]
  },
  {
    "rank": 9,
    "role_id": "ROLE-2009",
    "role": "Digital Contact Centre Agent",
    "skill": "Customer Service Handling",
    "target_prof": 3,
    "mean_prof": 2.8,
    "dept": "Customer Experience & Contact Centre",
    "urgency": "MEDIUM",
    "gap": "--9",
    "headcount_gap": -9,
    "current_headcount": 23,
    "demand_headcount_net": 14,
    "capability_gap_score": 0.13,
    "internal_supply_ratio": 1,
    "skill_scarcity_index": 0.1,
    "workforce_readiness_score": 0.87,
    "readiness_band": "Green",
    "time_to_close_build_months": 2,
    "time_to_close_buy_days": 166,
    "closure_feasibility": "Feasible",
    "knowledge_concentration_index": 0.04,
    "retirement_exposure": "1 of 23",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Customer Service Handling",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.8,
        "gap": 0.2,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 16
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CRM Platforms (Salesforce)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      }
    ]
  },
  {
    "rank": 10,
    "role_id": "ROLE-2010",
    "role": "Customer Experience Analyst",
    "skill": "CX Analytics",
    "target_prof": 4,
    "mean_prof": 2.8,
    "dept": "Customer Experience & Contact Centre",
    "urgency": "HIGH",
    "gap": "--3",
    "headcount_gap": -3,
    "current_headcount": 6,
    "demand_headcount_net": 3,
    "capability_gap_score": 0.56,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.71,
    "workforce_readiness_score": 0.44,
    "readiness_band": "Amber",
    "time_to_close_build_months": 11,
    "time_to_close_buy_days": 209,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.17,
    "retirement_exposure": "1 of 6",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CX Analytics",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.8,
        "gap": 1.2,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 96
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "SQL",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.7,
        "gap": 1.3,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 104
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Data Visualisation (Power BI)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.7,
        "gap": 1.3,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 104
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Statistics",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ]
  },
  {
    "rank": 11,
    "role_id": "ROLE-2011",
    "role": "Network Automation Engineer",
    "skill": "Network Automation (Ansible)",
    "target_prof": 4,
    "mean_prof": 1.3,
    "dept": "Network Operations",
    "urgency": "HIGH",
    "gap": "-1",
    "headcount_gap": 1,
    "current_headcount": 3,
    "demand_headcount_net": 4,
    "capability_gap_score": 0.64,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.79,
    "workforce_readiness_score": 0.27,
    "readiness_band": "Red",
    "time_to_close_build_months": 15,
    "time_to_close_buy_days": 267,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.33,
    "retirement_exposure": "1 of 3",
    "critical_risk_flag": true,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 1.3,
        "gap": 2.7,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 216
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "API Design (TM Forum Open APIs)",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ]
  },
  {
    "rank": 12,
    "role_id": "ROLE-2012",
    "role": "Legacy Switching Technician",
    "skill": "Network Monitoring & NOC Tools",
    "target_prof": 3,
    "mean_prof": 2.2,
    "dept": "Network Operations",
    "urgency": "MEDIUM",
    "gap": "-2",
    "headcount_gap": 0,
    "current_headcount": 6,
    "demand_headcount_net": 6,
    "capability_gap_score": 0.13,
    "internal_supply_ratio": 0.83,
    "skill_scarcity_index": 0.14,
    "workforce_readiness_score": 0.88,
    "readiness_band": "Green",
    "time_to_close_build_months": 2,
    "time_to_close_buy_days": 136,
    "closure_feasibility": "Feasible",
    "knowledge_concentration_index": 0.17,
    "retirement_exposure": "1 of 6",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Monitoring & NOC Tools",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.2,
        "gap": 0.8,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 63
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Optical Transport (DWDM)",
        "target_proficiency": 2,
        "mean_effective_proficiency": 1.8,
        "gap": 0.2,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 15
      }
    ]
  },
  {
    "rank": 13,
    "role_id": "ROLE-2013",
    "role": "Digital Platform Product Owner",
    "skill": "Agile Product Ownership",
    "target_prof": 4,
    "mean_prof": 3.7,
    "dept": "Digital Platforms & IT",
    "urgency": "MEDIUM",
    "gap": "-2",
    "headcount_gap": 0,
    "current_headcount": 3,
    "demand_headcount_net": 3,
    "capability_gap_score": 0.04,
    "internal_supply_ratio": 0.67,
    "skill_scarcity_index": 0.42,
    "workforce_readiness_score": 0.96,
    "readiness_band": "Green",
    "time_to_close_build_months": 1,
    "time_to_close_buy_days": 257,
    "closure_feasibility": "Feasible",
    "knowledge_concentration_index": 0.33,
    "retirement_exposure": "1 of 3",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Agile Product Ownership",
        "target_proficiency": 4,
        "mean_effective_proficiency": 3.7,
        "gap": 0.3,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 23
      }
    ]
  },
  {
    "rank": 14,
    "role_id": "ROLE-2014",
    "role": "Data Engineer",
    "skill": "Data Engineering (Spark)",
    "target_prof": 4,
    "mean_prof": 2.0,
    "dept": "Data Science & Retail Analytics",
    "urgency": "HIGH",
    "gap": "-1",
    "headcount_gap": 1,
    "current_headcount": 4,
    "demand_headcount_net": 5,
    "capability_gap_score": 0.55,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.77,
    "workforce_readiness_score": 0.36,
    "readiness_band": "Red",
    "time_to_close_build_months": 15,
    "time_to_close_buy_days": 265,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.25,
    "retirement_exposure": "1 of 4",
    "critical_risk_flag": false,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Data Engineering (Spark)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Data Governance",
        "target_proficiency": 2,
        "mean_effective_proficiency": 1.2,
        "gap": 0.8,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 64
      }
    ]
  }
];

export const DEFAULT_GAP_HEATMAP = {
  "departments": [
    "Network Operations",
    "Enterprise & SD-WAN Solutions",
    "Cloud & Data Centre",
    "Data Science & Retail Analytics",
    "Customer Experience & Contact Centre",
    "Digital Platforms & IT",
    "Cybersecurity",
    "Mobile Core & 5G",
    "Human Resources & Talent"
  ],
  "skill_families": [
    "Data Science & ML",
    "Cloud & Platform",
    "Cybersecurity",
    "Data Engineering & BI",
    "Software Engineering",
    "Customer Experience"
  ],
  "matrix": [
    {
      "dept": "Network Operations",
      "org_unit_id": "OU-001",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.32,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.35,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.42,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.43,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.46,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.39,
          "status": "Medium Gap",
          "color": "#f59e0b"
        }
      ]
    },
    {
      "dept": "Enterprise & SD-WAN Solutions",
      "org_unit_id": "OU-002",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.1,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.28,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.14,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.09,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.13,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.05,
          "status": "Low Gap",
          "color": "#10b981"
        }
      ]
    },
    {
      "dept": "Cloud & Data Centre",
      "org_unit_id": "OU-003",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.28,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.62,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.62,
          "status": "Critical Gap",
          "color": "#f43f5e"
        }
      ]
    },
    {
      "dept": "Data Science & Retail Analytics",
      "org_unit_id": "OU-004",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.33,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.52,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.54,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.54,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.64,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.51,
          "status": "Critical Gap",
          "color": "#f43f5e"
        }
      ]
    },
    {
      "dept": "Customer Experience & Contact Centre",
      "org_unit_id": "OU-005",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.6,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.52,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.53,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.54,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.58,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.5,
          "status": "Critical Gap",
          "color": "#f43f5e"
        }
      ]
    },
    {
      "dept": "Digital Platforms & IT",
      "org_unit_id": "OU-006",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.05,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.06,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.05,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.05,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.38,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.09,
          "status": "Low Gap",
          "color": "#10b981"
        }
      ]
    },
    {
      "dept": "Cybersecurity",
      "org_unit_id": "OU-007",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.54,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.63,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.56,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.63,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.52,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.49,
          "status": "Critical Gap",
          "color": "#f43f5e"
        }
      ]
    },
    {
      "dept": "Mobile Core & 5G",
      "org_unit_id": "OU-008",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.65,
          "status": "Critical Gap",
          "color": "#f43f5e"
        }
      ]
    },
    {
      "dept": "Human Resources & Talent",
      "org_unit_id": "OU-009",
      "skills": [
        {
          "family": "Data Science & ML",
          "gap_score": 0.13,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Cloud & Platform",
          "gap_score": 0.16,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Cybersecurity",
          "gap_score": 0.18,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Data Engineering & BI",
          "gap_score": 0.26,
          "status": "Medium Gap",
          "color": "#f59e0b"
        },
        {
          "family": "Software Engineering",
          "gap_score": 0.14,
          "status": "Low Gap",
          "color": "#10b981"
        },
        {
          "family": "Customer Experience",
          "gap_score": 0.25,
          "status": "Medium Gap",
          "color": "#f59e0b"
        }
      ]
    }
  ]
};

export const DEFAULT_CRITICAL_ROLES_AT_RISK = [
  {
    "role_id": "ROLE-2003",
    "role_title": "MLOps Engineer",
    "dept": "Data Science & Retail Analytics",
    "org_unit_id": "OU-004",
    "business_criticality_index": 0.82,
    "criticality_tier": "Tier 1",
    "capability_gap_score": 0.82,
    "weighted_capability_gap_score": 0.83,
    "current_headcount": 20,
    "demand_headcount_net": 22,
    "headcount_gap": 2,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.79,
    "workforce_readiness_score": 0,
    "readiness_band": "Red",
    "critical_risk_flag": true,
    "time_to_close_build_months": 25,
    "time_to_close_buy_days": 261,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.05,
    "retirement_exposure": "1 of 20",
    "ready_successors": 0,
    "gap_trend": "Improving",
    "confidence_level": 0.85,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "MLOps",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.6,
        "gap": 3.4,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 272
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.9,
        "gap": 2.1,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 168
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.8,
        "gap": 2.2,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 176
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.9,
        "gap": 2.1,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 168
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Infrastructure as Code (Terraform)",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ],
    "contributing_factors": [
      "Business Criticality (0.82) exceeds threshold (0.7)",
      "Ready Successors (0) below threshold (1)",
      "Skill Scarcity Index (0.79) exceeds threshold (0.6)",
      "Net Headcount Shortage of 2 FTE against future demand"
    ]
  },
  {
    "role_id": "ROLE-2004",
    "role_title": "5G Network Slicing Engineer",
    "dept": "Mobile Core & 5G",
    "org_unit_id": "OU-008",
    "business_criticality_index": 0.86,
    "criticality_tier": "Tier 1",
    "capability_gap_score": 0.81,
    "weighted_capability_gap_score": 0.85,
    "current_headcount": 12,
    "demand_headcount_net": 15,
    "headcount_gap": 3,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.85,
    "workforce_readiness_score": 0,
    "readiness_band": "Red",
    "critical_risk_flag": true,
    "time_to_close_build_months": 29,
    "time_to_close_buy_days": 303,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.08,
    "retirement_exposure": "1 of 12",
    "ready_successors": 0,
    "gap_trend": "Improving",
    "confidence_level": 0.85,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "5G Core (SA)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.8,
        "gap": 3.2,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 256
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Slicing (Cloud-native)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 0.2,
        "gap": 3.8,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 304
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.6,
        "gap": 2.4,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 192
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "IP/MPLS Routing",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.7,
        "gap": 1.3,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 104
      }
    ],
    "contributing_factors": [
      "Business Criticality (0.86) exceeds threshold (0.7)",
      "Ready Successors (0) below threshold (1)",
      "Skill Scarcity Index (0.85) exceeds threshold (0.6)",
      "Net Headcount Shortage of 3 FTE against future demand"
    ]
  },
  {
    "role_id": "ROLE-2005",
    "role_title": "Cloud Platform Engineer",
    "dept": "Cloud & Data Centre",
    "org_unit_id": "OU-003",
    "business_criticality_index": 0.72,
    "criticality_tier": "Tier 1",
    "capability_gap_score": 0.56,
    "weighted_capability_gap_score": 0.56,
    "current_headcount": 4,
    "demand_headcount_net": 4,
    "headcount_gap": 0,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.8,
    "workforce_readiness_score": 0.44,
    "readiness_band": "Amber",
    "critical_risk_flag": true,
    "time_to_close_build_months": 15,
    "time_to_close_buy_days": 238,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.25,
    "retirement_exposure": "1 of 4",
    "ready_successors": 0,
    "gap_trend": "Worsening",
    "confidence_level": 0.85,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Platforms (AWS/Azure)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Kubernetes",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Infrastructure as Code (Terraform)",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.2,
        "gap": 1.8,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 144
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "FinOps",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.8,
        "gap": 1.2,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 96
      }
    ],
    "contributing_factors": [
      "Business Criticality (0.72) exceeds threshold (0.7)",
      "Ready Successors (0) below threshold (1)",
      "Skill Scarcity Index (0.8) exceeds threshold (0.6)"
    ]
  },
  {
    "role_id": "ROLE-2007",
    "role_title": "AI-assisted SOC Analyst",
    "dept": "Cybersecurity",
    "org_unit_id": "OU-007",
    "business_criticality_index": 0.76,
    "criticality_tier": "Tier 1",
    "capability_gap_score": 0.56,
    "weighted_capability_gap_score": 0.49,
    "current_headcount": 7,
    "demand_headcount_net": 7,
    "headcount_gap": 0,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.79,
    "workforce_readiness_score": 0.44,
    "readiness_band": "Amber",
    "critical_risk_flag": true,
    "time_to_close_build_months": 14,
    "time_to_close_buy_days": 245,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.14,
    "retirement_exposure": "1 of 7",
    "ready_successors": 0,
    "gap_trend": "Worsening",
    "confidence_level": 0.85,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "SOC Operations & SIEM",
        "target_proficiency": 4,
        "mean_effective_proficiency": 2.3,
        "gap": 1.7,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 136
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Incident Response",
        "target_proficiency": 3,
        "mean_effective_proficiency": 2.0,
        "gap": 1.0,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 80
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Threat Intelligence",
        "target_proficiency": 3,
        "mean_effective_proficiency": 1.6,
        "gap": 1.4,
        "skill_importance": "Important",
        "skill_weight": 0.6,
        "is_mandatory": true,
        "learning_hours_needed": 112
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Cloud Security",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.7,
        "gap": 2.3,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 184
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ],
    "contributing_factors": [
      "Business Criticality (0.76) exceeds threshold (0.7)",
      "Ready Successors (0) below threshold (1)",
      "Skill Scarcity Index (0.79) exceeds threshold (0.6)"
    ]
  },
  {
    "role_id": "ROLE-2011",
    "role_title": "Network Automation Engineer",
    "dept": "Network Operations",
    "org_unit_id": "OU-001",
    "business_criticality_index": 0.74,
    "criticality_tier": "Tier 1",
    "capability_gap_score": 0.64,
    "weighted_capability_gap_score": 0.65,
    "current_headcount": 3,
    "demand_headcount_net": 4,
    "headcount_gap": 1,
    "internal_supply_ratio": 0,
    "skill_scarcity_index": 0.79,
    "workforce_readiness_score": 0.27,
    "readiness_band": "Red",
    "critical_risk_flag": true,
    "time_to_close_build_months": 15,
    "time_to_close_buy_days": 267,
    "closure_feasibility": "At Risk",
    "knowledge_concentration_index": 0.33,
    "retirement_exposure": "1 of 3",
    "ready_successors": 0,
    "gap_trend": "Improving",
    "confidence_level": 0.85,
    "skill_gaps": [
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Network Automation (Ansible)",
        "target_proficiency": 4,
        "mean_effective_proficiency": 1.3,
        "gap": 2.7,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 216
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "Python",
        "target_proficiency": 3,
        "mean_effective_proficiency": 0.0,
        "gap": 3.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 240
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "CI/CD Pipelines",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      },
      {
        "skill_id": "SKL-TAX",
        "skill_name": "API Design (TM Forum Open APIs)",
        "target_proficiency": 2,
        "mean_effective_proficiency": 0.0,
        "gap": 2.0,
        "skill_importance": "Critical",
        "skill_weight": 1.0,
        "is_mandatory": true,
        "learning_hours_needed": 160
      }
    ],
    "contributing_factors": [
      "Business Criticality (0.74) exceeds threshold (0.7)",
      "Ready Successors (0) below threshold (1)",
      "Skill Scarcity Index (0.79) exceeds threshold (0.6)",
      "Net Headcount Shortage of 1 FTE against future demand"
    ]
  }
];

export const DEFAULT_NET_GAP_DATA = {
  baseline_staff: 146,
  attrition: 12,
  retirements: 7,
  growth_demand: 28,
  net_shortage: -9,
  dataset_source: "Organization_Twin_Dummy_Data_M1-M9.xlsx (146 Employees)"
};

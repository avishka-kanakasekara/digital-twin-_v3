"""
Module 1: Strategy Role Architect Service.
Reference Architecture Edition (ADL September 2026 Specification).

Turns strategy into a target: future role specifications, a versioned Role-Skill Map,
headcount demand by year, and a recommended 5B fulfilment route for closing each gap.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# In-memory storage cache with fallback seed datasets
_STRATEGY_DRIVERS: List[Dict[str, Any]] = [
    {
        "strategy_driver_id": "STR-001",
        "driver_name": "Cloud Native & Microservices Modernization",
        "driver_type": "Modernization",
        "description": "Shift enterprise monoliths into modular cloud microservices on Azure & AWS, eliminating technical debt.",
        "affected_org_unit_ids": ["OU-001", "OU-004"],
        "affected_dept": "Engineering",
        "horizon_start_fy": "FY26",
        "horizon_end_fy": "FY28",
        "priority_rank": 1,
        "source_document_ref": "BP-2026-TECH-01",
        "workforce_growth_assumption_pct": 0.35,
        "technology_roadmap_items": ["AWS EKS", "Terraform Cloud", "Kafka Event Mesh"],
        "sunsetting_items": ["Legacy WebSphere Application Server", "On-prem Oracle RAC"],
        "sunset_target_fy": "FY27",
        "expected_productivity_gain_pct": 0.15,
        "opex_ceiling_lkr": 65000000,
        "approver_role": "CHRO",
        "status": "Active"
    },
    {
        "strategy_driver_id": "STR-002",
        "driver_name": "Autonomous AI & Predictive Operations",
        "driver_type": "Automation",
        "description": "Automate operational triage, telemetry monitoring, and model maintenance using autonomous LLM and ML agents.",
        "affected_org_unit_ids": ["OU-002", "OU-004"],
        "affected_dept": "Operations",
        "horizon_start_fy": "FY26",
        "horizon_end_fy": "FY29",
        "priority_rank": 2,
        "source_document_ref": "BP-2026-AI-OPS-03",
        "workforce_growth_assumption_pct": 0.45,
        "technology_roadmap_items": ["LangChain", "Vertex AI / Azure OpenAI", "Prometheus AgentMesh"],
        "sunsetting_items": ["Manual Level-1 Ticket Routing"],
        "sunset_target_fy": "FY27",
        "expected_productivity_gain_pct": 0.25,
        "opex_ceiling_lkr": 50000000,
        "approver_role": "BU Leader",
        "status": "Active"
    },
    {
        "strategy_driver_id": "STR-003",
        "driver_name": "Enterprise Data Governance & Zero Trust",
        "driver_type": "Compliance",
        "description": "Ensure total compliance with EU AI Act, global GDPR, and central bank security protocols with automated lineage.",
        "affected_org_unit_ids": ["OU-003"],
        "affected_dept": "Corporate",
        "horizon_start_fy": "FY26",
        "horizon_end_fy": "FY28",
        "priority_rank": 3,
        "source_document_ref": "REG-2026-GOV-09",
        "workforce_growth_assumption_pct": 0.20,
        "technology_roadmap_items": ["Microsoft Purview", "HashiCorp Vault", "Collibra"],
        "sunsetting_items": ["Spreadsheet Access Reviews"],
        "sunset_target_fy": "FY26",
        "expected_productivity_gain_pct": 0.10,
        "opex_ceiling_lkr": 35000000,
        "approver_role": "CHRO",
        "status": "Active"
    },
    {
        "strategy_driver_id": "STR-004",
        "driver_name": "Scale AI-Enabled Retail & Digital Analytics",
        "driver_type": "Growth",
        "description": "Move retail & commercial analytics from batch weekly reporting to production real-time ML pipelines.",
        "affected_org_unit_ids": ["OU-004"],
        "affected_dept": "Engineering",
        "horizon_start_fy": "FY26",
        "horizon_end_fy": "FY28",
        "priority_rank": 4,
        "source_document_ref": "BP-2026-RETAIL-01",
        "workforce_growth_assumption_pct": 0.50,
        "technology_roadmap_items": ["AWS SageMaker", "Feast Feature Store", "Snowflake ML"],
        "sunsetting_items": ["On-premise BI reporting (SSRS)"],
        "sunset_target_fy": "FY27",
        "expected_productivity_gain_pct": 0.20,
        "opex_ceiling_lkr": 45000000,
        "approver_role": "CHRO",
        "status": "Active"
    },
    {
        "strategy_driver_id": "STR-005",
        "driver_name": "DevSecOps & Platform Engineering Acceleration",
        "driver_type": "Modernization",
        "description": "Consolidate developer tooling into an internal developer portal (IDP) with automated container security scanning.",
        "affected_org_unit_ids": ["OU-001", "OU-002"],
        "affected_dept": "Operations",
        "horizon_start_fy": "FY26",
        "horizon_end_fy": "FY28",
        "priority_rank": 5,
        "source_document_ref": "BP-2026-PLATFORM-02",
        "workforce_growth_assumption_pct": 0.30,
        "technology_roadmap_items": ["Backstage.io", "ArgoCD", "Snyk Container Scanning"],
        "sunsetting_items": ["Manual Deployment Checklists"],
        "sunset_target_fy": "FY26",
        "expected_productivity_gain_pct": 0.18,
        "opex_ceiling_lkr": 40000000,
        "approver_role": "Workforce Planning Lead",
        "status": "Active"
    }
]

_SKILLS_TAXONOMY: List[Dict[str, Any]] = [
    {
        "skill_id": "SKL-0071",
        "skill_name": "MLOps & Pipeline Engineering",
        "skill_category": "Technical",
        "skill_family": "Machine Learning",
        "external_taxonomy_code": "ESCO:2511.4",
        "is_orphan": False,
        "market_demand_index": 0.88,
        "market_supply_index": 0.22,
        "skill_half_life_months": 24,
        "typical_learning_hours_per_level": 80,
        "is_emerging": True,
        "is_sunsetting": False,
        "adjacent_skill_ids": ["SKL-0068", "SKL-0082"]
    },
    {
        "skill_id": "SKL-0068",
        "skill_name": "Deep Learning & LLM Fine-Tuning",
        "skill_category": "Technical",
        "skill_family": "Machine Learning",
        "external_taxonomy_code": "ESCO:2512.1",
        "is_orphan": False,
        "market_demand_index": 0.92,
        "market_supply_index": 0.18,
        "skill_half_life_months": 20,
        "typical_learning_hours_per_level": 90,
        "is_emerging": True,
        "is_sunsetting": False,
        "adjacent_skill_ids": ["SKL-0071"]
    },
    {
        "skill_id": "SKL-0082",
        "skill_name": "Cloud Native Architecture (AWS/Azure)",
        "skill_category": "Technical",
        "skill_family": "Cloud Engineering",
        "external_taxonomy_code": "ESCO:2519.3",
        "is_orphan": False,
        "market_demand_index": 0.90,
        "market_supply_index": 0.35,
        "skill_half_life_months": 36,
        "typical_learning_hours_per_level": 75,
        "is_emerging": True,
        "is_sunsetting": False,
        "adjacent_skill_ids": ["SKL-0105", "SKL-0071"]
    },
    {
        "skill_id": "SKL-0094",
        "skill_name": "Data Governance, Ethics & AI Compliance",
        "skill_category": "Functional",
        "skill_family": "Governance & Risk",
        "external_taxonomy_code": "ESCO:2422.2",
        "is_orphan": False,
        "market_demand_index": 0.80,
        "market_supply_index": 0.38,
        "skill_half_life_months": 48,
        "typical_learning_hours_per_level": 60,
        "is_emerging": True,
        "is_sunsetting": False,
        "adjacent_skill_ids": []
    },
    {
        "skill_id": "SKL-0105",
        "skill_name": "Container Security & DevSecOps Automation",
        "skill_category": "Technical",
        "skill_family": "Cybersecurity",
        "external_taxonomy_code": "ESCO:2529.1",
        "is_orphan": False,
        "market_demand_index": 0.85,
        "market_supply_index": 0.26,
        "skill_half_life_months": 30,
        "typical_learning_hours_per_level": 70,
        "is_emerging": True,
        "is_sunsetting": False,
        "adjacent_skill_ids": ["SKL-0082"]
    },
    {
        "skill_id": "SKL-0012",
        "skill_name": "Legacy On-Premise ETL & SSIS Scripting",
        "skill_category": "Technical",
        "skill_family": "Legacy Data",
        "external_taxonomy_code": "ESCO:2511.9",
        "is_orphan": False,
        "market_demand_index": 0.15,
        "market_supply_index": 0.85,
        "skill_half_life_months": 18,
        "typical_learning_hours_per_level": 40,
        "is_emerging": False,
        "is_sunsetting": True,
        "adjacent_skill_ids": ["SKL-0071"]
    }
]

_FUTURE_ROLES: List[Dict[str, Any]] = [
    {
        "future_role_id": "ROLE-2001",
        "job_code": "RA-DS-04",
        "role_title": "Senior Data Scientist & AI Specialist",
        "dept": "Engineering",
        "org_unit_id": "OU-004",
        "job_family_id": "JF-03",
        "career_level_id": "L4 Senior",
        "strategy_driver_id": "STR-004",
        "strategy_driver_name": "Scale AI-Enabled Retail & Digital Analytics",
        "current_role_id": "ROLE-1014",
        "role_purpose": "Owns the machine-learning model lifecycle end to end from experimentation to operational inference.",
        "key_responsibilities": [
            "Architect and deploy production-grade ML models",
            "Build automated feature stores & evaluation benchmarks",
            "Mentor junior data analysts and engineers in ML best practices",
            "Collaborate with product teams to embed predictive models into consumer workflows"
        ],
        "qualifications_required": ["M.Sc. or B.Sc. in Computer Science / Statistics or equivalent"],
        "min_years_experience": 5,
        "role_evolution_class": "Evolving",
        "sunset_target_date": None,
        "transition_target_role_ids": [],
        "business_criticality_index": 0.90,
        "criticality_tier": "Tier 1",
        "failure_impact_description": "Blocks the FY26-FY28 AI commercial analytics roadmap and delays personalized pricing models.",
        "target_cost_band_id": "BAND-7",
        "current_headcount": 6,
        "feeder_role_ids": ["ROLE-1021", "ROLE-1026"],
        "feeder_roles": [
            {"role_id": "ROLE-1021", "title": "Data Analyst (L3)", "skill_distance": 0.28},
            {"role_id": "ROLE-1026", "title": "BI Developer (L3)", "skill_distance": 0.35}
        ],
        "skill_distance_to_feeders": 0.28,
        "version": 3,
        "status": "Live",
        "approved_by": "CHRO-001",
        "approved_at": "2026-04-01T09:00:00Z",
        # 1.4 Role Skill Requirements
        "role_skill_requirements": [
            {
                "role_skill_req_id": "RSR-02011",
                "skill_id": "SKL-0071",
                "skill_name": "MLOps & Pipeline Engineering",
                "target_proficiency": 3,
                "current_avg_proficiency": 1.8,
                "skill_importance": "Critical",
                "skill_weight": 1.0,
                "is_mandatory": True,
                "required_at_level": "L4",
                "acquisition_route": "Trainable",
                "expected_time_to_acquire_months": 6
            },
            {
                "role_skill_req_id": "RSR-02012",
                "skill_id": "SKL-0068",
                "skill_name": "Deep Learning & LLM Fine-Tuning",
                "target_proficiency": 4,
                "current_avg_proficiency": 2.2,
                "skill_importance": "Critical",
                "skill_weight": 1.0,
                "is_mandatory": True,
                "required_at_level": "L4",
                "acquisition_route": "Trainable",
                "expected_time_to_acquire_months": 8
            },
            {
                "role_skill_req_id": "RSR-02013",
                "skill_id": "SKL-0082",
                "skill_name": "Cloud Native Architecture (AWS/Azure)",
                "target_proficiency": 3,
                "current_avg_proficiency": 2.0,
                "skill_importance": "Important",
                "skill_weight": 0.6,
                "is_mandatory": True,
                "required_at_level": "L4",
                "acquisition_route": "Trainable",
                "expected_time_to_acquire_months": 5
            }
        ],
        # 1.5 Demand Lines (by fiscal year)
        "demand_lines": [
            {
                "demand_line_id": "DMD-0141",
                "fiscal_year": "FY26",
                "demand_headcount_gross": 11,
                "productivity_adjustment": -2,
                "demand_headcount_net": 9,
                "attrition_rate_ttm": 0.14,
                "replacement_demand": 0.84,
                "net_new_demand": 3,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 65,
                "time_to_productivity_days": 90,
                "mobilization_lead_time_days": 180,
                "confidence_level": 0.82,
                "assumption_notes": "Assumes automated feature store raises analyst throughput by 20%."
            },
            {
                "demand_line_id": "DMD-0142",
                "fiscal_year": "FY27",
                "demand_headcount_gross": 14,
                "productivity_adjustment": -2,
                "demand_headcount_net": 12,
                "attrition_rate_ttm": 0.12,
                "replacement_demand": 1.08,
                "net_new_demand": 3,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 60,
                "time_to_productivity_days": 90,
                "mobilization_lead_time_days": 170,
                "confidence_level": 0.78,
                "assumption_notes": "Regional market expansion to Kandy and Galle hubs."
            },
            {
                "demand_line_id": "DMD-0143",
                "fiscal_year": "FY28",
                "demand_headcount_gross": 18,
                "productivity_adjustment": -3,
                "demand_headcount_net": 15,
                "attrition_rate_ttm": 0.10,
                "replacement_demand": 1.20,
                "net_new_demand": 3,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 55,
                "time_to_productivity_days": 90,
                "mobilization_lead_time_days": 160,
                "confidence_level": 0.74,
                "assumption_notes": "Full integration with retail partner ecosystems."
            }
        ],
        # 1.6 Outputs & Calculations
        "five_b_strategy": {
            "build_pct": 60,
            "buy_pct": 25,
            "borrow_pct": 0,
            "bot_pct": 15,
            "bridge_pct": 0,
            "summary": "Build 60% via internal L3 Data Analysts + Buy 25% external seniors + Bot 15% through AutoML productivity"
        },
        "build_cost_lkr": 1200000,
        "buy_cost_lkr": 2600000,
        "cost_comparator": "Build LKR 1.2M vs Buy LKR 2.6M (Saves LKR 1.4M per position)",
        "capability_gap_target": 0.33,
        "gap_priority": "High",
        "sourcing_risk": "High",
        "gap": "+10",
        "urgency": "HIGH"
    },
    {
        "future_role_id": "ROLE-2002",
        "job_code": "RA-CA-05",
        "role_title": "Lead Cloud Infrastructure Architect",
        "dept": "Engineering",
        "org_unit_id": "OU-001",
        "job_family_id": "JF-01",
        "career_level_id": "L5 Staff",
        "strategy_driver_id": "STR-001",
        "strategy_driver_name": "Cloud Native & Microservices Modernization",
        "current_role_id": "ROLE-1015",
        "role_purpose": "Defines multi-cloud topology, landing zones, resilient disaster-recovery topologies, and IaC standards.",
        "key_responsibilities": [
            "Lead technical architecture for hybrid AWS/Azure platforms",
            "Establish automated Terraform IaC governance and security policies",
            "Eliminate legacy on-prem dependencies",
            "Advise C-suite on cost optimization and cloud spend ceilings"
        ],
        "qualifications_required": ["AWS Solutions Architect Professional / Azure Solutions Architect Expert"],
        "min_years_experience": 8,
        "role_evolution_class": "Evolving",
        "sunset_target_date": None,
        "transition_target_role_ids": [],
        "business_criticality_index": 0.92,
        "criticality_tier": "Tier 1",
        "failure_impact_description": "Directly halts cloud migration milestones and breaches modernization SLA commitments.",
        "target_cost_band_id": "BAND-8",
        "current_headcount": 4,
        "feeder_role_ids": ["ROLE-1015"],
        "feeder_roles": [
            {"role_id": "ROLE-1015", "title": "Senior DevOps Engineer (L4)", "skill_distance": 0.22}
        ],
        "skill_distance_to_feeders": 0.22,
        "version": 2,
        "status": "Live",
        "approved_by": "CHRO-001",
        "approved_at": "2026-03-15T11:00:00Z",
        "role_skill_requirements": [
            {
                "role_skill_req_id": "RSR-02021",
                "skill_id": "SKL-0082",
                "skill_name": "Cloud Native Architecture (AWS/Azure)",
                "target_proficiency": 5,
                "current_avg_proficiency": 3.4,
                "skill_importance": "Critical",
                "skill_weight": 1.0,
                "is_mandatory": True,
                "required_at_level": "L5",
                "acquisition_route": "Hire-only",
                "expected_time_to_acquire_months": 12
            },
            {
                "role_skill_req_id": "RSR-02022",
                "skill_id": "SKL-0105",
                "skill_name": "Container Security & DevSecOps Automation",
                "target_proficiency": 4,
                "current_avg_proficiency": 2.8,
                "skill_importance": "Important",
                "skill_weight": 0.6,
                "is_mandatory": True,
                "required_at_level": "L5",
                "acquisition_route": "Trainable",
                "expected_time_to_acquire_months": 6
            }
        ],
        "demand_lines": [
            {
                "demand_line_id": "DMD-0201",
                "fiscal_year": "FY26",
                "demand_headcount_gross": 9,
                "productivity_adjustment": -1,
                "demand_headcount_net": 8,
                "attrition_rate_ttm": 0.10,
                "replacement_demand": 0.40,
                "net_new_demand": 4,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 75,
                "time_to_productivity_days": 120,
                "mobilization_lead_time_days": 195,
                "confidence_level": 0.85,
                "assumption_notes": "Essential for core banking and retail cluster migration."
            },
            {
                "demand_line_id": "DMD-0202",
                "fiscal_year": "FY27",
                "demand_headcount_gross": 12,
                "productivity_adjustment": -1,
                "demand_headcount_net": 11,
                "attrition_rate_ttm": 0.08,
                "replacement_demand": 0.64,
                "net_new_demand": 3,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 70,
                "time_to_productivity_days": 110,
                "mobilization_lead_time_days": 180,
                "confidence_level": 0.80,
                "assumption_notes": "Multi-region failover automation completion."
            }
        ],
        "five_b_strategy": {
            "build_pct": 40,
            "buy_pct": 40,
            "borrow_pct": 10,
            "bot_pct": 10,
            "bridge_pct": 0,
            "summary": "Build 40% (DevOps upgrade) + Buy 40% (external staff architects) + Borrow 10% cloud consulting + Bot 10% IaC generation"
        },
        "build_cost_lkr": 1500000,
        "buy_cost_lkr": 3400000,
        "cost_comparator": "Build LKR 1.5M vs Buy LKR 3.4M (Saves LKR 1.9M per position)",
        "capability_gap_target": 0.28,
        "gap_priority": "High",
        "sourcing_risk": "High",
        "gap": "+14",
        "urgency": "HIGH"
    },
    {
        "future_role_id": "ROLE-2003",
        "job_code": "RA-ML-04",
        "role_title": "AI / MLOps Platform Specialist",
        "dept": "Engineering",
        "org_unit_id": "OU-004",
        "job_family_id": "JF-03",
        "career_level_id": "L4 Senior",
        "strategy_driver_id": "STR-002",
        "strategy_driver_name": "Autonomous AI & Predictive Operations",
        "current_role_id": None,
        "role_purpose": "Operates centralized LLM orchestration pipelines, vector databases, and real-time model telemetry platforms.",
        "key_responsibilities": [
            "Build automated CI/CD for continuous model training and validation",
            "Establish GPU cluster scaling and cost guardrails",
            "Monitor drift, latency, and token consumption metrics across all LLM nodes"
        ],
        "qualifications_required": ["B.Sc. in Computer Science or Software Engineering"],
        "min_years_experience": 4,
        "role_evolution_class": "Emerging",
        "sunset_target_date": None,
        "transition_target_role_ids": [],
        "business_criticality_index": 0.88,
        "criticality_tier": "Tier 1",
        "failure_impact_description": "Causes production model latency spikes and prevents scale of autonomous AI support agents.",
        "target_cost_band_id": "BAND-7",
        "current_headcount": 2,
        "feeder_role_ids": ["ROLE-1014"],
        "feeder_roles": [
            {"role_id": "ROLE-1014", "title": "Software Engineer (L3)", "skill_distance": 0.32}
        ],
        "skill_distance_to_feeders": 0.32,
        "version": 1,
        "status": "Live",
        "approved_by": "BU Leader",
        "approved_at": "2026-05-10T14:00:00Z",
        "role_skill_requirements": [
            {
                "role_skill_req_id": "RSR-02031",
                "skill_id": "SKL-0071",
                "skill_name": "MLOps & Pipeline Engineering",
                "target_proficiency": 4,
                "current_avg_proficiency": 2.0,
                "skill_importance": "Critical",
                "skill_weight": 1.0,
                "is_mandatory": True,
                "required_at_level": "L4",
                "acquisition_route": "Trainable",
                "expected_time_to_acquire_months": 7
            }
        ],
        "demand_lines": [
            {
                "demand_line_id": "DMD-0203",
                "fiscal_year": "FY26",
                "demand_headcount_gross": 7,
                "productivity_adjustment": -1,
                "demand_headcount_net": 6,
                "attrition_rate_ttm": 0.12,
                "replacement_demand": 0.24,
                "net_new_demand": 4,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 60,
                "time_to_productivity_days": 80,
                "mobilization_lead_time_days": 160,
                "confidence_level": 0.80,
                "assumption_notes": "Required to run multi-tenant model endpoints."
            }
        ],
        "five_b_strategy": {
            "build_pct": 50,
            "buy_pct": 35,
            "borrow_pct": 0,
            "bot_pct": 15,
            "bridge_pct": 0,
            "summary": "Build 50% via software engineers + Buy 35% specialist MLOps + Bot 15% code generation"
        },
        "build_cost_lkr": 1350000,
        "buy_cost_lkr": 2900000,
        "cost_comparator": "Build LKR 1.35M vs Buy LKR 2.9M (Saves LKR 1.55M per position)",
        "capability_gap_target": 0.35,
        "gap_priority": "High",
        "sourcing_risk": "High",
        "gap": "+10",
        "urgency": "HIGH"
    },
    {
        "future_role_id": "ROLE-2004",
        "job_code": "RA-SO-04",
        "role_title": "DevSecOps & Platform Security Lead",
        "dept": "Operations",
        "org_unit_id": "OU-002",
        "job_family_id": "JF-02",
        "career_level_id": "L4 Senior",
        "strategy_driver_id": "STR-005",
        "strategy_driver_name": "DevSecOps & Platform Engineering Acceleration",
        "current_role_id": "ROLE-1018",
        "role_purpose": "Bakes automated security posture, secrets management, and dynamic SBOM validation into all delivery pipelines.",
        "key_responsibilities": [
            "Implement automated shift-left security checks in Git workflows",
            "Eliminate container vulnerability backlogs",
            "Maintain compliance gates with SOC2 and ISO 27001 standards"
        ],
        "qualifications_required": ["Certified Kubernetes Security Specialist (CKS) / CISSP"],
        "min_years_experience": 5,
        "role_evolution_class": "Evolving",
        "sunset_target_date": None,
        "transition_target_role_ids": [],
        "business_criticality_index": 0.78,
        "criticality_tier": "Tier 1",
        "failure_impact_description": "Exposes automated releases to supply chain vulnerabilities and regulatory penalties.",
        "target_cost_band_id": "BAND-7",
        "current_headcount": 5,
        "feeder_role_ids": ["ROLE-1018"],
        "feeder_roles": [
            {"role_id": "ROLE-1018", "title": "DevOps Engineer (L3)", "skill_distance": 0.25}
        ],
        "skill_distance_to_feeders": 0.25,
        "version": 2,
        "status": "Live",
        "approved_by": "Workforce Planning Lead",
        "approved_at": "2026-04-12T10:00:00Z",
        "role_skill_requirements": [
            {
                "role_skill_req_id": "RSR-02041",
                "skill_id": "SKL-0105",
                "skill_name": "Container Security & DevSecOps Automation",
                "target_proficiency": 4,
                "current_avg_proficiency": 2.5,
                "skill_importance": "Critical",
                "skill_weight": 1.0,
                "is_mandatory": True,
                "required_at_level": "L4",
                "acquisition_route": "Certification-gated",
                "expected_time_to_acquire_months": 6
            }
        ],
        "demand_lines": [
            {
                "demand_line_id": "DMD-0204",
                "fiscal_year": "FY26",
                "demand_headcount_gross": 10,
                "productivity_adjustment": -1,
                "demand_headcount_net": 9,
                "attrition_rate_ttm": 0.10,
                "replacement_demand": 0.50,
                "net_new_demand": 4,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 55,
                "time_to_productivity_days": 75,
                "mobilization_lead_time_days": 150,
                "confidence_level": 0.84,
                "assumption_notes": "Required across all 4 release trains."
            }
        ],
        "five_b_strategy": {
            "build_pct": 45,
            "buy_pct": 35,
            "borrow_pct": 10,
            "bot_pct": 10,
            "bridge_pct": 0,
            "summary": "Build 45% via certification + Buy 35% senior security engineers + Borrow 10% pen-testers + Bot 10% auto-remediation"
        },
        "build_cost_lkr": 1100000,
        "buy_cost_lkr": 2500000,
        "cost_comparator": "Build LKR 1.1M vs Buy LKR 2.5M (Saves LKR 1.4M per position)",
        "capability_gap_target": 0.25,
        "gap_priority": "High",
        "sourcing_risk": "Medium",
        "gap": "+8",
        "urgency": "MEDIUM"
    },
    {
        "future_role_id": "ROLE-2005",
        "job_code": "RA-DG-05",
        "role_title": "Lead Data Governance & AI Compliance Officer",
        "dept": "Corporate",
        "org_unit_id": "OU-003",
        "job_family_id": "JF-04",
        "career_level_id": "L5 Lead",
        "strategy_driver_id": "STR-003",
        "strategy_driver_name": "Enterprise Data Governance & Zero Trust",
        "current_role_id": None,
        "role_purpose": "Defines data stewardship policies, sensitive data cataloging, and algorithmic fairness audits.",
        "key_responsibilities": [
            "Establish enterprise data lineage and governance standards",
            "Audit LLM prompt and response stores for privacy leakage",
            "Liaise with external data protection authorities"
        ],
        "qualifications_required": ["CIPP/E, CDMP or legal/governance accreditation"],
        "min_years_experience": 7,
        "role_evolution_class": "Emerging",
        "sunset_target_date": None,
        "transition_target_role_ids": [],
        "business_criticality_index": 0.72,
        "criticality_tier": "Tier 1",
        "failure_impact_description": "Exposes organization to statutory audit failures and regulatory fines up to 4% turnover.",
        "target_cost_band_id": "BAND-8",
        "current_headcount": 3,
        "feeder_role_ids": ["ROLE-1025"],
        "feeder_roles": [
            {"role_id": "ROLE-1025", "title": "Data Privacy Analyst (L3)", "skill_distance": 0.38}
        ],
        "skill_distance_to_feeders": 0.38,
        "version": 2,
        "status": "Live",
        "approved_by": "CHRO-001",
        "approved_at": "2026-03-22T10:00:00Z",
        "role_skill_requirements": [
            {
                "role_skill_req_id": "RSR-02051",
                "skill_id": "SKL-0094",
                "skill_name": "Data Governance, Ethics & AI Compliance",
                "target_proficiency": 4,
                "current_avg_proficiency": 2.2,
                "skill_importance": "Critical",
                "skill_weight": 1.0,
                "is_mandatory": True,
                "required_at_level": "L5",
                "acquisition_route": "Hire-only",
                "expected_time_to_acquire_months": 9
            }
        ],
        "demand_lines": [
            {
                "demand_line_id": "DMD-0205",
                "fiscal_year": "FY26",
                "demand_headcount_gross": 7,
                "productivity_adjustment": -1,
                "demand_headcount_net": 6,
                "attrition_rate_ttm": 0.08,
                "replacement_demand": 0.24,
                "net_new_demand": 3,
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 80,
                "time_to_productivity_days": 90,
                "mobilization_lead_time_days": 180,
                "confidence_level": 0.88,
                "assumption_notes": "Statutory audit readiness required by Q4."
            }
        ],
        "five_b_strategy": {
            "build_pct": 30,
            "buy_pct": 50,
            "borrow_pct": 10,
            "bot_pct": 10,
            "bridge_pct": 0,
            "summary": "Build 30% via legal/compliance reskilling + Buy 50% experienced privacy officers + Borrow 10% legal counsel + Bot 10% automated lineage"
        },
        "build_cost_lkr": 950000,
        "buy_cost_lkr": 2800000,
        "cost_comparator": "Build LKR 950K vs Buy LKR 2.8M (Saves LKR 1.85M per position)",
        "capability_gap_target": 0.30,
        "gap_priority": "High",
        "sourcing_risk": "High",
        "gap": "+6",
        "urgency": "HIGH"
    },
    {
        "future_role_id": "ROLE-2006",
        "job_code": "RA-LA-03",
        "role_title": "Legacy On-Premise Data Administrator",
        "dept": "Operations",
        "org_unit_id": "OU-002",
        "job_family_id": "JF-04",
        "career_level_id": "L3 Mid",
        "strategy_driver_id": "STR-001",
        "strategy_driver_name": "Cloud Native & Microservices Modernization",
        "current_role_id": "ROLE-1011",
        "role_purpose": "Maintains sunsetting on-premise relational database instances and scheduled batch jobs.",
        "key_responsibilities": [
            "Maintain legacy SQL Server clusters during decommission phase",
            "Extract legacy schemas for cloud data warehouse migration",
            "Transition operations to cloud platform team"
        ],
        "qualifications_required": ["B.Sc. in IT or equivalent experience"],
        "min_years_experience": 3,
        "role_evolution_class": "Declining-Sunsetting",
        "sunset_target_date": "2027-06-30",
        "transition_target_role_ids": ["ROLE-2001", "ROLE-2002"],
        "transition_target_roles": [
            {"role_id": "ROLE-2001", "title": "Senior Data Scientist & AI Specialist", "retraining_months": 8},
            {"role_id": "ROLE-2002", "title": "Lead Cloud Infrastructure Architect", "retraining_months": 10}
        ],
        "business_criticality_index": 0.32,
        "criticality_tier": "Tier 3",
        "failure_impact_description": "Delayed decommissioning creates excess hardware maintenance contracts.",
        "target_cost_band_id": "BAND-5",
        "current_headcount": 14,
        "feeder_role_ids": [],
        "feeder_roles": [],
        "skill_distance_to_feeders": 0.0,
        "version": 1,
        "status": "Live",
        "approved_by": "CHRO-001",
        "approved_at": "2025-11-01T09:00:00Z",
        "role_skill_requirements": [
            {
                "role_skill_req_id": "RSR-02061",
                "skill_id": "SKL-0012",
                "skill_name": "Legacy On-Premise ETL & SSIS Scripting",
                "target_proficiency": 3,
                "current_avg_proficiency": 4.0,
                "skill_importance": "Desirable",
                "skill_weight": 0.3,
                "is_mandatory": False,
                "required_at_level": "L3",
                "acquisition_route": "Trainable",
                "expected_time_to_acquire_months": 2
            }
        ],
        "demand_lines": [
            {
                "demand_line_id": "DMD-0206",
                "fiscal_year": "FY26",
                "demand_headcount_gross": 8,
                "productivity_adjustment": -2,
                "demand_headcount_net": 6,
                "attrition_rate_ttm": 0.20,
                "replacement_demand": 0.0,
                "net_new_demand": -8,
                "demand_basis": "Automation offset",
                "time_to_hire_days_external": 0,
                "time_to_productivity_days": 0,
                "mobilization_lead_time_days": 0,
                "confidence_level": 0.90,
                "assumption_notes": "Phase 1 servers decommissioned by Q3."
            },
            {
                "demand_line_id": "DMD-0207",
                "fiscal_year": "FY27",
                "demand_headcount_gross": 2,
                "productivity_adjustment": -1,
                "demand_headcount_net": 1,
                "attrition_rate_ttm": 0.25,
                "replacement_demand": 0.0,
                "net_new_demand": -5,
                "demand_basis": "Automation offset",
                "time_to_hire_days_external": 0,
                "time_to_productivity_days": 0,
                "mobilization_lead_time_days": 0,
                "confidence_level": 0.92,
                "assumption_notes": "Phase 2 decommissioning leaves only 1 archivist."
            }
        ],
        "five_b_strategy": {
            "build_pct": 0,
            "buy_pct": 0,
            "borrow_pct": 0,
            "bot_pct": 20,
            "bridge_pct": 80,
            "summary": "Bridge 80% (redeployment into Cloud Architect & Data Science) + Bot 20% automation offset"
        },
        "build_cost_lkr": 600000,
        "buy_cost_lkr": 0,
        "cost_comparator": "Bridge retraining LKR 600K vs Severance LKR 1.8M (Saves LKR 1.2M per person through redeployment)",
        "capability_gap_target": 0.05,
        "gap_priority": "Low",
        "sourcing_risk": "Low",
        "gap": "-8",
        "urgency": "SUNSETTING"
    }
]


def get_strategy_drivers() -> List[Dict[str, Any]]:
    return _STRATEGY_DRIVERS


def get_skills_taxonomy() -> List[Dict[str, Any]]:
    return _SKILLS_TAXONOMY


def get_future_roles(department: Optional[str] = None) -> List[Dict[str, Any]]:
    if not department or department == "All Departments":
        return _FUTURE_ROLES
    return [r for r in _FUTURE_ROLES if r.get("dept", "").lower() == department.lower()]


def get_future_role_detail(role_id: str) -> Optional[Dict[str, Any]]:
    for r in _FUTURE_ROLES:
        if r["future_role_id"] == role_id or r.get("job_code") == role_id:
            return r
    return None


def create_future_role(role_data: Dict[str, Any], approver: str = "Workforce Planning Lead") -> Dict[str, Any]:
    role_id = f"ROLE-{2000 + len(_FUTURE_ROLES) + 1}"
    
    # Calculate Business Criticality Index
    strategic = float(role_data.get("strategic_impact", 0.8))
    revenue = float(role_data.get("revenue_dependency", 0.7))
    blocking = float(role_data.get("downstream_blocking", 0.75))
    spof = float(role_data.get("spof", 0.8))
    regulatory = float(role_data.get("regulatory_exposure", 0.6))
    
    bci = round(0.30 * strategic + 0.25 * revenue + 0.20 * blocking + 0.15 * spof + 0.10 * regulatory, 2)
    tier = "Tier 1" if bci > 0.70 else ("Tier 2" if bci >= 0.40 else "Tier 3")
    
    # 5B distribution defaults
    b5 = role_data.get("five_b_strategy") or {
        "build_pct": 50,
        "buy_pct": 30,
        "borrow_pct": 5,
        "bot_pct": 15,
        "bridge_pct": 0,
        "summary": "Build 50% + Buy 30% + Bot 15% + Borrow 5%"
    }

    new_role = {
        "future_role_id": role_id,
        "job_code": role_data.get("job_code") or f"RA-NEW-{len(_FUTURE_ROLES)+1:02d}",
        "role_title": role_data["role_title"],
        "dept": role_data.get("dept", "Engineering"),
        "org_unit_id": role_data.get("org_unit_id", "OU-004"),
        "job_family_id": role_data.get("job_family_id", "JF-03"),
        "career_level_id": role_data.get("career_level_id", "L4 Senior"),
        "strategy_driver_id": role_data.get("strategy_driver_id", "STR-001"),
        "strategy_driver_name": role_data.get("strategy_driver_name", "Corporate Transformation"),
        "current_role_id": role_data.get("current_role_id"),
        "role_purpose": role_data.get("role_purpose", "Drives enterprise capability expansion."),
        "key_responsibilities": role_data.get("key_responsibilities", ["Deliver roadmap targets"]),
        "qualifications_required": role_data.get("qualifications_required", ["Relevant degree or certifications"]),
        "min_years_experience": int(role_data.get("min_years_experience", 4)),
        "role_evolution_class": role_data.get("role_evolution_class", "Evolving"),
        "sunset_target_date": role_data.get("sunset_target_date"),
        "transition_target_role_ids": role_data.get("transition_target_role_ids", []),
        "business_criticality_index": bci,
        "criticality_tier": tier,
        "failure_impact_description": role_data.get("failure_impact_description", "Delays strategic roadmap delivery."),
        "target_cost_band_id": role_data.get("target_cost_band_id", "BAND-7"),
        "current_headcount": int(role_data.get("current_headcount", 3)),
        "feeder_role_ids": role_data.get("feeder_role_ids", []),
        "feeder_roles": role_data.get("feeder_roles", []),
        "skill_distance_to_feeders": float(role_data.get("skill_distance_to_feeders", 0.30)),
        "version": 1,
        "status": "Draft",
        "approved_by": approver,
        "approved_at": None,
        "role_skill_requirements": role_data.get("role_skill_requirements", []),
        "demand_lines": role_data.get("demand_lines", [
            {
                "demand_line_id": f"DMD-{uuid.uuid4().hex[:4].upper()}",
                "fiscal_year": "FY26",
                "demand_headcount_gross": int(role_data.get("target_headcount", 8)),
                "productivity_adjustment": -1,
                "demand_headcount_net": max(1, int(role_data.get("target_headcount", 8)) - 1),
                "attrition_rate_ttm": 0.12,
                "replacement_demand": 0.5,
                "net_new_demand": max(1, int(role_data.get("target_headcount", 8)) - int(role_data.get("current_headcount", 3))),
                "demand_basis": "Strategy-driven",
                "time_to_hire_days_external": 60,
                "time_to_productivity_days": 90,
                "mobilization_lead_time_days": 180,
                "confidence_level": 0.80,
                "assumption_notes": "Derived from strategy growth baseline."
            }
        ]),
        "five_b_strategy": b5,
        "build_cost_lkr": int(role_data.get("build_cost_lkr", 1200000)),
        "buy_cost_lkr": int(role_data.get("buy_cost_lkr", 2600000)),
        "cost_comparator": f"Build LKR {role_data.get('build_cost_lkr', 1200000)/1000000:.1f}M vs Buy LKR {role_data.get('buy_cost_lkr', 2600000)/1000000:.1f}M",
        "capability_gap_target": float(role_data.get("capability_gap_target", 0.30)),
        "gap_priority": "High" if bci > 0.70 else "Medium",
        "sourcing_risk": "High" if bci > 0.75 else "Medium",
        "gap": f"+{max(1, int(role_data.get('target_headcount', 8)) - int(role_data.get('current_headcount', 3)))}",
        "urgency": "HIGH" if bci > 0.70 else "MEDIUM"
    }

    _FUTURE_ROLES.insert(0, new_role)
    return new_role


def approve_role_status(role_id: str, new_status: str, approver: str = "CHRO") -> Optional[Dict[str, Any]]:
    role = get_future_role_detail(role_id)
    if not role:
        return None
    role["status"] = new_status
    if new_status == "Live":
        role["approved_by"] = approver
        role["approved_at"] = datetime.now(timezone.utc).isoformat()
    return role


def get_version_diff(role_id: str) -> Dict[str, Any]:
    role = get_future_role_detail(role_id)
    if not role:
        return {"error": "Role not found"}

    curr_version = role.get("version", 1)
    prev_version = max(1, curr_version - 1)

    return {
        "future_role_id": role["future_role_id"],
        "role_title": role["role_title"],
        "current_version": curr_version,
        "previous_version": prev_version,
        "status": role["status"],
        "diff_summary": [
            {
                "field": "Role Skill Requirements",
                "v_previous": "MLOps (Target 2), AWS (Target 2)",
                "v_current": "MLOps (Target 3), LLM Fine-Tuning (Target 4), AWS (Target 3)",
                "change": "Added Generative AI & raised MLOps target proficiency level"
            },
            {
                "field": "Business Criticality Index",
                "v_previous": "0.78 (Tier 1)",
                "v_current": f"{role['business_criticality_index']} ({role['criticality_tier']})",
                "change": "Elevated by +0.12 due to downstream dependency on retail AI algorithms"
            },
            {
                "field": "5B Fulfilment Strategy",
                "v_previous": "Build 40% / Buy 60%",
                "v_current": f"Build {role['five_b_strategy']['build_pct']}% / Buy {role['five_b_strategy']['buy_pct']}% / Bot {role['five_b_strategy']['bot_pct']}%",
                "change": "Introduced Bot automation offset (-2 FTE) and raised internal Build reskilling ratio"
            },
            {
                "field": "Build vs Buy Cost Target",
                "v_previous": "Buy-centric budget (LKR 3.2M)",
                "v_current": f"Build {role['build_cost_lkr']/1000000:.1f}M vs Buy {role['buy_cost_lkr']/1000000:.1f}M",
                "change": "Saved LKR 1.4M per position via targeted internal reskilling pathway"
            }
        ]
    }

from typing import List, Dict, Any

def run_causal_simulation(params: Dict[str, Any], historical_metrics: List[Dict[str, Any]], is_snapshot: bool = False) -> Dict[str, Any]:
    """
    Simulates the causal impact of organizational changes (headcount, salary, remote days, automation, business model, etc.)
    on core metrics (productivity, health, capacity, attrition, revenue, csat) over a 6-month period,
    along with Redundancy Forecasts, Critical Role Shifts, and Impact Matrices.
    """
    # Extract base parameters
    headcount_change = params.get("headcountChange", 0)
    salary_change = params.get("salaryChange", 0)
    remote_days = params.get("remoteDays", 2)
    training_budget = params.get("trainingBudget", 0)
    restructuring_level = params.get("restructuringLevel", 0)
    automation_level = params.get("automationLevel", 0)
    business_line_model = params.get("businessLineModel", "Standard Core")
    
    # Establish base metrics from the most recent historical month
    latest_month = historical_metrics[-1] if historical_metrics else {}
    base_productivity = latest_month.get("overall_productivity_score", 90)
    base_health = latest_month.get("enps", 50) + 40 # Mapping eNPS to a 0-100 scale roughly
    base_capacity = 100
    base_attrition = float(latest_month.get("voluntary_attrition_rate", 2.0)) * 4
    base_csat = float(latest_month.get("csat", 85.0))
    base_revenue = float(latest_month.get("revenue", 15000000)) / 1000000 # In Millions
    total_headcount = int(latest_month.get("total_headcount", 5000))

    # Business Model Multipliers
    model_revenue_mult = 1.0
    model_prod_mult = 1.0
    if business_line_model == "AI-Driven Digital Services":
        model_revenue_mult = 1.18
        model_prod_mult = 1.12
    elif business_line_model == "Enterprise SaaS Subscriptions":
        model_revenue_mult = 1.25
        model_prod_mult = 1.08
    elif business_line_model == "Global Offshore Hub":
        model_revenue_mult = 1.10
        model_prod_mult = 1.05

    simulation_results = []
    prefix = 'A_' if is_snapshot else ''
    
    # Generate 6 months of forecasted data
    for i in range(6):
        month_multiplier = (i + 1) * 0.2
        
        # Causal logic mapping (Direct and indirect effects including automation & model)
        prod_effect = ((headcount_change * 0.5) + ((remote_days - 2) * 1.5) + (training_budget * 1.2) + (automation_level * 0.35) - (restructuring_level * 1.5)) * model_prod_mult
        health_effect = (salary_change * 0.5) + ((remote_days - 2) * 2) + (training_budget * 0.5) - (headcount_change * 0.1) - (restructuring_level * 2.5) - (automation_level * 0.15)
        cap_effect = (headcount_change * 2) + (automation_level * 0.8) - (restructuring_level * 1.2) + (training_budget * 0.5)
        attrition_effect = -(salary_change * 0.8) - ((remote_days - 2) * 2) - (training_budget * 0.4) + (headcount_change * 0.3) + (restructuring_level * 3.5) + (automation_level * 0.1)
        
        # Cascading secondary effects
        rev_effect = ((cap_effect * 0.45) - (attrition_effect * 0.25) + (automation_level * 0.3) - (restructuring_level * 1.5)) * model_revenue_mult
        csat_effect = (health_effect * 0.3) - (attrition_effect * 0.4) + (training_budget * 0.2) + (automation_level * 0.2)
        
        # Apply bounds
        productivity = max(0, min(100, base_productivity + prod_effect * month_multiplier))
        org_health = max(0, min(100, base_health + health_effect * month_multiplier))
        capacity = max(0, base_capacity + cap_effect * month_multiplier)
        attrition = max(0, min(100, base_attrition + attrition_effect * month_multiplier))
        revenue = max(0, base_revenue + rev_effect * month_multiplier)
        csat = max(0, min(100, base_csat + csat_effect * month_multiplier))
        
        # Append to results
        result_point = {
            "month": f"Month {i + 1}",
            f"{prefix}productivity": round(productivity, 2),
            f"{prefix}orgHealth": round(org_health, 2),
            f"{prefix}capacity": round(capacity, 2),
            f"{prefix}attrition": round(attrition, 2),
            f"{prefix}revenue": round(revenue, 2),
            f"{prefix}csat": round(csat, 2)
        }
        simulation_results.append(result_point)

    # 1. Redundancy Forecast Calculation
    automation_displacement_rate = (automation_level * 0.0025) + (restructuring_level * 0.008)
    potential_redundant_roles = int(total_headcount * automation_displacement_rate)
    retraining_capacity_pct = min(95, int(training_budget * 1.8 + 25))
    net_redundant_positions = max(0, potential_redundant_roles - int(potential_redundant_roles * (retraining_capacity_pct / 100)))
    estimated_payroll_savings_m = round((net_redundant_positions * 75000) / 1000000, 2)

    redundancy_forecast = {
        "potential_redundant_roles": potential_redundant_roles,
        "retraining_capacity_pct": retraining_capacity_pct,
        "net_redundant_positions": net_redundant_positions,
        "estimated_payroll_savings_m": estimated_payroll_savings_m,
        "automation_exposure_index": round(min(100, automation_level * 1.1 + restructuring_level * 3), 1)
    }

    # 2. Critical Role Shifts Calculation
    critical_role_shifts = [
        {
            "from_role": "Tier 1 Support Agent",
            "to_role": "AI Workflow Supervisor",
            "exposure": f"{min(95, int(50 + automation_level * 0.45))}%",
            "shift_pct": f"+{min(60, int(15 + automation_level * 0.4))}%",
            "difficulty": "Medium",
            "category": "Customer Ops"
        },
        {
            "from_role": "Manual Quality Analyst",
            "to_role": "Automation Engineer",
            "exposure": f"{min(95, int(60 + automation_level * 0.35))}%",
            "shift_pct": f"+{min(70, int(20 + automation_level * 0.5))}%",
            "difficulty": "Low",
            "category": "Engineering"
        },
        {
            "from_role": "Routine Data Entry Clerk",
            "to_role": "Data Quality Steward",
            "exposure": f"{min(98, int(70 + automation_level * 0.3))}%",
            "shift_pct": f"-{max(10, int(45 - training_budget * 0.4))}%",
            "difficulty": "High",
            "category": "Operations"
        },
        {
            "from_role": "Legacy System Admin",
            "to_role": "Cloud Platform Architect",
            "exposure": f"{min(85, int(40 + restructuring_level * 4))}%",
            "shift_pct": f"+{min(50, int(10 + restructuring_level * 3.5))}%",
            "difficulty": "Medium",
            "category": "IT Infra"
        }
    ]

    # 3. Impact Matrix Calculation (2D heatmap grid)
    impact_matrix = [
        {
            "parameter": "Headcount Adjustment",
            "productivity": 3 if headcount_change > 0 else -3,
            "capacity": 5 if headcount_change > 0 else -5,
            "attrition": 2 if headcount_change < 0 else -1,
            "revenue": 4 if headcount_change > 0 else -3,
            "csat": 3 if headcount_change > 0 else -4,
            "redundancy": -4 if headcount_change > 0 else 4
        },
        {
            "parameter": "Automation Plan",
            "productivity": min(5, max(1, int(automation_level / 15))),
            "capacity": min(5, max(1, int(automation_level / 12))),
            "attrition": min(4, max(-1, int(automation_level / 25))),
            "revenue": min(5, max(0, int(automation_level / 16))),
            "csat": min(4, max(0, int(automation_level / 20))),
            "redundancy": min(5, max(0, int(automation_level / 15)))
        },
        {
            "parameter": "Org Restructuring",
            "productivity": -min(5, int(restructuring_level / 2)),
            "capacity": -min(4, int(restructuring_level / 2.5)),
            "attrition": min(5, int(restructuring_level / 2)),
            "revenue": -min(4, int(restructuring_level / 3)),
            "csat": -min(4, int(restructuring_level / 2.5)),
            "redundancy": min(5, int(restructuring_level / 2))
        },
        {
            "parameter": "Training & Upskilling",
            "productivity": min(5, int(training_budget / 10)),
            "capacity": min(4, int(training_budget / 12)),
            "attrition": -min(5, int(training_budget / 8)),
            "revenue": min(4, int(training_budget / 15)),
            "csat": min(5, int(training_budget / 10)),
            "redundancy": -min(5, int(training_budget / 8))
        },
        {
            "parameter": "Business Line Model",
            "productivity": 4 if business_line_model != "Standard Core" else 0,
            "capacity": 3 if business_line_model != "Standard Core" else 0,
            "attrition": 1 if business_line_model != "Standard Core" else 0,
            "revenue": 5 if business_line_model != "Standard Core" else 0,
            "csat": 4 if business_line_model != "Standard Core" else 0,
            "redundancy": 2 if business_line_model != "Standard Core" else 0
        }
    ]
        
    return {
        "monthly_series": simulation_results,
        "redundancy_forecast": redundancy_forecast,
        "critical_role_shifts": critical_role_shifts,
        "impact_matrix": impact_matrix
    }


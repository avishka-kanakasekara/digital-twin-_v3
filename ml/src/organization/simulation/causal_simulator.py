from typing import List, Dict, Any

def run_causal_simulation(params: Dict[str, Any], historical_metrics: List[Dict[str, Any]], is_snapshot: bool = False) -> List[Dict[str, Any]]:
    """
    Simulates the causal impact of organizational changes (headcount, salary, remote days, etc.)
    on core metrics (productivity, health, capacity, attrition, revenue, csat) over a 6-month period.
    """
    # Extract base parameters
    headcount_change = params.get("headcountChange", 0)
    salary_change = params.get("salaryChange", 0)
    remote_days = params.get("remoteDays", 2)
    training_budget = params.get("trainingBudget", 0)
    restructuring_level = params.get("restructuringLevel", 0)
    
    # Establish base metrics from the most recent historical month
    latest_month = historical_metrics[-1] if historical_metrics else {}
    base_productivity = latest_month.get("overall_productivity_score", 90)
    base_health = latest_month.get("enps", 50) + 40 # Mapping eNPS to a 0-100 scale roughly
    base_capacity = 100
    base_attrition = float(latest_month.get("voluntary_attrition_rate", 2.0)) * 4
    base_csat = float(latest_month.get("csat", 85.0))
    base_revenue = float(latest_month.get("revenue", 15000000)) / 1000000 # In Millions
    
    simulation_results = []
    prefix = 'A_' if is_snapshot else ''
    
    # Generate 6 months of forecasted data
    for i in range(6):
        month_multiplier = (i + 1) * 0.2
        
        # Causal logic mapping (Direct and indirect effects)
        prod_effect = (headcount_change * 0.5) + ((remote_days - 2) * 1.5) + (training_budget * 1.2) - (restructuring_level * 2)
        health_effect = (salary_change * 0.5) + ((remote_days - 2) * 2) + (training_budget * 0.5) - (headcount_change * 0.1) - (restructuring_level * 3)
        cap_effect = (headcount_change * 2) - (restructuring_level * 1.5) + (training_budget * 0.5)
        attrition_effect = -(salary_change * 0.8) - ((remote_days - 2) * 2) - (training_budget * 0.4) + (headcount_change * 0.3) + (restructuring_level * 4)
        
        # Cascading secondary effects (e.g., lower capacity and higher attrition hurt revenue)
        rev_effect = (cap_effect * 0.4) - (attrition_effect * 0.3) - (restructuring_level * 2)
        csat_effect = (health_effect * 0.3) - (attrition_effect * 0.5) + (training_budget * 0.2)
        
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
        
    return simulation_results

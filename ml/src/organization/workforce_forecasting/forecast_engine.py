import math
import os
import pandas as pd
import joblib
import numpy as np

# Load the trained model once globally to avoid reloading on every request
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "attrition_rf_model.pkl")

# Initialize global model variable
attrition_model = None
if os.path.exists(MODEL_PATH):
    attrition_model = joblib.load(MODEL_PATH)

def forecast_headcount_loss(current_headcount: int, average_burnout_score: float = 65.0, comp_ratio: float = 1.0, industry_demand: float = 70.0, average_tenure: float = 4.5, planned_retirements: int = 0) -> int:
    """
    Project expected headcount loss based on attrition and known retirements.
    Uses the trained Random Forest Regressor to predict attrition count.
    """
    global attrition_model
    
    # If model isn't loaded (e.g. file missing), fallback to basic math
    if attrition_model is None:
        expected_attrition = current_headcount * 0.085
        return math.ceil(expected_attrition + planned_retirements)
        
    # Prepare features for the model
    features = pd.DataFrame([{
        "current_headcount": current_headcount,
        "average_burnout_score": average_burnout_score,
        "comp_ratio": comp_ratio,
        "industry_demand": industry_demand,
        "average_tenure_years": average_tenure
    }])
    
    # Predict attrition using the ML model
    predicted_attrition = attrition_model.predict(features)[0]
    
    # Ensure it's not negative
    predicted_attrition = max(0, predicted_attrition)
    
    # Total projected loss
    return math.ceil(predicted_attrition + planned_retirements)

def rank_skill_shortages(skill_inventory: dict, growth_target: float, current_headcount: int, projected_loss: int) -> list:
    """
    Calculate the gap for each skill and rank them by urgency.
    
    skill_inventory format:
    {
        "Cloud Engineer": {"count": 12, "dept": "Engineering", "core_skill": "AWS / Kubernetes"},
        "Account Executive": {"count": 25, "dept": "Sales", "core_skill": "Enterprise Sales"},
        ...
    }
    """
    shortages = []
    
    # Calculate required headcount based on growth target
    future_required_headcount = math.ceil(current_headcount * (1 + (growth_target / 100.0)))
    
    # The organization needs (future_required_headcount), but will have (current_headcount - projected_loss)
    # The total gap is distributed across roles based on current proportions (simplified assumption)
    
    for role, data in skill_inventory.items():
        current_role_count = data["count"]
        # Proportion of this role in the current workforce
        proportion = current_role_count / max(1, current_headcount)
        
        # Future required for this role
        required_role_count = math.ceil(future_required_headcount * proportion)
        
        # Expected remaining for this role (assuming loss is proportional)
        expected_remaining = math.floor(current_role_count - (projected_loss * proportion))
        
        gap = required_role_count - expected_remaining
        
        if gap > 0:
            urgency = "HIGH" if gap > 5 else "MEDIUM"
            if gap < 2:
                urgency = "LOW"
                
            shortages.append({
                "role": role,
                "skill": data.get("core_skill", "General"),
                "dept": data.get("dept", "General"),
                "gap": -gap, # Negative denotes shortage
                "urgency": urgency
            })
            
    # Sort by the largest gap (most negative)
    shortages.sort(key=lambda x: x["gap"])
    
    return shortages

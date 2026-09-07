import os
import pandas as pd
import numpy as np
import random

def synthesize_attrition_data(num_records=1000, output_path="historical_attrition_data.csv"):
    """
    Generate synthetic monthly workforce attrition data.
    Features:
    - current_headcount
    - average_burnout_score (0 to 100)
    - comp_ratio (0.8 to 1.2) - compensation compared to market
    - industry_demand (0 to 100) - external demand for these skills
    - average_tenure_years
    Target:
    - actual_attrition_count
    """
    np.random.seed(42)
    random.seed(42)

    data = []
    
    for _ in range(num_records):
        headcount = np.random.randint(50, 500)
        burnout = np.random.normal(loc=65, scale=15)
        burnout = max(0, min(100, burnout))
        comp_ratio = np.random.normal(loc=1.0, scale=0.1)
        industry_demand = np.random.normal(loc=70, scale=20)
        industry_demand = max(0, min(100, industry_demand))
        tenure = np.random.normal(loc=4.5, scale=2.0)
        tenure = max(0.5, tenure)
        
        # Attrition is driven by: high burnout, low comp, high external demand, low tenure
        attrition_prob = 0.05 # base 5%
        
        if burnout > 80:
            attrition_prob += 0.04
        if comp_ratio < 0.9:
            attrition_prob += 0.03
        if industry_demand > 80:
            attrition_prob += 0.02
        if tenure < 2.0:
            attrition_prob += 0.02
            
        # Add some noise
        attrition_prob += np.random.normal(0, 0.01)
        attrition_prob = max(0.01, min(0.30, attrition_prob))
        
        attrition_count = int(headcount * attrition_prob)
        
        data.append({
            "current_headcount": headcount,
            "average_burnout_score": round(burnout, 2),
            "comp_ratio": round(comp_ratio, 2),
            "industry_demand": round(industry_demand, 2),
            "average_tenure_years": round(tenure, 2),
            "actual_attrition_count": attrition_count
        })

    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"✅ Generated synthetic dataset with {num_records} records at {output_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(current_dir, "historical_attrition_data.csv")
    synthesize_attrition_data(num_records=2500, output_path=output_file)

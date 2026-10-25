"""
Strategy Role Architect - 5B Fulfilment & Capacity ML Training Pipeline
Reference Architecture Edition (ADL September 2026 Specification).

Predicts optimal 5B workforce fulfillment allocation (Build, Buy, Borrow, Bot, Bridge)
based on role criticality, skill distance to feeders, market scarcity, automation gain,
and role evolution class.
"""

import os
import sys
import json

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "strategy_5b_model.pkl")
META_PATH = os.path.join(CURRENT_DIR, "model_meta.json")
EXCEL_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../../../../Organization_Twin_Dummy_Data_M1-M9.xlsx"))

EVOLUTION_MAP = {
    "Emerging": 0,
    "Evolving": 1,
    "Stable": 2,
    "Declining-Sunsetting": 3,
    "Declining": 3
}

TIER_MAP = {
    "Tier 1": 1,
    "Tier 2": 2,
    "Tier 3": 3
}

LEVEL_MAP = {
    "L1": 1, "L1 Associate": 1,
    "L2": 2, "L2 Specialist": 2,
    "L3": 3, "L3 Mid": 3,
    "L4": 4, "L4 Senior": 4,
    "L5": 5, "L5 Staff": 5, "L5 Lead": 5,
    "L6": 6, "L6 Principal": 6,
    "L7": 7, "L7 Executive": 7
}

FEATURE_COLUMNS = [
    "skill_distance_to_feeders",
    "business_criticality_index",
    "current_headcount",
    "target_headcount_demand",
    "market_scarcity_index",
    "workforce_growth_pct",
    "expected_productivity_gain_pct",
    "evolution_class_idx",
    "criticality_tier_idx",
    "career_level_idx"
]

TARGET_COLUMNS = [
    "build_pct",
    "buy_pct",
    "borrow_pct",
    "bot_pct",
    "bridge_pct"
]


def generate_training_data(n_samples=1500, random_seed=42):
    """
    Synthesize enterprise workforce dataset consistent with ADL Section 1.6 rules:
    - Build: Trainable route, low skill distance to feeders (distance < 0.40)
    - Buy: Emerging skills, high external market supply or urgent lead time
    - Borrow: Specialized niche, short-term lead time gap
    - Bot: High expected productivity gain from technology roadmap
    - Bridge: Declining / sunsetting roles with direct redeployment paths
    """
    np.random.seed(random_seed)
    records = []

    for _ in range(n_samples):
        evo_class = np.random.choice(["Emerging", "Evolving", "Stable", "Declining-Sunsetting"], p=[0.25, 0.45, 0.18, 0.12])
        tier = np.random.choice(["Tier 1", "Tier 2", "Tier 3"], p=[0.40, 0.40, 0.20])
        level_str = np.random.choice(["L1", "L2", "L3", "L4", "L5", "L6"], p=[0.1, 0.2, 0.3, 0.25, 0.1, 0.05])
        
        evo_idx = EVOLUTION_MAP[evo_class]
        tier_idx = TIER_MAP[tier]
        level_idx = LEVEL_MAP[level_str]

        bci = float(np.clip(np.random.normal(0.85 if tier == "Tier 1" else 0.55 if tier == "Tier 2" else 0.30, 0.10), 0.10, 0.99))
        growth_pct = float(np.clip(np.random.normal(0.30, 0.18), -0.30, 1.20))
        prod_gain = float(np.clip(np.random.normal(0.18, 0.08), 0.05, 0.40))
        scarcity = float(np.clip(np.random.normal(0.65 if tier == "Tier 1" else 0.45, 0.15), 0.10, 0.95))

        if evo_class == "Declining-Sunsetting":
            cur_hc = int(np.random.randint(5, 30))
            target_hc = int(max(0, cur_hc - np.random.randint(4, cur_hc + 1)))
            skill_dist = float(np.clip(np.random.uniform(0.40, 0.90), 0.1, 0.95))
            
            # Ground truth targets for sunsetting
            bridge = float(np.clip(np.random.normal(70, 10), 50, 90))
            bot = float(np.clip(np.random.normal(25, 8), 10, 40))
            build = float(np.clip(100 - bridge - bot, 0, 15))
            buy = 0.0
            borrow = 0.0
            
        elif evo_class == "Emerging":
            cur_hc = int(np.random.choice([0, 1, 2]))
            target_hc = int(cur_hc + np.random.randint(4, 16))
            skill_dist = float(np.clip(np.random.uniform(0.60, 0.95), 0.3, 1.0))
            
            buy = float(np.clip(np.random.normal(50, 10), 30, 70))
            build = float(np.clip(np.random.normal(25, 8), 10, 45))
            borrow = float(np.clip(np.random.normal(12, 5), 0, 25))
            bot = float(np.clip(np.random.normal(prod_gain * 60, 5), 5, 20))
            bridge = 0.0
            
        else: # Evolving or Stable
            cur_hc = int(np.random.randint(3, 15))
            target_hc = int(cur_hc + np.random.randint(1, 10))
            skill_dist = float(np.clip(np.random.uniform(0.15, 0.45), 0.05, 0.60))
            
            build = float(np.clip(np.random.normal(60, 10), 40, 80))
            buy = float(np.clip(np.random.normal(25, 8), 10, 40))
            bot = float(np.clip(np.random.normal(prod_gain * 70, 5), 5, 25))
            borrow = float(np.clip(100 - build - buy - bot, 0, 15))
            bridge = 0.0

        # Normalize to sum to 100%
        raw_sum = build + buy + borrow + bot + bridge
        build = round((build / raw_sum) * 100, 1)
        buy = round((buy / raw_sum) * 100, 1)
        borrow = round((borrow / raw_sum) * 100, 1)
        bot = round((bot / raw_sum) * 100, 1)
        bridge = round(100.0 - (build + buy + borrow + bot), 1)

        records.append({
            "skill_distance_to_feeders": round(skill_dist, 3),
            "business_criticality_index": round(bci, 3),
            "current_headcount": cur_hc,
            "target_headcount_demand": target_hc,
            "market_scarcity_index": round(scarcity, 3),
            "workforce_growth_pct": round(growth_pct, 3),
            "expected_productivity_gain_pct": round(prod_gain, 3),
            "evolution_class_idx": evo_idx,
            "criticality_tier_idx": tier_idx,
            "career_level_idx": level_idx,
            "build_pct": build,
            "buy_pct": buy,
            "borrow_pct": borrow,
            "bot_pct": bot,
            "bridge_pct": bridge
        })

    return pd.DataFrame(records)


def train_and_save_model():
    print("🚀 Initializing Strategy Role Architect ML Pipeline...")
    
    # 1. Generate / Prepare Data
    df = generate_training_data(n_samples=1600, random_seed=42)
    print(f"📊 Dataset prepared with {len(df)} enterprise role scenarios.")
    
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMNS]
    
    # 2. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"✂️  Split into {len(X_train)} training and {len(X_test)} evaluation records.")
    
    # 3. Model Training: Multi-output Random Forest Regressor
    print("🧠 Training Multi-Output Random Forest Regressor...")
    model = RandomForestRegressor(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # 4. Evaluation
    preds = model.predict(X_test)
    mae_per_target = mean_absolute_error(y_test, preds, multioutput="raw_values")
    r2_per_target = r2_score(y_test, preds, multioutput="raw_values")
    overall_mae = mean_absolute_error(y_test, preds)
    overall_r2 = r2_score(y_test, preds)
    
    print("\n📈 Model Evaluation Results:")
    print(f"   Overall MAE: {overall_mae:.2f}% | Overall R²: {overall_r2:.3f}")
    for target_name, mae_val, r2_val in zip(TARGET_COLUMNS, mae_per_target, r2_per_target):
        print(f"   - {target_name:12s}: MAE = {mae_val:.2f}% | R² = {r2_val:.3f}")
        
    # 5. Save Artifacts
    joblib.dump(model, MODEL_PATH)
    print(f"\n💾 Model successfully persisted to: {MODEL_PATH}")
    
    meta = {
        "model_type": "MultiOutput RandomForestRegressor",
        "n_estimators": 120,
        "max_depth": 12,
        "features": FEATURE_COLUMNS,
        "targets": TARGET_COLUMNS,
        "overall_mae": round(overall_mae, 3),
        "overall_r2": round(overall_r2, 3),
        "target_metrics": {
            t: {"mae": round(m, 3), "r2": round(r, 3)}
            for t, m, r in zip(TARGET_COLUMNS, mae_per_target, r2_per_target)
        }
    }
    
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"📄 Model metadata saved to: {META_PATH}")
    print("✅ Strategy Role Architect ML training completed successfully!")


if __name__ == "__main__":
    train_and_save_model()

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Features
    # 1. hours_worked_per_week: normal around 40, some outliers working 60+
    hours_worked = np.random.normal(loc=45, scale=8, size=num_samples)
    hours_worked = np.clip(hours_worked, 30, 80)
    
    # 2. tenure_months: uniform from 1 to 120
    tenure_months = np.random.randint(1, 120, size=num_samples)
    
    # 3. performance_score: 1.0 to 5.0
    performance_score = np.random.normal(loc=3.5, scale=0.8, size=num_samples)
    performance_score = np.clip(performance_score, 1.0, 5.0)
    
    # 4. last_1_on_1_days: 1 to 90 days
    last_1_on_1_days = np.random.randint(1, 90, size=num_samples)
    
    # Target 1: burnout_probability (0.0 to 1.0)
    # High hours + long time since 1-on-1 = higher burnout
    burnout_base = (hours_worked - 40) / 40.0 + (last_1_on_1_days / 90.0) * 0.5
    burnout_prob = burnout_base + np.random.normal(0, 0.1, size=num_samples)
    burnout_prob = np.clip(burnout_prob, 0.05, 0.95)
    
    # Target 2: career_stagnation_score (0.0 to 1.0)
    # High tenure + average/low performance = higher stagnation
    stagnation_base = (tenure_months / 120.0) - (performance_score / 5.0) * 0.5
    stagnation_score = stagnation_base + np.random.normal(0.5, 0.1, size=num_samples)
    stagnation_score = np.clip(stagnation_score, 0.05, 0.95)
    
    df = pd.DataFrame({
        'hours_worked': hours_worked,
        'tenure_months': tenure_months,
        'performance_score': performance_score,
        'last_1_on_1_days': last_1_on_1_days,
        'burnout_probability': burnout_prob,
        'career_stagnation_score': stagnation_score
    })
    
    return df

def train_and_save_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data(2000)
    
    X = df[['hours_worked', 'tenure_months', 'performance_score', 'last_1_on_1_days']]
    y = df[['burnout_probability', 'career_stagnation_score']]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Performance:")
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"R² Score: {r2:.4f}")
    
    # Save model
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'risk_model.joblib')
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()

import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def train_and_save_model():
    """
    Train a Random Forest Regressor to predict actual_attrition_count.
    """
    print("🚀 Starting ML Training Pipeline...")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "historical_attrition_data.csv")
    model_dir = current_dir

    
    # 1. Load Data
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data file not found at {data_path}")
    
    df = pd.read_csv(data_path)
    print(f"📊 Loaded dataset with {len(df)} records.")
    
    # 2. Prepare Features (X) and Target (y)
    X = df.drop(columns=["actual_attrition_count"])
    y = df["actual_attrition_count"]
    
    # 3. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"✂️  Data split into {len(X_train)} training and {len(X_test)} testing records.")
    
    # 4. Initialize and Train Model
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    print("🧠 Training Random Forest Regressor...")
    model.fit(X_train, y_train)
    
    # 5. Evaluate Model
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    print(f"📈 Evaluation metrics:")
    print(f"   - Mean Absolute Error (MAE): {mae:.2f} employees")
    print(f"   - R-squared (R2 Score): {r2:.3f}")
    
    # 6. Save Model
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "attrition_rf_model.pkl")
    joblib.dump(model, model_path)
    print(f"✅ Model successfully saved to: {model_path}")

if __name__ == "__main__":
    train_and_save_model()

import os
import sys
import csv
from pathlib import Path

# Add the backend directory to sys.path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import get_db

def seed_workforce_data():
    sb = get_db()
    
    mock_csv_dir = backend_dir.parent / "mock_data" / "csv"
    departments_csv = mock_csv_dir / "departments.csv"
    org_metrics_csv = mock_csv_dir / "organization_history.csv"
    
    # 1. Seed Departments
    if departments_csv.exists():
        print(f"Reading departments from {departments_csv}")
        with open(departments_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            dept_data = []
            for row in reader:
                # Convert string to appropriate types
                dept_data.append({
                    "id": row["id"],
                    "name": row["name"],
                    "region": row["region"],
                    "function": row["function"],
                    "headcount": int(row["headcount"]),
                    "open_positions": int(row["openPositions"]),
                    "allocated_budget": float(row["allocatedBudget"]),
                    "actual_spend": float(row["actualSpend"]),
                    "performance_score": int(row["performanceScore"]),
                    "target_score": int(row["targetScore"]),
                    "enps": int(row["eNPS"]),
                    "attrition_rate": float(row["attritionRate"]),
                    "risk_level": row["riskLevel"]
                })
        if dept_data:
            print("Clearing existing departments...")
            sb.db.execute("DELETE FROM departments")
            print(f"Inserting {len(dept_data)} departments...")
            sb.table("departments").insert(dept_data).execute()
            print("Departments seeded successfully.")
    else:
        print(f"Warning: {departments_csv} not found.")

    # 2. Seed Organization Metrics
    if org_metrics_csv.exists():
        print(f"Reading organization metrics from {org_metrics_csv}")
        with open(org_metrics_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            metrics_data = []
            for row in reader:
                metrics_data.append({
                    "id": row["id"],
                    "month": row["month"],
                    "date": row["date"],
                    "total_headcount": int(row["totalHeadcount"]),
                    "voluntary_attrition_rate": float(row["voluntaryAttritionRate"]),
                    "involuntary_attrition_rate": float(row["involuntaryAttritionRate"]),
                    "new_hires": int(row["newHires"]),
                    "open_positions": int(row["openPositions"]),
                    "enps": int(row["eNPS"]),
                    "training_hours_per_employee": float(row["trainingHoursPerEmployee"]),
                    "absenteeism_rate": float(row["absenteeismRate"]),
                    "revenue": float(row["revenue"]),
                    "operating_cost": float(row["operatingCost"]),
                    "ebitda": float(row["ebitda"]),
                    "net_profit": float(row["netProfit"]),
                    "marketing_spend": float(row["marketingSpend"]),
                    "rd_spend": float(row["rdSpend"]),
                    "overall_productivity_score": int(row["overallProductivityScore"]),
                    "csat": float(row["csat"]),
                    "nps": int(row["nps"]),
                    "market_share_percentage": float(row["marketSharePercentage"]),
                    "project_completion_rate": float(row["projectCompletionRate"]),
                    "carbon_footprint_tons": int(row["carbonFootprintTons"]),
                    "energy_consumption_kwh": int(row["energyConsumptionKwh"]),
                    "compliance_score": int(row["complianceScore"]),
                    "security_incidents": int(row["securityIncidents"]),
                    "anomaly_flag": row["anomalyFlag"] if row["anomalyFlag"] else None
                })
        if metrics_data:
            print("Clearing existing organization metrics...")
            sb.db.execute("DELETE FROM organization_metrics")
            print(f"Inserting {len(metrics_data)} organization metrics...")
            sb.table("organization_metrics").insert(metrics_data).execute()
            print("Organization metrics seeded successfully.")
    else:
        print(f"Warning: {org_metrics_csv} not found.")

if __name__ == "__main__":
    seed_workforce_data()

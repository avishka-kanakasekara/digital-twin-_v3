import csv
import os
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.organization import OrganizationMetric, OrganizationScenario

# Paths to CSV files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORY_CSV = os.path.join(BASE_DIR, "mock_data", "csv", "organization_history.csv")
SIMULATIONS_CSV = os.path.join(BASE_DIR, "mock_data", "csv", "simulations.csv")

def seed_metrics(db: Session):
    if not os.path.exists(HISTORY_CSV):
        print(f"Error: {HISTORY_CSV} not found.")
        return
        
    print("Seeding organization_metrics...")
    with open(HISTORY_CSV, mode="r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        count = 0
        for row in reader:
            metric = OrganizationMetric(
                month=row["month"],
                date=row["date"],
                total_headcount=int(row["totalHeadcount"]),
                voluntary_attrition_rate=float(row["voluntaryAttritionRate"]),
                involuntary_attrition_rate=float(row["involuntaryAttritionRate"]),
                new_hires=int(row["newHires"]),
                open_positions=int(row["openPositions"]),
                enps=int(row["eNPS"]),
                training_hours_per_employee=float(row["trainingHoursPerEmployee"]),
                absenteeism_rate=float(row["absenteeismRate"]),
                revenue=float(row["revenue"]),
                operating_cost=float(row["operatingCost"]),
                ebitda=float(row["ebitda"]),
                net_profit=float(row["netProfit"]),
                marketing_spend=float(row["marketingSpend"]),
                rd_spend=float(row["rdSpend"]),
                overall_productivity_score=int(row["overallProductivityScore"]),
                csat=float(row["csat"]),
                nps=int(row["nps"]),
                market_share_percentage=float(row["marketSharePercentage"]),
                project_completion_rate=float(row["projectCompletionRate"]),
                carbon_footprint_tons=float(row["carbonFootprintTons"]),
                energy_consumption_kwh=float(row["energyConsumptionKwh"]),
                compliance_score=int(row["complianceScore"]),
                security_incidents=int(row["securityIncidents"]),
                anomaly_flag=row["anomalyFlag"]
            )
            db.add(metric)
            count += 1
        db.commit()
        print(f"Successfully added {count} records to organization_metrics.")

def seed_scenarios(db: Session):
    if not os.path.exists(SIMULATIONS_CSV):
        print(f"Error: {SIMULATIONS_CSV} not found.")
        return
        
    print("Seeding organization_scenarios...")
    with open(SIMULATIONS_CSV, mode="r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        count = 0
        for row in reader:
            scenario = OrganizationScenario(
                scenario_name=row["scenarioName"],
                target_metric=row["targetMetric"],
                predicted_impact_percentage=float(row["predictedImpactPercentage"]),
                predicted_roi=float(row["predictedROI"]),
                confidence_level=int(row["confidenceLevel"]),
                time_to_impact_months=int(row["timeToRealizeMonths"]),
                ai_recommendation=f"Status: {row['status']}"
            )
            db.add(scenario)
            count += 1
        db.commit()
        print(f"Successfully added {count} records to organization_scenarios.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(OrganizationMetric).first()
        if existing:
            print("Database already seeded with Organization data. Skipping.")
        else:
            seed_metrics(db)
            seed_scenarios(db)
            print("Seeding complete!")
    finally:
        db.close()

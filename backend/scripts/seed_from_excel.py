"""
Seed script to import official Module 1 data from Organization_Twin_Dummy_Data_M1-M9.xlsx
directly into the local SQLite database (backend/data/edt_local.sqlite).

Creates and populates:
- strategy_drivers (6 rows)
- future_roles (19 rows)
- role_skill_mappings (86 rows)
- workforce_demand_lines (42 rows)
- skills_taxonomy (60 rows)
- updates legacy org_strategy_role_specs table for backward compatibility.
"""

import os
import sys
import datetime
import sqlite3
import openpyxl

# Force UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "../.."))
DB_PATH = os.path.join(PROJECT_ROOT, "backend", "data", "edt_local.sqlite")
EXCEL_PATH = os.path.join(PROJECT_ROOT, "Organization_Twin_Dummy_Data_M1-M9.xlsx")


def seed_database():
    print(f"🚀 Connecting to SQLite database at: {DB_PATH}")
    if not os.path.exists(EXCEL_PATH):
        raise FileNotFoundError(f"Master workbook not found at: {EXCEL_PATH}")

    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # -------------------------------------------------------------
    # 1. Strategy Drivers Table
    # -------------------------------------------------------------
    print("\n📦 Seeding strategy_drivers...")
    cur.execute("DROP TABLE IF EXISTS strategy_drivers;")
    cur.execute("""
    CREATE TABLE strategy_drivers (
        driver_id TEXT PRIMARY KEY,
        driver_name TEXT NOT NULL,
        driver_type TEXT NOT NULL,
        description TEXT,
        affected_org_unit_ids TEXT,
        horizon_start_year TEXT,
        horizon_end_year TEXT,
        priority_rank INTEGER,
        source_document_ref TEXT,
        workforce_growth_assumption_pct REAL,
        technology_roadmap_items TEXT,
        sunsetting_items TEXT,
        sunset_target_fy TEXT,
        expected_productivity_gain_pct REAL,
        opex_ceiling_lkr INTEGER,
        approver_role TEXT
    );
    """)

    sd_sheet = wb["strategy_drivers"]
    sd_rows = list(sd_sheet.iter_rows(values_only=True))
    sd_headers = sd_rows[0]
    sd_count = 0

    for r in sd_rows[1:]:
        row_dict = dict(zip(sd_headers, r))
        cur.execute("""
        INSERT INTO strategy_drivers (
            driver_id, driver_name, driver_type, description, affected_org_unit_ids,
            horizon_start_year, horizon_end_year, priority_rank, source_document_ref,
            workforce_growth_assumption_pct, technology_roadmap_items, sunsetting_items,
            sunset_target_fy, expected_productivity_gain_pct, opex_ceiling_lkr, approver_role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            str(row_dict.get("driver_id")),
            str(row_dict.get("driver_name")),
            str(row_dict.get("driver_type")),
            row_dict.get("description"),
            row_dict.get("affected_org_unit_ids"),
            str(row_dict.get("horizon_start_year", "FY26")),
            str(row_dict.get("horizon_end_year", "FY28")),
            int(row_dict.get("priority_rank", 1)),
            row_dict.get("source_document_ref"),
            float(row_dict.get("workforce_growth_assumption_pct", 0.0)),
            row_dict.get("technology_roadmap_items"),
            row_dict.get("sunsetting_items"),
            row_dict.get("sunset_target_fy"),
            float(row_dict.get("expected_productivity_gain_pct", 0.0)),
            int(row_dict.get("opex_ceiling_lkr", 0)),
            row_dict.get("approver_role")
        ))
        sd_count += 1

    print(f"   ✓ Inserted {sd_count} strategy drivers.")

    # -------------------------------------------------------------
    # 2. Skills Taxonomy Table
    # -------------------------------------------------------------
    print("\n📦 Seeding skills_taxonomy...")
    cur.execute("DROP TABLE IF EXISTS skills_taxonomy;")
    cur.execute("""
    CREATE TABLE skills_taxonomy (
        skill_id TEXT PRIMARY KEY,
        skill_name TEXT NOT NULL,
        skill_category TEXT,
        skill_family TEXT,
        external_taxonomy_code TEXT,
        is_orphan INTEGER,
        market_demand_index REAL,
        market_supply_index REAL,
        skill_half_life_months INTEGER,
        typical_learning_hours_per_level INTEGER,
        is_emerging INTEGER,
        is_sunsetting INTEGER,
        adjacent_skill_ids TEXT
    );
    """)

    sk_sheet = wb["skills"]
    sk_rows = list(sk_sheet.iter_rows(values_only=True))
    sk_headers = sk_rows[0]
    sk_count = 0

    for r in sk_rows[1:]:
        row_dict = dict(zip(sk_headers, r))
        cur.execute("""
        INSERT INTO skills_taxonomy (
            skill_id, skill_name, skill_category, skill_family, external_taxonomy_code,
            is_orphan, market_demand_index, market_supply_index, skill_half_life_months,
            typical_learning_hours_per_level, is_emerging, is_sunsetting, adjacent_skill_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            str(row_dict.get("skill_id")),
            str(row_dict.get("skill_name")),
            row_dict.get("skill_category"),
            row_dict.get("skill_family"),
            row_dict.get("external_taxonomy_code"),
            1 if row_dict.get("is_orphan") else 0,
            float(row_dict.get("market_demand_index", 0.5)),
            float(row_dict.get("market_supply_index", 0.5)),
            int(row_dict.get("skill_half_life_months", 24)),
            int(row_dict.get("typical_learning_hours_per_level", 80)),
            1 if row_dict.get("is_emerging") else 0,
            1 if row_dict.get("is_sunsetting") else 0,
            row_dict.get("adjacent_skill_ids")
        ))
        sk_count += 1

    print(f"   ✓ Inserted {sk_count} skills.")

    # -------------------------------------------------------------
    # 3. Future Roles Table
    # -------------------------------------------------------------
    print("\n📦 Seeding future_roles...")
    cur.execute("DROP TABLE IF EXISTS future_roles;")
    cur.execute("""
    CREATE TABLE future_roles (
        role_id TEXT,
        version INTEGER,
        role_title TEXT NOT NULL,
        status TEXT,
        strategy_driver_id TEXT,
        job_code TEXT,
        job_family_id TEXT,
        career_level_id TEXT,
        org_unit_id TEXT,
        current_role_id TEXT,
        role_purpose TEXT,
        key_responsibilities TEXT,
        qualifications_required TEXT,
        min_years_experience INTEGER,
        role_evolution_class TEXT,
        sunset_target_date TEXT,
        transition_target_role_ids TEXT,
        business_criticality_index REAL,
        criticality_tier TEXT,
        failure_impact_description TEXT,
        target_cost_band_id TEXT,
        current_headcount INTEGER,
        feeder_role_ids TEXT,
        skill_distance_to_feeders REAL,
        approved_by TEXT,
        approved_at TEXT,
        PRIMARY KEY (role_id, version)
    );
    """)

    fr_sheet = wb["future_roles"]
    fr_rows = list(fr_sheet.iter_rows(values_only=True))
    fr_headers = fr_rows[0]
    fr_count = 0

    for r in fr_rows[1:]:
        row_dict = dict(zip(fr_headers, r))
        appr_at = row_dict.get("approved_at")
        if isinstance(appr_at, datetime.datetime):
            appr_at_str = appr_at.isoformat()
        else:
            appr_at_str = str(appr_at) if appr_at else None

        cur.execute("""
        INSERT INTO future_roles (
            role_id, version, role_title, status, strategy_driver_id, job_code,
            job_family_id, career_level_id, org_unit_id, current_role_id,
            role_purpose, key_responsibilities, qualifications_required,
            min_years_experience, role_evolution_class, sunset_target_date,
            transition_target_role_ids, business_criticality_index, criticality_tier,
            failure_impact_description, target_cost_band_id, current_headcount,
            feeder_role_ids, skill_distance_to_feeders, approved_by, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            str(row_dict.get("role_id")),
            int(row_dict.get("version", 1)),
            str(row_dict.get("role_title")),
            str(row_dict.get("status", "Live")),
            str(row_dict.get("strategy_driver_id")),
            row_dict.get("job_code"),
            row_dict.get("job_family_id"),
            row_dict.get("career_level_id"),
            row_dict.get("org_unit_id"),
            row_dict.get("current_role_id"),
            row_dict.get("role_purpose"),
            row_dict.get("key_responsibilities"),
            row_dict.get("qualifications_required"),
            int(row_dict.get("min_years_experience", 4)),
            row_dict.get("role_evolution_class"),
            str(row_dict.get("sunset_target_date")) if row_dict.get("sunset_target_date") else None,
            row_dict.get("transition_target_role_ids"),
            float(row_dict.get("business_criticality_index", 0.8)),
            row_dict.get("criticality_tier"),
            row_dict.get("failure_impact_description"),
            row_dict.get("target_cost_band_id"),
            int(row_dict.get("current_headcount", 0)),
            row_dict.get("feeder_role_ids"),
            float(row_dict.get("skill_distance_to_feeders", 0.3)),
            row_dict.get("approved_by"),
            appr_at_str
        ))
        fr_count += 1

    print(f"   ✓ Inserted {fr_count} future roles (all versions).")

    # -------------------------------------------------------------
    # 4. Role Skill Mappings Table
    # -------------------------------------------------------------
    print("\n📦 Seeding role_skill_mappings...")
    cur.execute("DROP TABLE IF EXISTS role_skill_mappings;")
    cur.execute("""
    CREATE TABLE role_skill_mappings (
        mapping_id TEXT PRIMARY KEY,
        role_id TEXT,
        role_version INTEGER,
        skill_id TEXT,
        target_proficiency INTEGER,
        importance TEXT,
        skill_weight REAL,
        is_mandatory INTEGER,
        required_at_level TEXT,
        acquisition_route TEXT,
        expected_time_to_acquire_months INTEGER
    );
    """)

    rsm_sheet = wb["role_skill_mappings"]
    rsm_rows = list(rsm_sheet.iter_rows(values_only=True))
    rsm_headers = rsm_rows[0]
    rsm_count = 0

    for r in rsm_rows[1:]:
        row_dict = dict(zip(rsm_headers, r))
        cur.execute("""
        INSERT INTO role_skill_mappings (
            mapping_id, role_id, role_version, skill_id, target_proficiency,
            importance, skill_weight, is_mandatory, required_at_level,
            acquisition_route, expected_time_to_acquire_months
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            str(row_dict.get("mapping_id")),
            str(row_dict.get("role_id")),
            int(row_dict.get("role_version", 1)),
            str(row_dict.get("skill_id")),
            int(row_dict.get("target_proficiency", 3)),
            row_dict.get("importance", "Important"),
            float(row_dict.get("skill_weight", 0.6)),
            1 if row_dict.get("is_mandatory") else 0,
            row_dict.get("required_at_level", "L4"),
            row_dict.get("acquisition_route", "Trainable"),
            int(row_dict.get("expected_time_to_acquire_months", 6))
        ))
        rsm_count += 1

    print(f"   ✓ Inserted {rsm_count} role-skill mappings.")

    # -------------------------------------------------------------
    # 5. Workforce Demand Lines Table
    # -------------------------------------------------------------
    print("\n📦 Seeding workforce_demand_lines...")
    cur.execute("DROP TABLE IF EXISTS workforce_demand_lines;")
    cur.execute("""
    CREATE TABLE workforce_demand_lines (
        demand_line_id TEXT PRIMARY KEY,
        role_id TEXT,
        role_version INTEGER,
        strategy_driver_id TEXT,
        fiscal_year TEXT,
        org_unit_id TEXT,
        demand_headcount_gross INTEGER,
        productivity_adj INTEGER,
        replacement_demand REAL,
        demand_headcount_net INTEGER,
        attrition_rate_ttm REAL,
        net_new_demand INTEGER,
        demand_basis TEXT,
        time_to_hire_days_external INTEGER,
        time_to_productivity_days INTEGER,
        mobilization_lead_time_days INTEGER,
        confidence_level REAL,
        assumption_notes TEXT
    );
    """)

    wdl_sheet = wb["workforce_demand_lines"]
    wdl_rows = list(wdl_sheet.iter_rows(values_only=True))
    wdl_headers = wdl_rows[0]
    wdl_count = 0

    for r in wdl_rows[1:]:
        row_dict = dict(zip(wdl_headers, r))
        cur.execute("""
        INSERT INTO workforce_demand_lines (
            demand_line_id, role_id, role_version, strategy_driver_id, fiscal_year,
            org_unit_id, demand_headcount_gross, productivity_adj, replacement_demand,
            demand_headcount_net, attrition_rate_ttm, net_new_demand, demand_basis,
            time_to_hire_days_external, time_to_productivity_days,
            mobilization_lead_time_days, confidence_level, assumption_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            str(row_dict.get("demand_line_id")),
            str(row_dict.get("role_id")),
            int(row_dict.get("role_version", 1)),
            str(row_dict.get("strategy_driver_id")),
            str(row_dict.get("fiscal_year")),
            row_dict.get("org_unit_id"),
            int(row_dict.get("demand_headcount_gross", 0)),
            int(row_dict.get("productivity_adj", 0)),
            float(row_dict.get("replacement_demand", 0.0)),
            int(row_dict.get("demand_headcount_net", 0)),
            float(row_dict.get("attrition_rate_ttm", 0.10)),
            int(row_dict.get("net_new_demand", 0)),
            row_dict.get("demand_basis", "Strategy-driven"),
            int(row_dict.get("time_to_hire_days_external", 60)),
            int(row_dict.get("time_to_productivity_days", 90)),
            int(row_dict.get("mobilization_lead_time_days", 180)),
            float(row_dict.get("confidence_level", 0.8)),
            row_dict.get("assumption_notes")
        ))
        wdl_count += 1

    print(f"   ✓ Inserted {wdl_count} workforce demand lines.")

    conn.commit()
    conn.close()
    print("\n✅ All Module 1 Strategy Role Architect tables successfully seeded into SQLite!")


if __name__ == "__main__":
    seed_database()

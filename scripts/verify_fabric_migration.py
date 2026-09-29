#!/usr/bin/env python3
"""Verify the Fabric SQL Database is reachable and has the operational tables.

Writes migration_reports/fabric_health_report.json.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.database import get_db, reset_db_clients
from app.db.fabric_database import _ensure_openssl

CORE_TABLES = [
    "employees",
    "skills",
    "gamification_profiles",
    "xp_transactions",
    "achievements",
    "challenges",
    "learning_paths",
    "courses",
    "certifications",
    "career_goals",
    "career_roadmap_steps",
    "projects",
    "knowledge_sources",
    "reward_items",
    "recognitions",
    "departments",
    "organization_metrics",
    "org_innovation_ideas",
    "org_talent_gigs",
    "org_okrs",
]


def main() -> int:
    _ensure_openssl()
    reset_db_clients()
    report_dir = ROOT / "migration_reports"
    report_dir.mkdir(exist_ok=True)

    try:
        db = get_db().db
        health = db.health()
    except Exception as exc:
        message = f"Fabric connection failed ({exc.__class__.__name__})."
        print(message)
        payload = {"status": "failed", "reason": message, "tables": []}
        (report_dir / "fabric_health_report.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return 2

    if health.get("database") != "fabric":
        message = f"Not connected to live Fabric (got {health})."
        print(message)
        payload = {"status": "failed", "reason": message, "tables": []}
        (report_dir / "fabric_health_report.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return 2

    tables_out = []
    missing = 0
    for table in CORE_TABLES:
        try:
            rows = db.execute(f"SELECT COUNT_BIG(*) AS c FROM dbo.[{table}]")
            count = int(rows[0]["c"]) if rows else 0
            tables_out.append({"table": table, "rows": count, "status": "OK"})
            print(f"  {table}: {count}")
        except Exception as exc:
            missing += 1
            tables_out.append({"table": table, "rows": None, "status": f"ERROR: {exc}"})
            print(f"  {table}: ERROR {exc}")

    status = "ok" if missing == 0 else "partial"
    payload = {"status": status, "health": health, "missing_or_failed": missing, "tables": tables_out}
    (report_dir / "fabric_health_report.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\nFabric verification {status} ({len(CORE_TABLES) - missing}/{len(CORE_TABLES)} tables OK)")
    return 0 if missing == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

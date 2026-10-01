#!/usr/bin/env python3
"""Apply fabric/database/*.sql to the configured Fabric SQL Database.

Splits on GO batches. Safe to re-run: scripts use IF NOT EXISTS / IF OBJECT_ID checks.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.database import get_db, reset_db_clients
from app.db.fabric_database import _ensure_openssl

SCRIPT_ORDER = [
    "001_create_schema.sql",
    "002_create_tables.sql",
    "003_create_constraints.sql",
    "004_create_indexes.sql",
    "005_create_views.sql",
    "006_create_functions.sql",
    "007_create_procedures.sql",
]


def _batches(sql: str) -> list[str]:
    parts = re.split(r"^\s*GO\s*$", sql, flags=re.IGNORECASE | re.MULTILINE)
    out = []
    for part in parts:
        cleaned = "\n".join(
            line for line in part.splitlines()
            if not line.strip().startswith("--")
        ).strip()
        if cleaned:
            out.append(cleaned)
    return out


def main() -> int:
    _ensure_openssl()
    reset_db_clients()
    db = get_db().db
    health = db.health()
    print(f"Connected: {health}")
    if health.get("database") != "fabric":
        print("Not connected to live Fabric. Aborting.")
        return 2

    sql_dir = ROOT / "fabric" / "database"
    for name in SCRIPT_ORDER:
        path = sql_dir / name
        if not path.exists():
            print(f"Missing {path}")
            return 1
        print(f"\n=== {name} ===")
        batches = _batches(path.read_text(encoding="utf-8"))
        for i, batch in enumerate(batches, start=1):
            try:
                db.execute(batch)
                print(f"  batch {i}/{len(batches)} OK")
            except Exception as exc:
                msg = str(exc)
                # Surface the real ODBC detail for schema work
                detail = getattr(exc, "__cause__", None) or exc
                print(f"  batch {i}/{len(batches)} FAILED: {detail}")
                print(f"  SQL preview: {batch[:180]!r}")
                return 1
    print("\nSchema applied successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

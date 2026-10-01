#!/usr/bin/env python3
"""Drop and recreate the Fabric operational schema, then seed demo data.

Use when the database is empty or you intentionally want a clean Fabric reset.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.database import get_db, reset_db_clients
from app.db.fabric_database import _ensure_openssl
from apply_fabric_schema import SCRIPT_ORDER, _batches


def main() -> int:
    _ensure_openssl()
    reset_db_clients()
    db = get_db().db
    print(db.health())

    print("Dropping existing dbo tables...")
    db.execute(
        """
        DECLARE @sql NVARCHAR(MAX) = N'';
        SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
            + '.' + QUOTENAME(OBJECT_NAME(parent_object_id))
            + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
        FROM sys.foreign_keys;
        EXEC sp_executesql @sql;
        """
    )
    db.execute(
        """
        DECLARE @sql NVARCHAR(MAX) = N'';
        SELECT @sql += N'DROP TABLE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';'
        FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo');
        EXEC sp_executesql @sql;
        """
    )
    # Drop views/functions/procedures if present
    for stmt in (
        "IF OBJECT_ID(N'dbo.v_employee_skill_summary', N'V') IS NOT NULL DROP VIEW [dbo].[v_employee_skill_summary];",
        "IF OBJECT_ID(N'dbo.v_gamification_leaderboard', N'V') IS NOT NULL DROP VIEW [dbo].[v_gamification_leaderboard];",
        "IF OBJECT_ID(N'dbo.usp_database_health', N'P') IS NOT NULL DROP PROCEDURE [dbo].[usp_database_health];",
        "IF OBJECT_ID(N'dbo.fn_database_health', N'FN') IS NOT NULL DROP FUNCTION [dbo].[fn_database_health];",
    ):
        try:
            db.execute(stmt)
        except Exception:
            pass

    sql_dir = ROOT / "fabric" / "database"
    for name in SCRIPT_ORDER:
        path = sql_dir / name
        print(f"\n=== {name} ===")
        for i, batch in enumerate(_batches(path.read_text(encoding="utf-8")), start=1):
            db.execute(batch)
            print(f"  batch {i} OK")
    print("\nSchema recreated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

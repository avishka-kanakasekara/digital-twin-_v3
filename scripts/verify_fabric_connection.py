#!/usr/bin/env python3
"""Check that this process can connect to the configured database.

Exit 0 when the connection succeeds.
Exit 2 when Fabric settings are missing.
Exit 1 when the connection fails.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.config import settings
from app.database import get_db


def main() -> int:
    if settings.use_local_sqlite:
        print("Mode: development SQLite stand-in (FABRIC_LOCAL_SQLITE=true)")
    elif not settings.FABRIC_SQL_SERVER or not settings.FABRIC_SQL_DATABASE:
        print("REQUIRES FABRIC CONFIGURATION")
        print("Set FABRIC_SQL_SERVER and FABRIC_SQL_DATABASE, then authenticate with Microsoft Entra.")
        return 2
    else:
        print("Mode: Microsoft Fabric SQL Database")
    try:
        result = get_db().db.health()
    except Exception as exc:
        print(f"Connection failed: {exc}")
        print("REQUIRES FABRIC CREDENTIALS" if not settings.use_local_sqlite else "LOCAL CONNECTION FAILED")
        return 1
    print(f"status={result['status']} database={result['database']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

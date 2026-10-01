"""
Database access entry point.

Operational reads and writes go through the Fabric SQL gateway.
`get_db` is the dependency and service constructor used across the API.
"""

from __future__ import annotations

from app.db.client import Client, get_db, reset_db_clients

__all__ = ["Client", "get_db", "reset_db_clients"]

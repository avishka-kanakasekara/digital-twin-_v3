"""Shared Fabric client used by routers, services, and repositories."""

from __future__ import annotations

from app.db.fabric_database import FabricDatabase
from app.db.query import FabricClient

Client = FabricClient

_client: FabricClient | None = None


def get_db() -> FabricClient:
    global _client
    if _client is None:
        _client = FabricClient(FabricDatabase())
    return _client


def reset_db_clients() -> None:
    global _client
    if _client is not None:
        _client.db.close()
    _client = None

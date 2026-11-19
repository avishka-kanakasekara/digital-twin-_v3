"""Shared database client used by routers, services, and repositories."""

from __future__ import annotations

from app.config import settings
from app.db.supabase_database import SupabaseDatabase
from app.db.fabric_database import FabricDatabase
from app.db.query import DatabaseClient as Client

_client: Client | None = None


def get_db() -> Client | SupabaseDatabase:
    global _client
    if _client is None:
        if settings.DATABASE_PROVIDER == "supabase":
            _client = SupabaseDatabase()
        elif (settings.DATABASE_PROVIDER == "sqlite" and settings.use_local_sqlite
              and settings.ENVIRONMENT == "development"):
            _client = Client(FabricDatabase())
        else:
            raise ValueError("Use supabase, or enable SQLite explicitly in development")
    return _client


def reset_db_clients() -> None:
    global _client
    if _client is not None:
        _client.db.close()
    _client = None

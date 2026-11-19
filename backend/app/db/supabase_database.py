"""
Supabase client gateway for Digital Twin platform.

Connects to Supabase using the service role key over HTTPS (PostgREST),
bypassing RLS policies and avoiding IPv6/direct-connect routing issues.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Optional

from supabase import create_client, Client as SupabaseSdkClient
from app.config import settings
from app.db.errors import FabricDataError


class QueryResult:
    def __init__(self, data: Any = None, count: Optional[int] = None):
        if data is None:
            self.data = []
        elif isinstance(data, list):
            self.data = data
        else:
            self.data = [data]
        self.count = count


class SupabaseTableQuery:
    """Wraps postgrest-py builder to provide chainable queries matching application expectations."""

    def __init__(self, builder):
        self._builder = builder

    def select(self, columns: str = "*", count: Optional[str] = None) -> "SupabaseTableQuery":
        if count:
            return SupabaseTableQuery(self._builder.select(columns or "*", count=count))
        return SupabaseTableQuery(self._builder.select(columns or "*"))

    def insert(self, payload: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.insert(payload))

    def update(self, payload: dict) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.update(payload))

    def delete(self) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.delete())

    def upsert(self, payload: Any, on_conflict: Optional[str] = None) -> "SupabaseTableQuery":
        if on_conflict:
            return SupabaseTableQuery(self._builder.upsert(payload, on_conflict=on_conflict))
        return SupabaseTableQuery(self._builder.upsert(payload))

    def eq(self, column: str, value: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.eq(column, value))

    def neq(self, column: str, value: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.neq(column, value))

    def gt(self, column: str, value: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.gt(column, value))

    def gte(self, column: str, value: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.gte(column, value))

    def lt(self, column: str, value: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.lt(column, value))

    def lte(self, column: str, value: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.lte(column, value))

    def in_(self, column: str, values: list) -> "SupabaseTableQuery":
        if not values:
            return SupabaseTableQuery(self._builder.in_(column, ["__NO_MATCH__"]))
        return SupabaseTableQuery(self._builder.in_(column, list(values)))

    def ilike(self, column: str, pattern: str) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.ilike(column, pattern))

    def is_(self, column: str, value: Any) -> "SupabaseTableQuery":
        if value is None:
            value = "null"
        return SupabaseTableQuery(self._builder.is_(column, value))

    def order(self, column: str, desc: bool = False, **kwargs: Any) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.order(column, desc=desc))

    def limit(self, count: int) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.limit(int(count)))

    def range(self, start: int, end: int) -> "SupabaseTableQuery":
        return SupabaseTableQuery(self._builder.range(int(start), int(end)))

    def execute(self) -> QueryResult:
        try:
            res = self._builder.execute()
            return QueryResult(res.data, res.count)
        except Exception as exc:
            raise FabricDataError(f"Supabase query failed: {exc}") from exc


class SupabaseDatabase:
    dialect = "postgresql"

    def __init__(self):
        url = settings.SUPABASE_URL or "https://khrchkotgqbpzhurmbju.supabase.co"
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not key:
            raise FabricDataError("SUPABASE_SERVICE_ROLE_KEY must be configured in backend/.env")
        self._client: SupabaseSdkClient = create_client(url, key)
        self.db = self

    def table(self, name: str) -> SupabaseTableQuery:
        return SupabaseTableQuery(self._client.table(name))

    @contextmanager
    def transaction(self):
        yield

    def health(self) -> dict[str, str]:
        self.table("employees").select("id").limit(1).execute()
        return {"status": "healthy", "database": "supabase"}

    def close(self) -> None:
        pass

    def execute(self, sql: str, params: tuple = ()) -> list[dict]:
        # PostgreSQL schema warming/migrations are managed in Supabase
        return []
